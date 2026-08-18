"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Options {
    /** Extra callback fired on every event (e.g. to re-fetch local state) */
    onEvent?: (type: string) => void;
    /** Which event types trigger a refresh (undefined = all) */
    eventTypes?: string[];
    /** Whether to disable real-time (e.g. for Viewers who can't mutate) */
    enabled?: boolean;
    /** Reconnect delay in ms (default 3000) */
    reconnectDelay?: number;
}

/**
 * useRealtimeRefresh
 *
 * Connects to /api/events via Server-Sent Events and calls router.refresh()
 * whenever a workspace event arrives. This keeps Next.js server components
 * (dashboard, AI page, etc.) in sync without polling.
 *
 * Usage:
 *   useRealtimeRefresh();                          // refresh on any event
 *   useRealtimeRefresh({ eventTypes: ["feedback:created"] });
 *   useRealtimeRefresh({ onEvent: (type) => fetchData() });
 */
export function useRealtimeRefresh(options: Options = {}) {
    const {
        onEvent,
        eventTypes,
        enabled = true,
        reconnectDelay = 3_000,
    } = options;

    const router = useRouter();
    const esRef = useRef<EventSource | null>(null);
    const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const connect = useCallback(() => {
        if (!enabled || typeof window === "undefined") return;
        if (esRef.current) esRef.current.close();

        const es = new EventSource("/api/events");
        esRef.current = es;

        es.onmessage = (e) => {
            try {
                const event = JSON.parse(e.data) as { type: string };
                if (!eventTypes || eventTypes.includes(event.type)) {
                    router.refresh();
                    onEvent?.(event.type);
                }
            } catch { /* malformed event — ignore */ }
        };

        es.onerror = () => {
            es.close();
            esRef.current = null;
            // Reconnect after delay
            reconnectTimer.current = setTimeout(connect, reconnectDelay);
        };
    }, [enabled, eventTypes, onEvent, reconnectDelay, router]);

    useEffect(() => {
        connect();
        return () => {
            esRef.current?.close();
            esRef.current = null;
            if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
        };
    }, [connect]);
}
