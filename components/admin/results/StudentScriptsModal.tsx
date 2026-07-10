import React, { useState, useEffect, useRef } from "react";
import StatusBadge from "./StatusBadge";

interface StudentAnswer {
  questionNo: number;
  answer: string;
}

interface StudentScript {
  id: number;
  studentName: string;
  admissionNo: string;
  score: number;
  status: "marked" | "pending" | "in-progress";
  submittedAt: string;
  answers?: StudentAnswer[];
}

interface SubjectResult {
  id: number;
  subject: string;
  examType: "objective" | "theory" | "mixed";
  totalStudents: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  completed: number;
  status: "completed" | "pending" | "in-progress";
}

interface StatusMessage {
  type: "success" | "error" | "warning";
  text: string;
}

interface StudentScriptsModalProps {
  isOpen: boolean;
  className: string;
  subject: SubjectResult;
  students: StudentScript[];
  isLoading: boolean;
  statusMessage: StatusMessage | null;
  onClose: () => void;
  onDownloadScript: (student: StudentScript) => void;
  onDownloadAll: () => void;
}

const StudentScriptsModal: React.FC<StudentScriptsModalProps> = ({
  isOpen,
  className,
  subject,
  students,
  isLoading,
  statusMessage,
  onClose,
  onDownloadScript,
  onDownloadAll,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [announcedScriptCount, setAnnouncedScriptCount] = useState(students.length);
  const modalRef = useRef<HTMLDivElement>(null);

  const filteredScripts = students.filter(
    (s) =>
      s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.admissionNo.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  useEffect(() => {
    const timer = setTimeout(() => setAnnouncedScriptCount(filteredScripts.length), 500);
    return () => clearTimeout(timer);
  }, [filteredScripts.length]);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm("");
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
        if (e.target === e.currentTarget) onClose();
      }}>
      <div
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-[#B8D0E8]">
        <div className="bg-[#1A3A5C] px-6 py-4 rounded-t-2xl sticky top-0 z-10">
          <h2 id="modal-title" className="text-xl font-bold text-white">
            {subject.subject} - Student Scripts
          </h2>
          <p className="text-[#8BB8E8] text-sm">
            {className} &bull; {subject.examType} exam
          </p>
        </div>

        <div className="p-6">
          {statusMessage && (
            <div
              role={statusMessage.type === "error" ? "alert" : "status"}
              aria-live={statusMessage.type === "error" ? "assertive" : "polite"}
              className={`mb-4 p-4 rounded-lg text-sm font-medium ${
                statusMessage.type === "success"
                  ? "bg-green-100 text-green-800 border border-green-300"
                  : statusMessage.type === "warning"
                    ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                    : "bg-red-100 text-red-800 border border-red-300"
              }`}>
              {statusMessage.text}
            </div>
          )}

          <div className="mb-4 mt-4" role="search">
            <label htmlFor="scriptSearch" className="sr-only">
              Search students
            </label>
            <input
              id="scriptSearch"
              type="text"
              placeholder="Search by student name or admission number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-[#F8FAFE]"
            />
            <p className="sr-only" role="status" aria-live="polite">
              {announcedScriptCount} student{announcedScriptCount !== 1 ? "s" : ""} found
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <caption className="sr-only">Student scripts for {subject.subject}</caption>
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
                    Student Name
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">
                    Submitted
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8EEF5]">
                {filteredScripts.map((student) => (
                  <tr key={student.id} className="hover:bg-[#F8FAFE] transition">
                    <td className="px-4 py-3 text-sm text-[#4A6A8A]">{student.admissionNo}</td>
                    <td className="px-4 py-3 text-sm font-medium text-[#1A3A5C]">
                      {student.studentName}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={student.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-[#4A6A8A]">{student.submittedAt}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => onDownloadScript(student)}
                        aria-label={`Download script for ${student.studentName}, ${student.admissionNo}`}
                        className="text-sm bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-purple-500">
                        Download Script
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredScripts.length === 0 && (
            <div className="text-center py-8 text-[#8A9CAE]">
              <p>No students found matching your search</p>
            </div>
          )}

          <div className="flex gap-3 mt-6 pt-4 border-t border-[#E8EEF5]">
            <button
              onClick={onClose}
              className="flex-1 bg-[#E8EEF5] hover:bg-[#D5DFE8] text-[#1A3A5C] font-medium py-2.5 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/30">
              Close
            </button>
            <button
              onClick={onDownloadAll}
              disabled={isLoading}
              className="flex-1 bg-[#1A3A5C] hover:bg-[#14304D] text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/50 disabled:opacity-50"
              aria-label={
                isLoading ? "Downloading all scripts, please wait" : "Download all scripts as PDF"
              }>
              {isLoading ? "Downloading..." : "Download All Scripts (PDF)"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentScriptsModal;
