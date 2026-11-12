const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");
const {
  getHistory,
  getReport,
  getReportDetails,
  getReportStudents,
} = require("../controllers/analysisHistoryController");

// Managers only (people waiting for approval are blocked by allowRoles).
router.get("/", protect, allowRoles("manager"), getHistory);
router.get("/report/:analysisId", protect, allowRoles("manager"), getReport);
router.get("/:analysisId/details", protect, allowRoles("manager"), getReportDetails);
router.get("/:analysisId/students", protect, allowRoles("manager"), getReportStudents);

module.exports = router;