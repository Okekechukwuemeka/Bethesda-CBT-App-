import mongoose, { Schema, models, model, Document } from "mongoose";
import { QUESTION_TYPES, QuestionType } from "./constants";
import { Exam } from "./exam.model";

export interface IQuestion extends Document {
  exam: mongoose.Types.ObjectId;
  text: string;
  type: QuestionType;
  marks: number;
  options?: string[]; // only used when type === "Objective"
  correctAnswer?: string; // only used when type === "Objective"
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const questionSchema = new Schema<IQuestion>(
  {
    exam: {
      type: Schema.Types.ObjectId,
      ref: "Exam",
      required: [true, "Exam is required"],
    },
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
    order: { type: Number, default: 0 },
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
});

// Keep Exam.questionCount / totalMarks in sync so the Exams list page can
// read them directly without an aggregation on every load.
async function syncExamTotals(examId: mongoose.Types.ObjectId) {
  const stats = await model<IQuestion>("Question").aggregate([
    { $match: { exam: examId } },
    { $group: { _id: null, count: { $sum: 1 }, totalMarks: { $sum: "$marks" } } },
  ]);
  const { count = 0, totalMarks = 0 } = stats[0] ?? {};
  await Exam.findByIdAndUpdate(examId, { questionCount: count, totalMarks });
}

questionSchema.post("save", async function (doc) {
  await syncExamTotals(doc.exam as mongoose.Types.ObjectId);
});
questionSchema.post("findOneAndDelete", async function (doc: IQuestion | null) {
  if (doc) await syncExamTotals(doc.exam as mongoose.Types.ObjectId);
});
questionSchema.post(
  "deleteOne",
  { document: true, query: false },
  async function (this: IQuestion) {
    await syncExamTotals(this.exam as mongoose.Types.ObjectId);
  },
);

questionSchema.index({ exam: 1, order: 1 });

export const Question =
  (models.Question as mongoose.Model<IQuestion>) || model<IQuestion>("Question", questionSchema);
