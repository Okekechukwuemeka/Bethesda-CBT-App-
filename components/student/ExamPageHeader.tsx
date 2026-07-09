import React from "react";

interface ExamPageHeaderProps {
  examCount: number;
}

const ExamPageHeader: React.FC<ExamPageHeaderProps> = ({ examCount }) => {
  return (
    <header className="bg-[#1A3A5C] rounded-t-2xl px-6 py-6 text-center">
      <h1 className="text-3xl font-bold text-white tracking-wide">JSS3 Available Examinations</h1>
      <div className="w-16 h-1 bg-[#5B9BD5] mx-auto mt-3 rounded-full" aria-hidden="true" />
      <p className="text-white/70 text-sm mt-3">
        {examCount} examinations available. Select an examination to begin.
      </p>
    </header>
  );
};

export default ExamPageHeader;
