const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const app = express();

dotenv.config();
connectDB();
app.use(cors());
app.use(express.json());

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const datasetRoutes = require("./routes/datasetRoutes");
const aiPromptRoutes = require("./routes/aiPromptRoutes");
const analysisRoutes = require("./routes/analysisRoutes");
const aiConfigurationRoutes = require("./routes/aiConfigurationRoutes");
const analysisConfigurationRoutes = require("./routes/analysisConfigurationRoutes");
const attendanceAnalysisRoutes = require("./routes/attendanceAnalysisRoutes");
const teamRoutes = require("./routes/teamRoutes");
const studentInsightRoutes = require("./routes/studentInsightRoutes");
const behaviorInsightRoutes = require("./routes/behaviorInsightRoutes");
const financialImpactRoutes = require("./routes/financialImpactRoutes");
const analysisHistoryRoutes = require("./routes/analysisHistoryRoutes");

// Used by the waiting page and the app to read the CURRENT role and status.
// It must come before app.use("/api/auth", authRoutes).
const protect = require("./middleware/authMiddleware");
const { getMe } = require("./controllers/authController");

app.get("/api/auth/me", protect, getMe);

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/dataset", datasetRoutes);
app.use("/api/admin/ai-prompt", aiPromptRoutes);
app.use("/api/analysis", analysisRoutes);
app.use("/api/admin/ai-config", aiConfigurationRoutes);
app.use("/api/admin/analysis-config", analysisConfigurationRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/student-insights", studentInsightRoutes);
app.use("/api/attendance-analytics", attendanceAnalysisRoutes);
app.use("/api/behavior-insights", behaviorInsightRoutes);
app.use("/api/financial-impact" , financialImpactRoutes);
app.use("/api/analysis-history" , analysisHistoryRoutes)

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});