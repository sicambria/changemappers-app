-- Add GDPR/privacy-control User columns that exist in schema.prisma but were
-- missing from historical migrations. IF NOT EXISTS keeps this migration safe
-- for databases that were previously synchronized with prisma db push.
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "processingRestricted" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "declineAlgorithmicMatching" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "scheduledDeletionAt" TIMESTAMP(3);