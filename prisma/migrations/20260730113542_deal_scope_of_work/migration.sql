-- AlterTable
ALTER TABLE "Deal" ADD COLUMN     "scopeOfWork" TEXT NOT NULL DEFAULT '';

-- Backfill: the quote page previously showed "notes" as the scope of
-- work, since there was no dedicated field. Carry existing notes over
-- as a starting point so quotes generated from existing deals don't
-- suddenly go blank -- notes itself is untouched and stays internal-only.
UPDATE "Deal" SET "scopeOfWork" = "notes" WHERE trim("notes") <> '';
