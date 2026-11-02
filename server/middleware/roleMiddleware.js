const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    next();
  };
};


const allowRoles =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Not logged in" });
    }

    if (req.user.status && req.user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Your account is waiting for manager approval.",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ success: false, message: "You do not have access to this." });
    }

    next();
  };

module.exports = { allowRoles };

module.exports = authorize;