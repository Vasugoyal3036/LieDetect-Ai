const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GoogleAIFileManager } = require("@google/generative-ai/server");
const path = require("path");
const fs = require("fs");

const API_KEY = process.env.GEMINI_API_KEY;
const genai = new GoogleGenerativeAI(API_KEY);
const fileManager = new GoogleAIFileManager(API_KEY);

const model = genai.getGenerativeModel({
  model: "gemini-1.5-flash" // Best for fast multimodal analysis
});

/**
 * Enhanced analysis that can handle text OR video/audio files
 */
async function analyzeAnswer(question, answer, antiCheat = {}, videoFilename = null) {
  try {
    let promptContext = `Question: "${question}"\n`;
    let content = [];

    // 1. If we have a video, handle multimodal analysis
    if (videoFilename) {
      const filePath = path.join(__dirname, "../../uploads", videoFilename);
      
      if (fs.existsSync(filePath)) {
        // Upload to Gemini File Manager
        const uploadResult = await fileManager.uploadFile(filePath, {
          mimeType: videoFilename.endsWith(".webm") ? "video/webm" : "video/mp4",
          displayName: "Interview Session",
        });

        // Wait for processing (Gemini needs a moment to 'watch' the file)
        let file = await fileManager.getFile(uploadResult.file.name);
        while (file.state === "PROCESSING") {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          file = await fileManager.getFile(uploadResult.file.name);
        }

        if (file.state === "FAILED") {
          throw new Error("Video processing failed in Gemini");
        }

        content.push({
          fileData: {
            mimeType: file.mimeType,
            fileUri: file.uri,
          },
        });

        promptContext += `
ANALYZE THIS VIDEO RECORDING:
1. **Transcription**: Transcribe the user's spoken answer accurately.
2. **Tone & Behavior**: Analyze the user's voice and behavior. Do they sound rehearsed? Are there suspicious pauses? Do they sound like they are reading from a script or using an AI voice changer?
3. **Compare**: Compare the spoken answer in this video with the provided text input (if any) for inconsistencies.
`;
      }
    }

    // 2. Add Anti-Cheat Context
    let antiCheatContext = '';
    if (antiCheat && Object.keys(antiCheat).length > 0) {
      const flags = [];
      if (antiCheat.tabSwitchCount > 0) flags.push(`User switched tabs ${antiCheat.tabSwitchCount} time(s)`);
      if (antiCheat.pasteAttempts > 0) flags.push(`User attempted to paste text ${antiCheat.pasteAttempts} time(s)`);
      if (antiCheat.typingSpeed > 600) flags.push(`Typing speed was ${antiCheat.typingSpeed} CPM — abnormally fast`);
      if (antiCheat.timeSpentSeconds < 10) flags.push(`Response submitted in only ${antiCheat.timeSpentSeconds}s`);

      if (flags.length > 0) {
        antiCheatContext = `\n**BEHAVIORAL RED FLAGS:**\n${flags.map(f => `- ${f}`).join('\n')}`;
      }
    }

    const mainPrompt = `
You are an advanced Interview Authenticity AI. Your goal is to detect fraud (AI generation, reading from scripts, or canned responses).

${promptContext}
User Provided Text (if any): "${answer || 'N/A'}"
${antiCheatContext}

**SCORING CRITERIA:**
- **Genuineness (0-100)**: 
  - 80-100: Natural, stuttering is fine, personal anecdotes, specific details.
  - 40-79: Rehearsed, generic, or slightly robotic.
  - 0-39: Definitely AI generated, reading from a screen (eyes moving), or flat monotone AI voice.

- **Answer Quality (0-100)**: Relevance and depth.

**INSTRUCTIONS:**
- If a video was provided, use the TRANSCRIPT you generated for the analysis.
- If the user's eyes are clearly reading from a screen or if the voice sounds monotone/AI, drop the genuineness score significantly.

Return ONLY valid JSON:
{
  "transcription": "<full transcription of the audio, if video provided>",
  "genuinenessScore": <number>,
  "bluffRisk": "<Low|Medium|High>",
  "feedback": "<detailed analysis of voice, behavior, and content>",
  "answerQualityScore": <number>,
  "suggestedAnswer": "<improved version if quality is low, else null>"
}
`;

    content.push(mainPrompt);

    const result = await model.generateContent(content);
    let text = result.response.text();

    // Clean up JSON response
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
      feedback: "AI analysis failed to process multimodal data. " + error.message,
      transcription: "Unavailable",
      answerQualityScore: 0
    };
  }
}

module.exports = analyzeAnswer;

