-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN "invoiceNumber" INTEGER,
ADD COLUMN "revenueStream" TEXT NOT NULL DEFAULT '',
ADD COLUMN "notes" TEXT NOT NULL DEFAULT '',
ADD COLUMN "paidAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Activity" ADD COLUMN "invoiceId" TEXT;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: assume existing "Paid" invoices were paid on their issued date,
-- since there's no better historical signal for when payment actually
-- landed.
UPDATE "Invoice" SET "paidAt" = "issuedAt" WHERE status = 'Paid' AND "paidAt" IS NULL;

-- Backfill: assign sequential invoice numbers to existing invoices in
-- creation order, so pre-existing rows get real numbers instead of NULL.
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt" ASC) AS rn
  FROM "Invoice"
)
UPDATE "Invoice" i
SET "invoiceNumber" = numbered.rn
FROM numbered
WHERE i.id = numbered.id;

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");
