import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// PostgreSQL: conexão via driver adapter (Prisma 7.x requer adapter)
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL não definida. Configure o .env antes de iniciar.');
}

const adapter = new PrismaPg(process.env.DATABASE_URL);

export const prisma = new PrismaClient({ adapter });
