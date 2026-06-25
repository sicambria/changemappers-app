-- CreateTable
CREATE TABLE "UserOnboardingJourneyStep" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stepId" VARCHAR(80) NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserOnboardingJourneyStep_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserOnboardingJourneyStep_userId_stepId_key" ON "UserOnboardingJourneyStep"("userId", "stepId");
CREATE INDEX "UserOnboardingJourneyStep_userId_idx" ON "UserOnboardingJourneyStep"("userId");
CREATE INDEX "UserOnboardingJourneyStep_stepId_idx" ON "UserOnboardingJourneyStep"("stepId");
