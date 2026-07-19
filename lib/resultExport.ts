import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ClassExportRow, SubjectResult, StudentScript } from "@/types/admin-results";

const STATUS_LABELS: Record<string, string> = {
  marked: "Marked",
  pending: "Awaiting Marking",
  "in-progress": "In Progress",
  "not-started": "Did Not Take Exam",
};

// ---------- OBJECTIVE / MIXED -> Excel (single subject) ----------
export async function generateObjectiveExcel(
  className: string,
  subject: SubjectResult,
  students: StudentScript[],
) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Results");

  sheet.mergeCells("A1:E1");
  sheet.getCell("A1").value = className;
  sheet.getCell("A1").font = { bold: true, size: 14 };

  sheet.mergeCells("A2:E2");
  sheet.getCell("A2").value = subject.subject;
  sheet.getCell("A2").font = { bold: true, size: 12 };

  sheet.mergeCells("A3:E3");
  sheet.getCell("A3").value = `Exam Type: ${subject.examType}`;
  sheet.getCell("A3").font = { bold: true };

  sheet.mergeCells("A4:E4");
  sheet.getCell("A4").value = `Date: ${new Date().toLocaleDateString()}`;
  sheet.getCell("A4").font = { bold: true };

  sheet.addRow([]);

  const headerRow = sheet.addRow([
    "Admission No.",
    "Student Name",
    "Score",
    "Percentage (%)",
    "Status",
  ]);
  headerRow.font = { bold: true };
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8EEF5" } };
  });

  students.forEach((s) => {
    sheet.addRow([
      s.admissionNo,
      s.studentName,
      s.status === "marked" ? `${s.score}/${s.totalMarks}` : "—",
      s.status === "marked" ? s.percentage : "",
      STATUS_LABELS[s.status] ?? s.status,
    ]);
  });

  sheet.columns.forEach((col) => {
    col.width = 20;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(
    buffer,
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    `${className}_${subject.subject}_Results.xlsx`,
  );
}

// ---------- WHOLE CLASS, ALL SUBJECTS -> Excel ----------
// One "Summary" sheet with every subject's headline stats, plus one
// detail sheet per subject listing every student's score.
export async function generateClassResultsExcel(
  className: string,
  subjects: SubjectResult[],
  scoresBySubject: Record<string, ClassExportRow[]>,
) {
  const workbook = new ExcelJS.Workbook();

  const summary = workbook.addWorksheet("Summary");
  summary.mergeCells("A1:F1");
  summary.getCell("A1").value = `${className} — All Subjects`;
  summary.getCell("A1").font = { bold: true, size: 14 };
  summary.mergeCells("A2:F2");
  summary.getCell("A2").value = `Date: ${new Date().toLocaleDateString()}`;
  summary.getCell("A2").font = { bold: true };
  summary.addRow([]);

  // Updated headers to clearly indicate both raw score and relative percentage are provided
  const summaryHeader = summary.addRow([
    "Subject",
    "Exam Type",
    "Completed",
    "Average (%)",
    "Highest Score (%)",
    "Lowest Score (%)",
  ]);
  summaryHeader.font = { bold: true };
  summaryHeader.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8EEF5" } };
  });

  subjects.forEach((s) => {
    // Calculate the contextual percentage dynamically using raw scores and total marks
    const highestPct = s.totalMarks > 0 ? Math.round((s.highestScore / s.totalMarks) * 100) : 0;
    const lowestPct = s.totalMarks > 0 ? Math.round((s.lowestScore / s.totalMarks) * 100) : 0;

    // Format composite strings matching the pattern: Raw/Total (Pct%)
    const highestDisplay =
      s.completed > 0 ? `${s.highestScore}/${s.totalMarks} (${highestPct}%)` : "—";
    const lowestDisplay =
      s.completed > 0 ? `${s.lowestScore}/${s.totalMarks} (${lowestPct}%)` : "—";

    summary.addRow([
      s.subject,
      s.examType,
      `${s.completed}/${s.totalStudents}`,
      s.averageScore,
      highestDisplay,
      lowestDisplay,
    ]);
  });

  // Adjusted column width to 24 to comfortably fit combined text strings without clipping
  summary.columns.forEach((col) => {
    col.width = 24;
  });

  subjects.forEach((subject) => {
    const rows = scoresBySubject[subject.id] ?? [];
    const sheetName =
      subject.subject.replace(/[:\\/?*[\]]/g, "").slice(0, 31) || subject.id.slice(0, 8);
    const sheet = workbook.addWorksheet(sheetName);

    sheet.mergeCells("A1:E1");
    sheet.getCell("A1").value = subject.subject;
    sheet.getCell("A1").font = { bold: true, size: 12 };
    sheet.addRow([]);

    const head = sheet.addRow([
      "Admission No.",
      "Student Name",
      "Score",
      "Percentage (%)",
      "Status",
    ]);
    head.font = { bold: true };
    head.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8EEF5" } };
    });

    rows.forEach((r) => {
      sheet.addRow([
        r.admissionNo,
        r.studentName,
        r.status === "marked" ? `${r.score}/${r.totalMarks}` : "—",
        r.status === "marked" ? r.percentage : "",
        STATUS_LABELS[r.status] ?? r.status,
      ]);
    });
    sheet.columns.forEach((col) => {
      col.width = 20;
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(
    buffer,
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    `${className}_All_Subjects_Results.xlsx`,
  );
}

function downloadBlob(buffer: ExcelJS.Buffer, type: string, filename: string) {
  const blob = new Blob([buffer], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------- THEORY -> PDF ----------
function addScriptHeader(
  doc: jsPDF,
  className: string,
  subject: SubjectResult,
  student: StudentScript,
) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(student.studentName, 105, 16, { align: "center" });

  doc.setFontSize(12);
  doc.text(`Admission No: ${student.admissionNo}`, 105, 24, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Class: ${className}`, 14, 36);
  doc.text(`Subject: ${subject.subject}`, 14, 42);
  doc.text(`Exam Type: ${subject.examType}`, 14, 48);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 54);

  doc.setDrawColor(200, 200, 200);
  doc.line(14, 58, 196, 58);
}

export function generateTheoryScriptPDF(
  className: string,
  subject: SubjectResult,
  student: StudentScript,
) {
  const doc = new jsPDF();
  addScriptHeader(doc, className, subject, student);

  autoTable(doc, {
    startY: 64,
    head: [["Q. No.", "Answer"]],
    body: (student.answers ?? []).map((a) => [a.questionNo, a.answer || "(No answer)"]),
    styles: { fontSize: 10, cellPadding: 3, valign: "top" },
    headStyles: { fillColor: [26, 58, 92], textColor: 255, fontStyle: "bold" },
    columnStyles: { 0: { cellWidth: 20 } },
  });

  doc.save(`${student.admissionNo}_${subject.subject}_Script.pdf`);
}

export function generateAllTheoryScriptsPDF(
  className: string,
  subject: SubjectResult,
  students: StudentScript[],
) {
  const doc = new jsPDF();
  const submitted = students.filter((s) => s.status !== "not-started");

  submitted.forEach((student, idx) => {
    if (idx > 0) doc.addPage();
    addScriptHeader(doc, className, subject, student);

    autoTable(doc, {
      startY: 64,
      head: [["Q. No.", "Answer"]],
      body: (student.answers ?? []).map((a) => [a.questionNo, a.answer || "(No answer)"]),
      styles: { fontSize: 10, cellPadding: 3, valign: "top" },
      headStyles: { fillColor: [26, 58, 92], textColor: 255, fontStyle: "bold" },
      columnStyles: { 0: { cellWidth: 20 } },
    });
  });

  doc.save(`${className}_${subject.subject}_All_Scripts.pdf`);
}
