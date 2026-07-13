"use client";

import { useEffect, useState } from "react";

export interface DashboardStats {
  totalStudents: number;
  totalExams: number;
  activeExams: number;
  pendingSubmissions: number;
  completionRate: number;
}

export interface RecentActivity {
  id: string;
  student: string;
  exam: string;
  action: string;
  time: string;
  status: "completed" | "in-progress" | "pending";
}

export interface UpcomingExam {
  id: string;
  subject: string;
  class: string;
  date: string;
  time: string;
  status: "upcoming" | "today" | "ongoing";
}

export interface ExamData {
  id: string;
  subject: string;
  class: string;
  term: string;
  totalQuestions: number;
  duration: string;
  status: "active" | "scheduled" | "completed";
  date: string;
  participants: number;
}

export interface StudentData {
  id: string;
  name: string;
  class: string;
  admissionNumber: string;
  examsTaken: number;
  avgScore: number;
  status: "active" | "inactive" | "graduated";
  createdAt: string;
}

export interface SubmissionData {
  id: string;
  student: string;
  exam: string;
  subject: string;
  submittedDate: string;
  score: number | null;
  status: "graded" | "pending";
  timeTaken: string;
}

function formatDuration(seconds: number | null): string {
  if (seconds === null) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function examStatusToTabStatus(status: string): ExamData["status"] {
  if (status === "Ongoing") return "active";
  if (status === "Completed") return "completed";
  return "scheduled";
}

export function useDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalExams: 0,
    activeExams: 0,
    pendingSubmissions: 0,
    completionRate: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [upcomingExams, setUpcomingExams] = useState<UpcomingExam[]>([]);
  const [examsData, setExamsData] = useState<ExamData[]>([]);
  const [studentsData, setStudentsData] = useState<StudentData[]>([]);
  const [submissionsData, setSubmissionsData] = useState<SubmissionData[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const [studentsRes, examsRes, resultsRes, activityRes] = await Promise.all([
          fetch("/api/admin/students"),
          fetch("/api/admin/exams"),
          fetch("/api/admin/results"),
          fetch("/api/admin/activity?limit=50"),
        ]);

        if (!studentsRes.ok || !examsRes.ok || !resultsRes.ok || !activityRes.ok) {
          throw new Error("Failed to load dashboard data");
        }

        const { students } = await studentsRes.json();
        const { exams } = await examsRes.json();
        const { results } = await resultsRes.json();
        const { activities } = await activityRes.json();

        if (cancelled) return;

        // --- stats ---
        const activeExams = exams.filter((e: any) => e.status === "Ongoing").length;
        const totalPossible = results.reduce((sum: number, r: any) => sum + r.totalStudents, 0);
        const totalCompleted = results.reduce((sum: number, r: any) => sum + r.completedCount, 0);
        setStats({
          totalStudents: students.length,
          totalExams: exams.length,
          activeExams,
          pendingSubmissions: Math.max(0, totalPossible - totalCompleted),
          completionRate:
            totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0,
        });

        // --- upcoming exams ---
        const now = new Date();
        const todayStr = now.toISOString().split("T")[0];
        const upcoming = exams
          .filter((e: any) => new Date(e.examDate) >= now || e.status === "Ongoing")
          .sort((a: any, b: any) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime())
          .slice(0, 4)
          .map((e: any) => ({
            id: e._id,
            subject: e.subject?.name ?? "Unknown subject",
            class: e.class,
            date: e.examDate,
            time: new Date(e.examDate).toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
            }),
            status:
              e.status === "Ongoing"
                ? "ongoing"
                : e.examDate.split("T")[0] === todayStr
                  ? "today"
                  : "upcoming",
          }));
        setUpcomingExams(upcoming);

        // --- exams tab (merge exams + results by id) ---
        const resultsByExamId = new Map(results.map((r: any) => [r.examId, r]));
        setExamsData(
          exams.map((e: any) => {
            const result = resultsByExamId.get(e._id) as any;
            return {
              id: e._id,
              subject: e.subject?.name ?? "Unknown subject",
              class: e.class,
              term: e.term,
              totalQuestions: e.questionCount,
              duration: `${e.duration} minutes`,
              status: examStatusToTabStatus(e.status),
              date: e.examDate,
              participants: result?.totalStudents ?? 0,
            };
          }),
        );

        // --- students tab ---
        setStudentsData(
          students.map((s: any) => {
            const completed = s.completedExams ?? [];
            const avgScore =
              completed.length > 0
                ? Math.round(
                    completed.reduce((sum: number, c: any) => sum + c.score, 0) / completed.length,
                  )
                : 0;
            return {
              id: s._id,
              name: `${s.firstName} ${s.lastName}`,
              class: s.class,
              admissionNumber: s.admissionNumber,
              examsTaken: completed.length,
              avgScore,
              status: s.class === "graduated" ? "graduated" : s.isActive ? "active" : "inactive",
              createdAt: s.createdAt,
            };
          }),
        );

        // --- recent activity (dashboard overview tab) ---
        setRecentActivities(
          activities.slice(0, 5).map((a: any) => ({
            id: a.id,
            student: a.student,
            exam: a.exam,
            action: a.action,
            time: new Date(a.time).toLocaleString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              month: "short",
              day: "numeric",
            }),
            status: a.status,
          })),
        );

        // --- submissions tab (only actually-submitted work, not in-progress) ---
        setSubmissionsData(
          activities
            .filter(
              (a: any) => a.submissionStatus === "Marked" || a.submissionStatus === "Submitted",
            )
            .map((a: any) => ({
              id: a.id,
              student: a.student,
              exam: a.exam,
              subject: a.subject,
              submittedDate: a.submittedAt,
              score:
                a.submissionStatus === "Marked" && a.totalMarks > 0
                  ? Math.round((a.score / a.totalMarks) * 100)
                  : null,
              status: a.submissionStatus === "Marked" ? "graded" : "pending",
              timeTaken: formatDuration(a.timeTakenSeconds),
            })),
        );
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load dashboard");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    isLoading,
    error,
    stats,
    recentActivities,
    upcomingExams,
    examsData,
    studentsData,
    submissionsData,
  };
}
