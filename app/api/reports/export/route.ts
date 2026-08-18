import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { hasPermission, type RoleKey } from "@/app/lib/permissions";
import { getReportData, getDateRange } from "@/app/lib/reportData";

// POST /api/reports/export
// Body: { format: "CSV" | "Excel", preset?: string, from?: string, to?: string }
export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = session.user.role as RoleKey;
    if (!hasPermission(role, "export-reports")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json() as {
        format?: string; preset?: string; from?: string; to?: string;
    };
    const format = (body.format ?? "CSV").toUpperCase();

    let from: Date, to: Date;
    if (body.from && body.to) {
        from = new Date(body.from);
        to = new Date(body.to); to.setHours(23, 59, 59, 999);
    } else {
        ({ from, to } = getDateRange(body.preset ?? "30d"));
    }

    const data = await getReportData({ workspaceId: session.user.workspaceId, from, to });
    const dateStr = new Date().toISOString().slice(0, 10);

    if (format === "CSV") {
        const headers = ["Content", "Channel", "Customer", "Status", "Sentiment", "Topics", "Summary", "Created"];
        const rows = data.feedbacks.map((f) => [
            `"${(f.content ?? "").replace(/"/g, '""')}"`,
            `"${f.channel}"`,
            `"${f.customerLabel}"`,
            `"${f.status}"`,
            `"${f.sentiment ?? ""}"`,
            `"${f.topics ?? ""}"`,
            `"${(f.aiSummary ?? "").replace(/"/g, '""')}"`,
            `"${f.createdAt.toISOString().slice(0, 10)}"`,
        ]);
        const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

        return new NextResponse(csv, {
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="loop-report-${dateStr}.csv"`,
            },
        });
    }

    if (format === "EXCEL") {
        // Excel-compatible TSV (opens natively in Excel)
        const sheet1Header = ["Content", "Channel", "Customer", "Status", "Sentiment", "Topics", "Summary", "Created"].join("\t");
        const sheet1Rows = data.feedbacks.map((f) =>
            [f.content, f.channel, f.customerLabel, f.status, f.sentiment ?? "", f.topics ?? "", f.aiSummary ?? "", f.createdAt.toISOString().slice(0, 10)].join("\t")
        );

        const analyticsRows = [
            ["Metric", "Value"].join("\t"),
            ["Total Feedback", data.total].join("\t"),
            ["Positive", data.positive].join("\t"),
            ["Neutral", data.neutral].join("\t"),
            ["Negative", data.negative].join("\t"),
            ["Unanalyzed", data.unanalyzed].join("\t"),
            "",
            ["Channel", "Count"].join("\t"),
            ...data.byChannel.map((c) => `${c.channel}\t${c.count}`),
            "",
            ["Top Topic", "Count"].join("\t"),
            ...data.topTopics.map((t) => `${t.topic}\t${t.count}`),
        ];

        const content = [
            "=== Feedback Data ===",
            sheet1Header,
            ...sheet1Rows,
            "",
            "=== Analytics ===",
            ...analyticsRows,
            "",
            "=== AI Recommendations ===",
            ["Recommendation", "Count"].join("\t"),
            ...data.topRecommendations.map((r) => `${r.rec}\t${r.count}`),
        ].join("\n");

        return new NextResponse(content, {
            headers: {
                "Content-Type": "application/vnd.ms-excel; charset=utf-8",
                "Content-Disposition": `attachment; filename="loop-report-${dateStr}.xls"`,
            },
        });
    }

    return NextResponse.json({ error: "Unsupported format. Use CSV or Excel." }, { status: 400 });
}
