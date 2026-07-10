"use client";

import React from "react";
import { useModalFocusTrap } from "@/hooks/useModalFocusTrap";
import StudentFilters from "@/components/admin/students/StudentFilters";
import StudentsTable from "@/components/admin/students/StudentsTable";
import Pagination from "@/components/admin/students/Pagination";
import StudentFormModal from "@/components/admin/students/StudentFormModal";
import DeleteStudentModal from "@/components/admin/students/DeleteStudentModal";
import BulkImportModal from "@/components/admin/students/BulkImportModal";
import { useStudents } from "@/hooks/useStudents";

const StudentsPage: React.FC = () => {
  const {
    isLoading,
    isModalOpen,
    isDeleteModalOpen,
    isImportModalOpen,
    selectedStudent,
    statusMessage,
    fieldErrors,
    searchTerm,
    filterClass,
    filterStatus,
    currentPage,
    itemsPerPage,
    isSubmitting,
    isEditing,
    formData,
    formTriggerRef,
    deleteTriggerRef,
    importTriggerRef,
    filteredStudents,
    totalPages,
    currentStudents,
    setSearchTerm,
    setFilterClass,
    setFilterStatus,
    setCurrentPage,
    handleInputChange,
    handleAddStudent,
    handleEditStudent,
    handleDeleteStudent,
    handleSubmit,
    closeFormModal,
    closeDeleteModal,
    closeImportModal,
    confirmDelete,
    handleOpenImportModal,
    handleFileUpload,
    confirmImport,
    downloadTemplate,
    importPreview,
    selectedFileName,
    isImporting,
  } = useStudents();

  const formModalRef = React.useRef<HTMLDivElement>(null);
  const deleteModalRef = React.useRef<HTMLDivElement>(null);
  const importModalRef = React.useRef<HTMLDivElement>(null);

  useModalFocusTrap(isModalOpen, formModalRef, formTriggerRef, closeFormModal, !isSubmitting);
  useModalFocusTrap(isDeleteModalOpen, deleteModalRef, deleteTriggerRef, closeDeleteModal, true);
  useModalFocusTrap(
    isImportModalOpen,
    importModalRef,
    importTriggerRef,
    closeImportModal,
    !isImporting,
  );

  const anyModalOpen = isModalOpen || isDeleteModalOpen || isImportModalOpen;

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center min-h-[60vh]"
        role="status"
        aria-live="polite">
        <div className="text-center">
          <div
            className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#1A3A5C] border-t-transparent"
            aria-hidden="true"
          />
          <p className="mt-4 text-[#4A6A8A]">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6" inert={anyModalOpen ? true : false}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1A3A5C]">Students</h1>
            <p className="text-[#5A7A9A] text-sm">Manage all student records</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleOpenImportModal}
              className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg transition duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-green-500/50 flex items-center gap-2"
              aria-label="Import students in bulk">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true">
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
              onClick={handleAddStudent}
              className="bg-[#1A3A5C] hover:bg-[#14304D] text-white font-medium px-4 py-2 rounded-lg transition duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/50 flex items-center gap-2"
              aria-label="Add new student">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Student
            </button>
          </div>
        </div>

        {statusMessage && (
          <div
            role={statusMessage.type === "error" ? "alert" : "status"}
            aria-live={statusMessage.type === "error" ? "assertive" : "polite"}
            className={`p-4 rounded-lg text-sm font-medium ${statusMessage.type === "success" ? "bg-green-100 text-green-800 border border-green-300" : statusMessage.type === "warning" ? "bg-yellow-100 text-yellow-800 border border-yellow-300" : "bg-red-100 text-red-800 border border-red-300"}`}>
            {statusMessage.text}
          </div>
        )}

        <StudentFilters
          searchTerm={searchTerm}
          filterClass={filterClass}
          filterStatus={filterStatus}
          filteredCount={filteredStudents.length}
          onSearchChange={setSearchTerm}
          onClassChange={setFilterClass}
          onStatusChange={setFilterStatus}
        />

        <StudentsTable
          students={currentStudents}
          onEdit={handleEditStudent}
          onDelete={handleDeleteStudent}
        />

        {filteredStudents.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredStudents.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      <StudentFormModal
        isOpen={isModalOpen}
        isEditing={isEditing}
        formData={formData}
        fieldErrors={fieldErrors}
        isSubmitting={isSubmitting}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
        onCancel={closeFormModal}
      />

      {selectedStudent && (
        <DeleteStudentModal
          isOpen={isDeleteModalOpen}
          student={selectedStudent}
          onConfirm={confirmDelete}
          onCancel={closeDeleteModal}
        />
      )}

      <BulkImportModal
        isOpen={isImportModalOpen}
        isImporting={isImporting}
        importPreview={importPreview}
        selectedFileName={selectedFileName}
        onFileUpload={handleFileUpload}
        onConfirmImport={confirmImport}
        onDownloadTemplate={downloadTemplate}
        onCancel={closeImportModal}
      />
    </>
  );
};

export default StudentsPage;
