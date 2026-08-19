/**
 * ============================================================
 * FinPessoal v9.3 – A Receber
 * ============================================================
 */

// ============================================================
// 1. CONFIGURAÇÃO GLOBAL
// ============================================================

let iF = 'todos';           // Filtro de status
let iS = '';                // Busca
let iSort = 'venc-asc';     // Ordenação: venc-asc | venc-desc | valor-asc | valor-desc | desc-az
let iView = 'junto';        // 'junto' | 'separado'


// ============================================================
// 2. FUNÇÕES DE STATUS E ORDENAÇÃO
// ============================================================

/**
 * Retorna a classe e o rótulo da pill de status da receita
 */
function incStatusPill(x) {
    if (x.status === 'recebido') return { cls: 'pill-pago', label: 'Recebido' };
    if (x.status === 'pendente') return { cls: 'pill-pend', label: 'Pendente' };
    return { cls: 'pill-gray', label: cap(x.status) };
}

/**
 * Ordena uma lista de receitas conforme o critério escolhido
 */
function sortIncomeRows(rows) {
    const arr = [...rows];
    if (iSort === 'venc-asc') arr.sort((a, b) => new Date(a.date) - new Date(b.date));
    else if (iSort === 'venc-desc') arr.sort((a, b) => new Date(b.date) - new Date(a.date));
    else if (iSort === 'valor-asc') arr.sort((a, b) => (+a.value || 0) - (+b.value || 0));
    else if (iSort === 'valor-desc') arr.sort((a, b) => (+b.value || 0) - (+a.value || 0));
    else if (iSort === 'desc-az') arr.sort((a, b) => a.desc.localeCompare(b.desc, 'pt-BR'));
    return arr;
}


// ============================================================
// 3. FUNÇÕES DE RENDERIZAÇÃO (Desktop - Tabela)
// ============================================================

/**
 * Monta o <tr> de uma receita (formato tabela)
 */
function incomeRowHTML(x) {
    const { cls: sp, label: st } = incStatusPill(x);
    const la = isLate(x);
    const rowBg = x.status === 'recebido' ? 'background:var(--green-light)' :
                  la ? 'background:var(--red-light)' : '';

    const parcelaInfo = x.rec === 'parcelada' ? x.num + '/' + x.totalInstallments :
                        x.rec === 'mensal' ? 'Mensal' : '—';

    return `
        <tr style="${rowBg}">
            <td class="inc-date ${la ? 'inc-date-late' : ''}">${fmtD(x.date)}</td>
            <td class="inc-desc" title="${x.desc}">${x.desc}</td>
            <td class="inc-origem">${x.src || '—'}</td>
            <td><span class="pill pill-green">${x.type || 'Outros'}</span></td>
            <td class="inc-parcela">${parcelaInfo}</td>
            <td class="inc-valor">${fmt(x.value)}</td>
            <td><span class="pill ${sp}">${st}</span></td>
            <td class="inc-acoes">
                <button class="btn-sm ${x.status === 'recebido' ? 'marked' : 'mark'}" onclick="toggleI('${x.id}')">
                    ${x.status === 'recebido' ? icon('check') : 'Receber'}
                </button>
                <button class="btn-sm edit" onclick="editI('${x.id}')">${icon('pencil')}</button>
                <button class="btn-sm del" onclick="delI('${x.id}')">${icon('trash-2')}</button>
            </td>
        </tr>
    `;
}

/**
 * Monta o HTML da tabela de receitas
 */
function incomeTableHTML(rowsArr, emptyMsg) {
    const tbody = rowsArr.length
        ? rowsArr.map(incomeRowHTML).join('')
        : `<tr><td colspan="8" class="empty">${emptyMsg || 'Nenhuma receita encontrada'}</td></tr>`;

    return `
        <div class="table-wrap desktop-table">
            <table>
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Descrição</th>
                        <th>Origem</th>
                        <th>Tipo</th>
                        <th>Parc.</th>
                        <th>Valor</th>
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
 * Monta o card de uma receita para visualização mobile
 */
function incomeCardHTML(x) {
    const { cls: sp, label: st } = incStatusPill(x);
    const la = isLate(x);

    const parcelaInfo = x.rec === 'parcelada' ? x.num + '/' + x.totalInstallments :
                        x.rec === 'mensal' ? 'Mensal' : '—';

    const cardBg = x.status === 'recebido' ? 'card-recebido' :
                   la ? 'card-atrasado' : '';

    return `
        <div class="income-card ${cardBg}">
            <div class="income-card-header">
                <div class="income-card-title">
                    <span class="income-card-desc">${x.desc}</span>
                    <span class="pill ${sp}">${st}</span>
                </div>
                <div class="income-card-value">${fmt(x.value)}</div>
            </div>
            <div class="income-card-body">
                <div class="income-card-row">
                    <span class="income-card-label">Data</span>
                    <span class="${la ? 'inc-date-late' : ''}">${fmtD(x.date)}</span>
                </div>
                <div class="income-card-row">
                    <span class="income-card-label">Origem</span>
                    <span>${x.src || '—'}</span>
                </div>
                <div class="income-card-row">
                    <span class="income-card-label">Tipo</span>
                    <span class="pill pill-green">${x.type || 'Outros'}</span>
                </div>
                ${x.rec !== 'unico' ? `
                    <div class="income-card-row">
                        <span class="income-card-label">Parcela</span>
                        <span>${parcelaInfo}</span>
                    </div>
                ` : ''}
            </div>
            <div class="income-card-actions">
                <button class="btn-sm ${x.status === 'recebido' ? 'marked' : 'mark'}" onclick="toggleI('${x.id}')">
                    ${x.status === 'recebido' ? icon('check') : 'Receber'}
                </button>
                <button class="btn-sm edit" onclick="editI('${x.id}')">${icon('pencil')}</button>
                <button class="btn-sm del" onclick="delI('${x.id}')">${icon('trash-2')}</button>
            </div>
        </div>
    `;
}

/**
 * Monta a lista de cards para visualização mobile
 */
function incomeCardList(rowsArr, emptyMsg) {
    if (!rowsArr.length) {
        return `<div class="empty">${emptyMsg || 'Nenhuma receita encontrada'}</div>`;
    }
    return `<div class="income-card-list">${rowsArr.map(x => incomeCardHTML(x)).join('')}</div>`;
}


// ============================================================
// 5. FUNÇÃO PRINCIPAL: RENDER RECEBER
// ============================================================

function renderReceber() {
    // Filtra e ordena as receitas
    let rows = mI().filter(x => {
        if (iF !== 'todos' && x.status !== iF) return false;
        if (iS && !x.desc.toLowerCase().includes(iS.toLowerCase()) &&
            !(x.src || '').toLowerCase().includes(iS.toLowerCase())) return false;
        return true;
    });
    rows = sortIncomeRows(rows);

    // Cálculos
    const tot = mI().reduce((s, x) => s + (+x.value || 0), 0);
    const rc = mI().filter(x => x.status === 'recebido').reduce((s, x) => s + (+x.value || 0), 0);

    // Constrói as seções (junto ou separado)
    let contentHTML;
    if (iView === 'separado') {
        const atrasadas = rows.filter(isLate);
        const recebidas = rows.filter(x => x.status === 'recebido');
        const pendentes = rows.filter(x => x.status !== 'recebido' && !isLate(x));

        const secao = (titulo, arr, emptyMsg) => `
            <div class="income-section">
                <p class="income-section-title">${titulo} (${arr.length})</p>
                ${isMobileReceber() ? incomeCardList(arr, emptyMsg) : incomeTableHTML(arr, emptyMsg)}
            </div>
        `;

        contentHTML = secao('🔴 Atrasadas', atrasadas, 'Nenhuma receita atrasada') +
                      secao('🟡 Pendentes', pendentes, 'Nenhuma receita pendente') +
                      secao('🟢 Recebidas', recebidas, 'Nenhuma receita recebida');
    } else {
        contentHTML = isMobileReceber()
            ? incomeCardList(rows)
            : incomeTableHTML(rows);
    }

    // Filtros rápidos
    const filterList = ['todos', ...ST.incStatuses].filter((f, i, arr) => arr.indexOf(f) === i);

    // Monta o HTML final
    document.getElementById('content').innerHTML = `
        <!-- TOOLBAR PRINCIPAL -->
        <div class="toolbar receber-toolbar">
            <div class="filter-pills">
                ${filterList.map(f => `
                    <button class="fpill${iF === f ? ' on' : ''}" onclick="setIF('${f}')">
                        ${f === 'todos' ? 'Todos' : cap(f)}
                    </button>
                `).join('')}
            </div>
            <div class="receber-toolbar-right">
                <span class="receber-status">Recebido: <strong>${fmt(rc)}</strong> / ${fmt(tot)}</span>
                <input class="search-box" value="${iS}" placeholder="Buscar..." oninput="iS=this.value;renderReceber()">
                <button class="btn btn-success" onclick="openIncModal()">${icon('plus')} Nova Receita</button>
            </div>
        </div>

        <!-- FILTROS SECUNDÁRIOS (Ordenação e Exibição) -->
        <div class="receber-filters-secondary">
            <div class="form-field receber-filter-sort">
                <label>Ordenar por</label>
                <select onchange="iSort=this.value;renderReceber()">
                    <option value="venc-asc" ${iSort === 'venc-asc' ? 'selected' : ''}>Vencimento (mais próximo)</option>
                    <option value="venc-desc" ${iSort === 'venc-desc' ? 'selected' : ''}>Vencimento (mais distante)</option>
                    <option value="valor-desc" ${iSort === 'valor-desc' ? 'selected' : ''}>Valor (maior primeiro)</option>
                    <option value="valor-asc" ${iSort === 'valor-asc' ? 'selected' : ''}>Valor (menor primeiro)</option>
                    <option value="desc-az" ${iSort === 'desc-az' ? 'selected' : ''}>Descrição (A-Z)</option>
                </select>
            </div>
            <div class="form-field receber-filter-view">
                <label>Exibir</label>
                <select onchange="iView=this.value;renderReceber()">
                    <option value="junto" ${iView === 'junto' ? 'selected' : ''}>Tudo junto</option>
                    <option value="separado" ${iView === 'separado' ? 'selected' : ''}>Separado por status</option>
                </select>
            </div>
        </div>

        <!-- CONTEÚDO (Tabela ou Cards) -->
        ${contentHTML}

        <!-- RODAPÉ -->
        ${rows.length ? `
            <div class="receber-footer">
                ${rows.length} item${rows.length > 1 ? 's' : ''} · Total: <strong>${fmt(rows.reduce((s, x) => s + (+x.value || 0), 0))}</strong>
            </div>
        ` : ''}
    `;
}


// ============================================================
// 6. FUNÇÕES AUXILIARES
// ============================================================

/**
 * Detecta se está em dispositivo mobile (tela pequena)
 */
function isMobileReceber() {
    return window.innerWidth <= 700;
}

function setIF(f) {
    iF = f;
    renderReceber();
}


// ============================================================
// 7. FUNÇÕES: AÇÕES (Receber, Editar, Deletar)
// ============================================================

/**
 * Marca/desmarca uma receita como recebida
 */
function toggleI(id) {
    const x = ST.incomes.find(i => i.id === id);
    if (!x) return;

    if (x.status === 'recebido') {
        x.status = 'pendente';
        removeLinkedMovement(id);
        sv();
        render();
        notify('Recebimento desfeito — receita voltou a pendente', 'info');
    } else {
        openReceiveModal(id);
    }
}

function delI(id) {
    confirm2('Remover esta receita?', () => {
        ST.incomes = ST.incomes.filter(x => x.id !== id);
        removeLinkedMovement(id);
        sv();
        notify('Removida', 'err');
        render();
    });
}

function editI(id) {
    const x = ST.incomes.find(i => i.id === id);
    if (!x) return;

    _editId = id;
    document.getElementById('modal-inc-title').textContent = 'Editar Receita';
    refreshIncStatusSelect();

    document.getElementById('inc-desc').value = x.desc || '';
    document.getElementById('inc-src').value = x.src || '';
    document.getElementById('inc-val').value = x.value || '';
    document.getElementById('inc-type').value = x.type || 'Salário';
    document.getElementById('inc-rec').value = x.rec || 'unico';
    document.getElementById('inc-parc').value = x.totalInstallments || 2;
    document.getElementById('inc-date').value = x.date || '';
    document.getElementById('inc-status').value = x.status || 'pendente';
    document.getElementById('inc-obs').value = x.obs || '';

    toggleIncFields();
    openModal('modal-inc');
}


// ============================================================
// 8. FUNÇÕES: MODAIS
// ============================================================

function openIncModal() {
    _editId = null;
    document.getElementById('modal-inc-title').textContent = 'Nova Receita';
    refreshIncStatusSelect();

    ['inc-desc', 'inc-src', 'inc-obs'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('inc-val').value = '';
    document.getElementById('inc-date').value = dd();
    document.getElementById('inc-type').value = 'Salário';
    document.getElementById('inc-rec').value = 'unico';
    document.getElementById('inc-parc').value = 2;
    document.getElementById('inc-status').value = 'pendente';

    toggleIncFields();
    openModal('modal-inc');
}

function toggleIncFields() {
    document.getElementById('inc-parc-wrap').style.display =
        document.getElementById('inc-rec').value === 'parcelada' ? 'flex' : 'none';
}


// ============================================================
// 9. FUNÇÕES: SALVAR RECEITA
// ============================================================

function saveInc() {
    const desc = document.getElementById('inc-desc').value.trim();
    const val = parseFloat(document.getElementById('inc-val').value);

    if (!desc || isNaN(val) || val <= 0) {
        notify('Preencha Descrição e Valor', 'err');
        return;
    }

    const src = document.getElementById('inc-src').value;
    const date = document.getElementById('inc-date').value;
    const type = document.getElementById('inc-type').value;
    const rec = document.getElementById('inc-rec').value;
    const parc = parseInt(document.getElementById('inc-parc').value) || 1;
    const status = document.getElementById('inc-status').value;
    const obs = document.getElementById('inc-obs').value;

    if (_editId) {
        const x = ST.incomes.find(i => i.id === _editId);
        if (x) {
            Object.assign(x, { desc, src, value: val, date, type, rec, status, obs, totalInstallments: parc });

            // Atualiza movimentação vinculada
            const linkedMov = ST.movements.find(m => m.linkedId === _editId);
            if (linkedMov) {
                linkedMov.desc = desc;
                linkedMov.value = val;
                linkedMov.date = date;
                linkedMov.category = type;
            }
        }
        sv();
        notify('Receita atualizada!');
    } else {
        const cnt = rec === 'mensal' ? 12 : rec === 'parcelada' ? parc : 1;

        if (cnt > 1) {
            const g = gid();
            for (let i = 0; i < cnt; i++) {
                const d = new Date(date + 'T00:00');
                d.setMonth(d.getMonth() + i);
                ST.incomes.push({
                    id: gid(),
                    gid: g,
                    desc,
                    src,
                    value: val,
                    date: d.toISOString().split('T')[0],
                    type,
                    rec,
                    totalInstallments: cnt,
                    num: i + 1,
                    status: 'pendente',
                    obs
                });
            }
            notify(`${cnt} lançamentos criados!`, 'info');
        } else {
            ST.incomes.push({
                id: gid(),
                desc,
                src,
                value: val,
                date,
                type,
                rec,
                totalInstallments: 1,
                num: 1,
                status,
                obs
            });
            notify('Receita adicionada!');
        }
        sv();
    }

    closeModal('modal-inc');
    render();
}