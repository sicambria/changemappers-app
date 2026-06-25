ALTER TABLE "User" ADD COLUMN "isRegistrationPending" BOOLEAN NOT NULL DEFAULT false;

UPDATE "User"
SET "isRegistrationPending" = true
WHERE "name" = '_pending_' AND "passwordHash" IS NULL;

CREATE INDEX "User_isRegistrationPending_idx" ON "User"("isRegistrationPending");
