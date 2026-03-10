const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const protect = require("../middleware/authMiddleware");

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname) || '.webm'}`;
        cb(null, uniqueName);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
    fileFilter: (req, file, cb) => {
        const allowed = ['video/webm', 'video/mp4', 'audio/webm', 'audio/wav', 'audio/mp3'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only video/audio files are allowed.'), false);
        }
    },
});

// Upload video/audio for a session
router.post("/video", protect, upload.single("video"), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }
        res.json({
            success: true,
            filePath: req.file.filename,
            size: req.file.size,
        });
    } catch (error) {
        res.status(500).json({ message: "Upload failed", error: error.message });
    }
});

module.exports = router;
