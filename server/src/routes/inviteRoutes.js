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
    completeInterview,
    batchCreateInvites
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

// CSV upload config for batch invites
const csvUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max for CSV
    fileFilter: (req, file, cb) => {
        if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
            cb(null, true);
        } else {
            cb(new Error("Only CSV files are allowed."), false);
        }
    },
});

// --- AUTHENTICATED ROUTES (Recruiters) ---
router.get("/", protect, getInvites);
router.post("/", protect, createInvite);
router.post("/batch", protect, csvUpload.single("csv"), batchCreateInvites);
router.delete("/:id", protect, deleteInvite);

// --- PUBLIC ROUTES (Candidates accessing their magic link) ---
router.get("/public/:token", getInviteByToken);
router.post("/public/:token/analyze", upload.single("video"), analyzeCandidateAnswer);
router.post("/public/:token/complete", completeInterview);

module.exports = router;

