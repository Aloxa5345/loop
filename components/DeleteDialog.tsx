"use client";

interface Props {
    onConfirm: () => void;
    onCancel: () => void;
    loading?: boolean;
}

export default function DeleteDialog({ onConfirm, onCancel, loading = false }: Props) {
    return (
        <div className="fb-overlay" role="dialog" aria-modal="true" aria-labelledby="delete-title">
            <div className="fb-dialog">
                <div className="fb-dialog-icon">🗑️</div>
                <h3 id="delete-title">Delete Feedback?</h3>
                <p>This action cannot be undone. The feedback entry will be permanently removed.</p>
                <div className="fb-dialog-actions">
                    <button
                        className="fb-dialog-cancel"
                        onClick={onCancel}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        className="fb-dialog-confirm"
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? "Deleting…" : "Delete"}
                    </button>
                </div>
            </div>
        </div>
    );
}
