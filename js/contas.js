
// FinPessoal v5.0 – Contas Bancárias
//
// Regra de negócio importante: o saldo aqui mostrado é só informativo — ele
// NÃO é somado/abatido automaticamente contra despesas ou dívidas pendentes
// em nenhum lugar do sistema. A única forma de uma despesa "consumir" saldo
// de uma conta é através da modal de confirmação de pagamento (ver
// js/receipts.js), onde o usuário escolhe explicitamente a conta usada.

let scAcc = '#3b82f6'; // cor selecionada no formulário de conta (swatch)

function renderContas(){
  const ativas = ST.accounts.filter(a=>a.status!=='inativa');
  const totalAtivas = ativas.reduce((s,a)=>s+accountBalance(a.id),0);
  const html = ST.accounts.length ? ST.accounts.map(a=>{
    const bal = accountBalance(a.id);
    const inativa = a.status==='inativa';
    return `<div style="flex:0 0 auto;width:260px;${inativa?'opacity:.5':''}">
      <div class="credit-card" style="background:linear-gradient(135deg,${a.color}ee,${a.color}88)">
        <div style="display:flex;justify-content:space-between;margin-bottom:12px">
          <div style="font-size:8px;opacity:.7;letter-spacing:1.5px">${(a.type||'CORRENTE').toUpperCase()}</div>
          <div style="font-size:11px;opacity:.8;font-weight:600">${inativa?'Inativa':'Ativa'}</div>
        </div>
        <div style="font-size:17px;font-weight:700;margin-bottom:2px">${a.name}</div>
        <div style="font-size:11px;opacity:.8;margin-bottom:14px">${a.bank||'—'}${a.agency?` · Ag ${a.agency}`:''}${a.number?` · Cc ${a.number}`:''}</div>
        <div style="font-size:10px;opacity:.7;text-transform:uppercase;letter-spacing:.5px">Saldo atual</div>
        <div style="font-size:20px;font-weight:800">${fmt(bal)}</div>
      </div>
      ${a.pix?`<div style="display:flex;align-items:center;gap:6px;background:var(--bg3);border-radius:var(--radius);padding:6px 8px;margin-bottom:8px;">
        <span style="font-size:11px;color:var(--text2);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${a.pix}">${icon('key')} ${a.pix}</span>
        <button class="btn-sm" id="pix-copy-${a.id}" onclick="copyPix('${a.id}')">Copiar</button>
      </div>`:''}
      <div style="display:flex;justify-content:space-between;align-items:center;padding:0 2px">
        <span style="font-size:11px;color:var(--text2)">Saldo inicial: ${fmt(a.initialBalance)}</span>
        <div>
          <button class="btn-sm" onclick="toggleAccStatus('${a.id}')" title="${inativa?'Reativar':'Desativar'}">${inativa?icon('refresh-cw'):icon('pause')}</button>
          <button class="btn-sm edit" onclick="editAcc('${a.id}')">${icon('pencil')}</button>
          <button class="btn-sm del" onclick="delAcc('${a.id}')">${icon('trash-2')}</button>
        </div>
      </div>
    </div>`;
  }).join('') : '<div class="empty" style="padding:80px">Nenhuma conta cadastrada. Clique em "+ Nova Conta".</div>';

  document.getElementById('content').innerHTML = `
    <div class="kpi-grid" style="grid-template-columns:repeat(2,1fr);margin-bottom:18px">
      <div class="kpi" style="border-left-color:var(--purple)"><div class="kpi-label">Saldo total (contas ativas)</div><div class="kpi-value" style="color:var(--purple)">${fmt(totalAtivas)}</div><div class="kpi-sub">${ativas.length} conta${ativas.length!==1?'s':''} ativa${ativas.length!==1?'s':''}</div></div>
      <div class="kpi" style="border-left-color:var(--text3)"><div class="kpi-label">Total de contas cadastradas</div><div class="kpi-value" style="color:var(--text2)">${ST.accounts.length}</div><div class="kpi-sub">inclui inativas</div></div>
    </div>
    <p style="font-size:11px;color:var(--text3);margin-bottom:14px">💡 Esse saldo é independente das suas despesas pendentes — ele só muda quando você vincula um pagamento/recebimento a uma conta.</p>
    <div class="toolbar"><span style="font-size:12px;color:var(--text2)">${ST.accounts.length} conta${ST.accounts.length!==1?'s':''}</span><button class="btn btn-primary" onclick="openAccModal()">${icon('plus')} Nova Conta</button></div>
    <div style="display:flex;flex-wrap:wrap;gap:16px">${html}</div>`;
}

function openAccModal(){
  _editId=null;
  document.getElementById('modal-acc-title').textContent='Nova Conta Bancária';
  ['acc-name','acc-bank','acc-agency','acc-number','acc-pix'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('acc-type').value='corrente';
  document.getElementById('acc-initial').value='';
  document.getElementById('acc-status').value='ativa';
  buildAccSwatches('#3b82f6');
  openModal('modal-acc');
}
function editAcc(id){
  const a=ST.accounts.find(x=>x.id===id);if(!a)return;_editId=id;
  document.getElementById('modal-acc-title').textContent='Editar Conta Bancária';
  document.getElementById('acc-name').value=a.name||'';document.getElementById('acc-bank').value=a.bank||'';
  document.getElementById('acc-agency').value=a.agency||'';document.getElementById('acc-number').value=a.number||'';
  document.getElementById('acc-type').value=a.type||'corrente';
  document.getElementById('acc-initial').value=a.initialBalance||0;
  document.getElementById('acc-status').value=a.status||'ativa';
  document.getElementById('acc-pix').value=a.pix||'';
  buildAccSwatches(a.color||'#3b82f6');
  openModal('modal-acc');
}
function delAcc(id){
  const hasMov = ST.movements.some(m=>m.accountId===id||m.toAccountId===id);
  confirm2(hasMov?'Esta conta possui movimentações. Removê-la NÃO apaga o histórico, mas ele passará a mostrar "Conta removida". Continuar?':'Remover esta conta?',()=>{
    ST.accounts=ST.accounts.filter(a=>a.id!==id);sv();notify('Conta removida','err');render();
  });
}
function toggleAccStatus(id){
  const a=ST.accounts.find(x=>x.id===id);if(!a)return;
  a.status = a.status==='inativa' ? 'ativa' : 'inativa';
  sv();notify(a.status==='ativa'?'Conta reativada':'Conta desativada');render();
}
function buildAccSwatches(sel){
  scAcc=sel;const w=document.getElementById('acc-color-swatches');if(!w)return;
  const CCOLORS=['#3b82f6','#6366f1','#ef4444','#f59e0b','#10b981','#8b5cf6','#ec4899','#0ea5e9','#22c55e','#334155'];
  w.innerHTML=CCOLORS.map(c=>`<div onclick="buildAccSwatches('${c}')" style="width:24px;height:24px;border-radius:50%;background:${c};cursor:pointer;border:2px solid ${c===scAcc?'var(--text)':'transparent'};flex-shrink:0"></div>`).join('')+`<input type="color" value="${sel}" oninput="buildAccSwatches(this.value)" style="width:26px;height:26px;border:none;border-radius:50%;cursor:pointer;padding:0">`;
}
function saveAcc(){
  const name=document.getElementById('acc-name').value.trim();
  const initial=parseFloat(document.getElementById('acc-initial').value)||0;
  if(!name){notify('Preencha o nome da conta','err');return;}
  const obj={
    name, bank:document.getElementById('acc-bank').value, agency:document.getElementById('acc-agency').value,
    number:document.getElementById('acc-number').value, type:document.getElementById('acc-type').value,
    color:scAcc, initialBalance:initial, status:document.getElementById('acc-status').value,
    pix:document.getElementById('acc-pix').value.trim()
  };
  if(_editId){Object.assign(ST.accounts.find(a=>a.id===_editId),obj);notify('Conta atualizada!');}
  else{ST.accounts.push({...obj,id:gid()});notify('Conta adicionada!');}
  sv();closeModal('modal-acc');render();
}

// Copia o código PIX da conta pra área de transferência, com confirmação
// visual no próprio botão (muda o texto por 1.5s) além do toast de notify().
function copyPix(id){
  const a=ST.accounts.find(x=>x.id===id);if(!a||!a.pix)return;
  const finish=(ok)=>{
    const btn=document.getElementById('pix-copy-'+id);
    if(btn){const original=btn.textContent;btn.textContent=ok?'✓ Copiado!':'Erro';setTimeout(()=>{if(btn)btn.textContent=original;},1500);}
    notify(ok?'Chave PIX copiada!':'Não foi possível copiar', ok?'ok':'err');
  };
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(a.pix).then(()=>finish(true)).catch(()=>finish(false));
  } else {
    // Fallback pra navegadores/contextos sem suporte à Clipboard API (ex: http:// não-localhost)
    const ta=document.createElement('textarea');
    ta.value=a.pix;ta.style.position='fixed';ta.style.opacity='0';
    document.body.appendChild(ta);ta.select();
    try{document.execCommand('copy');finish(true);}catch(e){finish(false);}
    ta.remove();
  }
}

// Preenche um <select> com as contas ATIVAS (usado nos modais de pagamento,
// recebimento e movimentações). `emptyLabel` é o texto da primeira opção
// (ex: "Não vincular a nenhuma conta" ou "Selecione a conta...").
function refreshAccountSelect(selectId, emptyLabel){
  const s=document.getElementById(selectId);if(!s)return;
  const current=s.value;
  const ativas=ST.accounts.filter(a=>a.status!=='inativa');
  s.innerHTML=`<option value="">${emptyLabel||'Nenhuma conta'}</option>`+ativas.map(a=>`<option value="${a.id}">${a.name} (${fmt(accountBalance(a.id))})</option>`).join('');
  if(ativas.some(a=>a.id===current)) s.value=current;
}
