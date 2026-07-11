import mongoose, { Schema, models, model, Document } from "mongoose";
import { CLASS_LEVELS, ClassLevel } from "./constants";

export interface ICompletedExam {
  exam: mongoose.Types.ObjectId;
  score: number;
  grade: string;
  completedAt: Date;
}

export interface IClassHistoryEntry {
  class: ClassLevel;
  academicYear: string;
  from: Date;
  to?: Date;
}

export interface IStudent extends Document {
  admissionNumber: string;
  firstName: string;
  lastName: string;
  class: ClassLevel;
  gender?: "Male" | "Female" | "Other";
  dateOfBirth?: Date;
  address?: string;
  isActive: boolean;
  enrolledExams: mongoose.Types.ObjectId[];
  completedExams: ICompletedExam[];
  classHistory: IClassHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const studentSchema = new Schema<IStudent>(
  {
    admissionNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    firstName: { type: String, required: [true, "First name is required"], trim: true },
    lastName: { type: String, required: [true, "Last name is required"], trim: true },
    // Class levels are a fixed, known set (JSS1 -> graduated), so this is a
    // plain enum rather than a ref to a separate Class collection.
    class: {
      type: String,
      required: [true, "Class is required"],
      enum: { values: CLASS_LEVELS, message: "{VALUE} is not a valid class level" },
    },
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    dateOfBirth: {
      type: Date,
      validate: {
        validator: function (value: Date) {
          if (!value) return true;
          const minAge = new Date();
          minAge.setFullYear(minAge.getFullYear() - 5);
          return value <= minAge;
        },
        message: "Student must be at least 5 years old",
      },
    },
    address: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    enrolledExams: [{ type: Schema.Types.ObjectId, ref: "Exam" }],
    completedExams: [
      {
        exam: { type: Schema.Types.ObjectId, ref: "Exam" },
        score: Number,
        grade: String,
        completedAt: Date,
      },
    ],
    classHistory: [
      {
        class: { type: String, enum: CLASS_LEVELS },
        academicYear: String,
        from: Date,
        to: Date,
      },
    ],
  },
  { timestamps: true },
);

// Auto-generate the admission number if one wasn't provided, in the format
// used across the admin frontend (BHS-<year>-<sequence>). Adjust the "BHS"
// prefix if the school's short code differs.
//
// No `next` parameter here on purpose: async pre-save hooks can just
// return/throw, and Mongoose treats a thrown error the same as calling
// next(error). This also avoids the "SaveOptions has no call signatures"
// TS overload issue that turning up when a `next` param is declared.
studentSchema.pre("save", async function (this: IStudent) {
  if (this.isNew && !this.admissionNumber) {
    const year = new Date().getFullYear();
    const count = await Student.countDocuments();
    this.admissionNumber = `BHS-${year}-${String(count + 1).padStart(3, "0")}`;
  }
});

studentSchema.virtual("fullName").get(function (this: IStudent) {
  return `${this.firstName} ${this.lastName}`;
});
studentSchema.set("toJSON", { virtuals: true });
studentSchema.set("toObject", { virtuals: true });

studentSchema.index({ class: 1 });
studentSchema.index({ isActive: 1 });

export const Student =
  (models.Student as mongoose.Model<IStudent>) || model<IStudent>("Student", studentSchema);
