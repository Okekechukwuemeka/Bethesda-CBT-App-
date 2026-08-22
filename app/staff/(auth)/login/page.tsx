"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Input from "@/components/auth/Input";
import PasswordInput from "@/components/auth/PasswordInput";
import StatusMessage from "@/components/auth/StatusMessage";
import LoadingButton from "@/components/auth/LoadingButton";

interface StatusMessageData {
  type: "success" | "error" | "warning";
  text: string;
}

const StaffLoginPage: React.FC = () => {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<StatusMessageData | null>(null);

  const usernameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    usernameRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!username.trim() || !password.trim()) {
      setStatusMessage({ type: "error", text: "Please enter both username and password." });
      return;
    }

    setIsLoading(true);

    const result = await signIn("staff-login", { username, password, redirect: false });

    if (!result || result.error) {
      setStatusMessage({
        type: "error",
        text: "Invalid username or password. Please try again.",
      });
      setPassword("");
      usernameRef.current?.blur();
      document.getElementById("password")?.focus();
      setIsLoading(false);
      return;
    }

    setStatusMessage({ type: "success", text: "Login successful. Redirecting to dashboard." });
    router.refresh();
    router.push("/staff");
  };

  return (
    <div className="min-h-screen bg-[#E8F0FE] flex items-center justify-center px-4 py-8 font-sans">
      <main className="w-full max-w-md" aria-labelledby="login-heading">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#B8D0E8]">
          <div className="bg-[#1A3A5C] px-6 py-8 text-center">
            <h1 id="login-heading" className="text-3xl font-bold text-white tracking-wide">
              Staff Login
            </h1>
            <div className="w-16 h-1 bg-[#5B9BD5] mx-auto mt-3 rounded-full" aria-hidden="true" />
            <p className="text-white/70 text-sm mt-3">Secure access for teachers &amp; staff</p>
          </div>

          <div className="px-6 py-8 sm:px-8">
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <Input
                ref={usernameRef}
                id="username"
                name="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder="Enter your username"
                disabled={isLoading}
                label="Username"
                required
              />

              <PasswordInput
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="Enter your password"
                disabled={isLoading}
                label="Password"
              />

              {statusMessage && <StatusMessage type={statusMessage.type} text={statusMessage.text} />}

              <LoadingButton
                isLoading={isLoading}
                loadingText="Logging in..."
                aria-label={isLoading ? "Logging in, please wait" : "Login to staff dashboard"}>
                Login
              </LoadingButton>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs text-[#8A9CAE] border-t border-[#E8EEF5] pt-3">
                Secure staff access &copy; {new Date().getFullYear()}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StaffLoginPage;
