"use client";

import React, { useRef } from "react";

interface ClassOption {
  value: string;
  label: string;
}

interface QuestionsCsvUploadModalProps {
  isOpen: boolean;
  currentFile: File | null;
  onSelectFile: (file: File | null) => void;
  onClose: () => void;
  // Changes the "will use this exam's subject and class automatically"
  // copy below, and shows/hides the class picker - a general exam has no
  // single class to inherit, so the admin must pick one for this upload.
  isGeneral: boolean;
  // The exam's own eligible classes (formData.classes) - only these are
  // offered, so a typo/mismatch can't attach a question no student on
  // this exam could ever be shown.
  classOptions: ClassOption[];
  selectedClass: string;
  onSelectedClassChange: (value: string) => void;
}

const QuestionsCsvUploadModal: React.FC<QuestionsCsvUploadModalProps> = ({
  isOpen,
  currentFile,
  onSelectFile,
  onClose,
  isGeneral,
  classOptions,
  selectedClass,
  onSelectedClassChange,
}) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="csv-upload-title">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-[#B8D0E8]">
        <div className="bg-[#1A3A5C] px-6 py-4 rounded-t-2xl">
          <h2 id="csv-upload-title" className="text-xl font-bold text-white">
            Import Questions from CSV
          </h2>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-[#4A6A8A]">
            Columns:{" "}
            <code className="text-xs bg-[#F8FAFE] px-1 py-0.5 rounded">
              text, type, marks, option1, option2, ..., optionN
            </code>
            . Use as many option columns as you need. The <strong>last</strong> option column must
            repeat the exact text of whichever earlier option is correct - it designates the answer,
            it&apos;s not a separate extra choice. Leave all option columns blank for Theory
            questions.
          </p>
          <p className="text-sm text-[#4A6A8A]">
            <strong>Optional passage columns:</strong>{" "}
            <code className="text-xs bg-[#F8FAFE] px-1 py-0.5 rounded">
              passage_key, passage_title, passage_body, passage_kind
            </code>
            . Rows that share the same <code>passage_key</code> become one shared reading passage
            (or experiment write-up, data table, etc.) with all their questions grouped under it -
            only the first row of the group needs <code>passage_title</code>/
            <code>passage_body</code> filled in, later rows just repeat the same{" "}
            <code>passage_key</code>. Leave these columns blank entirely for standalone questions.
          </p>
          <p className="text-sm text-[#4A6A8A]">
            These questions (and any passages they create) will use this exam&apos;s subject{" "}
            {isGeneral ? (
              <>
                automatically. Since this is a <strong>general exam</strong> (no single class), pick
                below which of its classes this file&apos;s questions are for - if you need
                questions for more than one class, upload the same or a different CSV again with a
                different class picked each time.
              </>
            ) : (
              <>and class automatically.</>
            )}{" "}
            The file is uploaded once you click <strong>Create Exam</strong> below - not before.
          </p>

          {isGeneral && (
            <div>
              <label htmlFor="csv-class" className="block text-sm font-medium text-[#1A3A5C] mb-1">
                Class for this file{" "}
                <span className="text-red-500" aria-hidden="true">
                  *
                </span>
              </label>
              <select
                id="csv-class"
                value={selectedClass}
                onChange={(e) => onSelectedClassChange(e.target.value)}
                className="w-full px-4 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] bg-[#F8FAFE]">
                <option value="">Select a class</option>
                {classOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {classOptions.length === 0 && (
                <p className="text-xs text-red-600 mt-1">
                  Select at least one eligible class above before uploading a CSV.
                </p>
              )}
            </div>
          )}

          <div>
            <label
              htmlFor="questions-csv"
              className="block text-sm font-medium text-[#1A3A5C] mb-1">
              CSV file
            </label>
            <input
              id="questions-csv"
              type="file"
              accept=".csv"
              onChange={(e) => onSelectFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm border border-[#C5D8EC] rounded-lg px-3 py-2 bg-[#F8FAFE]"
            />
            {currentFile && (
              <p className="text-sm text-green-700 mt-2">
                Selected: <strong>{currentFile.name}</strong>
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            {currentFile && (
              <button
                type="button"
                onClick={() => onSelectFile(null)}
                className="flex-1 bg-[#E8EEF5] hover:bg-[#D5DFE8] text-[#1A3A5C] font-medium py-2.5 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/30">
                Remove File
              </button>
            )}
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="flex-1 bg-[#1A3A5C] hover:bg-[#14304D] text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/50">
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionsCsvUploadModal;
