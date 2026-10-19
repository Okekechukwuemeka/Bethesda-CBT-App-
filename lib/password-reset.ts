import { createHmac, randomInt, timingSafeEqual } from "crypto";
import type { Document } from "mongoose";
import { Admin } from "@/lib/models/admin.model";
import { Staff } from "@/lib/models/staff.model";
import type { ResetAccountType } from "@/lib/models/password-reset.model";

// Server-side building blocks for the admin/staff "forgot password" flow
// (see app/api/auth/password-reset/*). Students never go through this - an
// admin resets a student's password (app/api/admin/students/[id]/reset-password).

export const OTP_LENGTH = 6;
export const OTP_TTL_MINUTES = 10;
// Wrong guesses allowed against one code before it is burned. Six digits is
// only a million possibilities, so this cap (together with the expiry) is what
// makes guessing it impractical.
export const OTP_MAX_ATTEMPTS = 5;
// Minimum gap between two emails to the same account.
export const OTP_RESEND_COOLDOWN_SECONDS = 60;
// At most this many emails to one account per window.
export const OTP_MAX_SENDS_PER_WINDOW = 5;
export const OTP_WINDOW_MINUTES = 60;

// crypto.randomInt is a CSPRNG (unlike Math.random), and padding keeps
// leading zeros so "004213" is as likely as any other code.
export function generateOtp(): string {
  return String(randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, "0");
}

function otpSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is not set - cannot protect password reset codes");
  return secret;
}

// Keyed hash (HMAC) rather than a plain hash: a six-digit code could be
// brute-forced offline from a leaked database in microseconds if it were just
// SHA-256'd, but without the server secret the stored value is useless. The
// account is mixed in so the same code never hashes the same way twice.
export function hashOtp(accountType: ResetAccountType, accountId: string, otp: string): string {
  return createHmac("sha256", otpSecret()).update(`${accountType}:${accountId}:${otp}`).digest("hex");
}

export function otpMatches(
  accountType: ResetAccountType,
  accountId: string,
  otp: string,
  storedHash: string,
): boolean {
  const candidate = Buffer.from(hashOtp(accountType, accountId, otp), "hex");
  const stored = Buffer.from(storedHash, "hex");
  // Constant-time comparison; lengths are equal for any valid hash.
  return candidate.length === stored.length && timingSafeEqual(candidate, stored);
}

export function isValidOtpFormat(value: unknown): value is string {
  return typeof value === "string" && new RegExp(`^\\d{${OTP_LENGTH}}$`).test(value);
}

export function isResetRole(value: unknown): value is ResetAccountType {
  return value === "admin" || value === "staff";
}

export interface RecoverableAccount {
  accountType: ResetAccountType;
  id: string;
  firstName: string;
  username: string;
  email: string;
  // The underlying Mongoose document, loaded with its password field so a new
  // password can be assigned and saved (the model's pre-save hook hashes it).
  doc: Document & { password: string };
}

// Finds the ACTIVE admin/staff account for what the person typed: an email
// address or a username (the thing they actually remember). Returns null when
// there is no unambiguous match OR the account has no email on file to send a
// code to - callers must treat every "null" identically so the response never
// reveals whether an account exists.
export async function findRecoverableAccount(
  accountType: ResetAccountType,
  identifier: string,
): Promise<RecoverableAccount | null> {
  const value = identifier.trim().toLowerCase();
  if (!value || value.length > 254) return null;

  const query = value.includes("@")
    ? { email: value, isActive: true }
    : { username: value, isActive: true };

  if (accountType === "admin") {
    const matches = await Admin.find(query).select("+password").limit(2);
    return toRecoverable("admin", matches);
  }
  const matches = await Staff.find(query).select("+password").limit(2);
  return toRecoverable("staff", matches);
}

function toRecoverable(
  accountType: ResetAccountType,
  matches: Array<
    Document & {
      password: string;
      firstName: string;
      username: string;
      email?: string;
    }
  >,
): RecoverableAccount | null {
  // Staff emails are not unique in the schema. If two accounts share one, there
  // is no safe way to pick - nothing is sent (the admin must fix the data).
  if (matches.length !== 1) {
    if (matches.length > 1) {
      console.warn(`[password-reset] More than one ${accountType} account matches - skipped.`);
    }
    return null;
  }
  const account = matches[0];
  if (!account.email) return null;
  return {
    accountType,
    id: String(account._id),
    firstName: account.firstName,
    username: account.username,
    email: account.email,
    doc: account,
  };
}

// Temporary password for a student whose password an admin resets. Same
// shape students already know from account creation (their two initials plus
// six digits - easy to read out and type, including by a blind student), but
// drawn from a CSPRNG instead of Math.random.
export function generateTemporaryPassword(firstName: string, lastName: string): string {
  const initials = `${firstName.trim().charAt(0)}${lastName.trim().charAt(0)}`.toUpperCase();
  const digits = String(randomInt(0, 1_000_000)).padStart(6, "0");
  return `${initials}${digits}`;
}
