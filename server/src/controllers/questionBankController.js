const QuestionBank = require("../models/QuestionBank");

// Create a new question bank
exports.create = async (req, res) => {
    try {
        const { title, description, jobRole, questions, isPublic } = req.body;
        if (!title || !questions || questions.length === 0) {
            return res.status(400).json({ message: "Title and at least one question are required" });
        }
        const bank = await QuestionBank.create({
            user: req.user._id,
            title,
            description,
            jobRole,
            questions,
            isPublic,
        });
        res.status(201).json(bank);
    } catch (error) {
        res.status(500).json({ message: "Failed to create question bank", error: error.message });
    }
};

// Get all question banks for current user + public ones
exports.getAll = async (req, res) => {
    try {
        const banks = await QuestionBank.find({
            $or: [{ user: req.user._id }, { isPublic: true }],
        }).sort({ createdAt: -1 });
        res.json(banks);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch question banks", error: error.message });
    }
};

// Get a single question bank
exports.getOne = async (req, res) => {
    try {
        const bank = await QuestionBank.findById(req.params.id);
        if (!bank) return res.status(404).json({ message: "Question bank not found" });
        if (!bank.isPublic && bank.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Access denied" });
        }
        res.json(bank);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch question bank", error: error.message });
    }
};

// Update a question bank
exports.update = async (req, res) => {
    try {
        const bank = await QuestionBank.findById(req.params.id);
        if (!bank) return res.status(404).json({ message: "Question bank not found" });
        if (bank.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Access denied" });
        }
        const { title, description, jobRole, questions, isPublic } = req.body;
        bank.title = title || bank.title;
        bank.description = description !== undefined ? description : bank.description;
        bank.jobRole = jobRole !== undefined ? jobRole : bank.jobRole;
        bank.questions = questions || bank.questions;
        bank.isPublic = isPublic !== undefined ? isPublic : bank.isPublic;
        await bank.save();
        res.json(bank);
    } catch (error) {
        res.status(500).json({ message: "Failed to update question bank", error: error.message });
    }
};

// Delete a question bank
exports.remove = async (req, res) => {
    try {
        const bank = await QuestionBank.findById(req.params.id);
        if (!bank) return res.status(404).json({ message: "Question bank not found" });
        if (bank.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Access denied" });
        }
        await bank.deleteOne();
        res.json({ message: "Question bank deleted" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete question bank", error: error.message });
    }
};
