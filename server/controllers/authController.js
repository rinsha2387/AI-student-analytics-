const User = require("../models/User");
const OTP = require("../models/OTP");
const jwt = require("jsonwebtoken");

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d",
    }
  );
};


const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};


const sendRegisterOTP = async (req, res) => {
  try {
    const {
      name,
      email,
      institution,
    } = req.body;

    // Validate input
    if (
      !name ||
      !email ||
      !institution?.name ||
      !institution?.city
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email, institution name and city are required",
      });
    }

    const normalizedEmail = email.toLowerCase();

    // Check existing user
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    // Generate OTP
    const otp = generateOTP();

    // Delete previous registration OTP
    await OTP.deleteMany({
      email: normalizedEmail,
      purpose: "register",
    });

    // Save OTP
    await OTP.create({
      email: normalizedEmail,
      otp,
      purpose: "register",
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    // Development only
    console.log(
      `Registration OTP for ${normalizedEmail}: ${otp}`
    );

    return res.status(200).json({
      success: true,
      message: "Registration OTP sent successfully",
    });
  } catch (error) {
    console.error("Send Register OTP Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// REGISTER - VERIFY OTP
// ==========================================
const verifyRegisterOTP = async (req, res) => {
  try {
    const {
      name,
      email,
      institution,
      otp,
    } = req.body;

    // Validate input
    if (
      !name ||
      !email ||
      !institution?.name ||
      !institution?.city ||
      !otp
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email, institution details and OTP are required",
      });
    }

    const normalizedEmail = email.toLowerCase();

    // Find OTP
    const otpRecord = await OTP.findOne({
      email: normalizedEmail,
      purpose: "register",
      otp: otp.toString(),
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // Check expiration
    if (otpRecord.expiresAt < new Date()) {
      await OTP.deleteOne({
        _id: otpRecord._id,
      });

      return res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
    }

    // Check user again
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      await OTP.deleteOne({
        _id: otpRecord._id,
      });

      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    // Create manager account
    const user = await User.create({
      name,
      email: normalizedEmail,

      // New registrations are always managers
      role: "manager",

      institution: {
        name: institution.name,
        city: institution.city,
      },
    });

    // Delete used OTP
    await OTP.deleteOne({
      _id: otpRecord._id,
    });

    // Generate JWT
    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: "Registration successful",

      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        institution: user.institution,
      },
    });
  } catch (error) {
    console.error("Verify Register OTP Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// LOGIN - SEND OTP
// ==========================================
const sendLoginOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const normalizedEmail = email.toLowerCase();

    // Find user
    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email",
      });
    }

    // Check account status
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "User account is inactive",
      });
    }

    // Generate OTP
    const otp = generateOTP();

    // Delete previous login OTP
    await OTP.deleteMany({
      email: normalizedEmail,
      purpose: "login",
    });

    // Save OTP
    await OTP.create({
      email: normalizedEmail,
      otp,
      purpose: "login",
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    // Development only
    console.log(
      `Login OTP for ${normalizedEmail}: ${otp}`
    );

    return res.status(200).json({
      success: true,
      message: "Login OTP sent successfully",
    });
  } catch (error) {
    console.error("Send Login OTP Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ==========================================
// LOGIN - VERIFY OTP
// ==========================================
const verifyLoginOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const normalizedEmail = email.toLowerCase();

    // Find OTP
    const otpRecord = await OTP.findOne({
      email: normalizedEmail,
      purpose: "login",
      otp: otp.toString(),
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // Check expiration
    if (otpRecord.expiresAt < new Date()) {
      await OTP.deleteOne({
        _id: otpRecord._id,
      });

      return res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
    }

    // Find user
    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check account status
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "User account is inactive",
      });
    }

    // Delete used OTP
    await OTP.deleteOne({
      _id: otpRecord._id,
    });

    // Generate JWT
    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful",

      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        institution: user.institution,
      },
    });
  } catch (error) {
    console.error("Verify Login OTP Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  sendRegisterOTP,
  verifyRegisterOTP,
  sendLoginOTP,
  verifyLoginOTP,
};