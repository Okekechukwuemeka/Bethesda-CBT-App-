import React from "react";
import FormField from "@/components/ui/form/FormField";
import TextField from "@/components/ui/form/TextField";
import Fieldset from "@/components/ui/form/Fieldset";
import { ExamFormData, FieldErrors, RequiredField } from "@/types/exam-form";

interface ScheduleSectionProps {
  formData: ExamFormData;
  fieldErrors: FieldErrors;
  fieldRefs: React.MutableRefObject<Partial<Record<RequiredField, HTMLElement | null>>>;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => void;
}

const ScheduleSection: React.FC<ScheduleSectionProps> = ({
  formData,
  fieldErrors,
  fieldRefs,
  onChange,
}) => {
  return (
    <Fieldset legend="Schedule">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label="Duration (minutes)"
          htmlFor="duration"
          required
          helperText="Between 15 and 180 minutes.">
          <TextField
            type="number"
            id="duration"
            name="duration"
            value={formData.duration}
            onChange={onChange}
            min="15"
            max="180"
          />
        </FormField>

        <div />

        <FormField label="Exam Date" htmlFor="date" required error={fieldErrors.date}>
          <TextField
            ref={(el) => {
              fieldRefs.current.date = el;
            }}
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={onChange}
            error={!!fieldErrors.date}
          />
        </FormField>

        <FormField label="Exam Time" htmlFor="time" required error={fieldErrors.time}>
          <TextField
            ref={(el) => {
              fieldRefs.current.time = el;
            }}
            type="time"
            id="time"
            name="time"
            value={formData.time}
            onChange={onChange}
            error={!!fieldErrors.time}
          />
        </FormField>
      </div>
    </Fieldset>
  );
};

export default ScheduleSection;
