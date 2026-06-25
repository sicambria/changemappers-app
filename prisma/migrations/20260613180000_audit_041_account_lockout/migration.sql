-- AUDIT-20260613-041: account-level brute-force lockout + audit event.
-- Additive only (new columns with safe defaults + new enum value); non-destructive.

ALTER TABLE "User"
  ADD COLUMN "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "lockedUntil" TIMESTAMP(3);

-- New audit action for the lock-transition security event.
ALTER TYPE "AuditAction" ADD VALUE 'ACCOUNT_LOCKED';
