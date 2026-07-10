"use client";

import { useState, useRef, useCallback, useMemo } from "react";

interface Question {
  id: number;
  text: string;
  type: "objective" | "theory";
  options: string[];
  correctAnswer: string;
  marks: number;
  subject: string;
  class: string;
  difficulty: "easy" | "medium" | "hard";
  createdAt: string;
}

interface StatusMessage {
  type: "success" | "error" | "warning";
  text: string;
}

const initialQuestions: Question[] = [
  {
    id: 1,
    text: "What is the chemical symbol for water?",
    type: "objective",
    options: ["H2O", "CO2", "NaCl", "HCl"],
    correctAnswer: "H2O",
    marks: 5,
    subject: "Chemistry",
    class: "JSS3",
    difficulty: "easy",
    createdAt: "2025-06-01",
  },
  {
    id: 2,
    text: "What is the atomic number of Carbon?",
    type: "objective",
    options: ["6", "12", "14", "8"],
    correctAnswer: "6",
    marks: 5,
    subject: "Chemistry",
    class: "JSS3",
    difficulty: "easy",
    createdAt: "2025-06-01",
  },
  {
    id: 3,
    text: "Define an acid and give two examples with their chemical formulas.",
    type: "theory",
    options: [],
    correctAnswer: "",
    marks: 10,
    subject: "Chemistry",
    class: "JSS3",
    difficulty: "medium",
    createdAt: "2025-06-02",
  },
  {
    id: 4,
    text: "Explain the process of photosynthesis and write the chemical equation.",
    type: "theory",
    options: [],
    correctAnswer: "",
    marks: 15,
    subject: "Chemistry",
    class: "JSS3",
    difficulty: "hard",
    createdAt: "2025-06-02",
  },
];

export const useQuestionBank = () => {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<Partial<Question>[]>([]);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const formTriggerRef = useRef<HTMLElement | null>(null);
  const importTriggerRef = useRef<HTMLElement | null>(null);

  const [formData, setFormData] = useState<Partial<Question>>({
    text: "",
    type: "objective",
    options: ["", "", "", ""],
    correctAnswer: "",
    marks: 5,
    subject: "",
    class: "",
    difficulty: "easy",
  });

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
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
    setFormError(null);
    setFormData({
      text: "",
      type: "objective",
      options: ["", "", "", ""],
      correctAnswer: "",
      marks: 5,
      subject: "",
      class: "",
      difficulty: "easy",
    });
    setIsModalOpen(true);
  }, []);

  const handleEditQuestion = useCallback(
    (question: Question, e: React.MouseEvent<HTMLButtonElement>) => {
      formTriggerRef.current = e.currentTarget;
      setIsEditing(true);
      setSelectedQuestion(question);
      setFormError(null);
      setFormData(question);
      setIsModalOpen(true);
    },
    [],
  );

  const handleDeleteQuestion = useCallback((question: Question) => {
    if (
      confirm(
        `Are you sure you want to delete this question: "${question.text.substring(0, 50)}..."?`,
      )
    ) {
      setQuestions((prev) => prev.filter((q) => q.id !== question.id));
      setStatusMessage({ type: "warning", text: "Question deleted successfully." });
      setTimeout(() => setStatusMessage(null), 3000);
    }
  }, []);

  const closeFormModal = useCallback(() => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setFormError(null);
  }, [isSubmitting]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setFormError(null);

      if (!formData.text?.trim()) {
        setFormError("Please enter the question text.");
        return;
      }
      if (!formData.subject?.trim()) {
        setFormError("Please enter a subject.");
        return;
      }
      if (!formData.class) {
        setFormError("Please select a class.");
        return;
      }
      if (
        formData.type === "objective" &&
        (!formData.options || formData.options.some((opt) => !opt))
      ) {
        setFormError("Please provide all four options for objective questions.");
        return;
      }

      setIsSubmitting(true);

      setTimeout(() => {
        if (isEditing && selectedQuestion) {
          setQuestions((prev) =>
            prev.map((q) =>
              q.id === selectedQuestion.id ? ({ ...q, ...formData } as Question) : q,
            ),
          );
          setStatusMessage({ type: "success", text: "Question updated successfully." });
        } else {
          const newQuestion: Question = {
            id: questions.length + 1,
            text: formData.text || "",
            type: (formData.type as "objective" | "theory") || "objective",
            options: formData.options || [],
            correctAnswer: formData.correctAnswer || "",
            marks: formData.marks || 5,
            subject: formData.subject || "",
            class: formData.class || "",
            difficulty: (formData.difficulty as "easy" | "medium" | "hard") || "easy",
            createdAt: new Date().toISOString().split("T")[0],
          };
          setQuestions((prev) => [...prev, newQuestion]);
          setStatusMessage({ type: "success", text: "Question added to bank successfully." });
        }
        setIsSubmitting(false);
        setIsModalOpen(false);
        setTimeout(() => setStatusMessage(null), 3000);
      }, 800);
    },
    [formData, isEditing, selectedQuestion, questions.length],
  );

  // Bulk import functions
  const handleOpenImportModal = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    importTriggerRef.current = e.currentTarget;
    setIsImportModalOpen(true);
    setImportPreview([]);
    setStatusMessage(null);
  }, []);

  const closeImportModal = useCallback(() => {
    if (isImporting) return;
    setIsImportModalOpen(false);
    setImportPreview([]);
    setSelectedFileName(null);
  }, [isImporting]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsedQuestions = parseFileContent(content, file.name);
        setImportPreview(parsedQuestions);
        if (parsedQuestions.length === 0) {
          setStatusMessage({
            type: "error",
            text: "No valid questions found in the file. Please check the format.",
          });
        } else {
          setStatusMessage({
            type: "success",
            text: `Found ${parsedQuestions.length} questions ready to import.`,
          });
        }
      } catch {
        setStatusMessage({ type: "error", text: "Error parsing file. Please check the format." });
      }
    };
    reader.readAsText(file);
  }, []);

  const parseFileContent = (content: string, fileName: string): Partial<Question>[] => {
    const questions: Partial<Question>[] = [];
    const lines = content.split("\n").filter((line) => line.trim());
    const isCSV = fileName.endsWith(".csv");

    if (isCSV) {
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim());
        if (values.length < 3) continue;
        const question: Partial<Question> = {
          type: "objective",
          options: [],
          marks: 5,
          difficulty: "easy",
        };
        headers.forEach((header, index) => {
          const value = values[index] || "";
          switch (header) {
            case "question":
            case "text":
              question.text = value;
              break;
            case "type":
              question.type = value.toLowerCase().includes("theory") ? "theory" : "objective";
              break;
            case "options":
              question.options = value.split("|").map((o) => o.trim());
              break;
            case "correctanswer":
            case "correct":
              question.correctAnswer = value;
              break;
            case "marks":
            case "score":
              question.marks = parseInt(value) || 5;
              break;
            case "subject":
              question.subject = value;
              break;
            case "class":
              question.class = value;
              break;
            case "difficulty":
              question.difficulty = (value.toLowerCase() as "easy" | "medium" | "hard") || "easy";
              break;
          }
        });
        if (question.text) questions.push(question);
      }
    } else {
      let currentQuestion: Partial<Question> = {};
      let isParsingOptions = false;
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.match(/^(\d+\.|Q\d+\.|Question\s+\d+:)/i)) {
          if (currentQuestion.text) {
            if (!currentQuestion.type) currentQuestion.type = "objective";
            if (!currentQuestion.options) currentQuestion.options = [];
            if (!currentQuestion.marks) currentQuestion.marks = 5;
            if (!currentQuestion.difficulty) currentQuestion.difficulty = "easy";
            questions.push(currentQuestion);
          }
          currentQuestion = { type: "objective", options: [], marks: 5, difficulty: "easy" };
          currentQuestion.text = trimmed.replace(/^(\d+\.|Q\d+\.|Question\s+\d+:)/i, "").trim();
          isParsingOptions = false;
        } else if (trimmed.match(/^[A-Da-d][\.\)]\s*/)) {
          if (!currentQuestion.options) currentQuestion.options = [];
          currentQuestion.options.push(trimmed.replace(/^[A-Da-d][\.\)]\s*/, "").trim());
          isParsingOptions = true;
        } else if (
          trimmed.toLowerCase().startsWith("answer:") ||
          trimmed.toLowerCase().startsWith("correct:")
        ) {
          currentQuestion.correctAnswer = trimmed.replace(/^(answer:|correct:)/i, "").trim();
        } else if (
          trimmed.toLowerCase().startsWith("marks:") ||
          trimmed.toLowerCase().startsWith("score:")
        ) {
          const marks = parseInt(trimmed.replace(/^(marks:|score:)/i, "").trim());
          if (!isNaN(marks)) currentQuestion.marks = marks;
        } else if (trimmed.toLowerCase().startsWith("subject:")) {
          currentQuestion.subject = trimmed.replace(/^subject:/i, "").trim();
        } else if (trimmed.toLowerCase().startsWith("class:")) {
          currentQuestion.class = trimmed.replace(/^class:/i, "").trim();
        } else if (trimmed.toLowerCase().startsWith("type:")) {
          const type = trimmed
            .replace(/^type:/i, "")
            .trim()
            .toLowerCase();
          currentQuestion.type = type.includes("theory") ? "theory" : "objective";
        } else if (currentQuestion.text && trimmed && !trimmed.match(/^[A-Da-d][\.\)]/)) {
          if (!isParsingOptions) currentQuestion.text += " " + trimmed;
        }
      }
      if (currentQuestion.text) {
        if (!currentQuestion.type) currentQuestion.type = "objective";
        if (!currentQuestion.options) currentQuestion.options = [];
        if (!currentQuestion.marks) currentQuestion.marks = 5;
        if (!currentQuestion.difficulty) currentQuestion.difficulty = "easy";
        questions.push(currentQuestion);
      }
    }
    return questions;
  };

  const confirmImport = useCallback(() => {
    if (importPreview.length === 0) {
      setStatusMessage({ type: "error", text: "No questions to import." });
      return;
    }
    setIsImporting(true);
    setTimeout(() => {
      let importedCount = 0;
      const newQuestions: Question[] = [];
      importPreview.forEach((q) => {
        if (q.text) {
          newQuestions.push({
            id: questions.length + newQuestions.length + 1,
            text: q.text || "",
            type: (q.type as "objective" | "theory") || "objective",
            options: q.options || [],
            correctAnswer: q.correctAnswer || "",
            marks: q.marks || 5,
            subject: q.subject || "",
            class: q.class || "",
            difficulty: (q.difficulty as "easy" | "medium" | "hard") || "easy",
            createdAt: new Date().toISOString().split("T")[0],
          });
          importedCount++;
        }
      });
      setQuestions((prev) => [...prev, ...newQuestions]);
      setStatusMessage({
        type: "success",
        text: `Successfully imported ${importedCount} questions.`,
      });
      setIsImporting(false);
      setIsImportModalOpen(false);
      setImportPreview([]);
      setTimeout(() => setStatusMessage(null), 5000);
    }, 1000);
  }, [importPreview, questions.length]);

  const downloadTemplate = useCallback(() => {
    const headers = [
      "question",
      "type",
      "options",
      "correctAnswer",
      "marks",
      "subject",
      "class",
      "difficulty",
    ];
    const sampleRow = [
      "What is the chemical symbol for water?",
      "objective",
      "H2O|CO2|NaCl|HCl",
      "H2O",
      "5",
      "Chemistry",
      "JSS3",
      "easy",
    ];
    const csvContent = [
      headers.join(","),
      sampleRow.join(","),
      "Define an acid and give examples.|theory|||10|Chemistry|JSS3|medium",
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
    setStatusMessage({ type: "success", text: "Template downloaded successfully." });
    setTimeout(() => setStatusMessage(null), 3000);
  }, []);

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchesSearch =
        q.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.subject.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSubject = filterSubject === "all" || q.subject === filterSubject;
      const matchesType = filterType === "all" || q.type === filterType;
      return matchesSearch && matchesSubject && matchesType;
    });
  }, [questions, searchTerm, filterSubject, filterType]);

  return {
    questions,
    filteredQuestions,
    isModalOpen,
    isEditing,
    formData,
    formError,
    isSubmitting,
    statusMessage,
    searchTerm,
    filterSubject,
    filterType,
    isImportModalOpen,
    isImporting,
    importPreview,
    selectedFileName,
    formTriggerRef,
    importTriggerRef,
    setSearchTerm,
    setFilterSubject,
    setFilterType,
    handleInputChange,
    handleOptionChange,
    handleAddQuestion,
    handleEditQuestion,
    handleDeleteQuestion,
    handleSubmit,
    closeFormModal,
    handleOpenImportModal,
    closeImportModal,
    handleFileUpload,
    confirmImport,
    downloadTemplate,
  };
};
