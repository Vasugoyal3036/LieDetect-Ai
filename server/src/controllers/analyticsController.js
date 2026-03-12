// Import Session model
const Session = require("../models/Session");

const User = require("../models/User");

// Fetch all sessions of this workspace
exports.getAnalytics = async (req, res) => {
  try {

    // Get workspace members
    const workspaceId = req.user.adminId || req.user._id;
    const teamMembers = await User.find({ $or: [{ _id: workspaceId }, { adminId: workspaceId }] }).select('_id');
    const teamIds = teamMembers.map(u => u._id);

    // Fetch all sessions
    const sessions = await Session.find({ user: { $in: teamIds } });

    // If no sessions yet
    if (sessions.length === 0) {
      return res.json({
        avgScore: 0,
        totalSessions: 0,
        bluffStats: { Low: 0, Medium: 0, High: 0 },
        latestScore: 0
      });
    }

    // Calculate average score
    const totalScore = sessions.reduce(
      (sum, s) => sum + (s.genuinenessScore || 0),
      0
    );

    const avgScore = Math.round(totalScore / sessions.length);

    // Bluff risk counts
    const bluffStats = { Low: 0, Medium: 0, High: 0 };

    sessions.forEach(s => {
      if (bluffStats[s.bluffRisk] !== undefined) {
        bluffStats[s.bluffRisk]++;
      }
    });

    // Latest session score
    const latestSession = sessions.sort(
      (a, b) => b.createdAt - a.createdAt
    )[0];

    const latestScore = latestSession.genuinenessScore;

    // Send response
    res.json({
      avgScore,
      totalSessions: sessions.length,
      bluffStats,
      latestScore
    });

  } catch (error) {
    console.error("Analytics error:", error);

    res.status(500).json({
      message: "Failed to fetch analytics"
    });
  }
};
