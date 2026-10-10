"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import type { QuestionGroupSummary } from "@/types/question";

interface GroupPickerProps {
  value: string;
  onChange: (value: string) => void;
  groups: QuestionGroupSummary[];
  isLoadingGroups?: boolean;
  // Required pickers have no "leave ungrouped" choice and say so in the label.
  required?: boolean;
  label?: string;
  helpText?: string;
  // Error text for this field; shown under it and tied to it for screen readers.
  error?: string | null;
  disabled?: boolean;
  autoFocus?: boolean;
  maxLength?: number;
}

const NEW_GROUP = "__create_new_group__";

const fieldClass =
  "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] bg-[#F8FAFE] disabled:opacity-60";

const sameName = (a: string, b: string) =>
  a.replace(/\s+/g, " ").trim().toLowerCase() === b.replace(/\s+/g, " ").trim().toLowerCase();

// Choose which question group a question (or a whole upload) belongs to.
//
// Built from two ordinary form controls on purpose, because this is used by
// blind staff with screen readers: a <select> of the existing groups (each
// announced with its question count), and - only when "Create a new group"
// is chosen - a labelled text box that receives focus straight away. No
// custom listbox or typeahead widget to get lost in.
const GroupPicker: React.FC<GroupPickerProps> = ({
  value,
  onChange,
  groups,
  isLoadingGroups = false,
  required = false,
  label = "Question group",
  helpText,
  error,
  disabled = false,
  autoFocus = false,
  maxLength = 100,
}) => {
  const uid = useId();
  const selectId = `${uid}-select`;
  const inputId = `${uid}-new`;
  const helpId = `${uid}-help`;
  const errorId = `${uid}-error`;
  const matchId = `${uid}-match`;

  const [creating, setCreating] = useState(false);
  const newInputRef = useRef<HTMLInputElement>(null);

  // Move focus to the name box the moment "Create a new group" is chosen -
  // without it a screen-reader user wouldn't know a new field had appeared.
  useEffect(() => {
    if (creating) newInputRef.current?.focus();
  }, [creating]);

  const knownGroup = groups.find((g) => sameName(g.name, value));
  // A value that isn't in the list yet (an older question's group while the
  // list is still loading, or a name carried over from earlier in the
  // session) is still shown as a choice so the select never lies about it.
  const showValueAsOption = !creating && value && !knownGroup;
  const selectValue = creating ? NEW_GROUP : knownGroup ? knownGroup.name : value;

  const handleSelect = (next: string) => {
    if (next === NEW_GROUP) {
      setCreating(true);
      onChange("");
      return;
    }
    setCreating(false);
    onChange(next);
  };

  const existingMatch = creating && value.trim() ? groups.find((g) => sameName(g.name, value)) : undefined;

  const describedBy = [helpText ? helpId : "", error ? errorId : ""].filter(Boolean).join(" ") || undefined;

  return (
    <div>
      <label htmlFor={selectId} className="block text-sm font-medium text-[#1A3A5C] mb-1">
        {label}
        {required ? <span> (required)</span> : <span className="font-normal"> (optional)</span>}
      </label>

      <select
        id={selectId}
        value={selectValue}
        onChange={(e) => handleSelect(e.target.value)}
        disabled={disabled}
        autoFocus={autoFocus}
        required={required}
        aria-required={required}
        aria-invalid={error && !creating ? true : undefined}
        aria-describedby={describedBy}
        className={`${fieldClass} ${error && !creating ? "border-red-400" : "border-[#C5D8EC]"}`}>
        <option value="">
          {isLoadingGroups
            ? "Loading groups…"
            : required
              ? "Select a group"
              : "No group (leave ungrouped)"}
        </option>
        {groups.map((group) => (
          <option key={group.name} value={group.name}>
            {group.name} — {group.count} question{group.count !== 1 ? "s" : ""}
          </option>
        ))}
        {showValueAsOption && <option value={value}>{value}</option>}
        <option value={NEW_GROUP}>Create a new group…</option>
      </select>

      {creating && (
        <div className="mt-3">
          <label htmlFor={inputId} className="block text-sm font-medium text-[#1A3A5C] mb-1">
            New group name{required ? " (required)" : ""}
          </label>
          <input
            id={inputId}
            ref={newInputRef}
            type="text"
            value={value}
            maxLength={maxLength}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            onBlur={() => onChange(value.replace(/\s+/g, " ").trim())}
            aria-required={required}
            aria-invalid={error ? true : undefined}
            aria-describedby={[helpId, error ? errorId : "", existingMatch ? matchId : ""]
              .filter(Boolean)
              .join(" ")}
            placeholder="For example: First Term 2026"
            className={`${fieldClass} ${error ? "border-red-400" : "border-[#C5D8EC]"}`}
          />
          {existingMatch && (
            <p id={matchId} role="status" className="text-sm text-[#1A3A5C] mt-1">
              A group called “{existingMatch.name}” already exists, so these questions will be added to
              it.
            </p>
          )}
        </div>
      )}

      {helpText && (
        <p id={helpId} className="text-sm text-[#4A6A8A] mt-1">
          {helpText}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-sm font-medium text-red-700 mt-1">
          {error}
        </p>
      )}
    </div>
  );
};

export default GroupPicker;
