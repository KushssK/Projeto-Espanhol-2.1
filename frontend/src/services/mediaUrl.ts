/**
 * Normaliza URLs de vídeo para embed (YouTube/Vimeo) no frontend.
 *
 * Aceita formatos canônicos (já normalizados pelo backend) e formatos legados
 * (watch?v=, youtu.be, shorts, vimeo.com/N, player.vimeo.com). Retorna null
 * para qualquer domínio não permitido — nada de iframe arbitrário.
 */

const YOUTUBE_HOSTS = [
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
]

const YT_PATTERNS = [
  /(?:watch\?.*v=)([A-Za-z0-9_-]{11})/,
  /(?:youtu\.be\/)([A-Za-z0-9_-]{11})/,
  /(?:embed\/)([A-Za-z0-9_-]{11})/,
  /(?:shorts\/)([A-Za-z0-9_-]{11})/,
  /(?:v\/)([A-Za-z0-9_-]{11})/,
]

export function mediaVideoEmbedUrl(raw: string | null | undefined): string | null {
  if (!raw) return null
  const input = raw.trim()
  let host: string | null = null
  try {
    const url = new URL(input)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
    host = url.hostname.toLowerCase()
  } catch {
    return null
  }
  if (!host) return null

  if (YOUTUBE_HOSTS.includes(host)) {
    // Já é embed de youtube? (id no path)
    const embedMatch = input.match(/(?:embed\/)([A-Za-z0-9_-]{11})/)
    if (embedMatch && embedMatch[1]) {
      return `https://www.youtube.com/embed/${embedMatch[1]}`
    }
    for (const pattern of YT_PATTERNS) {
      const match = input.match(pattern)
      if (match && match[1]) {
        return `https://www.youtube.com/embed/${match[1]}`
      }
    }
    return null
  }

  if (host === 'vimeo.com' || host === 'www.vimeo.com' || host === 'player.vimeo.com') {
    const match = input.match(/(?:vimeo\.com\/video\/|vimeo\.com\/)(\d+)/)
    if (match && match[1]) {
      return `https://player.vimeo.com/video/${match[1]}`
    }
    return null
  }

  return null
}
