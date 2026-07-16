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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={subject ? `${subject.subject} — Students` : "Students"}>
      {isLoading ? (
        <p role="status" aria-live="polite" className="text-[#5A7A9A] text-center py-8">
          Loading students…
        </p>
      ) : students && students.length > 0 ? (
        <div className="space-y-4">
          {showScriptDownload && (
            <button
              type="button"
              onClick={onDownloadAll}
              className="w-full text-sm bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded-lg transition">
              Download All Scripts (PDF)
            </button>
          )}
          <ul className="space-y-2 max-h-[60vh] overflow-y-auto">
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
    </Modal>
  );
};

export default StudentScriptsModal;
