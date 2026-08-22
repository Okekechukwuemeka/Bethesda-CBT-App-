"use client";

import React from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import type { StaffMember } from "@/types/staff";

interface StaffTableProps {
  staff: StaffMember[];
  onEdit: (staff: StaffMember) => void;
  onDelete: (staff: StaffMember) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
}

const roleLabel = (role: string) => (role === "teacher" ? "Teacher" : "Non-teaching");
const roleColor = (role: string) =>
  role === "teacher" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800";

const StaffTable: React.FC<StaffTableProps> = ({
  staff,
  onEdit,
  onDelete,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
}) => {
  if (staff.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#C5D8EC] p-12 text-center">
        <p className="text-[#5A7A9A] font-medium">No staff members found.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[#C5D8EC] overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <caption className="sr-only">Staff members</caption>
          <thead className="bg-[#F8FAFE] border-b border-[#E8EEF5]">
            <tr>
              <th scope="col" className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={staff.length > 0 && selectedIds.size === staff.length}
                  ref={(el) => {
                    if (el) el.indeterminate = selectedIds.size > 0 && selectedIds.size < staff.length;
                  }}
                  onChange={onToggleSelectAll}
                  aria-label="Select all staff"
                  className="w-4 h-4 text-[#1A3A5C] focus:ring-2 focus:ring-[#2B6CB0] rounded"
                />
              </th>
              {["Staff ID", "Name", "Username", "Role", "Assignments", "Status", "Actions"].map(
                (h) => (
                  <th
                    key={h}
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8EEF5]">
            {staff.map((s) => (
              <tr key={s.id} className="hover:bg-[#F8FAFE]">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(s.id)}
                    onChange={() => onToggleSelect(s.id)}
                    aria-label={`Select ${s.firstName} ${s.lastName}`}
                    className="w-4 h-4 text-[#1A3A5C] focus:ring-2 focus:ring-[#2B6CB0] rounded"
                  />
                </td>
                <td className="px-4 py-3 text-sm text-[#4A6A8A] whitespace-nowrap">{s.staffId}</td>
                <td className="px-4 py-3 text-sm font-medium text-[#1A3A5C] whitespace-nowrap">
                  <Link href={`/admin/staff/${s.id}`} className="hover:underline">
                    {s.firstName} {s.lastName}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm text-[#4A6A8A] whitespace-nowrap">{s.username}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <Badge value={s.role} getColor={roleColor} getLabel={roleLabel} />
                </td>
                <td className="px-4 py-3 text-sm text-[#4A6A8A]">
                  {s.role === "teacher" ? (
                    <span>
                      {s.assignedSubjects.length} subject
                      {s.assignedSubjects.length === 1 ? "" : "s"} · {s.assignedClasses.length}{" "}
                      class{s.assignedClasses.length === 1 ? "" : "es"}
                    </span>
                  ) : (
                    <span className="text-[#8AA5BE]">—</span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <Badge
                    value={s.isActive ? "active" : "inactive"}
                    getColor={(v) => (v === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800")}
                    getLabel={(v) => (v === "active" ? "Active" : "Inactive")}
                  />
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/staff/${s.id}`}
                      className="text-[#2B6CB0] hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] rounded">
                      View
                    </Link>
                    <button
                      type="button"
                      onClick={(e) => onEdit(s)}
                      className="text-[#2B6CB0] hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] rounded"
                      aria-label={`Edit ${s.firstName} ${s.lastName}`}>
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={(e) => onDelete(s)}
                      className="text-red-600 hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
                      aria-label={`Delete ${s.firstName} ${s.lastName}`}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StaffTable;
