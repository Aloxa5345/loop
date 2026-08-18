import { PrismaClient, Role, FeedbackStatus } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Seeding database...");

    // ── Users ──────────────────────────────────────────────
    const adminHash = await bcrypt.hash("Admin@123", 12);
    const analystHash = await bcrypt.hash("Analyst@123", 12);
    const viewerHash = await bcrypt.hash("Viewer@123", 12);

    const admin = await prisma.user.upsert({
        where: { email: "admin@loopai.com" },
        update: {},
        create: {
            name: "LOOP Admin",
            email: "admin@loopai.com",
            passwordHash: adminHash,
        },
    });

    const analyst = await prisma.user.upsert({
        where: { email: "analyst@loopai.com" },
        update: {},
        create: {
            name: "LOOP Analyst",
            email: "analyst@loopai.com",
            passwordHash: analystHash,
        },
    });

    const viewer = await prisma.user.upsert({
        where: { email: "viewer@loopai.com" },
        update: {},
        create: {
            name: "LOOP Viewer",
            email: "viewer@loopai.com",
            passwordHash: viewerHash,
        },
    });

    // ── Workspace ──────────────────────────────────────────
    const workspace = await prisma.workspace.upsert({
        where: { id: "loop-demo-workspace" },
        update: {},
        create: {
            id: "loop-demo-workspace",
            name: "LOOP AI Demo Workspace",
            description: "Demo workspace for evaluating LOOP AI platform",
            industry: "SaaS",
            ownerId: admin.id,
        },
    });

    // ── Workspace Members ──────────────────────────────────
    await prisma.workspaceMember.upsert({
        where: { workspaceId_userId: { workspaceId: workspace.id, userId: admin.id } },
        update: {},
        create: { workspaceId: workspace.id, userId: admin.id, role: Role.ADMIN },
    });

    await prisma.workspaceMember.upsert({
        where: { workspaceId_userId: { workspaceId: workspace.id, userId: analyst.id } },
        update: {},
        create: { workspaceId: workspace.id, userId: analyst.id, role: Role.ANALYST },
    });

    await prisma.workspaceMember.upsert({
        where: { workspaceId_userId: { workspaceId: workspace.id, userId: viewer.id } },
        update: {},
        create: { workspaceId: workspace.id, userId: viewer.id, role: Role.VIEWER },
    });

    // ── Themes ─────────────────────────────────────────────
    const themes = await Promise.all([
        prisma.theme.upsert({
            where: { id: "theme-performance" },
            update: {},
            create: {
                id: "theme-performance",
                name: "Performance",
                description: "Speed, load times, and system performance issues",
                color: "#ef4444",
                workspaceId: workspace.id,
            },
        }),
        prisma.theme.upsert({
            where: { id: "theme-ux" },
            update: {},
            create: {
                id: "theme-ux",
                name: "UX & Design",
                description: "User experience and interface design feedback",
                color: "#8b5cf6",
                workspaceId: workspace.id,
            },
        }),
        prisma.theme.upsert({
            where: { id: "theme-ai" },
            update: {},
            create: {
                id: "theme-ai",
                name: "AI Features",
                description: "AI classification, insights and chat features",
                color: "#3b82f6",
                workspaceId: workspace.id,
            },
        }),
        prisma.theme.upsert({
            where: { id: "theme-reporting" },
            update: {},
            create: {
                id: "theme-reporting",
                name: "Reporting",
                description: "Report generation, export and scheduling",
                color: "#10b981",
                workspaceId: workspace.id,
            },
        }),
    ]);

    // ── Feedback ───────────────────────────────────────────
    const feedbackData = [
        {
            content: "The dashboard takes too long to load when there are many feedback entries. It becomes unusable.",
            channel: "Support Ticket",
            customerLabel: "Enterprise",
            sentiment: "negative",
            sentimentScore: -0.8,
            status: FeedbackStatus.ANALYZED,
            aiStatus: "Analyzed",
            category: "Performance",
            priority: "High",
            rating: 2,
            title: "Dashboard loading too slow",
            themeId: "theme-performance",
        },
        {
            content: "AI reports are incredibly helpful. The insights save our team hours every week.",
            channel: "Email",
            customerLabel: "Premium Customer",
            sentiment: "positive",
            sentimentScore: 0.9,
            status: FeedbackStatus.ANALYZED,
            aiStatus: "Analyzed",
            category: "AI Features",
            priority: "Low",
            rating: 5,
            title: "Love the AI reports",
            themeId: "theme-ai",
        },
        {
            content: "Please add dark mode. The white background is very harsh on the eyes during late-night sessions.",
            channel: "Survey",
            customerLabel: "Startup",
            sentiment: "neutral",
            sentimentScore: -0.1,
            status: FeedbackStatus.ANALYZED,
            aiStatus: "Analyzed",
            category: "UX & Design",
            priority: "Medium",
            rating: 3,
            title: "Dark mode request",
            themeId: "theme-ux",
        },
        {
            content: "The CSV export feature is broken. When I try to export more than 500 rows it times out.",
            channel: "App Store",
            customerLabel: "Enterprise",
            sentiment: "negative",
            sentimentScore: -0.7,
            status: FeedbackStatus.ANALYZED,
            aiStatus: "Analyzed",
            category: "Reporting",
            priority: "High",
            rating: 2,
            title: "CSV export times out",
            themeId: "theme-reporting",
        },
        {
            content: "Ask LOOP AI chat is amazing! It answered my questions about trends in seconds.",
            channel: "In-App",
            customerLabel: "Mid-Market",
            sentiment: "positive",
            sentimentScore: 0.95,
            status: FeedbackStatus.ANALYZED,
            aiStatus: "Analyzed",
            category: "AI Features",
            priority: "Low",
            rating: 5,
            title: "Ask LOOP is great",
            themeId: "theme-ai",
        },
        {
            content: "Filtering feedback by date range doesn't work correctly. Results include wrong dates.",
            channel: "Support Ticket",
            customerLabel: "SMB",
            sentiment: "negative",
            sentimentScore: -0.6,
            status: FeedbackStatus.REVIEWED,
            aiStatus: "Analyzed",
            category: "UX & Design",
            priority: "High",
            rating: 1,
            title: "Date filter bug",
            themeId: "theme-ux",
        },
        {
            content: "The scheduled report emails are really convenient. Great feature for weekly reviews.",
            channel: "Email",
            customerLabel: "Enterprise",
            sentiment: "positive",
            sentimentScore: 0.85,
            status: FeedbackStatus.ANALYZED,
            aiStatus: "Analyzed",
            category: "Reporting",
            priority: "Low",
            rating: 5,
            title: "Scheduled reports are convenient",
            themeId: "theme-reporting",
        },
        {
            content: "Onboarding flow is confusing. New users don't know where to start after signing up.",
            channel: "Survey",
            customerLabel: "Startup",
            sentiment: "negative",
            sentimentScore: -0.5,
            status: FeedbackStatus.PENDING,
            aiStatus: "Pending",
            category: "UX & Design",
            priority: "Medium",
            rating: 3,
            title: "Confusing onboarding",
            themeId: "theme-ux",
        },
    ];

    for (const fb of feedbackData) {
        const { themeId, ...feedbackFields } = fb;
        const feedback = await prisma.feedback.create({
            data: {
                ...feedbackFields,
                workspaceId: workspace.id,
                userId: admin.id,
                keywords: feedbackFields.category,
                aiSummary: `AI Summary: ${feedbackFields.title}`,
            },
        });

        await prisma.feedbackTheme.upsert({
            where: { feedbackId_themeId: { feedbackId: feedback.id, themeId } },
            update: {},
            create: { feedbackId: feedback.id, themeId, confidence: 0.85 },
        });
    }

    console.log("✅ Seed complete!");
    console.log("");
    console.log("Demo credentials:");
    console.log("  Admin   → admin@loopai.com   / Admin@123");
    console.log("  Analyst → analyst@loopai.com / Analyst@123");
    console.log("  Viewer  → viewer@loopai.com  / Viewer@123");
}

main()
    .catch((e) => {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
