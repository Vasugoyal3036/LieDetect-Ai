const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  question: {
    type: String,
    required: true,
  },

  answer: {
    type: String,
    required: true,
  },
  feedback: {
    type: String,
  },
  genuinenessScore: {
    type: Number,
    default: 0,
  },
  bluffRisk: {
    type: String,
    default: "Low",
  },
  category: {
    type: String,
  },
  // Anti-cheat metadata
  tabSwitchCount: {
    type: Number,
    default: 0,
  },
  pasteAttempts: {
    type: Number,
    default: 0,
  },
  typingSpeed: {
    type: Number, // characters per minute
    default: 0,
  },
  timeSpentSeconds: {
    type: Number,
    default: 0,
  },
  suspiciousFlags: [{
    type: String,
  }],
  videoUrl: {
    type: String,
    default: "",
  },
},
  { timestamps: true }
);

module.exports = mongoose.model("Session", sessionSchema);
