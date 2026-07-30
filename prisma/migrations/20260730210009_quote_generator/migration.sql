-- AlterTable
ALTER TABLE "Deal" ADD COLUMN     "quoteType" TEXT NOT NULL DEFAULT 'service',
ADD COLUMN     "quoteNumber" INTEGER,
ADD COLUMN     "quoteIssuedAt" TIMESTAMP(3),
ADD COLUMN     "paymentTerms" TEXT NOT NULL DEFAULT 'Net 30 from invoice date';

-- CreateIndex
CREATE UNIQUE INDEX "Deal_quoteNumber_key" ON "Deal"("quoteNumber");

-- CreateTable
CREATE TABLE "QuoteLineItem" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "detail" TEXT NOT NULL DEFAULT '',
    "seats" INTEGER,
    "unitPrice" DOUBLE PRECISION,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "QuoteLineItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "QuoteLineItem" ADD CONSTRAINT "QuoteLineItem_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
