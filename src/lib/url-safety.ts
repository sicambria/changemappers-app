/**
 * Shared helpers to keep user-supplied URLs restricted to http(s),
 * blocking stored javascript:/data:/vbscript: scheme injection at both
 * the validation boundary and render sinks (AUDIT-20260613-006).
 */

export function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Returns the trimmed URL when it parses as http(s), otherwise undefined.
 * Use at <a href> sinks so legacy stored values can never inject a
 * javascript: scheme even if they predate input validation.
 */
export function safeExternalHref(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return isHttpUrl(trimmed) ? trimmed : undefined;
}
