import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

// Email delivery for account-related messages (password-recovery OTPs, "your
// password was changed" notices). There is no bulk/enterprise mail service in
// this project, so a Gmail account sends everything over Gmail SMTP.
//
// Configuration comes ONLY from server-side environment variables - nothing
// here is ever sent to the browser, and no credential is hardcoded:
//
//   GMAIL_USER          the Gmail address that sends the mail
//   GMAIL_APP_PASSWORD  a Google *App Password* (16 characters) for that
//                       account - NOT the normal Google password. Google shows
//                       it in groups of four separated by spaces; the spaces
//                       are stripped here, so it can be pasted exactly as shown.
//   MAIL_FROM_NAME      optional display name, defaults to "Bethesda CBT"
//
// An App Password needs 2-Step Verification switched on for the Gmail account
// (Google Account -> Security -> 2-Step Verification -> App passwords).

export type MailFailureReason =
  | "not-configured" // GMAIL_USER / GMAIL_APP_PASSWORD missing
  | "auth" // Gmail rejected the credentials (wrong/revoked App Password)
  | "network" // could not reach Gmail, or the connection timed out
  | "rejected" // Gmail refused this particular message/recipient
  | "unknown";

export type MailResult = { ok: true } | { ok: false; reason: MailFailureReason };

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

interface MailerCache {
  transporter: Transporter | null;
  // The credentials the cached transporter was built with, so changing the
  // env vars (dev server restart aside) never leaves a stale transporter.
  fingerprint: string | null;
}

declare global {
  var _mailerCache: MailerCache | undefined;
}

const cache: MailerCache = global._mailerCache ?? { transporter: null, fingerprint: null };
global._mailerCache = cache;

function readConfig(): { user: string; pass: string; fromName: string } | null {
  const user = process.env.GMAIL_USER?.trim();
  // Google displays App Passwords as "abcd efgh ijkl mnop" - remove the spaces.
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "");
  if (!user || !pass) return null;
  return { user, pass, fromName: process.env.MAIL_FROM_NAME?.trim() || "Bethesda CBT" };
}

// True when the server has what it needs to send mail. Routes use this to fail
// fast (and identically for every request) before generating anything.
export function isMailConfigured(): boolean {
  return readConfig() !== null;
}

function getTransporter(config: { user: string; pass: string }): Transporter {
  const fingerprint = `${config.user}:${config.pass.length}`;
  if (cache.transporter && cache.fingerprint === fingerprint) return cache.transporter;

  cache.transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // implicit TLS on 465
    auth: { user: config.user, pass: config.pass },
    // Without these a hung SMTP connection would hold the request open for
    // minutes - fail in seconds instead so the user gets a clear error.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });
  cache.fingerprint = fingerprint;
  return cache.transporter;
}

function classifyError(error: unknown): MailFailureReason {
  const err = error as { code?: string; responseCode?: number } | null;
  const code = err?.code;
  if (code === "EAUTH" || err?.responseCode === 535) return "auth";
  if (code === "EENVELOPE" || (err?.responseCode && err.responseCode >= 550)) return "rejected";
  if (
    code === "ECONNECTION" ||
    code === "ETIMEDOUT" ||
    code === "ESOCKET" ||
    code === "ECONNRESET" ||
    code === "ENOTFOUND" ||
    code === "EDNS"
  ) {
    return "network";
  }
  return "unknown";
}

// Never throws: callers get a result they can turn into a proper HTTP
// response. Only the failure *category* is logged - never the message body
// (which holds the OTP) or the credentials.
export async function sendEmail(message: MailMessage): Promise<MailResult> {
  const config = readConfig();
  if (!config) {
    console.error(
      "[mailer] GMAIL_USER and/or GMAIL_APP_PASSWORD are not set - cannot send email.",
    );
    return { ok: false, reason: "not-configured" };
  }

  try {
    await getTransporter(config).sendMail({
      from: { name: config.fromName, address: config.user },
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
    return { ok: true };
  } catch (error) {
    const reason = classifyError(error);
    console.error(`[mailer] Sending failed (${reason}).`, (error as Error)?.message);
    if (reason === "auth") {
      // The transporter holds the rejected credentials - drop it so a fixed
      // env var is picked up on the next attempt.
      cache.transporter = null;
      cache.fingerprint = null;
    }
    return { ok: false, reason };
  }
}

// ---- Message templates -----------------------------------------------------

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function layout(heading: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:24px;background:#E8F0FE;font-family:Arial,Helvetica,sans-serif;color:#1A1A1A;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #B8D0E8;border-radius:12px;overflow:hidden;">
      <div style="background:#1A3A5C;padding:20px 24px;">
        <h1 style="margin:0;font-size:20px;color:#ffffff;">${escapeHtml(heading)}</h1>
      </div>
      <div style="padding:24px;font-size:15px;line-height:1.5;">${bodyHtml}</div>
      <div style="padding:12px 24px;background:#F8FAFE;border-top:1px solid #E8EEF5;font-size:12px;color:#5A6B7D;">
        Bethesda Home &amp; School for the Blind &mdash; CBT platform. This is an automated message; please do not reply.
      </div>
    </div>
  </body>
</html>`;
}

export function sendPasswordResetOtpEmail(params: {
  to: string;
  firstName: string;
  otp: string;
  expiresInMinutes: number;
}): Promise<MailResult> {
  const { to, firstName, otp, expiresInMinutes } = params;
  // The OTP is also spelled out digit by digit in the plain-text part, which
  // is what a screen reader will read most clearly.
  const spaced = otp.split("").join(" ");

  return sendEmail({
    to,
    subject: "Your Bethesda CBT password reset code",
    text:
      `Hello ${firstName},\n\n` +
      `Your password reset code is: ${otp}\n` +
      `(${spaced})\n\n` +
      `It expires in ${expiresInMinutes} minutes and can only be used once.\n\n` +
      `If you did not ask to reset your password, you can ignore this email - ` +
      `your password has not been changed. Never share this code with anyone.`,
    html: layout(
      "Password reset code",
      `<p>Hello ${escapeHtml(firstName)},</p>
       <p>Use this code to reset your password:</p>
       <p style="font-size:32px;font-weight:bold;letter-spacing:8px;text-align:center;margin:20px 0;color:#1A3A5C;">${escapeHtml(otp)}</p>
       <p>It expires in <strong>${expiresInMinutes} minutes</strong> and can only be used once.</p>
       <p style="color:#5A6B7D;">If you did not ask to reset your password, you can ignore this email &mdash; your password has not been changed. Never share this code with anyone.</p>`,
    ),
  });
}

export function sendPasswordChangedEmail(params: {
  to: string;
  firstName: string;
}): Promise<MailResult> {
  const { to, firstName } = params;
  const when = new Date().toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  });

  return sendEmail({
    to,
    subject: "Your Bethesda CBT password was changed",
    text:
      `Hello ${firstName},\n\n` +
      `The password for your Bethesda CBT account was changed on ${when} (WAT).\n\n` +
      `If this was you, no further action is needed. If it was not you, ` +
      `contact the school administrator immediately.`,
    html: layout(
      "Password changed",
      `<p>Hello ${escapeHtml(firstName)},</p>
       <p>The password for your Bethesda CBT account was changed on <strong>${escapeHtml(when)}</strong> (WAT).</p>
       <p>If this was you, no further action is needed. If it was <strong>not</strong> you, contact the school administrator immediately.</p>`,
    ),
  });
}

export function sendEmailAddressUpdatedEmail(params: {
  to: string;
  firstName: string;
}): Promise<MailResult> {
  const { to, firstName } = params;
  return sendEmail({
    to,
    subject: "Your Bethesda CBT recovery email was set",
    text:
      `Hello ${firstName},\n\n` +
      `This address has been set as the recovery email for your Bethesda CBT account. ` +
      `Password reset codes will be sent here.\n\n` +
      `If you did not expect this, contact the school administrator.`,
    html: layout(
      "Recovery email set",
      `<p>Hello ${escapeHtml(firstName)},</p>
       <p>This address has been set as the recovery email for your Bethesda CBT account. Password reset codes will be sent here.</p>
       <p style="color:#5A6B7D;">If you did not expect this, contact the school administrator.</p>`,
    ),
  });
}

// Sent when an admin creates a staff account that has an email address: the
// login details, plus a link to choose their own password if they wish.
export function sendStaffWelcomeEmail(params: {
  to: string;
  firstName: string;
  username: string;
  tempPassword: string;
  loginUrl: string;
  changePasswordUrl: string;
}): Promise<MailResult> {
  const { to, firstName, username, tempPassword, loginUrl, changePasswordUrl } = params;

  return sendEmail({
    to,
    subject: "Your Bethesda CBT staff account",
    text:
      `Hello ${firstName},\n\n` +
      `A staff account has been created for you on Bethesda CBT.\n\n` +
      `Username: ${username}\n` +
      `Temporary password: ${tempPassword}\n\n` +
      `Log in here: ${loginUrl}\n\n` +
      `If you would like to choose your own password, use this link: ${changePasswordUrl}\n` +
      `(Enter your username and we will email you a 6-digit code.)\n\n` +
      `Keep these details private.`,
    html: layout(
      "Your staff account",
      `<p>Hello ${escapeHtml(firstName)},</p>
       <p>A staff account has been created for you on Bethesda CBT.</p>
       <table style="margin:16px 0;border-collapse:collapse;">
         <tr><td style="padding:4px 16px 4px 0;color:#5A7A9A;">Username</td><td style="font-family:monospace;font-weight:bold;">${escapeHtml(username)}</td></tr>
         <tr><td style="padding:4px 16px 4px 0;color:#5A7A9A;">Temporary password</td><td style="font-family:monospace;font-weight:bold;">${escapeHtml(tempPassword)}</td></tr>
       </table>
       <p><a href="${escapeHtml(loginUrl)}" style="display:inline-block;background:#1A3A5C;color:#ffffff;padding:10px 20px;border-radius:8px;text-decoration:none;">Log in</a></p>
       <p style="margin-top:24px;padding-top:16px;border-top:1px solid #E8EEF5;">Would you like to choose your own password? <a href="${escapeHtml(changePasswordUrl)}" style="color:#2B6CB0;">Change my password</a><br/><span style="color:#5A7A9A;font-size:13px;">Enter your username and we will email you a 6-digit code.</span></p>
       <p style="color:#5A7A9A;">Keep these details private.</p>`,
    ),
  });
}
