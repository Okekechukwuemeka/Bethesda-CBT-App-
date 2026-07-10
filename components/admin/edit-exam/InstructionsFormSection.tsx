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
  return (
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
        className="w-full px-4 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-[#F8FAFE] resize-y"
      />
    </div>
  );
};

export default InstructionsFormSection;
