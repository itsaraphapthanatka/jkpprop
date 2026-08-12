-- AlterTable
ALTER TABLE "CompanyProfile" ADD COLUMN     "facebookUrl" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "instagramUrl" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "lineUrl" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "whatsappUrl" TEXT NOT NULL DEFAULT '';
