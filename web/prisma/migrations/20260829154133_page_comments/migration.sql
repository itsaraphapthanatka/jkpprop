-- CreateTable
CREATE TABLE "PageComment" (
    "id" TEXT NOT NULL,
    "page" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "text" TEXT NOT NULL DEFAULT '',
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PageComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PageComment_page_item_idx" ON "PageComment"("page", "item");

-- CreateIndex
CREATE INDEX "PageComment_createdAt_idx" ON "PageComment"("createdAt");
