-- AlterTable
ALTER TABLE "User" ALTER COLUMN "uiLanguage" SET DEFAULT 'en';

-- Migrate existing users' language preferences from 'hu' to 'en'
UPDATE "User" SET "uiLanguage" = 'en' WHERE "uiLanguage" = 'hu';
