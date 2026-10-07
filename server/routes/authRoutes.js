const express = require("express");

const {
  sendRegisterOTP,
  verifyRegisterOTP,
  sendLoginOTP,
  verifyLoginOTP,
} = require("../controllers/authController");

const router = express.Router();

router.post("/register/send-otp",sendRegisterOTP);

router.post("/register/verify-otp",verifyRegisterOTP);

router.post("/login/send-otp",sendLoginOTP);

router.post("/login/verify-otp",verifyLoginOTP);

module.exports = router;