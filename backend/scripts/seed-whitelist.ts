/**
 * Seed script: Insere e-mails na WhitelistEmail para permitir cadastro de Staff/Admin
 * e atualiza usuários existentes correspondentes para role ADMIN.
 *
 * Uso:
 *   npx tsx scripts/seed-whitelist.ts
 *
 * Requer DATABASE_URL no ambiente ou no .env do backend.
 */

import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL não definida. Configure antes de rodar.');
  process.exit(1);
}

const adapter = new PrismaPg(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

/**
 * Lista de e-mails autorizados para cadastro como Staff/Admin.
 */
const WHITELIST_ENTRIES: Array<{ email: string; role: 'ADMIN' | 'TEACHER' }> = [
  { email: 'kaikyzen@gmail.com', role: 'ADMIN' },
  { email: 'espanholemrede@gmail.com', role: 'ADMIN' },
  { email: 'matheusfds408@gmail.com', role: 'ADMIN' },
];

async function main() {
  console.log('🔐 Semeando WhitelistEmail...\n');

  for (const entry of WHITELIST_ENTRIES) {
    const normalizedEmail = entry.email.trim().toLowerCase();
    try {
      const result = await prisma.whitelistEmail.upsert({
        where: { email: normalizedEmail },
        update: { role: entry.role },
        create: { email: normalizedEmail, role: entry.role },
      });

      console.log(`  ✅ Whitelist: ${result.email} -> ${result.role}`);

      // Sincronizar usuário se já existir na tabela User
      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingUser && existingUser.role !== entry.role) {
        await prisma.user.update({
          where: { email: normalizedEmail },
          data: { role: entry.role },
        });
        console.log(`  👤 Usuário existente promovido para: ${entry.role}`);
      }
    } catch (error) {
      console.error(`  ❌ Erro ao processar e-mail ${normalizedEmail}:`, error);
    }
  }

  // Listar todas as entradas na whitelist para confirmação
  const all = await prisma.whitelistEmail.findMany({ orderBy: { email: 'asc' } });
  console.log(`\n📋 Whitelist atual (${all.length} registro(s)):`);
  for (const entry of all) {
    console.log(`  - E-mail: ${entry.email} -> Role: ${entry.role}`);
  }

  console.log('\n✅ Seed de whitelist concluído.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

