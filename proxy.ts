import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Protected route prefixes — any path starting with these requires auth
const PROTECTED = [
    "/dashboard",
    "/workspace",
    "/feedback",
    "/analytics",
    "/settings",
];

// Auth pages — redirect to dashboard if already logged in
const AUTH_PAGES = ["/login", "/signup", "/register"];

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
    });

    const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
    const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p));

    // Unauthenticated user hitting a protected route → redirect to login
    if (isProtected && !token) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Authenticated user hitting login/signup → redirect to dashboard
    if (isAuthPage && token) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Run on all paths except:
         * - _next/static  (static assets)
         * - _next/image   (image optimisation)
         * - favicon.ico, public files
         * - api/auth      (NextAuth endpoints must always be reachable)
         */
        "/((?!_next/static|_next/image|favicon.ico|api/auth).*)",
    ],
};
