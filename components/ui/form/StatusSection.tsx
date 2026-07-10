// components/admin/exam-form/StatusSection.tsx
import React from "react";

interface StatusSectionProps {
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => void;
}

const StatusSection: React.FC<StatusSectionProps> = ({ value, onChange }) => {
  const statusOptions = [
    { value: "scheduled", label: "Scheduled" },
    { value: "ongoing", label: "Ongoing" },
    { value: "completed", label: "Completed" },
  ];

  return (
    <fieldset className="space-y-6 pt-2 border-t border-[#E8EEF5]">
      <legend className="text-base font-semibold text-[#1A3A5C] mb-4 pt-4">
        Schedule &amp; Status
      </legend>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-[#1A3A5C] mb-1">
            Status{" "}
            <span className="text-red-500" aria-hidden="true">
              *
            </span>
          </label>
          <select
            id="status"
            name="status"
            value={value}
            onChange={onChange}
            aria-required="true"
            className="w-full px-4 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] bg-[#F8FAFE]">
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </fieldset>
  );
};

export default StatusSection;
