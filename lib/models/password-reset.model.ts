import mongoose, { Schema, models, model, Document } from "mongoose";

// One document per admin/staff account that has asked for a password-reset
// code. It holds the HASH of the current six-digit code (never the code
// itself) plus the counters that rate-limit requests and wrong guesses.
//
// Students are intentionally absent: they have no self-service recovery - an
// admin resets a student's password instead.

export const RESET_ACCOUNT_TYPES = ["admin", "staff"] as const;
export type ResetAccountType = (typeof RESET_ACCOUNT_TYPES)[number];

export interface IPasswordReset extends Document {
  accountType: ResetAccountType;
  account: mongoose.Types.ObjectId;
  // HMAC-SHA256 of the OTP (see lib/password-reset.ts) - the plain code only
  // ever exists in the email that was sent.
  otpHash: string;
  // When the current code stops being valid (minutes after it was sent).
  otpExpiresAt: Date;
  // Wrong guesses against the current code; it is burned after too many.
  attempts: number;
  // Request rate limiting: a minimum gap between emails, and a cap per window.
  lastSentAt: Date;
  windowStartedAt: Date;
  sendCount: number;
  // MongoDB TTL: the whole document (counters included) is purged
  // automatically once the request window is over.
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const passwordResetSchema = new Schema<IPasswordReset>(
  {
    accountType: { type: String, enum: RESET_ACCOUNT_TYPES, required: true },
    account: { type: Schema.Types.ObjectId, required: true },
    otpHash: { type: String, required: true },
    otpExpiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0, min: 0 },
    lastSentAt: { type: Date, required: true },
    windowStartedAt: { type: Date, required: true },
    sendCount: { type: Number, default: 1, min: 0 },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

// A single live record per account: asking for a new code replaces the old one.
passwordResetSchema.index({ accountType: 1, account: 1 }, { unique: true });
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PasswordReset =
  (models.PasswordReset as mongoose.Model<IPasswordReset>) ||
  model<IPasswordReset>("PasswordReset", passwordResetSchema);
