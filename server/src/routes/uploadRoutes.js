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

// --- Profile Picture (Avatar) Upload ---
const avatarDir = path.join(__dirname, "../../uploads/avatars");
if (!fs.existsSync(avatarDir)) {
    fs.mkdirSync(avatarDir, { recursive: true });
}

const avatarStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, avatarDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname) || '.jpg';
        cb(null, `avatar-${req.user._id}-${Date.now()}${ext}`);
    },
});

const avatarUpload = multer({
    storage: avatarStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPG, PNG, WebP, and GIF images are allowed.'), false);
        }
    },
});

const User = require("../models/User");

router.post("/avatar", protect, avatarUpload.single("avatar"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No image uploaded" });
        }

        // Delete old avatar file if it exists
        const user = await User.findById(req.user._id);
        if (user.profilePicture) {
            const oldPath = path.join(avatarDir, user.profilePicture);
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }

        // Save new filename to user record
        user.profilePicture = req.file.filename;
        await user.save();

        res.json({
            success: true,
            profilePicture: req.file.filename,
        });
    } catch (error) {
        res.status(500).json({ message: "Avatar upload failed", error: error.message });
    }
});

module.exports = router;
