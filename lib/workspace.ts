import { prisma } from "@/app/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";
import { hasPermission } from "@/app/lib/permissions";
import type { RoleKey } from "@/app/lib/permissions";

// Re-export the permission type so callers can import from one place.
export type { RoleKey };
// The permission strings come from the permissions map (e.g. "view-feedback").
export type Permission = string;

/**
 * The verified workspace context returned from requireWorkspaceAccess.
 * Always use `workspace.workspaceId` (not a client-supplied value) in
 * subsequent Prisma queries.
 */
export interface WorkspaceContext {
    user: Awaited<ReturnType<typeof requireUser>>;
    workspaceId: string;
    role: RoleKey;
}

/**
 * Central multi-tenant security check.
 *
 * 1. Authenticates the current user (throws if unauthenticated).
 * 2. Looks up the user's membership in the requested workspace
 *    directly from the database — never trusts the JWT alone.
 * 3. Optionally checks that the user's role has the required permission.
 *
 * @param workspaceId  - The workspace ID from the request (URL param / body).
 * @param permission   - Optional permission key to check.
 *
 * @throws "Unauthorized"               – no session
 * @throws "Forbidden: workspace access denied"   – not a member
 * @throws "Forbidden: insufficient permission"   – wrong role
 *
 * @example
 * const workspace = await requireWorkspaceAccess(workspaceId, "VIEW_FEEDBACK");
 * const feedback  = await prisma.feedback.findMany({
 *   where: { workspaceId: workspace.workspaceId },
 * });
 */
export async function requireWorkspaceAccess(
    workspaceId: string,
    permission?: Permission
): Promise<WorkspaceContext> {
    const user = await requireUser();

    const membership = await prisma.workspaceMember.findUnique({
        where: {
            workspaceId_userId: {
                userId: user.id,
                workspaceId,
            },
        },
        select: {
            userId: true,
            workspaceId: true,
            role: true,
        },
    });

    if (!membership) {
        throw new Error("Forbidden: workspace access denied");
    }

    if (
        permission &&
        !hasPermission(membership.role as RoleKey, permission)
    ) {
        throw new Error("Forbidden: insufficient permission");
    }

    return {
        user,
        workspaceId: membership.workspaceId,
        role: membership.role as RoleKey,
    };
}
