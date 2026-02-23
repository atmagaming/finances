import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../../generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient() {
  const config = useRuntimeConfig();
  const adapter = new PrismaLibSql({
    url: (config.tursoDatabaseUrl as string) || "file:./prisma/dev.db",
    authToken: (config.tursoAuthToken as string) || undefined,
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
