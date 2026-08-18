/**
 * GET /api/events
 *
 * Server-Sent Events (SSE) endpoint.
 * Authenticated clients subscribe here and receive workspace-scoped events
 * as they happen (feedback created/updated/analyzed, etc.).
 *
 * The client uses these events to trigger router.refresh() — no websocket needed.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { subscribe } from "@/lib/eventBus";

// Edge runtime doesn't support the event bus singleton, keep Node.js
export const runtime = "nodejs";
// Disable caching so each request opens a real streaming connection
export const dynamic = "force-dynamic";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const workspaceId = session.user.workspaceId;

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        start(controller) {
            // Send an initial heartbeat so the client knows the connection is live
            const heartbeat = encoder.encode(": heartbeat\n\n");
            controller.enqueue(heartbeat);

            // Subscribe to workspace events
            const unsub = subscribe(workspaceId, (event) => {
                const data = encoder.encode(`data: ${JSON.stringify(event)}\n\n`);
                try { controller.enqueue(data); } catch { /* client disconnected */ }
            });

            // Send a keepalive ping every 25 seconds to prevent proxy timeouts
            const interval = setInterval(() => {
                try {
                    controller.enqueue(encoder.encode(": ping\n\n"));
                } catch {
                    clearInterval(interval);
                    unsub();
                }
            }, 25_000);

            // Cleanup when the client disconnects
            const cleanup = () => {
                clearInterval(interval);
                unsub();
                try { controller.close(); } catch { /* already closed */ }
            };

            // Store cleanup on the controller so abort can call it
            // (AbortSignal is not exposed from ReadableStream cancel directly,
            //  but the stream will be GC'd when the response is aborted)
            return cleanup;
        },

        cancel() {
            // Called when the client disconnects — the start() return value (cleanup)
            // is NOT automatically called in all runtimes, so we handle cleanup in
            // the interval try/catch above.
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no", // disable nginx buffering
        },
    });
}
