/**
 * ============================================================
 * FinPessoal v9.3 – A Pagar
 * ============================================================
 */

// ============================================================
// 1. CONFIGURAÇÃO GLOBAL
// ============================================================

let eF = 'todos';           // Filtro de status
let eS = '';                // Busca
let eSort = 'venc-asc';     // Ordenação: venc-asc | venc-desc | valor-asc | valor-desc | desc-az
let eView = 'junto';        // 'junto' (uma tabela só) | 'separado' (Atrasadas/Pendentes/Pagas)


// ============================================================
// 2. FUNÇÕES DE STATUS E ORDENAÇÃO
// ============================================================

/**
 * Retorna a classe e o rótulo da pill de status
 */
function expStatusPill(x) {
    const la = isLate(x);
    if (x.status === 'pago') return { cls: 'pill-pago', label: 'Pago' };
    if (isPartial(x)) return { cls: 'pill-info', label: 'Parcial' };
    if (la) return { cls: 'pill-late', label: 'Atrasado' };
    if (x.status === 'pendente') return { cls: 'pill-pend', label: 'Pendente' };
    return { cls: 'pill-gray', label: cap(x.status) };
}

/**
 * Ordena uma lista de despesas conforme o critério escolhido
 */
function sortExpenseRows(rows) {
    const arr = [...rows];
    if (eSort === 'venc-asc') arr.sort((a, b) => new Date(a.date) - new Date(b.date));
    else if (eSort === 'venc-desc') arr.sort((a, b) => new Date(b.date) - new Date(a.date));
    else if (eSort === 'valor-asc') arr.sort((a, b) => (+a.value || 0) - (+b.value || 0));
    else if (eSort === 'valor-desc') arr.sort((a, b) => (+b.value || 0) - (+a.value || 0));
    else if (eSort === 'desc-az') arr.sort((a, b) => a.desc.localeCompare(b.desc, 'pt-BR'));
    return arr;
}


// ============================================================
// 3. FUNÇÕES DE RENDERIZAÇÃO (Desktop - Tabela)
// ============================================================

/**
 * Monta o <tr> de uma despesa (formato tabela)
 */
function expenseRowHTML(x, cmap) {
    const c = cmap[x.cardId];
    const la = isLate(x);
    const parcial = isPartial(x);
    const { cls: sp, label: st } = expStatusPill(x);

    const tp2 = x.type === 'fixa' ? 'pill-info' : x.type === 'variavel' ? 'pill-gray' : 'pill-purple';
    const tt = x.type === 'fixa' ? 'Fixa' : x.type === 'variavel' ? 'Variável' : 'Parcela';

    const cb = c
        ? `<span class="exp-card-tag" style="background:${c.color}22;color:${c.color};">${c.name}</span>`
        : '<span class="exp-no-card">—</span>';

    const rowBg = x.status === 'pago' ? 'background:var(--green-light)' :
                  parcial ? 'background:var(--blue-light)' :
                  la ? 'background:var(--red-light)' : '';

    const valorCell = parcial
        ? `${fmt(x.value)}<div class="exp-partial-info">pago ${fmt(x.paidAmount)} · falta ${fmt(expRemaining(x))}</div>`
        : fmt(x.value);

    const payBtnLabel = x.status === 'pago' ? icon('check') + ' Pago' :
                        parcial ? 'Pagar restante' : 'Pagar';

    return `
        <tr style="${rowBg}">
            <td class="exp-date ${la ? 'exp-date-late' : ''}">${fmtD(x.date)}</td>
            <td class="exp-desc" title="${x.desc}">${x.desc}</td>
            <td class="exp-parcela">${x.type === 'parcelada' ? x.num + '/' + x.totalInstallments : '—'}</td>
            <td class="exp-valor">${valorCell}</td>
            <td><span class="pill ${tp2}">${tt}</span></td>
            <td class="exp-grupo">${x.grp || '—'}</td>
            <td class="exp-cartao">${cb}</td>
            <td><span class="pill ${sp}">${st}</span></td>
            <td class="exp-acoes">
                <button class="btn-sm ${x.status === 'pago' ? 'marked' : 'mark'}" onclick="toggleE('${x.id}')">${payBtnLabel}</button>
                <button class="btn-sm edit" onclick="editE('${x.id}')">${icon('pencil')}</button>
                ${x.receipt ? `<button class="btn-sm receipt" onclick="viewReceipt('${x.id}')" title="Ver recibo">${icon('paperclip')}</button>` : ''}
                <button class="btn-sm del" onclick="delE('${x.id}')">${icon('trash-2')}</button>
            </td>
        </tr>
    `;
}

/**
 * Monta o HTML da tabela de despesas
 */
function expenseTableHTML(rowsArr, cmap, emptyMsg) {
    const tbody = rowsArr.length
        ? rowsArr.map(x => expenseRowHTML(x, cmap)).join('')
        : `<tr><td colspan="9" class="empty">${emptyMsg || 'Nenhuma despesa encontrada'}</td></tr>`;

    return `
        <div class="table-wrap desktop-table">
            <table>
                <thead>
                    <tr>
                        <th>Vcto</th>
                        <th>Descrição</th>
                        <th>Parc.</th>
                        <th>Valor</th>
                        <th>Tipo</th>
                        <th>Grupo</th>
                        <th>Cartão</th>
                        <th>Status</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>${tbody}</tbody>
            </table>
        </div>
    `;
}


// ============================================================
// 4. FUNÇÕES DE RENDERIZAÇÃO (Mobile - Cards)
// ============================================================

/**
 * Monta o card de uma despesa para visualização mobile
 */
function expenseCardHTML(x, cmap) {
    const c = cmap[x.cardId];
    const la = isLate(x);
    const parcial = isPartial(x);
    const { cls: sp, label: st } = expStatusPill(x);

    const tp2 = x.type === 'fixa' ? 'pill-info' : x.type === 'variavel' ? 'pill-gray' : 'pill-purple';
    const tt = x.type === 'fixa' ? 'Fixa' : x.type === 'variavel' ? 'Variável' : 'Parcela';

    const cb = c
        ? `<span class="exp-card-tag" style="background:${c.color}22;color:${c.color};">${c.name}</span>`
        : '<span class="exp-no-card">—</span>';

    const cardBg = x.status === 'pago' ? 'card-pago' :
                   parcial ? 'card-parcial' :
                   la ? 'card-atrasado' : '';

    const valorDisplay = parcial
        ? `${fmt(x.value)}<div class="exp-partial-info">pago ${fmt(x.paidAmount)} · falta ${fmt(expRemaining(x))}</div>`
        : fmt(x.value);

    const payBtnLabel = x.status === 'pago' ? icon('check') + ' Pago' :
                        parcial ? 'Pagar restante' : 'Pagar';

    return `
        <div class="expense-card ${cardBg}">
            <div class="expense-card-header">
                <div class="expense-card-title">
                    <span class="expense-card-desc">${x.desc}</span>
                    <span class="pill ${sp}">${st}</span>
                </div>
                <div class="expense-card-value">${valorDisplay}</div>
            </div>
            <div class="expense-card-body">
                <div class="expense-card-row">
                    <span class="expense-card-label">Vencimento</span>
                    <span class="${la ? 'exp-date-late' : ''}">${fmtD(x.date)}</span>
                </div>
                <div class="expense-card-row">
                    <span class="expense-card-label">Tipo</span>
                    <span class="pill ${tp2}">${tt}</span>
                </div>
                ${x.type === 'parcelada' ? `
                    <div class="expense-card-row">
                        <span class="expense-card-label">Parcela</span>
                        <span>${x.num}/${x.totalInstallments}</span>
                    </div>
                ` : ''}
                <div class="expense-card-row">
                    <span class="expense-card-label">Grupo</span>
                    <span>${x.grp || '—'}</span>
                </div>
                <div class="expense-card-row">
                    <span class="expense-card-label">Cartão</span>
                    <span>${cb}</span>
                </div>
            </div>
            <div class="expense-card-actions">
                <button class="btn-sm ${x.status === 'pago' ? 'marked' : 'mark'}" onclick="toggleE('${x.id}')">${payBtnLabel}</button>
                <button class="btn-sm edit" onclick="editE('${x.id}')">${icon('pencil')}</button>
                ${x.receipt ? `<button class="btn-sm receipt" onclick="viewReceipt('${x.id}')" title="Ver recibo">${icon('paperclip')}</button>` : ''}
                <button class="btn-sm del" onclick="delE('${x.id}')">${icon('trash-2')}</button>
            </div>
        </div>
    `;
}

/**
 * Monta a lista de cards para visualização mobile
 */
function expenseCardList(rowsArr, cmap, emptyMsg) {
    if (!rowsArr.length) {
        return `<div class="empty">${emptyMsg || 'Nenhuma despesa encontrada'}</div>`;
    }
    return `<div class="expense-card-list">${rowsArr.map(x => expenseCardHTML(x, cmap)).join('')}</div>`;
}


// ============================================================
// 5. FUNÇÃO PRINCIPAL: RENDER PAGAR
// ============================================================

function renderPagar() {
    const cmap = Object.fromEntries(ST.cards.map(c => [c.id, c]));

    // Filtra e ordena as despesas
    let rows = mE().filter(x => {
        if (eF === 'atrasado') return isLate(x);
        if (eF !== 'todos' && x.status !== eF) return false;
        if (eS && !x.desc.toLowerCase().includes(eS.toLowerCase())) return false;
        return true;
    });
    rows = sortExpenseRows(rows);

    // Cálculos
    const tot = rows.reduce((s, x) => s + (+x.value || 0), 0);
    const pend = mE().filter(x => x.status !== 'pago').reduce((s, x) => s + expRemaining(x), 0);
    const lateC = mE().filter(isLate).length;

    // Constrói as seções (junto ou separado)
    let contentHTML;
    if (eView === 'separado') {
        const atrasadas = rows.filter(isLate);
        const pagas = rows.filter(x => x.status === 'pago');
        const pendentes = rows.filter(x => x.status !== 'pago' && !isLate(x));

        const secao = (titulo, cor, arr, emptyMsg) => `
            <div class="expense-section">
                <p class="expense-section-title" style="color:${cor};">${titulo} (${arr.length})</p>
                ${isMobile() ? expenseCardList(arr, cmap, emptyMsg) : expenseTableHTML(arr, cmap, emptyMsg)}
            </div>
        `;

        contentHTML = secao('🔴 Atrasadas', 'var(--red)', atrasadas, 'Nenhuma despesa atrasada') +
                      secao('🟡 Pendentes', 'var(--amber)', pendentes, 'Nenhuma despesa pendente') +
                      secao('🟢 Pagas', 'var(--green)', pagas, 'Nenhuma despesa paga');
    } else {
        contentHTML = isMobile()
            ? expenseCardList(rows, cmap)
            : expenseTableHTML(rows, cmap);
    }

    // Filtros rápidos
    const filterList = ['todos', ...ST.expStatuses, 'atrasado'].filter((f, i, arr) => arr.indexOf(f) === i);

    // Monta o HTML final
    document.getElementById('content').innerHTML = `
        <!-- TOOLBAR PRINCIPAL -->
        <div class="toolbar pagar-toolbar">
            <div class="filter-pills">
                ${filterList.map(f => `
                    <button class="fpill${eF === f ? ' on' : ''}" onclick="setEF('${f}')">
                        ${f === 'todos' ? 'Todos' : f === 'atrasado' ? 'Atrasado' + (lateC > 0 ? ` (${lateC})` : '') : cap(f)}
                    </button>
                `).join('')}
            </div>
            <div class="pagar-toolbar-right">
                <input class="search-box" value="${eS}" placeholder="Buscar..." oninput="eS=this.value;renderPagar()">
                <span class="pagar-pendente">Pendente: <strong>${fmt(pend)}</strong></span>
                <button class="btn btn-primary" onclick="openExpModal()">${icon('plus')} Nova Despesa</button>
            </div>
        </div>

        <!-- FILTROS SECUNDÁRIOS (Ordenação e Exibição) -->
        <div class="pagar-filters-secondary">
            <div class="form-field pagar-filter-sort">
                <label>Ordenar por</label>
                <select onchange="eSort=this.value;renderPagar()">
                    <option value="venc-asc" ${eSort === 'venc-asc' ? 'selected' : ''}>Vencimento (mais próximo)</option>
                    <option value="venc-desc" ${eSort === 'venc-desc' ? 'selected' : ''}>Vencimento (mais distante)</option>
                    <option value="valor-desc" ${eSort === 'valor-desc' ? 'selected' : ''}>Valor (maior primeiro)</option>
                    <option value="valor-asc" ${eSort === 'valor-asc' ? 'selected' : ''}>Valor (menor primeiro)</option>
                    <option value="desc-az" ${eSort === 'desc-az' ? 'selected' : ''}>Descrição (A-Z)</option>
                </select>
            </div>
            <div class="form-field pagar-filter-view">
                <label>Exibir</label>
                <select onchange="eView=this.value;renderPagar()">
                    <option value="junto" ${eView === 'junto' ? 'selected' : ''}>Tudo junto</option>
                    <option value="separado" ${eView === 'separado' ? 'selected' : ''}>Separado por status</option>
                </select>
            </div>
        </div>

        <!-- CONTEÚDO (Tabela ou Cards) -->
        ${contentHTML}

        <!-- RODAPÉ -->
        ${rows.length ? `
            <div class="pagar-footer">
                ${rows.length} item${rows.length > 1 ? 's' : ''} · Total: <strong>${fmt(tot)}</strong>
            </div>
        ` : ''}
    `;
}


// ============================================================
// 6. FUNÇÕES AUXILIARES: FILTROS
// ============================================================

/**
 * Detecta se está em dispositivo mobile (tela pequena)
 */
function isMobile() {
    return window.innerWidth <= 700;
}

function setEF(f) {
    eF = f;
    renderPagar();
}


// ============================================================
// 7. FUNÇÕES: AÇÕES (Pagar, Editar, Deletar)
// ============================================================

/**
 * Marca/desmarca uma despesa como paga
 */
function toggleE(id) {
    const x = ST.expenses.find(e => e.id === id);
    if (!x) return;

    if (x.status === 'pago') {
        x.status = 'pendente';
        x.paidAmount = 0;
        removeLinkedMovement(id);
        sv();
        render();
        notify('Pagamento desfeito — despesa voltou a pendente', 'info');
    } else {
        openPayModal(id, 'pagar');
    }
}

function delE(id) {
    confirm2('Remover esta despesa?', () => {
        ST.expenses = ST.expenses.filter(x => x.id !== id);
        removeLinkedMovement(id);
        sv();
        notify('Removida', 'err');
        render();
    });
}

function editE(id) {
    const x = ST.expenses.find(e => e.id === id);
    if (!x) return;

    _editId = id;
    document.getElementById('modal-exp-title').textContent = 'Editar Despesa';
    refreshGroupSelect();
    refreshExpStatusSelect();

    document.getElementById('exp-desc').value = x.desc || '';
    document.getElementById('exp-val').value = x.value || '';
    document.getElementById('exp-date').value = x.date || '';
    document.getElementById('exp-type').value = x.type || 'fixa';
    document.getElementById('exp-parc').value = x.totalInstallments || 1;
    document.getElementById('exp-grp').value = x.grp || ST.groups[0];
    document.getElementById('exp-card').value = x.cardId || '';
    document.getElementById('exp-status').value = x.status || 'pendente';
    document.getElementById('exp-obs').value = x.obs || '';

    toggleExpFields();
    openModal('modal-exp');
}


// ============================================================
// 8. FUNÇÕES: MODAIS
// ============================================================

function openExpModal() {
    _editId = null;
    document.getElementById('modal-exp-title').textContent = 'Nova Despesa';
    refreshGroupSelect();
    refreshExpStatusSelect();

    ['exp-desc', 'exp-obs'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('exp-val').value = '';
    document.getElementById('exp-date').value = dd();
    document.getElementById('exp-type').value = 'fixa';
    document.getElementById('exp-parc').value = 2;
    document.getElementById('exp-grp').value = ST.groups[0] || '';
    document.getElementById('exp-card').value = '';
    document.getElementById('exp-status').value = 'pendente';
    document.getElementById('exp-recorrente').value = 'nao';

    toggleExpFields();
    openModal('modal-exp');
}

/**
 * Atalho do "+" central (mobile): abre modal com tipo "Parcelada"
 */
function openDividaModal() {
    openExpModal();
    document.getElementById('modal-exp-title').textContent = 'Nova Dívida Parcelada';
    document.getElementById('exp-type').value = 'parcelada';
    toggleExpFields();
}

function toggleExpFields() {
    const t = document.getElementById('exp-type').value;
    document.getElementById('exp-parc-wrap').style.display = t === 'parcelada' ? 'flex' : 'none';
    document.getElementById('exp-recorr-wrap').style.display = t === 'fixa' ? 'flex' : 'none';
}

function refreshCardSelect() {
    const s = document.getElementById('exp-card');
    if (!s) return;
    s.innerHTML = '<option value="">Sem cartão (dinheiro/débito)</option>' +
        ST.cards.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}


// ============================================================
// 9. FUNÇÕES: SALVAR DESPESA
// ============================================================

function saveExp() {
    const desc = document.getElementById('exp-desc').value.trim();
    const val = parseFloat(document.getElementById('exp-val').value);

    if (!desc || isNaN(val) || val <= 0) {
        notify('Preencha Descrição e Valor', 'err');
        return;
    }

    const date = document.getElementById('exp-date').value;
    const type = document.getElementById('exp-type').value;
    const parc = parseInt(document.getElementById('exp-parc').value) || 1;
    const grp = document.getElementById('exp-grp').value;
    const cardId = document.getElementById('exp-card').value;
    const status = document.getElementById('exp-status').value;
    const obs = document.getElementById('exp-obs').value;
    const recorr = document.getElementById('exp-recorrente').value === 'sim';

    if (_editId) {
        const x = ST.expenses.find(e => e.id === _editId);
        if (x) {
            Object.assign(x, {
                desc,
                value: val,
                date,
                type,
                grp,
                cardId,
                status,
                obs,
                totalInstallments: parc
            });

            // Atualiza movimentações vinculadas
            ST.movements.filter(m => m.linkedId === _editId).forEach(m => {
                const wasPartial = / \(pagamento parcial\)$/.test(m.desc);
                m.desc = desc + (wasPartial ? ' (pagamento parcial)' : '');
                m.category = grp;
            });
        }
        sv();
        notify('Despesa atualizada!');
    } else {
        if (type === 'parcelada' && parc > 1) {
            const g = gid();
            for (let i = 0; i < parc; i++) {
                const d = new Date(date + 'T00:00');
                d.setMonth(d.getMonth() + i);
                ST.expenses.push({
                    id: gid(),
                    gid: g,
                    desc,
                    value: val,
                    date: d.toISOString().split('T')[0],
                    type,
                    totalInstallments: parc,
                    num: i + 1,
                    grp,
                    cardId,
                    status: 'pendente',
                    obs
                });
            }
            notify(`${parc} parcelas criadas!`, 'info');
        } else if (type === 'fixa' && recorr) {
            const g = gid();
            for (let i = 0; i < 12; i++) {
                const d = new Date(date + 'T00:00');
                d.setMonth(d.getMonth() + i);
                ST.expenses.push({
                    id: gid(),
                    gid: g,
                    desc,
                    value: val,
                    date: d.toISOString().split('T')[0],
                    type: 'fixa',
                    totalInstallments: 12,
                    num: i + 1,
                    grp,
                    cardId,
                    status: 'pendente',
                    obs
                });
            }
            notify('Despesa fixa gerada para 12 meses!', 'info');
        } else {
            ST.expenses.push({
                id: gid(),
                desc,
                value: val,
                date,
                type,
                totalInstallments: 1,
                num: 1,
                grp,
                cardId,
                status,
                obs
            });
            notify('Despesa adicionada!');
        }
        sv();
    }

    closeModal('modal-exp');
    render();
}