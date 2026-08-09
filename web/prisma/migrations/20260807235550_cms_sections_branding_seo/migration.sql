
-- DropIndex
DROP INDEX "CmsPage_orgId_slug_key";

-- AlterTable
ALTER TABLE "CmsPage" ADD COLUMN     "category" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "cover" TEXT,
ADD COLUMN     "kind" TEXT NOT NULL DEFAULT 'articles',
ADD COLUMN     "links" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Visit" ADD COLUMN     "gateConfirmed" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "DealOffer" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "terms" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DealOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageSection" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "pageKey" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'section',
    "name" TEXT NOT NULL,
    "desc" TEXT NOT NULL DEFAULT '',
    "sort" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "img" TEXT,
    "content" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "PageSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Branding" (
    "orgId" TEXT NOT NULL,
    "brandName" TEXT NOT NULL DEFAULT 'JKP Property',
    "primary" TEXT NOT NULL DEFAULT '#034956',
    "accent" TEXT NOT NULL DEFAULT '#034956',
    "neon" TEXT NOT NULL DEFAULT '#2DFB91',
    "pine" TEXT NOT NULL DEFAULT '#273c33',
    "font" TEXT NOT NULL DEFAULT 'noto',
    "radius" TEXT NOT NULL DEFAULT 'md',
    "logo" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branding_pkey" PRIMARY KEY ("orgId")
);

-- CreateTable
CREATE TABLE "SeoConfig" (
    "orgId" TEXT NOT NULL,
    "subscribed" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeoConfig_pkey" PRIMARY KEY ("orgId")
);

-- CreateTable
CREATE TABLE "SeoFile" (
    "orgId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeoFile_pkey" PRIMARY KEY ("orgId","key")
);

-- CreateIndex
CREATE INDEX "DealOffer_dealId_idx" ON "DealOffer"("dealId");

-- CreateIndex
CREATE INDEX "PageSection_orgId_pageKey_idx" ON "PageSection"("orgId", "pageKey");

-- CreateIndex
CREATE UNIQUE INDEX "PageSection_orgId_pageKey_key_key" ON "PageSection"("orgId", "pageKey", "key");

-- CreateIndex
CREATE INDEX "CmsPage_orgId_kind_idx" ON "CmsPage"("orgId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "CmsPage_orgId_kind_slug_key" ON "CmsPage"("orgId", "kind", "slug");

-- AddForeignKey
ALTER TABLE "DealOffer" ADD CONSTRAINT "DealOffer_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

