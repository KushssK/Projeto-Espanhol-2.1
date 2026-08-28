import React from 'react';

// ============================================================================
// YouTubePlayer — Componente reutilizável para embed de vídeos do YouTube
//
// Suporta os formatos:
//   - https://www.youtube.com/watch?v=VIDEO_ID
//   - https://youtu.be/VIDEO_ID
//   - https://www.youtube.com/embed/VIDEO_ID
//   - https://www.youtube.com/shorts/VIDEO_ID
//   - https://www.youtube.com/v/VIDEO_ID
//
// Extrai o VIDEO_ID de forma segura e gera o embed URL.
// ============================================================================

/**
 * Extrai o VIDEO_ID do YouTube de diversas formatações de URL.
 * Retorna null se a URL não for válida.
 */
export function extractYouTubeId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;

  const patterns = [
    // youtube.com/watch?v=VIDEO_ID
    /(?:youtube\.com\/watch\?.*v=|youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    // youtu.be/VIDEO_ID
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    // youtube.com/embed/VIDEO_ID
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    // youtube.com/v/VIDEO_ID
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
    // youtube.com/shorts/VIDEO_ID
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    // VIDEO_ID direto (11 caracteres)
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
}

/**
 * Monta a URL de embed do YouTube a partir de um VIDEO_ID.
 */
export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`;
}

interface YouTubePlayerProps {
  /** URL do vídeo (watch, youtu.be, embed, shorts, etc.) */
  url: string;
  /** Título acessível do iframe */
  title?: string;
  /** Classes CSS adicionais para o container */
  className?: string;
  /** Estilos adicionais para o container */
  style?: React.CSSProperties;
}

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  url,
  title = 'Vídeo do YouTube',
  className = '',
  style,
}) => {
  const videoId = extractYouTubeId(url);

  if (!videoId) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--bg-color)] ${className}`}
        style={{ aspectRatio: '16/9', ...style }}
      >
        <p className="text-sm font-bold text-center px-4" style={{ color: 'var(--text-muted)' }}>
          ⚠️ URL do YouTube inválida ou não reconhecida.
          <br />
          <span className="text-xs opacity-70">{url}</span>
        </p>
      </div>
    );
  }

  return (
    <div
      className={`w-full rounded-[16px] overflow-hidden border border-[var(--border-color)] shadow-md bg-black ${className}`}
      style={{ aspectRatio: '16/9', ...style }}
    >
      <iframe
        src={getYouTubeEmbedUrl(videoId)}
        title={title}
        className="w-full h-full border-none"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
};

export default YouTubePlayer;
