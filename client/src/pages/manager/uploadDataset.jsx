import React, { useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = [".csv", ".xlsx", ".xls"];

const UploadDataset = () => {
  const fileInputRef = useRef(null);

  const { token } = useAuth();

  const [isUploading, setIsUploading] = useState(false);
  const [uploadedDataset, setUploadedDataset] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const validateFile = (file) => {
    setError("");
    setMessage("");

    if (!file) return;

    const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();

    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      setError("Please select a CSV, XLSX, or XLS file.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("File size must not exceed 25 MB.");
      return;
    }

    if (file.size === 0) {
      setError("The selected file is empty.");
      return;
    }

    setSelectedFile(file);
  };

  const handleFileChange = (event) => {
    validateFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    validateFile(event.dataTransfer.files?.[0]);
  };

  const removeFile = () => {
    setSelectedFile(null);
    setUploadedDataset(null);
    setError("");
    setMessage("");
  };
  const downloadTemplate = () => {
    const headers = [
      "student_id",
      "student_name",
      "attendance_percentage",
      "exam_marks",
      "assignments_completed",
      "total_assignments",
      "fees_due",
      "fees_paid",
    ];

    const sampleRow = [
      "STU001",
      "Sample Student",
      "85",
      "78",
      "8",
      "10",
      "5000",
      "3000",
    ];

    const csvContent = [headers, sampleRow]
      .map((row) =>
        row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","),
      )
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "student-data-template.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please choose a dataset before continuing.");
      return;
    }

    if (!token) {
      setError("Your session has expired. Please log in again.");
      return;
    }

    setIsUploading(true);
    setError("");
    setMessage("");
    setUploadedDataset(null);

    try {
      const formData = new FormData();

      // This field name must match the backend upload middleware.
      formData.append("file", selectedFile);

      const response = await fetch("http://localhost:5000/api/dataset/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Dataset upload failed.");
      }

      const dataset = data.dataset || data.data;
      const datasetId = dataset?._id || data.datasetId;

      if (!datasetId) {
        throw new Error(
          "Upload response did not contain a dataset ID. Check the backend response.",
        );
      }

      setUploadedDataset({
        ...dataset,
        _id: datasetId,
      });

      setMessage(`Dataset uploaded successfully! Dataset ID: ${datasetId}`);
    } catch (err) {
      setError(err.message || "Unable to upload the dataset.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRunAnalysis = async () => {
    const datasetId = uploadedDataset?._id;

    if (!datasetId) {
      setError("Please upload a dataset before running AI analysis.");
      return;
    }

    if (!token) {
      setError("Your session has expired. Please log in again.");
      return;
    }

    setIsAnalyzing(true);
    setError("");
    setMessage("");
    setAnalysisResult(null);

    try {
      const response = await fetch(
        `http://localhost:5000/api/analysis/${encodeURIComponent(datasetId)}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "AI analysis failed.");
      }

      const result = data.analysis?.result;

      if (!result) {
        throw new Error("The analysis completed, but no result was returned.");
      }

      setAnalysisResult(result);
      setMessage("AI analysis completed successfully.");
    } catch (err) {
      setError(err.message || "Unable to analyze this dataset.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <main className="min-h-screen bg-[#f6f7fb] px-5 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-[1600px]">
        {/* Page heading */}
        <div className="mb-9">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#6177e8]">
            Data Workspace
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-[#1b3154] sm:text-[34px]">
            Upload student data
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#8190aa] sm:text-base">
            Add a student dataset to begin exploring meaningful, evidence-based
            insights.
          </p>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
          {/* Upload card */}
          <section className="min-w-0 rounded-2xl border border-[#e4e9f2] bg-white p-5 shadow-[0_3px_12px_rgba(31,49,84,0.025)] sm:p-8">
            <div className="mb-7 flex items-center gap-4">
              <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl bg-[#eef0ff] text-[#5268d8]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-7 w-7"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path
                    d="M7 18H6a4 4 0 0 1-.4-8A6.5 6.5 0 0 1 18 8a5 5 0 0 1 1 9.9"
                    strokeLinecap="round"
                  />
                  <path
                    d="M12 21V12m0 0-3.5 3.5M12 12l3.5 3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <div>
                <h2 className="text-lg font-medium text-[#1b3154] sm:text-xl">
                  Upload student dataset
                </h2>
                <p className="mt-1 text-sm text-[#8795ad]">
                  Start with a CSV, XLSX, or XLS file from your institution.
                </p>
              </div>
            </div>

            {/* File drop area */}
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                  setDragging(false);
                }
              }}
              onDrop={handleDrop}
              className={`flex min-h-[300px] flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-10 text-center transition sm:min-h-[365px] ${
                dragging
                  ? "border-[#5268d8] bg-[#eef0ff]"
                  : "border-[#b8c4fa] bg-[#fbfcff]"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
                aria-label="Choose student dataset"
              />

              {selectedFile ? (
                <>
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eaf8f2] text-[#24a783]">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-8 w-8"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path
                        d="M7 3h7l5 5v13H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
                        strokeLinejoin="round"
                      />
                      <path d="M14 3v6h5M9 14h6M9 17h6" />
                    </svg>
                  </div>

                  <h3 className="max-w-full break-all text-base font-semibold text-[#1b3154]">
                    {selectedFile.name}
                  </h3>

                  <p className="mt-2 text-sm text-[#8795ad]">
                    {formatFileSize(selectedFile.size)} · Ready to upload
                  </p>

                  <div className="mt-5 flex flex-wrap justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-lg border border-[#dce2ef] bg-white px-4 py-2.5 text-sm font-semibold text-[#5268d8] transition hover:bg-[#f3f5ff]"
                    >
                      Choose another file
                    </button>

                    <button
                      type="button"
                      onClick={removeFile}
                      className="rounded-lg border border-[#f0d8d8] bg-white px-4 py-2.5 text-sm font-semibold text-[#c45b5b] transition hover:bg-[#fff5f5]"
                    >
                      Remove file
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#eef0ff] text-[#6177e8]">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-9 w-9"
                      stroke="currentColor"
                      strokeWidth="1.7"
                    >
                      <path
                        d="M7 18H6a4 4 0 0 1-.4-8A6.5 6.5 0 0 1 18 8a5 5 0 0 1 1 9.9"
                        strokeLinecap="round"
                      />
                      <path
                        d="M12 21V12m0 0-3.5 3.5M12 12l3.5 3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

                  <h3 className="text-base font-medium text-[#1b3154] sm:text-lg">
                    Drag and drop your file here
                  </h3>

                  <p className="mt-2 text-sm text-[#8795ad]">
                    or browse from your computer to upload
                  </p>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-6 inline-flex items-center gap-3 rounded-xl bg-[#5268d8] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_4px_10px_rgba(82,104,216,0.2)] transition hover:bg-[#4358c6] focus:outline-none focus:ring-4 focus:ring-[#5268d8]/20"
                  >
                    Browse files
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-5 w-5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path
                        d="M5 12h14m-6-6 6 6-6 6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>

                  <p className="mt-5 text-xs text-[#8795ad]">
                    CSV, XLSX, XLS · Maximum file size 25 MB
                  </p>
                </>
              )}
            </div>

            {/* Error and status messages */}
            {error && (
              <div
                role="alert"
                className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            {message && (
              <div
                role="status"
                className="mt-4 rounded-lg border border-[#bcebd9] bg-[#effaf5] px-4 py-3 text-sm text-[#218b6d]"
              >
                {message}
              </div>
            )}

            {/* Continue button - frontend only */}
            {selectedFile && (
              <div className="mt-7 flex flex-col-reverse gap-3 border-t border-[#edf0f6] pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={removeFile}
                  className="rounded-xl border border-[#dce2ef] bg-white px-5 py-3 text-sm font-semibold text-[#66758e] hover:bg-[#f8f9fc]"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={isUploading || Boolean(uploadedDataset)}
                  className="rounded-xl bg-[#5268d8] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4358c6] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isUploading
                    ? "Uploading dataset..."
                    : uploadedDataset
                      ? "Dataset uploaded"
                      : "Continue with dataset"}
                </button>
              </div>
            )}
          </section>

          {/* Information cards */}
          <aside className="flex flex-col gap-6">
            {/* Responsible analysis */}
            <section className="rounded-2xl border border-[#e4e9f2] bg-white p-6 shadow-[0_3px_12px_rgba(31,49,84,0.025)] sm:p-7">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#e7f7f1] text-[#36a98c]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-7 w-7"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path
                    d="M12 3 20 6v5c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6l8-3Z"
                    strokeLinejoin="round"
                  />
                  <path
                    d="m9 12 2 2 4-4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <h2 className="text-base font-medium text-[#1b3154] sm:text-lg">
                Built for responsible analysis
              </h2>

              <p className="mt-3 text-sm leading-[1.8] text-[#8291a9]">
                Your data is reviewed against predefined analysis instructions
                configured by your administrator. Insights are intended to
                support, not replace, human judgment.
              </p>

              <div className="my-5 border-t border-[#e9edf4]" />

              <ul className="space-y-4">
                {[
                  "No separate behavior dataset needed",
                  "Financial insights only when data exists",
                  "Human review remains essential",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="mt-0.5 h-5 w-5 shrink-0 text-[#29b18c]"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        d="m5 12 4 4L19 6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="text-sm leading-6 text-[#71819a]">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Upload guidance */}
            <section className="rounded-2xl border border-[#e4e9f2] bg-white p-6 shadow-[0_3px_12px_rgba(31,49,84,0.025)] sm:p-7">
              <div className="mb-3 flex items-center gap-3">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-7 w-7 shrink-0 text-[#6177e8]"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path
                    d="M9.7 9a2.4 2.4 0 1 1 4.1 1.7c-1.1 1-1.8 1.4-1.8 3"
                    strokeLinecap="round"
                  />
                  <path d="M12 17h.01" strokeLinecap="round" />
                </svg>

                <h2 className="text-sm font-semibold text-[#1b3154] sm:text-base">
                  What data can I upload?
                </h2>
              </div>

              <p className="text-sm leading-6 text-[#8291a9]">
                Student IDs, attendance, marks, assignments, and other available
                indicators. Include financial columns only if relevant and
                authorized.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
};

export default UploadDataset;
