import mongoose, { Schema, models, model, Document } from "mongoose";

import "./subject.model";
import {
  CLASS_LEVELS,
  ClassLevel,
  TERMS,
  Term,
  EXAM_TYPES,
  ExamType,
  EXAM_STATUSES,
  ExamStatus,
} from "./constants";

export interface IExamQuestionRef {
  question: mongoose.Types.ObjectId;
  order: number;
}

export interface IExam extends Document {
  title: string;
  subject: mongoose.Types.ObjectId;
  class: ClassLevel;
  term: Term;
  academicYear: string; // e.g. "2024/2025"
  type: ExamType;
  examDate: Date;
  duration: number; // minutes
  // Questions attached from the bank. questionCount/totalMarks below are
  // denormalized from this for cheap list-page reads, kept in sync by
  // recomputeExamTotals() - see below.
  questions: IExamQuestionRef[];
  questionCount: number;
  totalMarks: number;
  status: ExamStatus;
  instructions?: string;

  passingScore: number;

  shuffleQuestions: boolean;
  // Code students enter to unlock/access this exam's questions.
  examCode: string;
  isCodeActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// 8 characters, excluding easily-confused ones (0/O, 1/I/L) so students can
// read a code off a whiteboard or printout without ambiguity.
const CODE_CHARSET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;

function generateExamCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_CHARSET[Math.floor(Math.random() * CODE_CHARSET.length)];
  }
  return code;
}

const examSchema = new Schema<IExam>(
  {
    title: {
      type: String,
      required: [true, "Exam title is required"],
      trim: true,
    },
    subject: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      required: [true, "Subject is required"],
    },
    class: {
      type: String,
      required: [true, "Class is required"],
      enum: { values: CLASS_LEVELS, message: "{VALUE} is not a valid class level" },
    },
    term: {
      type: String,
      required: [true, "Term is required"],
      enum: { values: TERMS, message: "{VALUE} is not a valid term" },
    },
    academicYear: {
      type: String,
      required: [true, "Academic year is required"],
      trim: true,
      match: [/^\d{4}\/\d{4}$/, "Academic year must be in the format YYYY/YYYY"],
    },
    type: {
      type: String,
      required: [true, "Exam type is required"],
      enum: { values: EXAM_TYPES, message: "{VALUE} is not a valid exam type" },
    },
    examDate: { type: Date, required: [true, "Exam date is required"] },
    duration: {
      type: Number,
      required: [true, "Duration is required"],
      min: [1, "Duration must be at least 1 minute"],
    },
    questions: [
      {
        question: { type: Schema.Types.ObjectId, ref: "Question", required: true },
        order: { type: Number, default: 0 },
      },
    ],
    // Denormalized so list views (like the Exams page) don't need to
    // populate + sum the attached questions on every render. Kept in sync
    // by recomputeExamTotals(), called explicitly whenever `questions`
    // changes (see the attach/detach route handlers).
    questionCount: { type: Number, default: 0, min: 0 },
    totalMarks: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: { values: EXAM_STATUSES, message: "{VALUE} is not a valid exam status" },
      default: "Scheduled",
    },
    instructions: { type: String, trim: true },
    passingScore: {
      type: Number,
      default: 40,
      min: [0, "Passing score cannot be negative"],
      max: [100, "Passing score cannot exceed 100"],
    },
    shuffleQuestions: { type: Boolean, default: false },
    examCode: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
      // Not `required` at the schema level since we auto-generate it in
      // pre-save when left blank — see below.
    },
    // Lets an admin disable access (e.g. after the exam window closes)
    // without deleting or regenerating the code.
    isCodeActive: { type: Boolean, default: true },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      required: [true, "createdBy is required"],
    },
  },
  { timestamps: true },
);

// Auto-generate a unique access code when one isn't supplied, retrying on
// the rare collision. `this.constructor` is used instead of the exported
// `Exam` binding to sidestep referencing a const before it's initialized.
examSchema.pre("save", async function (this: IExam) {
  if (this.examCode) return;

  const ExamModel = this.constructor as mongoose.Model<IExam>;
  let code = generateExamCode();
  let attempts = 0;
  while (await ExamModel.exists({ examCode: code })) {
    if (++attempts > 10) {
      throw new Error("Could not generate a unique exam code, please retry");
    }
    code = generateExamCode();
  }
  this.examCode = code;
});

// One "row" per subject+class+term+type on the Exams page, so guard against
// accidental duplicates (e.g. two "Objective" Chemistry exams for JSS1 First
// Term). Remove this if you'll ever legitimately need more than one.
examSchema.index(
  { subject: 1, class: 1, term: 1, academicYear: 1, type: 1, title: 1 },
  { unique: true },
);
examSchema.index({ class: 1, status: 1 });

// Recomputes questionCount/totalMarks from whichever bank questions are
// currently attached. Called explicitly (not via a hook) from the
// attach/detach question route handlers, since Question is a shared bank
// entity now - there's no single "this question's exam changed" event to
// hook into the way there was when questions belonged to one exam.
export async function recomputeExamTotals(examId: mongoose.Types.ObjectId | string) {
  // Imported lazily to avoid a circular import at module-load time
  // (question.model.ts doesn't import this file, but keeping the import
  // local here makes that non-dependency explicit).
  const { Question } = await import("./question.model");

  const exam = await Exam.findById(examId);
  if (!exam) return;

  const questionIds = exam.questions.map((q) => q.question);
  if (questionIds.length === 0) {
    exam.questionCount = 0;
    exam.totalMarks = 0;
  } else {
    const questions = await Question.find({ _id: { $in: questionIds } }).select("marks");
    exam.questionCount = questions.length;
    exam.totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
  }
  await exam.save();
}

export const Exam = (models.Exam as mongoose.Model<IExam>) || model<IExam>("Exam", examSchema);
