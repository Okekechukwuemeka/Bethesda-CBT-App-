"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface StatusMessage {
  type: "success" | "error" | "warning";
  text: string;
}

type RequiredField = "title" | "subject" | "class" | "term" | "date" | "time";
type FieldErrors = Partial<Record<RequiredField, string>>;
type TitleMode = "auto" | "custom";

interface FormData {
  title: string;
  subject: string;
  // Used when isGeneral is false (the default) - a single class.
  class: string;
  // Used when isGeneral is true - every class eligible to sit the exam.
  classes: string[];
  // A general exam isn't tied to one class - the admin picks any number
  // of classes (via `classes` above) that can all take it, e.g. a
  // school-wide aptitude test or scholarship exam.
  isGeneral: boolean;
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

function toBackendType(type: FormData["type"]): "Objective" | "Theory" | "Mixed" {
  return (type.charAt(0).toUpperCase() + type.slice(1)) as "Objective" | "Theory" | "Mixed";
}

function currentAcademicYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const startYear = now.getMonth() >= 8 ? year : year - 1;
  return `${startYear}/${startYear + 1}`;
}

export function useCreateExamWithQuestions() {
  const [formData, setFormData] = useState<FormData>({
    title: "",
    subject: "",
    class: "",
    classes: [],
    isGeneral: false,
    term: "",
    date: "",
    time: "",
    duration: 60,
    type: "objective",
    instructions: "",
    passingScore: 40,
    shuffleQuestions: false,
  });
  const [academicYear, setAcademicYear] = useState(currentAcademicYear());

  // "auto" computes title from class/term/subject as those fields fill
  // in; "custom" lets the admin type any title freely (e.g. "Midterm
  // Test"). Defaults to auto since that's the common case.
  const [titleMode, setTitleMode] = useState<TitleMode>("auto");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [createdExamCode, setCreatedExamCode] = useState<string | null>(null);
  const [createdExamId, setCreatedExamId] = useState<string | null>(null);
  const [importedQuestionCount, setImportedQuestionCount] = useState(0);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);

  // Question bank browsing/selection has been removed from exam creation.
  // Adding bank questions now happens on the exam's own "Questions" page
  // (/admin/exams/[id]/questions) after the exam exists - bulk CSV import
  // is the only way to seed questions at creation time.
  const [questionsCsvFile, setQuestionsCsvFile] = useState<File | null>(null);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [partialErrorMessage, setPartialErrorMessage] = useState<string | null>(null);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const fieldRefs = useRef<Partial<Record<RequiredField, HTMLElement | null>>>({});

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

  // Recomputes the title whenever class/term/subject change, but ONLY in
  // "auto" mode - switching to "custom" leaves whatever's currently there
  // alone so the admin can freely edit it.
  useEffect(() => {
    if (titleMode !== "auto") return;
    const subjectName = subjects.find((s) => s.id === formData.subject)?.name;
    // A general exam has no single class to lead the title with, so it's
    // prefixed with "General" instead (e.g. "General First Term
    // Mathematics Examination") once there's at least a term or subject
    // to go with it.
    const meaningfulParts = [formData.term, subjectName].filter(Boolean);
    let computed = "";
    if (formData.isGeneral) {
      if (meaningfulParts.length > 0) computed = `General ${meaningfulParts.join(" ")} Examination`;
    } else {
      const parts = [formData.class, ...meaningfulParts].filter(Boolean);
      if (parts.length > 0) computed = `${parts.join(" ")} Examination`;
    }
    setFormData((prev) => (prev.title === computed ? prev : { ...prev, title: computed }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    titleMode,
    formData.class,
    formData.isGeneral,
    formData.term,
    formData.subject,
    subjects,
  ]);

  const handleTitleModeChange = useCallback((mode: TitleMode) => {
    setTitleMode(mode);
    // Switching to custom starts from whatever the auto title currently
    // is, rather than clearing it - most admins just want to tweak the
    // auto-generated one, not start from scratch.
  }, []);

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

  // Switching modes clears whichever field doesn't apply anymore - a
  // general exam has no single `class`, a class-specific exam has no
  // `classes` list - so the form never submits stale data from the mode
  // it just left.
  const handleIsGeneralChange = useCallback((isGeneral: boolean) => {
    setFormData((prev) => ({
      ...prev,
      isGeneral,
      class: isGeneral ? "" : prev.class,
      classes: isGeneral ? prev.classes : [],
    }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.class;
      return next;
    });
  }, []);

  const handleClassesToggle = useCallback((classValue: string) => {
    setFormData((prev) => ({
      ...prev,
      classes: prev.classes.includes(classValue)
        ? prev.classes.filter((c) => c !== classValue)
        : [...prev.classes, classValue],
    }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.class;
      return next;
    });
  }, []);

  const handleQuestionsCsvSelect = useCallback((file: File | null) => {
    setQuestionsCsvFile(file);
  }, []);

  const clearQuestionsCsvFile = useCallback(() => setQuestionsCsvFile(null), []);

  const validate = useCallback((): FieldErrors => {
    const errors: FieldErrors = {};
    if (!formData.title.trim()) errors.title = "Exam title is required.";
    if (!formData.subject) errors.subject = "Please select a subject.";
    if (formData.isGeneral) {
      if (formData.classes.length === 0) {
        errors.class = "Please select at least one class.";
      }
    } else if (!formData.class) {
      errors.class = "Please select a class.";
    }
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
        const examDate = new Date(`${formData.date}T${formData.time}`).toISOString();
        const createRes = await fetch("/api/admin/exams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formData.title,
            subject: formData.subject,
            isGeneral: formData.isGeneral,
            class: formData.isGeneral ? undefined : formData.class,
            classes: formData.isGeneral ? formData.classes : undefined,
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
        setCreatedExamId(examId);

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
              `The exam was created, but the CSV question import failed: ${body.error ?? "unknown error"}${rowErrorSummary}. You can retry the import, or add questions manually, from the exam's Questions page.`,
            );
          } else {
            const csvBody = await csvRes.json();
            setImportedQuestionCount(csvBody.imported ?? csvBody.attached ?? 0);
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
    [formData, academicYear, questionsCsvFile, validate],
  );

  const resetForm = useCallback(() => {
    setFormData({
      title: "",
      subject: "",
      class: "",
      classes: [],
      isGeneral: false,
      term: "",
      date: "",
      time: "",
      duration: 60,
      type: "objective",
      instructions: "",
      passingScore: 40,
      shuffleQuestions: false,
    });
    setTitleMode("auto");
    setAcademicYear(currentAcademicYear());
    setQuestionsCsvFile(null);
    setImportedQuestionCount(0);
    setCreatedExamId(null);
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
    titleMode,
    handleTitleModeChange,
    isSubmitting,
    isSubmitted,
    createdExamCode,
    createdExamId,
    importedQuestionCount,
    statusMessage,
    fieldErrors,
    subjects,
    isLoadingSubjects,
    titleInputRef,
    fieldRefs,
    questionsCsvFile,
    showBulkImportModal,
    partialErrorMessage,
    handleInputChange,
    handleIsGeneralChange,
    handleClassesToggle,
    handleQuestionsCsvSelect,
    clearQuestionsCsvFile,
    handleSubmit,
    resetForm,
    setShowBulkImportModal,
    clearPartialErrorMessage: () => setPartialErrorMessage(null),
  };
}
