
// FinPessoal v5.0 – Cartões
let sc='#6366f1';

function renderCartoes(){
  const html=ST.cards.length?ST.cards.map(c=>{
    const committed=cardCommitted(c.id);
    const available=Math.max(0,(+c.limit||0)-committed);
    const pct=c.limit>0?Math.min(100,(committed/c.limit)*100):0;
    const hasCycle=!!c.fechamento;
    const invoice=hasCycle?cardCurrentInvoice(c):null;
    const bestDay=hasCycle?cardBestPurchaseDay(c):null;
    const dueStr=invoice&&invoice.dueDate?dateToStr(invoice.dueDate):null;

    return`<div style="flex:0 0 auto;width:280px">
      <div class="credit-card" style="background:linear-gradient(135deg,${c.color}ee,${c.color}88)">
        <div style="display:flex;justify-content:space-between;margin-bottom:12px"><div style="font-size:8px;opacity:.7;letter-spacing:1.5px">CRÉDITO</div><div style="font-size:11px;opacity:.8;font-weight:600">${c.brand||'Visa'}</div></div>
        <div style="font-size:17px;font-weight:700;margin-bottom:6px">${c.name}</div>
        <div style="font-size:11px;opacity:.8;letter-spacing:2px;margin-bottom:12px">•••• •••• •••• ${c.digits||'****'}</div>
        <div style="background:rgba(0,0,0,.2);border-radius:3px;height:4px;margin-bottom:6px"><div style="background:rgba(255,255,255,.85);width:${pct}%;height:100%;border-radius:3px"></div></div>
        <div style="display:flex;justify-content:space-between;font-size:11px"><span>Limite: ${fmt(c.limit)}</span><span>${Math.round(pct)}% comprometido</span></div>
        ${hasCycle?`<div style="font-size:10px;opacity:.65;margin-top:6px">Fecha dia ${c.fechamento} · Vence dia ${c.vencimento||'—'}</div>`:''}
      </div>
      <div style="padding:10px 2px 0">
        <div class="sum-row"><span style="color:var(--text2)">Limite disponível</span><strong style="color:var(--green)">${fmt(available)}</strong></div>
        <div class="sum-row"><span style="color:var(--text2)">Comprometido (todas parcelas)</span><strong style="color:var(--red)">${fmt(committed)}</strong></div>
        ${hasCycle?`<div class="sum-row"><span style="color:var(--text2)">Fatura atual</span><strong>${fmt(invoice.total)}</strong></div>
        <div class="sum-row"><span style="color:var(--text2)">Vencimento da fatura</span><span>${dueStr?fmtD(dueStr):'—'}</span></div>
        <div class="sum-row"><span style="color:var(--text2)">Melhor dia de compra</span><span>Dia ${bestDay}</span></div>`:`<p style="font-size:11px;color:var(--text3);margin-top:6px">💡 Preencha o fechamento/vencimento pra ver a fatura atual e o melhor dia de compra.</p>`}
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 2px 0">
        ${hasCycle?`<button class="btn-sm" onclick="showCardInvoice('${c.id}')">${icon('receipt')} Ver fatura atual</button>`:'<span></span>'}
        <div><button class="btn-sm edit" onclick="editC('${c.id}')">${icon('pencil')} Editar</button> <button class="btn-sm del" onclick="delC('${c.id}')">${icon('trash-2')}</button></div>
      </div>
    </div>`;
  }).join(''):'<div class="empty" style="padding:80px">Nenhum cartão. Clique em "+ Novo Cartão".</div>';
  document.getElementById('content').innerHTML=`<div class="toolbar"><span style="font-size:12px;color:var(--text2)">${ST.cards.length} cartão${ST.cards.length!==1?'ões':''}</span><button class="btn btn-primary" onclick="openCardModal()">${icon('plus')} Novo Cartão</button></div><div style="display:flex;flex-wrap:wrap;gap:16px">${html}</div>`;
}

// Mostra os itens da fatura ATUAL (ciclo em aberto) daquele cartão.
function showCardInvoice(cardId){
  const c=ST.cards.find(x=>x.id===cardId);if(!c)return;
  const invoice=cardCurrentInvoice(c);
  document.getElementById('card-invoice-title').textContent='Fatura Atual — '+c.name;
  const dueStr=invoice.dueDate?dateToStr(invoice.dueDate):null;
  const header=`<div style="display:flex;gap:8px;margin-bottom:14px">
    <div style="flex:1;background:var(--bg3);border-radius:8px;padding:10px 12px"><div style="font-size:10px;color:var(--text2);text-transform:uppercase">Total da fatura</div><div style="font-size:16px;font-weight:700">${fmt(invoice.total)}</div></div>
    <div style="flex:1;background:var(--bg3);border-radius:8px;padding:10px 12px"><div style="font-size:10px;color:var(--text2);text-transform:uppercase">Pendente</div><div style="font-size:16px;font-weight:700;color:var(--red)">${fmt(invoice.pending)}</div></div>
    <div style="flex:1;background:var(--bg3);border-radius:8px;padding:10px 12px"><div style="font-size:10px;color:var(--text2);text-transform:uppercase">Vencimento</div><div style="font-size:16px;font-weight:700">${dueStr?fmtD(dueStr):'—'}</div></div>
  </div>`;
  const rows=invoice.items.length?invoice.items.map(x=>`<tr><td>${fmtD(x.date)}</td><td>${x.desc}</td><td style="font-weight:600">${fmt(x.value)}</td><td><span class="pill ${x.status==='pago'?'pill-pago':isLate(x)?'pill-late':'pill-pend'}">${x.status==='pago'?'Pago':isLate(x)?'Atrasado':'Pendente'}</span></td></tr>`).join(''):'<tr><td colspan="4" class="empty">Nenhum lançamento nesse ciclo ainda.</td></tr>';
  document.getElementById('card-invoice-body').innerHTML=header+`<div class="table-wrap"><table><thead><tr><th>Data</th><th>Descrição</th><th>Valor</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  openModal('modal-card-invoice');
}

function openCardModal(){_editId=null;document.getElementById('modal-card-title').textContent='Novo Cartão';['card-name','card-digits','card-fech','card-venc'].forEach(id=>document.getElementById(id).value='');document.getElementById('card-limit').value='';document.getElementById('card-brand').value='Visa';buildSwatches('#6366f1');updateCardPreview();openModal('modal-card');}
function editC(id){const c=ST.cards.find(x=>x.id===id);if(!c)return;_editId=id;document.getElementById('modal-card-title').textContent='Editar Cartão';document.getElementById('card-name').value=c.name||'';document.getElementById('card-digits').value=c.digits||'';document.getElementById('card-limit').value=c.limit||'';document.getElementById('card-brand').value=c.brand||'Visa';document.getElementById('card-fech').value=c.fechamento||'';document.getElementById('card-venc').value=c.vencimento||'';buildSwatches(c.color||'#6366f1');updateCardPreview();openModal('modal-card');}
function delC(id){confirm2('Remover este cartão?',()=>{ST.cards=ST.cards.filter(c=>c.id!==id);sv();notify('Cartão removido','err');render();});}
function buildSwatches(sel){sc=sel;const w=document.getElementById('color-swatches');const CCOLORS=['#6366f1','#ef4444','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ec4899','#0ea5e9','#22c55e','#334155'];w.innerHTML=CCOLORS.map(c=>`<div onclick="selectColor('${c}')" style="width:24px;height:24px;border-radius:50%;background:${c};cursor:pointer;border:2px solid ${c===sc?'#1a1d23':'transparent'};flex-shrink:0"></div>`).join('')+`<input type="color" value="${sel}" oninput="selectColor(this.value)" style="width:26px;height:26px;border:none;border-radius:50%;cursor:pointer;padding:0">`;}
function selectColor(c){sc=c;buildSwatches(c);document.getElementById('card-preview').style.background=`linear-gradient(135deg,${c}ee,${c}88)`;}
function updateCardPreview(){document.getElementById('prev-name').textContent=document.getElementById('card-name').value||'Nome do Cartão';document.getElementById('prev-digits').textContent='•••• •••• •••• '+(document.getElementById('card-digits').value||'0000');document.getElementById('prev-limit').textContent='Limite: '+fmt(document.getElementById('card-limit').value);document.getElementById('prev-brand').textContent=document.getElementById('card-brand').value||'Visa';}
function saveCard(){
  const name=document.getElementById('card-name').value.trim(),limit=parseFloat(document.getElementById('card-limit').value);
  if(!name||isNaN(limit)||limit<=0){notify('Preencha Nome e Limite','err');return;}
  const obj={name,digits:document.getElementById('card-digits').value,limit,brand:document.getElementById('card-brand').value,color:sc,fechamento:document.getElementById('card-fech').value,vencimento:document.getElementById('card-venc').value};
  if(_editId){Object.assign(ST.cards.find(c=>c.id===_editId),obj);notify('Cartão atualizado!');}
  else{ST.cards.push({...obj,id:gid()});notify('Cartão adicionado!');}
  sv();closeModal('modal-card');render();refreshCardSelect();
}
