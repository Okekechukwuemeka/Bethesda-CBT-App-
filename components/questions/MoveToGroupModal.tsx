"use client";

import React, { useState } from "react";
import Modal from "@/components/ui/Modal";
import GroupPicker from "@/components/questions/GroupPicker";
import { normalizeGroupName, validateGroupName } from "@/lib/question-group-rules";
import type { QuestionGroupSummary } from "@/types/question";

export type MoveScope = "selected" | "filtered";

interface MoveToGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (group: string, scope: MoveScope) => void;
  groups: QuestionGroupSummary[];
  isLoadingGroups: boolean;
  isSubmitting: boolean;
  // Server-side failure to show (e.g. "Network error").
  error: string | null;
  // Questions the person has ticked on the current page (admin only).
  selectedCount: number;
  // Every question matching the filters currently applied to the list.
  matchingCount: number;
  // Whether ticking individual rows is a thing on this screen (admin: yes;
  // staff: the action always applies to everything their filters show).
  allowSelected: boolean;
}

const plural = (n: number) => `${n} question${n !== 1 ? "s" : ""}`;

const MoveForm: React.FC<Omit<MoveToGroupModalProps, "isOpen">> = ({
  onClose,
  onConfirm,
  groups,
  isLoadingGroups,
  isSubmitting,
  error,
  selectedCount,
  matchingCount,
  allowSelected,
}) => {
  const canChooseSelected = allowSelected && selectedCount > 0;
  const [scope, setScope] = useState<MoveScope>(canChooseSelected ? "selected" : "filtered");
  const [group, setGroup] = useState("");
  const [groupError, setGroupError] = useState<string | null>(null);

  const targetCount = scope === "selected" ? selectedCount : matchingCount;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = normalizeGroupName(group);
    const problem = validateGroupName(name);
    if (problem) {
      setGroupError(problem);
      return;
    }
    setGroupError(null);
    onConfirm(name, scope);
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <p className="text-sm text-[#4A6A8A]">
        Choose the group these questions should belong to. Their other details do not change, and they
        stay in any exam they are already part of.
      </p>

      {canChooseSelected ? (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-[#1A3A5C] mb-1">Which questions?</legend>
          <label className="flex items-start gap-3 text-sm text-[#1A3A5C]">
            <input
              type="radio"
              name="move-scope"
              value="selected"
              checked={scope === "selected"}
              onChange={() => setScope("selected")}
              disabled={isSubmitting}
              className="mt-1"
            />
            <span>The {plural(selectedCount)} I ticked on this page</span>
          </label>
          <label className="flex items-start gap-3 text-sm text-[#1A3A5C]">
            <input
              type="radio"
              name="move-scope"
              value="filtered"
              checked={scope === "filtered"}
              onChange={() => setScope("filtered")}
              disabled={isSubmitting}
              className="mt-1"
            />
            <span>
              All {plural(matchingCount)} that match the filters and search currently applied (every
              page)
            </span>
          </label>
        </fieldset>
      ) : (
        <p className="text-sm font-medium text-[#1A3A5C]">
          This will apply to all {plural(matchingCount)} currently listed by your filters and search.
        </p>
      )}

      <GroupPicker
        value={group}
        onChange={(v) => {
          setGroup(v);
          if (groupError) setGroupError(null);
        }}
        groups={groups}
        isLoadingGroups={isLoadingGroups}
        required
        label="Move to group"
        error={groupError}
        disabled={isSubmitting}
        autoFocus
        helpText="Pick an existing group, or choose “Create a new group…” to type a new name."
      />

      {error && (
        <div
          role="alert"
          className="p-3 rounded-lg text-sm font-medium bg-red-100 text-red-800 border border-red-300">
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="flex-1 bg-[#E8EEF5] hover:bg-[#D5DFE8] text-[#1A3A5C] font-medium py-2.5 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/30 disabled:opacity-50">
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || targetCount === 0}
          className="flex-1 bg-[#1A3A5C] hover:bg-[#14304D] text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/50 disabled:opacity-50">
          {isSubmitting ? "Moving…" : `Move ${plural(targetCount)}`}
        </button>
      </div>
    </form>
  );
};

// The inner form is only mounted while the dialog is open, so every opening
// starts fresh (no group or scope left over from last time).
const MoveToGroupModal: React.FC<MoveToGroupModalProps> = ({ isOpen, onClose, ...rest }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Move questions to a group" disableClose={rest.isSubmitting} maxWidth="2xl">
    <MoveForm onClose={onClose} {...rest} />
  </Modal>
);

export default MoveToGroupModal;
