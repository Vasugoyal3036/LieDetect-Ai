const mongoose = require('mongoose');
const connectDb = async () => {
    try {
        // Skip if already connected
        if (mongoose.connection.readyState === 1) {
            return;
        }
        console.log("Attempting to connect to MongoDB...");
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log(`MongoDB connected : ${conn.connection.host}`);
    }
    catch (error) {
        console.error("MongoDB Connection Error:", error.message);
        throw error; // Don't call process.exit() on serverless
    }
};

module.exports = connectDb;