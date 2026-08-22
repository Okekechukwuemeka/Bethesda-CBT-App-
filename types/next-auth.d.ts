import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";
import { ClassLevel, StaffRole } from "../models/constants";

export type UserRole = "admin" | "student" | "staff";

interface AppUserFields {
  id: string;
  role: UserRole;
  username?: string;
  admissionNumber?: string;
  class?: ClassLevel;
  // Only set when role === "staff" - distinguishes a teacher (can be
  // assigned subjects/classes, gets Questions + Results) from other staff
  // (dashboard only). See requireTeacher in lib/api-guards.ts.
  staffRole?: StaffRole;
}

declare module "next-auth" {
  interface Session {
    user: AppUserFields & DefaultSession["user"];
  }

  interface User extends DefaultUser, AppUserFields {}
}

declare module "next-auth/adapters" {
  interface AdapterUser extends AppUserFields {}
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT, Partial<AppUserFields> {
    id?: string;
  }
}
