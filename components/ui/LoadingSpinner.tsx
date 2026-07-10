import React from "react";

interface LoadingSpinnerProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-8 w-8 border-2",
  md: "h-12 w-12 border-4",
  lg: "h-16 w-16 border-4",
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = "Loading...", size = "md" }) => {
  return (
    <div className="flex items-center justify-center min-h-[60vh]" role="status" aria-live="polite">
      <div className="text-center">
        <div
          className={`inline-block animate-spin rounded-full ${sizeClasses[size]} border-[#1A3A5C] border-t-transparent`}
          aria-hidden="true"
        />
        <p className="mt-4 text-[#4A6A8A]">{message}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
