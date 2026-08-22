import { create } from "zustand";
import type { StaffMember, AssignedSubject } from "@/types/staff";

interface StatusMessage {
  type: "success" | "error";
  text: string;
}

async function parseErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    return body.error ?? fallback;
  } catch {
    return fallback;
  }
}

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

interface StaffDetailState {
  staff: StaffMember | null;
  isLoading: boolean;
  error: string | null;
  statusMessage: StatusMessage | null;

  allSubjects: AssignedSubject[];
  isLoadingSubjects: boolean;
  isSavingAssignment: boolean;

  fetchStaff: (id: string) => Promise<void>;
  fetchSubjects: () => Promise<void>;
  addSubject: (id: string, subjectId: string) => Promise<void>;
  removeSubject: (id: string, subjectId: string) => Promise<void>;
  addClass: (id: string, classLevel: string) => Promise<void>;
  removeClass: (id: string, classLevel: string) => Promise<void>;
}

export const useStaffDetailStore = create<StaffDetailState>((set, get) => ({
  staff: null,
  isLoading: true,
  error: null,
  statusMessage: null,

  allSubjects: [],
  isLoadingSubjects: false,
  isSavingAssignment: false,

  fetchStaff: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/admin/staff/${id}`);
      if (!res.ok) throw new Error(await parseErrorMessage(res, "Failed to load staff member"));
      const { staff } = await res.json();
      set({ staff: fromApiStaff(staff) });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Failed to load staff member." });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchSubjects: async () => {
    set({ isLoadingSubjects: true });
    try {
      const res = await fetch("/api/admin/subjects?status=active");
      if (!res.ok) throw new Error("Failed to load subjects");
      const { subjects } = await res.json();
      set({
        allSubjects: subjects.map((s: any) => ({ id: s._id ?? s.id, name: s.name, code: s.code })),
      });
    } catch {
      // Non-fatal - the assignment panel just shows an empty subject picker.
    } finally {
      set({ isLoadingSubjects: false });
    }
  },

  addSubject: async (id, subjectId) => {
    await applyAssignment(set, get, id, { addSubjects: [subjectId] });
  },
  removeSubject: async (id, subjectId) => {
    await applyAssignment(set, get, id, { removeSubjects: [subjectId] });
  },
  addClass: async (id, classLevel) => {
    await applyAssignment(set, get, id, { addClasses: [classLevel] });
  },
  removeClass: async (id, classLevel) => {
    await applyAssignment(set, get, id, { removeClasses: [classLevel] });
  },
}));

async function applyAssignment(
  set: (partial: Partial<StaffDetailState>) => void,
  get: () => StaffDetailState,
  id: string,
  body: Record<string, string[]>,
) {
  set({ isSavingAssignment: true });
  try {
    const res = await fetch(`/api/admin/staff/${id}/assignments`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await parseErrorMessage(res, "Failed to update assignment"));
    const { staff } = await res.json();
    set({
      staff: fromApiStaff(staff),
      statusMessage: { type: "success", text: "Assignment updated." },
    });
  } catch (err) {
    set({
      statusMessage: {
        type: "error",
        text: err instanceof Error ? err.message : "Failed to update assignment.",
      },
    });
  } finally {
    set({ isSavingAssignment: false });
  }
}
