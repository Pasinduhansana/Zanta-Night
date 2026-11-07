/**
 * Server-side input sanitization shared by booking and admin inputs.
 * React escapes output on render — these helpers keep stored data clean too.
 */

/** Remove HTML/XML tags and control characters, then trim. */
export function stripTags(value: string): string {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim();
}
