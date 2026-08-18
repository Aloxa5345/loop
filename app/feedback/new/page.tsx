import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import FeedbackForm from "@/components/FeedbackForm";
import { hasPermission, type RoleKey } from "@/app/lib/permissions";
import Link from "next/link";
import "../feedback.css";
export const dynamic = "force-dynamic";

export default async function NewFeedbackPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const role = session.user.role as RoleKey;
    if (!hasPermission(role, "upload-feedback")) redirect("/feedback");

    return (
        <div className="dashboard">
            <Sidebar role={role} />
            <div className="main">
                <div className="feedback-header">
                    <div>
                        <h1>+ Add Feedback</h1>
                        <p>
                            <Link href="/feedback" style={{ color: "#06b6d4", textDecoration: "none" }}>
                                ← Back to Feedback
                            </Link>
                        </p>
                    </div>
                </div>

                <div className="fb-form-wrap">
                    <div className="fb-form-card">
                        <h2 className="fb-form-title">New Feedback Entry</h2>
                        <FeedbackForm mode="new" />
                    </div>
                </div>
            </div>
        </div>
    );
}
