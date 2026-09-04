import React from 'react';

// ============================================================================
// Mascote da plataforma
//
// Como adicionar o visual definitivo (sem precisar mexer no código):
//   1. Coloque o arquivo em:  frontend/public/mascot/mascot.png
//      (pode ser .svg/.webp/.jpg — basta manter o caminho e o nome)
//   2. Alternativa: defina a env  VITE_MASCOT_IMAGE_URL  no build do
//      frontend apontando para a URL do asset (ex.: CDN ou upload).
//
// Ordem de resolução: env VITE_MASCOT_IMAGE_URL → asset local
// /mascot/mascot.png → mascote ilustrado padrão (SVG embutido, que NÃO
// representa nenhuma pessoa real).
// ============================================================================

interface MascotProps {
  size?: number;
  className?: string;
  title?: string;
}

const LOCAL_MASCOT_PATH = '/mascot/mascot.png';

const FallbackMascotSvg: React.FC<{ size: number; className?: string }> = ({ size, className }) => (
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
    <circle cx="51" cy="43" r="4" fill="#1F2937" />
    <circle cx="69" cy="43" r="4" fill="#1F2937" />
    <circle cx="52.5" cy="41" r="1.3" fill="#FFFFFF" />
    <circle cx="70.5" cy="41" r="1.3" fill="#FFFFFF" />
    {/* Bico */}
    <path d="M55 50 L60 58 L65 50 Z" fill="#EA580C" />
    {/* Asas */}
    <path d="M26 66 Q16 88 30 104 Q36 84 34 72 Z" fill="#D97706" />
    <path d="M94 66 Q104 88 90 104 Q84 84 86 72 Z" fill="#D97706" />
    {/* Pés */}
    <ellipse cx="50" cy="108" rx="7" ry="3.5" fill="#EA580C" />
    <ellipse cx="70" cy="108" rx="7" ry="3.5" fill="#EA580C" />
  </svg>
);

export const Mascot: React.FC<MascotProps> = ({
  size = 96,
  className,
  title = 'Mascote do Espanhol em Rede',
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

  if (envUrl || localAvailable === true) {
    return (
      <img
        src={envUrl || LOCAL_MASCOT_PATH}
        alt={title}
        width={size}
        height={size}
        className={className}
        style={{ objectFit: 'contain' }}
      />
    );
  }

  return <FallbackMascotSvg size={size} className={className} />;
};