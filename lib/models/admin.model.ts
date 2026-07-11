import mongoose, { Schema, models, model, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IAdmin extends Document {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
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
    isActive: { type: Boolean, default: true },
    lastLogin: Date,
  },
  { timestamps: true },
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
