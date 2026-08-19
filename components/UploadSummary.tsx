
"use client";

import Link from "next/link";
import ErrorTable, { type UploadError } from "./ErrorTable";

interface Props {
    totalRows: number;
    importedRows: number;
    failedRows: number;
    errors: UploadError[];
    onReset: () => void;
}

export default function UploadSummary({
    totalRows, importedRows, failedRows, errors, onReset,
}: Props) {
    function downloadErrors() {
        const lines = ["Row,Reason", ...errors.map((e) => `${e.row},"${e.message}"`)];
        const blob = new Blob([lines.join("\n")], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "import-errors.csv";
        a.click();
        URL.revokeObjectURL(url);
    }

    return (
        <div className="summary-wrap">
            <div className="summary-card">
                <div className="summary-title">
                    <span style={{ fontSize: "32px" }}>
                        {failedRows === 0 ? "🎉" : "⚠️"}
                    </span>
                    <h3>Import {failedRows === 0 ? "Complete" : "Finished with Errors"}</h3>
                </div>

                <div className="summary-stats">
                    <div className="summary-stat neutral">
                        <h5>Total Rows</h5>
                        <h2>{totalRows}</h2>
                    </div>
                    <div className="summary-stat success">
                        <h5>Imported</h5>
                        <h2>{importedRows}</h2>
                    </div>
                    <div className="summary-stat danger">
                        <h5>Failed</h5>
                        <h2>{failedRows}</h2>
                    </div>
                </div>

                <div className="summary-actions">
                    <Link href="/feedback" className="summary-view-btn">
                        📋 View Feedback
                    </Link>
                    {failedRows > 0 && (
                        <button type="button" className="summary-download-btn" onClick={downloadErrors}>
                            ⬇️ Download Error Report
                        </button>
                    )}
                    <button type="button" className="summary-again-btn" onClick={onReset}>
                        ↩ Upload Another
                    </button>
                </div>

                {errors.length > 0 && (
                    <ErrorTable errors={errors} />
                )}
            </div>
        </div>
    );
}
