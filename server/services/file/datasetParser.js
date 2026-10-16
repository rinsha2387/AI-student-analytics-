
const XLSX = require("xlsx");

const parseDataset = (filePath) => {
  const workbook = XLSX.readFile(filePath, {
    cellDates: false,
  });

  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error("The uploaded file does not contain a worksheet.");
  }

  const worksheet = workbook.Sheets[firstSheetName];

  const rawRows = XLSX.utils.sheet_to_json(worksheet, {
    defval: "",
    raw: false,
  });

  if (rawRows.length === 0) {
    throw new Error("The uploaded file has no student data rows.");
  }

  const columns = Object.keys(rawRows[0]);

  if (columns.length === 0) {
    throw new Error("The uploaded file does not contain column headers.");
  }

  const normalizedRows = rawRows.map((row) => {
    const normalizedRow = {};

    for (const [key, value] of Object.entries(row)) {
      const cleanKey = key.trim();

      if (!cleanKey) continue;

      normalizedRow[cleanKey] =
        typeof value === "string" ? value.trim() : value;
    }

    return normalizedRow;
  });

  return {
    columns,
    records: normalizedRows,
    totalRows: normalizedRows.length,
  };
};

module.exports = { parseDataset };
