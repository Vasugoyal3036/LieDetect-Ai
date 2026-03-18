const express = require("express");
const router = express.Router();
const multer = require("multer");
const protect = require("../middleware/authMiddleware");

const { analyze } = require("../controllers/analysisController");

// Use memory storage so the video buffer is available in req.file.buffer
// This works on Vercel (no disk writes needed)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (req, file, cb) => {
    const allowed = ["video/webm", "video/mp4", "audio/webm", "audio/wav"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only video/audio files are allowed."), false);
    }
  },
});

// Accept an optional video file along with JSON fields
router.post("/analyze", protect, upload.single("video"), analyze);

module.exports = router;