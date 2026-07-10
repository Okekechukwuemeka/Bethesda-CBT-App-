import React from "react";

interface CheckboxFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const CheckboxField: React.FC<CheckboxFieldProps> = ({ label, id, className = "", ...props }) => {
  return (
    <div className="flex items-center">
      <label htmlFor={id} className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          id={id}
          className="w-4 h-4 text-[#1A3A5C] focus:ring-2 focus:ring-[#2B6CB0] rounded"
          {...props}
        />
        <span className="text-sm text-[#1A3A5C] font-medium">{label}</span>
      </label>
    </div>
  );
};

export default CheckboxField;
