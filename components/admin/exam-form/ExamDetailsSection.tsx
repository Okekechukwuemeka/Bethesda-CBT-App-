import React from "react";
import FormField from "@/components/ui/form/FormField";
import TextField from "@/components/ui/form/TextField";
import SelectField from "@/components/ui/form/SelectField";
import Fieldset from "@/components/ui/form/Fieldset";
import { ExamFormData, FieldErrors, RequiredField } from "@/types/exam-form";
import {
  CLASS_OPTIONS,
  GENERAL_EXAM_CLASS_OPTIONS,
  TERM_OPTIONS,
  EXAM_TYPE_OPTIONS,
} from "@/config/exam-form-options";

interface SubjectOption {
  id: string;
  name: string;
  code: string;
}

type TitleMode = "auto" | "custom";

interface ExamDetailsSectionProps {
  formData: ExamFormData;
  fieldErrors: FieldErrors;
  fieldRefs: React.MutableRefObject<Partial<Record<RequiredField, HTMLElement | null>>>;
  titleInputRef: React.RefObject<HTMLInputElement | null>;
  subjects: SubjectOption[];
  isLoadingSubjects: boolean;
  titleMode: TitleMode;
  onTitleModeChange: (mode: TitleMode) => void;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => void;
  onIsGeneralChange: (isGeneral: boolean) => void;
  onClassesToggle: (classValue: string) => void;
}

const ExamDetailsSection: React.FC<ExamDetailsSectionProps> = ({
  formData,
  fieldErrors,
  fieldRefs,
  titleInputRef,
  subjects,
  isLoadingSubjects,
  titleMode,
  onTitleModeChange,
  onChange,
  onIsGeneralChange,
  onClassesToggle,
}) => {
  return (
    <Fieldset legend="Exam Details">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <div className="flex items-center gap-4 mb-2">
            <label className="flex items-center gap-1.5 text-sm text-[#4A6A8A] cursor-pointer">
              <input
                type="radio"
                name="titleMode"
                checked={titleMode === "auto"}
                onChange={() => onTitleModeChange("auto")}
                className="text-[#1A3A5C] focus:ring-[#2B6CB0]"
              />
              Auto-generate from class/term/subject
            </label>
            <label className="flex items-center gap-1.5 text-sm text-[#4A6A8A] cursor-pointer">
              <input
                type="radio"
                name="titleMode"
                checked={titleMode === "custom"}
                onChange={() => onTitleModeChange("custom")}
                className="text-[#1A3A5C] focus:ring-[#2B6CB0]"
              />
              Custom title
            </label>
          </div>

          <FormField label="Exam Title" htmlFor="title" required error={fieldErrors.title}>
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
              disabled={titleMode === "auto"}
              placeholder={
                titleMode === "auto"
                  ? "Fill in class, term, and subject below to generate a title"
                  : "e.g., Mathematics Midterm Test"
              }
            />
          </FormField>

          {titleMode === "auto" && (
            <p className="text-xs text-[#8A9CAE] mt-1">
              Generated automatically from the fields below. Switch to &quot;Custom title&quot; to
              edit it directly (e.g. for a midterm or mock test).
            </p>
          )}
        </div>

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

        <div className="md:col-span-2">
          <div className="flex items-center gap-4 mb-2">
            <label className="flex items-center gap-1.5 text-sm text-[#4A6A8A] cursor-pointer">
              <input
                type="radio"
                name="examScope"
                checked={!formData.isGeneral}
                onChange={() => onIsGeneralChange(false)}
                className="text-[#1A3A5C] focus:ring-[#2B6CB0]"
              />
              Single class
            </label>
            <label className="flex items-center gap-1.5 text-sm text-[#4A6A8A] cursor-pointer">
              <input
                type="radio"
                name="examScope"
                checked={formData.isGeneral}
                onChange={() => onIsGeneralChange(true)}
                className="text-[#1A3A5C] focus:ring-[#2B6CB0]"
              />
              General exam (multiple classes)
            </label>
          </div>

          {formData.isGeneral ? (
            // Built manually rather than via FormField - FormField clones a
            // SINGLE child element internally, but this field also needs a
            // helper <p> below the checkbox group, and passing two children
            // broke React.cloneElement ("Element type is invalid") at
            // render time.
            <div>
              <label className="block text-sm font-medium text-[#1A3A5C] mb-1">
                Eligible Classes{" "}
                <span className="text-red-500" aria-hidden="true">
                  *
                </span>
              </label>
              <div
                ref={(el) => {
                  fieldRefs.current.class = el;
                }}
                role="group"
                aria-label="Eligible classes"
                aria-describedby={fieldErrors.class ? "classes-error" : undefined}
                tabIndex={-1}
                className={`grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 border rounded-lg bg-[#F8FAFE] ${
                  fieldErrors.class ? "border-red-300" : "border-[#C5D8EC]"
                }`}>
                {GENERAL_EXAM_CLASS_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-2 text-sm text-[#1A3A5C] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.classes.includes(option.value)}
                      onChange={() => onClassesToggle(option.value)}
                      className="w-4 h-4 text-[#1A3A5C] focus:ring-2 focus:ring-[#2B6CB0] rounded"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
              {fieldErrors.class && (
                <p id="classes-error" className="mt-1 text-sm text-red-600" role="alert">
                  {fieldErrors.class}
                </p>
              )}
              <p className="text-xs text-[#8A9CAE] mt-1">
                Any class checked here will be able to see and sit this exam, regardless of
                subject/class pairing.
              </p>
            </div>
          ) : (
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
          )}
        </div>

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
