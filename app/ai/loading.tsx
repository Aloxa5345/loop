import Sidebar from "@/components/Sidebar";
import "./ai.css";

export default function AILoading() {
    return (
        <div className="dashboard">
            <Sidebar role="VIEWER" />
            <div className="main">
                <div className="ai-page-header">
                    <div>
                        <h1>🤖 AI Reports</h1>
                        <p>Loading analytics…</p>
                    </div>
                </div>
                {[...Array(3)].map((_, i) => <div key={i} className="ai-skeleton" />)}
            </div>
        </div>
    );
}
