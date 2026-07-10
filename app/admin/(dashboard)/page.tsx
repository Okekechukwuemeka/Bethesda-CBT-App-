"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface DashboardStats {
  totalStudents: number;
  totalExams: number;
  activeExams: number;
  pendingSubmissions: number;
  completionRate: number;
}

interface RecentActivity {
  id: number;
  student: string;
  exam: string;
  action: string;
  time: string;
  status: "completed" | "in-progress" | "pending";
}

interface UpcomingExam {
  id: number;
  subject: string;
  class: string;
  date: string;
  time: string;
  status: "upcoming" | "today" | "ongoing";
}

// Mock data interfaces for other tabs
interface ExamData {
  id: number;
  subject: string;
  class: string;
  term: string;
  totalQuestions: number;
  duration: string;
  status: "active" | "scheduled" | "completed";
  date: string;
  participants: number;
}

interface StudentData {
  id: number;
  name: string;
  class: string;
  email: string;
  examsTaken: number;
  avgScore: number;
  status: "active" | "inactive";
  lastActive: string;
}

interface SubmissionData {
  id: number;
  student: string;
  exam: string;
  subject: string;
  submittedDate: string;
  score: number | null;
  status: "graded" | "pending" | "in-review";
  timeTaken: string;
}

const TAB_IDS = ["overview", "exams", "students", "submissions"] as const;
type TabId = (typeof TAB_IDS)[number];

const DashboardPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalExams: 0,
    activeExams: 0,
    pendingSubmissions: 0,
    completionRate: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [upcomingExams, setUpcomingExams] = useState<UpcomingExam[]>([]);
  const [selectedTab, setSelectedTab] = useState<TabId>("overview");

  // Mock data for other tabs
  const [examsData, setExamsData] = useState<ExamData[]>([]);
  const [studentsData, setStudentsData] = useState<StudentData[]>([]);
  const [submissionsData, setSubmissionsData] = useState<SubmissionData[]>([]);

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Mock data - in production, this would come from an API
  useEffect(() => {
    setTimeout(() => {
      setStats({
        totalStudents: 245,
        totalExams: 28,
        activeExams: 6,
        pendingSubmissions: 12,
        completionRate: 78,
      });

      setRecentActivities([
        {
          id: 1,
          student: "John Doe",
          exam: "Chemistry First Term",
          action: "submitted",
          time: "2 minutes ago",
          status: "completed",
        },
        {
          id: 2,
          student: "Jane Smith",
          exam: "Mathematics First Term",
          action: "started",
          time: "15 minutes ago",
          status: "in-progress",
        },
        {
          id: 3,
          student: "Mike Johnson",
          exam: "Physics First Term",
          action: "submitted",
          time: "1 hour ago",
          status: "completed",
        },
        {
          id: 4,
          student: "Sarah Williams",
          exam: "Biology First Term",
          action: "pending review",
          time: "2 hours ago",
          status: "pending",
        },
        {
          id: 5,
          student: "David Brown",
          exam: "English First Term",
          action: "started",
          time: "3 hours ago",
          status: "in-progress",
        },
      ]);

      setUpcomingExams([
        {
          id: 1,
          subject: "Chemistry",
          class: "JSS3",
          date: "2025-07-15",
          time: "7:00 AM",
          status: "today",
        },
        {
          id: 2,
          subject: "Mathematics",
          class: "JSS3",
          date: "2025-07-16",
          time: "9:00 AM",
          status: "upcoming",
        },
        {
          id: 3,
          subject: "Physics",
          class: "JSS3",
          date: "2025-07-17",
          time: "7:00 AM",
          status: "upcoming",
        },
        {
          id: 4,
          subject: "English Language",
          class: "JSS3",
          date: "2025-07-18",
          time: "10:00 AM",
          status: "upcoming",
        },
      ]);

      // Mock data for Exams tab
      setExamsData([
        {
          id: 1,
          subject: "Chemistry",
          class: "JSS3",
          term: "First Term",
          totalQuestions: 50,
          duration: "2 hours",
          status: "active",
          date: "2025-07-15",
          participants: 45,
        },
        {
          id: 2,
          subject: "Mathematics",
          class: "JSS3",
          term: "First Term",
          totalQuestions: 40,
          duration: "2.5 hours",
          status: "scheduled",
          date: "2025-07-16",
          participants: 52,
        },
        {
          id: 3,
          subject: "Physics",
          class: "JSS3",
          term: "First Term",
          totalQuestions: 35,
          duration: "2 hours",
          status: "scheduled",
          date: "2025-07-17",
          participants: 48,
        },
        {
          id: 4,
          subject: "English Language",
          class: "JSS3",
          term: "First Term",
          totalQuestions: 60,
          duration: "2 hours",
          status: "scheduled",
          date: "2025-07-18",
          participants: 55,
        },
        {
          id: 5,
          subject: "Biology",
          class: "JSS2",
          term: "Second Term",
          totalQuestions: 45,
          duration: "1.5 hours",
          status: "completed",
          date: "2025-06-20",
          participants: 38,
        },
        {
          id: 6,
          subject: "History",
          class: "JSS1",
          term: "Second Term",
          totalQuestions: 30,
          duration: "1 hour",
          status: "completed",
          date: "2025-06-18",
          participants: 42,
        },
      ]);

      // Mock data for Students tab
      setStudentsData([
        {
          id: 1,
          name: "John Doe",
          class: "JSS3",
          email: "john.doe@school.edu",
          examsTaken: 8,
          avgScore: 85,
          status: "active",
          lastActive: "2 hours ago",
        },
        {
          id: 2,
          name: "Jane Smith",
          class: "JSS3",
          email: "jane.smith@school.edu",
          examsTaken: 10,
          avgScore: 92,
          status: "active",
          lastActive: "15 minutes ago",
        },
        {
          id: 3,
          name: "Mike Johnson",
          class: "JSS2",
          email: "mike.johnson@school.edu",
          examsTaken: 7,
          avgScore: 78,
          status: "active",
          lastActive: "1 day ago",
        },
        {
          id: 4,
          name: "Sarah Williams",
          class: "JSS3",
          email: "sarah.williams@school.edu",
          examsTaken: 9,
          avgScore: 88,
          status: "inactive",
          lastActive: "3 days ago",
        },
        {
          id: 5,
          name: "David Brown",
          class: "JSS1",
          email: "david.brown@school.edu",
          examsTaken: 6,
          avgScore: 71,
          status: "active",
          lastActive: "5 hours ago",
        },
      ]);

      // Mock data for Submissions tab
      setSubmissionsData([
        {
          id: 1,
          student: "John Doe",
          exam: "Chemistry First Term",
          subject: "Chemistry",
          submittedDate: "2025-07-15",
          score: 85,
          status: "graded",
          timeTaken: "1h 45m",
        },
        {
          id: 2,
          student: "Jane Smith",
          exam: "Mathematics First Term",
          subject: "Mathematics",
          submittedDate: "2025-07-14",
          score: 92,
          status: "graded",
          timeTaken: "2h 10m",
        },
        {
          id: 3,
          student: "Mike Johnson",
          exam: "Physics First Term",
          subject: "Physics",
          submittedDate: "2025-07-15",
          score: null,
          status: "in-review",
          timeTaken: "1h 30m",
        },
        {
          id: 4,
          student: "Sarah Williams",
          exam: "Biology First Term",
          subject: "Biology",
          submittedDate: "2025-07-13",
          score: null,
          status: "pending",
          timeTaken: "1h 15m",
        },
        {
          id: 5,
          student: "David Brown",
          exam: "English First Term",
          subject: "English",
          submittedDate: "2025-07-12",
          score: 78,
          status: "graded",
          timeTaken: "2h 5m",
        },
        {
          id: 6,
          student: "Emily Davis",
          exam: "History Second Term",
          subject: "History",
          submittedDate: "2025-07-11",
          score: 88,
          status: "graded",
          timeTaken: "1h 20m",
        },
      ]);

      setIsLoading(false);
    }, 1000);
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "graded":
      case "today":
        return "bg-green-100 text-green-800";
      case "in-progress":
      case "scheduled":
      case "upcoming":
      case "in-review":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "ongoing":
      case "active":
        return "bg-red-100 text-red-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
      case "graded":
        return "Completed";
      case "in-progress":
        return "In Progress";
      case "pending":
        return "Pending";
      case "today":
        return "Today";
      case "upcoming":
        return "Upcoming";
      case "ongoing":
        return "Ongoing";
      case "active":
        return "Active";
      case "inactive":
        return "Inactive";
      case "scheduled":
        return "Scheduled";
      case "in-review":
        return "In Review";
      default:
        return status;
    }
  };

  const tabLabel = (id: TabId) => {
    switch (id) {
      case "overview":
        return "Overview";
      case "exams":
        return "Exams";
      case "students":
        return "Students";
      case "submissions":
        return "Submissions";
    }
  };

  const tabCount = (id: TabId): number | undefined => {
    switch (id) {
      case "exams":
        return stats.activeExams;
      case "students":
        return stats.totalStudents;
      case "submissions":
        return stats.pendingSubmissions;
      default:
        return undefined;
    }
  };

  // Standard ARIA tabs keyboard pattern: Left/Right/Home/End move focus AND
  // activate the tab (select-follows-focus), matching what a screen reader
  // user expects from a "tab" role rather than plain Tab-key cycling.
  const handleTabListKeyDown = (e: React.KeyboardEvent) => {
    const currentIndex = TAB_IDS.indexOf(selectedTab);
    let newIndex = currentIndex;

    if (e.key === "ArrowRight") newIndex = (currentIndex + 1) % TAB_IDS.length;
    else if (e.key === "ArrowLeft") newIndex = (currentIndex - 1 + TAB_IDS.length) % TAB_IDS.length;
    else if (e.key === "Home") newIndex = 0;
    else if (e.key === "End") newIndex = TAB_IDS.length - 1;
    else return;

    e.preventDefault();
    setSelectedTab(TAB_IDS[newIndex]);
    tabRefs.current[newIndex]?.focus();
  };

  const StatCard: React.FC<{
    title: string;
    value: number | string;
    icon: React.ReactNode;
    change?: string;
    changeType?: "positive" | "negative" | "neutral";
  }> = ({ title, value, icon, change, changeType = "neutral" }) => (
    <div
      className="bg-white border border-[#C5D8EC] rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
      role="group"
      aria-label={`${title}: ${value}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[#5A7A9A]">{title}</p>
          <p className="text-2xl font-bold text-[#1A3A5C] mt-1">{value}</p>
        </div>
        <div className="bg-[#E8F0FE] rounded-full p-3 text-[#1A3A5C]" aria-hidden="true">
          {icon}
        </div>
      </div>
      {change && (
        <p
          className={`text-xs font-medium mt-2 ${
            changeType === "positive"
              ? "text-green-600"
              : changeType === "negative"
                ? "text-red-600"
                : "text-gray-600"
          }`}>
          {change}
        </p>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center min-h-[60vh]"
        role="status"
        aria-live="polite">
        <div className="text-center">
          <div
            className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#1A3A5C] border-t-transparent"
            aria-hidden="true"></div>
          <p className="mt-4 text-[#4A6A8A]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1A3A5C]">Dashboard</h1>
        <p className="text-[#5A7A9A] text-sm">Overview of your examination system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          }
          change="Up 12 this month"
          changeType="positive"
        />
        <StatCard
          title="Total Exams"
          value={stats.totalExams}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          }
          change="Up 3 this week"
          changeType="positive"
        />
        <StatCard
          title="Active Exams"
          value={stats.activeExams}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
          change="2 ending today"
          changeType="neutral"
        />
        <StatCard
          title="Pending Submissions"
          value={stats.pendingSubmissions}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
          change="5 need immediate attention"
          changeType="negative"
        />
        <StatCard
          title="Completion Rate"
          value={`${stats.completionRate}%`}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          }
          change="Up 5% from last week"
          changeType="positive"
        />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-[#C5D8EC] overflow-hidden shadow-sm">
        <div
          className="border-b border-[#E8EEF5] px-4 py-3 overflow-x-auto"
          role="tablist"
          aria-label="Dashboard sections"
          onKeyDown={handleTabListKeyDown}>
          <div className="flex gap-2">
            {TAB_IDS.map((id, index) => {
              const isSelected = selectedTab === id;
              const count = tabCount(id);
              return (
                <button
                  key={id}
                  ref={(el) => {
                    tabRefs.current[index] = el;
                  }}
                  id={`tab-${id}`}
                  role="tab"
                  aria-selected={isSelected}
                  aria-controls={`panel-${id}`}
                  tabIndex={isSelected ? 0 : -1}
                  onClick={() => setSelectedTab(id)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] ${
                    isSelected
                      ? "bg-[#1A3A5C] text-white"
                      : "bg-white text-[#4A6A8A] hover:bg-[#E8F0FE]"
                  }`}>
                  {tabLabel(id)}
                  {count !== undefined && (
                    <span
                      className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                        isSelected ? "bg-white/20 text-white" : "bg-[#E8F0FE] text-[#4A6A8A]"
                      }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div
          className="p-6"
          role="tabpanel"
          id={`panel-${selectedTab}`}
          aria-labelledby={`tab-${selectedTab}`}
          tabIndex={0}>
          {/* Overview Tab Content */}
          {selectedTab === "overview" && (
            <div className="space-y-8">
              {/* Recent Activity */}
              <section aria-labelledby="recent-activity-title">
                <div className="flex items-center justify-between mb-4">
                  <h2 id="recent-activity-title" className="text-lg font-semibold text-[#1A3A5C]">
                    Recent Activity
                  </h2>
                  <Link
                    href="/admin/reports"
                    className="text-sm text-[#2B6CB0] hover:text-[#1A3A5C] font-medium focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] rounded px-1">
                    View All <span aria-hidden="true">→</span>
                  </Link>
                </div>
                <div className="space-y-3">
                  {recentActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-[#C5D8EC] rounded-lg hover:bg-[#F8FAFE] transition"
                      role="article"
                      aria-label={`${activity.student} ${activity.action} ${activity.exam}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <span className="font-medium text-[#1A3A5C]">{activity.student}</span>
                        <span className="text-[#4A6A8A] text-sm">{activity.action}</span>
                        <span className="text-[#4A6A8A] text-sm font-medium">{activity.exam}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-2 sm:mt-0">
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(activity.status)}`}>
                          {getStatusLabel(activity.status)}
                        </span>
                        <span className="text-xs text-[#8A9CAE]">{activity.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Upcoming Exams */}
              <section
                aria-labelledby="upcoming-exams-title"
                className="border-t border-[#E8EEF5] pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 id="upcoming-exams-title" className="text-lg font-semibold text-[#1A3A5C]">
                    Upcoming Exams
                  </h2>
                  <Link
                    href="/admin/exams"
                    className="text-sm text-[#2B6CB0] hover:text-[#1A3A5C] font-medium focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] rounded px-1">
                    Manage Exams <span aria-hidden="true">→</span>
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {upcomingExams.map((exam) => (
                    <div
                      key={exam.id}
                      className="border border-[#C5D8EC] rounded-lg p-4 hover:shadow-md transition"
                      role="article"
                      aria-label={`${exam.subject} exam for ${exam.class}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-[#1A3A5C]">{exam.subject}</h3>
                          <p className="text-sm text-[#4A6A8A]">{exam.class}</p>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(exam.status)}`}>
                          {getStatusLabel(exam.status)}
                        </span>
                      </div>
                      <div className="mt-3 text-sm text-[#5A7A9A]">
                        <p>Date: {formatDate(exam.date)}</p>
                        <p>Time: {exam.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* Exams Tab Content */}
          {selectedTab === "exams" && (
            <section aria-labelledby="exams-title">
              <div className="flex items-center justify-between mb-6">
                <h2 id="exams-title" className="text-lg font-semibold text-[#1A3A5C]">
                  All Exams
                </h2>
                <Link
                  href="/admin/exams"
                  className="text-sm text-[#2B6CB0] hover:text-[#1A3A5C] font-medium focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] rounded px-1">
                  Manage Exams <span aria-hidden="true">→</span>
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#E8EEF5]">
                      <th className="text-left py-3 px-4 text-[#5A7A9A] font-medium">Subject</th>
                      <th className="text-left py-3 px-4 text-[#5A7A9A] font-medium">Class</th>
                      <th className="text-left py-3 px-4 text-[#5A7A9A] font-medium">Term</th>
                      <th className="text-left py-3 px-4 text-[#5A7A9A] font-medium">Questions</th>
                      <th className="text-left py-3 px-4 text-[#5A7A9A] font-medium">Duration</th>
                      <th className="text-left py-3 px-4 text-[#5A7A9A] font-medium">Status</th>
                      <th className="text-left py-3 px-4 text-[#5A7A9A] font-medium">Date</th>
                      <th className="text-left py-3 px-4 text-[#5A7A9A] font-medium">
                        Participants
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {examsData.map((exam) => (
                      <tr
                        key={exam.id}
                        className="border-b border-[#F0F4F9] hover:bg-[#F8FAFE] transition">
                        <td className="py-3 px-4 font-medium text-[#1A3A5C]">{exam.subject}</td>
                        <td className="py-3 px-4 text-[#4A6A8A]">{exam.class}</td>
                        <td className="py-3 px-4 text-[#4A6A8A]">{exam.term}</td>
                        <td className="py-3 px-4 text-[#4A6A8A]">{exam.totalQuestions}</td>
                        <td className="py-3 px-4 text-[#4A6A8A]">{exam.duration}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(exam.status)}`}>
                            {getStatusLabel(exam.status)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#4A6A8A]">{formatDate(exam.date)}</td>
                        <td className="py-3 px-4 text-[#4A6A8A]">{exam.participants}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Students Tab Content */}
          {selectedTab === "students" && (
            <section aria-labelledby="students-title">
              <div className="flex items-center justify-between mb-6">
                <h2 id="students-title" className="text-lg font-semibold text-[#1A3A5C]">
                  Students
                </h2>
                <Link
                  href="/admin/students"
                  className="text-sm text-[#2B6CB0] hover:text-[#1A3A5C] font-medium focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] rounded px-1">
                  Manage Students <span aria-hidden="true">→</span>
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#E8EEF5]">
                      <th className="text-left py-3 px-4 text-[#5A7A9A] font-medium">Name</th>
                      <th className="text-left py-3 px-4 text-[#5A7A9A] font-medium">Class</th>
                      <th className="text-left py-3 px-4 text-[#5A7A9A] font-medium">Email</th>
                      <th className="text-left py-3 px-4 text-[#5A7A9A] font-medium">
                        Exams Taken
                      </th>
                      <th className="text-left py-3 px-4 text-[#5A7A9A] font-medium">Avg Score</th>
                      <th className="text-left py-3 px-4 text-[#5A7A9A] font-medium">Status</th>
                      <th className="text-left py-3 px-4 text-[#5A7A9A] font-medium">
                        Last Active
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentsData.map((student) => (
                      <tr
                        key={student.id}
                        className="border-b border-[#F0F4F9] hover:bg-[#F8FAFE] transition">
                        <td className="py-3 px-4 font-medium text-[#1A3A5C]">{student.name}</td>
                        <td className="py-3 px-4 text-[#4A6A8A]">{student.class}</td>
                        <td className="py-3 px-4 text-[#4A6A8A]">{student.email}</td>
                        <td className="py-3 px-4 text-[#4A6A8A]">{student.examsTaken}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`font-medium ${
                              student.avgScore >= 80
                                ? "text-green-600"
                                : student.avgScore >= 60
                                  ? "text-yellow-600"
                                  : "text-red-600"
                            }`}>
                            {student.avgScore}%
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(student.status)}`}>
                            {getStatusLabel(student.status)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#4A6A8A]">{student.lastActive}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Submissions Tab Content */}
          {selectedTab === "submissions" && (
            <section aria-labelledby="submissions-title">
              <div className="flex items-center justify-between mb-6">
                <h2 id="submissions-title" className="text-lg font-semibold text-[#1A3A5C]">
                  Submissions
                </h2>
                <Link
                  href="/admin/results"
                  className="text-sm text-[#2B6CB0] hover:text-[#1A3A5C] font-medium focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] rounded px-1">
                  View Results <span aria-hidden="true">→</span>
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#E8EEF5]">
                      <th className="text-left py-3 px-4 text-[#5A7A9A] font-medium">Student</th>
                      <th className="text-left py-3 px-4 text-[#5A7A9A] font-medium">Exam</th>
                      <th className="text-left py-3 px-4 text-[#5A7A9A] font-medium">Subject</th>
                      <th className="text-left py-3 px-4 text-[#5A7A9A] font-medium">Submitted</th>
                      <th className="text-left py-3 px-4 text-[#5A7A9A] font-medium">Time Taken</th>
                      <th className="text-left py-3 px-4 text-[#5A7A9A] font-medium">Score</th>
                      <th className="text-left py-3 px-4 text-[#5A7A9A] font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissionsData.map((submission) => (
                      <tr
                        key={submission.id}
                        className="border-b border-[#F0F4F9] hover:bg-[#F8FAFE] transition">
                        <td className="py-3 px-4 font-medium text-[#1A3A5C]">
                          {submission.student}
                        </td>
                        <td className="py-3 px-4 text-[#4A6A8A]">{submission.exam}</td>
                        <td className="py-3 px-4 text-[#4A6A8A]">{submission.subject}</td>
                        <td className="py-3 px-4 text-[#4A6A8A]">
                          {formatDate(submission.submittedDate)}
                        </td>
                        <td className="py-3 px-4 text-[#4A6A8A]">{submission.timeTaken}</td>
                        <td className="py-3 px-4">
                          {submission.score !== null ? (
                            <span
                              className={`font-medium ${
                                submission.score >= 80
                                  ? "text-green-600"
                                  : submission.score >= 60
                                    ? "text-yellow-600"
                                    : "text-red-600"
                              }`}>
                              {submission.score}%
                            </span>
                          ) : (
                            <span className="text-[#8A9CAE]">N/A</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(submission.status)}`}>
                            {getStatusLabel(submission.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
