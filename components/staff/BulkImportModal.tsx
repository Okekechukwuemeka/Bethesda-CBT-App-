"use client";

import React, { useRef } from "react";
import Modal from "@/components/ui/Modal";
import SelectField from "@/components/ui/form/SelectField";
import { useTeacherQuestionsStore } from "@/store/useTeacherQuestionsStore";
import { downloadQuestionTemplate } from "@/lib/questionCsvTemplate";
import type { AssignedSubject } from "@/types/staff";

interface BulkImportModalProps {
  subjects: AssignedSubject[];
  classes: string[];
}

const BulkImportModal: React.FC<BulkImportModalProps> = ({ subjects, classes }) => {
  const {
    isImportModalOpen,
    importSubject,
    importClass,
    isImporting,
    importError,
    importRowErrors,
    selectedFile,
    setImportSubject,
    setImportClass,
    setSelectedFile,
    confirmImport,
    closeImportModal,
  } = useTeacherQuestionsStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <Modal
      isOpen={isImportModalOpen}
      onClose={closeImportModal}
      title="Bulk Import Questions"
      disableClose={isImporting}
      maxWidth="2xl">
      <div className="space-y-4">
        <div
          id="import-instructions"
          className="bg-[#F8FAFE] border border-[#C5D8EC] rounded-lg p-4">
          <h3 className="font-medium text-[#1A3A5C] mb-2">
            <span aria-hidden="true">📋 </span>Instructions
          </h3>
          <ul className="text-sm text-[#4A6A8A] space-y-1 list-disc list-inside">
            <li>
              Choose the subject and class the whole file applies to, then upload a{" "}
              <strong>CSV</strong> file
            </li>
            <li>
              CSV columns: <code>text, type, marks, option1, option2, ..., optionN</code>. Use as
              many option columns as you need.
            </li>
            <li>
              The <strong>last</strong> option column must repeat the exact text of whichever
              earlier option is correct - it designates the answer, it&apos;s not a separate extra
              choice.
            </li>
            <li>
              <code>type</code> must be exactly “Objective” or “Theory”; leave all option columns
              blank for Theory rows
            </li>
            <li>
              <strong>Optional passage columns:</strong>{" "}
              <code>passage_key, passage_title, passage_body, passage_kind</code>. Rows that share
              the same <code>passage_key</code> become one shared reading passage (or experiment
              write-up, data table, etc.) with all their questions grouped under it - only the
              first row of the group needs <code>passage_title</code>/<code>passage_body</code>{" "}
              filled in, later rows just repeat the same <code>passage_key</code>
            </li>
            <li>
              Leave the passage columns blank entirely for a standalone question - they&apos;re
              optional and don&apos;t affect rows that don&apos;t use them
            </li>
          </ul>
        </div>

        <button
          type="button"
          onClick={() => downloadQuestionTemplate()}
          className="text-[#2B6CB0] hover:text-[#1A3A5C] text-sm font-medium flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] rounded px-2 py-1">
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="import-subject" className="block text-sm font-medium text-[#1A3A5C] mb-1">
              Subject
            </label>
            <SelectField
              id="import-subject"
              value={importSubject}
              onChange={(e) => setImportSubject(e.target.value)}
              disabled={isImporting}
              options={[
                { value: "", label: "Select subject" },
                ...subjects.map((s) => ({ value: s.id, label: s.name })),
              ]}
            />
          </div>
          <div>
            <label htmlFor="import-class" className="block text-sm font-medium text-[#1A3A5C] mb-1">
              Class
            </label>
            <SelectField
              id="import-class"
              value={importClass}
              onChange={(e) => setImportClass(e.target.value)}
              disabled={isImporting}
              options={[
                { value: "", label: "Select class" },
                ...classes.map((c) => ({ value: c, label: c })),
              ]}
            />
          </div>
        </div>

        <div>
          <label htmlFor="import-file" className="block text-sm font-medium text-[#1A3A5C] mb-1">
            CSV File
          </label>
          <input
            ref={fileInputRef}
            id="import-file"
            type="file"
            accept=".csv"
            aria-describedby="import-instructions"
            onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
            disabled={isImporting}
            className="w-full text-sm text-[#4A6A8A] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#1A3A5C] file:text-white file:font-medium hover:file:bg-[#14304D] disabled:opacity-50"
          />
          {selectedFile && (
            <p className="text-xs text-[#5A7A9A] mt-1">Selected: {selectedFile.name}</p>
          )}
        </div>

        {importError && (
          <div role="alert" className="p-3 rounded-lg text-sm font-medium bg-red-100 text-red-800 border border-red-300">
            {importError}
          </div>
        )}

        {importRowErrors.length > 0 && (
          <div className="max-h-40 overflow-y-auto border border-red-200 rounded-lg">
            <table className="w-full text-xs">
              <thead className="bg-red-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-red-800">Row</th>
                  <th className="px-3 py-2 text-left font-medium text-red-800">Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-100">
                {importRowErrors.map((e, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 text-red-700">{e.row}</td>
                    <td className="px-3 py-2 text-red-700">{e.error}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={closeImportModal}
            disabled={isImporting}
            className="flex-1 bg-[#E8EEF5] hover:bg-[#D5DFE8] text-[#1A3A5C] font-medium py-2.5 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/30 disabled:opacity-50">
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmImport}
            disabled={isImporting}
            className="flex-1 bg-[#1A3A5C] hover:bg-[#14304D] text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/50 disabled:opacity-50">
            {isImporting ? "Importing…" : "Import"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default BulkImportModal;