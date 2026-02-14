export const HANDLE_MIN = 3; // includes '@'
export const HANDLE_MAX = 20; // includes '@'

// Reserved words are compared against the slug (no leading '@').
export const RESERVED_HANDLES = new Set([
  "admin",
  "settings",
  "login",
  "logout",
  "me",
  "u",
  "posts",
  "reviews",
  "api",
  "auth",
  "profile",
  "tags",
  "strains",
]);

export function normalizeHandle(raw: string) {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return "";
  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
}

export function handleSlug(handle: string) {
  return handle.replace(/^@/, "");
}

export function normalizeTagName(raw: string) {
  return raw.trim().toLowerCase();
}
