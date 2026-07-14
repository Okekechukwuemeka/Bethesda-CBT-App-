"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { QuestionInput, Subject } from "@/types/question";
import { ClassLevel } from "@/lib/models/constants";

export interface ExamQuestion {
  _id: string;
  text: string;
  type: "Objective" | "Theory";
  options?: string[];
  correctAnswer?: string;
  marks: number;
  subject: string | { _id: string; name: string };
  class: ClassLevel;
}

export interface ExamSummary {
  title: string;
  subject: string | { _id: string; name: string };
  class: string;
}

interface StatusMessage {
  type: "success" | "error" | "warning";
  text: string;
}

const emptyFormData: QuestionInput = {
  text: "",
  type: "Objective",
  options: ["", "", "", ""],
  correctAnswer: "",
  marks: 5,
  subject: "",
  class: "",
};

export const useExamQuestions = (examId: string) => {
  const [exam, setExam] = useState<ExamSummary | null>(null);

  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<ExamQuestion | null>(null);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  // Delete goes through ConfirmDialog, never window.confirm()
  const [questionPendingDelete, setQuestionPendingDelete] = useState<ExamQuestion | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const triggerRef = useRef<HTMLElement | null>(null);
  const [formData, setFormData] = useState<QuestionInput>(emptyFormData);

  // --- Load the exam's own details (title, subject, class) -----------
  // Used only for the page header - if this fetch fails, the page still
  // works fine, it just falls back to showing "Loading exam details…"
  // instead of a real title.
  useEffect(() => {
    if (!examId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/admin/exams/${examId}`);
        if (res.ok) {
          const { exam: apiExam } = await res.json();
          if (!cancelled) {
            setExam({
              title: apiExam.title,
              subject: apiExam.subject,
              class: apiExam.class,
            });
          }
        }
      } catch {
        // non-fatal, see comment above
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [examId]);

  // --- Load this exam's attached questions ---------------------------
  const loadQuestions = useCallback(async () => {
    if (!examId) return;
    setIsLoadingQuestions(true);
    try {
      const res = await fetch(`/api/admin/exams/${examId}/questions`);
      if (res.ok) {
        const { questions: apiQuestions } = await res.json();
        setQuestions(apiQuestions);
      } else {
        setStatusMessage({ type: "error", text: "Failed to load this exam's questions." });
      }
    } catch {
      setStatusMessage({ type: "error", text: "Could not reach the server to load questions." });
    } finally {
      setIsLoadingQuestions(false);
    }
  }, [examId]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  // --- Load subjects, once ---------------------------------------------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoadingSubjects(true);
      try {
        const res = await fetch("/api/admin/subjects?status=active");
        if (res.ok) {
          const { subjects: apiSubjects } = await res.json();
          if (!cancelled) setSubjects(apiSubjects);
        }
      } finally {
        if (!cancelled) setIsLoadingSubjects(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value, type } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: type === "number" ? Number(value) : value,
      }));
    },
    [],
  );

  const handleOptionChange = useCallback((index: number, value: string) => {
    setFormData((prev) => {
      const newOptions = [...(prev.options || ["", "", "", ""])];
      newOptions[index] = value;
      return { ...prev, options: newOptions };
    });
  }, []);

  const handleAddQuestion = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    triggerRef.current = e.currentTarget;
    setIsEditing(false);
    setSelectedQuestion(null);
    setFormError(null);
    setFormData(emptyFormData);
    setIsModalOpen(true);
  }, []);

  const handleEditQuestion = useCallback(
    (question: ExamQuestion, e: React.MouseEvent<HTMLButtonElement>) => {
      triggerRef.current = e.currentTarget;
      setIsEditing(true);
      setSelectedQuestion(question);
      setFormError(null);
      setFormData({
        text: question.text,
        type: question.type,
        options: question.options ?? ["", "", "", ""],
        correctAnswer: question.correctAnswer ?? "",
        marks: question.marks,
        subject: typeof question.subject === "string" ? question.subject : question.subject._id,
        class: question.class,
      });
      setIsModalOpen(true);
    },
    [],
  );

  // --- Delete flow, driven by ConfirmDialog -----------------------------
  const requestDeleteQuestion = useCallback((question: ExamQuestion) => {
    setQuestionPendingDelete(question);
  }, []);

  const cancelDeleteQuestion = useCallback(() => {
    if (isDeleting) return;
    setQuestionPendingDelete(null);
  }, [isDeleting]);

  const confirmDeleteQuestion = useCallback(async () => {
    if (!questionPendingDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/exams/${examId}/questions/${questionPendingDelete._id}`, {
        method: "DELETE",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Failed to remove question");

      setQuestions((prev) => prev.filter((q) => q._id !== questionPendingDelete._id));
      setStatusMessage({ type: "warning", text: "Question removed from exam successfully." });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to remove question.",
      });
    } finally {
      setIsDeleting(false);
      setQuestionPendingDelete(null);
    }
  }, [examId, questionPendingDelete]);

  const closeModal = useCallback(() => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setFormError(null);
  }, [isSubmitting]);

  const validateForm = (): string | null => {
    if (!formData.text?.trim()) return "Please enter the question text.";
    if (!formData.subject) return "Please select a subject.";
    if (!formData.class) return "Please select a class.";
    if (!formData.marks || formData.marks < 1) return "Marks must be at least 1.";
    if (
      formData.type === "Objective" &&
      (!formData.options || formData.options.some((opt) => !opt?.trim()))
    ) {
      return "Please provide all four options for objective questions.";
    }
    if (formData.type === "Objective" && !formData.correctAnswer?.trim()) {
      return "Please provide the correct answer for objective questions.";
    }
    return null;
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const validationError = validateForm();
      if (validationError) {
        setFormError(validationError);
        return;
      }

      setFormError(null);
      setIsSubmitting(true);

      try {
        if (isEditing && selectedQuestion) {
          // Confirm this route exists - not seen in any file shared so far.
          const res = await fetch(`/api/admin/questions/${selectedQuestion._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
          });
          const body = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(body.error ?? "Failed to update question");

          setQuestions((prev) =>
            prev.map((q) => (q._id === selectedQuestion._id ? { ...q, ...body.question } : q)),
          );
          setStatusMessage({ type: "success", text: "Question updated successfully." });
        } else {
          const res = await fetch(`/api/admin/exams/${examId}/questions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ newQuestions: [formData] }),
          });
          const body = await res.json().catch(() => ({}));
          if (!res.ok) {
            const itemError = body.itemErrors?.[0]?.error;
            throw new Error(itemError ?? body.error ?? "Failed to add question");
          }
          await loadQuestions();
          setStatusMessage({ type: "success", text: "Question added to exam successfully." });
        }

        setIsModalOpen(false);
        setTimeout(() => setStatusMessage(null), 3000);
      } catch (err) {
        setFormError(err instanceof Error ? err.message : "Failed to save question.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, isEditing, selectedQuestion, examId, loadQuestions],
  );

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (!q?.text || !q?.type) return false; // skip malformed entries instead of crashing
      const matchesSearch = q.text.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === "all" || q.type.toLowerCase() === filterType;
      return matchesSearch && matchesType;
    });
  }, [questions, searchTerm, filterType]);

  const totalMarks = useMemo(() => questions.reduce((sum, q) => sum + q.marks, 0), [questions]);

  return {
    exam,
    questions,
    filteredQuestions,
    isLoadingQuestions,
    subjects,
    isLoadingSubjects,
    isModalOpen,
    isEditing,
    formData,
    formError,
    isSubmitting,
    statusMessage,
    searchTerm,
    filterType,
    totalMarks,
    triggerRef,
    questionPendingDelete,
    isDeleting,
    setSearchTerm,
    setFilterType,
    handleInputChange,
    handleOptionChange,
    handleAddQuestion,
    handleEditQuestion,
    requestDeleteQuestion,
    cancelDeleteQuestion,
    confirmDeleteQuestion,
    handleSubmit,
    closeModal,
  };
};
