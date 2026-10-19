import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { PasswordReset } from "@/lib/models/password-reset.model";
import { isMailConfigured, sendPasswordResetOtpEmail } from "@/lib/mailer";
import {
  OTP_MAX_SENDS_PER_WINDOW,
  OTP_RESEND_COOLDOWN_SECONDS,
  OTP_TTL_MINUTES,
  OTP_WINDOW_MINUTES,
  findRecoverableAccount,
  generateOtp,
  hashOtp,
  isResetRole,
} from "@/lib/password-reset";

// POST /api/auth/password-reset/request
// Body: { role: "admin" | "staff", identifier: string }   (email OR username)
//
// Emails a six-digit, single-use, time-limited code to the account's
// REGISTERED email address. Public (no session) - that is the whole point -
// so it is written not to give anything away:
//   - the response is identical whether or not an account matches, and
//   - repeat requests inside the cooldown / hourly cap are silently ignored.
// Students are not accepted: they have no self-service recovery.

const GENERIC_RESPONSE = {
  message:
    "If an account matches what you entered and has a registered email address, a 6-digit code has been sent to it.",
  cooldownSeconds: OTP_RESEND_COOLDOWN_SECONDS,
  expiresInMinutes: OTP_TTL_MINUTES,
};

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    role?: unknown;
    identifier?: unknown;
  } | null;

  if (!body || !isResetRole(body.role)) {
    return NextResponse.json(
      { error: "Password recovery is only available for staff and admin accounts." },
      { status: 400 },
    );
  }
  if (typeof body.identifier !== "string" || !body.identifier.trim()) {
    return NextResponse.json(
      { error: "Please enter your email address or username." },
      { status: 400 },
    );
  }

  // Same answer for every visitor (it says nothing about any account), so it is
  // safe to fail early and clearly when the server simply cannot send mail.
  if (!isMailConfigured()) {
    return NextResponse.json(
      { error: "Password recovery by email is not available right now. Please contact the administrator." },
      { status: 503 },
    );
  }

  try {
    await connectDB();
    const account = await findRecoverableAccount(body.role, body.identifier);
    if (!account) return NextResponse.json(GENERIC_RESPONSE);

    const now = new Date();
    const existing = await PasswordReset.findOne({
      accountType: account.accountType,
      account: account.doc._id,
    });

    let windowStartedAt = now;
    let sendCount = 1;
    if (existing) {
      const secondsSinceLast = (now.getTime() - existing.lastSentAt.getTime()) / 1000;
      if (secondsSinceLast < OTP_RESEND_COOLDOWN_SECONDS) {
        return NextResponse.json(GENERIC_RESPONSE); // too soon - ignore quietly
      }
      const windowAgeMinutes = (now.getTime() - existing.windowStartedAt.getTime()) / 60_000;
      if (windowAgeMinutes < OTP_WINDOW_MINUTES) {
        if (existing.sendCount >= OTP_MAX_SENDS_PER_WINDOW) {
          return NextResponse.json(GENERIC_RESPONSE); // hourly cap reached
        }
        windowStartedAt = existing.windowStartedAt;
        sendCount = existing.sendCount + 1;
      }
    }

    const otp = generateOtp();
    const otpHash = hashOtp(account.accountType, account.id, otp);

    // Upsert replaces any earlier code (only the newest one ever works) and
    // resets the wrong-guess counter.
    await PasswordReset.findOneAndUpdate(
      { accountType: account.accountType, account: account.doc._id },
      {
        $set: {
          otpHash,
          otpExpiresAt: new Date(now.getTime() + OTP_TTL_MINUTES * 60_000),
          attempts: 0,
          lastSentAt: now,
          windowStartedAt,
          sendCount,
          expiresAt: new Date(windowStartedAt.getTime() + OTP_WINDOW_MINUTES * 60_000),
        },
      },
      { upsert: true, setDefaultsOnInsert: true },
    );

    const sent = await sendPasswordResetOtpEmail({
      to: account.email,
      firstName: account.firstName,
      otp,
      expiresInMinutes: OTP_TTL_MINUTES,
    });

    if (!sent.ok) {
      // Nothing reached the inbox, so the code must not stay usable, and the
      // person should be able to try again straight away.
      await PasswordReset.updateOne(
        { accountType: account.accountType, account: account.doc._id },
        {
          $set: { otpExpiresAt: new Date(0), lastSentAt: new Date(0) },
          $inc: { sendCount: -1 },
        },
      );
      return NextResponse.json(
        { error: "We could not send the email right now. Please try again in a few minutes." },
        { status: 502 },
      );
    }

    return NextResponse.json(GENERIC_RESPONSE);
  } catch (error) {
    console.error("[password-reset/request]", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
