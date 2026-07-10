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
  return (
    <FormField label="Exam Instructions" htmlFor="instructions">
      <TextAreaField
        id="instructions"
        name="instructions"
        value={formData.instructions}
        onChange={onChange}
        rows={4}
        placeholder="Enter exam instructions for students..."
      />
    </FormField>
  );
};

export default InstructionsSection;
