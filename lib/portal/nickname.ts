export const NICKNAME_REGEX = /^[A-Za-z0-9_-]{3,32}$/;

export const normalizeNickname = (value: unknown) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

export const isValidNickname = (value: unknown) =>
  NICKNAME_REGEX.test(normalizeNickname(value));

export const NICKNAME_HELP =
  "Use 3–32 letters, numbers, hyphens, or underscores. No spaces; nicknames are saved lowercase.";
