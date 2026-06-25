-- Add explicit private visibility for boards and community allow-list sharing.
ALTER TYPE "Visibility" ADD VALUE IF NOT EXISTS 'PRIVATE';

CREATE TABLE IF NOT EXISTS "BoardCommunityAudience" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BoardCommunityAudience_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "BoardCommunityAudience_boardId_communityId_key" ON "BoardCommunityAudience"("boardId", "communityId");
CREATE INDEX IF NOT EXISTS "BoardCommunityAudience_communityId_idx" ON "BoardCommunityAudience"("communityId");

DO $$ BEGIN
    ALTER TABLE "BoardCommunityAudience" ADD CONSTRAINT "BoardCommunityAudience_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "BoardCommunityAudience" ADD CONSTRAINT "BoardCommunityAudience_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
