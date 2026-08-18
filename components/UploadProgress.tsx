"use client";

interface Props {
    total: number;
    processed: number;
    imported: number;
    failed: number;
}

export default function UploadProgress({ total, processed, imported, failed }: Props) {
    const pct = total > 0 ? Math.round((processed / total) * 100) : 0;

    return (
        <div className="upload-progress-wrap">
            <h4>⏳ Importing… {pct}%</h4>

            <div className="progress-bar-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
            </div>

            <div className="progress-stats">
                <span>Processed: <strong>{processed} / {total}</strong></span>
                <span style={{ color: "#4ade80" }}>Imported: <strong>{imported}</strong></span>
                <span style={{ color: "#f87171" }}>Failed: <strong>{failed}</strong></span>
            </div>
        </div>
    );
}
