/**
 * user-cleanup-deploy.ts — limpeza SEGURA dos dados de usuários durante o DEPLOY.
 *
 * Executa no ambiente do Render (build), usando a DATABASE_URL que JÁ existe no
 * ambiente de produção — a URL NUNCA é impressa nem commitada.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * COMO ATIVAR (painel do Render → Environment → adicionar variável → Deploy):
 *
 *   ETAPA 1 — APENAS CONTAGENS (nada é apagado):
 *     USER_CLEANUP_MODE=dry-run
 *
 *   ETAPA 2 — LIMPEZA REAL (somente após conferir o dry-run no log):
 *     USER_CLEANUP_MODE=execute
 *     USER_CLEANUP_CONFIRM=<token exato impresso pelo dry-run>
 *
 *   ETAPA 3 — REMOVER as duas variáveis (deploys voltam ao normal).
 *
 * Sem USER_CLEANUP_MODE o script é um no-op: não conecta no banco e não altera nada.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Remove APENAS registros dependentes de usuários, respeitando as foreign keys:
 *   Message → RoomMember → ChatRoom (salas que ficam órfãs) → UserProgress → User
 *
 * Preserva: Module, Category, Lesson, Attachment, MediaLibrary, AppSettings,
 * WhitelistEmail, migrations e todo conteúdo pedagógico.
 *
 * NÃO usa: prisma migrate reset, prisma db push, DROP DATABASE ou DROP TABLE.
 */
import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const MODE = (process.env.USER_CLEANUP_MODE || '').trim().toLowerCase();
const CONFIRM = (process.env.USER_CLEANUP_CONFIRM || '').trim();

async function main() {
  // ── Modo desativado: no-op absoluto (deploys normais) ─────────────────────
  if (!MODE) {
    console.log('[user-cleanup] inativo — USER_CLEANUP_MODE não definido. Nenhum registro foi alterado.');
    return;
  }

  if (MODE !== 'dry-run' && MODE !== 'execute') {
    console.error(`[user-cleanup] ERRO: USER_CLEANUP_MODE="${MODE}" inválido. Use "dry-run" ou "execute".`);
    process.exit(1);
  }

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('[user-cleanup] ERRO: DATABASE_URL não definida no ambiente. Nada foi executado.');
    process.exit(1);
  }

  // Diagnóstico SEM expor a URL/senha (mesmo padrão do resolve-failed-migration)
  let host = '(desconhecido)';
  let database = '(desconhecido)';
  try {
    const parsed = new URL(dbUrl);
    host = parsed.hostname;
    database = parsed.pathname.substring(1);
  } catch {
    console.error('[user-cleanup] ERRO: DATABASE_URL não é uma URL válida.');
    process.exit(1);
  }

  console.log('[user-cleanup] conectando ao PostgreSQL de produção...');
  console.log(`   Host: ${host}`);
  console.log(`   Database: ${database}`);

  const adapter = new PrismaPg(dbUrl);
  const prisma = new PrismaClient({ adapter });

  try {
    const before = await countAll(prisma);

    // ── ETAPA 1: DRY-RUN — mostra quantidades e o token de confirmação ──────
    if (MODE === 'dry-run') {
      console.log('\n============================================================');
      console.log('  [user-cleanup] DRY-RUN — nenhum registro foi apagado.');
      console.log('============================================================');
      printCounts('ANTES', before);
      console.log('\nPara EXECUTAR a limpeza real (após conferir os números acima),');
      console.log('defina no painel do Render e faça um novo deploy:');
      console.log(`   USER_CLEANUP_MODE=dry-run  →  remova esta variável`);
      console.log(`   USER_CLEANUP_MODE=execute`);
      console.log(`   USER_CLEANUP_CONFIRM=${expectedToken(before)}`);
      return;
    }

    // ── ETAPA 2: EXECUTE — exige o token exato gerado pelo dry-run ──────────
    const expected = expectedToken(before);
    if (CONFIRM !== expected) {
      console.error('[user-cleanup] ABORTADO: confirmação ausente ou incorreta.');
      console.error(`   Esperado: USER_CLEANUP_CONFIRM=${expected}`);
      console.error('   Rode primeiro USER_CLEANUP_MODE=dry-run, confira as quantidades no log');
      console.error('   e então use o token exato impresso pelo dry-run.');
      process.exit(1);
    }

    console.log('\n============================================================');
    console.log('  [user-cleanup] EXECUÇÃO DA LIMPEZA CONFIRMADA');
    console.log('============================================================');
    printCounts('ANTES', before);

    // Ordem de exclusão respeitando as foreign keys:
    // mensagens e membros primeiro; depois as salas (todas ficam órfãs);
    // por fim progresso e usuários. Tudo em uma única transação.
    const result = await prisma.$transaction(async (tx) => {
      const messages = await tx.message.deleteMany({});
      const members = await tx.roomMember.deleteMany({});
      const rooms = await tx.chatRoom.deleteMany({});
      const progress = await tx.userProgress.deleteMany({});
      const users = await tx.user.deleteMany({});
      return {
        messages: messages.count,
        members: members.count,
        rooms: rooms.count,
        progress: progress.count,
        users: users.count,
      };
    });

    console.log('\nRemovidos na transação:');
    console.log(`   - mensagens: ${result.messages}`);
    console.log(`   - membros de salas: ${result.members}`);
    console.log(`   - salas (órfãs): ${result.rooms}`);
    console.log(`   - registros de progresso: ${result.progress}`);
    console.log(`   - usuários: ${result.users}`);

    // ── Verificação final ────────────────────────────────────────────────────
    const after = await countAll(prisma);
    console.log('\n────────────────────────────────────────────────');
    console.log('  VERIFICAÇÃO PÓS-LIMPEZA');
    console.log('────────────────────────────────────────────────');
    printCounts('DEPOIS', after);

    const userDataZero =
      after.users === 0 &&
      after.progress === 0 &&
      after.messages === 0 &&
      after.members === 0 &&
      after.rooms === 0;

    console.log('\nConteúdo pedagógico preservado:');
    console.log(`   - módulos: ${after.modules}`);
    console.log(`   - categorias: ${after.categories}`);
    console.log(`   - aulas: ${after.lessons}`);
    console.log(`   - anexos: ${after.attachments}`);
    console.log(`   - acervo (media): ${after.media}`);
    console.log(`   - AppSettings: ${after.appSettings}`);
    console.log(`   - WhitelistEmail (${after.whitelistCount}):`);
    for (const w of after.whitelist) {
      console.log(`       • ${w.email} -> ${w.role}`);
    }

    if (userDataZero && after.modules > 0 && after.lessons > 0 && after.appSettings > 0 && after.whitelistCount > 0) {
      console.log('\n✅ [user-cleanup] Limpeza concluída e verificada: User=0, UserProgress=0,');
      console.log('   Message=0, RoomMember=0, ChatRoom órfãs=0. Conteúdo preservado.');
      return;
    }

    console.error('\n❌ [user-cleanup] VERIFICAÇÃO FALHOU — revise as contagens acima.');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function expectedToken(c: Awaited<ReturnType<typeof countAll>>): string {
  return `EXECUTAR-LIMPEZA-USER-${c.users}-MSG-${c.messages}`;
}

async function countAll(prisma: PrismaClient) {
  const [
    users,
    progress,
    members,
    messages,
    rooms,
    modules,
    categories,
    lessons,
    attachments,
    media,
    appSettings,
    whitelistCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.userProgress.count(),
    prisma.roomMember.count(),
    prisma.message.count(),
    prisma.chatRoom.count(),
    prisma.module.count(),
    prisma.category.count(),
    prisma.lesson.count(),
    prisma.attachment.count(),
    prisma.mediaLibrary.count(),
    prisma.appSettings.count(),
    prisma.whitelistEmail.count(),
  ]);
  const whitelist = await prisma.whitelistEmail.findMany({
    orderBy: { email: 'asc' },
    select: { email: true, role: true },
  });
  return {
    users,
    progress,
    members,
    messages,
    rooms,
    modules,
    categories,
    lessons,
    attachments,
    media,
    appSettings,
    whitelistCount,
    whitelist,
  };
}

function printCounts(title: string, c: Awaited<ReturnType<typeof countAll>>) {
  console.log(`\n${title}:`);
  console.log(`   - User: ${c.users}`);
  console.log(`   - UserProgress: ${c.progress}`);
  console.log(`   - RoomMember: ${c.members}`);
  console.log(`   - Message: ${c.messages}`);
  console.log(`   - ChatRoom (órfãs): ${c.rooms}`);
}

// Garantir que erros não tratados causem exit 1 (deploy falha visivelmente)
process.on('unhandledRejection', (err) => {
  console.error('❌ [user-cleanup] Unhandled rejection:', err);
  process.exit(1);
});

main().catch((err) => {
  console.error('❌ [user-cleanup] Erro não tratado em main():', err);
  process.exit(1);
});