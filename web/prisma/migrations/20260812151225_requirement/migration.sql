-- AlterTable
ALTER TABLE "Shortlist" ADD COLUMN     "requirementId" TEXT;

-- CreateTable
CREATE TABLE "Requirement" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "dealIntent" TEXT NOT NULL DEFAULT '',
    "typeKey" TEXT NOT NULL DEFAULT '',
    "usage" TEXT NOT NULL DEFAULT '',
    "areaMin" INTEGER,
    "areaMax" INTEGER,
    "budgetMin" INTEGER,
    "budgetMax" INTEGER,
    "moveIn" TIMESTAMP(3),
    "needsRor4" BOOLEAN NOT NULL DEFAULT false,
    "nearPort" BOOLEAN NOT NULL DEFAULT false,
    "pollution" TEXT NOT NULL DEFAULT '',
    "note" TEXT NOT NULL DEFAULT '',
    "locations" JSONB NOT NULL DEFAULT '[]',
    "cancelReason" TEXT NOT NULL DEFAULT '',
    "cancelField" TEXT NOT NULL DEFAULT '',
    "cancelledAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Requirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvailabilityCheck" (
    "id" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "checkedBy" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AvailabilityCheck_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Requirement_orgId_status_idx" ON "Requirement"("orgId", "status");

-- CreateIndex
CREATE INDEX "Requirement_leadId_idx" ON "Requirement"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "Requirement_orgId_code_key" ON "Requirement"("orgId", "code");

-- CreateIndex
CREATE INDEX "AvailabilityCheck_requirementId_idx" ON "AvailabilityCheck"("requirementId");

-- CreateIndex
CREATE UNIQUE INDEX "AvailabilityCheck_requirementId_propertyId_key" ON "AvailabilityCheck"("requirementId", "propertyId");

-- CreateIndex
CREATE INDEX "Shortlist_requirementId_idx" ON "Shortlist"("requirementId");

-- AddForeignKey
ALTER TABLE "Requirement" ADD CONSTRAINT "Requirement_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilityCheck" ADD CONSTRAINT "AvailabilityCheck_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "Requirement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shortlist" ADD CONSTRAINT "Shortlist_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "Requirement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
