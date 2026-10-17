const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const {
  getPrompt,
  initializePrompt,
  savePrompt,
} = require("../controllers/aiPromptController");

router.use(protect, authorize("admin"));

router.get("/", getPrompt);
router.post("/initialize", initializePrompt);
router.put("/", savePrompt);

module.exports = router;