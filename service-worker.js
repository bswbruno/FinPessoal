// Service Worker do FinPessoal
// Cuida do cache dos arquivos estáticos para o app funcionar offline
// e poder ser instalado no celular (PWA).

const CACHE_NAME = 'finpessoal-cache-v10.3';

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
    './icons/favicon-32.ico',
    './icons/icon-32.png',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './icons/icon-512-maskable.png'
];

// ============================================================
// INSTALAÇÃO
// ============================================================

self.addEventListener('install', (event) => {
    // self.skipWaiting() aqui faz a atualização ser AUTOMÁTICA: assim que o
    // navegador termina de baixar essa nova versão, ela já assume — sem
    // esperar a pessoa fechar todas as abas/o app nem clicar em nada. Quem
    // cuida de recarregar a página (e mostrar o aviso "Aplicativo
    // atualizado") é o index.html, ao detectar o evento 'controllerchange'.
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS_TO_CACHE))
    );
});

// ============================================================
// ATIVAÇÃO
// ============================================================

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

// ============================================================
// INTERCEPTAÇÃO DE REQUISIÇÕES (CACHE-FIRST)
// ============================================================

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
                    // Se for navegação e estiver offline, mostra o index.html
                    if (event.request.mode === 'navigate') {
                        return caches.match('./index.html');
                    }
                });
        })
    );
});

// ============================================================
// COMUNICAÇÃO COM O CLIENTE (NOVO!)
// ============================================================

/**
 * Escuta mensagens enviadas pelo index.html
 * Permite que o usuário force a ativação da nova versão
 * ao clicar em "Atualizar" na notificação
 */
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        // Força a ativação da nova versão do Service Worker
        self.skipWaiting();
    }
});

// ============================================================
// DETECÇÃO DE NOVA VERSÃO (NOVO!)
// ============================================================

/**
 * Quando uma nova versão do Service Worker é encontrada,
 * notifica todos os clientes (abas) sobre a atualização
 */
self.addEventListener('controllerchange', () => {
    // Notifica os clientes que o Service Worker mudou
    self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
            client.postMessage({
                type: 'SW_UPDATED'
            });
        });
    });
});