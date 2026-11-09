const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");
const {
  getSummary,
  getStudents,
} = require("../controllers/studentInsightsController");

// Managers only (people waiting for approval are blocked by allowRoles).
router.get("/summary", protect, allowRoles("manager"), getSummary);
router.get("/students", protect, allowRoles("manager"), getStudents);

module.exports = router;