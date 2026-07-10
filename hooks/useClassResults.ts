"use client";

import { useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  generateObjectiveExcel,
  generateTheoryScriptPDF,
  generateAllTheoryScriptsPDF,
} from "@/lib/resultExport";

interface SubjectResult {
  id: number;
  subject: string;
  examType: "objective" | "theory" | "mixed";
  totalStudents: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  completed: number;
  status: "completed" | "pending" | "in-progress";
}

interface StudentAnswer {
  questionNo: number;
  answer: string;
}

interface StudentScript {
  id: number;
  studentName: string;
  admissionNo: string;
  score: number;
  status: "marked" | "pending" | "in-progress";
  submittedAt: string;
  answers?: StudentAnswer[];
}

interface StatusMessage {
  type: "success" | "error" | "warning";
  text: string;
}

const initialSubjectResults: SubjectResult[] = [
  {
    id: 1,
    subject: "Chemistry",
    examType: "objective",
    totalStudents: 45,
    averageScore: 72,
    highestScore: 95,
    lowestScore: 45,
    completed: 40,
    status: "completed",
  },
  {
    id: 2,
    subject: "Chemistry Theory",
    examType: "theory",
    totalStudents: 45,
    averageScore: 68,
    highestScore: 90,
    lowestScore: 35,
    completed: 38,
    status: "pending",
  },
  {
    id: 3,
    subject: "Physics",
    examType: "objective",
    totalStudents: 45,
    averageScore: 65,
    highestScore: 88,
    lowestScore: 40,
    completed: 42,
    status: "completed",
  },
  {
    id: 4,
    subject: "Physics Theory",
    examType: "theory",
    totalStudents: 45,
    averageScore: 60,
    highestScore: 85,
    lowestScore: 30,
    completed: 35,
    status: "in-progress",
  },
  {
    id: 5,
    subject: "Mathematics",
    examType: "mixed",
    totalStudents: 45,
    averageScore: 70,
    highestScore: 92,
    lowestScore: 38,
    completed: 40,
    status: "completed",
  },
  {
    id: 6,
    subject: "English Language",
    examType: "objective",
    totalStudents: 45,
    averageScore: 75,
    highestScore: 98,
    lowestScore: 50,
    completed: 43,
    status: "completed",
  },
  {
    id: 7,
    subject: "English Language Theory",
    examType: "theory",
    totalStudents: 45,
    averageScore: 62,
    highestScore: 87,
    lowestScore: 28,
    completed: 33,
    status: "pending",
  },
];

const initialStudentScripts: StudentScript[] = [
  {
    id: 1,
    studentName: "John Doe",
    admissionNo: "BHS-2024-001",
    score: 85,
    status: "marked",
    submittedAt: "2025-06-23 10:30 AM",
    answers: [
      {
        questionNo: 1,
        answer: "Photosynthesis is the process by which green plants convert light energy...",
      },
      { questionNo: 2, answer: "The mitochondria is referred to as the powerhouse of the cell..." },
    ],
  },
  {
    id: 2,
    studentName: "Jane Smith",
    admissionNo: "BHS-2024-002",
    score: 72,
    status: "marked",
    submittedAt: "2025-06-23 10:15 AM",
    answers: [
      { questionNo: 1, answer: "Photosynthesis converts sunlight into chemical energy..." },
      { questionNo: 2, answer: "Mitochondria produce energy for the cell through respiration..." },
    ],
  },
  {
    id: 3,
    studentName: "Michael Johnson",
    admissionNo: "BHS-2024-003",
    score: 0,
    status: "pending",
    submittedAt: "2025-06-23 11:00 AM",
    answers: [
      { questionNo: 1, answer: "Plants use sunlight to make food using their leaves." },
      { questionNo: 2, answer: "Mitochondria help the cell breathe and make energy." },
    ],
  },
  {
    id: 4,
    studentName: "Sarah Williams",
    admissionNo: "BHS-2024-004",
    score: 90,
    status: "marked",
    submittedAt: "2025-06-23 09:45 AM",
    answers: [
      { questionNo: 1, answer: "Photosynthesis is a biochemical process where plants..." },
      { questionNo: 2, answer: "Mitochondria are double-membraned organelles..." },
    ],
  },
  {
    id: 5,
    studentName: "David Brown",
    admissionNo: "BHS-2024-005",
    score: 0,
    status: "in-progress",
    submittedAt: "2025-06-23 11:30 AM",
    answers: [
      { questionNo: 1, answer: "Photosynthesis happens in the leaf using sunlight and water." },
      { questionNo: 2, answer: "Mitochondria gives the cell power." },
    ],
  },
];

export const useClassResults = () => {
  const params = useParams();
  const className = params?.className as string;

  const [subjectResults] = useState<SubjectResult[]>(initialSubjectResults);
  const [studentScripts] = useState<StudentScript[]>(initialStudentScripts);
  const [selectedSubject, setSelectedSubject] = useState<SubjectResult | null>(null);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);

  const triggerRef = useRef<HTMLElement | null>(null);

  const handleViewScripts = useCallback(
    (subject: SubjectResult, e: React.MouseEvent<HTMLButtonElement>) => {
      triggerRef.current = e.currentTarget;
      setSelectedSubject(subject);
      setShowScriptModal(true);
    },
    [],
  );

  const closeScriptModal = useCallback(() => {
    setShowScriptModal(false);
  }, []);

  const handleViewStudentScript = useCallback(
    (student: StudentScript) => {
      if (!selectedSubject) return;
      try {
        generateTheoryScriptPDF(className, selectedSubject, student);
        setStatusMessage({
          type: "success",
          text: `Downloaded script for ${student.studentName} (${student.admissionNo}).`,
        });
      } catch {
        setStatusMessage({ type: "error", text: "Could not generate the script PDF." });
      }
      setTimeout(() => setStatusMessage(null), 4000);
    },
    [className, selectedSubject],
  );

  const handleDownloadClassResult = useCallback(
    async (subject: SubjectResult) => {
      setIsLoading(true);
      try {
        if (subject.examType === "theory") {
          generateAllTheoryScriptsPDF(className, subject, studentScripts);
          setStatusMessage({
            type: "success",
            text: `Downloaded all student scripts for ${subject.subject}.`,
          });
        } else {
          await generateObjectiveExcel(className, subject, studentScripts);
          setStatusMessage({
            type: "success",
            text: `Downloaded ${subject.subject} results for ${className}.`,
          });
        }
      } catch {
        setStatusMessage({ type: "error", text: "Something went wrong generating the file." });
      } finally {
        setIsLoading(false);
        setTimeout(() => setStatusMessage(null), 4000);
      }
    },
    [className, studentScripts],
  );

  return {
    className,
    subjectResults,
    studentScripts,
    selectedSubject,
    showScriptModal,
    isLoading,
    statusMessage,
    triggerRef,
    handleViewScripts,
    closeScriptModal,
    handleViewStudentScript,
    handleDownloadClassResult,
  };
};
