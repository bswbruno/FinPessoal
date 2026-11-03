// FinPessoal v3.0 – Relatórios
function renderRelatorios() {
    const expenses = mE();
    const incomes = mI();
    const expenseTotal = expenses.reduce((sum, item) => sum + (+item.value || 0), 0);
    const incomeTotal = incomes.reduce((sum, item) => sum + (+item.value || 0), 0);
    const expensePaid = expenses.reduce((sum, item) =>
        sum + (item.status === 'pago' ? (+item.value || 0) : (+item.paidAmount || 0)), 0);
    const incomeReceived = incomes.reduce((sum, item) =>
        sum + (item.status === 'recebido' ? (+item.value || 0) : (+item.receivedAmount || 0)), 0);
    const expensePending = expenses.reduce((sum, item) =>
        sum + (item.status === 'pago' ? 0 : expRemaining(item)), 0);
    const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);

    const hist = Array.from({ length: 6 }, (_, idx) => {
        let month = ST.vm - 5 + idx;
        let year = ST.vy;
        while (month < 0) { month += 12; year--; }
        while (month > 11) { month -= 12; year++; }
        return {
            name: MONTHS[month].slice(0, 3) + '/' + String(year).slice(2),
            a: Math.round(ST.incomes.filter(item => {
                const date = toDate(item.date);
                return date && date.getMonth() === month && date.getFullYear() === year;
            }).reduce((sum, item) => sum + (+item.value || 0), 0)),
            b: Math.round(ST.expenses.filter(item => {
                const date = toDate(item.date);
                return date && date.getMonth() === month && date.getFullYear() === year;
            }).reduce((sum, item) => sum + (+item.value || 0), 0))
        };
    });

    const categories = ST.groups.map((group, idx) => {
        const items = expenses.filter(item => item.grp === group);
        const total = items.reduce((sum, item) => sum + (+item.value || 0), 0);
        const paid = items.reduce((sum, item) =>
            sum + (item.status === 'pago' ? (+item.value || 0) : (+item.paidAmount || 0)), 0);
        return { name: group, total, paid, pending: Math.max(0, total - paid), count: items.length, color: COLORS[idx % COLORS.length] };
    }).filter(item => item.total > 0).sort((a, b) => b.total - a.total);

    const uncategorized = expenses.filter(item => !ST.groups.includes(item.grp || ''));
    if (uncategorized.length) {
        categories.push({
            name: 'Sem categoria',
            total: uncategorized.reduce((sum, item) => sum + (+item.value || 0), 0),
            paid: uncategorized.reduce((sum, item) =>
                sum + (item.status === 'pago' ? (+item.value || 0) : (+item.paidAmount || 0)), 0),
            pending: uncategorized.reduce((sum, item) =>
                sum + (item.status === 'pago' ? 0 : expRemaining(item)), 0),
            count: uncategorized.length,
            color: COLORS[categories.length % COLORS.length]
        });
        categories.sort((a, b) => b.total - a.total);
    }

    const cardTotals = new Map();
    expenses.forEach(item => {
        const card = ST.cards.find(candidate => candidate.id === item.cardId);
        const name = item.cardId ? (card ? card.name : 'Cartão removido') : 'Sem cartão (dinheiro/débito)';
        const current = cardTotals.get(name) || { name, total: 0, paid: 0, pending: 0, count: 0 };
        current.total += +item.value || 0;
        current.paid += item.status === 'pago' ? (+item.value || 0) : (+item.paidAmount || 0);
        current.pending += item.status === 'pago' ? 0 : expRemaining(item);
        current.count++;
        cardTotals.set(name, current);
    });
    const cards = [...cardTotals.values()].sort((a, b) => b.total - a.total);

    const incomeSources = new Map();
    incomes.forEach(item => {
        const name = item.src || item.type || 'Outros';
        const current = incomeSources.get(name) || { name, total: 0, received: 0, count: 0 };
        current.total += +item.value || 0;
        current.received += item.status === 'recebido' ? (+item.value || 0) : (+item.receivedAmount || 0);
        current.count++;
        incomeSources.set(name, current);
    });
    const sources = [...incomeSources.values()].sort((a, b) => b.total - a.total);

    const budgets = ST.groups.map((group, idx) => {
        const limit = +ST.budgets[group] || 0;
        const spent = expenses.filter(item => item.grp === group)
            .reduce((sum, item) => sum + (+item.value || 0), 0);
        return { group, limit, spent, color: COLORS[idx % COLORS.length] };
    }).filter(item => item.limit > 0).sort((a, b) => (b.spent / b.limit) - (a.spent / a.limit));

    const topCategory = categories[0];
    const topCard = cards[0];
    const overdueCount = expenses.filter(item => isLate(item)).length;
    const paidPercent = expenseTotal ? Math.min(100, (expensePaid / expenseTotal) * 100) : 0;

    document.getElementById('content').innerHTML = `
        <div class="relatorios-toolbar">
            <span class="relatorios-titulo">${MONTHS[ST.vm]} ${ST.vy}</span>
            <div class="relatorios-acoes">
                <button class="btn" onclick="exportCSV(false)">${icon('file-down')} CSV deste mês</button>
                <button class="btn btn-primary" onclick="exportCSV(true)">${icon('file-down')} Histórico completo</button>
            </div>
        </div>

        <div class="relatorios-insight">
            <div class="relatorios-insight-icon">${icon('scan-search')}</div>
            <div>
                <strong>Visão do mês</strong>
                <p>${topCategory
                    ? `Maior gasto em <b>${escapeHtml(topCategory.name)}</b> (${fmt(topCategory.total)}${expenseTotal ? `, ${(topCategory.total / expenseTotal * 100).toFixed(1)}% das despesas` : ''})`
                    : 'Ainda não há despesas lançadas neste mês.'}
                    ${topCard ? ` · Maior volume por ${topCard.name === 'Sem cartão (dinheiro/débito)' ? 'forma de pagamento' : 'cartão'}: <b>${escapeHtml(topCard.name)}</b> (${fmt(topCard.total)}).` : ''}
                    ${overdueCount ? ` <span class="relatorios-alerta">${overdueCount} despesa(s) vencida(s).</span>` : ''}
                </p>
            </div>
        </div>

        <div class="kpi-grid">
            <div class="kpi kpi-success">
                <div class="kpi-label">Receitas lançadas</div>
                <div class="kpi-value">${fmt(incomeTotal)}</div>
                <div class="kpi-sub">${fmt(incomeReceived)} recebidos</div>
            </div>
            <div class="kpi kpi-danger">
                <div class="kpi-label">Despesas lançadas</div>
                <div class="kpi-value">${fmt(expenseTotal)}</div>
                <div class="kpi-sub">${expenses.length} lançamento(s)</div>
            </div>
            <div class="kpi ${incomeTotal - expenseTotal >= 0 ? 'kpi-purple' : 'kpi-danger'}">
                <div class="kpi-label">Saldo previsto</div>
                <div class="kpi-value">${fmt(incomeTotal - expenseTotal)}</div>
                <div class="kpi-sub">Receitas menos despesas lançadas</div>
            </div>
            <div class="kpi kpi-warning">
                <div class="kpi-label">Despesas pagas</div>
                <div class="kpi-value">${fmt(expensePaid)}</div>
                <div class="kpi-sub">${paidPercent.toFixed(0)}% · ${fmt(expensePending)} pendentes</div>
            </div>
        </div>

        <div class="chart-row relatorios-chart-row">
            <div class="chart-card">
                <div class="chart-title">
                    Evolução dos últimos 6 meses
                    <span class="relatorios-legenda">
                        <span style="color:var(--green)">&#9632;</span> Receitas
                        <span style="color:var(--red)">&#9632;</span> Despesas
                    </span>
                </div>
                ${barChart(hist, 'var(--green)', 'var(--red)')}
            </div>
            <div class="chart-card">
                <div class="chart-title">Despesas por categoria</div>
                ${pieChart(categories.map(item => ({ name: escapeHtml(item.name), v: item.total })))}
            </div>
            <div class="chart-card">
                <div class="chart-title">Despesas por cartão/forma</div>
                ${pieChart(cards.map(item => ({ name: escapeHtml(item.name), v: item.total })))}
            </div>
        </div>

        <section class="relatorios-section">
            <div class="relatorios-section-heading">
                <div><h2>Onde você está gastando</h2><p>Distribuição das despesas lançadas no mês selecionado.</p></div>
                <span class="relatorios-section-total">${fmt(expenseTotal)}</span>
            </div>
            ${categories.length ? `
                <div class="table-wrap relatorios-tabela">
                    <table>
                        <thead><tr><th>Categoria</th><th>Total</th><th>% despesas</th><th>Pago</th><th>Pendente</th><th>Itens</th></tr></thead>
                        <tbody>${categories.map(item => `
                            <tr>
                                <td class="relatorios-grupo"><span class="relatorios-cor" style="background:${item.color}"></span>${escapeHtml(item.name)}</td>
                                <td class="relatorios-valor-despesa">${fmt(item.total)}</td>
                                <td class="relatorios-porcentagem">
                                    <div class="relatorios-share">${expenseTotal ? (item.total / expenseTotal * 100).toFixed(1) : 0}%</div>
                                    <div class="progress"><div class="progress-fill" style="background:${item.color};width:${expenseTotal ? item.total / expenseTotal * 100 : 0}%"></div></div>
                                </td>
                                <td class="relatorios-valor-receita">${fmt(item.paid)}</td>
                                <td>${fmt(item.pending)}</td>
                                <td class="relatorios-itens">${item.count}</td>
                            </tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            ` : '<div class="relatorios-empty">Nenhuma despesa lançada neste período.</div>'}
        </section>

        <div class="relatorios-detail-grid">
            <section class="relatorios-section">
                <div class="relatorios-section-heading">
                    <div><h2>Gastos por cartão e forma de pagamento</h2><p>Inclui despesas sem cartão de crédito.</p></div>
                </div>
                ${cards.length ? `
                    <div class="table-wrap relatorios-tabela">
                        <table>
                            <thead><tr><th>Cartão/forma</th><th>Total</th><th>%</th><th>Pago</th><th>Pendente</th><th>Itens</th></tr></thead>
                            <tbody>${cards.map(item => `
                                <tr>
                                    <td>${escapeHtml(item.name)}</td>
                                    <td class="relatorios-valor-despesa">${fmt(item.total)}</td>
                                    <td class="relatorios-porcentagem">${expenseTotal ? (item.total / expenseTotal * 100).toFixed(1) : 0}%</td>
                                    <td class="relatorios-valor-receita">${fmt(item.paid)}</td>
                                    <td>${fmt(item.pending)}</td>
                                    <td class="relatorios-itens">${item.count}</td>
                                </tr>`).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : '<div class="relatorios-empty">Nenhuma despesa lançada neste período.</div>'}
            </section>

            <section class="relatorios-section">
                <div class="relatorios-section-heading">
                    <div><h2>De onde vêm suas receitas</h2><p>Valores lançados e já recebidos por origem.</p></div>
                    <span class="relatorios-section-total relatorios-valor-receita">${fmt(incomeTotal)}</span>
                </div>
                ${sources.length ? `
                    <div class="table-wrap relatorios-tabela">
                        <table>
                            <thead><tr><th>Origem</th><th>Total</th><th>% receitas</th><th>Recebido</th></tr></thead>
                            <tbody>${sources.map(item => `
                                <tr>
                                    <td>${escapeHtml(item.name)}</td>
                                    <td class="relatorios-valor-receita">${fmt(item.total)}</td>
                                    <td class="relatorios-porcentagem">${incomeTotal ? (item.total / incomeTotal * 100).toFixed(1) : 0}%</td>
                                    <td>${fmt(item.received)}</td>
                                </tr>`).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : '<div class="relatorios-empty">Nenhuma receita lançada neste período.</div>'}
            </section>
        </div>

        ${budgets.length ? `
            <section class="relatorios-section">
                <div class="relatorios-section-heading">
                    <div><h2>Acompanhamento de orçamentos</h2><p>Comparação dos gastos do mês com os limites definidos por categoria.</p></div>
                </div>
                <div class="relatorios-budget-list">${budgets.map(item => {
                    const percentage = item.limit ? item.spent / item.limit * 100 : 0;
                    const over = item.spent > item.limit;
                    return `<div class="relatorios-budget-item">
                        <div class="relatorios-budget-heading">
                            <span>${escapeHtml(item.group)}</span>
                            <span class="${over ? 'relatorios-alerta' : ''}">${fmt(item.spent)} de ${fmt(item.limit)}${over ? ' · acima do limite' : ''}</span>
                        </div>
                        <div class="progress"><div class="progress-fill" style="background:${over ? 'var(--red)' : item.color};width:${Math.min(100, percentage)}%"></div></div>
                        <div class="relatorios-budget-foot">${over ? `Excedeu ${fmt(item.spent - item.limit)}` : `Restam ${fmt(item.limit - item.spent)}`} · ${percentage.toFixed(0)}% do limite</div>
                    </div>`;
                }).join('')}</div>
            </section>
        ` : ''}
    `;
}

function exportCSV(all) {
    const exps = all ? ST.expenses : mE(),
        incs = all ? ST.incomes : mI();
    const numBR = v => (+v || 0).toFixed(2).replace('.', ',');
    const rows = [
        ['Tipo', 'Data', 'Descrição', 'Origem', 'Valor', 'Status', 'Grupo', 'Tipo Conta', 'Parcela', 'Cartão', 'Obs'],
        ...exps.map(x => {
            const c = ST.cards.find(c => c.id === x.cardId);
            return ['Despesa', fmtD(x.date), x.desc, '', numBR(x.value), x.status, x.grp || '', x.type || '', x.type === 'parcelada' ? x.num + '/' + x.totalInstallments : '', c ? c.name : '', x.obs || ''];
        }),
        ...incs.map(x => ['Receita', fmtD(x.date), x.desc, x.src || '', numBR(x.value), x.status, x.type || '', x.rec || '', x.rec === 'parcelada' ? x.num + '/' + x.totalInstallments : '', '', x.obs || ''])
    ];
    const csv = rows.map(r => r.map(c => '"' + String(c || '').replace(/"/g, '""') + '"').join(';')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }));
    a.download = all ? 'historico-completo.csv' : 'relatorio-' + MONTHS[ST.vm].toLowerCase() + '-' + ST.vy + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    notify('CSV exportado! Abra direto no Excel — os números e colunas já vêm formatados certinho.', 'info');
}
