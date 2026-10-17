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
const aiPromptRoutes = require("./routes/aiPromptRoutes")

app.use("/api/auth", authRoutes);
app.use("/api/admin",adminRoutes);
app.use("/api/dataset",datasetRoutes);
app.use("/api/admin/ai-prompt",aiPromptRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});