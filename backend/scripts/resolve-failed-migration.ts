/**
 * resolve-failed-migration.ts
 *
 * Resolve migrations FAILED no _prisma_migrations do Prisma 7.x.
 *
 * Estrutura REAL da tabela (NÃO existe coluna "status"):
 *   id, checksum, finished_at, migration_name, logs,
 *   rolled_back_at, started_at, applied_steps_count
 *
 * Estado derivado:
 *   finished_at NULL + rolled_back_at NULL = pending
 *   finished_at NOT NULL + rolled_back_at NULL = success (ou failed se logs tem erro)
 *   rolled_back_at NOT NULL = rolled_back
 *
 * Uso: npx tsx scripts/resolve-failed-migration.ts
 */

import pg from 'pg';

const MIGRATION_NAME = '20260826000000_simplify_auth_add_email_whitelist';

async function main() {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    console.error('❌ [RESOLVE] DATABASE_URL não definida.');
    process.exit(1);
  }

  if (!dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://')) {
    console.error('❌ [RESOLVE] DATABASE_URL deve ser PostgreSQL.');
    process.exit(1);
  }

  const client = new pg.Client({
    connectionString: dbUrl,
    // Timeout curto para não travar o build
    connectionTimeoutMillis: 10_000,
    query_timeout: 10_000,
  });

  try {
    await client.connect();
    console.log('🔗 [RESOLVE] Conectado ao PostgreSQL.');

    // Diagnosticar qual banco estamos acessando (sem expor credenciais)
    const dbInfo = await client.query('SELECT current_database() AS db, current_user AS usr');
    console.log(`   Database: ${dbInfo.rows[0].db}, User: ${dbInfo.rows[0].usr}`);

    // Listar TODAS as migrations para diagnóstico
    const allMigrations = await client.query(
      `SELECT migration_name, finished_at, rolled_back_at, applied_steps_count,
              CASE WHEN logs IS NOT NULL AND length(logs) > 0 THEN 'YES' ELSE 'NO' END AS has_logs
       FROM _prisma_migrations 
       ORDER BY started_at ASC`
    );

    console.log(`\n📋 [RESOLVE] Todas as migrations (${allMigrations.rows.length}):`);
    for (const m of allMigrations.rows) {
      const fin = m.finished_at ? 'SET' : 'NULL';
      const rol = m.rolled_back_at ? 'SET' : 'NULL';
      const state = rol === 'SET' ? 'ROLLED_BACK' : fin === 'NULL' ? 'PENDING' : m.has_logs === 'YES' ? 'FAILED' : 'SUCCESS';
      console.log(`   ${state.padEnd(12)} | ${m.migration_name} | finished_at=${fin} rolled_back_at=${rol} logs=${m.has_logs}`);
    }

    // Buscar a migration problemática
    const result = await client.query(
      `SELECT id, migration_name, finished_at, rolled_back_at, logs, applied_steps_count
       FROM _prisma_migrations 
       WHERE migration_name = $1`,
      [MIGRATION_NAME]
    );

    if (result.rows.length === 0) {
      console.log(`\n✅ [RESOLVE] Migration ${MIGRATION_NAME} não existe no banco.`);
      console.log('   Prisma irá aplicá-la normalmente.');
      return;
    }

    const row = result.rows[0];
    const hasLogs = row.logs && row.logs.length > 0;

    console.log(`\n📋 [RESOLVE] Migration encontrada:`);
    console.log(`   id: ${row.id}`);
    console.log(`   migration_name: ${row.migration_name}`);
    console.log(`   finished_at: ${row.finished_at ?? 'NULL'}`);
    console.log(`   rolled_back_at: ${row.rolled_back_at ?? 'NULL'}`);
    console.log(`   applied_steps_count: ${row.applied_steps_count}`);
    console.log(`   logs: ${hasLogs ? `${row.logs.length} chars — "${row.logs.substring(0, 120)}..."` : 'NULL (empty)'}`);

    // Determinar estado
    const isFinished = row.finished_at !== null;
    const isRolledBack = row.rolled_back_at !== null;

    if (!isFinished && !isRolledBack) {
      console.log('\n⏳ [RESOLVE] Estado: PENDING. Nada a fazer.');
      return;
    }

    if (isFinished && !isRolledBack && !hasLogs) {
      console.log('\n✅ [RESOLVE] Estado: SUCCESS. Nada a fazer.');
      return;
    }

    if (isRolledBack) {
      console.log('\n↩️  [RESOLVE] Estado: ROLLED_BACK. Prisma irá reaplicar.');
      return;
    }

    if (isFinished && hasLogs) {
      console.log('\n⚠️  [RESOLVE] Estado: FAILED (finished_at SET + logs com erro).');
      console.log('   Executando DELETE para resolver...');

      // DELETAR a row — Prisma tratará como pendente
      const deleteResult = await client.query(
        `DELETE FROM _prisma_migrations 
         WHERE migration_name = $1`,
        [MIGRATION_NAME]
      );

      console.log(`   DELETE executado: ${deleteResult.rowCount} row(s) removida(s).`);

      if (deleteResult.rowCount === 0) {
        console.error('\n❌ [RESOLVE] FALHA: DELETE removeu 0 rows.');
        console.error('   A migration NÃO foi resolvida. Build irá falhar.');
        process.exit(1);
      }

      // VERIFICAR se a row foi realmente removida
      const verify = await client.query(
        `SELECT COUNT(*)::int AS cnt FROM _prisma_migrations WHERE migration_name = $1`,
        [MIGRATION_NAME]
      );

      if (verify.rows[0].cnt > 0) {
        console.error(`\n❌ [RESOLVE] FALHA: Row ainda existe após DELETE (${verify.rows[0].cnt} row(s)).`);
        console.error('   A migration NÃO foi resolvida. Build irá falhar.');
        process.exit(1);
      }

      console.log('\n✅ [RESOLVE] Row removida com sucesso. Verificação confirmou: 0 rows.');
      console.log('   Prisma migrate deploy irá tratar como pendente e aplicar o SQL corrigido.');
      return;
    }

    // Estado inesperado
    console.log('\n⚠️  [RESOLVE] Estado inesperado. Nenhuma ação tomada.');
    console.log('   Prisma irá tentar resolver.');

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);

    if (msg.includes('_prisma_migrations') && msg.includes('does not exist')) {
      console.log('ℹ️  [RESOLVE] Tabela _prisma_migrations não existe. Banco novo.');
      return;
    }

    console.error(`\n❌ [RESOLVE] ERRO FATAL: ${msg}`);
    console.error('   A migration NÃO foi resolvida. Build irá falhar.');
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
}

// Garantir que erros não tratados causem exit 1
process.on('unhandledRejection', (err) => {
  console.error('❌ [RESOLVE] Unhandled rejection:', err);
  process.exit(1);
});

main().catch((err) => {
  console.error('❌ [RESOLVE] Erro não tratado em main():', err);
  process.exit(1);
});
