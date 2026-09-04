/**
 * Limpeza controlada dos dados de USUÁRIOS — sem tocar no restante do banco.
 *
 * Remove APENAS registros cujo propósito é pertencer a usuários:
 *   1. Mensagens do chat (Message.senderId -> User)
 *   2. Participações em salas (RoomMember.userId -> User)
 *   3. Salas de chat órfãs (ChatRoom sem nenhum membro restante)
 *   4. Progresso dos usuários (UserProgress.userId -> User)
 *   5. Usuários (User)
 *
 * PRESERVA: schema, migrations, módulos, categorias, aulas, vídeos,
 * anexos, acervo, WhitelistEmail, AppSettings e demais conteúdos.
 *
 * NÃO usa `prisma migrate reset`, `prisma db push` nem DROP de tabelas/banco.
 *
 * Uso:
 *   npx tsx scripts/clean-users.ts            # executa a limpeza
 *   npx tsx scripts/clean-users.ts --dry-run  # apenas mostra as contagens
 *
 * Requer DATABASE_URL no ambiente ou no .env do backend.
 */
import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL não definida. Configure antes de rodar.');
  process.exit(1);
}

const adapter = new PrismaPg(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

const DRY_RUN = process.argv.includes('--dry-run');

async function countAll() {
  const [users, progress, members, messages, rooms] = await Promise.all([
    prisma.user.count(),
    prisma.userProgress.count(),
    prisma.roomMember.count(),
    prisma.message.count(),
    prisma.chatRoom.count({ where: { members: { none: {} } } }),
  ]);
  return { users, progress, members, messages, rooms };
}

async function main() {
  console.log('🧹 Limpeza controlada de dados de usuários\n');

  const before = await countAll();
  console.log('📋 Antes da limpeza:');
  console.log(`   - usuários: ${before.users}`);
  console.log(`   - registros de progresso: ${before.progress}`);
  console.log(`   - membros de salas: ${before.members}`);
  console.log(`   - mensagens: ${before.messages}`);
  console.log(`   - salas órfãs (sem membros): ${before.rooms}`);

  if (DRY_RUN) {
    console.log('\n⚠️  DRY RUN — nenhum registro foi apagado.');
    return;
  }

  // Ordem de exclusão respeitando as foreign keys:
  // mensagens e membros primeiro, depois salas órfãs, progresso e usuários.
  const result = await prisma.$transaction(async (tx) => {
    const messages = await tx.message.deleteMany({});
    const members = await tx.roomMember.deleteMany({});
    const rooms = await tx.chatRoom.deleteMany({ where: { members: { none: {} } } });
    const progress = await tx.userProgress.deleteMany({});
    const users = await tx.user.deleteMany({});
    return { messages: messages.count, members: members.count, rooms: rooms.count, progress: progress.count, users: users.count };
  });

  console.log('\n✅ Limpeza concluída:');
  console.log(`   - mensagens removidas: ${result.messages}`);
  console.log(`   - membros de salas removidos: ${result.members}`);
  console.log(`   - salas órfãs removidas: ${result.rooms}`);
  console.log(`   - registros de progresso removidos: ${result.progress}`);
  console.log(`   - usuários removidos: ${result.users}`);

  const after = await countAll();
  console.log('\n📋 Depois da limpeza:');
  console.log(`   - usuários restantes: ${after.users}`);
  console.log(`   - progresso restante: ${after.progress}`);
  console.log(`   - membros restantes: ${after.members}`);
  console.log(`   - mensagens restantes: ${after.messages}`);
  console.log(`   - salas órfãs restantes: ${after.rooms}`);

  console.log('\n🛡️  Conteúdo do site preservado: módulos, aulas, acervo, whitelist e configurações.');
}

main()
  .catch((e) => {
    console.error('❌ Erro na limpeza:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });