import React from "react";

interface SubjectOption {
  id: string;
  name: string;
  code: string;
}

interface ExamDetailsFormSectionProps {
  formData: any;
  fieldErrors: any;
  titleInputRef: React.RefObject<HTMLInputElement | null>;
  fieldRefs: React.MutableRefObject<any>;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => void;
  subjects: SubjectOption[]; // ← added
  isLoadingSubjects?: boolean; // ← added (optional, edit form doesn't pass one currently)
}

const ExamDetailsFormSection: React.FC<ExamDetailsFormSectionProps> = ({
  formData,
  fieldErrors,
  titleInputRef,
  fieldRefs,
  onChange,
  subjects,
  isLoadingSubjects,
}) => {
  const errorId = (field: string) => `${field}-error`;
  const describedBy = (field: string) => (fieldErrors[field] ? errorId(field) : undefined);

  return (
    <fieldset className="space-y-6">
      <legend className="text-base font-semibold text-[#1A3A5C] mb-4">Exam Details</legend>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label htmlFor="title" className="block text-sm font-medium text-[#1A3A5C] mb-1">
            Exam Title{" "}
            <span className="text-red-500" aria-hidden="true">
              *
            </span>
          </label>
          <input
            ref={(el) => {
              titleInputRef.current = el;
              fieldRefs.current.title = el;
            }}
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={onChange}
            aria-required="true"
            aria-invalid={!!fieldErrors.title}
            aria-describedby={describedBy("title")}
            placeholder="e.g., Chemistry First Term Examination"
            className="w-full px-4 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-[#F8FAFE]"
          />
          {fieldErrors.title && (
            <p id={errorId("title")} className="mt-1 text-sm text-red-600">
              {fieldErrors.title}
            </p>
          )}
        </div>

        {/* Subject — was a free-text <input>, now a <select> bound to subjects */}
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-[#1A3A5C] mb-1">
            Subject{" "}
            <span className="text-red-500" aria-hidden="true">
              *
            </span>
          </label>
          <select
            ref={(el) => {
              fieldRefs.current.subject = el;
            }}
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={onChange}
            disabled={isLoadingSubjects}
            aria-required="true"
            aria-invalid={!!fieldErrors.subject}
            aria-describedby={describedBy("subject")}
            className="w-full px-4 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] bg-[#F8FAFE] disabled:opacity-60">
            <option value="">{isLoadingSubjects ? "Loading subjects…" : "Select Subject"}</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          {fieldErrors.subject && (
            <p id={errorId("subject")} className="mt-1 text-sm text-red-600">
              {fieldErrors.subject}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="class" className="block text-sm font-medium text-[#1A3A5C] mb-1">
            Class{" "}
            <span className="text-red-500" aria-hidden="true">
              *
            </span>
          </label>
          <select
            ref={(el) => {
              fieldRefs.current.class = el;
            }}
            id="class"
            name="class"
            value={formData.class}
            onChange={onChange}
            aria-required="true"
            aria-invalid={!!fieldErrors.class}
            aria-describedby={describedBy("class")}
            className="w-full px-4 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] bg-[#F8FAFE]">
            <option value="">Select Class</option>
            <option value="JSS1">JSS1</option>
            <option value="JSS2">JSS2</option>
            <option value="JSS3">JSS3</option>
            <option value="SS1">SS1</option>
            <option value="SS2">SS2</option>
            <option value="SS3">SS3</option>
          </select>
          {fieldErrors.class && (
            <p id={errorId("class")} className="mt-1 text-sm text-red-600">
              {fieldErrors.class}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="term" className="block text-sm font-medium text-[#1A3A5C] mb-1">
            Term{" "}
            <span className="text-red-500" aria-hidden="true">
              *
            </span>
          </label>
          <select
            ref={(el) => {
              fieldRefs.current.term = el;
            }}
            id="term"
            name="term"
            value={formData.term}
            onChange={onChange}
            aria-required="true"
            aria-invalid={!!fieldErrors.term}
            aria-describedby={describedBy("term")}
            className="w-full px-4 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] bg-[#F8FAFE]">
            <option value="">Select Term</option>
            <option value="First Term">First Term</option>
            <option value="Second Term">Second Term</option>
            <option value="Third Term">Third Term</option>
          </select>
          {fieldErrors.term && (
            <p id={errorId("term")} className="mt-1 text-sm text-red-600">
              {fieldErrors.term}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-[#1A3A5C] mb-1">
            Exam Type{" "}
            <span className="text-red-500" aria-hidden="true">
              *
            </span>
          </label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={onChange}
            aria-required="true"
            className="w-full px-4 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] bg-[#F8FAFE]">
            <option value="objective">Objective (MCQ)</option>
            <option value="theory">Theory (Essay)</option>
            <option value="mixed">Mixed (Both)</option>
          </select>
        </div>
      </div>
    </fieldset>
  );
};

export default ExamDetailsFormSection;
