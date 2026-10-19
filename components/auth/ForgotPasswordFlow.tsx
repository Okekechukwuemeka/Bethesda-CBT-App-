"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Input from "@/components/auth/Input";
import PasswordInput from "@/components/auth/PasswordInput";
import StatusMessage from "@/components/auth/StatusMessage";
import LoadingButton from "@/components/auth/LoadingButton";
import { PASSWORD_REQUIREMENTS_TEXT, validateNewPassword } from "@/lib/password-policy";

// The whole "forgot password" journey for admin and staff accounts, shared by
// /admin/forgot-password and /staff/forgot-password:
//
//   1. request  - enter email or username; a 6-digit code is emailed
//   2. reset    - enter the code and a new password
//   3. done     - confirmation and a link back to the login page
//
// Students never see this - an admin resets a student's password for them.

type Step = "request" | "reset" | "done";

interface StatusMessageData {
  type: "success" | "error" | "warning";
  text: string;
}

interface ForgotPasswordFlowProps {
  role: "admin" | "staff";
  loginHref: string;
}

const RESEND_COOLDOWN_SECONDS = 60;
const OTP_LENGTH = 6;

async function readJson(res: Response): Promise<{ error?: string; message?: string }> {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

const ForgotPasswordFlow: React.FC<ForgotPasswordFlowProps> = ({ role, loginHref }) => {
  const roleLabel = role === "admin" ? "admin" : "staff";

  const [step, setStep] = useState<Step>("request");
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<StatusMessageData | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const identifierRef = useRef<HTMLInputElement>(null);
  const otpRef = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Put keyboard / screen-reader focus where the person needs to be after
  // every step change, instead of leaving it on a control that just vanished.
  useEffect(() => {
    if (step === "request") identifierRef.current?.focus();
    if (step === "reset") otpRef.current?.focus();
    if (step === "done") headingRef.current?.focus();
  }, [step]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const requestCode = useCallback(
    async (isResend: boolean) => {
      setStatus(null);
      if (!identifier.trim()) {
        setStatus({ type: "error", text: "Please enter your email address or username." });
        identifierRef.current?.focus();
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch("/api/auth/password-reset/request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role, identifier: identifier.trim() }),
        });
        const data = await readJson(res);

        if (!res.ok) {
          setStatus({
            type: "error",
            text: data.error ?? "We could not send the code. Please try again.",
          });
          return;
        }

        setCooldown(RESEND_COOLDOWN_SECONDS);
        setStatus({
          type: "success",
          text: isResend
            ? "If the account exists, a new code has been sent. Only the newest code works."
            : (data.message ??
              "If an account matches, a 6-digit code has been sent to its registered email."),
        });
        setStep("reset");
      } catch {
        setStatus({
          type: "error",
          text: "Could not reach the server. Check your connection and try again.",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [identifier, role],
  );

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void requestCode(false);
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    if (otp.length !== OTP_LENGTH) {
      setStatus({ type: "error", text: `Please enter the ${OTP_LENGTH}-digit code from your email.` });
      otpRef.current?.focus();
      return;
    }
    const policyError = validateNewPassword(newPassword);
    if (policyError) {
      setStatus({ type: "error", text: policyError });
      document.getElementById("new-password")?.focus();
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus({ type: "error", text: "The two passwords do not match." });
      document.getElementById("confirm-password")?.focus();
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, identifier: identifier.trim(), otp, newPassword }),
      });
      const data = await readJson(res);

      if (!res.ok) {
        setStatus({
          type: "error",
          text: data.error ?? "We could not reset your password. Please try again.",
        });
        return;
      }

      // Don't keep secrets in state any longer than needed.
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
      setStep("done");
    } catch {
      setStatus({
        type: "error",
        text: "Could not reach the server. Check your connection and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startOver = () => {
    setStatus(null);
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setStep("request");
  };

  const subtitle =
    step === "request"
      ? "We will email you a 6-digit code"
      : step === "reset"
        ? "Enter the code and choose a new password"
        : "All done";

  return (
    <div className="min-h-screen bg-[#E8F0FE] flex items-center justify-center px-4 py-8 font-sans">
      <main className="w-full max-w-md" aria-labelledby="reset-heading">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#B8D0E8]">
          <div className="bg-[#1A3A5C] px-6 py-8 text-center">
            <h1
              id="reset-heading"
              ref={headingRef}
              tabIndex={-1}
              className="text-3xl font-bold text-white tracking-wide focus:outline-none">
              {step === "done" ? "Password Reset" : "Reset Password"}
            </h1>
            <div className="w-16 h-1 bg-[#5B9BD5] mx-auto mt-3 rounded-full" aria-hidden="true" />
            <p className="text-white/70 text-sm mt-3">{subtitle}</p>
          </div>

          <div className="px-6 py-8 sm:px-8">
            {step === "request" && (
              <form onSubmit={handleRequestSubmit} className="space-y-5" noValidate>
                <Input
                  ref={identifierRef}
                  id="identifier"
                  name="identifier"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  autoComplete="username"
                  placeholder="Email address or username"
                  disabled={isLoading}
                  label="Email or Username"
                  required
                  helperText={`Enter your ${roleLabel} username or the email address registered on your account. The code is sent to that registered email.`}
                />

                {status && <StatusMessage type={status.type} text={status.text} />}

                <LoadingButton
                  isLoading={isLoading}
                  loadingText="Sending..."
                  aria-label={isLoading ? "Sending code, please wait" : "Send reset code"}>
                  Send Reset Code
                </LoadingButton>
              </form>
            )}

            {step === "reset" && (
              <form onSubmit={handleResetSubmit} className="space-y-5" noValidate>
                {status && <StatusMessage type={status.type} text={status.text} />}

                <Input
                  ref={otpRef}
                  id="otp"
                  name="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={OTP_LENGTH}
                  placeholder="6-digit code"
                  disabled={isLoading}
                  label="6-digit code"
                  required
                  helperText="Check your email inbox (and spam folder). The code expires in 10 minutes."
                />

                <PasswordInput
                  id="new-password"
                  name="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="Choose a new password"
                  disabled={isLoading}
                  label="New Password"
                  aria-describedby="password-requirements"
                />
                <p id="password-requirements" className="-mt-3 text-sm text-gray-500">
                  {PASSWORD_REQUIREMENTS_TEXT}
                </p>

                <PasswordInput
                  id="confirm-password"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="Type the new password again"
                  disabled={isLoading}
                  label="Confirm New Password"
                />

                <LoadingButton
                  isLoading={isLoading}
                  loadingText="Resetting..."
                  aria-label={isLoading ? "Resetting password, please wait" : "Reset password"}>
                  Reset Password
                </LoadingButton>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => void requestCode(true)}
                    disabled={isLoading || cooldown > 0}
                    className="flex-1 bg-[#E8EEF5] hover:bg-[#D5DFE8] text-[#1A3A5C] font-medium py-2.5 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/30 disabled:opacity-50 disabled:cursor-not-allowed">
                    {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
                  </button>
                  <button
                    type="button"
                    onClick={startOver}
                    disabled={isLoading}
                    className="flex-1 bg-white hover:bg-gray-50 text-[#1A3A5C] font-medium py-2.5 px-4 rounded-lg border border-[#C5D8EC] transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/30 disabled:opacity-50">
                    Use a different account
                  </button>
                </div>
              </form>
            )}

            {step === "done" && (
              <div className="space-y-5">
                <div
                  role="status"
                  className="bg-green-100 border border-green-300 rounded-lg p-6 text-center">
                  <h2 className="text-xl font-bold text-green-800 mb-2">Password changed</h2>
                  <p className="text-green-700 text-sm">
                    Your password has been reset. You can now log in with your new password.
                  </p>
                </div>
                <Link
                  href={loginHref}
                  className="block w-full bg-[#1A3A5C] hover:bg-[#14304D] text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/50 text-center">
                  Go to Login
                </Link>
              </div>
            )}

            {step !== "done" && (
              <div className="mt-6 text-center">
                <Link
                  href={loginHref}
                  className="text-sm text-[#2B6CB0] hover:text-[#1A3A5C] font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] rounded px-1 transition">
                  <span aria-hidden="true">&larr; </span>Back to Login
                </Link>
                <p className="text-xs text-[#8A9CAE] mt-3 border-t border-[#E8EEF5] pt-3">
                  Secure password recovery &copy; {new Date().getFullYear()}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ForgotPasswordFlow;
