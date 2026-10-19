import mongoose, { Schema, models, model, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IAdmin extends Document {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  // Recovery address for the "forgot password" flow. Optional so every admin
  // that already exists keeps working untouched; an admin sets theirs from
  // the Account page (/admin/account).
  email?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const adminSchema = new Schema<IAdmin>(
  {
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
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email address"],
    },
    isActive: { type: Boolean, default: true },
    lastLogin: Date,
  },
  { timestamps: true },
);

// One admin per recovery email. Partial (only documents that actually have an
// email) so the many existing admins WITHOUT one never collide with each other.
adminSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { email: { $type: "string" } } },
);

adminSchema.pre("save", async function (this: IAdmin) {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

adminSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

adminSchema.virtual("fullName").get(function (this: IAdmin) {
  return `${this.firstName} ${this.lastName}`;
});
adminSchema.set("toJSON", { virtuals: true });
adminSchema.set("toObject", { virtuals: true });

export const Admin =
  (models.Admin as mongoose.Model<IAdmin>) || model<IAdmin>("Admin", adminSchema);
