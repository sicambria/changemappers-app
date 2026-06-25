/**
 * GET /api/register/full/verify?token=xxx
 * Shows a scanner-safe confirmation screen for full registration email tokens.
 * POST /api/register/full/verify confirms user intent, marks the email verified when
 * needed, keeps the continuation token reusable, sets the HttpOnly full_reg_uid
 * cookie, and redirects to the full-registration continuation route.
 *
 * Handler logic is shared with /api/register/verify via
 * `createRegisterVerifyHandlers`; only the full-mode config lives here.
 */

import { NextRequest } from 'next/server';
import { PendingRegistrationMode } from '@/lib/prisma';
import { signFullRegCookie } from '@/lib/lean-reg-token';
import { createRegisterVerifyHandlers } from '@/lib/registration-verify-handler';

const FULL_REG_CONTINUATION_COOKIE_MAX_AGE_SECONDS = 60 * 60;

const handlers = createRegisterVerifyHandlers({
  mode: PendingRegistrationMode.FULL,
  errorRedirectPrefix: '/register?regmode=full&error=',
  confirmFormActionPath: '/api/register/full/verify',
  confirmMode: 'full',
  confirmBackHref: '/register?regmode=full',
  rateLimitKeyPrefix: 'verify_full_email_',
  successRedirectPath: '/register?regmode=full',
  cookieName: 'full_reg_uid',
  signCookie: signFullRegCookie,
  cookieMaxAgeSeconds: FULL_REG_CONTINUATION_COOKIE_MAX_AGE_SECONDS,
  logLabel: 'Full',
});

// Explicit function declarations (not `export const GET = handlers.GET`) so
// Next's static route-handler analysis recognizes them like every other route.
export async function GET(request: NextRequest) {
  return handlers.GET(request);
}

export async function POST(request: NextRequest) {
  return handlers.POST(request);
}
