/**
 * Pure login rejection-gate evaluators extracted from `loginAction`
 * (`src/app/actions/auth.ts`).
 *
 * `auth.ts` is a `'use server'` module and may only export async functions, so
 * these synchronous, side-effect-free predicates live here (mirrors the
 * `src/lib/lean-register/matching-readiness.ts` precedent). Each evaluator
 * returns the FIRST failing gate's translation KEY (resolved by `authT` in the
 * action) preserving the original short-circuit precedence exactly, or `null`
 * when every gate passes.
 *
 * Behaviour-preserving contract (do NOT change without re-pinning the corpus):
 *  - Pre-auth gates (no-passwordHash, pending, soft-deleted, locked) all return
 *    the SAME generic `server.errors.invalidCredentials` key — no enumeration
 *    oracle — and run BEFORE the password is verified.
 *  - Post-auth gates (suspended, unverified email) are deliberately separate and
 *    run only AFTER password verification (AUDIT-20260613-005 anti-enumeration);
 *    they must never be folded into the pre-auth gate.
 */

import { isPendingRegistrationAccount } from '@/lib/registration-completion';
import { isAccountLocked } from '@/lib/auth-lockout';

/** Translation keys returned by the login gates. */
export const LOGIN_GATE_KEYS = {
  invalidCredentials: 'server.errors.invalidCredentials',
  suspended: 'server.errors.suspended',
  verifyEmailFirst: 'server.errors.verifyEmailFirst',
} as const;

export type LoginGateKey = (typeof LOGIN_GATE_KEYS)[keyof typeof LOGIN_GATE_KEYS];

/** Fields the pre-auth gate inspects (a subset of the fetched user record). */
export interface PreAuthLoginUser {
  passwordHash?: string | null;
  isRegistrationPending?: boolean | null;
  name?: string | null;
  deletedAt?: Date | null;
  lockedUntil?: Date | null;
}

/** Fields the post-auth gate inspects. */
export interface PostAuthLoginUser {
  isSuspended?: boolean | null;
  isEmailVerified?: boolean | null;
}

/**
 * Pre-authentication rejection gate: evaluated before the password is verified.
 * Accepts a nullable user so the "no such account" path collapses into the same
 * generic credentials error (no user-existence oracle), exactly as the original
 * `!user?.passwordHash` check did.
 *
 * @returns the generic invalid-credentials key on rejection, else `null`.
 */
export function evaluatePreAuthLoginGate(
  user: PreAuthLoginUser | null | undefined,
  now: Date = new Date(),
): LoginGateKey | null {
  if (!user?.passwordHash) return LOGIN_GATE_KEYS.invalidCredentials;
  if (isPendingRegistrationAccount(user)) return LOGIN_GATE_KEYS.invalidCredentials;
  if (user.deletedAt) return LOGIN_GATE_KEYS.invalidCredentials;
  if (isAccountLocked(user.lockedUntil, now)) return LOGIN_GATE_KEYS.invalidCredentials;
  return null;
}

/**
 * Post-authentication rejection gate: evaluated only after the password is
 * verified, so the distinct suspended/unverified messages cannot be used as a
 * user-enumeration oracle (AUDIT-20260613-005).
 *
 * @returns the suspended or verify-email key on rejection, else `null`.
 */
export function evaluatePostAuthLoginGate(user: PostAuthLoginUser): LoginGateKey | null {
  if (user.isSuspended) return LOGIN_GATE_KEYS.suspended;
  if (!user.isEmailVerified) return LOGIN_GATE_KEYS.verifyEmailFirst;
  return null;
}
