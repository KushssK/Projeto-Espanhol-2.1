// ============================================================================
// Motor do Tutor de Espanhol — respostas PROGRAMADAS por intenção
//
// Estrutura extensível:
//   - INTENTS: lista ordenada de intenções (palavras-chave + resposta/ação).
//     A primeira intenção cujo texto case com as palavras-chave vence.
//   - Cada intenção recebe (input, ctx) e devolve uma TutorReply; handlers
//     assíncronos podem consultar dados através do data gateway (ctx.data).
//   - Para adicionar uma intenção: crie um novo TutorIntent no array INTENTS.
//
// Este arquivo é PURAMENTE lógico (sem React, sem axios): a interface de
// conversa injeta os acessos a dados (ctx.data). Assim, as respostas podem
// ser testadas em isolamento e, futuramente, este motor pode ser substituído
// ou complementado por uma API de IA sem tocar na interface.
// ============================================================================

export type TutorMood = 'normal' | 'thinking' | 'talking' | 'celebrating' | 'alert';

export interface TutorAction {
  type: 'navigate';
  to: string;
  label: string;
}

export interface TutorReply {
  text: string;
  mood: TutorMood;
  /** Sugestões clicáveis — são reenviadas como texto do usuário (devem casar com alguma intenção) */
  suggestions?: string[];
  /** Ação executável (ex.: navegar para uma aula) */
  action?: TutorAction;
}

/** Acesso a dados existentes da plataforma (injetado pela interface) */
export interface TutorDataGateway {
  getProgress: () => Promise<{ totalXP: number; completedCount: number } | null>;
  getMyRank: () => Promise<{ rank: number; totalXP: number } | null>;
  getLessons: () => Promise<Array<{ id: string; title: string; moduleId: string; moduleTitle: string }> | null>;
}

export interface TutorContext {
  userId: string;
  username: string;
  data: TutorDataGateway;
}

export interface TutorIntent {
  id: string;
  keywords: string[];
  reply: (input: string, ctx: TutorContext) => Promise<TutorReply>;
}

// ============================================================================
// Utilitários de normalização (ignora acentos, caixa e pontuação)
// ============================================================================
export const normalizeText = (input: string): string =>
  input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const containsAny = (input: string, keywords: string[]): boolean =>
  keywords.some((k) => input.includes(k));

// ============================================================================
// Menu inicial / sugestões (textos que casam com as intenções)
// ============================================================================
export const TUTOR_MENU = [
  'Vocabulário',
  'Gramática',
  'Pronúncia',
  'Meu progresso',
  'Ranking',
  'Ajuda',
];

export const WELCOME_TEXT = '🦉 ¡Hola! Soy seu tutor de espanhol. Como posso ajudar?';

// ============================================================================
// Intenções (ordem importa: as mais específicas vêm primeiro)
// ============================================================================

const HELP_INTENT: TutorIntent = {
  id: 'help',
  keywords: ['ajuda', 'help', 'menu', 'opcoes', 'o que voce faz', 'como funciona', 'comecar'],
  reply: async () => ({
    text: '🦉 Posso te ajudar a estudar espanhol! Escolha uma opção abaixo ou escreva sua dúvida:',
    mood: 'normal',
    suggestions: TUTOR_MENU,
  }),
};

const MEANING_INTENT: TutorIntent = {
  id: 'meaning',
  keywords: ['significa', 'significado', 'quer dizer', 'traducao', 'traduzir', 'o que e'],
  reply: async (input) => {
    // Exemplo concreto pedido pelo cliente: "O que significa hola?"
    if (/(^|\s)hola(\s|$)/.test(input) || /significa ola|significa hola/.test(input)) {
      return {
        text: '"Hola" significa "olá" em português. É a saudação mais comum em espanhol. 🖐️',
        mood: 'talking',
        suggestions: ['Vocabulário', 'Gramática'],
      };
    }
    return {
      text: 'Posso te ajudar com o significado de palavras! Alguns exemplos: "hola" = olá, "gracias" = obrigado(a), "por favor" = por favor, "adiós" = adeus. Pergunte "o que significa [palavra]?".',
      mood: 'normal',
      suggestions: ['O que significa hola?', 'Vocabulário'],
    };
  },
};

const VOCABULARY_INTENT: TutorIntent = {
  id: 'vocabulary',
  keywords: ['vocabulario', 'palavra', 'palavras', 'palavra nova', 'aprender palavras'],
  reply: async () => ({
    text: 'Claro! Posso te ajudar com vocabulário. 🗣️ Que tal revisar as palavras da última aula, ou navegar pelo acervo de materiais (PDFs, áudios e imagens)?',
    mood: 'normal',
    suggestions: ['Gramática', 'Pronúncia', 'Meu progresso'],
    action: { type: 'navigate', to: '/acervo', label: 'Abrir o Acervo' },
  }),
};

const GRAMMAR_INTENT: TutorIntent = {
  id: 'grammar',
  keywords: ['gramatica', 'verbo', 'conjugacao', 'conjuga', 'preterito', 'presente', 'passado', 'futuro', 'artigo', 'pronome', 'adjetivo', 'substantivo'],
  reply: async (_input, ctx) => {
    const lessons = await ctx.data.getLessons();
    const grammarLesson =
      lessons?.find((l) => normalizeText(l.moduleTitle).includes('gramatica')) || lessons?.[0];
    return {
      text: 'Vamos praticar gramática! 📝 Posso explicar conceitos ou indicar uma aula.',
      mood: 'talking',
      suggestions: ['Vocabulário', 'Pronúncia', 'Meu progresso'],
      action: grammarLesson
        ? { type: 'navigate', to: `/lessons/${grammarLesson.id}`, label: 'Quer abrir esta aula?' }
        : undefined,
    };
  },
};

const PRONUNCIATION_INTENT: TutorIntent = {
  id: 'pronunciation',
  keywords: ['pronuncia', 'pronunciar', 'pronuncie', 'audio', 'falando', 'falar melhor', 'entona', 'sotaque'],
  reply: async () => ({
    text: 'Ótima escolha! 🎧 Treine a pronúncia ouvindo os áudios do acervo e repetindo em voz alta. Quer abrir o acervo de materiais?',
    mood: 'talking',
    suggestions: ['Vocabulário', 'Gramática', 'Ranking'],
    action: { type: 'navigate', to: '/acervo', label: 'Abrir o Acervo' },
  }),
};

const PROGRESS_INTENT: TutorIntent = {
  id: 'progress',
  keywords: ['xp', 'progresso', 'pontos', 'aulas concluidas', 'concluidas', 'meu progresso', 'quanto falta', 'estatisticas', 'meus resultados'],
  reply: async (_input, ctx) => {
    const progress = await ctx.data.getProgress();
    if (!progress) {
      return {
        text: 'Não consegui consultar seu progresso agora. Tente novamente em instantes. 🙈',
        mood: 'alert',
        suggestions: ['Ajuda'],
      };
    }
    if (progress.completedCount === 0) {
      return {
        text: 'Você ainda não concluiu aulas — seu XP está em 0. Que tal começar pela primeira aula? 🚀',
        mood: 'normal',
        suggestions: ['Quero estudar', 'Ranking'],
      };
    }
    const aula = progress.completedCount === 1 ? 'aula' : 'aulas';
    return {
      text: `📊 Você tem ${progress.totalXP} XP e já concluiu ${progress.completedCount} ${aula}! Continue assim! 🎉`,
      mood: 'celebrating',
      suggestions: ['Ranking', 'Vocabulário', 'Gramática'],
    };
  },
};

const RANKING_INTENT: TutorIntent = {
  id: 'ranking',
  keywords: ['ranking', 'lider', 'posicao', 'liga', 'leaderboard', 'classificacao', 'colocacao', 'campeoes'],
  reply: async (_input, ctx) => {
    const myRank = await ctx.data.getMyRank();
    if (!myRank) {
      return {
        text: 'Você ainda não aparece no ranking — complete aulas para ganhar XP e entrar na Liga de Campeões! 🏆',
        mood: 'normal',
        suggestions: ['Meu progresso', 'Quero estudar'],
      };
    }
    return {
      text: `🏆 Você está em ${myRank.rank}º lugar na Liga de Campeões, com ${myRank.totalXP} XP!`,
      mood: 'celebrating',
      suggestions: ['Meu progresso', 'Ranking'],
      action: { type: 'navigate', to: '/leaderboard', label: 'Ver ranking completo' },
    };
  },
};

const STUDY_INTENT: TutorIntent = {
  id: 'study',
  keywords: ['estudar', 'aula', 'licao', 'modulo', 'assistir', 'videoaula', 'video aula', 'quero aprender', 'aprender espanhol', 'comecar a estudar'],
  reply: async (_input, ctx) => {
    const lessons = await ctx.data.getLessons();
    if (!lessons || lessons.length === 0) {
      return {
        text: 'Ainda não há aulas publicadas, mas em breve os professores vão adicionar conteúdos! 📚',
        mood: 'normal',
        suggestions: ['Ajuda'],
      };
    }
    const first = lessons[0];
    return {
      text: `Que tal começar por "${first.title}"? 🎬`,
      mood: 'talking',
      suggestions: ['Meu progresso', 'Vocabulário'],
      action: { type: 'navigate', to: `/lessons/${first.id}`, label: 'Quer abrir esta aula?' },
    };
  },
};

const GREETING_INTENT: TutorIntent = {
  id: 'greeting',
  keywords: ['ola', 'oi', 'hello', 'hola', 'bom dia', 'boa tarde', 'boa noite', 'tudo bem', 'eai', 'eae', 'salve'],
  reply: async (_input, ctx) => ({
    text: `¡Hola, ${ctx.username}! 👋 Como posso ajudar você a estudar espanhol hoje?`,
    mood: 'talking',
    suggestions: TUTOR_MENU,
  }),
};

const THANKS_INTENT: TutorIntent = {
  id: 'thanks',
  keywords: ['obrigado', 'obrigada', 'gracias', 'valeu', 'brigado', 'muito obrigado'],
  reply: async () => ({
    text: '¡De nada! 🎉 Estou aqui sempre que precisar. ¡Hasta luego!',
    mood: 'celebrating',
    suggestions: TUTOR_MENU,
  }),
};

const BYE_INTENT: TutorIntent = {
  id: 'bye',
  keywords: ['tchau', 'adeus', 'ate mais', 'ate logo', 'hasta luego', 'bye', 'flw', 'ate amanha'],
  reply: async () => ({
    text: '¡Hasta luego! 👋 Continue praticando — estou por aqui.',
    mood: 'normal',
    suggestions: TUTOR_MENU,
  }),
};

const FALLBACK_INTENT: TutorIntent = {
  id: 'fallback',
  keywords: [],
  reply: async () => ({
    text: 'Ainda estou aprendendo! 🙈 Não entendi essa pergunta, mas posso te ajudar com vocabulário, gramática, pronúncia, seu progresso ou o ranking. Escolha uma opção:',
    mood: 'alert',
    suggestions: TUTOR_MENU,
  }),
};

// Ordem importa: as intenções mais específicas vêm antes das genéricas
export const INTENTS: TutorIntent[] = [
  HELP_INTENT,
  MEANING_INTENT,
  VOCABULARY_INTENT,
  GRAMMAR_INTENT,
  PRONUNCIATION_INTENT,
  PROGRESS_INTENT,
  RANKING_INTENT,
  STUDY_INTENT,
  GREETING_INTENT,
  THANKS_INTENT,
  BYE_INTENT,
  FALLBACK_INTENT,
];

/** Encontra a primeira intenção que casa com o texto (normalizado) */
export const findIntent = (input: string): TutorIntent => {
  const normalized = normalizeText(input);
  return INTENTS.find((intent) => containsAny(normalized, intent.keywords)) || FALLBACK_INTENT;
};

/** Ponto de entrada: dado o texto do usuário, devolve a resposta do tutor */
export const getTutorReply = (input: string, ctx: TutorContext): Promise<TutorReply> => {
  const intent = findIntent(input);
  return intent.reply(input, ctx);
};