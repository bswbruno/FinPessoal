/**
 * ============================================================
 * FinPessoal v9.3 – Dashboard
 * ============================================================
 */

// ============================================================
// 1. CONFIGURAÇÃO E ESTADO GLOBAL
// ============================================================

let dashPeriodo = 'mes';
let _dashPrefsApplied = false;
let dashFiltAccount = '';
let dashFiltCard = '';
let dashFiltGrupo = '';
let dashFiltStatus = '';
let dashDismissedAlerts = new Set();


// ============================================================
// 2. FUNÇÕES DE PERÍODO
// ============================================================

function dashPeriodExpenses() {
    if (dashPeriodo === 'ano') {
        return ST.expenses.filter(x => {
            const d = toDate(x.date);
            return d && d.getFullYear() === ST.vy;
        });
    }
    if (dashPeriodo === 'tudo') {
        return ST.expenses.slice();
    }
    return mE();
}

function dashPeriodIncomes() {
    if (dashPeriodo === 'ano') {
        return ST.incomes.filter(x => {
            const d = toDate(x.date);
            return d && d.getFullYear() === ST.vy;
        });
    }
    if (dashPeriodo === 'tudo') {
        return ST.incomes.slice();
    }
    return mI();
}


// ============================================================
// 3. FUNÇÕES DE FILTRO
// ============================================================

function dashFilteredExpenses() {
    let arr = dashPeriodExpenses();

    if (dashFiltCard) {
        arr = arr.filter(x => x.cardId === dashFiltCard);
    }
    if (dashFiltGrupo) {
        arr = arr.filter(x => x.grp === dashFiltGrupo);
    }
    if (dashFiltStatus) {
        arr = arr.filter(x => dashFiltStatus === 'atrasado' ? isLate(x) : x.status === dashFiltStatus);
    }
    if (dashFiltAccount) {
        const linkedIds = new Set(
            ST.movements
                .filter(m => m.accountId === dashFiltAccount && m.linkedId)
                .map(m => m.linkedId)
        );
        arr = arr.filter(x => linkedIds.has(x.id));
    }

    return arr;
}

function dashFilteredIncomes() {
    let arr = dashPeriodIncomes();

    if (dashFiltStatus) {
        arr = arr.filter(x => x.status === dashFiltStatus);
    }

    return arr;
}


// ============================================================
// 4. CONTROLE DE FILTROS
// ============================================================

function setDashFilter(field, value) {
    if (field === 'periodo') {
        dashPeriodo = value;
    } else if (field === 'conta') {
        dashFiltAccount = value;
    } else if (field === 'cartao') {
        dashFiltCard = value;
    } else if (field === 'grupo') {
        dashFiltGrupo = value;
    } else if (field === 'status') {
        dashFiltStatus = value;
    }

    renderDashboard();
}

function clearDashFilters() {
    dashPeriodo = 'mes';
    dashFiltAccount = '';
    dashFiltCard = '';
    dashFiltGrupo = '';
    dashFiltStatus = '';
    renderDashboard();
}


// ============================================================
// 5. CONTROLE DE SEÇÕES (COLLAPSE/EXPAND)
// ============================================================

function sectionIsCollapsed(key) {
    return ST.settings.dashboardCollapsed && ST.settings.dashboardCollapsed[key];
}

function toggleDashboardSection(key) {
    if (!ST.settings.dashboardCollapsed || typeof ST.settings.dashboardCollapsed !== 'object') {
        ST.settings.dashboardCollapsed = {};
    }

    ST.settings.dashboardCollapsed[key] = !ST.settings.dashboardCollapsed[key];
    sv();
    renderDashboard();
}


// ============================================================
// 6. ALERTAS
// ============================================================

function dismissAlert(key) {
    dashDismissedAlerts.add(key);
    renderDashboard();
}


// ============================================================
// 7. FUNÇÕES DE RENDERIZAÇÃO DE SEÇÕES
// ============================================================

function renderDashboardSection(id, title, subtitle, body, style = '') {
    const collapsed = sectionIsCollapsed(id);

    return `<div class="chart-card" style="${style}" data-dashboard-section="${id}">
        <div class="chart-card-header">
            <div>
                <div class="chart-title">
                    ${title}
                    ${subtitle ? ` <span class="chart-subtitle">${subtitle}</span>` : ''}
                </div>
            </div>
            <button class="chart-card-toggle" onclick="toggleDashboardSection('${id}')">
                ${icon(collapsed ? 'chevron-down' : 'chevron-up', 'ic-inline')}
                ${collapsed ? 'Expandir' : 'Ocultar'}
            </button>
        </div>
        <div class="chart-card-body${collapsed ? ' collapsed' : ''}">
            ${body}
        </div>
    </div>`;
}


// ============================================================
// 8. FUNÇÃO PRINCIPAL: RENDER DASHBOARD
// ============================================================

function renderDashboard() {
    // 8.1 APLICA O PERÍODO PADRÃO
    if (!_dashPrefsApplied) {
        dashPeriodo = ST.settings.dashDefaultPeriodo || 'mes';
        _dashPrefsApplied = true;
    }

    // 8.2 DADOS REAIS
    const e = mE();
    const i = mI();
    const late = e.filter(isLate);
    const meta = +ST.settings.meta || 0;
    const ad = +ST.settings.alertDays || 3;

    const upcoming = e
        .filter(x => {
            if (x.status === 'pago') return false;
            const d = toDate(x.date);
            if (!d) return false;
            return (d - today) / 86400000 >= 0 && (d - today) / 86400000 <= ad;
        })
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    // 8.3 ALERTAS
    let alerts = '';

    if (ST.settings.showAlertsSection !== false) {
        // Alerta de atraso
        if (late.length && !dashDismissedAlerts.has('late')) {
            alerts += `
                <div class="alert-box alert-danger">
                    <h4>
                        <span class="alert-icon-text">
                            ${icon('alert-triangle', 'ic-inline')} 
                            ${late.length} item${late.length > 1 ? 'ns' : ''} em atraso
                        </span>
                        <button class="alert-close" onclick="dismissAlert('late')" title="Fechar alerta">
                            ${icon('x')}
                        </button>
                    </h4>
                    <div class="alert-items">
                        ${late.slice(0, 4).map(x =>
                            `<div class="alert-row">
                                <span class="alert-row-desc">${x.desc}</span>
                                <span class="alert-row-value">${fmt(x.value)}</span>
                            </div>`
                        ).join('')}
                    </div>
                </div>
            `;
        }

        // Alerta de vencimento
        if (upcoming.length && !dashDismissedAlerts.has('upcoming')) {
            alerts += `
                <div class="alert-box alert-warning">
                    <h4>
                        <span class="alert-icon-text">
                            ${icon('bell', 'ic-inline')} 
                            Vencendo nos próximos ${ad} dias
                        </span>
                        <button class="alert-close" onclick="dismissAlert('upcoming')" title="Fechar alerta">
                            ${icon('x')}
                        </button>
                    </h4>
                    <div class="alert-items">
                        ${upcoming.slice(0, 4).map(x =>
                            `<div class="alert-row">
                                <span class="alert-row-desc">${x.desc} – ${fmtD(x.date)}</span>
                                <span class="alert-row-value">${fmt(x.value)}</span>
                            </div>`
                        ).join('')}
                    </div>
                </div>
            `;
        }
    }

    // 8.4 ORÇAMENTO POR CATEGORIA
    const budgets = budgetStatusList();

    if (ST.settings.showBudgetSection !== false) {
        const overBudgets = budgets.filter(b => b.over);
        const warnBudgets = budgets.filter(b => b.warn);

        if (overBudgets.length && !dashDismissedAlerts.has('budgetOver')) {
            alerts += `
                <div class="alert-box alert-danger">
                    <h4>
                        <span class="alert-icon-text">
                            ${icon('alert-triangle', 'ic-inline')} Orçamento estourado
                        </span>
                        <button class="alert-close" onclick="dismissAlert('budgetOver')" title="Fechar alerta">
                            ${icon('x')}
                        </button>
                    </h4>
                    <div class="alert-items">
                        ${overBudgets.map(b =>
                            `<div class="alert-row">
                                <span class="alert-row-desc">${b.grp}</span>
                                <span class="alert-row-value">${fmt(b.spent)} / ${fmt(b.limit)}</span>
                            </div>`
                        ).join('')}
                    </div>
                </div>
            `;
        }

        if (warnBudgets.length && !dashDismissedAlerts.has('budgetWarn')) {
            alerts += `
                <div class="alert-box alert-warning">
                    <h4>
                        <span class="alert-icon-text">
                            ${icon('bell', 'ic-inline')} Perto do limite do orçamento (80%+)
                        </span>
                        <button class="alert-close" onclick="dismissAlert('budgetWarn')" title="Fechar alerta">
                            ${icon('x')}
                        </button>
                    </h4>
                    <div class="alert-items">
                        ${warnBudgets.map(b =>
                            `<div class="alert-row">
                                <span class="alert-row-desc">${b.grp}</span>
                                <span class="alert-row-value">${fmt(b.spent)} / ${fmt(b.limit)}</span>
                            </div>`
                        ).join('')}
                    </div>
                </div>
            `;
        }
    }

    // 8.5 DADOS FILTRADOS
    const fe = dashFilteredExpenses();
    const fi = dashFilteredIncomes();

    // 8.6 KPIs
    const tp = fe.reduce((s, x) => s + (+x.value || 0), 0);
    const tr = fi.reduce((s, x) => s + (+x.value || 0), 0);

    const pg = fe.reduce((s, x) => s + (x.status === 'pago' ? (+x.value || 0) : (+x.paidAmount || 0)), 0);
    const restante = tp - pg;
    const emDia = tp > 0 && restante <= 0;
    const saldo = tr - tp;

    // 8.7 GRÁFICOS: Histórico 6 meses
    const hist = Array.from({ length: 6 }, (_, idx) => {
        let m = ST.vm - 5 + idx;
        let y = ST.vy;

        while (m < 0) { m += 12; y--; }
        while (m > 11) { m -= 12; y++; }

        return {
            name: MONTHS[m].slice(0, 3),
            a: Math.round(ST.incomes.filter(x => {
                const d = toDate(x.date);
                return d && d.getMonth() === m && d.getFullYear() === y;
            }).reduce((s, x) => s + (+x.value || 0), 0)),
            b: Math.round(ST.expenses.filter(x => {
                const d = toDate(x.date);
                return d && d.getMonth() === m && d.getFullYear() === y;
            }).reduce((s, x) => s + (+x.value || 0), 0))
        };
    });

    // 8.8 GRÁFICOS: Gastos por grupo
    const pd = ST.groups
        .map(g => ({
            name: g,
            v: Math.round(fe.filter(x => x.grp === g).reduce((s, x) => s + (+x.value || 0), 0))
        }))
        .filter(g => g.v > 0);

    // 8.9 META MENSAL
    const guardadoNoMes = patrimonioGuardadoNoMes(ST.vy, ST.vm);
    const metaKPI = meta > 0
        ? `
            <div class="kpi ${guardadoNoMes >= meta ? 'kpi-success' : 'kpi-warning'}">
                <div class="kpi-label">Meta Economia do Mês</div>
                <div class="kpi-value">${fmt(guardadoNoMes)}</div>
                <div class="kpi-sub">
                    ${guardadoNoMes >= meta
                        ? icon('check', 'ic-inline') + ' Meta de ' + fmt(meta) + ' atingida'
                        : 'Faltam ' + fmt(meta - guardadoNoMes) + ' de ' + fmt(meta)
                    }
                </div>
            </div>
        `
        : `
            <div class="kpi kpi-neutral">
                <div class="kpi-label">Já Pago</div>
                <div class="kpi-value">${fmt(pg)}</div>
                <div class="kpi-sub">de ${fmt(tp)}</div>
            </div>
        `;

    // 8.10 CARD DE DESPESAS
    const despesasCard = tp === 0
        ? `
            <div class="kpi kpi-neutral">
                <div class="kpi-label">Despesas</div>
                <div class="kpi-value kpi-value-sm">Nenhuma despesa</div>
                <div class="kpi-sub">no período selecionado</div>
            </div>
        `
        : emDia
            ? `
                <div class="kpi kpi-success">
                    <div class="kpi-label">Despesas</div>
                    <div class="kpi-value kpi-value-sm">&#127881; Você está em dia!</div>
                    <div class="kpi-sub">Total do período: ${fmt(tp)}</div>
                </div>
            `
            : `
                <div class="kpi kpi-danger">
                    <div class="kpi-label">Restante a Pagar</div>
                    <div class="kpi-value">${fmt(restante)}</div>
                    <div class="kpi-sub">Total: ${fmt(tp)} · Já pago: ${fmt(pg)}</div>
                </div>
            `;

    // 8.11 SEÇÃO: MEUS CARTÕES
    const cardsHTML = (ST.settings.showCardsSection !== false && ST.cards.length)
        ? `
            <div class="chart-card cards-section">
                <div class="chart-title">Meus Cartões</div>
                <div class="scroll-row cards-container">
                    ${ST.cards.map(c => {
                        const used = cardCommitted(c.id);
                        const pct = c.limit > 0 ? Math.min(100, (used / c.limit) * 100) : 0;

                        return `
                            <div class="credit-card" style="--card-color:${c.color};">
                                <div class="credit-card-header">
                                    <span class="credit-card-name">${c.name}</span>
                                    <span class="credit-card-brand">${c.brand || ''}</span>
                                </div>
                                <div class="credit-card-digits">
                                    •••• ${c.digits || '****'}
                                </div>
                                <div class="credit-card-progress">
                                    <div class="credit-card-progress-fill" style="width:${pct}%"></div>
                                </div>
                                <div class="credit-card-footer">
                                    <span>${fmt(c.limit)}</span>
                                    <span>${Math.round(pct)}% comprometido</span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `
        : '';

    // 8.12 SEÇÃO: CONTAS BANCÁRIAS
    const ativas = ST.accounts.filter(a => a.status !== 'inativa');

    const accountsBody = ativas.length
        ? `
            <div class="accounts-container">
                ${ativas.map(a => `
                    <div class="account-card" style="background:linear-gradient(135deg,${a.color}ee,${a.color}99);">
                        <div class="account-card-name">${a.name}</div>
                        <div class="account-card-bank">${a.bank || '—'}</div>
                        <div class="account-card-balance">${fmt(accountBalance(a.id))}</div>
                    </div>
                `).join('')}
            </div>
            <div class="accounts-total">
                Total: <strong>${fmt(totalSaldoContas())}</strong>
            </div>
        `
        : `
            <div class="empty-state">
                Nenhuma conta cadastrada.
                <span class="empty-state-link" onclick="goTo('contas')">Cadastrar agora</span>
            </div>
        `;

    const accountsHTML = ST.settings.showAccountsSection === false
        ? ''
        : renderDashboardSection('contas', 'Contas Bancárias', '(saldo)', accountsBody, 'grid-column:span 2');

    // 8.13 SEÇÃO: PATRIMÔNIO
    const patrimonioBody = ST.objectives.length
        ? `
            <div class="patrimonio-container">
                ${ST.objectives.slice(0, 4).map(o => {
                    const g = objectiveBalance(o.id);
                    const meta2 = +o.targetValue || 0;
                    const pct = meta2 > 0 ? Math.min(100, (g / meta2) * 100) : 0;

                    return `
                        <div class="patrimonio-item" style="background:${o.color}14;border:1px solid ${o.color}44;">
                            <div class="patrimonio-item-name" style="color:${o.color}">${o.name}</div>
                            <div class="patrimonio-item-value">${fmt(g)}</div>
                            ${meta2 > 0
                                ? `<div class="progress" style="margin-top:6px">
                                    <div class="progress-fill" style="background:${o.color};width:${pct}%"></div>
                                </div>`
                                : ''
                            }
                        </div>
                    `;
                }).join('')}
            </div>
            <div class="patrimonio-total">
                Total guardado: <strong>${fmt(totalPatrimonio())}</strong>
            </div>
        `
        : `
            <div class="empty-state">
                Nenhum objetivo cadastrado.
                <span class="empty-state-link" onclick="goTo('patrimonio')">Cadastrar agora</span>
            </div>
        `;

    const patrimonioHTML = ST.settings.showPatrimonioSection === false
        ? ''
        : renderDashboardSection('patrimonio', 'Patrimônio', '(objetivos e reservas)', patrimonioBody, 'grid-column:span 2');

    // 8.14 SEÇÃO: ORÇAMENTO POR CATEGORIA
    const budgetBody = `
        <div class="budget-list">
            ${budgets.map(b => {
                const color = b.over ? 'var(--red)' : b.warn ? 'var(--amber)' : 'var(--green)';
                const colorClass = b.over ? 'color-danger' : b.warn ? 'color-warning' : 'color-success';

                return `
                    <div class="budget-item">
                        <div class="budget-item-header">
                            <span class="budget-item-name">${b.grp}</span>
                            <span class="budget-item-values ${colorClass}">${fmt(b.spent)} / ${fmt(b.limit)}</span>
                        </div>
                        <div class="progress">
                            <div class="progress-fill" style="background:${color};width:${b.pct}%"></div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
        <div class="budget-manage-link">
            <span onclick="goTo('configuracoes')">Gerenciar orçamentos</span>
        </div>
    `;

    const budgetHTML = (ST.settings.showBudgetSection !== false && budgets.length)
        ? renderDashboardSection('budget', 'Orçamento por Categoria', '(mês atual)', budgetBody, 'grid-column:span 2')
        : '';

    // 8.15 SEÇÃO: PRÓXIMOS VENCIMENTOS
    let invoiceHTML = '';

    if (ST.settings.showNextInvoiceSection !== false) {
        const refDate = new Date(ST.vy, ST.vm, 15);

        const cardInvoices = ST.cards
            .filter(c => c.fechamento)
            .map(c => {
                const cycle = cardCycleDates(c, refDate);
                if (!cycle) return null;

                const items = ST.expenses.filter(x => {
                    if (x.cardId !== c.id) return false;
                    const d = toDate(x.date);
                    if (!d) return false;
                    return d >= cycle.cycleStart && d <= cycle.cycleEnd && x.status !== 'pago';
                });

                const total = items.reduce((s, x) => s + (+x.value || 0), 0);
                const due = cardInvoiceDueDate(c, cycle.cycleEnd);

                if (due) {
                    const dueMonth = due.getMonth();
                    const dueYear = due.getFullYear();
                    if (dueMonth !== ST.vm || dueYear !== ST.vy) return null;
                }

                return {
                    label: c.name,
                    tag: 'Fatura',
                    color: c.color,
                    due: due,
                    total: total,
                    late: due ? due < today : false
                };
            })
            .filter(Boolean);

        const otherBills = ST.expenses
            .filter(x => !x.cardId && x.status !== 'pago')
            .map(x => {
                const due = toDate(x.date);

                if (due) {
                    const dueMonth = due.getMonth();
                    const dueYear = due.getFullYear();
                    if (dueMonth !== ST.vm || dueYear !== ST.vy) return null;
                }

                return {
                    label: x.desc,
                    tag: null,
                    color: 'var(--text2)',
                    due: due,
                    total: expRemaining(x),
                    late: isLate(x)
                };
            })
            .filter(Boolean)
            .sort((a, b) => (a.due && b.due) ? a.due - b.due : 0)
            .slice(0, 8);

        const allItems = [...cardInvoices, ...otherBills]
            .filter(item => item.total > 0)
            .sort((a, b) => {
                if (!a.due) return 1;
                if (!b.due) return -1;
                return a.due - b.due;
            });

        const invoiceBody = allItems.length
            ? `
                <div class="invoice-list">
                    ${allItems.map(inv => `
                        <div class="invoice-item">
                            <span class="invoice-item-label" style="color:${inv.color}">
                                ${inv.label}
                                ${inv.tag ? ` <span class="invoice-item-tag">(${inv.tag})</span>` : ''}
                            </span>
                            <span class="invoice-item-due ${inv.late ? 'late' : 'ontime'}">
                                ${inv.due ? (inv.late ? 'Venceu em ' : 'Vence em ') + fmtD(dateToStr(inv.due)) : '—'}
                            </span>
                            <span class="invoice-item-value">${fmt(inv.total)}</span>
                        </div>
                    `).join('')}
                </div>
            `
            : `
                <div class="invoice-empty">Nenhuma conta a pagar neste mês. 🎉</div>
            `;

        invoiceHTML = renderDashboardSection(
            'invoice',
            'Próximos Vencimentos',
            `(${MONTHS[ST.vm]}/${ST.vy})`,
            invoiceBody,
            'grid-column:span 2'
        );
    }

    // 8.16 BARRA DE FILTROS
    const statusOptions = [...new Set([...ST.expStatuses, ...ST.incStatuses, 'atrasado'])];
    const filtersBody = `
        <div class="dashboard-filters">
            <div class="dashboard-filter-grid">
                <div class="form-field">
                    <label>Período</label>
                    <select onchange="setDashFilter('periodo',this.value)">
                        <option value="mes" ${dashPeriodo === 'mes' ? 'selected' : ''}>Este mês</option>
                        <option value="ano" ${dashPeriodo === 'ano' ? 'selected' : ''}>Este ano (${ST.vy})</option>
                        <option value="tudo" ${dashPeriodo === 'tudo' ? 'selected' : ''}>Todos os períodos</option>
                    </select>
                </div>
                <div class="form-field">
                    <label>Conta</label>
                    <select onchange="setDashFilter('conta',this.value)">
                        <option value="">Todas</option>
                        ${ST.accounts.map(a =>
                            `<option value="${a.id}" ${dashFiltAccount === a.id ? 'selected' : ''}>${a.name}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-field">
                    <label>Cartão</label>
                    <select onchange="setDashFilter('cartao',this.value)">
                        <option value="">Todos</option>
                        ${ST.cards.map(c =>
                            `<option value="${c.id}" ${dashFiltCard === c.id ? 'selected' : ''}>${c.name}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-field">
                    <label>Categoria</label>
                    <select onchange="setDashFilter('grupo',this.value)">
                        <option value="">Todas</option>
                        ${ST.groups.map(g =>
                            `<option value="${g}" ${dashFiltGrupo === g ? 'selected' : ''}>${g}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-field">
                    <label>Status</label>
                    <select onchange="setDashFilter('status',this.value)">
                        <option value="">Todos</option>
                        ${statusOptions.map(s =>
                            `<option value="${s}" ${dashFiltStatus === s ? 'selected' : ''}>${cap(s)}</option>`
                        ).join('')}
                    </select>
                </div>
            </div>
            <div class="dashboard-filter-actions">
                <button class="btn-filter-clear" onclick="clearDashFilters()">Limpar filtros</button>
            </div>
        </div>
    `;

    const filtersHTML = renderDashboardSection(
        'filters',
        'Filtros do Dashboard',
        '',
        filtersBody,
        'margin-bottom:16px'
    );

    // 8.17 MONTA O HTML FINAL
    const html =
        (ST.settings.name
            ? `<p class="dashboard-greeting">Olá, ${ST.settings.name}! &#128075;</p>`
            : '') +
        alerts +
        filtersHTML +
        `
        <div class="kpi-grid">
            <div class="kpi kpi-success">
                <div class="kpi-label">Receitas</div>
                <div class="kpi-value">${fmt(tr)}</div>
                <div class="kpi-sub">${fi.length} lançamentos</div>
            </div>
            ${despesasCard}
            <div class="kpi ${saldo >= 0 ? 'kpi-purple' : 'kpi-danger'}">
                <div class="kpi-label">Saldo do Período</div>
                <div class="kpi-value">${fmt(saldo)}</div>
            </div>
            ${metaKPI}
        </div>
        ` +
        (accountsHTML ? `<div class="chart-row">${accountsHTML}</div>` : '') +
        (patrimonioHTML ? `<div class="chart-row">${patrimonioHTML}</div>` : '') +
        (budgetHTML ? `<div class="chart-row">${budgetHTML}</div>` : '') +
        (invoiceHTML ? `<div class="chart-row">${invoiceHTML}</div>` : '') +
        ((ST.settings.showMonthlyChartSection !== false || ST.settings.showGroupChartSection !== false || cardsHTML)
            ? `
            <div class="chart-row">
                ${ST.settings.showMonthlyChartSection !== false
                    ? renderDashboardSection(
                        'monthlyChart',
                        'Últimos 6 meses',
                        '',
                        barChart(hist, 'var(--green)', 'var(--red)')
                    )
                    : ''
                }
                ${ST.settings.showGroupChartSection !== false
                    ? renderDashboardSection(
                        'groupChart',
                        'Gastos por grupo',
                        dashPeriodo !== 'mes' || dashFiltAccount || dashFiltCard || dashFiltGrupo || dashFiltStatus
                            ? '(filtrado)'
                            : '',
                        pieChart(pd)
                    )
                    : ''
                }
                ${cardsHTML}
            </div>
            `
            : ''
        );

    document.getElementById('content').innerHTML = html;
}