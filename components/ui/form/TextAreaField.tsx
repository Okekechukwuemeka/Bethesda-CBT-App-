import React, { forwardRef } from "react";

interface TextAreaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  ({ error, className = "", ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-[#F8FAFE] text-[#1A1A1A] placeholder:text-[#5A6B7D] resize-y ${
          error ? "border-red-300" : "border-[#C5D8EC]"
        } ${className}`}
        {...props}
      />
    );
  },
);

TextAreaField.displayName = "TextAreaField";

export default TextAreaField;
