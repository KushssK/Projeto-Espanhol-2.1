/**
 * Script para resolver o estado P3009 do Prisma.
 *
 * Execute com o DATABASE_URL do Render:
 *   DATABASE_URL="postgresql://..." npx tsx scripts/resolve-migration.ts
 *
 * OU configure DATABASE_URL no .env apontando para o PostgreSQL do Render
 * e rode: npx tsx scripts/resolve-migration.ts
 *
 * Este script marca a migration FAILED como "rolled-back" no _prisma_migrations,
 * permitindo que prisma migrate deploy reaplique-a com o SQL corrigido.
 */

import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

async function main() {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    console.error('❌ DATABASE_URL não definida.');
    console.error('   Execute: DATABASE_URL="postgresql://..." npx tsx scripts/resolve-migration.ts');
    process.exit(1);
  }

  if (!dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://')) {
    console.error('❌ DATABASE_URL deve ser PostgreSQL.');
    console.error('   Valor atual começa com:', dbUrl.substring(0, 20) + '...');
    process.exit(1);
  }

  console.log('🔗 Conectando ao banco PostgreSQL...');
  const adapter = new PrismaPg(dbUrl);
  const prisma = new PrismaClient({ adapter });

  try {
    // 1. Verificar estado da migration
    console.log('\n📋 Verificando migrations...');
    const migrations = await prisma.$queryRawUnsafe<Array<{
      migration_name: string;
      status: string;
      applied_steps_count: number;
    }>>(
      `SELECT migration_name, status, applied_steps_count 
       FROM _prisma_migrations 
       ORDER BY started_at DESC 
       LIMIT 5`
    );

    for (const m of migrations) {
      const icon = m.status === 'success' ? '✅' : m.status === 'pending' ? '⏳' : '❌';
      console.log(`   ${icon} ${m.migration_name} — ${m.status} (${m.applied_steps_count} steps)`);
    }

    // 2. Encontrar a migration FAILED
    const failedMigration = migrations.find(m => m.status === 'failed');

    if (!failedMigration) {
      console.log('\n✅ Nenhuma migration FAILED encontrada. Nada a fazer.');
      await prisma.$disconnect();
      return;
    }

    console.log(`\n⚠️  Migration FAILED: ${failedMigration.migration_name}`);

    // 3. Marcar como rolled-back
    console.log('\n🔄 Marcando como "rolled-back"...');
    await prisma.$executeRawUnsafe(
      `UPDATE _prisma_migrations 
       SET status = 'rolled_back', finished_at = NOW() 
       WHERE migration_name = $1 AND status = 'failed'`,
      failedMigration.migration_name
    );

    console.log('✅ Migration marcada como rolled-back.');

    // 4. Verificar estado final
    console.log('\n📋 Estado final das migrations:');
    const after = await prisma.$queryRawUnsafe<Array<{
      migration_name: string;
      status: string;
    }>>(
      `SELECT migration_name, status 
       FROM _prisma_migrations 
       ORDER BY started_at DESC 
       LIMIT 5`
    );

    for (const m of after) {
      const icon = m.status === 'success' ? '✅' : m.status === 'pending' ? '⏳' : m.status === 'rolled_back' ? '↩️' : '❌';
      console.log(`   ${icon} ${m.migration_name} — ${m.status}`);
    }

    // 5. Verificar se a migration corrigida existe no filesystem
    console.log('\n📌 Próximo passo:');
    console.log('   1. Verifique que a migration corrigida está no repositório');
    console.log('   2. Faça push para main');
    console.log('   3. O Render irá rodar: npx prisma migrate deploy');
    console.log('   4. A migration será reaplicada com o SQL corrigido');

  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
