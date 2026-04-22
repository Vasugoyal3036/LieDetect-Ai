const InterviewInvite = require("../models/InterviewInvite");
const QuestionBank = require("../models/QuestionBank");
const Session = require("../models/Session");
const Report = require("../models/Report");
const User = require("../models/User");
const { sendInterviewInviteEmail } = require("../services/emailService");
const analyzeAnswer = require("../services/aiService");
const crypto = require("crypto");

// --- RECRUITER ROUTES (Authenticated) ---

// Get all invites for the workspace
exports.getInvites = async (req, res) => {
    try {
        const workspaceId = req.user.adminId || req.user._id;
        const invites = await InterviewInvite.find({ workspaceId })
            .populate("questionBankId", "title")
            .sort({ createdAt: -1 });

        res.json(invites);
    } catch (error) {
        console.error("Fetch invites error:", error);
        res.status(500).json({ message: "Failed to fetch invites." });
    }
};

// Create a new invite
exports.createInvite = async (req, res) => {
    try {
        const { candidateName, candidateEmail, questionBankId } = req.body;
        
        if (!candidateName || !candidateEmail) {
            return res.status(400).json({ message: "Candidate name and email are required." });
        }

        const workspaceId = req.user.adminId || req.user._id;
        const token = crypto.randomBytes(32).toString("hex");

        const invite = await InterviewInvite.create({
            recruiterId: req.user._id,
            workspaceId,
            candidateName,
            candidateEmail,
            questionBankId: questionBankId || null,
            token,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        });

        // Send Email
        await sendInterviewInviteEmail(candidateEmail, candidateName, req.user.name, token);

        res.status(201).json({ message: "Interview invitation sent successfully.", invite });
    } catch (error) {
        console.error("Create invite error:", error);
        res.status(500).json({ message: "Failed to create invitation." });
    }
};

// Delete an invite
exports.deleteInvite = async (req, res) => {
    try {
        const workspaceId = req.user.adminId || req.user._id;
        const invite = await InterviewInvite.findOne({ _id: req.params.id, workspaceId });
        
        if (!invite) return res.status(404).json({ message: "Invite not found." });

        await invite.deleteOne();
        res.json({ message: "Invitation deleted." });
    } catch (error) {
        console.error("Delete invite error:", error);
        res.status(500).json({ message: "Failed to delete invitation." });
    }
};

// --- CANDIDATE ROUTES (Public) ---

// Get invite details to start the interview
exports.getInviteByToken = async (req, res) => {
    try {
        const invite = await InterviewInvite.findOne({ token: req.params.token })
            .populate("recruiterId", "name")
            .populate("questionBankId");

        if (!invite) {
            return res.status(404).json({ message: "Invalid or expired invitation link." });
        }

        if (invite.status === "Completed") {
            return res.status(400).json({ message: "This interview has already been completed." });
        }

        if (invite.expiresAt < new Date()) {
            return res.status(400).json({ message: "This invitation link has expired." });
        }

        res.json({
            candidateName: invite.candidateName,
            recruiterName: invite.recruiterId.name,
            questionBank: invite.questionBankId || { title: "General Interview", questions: ["Tell me about yourself.", "What is your greatest strength?", "Describe a challenge you overcame."] }
        });
    } catch (error) {
        console.error("Get invite error:", error);
        res.status(500).json({ message: "Failed to load invitation details." });
    }
};

// Analyze a single answer from a candidate (Public route mapped to a token)
exports.analyzeCandidateAnswer = async (req, res) => {
    try {
        const invite = await InterviewInvite.findOne({ token: req.params.token }).populate("questionBankId");
        
        if (!invite) return res.status(404).json({ message: "Invalid invitation link." });
        if (invite.status === "Completed") return res.status(400).json({ message: "Interview already completed." });

        let { question, answer, antiCheat } = req.body;
        if (typeof antiCheat === "string") {
            try { antiCheat = JSON.parse(antiCheat); } catch { antiCheat = {}; }
        }

        const videoBuffer = req.file ? req.file.buffer : null;
        const videoMimeType = req.file ? req.file.mimetype : "video/webm";

        // Extract JD context from the question bank (if available)
        const jd = invite.questionBankId?.jobDescription || "";
        const role = invite.questionBankId?.jobRole || "";

        // Analyze using Gemini (now with JD context)
        const aiResult = await analyzeAnswer(question, answer, antiCheat || {}, videoBuffer, videoMimeType, jd, role);

        const suspiciousFlags = [];
        if (antiCheat) {
            if (antiCheat.tabSwitchCount > 0) suspiciousFlags.push(`Tab switched ${antiCheat.tabSwitchCount} time(s)`);
            if (antiCheat.pasteAttempts > 0) suspiciousFlags.push(`Paste attempted ${antiCheat.pasteAttempts} time(s)`);
            if (antiCheat.fullscreenExits > 0) suspiciousFlags.push(`Exited fullscreen ${antiCheat.fullscreenExits} time(s)`);
        }

        // Upload Video to Cloudinary
        let uploadedVideoUrl = "";
        if (videoBuffer) {
            const { uploadVideoBuffer } = require("../services/cloudinaryService");
            const url = await uploadVideoBuffer(videoBuffer);
            if (url) uploadedVideoUrl = url;
        }

        // Create Session assigned to the workspace owner, but tagged with candidate name
        const session = await Session.create({
            user: invite.workspaceId,
            question,
            answer: answer || aiResult.transcription || "No text provided",
            transcription: aiResult.transcription || "",
            feedback: aiResult.feedback,
            genuinenessScore: aiResult.genuinenessScore,
            bluffRisk: aiResult.bluffRisk,
            answerQualityScore: aiResult.answerQualityScore || 0,
            suggestedAnswer: aiResult.suggestedAnswer || "",
            category: "Candidate Invite",
            tabSwitchCount: antiCheat?.tabSwitchCount || 0,
            pasteAttempts: antiCheat?.pasteAttempts || 0,
            fullscreenExits: antiCheat?.fullscreenExits || 0,
            suspiciousFlags,
            videoUrl: uploadedVideoUrl,
        });

        // Add to invite
        invite.sessions.push(session._id);
        await invite.save();

        res.json({ success: true, analysis: session });
    } catch (error) {
        console.error("Candidate analysis error:", error);
        res.status(500).json({ message: "Analysis failed." });
    }
};

// Finish interview and create report
exports.completeInterview = async (req, res) => {
    try {
        const invite = await InterviewInvite.findOne({ token: req.params.token }).populate("sessions");
        
        if (!invite) return res.status(404).json({ message: "Invalid invitation link." });
        if (invite.sessions.length === 0) return res.status(400).json({ message: "No answers found to submit." });

        // Calculate averages for the report
        const avgScore = Math.round(invite.sessions.reduce((sum, s) => sum + s.genuinenessScore, 0) / invite.sessions.length);
        const overallRisk = avgScore < 40 ? "High" : avgScore < 56 ? "Medium" : "Low";

        // Create Report
        const report = await Report.create({
            user: invite.workspaceId, // Seen by the workspace owner
            title: `Candidate Report: ${invite.candidateName}`,
            sessions: invite.sessions.map(s => s._id),
            shareToken: crypto.randomBytes(16).toString("hex"),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            averageScore: avgScore,
            overallRisk,
        });

        // Update Invite
        invite.status = "Completed";
        invite.reportId = report._id;
        await invite.save();

        res.json({ message: "Interview completed successfully! The recruiter has been notified." });
    } catch (error) {
        console.error("Complete interview error:", error);
        res.status(500).json({ message: "Failed to finalize interview." });
    }
};

// --- BATCH CSV INVITE ---
exports.batchCreateInvites = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "CSV file is required." });
        }

        const { questionBankId } = req.body;
        const workspaceId = req.user.adminId || req.user._id;
        const csvContent = req.file.buffer.toString("utf-8");
        const lines = csvContent.split(/\r?\n/).filter(l => l.trim());

        if (lines.length < 2) {
            return res.status(400).json({ message: "CSV must have a header row and at least one candidate row." });
        }

        // Parse header to find name and email columns
        const header = lines[0].toLowerCase().split(",").map(h => h.trim());
        const nameIdx = header.findIndex(h => h.includes("name"));
        const emailIdx = header.findIndex(h => h.includes("email"));

        if (nameIdx === -1 || emailIdx === -1) {
            return res.status(400).json({ message: "CSV must have 'name' and 'email' columns in the header." });
        }

        const results = { sent: 0, failed: 0, errors: [] };

        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(",").map(c => c.trim().replace(/^"|"$/g, ""));
            const candidateName = cols[nameIdx];
            const candidateEmail = cols[emailIdx];

            if (!candidateName || !candidateEmail) {
                results.failed++;
                results.errors.push(`Row ${i + 1}: Missing name or email`);
                continue;
            }

            // Basic email validation
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidateEmail)) {
                results.failed++;
                results.errors.push(`Row ${i + 1}: Invalid email "${candidateEmail}"`);
                continue;
            }

            try {
                const token = crypto.randomBytes(32).toString("hex");
                await InterviewInvite.create({
                    recruiterId: req.user._id,
                    workspaceId,
                    candidateName,
                    candidateEmail,
                    questionBankId: questionBankId || null,
                    token,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                });

                await sendInterviewInviteEmail(candidateEmail, candidateName, req.user.name, token);
                results.sent++;
            } catch (err) {
                results.failed++;
                results.errors.push(`Row ${i + 1}: ${err.message}`);
            }
        }

        res.json({
            message: `Batch complete: ${results.sent} sent, ${results.failed} failed.`,
            ...results,
        });
    } catch (error) {
        console.error("Batch invite error:", error);
        res.status(500).json({ message: "Batch invite failed.", error: error.message });
    }
};
