"use client";

import React, { useRef } from "react";

interface QuestionsCsvUploadModalProps {
  isOpen: boolean;
  currentFile: File | null;
  onSelectFile: (file: File | null) => void;
  onClose: () => void;
}

const QuestionsCsvUploadModal: React.FC<QuestionsCsvUploadModalProps> = ({
  isOpen,
  currentFile,
  onSelectFile,
  onClose,
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
            These questions will use this exam&apos;s subject and class automatically. The file is
            uploaded once you click <strong>Create Exam</strong> below - not before.
          </p>

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
