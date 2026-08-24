import { create } from 'zustand';
import { api } from '../services/api';

const DEFAULT_COLOR = '#7C3AED'; // Roxo (Violeta) — cor padrão de fallback

interface ThemeState {
  themeColor: string;
  logoUrl: string | null;
  isLoading: boolean;
  fetchSettings: () => Promise<void>;
  updateSettingsOnState: (color: string, logo: string | null) => void;
}

// ============================================================================
// Helpers de cor (hex -> rgba / escurecer) para aplicar o tema dinamicamente
// ============================================================================
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '').trim();
  if (clean.length !== 6) return null;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return null;
  return { r, g, b };
}

function darken(hex: string, amount = 0.12): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const d = (v: number) => Math.max(0, Math.round(v * (1 - amount)));
  return `rgb(${d(rgb.r)}, ${d(rgb.g)}, ${d(rgb.b)})`;
}

function rgba(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return `rgba(124, 58, 237, ${alpha})`;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

/** Aplica a cor do tema nas variáveis CSS raiz (e derivadas) */
function applyThemeVars(color: string) {
  const root = document.documentElement.style;
  root.setProperty('--primary-color', color);
  root.setProperty('--primary-hover', darken(color, 0.12));
  root.setProperty('--primary-light', rgba(color, 0.1));
  root.setProperty('--primary-border', rgba(color, 0.22));
  root.setProperty('--primary-soft', rgba(color, 0.05));
  root.setProperty('--primary-gradient', `linear-gradient(135deg, ${color} 0%, ${rgba(color, 0.75)} 60%, ${rgba(color, 0.35)} 100%)`);
}

export const useThemeStore = create<ThemeState>((set) => ({
  themeColor: DEFAULT_COLOR,
  logoUrl: null,
  isLoading: true,

  fetchSettings: async () => {
    try {
      const response = await api.get('/settings');
      if (response.data) {
        const { themeColor, logoUrl } = response.data;
        const color = themeColor || DEFAULT_COLOR;
        set({ themeColor: color, logoUrl: logoUrl || null, isLoading: false });
        applyThemeVars(color);
      }
    } catch (error) {
      console.error('Erro ao buscar configurações de tema/marca:', error);
      set({ isLoading: false });
      applyThemeVars(DEFAULT_COLOR);
    }
  },

  updateSettingsOnState: (color, logo) => {
    set({ themeColor: color, logoUrl: logo });
    applyThemeVars(color);
  },
}));
