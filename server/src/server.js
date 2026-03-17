const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

const connectDB = require("./config/db");
const { limiter } = require("./middleware/rateLimiter");
const { errorHandler, notFoundHandler } = require("./middleware/errorMiddleware");

const PORT = process.env.PORT || 5001;

const app = express();

const startServer = async () => {
  await connectDB();

  // Trust proxy - important for rate-limiting behind reverse proxy (Render, etc)
  app.set('trust proxy', 1);

  // Security middleware
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }));

  // ... (rest of the middleware and routes)
  
  // CORS configuration
  const allowedOrigins = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(",")
    : ["http://localhost:5173", "http://localhost:3000"];

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Allow all in development
    },
    credentials: true,
  }));

  app.use("/api/subscription/webhook", express.raw({ type: "application/json" }));
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use("/api/", limiter);

  app.get("/", (req, res) => {
    res.json({
      status: "ok",
      service: "LieDetect AI API",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
    });
  });

  console.log("📡 Registering routes...");
  app.use("/api/auth", require("./routes/authRoutes"));
  app.use("/api/analysis", require("./routes/analysisRoutes"));
  app.use("/api/history", require("./routes/historyRoutes"));
  app.use("/api/analytics", require("./routes/analyticsRoutes"));
  app.use("/api/question-banks", require("./routes/questionBankRoutes"));
  app.use("/api/upload", require("./routes/uploadRoutes"));
  app.use("/api/reports", require("./routes/reportRoutes"));
  app.use("/api/subscription", require("./routes/subscriptionRoutes"));
  app.use("/api/team", require("./routes/teamRoutes"));

  const path = require("path");
  app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

  app.use(notFoundHandler);
  app.use(errorHandler);

  if (process.env.NODE_ENV !== 'test' && process.env.VERCEL !== '1') {
    app.listen(PORT, () => {
      console.log(`✅ LieDetect AI API running on port ${PORT}`);
    });
  }
};

startServer().catch(err => {
  console.error("❌ Server failed to start:", err);
});

module.exports = app;