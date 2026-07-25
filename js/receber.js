
// FinPessoal v4.9 – A Receber
let iF='todos', iS='';
let iSort='venc-asc';  // venc-asc (padrão) | venc-desc | valor-asc | valor-desc | desc-az
let iView='junto';     // 'junto' | 'separado'

// Aparência (classe da pill + rótulo) para cada status de receita. 'recebido'
// tem estilo fixo; qualquer status extra cadastrado em Configurações
// (js/categorias.js) usa "pill-gray" mostrando o próprio texto cadastrado.
function incStatusPill(x){
  if(x.status==='recebido') return {cls:'pill-pago', label:'Recebido'};
  if(x.status==='pendente') return {cls:'pill-pend', label:'Pendente'};
  return {cls:'pill-gray', label:cap(x.status)};
}
function sortIncomeRows(rows){
  const arr=[...rows];
  if(iSort==='venc-asc')  arr.sort((a,b)=>new Date(a.date)-new Date(b.date));
  else if(iSort==='venc-desc') arr.sort((a,b)=>new Date(b.date)-new Date(a.date));
  else if(iSort==='valor-asc')  arr.sort((a,b)=>(+a.value||0)-(+b.value||0));
  else if(iSort==='valor-desc') arr.sort((a,b)=>(+b.value||0)-(+a.value||0));
  else if(iSort==='desc-az') arr.sort((a,b)=>a.desc.localeCompare(b.desc,'pt-BR'));
  return arr;
}
function incomeRowHTML(x){
  const {cls:sp,label:st}=incStatusPill(x);
  const rowBg=x.status==='recebido'?'background:var(--green-light)':isLate(x)?'background:var(--red-light)':'';
  return `<tr style="${rowBg}"><td style="color:${isLate(x)?'var(--red)':'inherit'}">${fmtD(x.date)}</td><td style="font-weight:600;max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${x.desc}</td><td style="color:var(--text2)">${x.src||'—'}</td><td><span class="pill pill-green" style="font-size:10px">${x.type||'Outros'}</span></td><td style="color:var(--text2)">${x.rec==='parcelada'?x.num+'/'+x.totalInstallments:x.rec==='mensal'?'Mensal':'—'}</td><td style="font-weight:700;color:var(--green)">${fmt(x.value)}</td><td><span class="pill ${sp}">${st}</span></td><td style="white-space:nowrap"><button class="btn-sm ${x.status==='recebido'?'marked':'mark'}" onclick="toggleI('${x.id}')">${x.status==='recebido'?icon('check'):'Receber'}</button> <button class="btn-sm edit" onclick="editI('${x.id}')">${icon('pencil')}</button> <button class="btn-sm del" onclick="delI('${x.id}')">${icon('trash-2')}</button></td></tr>`;
}
function incomeTableHTML(rowsArr, emptyMsg){
  const tbody=rowsArr.length?rowsArr.map(incomeRowHTML).join(''):`<tr><td colspan="8" class="empty">${emptyMsg||'Nenhuma receita encontrada'}</td></tr>`;
  return `<div class="table-wrap"><table><thead><tr><th>Data</th><th>Descrição</th><th>Origem</th><th>Tipo</th><th>Parc.</th><th>Valor</th><th>Status</th><th>Ações</th></tr></thead><tbody>${tbody}</tbody></table></div>`;
}

function renderReceber(){
  let rows=mI().filter(x=>{if(iF!=='todos'&&x.status!==iF)return false;if(iS&&!x.desc.toLowerCase().includes(iS.toLowerCase())&&!(x.src||'').toLowerCase().includes(iS.toLowerCase()))return false;return true;});
  rows=sortIncomeRows(rows);
  const tot=mI().reduce((s,x)=>s+(+x.value||0),0),rc=mI().filter(x=>x.status==='recebido').reduce((s,x)=>s+(+x.value||0),0);

  let tablesHTML;
  if(iView==='separado'){
    const atrasadas=rows.filter(isLate);
    const recebidas=rows.filter(x=>x.status==='recebido');
    const pendentes=rows.filter(x=>x.status!=='recebido'&&!isLate(x));
    const secao=(titulo,arr,emptyMsg)=>`<p style="font-size:12px;font-weight:700;margin:16px 0 8px">${titulo} (${arr.length})</p>${incomeTableHTML(arr,emptyMsg)}`;
    tablesHTML = secao('&#128308; Atrasadas',atrasadas,'Nenhuma receita atrasada')
      + secao('&#128993; Pendentes',pendentes,'Nenhuma receita pendente')
      + secao('&#128994; Recebidas',recebidas,'Nenhuma receita recebida');
  } else {
    tablesHTML = incomeTableHTML(rows);
  }

  const filterList=['todos',...ST.incStatuses].filter((f,i,arr)=>arr.indexOf(f)===i);
  document.getElementById('content').innerHTML=`<div class="toolbar"><div style="display:flex;gap:5px;flex-wrap:wrap">${filterList.map(f=>`<button class="fpill${iF===f?' on':''}" onclick="setIF('${f}')">${f==='todos'?'Todos':cap(f)}</button>`).join('')}</div><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span style="font-size:11px;color:var(--text2)">Recebido: <strong style="color:var(--green)">${fmt(rc)}</strong> / ${fmt(tot)}</span><input class="search-box" value="${iS}" placeholder="Buscar..." oninput="iS=this.value;renderReceber()"><button class="btn btn-success" onclick="openIncModal()">${icon('plus')} Nova Receita</button></div></div>
  <div class="toolbar" style="margin-top:-6px">
    <div class="form-field" style="min-width:190px"><label>Ordenar por</label>
      <select onchange="iSort=this.value;renderReceber()">
        <option value="venc-asc" ${iSort==='venc-asc'?'selected':''}>Vencimento (mais próximo)</option>
        <option value="venc-desc" ${iSort==='venc-desc'?'selected':''}>Vencimento (mais distante)</option>
        <option value="valor-desc" ${iSort==='valor-desc'?'selected':''}>Valor (maior primeiro)</option>
        <option value="valor-asc" ${iSort==='valor-asc'?'selected':''}>Valor (menor primeiro)</option>
        <option value="desc-az" ${iSort==='desc-az'?'selected':''}>Descrição (A-Z)</option>
      </select>
    </div>
    <div class="form-field" style="min-width:170px"><label>Exibir</label>
      <select onchange="iView=this.value;renderReceber()">
        <option value="junto" ${iView==='junto'?'selected':''}>Tudo junto</option>
        <option value="separado" ${iView==='separado'?'selected':''}>Separado por status</option>
      </select>
    </div>
  </div>
  ${tablesHTML}`;
}
function setIF(f){iF=f;renderReceber();}
// Marca/desmarca uma receita como recebida.
// - Ainda NÃO recebida: abre a modal de confirmação (js/movimentacoes.js →
//   openReceiveModal), onde se pode escolher em qual conta o dinheiro entrou.
// - Já recebida: desfaz direto e reverte a movimentação bancária vinculada,
//   se houver (bug corrigido na v4.9 — mesma lógica de toggleE em js/pagar.js).
function toggleI(id){
  const x=ST.incomes.find(i=>i.id===id);if(!x)return;
  if(x.status==='recebido'){x.status='pendente';removeLinkedMovement(id);sv();render();}
  else{openReceiveModal(id);}
}
function delI(id){confirm2('Remover esta receita?',()=>{ST.incomes=ST.incomes.filter(x=>x.id!==id);removeLinkedMovement(id);sv();notify('Removida','err');render();});}
function editI(id){
  const x=ST.incomes.find(i=>i.id===id);if(!x)return;_editId=id;
  document.getElementById('modal-inc-title').textContent='Editar Receita';
  refreshIncStatusSelect();
  document.getElementById('inc-desc').value=x.desc||'';document.getElementById('inc-src').value=x.src||'';
  document.getElementById('inc-val').value=x.value||'';document.getElementById('inc-type').value=x.type||'Salário';
  document.getElementById('inc-rec').value=x.rec||'unico';document.getElementById('inc-parc').value=x.totalInstallments||2;
  document.getElementById('inc-date').value=x.date||'';document.getElementById('inc-status').value=x.status||'pendente';
  document.getElementById('inc-obs').value=x.obs||'';toggleIncFields();openModal('modal-inc');
}
function openIncModal(){
  _editId=null;document.getElementById('modal-inc-title').textContent='Nova Receita';
  refreshIncStatusSelect();
  ['inc-desc','inc-src','inc-obs'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('inc-val').value='';document.getElementById('inc-date').value=dd();
  document.getElementById('inc-type').value='Salário';document.getElementById('inc-rec').value='unico';
  document.getElementById('inc-parc').value=2;document.getElementById('inc-status').value='pendente';
  toggleIncFields();openModal('modal-inc');
}
function toggleIncFields(){document.getElementById('inc-parc-wrap').style.display=document.getElementById('inc-rec').value==='parcelada'?'flex':'none';}
function saveInc(){
  const desc=document.getElementById('inc-desc').value.trim(),val=parseFloat(document.getElementById('inc-val').value);
  if(!desc||isNaN(val)||val<=0){notify('Preencha Descrição e Valor','err');return;}
  const src=document.getElementById('inc-src').value,date=document.getElementById('inc-date').value;
  const type=document.getElementById('inc-type').value,rec=document.getElementById('inc-rec').value;
  const parc=parseInt(document.getElementById('inc-parc').value)||1,status=document.getElementById('inc-status').value;
  const obs=document.getElementById('inc-obs').value;
  if(_editId){const x=ST.incomes.find(i=>i.id===_editId);if(x){Object.assign(x,{desc,src,value:val,date,type,rec,status,obs,totalInstallments:parc});
    const linkedMov=ST.movements.find(m=>m.linkedId===_editId);
    if(linkedMov){linkedMov.desc=desc;linkedMov.value=val;linkedMov.date=date;linkedMov.category=type;}
  }sv();notify('Receita atualizada!');}
  else{
    const cnt=rec==='mensal'?12:rec==='parcelada'?parc:1;
    if(cnt>1){const g=gid();for(let i=0;i<cnt;i++){const d=new Date(date+'T00:00');d.setMonth(d.getMonth()+i);ST.incomes.push({id:gid(),gid:g,desc,src,value:val,date:d.toISOString().split('T')[0],type,rec,totalInstallments:cnt,num:i+1,status:'pendente',obs});}notify(`${cnt} lançamentos criados!`,'info');}
    else{ST.incomes.push({id:gid(),desc,src,value:val,date,type,rec,totalInstallments:1,num:1,status,obs});notify('Receita adicionada!');}
    sv();
  }
  closeModal('modal-inc');render();
}
