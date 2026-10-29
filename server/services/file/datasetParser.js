const XLSX = require("xlsx");

const normalizeHeader = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const parseDataset = (filePath) => {
  const workbook = XLSX.readFile(filePath, {
    cellDates: false,
  });

  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error("The uploaded file does not contain a worksheet.");
  }

  const worksheet = workbook.Sheets[firstSheetName];

  // Read rows as arrays so the header row can be checked explicitly.
  const rows = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: "",
    raw: false,
    blankrows: false,
  });

  if (!rows.length) {
    throw new Error("The uploaded file is empty.");
  }

  const headerRow = rows[0];

  if (!Array.isArray(headerRow) || headerRow.length === 0) {
    throw new Error("The uploaded file does not contain column headers.");
  }

  const columns = headerRow.map((header) => String(header ?? "").trim());

  if (columns.every((column) => !column)) {
    throw new Error("The uploaded file does not contain column headers.");
  }

  const blankHeaders = [];

  columns.forEach((column, index) => {
    if (!column) {
      blankHeaders.push(index + 1);
    }
  });

  if (blankHeaders.length) {
    throw new Error(
      `Column header(s) are blank at position(s): ${blankHeaders.join(", ")}. Please add a name to every column.`
    );
  }

  const seenHeaders = new Set();
  const duplicateHeaders = new Set();

  for (const column of columns) {
    const normalized = normalizeHeader(column);

    if (seenHeaders.has(normalized)) {
      duplicateHeaders.add(column);
    }

    seenHeaders.add(normalized);
  }

  if (duplicateHeaders.size) {
    throw new Error(
      `Duplicate column headers found: ${[...duplicateHeaders].join(", ")}. Please rename duplicate columns.`
    );
  }

  const dataRows = rows.slice(1).filter((row) =>
    row.some((value) => String(value ?? "").trim() !== "")
  );

  if (!dataRows.length) {
    throw new Error("The uploaded file has no student data rows.");
  }

  const records = dataRows.map((row) => {
    const record = {};

    columns.forEach((column, index) => {
      const value = row[index] ?? "";
      record[column] =
        typeof value === "string" ? value.trim() : value;
    });

    return record;
  });

  return {
    columns,
    records,
    totalRows: records.length,
  };
};

module.exports = { parseDataset };