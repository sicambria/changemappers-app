-- Add reflection reminder opt-out and cooldown tracking to User
ALTER TABLE "User"
  ADD COLUMN "reflectionReminderOptOut" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "lastReflectionReminderAt" TIMESTAMP(3);

-- Add REFLECTION_RITUAL_PROMPT to NotificationType enum
ALTER TYPE "NotificationType" ADD VALUE 'REFLECTION_RITUAL_PROMPT';
