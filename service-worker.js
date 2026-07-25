// Service Worker do FinPessoal
// Cuida do cache dos arquivos estáticos para o app funcionar offline
// e poder ser instalado no celular (PWA).

const CACHE_NAME = 'finpessoal-cache-v2';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './login.html',
  './manifest.json',
  './css/style.css',
  './js/app.js',
  './js/acesso.js',
  './js/agenda.js',
  './js/calculadora.js',
  './js/cartoes.js',
  './js/categorias.js',
  './js/contas.js',
  './js/dashboard.js',
  './js/demo.js',
  './js/dividas.js',
  './js/gastorapido.js',
  './js/lib/lucide.min.js',
  './js/modals.js',
  './js/movimentacoes.js',
  './js/nav.js',
  './js/pagar.js',
  './js/patrimonio.js',
  './js/receber.js',
  './js/receipts.js',
  './js/relatorios.js',
  './js/suporte.js',
  './js/ui.js',
  './js/utils.js',
  './assets/logo.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png'
];

// Instala o SW e guarda os arquivos em cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Ativa o SW e limpa caches antigos (de versões anteriores)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

// Estratégia: cache-first para arquivos estáticos, com fallback para rede.
// Se a rede também falhar (offline e não está em cache), tenta servir o index.html.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request)
        .then((networkResponse) => {
          // Atualiza o cache com a versão nova, sem travar a resposta atual
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return networkResponse;
        })
        .catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
    })
  );
});
