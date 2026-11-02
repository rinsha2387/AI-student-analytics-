
const User = require("../models/User");
const OTP = require("../models/OTP");
const jwt = require("jsonwebtoken");
const { sendOtpEmail } = require("../services/emailService");

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d",
    },
  );
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Same institution = same name and same city (not case sensitive).
const institutionQuery = (institution) => ({
  "institution.name": new RegExp(`^${escapeRegex(institution?.name?.trim() || "")}$`, "i"),
  "institution.city": new RegExp(`^${escapeRegex(institution?.city?.trim() || "")}$`, "i"),
});

// Rejected users cannot sign in. Pending users CAN sign in, but they only
// see the "waiting for approval" page until the manager accepts them.
const getStatusError = (user) => {
  if (user.status === "rejected") {
    return "Your request to join this institution was not approved.";
  }

  return null;
};

const sendRegisterOTP = async (req, res) => {
  try {
    const { name, email, institution } = req.body;

    // Validate input
    if (!name || !email || !institution?.name || !institution?.city) {
      return res.status(400).json({
        success: false,
        message: "Name, email, institution name and city are required",
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

    // Send OTP to the user's email
    try {
      await sendOtpEmail(normalizedEmail, otp, "registration");
    } catch (emailError) {
      console.error("Registration email delivery failed:", emailError.message);

      // Remove the OTP if delivery fails
      await OTP.deleteMany({
        email: normalizedEmail,
        purpose: "register",
      });

      return res.status(502).json({
        success: false,
        message: "Unable to send OTP email. Please try again.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Registration OTP sent to your email. It expires in 5 minutes.",
      expiresIn: 300,
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
    const { name, email, institution, otp } = req.body;

    // Validate input
    if (!name || !email || !institution?.name || !institution?.city || !otp) {
      return res.status(400).json({
        success: false,
        message: "Name, email, institution details and OTP are required",
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

    // The first person to register an institution becomes its manager.
    // Anyone who joins an existing institution must be approved first.
    const institutionHasManager = await User.exists({
      ...institutionQuery(institution),
      role: { $in: ["manager", "admin"] },
    });

    const user = await User.create({
      name,
      email: normalizedEmail,
      role: institutionHasManager ? "sales" : "manager",
      status: institutionHasManager ? "pending" : "active",

      institution: {
        name: institution.name.trim(),
        city: institution.city.trim(),
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
        status: user.status || "active",
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

// LOGIN - SEND OTP

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

    // Check approval status
    const statusError = getStatusError(user);

    if (statusError) {
      return res.status(403).json({
        success: false,
        message: statusError,
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

    // Send OTP to the user's email
    try {
      await sendOtpEmail(normalizedEmail, otp, "login");
    } catch (emailError) {
      console.error("Login email delivery failed:", emailError.message);

      await OTP.deleteMany({
        email: normalizedEmail,
        purpose: "login",
      });

      return res.status(502).json({
        success: false,
        message: "Unable to send OTP email. Please try again.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Login OTP sent to your email. It expires in 5 minutes.",
      expiresIn: 300,
    });
  } catch (error) {
    console.error("Send Login OTP Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

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

    // Check approval status
    const statusError = getStatusError(user);

    if (statusError) {
      return res.status(403).json({
        success: false,
        message: statusError,
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
        status: user.status || "active",
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

// ==========================================
// CURRENT USER (fresh role from the database)
// ==========================================
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id || req.user.id);

    if (!user || !user.isActive || user.status === "rejected") {
      return res.status(401).json({
        success: false,
        message: "Account not found or not approved",
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status || "active",
        institution: user.institution,
      },
    });
  } catch (error) {
    console.error("Get Me Error:", error);

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
  getMe,
};