import React from "react";

interface ScheduleStatusFormSectionProps {
  formData: any;
  fieldErrors: any;
  fieldRefs: React.MutableRefObject<any>;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => void;
}

const ScheduleStatusFormSection: React.FC<ScheduleStatusFormSectionProps> = ({
  formData,
  fieldErrors,
  fieldRefs,
  onChange,
}) => {
  const errorId = (field: string) => `${field}-error`;
  const describedBy = (field: string) => (fieldErrors[field] ? errorId(field) : undefined);

  const getStatusOptions = () => [
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
          <label htmlFor="duration" className="block text-sm font-medium text-[#1A3A5C] mb-1">
            Duration (minutes){" "}
            <span className="text-red-500" aria-hidden="true">
              *
            </span>
          </label>
          <input
            type="number"
            id="duration"
            name="duration"
            value={formData.duration}
            onChange={onChange}
            aria-required="true"
            aria-describedby="duration-hint"
            min="15"
            max="180"
            className="w-full px-4 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-[#F8FAFE]"
          />
          <p id="duration-hint" className="mt-1 text-xs text-[#8A9CAE]">
            Between 15 and 180 minutes.
          </p>
        </div>

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
            value={formData.status}
            onChange={onChange}
            aria-required="true"
            className="w-full px-4 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] bg-[#F8FAFE]">
            {getStatusOptions().map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="date" className="block text-sm font-medium text-[#1A3A5C] mb-1">
            Exam Date{" "}
            <span className="text-red-500" aria-hidden="true">
              *
            </span>
          </label>
          <input
            ref={(el) => {
              fieldRefs.current.date = el;
            }}
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={onChange}
            aria-required="true"
            aria-invalid={!!fieldErrors.date}
            aria-describedby={describedBy("date")}
            className="w-full px-4 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-[#F8FAFE]"
          />
          {fieldErrors.date && (
            <p id={errorId("date")} className="mt-1 text-sm text-red-600">
              {fieldErrors.date}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="time" className="block text-sm font-medium text-[#1A3A5C] mb-1">
            Exam Time{" "}
            <span className="text-red-500" aria-hidden="true">
              *
            </span>
          </label>
          <input
            ref={(el) => {
              fieldRefs.current.time = el;
            }}
            type="time"
            id="time"
            name="time"
            value={formData.time}
            onChange={onChange}
            aria-required="true"
            aria-invalid={!!fieldErrors.time}
            aria-describedby={describedBy("time")}
            className="w-full px-4 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-[#F8FAFE]"
          />
          {fieldErrors.time && (
            <p id={errorId("time")} className="mt-1 text-sm text-red-600">
              {fieldErrors.time}
            </p>
          )}
        </div>
      </div>
    </fieldset>
  );
};

export default ScheduleStatusFormSection;
