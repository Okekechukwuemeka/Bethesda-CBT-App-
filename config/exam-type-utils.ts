export const getExamTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    objective: "Objective",
    theory: "Theory",
    mixed: "Mixed",
  };
  return labels[type] || type;
};

export const getExamTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
    objective: "bg-blue-100 text-blue-800",
    theory: "bg-purple-100 text-purple-800",
    mixed: "bg-green-100 text-green-800",
  };
  return colors[type] || "bg-gray-100 text-gray-800";
};
