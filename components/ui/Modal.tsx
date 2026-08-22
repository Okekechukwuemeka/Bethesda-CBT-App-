"use client";

import React, { useEffect, useRef } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  disableClose?: boolean;
  // "md" (448px) fits short forms - name/email/single-line fields. "2xl"
  // (672px) is for anything with side-by-side fields, option rows, file
  // pickers, or tables inside it (matches the width the admin question
  // modals use, since they're built from the same kind of content).
  maxWidth?: "md" | "2xl";
}

const MAX_WIDTH_CLASSES: Record<NonNullable<ModalProps["maxWidth"]>, string> = {
  md: "max-w-md",
  "2xl": "max-w-2xl max-h-[90vh] overflow-y-auto",
};

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  disableClose = false,
  maxWidth = "md",
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !disableClose) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, disableClose, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;

    const handleTrap = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !modalRef.current) return;

      const focusable = modalRef.current.querySelectorAll<HTMLElement>(
        'button, input, a[href], [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleTrap);
    return () => document.removeEventListener("keydown", handleTrap);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget && !disableClose) onClose();
      }}>
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`bg-white rounded-2xl shadow-2xl ${MAX_WIDTH_CLASSES[maxWidth]} w-full p-6 border border-[#B8D0E8] relative`}>
        <div className="bg-[#1A3A5C] -mx-6 -mt-6 px-6 py-4 rounded-t-2xl">
          <h2 id="modal-title" className="text-xl font-bold text-white">
            {title}
          </h2>
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
