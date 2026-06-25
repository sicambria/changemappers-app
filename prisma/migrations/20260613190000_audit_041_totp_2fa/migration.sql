-- AUDIT-20260613-041 #9: optional TOTP two-factor authentication.
-- Additive only (new nullable/defaulted columns + new table + new enum values); non-destructive.

ALTER TABLE "User"
  ADD COLUMN "isTotpEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "totpSecretEncrypted" TEXT,
  ADD COLUMN "totpEnrolledAt" TIMESTAMP(3),
  ADD COLUMN "totpLastUsedStep" BIGINT;

-- One-time backup/recovery codes (SHA-256 hashed; consumed atomically).
CREATE TABLE "TwoFactorBackupCode" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "codeHash" TEXT NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TwoFactorBackupCode_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TwoFactorBackupCode_userId_codeHash_key" ON "TwoFactorBackupCode"("userId", "codeHash");
CREATE INDEX "TwoFactorBackupCode_userId_usedAt_idx" ON "TwoFactorBackupCode"("userId", "usedAt");

ALTER TABLE "TwoFactorBackupCode"
  ADD CONSTRAINT "TwoFactorBackupCode_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- New audit actions for the 2FA lifecycle security events.
ALTER TYPE "AuditAction" ADD VALUE 'TWO_FACTOR_ENABLED';
ALTER TYPE "AuditAction" ADD VALUE 'TWO_FACTOR_DISABLED';
ALTER TYPE "AuditAction" ADD VALUE 'TWO_FACTOR_VERIFIED';
ALTER TYPE "AuditAction" ADD VALUE 'TWO_FACTOR_FAILED';
ALTER TYPE "AuditAction" ADD VALUE 'TWO_FACTOR_BACKUP_CODE_USED';
