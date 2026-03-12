// Import Session model (THIS WAS MISSING)
const Session = require("../models/Session");

const User = require("../models/User");

exports.getHistory = async (req, res) => {
  try {
    const workspaceId = req.user.adminId || req.user._id;
    const teamMembers = await User.find({ $or: [{ _id: workspaceId }, { adminId: workspaceId }] }).select('_id');
    const teamIds = teamMembers.map(u => u._id);

    const sessions = await Session.find({
      user: { $in: teamIds }
    })
    .populate("user", "name email role")
    .sort({ createdAt: -1 });

    res.json(sessions);

  } catch (error) {
    console.error("History Fetch error:", error);
    res.status(500).json({
      message: "Failed to fetch history",
    });
  }
};
