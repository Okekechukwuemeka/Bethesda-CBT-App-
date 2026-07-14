"use client";

import React, { useEffect, useRef } from "react";

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  isDangerous?: boolean; // red confirm button, for delete-type actions
  isProcessing?: boolean;
  onConfirm: () => void;

  onCancel?: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isDangerous = false,
  isProcessing = false,
  onConfirm,
  onCancel,
}) => {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const hasCancel = typeof onCancel === "function";

  useEffect(() => {
    if (isOpen) {
      setTimeout(
        () => (hasCancel ? cancelButtonRef.current : confirmButtonRef.current)?.focus(),
        100,
      );
    }
  }, [isOpen, hasCancel]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isProcessing && hasCancel) onCancel!();
      if (e.key === "Tab") {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isProcessing, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description">
      <div
        ref={dialogRef}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-[#B8D0E8]">
        <div className="p-6">
          <h2 id="confirm-dialog-title" className="text-lg font-bold text-[#1A3A5C]">
            {title}
          </h2>
          <div id="confirm-dialog-description" className="mt-2 text-sm text-[#4A6A8A]">
            {description}
          </div>

          <div className="flex gap-3 mt-6">
            {hasCancel && (
              <button
                ref={cancelButtonRef}
                type="button"
                onClick={onCancel}
                disabled={isProcessing}
                className="flex-1 bg-[#E8EEF5] hover:bg-[#D5DFE8] text-[#1A3A5C] font-medium py-2.5 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/30 disabled:opacity-50">
                {cancelLabel}
              </button>
            )}
            <button
              ref={confirmButtonRef}
              type="button"
              onClick={onConfirm}
              disabled={isProcessing}
              className={`flex-1 font-medium py-2.5 px-4 rounded-lg transition duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 disabled:opacity-50 ${
                isDangerous
                  ? "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500/50"
                  : "bg-[#1A3A5C] hover:bg-[#14304D] text-white focus:ring-[#2B6CB0]/50"
              }`}>
              {isProcessing ? "Please wait…" : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
