"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface Student {
  id: number;
  admissionNo: string;
  firstName: string;
  lastName: string;
  email: string;
  class: string;
  gender: "Male" | "Female" | "Other";
  dateOfBirth: string;
  phone: string;
  address: string;
  status: "active" | "inactive" | "graduated";
  enrollmentDate: string;
}

interface StatusMessage {
  type: "success" | "error" | "warning";
  text: string;
}

const StudentsPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClass, setFilterClass] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Form state
  const [formData, setFormData] = useState<Partial<Student>>({
    firstName: "",
    lastName: "",
    admissionNo: "",
    email: "",
    class: "",
    gender: "Male",
    dateOfBirth: "",
    phone: "",
    address: "",
    status: "active",
    enrollmentDate: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);

  // Mock data - in production, this would come from an API
  useEffect(() => {
    const mockStudents: Student[] = [
      {
        id: 1,
        admissionNo: "BHS-2024-001",
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        class: "JSS1",
        gender: "Male",
        dateOfBirth: "2010-05-15",
        phone: "08012345678",
        address: "123 Main Street, Lagos",
        status: "active",
        enrollmentDate: "2024-01-15",
      },
      {
        id: 2,
        admissionNo: "BHS-2024-002",
        firstName: "Jane",
        lastName: "Smith",
        email: "jane.smith@example.com",
        class: "JSS2",
        gender: "Female",
        dateOfBirth: "2009-08-22",
        phone: "08087654321",
        address: "456 Oak Avenue, Abuja",
        status: "active",
        enrollmentDate: "2024-01-15",
      },
      {
        id: 3,
        admissionNo: "BHS-2024-003",
        firstName: "Michael",
        lastName: "Johnson",
        email: "michael.j@example.com",
        class: "JSS3",
        gender: "Male",
        dateOfBirth: "2008-11-10",
        phone: "08098765432",
        address: "789 Pine Road, Port Harcourt",
        status: "active",
        enrollmentDate: "2024-01-20",
      },
      {
        id: 4,
        admissionNo: "BHS-2024-004",
        firstName: "Sarah",
        lastName: "Williams",
        email: "sarah.w@example.com",
        class: "JSS1",
        gender: "Female",
        dateOfBirth: "2010-03-25",
        phone: "08054321678",
        address: "321 Cedar Lane, Ibadan",
        status: "inactive",
        enrollmentDate: "2024-02-01",
      },
      {
        id: 5,
        admissionNo: "BHS-2024-005",
        firstName: "David",
        lastName: "Brown",
        email: "david.b@example.com",
        class: "JSS2",
        gender: "Male",
        dateOfBirth: "2009-06-30",
        phone: "08076543210",
        address: "654 Maple Drive, Kano",
        status: "active",
        enrollmentDate: "2024-02-10",
      },
      {
        id: 6,
        admissionNo: "BHS-2024-006",
        firstName: "Elizabeth",
        lastName: "Taylor",
        email: "elizabeth.t@example.com",
        class: "JSS3",
        gender: "Female",
        dateOfBirth: "2008-09-05",
        phone: "08043218765",
        address: "987 Birch Boulevard, Enugu",
        status: "graduated",
        enrollmentDate: "2024-01-10",
      },
      {
        id: 7,
        admissionNo: "BHS-2024-007",
        firstName: "James",
        lastName: "Wilson",
        email: "james.w@example.com",
        class: "JSS1",
        gender: "Male",
        dateOfBirth: "2010-12-18",
        phone: "08065432198",
        address: "147 Willow Way, Benin City",
        status: "active",
        enrollmentDate: "2024-03-01",
      },
      {
        id: 8,
        admissionNo: "BHS-2024-008",
        firstName: "Mary",
        lastName: "Davis",
        email: "mary.d@example.com",
        class: "JSS2",
        gender: "Female",
        dateOfBirth: "2009-04-12",
        phone: "08087651234",
        address: "258 Ash Court, Kaduna",
        status: "active",
        enrollmentDate: "2024-03-05",
      },
    ];

    setStudents(mockStudents);
    setIsLoading(false);
  }, []);

  // Filter students
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.admissionNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesClass = filterClass === "all" || student.class === filterClass;
    const matchesStatus = filterStatus === "all" || student.status === filterStatus;

    return matchesSearch && matchesClass && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Focus on the first row of the table
    const firstRow = document.querySelector("table tbody tr");
    if (firstRow) {
      (firstRow as HTMLElement).focus();
    }
  };

  // Generate admission number
  const generateAdmissionNo = () => {
    const year = new Date().getFullYear();
    const count = students.length + 1;
    return `BHS-${year}-${String(count).padStart(3, "0")}`;
  };

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Open add student modal
  const handleAddStudent = () => {
    setIsEditing(false);
    setFormData({
      firstName: "",
      lastName: "",
      admissionNo: generateAdmissionNo(),
      email: "",
      class: "",
      gender: "Male",
      dateOfBirth: "",
      phone: "",
      address: "",
      status: "active",
      enrollmentDate: new Date().toISOString().split("T")[0],
    });
    setIsModalOpen(true);
    setTimeout(() => firstInputRef.current?.focus(), 100);
  };

  // Open edit student modal
  const handleEditStudent = (student: Student) => {
    setIsEditing(true);
    setFormData(student);
    setIsModalOpen(true);
    setTimeout(() => firstInputRef.current?.focus(), 100);
  };

  // Open delete confirmation modal
  const handleDeleteStudent = (student: Student) => {
    setSelectedStudent(student);
    setIsDeleteModalOpen(true);
    setTimeout(() => deleteButtonRef.current?.focus(), 100);
  };

  // Submit form (add or edit)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);

    // Validate required fields
    if (!formData.firstName || !formData.lastName || !formData.admissionNo || !formData.class) {
      setStatusMessage({
        type: "error",
        text: "Please fill in all required fields.",
      });
      setIsSubmitting(false);
      return;
    }

    // Simulate API call
    setTimeout(() => {
      if (isEditing && selectedStudent) {
        // Edit existing student
        setStudents((prev) =>
          prev.map((s) => (s.id === selectedStudent.id ? ({ ...s, ...formData } as Student) : s)),
        );
        setStatusMessage({
          type: "success",
          text: `Student ${formData.firstName} ${formData.lastName} updated successfully!`,
        });
      } else {
        // Add new student
        const newStudent: Student = {
          id: students.length + 1,
          firstName: formData.firstName || "",
          lastName: formData.lastName || "",
          admissionNo: formData.admissionNo || "",
          email: formData.email || "",
          class: formData.class || "",
          gender: (formData.gender as "Male" | "Female" | "Other") || "Male",
          dateOfBirth: formData.dateOfBirth || "",
          phone: formData.phone || "",
          address: formData.address || "",
          status: (formData.status as "active" | "inactive" | "graduated") || "active",
          enrollmentDate: formData.enrollmentDate || new Date().toISOString().split("T")[0],
        };
        setStudents((prev) => [...prev, newStudent]);
        setStatusMessage({
          type: "success",
          text: `Student ${formData.firstName} ${formData.lastName} added successfully!`,
        });
      }

      setIsSubmitting(false);
      setIsModalOpen(false);

      // Clear status message after 5 seconds
      setTimeout(() => setStatusMessage(null), 5000);
    }, 1000);
  };

  // Confirm delete
  const confirmDelete = () => {
    if (selectedStudent) {
      setStudents((prev) => prev.filter((s) => s.id !== selectedStudent.id));
      setStatusMessage({
        type: "warning",
        text: `Student ${selectedStudent.firstName} ${selectedStudent.lastName} has been deleted.`,
      });
      setIsDeleteModalOpen(false);
      setSelectedStudent(null);

      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isModalOpen) setIsModalOpen(false);
        if (isDeleteModalOpen) setIsDeleteModalOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isModalOpen, isDeleteModalOpen]);

  // Focus trap for modals
  useEffect(() => {
    if (isModalOpen && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }
    }
  }, [isModalOpen]);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-yellow-100 text-yellow-800";
      case "graduated":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Active";
      case "inactive":
        return "Inactive";
      case "graduated":
        return "Graduated";
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#1A3A5C] border-t-transparent"></div>
          <p className="mt-4 text-[#4A6A8A]">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A3A5C]">Students</h1>
          <p className="text-[#5A7A9A] text-sm">Manage all student records</p>
        </div>
        <button
          onClick={handleAddStudent}
          className="bg-[#1A3A5C] hover:bg-[#14304D] text-white font-medium px-4 py-2 rounded-lg transition duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/50 flex items-center gap-2"
          aria-label="Add new student">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Student
        </button>
      </div>

      {/* Status Message */}
      {statusMessage && (
        <div
          role="alert"
          aria-live="polite"
          className={`p-4 rounded-lg text-sm font-medium ${
            statusMessage.type === "success"
              ? "bg-green-100 text-green-800 border border-green-300"
              : statusMessage.type === "warning"
                ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                : "bg-red-100 text-red-800 border border-red-300"
          }`}>
          {statusMessage.text}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-[#C5D8EC] p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="search" className="sr-only">
              Search students
            </label>
            <input
              id="search"
              type="text"
              placeholder="Search by name, admission number, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-[#F8FAFE] text-[#1A1A1A] placeholder:text-[#8A9CAE]"
              aria-label="Search students"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <div>
              <label htmlFor="filterClass" className="sr-only">
                Filter by class
              </label>
              <select
                id="filterClass"
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="px-4 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] bg-[#F8FAFE] text-[#1A1A1A]"
                aria-label="Filter by class">
                <option value="all">All Classes</option>
                <option value="JSS1">JSS1</option>
                <option value="JSS2">JSS2</option>
                <option value="JSS3">JSS3</option>
              </select>
            </div>
            <div>
              <label htmlFor="filterStatus" className="sr-only">
                Filter by status
              </label>
              <select
                id="filterStatus"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] bg-[#F8FAFE] text-[#1A1A1A]"
                aria-label="Filter by status">
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="graduated">Graduated</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl border border-[#C5D8EC] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full" role="table" aria-label="Students list">
            <thead className="bg-[#F8FAFE] border-b border-[#E8EEF5]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">
                  Admission No.
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">
                  Class
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">
                  Gender
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#5A7A9A] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8EEF5]">
              {currentStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-[#8A9CAE]">
                    <div className="text-4xl mb-2">📚</div>
                    <p className="font-medium">No students found</p>
                    <p className="text-sm">Try adjusting your search or filters</p>
                  </td>
                </tr>
              ) : (
                currentStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-[#F8FAFE] transition">
                    <td className="px-4 py-3 text-sm font-medium text-[#1A3A5C]">
                      {student.admissionNo}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#4A6A8A]">
                      {student.firstName} {student.lastName}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#4A6A8A]">{student.class}</td>
                    <td className="px-4 py-3 text-sm text-[#4A6A8A]">{student.gender}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusBadgeColor(student.status)}`}>
                        {getStatusLabel(student.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditStudent(student)}
                          className="text-[#2B6CB0] hover:text-[#1A3A5C] p-1 rounded focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]"
                          aria-label={`Edit ${student.firstName} ${student.lastName}`}>
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(student)}
                          className="text-red-600 hover:text-red-800 p-1 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                          aria-label={`Delete ${student.firstName} ${student.lastName}`}>
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredStudents.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#E8EEF5]">
            <p className="text-sm text-[#5A7A9A]">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredStudents.length)}{" "}
              of {filteredStudents.length} students
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-[#C5D8EC] rounded-lg hover:bg-[#F8FAFE] focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] disabled:opacity-50 disabled:cursor-not-allowed transition"
                aria-label="Previous page">
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-1 text-sm rounded-lg transition focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] ${
                    currentPage === page
                      ? "bg-[#1A3A5C] text-white"
                      : "border border-[#C5D8EC] hover:bg-[#F8FAFE]"
                  }`}
                  aria-label={`Go to page ${page}`}
                  aria-current={currentPage === page ? "page" : undefined}>
                  {page}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-[#C5D8EC] rounded-lg hover:bg-[#F8FAFE] focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] disabled:opacity-50 disabled:cursor-not-allowed transition"
                aria-label="Next page">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Student Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmitting) {
              setIsModalOpen(false);
            }
          }}>
          <div
            ref={modalRef}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#B8D0E8]">
            <div className="bg-[#1A3A5C] px-6 py-4 rounded-t-2xl sticky top-0 z-10">
              <h2 id="modal-title" className="text-xl font-bold text-white">
                {isEditing ? "Edit Student" : "Add New Student"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* First Name */}
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-sm font-medium text-[#1A3A5C] mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={firstInputRef}
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName || ""}
                    onChange={handleInputChange}
                    required
                    aria-required="true"
                    className="w-full px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-[#F8FAFE]"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-sm font-medium text-[#1A3A5C] mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName || ""}
                    onChange={handleInputChange}
                    required
                    aria-required="true"
                    className="w-full px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-[#F8FAFE]"
                  />
                </div>

                {/* Admission Number */}
                <div>
                  <label
                    htmlFor="admissionNo"
                    className="block text-sm font-medium text-[#1A3A5C] mb-1">
                    Admission Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="admissionNo"
                    name="admissionNo"
                    value={formData.admissionNo || ""}
                    onChange={handleInputChange}
                    required
                    aria-required="true"
                    disabled={isEditing}
                    className="w-full px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-[#F8FAFE] disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  {!isEditing && (
                    <p className="text-xs text-[#8A9CAE] mt-1">Auto-generated admission number</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[#1A3A5C] mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email || ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-[#F8FAFE]"
                  />
                </div>

                {/* Class */}
                <div>
                  <label htmlFor="class" className="block text-sm font-medium text-[#1A3A5C] mb-1">
                    Class <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="class"
                    name="class"
                    value={formData.class || ""}
                    onChange={handleInputChange}
                    required
                    aria-required="true"
                    className="w-full px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] bg-[#F8FAFE]">
                    <option value="">Select Class</option>
                    <option value="JSS1">JSS1</option>
                    <option value="JSS2">JSS2</option>
                    <option value="JSS3">JSS3</option>
                  </select>
                </div>

                {/* Gender */}
                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-[#1A3A5C] mb-1">
                    Gender
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender || "Male"}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] bg-[#F8FAFE]">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Date of Birth */}
                <div>
                  <label
                    htmlFor="dateOfBirth"
                    className="block text-sm font-medium text-[#1A3A5C] mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    value={formData.dateOfBirth || ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-[#F8FAFE]"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-[#1A3A5C] mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone || ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-[#F8FAFE]"
                  />
                </div>

                {/* Status */}
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-[#1A3A5C] mb-1">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status || "active"}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] bg-[#F8FAFE]">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="graduated">Graduated</option>
                  </select>
                </div>

                {/* Enrollment Date */}
                <div>
                  <label
                    htmlFor="enrollmentDate"
                    className="block text-sm font-medium text-[#1A3A5C] mb-1">
                    Enrollment Date
                  </label>
                  <input
                    type="date"
                    id="enrollmentDate"
                    name="enrollmentDate"
                    value={formData.enrollmentDate || ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-[#F8FAFE]"
                  />
                </div>

                {/* Address - Full width */}
                <div className="md:col-span-2">
                  <label
                    htmlFor="address"
                    className="block text-sm font-medium text-[#1A3A5C] mb-1">
                    Address
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address || ""}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-[#C5D8EC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2B6CB0] focus:border-transparent bg-[#F8FAFE] resize-y"
                  />
                </div>
              </div>

              {/* Form Status Message */}
              {statusMessage && (
                <div
                  role="alert"
                  aria-live="polite"
                  className={`mt-4 p-3 rounded-lg text-sm font-medium ${
                    statusMessage.type === "success"
                      ? "bg-green-100 text-green-800 border border-green-300"
                      : statusMessage.type === "warning"
                        ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                        : "bg-red-100 text-red-800 border border-red-300"
                  }`}>
                  {statusMessage.text}
                </div>
              )}

              {/* Form Actions */}
              <div className="flex gap-3 mt-6 pt-4 border-t border-[#E8EEF5]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="flex-1 bg-[#E8EEF5] hover:bg-[#D5DFE8] text-[#1A3A5C] font-medium py-2.5 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/30 disabled:opacity-50">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-[#1A3A5C] hover:bg-[#14304D] text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/50 active:scale-[0.98] disabled:opacity-50">
                  {isSubmitting ? "Saving..." : isEditing ? "Update Student" : "Add Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedStudent && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsDeleteModalOpen(false);
          }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-[#B8D0E8]">
            <div className="bg-red-600 -mx-6 -mt-6 px-6 py-4 rounded-t-2xl">
              <h2 id="delete-title" className="text-xl font-bold text-white">
                Delete Student
              </h2>
            </div>

            <div className="mt-6">
              <p className="text-[#4A6A8A] mb-4">
                Are you sure you want to delete{" "}
                <strong>
                  {selectedStudent.firstName} {selectedStudent.lastName}
                </strong>
                ?
              </p>
              <div className="bg-[#F8FAFE] border border-[#C5D8EC] rounded-lg p-4 mb-4">
                <p className="text-sm text-[#4A6A8A]">
                  <span className="font-medium">Admission No:</span> {selectedStudent.admissionNo}
                </p>
                <p className="text-sm text-[#4A6A8A]">
                  <span className="font-medium">Class:</span> {selectedStudent.class}
                </p>
              </div>
              <p className="text-sm text-red-600 mb-4">
                This action cannot be undone. All data associated with this student will be
                permanently deleted.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 bg-[#E8EEF5] hover:bg-[#D5DFE8] text-[#1A3A5C] font-medium py-2.5 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-4 focus:ring-[#2B6CB0]/30">
                  Cancel
                </button>
                <button
                  ref={deleteButtonRef}
                  onClick={confirmDelete}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-red-500/50 active:scale-[0.98]">
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsPage;
