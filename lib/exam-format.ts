export function formatExamDate(dateISO: string): string {
  return new Date(dateISO).toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatExamTime(dateISO: string): string {
  return new Date(dateISO).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatExamDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"}`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
}

// For pre-filling <input type="date"> / <input type="time"> values from a
// stored (UTC) exam date. Deliberately uses local getters (getFullYear,
// getHours, etc.), NOT .toISOString() - toISOString() always returns the
// UTC representation, so slicing it directly shows the wrong wall-clock
// time to anyone not in UTC. In WAT (UTC+1), a 9:00 AM exam is stored as
// 08:00 UTC; slicing the ISO string would show "08:00" in the edit form,
// and re-saving without noticing shifts the exam an hour earlier every
// time it's edited.
export function toLocalDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function toLocalTimeInputValue(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}
