"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { BankQuestion } from "../types/exam.types";

interface StatusMessage {
  type: "success" | "error" | "warning";
  text: string;
}

type RequiredField = "title" | "subject" | "class" | "term" | "date" | "time";
type FieldErrors = Partial<Record<RequiredField, string>>;

interface FormData {
  title: string;
  subject: string;
  class: string;
  term: string;
  date: string;
  time: string;
  duration: number;
  type: "objective" | "theory" | "mixed";
  instructions: string;
  passingScore: number;
  shuffleQuestions: boolean;
}

interface SubjectOption {
  id: string;
  name: string;
  code: string;
}

// Capitalizes the lowercase UI values ("objective") to what the backend's
// enums actually expect ("Objective"). Keeping the UI on lowercase avoids
// touching ExamDetailsSection/ScheduleSection's existing option values.
function toBackendType(type: FormData["type"]): "Objective" | "Theory" | "Mixed" {
  return (type.charAt(0).toUpperCase() + type.slice(1)) as "Objective" | "Theory" | "Mixed";
}

function currentAcademicYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  // Nigerian school year conventionally runs Sept -> July. Before
  // September, we're still in the year that started the previous
  // September.
  const startYear = now.getMonth() >= 8 ? year : year - 1;
  return `${startYear}/${startYear + 1}`;
}

export function useCreateExamWithQuestions() {
  const [formData, setFormData] = useState<FormData>({
    title: "",
    subject: "",
    class: "",
    term: "",
    date: "",
    time: "",
    duration: 60,
    type: "objective",
    instructions: "",
    passingScore: 40,
    shuffleQuestions: false,
  });
  // Not shown in any section you've built yet (ExamDetailsSection etc.
  // weren't shared with me) - defaults sensibly and is sent to the
  // backend as-is. Add an input for it if you want admins to override
  // the auto-computed value; until then this is what gets submitted.
  const [academicYear, setAcademicYear] = useState(currentAcademicYear());

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [createdExamCode, setCreatedExamCode] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);

  const [selectedQuestions, setSelectedQuestions] = useState<BankQuestion[]>([]);
  const [bankQuestions, setBankQuestions] = useState<BankQuestion[]>([]);
  const [isLoadingBank, setIsLoadingBank] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [showQuestionBank, setShowQuestionBank] = useState(false);

  // --- Bulk CSV import (new) -----------------------------------------
  // The exam doesn't exist yet while filling this form, so the file is
  // just held onto here and actually uploaded to
  // /api/admin/exams/[examId]/questions/bulk AFTER the exam is created
  // during handleSubmit - not at selection time.
  const [questionsCsvFile, setQuestionsCsvFile] = useState<File | null>(null);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [partialErrorMessage, setPartialErrorMessage] = useState<string | null>(null);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const fieldRefs = useRef<Partial<Record<RequiredField, HTMLElement | null>>>({});

  const totalMarks = useMemo(
    () => selectedQuestions.reduce((sum, q) => sum + q.marks, 0),
    [selectedQuestions],
  );

  // --- Load subjects once ----------------------------------------------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoadingSubjects(true);
      try {
        const res = await fetch("/api/admin/subjects?status=active");
        if (res.ok) {
          const { subjects: apiSubjects } = await res.json();
          if (!cancelled) {
            setSubjects(apiSubjects.map((s: any) => ({ id: s._id, name: s.name, code: s.code })));
          }
        }
      } finally {
        if (!cancelled) setIsLoadingSubjects(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // --- Load/filter the question bank, server-side ----------------------
  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(async () => {
      setIsLoadingBank(true);
      try {
        const params = new URLSearchParams();
        if (searchTerm) params.set("search", searchTerm);
        if (filterType) params.set("type", filterType);
        if (filterSubject) params.set("subject", filterSubject);
        if (filterClass) params.set("class", filterClass);

        const res = await fetch(`/api/admin/questions?${params.toString()}`);
        if (res.ok) {
          const { questions } = await res.json();
          if (!cancelled) {
            setBankQuestions(
              questions.map((q: any) => ({
                id: q._id,
                text: q.text,
                type: q.type,
                subject: q.subject,
                class: q.class,
                marks: q.marks,
                options: q.options,
                correctAnswer: q.correctAnswer,
              })),
            );
          }
        }
      } finally {
        if (!cancelled) setIsLoadingBank(false);
      }
      // Debounced - avoids firing a request on every keystroke in the
      // search box.
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [searchTerm, filterType, filterSubject, filterClass]);

  // filteredQuestions and questionBank are the same list here - the
  // filtering already happened server-side above via the query params,
  // there's no separate client-side pass to apply. Kept as two names
  // since that's the shape the existing QuestionsSection component
  // expects.
  const filteredQuestions = bankQuestions;

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value, type } = e.target;
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : type === "number" ? parseInt(value) || 0 : value,
      }));
      if (name in fieldErrors) {
        setFieldErrors((prev) => {
          const next = { ...prev };
          delete next[name as RequiredField];
          return next;
        });
      }
    },
    [fieldErrors],
  );

  const handleAddQuestion = useCallback((question: BankQuestion) => {
    setSelectedQuestions((prev) => {
      if (prev.some((q) => q.id === question.id)) return prev; // no duplicates
      return [...prev, question];
    });
  }, []);

  const handleRemoveQuestion = useCallback((questionId: string) => {
    setSelectedQuestions((prev) => prev.filter((q) => q.id !== questionId));
  }, []);

  const handleQuestionsCsvSelect = useCallback((file: File | null) => {
    setQuestionsCsvFile(file);
  }, []);

  const clearQuestionsCsvFile = useCallback(() => setQuestionsCsvFile(null), []);

  const validate = useCallback((): FieldErrors => {
    const errors: FieldErrors = {};
    if (!formData.title.trim()) errors.title = "Exam title is required.";
    if (!formData.subject) errors.subject = "Please select a subject.";
    if (!formData.class) errors.class = "Please select a class.";
    if (!formData.term) errors.term = "Please select a term.";
    if (!formData.date) errors.date = "Exam date is required.";
    if (!formData.time) errors.time = "Exam time is required.";
    return errors;
  }, [formData]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const errors = validate();
      setFieldErrors(errors);
      const errorFields = Object.keys(errors) as RequiredField[];
      if (errorFields.length > 0) {
        setStatusMessage({
          type: "error",
          text: `Please fix ${errorFields.length} field${errorFields.length > 1 ? "s" : ""} before submitting.`,
        });
        fieldRefs.current[errorFields[0]]?.focus();
        return;
      }

      setStatusMessage(null);
      setIsSubmitting(true);

      try {
        // Step 1: create the exam shell.
        const examDate = new Date(`${formData.date}T${formData.time}`).toISOString();
        const createRes = await fetch("/api/admin/exams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formData.title,
            subject: formData.subject,
            class: formData.class,
            term: formData.term,
            academicYear,
            type: toBackendType(formData.type),
            examDate,
            duration: formData.duration,
            instructions: formData.instructions,
            passingScore: formData.passingScore,
            shuffleQuestions: formData.shuffleQuestions,
          }),
        });
        const createBody = await createRes.json();
        if (!createRes.ok) throw new Error(createBody.error ?? "Failed to create exam");

        const examId = createBody.exam._id;
        setCreatedExamCode(createBody.exam.examCode);

        // Step 2: attach any bank-selected questions.
        if (selectedQuestions.length > 0) {
          const attachRes = await fetch(`/api/admin/exams/${examId}/questions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ questionIds: selectedQuestions.map((q) => q.id) }),
          });
          if (!attachRes.ok) {
            const body = await attachRes.json().catch(() => ({}));
            // The exam DOES exist at this point - not a full failure, so
            // don't treat it as one. Let the admin finish from the edit
            // page instead of leaving them with nothing.
            setPartialErrorMessage(
              `The exam was created, but attaching the selected bank questions failed: ${body.error ?? "unknown error"}. You can add them from the exam's edit page.`,
            );
          }
        }

        // Step 3: upload the CSV, if one was chosen.
        if (questionsCsvFile) {
          const csvForm = new FormData();
          csvForm.append("file", questionsCsvFile);
          const csvRes = await fetch(`/api/admin/exams/${examId}/questions/bulk`, {
            method: "POST",
            body: csvForm,
          });
          if (!csvRes.ok) {
            const body = await csvRes.json().catch(() => ({}));
            const rowErrorSummary = Array.isArray(body.rowErrors)
              ? ` (${body.rowErrors.length} row error(s) - e.g. row ${body.rowErrors[0]?.row}: ${body.rowErrors[0]?.error})`
              : "";
            setPartialErrorMessage(
              (prev) =>
                `${prev ? prev + " " : ""}The exam was created, but the CSV question import failed: ${body.error ?? "unknown error"}${rowErrorSummary}. You can retry the import from the exam's edit page.`,
            );
          }
        }

        setIsSubmitted(true);
      } catch (err) {
        setStatusMessage({
          type: "error",
          text: err instanceof Error ? err.message : "Failed to create exam.",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, academicYear, selectedQuestions, questionsCsvFile, validate],
  );

  const resetForm = useCallback(() => {
    setFormData({
      title: "",
      subject: "",
      class: "",
      term: "",
      date: "",
      time: "",
      duration: 60,
      type: "objective",
      instructions: "",
      passingScore: 40,
      shuffleQuestions: false,
    });
    setAcademicYear(currentAcademicYear());
    setSelectedQuestions([]);
    setQuestionsCsvFile(null);
    setPartialErrorMessage(null);
    setIsSubmitted(false);
    setCreatedExamCode(null);
    setStatusMessage(null);
    setFieldErrors({});
  }, []);

  return {
    formData,
    academicYear,
    setAcademicYear,
    isSubmitting,
    isSubmitted,
    createdExamCode,
    statusMessage,
    fieldErrors,
    subjects,
    isLoadingSubjects,
    selectedQuestions,
    filteredQuestions,
    isLoadingBank,
    searchTerm,
    filterType,
    filterSubject,
    filterClass,
    showQuestionBank,
    totalMarks,
    titleInputRef,
    fieldRefs,
    questionsCsvFile,
    showBulkImportModal,
    partialErrorMessage,
    handleInputChange,
    handleAddQuestion,
    handleRemoveQuestion,
    handleQuestionsCsvSelect,
    clearQuestionsCsvFile,
    handleSubmit,
    resetForm,
    setSearchTerm,
    setFilterType,
    setFilterSubject,
    setFilterClass,
    setShowQuestionBank,
    setShowBulkImportModal,
    clearPartialErrorMessage: () => setPartialErrorMessage(null),
  };
}
