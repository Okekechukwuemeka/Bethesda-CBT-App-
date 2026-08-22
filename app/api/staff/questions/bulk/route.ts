import { NextRequest, NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { requireTeacher, assertTeacherScope } from "@/lib/api-guards";
import { Question, IQuestion } from "@/lib/models/question.model";
import { Passage, IPassage } from "@/lib/models/passage.model";
import { PASSAGE_KINDS } from "@/lib/models/constants";

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
  if (letterMatch) return letterMatch[1].toUpperCase().charCodeAt(0) - 64;
  return 0;
}

// See the admin bulk-import route (app/api/admin/questions/bulk/route.ts)
// for why this exists - kept identical here so a teacher's CSV behaves the
// same way an admin's would.
const SPREADSHEET_DATE_MANGLE_PATTERNS = [
  /^\d{1,2}-[A-Za-z]{3}$/,
  /^[A-Za-z]{3}-\d{1,2}$/,
  /^\d{1,2}\/\d{1,2}\/\d{2,4}$/,
];

function looksLikeMangledFraction(value: string): boolean {
  return SPREADSHEET_DATE_MANGLE_PATTERNS.some((pattern) => pattern.test(value.trim()));
}

const MANGLE_FIX_HINT =
  "this looks like it may have been auto-converted to a date by Excel/Sheets " +
  '(e.g. "1/3" becoming "1-Mar"). If this should be a fraction or ratio, ' +
  "re-enter it with a leading apostrophe (e.g. '1/3) or format the column as " +
  "Text before typing, then re-export the CSV.";

interface PassageGroup {
  objectId: mongoose.Types.ObjectId;
  title?: string;
  body?: string;
  kind?: string;
  firstRowNumber: number;
  nextPassageOrder: number;
}

interface QuestionCandidate {
  rowNumber: number;
  doc: IQuestion;
}
interface PassageCandidate {
  rowNumber: number;
  doc: IPassage;
}

// POST /api/staff/questions/bulk
// multipart/form-data: file=<csv>, subject=<subjectId>, class=<ClassLevel>
// Identical CSV format to the admin bulk importer, but subject+class MUST
// be a pair this teacher is assigned - see assertTeacherScope.
export async function POST(req: NextRequest) {
  const guard = await requireTeacher();
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

  const scope = await assertTeacherScope(guard.session.user.id, subject, classLevel as never);
  if (!scope.ok) return scope.response;

  const buffer = Buffer.from(await file.arrayBuffer());
  const text = buffer.toString("utf-8");

  let rows: Record<string, string>[];
  let headerRow: string[];
  try {
    rows = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
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

  // --- Pass 1: collect passage groups ---------------------------------
  const passageGroups = new Map<string, PassageGroup>();

  rows.forEach((row, i) => {
    const rowNumber = i + 2;
    const key = row.passage_key?.trim();
    if (!key) return;

    let group = passageGroups.get(key);
    if (!group) {
      group = {
        objectId: new mongoose.Types.ObjectId(),
        firstRowNumber: rowNumber,
        nextPassageOrder: 1,
      };
      passageGroups.set(key, group);
    }

    const title = row.passage_title?.trim();
    const bodyText = row.passage_body?.trim();
    const kind = row.passage_kind?.trim();

    if (title && looksLikeMangledFraction(title)) {
      errors.push({ row: rowNumber, error: `passage_title "${title}" - ${MANGLE_FIX_HINT}` });
    }
    if (bodyText && looksLikeMangledFraction(bodyText)) {
      errors.push({ row: rowNumber, error: `passage_body "${bodyText}" - ${MANGLE_FIX_HINT}` });
    }

    if (title && !group.title) group.title = title;
    if (bodyText && !group.body) group.body = bodyText;
    if (kind && !group.kind) group.kind = kind;
  });

  const passageCandidates: PassageCandidate[] = [];
  for (const [key, group] of passageGroups) {
    if (!group.body) {
      errors.push({
        row: group.firstRowNumber,
        error: `passage_key "${key}" has no passage_body in any of its rows`,
      });
      continue;
    }
    if (group.kind && !(PASSAGE_KINDS as readonly string[]).includes(group.kind)) {
      errors.push({
        row: group.firstRowNumber,
        error: `passage_kind must be one of ${PASSAGE_KINDS.join(", ")}, got "${group.kind}"`,
      });
      continue;
    }
    passageCandidates.push({
      rowNumber: group.firstRowNumber,
      doc: new Passage({
        _id: group.objectId,
        title: group.title,
        text: group.body,
        kind: group.kind || "comprehension",
        subject,
        class: classLevel,
        createdBy: guard.session.user.id,
      }),
    });
  }

  // --- Pass 2: build question candidates -------------------------------
  const candidates: QuestionCandidate[] = [];

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

    const questionText = row.text?.trim();
    if (questionText && looksLikeMangledFraction(questionText)) {
      errors.push({ row: rowNumber, error: `text "${questionText}" - ${MANGLE_FIX_HINT}` });
      return;
    }

    let optionsForQuestion: string[] | undefined;
    let correctAnswer: string | undefined;

    if (type === "Objective") {
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
        errors.push({ row: rowNumber, error: "Missing correct answer in the last option column" });
        return;
      }
      if (looksLikeMangledFraction(correctAnswerRaw)) {
        errors.push({
          row: rowNumber,
          error: `correct answer "${correctAnswerRaw}" - ${MANGLE_FIX_HINT}`,
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

      const mangledOption = filledOptions.find(looksLikeMangledFraction);
      if (mangledOption) {
        errors.push({ row: rowNumber, error: `option "${mangledOption}" - ${MANGLE_FIX_HINT}` });
        return;
      }

      optionsForQuestion = filledOptions;
      correctAnswer = correctAnswerRaw;
    }

    const key = row.passage_key?.trim();
    const group = key ? passageGroups.get(key) : undefined;
    const passageId = group?.objectId;
    const passageOrder = group ? group.nextPassageOrder++ : undefined;

    candidates.push({
      rowNumber,
      doc: new Question({
        text: row.text?.trim(),
        type,
        subject,
        class: classLevel,
        marks,
        options: optionsForQuestion,
        correctAnswer,
        passageId,
        passageOrder,
        createdBy: guard.session.user.id,
        createdByModel: "Staff",
      }),
    });
  });

  const [passageValidationResults, questionValidationResults] = await Promise.all([
    Promise.allSettled(passageCandidates.map((p) => p.doc.validate())),
    Promise.allSettled(candidates.map((q) => q.doc.validate())),
  ]);
  questionValidationResults.forEach((result, i) => {
    if (result.status === "rejected") {
      const rowNumber = candidates[i].rowNumber;
      const message = result.reason instanceof Error ? result.reason.message : "Invalid row";
      errors.push({ row: rowNumber, error: message });
    }
  });
  passageValidationResults.forEach((result, i) => {
    if (result.status === "rejected") {
      const rowNumber = passageCandidates[i].rowNumber;
      const message = result.reason instanceof Error ? result.reason.message : "Invalid passage";
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

  if (passageCandidates.length > 0) {
    await Passage.insertMany(passageCandidates.map((p) => p.doc));
  }
  await Question.insertMany(candidates.map((q) => q.doc));

  return NextResponse.json(
    { imported: candidates.length, passagesCreated: passageCandidates.length },
    { status: 201 },
  );
}
