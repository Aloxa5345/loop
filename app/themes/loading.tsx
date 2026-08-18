export default function ThemesLoading() {
    return (
        <div className="dashboard">
            {/* Sidebar placeholder */}
            <div style={{ width: 260, flexShrink: 0 }} />
            <div className="main" style={{ paddingTop: 32 }}>
                {/* Header skeleton */}
                <div style={{ marginBottom: 28 }}>
                    <div style={{ height: 32, width: 260, borderRadius: 10, background: "rgba(255,255,255,.06)", marginBottom: 8 }} />
                    <div style={{ height: 16, width: 340, borderRadius: 8, background: "rgba(255,255,255,.04)" }} />
                </div>
                {/* Summary cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 14, marginBottom: 24 }}>
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} style={{ height: 80, borderRadius: 14, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.06)" }} />
                    ))}
                </div>
                {/* Table skeleton */}
                <div style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 16, overflow: "hidden" }}>
                    <div style={{ height: 48, background: "rgba(255,255,255,.04)", borderBottom: "1px solid rgba(255,255,255,.06)" }} />
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} style={{ height: 52, borderBottom: "1px solid rgba(255,255,255,.04)", display: "flex", alignItems: "center", padding: "0 18px", gap: 24 }}>
                            <div style={{ height: 14, width: 140, borderRadius: 6, background: "rgba(255,255,255,.06)" }} />
                            <div style={{ height: 14, width: 60, borderRadius: 6, background: "rgba(255,255,255,.04)" }} />
                            <div style={{ height: 14, width: 80, borderRadius: 6, background: "rgba(255,255,255,.04)" }} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
