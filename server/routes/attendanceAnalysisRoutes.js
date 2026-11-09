const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");
const {
  getSummary,
  getExport,
} = require("../controllers/attendanceAnalysisController");

// Managers only (people waiting for approval are blocked by allowRoles).
router.get("/summary", protect, allowRoles("manager"), getSummary);
router.get("/export", protect, allowRoles("manager"), getExport);

module.exports = router;