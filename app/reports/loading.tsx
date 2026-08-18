import Sidebar from "@/components/Sidebar";
import "./reports.css";

export default function ReportsLoading() {
    return (
        <div className="dashboard">
            <Sidebar role="VIEWER" />
            <div className="main">
                <div className="rpt-header">
                    <div><h1>📄 Reports</h1><p>Loading…</p></div>
                </div>
                {[...Array(3)].map((_, i) => (
                    <div key={i} style={{
                        height: "120px", borderRadius: "18px", marginBottom: "18px",
                        background: "linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%)",
                        backgroundSize: "200% 100%",
                        animation: "shimmer 1.4s infinite",
                    }} />
                ))}
            </div>
        </div>
    );
}
