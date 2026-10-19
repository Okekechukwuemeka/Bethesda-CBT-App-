// Display helpers for the student profile pages. Dates are shown in Nigerian
// time, the school's local time, whatever the admin's own device is set to.

const TZ = "Africa/Lagos";

export function formatDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-NG", { dateStyle: "medium", timeZone: TZ });
}

export function formatDateTime(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: TZ,
  });
}

export function formatTime(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-NG", { timeStyle: "short", timeZone: TZ });
}

// "12 Jan 2026" for one day, "12 Jan 2026 – 20 Jan 2026" for a span.
export function formatDateRange(first?: string, last?: string): string {
  if (!first && !last) return "—";
  const a = formatDate(first ?? last);
  const b = formatDate(last ?? first);
  return a === b ? a : `${a} – ${b}`;
}

export function formatScore(score: number | null | undefined, total: number | null | undefined) {
  if (score === null || score === undefined || total === null || total === undefined) return "—";
  return `${score} / ${total}`;
}
