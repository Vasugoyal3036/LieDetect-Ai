const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  startSession,
  respond,
  getSessions,
  getSession,
  deleteSession,
} = require("../controllers/simulatorController");

// All routes are protected
router.post("/start", protect, startSession);
router.post("/:sessionId/respond", protect, respond);
router.get("/sessions", protect, getSessions);
router.get("/sessions/:sessionId", protect, getSession);
router.delete("/sessions/:sessionId", protect, deleteSession);

module.exports = router;
