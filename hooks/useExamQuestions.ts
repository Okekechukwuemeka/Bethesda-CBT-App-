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

// Separate shape from ExamQuestion - this is a bank question NOT yet
// attached to this exam, as returned by GET /api/admin/questions.
export interface BankQuestion {
  _id: string;
  text: string;
  type: "Objective" | "Theory";
  options?: string[];
  correctAnswer?: string;
  marks: number;
  subject: string | { _id: string; name: string };
  class: ClassLevel;
}

interface StatusMessage {
  type: "success" | "error" | "warning";
  text: string;
}

const emptyFormData: QuestionInput = {
  text: "",
  type: "Objective",
  options: ["", ""], // starts at the model's minimum, not a fixed 4
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

  const [questionPendingDelete, setQuestionPendingDelete] = useState<ExamQuestion | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const triggerRef = useRef<HTMLElement | null>(null);
  const [formData, setFormData] = useState<QuestionInput>(emptyFormData);

  // --- Bank browsing (new): pick EXISTING bank questions to attach ---
  const [showQuestionBank, setShowQuestionBank] = useState(false);
  const [bankQuestions, setBankQuestions] = useState<BankQuestion[]>([]);
  const [isLoadingBank, setIsLoadingBank] = useState(false);
  const [bankSearchTerm, setBankSearchTerm] = useState("");
  const [bankFilterType, setBankFilterType] = useState("");
  const [bankFilterSubject, setBankFilterSubject] = useState("");
  const [bankFilterClass, setBankFilterClass] = useState("");
  const [isAttaching, setIsAttaching] = useState(false);

  // --- Load the exam's own details (title, subject, class) -----------
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
        // non-fatal - page falls back to "Loading exam details…"
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

  // --- Load/filter the question bank, server-side, debounced -----------
  // Defaults the filters to this exam's own subject/class the first time
  // the bank is opened, since that's almost always what an admin wants -
  // they can still change the filters afterward.
  const bankFiltersInitialized = useRef(false);
  useEffect(() => {
    if (!showQuestionBank || bankFiltersInitialized.current || !exam) return;
    bankFiltersInitialized.current = true;
    const subjectId = typeof exam.subject === "string" ? exam.subject : exam.subject._id;
    setBankFilterSubject(subjectId ?? "");
    setBankFilterClass(exam.class ?? "");
  }, [showQuestionBank, exam]);

  useEffect(() => {
    if (!showQuestionBank) return;
    let cancelled = false;
    const timeout = setTimeout(async () => {
      setIsLoadingBank(true);
      try {
        const params = new URLSearchParams();
        if (bankSearchTerm) params.set("search", bankSearchTerm);
        if (bankFilterType) params.set("type", bankFilterType);
        if (bankFilterSubject) params.set("subject", bankFilterSubject);
        if (bankFilterClass) params.set("class", bankFilterClass);

        const res = await fetch(`/api/admin/questions?${params.toString()}`);
        if (res.ok) {
          const { questions: apiQuestions } = await res.json();
          if (!cancelled) setBankQuestions(apiQuestions);
        }
      } finally {
        if (!cancelled) setIsLoadingBank(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [showQuestionBank, bankSearchTerm, bankFilterType, bankFilterSubject, bankFilterClass]);

  const attachedIds = useMemo(() => new Set(questions.map((q) => q._id)), [questions]);

  // Bank questions already attached to this exam are marked, not hidden -
  // matches the "Added ✓" pattern used elsewhere (QuestionBankItem).
  const filteredBankQuestions = useMemo(
    () => bankQuestions.filter((q) => q?.text && q?.type),
    [bankQuestions],
  );

  const handleAttachBankQuestion = useCallback(
    async (question: BankQuestion) => {
      if (attachedIds.has(question._id) || isAttaching) return;
      setIsAttaching(true);
      try {
        const res = await fetch(`/api/admin/exams/${examId}/questions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionIds: [question._id] }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error ?? "Failed to attach question");

        await loadQuestions();
        setStatusMessage({ type: "success", text: "Question added to exam." });
        setTimeout(() => setStatusMessage(null), 3000);
      } catch (err) {
        setStatusMessage({
          type: "error",
          text: err instanceof Error ? err.message : "Failed to attach question.",
        });
      } finally {
        setIsAttaching(false);
      }
    },
    [examId, attachedIds, isAttaching, loadQuestions],
  );

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
      const newOptions = [...(prev.options || [])];
      newOptions[index] = value;
      return { ...prev, options: newOptions };
    });
  }, []);

  const handleAddOption = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      options: [...(prev.options || []), ""],
    }));
  }, []);

  const handleRemoveOption = useCallback((index: number) => {
    setFormData((prev) => {
      const options = [...(prev.options || [])];
      const removed = options[index];
      options.splice(index, 1);
      return {
        ...prev,
        options,
        correctAnswer: prev.correctAnswer === removed ? "" : prev.correctAnswer,
      };
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
        options: question.options?.length ? question.options : ["", ""],
        correctAnswer: question.correctAnswer ?? "",
        marks: question.marks,
        subject: typeof question.subject === "string" ? question.subject : question.subject._id,
        class: question.class,
      });
      setIsModalOpen(true);
    },
    [],
  );

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
    if (formData.type === "Objective") {
      const filledOptions = (formData.options || []).filter((opt) => opt?.trim());
      if (filledOptions.length < 2) {
        return "Please provide at least 2 options for objective questions.";
      }
      if (!formData.correctAnswer?.trim()) {
        return "Please select the correct answer for objective questions.";
      }
      if (!filledOptions.includes(formData.correctAnswer.trim())) {
        return "The correct answer must match one of the options exactly.";
      }
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

      const payload =
        formData.type === "Objective"
          ? { ...formData, options: formData.options?.filter((opt) => opt.trim()) }
          : { ...formData, options: undefined, correctAnswer: undefined };

      try {
        if (isEditing && selectedQuestion) {
          const res = await fetch(`/api/admin/questions/${selectedQuestion._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
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
            body: JSON.stringify({ newQuestions: [payload] }),
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
      if (!q?.text || !q?.type) return false;
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
    handleAddOption,
    handleRemoveOption,
    handleAddQuestion,
    handleEditQuestion,
    requestDeleteQuestion,
    cancelDeleteQuestion,
    confirmDeleteQuestion,
    handleSubmit,
    closeModal,

    // bank browsing/attach
    showQuestionBank,
    setShowQuestionBank,
    bankQuestions: filteredBankQuestions,
    isLoadingBank,
    bankSearchTerm,
    setBankSearchTerm,
    bankFilterType,
    setBankFilterType,
    bankFilterSubject,
    setBankFilterSubject,
    bankFilterClass,
    setBankFilterClass,
    attachedIds,
    isAttaching,
    handleAttachBankQuestion,
  };
};
