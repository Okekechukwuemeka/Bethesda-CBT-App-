import React from "react";

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading: boolean;
  loadingText?: string;
  variant?: "primary" | "secondary";
}

const LoadingButton: React.FC<LoadingButtonProps> = ({
  children,
  isLoading,
  loadingText = "Loading...",
  variant = "primary",
  className = "",
  disabled,
  ...props
}) => {
  const baseStyles =
    "w-full font-semibold py-3 px-4 rounded-lg transition duration-200 ease-in-out focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";

  const variantStyles = {
    primary:
      "bg-[#1A3A5C] hover:bg-[#14304D] text-white shadow-md hover:shadow-lg focus:ring-[#2B6CB0]/50 active:scale-[0.99]",
    secondary:
      "bg-white hover:bg-gray-50 text-[#1A3A5C] border border-[#C5D8EC] focus:ring-[#2B6CB0]/50",
  };

  return (
    <button
      type="submit"
      disabled={isLoading || disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}>
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <svg
            className="animate-spin h-5 w-5"
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
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {loadingText}
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default LoadingButton;
