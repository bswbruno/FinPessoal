
// FinPessoal v9.3 – Dívidas Parceladas
function renderDividas(){
  const groups={};ST.expenses.filter(x=>x.type==='parcelada'&&x.gid).forEach(x=>{if(!groups[x.gid])groups[x.gid]=[];groups[x.gid].push(x);});
  const sorted=Object.values(groups).sort((a,b)=>b.filter(x=>x.status!=='pago').length-a.filter(x=>x.status!=='pago').length);
  if(!sorted.length){document.getElementById('content').innerHTML='<div class="empty" style="padding:80px">Nenhuma dívida parcelada.<br>Adicione despesas parceladas em "A Pagar".</div>';return;}
  document.getElementById('content').innerHTML=`<p style="font-size:12px;color:var(--text2);margin-bottom:12px">${sorted.length} dívida${sorted.length>1?'s ativas':' ativa'}</p>`+sorted.map(rows=>{
    rows.sort((a,b)=>a.num-b.num);const f=rows[0];
    // "rem" usa expRemaining() em vez do valor cheio, pra refletir corretamente
    // parcelas que já tiveram pagamento parcial (ver js/receipts.js).
    const paid=rows.filter(x=>x.status==='pago').length,rem=rows.filter(x=>x.status!=='pago').reduce((s,x)=>s+expRemaining(x),0);
    const total=rows.reduce((s,x)=>s+(+x.value||0),0),next=rows.filter(x=>x.status!=='pago').sort((a,b)=>new Date(a.date)-new Date(b.date))[0];
    const pct=rows.length?(paid/rows.length)*100:0,done=paid===rows.length;
    const c=ST.cards.find(c=>c.id===f.cardId);
    return`<div class="div-card" style="${done?'opacity:.55':''}"><div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px"><div><div style="font-weight:700;font-size:14px">${f.desc}</div><div style="font-size:11px;color:var(--text2);margin-top:2px">${f.grp||'Outros'} · ${rows.length} parcelas · ${fmt(f.value)}/mês${c?` · <span style="color:${c.color};font-weight:600">${c.name}</span>`:''}</div></div><div style="text-align:right"><div style="font-size:16px;font-weight:700;color:${done?'var(--green)':'var(--red)'}">${fmt(rem)}</div><div style="font-size:10px;color:var(--text3)">${done?'Quitado '+icon('check'):'restante de '+fmt(total)}</div></div></div><div class="progress" style="margin-bottom:6px"><div class="progress-fill" style="background:${done?'var(--green)':'var(--purple)'};width:${pct}%"></div></div><div style="display:flex;justify-content:space-between;align-items:center"><span style="font-size:11px;color:var(--text2)">${paid}/${rows.length} pagas${next?' · próxima: '+fmtD(next.date)+' ('+fmt(next.value)+')':''}</span><button class="btn" style="font-size:11px;padding:4px 10px" onclick="showParcelas('${f.gid}')">Ver parcelas</button></div></div>`;
  }).join('');
}
function showParcelas(gid){
  const rows=ST.expenses.filter(x=>x.gid===gid).sort((a,b)=>a.num-b.num);if(!rows.length)return;
  const f=rows[0],paid=rows.filter(x=>x.status==='pago').length,rem=rows.filter(x=>x.status!=='pago').reduce((s,x)=>s+expRemaining(x),0);
  document.getElementById('parc-modal-title').textContent=f.desc+' – Parcelas';
  document.getElementById('parc-modal-body').innerHTML=`<div style="display:flex;gap:8px;margin-bottom:12px"><div style="flex:1;background:var(--bg3);border-radius:8px;padding:10px 12px"><div style="font-size:10px;color:var(--text2);text-transform:uppercase">Pagas</div><div style="font-size:18px;font-weight:700;color:var(--green)">${paid}/${rows.length}</div></div><div style="flex:1;background:var(--bg3);border-radius:8px;padding:10px 12px"><div style="font-size:10px;color:var(--text2);text-transform:uppercase">Restante</div><div style="font-size:18px;font-weight:700;color:var(--red)">${fmt(rem)}</div></div></div><div class="progress" style="margin-bottom:12px"><div class="progress-fill" style="background:var(--purple);width:${rows.length?(paid/rows.length)*100:0}%"></div></div><div class="table-wrap"><table><thead><tr><th>Parcela</th><th>Vencimento</th><th>Valor</th><th>Status</th><th></th></tr></thead><tbody>${rows.map(r=>{
    const parcial=isPartial(r);
    const st=r.status==='pago'?'Pago':parcial?'Parcial':isLate(r)?'Atrasado':'Pendente';
    const spCls=r.status==='pago'?'pill-pago':parcial?'pill-info':isLate(r)?'pill-late':'pill-pend';
    const valCell=parcial?`${fmt(r.value)}<div style="font-size:10px;font-weight:400;color:var(--text2)">pago ${fmt(r.paidAmount)} · falta ${fmt(expRemaining(r))}</div>`:fmt(r.value);
    const payLabel=r.status==='pago'?icon('check')+' Pago':parcial?'Pagar restante':'Pagar';
    return`<tr><td>${r.num}/${r.totalInstallments}</td><td style="color:${isLate(r)?'var(--red)':'inherit'}">${fmtD(r.date)}</td><td style="font-weight:600">${valCell}</td><td><span class="pill ${spCls}">${st}</span></td><td style="white-space:nowrap"><button class="btn-sm ${r.status==='pago'?'marked':'mark'}" onclick="toggleEP('${r.id}','${gid}')">${payLabel}</button> ${r.receipt?`<button class="btn-sm receipt" onclick="viewReceipt('${r.id}')" title="Ver recibo">${icon('paperclip')}</button>`:''}</td></tr>`;
  }).join('')}</tbody></table></div>`;
  openModal('modal-parcelas');
}
// Mesma lógica de toggleE() em js/pagar.js: marcar como paga abre a modal de
// pagamento (com opção de pagamento parcial e anexar comprovante); desmarcar
// reverte a movimentação bancária vinculada.
function toggleEP(id,g){
  const x=ST.expenses.find(e=>e.id===id);if(!x)return;
  if(x.status==='pago'){x.status='pendente';x.paidAmount=0;removeLinkedMovement(id);sv();showParcelas(g);renderDividas();}
  else{openPayModal(id,'divida',g);}
}
