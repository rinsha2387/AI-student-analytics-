const XLSX = require("xlsx");

const {
  normalizeHeader,
  detectColumnMappings,
  toNumericValue,
} = require("./columnMapper");

const NUMERIC_FIELDS = [
  "attendance_percentage",
  "exam_marks",
  "assignments_completed",
  "total_assignments",
  "fees_due",
  "fees_paid",
  "total_fees",
];

const parseDataset = (filePath) => {
  // 1. Read the uploaded Excel or CSV file.
  const workbook = XLSX.readFile(filePath, {
    cellDates: false,
  });

  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error(
      "The uploaded file does not contain a worksheet."
    );
  }

  const worksheet = workbook.Sheets[firstSheetName];

  const rows = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: "",
    raw: false,
    blankrows: false,
  });

  if (!rows.length) {
    throw new Error("The uploaded file is empty.");
  }

  // 2. Read and validate column headers.
  const headerRow = rows[0];

  if (!Array.isArray(headerRow) || headerRow.length === 0) {
    throw new Error(
      "The uploaded file does not contain column headers."
    );
  }

  const columns = headerRow.map((header) =>
    String(header ?? "").trim()
  );

  if (columns.every((column) => !column)) {
    throw new Error(
      "The uploaded file does not contain column headers."
    );
  }

  const blankHeaders = [];

  columns.forEach((column, index) => {
    if (!column) {
      blankHeaders.push(index + 1);
    }
  });

  if (blankHeaders.length) {
    throw new Error(
      `Column header(s) are blank at position(s): ${blankHeaders.join(
        ", "
      )}. Please add a name to every column.`
    );
  }

  // 3. Reject duplicate column headers.
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
      `Duplicate column headers found: ${[
        ...duplicateHeaders,
      ].join(", ")}. Please rename duplicate columns.`
    );
  }

  // 4. Remove completely empty student rows.
  const dataRows = rows.slice(1).filter((row) =>
    row.some((value) => String(value ?? "").trim() !== "")
  );

  if (!dataRows.length) {
    throw new Error(
      "The uploaded file has no student data rows."
    );
  }

  // 5. Preserve the original student records.
  const originalRecords = dataRows.map((row) => {
    const record = {};

    columns.forEach((column, index) => {
      const value = row[index] ?? "";

      record[column] =
        typeof value === "string"
          ? value.trim()
          : value;
    });

    return record;
  });

  // 6. Automatically recognize different column names.
  const {
    mappings: columnMappings,
    ambiguousMappings,
  } = detectColumnMappings(columns);

  // 7. Add standardized fields for AI analysis.
  // Original column names and values are preserved.
  const records = originalRecords.map(
    (originalRecord, index) => {
      const standardizedRecord = {
        ...originalRecord,
        record_number: index + 1,
      };

      for (const [standardField, originalColumn] of Object.entries(
        columnMappings
      )) {
        const originalValue = originalRecord[originalColumn];

        if (NUMERIC_FIELDS.includes(standardField)) {
          standardizedRecord[standardField] =
            toNumericValue(originalValue);
        } else {
          standardizedRecord[standardField] =
            originalValue === ""
              ? null
              : originalValue;
        }
      }

      return standardizedRecord;
    }
  );

  // 8. Return original columns, mappings, and standardized records.
  return {
    columns,
    records,
    originalRecords,
    totalRows: records.length,
    columnMappings,
    ambiguousMappings,
  };
};

module.exports = {
  parseDataset,
};
