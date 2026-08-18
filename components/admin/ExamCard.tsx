// ExamCard.tsx
import React from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import { Exam } from "@/types/exam.types";
import {
  getStatusBadgeColor,
  getStatusLabel,
  getTypeBadgeColor,
  getTypeLabel,
} from "@/config/admin-exam-utils";
import ExamDetail from "./ExamDetail";
import CalendarIcon from "../icons/CalendarIcon";
import ClockIcon from "../icons/ClockIcon";
import DocumentIcon from "../icons/DocumentIcon";

interface ExamCardProps {
  exam: Exam;
  onDelete: (exam: Exam) => void;
}

const ExamCard: React.FC<ExamCardProps> = ({ exam, onDelete }) => {
  const titleId = `exam-title-${exam?.id}`;

  return (
    <li
      role="listitem"
      aria-labelledby={titleId}
      className="bg-white rounded-xl border border-[#C5D8EC] p-6 shadow-sm hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div>
          <h2 id={titleId} className="font-semibold text-[#1A3A5C]">
            {exam?.title}
          </h2>
          <p className="text-sm text-[#4A6A8A]">
            {exam?.subject?.name} &bull;{" "}
            {exam.isGeneral
              ? `General${exam.classes?.length ? ` (${exam.classes.join(", ")})` : ""}`
              : exam.class}
          </p>
        </div>
        <Badge value={exam.status} getColor={getStatusBadgeColor} getLabel={getStatusLabel} />
      </div>

      <div className="mt-3 space-y-1 text-sm text-[#5A7A9A]">
        <ExamDetail
          icon={<CalendarIcon />}
          text={new Date(exam?.examDate).toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        />
        <ExamDetail icon={<ClockIcon />} text={`${exam.duration} minutes`} />
        <ExamDetail
          icon={<DocumentIcon />}
          text={
            <>
              <Badge
                value={exam?.type}
                getColor={getTypeBadgeColor}
                getLabel={getTypeLabel}
                className="text-xs px-2 py-0.5"
              />
              <span>{exam?.questionCount} questions</span>
            </>
          }
        />
      </div>

      <div className="mt-4 pt-4 border-t border-[#E8EEF5] flex gap-2">
        <Link
          href={`/admin/exams/${exam?.id}/edit`}
          aria-label={`Edit ${exam?.title}`}
          className="flex-1 text-center bg-[#E8EEF5] hover:bg-[#D5DFE8] text-[#1A3A5C] font-medium py-1.5 px-3 rounded-lg transition text-sm focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]">
          Edit
        </Link>
        <Link
          href={`/admin/exams/${exam?.id}/questions`}
          aria-label={`Manage questions for ${exam.title}`}
          className="flex-1 text-center bg-[#1A3A5C] hover:bg-[#14304D] text-white font-medium py-1.5 px-3 rounded-lg transition text-sm focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]">
          Questions
        </Link>
        <button
          type="button"
          onClick={() => onDelete(exam)}
          aria-label={`Delete ${exam?.title}`}
          className="text-center bg-red-50 hover:bg-red-100 text-red-700 font-medium py-1.5 px-3 rounded-lg transition text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
          Delete
        </button>
      </div>
    </li>
  );
};

export default ExamCard;
