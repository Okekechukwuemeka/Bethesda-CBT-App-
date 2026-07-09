"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface StatusMessage {
  type: "success" | "error" | "warning";
  text: string;
}

const ForgotPasswordPage: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  const [isEmailSent, setIsEmailSent] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);

  // Focus the email field on mount so a keyboard/screen reader user can
  // start typing immediately without an extra Tab press.
  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    setIsLoading(true);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      setStatusMessage({
        type: "error",
        text: "Please enter your email address.",
      });
      setIsLoading(false);
      emailRef.current?.focus();
      return;
    }

    if (!emailRegex.test(email)) {
      setStatusMessage({
        type: "error",
        text: "Please enter a valid email address.",
      });
      setIsLoading(false);
      emailRef.current?.focus();
      return;
    }

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

  return (
    <div className="min-h-screen bg-[#E8F0FE] flex items-center justify-center px-4 py-8 font-sans">
      <main className="w-full max-w-md" aria-labelledby="reset-heading">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#B8D0E8]">
          <div className="bg-[#1A3A5C] px-6 py-8 text-center">
            <h1 id="reset-heading" className="text-3xl font-bold text-white tracking-wide">
              Reset Password
            </h1>
            <div
              className="w-16 h-1 bg-[#5B9BD5] mx-auto mt-3 rounded-full"
              aria-hidden="true"></div>
            <p className="text-white/70 text-sm mt-3">Enter your email to reset your password</p>
          </div>

          <div className="px-6 py-8 sm:px-8">
            {!isEmailSent ? (
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[#1A3A5C] mb-1">
                    Email Address{" "}
                    <span className="text-red-500" aria-hidden="true">
                      *
                    </span>
                  </label>
                  <input
                    ref={emailRef}
                    type="email"
                    id="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    aria-required="true"
                    aria-invalid={statusMessage?.type === "error"}
                    aria-describedby={statusMessage ? "status-message" : "email-hint"}
                    placeholder="Enter your registered email"
                    disabled={isLoading}
                    className="w-full px-4 py-3 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent transition bg-[#F8FAFE] text-[#1A1A1A] placeholder:text-[#5A6B7D] disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <p id="email-hint" className="mt-2 text-xs text-[#8A9CAE]">
                    We&apos;ll send a password reset link to this email
                  </p>
                </div>

                {statusMessage && (
                  <div
                    id="status-message"
                    role={statusMessage.type === "error" ? "alert" : "status"}
                    aria-live={statusMessage.type === "error" ? "assertive" : "polite"}
                    className={`p-3 rounded-lg text-sm font-medium ${
                      statusMessage.type === "success"
                        ? "bg-green-100 text-green-800 border border-green-300"
                        : statusMessage.type === "warning"
                          ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                          : "bg-red-100 text-red-800 border border-red-300"
                    }`}>
                    {statusMessage.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#1A3A5C] hover:bg-[#14304D] text-white font-semibold py-3 px-4 rounded-lg transition duration-200 ease-in-out shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/50 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                  aria-label={isLoading ? "Sending reset link, please wait" : "Send reset link"}>
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        focusable="false">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </span>
                  ) : (
                    "Send Reset Link"
                  )}
                </button>
              </form>
            ) : (
              <div className="space-y-5">
                <div className="bg-green-100 border border-green-300 rounded-lg p-6 text-center">
                  <div className="text-6xl mb-4" aria-hidden="true">
                    📧
                  </div>
                  <h2 className="text-xl font-bold text-green-800 mb-2">Check Your Email</h2>
                  <p className="text-green-700 text-sm">
                    We&apos;ve sent a password reset link to:
                  </p>
                  <p className="text-[#1A3A5C] font-medium text-sm mt-1 break-all">{email}</p>
                </div>

                {statusMessage && (
                  <div
                    id="status-message"
                    role="status"
                    aria-live="polite"
                    className="p-3 rounded-lg text-sm font-medium bg-green-100 text-green-800 border border-green-300">
                    {statusMessage.text}
                  </div>
                )}

                <div className="space-y-3">
                  <button
                    onClick={handleResendEmail}
                    disabled={isLoading}
                    className="w-full bg-[#E8EEF5] hover:bg-[#D5DFE8] text-[#1A3A5C] font-medium py-2.5 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={
                      isLoading ? "Resending reset link, please wait" : "Resend reset link email"
                    }>
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
            )}

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
