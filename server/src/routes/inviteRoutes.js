const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const multer = require("multer");

const {
    getInvites,
    createInvite,
    deleteInvite,
    getInviteByToken,
    analyzeCandidateAnswer,
    completeInterview
} = require("../controllers/inviteController");

// Use memory storage for video upload via multipart/form-data
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

// --- AUTHENTICATED ROUTES (Recruiters) ---
router.get("/", protect, getInvites);
router.post("/", protect, createInvite);
router.delete("/:id", protect, deleteInvite);

// --- PUBLIC ROUTES (Candidates accessing their magic link) ---
router.get("/public/:token", getInviteByToken);
router.post("/public/:token/analyze", upload.single("video"), analyzeCandidateAnswer);
router.post("/public/:token/complete", completeInterview);

module.exports = router;
