"use client";

import React, { useState, useEffect, useRef } from "react";

export interface BulkImportCredential {
  name: string;
  admissionNo: string;
  password: string;
}

export interface BulkImportFailure {
  row: number;
  error: string;
}

export interface BulkImportResults {
  created: BulkImportCredential[];
  failures: BulkImportFailure[];
}

interface BulkImportResultsModalProps {
  isOpen: boolean;
  results: BulkImportResults | null;
  onClose: () => void;
}

// Same reasoning as StudentCreatedModal - these passwords exist only in
// this moment, nowhere else, ever. The difference here is scale: copying
// twenty rows one at a time isn't realistic, so this adds a CSV download
// and a single "copy all" action alongside the visible table.
const BulkImportResultsModal: React.FC<BulkImportResultsModalProps> = ({
  isOpen,
  results,
  onClose,
}) => {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const liveRegionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => closeButtonRef.current?.focus(), 100);
      setCopyState("idle");
    }
  }, [isOpen]);

  if (!isOpen || !results) return null;

  const { created, failures } = results;

  const asText = (rows: BulkImportCredential[]) =>
    rows.map((r) => `${r.name}\t${r.admissionNo}\t${r.password}`).join("\n");

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(asText(created));
      setCopyState("copied");
    } catch {
      setCopyState("failed");
      if (liveRegionRef.current) {
        liveRegionRef.current.textContent =
          "Couldn't copy automatically - use the CSV download instead, or select the table manually.";
      }
    }
  };

  const downloadCsv = () => {
    const header = "Name,Admission Number,Temporary Password";
    const rows = created.map((r) => `"${r.name}","${r.admissionNo}","${r.password}"`);
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `student-credentials-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="bulk-results-title"
      aria-describedby="bulk-results-summary">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-[#B8D0E8]">
        <div className="bg-green-700 px-6 py-4 rounded-t-2xl sticky top-0 z-10">
          <h2 id="bulk-results-title" className="text-xl font-bold text-white">
            Bulk Import Complete
          </h2>
        </div>

        <div className="p-6 space-y-5">
          <p id="bulk-results-summary" className="text-[#1A3A5C]">
            <span className="font-semibold">{created.length}</span> student
            {created.length === 1 ? "" : "s"} created
            {failures.length > 0 && (
              <>
                , <span className="font-semibold text-red-700">{failures.length}</span> row
                {failures.length === 1 ? "" : "s"} failed
              </>
            )}
            . <strong>These passwords will not be shown again after you close this window</strong> —
            download or copy them now.
          </p>

          {created.length > 0 && (
            <>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={downloadCsv}
                  className="text-sm px-3 py-2 rounded-lg bg-[#1A3A5C] text-white font-medium hover:bg-[#14304D] focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]">
                  Download CSV
                </button>
                <button
                  type="button"
                  onClick={copyAll}
                  className="text-sm px-3 py-2 rounded-lg border border-[#2B6CB0] text-[#2B6CB0] font-medium hover:bg-[#E8F0FE] focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]">
                  {copyState === "copied" ? "Copied all to clipboard" : "Copy all to clipboard"}
                </button>
              </div>

              <div ref={liveRegionRef} role="status" aria-live="polite" className="sr-only">
                {copyState === "copied" &&
                  `Copied credentials for ${created.length} student${created.length === 1 ? "" : "s"} to clipboard.`}
              </div>

              <div className="border border-[#C5D8EC] rounded-lg overflow-hidden max-h-80 overflow-y-auto">
                <table className="w-full text-sm">
                  <caption className="sr-only">
                    Newly created students with their admission number and temporary password
                  </caption>
                  <thead className="bg-[#F8FAFE] border-b border-[#E8EEF5] sticky top-0">
                    <tr>
                      <th scope="col" className="text-left py-2 px-4 text-[#5A7A9A] font-medium">
                        Name
                      </th>
                      <th scope="col" className="text-left py-2 px-4 text-[#5A7A9A] font-medium">
                        Admission No.
                      </th>
                      <th scope="col" className="text-left py-2 px-4 text-[#5A7A9A] font-medium">
                        Temporary Password
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8EEF5]">
                    {created.map((row) => (
                      <tr key={row.admissionNo}>
                        <td className="py-2 px-4 text-[#1A3A5C]">{row.name}</td>
                        <td className="py-2 px-4 font-mono text-[#1A3A5C] select-all">
                          {row.admissionNo}
                        </td>
                        <td className="py-2 px-4 font-mono text-[#1A3A5C] select-all">
                          {row.password}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {failures.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-red-700 mb-2">
                Rows that failed to import
              </h3>
              <ul className="border border-red-200 bg-red-50 rounded-lg divide-y divide-red-200 max-h-40 overflow-y-auto">
                {failures.map((f) => (
                  <li key={f.row} className="px-4 py-2 text-sm text-red-800">
                    Row {f.row}: {f.error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-xs text-[#8A9CAE]">
            Each student must change their password the first time they log in.
          </p>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="w-full bg-[#1A3A5C] hover:bg-[#14304D] text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/50">
            I&apos;ve saved these details — Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkImportResultsModal;
