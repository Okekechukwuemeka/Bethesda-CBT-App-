import React, { forwardRef } from "react";

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ error, className = "", ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-[#F8FAFE] ${
          error ? "border-red-300" : "border-[#C5D8EC]"
        } ${className}`}
        {...props}
      />
    );
  },
);

TextField.displayName = "TextField";

export default TextField;
