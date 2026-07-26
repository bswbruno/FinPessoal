
// FinPessoal v5.0 – Calculadora
// Calculadora simples de 4 operações, acessível pelo ícone 🧮 na topbar,
// pra contas rápidas sem precisar sair da tela atual.

let calcCurrent = '0';   // o que está sendo digitado agora
let calcPrevious = null; // valor acumulado antes do operador
let calcOperator = null; // '+', '-', '×', '÷'
let calcResetNext = false; // true = próximo dígito começa um número novo

function openCalculator(){
  calcCurrent='0';calcPrevious=null;calcOperator=null;calcResetNext=false;
  updateCalcDisplay();
  openModal('modal-calc');
}
function updateCalcDisplay(){
  document.getElementById('calc-display').textContent = calcCurrent;
}
function calcDigit(d){
  if(calcResetNext){calcCurrent=d;calcResetNext=false;}
  else{calcCurrent = calcCurrent==='0' ? d : calcCurrent+d;}
  updateCalcDisplay();
}
function calcDot(){
  if(calcResetNext){calcCurrent='0,';calcResetNext=false;updateCalcDisplay();return;}
  if(!calcCurrent.includes(',')) calcCurrent+=',';
  updateCalcDisplay();
}
function calcClear(){
  calcCurrent='0';calcPrevious=null;calcOperator=null;calcResetNext=false;
  updateCalcDisplay();
}
function calcBackspace(){
  if(calcResetNext) return;
  calcCurrent = calcCurrent.length>1 ? calcCurrent.slice(0,-1) : '0';
  updateCalcDisplay();
}
function calcPercent(){
  calcCurrent = String(parseCalcNum(calcCurrent)/100).replace('.',',');
  updateCalcDisplay();
}
function parseCalcNum(s){ return parseFloat(String(s).replace(',','.'))||0; }
function formatCalcNum(n){
  // Evita erros de ponto flutuante feios (0.1+0.2=0.30000000000000004) e
  // usa vírgula, igual o resto do app.
  return String(Math.round((n+Number.EPSILON)*1e10)/1e10).replace('.',',');
}
function calcOp(op){
  if(calcOperator && !calcResetNext) calcEquals(); // encadeia operações (ex: 5 + 3 + 2 =)
  calcPrevious = parseCalcNum(calcCurrent);
  calcOperator = op;
  calcResetNext = true;
}
function calcEquals(){
  if(calcOperator===null||calcPrevious===null) return;
  const a=calcPrevious, b=parseCalcNum(calcCurrent);
  let r=0;
  if(calcOperator==='+') r=a+b;
  else if(calcOperator==='-') r=a-b;
  else if(calcOperator==='×') r=a*b;
  else if(calcOperator==='÷') r=b===0?NaN:a/b;
  calcCurrent = isNaN(r) ? 'Erro' : formatCalcNum(r);
  calcOperator=null;calcPrevious=null;calcResetNext=true;
  updateCalcDisplay();
}
