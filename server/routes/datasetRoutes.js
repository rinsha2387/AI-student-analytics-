const express = require("express");
const router = express.Router();
const {uploadDataset,getMyDatasets} = require("../controllers/datasetController");
const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");
const uploadWithConfig = require("../middleware/uploadMiddleware");

router.post(
  "/upload",
  protect,
  authorize("manager"),
  uploadWithConfig,
  uploadDataset
);

router.get(
  "/my",
  protect,
  authorize("manager"),
  getMyDatasets
);

module.exports = router;
