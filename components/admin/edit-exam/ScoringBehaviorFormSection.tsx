import React from "react";

interface ScoringBehaviorFormSectionProps {
  formData: any;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => void;
}

const ScoringBehaviorFormSection: React.FC<ScoringBehaviorFormSectionProps> = ({
  formData,
  onChange,
}) => {
  return (
    <fieldset className="space-y-6 pt-2 border-t border-[#E8EEF5]">
      <legend className="text-base font-semibold text-[#1A3A5C] mb-4 pt-4">
        Scoring &amp; Behavior
      </legend>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="passingScore" className="block text-sm font-medium text-[#1A3A5C] mb-1">
            Passing Score (%)
          </label>
          <input
            type="number"
            id="passingScore"
            name="passingScore"
            value={formData.passingScore}
            onChange={onChange}
            min="0"
            max="100"
            className="w-full px-4 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-[#F8FAFE]"
          />
        </div>

        <div className="flex items-center">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              id="shuffleQuestions"
              name="shuffleQuestions"
              checked={formData.shuffleQuestions}
              onChange={onChange}
              className="w-4 h-4 text-[#1A3A5C] focus:ring-2 focus:ring-[#2B6CB0] rounded"
            />
            <span className="text-sm text-[#1A3A5C] font-medium">
              Shuffle questions for each student
            </span>
          </label>
        </div>
      </div>
    </fieldset>
  );
};

export default ScoringBehaviorFormSection;
