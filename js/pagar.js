
// FinPessoal v5.0 – A Pagar
let eF='todos', eS='';
let eSort='venc-asc';   // venc-asc (padrão) | venc-desc | valor-asc | valor-desc | desc-az
let eView='junto';      // 'junto' (uma tabela só) | 'separado' (Atrasadas/Pendentes/Pagas)

// Aparência (classe da pill + rótulo exibido) para cada status. Os 3 status
// "core" têm estilo fixo; qualquer status extra cadastrado pelo usuário em
// Configurações (ver js/categorias.js) cai automaticamente em "pill-gray"
// mostrando o próprio texto cadastrado.
function expStatusPill(x){
  const la=isLate(x);
  if(x.status==='pago')   return {cls:'pill-pago', label:'Pago'};
  if(isPartial(x))        return {cls:'pill-info', label:'Parcial'};
  if(la)                  return {cls:'pill-late', label:'Atrasado'};
  if(x.status==='pendente') return {cls:'pill-pend', label:'Pendente'};
  return {cls:'pill-gray', label:cap(x.status)};
}
// Ordena uma lista de despesas conforme o critério escolhido em eSort.
function sortExpenseRows(rows){
  const arr=[...rows];
  if(eSort==='venc-asc')  arr.sort((a,b)=>new Date(a.date)-new Date(b.date));
  else if(eSort==='venc-desc') arr.sort((a,b)=>new Date(b.date)-new Date(a.date));
  else if(eSort==='valor-asc')  arr.sort((a,b)=>(+a.value||0)-(+b.value||0));
  else if(eSort==='valor-desc') arr.sort((a,b)=>(+b.value||0)-(+a.value||0));
  else if(eSort==='desc-az') arr.sort((a,b)=>a.desc.localeCompare(b.desc,'pt-BR'));
  return arr;
}
// Monta o <tr> de uma despesa. A linha inteira ganha um fundo suave verde
// (paga) ou vermelho (atrasada) pra dar pra identificar de relance sem
// perder a legibilidade do texto.
function expenseRowHTML(x, cmap){
  const c=cmap[x.cardId];const la=isLate(x);const parcial=isPartial(x);
  const {cls:sp,label:st}=expStatusPill(x);
  const tp2=x.type==='fixa'?'pill-info':x.type==='variavel'?'pill-gray':'pill-purple';const tt=x.type==='fixa'?'Fixa':x.type==='variavel'?'Variável':'Parcela';
  const cb=c?`<span style="background:${c.color}22;color:${c.color};padding:2px 7px;border-radius:20px;font-size:10px;font-weight:600">${c.name}</span>`:'<span style="color:var(--text3)">—</span>';
  const rowBg=x.status==='pago'?'background:var(--green-light)':parcial?'background:var(--blue-light)':la?'background:var(--red-light)':'';
  const valorCell=parcial?`${fmt(x.value)}<div style="font-size:10px;font-weight:400;color:var(--text2)">pago ${fmt(x.paidAmount)} · falta ${fmt(expRemaining(x))}</div>`:fmt(x.value);
  const payBtnLabel=x.status==='pago'?icon('check')+' Pago':parcial?'Pagar restante':'Pagar';
  return `<tr style="${rowBg}"><td style="color:${la?'var(--red)':'inherit'}">${fmtD(x.date)}</td><td style="font-weight:600;max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${x.desc}">${x.desc}</td><td>${x.type==='parcelada'?x.num+'/'+x.totalInstallments:'—'}</td><td style="font-weight:700;color:var(--red)">${valorCell}</td><td><span class="pill ${tp2}">${tt}</span></td><td style="color:var(--text2)">${x.grp||'—'}</td><td>${cb}</td><td><span class="pill ${sp}">${st}</span></td><td style="white-space:nowrap"><button class="btn-sm ${x.status==='pago'?'marked':'mark'}" onclick="toggleE('${x.id}')">${payBtnLabel}</button> <button class="btn-sm edit" onclick="editE('${x.id}')">${icon('pencil')}</button> ${x.receipt?`<button class="btn-sm receipt" onclick="viewReceipt('${x.id}')" title="Ver recibo">${icon('paperclip')}</button>`:''} <button class="btn-sm del" onclick="delE('${x.id}')">${icon('trash-2')}</button></td></tr>`;
}
function expenseTableHTML(rowsArr, cmap, emptyMsg){
  const tbody=rowsArr.length?rowsArr.map(x=>expenseRowHTML(x,cmap)).join(''):`<tr><td colspan="9" class="empty">${emptyMsg||'Nenhuma despesa encontrada'}</td></tr>`;
  return `<div class="table-wrap"><table><thead><tr><th>Vcto</th><th>Descrição</th><th>Parc.</th><th>Valor</th><th>Tipo</th><th>Grupo</th><th>Cartão</th><th>Status</th><th>Ações</th></tr></thead><tbody>${tbody}</tbody></table></div>`;
}

function renderPagar(){
  const cmap=Object.fromEntries(ST.cards.map(c=>[c.id,c]));
  let rows=mE().filter(x=>{if(eF==='atrasado')return isLate(x);if(eF!=='todos'&&x.status!==eF)return false;if(eS&&!x.desc.toLowerCase().includes(eS.toLowerCase()))return false;return true;});
  rows=sortExpenseRows(rows);
  const tot=rows.reduce((s,x)=>s+(+x.value||0),0);
  const pend=mE().filter(x=>x.status!=='pago').reduce((s,x)=>s+expRemaining(x),0);
  const lateC=mE().filter(isLate).length;

  let tablesHTML;
  if(eView==='separado'){
    const atrasadas=rows.filter(isLate);
    const pagas=rows.filter(x=>x.status==='pago');
    const pendentes=rows.filter(x=>x.status!=='pago'&&!isLate(x));
    const secao=(titulo,cor,arr,emptyMsg)=>`<p style="font-size:12px;font-weight:700;color:${cor};margin:16px 0 8px">${titulo} (${arr.length})</p>${expenseTableHTML(arr,cmap,emptyMsg)}`;
    tablesHTML = secao('&#128308; Atrasadas','var(--red)',atrasadas,'Nenhuma despesa atrasada')
      + secao('&#128993; Pendentes','var(--amber)',pendentes,'Nenhuma despesa pendente')
      + secao('&#128994; Pagas','var(--green)',pagas,'Nenhuma despesa paga');
  } else {
    tablesHTML = expenseTableHTML(rows,cmap);
  }

  // Filtros rápidos: "Todos" + "Atrasado" (calculado) + cada status cadastrado em ST.expStatuses
  const filterList=['todos',...ST.expStatuses,'atrasado'].filter((f,i,arr)=>arr.indexOf(f)===i);
  document.getElementById('content').innerHTML=`<div class="toolbar"><div class="filter-pills">${filterList.map(f=>`<button class="fpill${eF===f?' on':''}" onclick="setEF('${f}')">${f==='todos'?'Todos':f==='atrasado'?'Atrasado'+(lateC>0?` (${lateC})`:''):cap(f)}</button>`).join('')}</div><div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><input class="search-box" value="${eS}" placeholder="Buscar..." oninput="eS=this.value;renderPagar()"><span style="font-size:11px;color:var(--text2)">Pendente: <strong style="color:var(--red)">${fmt(pend)}</strong></span><button class="btn btn-primary" onclick="openExpModal()">${icon('plus')} Nova Despesa</button></div></div>
  <div class="toolbar" style="margin-top:-6px">
    <div class="form-field" style="min-width:190px"><label>Ordenar por</label>
      <select onchange="eSort=this.value;renderPagar()">
        <option value="venc-asc" ${eSort==='venc-asc'?'selected':''}>Vencimento (mais próximo)</option>
        <option value="venc-desc" ${eSort==='venc-desc'?'selected':''}>Vencimento (mais distante)</option>
        <option value="valor-desc" ${eSort==='valor-desc'?'selected':''}>Valor (maior primeiro)</option>
        <option value="valor-asc" ${eSort==='valor-asc'?'selected':''}>Valor (menor primeiro)</option>
        <option value="desc-az" ${eSort==='desc-az'?'selected':''}>Descrição (A-Z)</option>
      </select>
    </div>
    <div class="form-field" style="min-width:170px"><label>Exibir</label>
      <select onchange="eView=this.value;renderPagar()">
        <option value="junto" ${eView==='junto'?'selected':''}>Tudo junto</option>
        <option value="separado" ${eView==='separado'?'selected':''}>Separado por status</option>
      </select>
    </div>
  </div>
  ${tablesHTML}${rows.length?`<div style="text-align:right;padding:8px 4px;font-size:12px;color:var(--text2)">${rows.length} item${rows.length>1?'s':''} · Total: <strong>${fmt(tot)}</strong></div>`:''}`;
}
function setEF(f){eF=f;renderPagar();}

// Marca/desmarca uma despesa como paga.
// - Se ela ainda NÃO está paga: abre a modal de pagamento (js/receipts.js
//   → openPayModal), onde o usuário confirma a data/valor e opcionalmente
//   anexa o comprovante. É só ali, no momento do pagamento, que o recibo
//   entra em jogo (conforme pedido).
// - Se ela JÁ está paga: desfaz o pagamento (volta pra "pendente") e, se
//   havia uma movimentação bancária vinculada (conta debitada), ela é
//   removida — senão o saldo da conta ficaria descontado pra sempre mesmo
//   depois de desfazer o pagamento (bug corrigido na v5.0).
function toggleE(id){
  const x=ST.expenses.find(e=>e.id===id);if(!x)return;
  if(x.status==='pago'){x.status='pendente';removeLinkedMovement(id);sv();render();}
  else{openPayModal(id,'pagar');}
}
function delE(id){confirm2('Remover esta despesa?',()=>{ST.expenses=ST.expenses.filter(x=>x.id!==id);removeLinkedMovement(id);sv();notify('Removida','err');render();});}
function editE(id){
  const x=ST.expenses.find(e=>e.id===id);if(!x)return;_editId=id;
  document.getElementById('modal-exp-title').textContent='Editar Despesa';
  refreshGroupSelect();refreshExpStatusSelect();
  document.getElementById('exp-desc').value=x.desc||'';document.getElementById('exp-val').value=x.value||'';
  document.getElementById('exp-date').value=x.date||'';document.getElementById('exp-type').value=x.type||'fixa';
  document.getElementById('exp-parc').value=x.totalInstallments||1;document.getElementById('exp-grp').value=x.grp||ST.groups[0];
  document.getElementById('exp-card').value=x.cardId||'';document.getElementById('exp-status').value=x.status||'pendente';
  document.getElementById('exp-obs').value=x.obs||'';
  toggleExpFields();openModal('modal-exp');
}
function openExpModal(){
  _editId=null;document.getElementById('modal-exp-title').textContent='Nova Despesa';
  refreshGroupSelect();refreshExpStatusSelect();
  ['exp-desc','exp-obs'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('exp-val').value='';document.getElementById('exp-date').value=dd();
  document.getElementById('exp-type').value='fixa';document.getElementById('exp-parc').value=2;
  document.getElementById('exp-grp').value=ST.groups[0]||'';document.getElementById('exp-card').value='';
  document.getElementById('exp-status').value='pendente';document.getElementById('exp-recorrente').value='nao';
  toggleExpFields();openModal('modal-exp');
}
function toggleExpFields(){const t=document.getElementById('exp-type').value;document.getElementById('exp-parc-wrap').style.display=t==='parcelada'?'flex':'none';document.getElementById('exp-recorr-wrap').style.display=t==='fixa'?'flex':'none';}
function refreshCardSelect(){const s=document.getElementById('exp-card');if(!s)return;s.innerHTML='<option value="">Sem cartão (dinheiro/débito)</option>'+ST.cards.map(c=>`<option value="${c.id}">${c.name}</option>`).join('');}
function saveExp(){
  const desc=document.getElementById('exp-desc').value.trim(),val=parseFloat(document.getElementById('exp-val').value);
  if(!desc||isNaN(val)||val<=0){notify('Preencha Descrição e Valor','err');return;}
  const date=document.getElementById('exp-date').value,type=document.getElementById('exp-type').value;
  const parc=parseInt(document.getElementById('exp-parc').value)||1,grp=document.getElementById('exp-grp').value;
  const cardId=document.getElementById('exp-card').value,status=document.getElementById('exp-status').value;
  const obs=document.getElementById('exp-obs').value,recorr=document.getElementById('exp-recorrente').value==='sim';
  // Observação: o recibo/comprovante NÃO é anexado aqui — ele só é solicitado
  // no momento em que a despesa é marcada como paga (ver toggleE() acima e
  // openPayModal()/confirmPayment() em js/receipts.js).
  if(_editId){const x=ST.expenses.find(e=>e.id===_editId);if(x){Object.assign(x,{desc,value:val,date,type,grp,cardId,status,obs,totalInstallments:parc});
    // Mantém a movimentação vinculada (se essa despesa tiver uma — ex: veio
    // do Gasto Rápido ou foi paga vinculando uma conta) sincronizada com a
    // edição, senão ela ficaria com a descrição/valor antigos no extrato.
    // Uma despesa pode ter mais de uma movimentação vinculada (um pagamento
    // parcial gera uma movimentação própria a cada vez) — por isso
    // atualizamos a descrição/categoria de TODAS elas, mas NUNCA o valor:
    // cada movimentação já reflete o valor exato daquele pagamento
    // específico, que pode ser diferente do valor total da despesa.
    ST.movements.filter(m=>m.linkedId===_editId).forEach(m=>{
      const wasPartial = / \(pagamento parcial\)$/.test(m.desc);
      m.desc = desc + (wasPartial ? ' (pagamento parcial)' : '');
      m.category = grp;
    });
  }sv();notify('Despesa atualizada!');}
  else{
    if(type==='parcelada'&&parc>1){const g=gid();for(let i=0;i<parc;i++){const d=new Date(date+'T00:00');d.setMonth(d.getMonth()+i);ST.expenses.push({id:gid(),gid:g,desc,value:val,date:d.toISOString().split('T')[0],type,totalInstallments:parc,num:i+1,grp,cardId,status:'pendente',obs});}notify(`${parc} parcelas criadas!`,'info');}
    else if(type==='fixa'&&recorr){const g=gid();for(let i=0;i<12;i++){const d=new Date(date+'T00:00');d.setMonth(d.getMonth()+i);ST.expenses.push({id:gid(),gid:g,desc,value:val,date:d.toISOString().split('T')[0],type:'fixa',totalInstallments:12,num:i+1,grp,cardId,status:'pendente',obs});}notify('Despesa fixa gerada para 12 meses!','info');}
    else{ST.expenses.push({id:gid(),desc,value:val,date,type,totalInstallments:1,num:1,grp,cardId,status,obs});notify('Despesa adicionada!');}
    sv();
  }
  closeModal('modal-exp');render();
}
