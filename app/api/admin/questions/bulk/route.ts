import { NextRequest, NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/api-guards";
import { Question, IQuestion } from "@/lib/models/question.model";

// Expected CSV header (order doesn't matter, matched by column name):
//
//   text,type,marks,optionA,optionB,optionC,optionD,correctAnswer
//
// - type must be "Objective" or "Theory"
// - for Theory rows, leave optionA-D and correctAnswer blank
//
// subject and class are NOT columns in the CSV - they're passed once as
// form fields alongside the file and applied to the whole batch, matching
// the realistic workflow of "here's my JSS1 Chemistry question set".
interface CsvRow {
  text?: string;
  type?: string;
  marks?: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  correctAnswer?: string;
}

interface RowError {
  row: number; // 1-based, matches spreadsheet row numbers (header = row 1)
  error: string;
}

// POST /api/admin/questions/bulk
// multipart/form-data: file=<csv>, subject=<subjectId>, class=<ClassLevel>
export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  await connectDB();

  const formData = await req.formData();
  const file = formData.get("file");
  const subject = formData.get("subject");
  const classLevel = formData.get("class");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "A CSV file is required in the 'file' field" },
      {
        status: 400,
      },
    );
  }
  if (typeof subject !== "string" || typeof classLevel !== "string") {
    return NextResponse.json(
      { error: "subject and class are required form fields" },
      {
        status: 400,
      },
    );
  }

  const text = await file.text();
  let rows: CsvRow[];
  try {
    rows = parse(text, { columns: true, skip_empty_lines: true, trim: true }) as CsvRow[];
  } catch (error) {
    const message = error instanceof Error ? error.message : "Malformed CSV";
    return NextResponse.json({ error: `Could not parse CSV: ${message}` }, { status: 400 });
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: "CSV has no data rows" }, { status: 400 });
  }

  // Validate every row up front - either the whole batch goes in, or none
  // of it does, so the admin gets one clean list of what to fix rather
  // than a partially-imported question set.
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

    const options = [row.optionA, row.optionB, row.optionC, row.optionD]
      .map((o) => o?.trim())
      .filter((o): o is string => !!o);

    const question = new Question({
      text: row.text?.trim(),
      type,
      subject,
      class: classLevel,
      marks,
      options: type === "Objective" ? options : undefined,
      correctAnswer: type === "Objective" ? row.correctAnswer?.trim() : undefined,
      createdBy: guard.session.user.id,
    });

    candidates.push(question);
  });

  // Runs the model's own validators (including the objective/theory rule)
  // without writing anything to the DB yet.
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

  return NextResponse.json({ imported: candidates.length }, { status: 201 });
}
