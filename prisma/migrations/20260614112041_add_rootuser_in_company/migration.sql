-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "rootUserId" TEXT;

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_rootUserId_fkey" FOREIGN KEY ("rootUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
