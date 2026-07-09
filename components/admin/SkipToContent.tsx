import React from "react";

const SkipToContent: React.FC = () => {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:text-[#1A3A5C] focus:p-4 focus:rounded-lg focus:shadow-lg focus:ring-2 focus:ring-[#2B6CB0]">
      Skip to main content
    </a>
  );
};

export default SkipToContent;
