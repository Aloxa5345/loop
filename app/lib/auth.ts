import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                    include: {
                        workspaces: {
                            include: { workspace: true },
                            // Fetch ALL memberships so we can pick the right one.
                            // A user may belong to multiple workspaces:
                            //   - Their own auto-created workspace (they are the owner)
                            //   - Workspaces they were invited into (Admin invited them)
                            // We need all of them to select correctly.
                            orderBy: { joinedAt: "asc" },
                        },
                    },
                });

                if (!user) return null;

                const passwordValid = await bcrypt.compare(
                    credentials.password,
                    user.passwordHash
                );
                if (!passwordValid) return null;

                // Workspace selection priority:
                //
                // 1. A workspace the user was INVITED to (not their own personal workspace).
                //    Identified by: workspace.ownerId !== user.id
                //    This ensures Analysts/Viewers land in the shared workspace
                //    where Admin feedback lives.
                //
                // 2. Fallback: their own first workspace (e.g. a solo Admin who
                //    hasn't been invited anywhere).
                //
                const invitedMembership = user.workspaces.find(
                    (m) => m.workspace.ownerId !== user.id
                );
                const membership = invitedMembership ?? user.workspaces[0];

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: membership?.role ?? "VIEWER",
                    workspaceId: membership?.workspaceId ?? "",
                };
            },
        }),
    ],

    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = (user as typeof user & { role: string }).role;
                token.workspaceId = (
                    user as typeof user & { workspaceId: string }
                ).workspaceId;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
                session.user.workspaceId = token.workspaceId as string;
            }
            return session;
        },
    },

    session: { strategy: "jwt" },
    pages: { signIn: "/login" },
    secret: process.env.NEXTAUTH_SECRET,
};
