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
  firstName: string;
  lastName: string;
  class: ClassLevel;
  gender?: "Male" | "Female" | "Other";
  isActive: boolean;
  enrolledExams: mongoose.Types.ObjectId[];
  completedExams: ICompletedExam[];
  classHistory: IClassHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Assigns each class level a fixed 2-digit code used in the admission
// number, e.g. BHS-2026-01-001 for the first SSS3 student registered.
// Codes run from most senior (01) to most junior - adjust freely, this
// mapping only needs to stay stable once students have been admitted
// under it, since existing admission numbers are never regenerated.
const CLASS_CODE_MAP: Record<ClassLevel, string> = {
  SSS3: "01",
  SSS2: "02",
  SSS1: "03",
  JSS3: "04",
  JSS2: "05",
  JSS1: "06",
  Primary6: "07",
  Primary5: "08",
  Primary4: "09",
  Primary3: "10",
  Primary2: "11",
  Primary1: "12",
  graduated: "00",
};

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
    firstName: { type: String, required: [true, "First name is required"], trim: true },
    lastName: { type: String, required: [true, "Last name is required"], trim: true },
    class: {
      type: String,
      required: [true, "Class is required"],
      enum: { values: CLASS_LEVELS, message: "{VALUE} is not a valid class level" },
    },
    gender: { type: String, enum: ["Male", "Female", "Other"] },
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

// e.g. "Alexander Rengkat" -> "AR" + 6 random digits, e.g. "AR034643".
// Not cryptographically meaningful as a password on its own (predictable
// prefix), but combined with mustChangePassword-style first-login flows
// this is meant as a memorable temporary credential, not a permanent one.
function generateStudentPassword(firstName: string, lastName: string): string {
  const initials = `${firstName.trim().charAt(0)}${lastName.trim().charAt(0)}`.toUpperCase();
  const digits = String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
  return `${initials}${digits}`;
}

// Auto-generates BOTH admission number and password if not provided.
// Admission numbers are scoped per class code (BHS-<year>-<classCode>-<seq>)
// so each class has its own independent sequence starting at 001, rather
// than one global counter shared across every class.
studentSchema.pre("validate", async function (this: IStudent) {
  if (this.isNew && !this.admissionNumber) {
    const year = new Date().getFullYear();
    const classCode = CLASS_CODE_MAP[this.class] ?? "00";
    const prefix = `BHS-${year}-${classCode}-`;
    const count = await Student.countDocuments({
      admissionNumber: { $regex: `^${prefix}` },
    });
    this.admissionNumber = `${prefix}${String(count + 1).padStart(3, "0")}`;
  }

  if (this.isNew && !this.password) {
    const plain = generateStudentPassword(this.firstName, this.lastName);
    this.password = plain;
    this.$locals.plainPassword = plain;
  }
});

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
