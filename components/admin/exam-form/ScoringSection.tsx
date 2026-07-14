import React from "react";
import FormField from "@/components/ui/form/FormField";
import TextField from "@/components/ui/form/TextField";
import Fieldset from "@/components/ui/form/Fieldset";
import { ExamFormData } from "@/types/exam-form";
import CheckboxField from "@/components/ui/form/CheckboxField";

interface ScoringSectionProps {
  formData: ExamFormData;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => void;
}

const ScoringSection: React.FC<ScoringSectionProps> = ({ formData, onChange }) => {
  return (
    <Fieldset legend="Scoring &amp; Behavior">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField label="Passing Score (%)" htmlFor="passingScore">
          <TextField
            type="number"
            id="passingScore"
            name="passingScore"
            value={formData.passingScore}
            onChange={onChange}
            min="0"
            max="100"
          />
        </FormField>

        <CheckboxField
          id="shuffleQuestions"
          name="shuffleQuestions"
          checked={formData.shuffleQuestions}
          onChange={onChange}
          label="Shuffle questions for each student"
        />
      </div>
    </Fieldset>
  );
};

export default ScoringSection;
