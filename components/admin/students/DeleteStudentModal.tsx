import React, { useEffect, useRef } from "react";

interface Student {
  id: string;
  admissionNo: string;
  firstName: string;
  lastName: string;
  class: string;
  gender: "Male" | "Female" | "Other";
  dateOfBirth: string;
  address: string;
  status: "active" | "inactive" | "graduated";
  enrollmentDate: string;
}

interface DeleteStudentModalProps {
  isOpen: boolean;
  student: Student;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteStudentModal: React.FC<DeleteStudentModalProps> = ({
  isOpen,
  student,
  onConfirm,
  onCancel,
}) => {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => cancelButtonRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-[#B8D0E8]">
        <div className="bg-red-600 -mx-6 -mt-6 px-6 py-4 rounded-t-2xl">
          <h2 id="delete-title" className="text-xl font-bold text-white">
            Delete Student
          </h2>
        </div>
        <div className="mt-6">
          <p className="text-[#4A6A8A] mb-4">
            Are you sure you want to delete{" "}
            <strong>
              {student.firstName} {student.lastName}
            </strong>
            ?
          </p>
          <div className="bg-[#F8FAFE] border border-[#C5D8EC] rounded-lg p-4 mb-4">
            <p className="text-sm text-[#4A6A8A]">
              <span className="font-medium">Admission No:</span> {student.admissionNo}
            </p>
            <p className="text-sm text-[#4A6A8A]">
              <span className="font-medium">Class:</span> {student.class}
            </p>
          </div>
          <p className="text-sm text-red-600 mb-4">
            <span aria-hidden="true">⚠️ </span>
            This action cannot be undone. All data associated with this student will be permanently
            deleted.
          </p>
          <div className="flex gap-3">
            <button
              ref={cancelButtonRef}
              onClick={onCancel}
              className="flex-1 bg-[#E8EEF5] hover:bg-[#D5DFE8] text-[#1A3A5C] font-medium py-2.5 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/30">
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-red-500/50 active:scale-[0.98]">
              Yes, Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteStudentModal;
