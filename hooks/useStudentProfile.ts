"use client";

import { useCallback, useEffect, useState } from "react";
import type { StudentProfileResponse } from "@/types/student-profile";

const REFRESH_MS = 60_000;

// Loads one student's profile and keeps it fresh: it refetches every minute
// while the tab is visible and again whenever the admin comes back to the tab,
// so newly scheduled exams and freshly entered marks show up without a manual
// reload.
export function useStudentProfile(studentId: string) {
  const [data, setData] = useState<StudentProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (background: boolean) => {
      try {
        const res = await fetch(`/api/admin/students/${studentId}/profile`, { cache: "no-store" });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.error ?? "Failed to load the student profile.");
        setData(body as StudentProfileResponse);
        setError(null);
      } catch (err) {
        // A failed background refresh keeps showing the last good data.
        if (!background) setError(err instanceof Error ? err.message : "Failed to load.");
      } finally {
        if (!background) setIsLoading(false);
      }
    },
    [studentId],
  );

  useEffect(() => {
    // Initial fetch on mount; state is only set after the request resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(false);
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") void load(true);
    }, REFRESH_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void load(true);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  return { data, isLoading, error };
}
