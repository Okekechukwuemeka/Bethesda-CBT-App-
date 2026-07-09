"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import Input from "@/components/auth/Input";
import StatusMessage from "@/components/auth/StatusMessage";
import LoadingButton from "@/components/auth/LoadingButton";

interface StatusMessageData {
  type: "success" | "error" | "warning";
  text: string;
}

const ForgotPasswordPage: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<StatusMessageData | null>(null);
  const [isEmailSent, setIsEmailSent] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);

  // Focus the email field on mount so a keyboard/screen reader user can
  // start typing immediately without an extra Tab press.
  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const validateEmail = (email: string): string | null => {
    if (!email.trim()) {
      return "Please enter your email address.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address.";
    }

    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    // Client-side validation
    const validationError = validateEmail(email);
    if (validationError) {
      setStatusMessage({
        type: "error",
        text: validationError,
      });
      emailRef.current?.focus();
      return;
    }

    setIsLoading(true);

    // TODO (integration): replace with a real POST to /api/auth/forgot-password.
    setTimeout(() => {
      setStatusMessage({
        type: "success",
        text: "Password reset link sent to your email. Please check your inbox.",
      });
      setIsEmailSent(true);
      setIsLoading(false);
      // No automatic redirect here on purpose — forcing navigation away
      // right after this message would cut off a screen reader mid-announcement,
      // and the admin's next real step is to go check their email, not log in.
    }, 1500);
  };

  const handleResendEmail = () => {
    setStatusMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      setStatusMessage({
        type: "success",
        text: "New password reset link sent. Please check your email.",
      });
      setIsLoading(false);
    }, 1000);
  };

  const renderEmailForm = () => (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <Input
        ref={emailRef}
        type="email"
        id="email"
        name="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        placeholder="Enter your registered email"
        disabled={isLoading}
        label="Email Address"
        required
        helperText="We'll send a password reset link to this email"
        aria-describedby={statusMessage ? "status-message" : "email-hint"}
        aria-invalid={statusMessage?.type === "error" ? "true" : undefined}
      />

      {statusMessage && <StatusMessage type={statusMessage.type} text={statusMessage.text} />}

      <LoadingButton
        isLoading={isLoading}
        loadingText="Sending..."
        aria-label={isLoading ? "Sending reset link, please wait" : "Send reset link"}>
        Send Reset Link
      </LoadingButton>
    </form>
  );

  const renderSuccessState = () => (
    <div className="space-y-5">
      <div className="bg-green-100 border border-green-300 rounded-lg p-6 text-center">
        <div className="text-6xl mb-4" aria-hidden="true">
          📧
        </div>
        <h2 className="text-xl font-bold text-green-800 mb-2">Check Your Email</h2>
        <p className="text-green-700 text-sm">We&apos;ve sent a password reset link to:</p>
        <p className="text-[#1A3A5C] font-medium text-sm mt-1 break-all">{email}</p>
      </div>

      {statusMessage && <StatusMessage type={statusMessage.type} text={statusMessage.text} />}

      <div className="space-y-3">
        <button
          onClick={handleResendEmail}
          disabled={isLoading}
          className="w-full bg-[#E8EEF5] hover:bg-[#D5DFE8] text-[#1A3A5C] font-medium py-2.5 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/30 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={isLoading ? "Resending reset link, please wait" : "Resend reset link email"}>
          {isLoading ? "Sending..." : "Resend Email"}
        </button>

        <button
          type="button"
          onClick={() => router.push("/admin/login")}
          className="block w-full bg-[#1A3A5C] hover:bg-[#14304D] text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/50 active:scale-[0.98] text-center">
          Back to Login
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#E8F0FE] flex items-center justify-center px-4 py-8 font-sans">
      <main className="w-full max-w-md" aria-labelledby="reset-heading">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#B8D0E8]">
          {/* Header */}
          <div className="bg-[#1A3A5C] px-6 py-8 text-center">
            <h1 id="reset-heading" className="text-3xl font-bold text-white tracking-wide">
              Reset Password
            </h1>
            <div className="w-16 h-1 bg-[#5B9BD5] mx-auto mt-3 rounded-full" aria-hidden="true" />
            <p className="text-white/70 text-sm mt-3">Enter your email to reset your password</p>
          </div>

          {/* Content */}
          <div className="px-6 py-8 sm:px-8">
            {!isEmailSent ? renderEmailForm() : renderSuccessState()}

            {!isEmailSent && (
              <div className="mt-6 text-center">
                <Link
                  href="/admin/login"
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

export default ForgotPasswordPage;
