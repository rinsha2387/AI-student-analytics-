const User = require("../models/User");
const Student = require("../models/Student");
const Dataset = require("../models/Dataset");
const Analysis = require("../models/Analysis");
const AuditLog = require("../models/AuditLog");

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

    const [
      managementUsers,
      activeManagementUsers,
      totalStudents,
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

      Student.countDocuments(),

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
        .limit(5)
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

module.exports = {
  getAdminDashboard,
};