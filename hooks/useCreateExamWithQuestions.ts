"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Question } from "@/types/question";
import { questionBankData } from "@/mockData/question-bank";
import { FieldErrors, RequiredField } from "@/types/exam-form";

interface ExamFormData {
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

interface StatusMessage {
  type: "success" | "error" | "warning";
  text: string;
}

export const useCreateExamWithQuestions = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [filterClass, setFilterClass] = useState<string>("all");
  const [showQuestionBank, setShowQuestionBank] = useState(false);
  const [questionBank] = useState<Question[]>(questionBankData);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const fieldRefs = useRef<Partial<Record<RequiredField, HTMLElement | null>>>({});

  const [formData, setFormData] = useState<ExamFormData>({
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

  useEffect(() => {
    titleInputRef.current?.focus();
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

  const validate = useCallback((): FieldErrors => {
    const errors: FieldErrors = {};
    if (!formData.title.trim()) errors.title = "Exam title is required.";
    if (!formData.subject.trim()) errors.subject = "Subject is required.";
    if (!formData.class) errors.class = "Please select a class.";
    if (!formData.term) errors.term = "Please select a term.";
    if (!formData.date) errors.date = "Exam date is required.";
    if (!formData.time) errors.time = "Exam time is required.";
    return errors;
  }, [formData]);

  const handleAddQuestion = useCallback(
    (question: Question) => {
      if (!selectedQuestions.find((q) => q.id === question.id)) {
        setSelectedQuestions((prev) => [...prev, question]);
        setStatusMessage({
          type: "success",
          text: `✅ Question "${question.text.substring(0, 30)}..." added to exam.`,
        });
        setTimeout(() => setStatusMessage(null), 3000);
      } else {
        setStatusMessage({
          type: "warning",
          text: "⚠️ This question is already in the exam.",
        });
        setTimeout(() => setStatusMessage(null), 3000);
      }
    },
    [selectedQuestions],
  );

  const handleRemoveQuestion = useCallback((questionId: number) => {
    setSelectedQuestions((prev) => prev.filter((q) => q.id !== questionId));
    setStatusMessage({
      type: "warning",
      text: "⚠️ Question removed from exam.",
    });
    setTimeout(() => setStatusMessage(null), 3000);
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
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

      if (selectedQuestions.length === 0) {
        setStatusMessage({
          type: "error",
          text: "Please add at least one question to the exam.",
        });
        return;
      }

      setStatusMessage(null);
      setIsSubmitting(true);

      // TODO: Replace with API call
      setTimeout(() => {
        setStatusMessage({
          type: "success",
          text: `✅ Exam "${formData.title}" created with ${selectedQuestions.length} questions.`,
        });
        setIsSubmitted(true);
        setIsSubmitting(false);
      }, 1000);
    },
    [validate, selectedQuestions, formData.title],
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
    setSelectedQuestions([]);
    setIsSubmitted(false);
    setStatusMessage(null);
    setFieldErrors({});
    setSearchTerm("");
    setFilterType("all");
    setFilterSubject("all");
    setFilterClass("all");
    setShowQuestionBank(false);
    titleInputRef.current?.focus();
  }, []);

  // Filter questions
  const filteredQuestions = useMemo(() => {
    return questionBank.filter((q) => {
      const matchesSearch = q.text.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === "all" || q.type === filterType;
      const matchesSubject = filterSubject === "all" || q.subject === filterSubject;
      const matchesClass = filterClass === "all" || q.class === filterClass;
      return matchesSearch && matchesType && matchesSubject && matchesClass;
    });
  }, [questionBank, searchTerm, filterType, filterSubject, filterClass]);

  const totalMarks = useMemo(() => {
    return selectedQuestions.reduce((sum, q) => sum + q.marks, 0);
  }, [selectedQuestions]);

  return {
    formData,
    isSubmitting,
    isSubmitted,
    statusMessage,
    fieldErrors,
    selectedQuestions,
    questionBank,
    filteredQuestions,
    searchTerm,
    filterType,
    filterSubject,
    filterClass,
    showQuestionBank,
    totalMarks,
    titleInputRef,
    fieldRefs,
    handleInputChange,
    handleAddQuestion,
    handleRemoveQuestion,
    handleSubmit,
    resetForm,
    setSearchTerm,
    setFilterType,
    setFilterSubject,
    setFilterClass,
    setShowQuestionBank,
  };
};
