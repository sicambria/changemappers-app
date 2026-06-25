/**
 * Shared server-action error predicates (AUDIT-20260612-014).
 *
 * Next.js signals dynamic-rendering bailouts by throwing an error whose
 * digest is DYNAMIC_SERVER_USAGE; swallowing it inside a catch block breaks
 * static/dynamic resolution. Every server-action catch must rethrow it.
 */
export function isDynamicServerUsageError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'digest' in error &&
    (error as { digest?: unknown }).digest === 'DYNAMIC_SERVER_USAGE'
  );
}

/** Rethrows Next.js dynamic-usage errors; returns the error otherwise. */
export function rethrowDynamicServerUsage(error: unknown): unknown {
  if (isDynamicServerUsageError(error)) {
    throw error;
  }
  return error;
}
