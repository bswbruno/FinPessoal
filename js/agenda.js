
// FinPessoal v4.9 – Agenda Financeira
//
// Calendário do mês navegado na topbar (ST.vm/ST.vy — o mesmo usado em A
// Pagar, A Receber e Dashboard), mostrando em cada dia: despesas, receitas
// e movimentações de patrimônio (aportes/retiradas) daquela data.

// Agrupa despesas/receitas/patrimônio do mês vm/vy por dia do mês.
// Retorna um objeto { 5: {despesas:[...], receitas:[...], patrimonio:[...]}, ... }
function agendaEventsForMonth(vy, vm){
  const map = {};
  const ensure = (day) => { if(!map[day]) map[day]={despesas:[],receitas:[],patrimonio:[]}; return map[day]; };
  ST.expenses.forEach(x=>{ const d=toDate(x.date); if(d && d.getFullYear()===vy && d.getMonth()===vm) ensure(d.getDate()).despesas.push(x); });
  ST.incomes.forEach(x=>{ const d=toDate(x.date); if(d && d.getFullYear()===vy && d.getMonth()===vm) ensure(d.getDate()).receitas.push(x); });
  ST.objectiveEntries.forEach(e=>{ const d=toDate(e.date); if(d && d.getFullYear()===vy && d.getMonth()===vm) ensure(d.getDate()).patrimonio.push(e); });
  return map;
}

function renderAgenda(){
  const vy=ST.vy, vm=ST.vm;
  const events = agendaEventsForMonth(vy, vm);
  const totalDays = new Date(vy, vm+1, 0).getDate();
  const firstWeekday = new Date(vy, vm, 1).getDay();
  const weekdayLabels = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

  let cells = '';
  for(let i=0; i<firstWeekday; i++) cells += `<div class="agenda-cell agenda-cell-empty"></div>`;

  for(let day=1; day<=totalDays; day++){
    const dateObj = new Date(vy, vm, day); dateObj.setHours(0,0,0,0);
    const isToday = dateObj.getTime()===today.getTime();
    const ev = events[day] || {despesas:[],receitas:[],patrimonio:[]};
    const pendingLate = ev.despesas.some(x=>isLate(x));
    const hasEvents = ev.despesas.length||ev.receitas.length||ev.patrimonio.length;

    const dots = [];
    if(ev.despesas.length) dots.push(`<span class="agenda-dot" style="background:var(--red)" title="${ev.despesas.length} despesa(s)">${ev.despesas.length}</span>`);
    if(ev.receitas.length) dots.push(`<span class="agenda-dot" style="background:var(--green)" title="${ev.receitas.length} receita(s)">${ev.receitas.length}</span>`);
    if(ev.patrimonio.length) dots.push(`<span class="agenda-dot" style="background:var(--purple)" title="${ev.patrimonio.length} mov. de patrimônio">${ev.patrimonio.length}</span>`);

    cells += `<div class="agenda-cell${isToday?' agenda-cell-today':''}${pendingLate?' agenda-cell-late':''}"${hasEvents?` onclick="showAgendaDay(${day})"`:''}>
      <div class="agenda-daynum">${day}</div>
      <div class="agenda-dots">${dots.join('')}</div>
    </div>`;
  }

  document.getElementById('content').innerHTML = `
    <div class="chart-card">
      <div class="agenda-legend">
        <span><span class="agenda-dot" style="background:var(--red);width:16px">&nbsp;</span> Despesas</span>
        <span><span class="agenda-dot" style="background:var(--green);width:16px">&nbsp;</span> Receitas</span>
        <span><span class="agenda-dot" style="background:var(--purple);width:16px">&nbsp;</span> Patrimônio</span>
        <span style="margin-left:auto;color:var(--text3)">${MONTHS[vm]} de ${vy}</span>
      </div>
      <div class="agenda-grid agenda-grid-header">${weekdayLabels.map(w=>`<div class="agenda-weekday">${w}</div>`).join('')}</div>
      <div class="agenda-grid">${cells}</div>
    </div>`;
}

// Abre a modal com os detalhes de um dia específico do mês navegado.
function showAgendaDay(day){
  const vy=ST.vy, vm=ST.vm;
  const dateStr = `${vy}-${String(vm+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  const ev = agendaEventsForMonth(vy, vm)[day] || {despesas:[],receitas:[],patrimonio:[]};

  let body = '';
  if(ev.despesas.length){
    body += `<h4 style="font-size:12px;margin:0 0 8px;color:var(--text2)">Despesas</h4>`;
    body += ev.despesas.map(x=>{
      const st = x.status==='pago' ? 'pill-pago' : isLate(x) ? 'pill-late' : 'pill-pend';
      const label = x.status==='pago' ? 'Pago' : isLate(x) ? 'Atrasado' : 'Pendente';
      return `<div class="alert-row"><span>${x.desc}</span><span>${fmt(x.value)} <span class="pill ${st}">${label}</span></span></div>`;
    }).join('');
  }
  if(ev.receitas.length){
    body += `<h4 style="font-size:12px;margin:14px 0 8px;color:var(--text2)">Receitas</h4>`;
    body += ev.receitas.map(x=>`<div class="alert-row"><span>${x.desc}</span><span style="color:var(--green);font-weight:600">${fmt(x.value)}</span></div>`).join('');
  }
  if(ev.patrimonio.length){
    body += `<h4 style="font-size:12px;margin:14px 0 8px;color:var(--text2)">Patrimônio</h4>`;
    body += ev.patrimonio.map(e=>{
      const o = ST.objectives.find(o=>o.id===e.objectiveId);
      return `<div class="alert-row"><span>${o?o.name:'Objetivo removido'} — ${e.type==='aporte'?'Guardado':'Retirado'}</span><span style="color:${e.type==='aporte'?'var(--green)':'var(--red)'};font-weight:600">${fmt(e.value)}</span></div>`;
    }).join('');
  }

  document.getElementById('agenda-day-title').textContent = fmtD(dateStr);
  document.getElementById('agenda-day-body').innerHTML = body || '<p class="empty">Nada neste dia.</p>';
  openModal('modal-agenda-day');
}
