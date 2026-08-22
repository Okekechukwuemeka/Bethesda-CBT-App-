"use client";

import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useStaffDetailStore } from "@/store/useStaffDetailStore";
import AssignmentsPanel from "@/components/admin/staff/AssignmentsPanel";
import Badge from "@/components/ui/Badge";

const roleLabel = (role: string) => (role === "teacher" ? "Teacher" : "Non-teaching Staff");

const StaffDetailPage: React.FC = () => {
  const params = useParams<{ id: string }>();
  const staffId = params.id;

  const { staff, isLoading, error, statusMessage, fetchStaff } = useStaffDetailStore();

  useEffect(() => {
    fetchStaff(staffId);
  }, [staffId, fetchStaff]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" role="status" aria-live="polite">
        <div className="text-center">
          <div
            className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#1A3A5C] border-t-transparent"
            aria-hidden="true"
          />
          <p className="mt-4 text-[#4A6A8A]">Loading staff member…</p>
        </div>
      </div>
    );
  }

  if (error || !staff) {
    return (
      <div className="space-y-4">
        <Link href="/admin/staff" className="text-[#2B6CB0] hover:underline font-medium">
          ← Back to Staff
        </Link>
        <div
          role="alert"
          className="p-4 rounded-lg text-sm font-medium bg-red-100 text-red-800 border border-red-300">
          {error ?? "Staff member not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href="/admin/staff"
            className="text-[#2B6CB0] hover:underline text-sm font-medium">
            ← Back to Staff
          </Link>
          <h1 className="text-2xl font-bold text-[#1A3A5C] mt-1">
            {staff.firstName} {staff.lastName}
          </h1>
          <p className="text-[#5A7A9A] text-sm">{staff.staffId}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge value={staff.role} getColor={() => "bg-blue-100 text-blue-800"} getLabel={roleLabel} />
          <Badge
            value={staff.isActive ? "active" : "inactive"}
            getColor={(v) => (v === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800")}
            getLabel={(v) => (v === "active" ? "Active" : "Inactive")}
          />
        </div>
      </div>

      {statusMessage && (
        <div
          role={statusMessage.type === "error" ? "alert" : "status"}
          aria-live={statusMessage.type === "error" ? "assertive" : "polite"}
          className={`p-4 rounded-lg text-sm font-medium ${statusMessage.type === "success" ? "bg-green-100 text-green-800 border border-green-300" : "bg-red-100 text-red-800 border border-red-300"}`}>
          {statusMessage.text}
        </div>
      )}

      <div className="bg-white rounded-xl border border-[#C5D8EC] p-6 shadow-sm">
        <h2 className="text-lg font-bold text-[#1A3A5C] mb-4">Staff Details</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            ["Username", staff.username],
            ["Email", staff.email || "—"],
            ["Phone", staff.phone || "—"],
            ["Gender", staff.gender || "—"],
            [
              "Last Login",
              staff.lastLogin ? new Date(staff.lastLogin).toLocaleString() : "Never logged in",
            ],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">{label}</dt>
              <dd className="text-sm text-[#1A3A5C] mt-1">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {staff.role === "teacher" ? (
        <AssignmentsPanel staffId={staff.id} />
      ) : (
        <div className="bg-white rounded-xl border border-[#C5D8EC] p-6 shadow-sm">
          <p className="text-sm text-[#5A7A9A]">
            This staff member is non-teaching and isn't assigned subjects or classes. Change their
            role to Teacher from the Staff list to enable assignment.
          </p>
        </div>
      )}
    </div>
  );
};

export default StaffDetailPage;
