-- Retire legacy feed likes and add typed reaction/annotation persistence.
CREATE TYPE "FeedReactionType" AS ENUM (
  'INSPIRED',
  'LEARNED',
  'CAN_HELP',
  'CAN_CONNECT',
  'WORTH_DEEPER_LISTENING',
  'REGENERATIVE'
);

CREATE TYPE "FeedAnnotationSource" AS ENUM ('AUTHOR', 'VIEWER');

CREATE TABLE "FeedPostReaction" (
  "id" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "FeedReactionType" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FeedPostReaction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FeedCommentReaction" (
  "id" TEXT NOT NULL,
  "commentId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "FeedReactionType" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FeedCommentReaction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FeedPostRdgAnnotation" (
  "id" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "source" "FeedAnnotationSource" NOT NULL,
  "rdgSlug" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FeedPostRdgAnnotation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FeedPostTagAnnotation" (
  "id" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "source" "FeedAnnotationSource" NOT NULL,
  "tagKey" TEXT NOT NULL,
  "tagLabel" TEXT NOT NULL,
  "tagCategory" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FeedPostTagAnnotation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FeedPostReaction_postId_userId_type_key" ON "FeedPostReaction"("postId", "userId", "type");
CREATE INDEX "FeedPostReaction_postId_type_idx" ON "FeedPostReaction"("postId", "type");
CREATE INDEX "FeedPostReaction_userId_idx" ON "FeedPostReaction"("userId");

CREATE UNIQUE INDEX "FeedCommentReaction_commentId_userId_type_key" ON "FeedCommentReaction"("commentId", "userId", "type");
CREATE INDEX "FeedCommentReaction_commentId_type_idx" ON "FeedCommentReaction"("commentId", "type");
CREATE INDEX "FeedCommentReaction_userId_idx" ON "FeedCommentReaction"("userId");

CREATE UNIQUE INDEX "FeedPostRdgAnnotation_postId_userId_source_rdgSlug_key" ON "FeedPostRdgAnnotation"("postId", "userId", "source", "rdgSlug");
CREATE INDEX "FeedPostRdgAnnotation_postId_source_idx" ON "FeedPostRdgAnnotation"("postId", "source");
CREATE INDEX "FeedPostRdgAnnotation_userId_idx" ON "FeedPostRdgAnnotation"("userId");

CREATE UNIQUE INDEX "FeedPostTagAnnotation_postId_userId_source_tagKey_key" ON "FeedPostTagAnnotation"("postId", "userId", "source", "tagKey");
CREATE INDEX "FeedPostTagAnnotation_postId_source_idx" ON "FeedPostTagAnnotation"("postId", "source");
CREATE INDEX "FeedPostTagAnnotation_userId_idx" ON "FeedPostTagAnnotation"("userId");

ALTER TABLE "FeedPostReaction" ADD CONSTRAINT "FeedPostReaction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "FeedPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FeedPostReaction" ADD CONSTRAINT "FeedPostReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FeedCommentReaction" ADD CONSTRAINT "FeedCommentReaction_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "FeedComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FeedCommentReaction" ADD CONSTRAINT "FeedCommentReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FeedPostRdgAnnotation" ADD CONSTRAINT "FeedPostRdgAnnotation_postId_fkey" FOREIGN KEY ("postId") REFERENCES "FeedPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FeedPostRdgAnnotation" ADD CONSTRAINT "FeedPostRdgAnnotation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FeedPostTagAnnotation" ADD CONSTRAINT "FeedPostTagAnnotation_postId_fkey" FOREIGN KEY ("postId") REFERENCES "FeedPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FeedPostTagAnnotation" ADD CONSTRAINT "FeedPostTagAnnotation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

DROP TABLE IF EXISTS "FeedCommentLike";
DROP TABLE IF EXISTS "FeedLike";
ALTER TABLE "FeedComment" DROP COLUMN IF EXISTS "likesCount";
ALTER TABLE "FeedPost" DROP COLUMN IF EXISTS "likesCount";
