/*
  Warnings:

  - The `sentiment` column on the `Feedback` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Feedback` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `updatedAt` to the `Feedback` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Feedback` table without a default value. This is not possible if the table is not empty.
  - Made the column `customerLabel` on table `Feedback` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "FeedbackStatus" AS ENUM ('PENDING', 'REVIEWED', 'ANALYZED');

-- AlterTable
ALTER TABLE "Feedback" ADD COLUMN     "aiSummary" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL,
ALTER COLUMN "customerLabel" SET NOT NULL,
DROP COLUMN "sentiment",
ADD COLUMN     "sentiment" TEXT,
ALTER COLUMN "sentimentScore" DROP NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "FeedbackStatus" NOT NULL DEFAULT 'PENDING';

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
