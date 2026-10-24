"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTeacherProfileStore } from "@/store/useTeacherProfileStore";
import { useTeacherQuestionsStore } from "@/store/useTeacherQuestionsStore";
import SelectField from "@/components/ui/form/SelectField";
import TextField from "@/components/ui/form/TextField";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import QuestionFormModal from "@/components/staff/QuestionFormModal";
import BulkImportModal from "@/components/staff/BulkImportModal";
import GroupFilterSelect from "@/components/questions/GroupFilterSelect";
import MoveToGroupModal from "@/components/questions/MoveToGroupModal";
import BulkDeleteQuestionsModal from "@/components/admin/questions/BulkDeleteQuestionsModal";
import PassageManagerModal from "@/components/admin/questions/PassageManagerModal";
import { usePassages } from "@/hooks/usePassages";

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
    filterGroup,
    groups,
    ungroupedCount,
    isLoadingGroups,
    isMoveModalOpen,
    isMoving,
    moveError,
    fetchGroups,
    setFilterGroup,
    openMoveModal,
    closeMoveModal,
    confirmMove,
    fetchQuestions,
    setFilterSubject,
    setFilterClass,
    setFilterType,
    setSearchTerm,
    openAddModal,
    openEditModal,
    openImportModal,
    deleteQuestion,
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    isBulkDeleteModalOpen,
    isBulkDeleting,
    bulkDeleteError,
    bulkDeleteBlocked,
    requestBulkDelete,
    closeBulkDeleteModal,
    runBulkDelete,
  } = useTeacherQuestionsStore();

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const selectAllRef = useRef<HTMLInputElement>(null);
  const bulkDeleteTriggerRef = useRef<HTMLButtonElement>(null);
  const wasBulkModalOpen = useRef(false);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    fetchGroups();
    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const subjects = profile?.assignedSubjects ?? [];
  const classes = profile?.assignedClasses ?? [];

  // A teacher can only delete questions they added themselves, so only those
  // rows get a checkbox and "select all" covers exactly those.
  const selectableIds = useMemo(
    () =>
      profile
        ? questions
            .filter((q) => q.createdByModel === "Staff" && q.createdBy === profile.id)
            .map((q) => q.id)
        : [],
    [questions, profile],
  );
  const selectableSet = useMemo(() => new Set(selectableIds), [selectableIds]);
  const selectedCount = selectableIds.filter((id) => selectedIds.has(id)).length;
  const allSelected = selectableIds.length > 0 && selectedCount === selectableIds.length;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = selectedCount > 0 && !allSelected;
    }
  }, [selectedCount, allSelected]);

  // After the delete dialog closes, put keyboard / screen reader focus back
  // somewhere sensible: the Delete Selected button if it is still there,
  // otherwise the select-all checkbox.
  useEffect(() => {
    if (wasBulkModalOpen.current && !isBulkDeleteModalOpen) {
      (bulkDeleteTriggerRef.current ?? selectAllRef.current)?.focus();
    }
    wasBulkModalOpen.current = isBulkDeleteModalOpen;
  }, [isBulkDeleteModalOpen]);

  // Passages share this page's status banner (the store's statusMessage).
  const showPassageStatus = useCallback(
    (message: { type: "success" | "error" | "warning"; text: string }) => {
      useTeacherQuestionsStore.setState({
        statusMessage: {
          type: message.type === "error" ? "error" : "success",
          text: message.text,
        },
      });
    },
    [],
  );
  const passageState = usePassages(showPassageStatus, "/api/staff/passages");

  // The passage manager expects { _id, name, code }; the profile uses { id, ... }.
  const passageSubjects = useMemo(
    () => subjects.map((s) => ({ _id: s.id, name: s.name, code: s.code })),
    [subjects],
  );

  if (profile && profile.role !== "teacher") {
    return (
      <div role="alert" className="p-4 rounded-lg text-sm font-medium bg-yellow-100 text-yellow-800 border border-yellow-300">
        Question management is only available to staff with the teacher role.
      </div>
    );
  }

  return (
    <>
    <div className="space-y-6" inert={isBulkDeleteModalOpen}>
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A3A5C]">Question Bank</h1>
          <p className="text-[#5A7A9A] text-sm">
            Manage questions for your assigned subjects and classes
          </p>
        </div>
        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <button
            type="button"
            onClick={openAddModal}
            disabled={subjects.length === 0 || classes.length === 0}
            className="bg-[#1A3A5C] hover:bg-[#14304D] text-white font-medium px-4 py-2 rounded-lg transition duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/50 disabled:opacity-50 w-full">
            + Add Question
          </button>
          <button
            type="button"
            onClick={openImportModal}
            disabled={subjects.length === 0 || classes.length === 0}
            className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg transition duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-green-500/50 disabled:opacity-50 w-full">
            Bulk Import
          </button>
          <button
            type="button"
            onClick={passageState.openPassageManager}
            className="bg-amber-600 hover:bg-amber-700 text-white font-medium px-4 py-2 rounded-lg transition duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-amber-500/50 w-full">
            Manage Passages
          </button>
          <button
            type="button"
            onClick={openMoveModal}
            disabled={subjects.length === 0 || classes.length === 0}
            className="border border-[#2B6CB0] text-[#2B6CB0] hover:bg-[#F0F6FC] font-medium px-4 py-2 rounded-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/30 disabled:opacity-50 w-full">
            Move Questions to a Group
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

      <div className="bg-white rounded-xl border border-[#C5D8EC] p-4 flex flex-col sm:flex-row gap-3" role="search">
        <GroupFilterSelect
          id="filter-group"
          value={filterGroup}
          onChange={setFilterGroup}
          groups={groups}
          ungroupedCount={ungroupedCount}
          isLoading={isLoadingGroups}
          allValue="all"
          srOnlyLabel
          className="w-full sm:w-64"
        />
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

      <p className="sr-only" role="status" aria-live="polite">
        {isLoading ? "Loading questions" : `${questions.length} question${questions.length !== 1 ? "s" : ""} found`}
      </p>

      {selectedCount > 0 && (
        <div className="bg-[#1A3A5C] text-white rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium" role="status" aria-live="polite">
            {selectedCount} question{selectedCount !== 1 ? "s" : ""} selected
          </p>
          <button
            ref={bulkDeleteTriggerRef}
            type="button"
            onClick={requestBulkDelete}
            className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-red-500/50">
            Delete Selected
          </button>
        </div>
      )}

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
                  <th scope="col" className="px-4 py-3 w-10">
                    {selectableIds.length > 0 ? (
                      <input
                        ref={selectAllRef}
                        type="checkbox"
                        checked={allSelected}
                        onChange={() => toggleSelectAll(selectableIds)}
                        aria-label={`Select all ${selectableIds.length} of your questions`}
                        className="w-4 h-4 text-[#1A3A5C] focus:ring-2 focus:ring-[#2B6CB0] rounded"
                      />
                    ) : (
                      <span className="sr-only">Select</span>
                    )}
                  </th>
                  {["Question", "Subject", "Class", "Type", "Marks", "Group", "Actions"].map((h) => (
                    <th key={h} scope="col" className="px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8EEF5]">
                {questions.map((q) => (
                  <tr key={q.id} className="hover:bg-[#F8FAFE]">
                    <td className="px-4 py-3">
                      {selectableSet.has(q.id) ? (
                        <input
                          type="checkbox"
                          checked={selectedIds.has(q.id)}
                          onChange={() => toggleSelect(q.id)}
                          aria-label={`Select question: ${q.text.length > 40 ? `${q.text.slice(0, 40)}…` : q.text}`}
                          className="w-4 h-4 text-[#1A3A5C] focus:ring-2 focus:ring-[#2B6CB0] rounded"
                        />
                      ) : (
                        <span className="sr-only">Added by someone else, cannot be selected</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#1A3A5C] max-w-md truncate">{q.text}</td>
                    <td className="px-4 py-3 text-sm text-[#4A6A8A] whitespace-nowrap">{q.subject.name}</td>
                    <td className="px-4 py-3 text-sm text-[#4A6A8A] whitespace-nowrap">{q.class}</td>
                    <td className="px-4 py-3 text-sm text-[#4A6A8A] whitespace-nowrap">{q.type}</td>
                    <td className="px-4 py-3 text-sm text-[#4A6A8A] whitespace-nowrap">{q.marks}</td>
                    <td className="px-4 py-3 text-sm text-[#4A6A8A] whitespace-nowrap">
                      {q.group ? q.group : <span className="text-[#8A9CAE]">Ungrouped</span>}
                    </td>
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
      <MoveToGroupModal
        isOpen={isMoveModalOpen}
        onClose={closeMoveModal}
        onConfirm={(group) => confirmMove(group)}
        groups={groups}
        isLoadingGroups={isLoadingGroups}
        isSubmitting={isMoving}
        error={moveError}
        selectedCount={0}
        matchingCount={questions.length}
        allowSelected={false}
      />

      <PassageManagerModal
        isOpen={passageState.isManagerOpen}
        view={passageState.managerView}
        passages={passageState.passages}
        isLoadingPassages={passageState.isLoadingPassages}
        passagesError={passageState.passagesError}
        subjects={passageSubjects}
        isLoadingSubjects={!profile}
        classOptions={classes}
        editingPassage={passageState.editingPassage}
        passageFormData={passageState.passageFormData}
        passageFormError={passageState.passageFormError}
        isSavingPassage={passageState.isSavingPassage}
        onFormChange={passageState.handlePassageFormChange}
        onFormSubmit={passageState.submitPassageForm}
        onStartCreate={passageState.startCreatePassage}
        onStartEdit={passageState.startEditPassage}
        onCancelForm={passageState.cancelPassageForm}
        pendingDeletePassage={passageState.pendingDeletePassage}
        isDeletingPassage={passageState.isDeletingPassage}
        deletePassageError={passageState.deletePassageError}
        deleteBlockedByQuestions={passageState.deleteBlockedByQuestions}
        onRequestDelete={passageState.requestDeletePassage}
        onCancelDelete={passageState.cancelDeletePassage}
        onConfirmDelete={passageState.confirmDeletePassage}
        onClose={passageState.closePassageManager}
      />

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

    <BulkDeleteQuestionsModal
      isOpen={isBulkDeleteModalOpen}
      selectedCount={selectedCount}
      isProcessing={isBulkDeleting}
      error={bulkDeleteError}
      blocked={bulkDeleteBlocked}
      onConfirm={() => runBulkDelete(false)}
      onForceConfirm={() => runBulkDelete(true)}
      onCancel={closeBulkDeleteModal}
    />
    </>
  );
};

export default TeacherQuestionsPage;
