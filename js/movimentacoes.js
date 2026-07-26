
// FinPessoal v5.0 – Movimentações (extrato das contas bancárias)
//
// Uma "movimentação" é qualquer entrada/saída/transferência ligada a uma
// conta bancária. Elas podem ser:
//  a) Automáticas — criadas quando você confirma o pagamento de uma despesa
//     (js/receipts.js → confirmPayment) ou a confirmação de recebimento de
//     uma receita (confirmReceive, abaixo), vinculando `linkedId` ao
//     id da despesa/receita de origem.
//  b) Manuais — lançamentos avulsos que você cadastra direto aqui (ex: uma
//     transferência entre contas, ou um ajuste manual de saldo).

let mvF='todos'; // filtro de tipo: todos | entrada | saida | transferencia

// Cria uma movimentação e persiste. Usada tanto pelo formulário manual
// quanto pelos fluxos automáticos de pagamento/recebimento.
function addMovement({date,desc,accountId,category,value,type,toAccountId,linkedId}){
  ST.movements.push({id:gid(),date,desc,accountId,category:category||'',value:+value||0,type,toAccountId:toAccountId||null,linkedId:linkedId||null});
  sv();
}

// Remove a movimentação gerada automaticamente para uma despesa/receita,
// quando o pagamento/recebimento é desfeito (ex: usuário desmarca "Pago").
// Sem isso, o saldo da conta ficaria descontado/creditado pra sempre mesmo
// depois de desfazer o pagamento — bug corrigido na v5.0.
function removeLinkedMovement(linkedId){
  const before = ST.movements.length;
  ST.movements = ST.movements.filter(m => m.linkedId !== linkedId);
  if (ST.movements.length !== before) sv();
}

function accName(id){ if(!id) return '—'; const a=ST.accounts.find(a=>a.id===id); return a?a.name:'<span style="color:var(--text3)">Conta removida</span>'; }

function renderMovs(){
  let rows=ST.movements.filter(m=>mvF==='todos'||m.type===mvF).sort((a,b)=>new Date(b.date)-new Date(a.date));
  const tbody=rows.length?rows.map(m=>{
    const tp=m.type==='entrada'?{c:'pill-pago',l:'Entrada'}:m.type==='saida'?{c:'pill-late',l:'Saída'}:{c:'pill-info',l:'Transferência'};
    const contaTxt=m.type==='transferencia'?`${accName(m.accountId)} ${icon('arrow-right','ic-inline')} ${accName(m.toAccountId)}`:accName(m.accountId);
    const valColor=m.type==='entrada'?'var(--green)':m.type==='saida'?'var(--red)':'var(--blue)';
    const sinal=m.type==='entrada'?'+':m.type==='saida'?'-':'';
    return `<tr><td>${fmtD(m.date)}</td><td style="font-weight:600;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${m.desc}">${m.desc}${m.linkedId?` <span title="Gerada automaticamente ao pagar/receber — editar/excluir aqui edita/exclui o lançamento de origem" style="color:var(--text3)">${icon('link','ic-inline')}</span>`:''}</td><td style="color:var(--text2)">${contaTxt}</td><td style="color:var(--text2)">${m.category||'—'}</td><td><span class="pill ${tp.c}">${tp.l}</span></td><td style="font-weight:700;color:${valColor}">${sinal}${fmt(m.value)}</td><td style="white-space:nowrap"><button class="btn-sm edit" onclick="editMov('${m.id}')" title="${m.linkedId?'Editar o lançamento de origem':'Editar'}">${icon('pencil')}</button> <button class="btn-sm del" onclick="delMov('${m.id}')" title="${m.linkedId?'Excluir o lançamento de origem':'Excluir'}">${icon('trash-2')}</button></td></tr>`;
  }).join(''):'<tr><td colspan="7" class="empty">Nenhuma movimentação encontrada</td></tr>';

  const totE=ST.movements.filter(m=>m.type==='entrada').reduce((s,m)=>s+(+m.value||0),0);
  const totS=ST.movements.filter(m=>m.type==='saida').reduce((s,m)=>s+(+m.value||0),0);

  document.getElementById('content').innerHTML=`
    <div class="kpi-grid" style="grid-template-columns:repeat(2,1fr);margin-bottom:16px">
      <div class="kpi" style="border-left-color:var(--green)"><div class="kpi-label">Total de entradas</div><div class="kpi-value" style="color:var(--green)">${fmt(totE)}</div></div>
      <div class="kpi" style="border-left-color:var(--red)"><div class="kpi-label">Total de saídas</div><div class="kpi-value" style="color:var(--red)">${fmt(totS)}</div></div>
    </div>
    <div class="toolbar">
      <div class="filter-pills">${['todos','entrada','saida','transferencia'].map(f=>`<button class="fpill${mvF===f?' on':''}" onclick="setMvF('${f}')">${f==='todos'?'Todas':f==='entrada'?'Entradas':f==='saida'?'Saídas':'Transferências'}</button>`).join('')}</div>
      <button class="btn btn-primary" onclick="openMovModal()">${icon('plus')} Nova Movimentação</button>
    </div>
    <p style="font-size:11px;color:var(--text3);margin:-6px 0 10px">${icon('link','ic-inline')} = gerada automaticamente (Gasto Rápido, pagamento ou recebimento). Editar ou excluir aqui edita/exclui o lançamento de origem em <strong>A Pagar</strong>/<strong>A Receber</strong> automaticamente — os dois ficam sempre sincronizados.</p>
    <div class="table-wrap"><table><thead><tr><th>Data</th><th>Descrição</th><th>Conta</th><th>Categoria</th><th>Tipo</th><th>Valor</th><th>Ações</th></tr></thead><tbody>${tbody}</tbody></table></div>`;
}
function setMvF(f){mvF=f;renderMovs();}

function toggleMovFields(){
  const t=document.getElementById('mov-type').value;
  document.getElementById('mov-to-wrap').style.display=t==='transferencia'?'flex':'none';
  document.getElementById('mov-account-label').textContent=t==='transferencia'?'Conta de origem':'Conta';
}
function openMovModal(){
  _editId=null;document.getElementById('modal-mov-title').textContent='Nova Movimentação';
  refreshAccountSelect('mov-account','Selecione a conta...');
  refreshAccountSelect('mov-to-account','Selecione a conta destino...');
  ['mov-desc','mov-category'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('mov-value').value='';document.getElementById('mov-date').value=dd();
  document.getElementById('mov-type').value='saida';
  toggleMovFields();openModal('modal-mov');
}
function editMov(id){
  const m=ST.movements.find(x=>x.id===id);if(!m)return;
  if(m.linkedId){
    // Movimentação gerada automaticamente (Gasto Rápido, pagamento ou
    // recebimento) — reaproveita a modal de edição de A Pagar/A Receber,
    // que já mantém a movimentação sincronizada (ver saveExp()/saveInc()).
    if(ST.expenses.some(x=>x.id===m.linkedId)){editE(m.linkedId);return;}
    if(ST.incomes.some(x=>x.id===m.linkedId)){editI(m.linkedId);return;}
    notify('Lançamento de origem não encontrado (pode já ter sido excluído)','err');return;
  }
  _editId=id;document.getElementById('modal-mov-title').textContent='Editar Movimentação';
  refreshAccountSelect('mov-account','Selecione a conta...');
  refreshAccountSelect('mov-to-account','Selecione a conta destino...');
  document.getElementById('mov-desc').value=m.desc||'';document.getElementById('mov-category').value=m.category||'';
  document.getElementById('mov-value').value=m.value||'';document.getElementById('mov-date').value=m.date||'';
  document.getElementById('mov-type').value=m.type||'saida';document.getElementById('mov-account').value=m.accountId||'';
  document.getElementById('mov-to-account').value=m.toAccountId||'';
  toggleMovFields();openModal('modal-mov');
}
function delMov(id){
  const m=ST.movements.find(x=>x.id===id);
  if(m&&m.linkedId){
    if(ST.expenses.some(x=>x.id===m.linkedId)){delE(m.linkedId);return;}
    if(ST.incomes.some(x=>x.id===m.linkedId)){delI(m.linkedId);return;}
    notify('Lançamento de origem não encontrado (pode já ter sido excluído)','err');return;
  }
  confirm2('Remover esta movimentação?',()=>{ST.movements=ST.movements.filter(x=>x.id!==id);sv();notify('Removida','err');render();});
}
function saveMov(){
  const desc=document.getElementById('mov-desc').value.trim(),val=parseFloat(document.getElementById('mov-value').value);
  const accountId=document.getElementById('mov-account').value,type=document.getElementById('mov-type').value;
  const toAccountId=document.getElementById('mov-to-account').value,date=document.getElementById('mov-date').value;
  const category=document.getElementById('mov-category').value;
  if(!desc||isNaN(val)||val<=0){notify('Preencha Descrição e Valor','err');return;}
  if(!accountId){notify('Selecione a conta','err');return;}
  if(type==='transferencia'&&(!toAccountId||toAccountId===accountId)){notify('Selecione uma conta destino diferente da origem','err');return;}
  if(_editId){const m=ST.movements.find(x=>x.id===_editId);if(m)Object.assign(m,{desc,value:val,accountId,type,toAccountId:type==='transferencia'?toAccountId:null,date,category});sv();notify('Movimentação atualizada!');}
  else{ST.movements.push({id:gid(),date,desc,accountId,category,value:val,type,toAccountId:type==='transferencia'?toAccountId:null,linkedId:null});sv();notify('Movimentação adicionada!');}
  closeModal('modal-mov');render();
}

/* ----------------------------------------------------------------------
   CONFIRMAÇÃO DE RECEBIMENTO (A Receber) — mesma ideia do fluxo de
   pagamento em js/receipts.js: marcar como "recebido" abre uma modal
   perguntando em qual conta o dinheiro entrou (opcional). Só quando uma
   conta é escolhida é que o saldo dela realmente muda.
------------------------------------------------------------------------ */
let _receiveTarget = null; // id da receita sendo confirmada

function openReceiveModal(id){
  const x=ST.incomes.find(i=>i.id===id);if(!x)return;
  _receiveTarget=id;
  refreshAccountSelect('receive-account-select','Não vincular a nenhuma conta');
  document.getElementById('receive-modal-desc').textContent=`${x.desc} — ${fmt(x.value)}`;
  openModal('modal-receive-confirm');
}
function confirmReceive(){
  if(!_receiveTarget)return;
  const x=ST.incomes.find(i=>i.id===_receiveTarget);
  const accountId=document.getElementById('receive-account-select').value;
  if(x){
    x.status='recebido';
    removeLinkedMovement(x.id); // proteção extra contra duplicidade
    if(accountId) addMovement({date:x.date,desc:x.desc,accountId,category:x.type,value:x.value,type:'entrada',linkedId:x.id});
    sv();
  }
  closeModal('modal-receive-confirm');render();notify('Recebimento confirmado!');
  _receiveTarget=null;
}
