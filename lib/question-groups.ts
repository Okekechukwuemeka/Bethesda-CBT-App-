import mongoose from "mongoose";
import { Question } from "@/lib/models/question.model";
import { normalizeGroupName, UNGROUPED_FILTER } from "@/lib/question-group-rules";

export {
  GROUP_MAX_LENGTH,
  UNGROUPED_FILTER,
  normalizeGroupName,
  validateGroupName,
} from "@/lib/question-group-rules";

// Question groups: a plain-text label (e.g. "First Term 2026") that organises
// the question bank. See Question.group.

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// If a group with the same name already exists - ignoring capitalisation -
// returns that group's existing spelling, so typing "first term 2026" joins
// "First Term 2026" instead of silently creating a near-duplicate that would
// then show up as a second entry in every group list.
export async function resolveGroupName(name: string): Promise<string> {
  const existing = await Question.findOne({
    group: new RegExp(`^${escapeRegExp(name)}$`, "i"),
  })
    .select("group")
    .lean();
  return existing?.group ?? name;
}

// Mongo condition for the `group` filter parameter, or null for "no filter".
export function groupFilterCondition(param: string | null | undefined): Record<string, unknown> | null {
  if (!param) return null;
  if (param === UNGROUPED_FILTER) {
    return { $or: [{ group: { $exists: false } }, { group: null }, { group: "" }] };
  }
  return { group: normalizeGroupName(param) };
}

export interface QuestionGroupSummary {
  name: string;
  count: number;
}

export interface QuestionGroupList {
  // Most recently used first, so the current term is at the top of every list.
  groups: QuestionGroupSummary[];
  ungroupedCount: number;
  total: number;
}

// aggregate() doesn't cast strings to ObjectIds the way find() does.
export function toObjectIds(ids: unknown[]): mongoose.Types.ObjectId[] {
  return ids.map((id) => new mongoose.Types.ObjectId(String(id)));
}

// Groups (with how many questions each holds) among the questions matching
// `match`. `match` must already use real ObjectIds for subject (see above).
export async function listQuestionGroups(match: Record<string, unknown>): Promise<QuestionGroupList> {
  const rows = await Question.aggregate<{ _id: string | null; count: number; latest: Date }>([
    { $match: match },
    {
      $group: {
        _id: { $ifNull: ["$group", ""] },
        count: { $sum: 1 },
        latest: { $max: "$createdAt" },
      },
    },
  ]);

  const named = rows
    .filter((r) => r._id)
    .sort((a, b) => new Date(b.latest).getTime() - new Date(a.latest).getTime())
    .map((r) => ({ name: r._id as string, count: r.count }));
  const ungroupedCount = rows.find((r) => !r._id)?.count ?? 0;

  return {
    groups: named,
    ungroupedCount,
    total: named.reduce((sum, g) => sum + g.count, 0) + ungroupedCount,
  };
}
