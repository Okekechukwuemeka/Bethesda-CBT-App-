import React from "react";
import type { ResultStatus } from "@/types/admin-results";

interface StatusBadgeProps {
  status: ResultStatus;
}

const colors: Record<ResultStatus, string> = {
  completed: "bg-green-100 text-green-800",
  "in-progress": "bg-amber-100 text-amber-800",
  pending: "bg-gray-100 text-gray-700",
};

const labels: Record<ResultStatus, string> = {
  completed: "Completed",
  "in-progress": "In Progress",
  pending: "Pending",
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => (
  <span className={`text-xs px-2 py-1 rounded-full font-medium ${colors[status]}`}>
    {labels[status]}
  </span>
);

export default StatusBadge;
