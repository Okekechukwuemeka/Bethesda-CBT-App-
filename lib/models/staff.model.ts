import mongoose, { Schema, models, model, Document } from "mongoose";
import bcrypt from "bcryptjs";

import "./subject.model";
import { CLASS_LEVELS, ClassLevel, STAFF_ROLES, StaffRole } from "./constants";

export interface IStaff extends Document {
  staffId: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  gender?: "Male" | "Female" | "Other";
  role: StaffRole;
  isActive: boolean;
  // Subjects/classes a teacher is cleared to add questions for and view
  // results of - see api-guards.assertTeacherScope for how these two
  // arrays are combined into a "which subject+class pairs" check.
  assignedSubjects: mongoose.Types.ObjectId[];
  assignedClasses: ClassLevel[];
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Mirrors the Student model's admission-number scheme (see student.model.ts)
// but with a single global sequence - staff headcount never approaches the
// volume that would need per-class/per-role scoping.
const STAFF_ID_PREFIX = "BHS-STAFF-";

function generateStaffPassword(firstName: string, lastName: string): string {
  const initials = `${firstName.trim().charAt(0)}${lastName.trim().charAt(0)}`.toUpperCase();
  const digits = String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
  return `${initials}${digits}`;
}

const staffSchema = new Schema<IStaff>(
  {
    staffId: { type: String, unique: true, trim: true },
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, "Username must be at least 3 characters"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    firstName: { type: String, required: [true, "First name is required"], trim: true },
    lastName: { type: String, required: [true, "Last name is required"], trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    gender: { type: String, enum: ["Male", "Female", "Other"] },
    role: {
      type: String,
      required: [true, "Staff role is required"],
      enum: { values: STAFF_ROLES, message: "{VALUE} is not a valid staff role" },
      default: "teacher",
    },
    isActive: { type: Boolean, default: true },
    assignedSubjects: [{ type: Schema.Types.ObjectId, ref: "Subject" }],
    assignedClasses: {
      type: [String],
      enum: { values: CLASS_LEVELS, message: "{VALUE} is not a valid class level" },
      default: [],
    },
    lastLogin: Date,
  },
  { timestamps: true },
);

staffSchema.pre("validate", async function (this: IStaff) {
  if (this.isNew && !this.staffId) {
    const year = new Date().getFullYear();
    const prefix = `${STAFF_ID_PREFIX}${year}-`;
    const count = await Staff.countDocuments({ staffId: { $regex: `^${prefix}` } });
    this.staffId = `${prefix}${String(count + 1).padStart(3, "0")}`;
  }

  if (this.isNew && !this.password) {
    const plain = generateStaffPassword(this.firstName, this.lastName);
    this.password = plain;
    this.$locals.plainPassword = plain;
  }

  // Non-teaching staff aren't assigned a teaching scope - keep this
  // authoritative on the model itself so a stale assignment can't survive
  // a role change from "teacher" to "non_teaching" via PATCH.
  if (this.role === "non_teaching") {
    this.assignedSubjects = [];
    this.assignedClasses = [];
  }
});

staffSchema.pre("save", async function (this: IStaff) {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

staffSchema.methods.comparePassword = async function (
  this: IStaff,
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

staffSchema.virtual("fullName").get(function (this: IStaff) {
  return `${this.firstName} ${this.lastName}`;
});
staffSchema.set("toJSON", { virtuals: true });
staffSchema.set("toObject", { virtuals: true });

staffSchema.index({ role: 1 });
staffSchema.index({ isActive: 1 });
staffSchema.index({ assignedClasses: 1 });

export const Staff =
  (models.Staff as mongoose.Model<IStaff>) || model<IStaff>("Staff", staffSchema);
