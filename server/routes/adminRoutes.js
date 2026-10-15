const express = require("express");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const {
  getAdminDashboard,
} = require("../controllers/adminController");

const router = express.Router();

router.get(
  "/dashboard",
  protect,
  authorize("admin"),
  getAdminDashboard
);

// Keep your other admin routes here.

module.exports = router;