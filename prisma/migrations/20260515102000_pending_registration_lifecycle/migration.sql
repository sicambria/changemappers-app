-- Add lifecycle marker for abandoned lean registrations.
ALTER TABLE "User" ADD COLUMN "pendingRegistrationReminderSentAt" TIMESTAMP(3);

CREATE INDEX "User_name_passwordHash_createdAt_idx" ON "User"("name", "passwordHash", "createdAt");
CREATE INDEX "User_pendingRegistrationReminderSentAt_idx" ON "User"("pendingRegistrationReminderSentAt");
