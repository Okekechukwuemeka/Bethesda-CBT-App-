"use client";

import React, { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

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

const ExamQuestionsPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const examId = params?.id as string;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  const firstInputRef = useRef<HTMLInputElement>(null);

  // Mock questions for this exam
  const [questions, setQuestions] = useState<Question[]>([
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
  ]);

  const [formData, setFormData] = useState<Partial<Question>>({
    text: "",
    type: "objective",
    options: ["", "", "", ""],
    correctAnswer: "",
    marks: 5,
  });

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
        text: "⚠️ Question removed from exam successfully.",
      });
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);

    if (!formData.text) {
      setStatusMessage({
        type: "error",
        text: "Please enter the question text.",
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
        };
        setQuestions((prev) => [...prev, newQuestion]);
        setStatusMessage({
          type: "success",
          text: "✅ Question added to exam successfully!",
        });
      }

      setIsSubmitting(false);
      setIsModalOpen(false);
      setTimeout(() => setStatusMessage(null), 3000);
    }, 800);
  };

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch = q.text.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || q.type === filterType;
    return matchesSearch && matchesType;
  });

  const getTypeBadgeColor = (type: string) => {
    return type === "objective" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800";
  };

  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A3A5C]">Exam Questions</h1>
          <p className="text-[#5A7A9A] text-sm">
            Manage questions for Exam #{examId} • Total Marks: {totalMarks}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/exams"
            className="bg-[#E8EEF5] hover:bg-[#D5DFE8] text-[#1A3A5C] font-medium px-4 py-2 rounded-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/30 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back
          </Link>
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
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-[#F8FAFE]"
            />
          </div>
          <div className="flex flex-wrap gap-3">
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
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">
                  Question
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">
                  Marks
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8EEF5]">
              {filteredQuestions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-[#8A9CAE]">
                    <div className="text-4xl mb-2">📝</div>
                    <p className="font-medium">No questions added yet</p>
                    <p className="text-sm">Add questions to this exam</p>
                  </td>
                </tr>
              ) : (
                filteredQuestions.map((question, index) => (
                  <tr key={question.id} className="hover:bg-[#F8FAFE] transition">
                    <td className="px-4 py-3 text-sm text-[#4A6A8A]">{index + 1}</td>
                    <td className="px-4 py-3 text-sm text-[#4A6A8A] max-w-md">
                      {question.text}
                      {question.type === "objective" && question.options.length > 0 && (
                        <div className="text-xs text-[#8A9CAE] mt-1">
                          Options: {question.options.join(", ")}
                        </div>
                      )}
                      {question.type === "objective" && question.correctAnswer && (
                        <div className="text-xs text-green-600 mt-1">
                          Answer: {question.correctAnswer}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${getTypeBadgeColor(question.type)}`}>
                        {question.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#4A6A8A]">{question.marks}</td>
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
        <div className="px-4 py-3 border-t border-[#E8EEF5] flex justify-between">
          <p className="text-sm text-[#5A7A9A]">Total: {filteredQuestions.length} questions</p>
          <p className="text-sm font-medium text-[#1A3A5C]">Total Marks: {totalMarks}</p>
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
                {isEditing ? "Edit Question" : "Add Question to Exam"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                {/* Question Text */}
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
                  {/* Type */}
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

                  {/* Marks */}
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

                  {/* Correct Answer */}
                  <div className="md:col-span-2">
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
                          ? "Enter the correct option (e.g., H2O)"
                          : "Optional for theory"
                      }
                      className="w-full px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-[#F8FAFE]"
                    />
                  </div>
                </div>

                {/* Options - Only for objective questions */}
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

              {/* Form Actions */}
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
    </div>
  );
};

export default ExamQuestionsPage;
