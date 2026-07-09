"use client";

import { useEffect } from "react";

/**
 * Traps Tab/Shift+Tab focus inside a modal dialog, closes it on Escape, and
 * returns focus to whatever element triggered it once it closes.
 *
 * Usage:
 *   const modalRef = useRef<HTMLDivElement>(null);
 *   const triggerRef = useRef<HTMLElement | null>(null);
 *   useModalFocusTrap(isOpen, modalRef, triggerRef, closeFn, canClose);
 *
 * Also mark the rest of the page `inert` while the modal is open (wrap your
 * main content in `<div inert={isOpen ? "" : undefined}>`), since this hook
 * only stops keyboard focus from leaving the dialog — it doesn't remove
 * background content from the accessibility tree by itself.
 */
export function useModalFocusTrap(
  isOpen: boolean,
  modalRef: React.RefObject<HTMLElement | null>,
  triggerRef: React.RefObject<HTMLElement | null>,
  onClose: () => void,
  canClose: boolean,
) {
  useEffect(() => {
    if (!isOpen) return;
    const modalEl = modalRef.current;
    if (!modalEl) return;

    const focusableSelector =
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const getFocusable = () =>
      Array.from(modalEl.querySelectorAll<HTMLElement>(focusableSelector)).filter(
        (el) => el.offsetParent !== null,
      );

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && canClose) {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const focusable = getFocusable();
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

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      triggerRef.current?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, canClose]);
}
