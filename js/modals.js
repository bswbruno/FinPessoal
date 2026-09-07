/**
 * ============================================================
 * FinPessoal v10.1 – Configurações e Modais
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
                <span class="config-storage">Firebase (nuvem)</span>
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
            <h3>FinPessoal v10.1</h3>
            <p>Sistema financeiro pessoal · Sincronizado na nuvem<br>Seus dados ficam salvos no Firebase<br>Acesse de qualquer dispositivo</p>
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
    document.getElementById('sidebar-footer').textContent = ST.settings.name ? 'Olá, ' + ST.settings.name : 'FinPessoal v10.1';
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
    confirmarComModal(
        '⚠️ <strong>ATENÇÃO:</strong><br>Isso apagará <strong>TODOS</strong> os dados permanentemente!<br><span style="font-size:12px;color:var(--text3);">Esta ação não pode ser desfeita.</span>',
        function() {
            ST.expenses = [];
            ST.incomes = [];
            ST.cards = [];
            ST.accounts = [];
            ST.movements = [];
            ST.objectives = [];
            ST.objectiveEntries = [];
            ST.budgets = {};
            sv();
            alertarComModal('Dados apagados com sucesso!', 'success');
            render();
        },
        'Apagar tudo',
        'btn-danger'
    );
}

// ============================================================
// 5. FUNÇÕES: BACKUP (JSON)
// ============================================================

/**
 * Exporta todos os dados como arquivo JSON
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
            alertarComModal('Arquivo inválido — não é um JSON legível', 'error');
            event.target.value = '';
            return;
        }

        if (!data || typeof data !== 'object' || !Array.isArray(data.expenses)) {
            alertarComModal('Esse arquivo não parece ser um backup do FinPessoal', 'error');
            event.target.value = '';
            return;
        }

        confirmarComModal(
            'Isso vai <strong>SUBSTITUIR</strong> todos os seus dados atuais pelos do arquivo de backup.<br><span style="font-size:12px;color:var(--text3);">Não pode ser desfeito.</span>',
            function() {
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
                alertarComModal('Backup importado com sucesso!', 'success');
                render();
            },
            'Importar',
            'btn-primary'
        );
        event.target.value = '';
    };
    reader.readAsText(file);
}

// ============================================================
// 6. MODAL DE BOAS-VINDAS COM TUTORIAL
// ============================================================

const WELCOME_SEEN_KEY = 'fp-welcome-seen';

// Slides do tutorial
const welcomeSlides = [
    {
        icon: '📊',
        title: 'Bem-vindo ao FinPessoal!',
        text: 'Gerencie suas finanças pessoais de forma simples e intuitiva. Acompanhe receitas, despesas, cartões e muito mais.'
    },
    {
        icon: '💰',
        title: 'Dashboard',
        text: 'Veja um resumo completo das suas finanças: receitas, despesas, saldo e metas de economia em um só lugar.'
    },
    {
        icon: '📝',
        title: 'Adicionar Despesas e Receitas',
        text: 'Clique no botão "+" ou vá em "A Pagar" e "A Receber" para registrar seus lançamentos financeiros.'
    },
    {
        icon: '💳',
        title: 'Cartões e Contas',
        text: 'Cadastre seus cartões de crédito e contas bancárias para ter um controle completo do seu patrimônio.'
    },
    {
        icon: '☁️',
        title: 'Sincronização na Nuvem',
        text: 'Seus dados ficam salvos na nuvem (Firebase). Acesse de qualquer dispositivo com sua conta.'
    },
    {
        icon: '🚀',
        title: 'Pronto para Começar!',
        text: 'Você já pode começar a organizar suas finanças. Divirta-se!'
    }
];

let welcomeSlideAtual = 0;
const welcomeTotalSlides = welcomeSlides.length;

function maybeShowWelcomeModal() {
    // Verifica se já foi mostrado neste navegador
    if (localStorage.getItem(WELCOME_SEEN_KEY)) {
        console.log('ℹ️ Welcome modal já foi mostrado');
        return;
    }
    
    // Verifica se o usuário já tem dados
    const temDados = (ST.expenses && ST.expenses.length > 0) || 
                     (ST.incomes && ST.incomes.length > 0) || 
                     (ST.cards && ST.cards.length > 0);
    
    if (temDados) {
        // Se já tem dados, não mostra o modal
        localStorage.setItem(WELCOME_SEEN_KEY, '1');
        console.log('ℹ️ Usuário já tem dados, pulando welcome modal');
        return;
    }
    
    // Mostra o modal apenas se for o primeiro acesso E não tiver dados
    console.log('👋 Mostrando welcome modal (primeiro acesso)');
    welcomeSlideAtual = 0;
    openModal('modal-welcome');
    atualizarWelcomeSlide();
}

function closeWelcomeModal() {
    localStorage.setItem(WELCOME_SEEN_KEY, '1');
    closeModal('modal-welcome');
}

function atualizarWelcomeSlide() {
    const slide = welcomeSlides[welcomeSlideAtual];
    const total = welcomeTotalSlides;
    
    const iconEl = document.getElementById('welcome-icon');
    const titleEl = document.getElementById('welcome-title');
    const textEl = document.getElementById('welcome-text');
    const counterEl = document.getElementById('welcome-counter');
    const prevBtn = document.getElementById('welcome-prev');
    const nextBtn = document.getElementById('welcome-next');
    
    if (iconEl) iconEl.textContent = slide.icon;
    if (titleEl) titleEl.textContent = slide.title;
    if (textEl) textEl.textContent = slide.text;
    if (counterEl) counterEl.textContent = (welcomeSlideAtual + 1) + ' / ' + total;
    
    // Atualiza os dots
    const dots = document.querySelectorAll('.welcome-dot');
    dots.forEach(function(dot, index) {
        if (index === welcomeSlideAtual) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
    
    // Atualiza visibilidade dos botoes
    if (prevBtn) {
        prevBtn.style.display = welcomeSlideAtual === 0 ? 'none' : 'inline-flex';
    }
    if (nextBtn) {
        nextBtn.textContent = welcomeSlideAtual === total - 1 ? 'Começar' : 'Próximo';
    }
}

function welcomeProximo() {
    if (welcomeSlideAtual < welcomeTotalSlides - 1) {
        welcomeSlideAtual++;
        atualizarWelcomeSlide();
    } else {
        // Último slide - fecha o modal
        closeWelcomeModal();
    }
}

function welcomeAnterior() {
    if (welcomeSlideAtual > 0) {
        welcomeSlideAtual--;
        atualizarWelcomeSlide();
    }
}

function welcomePular() {
    closeWelcomeModal();
}

// ============================================================
// FUNÇÕES DE CONFIRMAÇÃO COM MODAL
// ============================================================

/**
 * Exibe um modal de confirmação com botões personalizados
 * @param {string} mensagem - Texto da mensagem
 * @param {Function} onConfirm - Função executada ao clicar em "Confirmar"
 * @param {string} btnText - Texto do botão confirmar (padrão: "Confirmar")
 * @param {string} btnClass - Classe do botão confirmar (padrão: "btn-primary")
 */
function confirmarComModal(mensagem, onConfirm, btnText = 'Confirmar', btnClass = 'btn-primary') {
    const msgEl = document.getElementById('confirm-msg');
    const okBtn = document.getElementById('confirm-ok-btn');
    
    if (!msgEl || !okBtn) {
        // Fallback: usa o confirm nativo se o modal não existir
        if (confirm(mensagem)) {
            if (onConfirm) onConfirm();
        }
        return;
    }
    
    // Define a mensagem
    msgEl.innerHTML = mensagem;
    
    // Define o texto e a classe do botão
    okBtn.textContent = btnText;
    okBtn.className = 'btn ' + btnClass;
    
    // Remove listeners anteriores (clona e substitui)
    const newOkBtn = okBtn.cloneNode(true);
    okBtn.parentNode.replaceChild(newOkBtn, okBtn);
    
    // Adiciona o listener
    newOkBtn.addEventListener('click', function() {
        closeModal('modal-confirm');
        if (onConfirm) onConfirm();
    });
    
    // Abre o modal
    openModal('modal-confirm');
}

/**
 * Exibe um modal de alerta simples (apenas OK)
 * @param {string} mensagem - Texto da mensagem
 * @param {string} tipo - 'info' | 'success' | 'error' | 'warning'
 */
function alertarComModal(mensagem, tipo = 'info') {
    const msgEl = document.getElementById('confirm-msg');
    const okBtn = document.getElementById('confirm-ok-btn');
    
    if (!msgEl || !okBtn) {
        alert(mensagem);
        return;
    }
    
    // Define os emojis conforme o tipo
    const emojis = {
        info: 'ℹ️',
        success: '✅',
        error: '❌',
        warning: '⚠️'
    };
    
    // Define as cores conforme o tipo
    const cores = {
        info: 'var(--blue)',
        success: 'var(--green)',
        error: 'var(--red)',
        warning: 'var(--amber)'
    };
    
    // Define a mensagem com ícone
    msgEl.innerHTML = `<span style="font-size:24px;display:block;margin-bottom:8px;">${emojis[tipo] || 'ℹ️'}</span>
                       <span style="color:${cores[tipo] || 'var(--text)'};">${mensagem}</span>`;
    
    // Configura o botão
    okBtn.textContent = 'OK';
    okBtn.className = 'btn btn-primary';
    
    // Remove listeners anteriores
    const newOkBtn = okBtn.cloneNode(true);
    okBtn.parentNode.replaceChild(newOkBtn, okBtn);
    
    // Adiciona o listener para fechar
    newOkBtn.addEventListener('click', function() {
        closeModal('modal-confirm');
    });
    
    // Abre o modal
    openModal('modal-confirm');
}

// Exporta para o escopo global
window.maybeShowWelcomeModal = maybeShowWelcomeModal;
window.closeWelcomeModal = closeWelcomeModal;
window.welcomeProximo = welcomeProximo;
window.welcomeAnterior = welcomeAnterior;
window.welcomePular = welcomePular;