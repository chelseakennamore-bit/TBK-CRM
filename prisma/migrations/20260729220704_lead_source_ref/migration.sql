-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "sourceRef" TEXT;

-- DropTable
DROP TABLE "QueuedLead";

-- CreateIndex
CREATE UNIQUE INDEX "Lead_sourceRef_key" ON "Lead"("sourceRef");

