import React from "react";

interface TimerProps {
  timeRemaining: number;
  isExamStarted: boolean;
  onStartExam: () => void;
  answeredCount: number;
  totalQuestions: number;
}

const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

const Timer: React.FC<TimerProps> = ({
  timeRemaining,
  isExamStarted,
  onStartExam,
  answeredCount,
  totalQuestions,
}) => {
  return (
    <div className="bg-white border-x border-[#B8D0E8] px-6 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-[#1A3A5C]">Timer:</span>
        <span
          className={`text-xl font-bold font-mono ${
            timeRemaining < 300 ? "text-red-600 animate-pulse" : "text-[#1A3A5C]"
          }`}
          aria-hidden="true">
          {formatTime(timeRemaining)}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-[#4A6A8A]">
          {answeredCount} / {totalQuestions} answered
        </span>
        {!isExamStarted && (
          <button
            onClick={onStartExam}
            className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-1.5 rounded-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-green-500/50">
            Start Exam
          </button>
        )}
      </div>
    </div>
  );
};

export default Timer;
