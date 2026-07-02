/**
 * Generates a URL-safe slug from a display name, appended with a random
 * suffix to avoid collisions between users with the same/similar name.
 */
export function generateProfileSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}

/** Sanitizes user-provided slug input (dashboard "edit profile" form). */
export function sanitizeSlug(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9-]/g, "");
}

/** Safely extracts the hostname from a link URL, or "" if invalid. */
export function getHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}
