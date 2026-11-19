const User = require("../models/User");
const { logAudit } = require("../utils/auditLog");
const AuditLog = require("../models/AuditLog");
const Dataset = require("../models/Dataset");
const Analysis = require("../models/Analysis");

const getAdminDashboard = async (req, res) => {
  try {
    const now = new Date();

    const monthStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

    const sixMonthsStart = new Date(
      now.getFullYear(),
      now.getMonth() - 5,
      1
    );

    const managementRoleFilter = {
      role: { $in: ["manager", "management"] },
    };

    const completedStatuses = [
      "completed",
      "success",
      "successful",
    ];

    const failedStatuses = [
      "failed",
      "error",
    ];

    const totalStudentsResult = await Dataset.aggregate([
    { $group: { _id: null, total: { $sum: "$totalRows" } } },
  ]);
  const totalStudents = totalStudentsResult[0]?.total || 0;

  const [
      managementUsers,
      activeManagementUsers,
      uploadedDatasets,
      datasetsThisMonth,
      aiAnalyses,
      completedAnalyses,
      failedAnalyses,
      monthlyUsage,
      recentLogs,
      completedRecords,
    ] = await Promise.all([
      User.countDocuments(managementRoleFilter),

      User.countDocuments({
        ...managementRoleFilter,
        isActive: true,
      }),

      Dataset.countDocuments(),

      Dataset.countDocuments({
        createdAt: { $gte: monthStart },
      }),

      Analysis.countDocuments(),

      Analysis.countDocuments({
        status: { $in: completedStatuses },
      }),

      Analysis.countDocuments({
        status: { $in: failedStatuses },
      }),

      Analysis.aggregate([
        {
          $match: {
            createdAt: { $gte: sixMonthsStart },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m",
                date: "$createdAt",
              },
            },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]),

      AuditLog.find()
        .sort({ createdAt: -1 })
        .limit(3)
        .lean(),

      Analysis.find({
        status: { $in: completedStatuses },
      })
        .select(
          "processingTimeSeconds durationSeconds processingTimeMs durationMs startedAt completedAt"
        )
        .sort({ createdAt: -1 })
        .limit(1000)
        .lean(),
    ]);

    // Build six month buckets, including months with zero analyses.
    const usageCounts = new Map(
      monthlyUsage.map((item) => [
        item._id,
        item.count,
      ])
    );

    const usage = [];

    for (let offset = 5; offset >= 0; offset--) {
      const monthDate = new Date(
        now.getFullYear(),
        now.getMonth() - offset,
        1
      );

      const year = monthDate.getFullYear();
      const month = String(
        monthDate.getMonth() + 1
      ).padStart(2, "0");

      const key = `${year}-${month}`;

      usage.push({
        month: monthDate.toLocaleDateString("en", {
          month: "short",
        }),
        count: usageCounts.get(key) || 0,
      });
    }

    // Calculate duration only if the analysis record stores it.
    const durations = completedRecords
      .map((record) => {
        if (record.processingTimeSeconds != null) {
          return Number(record.processingTimeSeconds);
        }

        if (record.durationSeconds != null) {
          return Number(record.durationSeconds);
        }

        if (record.processingTimeMs != null) {
          return Number(record.processingTimeMs) / 1000;
        }

        if (record.durationMs != null) {
          return Number(record.durationMs) / 1000;
        }

        if (record.startedAt && record.completedAt) {
          return (
            new Date(record.completedAt).getTime() -
            new Date(record.startedAt).getTime()
          ) / 1000;
        }

        return null;
      })
      .filter(
        (value) =>
          value !== null &&
          Number.isFinite(value) &&
          value >= 0
      );

    const averageProcessingSeconds =
      durations.length > 0
        ? Math.round(
            durations.reduce(
              (sum, value) => sum + value,
              0
            ) / durations.length
          )
        : null;

    const successRate =
      aiAnalyses > 0
        ? Number(
            ((completedAnalyses / aiAnalyses) * 100).toFixed(1)
          )
        : 0;

    // Adapt these field mappings if your AuditLog schema
    // uses different names.
    const activity = recentLogs.map((log) => ({
      id: String(log._id),

      user:
        log.userName ||
        log.actorName ||
        log.user?.name ||
        log.actor?.name ||
        log.email ||
        "System",

      activity:
        log.activity ||
        log.action ||
        log.description ||
        log.event ||
        "System event",

      dataset:
        log.datasetName ||
        log.dataset?.name ||
        log.resourceName ||
        "—",

      date: log.createdAt || log.timestamp || null,

      status:
        log.status ||
        (log.success === false
          ? "Failed"
          : "Completed"),
    }));

    return res.status(200).json({
      success: true,

      data: {
        stats: {
          managementUsers,
          activeManagementUsers,
          totalStudents,
          uploadedDatasets,
          datasetsThisMonth,
          aiAnalyses,
          completedAnalyses,
          failedAnalyses,
        },

        usage,

        health: {
          successRate,
          averageProcessingSeconds,
          operational: true,
        },

        activity,
      },
    });
  } catch (error) {
    console.error(
      "Admin dashboard error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load admin dashboard data.",
    });
  }
};


const getManagementUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select("name email role institution isActive status createdAt")
      .sort({ createdAt: -1 })
      .lean();

    const totalUsers = users.length;
    const activeUsers = users.filter(
      (user) => user.isActive === true
    ).length;
    const adminAccounts = users.filter(
      (user) => user.role === "admin"
    ).length;

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          activeUsers,
          adminAccounts,
        },
        users: users.map((user) => ({
          _id: String(user._id),
          name: user.name,
          email: user.email,
          role: user.role,
          institution: user.institution?.name || "Not provided",
          isActive: user.isActive === true,
          status: user.status || "active",
          lastLogin: null,
          createdAt: user.createdAt || null,
        })),
      },
    });
  } catch (error) {
    console.error("Manage users error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load users.",
    });
  }
};

const updateManagementUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false.",
      });
    }

    if (!require("mongoose").isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    const targetUser = await User.findById(id);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Prevent accidental deactivation of the currently
    // authenticated administrator.
    if (
      String(targetUser._id) === String(req.user._id) &&
      isActive === false
    ) {
      return res.status(400).json({
        success: false,
        message: "You cannot deactivate your own account.",
      });
    }

    targetUser.isActive = isActive;
    await targetUser.save();

    logAudit(req, {
      activity: isActive ? "User activated" : "User deactivated",
      resource: targetUser.name || targetUser.email,
      category: "user",
      status: "success",
      success: true,
    });

    return res.status(200).json({
      success: true,
      message: `User ${isActive ? "activated" : "deactivated"} successfully.`,
      data: {
        _id: String(targetUser._id),
        isActive: targetUser.isActive,
      },
    });
  } catch (error) {
    console.error("Update user status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update user status.",
    });
  }
};

// ---------- Analysis History (all institutions) ----------

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// coalesce("$a", "$b", "default") -> first value that is not null
const coalesce = (...exprs) =>
  exprs.reduceRight((acc, expr) => ({ $ifNull: [expr, acc] }));

const STATUS_GROUPS = {
  completed: ["completed", "success", "successful"],
  failed: ["failed", "error"],
  processing: ["processing", "pending", "running", "queued", "in_progress"],
};

const getAnalysisHistory = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const search = String(req.query.search || "").trim().slice(0, 100);
    const status = String(req.query.status || "all").toLowerCase();
    const sortDir = req.query.sort === "oldest" ? 1 : -1;

    const pipeline = [
      // 1. Find the dataset and the creator of each analysis
      {
        $addFields: {
          datasetRef: coalesce("$dataset", "$datasetId", null),
          creatorRef: coalesce("$manager", "$createdBy", "$user", "$uploadedBy", null),
        },
      },
      {
        $lookup: {
          from: Dataset.collection.name,
          localField: "datasetRef",
          foreignField: "_id",
          as: "datasetDoc",
        },
      },
      {
        $lookup: {
          from: User.collection.name,
          localField: "creatorRef",
          foreignField: "_id",
          as: "creatorDoc",
        },
      },
      {
        $addFields: {
          datasetDoc: { $arrayElemAt: ["$datasetDoc", 0] },
          creatorDoc: { $arrayElemAt: ["$creatorDoc", 0] },
        },
      },

      // 2. Build the clean fields we want to show
      {
        $addFields: {
          idText: coalesce(
            "$analysisCode",
            {
              $concat: [
                "AI-",
                { $toUpper: { $substrCP: [{ $toString: "$_id" }, 20, 4] } },
              ],
            }
          ),
          datasetName: coalesce(
            "$datasetDoc.name",
            "$datasetDoc.title",
            "$datasetName",
            "Unknown dataset"
          ),
          creatorName: coalesce("$creatorDoc.name", "Unknown user"),
          institutionName: coalesce(
            "$creatorDoc.institution.name",
            "$creatorDoc.institutionName",
            "$datasetDoc.institutionName",
            "Not provided"
          ),
          studentsCount: coalesce(
            "$datasetDoc.totalRows",
            "$totalStudents",
            "$studentCount",
            "$datasetDoc.totalStudents",
            "$datasetDoc.studentCount",
            null
          ),
          reviewCount: {
            $size: {
              $ifNull: [
                "$result.studentsRequiringReview",
                "$result.highRiskStudents",
                "$result.atRiskStudents",
                [],
              ],
            },
          },
          statusText: coalesce("$status", "unknown"),
        },
      },
    ];

    // 3. Filters
    const match = {};

    if (STATUS_GROUPS[status]) {
      match.statusText = { $in: STATUS_GROUPS[status] };
    }

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      match.$or = [
        { idText: regex },
        { datasetName: regex },
        { creatorName: regex },
        { institutionName: regex },
      ];
    }

    if (Object.keys(match).length) pipeline.push({ $match: match });

    // 4. Sort + pagination in one query
    pipeline.push({
      $facet: {
        rows: [
          { $sort: { createdAt: sortDir, _id: sortDir } },
          { $skip: (page - 1) * limit },
          { $limit: limit },
          {
            $project: {
              _id: 0,
              id: { $toString: "$_id" },
              analysisId: "$idText",
              datasetName: 1,
              institutionName: 1,
              creatorName: 1,
              students: "$studentsCount",
              reviewIndicators: "$reviewCount",
              status: "$statusText",
              createdAt: 1,
            },
          },
        ],
        total: [{ $count: "count" }],
      },
    });

    const [result, totalAll, totalCompleted, totalFailed] = await Promise.all([
      Analysis.aggregate(pipeline),
      Analysis.countDocuments(),
      Analysis.countDocuments({ status: { $in: STATUS_GROUPS.completed } }),
      Analysis.countDocuments({ status: { $in: STATUS_GROUPS.failed } }),
    ]);

    const rows = result[0]?.rows || [];
    const total = result[0]?.total?.[0]?.count || 0;

    return res.status(200).json({
      success: true,
      data: {
        analyses: rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(Math.ceil(total / limit), 1),
        },
        summary: {
          total: totalAll,
          completed: totalCompleted,
          failed: totalFailed,
        },
      },
    });
  } catch (error) {
    console.error("Analysis history error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to load analysis history.",
    });
  }
};


// ---------- System Logs (audit trail) ----------

// ---------- System Logs (audit trail) ----------

const LOG_STATUS_GROUPS = {
  success: ["success", "completed"],
  failed: ["failed"],
  processing: ["processing", "pending"],
};

const LOG_CATEGORIES = ["auth", "user", "data", "analysis", "settings", "system"];

const LOG_RANGE_DAYS = { "24h": 1, "7d": 7, "30d": 30 };

const getSystemLogs = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const search = String(req.query.search || "").trim().slice(0, 100);
    const status = String(req.query.status || "all").toLowerCase();
    const category = String(req.query.category || "all").toLowerCase();
    const range = String(req.query.range || "all").toLowerCase();
    const sortDir = req.query.sort === "oldest" ? 1 : -1;

    // Build the filter
    const filter = {};

    if (LOG_STATUS_GROUPS[status]) {
      filter.status = { $in: LOG_STATUS_GROUPS[status] };
    }

    if (LOG_CATEGORIES.includes(category)) {
      filter.category = category;
    }

    if (LOG_RANGE_DAYS[range]) {
      filter.createdAt = {
        $gte: new Date(Date.now() - LOG_RANGE_DAYS[range] * 24 * 60 * 60 * 1000),
      };
    }

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      filter.$or = [
        { userName: regex },
        { email: regex },
        { activity: regex },
        { resourceName: regex },
        { resource: regex },
      ];
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [logs, total, totalAll, today, failedToday, loginsToday] =
      await Promise.all([
        AuditLog.find(filter)
          .sort({ createdAt: sortDir, _id: sortDir })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        AuditLog.countDocuments(filter),
        AuditLog.countDocuments(),
        AuditLog.countDocuments({ createdAt: { $gte: startOfToday } }),
        AuditLog.countDocuments({
          createdAt: { $gte: startOfToday },
          status: "failed",
        }),
        AuditLog.countDocuments({
          createdAt: { $gte: startOfToday },
          category: "auth",
          activity: "Login",
          status: { $in: LOG_STATUS_GROUPS.success },
        }),
      ]);

    const rows = logs.map((l) => ({
      id: String(l._id),
      timestamp: l.createdAt,
      user: l.userName || "System",
      email: l.email || "",
      role: l.role || "",
      activity: l.activity || l.action || "System event",
      resource:
        (l.resourceName && l.resourceName !== "—" ? l.resourceName : l.resource) ||
        "—",
      category: l.category || "system",
      ipAddress: l.ipAddress || "",
      status: l.status || "success",
    }));

    return res.status(200).json({
      success: true,
      data: {
        logs: rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(Math.ceil(total / limit), 1),
        },
        summary: { total: totalAll, today, failedToday, loginsToday },
      },
    });
  } catch (error) {
    console.error("System logs error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to load system logs.",
    });
  }
};

// ---------- Admin Settings ----------

const DEFAULT_NOTIFICATIONS = {
  analysisFailures: true,
  newUserRequests: true,
  weeklySummary: false,
  systemAlerts: true,
};

const NOTIFICATION_KEYS = Object.keys(DEFAULT_NOTIFICATIONS);

const formatSettings = (u) => ({
  name: u.name,
  email: u.email,
  role: u.role,
  isActive: u.isActive === true,
  institution: u.institution?.name || null,
  createdAt: u.createdAt || null,
  notifications: {
    ...DEFAULT_NOTIFICATIONS,
    ...(u.notificationPreferences || {}),
  },
});

const SETTINGS_FIELDS =
  "name email role institution isActive createdAt notificationPreferences";

const getAdminSettings = async (req, res) => {
  try {
    const admin = await User.findById(req.user._id)
      .select(SETTINGS_FIELDS)
      .lean();

    if (!admin) {
      return res
        .status(404)
        .json({ success: false, message: "Account not found." });
    }

    return res.status(200).json({ success: true, data: formatSettings(admin) });
  } catch (error) {
    console.error("Get admin settings error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Failed to load settings." });
  }
};

const updateAdminProfile = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim().replace(/\s+/g, " ");

    if (name.length < 2 || name.length > 60) {
      return res.status(400).json({
        success: false,
        message: "Name must be between 2 and 60 characters.",
      });
    }

    // Only the name can change here. Email is the OTP login identity.
    const admin = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { name } },
      { new: true, runValidators: true }
    )
      .select(SETTINGS_FIELDS)
      .lean();

    if (!admin) {
      return res
        .status(404)
        .json({ success: false, message: "Account not found." });
    }

    logAudit(req, {
      activity: "Profile updated",
      resource: "Admin settings",
      category: "settings",
      status: "success",
      success: true,
    });

    return res.status(200).json({
      success: true,
      message: "Profile updated.",
      data: formatSettings(admin),
    });
  } catch (error) {
    console.error("Update admin profile error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Failed to update profile." });
  }
};

const updateNotificationPreferences = async (req, res) => {
  try {
    const incoming = req.body.notifications;

    if (!incoming || typeof incoming !== "object") {
      return res
        .status(400)
        .json({ success: false, message: "Notification settings are required." });
    }

    // Only accept known keys with true/false values
    const updates = {};
    for (const key of NOTIFICATION_KEYS) {
      if (typeof incoming[key] === "boolean") {
        updates[`notificationPreferences.${key}`] = incoming[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No valid settings were sent." });
    }

    const admin = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true }
    )
      .select(SETTINGS_FIELDS)
      .lean();

    logAudit(req, {
      activity: "Notification settings changed",
      resource: "Admin settings",
      category: "settings",
      status: "success",
      success: true,
    });

    return res.status(200).json({
      success: true,
      message: "Notification preferences saved.",
      data: formatSettings(admin),
    });
  } catch (error) {
    console.error("Update notifications error:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Failed to save preferences." });
  }
};
module.exports = {
  getAdminDashboard,
  getManagementUsers,
  updateManagementUserStatus,
  getAnalysisHistory,
  getSystemLogs,
  getAdminSettings,
  updateAdminProfile,
  updateNotificationPreferences
};