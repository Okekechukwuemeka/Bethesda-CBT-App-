import mongoose, { Schema, models, model, Document } from "mongoose";
import { QUESTION_TYPES, QuestionType, CLASS_LEVELS, ClassLevel } from "./constants";

// Questions live in a reusable bank, independent of any one exam - an exam
// just references the ones it wants (see Exam.questions). That's why a
// question needs its own subject/class here: previously that info was
// borrowed from whichever exam it belonged to, but a bank question isn't
// scoped to a single exam anymore.
export interface IQuestion extends Document {
  text: string;
  type: QuestionType;
  subject: mongoose.Types.ObjectId;
  class: ClassLevel;
  marks: number;
  options?: string[]; // only used when type === "Objective"
  correctAnswer?: string; // only used when type === "Objective"
  // A question that belongs to a comprehension/experiment/data-response
  // group points back at the shared Passage here. Both fields are
  // optional and travel together - a standalone question (the vast
  // majority) simply omits both, unchanged from before this existed.
  passageId?: mongoose.Types.ObjectId;
  passageOrder?: number; // this question's position within its passage group, e.g. 1, 2, 3
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const questionSchema = new Schema<IQuestion>(
  {
    text: {
      type: String,
      required: [true, "Question text is required"],
      trim: true,
    },
    type: {
      type: String,
      required: [true, "Question type is required"],
      enum: { values: QUESTION_TYPES, message: "{VALUE} is not a valid question type" },
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
    marks: {
      type: Number,
      required: [true, "Marks is required"],
      min: [1, "Marks must be at least 1"],
    },
    options: {
      type: [String],
      default: undefined,
    },
    correctAnswer: { type: String, trim: true },
    passageId: {
      type: Schema.Types.ObjectId,
      ref: "Passage",
    },
    passageOrder: {
      type: Number,
      min: [1, "passageOrder must be at least 1"],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      required: [true, "createdBy is required"],
    },
  },
  { timestamps: true },
);

// Objective questions need options + a correct answer to be auto-gradable;
// theory questions are graded manually from the uploaded script, so those
// fields don't apply. Enforced here instead of relying on the frontend form
// alone, since the API could be hit directly.
questionSchema.pre("validate", async function (this: IQuestion) {
  if (this.type === "Objective") {
    if (!this.options || this.options.length < 2) {
      throw new Error("Objective questions require at least 2 options");
    }
    if (!this.correctAnswer) {
      throw new Error("Objective questions require a correct answer");
    }
    if (!this.options.includes(this.correctAnswer)) {
      throw new Error("Correct answer must be one of the provided options");
    }
  }

  // These two fields describe one relationship - a question either
  // belongs to a passage group (both set) or doesn't (neither set).
  // Half-set is always a bug upstream, not a valid state.
  if (Boolean(this.passageId) !== Boolean(this.passageOrder)) {
    throw new Error("passageId and passageOrder must be provided together");
  }
});

// Supports the bank's main filter combinations (by subject+class, by type).
questionSchema.index({ subject: 1, class: 1 });
questionSchema.index({ type: 1 });
// Reassembling a passage's sub-questions in order - e.g. when populating
// an exam session or rendering the passage group in the admin bank table.
questionSchema.index({ passageId: 1, passageOrder: 1 });

export const Question =
  (models.Question as mongoose.Model<IQuestion>) || model<IQuestion>("Question", questionSchema);
