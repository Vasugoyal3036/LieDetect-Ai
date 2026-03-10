// Import User model
const User = require("../models/User");

// For password hashing
const bcrypt = require("bcryptjs");

// For token generation
const jwt = require("jsonwebtoken");


// Function to generate JWT token
const generateToken = (id) => {
  return jwt.sign(
    { id }, // payload
    process.env.JWT_SECRET, // secret key
    { expiresIn: "7d" } // token validity
  );
};


// ---------------- SIGNUP ----------------
exports.signup = async (req, res) => {
  try {
    // Get data from request body
    const { name, email, password } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "User already exists" });

    // Hash password before storing
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    // Send response with token
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: "Signup failed" });
  }
};


// ---------------- LOGIN ----------------
exports.login = async (req, res) => {
  try {
    // Get credentials
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });

    // Compare password with hashed password
    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    res.status(500).json({ message: "Login failed" });
  }
};
