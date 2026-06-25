/**
 * Route-readiness contract — the single source of truth for "what makes a user route-ready".
 *
 * Consumed by:
 *   - e2e/fixtures/user.ts  (Prisma factory)
 *   - e2e/fixtures/auth.ts  (raw-SQL auth-flow fixture)
 *   - src/__tests__/integration/db-setup.ts  (integration-test factory)
 *
 * Editing this file is the ONE place a new consent gate or required column needs to be wired in.
 * It is intentionally free of any I/O so prisma/seed.ts and Node scripts can import it without
 * pulling in @playwright/test or any test runtime.
 *
 * See: docs/testing/remediation-plan.md Step 8
 */
import { LEGAL_VERSIONS } from '../legal-versions';

export const ROUTE_READY = {
  profileType: 'CHANGEMAPPER',
  verificationLevel: 'SELF_DECLARED',
  isEmailVerified: true,
  isRegistrationPending: false,
  allowSensitiveMatching: true,
  specialCategoryConsentVersion: LEGAL_VERSIONS.privacy,
  onboardingLastStageCompleted: 6,
  // Two-Gate join gate (AUDIT-20260611-001, src/lib/registration-gate.ts
  // resumeTargetForUser) treats a user as route-ready only when
  // profileCompleteness > 10. Without this, every route-ready fixture loops
  // /dashboard -> /register?regmode=full and protected-route specs hang.
  // 85 == the app's orientation-complete value (src/app/actions/onboarding.ts).
  // RCA: docs/errors/2026-06/20260613-e2e-seed-route-ready-redirect-loop.md
  profileCompleteness: 85,
  availabilityMode: 'DELIVERING',
} as const;
