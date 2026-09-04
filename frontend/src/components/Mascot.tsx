import React from 'react';

// ============================================================================
// Mascote da plataforma — coruja-tutor de espanhol
//
// Como adicionar o visual definitivo (sem precisar mexer no código):
//   1. Coloque o arquivo em:  frontend/public/mascot/mascot.png
//      (pode ser .svg/.webp/.jpg — basta manter o caminho e o nome)
//   2. Alternativa: defina a env  VITE_MASCOT_IMAGE_URL  no build do
//      frontend apontando para a URL do asset (ex.: CDN ou upload).
//
// Ordem de resolução: env VITE_MASCOT_IMAGE_URL → asset local
// /mascot/mascot.png → coruja ilustrada padrão (SVG embutido, que NÃO
// representa nenhuma pessoa real).
//
// Estados visuais (mood): normal, thinking, talking, celebrating, alert.
// No SVG embutido os estados alteram olhos/bico/asas/acessórios; com uma
// imagem real aplicamos animações CSS equivalentes quando possível.
// ============================================================================

export type MascotMood = 'normal' | 'thinking' | 'talking' | 'celebrating' | 'alert';

interface MascotProps {
  size?: number;
  className?: string;
  title?: string;
  mood?: MascotMood;
  onClick?: () => void;
}

const LOCAL_MASCOT_PATH = '/mascot/mascot.png';

// Animação CSS para quando um asset real (não SVG) é usado
const IMG_MOOD_CLASS: Record<MascotMood, string> = {
  normal: '',
  thinking: 'animate-pulse',
  talking: 'animate-bounce',
  celebrating: 'animate-bounce',
  alert: 'animate-pulse',
};

const FallbackMascotSvg: React.FC<{ size: number; className?: string; mood: MascotMood }> = ({
  size,
  className,
  mood,
}) => {
  const pupilsCy = mood === 'thinking' ? 40 : 43;
  const pupilsR = mood === 'alert' ? 3 : 4;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className={className}
      role="img"
      aria-label="Mascote"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Brilho de fundo */}
      <circle cx="60" cy="62" r="46" fill="#F59E0B" opacity="0.18" />
      {/* Corpo */}
      <ellipse cx="60" cy="80" rx="32" ry="28" fill="#F59E0B" />
      <ellipse cx="60" cy="88" rx="18" ry="16" fill="#FDE68A" />
      {/* Orelhas */}
      <path d="M36 40 L28 16 L52 32 Z" fill="#D97706" />
      <path d="M84 40 L92 16 L68 32 Z" fill="#D97706" />
      {/* Cabeça */}
      <circle cx="60" cy="44" r="26" fill="#F59E0B" />
      {/* Olhos */}
      <circle cx="51" cy="42" r="9" fill="#FFFFFF" />
      <circle cx="69" cy="42" r="9" fill="#FFFFFF" />
      {mood === 'celebrating' ? (
        <>
          <path d="M47 44 Q51 40 55 44" stroke="#1F2937" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M65 44 Q69 40 73 44" stroke="#1F2937" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="51" cy={pupilsCy} r={pupilsR} fill="#1F2937" />
          <circle cx="69" cy={pupilsCy} r={pupilsR} fill="#1F2937" />
          <circle cx={52.5} cy={pupilsCy - 2} r="1.3" fill="#FFFFFF" />
          <circle cx={70.5} cy={pupilsCy - 2} r="1.3" fill="#FFFFFF" />
        </>
      )}
      {/* Bico */}
      <path d="M55 50 L60 58 L65 50 Z" fill="#EA580C" />
      {/* Boca aberta (falando) */}
      {mood === 'talking' && <ellipse cx="60" cy="63" rx="5.5" ry="3.5" fill="#7C2D12" />}
      {/* Asas */}
      {mood === 'celebrating' || mood === 'alert' ? (
        <>
          <path d="M24 58 Q14 40 30 36 Q30 56 26 68 Z" fill="#D97706" />
          <path d="M94 62 Q104 82 90 100 Q86 84 88 74 Z" fill="#D97706" />
        </>
      ) : (
        <>
          <path d="M26 66 Q16 88 30 104 Q36 84 34 72 Z" fill="#D97706" />
          <path d="M94 66 Q104 88 90 104 Q84 84 86 72 Z" fill="#D97706" />
        </>
      )}
      {/* Pés */}
      <ellipse cx="50" cy="108" rx="7" ry="3.5" fill="#EA580C" />
      <ellipse cx="70" cy="108" rx="7" ry="3.5" fill="#EA580C" />
      {/* Pensando: reticências acima da cabeça */}
      {mood === 'thinking' && (
        <g fill="#B45309">
          <circle cx="44" cy="11" r="2" />
          <circle cx="54" cy="5" r="2.6" />
          <circle cx="64" cy="11" r="2" />
        </g>
      )}
      {/* Alerta: exclamação acima da cabeça */}
      {mood === 'alert' && (
        <g>
          <path d="M40 8 L44 8 L43 18 L41 18 Z" fill="#DC2626" />
          <circle cx="42" cy="22" r="1.8" fill="#DC2626" />
        </g>
      )}
      {/* Comemorando: confete */}
      {mood === 'celebrating' && (
        <g>
          <circle cx="20" cy="26" r="2.5" fill="#A855F7" />
          <circle cx="100" cy="22" r="2.5" fill="#22C55E" />
          <circle cx="14" cy="50" r="2" fill="#F59E0B" />
          <circle cx="106" cy="46" r="2" fill="#3B82F6" />
          <circle cx="30" cy="14" r="2" fill="#EC4899" />
          <circle cx="90" cy="12" r="2" fill="#F59E0B" />
        </g>
      )}
    </svg>
  );
};

export const Mascot: React.FC<MascotProps> = ({
  size = 96,
  className,
  title = 'Mascote do Espanhol em Rede',
  mood = 'normal',
  onClick,
}) => {
  const envUrl = (import.meta.env.VITE_MASCOT_IMAGE_URL as string | undefined)?.trim();
  const [localAvailable, setLocalAvailable] = React.useState<boolean | null>(null);

  // Verifica se o asset local existe (frontend/public/mascot/mascot.png)
  React.useEffect(() => {
    if (envUrl) {
      setLocalAvailable(null);
      return;
    }
    const img = new Image();
    img.onload = () => setLocalAvailable(true);
    img.onerror = () => setLocalAvailable(false);
    img.src = LOCAL_MASCOT_PATH;
  }, [envUrl]);

  const useRealImage = Boolean(envUrl) || localAvailable === true;

  if (useRealImage) {
    const img = (
      <img
        src={envUrl || LOCAL_MASCOT_PATH}
        alt={title}
        width={size}
        height={size}
        className={`${IMG_MOOD_CLASS[mood]} ${className ?? ''}`}
        style={{ objectFit: 'contain' }}
      />
    );
    if (onClick) {
      return (
        <button
          type="button"
          onClick={onClick}
          title={title}
          aria-label={title}
          className="bg-transparent border-none p-0 cursor-pointer leading-none"
        >
          {img}
        </button>
      );
    }
    return img;
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        title={title}
        aria-label={title}
        className="bg-transparent border-none p-0 cursor-pointer leading-none"
      >
        <FallbackMascotSvg size={size} className={className} mood={mood} />
      </button>
    );
  }

  return <FallbackMascotSvg size={size} className={className} mood={mood} />;
};