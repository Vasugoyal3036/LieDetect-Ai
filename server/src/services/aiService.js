const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GoogleAIFileManager } = require("@google/generative-ai/server");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { retryWithBackoff } = require("../utils/retryWithBackoff");

const API_KEY = process.env.GEMINI_API_KEY;
const genai = new GoogleGenerativeAI(API_KEY);
const fileManager = new GoogleAIFileManager(API_KEY);

// Fallback model chain — try in order if previous model is overloaded
const MODEL_CHAIN = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];

/**
 * Multimodal analysis — accepts text and/or a video buffer.
 * @param {string} question
 * @param {string} answer - typed answer (can be empty if video-only)
 * @param {Object} antiCheat
 * @param {Buffer|null} videoBuffer - raw video buffer from multer memoryStorage
 * @param {string} videoMimeType - e.g. "video/webm"
 * @param {string} jobDescription - optional JD for role-specific evaluation
 * @param {string} jobRole - optional job role title
 */
async function analyzeAnswer(question, answer, antiCheat = {}, videoBuffer = null, videoMimeType = "video/webm", jobDescription = "", jobRole = "") {
  try {
    let content = [];
    let videoInstructions = "";

    // ── 1. If we have a video buffer, upload it to Gemini ──
    if (videoBuffer && videoBuffer.length > 0) {
      // Write buffer to a temp file (GoogleAIFileManager needs a file path)
      const tmpDir = os.tmpdir();
      const ext = videoMimeType.includes("mp4") ? ".mp4" : ".webm";
      const tmpFile = path.join(tmpDir, `hiringsentry-${Date.now()}${ext}`);
      fs.writeFileSync(tmpFile, videoBuffer);

      try {
        const uploadResult = await fileManager.uploadFile(tmpFile, {
          mimeType: videoMimeType,
          displayName: "Interview Recording",
        });

        // Wait for Gemini to process the file
        let file = await fileManager.getFile(uploadResult.file.name);
        let retries = 0;
        while (file.state === "PROCESSING" && retries < 30) {
          await new Promise((r) => setTimeout(r, 2000));
          file = await fileManager.getFile(uploadResult.file.name);
          retries++;
        }

        if (file.state === "ACTIVE") {
          content.push({
            fileData: {
              mimeType: file.mimeType,
              fileUri: file.uri,
            },
          });

          videoInstructions = `
IMPORTANT — A VIDEO/AUDIO RECORDING IS ATTACHED. You MUST:
1. **Transcribe**: Provide the full transcription of the spoken answer.
2. **Voice Analysis**: Note if the voice sounds natural, nervous, monotone (AI-like), or if they appear to be reading from a screen.
3. **Behavior**: If video shows face, note eye movement, reading behavior, or multiple people.
4. **Cross-reference**: Compare the spoken words with the typed text (if any) for inconsistencies.
`;
        } else {
          console.error("Gemini file processing failed. State:", file.state);
        }
      } finally {
        // Clean up temp file
        try { fs.unlinkSync(tmpFile); } catch (_) {}
      }
    }

    // ── 2. Build anti-cheat context ──
    let antiCheatContext = "";
    if (antiCheat && Object.keys(antiCheat).length > 0) {
      const flags = [];
      if (antiCheat.tabSwitchCount > 0) flags.push(`User switched tabs ${antiCheat.tabSwitchCount} time(s)`);
      if (antiCheat.pasteAttempts > 0) flags.push(`User attempted to paste text ${antiCheat.pasteAttempts} time(s)`);
      if (antiCheat.typingSpeed > 600) flags.push(`Typing speed was ${antiCheat.typingSpeed} CPM — abnormally fast`);
      if (antiCheat.timeSpentSeconds < 10) flags.push(`Response submitted in only ${antiCheat.timeSpentSeconds}s`);
      if (antiCheat.fullscreenExits > 0) flags.push(`Candidate exited fullscreen ${antiCheat.fullscreenExits} time(s) — possible reference to external material`);

      if (flags.length > 0) {
        antiCheatContext = `\n**BEHAVIORAL RED FLAGS:**\n${flags.map((f) => `- ${f}`).join("\n")}`;
      }
    }

    // ── 3. Build JD context ──
    let jdContext = "";
    if (jobDescription || jobRole) {
      jdContext = `\n**JOB CONTEXT:**`;
      if (jobRole) jdContext += `\nRole: ${jobRole}`;
      if (jobDescription) jdContext += `\nJob Description:\n${jobDescription.substring(0, 2000)}`;
      jdContext += `\n\n**ROLE-SPECIFIC EVALUATION:** You MUST evaluate the answer with the above JD in mind:
- Does the candidate demonstrate skills/experience relevant to this specific role?
- Are their examples aligned with the responsibilities described in the JD?
- Would this answer impress a hiring manager for THIS particular position?
- Factor role-relevance into both genuineness (are they fabricating expertise?) and quality scores.`;
    }

    // ── 4. Build the prompt ──
    const mainPrompt = `
You are an advanced Interview Authenticity AI. You detect fraud (AI-generated answers, reading from scripts, copy-paste, or canned responses).

Question: "${question}"
User Typed Text: "${answer || "N/A"}"
${videoInstructions}
${antiCheatContext}
${jdContext}

**GENUINENESS SCORING (0-100):**
- 80-100: Natural, personal anecdotes, specific details, casual language. Stuttering and imperfections are GOOD.
- 55-79: Mostly genuine but slightly rehearsed or generic.
- 40-54: Suspicious — could be AI-assisted, heavily rehearsed, or reading from a script.
- 0-39: Definitely AI-generated, flat monotone voice, or clearly reading from a screen.

**CRITICAL RULE:** Short, informal, or imperfect answers should score 55-75. Real humans don't write essays.

**RISK LEVELS:**
- "High" = Score below 40
- "Medium" = Score 40-55
- "Low" = Score above 55

**ANSWER QUALITY SCORING (0-100):**
- Relevance (0-25): How relevant is the answer to the question${jobRole ? ` and the ${jobRole} role` : ""}?
- Depth (0-25): How detailed and thorough is the response?
- Clarity (0-25): How well-structured and articulate is the communication?
- Impact (0-25): Does the answer demonstrate measurable results or clear value?

**SUGGESTED ANSWER:**
If answerQualityScore < 75, provide a concise (3-5 sentence) model answer${jobRole ? ` tailored to the ${jobRole} role` : ""}. Otherwise set to null.

Return ONLY valid JSON, nothing else:
{
  "transcription": "<full transcription of spoken answer if video was provided, otherwise null>",
  "genuinenessScore": <number>,
  "bluffRisk": "<Low|Medium|High>",
  "feedback": "<detailed analysis explaining your reasoning${jobRole ? ", including role-specific observations" : ""}>",
  "answerQualityScore": <number>,
  "suggestedAnswer": "<model answer if quality < 75, otherwise null>"
}
`;

    content.push(mainPrompt);

    // ── 5. Call Gemini with fallback model chain ──
    let result;
    for (const modelName of MODEL_CHAIN) {
      try {
        const currentModel = genai.getGenerativeModel({ model: modelName });
        result = await retryWithBackoff(
          () => currentModel.generateContent(content),
          { maxRetries: 2, baseDelay: 2000, label: `Gemini analyzeAnswer (${modelName})` }
        );
        console.log(`[AI Service] Success with model: ${modelName}`);
        break; // Success — stop trying other models
      } catch (modelError) {
        console.warn(`[AI Service] Model ${modelName} failed: ${modelError.message}`);
        if (modelName === MODEL_CHAIN[MODEL_CHAIN.length - 1]) {
          throw modelError; // Last model also failed — rethrow
        }
        console.log(`[AI Service] Falling back to next model...`);
      }
    }
    let text = result.response.text();

    // Clean up JSON
    text = text.replace(/```json|```/g, "").trim();
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1) {
      text = text.slice(firstBrace, lastBrace + 1);
    }

    return JSON.parse(text);
  } catch (error) {
    console.error("Multimodal AI Service Error:", error);
    return {
      genuinenessScore: 50,
      bluffRisk: "Medium",
      feedback: "AI analysis encountered an error: " + error.message,
      transcription: null,
      answerQualityScore: 0,
      suggestedAnswer: null,
    };
  }
}

module.exports = analyzeAnswer;
