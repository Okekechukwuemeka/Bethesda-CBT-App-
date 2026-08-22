"use client";

import React, { useEffect, useRef } from "react";
import { useStaffStore } from "@/store/useStaffStore";
import StaffTable from "@/components/admin/staff/StaffTable";
import StaffFormModal from "@/components/admin/staff/StaffFormModal";
import DeleteStaffModal from "@/components/admin/staff/DeleteStaffModal";
import StaffCreatedModal from "@/components/admin/staff/StaffCreatedModal";
import BulkDeleteStaffModal from "@/components/admin/staff/BulkDeleteStaffModal";
import SelectField from "@/components/ui/form/SelectField";
import TextField from "@/components/ui/form/TextField";

const ROLE_FILTER_OPTIONS = [
  { value: "all", label: "All Roles" },
  { value: "teacher", label: "Teacher" },
  { value: "non_teaching", label: "Non-teaching" },
];
const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const StaffPage: React.FC = () => {
  const {
    isLoading,
    statusMessage,
    searchTerm,
    filterRole,
    filterStatus,
    isModalOpen,
    isDeleteModalOpen,
    isCreatedModalOpen,
    fetchStaff,
    setSearchTerm,
    setFilterRole,
    setFilterStatus,
    filteredStaff,
    openAddModal,
    openEditModal,
    openDeleteModal,
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    isBulkDeleteModalOpen,
    requestBulkDelete,
  } = useStaffStore();

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const formTriggerRef = useRef<HTMLElement | null>(null);

  const anyModalOpen = isModalOpen || isDeleteModalOpen || isCreatedModalOpen || isBulkDeleteModalOpen;
  const staff = filteredStaff();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" role="status" aria-live="polite">
        <div className="text-center">
          <div
            className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#1A3A5C] border-t-transparent"
            aria-hidden="true"
          />
          <p className="mt-4 text-[#4A6A8A]">Loading staff…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6" inert={anyModalOpen ? true : false}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1A3A5C]">Staff</h1>
            <p className="text-[#5A7A9A] text-sm">Manage staff profiles and login access</p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              formTriggerRef.current = e.currentTarget;
              openAddModal();
            }}
            className="bg-[#1A3A5C] hover:bg-[#14304D] text-white font-medium px-4 py-2 rounded-lg transition duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/50 flex items-center gap-2 w-fit"
            aria-label="Add new staff member">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Staff Member
          </button>
        </div>

        {statusMessage && (
          <div
            role={statusMessage.type === "error" ? "alert" : "status"}
            aria-live={statusMessage.type === "error" ? "assertive" : "polite"}
            className={`p-4 rounded-lg text-sm font-medium ${statusMessage.type === "success" ? "bg-green-100 text-green-800 border border-green-300" : statusMessage.type === "warning" ? "bg-yellow-100 text-yellow-800 border border-yellow-300" : "bg-red-100 text-red-800 border border-red-300"}`}>
            {statusMessage.text}
          </div>
        )}

        <div className="bg-white rounded-xl border border-[#C5D8EC] p-4 flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label htmlFor="staff-search" className="sr-only">
              Search staff
            </label>
            <TextField
              id="staff-search"
              placeholder="Search by name, username, or staff ID…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-48">
            <label htmlFor="role-filter" className="sr-only">
              Filter by role
            </label>
            <SelectField
              id="role-filter"
              options={ROLE_FILTER_OPTIONS}
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-48">
            <label htmlFor="status-filter" className="sr-only">
              Filter by status
            </label>
            <SelectField
              id="status-filter"
              options={STATUS_FILTER_OPTIONS}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            />
          </div>
        </div>

        <p className="text-sm text-[#5A7A9A]" role="status" aria-live="polite">
          Showing {staff.length} staff member{staff.length === 1 ? "" : "s"}
        </p>

        {selectedIds.size > 0 && (
          <div className="bg-[#1A3A5C] text-white rounded-xl px-4 py-3 flex items-center justify-between">
            <p className="text-sm font-medium">
              {selectedIds.size} staff member{selectedIds.size !== 1 ? "s" : ""} selected
            </p>
            <button
              type="button"
              onClick={requestBulkDelete}
              className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-red-500/50">
              Delete Selected
            </button>
          </div>
        )}

        <StaffTable
          staff={staff}
          onEdit={(s) => {
            openEditModal(s);
          }}
          onDelete={(s) => {
            openDeleteModal(s);
          }}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
        />
      </div>

      <StaffFormModal />
      <DeleteStaffModal />
      <StaffCreatedModal />
      <BulkDeleteStaffModal />
    </>
  );
};

export default StaffPage;
