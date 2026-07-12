import mongoose, { Schema, models, model, Document } from "mongoose";
import { SUBMISSION_STATUSES, SubmissionStatus } from "./constants";

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
  // Last time the offline-sync endpoint successfully wrote answers for
  // this submission. Purely informational (e.g. for an admin "last seen"
  // column) - the timer itself is always derived from startedAt, never
  // from this.
  lastSyncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

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
    lastSyncedAt: Date,
  },
  { timestamps: true },
);

// One submission per student per exam.
submissionSchema.index({ exam: 1, student: 1 }, { unique: true });
submissionSchema.index({ exam: 1, status: 1 });

// Auto-grade objective answers and roll the score up whenever answers change.
// Theory answers are left alone here since those are scored manually via
// markedBy/markedAt once a human reviews the uploaded script.
submissionSchema.pre("save", async function (this: ISubmission) {
  if (!this.isModified("answers") || this.answers.length === 0) return;

  const graded = this.answers.filter((a) => typeof a.isCorrect === "boolean");
  if (graded.length > 0) {
    this.score = graded.reduce((sum, a) => sum + (a.marksAwarded ?? 0), 0);
  }
});

export const Submission =
  (models.Submission as mongoose.Model<ISubmission>) ||
  model<ISubmission>("Submission", submissionSchema);
