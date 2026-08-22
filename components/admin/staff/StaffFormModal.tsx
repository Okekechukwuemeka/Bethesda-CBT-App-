"use client";

import React from "react";
import Modal from "@/components/ui/Modal";
import TextField from "@/components/ui/form/TextField";
import SelectField from "@/components/ui/form/SelectField";
import CheckboxField from "@/components/ui/form/CheckboxField";
import { useStaffStore } from "@/store/useStaffStore";

const ROLE_OPTIONS = [
  { value: "teacher", label: "Teacher" },
  { value: "non_teaching", label: "Non-teaching Staff" },
];
const GENDER_OPTIONS = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Other" },
];

const StaffFormModal: React.FC = () => {
  const {
    isModalOpen,
    isEditing,
    formData,
    fieldErrors,
    isSubmitting,
    handleInputChange,
    submitForm,
    closeFormModal,
  } = useStaffStore();

  return (
    <Modal
      isOpen={isModalOpen}
      onClose={closeFormModal}
      title={isEditing ? "Edit Staff Member" : "Add Staff Member"}
      disableClose={isSubmitting}>
      <form onSubmit={submitForm} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-[#1A3A5C] mb-1">
              First Name
            </label>
            <TextField
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              error={!!fieldErrors.firstName}
              disabled={isSubmitting}
            />
            {fieldErrors.firstName && (
              <p className="text-red-600 text-xs mt-1">{fieldErrors.firstName}</p>
            )}
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-[#1A3A5C] mb-1">
              Last Name
            </label>
            <TextField
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              error={!!fieldErrors.lastName}
              disabled={isSubmitting}
            />
            {fieldErrors.lastName && (
              <p className="text-red-600 text-xs mt-1">{fieldErrors.lastName}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="username" className="block text-sm font-medium text-[#1A3A5C] mb-1">
            Username{" "}
            {isEditing && <span className="text-[#8AA5BE] font-normal">(not editable)</span>}
          </label>
          <TextField
            id="username"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            error={!!fieldErrors.username}
            disabled={isSubmitting || isEditing}
          />
          {fieldErrors.username && (
            <p className="text-red-600 text-xs mt-1">{fieldErrors.username}</p>
          )}
          {!isEditing && (
            <p className="text-xs text-[#5A7A9A] mt-1">
              A temporary password will be generated and shown once after saving.
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-[#1A3A5C] mb-1">
              Role
            </label>
            <SelectField
              id="role"
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              options={ROLE_OPTIONS}
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-[#1A3A5C] mb-1">
              Gender
            </label>
            <SelectField
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleInputChange}
              options={GENDER_OPTIONS}
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[#1A3A5C] mb-1">
            Email
          </label>
          <TextField
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-[#1A3A5C] mb-1">
            Phone
          </label>
          <TextField
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            disabled={isSubmitting}
          />
        </div>

        {isEditing && (
          <CheckboxField
            id="isActive"
            name="isActive"
            label="Active"
            checked={formData.isActive}
            onChange={handleInputChange}
            disabled={isSubmitting}
          />
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={closeFormModal}
            disabled={isSubmitting}
            className="flex-1 bg-[#E8EEF5] hover:bg-[#D5DFE8] text-[#1A3A5C] font-medium py-2.5 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/30 disabled:opacity-50">
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-[#1A3A5C] hover:bg-[#14304D] text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/50 disabled:opacity-50">
            {isSubmitting ? "Saving…" : isEditing ? "Save Changes" : "Add Staff Member"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default StaffFormModal;
