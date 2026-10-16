const express = require("express");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const {
  getAdminDashboard,
  getManagementUsers,
  updateManagementUserStatus
} = require("../controllers/adminController");

const router = express.Router();

router.get(
  "/dashboard",
  protect,
  authorize("admin"),
  getAdminDashboard
);

router.get(
  "/users",
  protect,
  authorize("admin"),
  getManagementUsers
);

router.patch(
  "/users/:id/status",
  protect,
  authorize("admin"),
  updateManagementUserStatus
);

// Keep your other admin routes here.

module.exports = router;