
// FinPessoal v4.9 – Dados de Demonstração
//
// Preenche o app inteiro com dados FICTÍCIOS realistas (contas, cartões,
// despesas, receitas, patrimônio, orçamentos, movimentações), pensado pra
// quem quer tirar prints/gravar um vídeo pro portfólio sem expor números
// reais. Os nomes, bancos e valores abaixo são só exemplos — sinta-se à
// vontade pra editar essa lista se quiser personalizar o que aparece.

// Monta uma data 'YYYY-MM-DD' dentro do mês/ano atualmente navegado (ST.vy/ST.vm).
// Usa só dias até 28 pra não quebrar em fevereiro.
function _demoDate(day){
  const d = Math.min(Math.max(day,1),28);
  return `${ST.vy}-${String(ST.vm+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}

function seedDemoData(force = false){
  const isEmpty = !ST.expenses.length && !ST.incomes.length && !ST.cards.length && !ST.accounts.length && !ST.movements.length && !ST.objectives.length && !ST.objectiveEntries.length;
  const run = () => {
    // Zera tudo antes de semear (evita misturar com dados de exemplo antigos)
    ST.expenses=[]; ST.incomes=[]; ST.cards=[]; ST.accounts=[]; ST.movements=[];
    ST.objectives=[]; ST.objectiveEntries=[]; ST.budgets={};

    ST.groups = ['Casa','Cartão','Automóvel','Saúde','Alimentação','Lazer','Educação','Assinatura','Tecnologia','Viagem','Outros'];
    ST.expStatuses = ['pendente','pago','atrasado','parcial'];
    ST.incStatuses = ['pendente','recebido','adiantado'];

    ST.settings.name = 'Usuário Exemplo';
    ST.settings.meta = 1200;
    ST.settings.alertDays = 7;

    // ---------- CONTAS BANCÁRIAS (fictícias) ----------
    const accNubank = {id:gid(), name:'Conta Exemplo Nubank', bank:'Nubank', agency:'0001', number:'12345-6', type:'corrente', color:'#8b5cf6', initialBalance:8500, status:'ativa', pix:'exemplo@nubank.com.br'};
    const accBB     = {id:gid(), name:'Conta Exemplo BB', bank:'Banco do Brasil', agency:'1234', number:'99876-0', type:'corrente', color:'#2563eb', initialBalance:4200, status:'ativa', pix:'exemplo@bb.com.br'};
    const accItau   = {id:gid(), name:'Poupança Exemplo', bank:'Itaú', agency:'4521', number:'44556-1', type:'poupanca', color:'#f59e0b', initialBalance:6500, status:'ativa', pix:'11987654321'};
    const accCarteira = {id:gid(), name:'Carteira Exemplo', bank:'—', type:'carteira', color:'#22c55e', initialBalance:300, status:'ativa'};
    ST.accounts.push(accNubank, accBB, accItau, accCarteira);

    // ---------- CARTÕES (fictícios) ----------
    const cardNu  = {id:gid(), name:'Cartão Roxo Exemplo', digits:'4521', limit:5000, brand:'Mastercard', color:'#8b5cf6', fechamento:'5', vencimento:'12'};
    const cardInt = {id:gid(), name:'Cartão Visa Exemplo', digits:'7890', limit:7000, brand:'Visa', color:'#f59e0b', fechamento:'20', vencimento:'27'};
    ST.cards.push(cardNu, cardInt);

    // ---------- DESPESAS (fictícias) ----------
    const exps = [
      {desc:'Aluguel da Casa', value:1800, day:5, grp:'Casa', status:'pago', type:'fixa'},
      {desc:'Conta de Luz', value:220, day:10, grp:'Casa', status:'pago', type:'variavel'},
      {desc:'Internet Fibra', value:129, day:8, grp:'Assinatura', status:'pago', type:'fixa'},
      {desc:'Supermercado', value:780, day:3, grp:'Alimentação', status:'pago', type:'variavel'},
      {desc:'Academia', value:110, day:15, grp:'Saúde', status:'pendente', type:'fixa'},
      {desc:'Streaming', value:59, day:12, grp:'Assinatura', status:'pago', type:'fixa', cardId:cardNu.id},
      {desc:'Combustível', value:360, day:18, grp:'Automóvel', status:'pendente', type:'variavel'},
      {desc:'Cinema de sábado', value:95, day:22, grp:'Lazer', status:'pendente', type:'variavel'},
      {desc:'Remédio da semana', value:78, day:2, grp:'Saúde', status:'atrasado', type:'variavel'}
    ];
    exps.forEach(e=>{
      ST.expenses.push({id:gid(), desc:e.desc, value:e.value, date:_demoDate(e.day), type:e.type, totalInstallments:1, num:1, grp:e.grp, cardId:e.cardId||'', status:e.status, obs:'Exemplo fictício'});
    });

    // Dívidas parceladas de exemplo (aparecem em Dívidas Parceladas)
    const gidNotebook = gid();
    for(let i=0;i<10;i++){
      const d = new Date(ST.vy, ST.vm, 20); d.setMonth(d.getMonth()+i);
      ST.expenses.push({id:gid(), gid:gidNotebook, desc:`Notebook Exemplo ${i+1}/10`, value:399.9, date:d.toISOString().split('T')[0], type:'parcelada', totalInstallments:10, num:i+1, grp:'Tecnologia', cardId:cardInt.id, status:i===0?'pago':'pendente', obs:'Dívida fictícia de exemplo'});
    }
    const gidSofa = gid();
    for(let i=0;i<6;i++){
      const d = new Date(ST.vy, ST.vm, 24); d.setMonth(d.getMonth()+i);
      ST.expenses.push({id:gid(), gid:gidSofa, desc:`Sofá Exemplo ${i+1}/6`, value:650, date:d.toISOString().split('T')[0], type:'parcelada', totalInstallments:6, num:i+1, grp:'Casa', cardId:cardNu.id, status:i===0?'pago':'pendente', obs:'Dívida fictícia de exemplo'});
    }

    // ---------- RECEITAS (fictícias) ----------
    ST.incomes.push(
      {id:gid(), desc:'Salário Fictício', src:'Empresa Exemplo Ltda', value:6500, date:_demoDate(5), type:'Salário', rec:'mensal', totalInstallments:1, num:1, status:'recebido', obs:'Exemplo fictício'},
      {id:gid(), desc:'Freela Design', src:'Cliente Exemplo', value:1800, date:_demoDate(18), type:'Freelance', rec:'unico', totalInstallments:1, num:1, status:'pendente', obs:'Exemplo fictício'}
    );

    // ---------- PATRIMÔNIO / OBJETIVOS (fictícios) ----------
    const objReserva = {id:gid(), name:'Reserva de Emergência', targetValue:20000, color:'#10b981', createdAt:new Date().toISOString()};
    const objViagem  = {id:gid(), name:'Viagem Nordeste', targetValue:8000, color:'#3b82f6', createdAt:new Date().toISOString()};
    const objCarro   = {id:gid(), name:'Reserva para Carro', targetValue:12000, color:'#8b5cf6', createdAt:new Date().toISOString()};
    ST.objectives.push(objReserva, objViagem, objCarro);
    ST.objectiveEntries.push(
      {id:gid(), objectiveId:objReserva.id, date:_demoDate(6), desc:'Aporte mensal fictício', value:800, type:'aporte', accountId:accBB.id},
      {id:gid(), objectiveId:objViagem.id, date:_demoDate(6), desc:'Guardando pra viagem fictícia', value:450, type:'aporte', accountId:accNubank.id},
      {id:gid(), objectiveId:objCarro.id, date:_demoDate(10), desc:'Reserva do carro fictícia', value:600, type:'aporte', accountId:accItau.id},
      {id:gid(), objectiveId:objReserva.id, date:_demoDate(18), desc:'Retirada de exemplo', value:150, type:'retirada', accountId:accBB.id}
    );

    ST.objectiveEntries.forEach(e=>{
      const o = ST.objectives.find(o=>o.id===e.objectiveId);
      const mvType = e.type === 'aporte' ? 'saida' : 'entrada';
      addMovement({date:e.date, desc:e.type==='aporte' ? `Guardado p/ "${o.name}"` : `Retirada p/ "${o.name}"`, accountId:e.accountId, category:'Patrimônio', value:e.value, type:mvType, linkedId:e.id});
    });

    // ---------- MOVIMENTAÇÃO MANUAL (transferência e depósitos fictícios) ----------
    addMovement({date:_demoDate(5), desc:'Depósito de salário fictício', accountId:accBB.id, category:'Receita', value:6500, type:'entrada'});
    addMovement({date:_demoDate(7), desc:'Transferência entre contas fictícia', accountId:accNubank.id, category:'Transferência', value:900, type:'transferencia', toAccountId:accItau.id});
    addMovement({date:_demoDate(9), desc:'Pagamento aluguel fictício', accountId:accBB.id, category:'Casa', value:1800, type:'saida'});

    // ---------- ORÇAMENTO POR CATEGORIA ----------
    ST.budgets['Casa'] = 2200;
    ST.budgets['Alimentação'] = 1000;
    ST.budgets['Automóvel'] = 600;
    ST.budgets['Lazer'] = 250;
    ST.budgets['Tecnologia'] = 500;

    sv();
    notify('Dados fictícios de exemplo carregados!');
    render();
  };

  if (force || isEmpty) run();
  else confirm2('Isso vai APAGAR os dados atuais e colocar um conjunto de dados fictícios de exemplo no lugar. Se tiver dados reais, exporte um backup antes. Continuar?', run);
}
