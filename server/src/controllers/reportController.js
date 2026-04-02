const Report = require("../models/Report");
const Session = require("../models/Session");
const User = require("../models/User");
const PDFDocument = require("pdfkit");
const crypto = require("crypto");

// Generate a report from selected sessions
exports.createReport = async (req, res) => {
    try {
        const { sessionIds, title } = req.body;
        if (!sessionIds || sessionIds.length === 0) {
            return res.status(400).json({ message: "At least one session is required" });
        }

        const workspaceId = req.user.adminId || req.user._id;
        const teamMembers = await User.find({ $or: [{ _id: workspaceId }, { adminId: workspaceId }] }).select('_id');
        const teamIds = teamMembers.map(u => u._id);

        const sessions = await Session.find({
            _id: { $in: sessionIds },
            user: { $in: teamIds },
        });

        if (sessions.length === 0) {
            return res.status(404).json({ message: "No sessions found" });
        }

        const avgScore = Math.round(sessions.reduce((sum, s) => sum + s.genuinenessScore, 0) / sessions.length);
        const overallRisk = avgScore < 40 ? "High" : avgScore < 56 ? "Medium" : "Low";

        const report = await Report.create({
            user: req.user._id,
            title: title || "Interview Report",
            sessions: sessionIds,
            shareToken: crypto.randomUUID(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            averageScore: avgScore,
            overallRisk,
        });

        await report.populate("sessions");
        res.status(201).json(report);
    } catch (error) {
        res.status(500).json({ message: "Failed to create report", error: error.message });
    }
};

// Get all reports for current workspace
exports.getReports = async (req, res) => {
    try {
        const workspaceId = req.user.adminId || req.user._id;
        const teamMembers = await User.find({ $or: [{ _id: workspaceId }, { adminId: workspaceId }] }).select('_id');
        const teamIds = teamMembers.map(u => u._id);

        const reports = await Report.find({ user: { $in: teamIds } })
            .sort({ createdAt: -1 })
            .populate("sessions");
        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch reports", error: error.message });
    }
};

// Get a single report by ID (authenticated)
exports.getReport = async (req, res) => {
    try {
        const workspaceId = req.user.adminId || req.user._id;
        const teamMembers = await User.find({ $or: [{ _id: workspaceId }, { adminId: workspaceId }] }).select('_id');
        const teamIds = teamMembers.map(u => u._id.toString());

        const report = await Report.findById(req.params.id).populate("sessions");
        if (!report) return res.status(404).json({ message: "Report not found" });

        if (!teamIds.includes(report.user.toString())) {
            return res.status(403).json({ message: "Access denied: Report not in your workspace" });
        }
        res.json(report);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch report", error: error.message });
    }
};

// Get a shared report by token (public, no auth)
exports.getSharedReport = async (req, res) => {
    try {
        const report = await Report.findOne({ shareToken: req.params.token })
            .populate("sessions")
            .populate("user", "name");
        if (!report) return res.status(404).json({ message: "Report not found or link expired" });
        if (report.expiresAt && new Date() > report.expiresAt) {
            return res.status(410).json({ message: "This report link has expired" });
        }
        report.viewCount += 1;
        await report.save();
        res.json(report);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch shared report", error: error.message });
    }
};

// Delete a report
exports.deleteReport = async (req, res) => {
    try {
        const workspaceId = req.user.adminId || req.user._id;
        const teamMembers = await User.find({ $or: [{ _id: workspaceId }, { adminId: workspaceId }] }).select('_id');
        const teamIds = teamMembers.map(u => u._id.toString());

        const report = await Report.findById(req.params.id);
        if (!report) return res.status(404).json({ message: "Report not found" });

        if (!teamIds.includes(report.user.toString())) {
            return res.status(403).json({ message: "Access denied" });
        }
        await report.deleteOne();
        res.json({ message: "Report deleted" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete report", error: error.message });
    }
};

// Generate PDF for a report
exports.downloadPDF = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id)
            .populate("sessions")
            .populate("user", "name email");
        if (!report) return res.status(404).json({ message: "Report not found" });

        const doc = new PDFDocument({ margin: 50, size: "A4" });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${report.title.replace(/[^a-z0-9]/gi, '_')}.pdf"`);
        doc.pipe(res);

        // Header
        doc.fontSize(24).fillColor("#6366f1").text("HiringSentry", { align: "center" });
        doc.moveDown(0.3);
        doc.fontSize(16).fillColor("#333").text(report.title, { align: "center" });
        doc.moveDown(0.3);
        doc.fontSize(10).fillColor("#888").text(`Generated: ${new Date().toLocaleDateString()} | Candidate: ${report.user?.name || "N/A"}`, { align: "center" });
        doc.moveDown(0.5);

        // Divider
        doc.strokeColor("#e0e0e0").lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
        doc.moveDown(0.5);

        // Summary
        const riskColor = report.overallRisk === "Low" ? "#10b981" : report.overallRisk === "Medium" ? "#f59e0b" : "#ef4444";
        doc.fontSize(14).fillColor("#333").text("Summary", { underline: true });
        doc.moveDown(0.3);
        doc.fontSize(11).fillColor("#555");
        doc.text(`Average Genuineness Score: ${report.averageScore}/100`);
        doc.text(`Overall Risk Level: ${report.overallRisk}`);
        doc.text(`Total Questions Analyzed: ${report.sessions.length}`);
        doc.text(`Report Views: ${report.viewCount}`);
        doc.moveDown(1);

        // Sessions
        doc.fontSize(14).fillColor("#333").text("Detailed Analysis", { underline: true });
        doc.moveDown(0.5);

        report.sessions.forEach((session, idx) => {
            // Check if we need a new page
            if (doc.y > 650) doc.addPage();

            const sRisk = session.bluffRisk === "Low" ? "#10b981" : session.bluffRisk === "Medium" ? "#f59e0b" : "#ef4444";

            doc.fontSize(12).fillColor("#6366f1").text(`Question ${idx + 1}`, { underline: true });
            doc.moveDown(0.2);
            doc.fontSize(10).fillColor("#333").text(session.question, { indent: 10 });
            doc.moveDown(0.3);

            doc.fontSize(10).fillColor("#555").text("Answer:", { continued: true }).fillColor("#333").text(` ${session.answer.substring(0, 500)}${session.answer.length > 500 ? '...' : ''}`, { indent: 10 });
            doc.moveDown(0.3);

            doc.fontSize(10);
            doc.fillColor("#555").text(`Score: `, { continued: true }).fillColor("#333").text(`${session.genuinenessScore}/100`, { continued: true });
            doc.fillColor("#555").text(`  |  Risk: `, { continued: true }).fillColor(sRisk).text(session.bluffRisk);
            doc.moveDown(0.2);

            if (session.suspiciousFlags && session.suspiciousFlags.length > 0) {
                doc.fillColor("#ef4444").fontSize(9).text(`⚠ Flags: ${session.suspiciousFlags.join(", ")}`, { indent: 10 });
                doc.moveDown(0.2);
            }

            if (session.feedback) {
                doc.fillColor("#555").fontSize(9).text(`AI Feedback: ${session.feedback.substring(0, 300)}${session.feedback.length > 300 ? '...' : ''}`, { indent: 10 });
            }

            doc.moveDown(0.8);
            doc.strokeColor("#eee").lineWidth(0.5).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
            doc.moveDown(0.5);
        });

        // Footer
        doc.moveDown(1);
        doc.fontSize(8).fillColor("#aaa").text("This report was generated by HiringSentry. Results are AI-powered estimates and should not be used as the sole basis for hiring decisions.", { align: "center" });

        doc.end();
    } catch (error) {
        res.status(500).json({ message: "Failed to generate PDF", error: error.message });
    }
};
