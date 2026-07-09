"use client";

import React, { useState } from "react";
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

  const handleExamClick = (exam: Exam) => {
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
        text: `Access granted to ${selectedExam?.subject} ${selectedExam?.type} examination!`,
      });
      setIsCodeVerified(true);

      setTimeout(() => {
        if (selectedExam) {
          router.push(`/student/exams/${selectedExam.slug}`);
        }
        handleModalClose();
      }, 1500);
    } else {
      setStatusMessage({
        type: "error",
        text: "Invalid examination code. Please try again.",
      });
      setExamCode("");
      document.getElementById("examCode")?.focus();
    }
  };

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isModalOpen) {
        handleModalClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isModalOpen]);

  React.useEffect(() => {
    if (isModalOpen) {
      const focusableElements = document.querySelectorAll(
        "#modal-content button, #modal-content input, #modal-content a",
      );
      if (focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }
    }
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
      <div className="max-w-4xl mx-auto">
        <div className="bg-[#1A3A5C] rounded-t-2xl px-6 py-6 text-center">
          <h1 className="text-3xl font-bold text-white tracking-wide">
            JSS3 Available Examinations
          </h1>
          <div className="w-16 h-1 bg-[#5B9BD5] mx-auto mt-3 rounded-full"></div>
          <p className="text-white/70 text-sm mt-3">Select an examination to begin</p>
        </div>

        <div className="bg-white rounded-b-2xl shadow-2xl overflow-hidden border border-[#B8D0E8] p-6">
          <div className="space-y-4">
            {exams.map((exam) => (
              <div
                key={exam.id}
                className="border border-[#C5D8EC] rounded-lg p-4 hover:border-[#2B6CB0] transition-all duration-200 bg-[#F8FAFE]">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-[#1A3A5C]">{exam.subject}</h3>
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
                    onClick={() => handleExamClick(exam)}
                    className="bg-[#1A3A5C] hover:bg-[#14304D] text-white font-medium px-6 py-2 rounded-lg transition duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/50 active:scale-[0.98] whitespace-nowrap"
                    aria-label={`Start ${exam.subject} ${exam.type} examination`}>
                    Start Exam
                  </button>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-[#5A7A9A] mt-6 border-t border-[#E8EEF5] pt-4">
            {exams.length} examinations available
          </p>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && selectedExam && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          aria-describedby={statusMessage ? "status-message" : undefined}
          onClick={(e) => {
            if (e.target === e.currentTarget && !isCodeVerified) handleModalClose();
          }}>
          <div
            id="modal-content"
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-[#B8D0E8] relative">
            <div className="bg-[#1A3A5C] -mx-6 -mt-6 px-6 py-4 rounded-t-2xl">
              <h2 id="modal-title" className="text-xl font-bold text-white">
                Enter Examination Code
              </h2>
            </div>

            <div className="mt-6">
              <div className="bg-[#F8FAFE] border border-[#C5D8EC] rounded-lg p-4 mb-6">
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
                  role="status"
                  aria-live="polite"
                  className={`mb-4 p-3 rounded-lg text-sm font-medium ${
                    statusMessage.type === "success"
                      ? "bg-green-100 text-green-800 border border-green-300"
                      : "bg-red-100 text-red-800 border border-red-300"
                  }`}>
                  {statusMessage.text}
                </div>
              )}

              <form onSubmit={handleCodeSubmit}>
                <div>
                  <label
                    htmlFor="examCode"
                    className="block text-sm font-medium text-[#1A3A5C] mb-1">
                    Examination Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="examCode"
                    value={examCode}
                    onChange={(e) => setExamCode(e.target.value)}
                    required
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
                    {isCodeVerified ? "Verified ✓" : "Verify & Start"}
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
