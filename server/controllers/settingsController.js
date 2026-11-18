// Settings: profile information and notification preferences.
// This app signs in with an email code (OTP), so there is no password to change.

const NOTIFICATION_KEYS = ["email", "analysis", "teamRequests"];

// Everything is ON unless the person turned it off.
const readNotifications = (user) => {
  const saved = user.notificationSettings || {};

  return {
    email: saved.email !== false,
    analysis: saved.analysis !== false,
    teamRequests: saved.teamRequests !== false,
  };
};

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status || "active",
  institution: user.institution,
});

// GET /api/settings
const getSettings = async (req, res) => {
  try {
    const user = req.user;

    return res.status(200).json({
      success: true,
      profile: {
        name: user.name,
        email: user.email,
        role: user.role,
        institution: {
          name: user.institution?.name || "",
          city: user.institution?.city || "",
        },
        memberSince: user.createdAt || null,
      },
      notifications: readNotifications(user),
    });
  } catch (error) {
    console.error("Get Settings Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// PUT /api/settings/profile   Body: { name }
// Only the name can be changed here. The email is the sign-in identity, and the
// institution links the person to their team, so changing them needs more care.
const updateProfile = async (req, res) => {
  try {
    const name = String(req.body.name ?? "").trim().replace(/\s+/g, " ");

    if (name.length < 2 || name.length > 60) {
      return res.status(400).json({
        success: false,
        message: "Name must be between 2 and 60 characters.",
      });
    }

    req.user.name = name;
    await req.user.save();

    return res.status(200).json({
      success: true,
      message: "Profile saved",
      user: publicUser(req.user),
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// PUT /api/settings/notifications   Body: { email?, analysis?, teamRequests? }
const updateNotifications = async (req, res) => {
  try {
    const next = readNotifications(req.user);

    for (const key of NOTIFICATION_KEYS) {
      if (req.body[key] === undefined) continue;

      if (typeof req.body[key] !== "boolean") {
        return res.status(400).json({
          success: false,
          message: `"${key}" must be true or false.`,
        });
      }

      next[key] = req.body[key];
    }

    req.user.notificationSettings = next;
    await req.user.save();

    return res.status(200).json({
      success: true,
      message: "Notification settings saved",
      notifications: readNotifications(req.user),
    });
  } catch (error) {
    console.error("Update Notifications Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { getSettings, updateProfile, updateNotifications };