import { PrismaClient } from "@/app/generated/prisma/client";

// Version key — bump when schema changes to bust the hot-reload singleton
const PRISMA_KEY = Symbol.for("prisma.client.v5");

const globalForPrisma = globalThis as unknown as {
    [PRISMA_KEY]?: PrismaClient;
};

function buildClient() {
    return new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
}

export const prisma: PrismaClient =
    globalForPrisma[PRISMA_KEY] ??
    (() => {
        const client = buildClient();
        if (process.env.NODE_ENV !== "production") {
            globalForPrisma[PRISMA_KEY] = client;
        }
        return client;
    })();
