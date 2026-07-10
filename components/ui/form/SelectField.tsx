import React, { forwardRef } from "react";

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  error?: boolean;
}

const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ options, error, className = "", ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] bg-[#F8FAFE] text-[#1A1A1A] ${
          error ? "border-red-300" : "border-[#C5D8EC]"
        } ${className}`}
        {...props}>
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
    );
  },
);

SelectField.displayName = "SelectField";

export default SelectField;
