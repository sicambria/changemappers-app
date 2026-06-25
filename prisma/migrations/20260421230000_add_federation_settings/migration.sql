ALTER TABLE "User"
ADD COLUMN "federationSettings" JSONB,
ADD COLUMN "federationConsentAt" TIMESTAMP(3);
