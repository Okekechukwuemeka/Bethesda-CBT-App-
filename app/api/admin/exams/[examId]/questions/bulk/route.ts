import { NextRequest, NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { requireAdmin } from "@/lib/api-guards";
import { Exam, recomputeExamTotals } from "@/lib/models/exam.model";
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

// One entry per unique passage_key seen in the sheet. The ObjectId is
// generated up front (not by inserting the Passage first) so Question
// candidates can carry a real passageId while everything is still being
// validated in memory - nothing is written to the DB until every row AND
// every passage group has passed validation.
interface PassageGroup {
  objectId: mongoose.Types.ObjectId;
  title?: string;
  body?: string;
  kind?: string;
  firstRowNumber: number;
  nextPassageOrder: number;
}

// POST /api/admin/exams/[examId]/questions/bulk
// multipart/form-data with a "file" field containing the CSV.
//
// Optional passage-group columns: passage_key, passage_title, passage_body,
// passage_kind. Rows that share the same passage_key become sub-questions
// of ONE Passage document - created from whichever row in that group is
// the first to carry passage_title/passage_body (later rows in the same
// group can leave those columns blank and just repeat the passage_key).
// Rows with no passage_key import exactly as before - this is purely
// additive.
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

  // --- Pass 1: collect passage groups -------------------------------
  // Scanned separately (before the main row loop) so every row's
  // passageId/passageOrder can be resolved from a fully-known group table,
  // regardless of whether a given row appears before or after the row
  // that happens to carry the passage_title/passage_body text.
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
        subject: exam.subject,
        class: exam.class,
        createdBy: guard.session.user.id,
      }),
    );
  }

  // --- Pass 2: build question candidates, same as before, now also ---
  // resolving passageId/passageOrder for rows that carry a passage_key.
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
    // group can be undefined here only if that key already failed
    // validation above (missing body / bad kind) - in that case we still
    // build the candidate so Promise.allSettled below can report ITS
    // errors too, but we already know the whole import is rejected since
    // `errors` is non-empty from the group check.
    const passageId = group?.objectId;
    const passageOrder = group ? group.nextPassageOrder++ : undefined;

    candidates.push(
      new Question({
        text: row.text?.trim(),
        type,
        marks,
        options: optionsForQuestion,
        correctAnswer,
        passageId,
        passageOrder,
        subject: exam.subject,
        class: exam.class,
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
      // Passage-level errors were already pushed with their row number
      // above (missing body / bad kind) for the cases we pre-check;
      // this catches anything else the schema itself rejects (e.g. an
      // empty title trimmed to nothing isn't possible, but future schema
      // changes might add constraints we haven't pre-checked here).
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
    {
      imported: candidates.length,
      passagesCreated: passageCandidates.length,
      totalQuestions: exam.questions.length,
    },
    { status: 201 },
  );
}
