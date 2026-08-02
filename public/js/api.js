// Cliente de API compartilhado + helpers de UI
(function () {
  const TOKEN_KEY = 'cs_token';
  const USER_KEY = 'cs_user';

  window.API = {
    get token() { return localStorage.getItem(TOKEN_KEY) || ''; },
    set token(v) { if (v) localStorage.setItem(TOKEN_KEY, v); else localStorage.removeItem(TOKEN_KEY); },
    get user() {
      try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch (e) { return null; }
    },
    set user(u) { if (u) localStorage.setItem(USER_KEY, JSON.stringify(u)); else localStorage.removeItem(USER_KEY); },
    logout() { this.token = ''; this.user = null; },
  };

  async function request(path, options = {}) {
    const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
    if (API.token) headers.Authorization = 'Bearer ' + API.token;
    const res = await fetch(path, Object.assign({}, options, { headers, body: options.body ? JSON.stringify(options.body) : undefined }));
    let data = null;
    try { data = await res.json(); } catch (e) { /* sem corpo */ }
    if (!res.ok) {
      const err = new Error((data && data.error) || 'Erro inesperado (' + res.status + ')');
      err.status = res.status;
      throw err;
    }
    return data;
  }

  window.req = {
    get: (p) => request(p),
    post: (p, b) => request(p, { method: 'POST', body: b }),
    patch: (p, b) => request(p, { method: 'PATCH', body: b }),
    put: (p, b) => request(p, { method: 'PUT', body: b }),
    del: (p) => request(p, { method: 'DELETE' }),
  };

  // ─── Toast ───
  window.toast = function (msg, type = 'info') {
    let wrap = document.getElementById('toast-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'toast-wrap';
      document.body.appendChild(wrap);
    }
    const icons = { success: '✅', error: '⚠️', info: '💡' };
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    el.innerHTML = '<span class="t-icon">' + (icons[type] || '💡') + '</span><span>' + msg + '</span>';
    wrap.appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 320); }, 3400);
  };

  // ─── Avatar ───
  window.avatarHtml = function (user, sizeClass = '') {
    if (user && user.avatar) return '<div class="avatar ' + sizeClass + '"><img src="' + escapeHtml(user.avatar) + '" alt="avatar"></div>';
    const name = (user && user.username) || '?';
    const initial = name.charAt(0).toUpperCase();
    return '<div class="avatar ' + sizeClass + '">' + escapeHtml(initial) + '</div>';
  };

  window.escapeHtml = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  window.timeAgo = function (iso) {
    if (!iso) return '';
    const t = new Date(iso);
    const s = Math.floor((Date.now() - t.getTime()) / 1000);
    if (s < 60) return 'agora';
    if (s < 3600) return Math.floor(s / 60) + ' min';
    if (s < 86400) return Math.floor(s / 3600) + ' h';
    return t.toLocaleDateString('pt-BR');
  };

  window.formatDate = function (iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  // ─── Modal ───
  window.openModal = function (id) {
    const m = document.getElementById(id);
    if (m) m.classList.add('open');
  };
  window.closeModal = function (id) {
    const m = document.getElementById(id);
    if (m) m.classList.remove('open');
  };

  // helpers de campo
  window.gradThumb = function (emoji, seed = 0) {
    const hues = [[139, 92, 246], [232, 121, 249], [59, 130, 246], [34, 211, 238], [168, 85, 247]];
    const [r, g, b] = hues[seed % hues.length];
    return {
      background: `radial-gradient(circle at 25% 20%, rgba(${r},${g},${b},0.55), transparent 60%), radial-gradient(circle at 80% 80%, rgba(${g},${b},${r},0.4), transparent 55%), linear-gradient(140deg, #170a33, #0d0620)`,
    };
  };
})();
