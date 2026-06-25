ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "allowSensitiveMatching" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "specialCategoryConsentAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "specialCategoryConsentVersion" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "specialCategoryConsentSource" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "specialCategoryConsentWithdrawnAt" TIMESTAMP(3);
