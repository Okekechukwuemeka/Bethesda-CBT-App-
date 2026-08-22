import { create } from "zustand";
import type { StaffMember, CreatedStaffInfo, StaffRole } from "@/types/staff";

interface StatusMessage {
  type: "success" | "error" | "warning";
  text: string;
}

export interface StaffFormData {
  firstName: string;
  lastName: string;
  username: string;
  role: StaffRole;
  email: string;
  phone: string;
  gender: "Male" | "Female" | "Other";
  isActive: boolean;
}

const emptyForm: StaffFormData = {
  firstName: "",
  lastName: "",
  username: "",
  role: "teacher",
  email: "",
  phone: "",
  gender: "Male",
  isActive: true,
};

interface StaffStoreState {
  staff: StaffMember[];
  isLoading: boolean;
  statusMessage: StatusMessage | null;

  searchTerm: string;
  filterRole: string; // "all" | StaffRole
  filterStatus: string; // "all" | "active" | "inactive"

  isModalOpen: boolean;
  isEditing: boolean;
  selectedStaff: StaffMember | null;
  formData: StaffFormData;
  fieldErrors: Partial<Record<keyof StaffFormData, string>>;
  isSubmitting: boolean;

  isDeleteModalOpen: boolean;

  createdStaffInfo: CreatedStaffInfo | null;
  isCreatedModalOpen: boolean;

  selectedIds: Set<string>;
  isBulkDeleteModalOpen: boolean;
  isBulkDeleting: boolean;

  // actions
  fetchStaff: () => Promise<void>;
  setSearchTerm: (v: string) => void;
  setFilterRole: (v: string) => void;
  setFilterStatus: (v: string) => void;
  filteredStaff: () => StaffMember[];

  openAddModal: () => void;
  openEditModal: (staff: StaffMember) => void;
  closeFormModal: () => void;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => void;
  submitForm: (e: React.FormEvent) => Promise<void>;

  openDeleteModal: (staff: StaffMember) => void;
  closeDeleteModal: () => void;
  confirmDelete: () => Promise<void>;

  closeCreatedModal: () => void;

  toggleSelect: (id: string) => void;
  toggleSelectAll: () => void;
  clearSelection: () => void;
  requestBulkDelete: () => void;
  closeBulkDeleteModal: () => void;
  confirmBulkDelete: () => Promise<void>;
}

async function parseErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    return body.error ?? fallback;
  } catch {
    return fallback;
  }
}

// Maps a raw API staff document onto the shape this store/UI works with.
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

function validate(formData: StaffFormData): Partial<Record<keyof StaffFormData, string>> {
  const errors: Partial<Record<keyof StaffFormData, string>> = {};
  if (!formData.firstName.trim()) errors.firstName = "First name is required.";
  if (!formData.lastName.trim()) errors.lastName = "Last name is required.";
  if (!formData.username.trim()) errors.username = "Username is required.";
  else if (formData.username.trim().length < 3) errors.username = "At least 3 characters.";
  return errors;
}

export const useStaffStore = create<StaffStoreState>((set, get) => ({
  staff: [],
  isLoading: true,
  statusMessage: null,

  searchTerm: "",
  filterRole: "all",
  filterStatus: "all",

  isModalOpen: false,
  isEditing: false,
  selectedStaff: null,
  formData: emptyForm,
  fieldErrors: {},
  isSubmitting: false,

  isDeleteModalOpen: false,

  createdStaffInfo: null,
  isCreatedModalOpen: false,

  selectedIds: new Set(),
  isBulkDeleteModalOpen: false,
  isBulkDeleting: false,

  fetchStaff: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch("/api/admin/staff");
      if (!res.ok) throw new Error(await parseErrorMessage(res, "Failed to load staff"));
      const { staff } = await res.json();
      set({ staff: staff.map(fromApiStaff) });
    } catch (err) {
      set({
        statusMessage: {
          type: "error",
          text: err instanceof Error ? err.message : "Failed to load staff.",
        },
      });
    } finally {
      set({ isLoading: false });
    }
  },

  setSearchTerm: (v) => set({ searchTerm: v }),
  setFilterRole: (v) => set({ filterRole: v }),
  setFilterStatus: (v) => set({ filterStatus: v }),

  filteredStaff: () => {
    const { staff, searchTerm, filterRole, filterStatus } = get();
    return staff.filter((s) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        s.firstName.toLowerCase().includes(term) ||
        s.lastName.toLowerCase().includes(term) ||
        s.username.toLowerCase().includes(term) ||
        s.staffId.toLowerCase().includes(term);
      const matchesRole = filterRole === "all" || s.role === filterRole;
      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "active" ? s.isActive : !s.isActive);
      return matchesSearch && matchesRole && matchesStatus;
    });
  },

  openAddModal: () => {
    set({ isEditing: false, selectedStaff: null, fieldErrors: {}, formData: emptyForm, isModalOpen: true });
  },

  openEditModal: (staff) => {
    set({
      isEditing: true,
      selectedStaff: staff,
      fieldErrors: {},
      formData: {
        firstName: staff.firstName,
        lastName: staff.lastName,
        username: staff.username,
        role: staff.role,
        email: staff.email ?? "",
        phone: staff.phone ?? "",
        gender: staff.gender ?? "Male",
        isActive: staff.isActive,
      },
      isModalOpen: true,
    });
  },

  closeFormModal: () => {
    if (!get().isSubmitting) set({ isModalOpen: false, fieldErrors: {} });
  },

  handleInputChange: (e) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    set((state) => ({
      formData: { ...state.formData, [name]: type === "checkbox" ? checked : value },
      fieldErrors: { ...state.fieldErrors, [name]: undefined },
    }));
  },

  submitForm: async (e) => {
    e.preventDefault();
    const { formData, isEditing, selectedStaff } = get();
    const errors = validate(formData);
    set({ fieldErrors: errors });
    if (Object.keys(errors).length > 0) {
      set({
        statusMessage: {
          type: "error",
          text: `Please fix ${Object.keys(errors).length} field(s) before submitting.`,
        },
      });
      return;
    }

    set({ isSubmitting: true, statusMessage: null });

    const payload = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      username: formData.username,
      role: formData.role,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      gender: formData.gender,
      isActive: formData.isActive,
    };

    try {
      if (isEditing && selectedStaff) {
        const res = await fetch(`/api/admin/staff/${selectedStaff.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(await parseErrorMessage(res, "Failed to update staff member"));
        const { staff } = await res.json();
        set((state) => ({
          staff: state.staff.map((s) => (s.id === selectedStaff.id ? fromApiStaff(staff) : s)),
          statusMessage: {
            type: "success",
            text: `${formData.firstName} ${formData.lastName} updated successfully.`,
          },
        }));
      } else {
        const res = await fetch("/api/admin/staff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(await parseErrorMessage(res, "Failed to create staff member"));
        const { staff, tempPassword } = await res.json();
        set((state) => ({
          staff: [fromApiStaff(staff), ...state.staff],
          statusMessage: {
            type: "success",
            text: `${formData.firstName} ${formData.lastName} added successfully.`,
          },
          createdStaffInfo: {
            name: `${staff.firstName} ${staff.lastName}`,
            staffId: staff.staffId,
            username: staff.username,
            tempPassword,
          },
          isCreatedModalOpen: true,
        }));
      }
      set({ isSubmitting: false, isModalOpen: false });
    } catch (err) {
      set({
        isSubmitting: false,
        statusMessage: {
          type: "error",
          text: err instanceof Error ? err.message : "Something went wrong.",
        },
      });
    }
  },

  openDeleteModal: (staff) => set({ selectedStaff: staff, isDeleteModalOpen: true }),
  closeDeleteModal: () => set({ isDeleteModalOpen: false }),

  confirmDelete: async () => {
    const { selectedStaff } = get();
    if (!selectedStaff) return;
    try {
      const res = await fetch(`/api/admin/staff/${selectedStaff.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await parseErrorMessage(res, "Failed to delete staff member"));
      set((state) => ({
        staff: state.staff.filter((s) => s.id !== selectedStaff.id),
        statusMessage: {
          type: "warning",
          text: `${selectedStaff.firstName} ${selectedStaff.lastName} has been deleted.`,
        },
      }));
    } catch (err) {
      set({
        statusMessage: {
          type: "error",
          text: err instanceof Error ? err.message : "Failed to delete staff member.",
        },
      });
    } finally {
      set({ isDeleteModalOpen: false, selectedStaff: null });
    }
  },

  closeCreatedModal: () => set({ isCreatedModalOpen: false, createdStaffInfo: null }),

  toggleSelect: (id) =>
    set((state) => {
      const next = new Set(state.selectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { selectedIds: next };
    }),

  toggleSelectAll: () => {
    const visible = get().filteredStaff();
    set((state) => ({
      selectedIds:
        state.selectedIds.size === visible.length
          ? new Set()
          : new Set(visible.map((s) => s.id)),
    }));
  },

  clearSelection: () => set({ selectedIds: new Set() }),

  requestBulkDelete: () => {
    if (get().selectedIds.size === 0) return;
    set({ isBulkDeleteModalOpen: true });
  },

  closeBulkDeleteModal: () => {
    if (get().isBulkDeleting) return;
    set({ isBulkDeleteModalOpen: false });
  },

  confirmBulkDelete: async () => {
    const { selectedIds } = get();
    if (selectedIds.size === 0) return;
    set({ isBulkDeleting: true });
    try {
      const res = await fetch("/api/admin/staff/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      if (!res.ok) throw new Error(await parseErrorMessage(res, "Failed to delete staff"));
      const data = await res.json();
      set((state) => ({
        staff: state.staff.filter((s) => !selectedIds.has(s.id)),
        statusMessage: {
          type: "warning",
          text: `${data.deletedCount ?? selectedIds.size} staff member(s) have been deleted.`,
        },
        selectedIds: new Set(),
      }));
    } catch (err) {
      set({
        statusMessage: {
          type: "error",
          text: err instanceof Error ? err.message : "Failed to delete staff.",
        },
      });
    } finally {
      set({ isBulkDeleting: false, isBulkDeleteModalOpen: false });
    }
  },
}));
