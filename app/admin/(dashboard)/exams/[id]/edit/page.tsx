"use client";

import React, { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface StatusMessage {
  type: "success" | "error" | "warning";
  text: string;
}

const EditExamPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const examId = params?.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Mock exam data - in production, this would come from an API
  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    class: "",
    term: "",
    date: "",
    time: "",
    duration: 60,
    type: "objective" as "objective" | "theory" | "mixed",
    instructions: "",
    passingScore: 40,
    shuffleQuestions: false,
    status: "scheduled" as "scheduled" | "ongoing" | "completed",
  });

  // Load exam data
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      // Mock data - in production, fetch from API
      const mockExam = {
        id: parseInt(examId),
        title: "Chemistry First Term Examination",
        subject: "Chemistry",
        class: "JSS3",
        term: "First Term",
        date: "2025-06-23",
        time: "07:00",
        duration: 120,
        type: "objective" as "objective" | "theory" | "mixed",
        instructions: "Read all questions carefully. Select the best answer for each question.",
        passingScore: 40,
        shuffleQuestions: false,
        status: "scheduled" as "scheduled" | "ongoing" | "completed",
      };

      setFormData(mockExam);
      setIsLoading(false);
    }, 800);
  }, [examId]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "number" ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);

    if (
      !formData.title ||
      !formData.subject ||
      !formData.class ||
      !formData.date ||
      !formData.time
    ) {
      setStatusMessage({
        type: "error",
        text: "Please fill in all required fields.",
      });
      setIsSubmitting(false);
      return;
    }

    setTimeout(() => {
      setStatusMessage({
        type: "success",
        text: "✅ Exam updated successfully!",
      });

      setTimeout(() => {
        router.push("/admin/exams");
      }, 1500);

      setIsSubmitting(false);
    }, 1000);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    setShowDeleteConfirm(false);
    setIsSubmitting(true);

    setTimeout(() => {
      setStatusMessage({
        type: "warning",
        text: "⚠️ Exam deleted successfully.",
      });

      setTimeout(() => {
        router.push("/admin/exams");
      }, 1500);

      setIsSubmitting(false);
    }, 1000);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const getStatusOptions = () => {
    return [
      { value: "scheduled", label: "Scheduled" },
      { value: "ongoing", label: "Ongoing" },
      { value: "completed", label: "Completed" },
    ];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#1A3A5C] border-t-transparent"></div>
          <p className="mt-4 text-[#4A6A8A]">Loading exam details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A3A5C]">Edit Exam</h1>
          <p className="text-[#5A7A9A] text-sm">Update examination details</p>
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
            Cancel
          </Link>
          <button
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-red-500/50 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Delete
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

      {/* Form */}
      <div className="bg-white rounded-xl border border-[#C5D8EC] p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Exam Title */}
            <div className="md:col-span-2">
              <label htmlFor="title" className="block text-sm font-medium text-[#1A3A5C] mb-1">
                Exam Title <span className="text-red-500">*</span>
              </label>
              <input
                ref={firstInputRef}
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder="e.g., Chemistry First Term Examination"
                className="w-full px-4 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-[#F8FAFE]"
              />
            </div>

            {/* Subject */}
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-[#1A3A5C] mb-1">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                required
                placeholder="e.g., Chemistry"
                className="w-full px-4 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-[#F8FAFE]"
              />
            </div>

            {/* Class */}
            <div>
              <label htmlFor="class" className="block text-sm font-medium text-[#1A3A5C] mb-1">
                Class <span className="text-red-500">*</span>
              </label>
              <select
                id="class"
                name="class"
                value={formData.class}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] bg-[#F8FAFE]">
                <option value="">Select Class</option>
                <option value="JSS1">JSS1</option>
                <option value="JSS2">JSS2</option>
                <option value="JSS3">JSS3</option>
                <option value="SS1">SS1</option>
                <option value="SS2">SS2</option>
                <option value="SS3">SS3</option>
              </select>
            </div>

            {/* Term */}
            <div>
              <label htmlFor="term" className="block text-sm font-medium text-[#1A3A5C] mb-1">
                Term <span className="text-red-500">*</span>
              </label>
              <select
                id="term"
                name="term"
                value={formData.term}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] bg-[#F8FAFE]">
                <option value="">Select Term</option>
                <option value="First Term">First Term</option>
                <option value="Second Term">Second Term</option>
                <option value="Third Term">Third Term</option>
              </select>
            </div>

            {/* Exam Type */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-[#1A3A5C] mb-1">
                Exam Type <span className="text-red-500">*</span>
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] bg-[#F8FAFE]">
                <option value="objective">Objective (MCQ)</option>
                <option value="theory">Theory (Essay)</option>
                <option value="mixed">Mixed (Both)</option>
              </select>
            </div>

            {/* Duration */}
            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-[#1A3A5C] mb-1">
                Duration (minutes) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                required
                min="15"
                max="180"
                className="w-full px-4 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-[#F8FAFE]"
              />
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-[#1A3A5C] mb-1">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] bg-[#F8FAFE]">
                {getStatusOptions().map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-[#1A3A5C] mb-1">
                Exam Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-[#F8FAFE]"
              />
            </div>

            {/* Time */}
            <div>
              <label htmlFor="time" className="block text-sm font-medium text-[#1A3A5C] mb-1">
                Exam Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                id="time"
                name="time"
                value={formData.time}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-[#F8FAFE]"
              />
            </div>

            {/* Passing Score */}
            <div>
              <label
                htmlFor="passingScore"
                className="block text-sm font-medium text-[#1A3A5C] mb-1">
                Passing Score (%)
              </label>
              <input
                type="number"
                id="passingScore"
                name="passingScore"
                value={formData.passingScore}
                onChange={handleInputChange}
                min="0"
                max="100"
                className="w-full px-4 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-[#F8FAFE]"
              />
            </div>

            {/* Shuffle Questions */}
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  id="shuffleQuestions"
                  name="shuffleQuestions"
                  checked={formData.shuffleQuestions}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-[#1A3A5C] focus:ring-2 focus:ring-[#2B6CB0] rounded"
                />
                <span className="text-sm text-[#1A3A5C] font-medium">
                  Shuffle questions for each student
                </span>
              </label>
            </div>
          </div>

          {/* Instructions */}
          <div>
            <label htmlFor="instructions" className="block text-sm font-medium text-[#1A3A5C] mb-1">
              Exam Instructions
            </label>
            <textarea
              id="instructions"
              name="instructions"
              value={formData.instructions}
              onChange={handleInputChange}
              rows={4}
              placeholder="Enter exam instructions for students..."
              className="w-full px-4 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-[#F8FAFE] resize-y"
            />
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4 border-t border-[#E8EEF5]">
            <Link
              href="/admin/exams"
              className="flex-1 text-center bg-[#E8EEF5] hover:bg-[#D5DFE8] text-[#1A3A5C] font-medium py-2.5 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/30">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-[#1A3A5C] hover:bg-[#14304D] text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/50 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
              {isSubmitting ? "Saving..." : "Update Exam"}
            </button>
          </div>
        </form>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) cancelDelete();
          }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-[#B8D0E8]">
            <div className="bg-red-600 -mx-6 -mt-6 px-6 py-4 rounded-t-2xl">
              <h2 id="delete-title" className="text-xl font-bold text-white">
                Delete Exam
              </h2>
            </div>

            <div className="mt-6">
              <p className="text-[#4A6A8A] mb-4">
                Are you sure you want to delete <strong>{formData.title}</strong>?
              </p>
              <div className="bg-[#F8FAFE] border border-[#C5D8EC] rounded-lg p-4 mb-4">
                <p className="text-sm text-[#4A6A8A]">
                  <span className="font-medium">Subject:</span> {formData.subject}
                </p>
                <p className="text-sm text-[#4A6A8A]">
                  <span className="font-medium">Class:</span> {formData.class}
                </p>
                <p className="text-sm text-[#4A6A8A]">
                  <span className="font-medium">Questions:</span> This will delete all questions
                  associated with this exam
                </p>
              </div>
              <p className="text-sm text-red-600 mb-4">
                ⚠️ This action cannot be undone. All student results and data for this exam will be
                permanently deleted.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={cancelDelete}
                  className="flex-1 bg-[#E8EEF5] hover:bg-[#D5DFE8] text-[#1A3A5C] font-medium py-2.5 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/30">
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-red-500/50 active:scale-[0.98]">
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditExamPage;
