"use client";

import React, { useState } from "react";
import { signOut, useSession } from "next-auth/react";

interface StudentIdentityBarProps {
  // Keeps the bar pinned to the top of the screen while the page scrolls -
  // used during an exam so the student's identity is never scrolled away.
  sticky?: boolean;
  // Shows a "Not you? Log out" button. Left off during an exam, where
  // leaving the page by accident would be costly.
  allowLogout?: boolean;
  className?: string;
}

// Shows, in large high-contrast text, WHO is signed in on this computer.
//
// Students here are visually impaired and sometimes sit at a computer that
// someone else left logged in, so they may not realise they are in another
// student's account. The name, admission number and class come from the
// signed-in session (not from anything on the page), and the same text is
// announced to screen readers when the page loads, so it doesn't depend on
// being able to see the screen.
const StudentIdentityBar: React.FC<StudentIdentityBarProps> = ({
  sticky = false,
  allowLogout = false,
  className = "",
}) => {
  const { data: session, status } = useSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const user = session?.user;
  const name = user?.name ?? "";
  const admissionNumber = user?.admissionNumber ?? "";
  const studentClass = user?.class ?? "";

  // The live region below is rendered from the very first paint (empty) and
  // gets this text once the session loads - a change after render is what
  // makes screen readers speak it.
  const announcement = name
    ? `You are signed in as ${name}, admission number ${admissionNumber}, class ${studentClass}.`
    : "";

  if (status === "unauthenticated") return null;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await signOut({ callbackUrl: "/student/login" });
  };

  return (
    <section
      aria-label="Signed-in student"
      className={`${sticky ? "sticky top-0 z-30" : ""} bg-white border-2 border-[#1A3A5C] rounded-xl shadow-md px-5 py-3 ${className}`}>
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>

      {status === "loading" || !name ? (
        <p className="text-base text-[#4A6A8A]">Checking who is signed in…</p>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#4A6A8A]">
              Signed in as
            </p>
            <p className="text-2xl font-bold text-[#1A3A5C] break-words">{name}</p>
            <p className="text-base text-[#1A3A5C]">
              Admission number: <span className="font-semibold">{admissionNumber}</span>
              <span aria-hidden="true"> · </span>
              <span className="sr-only">, </span>
              Class: <span className="font-semibold">{studentClass}</span>
            </p>
          </div>

          {allowLogout && (
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              aria-label={`Not ${name}? Log out of this account`}
              className="shrink-0 px-5 py-3 rounded-lg border-2 border-[#1A3A5C] text-[#1A3A5C] font-semibold hover:bg-[#F3F8FF] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#2B6CB0]/50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
              {isLoggingOut ? "Logging out…" : "Not you? Log out"}
            </button>
          )}
        </div>
      )}
    </section>
  );
};

export default StudentIdentityBar;
