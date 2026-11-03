const allowRoles =
  (...roles) =>
  (req, res, next) => {
    // Check authentication
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not logged in",
      });
    }

    // Check account status if your user model uses a status field
    if (req.user.status && req.user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Your account is waiting for manager approval.",
      });
    }

    // Check user role
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this.",
      });
    }

    next();
  };

module.exports = { allowRoles };