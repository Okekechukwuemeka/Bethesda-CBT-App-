"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import type { BlockingExam, Question, QuestionInput, RowError, Subject } from "@/types/question";

interface StatusMessage {
  type: "success" | "error" | "warning";
  text: string;
}

interface ApiErrorPayload {
  error?: string;
  rowErrors?: RowError[];
  exams?: BlockingExam[];
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

// Mirrors the parseErrorMessage helper used by useStudents - reads the
// JSON error body a route returns instead of just falling back to the
// generic status text.
async function parseErrorMessage(res: Response, fallback: string): Promise<string> {
  const data: ApiErrorPayload = await res.json().catch(() => ({}));
  return data.error || fallback;
}

async function parseErrorPayload(
  res: Response,
  fallback: string,
): Promise<Error & ApiErrorPayload> {
  const data: ApiErrorPayload = await res.json().catch(() => ({}));
  const error = new Error(data.error || fallback) as Error & ApiErrorPayload;
  error.rowErrors = data.rowErrors;
  error.exams = data.exams;
  return error;
}

export const useQuestionBank = () => {
  // --- data ---
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [questionsError, setQuestionsError] = useState<string | null>(null);

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);

  // --- filters (sent to the server as query params) ---
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterClass, setFilterClass] = useState<string>("all");

  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);

  // --- question form modal ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [formData, setFormData] = useState<QuestionInput>(emptyFormData);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formTriggerRef = useRef<HTMLElement | null>(null);

  // --- delete confirmation modal ---
  const [pendingDelete, setPendingDelete] = useState<Question | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteBlockedExams, setDeleteBlockedExams] = useState<BlockingExam[] | null>(null);
  const deleteTriggerRef = useRef<HTMLElement | null>(null);

  // --- bulk import modal ---
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewRowCount, setPreviewRowCount] = useState<number | null>(null);
  const [importSubject, setImportSubject] = useState("");
  const [importClass, setImportClass] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [importRowErrors, setImportRowErrors] = useState<RowError[] | null>(null);
  const importTriggerRef = useRef<HTMLElement | null>(null);

  // --- subject creation modal ---
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [subjectFormError, setSubjectFormError] = useState<string | null>(null);
  const [isSubmittingSubject, setIsSubmittingSubject] = useState(false);
  const subjectTriggerRef = useRef<HTMLElement | null>(null);

  const showStatus = useCallback((message: StatusMessage, durationMs = 4000) => {
    setStatusMessage(message);
    setTimeout(() => setStatusMessage(null), durationMs);
  }, []);

  // --- fetch subjects ---
  const fetchSubjectsList = useCallback(async () => {
    setIsLoadingSubjects(true);
    try {
      const res = await fetch("/api/admin/subjects");
      if (!res.ok) throw new Error(await parseErrorMessage(res, "Failed to load subjects"));
      const { subjects: apiSubjects } = await res.json();
      setSubjects(apiSubjects);
    } catch (err) {
      showStatus({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to load subjects.",
      });
    } finally {
      setIsLoadingSubjects(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchSubjectsList();
  }, [fetchSubjectsList]);

  // --- fetch questions, filtered server-side via query params ---
  // Debounced 300ms so typing in the search box doesn't fire a request per
  // keystroke - class/subject/type filters go straight through since
  // they're discrete select changes, not typed input.
  const fetchQuestionsList = useCallback(async () => {
    setIsLoadingQuestions(true);
    setQuestionsError(null);
    try {
      const params = new URLSearchParams();
      if (filterType !== "all") params.set("type", filterType);
      if (filterSubject !== "all") params.set("subject", filterSubject);
      if (filterClass !== "all") params.set("class", filterClass);
      if (searchTerm.trim()) params.set("search", searchTerm.trim());

      const res = await fetch(`/api/admin/questions?${params.toString()}`);
      if (!res.ok) throw new Error(await parseErrorMessage(res, "Failed to load questions"));
      const { questions: apiQuestions } = await res.json();
      setQuestions(apiQuestions);
    } catch (err) {
      setQuestionsError(err instanceof Error ? err.message : "Failed to load questions.");
    } finally {
      setIsLoadingQuestions(false);
    }
  }, [filterType, filterSubject, filterClass, searchTerm]);

  useEffect(() => {
    const timer = setTimeout(fetchQuestionsList, 300);
    return () => clearTimeout(timer);
  }, [fetchQuestionsList]);

  // --- question form handlers ---
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: name === "marks" ? Number(value) : value,
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
    formTriggerRef.current = e.currentTarget;
    setIsEditing(false);
    setSelectedQuestion(null);
    setFormError(null);
    setFormData(emptyFormData);
    setIsModalOpen(true);
  }, []);

  const handleEditQuestion = useCallback(
    (question: Question, e: React.MouseEvent<HTMLButtonElement>) => {
      formTriggerRef.current = e.currentTarget;
      setIsEditing(true);
      setSelectedQuestion(question);
      setFormError(null);
      setFormData({
        text: question.text,
        type: question.type,
        options: question.options?.length ? question.options : ["", "", "", ""],
        correctAnswer: question.correctAnswer || "",
        marks: question.marks,
        subject: typeof question.subject === "string" ? question.subject : question.subject._id,
        class: question.class,
      });
      setIsModalOpen(true);
    },
    [],
  );

  const closeFormModal = useCallback(() => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setFormError(null);
  }, [isSubmitting]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setFormError(null);

      if (!formData.text?.trim()) return setFormError("Please enter the question text.");
      if (!formData.subject) return setFormError("Please select a subject.");
      if (!formData.class) return setFormError("Please select a class.");
      if (formData.type === "Objective") {
        const filledOptions = (formData.options || []).filter((opt) => opt.trim());
        if (filledOptions.length < 2) {
          return setFormError("Please provide at least 2 options for objective questions.");
        }
        if (!formData.correctAnswer?.trim()) {
          return setFormError("Please provide the correct answer for objective questions.");
        }
        if (!filledOptions.includes(formData.correctAnswer.trim())) {
          return setFormError("The correct answer must match one of the options exactly.");
        }
      }

      setIsSubmitting(true);
      try {
        const payload =
          formData.type === "Objective"
            ? { ...formData, options: formData.options?.filter((opt) => opt.trim()) }
            : { ...formData, options: undefined, correctAnswer: undefined };

        const url =
          isEditing && selectedQuestion
            ? `/api/admin/questions/${selectedQuestion._id}`
            : "/api/admin/questions";
        const res = await fetch(url, {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(await parseErrorMessage(res, "Failed to save question"));

        showStatus({
          type: "success",
          text: isEditing
            ? "Question updated successfully."
            : "Question added to bank successfully.",
        });
        setIsModalOpen(false);
        fetchQuestionsList();
      } catch (err) {
        setFormError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, isEditing, selectedQuestion, showStatus, fetchQuestionsList],
  );

  // --- delete confirmation flow (replaces window.confirm) ---
  const handleDeleteQuestion = useCallback(
    (question: Question, e: React.MouseEvent<HTMLButtonElement>) => {
      deleteTriggerRef.current = e.currentTarget;
      setPendingDelete(question);
      setDeleteError(null);
      setDeleteBlockedExams(null);
    },
    [],
  );

  const closeDeleteModal = useCallback(() => {
    if (isDeleting) return;
    setPendingDelete(null);
    setDeleteError(null);
    setDeleteBlockedExams(null);
  }, [isDeleting]);

  const runDelete = useCallback(
    async (force: boolean) => {
      if (!pendingDelete) return;
      setIsDeleting(true);
      setDeleteError(null);
      try {
        const res = await fetch(
          `/api/admin/questions/${pendingDelete._id}${force ? "?force=true" : ""}`,
          { method: "DELETE" },
        );
        if (!res.ok) {
          const error = await parseErrorPayload(res, "Failed to delete question");
          if (res.status === 409 && error.exams) {
            setDeleteBlockedExams(error.exams);
            return;
          }
          throw error;
        }
        showStatus({ type: "warning", text: "Question deleted successfully." });
        setPendingDelete(null);
        setDeleteBlockedExams(null);
        fetchQuestionsList();
      } catch (err) {
        setDeleteError(err instanceof Error ? err.message : "Failed to delete question.");
      } finally {
        setIsDeleting(false);
      }
    },
    [pendingDelete, showStatus, fetchQuestionsList],
  );

  const confirmDelete = useCallback(() => runDelete(false), [runDelete]);
  const forceConfirmDelete = useCallback(() => runDelete(true), [runDelete]);

  // --- bulk import ---
  const handleOpenImportModal = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    importTriggerRef.current = e.currentTarget;
    setIsImportModalOpen(true);
    setSelectedFile(null);
    setPreviewRowCount(null);
    setImportSubject("");
    setImportClass("");
    setImportError(null);
    setImportRowErrors(null);
  }, []);

  const closeImportModal = useCallback(() => {
    if (isImporting) return;
    setIsImportModalOpen(false);
    setSelectedFile(null);
    setPreviewRowCount(null);
    setImportError(null);
    setImportRowErrors(null);
  }, [isImporting]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setImportError(null);
    setImportRowErrors(null);

    // Client-side row count is just a courtesy preview - the server does
    // the real CSV parsing and validation in questions/bulk/route.ts.
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = (event.target?.result as string) || "";
      const dataRows = content.split("\n").filter((line) => line.trim()).length - 1;
      setPreviewRowCount(Math.max(dataRows, 0));
    };
    reader.readAsText(file);
  }, []);

  const confirmImport = useCallback(async () => {
    if (!selectedFile || !importSubject || !importClass) return;
    setIsImporting(true);
    setImportError(null);
    setImportRowErrors(null);
    try {
      const body = new FormData();
      body.append("file", selectedFile);
      body.append("subject", importSubject);
      body.append("class", importClass);

      const res = await fetch("/api/admin/questions/bulk", { method: "POST", body });
      if (!res.ok) {
        const error = await parseErrorPayload(res, "Failed to import questions");
        if (error.rowErrors?.length) {
          setImportRowErrors(error.rowErrors);
          return;
        }
        throw error;
      }
      const { imported } = await res.json();
      showStatus({ type: "success", text: `Successfully imported ${imported} questions.` });
      setIsImportModalOpen(false);
      setSelectedFile(null);
      setPreviewRowCount(null);
      fetchQuestionsList();
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Failed to import questions.");
    } finally {
      setIsImporting(false);
    }
  }, [selectedFile, importSubject, importClass, showStatus, fetchQuestionsList]);

  const downloadTemplate = useCallback(() => {
    const headers = [
      "text",
      "type",
      "marks",
      "optionA",
      "optionB",
      "optionC",
      "optionD",
      "correctAnswer",
    ];
    const objectiveRow = [
      "What is the chemical symbol for water?",
      "Objective",
      "5",
      "H2O",
      "CO2",
      "NaCl",
      "HCl",
      "H2O",
    ];
    const theoryRow = [
      "Define an acid and give two examples with their chemical formulas.",
      "Theory",
      "10",
      "",
      "",
      "",
      "",
      "",
    ];
    const csvContent = [headers.join(","), objectiveRow.join(","), theoryRow.join(",")].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "question_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showStatus({ type: "success", text: "Template downloaded successfully." }, 3000);
  }, [showStatus]);

  // --- subject creation ---
  const handleOpenSubjectModal = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    subjectTriggerRef.current = e.currentTarget;
    setSubjectName("");
    setSubjectCode("");
    setSubjectFormError(null);
    setIsSubjectModalOpen(true);
  }, []);

  const closeSubjectModal = useCallback(() => {
    if (isSubmittingSubject) return;
    setIsSubjectModalOpen(false);
    setSubjectFormError(null);
  }, [isSubmittingSubject]);

  const handleSubjectSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSubjectFormError(null);

      if (!subjectName.trim() || !subjectCode.trim()) {
        setSubjectFormError("Please enter both a subject name and a code.");
        return;
      }

      setIsSubmittingSubject(true);
      try {
        const res = await fetch("/api/admin/subjects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: subjectName.trim(), code: subjectCode.trim() }),
        });
        if (!res.ok) throw new Error(await parseErrorMessage(res, "Failed to add subject"));
        const { subject: newSubject } = await res.json();

        setSubjects((prev) => [...prev, newSubject].sort((a, b) => a.name.localeCompare(b.name)));
        showStatus({ type: "success", text: `Subject "${newSubject.name}" added.` });
        setIsSubjectModalOpen(false);
      } catch (err) {
        setSubjectFormError(err instanceof Error ? err.message : "Failed to add subject.");
      } finally {
        setIsSubmittingSubject(false);
      }
    },
    [subjectName, subjectCode, showStatus],
  );

  const filteredCount = useMemo(() => questions.length, [questions]);

  return {
    // data
    questions,
    isLoadingQuestions,
    questionsError,
    subjects,
    isLoadingSubjects,
    filteredCount,

    // filters
    searchTerm,
    filterSubject,
    filterType,
    filterClass,
    setSearchTerm,
    setFilterSubject,
    setFilterType,
    setFilterClass,

    statusMessage,

    // question form modal
    isModalOpen,
    isEditing,
    formData,
    formError,
    isSubmitting,
    formTriggerRef,
    handleInputChange,
    handleOptionChange,
    handleAddQuestion,
    handleEditQuestion,
    handleSubmit,
    closeFormModal,

    // delete confirm modal
    pendingDelete,
    isDeleting,
    deleteError,
    deleteBlockedExams,
    deleteTriggerRef,
    handleDeleteQuestion,
    closeDeleteModal,
    confirmDelete,
    forceConfirmDelete,

    // bulk import modal
    isImportModalOpen,
    isImporting,
    selectedFileName: selectedFile?.name || null,
    previewRowCount,
    importSubject,
    importClass,
    importError,
    importRowErrors,
    importTriggerRef,
    setImportSubject,
    setImportClass,
    handleOpenImportModal,
    closeImportModal,
    handleFileUpload,
    confirmImport,
    downloadTemplate,

    // subject modal
    isSubjectModalOpen,
    subjectName,
    subjectCode,
    subjectFormError,
    isSubmittingSubject,
    subjectTriggerRef,
    setSubjectName,
    setSubjectCode,
    handleOpenSubjectModal,
    closeSubjectModal,
    handleSubjectSubmit,
  };
};
