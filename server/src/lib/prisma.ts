import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as typeof globalThis & {
  nexbookPrisma?: PrismaClient
}

export const prisma =
  globalForPrisma.nexbookPrisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.nexbookPrisma = prisma
}
