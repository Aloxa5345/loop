import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import { type RoleKey } from "@/app/lib/permissions";
import Sidebar from "@/components/Sidebar";
import CreateWorkspaceForm from "./CreateWorkspaceForm";
import "@/app/workspace/workspace.css";

export const metadata = { title: "Create Workspace — LOOP" };

export default async function CreateWorkspacePage() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login");

    const role = session.user.role as RoleKey;

    return (
        <div className="dashboard">
            <Sidebar role={role} />
            <div className="main">
                <CreateWorkspaceForm />
            </div>
        </div>
    );
}
