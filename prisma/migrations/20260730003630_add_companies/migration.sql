-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "companyId" TEXT;

-- AlterTable
ALTER TABLE "Deal" ADD COLUMN     "companyId" TEXT;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "companyId" TEXT;

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: create a Company row for every distinct existing company/client
-- name across Contact, Deal, and Invoice (case-insensitive dedupe), then
-- link each row's companyId to it. Placeholder "—" and blank values are
-- skipped -- they mean "no company", not a company named "—".
INSERT INTO "Company" ("id", "name", "createdAt")
SELECT md5(random()::text || clock_timestamp()::text), name, now()
FROM (
  SELECT DISTINCT ON (lower(name)) name
  FROM (
    SELECT company AS name FROM "Contact" WHERE trim(company) <> '' AND company <> '—'
    UNION ALL
    SELECT company AS name FROM "Deal" WHERE trim(company) <> '' AND company <> '—'
    UNION ALL
    SELECT client AS name FROM "Invoice" WHERE trim(client) <> '' AND client <> '—'
  ) all_names
  ORDER BY lower(name)
) deduped;

UPDATE "Contact" c SET "companyId" = co.id
FROM "Company" co
WHERE lower(trim(c.company)) = lower(trim(co.name)) AND trim(c.company) <> '' AND c.company <> '—';

UPDATE "Deal" d SET "companyId" = co.id
FROM "Company" co
WHERE lower(trim(d.company)) = lower(trim(co.name)) AND trim(d.company) <> '' AND d.company <> '—';

UPDATE "Invoice" i SET "companyId" = co.id
FROM "Company" co
WHERE lower(trim(i.client)) = lower(trim(co.name)) AND trim(i.client) <> '' AND i.client <> '—';
