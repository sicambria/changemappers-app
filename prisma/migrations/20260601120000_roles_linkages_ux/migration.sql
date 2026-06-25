-- CreateEnum
CREATE TYPE "EventRole" AS ENUM ('HOST', 'CO_HOST', 'MODERATOR');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "isModerator" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "EventOrganizer" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "EventRole" NOT NULL DEFAULT 'CO_HOST',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventOrganizer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventSocialCause" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "causeId" TEXT NOT NULL,

    CONSTRAINT "EventSocialCause_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventRdgTag" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "rdgId" TEXT NOT NULL,

    CONSTRAINT "EventRdgTag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventOrganizer_userId_idx" ON "EventOrganizer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EventOrganizer_eventId_userId_key" ON "EventOrganizer"("eventId", "userId");

-- CreateIndex
CREATE INDEX "EventSocialCause_causeId_idx" ON "EventSocialCause"("causeId");

-- CreateIndex
CREATE UNIQUE INDEX "EventSocialCause_eventId_causeId_key" ON "EventSocialCause"("eventId", "causeId");

-- CreateIndex
CREATE INDEX "EventRdgTag_rdgId_idx" ON "EventRdgTag"("rdgId");

-- CreateIndex
CREATE UNIQUE INDEX "EventRdgTag_eventId_rdgId_key" ON "EventRdgTag"("eventId", "rdgId");

-- AddForeignKey
ALTER TABLE "EventOrganizer" ADD CONSTRAINT "EventOrganizer_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventOrganizer" ADD CONSTRAINT "EventOrganizer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventSocialCause" ADD CONSTRAINT "EventSocialCause_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventSocialCause" ADD CONSTRAINT "EventSocialCause_causeId_fkey" FOREIGN KEY ("causeId") REFERENCES "SocialCause"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventRdgTag" ADD CONSTRAINT "EventRdgTag_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
