"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { CreatedStudentInfo } from "@/components/admin/students/StudentCreatedModal";
import type { BulkImportResults } from "@/components/admin/students/BulkImportResultsModal";

export interface Student {
  id: string;
  admissionNo: string;
  firstName: string;
  lastName: string;
  class: string;
  gender: "Male" | "Female" | "Other";
  dateOfBirth: string;
  address: string;
  status: "active" | "inactive" | "graduated";
  enrollmentDate: string; // read-only, sourced from the backend's createdAt
}

interface ImportPreviewStudent {
  firstName: string;
  lastName: string;
  class: string;
  gender: string;
  dateOfBirth: string;
  address: string;
  status: string;
}

interface StatusMessage {
  type: "success" | "error" | "warning";
  text: string;
}

type RequiredField = "firstName" | "lastName" | "class";
type FieldErrors = Partial<Record<RequiredField, string>>;

// Maps a raw API student document onto the shape this hook/UI works with.
// admissionNumber/isActive/createdAt are the backend's real field names;
// admissionNo/status/enrollmentDate are what the existing UI expects -
// kept as-is here rather than renaming everything downstream.
function fromApiStudent(s: any): Student {
  return {
    id: s._id ?? s.id,
    admissionNo: s.admissionNumber,
    firstName: s.firstName,
    lastName: s.lastName,
    class: s.class,
    gender: s.gender ?? "Male",
    dateOfBirth: s.dateOfBirth ? s.dateOfBirth.split("T")[0] : "",
    address: s.address ?? "",
    status: s.class === "graduated" ? "graduated" : s.isActive ? "active" : "inactive",
    enrollmentDate: s.createdAt ? s.createdAt.split("T")[0] : "",
  };
}

async function parseErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    return body.error ?? fallback;
  } catch {
    return fallback;
  }
}

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
  const [createdStudentInfo, setCreatedStudentInfo] = useState<CreatedStudentInfo | null>(null);
  const [isCreatedModalOpen, setIsCreatedModalOpen] = useState(false);
  const [bulkImportResults, setBulkImportResults] = useState<BulkImportResults | null>(null);
  const [isBulkResultsModalOpen, setIsBulkResultsModalOpen] = useState(false);

  const formTriggerRef = useRef<HTMLElement | null>(null);
  const deleteTriggerRef = useRef<HTMLElement | null>(null);
  const importTriggerRef = useRef<HTMLElement | null>(null);

  const itemsPerPage = 10;

  const [formData, setFormData] = useState<Partial<Student>>({
    firstName: "",
    lastName: "",
    class: "",
    gender: "Male",
    dateOfBirth: "",
    address: "",
    status: "active",
  });

  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/students");
      if (!res.ok) throw new Error(await parseErrorMessage(res, "Failed to load students"));
      const { students: apiStudents } = await res.json();
      setStudents(apiStudents.map(fromApiStudent));
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to load students.",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Client-side search/class/status filtering is kept exactly as before -
  // the backend also supports these as query params (GET
  // /api/admin/students?class=&status=&search=) if you'd rather push this
  // down to the server as the student list grows large enough that
  // fetching everyone up front stops making sense.
  const filteredStudents = useMemo(
    () =>
      students.filter((student) => {
        const matchesSearch =
          student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.admissionNo.toLowerCase().includes(searchTerm.toLowerCase());
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
  const closeCreatedModal = useCallback(() => {
    setIsCreatedModalOpen(false);
    setCreatedStudentInfo(null);
  }, []);
  const closeBulkResultsModal = useCallback(() => {
    setIsBulkResultsModalOpen(false);
    setBulkImportResults(null);
  }, []);
  const closeImportModal = useCallback(() => {
    if (!isImporting) {
      setIsImportModalOpen(false);
      setImportPreview([]);
      setSelectedFileName(null);
    }
  }, [isImporting]);

  const handleAddStudent = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    formTriggerRef.current = e.currentTarget;
    setIsEditing(false);
    setFieldErrors({});
    // No admissionNo field here - the backend generates it on save, and a
    // client-guessed placeholder could collide or just be wrong the moment
    // two admins create students around the same time.
    setFormData({
      firstName: "",
      lastName: "",
      class: "",
      gender: "Male",
      dateOfBirth: "",
      address: "",
      status: "active",
    });
    setIsModalOpen(true);
  }, []);

  const handleEditStudent = useCallback(
    (student: Student, e: React.MouseEvent<HTMLButtonElement>) => {
      formTriggerRef.current = e.currentTarget;
      setIsEditing(true);
      setSelectedStudent(student);
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
    if (!formData.class) errors.class = "Please select a class.";
    return errors;
  }, [formData]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
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

      // "status" in the UI is really two backend concepts: `class` already
      // has its own "graduated" value, and everything else is just
      // isActive true/false. Translate rather than sending "status" as-is.
      const isGraduated = formData.status === "graduated";
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        class: isGraduated ? "graduated" : formData.class,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth || undefined,
        address: formData.address,
        isActive: formData.status === "active",
      };

      try {
        if (isEditing && selectedStudent) {
          const res = await fetch(`/api/admin/students/${selectedStudent.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error(await parseErrorMessage(res, "Failed to update student"));
          const { student } = await res.json();

          setStudents((prev) =>
            prev.map((s) => (s.id === selectedStudent.id ? fromApiStudent(student) : s)),
          );
          setStatusMessage({
            type: "success",
            text: `Student ${formData.firstName} ${formData.lastName} updated successfully.`,
          });
        } else {
          const res = await fetch("/api/admin/students", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error(await parseErrorMessage(res, "Failed to create student"));
          const { student, tempPassword } = await res.json();

          setStudents((prev) => [fromApiStudent(student), ...prev]);
          // tempPassword only exists in THIS response - if it's not shown
          // now, it's gone (only the bcrypt hash is ever stored). The
          // modal (not just this status message) is what actually
          // guarantees a screen reader user sees/hears it.
          setStatusMessage({
            type: "success",
            text: `Student ${formData.firstName} ${formData.lastName} added successfully.`,
          });
          setCreatedStudentInfo({
            name: `${student.firstName} ${student.lastName}`,
            admissionNo: student.admissionNumber,
            tempPassword,
          });
          setIsCreatedModalOpen(true);
        }
        setIsSubmitting(false);
        setIsModalOpen(false);
      } catch (err) {
        setIsSubmitting(false);
        setStatusMessage({
          type: "error",
          text: err instanceof Error ? err.message : "Something went wrong.",
        });
      }
    },
    [validate, isEditing, selectedStudent, formData],
  );

  const confirmDelete = useCallback(async () => {
    if (!selectedStudent) return;
    try {
      const res = await fetch(`/api/admin/students/${selectedStudent.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await parseErrorMessage(res, "Failed to delete student"));

      setStudents((prev) => prev.filter((s) => s.id !== selectedStudent.id));
      setStatusMessage({
        type: "warning",
        text: `Student ${selectedStudent.firstName} ${selectedStudent.lastName} has been deleted.`,
      });
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to delete student.",
      });
    } finally {
      setIsDeleteModalOpen(false);
      setSelectedStudent(null);
    }
  }, [selectedStudent]);

  const handleOpenImportModal = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    importTriggerRef.current = e.currentTarget;
    setIsImportModalOpen(true);
    setImportPreview([]);
    setSelectedFileName(null);
    setStatusMessage(null);
  }, []);

  const parseFileContent = (content: string, fileName: string): ImportPreviewStudent[] => {
    const parsed: ImportPreviewStudent[] = [];
    const lines = content.split("\n").filter((line) => line.trim());
    if (!fileName.endsWith(".csv")) return parsed;

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      if (values.length < 2) continue;
      const student: ImportPreviewStudent = {
        firstName: "",
        lastName: "",
        class: "",
        gender: "Male",
        dateOfBirth: "",
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
          case "address":
            student.address = value;
            break;
          case "status":
            student.status = value || "active";
            break;
        }
      });
      if (student.firstName && student.lastName && student.class) parsed.push(student);
    }
    return parsed;
  };

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
            ? {
                type: "error",
                text: "No valid students found (need at least firstName, lastName, and class).",
              }
            : { type: "success", text: `Found ${parsedStudents.length} students ready to import.` },
        );
      } catch {
        setStatusMessage({ type: "error", text: "Error parsing file." });
      }
    };
    reader.readAsText(file);
  }, []);

  // No bulk-import endpoint exists for students (unlike the question
  // bank), so this creates them one at a time via the same POST used by
  // the single "Add Student" form. Each row gets its own generated
  // password - collected here so they can all be shown/exported at once,
  // since none of them can be recovered after this call finishes.
  const confirmImport = useCallback(async () => {
    if (importPreview.length === 0) {
      setStatusMessage({ type: "error", text: "No students to import." });
      return;
    }
    setIsImporting(true);

    const created: Student[] = [];
    const credentials: { name: string; admissionNo: string; password: string }[] = [];
    const failures: { row: number; error: string }[] = [];

    for (let i = 0; i < importPreview.length; i++) {
      const row = importPreview[i];
      try {
        const res = await fetch("/api/admin/students", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: row.firstName,
            lastName: row.lastName,
            class: row.class,
            gender: row.gender,
            dateOfBirth: row.dateOfBirth || undefined,
            address: row.address,
            isActive: row.status !== "inactive",
          }),
        });
        if (!res.ok) {
          failures.push({ row: i + 2, error: await parseErrorMessage(res, "Failed") });
          continue;
        }
        const { student, tempPassword } = await res.json();
        created.push(fromApiStudent(student));
        credentials.push({
          name: `${student.firstName} ${student.lastName}`,
          admissionNo: student.admissionNumber,
          password: tempPassword,
        });
      } catch {
        failures.push({ row: i + 2, error: "Network error" });
      }
    }

    setStudents((prev) => [...created, ...prev]);

    setBulkImportResults({ created: credentials, failures });
    setIsBulkResultsModalOpen(true);
    // A short, credential-free summary for the toast - the modal is what
    // actually carries the sensitive data now.
    setStatusMessage(
      created.length > 0
        ? {
            type: failures.length > 0 ? "warning" : "success",
            text: `Imported ${created.length} student(s).${failures.length > 0 ? ` ${failures.length} row(s) failed.` : ""}`,
          }
        : { type: "error", text: "No students were imported." },
    );

    setIsImporting(false);
    setIsImportModalOpen(false);
    setImportPreview([]);
    setSelectedFileName(null);
  }, [importPreview]);

  const downloadTemplate = useCallback(() => {
    const headers = [
      "firstName",
      "lastName",
      "class",
      "gender",
      "dateOfBirth",
      "address",
      "status",
    ];
    const csvContent = [headers.join(","), "John,Doe,JSS1,Male,2010-05-15,123 Main St,active"].join(
      "\n",
    );
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "student_template.csv";
    a.click();
    URL.revokeObjectURL(url);
    setStatusMessage({ type: "success", text: "Template downloaded successfully." });
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
    createdStudentInfo,
    isCreatedModalOpen,
    closeCreatedModal,
    bulkImportResults,
    isBulkResultsModalOpen,
    closeBulkResultsModal,
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
