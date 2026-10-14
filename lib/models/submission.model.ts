import mongoose, { Schema, models, model, Document } from "mongoose";
// Side-effect imports: this schema references all four of these via ref
// below (question, exam, student, markedBy->admin). Registering them here
// means any route that imports Submission and populates one of these
// fields works without needing to separately remember each dependency.
import "./question.model";
import "./exam.model";
import "./student.model";
import "./admin.model";
import {
  ClassLevel,
  CLASS_LEVELS,
  EXAM_TYPES,
  ExamType,
  SUBMISSION_STATUSES,
  SubmissionStatus,
} from "./constants";

// A frozen copy of the exam details a result needs in order to still make
// sense after its exam has been deleted. It is written onto every submission
// of an exam at the moment that exam is deleted (see lib/exam-snapshot.ts),
// which is also what marks a submission as a "result whose exam no longer
// exists" - submissions of live exams never carry one, so existing data is
// not touched until (and unless) its exam is removed.
export interface IExamSnapshot {
  title: string;
  subject?: mongoose.Types.ObjectId;
  subjectName: string;
  isGeneral: boolean;
  class?: ClassLevel;
  classes?: ClassLevel[];
  term?: string;
  academicYear?: string;
  type: ExamType;
  examDate?: Date;
  totalMarks: number;
  // Ids of the exam's Theory questions in the order they were presented,
  // so a student's theory answers can still be numbered Q1, Q2... once the
  // exam (which held that ordering) is gone.
  theoryQuestionIds: mongoose.Types.ObjectId[];
  // Total marks of the exam's Objective questions (used for the MCQ part of
  // a Mixed exam whose theory section hasn't been marked yet).
  objectiveTotal: number;
  deletedAt: Date;
}

export interface IAnswerRecord {
  question: mongoose.Types.ObjectId;
  selectedOption?: string; // objective answer
  textAnswer?: string; // typed theory answer
  isCorrect?: boolean; // auto-computed for objective
  marksAwarded?: number;
  // Client-side timestamp (ms since epoch) of when the student last edited
  // this answer, sent by the offline-sync client. Lets the sync endpoint
  // ignore a stale write that arrives after a newer one (e.g. two tabs, or
  // a queued offline write landing after the student already changed the
  // answer again once back online).
  updatedAt?: number;
}

export interface ISubmission extends Document {
  exam: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  answers: IAnswerRecord[];
  // Scanned/uploaded theory script (PDF or image), shown as "Download Script"
  // in the Student Scripts modal.
  scriptUrl?: string;
  status: SubmissionStatus;
  score: number;
  totalMarks: number;
  grade?: string;
  startedAt?: Date;
  submittedAt?: Date;
  markedAt?: Date;
  markedBy?: mongoose.Types.ObjectId;
  // The theory (essay) part of the score, typed in by a teacher or admin after
  // they have marked the downloaded script. Only ever present on Theory and
  // Mixed submissions that have been marked; `score` is then the auto-graded
  // MCQ part (Mixed only) plus this. Absent on every older submission, so
  // existing data is unaffected.
  theoryScore?: number;
  // Who entered theoryScore. Not a ref: it is an Admin id or a Staff id
  // depending on `theoryMarkedByRole`.
  theoryMarkedBy?: mongoose.Types.ObjectId;
  theoryMarkedByRole?: "admin" | "staff";
  // Last time the offline-sync endpoint successfully wrote answers for
  // this submission. Purely informational (e.g. for an admin "last seen"
  // column) - the timer itself is always derived from startedAt, never
  // from this.
  lastSyncedAt?: Date;
  // Only present once the exam this submission belongs to has been deleted.
  // `exam` above then simply points at an id that no longer exists, and this
  // snapshot is what the Results pages read instead.
  examSnapshot?: IExamSnapshot;
  createdAt: Date;
  updatedAt: Date;
}

const examSnapshotSchema = new Schema<IExamSnapshot>(
  {
    title: { type: String, required: true },
    subject: { type: Schema.Types.ObjectId, ref: "Subject" },
    subjectName: { type: String, default: "Unknown Subject" },
    isGeneral: { type: Boolean, default: false },
    class: { type: String, enum: CLASS_LEVELS },
    classes: { type: [String], enum: CLASS_LEVELS, default: undefined },
    term: String,
    academicYear: String,
    type: { type: String, enum: EXAM_TYPES, required: true },
    examDate: Date,
    totalMarks: { type: Number, default: 0 },
    theoryQuestionIds: [{ type: Schema.Types.ObjectId }],
    objectiveTotal: { type: Number, default: 0 },
    deletedAt: { type: Date, required: true },
  },
  { _id: false },
);

const submissionSchema = new Schema<ISubmission>(
  {
    exam: {
      type: Schema.Types.ObjectId,
      ref: "Exam",
      required: [true, "Exam is required"],
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Student is required"],
    },
    answers: [
      {
        question: { type: Schema.Types.ObjectId, ref: "Question" },
        selectedOption: String,
        textAnswer: String,
        isCorrect: Boolean,
        marksAwarded: Number,
        updatedAt: Number,
      },
    ],
    scriptUrl: { type: String, trim: true },
    status: {
      type: String,
      enum: { values: SUBMISSION_STATUSES, message: "{VALUE} is not a valid status" },
      default: "Not Started",
    },
    score: { type: Number, default: 0, min: 0 },
    totalMarks: { type: Number, default: 0, min: 0 },
    grade: { type: String, trim: true },
    startedAt: Date,
    submittedAt: Date,
    markedAt: Date,
    markedBy: { type: Schema.Types.ObjectId, ref: "Admin" },
    theoryScore: { type: Number, min: 0 },
    theoryMarkedBy: { type: Schema.Types.ObjectId },
    theoryMarkedByRole: { type: String, enum: ["admin", "staff"] },
    lastSyncedAt: Date,
    examSnapshot: { type: examSnapshotSchema, default: undefined },
  },
  { timestamps: true },
);

// One submission per student per exam.
submissionSchema.index({ exam: 1, student: 1 }, { unique: true });
submissionSchema.index({ exam: 1, status: 1 });
// Finding "results whose exam was deleted" for one class's Results page.
submissionSchema.index({ "examSnapshot.class": 1 });
submissionSchema.index({ "examSnapshot.classes": 1 });

// Auto-grade objective answers and roll the score up whenever answers change.
// Theory answers are left alone here since those are scored manually: a
// teacher or admin types the theory score in after marking the script (see
// applyTheoryScores in lib/results-helpers.ts).
submissionSchema.pre("save", async function (this: ISubmission) {
  if (!this.isModified("answers") || this.answers.length === 0) return;

  const graded = this.answers.filter((a) => typeof a.isCorrect === "boolean");
  if (graded.length > 0) {
    this.score = graded.reduce((sum, a) => sum + (a.marksAwarded ?? 0), 0);
  }
});

// Dev-server hot reload keeps the FIRST compiled Submission model in
// mongoose.models forever, so a newly added path (examSnapshot, theoryScore)
// would be silently dropped from writes until the server is restarted - which
// would make a save "succeed" without storing anything. Discard a cached model
// that predates them so the current schema is registered (same approach as
// the Exam model).
if (
  models.Submission &&
  (!models.Submission.schema.path("examSnapshot") || !models.Submission.schema.path("theoryScore"))
) {
  mongoose.deleteModel("Submission");
}

export const Submission =
  (models.Submission as mongoose.Model<ISubmission>) ||
  model<ISubmission>("Submission", submissionSchema);
