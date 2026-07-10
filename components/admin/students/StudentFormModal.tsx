import React, { useRef, useEffect } from "react";

interface Student {
  id: number;
  admissionNo: string;
  firstName: string;
  lastName: string;
  email: string;
  class: string;
  gender: "Male" | "Female" | "Other";
  dateOfBirth: string;
  phone: string;
  address: string;
  status: "active" | "inactive" | "graduated";
  enrollmentDate: string;
}

type RequiredField = "firstName" | "lastName" | "admissionNo" | "class";
type FieldErrors = Partial<Record<RequiredField, string>>;

interface StudentFormModalProps {
  isOpen: boolean;
  isEditing: boolean;
  formData: Partial<Student>;
  fieldErrors: FieldErrors;
  isSubmitting: boolean;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

const StudentFormModal: React.FC<StudentFormModalProps> = ({
  isOpen,
  isEditing,
  formData,
  fieldErrors,
  isSubmitting,
  onChange,
  onSubmit,
  onCancel,
}) => {
  const firstInputRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const admissionNoRef = useRef<HTMLInputElement>(null);
  const classRef = useRef<HTMLSelectElement>(null);

  const errorId = (field: RequiredField) => `${field}-error`;
  const describedBy = (field: RequiredField) => (fieldErrors[field] ? errorId(field) : undefined);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => firstInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onCancel();
      }}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#B8D0E8]">
        <div className="bg-[#1A3A5C] px-6 py-4 rounded-t-2xl sticky top-0 z-10">
          <h2 id="modal-title" className="text-xl font-bold text-white">
            {isEditing ? "Edit Student" : "Add New Student"}
          </h2>
        </div>

        <form onSubmit={onSubmit} noValidate className="p-6">
          <fieldset className="border-0 p-0 m-0">
            <legend className="text-sm font-semibold text-[#1A3A5C] mb-3">
              Personal Information
            </legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-[#1A3A5C] mb-1">
                  First Name{" "}
                  <span className="text-red-500" aria-hidden="true">
                    *
                  </span>
                </label>
                <input
                  ref={firstInputRef}
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName || ""}
                  onChange={onChange}
                  aria-required="true"
                  aria-invalid={!!fieldErrors.firstName}
                  aria-describedby={describedBy("firstName")}
                  className="w-full px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-[#F8FAFE]"
                />
                {fieldErrors.firstName && (
                  <p id={errorId("firstName")} className="mt-1 text-sm text-red-600">
                    {fieldErrors.firstName}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-[#1A3A5C] mb-1">
                  Last Name{" "}
                  <span className="text-red-500" aria-hidden="true">
                    *
                  </span>
                </label>
                <input
                  ref={lastNameRef}
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName || ""}
                  onChange={onChange}
                  aria-required="true"
                  aria-invalid={!!fieldErrors.lastName}
                  aria-describedby={describedBy("lastName")}
                  className="w-full px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-[#F8FAFE]"
                />
                {fieldErrors.lastName && (
                  <p id={errorId("lastName")} className="mt-1 text-sm text-red-600">
                    {fieldErrors.lastName}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="admissionNo"
                  className="block text-sm font-medium text-[#1A3A5C] mb-1">
                  Admission Number{" "}
                  <span className="text-red-500" aria-hidden="true">
                    *
                  </span>
                </label>
                <input
                  ref={admissionNoRef}
                  type="text"
                  id="admissionNo"
                  name="admissionNo"
                  value={formData.admissionNo || ""}
                  onChange={onChange}
                  aria-required="true"
                  aria-invalid={!!fieldErrors.admissionNo}
                  aria-describedby={
                    fieldErrors.admissionNo ? errorId("admissionNo") : "admissionNo-hint"
                  }
                  disabled={isEditing}
                  className="w-full px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-[#F8FAFE] disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <p id="admissionNo-hint" className="text-xs text-[#8A9CAE] mt-1">
                  {isEditing
                    ? "Cannot be changed after creation."
                    : "Auto-generated admission number."}
                </p>
                {fieldErrors.admissionNo && (
                  <p id={errorId("admissionNo")} className="mt-1 text-sm text-red-600">
                    {fieldErrors.admissionNo}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#1A3A5C] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email || ""}
                  onChange={onChange}
                  className="w-full px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-[#F8FAFE]"
                />
              </div>
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-[#1A3A5C] mb-1">
                  Gender
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender || "Male"}
                  onChange={onChange}
                  className="w-full px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] bg-[#F8FAFE]">
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="dateOfBirth"
                  className="block text-sm font-medium text-[#1A3A5C] mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  value={formData.dateOfBirth || ""}
                  onChange={onChange}
                  className="w-full px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-[#F8FAFE]"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-[#1A3A5C] mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone || ""}
                  onChange={onChange}
                  className="w-full px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-[#F8FAFE]"
                />
              </div>
            </div>
          </fieldset>

          <fieldset className="border-0 p-0 m-0 mt-6 pt-6 border-t border-[#E8EEF5]">
            <legend className="text-sm font-semibold text-[#1A3A5C] mb-3">
              Enrollment Details
            </legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="class" className="block text-sm font-medium text-[#1A3A5C] mb-1">
                  Class{" "}
                  <span className="text-red-500" aria-hidden="true">
                    *
                  </span>
                </label>
                <select
                  ref={classRef}
                  id="class"
                  name="class"
                  value={formData.class || ""}
                  onChange={onChange}
                  aria-required="true"
                  aria-invalid={!!fieldErrors.class}
                  aria-describedby={describedBy("class")}
                  className="w-full px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] bg-[#F8FAFE]">
                  <option value="">Select Class</option>
                  <option value="JSS1">JSS1</option>
                  <option value="JSS2">JSS2</option>
                  <option value="JSS3">JSS3</option>
                </select>
                {fieldErrors.class && (
                  <p id={errorId("class")} className="mt-1 text-sm text-red-600">
                    {fieldErrors.class}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-[#1A3A5C] mb-1">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status || "active"}
                  onChange={onChange}
                  className="w-full px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] bg-[#F8FAFE]">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="graduated">Graduated</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="enrollmentDate"
                  className="block text-sm font-medium text-[#1A3A5C] mb-1">
                  Enrollment Date
                </label>
                <input
                  type="date"
                  id="enrollmentDate"
                  name="enrollmentDate"
                  value={formData.enrollmentDate || ""}
                  onChange={onChange}
                  className="w-full px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-[#F8FAFE]"
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-[#1A3A5C] mb-1">
                  Address
                </label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address || ""}
                  onChange={onChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-[#F8FAFE] resize-y"
                />
              </div>
            </div>
          </fieldset>

          <div className="flex gap-3 mt-6 pt-4 border-t border-[#E8EEF5]">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 bg-[#E8EEF5] hover:bg-[#D5DFE8] text-[#1A3A5C] font-medium py-2.5 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/30 disabled:opacity-50">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-[#1A3A5C] hover:bg-[#14304D] text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/50 active:scale-[0.98] disabled:opacity-50"
              aria-label={
                isSubmitting
                  ? "Saving student, please wait"
                  : isEditing
                    ? "Update student"
                    : "Add student"
              }>
              {isSubmitting ? "Saving..." : isEditing ? "Update Student" : "Add Student"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentFormModal;
