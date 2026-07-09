"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Exam, StatusMessage } from "@/types/student-exam";

const initialExams: Exam[] = [
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
];

export const useStudentExams = () => {
  const router = useRouter();
  const [exams] = useState<Exam[]>(initialExams);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [examCode, setExamCode] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const triggerButtonRef = useRef<HTMLButtonElement | null>(null);

  const handleExamClick = useCallback((exam: Exam, e: React.MouseEvent<HTMLButtonElement>) => {
    triggerButtonRef.current = e.currentTarget;
    setSelectedExam(exam);
    setExamCode("");
    setStatusMessage(null);
    setIsCodeVerified(false);
    setIsModalOpen(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setSelectedExam(null);
    setExamCode("");
    setStatusMessage(null);
    setIsCodeVerified(false);
    triggerButtonRef.current?.focus();
  }, []);

  const handleCodeSubmit = useCallback(
    (e: React.FormEvent) => {
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
    },
    [examCode, selectedExam, router, handleModalClose],
  );

  return {
    exams,
    selectedExam,
    examCode,
    isModalOpen,
    statusMessage,
    isCodeVerified,
    setExamCode,
    handleExamClick,
    handleModalClose,
    handleCodeSubmit,
  };
};
