/**
 * auth-diag-deploy.ts — diagnóstico TEMPORÁRIO e READ-ONLY do login (a remover após o uso).
 *
 * Executa no ambiente do Render (build), usando a DATABASE_URL que JÁ existe no
 * ambiente de produção — a URL NUNCA é impressa nem commitada.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * COMO ATIVAR (painel do Render → Environment → adicionar variável → Deploy):
 *
 *   AUTH_DIAG_EMAIL=<e-mail da conta a diagnosticar>
 *
 * O log do build imprimirá APENAS:
 *   - usuário encontrado (SIM/NÃO)
 *   - passwordHash preenchido (SIM/NÃO)
 *   - accessCodeHash preenchido (SIM/NÃO)
 *   - failedLoginAttempts (número)
 *   - lockoutUntil (nulo/ativo/expirado)
 *   - isBanned (SIM/NÃO)
 *   - role
 *   - createdAt
 *
 * NUNCA imprime: passwordHash, accessCodeHash, senha, código, DATABASE_URL,
 * JWT_SECRET ou qualquer credencial. Depois do diagnóstico, REMOVA a variável
 * e apague este arquivo (junto com a entrada no build do package.json).
 *
 * Sem AUTH_DIAG_EMAIL o script é um no-op: não conecta no banco e não altera nada.
 * Nenhuma escrita é feita — somente SELECT.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const DIAG_EMAIL = (process.env.AUTH_DIAG_EMAIL || '').trim().toLowerCase();

async function main() {
  // ── Modo desativado: no-op absoluto (deploys normais) ─────────────────────
  if (!DIAG_EMAIL) {
    console.log('[auth-diag] inativo — AUTH_DIAG_EMAIL não definido. Nenhuma verificação foi feita.');
    return;
  }

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('[auth-diag] ERRO: DATABASE_URL não definida no ambiente. Nada foi verificado.');
    process.exit(1);
  }

  // Diagnóstico do banco SEM expor a URL/senha (mesmo padrão dos demais scripts)
  let host = '(desconhecido)';
  let database = '(desconhecido)';
  try {
    const parsed = new URL(dbUrl);
    host = parsed.hostname;
    database = parsed.pathname.substring(1);
  } catch {
    console.error('[auth-diag] ERRO: DATABASE_URL não é uma URL válida.');
    process.exit(1);
  }

  console.log('[auth-diag] conectando ao PostgreSQL de produção (somente leitura)...');
  console.log(`   Host: ${host}`);
  console.log(`   Database: ${database}`);

  const adapter = new PrismaPg(dbUrl);
  const prisma = new PrismaClient({ adapter });

  try {
    // Somente SELECT. Nenhum valor de hash sai do processo — apenas presença (boolean).
    const user = await prisma.user.findUnique({
      where: { email: DIAG_EMAIL },
      select: {
        email: true,
        passwordHash: true,
        accessCodeHash: true,
        failedLoginAttempts: true,
        lockoutUntil: true,
        isBanned: true,
        role: true,
        createdAt: true,
      },
    });

    console.log('────────────────────────────────────────────────');
    console.log('  DIAGNÓSTICO DE LOGIN');
    console.log('────────────────────────────────────────────────');
    if (!user) {
      console.log(`   E-mail verificado: ${DIAG_EMAIL}`);
      console.log('   User encontrado: NÃO');
      console.log('\n   Nenhuma outra coluna foi consultada. Se o cadastro retornou sucesso,');
      console.log('   confira se o e-mail digitado no login é EXATAMENTE o do cadastro.');
      return;
    }

    const hasPassword = user.passwordHash !== null && user.passwordHash !== undefined;
    const hasAccessCode = user.accessCodeHash !== null && user.accessCodeHash !== undefined;

    let lockout = 'nulo';
    if (user.lockoutUntil) {
      const diffMin = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / 60_000);
      lockout = diffMin > 0 ? `ativo (~${diffMin} min restantes)` : 'expirado';
    }

    console.log(`   E-mail verificado: ${user.email}`);
    console.log(`   User encontrado: SIM`);
    console.log(`   passwordHash preenchido: ${hasPassword ? 'SIM' : 'NÃO'}`);
    console.log(`   accessCodeHash preenchido: ${hasAccessCode ? 'SIM' : 'NÃO'}`);
    console.log(`   failedLoginAttempts: ${user.failedLoginAttempts}`);
    console.log(`   lockoutUntil: ${lockout}`);
    console.log(`   isBanned: ${user.isBanned ? 'SIM' : 'NÃO'}`);
    console.log(`   role: ${user.role}`);
    console.log(`   createdAt: ${user.createdAt.toISOString()}`);
    console.log('\n   Nenhum hash, senha, código, URL ou segredo foi impresso.');
  } finally {
    await prisma.$disconnect();
  }
}

// Garantir que erros não tratados causem exit 1 (deploy falha visivelmente)
process.on('unhandledRejection', (err) => {
  console.error('❌ [auth-diag] Unhandled rejection:', err);
  process.exit(1);
});

main().catch((err) => {
  console.error('❌ [auth-diag] Erro não tratado em main():', err);
  process.exit(1);
});
