// FinPessoal v3.0 – Relatórios
function renderRelatorios() {
    const e = mE(),
        i = mI();
    const tp = e.reduce((s, x) => s + (+x.value || 0), 0),
        tr = i.reduce((s, x) => s + (+x.value || 0), 0),
        pg = e.filter(x => x.status === 'pago').reduce((s, x) => s + (+x.value || 0), 0);

    const hist = Array.from({ length: 6 }, (_, idx) => {
        let m = ST.vm - 5 + idx,
            y = ST.vy;
        while (m < 0) { m += 12;
            y--; }
        while (m > 11) { m -= 12;
            y++; }
        return {
            name: MONTHS[m].slice(0, 3) + '/' + String(y).slice(2),
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

    const bg = ST.groups.map((g, idx) => {
            const v = e.filter(x => x.grp === g).reduce((s, x) => s + (+x.value || 0), 0);
            return { g, v, c: COLORS[idx % COLORS.length] };
        }).filter(x => x.v > 0)
        .sort((a, b) => b.v - a.v);

    const bi = ['Salário', 'Freelance/Projeto', 'Recebimento de Pessoa', 'Aluguel', 'Investimentos', 'Bônus', 'Outros']
        .map((t, idx) => {
            const v = i.filter(x => x.type === t).reduce((s, x) => s + (+x.value || 0), 0);
            return { t, v, c: COLORS[idx % COLORS.length] };
        }).filter(x => x.v > 0);

    document.getElementById('content').innerHTML = `
        <div class="relatorios-toolbar">
            <span class="relatorios-titulo">${MONTHS[ST.vm]} ${ST.vy}</span>
            <div class="relatorios-acoes">
                <button class="btn" onclick="exportCSV(false)">${icon('file-down')} CSV deste mês</button>
                <button class="btn btn-primary" onclick="exportCSV(true)">${icon('file-down')} Histórico completo</button>
            </div>
        </div>

        <div class="kpi-grid">
            <div class="kpi kpi-success">
                <div class="kpi-label">Total Receitas</div>
                <div class="kpi-value">${fmt(tr)}</div>
            </div>
            <div class="kpi kpi-danger">
                <div class="kpi-label">Total Despesas</div>
                <div class="kpi-value">${fmt(tp)}</div>
            </div>
            <div class="kpi ${tr-tp>=0 ? 'kpi-purple' : 'kpi-danger'}">
                <div class="kpi-label">Saldo</div>
                <div class="kpi-value">${fmt(tr-tp)}</div>
            </div>
            <div class="kpi kpi-warning">
                <div class="kpi-label">Já Pago</div>
                <div class="kpi-value">${fmt(pg)}</div>
                <div class="kpi-sub">${tp>0?((pg/tp)*100).toFixed(0):0}% das despesas</div>
            </div>
        </div>

        <div class="chart-row">
            <div class="chart-card">
                <div class="chart-title">
                    Evolução 6 meses 
                    <span class="relatorios-legenda">
                        <span style="color:var(--green)">&#9632;</span> Receber 
                        <span style="color:var(--red)">&#9632;</span> Pagar
                    </span>
                </div>
                ${barChart(hist, 'var(--green)', 'var(--red)')}
            </div>
            <div class="chart-card">
                <div class="chart-title">Despesas por grupo</div>
                ${pieChart(bg.map(x=>({name:x.g,v:x.v})))}
            </div>
        </div>

        ${bg.length ? `
            <div class="table-wrap relatorios-tabela">
                <table>
                    <thead>
                        <tr>
                            <th>Grupo</th>
                            <th>Total</th>
                            <th>%</th>
                            <th style="width:120px">Barra</th>
                            <th>Itens</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${bg.map(x => `
                            <tr>
                                <td class="relatorios-grupo">
                                    <span class="relatorios-cor" style="background:${x.c}"></span>
                                    ${x.g}
                                </td>
                                <td class="relatorios-valor-despesa">${fmt(x.v)}</td>
                                <td class="relatorios-porcentagem">${tp>0?((x.v/tp)*100).toFixed(1):0}%</td>
                                <td>
                                    <div class="progress">
                                        <div class="progress-fill" style="background:${x.c};width:${tp>0?((x.v/tp)*100):0}%"></div>
                                    </div>
                                </td>
                                <td class="relatorios-itens">${e.filter(ex=>ex.grp===x.g).length}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        ` : ''}

        ${bi.length ? `
            <div class="table-wrap relatorios-tabela">
                <table>
                    <thead>
                        <tr>
                            <th>Tipo de Receita</th>
                            <th>Valor</th>
                            <th>%</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${bi.map(x => `
                            <tr>
                                <td>${x.t}</td>
                                <td class="relatorios-valor-receita">${fmt(x.v)}</td>
                                <td class="relatorios-porcentagem">${tr>0?((x.v/tr)*100).toFixed(1):0}%</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
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