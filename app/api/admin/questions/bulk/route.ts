import { NextRequest, NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/api-guards";
import { Question, IQuestion } from "@/lib/models/question.model";

// Expected CSV header for Objective rows (order doesn't matter for the
// first two columns, but option columns are read positionally):
//
//   text,type,marks,option1,option2,option3,...,optionN
//
// The LAST populated option column in each row is always treated as the
// correct answer, regardless of how many option columns that row has -
// this lets different rows in the same file have different numbers of
// options (2, 3, 5, whatever) without a fixed optionA-D/correctAnswer
// schema. For Theory rows, leave every option column blank.
//
// subject and class are NOT columns in the CSV - they're passed once as
// form fields alongside the file and applied to the whole batch.
interface RowError {
  row: number; // 1-based, matches spreadsheet row numbers (header = row 1)
  error: string;
}

// Recognizes any header matching option1, option2, ... optionN (case-
// insensitive) - NOT limited to optionA-D. Falls back to also accepting
// the old fixed optionA/B/C/D naming for CSVs exported before this change.
function isOptionColumn(header: string): boolean {
  return /^option\d+$/i.test(header) || /^option[a-z]$/i.test(header);
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

  // Read as raw bytes and decode explicitly as UTF-8, rather than
  // file.text() (which can silently mis-decode files saved by Excel as
  // Windows-1252/Latin-1) - this is what shows up as "?" in place of
  // special characters like minus signs, superscripts, or accented
  // letters after import.
  const buffer = Buffer.from(await file.arrayBuffer());
  const text = buffer.toString("utf-8");

  let rows: Record<string, string>[];
  let headerRow: string[];
  try {
    rows = parse(text, { columns: true, skip_empty_lines: true, trim: true }) as Record<
      string,
      string
    >[];
    // csv-parse doesn't expose the header list directly from the columns
    // output, so re-derive it from the first data row's own keys - fine
    // since every row shares the same header set by construction.
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

    // Read every option column present for this row, in header order,
    // dropping blanks - this naturally supports rows with different
    // numbers of options within the same file.
    const filledOptions = optionColumns
      .map((col) => row[col]?.trim())
      .filter((o): o is string => !!o);

    // The LAST filled option is always the correct answer for Objective
    // rows - no separate correctAnswer column needed.
    const correctAnswer =
      type === "Objective" && filledOptions.length > 0
        ? filledOptions[filledOptions.length - 1]
        : undefined;

    const question = new Question({
      text: row.text?.trim(),
      type,
      subject,
      class: classLevel,
      marks,
      options: type === "Objective" ? filledOptions : undefined,
      correctAnswer,
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
