/**
 * Seed idempotente da WhitelistEmail — executado na inicialização do servidor.
 *
 * - Insere e-mails autorizados para cadastro com role automática.
 * - Se o e-mail já existe, não duplica nem causa erro.
 * - NENHUM e-mail aparece em logs (apenas contadores).
 * - Seguro para executar em cada restart do Render.
 */

import { prisma } from './prisma';

/**
 * Entradas da whitelist de e-mails.
 * Formato: { email: '<e-mail normalizado>', role: 'ADMIN' | 'TEACHER' }
 *
 * ⚠️  NÃO exponha este array em logs, responses ou código público.
 */
const WHITELIST_ENTRIES: Array<{ email: string; role: 'ADMIN' | 'TEACHER' }> = [
  { email: 'kaikyzen@gmail.com', role: 'ADMIN' },
];

export async function seedEmailWhitelist(): Promise<void> {
  let inserted = 0;
  let skipped = 0;

  for (const entry of WHITELIST_ENTRIES) {
    try {
      const normalizedEmail = entry.email.trim().toLowerCase();

      const exists = await prisma.whitelistEmail.findUnique({
        where: { email: normalizedEmail },
        select: { email: true },
      });

      if (exists) {
        skipped++;
        continue;
      }

      await prisma.whitelistEmail.create({
        data: { email: normalizedEmail, role: entry.role },
      });
      inserted++;
    } catch {
      // Se houver erro de concorrência, ignorar
      skipped++;
    }
  }

  if (inserted > 0 || skipped > 0) {
    console.log(`🔐 Whitelist de e-mails: ${inserted} registro(s) inserido(s), ${skipped} já existente(s).`);
  }
}
