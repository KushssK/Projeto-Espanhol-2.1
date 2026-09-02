/**
 * Seed dos 8 módulos curriculares oficiais.
 *
 * Executa automaticamente a cada startup do backend.
 * Idempotente: cria módulos que não existem, NÃO altera os existentes.
 *
 * Diferente do prisma/seed.ts (que sobrescreve orderIndex/description),
 * este seed NÃO modifica módulos já criados — preserva edições administrativas.
 */

import { prisma } from './prisma';

interface ModuleData {
  title: string;
  description: string;
  orderIndex: number;
}

// 8 módulos oficiais do curso
const OFFICIAL_MODULES: ModuleData[] = [
  { title: 'Conversação', description: 'Prática de conversação do dia a dia em espanhol.', orderIndex: 0 },
  { title: 'Cultura Hispânica', description: 'Tradições, costumes e diversidade dos países hispânicos.', orderIndex: 1 },
  { title: 'Dicas de Aprendizagem', description: 'Estratégias e técnicas para aprender espanhol de forma eficaz.', orderIndex: 2 },
  { title: 'Expressões e Girias do Cotidiano', description: 'Expressões idiomáticas e gírias usadas no dia a dia.', orderIndex: 3 },
  { title: 'Gramática', description: 'Regras gramaticais fundamentais da língua espanhola.', orderIndex: 4 },
  { title: 'Leitura e Compreensão de texto', description: 'Desenvolvimento da habilidade de leitura e compreensão.', orderIndex: 5 },
  { title: 'Pronúncia', description: 'Aperfeiçoamento da pronúncia e entonação do espanhol.', orderIndex: 6 },
  { title: 'Vocabulário', description: 'Ampliação do vocabulário temático e contextualizado.', orderIndex: 7 },
];

/**
 * Seed idempotente — cria módulos que não existem.
 * NÃO altera módulos existentes (preserva edições administrativas).
 */
export async function seedModules(): Promise<void> {
  let created = 0;
  let existing = 0;

  for (const mod of OFFICIAL_MODULES) {
    const found = await prisma.module.findFirst({
      where: { title: mod.title },
      select: { id: true },
    });

    if (found) {
      existing++;
      continue;
    }

    await prisma.module.create({
      data: {
        title: mod.title,
        description: mod.description,
        orderIndex: mod.orderIndex,
      },
    });
    created++;
  }

  if (created > 0) {
    console.log(`📚 [SEED] Módulos: ${created} criado(s), ${existing} já existente(s).`);
  } else {
    console.log(`📚 [SEED] Módulos: todos os ${OFFICIAL_MODULES.length} módulos oficiais já existem.`);
  }
}
