"use client";

import { useState, useRef, useCallback, useMemo } from "react";

interface Question {
  id: number;
  text: string;
  type: "objective" | "theory";
  options: string[];
  correctAnswer: string;
  marks: number;
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
  },
  {
    id: 2,
    text: "What is the atomic number of Carbon?",
    type: "objective",
    options: ["6", "12", "14", "8"],
    correctAnswer: "6",
    marks: 5,
  },
  {
    id: 3,
    text: "Define an acid and give two examples with their chemical formulas.",
    type: "theory",
    options: [],
    correctAnswer: "",
    marks: 10,
  },
  {
    id: 4,
    text: "Explain the process of photosynthesis and write the chemical equation.",
    type: "theory",
    options: [],
    correctAnswer: "",
    marks: 15,
  },
];

export const useExamQuestions = () => {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  const triggerRef = useRef<HTMLElement | null>(null);

  const [formData, setFormData] = useState<Partial<Question>>({
    text: "",
    type: "objective",
    options: ["", "", "", ""],
    correctAnswer: "",
    marks: 5,
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
    triggerRef.current = e.currentTarget;
    setIsEditing(false);
    setFormError(null);
    setFormData({
      text: "",
      type: "objective",
      options: ["", "", "", ""],
      correctAnswer: "",
      marks: 5,
    });
    setIsModalOpen(true);
  }, []);

  const handleEditQuestion = useCallback(
    (question: Question, e: React.MouseEvent<HTMLButtonElement>) => {
      triggerRef.current = e.currentTarget;
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
      setStatusMessage({ type: "warning", text: "Question removed from exam successfully." });
      setTimeout(() => setStatusMessage(null), 3000);
    }
  }, []);

  const closeModal = useCallback(() => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setFormError(null);
  }, [isSubmitting]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      setFormError(null);

      if (!formData.text?.trim()) {
        setFormError("Please enter the question text.");
        setIsSubmitting(false);
        return;
      }

      if (
        formData.type === "objective" &&
        (!formData.options || formData.options.some((opt) => !opt))
      ) {
        setFormError("Please provide all four options for objective questions.");
        setIsSubmitting(false);
        return;
      }

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
          };
          setQuestions((prev) => [...prev, newQuestion]);
          setStatusMessage({ type: "success", text: "Question added to exam successfully." });
        }

        setIsSubmitting(false);
        setIsModalOpen(false);
        setTimeout(() => setStatusMessage(null), 3000);
      }, 800);
    },
    [formData, isEditing, selectedQuestion, questions.length],
  );

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchesSearch = q.text.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === "all" || q.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [questions, searchTerm, filterType]);

  const totalMarks = useMemo(() => {
    return questions.reduce((sum, q) => sum + q.marks, 0);
  }, [questions]);

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
    filterType,
    totalMarks,
    triggerRef,
    setSearchTerm,
    setFilterType,
    handleInputChange,
    handleOptionChange,
    handleAddQuestion,
    handleEditQuestion,
    handleDeleteQuestion,
    handleSubmit,
    closeModal,
  };
};
