import mongoose, { Schema, models, model, Document } from "mongoose";
import bcrypt from "bcryptjs";
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
  password: string;
  // Forces a password reset on first login — set true whenever an admin
  // assigns/resets a student's password, so a shared/guessed initial
  // password can't be reused indefinitely.
  // mustChangePassword: boolean;
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
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const studentSchema = new Schema<IStudent>(
  {
    admissionNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    // mustChangePassword: { type: Boolean, default: true },
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
studentSchema.pre("validate", async function (this: IStudent) {
  if (this.isNew && !this.admissionNumber) {
    const year = new Date().getFullYear();
    const count = await Student.countDocuments();
    this.admissionNumber = `BHS-${year}-${String(count + 1).padStart(3, "0")}`;
  }

  if (this.isNew && !this.password) {
    const plain = generateStudentPassword();
    this.password = plain;
    this.$locals.plainPassword = plain;
  }
});

function generateStudentPassword(): string {
  // 6 digits, zero-padded, e.g. "042817".
  return String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
}

// Hash password before saving, only when it's actually changed — same
// pattern as Admin. Runs as its own pre-save hook so it stays independent
// of the admission-number generation above (Mongoose runs pre-save hooks
// in the order they're registered).
studentSchema.pre("save", async function (this: IStudent) {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

studentSchema.methods.comparePassword = async function (
  this: IStudent,
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

studentSchema.virtual("fullName").get(function (this: IStudent) {
  return `${this.firstName} ${this.lastName}`;
});
studentSchema.set("toJSON", { virtuals: true });
studentSchema.set("toObject", { virtuals: true });

studentSchema.index({ class: 1 });
studentSchema.index({ isActive: 1 });

export const Student =
  (models.Student as mongoose.Model<IStudent>) || model<IStudent>("Student", studentSchema);
