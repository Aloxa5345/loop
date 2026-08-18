-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "format" TEXT NOT NULL DEFAULT 'PDF';

-- CreateTable
CREATE TABLE "ReportSchedule" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "dayOfWeek" INTEGER,
    "hour" INTEGER NOT NULL DEFAULT 9,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "nextRun" TIMESTAMP(3) NOT NULL,
    "lastRun" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "workspaceId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "ReportSchedule_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ReportSchedule" ADD CONSTRAINT "ReportSchedule_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportSchedule" ADD CONSTRAINT "ReportSchedule_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
