import React from "react";

const LoadingExamState: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-[60vh]" role="status" aria-live="polite">
      <div className="text-center">
        <div
          className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#1A3A5C] border-t-transparent"
          aria-hidden="true"
        />
        <p className="mt-4 text-[#4A6A8A]">Loading exam details...</p>
      </div>
    </div>
  );
};

export default LoadingExamState;
