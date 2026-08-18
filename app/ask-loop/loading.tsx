export default function AskLoopLoading() {
    return (
        <div className="dashboard">
            <div style={{ width: 260, flexShrink: 0 }} />
            <div className="main" style={{ display: "flex", flexDirection: "column", gap: 20, paddingTop: 32 }}>
                <div style={{ height: 36, width: 220, borderRadius: 10, background: "rgba(255,255,255,.06)" }} />
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {[120, 160, 140, 180, 130, 150].map((w, i) => (
                        <div key={i} style={{ height: 34, width: w, borderRadius: 20, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.06)" }} />
                    ))}
                </div>
                <div style={{ flex: 1, minHeight: 320, borderRadius: 18, background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)" }} />
                <div style={{ height: 52, borderRadius: 14, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.1)" }} />
            </div>
        </div>
    );
}
