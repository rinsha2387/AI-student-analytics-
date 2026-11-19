const express = require("express");

const {
  sendRegisterOTP,
  verifyRegisterOTP,
  sendLoginOTP,
  verifyLoginOTP,
  logout,
} = require("../controllers/authController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register/send-otp",sendRegisterOTP);

router.post("/register/verify-otp",verifyRegisterOTP);

router.post("/login/send-otp",sendLoginOTP);

router.post("/login/verify-otp",verifyLoginOTP);

router.post("/logout", protect, logout);

module.exports = router;