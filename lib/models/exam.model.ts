import mongoose, { Schema, models, model, Document } from "mongoose";
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

export interface IExam extends Document {
  title: string;
  subject: mongoose.Types.ObjectId;
  class: ClassLevel;
  term: Term;
  academicYear: string; // e.g. "2024/2025"
  type: ExamType;
  examDate: Date;
  duration: number; // minutes
  questionCount: number;
  totalMarks: number;
  status: ExamStatus;
  instructions?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
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
    // Denormalized so list views (like the Exams page) don't need to
    // populate + count the Question collection on every render. Kept in
    // sync by the Question model's post-save/post-remove hooks.
    questionCount: { type: Number, default: 0, min: 0 },
    totalMarks: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: { values: EXAM_STATUSES, message: "{VALUE} is not a valid exam status" },
      default: "Scheduled",
    },
    instructions: { type: String, trim: true },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      required: [true, "createdBy is required"],
    },
  },
  { timestamps: true },
);

// One "row" per subject+class+term+type on the Exams page, so guard against
// accidental duplicates (e.g. two "Objective" Chemistry exams for JSS1 First
// Term). Remove this if you'll ever legitimately need more than one.
examSchema.index({ subject: 1, class: 1, term: 1, academicYear: 1, type: 1 }, { unique: true });
examSchema.index({ class: 1, status: 1 });

export const Exam = (models.Exam as mongoose.Model<IExam>) || model<IExam>("Exam", examSchema);
