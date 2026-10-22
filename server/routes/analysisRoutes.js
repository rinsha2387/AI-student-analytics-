
const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const {
  runAnalysis,
  getLatestAnalysis,
} = require("../controllers/analysisController");

// Both endpoints require an authenticated manager.
router.use(protect, authorize("manager"));

router.post("/:datasetId", runAnalysis);
router.get("/dataset/:datasetId/latest", getLatestAnalysis);

module.exports = router;
