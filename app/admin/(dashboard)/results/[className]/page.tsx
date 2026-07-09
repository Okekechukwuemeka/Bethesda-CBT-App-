"use client";

import React, { useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface SubjectResult {
  id: number;
  subject: string;
  examType: "objective" | "theory" | "mixed";
  totalStudents: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  completed: number;
  status: "completed" | "pending" | "in-progress";
}

interface StudentScript {
  id: number;
  studentName: string;
  admissionNo: string;
  score: number;
  status: "marked" | "pending" | "in-progress";
  submittedAt: string;
}

const ClassResultsPage: React.FC = () => {
  const params = useParams();
  const className = params?.className as string;
  const [selectedSubject, setSelectedSubject] = useState<SubjectResult | null>(null);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentScript | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);

  // Mock subject results for this class
  const [subjectResults] = useState<SubjectResult[]>([
    {
      id: 1,
      subject: "Chemistry",
      examType: "objective",
      totalStudents: 45,
      averageScore: 72,
      highestScore: 95,
      lowestScore: 45,
      completed: 40,
      status: "completed",
    },
    {
      id: 2,
      subject: "Chemistry Theory",
      examType: "theory",
      totalStudents: 45,
      averageScore: 68,
      highestScore: 90,
      lowestScore: 35,
      completed: 38,
      status: "pending",
    },
    {
      id: 3,
      subject: "Physics",
      examType: "objective",
      totalStudents: 45,
      averageScore: 65,
      highestScore: 88,
      lowestScore: 40,
      completed: 42,
      status: "completed",
    },
    {
      id: 4,
      subject: "Physics Theory",
      examType: "theory",
      totalStudents: 45,
      averageScore: 60,
      highestScore: 85,
      lowestScore: 30,
      completed: 35,
      status: "in-progress",
    },
    {
      id: 5,
      subject: "Mathematics",
      examType: "mixed",
      totalStudents: 45,
      averageScore: 70,
      highestScore: 92,
      lowestScore: 38,
      completed: 40,
      status: "completed",
    },
    {
      id: 6,
      subject: "English Language",
      examType: "objective",
      totalStudents: 45,
      averageScore: 75,
      highestScore: 98,
      lowestScore: 50,
      completed: 43,
      status: "completed",
    },
    {
      id: 7,
      subject: "English Language Theory",
      examType: "theory",
      totalStudents: 45,
      averageScore: 62,
      highestScore: 87,
      lowestScore: 28,
      completed: 33,
      status: "pending",
    },
  ]);

  // Mock student scripts for a theory exam
  const [studentScripts] = useState<StudentScript[]>([
    {
      id: 1,
      studentName: "John Doe",
      admissionNo: "BHS-2024-001",
      score: 85,
      status: "marked",
      submittedAt: "2025-06-23 10:30 AM",
    },
    {
      id: 2,
      studentName: "Jane Smith",
      admissionNo: "BHS-2024-002",
      score: 72,
      status: "marked",
      submittedAt: "2025-06-23 10:15 AM",
    },
    {
      id: 3,
      studentName: "Michael Johnson",
      admissionNo: "BHS-2024-003",
      score: 0,
      status: "pending",
      submittedAt: "2025-06-23 11:00 AM",
    },
    {
      id: 4,
      studentName: "Sarah Williams",
      admissionNo: "BHS-2024-004",
      score: 90,
      status: "marked",
      submittedAt: "2025-06-23 09:45 AM",
    },
    {
      id: 5,
      studentName: "David Brown",
      admissionNo: "BHS-2024-005",
      score: 0,
      status: "in-progress",
      submittedAt: "2025-06-23 11:30 AM",
    },
  ]);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getExamTypeColor = (type: string) => {
    switch (type) {
      case "objective":
        return "bg-blue-100 text-blue-800";
      case "theory":
        return "bg-purple-100 text-purple-800";
      case "mixed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleViewScripts = (subject: SubjectResult) => {
    setSelectedSubject(subject);
    setShowScriptModal(true);
    setTimeout(() => modalRef.current?.focus(), 100);
  };

  const handleViewStudentScript = (student: StudentScript) => {
    setSelectedStudent(student);
    // In production, this would open a PDF viewer or download
    alert(`📄 Downloading script for ${student.studentName} (${student.admissionNo})`);
  };

  const handleDownloadClassResult = (subject: SubjectResult) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      alert(`📥 Downloading ${subject.subject} results for ${className}...`);
    }, 1000);
  };

  const filteredScripts = studentScripts.filter(
    (s) =>
      s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.admissionNo.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A3A5C]">{className} Results</h1>
          <p className="text-[#5A7A9A] text-sm">View and manage subject results</p>
        </div>
        <Link
          href="/admin/results"
          className="bg-[#E8EEF5] hover:bg-[#D5DFE8] text-[#1A3A5C] font-medium px-4 py-2 rounded-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/30 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Classes
        </Link>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[#C5D8EC] p-4 shadow-sm">
          <p className="text-sm text-[#5A7A9A]">Total Subjects</p>
          <p className="text-2xl font-bold text-[#1A3A5C]">{subjectResults.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-[#C5D8EC] p-4 shadow-sm">
          <p className="text-sm text-[#5A7A9A]">Completed</p>
          <p className="text-2xl font-bold text-green-600">
            {subjectResults.filter((s) => s.status === "completed").length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-[#C5D8EC] p-4 shadow-sm">
          <p className="text-sm text-[#5A7A9A]">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">
            {subjectResults.filter((s) => s.status === "pending").length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-[#C5D8EC] p-4 shadow-sm">
          <p className="text-sm text-[#5A7A9A]">Average Score</p>
          <p className="text-2xl font-bold text-[#1A3A5C]">
            {Math.round(
              subjectResults.reduce((sum, s) => sum + s.averageScore, 0) / subjectResults.length,
            )}
            %
          </p>
        </div>
      </div>

      {/* Subject Results Table */}
      <div className="bg-white rounded-xl border border-[#C5D8EC] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full" role="table" aria-label="Subject results">
            <thead className="bg-[#F8FAFE] border-b border-[#E8EEF5]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">
                  Avg Score
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">
                  High/Low
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">
                  Completed
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8EEF5]">
              {subjectResults.map((subject) => (
                <tr key={subject.id} className="hover:bg-[#F8FAFE] transition">
                  <td className="px-4 py-3 text-sm font-medium text-[#1A3A5C]">
                    {subject.subject}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${getExamTypeColor(subject.examType)}`}>
                      {subject.examType}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusBadgeColor(subject.status)}`}>
                      {subject.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-[#1A3A5C]">
                    {subject.averageScore}%
                  </td>
                  <td className="px-4 py-3 text-sm text-[#4A6A8A]">
                    {subject.highestScore}% / {subject.lowestScore}%
                  </td>
                  <td className="px-4 py-3 text-sm text-[#4A6A8A]">
                    {subject.completed}/{subject.totalStudents}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleDownloadClassResult(subject)}
                        disabled={isLoading}
                        className="text-sm bg-[#1A3A5C] hover:bg-[#14304D] text-white px-3 py-1 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] disabled:opacity-50">
                        Download PDF
                      </button>
                      {subject.examType === "theory" && (
                        <button
                          onClick={() => handleViewScripts(subject)}
                          className="text-sm bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-purple-500">
                          View Scripts
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Scripts Modal */}
      {showScriptModal && selectedSubject && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowScriptModal(false);
          }}>
          <div
            ref={modalRef}
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-[#B8D0E8]">
            <div className="bg-[#1A3A5C] px-6 py-4 rounded-t-2xl sticky top-0 z-10">
              <h2 id="modal-title" className="text-xl font-bold text-white">
                {selectedSubject.subject} - Student Scripts
              </h2>
              <p className="text-[#8BB8E8] text-sm">
                {className} • {selectedSubject.examType} exam
              </p>
            </div>

            <div className="p-6">
              {/* Search */}
              <div className="mb-4">
                <label htmlFor="scriptSearch" className="sr-only">
                  Search students
                </label>
                <input
                  id="scriptSearch"
                  type="text"
                  placeholder="Search by student name or admission number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-[#F8FAFE]"
                />
              </div>

              {/* Scripts Table */}
              <div className="overflow-x-auto">
                <table className="w-full" role="table" aria-label="Student scripts">
                  <thead className="bg-[#F8FAFE] border-b border-[#E8EEF5]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">
                        Admission No.
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">
                        Student Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">
                        Score
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">
                        Submitted
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8EEF5]">
                    {filteredScripts.map((student) => (
                      <tr key={student.id} className="hover:bg-[#F8FAFE] transition">
                        <td className="px-4 py-3 text-sm text-[#4A6A8A]">{student.admissionNo}</td>
                        <td className="px-4 py-3 text-sm font-medium text-[#1A3A5C]">
                          {student.studentName}
                        </td>
                        <td className="px-4 py-3 text-sm font-bold">
                          <span
                            className={student.score > 0 ? "text-green-600" : "text-yellow-600"}>
                            {student.score > 0 ? `${student.score}%` : "Not marked"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusBadgeColor(student.status)}`}>
                            {student.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-[#4A6A8A]">{student.submittedAt}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleViewStudentScript(student)}
                            className="text-sm bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-purple-500">
                            View Script
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredScripts.length === 0 && (
                <div className="text-center py-8 text-[#8A9CAE]">
                  <p>No students found matching your search</p>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex gap-3 mt-6 pt-4 border-t border-[#E8EEF5]">
                <button
                  onClick={() => setShowScriptModal(false)}
                  className="flex-1 bg-[#E8EEF5] hover:bg-[#D5DFE8] text-[#1A3A5C] font-medium py-2.5 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/30">
                  Close
                </button>
                <button
                  onClick={() => handleDownloadClassResult(selectedSubject)}
                  className="flex-1 bg-[#1A3A5C] hover:bg-[#14304D] text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/50">
                  Download All Scripts (PDF)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassResultsPage;
