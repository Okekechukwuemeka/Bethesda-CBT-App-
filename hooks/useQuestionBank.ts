"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import type { BlockingExam, Question, QuestionInput, RowError, Subject } from "@/types/question";
import type { PassageKind } from "@/lib/models/constants";
import type { PaginationInfo } from "@/lib/pagination";
<<<<<<< HEAD
import { normalizeGroupName, validateGroupName } from "@/lib/question-group-rules";
import { useQuestionGroups } from "./useQuestionGroups";
=======
>>>>>>> dec5f6225600b421121f5d76dd0fbeba598d6227
import { usePassages } from "./usePassages";

const PAGE_SIZE = 20;

interface StatusMessage {
  type: "success" | "error" | "warning";
  text: string;
}

// Transient fields for the "create a new passage inline" path in the
// question form - NOT part of QuestionInput, since they only exist
// while formData.passageId === "__new__" and get resolved into a real
// passageId before the question payload is ever built.
interface NewPassageData {
  title: string;
  text: string;
  kind: PassageKind;
}

const emptyNewPassageData: NewPassageData = { title: "", text: "", kind: "comprehension" };

interface ApiErrorPayload {
  error?: string;
  rowErrors?: RowError[];
  exams?: BlockingExam[];
}

const emptyFormData: QuestionInput = {
  text: "",
  type: "Objective",
  options: ["", ""],
  correctAnswer: "",
  marks: 1,
  subject: "",
  class: "",
  passageId: "",
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
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    pageSize: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);

  // --- filters (sent to the server as query params) ---
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterClass, setFilterClass] = useState<string>("all");
  // Question group: "all", "__ungrouped__" (no group), or a group name.
  const [filterGroup, setFilterGroup] = useState<string>("all");

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
  const [importGroup, setImportGroup] = useState("");
  const [importGroupError, setImportGroupError] = useState<string | null>(null);
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

  // The question groups in the bank (for the filter, the form picker and the
  // import dialog), with counts. refresh() after anything that changes them.
  const groupsApi = useQuestionGroups({ scope: "admin" });
  // The group used for the last question added this session, offered as the
  // starting choice for the next one so adding several in a row is quick.
  const lastGroupRef = useRef("");

  // Composed here (not called as a sibling hook from the page) so its
  // status messages (passage created/updated/deleted) share this hook's
  // showStatus/statusMessage - one message region on the page, not two.
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
      const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
      if (filterType !== "all") params.set("type", filterType);
      if (filterSubject !== "all") params.set("subject", filterSubject);
      if (filterClass !== "all") params.set("class", filterClass);
      if (filterGroup !== "all") params.set("group", filterGroup);
      if (searchTerm.trim()) params.set("search", searchTerm.trim());

      const res = await fetch(`/api/admin/questions?${params.toString()}`);
      if (!res.ok) throw new Error(await parseErrorMessage(res, "Failed to load questions"));
      const { questions: apiQuestions, pagination: apiPagination } = await res.json();
      setQuestions(apiQuestions);
      setPagination(apiPagination);
      // The server clamps an out-of-range page (e.g. the last question on the
      // last page was just deleted) - follow it rather than show an empty page.
      if (apiPagination.page !== page) setPage(apiPagination.page);
    } catch (err) {
      setQuestionsError(err instanceof Error ? err.message : "Failed to load questions.");
    } finally {
      setIsLoadingQuestions(false);
    }
<<<<<<< HEAD
  }, [filterType, filterSubject, filterClass, filterGroup, searchTerm, page]);
=======
  }, [filterType, filterSubject, filterClass, searchTerm, page]);
>>>>>>> dec5f6225600b421121f5d76dd0fbeba598d6227

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
        // If the option being removed was the selected correct answer,
        // clear it rather than silently keeping a stale value.
        correctAnswer: prev.correctAnswer === removed ? "" : prev.correctAnswer,
      };
    });
  }, []);

  const handleAddQuestion = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    formTriggerRef.current = e.currentTarget;
    setIsEditing(false);
    setSelectedQuestion(null);
    setFormError(null);
    setFormData({ ...emptyFormData, group: lastGroupRef.current });
    setNewPassageData(emptyNewPassageData);
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
        group: question.group ?? "",
        passageId: question.passageId
          ? typeof question.passageId === "string"
            ? question.passageId
            : question.passageId._id
          : "",
      });
      setNewPassageData(emptyNewPassageData);
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
      const groupName = normalizeGroupName(formData.group);
      if (groupName) {
        const groupProblem = validateGroupName(groupName);
        if (groupProblem) return setFormError(groupProblem);
      }
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

      if (formData.passageId === "__new__" && !newPassageData.text.trim()) {
        return setFormError("Please enter the new passage's text.");
      }

      setIsSubmitting(true);
      try {
        // Resolve the passage picker into a real passageId + passageOrder
        // before touching the question endpoint at all. Three cases:
        //  - "__new__": create the Passage first, then use its id, order 1.
        //  - an existing passage id: reuse the SAME order if this question
        //    was already in that exact passage (editing, unchanged), or
        //    auto-number it (questionCount + 1) if this is a new link.
        //  - "" (standalone): explicit null on edit, so it actually
        //    detaches rather than being silently ignored; omitted on
        //    create, since there's nothing to detach from yet.
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
          if (!passageRes.ok) {
            throw new Error(await parseErrorMessage(passageRes, "Failed to create the passage"));
          }
          const { passage: createdPassage } = await passageRes.json();
          resolvedPassageId = createdPassage._id;
          resolvedPassageOrder = 1;
        } else if (formData.passageId) {
          const originalPassageId =
            isEditing && selectedQuestion?.passageId
              ? typeof selectedQuestion.passageId === "string"
                ? selectedQuestion.passageId
                : selectedQuestion.passageId._id
              : undefined;

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

        const payload =
          formData.type === "Objective"
            ? {
                ...formData,
                options: formData.options?.filter((opt) => opt.trim()),
                passageId: resolvedPassageId,
                passageOrder: resolvedPassageOrder,
              }
            : {
                ...formData,
                options: undefined,
                correctAnswer: undefined,
                passageId: resolvedPassageId,
                passageOrder: resolvedPassageOrder,
              };

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
            : groupName
              ? `Question added to the bank in the group “${groupName}”.`
              : "Question added to bank successfully.",
        });
        if (!isEditing) lastGroupRef.current = groupName;
        setIsModalOpen(false);
        fetchQuestionsList();
        groupsApi.refresh();
        if (formData.passageId === "__new__" || formData.passageId) {
          passagesApi.fetchPassagesList();
        }
      } catch (err) {
        setFormError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      formData,
      newPassageData,
      isEditing,
      selectedQuestion,
      showStatus,
      fetchQuestionsList,
      passagesApi,
      groupsApi,
    ],
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
    // Deliberately NOT pre-filled from an earlier upload: a bulk upload is
    // filed under whatever group is chosen here, so it must be an explicit,
    // conscious choice every time (a wrong default is easy to miss by ear).
    setImportGroup("");
    setImportGroupError(null);
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

  const handleImportGroupChange = useCallback((value: string) => {
    setImportGroup(value);
    setImportGroupError(null);
  }, []);

  const confirmImport = useCallback(async () => {
    // Say exactly what is missing (rather than silently doing nothing) so a
    // screen-reader user knows what to fix. The group is mandatory for every
    // bulk upload to the bank.
    const groupName = normalizeGroupName(importGroup);
    const groupProblem = validateGroupName(groupName);
    if (groupProblem) {
      setImportGroupError(groupProblem);
      setImportError("Please choose or create a question group before importing.");
      return;
    }
    if (!importSubject || !importClass) {
      setImportError("Please choose the subject and the class for these questions.");
      return;
    }
    if (!selectedFile) {
      setImportError("Please choose a CSV file to import.");
      return;
    }
    setImportGroupError(null);
    setIsImporting(true);
    setImportError(null);
    setImportRowErrors(null);
    try {
      const body = new FormData();
      body.append("file", selectedFile);
      body.append("subject", importSubject);
      body.append("class", importClass);
      body.append("group", groupName);

      const res = await fetch("/api/admin/questions/bulk", { method: "POST", body });
      if (!res.ok) {
        const error = await parseErrorPayload(res, "Failed to import questions");
        if (error.rowErrors?.length) {
          setImportRowErrors(error.rowErrors);
          return;
        }
        throw error;
      }
      const { imported, group: savedGroup } = await res.json();
      showStatus(
        {
          type: "success",
          text: `Successfully imported ${imported} questions into the group “${savedGroup ?? groupName}”.`,
        },
        8000,
      );
      setIsImportModalOpen(false);
      setSelectedFile(null);
      setPreviewRowCount(null);
      fetchQuestionsList();
      groupsApi.refresh();
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Failed to import questions.");
    } finally {
      setIsImporting(false);
    }
  }, [selectedFile, importSubject, importClass, importGroup, showStatus, fetchQuestionsList, groupsApi]);
  // Wraps a field in quotes and escapes any internal quotes if it contains
  // a comma, quote, or newline - without this, a passage body like "Last
  // term, our class teacher..." would split into extra columns the moment
  // someone re-uploads this exact template, since a bare comma inside an
  // unquoted field is indistinguishable from a real column separator.
  const csvField = (value: string): string => {
    if (/[",\n]/.test(value)) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const downloadTemplate = useCallback(() => {
    const headers = [
      "text",
      "type",
      "marks",
      "option1",
      "option2",
      "option3",
      "option4",
      "passage_key",
      "passage_title",
      "passage_body",
      "passage_kind",
    ];

    // Standalone objective question - no passage columns needed at all.
    // For this row, option3 ("NaCl") is the last populated option,
    // meaning the API will automatically register "NaCl" as the correct answer.
    const objectiveRow3Options = [
      "What is the chemical formula for common table salt?",
      "Objective",
      "3",
      "H2O",
      "CO2",
      "NaCl",
      "", // Left empty
      "",
      "",
      "",
      "",
    ];

    // Standalone objective question. For this row, option4 ("HCl") is the
    // last populated option, so "HCl" becomes its correct answer.
    const objectiveRow4Options = [
      "Which of these is a strong acid?",
      "Objective",
      "5",
      "H2O",
      "CH3COOH",
      "NH3",
      "HCl", // Last populated column -> implicitly the correct answer!
      "",
      "",
      "",
      "",
    ];

    // Theory rows leave all option columns completely blank.
    const theoryRow = [
      "Define an acid and give two examples with their chemical formulas.",
      "Theory",
      "10",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ];

    // Passage-grouped example: two questions sharing passage_key "zoo1".
    // Only the FIRST row of the group carries passage_title/passage_body -
    // later rows in the same group just repeat the same passage_key and
    // leave title/body blank, exactly as the modal's instructions say.
    const passageRow1 = [
      "Who organized the trip to the zoo?",
      "Objective",
      "1",
      "The school principal",
      "The class teacher",
      "The bus driver",
      "The class teacher",
      "zoo1",
      "A Visit to the Zoo",
      "Last term, our class teacher, Mrs. Adebayo, organized a trip for us to the zoo in the city. We were all very excited because it was our first school trip of the year.",
      "comprehension",
    ];
    const passageRow2 = [
      "How did the students travel to the zoo?",
      "Objective",
      "1",
      "By train",
      "By car",
      "By school bus",
      "By school bus",
      "zoo1",
      "",
      "",
      "",
    ];

    const csvContent = [
      headers.map(csvField).join(","),
      objectiveRow3Options.map(csvField).join(","),
      objectiveRow4Options.map(csvField).join(","),
      theoryRow.map(csvField).join(","),
      passageRow1.map(csvField).join(","),
      passageRow2.map(csvField).join(","),
    ].join("\n");

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

  // Changing any filter or the search starts again from page 1 - the page the
  // admin was on may not even exist in the new, narrower result set.
  const changeFilter = useCallback(
    (setter: (value: string) => void) => (value: string) => {
      setter(value);
      setPage(1);
    },
    [],
  );
  const setSearchTermAndReset = useMemo(() => changeFilter(setSearchTerm), [changeFilter]);
  const setFilterSubjectAndReset = useMemo(() => changeFilter(setFilterSubject), [changeFilter]);
  const setFilterTypeAndReset = useMemo(() => changeFilter(setFilterType), [changeFilter]);
  const setFilterClassAndReset = useMemo(() => changeFilter(setFilterClass), [changeFilter]);
<<<<<<< HEAD
  const setFilterGroupAndReset = useMemo(() => changeFilter(setFilterGroup), [changeFilter]);
=======
>>>>>>> dec5f6225600b421121f5d76dd0fbeba598d6227

  // Total matches across ALL pages (what the "N questions found" announcement
  // should say), not just the rows on this page.
  const filteredCount = pagination.total;

  // --- bulk selection / bulk delete -----------------------------------
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Selection is keyed on the currently visible (filtered, current-page)
  // list, so changing filters/search/page doesn't leave stale ids selected
  // that the admin can no longer see - "Select all" and bulk delete always
  // act on exactly the rows on screen.
  useEffect(() => {
    const visibleIds = new Set(questions.map((q) => q._id));
    setSelectedIds((prev) => {
      const next = new Set<string>();
      prev.forEach((id) => {
        if (visibleIds.has(id)) next.add(id);
      });
      return next.size === prev.size ? prev : next;
    });
  }, [questions]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) =>
      prev.size === questions.length ? new Set() : new Set(questions.map((q) => q._id)),
    );
  }, [questions]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkDeleteError, setBulkDeleteError] = useState<string | null>(null);
  const [bulkDeleteBlocked, setBulkDeleteBlocked] = useState<
    { questionId: string; exams: BlockingExam[] }[] | null
  >(null);
  const bulkDeleteTriggerRef = useRef<HTMLElement | null>(null);

  const requestBulkDelete = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    bulkDeleteTriggerRef.current = e.currentTarget;
    setBulkDeleteError(null);
    setBulkDeleteBlocked(null);
    setIsBulkDeleteModalOpen(true);
  }, []);

  const closeBulkDeleteModal = useCallback(() => {
    if (isBulkDeleting) return;
    setIsBulkDeleteModalOpen(false);
    setBulkDeleteError(null);
    setBulkDeleteBlocked(null);
  }, [isBulkDeleting]);

  const runBulkDelete = useCallback(
    async (force: boolean) => {
      if (selectedIds.size === 0) return;
      setIsBulkDeleting(true);
      setBulkDeleteError(null);
      try {
        const res = await fetch("/api/admin/questions/bulk-delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: Array.from(selectedIds), force }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (res.status === 409 && data.blocked) {
            setBulkDeleteBlocked(data.blocked);
            return;
          }
          throw new Error(data.error ?? "Failed to delete questions");
        }
        showStatus({
          type: "warning",
          text: `Deleted ${data.deletedCount} question(s) successfully.`,
        });
        setIsBulkDeleteModalOpen(false);
        setBulkDeleteBlocked(null);
        clearSelection();
        fetchQuestionsList();
      } catch (err) {
        setBulkDeleteError(err instanceof Error ? err.message : "Failed to delete questions.");
      } finally {
        setIsBulkDeleting(false);
      }
    },
    [selectedIds, showStatus, clearSelection, fetchQuestionsList],
  );

  const confirmBulkDelete = useCallback(() => runBulkDelete(false), [runBulkDelete]);
  const forceConfirmBulkDelete = useCallback(() => runBulkDelete(true), [runBulkDelete]);

  // --- move questions into a group (also how older, ungrouped questions get organised) ---
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [moveError, setMoveError] = useState<string | null>(null);
  const moveTriggerRef = useRef<HTMLElement | null>(null);

  const openMoveModal = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    moveTriggerRef.current = e.currentTarget;
    setMoveError(null);
    setIsMoveModalOpen(true);
  }, []);

  const closeMoveModal = useCallback(() => {
    if (isMoving) return;
    setIsMoveModalOpen(false);
    setMoveError(null);
    // Put keyboard/screen-reader focus back on the button that opened the
    // dialog (the selection bar disappears once a move succeeds, so fall back
    // to the page heading).
    setTimeout(() => {
      const trigger = moveTriggerRef.current;
      if (trigger && document.contains(trigger)) trigger.focus();
      else document.getElementById("question-bank-heading")?.focus();
    }, 0);
  }, [isMoving]);

  const confirmMove = useCallback(
    async (group: string, scope: "selected" | "filtered") => {
      setIsMoving(true);
      setMoveError(null);
      try {
        const body =
          scope === "selected"
            ? { group, ids: Array.from(selectedIds) }
            : {
                group,
                filter: {
                  type: filterType !== "all" ? filterType : "",
                  subject: filterSubject !== "all" ? filterSubject : "",
                  class: filterClass !== "all" ? filterClass : "",
                  group: filterGroup !== "all" ? filterGroup : "",
                  search: searchTerm.trim(),
                },
              };
        const res = await fetch("/api/admin/questions/bulk-group", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(await parseErrorMessage(res, "Failed to move questions"));
        const { matched, group: savedGroup } = await res.json();

        setIsMoveModalOpen(false);
        clearSelection();
        showStatus(
          {
            type: "success",
            text: `Moved ${matched} question${matched !== 1 ? "s" : ""} to the group “${savedGroup ?? group}”.`,
          },
          8000,
        );
        fetchQuestionsList();
        groupsApi.refresh();
        setTimeout(() => {
          const trigger = moveTriggerRef.current;
          if (trigger && document.contains(trigger)) trigger.focus();
          else document.getElementById("question-bank-heading")?.focus();
        }, 0);
      } catch (err) {
        setMoveError(err instanceof Error ? err.message : "Failed to move questions.");
      } finally {
        setIsMoving(false);
      }
    },
    [
      selectedIds,
      filterType,
      filterSubject,
      filterClass,
      filterGroup,
      searchTerm,
      clearSelection,
      showStatus,
      fetchQuestionsList,
      groupsApi,
    ],
  );

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
    setSearchTerm: setSearchTermAndReset,
    setFilterSubject: setFilterSubjectAndReset,
    setFilterType: setFilterTypeAndReset,
    setFilterClass: setFilterClassAndReset,
<<<<<<< HEAD
    filterGroup,
    setFilterGroup: setFilterGroupAndReset,
    groups: groupsApi.groups,
    ungroupedCount: groupsApi.ungroupedCount,
    totalQuestionCount: groupsApi.total,
    isLoadingGroups: groupsApi.isLoading,
=======
>>>>>>> dec5f6225600b421121f5d76dd0fbeba598d6227

    // pagination
    pagination,
    pageSize: PAGE_SIZE,
    setPage,

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
    importGroup,
    importGroupError,
    handleImportGroupChange,
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
    handleAddOption,
    handleRemoveOption,

    // passage picker (inside the question form)
    passages: passagesApi.passages,
    isLoadingPassages: passagesApi.isLoadingPassages,
    newPassageData,
    handleNewPassageChange,

    // passage manager modal (standalone "Manage Passages" screen)
    isPassageManagerOpen: passagesApi.isManagerOpen,
    passageManagerView: passagesApi.managerView,
    passagesError: passagesApi.passagesError,
    passageManagerTriggerRef: passagesApi.managerTriggerRef,
    openPassageManager: passagesApi.openPassageManager,
    closePassageManager: passagesApi.closePassageManager,
    startCreatePassage: passagesApi.startCreatePassage,
    startEditPassage: passagesApi.startEditPassage,
    cancelPassageForm: passagesApi.cancelPassageForm,
    editingPassage: passagesApi.editingPassage,
    passageFormData: passagesApi.passageFormData,
    passageFormError: passagesApi.passageFormError,
    isSavingPassage: passagesApi.isSavingPassage,
    handlePassageFormChange: passagesApi.handlePassageFormChange,
    submitPassageForm: passagesApi.submitPassageForm,
    pendingDeletePassage: passagesApi.pendingDeletePassage,
    isDeletingPassage: passagesApi.isDeletingPassage,
    deletePassageError: passagesApi.deletePassageError,
    deleteBlockedByQuestions: passagesApi.deleteBlockedByQuestions,
    requestDeletePassage: passagesApi.requestDeletePassage,
    cancelDeletePassage: passagesApi.cancelDeletePassage,
    confirmDeletePassage: passagesApi.confirmDeletePassage,

    // move questions to a group
    isMoveModalOpen,
    isMoving,
    moveError,
    openMoveModal,
    closeMoveModal,
    confirmMove,

    // bulk selection / bulk delete
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    isBulkDeleteModalOpen,
    isBulkDeleting,
    bulkDeleteError,
    bulkDeleteBlocked,
    bulkDeleteTriggerRef,
    requestBulkDelete,
    closeBulkDeleteModal,
    confirmBulkDelete,
    forceConfirmBulkDelete,
  };
};
