/*
  Warnings:

  - The values [ECOVILLAGE,TRANSITION_TOWN,PROJECT,NETWORK,COHOUSING,INTENTIONAL_COMMUNITY] on the enum `CommunityType` will be removed. If these variants are still used in the database, this will fail.
  - The values [COMMUNITY_MEMBER] on the enum `ConnectionType` will be removed. If these variants are still used in the database, this will fail.
  - The `governance` column on the `Community` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `archetype` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `journeyStage` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[verificationToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('SYSTEM', 'CONNECTION_REQUEST', 'CONNECTION_ACCEPTED', 'EVENT_INVITE', 'COMMUNITY_INVITE', 'COMMUNITY_JOIN_REQUEST', 'COMMUNITY_JOIN_RESPONSE', 'PROXIMITY_ALERT');

-- CreateEnum
CREATE TYPE "ChangemakerLevel" AS ENUM ('LEVEL_0', 'LEVEL_1', 'LEVEL_2', 'LEVEL_3', 'LEVEL_4', 'LEVEL_5', 'LEVEL_6', 'LEVEL_7', 'LEVEL_8', 'LEVEL_9');

-- CreateEnum
CREATE TYPE "ProfileType" AS ENUM ('GUEST', 'KOMAKERESO', 'CHANGEMAPPER');

-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('PENDING', 'ACTIVE', 'REJECTED', 'BANNED', 'LEFT');

-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('APPROVED', 'PENDING_REVIEW', 'HIDDEN');

-- CreateEnum
CREATE TYPE "EntitySource" AS ENUM ('USER', 'IMPORT');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('UNCLAIMED', 'PENDING', 'CLAIMED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AvailabilityMode" AS ENUM ('DELIVERING', 'BETWEEN', 'BUILDING', 'REFLECTING', 'RESTING');

-- CreateEnum
CREATE TYPE "WorkContextScale" AS ENUM ('COMMUNITY', 'SECTOR', 'CROSS_SECTOR', 'MULTI_SCALE');

-- CreateEnum
CREATE TYPE "ReflectionLevel" AS ENUM ('L1_PULSE', 'L2_AVAILABILITY', 'L3_PROJECT', 'L4_QUARTERLY', 'L5_HALF_YEAR', 'L6_ANNUAL');

-- CreateEnum
CREATE TYPE "ProjectReflectionPhase" AS ENUM ('START', 'MID', 'CLOSURE', 'POST_CLOSURE');

-- CreateEnum
CREATE TYPE "TagCategory" AS ENUM ('SKILL', 'INTEREST', 'WORK_TYPE', 'COALITION_NEED', 'EXISTENTIAL_RISK', 'PROFESSIONAL_BACKGROUND', 'NEW_SKILL');

-- CreateEnum
CREATE TYPE "NetworkRole" AS ENUM ('WEAVER', 'BUILDER', 'CAREGIVER', 'EXPERIMENTER', 'CATALYST');

-- CreateEnum
CREATE TYPE "DecisionMakingType" AS ENUM ('HIERARCHICAL', 'SOCIOCRATIC', 'CONSENSUS');

-- CreateEnum
CREATE TYPE "ResourceSharingType" AS ENUM ('SHARED_TREASURY', 'CONTRIBUTION', 'PRIVATE');

-- CreateEnum
CREATE TYPE "SocialIntimacyType" AS ENUM ('RADICAL_TRANSPARENCY', 'CAMARADERIE', 'PROFESSIONAL');

-- CreateEnum
CREATE TYPE "CommunityPresenceType" AS ENUM ('PERMANENT_RESIDENT', 'LONG_TERM_STAY', 'PROJECT_BASED', 'VIRTUAL', 'OPEN');

-- CreateEnum
CREATE TYPE "CommunitySizeType" AS ENUM ('SIZE_5_15', 'SIZE_15_50', 'SIZE_50_200', 'SIZE_200_PLUS', 'ANY');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Archetype" ADD VALUE 'MYCELIUM';
ALTER TYPE "Archetype" ADD VALUE 'KEYSTONE';
ALTER TYPE "Archetype" ADD VALUE 'POLLINATOR';
ALTER TYPE "Archetype" ADD VALUE 'PRISM';
ALTER TYPE "Archetype" ADD VALUE 'COMPOST';
ALTER TYPE "Archetype" ADD VALUE 'SENTINEL';
ALTER TYPE "Archetype" ADD VALUE 'ALCHEMIST';
ALTER TYPE "Archetype" ADD VALUE 'CANOPY';
ALTER TYPE "Archetype" ADD VALUE 'SPARK';
ALTER TYPE "Archetype" ADD VALUE 'ECHO';
ALTER TYPE "Archetype" ADD VALUE 'TIDE';
ALTER TYPE "Archetype" ADD VALUE 'HORIZON';

-- AlterEnum
BEGIN;
CREATE TYPE "CommunityType_new" AS ENUM ('NATURE_CONNECTED_ECO_HUB', 'HEALING_SANCTUARY', 'INCLUSIVE_SUPPORT_NETWORK', 'CREATIVE_ARTS_COLONY', 'EGALITARIAN_LIVING', 'SPIRITUAL_HAVEN', 'KNOWLEDGE_HUB', 'NOMADIC_NETWORK', 'REGENERATIVE_ECONOMIC', 'VISIONARY_MODEL_CITY', 'EARTH_REGENERATION_CENTER', 'FRONTLINE_ACTIVIST', 'OTHER');
ALTER TABLE "public"."Community" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "Community" ALTER COLUMN "type" TYPE "CommunityType_new" USING ("type"::text::"CommunityType_new");
ALTER TYPE "CommunityType" RENAME TO "CommunityType_old";
ALTER TYPE "CommunityType_new" RENAME TO "CommunityType";
DROP TYPE "public"."CommunityType_old";
ALTER TABLE "Community" ALTER COLUMN "type" SET DEFAULT 'OTHER';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ConnectionType_new" AS ENUM ('GENERAL', 'ROMANTIC', 'COFOUNDER', 'SUPPORT', 'MENTORING', 'PEER_LEARNING');
ALTER TABLE "public"."Connection" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "Connection" ALTER COLUMN "type" TYPE "ConnectionType_new" USING ("type"::text::"ConnectionType_new");
ALTER TYPE "ConnectionType" RENAME TO "ConnectionType_old";
ALTER TYPE "ConnectionType_new" RENAME TO "ConnectionType";
DROP TYPE "public"."ConnectionType_old";
ALTER TABLE "Connection" ALTER COLUMN "type" SET DEFAULT 'GENERAL';
COMMIT;

-- AlterEnum
ALTER TYPE "SkillType" ADD VALUE 'EXPERIENCE';

-- DropIndex
DROP INDEX "User_archetype_idx";

-- DropIndex
DROP INDEX "User_journeyStage_idx";

-- AlterTable
ALTER TABLE "Community" ADD COLUMN     "annualGoals" TEXT,
ADD COLUMN     "claimRequestById" TEXT,
ADD COLUMN     "claimStatus" "ClaimStatus" NOT NULL DEFAULT 'UNCLAIMED',
ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "houseRules" TEXT,
ADD COLUMN     "membershipCost" TEXT,
ADD COLUMN     "moderationStatus" "ModerationStatus" NOT NULL DEFAULT 'APPROVED',
ADD COLUMN     "principles" TEXT,
ADD COLUMN     "seekingVolunteers" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "source" "EntitySource" NOT NULL DEFAULT 'USER',
ADD COLUMN     "targetMemberDescription" TEXT,
ADD COLUMN     "vision" TEXT,
ADD COLUMN     "volunteerDescription" TEXT,
ADD COLUMN     "zipCode" TEXT,
ALTER COLUMN "type" SET DEFAULT 'OTHER',
DROP COLUMN "governance",
ADD COLUMN     "governance" TEXT;

-- AlterTable
ALTER TABLE "CommunityMember" ADD COLUMN     "status" "MemberStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "claimRequestById" TEXT,
ADD COLUMN     "claimStatus" "ClaimStatus" NOT NULL DEFAULT 'UNCLAIMED',
ADD COLUMN     "moderationStatus" "ModerationStatus" NOT NULL DEFAULT 'APPROVED',
ADD COLUMN     "source" "EntitySource" NOT NULL DEFAULT 'USER';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "archetype",
DROP COLUMN "journeyStage",
ADD COLUMN     "archetypes" "Archetype"[],
ADD COLUMN     "availabilityDetails" JSONB,
ADD COLUMN     "changemakeLevel" "ChangemakerLevel" NOT NULL DEFAULT 'LEVEL_2',
ADD COLUMN     "collaborationPreference" TEXT[],
ADD COLUMN     "constraints" TEXT,
ADD COLUMN     "coverImage" TEXT,
ADD COLUMN     "currentIntention" TEXT,
ADD COLUMN     "dashboardLayout" JSONB,
ADD COLUMN     "enjoyDoing" TEXT,
ADD COLUMN     "isRemoteCapable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isSuspended" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastUnreadNotificationAt" TIMESTAMP(3),
ADD COLUMN     "mainCommunity" TEXT,
ADD COLUMN     "motto" TEXT,
ADD COLUMN     "organizationDescription" TEXT,
ADD COLUMN     "organizationName" TEXT,
ADD COLUMN     "primaryLanguage" TEXT,
ADD COLUMN     "profileType" "ProfileType" NOT NULL DEFAULT 'GUEST',
ADD COLUMN     "rdgAreas" TEXT[],
ADD COLUMN     "socialLinks" JSONB,
ADD COLUMN     "spokenLanguages" TEXT[],
ADD COLUMN     "uiLanguage" TEXT DEFAULT 'hu',
ADD COLUMN     "verificationToken" TEXT,
ADD COLUMN     "verificationTokenExpiry" TIMESTAMP(3),
ADD COLUMN     "website" TEXT,
ADD COLUMN     "workingSectors" TEXT[];

-- DropEnum
DROP TYPE "JourneyStage";

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "senderId" TEXT,
    "eventId" TEXT,
    "communityId" TEXT,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityValue" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "CommunityValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityVolunteerCapability" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "capability" TEXT NOT NULL,

    CONSTRAINT "CommunityVolunteerCapability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialCause" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "coverImage" TEXT,
    "problems" TEXT,
    "solutions" TEXT,
    "websites" TEXT,
    "rdgDomains" TEXT[],
    "neededFunctions" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialCause_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserOnboardingState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastStageCompleted" INTEGER NOT NULL DEFAULT 0,
    "agreementsAcceptedAt" TIMESTAMP(3),
    "stage1CompletedAt" TIMESTAMP(3),
    "stage2CompletedAt" TIMESTAMP(3),
    "stage2_5CompletedAt" TIMESTAMP(3),
    "stage3CompletedAt" TIMESTAMP(3),
    "stage4CompletedAt" TIMESTAMP(3),
    "stage4_5CompletedAt" TIMESTAMP(3),
    "stage5CompletedAt" TIMESTAMP(3),
    "stage5_5CompletedAt" TIMESTAMP(3),
    "stage6CompletedAt" TIMESTAMP(3),
    "stage6_5CompletedAt" TIMESTAMP(3),
    "orientationSeenAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserOnboardingState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFunctionalProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cmapLevel" INTEGER,
    "assessmentResponses" JSONB,
    "networkRoles" "NetworkRole"[],
    "internalExternalFocus" INTEGER,
    "secularSpiritualFocus" INTEGER,
    "decisionMaking" "DecisionMakingType",
    "resourceSharing" "ResourceSharingType",
    "comfortLevel" INTEGER,
    "socialIntimacy" "SocialIntimacyType",
    "communityPresence" "CommunityPresenceType"[],
    "communitySize" "CommunitySizeType",
    "energisingFunctions" TEXT[],
    "drainingFunctions" TEXT[],
    "sustainabilityMap" JSONB,
    "availabilityMode" "AvailabilityMode" NOT NULL DEFAULT 'DELIVERING',
    "currentOffer" TEXT,
    "focusMode" TEXT,
    "workContextLastEffort" TEXT,
    "workContextOutsideRole" TEXT,
    "workContextScale" "WorkContextScale",
    "rdgMain" TEXT[],
    "rdgInterested" TEXT[],
    "rdgProject" TEXT,
    "rdgPartnership" TEXT,
    "scenarioResponses" JSONB,
    "avoidedFunctions" TEXT[],
    "avoidedFunctionsReason" TEXT,
    "currentProjectDescription" TEXT,
    "momentNeeds" TEXT[],
    "protectionNeeds" TEXT[],
    "developmentGaps" TEXT,
    "systemicExperience" TEXT,
    "currentActivities" TEXT[],
    "desiredActivities" TEXT[],
    "systemicActivities" TEXT[],
    "existentialActivities" TEXT,
    "functionsUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserFunctionalProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReflectionRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "level" "ReflectionLevel" NOT NULL,
    "alignmentScore" INTEGER,
    "energyScore" INTEGER,
    "outsideFunctionScore" INTEGER,
    "outsideFunctionByChoice" BOOLEAN,
    "activeFunctions" TEXT[],
    "unavailableFunctions" TEXT[],
    "updatedOfferSentence" TEXT,
    "privateNotes" TEXT,
    "triggerContext" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReflectionRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectReflection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "phase" "ProjectReflectionPhase" NOT NULL,
    "neededFunctions" TEXT[],
    "presentFunctions" TEXT[],
    "activeFunctions" TEXT[],
    "absentFunctions" TEXT[],
    "privateNotes" TEXT,
    "whatItBecame" TEXT,
    "whatToCarryForward" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectReflection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityArchetype" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "CommunityArchetype_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemFunction" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "labelHu" TEXT NOT NULL,

    CONSTRAINT "SystemFunction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemTag" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "category" "TagCategory" NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "SystemTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchRejectionLog" (
    "id" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "targetUserArchetype" "Archetype" NOT NULL,
    "candidateArchetype" "Archetype" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchRejectionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CommunitySocialCauses" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CommunitySocialCauses_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_UserMainCauses" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_UserMainCauses_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_UserInterestedCauses" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_UserInterestedCauses_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_UserManagedCauses" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_UserManagedCauses_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_UserCoalitionNeeds" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_UserCoalitionNeeds_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_UserExistentialRisks" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_UserExistentialRisks_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_UserBackgroundTags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_UserBackgroundTags_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_UserSoughtWorkTags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_UserSoughtWorkTags_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_UserDevelopedSkills" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_UserDevelopedSkills_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityValue_communityId_value_key" ON "CommunityValue"("communityId", "value");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityVolunteerCapability_communityId_capability_key" ON "CommunityVolunteerCapability"("communityId", "capability");

-- CreateIndex
CREATE UNIQUE INDEX "SocialCause_title_key" ON "SocialCause"("title");

-- CreateIndex
CREATE UNIQUE INDEX "SocialCause_slug_key" ON "SocialCause"("slug");

-- CreateIndex
CREATE INDEX "SocialCause_slug_idx" ON "SocialCause"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "UserOnboardingState_userId_key" ON "UserOnboardingState"("userId");

-- CreateIndex
CREATE INDEX "UserOnboardingState_userId_idx" ON "UserOnboardingState"("userId");

-- CreateIndex
CREATE INDEX "UserOnboardingState_lastStageCompleted_idx" ON "UserOnboardingState"("lastStageCompleted");

-- CreateIndex
CREATE UNIQUE INDEX "UserFunctionalProfile_userId_key" ON "UserFunctionalProfile"("userId");

-- CreateIndex
CREATE INDEX "UserFunctionalProfile_userId_idx" ON "UserFunctionalProfile"("userId");

-- CreateIndex
CREATE INDEX "UserFunctionalProfile_availabilityMode_idx" ON "UserFunctionalProfile"("availabilityMode");

-- CreateIndex
CREATE INDEX "ReflectionRecord_userId_level_idx" ON "ReflectionRecord"("userId", "level");

-- CreateIndex
CREATE INDEX "ReflectionRecord_userId_createdAt_idx" ON "ReflectionRecord"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ProjectReflection_userId_idx" ON "ProjectReflection"("userId");

-- CreateIndex
CREATE INDEX "ProjectReflection_phase_idx" ON "ProjectReflection"("phase");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityArchetype_title_key" ON "CommunityArchetype"("title");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityArchetype_slug_key" ON "CommunityArchetype"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "SystemFunction_key_key" ON "SystemFunction"("key");

-- CreateIndex
CREATE UNIQUE INDEX "SystemTag_key_key" ON "SystemTag"("key");

-- CreateIndex
CREATE INDEX "MatchRejectionLog_targetUserArchetype_candidateArchetype_idx" ON "MatchRejectionLog"("targetUserArchetype", "candidateArchetype");

-- CreateIndex
CREATE INDEX "MatchRejectionLog_createdAt_idx" ON "MatchRejectionLog"("createdAt");

-- CreateIndex
CREATE INDEX "_CommunitySocialCauses_B_index" ON "_CommunitySocialCauses"("B");

-- CreateIndex
CREATE INDEX "_UserMainCauses_B_index" ON "_UserMainCauses"("B");

-- CreateIndex
CREATE INDEX "_UserInterestedCauses_B_index" ON "_UserInterestedCauses"("B");

-- CreateIndex
CREATE INDEX "_UserManagedCauses_B_index" ON "_UserManagedCauses"("B");

-- CreateIndex
CREATE INDEX "_UserCoalitionNeeds_B_index" ON "_UserCoalitionNeeds"("B");

-- CreateIndex
CREATE INDEX "_UserExistentialRisks_B_index" ON "_UserExistentialRisks"("B");

-- CreateIndex
CREATE INDEX "_UserBackgroundTags_B_index" ON "_UserBackgroundTags"("B");

-- CreateIndex
CREATE INDEX "_UserSoughtWorkTags_B_index" ON "_UserSoughtWorkTags"("B");

-- CreateIndex
CREATE INDEX "_UserDevelopedSkills_B_index" ON "_UserDevelopedSkills"("B");

-- CreateIndex
CREATE INDEX "Community_moderationStatus_idx" ON "Community"("moderationStatus");

-- CreateIndex
CREATE INDEX "Community_visibility_idx" ON "Community"("visibility");

-- CreateIndex
CREATE INDEX "Community_acceptingMembers_idx" ON "Community"("acceptingMembers");

-- CreateIndex
CREATE INDEX "Community_seekingVolunteers_idx" ON "Community"("seekingVolunteers");

-- CreateIndex
CREATE INDEX "Community_updatedAt_idx" ON "Community"("updatedAt");

-- CreateIndex
CREATE INDEX "Community_ownerId_idx" ON "Community"("ownerId");

-- CreateIndex
CREATE INDEX "Community_source_idx" ON "Community"("source");

-- CreateIndex
CREATE INDEX "Community_claimStatus_idx" ON "Community"("claimStatus");

-- CreateIndex
CREATE INDEX "Connection_receiverId_idx" ON "Connection"("receiverId");

-- CreateIndex
CREATE INDEX "Event_status_idx" ON "Event"("status");

-- CreateIndex
CREATE INDEX "Event_type_idx" ON "Event"("type");

-- CreateIndex
CREATE INDEX "Event_moderationStatus_idx" ON "Event"("moderationStatus");

-- CreateIndex
CREATE INDEX "Event_updatedAt_idx" ON "Event"("updatedAt");

-- CreateIndex
CREATE INDEX "Event_hostId_idx" ON "Event"("hostId");

-- CreateIndex
CREATE INDEX "Event_communityId_idx" ON "Event"("communityId");

-- CreateIndex
CREATE INDEX "Event_parentEventId_idx" ON "Event"("parentEventId");

-- CreateIndex
CREATE INDEX "Event_source_idx" ON "Event"("source");

-- CreateIndex
CREATE INDEX "Event_claimStatus_idx" ON "Event"("claimStatus");

-- CreateIndex
CREATE INDEX "EventRsvp_userId_idx" ON "EventRsvp"("userId");

-- CreateIndex
CREATE INDEX "Appreciate_targetUserId_idx" ON "Appreciate"("targetUserId");

-- CreateIndex
CREATE INDEX "Appreciate_targetCommunityId_idx" ON "Appreciate"("targetCommunityId");

-- CreateIndex
CREATE INDEX "Appreciate_targetEventId_idx" ON "Appreciate"("targetEventId");

-- CreateIndex
CREATE INDEX "Report_filerId_idx" ON "Report"("filerId");

-- CreateIndex
CREATE INDEX "Report_targetId_idx" ON "Report"("targetId");

-- CreateIndex
CREATE UNIQUE INDEX "User_verificationToken_key" ON "User"("verificationToken");

-- CreateIndex
CREATE INDEX "User_profileType_idx" ON "User"("profileType");

-- CreateIndex
CREATE INDEX "User_profileVisibility_idx" ON "User"("profileVisibility");

-- CreateIndex
CREATE INDEX "User_updatedAt_idx" ON "User"("updatedAt");

-- CreateIndex
CREATE INDEX "User_invitedById_idx" ON "User"("invitedById");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Community" ADD CONSTRAINT "Community_claimRequestById_fkey" FOREIGN KEY ("claimRequestById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityValue" ADD CONSTRAINT "CommunityValue_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunityVolunteerCapability" ADD CONSTRAINT "CommunityVolunteerCapability_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_claimRequestById_fkey" FOREIGN KEY ("claimRequestById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserOnboardingState" ADD CONSTRAINT "UserOnboardingState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFunctionalProfile" ADD CONSTRAINT "UserFunctionalProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReflectionRecord" ADD CONSTRAINT "ReflectionRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectReflection" ADD CONSTRAINT "ProjectReflection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchRejectionLog" ADD CONSTRAINT "MatchRejectionLog_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CommunitySocialCauses" ADD CONSTRAINT "_CommunitySocialCauses_A_fkey" FOREIGN KEY ("A") REFERENCES "Community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CommunitySocialCauses" ADD CONSTRAINT "_CommunitySocialCauses_B_fkey" FOREIGN KEY ("B") REFERENCES "SocialCause"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserMainCauses" ADD CONSTRAINT "_UserMainCauses_A_fkey" FOREIGN KEY ("A") REFERENCES "SocialCause"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserMainCauses" ADD CONSTRAINT "_UserMainCauses_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserInterestedCauses" ADD CONSTRAINT "_UserInterestedCauses_A_fkey" FOREIGN KEY ("A") REFERENCES "SocialCause"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserInterestedCauses" ADD CONSTRAINT "_UserInterestedCauses_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserManagedCauses" ADD CONSTRAINT "_UserManagedCauses_A_fkey" FOREIGN KEY ("A") REFERENCES "SocialCause"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserManagedCauses" ADD CONSTRAINT "_UserManagedCauses_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserCoalitionNeeds" ADD CONSTRAINT "_UserCoalitionNeeds_A_fkey" FOREIGN KEY ("A") REFERENCES "SystemTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserCoalitionNeeds" ADD CONSTRAINT "_UserCoalitionNeeds_B_fkey" FOREIGN KEY ("B") REFERENCES "UserFunctionalProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserExistentialRisks" ADD CONSTRAINT "_UserExistentialRisks_A_fkey" FOREIGN KEY ("A") REFERENCES "SystemTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserExistentialRisks" ADD CONSTRAINT "_UserExistentialRisks_B_fkey" FOREIGN KEY ("B") REFERENCES "UserFunctionalProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserBackgroundTags" ADD CONSTRAINT "_UserBackgroundTags_A_fkey" FOREIGN KEY ("A") REFERENCES "SystemTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserBackgroundTags" ADD CONSTRAINT "_UserBackgroundTags_B_fkey" FOREIGN KEY ("B") REFERENCES "UserFunctionalProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserSoughtWorkTags" ADD CONSTRAINT "_UserSoughtWorkTags_A_fkey" FOREIGN KEY ("A") REFERENCES "SystemTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserSoughtWorkTags" ADD CONSTRAINT "_UserSoughtWorkTags_B_fkey" FOREIGN KEY ("B") REFERENCES "UserFunctionalProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserDevelopedSkills" ADD CONSTRAINT "_UserDevelopedSkills_A_fkey" FOREIGN KEY ("A") REFERENCES "SystemTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserDevelopedSkills" ADD CONSTRAINT "_UserDevelopedSkills_B_fkey" FOREIGN KEY ("B") REFERENCES "UserFunctionalProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
