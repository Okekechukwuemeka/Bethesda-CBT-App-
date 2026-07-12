"use client";

import { SessionProvider } from "next-auth/react";
import React from "react";

// next-auth/react's signIn() and useSession() both need to be inside this
// context to work. It has to be a separate client component because
// layouts can be server components by default, and SessionProvider itself
// uses React context (client-only).
export default function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
