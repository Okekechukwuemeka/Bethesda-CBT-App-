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

// ---------- Row layout shared by every results sheet ----------
// Objective / Theory exams: Score is only meaningful once a script is
// "Marked". Mixed exams are different - they stay at "Awaiting Marking"
// until theory is graded by hand, but the MCQ part is auto-graded on
// submit, so it gets its own columns and shows up straight away instead of
// a blank "—" that made a fully-scored MCQ section look unscored.
type ResultRowLike = Pick<
  ClassExportRow,
  | "admissionNo"
  | "studentName"
  | "score"
  | "totalMarks"
  | "percentage"
  | "status"
  | "objectiveScore"
  | "objectiveTotal"
>;

function resultColumns(subject: SubjectResult): string[] {
  if (subject.examType === "mixed") {
    return [
      "Admission No.",
      "Student Name",
      "MCQ Score",
      "Theory",
      "Total Score",
      "Status",
    ];
  }
  return ["Admission No.", "Student Name", "Score", "Percentage (%)", "Status"];
}

function resultRowValues(subject: SubjectResult, r: ResultRowLike): (string | number)[] {
  const status = STATUS_LABELS[r.status] ?? r.status;

  if (subject.examType !== "mixed") {
    return [
      r.admissionNo,
      r.studentName,
      r.status === "marked" ? `${r.score}/${r.totalMarks}` : "—",
      r.status === "marked" ? r.percentage : "",
      status,
    ];
  }

  const hasMcq = r.objectiveScore !== undefined && r.objectiveTotal !== undefined;
  const mcqScore = hasMcq ? `${r.objectiveScore}/${r.objectiveTotal}` : "—";

  let theory = "—";
  if (r.status === "marked") {
    // Theory part = total minus the MCQ part, so it needs no extra data.
    theory = hasMcq
      ? `${Math.round(((r.score - (r.objectiveScore ?? 0)) + Number.EPSILON) * 100) / 100}/${r.totalMarks - (r.objectiveTotal ?? 0)}`
      : "Marked";
  }
  else if (r.status === "pending") theory = "Script submitted - awaiting marking";
  else if (r.status === "in-progress") theory = "In Progress";
  else if (r.status === "not-started") theory = "Did Not Take Exam";

  return [
    r.admissionNo,
    r.studentName,
    mcqScore,
    theory,
    r.status === "marked" ? `${r.score}/${r.totalMarks}` : "Pending theory marking",
    status,
  ];
}

// ---------- OBJECTIVE / MIXED -> Excel (single subject) ----------
export async function generateObjectiveExcel(
  className: string,
  subject: SubjectResult,
  students: StudentScript[],
) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Results");

  sheet.mergeCells("A1:G1");
  sheet.getCell("A1").value = className;
  sheet.getCell("A1").font = { bold: true, size: 14 };

  sheet.mergeCells("A2:G2");
  sheet.getCell("A2").value = subject.subject;
  sheet.getCell("A2").font = { bold: true, size: 12 };

  sheet.mergeCells("A3:G3");
  sheet.getCell("A3").value = `Exam Type: ${subject.examType}`;
  sheet.getCell("A3").font = { bold: true };

  sheet.mergeCells("A4:G4");
  sheet.getCell("A4").value = `Date: ${new Date().toLocaleDateString()}`;
  sheet.getCell("A4").font = { bold: true };

  sheet.addRow([]);

  const headerRow = sheet.addRow(resultColumns(subject));
  headerRow.font = { bold: true };
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8EEF5" } };
  });

  students.forEach((s) => {
    sheet.addRow(resultRowValues(subject, s));
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

    sheet.mergeCells("A1:G1");
    sheet.getCell("A1").value = subject.subject;
    sheet.getCell("A1").font = { bold: true, size: 12 };
    sheet.addRow([]);

    const head = sheet.addRow(resultColumns(subject));
    head.font = { bold: true };
    head.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8EEF5" } };
    });

    rows.forEach((r) => {
      sheet.addRow(resultRowValues(subject, r));
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

// ---------- CSV (everything: MCQ + theory + total) ----------
// One row per student. Scores are only filled in where they exist: a script
// still awaiting its theory mark has its MCQ part but a blank theory and
// total, and the Status column says why. The theory part is worked out as
// total - MCQ, so the same rows serve the single-exam and whole-class exports.
const CSV_HEADERS = [
  "Class",
  "Subject",
  "Exam",
  "Exam Type",
  "Admission No.",
  "Student Name",
  "MCQ Score",
  "MCQ Total",
  "Theory Score",
  "Theory Total",
  "Total Score",
  "Total Marks",
  "Percentage (%)",
  "Status",
];

function csvCell(value: string | number): string {
  const text = String(value);
  // Quote anything with a comma, quote or line break (and double inner quotes).
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function csvRowValues(
  className: string,
  subject: SubjectResult,
  r: ResultRowLike,
): (string | number)[] {
  const total = r.totalMarks > 0 ? r.totalMarks : subject.totalMarks;
  const marked = r.status === "marked";
  const sat = r.status !== "not-started" && r.status !== "in-progress";

  let mcqScore: string | number = "";
  let mcqTotal: string | number = "";
  let theoryScore: string | number = "";
  let theoryTotal: string | number = "";

  if (subject.examType === "objective") {
    mcqTotal = total;
    if (marked) mcqScore = r.score;
  } else if (subject.examType === "theory") {
    theoryTotal = total;
    if (marked) theoryScore = r.score;
  } else {
    const hasMcq = r.objectiveScore !== undefined && r.objectiveTotal !== undefined;
    if (hasMcq) {
      mcqScore = r.objectiveScore ?? "";
      mcqTotal = r.objectiveTotal ?? "";
    }
    theoryTotal = Math.max(total - (r.objectiveTotal ?? 0), 0);
    if (marked) theoryScore = round2(r.score - (r.objectiveScore ?? 0));
  }

  return [
    className,
    subject.subject,
    subject.examTitle,
    subject.examType,
    r.admissionNo,
    r.studentName,
    mcqScore,
    mcqTotal,
    theoryScore,
    theoryTotal,
    marked ? r.score : "",
    sat || marked ? total : "",
    marked ? r.percentage : "",
    STATUS_LABELS[r.status] ?? r.status,
  ];
}

function downloadCsv(lines: (string | number)[][], filename: string) {
  // The byte-order mark makes Excel read names with accents correctly.
  const text = "\uFEFF" + lines.map((row) => row.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function generateResultsCsv(
  className: string,
  subject: SubjectResult,
  students: StudentScript[],
) {
  downloadCsv(
    [CSV_HEADERS, ...students.map((s) => csvRowValues(className, subject, s))],
    `${className}_${subject.subject}_Results.csv`,
  );
}

export function generateClassResultsCsv(
  className: string,
  subjects: SubjectResult[],
  scoresBySubject: Record<string, ClassExportRow[]>,
) {
  const rows = subjects.flatMap((subject) =>
    (scoresBySubject[subject.id] ?? []).map((r) => csvRowValues(className, subject, r)),
  );
  downloadCsv([CSV_HEADERS, ...rows], `${className}_All_Subjects_Results.csv`);
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
