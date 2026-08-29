-- CreateTable
CREATE TABLE "MailSetting" (
    "orgId" TEXT NOT NULL,
    "host" TEXT NOT NULL DEFAULT '',
    "port" INTEGER NOT NULL DEFAULT 587,
    "secure" BOOLEAN NOT NULL DEFAULT false,
    "username" TEXT NOT NULL DEFAULT '',
    "password" TEXT NOT NULL DEFAULT '',
    "fromEmail" TEXT NOT NULL DEFAULT '',
    "fromName" TEXT NOT NULL DEFAULT '',
    "lastTestAt" TIMESTAMP(3),
    "lastTestOk" BOOLEAN,
    "lastTestError" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MailSetting_pkey" PRIMARY KEY ("orgId")
);

-- AddForeignKey
ALTER TABLE "MailSetting" ADD CONSTRAINT "MailSetting_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;
