import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { hasPermission, type RoleKey } from "@/app/lib/permissions";
import { surveyResponses } from "@/lib/seed/surveyResponses";
import { classifyBatch } from "@/lib/ai/classifyBatch";

export async function POST() {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = session.user.role as RoleKey;
    if (!hasPermission(role, "import-simulated")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const insertedAt = new Date();
    const result = await prisma.feedback.createMany({
        data: surveyResponses.map((r) => ({
            content: r.content,
            channel: "Manual",
            customerLabel: r.customerLabel,
            status: "PENDING" as const,
            workspaceId: session.user.workspaceId,
            userId: session.user.id,
        })),
    });

    classifyBatch(session.user.workspaceId, result.count, insertedAt).catch((err) =>
        console.error("[AI] Survey batch classify error:", err)
    );

    return NextResponse.json({
        success: true,
        message: `${result.count} demo feedback records imported successfully.`,
        records: result.count,
    });
}
