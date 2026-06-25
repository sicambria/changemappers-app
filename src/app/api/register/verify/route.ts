/**
 * GET /api/register/verify?token=xxx
 * Shows a scanner-safe confirmation screen for lean registration email tokens.
 * POST /api/register/verify confirms user intent, marks the email verified when
 * needed, keeps the continuation token reusable, sets the HttpOnly lean_reg_uid
 * cookie, and redirects to the cookie-check continuation route.
 *
 * Handler logic is shared with /api/register/full/verify via
 * `createRegisterVerifyHandlers`; only the lean-mode config lives here.
 */

import { NextRequest } from 'next/server';
import { PendingRegistrationMode } from '@/lib/prisma';
import { LEAN_REG_CONTINUATION_COOKIE_MAX_AGE_SECONDS, signLeanRegCookie } from '@/lib/lean-reg-token';
import { createRegisterVerifyHandlers } from '@/lib/registration-verify-handler';

const handlers = createRegisterVerifyHandlers({
  mode: PendingRegistrationMode.LEAN,
  errorRedirectPrefix: '/register?error=',
  confirmFormActionPath: '/api/register/verify',
  confirmMode: 'lean',
  confirmBackHref: '/register',
  rateLimitKeyPrefix: 'verify_email_',
  successRedirectPath: '/api/register/continue',
  cookieName: 'lean_reg_uid',
  signCookie: signLeanRegCookie,
  cookieMaxAgeSeconds: LEAN_REG_CONTINUATION_COOKIE_MAX_AGE_SECONDS,
  logLabel: 'Lean',
});

// Explicit function declarations (not `export const GET = handlers.GET`) so
// Next's static route-handler analysis recognizes them like every other route.
export async function GET(request: NextRequest) {
  return handlers.GET(request);
}

export async function POST(request: NextRequest) {
  return handlers.POST(request);
}
