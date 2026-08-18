"use client";

import { useState, useCallback } from "react";
import Papa from "papaparse";
import CsvUpload from "@/components/CsvUpload";
import CsvPreview from "@/components/CsvPreview";
import UploadProgress from "@/components/UploadProgress";
import UploadSummary from "@/components/UploadSummary";
import type { UploadError } from "@/components/ErrorTable";

interface ParsedRow {
    row: number;
    content: string;
    channel: string;
    customerLabel: string;
    createdAt: string;
    valid: boolean;
    error?: string;
}

interface UploadResult {
    totalRows: number;
    importedRows: number;
    failedRows: number;
    errors: UploadError[];
}

function validateRow(raw: Record<string, string>): { valid: true } | { valid: false; error: string } {
    const reasons: string[] = [];
    const content = (raw["content"] ?? "").trim();
    const channel = (raw["channel"] ?? "").trim();
    const label = (raw["customer_label"] ?? "").trim();
    const date = (raw["created_at"] ?? "").trim();

    if (!content) reasons.push("Content is required");
    else if (content.length > 5000) reasons.push("Content too long (max 5000 chars)");
    if (!channel) reasons.push("Channel is required");
    if (!label) reasons.push("Customer label is required");
    if (date && isNaN(Date.parse(date))) reasons.push("Invalid date");

    return reasons.length === 0 ? { valid: true } : { valid: false, error: reasons.join("; ") };
}

type Stage = "idle" | "preview" | "uploading" | "done";

export default function UploadClient() {
    const [file, setFile] = useState<File | null>(null);
    const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
    const [stage, setStage] = useState<Stage>("idle");
    const [progress, setProgress] = useState({ processed: 0, imported: 0, failed: 0 });
    const [result, setResult] = useState<UploadResult | null>(null);
    const [error, setError] = useState("");

    const handleFile = useCallback((f: File) => {
        setFile(f);
        setParsedRows([]);
        setStage("idle");
        setError("");
        setResult(null);
    }, []);

    function parseFile(f: File): Promise<ParsedRow[]> {
        return new Promise((resolve, reject) => {
            Papa.parse<Record<string, string>>(f, {
                header: true,
                skipEmptyLines: true,
                transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, "_"),
                transform: (v) => v.trim(),
                complete(results) {
                    const rows: ParsedRow[] = results.data.map((raw, i) => {
                        const check = validateRow(raw);
                        return {
                            row: i + 2,
                            content: raw["content"] ?? "",
                            channel: raw["channel"] ?? "",
                            customerLabel: raw["customer_label"] ?? "",
                            createdAt: raw["created_at"] ?? "",
                            valid: check.valid,
                            error: check.valid ? undefined : check.error,
                        };
                    });
                    resolve(rows);
                },
                error(err) {
                    reject(new Error(err.message));
                },
            });
        });
    }

    async function handlePreview() {
        if (!file) return;
        setError("");
        try {
            const rows = await parseFile(file);
            if (!rows.length) { setError("The CSV file is empty."); return; }
            setParsedRows(rows);
            setStage("preview");
        } catch (e) {
            setError(`Failed to parse CSV: ${e instanceof Error ? e.message : "unknown error"}`);
        }
    }

    async function handleUpload() {
        if (!file) return;

        // If not yet previewed, parse first
        let rows = parsedRows;
        if (!rows.length) {
            try {
                rows = await parseFile(file);
                if (!rows.length) { setError("The CSV file is empty."); return; }
                setParsedRows(rows);
            } catch (e) {
                setError(`Failed to parse CSV: ${e instanceof Error ? e.message : "unknown error"}`);
                return;
            }
        }

        const validCount = rows.filter((r) => r.valid).length;
        if (validCount === 0) {
            setError("No valid rows found. Please check your CSV format.");
            setStage("preview");
            return;
        }

        setStage("uploading");
        setError("");

        const total = rows.length;
        let tick = 0;
        const interval = setInterval(() => {
            tick = Math.min(tick + Math.ceil(total * 0.05), Math.floor(total * 0.9));
            setProgress((p) => ({ ...p, processed: tick }));
        }, 200);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/upload", { method: "POST", body: formData });
            clearInterval(interval);

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                setError(data.error ?? "Upload failed. Please try again.");
                setStage("preview");
                return;
            }

            setProgress({
                processed: data.totalRows ?? 0,
                imported: data.importedRows ?? 0,
                failed: data.failedRows ?? 0,
            });
            setResult(data);
            setStage("done");

            // Auto-redirect to feedback page after 2 seconds if all rows imported
            if ((data.importedRows ?? 0) > 0) {
                setTimeout(() => {
                    window.location.href = "/feedback";
                }, 2000);
            }
        } catch {
            clearInterval(interval);
            setError("Network error. Please check the server is running and try again.");
            setStage("preview");
        }
    }

    function handleReset() {
        setFile(null);
        setParsedRows([]);
        setStage("idle");
        setError("");
        setResult(null);
        setProgress({ processed: 0, imported: 0, failed: 0 });
    }

    return (
        <div>
            {/* Error banner */}
            {error && (
                <div role="alert" style={{
                    background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
                    borderRadius: "12px", padding: "14px 18px", color: "#fca5a5",
                    fontSize: "14px", marginBottom: "20px",
                }}>
                    ⚠️ {error}
                </div>
            )}

            {/* File picker + action buttons */}
            {stage !== "done" && (
                <>
                    <CsvUpload onFile={handleFile} disabled={stage === "uploading"} />

                    {file && stage !== "uploading" && (
                        <div className="upload-actions">
                            <button
                                type="button"
                                className="upload-preview-btn"
                                onClick={handlePreview}
                            >
                                👁️ Preview & Validate
                            </button>
                            <button
                                type="button"
                                className="upload-submit-btn"
                                onClick={handleUpload}
                            >
                                ⬆️ Upload CSV
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Progress */}
            {stage === "uploading" && (
                <UploadProgress
                    total={parsedRows.length || 1}
                    processed={progress.processed}
                    imported={progress.imported}
                    failed={progress.failed}
                />
            )}

            {/* Preview table */}
            {stage === "preview" && parsedRows.length > 0 && (
                <>
                    <CsvPreview rows={parsedRows} />
                    {parsedRows.filter(r => r.valid).length > 0 && (
                        <div style={{ marginTop: "16px", display: "flex", gap: "10px" }}>
                            <button
                                type="button"
                                className="upload-submit-btn"
                                onClick={handleUpload}
                            >
                                ⬆️ Upload {parsedRows.filter(r => r.valid).length} Valid Rows
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Result */}
            {stage === "done" && result && (
                <UploadSummary
                    totalRows={result.totalRows}
                    importedRows={result.importedRows}
                    failedRows={result.failedRows}
                    errors={result.errors}
                    onReset={handleReset}
                />
            )}
        </div>
    );
}
