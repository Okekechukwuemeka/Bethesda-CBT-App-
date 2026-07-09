'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface StatusMessage {
  type: 'success' | 'error' | 'warning';
  text: string;
}

const AdminLoginPage: React.FC = () => {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin123'
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      if (!username.trim() || !password.trim()) {
        setStatusMessage({
          type: 'error',
          text: 'Please enter both username and password.'
        });
        setIsLoading(false);
        return;
      }

      if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        // Set auth cookie
        document.cookie = 'admin_auth=true; path=/; max-age=86400';
        setStatusMessage({
          type: 'success',
          text: '✅ Login successful! Redirecting to dashboard...'
        });
        setTimeout(() => {
          router.push('/admin/dashboard');
        }, 1500);
      } else {
        setStatusMessage({
          type: 'error',
          text: '❌ Invalid username or password. Please try again.'
        });
        setPassword('');
        document.getElementById('password')?.focus();
        setIsLoading(false);
      }
    }, 800);
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
    setTimeout(() => {
      document.getElementById('password')?.focus();
    }, 50);
  };

  return (
    <div className="min-h-screen bg-[#E8F0FE] flex items-center justify-center px-4 py-8 font-sans">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#B8D0E8]">
          <div className="bg-[#1A3A5C] px-6 py-8 text-center">
            <h1 className="text-3xl font-bold text-white tracking-wide">
              Admin Login
            </h1>
            <div className="w-16 h-1 bg-[#5B9BD5] mx-auto mt-3 rounded-full"></div>
            <p className="text-white/70 text-sm mt-3">
              Secure access for administrators
            </p>
          </div>

          <div className="px-6 py-8 sm:px-8">
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-[#1A3A5C] mb-1">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                  aria-required="true"
                  aria-invalid={statusMessage?.type === 'error' && !username}
                  aria-describedby={statusMessage ? "status-message" : undefined}
                  placeholder="Enter your username"
                  disabled={isLoading}
                  className="w-full px-4 py-3 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent transition bg-[#F8FAFE] text-[#1A1A1A] placeholder:text-[#8A9CAE] disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[#1A3A5C] mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    aria-required="true"
                    aria-invalid={statusMessage?.type === 'error'}
                    aria-describedby={statusMessage ? "status-message" : undefined}
                    placeholder="Enter your password"
                    disabled={isLoading}
                    className="w-full px-4 py-3 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent transition bg-[#F8FAFE] text-[#1A1A1A] placeholder:text-[#8A9CAE] disabled:opacity-50 disabled:cursor-not-allowed pr-12"
                  />
                  <button
                    type="button"
                    onClick={toggleShowPassword}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5A7A9A] hover:text-[#1A3A5C] focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] rounded p-1 transition"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {statusMessage && (
                <div
                  id="status-message"
                  role="status"
                  aria-live="polite"
                  className={`p-3 rounded-lg text-sm font-medium ${
                    statusMessage.type === 'success'
                      ? 'bg-green-100 text-green-800 border border-green-300'
                      : statusMessage.type === 'warning'
                      ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                      : 'bg-red-100 text-red-800 border border-red-300'
                  }`}
                >
                  {statusMessage.text}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#1A3A5C] hover:bg-[#14304D] text-white font-semibold py-3 px-4 rounded-lg transition duration-200 ease-in-out shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/50 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                aria-label={isLoading ? "Logging in..." : "Login to admin dashboard"}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Logging in...
                  </span>
                ) : (
                  'Login'
                )}
              </button>
            </form>

            <div className="mt-6 space-y-3 text-center">
              <Link
                href="/admin/forgot-password"
                className="text-sm text-[#2B6CB0] hover:text-[#1A3A5C] font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] rounded px-1 transition"
              >
                Forgot Password?
              </Link>
              <p className="text-xs text-[#8A9CAE] border-t border-[#E8EEF5] pt-3">
                Secure admin access • © {new Date().getFullYear()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;