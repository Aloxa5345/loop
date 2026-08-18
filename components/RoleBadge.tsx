type Role = "ADMIN" | "ANALYST" | "VIEWER";

const STYLES: Record<Role, string> = {
    ADMIN: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
    ANALYST: "bg-blue-100   text-blue-800   dark:bg-blue-900/40   dark:text-blue-300",
    VIEWER: "bg-zinc-100   text-zinc-700   dark:bg-zinc-800      dark:text-zinc-300",
};

export default function RoleBadge({ role }: { role: Role | string }) {
    const safeRole = (["ADMIN", "ANALYST", "VIEWER"].includes(role) ? role : "VIEWER") as Role;
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STYLES[safeRole]}`}>
            {safeRole}
        </span>
    );
}
