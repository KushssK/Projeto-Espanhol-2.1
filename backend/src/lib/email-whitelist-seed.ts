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
  { email: 'espanholemrede@gmail.com', role: 'ADMIN' },
  { email: 'matheusfds408@gmail.com', role: 'ADMIN' },
];

export async function seedEmailWhitelist(): Promise<void> {
  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  let usersPromoted = 0;

  for (const entry of WHITELIST_ENTRIES) {
    try {
      const normalizedEmail = entry.email.trim().toLowerCase();

      const exists = await prisma.whitelistEmail.findUnique({
        where: { email: normalizedEmail },
        select: { email: true, role: true },
      });

      if (exists) {
        // Se o e-mail já existe mas com role diferente, forçar para a role correta
        if (exists.role !== entry.role) {
          await prisma.whitelistEmail.update({
            where: { email: normalizedEmail },
            data: { role: entry.role },
          });
          updated++;
        } else {
          skipped++;
        }
      } else {
        await prisma.whitelistEmail.create({
          data: { email: normalizedEmail, role: entry.role },
        });
        inserted++;
      }

      // Se o usuário já estiver cadastrado na tabela User com role inferior, atualizar
      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingUser && existingUser.role !== entry.role) {
        await prisma.user.update({
          where: { email: normalizedEmail },
          data: { role: entry.role },
        });
        usersPromoted++;
      }
    } catch {
      // Se houver erro de concorrência, ignorar
      skipped++;
    }
  }

  if (inserted > 0 || updated > 0 || skipped > 0 || usersPromoted > 0) {
    const parts: string[] = [];
    if (inserted > 0) parts.push(`${inserted} inserido(s)`);
    if (updated > 0) parts.push(`${updated} atualizado(s)`);
    if (skipped > 0) parts.push(`${skipped} já existente(s)`);
    if (usersPromoted > 0) parts.push(`${usersPromoted} usuário(s) promovido(s) a ADMIN`);
    console.log(`🔐 Whitelist de e-mails: ${parts.join(', ')}.`);
  }
}

