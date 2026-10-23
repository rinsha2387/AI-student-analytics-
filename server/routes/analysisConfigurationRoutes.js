const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const {
  getConfig,
  saveConfig,
} = require("../controllers/analysisConfigurationController");

router.use(protect, authorize("admin"));

router.get("/", getConfig);
router.put("/", saveConfig);

module.exports = router;
