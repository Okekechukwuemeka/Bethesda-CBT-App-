export type StaffRole = "teacher" | "non_teaching";

export interface AssignedSubject {
  id: string;
  name: string;
  code: string;
}

export interface StaffMember {
  id: string;
  staffId: string;
  username: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  gender?: "Male" | "Female" | "Other";
  role: StaffRole;
  isActive: boolean;
  assignedSubjects: AssignedSubject[];
  assignedClasses: string[];
  lastLogin?: string;
  createdAt?: string;
}

export interface CreatedStaffInfo {
  name: string;
  staffId: string;
  username: string;
  tempPassword?: string;
}
