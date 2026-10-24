import { create } from "zustand";
import { normalizeGroupName, validateGroupName } from "@/lib/question-group-rules";
import type { QuestionGroupSummary } from "@/types/question";

export interface TeacherQuestion {
  id: string;
  text: string;
  type: "Objective" | "Theory";
  subject: { id: string; name: string; code: string };
  class: string;
  marks: number;
  options?: string[];
  correctAnswer?: string;
  group?: string;
  // Who added it. Teachers can only delete questions they added themselves.
  createdBy?: string;
  createdByModel?: "Admin" | "Staff";
}

interface StatusMessage {
  type: "success" | "error";
  text: string;
}

export interface QuestionFormData {
  text: string;
  type: "Objective" | "Theory";
  subject: string;
  class: string;
  marks: string;
  options: string[];
  correctAnswer: string;
  // "" = leave ungrouped
  group: string;
}

// The group used for the last question this teacher added in this session,
// offered as the starting choice for the next one.
let lastUsedGroup = "";

const emptyForm: QuestionFormData = {
  text: "",
  type: "Objective",
  subject: "",
  class: "",
  marks: "1",
  options: ["", ""],
  correctAnswer: "",
  group: "",
};

async function parseErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    return body.error ?? fallback;
  } catch {
    return fallback;
  }
}

function fromApiQuestion(q: any): TeacherQuestion {
  return {
    id: q._id ?? q.id,
    text: q.text,
    type: q.type,
    subject: { id: q.subject?._id ?? q.subject?.id ?? q.subject, name: q.subject?.name ?? "", code: q.subject?.code ?? "" },
    class: q.class,
    marks: q.marks,
    options: q.options,
    correctAnswer: q.correctAnswer,
    group: q.group ?? undefined,
    createdBy: q.createdBy ? String(q.createdBy?._id ?? q.createdBy) : undefined,
    createdByModel: q.createdByModel,
  };
}

interface TeacherQuestionsState {
  questions: TeacherQuestion[];
  isLoading: boolean;
  error: string | null;
  statusMessage: StatusMessage | null;

  filterSubject: string;
  filterClass: string;
  filterType: string;
  // "all", "__ungrouped__" (no group yet) or a group name
  filterGroup: string;
  searchTerm: string;

  // question groups available to this teacher (within their assignment)
  groups: QuestionGroupSummary[];
  ungroupedCount: number;
  isLoadingGroups: boolean;
  fetchGroups: () => Promise<void>;

  isMoveModalOpen: boolean;
  isMoving: boolean;
  moveError: string | null;
  openMoveModal: () => void;
  closeMoveModal: () => void;
  confirmMove: (group: string) => Promise<void>;

  // bulk selection / bulk delete (own questions only)
  selectedIds: Set<string>;
  toggleSelect: (id: string) => void;
  toggleSelectAll: (selectableIds: string[]) => void;
  clearSelection: () => void;
  isBulkDeleteModalOpen: boolean;
  isBulkDeleting: boolean;
  bulkDeleteError: string | null;
  bulkDeleteBlocked: { questionId: string; exams: { id: string; title: string }[] }[] | null;
  requestBulkDelete: () => void;
  closeBulkDeleteModal: () => void;
  runBulkDelete: (force: boolean) => Promise<void>;

  isModalOpen: boolean;
  isEditing: boolean;
  selectedQuestion: TeacherQuestion | null;
  formData: QuestionFormData;
  formError: string | null;
  isSubmitting: boolean;

  isImportModalOpen: boolean;
  importSubject: string;
  importClass: string;
  importGroup: string;
  importGroupError: string | null;
  isImporting: boolean;
  importError: string | null;
  importRowErrors: { row: number; error: string }[];
  selectedFile: File | null;

  fetchQuestions: () => Promise<void>;
  setFilterSubject: (v: string) => void;
  setFilterClass: (v: string) => void;
  setFilterType: (v: string) => void;
  setFilterGroup: (v: string) => void;
  setSearchTerm: (v: string) => void;

  openAddModal: () => void;
  openEditModal: (q: TeacherQuestion) => void;
  closeFormModal: () => void;
  updateFormField: (field: keyof QuestionFormData, value: string) => void;
  updateOption: (index: number, value: string) => void;
  addOption: () => void;
  removeOption: (index: number) => void;
  submitForm: (e: React.FormEvent) => Promise<void>;
  deleteQuestion: (id: string) => Promise<void>;

  openImportModal: () => void;
  closeImportModal: () => void;
  setImportSubject: (v: string) => void;
  setImportClass: (v: string) => void;
  setImportGroup: (v: string) => void;
  setSelectedFile: (f: File | null) => void;
  confirmImport: () => Promise<void>;
}

export const useTeacherQuestionsStore = create<TeacherQuestionsState>((set, get) => ({
  questions: [],
  isLoading: true,
  error: null,
  statusMessage: null,

  filterSubject: "all",
  filterClass: "all",
  filterType: "all",
  filterGroup: "all",
  searchTerm: "",

  groups: [],
  ungroupedCount: 0,
  isLoadingGroups: true,

  isMoveModalOpen: false,
  isMoving: false,
  moveError: null,

  selectedIds: new Set<string>(),
  isBulkDeleteModalOpen: false,
  isBulkDeleting: false,
  bulkDeleteError: null,
  bulkDeleteBlocked: null,

  isModalOpen: false,
  isEditing: false,
  selectedQuestion: null,
  formData: emptyForm,
  formError: null,
  isSubmitting: false,

  isImportModalOpen: false,
  importSubject: "",
  importClass: "",
  importGroup: "",
  importGroupError: null,
  isImporting: false,
  importError: null,
  importRowErrors: [],
  selectedFile: null,

  fetchGroups: async () => {
    set({ isLoadingGroups: true });
    try {
      const res = await fetch("/api/staff/questions/groups");
      if (!res.ok) throw new Error("Failed to load groups");
      const data = await res.json();
      set({ groups: data.groups ?? [], ungroupedCount: data.ungroupedCount ?? 0 });
    } catch {
      // The group lists are a convenience; the screen still works without them.
    } finally {
      set({ isLoadingGroups: false });
    }
  },

  fetchQuestions: async () => {
    set({ isLoading: true, error: null });
    try {
      const { filterSubject, filterClass, filterType, filterGroup, searchTerm } = get();
      const params = new URLSearchParams();
      if (filterSubject !== "all") params.set("subject", filterSubject);
      if (filterClass !== "all") params.set("class", filterClass);
      if (filterType !== "all") params.set("type", filterType);
      if (filterGroup !== "all") params.set("group", filterGroup);
      if (searchTerm.trim()) params.set("search", searchTerm.trim());

      const res = await fetch(`/api/staff/questions?${params.toString()}`);
      if (!res.ok) throw new Error(await parseErrorMessage(res, "Failed to load questions"));
      const { questions } = await res.json();
      const mapped: TeacherQuestion[] = questions.map(fromApiQuestion);
      // Selection only ever covers what is on screen, so a changed filter or
      // search can't leave hidden questions ticked.
      const visible = new Set(mapped.map((q) => q.id));
      const kept = new Set([...get().selectedIds].filter((id) => visible.has(id)));
      set({ questions: mapped, selectedIds: kept });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to load questions." });
    } finally {
      set({ isLoading: false });
    }
  },

  setFilterSubject: (v) => {
    set({ filterSubject: v });
    get().fetchQuestions();
  },
  setFilterClass: (v) => {
    set({ filterClass: v });
    get().fetchQuestions();
  },
  setFilterType: (v) => {
    set({ filterType: v });
    get().fetchQuestions();
  },
  setFilterGroup: (v) => {
    set({ filterGroup: v });
    get().fetchQuestions();
  },
  setSearchTerm: (v) => set({ searchTerm: v }),

  openAddModal: () =>
    set({
      isModalOpen: true,
      isEditing: false,
      selectedQuestion: null,
      formError: null,
      formData: { ...emptyForm, group: lastUsedGroup },
    }),

  openEditModal: (q) =>
    set({
      isModalOpen: true,
      isEditing: true,
      selectedQuestion: q,
      formError: null,
      formData: {
        text: q.text,
        type: q.type,
        subject: q.subject.id,
        class: q.class,
        marks: String(q.marks),
        options: q.options && q.options.length > 0 ? q.options : ["", ""],
        correctAnswer: q.correctAnswer ?? "",
        group: q.group ?? "",
      },
    }),

  closeFormModal: () => {
    if (!get().isSubmitting) set({ isModalOpen: false, formError: null });
  },

  updateFormField: (field, value) =>
    set((state) => ({ formData: { ...state.formData, [field]: value } })),

  updateOption: (index, value) =>
    set((state) => {
      const options = [...state.formData.options];
      options[index] = value;
      return { formData: { ...state.formData, options } };
    }),

  addOption: () =>
    set((state) => ({ formData: { ...state.formData, options: [...state.formData.options, ""] } })),

  removeOption: (index) =>
    set((state) => ({
      formData: {
        ...state.formData,
        options: state.formData.options.filter((_, i) => i !== index),
      },
    })),

  submitForm: async (e) => {
    e.preventDefault();
    const { formData, isEditing, selectedQuestion } = get();

    if (!formData.text.trim()) {
      set({ formError: "Question text is required." });
      return;
    }
    if (!isEditing && (!formData.subject || !formData.class)) {
      set({ formError: "Select a subject and class." });
      return;
    }
    const groupName = normalizeGroupName(formData.group);
    if (groupName) {
      const groupProblem = validateGroupName(groupName);
      if (groupProblem) {
        set({ formError: groupProblem });
        return;
      }
    }
    const marks = Number(formData.marks);
    if (!formData.marks || Number.isNaN(marks) || marks < 1) {
      set({ formError: "Marks must be a number of at least 1." });
      return;
    }
    if (formData.type === "Objective") {
      const filled = formData.options.map((o) => o.trim()).filter(Boolean);
      if (filled.length < 2) {
        set({ formError: "Objective questions need at least 2 options." });
        return;
      }
      if (!formData.correctAnswer.trim()) {
        set({ formError: "Select the correct answer." });
        return;
      }
    }

    set({ isSubmitting: true, formError: null });

    const payload: Record<string, unknown> = {
      text: formData.text,
      type: formData.type,
      marks,
      // "" on an edit moves the question back to "Ungrouped"
      group: groupName,
    };
    if (formData.type === "Objective") {
      payload.options = formData.options.map((o) => o.trim()).filter(Boolean);
      payload.correctAnswer = formData.correctAnswer;
    }

    try {
      if (isEditing && selectedQuestion) {
        const res = await fetch(`/api/staff/questions/${selectedQuestion.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(await parseErrorMessage(res, "Failed to update question"));
        const { question } = await res.json();
        set((state) => ({
          questions: state.questions.map((q) =>
            q.id === selectedQuestion.id ? fromApiQuestion(question) : q,
          ),
          statusMessage: { type: "success", text: "Question updated." },
        }));
        get().fetchGroups();
      } else {
        payload.subject = formData.subject;
        payload.class = formData.class;
        const res = await fetch("/api/staff/questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(await parseErrorMessage(res, "Failed to add question"));
        lastUsedGroup = groupName;
        await get().fetchQuestions();
        get().fetchGroups();
        set({
          statusMessage: {
            type: "success",
            text: groupName ? `Question added in the group “${groupName}”.` : "Question added.",
          },
        });
      }
      set({ isSubmitting: false, isModalOpen: false });
    } catch (err) {
      set({
        isSubmitting: false,
        formError: err instanceof Error ? err.message : "Something went wrong.",
      });
    }
  },

  deleteQuestion: async (id) => {
    try {
      const res = await fetch(`/api/staff/questions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await parseErrorMessage(res, "Failed to delete question"));
      set((state) => ({
        questions: state.questions.filter((q) => q.id !== id),
        selectedIds: new Set([...state.selectedIds].filter((x) => x !== id)),
        statusMessage: { type: "success", text: "Question deleted." },
      }));
      get().fetchGroups();
    } catch (err) {
      set({
        statusMessage: {
          type: "error",
          text: err instanceof Error ? err.message : "Failed to delete question.",
        },
      });
    }
  },

  toggleSelect: (id) =>
    set((state) => {
      const next = new Set(state.selectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { selectedIds: next };
    }),

  // Ticks every question the teacher can delete in the current list, or
  // clears them all if they were already all ticked.
  toggleSelectAll: (selectableIds) =>
    set((state) => {
      const allSelected =
        selectableIds.length > 0 && selectableIds.every((id) => state.selectedIds.has(id));
      return { selectedIds: allSelected ? new Set<string>() : new Set(selectableIds) };
    }),

  clearSelection: () => set({ selectedIds: new Set<string>() }),

  requestBulkDelete: () => {
    if (get().selectedIds.size === 0) return;
    set({ isBulkDeleteModalOpen: true, bulkDeleteError: null, bulkDeleteBlocked: null });
  },

  closeBulkDeleteModal: () => {
    if (get().isBulkDeleting) return;
    set({ isBulkDeleteModalOpen: false, bulkDeleteError: null, bulkDeleteBlocked: null });
  },

  // First call is a plain delete. If some questions are attached to exams the
  // server answers 409 with the list, the modal shows it, and a second call
  // with force detaches them from those exams and deletes.
  runBulkDelete: async (force) => {
    const { selectedIds } = get();
    if (selectedIds.size === 0) return;
    set({ isBulkDeleting: true, bulkDeleteError: null });
    try {
      const res = await fetch("/api/staff/questions/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds), force }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 409 && data.blocked) {
          set({ bulkDeleteBlocked: data.blocked });
          return;
        }
        throw new Error(data.error ?? "Failed to delete questions");
      }
      const deleted: number = data.deletedCount ?? 0;
      const skipped: number = data.skipped ?? 0;
      set({
        isBulkDeleteModalOpen: false,
        bulkDeleteBlocked: null,
        selectedIds: new Set<string>(),
        statusMessage: {
          type: "success",
          text:
            `Deleted ${deleted} question${deleted !== 1 ? "s" : ""}.` +
            (skipped > 0
              ? ` ${skipped} selected question${skipped !== 1 ? "s were" : " was"} not yours to delete, so ${skipped !== 1 ? "they were" : "it was"} left as ${skipped !== 1 ? "they are" : "it is"}.`
              : ""),
        },
      });
      await get().fetchQuestions();
      get().fetchGroups();
    } catch (err) {
      set({
        bulkDeleteError: err instanceof Error ? err.message : "Failed to delete questions.",
      });
    } finally {
      set({ isBulkDeleting: false });
    }
  },

  openImportModal: () =>
    set({
      isImportModalOpen: true,
      importSubject: "",
      importClass: "",
      // Never pre-filled: a bulk upload is filed under the group chosen here,
      // so it has to be a deliberate choice each time.
      importGroup: "",
      importGroupError: null,
      importError: null,
      importRowErrors: [],
      selectedFile: null,
    }),
  closeImportModal: () => {
    if (!get().isImporting) set({ isImportModalOpen: false });
  },
  setImportSubject: (v) => set({ importSubject: v }),
  setImportClass: (v) => set({ importClass: v }),
  setImportGroup: (v) => set({ importGroup: v, importGroupError: null }),
  setSelectedFile: (f) => set({ selectedFile: f }),

  confirmImport: async () => {
    const { importSubject, importClass, importGroup, selectedFile } = get();
    // Every bulk upload must say which group its questions belong to.
    const groupName = normalizeGroupName(importGroup);
    const groupProblem = validateGroupName(groupName);
    if (groupProblem) {
      set({
        importGroupError: groupProblem,
        importError: "Please choose or create a question group before importing.",
      });
      return;
    }
    if (!importSubject || !importClass) {
      set({ importError: "Select a subject and class first." });
      return;
    }
    if (!selectedFile) {
      set({ importError: "Choose a CSV file to import." });
      return;
    }

    set({ isImporting: true, importError: null, importGroupError: null, importRowErrors: [] });

    const body = new FormData();
    body.append("file", selectedFile);
    body.append("subject", importSubject);
    body.append("class", importClass);
    body.append("group", groupName);

    try {
      const res = await fetch("/api/staff/questions/bulk", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        set({
          importError: data.error ?? "Failed to import questions",
          importRowErrors: data.rowErrors ?? [],
        });
        return;
      }
      await get().fetchQuestions();
      get().fetchGroups();
      set({
        statusMessage: {
          type: "success",
          text: `Imported ${data.imported} question(s) into the group “${data.group ?? groupName}”.`,
        },
        isImportModalOpen: false,
      });
    } catch {
      set({ importError: "Network error while importing." });
    } finally {
      set({ isImporting: false });
    }
  },
  openMoveModal: () => set({ isMoveModalOpen: true, moveError: null }),
  closeMoveModal: () => {
    if (!get().isMoving) set({ isMoveModalOpen: false, moveError: null });
  },
  // Moves the teacher's OWN questions matching the filters currently applied
  // to the list. (The server skips other teachers' questions and says how many.)
  confirmMove: async (group) => {
    const { filterSubject, filterClass, filterType, filterGroup, searchTerm } = get();
    set({ isMoving: true, moveError: null });
    try {
      const res = await fetch("/api/staff/questions/bulk-group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          group,
          filter: {
            subject: filterSubject !== "all" ? filterSubject : "",
            class: filterClass !== "all" ? filterClass : "",
            type: filterType !== "all" ? filterType : "",
            group: filterGroup !== "all" ? filterGroup : "",
            search: searchTerm.trim(),
          },
        }),
      });
      if (!res.ok) throw new Error(await parseErrorMessage(res, "Failed to move questions"));
      const data = await res.json();
      const skipped: number = data.skipped ?? 0;
      lastUsedGroup = data.group ?? group;
      set({
        isMoveModalOpen: false,
        statusMessage: {
          type: "success",
          text:
            `Moved ${data.updated} of your question${data.updated !== 1 ? "s" : ""} to the group “${data.group ?? group}”.` +
            (skipped > 0
              ? ` ${skipped} other question${skipped !== 1 ? "s" : ""} in the list were added by someone else, so they were left as they are.`
              : ""),
        },
      });
      await get().fetchQuestions();
      get().fetchGroups();
    } catch (err) {
      set({ moveError: err instanceof Error ? err.message : "Failed to move questions." });
    } finally {
      set({ isMoving: false });
    }
  },
}));
