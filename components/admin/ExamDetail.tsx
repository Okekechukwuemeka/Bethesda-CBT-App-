import React from "react";

interface ExamDetailProps {
  icon: React.ReactNode;
  text: React.ReactNode;
}

const ExamDetail: React.FC<ExamDetailProps> = ({ icon, text }) => {
  return (
    <p className="flex items-center gap-2">
      <span className="w-4 h-4 flex-shrink-0">{icon}</span>
      <span className="flex items-center gap-2">{text}</span>
    </p>
  );
};

export default ExamDetail;
