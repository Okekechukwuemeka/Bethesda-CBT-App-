"use client";

import React from "react";
import Modal from "@/components/ui/Modal";
import TextField from "@/components/ui/form/TextField";
import SelectField from "@/components/ui/form/SelectField";
import { useTeacherQuestionsStore } from "@/store/useTeacherQuestionsStore";
import type { AssignedSubject } from "@/types/staff";

interface QuestionFormModalProps {
  subjects: AssignedSubject[];
  classes: string[];
}

const TYPE_OPTIONS = [
  { value: "Objective", label: "Objective" },
  { value: "Theory", label: "Theory" },
];

const QuestionFormModal: React.FC<QuestionFormModalProps> = ({ subjects, classes }) => {
  const {
    isModalOpen,
    isEditing,
    formData,
    formError,
    isSubmitting,
    updateFormField,
    updateOption,
    addOption,
    removeOption,
    submitForm,
    closeFormModal,
  } = useTeacherQuestionsStore();

  return (
    <Modal
      isOpen={isModalOpen}
      onClose={closeFormModal}
      title={isEditing ? "Edit Question" : "Add Question"}
      disableClose={isSubmitting}
      maxWidth="2xl">
      <form onSubmit={submitForm} className="space-y-4">
        {!isEditing && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="q-subject" className="block text-sm font-medium text-[#1A3A5C] mb-1">
                Subject
              </label>
              <SelectField
                id="q-subject"
                value={formData.subject}
                onChange={(e) => updateFormField("subject", e.target.value)}
                disabled={isSubmitting}
                options={[
                  { value: "", label: "Select subject" },
                  ...subjects.map((s) => ({ value: s.id, label: s.name })),
                ]}
              />
            </div>
            <div>
              <label htmlFor="q-class" className="block text-sm font-medium text-[#1A3A5C] mb-1">
                Class
              </label>
              <SelectField
                id="q-class"
                value={formData.class}
                onChange={(e) => updateFormField("class", e.target.value)}
                disabled={isSubmitting}
                options={[
                  { value: "", label: "Select class" },
                  ...classes.map((c) => ({ value: c, label: c })),
                ]}
              />
            </div>
          </div>
        )}

        <div>
          <label htmlFor="q-type" className="block text-sm font-medium text-[#1A3A5C] mb-1">
            Question Type
          </label>
          <SelectField
            id="q-type"
            value={formData.type}
            onChange={(e) => updateFormField("type", e.target.value)}
            disabled={isSubmitting || isEditing}
            options={TYPE_OPTIONS}
          />
        </div>

        <div>
          <label htmlFor="q-text" className="block text-sm font-medium text-[#1A3A5C] mb-1">
            Question Text
          </label>
          <textarea
            id="q-text"
            value={formData.text}
            onChange={(e) => updateFormField("text", e.target.value)}
            disabled={isSubmitting}
            rows={3}
            className="w-full px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] disabled:opacity-50"
          />
        </div>

        <div>
          <label htmlFor="q-marks" className="block text-sm font-medium text-[#1A3A5C] mb-1">
            Marks
          </label>
          <TextField
            id="q-marks"
            type="number"
            min={1}
            value={formData.marks}
            onChange={(e) => updateFormField("marks", e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        {formData.type === "Objective" && (
          <div>
            <span className="block text-sm font-medium text-[#1A3A5C] mb-1">Options</span>
            <div className="space-y-2">
              {formData.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correctAnswer"
                    checked={formData.correctAnswer === opt && opt !== ""}
                    onChange={() => updateFormField("correctAnswer", opt)}
                    disabled={isSubmitting || !opt.trim()}
                    aria-label={`Mark option ${i + 1} as correct answer`}
                  />
                  <TextField
                    value={opt}
                    onChange={(e) => {
                      const wasCorrect = formData.correctAnswer === opt;
                      updateOption(i, e.target.value);
                      if (wasCorrect) updateFormField("correctAnswer", e.target.value);
                    }}
                    disabled={isSubmitting}
                    placeholder={`Option ${i + 1}`}
                  />
                  {formData.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(i)}
                      disabled={isSubmitting}
                      aria-label={`Remove option ${i + 1}`}
                      className="text-red-600 hover:underline text-sm">
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addOption}
              disabled={isSubmitting}
              className="text-[#2B6CB0] hover:underline text-sm font-medium mt-2">
              + Add option
            </button>
            <p className="text-xs text-[#5A7A9A] mt-1">Select the radio button next to the correct answer.</p>
          </div>
        )}

        {formError && (
          <div role="alert" className="p-3 rounded-lg text-sm font-medium bg-red-100 text-red-800 border border-red-300">
            {formError}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={closeFormModal}
            disabled={isSubmitting}
            className="flex-1 bg-[#E8EEF5] hover:bg-[#D5DFE8] text-[#1A3A5C] font-medium py-2.5 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/30 disabled:opacity-50">
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-[#1A3A5C] hover:bg-[#14304D] text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/50 disabled:opacity-50">
            {isSubmitting ? "Saving…" : isEditing ? "Save Changes" : "Add Question"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default QuestionFormModal;
