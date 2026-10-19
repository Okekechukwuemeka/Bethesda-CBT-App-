import React from "react";
import type { ExaminationStatus, PaperStatus } from "@/types/student-profile";

// Status is always spelled out in words (never colour alone), which also keeps
// it clear for screen reader users and colour-blind users.

const examinationStyles: Record<ExaminationStatus, { label: string; className: string }> = {
  completed: { label: "Completed", className: "bg-green-100 text-green-800" },
  "partially-marked": { label: "Partially marked", className: "bg-orange-100 text-orange-800" },
  "awaiting-marking": { label: "Awaiting marking", className: "bg-amber-100 text-amber-800" },
  "in-progress": { label: "In progress", className: "bg-blue-100 text-blue-800" },
};

const paperStyles: Record<PaperStatus, { label: string; className: string }> = {
  marked: { label: "Marked", className: "bg-green-100 text-green-800" },
  "awaiting-marking": { label: "Awaiting marking", className: "bg-amber-100 text-amber-800" },
  "in-progress": { label: "In progress", className: "bg-blue-100 text-blue-800" },
};

const pill = "inline-block text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap";

export const ExaminationStatusBadge: React.FC<{ status: ExaminationStatus }> = ({ status }) => (
  <span className={`${pill} ${examinationStyles[status].className}`}>
    {examinationStyles[status].label}
  </span>
);

export const PaperStatusBadge: React.FC<{ status: PaperStatus }> = ({ status }) => (
  <span className={`${pill} ${paperStyles[status].className}`}>{paperStyles[status].label}</span>
);

export const UpcomingStatusBadge: React.FC<{ status: "Scheduled" | "Ongoing" }> = ({ status }) => (
  <span
    className={`${pill} ${status === "Ongoing" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`}>
    {status}
  </span>
);
