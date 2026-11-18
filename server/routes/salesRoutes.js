const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");
const {
  getSummary,
  getFeesDue,
  getFeesPaid,
  getExport,
} = require("../controllers/salesController");

// Approved SALES people only. Managers use their own pages, and people
// waiting for approval are blocked by allowRoles.
const salesOnly = [protect, allowRoles("sales")];

router.get("/summary", salesOnly, getSummary);
router.get("/fees-due", salesOnly, getFeesDue);
router.get("/fees-paid", salesOnly, getFeesPaid);
router.get("/export", salesOnly, getExport);

module.exports = router;