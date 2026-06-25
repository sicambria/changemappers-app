-- CreateEnum
CREATE TYPE "FeedbackType" AS ENUM ('LIKE', 'DISLIKE');

-- AlterTable: convert Feedback.type from raw String to FeedbackType enum, preserving data
ALTER TABLE "Feedback" ALTER COLUMN "type" TYPE "FeedbackType" USING ("type"::"FeedbackType");

-- DropForeignKey
ALTER TABLE "InitiativeRole" DROP CONSTRAINT "InitiativeRole_userId_fkey";

-- DropForeignKey
ALTER TABLE "MentorProfile" DROP CONSTRAINT "MentorProfile_userId_fkey";

-- AddForeignKey: cascade-delete InitiativeRole/MentorProfile rows when the user is deleted (AUDIT-20260612-008)
ALTER TABLE "InitiativeRole" ADD CONSTRAINT "InitiativeRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorProfile" ADD CONSTRAINT "MentorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
