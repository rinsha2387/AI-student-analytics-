// Pure helpers for the Analysis history page (no database code here).

const formatDisplayId = (number) => `AI-${String(number).padStart(4, "0")}`;

const asId = (value) => String(value?._id || value || "");

// Builds one row per analysis and gives each one a friendly ID (AI-0001, ...).
// The numbers follow the order in which the analyses were created.
const buildHistoryItems = ({
  analyses,
  datasets,
  creators,
  analysisOwnerField,
  datasetOwnerField,
}) => {
  const datasetById = new Map(datasets.map((d) => [String(d._id), d]));
  const creatorById = new Map(creators.map((u) => [String(u._id), u.name]));

  const items = analyses.map((analysis) => {
    const datasetId = asId(analysis.dataset);
    const dataset = datasetById.get(datasetId);

    const ownerRef = analysisOwnerField
      ? analysis[analysisOwnerField]
      : dataset && datasetOwnerField
        ? dataset[datasetOwnerField]
        : null;

    const date = analysis.completedAt || analysis.updatedAt || analysis.createdAt || null;

    return {
      analysisId: String(analysis._id),
      datasetId,
      datasetName: dataset?.name || dataset?.originalFileName || "Dataset",
      fileName: dataset?.originalFileName || "",
      date,
      students: dataset?.studentCount ?? 0,
      status: "completed",
      createdBy: creatorById.get(asId(ownerRef)) || "Unknown",
      sortTime: new Date(analysis.createdAt || date || 0).getTime(),
    };
  });

  // Oldest first, so the numbering stays the same when new analyses are added.
  items.sort(
    (a, b) => a.sortTime - b.sortTime || a.analysisId.localeCompare(b.analysisId),
  );

  items.forEach((item, index) => {
    item.displayId = formatDisplayId(index + 1);
  });

  return items;
};

// Search, sort and page the rows. `items` must be oldest first.
const filterSortPaginate = (items, query = {}) => {
  const search = String(query.search || "").trim().toLowerCase();

  let list = items;

  if (search) {
    list = list.filter((item) =>
      [item.displayId, item.analysisId, item.datasetName, item.fileName, item.createdBy].some(
        (value) => String(value).toLowerCase().includes(search),
      ),
    );
  }

  list = query.sort === "oldest" ? [...list] : [...list].reverse();

  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 5, 1), 50);
  const total = list.length;
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  const page = Math.min(Math.max(parseInt(query.page, 10) || 1, 1), totalPages);

  return {
    items: list.slice((page - 1) * limit, page * limit),
    pagination: { page, limit, total, totalPages },
  };
};

module.exports = { buildHistoryItems, filterSortPaginate, formatDisplayId };