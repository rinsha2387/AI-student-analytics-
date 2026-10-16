const express = require("express");
const router = express.Router();

const {
  uploadDataset,
  getMyDatasets,
} = require("../controllers/datasetController");

const upload = require("../middleware/uploadMiddleware");
const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

router.post(
  "/upload",
  protect,
  authorize("manager"),
  upload.single("file"),
  uploadDataset
);

router.get(
  "/my",
  protect,
  authorize("manager"),
  getMyDatasets
);

module.exports = router;
