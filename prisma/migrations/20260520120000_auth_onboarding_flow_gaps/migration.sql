-- Consent evidence, age confirmation, and reset-token claim tracking for auth/onboarding audit closure.
ALTER TABLE "User" ADD COLUMN "termsVersion" TEXT;
ALTER TABLE "User" ADD COLUMN "privacyVersion" TEXT;
ALTER TABLE "User" ADD COLUMN "confirmedAge16Plus" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "confirmedAge16PlusAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "resetTokenClaimedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "errorTelemetryOptOut" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "UserOnboardingState" ADD COLUMN "agreementsVersion" TEXT;
