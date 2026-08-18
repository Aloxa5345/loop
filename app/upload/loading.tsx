import Sidebar from "@/components/Sidebar";
import "./upload.css";

export default function UploadLoading() {
    return (
        <div className="dashboard">
            <Sidebar role="VIEWER" />
            <div className="main">
                <div className="upload-header">
                    <div>
                        <h1>📂 Upload CSV</h1>
                        <p>Loading…</p>
                    </div>
                </div>
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="upload-skeleton" />
                ))}
            </div>
        </div>
    );
}
