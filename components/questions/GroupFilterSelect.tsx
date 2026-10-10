import React from "react";
import type { QuestionGroupSummary } from "@/types/question";

interface GroupFilterSelectProps {
  id: string;
  // "" (or `allValue`) means "all groups"; "__ungrouped__" means questions
  // with no group; anything else is a group name.
  value: string;
  onChange: (value: string) => void;
  groups: QuestionGroupSummary[];
  ungroupedCount?: number;
  totalCount?: number;
  isLoading?: boolean;
  // The value the surrounding screen uses for "no filter" (the admin bank
  // uses "all", the exam picker uses "").
  allValue?: string;
  // Show the label as visible text (default) or for screen readers only.
  srOnlyLabel?: boolean;
  className?: string;
}

export const UNGROUPED_VALUE = "__ungrouped__";

// The "which group of questions?" filter. A plain labelled <select>; every
// choice carries its question count so it's announced as, e.g.,
// "First Term 2026 — 45 questions".
const GroupFilterSelect: React.FC<GroupFilterSelectProps> = ({
  id,
  value,
  onChange,
  groups,
  ungroupedCount = 0,
  totalCount,
  isLoading = false,
  allValue = "",
  srOnlyLabel = false,
  className = "",
}) => {
  const knownValue =
    value === allValue || value === UNGROUPED_VALUE || groups.some((g) => g.name === value);

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className={srOnlyLabel ? "sr-only" : "block text-sm font-medium text-[#1A3A5C] mb-1"}>
        Question group
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={isLoading}
        className="w-full px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] bg-[#F8FAFE] disabled:opacity-60">
        <option value={allValue}>
          {isLoading
            ? "Loading groups…"
            : `All groups${totalCount !== undefined ? ` — ${totalCount} question${totalCount !== 1 ? "s" : ""}` : ""}`}
        </option>
        {groups.map((group) => (
          <option key={group.name} value={group.name}>
            {group.name} — {group.count} question{group.count !== 1 ? "s" : ""}
          </option>
        ))}
        {(ungroupedCount > 0 || value === UNGROUPED_VALUE) && (
          <option value={UNGROUPED_VALUE}>
            Ungrouped (older questions) — {ungroupedCount} question{ungroupedCount !== 1 ? "s" : ""}
          </option>
        )}
        {!knownValue && !isLoading && <option value={value}>{value}</option>}
      </select>
    </div>
  );
};

export default GroupFilterSelect;
