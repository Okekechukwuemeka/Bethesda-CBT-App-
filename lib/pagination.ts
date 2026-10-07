// Shared by the paginated list endpoints (admin exams, admin questions).
//
// Pagination is OPT-IN: a request is only paginated when it sends `page`
// (and/or `pageSize`). Requests without either keep getting the complete
// list, so existing callers that expect everything (e.g. the exam question
// picker) are unaffected.

export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PageRequest {
  paginated: boolean;
  page: number;
  pageSize: number;
}

function positiveInt(value: string | null): number | null {
  if (value === null) return null;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function parsePageRequest(
  params: URLSearchParams,
  defaultPageSize: number,
  maxPageSize = 100,
): PageRequest {
  const paginated = params.has("page") || params.has("pageSize");
  return {
    paginated,
    page: positiveInt(params.get("page")) ?? 1,
    pageSize: Math.min(positiveInt(params.get("pageSize")) ?? defaultPageSize, maxPageSize),
  };
}

// Clamps the requested page into range - e.g. the admin deletes the last item
// on the last page and reloads, so page 5 of 4 becomes page 4 rather than an
// empty list.
export function buildPagination(total: number, page: number, pageSize: number): PaginationInfo {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return { page: Math.min(Math.max(1, page), totalPages), pageSize, total, totalPages };
}
