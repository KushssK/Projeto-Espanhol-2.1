// Estratégia de cache robusta contra deploy mascarado:
//  - NAVEGAÇÃO: sempre network-first (o usuário recebe o bundle novo do deploy).
//    Apenas em falha de rede usa o último index.html baixado (offline).
//  - ASSETS: cache-first POR URL — os bundles do Vite são hasheados, então um
//    deploy novo gera URLs novas e o cache antigo nunca é servido.
//  - Nada de precache de '/' ou '/index.html' (evita shell antigo).
const CACHE_VERSION = 'espanhol-em-rede-v4';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

self.addEventListener('install', (event) => {
  // Precache vazio de propósito: index.html sempre vem da rede no primeiro acesso.
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !k.startsWith(CACHE_VERSION)).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  const data = event.data;
  if (data?.type === 'CACHE_LESSON_ASSET' && data.url) {
    event.waitUntil(
      caches.open(RUNTIME_CACHE).then((cache) => cache.add(data.url).catch(() => undefined))
    );
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  // API: nunca cai no cache, exceto /settings (stale-while-revalidate)
  if (url.pathname.startsWith('/api/')) {
    if (url.pathname.endsWith('/settings')) {
      event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
    }
    return;
  }

  // Navegação: network-first com fallback offline para o último index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put('/index.html', copy)).catch(() => undefined);
          return response;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Assets hasheados (js/css/fontes/imagens): cache-first é seguro (hash no nome)
  if (url.pathname.match(/\.(js|css|woff2?|png|jpg|jpeg|webp|gif|ico)$/)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  }
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  });
  return cached || network;
}