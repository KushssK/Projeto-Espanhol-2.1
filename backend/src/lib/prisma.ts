import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

// Driver adapter (Prisma 7 exige adapter para conectar em MySQL/MariaDB)
// O construtor aceita a connection string no formato mysql://usuario:senha@host:porta/banco
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL não definida. Configure o .env antes de iniciar.');
}

const adapter = new PrismaMariaDb(process.env.DATABASE_URL);

export const prisma = new PrismaClient({ adapter });
