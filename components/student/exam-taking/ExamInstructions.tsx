import React from "react";

const ExamInstructions: React.FC<{ instructions?: string }> = ({ instructions }) => {
  if (!instructions) return null;
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-[#1A3A5C] mb-2">Instructions</h2>
      <div className="bg-[#F8FAFE] border border-[#C5D8EC] rounded-lg p-4 text-[#4A6A8A] whitespace-pre-wrap">
        {instructions}
      </div>
    </div>
  );
};

export default ExamInstructions;
