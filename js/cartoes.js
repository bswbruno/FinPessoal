/**
 * ============================================================
 * FinPessoal v9.3 – Cartões
 * ============================================================
 */

// ============================================================
// 1. CONFIGURAÇÃO GLOBAL
// ============================================================

let sc = '#6366f1';  // Cor selecionada para o cartão


// ============================================================
// 2. FUNÇÃO PRINCIPAL: RENDER CARTÕES
// ============================================================

function renderCartoes() {
    const html = ST.cards.length
        ? ST.cards.map(c => {
            const committed = cardCommitted(c.id);
            const available = Math.max(0, (+c.limit || 0) - committed);
            const pct = c.limit > 0 ? Math.min(100, (committed / c.limit) * 100) : 0;
            const hasCycle = !!c.fechamento;
            const invoice = hasCycle ? cardCurrentInvoice(c) : null;
            const bestDay = hasCycle ? cardBestPurchaseDay(c) : null;
            const dueStr = invoice && invoice.dueDate ? dateToStr(invoice.dueDate) : null;

            return `
                <div class="card-shell">
                    <!-- CARTÃO DE CRÉDITO VISUAL -->
                    <div class="credit-card-visual" style="background:linear-gradient(135deg,${c.color}ee,${c.color}88);">
                        <div class="credit-card-header-visual">
                            <span class="credit-card-type">CRÉDITO</span>
                            <span class="credit-card-brand-visual">${c.brand || 'Visa'}</span>
                        </div>
                        <div class="credit-card-name-visual">${c.name}</div>
                        <div class="credit-card-digits-visual">•••• •••• •••• ${c.digits || '****'}</div>
                        <div class="credit-card-progress-visual">
                            <div class="credit-card-progress-fill-visual" style="width:${pct}%;"></div>
                        </div>
                        <div class="credit-card-footer-visual">
                            <span>Limite: ${fmt(c.limit)}</span>
                            <span>${Math.round(pct)}% comprometido</span>
                        </div>
                        ${hasCycle ? `
                            <div class="credit-card-cycle-info">
                                Fecha dia ${c.fechamento} · Vence dia ${c.vencimento || '—'}
                            </div>
                        ` : ''}
                    </div>

                    <!-- INFORMAÇÕES DETALHADAS -->
                    <div class="card-details">
                        <div class="sum-row">
                            <span class="sum-label">Limite disponível</span>
                            <strong class="sum-value-available">${fmt(available)}</strong>
                        </div>
                        <div class="sum-row">
                            <span class="sum-label">Comprometido (todas parcelas)</span>
                            <strong class="sum-value-committed">${fmt(committed)}</strong>
                        </div>
                        ${hasCycle ? `
                            <div class="sum-row">
                                <span class="sum-label">Fatura atual</span>
                                <strong class="sum-value-invoice">${fmt(invoice.total)}</strong>
                            </div>
                            <div class="sum-row">
                                <span class="sum-label">Vencimento da fatura</span>
                                <span class="sum-value-due">${dueStr ? fmtD(dueStr) : '—'}</span>
                            </div>
                            <div class="sum-row">
                                <span class="sum-label">Melhor dia de compra</span>
                                <span class="sum-value-bestday">Dia ${bestDay}</span>
                            </div>
                        ` : `
                            <p class="card-hint">💡 Preencha o fechamento/vencimento pra ver a fatura atual e o melhor dia de compra.</p>
                        `}
                    </div>

                    <!-- AÇÕES DO CARTÃO -->
                    <div class="card-actions">
                        ${hasCycle ? `
                            <button class="btn-sm" onclick="showCardInvoice('${c.id}')">
                                ${icon('receipt')} Ver fatura atual
                            </button>
                        ` : '<span></span>'}
                        <div class="card-actions-buttons">
                            <button class="btn-sm edit" onclick="editC('${c.id}')">${icon('pencil')} Editar</button>
                            <button class="btn-sm del" onclick="delC('${c.id}')">${icon('trash-2')}</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('')
        : `
            <div class="empty-state-cards">
                Nenhum cartão. Clique em "+ Novo Cartão".
            </div>
        `;

    document.getElementById('content').innerHTML = `
        <div class="toolbar-cards">
            <span class="toolbar-cards-count">${ST.cards.length} cartão${ST.cards.length !== 1 ? 'ões' : ''}</span>
            <button class="btn btn-primary" onclick="openCardModal()">
                ${icon('plus')} Novo Cartão
            </button>
        </div>
        <div class="card-list">${html}</div>
    `;
}


// ============================================================
// 3. FUNÇÃO: MOSTRAR FATURA DO CARTÃO
// ============================================================

function showCardInvoice(cardId) {
    const c = ST.cards.find(x => x.id === cardId);
    if (!c) return;

    const invoice = cardCurrentInvoice(c);
    document.getElementById('card-invoice-title').textContent = 'Fatura Atual — ' + c.name;

    const dueStr = invoice.dueDate ? dateToStr(invoice.dueDate) : null;

    // Cabeçalho da fatura
    const header = `
        <div class="invoice-summary">
            <div class="invoice-summary-item">
                <div class="invoice-summary-label">Total da fatura</div>
                <div class="invoice-summary-value">${fmt(invoice.total)}</div>
            </div>
            <div class="invoice-summary-item">
                <div class="invoice-summary-label">Pendente</div>
                <div class="invoice-summary-value invoice-pending">${fmt(invoice.pending)}</div>
            </div>
            <div class="invoice-summary-item">
                <div class="invoice-summary-label">Vencimento</div>
                <div class="invoice-summary-value">${dueStr ? fmtD(dueStr) : '—'}</div>
            </div>
        </div>
    `;

    // Itens da fatura
    const rows = invoice.items.length
        ? invoice.items.map(x => `
            <tr>
                <td>${fmtD(x.date)}</td>
                <td>${x.desc}</td>
                <td class="invoice-item-value">${fmt(x.value)}</td>
                <td>
                    <span class="pill ${x.status === 'pago' ? 'pill-pago' : isLate(x) ? 'pill-late' : 'pill-pend'}">
                        ${x.status === 'pago' ? 'Pago' : isLate(x) ? 'Atrasado' : 'Pendente'}
                    </span>
                </td>
            </tr>
        `).join('')
        : `
            <tr>
                <td colspan="4" class="empty-invoice">Nenhum lançamento nesse ciclo ainda.</td>
            </tr>
        `;

    document.getElementById('card-invoice-body').innerHTML = header + `
        <div class="table-wrap">
            <table>
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Descrição</th>
                        <th>Valor</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    `;

    openModal('modal-card-invoice');
}


// ============================================================
// 4. FUNÇÕES: CRUD (CRIAR, EDITAR, DELETAR)
// ============================================================

function openCardModal() {
    _editId = null;
    document.getElementById('modal-card-title').textContent = 'Novo Cartão';

    ['card-name', 'card-digits', 'card-fech', 'card-venc'].forEach(id =>
        document.getElementById(id).value = ''
    );
    document.getElementById('card-limit').value = '';
    document.getElementById('card-brand').value = 'Visa';
    buildSwatches('#6366f1');
    updateCardPreview();
    openModal('modal-card');
}

function editC(id) {
    const c = ST.cards.find(x => x.id === id);
    if (!c) return;

    _editId = id;
    document.getElementById('modal-card-title').textContent = 'Editar Cartão';
    document.getElementById('card-name').value = c.name || '';
    document.getElementById('card-digits').value = c.digits || '';
    document.getElementById('card-limit').value = c.limit || '';
    document.getElementById('card-brand').value = c.brand || 'Visa';
    document.getElementById('card-fech').value = c.fechamento || '';
    document.getElementById('card-venc').value = c.vencimento || '';
    buildSwatches(c.color || '#6366f1');
    updateCardPreview();
    openModal('modal-card');
}

function delC(id) {
    confirm2('Remover este cartão?', () => {
        ST.cards = ST.cards.filter(c => c.id !== id);
        sv();
        notify('Cartão removido', 'err');
        render();
    });
}


// ============================================================
// 5. FUNÇÕES: CORES E PREVIEW
// ============================================================

function buildSwatches(sel) {
    sc = sel;
    const w = document.getElementById('color-swatches');
    const CCOLORS = [
        '#6366f1', '#ef4444', '#f59e0b', '#10b981',
        '#3b82f6', '#8b5cf6', '#ec4899', '#0ea5e9',
        '#22c55e', '#334155'
    ];

    w.innerHTML = CCOLORS.map(c => `
        <div class="color-swatch" onclick="selectColor('${c}')" style="background:${c};border-color:${c === sc ? '#1a1d23' : 'transparent'};"></div>
    `).join('') + `
        <input class="color-picker" type="color" value="${sel}" oninput="selectColor(this.value)">
    `;
}

function selectColor(c) {
    sc = c;
    buildSwatches(c);
    document.getElementById('card-preview').style.background = `linear-gradient(135deg,${c}ee,${c}88)`;
}

function updateCardPreview() {
    document.getElementById('prev-name').textContent = document.getElementById('card-name').value || 'Nome do Cartão';
    document.getElementById('prev-digits').textContent = '•••• •••• •••• ' + (document.getElementById('card-digits').value || '0000');
    document.getElementById('prev-limit').textContent = 'Limite: ' + fmt(document.getElementById('card-limit').value);
    document.getElementById('prev-brand').textContent = document.getElementById('card-brand').value || 'Visa';
}


// ============================================================
// 6. FUNÇÃO: SALVAR CARTÃO
// ============================================================

function saveCard() {
    const name = document.getElementById('card-name').value.trim();
    const limit = parseFloat(document.getElementById('card-limit').value);

    if (!name || isNaN(limit) || limit <= 0) {
        notify('Preencha Nome e Limite', 'err');
        return;
    }

    const obj = {
        name,
        digits: document.getElementById('card-digits').value,
        limit,
        brand: document.getElementById('card-brand').value,
        color: sc,
        fechamento: document.getElementById('card-fech').value,
        vencimento: document.getElementById('card-venc').value
    };

    if (_editId) {
        Object.assign(ST.cards.find(c => c.id === _editId), obj);
        notify('Cartão atualizado!');
    } else {
        ST.cards.push({ ...obj, id: gid() });
        notify('Cartão adicionado!');
    }

    sv();
    closeModal('modal-card');
    render();
    refreshCardSelect();
}