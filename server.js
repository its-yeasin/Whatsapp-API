require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const messageRoutes = require("./routes/messageRoutes");
const statsRoutes = require("./routes/statsRoutes");
const {
  initializeFirebase,
  testConnection,
  getDatabase,
} = require("./config/firebase");

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Firebase
initializeFirebase();

// Give Firebase a moment to initialize
setTimeout(async () => {
  try {
    const isConnected = await testConnection();
    if (isConnected) {
      console.log("🔥 Firebase connection verified");
    } else {
      console.warn("⚠️ Firebase connection may be unstable");
    }
  } catch (error) {
    console.error("⚠️ Firebase connection test failed:", error.message);
  }
}, 1000);

// Security Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"],
  }),
);

// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/", limiter);

// Health Check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "WhatsApp API Backend Server",
    version: "1.0.0",
    status: "running",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", async (req, res) => {
  try {
    // Check Firebase connection
    const isConnected = await testConnection();

    res.json({
      success: true,
      status: "healthy",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      firebase: {
        connected: isConnected,
        status: isConnected ? "online" : "offline",
      },
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: "unhealthy",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      firebase: {
        connected: false,
        status: "error",
        error: error.message,
      },
    });
  }
});

// API Routes
app.use("/api/messages", messageRoutes);
app.use("/api/stats", statsRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
    path: req.path,
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║   WhatsApp API Backend Server Started     ║
╠════════════════════════════════════════════╣
║   Port: ${PORT}                              ║
║   Environment: ${process.env.NODE_ENV || "development"}              ║
║   Time: ${new Date().toLocaleString()}   ║
╚════════════════════════════════════════════╝
  `);
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(
    `📨 Send message: POST http://localhost:${PORT}/api/messages/send`,
  );
});

// Graceful Shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });
});

module.exports = app;
