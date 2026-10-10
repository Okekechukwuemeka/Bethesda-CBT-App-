"use client";

import { useCallback, useEffect, useState } from "react";
import type { QuestionGroupSummary } from "@/types/question";

interface Options {
  // "admin" lists every group in the bank; "staff" only those inside the
  // teacher's own assigned subjects/classes (the server enforces this).
  scope: "admin" | "staff";
  subject?: string;
  classLevel?: string;
  // Skip fetching entirely (e.g. while the list isn't on screen yet).
  enabled?: boolean;
}

export interface UseQuestionGroups {
  groups: QuestionGroupSummary[];
  ungroupedCount: number;
  total: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

// The question groups available to pick from or filter by, with how many
// questions each holds. Call refresh() after anything that creates, moves or
// deletes questions so the counts and any brand-new group names appear.
export function useQuestionGroups({
  scope,
  subject = "",
  classLevel = "",
  enabled = true,
}: Options): UseQuestionGroups {
  const [groups, setGroups] = useState<QuestionGroupSummary[]>([]);
  const [ungroupedCount, setUngroupedCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();

    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const query = new URLSearchParams();
        if (subject) query.set("subject", subject);
        if (classLevel) query.set("class", classLevel);
        const res = await fetch(`/api/${scope}/questions/groups?${query.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Could not load question groups");
        const data = await res.json();
        setGroups(data.groups ?? []);
        setUngroupedCount(data.ungroupedCount ?? 0);
        setTotal(data.total ?? 0);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Could not load question groups");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    })();

    return () => controller.abort();
  }, [scope, subject, classLevel, enabled, refreshKey]);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  return { groups, ungroupedCount, total, isLoading, error, refresh };
}
