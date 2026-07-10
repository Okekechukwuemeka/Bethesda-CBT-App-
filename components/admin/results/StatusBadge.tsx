import React from "react";

interface StatusBadgeProps {
  status: string;
}

const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "in-progress":
      return "bg-blue-100 text-blue-800";
    case "marked":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  return (
    <span
      className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${getStatusBadgeColor(status)}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
