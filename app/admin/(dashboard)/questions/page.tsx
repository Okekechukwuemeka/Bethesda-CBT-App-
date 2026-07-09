"use client";

import React, { useState, useRef } from "react";

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

const QuestionsPage: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([
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
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<Partial<Question>[]>([]);

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

  const firstInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    if (name === "options") {
      const options = value.split(",").map((opt) => opt.trim());
      setFormData((prev) => ({ ...prev, options }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAddQuestion = () => {
    setIsEditing(false);
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
    setTimeout(() => firstInputRef.current?.focus(), 100);
  };

  const handleEditQuestion = (question: Question) => {
    setIsEditing(true);
    setFormData(question);
    setIsModalOpen(true);
    setTimeout(() => firstInputRef.current?.focus(), 100);
  };

  const handleDeleteQuestion = (question: Question) => {
    if (
      confirm(
        `Are you sure you want to delete this question: "${question.text.substring(0, 50)}..."?`,
      )
    ) {
      setQuestions((prev) => prev.filter((q) => q.id !== question.id));
      setStatusMessage({
        type: "warning",
        text: "⚠️ Question deleted successfully.",
      });
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);

    if (!formData.text || !formData.subject || !formData.class) {
      setStatusMessage({
        type: "error",
        text: "Please fill in all required fields.",
      });
      setIsSubmitting(false);
      return;
    }

    if (
      formData.type === "objective" &&
      (!formData.options || formData.options.some((opt) => !opt))
    ) {
      setStatusMessage({
        type: "error",
        text: "Please provide all options for objective questions.",
      });
      setIsSubmitting(false);
      return;
    }

    setTimeout(() => {
      if (isEditing && selectedQuestion) {
        setQuestions((prev) =>
          prev.map((q) => (q.id === selectedQuestion.id ? ({ ...q, ...formData } as Question) : q)),
        );
        setStatusMessage({
          type: "success",
          text: "✅ Question updated successfully!",
        });
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
        setStatusMessage({
          type: "success",
          text: "✅ Question added to bank successfully!",
        });
      }

      setIsSubmitting(false);
      setIsModalOpen(false);
      setTimeout(() => setStatusMessage(null), 3000);
    }, 800);
  };

  // ============ BULK IMPORT FUNCTIONS ============

  const handleOpenImportModal = () => {
    setIsImportModalOpen(true);
    setImportPreview([]);
    setStatusMessage(null);
    setTimeout(() => fileInputRef.current?.focus(), 100);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
            text: `✅ Found ${parsedQuestions.length} questions ready to import.`,
          });
        }
      } catch (error) {
        setStatusMessage({
          type: "error",
          text: "Error parsing file. Please check the format.",
        });
      }
    };
    reader.readAsText(file);
  };

  const parseFileContent = (content: string, fileName: string): Partial<Question>[] => {
    const questions: Partial<Question>[] = [];
    const lines = content.split("\n").filter((line) => line.trim());

    // Determine file type
    const isCSV = fileName.endsWith(".csv");

    if (isCSV) {
      // Parse CSV - headers: question,type,options,correctAnswer,marks,subject,class,difficulty
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

        if (question.text) {
          questions.push(question);
        }
      }
    } else {
      // Parse Word/Text format
      let currentQuestion: Partial<Question> = {};
      let isParsingOptions = false;
      let optionIndex = 0;

      for (const line of lines) {
        const trimmed = line.trim();

        // Check if line is a question number (e.g., "1.", "Q1.", "Question 1:")
        if (trimmed.match(/^(\d+\.|Q\d+\.|Question\s+\d+:)/i)) {
          // Save previous question
          if (currentQuestion.text) {
            if (!currentQuestion.type) currentQuestion.type = "objective";
            if (!currentQuestion.options) currentQuestion.options = [];
            if (!currentQuestion.marks) currentQuestion.marks = 5;
            if (!currentQuestion.difficulty) currentQuestion.difficulty = "easy";
            questions.push(currentQuestion);
          }

          // Start new question
          currentQuestion = {
            type: "objective",
            options: [],
            marks: 5,
            difficulty: "easy",
          };
          const textPart = trimmed.replace(/^(\d+\.|Q\d+\.|Question\s+\d+:)/i, "").trim();
          currentQuestion.text = textPart;
          isParsingOptions = false;
          optionIndex = 0;
        }
        // Check if line is an option (e.g., "A.", "A)", "a)", etc.)
        else if (trimmed.match(/^[A-Da-d][\.\)]\s*/)) {
          if (!currentQuestion.options) currentQuestion.options = [];
          const optionText = trimmed.replace(/^[A-Da-d][\.\)]\s*/, "").trim();
          currentQuestion.options.push(optionText);
          isParsingOptions = true;
        }
        // Check if line is the correct answer indicator
        else if (
          trimmed.toLowerCase().startsWith("answer:") ||
          trimmed.toLowerCase().startsWith("correct:")
        ) {
          const answer = trimmed.replace(/^(answer:|correct:)/i, "").trim();
          currentQuestion.correctAnswer = answer;
        }
        // Check if line is marks
        else if (
          trimmed.toLowerCase().startsWith("marks:") ||
          trimmed.toLowerCase().startsWith("score:")
        ) {
          const marks = parseInt(trimmed.replace(/^(marks:|score:)/i, "").trim());
          if (!isNaN(marks)) currentQuestion.marks = marks;
        }
        // Check if line is subject
        else if (trimmed.toLowerCase().startsWith("subject:")) {
          currentQuestion.subject = trimmed.replace(/^subject:/i, "").trim();
        }
        // Check if line is class
        else if (trimmed.toLowerCase().startsWith("class:")) {
          currentQuestion.class = trimmed.replace(/^class:/i, "").trim();
        }
        // Check if line is type
        else if (trimmed.toLowerCase().startsWith("type:")) {
          const type = trimmed
            .replace(/^type:/i, "")
            .trim()
            .toLowerCase();
          currentQuestion.type = type.includes("theory") ? "theory" : "objective";
        }
        // Continue question text (multi-line)
        else if (currentQuestion.text && trimmed && !trimmed.match(/^[A-Da-d][\.\)]/)) {
          if (!isParsingOptions) {
            currentQuestion.text += " " + trimmed;
          }
        }
      }

      // Save the last question
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

  const confirmImport = () => {
    if (importPreview.length === 0) {
      setStatusMessage({
        type: "error",
        text: "No questions to import.",
      });
      return;
    }

    setIsImporting(true);

    setTimeout(() => {
      let importedCount = 0;
      const newQuestions: Question[] = [];

      importPreview.forEach((q, index) => {
        if (q.text) {
          const question: Question = {
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
          };
          newQuestions.push(question);
          importedCount++;
        }
      });

      setQuestions((prev) => [...prev, ...newQuestions]);
      setStatusMessage({
        type: "success",
        text: `✅ Successfully imported ${importedCount} questions!`,
      });

      setIsImporting(false);
      setIsImportModalOpen(false);
      setImportPreview([]);
      if (fileInputRef.current) fileInputRef.current.value = "";

      setTimeout(() => setStatusMessage(null), 5000);
    }, 1000);
  };

  const downloadTemplate = () => {
    // Create CSV template
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

    setStatusMessage({
      type: "success",
      text: "📥 Template downloaded successfully!",
    });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      q.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = filterSubject === "all" || q.subject === filterSubject;
    const matchesType = filterType === "all" || q.type === filterType;
    return matchesSearch && matchesSubject && matchesType;
  });

  const getTypeBadgeColor = (type: string) => {
    return type === "objective" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800";
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "hard":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A3A5C]">Question Bank</h1>
          <p className="text-[#5A7A9A] text-sm">Create and manage questions for all exams</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleOpenImportModal}
            className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg transition duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-green-500/50 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            Import Bulk
          </button>
          <button
            onClick={handleAddQuestion}
            className="bg-[#1A3A5C] hover:bg-[#14304D] text-white font-medium px-4 py-2 rounded-lg transition duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/50 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Question
          </button>
        </div>
      </div>

      {/* Status Message */}
      {statusMessage && (
        <div
          role="alert"
          aria-live="polite"
          className={`p-4 rounded-lg text-sm font-medium ${
            statusMessage.type === "success"
              ? "bg-green-100 text-green-800 border border-green-300"
              : statusMessage.type === "warning"
                ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                : "bg-red-100 text-red-800 border border-red-300"
          }`}>
          {statusMessage.text}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-[#C5D8EC] p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="search" className="sr-only">
              Search questions
            </label>
            <input
              id="search"
              type="text"
              placeholder="Search by question or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-[#F8FAFE]"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="px-4 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] bg-[#F8FAFE]"
              aria-label="Filter by subject">
              <option value="all">All Subjects</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Physics">Physics</option>
              <option value="Mathematics">Mathematics</option>
              <option value="English Language">English Language</option>
              <option value="Biology">Biology</option>
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] bg-[#F8FAFE]"
              aria-label="Filter by type">
              <option value="all">All Types</option>
              <option value="objective">Objective</option>
              <option value="theory">Theory</option>
            </select>
          </div>
        </div>
      </div>

      {/* Questions Table */}
      <div className="bg-white rounded-xl border border-[#C5D8EC] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full" role="table" aria-label="Questions list">
            <thead className="bg-[#F8FAFE] border-b border-[#E8EEF5]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">
                  Question
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">
                  Class
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">
                  Marks
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">
                  Difficulty
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8EEF5]">
              {filteredQuestions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-[#8A9CAE]">
                    <div className="text-4xl mb-2">📝</div>
                    <p className="font-medium">No questions found</p>
                    <p className="text-sm">Add your first question to the bank</p>
                  </td>
                </tr>
              ) : (
                filteredQuestions.map((question) => (
                  <tr key={question.id} className="hover:bg-[#F8FAFE] transition">
                    <td className="px-4 py-3 text-sm text-[#4A6A8A] max-w-xs truncate">
                      {question.text}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${getTypeBadgeColor(question.type)}`}>
                        {question.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#4A6A8A]">{question.subject}</td>
                    <td className="px-4 py-3 text-sm text-[#4A6A8A]">{question.class}</td>
                    <td className="px-4 py-3 text-sm text-[#4A6A8A]">{question.marks}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${getDifficultyColor(question.difficulty)}`}>
                        {question.difficulty}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditQuestion(question)}
                          className="text-[#2B6CB0] hover:text-[#1A3A5C] p-1 rounded focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]"
                          aria-label={`Edit question`}>
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(question)}
                          className="text-red-600 hover:text-red-800 p-1 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                          aria-label={`Delete question`}>
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-[#E8EEF5]">
          <p className="text-sm text-[#5A7A9A]">Total: {filteredQuestions.length} questions</p>
        </div>
      </div>

      {/* Add/Edit Question Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmitting) {
              setIsModalOpen(false);
            }
          }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#B8D0E8]">
            <div className="bg-[#1A3A5C] px-6 py-4 rounded-t-2xl sticky top-0 z-10">
              <h2 id="modal-title" className="text-xl font-bold text-white">
                {isEditing ? "Edit Question" : "Add New Question"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="text" className="block text-sm font-medium text-[#1A3A5C] mb-1">
                    Question Text <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    ref={firstInputRef as any}
                    id="text"
                    name="text"
                    value={formData.text || ""}
                    onChange={handleInputChange}
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-[#F8FAFE] resize-y"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="type" className="block text-sm font-medium text-[#1A3A5C] mb-1">
                      Question Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="type"
                      name="type"
                      value={formData.type || "objective"}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] bg-[#F8FAFE]">
                      <option value="objective">Objective (MCQ)</option>
                      <option value="theory">Theory (Essay)</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="marks"
                      className="block text-sm font-medium text-[#1A3A5C] mb-1">
                      Marks <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="marks"
                      name="marks"
                      value={formData.marks || 5}
                      onChange={handleInputChange}
                      required
                      min="1"
                      max="50"
                      className="w-full px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-[#F8FAFE]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="subject"
                      className="block text-sm font-medium text-[#1A3A5C] mb-1">
                      Subject <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject || ""}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-[#F8FAFE]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="class"
                      className="block text-sm font-medium text-[#1A3A5C] mb-1">
                      Class <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="class"
                      name="class"
                      value={formData.class || ""}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] bg-[#F8FAFE]">
                      <option value="">Select Class</option>
                      <option value="JSS1">JSS1</option>
                      <option value="JSS2">JSS2</option>
                      <option value="JSS3">JSS3</option>
                      <option value="SS1">SS1</option>
                      <option value="SS2">SS2</option>
                      <option value="SS3">SS3</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="difficulty"
                      className="block text-sm font-medium text-[#1A3A5C] mb-1">
                      Difficulty
                    </label>
                    <select
                      id="difficulty"
                      name="difficulty"
                      value={formData.difficulty || "easy"}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] bg-[#F8FAFE]">
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="correctAnswer"
                      className="block text-sm font-medium text-[#1A3A5C] mb-1">
                      Correct Answer{" "}
                      {formData.type === "objective" && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      id="correctAnswer"
                      name="correctAnswer"
                      value={formData.correctAnswer || ""}
                      onChange={handleInputChange}
                      required={formData.type === "objective"}
                      placeholder={
                        formData.type === "objective"
                          ? "Enter the correct option"
                          : "Optional for theory"
                      }
                      className="w-full px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-[#F8FAFE]"
                    />
                  </div>
                </div>

                {formData.type === "objective" && (
                  <div>
                    <label className="block text-sm font-medium text-[#1A3A5C] mb-1">
                      Options <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2">
                      {[0, 1, 2, 3].map((index) => (
                        <input
                          key={index}
                          type="text"
                          placeholder={`Option ${String.fromCharCode(65 + index)}`}
                          value={formData.options?.[index] || ""}
                          onChange={(e) => {
                            const newOptions = [...(formData.options || ["", "", "", ""])];
                            newOptions[index] = e.target.value;
                            setFormData((prev) => ({ ...prev, options: newOptions }));
                          }}
                          className="w-full px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-[#F8FAFE]"
                          aria-label={`Option ${String.fromCharCode(65 + index)}`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-[#E8EEF5]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="flex-1 bg-[#E8EEF5] hover:bg-[#D5DFE8] text-[#1A3A5C] font-medium py-2.5 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/30 disabled:opacity-50">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-[#1A3A5C] hover:bg-[#14304D] text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/50 active:scale-[0.98] disabled:opacity-50">
                  {isSubmitting ? "Saving..." : isEditing ? "Update Question" : "Add Question"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {isImportModalOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="import-title"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isImporting) {
              setIsImportModalOpen(false);
            }
          }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#B8D0E8]">
            <div className="bg-[#1A3A5C] px-6 py-4 rounded-t-2xl sticky top-0 z-10">
              <h2 id="import-title" className="text-xl font-bold text-white">
                Bulk Import Questions
              </h2>
            </div>

            <div className="p-6">
              {/* Instructions */}
              <div className="bg-[#F8FAFE] border border-[#C5D8EC] rounded-lg p-4 mb-6">
                <h3 className="font-medium text-[#1A3A5C] mb-2">📋 Instructions</h3>
                <ul className="text-sm text-[#4A6A8A] space-y-1 list-disc list-inside">
                  <li>
                    Upload a <strong>CSV</strong> or <strong>Word/Text</strong> file with questions
                  </li>
                  <li>For CSV: Use the format from the template (download below)</li>
                  <li>
                    For Word/Text: Questions can be numbered (1., 2., etc.) with options (A., B.,
                    etc.)
                  </li>
                  <li>
                    Include fields: question, type, options, correctAnswer, marks, subject, class,
                    difficulty
                  </li>
                </ul>
              </div>

              {/* Download Template */}
              <button
                onClick={downloadTemplate}
                className="mb-4 text-[#2B6CB0] hover:text-[#1A3A5C] text-sm font-medium flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] rounded px-2 py-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Download CSV Template
              </button>

              {/* File Upload */}
              <div className="border-2 border-dashed border-[#C5D8EC] rounded-lg p-6 text-center hover:border-[#2B6CB0] transition">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  aria-label="Upload questions file"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center gap-2">
                  <svg
                    className="w-12 h-12 text-[#8A9CAE]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <span className="text-[#1A3A5C] font-medium">
                    Click to upload or drag and drop
                  </span>
                  <span className="text-[#8A9CAE] text-sm">CSV, Word, or Text files supported</span>
                </label>
              </div>

              {/* Preview */}
              {importPreview.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-medium text-[#1A3A5C] mb-2">
                    Preview ({importPreview.length} questions found)
                  </h3>
                  <div className="max-h-60 overflow-y-auto border border-[#C5D8EC] rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-[#F8FAFE] sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left text-[#5A7A9A]">#</th>
                          <th className="px-3 py-2 text-left text-[#5A7A9A]">Question</th>
                          <th className="px-3 py-2 text-left text-[#5A7A9A]">Type</th>
                          <th className="px-3 py-2 text-left text-[#5A7A9A]">Subject</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E8EEF5]">
                        {importPreview.slice(0, 10).map((q, index) => (
                          <tr key={index}>
                            <td className="px-3 py-2 text-[#4A6A8A]">{index + 1}</td>
                            <td className="px-3 py-2 text-[#4A6A8A] truncate max-w-xs">{q.text}</td>
                            <td className="px-3 py-2">
                              <span
                                className={`text-xs px-2 py-1 rounded-full font-medium ${
                                  q.type === "theory"
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}>
                                {q.type || "objective"}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-[#4A6A8A]">{q.subject || "-"}</td>
                          </tr>
                        ))}
                        {importPreview.length > 10 && (
                          <tr>
                            <td colSpan={4} className="px-3 py-2 text-center text-[#8A9CAE]">
                              + {importPreview.length - 10} more questions
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 mt-6 pt-4 border-t border-[#E8EEF5]">
                <button
                  type="button"
                  onClick={() => {
                    setIsImportModalOpen(false);
                    setImportPreview([]);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  disabled={isImporting}
                  className="flex-1 bg-[#E8EEF5] hover:bg-[#D5DFE8] text-[#1A3A5C] font-medium py-2.5 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/30 disabled:opacity-50">
                  Cancel
                </button>
                <button
                  onClick={confirmImport}
                  disabled={importPreview.length === 0 || isImporting}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-green-500/50 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
                  {isImporting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Importing...
                    </span>
                  ) : (
                    `Import ${importPreview.length} Questions`
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionsPage;
