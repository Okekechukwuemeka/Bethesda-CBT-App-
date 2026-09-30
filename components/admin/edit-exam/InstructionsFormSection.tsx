import React from "react";

interface InstructionsFormSectionProps {
  formData: any;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => void;
}

const InstructionsFormSection: React.FC<InstructionsFormSectionProps> = ({
  formData,
  onChange,
}) => {
  const isMixed = formData.type === "mixed";
  const textareaClass =
    "w-full px-4 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-[#F8FAFE] resize-y";

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="instructions" className="block text-sm font-medium text-[#1A3A5C] mb-1">
          Exam Instructions
        </label>
        <textarea
          id="instructions"
          name="instructions"
          value={formData.instructions}
          onChange={onChange}
          rows={4}
          placeholder="Enter exam instructions for students..."
          className={textareaClass}
        />
      </div>

      {isMixed && (
        <fieldset className="border border-[#C5D8EC] rounded-lg p-4 space-y-4 bg-[#F8FAFE]">
          <legend className="px-2 text-sm font-medium text-[#1A3A5C]">
            Section Instructions (Mixed exam)
          </legend>
          <p className="text-sm text-[#5A7A9A]">
            Students see these at the start of each section. Leave a box blank to use the default
            wording.
          </p>
          <div>
            <label
              htmlFor="objectiveInstructions"
              className="block text-sm font-medium text-[#1A3A5C] mb-1">
              Section A: Objective instructions
            </label>
            <textarea
              id="objectiveInstructions"
              name="objectiveInstructions"
              value={formData.objectiveInstructions ?? ""}
              onChange={onChange}
              rows={3}
              placeholder="e.g. Answer ALL questions. Choose the one correct option for each."
              className={textareaClass}
            />
          </div>
          <div>
            <label
              htmlFor="theoryInstructions"
              className="block text-sm font-medium text-[#1A3A5C] mb-1">
              Section B: Theory instructions
            </label>
            <textarea
              id="theoryInstructions"
              name="theoryInstructions"
              value={formData.theoryInstructions ?? ""}
              onChange={onChange}
              rows={3}
              placeholder="e.g. Answer any THREE questions. Write your answers in full sentences."
              className={textareaClass}
            />
          </div>
        </fieldset>
      )}
    </div>
  );
};

export default InstructionsFormSection;
