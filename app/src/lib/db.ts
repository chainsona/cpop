import { PrismaClient } from '../generated/prisma';

// Use a single instance of Prisma Client across the app
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Initialize the Prisma client and assign it to our global instance
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  // Log queries in development
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Save the instance in development to avoid too many clients in dev mode
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}