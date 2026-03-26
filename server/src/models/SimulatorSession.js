const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ["ai", "user"],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  // AI coaching feedback for user messages
  coaching: {
    score: { type: Number, default: null },
    strengths: [{ type: String }],
    improvements: [{ type: String }],
    tip: { type: String, default: "" },
  },
});

const simulatorSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    jobRole: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    interviewType: {
      type: String,
      enum: ["behavioral", "technical", "mixed", "case-study"],
      default: "behavioral",
    },
    messages: [messageSchema],
    questionsAsked: {
      type: Number,
      default: 0,
    },
    totalQuestions: {
      type: Number,
      default: 8,
    },
    status: {
      type: String,
      enum: ["active", "completed", "abandoned"],
      default: "active",
    },
    // Overall session scoring
    overallScore: {
      type: Number,
      default: null,
    },
    summary: {
      type: String,
      default: "",
    },
    strengths: [{ type: String }],
    areasToImprove: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("SimulatorSession", simulatorSessionSchema);
