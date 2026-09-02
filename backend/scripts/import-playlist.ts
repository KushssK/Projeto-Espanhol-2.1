/**
 * Import video lessons from a scraped YouTube playlist JSON into the database.
 *
 * Usage:
 *   npx tsx scripts/import-playlist.ts <playlist-json-file> <module-title>
 *
 * Example:
 *   npx tsx scripts/import-playlist.ts scripts/conversacao-playlist.json "Conversação"
 */

import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import * as fs from 'fs';
import * as path from 'path';

interface PlaylistVideo {
  index: number;
  videoId: string;
  title: string;
  url: string;
}

// Descriptions for each video topic (generated for Conversação module)
const DESCRIPTIONS: Record<string, string> = {
  'Cotidiano': 'Aula de conversação sobre situações do cotidiano em espanhol. Aprenda vocabulário e expressões usadas no dia a dia.',
  'Ligação Telefônica': 'Aula de conversação sobre como fazer ligações telefônicas em espanhol. Expressões e vocabulário para telefonemas.',
  'Reunião e Trabalho': 'Aula de conversação sobre reuniões e ambiente de trabalho em espanhol. Vocabulário profissional.',
  'Compras': 'Aula de conversação sobre compras em espanhol. Números, preços, tamanhos e expressões de loja.',
  'Aeroporto': 'Aula de conversação sobre situações em aeroporto em espanhol. Check-in, embarque e viagens.',
  'Hotel': 'Aula de conversação sobre check-in, check-out e serviços de hotel em espanhol.',
  'Supermercado': 'Aula de conversação sobre compras no supermercado em espanhol. Alimentos, pesos e preços.',
  'Restaurante': 'Aula de conversação sobre pedir comida em restaurante em espanhol. Cardápio, garçom e dicas.',
  'Perguntas e Respostas': 'Aula de conversação com perguntas e respostas para praticar fluência em espanhol.',
  'Saudações': 'Aula de conversação sobre formas de saudação e apresentação em espanhol.',
  'Apresentação': 'Aula de conversação sobre como se apresentar em espanhol. Nome, profissão e dados pessoais.',
};

function getVideoUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

async function createPrisma(): Promise<PrismaClient> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ DATABASE_URL not set. Configure .env before running.');
    process.exit(1);
  }

  if (dbUrl.startsWith('postgresql') || dbUrl.startsWith('postgres')) {
    const { PrismaPg } = await import('@prisma/adapter-pg');
    const adapter = new PrismaPg(dbUrl);
    console.log('🔌 Connected to PostgreSQL');
    return new PrismaClient({ adapter });
  }

  console.log('🔌 Connected to MySQL/MariaDB');
  return new PrismaClient();
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: npx tsx scripts/import-playlist.ts <playlist-json-file> <module-title>');
    console.error('Example: npx tsx scripts/import-playlist.ts scripts/conversacao-playlist.json "Conversação"');
    process.exit(1);
  }

  const jsonPath = path.resolve(args[0]);
  const moduleTitle = args[1];

  // Read playlist data
  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ File not found: ${jsonPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(jsonPath, 'utf-8');
  const videos: PlaylistVideo[] = JSON.parse(raw);

  console.log(`\n📋 Playlist: ${videos.length} videos found`);

  const prisma = await createPrisma();

  try {
    // Find module
    const module = await prisma.module.findFirst({
      where: { title: moduleTitle },
    });

    if (!module) {
      console.error(`❌ Module "${moduleTitle}" not found in database.`);
      console.error('Available modules:');
      const allModules = await prisma.module.findMany({ select: { id: true, title: true } });
      allModules.forEach(m => console.error(`  - ${m.title} (${m.id})`));
      process.exit(1);
    }

    console.log(`✅ Module: "${module.title}" (${module.id})`);

    // Get existing lessons to check for duplicates
    const existingLessons = await prisma.lesson.findMany({
      where: { moduleId: module.id },
      select: { videoUrl: true, id: true },
    });

    const existingVideoIds = new Set<string>();
    for (const lesson of existingLessons) {
      if (lesson.videoUrl) {
        const match = lesson.videoUrl.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/);
        if (match) {
          existingVideoIds.add(match[1]);
        }
      }
    }

    console.log(`ℹ️  Existing lessons in module: ${existingLessons.length}`);
    console.log(`ℹ️  Unique video IDs already in database: ${existingVideoIds.size}\n`);

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const video of videos) {
      // Check for duplicate
      if (existingVideoIds.has(video.videoId)) {
        console.log(`  ⏭️  [${video.index}] SKIPPED (already exists): ${video.title} (${video.videoId})`);
        skipped++;
        continue;
      }

      try {
        const title = video.title || `Aula ${video.index}`;
        const description = DESCRIPTIONS[title] || `Videoaula de espanhol: ${title}`;
        const videoUrl = getVideoUrl(video.videoId);

        await prisma.lesson.create({
          data: {
            moduleId: module.id,
            title,
            content: description,
            videoUrl,
            orderIndex: video.index,
            published: true,
          },
        });

        console.log(`  ✅ [${video.index}] CREATED: ${title} (${video.videoId})`);
        created++;
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error(`  ❌ [${video.index}] ERROR: ${video.title} — ${msg}`);
        errors++;
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 IMPORT SUMMARY');
    console.log('='.repeat(60));
    console.log(`  Module:             ${module.title}`);
    console.log(`  Videos in playlist: ${videos.length}`);
    console.log(`  Created:            ${created}`);
    console.log(`  Skipped (dup):      ${skipped}`);
    console.log(`  Errors:             ${errors}`);
    console.log('='.repeat(60));

    // List final state
    const finalLessons = await prisma.lesson.findMany({
      where: { moduleId: module.id },
      orderBy: { orderIndex: 'asc' },
      select: { title: true, orderIndex: true, published: true, videoUrl: true },
    });

    console.log(`\n📚 Final lessons in "${module.title}" (${finalLessons.length}):`);
    for (const l of finalLessons) {
      const vidMatch = l.videoUrl?.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/);
      const vidId = vidMatch ? vidMatch[1] : 'N/A';
      const status = l.published ? '🟢' : '⚪';
      console.log(`  ${status} ${l.orderIndex}. ${l.title} [${vidId}]`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
