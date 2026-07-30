-- AlterTable
ALTER TABLE "Deal" ADD COLUMN     "contactId" TEXT;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: link existing deals to a Contact when the deal's free-text
-- contactName matches an existing contact's name exactly (case-insensitive
-- and per-company, to avoid linking two different "Chris"es at different
-- companies). Deals with no match keep contactId null -- contactName still
-- displays as before.
UPDATE "Deal" d SET "contactId" = c.id
FROM "Contact" c
WHERE lower(trim(d."contactName")) = lower(trim(c.name))
  AND lower(trim(d.company)) = lower(trim(c.company))
  AND trim(d."contactName") <> ''
  AND d."contactName" <> '—';
