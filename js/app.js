/* =============================================
   FinPessoal – Controlador Principal (app.js)
   ============================================= */

var _curPage = 'dashboard';

/* Navegação entre páginas */
function goTo(page, btn) {
  _curPage = page;
  document.querySelectorAll('.nav-item').forEach(function(b) { b.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  var titles = {
    dashboard:     'Dashboard',
    pagar:         'A Pagar',
    receber:       'A Receber',
    dividas:       'Dívidas Parceladas',
    cartoes:       'Cartões',
    relatorios:    'Relatórios',
    configuracoes: 'Configurações'
  };
  document.getElementById('page-title').textContent = titles[page] || page;
  render();
}

/* Navegação de mês */
function prevMonth() {
  if (ST.vm === 0) { ST.vm = 11; ST.vy--; } else ST.vm--;
  updateMonthUI(); render();
}
function nextMonth() {
  if (ST.vm === 11) { ST.vm = 0; ST.vy++; } else ST.vm++;
  updateMonthUI(); render();
}
function goToday() {
  ST.vm = today.getMonth();
  ST.vy = today.getFullYear();
  updateMonthUI(); render();
}

/* Atualiza label do mês e badge de atraso */
function updateMonthUI() {
  document.getElementById('month-label').textContent = MONTHS[ST.vm] + ' ' + ST.vy;
  var isCurr = ST.vm === today.getMonth() && ST.vy === today.getFullYear();
  document.getElementById('btn-today').style.display = isCurr ? 'none' : 'block';

  var lateCount = mE().filter(isLate).length;
  var nb = document.querySelector('#nav-pagar .nav-badge');
  if (lateCount > 0) {
    if (!nb) {
      var s = document.createElement('span');
      s.className = 'nav-badge';
      s.textContent = lateCount;
      document.getElementById('nav-pagar').appendChild(s);
    } else { nb.textContent = lateCount; }
  } else {
    if (nb) nb.remove();
  }
}

/* Renderiza a página atual */
function render() {
  updateMonthUI();
  if      (_curPage === 'dashboard')     renderDashboard();
  else if (_curPage === 'pagar')         { refreshCardSelect(); renderPagar(); }
  else if (_curPage === 'receber')       renderReceber();
  else if (_curPage === 'dividas')       renderDividas();
  else if (_curPage === 'cartoes')       renderCartoes();
  else if (_curPage === 'relatorios')    renderRelatorios();
  else if (_curPage === 'configuracoes') renderConfig();
}

/* Página de configurações */
function renderConfig() {
  var s = ST.settings;
  document.getElementById('content').innerHTML =
    '<div class="settings-card">' +
      '<h3>Preferências</h3>' +
      '<div class="form-grid">' +
        '<div class="form-field"><label>Seu nome</label>' +
          '<input type="text" id="cfg-name" value="' + (s.name || '') + '" placeholder="Como prefere ser chamado?"></div>' +
        '<div class="form-field"><label>Meta mensal de economia (R$)</label>' +
          '<input type="number" id="cfg-meta" value="' + (s.meta || '') + '" placeholder="Ex: 500,00"></div>' +
        '<div class="form-field"><label>Alerta de vencimento (dias antes)</label>' +
          '<input type="number" id="cfg-alert" value="' + (s.alertDays || 3) + '" min="1" max="30"></div>' +
        '<div class="form-field" style="display:flex;align-items:flex-end">' +
          '<button class="btn btn-primary" onclick="saveSettings()">Salvar Configurações</button></div>' +
      '</div>' +
    '</div>' +
    '<div class="settings-card">' +
      '<h3>Seus Dados</h3>' +
      '<div class="sum-row"><span style="color:var(--text2)">Despesas registradas</span><strong>' + ST.expenses.length + '</strong></div>' +
      '<div class="sum-row"><span style="color:var(--text2)">Receitas registradas</span><strong>' + ST.incomes.length + '</strong></div>' +
      '<div class="sum-row"><span style="color:var(--text2)">Cartões cadastrados</span><strong>' + ST.cards.length + '</strong></div>' +
      '<div class="sum-row"><span style="color:var(--text2)">Armazenamento</span><span style="font-size:11px;color:var(--text3)">localStorage (este navegador)</span></div>' +
      '<div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap">' +
        '<button class="btn" onclick="exportCSV(true)">&#8675; Exportar todos os dados (CSV)</button>' +
        '<button class="btn" style="color:var(--red);border-color:rgba(239,68,68,.3)" onclick="clearAllData()">Apagar todos os dados</button>' +
      '</div>' +
    '</div>' +
    '<div class="settings-card" style="border:1px dashed var(--border)">' +
      '<h3 style="color:var(--text3)">FinPessoal v2.0</h3>' +
      '<p style="font-size:12px;color:var(--text3);line-height:1.8">' +
        'Sistema financeiro pessoal · Uso local no navegador<br>' +
        'Todos os dados ficam salvos apenas neste dispositivo<br>' +
        'Nenhum dado é enviado para servidores externos' +
      '</p>' +
    '</div>';
}

function saveSettings() {
  ST.settings.name      = document.getElementById('cfg-name').value;
  ST.settings.meta      = document.getElementById('cfg-meta').value;
  ST.settings.alertDays = +document.getElementById('cfg-alert').value || 3;
  sv();
  notify('Configurações salvas!');
  document.getElementById('sidebar-footer').textContent =
    ST.settings.name ? 'Olá, ' + ST.settings.name : 'FinPessoal v2.0';
}

function clearAllData() {
  confirm2('ATENÇÃO: isso apagará TODOS os dados permanentemente. Tem certeza?', function() {
    ST.expenses = []; ST.incomes = []; ST.cards = [];
    sv(); notify('Todos os dados foram apagados', 'err'); render();
  });
}

/* ---- INICIALIZAÇÃO ---- */
(function init() {
  ld();
  seedDemoData(true);
  return;
  buildSwatches(_selectedColor);
  updateMonthUI();
  if (ST.settings.name) {
    document.getElementById('sidebar-footer').textContent = 'Olá, ' + ST.settings.name;
  }
  render();
})();
