"use client";

interface ParsedRow {
    row: number;
    content: string;
    channel: string;
    customerLabel: string;
    createdAt: string;
    valid: boolean;
    error?: string;
}

interface Props {
    rows: ParsedRow[];
}

const MAX_PREVIEW = 50;

export default function CsvPreview({ rows }: Props) {
    const validCount = rows.filter((r) => r.valid).length;
    const invalidCount = rows.length - validCount;
    const display = rows.slice(0, MAX_PREVIEW);

    return (
        <div className="preview-section">
            <div className="preview-header">
                <h3>📋 Preview</h3>
                <div className="preview-meta">
                    <span>Total: <strong>{rows.length}</strong></span>
                    <span style={{ color: "#4ade80" }}>✅ Valid: <strong>{validCount}</strong></span>
                    {invalidCount > 0 && (
                        <span style={{ color: "#f87171" }}>❌ Invalid: <strong>{invalidCount}</strong></span>
                    )}
                    {rows.length > MAX_PREVIEW && (
                        <span style={{ color: "#64748b" }}>Showing first {MAX_PREVIEW} rows</span>
                    )}
                </div>
            </div>

            <div className="preview-table-wrap">
                <table className="preview-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Channel</th>
                            <th>Customer</th>
                            <th>Content</th>
                            <th>Date</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {display.map((row) => (
                            <tr key={row.row}>
                                <td style={{ color: "#64748b" }}>{row.row}</td>
                                <td>{row.channel || <span style={{ color: "#64748b" }}>—</span>}</td>
                                <td>{row.customerLabel || <span style={{ color: "#64748b" }}>—</span>}</td>
                                <td style={{ maxWidth: "200px" }}>
                                    {row.content
                                        ? row.content.length > 60
                                            ? row.content.slice(0, 60) + "…"
                                            : row.content
                                        : <span style={{ color: "#64748b" }}>—</span>
                                    }
                                </td>
                                <td>{row.createdAt || <span style={{ color: "#64748b" }}>—</span>}</td>
                                <td>
                                    {row.valid
                                        ? <span className="row-valid" title="Valid">✅</span>
                                        : <span className="row-invalid" title={row.error ?? "Invalid"}>❌</span>
                                    }
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
