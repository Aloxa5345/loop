/**
 * POST /api/ai/reset-failed
 *
 * Resets all feedback items with aiStatus = "Failed" back to "Pending"
 * in the current workspace. This clears the ❌ Failed badges so items
 * can be re-analyzed once AI credits are available.
 *
 * Requires: run-ai permission (Admin / Analyst).
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { hasPermission, type RoleKey } from "@/app/lib/permissions";

export async function POST() {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = session.user.role as RoleKey;
    if (!hasPermission(role, "run-ai")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await prisma.feedback.updateMany({
        where: {
            workspaceId: session.user.workspaceId,
            aiStatus: "Failed",
        },
        data: { aiStatus: "Pending" },
    });

    return NextResponse.json({ reset: result.count, message: `Reset ${result.count} failed items to Pending.` });
}
