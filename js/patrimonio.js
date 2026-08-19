/**
 * 
 * Lembrete importante: este app NÃO é um banco digital, é um controle
 * financeiro pessoal. "Guardar dinheiro" aqui não move dinheiro de verdade
 * entre contas — só ANOTA que uma parte do saldo da sua conta bancária
 * (real, no seu banco de verdade) está reservada para um objetivo. Por
 * isso, ao vincular uma conta bancária a um aporte/retirada, o saldo dessa
 * conta no FinPessoal é ajustado — pra continuar batendo com a realidade.
 * ============================================================
 */

// ============================================================
// 1. CONFIGURAÇÃO GLOBAL
// ============================================================

let scObj = '#8b5cf6'; // cor selecionada no formulário de objetivo
let _objEntryTarget = null; // {objectiveId, type}


// ============================================================
// 2. FUNÇÃO PRINCIPAL: RENDER PATRIMÔNIO
// ============================================================

function renderPatrimonio() {
    const total = totalPatrimonio();

    const html = ST.objectives.length
        ? ST.objectives.map(o => {
            const guardado = objectiveBalance(o.id);
            const meta = +o.targetValue || 0;
            const pct = meta > 0 ? Math.min(100, (guardado / meta) * 100) : 0;
            const done = meta > 0 && guardado >= meta;

            return `
                <div class="patrimonio-card">
                    <!-- Cabeçalho do card -->
                    <div class="patrimonio-card-header">
                        <div class="patrimonio-card-info">
                            <div class="patrimonio-card-name">${o.name}</div>
                            ${meta > 0
                                ? `<div class="patrimonio-card-meta">Meta: ${fmt(meta)}</div>`
                                : `<div class="patrimonio-card-no-meta">Sem meta definida</div>`
                            }
                        </div>
                        <div class="patrimonio-card-color" style="background:${o.color};"></div>
                    </div>

                    <!-- Valor guardado -->
                    <div class="patrimonio-card-value" style="color:${o.color};">${fmt(guardado)}</div>

                    <!-- Barra de progresso -->
                    ${meta > 0 ? `
                        <div class="progress patrimonio-progress">
                            <div class="progress-fill" style="background:${done ? 'var(--green)' : o.color};width:${pct}%;"></div>
                        </div>
                        <div class="patrimonio-card-progress-label">
                            ${done
                                ? icon('check') + ' Meta atingida!'
                                : pct.toFixed(0) + '% da meta'
                            }
                        </div>
                    ` : `
                        <div class="patrimonio-card-no-progress"></div>
                    `}

                    <!-- Ações -->
                    <div class="patrimonio-card-actions">
                        <button class="btn-sm mark" onclick="openObjEntryModal('${o.id}','aporte')">
                            ${icon('plus')} Guardar
                        </button>
                        <button class="btn-sm" onclick="openObjEntryModal('${o.id}','retirada')">
                            ${icon('minus')} Retirar
                        </button>
                        <button class="btn-sm" onclick="showObjHistory('${o.id}')" title="Histórico">
                            ${icon('scroll-text')}
                        </button>
                        <button class="btn-sm edit" onclick="editObj('${o.id}')">
                            ${icon('pencil')}
                        </button>
                        <button class="btn-sm del" onclick="delObj('${o.id}')">
                            ${icon('trash-2')}
                        </button>
                    </div>
                </div>
            `;
        }).join('')
        : `
            <div class="empty-state-patrimonio">
                Nenhum objetivo cadastrado. Clique em "+ Novo Objetivo" pra começar (ex: Reserva de Emergência, Viagem, Comprar carro...).
            </div>
        `;

    document.getElementById('content').innerHTML = `
        <!-- KPI -->
        <div class="kpi-grid patrimonio-kpi-grid">
            <div class="kpi kpi-purple">
                <div class="kpi-label">Patrimônio Total Guardado</div>
                <div class="kpi-value">${fmt(total)}</div>
                <div class="kpi-sub">${ST.objectives.length} objetivo${ST.objectives.length !== 1 ? 's' : ''}</div>
            </div>
        </div>

        <!-- Dica -->
        <p class="patrimonio-hint">💡 Isso é controle, não um banco de verdade: guardar/retirar aqui só ajusta o saldo da conta vinculada (se você escolher uma), pra manter tudo fiel à realidade do seu banco.</p>

        <!-- Toolbar -->
        <div class="toolbar patrimonio-toolbar">
            <span class="patrimonio-count">${ST.objectives.length} objetivo${ST.objectives.length !== 1 ? 's' : ''}</span>
            <button class="btn btn-primary" onclick="openObjModal()">${icon('plus')} Novo Objetivo</button>
        </div>

        <!-- Lista de cards -->
        <div class="patrimonio-card-list">${html}</div>
    `;
}


// ============================================================
// 3. FUNÇÕES: CRUD (CRIAR, EDITAR, DELETAR)
// ============================================================

function openObjModal() {
    _editId = null;
    document.getElementById('modal-obj-title').textContent = 'Novo Objetivo';
    document.getElementById('obj-name').value = '';
    document.getElementById('obj-target').value = '';
    buildObjSwatches('#8b5cf6');
    openModal('modal-obj');
}

function editObj(id) {
    const o = ST.objectives.find(x => x.id === id);
    if (!o) return;

    _editId = id;
    document.getElementById('modal-obj-title').textContent = 'Editar Objetivo';
    document.getElementById('obj-name').value = o.name || '';
    document.getElementById('obj-target').value = o.targetValue || '';
    buildObjSwatches(o.color || '#8b5cf6');
    openModal('modal-obj');
}

function delObj(id) {
    confirm2('Remover este objetivo? O histórico de aportes/retiradas dele também será apagado.', () => {
        ST.objectives = ST.objectives.filter(o => o.id !== id);
        ST.objectiveEntries = ST.objectiveEntries.filter(e => e.objectiveId !== id);
        sv();
        notify('Objetivo removido', 'err');
        render();
    });
}

function saveObj() {
    const name = document.getElementById('obj-name').value.trim();
    const targetValue = parseFloat(document.getElementById('obj-target').value) || 0;

    if (!name) {
        notify('Preencha o nome do objetivo', 'err');
        return;
    }

    if (_editId) {
        Object.assign(ST.objectives.find(o => o.id === _editId), { name, targetValue, color: scObj });
        notify('Objetivo atualizado!');
    } else {
        ST.objectives.push({
            id: gid(),
            name,
            targetValue,
            color: scObj,
            createdAt: new Date().toISOString()
        });
        notify('Objetivo criado!');
    }

    sv();
    closeModal('modal-obj');
    render();
}


// ============================================================
// 4. FUNÇÕES: CORES E SWATCHES
// ============================================================

function buildObjSwatches(sel) {
    scObj = sel;
    const w = document.getElementById('obj-color-swatches');
    if (!w) return;

    const CCOLORS = [
        '#8b5cf6', '#6366f1', '#ef4444', '#f59e0b', '#10b981',
        '#3b82f6', '#ec4899', '#0ea5e9', '#22c55e', '#334155'
    ];

    w.innerHTML = CCOLORS.map(c => `
        <div class="color-swatch" onclick="buildObjSwatches('${c}')" style="background:${c};border-color:${c === scObj ? 'var(--text)' : 'transparent'};"></div>
    `).join('') + `
        <input class="color-picker" type="color" value="${sel}" oninput="buildObjSwatches(this.value)">
    `;
}


// ============================================================
// 5. FUNÇÕES: APORTE E RETIRADA
// ============================================================

function openObjEntryModal(objectiveId, type) {
    const o = ST.objectives.find(x => x.id === objectiveId);
    if (!o) return;

    _objEntryTarget = { objectiveId, type };
    document.getElementById('modal-obj-entry-title').textContent = (type === 'aporte' ? 'Guardar dinheiro — ' : 'Retirar dinheiro — ') + o.name;
    document.getElementById('obj-entry-value').value = '';
    document.getElementById('obj-entry-date').value = dd();
    document.getElementById('obj-entry-desc').value = '';
    refreshAccountSelect('obj-entry-account', type === 'aporte' ? 'Não vincular a nenhuma conta' : 'Não vincular a nenhuma conta');
    document.getElementById('obj-entry-account-label').textContent = type === 'aporte' ? 'De qual conta saiu o dinheiro? (opcional)' : 'Para qual conta volta o dinheiro? (opcional)';
    openModal('modal-obj-entry');
}

function saveObjEntry() {
    if (!_objEntryTarget) return;

    const { objectiveId, type } = _objEntryTarget;
    const value = parseFloat(document.getElementById('obj-entry-value').value);
    const date = document.getElementById('obj-entry-date').value;
    const desc = document.getElementById('obj-entry-desc').value.trim();
    const accountId = document.getElementById('obj-entry-account').value;

    if (isNaN(value) || value <= 0) {
        notify('Informe um valor válido', 'err');
        return;
    }

    if (type === 'retirada' && value > objectiveBalance(objectiveId)) {
        notify('Valor maior que o disponível nesse objetivo', 'err');
        return;
    }

    const entry = {
        id: gid(),
        objectiveId,
        date,
        desc: desc || (type === 'aporte' ? 'Aporte' : 'Retirada'),
        value,
        type,
        accountId: accountId || null
    };

    ST.objectiveEntries.push(entry);

    // Se uma conta foi vinculada, ajusta o saldo dela
    if (accountId) {
        const o = ST.objectives.find(x => x.id === objectiveId);
        addMovement({
            date,
            desc: `${type === 'aporte' ? 'Guardado p/' : 'Retirado de'} "${o.name}"`,
            accountId,
            category: 'Patrimônio',
            value,
            type: type === 'aporte' ? 'saida' : 'entrada',
            linkedId: entry.id
        });
    }

    sv();
    closeModal('modal-obj-entry');
    render();
    notify(type === 'aporte' ? 'Guardado com sucesso!' : 'Retirada registrada!');
    _objEntryTarget = null;
}


// ============================================================
// 6. FUNÇÕES: HISTÓRICO
// ============================================================

function showObjHistory(objectiveId) {
    const o = ST.objectives.find(x => x.id === objectiveId);
    if (!o) return;

    const entries = ST.objectiveEntries
        .filter(e => e.objectiveId === objectiveId)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    document.getElementById('obj-history-title').textContent = 'Histórico — ' + o.name;

    document.getElementById('obj-history-body').innerHTML = entries.length
        ? `
            <div class="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Descrição</th>
                            <th>Tipo</th>
                            <th>Valor</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${entries.map(e => `
                            <tr>
                                <td>${fmtD(e.date)}</td>
                                <td>${e.desc}</td>
                                <td>
                                    <span class="pill ${e.type === 'aporte' ? 'pill-pago' : 'pill-late'}">
                                        ${e.type === 'aporte' ? 'Guardado' : 'Retirado'}
                                    </span>
                                </td>
                                <td class="patrimonio-history-value ${e.type === 'aporte' ? 'history-aporte' : 'history-retirada'}">
                                    ${e.type === 'aporte' ? '+' : '-'}${fmt(e.value)}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `
        : `
            <div class="empty-state-patrimonio empty-history">
                Nenhum aporte ou retirada ainda.
            </div>
        `;

    openModal('modal-obj-history');
}