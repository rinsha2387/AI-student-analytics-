const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const {
  getConfig,
  saveConfig,
  testConnection,
  listModels,
} = require("../controllers/aiConfigurationController");

router.use(protect, authorize("admin"));

router.get("/", getConfig);
router.put("/", saveConfig);
router.post("/test", testConnection);
router.post("/models", listModels);

module.exports = router;