import Sidebar from "@/components/Sidebar";
import "./feedback.css";

export default function FeedbackLoading() {
    return (
        <div className="dashboard">
            <Sidebar role="VIEWER" />
            <div className="main">
                <div className="feedback-header">
                    <div>
                        <h1>💬 Feedback</h1>
                        <p>Loading feedback…</p>
                    </div>
                </div>
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="fb-skeleton-row" />
                ))}
            </div>
        </div>
    );
}
