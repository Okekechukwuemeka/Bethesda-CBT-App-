"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface StatusMessage {
  type: "success" | "error" | "warning";
  text: string;
}

type RequiredField = "title" | "subject" | "class" | "term" | "date" | "time";
type FieldErrors = Partial<Record<RequiredField, string>>;

interface FormData {
  title: string;
  subject: string; // Subject _id
  class: string;
  term: string;
  date: string;
  time: string;
  duration: number;
  type: "objective" | "theory" | "mixed";
  instructions: string;
  passingScore: number;
  shuffleQuestions: boolean;
  status: "scheduled" | "ongoing" | "completed";
}

interface SubjectOption {
  id: string;
  name: string;
  code: string;
}

function toBackendType(type: FormData["type"]): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}
function toBackendStatus(status: FormData["status"]): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}
function fromBackendEnum<T extends string>(value: string): T {
  return value.toLowerCase() as T;
}

export function useEditExam(examId: string) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [forceDeleteWarning, setForceDeleteWarning] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const fieldRefs = useRef<Partial<Record<RequiredField, HTMLElement | null>>>({});

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
    status: "scheduled",
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const [examRes, subjectsRes] = await Promise.all([
          fetch(`/api/admin/exams/${examId}`),
          fetch("/api/admin/subjects?status=active"),
        ]);

        if (subjectsRes.ok) {
          const { subjects: apiSubjects } = await subjectsRes.json();
          if (!cancelled) {
            setSubjects(apiSubjects.map((s: any) => ({ id: s._id, name: s.name, code: s.code })));
          }
        }

        if (!examRes.ok) throw new Error("Exam not found");
        const { exam } = await examRes.json();
        if (cancelled) return;

        const examDate = new Date(exam.examDate);
        setFormData({
          title: exam.title,
          subject: exam.subject?._id ?? exam.subject,
          class: exam.class,
          term: exam.term,
          date: examDate.toISOString().split("T")[0],
          time: examDate.toISOString().split("T")[1].slice(0, 5),
          duration: exam.duration,
          type: fromBackendEnum(exam.type),
          instructions: exam.instructions ?? "",
          passingScore: exam.passingScore ?? 40,
          shuffleQuestions: exam.shuffleQuestions ?? false,
          status: fromBackendEnum(exam.status),
        });
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "Failed to load exam");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [examId]);

  useEffect(() => {
    if (!isLoading) {
      titleInputRef.current?.focus();
    }
  }, [isLoading]);

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
        const examDate = new Date(`${formData.date}T${formData.time}`).toISOString();
        const res = await fetch(`/api/admin/exams/${examId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formData.title,
            subject: formData.subject,
            class: formData.class,
            term: formData.term,
            type: toBackendType(formData.type),
            examDate,
            duration: formData.duration,
            instructions: formData.instructions,
            passingScore: formData.passingScore,
            shuffleQuestions: formData.shuffleQuestions,
            status: toBackendStatus(formData.status),
          }),
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? "Failed to update exam");

        setStatusMessage({ type: "success", text: "Exam updated successfully." });
      } catch (err) {
        setStatusMessage({
          type: "error",
          text: err instanceof Error ? err.message : "Failed to update exam.",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, examId, validate],
  );

  const handleDelete = useCallback(() => {
    setShowDeleteConfirm(true);
    setForceDeleteWarning(null);
  }, []);

  const cancelDeleteConfirm = useCallback(() => {
    setShowDeleteConfirm(false);
    setForceDeleteWarning(null);
  }, []);

  const performDelete = useCallback(
    async (force = false) => {
      setIsSubmitting(true);
      try {
        const res = await fetch(`/api/admin/exams/${examId}${force ? "?force=true" : ""}`, {
          method: "DELETE",
        });
        const body = await res.json().catch(() => ({}));

        if (res.status === 409 && !force) {
          setForceDeleteWarning(body.error ?? "This exam has student submissions attached to it.");
          setIsSubmitting(false);
          return;
        }

        if (!res.ok) throw new Error(body.error ?? "Failed to delete exam");

        setShowDeleteConfirm(false);
        setIsSubmitting(false);
        setIsDeleted(true);
      } catch (err) {
        setIsSubmitting(false);
        setStatusMessage({
          type: "error",
          text: err instanceof Error ? err.message : "Failed to delete exam.",
        });
      }
    },
    [examId],
  );

  return {
    isLoading,
    isSubmitting,
    isDeleted,
    statusMessage,
    fieldErrors,
    showDeleteConfirm,
    forceDeleteWarning,
    subjects,
    loadError,
    formData,
    titleInputRef,
    fieldRefs,
    handleInputChange,
    handleSubmit,
    handleDelete,
    cancelDeleteConfirm,
    performDelete,
  };
}
