import React, { useEffect, useRef } from "react";

interface ImportPreviewStudent {
  firstName: string;
  lastName: string;
  class: string;
  gender: string;
  dateOfBirth: string;
  address: string;
  status: string;
}

interface BulkImportModalProps {
  isOpen: boolean;
  isImporting: boolean;
  importPreview: ImportPreviewStudent[];
  selectedFileName: string | null;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onConfirmImport: () => void;
  onDownloadTemplate: () => void;
  onCancel: () => void;
}

const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  isImporting,
  importPreview,
  selectedFileName,
  onFileUpload,
  onConfirmImport,
  onDownloadTemplate,
  onCancel,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => fileInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isImporting) onCancel();
      }}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#B8D0E8]">
        <div className="bg-[#1A3A5C] px-6 py-4 rounded-t-2xl sticky top-0 z-10">
          <h2 id="import-title" className="text-xl font-bold text-white">
            Bulk Import Students
          </h2>
        </div>
        <div className="p-6">
          <div
            id="import-instructions"
            className="bg-[#F8FAFE] border border-[#C5D8EC] rounded-lg p-4 mb-6">
            <h3 className="font-medium text-[#1A3A5C] mb-2">
              <span aria-hidden="true">📋 </span>Instructions
            </h3>
            <ul className="text-sm text-[#4A6A8A] space-y-1 list-disc list-inside">
              <li>
                Upload a <strong>CSV</strong> or <strong>Word/Text</strong> file with student data
              </li>
              <li>For CSV: Use the format from the template (download below)</li>
              <li>
                For Word/Text: Each student should be separated by &quot;---&quot; or &quot;Student
                1:&quot; etc.
              </li>
              <li>
                Required fields: <strong>firstName</strong>, <strong>lastName</strong>,{" "}
                <strong>class</strong>
              </li>
            </ul>
          </div>
          <button
            onClick={onDownloadTemplate}
            className="mb-4 text-[#2B6CB0] hover:text-[#1A3A5C] text-sm font-medium flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] rounded px-2 py-1">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Download CSV Template
          </button>
          <div className="relative border-2 border-dashed border-[#C5D8EC] rounded-lg p-6 text-center hover:border-[#2B6CB0] transition">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt,.doc,.docx"
              onChange={onFileUpload}
              className="peer sr-only"
              id="file-upload"
              aria-label="Upload students file"
              aria-describedby="import-instructions"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center gap-2 rounded-lg peer-focus:ring-2 peer-focus:ring-[#2B6CB0] peer-focus:ring-offset-2">
              <svg
                className="w-12 h-12 text-[#8A9CAE]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <span className="text-[#1A3A5C] font-medium">
                Click or press Enter to choose a file
              </span>
              <span className="text-[#8A9CAE] text-sm">CSV, Word, or Text files supported</span>
              {selectedFileName && (
                <span className="text-[#1A3A5C] text-sm font-medium mt-1">
                  Selected: {selectedFileName}
                </span>
              )}
            </label>
          </div>
          {importPreview.length > 0 && (
            <div className="mt-6">
              <h3 className="font-medium text-[#1A3A5C] mb-2">
                Preview ({importPreview.length} students found)
              </h3>
              <div className="max-h-60 overflow-y-auto border border-[#C5D8EC] rounded-lg">
                <table className="w-full text-sm">
                  <caption className="sr-only">Import preview</caption>
                  <thead className="bg-[#F8FAFE] sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-[#5A7A9A]">#</th>
                      <th className="px-3 py-2 text-left text-[#5A7A9A]">First Name</th>
                      <th className="px-3 py-2 text-left text-[#5A7A9A]">Last Name</th>
                      <th className="px-3 py-2 text-left text-[#5A7A9A]">Class</th>
                      <th className="px-3 py-2 text-left text-[#5A7A9A]">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8EEF5]">
                    {importPreview.slice(0, 10).map((student, index) => (
                      <tr key={index}>
                        <td className="px-3 py-2 text-[#4A6A8A]">{index + 1}</td>
                        <td className="px-3 py-2 text-[#4A6A8A]">{student.firstName}</td>
                        <td className="px-3 py-2 text-[#4A6A8A]">{student.lastName}</td>
                        <td className="px-3 py-2 text-[#4A6A8A]">{student.class || "-"}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${student.status === "inactive" ? "bg-yellow-100 text-yellow-800" : student.status === "graduated" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}`}>
                            {student.status || "active"}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {importPreview.length > 10 && (
                      <tr>
                        <td colSpan={5} className="px-3 py-2 text-center text-[#8A9CAE]">
                          + {importPreview.length - 10} more students
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <div className="flex gap-3 mt-6 pt-4 border-t border-[#E8EEF5]">
            <button
              type="button"
              onClick={onCancel}
              disabled={isImporting}
              className="flex-1 bg-[#E8EEF5] hover:bg-[#D5DFE8] text-[#1A3A5C] font-medium py-2.5 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/30 disabled:opacity-50">
              Cancel
            </button>
            <button
              onClick={onConfirmImport}
              disabled={importPreview.length === 0 || isImporting}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-green-500/50 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={
                isImporting
                  ? "Importing students, please wait"
                  : `Import ${importPreview.length} students`
              }>
              {isImporting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Importing...
                </span>
              ) : (
                `Import ${importPreview.length} Students`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkImportModal;
