export const CLASS_LEVELS = ["JSS1", "JSS2", "JSS3", "SSS1", "SSS2", "SSS3", "graduated"] as const;
export type ClassLevel = (typeof CLASS_LEVELS)[number];

export const TERMS = ["First Term", "Second Term", "Third Term"] as const;
export type Term = (typeof TERMS)[number];

// Matches the "Objective / Theory / Mixed" pill shown on the Exams page.
export const EXAM_TYPES = ["Objective", "Theory", "Mixed"] as const;
export type ExamType = (typeof EXAM_TYPES)[number];

// Matches the "Scheduled / Ongoing / Completed" badge on the Exams page.
export const EXAM_STATUSES = ["Scheduled", "Ongoing", "Completed"] as const;
export type ExamStatus = (typeof EXAM_STATUSES)[number];

export const QUESTION_TYPES = ["Objective", "Theory"] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

// Matches the "Completed / Pending / In-Progress" status on the Results page,
// and "Marked / Pending / In-Progress" on the Student Scripts modal.
export const SUBMISSION_STATUSES = ["Not Started", "In Progress", "Submitted", "Marked"] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];
