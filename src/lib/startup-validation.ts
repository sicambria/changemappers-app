/**
 * Production Startup Validation
 *
 * Runs security checks when the Next.js server starts in production mode.
 * Catches misconfigurations that could lead to security vulnerabilities.
 */

import { validateHighRiskContentEncryptionConfig } from '@/lib/high-risk-content-crypto';
import { validateTotpEncryptionConfig } from '@/lib/totp-crypto';
import { isLocalAppUrl } from '@/lib/auth-cookie-policy';

/**
 * Canonical list of the cryptographic/auth SECRET env vars this module hard-requires
 * in production (each gates `runProductionValidations` below and `process.exit(1)`s if
 * missing/placeholder). It is the single source of truth that the required-secrets
 * manifest is checked against: `required-secrets-manifest.test.ts` asserts every name
 * here is registered in `config/required-secrets.manifest.json`, which in turn forces
 * the secret into ALL deploy artifacts (deploy-vps.ps1, generate-vps-env.mjs,
 * docker-compose, CI). So adding a secret here that you forget to register fails CI.
 *
 * Scope = generated secrets only. Non-secret config gates (NEXT_PUBLIC_APP_URL,
 * TRUST_PROXY_HEADERS, SOCKET_CORS_ORIGIN, DATABASE_URL, ...) are validated below but
 * are not part of the secret manifest.
 *
 * ADDING A NEW PRODUCTION SECRET? Add it here AND to config/required-secrets.manifest.json
 * (with every consumer artifact updated) — the manifest test will tell you exactly which
 * artifact drifted.
 */
export const PRODUCTION_REQUIRED_SECRET_ENV = [
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'LEAN_REG_SIGNING_SECRET',
  'HIGH_RISK_CONTENT_ENCRYPTION_KEY',
  'TOTP_ENCRYPTION_KEY',
  'VIDEO_ROOM_HMAC_SECRET',
  'CRON_SECRET',
] as const;

interface ValidationResult {
  passed: boolean;
  check: string;
  message?: string;
}

type EmailProviderType = 'local' | 'resend' | 'brevo' | 'mailgun' | 'smtp';
type RateLimitProviderType = 'upstash' | 'memory';

function isCiE2EEnvironment(): boolean {
  return (process.env.CI_E2E === '1' || process.env.PLAYWRIGHT_TEST === '1') && isLocalAppUrl(process.env.NEXT_PUBLIC_APP_URL); // SAFE: startup validation checks public app URL host only.
}

function isTruthyEnv(value: string | undefined): boolean {
  return value === '1' || value === 'true' || (typeof value === 'string' && value.trim() === '1');
}

function isBypassEnabled(): boolean {
  return isTruthyEnv(process.env.SKIP_PROD_CHECKS);
}

function isPlaceholderSecret(value: string | undefined): boolean {
  if (!value) return false;
  const lower = value.toLowerCase();
  return lower.startsWith('replace-with') ||
    lower.startsWith('changeme') ||
    lower.startsWith('change-me') ||
    lower.includes('placeholder') ||
    lower === 'your-secret-here';
}

function databaseUrlRequiresSsl(databaseUrl: string): boolean {
  try {
    const parsed = new URL(databaseUrl);
    const sslMode = parsed.searchParams.get('sslmode')?.toLowerCase();
    const ssl = parsed.searchParams.get('ssl')?.toLowerCase();

    return (
      sslMode === 'require' ||
      sslMode === 'verify-ca' ||
      sslMode === 'verify-full' ||
      ssl === 'true' ||
      ssl === '1'
    );
  } catch {
    return false;
  }
}

function isTrustedSelfHostedComposeDatabaseUrl(databaseUrl: string): boolean {
  if (!isTruthyEnv(process.env.DATABASE_SSL_TRUSTED_INTERNAL)) {
    return false;
  }

  try {
    const parsed = new URL(databaseUrl);
    return parsed.hostname === 'db' && parsed.protocol.startsWith('postgres');
  } catch {
    return false;
  }
}

function databaseUrlPassesProductionPolicy(databaseUrl: string): boolean {
  return databaseUrlRequiresSsl(databaseUrl) || isTrustedSelfHostedComposeDatabaseUrl(databaseUrl);
}

function parseEmailProvider(value: string): EmailProviderType | null {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'local' || normalized === 'resend' || normalized === 'brevo' || normalized === 'mailgun' || normalized === 'smtp') {
    return normalized;
  }
  return null;
}

function getConfiguredEmailProvider(): EmailProviderType | null {
  const provider = process.env.EMAIL_PROVIDER || (process.env.NODE_ENV === 'production' ? 'smtp' : 'local');
  return parseEmailProvider(provider);
}

function getConfiguredAppInstanceCount(): number | null {
  const raw = process.env.APP_INSTANCE_COUNT || '1';
  if (!/^\d+$/.test(raw)) {
    return null;
  }
  const value = Number(raw);
  return Number.isSafeInteger(value) && value >= 1 ? value : null;
}

function getConfiguredRateLimitProvider(): RateLimitProviderType | null {
  const provider = process.env.RATE_LIMIT_PROVIDER || 'upstash';
  const normalized = provider.trim().toLowerCase();
  if (normalized === 'upstash' || normalized === 'memory') {
    return normalized;
  }
  return null;
}

function validate(
  validations: ValidationResult[],
  check: string,
  condition: boolean,
  message?: string
): void {
  validations.push({ passed: condition, check, message });
}


function isSecretSetAndStrong(value: string | undefined, devDefault: string): boolean {
  return !!value && value !== devDefault;
}

function secretHasMinLength(value: string | undefined, minLength: number): boolean {
  return typeof value === 'string' && value.length >= minLength;
}

function validateJwtSecrets(validations: ValidationResult[]): void {
  validate(validations, 'JWT_SECRET is set', isSecretSetAndStrong(process.env.JWT_SECRET, 'development-secret-change-in-production'), 'JWT_SECRET must be set to a strong secret in production');
  validate(validations, 'JWT_SECRET has at least 32 characters', secretHasMinLength(process.env.JWT_SECRET, 32), 'JWT_SECRET must be at least 32 characters for HS256 in production');
  validate(validations, 'JWT_SECRET is not a placeholder value', !isPlaceholderSecret(process.env.JWT_SECRET), 'JWT_SECRET must be replaced with a real random secret (current value appears to be a placeholder)');
  validate(validations, 'JWT_REFRESH_SECRET is set', isSecretSetAndStrong(process.env.JWT_REFRESH_SECRET, 'development-refresh-secret-change-in-production'), 'JWT_REFRESH_SECRET must be set to a strong secret in production');
  validate(validations, 'JWT_REFRESH_SECRET has at least 32 characters', secretHasMinLength(process.env.JWT_REFRESH_SECRET, 32), 'JWT_REFRESH_SECRET must be at least 32 characters for HS256 in production');
  validate(validations, 'JWT_REFRESH_SECRET is not a placeholder value', !isPlaceholderSecret(process.env.JWT_REFRESH_SECRET), 'JWT_REFRESH_SECRET must be replaced with a real random secret (current value appears to be a placeholder)');
}

function validateLeanRegSecret(validations: ValidationResult[]): void {
  validate(validations, 'LEAN_REG_SIGNING_SECRET is set', !!process.env.LEAN_REG_SIGNING_SECRET, 'LEAN_REG_SIGNING_SECRET must be set so lean registration verification can issue continuation cookies');
  validate(validations, 'LEAN_REG_SIGNING_SECRET is not a placeholder value', !isPlaceholderSecret(process.env.LEAN_REG_SIGNING_SECRET), 'LEAN_REG_SIGNING_SECRET must be replaced with a real random secret (current value appears to be a placeholder)');
  // Length floor (manifest minLength: 32). Presence + placeholder checks alone let a
  // 1-char value boot; match the cryptographic strength the manifest declares (AUDIT-046).
  validate(validations, 'LEAN_REG_SIGNING_SECRET has at least 32 characters', secretHasMinLength(process.env.LEAN_REG_SIGNING_SECRET, 32), 'LEAN_REG_SIGNING_SECRET must be at least 32 characters');
}

function validateVideoRoomSecret(validations: ValidationResult[]): void {
  validate(validations, 'Video room HMAC secret is configured', !!process.env.VIDEO_ROOM_HMAC_SECRET, 'VIDEO_ROOM_HMAC_SECRET must be set to its own random secret (do not reuse JWT_SECRET) so video room names are not derivable from the JWT signing key');
  // The message above promises "do not reuse JWT_SECRET" but presence alone never
  // enforced it; add the distinctness, length floor (manifest minLength: 32), and the
  // placeholder check the other secrets already get (AUDIT-046).
  validate(validations, 'Video room HMAC secret is distinct from JWT_SECRET', !!process.env.VIDEO_ROOM_HMAC_SECRET && process.env.VIDEO_ROOM_HMAC_SECRET !== process.env.JWT_SECRET, 'VIDEO_ROOM_HMAC_SECRET must be its own secret, not a copy of JWT_SECRET, so room names are not derivable from the JWT signing key');
  validate(validations, 'Video room HMAC secret has at least 32 characters', secretHasMinLength(process.env.VIDEO_ROOM_HMAC_SECRET, 32), 'VIDEO_ROOM_HMAC_SECRET must be at least 32 characters');
  validate(validations, 'Video room HMAC secret is not a placeholder value', !isPlaceholderSecret(process.env.VIDEO_ROOM_HMAC_SECRET), 'VIDEO_ROOM_HMAC_SECRET must be replaced with a real random secret (current value appears to be a placeholder)');
}

function validateCronSecret(validations: ValidationResult[]): void {
  validate(validations, 'CRON_SECRET is set', !!process.env.CRON_SECRET, 'CRON_SECRET must be set to a secure random string (e.g. openssl rand -hex 32)');
  validate(validations, 'CRON_SECRET is not a placeholder value', !isPlaceholderSecret(process.env.CRON_SECRET), 'CRON_SECRET must be replaced with a real random secret (current value appears to be a placeholder)');
  // Length floor (manifest minLength: 16) so a trivially-short cron secret can't boot (AUDIT-046).
  validate(validations, 'CRON_SECRET has at least 16 characters', secretHasMinLength(process.env.CRON_SECRET, 16), 'CRON_SECRET must be at least 16 characters');
}

function warnAboutOptionalConfig(): void {
  if (!(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN)) { // SAFE: startup validation checks public Sentry DSN presence only.
    console.warn('SENTRY_DSN is not set. Production errors will not be reported to Sentry.');
  }
  // Soft warn (non-blocking): admin/security notification emails are silently dropped
  // by sendAdminNotification when unset, so security events and deploy problems go
  // unseen. Surface it loudly rather than failing the boot (AUDIT-046).
  if (!process.env.ADMIN_NOTIFICATION_EMAILS) {
    console.warn('ADMIN_NOTIFICATION_EMAILS is not set. Admin/security notification emails will be silently skipped.');
  }
}

function validateRateLimiting(validations: ValidationResult[], isCiE2E: boolean): void {
  const rateLimitProvider = getConfiguredRateLimitProvider();
  validate(validations, 'Rate-limit provider configuration is valid', rateLimitProvider !== null, 'RATE_LIMIT_PROVIDER must be upstash or memory');
  const upstashConfigured = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;
  validate(validations, 'Shared production rate limiting is configured', isCiE2E || rateLimitProvider === 'memory' || upstashConfigured, 'UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set unless RATE_LIMIT_PROVIDER=memory is an explicit single-node deployment choice');
  const rateLimitHmacSet = !!(process.env.RATE_LIMIT_HASH_SECRET || process.env.AUTH_SECRET || process.env.JWT_SECRET);
  validate(validations, 'Rate-limit HMAC secret is configured', rateLimitHmacSet, 'RATE_LIMIT_HASH_SECRET (or AUTH_SECRET/JWT_SECRET) must be set so rate-limit identifiers are pseudonymized with a non-predictable key');
}

function reportValidationFailures(failures: ValidationResult[]): void {
  console.error('\nProduction security validation FAILED:\n');
  for (const failure of failures) {
    console.error(`  x ${failure.check}`);
    if (failure.message) {
      console.error(`    ${failure.message}`);
    }
  }
  console.error('\nServer startup aborted due to security misconfiguration.\n');
}

function validateEmailProviderConfiguration(validations: ValidationResult[], isCiE2E: boolean): void {
  const configuredProvider = getConfiguredEmailProvider();
  const providerConfig = process.env.EMAIL_PROVIDER || 'default provider';

  validate(
    validations,
    'Email provider configuration is valid',
    configuredProvider !== null,
    `EMAIL_PROVIDER contains an unsupported provider: ${providerConfig}`
  );

  if (!isCiE2E) {
    validate(
      validations,
      'EMAIL_PROVIDER is production-ready',
      configuredProvider !== null && configuredProvider !== 'local',
      'EMAIL_PROVIDER=local is only for development/test; use smtp in this VPS deployment'
    );
  }

  if (configuredProvider === 'resend') {
    validate(
      validations,
      'RESEND_API_KEY is set',
      !!process.env.RESEND_API_KEY,
      'RESEND_API_KEY must be set when EMAIL_PROVIDER=resend'
    );
  }

  if (configuredProvider === 'brevo') {
    validate(
      validations,
      'BREVO_API_KEY is set',
      !!process.env.BREVO_API_KEY,
      'BREVO_API_KEY must be set when EMAIL_PROVIDER=brevo'
    );

    if (process.env.NODE_ENV === 'production' && !isCiE2E) {
      const fromEmail = process.env.EMAIL_FROM_EMAIL || process.env.RESEND_FROM_EMAIL || '';
      const verifiedSender = process.env.BREVO_VERIFIED_SENDER_EMAIL || '';

      validate(
        validations,
        'BREVO_VERIFIED_SENDER_EMAIL is set',
        !!verifiedSender,
        'BREVO_VERIFIED_SENDER_EMAIL must be set to the active Brevo sender used by EMAIL_FROM_EMAIL'
      );

      validate(
        validations,
        'Brevo sender matches verified sender contract',
        !!verifiedSender && fromEmail.trim().toLowerCase() === verifiedSender.trim().toLowerCase(),
        'EMAIL_FROM_EMAIL must match BREVO_VERIFIED_SENDER_EMAIL until the sender/domain is validated in Brevo'
      );
    }
  }

  if (configuredProvider === 'mailgun') {
    validate(
      validations,
      'MAILGUN_API_KEY is set',
      !!process.env.MAILGUN_API_KEY,
      'MAILGUN_API_KEY must be set when EMAIL_PROVIDER=mailgun'
    );
    validate(
      validations,
      'MAILGUN_DOMAIN is set',
      !!process.env.MAILGUN_DOMAIN,
      'MAILGUN_DOMAIN must be set when EMAIL_PROVIDER=mailgun'
    );
  }

  if (configuredProvider === 'smtp') {
    validate(
      validations,
      'SMTP_HOST is set',
      !!process.env.SMTP_HOST,
      'SMTP_HOST must be set when EMAIL_PROVIDER=smtp'
    );
    validate(
      validations,
      'SMTP_PORT is set',
      !!process.env.SMTP_PORT,
      'SMTP_PORT must be set when EMAIL_PROVIDER=smtp'
    );
  }

  if (configuredProvider !== null && configuredProvider !== 'local' && process.env.NODE_ENV === 'production') {
    validate(
      validations,
      'EMAIL_FROM_EMAIL is set',
      !!process.env.EMAIL_FROM_EMAIL || !!process.env.RESEND_FROM_EMAIL,
      'EMAIL_FROM_EMAIL (or RESEND_FROM_EMAIL) should be set for production email'
    );
  }
}

function runProductionValidations(): void {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  const validations: ValidationResult[] = [];
  const isCiE2E = isCiE2EEnvironment();
  const isBypass = isBypassEnabled();
  if (isBypass && !process.env.CI) {
    console.error('Production security validations cannot be bypassed outside CI.');
    process.exit(1);
  }

  if (isBypass) {
    console.warn('WARNING: Production security validations are BYPASSED via SKIP_PROD_CHECKS in CI only.');
    return;
  }

  console.log('Running production security validations...');

  validateJwtSecrets(validations);

  validate(validations, 'DATABASE_URL is set', !!process.env.DATABASE_URL, 'DATABASE_URL must be set in production');
  validate(validations, 'NEXT_PUBLIC_APP_URL is set', !!process.env.NEXT_PUBLIC_APP_URL, 'NEXT_PUBLIC_APP_URL should be set for proper OAuth redirects'); // SAFE: startup validation verifies public app URL config on the server.

  validateEmailProviderConfiguration(validations, isCiE2E);
  validateLeanRegSecret(validations);

  const highRiskContentEncryptionError = validateHighRiskContentEncryptionConfig();
  validate(validations, 'High-risk content encryption key is configured', highRiskContentEncryptionError === null, highRiskContentEncryptionError ?? undefined);
  validate(validations, 'High-risk content encryption key is not a placeholder value', !isPlaceholderSecret(process.env.HIGH_RISK_CONTENT_ENCRYPTION_KEY), 'HIGH_RISK_CONTENT_ENCRYPTION_KEY must be replaced with a real random secret (current value appears to be a placeholder)');

  // TOTP 2FA secret encryption (AUDIT-20260613-041 #9). The TOTP crypto helper fails
  // closed, so a missing key disables 2FA rather than storing secrets in plaintext.
  const totpEncryptionError = validateTotpEncryptionConfig();
  validate(validations, 'TOTP encryption key is configured', totpEncryptionError === null, totpEncryptionError ?? undefined);
  validate(validations, 'TOTP encryption key is not a placeholder value', !isPlaceholderSecret(process.env.TOTP_ENCRYPTION_KEY), 'TOTP_ENCRYPTION_KEY must be replaced with a real random secret (current value appears to be a placeholder)');

  validateRateLimiting(validations, isCiE2E);

  validateVideoRoomSecret(validations);

  validate(validations, 'Forwarded IP headers are explicitly trusted', isCiE2E || process.env.TRUST_PROXY_HEADERS === '1', 'TRUST_PROXY_HEADERS=1 must be set only when the edge proxy strips untrusted X-Forwarded-For/X-Real-IP input before forwarding to the app');

  const appInstanceCount = getConfiguredAppInstanceCount();
  validate(validations, 'APP_INSTANCE_COUNT is a positive integer', appInstanceCount !== null, 'APP_INSTANCE_COUNT must be a positive integer; use 1 until distributed access-token denial and socket scaling are implemented');
  validate(validations, 'Single app instance boundary is declared', isCiE2E || appInstanceCount === 1, 'APP_INSTANCE_COUNT greater than 1 is blocked until access-token denial, socket auth, and realtime rate limiting are distributed');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''; // SAFE: startup validation verifies public app URL config on the server.
  if (!isCiE2E) {
    validate(validations, 'NEXT_PUBLIC_APP_URL is not localhost', !appUrl.includes('localhost') && !appUrl.includes('127.0.0.1'), 'NEXT_PUBLIC_APP_URL should not point to localhost in production');
  }

  validateCronSecret(validations);

  validate(validations, 'SOCKET_CORS_ORIGIN is set', !!process.env.SOCKET_CORS_ORIGIN, 'SOCKET_CORS_ORIGIN must be set to prevent WebSocket cross-origin issues in production');

  warnAboutOptionalConfig();

  const dbUrl = process.env.DATABASE_URL || '';
  if (!isCiE2E) {
    validate(
      validations,
      'Database connection uses SSL or trusted internal Compose network',
      databaseUrlPassesProductionPolicy(dbUrl),
      'DATABASE_URL should use SSL unless DATABASE_SSL_TRUSTED_INTERNAL=1 is set for the Compose internal db host'
    );
  }

  const failures = validations.filter((v) => !v.passed);
  if (failures.length > 0) {
    reportValidationFailures(failures);
    process.exit(1);
  }

  console.log('All production security validations passed.\n');
}

export {
  runProductionValidations,
  databaseUrlRequiresSsl,
  databaseUrlPassesProductionPolicy,
  isTrustedSelfHostedComposeDatabaseUrl,
  getConfiguredEmailProvider,
  getConfiguredRateLimitProvider,
  getConfiguredAppInstanceCount,
};

runProductionValidations();
