
// FinPessoal v4.9 – Gasto Rápido (dia a dia)
//
// Um jeito rápido de lançar pequenas despesas do cotidiano (lanchonete,
// mercado, farmácia, Uber...) sem passar pelo formulário completo de "A
// Pagar". Ao salvar, entra normalmente na lista de despesas — já como
// "pago" (porque gasto do dia a dia já é pago na hora da compra) — e, se
// uma conta bancária for escolhida, gera a movimentação de saída e debita
// o saldo, igual ao fluxo de pagamento normal.

// Categorias de atalho (nome exibido, descrição pré-preenchida, grupo).
// Mapeadas pros grupos padrão do sistema — se o usuário tiver renomeado ou
// apagado esses grupos em Configurações, cai no primeiro grupo disponível.
const QUICK_CATEGORIES = [
  { icon:'utensils',     label:'Lanchonete', grp:'Alimentação' },
  { icon:'shopping-cart',label:'Mercado',    grp:'Alimentação' },
  { icon:'croissant',    label:'Padaria',    grp:'Alimentação' },
  { icon:'pill',         label:'Farmácia',   grp:'Saúde' },
  { icon:'car',          label:'Uber',       grp:'Automóvel' },
  { icon:'clapperboard', label:'Cinema',     grp:'Lazer' },
  { icon:'pencil-line',  label:'Outro',      grp:null },
];
const QUICK_PAYMENT_METHODS = ['Dinheiro','Débito','Crédito','PIX'];

let qexpGrp = null;         // grupo selecionado (via categoria de atalho)
let qexpPaymentMethod = null;

function openQuickExpenseModal(){
  document.getElementById('qexp-desc').value='';
  document.getElementById('qexp-value').value='';
  qexpGrp=null;qexpPaymentMethod=null;

  document.getElementById('quick-exp-categories').innerHTML = QUICK_CATEGORIES.map(c=>
    `<button type="button" class="fpill" onclick="pickQuickCategory('${c.label}','${c.grp||''}')" id="qcat-${c.label}">${icon(c.icon,'ic-inline')} ${c.label}</button>`
  ).join('');

  document.getElementById('quick-exp-payment').innerHTML = QUICK_PAYMENT_METHODS.map(m=>
    `<button type="button" class="fpill" onclick="pickQuickPayment('${m}')" id="qpay-${m}">${m}</button>`
  ).join('');

  refreshAccountSelect('qexp-account','Não vincular a nenhuma conta');
  openModal('modal-quick-exp');
}

function pickQuickCategory(label, grp){
  document.querySelectorAll('#quick-exp-categories .fpill').forEach(b=>b.classList.remove('on'));
  document.getElementById('qcat-'+label).classList.add('on');
  if(label!=='Outro') document.getElementById('qexp-desc').value=label;
  else document.getElementById('qexp-desc').value='';
  qexpGrp = grp || (ST.groups[0]||'Outros');
  document.getElementById('qexp-desc').focus();
}
function pickQuickPayment(method){
  document.querySelectorAll('#quick-exp-payment .fpill').forEach(b=>b.classList.remove('on'));
  document.getElementById('qpay-'+method).classList.add('on');
  qexpPaymentMethod = method;
}

function saveQuickExpense(){
  const desc=document.getElementById('qexp-desc').value.trim();
  const value=parseFloat(document.getElementById('qexp-value').value);
  const accountId=document.getElementById('qexp-account').value;
  if(!desc){notify('Escolha uma categoria ou digite uma descrição','err');return;}
  if(isNaN(value)||value<=0){notify('Informe um valor válido','err');return;}

  const grp = qexpGrp || ST.groups[0] || 'Outros';
  const date = dd();
  const x = {
    id:gid(), desc, value, date, type:'variavel', totalInstallments:1, num:1,
    grp, cardId:'', status:'pago', obs:'', paymentMethod:qexpPaymentMethod||null
  };
  ST.expenses.push(x);

  // Já nasce "pago", então já gera a movimentação de saída na hora — não
  // precisa passar pela modal de confirmação de pagamento (ver
  // js/receipts.js), pois esse é o ponto todo do "gasto rápido".
  if(accountId){
    addMovement({date,desc,accountId,category:grp,value,type:'saida',linkedId:x.id});
  }
  sv();
  closeModal('modal-quick-exp');
  notify('Gasto de '+fmt(value)+' registrado!');
  render();
}
