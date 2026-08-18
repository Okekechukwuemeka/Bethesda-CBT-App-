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
  // Populated for a normal, class-specific exam. Left unset for a general
  // exam (isGeneral: true) - see `classes` below instead.
  class?: ClassLevel;
  // General exams (e.g. an inter-class aptitude test, a scholarship exam)
  // aren't tied to a single class - the admin instead picks every class
  // that's eligible to sit it. Only populated when isGeneral is true.
  classes?: ClassLevel[];
  isGeneral: boolean;
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
const CODE_LENGTH = 6;

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
    // Required for a class-specific exam, left empty for a general exam -
    // enforced as a function so it doesn't fire when isGeneral is true.
    class: {
      type: String,
      required: [
        function (this: IExam) {
          return !this.isGeneral;
        },
        "Class is required for a class-specific exam",
      ],
      enum: { values: CLASS_LEVELS, message: "{VALUE} is not a valid class level" },
    },
    // Required (non-empty) for a general exam, left empty for a
    // class-specific exam - the mirror image of `class` above. The
    // "must be non-empty when general" check itself lives in the
    // pre("validate") hook below rather than here, since combining an
    // array type with `enum` and a custom `validate` on the same field
    // confuses mongoose's TS overload resolution.
    classes: {
      type: [String],
      enum: { values: CLASS_LEVELS, message: "{VALUE} is not a valid class level" },
      default: undefined,
    },
    isGeneral: { type: Boolean, default: false },
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

// Keeps `class` and `classes` from both being populated at once - whichever
// one doesn't apply to this exam's mode is cleared out, so a general exam
// never carries a stale single class (or vice versa) from before it was
// switched.
examSchema.pre("validate", function (this: IExam) {
  if (this.isGeneral) {
    this.class = undefined;
    if (!this.classes || this.classes.length === 0) {
      this.invalidate("classes", "Select at least one class for a general exam");
    }
  } else {
    this.classes = undefined;
  }
});

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
// Partial so it only applies to class-specific exams - general exams don't
// have a single `class` value to key off of (see the index below instead).
examSchema.index(
  { subject: 1, class: 1, term: 1, academicYear: 1, type: 1, title: 1 },
  { unique: true, partialFilterExpression: { isGeneral: { $ne: true } } },
);
// Mirrors the index above for general exams, keyed off title instead of a
// single class since general exams can span several classes at once.
examSchema.index(
  { subject: 1, term: 1, academicYear: 1, type: 1, title: 1 },
  { unique: true, partialFilterExpression: { isGeneral: true } },
);
examSchema.index({ class: 1, status: 1 });
examSchema.index({ classes: 1, status: 1 });

// Shared "does this exam apply to className" query filter - a class-specific
// exam matches on its single `class`, a general exam matches if className is
// among its `classes`. Used anywhere exams need to be scoped to one class:
// the student exam list, the admin exam list's class filter, and the
// results pages.
export function examClassFilter(className: ClassLevel) {
  return {
    $or: [{ class: className }, { isGeneral: true, classes: className }],
  };
}

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
