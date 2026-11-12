// Estimated money lost when students leave (dropout).
//
//   Estimated loss = fee per year x years left
//
// It is calculated ONLY for high-priority students (the ones near dropout).
// Fee and years come from the uploaded data when the columns exist.
// Otherwise the manager's average values are used. When neither exists,
// the student is counted but not priced, so no number is made up.
const { getTextFromResult } = require("./studentData");

const FINANCIAL_KEYS = [
  "financialInsights",
  "financialInsight",
  "financialImpact",
  "financialAnalysis",
  "financialSummary",
  "financialIndicators",
];

const REASONS = ["Low attendance", "Low marks", "Low assignment completion"];

const formatInr = (value) => {
  if (value === null || value === undefined) return "N/A";
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} crore`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)} lakh`;
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
};

const priceStudent = (student, assumptions) => {
  const ownFee = student.annualFee ?? null;
  const ownYears = student.remainingYears ?? null;

  const fee = ownFee ?? assumptions.annualFee;
  const years = ownYears ?? assumptions.yearsLeft;
  const known = fee !== null && years !== null;

  return {
    id: student.id,
    name: student.name,
    department: student.department,
    priority: student.priority,
    indicators: student.indicators.filter((item) => item !== "Outstanding fees"),
    fee,
    years,
    loss: known ? Math.round(fee * years) : null,
    source: !known ? "missing" : ownFee !== null && ownYears !== null ? "dataset" : "assumed",
  };
};

const buildFinancialMetrics = (students, totalRecords, assumptions) => {
  const flagged = students.filter((s) => s.priority === "High" || s.priority === "Medium");
  const atRisk = students.filter((s) => s.priority === "High");

  const rows = atRisk.map((student) => priceStudent(student, assumptions));
  const priced = rows.filter((row) => row.loss !== null);
  const fromDataset = priced.filter((row) => row.source === "dataset").length;

  let dataSource = "missing";
  if (atRisk.length === 0) dataSource = "none";
  else if (priced.length > 0 && fromDataset === priced.length) dataSource = "dataset";
  else if (priced.length > 0 && fromDataset === 0) dataSource = "assumed";
  else if (priced.length > 0) dataSource = "mixed";

  const estimatedLoss =
    atRisk.length === 0 ? 0 : priced.length ? priced.reduce((sum, row) => sum + row.loss, 0) : null;

  // Chart 1: loss (or number of students) by department, else by main reason.
  const hasDepartment = rows.some((row) => row.department);
  const groups = new Map();

  rows.forEach((row) => {
    if (priced.length > 0 && row.loss === null) return;

    const key = hasDepartment
      ? row.department || "Not set"
      : REASONS.find((reason) => row.indicators.includes(reason)) || "Other";

    groups.set(key, (groups.get(key) || 0) + (priced.length > 0 ? row.loss : 1));
  });

  const byLakh = priced.length > 0;
  const lossByGroup = {
    title: hasDepartment
      ? byLakh ? "Revenue at risk by department" : "Students near dropout by department"
      : byLakh ? "Revenue at risk by main reason" : "Students near dropout by main reason",
    subtitle: byLakh
      ? "Estimated amount in ₹ lakh, high-priority students only"
      : "Number of high-priority students (no fee data to price them)",
    unit: byLakh ? "lakh" : "students",
    data: [...groups.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, value]) => ({
        label,
        value: byLakh ? Number((value / 100000).toFixed(2)) : value,
      })),
  };

  // Chart 2: how many students are at each risk level.
  const riskLevels = [
    { label: "High", value: atRisk.length, note: "Near dropout" },
    { label: "Medium", value: flagged.length - atRisk.length, note: "For academic review" },
    { label: "Not flagged", value: Math.max(totalRecords - flagged.length, 0), note: "No priority flag" },
  ];

  // Table: biggest estimated losses first.
  const topStudents = [...rows]
    .sort((a, b) => (b.loss ?? -1) - (a.loss ?? -1) || b.indicators.length - a.indicators.length)
    .slice(0, 10);

  return {
    totalStudents: totalRecords,
    atRiskCount: atRisk.length,
    reviewCount: flagged.length,
    estimatedLoss,
    pricedCount: priced.length,
    unpricedCount: rows.length - priced.length,
    datasetPricedCount: fromDataset,
    dataSource,
    lossByGroup,
    riskLevels,
    topStudents,
  };
};

const buildFinancialInsights = (result, metrics, assumptions) => {
  const aiText = getTextFromResult(result, FINANCIAL_KEYS);

  let dataText;

  if (metrics.atRiskCount === 0) {
    dataText =
      "No students are flagged as high priority, so no revenue is estimated to be at risk.";
  } else if (metrics.estimatedLoss !== null) {
    dataText = `${metrics.atRiskCount} students are near dropout (high priority). Their estimated revenue at risk is ${formatInr(metrics.estimatedLoss)}.`;
  } else {
    dataText = `${metrics.atRiskCount} students are near dropout (high priority), but their revenue at risk cannot be estimated because the data has no fee columns. Enter an average fee per year and years left to see an estimate.`;
  }

  const averages =
    assumptions.annualFee !== null && assumptions.yearsLeft !== null
      ? `${formatInr(assumptions.annualFee)} per year and ${assumptions.yearsLeft} years left`
      : null;

  let method = "Estimated loss = fee per year × years left, for high-priority students only.";

  if (metrics.dataSource === "dataset") {
    method += " All values come from your uploaded dataset.";
  } else if (metrics.dataSource === "mixed") {
    method += ` Dataset values are used where they exist, and your averages (${averages}) for the rest.`;
  } else if (metrics.dataSource === "assumed") {
    method += ` It uses the averages you entered (${averages}), because the dataset has no fee columns.`;
  } else if (metrics.dataSource === "missing") {
    method += " No fee data was found, so enter your averages above.";
  }

  if (metrics.unpricedCount > 0 && metrics.pricedCount > 0) {
    method += ` ${metrics.unpricedCount} students could not be priced and are not included in the total.`;
  }

  return {
    financial: aiText ? { text: aiText, source: "ai" } : { text: dataText, source: "data" },
    method,
  };
};

// Rows for the "Export data" button: high and medium priority students.
const getFinancialRows = (students, assumptions) =>
  students
    .filter((s) => s.priority === "High" || s.priority === "Medium")
    .map((student) => {
      const row = priceStudent(student, assumptions);

      return student.priority === "High"
        ? row
        : { ...row, loss: null, source: "not estimated" };
    })
    .sort((a, b) => (b.loss ?? -1) - (a.loss ?? -1));

module.exports = {
  buildFinancialMetrics,
  buildFinancialInsights,
  getFinancialRows,
};