import mongoose, { Schema, models, model, Document } from "mongoose";

export interface ISubject extends Document {
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const subjectSchema = new Schema<ISubject>(
  {
    name: {
      type: String,
      required: [true, "Subject name is required"],
      trim: true,
      unique: true,
    },
    code: {
      type: String,
      required: [true, "Subject code is required"],
      trim: true,
      uppercase: true,
      unique: true,
    },
    description: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

subjectSchema.index({ isActive: 1 });

export const Subject =
  (models.Subject as mongoose.Model<ISubject>) || model<ISubject>("Subject", subjectSchema);
