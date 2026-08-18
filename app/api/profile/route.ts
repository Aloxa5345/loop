/**
 * PATCH /api/profile — update the current user's name and/or password.
 * Any authenticated user can call this.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import bcrypt from "bcrypt";

export async function PATCH(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({})) as {
        name?: string;
        currentPassword?: string;
        newPassword?: string;
    };

    const updates: Record<string, string> = {};

    // ── Name update ──────────────────────────────────────────
    if (body.name !== undefined) {
        const n = body.name.trim();
        if (n.length < 2) return NextResponse.json({ error: "Name must be at least 2 characters." }, { status: 400 });
        if (n.length > 60) return NextResponse.json({ error: "Name must be 60 characters or less." }, { status: 400 });
        updates.name = n;
    }

    // ── Password update ──────────────────────────────────────
    if (body.newPassword !== undefined) {
        if (!body.currentPassword) {
            return NextResponse.json({ error: "Current password is required." }, { status: 400 });
        }
        if (body.newPassword.length < 8) {
            return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { passwordHash: true },
        });
        if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

        const valid = await bcrypt.compare(body.currentPassword, user.passwordHash);
        if (!valid) return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });

        updates.passwordHash = await bcrypt.hash(body.newPassword, 12);
    }

    if (Object.keys(updates).length === 0) {
        return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
    }

    const updated = await prisma.user.update({
        where: { id: session.user.id },
        data: updates,
        select: { id: true, name: true, email: true },
    });

    return NextResponse.json(updated);
}
