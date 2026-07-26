
// FinPessoal v5.0 – Patrimônio (objetivos e reservas)
//
// Lembrete importante: este app NÃO é um banco digital, é um controle
// financeiro pessoal. "Guardar dinheiro" aqui não move dinheiro de verdade
// entre contas — só ANOTA que uma parte do saldo da sua conta bancária
// (real, no seu banco de verdade) está reservada para um objetivo. Por
// isso, ao vincular uma conta bancária a um aporte/retirada, o saldo dessa
// conta no FinPessoal é ajustado — pra continuar batendo com a realidade.

let scObj = '#8b5cf6'; // cor selecionada no formulário de objetivo

function renderPatrimonio(){
  const total = totalPatrimonio();
  const html = ST.objectives.length ? ST.objectives.map(o=>{
    const guardado = objectiveBalance(o.id);
    const meta = +o.targetValue || 0;
    const pct = meta>0 ? Math.min(100,(guardado/meta)*100) : 0;
    const done = meta>0 && guardado>=meta;
    return `<div class="chart-card" style="min-width:240px;flex:1;max-width:280px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
        <div><div style="font-weight:700;font-size:14px">${o.name}</div>${meta>0?`<div style="font-size:11px;color:var(--text2);margin-top:2px">Meta: ${fmt(meta)}</div>`:'<div style="font-size:11px;color:var(--text3);margin-top:2px">Sem meta definida</div>'}</div>
        <div style="width:12px;height:12px;border-radius:50%;background:${o.color};flex-shrink:0;margin-top:3px"></div>
      </div>
      <div style="font-size:20px;font-weight:800;color:${o.color};margin-bottom:4px">${fmt(guardado)}</div>
      ${meta>0?`<div class="progress" style="margin-bottom:6px"><div class="progress-fill" style="background:${done?'var(--green)':o.color};width:${pct}%"></div></div><div style="font-size:11px;color:var(--text2);margin-bottom:10px">${done?icon('check')+' Meta atingida!':pct.toFixed(0)+'% da meta'}</div>`:'<div style="margin-bottom:10px"></div>'}
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <button class="btn-sm mark" onclick="openObjEntryModal('${o.id}','aporte')">${icon('plus')} Guardar</button>
        <button class="btn-sm" onclick="openObjEntryModal('${o.id}','retirada')">${icon('minus')} Retirar</button>
        <button class="btn-sm" onclick="showObjHistory('${o.id}')" title="Histórico">${icon('scroll-text')}</button>
        <button class="btn-sm edit" onclick="editObj('${o.id}')">${icon('pencil')}</button>
        <button class="btn-sm del" onclick="delObj('${o.id}')">${icon('trash-2')}</button>
      </div>
    </div>`;
  }).join('') : '<div class="empty" style="padding:80px">Nenhum objetivo cadastrado. Clique em "+ Novo Objetivo" pra começar (ex: Reserva de Emergência, Viagem, Comprar carro...).</div>';

  document.getElementById('content').innerHTML = `
    <div class="kpi-grid" style="grid-template-columns:1fr;margin-bottom:18px">
      <div class="kpi" style="border-left-color:var(--purple)"><div class="kpi-label">Patrimônio Total Guardado</div><div class="kpi-value" style="color:var(--purple)">${fmt(total)}</div><div class="kpi-sub">${ST.objectives.length} objetivo${ST.objectives.length!==1?'s':''}</div></div>
    </div>
    <p style="font-size:11px;color:var(--text3);margin-bottom:14px">💡 Isso é controle, não um banco de verdade: guardar/retirar aqui só ajusta o saldo da conta vinculada (se você escolher uma), pra manter tudo fiel à realidade do seu banco.</p>
    <div class="toolbar"><span style="font-size:12px;color:var(--text2)">${ST.objectives.length} objetivo${ST.objectives.length!==1?'s':''}</span><button class="btn btn-primary" onclick="openObjModal()">${icon('plus')} Novo Objetivo</button></div>
    <div style="display:flex;flex-wrap:wrap;gap:16px">${html}</div>`;
}

/* ---------------- CRUD de Objetivos ---------------- */
function openObjModal(){
  _editId=null;document.getElementById('modal-obj-title').textContent='Novo Objetivo';
  document.getElementById('obj-name').value='';document.getElementById('obj-target').value='';
  buildObjSwatches('#8b5cf6');openModal('modal-obj');
}
function editObj(id){
  const o=ST.objectives.find(x=>x.id===id);if(!o)return;_editId=id;
  document.getElementById('modal-obj-title').textContent='Editar Objetivo';
  document.getElementById('obj-name').value=o.name||'';document.getElementById('obj-target').value=o.targetValue||'';
  buildObjSwatches(o.color||'#8b5cf6');openModal('modal-obj');
}
function delObj(id){
  confirm2('Remover este objetivo? O histórico de aportes/retiradas dele também será apagado.',()=>{
    ST.objectives=ST.objectives.filter(o=>o.id!==id);
    ST.objectiveEntries=ST.objectiveEntries.filter(e=>e.objectiveId!==id);
    sv();notify('Objetivo removido','err');render();
  });
}
function buildObjSwatches(sel){
  scObj=sel;const w=document.getElementById('obj-color-swatches');if(!w)return;
  const CCOLORS=['#8b5cf6','#6366f1','#ef4444','#f59e0b','#10b981','#3b82f6','#ec4899','#0ea5e9','#22c55e','#334155'];
  w.innerHTML=CCOLORS.map(c=>`<div onclick="buildObjSwatches('${c}')" style="width:24px;height:24px;border-radius:50%;background:${c};cursor:pointer;border:2px solid ${c===scObj?'var(--text)':'transparent'};flex-shrink:0"></div>`).join('')+`<input type="color" value="${sel}" oninput="buildObjSwatches(this.value)" style="width:26px;height:26px;border:none;border-radius:50%;cursor:pointer;padding:0">`;
}
function saveObj(){
  const name=document.getElementById('obj-name').value.trim();
  const targetValue=parseFloat(document.getElementById('obj-target').value)||0;
  if(!name){notify('Preencha o nome do objetivo','err');return;}
  if(_editId){Object.assign(ST.objectives.find(o=>o.id===_editId),{name,targetValue,color:scObj});notify('Objetivo atualizado!');}
  else{ST.objectives.push({id:gid(),name,targetValue,color:scObj,createdAt:new Date().toISOString()});notify('Objetivo criado!');}
  sv();closeModal('modal-obj');render();
}

/* ---------------- Aporte / Retirada ---------------- */
let _objEntryTarget=null; // {objectiveId, type}

function openObjEntryModal(objectiveId, type){
  const o=ST.objectives.find(x=>x.id===objectiveId);if(!o)return;
  _objEntryTarget={objectiveId,type};
  document.getElementById('modal-obj-entry-title').textContent=(type==='aporte'?'Guardar dinheiro — ':'Retirar dinheiro — ')+o.name;
  document.getElementById('obj-entry-value').value='';
  document.getElementById('obj-entry-date').value=dd();
  document.getElementById('obj-entry-desc').value='';
  refreshAccountSelect('obj-entry-account', type==='aporte' ? 'Não vincular a nenhuma conta' : 'Não vincular a nenhuma conta');
  document.getElementById('obj-entry-account-label').textContent = type==='aporte' ? 'De qual conta saiu o dinheiro? (opcional)' : 'Para qual conta volta o dinheiro? (opcional)';
  openModal('modal-obj-entry');
}
function saveObjEntry(){
  if(!_objEntryTarget)return;
  const {objectiveId,type}=_objEntryTarget;
  const value=parseFloat(document.getElementById('obj-entry-value').value);
  const date=document.getElementById('obj-entry-date').value;
  const desc=document.getElementById('obj-entry-desc').value.trim();
  const accountId=document.getElementById('obj-entry-account').value;
  if(isNaN(value)||value<=0){notify('Informe um valor válido','err');return;}
  if(type==='retirada' && value>objectiveBalance(objectiveId)){notify('Valor maior que o disponível nesse objetivo','err');return;}

  const entry={id:gid(),objectiveId,date,desc:desc||(type==='aporte'?'Aporte':'Retirada'),value,type,accountId:accountId||null};
  ST.objectiveEntries.push(entry);

  // Se uma conta foi vinculada, ajusta o saldo dela pra continuar fiel à
  // realidade (guardar = sai da conta; retirar = volta pra conta). Ver
  // regra de negócio explicada no topo do arquivo.
  if(accountId){
    const o=ST.objectives.find(x=>x.id===objectiveId);
    addMovement({date,desc:`${type==='aporte'?'Guardado p/':'Retirado de'} "${o.name}"`,accountId,category:'Patrimônio',value,type:type==='aporte'?'saida':'entrada',linkedId:entry.id});
  }
  sv();closeModal('modal-obj-entry');render();notify(type==='aporte'?'Guardado com sucesso!':'Retirada registrada!');
  _objEntryTarget=null;
}

/* ---------------- Histórico de um objetivo ---------------- */
function showObjHistory(objectiveId){
  const o=ST.objectives.find(x=>x.id===objectiveId);if(!o)return;
  const entries=ST.objectiveEntries.filter(e=>e.objectiveId===objectiveId).sort((a,b)=>new Date(b.date)-new Date(a.date));
  document.getElementById('obj-history-title').textContent='Histórico — '+o.name;
  document.getElementById('obj-history-body').innerHTML = entries.length ? `<div class="table-wrap"><table><thead><tr><th>Data</th><th>Descrição</th><th>Tipo</th><th>Valor</th></tr></thead><tbody>${entries.map(e=>`<tr><td>${fmtD(e.date)}</td><td>${e.desc}</td><td><span class="pill ${e.type==='aporte'?'pill-pago':'pill-late'}">${e.type==='aporte'?'Guardado':'Retirado'}</span></td><td style="font-weight:700;color:${e.type==='aporte'?'var(--green)':'var(--red)'}">${e.type==='aporte'?'+':'-'}${fmt(e.value)}</td></tr>`).join('')}</tbody></table></div>` : '<div class="empty" style="padding:40px">Nenhum aporte ou retirada ainda.</div>';
  openModal('modal-obj-history');
}
