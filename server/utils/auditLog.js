const AuditLog = require("../models/AuditLog");

// Fire-and-forget audit logging. Never throws to the caller.
async function logAudit(reqOrContext, { activity, resource, category = "general", status = "success", success = true, user, email } = {}) {
  try {
    const u = user || reqOrContext?.user || null;
    await AuditLog.create({
      user: u?._id || u?.id || null,
      userName: u?.name || "System",
      email: email || u?.email || "",
      activity: activity || "System event",
      action: activity || "",
      description: activity || "",
      event: activity || "",
      resourceName: resource || "—",
      resource: resource || "—",
      status,
      success,
      category,
    });
  } catch (err) {
    console.error("Audit log failed:", err.message);
  }
}

module.exports = { logAudit };