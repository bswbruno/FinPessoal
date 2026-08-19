/**
 * ============================================================
 * FinPessoal v9.3 – Contas Bancárias
 * ============================================================
 * 
 * Regra de negócio importante: o saldo aqui mostrado é só informativo — ele
 * NÃO é somado/abatido automaticamente contra despesas ou dívidas pendentes
 * em nenhum lugar do sistema. A única forma de uma despesa "consumir" saldo
 * de uma conta é através da modal de confirmação de pagamento (ver
 * js/receipts.js), onde o usuário escolhe explicitamente a conta usada.
 * ============================================================
 */

// ============================================================
// 1. CONFIGURAÇÃO GLOBAL
// ============================================================

let scAcc = '#3b82f6'; // cor selecionada no formulário de conta (swatch)


// ============================================================
// 2. FUNÇÃO PRINCIPAL: RENDER CONTAS
// ============================================================

function renderContas() {
    const ativas = ST.accounts.filter(a => a.status !== 'inativa');
    const totalAtivas = ativas.reduce((s, a) => s + accountBalance(a.id), 0);

    const html = ST.accounts.length
        ? ST.accounts.map(a => {
            const bal = accountBalance(a.id);
            const inativa = a.status === 'inativa';

            return `
                <div class="account-shell ${inativa ? 'account-inactive' : ''}">
                    <!-- CARTÃO VISUAL DA CONTA -->
                    <div class="account-card-visual" style="background:linear-gradient(135deg,${a.color}ee,${a.color}88);">
                        <div class="account-card-header">
                            <span class="account-card-type">${(a.type || 'CORRENTE').toUpperCase()}</span>
                            <span class="account-card-status ${inativa ? 'status-inactive' : 'status-active'}">
                                ${inativa ? 'Inativa' : 'Ativa'}
                            </span>
                        </div>
                        <div class="account-card-name">${a.name}</div>
                        <div class="account-card-details">
                            ${a.bank || '—'}${a.agency ? ` · Ag ${a.agency}` : ''}${a.number ? ` · Cc ${a.number}` : ''}
                        </div>
                        <div class="account-card-balance-label">Saldo atual</div>
                        <div class="account-card-balance-value">${fmt(bal)}</div>
                    </div>

                    <!-- PIX (se houver) -->
                    ${a.pix ? `
                        <div class="account-pix-container">
                            <span class="account-pix-text" title="${a.pix}">${icon('key')} ${a.pix}</span>
                            <button class="btn-sm" id="pix-copy-${a.id}" onclick="copyPix('${a.id}')">Copiar</button>
                        </div>
                    ` : ''}

                    <!-- RODAPÉ DA CONTA -->
                    <div class="account-footer">
                        <span class="account-initial-balance">Saldo inicial: ${fmt(a.initialBalance)}</span>
                        <div class="account-actions">
                            <button class="btn-sm" onclick="toggleAccStatus('${a.id}')" title="${inativa ? 'Reativar' : 'Desativar'}">
                                ${inativa ? icon('refresh-cw') : icon('pause')}
                            </button>
                            <button class="btn-sm edit" onclick="editAcc('${a.id}')">${icon('pencil')}</button>
                            <button class="btn-sm del" onclick="delAcc('${a.id}')">${icon('trash-2')}</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('')
        : `
            <div class="empty-state-accounts">Nenhuma conta cadastrada. Clique em "+ Nova Conta".</div>
        `;

    document.getElementById('content').innerHTML = `
        <!-- KPIs -->
        <div class="kpi-grid accounts-kpi-grid">
            <div class="kpi kpi-purple">
                <div class="kpi-label">Saldo total (contas ativas)</div>
                <div class="kpi-value">${fmt(totalAtivas)}</div>
                <div class="kpi-sub">${ativas.length} conta${ativas.length !== 1 ? 's' : ''} ativa${ativas.length !== 1 ? 's' : ''}</div>
            </div>
            <div class="kpi kpi-neutral">
                <div class="kpi-label">Total de contas cadastradas</div>
                <div class="kpi-value">${ST.accounts.length}</div>
                <div class="kpi-sub">inclui inativas</div>
            </div>
        </div>

        <p class="accounts-hint">💡 Esse saldo é independente das suas despesas pendentes — ele só muda quando você vincula um pagamento/recebimento a uma conta.</p>

        <div class="toolbar accounts-toolbar">
            <span class="accounts-count">${ST.accounts.length} conta${ST.accounts.length !== 1 ? 's' : ''}</span>
            <button class="btn btn-primary" onclick="openAccModal()">${icon('plus')} Nova Conta</button>
        </div>

        <div class="account-list">${html}</div>
    `;
}


// ============================================================
// 3. FUNÇÕES: CRUD (CRIAR, EDITAR, DELETAR)
// ============================================================

function openAccModal() {
    _editId = null;
    document.getElementById('modal-acc-title').textContent = 'Nova Conta Bancária';

    ['acc-name', 'acc-bank', 'acc-agency', 'acc-number', 'acc-pix'].forEach(id =>
        document.getElementById(id).value = ''
    );
    document.getElementById('acc-type').value = 'corrente';
    document.getElementById('acc-initial').value = '';
    document.getElementById('acc-status').value = 'ativa';
    buildAccSwatches('#3b82f6');
    openModal('modal-acc');
}

function editAcc(id) {
    const a = ST.accounts.find(x => x.id === id);
    if (!a) return;

    _editId = id;
    document.getElementById('modal-acc-title').textContent = 'Editar Conta Bancária';
    document.getElementById('acc-name').value = a.name || '';
    document.getElementById('acc-bank').value = a.bank || '';
    document.getElementById('acc-agency').value = a.agency || '';
    document.getElementById('acc-number').value = a.number || '';
    document.getElementById('acc-type').value = a.type || 'corrente';
    document.getElementById('acc-initial').value = a.initialBalance || 0;
    document.getElementById('acc-status').value = a.status || 'ativa';
    document.getElementById('acc-pix').value = a.pix || '';
    buildAccSwatches(a.color || '#3b82f6');
    openModal('modal-acc');
}

function delAcc(id) {
    const a = ST.accounts.find(x => x.id === id);
    if (!a) return;

    const linked = ST.movements.filter(m => m.accountId === id || m.toAccountId === id);

    if (linked.length) {
        const total = linked.reduce((s, m) => s + (+m.value || 0), 0);
        const rows = linked.slice(0, 8).map(m => `
            <div class="account-movement-item">
                <span>${fmtD(m.date)} — ${m.desc}</span>
                <span>${fmt(m.value)}</span>
            </div>
        `).join('');

        const more = linked.length > 8
            ? `<p class="account-movement-more">+ ${linked.length - 8} outra${linked.length - 8 > 1 ? 's' : ''} movimentaç${linked.length - 8 > 1 ? 'ões' : 'ão'}</p>`
            : '';

        confirmHTML(`
            <p class="account-confirm-message">
                <strong>${a.name}</strong> tem <strong>${linked.length}</strong> movimentaç${linked.length > 1 ? 'ões' : 'ão'} vinculada${linked.length > 1 ? 's' : ''} (total ${fmt(total)}):
            </p>
            <div>${rows}</div>
            ${more}
            <p class="account-confirm-warning">Remover a conta <strong>NÃO apaga</strong> esse histórico — ele passa a mostrar "Conta removida" nas Movimentações. Continuar?</p>
        `, () => {
            ST.accounts = ST.accounts.filter(x => x.id !== id);
            sv();
            notify('Conta removida', 'err');
            render();
        });
        return;
    }

    confirm2('Remover esta conta?', () => {
        ST.accounts = ST.accounts.filter(x => x.id !== id);
        sv();
        notify('Conta removida', 'err');
        render();
    });
}

function toggleAccStatus(id) {
    const a = ST.accounts.find(x => x.id === id);
    if (!a) return;

    a.status = a.status === 'inativa' ? 'ativa' : 'inativa';
    sv();
    notify(a.status === 'ativa' ? 'Conta reativada' : 'Conta desativada');
    render();
}


// ============================================================
// 4. FUNÇÕES: SALVAR CONTA
// ============================================================

function saveAcc() {
    const name = document.getElementById('acc-name').value.trim();
    const initial = parseFloat(document.getElementById('acc-initial').value) || 0;

    if (!name) {
        notify('Preencha o nome da conta', 'err');
        return;
    }

    const obj = {
        name,
        bank: document.getElementById('acc-bank').value,
        agency: document.getElementById('acc-agency').value,
        number: document.getElementById('acc-number').value,
        type: document.getElementById('acc-type').value,
        color: scAcc,
        initialBalance: initial,
        status: document.getElementById('acc-status').value,
        pix: document.getElementById('acc-pix').value.trim()
    };

    if (_editId) {
        Object.assign(ST.accounts.find(a => a.id === _editId), obj);
        notify('Conta atualizada!');
    } else {
        ST.accounts.push({ ...obj, id: gid() });
        notify('Conta adicionada!');
    }

    sv();
    closeModal('modal-acc');
    render();
}


// ============================================================
// 5. FUNÇÕES: CORES E SWATCHES
// ============================================================

function buildAccSwatches(sel) {
    scAcc = sel;
    const w = document.getElementById('acc-color-swatches');
    if (!w) return;

    const CCOLORS = [
        '#3b82f6', '#6366f1', '#ef4444', '#f59e0b', '#10b981',
        '#8b5cf6', '#ec4899', '#0ea5e9', '#22c55e', '#334155'
    ];

    w.innerHTML = CCOLORS.map(c => `
        <div class="color-swatch" onclick="buildAccSwatches('${c}')" style="background:${c};border-color:${c === scAcc ? 'var(--text)' : 'transparent'};"></div>
    `).join('') + `
        <input class="color-picker" type="color" value="${sel}" oninput="buildAccSwatches(this.value)">
    `;
}


// ============================================================
// 6. FUNÇÕES: PIX
// ============================================================

/**
 * Copia o código PIX da conta pra área de transferência, com confirmação
 * visual no próprio botão (muda o texto por 1.5s) além do toast de notify().
 */
function copyPix(id) {
    const a = ST.accounts.find(x => x.id === id);
    if (!a || !a.pix) return;

    const finish = (ok) => {
        const btn = document.getElementById('pix-copy-' + id);
        if (btn) {
            const original = btn.textContent;
            btn.textContent = ok ? '✓ Copiado!' : 'Erro';
            setTimeout(() => {
                if (btn) btn.textContent = original;
            }, 1500);
        }
        notify(ok ? 'Chave PIX copiada!' : 'Não foi possível copiar', ok ? 'ok' : 'err');
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(a.pix).then(() => finish(true)).catch(() => finish(false));
    } else {
        // Fallback pra navegadores/contextos sem suporte à Clipboard API (ex: http:// não-localhost)
        const ta = document.createElement('textarea');
        ta.value = a.pix;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try {
            document.execCommand('copy');
            finish(true);
        } catch (e) {
            finish(false);
        }
        ta.remove();
    }
}


// ============================================================
// 7. FUNÇÕES: UTILITÁRIOS
// ============================================================

/**
 * Preenche um <select> com as contas ATIVAS (usado nos modais de pagamento,
 * recebimento e movimentações). `emptyLabel` é o texto da primeira opção
 * (ex: "Não vincular a nenhuma conta" ou "Selecione a conta...").
 */
function refreshAccountSelect(selectId, emptyLabel) {
    const s = document.getElementById(selectId);
    if (!s) return;

    const current = s.value;
    const ativas = ST.accounts.filter(a => a.status !== 'inativa');

    s.innerHTML = `
        <option value="">${emptyLabel || 'Nenhuma conta'}</option>
        ${ativas.map(a => `
            <option value="${a.id}">${a.name} (${fmt(accountBalance(a.id))})</option>
        `).join('')}
    `;

    if (ativas.some(a => a.id === current)) s.value = current;
}