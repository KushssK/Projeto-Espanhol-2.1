// Tema global — aplica as cores salvas pelo painel administrativo em CSS variables.
(function () {
  const DEFAULT_THEME = {
    bgDeep: '#0b0518',
    bgGrad1: '#1c0a42',
    bgGrad2: '#3d1a85',
    accent: '#8b5cf6',
    accent2: '#e879f9',
    glassOpacity: 0.07,
    glassBlur: 18,
  };

  const root = document.documentElement;

  function hexToRgb(hex) {
    const h = String(hex || '').replace('#', '');
    if (h.length !== 6) return [139, 92, 246];
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function rgbStr(hex, a) {
    const [r, g, b] = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  // Aplica o tema nas variáveis CSS — usado tanto ao carregar quanto ao vivo no configurador
  window.applyTheme = function (t) {
    const theme = Object.assign({}, DEFAULT_THEME, t || {});
    root.style.setProperty('--bg-deep', theme.bgDeep);
    root.style.setProperty('--bg-grad-1', theme.bgGrad1);
    root.style.setProperty('--bg-grad-2', theme.bgGrad2);
    root.style.setProperty('--accent', theme.accent);
    root.style.setProperty('--accent-2', theme.accent2);
    const alpha = Math.min(0.2, Math.max(0.02, Number(theme.glassOpacity) || 0.07));
    const blur = Math.min(40, Math.max(6, Number(theme.glassBlur) || 18));
    root.style.setProperty('--glass-alpha', String(alpha));
    root.style.setProperty('--glass-blur', blur + 'px');
    root.style.setProperty('--glass-bg', `rgba(255, 255, 255, ${alpha})`);
    root.style.setProperty('--glass-bg-strong', `rgba(255, 255, 255, ${Math.min(0.2, alpha + 0.05)})`);
    root.style.setProperty('--accent-soft', rgbStr(theme.accent, 0.16));
    root.style.setProperty('--accent-soft-2', rgbStr(theme.accent2, 0.14));
    try { localStorage.setItem('cs_theme', JSON.stringify(theme)); } catch (e) { /* ignore */ }
  };

  // Carrega do servidor (tema global definido pelo admin) com fallback local
  window.loadTheme = async function () {
    let local = null;
    try { local = JSON.parse(localStorage.getItem('cs_theme')); } catch (e) { /* ignore */ }
    try {
      const res = await fetch('/api/theme');
      if (res.ok) {
        const t = await res.json();
        if (t && Object.keys(t).length) { window.applyTheme(t); return t; }
      }
    } catch (e) { /* offline */ }
    window.applyTheme(local || DEFAULT_THEME);
    return local || DEFAULT_THEME;
  };

  window.DEFAULT_THEME = DEFAULT_THEME;
})();
