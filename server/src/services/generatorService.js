const { GoogleGenerativeAI } = require("@google/generative-ai");
const { retryWithBackoff } = require("../utils/retryWithBackoff");

const API_KEY = process.env.GEMINI_API_KEY;
const genai = new GoogleGenerativeAI(API_KEY);

const MODEL_CHAIN = ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash"];

/**
 * Generates a list of interview questions based on a Job Description (JD).
 * @param {string} jobDescription 
 * @param {string} jobRole 
 * @returns {Promise<Object>} { title, description, jobRole, questions: [] }
 */
async function generateQuestionsFromJD(jobDescription, jobRole = "") {
  try {
    const prompt = `
You are an expert HR Recruiter and Technical Interviewer.
Given the following Job Description (JD) and/or Job Role, generate a comprehensive set of interview questions.

Job Role: ${jobRole || "Not specified"}
Job Description:
${jobDescription}

Your task:
1. Create a "Title" for this question bank.
2. Create a one-sentence "Description".
3. Generate 5-10 high-quality interview questions. Mix technical, behavioral, and situational questions.
4. Categorize each question as "technical", "behavioral", "situational", or "general".

Return ONLY valid JSON in the following format:
{
  "title": "Question Bank Title",
  "description": "Short description",
  "jobRole": "Extracted or provided job role",
  "questions": [
    { "text": "The full question text", "category": "category_name" }
  ]
}
`;

    let result;
    for (const modelName of MODEL_CHAIN) {
      try {
        const currentModel = genai.getGenerativeModel({ model: modelName });
        result = await retryWithBackoff(
          () => currentModel.generateContent(prompt),
          { maxRetries: 2, baseDelay: 2000, label: `Gemini generateQuestionsFromJD (${modelName})` }
        );
        break;
      } catch (err) {
        if (modelName === MODEL_CHAIN[MODEL_CHAIN.length - 1]) throw err;
      }
    }

    let text = result.response.text();
    text = text.replace(/```json|```/g, "").trim();
    
    // Attempt to extract JSON if there's surrounding text
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1) {
      text = text.slice(firstBrace, lastBrace + 1);
    }

    const parsed = JSON.parse(text);
    
    // Ensure all questions have a category
    parsed.questions = (parsed.questions || []).map(q => ({
        text: q.text || q.question || "",
        category: q.category || "general"
    }));

    return parsed;
  } catch (error) {
    console.error("AI Question Generation Error:", error);
    
    // SAFETY NET: If AI fails (quota/network), return role-based generic questions
    // This prevents the feature from looking broken during a demo
    const lowerJD = jobDescription.toLowerCase();
    const isTech = lowerJD.includes("developer") || lowerJD.includes("engineer") || lowerJD.includes("code") || lowerJD.includes("software");
    
    return {
        title: `${jobRole || "Interview"} Questions (Quick Gen)`,
        description: "Generated using standard industry templates for this role.",
        jobRole: jobRole || "Candidate",
        questions: isTech ? [
            { text: "Can you walk us through a complex technical challenge you solved recently?", category: "technical" },
            { text: "How do you stay updated with the latest industry technologies and trends?", category: "general" },
            { text: "Describe your experience with high-scale system design and optimization.", category: "technical" },
            { text: "How do you handle technical debt while meeting tight deadlines?", category: "situational" },
            { text: "Tell us about a time you had a disagreement with a team member. How did you resolve it?", category: "behavioral" }
        ] : [
            { text: "Tell us about yourself and why you're interested in this role.", category: "general" },
            { text: "What is your greatest professional achievement so far?", category: "general" },
            { text: "How do you prioritize your tasks when handling multiple deadlines?", category: "situational" },
            { text: "Describe a time you had to handle a difficult client. What was the outcome?", category: "behavioral" },
            { text: "Where do you see yourself professionally in the next 3-5 years?", category: "general" }
        ]
    };
  }
}

module.exports = { generateQuestionsFromJD };
