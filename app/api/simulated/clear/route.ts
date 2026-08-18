import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { hasPermission, type RoleKey } from "@/app/lib/permissions";

const SIMULATED_CHANNELS = ["Support Ticket", "App Store", "Manual", "Email"] as const;

// DELETE /api/simulated/clear — Admin only, removes all demo data for this workspace
export async function DELETE() {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = session.user.role as RoleKey;
    if (!hasPermission(role, "delete-simulated")) {
        return NextResponse.json({ error: "Forbidden — Admin only." }, { status: 403 });
    }

    const result = await prisma.feedback.deleteMany({
        where: {
            workspaceId: session.user.workspaceId,
            channel: { in: [...SIMULATED_CHANNELS] },
        },
    });

    return NextResponse.json({
        success: true,
        message: `${result.count} demo feedback records deleted.`,
        deleted: result.count,
    });
}
