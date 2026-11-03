const express = require("express");

const protect = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

const {
  getAdminDashboard,
  getManagementUsers,
  updateManagementUserStatus,
} = require("../controllers/adminController");

const router = express.Router();

// Admin dashboard
router.get(
  "/dashboard",
  protect,
  allowRoles("admin"),
  getAdminDashboard
);

// Get management users
router.get(
  "/users",
  protect,
  allowRoles("admin"),
  getManagementUsers
);

// Update management user status
router.patch(
  "/users/:id/status",
  protect,
  allowRoles("admin"),
  updateManagementUserStatus
);

// Keep your other admin routes here.

module.exports = router;