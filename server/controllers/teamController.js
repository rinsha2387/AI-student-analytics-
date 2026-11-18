const User = require("../models/User");

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Same institution = same name and same city (not case sensitive).
const institutionFilter = (institution) => ({
  "institution.name": new RegExp(`^${escapeRegex(institution?.name?.trim() || "")}$`, "i"),
  "institution.city": new RegExp(`^${escapeRegex(institution?.city?.trim() || "")}$`, "i"),
});

// GET /api/team  (manager only)
// Returns approved members and people waiting for approval.
const listTeam = async (req, res) => {
  try {
    const everyone = await User.find({
      ...institutionFilter(req.user.institution),
      _id: { $ne: req.user._id },
      role: { $in: ["manager", "sales"] },
    })
      .select("name email role status createdAt")
      .sort({ createdAt: -1 });

    const members = everyone.filter((u) => !u.status || u.status === "active");
    const pending = everyone.filter((u) => u.status === "pending");

    // The manager can switch join-request notifications off in Settings.
    const notify = req.user.notificationSettings?.teamRequests !== false;

    return res.status(200).json({ success: true, members, pending, notify });
  } catch (error) {
    console.error("List Team Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// PATCH /api/team/:id/role  (manager only)
// Body: { role: "manager" | "sales" }
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!["manager", "sales"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role must be manager or sales",
      });
    }

    if (String(req.params.id) === String(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: "You cannot change your own role",
      });
    }

    const target = await User.findOne({
      _id: req.params.id,
      ...institutionFilter(req.user.institution),
    });

    if (!target || target.role === "admin" || target.status === "pending") {
      return res.status(404).json({
        success: false,
        message: "User not found in your institution",
      });
    }

    target.role = role;
    await target.save();

    return res.status(200).json({
      success: true,
      message: `${target.name} is now on the ${role === "sales" ? "Sales" : "Manager"} side`,
      member: {
        _id: target._id,
        name: target.name,
        email: target.email,
        role: target.role,
      },
    });
  } catch (error) {
    console.error("Update Role Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// PATCH /api/team/:id/status  (manager only)
// Body: { action: "approve" | "reject", role?: "manager" | "sales" }
const reviewRequest = async (req, res) => {
  try {
    const { action, role } = req.body;

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action must be approve or reject",
      });
    }

    if (action === "approve" && !["manager", "sales"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Choose Manager or Sales team for the approved person",
      });
    }

    // Only people who are still pending in this manager's institution.
    const target = await User.findOne({
      _id: req.params.id,
      status: "pending",
      ...institutionFilter(req.user.institution),
    });

    if (!target) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    if (action === "approve") {
      target.status = "active";
      target.role = role;
    } else {
      target.status = "rejected";
    }

    await target.save();

    return res.status(200).json({
      success: true,
      message:
        action === "approve"
          ? `${target.name} was approved as ${role === "sales" ? "Sales team" : "Manager"}`
          : `${target.name}'s request was rejected`,
    });
  } catch (error) {
    console.error("Review Request Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/team/notifications  (manager only)
// People from the same institution who are waiting for approval.
// This list is built from the pending users, so a request disappears
// from the bell as soon as the manager accepts or rejects it.
const getNotifications = async (req, res) => {
  try {
    const filter = {
      ...institutionFilter(req.user.institution),
      status: "pending",
    };

    const [count, requests] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter).select("name email createdAt").sort({ createdAt: -1 }).limit(10),
    ]);

    return res.status(200).json({ success: true, count, requests });
  } catch (error) {
    console.error("Notifications Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { listTeam, updateUserRole, reviewRequest, getNotifications };