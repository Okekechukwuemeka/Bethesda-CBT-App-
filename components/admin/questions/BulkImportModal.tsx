import React, { useRef, useEffect } from "react";
import type { RowError, Subject } from "@/types/question";
import { CLASS_LEVELS } from "@/lib/models/constants";

interface BulkImportModalProps {
  isOpen: boolean;
  isImporting: boolean;
  selectedFileName: string | null;
  previewRowCount: number | null;
  subjects: Subject[];
  isLoadingSubjects: boolean;
  importSubject: string;
  importClass: string;
  importError: string | null;
  importRowErrors: RowError[] | null;
  onSubjectChange: (value: string) => void;
  onClassChange: (value: string) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onConfirmImport: () => void;
  onDownloadTemplate: () => void;
  onCancel: () => void;
}

const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  isImporting,
  selectedFileName,
  previewRowCount,
  subjects,
  isLoadingSubjects,
  importSubject,
  importClass,
  importError,
  importRowErrors,
  onSubjectChange,
  onClassChange,
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

  const canImport =
    !!selectedFileName && !!importSubject && !!importClass && !isImporting && previewRowCount !== 0;

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
            Bulk Import Questions
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
                Choose the subject and class the whole file applies to, then upload a{" "}
                <strong>CSV</strong> file
              </li>
              <li>
                CSV columns:{" "}
                <code>text, type, marks, optionA, optionB, optionC, optionD, correctAnswer</code>
              </li>
              <li>
                <code>type</code> must be exactly “Objective” or “Theory”; leave the option and
                correctAnswer columns blank for Theory rows
              </li>
            </ul>
          </div>

          {importError && (
            <div
              role="alert"
              aria-live="assertive"
              className="p-3 mb-4 rounded-lg text-sm font-medium bg-red-100 text-red-800 border border-red-300">
              {importError}
            </div>
          )}

          {importRowErrors && importRowErrors.length > 0 && (
            <div
              role="alert"
              aria-live="assertive"
              className="p-3 mb-4 rounded-lg text-sm bg-red-100 text-red-800 border border-red-300">
              <p className="font-medium mb-1">
                {importRowErrors.length} row{importRowErrors.length !== 1 ? "s" : ""} need fixing
                before anything can be imported:
              </p>
              <ul className="list-disc list-inside space-y-0.5">
                {importRowErrors.map((rowError) => (
                  <li key={rowError.row}>
                    Row {rowError.row}: {rowError.error}
                  </li>
                ))}
              </ul>
            </div>
          )}

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label
                htmlFor="import-subject"
                className="block text-sm font-medium text-[#1A3A5C] mb-1">
                Subject{" "}
                <span className="text-red-500" aria-hidden="true">
                  *
                </span>
              </label>
              <select
                id="import-subject"
                value={importSubject}
                onChange={(e) => onSubjectChange(e.target.value)}
                disabled={isLoadingSubjects}
                aria-required="true"
                className="w-full px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] bg-[#F8FAFE] disabled:opacity-60">
                <option value="">
                  {isLoadingSubjects ? "Loading subjects…" : "Select a subject"}
                </option>
                {subjects.map((subject) => (
                  <option key={subject._id} value={subject._id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="import-class"
                className="block text-sm font-medium text-[#1A3A5C] mb-1">
                Class{" "}
                <span className="text-red-500" aria-hidden="true">
                  *
                </span>
              </label>
              <select
                id="import-class"
                value={importClass}
                onChange={(e) => onClassChange(e.target.value)}
                aria-required="true"
                className="w-full px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] bg-[#F8FAFE]">
                <option value="">Select a class</option>
                {CLASS_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="relative border-2 border-dashed border-[#C5D8EC] rounded-lg p-6 text-center hover:border-[#2B6CB0] transition">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={onFileUpload}
              className="peer sr-only"
              id="file-upload"
              aria-label="Upload questions CSV file"
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
                Click or press Enter to choose a CSV file
              </span>
              {selectedFileName && (
                <span className="text-[#1A3A5C] text-sm font-medium mt-1">
                  Selected: {selectedFileName}
                  {previewRowCount !== null && ` (${previewRowCount} rows detected)`}
                </span>
              )}
            </label>
          </div>

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
              disabled={!canImport}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-green-500/50 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={isImporting ? "Importing questions, please wait" : "Import questions"}>
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
                "Import Questions"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkImportModal;
