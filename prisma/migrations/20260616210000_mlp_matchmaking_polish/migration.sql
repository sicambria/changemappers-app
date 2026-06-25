-- Add candidateUserId to MatchRejectionLog for rejection-aware suppression
-- candidateUserId is nullable (legacy rows have no candidate id; dismissMatch always writes it)
ALTER TABLE "MatchRejectionLog"
  ADD COLUMN "candidateUserId" TEXT;

-- Index for suppression query: find recent rejections by seeker
CREATE INDEX "MatchRejectionLog_targetUserId_createdAt_idx"
  ON "MatchRejectionLog" ("targetUserId", "createdAt");
