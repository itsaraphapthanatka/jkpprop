-- AlterTable
ALTER TABLE "Deal" ADD COLUMN     "requirementId" TEXT;

-- AlterTable
ALTER TABLE "Visit" ADD COLUMN     "requirementId" TEXT;

-- CreateIndex
CREATE INDEX "Deal_requirementId_idx" ON "Deal"("requirementId");

-- CreateIndex
CREATE INDEX "Visit_requirementId_idx" ON "Visit"("requirementId");

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "Requirement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "Requirement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
