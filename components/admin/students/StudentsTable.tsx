import React from "react";
import StudentStatusBadge from "./StudentStatusBadge";

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

interface StudentsTableProps {
  students: Student[];
  onEdit: (student: Student, e: React.MouseEvent<HTMLButtonElement>) => void;
  onDelete: (student: Student, e: React.MouseEvent<HTMLButtonElement>) => void;
}

const StudentsTable: React.FC<StudentsTableProps> = ({ students, onEdit, onDelete }) => {
  if (students.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#C5D8EC] overflow-hidden shadow-sm">
        <table className="w-full">
          <caption className="sr-only">Students list</caption>
          <thead className="bg-[#F8FAFE] border-b border-[#E8EEF5]">
            <tr>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">
                Admission No.
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">
                Name
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">
                Class
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">
                Gender
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">
                Status
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={6} className="px-4 py-12 text-center text-[#8A9CAE]">
                <div className="text-4xl mb-2" aria-hidden="true">
                  📚
                </div>
                <p className="font-medium">No students found</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[#C5D8EC] overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <caption className="sr-only">Students list</caption>
          <thead className="bg-[#F8FAFE] border-b border-[#E8EEF5]">
            <tr>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">
                Admission No.
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">
                Name
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">
                Class
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">
                Gender
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">
                Status
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8EEF5]">
            {students.map((student) => (
              <tr key={student.id} className="hover:bg-[#F8FAFE] transition">
                <td className="px-4 py-3 text-sm font-medium text-[#1A3A5C]">
                  {student.admissionNo}
                </td>
                <td className="px-4 py-3 text-sm text-[#4A6A8A]">
                  {student.firstName} {student.lastName}
                </td>
                <td className="px-4 py-3 text-sm text-[#4A6A8A]">{student.class}</td>
                <td className="px-4 py-3 text-sm text-[#4A6A8A]">{student.gender}</td>
                <td className="px-4 py-3">
                  <StudentStatusBadge status={student.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => onEdit(student, e)}
                      className="text-[#2B6CB0] hover:text-[#1A3A5C] p-1 rounded focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]"
                      aria-label={`Edit ${student.firstName} ${student.lastName}`}>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => onDelete(student, e)}
                      className="text-red-600 hover:text-red-800 p-1 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                      aria-label={`Delete ${student.firstName} ${student.lastName}`}>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true">
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentsTable;
1;
