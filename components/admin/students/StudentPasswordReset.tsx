"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export interface ResettableStudent {
  id: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
}

interface StudentPasswordResetProps {
  // The student to reset. null = nothing open. The parent clears it in onClose.
  student: ResettableStudent | null;
  onClose: () => void;
}

type Phase = "confirm" | "processing" | "done" | "error";

// Admin-initiated password reset for ONE student: confirm -> new temporary
// password shown once. Used from the students table and the student profile.
//
// Like the "student added" dialog, the result is a role="alertdialog" that
// takes focus rather than a toast: the temporary password exists only in this
// one response, so a screen reader user must be guaranteed to hear it.
const StudentPasswordReset: React.FC<StudentPasswordResetProps> = ({ student, onClose }) => {
  // Mounted fresh for each student, so every reset starts from a clean state.
  if (!student) return null;
  return <ResetDialog key={student.id} student={student} onClose={onClose} />;
};

const ResetDialog: React.FC<{ student: ResettableStudent; onClose: () => void }> = ({
  student,
  onClose,
}) => {
  const [phase, setPhase] = useState<Phase>("confirm");
  const [tempPassword, setTempPassword] = useState("");
  const [errorText, setErrorText] = useState("");
  const [copied, setCopied] = useState<"password" | "both" | null>(null);

  const returnFocusTo = useRef<HTMLElement | null>(document.activeElement as HTMLElement | null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const liveRegionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (phase === "done" || phase === "error") {
      const t = setTimeout(() => closeButtonRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const close = useCallback(() => {
    // Never keep the password around once the dialog is closed.
    setTempPassword("");
    onClose();
    setTimeout(() => returnFocusTo.current?.focus(), 0);
  }, [onClose]);

  const runReset = useCallback(async () => {
    if (!student) return;
    setPhase("processing");
    try {
      const res = await fetch(`/api/admin/students/${student.id}/reset-password`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not reset the password.");
      setTempPassword(data.tempPassword);
      setPhase("done");
    } catch (err) {
      setErrorText(err instanceof Error ? err.message : "Could not reset the password.");
      setPhase("error");
    }
  }, [student]);

  const copy = async (text: string, which: "password" | "both") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
    } catch {
      setCopied(null);
      if (liveRegionRef.current) {
        liveRegionRef.current.textContent =
          "Couldn't copy automatically - please select and copy the text manually.";
      }
    }
  };

  const fullName = `${student.firstName} ${student.lastName}`;

  if (phase === "confirm" || phase === "processing") {
    return (
      <ConfirmDialog
        isOpen
        title={`Reset password for ${fullName}?`}
        description={
          <>
            A new temporary password will be generated for <strong>{fullName}</strong> (
            {student.admissionNo}). Their current password stops working immediately. You will see
            the new password once, so be ready to give it to the student.
          </>
        }
        confirmLabel="Reset password"
        isDangerous
        isProcessing={phase === "processing"}
        onConfirm={runReset}
        onCancel={close}
      />
    );
  }

  const isError = phase === "error";

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="reset-result-title"
      aria-describedby="reset-result-body">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-[#B8D0E8]">
        <div className={`${isError ? "bg-red-700" : "bg-green-700"} px-6 py-4 rounded-t-2xl`}>
          <h2 id="reset-result-title" className="text-xl font-bold text-white">
            {isError ? "Password Not Reset" : "Password Reset"}
          </h2>
        </div>

        <div className="p-6 space-y-5">
          {isError ? (
            <p id="reset-result-body" className="text-[#1A3A5C]">
              {errorText}
            </p>
          ) : (
            <>
              <p id="reset-result-body" className="text-[#1A3A5C]">
                <span className="font-semibold">{fullName}</span>&apos;s password has been reset.
                Give the student these sign-in details now —{" "}
                <strong>the password will not be shown again after you close this window.</strong>
              </p>

              <dl className="space-y-4 bg-[#F8FAFE] border border-[#C5D8EC] rounded-lg p-4">
                <div>
                  <dt className="text-sm font-medium text-[#5A7A9A]">Admission Number</dt>
                  <dd className="text-lg font-mono font-semibold text-[#1A3A5C] mt-1 select-all">
                    {student.admissionNo}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-[#5A7A9A]">New Temporary Password</dt>
                  <div className="flex items-center gap-2 mt-1">
                    <dd className="text-lg font-mono font-semibold text-[#1A3A5C] flex-1 select-all">
                      {tempPassword}
                    </dd>
                    <button
                      type="button"
                      onClick={() => copy(tempPassword, "password")}
                      className="text-sm px-3 py-1.5 rounded-lg border border-[#2B6CB0] text-[#2B6CB0] hover:bg-[#E8F0FE] focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]"
                      aria-label="Copy new temporary password">
                      {copied === "password" ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
              </dl>

              <button
                type="button"
                onClick={() => copy(`${student.admissionNo} / ${tempPassword}`, "both")}
                className="w-full text-sm px-3 py-2 rounded-lg bg-[#E8F0FE] text-[#1A3A5C] font-medium hover:bg-[#D5E4FA] focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]">
                {copied === "both" ? "Copied both to clipboard" : "Copy both to clipboard"}
              </button>

              <div ref={liveRegionRef} role="status" aria-live="polite" className="sr-only">
                {copied === "password" && "New temporary password copied to clipboard."}
                {copied === "both" && "Admission number and password copied to clipboard."}
              </div>
            </>
          )}

          <button
            ref={closeButtonRef}
            type="button"
            onClick={close}
            className="w-full bg-[#1A3A5C] hover:bg-[#14304D] text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/50">
            {isError ? "Close" : "I've saved these details — Close"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentPasswordReset;
