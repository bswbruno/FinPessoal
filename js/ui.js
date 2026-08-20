/**
 * ============================================================
 * FinPessoal v9.3 – js/ui.js
 * ============================================================
 */

// ============================================================
// 1. TEMA CLARO / ESCURO
// ============================================================

const THEME_KEY = 'fp-theme';

function getPreferredTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const btn = document.getElementById('theme-toggle-btn');
    if (btn) {
        btn.innerHTML = '<i data-lucide="' + (theme === 'dark' ? 'sun' : 'moon') + '"></i>';
        if (typeof refreshIcons === 'function') refreshIcons();
    }
}

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
}

applyTheme(getPreferredTheme());


// ============================================================
// 2. MENU LATERAL
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
// 3. OCULTAR VALORES
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
// 4. QUICK ADD MENU
// ============================================================

function openQuickAddMenu() {
    openModal('modal-quick-add');
}


// ============================================================
// 5. NOTIFICACAO COMPLETA COM BOTOES
// ============================================================

var _notifyTimeout = null;
var _notifyResolved = false;

function notify(msg, type, onConfirm, duration) {
    type = type || 'ok';
    duration = duration || 5000;
    
    var el = document.getElementById('notif');
    if (!el) {
        console.warn('Elemento #notif nao encontrado');
        return;
    }

    var overlay = document.getElementById('notif-overlay');

    if (_notifyTimeout) {
        clearTimeout(_notifyTimeout);
        _notifyTimeout = null;
    }

    _notifyResolved = false;
    el.className = type;

    var content = '<span class="notif-msg">' + msg + '</span>';

    if (type === 'confirm') {
        content += '<div class="notif-actions"><button class="notif-btn notif-btn-confirm" onclick="window.resolveNotify(true)">OK</button><button class="notif-btn notif-btn-cancel" onclick="window.resolveNotify(false)">Cancelar</button></div>';
    } else if (type === 'update') {
        content += '<div class="notif-actions"><button class="notif-btn notif-btn-update" onclick="window.resolveUpdate(true)">Atualizar</button><button class="notif-btn notif-btn-cancel" onclick="window.resolveUpdate(false)">Cancelar</button></div>';
    } else {
        content += '<button class="notif-btn notif-btn-close" onclick="window.closeNotify()">x</button>';
    }

    el.innerHTML = content;
    el.style.display = 'flex';
    el.style.opacity = '0';

    // ============================================================
    // MOSTRA O OVERLAY PARA TIPOS QUE BLOQUEIAM A TELA
    // ============================================================
    if (type === 'confirm' || type === 'update') {
        if (overlay) {
            overlay.style.display = 'block';
            overlay.style.opacity = '0';
            requestAnimationFrame(function() {
                overlay.style.opacity = '1';
            });
        }
    }

    requestAnimationFrame(function() {
        el.style.opacity = '1';
    });

    // Só fecha automaticamente se NÃO for 'confirm' ou 'update'
    if (type !== 'confirm' && type !== 'update') {
        _notifyTimeout = setTimeout(function() {
            if (!_notifyResolved) {
                window.closeNotify();
            }
        }, duration);
    }

    if (onConfirm && typeof onConfirm === 'function') {
        window._notifyConfirm = onConfirm;
    } else {
        window._notifyConfirm = null;
    }
}

function resolveNotify(accepted) {
    if (_notifyResolved) return;
    _notifyResolved = true;
    if (accepted && window._notifyConfirm) {
        window._notifyConfirm();
    }
    window.closeNotify();
}

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

function closeNotify() {
    var el = document.getElementById('notif');
    var overlay = document.getElementById('notif-overlay');

    if (el) {
        el.style.opacity = '0';
        setTimeout(function() {
            el.style.display = 'none';
        }, 300);
    }

    // ============================================================
    // OCULTA O OVERLAY
    // ============================================================
    if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(function() {
            overlay.style.display = 'none';
        }, 300);
    }

    if (_notifyTimeout) {
        clearTimeout(_notifyTimeout);
        _notifyTimeout = null;
    }
    _notifyResolved = true;
}

function notifyUpdateAvailable(onUpdate) {
    console.log('🔄 notifyUpdateAvailable chamado!');
    if (_notifyResolved) return;
    window._updateCallback = onUpdate || null;
    notify('🔄 Nova versão disponível! Clique em "Atualizar" para receber as últimas melhorias.', 'update');
}

function showUpdatedToast() {
    notify('Aplicativo atualizado com sucesso! 🎉', 'ok', null, 4000);
}

function maybeShowUpdatedToast() {
    if (localStorage.getItem('fp_just_updated') === '1') {
        localStorage.removeItem('fp_just_updated');
        showUpdatedToast();
    }
}


// ============================================================
// 6. MODAL DE BOAS-VINDAS
// ============================================================

var WELCOME_SEEN_KEY = 'fp-welcome-seen';

function maybeShowWelcomeModal() {
    if (localStorage.getItem(WELCOME_SEEN_KEY)) return;
    openModal('modal-welcome');
}

function closeWelcomeModal() {
    localStorage.setItem(WELCOME_SEEN_KEY, '1');
    closeModal('modal-welcome');
}


// ============================================================
// 7. EXPORTA FUNCOES PARA O ESCOPO GLOBAL
// ============================================================

window.notify = notify;
window.notifyUpdateAvailable = notifyUpdateAvailable;
window.resolveUpdate = resolveUpdate;
window.closeNotify = closeNotify;
window.showUpdatedToast = showUpdatedToast;
window.maybeShowUpdatedToast = maybeShowUpdatedToast;
window.resolveNotify = resolveNotify;

console.log('✅ ui.js carregado com sucesso!');