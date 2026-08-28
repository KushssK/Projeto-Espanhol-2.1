/**
 * resolve-failed-migration.ts
 *
 * Resolve migrations FAILED no _prisma_migrations do Prisma 7.x.
 *
 * Executa ANTES de `prisma migrate deploy` para garantir que
 * migrations com status "failed" sejam removidas e reaplicadas
 * com o SQL corrigido.
 *
 * Estrutura REAL da tabela (NÃO existe coluna "status"):
 *   id, checksum, finished_at, migration_name, logs,
 *   rolled_back_at, started_at, applied_steps_count
 *
 * Uso (deve ser executado ANTES de prisma migrate deploy):
 *   npx tsx scripts/resolve-failed-migration.ts
 */

import 'dotenv/config';
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

  // Parsear URL para diagnóstico (SEM expor senha)
  let parsed: URL;
  try {
    parsed = new URL(dbUrl);
  } catch {
    console.error('❌ [RESOLVE] DATABASE_URL não é uma URL válida.');
    process.exit(1);
  }

  console.log('🔗 [RESOLVE] Conectando ao PostgreSQL...');
  console.log(`   Host: ${parsed.hostname}`);
  console.log(`   Port: ${parsed.port || '5432'}`);
  console.log(`   Database: ${parsed.pathname.substring(1)}`);
  console.log(`   User: ${parsed.username}`);
  console.log(`   SSL: ${dbUrl.includes('sslmode') ? 'detectado na URL' : 'não especificado na URL'}`);

  // Configurar SSL para Render (PostgreSQL requer SSL)
  const clientConfig: pg.ClientConfig = {
    connectionString: dbUrl,
    connectionTimeoutMillis: 15_000,
    query_timeout: 15_000,
  };

  // Se a URL não especifica sslmode, adicionar SSL compatível com Render
  if (!dbUrl.includes('sslmode')) {
    clientConfig.ssl = { rejectUnauthorized: false };
  }

  const client = new pg.Client(clientConfig);

  try {
    await client.connect();
    console.log('✅ [RESOLVE] Conectado ao PostgreSQL.\n');

    // ── Diagnóstico 1: Confirmar qual banco estamos acessando ──
    const dbInfo = await client.query(
      'SELECT current_database() AS db, current_user AS usr, version() AS ver'
    );
    console.log('📋 [RESOLVE] Informações do banco:');
    console.log(`   Database: ${dbInfo.rows[0].db}`);
    console.log(`   User: ${dbInfo.rows[0].usr}`);
    console.log(`   Version: ${dbInfo.rows[0].ver.substring(0, 80)}...\n`);

    // ── Diagnóstico 2: Verificar se tabela _prisma_migrations existe ──
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = '_prisma_migrations'
      ) AS exists
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('✅ [RESOLVE] Tabela _prisma_migrations não existe. Banco novo — nada a resolver.');
      return;
    }

    // ── Diagnóstico 3: Listar TODAS as migrations ──
    const allMigrations = await client.query(`
      SELECT migration_name, finished_at, rolled_back_at, applied_steps_count,
             CASE WHEN logs IS NOT NULL AND length(logs) > 0 THEN 'YES' ELSE 'NO' END AS has_logs
      FROM _prisma_migrations
      ORDER BY started_at ASC
    `);

    console.log(`📋 [RESOLVE] Todas as migrations no banco (${allMigrations.rows.length}):`);
    for (const m of allMigrations.rows) {
      const fin = m.finished_at ? 'SET' : 'NULL';
      const rol = m.rolled_back_at ? 'SET' : 'NULL';
      const state = rol === 'SET' ? 'ROLLED_BACK' : fin === 'NULL' ? 'PENDING' : m.has_logs === 'YES' ? 'FAILED' : 'SUCCESS';
      console.log(`   ${state.padEnd(12)} | ${m.migration_name} | finished_at=${fin} rolled_back_at=${rol} logs=${m.has_logs}`);
    }
    console.log('');

    // ── Buscar a migration problemática ──
    const result = await client.query(
      `SELECT id, migration_name, finished_at, rolled_back_at, logs, applied_steps_count
       FROM _prisma_migrations
       WHERE migration_name = $1`,
      [MIGRATION_NAME]
    );

    if (result.rows.length === 0) {
      console.log(`✅ [RESOLVE] Migration "${MIGRATION_NAME}" não existe no banco.`);
      console.log('   Prisma irá aplicá-la normalmente durante migrate deploy.');
      return;
    }

    const row = result.rows[0];
    const hasLogs = row.logs && row.logs.length > 0;

    console.log('📋 [RESOLVE] Migration problemática encontrada:');
    console.log(`   id: ${row.id}`);
    console.log(`   migration_name: ${row.migration_name}`);
    console.log(`   finished_at: ${row.finished_at ?? 'NULL'}`);
    console.log(`   rolled_back_at: ${row.rolled_back_at ?? 'NULL'}`);
    console.log(`   applied_steps_count: ${row.applied_steps_count}`);
    if (hasLogs) {
      console.log(`   logs: ${row.logs.length} chars`);
      // Mostrar apenas as últimas 2 linhas do erro para diagnóstico
      const lastLines = row.logs.split('\n').filter((l: string) => l.trim()).slice(-2);
      for (const line of lastLines) {
        console.log(`     > ${line}`);
      }
    } else {
      console.log('   logs: NULL (empty)');
    }
    console.log('');

    // ── Determinar estado ──
    const isFinished = row.finished_at !== null;
    const isRolledBack = row.rolled_back_at !== null;

    if (!isFinished && !isRolledBack) {
      console.log('⏳ [RESOLVE] Estado: PENDING. Nada a fazer — Prisma irá processar.');
      return;
    }

    if (isFinished && !isRolledBack && !hasLogs) {
      console.log('✅ [RESOLVE] Estado: SUCCESS. Nada a fazer.');
      return;
    }

    if (isRolledBack) {
      console.log('↩️  [RESOLVE] Estado: ROLLED_BACK. Prisma irá reaplicar automaticamente.');
      return;
    }

    if (isFinished && hasLogs) {
      console.log('⚠️  [RESOLVE] Estado: FAILED — executando resolução...');

      // DELETAR a row — Prisma tratará como pendente e reaplicará o SQL corrigido
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

      // Verificar quantas migrations restam
      const remaining = await client.query('SELECT COUNT(*)::int AS cnt FROM _prisma_migrations');
      console.log(`\n✅ [RESOLVE] Row removida com sucesso. Verificação: 0 rows com nome "${MIGRATION_NAME}".`);
      console.log(`   Total de migrations restantes no banco: ${remaining.rows[0].cnt}`);
      console.log('   Prisma migrate deploy irá reaplicar o SQL corrigido.');
      return;
    }

    // Estado inesperado
    console.log('⚠️  [RESOLVE] Estado inesperado. Nenhuma ação tomada.');
    console.log('   Prisma irá tentar processar.');

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);

    if (msg.includes('_prisma_migrations') && msg.includes('does not exist')) {
      console.log('ℹ️  [RESOLVE] Tabela _prisma_migrations não existe. Banco novo — nada a resolver.');
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
