import React from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import { Exam } from "@/types/exam";
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
}

const ExamCard: React.FC<ExamCardProps> = ({ exam }) => {
  const titleId = `exam-title-${exam.id}`;

  return (
    <li
      role="listitem"
      aria-labelledby={titleId}
      className="bg-white rounded-xl border border-[#C5D8EC] p-6 shadow-sm hover:shadow-md transition">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 id={titleId} className="font-semibold text-[#1A3A5C]">
            {exam.title}
          </h2>
          <p className="text-sm text-[#4A6A8A]">
            {exam.subject} &bull; {exam.class}
          </p>
        </div>
        <Badge value={exam.status} getColor={getStatusBadgeColor} getLabel={getStatusLabel} />
      </div>

      {/* Details */}
      <div className="mt-3 space-y-1 text-sm text-[#5A7A9A]">
        <ExamDetail icon={<CalendarIcon />} text={`${exam.date} at ${exam.time}`} />
        <ExamDetail icon={<ClockIcon />} text={`${exam.duration} minutes`} />
        <ExamDetail
          icon={<DocumentIcon />}
          text={
            <>
              <Badge
                value={exam.type}
                getColor={getTypeBadgeColor}
                getLabel={getTypeLabel}
                className="text-xs px-2 py-0.5"
              />
              <span>{exam.questionCount} questions</span>
            </>
          }
        />
      </div>

      {/* Actions */}
      <div className="mt-4 pt-4 border-t border-[#E8EEF5] flex gap-2">
        <Link
          href={`/admin/exams/${exam.id}/edit`}
          aria-label={`Edit ${exam.title}`}
          className="flex-1 text-center bg-[#E8EEF5] hover:bg-[#D5DFE8] text-[#1A3A5C] font-medium py-1.5 px-3 rounded-lg transition text-sm focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]">
          Edit
        </Link>
        <Link
          href={`/admin/exams/${exam.id}/questions`}
          aria-label={`Manage questions for ${exam.title}`}
          className="flex-1 text-center bg-[#1A3A5C] hover:bg-[#14304D] text-white font-medium py-1.5 px-3 rounded-lg transition text-sm focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]">
          Questions
        </Link>
      </div>
    </li>
  );
};

export default ExamCard;
