const User = require("../models/User");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

// Get all members of your workspace
exports.getTeamMembers = async (req, res) => {
    try {
        const workspaceId = req.user.adminId || req.user._id;
        
        // Find everyone belonging to this workspace
        const members = await User.find({ 
            $or: [{ _id: workspaceId }, { adminId: workspaceId }] 
        }).select("-password -twoFactorOTP -twoFactorExpires -verificationToken -resetPasswordToken");

        res.json(members);
    } catch (error) {
        console.error("Fetch team error:", error);
        res.status(500).json({ message: "Failed to fetch team members." });
    }
};

// Invite (create) a new team member
exports.inviteTeamMember = async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ message: "Only Admins can invite team members." });
        }

        const { name, email, role } = req.body;
        if (!name || !email || !role) {
            return res.status(400).json({ message: "Please provide name, email, and role." });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User with this email already exists." });
        }

        // Generate random default password and hash it
        const tempPassword = crypto.randomBytes(8).toString('hex');
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        const newMember = await User.create({
            name,
            email,
            password: hashedPassword,
            role,
            adminId: req.user._id, // Set the workspace owner
            isVerified: true, // Auto-verified since Admin invited them
        });

        // In a real app, send them an email with the temporary password here!
        res.status(201).json({ 
            message: "Team member invited successfully.", 
            member: {
                _id: newMember._id,
                name: newMember.name,
                email: newMember.email,
                role: newMember.role,
                temporaryPassword: tempPassword // We return it here to show Admin
            } 
        });

    } catch (error) {
        console.error("Invite team error:", error);
        res.status(500).json({ message: "Failed to invite team member." });
    }
};

// Delete or remove a team member
exports.removeTeamMember = async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ message: "Only Admins can remove team members." });
        }

        const memberId = req.params.id;

        // Prevent self-deletion here
        if (memberId === req.user._id.toString()) {
            return res.status(400).json({ message: "You cannot remove yourself from the workspace." });
        }

        const member = await User.findOne({ _id: memberId, adminId: req.user._id });
        if (!member) {
            return res.status(404).json({ message: "Team member not found in your workspace." });
        }

        await User.findByIdAndDelete(memberId);
        res.json({ message: "Team member removed." });

    } catch (error) {
        console.error("Remove team error:", error);
        res.status(500).json({ message: "Failed to remove team member." });
    }
};
