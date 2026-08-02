/* ══════════════════════════════════════════════════════════
   Construindo Saberes — Service Worker (PWA offline)
   - App shell (HTML/CSS/JS/manifest/ícones) é cacheado: o site
     funciona sem internet.
   - Requisições de API NUNCA são cacheadas, para o chat e o
     painel de administração sempre refletirem o servidor.
   - Vídeos são baixados pelo botão "Baixar" (não entram no
     cache para não estourar o armazenamento do navegador).
   ══════════════════════════════════════════════════════════ */
const CACHE = 'cs-v4';

const SHELL = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/admin.html',
  '/css/style.css',
  '/js/api.js',
  '/js/theme.js',
  '/js/landing.js',
  '/js/dashboard.js',
  '/js/admin.js',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return; // POST/PATCH/etc. sempre vão à rede

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // recursos externos (CDN) não são tocados

  // API: nunca cacheia — sempre rede
  if (url.pathname.startsWith('/api/')) return;

  // Vídeos enviados (até 2GB): nunca entram no cache (estouraria a cota e
  // expulsaria o app shell). O aluno baixa/assiste direto da rede.
  if (url.pathname.startsWith('/uploads/')) return;

  // Documentos HTML: rede primeiro, cache como fallback (offline)
  if (req.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(url.pathname, copy));
          return res;
        })
        .catch(() => caches.match(url.pathname).then((m) => m || caches.match('/index.html')))
    );
    return;
  }

  // Estáticos (css/js/manifest/ícones): cache primeiro, rede como atualização em segundo plano
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      });
    })
  );
});
