"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { ExamData, StatusMessage } from "@/types/exam-taking";
import { examData } from "@/mockData/exam-data";
export const useExamTaking = () => {
  const params = useParams();
  const slug = params?.slug as string;

  const [exam, setExam] = useState<ExamData | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [timerAnnouncement, setTimerAnnouncement] = useState("");

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  // Load exam data
  useEffect(() => {
    const data = examData[slug];
    if (data) {
      setExam(data);
      setTimeRemaining(data.duration * 60);
    }
  }, [slug]);

  // Timer logic
  useEffect(() => {
    if (isExamStarted && !isSubmitted && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isExamStarted, isSubmitted]);

  // Timer announcements
  useEffect(() => {
    if (!isExamStarted || isSubmitted) return;

    const minutes = Math.floor(timeRemaining / 60);

    if (timeRemaining > 300 && timeRemaining % 300 === 0) {
      setTimerAnnouncement(`${minutes} minutes remaining`);
    } else if (timeRemaining <= 300 && timeRemaining > 0 && timeRemaining % 60 === 0) {
      setTimerAnnouncement(`${minutes} minute${minutes === 1 ? "" : "s"} remaining`);
    } else if (timeRemaining === 30) {
      setTimerAnnouncement("30 seconds remaining");
    } else if (timeRemaining === 10) {
      setTimerAnnouncement("10 seconds remaining");
    }
  }, [timeRemaining, isExamStarted, isSubmitted]);

  const handleAutoSubmit = useCallback(() => {
    setStatusMessage({
      type: "warning",
      text: "Time is up. Your exam has been automatically submitted.",
    });
    setIsSubmitted(true);
    setIsExamStarted(false);
  }, []);

  const handleStartExam = useCallback(() => {
    setIsExamStarted(true);
    setStatusMessage({
      type: "success",
      text: "Exam started. Good luck!",
    });
    setTimeout(() => {
      document.getElementById("question-0")?.focus();
    }, 50);
  }, []);

  const handleAnswerChange = useCallback((questionId: number, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  }, []);

  const handleSubmitExam = useCallback(() => {
    setShowSubmitDialog(true);
  }, []);

  const confirmSubmit = useCallback(() => {
    setShowSubmitDialog(false);
    setIsSubmitted(true);
    setIsExamStarted(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setStatusMessage({
      type: "success",
      text: "Exam submitted successfully!",
    });
  }, []);

  const cancelSubmit = useCallback(() => {
    setShowSubmitDialog(false);
    submitButtonRef.current?.focus();
  }, []);

  const getAnsweredCount = useCallback(() => {
    return Object.keys(answers).length;
  }, [answers]);

  const getTotalQuestions = useCallback(() => {
    return exam?.questions.length || 0;
  }, [exam]);

  return {
    exam,
    answers,
    timeRemaining,
    isExamStarted,
    isSubmitted,
    statusMessage,
    showSubmitDialog,
    timerAnnouncement,
    submitButtonRef,
    handleStartExam,
    handleAnswerChange,
    handleSubmitExam,
    confirmSubmit,
    cancelSubmit,
    getAnsweredCount,
    getTotalQuestions,
  };
};
