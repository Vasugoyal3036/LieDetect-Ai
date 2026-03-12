const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { getTeamMembers, inviteTeamMember, removeTeamMember } = require("../controllers/teamController");

router.get("/", protect, getTeamMembers);
router.post("/invite", protect, inviteTeamMember);
router.delete("/:id", protect, removeTeamMember);

module.exports = router;
