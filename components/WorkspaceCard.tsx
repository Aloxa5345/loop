import Link from "next/link";

interface Props {
    id: string;
    name: string;
    description?: string | null;
    memberCount: number;
    feedbackCount: number;
    myRole: string;
    ownerName: string;
}

function RolePill({ role }: { role: string }) {
    const cls =
        role === "ADMIN" ? "ws-role-badge ws-role-admin" :
            role === "ANALYST" ? "ws-role-badge ws-role-analyst" :
                "ws-role-badge ws-role-viewer";
    return <span className={cls}>{role}</span>;
}

export default function WorkspaceCard({
    id, name, description, memberCount, feedbackCount, myRole, ownerName,
}: Props) {
    return (
        <div className="ws-card">
            <div className="ws-card-top">
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                        <div className="ws-card-icon">🏢</div>
                        <div style={{ minWidth: 0 }}>
                            <h3 className="ws-card-name">{name}</h3>
                            {description && (
                                <p className="ws-card-desc">{description}</p>
                            )}
                        </div>
                    </div>
                </div>
                <RolePill role={myRole} />
            </div>

            <div className="ws-card-stats">
                <span className="ws-card-stat">
                    <strong>{memberCount}</strong> member{memberCount !== 1 ? "s" : ""}
                </span>
                <span className="ws-card-stat">
                    <strong>{feedbackCount}</strong> feedback
                </span>
            </div>

            <p className="ws-card-owner">
                👤 Owner: <strong style={{ color: "#64748b" }}>{ownerName}</strong>
            </p>

            <Link href={`/dashboard`} className="ws-card-link">
                Open workspace →
            </Link>
        </div>
    );
}
