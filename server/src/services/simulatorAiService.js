const { GoogleGenerativeAI } = require("@google/generative-ai");
const { retryWithBackoff } = require("../utils/retryWithBackoff");

const API_KEY = process.env.GEMINI_API_KEY;
const genai = new GoogleGenerativeAI(API_KEY);

// Fallback model chain — try in order if previous model is overloaded
const MODEL_CHAIN = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];

/**
 * Try generating content with fallback model chain
 */
async function generateWithFallback(prompt, label) {
  for (const modelName of MODEL_CHAIN) {
    try {
      const currentModel = genai.getGenerativeModel({ model: modelName });
      const result = await retryWithBackoff(
        () => currentModel.generateContent(prompt),
        { maxRetries: 2, baseDelay: 2000, label: `${label} (${modelName})` }
      );
      console.log(`[Simulator AI] Success with model: ${modelName}`);
      return result;
    } catch (modelError) {
      console.warn(`[Simulator AI] Model ${modelName} failed: ${modelError.message}`);
      if (modelName === MODEL_CHAIN[MODEL_CHAIN.length - 1]) {
        throw modelError; // Last model also failed — rethrow
      }
      console.log(`[Simulator AI] Falling back to next model...`);
    }
  }
}

/**
 * Generate the first interview question based on job role, difficulty, and type
 */
async function generateFirstQuestion(jobRole, difficulty, interviewType) {
  const prompt = `You are a professional interview simulator AI acting as an experienced interviewer.

**Role:** Senior interviewer conducting a ${interviewType} interview for the role: "${jobRole}"
**Difficulty:** ${difficulty}
**Tone:** Professional but conversational. Make the candidate feel comfortable at the start.

Generate an opening greeting (1-2 sentences) and your FIRST interview question. The question should be appropriate for a ${difficulty} level ${interviewType} interview for the "${jobRole}" role.

${getTypeInstructions(interviewType)}

Return ONLY valid JSON:
{
  "greeting": "<a brief, warm opening greeting>",
  "question": "<your first interview question>"
}`;

  try {
    const result = await generateWithFallback(prompt, "Simulator firstQuestion");
    let text = result.response.text().replace(/```json|```/g, "").trim();
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1) {
      text = text.slice(firstBrace, lastBrace + 1);
    }
    return JSON.parse(text);
  } catch (error) {
    console.error("Simulator AI Error (first question):", error.message);
    return {
      greeting: `Welcome! I'll be your interviewer today for the ${jobRole} position. Let's get started.`,
      question: "Could you tell me about yourself and what interests you about this role?",
    };
  }
}

/**
 * Analyze user's answer and generate the next question with coaching feedback
 */
async function analyzeAndContinue(conversationHistory, jobRole, difficulty, interviewType, questionsAsked, totalQuestions) {
  const isLastQuestion = questionsAsked >= totalQuestions;

  const conversationText = conversationHistory
    .map((m) => `${m.role === "ai" ? "Interviewer" : "Candidate"}: ${m.content}`)
    .join("\n\n");

  const prompt = `You are a professional interview simulator AI acting as an experienced interviewer.

**Role:** Senior interviewer conducting a ${interviewType} interview for the role: "${jobRole}"
**Difficulty:** ${difficulty}
**Interview Progress:** Question ${questionsAsked} of ${totalQuestions}
${isLastQuestion ? "**This is the FINAL question. DO NOT ask another question. Wrap up the interview.**" : ""}

**Conversation so far:**
${conversationText}

**Your tasks:**
1. **Coach the candidate's LAST answer** — provide brief, actionable feedback:
   - Score the answer 0-100
   - List 1-2 strengths (what they did well)
   - List 1-2 improvements (what could be better)
   - Give a brief practical tip

2. ${isLastQuestion
      ? `**Wrap up the interview** — Thank the candidate professionally and provide closing remarks. Do NOT ask another question.`
      : `**Ask the NEXT question** — It should:
   - Logically follow from the conversation
   - Sometimes be a follow-up/probe on their last answer
   - Be appropriate for ${difficulty} difficulty
   - ${questionsAsked > 2 ? "Vary the topic from previous questions" : "Build on the conversation naturally"}`
    }

${getTypeInstructions(interviewType)}

Return ONLY valid JSON:
{
  "coaching": {
    "score": <number 0-100>,
    "strengths": ["<strength1>", "<strength2>"],
    "improvements": ["<improvement1>", "<improvement2>"],
    "tip": "<brief actionable tip>"
  },
  "nextMessage": "<your response as the interviewer — include acknowledgment of their answer + ${isLastQuestion ? "closing remarks" : "your next question"}>"
}`;

  try {
    const result = await generateWithFallback(prompt, "Simulator analyzeAndContinue");
    let text = result.response.text().replace(/```json|```/g, "").trim();
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1) {
      text = text.slice(firstBrace, lastBrace + 1);
    }
    return JSON.parse(text);
  } catch (error) {
    console.error("Simulator AI Error (continue):", error.message);
    return {
      coaching: {
        score: 60,
        strengths: ["Provided a response"],
        improvements: ["Consider elaborating with specific examples"],
        tip: "Use the STAR method to structure your answers.",
      },
      nextMessage: isLastQuestion
        ? "Thank you for your time today. This concludes our interview. We'll be in touch soon with the results."
        : "That's a good point. Let me ask you: Can you tell me about a challenging situation you've faced professionally and how you handled it?",
    };
  }
}

/**
 * Generate overall session summary
 */
async function generateSessionSummary(conversationHistory, jobRole, interviewType) {
  const conversationText = conversationHistory
    .map((m) => `${m.role === "ai" ? "Interviewer" : "Candidate"}: ${m.content}`)
    .join("\n\n");

  const prompt = `You are an expert interview coach. Analyze this complete interview session and provide a comprehensive summary.

**Role interviewed for:** ${jobRole}
**Interview type:** ${interviewType}

**Full conversation:**
${conversationText}

Provide an overall assessment. Return ONLY valid JSON:
{
  "overallScore": <number 0-100>,
  "summary": "<2-3 sentence overall assessment>",
  "strengths": ["<key strength 1>", "<key strength 2>", "<key strength 3>"],
  "areasToImprove": ["<area 1>", "<area 2>", "<area 3>"]
}`;

  try {
    const result = await generateWithFallback(prompt, "Simulator sessionSummary");
    let text = result.response.text().replace(/```json|```/g, "").trim();
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1) {
      text = text.slice(firstBrace, lastBrace + 1);
    }
    return JSON.parse(text);
  } catch (error) {
    console.error("Simulator AI Error (summary):", error.message);
    return {
      overallScore: 60,
      summary: "The interview session has been completed. Review individual question scores for detailed feedback.",
      strengths: ["Completed the full interview", "Engaged with questions"],
      areasToImprove: ["Practice using the STAR method", "Provide more specific examples"],
    };
  }
}

function getTypeInstructions(type) {
  switch (type) {
    case "behavioral":
      return `**Behavioral Interview Focus:**
- Use STAR-based questions (Situation, Task, Action, Result)
- Ask about past experiences, teamwork, leadership, conflict resolution
- Probe for specific examples and outcomes`;
    case "technical":
      return `**Technical Interview Focus:**
- Ask about system design, algorithms, coding concepts
- Include problem-solving scenarios relevant to the role
- Test depth of knowledge and ability to explain complex topics`;
    case "case-study":
      return `**Case Study Interview Focus:**
- Present realistic business scenarios
- Ask the candidate to analyze, strategize, and propose solutions
- Test analytical thinking and structured problem-solving`;
    case "mixed":
    default:
      return `**Mixed Interview Focus:**
- Combine behavioral and technical questions
- Test both soft skills and domain knowledge
- Include situational judgment scenarios`;
  }
}

module.exports = {
  generateFirstQuestion,
  analyzeAndContinue,
  generateSessionSummary,
};
