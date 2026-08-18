"use client";

import { useSession } from "next-auth/react";
import { hasPermission } from "@/app/lib/permissions";
import type { RoleKey } from "@/app/lib/permissions";

interface Props {
    permission: string;
    fallback?: React.ReactNode;
    children: React.ReactNode;
}

/**
 * Renders children only when the current user's role includes the given permission.
 * Use `fallback` to show an alternative UI when access is denied.
 */
export default function PermissionGuard({ permission, fallback = null, children }: Props) {
    const { data: session } = useSession();
    const role = session?.user?.role as RoleKey | undefined;

    if (!role || !hasPermission(role, permission)) return <>{fallback}</>;
    return <>{children}</>;
}
