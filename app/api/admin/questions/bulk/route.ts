import { NextRequest, NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/api-guards";
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

interface PassageGroup {
  objectId: mongoose.Types.ObjectId;
  title?: string;
  body?: string;
  kind?: string;
  firstRowNumber: number;
  nextPassageOrder: number;
}

// POST /api/admin/questions/bulk
// multipart/form-data: file=<csv>, subject=<subjectId>, class=<ClassLevel>
//
// Optional passage-group columns: passage_key, passage_title, passage_body,
// passage_kind - same shape as the exam-scoped bulk import. Rows sharing a
// passage_key become sub-questions of one Passage document.
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
    if (title && !group.title) group.title = title;
    if (bodyText && !group.body) group.body = bodyText;
    if (kind && !group.kind) group.kind = kind;
  });

  const passageCandidates: IPassage[] = [];
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
    passageCandidates.push(
      new Passage({
        _id: group.objectId,
        title: group.title,
        text: group.body,
        kind: group.kind || "comprehension",
        subject,
        class: classLevel,
        createdBy: guard.session.user.id,
      }),
    );
  }

  // --- Pass 2: build question candidates -------------------------------
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

    const key = row.passage_key?.trim();
    const group = key ? passageGroups.get(key) : undefined;
    const passageId = group?.objectId;
    const passageOrder = group ? group.nextPassageOrder++ : undefined;

    candidates.push(
      new Question({
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
      }),
    );
  });

  const [passageValidationResults, questionValidationResults] = await Promise.all([
    Promise.allSettled(passageCandidates.map((p) => p.validate())),
    Promise.allSettled(candidates.map((q) => q.validate())),
  ]);
  questionValidationResults.forEach((result, i) => {
    if (result.status === "rejected") {
      const rowNumber = i + 2;
      const message = result.reason instanceof Error ? result.reason.message : "Invalid row";
      errors.push({ row: rowNumber, error: message });
    }
  });
  passageValidationResults.forEach((result) => {
    if (result.status === "rejected") {
      const message = result.reason instanceof Error ? result.reason.message : "Invalid passage";
      errors.push({ row: 0, error: message });
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
    await Passage.insertMany(passageCandidates);
  }
  await Question.insertMany(candidates);

  return NextResponse.json(
    { imported: candidates.length, passagesCreated: passageCandidates.length },
    { status: 201 },
  );
}
