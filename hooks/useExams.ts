"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Exam } from "../types/exam.types";
import type { PaginationInfo } from "@/lib/pagination";

interface StatusMessage {
  type: "success" | "error" | "warning";
  text: string;
}

// "" means "no filter". Dates are plain calendar days (YYYY-MM-DD) exactly as
// an <input type="date"> gives them.
export interface ExamFilterValues {
  search: string;
  class: string;
  subject: string;
  term: string;
  status: string;
  dateFrom: string;
  dateTo: string;
}

const EMPTY_FILTERS: ExamFilterValues = {
  search: "",
  class: "",
  subject: "",
  term: "",
  status: "",
  dateFrom: "",
  dateTo: "",
};

const PAGE_SIZE = 12;

// Filters and page live in the URL (?class=JSS1&page=3) so that going to an
// exam's Edit page and pressing Back, or refreshing, lands on the same page
// of the same results instead of resetting to the top of the full list.
const URL_KEYS: Record<keyof ExamFilterValues, string> = {
  search: "q",
  class: "class",
  subject: "subject",
  term: "term",
  status: "status",
  dateFrom: "from",
  dateTo: "to",
};

// The browser's own local midnight-to-midnight, converted to exact instants.
// Done here, not on the server, because "26 March" means a different UTC
// range depending on where the admin is.
function startOfLocalDay(day: string): string | null {
  const [y, m, d] = day.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 0, 0, 0, 0).toISOString();
}
function endOfLocalDay(day: string): string | null {
  const [y, m, d] = day.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 23, 59, 59, 999).toISOString();
}

export const useExams = () => {
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<ExamFilterValues>(() => {
    const initial = { ...EMPTY_FILTERS };
    (Object.keys(URL_KEYS) as (keyof ExamFilterValues)[]).forEach((key) => {
      initial[key] = searchParams.get(URL_KEYS[key]) ?? "";
    });
    return initial;
  });
  const [page, setPage] = useState(() => {
    const n = Number.parseInt(searchParams.get("page") ?? "", 10);
    return Number.isFinite(n) && n > 0 ? n : 1;
  });
  // The search box is debounced so typing doesn't fire a request per keystroke.
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);

  const [exams, setExams] = useState<Exam[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    pageSize: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true); // first load only
  const [isRefreshing, setIsRefreshing] = useState(false); // later page/filter loads
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const hasLoadedOnce = useRef(false);

  const [subjects, setSubjects] = useState<{ _id: string; name: string }[]>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);

  // Delete confirmation lives in the hook (not the page/list component) so
  // any component rendering the exams list can trigger it the same way,
  // without each one re-implementing its own confirm dialog.
  const [examPendingDelete, setExamPendingDelete] = useState<Exam | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filters.search), 300);
    return () => clearTimeout(timer);
  }, [filters.search]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/subjects");
        if (!res.ok) return;
        const { subjects: apiSubjects } = await res.json();
        if (!cancelled) setSubjects(apiSubjects);
      } finally {
        if (!cancelled) setIsLoadingSubjects(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // --- load the current page for the current filters ---
  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      if (hasLoadedOnce.current) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);
      try {
        const query = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
        if (debouncedSearch.trim()) query.set("search", debouncedSearch.trim());
        if (filters.class) query.set("class", filters.class);
        if (filters.subject) query.set("subject", filters.subject);
        if (filters.term) query.set("term", filters.term);
        if (filters.status) query.set("status", filters.status);
        const from = filters.dateFrom ? startOfLocalDay(filters.dateFrom) : null;
        const to = filters.dateTo ? endOfLocalDay(filters.dateTo) : null;
        if (from) query.set("dateFrom", from);
        if (to) query.set("dateTo", to);

        const res = await fetch(`/api/admin/exams?${query.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Failed to load exams");
        const { exams: apiExams, pagination: apiPagination } = await res.json();

        setExams(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          apiExams.map((e: any) => ({
            id: e._id,
            title: e.title,
            subject: {
              id: e.subject?._id,
              name: e.subject?.name ?? "Unknown",
              code: e.subject?.code ?? "",
            },
            class: e.class,
            classes: e.classes,
            isGeneral: e.isGeneral,
            term: e.term,
            academicYear: e.academicYear,
            examDate: e.examDate,
            duration: e.duration,
            type: e.type,
            questionCount: e.questionCount,
            totalMarks: e.totalMarks,
            status: e.status,
            examCode: e.examCode,
            isCodeActive: e.isCodeActive,
            instructions: e.instructions,
            objectiveInstructions: e.objectiveInstructions,
            theoryInstructions: e.theoryInstructions,
            passingScore: e.passingScore,
            shuffleQuestions: e.shuffleQuestions,
          })),
        );
        setPagination(apiPagination);
        // The server clamps an out-of-range page (e.g. after deleting the
        // last exam on the last page) - follow it.
        if (apiPagination.page !== page) setPage(apiPagination.page);
        hasLoadedOnce.current = true;
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Failed to fetch exams");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    })();

    return () => controller.abort();
  }, [
    page,
    debouncedSearch,
    filters.class,
    filters.subject,
    filters.term,
    filters.status,
    filters.dateFrom,
    filters.dateTo,
    reloadKey,
  ]);

  // --- mirror state into the URL (no navigation, no re-render of the route) ---
  useEffect(() => {
    const query = new URLSearchParams();
    (Object.keys(URL_KEYS) as (keyof ExamFilterValues)[]).forEach((key) => {
      const value = key === "search" ? debouncedSearch : filters[key];
      if (value) query.set(URL_KEYS[key], value);
    });
    if (page > 1) query.set("page", String(page));
    const qs = query.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [filters, debouncedSearch, page]);

  const setFilter = useCallback(
    <K extends keyof ExamFilterValues>(key: K, value: ExamFilterValues[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
      setPage(1);
    },
    [],
  );

  const clearFilters = useCallback(() => {
    setFilters(EMPTY_FILTERS);
    setDebouncedSearch("");
    setPage(1);
  }, []);

  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  const fetchExams = useCallback(() => setReloadKey((k) => k + 1), []);

  const requestDelete = useCallback((exam: Exam) => {
    setExamPendingDelete(exam);
  }, []);

  const cancelDelete = useCallback(() => {
    setExamPendingDelete(null);
  }, []);

  // Deleting an exam keeps its student results (the server preserves them),
  // so a single confirmation is enough.
  const performDelete = useCallback(async () => {
    if (!examPendingDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/exams/${examPendingDelete.id}`, { method: "DELETE" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Failed to delete exam");

      const kept = typeof body.preservedResults === "number" ? body.preservedResults : 0;
      setStatusMessage({
        type: "success",
        text:
          kept > 0
            ? `"${examPendingDelete.title}" was deleted. Its ${kept} student result${kept !== 1 ? "s were" : " was"} kept under Results.`
            : `"${examPendingDelete.title}" was deleted.`,
      });
      setExamPendingDelete(null);
      // Reload the current page: the rows after the deleted one move up, and
      // the totals/page count change.
      setReloadKey((k) => k + 1);
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to delete exam.",
      });
      setExamPendingDelete(null);
    } finally {
      setIsDeleting(false);
    }
  }, [examPendingDelete]);

  return {
    exams,
    pagination,
    pageSize: PAGE_SIZE,
    isLoading,
    isRefreshing,
    error,
    statusMessage,
    fetchExams,
    filters,
    hasActiveFilters,
    setFilter,
    clearFilters,
    setPage,
    subjects,
    isLoadingSubjects,
    examPendingDelete,
    isDeleting,
    requestDelete,
    cancelDelete,
    performDelete,
  };
};
