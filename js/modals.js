
// FinPessoal v5.0 – Configurações e Modais
function renderConfig(){
  const dp = ST.settings.dashDefaultPeriodo || 'mes';
  const showContas = ST.settings.showAccountsSection !== false;
  const showPatrimonio = ST.settings.showPatrimonioSection !== false;
  const showCartoes = ST.settings.showCardsSection !== false;
  const showOrcamento = ST.settings.showBudgetSection !== false;
  const showFatura = ST.settings.showNextInvoiceSection !== false;
  const showGraf6meses = ST.settings.showMonthlyChartSection !== false;
  const showGrafGrupo = ST.settings.showGroupChartSection !== false;
  const showAlertas = ST.settings.showAlertsSection !== false;
  document.getElementById('content').innerHTML=`<div class="settings-card"><h3>Preferências</h3><div class="form-grid"><div class="form-field"><label>Seu nome</label><input type="text" id="cfg-name" value="${ST.settings.name||''}" placeholder="Como prefere ser chamado?"></div><div class="form-field"><label>Meta mensal de economia (R$)</label><input type="number" id="cfg-meta" value="${ST.settings.meta||''}" placeholder="Ex: 500"></div><div class="form-field"><label>Alerta de vencimento (dias antes)</label><input type="number" id="cfg-alert" value="${ST.settings.alertDays||3}" min="1" max="30"></div><div class="form-field" style="display:flex;align-items:flex-end"><button class="btn btn-primary" onclick="saveSettings()">Salvar</button></div></div><p style="font-size:11px;color:var(--text3);margin-top:4px">💡 A Meta Mensal é comparada com o total guardado nos seus Objetivos (Patrimônio) durante o mês, não com o saldo de receitas menos despesas.</p></div>

  <div class="settings-card">
    <h3>Preferências do Dashboard</h3>
    <div class="form-grid">
      <div class="form-field form-full">
        <label>Período padrão ao abrir o Dashboard</label>
        <select id="cfg-dash-periodo">
          <option value="mes" ${dp==='mes'?'selected':''}>Este mês</option>
          <option value="ano" ${dp==='ano'?'selected':''}>Este ano</option>
          <option value="tudo" ${dp==='tudo'?'selected':''}>Todos os períodos</option>
        </select>
      </div>
    </div>
    <p style="font-size:11px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.5px;margin:14px 0 8px">Seções visíveis no Dashboard</p>
    <label style="display:flex;align-items:center;gap:8px;font-size:13px;margin-bottom:8px;cursor:pointer"><input type="checkbox" id="cfg-show-alertas" ${showAlertas?'checked':''}> Alertas de atraso e vencimento</label>
    <label style="display:flex;align-items:center;gap:8px;font-size:13px;margin-bottom:8px;cursor:pointer"><input type="checkbox" id="cfg-show-contas" ${showContas?'checked':''}> Contas Bancárias</label>
    <label style="display:flex;align-items:center;gap:8px;font-size:13px;margin-bottom:8px;cursor:pointer"><input type="checkbox" id="cfg-show-patrimonio" ${showPatrimonio?'checked':''}> Patrimônio</label>
    <label style="display:flex;align-items:center;gap:8px;font-size:13px;margin-bottom:8px;cursor:pointer"><input type="checkbox" id="cfg-show-orcamento" ${showOrcamento?'checked':''}> Orçamento por Categoria (card + alertas de 80%/estourado)</label>
    <label style="display:flex;align-items:center;gap:8px;font-size:13px;margin-bottom:8px;cursor:pointer"><input type="checkbox" id="cfg-show-fatura" ${showFatura?'checked':''}> Próximos Vencimentos (faturas de cartão e contas a pagar)</label>
    <label style="display:flex;align-items:center;gap:8px;font-size:13px;margin-bottom:8px;cursor:pointer"><input type="checkbox" id="cfg-show-cartoes" ${showCartoes?'checked':''}> Meus Cartões</label>
    <label style="display:flex;align-items:center;gap:8px;font-size:13px;margin-bottom:8px;cursor:pointer"><input type="checkbox" id="cfg-show-graf6" ${showGraf6meses?'checked':''}> Gráfico "Últimos 6 meses"</label>
    <label style="display:flex;align-items:center;gap:8px;font-size:13px;margin-bottom:12px;cursor:pointer"><input type="checkbox" id="cfg-show-grafgrupo" ${showGrafGrupo?'checked':''}> Gráfico "Gastos por grupo"</label>
    <button class="btn btn-primary" onclick="saveDashPrefs()">${icon('check')} Salvar preferências</button>
  </div>

  <div class="settings-card">
    <h3>Privacidade</h3>
    <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer"><input type="checkbox" id="cfg-hide-values" ${ST.settings.hideValues?'checked':''} onchange="toggleHideValues()"> Ocultar valores monetários (mostra "R$ •••••" em vez dos números)</label>
    <p style="font-size:11px;color:var(--text3);margin-top:8px">💡 Você também pode ligar/desligar isso rapidinho pelo ícone de olho na barra superior — os dois ficam sempre sincronizados.</p>
  </div>

  <div class="settings-card">
    <h3>Orçamento por Categoria</h3>
    <p style="font-size:12px;color:var(--text2);margin-bottom:8px">Isso é um <strong>teto de gasto por categoria</strong>, de forma geral — não é ligado a nenhuma conta bancária específica nem ao seu saldo disponível. Funciona assim: some quanto você já gastou naquele grupo (em qualquer conta, cartão ou dinheiro) durante o mês e compara com o limite abaixo.</p>
    <p style="font-size:11px;color:var(--text3);margin-bottom:12px">Deixe em branco ou zerado pra não ter limite naquele grupo. Você recebe um aviso ao chegar em 80% do limite, e outro ao ultrapassar — ambos aparecem no Dashboard (dá pra desligar em "Preferências do Dashboard" acima, no item "Orçamento por Categoria").</p>
    <div style="display:flex;flex-direction:column;gap:8px">
      ${ST.groups.map((g,idx)=>{const spent=budgetSpentForGroup(g);return`<div style="display:flex;align-items:center;gap:10px"><span style="flex:1;font-size:13px">${g}${ST.budgets[g]?`<span style="color:var(--text3);font-size:11px"> — gasto este mês: ${fmt(spent)}</span>`:''}</span><input type="number" id="budget-input-${idx}" data-grp="${g}" value="${ST.budgets[g]||''}" placeholder="Sem limite" min="0" step="0.01" style="width:140px;padding:6px 10px;border:1px solid var(--border);border-radius:var(--radius);background:var(--bg2);color:var(--text);font-family:inherit;font-size:13px"></div>`;}).join('')}
    </div>
    <button class="btn btn-primary" style="margin-top:14px" onclick="saveBudgets()">${icon('check')} Salvar orçamentos</button>
  </div>

  ${renderCategoriasCard()}<div class="settings-card"><h3>Seus Dados</h3><div class="sum-row"><span style="color:var(--text2)">Despesas registradas</span><strong>${ST.expenses.length}</strong></div><div class="sum-row"><span style="color:var(--text2)">Receitas registradas</span><strong>${ST.incomes.length}</strong></div><div class="sum-row"><span style="color:var(--text2)">Cartões cadastrados</span><strong>${ST.cards.length}</strong></div><div class="sum-row"><span style="color:var(--text2)">Contas bancárias cadastradas</span><strong>${ST.accounts.length}</strong></div><div class="sum-row"><span style="color:var(--text2)">Objetivos de patrimônio</span><strong>${ST.objectives.length}</strong></div><div class="sum-row"><span style="color:var(--text2)">Armazenamento</span><span style="font-size:11px;color:var(--text3)">localStorage (este navegador)</span></div><p style="font-size:11px;color:var(--text3);margin-top:10px">💾 O Backup (JSON) salva TUDO e permite restaurar depois — útil pra trocar de computador ou ter uma cópia de segurança. O CSV é só pra abrir em planilha, não serve pra restaurar.</p><input type="file" id="backup-file-input" accept=".json,application/json" style="display:none" onchange="importBackupJSON(event)"><div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-primary" onclick="exportBackupJSON()">${icon('download')} Exportar Backup (JSON)</button><button class="btn" onclick="document.getElementById('backup-file-input').click()">${icon('upload')} Importar Backup</button><button class="btn" onclick="exportCSV(true)">${icon('file-down')} Exportar CSV</button><button class="btn" style="color:var(--red);border-color:rgba(239,68,68,.3)" onclick="clearAll()">Apagar todos os dados</button></div></div>

  <div class="settings-card" style="border:1px dashed var(--purple)">
    <h3>${icon('sparkles','ic-inline')} Dados de Demonstração</h3>
    <p style="font-size:12px;color:var(--text2);margin-bottom:12px">Preenche o app inteiro com dados <strong>fictícios</strong> (contas, cartões, despesas, receitas, patrimônio, orçamentos) — pronto pra tirar prints ou gravar um vídeo pro seu portfólio, sem expor números reais.</p>
    <p style="font-size:11px;color:var(--red);margin-bottom:12px">⚠️ Isso substitui os dados atuais. Se tiver dados reais, exporte um Backup (acima) antes de usar.</p>
    <button class="btn btn-primary" onclick="seedDemoData()">${icon('sparkles')} Preencher com dados fictícios</button>
  </div>

  <div class="settings-card" style="border:1px dashed var(--border)"><h3 style="color:var(--text3)">FinPessoal v5.0</h3><p style="font-size:12px;color:var(--text3);line-height:1.8">Sistema financeiro pessoal · Uso local neste navegador<br>Todos os dados ficam salvos apenas neste dispositivo<br>Sem servidor, sem internet obrigatória</p></div>`;
}
function saveBudgets(){
  ST.groups.forEach((g,idx)=>{
    const val = parseFloat(document.getElementById('budget-input-'+idx).value);
    if(!isNaN(val) && val>0) ST.budgets[g]=val;
    else delete ST.budgets[g];
  });
  sv();
  notify('Orçamentos salvos!');
  render();
}
function saveDashPrefs(){
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
function saveSettings(){ST.settings.name=document.getElementById('cfg-name').value;ST.settings.meta=document.getElementById('cfg-meta').value;ST.settings.alertDays=+document.getElementById('cfg-alert').value||3;sv();notify('Configurações salvas!');document.getElementById('sidebar-footer').textContent=ST.settings.name?'Olá, '+ST.settings.name:'FinPessoal v5.0';}
function clearAll(){confirm2('ATENÇÃO: Isso apagará TODOS os dados permanentemente!',()=>{ST.expenses=[];ST.incomes=[];ST.cards=[];ST.accounts=[];ST.movements=[];ST.objectives=[];ST.objectiveEntries=[];ST.budgets={};sv();notify('Dados apagados','err');render();});}

/* ----------------------------------------------------------------------
   BACKUP (Exportar/Importar tudo em JSON)
   ------------------------------------------------------------------------
   Diferente do "Exportar CSV" (que é só pra abrir em planilha e não serve
   pra restaurar), esse backup contém a estrutura completa dos dados —
   incluindo cartões, contas, patrimônio e configurações — pra permitir
   restaurar tudo depois (troca de computador, cópia de segurança, etc.).
   NÃO inclui login/senha (isso mora no backend, não no navegador).
------------------------------------------------------------------------ */
function exportBackupJSON(){
  const backup = {
    _meta: { app:'FinPessoal', exportedAt:new Date().toISOString() },
    expenses: ST.expenses, incomes: ST.incomes, cards: ST.cards, accounts: ST.accounts, movements: ST.movements,
    objectives: ST.objectives, objectiveEntries: ST.objectiveEntries, budgets: ST.budgets, settings: ST.settings,
    groups: ST.groups, expStatuses: ST.expStatuses, incStatuses: ST.incStatuses
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], {type:'application/json'});
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

function importBackupJSON(event){
  const file = event.target.files && event.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    let data;
    try { data = JSON.parse(e.target.result); }
    catch(err){ notify('Arquivo inválido — não é um JSON legível','err'); event.target.value=''; return; }
    if(!data || typeof data!=='object' || !Array.isArray(data.expenses)){
      notify('Esse arquivo não parece ser um backup do FinPessoal','err');
      event.target.value=''; return;
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
      if(data.groups && data.groups.length) ST.groups = data.groups;
      if(data.expStatuses && data.expStatuses.length) ST.expStatuses = data.expStatuses;
      if(data.incStatuses && data.incStatuses.length) ST.incStatuses = data.incStatuses;
      sv();
      notify('Backup importado com sucesso!');
      render();
    });
    event.target.value='';
  };
  reader.readAsText(file);
}
