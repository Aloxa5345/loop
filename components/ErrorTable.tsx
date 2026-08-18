"use client";

export interface UploadError {
    row: number;
    message: string;
}

interface Props {
    errors: UploadError[];
    onDownload?: () => void;
}

export default function ErrorTable({ errors, onDownload }: Props) {
    if (errors.length === 0) return null;

    return (
        <div className="error-section">
            <h4>❌ Failed Rows ({errors.length})</h4>
            <div className="error-table-wrap">
                <table className="error-table">
                    <thead>
                        <tr>
                            <th>Row</th>
                            <th>Reason</th>
                        </tr>
                    </thead>
                    <tbody>
                        {errors.map((err) => (
                            <tr key={err.row}>
                                <td className="error-row-num">Row {err.row}</td>
                                <td>{err.message}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {onDownload && (
                <button
                    type="button"
                    className="summary-download-btn"
                    style={{ marginTop: "14px" }}
                    onClick={onDownload}
                >
                    ⬇️ Download Error Report
                </button>
            )}
        </div>
    );
}
