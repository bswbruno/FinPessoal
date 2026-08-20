/**
 * ============================================================
 * FinPessoal v9.3 – js/ui.js
 * ============================================================
 * 
 * Responsabilidade deste arquivo: apenas comportamento "de interface" que
 * nao depende de nenhuma regra de negocio (financas, cartoes, etc.):
 * 
 * 1) Tema claro/escuro (salvo no navegador e lembrado na proxima visita)
 * 2) Menu lateral (sidebar) em modo "gaveta" (off-canvas) para
 *    tablet/celular, aberto/fechado pelo botao hamburguer
 * 3) Ocultar/mostrar valores monetarios em toda a interface
 * 4) Notificacoes (toast) com botao de confirmacao
 * 5) Modal de boas-vindas / aviso de privacidade
 * 6) Atualizacao do app (PWA)
 * 
 * Por que um arquivo separado?
 * Assim, qualquer ajuste futuro de tema ou de menu mobile fica isolado aqui,
 * sem precisar mexer em nav.js, dashboard.js, etc. — que cuidam so da logica
 * financeira do app.
 * ============================================================
 */

// ============================================================
// 1. TEMA CLARO / ESCURO
// ============================================================

const THEME_KEY = 'fp-theme';

// Le o tema salvo, ou cai para a preferencia do sistema, ou 'light'.
function getPreferredTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
}

// Aplica um tema: atualiza <html data-theme="..."> e o icone do botao.
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const btn = document.getElementById('theme-toggle-btn');
    if (btn) {
        btn.innerHTML = '<i data-lucide="' + (theme === 'dark' ? 'sun' : 'moon') + '"></i>';
        if (typeof refreshIcons === 'function') refreshIcons();
    }
}

// Alterna entre claro e escuro e salva a escolha do usuario.
function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
}

// Aplica o tema o quanto antes (chamado no <head> ou logo no inicio do body
// evitaria "flash" de tema errado; aqui chamamos na inicializacao do app).
applyTheme(getPreferredTheme());


// ============================================================
// 2. MENU LATERAL EM TABLET/CELULAR (sidebar off-canvas)
// ============================================================

function openSidebar() {
    document.querySelector('.app').classList.add('sidebar-open');
    document.getElementById('sidebar-overlay').classList.add('open');
}

function closeSidebar() {
    document.querySelector('.app').classList.remove('sidebar-open');
    document.getElementById('sidebar-overlay').classList.remove('open');
}

function toggleSidebar() {
    const isOpen = document.querySelector('.app').classList.contains('sidebar-open');
    isOpen ? closeSidebar() : openSidebar();
}


// ============================================================
// 3. OCULTAR / MOSTRAR VALORES
// ============================================================

function toggleHideValues() {
    ST.settings.hideValues = !ST.settings.hideValues;
    sv();
    applyHideValuesIcon();
    render();
}

function applyHideValuesIcon() {
    const btn = document.getElementById('hide-values-btn');
    if (btn) {
        btn.innerHTML = '<i data-lucide="' + (ST.settings.hideValues ? 'eye-off' : 'eye') + '"></i>';
        btn.classList.toggle('active', ST.settings.hideValues);
        btn.setAttribute('aria-pressed', ST.settings.hideValues ? 'true' : 'false');
        btn.style.opacity = ST.settings.hideValues ? '.7' : '1';
        if (typeof refreshIcons === 'function') refreshIcons();
    }
}


// ============================================================
// 4. QUICK ADD MENU (botao + central do mobile)
// ============================================================

function openQuickAddMenu() {
    openModal('modal-quick-add');
}


// ============================================================
// 5. NOTIFICACAO (TOAST) - VERSAO COMPLETA
// ============================================================

// Variaveis de controle
var _notifyTimeout = null;
var _notifyResolved = false;

/**
 * Exibe uma notificacao com botao de confirmacao
 * @param {string} msg - Mensagem a ser exibida
 * @param {string} type - 'ok' | 'err' | 'info' | 'confirm' | 'update'
 * @param {Function} onConfirm - Callback executado ao clicar em "OK" (opcional)
 * @param {number} duration - Tempo em ms para auto-fechar (padrao: 5000ms)
 */
function notify(msg, type, onConfirm, duration) {
    type = type || 'ok';
    duration = duration || 5000;
    
    var el = document.getElementById('notif');
    if (!el) {
        console.warn('Elemento #notif nao encontrado');
        return;
    }

    // Cancela timeout anterior se existir
    if (_notifyTimeout) {
        clearTimeout(_notifyTimeout);
        _notifyTimeout = null;
    }

    // Reseta o estado
    _notifyResolved = false;

    // Define a classe base
    el.className = type;

    // Conteudo da notificacao
    var content = '<span class="notif-msg">' + msg + '</span>';

    // Se for do tipo 'confirm' ou 'update', adiciona botoes
    if (type === 'confirm') {
        content += '<div class="notif-actions"><button class="notif-btn notif-btn-confirm" onclick="window.resolveNotify(true)">OK</button><button class="notif-btn notif-btn-cancel" onclick="window.resolveNotify(false)">Cancelar</button></div>';
    } else if (type === 'update') {
        content += '<div class="notif-actions"><button class="notif-btn notif-btn-update" onclick="window.resolveUpdate(true)">Atualizar</button><button class="notif-btn notif-btn-cancel" onclick="window.resolveUpdate(false)">Cancelar</button></div>';
    } else {
        // Para os outros tipos, apenas um botao de fechar
        content += '<button class="notif-btn notif-btn-close" onclick="window.closeNotify()">x</button>';
    }

    el.innerHTML = content;
    el.style.display = 'flex';
    el.style.opacity = '0';

    // Animacao de entrada
    requestAnimationFrame(function() {
        el.style.opacity = '1';
    });

    // Se for um tipo que nao requer confirmacao, fecha automaticamente
    if (type !== 'confirm' && type !== 'update') {
        _notifyTimeout = setTimeout(function() {
            if (!_notifyResolved) {
                window.closeNotify();
            }
        }, duration);
    }

    // Armazena o callback de confirmacao
    if (onConfirm && typeof onConfirm === 'function') {
        window._notifyConfirm = onConfirm;
    } else {
        window._notifyConfirm = null;
    }
}

/**
 * Resolve a notificacao de confirmacao
 * @param {boolean} accepted - true se aceitou, false se cancelou
 */
function resolveNotify(accepted) {
    if (_notifyResolved) return;
    _notifyResolved = true;

    if (accepted && window._notifyConfirm) {
        window._notifyConfirm();
    }
    window.closeNotify();
}

/**
 * Resolve a notificacao de atualizacao
 * @param {boolean} accepted - true se clicou em "Atualizar", false se "Cancelar"
 */
function resolveUpdate(accepted) {
    console.log('🔧 resolveUpdate chamado! accepted:', accepted);
    if (_notifyResolved) return;
    _notifyResolved = true;

    if (accepted && window._updateCallback) {
        console.log('✅ Executando callback de atualizacao...');
        window._updateCallback();
    }
    window.closeNotify();
}

/**
 * Fecha a notificacao imediatamente
 */
function closeNotify() {
    var el = document.getElementById('notif');
    if (el) {
        el.style.opacity = '0';
        setTimeout(function() {
            el.style.display = 'none';
        }, 300);
    }
    if (_notifyTimeout) {
        clearTimeout(_notifyTimeout);
        _notifyTimeout = null;
    }
    _notifyResolved = true;
}

/**
 * Exibe notificacao de atualizacao disponivel
 * @param {Function} onUpdate - Callback executado ao clicar em "Atualizar"
 */
function notifyUpdateAvailable(onUpdate) {
    console.log('🔄 notifyUpdateAvailable chamado!');
    if (_notifyResolved) return;

    // Armazena o callback
    window._updateCallback = onUpdate || null;

    // Exibe a notificacao com tipo 'update'
    notify('Nova versao disponivel! Clique em "Atualizar" para receber as ultimas melhorias.', 'update');
}

/**
 * Exibe toast de atualizacao concluida (fecha automatico)
 */
function showUpdatedToast() {
    notify('Aplicativo atualizado com sucesso!', 'ok', null, 4000);
}

/**
 * Verifica se o app foi atualizado e mostra o toast
 * Chamado no carregamento da pagina
 */
function maybeShowUpdatedToast() {
    if (localStorage.getItem('fp_just_updated') === '1') {
        localStorage.removeItem('fp_just_updated');
        showUpdatedToast();
    }
}


// ============================================================
// 6. MODAL DE BOAS-VINDAS / AVISO DE PRIVACIDADE
// ============================================================

const WELCOME_SEEN_KEY = 'fp-welcome-seen';

function maybeShowWelcomeModal() {
    if (localStorage.getItem(WELCOME_SEEN_KEY)) return;
    openModal('modal-welcome');
}

function closeWelcomeModal() {
    localStorage.setItem(WELCOME_SEEN_KEY, '1');
    closeModal('modal-welcome');
}


// ============================================================
// 7. FUNCAO NOTIFY LEGACY (para compatibilidade)
// ============================================================

// Mantem a funcao original para compatibilidade com codigo existente
// que chama notify() sem o novo parametro
function notifyLegacy(msg, type) {
    type = type || 'ok';
    return notify(msg, type);
}

// ============================================================
// EXPORTA FUNCOES PARA O ESCOPO GLOBAL
// ============================================================

// Torna as funcoes acessiveis globalmente para uso no console e no HTML
window.notify = notify;
window.notifyUpdateAvailable = notifyUpdateAvailable;
window.resolveUpdate = resolveUpdate;
window.closeNotify = closeNotify;
window.showUpdatedToast = showUpdatedToast;
window.maybeShowUpdatedToast = maybeShowUpdatedToast;
window.resolveNotify = resolveNotify;

console.log('✅ ui.js carregado com sucesso!');