// Pure group-name rules, shared by the server routes and the browser forms
// (so a mistake is caught - and read out to a screen-reader user - before
// anything is sent). Nothing in here touches the database.

export const GROUP_MAX_LENGTH = 100;

// Sent as the `group` filter to mean "only questions that have no group yet"
// (everything uploaded before grouping existed). Never stored as a name.
export const UNGROUPED_FILTER = "__ungrouped__";

// Trim and collapse runs of spaces so "First  Term 2026 " and "First Term 2026"
// are the same group. Anything that isn't a string becomes "".
export function normalizeGroupName(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.replace(/\s+/g, " ").trim();
}

// Returns a message suitable for showing to the user, or null if the name is
// usable. A blank name is reported as an error here - callers that treat the
// group as optional simply don't call this when the field is empty.
export function validateGroupName(name: string): string | null {
  if (!name) return "Enter a group name, for example “First Term 2026”.";
  if (name.length > GROUP_MAX_LENGTH) {
    return `Group names can be at most ${GROUP_MAX_LENGTH} characters. Yours is ${name.length}.`;
  }
  if (name === UNGROUPED_FILTER) return "That group name is reserved. Please choose another.";
  return null;
}
