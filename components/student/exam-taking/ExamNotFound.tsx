import React from "react";

const ExamNotFound: React.FC<{ message?: string }> = ({ message }) => (
  <div className="min-h-screen bg-[#E8F0FE] flex items-center justify-center px-4">
    <div className="bg-white rounded-2xl shadow-2xl border border-[#B8D0E8] max-w-md w-full p-8 text-center">
      <p className="text-red-800 bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        {message || "This exam is not available."}
      </p>

      <a
        href="/student/exams"
        className="inline-block bg-[#1A3A5C] hover:bg-[#14304D] text-white font-medium py-2.5 px-6 rounded-lg transition duration-200">
        Back to Examinations
      </a>
    </div>
  </div>
);

export default ExamNotFound;
