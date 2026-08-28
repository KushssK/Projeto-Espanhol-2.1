/**
 * Seed idempotente da Whitelist_CPF — executado na inicialização do servidor.
 *
 * - Insere CPFs autorizados para cadastro de Staff/Admin.
 * - Se o CPF já existe, não duplica nem causa erro.
 * - NENHUM valor de CPF aparece em logs (apenas contadores).
 * - Seguro para executar em cada restart do Render.
 */

import { prisma } from './prisma';

/**
 * Entradas da whitelist.
 * Formato: { cpf: '<11 dígitos>', role: 'ADMIN' | 'TEACHER' }
 *
 * ⚠️  NÃO exponha este array em logs, responses ou código público.
 */
const WHITELIST_ENTRIES: Array<{ cpf: string; role: 'ADMIN' | 'TEACHER' }> = [
  { cpf: '11533361541', role: 'ADMIN' },
];

export async function seedWhitelist(): Promise<void> {
  let inserted = 0;
  let skipped = 0;

  for (const entry of WHITELIST_ENTRIES) {
    try {
      const exists = await prisma.whitelist_CPF.findUnique({
        where: { cpf: entry.cpf },
        select: { cpf: true },
      });

      if (exists) {
        skipped++;
        continue;
      }

      await prisma.whitelist_CPF.create({
        data: { cpf: entry.cpf, role: entry.role },
      });
      inserted++;
    } catch {
      // Se houver erro de concorrência (outro processo inseriu ao mesmo tempo), ignorar
      skipped++;
    }
  }

  if (inserted > 0 || skipped > 0) {
    console.log(`🔐 Whitelist: ${inserted} registro(s) inserido(s), ${skipped} já existente(s).`);
  }
}
