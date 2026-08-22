"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { PopulatedPassage, QuestionInput, Subject } from "@/types/question";
import type { PassageKind } from "@/lib/models/constants";
import { ClassLevel } from "@/lib/models/constants";
import { usePassages } from "./usePassages";

export interface ExamQuestion {
  _id: string;
  text: string;
  type: "Objective" | "Theory";
  options?: string[];
  correctAnswer?: string;
  marks: number;
  subject: string | { _id: string; name: string };
  class: ClassLevel;
  passageId?: string | PopulatedPassage;
  passageOrder?: number;
}

export interface ExamSummary {
  title: string;
  subject: string | { _id: string; name: string };
  // Unset for a general exam (isGeneral: true), which has no single class.
  class?: string;
  classes?: string[];
  isGeneral?: boolean;
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
  passageId?: string | PopulatedPassage;
  passageOrder?: number;
}

interface StatusMessage {
  type: "success" | "error" | "warning";
  text: string;
}

interface NewPassageData {
  title: string;
  text: string;
  kind: PassageKind;
}

const emptyNewPassageData: NewPassageData = { title: "", text: "", kind: "comprehension" };

const emptyFormData: QuestionInput = {
  text: "",
  type: "Objective",
  options: ["", ""], // starts at the model's minimum, not a fixed 4
  correctAnswer: "",
  marks: 5,
  subject: "",
  class: "",
  passageId: "",
};

const passageIdOf = (value: string | PopulatedPassage | undefined): string | undefined => {
  if (!value) return undefined;
  return typeof value === "string" ? value : value._id;
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

  const showStatus = useCallback((message: StatusMessage, durationMs = 3000) => {
    setStatusMessage(message);
    setTimeout(() => setStatusMessage(null), durationMs);
  }, []);

  // Composed here so passage CRUD (from the passage picker's "create new"
  // path) shares this hook's showStatus/statusMessage - one status region
  // on the page, not two.
  const passagesApi = usePassages(showStatus);

  // --- inline "create a new passage" fields, used only when the question
  // form's passage picker is set to "__new__" ---
  const [newPassageData, setNewPassageData] = useState<NewPassageData>(emptyNewPassageData);
  const handleNewPassageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setNewPassageData((prev) => ({ ...prev, [name]: value }));
    },
    [],
  );

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
              classes: apiExam.classes,
              isGeneral: apiExam.isGeneral,
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

        // Passage-aware nudge: if this question belongs to a passage,
        // check how many of its siblings (same passageId, visible in the
        // current bank view) are attached yet. This is a soft heads-up,
        // not a blocking confirmation - attaching one at a time is a
        // deliberate action, but it's easy to not realize a comprehension
        // group has more parts than what's currently on screen.
        const pid = passageIdOf(question.passageId);
        if (pid) {
          const siblingIds = bankQuestions
            .filter((q) => passageIdOf(q.passageId) === pid)
            .map((q) => q._id);
          const stillMissing = siblingIds.filter(
            (id) => id !== question._id && !attachedIds.has(id),
          );
          if (stillMissing.length > 0) {
            const label =
              typeof question.passageId === "object" && question.passageId
                ? question.passageId.title || "this passage"
                : "this passage";
            showStatus({
              type: "warning",
              text: `Added. ${stillMissing.length} more question${
                stillMissing.length !== 1 ? "s" : ""
              } from "${label}" ${stillMissing.length !== 1 ? "are" : "is"} not attached to this exam yet.`,
            });
            return;
          }
        }

        showStatus({ type: "success", text: "Question added to exam." });
      } catch (err) {
        showStatus({
          type: "error",
          text: err instanceof Error ? err.message : "Failed to attach question.",
        });
      } finally {
        setIsAttaching(false);
      }
    },
    [examId, attachedIds, isAttaching, loadQuestions, bankQuestions, showStatus],
  );

  // --- bulk select in the bank (to attach many at once) ----------------
  const [selectedBankIds, setSelectedBankIds] = useState<Set<string>>(new Set());

  const toggleBankSelect = useCallback((id: string) => {
    setSelectedBankIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearBankSelection = useCallback(() => setSelectedBankIds(new Set()), []);

  const handleAttachSelected = useCallback(async () => {
    const idsToAttach = Array.from(selectedBankIds).filter((id) => !attachedIds.has(id));
    if (idsToAttach.length === 0) return;
    setIsAttaching(true);
    try {
      const res = await fetch(`/api/admin/exams/${examId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionIds: idsToAttach }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Failed to attach questions");

      await loadQuestions();
      clearBankSelection();
      showStatus({
        type: "success",
        text: `Added ${body.attached ?? idsToAttach.length} question${idsToAttach.length !== 1 ? "s" : ""} to exam.`,
      });
    } catch (err) {
      showStatus({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to attach questions.",
      });
    } finally {
      setIsAttaching(false);
    }
  }, [selectedBankIds, attachedIds, examId, loadQuestions, clearBankSelection, showStatus]);

  // --- bulk select among questions already attached to this exam (to
  // remove many at once - they stay in the bank, only detached here) ----
  const [selectedAttachedIds, setSelectedAttachedIds] = useState<Set<string>>(new Set());
  const [isBulkRemoveModalOpen, setIsBulkRemoveModalOpen] = useState(false);
  const [isBulkRemoving, setIsBulkRemoving] = useState(false);

  const toggleAttachedSelect = useCallback((id: string) => {
    setSelectedAttachedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAttachedSelectAll = useCallback(() => {
    setSelectedAttachedIds((prev) =>
      prev.size === questions.length ? new Set() : new Set(questions.map((q) => q._id)),
    );
  }, [questions]);

  const clearAttachedSelection = useCallback(() => setSelectedAttachedIds(new Set()), []);

  const requestBulkRemove = useCallback(() => {
    if (selectedAttachedIds.size === 0) return;
    setIsBulkRemoveModalOpen(true);
  }, [selectedAttachedIds]);

  const closeBulkRemoveModal = useCallback(() => {
    if (isBulkRemoving) return;
    setIsBulkRemoveModalOpen(false);
  }, [isBulkRemoving]);

  const confirmBulkRemove = useCallback(async () => {
    if (selectedAttachedIds.size === 0) return;
    setIsBulkRemoving(true);
    try {
      const res = await fetch(`/api/admin/exams/${examId}/questions/bulk-remove`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionIds: Array.from(selectedAttachedIds) }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Failed to remove questions");

      setQuestions((prev) => prev.filter((q) => !selectedAttachedIds.has(q._id)));
      showStatus({
        type: "warning",
        text: `Removed ${body.removed ?? selectedAttachedIds.size} question(s) from exam.`,
      });
      clearAttachedSelection();
      setIsBulkRemoveModalOpen(false);
    } catch (err) {
      showStatus({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to remove questions.",
      });
    } finally {
      setIsBulkRemoving(false);
    }
  }, [selectedAttachedIds, examId, showStatus, clearAttachedSelection]);

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
    setNewPassageData(emptyNewPassageData);
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
        passageId: passageIdOf(question.passageId) ?? "",
      });
      setNewPassageData(emptyNewPassageData);
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
      showStatus({ type: "warning", text: "Question removed from exam successfully." });
    } catch (err) {
      showStatus({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to remove question.",
      });
    } finally {
      setIsDeleting(false);
      setQuestionPendingDelete(null);
    }
  }, [examId, questionPendingDelete, showStatus]);

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
    if (formData.passageId === "__new__" && !newPassageData.text.trim()) {
      return "Please enter the new passage's text.";
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
        // Same three-case passage resolution as the question bank's form:
        // "__new__" creates the Passage first; an existing id either keeps
        // its current order (unchanged link) or gets auto-numbered
        // (questionCount + 1) as a new link; "" detaches explicitly (null)
        // when editing, or is simply omitted when creating.
        let resolvedPassageId: string | null | undefined;
        let resolvedPassageOrder: number | null | undefined;

        if (formData.passageId === "__new__") {
          const passageRes = await fetch("/api/admin/passages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: newPassageData.title.trim() || undefined,
              text: newPassageData.text,
              kind: newPassageData.kind,
              subject: formData.subject,
              class: formData.class,
            }),
          });
          const passageBody = await passageRes.json().catch(() => ({}));
          if (!passageRes.ok) throw new Error(passageBody.error ?? "Failed to create the passage");
          resolvedPassageId = passageBody.passage._id;
          resolvedPassageOrder = 1;
        } else if (formData.passageId) {
          const originalPassageId =
            isEditing && selectedQuestion ? passageIdOf(selectedQuestion.passageId) : undefined;
          resolvedPassageId = formData.passageId;
          if (formData.passageId === originalPassageId) {
            resolvedPassageOrder = selectedQuestion?.passageOrder;
          } else {
            const chosenPassage = passagesApi.passages.find((p) => p._id === formData.passageId);
            resolvedPassageOrder = (chosenPassage?.questionCount ?? 0) + 1;
          }
        } else {
          resolvedPassageId = isEditing ? null : undefined;
          resolvedPassageOrder = isEditing ? null : undefined;
        }

        const basePayload =
          formData.type === "Objective"
            ? { ...formData, options: formData.options?.filter((opt) => opt.trim()) }
            : { ...formData, options: undefined, correctAnswer: undefined };
        const payload = {
          ...basePayload,
          passageId: resolvedPassageId,
          passageOrder: resolvedPassageOrder,
        };

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
          showStatus({ type: "success", text: "Question updated successfully." });
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
          showStatus({ type: "success", text: "Question added to exam successfully." });
        }

        if (resolvedPassageId) {
          passagesApi.fetchPassagesList();
        }
        setIsModalOpen(false);
      } catch (err) {
        setFormError(err instanceof Error ? err.message : "Failed to save question.");
      } finally {
        setIsSubmitting(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      formData,
      newPassageData,
      isEditing,
      selectedQuestion,
      examId,
      loadQuestions,
      passagesApi,
      showStatus,
    ],
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

    // passage picker (inside the question form)
    passages: passagesApi.passages,
    isLoadingPassages: passagesApi.isLoadingPassages,
    newPassageData,
    handleNewPassageChange,

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

    // bulk attach from bank
    selectedBankIds,
    toggleBankSelect,
    clearBankSelection,
    handleAttachSelected,

    // bulk remove from this exam (stays in bank)
    selectedAttachedIds,
    toggleAttachedSelect,
    toggleAttachedSelectAll,
    clearAttachedSelection,
    isBulkRemoveModalOpen,
    isBulkRemoving,
    requestBulkRemove,
    closeBulkRemoveModal,
    confirmBulkRemove,
  };
};
