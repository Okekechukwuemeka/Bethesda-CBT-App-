// Rules for a NEW password chosen through the recovery flow. Pure and
// dependency-free so the very same check runs in the browser (instant
// feedback) and on the server (the one that actually counts).
//
// Deliberately short and screen-reader friendly rather than a wall of
// composition rules: length plus "not trivially guessable" is what matters.

export const PASSWORD_MIN_LENGTH = 8;
// bcrypt only looks at the first 72 BYTES of its input. Anything longer would
// be silently truncated (so two different long passwords could collide), so
// it is rejected up front instead.
export const PASSWORD_MAX_BYTES = 72;

export const PASSWORD_REQUIREMENTS_TEXT = `At least ${PASSWORD_MIN_LENGTH} characters, with at least one letter and one number.`;

export function validateNewPassword(
  password: unknown,
  context: { username?: string } = {},
): string | null {
  if (typeof password !== "string" || password.length === 0) {
    return "Please enter a new password.";
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `The password must be at least ${PASSWORD_MIN_LENGTH} characters long.`;
  }
  if (new TextEncoder().encode(password).length > PASSWORD_MAX_BYTES) {
    return `The password is too long. Use at most ${PASSWORD_MAX_BYTES} characters.`;
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return "The password must contain at least one letter and one number.";
  }
  const username = context.username?.trim().toLowerCase();
  if (username && username.length >= 3 && password.toLowerCase().includes(username)) {
    return "The password must not contain your username.";
  }
  return null;
}
