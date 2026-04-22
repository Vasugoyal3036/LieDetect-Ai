const express = require("express");
const router = express.Router();
const multer = require("multer");
const protect = require("../middleware/authMiddleware");
const analyzeAnswer = require("../services/aiService");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["video/webm", "video/mp4", "audio/webm", "audio/wav"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Invalid file type."), false);
  },
});

// Practice mode — analyzes the answer but does NOT persist to the database
router.post("/analyze", protect, upload.single("video"), async (req, res) => {
  try {
    let { question, answer, antiCheat, jobDescription, jobRole } = req.body;

    if (typeof antiCheat === "string") {
      try { antiCheat = JSON.parse(antiCheat); } catch { antiCheat = {}; }
    }

    if (!question || (!answer && !req.file)) {
      return res.status(400).json({ message: "Question and either an answer or a video is required" });
    }

    const videoBuffer = req.file ? req.file.buffer : null;
    const videoMimeType = req.file ? req.file.mimetype : "video/webm";

    const aiResult = await analyzeAnswer(
      question,
      answer,
      antiCheat || {},
      videoBuffer,
      videoMimeType,
      jobDescription || "",
      jobRole || ""
    );

    // Return analysis without saving to database
    res.json({
      success: true,
      practice: true,
      analysis: {
        question,
        answer: answer || aiResult.transcription || "N/A",
        transcription: aiResult.transcription || null,
        genuinenessScore: aiResult.genuinenessScore,
        bluffRisk: aiResult.bluffRisk,
        feedback: aiResult.feedback,
        answerQualityScore: aiResult.answerQualityScore || 0,
        suggestedAnswer: aiResult.suggestedAnswer || null,
      },
    });
  } catch (error) {
    console.error("Practice analysis error:", error);
    res.status(500).json({ message: "Practice analysis failed", error: error.message });
  }
});

module.exports = router;
