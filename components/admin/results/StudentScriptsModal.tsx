import React from "react";
import Modal from "@/components/ui/Modal";
import type { StudentScript, SubjectResult } from "@/types/admin-results";
import StudentScriptRow from "./StudentScriptRow";

interface StudentScriptsModalProps {
  isOpen: boolean;
  subject: SubjectResult | null;
  students: StudentScript[] | undefined;
  isLoading: boolean;
  onClose: () => void;
  onDownloadScript: (student: StudentScript) => void;
  onDownloadAll: () => void;
}

const StudentScriptsModal: React.FC<StudentScriptsModalProps> = ({
  isOpen,
  subject,
  students,
  isLoading,
  onClose,
  onDownloadScript,
  onDownloadAll,
}) => {
  const showScriptDownload = subject ? subject.examType !== "objective" : false;

  // One-line summary so the state of the whole class is clear at a glance
  // (and is read out as a single sentence by a screen reader).
  const count = (status: StudentScript["status"]) =>
    (students ?? []).filter((s) => s.status === status).length;
  const summary = students
    ? `${students.length} student${students.length !== 1 ? "s" : ""}: ${count("marked")} marked, ${count("pending")} awaiting marking, ${count("in-progress")} still writing, ${count("not-started")} did not take the exam.`
    : "";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="4xl"
      title={subject ? `${subject.subject} — Students` : "Students"}>
      {isLoading ? (
        <p role="status" aria-live="polite" className="text-[#5A7A9A] text-center py-8">
          Loading students…
        </p>
      ) : students && students.length > 0 ? (
        <div className="space-y-4">
          <p className="text-sm text-[#4A6A8A]">
            {subject?.examTitle ? <strong className="text-[#1A3A5C]">{subject.examTitle}. </strong> : null}
            {summary}
          </p>
          {showScriptDownload && (
            <button
              type="button"
              onClick={onDownloadAll}
              className="w-full sm:w-auto text-sm bg-purple-600 hover:bg-purple-700 text-white font-medium px-5 py-2.5 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-purple-500">
              Download All Scripts (PDF)
            </button>
          )}
          {/* The dialog itself scrolls, so the list isn't boxed into a second,
              nested scroll area. */}
          <ul className="space-y-3">
            {students.map((student) => (
              <StudentScriptRow
                key={student.id}
                student={student}
                showScriptDownload={showScriptDownload}
                onDownloadScript={() => onDownloadScript(student)}
              />
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-[#5A7A9A] text-center py-8">No students in this class.</p>
      )}
      <div className="mt-6 flex justify-end border-t border-[#E8EEF5] pt-4">
        <button
          type="button"
          onClick={onClose}
          className="bg-[#E8EEF5] hover:bg-[#D5DFE8] text-[#1A3A5C] font-medium px-6 py-2.5 rounded-lg transition focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/30">
          Close
        </button>
      </div>
    </Modal>
  );
};

export default StudentScriptsModal;
