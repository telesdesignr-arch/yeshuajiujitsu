import { PrismaClient } from "@prisma/client";

// Em desenvolvimento o Next recarrega o codigo a cada alteracao. Sem este
// cache global, cada recarga abriria uma nova conexao com o banco.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
