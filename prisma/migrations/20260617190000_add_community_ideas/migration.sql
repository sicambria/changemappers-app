
-- CreateEnum
CREATE TYPE "IdeaPostType" AS ENUM ('PAIN_POINT', 'FEATURE_IDEA', 'BUG_FIX');

-- CreateEnum
CREATE TYPE "IdeaPostStatus" AS ENUM ('OPEN', 'PLANNED', 'IN_PROGRESS', 'DONE', 'DECLINED');

-- CreateTable
CREATE TABLE "IdeaPost" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "IdeaPostType" NOT NULL,
    "status" "IdeaPostStatus" NOT NULL DEFAULT 'OPEN',
    "rdgTags" TEXT[],
    "tags" TEXT[],
    "voteCount" INTEGER NOT NULL DEFAULT 0,
    "feedbackId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdeaPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdeaVote" (
    "id" TEXT NOT NULL,
    "ideaPostId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdeaVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdeaComment" (
    "id" TEXT NOT NULL,
    "ideaPostId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdeaComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IdeaPost_feedbackId_key" ON "IdeaPost"("feedbackId");

-- CreateIndex
CREATE INDEX "IdeaPost_status_idx" ON "IdeaPost"("status");

-- CreateIndex
CREATE INDEX "IdeaPost_type_idx" ON "IdeaPost"("type");

-- CreateIndex
CREATE INDEX "IdeaPost_voteCount_idx" ON "IdeaPost"("voteCount");

-- CreateIndex
CREATE INDEX "IdeaPost_createdById_idx" ON "IdeaPost"("createdById");

-- CreateIndex
CREATE INDEX "IdeaVote_ideaPostId_idx" ON "IdeaVote"("ideaPostId");

-- CreateIndex
CREATE INDEX "IdeaVote_userId_idx" ON "IdeaVote"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "IdeaVote_ideaPostId_userId_key" ON "IdeaVote"("ideaPostId", "userId");

-- CreateIndex
CREATE INDEX "IdeaComment_ideaPostId_idx" ON "IdeaComment"("ideaPostId");

-- CreateIndex
CREATE INDEX "IdeaComment_userId_idx" ON "IdeaComment"("userId");

-- AddForeignKey
ALTER TABLE "IdeaPost" ADD CONSTRAINT "IdeaPost_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "Feedback"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdeaPost" ADD CONSTRAINT "IdeaPost_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdeaVote" ADD CONSTRAINT "IdeaVote_ideaPostId_fkey" FOREIGN KEY ("ideaPostId") REFERENCES "IdeaPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdeaVote" ADD CONSTRAINT "IdeaVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdeaComment" ADD CONSTRAINT "IdeaComment_ideaPostId_fkey" FOREIGN KEY ("ideaPostId") REFERENCES "IdeaPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdeaComment" ADD CONSTRAINT "IdeaComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

