"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

interface Props {
    onFile: (file: File) => void;
    disabled?: boolean;
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function CsvUpload({ onFile, disabled = false }: Props) {
    const [selected, setSelected] = useState<File | null>(null);

    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            const file = acceptedFiles[0];
            if (!file) return;
            setSelected(file);
            onFile(file);
        },
        [onFile]
    );

    const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
        onDrop,
        accept: { "text/csv": [".csv"] },
        maxFiles: 1,
        disabled,
        // Disable the automatic click-to-open so our button controls it
        noClick: true,
        noKeyboard: false,
    });

    function handleRemove(e: React.MouseEvent) {
        e.stopPropagation();
        setSelected(null);
    }

    return (
        <div>
            {/* Drop zone — drag target only, not clickable */}
            <div
                {...getRootProps()}
                className={`dropzone-wrap${isDragActive ? " drag-active" : ""}`}
                aria-label="CSV file upload area"
            >
                <input {...getInputProps()} />
                <div className="dropzone-icon">📂</div>
                <h3>Upload Feedback CSV</h3>
                <p>Drag &amp; drop your CSV file here, or click the button below</p>

                {/* Button lives inside the dropzone visually but triggers open() directly */}
                <button
                    type="button"
                    className="dropzone-btn"
                    disabled={disabled}
                    onClick={(e) => {
                        e.stopPropagation();
                        open();
                    }}
                >
                    Choose CSV
                </button>
            </div>

            {/* Selected file info */}
            {selected && (
                <div className="file-info">
                    <div className="file-info-icon">📄</div>
                    <div className="file-info-details">
                        <h4>{selected.name}</h4>
                        <span>{formatBytes(selected.size)}</span>
                    </div>
                    <button
                        type="button"
                        className="file-remove-btn"
                        onClick={handleRemove}
                        aria-label="Remove file"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Format hint */}
            <div className="format-hint" suppressHydrationWarning>
                <h4>CSV Column Format</h4>
                <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "10px" }}>
                    Required: <strong style={{ color: "#22d3ee" }}>content</strong>, <strong style={{ color: "#22d3ee" }}>channel</strong>, <strong style={{ color: "#22d3ee" }}>customer_label</strong>
                    {" · "}Optional: title, customer_email, priority, category, product_area, rating, created_at
                </p>
                <code>
                    content,channel,customer_label,title,customer_email,priority,category,product_area,rating,created_at<br />
                    Dashboard is slow,WhatsApp,Enterprise,Slow load time,john@co.com,High,Bug Report,Dashboard,2,2026-08-01<br />
                    Add dark mode,Email,Premium Customer,Dark mode request,sarah@co.com,Medium,Feature Request,Web Application,4,2026-08-02<br />
                    Great AI reports,App Store Review,Startup,Excellent AI,rahul@co.com,Low,Appreciation,AI Reports,5,2026-08-03
                </code>
                <p style={{ fontSize: "11px", color: "#475569", marginTop: "10px" }}>
                    <strong>Channels:</strong> Email · WhatsApp · Telegram · Facebook · Instagram · X / Twitter · LinkedIn · Phone Call · Support Ticket · Live Chat · Chatbot · App Store Review · Google Play Review · Survey · Website Form · Sales Notes · Other
                </p>
                <p style={{ fontSize: "11px", color: "#475569", marginTop: "6px" }}>
                    <strong>Priority:</strong> High · Medium · Low
                    {" · "}
                    <strong>Category:</strong> Bug Report · Feature Request · Appreciation · Complaint · Performance · UI/UX · Billing · Other
                </p>
            </div>
        </div>
    );
}
