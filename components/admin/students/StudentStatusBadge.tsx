import React from "react";

interface StudentStatusBadgeProps {
  status: string;
}

const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800";
    case "inactive":
      return "bg-yellow-100 text-yellow-800";
    case "graduated":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "active":
      return "Active";
    case "inactive":
      return "Inactive";
    case "graduated":
      return "Graduated";
    default:
      return status;
  }
};

const StudentStatusBadge: React.FC<StudentStatusBadgeProps> = ({ status }) => {
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusBadgeColor(status)}`}>
      {getStatusLabel(status)}
    </span>
  );
};

export default StudentStatusBadge;
