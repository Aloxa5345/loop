"use client";

/**
 * DashboardRealtime
 *
 * A client-side wrapper that subscribes to the SSE event stream and calls
 * router.refresh() when workspace events arrive. This causes the parent
 * server component (DashboardPage) to re-render with fresh data.
 *
 * Renders nothing visible — just the real-time logic.
 */
import { useRealtimeRefresh } from "@/hooks/useRealtimeRefresh";

interface Props {
    /** Pass false for VIEWER role to avoid unnecessary connections */
    enabled?: boolean;
}

export default function DashboardRealtime({ enabled = true }: Props) {
    useRealtimeRefresh({ enabled });
    return null;
}
