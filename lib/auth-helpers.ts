import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";

/**
 * Retrieves the current session and returns the authenticated user.
 * Throws an "Unauthorized" error if no session exists.
 *
 * Use this in API routes and server actions as the first security gate.
 *
 * @example
 * const user = await requireUser();
 * // user.id, user.role, user.workspaceId are guaranteed to be set
 */
export async function requireUser() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    return session.user;
}
