import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { hasPermission, type RoleKey } from "@/app/lib/permissions";
import Link from "next/link";
import UploadClient from "./UploadClient";
import "./upload.css";
export const dynamic = "force-dynamic";

export default async function UploadPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const role = session.user.role as RoleKey;
    if (!hasPermission(role, "upload-feedback")) redirect("/feedback");

    return (
        <div className="dashboard">
            <Sidebar role={role} />
            <div className="main">

                <div className="upload-header">
                    <div>
                        <h1>📂 Upload CSV</h1>
                        <p>
                            <Link href="/feedback" style={{ color: "#06b6d4", textDecoration: "none" }}>
                                ← Back to Feedback
                            </Link>
                        </p>
                    </div>
                </div>

                <UploadClient />

            </div>
        </div>
    );
}
