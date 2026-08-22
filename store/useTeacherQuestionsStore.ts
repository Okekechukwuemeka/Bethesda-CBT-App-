import { create } from "zustand";

export interface TeacherQuestion {
  id: string;
  text: string;
  type: "Objective" | "Theory";
  subject: { id: string; name: string; code: string };
  class: string;
  marks: number;
  options?: string[];
  correctAnswer?: string;
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
}

const emptyForm: QuestionFormData = {
  text: "",
  type: "Objective",
  subject: "",
  class: "",
  marks: "1",
  options: ["", ""],
  correctAnswer: "",
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
  searchTerm: string;

  isModalOpen: boolean;
  isEditing: boolean;
  selectedQuestion: TeacherQuestion | null;
  formData: QuestionFormData;
  formError: string | null;
  isSubmitting: boolean;

  isImportModalOpen: boolean;
  importSubject: string;
  importClass: string;
  isImporting: boolean;
  importError: string | null;
  importRowErrors: { row: number; error: string }[];
  selectedFile: File | null;

  fetchQuestions: () => Promise<void>;
  setFilterSubject: (v: string) => void;
  setFilterClass: (v: string) => void;
  setFilterType: (v: string) => void;
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
  searchTerm: "",

  isModalOpen: false,
  isEditing: false,
  selectedQuestion: null,
  formData: emptyForm,
  formError: null,
  isSubmitting: false,

  isImportModalOpen: false,
  importSubject: "",
  importClass: "",
  isImporting: false,
  importError: null,
  importRowErrors: [],
  selectedFile: null,

  fetchQuestions: async () => {
    set({ isLoading: true, error: null });
    try {
      const { filterSubject, filterClass, filterType, searchTerm } = get();
      const params = new URLSearchParams();
      if (filterSubject !== "all") params.set("subject", filterSubject);
      if (filterClass !== "all") params.set("class", filterClass);
      if (filterType !== "all") params.set("type", filterType);
      if (searchTerm.trim()) params.set("search", searchTerm.trim());

      const res = await fetch(`/api/staff/questions?${params.toString()}`);
      if (!res.ok) throw new Error(await parseErrorMessage(res, "Failed to load questions"));
      const { questions } = await res.json();
      set({ questions: questions.map(fromApiQuestion) });
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
  setSearchTerm: (v) => set({ searchTerm: v }),

  openAddModal: () =>
    set({ isModalOpen: true, isEditing: false, selectedQuestion: null, formError: null, formData: emptyForm }),

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
      } else {
        payload.subject = formData.subject;
        payload.class = formData.class;
        const res = await fetch("/api/staff/questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(await parseErrorMessage(res, "Failed to add question"));
        await get().fetchQuestions();
        set({ statusMessage: { type: "success", text: "Question added." } });
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
        statusMessage: { type: "success", text: "Question deleted." },
      }));
    } catch (err) {
      set({
        statusMessage: {
          type: "error",
          text: err instanceof Error ? err.message : "Failed to delete question.",
        },
      });
    }
  },

  openImportModal: () =>
    set({
      isImportModalOpen: true,
      importSubject: "",
      importClass: "",
      importError: null,
      importRowErrors: [],
      selectedFile: null,
    }),
  closeImportModal: () => {
    if (!get().isImporting) set({ isImportModalOpen: false });
  },
  setImportSubject: (v) => set({ importSubject: v }),
  setImportClass: (v) => set({ importClass: v }),
  setSelectedFile: (f) => set({ selectedFile: f }),

  confirmImport: async () => {
    const { importSubject, importClass, selectedFile } = get();
    if (!importSubject || !importClass) {
      set({ importError: "Select a subject and class first." });
      return;
    }
    if (!selectedFile) {
      set({ importError: "Choose a CSV file to import." });
      return;
    }

    set({ isImporting: true, importError: null, importRowErrors: [] });

    const body = new FormData();
    body.append("file", selectedFile);
    body.append("subject", importSubject);
    body.append("class", importClass);

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
      set({
        statusMessage: { type: "success", text: `Imported ${data.imported} question(s).` },
        isImportModalOpen: false,
      });
    } catch {
      set({ importError: "Network error while importing." });
    } finally {
      set({ isImporting: false });
    }
  },
}));
