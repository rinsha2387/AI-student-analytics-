
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();

const app = express();

// Middleware
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",").map((url) => url.trim())
  : ["http://localhost:5173"];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "AI Student Analytics API is running",
  });
});

// Authentication
const protect = require("./middleware/authMiddleware");
const { getMe } = require("./controllers/authController");

app.get("/api/auth/me", protect, getMe);

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/dataset", require("./routes/datasetRoutes"));
app.use("/api/admin/ai-prompt", require("./routes/aiPromptRoutes"));
app.use("/api/analysis", require("./routes/analysisRoutes"));
app.use("/api/admin/ai-config", require("./routes/aiConfigurationRoutes"));
app.use("/api/admin/analysis-config", require("./routes/analysisConfigurationRoutes"));
app.use("/api/team", require("./routes/teamRoutes"));
app.use("/api/student-insights", require("./routes/studentInsightRoutes"));
app.use("/api/attendance-analytics", require("./routes/attendanceAnalysisRoutes"));
app.use("/api/behavior-insights", require("./routes/behaviorInsightRoutes"));
app.use("/api/financial-impact", require("./routes/financialImpactRoutes"));
app.use("/api/analysis-history", require("./routes/analysisHistoryRoutes"));
app.use("/api/settings", require("./routes/settingsRoutes"));
app.use("/api/sales", require("./routes/salesRoutes"));

// Start server after database connection
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
