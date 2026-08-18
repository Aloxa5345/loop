import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { type RoleKey } from "@/app/lib/permissions";
import AskLoopClient from "./AskLoopClient";
import "./ask-loop.css";
export const dynamic = "force-dynamic";

export const metadata = { title: "Ask LOOP — AI Chat" };

export default async function AskLoopPage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const role = session.user.role as RoleKey;

    return (
        <div className="dashboard">
            <Sidebar role={role} />
            <div className="main">
                <AskLoopClient
                    userName={session.user.name ?? "User"}
                    role={role}
                />
            </div>
        </div>
    );
}
