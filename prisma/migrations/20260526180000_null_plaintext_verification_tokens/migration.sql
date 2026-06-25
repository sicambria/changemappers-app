-- Existing verificationToken values were stored as raw URL tokens before
-- 2026-05-26. They cannot be safely transformed because the raw value may
-- already have been exposed through DB/backup access, so expire them and let
-- resend/maintenance flows issue fresh hash-at-rest tokens.
UPDATE "User"
SET "verificationToken" = NULL, "verificationTokenExpiry" = NULL
WHERE "verificationToken" IS NOT NULL;