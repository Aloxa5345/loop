/*
  Warnings:

  - A unique constraint covering the columns `[shareToken]` on the table `Report` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "shareToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Report_shareToken_key" ON "Report"("shareToken");
