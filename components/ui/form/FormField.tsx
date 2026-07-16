import React from "react";

interface FormFieldProps {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  className?: string;
  children: React.ReactNode;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  htmlFor,
  required,
  error,
  helperText,
  className = "",
  children,
}) => {
  const errorId = `${htmlFor}-error`;
  const hintId = `${htmlFor}-hint`;
  const describedBy =
    [error && errorId, helperText && hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-[#1A3A5C] mb-1">
        {label}
        {required && (
          <span className="text-red-500" aria-hidden="true">
            {" "}
            *
          </span>
        )}
      </label>
      {React.cloneElement(
        children as React.ReactElement<Record<string, unknown>>,
        {
          "aria-required": required,
          "aria-invalid": error ? "true" : undefined,
          "aria-describedby": describedBy,
        } as Record<string, unknown>,
      )}
      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={hintId} className="mt-1 text-xs text-[#8A9CAE]">
          {helperText}
        </p>
      )}
    </div>
  );
};

export default FormField;
