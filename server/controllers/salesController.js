const { loadLatestDataset, sendError } = require("../utils/reportLoader");
const {
  buildFinanceRows,
  buildFinanceSummary,
  buildDueList,
  buildPaidList,
} = require("../utils/financeData");

const publicRow = ({ id, name, department, due, paid, dueDate, paidDate, status, daysOverdue }) => ({
  id, name, department, due, paid, dueDate, paidDate, status, daysOverdue,
});

const loadRows = async (req) => {
  const { dataset } = await loadLatestDataset(req);
  const records = Array.isArray(dataset.records) ? dataset.records : [];

  return {
    rows: buildFinanceRows(records),
    source: {
      name: dataset.name || dataset.originalFileName || "Dataset",
      fileName: dataset.originalFileName || "",
      uploadedAt: dataset.createdAt || dataset.updatedAt || null,
    },
  };
};

// GET /api/sales/summary
// Numbers and charts for the sales dashboard and the financial impact page.
const getSummary = async (req, res) => {
  try {
    const { rows, source } = await loadRows(req);

    return res.status(200).json({
      success: true,
      source,
      summary: buildFinanceSummary(rows),
    });
  } catch (error) {
    return sendError(res, error, "Sales Summary");
  }
};

// GET /api/sales/fees-due?page=&limit=&search=&status=&sort=amount|dueDate
const getFeesDue = async (req, res) => {
  try {
    const { rows, source } = await loadRows(req);
    const result = buildDueList(rows, req.query);

    return res.status(200).json({
      success: true,
      source,
      items: result.items.map(publicRow),
      counts: result.counts,
      totalDue: result.totalDue,
      pagination: result.pagination,
    });
  } catch (error) {
    return sendError(res, error, "Sales Fees Due");
  }
};

// GET /api/sales/fees-paid?page=&limit=&search=
const getFeesPaid = async (req, res) => {
  try {
    const { rows, source } = await loadRows(req);
    const result = buildPaidList(rows, req.query);

    return res.status(200).json({
      success: true,
      source,
      items: result.items.map(publicRow),
      totalPaid: result.totalPaid,
      hasPaidDates: result.hasPaidDates,
      pagination: result.pagination,
    });
  } catch (error) {
    return sendError(res, error, "Sales Fees Paid");
  }
};

// GET /api/sales/export?type=due|paid   (every row, for the CSV button)
const getExport = async (req, res) => {
  try {
    const { rows, source } = await loadRows(req);

    const list =
      req.query.type === "paid"
        ? buildPaidList(rows, { limit: 50 }).list
        : buildDueList(rows, { limit: 50 }).list;

    return res.status(200).json({
      success: true,
      datasetName: source.name,
      rows: list.map(publicRow),
    });
  } catch (error) {
    return sendError(res, error, "Sales Export");
  }
};

module.exports = { getSummary, getFeesDue, getFeesPaid, getExport };