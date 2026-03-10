const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
    createReport,
    getReports,
    getReport,
    getSharedReport,
    deleteReport,
    downloadPDF,
} = require("../controllers/reportController");

// Authenticated routes
router.post("/", protect, createReport);
router.get("/", protect, getReports);
router.get("/:id", protect, getReport);
router.get("/:id/pdf", protect, downloadPDF);
router.delete("/:id", protect, deleteReport);

// Public route (no auth) — must be last to avoid conflicts
router.get("/shared/:token", getSharedReport);

module.exports = router;
