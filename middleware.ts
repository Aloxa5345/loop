/**
 * Next.js Middleware — page-level auth guard.
 *
 * Redirects unauthenticated users away from protected pages.
 * This is a first line of defence for the UI only.
 * Every API route still performs its own authentication and RBAC
 * checks — middleware alone is NOT sufficient for API security.
 */
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        // Token is guaranteed to exist here (withAuth ensures it).
        // Add any additional page-level logic here if needed.
        return NextResponse.next();
    },
    {
        callbacks: {
            // Return true to allow access; false triggers a redirect to the
            // signIn page configured in next-auth (pages.signIn = "/login").
            authorized: ({ token }) => !!token,
        },
    }
);

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/feedback/:path*",
        "/workspace/:path*",
        "/reports/:path*",
        "/analytics/:path*",
        "/ai/:path*",
        "/upload/:path*",
        "/simulated/:path*",
    ],
};
