-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "companySize" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "governmentContractor" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "icpTier" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "industry" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "Deal" ADD COLUMN     "probability" INTEGER NOT NULL DEFAULT 0;

-- Backfill: give existing deals a sensible starting probability based on
-- their current stage (same defaults as lib/constants.ts STAGE_PROBABILITY),
-- rather than leaving them all at 0 and understating the pipeline.
UPDATE "Deal" SET "probability" = CASE "stage"
  WHEN 'Lead' THEN 10
  WHEN 'Qualified' THEN 25
  WHEN 'Proposal' THEN 50
  WHEN 'Negotiation' THEN 75
  WHEN 'Won' THEN 100
  WHEN 'Lost' THEN 0
  ELSE 0
END;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "health" TEXT NOT NULL DEFAULT 'Green',
ADD COLUMN     "nextDeliverable" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "nextMeetingAt" TIMESTAMP(3);
