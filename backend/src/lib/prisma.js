import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

// Crée le client Prisma ou réutilise l'existant (évite de multiplier les connexions)
export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

// Export par défaut pour supporter les deux syntaxes d'import
export default prisma;