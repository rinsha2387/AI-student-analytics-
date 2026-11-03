const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");const { allowRoles } = require("../middleware/roleMiddleware");
const { listTeam, updateUserRole, reviewRequest } = require("../controllers/teamController");

router.get("/", protect, allowRoles("manager"), listTeam);
router.patch("/:id/role", protect, allowRoles("manager"), updateUserRole);
router.patch("/:id/status", protect, allowRoles("manager"), reviewRequest);

module.exports = router;