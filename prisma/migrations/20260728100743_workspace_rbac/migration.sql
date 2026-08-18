/*
  Warnings:
  - Drop `role` and `workspaceId` from User (migrated to WorkspaceMember)
  - Add `ownerId` to Workspace
  - Create WorkspaceMember join table
*/

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_workspaceId_fkey";

-- Step 1: Add new User columns
ALTER TABLE "User"
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Step 2: Add Workspace columns (nullable first to handle existing rows)
ALTER TABLE "Workspace"
  ADD COLUMN "description" TEXT,
  ADD COLUMN "ownerId" TEXT;

-- Step 3: Backfill ownerId using the existing user in that workspace
UPDATE "Workspace" w
SET "ownerId" = (
  SELECT u.id FROM "User" u WHERE u."workspaceId" = w.id LIMIT 1
);

-- If no user found, fall back to the first user in the system
UPDATE "Workspace"
SET "ownerId" = (SELECT id FROM "User" ORDER BY "id" LIMIT 1)
WHERE "ownerId" IS NULL;

-- Step 4: Now make ownerId NOT NULL
ALTER TABLE "Workspace" ALTER COLUMN "ownerId" SET NOT NULL;

-- Step 5: Create WorkspaceMember table
CREATE TABLE "WorkspaceMember" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceMember_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WorkspaceMember_workspaceId_userId_key" ON "WorkspaceMember"("workspaceId", "userId");

-- Step 6: Migrate existing User.workspaceId + User.role into WorkspaceMember
INSERT INTO "WorkspaceMember" ("id", "workspaceId", "userId", "role", "joinedAt")
SELECT
  gen_random_uuid()::text,
  u."workspaceId",
  u."id",
  u."role",
  NOW()
FROM "User" u
WHERE u."workspaceId" IS NOT NULL;

-- Step 7: Drop old columns from User
ALTER TABLE "User"
  DROP COLUMN "role",
  DROP COLUMN "workspaceId";

-- Step 8: Add foreign keys
ALTER TABLE "Workspace" ADD CONSTRAINT "Workspace_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
