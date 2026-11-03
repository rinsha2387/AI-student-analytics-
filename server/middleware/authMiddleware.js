const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Token required.",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Always load the user from the database, so the role and status
    // are the CURRENT ones (not the old values inside the token).
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.isActive || user.status === "rejected") {
      return res.status(401).json({
        success: false,
        message: "Your account is not allowed to sign in.",
      });
    }

    // People with status "pending" are allowed to pass here.
    // They can only call /auth/me. The allowRoles middleware blocks
    // every data route until the manager accepts them.
    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

module.exports = protect;