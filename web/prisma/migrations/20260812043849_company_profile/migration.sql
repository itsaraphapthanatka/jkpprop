-- CreateTable
CREATE TABLE "CompanyProfile" (
    "orgId" TEXT NOT NULL,
    "legalName" TEXT NOT NULL DEFAULT '',
    "address" JSONB,
    "shortLocation" JSONB,
    "phones" JSONB,
    "salesEmail" TEXT NOT NULL DEFAULT '',
    "generalEmail" TEXT NOT NULL DEFAULT '',
    "hoursDays" JSONB,
    "hoursValue" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyProfile_pkey" PRIMARY KEY ("orgId")
);
