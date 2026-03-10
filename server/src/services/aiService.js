const { GoogleGenerativeAI } = require("@google/generative-ai");

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genai.getGenerativeModel({
  model: "gemini-2.5-flash"
});

async function analyzeAnswer(question, answer, antiCheat = {}) {

  // Build anti-cheat context
  let antiCheatContext = '';
  if (antiCheat && Object.keys(antiCheat).length > 0) {
    const flags = [];
    if (antiCheat.tabSwitchCount > 0) flags.push(`User switched tabs ${antiCheat.tabSwitchCount} time(s) while answering — they may have consulted AI or searched online`);
    if (antiCheat.pasteAttempts > 0) flags.push(`User attempted to paste text ${antiCheat.pasteAttempts} time(s) — blocked but still suspicious`);
    if (antiCheat.typingSpeed > 600) flags.push(`Typing speed was ${antiCheat.typingSpeed} characters/min — abnormally fast, possible hidden paste or autofill`);
    if (antiCheat.timeSpentSeconds < 10 && answer.length > 100) flags.push(`User submitted ${answer.length} characters in only ${antiCheat.timeSpentSeconds} seconds — humanly impossible for this length`);

    if (flags.length > 0) {
      antiCheatContext = `

**⚠️ BEHAVIORAL RED FLAGS DETECTED:**
${flags.map(f => `- ${f}`).join('\n')}

These behavioral signals should SIGNIFICANTLY LOWER the genuineness score. A user who switches tabs or tries to paste is very likely consulting AI or copying from a source.`;
    }
  }

  const prompt = `
You are an interview authenticity analyzer. Your goal is to distinguish between AI-GENERATED/COPY-PASTED answers and GENUINE HUMAN answers.

Question: "${question}"
Answer: "${answer}"
${antiCheatContext}

**How to detect AI-GENERATED answers (score LOW: 10-35):**
- Overly structured with perfect paragraphs and transitions
- Buzzword-heavy: "leverage", "synergy", "foster", "navigate challenges", "growth mindset", "proactive approach"
- Reads like a polished article or LinkedIn post — too smooth and professional
- Uses generic filler like "In my previous role..." without naming any actual company, person, or project
- Covers every angle perfectly — no real human answers everything so comprehensively
- Unnaturally long and thorough for a spoken response

**How to identify GENUINE HUMAN answers (score HIGH: 55-80):**
- May be short, informal, or imperfect — that's NORMAL and GOOD
- Contains personal details (even small ones) or specific situations
- Has natural casual language, slang, or conversational tone
- Might ramble slightly, go off-topic, or be a bit messy — that's authentic
- Shows real emotion: frustration, humor, uncertainty, pride
- Grammar mistakes or typos = more likely human = score HIGHER not lower

**SCORING:**
- 10-35: Almost certainly AI-generated or copy-pasted. Polished, generic, buzzword-heavy.
- 36-55: Suspicious. Could be AI-assisted or heavily rehearsed.
- 56-75: Likely genuine. Natural language, some personal details.
- 76-90: Very authentic. Specific, personal, emotionally honest, unique voice.
- 91-100: Exceptionally raw and real. Reserve for deeply personal, specific responses.

**CRITICAL RULE:** Short, simple, or casual answers should score 55-70, NOT low. Real humans don't write essays in interviews. Imperfection = authenticity.

**RISK LEVELS:**
- "High" = Score below 40
- "Medium" = Score 40-55
- "Low" = Score above 55

Return ONLY valid JSON, nothing else:
{"genuinenessScore": <number>, "bluffRisk": "<Low|Medium|High>", "feedback": "<explain what made you think it's AI or genuine, quote specific parts of the answer and also give the score for the quality of answer>"}
`;

  const response = await model.generateContent(prompt);
  let text = response.response.text();

  text = text.replace(/```json|```/g, "").trim();
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1) {
    text = text.slice(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      genuinenessScore: 60,
      bluffRisk: "Medium",
      feedback: text,
    };
  }
}

module.exports = analyzeAnswer;
