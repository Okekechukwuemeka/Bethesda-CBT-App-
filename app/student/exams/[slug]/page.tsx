"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";

interface ExamData {
  slug: string;
  subject: string;
  class: string;
  term: string;
  date: string;
  time: string;
  duration: number;
  type: "objective" | "theory" | "mixed";
  instructions: string[];
  questions: Question[];
}

interface Question {
  id: number;
  text: string;
  options?: string[];
  type: "objective" | "theory";
  marks: number;
}

interface StatusMessage {
  type: "success" | "error" | "warning";
  text: string;
}

const ExamPage: React.FC = () => {
  const params = useParams();
  const slug = params?.slug as string;

  const [exam, setExam] = useState<ExamData | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  // Separate, throttled announcement for the timer. The visible clock
  // updates every second, but a live region that updates every second
  // is unusable for screen reader users — it never stops talking. This
  // only changes at meaningful checkpoints.
  const [timerAnnouncement, setTimerAnnouncement] = useState("");

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const submitDialogRef = useRef<HTMLDivElement | null>(null);
  const submittedHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const notFoundHeadingRef = useRef<HTMLHeadingElement | null>(null);

  // Mock exam data with both objective and theory questions
  const examData: Record<string, ExamData> = {
    "chemistry-objective": {
      slug: "chemistry-objective",
      subject: "Chemistry",
      class: "JSS3",
      term: "First Term",
      date: "23 June 2025",
      time: "7:00 AM",
      duration: 120,
      type: "objective",
      instructions: [
        "Read all questions carefully before answering.",
        "Select the best answer for each question.",
        "Each question carries equal marks.",
      ],
      questions: [
        {
          id: 1,
          text: "What is the chemical symbol for water?",
          options: ["H2O", "CO2", "NaCl", "HCl"],
          type: "objective",
          marks: 5,
        },
        {
          id: 2,
          text: "What is the atomic number of Carbon?",
          options: ["6", "12", "14", "8"],
          type: "objective",
          marks: 5,
        },
        {
          id: 3,
          text: "Which of the following is a noble gas?",
          options: ["Oxygen", "Nitrogen", "Helium", "Hydrogen"],
          type: "objective",
          marks: 5,
        },
        {
          id: 4,
          text: "What is the pH of pure water?",
          options: ["5", "7", "9", "11"],
          type: "objective",
          marks: 5,
        },
        {
          id: 5,
          text: "Which element is represented by the symbol Fe?",
          options: ["Iron", "Fluorine", "Fermium", "Francium"],
          type: "objective",
          marks: 5,
        },
      ],
    },
    "chemistry-theory": {
      slug: "chemistry-theory",
      subject: "Chemistry",
      class: "JSS3",
      term: "First Term",
      date: "23 June 2025",
      time: "10:00 AM",
      duration: 90,
      type: "theory",
      instructions: [
        "Answer all questions in the space provided.",
        "Show all workings where necessary.",
        "Write clearly and legibly.",
        "Each question carries the marks indicated.",
      ],
      questions: [
        {
          id: 1,
          text: "Define an acid and give two examples with their chemical formulas.",
          type: "theory",
          marks: 10,
        },
        {
          id: 2,
          text: "Explain the process of photosynthesis and write the chemical equation.",
          type: "theory",
          marks: 15,
        },
        {
          id: 3,
          text: "Describe the differences between a mixture and a compound. Give two examples of each.",
          type: "theory",
          marks: 10,
        },
        {
          id: 4,
          text: "What is the periodic table? Explain how elements are arranged in the periodic table.",
          type: "theory",
          marks: 10,
        },
      ],
    },
    "physics-objective": {
      slug: "physics-objective",
      subject: "Physics",
      class: "JSS3",
      term: "First Term",
      date: "27 June 2025",
      time: "7:00 AM",
      duration: 120,
      type: "objective",
      instructions: ["All questions are compulsory.", "Choose the best answer for each question."],
      questions: [
        {
          id: 1,
          text: "What is the SI unit of force?",
          options: ["Newton", "Joule", "Watt", "Pascal"],
          type: "objective",
          marks: 5,
        },
        {
          id: 2,
          text: "What is the speed of light approximately?",
          options: ["3 × 10⁸ m/s", "3 × 10⁶ m/s", "3 × 10¹⁰ m/s", "3 × 10⁴ m/s"],
          type: "objective",
          marks: 5,
        },
      ],
    },
    "physics-theory": {
      slug: "physics-theory",
      subject: "Physics",
      class: "JSS3",
      term: "First Term",
      date: "27 June 2025",
      time: "10:00 AM",
      duration: 90,
      type: "theory",
      instructions: [
        "Answer all questions.",
        "Show all workings and calculations.",
        "Include diagrams where necessary.",
      ],
      questions: [
        {
          id: 1,
          text: "State Newton's three laws of motion. Give one example of each law in everyday life.",
          type: "theory",
          marks: 15,
        },
        {
          id: 2,
          text: "What is energy? Explain the difference between kinetic and potential energy with examples.",
          type: "theory",
          marks: 10,
        },
      ],
    },
    "mathematics-objective": {
      slug: "mathematics-objective",
      subject: "Mathematics",
      class: "JSS3",
      term: "First Term",
      date: "25 June 2025",
      time: "9:00 AM",
      duration: 150,
      type: "objective",
      instructions: ["Answer all questions.", "Select the correct option for each question."],
      questions: [
        {
          id: 1,
          text: "What is the value of 3² + 4²?",
          options: ["7", "12", "25", "5"],
          type: "objective",
          marks: 5,
        },
        {
          id: 2,
          text: "What is the square root of 144?",
          options: ["10", "11", "12", "13"],
          type: "objective",
          marks: 5,
        },
        {
          id: 3,
          text: "What is 15% of 200?",
          options: ["20", "25", "30", "35"],
          type: "objective",
          marks: 5,
        },
      ],
    },
    "mathematics-theory": {
      slug: "mathematics-theory",
      subject: "Mathematics",
      class: "JSS3",
      term: "First Term",
      date: "25 June 2025",
      time: "12:00 PM",
      duration: 120,
      type: "theory",
      instructions: [
        "Answer all questions.",
        "Show all steps in your calculations.",
        "State any formula used.",
      ],
      questions: [
        {
          id: 1,
          text: "Solve the equation: 3x - 7 = 2x + 5. Show all your steps.",
          type: "theory",
          marks: 10,
        },
        {
          id: 2,
          text: "The area of a rectangle is 48 cm². If the length is 8 cm, what is the width? Show your working.",
          type: "theory",
          marks: 8,
        },
      ],
    },
    "english-objective": {
      slug: "english-objective",
      subject: "English Language",
      class: "JSS3",
      term: "First Term",
      date: "28 June 2025",
      time: "10:00 AM",
      duration: 120,
      type: "objective",
      instructions: ["Answer all questions.", "Select the correct option."],
      questions: [
        {
          id: 1,
          text: "Which of the following is a correct plural form?",
          options: ["Childs", "Children", "Childrens", "Childes"],
          type: "objective",
          marks: 5,
        },
        {
          id: 2,
          text: 'What is the past tense of "go"?',
          options: ["Goed", "Went", "Gone", "Going"],
          type: "objective",
          marks: 5,
        },
        {
          id: 3,
          text: 'Which word is a synonym for "happy"?',
          options: ["Sad", "Joyful", "Angry", "Tired"],
          type: "objective",
          marks: 5,
        },
      ],
    },
    "english-theory": {
      slug: "english-theory",
      subject: "English Language",
      class: "JSS3",
      term: "First Term",
      date: "28 June 2025",
      time: "1:00 PM",
      duration: 90,
      type: "theory",
      instructions: [
        "Write neatly and legibly.",
        "Stay within the word limits where specified.",
        "Check your spelling and grammar.",
      ],
      questions: [
        {
          id: 1,
          text: 'Write a short essay on "The Importance of Education in My Community" (250-300 words).',
          type: "theory",
          marks: 20,
        },
        {
          id: 2,
          text: "Write a letter to your friend describing your school and your favorite subjects (200-250 words).",
          type: "theory",
          marks: 15,
        },
      ],
    },
    "biology-objective": {
      slug: "biology-objective",
      subject: "Biology",
      class: "JSS3",
      term: "First Term",
      date: "30 June 2025",
      time: "8:00 AM",
      duration: 120,
      type: "objective",
      instructions: ["Answer all questions.", "Choose the correct option."],
      questions: [
        {
          id: 1,
          text: "What is the largest organ in the human body?",
          options: ["Heart", "Liver", "Skin", "Brain"],
          type: "objective",
          marks: 5,
        },
        {
          id: 2,
          text: "Which blood type is known as the universal donor?",
          options: ["A", "B", "AB", "O"],
          type: "objective",
          marks: 5,
        },
        {
          id: 3,
          text: "What is the basic unit of life?",
          options: ["Cell", "Tissue", "Organ", "Organism"],
          type: "objective",
          marks: 5,
        },
        {
          id: 4,
          text: "Which of these is NOT a sense organ?",
          options: ["Eye", "Ear", "Nose", "Heart"],
          type: "objective",
          marks: 5,
        },
      ],
    },
    "biology-theory": {
      slug: "biology-theory",
      subject: "Biology",
      class: "JSS3",
      term: "First Term",
      date: "30 June 2025",
      time: "11:00 AM",
      duration: 90,
      type: "theory",
      instructions: [
        "Answer all questions.",
        "Label diagrams clearly.",
        "Use appropriate biological terms.",
      ],
      questions: [
        {
          id: 1,
          text: "Describe the human digestive system. Name the organs and explain their functions.",
          type: "theory",
          marks: 15,
        },
        {
          id: 2,
          text: "Explain the process of respiration in humans. Include the role of the respiratory system.",
          type: "theory",
          marks: 12,
        },
      ],
    },
  };

  useEffect(() => {
    const data = examData[slug];
    if (data) {
      setExam(data);
      setTimeRemaining(data.duration * 60);
    }
  }, [slug]);

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

  // Throttled timer announcements: every 5 minutes while there's more
  // than 5 minutes left, every minute inside the last 5 minutes, and at
  // 30s / 10s. This keeps a blind user informed without the live region
  // re-announcing every single second.
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

  const handleAutoSubmit = () => {
    setStatusMessage({
      type: "warning",
      text: "Time is up. Your exam has been automatically submitted.",
    });
    setIsSubmitted(true);
    setIsExamStarted(false);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartExam = () => {
    setIsExamStarted(true);
    setStatusMessage({
      type: "success",
      text: "Exam started. Good luck!",
    });
    // Give React a tick to render the question list before moving focus.
    setTimeout(() => {
      document.getElementById("question-0")?.focus();
    }, 50);
  };

  const handleAnswerChange = (questionId: number, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSubmitExam = () => {
    setShowSubmitDialog(true);
    setTimeout(() => {
      document.getElementById("confirm-submit")?.focus();
    }, 100);
  };

  const confirmSubmit = () => {
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
  };

  const cancelSubmit = () => {
    setShowSubmitDialog(false);
    submitButtonRef.current?.focus();
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).length;
  };

  const getTotalQuestions = () => {
    return exam?.questions.length || 0;
  };

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

  // Escape closes the submit-confirmation dialog
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showSubmitDialog) {
        cancelSubmit();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [showSubmitDialog]);

  // Focus trap for the submit-confirmation dialog, same reasoning as the
  // exam-code modal: without it, Tab can leak focus onto the exam page
  // sitting behind the overlay.
  useEffect(() => {
    if (!showSubmitDialog) return;

    const handleTrap = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !submitDialogRef.current) return;

      const focusable = submitDialogRef.current.querySelectorAll<HTMLElement>(
        'button, a[href], input, [tabindex]:not([tabindex="-1"])',
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
  }, [showSubmitDialog]);

  // When the exam finishes (submitted or time-out) or the exam-not-found
  // screen appears, move focus to that screen's heading. Otherwise a
  // screen reader user's focus is left on a button/element that no
  // longer exists, and they get no indication anything happened.
  useEffect(() => {
    if (isSubmitted) {
      submittedHeadingRef.current?.focus();
    }
  }, [isSubmitted]);

  useEffect(() => {
    if (!exam) {
      notFoundHeadingRef.current?.focus();
    }
  }, [exam]);

  if (!exam) {
    return (
      <div className="min-h-screen bg-[#E8F0FE] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full border border-[#B8D0E8] text-center">
          <h1
            ref={notFoundHeadingRef}
            tabIndex={-1}
            className="text-2xl font-bold text-[#1A3A5C] mb-4">
            Exam Not Found
          </h1>
          <p className="text-[#5A7A9A] mb-6">The examination you are looking for does not exist.</p>
          <a
            href="/student/exams"
            className="inline-block bg-[#1A3A5C] hover:bg-[#14304D] text-white font-medium px-6 py-2 rounded-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/50">
            Return to Exams
          </a>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[#E8F0FE] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full border border-[#B8D0E8] text-center">
          <div
            className={`p-4 rounded-lg mb-6 border ${
              statusMessage?.type === "warning"
                ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                : "bg-green-100 text-green-800 border-green-300"
            }`}>
            <h1
              ref={submittedHeadingRef}
              tabIndex={-1}
              className="text-2xl font-bold mb-2 focus:outline-none">
              Exam Submitted
            </h1>
            <p>Your answers have been recorded successfully.</p>
          </div>
          <div className="bg-[#F8FAFE] border border-[#C5D8EC] rounded-lg p-4 mb-6">
            <p className="text-[#4A6A8A]">
              <span className="font-medium">Subject:</span> {exam.subject}
            </p>
            <p className="text-[#4A6A8A]">
              <span className="font-medium">Type:</span> {getExamTypeLabel(exam.type)}
            </p>
            <p className="text-[#4A6A8A]">
              <span className="font-medium">Questions Answered:</span> {getAnsweredCount()} of{" "}
              {getTotalQuestions()}
            </p>
            {statusMessage?.type === "warning" && (
              <p className="text-yellow-700 mt-2 text-sm">{statusMessage.text}</p>
            )}
          </div>
          <a
            href="/student/exams"
            className="inline-block bg-[#1A3A5C] hover:bg-[#14304D] text-white font-medium px-6 py-2 rounded-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/50">
            Return to Exams
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E8F0FE] py-6 px-4 font-sans">
      <div className="max-w-3xl mx-auto">
        {/* Exam Header */}
        <header className="bg-[#1A3A5C] rounded-t-2xl px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-wide">{exam.subject}</h1>
              <p className="text-[#8BB8E8] text-sm">
                {exam.class} • {exam.term} • {getExamTypeLabel(exam.type)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-white/70 text-sm">
                {exam.date} at {exam.time}
              </p>
              <p className="text-white/70 text-sm">Time Allowed: {exam.duration} min</p>
            </div>
          </div>
        </header>

        {/* Timer & Progress */}
        <div className="bg-white border-x border-[#B8D0E8] px-6 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-[#1A3A5C]">Timer:</span>
            {/* The visible clock is NOT a live region — updating it every
                second would make a screen reader narrate the countdown
                constantly. A hidden region below announces at checkpoints
                instead. */}
            <span
              className={`text-xl font-bold font-mono ${
                timeRemaining < 300 ? "text-red-600 animate-pulse" : "text-[#1A3A5C]"
              }`}
              aria-hidden="true">
              {formatTime(timeRemaining)}
            </span>
            <span className="sr-only" role="timer" aria-live="polite" aria-atomic="true">
              {timerAnnouncement}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#4A6A8A]">
              {getAnsweredCount()} / {getTotalQuestions()} answered
            </span>
            {!isExamStarted && (
              <button
                onClick={handleStartExam}
                className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-1.5 rounded-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-green-500/50">
                Start Exam
              </button>
            )}
          </div>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div
            role={statusMessage.type === "success" ? "status" : "alert"}
            aria-live={statusMessage.type === "success" ? "polite" : "assertive"}
            className={`px-6 py-3 border-x ${
              statusMessage.type === "success"
                ? "bg-green-100 text-green-800 border-green-300"
                : statusMessage.type === "warning"
                  ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                  : "bg-red-100 text-red-800 border-red-300"
            }`}>
            {statusMessage.text}
          </div>
        )}

        {/* Exam Content */}
        <main className="bg-white rounded-b-2xl shadow-2xl overflow-hidden border border-[#B8D0E8] p-6">
          {/* Instructions */}
          {!isExamStarted && (
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-[#1A3A5C] mb-3">Instructions</h2>
              <div className="bg-[#F8FAFE] border border-[#C5D8EC] rounded-lg p-4">
                <ol className="space-y-2">
                  {exam.instructions.map((instruction, index) => (
                    <li key={index} className="flex items-start gap-3 text-[#4A6A8A]">
                      <span className="text-[#1A3A5C] font-bold mt-0.5" aria-hidden="true">
                        {index + 1}.
                      </span>
                      <span>{instruction}</span>
                    </li>
                  ))}
                </ol>
                <p className="text-sm text-[#8A9CAE] mt-3 pt-3 border-t border-[#E8EEF5]">
                  Click &quot;Start Exam&quot; above to begin. The timer starts as soon as you do.
                </p>
              </div>
            </div>
          )}

          {/* Questions */}
          {isExamStarted && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold text-[#1A3A5C] border-b border-[#E8EEF5] pb-3">
                Questions
              </h2>
              {exam.questions.map((question, index) => {
                const isAnswered = Boolean(answers[question.id]);
                return (
                  <div
                    key={question.id}
                    id={`question-${index}`}
                    tabIndex={-1}
                    className="border border-[#C5D8EC] rounded-lg p-4 bg-[#F8FAFE] focus-within:ring-2 focus-within:ring-[#2B6CB0] focus-within:border-transparent focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]"
                    role="group"
                    aria-labelledby={`question-label-${question.id}`}>
                    <div className="flex justify-between items-start mb-3">
                      <h3
                        id={`question-label-${question.id}`}
                        className="text-base font-medium text-[#1A3A5C]">
                        Question {index + 1} of {getTotalQuestions()}
                        {question.type === "theory" && " (Theory)"}
                        {isAnswered && <span className="sr-only"> — answered</span>}
                      </h3>
                    </div>
                    <p className="text-[#4A6A8A] mb-3 whitespace-pre-wrap">{question.text}</p>

                    {/* Objective Questions */}
                    {question.type === "objective" && question.options && (
                      <div
                        className="space-y-2"
                        role="radiogroup"
                        aria-labelledby={`question-label-${question.id}`}
                        aria-required="true">
                        {question.options.map((option, optIndex) => {
                          const letter = String.fromCharCode(65 + optIndex);
                          return (
                            <label
                              key={optIndex}
                              className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition ${
                                answers[question.id] === option
                                  ? "bg-[#D4E4F7] ring-2 ring-[#2B6CB0]"
                                  : "hover:bg-[#E8EEF5]"
                              }`}>
                              <input
                                type="radio"
                                name={`question-${question.id}`}
                                value={option}
                                checked={answers[question.id] === option}
                                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                className="w-4 h-4 text-[#1A3A5C] focus:ring-2 focus:ring-[#2B6CB0]"
                                aria-label={`Option ${letter}: ${option}`}
                              />
                              <span className="text-[#4A6A8A] font-medium" aria-hidden="true">
                                {letter}.
                              </span>
                              <span className="text-[#4A6A8A]" aria-hidden="true">
                                {option}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {/* Theory Questions */}
                    {question.type === "theory" && (
                      <div>
                        <label htmlFor={`answer-${question.id}`} className="sr-only">
                          Your answer for question {index + 1}
                        </label>
                        <textarea
                          id={`answer-${question.id}`}
                          value={answers[question.id] || ""}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          rows={6}
                          className="w-full px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-white text-[#1A1A1A] resize-y"
                          placeholder="Write your answer here..."
                          aria-describedby={`question-label-${question.id} char-count-${question.id}`}
                        />
                        <p id={`char-count-${question.id}`} className="text-xs text-[#8A9CAE] mt-1">
                          {answers[question.id]?.length || 0} characters typed
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Submit Button */}
              <div className="flex flex-col sm:flex-row gap-4 justify-end border-t border-[#E8EEF5] pt-6 mt-4">
                <a
                  href="/student/exams"
                  className="bg-[#E8EEF5] hover:bg-[#D5DFE8] text-[#1A3A5C] font-medium py-2.5 px-6 rounded-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/30 text-center">
                  Quit Exam
                </a>
                <button
                  ref={submitButtonRef}
                  onClick={handleSubmitExam}
                  className="bg-[#1A3A5C] hover:bg-[#14304D] text-white font-medium py-2.5 px-6 rounded-lg transition duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/50 active:scale-[0.98]"
                  aria-label={`Submit your exam. ${getAnsweredCount()} of ${getTotalQuestions()} questions answered.`}>
                  Submit Exam
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Submit Confirmation Dialog */}
      {showSubmitDialog && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) cancelSubmit();
          }}>
          <div
            ref={submitDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-[#B8D0E8]">
            <div className="bg-[#1A3A5C] -mx-6 -mt-6 px-6 py-4 rounded-t-2xl">
              <h2 id="dialog-title" className="text-xl font-bold text-white">
                Submit Examination?
              </h2>
            </div>

            <div className="mt-6">
              <p className="text-[#4A6A8A] mb-4">
                You are about to submit your {exam.type} examination.
              </p>
              <div className="bg-[#F8FAFE] border border-[#C5D8EC] rounded-lg p-4 mb-4">
                <p className="text-sm text-[#4A6A8A]">
                  <span className="font-medium">Answered:</span> {getAnsweredCount()} of{" "}
                  {getTotalQuestions()}
                </p>
                <p className="text-sm text-[#4A6A8A]">
                  <span className="font-medium">Time remaining:</span> {formatTime(timeRemaining)}
                </p>
              </div>
              <p className="text-sm text-yellow-700 mb-4">This action cannot be undone.</p>

              <div className="flex gap-3">
                <button
                  onClick={cancelSubmit}
                  className="flex-1 bg-[#E8EEF5] hover:bg-[#D5DFE8] text-[#1A3A5C] font-medium py-2.5 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/30">
                  Cancel
                </button>
                <button
                  id="confirm-submit"
                  onClick={confirmSubmit}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-red-500/50 active:scale-[0.98]">
                  Yes, Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamPage;
