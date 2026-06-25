/**
 * Structured error logging for Server Actions (AUDIT-20260612-007).
 *
 * Server-only module: routes action errors through the Pino logger so they
 * carry structured fields (action name, error message, stack) instead of
 * disappearing into raw `console.error` output. Raw console usage in
 * `src/app/actions/` is forbidden by an ESLint `no-console` rule.
 *
 * Usage:
 *
 *   try {
 *     ...
 *   } catch (error) {
 *     logActionError('createThing', error, { userId });
 *     return { success: false, error: 'Something went wrong.' };
 *   }
 *
 * For a full try/catch boundary that also produces the typed failure
 * response, prefer `runAction` from `@/lib/server-action-wrapper`.
 */
import { logger } from '@/lib/logger';

export function logActionError(
  actionName: string,
  error: unknown,
  context?: Record<string, unknown>,
): void {
  const err = error instanceof Error ? error : undefined;
  logger.error({
    msg: 'Server action error',
    action: actionName,
    error: err ? `${err.name}: ${err.message}` : String(error),
    ...(err?.stack ? { stack: err.stack } : {}),
    ...context,
  });
}
