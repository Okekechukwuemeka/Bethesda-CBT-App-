"use client";

import React, { useEffect, useRef, useState } from "react";
import Input from "@/components/auth/Input";
import PasswordInput from "@/components/auth/PasswordInput";
import StatusMessage from "@/components/auth/StatusMessage";
import LoadingButton from "@/components/auth/LoadingButton";

interface AdminAccount {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface StatusMessageData {
  type: "success" | "error" | "warning";
  text: string;
}

const AdminAccountPage: React.FC = () => {
  const [account, setAccount] = useState<AdminAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<StatusMessageData | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/me");
        const data = await res.json().catch(() => ({}));
        if (!res.ok)
          throw new Error(data.error ?? "Failed to load your account.");
        if (cancelled) return;
        setAccount(data.admin);
        setEmail(data.admin.email ?? "");
      } catch (err) {
        if (!cancelled)
          setLoadError(err instanceof Error ? err.message : "Failed to load.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    if (!email.trim()) {
      setStatus({ type: "error", text: "Please enter an email address." });
      emailRef.current?.focus();
      return;
    }
    if (!currentPassword) {
      setStatus({
        type: "error",
        text: "Please enter your current password to confirm.",
      });
      document.getElementById("current-password")?.focus();
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, currentPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus({
          type: "error",
          text: data.error ?? "Could not save the email address.",
        });
        return;
      }
      setAccount((prev) => (prev ? { ...prev, email: data.email } : prev));
      setEmail(data.email);
      setCurrentPassword("");
      setStatus({
        type: "success",
        text: "Recovery email saved. Password reset codes will be sent to it.",
      });
    } catch {
      setStatus({
        type: "error",
        text: "Could not reach the server. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center min-h-[60vh]"
        role="status"
        aria-live="polite"
      >
        <div className="text-center">
          <div
            className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#1A3A5C] border-t-transparent"
            aria-hidden="true"
          />
          <p className="mt-4 text-[#4A6A8A]">Loading your account...</p>
        </div>
      </div>
    );
  }

  if (loadError || !account) {
    return (
      <div
        role="alert"
        className="p-4 rounded-lg text-sm font-medium bg-red-100 text-red-800 border border-red-300"
      >
        {loadError ?? "Account not found."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A3A5C]">My Account</h1>
        <p className="text-[#5A7A9A] text-sm">
          Your sign-in details and recovery email
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        <section
          aria-labelledby="account-details-heading"
          className="bg-white rounded-xl border border-[#C5D8EC] shadow-sm p-6"
        >
          <h2
            id="account-details-heading"
            className="text-lg font-semibold text-[#1A3A5C] mb-4"
          >
            Account details
          </h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-[#5A7A9A]">Name</dt>
              <dd className="font-medium text-[#1A3A5C]">
                {account.firstName} {account.lastName}
              </dd>
            </div>
            <div>
              <dt className="text-[#5A7A9A]">Username</dt>
              <dd className="font-medium text-[#1A3A5C]">{account.username}</dd>
            </div>
          </dl>
        </section>

        <section
          aria-labelledby="recovery-email-heading"
          className="bg-white rounded-xl border border-[#C5D8EC] shadow-sm p-6"
        >
          <h2
            id="recovery-email-heading"
            className="text-lg font-semibold text-[#1A3A5C]"
          >
            Recovery email
          </h2>
          <p className="text-sm text-[#5A7A9A] mt-1 mb-4">
            {account.email
              ? "If you forget your password, a 6-digit code is sent to this address."
              : "No recovery email is set yet. Add one so you can reset your password if you forget it."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <Input
              ref={emailRef}
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
              disabled={isSaving}
              label="Email address"
              required
            />
            <PasswordInput
              id="current-password"
              name="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="Enter your current password"
              disabled={isSaving}
              label="Current password"
            />

            {status && <StatusMessage type={status.type} text={status.text} />}

            <LoadingButton
              isLoading={isSaving}
              loadingText="Saving..."
              className="sm:w-auto sm:px-8"
            >
              Save recovery email
            </LoadingButton>
          </form>
        </section>
      </div>
    </div>
  );
};

export default AdminAccountPage;
