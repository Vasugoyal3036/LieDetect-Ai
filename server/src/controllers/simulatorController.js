const SimulatorSession = require("../models/SimulatorSession");
const {
  generateFirstQuestion,
  analyzeAndContinue,
  generateSessionSummary,
} = require("../services/simulatorAiService");

/**
 * POST /api/simulator/start
 * Start a new simulator interview session
 */
exports.startSession = async (req, res) => {
  try {
    const { jobRole, difficulty, interviewType, totalQuestions } = req.body;

    if (!jobRole) {
      return res.status(400).json({ message: "Job role is required" });
    }

    // Generate the first question
    const aiResponse = await generateFirstQuestion(
      jobRole,
      difficulty || "medium",
      interviewType || "behavioral"
    );

    const fullMessage = `${aiResponse.greeting}\n\n${aiResponse.question}`;

    // Create session
    const session = await SimulatorSession.create({
      user: req.user._id,
      jobRole,
      difficulty: difficulty || "medium",
      interviewType: interviewType || "behavioral",
      totalQuestions: totalQuestions || 8,
      questionsAsked: 1,
      messages: [
        {
          role: "ai",
          content: fullMessage,
        },
      ],
    });

    res.json({
      success: true,
      session: {
        _id: session._id,
        jobRole: session.jobRole,
        difficulty: session.difficulty,
        interviewType: session.interviewType,
        totalQuestions: session.totalQuestions,
        questionsAsked: session.questionsAsked,
        status: session.status,
        messages: session.messages,
      },
    });
  } catch (error) {
    console.error("Simulator start error:", error.message);
    res.status(500).json({ message: "Failed to start simulator", error: error.message });
  }
};

/**
 * POST /api/simulator/:sessionId/respond
 * Submit an answer and get AI coaching + next question
 */
exports.respond = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { answer } = req.body;

    if (!answer || !answer.trim()) {
      return res.status(400).json({ message: "Answer is required" });
    }

    const session = await SimulatorSession.findOne({
      _id: sessionId,
      user: req.user._id,
    });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (session.status !== "active") {
      return res.status(400).json({ message: "This interview session has already ended" });
    }

    // Add user's answer to messages
    session.messages.push({
      role: "user",
      content: answer.trim(),
    });

    // Analyze answer and generate next question
    const aiResponse = await analyzeAndContinue(
      session.messages,
      session.jobRole,
      session.difficulty,
      session.interviewType,
      session.questionsAsked,
      session.totalQuestions
    );

    // Store coaching feedback on the user's message
    const userMsgIndex = session.messages.length - 1;
    session.messages[userMsgIndex].coaching = {
      score: aiResponse.coaching.score,
      strengths: aiResponse.coaching.strengths || [],
      improvements: aiResponse.coaching.improvements || [],
      tip: aiResponse.coaching.tip || "",
    };

    // Add AI response
    session.messages.push({
      role: "ai",
      content: aiResponse.nextMessage,
    });

    session.questionsAsked += 1;

    // Check if interview is complete
    if (session.questionsAsked > session.totalQuestions) {
      session.status = "completed";

      // Generate overall summary
      const summary = await generateSessionSummary(
        session.messages,
        session.jobRole,
        session.interviewType
      );

      session.overallScore = summary.overallScore;
      session.summary = summary.summary;
      session.strengths = summary.strengths || [];
      session.areasToImprove = summary.areasToImprove || [];
    }

    await session.save();

    res.json({
      success: true,
      coaching: aiResponse.coaching,
      aiMessage: aiResponse.nextMessage,
      questionsAsked: session.questionsAsked,
      isComplete: session.status === "completed",
      ...(session.status === "completed" && {
        overallScore: session.overallScore,
        summary: session.summary,
        strengths: session.strengths,
        areasToImprove: session.areasToImprove,
      }),
    });
  } catch (error) {
    console.error("Simulator respond error:", error.message);
    res.status(500).json({ message: "Failed to process response", error: error.message });
  }
};

/**
 * GET /api/simulator/sessions
 * Get all simulator sessions for the current user
 */
exports.getSessions = async (req, res) => {
  try {
    const sessions = await SimulatorSession.find({ user: req.user._id })
      .select("jobRole difficulty interviewType status questionsAsked totalQuestions overallScore createdAt")
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(sessions);
  } catch (error) {
    console.error("Simulator getSessions error:", error.message);
    res.status(500).json({ message: "Failed to fetch sessions" });
  }
};

/**
 * GET /api/simulator/sessions/:sessionId
 * Get a specific session with full conversation
 */
exports.getSession = async (req, res) => {
  try {
    const session = await SimulatorSession.findOne({
      _id: req.params.sessionId,
      user: req.user._id,
    });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    res.json(session);
  } catch (error) {
    console.error("Simulator getSession error:", error.message);
    res.status(500).json({ message: "Failed to fetch session" });
  }
};

/**
 * DELETE /api/simulator/sessions/:sessionId
 * Delete a simulator session
 */
exports.deleteSession = async (req, res) => {
  try {
    const session = await SimulatorSession.findOneAndDelete({
      _id: req.params.sessionId,
      user: req.user._id,
    });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    res.json({ success: true, message: "Session deleted" });
  } catch (error) {
    console.error("Simulator deleteSession error:", error.message);
    res.status(500).json({ message: "Failed to delete session" });
  }
};
