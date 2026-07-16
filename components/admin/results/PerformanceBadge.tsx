import React from "react";
import type { Performance } from "@/types/admin-results";

interface PerformanceBadgeProps {
  performance: Performance;
}

const getPerformanceColor = (performance: string) => {
  switch (performance) {
    case "excellent":
      return "bg-green-100 text-green-800";
    case "good":
      return "bg-blue-100 text-blue-800";
    case "average":
      return "bg-yellow-100 text-yellow-800";
    case "poor":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getPerformanceIcon = (performance: string) => {
  const iconProps = {
    className: "w-4 h-4",
    fill: "none" as const,
    stroke: "currentColor",
    viewBox: "0 0 24 24",
    "aria-hidden": true as const,
    focusable: "false" as const,
  };

  switch (performance) {
    case "excellent":
      return (
        <svg {...iconProps}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    case "good":
      return (
        <svg {...iconProps}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      );
    case "average":
      return (
        <svg {...iconProps}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    case "poor":
      return (
        <svg {...iconProps}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    default:
      return null;
  }
};

const PerformanceBadge: React.FC<PerformanceBadgeProps> = ({ performance }) => {
  return (
    <div
      className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getPerformanceColor(performance)}`}>
      {getPerformanceIcon(performance)}
      <span className="capitalize">{performance}</span>
    </div>
  );
};

export default PerformanceBadge;
