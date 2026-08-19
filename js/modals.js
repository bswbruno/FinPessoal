/**
 * ============================================================
 * FinPessoal v9.3 – Configurações e Modais
 * ============================================================
 */

// ============================================================
// 1. FUNÇÃO PRINCIPAL: RENDER CONFIGURAÇÕES
// ============================================================

function renderConfig() {
    const dp = ST.settings.dashDefaultPeriodo || 'mes';
    const showContas = ST.settings.showAccountsSection !== false;
    const showPatrimonio = ST.settings.showPatrimonioSection !== false;
    const showCartoes = ST.settings.showCardsSection !== false;
    const showOrcamento = ST.settings.showBudgetSection !== false;
    const showFatura = ST.settings.showNextInvoiceSection !== false;
    const showGraf6meses = ST.settings.showMonthlyChartSection !== false;
    const showGrafGrupo = ST.settings.showGroupChartSection !== false;
    const showAlertas = ST.settings.showAlertsSection !== false;

    document.getElementById('content').innerHTML = `
        <!-- ============================================================
             PREFERÊNCIAS GERAIS
        ============================================================ -->
        <div class="settings-card">
            <h3>Preferências</h3>
            <div class="form-grid">
                <div class="form-field">
                    <label>Seu nome</label>
                    <input type="text" id="cfg-name" value="${ST.settings.name || ''}" placeholder="Como prefere ser chamado?">
                </div>
                <div class="form-field">
                    <label>Meta mensal de economia (R$)</label>
                    <input type="number" id="cfg-meta" value="${ST.settings.meta || ''}" placeholder="Ex: 500">
                </div>
                <div class="form-field">
                    <label>Alerta de vencimento (dias antes)</label>
                    <input type="number" id="cfg-alert" value="${ST.settings.alertDays || 3}" min="1" max="30">
                </div>
                <div class="form-field config-save-btn">
                    <button class="btn btn-primary" onclick="saveSettings()">Salvar</button>
                </div>
            </div>
            <p class="config-hint">💡 A Meta Mensal é comparada com o total guardado nos seus Objetivos (Patrimônio) durante o mês, não com o saldo de receitas menos despesas.</p>
        </div>

        <!-- ============================================================
             PREFERÊNCIAS DO DASHBOARD
        ============================================================ -->
        <div class="settings-card">
            <h3>Preferências do Dashboard</h3>
            <div class="form-grid">
                <div class="form-field form-full">
                    <label>Período padrão ao abrir o Dashboard</label>
                    <select id="cfg-dash-periodo">
                        <option value="mes" ${dp === 'mes' ? 'selected' : ''}>Este mês</option>
                        <option value="ano" ${dp === 'ano' ? 'selected' : ''}>Este ano</option>
                        <option value="tudo" ${dp === 'tudo' ? 'selected' : ''}>Todos os períodos</option>
                    </select>
                </div>
            </div>
            
            <p class="config-section-label">Seções visíveis no Dashboard</p>
            
            <label class="config-checkbox">
                <input type="checkbox" id="cfg-show-alertas" ${showAlertas ? 'checked' : ''}>
                Alertas de atraso e vencimento
            </label>
            <label class="config-checkbox">
                <input type="checkbox" id="cfg-show-contas" ${showContas ? 'checked' : ''}>
                Contas Bancárias
            </label>
            <label class="config-checkbox">
                <input type="checkbox" id="cfg-show-patrimonio" ${showPatrimonio ? 'checked' : ''}>
                Patrimônio
            </label>
            <label class="config-checkbox">
                <input type="checkbox" id="cfg-show-orcamento" ${showOrcamento ? 'checked' : ''}>
                Orçamento por Categoria (card + alertas de 80%/estourado)
            </label>
            <label class="config-checkbox">
                <input type="checkbox" id="cfg-show-fatura" ${showFatura ? 'checked' : ''}>
                Próximos Vencimentos (faturas de cartão e contas a pagar)
            </label>
            <label class="config-checkbox">
                <input type="checkbox" id="cfg-show-cartoes" ${showCartoes ? 'checked' : ''}>
                Meus Cartões
            </label>
            <label class="config-checkbox">
                <input type="checkbox" id="cfg-show-graf6" ${showGraf6meses ? 'checked' : ''}>
                Gráfico "Últimos 6 meses"
            </label>
            <label class="config-checkbox config-checkbox-last">
                <input type="checkbox" id="cfg-show-grafgrupo" ${showGrafGrupo ? 'checked' : ''}>
                Gráfico "Gastos por grupo"
            </label>
            
            <button class="btn btn-primary" onclick="saveDashPrefs()">${icon('check')} Salvar preferências</button>
        </div>

        <!-- ============================================================
             PRIVACIDADE
        ============================================================ -->
        <div class="settings-card">
            <h3>Privacidade</h3>
            <label class="config-checkbox">
                <input type="checkbox" id="cfg-hide-values" ${ST.settings.hideValues ? 'checked' : ''} onchange="toggleHideValues()">
                Ocultar valores monetários (mostra "R$ •••••" em vez dos números)
            </label>
            <p class="config-hint">💡 Você também pode ligar/desligar isso rapidinho pelo ícone de olho na barra superior — os dois ficam sempre sincronizados.</p>
        </div>

        <!-- ============================================================
             ORÇAMENTO POR CATEGORIA
        ============================================================ -->
        <div class="settings-card">
            <h3>Orçamento por Categoria</h3>
            <p class="config-description">Isso é um <strong>teto de gasto por categoria</strong>, de forma geral — não é ligado a nenhuma conta bancária específica nem ao seu saldo disponível. Funciona assim: some quanto você já gastou naquele grupo (em qualquer conta, cartão ou dinheiro) durante o mês e compara com o limite abaixo.</p>
            <p class="config-hint">Deixe em branco ou zerado pra não ter limite naquele grupo. Você recebe um aviso ao chegar em 80% do limite, e outro ao ultrapassar — ambos aparecem no Dashboard (dá pra desligar em "Preferências do Dashboard" acima, no item "Orçamento por Categoria").</p>
            
            <div class="budget-list-config">
                ${ST.groups.map((g, idx) => {
                    const spent = budgetSpentForGroup(g);
                    return `
                        <div class="budget-item-config">
                            <span class="budget-item-name-config">${g}${ST.budgets[g] ? `<span class="budget-item-spent"> — gasto este mês: ${fmt(spent)}</span>` : ''}</span>
                            <input type="number" id="budget-input-${idx}" data-grp="${g}" value="${ST.budgets[g] || ''}" placeholder="Sem limite" min="0" step="0.01" class="budget-input-config">
                        </div>
                    `;
                }).join('')}
            </div>
            
            <button class="btn btn-primary" onclick="saveBudgets()">${icon('check')} Salvar orçamentos</button>
        </div>

        <!-- ============================================================
             CATEGORIAS (Grupos e Status)
        ============================================================ -->
        ${renderCategoriasCard()}

        <!-- ============================================================
             SEUS DADOS
        ============================================================ -->
        <div class="settings-card">
            <h3>Seus Dados</h3>
            
            <div class="config-sum-row">
                <span>Despesas registradas</span>
                <strong>${ST.expenses.length}</strong>
            </div>
            <div class="config-sum-row">
                <span>Receitas registradas</span>
                <strong>${ST.incomes.length}</strong>
            </div>
            <div class="config-sum-row">
                <span>Cartões cadastrados</span>
                <strong>${ST.cards.length}</strong>
            </div>
            <div class="config-sum-row">
                <span>Contas bancárias cadastradas</span>
                <strong>${ST.accounts.length}</strong>
            </div>
            <div class="config-sum-row">
                <span>Objetivos de patrimônio</span>
                <strong>${ST.objectives.length}</strong>
            </div>
            <div class="config-sum-row config-sum-row-last">
                <span>Armazenamento</span>
                <span class="config-storage">localStorage (este navegador)</span>
            </div>
            
            <p class="config-hint">💾 O Backup (JSON) salva TUDO e permite restaurar depois — útil pra trocar de computador ou ter uma cópia de segurança. O CSV é só pra abrir em planilha, não serve pra restaurar.</p>
            
            <input type="file" id="backup-file-input" accept=".json,application/json" style="display:none" onchange="importBackupJSON(event)">
            
            <div class="config-actions">
                <button class="btn btn-primary" onclick="exportBackupJSON()">${icon('download')} Exportar Backup (JSON)</button>
                <button class="btn" onclick="document.getElementById('backup-file-input').click()">${icon('upload')} Importar Backup</button>
                <button class="btn" onclick="exportCSV(true)">${icon('file-down')} Exportar CSV</button>
                <button class="btn btn-danger" onclick="clearAll()">Apagar todos os dados</button>
            </div>
        </div>

        <!-- ============================================================
             DADOS DE DEMONSTRAÇÃO
        ============================================================ -->
        <div class="settings-card settings-card-demo">
            <h3>${icon('sparkles', 'ic-inline')} Dados de Demonstração</h3>
            <p class="config-description">Preenche o app inteiro com dados <strong>fictícios</strong> (contas, cartões, despesas, receitas, patrimônio, orçamentos) — pronto pra tirar prints ou gravar um vídeo pro seu portfólio, sem expor números reais.</p>
            <p class="config-warning">⚠️ Isso substitui os dados atuais. Se tiver dados reais, exporte um Backup (acima) antes de usar.</p>
            <button class="btn btn-primary" onclick="seedDemoData()">${icon('sparkles')} Preencher com dados fictícios</button>
        </div>

        <!-- ============================================================
             RODAPÉ / VERSÃO
        ============================================================ -->
        <div class="settings-card settings-card-footer">
            <h3>FinPessoal v9.3</h3>
            <p>Sistema financeiro pessoal · Uso local neste navegador<br>Todos os dados ficam salvos apenas neste dispositivo<br>Sem servidor, sem internet obrigatória</p>
        </div>
    `;
}


// ============================================================
// 2. FUNÇÕES: SALVAR CONFIGURAÇÕES
// ============================================================

function saveSettings() {
    ST.settings.name = document.getElementById('cfg-name').value;
    ST.settings.meta = document.getElementById('cfg-meta').value;
    ST.settings.alertDays = +document.getElementById('cfg-alert').value || 3;
    sv();
    notify('Configurações salvas!');
    document.getElementById('sidebar-footer').textContent = ST.settings.name ? 'Olá, ' + ST.settings.name : 'FinPessoal v9.3';
}

function saveDashPrefs() {
    ST.settings.dashDefaultPeriodo = document.getElementById('cfg-dash-periodo').value;
    ST.settings.showAccountsSection = document.getElementById('cfg-show-contas').checked;
    ST.settings.showPatrimonioSection = document.getElementById('cfg-show-patrimonio').checked;
    ST.settings.showCardsSection = document.getElementById('cfg-show-cartoes').checked;
    ST.settings.showBudgetSection = document.getElementById('cfg-show-orcamento').checked;
    ST.settings.showNextInvoiceSection = document.getElementById('cfg-show-fatura').checked;
    ST.settings.showMonthlyChartSection = document.getElementById('cfg-show-graf6').checked;
    ST.settings.showGroupChartSection = document.getElementById('cfg-show-grafgrupo').checked;
    ST.settings.showAlertsSection = document.getElementById('cfg-show-alertas').checked;
    sv();
    if (typeof _dashPrefsApplied !== 'undefined') _dashPrefsApplied = false;
    notify('Preferências do Dashboard salvas!');
}


// ============================================================
// 3. FUNÇÕES: ORÇAMENTOS
// ============================================================

function saveBudgets() {
    ST.groups.forEach((g, idx) => {
        const val = parseFloat(document.getElementById('budget-input-' + idx).value);
        if (!isNaN(val) && val > 0) ST.budgets[g] = val;
        else delete ST.budgets[g];
    });
    sv();
    notify('Orçamentos salvos!');
    render();
}


// ============================================================
// 4. FUNÇÕES: DADOS
// ============================================================

function clearAll() {
    confirm2('ATENÇÃO: Isso apagará TODOS os dados permanentemente!', () => {
        ST.expenses = [];
        ST.incomes = [];
        ST.cards = [];
        ST.accounts = [];
        ST.movements = [];
        ST.objectives = [];
        ST.objectiveEntries = [];
        ST.budgets = {};
        sv();
        notify('Dados apagados', 'err');
        render();
    });
}


// ============================================================
// 5. FUNÇÕES: BACKUP (JSON)
// ============================================================

/**
 * Exporta todos os dados como arquivo JSON
 * Diferente do "Exportar CSV" (que é só pra abrir em planilha e não serve
 * pra restaurar), esse backup contém a estrutura completa dos dados —
 * incluindo cartões, contas, patrimônio e configurações — pra permitir
 * restaurar tudo depois (troca de computador, cópia de segurança, etc.).
 * NÃO inclui login/senha (isso mora no backend, não no navegador).
 */
function exportBackupJSON() {
    const backup = {
        _meta: { app: 'FinPessoal', exportedAt: new Date().toISOString() },
        expenses: ST.expenses,
        incomes: ST.incomes,
        cards: ST.cards,
        accounts: ST.accounts,
        movements: ST.movements,
        objectives: ST.objectives,
        objectiveEntries: ST.objectiveEntries,
        budgets: ST.budgets,
        settings: ST.settings,
        groups: ST.groups,
        expStatuses: ST.expStatuses,
        incStatuses: ST.incStatuses
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finpessoal-backup-${dd()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    notify('Backup exportado!');
}

function importBackupJSON(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        let data;
        try {
            data = JSON.parse(e.target.result);
        } catch (err) {
            notify('Arquivo inválido — não é um JSON legível', 'err');
            event.target.value = '';
            return;
        }

        if (!data || typeof data !== 'object' || !Array.isArray(data.expenses)) {
            notify('Esse arquivo não parece ser um backup do FinPessoal', 'err');
            event.target.value = '';
            return;
        }

        confirm2('Isso vai SUBSTITUIR todos os seus dados atuais pelos do arquivo de backup. Não pode ser desfeito. Continuar?', () => {
            ST.expenses = data.expenses || [];
            ST.incomes = data.incomes || [];
            ST.cards = data.cards || [];
            ST.accounts = data.accounts || [];
            ST.movements = data.movements || [];
            ST.objectives = data.objectives || [];
            ST.objectiveEntries = data.objectiveEntries || [];
            ST.budgets = data.budgets || {};
            ST.settings = data.settings || ST.settings;
            if (data.groups && data.groups.length) ST.groups = data.groups;
            if (data.expStatuses && data.expStatuses.length) ST.expStatuses = data.expStatuses;
            if (data.incStatuses && data.incStatuses.length) ST.incStatuses = data.incStatuses;
            sv();
            notify('Backup importado com sucesso!');
            render();
        });
        event.target.value = '';
    };
    reader.readAsText(file);
}