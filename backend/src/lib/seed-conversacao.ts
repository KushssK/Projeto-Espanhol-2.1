/**
 * Seed das videoaulas do módulo "Conversação".
 *
 * Executa automaticamente a cada startup do backend.
 * Idempotente: não duplica aulas que já existem (verifica por videoUrl).
 *
 * Dados extraídos da playlist do YouTube:
 * https://www.youtube.com/playlist?list=PLQr_uaxVWO-4
 */

import { prisma } from './prisma';

interface VideoData {
  index: number;
  videoId: string;
  title: string;
  url: string;
  description: string;
}

// 11 vídeos da playlist "Conversação" do canal Construindo Saberes
const CONVERSACAO_VIDEOS: VideoData[] = [
  {
    index: 1,
    videoId: 'o7Fwo6rOFZk',
    title: 'Cotidiano',
    url: 'https://www.youtube.com/watch?v=o7Fwo6rOFZk',
    description: 'Aula de conversação sobre situações do cotidiano em espanhol. Aprenda vocabulário e expressões usadas no dia a dia.',
  },
  {
    index: 2,
    videoId: 'CytRT1eMLTA',
    title: 'Ligação Telefônica',
    url: 'https://www.youtube.com/watch?v=CytRT1eMLTA',
    description: 'Aula de conversação sobre como fazer ligações telefônicas em espanhol. Expressões e vocabulário para telefonemas.',
  },
  {
    index: 3,
    videoId: 'k3bENEgWc9Q',
    title: 'Reunião e Trabalho',
    url: 'https://www.youtube.com/watch?v=k3bENEgWc9Q',
    description: 'Aula de conversação sobre reuniões e ambiente de trabalho em espanhol. Vocabulário profissional.',
  },
  {
    index: 4,
    videoId: 'FVjWIhNGRwo',
    title: 'Compras',
    url: 'https://www.youtube.com/watch?v=FVjWIhNGRwo',
    description: 'Aula de conversação sobre compras em espanhol. Números, preços, tamanhos e expressões de loja.',
  },
  {
    index: 5,
    videoId: 'FPL2uuSgF-o',
    title: 'Aeroporto',
    url: 'https://www.youtube.com/watch?v=FPL2uuSgF-o',
    description: 'Aula de conversação sobre situações em aeroporto em espanhol. Check-in, embarque e viagens.',
  },
  {
    index: 6,
    videoId: 'KgQSOnfPvzY',
    title: 'Hotel',
    url: 'https://www.youtube.com/watch?v=KgQSOnfPvzY',
    description: 'Aula de conversação sobre check-in, check-out e serviços de hotel em espanhol.',
  },
  {
    index: 7,
    videoId: 'eO1N-N07kYk',
    title: 'Supermercado',
    url: 'https://www.youtube.com/watch?v=eO1N-N07kYk',
    description: 'Aula de conversação sobre compras no supermercado em espanhol. Alimentos, pesos e preços.',
  },
  {
    index: 8,
    videoId: '190jzUDtxjo',
    title: 'Restaurante',
    url: 'https://www.youtube.com/watch?v=190jzUDtxjo',
    description: 'Aula de conversação sobre pedir comida em restaurante em espanhol. Cardápio, garçom e dicas.',
  },
  {
    index: 9,
    videoId: 'c6HLXya2lMo',
    title: 'Perguntas e Respostas',
    url: 'https://www.youtube.com/watch?v=c6HLXya2lMo',
    description: 'Aula de conversação com perguntas e respostas para praticar fluência em espanhol.',
  },
  {
    index: 10,
    videoId: 'xatSPqo44T8',
    title: 'Saudações',
    url: 'https://www.youtube.com/watch?v=xatSPqo44T8',
    description: 'Aula de conversação sobre formas de saudação e apresentação em espanhol.',
  },
  {
    index: 11,
    videoId: '7iSXdEwxAXk',
    title: 'Apresentação',
    url: 'https://www.youtube.com/watch?v=7iSXdEwxAXk',
    description: 'Aula de conversação sobre como se apresentar em espanhol. Nome, profissão e dados pessoais.',
  },
];

/**
 * Seed idempotente — insere as videoaulas da playlist se o módulo existir
 * e as aulas ainda não estiverem cadastradas.
 */
export async function seedConversacaoLessons(): Promise<void> {
  try {
    // Buscar módulo "Conversação"
    const module = await prisma.module.findFirst({
      where: { title: 'Conversação' },
    });

    if (!module) {
      console.log('⚠️  [SEED] Módulo "Conversação" não encontrado. Seed de videoaulas ignorado.');
      return;
    }

    // Buscar videoUrls existentes para detectar duplicatas
    const existingLessons = await prisma.lesson.findMany({
      where: { moduleId: module.id },
      select: { videoUrl: true },
    });

    const existingUrls = new Set(existingLessons.map(l => l.videoUrl).filter(Boolean));

    let created = 0;
    let skipped = 0;

    for (const video of CONVERSACAO_VIDEOS) {
      if (existingUrls.has(video.url)) {
        skipped++;
        continue;
      }

      await prisma.lesson.create({
        data: {
          moduleId: module.id,
          title: video.title,
          content: video.description,
          videoUrl: video.url,
          orderIndex: video.index,
          published: true,
        },
      });
      created++;
    }

    if (created > 0) {
      console.log(`🎬 [SEED] Conversação: ${created} videoaula(s) criada(s), ${skipped} já existente(s).`);
    } else {
      console.log(`🎬 [SEED] Conversação: todas as ${CONVERSACAO_VIDEOS.length} videoaulas já existem.`);
    }
  } catch (err) {
    console.error('⚠️  [SEED] Erro ao semear videoaulas de Conversação (não bloqueante):', err);
  }
}
