import React from "react";
import FormField from "@/components/ui/form/FormField";
import TextField from "@/components/ui/form/TextField";
import SelectField from "@/components/ui/form/SelectField";
import Fieldset from "@/components/ui/form/Fieldset";
import { ExamFormData, FieldErrors, RequiredField } from "@/types/exam-form";
import { CLASS_OPTIONS, TERM_OPTIONS, EXAM_TYPE_OPTIONS } from "@/config/exam-form-options";
interface SubjectOption {
  id: string;
  name: string;
  code: string;
}
interface ExamDetailsSectionProps {
  formData: ExamFormData;
  fieldErrors: FieldErrors;
  fieldRefs: React.MutableRefObject<Partial<Record<RequiredField, HTMLElement | null>>>;
  titleInputRef: React.RefObject<HTMLInputElement | null>;
  subjects: SubjectOption[];
  isLoadingSubjects: boolean;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => void;
}

const ExamDetailsSection: React.FC<ExamDetailsSectionProps> = ({
  formData,
  fieldErrors,
  fieldRefs,
  titleInputRef,
  subjects,
  isLoadingSubjects,
  onChange,
}) => {
  return (
    <Fieldset legend="Exam Details">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Title - Full Width */}
        <FormField
          label="Exam Title"
          htmlFor="title"
          required
          error={fieldErrors.title}
          className="md:col-span-2">
          <TextField
            ref={(el) => {
              titleInputRef.current = el;
              fieldRefs.current.title = el;
            }}
            type="text"
            name="title"
            value={formData.title}
            onChange={onChange}
            error={!!fieldErrors.title}
            placeholder="e.g., Chemistry First Term Examination"
          />
        </FormField>

        {/* Subject */}
        <FormField label="Subject" htmlFor="subject" required error={fieldErrors.subject}>
          <SelectField
            ref={(el) => {
              fieldRefs.current.subject = el;
            }}
            name="subject"
            value={formData.subject}
            onChange={onChange}
            error={!!fieldErrors.subject}
            disabled={isLoadingSubjects}
            options={[
              { value: "", label: isLoadingSubjects ? "Loading subjects..." : "Select a subject" },
              ...subjects.map((s) => ({ value: s.id, label: s.name })),
            ]}
          />
        </FormField>

        {/* Class */}
        <FormField label="Class" htmlFor="class" required error={fieldErrors.class}>
          <SelectField
            ref={(el) => {
              fieldRefs.current.class = el;
            }}
            name="class"
            value={formData.class}
            onChange={onChange}
            error={!!fieldErrors.class}
            options={CLASS_OPTIONS}
          />
        </FormField>

        {/* Term */}
        <FormField label="Term" htmlFor="term" required error={fieldErrors.term}>
          <SelectField
            ref={(el) => {
              fieldRefs.current.term = el;
            }}
            name="term"
            value={formData.term}
            onChange={onChange}
            error={!!fieldErrors.term}
            options={TERM_OPTIONS}
          />
        </FormField>

        {/* Exam Type */}
        <FormField label="Exam Type" htmlFor="type" required>
          <SelectField
            name="type"
            value={formData.type}
            onChange={onChange}
            options={EXAM_TYPE_OPTIONS}
          />
        </FormField>
      </div>
    </Fieldset>
  );
};

export default ExamDetailsSection;
