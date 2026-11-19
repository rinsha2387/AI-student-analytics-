const express = require("express");

const protect = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");

const {
  getAdminDashboard,
  getManagementUsers,
  updateManagementUserStatus,
  getAnalysisHistory,
  getSystemLogs,
  getAdminSettings,
  updateAdminProfile,
  updateNotificationPreferences
} = require("../controllers/adminController");

const router = express.Router();

// Admin dashboard
router.get("/dashboard", protect, allowRoles("admin"), getAdminDashboard);
// Get management users
router.get("/users", protect, allowRoles("admin"), getManagementUsers);
// Update management user status
router.patch("/users/:id/status", protect,  allowRoles("admin"),  updateManagementUserStatus,);
//analysis history 
router.get("/analysis-history",protect,allowRoles("admin"), getAnalysisHistory,);
//system logs
router.get("/system-logs", protect, allowRoles("admin"), getSystemLogs);

router.get("/settings", protect, allowRoles("admin"), getAdminSettings);
router.patch("/settings/profile", protect, allowRoles("admin"), updateAdminProfile);
router.patch(
  "/settings/notifications",
  protect,
  allowRoles("admin"),
  updateNotificationPreferences
);
module.exports = router;
