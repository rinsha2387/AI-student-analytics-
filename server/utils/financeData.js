// Fee data for the SALES pages.
//
// Only fee fields are read here. Marks, attendance, AI results and risk levels
// are never returned to the sales team.
const { FIELD_ALIASES, getNumber, getText } = require("./studentData");

const ALIASES = {
  due: FIELD_ALIASES.feesDue,
  paid: [
    "feespaid",
    "feepaid",
    "amountpaid",
    "paidfees",
    "totalpaid",
    "totalfeespaid",
    "feespayment",
  ],
  billed: ["totalfee", "totalfees", "feestotal", "feeamount", "feesamount", "totalfeeamount"],
  dueDate: [
    "duedate",
    "feeduedate",
    "paymentduedate",
    "lastdate",
    "lastdateofpayment",
    "paymentdeadline",
  ],
  paidDate: ["paiddate", "paymentdate", "datepaid", "lastpaymentdate"],
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const parseDate = (value) => {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const dayStart = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

// One row per student with ONLY fee information.
const buildFinanceRows = (records, now = new Date()) => {
  const today = dayStart(now);

  return records.map((record, index) => {
    const billed = getNumber(record, ALIASES.billed);
    let due = getNumber(record, ALIASES.due);
    let paid = getNumber(record, ALIASES.paid);

    // Fill a missing value from the other two when possible.
    if (due === null && billed !== null && paid !== null) due = Math.max(billed - paid, 0);
    if (paid === null && billed !== null && due !== null) paid = Math.max(billed - due, 0);

    const dueDate = parseDate(getText(record, ALIASES.dueDate, ""));
    const paidDate = parseDate(getText(record, ALIASES.paidDate, ""));

    const hasBalance = due !== null && due > 0;
    const overdue = hasBalance && dueDate !== null && dayStart(dueDate) < today;

    let status = "Unknown";

    if (due !== null || paid !== null) {
      if (!hasBalance) status = "Paid";
      else if (overdue) status = "Overdue";
      else if (paid !== null && paid > 0) status = "Partial";
      else status = "Pending";
    }

    return {
      id: getText(record, FIELD_ALIASES.studentId, `Record ${index + 1}`),
      name: getText(record, FIELD_ALIASES.studentName, `Student ${index + 1}`),
      department: getText(record, FIELD_ALIASES.department, ""),
      due,
      paid,
      billed: billed ?? (due !== null || paid !== null ? (due ?? 0) + (paid ?? 0) : null),
      dueDate: dueDate ? dueDate.toISOString() : null,
      paidDate: paidDate ? paidDate.toISOString() : null,
      status,
      daysOverdue: overdue ? Math.round((today - dayStart(dueDate)) / 86400000) : 0,
    };
  });
};

const sum = (values) => values.reduce((total, value) => total + value, 0);

const toLakh = (value) => Number((value / 100000).toFixed(2));

const buildFinanceSummary = (rows) => {
  const withDue = rows.filter((row) => row.due !== null);
  const withPaid = rows.filter((row) => row.paid !== null);
  const known = rows.filter((row) => row.status !== "Unknown");

  const totalDue = sum(withDue.map((row) => row.due));
  const totalPaid = sum(withPaid.map((row) => row.paid));
  const billed = sum(rows.filter((row) => row.billed !== null).map((row) => row.billed));

  const owing = rows.filter((row) => row.due !== null && row.due > 0);

  const statusCounts = { Paid: 0, Partial: 0, Pending: 0, Overdue: 0 };
  known.forEach((row) => {
    statusCounts[row.status] += 1;
  });

  // Outstanding amount by department (₹ lakh), else by amount range.
  const hasDepartment = owing.some((row) => row.department);
  let outstandingChart;

  if (hasDepartment) {
    const groups = new Map();

    owing.forEach((row) => {
      const key = row.department || "Not set";
      groups.set(key, (groups.get(key) || 0) + row.due);
    });

    outstandingChart = {
      title: "Outstanding by department",
      subtitle: "Amount still to be collected, in ₹ lakh",
      data: [...groups.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([label, value]) => ({ label, value: toLakh(value) })),
    };
  } else {
    const bands = [
      { label: "Under ₹10K", max: 10000 },
      { label: "₹10K–50K", max: 50000 },
      { label: "₹50K–1L", max: 100000 },
      { label: "Over ₹1L", max: Infinity },
    ].map((band) => ({ ...band, value: 0 }));

    owing.forEach((row) => {
      bands.find((band) => row.due < band.max || band.max === Infinity).value += 1;
    });

    outstandingChart = {
      title: "Outstanding by amount",
      subtitle: "Number of students in each balance range",
      data: bands.map(({ label, value }) => ({ label, value })),
    };
  }

  // Money collected per month, when the data has payment dates.
  const months = new Map();

  rows.forEach((row) => {
    if (!row.paidDate || !row.paid) return;

    const date = new Date(row.paidDate);
    const key = date.getFullYear() * 12 + date.getMonth();
    const current = months.get(key) || { label: `${MONTHS[date.getMonth()]} ${date.getFullYear()}`, value: 0 };

    current.value += row.paid;
    months.set(key, current);
  });

  const collectionsByMonth =
    months.size >= 2
      ? {
          available: true,
          data: [...months.entries()]
            .sort((a, b) => a[0] - b[0])
            .slice(-12)
            .map(([, month]) => ({ label: month.label, value: toLakh(month.value) })),
        }
      : { available: false };

  const denominator = billed > 0 ? billed : totalPaid + totalDue;

  return {
    available: withDue.length > 0 || withPaid.length > 0,
    totalStudents: rows.length,
    totalDue,
    totalPaid,
    billed: denominator,
    collectionRate: denominator > 0 ? Number(((totalPaid / denominator) * 100).toFixed(1)) : null,
    studentsWithDues: owing.length,
    overdueCount: statusCounts.Overdue,
    overdueAmount: sum(rows.filter((row) => row.status === "Overdue").map((row) => row.due)),
    hasDueDates: rows.some((row) => row.dueDate !== null),
    statusCounts,
    statusChart: Object.entries(statusCounts).map(([label, value]) => ({ label, value })),
    outstandingChart,
    collectionsByMonth,
    topDues: [...owing]
      .sort((a, b) => b.due - a.due)
      .slice(0, 5)
      .map(({ id, name, department, due, dueDate, status, daysOverdue }) => ({
        id, name, department, due, dueDate, status, daysOverdue,
      })),
  };
};

const paginate = (list, query) => {
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 50);
  const total = list.length;
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  const page = Math.min(Math.max(parseInt(query.page, 10) || 1, 1), totalPages);

  return {
    items: list.slice((page - 1) * limit, page * limit),
    pagination: { page, limit, total, totalPages },
  };
};

const matchesSearch = (row, search) =>
  !search ||
  [row.name, row.id, row.department].some((value) =>
    String(value || "").toLowerCase().includes(search),
  );

// Students who still owe money.
const buildDueList = (rows, query = {}) => {
  const search = String(query.search || "").trim().toLowerCase();
  const status = String(query.status || "all");

  const owing = rows.filter((row) => row.due !== null && row.due > 0);

  const counts = {
    all: owing.length,
    Overdue: owing.filter((r) => r.status === "Overdue").length,
    Pending: owing.filter((r) => r.status === "Pending").length,
    Partial: owing.filter((r) => r.status === "Partial").length,
  };

  let list = owing.filter((row) => matchesSearch(row, search));

  if (["Overdue", "Pending", "Partial"].includes(status)) {
    list = list.filter((row) => row.status === status);
  }

  if (query.sort === "dueDate") {
    list.sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return b.due - a.due;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });
  } else {
    list.sort((a, b) => b.due - a.due);
  }

  return {
    list,
    counts,
    totalDue: sum(list.map((row) => row.due)),
    ...paginate(list, query),
  };
};

// Students who have paid something.
const buildPaidList = (rows, query = {}) => {
  const search = String(query.search || "").trim().toLowerCase();

  let list = rows.filter(
    (row) => row.paid !== null && row.paid > 0 && matchesSearch(row, search),
  );

  list.sort((a, b) => {
    if (a.paidDate && b.paidDate) return new Date(b.paidDate) - new Date(a.paidDate);
    if (a.paidDate) return -1;
    if (b.paidDate) return 1;
    return b.paid - a.paid;
  });

  return {
    list,
    totalPaid: sum(list.map((row) => row.paid)),
    hasPaidDates: list.some((row) => row.paidDate !== null),
    ...paginate(list, query),
  };
};

module.exports = {
  buildFinanceRows,
  buildFinanceSummary,
  buildDueList,
  buildPaidList,
};