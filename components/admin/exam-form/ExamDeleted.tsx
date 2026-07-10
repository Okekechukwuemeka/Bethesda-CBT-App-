import React from "react";
import { useRouter } from "next/navigation";

interface ExamDeletedProps {
  examTitle: string;
}

const ExamDeleted: React.FC<ExamDeletedProps> = ({ examTitle }) => {
  const router = useRouter();

  return (
    <div className="max-w-md mx-auto text-center py-16 space-y-4">
      <h1 className="text-xl font-bold text-[#1A3A5C]">Exam Deleted</h1>
      <p className="text-[#5A7A9A]">
        &ldquo;{examTitle}&rdquo; and all associated questions and results have been permanently
        deleted.
      </p>
      <button
        type="button"
        onClick={() => router.push("/admin/exams")}
        className="inline-block bg-[#1A3A5C] hover:bg-[#14304D] text-white font-medium px-6 py-2.5 rounded-lg transition focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/50">
        Return to Exams List
      </button>
    </div>
  );
};

export default ExamDeleted;
