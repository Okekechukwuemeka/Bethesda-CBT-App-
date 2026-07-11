import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";
import { ClassLevel } from "../models/constants";

export type UserRole = "admin" | "student";

interface AppUserFields {
  id: string;
  role: UserRole;
  username?: string;
  admissionNumber?: string;
  class?: ClassLevel;
  mustChangePassword?: boolean;
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
