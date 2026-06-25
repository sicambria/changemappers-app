ALTER TABLE "SocialCause" ADD COLUMN "taxonomyKind" TEXT NOT NULL DEFAULT 'social-cause';
ALTER TABLE "SocialCause" ADD COLUMN "domainId" TEXT;
ALTER TABLE "SocialCause" ADD COLUMN "primaryRdgId" TEXT;
ALTER TABLE "SocialCause" ADD COLUMN "crossRdgIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
