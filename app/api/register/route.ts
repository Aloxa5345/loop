import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/app/lib/prisma";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, password } = body as {
            name?: string;
            email?: string;
            password?: string;
        };

        if (!name || name.trim().length < 2)
            return NextResponse.json({ error: "Name must be at least 2 characters." }, { status: 400 });
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
            return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
        if (!password || password.length < 8)
            return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });

        const cleanEmail = email.trim().toLowerCase();
        const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
        if (existing)
            return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });

        const passwordHash = await bcrypt.hash(password, 10);

        // Create user first, then workspace, then membership
        const user = await prisma.user.create({
            data: { name: name.trim(), email: cleanEmail, passwordHash },
        });

        const workspace = await prisma.workspace.create({
            data: {
                name: `${name.trim()}'s Workspace`,
                ownerId: user.id,
                members: {
                    create: { userId: user.id, role: "ADMIN" },
                },
            },
        });

        return NextResponse.json(
            { message: "Account created successfully.", userId: user.id, workspaceId: workspace.id, role: "ADMIN" },
            { status: 201 }
        );
    } catch (err) {
        console.error("[POST /api/register]", err);
        return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
    }
}
