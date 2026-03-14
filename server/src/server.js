const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

const connectDB = require("./config/db");
const { limiter } = require("./middleware/rateLimiter");
const { errorHandler, notFoundHandler } = require("./middleware/errorMiddleware");

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  await connectDB();
  const app = express();

  // Security middleware
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }));

  // CORS configuration
  const allowedOrigins = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(",")
    : ["http://localhost:5173", "http://localhost:3000"];

  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Allow all in development
    },
    credentials: true,
  }));

  // Body parsing — raw body needed for Razorpay webhook verification
  app.use("/api/subscription/webhook", express.raw({ type: "application/json" }));
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  // Rate limiting
  app.use("/api/", limiter);

  // Health check
  app.get("/", (req, res) => {
    res.json({
      status: "ok",
      service: "LieDetect AI API",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
    });
  });

  // Routes
  console.log("📡 Registering routes...");
  app.use("/api/auth", require("./routes/authRoutes"));
  console.log("✓ Auth routes registered at /api/auth");
  app.use("/api/analysis", require("./routes/analysisRoutes"));
  app.use("/api/history", require("./routes/historyRoutes"));
  app.use("/api/analytics", require("./routes/analyticsRoutes"));
  app.use("/api/question-banks", require("./routes/questionBankRoutes"));
  app.use("/api/upload", require("./routes/uploadRoutes"));
  app.use("/api/reports", require("./routes/reportRoutes"));
  app.use("/api/subscription", require("./routes/subscriptionRoutes"));
  app.use("/api/team", require("./routes/teamRoutes"));
  console.log("✓ All routes registered");

  // Serve uploaded files
  const path = require("path");
  app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  app.listen(PORT, () => {
    console.log(`✅ LieDetect AI API running on port ${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || "development"}`);
  });
};

startServer().catch(err => {
  console.error("❌ Server failed to start:", err);
  process.exit(1);
});