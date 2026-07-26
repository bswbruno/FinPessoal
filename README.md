# FinPessoal v5.0
## Sistema Financeiro Pessoal

### 🔄 Novidade v5.0: aviso de atualização do app (PWA)
Quem **instalou o app** (celular ou computador, "Adicionar à tela inicial"/
"Instalar app") agora recebe um aviso quando você publica uma versão nova:
um banner discreto no rodapé — "🔄 Nova versão disponível" — com um botão
**"Atualizar agora"**. Ao clicar, o app atualiza e recarrega sozinho,
**sem precisar de F5 nem perder os dados cadastrados** (os dados ficam no
`localStorage`, que é completamente separado do cache do Service Worker).
Quem só acessa pelo navegador normal (sem instalar) não vê esse aviso.

**Como isso funciona por baixo dos panos**, pra quando for mexer de novo:
- `service-worker.js`: o SW novo não assume sozinho mais — ele fica
  "esperando" até a página mandar a mensagem `SKIP_WAITING` (isso é
  proposital, pra não interromper a pessoa no meio do uso).
- `index.html` (final do arquivo): registra o SW e fica de olho em
  `updatefound`/`statechange`. Se detectar uma atualização **e** o app
  estiver rodando em modo instalado (`display-mode: standalone`), mostra o
  banner. O botão manda `SKIP_WAITING` pro SW novo, e o evento
  `controllerchange` dispara o reload automático.
- **Toda vez que você alterar algo em CSS/JS/HTML**, lembre de subir
  também o número do `CACHE_NAME` em `service-worker.js` (ex: de
  `'finpessoal-cache-v3'` pra `'finpessoal-cache-v4'`) — é esse número
  mudando que faz o navegador perceber que existe uma versão nova pra
  baixar. Sem isso, o Service Worker acha que nada mudou e ninguém recebe
  o aviso.

### 🚨 Correção crítica (v4.9)
**Bug:** a inicialização do `index.html` estava chamando
`seedDemoData(true)` a cada carregamento da página — o `true` força a
substituição de TODOS os dados por dados fictícios, então qualquer
lançamento real que alguém cadastrasse era apagado ao recarregar a página.

**Corrigido.** Agora:
- Os dados fictícios só aparecem **uma vez**, no primeiro acesso daquele
  navegador (modal de boas-vindas, com opção de escolher "Explorar em
  branco" ou "Ver com dados de exemplo").
- Dados reais cadastrados pela pessoa **persistem normalmente** entre
  recarregamentos da página.
- "Apagar todos os dados" em Configurações agora funciona de verdade: depois
  de apagar, os dados continuam apagados mesmo recarregando — não voltam
  dados fictícios sozinhos.

### 🎓 Sobre este projeto (portfólio)
Este é um projeto de portfólio pessoal. Ao abrir pela primeira vez, aparece
um aviso explicando que os dados ficam salvos só no navegador de quem está
usando — com um botão pra já explorar o app preenchido com **dados
fictícios** (Configurações → "Dados de Demonstração" faz isso a qualquer
momento também).

### Novidades da v4.8
- 👋 **Modal de boas-vindas/privacidade**: aparece uma vez só, na primeira
  visita neste navegador, avisando que os dados são 100% locais — com atalho
  pra já carregar dados fictícios de demonstração.
- 🧪 **Dados de Demonstração**: preenche o app inteiro (contas, cartões,
  despesas variadas, receitas, patrimônio, orçamentos) com informações
  fictícias realistas — ideal pra prints/vídeo de portfólio sem expor dados
  reais.
- 💰 **Pagamento parcial de dívidas**: ao confirmar um pagamento, dá pra
  informar um valor menor que o total (ex: pagar R$100 de uma dívida de
  R$530). A despesa fica com um selo "Parcial" mostrando quanto já foi pago
  e quanto falta, e só vira "Pago" quando o valor acumulado bate com o
  total. Já refletido em A Pagar, Dívidas, Dashboard e no limite do cartão.
- 🐛 **Correção: Preferências do Dashboard não aplicava sem recarregar** —
  agora qualquer alteração (período padrão, seções visíveis) já reflete na
  próxima vez que o Dashboard abrir, sem precisar dar F5.
- ➕ **Novas seções configuráveis no Dashboard**: Orçamento por Categoria,
  Próximo Vencimento de Fatura (calculado pro mês selecionado na topbar),
  Alertas de atraso/vencimento, e os dois gráficos — todas com opção de
  mostrar/ocultar em Configurações → Preferências do Dashboard.
- 📝 **Orçamento por Categoria mais claro**: texto explicando que é um teto
  de gasto geral por categoria (não ligado a nenhuma conta específica), com
  o quanto já foi gasto exibido ao lado de cada grupo.
- 🔗 **Movimentações**: os botões de editar/excluir agora aparecem em todas
  as linhas — para lançamentos gerados automaticamente (Gasto Rápido,
  pagamentos), a ação abre o lançamento de origem em A Pagar/A Receber
  (que já mantém tudo sincronizado).
- 🔀 **Ordenação e agrupamento em A Pagar/A Receber**: filtro de ordenação
  (vencimento, valor, descrição) e opção de exibir tudo junto ou separado
  em três tabelas (Atrasadas/Pendentes/Pagas). Linhas pagas ficam com fundo
  verde suave; atrasadas, vermelho suave.
- 📈 **CSV corrigido pro Excel brasileiro**: separador trocado pra ponto e
  vírgula (a vírgula no Brasil é separador decimal), números e datas no
  formato brasileiro.
- 🐛 **Correção: movimentações órfãs** — editar/excluir uma despesa ou
  receita com movimentação vinculada agora atualiza/remove ela também.

### Novidades e correções da v4.6
- 🐛 **Correção: movimentações órfãs**. Editar ou excluir uma despesa/receita
  que tinha uma movimentação vinculada (de Gasto Rápido ou de um pagamento
  com conta vinculada) agora atualiza ou remove essa movimentação junto —
  antes ela ficava "solta" em Movimentações, com dados desatualizados ou
  referenciando um lançamento que não existia mais.
- 🔀 **Ordenação em A Pagar e A Receber**: novo filtro "Ordenar por" —
  Vencimento (padrão, mais próximo primeiro), Vencimento mais distante,
  Valor (maior/menor) ou Descrição A-Z.
- 🎨 **Linhas coloridas por status**: linhas de contas pagas/recebidas
  ficam com fundo verde suave; atrasadas ficam com fundo vermelho suave —
  dá pra identificar de relance sem perder a legibilidade.
- 📊 **Modo "Separado por status"**: além de "Tudo junto" (padrão), dá pra
  exibir em três tabelas separadas — Atrasadas, Pendentes e Pagas/Recebidas
  — cada uma com sua contagem.
- 📈 **CSV corrigido pro Excel brasileiro**: o separador estava em vírgula,
  que é o mesmo símbolo usado como separador decimal no Brasil — por isso
  as colunas saíam desalinhadas ao abrir no Excel. Agora usa ponto e vírgula
  como separador (padrão brasileiro), números com vírgula decimal e datas em
  dd/mm/aaaa — abre direto no Excel com as colunas certas.

### Novidades da v4.5
- 🗓️ **Agenda Financeira**: novo menu com calendário do mês (usa o mesmo
  mês navegado na topbar), mostrando em cada dia quantas despesas, receitas
  e movimentações de patrimônio existem — clique num dia pra ver os
  detalhes. Dias com despesa em atraso ficam destacados.
- 💳 **Cartão de Crédito Inteligente**: a tela de Cartões agora calcula o
  ciclo real da fatura a partir do dia de fechamento/vencimento — mostra
  Limite disponível, Comprometido (todas as parcelas futuras, que é o que
  reduz o limite de verdade), Fatura Atual (só as compras do ciclo que vai
  fechar em seguida) com data de vencimento, e o Melhor dia de compra
  (o dia logo após o fechamento, que dá o maior prazo pra pagar). Um botão
  "Ver fatura atual" mostra o detalhe de cada compra daquele ciclo.

### Novidades da v4.4
- 🏷️ **Orçamento por Categoria**: em Configurações, defina um limite mensal
  para qualquer grupo de despesa (ex: "Alimentação: R$800"). O Dashboard
  passa a mostrar uma seção "Orçamento por Categoria" com barra de progresso
  por grupo, e dispara alertas automáticos: aviso ao chegar em 80% do
  limite, e alerta de "estourado" ao ultrapassar — sempre calculado sobre o
  mês real navegado, independente dos filtros do Dashboard.

### ⚠️ Sobre o login multiusuário
O sistema de login (pasta `server/` + `login.html`) ficou **pausado** por
decisão do usuário — não estava sendo confiável o suficiente no dia a dia.
Os arquivos continuam no projeto (caso queira retomar no futuro), mas o
`index.html` não exige mais login: abra direto e use, sem precisar rodar
nenhum servidor. Os dados voltam a ficar salvos numa única chave do
navegador (`fp3`), do jeito que era antes da v3.4.

### Novidades da v4.3
- 🎨 **Ícones agora 100% locais**: a biblioteca Lucide deixou de vir de uma
  CDN externa (`unpkg.com`) e passou a ser um arquivo dentro do projeto
  (`js/lib/lucide.min.js`) — mais confiável, funciona offline, sem depender
  de nenhum serviço externo no ar.
- ⚙️ **Configurações completas**: nova seção "Preferências do Dashboard"
  (período padrão ao abrir — mês/ano/tudo —, e escolher quais seções
  aparecem: Contas, Patrimônio, Cartões) e "Privacidade" (ocultar valores,
  sincronizado com o ícone de olho da barra superior).

### Novidades da v4.2
- 🎨 **Ícones padronizados com Lucide Icons**: troquei todos os emojis e
  símbolos Unicode espalhados pelo sistema (menu lateral, botões de editar/
  excluir/marcar, alertas, recibos, gasto rápido, etc.) por ícones SVG de
  verdade, todos do mesmo traço/estilo. Carregados via CDN
  (`unpkg.com/lucide`), sem precisar instalar nada.
  - `icon(nome, classe)` (js/utils.js) monta o placeholder do ícone.
  - `refreshIcons()` converte os placeholders em SVG de verdade — já é
    chamado automaticamente a cada troca de página e a cada modal aberta,
    então novos ícones adicionados no futuro só precisam usar `icon(...)`
    normalmente, sem se preocupar em chamar nada manualmente.
  - Deixei de propósito alguns emojis "decorativos" (💡 dicas, 🎉 comemoração,
    👋 saudação) sem trocar — eles não são ícones de ação, são só um toque
    de simpatia no texto.

### Novidades da v4.1
- 💾 **Backup formal (Exportar/Importar JSON)**: em Configurações, "Exportar
  Backup (JSON)" baixa um arquivo com **tudo** (despesas, receitas, contas,
  cartões, patrimônio, grupos/status personalizados, preferências). O
  botão "Importar Backup" lê esse arquivo e restaura tudo — útil pra trocar
  de computador ou ter uma cópia de segurança. Diferente do CSV (que é só
  pra abrir em planilha), o JSON serve pra restaurar de verdade. O login/
  senha não entra no backup — isso mora no servidor, não no navegador.

### Novidades da v4.0
- ⚡ **Gasto Rápido**: novo ícone na barra superior pra lançar pequenas
  despesas do dia a dia (Lanchonete, Mercado, Padaria, Farmácia, Uber,
  Cinema ou "Outro") sem passar pelo formulário completo de "A Pagar".
  Escolha a categoria, o valor, a forma de pagamento (Dinheiro/Débito/
  Crédito/PIX) e, se quiser, a conta de onde saiu o dinheiro — o gasto já
  nasce marcado como pago (porque gasto do dia a dia já é pago na hora) e,
  se uma conta foi escolhida, o saldo dela é debitado na mesma hora.

### Novidades da v3.9
- 📊 **Filtros no Dashboard**: Período (Este mês / Este ano / Todos), Conta
  bancária, Cartão, Categoria e Status — filtram as Receitas, o novo card de
  Despesas e o gráfico "Gastos por grupo" ao mesmo tempo. Os alertas de
  atraso/vencimento continuam sempre mostrando a situação real, sem filtro,
  por segurança.
- 💳 **Card de Despesas reformulado**: agora destaca o **Restante a Pagar**
  em vez do total bruto, com "Total do período" e "Já pago" em texto menor
  embaixo. Quando tudo estiver quitado no período, mostra "🎉 Você está em
  dia!" em vez do valor.
- 🔍 **Diagnóstico de versão do backend**: a tela de login agora mostra se
  conseguiu conectar ao servidor local e se a versão bate com a esperada —
  ajuda a identificar quando o terminal do `npm start` precisa ser reiniciado
  depois de uma atualização (o Node não recarrega sozinho ao trocar arquivos).

### Novidades da v3.8
- 📎 **PIX nas Contas Bancárias**: campo opcional pra guardar a chave PIX de
  cada conta, com botão "Copiar" (confirmação visual + toast) direto no
  card da conta.
- 🧮 **Calculadora**: ícone na barra superior, abre uma calculadora completa
  (4 operações, %, apagar) em modal, sem sair da tela atual.
- 👁️ **Ocultar valores**: botão na barra superior troca todos os valores em
  R$ do sistema por "R$ •••••" — útil pra usar o app perto de outras
  pessoas. Funciona em Dashboard, Contas, Cartões, Despesas, Receitas e
  Patrimônio de uma vez, porque a máscara foi implementada dentro da função
  central `fmt()` (js/utils.js) que todo o sistema já usa pra formatar
  dinheiro. O estado fica salvo e persiste entre sessões.

### ⚠️ Importante: isso não é um banco digital
O FinPessoal é uma ferramenta de **controle** financeiro pessoal. Nada aqui
move dinheiro de verdade — quando você "guarda" ou "retira" dinheiro de um
objetivo, ou paga uma dívida vinculando uma conta, o sistema só **anota**
essa movimentação para manter o saldo mostrado no app fiel à realidade do
seu banco de verdade.

### Novidades da v3.6
- 🎯 **Patrimônio**: novo menu para cadastrar objetivos financeiros (Reserva
  de Emergência, Viagem, Comprar carro, etc.), cada um com meta opcional e
  barra de progresso. Use "+ Guardar" / "− Retirar" para registrar aportes e
  resgates, com histórico completo por objetivo.
- 🔗 Ao guardar/retirar vinculando uma conta bancária, o saldo dessa conta é
  ajustado automaticamente (mesma regra das dívidas: só acontece se você
  escolher a conta explicitamente).
- 📊 **Meta Mensal corrigida**: agora compara com o valor **realmente
  guardado** nos objetivos durante o mês (antes comparava com receitas −
  despesas, que não refletia dinheiro de fato reservado).
- 📈 Dashboard ganhou uma seção "Patrimônio" mostrando os objetivos e o
  total guardado, separada das demais seções (mesma lógica de não misturar
  KPIs independentes).

### Como usar (a partir da v3.4 — agora com login)
1. **Suba o servidor de autenticação primeiro** (só precisa fazer isso uma vez por sessão de uso):
   ```
   cd server
   npm install
   copy .env.example .env      (Windows)   |   cp .env.example .env   (Mac/Linux)
   ```
   Abra o `.env` criado e troque `JWT_SECRET` por qualquer texto aleatório.
   ```
   npm start
   ```
   Isso deixa o servidor rodando em `http://localhost:3001` (precisa ficar
   aberto/rodando enquanto você usa o app).
2. Abra `login.html` no navegador (pode ser direto pelo arquivo, ou por um
   servidor estático local — ex: `npx serve`).
3. Crie sua conta (nome, e-mail, senha) e entre.
4. Os dados são salvos automaticamente no navegador (localStorage), **numa
   área exclusiva da sua conta**.

> 💡 Se você já usava versões anteriores do FinPessoal (antes do login
> existir), pode ficar tranquilo: na primeira vez que você criar sua conta e
> entrar, o sistema migra automaticamente os dados antigos pra ela — nada se
> perde.

---

### Novidades da v3.4
- 🔐 **Login e cadastro multiusuário**: tela de entrada (`login.html`) com
  cadastro (nome, e-mail, senha com validação) e login. Cada conta só
  enxerga os próprios lançamentos — mesmo que duas pessoas usem o mesmo
  navegador/computador, uma nunca vê os dados da outra.
- 🖥️ **Backend próprio (pasta `server/`)**: Node.js + Express, senha
  criptografada (bcrypt), sessão via token (JWT). Roda **local** por
  enquanto — nenhum dado sai do seu computador. Mais pra frente, quando
  quiser, dá pra hospedar esse mesmo backend na nuvem (Render + Supabase,
  gratuito) pra acessar de qualquer lugar — é só trocar uma constante no
  front (`API_BASE` em `js/auth-client.js`).
- 🚪 Botão de sair (logout) no rodapé do menu lateral.
- ⚠️ **Importante sobre o que JÁ está multiusuário e o que ainda não está**:
  o *login* já é 100% real (backend, senha com hash, validação). Os *dados
  financeiros* (despesas, contas, etc.) continuam no `localStorage` do
  navegador — cada conta logada tem sua própria "gaveta" de dados nesse
  mesmo navegador, então já funciona bem pra "cada um ter o seu controle".
  O que ainda não existe é sincronizar esses dados financeiros entre
  aparelhos diferentes (isso exigiria guardá-los também no backend/banco de
  dados — próximo passo natural, se você quiser).

### Novidades da v3.3
- 🏦 **Contas Bancárias**: novo menu para cadastrar contas (nome, banco,
  agência, número, tipo — corrente/poupança/carteira —, cor, saldo inicial e
  status ativa/inativa). O saldo atual é sempre **calculado** a partir do
  saldo inicial + movimentações (nunca um número fixo que possa dessincronizar).
- ⇄ **Movimentações**: extrato com todas as entradas, saídas e transferências
  entre contas. Pode ser lançado manualmente ou gerado automaticamente quando
  você paga uma despesa/recebe uma receita vinculando uma conta.
- 🔗 **Regra importante — saldo de conta NÃO abate dívida automaticamente**:
  se você tem R$ 2.000 em despesas pendentes e R$ 1.000 numa conta, o
  Dashboard mostra os dois valores separados, sem nenhum desconto automático.
  A única forma de uma despesa "consumir" o saldo de uma conta é você
  escolher explicitamente aquela conta na hora de confirmar o pagamento
  (mesma modal onde se anexa o recibo). Da mesma forma, ao confirmar um
  recebimento, você escolhe (opcionalmente) em qual conta o dinheiro entrou.
- 📊 **Dashboard mais detalhado**: nova seção "Contas Bancárias" mostrando o
  saldo de cada conta ativa e o total — visualmente separada dos KPIs de
  despesas/receitas/dívidas, para reforçar que são cálculos independentes.

### Novidades da v3.2
- 📎 **Recibo agora é anexado no momento do pagamento**, não mais na criação
  da despesa. Ao clicar em "Pagar" (tanto em "A Pagar" quanto em uma parcela
  dentro de "Dívidas"), abre uma modal de confirmação com um campo opcional
  de upload (imagem ou PDF). O recibo salvo fica acessível pelo botão 📎 na
  tabela.
- 🏷️ **Cadastro de Grupos**: em Configurações, adicione/remova suas próprias
  categorias de despesa (além das padrão: Casa, Cartão, Automóvel, etc.).
- ✅ **Cadastro de Status**: também em Configurações, adicione status extras
  para despesas e receitas (ex: "Aguardando reembolso", "Cancelado"). Os
  status principais (Pendente/Pago/Atrasado para despesas, Pendente/Recebido
  para receitas) não podem ser removidos, pois são usados pelo sistema para
  calcular atrasos, badges e KPIs — mas convivem normalmente com os que você
  cadastrar.

### Novidades da v3.0
- 🌓 **Tema claro/escuro**: botão (☀️/🌙) no canto superior direito. A escolha
  fica salva no navegador (`localStorage`, chave `fp-theme`) e é lembrada na
  próxima visita. Se o usuário nunca escolheu, o app respeita o tema do
  sistema operacional.
- 🎨 **Visual modernizado**: fonte Inter, cantos mais arredondados, sombras
  suaves, cores revisadas para ambos os temas, pequenas transições/animações.
- 📱 **Responsividade completa**: o layout se adapta a celulares e tablets.
  Em telas estreitas, o menu lateral vira uma "gaveta" (off-canvas) aberta
  pelo botão ☰ na barra superior, os grids de KPIs/gráficos reorganizam em
  menos colunas, e tabelas longas ganham rolagem horizontal em vez de
  quebrar o layout.
- 📄 **Código documentado**: `css/style.css` tem um índice no topo e seções
  numeradas comentadas; `js/ui.js` (novo arquivo) concentra toda a lógica de
  tema e menu mobile, isolada da lógica financeira.

---

### Estrutura do Projeto

```
FinPessoal/
├── index.html          ← App principal (protegido por login)
├── login.html           ← Tela de login/cadastro
├── css/
│   └── style.css       ← Todos os estilos (tema claro/escuro + responsivo)
├── js/
│   ├── auth-client.js  ← Fala com o backend de login (fetch, guarda sessão)
│   ├── utils.js        ← Estado global, utilitários, gráficos, saldo de contas
│   ├── categorias.js   ← Cadastro de Grupos e Status personalizados
│   ├── contas.js       ← Cadastro de Contas Bancárias
│   ├── movimentacoes.js← Extrato/movimentações + confirmação de recebimento
│   ├── nav.js          ← Navegação e roteamento de páginas
│   ├── ui.js            ← Tema claro/escuro + menu mobile (off-canvas)
│   ├── receipts.js     ← Upload/visualização de recibos + confirmação de pagamento
│   ├── dashboard.js    ← Dashboard principal
│   ├── pagar.js        ← Módulo A Pagar
│   ├── receber.js      ← Módulo A Receber
│   ├── dividas.js      ← Dívidas parceladas
│   ├── cartoes.js      ← Gestão de cartões
│   ├── relatorios.js   ← Relatórios e exportação CSV
│   └── modals.js       ← Configurações
├── server/              ← Backend de autenticação (Node.js + Express)
│   ├── server.js        ← Ponto de entrada (sobe em localhost:3001)
│   ├── db.js            ← "Banco de dados" (arquivo data.json, sem deps nativas)
│   ├── validators.js    ← Regras de validação de cadastro/login
│   ├── routes/auth.js   ← Rotas /register, /login, /me
│   ├── middleware/auth.js ← Verifica o token JWT nas rotas protegidas
│   └── .env.example     ← Copie para .env e configure o JWT_SECRET
└── assets/              ← Pasta para ícones/imagens futuras
```

> **Nota:** existe um arquivo `js/app.js` no projeto que **não é carregado**
> pelo `index.html` (não há `<script>` apontando para ele). Parece ser uma
> versão antiga/alternativa de `nav.js` + `modals.js`. Ele foi mantido como
> está para não alterar nada fora do escopo pedido, mas pode ser removido
> com segurança caso queira limpar o projeto.

---

### Login/cadastro — como funciona (para manutenção futura)
- **Backend** (`server/`): Express + `bcryptjs` (hash de senha) + `jsonwebtoken`
  (sessão). Usuários ficam em `server/data.json` (criado automaticamente,
  nunca commitado — ver `.gitignore`). Sem dependências nativas/compiladas,
  então `npm install` funciona igual em Windows/Mac/Linux sem instalar nada
  além do Node.
- **Validações** (`server/validators.js`): nome ≥ 2 letras, e-mail com
  formato válido e único, senha ≥ 6 caracteres com pelo menos 1 número,
  confirmação de senha batendo. Mensagens de erro de login são propositalmente
  genéricas ("E-mail ou senha incorretos") pra não revelar se o problema foi
  o e-mail ou a senha.
- **Front-end** (`js/auth-client.js`): guarda `{ token, user }` no
  `localStorage` (chave `fp_auth`). `requireAuthOrRedirect()` roda no início
  do `index.html` e manda pra `login.html` se não houver sessão válida.
- **Dados financeiros por conta**: `storageKey()` (em `js/utils.js`) monta a
  chave do localStorage como `fp3_<id-do-usuário>` — por isso cada conta
  logada nesse navegador tem sua própria área de dados, mesmo sem ainda ter
  um banco de dados guardando essas informações no servidor.
- **Trocar de servidor local pra hospedado**: quando for colocar o backend
  no Render/Supabase, o único ajuste no front é a constante `API_BASE` em
  `js/auth-client.js`.

---

### Contas Bancárias e Movimentações — como funciona (para manutenção futura)
- `ST.accounts` guarda as contas cadastradas; `ST.movements` guarda o extrato
  (entradas/saídas/transferências), ambos em `js/utils.js`, persistidos via
  `sv()`/`ld()`.
- `accountBalance(id)` (em `js/utils.js`) **calcula** o saldo de uma conta a
  partir do saldo inicial + movimentações — nunca é um valor fixo armazenado,
  o que evita bugs de dessincronização.
- `totalSaldoContas()` soma o saldo de todas as contas ativas — usado no
  Dashboard, sempre exibido separado dos KPIs de despesas/dívidas.
- `addMovement()` (em `js/movimentacoes.js`) cria uma movimentação; é chamada
  tanto pelo formulário manual quanto pelos fluxos de pagamento
  (`confirmPayment()` em `js/receipts.js`) e recebimento (`confirmReceive()`
  em `js/movimentacoes.js`) — só quando o usuário escolhe uma conta.
- Movimentações com `linkedId` preenchido foram geradas automaticamente e não
  podem ser editadas/excluídas na tela de Movimentações (edite pela despesa/
  receita de origem).

### Grupos e Status personalizados — como funciona (para manutenção futura)
- `ST.groups`, `ST.expStatuses` e `ST.incStatuses` (em `js/utils.js`) guardam
  as listas atuais, persistidas via `sv()`/`ld()` como o resto dos dados.
- `js/categorias.js` tem as funções de adicionar/remover
  (`addGroup`/`removeGroup`, `addExpStatus`/`removeExpStatus`,
  `addIncStatus`/`removeIncStatus`) e as que populam os `<select>` dos
  formulários (`refreshGroupSelect`, `refreshExpStatusSelect`,
  `refreshIncStatusSelect`) — chamadas sempre que um modal é aberto.
- `CORE_EXP_STATUSES`/`CORE_INC_STATUSES` (em `js/utils.js`) protegem os
  status principais contra remoção, porque a lógica de atraso/KPIs depende
  deles especificamente.

### Recibo no pagamento — como funciona
- `toggleE()` (js/pagar.js) e `toggleEP()` (js/dividas.js) não marcam a
  despesa como paga diretamente: quando o status ainda não é "pago", eles
  chamam `openPayModal(id, origem, gid?)` (js/receipts.js), que abre a modal
  de confirmação com o upload opcional e a seleção de conta bancária.
- `confirmPayment()` marca como pago, salva o recibo (se algum foi anexado),
  gera a movimentação de saída (se uma conta foi escolhida) e atualiza a
  tela correta.
- Desmarcar uma despesa já paga (clicar de novo em "Pago") não pede
  confirmação nem recibo — apenas volta para "pendente".

---

### Tema claro/escuro — como funciona (para manutenção futura)
Todas as cores da interface vêm de variáveis CSS (`--bg`, `--text`, `--purple`,
etc.) definidas em `css/style.css`, seção **"# 2. TEMA"**:
- `:root` / `html[data-theme="light"]` → valores do tema claro
- `html[data-theme="dark"]` → valores do tema escuro

O `js/ui.js` só troca o atributo `data-theme` da tag `<html>`; ele não conhece
nenhuma cor específica. **Para ajustar uma cor**, edite apenas o `style.css`.
**Para criar um novo tema**, copie o bloco de variáveis, troque o seletor
(ex: `html[data-theme="azul"]`) e adicione um botão/opção que chame
`localStorage.setItem('fp-theme','azul')` seguido de `applyTheme('azul')`.

---

### Responsividade — breakpoints usados
| Faixa                 | Comportamento                                              |
|-----------------------|--------------------------------------------------------------|
| acima de 1024px        | Desktop: sidebar fixa, grids completos                       |
| 701px – 1024px        | Tablet: sidebar vira menu retrátil (☰), grids com menos colunas |
| até 700px             | Celular: mesmo comportamento do tablet + espaçamentos/fontes menores |

Os ajustes ficam em `css/style.css`, seção **"# 21. RESPONSIVO"**. Prefira
sempre editar os blocos `@media` já existentes ali em vez de criar novos
soltos pelo arquivo.

---

### Tema claro/escuro — como funciona (para manutenção futura)
Todas as cores da interface vêm de variáveis CSS (`--bg`, `--text`, `--purple`,
etc.) definidas em `css/style.css`, seção **"# 2. TEMA"**:
- `:root` / `html[data-theme="light"]` → valores do tema claro
- `html[data-theme="dark"]` → valores do tema escuro

O `js/ui.js` só troca o atributo `data-theme` da tag `<html>`; ele não conhece
nenhuma cor específica. **Para ajustar uma cor**, edite apenas o `style.css`.
**Para criar um novo tema**, copie o bloco de variáveis, troque o seletor
(ex: `html[data-theme="azul"]`) e adicione um botão/opção que chame
`localStorage.setItem('fp-theme','azul')` seguido de `applyTheme('azul')`.

---

### Responsividade — breakpoints usados
| Faixa                 | Comportamento                                              |
|-----------------------|--------------------------------------------------------------|
| acima de 1024px        | Desktop: sidebar fixa, grids completos                       |
| 701px – 1024px        | Tablet: sidebar vira menu retrátil (☰), grids com menos colunas |
| até 700px             | Celular: mesmo comportamento do tablet + espaçamentos/fontes menores |

Os ajustes ficam em `css/style.css`, seção **"# 21. RESPONSIVO"**. Prefira
sempre editar os blocos `@media` já existentes ali em vez de criar novos
soltos pelo arquivo.

---

### Funcionalidades

#### Dashboard
- KPIs: Receitas, Despesas, Saldo, Meta de Economia
- Alertas de itens em atraso e próximos do vencimento
- Gráfico de barras dos últimos 6 meses
- Gráfico de pizza por grupo de despesa
- Resumo visual dos cartões

#### A Pagar
- Adicionar, editar e excluir despesas
- Despesas **fixas** com opção de repetir mensalmente (12 meses)
- Despesas **parceladas**: gera automaticamente as N parcelas nos meses corretos
- Filtros por status (Todos / Pendente / Pago / Atrasado)
- Busca por descrição
- Marcar como pago / desmarcar
- Vinculação a cartão de crédito
- Grupos: Casa, Cartão, Automóvel, Saúde, Alimentação, Lazer, Educação, Assinatura, Outros

#### A Receber
- Salário, Freelance/Projeto, Recebimento de Pessoa, Aluguel, Investimentos, Bônus
- Cadastro de origem/fonte
- Recorrências: Único, Parcelado, Mensal (12 meses)
- Marcar como recebido

#### Dívidas Parceladas
- Visão consolidada de todas as dívidas agrupadas
- Barra de progresso por dívida
- Valor restante e próxima parcela
- Marcar parcelas individuais como pagas

#### Cartões
- Nome, bandeira, últimos 4 dígitos
- Limite e % de uso (calculado automaticamente)
- Dia de fechamento e vencimento
- Cor personalizada (paleta + color picker)
- Barra de uso visual

#### Relatórios
- Resumo mensal completo
- Tabela de gastos por grupo com % e barra
- Breakdown por tipo de receita
- **Exportar CSV** do mês atual ou histórico completo

#### Configurações
- Nome do usuário (aparece no dashboard)
- Meta mensal de economia com indicador
- Dias de alerta antes do vencimento
- Exportar todos os dados
- Apagar todos os dados

---

### Dados e Privacidade
- Todos os dados ficam **apenas no seu navegador** (localStorage)
- Nenhuma informação é enviada para servidores
- Para fazer backup: use "Exportar" em Relatórios ou Configurações

---

### Suporte a Navegadores
- Google Chrome (recomendado)
- Microsoft Edge
- Mozilla Firefox
- Safari

---

*FinPessoal v2.0 — Desenvolvido para uso pessoal*
