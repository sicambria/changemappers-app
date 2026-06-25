ALTER TABLE "User" ADD COLUMN "charterAcceptedAt" TIMESTAMP(3), ADD COLUMN "charterVersion" TEXT, ADD COLUMN "cmapReviewMonth" INTEGER, ADD COLUMN "cmapManualReviewAt" TIMESTAMP(3);
ALTER TABLE "UserOnboardingState" ADD COLUMN "charterVersion" TEXT, ADD COLUMN "charterAcceptedAt" TIMESTAMP(3);
ALTER TABLE "UserFunctionalProfile" ADD COLUMN "contributionSeedType" TEXT, ADD COLUMN "contributionSeedText" VARCHAR(300), ADD COLUMN "contributionSeedUpdatedAt" TIMESTAMP(3);
ALTER TABLE "Pitch" ADD COLUMN "temporalClass" TEXT NOT NULL DEFAULT 'PROJECT', ADD COLUMN "license" TEXT NOT NULL DEFAULT 'CC-BY-SA-4.0', ADD COLUMN "protocolLabels" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[], ADD COLUMN "casesWithProvenance" BOOLEAN NOT NULL DEFAULT false, ADD COLUMN "notInRoomAck" VARCHAR(500);

CREATE TABLE "CaseWithProvenance" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" VARCHAR(140) NOT NULL,
  "summary" VARCHAR(300) NOT NULL,
  "place" VARCHAR(160) NOT NULL,
  "temporalClass" TEXT NOT NULL DEFAULT 'PROJECT',
  "institutionalContext" VARCHAR(500) NOT NULL,
  "outcomeClaims" JSONB NOT NULL,
  "lessons" VARCHAR(1200) NOT NULL,
  "contributorNotes" VARCHAR(800),
  "attribution" VARCHAR(300) NOT NULL,
  "lineageAcknowledgment" VARCHAR(500),
  "pitchId" TEXT,
  "authorId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CaseWithProvenance_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CaseWithProvenance_slug_key" ON "CaseWithProvenance"("slug");
CREATE INDEX "CaseWithProvenance_authorId_idx" ON "CaseWithProvenance"("authorId");
CREATE INDEX "CaseWithProvenance_pitchId_idx" ON "CaseWithProvenance"("pitchId");
CREATE INDEX "CaseWithProvenance_temporalClass_idx" ON "CaseWithProvenance"("temporalClass");
CREATE INDEX "CaseWithProvenance_createdAt_idx" ON "CaseWithProvenance"("createdAt");

CREATE TABLE "ForwardReciprocityPrompt" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "trigger" TEXT NOT NULL,
  "triggerEntityId" TEXT NOT NULL DEFAULT '',
  "responseText" VARCHAR(500),
  "createdOfferId" TEXT,
  "skippedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ForwardReciprocityPrompt_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ForwardReciprocityPrompt_userId_trigger_triggerEntityId_key" ON "ForwardReciprocityPrompt"("userId", "trigger", "triggerEntityId");
CREATE INDEX "ForwardReciprocityPrompt_userId_idx" ON "ForwardReciprocityPrompt"("userId");
CREATE INDEX "ForwardReciprocityPrompt_trigger_idx" ON "ForwardReciprocityPrompt"("trigger");

ALTER TABLE "CaseWithProvenance" ADD CONSTRAINT "CaseWithProvenance_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CaseWithProvenance" ADD CONSTRAINT "CaseWithProvenance_pitchId_fkey" FOREIGN KEY ("pitchId") REFERENCES "Pitch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ForwardReciprocityPrompt" ADD CONSTRAINT "ForwardReciprocityPrompt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
