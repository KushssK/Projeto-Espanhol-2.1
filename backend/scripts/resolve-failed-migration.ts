/**
 * resolve-failed-migration.ts
 *
 * Conecta ao PostgreSQL via driver `pg` (já é dependência production)
 * e marca migrations com status "failed" como "rolled_back" no
 * tabela _prisma_migrations do Prisma.
 *
 * Isso permite que `prisma migrate deploy` reaplique a migration
 * corrigida sem precisar de acesso manual ao Shell.
 *
 * Uso:
 *   npx tsx scripts/resolve-failed-migration.ts
 *
 * A DATABASE_URL é lida de process.env (configurada no Render).
 */

import pg from 'pg';

const MIGRATION_NAME = '20260826000000_simplify_auth_add_email_whitelist';

async function main() {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    console.error('❌ DATABASE_URL não definida.');
    process.exit(1);
  }

  if (!dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://')) {
    console.error('❌ DATABASE_URL deve ser PostgreSQL.');
    process.exit(1);
  }

  const client = new pg.Client({ connectionString: dbUrl });

  try {
    await client.connect();
    console.log('🔗 Conectado ao PostgreSQL.');

    // Verificar se a migration failed existe
    const result = await client.query(
      `SELECT migration_name, status 
       FROM _prisma_migrations 
       WHERE migration_name = $1`,
      [MIGRATION_NAME]
    );

    if (result.rows.length === 0) {
      console.log(`ℹ️  Migration ${MIGRATION_NAME} não encontrada no banco.`);
      console.log('   Provavelmente ainda não foi tentada. Prisma irá aplicá-la normalmente.');
      await client.end();
      return;
    }

    const row = result.rows[0];
    console.log(`📋 Migration: ${row.migration_name} — status: ${row.status}`);

    if (row.status === 'success') {
      console.log('✅ Migration já aplicada com sucesso. Nada a fazer.');
      await client.end();
      return;
    }

    if (row.status === 'rolled_back') {
      console.log('↩️  Migration já marcada como rolled_back. Prisma irá reaplicá-la.');
      await client.end();
      return;
    }

    if (row.status === 'pending') {
      console.log('⏳ Migration pendente. Prisma irá aplicá-la normalmente.');
      await client.end();
      return;
    }

    // Status é "failed" — marcar como rolled_back
    if (row.status === 'failed') {
      console.log(`⚠️  Migration FAILED detectada. Marcando como rolled_back...`);

      await client.query(
        `UPDATE _prisma_migrations 
         SET status = 'rolled_back', 
             finished_at = NOW(),
             applied_steps_count = 0
         WHERE migration_name = $1 AND status = 'failed'`,
        [MIGRATION_NAME]
      );

      console.log('✅ Migration marcada como rolled_back.');
      console.log('   Prisma migrate deploy irá reaplicá-la com o SQL corrigido.');
    }
  } catch (error) {
    // Se a tabela _prisma_migrations não existe, banco全新 — Prisma cuida disso
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('_prisma_migrations') && msg.includes('does not exist')) {
      console.log('ℹ️  Tabela _prisma_migrations não existe. Banco novo — Prisma irá criar tudo.');
    } else {
      console.error('❌ Erro ao resolver migration:', msg);
      // Não falhar o build por causa disso — deixar o prisma migrate deploy tentar
    }
  } finally {
    await client.end();
  }
}

main();
