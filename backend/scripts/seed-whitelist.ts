/**
 * Seed script: Insere CPFs na Whitelist_CPF para permitir cadastro de Staff/Admin.
 *
 * Uso:
 *   npx tsx scripts/seed-whitelist.ts
 *
 * Requer DATABASE_URL no ambiente ou no .env do backend.
 * NÃO exponha este script em logs públicos.
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
 * Lista de CPFs autorizados para cadastro como Staff.
 * Formato: { cpf: '1133361541', role: 'ADMIN' }
 *
 * O campo 'cpf' deve conter APENAS os 11 dígitos (sem pontuação).
 * A role define qual permissão o usuário receberá ao se cadastrar.
 */
const WHITELIST_ENTRIES = [
  { cpf: '11533361541', role: 'ADMIN' as const },
];

async function main() {
  console.log('🔐 Inserindo CPFs na Whitelist_CPF...\n');

  for (const entry of WHITELIST_ENTRIES) {
    try {
      const existing = await prisma.whitelist_CPF.findUnique({
        where: { cpf: entry.cpf },
      });

      if (existing) {
        console.log(`  ⚠️  CPF ${entry.cpf} já existe na whitelist (role: ${existing.role}). Pulando.`);
        continue;
      }

      await prisma.whitelist_CPF.create({
        data: { cpf: entry.cpf, role: entry.role },
      });

      console.log(`  ✅ CPF inserido: role ${entry.role}`);
    } catch (error) {
      console.error(`  ❌ Erro ao inserir CPF:`, error);
    }
  }

  // Listar todos os CPFs na whitelist para confirmação
  const all = await prisma.whitelist_CPF.findMany({ orderBy: { cpf: 'asc' } });
  console.log(`\n📋 Whitelist atual (${all.length} registro(s)):`);
  for (const entry of all) {
    console.log(`  - CPF: ${entry.cpf} → Role: ${entry.role}`);
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
