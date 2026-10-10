import { groupFilterCondition } from "@/lib/question-groups";

// The bank's list filters - type, subject, class, text search and group - in
// one place so the admin list, the staff list and the "move to group" bulk
// action all mean exactly the same thing by "the questions matching these
// filters". `base` carries restrictions that must always hold (for a teacher:
// their assigned subjects/classes); an explicit subject/class filter narrows
// within them.
export function buildQuestionFilter(
  params: URLSearchParams,
  base: Record<string, unknown> = {},
): Record<string, unknown> {
  const filter: Record<string, unknown> = { ...base };

  const type = params.get("type");
  const subject = params.get("subject");
  const classFilter = params.get("class");
  const search = params.get("search")?.trim();

  if (type) filter.type = type;
  if (subject) filter.subject = subject;
  if (classFilter) filter.class = classFilter;
  if (search) {
    filter.text = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  }

  // The ungrouped condition is an $or, so it is combined with $and rather
  // than spread into the filter where it could clash with another $or.
  const group = groupFilterCondition(params.get("group"));
  return group ? { $and: [filter, group] } : filter;
}
