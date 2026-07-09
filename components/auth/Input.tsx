"use client";

import React, { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  rightElement?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, required, rightElement, className = "", id, ...props }, ref) => {
    const inputId = id || label.toLowerCase().replace(/\s+/g, "-");

    return (
      <div>
        <label htmlFor={inputId} className="block text-sm font-medium text-[#1A3A5C] mb-1">
          {label}
          {required && (
            <span className="text-red-500" aria-hidden="true">
              {" "}
              *
            </span>
          )}
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            aria-invalid={error ? "true" : undefined}
            aria-describedby={
              error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent transition bg-[#F8FAFE] text-[#1A1A1A] placeholder:text-[#5A6B7D] disabled:opacity-50 disabled:cursor-not-allowed ${
              error ? "border-red-300 focus:ring-red-500" : "border-[#C5D8EC]"
            } ${rightElement ? "pr-12" : ""} ${className}`}
            aria-required={required}
            {...props}
          />
          {rightElement && rightElement}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="mt-1 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="mt-1 text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;
