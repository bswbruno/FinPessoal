// FinPessoal v3.0 – Utilitários e Estado Global

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const COLORS  = ['#6366f1','#ef4444','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ec4899','#0ea5e9','#22c55e','#64748b'];

// Listas padrão (usadas apenas para "resetar" ou popular o app na primeira vez).
// A lista realmente usada pela interface fica em ST.groups / ST.expStatuses / ST.incStatuses
// (ver seção "Estado global" abaixo), pois o usuário pode cadastrar itens novos em
// Configurações → Grupos e Status (ver js/categorias.js).
const DEFAULT_GROUPS = ['Casa','Cartão','Automóvel','Saúde','Alimentação','Lazer','Educação','Assinatura','Outros'];

// Status "principais": são os que o próprio sistema usa para calcular atrasos,
// KPIs, badges etc. Eles não podem ser removidos em Configurações — apenas
// status extras cadastrados pelo usuário podem ser removidos.
const CORE_EXP_STATUSES = ['pendente','pago','atrasado'];
const CORE_INC_STATUSES = ['pendente','recebido'];
const GROUPS = DEFAULT_GROUPS; // mantido por compatibilidade; prefira ST.groups

// Formato BRL
const fmt  = v => (ST && ST.settings && ST.settings.hideValues) ? 'R$ •••••' : new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v||0);
const fmtD = s => { if(!s) return '-'; const [y,m,d]=s.split('-'); return `${d}/${m}/${y}`; };

// Data utils
const today = (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })();
const toDate = s => { if(!s) return null; const d = new Date(s+'T00:00'); d.setHours(0,0,0,0); return d; };
const isLate = r => r.status !== 'pago' && r.status !== 'recebido' && toDate(r.date) && toDate(r.date) < today;
// Quanto ainda falta pagar de uma despesa, considerando pagamentos parciais já feitos.
const expRemaining = x => Math.max(0, (+x.value||0) - (+x.paidAmount||0));
const isPartial = x => x.status!=='pago' && (+x.paidAmount||0) > 0;
const gid    = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);

// Estado global
const ST = {
  expenses: [],
  incomes:  [],
  cards:    [],
  accounts:  [],  // contas bancárias (js/contas.js)
  movements: [],  // movimentações/extrato ligado às contas (js/movimentacoes.js)
  objectives: [],       // objetivos/reservas de patrimônio (js/patrimonio.js)
  objectiveEntries: [], // aportes/retiradas ligados a cada objetivo (js/patrimonio.js)
  budgets: {},           // orçamento mensal por grupo: { "Alimentação": 800, ... }
  settings: { name:'', meta:'', alertDays:3 },
  groups: [...DEFAULT_GROUPS],           // grupos de despesa (editável em Configurações)
  expStatuses: [...CORE_EXP_STATUSES],   // status de despesas (core + personalizados)
  incStatuses: [...CORE_INC_STATUSES],   // status de receitas (core + personalizados)
  vm: today.getMonth(),
  vy: today.getFullYear()
};

// Chave do localStorage onde os dados financeiros ficam guardados. O login
// multiusuário (que deixaria isso variável por conta) está pausado por
// decisão do usuário — por enquanto é sempre a mesma chave, uso único.
function storageKey() {
  return 'fp3';
}

// Persistência localStorage
function sv() {
  localStorage.setItem(storageKey(), JSON.stringify({
    expenses: ST.expenses,
    incomes:  ST.incomes,
    cards:    ST.cards,
    accounts: ST.accounts,
    movements: ST.movements,
    objectives: ST.objectives,
    objectiveEntries: ST.objectiveEntries,
    budgets: ST.budgets,
    settings: ST.settings,
    groups: ST.groups,
    expStatuses: ST.expStatuses,
    incStatuses: ST.incStatuses
  }));
}
function ld() {
  try {
    const raw = localStorage.getItem(storageKey());
    const d = JSON.parse(raw || '{}');
    if (d.expenses) ST.expenses = d.expenses;
    if (d.incomes)  ST.incomes  = d.incomes;
    if (d.cards)    ST.cards    = d.cards;
    if (d.accounts)  ST.accounts  = d.accounts;
    if (d.movements) ST.movements = d.movements;
    if (d.objectives)       ST.objectives = d.objectives;
    if (d.objectiveEntries) ST.objectiveEntries = d.objectiveEntries;
    if (d.budgets) ST.budgets = d.budgets;
    if (d.settings) ST.settings = d.settings;
    // Compatibilidade com dados salvos antes da v3.2 (sem essas listas ainda)
    if (d.groups && d.groups.length)       ST.groups = d.groups;
    if (d.expStatuses && d.expStatuses.length) ST.expStatuses = d.expStatuses;
    if (d.incStatuses && d.incStatuses.length) ST.incStatuses = d.incStatuses;
  } catch(e) {}
}

/* ----------------------------------------------------------------------
   SALDO DE CONTAS BANCÁRIAS
   ------------------------------------------------------------------------
   IMPORTANTE (regra de negócio pedida pelo usuário): o saldo de uma conta
   bancária é totalmente independente das despesas/dívidas pendentes. Ter
   dinheiro numa conta NÃO abate automaticamente o total de dívidas no
   Dashboard — o único jeito de uma conta "participar" do pagamento de uma
   despesa é o usuário escolher explicitamente aquela conta na hora de
   confirmar o pagamento (ver openPayModal()/confirmPayment() em
   js/receipts.js). Só nesse momento uma movimentação de saída é criada e o
   saldo da conta cai de verdade.

   O saldo NUNCA é guardado como um número fixo que se altera diretamente;
   ele é sempre CALCULADO a partir de: saldo inicial + todas as
   movimentações (entradas, saídas e transferências) daquela conta. Isso
   evita bugs de "saldo dessincronizado" — o extrato é sempre a fonte da
   verdade.
------------------------------------------------------------------------ */
function accountBalance(accId) {
  const acc = ST.accounts.find(a => a.id === accId);
  if (!acc) return 0;
  let bal = +acc.initialBalance || 0;
  ST.movements.forEach(m => {
    const v = +m.value || 0;
    if (m.accountId === accId) {
      if (m.type === 'entrada') bal += v;
      else if (m.type === 'saida' || m.type === 'transferencia') bal -= v;
    }
    // Transferência: soma na conta de destino
    if (m.type === 'transferencia' && m.toAccountId === accId) bal += v;
  });
  return bal;
}
// Soma o saldo de todas as contas ATIVAS (usado no Dashboard como "Saldo em Contas").
function totalSaldoContas() {
  return ST.accounts.filter(a => a.status !== 'inativa').reduce((s,a) => s + accountBalance(a.id), 0);
}

/* ----------------------------------------------------------------------
   PATRIMÔNIO / OBJETIVOS
   ------------------------------------------------------------------------
   Mesmo princípio de cálculo dinâmico usado nas contas bancárias: o valor
   guardado em cada objetivo NUNCA é um número fixo — é sempre a soma dos
   aportes menos as retiradas registradas (ST.objectiveEntries). Isso evita
   o mesmo tipo de bug de dessincronização.

   Lembrete importante (o app não é um banco digital): quando um aporte ou
   retirada é vinculado a uma conta bancária, isso só serve para manter o
   SALDO DA CONTA fiel à realidade (o dinheiro "saiu" da conta corrente para
   a reserva, ou voltou). Não existe nenhuma transferência real de dinheiro
   acontecendo — é só controle/anotação.
------------------------------------------------------------------------ */
function objectiveBalance(id) {
  return ST.objectiveEntries.filter(e => e.objectiveId === id)
    .reduce((s,e) => s + (e.type === 'aporte' ? +e.value||0 : -(+e.value||0)), 0);
}
// Patrimônio total acumulado (soma de todos os objetivos).
function totalPatrimonio() {
  return ST.objectives.reduce((s,o) => s + objectiveBalance(o.id), 0);
}
// Quanto foi guardado (líquido) num mês/ano específico — usado na Meta Mensal do Dashboard.
function patrimonioGuardadoNoMes(vy, vm) {
  return ST.objectiveEntries.filter(e => {
    const d = toDate(e.date);
    return d && d.getFullYear() === vy && d.getMonth() === vm;
  }).reduce((s,e) => s + (e.type === 'aporte' ? +e.value||0 : -(+e.value||0)), 0);
}

/* ----------------------------------------------------------------------
   ORÇAMENTO POR CATEGORIA
   ------------------------------------------------------------------------
   ST.budgets é um mapa simples { "NomeDoGrupo": limiteMensal }. Só grupos
   com um limite definido (>0) entram nos cálculos/alertas — os demais são
   ignorados normalmente. O gasto é sempre calculado sobre o mês REAL
   navegado na topbar (ST.vy/ST.vm), não sobre os filtros do Dashboard.
------------------------------------------------------------------------ */
function budgetSpentForGroup(grp) {
  return mE().filter(x => x.grp === grp).reduce((s,x) => s + (+x.value||0), 0);
}
// Grupos com orçamento definido, junto com quanto já foi gasto e o limite.
function budgetStatusList() {
  return ST.groups.filter(g => (+ST.budgets[g] || 0) > 0).map(g => {
    const limit = +ST.budgets[g];
    const spent = budgetSpentForGroup(g);
    return { grp: g, limit, spent, pct: Math.min(100, (spent/limit)*100), over: spent > limit, warn: spent <= limit && spent >= limit*0.8 };
  });
}

/* ----------------------------------------------------------------------
   CARTÃO DE CRÉDITO — CICLO DE FATURA
------------------------------------------------------------------------ */
function cardCycleDates(card, refDate) {
  refDate = refDate || today;
  const closing = +card.fechamento || 0;
  if (!closing) return null;
  let cycleEnd = new Date(refDate.getFullYear(), refDate.getMonth(), closing);
  if (cycleEnd < refDate) cycleEnd = new Date(refDate.getFullYear(), refDate.getMonth()+1, closing);
  const prevClosing = new Date(cycleEnd.getFullYear(), cycleEnd.getMonth()-1, closing);
  const cycleStart = new Date(prevClosing); cycleStart.setDate(cycleStart.getDate()+1);
  return { cycleStart, cycleEnd };
}
function cardInvoiceDueDate(card, cycleEnd) {
  const dueDay = +card.vencimento || 0;
  if (!dueDay) return null;
  let due = new Date(cycleEnd.getFullYear(), cycleEnd.getMonth(), dueDay);
  if (dueDay < (+card.fechamento||0)) due = new Date(due.getFullYear(), due.getMonth()+1, dueDay);
  return due;
}
function cardCurrentInvoice(card) {
  const cycle = cardCycleDates(card);
  if (!cycle) return { total:0, paid:0, pending:0, dueDate:null, items:[] };
  const items = ST.expenses.filter(x=>{
    if (x.cardId!==card.id) return false;
    const d = toDate(x.date);
    return d && d>=cycle.cycleStart && d<=cycle.cycleEnd;
  });
  const total = items.reduce((s,x)=>s+(+x.value||0),0);
  const paid = items.reduce((s,x)=>s+(x.status==='pago'?(+x.value||0):(+x.paidAmount||0)),0);
  return { total, paid, pending: total-paid, dueDate: cardInvoiceDueDate(card, cycle.cycleEnd), items, cycleStart:cycle.cycleStart, cycleEnd:cycle.cycleEnd };
}
function cardCommitted(cardId) {
  // "Comprometido" = o que ainda falta pagar de verdade — se uma despesa já
  // teve parte paga (pagamento parcial), só o restante continua reduzindo o
  // limite disponível.
  return ST.expenses.filter(x=>x.cardId===cardId && x.status!=='pago').reduce((s,x)=>s+expRemaining(x),0);
}
function cardBestPurchaseDay(card) {
  const closing = +card.fechamento || 0;
  return closing ? (closing>=28 ? 1 : closing+1) : null;
}

// Filtros mensais
function mE() { return ST.expenses.filter(x => { const d=toDate(x.date); return d && d.getMonth()===ST.vm && d.getFullYear()===ST.vy; }); }
function mI() { return ST.incomes.filter(x  => { const d=toDate(x.date); return d && d.getMonth()===ST.vm && d.getFullYear()===ST.vy; }); }

/* ----------------------------------------------------------------------
   ÍCONES (biblioteca Lucide, carregada via CDN em index.html/login.html)
   ------------------------------------------------------------------------
   icon(nome, classeExtra) monta o placeholder <i data-lucide="..."> que a
   Lucide troca por um SVG de verdade. Como boa parte da interface é gerada
   dinamicamente (innerHTML), é preciso chamar refreshIcons() toda vez que
   HTML novo com ícones for inserido na página — isso já é feito
   automaticamente ao final de render() (js/nav.js) para as páginas, e nas
   funções que abrem modais com conteúdo dinâmico (recibo, histórico, etc).
------------------------------------------------------------------------ */
function icon(name, cls='') {
  return `<i data-lucide="${name}" class="ic-lucide ${cls}"></i>`;
}
function refreshIcons() {
  if (window.lucide && typeof lucide.createIcons === 'function') {
    try { lucide.createIcons(); } catch(e) {}
  }
}

// Notificação
function notify(msg, tp='ok') {
  const n = document.getElementById('notif');
  const iconName = tp==='err' ? 'x-circle' : tp==='info' ? 'info' : 'check-circle';
  n.innerHTML = `${icon(iconName)}<span>${msg}</span>`;
  n.className = tp; n.style.display = 'flex';
  refreshIcons();
  clearTimeout(n._t); n._t = setTimeout(() => n.style.display='none', 2600);
}

// Modal confirm
function confirm2(msg, cb) {
  document.getElementById('confirm-msg').textContent = msg;
  document.getElementById('confirm-ok-btn').onclick  = () => { closeModal('modal-confirm'); cb(); };
  openModal('modal-confirm');
}
function openModal(id)  { document.getElementById(id).classList.add('open'); refreshIcons(); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); _editId = null; }

// Data padrão do mês corrente
function dd() { return `${ST.vy}-${String(ST.vm+1).padStart(2,'0')}-10`; }
// Converte um objeto Date pra string 'YYYY-MM-DD' (formato usado em todo o app).
function dateToStr(d) { return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }

// ID em edição
let _editId = null;

// Charts helpers
function barChart(data, c1, c2) {
  const max = Math.max(...data.map(d => Math.max(d.a, d.b||0)), 1);
  return '<div class="bar-chart">' + data.map(d => {
    const h1 = Math.max(2, Math.round((d.a/max)*110));
    const h2 = d.b !== undefined ? Math.max(2, Math.round((d.b/max)*110)) : 0;
    return '<div class="bar-col">' +
      (d.b !== undefined
        ? `<div style="display:flex;gap:2px;align-items:flex-end;height:110px;width:100%"><div style="flex:1;border-radius:3px 3px 0 0;background:${c1};height:${h1}px" title="${fmt(d.a)}"></div><div style="flex:1;border-radius:3px 3px 0 0;background:${c2};height:${h2}px" title="${fmt(d.b)}"></div></div>`
        : `<div style="width:100%;border-radius:3px 3px 0 0;background:${c1};height:${h1}px" title="${fmt(d.a)}"></div>`) +
      `<div class="bar-label">${d.name}</div></div>`;
  }).join('') + '</div>';
}

function pieChart(data) {
  const total = data.reduce((s,d) => s+d.v, 0);
  if (!total) return '<div class="empty" style="padding:20px">Sem dados</div>';
  let cum = 0;
  const slices = data.map((d,i) => { const p=d.v/total, s=cum; cum+=p; return {...d,s,p,color:COLORS[i%COLORS.length]}; });
  const paths = slices.map(s => {
    const a1=s.s*2*Math.PI-Math.PI/2, a2=(s.s+s.p)*2*Math.PI-Math.PI/2, r=45, cx=55, cy=55;
    const x1=cx+r*Math.cos(a1), y1=cy+r*Math.sin(a1), x2=cx+r*Math.cos(a2), y2=cy+r*Math.sin(a2), lg=s.p>0.5?1:0;
    return `<path d="M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${lg},1 ${x2},${y2} Z" fill="${s.color}" opacity=".9"/>`;
  }).join('');
  return `<div class="pie-wrap"><svg width="110" height="110" viewBox="0 0 110 110">${paths}<circle cx="55" cy="55" r="26" fill="var(--bg2)"/></svg><div class="pie-legend">${slices.slice(0,6).map(s=>`<div class="pie-legend-item"><div class="pie-dot" style="background:${s.color}"></div><span>${s.name}</span><span style="margin-left:auto;font-weight:600">${(s.p*100).toFixed(0)}%</span></div>`).join('')}</div></div>`;
}
