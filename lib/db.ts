import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

// Always cache in globalThis to prevent creating new clients
globalForPrisma.prisma = prisma;

// Helper for serverless: wraps DB operations with retry logic
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: unknown) {
      lastError = error as Error;
      const errorMessage = lastError?.message || '';
      
      // Check if it's a connection pool error
      if (errorMessage.includes('MaxClientsInSessionMode') || 
          errorMessage.includes('max clients') ||
          errorMessage.includes('Connection pool')) {
        console.warn(`DB connection attempt ${attempt}/${maxRetries} failed, retrying in ${delay}ms...`);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay * attempt));
          continue;
        }
      }
      throw error;
    }
  }
  
  throw lastError;
}

export default prisma;

