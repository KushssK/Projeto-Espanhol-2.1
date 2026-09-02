/**
 * Seed de videoaulas — todos os módulos.
 *
 * Executa automaticamente a cada startup do backend.
 * Idempotente: não duplica aulas que já existem (verifica por videoUrl).
 * Reordena aulas existentes se o orderIndex estiver diferente do ideal.
 *
 * Dados extraídos de playlists do YouTube:
 * - Conversação: https://www.youtube.com/playlist?list=PLQr_uaxVWO-4
 * - Cultura Hispânica: https://www.youtube.com/playlist?list=PLPsIFGPwZi7A
 */

import { prisma } from './prisma';

interface VideoData {
  /** Posição ideal na sequência pedagógica (1-based) */
  orderIndex: number;
  videoId: string;
  title: string;
  url: string;
  description: string;
}

interface ModuleSeedData {
  moduleTitle: string;
  videos: VideoData[];
}

// ============================================================================
// CONVERSAÇÃO — 11 vídeos
// Playlist: https://www.youtube.com/playlist?list=PLQr_uaxVWO-4
//
// Ordem pedagógica:
//  1. Saudações — primeiro contato com o idioma
//  2. Apresentação — como se apresentar
//  3. Cotidiano — situações do dia a dia
//  4. Perguntas e Respostas — praticar fluência
//  5. Compras — necessidade cotidiana
//  6. Supermercado — compra específica
//  7. Restaurante — serviços de alimentação
//  8. Ligação Telefônica — exigem escuta e fala
//  9. Hotel — cenário de viagem
// 10. Aeroporto — viagem mais complexa
// 11. Reunião e Trabalho — contexto profissional
// ============================================================================

const CONVERSACAO_VIDEOS: VideoData[] = [
  { orderIndex: 1, videoId: 'xatSPqo44T8', title: 'Saudações', url: 'https://www.youtube.com/watch?v=xatSPqo44T8', description: 'Aula de conversação sobre formas de saudação e apresentação em espanhol.' },
  { orderIndex: 2, videoId: '7iSXdEwxAXk', title: 'Apresentação', url: 'https://www.youtube.com/watch?v=7iSXdEwxAXk', description: 'Aula de conversação sobre como se apresentar em espanhol. Nome, profissão e dados pessoais.' },
  { orderIndex: 3, videoId: 'o7Fwo6rOFZk', title: 'Cotidiano', url: 'https://www.youtube.com/watch?v=o7Fwo6rOFZk', description: 'Aula de conversação sobre situações do cotidiano em espanhol. Aprenda vocabulário e expressões usadas no dia a dia.' },
  { orderIndex: 4, videoId: 'c6HLXya2lMo', title: 'Perguntas e Respostas', url: 'https://www.youtube.com/watch?v=c6HLXya2lMo', description: 'Aula de conversação com perguntas e respostas para praticar fluência em espanhol.' },
  { orderIndex: 5, videoId: 'FVjWIhNGRwo', title: 'Compras', url: 'https://www.youtube.com/watch?v=FVjWIhNGRwo', description: 'Aula de conversação sobre compras em espanhol. Números, preços, tamanhos e expressões de loja.' },
  { orderIndex: 6, videoId: 'eO1N-N07kYk', title: 'Supermercado', url: 'https://www.youtube.com/watch?v=eO1N-N07kYk', description: 'Aula de conversação sobre compras no supermercado em espanhol. Alimentos, pesos e preços.' },
  { orderIndex: 7, videoId: '190jzUDtxjo', title: 'Restaurante', url: 'https://www.youtube.com/watch?v=190jzUDtxjo', description: 'Aula de conversação sobre pedir comida em restaurante em espanhol. Cardápio, garçom e dicas.' },
  { orderIndex: 8, videoId: 'CytRT1eMLTA', title: 'Ligação Telefônica', url: 'https://www.youtube.com/watch?v=CytRT1eMLTA', description: 'Aula de conversação sobre como fazer ligações telefônicas em espanhol. Expressões e vocabulário para telefonemas.' },
  { orderIndex: 9, videoId: 'KgQSOnfPvzY', title: 'Hotel', url: 'https://www.youtube.com/watch?v=KgQSOnfPvzY', description: 'Aula de conversação sobre check-in, check-out e serviços de hotel em espanhol.' },
  { orderIndex: 10, videoId: 'FPL2uuSgF-o', title: 'Aeroporto', url: 'https://www.youtube.com/watch?v=FPL2uuSgF-o', description: 'Aula de conversação sobre situações em aeroporto em espanhol. Check-in, embarque e viagens.' },
  { orderIndex: 11, videoId: 'k3bENEgWc9Q', title: 'Reunião e Trabalho', url: 'https://www.youtube.com/watch?v=k3bENEgWc9Q', description: 'Aula de conversação sobre reuniões e ambiente de trabalho em espanhol. Vocabulário profissional.' },
];

// ============================================================================
// CULTURA HISPÂNICA — 9 vídeos
// Playlist: https://www.youtube.com/playlist?list=PLPsIFGPwZi7A
//
// Ordem pedagógica:
//  1. Origem do Espanhol e suas Diferenças — base histórica e linguística
//  2. Países Hispanohablantes — geografia e diversidade
//  3. Costumes — práticas culturais cotidianas
//  4. Curiosidades — fatos interessantes que engajam
//  5. Literatura — expressão cultural através de textos
//  6. Filmes — cultura audiovisual cinematográfica
//  7. Séries — cultura audiovisual contemporânea
//  8. Música Hispânica — expressão musical e identidade
//  9. Gastronomía Típica — culinária como ponte cultural
// ============================================================================

const CULTURA_HISPANICA_VIDEOS: VideoData[] = [
  { orderIndex: 1, videoId: 'vLLjhcfzTbA', title: 'Origem do Espanhol e suas Diferenças', url: 'https://www.youtube.com/watch?v=vLLjhcfzTbA', description: 'Aula sobre a origem da língua espanhola, sua evolução histórica e as principais diferenças entre as variantes regionais.' },
  { orderIndex: 2, videoId: 'aggsWpvTP2A', title: 'Países Hispanohablantes', url: 'https://www.youtube.com/watch?v=aggsWpvTP2A', description: 'Visão geral dos países de língua espanhola, sua geografia, população e diversidade cultural.' },
  { orderIndex: 3, videoId: 'frQ8itDbse0', title: 'Costumes', url: 'https://www.youtube.com/watch?v=frQ8itDbse0', description: 'Aula sobre os principais costumes e tradições dos países hispânicos no dia a dia.' },
  { orderIndex: 4, videoId: 'KfX4UF_UOY4', title: 'Curiosidades', url: 'https://www.youtube.com/watch?v=KfX4UF_UOY4', description: 'Curiosidades fascinantes sobre a cultura, sociedade e tradições dos países de língua espanhola.' },
  { orderIndex: 5, videoId: 'Ce91Qcibyn8', title: 'Literatura', url: 'https://www.youtube.com/watch?v=Ce91Qcibyn8', description: 'Aula sobre a literatura hispânica: autores, obras e movimentos literários mais importantes.' },
  { orderIndex: 6, videoId: 'IhsG4JzrVCM', title: 'Filmes', url: 'https://www.youtube.com/watch?v=IhsG4JzrVCM', description: 'Aula sobre o cinema hispânico: gêneros, diretores e filmes essenciais da cultura latina.' },
  { orderIndex: 7, videoId: '1iYOYjJLHlk', title: 'Séries', url: 'https://www.youtube.com/watch?v=1iYOYjJLHlk', description: 'Aula sobre as séries em espanhol: produções populares, plataformas e impacto cultural.' },
  { orderIndex: 8, videoId: '7KsWkO7SrTE', title: 'Música Hispânica', url: 'https://www.youtube.com/watch?v=7KsWkO7SrTE', description: 'Aula sobre a música hispânica: gêneros, artistas e a importância da música na cultura latina.' },
  { orderIndex: 9, videoId: '1LoFuGneDwM', title: 'Gastronomía Típica', url: 'https://www.youtube.com/watch?v=1LoFuGneDwM', description: 'Aula sobre a gastronomia típica dos países hispânicos: pratos tradicionais e sua importância cultural.' },
];

// ============================================================================
// DADOS CENTRALIZADOS — adicione novos módulos aqui
// ============================================================================

const ALL_MODULES: ModuleSeedData[] = [
  { moduleTitle: 'Conversação', videos: CONVERSACAO_VIDEOS },
  { moduleTitle: 'Cultura Hispânica', videos: CULTURA_HISPANICA_VIDEOS },
];

// ============================================================================
// FUNÇÃO GENÉRICA DE SEED
// ============================================================================

/**
 * Seed idempotente para um único módulo.
 * Cria aulas que não existem, reordena as existentes.
 * NÃO altera título, descrição, published ou outros campos de aulas existentes.
 */
async function seedModuleLessons(moduleTitle: string, videos: VideoData[]): Promise<void> {
  const mod = await prisma.module.findFirst({
    where: { title: moduleTitle },
  });

  if (!mod) {
    console.log(`⚠️  [SEED] Módulo "${moduleTitle}" não encontrado. Seed ignorado.`);
    return;
  }

  const existingLessons = await prisma.lesson.findMany({
    where: { moduleId: mod.id },
    select: { videoUrl: true, orderIndex: true },
  });

  const existingUrls = new Set(existingLessons.map(l => l.videoUrl).filter(Boolean));

  let created = 0;
  let skipped = 0;

  for (const video of videos) {
    if (existingUrls.has(video.url)) {
      skipped++;
      continue;
    }

    await prisma.lesson.create({
      data: {
        moduleId: mod.id,
        title: video.title,
        content: video.description,
        videoUrl: video.url,
        orderIndex: video.orderIndex,
        published: true,
      },
    });
    created++;
  }

  // Reordenar aulas existentes se o orderIndex estiver diferente do ideal
  let reordered = 0;
  for (const video of videos) {
    const found = existingLessons.find(l => l.videoUrl === video.url);
    if (found) {
      const full = await prisma.lesson.findFirst({
        where: { videoUrl: video.url },
        select: { id: true, orderIndex: true },
      });
      if (full && full.orderIndex !== video.orderIndex) {
        await prisma.lesson.update({
          where: { id: full.id },
          data: { orderIndex: video.orderIndex },
        });
        reordered++;
      }
    }
  }

  if (created > 0 || reordered > 0) {
    const parts: string[] = [];
    if (created > 0) parts.push(`${created} criada(s)`);
    if (skipped > 0) parts.push(`${skipped} já existente(s)`);
    if (reordered > 0) parts.push(`${reordered} reordenada(s)`);
    console.log(`🎬 [SEED] ${moduleTitle}: ${parts.join(', ')}.`);
  } else {
    console.log(`🎬 [SEED] ${moduleTitle}: todas as ${videos.length} videoaulas já existem e estão ordenadas.`);
  }
}

/**
 * Seed de videoaulas para todos os módulos.
 * Executa a cada startup — idempotente e seguro.
 */
export async function seedAllLessons(): Promise<void> {
  for (const mod of ALL_MODULES) {
    try {
      await seedModuleLessons(mod.moduleTitle, mod.videos);
    } catch (err) {
      console.error(`⚠️  [SEED] Erro ao semear "${mod.moduleTitle}" (não bloqueante):`, err);
    }
  }
}
