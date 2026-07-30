/*
  Warnings:

  - Added the required column `updatedAt` to the `Deal` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Activity" ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'user';

-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "nextFollowUpAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Deal" ADD COLUMN     "closedLostReason" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "nextStep" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "nextStepDueAt" TIMESTAMP(3),
ADD COLUMN     "revenueStream" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "updatedAt" TIMESTAMP(3);

-- Backfill: existing deals have no update history, so treat their
-- creation time as the last known update.
UPDATE "Deal" SET "updatedAt" = "createdAt" WHERE "updatedAt" IS NULL;

ALTER TABLE "Deal" ALTER COLUMN "updatedAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "nextFollowUpAt" TIMESTAMP(3);
