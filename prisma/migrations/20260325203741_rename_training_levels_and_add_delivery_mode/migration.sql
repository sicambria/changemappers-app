-- Rename TrainingLevel enum values
-- First, update any existing data to use new values
UPDATE "TrainingOffer" SET level = 'EXPLORER' WHERE level = 'BEGINNER';
UPDATE "TrainingOffer" SET level = 'PRACTITIONER' WHERE level = 'PARTIAL';
UPDATE "TrainingOffer" SET level = 'GUIDE' WHERE level = 'ADVANCED';

UPDATE "TrainingRequest" SET "levelPreference" = 'EXPLORER' WHERE "levelPreference" = 'BEGINNER';
UPDATE "TrainingRequest" SET "levelPreference" = 'PRACTITIONER' WHERE "levelPreference" = 'PARTIAL';
UPDATE "TrainingRequest" SET "levelPreference" = 'GUIDE' WHERE "levelPreference" = 'ADVANCED';

-- Alter the enum type
ALTER TYPE "TrainingLevel" RENAME TO "TrainingLevel_old";
CREATE TYPE "TrainingLevel" AS ENUM ('EXPLORER', 'PRACTITIONER', 'GUIDE');
ALTER TABLE "TrainingOffer" ALTER COLUMN level TYPE "TrainingLevel" USING level::text::"TrainingLevel";
ALTER TABLE "TrainingRequest" ALTER COLUMN "levelPreference" TYPE "TrainingLevel" USING "levelPreference"::text::"TrainingLevel";
DROP TYPE "TrainingLevel_old";

-- Create DeliveryMode enum
CREATE TYPE "DeliveryMode" AS ENUM ('ONLINE', 'IN_PERSON', 'HYBRID');

-- Add new columns to TrainingOffer
ALTER TABLE "TrainingOffer" ADD COLUMN "deliveryMode" "DeliveryMode" NOT NULL DEFAULT 'ONLINE';
ALTER TABLE "TrainingOffer" ADD COLUMN city TEXT;
ALTER TABLE "TrainingOffer" ADD COLUMN "cityLat" DOUBLE PRECISION;
ALTER TABLE "TrainingOffer" ADD COLUMN "cityLng" DOUBLE PRECISION;
ALTER TABLE "TrainingOffer" ADD COLUMN "professionalUrl" TEXT;

-- Add professionalUrl to MentorProfile
ALTER TABLE "MentorProfile" ADD COLUMN "professionalUrl" TEXT;
