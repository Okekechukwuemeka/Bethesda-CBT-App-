import React from "react";

interface StatusMessageProps {
  type: "success" | "error" | "warning";
  text: string;
}

const statusStyles = {
  success: "bg-green-100 text-green-800 border border-green-300",
  error: "bg-red-100 text-red-800 border border-red-300",
  warning: "bg-yellow-100 text-yellow-800 border border-yellow-300",
};

const StatusMessage: React.FC<StatusMessageProps> = ({ type, text }) => {
  return (
    <div
      id="status-message"
      role={type === "error" ? "alert" : "status"}
      aria-live={type === "error" ? "assertive" : "polite"}
      className={`mb-4 p-3 rounded-lg text-sm font-medium ${statusStyles[type]}`}>
      {text}
    </div>
  );
};

export default StatusMessage;
