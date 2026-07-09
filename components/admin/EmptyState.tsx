import React from "react";
import Link from "next/link";

interface EmptyStateProps {
  message: string;
  actionLabel?: string;
  actionHref?: string;
  icon?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ message, actionLabel, actionHref, icon }) => {
  return (
    <div className="bg-white rounded-xl border border-[#C5D8EC] p-12 text-center">
      {icon && <div className="mb-4">{icon}</div>}
      <p className="text-[#5A7A9A]">{message}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="inline-block mt-4 bg-[#1A3A5C] hover:bg-[#14304D] text-white font-medium px-6 py-2 rounded-lg transition">
          {actionLabel}
        </Link>
      )}
    </div>
  );
};

export default EmptyState;
