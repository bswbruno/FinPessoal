// FinPessoal v3.0 – Navegação e Layout

let curPage = 'dashboard';

function goTo(page, btn) {
  curPage = page;
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const titles = {
    dashboard:'Dashboard', contas:'Contas Bancárias', pagar:'A Pagar', receber:'A Receber',
    dividas:'Dívidas Parceladas', movimentacoes:'Movimentações', patrimonio:'Patrimônio', agenda:'Agenda Financeira', cartoes:'Cartões',
    relatorios:'Relatórios', configuracoes:'Configurações', suporte:'Suporte'
  };
  document.getElementById('page-title').textContent = titles[page] || page;
  render();
  // Em telas de tablet/celular, fecha o menu lateral após escolher uma página
  // (a função vem de js/ui.js; o "typeof" evita erro caso o arquivo não seja carregado)
  if (typeof closeSidebar === 'function') closeSidebar();
}

function prevMonth() { if(ST.vm===0){ST.vm=11;ST.vy--;}else ST.vm--; updMth(); render(); }
function nextMonth() { if(ST.vm===11){ST.vm=0;ST.vy++;}else ST.vm++; updMth(); render(); }
function goToday()   { ST.vm=today.getMonth(); ST.vy=today.getFullYear(); updMth(); render(); }

function updMth() {
  document.getElementById('month-label').textContent = MONTHS[ST.vm] + ' ' + ST.vy;
  const isCurr = ST.vm===today.getMonth() && ST.vy===today.getFullYear();
  document.getElementById('btn-today').style.display = isCurr ? 'none' : 'block';
  // Badge de atrasados
  const late = mE().filter(isLate).length;
  const nb = document.querySelector('#nav-pagar .nav-badge');
  if (late > 0) {
    if (!nb) { const s=document.createElement('span'); s.className='nav-badge'; s.textContent=late; document.getElementById('nav-pagar').appendChild(s); }
    else nb.textContent = late;
  } else { if(nb) nb.remove(); }
}

function render() {
  updMth();
  if      (curPage==='dashboard')     renderDashboard();
  else if (curPage==='contas')        renderContas();
  else if (curPage==='pagar')         { refreshCardSelect(); renderPagar(); }
  else if (curPage==='receber')       renderReceber();
  else if (curPage==='dividas')       renderDividas();
  else if (curPage==='movimentacoes') renderMovs();
  else if (curPage==='patrimonio')    renderPatrimonio();
  else if (curPage==='agenda')        renderAgenda();
  else if (curPage==='cartoes')       renderCartoes();
  else if (curPage==='relatorios')    renderRelatorios();
  else if (curPage==='configuracoes') renderConfig();
  else if (curPage==='suporte')       renderSuporte();
  refreshIcons();
}
