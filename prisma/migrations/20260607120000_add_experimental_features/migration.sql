-- CreateTable
CREATE TABLE "ExperimentalFeature" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "globallyEnabled" BOOLEAN NOT NULL DEFAULT false,
    "optInByDefault" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExperimentalFeature_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExperimentalFeature_slug_key" ON "ExperimentalFeature"("slug");

-- AlterTable
ALTER TABLE "User" ADD COLUMN "experimentalFeatureOverrides" JSONB;

-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'EXPERIMENTAL_FEATURE_TOGGLE';
