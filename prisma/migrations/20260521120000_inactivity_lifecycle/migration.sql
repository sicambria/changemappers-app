-- CreateEnum
CREATE TYPE "AccountDeletionReason" AS ENUM ('USER_REQUESTED', 'INACTIVITY');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "scheduledDeletionReason" "AccountDeletionReason",
ADD COLUMN "lastLoginAt" TIMESTAMP(3),
ADD COLUMN "inactiveAt" TIMESTAMP(3),
ADD COLUMN "inactivityWarning30SentAt" TIMESTAMP(3),
ADD COLUMN "inactivityWarning15SentAt" TIMESTAMP(3),
ADD COLUMN "inactivityWarning3SentAt" TIMESTAMP(3),
ADD COLUMN "inactivityFinalNoticeSentAt" TIMESTAMP(3);

-- Indexes
CREATE INDEX "User_lastActiveAt_idx" ON "User"("lastActiveAt");
CREATE INDEX "User_inactiveAt_idx" ON "User"("inactiveAt");
CREATE INDEX "User_scheduledDeletionAt_idx" ON "User"("scheduledDeletionAt");
