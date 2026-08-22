"use client";

import React, { useRef } from "react";
import Modal from "@/components/ui/Modal";
import SelectField from "@/components/ui/form/SelectField";
import { useTeacherQuestionsStore } from "@/store/useTeacherQuestionsStore";
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
          className="bg-[#F8FAFE] border border-[#C5D8EC] rounded-lg p-4 text-sm text-[#4A6A8A]">
          Upload a CSV with columns <code className="font-mono">type</code>,{" "}
          <code className="font-mono">text</code>, <code className="font-mono">marks</code>, and for
          Objective questions <code className="font-mono">option1…optionN</code> (last option column
          is the correct answer). All rows are imported to the same subject and class you pick below.
        </div>

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
