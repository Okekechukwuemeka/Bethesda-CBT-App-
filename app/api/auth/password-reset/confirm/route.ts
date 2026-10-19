import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { PasswordReset } from "@/lib/models/password-reset.model";
import { sendPasswordChangedEmail } from "@/lib/mailer";
import { validateNewPassword } from "@/lib/password-policy";
import {
  OTP_MAX_ATTEMPTS,
  findRecoverableAccount,
  isResetRole,
  isValidOtpFormat,
  otpMatches,
} from "@/lib/password-reset";

// POST /api/auth/password-reset/confirm
// Body: { role, identifier, otp, newPassword }
//
// Checks the six-digit code and, only if it is right, unused and unexpired,
// sets the new password (hashed with bcrypt by the model's pre-save hook).
//
// Every failure about the code or the account - no such account, no code
// requested, wrong, expired, already used - returns the SAME message, so this
// endpoint can't be used to find out which accounts exist.

const INVALID_CODE = "That code is not valid or has expired. Please request a new one.";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    role?: unknown;
    identifier?: unknown;
    otp?: unknown;
    newPassword?: unknown;
  } | null;

  if (!body || !isResetRole(body.role) || typeof body.identifier !== "string") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (!isValidOtpFormat(body.otp)) {
    return NextResponse.json({ error: "The code must be exactly 6 digits." }, { status: 400 });
  }
  const { role, identifier, otp } = body as { role: "admin" | "staff"; identifier: string; otp: string };

  try {
    await connectDB();
    const account = await findRecoverableAccount(role, identifier);
    if (!account) return NextResponse.json({ error: INVALID_CODE }, { status: 400 });

    const reset = await PasswordReset.findOne({
      accountType: account.accountType,
      account: account.doc._id,
    });
    if (!reset || reset.otpExpiresAt.getTime() <= Date.now() || reset.attempts >= OTP_MAX_ATTEMPTS) {
      return NextResponse.json({ error: INVALID_CODE }, { status: 400 });
    }

    // Count this guess BEFORE checking it (atomically), so parallel requests
    // can't squeeze extra attempts in. The filter re-checks the cap, so only
    // OTP_MAX_ATTEMPTS guesses are ever evaluated per code.
    const counted = await PasswordReset.findOneAndUpdate(
      { _id: reset._id, attempts: { $lt: OTP_MAX_ATTEMPTS } },
      { $inc: { attempts: 1 } },
      { new: true },
    );
    if (!counted) return NextResponse.json({ error: INVALID_CODE }, { status: 400 });

    if (!otpMatches(account.accountType, account.id, otp, counted.otpHash)) {
      const remaining = OTP_MAX_ATTEMPTS - counted.attempts;
      return NextResponse.json(
        {
          error:
            remaining > 0
              ? `That code is not correct. You have ${remaining} ${remaining === 1 ? "attempt" : "attempts"} left.`
              : "That code is not correct and has now been cancelled. Please request a new one.",
        },
        { status: 400 },
      );
    }

    // The code is right - now the new password itself must be acceptable. A
    // weak password does NOT burn the code, so the person can simply pick a
    // better one (the guess counter above already protects the code).
    const policyError = validateNewPassword(body.newPassword, { username: account.username });
    if (policyError) return NextResponse.json({ error: policyError }, { status: 400 });

    // Single use: claim the record first. If a parallel request already used
    // it, deleteOne reports 0 and this one is refused.
    const claimed = await PasswordReset.deleteOne({ _id: reset._id });
    if (claimed.deletedCount !== 1) {
      return NextResponse.json({ error: INVALID_CODE }, { status: 400 });
    }

    account.doc.password = body.newPassword as string; // hashed in the pre-save hook
    await account.doc.save();

    // Best effort: the password is already changed, so a mail hiccup here must
    // not turn a success into an error.
    void sendPasswordChangedEmail({ to: account.email, firstName: account.firstName });

    return NextResponse.json({ success: true, message: "Your password has been reset. You can now log in." });
  } catch (error) {
    console.error("[password-reset/confirm]", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
