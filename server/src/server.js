const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

const connectDB = require("./config/db");
const { limiter } = require("./middleware/rateLimiter");
const { errorHandler, notFoundHandler } = require("./middleware/errorMiddleware");

const PORT = process.env.PORT || 5001;

const app = express();

// Trust proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// CORS configuration - MUST be before routes
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",")
  : ["http://localhost:5173", "http://localhost:3000"];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
}));

// Body parsing
app.use("/api/subscription/webhook", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use("/api/", limiter);

// DB connection promise (reused across serverless invocations)
let dbConnected = false;
app.use(async (req, res, next) => {
  if (!dbConnected) {
    await connectDB();
    dbConnected = true;
  }
  next();
});

// Health check
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "HiringSentry API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/analysis", require("./routes/analysisRoutes"));
app.use("/api/history", require("./routes/historyRoutes"));
app.use("/api/analytics", require("./routes/analyticsRoutes"));
app.use("/api/question-banks", require("./routes/questionBankRoutes"));
app.use("/api/upload", require("./routes/uploadRoutes"));
app.use("/api/reports", require("./routes/reportRoutes"));
app.use("/api/subscription", require("./routes/subscriptionRoutes"));
app.use("/api/team", require("./routes/teamRoutes"));
app.use("/api/invites", require("./routes/inviteRoutes"));
app.use("/api/simulator", require("./routes/simulatorRoutes"));

// Serve uploaded files
const path = require("path");
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Only listen when running locally (not on Vercel)
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`✅ HiringSentry API running on port ${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || "development"}`);
  });
}

module.exports = app;