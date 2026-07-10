"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";

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

interface ImportPreviewStudent {
  firstName: string;
  lastName: string;
  email: string;
  class: string;
  gender: string;
  dateOfBirth: string;
  phone: string;
  address: string;
  status: string;
}

interface StatusMessage {
  type: "success" | "error" | "warning";
  text: string;
}

type RequiredField = "firstName" | "lastName" | "admissionNo" | "class";
type FieldErrors = Partial<Record<RequiredField, string>>;

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

export const useStudents = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClass, setFilterClass] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [importPreview, setImportPreview] = useState<ImportPreviewStudent[]>([]);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const formTriggerRef = useRef<HTMLElement | null>(null);
  const deleteTriggerRef = useRef<HTMLElement | null>(null);
  const importTriggerRef = useRef<HTMLElement | null>(null);

  const itemsPerPage = 10;

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

  useEffect(() => {
    setStudents(mockStudents);
    setIsLoading(false);
  }, []);

  const filteredStudents = useMemo(
    () =>
      students.filter((student) => {
        const matchesSearch =
          student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.admissionNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesClass = filterClass === "all" || student.class === filterClass;
        const matchesStatus = filterStatus === "all" || student.status === filterStatus;
        return matchesSearch && matchesClass && matchesStatus;
      }),
    [students, searchTerm, filterClass, filterStatus],
  );

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);

  const generateAdmissionNo = useCallback(() => {
    const year = new Date().getFullYear();
    const count = students.length + 1;
    return `BHS-${year}-${String(count).padStart(3, "0")}`;
  }, [students.length]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
      if (name in fieldErrors) {
        setFieldErrors((prev) => {
          const next = { ...prev };
          delete next[name as RequiredField];
          return next;
        });
      }
    },
    [fieldErrors],
  );

  const closeFormModal = useCallback(() => {
    if (!isSubmitting) {
      setIsModalOpen(false);
      setFieldErrors({});
    }
  }, [isSubmitting]);
  const closeDeleteModal = useCallback(() => setIsDeleteModalOpen(false), []);
  const closeImportModal = useCallback(() => {
    if (!isImporting) {
      setIsImportModalOpen(false);
      setImportPreview([]);
      setSelectedFileName(null);
    }
  }, [isImporting]);

  const handleAddStudent = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      formTriggerRef.current = e.currentTarget;
      setIsEditing(false);
      setFieldErrors({});
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
    },
    [generateAdmissionNo],
  );

  const handleEditStudent = useCallback(
    (student: Student, e: React.MouseEvent<HTMLButtonElement>) => {
      formTriggerRef.current = e.currentTarget;
      setIsEditing(true);
      setFieldErrors({});
      setFormData(student);
      setIsModalOpen(true);
    },
    [],
  );

  const handleDeleteStudent = useCallback(
    (student: Student, e: React.MouseEvent<HTMLButtonElement>) => {
      deleteTriggerRef.current = e.currentTarget;
      setSelectedStudent(student);
      setIsDeleteModalOpen(true);
    },
    [],
  );

  const validate = useCallback((): FieldErrors => {
    const errors: FieldErrors = {};
    if (!formData.firstName?.trim()) errors.firstName = "First name is required.";
    if (!formData.lastName?.trim()) errors.lastName = "Last name is required.";
    if (!formData.admissionNo?.trim()) errors.admissionNo = "Admission number is required.";
    if (!formData.class) errors.class = "Please select a class.";
    return errors;
  }, [formData]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const errors = validate();
      setFieldErrors(errors);
      const errorFields = Object.keys(errors) as RequiredField[];
      if (errorFields.length > 0) {
        setStatusMessage({
          type: "error",
          text: `Please fix ${errorFields.length} field${errorFields.length > 1 ? "s" : ""} before submitting.`,
        });
        return;
      }
      setStatusMessage(null);
      setIsSubmitting(true);
      setTimeout(() => {
        if (isEditing && selectedStudent) {
          setStudents((prev) =>
            prev.map((s) => (s.id === selectedStudent.id ? ({ ...s, ...formData } as Student) : s)),
          );
          setStatusMessage({
            type: "success",
            text: `Student ${formData.firstName} ${formData.lastName} updated successfully.`,
          });
        } else {
          const newStudent: Student = { id: students.length + 1, ...(formData as Student) };
          setStudents((prev) => [...prev, newStudent]);
          setStatusMessage({
            type: "success",
            text: `Student ${formData.firstName} ${formData.lastName} added successfully.`,
          });
        }
        setIsSubmitting(false);
        setIsModalOpen(false);
        setTimeout(() => setStatusMessage(null), 5000);
      }, 1000);
    },
    [validate, isEditing, selectedStudent, formData, students.length],
  );

  const confirmDelete = useCallback(() => {
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
  }, [selectedStudent]);

  const handleOpenImportModal = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    importTriggerRef.current = e.currentTarget;
    setIsImportModalOpen(true);
    setImportPreview([]);
    setSelectedFileName(null);
    setStatusMessage(null);
  }, []);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsedStudents = parseFileContent(content, file.name);
        setImportPreview(parsedStudents);
        setStatusMessage(
          parsedStudents.length === 0
            ? { type: "error", text: "No valid students found." }
            : { type: "success", text: `Found ${parsedStudents.length} students ready to import.` },
        );
      } catch {
        setStatusMessage({ type: "error", text: "Error parsing file." });
      }
    };
    reader.readAsText(file);
  }, []);

  const parseFileContent = (content: string, fileName: string): ImportPreviewStudent[] => {
    const students: ImportPreviewStudent[] = [];
    const lines = content.split("\n").filter((line) => line.trim());
    const isCSV = fileName.endsWith(".csv");
    if (isCSV) {
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim());
        if (values.length < 2) continue;
        const student: ImportPreviewStudent = {
          firstName: "",
          lastName: "",
          email: "",
          class: "",
          gender: "Male",
          dateOfBirth: "",
          phone: "",
          address: "",
          status: "active",
        };
        headers.forEach((header, index) => {
          const value = values[index] || "";
          switch (header) {
            case "firstname":
            case "first_name":
              student.firstName = value;
              break;
            case "lastname":
            case "last_name":
              student.lastName = value;
              break;
            case "email":
              student.email = value;
              break;
            case "class":
              student.class = value;
              break;
            case "gender":
              student.gender = value || "Male";
              break;
            case "dateofbirth":
            case "dob":
              student.dateOfBirth = value;
              break;
            case "phone":
            case "phonenumber":
              student.phone = value;
              break;
            case "address":
              student.address = value;
              break;
            case "status":
              student.status = value || "active";
              break;
          }
        });
        if (student.firstName && student.lastName) students.push(student);
      }
    }
    return students;
  };

  const confirmImport = useCallback(() => {
    if (importPreview.length === 0) {
      setStatusMessage({ type: "error", text: "No students to import." });
      return;
    }
    setIsImporting(true);
    setTimeout(() => {
      const newStudents: Student[] = importPreview.map((student, i) => ({
        id: students.length + i + 1,
        firstName: student.firstName,
        lastName: student.lastName,
        admissionNo: `BHS-${new Date().getFullYear()}-${String(students.length + i + 1).padStart(3, "0")}`,
        email: student.email || "",
        class: student.class || "JSS1",
        gender: (student.gender as "Male" | "Female" | "Other") || "Male",
        dateOfBirth: student.dateOfBirth || "",
        phone: student.phone || "",
        address: student.address || "",
        status: (student.status as "active" | "inactive" | "graduated") || "active",
        enrollmentDate: new Date().toISOString().split("T")[0],
      }));
      setStudents((prev) => [...prev, ...newStudents]);
      setStatusMessage({
        type: "success",
        text: `Successfully imported ${newStudents.length} students.`,
      });
      setIsImporting(false);
      setIsImportModalOpen(false);
      setImportPreview([]);
      setSelectedFileName(null);
      setTimeout(() => setStatusMessage(null), 5000);
    }, 1000);
  }, [importPreview, students.length]);

  const downloadTemplate = useCallback(() => {
    const headers = [
      "firstName",
      "lastName",
      "email",
      "class",
      "gender",
      "dateOfBirth",
      "phone",
      "address",
      "status",
    ];
    const csvContent = [
      headers.join(","),
      "John,Doe,john@example.com,JSS1,Male,2010-05-15,08012345678,123 Main St,active",
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "student_template.csv";
    a.click();
    URL.revokeObjectURL(url);
    setStatusMessage({ type: "success", text: "Template downloaded successfully." });
    setTimeout(() => setStatusMessage(null), 3000);
  }, []);

  return {
    students,
    isLoading,
    isModalOpen,
    isDeleteModalOpen,
    isImportModalOpen,
    selectedStudent,
    statusMessage,
    fieldErrors,
    searchTerm,
    filterClass,
    filterStatus,
    currentPage,
    itemsPerPage,
    importPreview,
    selectedFileName,
    isImporting,
    isSubmitting,
    isEditing,
    formData,
    formTriggerRef,
    deleteTriggerRef,
    importTriggerRef,
    filteredStudents,
    totalPages,
    currentStudents,
    setSearchTerm,
    setFilterClass,
    setFilterStatus,
    setCurrentPage,
    handleInputChange,
    handleAddStudent,
    handleEditStudent,
    handleDeleteStudent,
    handleSubmit,
    closeFormModal,
    closeDeleteModal,
    closeImportModal,
    confirmDelete,
    handleOpenImportModal,
    handleFileUpload,
    confirmImport,
    downloadTemplate,
  };
};
