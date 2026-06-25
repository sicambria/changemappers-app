/**
 * Registration completion gate — the single source of truth for "is this user
 * route-ready, or must they be redirected back into the registration flow?"
 *
 * Extracted from src/proxy.ts so the contract is executable in isolation
 * (see src/__tests__/integration/route-readiness.integration.test.ts). The
 * proxy keeps only the NextResponse redirect plumbing; the decision lives here.
 *
 * Two-Gate model (docs/product/registration.md, AUDIT-20260611-001):
 * - The JOIN gate (lean Step 3 complete ⇒ lastStageCompleted >= 1 with a real
 *   profile) unlocks login, dashboard, and basic exploration.
 * - The MATCHING ACTIVATION gate (stage >= 6 + allowSensitiveMatching +
 *   specialCategoryConsentAt) unlocks matchability only. It is enforced by the
 *   matchable predicate on matching surfaces, NOT by the route boundary, so
 *   declining special-category consent never locks a user out of the app
 *   (GDPR Art. 7(4) — consent must be freely given).
 *
 * NOT a 'use server' file and free of next/server imports — importable by the
 * proxy, server code, and integration tests alike.
 */
import { isPendingRegistrationAccount } from '@/lib/registration-completion';

/**
 * Join gate: lean Step 3 ("identity and location") completion writes
 * lastStageCompleted = 1 and profileCompleteness = 15.
 */
export const JOIN_GATE_MIN_STAGE = 1;

export type RegistrationResumeTarget =
  | '/register?step=3'
  | '/register?step=4'
  | '/register?step=5'
  | '/register?step=6'
  | '/register?regmode=full';

export type MatchingActivationResumeTarget =
  | '/register?step=4'
  | '/register?step=5'
  | '/register?step=6';

export type RegistrationGatePayload = {
  userId?: string;
  isAdmin?: boolean;
  isRegistrationPending?: boolean;
} | null;

type RegistrationSignals = {
  lastStageCompleted: number;
  profileCompleteness: number | null;
  matchingActivationComplete: boolean;
  pending: boolean;
};

/**
 * Pure ROUTE decision: where (if anywhere) must the user be sent before they
 * may use protected routes? `null` means route-ready. Only the join gate is
 * enforced here — matching activation never blocks navigation.
 */
export function resumeTargetForUser(
  lastStageCompleted: number,
  profileCompleteness: number | null | undefined,
): RegistrationResumeTarget | null {
  if (lastStageCompleted >= JOIN_GATE_MIN_STAGE && (profileCompleteness ?? 0) > 10) return null;
  if ((profileCompleteness ?? 0) <= 10) return '/register?regmode=full';
  // Join gate not recorded but a real profile exists (legacy/imported
  // accounts): send them into activation rather than blocking.
  return '/register?step=4';
}

/**
 * Pure ACTIVATION decision: where should the registration wizard resume for a
 * user who has joined but not finished matching activation? `null` means
 * activation is complete. Used by /register and the dashboard banner — never
 * by the route boundary.
 */
export function matchingActivationResumeTarget(
  lastStageCompleted: number,
  matchingActivationComplete: boolean,
): MatchingActivationResumeTarget | null {
  // AUDIT-20260613-033: do NOT short-circuit on stage >= 7. Finishing orientation
  // sets lastStageCompleted = 7, but a user who later withdrew special-category
  // consent (allowSensitiveMatching -> false) has an *incomplete* activation and
  // must remain able to revisit the activation step — otherwise /register bounces
  // them to /dashboard with no re-grant path. Completion is decided solely by
  // `matchingActivationComplete` below; an orientation-complete user with
  // incomplete activation falls through to the step-6 resume target.
  if (lastStageCompleted >= 6 && matchingActivationComplete) return null;
  if (lastStageCompleted >= 3) return '/register?step=6';
  if (lastStageCompleted >= 2) return '/register?step=5';
  return '/register?step=4';
}

async function loadRegistrationSignals(userId: string): Promise<RegistrationSignals | null> {
  const { prisma } = await import('@/lib/prisma');
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      isRegistrationPending: true,
      name: true,
      passwordHash: true,
      profileCompleteness: true,
      allowSensitiveMatching: true,
      specialCategoryConsentAt: true,
      onboardingState: { select: { lastStageCompleted: true } },
    },
  });

  if (!user) return null;
  return {
    lastStageCompleted: user.onboardingState?.lastStageCompleted ?? 0,
    profileCompleteness: user.profileCompleteness,
    matchingActivationComplete:
      user.allowSensitiveMatching === true && user.specialCategoryConsentAt != null,
    pending: isPendingRegistrationAccount(user),
  };
}

/**
 * Loads the user's registration signals and resolves the ROUTE resume target.
 * Fails closed (back to Step 3) when the lookup throws, so a DB hiccup can
 * never silently grant access to protected routes.
 */
export async function getRegistrationGateResumeTarget(
  payload: RegistrationGatePayload,
): Promise<RegistrationResumeTarget | null> {
  if (!payload?.userId || payload.isAdmin === true) return null;
  if (payload.isRegistrationPending === true) return '/register?step=3';

  try {
    const signals = await loadRegistrationSignals(payload.userId);
    if (!signals) return null;
    if (signals.pending) return '/register?step=3';

    return resumeTargetForUser(signals.lastStageCompleted, signals.profileCompleteness);
  } catch (error) {
    console.error('[registration-gate] resume target failed closed:', error);
    return '/register?step=3';
  }
}

/**
 * Loads the user's registration signals and resolves the ACTIVATION resume
 * target. Fails open (`null`) — this target only positions the wizard or the
 * dashboard invitation; it must never lock anything.
 */
export async function getMatchingActivationResumeTarget(
  payload: RegistrationGatePayload,
): Promise<MatchingActivationResumeTarget | null> {
  if (!payload?.userId || payload.isAdmin === true) return null;
  if (payload.isRegistrationPending === true) return '/register?step=4';

  try {
    const signals = await loadRegistrationSignals(payload.userId);
    if (!signals) return null;
    if (signals.pending) return '/register?step=4';

    return matchingActivationResumeTarget(
      signals.lastStageCompleted,
      signals.matchingActivationComplete,
    );
  } catch (error) {
    console.error('[registration-gate] activation target failed open:', error);
    return null;
  }
}
