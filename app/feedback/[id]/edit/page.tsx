import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import Sidebar from "@/components/Sidebar";
import FeedbackForm from "@/components/FeedbackForm";
import { hasPermission, type RoleKey } from "@/app/lib/permissions";
import Link from "next/link";
import "../../feedback.css";

export const dynamic = "force-dynamic";

interface Props {
    params: Promise<{ id: string }>;
}

export default async function EditFeedbackPage({ params }: Props) {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const role = session.user.role as RoleKey;
    if (!hasPermission(role, "edit-feedback")) redirect("/feedback");

    const { id } = await params;

    // Cast to any so new optional columns don't cause TS errors
    // before the Prisma client fully regenerates
    const feedback = await prisma.feedback.findFirst({
        where: { id, workspaceId: session.user.workspaceId },
    }) as Record<string, unknown> | null;

    if (!feedback) notFound();

    return (
        <div className="dashboard">
            <Sidebar role={role} />
            <div className="main">
                <div className="feedback-header">
                    <div>
                        <h1>✏️ Edit Feedback</h1>
                        <p>
                            <Link href="/feedback" style={{ color: "#06b6d4", textDecoration: "none" }}>
                                ← Back to Feedback
                            </Link>
                        </p>
                    </div>
                </div>

                <div className="fb-form-wrap">
                    <div className="fb-form-card">
                        <h2 className="fb-form-title">Edit Feedback Entry</h2>
                        <FeedbackForm
                            mode="edit"
                            initialData={{
                                id: feedback.id as string,
                                title: (feedback.title as string) ?? "",
                                content: feedback.content as string,
                                channel: feedback.channel as string,
                                customerLabel: feedback.customerLabel as string,
                                customerEmail: (feedback.customerEmail as string) ?? "",
                                priority: (feedback.priority as string) ?? "",
                                category: (feedback.category as string) ?? "",
                                productArea: (feedback.productArea as string) ?? "",
                                rating: (feedback.rating as number) ?? 0,
                                status: feedback.status as string,
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
