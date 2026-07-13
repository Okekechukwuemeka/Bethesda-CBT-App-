"use client";

import React, { useState, useEffect, useRef } from "react";

export interface CreatedStudentInfo {
  name: string;
  admissionNo: string;
  tempPassword: string;
}

interface StudentCreatedModalProps {
  isOpen: boolean;
  student: CreatedStudentInfo | null;
  onClose: () => void;
}

// This is deliberately NOT a toast. The temporary password only exists in
// the API response for this one moment - once this dialog closes, it's
// gone (only the bcrypt hash persists server-side). A toast can be missed
// entirely by a screen reader user if focus is elsewhere when it appears;
// role="alertdialog" + moving focus into the dialog guarantees it's
// announced and requires a deliberate action to dismiss.
const StudentCreatedModal: React.FC<StudentCreatedModalProps> = ({ isOpen, student, onClose }) => {
  const [copiedField, setCopiedField] = useState<"admission" | "password" | "both" | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const liveRegionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Focus the close button (not a generic dialog container) so a
      // screen reader user lands somewhere immediately actionable, right
      // after the credential text has been read out via aria-describedby.
      setTimeout(() => closeButtonRef.current?.focus(), 100);
      setCopiedField(null);
    }
  }, [isOpen]);

  if (!isOpen || !student) return null;

  const copy = async (text: string, field: "admission" | "password" | "both") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
    } catch {
      // Clipboard API can fail (permissions, insecure context) - the text
      // is still fully visible and selectable, so this isn't a dead end.
      setCopiedField(null);
      if (liveRegionRef.current) {
        liveRegionRef.current.textContent =
          "Couldn't copy automatically - please select and copy the text manually.";
      }
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="created-modal-title"
      aria-describedby="created-modal-credentials">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-[#B8D0E8]">
        <div className="bg-green-700 px-6 py-4 rounded-t-2xl">
          <h2 id="created-modal-title" className="text-xl font-bold text-white">
            Student Added Successfully
          </h2>
        </div>

        <div className="p-6 space-y-5">
          <p className="text-[#1A3A5C]">
            <span className="font-semibold">{student.name}</span> has been added. Share these
            sign-in details with the student now —{" "}
            <strong>the password will not be shown again after you close this window.</strong>
          </p>

          <dl
            id="created-modal-credentials"
            className="space-y-4 bg-[#F8FAFE] border border-[#C5D8EC] rounded-lg p-4">
            <div>
              <dt className="text-sm font-medium text-[#5A7A9A]">Admission Number</dt>
              <div className="flex items-center gap-2 mt-1">
                <dd className="text-lg font-mono font-semibold text-[#1A3A5C] flex-1 select-all">
                  {student.admissionNo}
                </dd>
                <button
                  type="button"
                  onClick={() => copy(student.admissionNo, "admission")}
                  className="text-sm px-3 py-1.5 rounded-lg border border-[#2B6CB0] text-[#2B6CB0] hover:bg-[#E8F0FE] focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]"
                  aria-label={`Copy admission number ${student.admissionNo}`}>
                  {copiedField === "admission" ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            <div>
              <dt className="text-sm font-medium text-[#5A7A9A]">Temporary Password</dt>
              <div className="flex items-center gap-2 mt-1">
                <dd className="text-lg font-mono font-semibold text-[#1A3A5C] flex-1 select-all">
                  {student.tempPassword}
                </dd>
                <button
                  type="button"
                  onClick={() => copy(student.tempPassword, "password")}
                  className="text-sm px-3 py-1.5 rounded-lg border border-[#2B6CB0] text-[#2B6CB0] hover:bg-[#E8F0FE] focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]"
                  aria-label={`Copy temporary password ${student.tempPassword}`}>
                  {copiedField === "password" ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          </dl>

          <button
            type="button"
            onClick={() => copy(`${student.admissionNo} / ${student.tempPassword}`, "both")}
            className="w-full text-sm px-3 py-2 rounded-lg bg-[#E8F0FE] text-[#1A3A5C] font-medium hover:bg-[#D5E4FA] focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]">
            {copiedField === "both" ? "Copied both to clipboard" : "Copy both to clipboard"}
          </button>

          {/* Announces copy confirmations and errors to screen readers
              without requiring focus to move away from the buttons above. */}
          <div ref={liveRegionRef} role="status" aria-live="polite" className="sr-only">
            {copiedField === "admission" && "Admission number copied to clipboard."}
            {copiedField === "password" && "Temporary password copied to clipboard."}
            {copiedField === "both" && "Admission number and password copied to clipboard."}
          </div>

          <p className="text-xs text-[#8A9CAE]">
            The student must change this password the first time they log in.
          </p>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="w-full bg-[#1A3A5C] hover:bg-[#14304D] text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/50">
            I&apos;ve saved these details — Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentCreatedModal;
