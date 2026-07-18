import { NextRequest, NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/api-guards";
import { Exam, recomputeExamTotals } from "@/lib/models/exam.model";
import { Question, IQuestion } from "@/lib/models/question.model";

// Expected CSV header for Objective rows (order doesn't matter for text/
// type/marks, but option columns are read positionally):
//
//   text,type,marks,option1,option2,option3,...,optionN
//
// The LAST populated option column in each row is always treated as the
// correct answer, regardless of how many option columns that row has -
// mirrors /api/admin/questions/bulk so both bulk-import paths behave
// identically. For Theory rows, leave every option column blank.
//
// subject/class are NOT columns here - every question created this way
// inherits the exam's own subject and class, same as the single/multi
// "newQuestions" path on POST .../questions.
interface RowError {
  row: number; // 1-based, matches spreadsheet row numbers (header = row 1)
  error: string;
}

function isOptionColumn(header: string): boolean {
  return /^option\d+$/i.test(header) || /^option[a-z]$/i.test(header);
}

// POST /api/admin/exams/[examId]/questions/bulk
// multipart/form-data with a "file" field containing the CSV.
export async function POST(req: NextRequest, context: { params: Promise<{ examId: string }> }) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const { examId } = await context.params;
  await connectDB();

  const exam = await Exam.findById(examId);
  if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "A CSV file is required in the 'file' field" },
      { status: 400 },
    );
  }

  // Read as raw bytes and decode explicitly as UTF-8, rather than
  // file.text() (which can silently mis-decode files saved by Excel as
  // Windows-1252/Latin-1) - this is what shows up as "?" in place of
  // special characters like minus signs, superscripts, or exponents
  // after import.
  const buffer = Buffer.from(await file.arrayBuffer());
  const text = buffer.toString("utf-8");

  let rows: Record<string, string>[];
  let headerRow: string[];
  try {
    rows = parse(text, { columns: true, skip_empty_lines: true, trim: true }) as Record<
      string,
      string
    >[];
    headerRow = rows.length > 0 ? Object.keys(rows[0]) : [];
  } catch (error) {
    const message = error instanceof Error ? error.message : "Malformed CSV";
    return NextResponse.json({ error: `Could not parse CSV: ${message}` }, { status: 400 });
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: "CSV has no data rows" }, { status: 400 });
  }

  const optionColumns = headerRow.filter(isOptionColumn);
  if (optionColumns.length === 0) {
    return NextResponse.json(
      {
        error:
          "No option columns found. Use headers like option1, option2, option3, ... (as many as needed).",
      },
      { status: 400 },
    );
  }

  const errors: RowError[] = [];
  const candidates: IQuestion[] = [];

  rows.forEach((row, i) => {
    const rowNumber = i + 2; // +1 for 0-index, +1 for the header row

    const type = row.type?.trim();
    if (type !== "Objective" && type !== "Theory") {
      errors.push({
        row: rowNumber,
        error: `type must be "Objective" or "Theory", got "${row.type ?? ""}"`,
      });
      return;
    }

    const marks = Number(row.marks);
    if (!row.marks || Number.isNaN(marks) || marks < 1) {
      errors.push({
        row: rowNumber,
        error: `marks must be a number >= 1, got "${row.marks ?? ""}"`,
      });
      return;
    }

    const filledOptions = optionColumns
      .map((col) => row[col]?.trim())
      .filter((o): o is string => !!o);

    const correctAnswer =
      type === "Objective" && filledOptions.length > 0
        ? filledOptions[filledOptions.length - 1]
        : undefined;

    candidates.push(
      new Question({
        text: row.text?.trim(),
        type,
        marks,
        options: type === "Objective" ? filledOptions : undefined,
        correctAnswer,
        subject: exam.subject,
        class: exam.class,
        createdBy: guard.session.user.id,
      }),
    );
  });

  const validationResults = await Promise.allSettled(candidates.map((q) => q.validate()));
  validationResults.forEach((result, i) => {
    if (result.status === "rejected") {
      const rowNumber = i + 2;
      const message = result.reason instanceof Error ? result.reason.message : "Invalid row";
      errors.push({ row: rowNumber, error: message });
    }
  });

  if (errors.length > 0) {
    errors.sort((a, b) => a.row - b.row);
    return NextResponse.json(
      { error: "CSV has validation errors, nothing was imported", rowErrors: errors },
      { status: 400 },
    );
  }

  await Question.insertMany(candidates);

  const nextOrderStart = exam.questions.length;
  candidates.forEach((question, i) => {
    exam.questions.push({
      question: question._id as unknown as mongoose.Types.ObjectId,
      order: nextOrderStart + i,
    });
  });
  await exam.save();
  await recomputeExamTotals(exam.id);

  return NextResponse.json(
    { imported: candidates.length, totalQuestions: exam.questions.length },
    { status: 201 },
  );
}
