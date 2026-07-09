import React, { useEffect, useRef } from "react";

const ExamNotFound: React.FC = () => {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="min-h-screen bg-[#E8F0FE] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full border border-[#B8D0E8] text-center">
        <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-bold text-[#1A3A5C] mb-4">
          Exam Not Found
        </h1>
        <p className="text-[#5A7A9A] mb-6">The examination you are looking for does not exist.</p>
        <a
          href="/student/exams"
          className="inline-block bg-[#1A3A5C] hover:bg-[#14304D] text-white font-medium px-6 py-2 rounded-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/50">
          Return to Exams
        </a>
      </div>
    </div>
  );
};

export default ExamNotFound;
