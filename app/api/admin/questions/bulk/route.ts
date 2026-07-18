import { NextRequest, NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/api-guards";
import { Question, IQuestion } from "@/lib/models/question.model";

interface RowError {
  row: number;
  error: string;
}

function isOptionColumn(header: string): boolean {
  return /^option\d+$/i.test(header) || /^option[a-z]$/i.test(header);
}

function optionColumnSortKey(header: string): number {
  const numMatch = header.match(/(\d+)$/);
  if (numMatch) return parseInt(numMatch[1], 10);
  const letterMatch = header.match(/([a-zA-Z])$/);
  if (letterMatch) return letterMatch[1].toUpperCase().charCodeAt(0) - 64; // A=1, B=2...
  return 0;
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
      { status: 400 },
    );
  }
  if (typeof subject !== "string" || typeof classLevel !== "string") {
    return NextResponse.json(
      { error: "subject and class are required form fields" },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const text = buffer.toString("utf-8");

  let rows: Record<string, string>[];
  let headerRow: string[];
  try {
    rows = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      // A row with an unquoted comma inside question text will have more
      // fields than the header. Without this, csv-parse throws and aborts
      // the WHOLE file instead of letting us report just that one bad
      // row. Extra fields beyond the header are dropped; missing fields
      // become undefined - both handled by the per-row validation below.
      relax_column_count: true,
    }) as Record<string, string>[];
    headerRow = rows.length > 0 ? Object.keys(rows[0]) : [];
  } catch (error) {
    const message = error instanceof Error ? error.message : "Malformed CSV";
    return NextResponse.json({ error: `Could not parse CSV: ${message}` }, { status: 400 });
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: "CSV has no data rows" }, { status: 400 });
  }

  const optionColumns = headerRow
    .filter(isOptionColumn)
    .sort((a, b) => optionColumnSortKey(a) - optionColumnSortKey(b));

  const errors: RowError[] = [];
  const candidates: IQuestion[] = [];

  rows.forEach((row, i) => {
    const rowNumber = i + 2;

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

    let optionsForQuestion: string[] | undefined;
    let correctAnswer: string | undefined;

    if (type === "Objective") {
      // Last option column designates the answer; everything before it
      // is a real choice.
      const correctAnswerColumn = optionColumns[optionColumns.length - 1];
      const optionValueColumns = optionColumns.slice(0, -1);

      const filledOptions = optionValueColumns
        .map((col) => row[col]?.trim())
        .filter((o): o is string => !!o);
      const correctAnswerRaw = correctAnswerColumn ? row[correctAnswerColumn]?.trim() : undefined;

      if (filledOptions.length < 2) {
        errors.push({
          row: rowNumber,
          error: `Objective questions need at least 2 options, found ${filledOptions.length}`,
        });
        return;
      }
      if (!correctAnswerRaw) {
        errors.push({
          row: rowNumber,
          error: "Missing correct answer in the last option column",
        });
        return;
      }
      if (!filledOptions.includes(correctAnswerRaw)) {
        errors.push({
          row: rowNumber,
          error: `Correct answer "${correctAnswerRaw}" (last column) must exactly match one of the other option columns`,
        });
        return;
      }

      optionsForQuestion = filledOptions;
      correctAnswer = correctAnswerRaw;
    }

    candidates.push(
      new Question({
        text: row.text?.trim(),
        type,
        subject,
        class: classLevel,
        marks,
        options: optionsForQuestion,
        correctAnswer,
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

  return NextResponse.json({ imported: candidates.length }, { status: 201 });
}
