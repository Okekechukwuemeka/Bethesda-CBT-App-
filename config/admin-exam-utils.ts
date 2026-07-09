export const getStatusBadgeColor = (status: string): string => {
  const colors: Record<string, string> = {
    scheduled: "bg-blue-100 text-blue-800",
    ongoing: "bg-green-100 text-green-800",
    completed: "bg-gray-100 text-gray-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
};

export const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    scheduled: "Scheduled",
    ongoing: "Ongoing",
    completed: "Completed",
  };
  return labels[status] || status;
};

export const getTypeBadgeColor = (type: string): string => {
  const colors: Record<string, string> = {
    objective: "bg-blue-100 text-blue-800",
    theory: "bg-purple-100 text-purple-800",
    mixed: "bg-green-100 text-green-800",
  };
  return colors[type] || "bg-gray-100 text-gray-800";
};

export const getTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    objective: "Objective",
    theory: "Theory",
    mixed: "Mixed",
  };
  return labels[type] || type;
};
