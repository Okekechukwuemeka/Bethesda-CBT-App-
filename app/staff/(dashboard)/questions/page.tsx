"use client";

import React, { useEffect, useState } from "react";
import { useTeacherProfileStore } from "@/store/useTeacherProfileStore";
import { useTeacherQuestionsStore } from "@/store/useTeacherQuestionsStore";
import SelectField from "@/components/ui/form/SelectField";
import TextField from "@/components/ui/form/TextField";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import QuestionFormModal from "@/components/staff/QuestionFormModal";
import BulkImportModal from "@/components/staff/BulkImportModal";

const TeacherQuestionsPage: React.FC = () => {
  const { profile, fetchProfile } = useTeacherProfileStore();
  const {
    questions,
    isLoading,
    error,
    statusMessage,
    filterSubject,
    filterClass,
    filterType,
    searchTerm,
    fetchQuestions,
    setFilterSubject,
    setFilterClass,
    setFilterType,
    setSearchTerm,
    openAddModal,
    openEditModal,
    openImportModal,
    deleteQuestion,
  } = useTeacherQuestionsStore();

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const subjects = profile?.assignedSubjects ?? [];
  const classes = profile?.assignedClasses ?? [];

  if (profile && profile.role !== "teacher") {
    return (
      <div role="alert" className="p-4 rounded-lg text-sm font-medium bg-yellow-100 text-yellow-800 border border-yellow-300">
        Question management is only available to staff with the teacher role.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A3A5C]">Question Bank</h1>
          <p className="text-[#5A7A9A] text-sm">
            Manage questions for your assigned subjects and classes
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={openImportModal}
            disabled={subjects.length === 0 || classes.length === 0}
            className="bg-[#E8EEF5] hover:bg-[#D5DFE8] text-[#1A3A5C] font-medium px-4 py-2 rounded-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/30 disabled:opacity-50">
            Bulk Import
          </button>
          <button
            type="button"
            onClick={openAddModal}
            disabled={subjects.length === 0 || classes.length === 0}
            className="bg-[#1A3A5C] hover:bg-[#14304D] text-white font-medium px-4 py-2 rounded-lg transition duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/50 disabled:opacity-50">
            + Add Question
          </button>
        </div>
      </div>

      {(subjects.length === 0 || classes.length === 0) && (
        <div className="p-4 rounded-lg text-sm font-medium bg-yellow-100 text-yellow-800 border border-yellow-300">
          You have no assigned subjects or classes yet. Contact your administrator to get assigned
          before adding questions.
        </div>
      )}

      {statusMessage && (
        <div
          role={statusMessage.type === "error" ? "alert" : "status"}
          className={`p-4 rounded-lg text-sm font-medium ${statusMessage.type === "success" ? "bg-green-100 text-green-800 border border-green-300" : "bg-red-100 text-red-800 border border-red-300"}`}>
          {statusMessage.text}
        </div>
      )}

      <div className="bg-white rounded-xl border border-[#C5D8EC] p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label htmlFor="q-search" className="sr-only">
            Search questions
          </label>
          <TextField
            id="q-search"
            placeholder="Search question text…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchQuestions()}
          />
        </div>
        <div className="w-full sm:w-48">
          <label htmlFor="filter-subject" className="sr-only">
            Filter by subject
          </label>
          <SelectField
            id="filter-subject"
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            options={[
              { value: "all", label: "All Subjects" },
              ...subjects.map((s) => ({ value: s.id, label: s.name })),
            ]}
          />
        </div>
        <div className="w-full sm:w-40">
          <label htmlFor="filter-class" className="sr-only">
            Filter by class
          </label>
          <SelectField
            id="filter-class"
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            options={[{ value: "all", label: "All Classes" }, ...classes.map((c) => ({ value: c, label: c }))]}
          />
        </div>
        <div className="w-full sm:w-40">
          <label htmlFor="filter-type" className="sr-only">
            Filter by type
          </label>
          <SelectField
            id="filter-type"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            options={[
              { value: "all", label: "All Types" },
              { value: "Objective", label: "Objective" },
              { value: "Theory", label: "Theory" },
            ]}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-[#1A3A5C] border-t-transparent" aria-hidden="true" />
        </div>
      ) : error ? (
        <div role="alert" className="p-4 rounded-lg text-sm font-medium bg-red-100 text-red-800 border border-red-300">
          {error}
        </div>
      ) : questions.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#C5D8EC] p-12 text-center">
          <p className="text-[#5A7A9A] font-medium">No questions found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#C5D8EC] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <caption className="sr-only">Your questions</caption>
              <thead className="bg-[#F8FAFE] border-b border-[#E8EEF5]">
                <tr>
                  {["Question", "Subject", "Class", "Type", "Marks", "Actions"].map((h) => (
                    <th key={h} scope="col" className="px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8EEF5]">
                {questions.map((q) => (
                  <tr key={q.id} className="hover:bg-[#F8FAFE]">
                    <td className="px-4 py-3 text-sm text-[#1A3A5C] max-w-md truncate">{q.text}</td>
                    <td className="px-4 py-3 text-sm text-[#4A6A8A] whitespace-nowrap">{q.subject.name}</td>
                    <td className="px-4 py-3 text-sm text-[#4A6A8A] whitespace-nowrap">{q.class}</td>
                    <td className="px-4 py-3 text-sm text-[#4A6A8A] whitespace-nowrap">{q.type}</td>
                    <td className="px-4 py-3 text-sm text-[#4A6A8A] whitespace-nowrap">{q.marks}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(q)}
                          className="text-[#2B6CB0] hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] rounded">
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDeleteId(q.id)}
                          className="text-red-600 hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-red-500 rounded">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <QuestionFormModal subjects={subjects} classes={classes} />
      <BulkImportModal subjects={subjects} classes={classes} />

      <ConfirmDialog
        isOpen={pendingDeleteId !== null}
        title="Delete question?"
        description="This question will be permanently removed. If it's attached to a live exam you'll be asked to confirm again."
        confirmLabel="Delete"
        isDangerous
        onConfirm={() => {
          if (pendingDeleteId) deleteQuestion(pendingDeleteId);
          setPendingDeleteId(null);
        }}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
};

export default TeacherQuestionsPage;
