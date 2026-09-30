import React from "react";
import FormField from "@/components/ui/form/FormField";
import { ExamFormData } from "@/types/exam-form";
import TextAreaField from "@/components/ui/form/TextAreaField";

interface InstructionsSectionProps {
  formData: ExamFormData;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => void;
}

const InstructionsSection: React.FC<InstructionsSectionProps> = ({ formData, onChange }) => {
  const isMixed = formData.type === "mixed";

  return (
    <div className="space-y-4">
      <FormField
        label="Exam Instructions"
        htmlFor="instructions"
        helperText={isMixed ? "General instructions shown at the top of the whole exam." : undefined}>
        <TextAreaField
          id="instructions"
          name="instructions"
          value={formData.instructions}
          onChange={onChange}
          rows={4}
          placeholder="Enter exam instructions for students..."
        />
      </FormField>

      {isMixed && (
        <fieldset className="border border-[#C5D8EC] rounded-lg p-4 space-y-4 bg-[#F8FAFE]">
          <legend className="px-2 text-sm font-medium text-[#1A3A5C]">
            Section Instructions (Mixed exam)
          </legend>
          <p className="text-sm text-[#5A7A9A]">
            Students see these at the start of each section. Leave a box blank to use the default
            wording.
          </p>
          <FormField label="Section A: Objective instructions" htmlFor="objectiveInstructions">
            <TextAreaField
              id="objectiveInstructions"
              name="objectiveInstructions"
              value={formData.objectiveInstructions}
              onChange={onChange}
              rows={3}
              placeholder="e.g. Answer ALL questions. Choose the one correct option for each."
            />
          </FormField>
          <FormField label="Section B: Theory instructions" htmlFor="theoryInstructions">
            <TextAreaField
              id="theoryInstructions"
              name="theoryInstructions"
              value={formData.theoryInstructions}
              onChange={onChange}
              rows={3}
              placeholder="e.g. Answer any THREE questions. Write your answers in full sentences."
            />
          </FormField>
        </fieldset>
      )}
    </div>
  );
};

export default InstructionsSection;
