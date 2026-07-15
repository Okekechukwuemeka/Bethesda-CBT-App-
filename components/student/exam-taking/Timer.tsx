import React from "react";

type SyncState = "idle" | "syncing" | "synced" | "error" | "offline";

const syncLabel: Record<SyncState, { text: string; className: string }> = {
  idle: { text: "", className: "" },
  syncing: { text: "Saving...", className: "text-[#4A6A8A]" },
  synced: { text: "Saved", className: "text-green-700" },
  error: { text: "Save failed, retrying", className: "text-red-700" },
  offline: { text: "Offline - saved locally", className: "text-amber-700" },
};

const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

interface TimerProps {
  timeRemaining: number;
  answeredCount: number;
  totalQuestions: number;
  syncState: SyncState;
}

const Timer: React.FC<TimerProps> = ({
  timeRemaining,
  answeredCount,
  totalQuestions,
  syncState,
}) => {
  const { text, className } = syncLabel[syncState];
  return (
    <div className="bg-white border-x border-[#B8D0E8] px-6 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-[#1A3A5C]">Timer:</span>
        <span
          className={`text-xl font-bold font-mono ${
            timeRemaining < 300 ? "text-red-600 animate-pulse" : "text-[#1A3A5C]"
          }`}
          aria-hidden="true">
          {formatTime(timeRemaining)}
        </span>
        {text && (
          <span className={`text-xs font-medium ${className}`} role="status" aria-live="polite">
            {text}
          </span>
        )}
      </div>
      <span className="text-sm text-[#4A6A8A]">
        {answeredCount} / {totalQuestions} answered
      </span>
    </div>
  );
};

export default Timer;
