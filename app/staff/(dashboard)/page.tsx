"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useTeacherProfileStore } from "@/store/useTeacherProfileStore";

const StaffDashboardPage: React.FC = () => {
  const { profile, isLoading, error, fetchProfile } = useTeacherProfileStore();

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" role="status" aria-live="polite">
        <div className="text-center">
          <div
            className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#1A3A5C] border-t-transparent"
            aria-hidden="true"
          />
          <p className="mt-4 text-[#4A6A8A]">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div
        role="alert"
        className="p-4 rounded-lg text-sm font-medium bg-red-100 text-red-800 border border-red-300">
        {error ?? "Could not load your profile."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A3A5C]">
          Welcome, {profile.firstName} {profile.lastName}
        </h1>
        <p className="text-[#5A7A9A] text-sm">{profile.staffId}</p>
      </div>

      {profile.role === "teacher" ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-[#C5D8EC] p-6 shadow-sm">
              <h2 className="text-sm font-medium text-[#5A7A9A] uppercase tracking-wider">
                Assigned Subjects
              </h2>
              {profile.assignedSubjects.length === 0 ? (
                <p className="text-sm text-[#8AA5BE] mt-2">
                  No subjects assigned yet — contact your administrator.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2 mt-3">
                  {profile.assignedSubjects.map((s) => (
                    <span
                      key={s.id}
                      className="bg-[#E8EEF5] text-[#1A3A5C] text-sm font-medium px-3 py-1 rounded-full">
                      {s.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-white rounded-xl border border-[#C5D8EC] p-6 shadow-sm">
              <h2 className="text-sm font-medium text-[#5A7A9A] uppercase tracking-wider">
                Assigned Classes
              </h2>
              {profile.assignedClasses.length === 0 ? (
                <p className="text-sm text-[#8AA5BE] mt-2">
                  No classes assigned yet — contact your administrator.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2 mt-3">
                  {profile.assignedClasses.map((c) => (
                    <span
                      key={c}
                      className="bg-[#E8EEF5] text-[#1A3A5C] text-sm font-medium px-3 py-1 rounded-full">
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/staff/questions"
              className="bg-[#1A3A5C] hover:bg-[#14304D] text-white rounded-xl p-6 shadow-sm transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/50">
              <h3 className="font-bold text-lg">Question Bank</h3>
              <p className="text-white/70 text-sm mt-1">Add or import questions for your subjects</p>
            </Link>
            <Link
              href="/staff/results"
              className="bg-[#1A3A5C] hover:bg-[#14304D] text-white rounded-xl p-6 shadow-sm transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/50">
              <h3 className="font-bold text-lg">Results</h3>
              <p className="text-white/70 text-sm mt-1">View results for your classes</p>
            </Link>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl border border-[#C5D8EC] p-6 shadow-sm">
          <p className="text-sm text-[#5A7A9A]">
            You're signed in as non-teaching staff. Question management and results are only
            available to staff with the teacher role.
          </p>
        </div>
      )}
    </div>
  );
};

export default StaffDashboardPage;
