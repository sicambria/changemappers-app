/**
 * Account-level brute-force / credential-stuffing lockout (AUDIT-20260613-041).
 *
 * Complements — does not replace — the per-IP Upstash rate limiter. IP throttling
 * does not stop distributed credential stuffing (rotating IPs); an account-level
 * counter with exponential backoff does. The block state lives on the `User` row
 * (`failedLoginAttempts` / `lockedUntil`), so it is DB-backed and survives restarts.
 *
 * Pure functions only — no DB or clock side effects — so lockout policy is exhaustively
 * unit-testable. Callers pass `now` and persist the returned state.
 */

/** Failed attempts (inclusive) at which an account first locks. */
export const LOCKOUT_THRESHOLD = 5;
/** First lock duration; doubles per subsequent re-lock. */
export const LOCKOUT_BASE_MS = 60_000; // 1 minute
/** Upper bound on a single lock window. */
export const LOCKOUT_MAX_MS = 30 * 60_000; // 30 minutes

/**
 * Whether an account is currently locked.
 * Treats a missing or past `lockedUntil` as unlocked.
 */
export function isAccountLocked(
  lockedUntil: Date | null | undefined,
  now: Date = new Date(),
): boolean {
  return lockedUntil != null && lockedUntil.getTime() > now.getTime();
}

export interface FailedAttemptResult {
  /** New cumulative failed-attempt count to persist. */
  failedLoginAttempts: number;
  /** New lock expiry to persist (null when still below threshold). */
  lockedUntil: Date | null;
  /** True only on the attempt that transitions the account into a locked state. */
  justLocked: boolean;
}

/**
 * Computes the new lockout state after one failed password attempt.
 *
 * Below threshold: increment only. At/after threshold: lock with exponential backoff
 * on the overage past the threshold (1m, 2m, 4m, …) capped at {@link LOCKOUT_MAX_MS}.
 *
 * Callers only invoke this for accounts that were NOT already locked (locked accounts
 * are rejected before password verification), so `previousAttempts` reflects the count
 * carried across prior expired lock windows and escalation is monotonic.
 *
 * @param previousAttempts the account's `failedLoginAttempts` before this failure
 */
export function registerFailedAttempt(
  previousAttempts: number,
  now: Date = new Date(),
): FailedAttemptResult {
  const safePrevious = Number.isFinite(previousAttempts) ? previousAttempts : 0;
  const failedLoginAttempts = Math.max(0, safePrevious) + 1;

  if (failedLoginAttempts < LOCKOUT_THRESHOLD) {
    return { failedLoginAttempts, lockedUntil: null, justLocked: false };
  }

  const overage = failedLoginAttempts - LOCKOUT_THRESHOLD; // 0 on the first lock
  const durationMs = Math.min(LOCKOUT_BASE_MS * 2 ** overage, LOCKOUT_MAX_MS);
  return {
    failedLoginAttempts,
    lockedUntil: new Date(now.getTime() + durationMs),
    justLocked: true,
  };
}
