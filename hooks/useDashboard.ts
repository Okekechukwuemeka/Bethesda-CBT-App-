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

interface SummaryExamRow {
  id: string;
  subject: string;
  class: string;
  term: string;
  totalQuestions: number;
  duration: number;
  status: string;
  date: string;
  totalStudents: number;
  completedCount: number;
}

interface SummaryStudentRow {
  id: string;
  firstName: string;
  lastName: string;
  class: string;
  admissionNumber: string;
  examsTaken: number;
  avgScore: number;
  isActive: boolean;
  createdAt: string;
}

interface ActivityRow {
  id: string;
  student: string;
  exam: string;
  subject: string;
  action: string;
  status: RecentActivity["status"];
  submissionStatus: string;
  score: number;
  totalMarks: number;
  timeTakenSeconds: number | null;
  submittedAt: string | null;
  time: string;
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
        const [summaryRes, activityRes] = await Promise.all([
          fetch("/api/admin/dashboard/summary"),
          fetch("/api/admin/activity?limit=50"),
        ]);

        if (!summaryRes.ok || !activityRes.ok) {
          throw new Error("Failed to load dashboard data");
        }

        const {
          stats: apiStats,
          exams,
          students,
        }: {
          stats: DashboardStats;
          exams: SummaryExamRow[];
          students: SummaryStudentRow[];
        } = await summaryRes.json();
        const { activities }: { activities: ActivityRow[] } = await activityRes.json();

        if (cancelled) return;

        setStats(apiStats);

        // --- upcoming exams ---
        const now = new Date();
        const todayStr = now.toISOString().split("T")[0];
        const upcoming = exams
          .filter((e) => new Date(e.date) >= now || e.status === "Ongoing")
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .slice(0, 4)
          .map((e) => ({
            id: e.id,
            subject: e.subject,
            class: e.class,
            date: e.date,
            time: new Date(e.date).toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
            }),
            status:
              e.status === "Ongoing"
                ? "ongoing"
                : e.date.split("T")[0] === todayStr
                  ? "today"
                  : ("upcoming" as UpcomingExam["status"]),
          }));
        setUpcomingExams(upcoming);

        // --- exams tab ---
        setExamsData(
          exams.map((e) => ({
            id: e.id,
            subject: e.subject,
            class: e.class,
            term: e.term,
            totalQuestions: e.totalQuestions,
            duration: `${e.duration} minutes`,
            status: examStatusToTabStatus(e.status),
            date: e.date,
            participants: e.totalStudents,
          })),
        );

        // --- students tab ---
        setStudentsData(
          students.map((s) => ({
            id: s.id,
            name: `${s.firstName} ${s.lastName}`,
            class: s.class,
            admissionNumber: s.admissionNumber,
            examsTaken: s.examsTaken,
            avgScore: s.avgScore,
            status: s.class === "graduated" ? "graduated" : s.isActive ? "active" : "inactive",
            createdAt: s.createdAt,
          })),
        );

        // --- recent activity (overview tab) ---
        setRecentActivities(
          activities.slice(0, 5).map((a) => ({
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

        // --- submissions tab ---
        setSubmissionsData(
          activities
            .filter((a) => a.submissionStatus === "Marked" || a.submissionStatus === "Submitted")
            .map((a) => ({
              id: a.id,
              student: a.student,
              exam: a.exam,
              subject: a.subject,
              submittedDate: a.submittedAt ?? "",
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
