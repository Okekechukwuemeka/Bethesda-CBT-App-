import React from "react";

interface ScoreBarProps {
  score: number;
}

const ScoreBar: React.FC<ScoreBarProps> = ({ score }) => {
  const getBarColor = (score: number) => {
    if (score >= 70) return "bg-green-500";
    if (score >= 60) return "bg-blue-500";
    if (score >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="mt-2 w-full bg-[#E8EEF5] rounded-full h-2" aria-hidden="true">
      <div
        className={`h-2 rounded-full transition-all ${getBarColor(score)}`}
        style={{ width: `${score}%` }}
      />
    </div>
  );
};

export default ScoreBar;
