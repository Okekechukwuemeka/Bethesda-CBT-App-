import { create } from "zustand";
import type { StaffMember } from "@/types/staff";

function fromApiStaff(s: any): StaffMember {
  return {
    id: s._id ?? s.id,
    staffId: s.staffId,
    username: s.username,
    firstName: s.firstName,
    lastName: s.lastName,
    email: s.email,
    phone: s.phone,
    gender: s.gender,
    role: s.role,
    isActive: s.isActive,
    assignedSubjects: (s.assignedSubjects ?? []).map((sub: any) => ({
      id: sub._id ?? sub.id,
      name: sub.name,
      code: sub.code,
    })),
    assignedClasses: s.assignedClasses ?? [],
    lastLogin: s.lastLogin,
    createdAt: s.createdAt,
  };
}

interface TeacherProfileState {
  profile: StaffMember | null;
  isLoading: boolean;
  error: string | null;
  hasFetched: boolean;
  fetchProfile: () => Promise<void>;
}

// A single shared store rather than page-local state: the sidebar (which
// nav items to show), the dashboard, and the questions/results pages all
// need "is this a teacher, and what are they assigned to" without each
// re-fetching /api/staff/me independently.
export const useTeacherProfileStore = create<TeacherProfileState>((set, get) => ({
  profile: null,
  isLoading: true,
  error: null,
  hasFetched: false,

  fetchProfile: async () => {
    if (get().hasFetched) return;
    set({ isLoading: true, error: null });
    try {
      const res = await fetch("/api/staff/me");
      if (!res.ok) throw new Error("Failed to load your profile");
      const { staff } = await res.json();
      set({ profile: fromApiStaff(staff), hasFetched: true });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to load your profile." });
    } finally {
      set({ isLoading: false });
    }
  },
}));
