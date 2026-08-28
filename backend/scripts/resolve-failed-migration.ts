/**
 * resolve-failed-migration.ts
 *
 * Conecta ao PostgreSQL via driver `pg` e resolve migrations failed
 * no _prisma_migrations do Prisma.
 *
 * Estrutura REAL da tabela _prisma_migrations (Prisma 7.x):
 *   id                  TEXT PRIMARY KEY
 *   checksum            TEXT NOT NULL
 *   finished_at         TIMESTAMPTZ (NULL = pending)
 *   migration_name      VARCHAR(255) NOT NULL
 *   logs                TEXT (error logs se failed)
 *   rolled_back_at      TIMESTAMPTZ (NULL = not rolled back)
 *   started_at          TIMESTAMPTZ NOT NULL
 *   applied_steps_count INTEGER DEFAULT 0
 *
 * NÃO existe coluna "status". O estado é derivado de:
 *   - finished_at NULL + rolled_back_at NULL → pending
 *   - finished_at NOT NULL + rolled_back_at NULL → success ou failed (logs indica)
 *   - rolled_back_at NOT NULL → rolled_back
 *
 * Uso: npx tsx scripts/resolve-failed-migration.ts
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

    // 1. Verificar se a migration existe
    const result = await client.query(
      `SELECT id, migration_name, finished_at, rolled_back_at, logs, applied_steps_count
       FROM _prisma_migrations 
       WHERE migration_name = $1`,
      [MIGRATION_NAME]
    );

    if (result.rows.length === 0) {
      console.log(`ℹ️  Migration ${MIGRATION_NAME} não encontrada no banco.`);
      console.log('   Prisma irá aplicá-la normalmente.');
      await client.end();
      return;
    }

    const row = result.rows[0];
    const isFinished = row.finished_at !== null;
    const isRolledBack = row.rolled_back_at !== null;
    const hasLogs = row.logs && row.logs.length > 0;

    console.log(`📋 Migration: ${row.migration_name}`);
    console.log(`   finished_at: ${isFinished ? row.finished_at : 'NULL'}`);
    console.log(`   rolled_back_at: ${isRolledBack ? row.rolled_back_at : 'NULL'}`);
    console.log(`   applied_steps_count: ${row.applied_steps_count}`);
    console.log(`   logs: ${hasLogs ? row.logs.substring(0, 100) + '...' : 'NULL'}`);

    // 2. Determinar estado e agir
    if (!isFinished && !isRolledBack) {
      // pending — nada a fazer
      console.log('⏳ Migration pendente. Prisma irá aplicá-la normalmente.');
      await client.end();
      return;
    }

    if (isFinished && !isRolledBack && !hasLogs) {
      // success — nada a fazer
      console.log('✅ Migration já aplicada com sucesso. Nada a fazer.');
      await client.end();
      return;
    }

    if (isRolledBack) {
      // rolled_back — Prisma já pode reaplicar
      console.log('↩️  Migration já marcada como rolled_back.');
      console.log('   Prisma migrate deploy irá reaplicá-la.');
      await client.end();
      return;
    }

    if (isFinished && hasLogs) {
      // FAILED: finished_at é NOT NULL e logs contém erro
      console.log('⚠️  Migration FAILED detectada (finished_at + logs com erro).');
      console.log('   Resolvendo...');

      // Estratégia: DELETAR a row failed.
      // Quando não existe row, Prisma trata a migration como "pending"
      // e a aplica do zero com o SQL corrigido.
      await client.query(
        `DELETE FROM _prisma_migrations 
         WHERE migration_name = $1 AND finished_at IS NOT NULL AND rolled_back_at IS NULL`,
        [MIGRATION_NAME]
      );

      console.log('✅ Row da migration failed removida do _prisma_migrations.');
      console.log('   Prisma migrate deploy irá tratá-la como pendente e aplicar o SQL corrigido.');
      await client.end();
      return;
    }

    // Caso inesperado
    console.log('ℹ️  Estado inesperado. Prisma irá tentar resolver.');
    await client.end();

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('_prisma_migrations') && msg.includes('does not exist')) {
      console.log('ℹ️  Tabela _prisma_migrations não existe. Banco novo.');
    } else {
      console.error('❌ Erro ao resolver migration:', msg);
      // Não falhar o build — deixar prisma migrate deploy tentar
    }
  } finally {
    await client.end().catch(() => {});
  }
}

main();
