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
// DICAS DE APRENDIZAGEM — 3 vídeos
// Playlist: https://www.youtube.com/playlist?list=PLUj1ZfaWpkio
//
// Ordem pedagógica (já adequada na playlist original):
//  1. 50 Palavras-chave — vocabulário fundamental para conversação
//  2. Técnicas de memorização — como reter o que foi aprendido
//  3. Aplicativos de estudo — ferramentas para praticar
// ============================================================================

const DICAS_APRENDIZAGEM_VIDEOS: VideoData[] = [
  { orderIndex: 1, videoId: 'N5gL6kVv8ck', title: '50 Palavras-chave e Expressões Úteis para Conversar em Espanhol', url: 'https://www.youtube.com/watch?v=N5gL6kVv8ck', description: 'As 50 palavras-chave e expressões mais úteis para iniciar uma conversa em espanhol. Vocabulário essencial para o dia a dia.' },
  { orderIndex: 2, videoId: '2fDuDyB3WKI', title: '4 Técnicas para Memorizar Palavras em Espanhol', url: 'https://www.youtube.com/watch?v=2fDuDyB3WKI', description: 'Quatro técnicas comprovadas para memorizar vocabulário em espanhol de forma eficaz e duradoura.' },
  { orderIndex: 3, videoId: 'l5cVlwebFng', title: 'Aplicativos de Estudo Para Aprender Espanhol', url: 'https://www.youtube.com/watch?v=l5cVlwebFng', description: 'Dica dos melhores aplicativos gratuitos e pagos para praticar e aprender espanhol no dia a dia.' },
];

// ============================================================================
// EXPRESSÕES E GÍRIAS DO COTIDIANO — 6 vídeos
// Playlist: https://www.youtube.com/playlist?list=PLV_LcqpNBjGw
//
// Ordem pedagógica:
//  1. Diferenças Europeu vs Latino — contexto linguístico
//  2. Falsos Cognatos — erros comuns a evitar
//  3. Expressões do Dia a Dia — expressões básicas
//  4. 100 Frases do Cotidiano — repertório mais amplo
//  5. Gírias mais Comuns — gírias frequentes
//  6. 10 Gírias Populares — gírias adicionais
// ============================================================================

const EXPRESSOES_GIRIAS_VIDEOS: VideoData[] = [
  { orderIndex: 1, videoId: 'GhJbS7hry_A', title: 'Diferenças Entre o Espanhol Europeu e Latino', url: 'https://www.youtube.com/watch?v=GhJbS7hry_A', description: 'Aula sobre as principais diferenças entre o espanhol da Espanha e o espanhol latino-americano: vocabulário, pronúncia e expressões.' },
  { orderIndex: 2, videoId: '7gn7qO09gwk', title: 'Falsos Cognatos', url: 'https://www.youtube.com/watch?v=7gn7qO09gwk', description: 'Aula sobre falsos cognatos em espanhol: palavras que parecem iguais ao português mas têm significado diferente.' },
  { orderIndex: 3, videoId: 'mqX07D8SlYo', title: 'Expressões do Dia a Dia', url: 'https://www.youtube.com/watch?v=mqX07D8SlYo', description: 'Aula com as expressões mais usadas no dia a dia em espanhol para conversar naturalmente.' },
  { orderIndex: 4, videoId: '08OKq3Qg6sY', title: '100 Frases do Cotidiano', url: 'https://www.youtube.com/watch?v=08OKq3Qg6sY', description: '100 frases prontas do cotidiano em espanhol para usar em situações reais do dia a dia.' },
  { orderIndex: 5, videoId: '7eXsH1HlPU0', title: 'Gírias mais Comuns', url: 'https://www.youtube.com/watch?v=7eXsH1HlPU0', description: 'Aula sobre as gírias mais comuns e frequentes no espanhol falado na vida real.' },
  { orderIndex: 6, videoId: 'jY7A2Gxbd1w', title: '10 Gírias Populares', url: 'https://www.youtube.com/watch?v=jY7A2Gxbd1w', description: '10 gírias populares em espanhol que todo estudante deve conhecer para entender conversas nativas.' },
];

// ============================================================================
// GRAMÁTICA — 22 vídeos
// Playlist: https://www.youtube.com/playlist?list=PLUykcwhfihTc
//
// Ordem pedagógica:
//  FUNDAMENTOS: Alfabeto → Substantivos → Artigos → Pronomes
//  → Adjetivos → Advérbios → Preposições → Conjunções
//  VERBOS: Conjugação Verbal → Ser e Estar → Ter e Haver
//  TEMPOS: Presente Indicativo → Pretérito Perfeito →
//  Pretérito Simples/Composto → Pretérito Pluscuamperfecto (x2) →
//  Presente Subjuntivo → Futuro Simples
//  ESTRUTURAS: Discurso Direto/Indireto → Voz Ativa/Passiva
//  → Regras de Acentuação → Comparativos/Superlativos
// ============================================================================

const GRAMATICA_VIDEOS: VideoData[] = [
  { orderIndex: 1, videoId: 'Og1gQJKd_AE', title: 'Alfabeto', url: 'https://www.youtube.com/watch?v=Og1gQJKd_AE', description: 'Aula sobre o alfabeto espanhol, incluindo a pronúncia de cada letra e sons especiais.' },
  { orderIndex: 2, videoId: 'TTmyrSUX-sM', title: 'Substantivos', url: 'https://www.youtube.com/watch?v=TTmyrSUX-sM', description: 'Aula sobre substantivos em espanhol: gênero, número e classificação.' },
  { orderIndex: 3, videoId: 'UOpoJstB3so', title: 'Artigos', url: 'https://www.youtube.com/watch?v=UOpoJstB3so', description: 'Aula sobre artigos definidos e indefinidos em espanhol: el, la, los, las, un, una, unos, unas.' },
  { orderIndex: 4, videoId: 'Uya93WyFsMs', title: 'Pronomes Pessoais', url: 'https://www.youtube.com/watch?v=Uya93WyFsMs', description: 'Aula sobre pronomes pessoais em espanhol: sujetos, átonos e tónicos.' },
  { orderIndex: 5, videoId: 'UUR5i7WGX2k', title: 'Adjetivos', url: 'https://www.youtube.com/watch?v=UUR5i7WGX2k', description: 'Aula sobre adjetivos em espanhol: concordância de gênero e número, posição na frase.' },
  { orderIndex: 6, videoId: 'twQviKEkUDc', title: 'Advérbios', url: 'https://www.youtube.com/watch?v=twQviKEkUDc', description: 'Aula sobre advérbios em espanhol: de modo, tempo, lugar, intensidade.' },
  { orderIndex: 7, videoId: '7lgI4Pj2TyE', title: 'Preposições', url: 'https://www.youtube.com/watch?v=7lgI4Pj2TyE', description: 'Aula sobre preposições em espanhol: a, de, en, por, para, con, sin e suas combinações.' },
  { orderIndex: 8, videoId: 'MbI0r4HquC0', title: 'Conjunções', url: 'https://www.youtube.com/watch?v=MbI0r4HquC0', description: 'Aula sobre conjunções em espanhol: coordenativas, subordinativas e suas funções.' },
  { orderIndex: 9, videoId: 'J0ghKS1LZbY', title: 'Conjugação Verbal', url: 'https://www.youtube.com/watch?v=J0ghKS1LZbY', description: 'Aula sobre conjugação verbal em espanhol: terminações, regularidade e estrutura dos verbos.' },
  { orderIndex: 10, videoId: '5hQhokEyaOk', title: 'Ser e Estar', url: 'https://www.youtube.com/watch?v=5hQhokEyaOk', description: 'Aula sobre a diferença entre ser e estar em espanhol: usos, contextos e exemplos práticos.' },
  { orderIndex: 11, videoId: 'Owmjg8QYjCU', title: 'Ter e Haver', url: 'https://www.youtube.com/watch?v=Owmjg8QYjCU', description: 'Aula sobre os verbos ter (tener) e haver (haber) em espanhol: usos como verbo principal e auxiliar.' },
  { orderIndex: 12, videoId: 'XzzJssljfUo', title: 'Tempo Verbal - Presente do Indicativo', url: 'https://www.youtube.com/watch?v=XzzJssljfUo', description: 'Aula sobre o presente do indicativo em espanhol: conjugação regular e irregular.' },
  { orderIndex: 13, videoId: 'JTzpvXLImTg', title: 'Tempo Verbal - Pretérito Perfeito Simples e Pretérito Indefinido', url: 'https://www.youtube.com/watch?v=JTzpvXLImTg', description: 'Aula sobre o pretérito perfeito simples (indefinido) em espanhol para ações passadas completas.' },
  { orderIndex: 14, videoId: 'Z5C-MkhW4UI', title: 'Tempo Verbal - Pretérito Simples e Pretérito Composto', url: 'https://www.youtube.com/watch?v=Z5C-MkhW4UI', description: 'Aula comparando o pretérito simples e o pretérito composto em espanhol.' },
  { orderIndex: 15, videoId: '7QYXZOUlHhA', title: 'Tempo Verbal - Pretérito Pluscuamperfecto do Indicativo', url: 'https://www.youtube.com/watch?v=7QYXZOUlHhA', description: 'Aula sobre o pretérito pluscuamperfecto do indicativo: ações anteriores a outras no passado.' },
  { orderIndex: 16, videoId: '6OAAkMnsje4', title: 'Tempo Verbal - Pretérito Pluscuamperfecto Composto', url: 'https://www.youtube.com/watch?v=6OAAkMnsje4', description: 'Aula sobre o pretérito pluscuamperfecto composto: forma composta e usos práticos.' },
  { orderIndex: 17, videoId: 'ccpPqArhO_A', title: 'Tempo Verbal - Presente do Subjuntivo', url: 'https://www.youtube.com/watch?v=ccpPqArhO_A', description: 'Aula sobre o presente do subjuntivo em espanhol: hipóteses, desejos e orações subordinadas.' },
  { orderIndex: 18, videoId: 'c64HuSyzGog', title: 'Tempo Verbal - Futuro Simples', url: 'https://www.youtube.com/watch?v=c64HuSyzGog', description: 'Aula sobre o futuro simples em espanhol: conjugação regular e irregular, usos e exemplos.' },
  { orderIndex: 19, videoId: 'ysXzVHfAsto', title: 'Discurso Direto e Indireto', url: 'https://www.youtube.com/watch?v=ysXzVHfAsto', description: 'Aula sobre discurso direto e indireto em espanhol: como reportar falas de terceiros.' },
  { orderIndex: 20, videoId: 'RtOoRfSbUlQ', title: 'Voz Ativa e Voz Passiva', url: 'https://www.youtube.com/watch?v=RtOoRfSbUlQ', description: 'Aula sobre voz ativa e voz passiva em espanhol: estrutura, formação e transformação de frases.' },
  { orderIndex: 21, videoId: 'EIje77QYKuE', title: 'Regras de Acentuação', url: 'https://www.youtube.com/watch?v=EIje77QYKuE', description: 'Aula sobre as regras de acentuação em espanhol: palabras agudas, llanas, esdrújulas e sobresdrújulas.' },
  { orderIndex: 22, videoId: 'b4R0UjrzESs', title: 'Comparativos e Superlativos', url: 'https://www.youtube.com/watch?v=b4R0UjrzESs', description: 'Aula sobre comparativos e superlativos em espanhol: mais, menos, tão quanto, o mais, o menos.' },
];

// ============================================================================
// LEITURA E COMPREENSÃO DE TEXTO — 2 vídeos
// Playlist: https://www.youtube.com/playlist?list=PLAfFPAnvIQeM
//
// Ordem pedagógica:
//  1. Texto com áudio — prática de leitura com apoio auditivo
//  2. Dicas de interpretação — estratégias para entender textos
// ============================================================================

const LEITURA_COMPREENSACAO_VIDEOS: VideoData[] = [
  { orderIndex: 1, videoId: 'a1bJZqU-UD8', title: 'Texto em Espanhol com Áudio — Aumente seu Vocabulário', url: 'https://www.youtube.com/watch?v=a1bJZqU-UD8', description: 'Aula com texto em espanhol acompanhado de áudio para praticar leitura, compreensão e ampliar vocabulário.' },
  { orderIndex: 2, videoId: 'fGebBFz7mxw', title: '5 Dicas de Interpretação de Texto de Espanhol para o ENEM', url: 'https://www.youtube.com/watch?v=fGebBFz7mxw', description: 'Cinco dicas práticas de interpretação de texto em espanhol, úteis para provas e leitura cotidiana.' },
];

// ============================================================================
// VOCABULÁRIO — 21 vídeos
// Playlist: https://www.youtube.com/playlist?list=PLYinoxkUgJ6E
//
// Ordem pedagógica:
//  FUNDAMENTOS: Números → Cores → Dias → Meses → Horas
//  COTIDIANO: Alimentos → Bebidas → Casa → Roupas
//  PESSOAS: Partes do Corpo → Família → Profissões
//  MUNDO: Animais → Escola → Esportes → Clima
//  AMBIENTE: Meio Ambiente → Cidade → Transporte → Viagem
//  MODERNO: Tecnologia
// ============================================================================

const VOCABULARIO_VIDEOS: VideoData[] = [
  { orderIndex: 1, videoId: '5cIiobAaLrQ', title: 'Números', url: 'https://www.youtube.com/watch?v=5cIiobAaLrQ', description: 'Vocabulário de números em espanhol: cardinais, ordinais e uso no dia a dia.' },
  { orderIndex: 2, videoId: 'YSHh0Z9g__Q', title: 'Cores', url: 'https://www.youtube.com/watch?v=YSHh0Z9g__Q', description: 'Vocabulário de cores em espanhol: nomes, concordância e expressões com cores.' },
  { orderIndex: 3, videoId: 'XMCNVD3s_YQ', title: 'Dias da Semana', url: 'https://www.youtube.com/watch?v=XMCNVD3s_YQ', description: 'Vocabulário dos dias da semana em espanhol e como usá-los em frases.' },
  { orderIndex: 4, videoId: '316GkoHGuzI', title: 'Meses', url: 'https://www.youtube.com/watch?v=316GkoHGuzI', description: 'Vocabulário dos meses do ano em espanhol.' },
  { orderIndex: 5, videoId: 'nAz8IBax83Y', title: 'Horas', url: 'https://www.youtube.com/watch?v=nAz8IBax83Y', description: 'Como dizer as horas em espanhol: horário formal, informal e expressões de tempo.' },
  { orderIndex: 6, videoId: 'oi0NCfM0xag', title: 'Alimentos', url: 'https://www.youtube.com/watch?v=oi0NCfM0xag', description: 'Vocabulário de alimentos em espanhol: frutas, legumes, carnes e alimentos básicos.' },
  { orderIndex: 7, videoId: '0B2VfGjqi8U', title: 'Bebidas', url: 'https://www.youtube.com/watch?v=0B2VfGjqi8U', description: 'Vocabulário de bebidas em espanhol: água, sucos, café, chá e expressões de pedidos.' },
  { orderIndex: 8, videoId: '6eO0jg8EGec', title: 'Casa', url: 'https://www.youtube.com/watch?v=6eO0jg8EGec', description: 'Vocabulário da casa em espanhol: cômodos, móveis e objetos do lar.' },
  { orderIndex: 9, videoId: '0qhI6c-k9iU', title: 'Roupas', url: 'https://www.youtube.com/watch?v=0qhI6c-k9iU', description: 'Vocabulário de roupas e acessórios em espanhol.' },
  { orderIndex: 10, videoId: 'eIGLUXmwczM', title: 'Partes do Corpo Humano', url: 'https://www.youtube.com/watch?v=eIGLUXmwczM', description: 'Vocabulário das partes do corpo humano em espanhol.' },
  { orderIndex: 11, videoId: 'Sktq_ktMlnA', title: 'Membros da Família', url: 'https://www.youtube.com/watch?v=Sktq_ktMlnA', description: 'Vocabulário de membros da família em espanhol: pai, mãe, irmãos, avós e parentes.' },
  { orderIndex: 12, videoId: 'fsKmX9GK0wU', title: 'Profissões', url: 'https://www.youtube.com/watch?v=fsKmX9GK0wU', description: 'Vocabulário de profissões em espanhol: nomes de empregos e expressões profissionais.' },
  { orderIndex: 13, videoId: 'Lwrfeh0yXf8', title: 'Animais', url: 'https://www.youtube.com/watch?v=Lwrfeh0yXf8', description: 'Vocabulário de animais em espanhol: domésticos, selvagens e fazenda.' },
  { orderIndex: 14, videoId: 'FpFtiGxknz0', title: 'Escola', url: 'https://www.youtube.com/watch?v=FpFtiGxknz0', description: 'Vocabulário da escola em espanhol: materiais, ambientes e expressões escolares.' },
  { orderIndex: 15, videoId: 'bRggDj2ZXZk', title: 'Esportes', url: 'https://www.youtube.com/watch?v=bRggDj2ZXZk', description: 'Vocabulário de esportes em espanhol: modalidades, equipamentos e expressões esportivas.' },
  { orderIndex: 16, videoId: 'pby-EZNEd8U', title: 'Clima', url: 'https://www.youtube.com/watch?v=pby-EZNEd8U', description: 'Vocabulário de clima e tempo em espanhol: sol, chuva, frio, calor e estações do ano.' },
  { orderIndex: 17, videoId: 'oYVPxeSMV_8', title: 'Meio Ambiente', url: 'https://www.youtube.com/watch?v=oYVPxeSMV_8', description: 'Vocabulário de meio ambiente em espanhol: natureza, ecologia e sustainabilidade.' },
  { orderIndex: 18, videoId: 'nt0VJKc-p74', title: 'Cidade', url: 'https://www.youtube.com/watch?v=nt0VJKc-p74', description: 'Vocabulário da cidade em espanhol: ruas, prédios, lugares públicos e serviços urbanos.' },
  { orderIndex: 19, videoId: '5d9BqMfBGZw', title: 'Meios de Transporte', url: 'https://www.youtube.com/watch?v=5d9BqMfBGZw', description: 'Vocabulário de meios de transporte em espanhol: carro, ônibus, avião, trem e metro.' },
  { orderIndex: 20, videoId: 'Bd7gtcjzohI', title: 'Viagem', url: 'https://www.youtube.com/watch?v=Bd7gtcjzohI', description: 'Vocabulário de viagem em espanhol: aeroporto, hotel, documentos e expressões de turismo.' },
  { orderIndex: 21, videoId: 'BdUNV189OKk', title: 'Tecnologia', url: 'https://www.youtube.com/watch?v=BdUNV189OKk', description: 'Vocabulário de tecnologia em espanhol: dispositivos, aplicativos e termos digitais.' },
];

// ============================================================================
// PRONÚNCIA — 13 vídeos
// Playlist: https://www.youtube.com/playlist?list=PLA42DM-4d_Yc
//
// Ordem pedagógica:
//  FUNDAMENTOS: Som das Letras → Sons do B e V → Sons do R e RR
//  LETRAS ESPECÍFICAS: Pronúncia do G → Pronúncia LL → Pronúncia J
//  → Pronúncia Y
//  ESTRUTURAS: Sons do R e J → Sons mais Comuns
//  CONTEXTO: 5 Erros Comuns → Intonação e Ritmo
//  APLICAÇÃO: Curso Aula 1 → Pronúncia por País
// ============================================================================

const PRONUNCIA_VIDEOS: VideoData[] = [
  { orderIndex: 1, videoId: 'abl_ADJDIgk', title: 'Som das Letras', url: 'https://www.youtube.com/watch?v=abl_ADJDIgk', description: 'Aula sobre o som de cada letra do alfabeto espanhol. Fundamentos da pronúncia.' },
  { orderIndex: 2, videoId: 'shsb68fnsqM', title: 'Sons do B e V', url: 'https://www.youtube.com/watch?v=shsb68fnsqM', description: 'Aula sobre a pronúncia das letras B e V em espanhol — sons iguais, dúvida muito comum.' },
  { orderIndex: 3, videoId: 'WOiVkKW4kP8', title: 'Sons do R e RR', url: 'https://www.youtube.com/watch?v=WOiVkKW4kP8', description: 'Aula sobre a pronúncia do R simples e do RR em espanhol. Exercícios práticos.' },
  { orderIndex: 4, videoId: 'iak9D28UDQc', title: 'Pronúncia do G', url: 'https://www.youtube.com/watch?v=iak9D28UDQc', description: 'Aula sobre a pronúncia da letra G em espanhol antes de diferentes vogais.' },
  { orderIndex: 5, videoId: '2SMOfxZ1ax4', title: 'Aprenda a Pronunciar LL em Espanhol', url: 'https://www.youtube.com/watch?v=2SMOfxZ1ax4', description: 'Aula sobre a pronúncia da letra LL em espanhol. Exercícios práticos.' },
  { orderIndex: 6, videoId: 'eb8n-Nr6LEY', title: 'Como Pronunciar a Letra J em Espanhol', url: 'https://www.youtube.com/watch?v=eb8n-Nr6LEY', description: 'Aula sobre a pronúncia da letra J em espanhol. Sons aspirados e regionais.' },
  { orderIndex: 7, videoId: 'F_lBa2S_1no', title: 'Como Pronunciar Y em Espanhol', url: 'https://www.youtube.com/watch?v=F_lBa2S_1no', description: 'Aula sobre a pronúncia da letra Y em espanhol. Variantes e exercícios.' },
  { orderIndex: 8, videoId: 'K8hq7iBAHa8', title: 'Sons do R e J', url: 'https://www.youtube.com/watch?v=K8hq7iBAHa8', description: 'Aula comparativa entre os sons do R e do J em espanhol. Diferenças e prática.' },
  { orderIndex: 9, videoId: '9RDlLvHSTxY', title: 'Sons mais Comuns', url: 'https://www.youtube.com/watch?v=9RDlLvHSTxY', description: 'Aula sobre os sons mais comuns e frequentes na língua espanhola. Prática geral.' },
  { orderIndex: 10, videoId: 'pDTVXV5wFn8', title: '5 Erros ao Falar Espanhol mais Comuns', url: 'https://www.youtube.com/watch?v=pDTVXV5wFn8', description: 'Os 5 erros de pronúncia mais comuns ao falar espanhol. Como evitá-los.' },
  { orderIndex: 11, videoId: 'rGnY8bRNpPI', title: 'Entonação e Ritmo em Espanhol', url: 'https://www.youtube.com/watch?v=rGnY8bRNpPI', description: 'Aula sobre entonação e ritmo na fala espanhola. Como soar mais natural.' },
  { orderIndex: 12, videoId: 'f8J4qjAVpgc', title: 'Curso de Espanhol Online — Aula 1: Sons, Letras e Dicas', url: 'https://www.youtube.com/watch?v=f8J4qjAVpgc', description: 'Primeira aula do curso online: aprenda os sons, letras e dicas para falar bem em espanhol.' },
  { orderIndex: 13, videoId: 'L__Vtz2PvMk', title: 'Pronúncia dos Países Hispanohablantes', url: 'https://www.youtube.com/watch?v=L__Vtz2PvMk', description: 'Aula sobre as diferenças de pronúncia entre os países de língua espanhola.' },
];

// ============================================================================
// DADOS CENTRALIZADOS — adicione novos módulos aqui
// ============================================================================

const ALL_MODULES: ModuleSeedData[] = [
  { moduleTitle: 'Conversação', videos: CONVERSACAO_VIDEOS },
  { moduleTitle: 'Cultura Hispânica', videos: CULTURA_HISPANICA_VIDEOS },
  { moduleTitle: 'Dicas de Aprendizagem', videos: DICAS_APRENDIZAGEM_VIDEOS },
  { moduleTitle: 'Expressões e Girias do Cotidiano', videos: EXPRESSOES_GIRIAS_VIDEOS },
  { moduleTitle: 'Gramática', videos: GRAMATICA_VIDEOS },
  { moduleTitle: 'Leitura e Compreensão de texto', videos: LEITURA_COMPREENSACAO_VIDEOS },
  { moduleTitle: 'Pronúncia', videos: PRONUNCIA_VIDEOS },
  { moduleTitle: 'Vocabulário', videos: VOCABULARIO_VIDEOS },
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

  if (created > 0 || skipped > 0) {
    const parts: string[] = [];
    if (created > 0) parts.push(`${created} criada(s)`);
    if (skipped > 0) parts.push(`${skipped} já existente(s)`);
    console.log(`🎬 [SEED] ${moduleTitle}: ${parts.join(', ')}.`);
  } else {
    console.log(`🎬 [SEED] ${moduleTitle}: todas as ${videos.length} videoaulas já existem.`);
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
