import React from "react";

interface FieldsetProps {
  legend: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const Fieldset: React.FC<FieldsetProps> = ({ legend, children, className = "" }) => {
  return (
    <fieldset className={`space-y-6 pt-2 border-t border-[#E8EEF5] ${className}`}>
      <legend className="text-base font-semibold text-[#1A3A5C] mb-4 pt-4">{legend}</legend>
      {children}
    </fieldset>
  );
};

export default Fieldset;
