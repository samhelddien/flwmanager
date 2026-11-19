/* ==========================================================================
   .FLW ATENDIMENTO — SERVICE WORKER (PWA MOBILE-FIRST)
   Estratégia segura:
   - /api/*, Gemini, e-mail e métodos não-GET -> Network-Only (NUNCA cacheados)
   - Navegação HTML -> Network-First com fallback offline para o App Shell
   - Assets estáticos locais e fontes -> Stale-While-Revalidate
   MADE BY SAM HELD
   ========================================================================== */

const APP_CACHE = 'flw-shell-v1';
const RUNTIME_CACHE = 'flw-runtime-v1';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.webmanifest',
  '/icons/icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon.png'
];

const BYPASS_HOST_PATTERNS = [
  'generativelanguage.googleapis.com',
  'api.emailjs.com',
  'formsubmit.co',
  'api.resend.com'
];

const ALLOWED_CDN_HOSTS = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cdnjs.cloudflare.com'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_CACHE)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  const validCaches = new Set([APP_CACHE, RUNTIME_CACHE]);
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => !validCaches.has(key))
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // 1. Nunca interceptar métodos mutáveis (POST /api/chat, /api/send-briefing, etc.)
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // 2. Ignorar protocolos não-HTTP (chrome-extension, data, blob)
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // 3. Bypass estrito para rotas de API, streaming, SSE e mídia pesada (.mp4)
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.endsWith('.mp4') ||
    request.headers.get('accept')?.includes('text/event-stream') ||
    BYPASS_HOST_PATTERNS.some((host) => url.hostname.includes(host))
  ) {
    return;
  }

  // 4. Navegação de documentos -> Network-First com fallback seguro offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkRes) => {
          if (networkRes && networkRes.ok && networkRes.type === 'basic') {
            const copy = networkRes.clone();
            caches.open(APP_CACHE).then((cache) => cache.put('/index.html', copy));
          }
          return networkRes;
        })
        .catch(async () => (await caches.match('/index.html')) || (await caches.match('/')))
    );
    return;
  }

  // 5. Assets estáticos da mesma origem -> Stale-While-Revalidate
  if (url.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidate(request, APP_CACHE));
    return;
  }

  // 6. Fontes e ícones de CDN permitidos -> Stale-While-Revalidate em cache separado
  if (ALLOWED_CDN_HOSTS.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`))) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
  }
});

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkPromise = fetch(request)
    .then((networkRes) => {
      if (networkRes && (networkRes.ok || networkRes.type === 'opaque')) {
        cache.put(request, networkRes.clone());
      }
      return networkRes;
    })
    .catch(() => null);

  return cached || (await networkPromise) || new Response('Offline', { status: 503, statusText: 'Offline' });
}
