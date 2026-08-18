// ── Permission definitions per role ──────────────────────────────────────────
// Matches the LOOP AI SaaS RBAC spec:
// Admin  — full platform control
// Analyst — feedback + AI work, no workspace management
// Viewer  — read-only access

export const permissions = {
    ADMIN: [
        // Workspace management
        "manage-users",
        "assign-roles",
        "workspace-settings",
        "delete-workspace",
        // Feedback
        "view-feedback",
        "upload-feedback",
        "edit-feedback",
        "delete-feedback",
        // AI
        "run-ai",
        "view-ai",
        // Analytics & Reports
        "view-analytics",
        "view-reports",
        "generate-reports",
        "export-reports",
        "schedule-reports",
        // Simulated channels
        "view-simulated",
        "import-simulated",
        "delete-simulated",
    ],
    ANALYST: [
        // Feedback
        "view-feedback",
        "upload-feedback",
        "edit-feedback",
        // AI
        "run-ai",
        "view-ai",
        // Analytics & Reports
        "view-analytics",
        "view-reports",
        "generate-reports",
        "export-reports",
        // Simulated channels
        "view-simulated",
        "import-simulated",
    ],
    VIEWER: [
        // Read-only
        "view-feedback",
        "view-analytics",
        "view-reports",
        "view-ai",
        "view-simulated",
        "export-reports",   // Viewers can download PDF (spec: Export PDF ✅)
    ],
} as const;

export type RoleKey = keyof typeof permissions;
export type Permission = (typeof permissions)[RoleKey][number];

/**
 * Returns true if the given role includes the requested permission.
 */
export function hasPermission(role: RoleKey, permission: string): boolean {
    return (permissions[role] as readonly string[]).includes(permission);
}

/**
 * Returns true if the role is at least as powerful as the required role.
 * Order: ADMIN > ANALYST > VIEWER
 */
export function hasRole(userRole: RoleKey, requiredRole: RoleKey): boolean {
    const hierarchy: RoleKey[] = ["VIEWER", "ANALYST", "ADMIN"];
    return hierarchy.indexOf(userRole) >= hierarchy.indexOf(requiredRole);
}
