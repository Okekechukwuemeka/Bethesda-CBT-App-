"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface Exam {
  id: number;
  subject: string;
  term: string;
  date: string;
  time: string;
  duration: string;
  code: string;
  slug: string;
  type: "objective" | "theory" | "mixed";
}

interface StatusMessage {
  type: "success" | "error";
  text: string;
}

const ExamsPage: React.FC = () => {
  const router = useRouter();
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [examCode, setExamCode] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  const [isCodeVerified, setIsCodeVerified] = useState(false);

  // Remembers which "Start Exam" button opened the modal so we can
  // return focus to it when the modal closes. Without this, a screen
  // reader user's focus silently drops to the top of the page/body.
  const triggerButtonRef = useRef<HTMLButtonElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const mainContentRef = useRef<HTMLDivElement | null>(null);

  const exams: Exam[] = [
    {
      id: 1,
      subject: "Chemistry",
      term: "First Term",
      date: "23 June 2025",
      time: "7:00 AM",
      duration: "2 hours",
      code: "CHEM-2025-FT",
      slug: "chemistry-objective",
      type: "objective",
    },
    {
      id: 2,
      subject: "Chemistry",
      term: "First Term",
      date: "23 June 2025",
      time: "10:00 AM",
      duration: "1.5 hours",
      code: "CHEM-TH-2025-FT",
      slug: "chemistry-theory",
      type: "theory",
    },
    {
      id: 3,
      subject: "Physics",
      term: "First Term",
      date: "27 June 2025",
      time: "7:00 AM",
      duration: "2 hours",
      code: "PHYS-2025-FT",
      slug: "physics-objective",
      type: "objective",
    },
    {
      id: 4,
      subject: "Physics",
      term: "First Term",
      date: "27 June 2025",
      time: "10:00 AM",
      duration: "1.5 hours",
      code: "PHYS-TH-2025-FT",
      slug: "physics-theory",
      type: "theory",
    },
    {
      id: 5,
      subject: "Mathematics",
      term: "First Term",
      date: "25 June 2025",
      time: "9:00 AM",
      duration: "2.5 hours",
      code: "MATH-2025-FT",
      slug: "mathematics-objective",
      type: "objective",
    },
    {
      id: 6,
      subject: "Mathematics",
      term: "First Term",
      date: "25 June 2025",
      time: "12:00 PM",
      duration: "2 hours",
      code: "MATH-TH-2025-FT",
      slug: "mathematics-theory",
      type: "theory",
    },
    {
      id: 7,
      subject: "English Language",
      term: "First Term",
      date: "28 June 2025",
      time: "10:00 AM",
      duration: "2 hours",
      code: "ENG-2025-FT",
      slug: "english-objective",
      type: "objective",
    },
    {
      id: 8,
      subject: "English Language",
      term: "First Term",
      date: "28 June 2025",
      time: "1:00 PM",
      duration: "1.5 hours",
      code: "ENG-TH-2025-FT",
      slug: "english-theory",
      type: "theory",
    },
    {
      id: 9,
      subject: "Biology",
      term: "First Term",
      date: "30 June 2025",
      time: "8:00 AM",
      duration: "2 hours",
      code: "BIO-2025-FT",
      slug: "biology-objective",
      type: "objective",
    },
    {
      id: 10,
      subject: "Biology",
      term: "First Term",
      date: "30 June 2025",
      time: "11:00 AM",
      duration: "1.5 hours",
      code: "BIO-TH-2025-FT",
      slug: "biology-theory",
      type: "theory",
    },
  ];

  const handleExamClick = (exam: Exam, e: React.MouseEvent<HTMLButtonElement>) => {
    triggerButtonRef.current = e.currentTarget;
    setSelectedExam(exam);
    setExamCode("");
    setStatusMessage(null);
    setIsCodeVerified(false);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedExam(null);
    setExamCode("");
    setStatusMessage(null);
    setIsCodeVerified(false);
    // Return focus to the button that opened the modal so a screen
    // reader / keyboard user isn't dropped back at the top of the page.
    triggerButtonRef.current?.focus();
  };

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!examCode.trim()) {
      setStatusMessage({
        type: "error",
        text: "Please enter the examination code.",
      });
      return;
    }

    if (examCode.trim() === selectedExam?.code) {
      setStatusMessage({
        type: "success",
        text: `Access granted to ${selectedExam?.subject} ${selectedExam?.type} examination! Starting exam.`,
      });
      setIsCodeVerified(true);

      setTimeout(() => {
        if (selectedExam) {
          router.push(`/student/exams/${selectedExam.slug}`);
        }
        handleModalClose();
      }, 1800);
    } else {
      setStatusMessage({
        type: "error",
        text: "Invalid examination code. Please try again.",
      });
      setExamCode("");
      document.getElementById("examCode")?.focus();
    }
  };

  // Escape closes the modal
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isModalOpen && !isCodeVerified) {
        handleModalClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isModalOpen, isCodeVerified]);

  // Focus the exam-code input when the modal opens
  React.useEffect(() => {
    if (isModalOpen) {
      const input = document.getElementById("examCode");
      input?.focus();
    }
  }, [isModalOpen]);

  // Real focus trap: keeps Tab / Shift+Tab cycling inside the modal
  // instead of leaking focus onto the page underneath. This matters a
  // lot for screen reader users, who navigate linearly by Tab and have
  // no visual cue that focus has "escaped" behind an overlay.
  React.useEffect(() => {
    if (!isModalOpen) return;

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
  }, [isModalOpen]);

  const getExamTypeLabel = (type: string) => {
    switch (type) {
      case "objective":
        return "Objective";
      case "theory":
        return "Theory";
      case "mixed":
        return "Mixed";
      default:
        return type;
    }
  };

  const getExamTypeColor = (type: string) => {
    switch (type) {
      case "objective":
        return "bg-blue-100 text-blue-800";
      case "theory":
        return "bg-purple-100 text-purple-800";
      case "mixed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-[#E8F0FE] py-8 px-4 font-sans">
      {/* aria-hidden freezes the background page from the accessibility tree
          while the modal is open, so a screen reader user can't accidentally
          arrow-navigate into exam cards hidden behind the overlay. */}
      <div
        ref={mainContentRef}
        aria-hidden={isModalOpen ? true : undefined}
        className="max-w-4xl mx-auto">
        <header className="bg-[#1A3A5C] rounded-t-2xl px-6 py-6 text-center">
          <h1 className="text-3xl font-bold text-white tracking-wide">
            JSS3 Available Examinations
          </h1>
          <div className="w-16 h-1 bg-[#5B9BD5] mx-auto mt-3 rounded-full" aria-hidden="true"></div>
          <p className="text-white/70 text-sm mt-3">
            {exams.length} examinations available. Select an examination to begin.
          </p>
        </header>

        <main className="bg-white rounded-b-2xl shadow-2xl overflow-hidden border border-[#B8D0E8] p-6">
          <ul className="space-y-4 list-none" aria-label="Available examinations">
            {exams.map((exam) => (
              <li
                key={exam.id}
                className="border border-[#C5D8EC] rounded-lg p-4 hover:border-[#2B6CB0] transition-all duration-200 bg-[#F8FAFE]">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-semibold text-[#1A3A5C]">{exam.subject}</h2>
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${getExamTypeColor(exam.type)}`}>
                        {getExamTypeLabel(exam.type)}
                      </span>
                    </div>
                    <p className="text-sm text-[#4A6A8A] font-medium">{exam.term}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-[#5A7A9A]">
                      <span>
                        <span className="font-medium">Date:</span> {exam.date}
                      </span>
                      <span>
                        <span className="font-medium">Time:</span> {exam.time}
                      </span>
                      <span>
                        <span className="font-medium">Duration:</span> {exam.duration}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleExamClick(exam, e)}
                    className="bg-[#1A3A5C] hover:bg-[#14304D] text-white font-medium px-6 py-2 rounded-lg transition duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/50 active:scale-[0.98] whitespace-nowrap"
                    aria-label={`Start ${exam.subject} ${getExamTypeLabel(exam.type)} examination, ${exam.date} at ${exam.time}, duration ${exam.duration}`}>
                    Start Exam
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </main>
      </div>

      {/* Modal */}
      {isModalOpen && selectedExam && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isCodeVerified) handleModalClose();
          }}>
          <div
            ref={modalRef}
            id="modal-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-[#B8D0E8] relative">
            <div className="bg-[#1A3A5C] -mx-6 -mt-6 px-6 py-4 rounded-t-2xl">
              <h2 id="modal-title" className="text-xl font-bold text-white">
                Enter Examination Code
              </h2>
            </div>

            <div className="mt-6">
              <div
                className="bg-[#F8FAFE] border border-[#C5D8EC] rounded-lg p-4 mb-6"
                aria-label={`Exam details: ${selectedExam.subject}, ${getExamTypeLabel(selectedExam.type)}, ${selectedExam.date} at ${selectedExam.time}, duration ${selectedExam.duration}`}>
                <p className="text-sm text-[#4A6A8A]">
                  <span className="font-medium text-[#1A3A5C]">Subject:</span>{" "}
                  {selectedExam.subject}
                </p>
                <p className="text-sm text-[#4A6A8A]">
                  <span className="font-medium text-[#1A3A5C]">Type:</span>{" "}
                  {getExamTypeLabel(selectedExam.type)}
                </p>
                <p className="text-sm text-[#4A6A8A]">
                  <span className="font-medium text-[#1A3A5C]">Date:</span> {selectedExam.date} at{" "}
                  {selectedExam.time}
                </p>
                <p className="text-sm text-[#4A6A8A]">
                  <span className="font-medium text-[#1A3A5C]">Duration:</span>{" "}
                  {selectedExam.duration}
                </p>
              </div>

              {statusMessage && (
                <div
                  id="status-message"
                  // Errors interrupt immediately (assertive); success is calmer
                  // (polite). A blind user needs to know right away that a code
                  // was rejected, rather than have it queued behind other speech.
                  role={statusMessage.type === "error" ? "alert" : "status"}
                  aria-live={statusMessage.type === "error" ? "assertive" : "polite"}
                  className={`mb-4 p-3 rounded-lg text-sm font-medium ${
                    statusMessage.type === "success"
                      ? "bg-green-100 text-green-800 border border-green-300"
                      : "bg-red-100 text-red-800 border border-red-300"
                  }`}>
                  {statusMessage.text}
                </div>
              )}

              <form onSubmit={handleCodeSubmit} noValidate>
                <div>
                  <label
                    htmlFor="examCode"
                    className="block text-sm font-medium text-[#1A3A5C] mb-1">
                    Examination Code{" "}
                    <span aria-hidden="true" className="text-red-500">
                      *
                    </span>
                    <span className="sr-only"> required</span>
                  </label>
                  <input
                    type="text"
                    id="examCode"
                    value={examCode}
                    onChange={(e) => setExamCode(e.target.value)}
                    required
                    autoComplete="off"
                    aria-required="true"
                    aria-invalid={statusMessage?.type === "error"}
                    aria-describedby={statusMessage ? "status-message" : undefined}
                    placeholder="Enter the exam code provided"
                    disabled={isCodeVerified}
                    className="w-full px-4 py-3 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent transition bg-[#F8FAFE] text-[#1A1A1A] placeholder:text-[#8A9CAE] disabled:opacity-50"
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={handleModalClose}
                    disabled={isCodeVerified}
                    className="flex-1 bg-[#E8EEF5] hover:bg-[#D5DFE8] text-[#1A3A5C] font-medium py-2.5 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/30 disabled:opacity-50 disabled:cursor-not-allowed">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCodeVerified}
                    className="flex-1 bg-[#1A3A5C] hover:bg-[#14304D] text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/50 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
                    {isCodeVerified ? (
                      <>
                        <span aria-hidden="true">Verified ✓</span>
                        <span className="sr-only">Code verified, starting exam</span>
                      </>
                    ) : (
                      "Verify & Start"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamsPage;
