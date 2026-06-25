-- CreateEnum
CREATE TYPE "PendingRegistrationMode" AS ENUM ('LEAN', 'FULL');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "pendingRegistrationMode" "PendingRegistrationMode";
UPDATE "User" SET "pendingRegistrationMode" = 'LEAN' WHERE "isRegistrationPending" = true;
CREATE INDEX "User_pendingRegistrationMode_idx" ON "User"("pendingRegistrationMode");
