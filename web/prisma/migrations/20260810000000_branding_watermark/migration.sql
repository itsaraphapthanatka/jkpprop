-- AlterTable: watermark stamped on public property photos
ALTER TABLE "Branding" ADD COLUMN     "wmEnabled" BOOLEAN NOT NULL DEFAULT false,
                       ADD COLUMN     "wmSrc" TEXT,
                       ADD COLUMN     "wmAnchor" TEXT NOT NULL DEFAULT 'bottom-right',
                       ADD COLUMN     "wmScale" INTEGER NOT NULL DEFAULT 18,
                       ADD COLUMN     "wmOpacity" INTEGER NOT NULL DEFAULT 70,
                       ADD COLUMN     "wmMargin" INTEGER NOT NULL DEFAULT 3,
                       ADD COLUMN     "wmVersion" INTEGER NOT NULL DEFAULT 0;
