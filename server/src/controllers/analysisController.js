const Session = require("../models/Session");
const analyzeAnswer = require("../services/aiService");

exports.analyze = async (req, res) => {
  try {
    const { question, answer, category, antiCheat, videoUrl } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ message: "Question and answer required" });
    }

    // Pass anti-cheat metadata to AI for consideration
    const aiResult = await analyzeAnswer(question, answer, antiCheat || {});

    // Build suspicious flags
    const suspiciousFlags = [];
    if (antiCheat) {
      if (antiCheat.tabSwitchCount > 0) suspiciousFlags.push(`Tab switched ${antiCheat.tabSwitchCount} time(s)`);
      if (antiCheat.pasteAttempts > 0) suspiciousFlags.push(`Paste attempted ${antiCheat.pasteAttempts} time(s)`);
      if (antiCheat.typingSpeed > 600) suspiciousFlags.push(`Unusually fast typing: ${antiCheat.typingSpeed} CPM`);
      if (antiCheat.timeSpentSeconds < 10) suspiciousFlags.push(`Very fast response: ${antiCheat.timeSpentSeconds}s`);
    }

    const session = await Session.create({
      user: req.user._id,
      question,
      answer,
      feedback: aiResult.feedback,
      genuinenessScore: aiResult.genuinenessScore,
      bluffRisk: aiResult.bluffRisk,
      category,
      tabSwitchCount: antiCheat?.tabSwitchCount || 0,
      pasteAttempts: antiCheat?.pasteAttempts || 0,
      typingSpeed: antiCheat?.typingSpeed || 0,
      timeSpentSeconds: antiCheat?.timeSpentSeconds || 0,
      suspiciousFlags,
      videoUrl: videoUrl || "",
    });

    res.json({
      success: true,
      analysis: session,
    });
  } catch (error) {
    console.error("AI ERROR:", error.response?.data || error.message || error);
    res.status(500).json({
      message: "AI analysis failed",
      error: error.message,
    });
  }
};