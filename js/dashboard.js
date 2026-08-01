
// FinPessoal v5.0 – Dashboard
//
// Filtros do Dashboard (não persistem entre sessões, resetam a cada
// carregamento — são só uma lente temporária de visualização):
let dashPeriodo = 'mes';     // 'mes' | 'ano' | 'tudo'
let _dashPrefsApplied = false; // evita reaplicar o período padrão a cada re-render
let dashFiltAccount = '';
let dashFiltCard = '';
let dashFiltGrupo = '';
let dashFiltStatus = '';

// Conjunto de despesas/receitas dentro do período escolhido (antes dos
// demais filtros). "mes" usa o mês/ano navegado na topbar (mE()/mI()); "ano"
// pega o ano inteiro navegado; "tudo" ignora período e pega o histórico todo.
function dashPeriodExpenses(){
  if(dashPeriodo==='ano') return ST.expenses.filter(x=>{const d=toDate(x.date);return d&&d.getFullYear()===ST.vy;});
  if(dashPeriodo==='tudo') return ST.expenses.slice();
  return mE();
}
function dashPeriodIncomes(){
  if(dashPeriodo==='ano') return ST.incomes.filter(x=>{const d=toDate(x.date);return d&&d.getFullYear()===ST.vy;});
  if(dashPeriodo==='tudo') return ST.incomes.slice();
  return mI();
}
// Aplica os filtros de conta/cartão/categoria/status por cima do período.
function dashFilteredExpenses(){
  let arr=dashPeriodExpenses();
  if(dashFiltCard)   arr=arr.filter(x=>x.cardId===dashFiltCard);
  if(dashFiltGrupo)  arr=arr.filter(x=>x.grp===dashFiltGrupo);
  if(dashFiltStatus) arr=arr.filter(x=>dashFiltStatus==='atrasado'?isLate(x):x.status===dashFiltStatus);
  if(dashFiltAccount){
    // Despesas não guardam a conta diretamente — o vínculo só existe na
    // movimentação criada no momento do pagamento (ver js/receipts.js).
    const linkedIds=new Set(ST.movements.filter(m=>m.accountId===dashFiltAccount&&m.linkedId).map(m=>m.linkedId));
    arr=arr.filter(x=>linkedIds.has(x.id));
  }
  return arr;
}
function dashFilteredIncomes(){
  let arr=dashPeriodIncomes();
  if(dashFiltStatus) arr=arr.filter(x=>x.status===dashFiltStatus);
  return arr;
}
function setDashFilter(field,value){
  if(field==='periodo') dashPeriodo=value;
  else if(field==='conta') dashFiltAccount=value;
  else if(field==='cartao') dashFiltCard=value;
  else if(field==='grupo') dashFiltGrupo=value;
  else if(field==='status') dashFiltStatus=value;
  renderDashboard();
}
function clearDashFilters(){
  dashPeriodo='mes';dashFiltAccount='';dashFiltCard='';dashFiltGrupo='';dashFiltStatus='';
  renderDashboard();
}
function sectionIsCollapsed(key){
  return ST.settings.dashboardCollapsed && ST.settings.dashboardCollapsed[key];
}
function toggleDashboardSection(key){
  if(!ST.settings.dashboardCollapsed || typeof ST.settings.dashboardCollapsed !== 'object') ST.settings.dashboardCollapsed={};
  ST.settings.dashboardCollapsed[key] = !ST.settings.dashboardCollapsed[key];
  sv();
  renderDashboard();
}
function renderDashboardSection(id,title,subtitle,body,style=''){
  const collapsed = sectionIsCollapsed(id);
  return `<div class="chart-card" style="${style}" data-dashboard-section="${id}">
    <div class="chart-card-header">
      <div><div class="chart-title">${title}${subtitle?` <span style="font-weight:400;color:var(--text3);font-size:10px">${subtitle}</span>`:''}</div></div>
      <button class="chart-card-toggle" onclick="toggleDashboardSection('${id}')">${icon(collapsed?'chevron-down':'chevron-up','ic-inline')} ${collapsed?'Expandir':'Ocultar'}</button>
    </div>
    <div class="chart-card-body${collapsed?' collapsed':''}">${body}</div>
  </div>`;
}

function renderDashboard(){
  // Aplica o período padrão salvo em Configurações → Preferências do
  // Dashboard, só na primeira vez (depois disso o usuário pode trocar
  // livremente pelos filtros, sem ficar voltando sozinho a cada clique).
  if(!_dashPrefsApplied){ dashPeriodo = ST.settings.dashDefaultPeriodo || 'mes'; _dashPrefsApplied = true; }
  // "e"/"i" continuam sendo o mês navegado — usados nos alertas de atraso e
  // vencimento, que devem sempre refletir a realidade de verdade (segurança
  // em primeiro lugar), independente dos filtros de visualização abaixo.
  const e=mE(),i=mI();
  const late=e.filter(isLate),meta=+ST.settings.meta||0,ad=+ST.settings.alertDays||3;
  const upcoming=e.filter(x=>{if(x.status==='pago')return false;const d=toDate(x.date);if(!d)return false;return(d-today)/86400000>=0&&(d-today)/86400000<=ad;}).sort((a,b)=>new Date(a.date)-new Date(b.date));
  let alerts='';
  if(ST.settings.showAlertsSection!==false){
    if(late.length)alerts+=`<div class="alert-box alert-danger"><h4>${icon('alert-triangle','ic-inline')} ${late.length} item${late.length>1?'ns':''} em atraso</h4>${late.slice(0,4).map(x=>`<div class="alert-row"><span>${x.desc}</span><span>${fmt(x.value)}</span></div>`).join('')}</div>`;
    if(upcoming.length)alerts+=`<div class="alert-box alert-warning"><h4>${icon('bell','ic-inline')} Vencendo nos próximos ${ad} dias</h4>${upcoming.slice(0,4).map(x=>`<div class="alert-row"><span>${x.desc} – ${fmtD(x.date)}</span><span>${fmt(x.value)}</span></div>`).join('')}</div>`;
  }
  // Orçamento por categoria: sempre calculado sobre o mês real navegado
  // (ST.vy/ST.vm), independente dos filtros do Dashboard — mesma lógica de
  // segurança dos alertas de atraso/vencimento acima.
  const budgets=budgetStatusList();
  if(ST.settings.showBudgetSection!==false){
    const overBudgets=budgets.filter(b=>b.over), warnBudgets=budgets.filter(b=>b.warn);
    if(overBudgets.length)alerts+=`<div class="alert-box alert-danger"><h4>${icon('alert-triangle','ic-inline')} Orçamento estourado</h4>${overBudgets.map(b=>`<div class="alert-row"><span>${b.grp}</span><span>${fmt(b.spent)} / ${fmt(b.limit)}</span></div>`).join('')}</div>`;
    if(warnBudgets.length)alerts+=`<div class="alert-box alert-warning"><h4>${icon('bell','ic-inline')} Perto do limite do orçamento (80%+)</h4>${warnBudgets.map(b=>`<div class="alert-row"><span>${b.grp}</span><span>${fmt(b.spent)} / ${fmt(b.limit)}</span></div>`).join('')}</div>`;
  }

  // A partir daqui, tudo usa o conjunto FILTRADO (período + conta/cartão/categoria/status).
  const fe=dashFilteredExpenses(), fi=dashFilteredIncomes();
  const tp=fe.reduce((s,x)=>s+(+x.value||0),0), tr=fi.reduce((s,x)=>s+(+x.value||0),0);
  // Considera pagamentos parciais: uma despesa "pendente" com paidAmount>0
  // já teve parte do valor paga, então isso conta como "já pago" também.
  const pg=fe.reduce((s,x)=>s+(x.status==='pago'?(+x.value||0):(+x.paidAmount||0)),0);
  const restante=tp-pg, emDia=tp>0&&restante<=0;
  const saldo=tr-tp;

  const hist=Array.from({length:6},(_,idx)=>{let m=ST.vm-5+idx,y=ST.vy;while(m<0){m+=12;y--;}while(m>11){m-=12;y++;}
    return{name:MONTHS[m].slice(0,3),a:Math.round(ST.incomes.filter(x=>{const d=toDate(x.date);return d&&d.getMonth()===m&&d.getFullYear()===y;}).reduce((s,x)=>s+(+x.value||0),0)),b:Math.round(ST.expenses.filter(x=>{const d=toDate(x.date);return d&&d.getMonth()===m&&d.getFullYear()===y;}).reduce((s,x)=>s+(+x.value||0),0))};});
  const pd=ST.groups.map(g=>({name:g,v:Math.round(fe.filter(x=>x.grp===g).reduce((s,x)=>s+(+x.value||0),0))})).filter(g=>g.v>0);

  // Meta Mensal: sempre o mês de verdade navegado (não segue o filtro de
  // período do dashboard, pois é uma meta mensal por definição).
  const guardadoNoMes=patrimonioGuardadoNoMes(ST.vy,ST.vm);
  const metaKPI=meta>0?`<div class="kpi" style="border-left-color:${guardadoNoMes>=meta?'var(--green)':'var(--amber)'}"><div class="kpi-label">Meta Economia do Mês</div><div class="kpi-value" style="color:${guardadoNoMes>=meta?'var(--green)':'var(--amber)'}">${fmt(guardadoNoMes)}</div><div class="kpi-sub">${guardadoNoMes>=meta?icon('check','ic-inline')+' Meta de '+fmt(meta)+' atingida':'Faltam '+fmt(meta-guardadoNoMes)+' de '+fmt(meta)}</div></div>`:`<div class="kpi" style="border-left-color:var(--text3)"><div class="kpi-label">Já Pago</div><div class="kpi-value" style="color:var(--text2)">${fmt(pg)}</div><div class="kpi-sub">de ${fmt(tp)}</div></div>`;

  // Card de Despesas reformulado: destaque pro que falta pagar; se já
  // quitou tudo (e existia despesa no período), mensagem de parabéns.
  const despesasCard = tp===0
    ? `<div class="kpi" style="border-left-color:var(--text3)"><div class="kpi-label">Despesas</div><div class="kpi-value" style="color:var(--text3);font-size:15px">Nenhuma despesa</div><div class="kpi-sub">no período selecionado</div></div>`
    : emDia
    ? `<div class="kpi" style="border-left-color:var(--green)"><div class="kpi-label">Despesas</div><div class="kpi-value" style="color:var(--green);font-size:15px">&#127881; Você está em dia!</div><div class="kpi-sub">Total do período: ${fmt(tp)}</div></div>`
    : `<div class="kpi" style="border-left-color:var(--red)"><div class="kpi-label">Restante a Pagar</div><div class="kpi-value" style="color:var(--red)">${fmt(restante)}</div><div class="kpi-sub">Total: ${fmt(tp)} · Já pago: ${fmt(pg)}</div></div>`;

  const cardsHTML=(ST.settings.showCardsSection!==false && ST.cards.length)?`<div class="chart-card" style="grid-column:span 2"><div class="chart-title">Meus Cartões</div><div class="scroll-row">${ST.cards.map(c=>{const used=cardCommitted(c.id);const pct=c.limit>0?Math.min(100,(used/c.limit)*100):0;return`<div style="background:linear-gradient(135deg,${c.color}ee,${c.color}99);border-radius:10px;padding:12px 16px;color:#fff;min-width:160px;flex:0 0 auto;max-width:220px;"><div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="font-weight:600;font-size:13px">${c.name}</span><span style="font-size:10px;opacity:.7">${c.brand||''}</span></div><div style="font-size:11px;opacity:.7;margin-bottom:8px;letter-spacing:1px">•••• ${c.digits||'****'}</div><div style="background:rgba(0,0,0,.2);border-radius:2px;height:3px;margin-bottom:4px"><div style="background:rgba(255,255,255,.85);width:${pct}%;height:100%;border-radius:2px"></div></div><div style="display:flex;justify-content:space-between;font-size:10px"><span>${fmt(c.limit)}</span><span>${Math.round(pct)}% comprometido</span></div></div>`;}).join('')}</div></div>`:'';
  const ativas=ST.accounts.filter(a=>a.status!=='inativa');
  const accountsBody = `${ativas.length?`<div style="display:flex;gap:10px;flex-wrap:wrap;">${ativas.map(a=>`<div style="background:linear-gradient(135deg,${a.color}ee,${a.color}99);border-radius:10px;padding:12px 16px;color:#fff;min-width:160px;flex:1;max-width:220px;"><div style="font-weight:600;font-size:13px;margin-bottom:6px">${a.name}</div><div style="font-size:11px;opacity:.7;margin-bottom:8px">${a.bank||'—'}</div><div style="font-size:16px;font-weight:800">${fmt(accountBalance(a.id))}</div></div>`).join('')}</div><div style="text-align:right;margin-top:10px;font-size:12px;color:var(--text2)">Total: <strong style="color:var(--purple)">${fmt(totalSaldoContas())}</strong></div>`:`<div class="empty" style="padding:24px">Nenhuma conta cadastrada. <span style="color:var(--purple);cursor:pointer;text-decoration:underline" onclick="goTo('contas')">Cadastrar agora</span></div>`}`;
  const accountsHTML = ST.settings.showAccountsSection===false ? '' : renderDashboardSection('contas','Contas Bancárias','(saldo)',accountsBody,'grid-column:span 2');
  const patrimonioBody = `${ST.objectives.length?`<div style="display:flex;gap:10px;flex-wrap:wrap;">${ST.objectives.slice(0,4).map(o=>{const g=objectiveBalance(o.id);const meta2=+o.targetValue||0;const pct=meta2>0?Math.min(100,(g/meta2)*100):0;return`<div style="background:${o.color}14;border:1px solid ${o.color}44;border-radius:10px;padding:12px 16px;min-width:160px;flex:1;max-width:220px;"><div style="font-weight:600;font-size:13px;margin-bottom:6px;color:${o.color}">${o.name}</div><div style="font-size:16px;font-weight:800;color:var(--text)">${fmt(g)}</div>${meta2>0?`<div class="progress" style="margin-top:6px"><div class="progress-fill" style="background:${o.color};width:${pct}%"></div></div>`:''}</div>`;}).join('')}</div><div style="text-align:right;margin-top:10px;font-size:12px;color:var(--text2)">Total guardado: <strong style="color:var(--purple)">${fmt(totalPatrimonio())}</strong></div>`:`<div class="empty" style="padding:24px">Nenhum objetivo cadastrado. <span style="color:var(--purple);cursor:pointer;text-decoration:underline" onclick="goTo('patrimonio')">Cadastrar agora</span></div>`}`;
  const patrimonioHTML = ST.settings.showPatrimonioSection===false ? '' : renderDashboardSection('patrimonio','Patrimônio','(objetivos e reservas)',patrimonioBody,'grid-column:span 2');
  // Orçamento por categoria: só aparece se pelo menos um grupo tiver limite definido em Configurações E a seção estiver habilitada.
  const budgetBody = `<div style="display:flex;flex-direction:column;gap:10px">${budgets.map(b=>{const color=b.over?'var(--red)':b.warn?'var(--amber)':'var(--green)';return`<div><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px"><span style="font-weight:600">${b.grp}</span><span style="color:${color};font-weight:600">${fmt(b.spent)} / ${fmt(b.limit)}</span></div><div class="progress"><div class="progress-fill" style="background:${color};width:${b.pct}%"></div></div></div>`;}).join('')}</div><div style="text-align:right;margin-top:10px;font-size:11px;color:var(--text3)"><span style="color:var(--purple);cursor:pointer;text-decoration:underline" onclick="goTo('configuracoes')">Gerenciar orçamentos</span></div>`;
  const budgetHTML = (ST.settings.showBudgetSection!==false && budgets.length) ? renderDashboardSection('budget','Orçamento por Categoria','(mês atual)',budgetBody,'grid-column:span 2') : '';

  // Próximo Vencimento de Fatura: calcula a fatura de cada cartão para o
  // MÊS SELECIONADO na topbar (ST.vy/ST.vm) — não necessariamente o mês
  // corrente de "hoje" — usando o dia 15 daquele mês como referência pro
  // cálculo do ciclo (ver cardCycleDates em js/utils.js).
  let invoiceHTML='';
  if(ST.settings.showNextInvoiceSection!==false){
    const refDate=new Date(ST.vy,ST.vm,15);
    const invoices=ST.cards.filter(c=>c.fechamento).map(c=>{
      const cycle=cardCycleDates(c,refDate);
      if(!cycle) return null;
      const items=ST.expenses.filter(x=>{if(x.cardId!==c.id)return false;const d=toDate(x.date);return d&&d>=cycle.cycleStart&&d<=cycle.cycleEnd;});
      const total=items.reduce((s,x)=>s+(+x.value||0),0);
      const due=cardInvoiceDueDate(c,cycle.cycleEnd);
      return {card:c,total,due};
    }).filter(Boolean).sort((a,b)=>(a.due&&b.due)?a.due-b.due:0);
    if(invoices.length){
      const invoiceBody = `<div style="display:flex;flex-direction:column;gap:8px">${invoices.map(inv=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:9px 12px;background:var(--bg3);border-radius:8px;gap:8px;flex-wrap:wrap"><span style="font-weight:600;font-size:13px;color:${inv.card.color}">${inv.card.name}</span><span style="font-size:11px;color:var(--text2)">Vence em ${inv.due?fmtD(dateToStr(inv.due)):'—'}</span><span style="font-weight:700;font-size:13px">${fmt(inv.total)}</span></div>`).join('')}</div>`;
      invoiceHTML = renderDashboardSection('invoice','Próximo Vencimento',`(${MONTHS[ST.vm]}/${ST.vy})`,invoiceBody,'grid-column:span 2');
    }
  }

  // Barra de filtros do Dashboard
  const statusOptions=[...new Set([...ST.expStatuses,...ST.incStatuses,'atrasado'])];
  const filtersBody = `<div class="dashboard-filters">
      <div class="dashboard-filter-grid">
        <div class="form-field"><label>Período</label>
          <select onchange="setDashFilter('periodo',this.value)">
            <option value="mes" ${dashPeriodo==='mes'?'selected':''}>Este mês</option>
            <option value="ano" ${dashPeriodo==='ano'?'selected':''}>Este ano (${ST.vy})</option>
            <option value="tudo" ${dashPeriodo==='tudo'?'selected':''}>Todos os períodos</option>
          </select>
        </div>
        <div class="form-field"><label>Conta</label>
          <select onchange="setDashFilter('conta',this.value)">
            <option value="">Todas</option>
            ${ST.accounts.map(a=>`<option value="${a.id}" ${dashFiltAccount===a.id?'selected':''}>${a.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-field"><label>Cartão</label>
          <select onchange="setDashFilter('cartao',this.value)">
            <option value="">Todos</option>
            ${ST.cards.map(c=>`<option value="${c.id}" ${dashFiltCard===c.id?'selected':''}>${c.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-field"><label>Categoria</label>
          <select onchange="setDashFilter('grupo',this.value)">
            <option value="">Todas</option>
            ${ST.groups.map(g=>`<option value="${g}" ${dashFiltGrupo===g?'selected':''}>${g}</option>`).join('')}
          </select>
        </div>
        <div class="form-field"><label>Status</label>
          <select onchange="setDashFilter('status',this.value)">
            <option value="">Todos</option>
            ${statusOptions.map(s=>`<option value="${s}" ${dashFiltStatus===s?'selected':''}>${cap(s)}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="dashboard-filter-actions">
        <button class="btn" onclick="clearDashFilters()">Limpar filtros</button>
      </div>
    </div>`;
  const filtersHTML = renderDashboardSection('filters','Filtros do Dashboard','',filtersBody,'margin-bottom:16px');

  document.getElementById('content').innerHTML=(ST.settings.name?`<p style="font-size:12px;color:var(--text2);margin-bottom:12px">Olá, ${ST.settings.name}! &#128075;</p>`:'')+alerts+filtersHTML+`<div class="kpi-grid"><div class="kpi" style="border-left-color:var(--green)"><div class="kpi-label">Receitas</div><div class="kpi-value" style="color:var(--green)">${fmt(tr)}</div><div class="kpi-sub">${fi.length} lançamentos</div></div>${despesasCard}<div class="kpi" style="border-left-color:${saldo>=0?'var(--purple)':'var(--red)'}"><div class="kpi-label">Saldo do Período</div><div class="kpi-value" style="color:${saldo>=0?'var(--purple)':'var(--red)'}">${fmt(saldo)}</div></div>${metaKPI}</div>${accountsHTML?`<div class="chart-row">${accountsHTML}</div>`:''}${patrimonioHTML?`<div class="chart-row">${patrimonioHTML}</div>`:''}${budgetHTML?`<div class="chart-row">${budgetHTML}</div>`:''}${invoiceHTML?`<div class="chart-row">${invoiceHTML}</div>`:''}${(ST.settings.showMonthlyChartSection!==false||ST.settings.showGroupChartSection!==false||cardsHTML)?`<div class="chart-row">${ST.settings.showMonthlyChartSection!==false?renderDashboardSection('monthlyChart','Últimos 6 meses','',barChart(hist,'var(--green)','var(--red)')):''}${ST.settings.showGroupChartSection!==false?renderDashboardSection('groupChart','Gastos por grupo',dashPeriodo!=='mes'||dashFiltAccount||dashFiltCard||dashFiltGrupo||dashFiltStatus?`(filtrado)`:'',pieChart(pd)):''}${cardsHTML}</div>`:''}`;
}
