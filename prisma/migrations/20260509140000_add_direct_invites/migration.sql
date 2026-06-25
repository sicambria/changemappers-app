ALTER TABLE "Invite" ADD COLUMN "isDirect" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Invite" ADD COLUMN "profileType" "ProfileType";
ALTER TABLE "Invite" ADD COLUMN "emailSubject" TEXT;

CREATE INDEX "Invite_isDirect_idx" ON "Invite"("isDirect");
