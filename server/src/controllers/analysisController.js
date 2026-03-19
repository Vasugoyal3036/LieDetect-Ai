const Session = require("../models/Session");
const analyzeAnswer = require("../services/aiService");

exports.analyze = async (req, res) => {
  try {
    // When sent as multipart/form-data, JSON fields may come as strings
    let { question, answer, category, antiCheat, videoUrl } = req.body;

    // Parse antiCheat if it came as a string (from FormData)
    if (typeof antiCheat === "string") {
      try { antiCheat = JSON.parse(antiCheat); } catch { antiCheat = {}; }
    }

    if (!question || (!answer && !req.file)) {
      return res.status(400).json({ message: "Question and either an answer or a video is required" });
    }

    // Get video buffer from multer (if uploaded)
    const videoBuffer = req.file ? req.file.buffer : null;
    const videoMimeType = req.file ? req.file.mimetype : "video/webm";

    // Pass everything to the AI service
    const aiResult = await analyzeAnswer(question, answer, antiCheat || {}, videoBuffer, videoMimeType);

    // Build suspicious flags
    const suspiciousFlags = [];
    if (antiCheat) {
      if (antiCheat.tabSwitchCount > 0) suspiciousFlags.push(`Tab switched ${antiCheat.tabSwitchCount} time(s)`);
      if (antiCheat.pasteAttempts > 0) suspiciousFlags.push(`Paste attempted ${antiCheat.pasteAttempts} time(s)`);
      if (antiCheat.typingSpeed > 600) suspiciousFlags.push(`Unusually fast typing: ${antiCheat.typingSpeed} CPM`);
      if (antiCheat.timeSpentSeconds < 10) suspiciousFlags.push(`Very fast response: ${antiCheat.timeSpentSeconds}s`);
    }

    // Upload Video to Cloudinary
    let uploadedVideoUrl = videoUrl || "";
    if (videoBuffer) {
        const { uploadVideoBuffer } = require("../services/cloudinaryService");
        const url = await uploadVideoBuffer(videoBuffer);
        if (url) uploadedVideoUrl = url;
    }

    const session = await Session.create({
      user: req.user._id,
      question,
      answer: answer || aiResult.transcription || "No text provided",
      transcription: aiResult.transcription || "",
      feedback: aiResult.feedback,
      genuinenessScore: aiResult.genuinenessScore,
      bluffRisk: aiResult.bluffRisk,
      answerQualityScore: aiResult.answerQualityScore || 0,
      suggestedAnswer: aiResult.suggestedAnswer || "",
      category,
      tabSwitchCount: antiCheat?.tabSwitchCount || 0,
      pasteAttempts: antiCheat?.pasteAttempts || 0,
      typingSpeed: antiCheat?.typingSpeed || 0,
      timeSpentSeconds: antiCheat?.timeSpentSeconds || 0,
      suspiciousFlags,
      videoUrl: uploadedVideoUrl,
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