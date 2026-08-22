"use client";

import React, { useEffect, useState } from "react";
import SelectField from "@/components/ui/form/SelectField";
import Badge from "@/components/ui/Badge";
import { useStaffDetailStore } from "@/store/useStaffDetailStore";
import { CLASS_LEVELS } from "@/lib/models/constants";

interface AssignmentsPanelProps {
  staffId: string;
}

const AssignmentsPanel: React.FC<AssignmentsPanelProps> = ({ staffId }) => {
  const {
    staff,
    allSubjects,
    isLoadingSubjects,
    isSavingAssignment,
    fetchSubjects,
    addSubject,
    removeSubject,
    addClass,
    removeClass,
  } = useStaffDetailStore();

  const [subjectToAdd, setSubjectToAdd] = useState("");
  const [classToAdd, setClassToAdd] = useState("");

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  if (!staff) return null;
  const canAssign = staff.role === "teacher";

  const assignedSubjectIds = new Set(staff.assignedSubjects.map((s) => s.id));
  const availableSubjects = allSubjects.filter((s) => !assignedSubjectIds.has(s.id));
  const availableClasses = (CLASS_LEVELS as readonly string[]).filter(
    (c) => c !== "graduated" && !staff.assignedClasses.includes(c),
  );

  return (
    <div className="bg-white rounded-xl border border-[#C5D8EC] p-6 shadow-sm space-y-6">
      <h2 className="text-lg font-bold text-[#1A3A5C]">Subject &amp; Class Assignment</h2>

      <div>
        <h3 className="text-sm font-medium text-[#1A3A5C] mb-2">Assigned Subjects</h3>
        {staff.assignedSubjects.length === 0 ? (
          <p className="text-sm text-[#8AA5BE] mb-3">No subjects assigned yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2 mb-3">
            {staff.assignedSubjects.map((s) => (
              <span
                key={s.id}
                className="inline-flex items-center gap-2 bg-[#E8EEF5] text-[#1A3A5C] text-sm font-medium pl-3 pr-1.5 py-1 rounded-full">
                {s.name}
                <button
                  type="button"
                  onClick={() => removeSubject(staffId, s.id)}
                  disabled={!canAssign || isSavingAssignment}
                  aria-label={`Remove ${s.name} assignment`}
                  className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-[#C5D8EC] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]">
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <div className="flex-1">
            <label htmlFor="add-subject" className="sr-only">
              Add subject
            </label>
            <SelectField
              id="add-subject"
              value={subjectToAdd}
              onChange={(e) => setSubjectToAdd(e.target.value)}
              disabled={!canAssign || isLoadingSubjects || availableSubjects.length === 0}
              options={[
                { value: "", label: isLoadingSubjects ? "Loading…" : "Select a subject to add" },
                ...availableSubjects.map((s) => ({ value: s.id, label: `${s.name} (${s.code})` })),
              ]}
            />
          </div>
          <button
            type="button"
            onClick={() => {
              if (!subjectToAdd) return;
              addSubject(staffId, subjectToAdd);
              setSubjectToAdd("");
            }}
            disabled={!canAssign || !subjectToAdd || isSavingAssignment}
            className="bg-[#1A3A5C] hover:bg-[#14304D] text-white font-medium px-4 py-2 rounded-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/50 disabled:opacity-50">
            Add
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-[#1A3A5C] mb-2">Assigned Classes</h3>
        {staff.assignedClasses.length === 0 ? (
          <p className="text-sm text-[#8AA5BE] mb-3">No classes assigned yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2 mb-3">
            {staff.assignedClasses.map((c) => (
              <span
                key={c}
                className="inline-flex items-center gap-2 bg-[#E8EEF5] text-[#1A3A5C] text-sm font-medium pl-3 pr-1.5 py-1 rounded-full">
                {c}
                <button
                  type="button"
                  onClick={() => removeClass(staffId, c)}
                  disabled={!canAssign || isSavingAssignment}
                  aria-label={`Remove ${c} assignment`}
                  className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-[#C5D8EC] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]">
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <div className="flex-1">
            <label htmlFor="add-class" className="sr-only">
              Add class
            </label>
            <SelectField
              id="add-class"
              value={classToAdd}
              onChange={(e) => setClassToAdd(e.target.value)}
              disabled={!canAssign || availableClasses.length === 0}
              options={[
                { value: "", label: "Select a class to add" },
                ...availableClasses.map((c) => ({ value: c, label: c })),
              ]}
            />
          </div>
          <button
            type="button"
            onClick={() => {
              if (!classToAdd) return;
              addClass(staffId, classToAdd);
              setClassToAdd("");
            }}
            disabled={!canAssign || !classToAdd || isSavingAssignment}
            className="bg-[#1A3A5C] hover:bg-[#14304D] text-white font-medium px-4 py-2 rounded-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/50 disabled:opacity-50">
            Add
          </button>
        </div>
      </div>

      {staff.role !== "teacher" && (
        <p className="text-xs text-[#8AA5BE]">
          Only staff with the <Badge value="teacher" getColor={() => "bg-blue-100 text-blue-800"} /> role
          can be assigned subjects or classes.
        </p>
      )}
    </div>
  );
};

export default AssignmentsPanel;
