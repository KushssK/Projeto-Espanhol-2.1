import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL não definida. Configure o .env antes de rodar o seed.');
  process.exit(1);
}

const adapter = new PrismaPg(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

const MODULES = [
  { orderIndex: 0, title: 'Conversação', description: 'Prática de conversação do dia a dia em espanhol.' },
  { orderIndex: 1, title: 'Cultura Hispânica', description: 'Tradições, costumes e diversidade dos países hispânicos.' },
  { orderIndex: 2, title: 'Dicas de Aprendizagem', description: 'Estratégias e técnicas para aprender espanhol de forma eficaz.' },
  { orderIndex: 3, title: 'Expressões e Girias do Cotidiano', description: 'Expressões idiomáticas e gírias usadas no dia a dia.' },
  { orderIndex: 4, title: 'Gramática', description: 'Regras gramaticais fundamentais da língua espanhola.' },
  { orderIndex: 5, title: 'Leitura e Compreensão de texto', description: 'Desenvolvimento da habilidade de leitura e compreensão.' },
  { orderIndex: 6, title: 'Pronúncia', description: 'Aperfeiçoamento da pronúncia e entonação do espanhol.' },
  { orderIndex: 7, title: 'Vocabulário', description: 'Ampliação do vocabulário temático e contextualizado.' },
];

const NEW_TITLES = MODULES.map(m => m.title);

async function main() {
  await prisma.appSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, themeColor: '#7C3AED', logoUrl: null },
  });

  const isForce = process.argv.includes('--force');

  // Verifica se há módulos antigos que não estão na nova lista
  const allModules = await prisma.module.findMany();
  const oldModules = allModules.filter(m => !NEW_TITLES.includes(m.title));

  if (oldModules.length > 0 && !isForce) {
    console.log(`\n⚠️  Encontrados ${oldModules.length} módulo(s) antigo(s) que não estão na nova lista:`);
    oldModules.forEach(m => console.log(`   - ${m.title}`));
    console.log(`\nPara removê-los, execute: npx tsx prisma/seed.ts --force\n`);
  }

  if (isForce && oldModules.length > 0) {
    // Modo destrutivo: remove módulos que não estão na nova lista
    console.log(`\n🗑️  Modo --force ativo: Removendo ${oldModules.length} módulo(s) antigo(s)...`);
    for (const mod of oldModules) {
      console.log(`   - Removendo: ${mod.title}`);
      await prisma.module.delete({ where: { id: mod.id } });
    }
    console.log('   ✅ Remoção concluída.\n');
  }

  // Cria ou atualiza cada módulo (idempotente)
  let created = 0;
  let updated = 0;
  for (const mod of MODULES) {
    const existing = await prisma.module.findFirst({
      where: { title: mod.title },
    });

    if (existing) {
      await prisma.module.update({
        where: { id: existing.id },
        data: { orderIndex: mod.orderIndex, description: mod.description },
      });
      updated++;
    } else {
      await prisma.module.create({ data: mod });
      created++;
    }
  }

  console.log(`\n✅ Seed concluído: AppSettings + 8 módulos curriculares.`);
  if (created > 0) console.log(`   📝 ${created} módulo(s) criado(s).`);
  if (updated > 0) console.log(`   🔄 ${updated} módulo(s) atualizado(s).`);
  console.log('');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
