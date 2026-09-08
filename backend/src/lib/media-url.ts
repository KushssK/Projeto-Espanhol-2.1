/**
 * Normalização de URLs de vídeo do Acervo.
 *
 * Apenas YouTube e Vimeo são aceitos — qualquer outro domínio é rejeitado
 * (evita iframe arbitrário de domínio malicioso, javascript:, data:, etc.).
 * O valor armazenado é SEMPRE uma URL canônica de embed https, pronta para o
 * <iframe>, mas o parser também entende formatos legados (watch?v=, youtu.be,
 * vimeo.com/xxx, já-embeds) para compatibilidade com registros existentes.
 */

const YOUTUBE_HOSTS = [
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
];

const VIMEO_HOSTS = ['vimeo.com', 'www.vimeo.com', 'player.vimeo.com'];

const YT_ID_PATTERNS = [
  /(?:watch\?.*v=)([A-Za-z0-9_-]{11})/,
  /(?:youtu\.be\/)([A-Za-z0-9_-]{11})/,
  /(?:embed\/)([A-Za-z0-9_-]{11})/,
  /(?:shorts\/)([A-Za-z0-9_-]{11})/,
  /(?:v\/)([A-Za-z0-9_-]{11})/,
];

const VIMEO_ID_PATTERNS = [
  /(?:player\.vimeo\.com\/video\/)(\d+)/,
  /(?:vimeo\.com\/)(\d+)/,
];

export interface ParsedMediaVideo {
  provider: 'youtube' | 'vimeo';
  embedUrl: string;
}

function hostOf(raw: string): string | null {
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    return url.hostname.toLowerCase();
  } catch {
    return null;
  }
}

/** Converte uma string em URL canônica de embed; null se inválida/não suportada. */
export function parseMediaVideoUrl(raw: string): ParsedMediaVideo | null {
  if (!raw || typeof raw !== 'string') return null;
  const input = raw.trim();
  const host = hostOf(input);
  if (!host) return null;

  if (YOUTUBE_HOSTS.includes(host)) {
    for (const pattern of YT_ID_PATTERNS) {
      const match = input.match(pattern);
      if (match && match[1]) {
        return {
          provider: 'youtube',
          embedUrl: `https://www.youtube.com/embed/${match[1]}`,
        };
      }
    }
    return null;
  }

  if (VIMEO_HOSTS.includes(host)) {
    for (const pattern of VIMEO_ID_PATTERNS) {
      const match = input.match(pattern);
      if (match && match[1]) {
        return {
          provider: 'vimeo',
          embedUrl: `https://player.vimeo.com/video/${match[1]}`,
        };
      }
    }
    return null;
  }

  return null;
}

export function isValidMediaVideoUrl(raw: string): boolean {
  return parseMediaVideoUrl(raw) !== null;
}
