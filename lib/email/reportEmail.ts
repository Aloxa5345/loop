/**
 * reportEmail.ts — builds the HTML email for a LOOP feedback report.
 */

export interface ReportEmailData {
    workspaceName: string;
    recipientName?: string;
    from: Date;
    to: Date;
    total: number;
    positive: number;
    neutral: number;
    negative: number;
    unanalyzed: number;
    topTopics: { topic: string; count: number }[];
    topRecommendations: { rec: string; count: number }[];
    byChannel: { channel: string; count: number }[];
    appUrl?: string;
}

function pct(n: number, total: number): string {
    if (total === 0) return "0%";
    return `${Math.round((n / total) * 100)}%`;
}

export function buildReportEmail(d: ReportEmailData): { subject: string; html: string; text: string } {
    const appUrl = d.appUrl ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const dateRange = `${d.from.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} – ${d.to.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    const posPct = pct(d.positive, d.total);
    const negPct = pct(d.negative, d.total);
    const neuPct = pct(d.neutral, d.total);

    const topTopicRows = d.topTopics.slice(0, 5).map((t, i) =>
        `<tr style="border-bottom:1px solid #1e293b">
            <td style="padding:10px 16px;color:#94a3b8;font-size:13px">${i + 1}</td>
            <td style="padding:10px 16px;color:#e2e8f0;font-size:13px;font-weight:600">${t.topic}</td>
            <td style="padding:10px 16px;color:#22d3ee;font-size:13px;font-weight:700">${t.count}</td>
        </tr>`
    ).join("");

    const topRecRows = d.topRecommendations.slice(0, 3).map((r, i) =>
        `<li style="padding:8px 0;color:#cbd5e1;font-size:13px;border-bottom:1px solid #1e293b;line-height:1.6">
            <span style="color:${i === 0 ? "#f87171" : i === 1 ? "#fbbf24" : "#4ade80"};font-weight:700;margin-right:6px">${i === 0 ? "🔴" : i === 1 ? "🟡" : "🟢"} ${i === 0 ? "High" : i === 1 ? "Medium" : "Low"}</span>
            ${r.rec}
        </li>`
    ).join("");

    const channelRows = d.byChannel.slice(0, 5).map(c =>
        `<tr>
            <td style="padding:8px 14px;color:#94a3b8;font-size:12px">${c.channel}</td>
            <td style="padding:8px 14px;color:#e2e8f0;font-size:12px;font-weight:600">${c.count}</td>
        </tr>`
    ).join("");

    const subject = `📊 LOOP Report — ${d.workspaceName} · ${dateRange}`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#030712;font-family:'Inter',Arial,sans-serif;color:#f1f5f9">

<!-- Wrapper -->
<table width="100%" cellpadding="0" cellspacing="0" style="background:#030712;padding:32px 16px">
<tr><td align="center">
<table width="620" cellpadding="0" cellspacing="0" style="max-width:620px;width:100%">

  <!-- Header -->
  <tr>
    <td style="background:linear-gradient(135deg,#0f1629,#1a0533);border-radius:20px 20px 0 0;padding:36px 40px;text-align:center;border:1px solid rgba(255,255,255,0.08);border-bottom:none">
      <div style="font-size:28px;margin-bottom:8px">🔮</div>
      <div style="font-size:26px;font-weight:900;letter-spacing:0.1em;background:linear-gradient(90deg,#22d3ee,#818cf8,#c084fc);-webkit-background-clip:text;-webkit-text-fill-color:transparent;display:inline-block">LOOP</div>
      <p style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;margin:6px 0 0">AI Customer Feedback Intelligence</p>
      <div style="margin-top:20px;padding:12px 20px;background:rgba(6,182,212,0.1);border:1px solid rgba(6,182,212,0.2);border-radius:12px;display:inline-block">
        <p style="margin:0;color:#22d3ee;font-size:13px;font-weight:600">📊 Feedback Report — ${d.workspaceName}</p>
        <p style="margin:4px 0 0;color:#475569;font-size:12px">${dateRange}</p>
      </div>
    </td>
  </tr>

  <!-- Stats row -->
  <tr>
    <td style="background:#0c1220;border:1px solid rgba(255,255,255,0.06);border-top:none;border-bottom:none;padding:28px 40px">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          ${[
            { label: "Total", value: d.total.toLocaleString(), color: "#e2e8f0" },
            { label: "😊 Positive", value: posPct, color: "#4ade80" },
            { label: "😐 Neutral", value: neuPct, color: "#fbbf24" },
            { label: "😞 Negative", value: negPct, color: "#f87171" },
        ].map(s =>
            `<td align="center" style="padding:16px 8px;background:rgba(255,255,255,0.03);border-radius:12px;margin:4px">
                <div style="font-size:26px;font-weight:900;color:${s.color}">${s.value}</div>
                <div style="font-size:11px;color:#475569;text-transform:uppercase;letter-spacing:0.06em;margin-top:4px">${s.label}</div>
              </td>`
        ).join('<td width="8"></td>')}
        </tr>
      </table>
    </td>
  </tr>

  <!-- Top Topics -->
  ${topTopicRows ? `
  <tr>
    <td style="background:#0c1220;border:1px solid rgba(255,255,255,0.06);border-top:none;border-bottom:none;padding:0 40px 24px">
      <h3 style="font-size:14px;font-weight:700;color:#e2e8f0;margin:0 0 14px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.05)">🏷️ Top Themes</h3>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border-radius:12px;overflow:hidden">
        <tr style="background:rgba(79,70,229,0.2)">
          <th style="padding:10px 16px;text-align:left;font-size:11px;color:#a5b4fc;text-transform:uppercase;letter-spacing:0.05em;font-weight:600">#</th>
          <th style="padding:10px 16px;text-align:left;font-size:11px;color:#a5b4fc;text-transform:uppercase;letter-spacing:0.05em;font-weight:600">Theme</th>
          <th style="padding:10px 16px;text-align:left;font-size:11px;color:#a5b4fc;text-transform:uppercase;letter-spacing:0.05em;font-weight:600">Count</th>
        </tr>
        ${topTopicRows}
      </table>
    </td>
  </tr>` : ""}

  <!-- Recommendations -->
  ${topRecRows ? `
  <tr>
    <td style="background:#0c1220;border:1px solid rgba(255,255,255,0.06);border-top:none;border-bottom:none;padding:0 40px 24px">
      <h3 style="font-size:14px;font-weight:700;color:#e2e8f0;margin:0 0 14px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.05)">💡 AI Recommendations</h3>
      <ul style="margin:0;padding:0;list-style:none">${topRecRows}</ul>
    </td>
  </tr>` : ""}

  <!-- Channels -->
  ${channelRows ? `
  <tr>
    <td style="background:#0c1220;border:1px solid rgba(255,255,255,0.06);border-top:none;border-bottom:none;padding:0 40px 24px">
      <h3 style="font-size:14px;font-weight:700;color:#e2e8f0;margin:0 0 14px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.05)">📡 Top Channels</h3>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border-radius:12px;overflow:hidden">
        ${channelRows}
      </table>
    </td>
  </tr>` : ""}

  <!-- CTA Footer -->
  <tr>
    <td style="background:linear-gradient(135deg,#0f1629,#1a0533);border-radius:0 0 20px 20px;padding:28px 40px;text-align:center;border:1px solid rgba(255,255,255,0.08);border-top:none">
      <a href="${appUrl}/reports" style="display:inline-block;padding:13px 32px;background:linear-gradient(90deg,#06b6d4,#4f46e5,#7c3aed);border-radius:12px;color:#fff;text-decoration:none;font-weight:700;font-size:14px;letter-spacing:0.02em">
        View Full Report →
      </a>
      <p style="margin:16px 0 0;color:#334155;font-size:11px">
        This report was automatically sent by LOOP · ${d.workspaceName}<br/>
        <a href="${appUrl}/reports" style="color:#475569">Manage schedules</a>
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;

    const text = `LOOP Report — ${d.workspaceName}
${dateRange}

SUMMARY
Total: ${d.total} | Positive: ${posPct} | Neutral: ${neuPct} | Negative: ${negPct}

TOP THEMES
${d.topTopics.slice(0, 5).map((t, i) => `${i + 1}. ${t.topic} (${t.count})`).join("\n")}

RECOMMENDATIONS
${d.topRecommendations.slice(0, 3).map((r, i) => `${i + 1}. ${r.rec}`).join("\n")}

View full report: ${appUrl}/reports`;

    return { subject, html, text };
}
