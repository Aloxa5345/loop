-- AlterTable
ALTER TABLE "Feedback" ADD COLUMN     "aiStatus" TEXT NOT NULL DEFAULT 'Pending',
ADD COLUMN     "featureArea" TEXT;
