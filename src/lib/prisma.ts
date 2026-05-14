import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const prismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
  });

// Reuse one client per Node process (dev HMR and Next.js prod edge cases).
globalForPrisma.prisma = prismaClient;

export const prisma = prismaClient;
