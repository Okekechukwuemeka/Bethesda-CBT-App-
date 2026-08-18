export const CLASS_OPTIONS = [
  { value: "", label: "Select Class" },
  { value: "JSS1", label: "JSS1" },
  { value: "JSS2", label: "JSS2" },
  { value: "JSS3", label: "JSS3" },
  { value: "SSS1", label: "SSS1" },
  { value: "SSS2", label: "SSS2" },
  { value: "SSS3", label: "SSS3" },
  { value: "Primary1", label: "Primary 1" },
  { value: "Primary2", label: "Primary 2" },
  { value: "Primary3", label: "Primary 3" },
  { value: "Primary4", label: "Primary 4" },
  { value: "Primary5", label: "Primary 5" },
  { value: "Primary6", label: "Primary 6" },
  { value: "Graduated", label: "Graduated" },
];

// Same classes as CLASS_OPTIONS, minus the "Select Class" placeholder and
// "Graduated" (a general exam is for currently-enrolled classes, not
// alumni) - used for the "which classes can take this?" checkbox list on
// a general exam.
export const GENERAL_EXAM_CLASS_OPTIONS = CLASS_OPTIONS.filter(
  (option) => option.value !== "" && option.value !== "Graduated",
);

export const TERM_OPTIONS = [
  { value: "", label: "Select Term" },
  { value: "First Term", label: "First Term" },
  { value: "Second Term", label: "Second Term" },
  { value: "Third Term", label: "Third Term" },
];

export const EXAM_TYPE_OPTIONS = [
  { value: "objective", label: "Objective (MCQ)" },
  { value: "theory", label: "Theory (Essay)" },
  { value: "mixed", label: "Mixed (Both)" },
];
