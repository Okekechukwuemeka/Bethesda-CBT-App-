"use client";

import Modal from "@/components/ui/Modal";
import React, { useEffect, useRef } from "react";

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  examTitle: string;
  examSubject: string;
  examClass: string;
  isSubmitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  isOpen,
  examTitle,
  examSubject,
  examClass,
  isSubmitting,
  onConfirm,
  onCancel,
}) => {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      confirmButtonRef.current?.focus();
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title="Delete Exam" disableClose={isSubmitting}>
      <p className="text-[#4A6A8A] mb-4">
        Are you sure you want to delete <strong>{examTitle}</strong>?
      </p>

      <div className="bg-[#F8FAFE] border border-[#C5D8EC] rounded-lg p-4 mb-4">
        <p className="text-sm text-[#4A6A8A]">
          <span className="font-medium">Subject:</span> {examSubject}
        </p>
        <p className="text-sm text-[#4A6A8A]">
          <span className="font-medium">Class:</span> {examClass}
        </p>
        <p className="text-sm text-[#4A6A8A]">
          <span className="font-medium">Questions:</span> This will delete all questions associated
          with this exam
        </p>
      </div>

      <p className="text-sm text-red-600 mb-4">
        <span aria-hidden="true">⚠️ </span>
        This action cannot be undone. All student results and data for this exam will be permanently
        deleted.
      </p>

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 bg-[#E8EEF5] hover:bg-[#D5DFE8] text-[#1A3A5C] font-medium py-2.5 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/30 disabled:opacity-50">
          Cancel
        </button>
        <button
          ref={confirmButtonRef}
          onClick={onConfirm}
          disabled={isSubmitting}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-red-500/50 active:scale-[0.98] disabled:opacity-50">
          {isSubmitting ? "Deleting..." : "Yes, Delete"}
        </button>
      </div>
    </Modal>
  );
};

export default DeleteConfirmDialog;
