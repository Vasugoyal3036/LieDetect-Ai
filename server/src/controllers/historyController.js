// Import Session model (THIS WAS MISSING)
const Session = require("../models/Session");

exports.getHistory = async (req, res) => {
  try {
    const sessions = await Session.find({
      user: req.user._id
    }).sort({ createdAt: -1 });

    res.json(sessions);

  } catch (error) {
    console.error("History Fetch error:", error);
    res.status(500).json({
      message: "Failed to fetch history",
    });
  }
};
