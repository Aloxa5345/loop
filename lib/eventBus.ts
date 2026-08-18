/**
 * eventBus.ts
 *
 * Lightweight in-process pub/sub for real-time events.
 * API routes call emit() after mutations; the SSE endpoint subscribes per workspace.
 *
 * This lives in the Node.js process memory — it only works within a single
 * server instance (fine for local dev and single-instance deployments).
 */

export type EventType =
    | "feedback:created"
    | "feedback:updated"
    | "feedback:deleted"
    | "feedback:analyzed"
    | "report:created"
    | "members:changed";

export interface WorkspaceEvent {
    type: EventType;
    workspaceId: string;
    payload?: Record<string, unknown>;
    timestamp: number;
}

type Listener = (event: WorkspaceEvent) => void;

// Singleton — use Symbol.for so it survives Next.js hot-reload
const BUS_KEY = Symbol.for("loop.event.bus.v1");
const g = globalThis as unknown as { [BUS_KEY]?: Map<string, Set<Listener>> };

function getListeners(): Map<string, Set<Listener>> {
    if (!g[BUS_KEY]) g[BUS_KEY] = new Map();
    return g[BUS_KEY];
}

/**
 * Subscribe to events for a specific workspace.
 * Returns an unsubscribe function.
 */
export function subscribe(workspaceId: string, listener: Listener): () => void {
    const map = getListeners();
    if (!map.has(workspaceId)) map.set(workspaceId, new Set());
    map.get(workspaceId)!.add(listener);

    return () => {
        map.get(workspaceId)?.delete(listener);
        if (map.get(workspaceId)?.size === 0) map.delete(workspaceId);
    };
}

/**
 * Emit an event to all listeners for a workspace.
 * Fire-and-forget — never throws.
 */
export function emit(type: EventType, workspaceId: string, payload?: Record<string, unknown>) {
    const event: WorkspaceEvent = { type, workspaceId, payload: payload ?? {}, timestamp: Date.now() };
    const listeners = getListeners().get(workspaceId);
    if (!listeners) return;
    for (const fn of listeners) {
        try { fn(event); } catch { /* swallow — never crash the emitter */ }
    }
}
