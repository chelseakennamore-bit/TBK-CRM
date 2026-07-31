-- AlterTable
ALTER TABLE "Activity" ADD COLUMN     "projectId" TEXT;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "companyId" TEXT,
ADD COLUMN     "contactId" TEXT,
ADD COLUMN     "contractedValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "notes" TEXT NOT NULL DEFAULT '';

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: existing projects already linked to a deal inherit that
-- deal's company/contact/value, since Project had no such links before.
UPDATE "Project" p SET
  "companyId" = d."companyId",
  "contactId" = d."contactId",
  "contractedValue" = d."value"
FROM "Deal" d
WHERE p."dealId" = d.id;

-- Backfill: create a Project for any deal already at Won that doesn't
-- have one yet, so existing won deals aren't left behind by the new
-- auto-creation-on-Won behavior going forward.
INSERT INTO "Project" (
  "id", "name", "client", "companyId", "contactId", "status", "progress",
  "health", "nextDeliverable", "notes", "contractedValue", "dealId", "createdAt"
)
SELECT
  md5(random()::text || clock_timestamp()::text || d.id),
  d.title, d.company, d."companyId", d."contactId", 'Not started', 0,
  'Green', '', d."scopeOfWork", d.value, d.id, now()
FROM "Deal" d
WHERE d.stage = 'Won'
  AND NOT EXISTS (SELECT 1 FROM "Project" p WHERE p."dealId" = d.id);
