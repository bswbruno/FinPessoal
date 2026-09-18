# FinPessoal

## Sistema Financeiro Pessoal

Aplicação web (PWA) para controle financeiro pessoal — despesas, receitas, cartões, contas bancárias, patrimônio, orçamentos e agenda financeira. Funciona como app instalável no celular/desktop, com **sincronização em tempo real na nuvem** via Firebase.

---

### 🆕 Novidades da v10.5

- 🔒 **Firestore Security Rules**: regras de segurança auditadas, testadas e publicadas. Cada usuário agora só acessa os próprios dados na nuvem (veja a seção [Segurança](#-segurança--firestore-security-rules) abaixo).
- 📄 **Arquivo `firestore.rules` versionado** no repositório, junto com documentação de como testar e publicar alterações.

---

### 🔄 Novidade v10.1: aviso de atualização do app (PWA)

Quem **instalou o app** (celular ou computador, "Adicionar à tela inicial"/"Instalar app") agora recebe um aviso quando você publica uma versão nova: um banner discreto no rodapé — "🔄 Nova versão disponível" — com um botão **"Atualizar agora"**. Ao clicar, o app atualiza e recarrega sozinho, **sem precisar de F5 nem perder os dados cadastrados** (os dados ficam na nuvem via Firestore + cache local via `localStorage`, ambos separados do cache do Service Worker).

Quem só acessa pelo navegador normal (sem instalar) não vê esse aviso.

**Como isso funciona por baixo dos panos**, pra quando for mexer de novo:
- `service-worker.js`: o SW novo não assume sozinho mais — ele fica "esperando" até a página mandar a mensagem `SKIP_WAITING` (isso é proposital, pra não interromper a pessoa no meio do uso).
- `index.html` (final do arquivo): registra o SW e fica de olho em `updatefound`/`statechange`. Se detectar uma atualização **e** o app estiver rodando em modo instalado (`display-mode: standalone`), mostra o banner. O botão manda `SKIP_WAITING` pro SW novo, e o evento `controllerchange` dispara o reload automático.
- **Toda vez que você alterar algo em CSS/JS/HTML**, lembre de subir também o número do `CACHE_NAME` em `service-worker.js` (ex: de `'finpessoal-cache-v3'` pra `'finpessoal-cache-v4'`) — é esse número mudando que faz o navegador perceber que existe uma versão nova pra baixar. Sem isso, o Service Worker acha que nada mudou e ninguém recebe o aviso.

---

### 🚨 Correção crítica (v4.9)

**Bug:** a inicialização do `index.html` estava chamando `seedDemoData(true)` a cada carregamento da página — o `true` força a substituição de TODOS os dados por dados fictícios, então qualquer lançamento real que alguém cadastrasse era apagado ao recarregar a página.

**Corrigido.** Agora:
- Os dados fictícios só aparecem **uma vez**, no primeiro acesso daquele navegador (modal de boas-vindas, com opção de escolher "Explorar em branco" ou "Ver com dados de exemplo").
- Dados reais cadastrados pela pessoa **persistem normalmente** entre recarregamentos da página.
- "Apagar todos os dados" em Configurações agora funciona de verdade: depois de apagar, os dados continuam apagados mesmo recarregando — não voltam dados fictícios sozinhos.

---

### 🎓 Sobre este projeto (portfólio)

Este é um projeto de portfólio pessoal. Ao abrir pela primeira vez, aparece um aviso explicando como o app funciona — com um botão pra já explorar o app preenchido com **dados fictícios** (Configurações → "Dados de Demonstração" faz isso a qualquer momento também).

---

### Novidades da v4.8

- 👋 **Modal de boas-vindas/privacidade**: aparece uma vez só, na primeira visita neste navegador, com atalho pra já carregar dados fictícios de demonstração.
- 🧪 **Dados de Demonstração**: preenche o app inteiro (contas, cartões, despesas variadas, receitas, patrimônio, orçamentos) com informações fictícias realistas — ideal pra prints/vídeo de portfólio sem expor dados reais.
- 💰 **Pagamento parcial de dívidas**: ao confirmar um pagamento, dá pra informar um valor menor que o total (ex: pagar R$100 de uma dívida de R$530). A despesa fica com um selo "Parcial" mostrando quanto já foi pago e quanto falta, e só vira "Pago" quando o valor acumulado bate com o total. Já refletido em A Pagar, Dívidas, Dashboard e no limite do cartão.
- 🐛 **Correção: Preferências do Dashboard não aplicava sem recarregar** — agora qualquer alteração (período padrão, seções visíveis) já reflete na próxima vez que o Dashboard abrir, sem precisar dar F5.
- ➕ **Novas seções configuráveis no Dashboard**: Orçamento por Categoria, Próximo Vencimento de Fatura (calculado pro mês selecionado na topbar), Alertas de atraso/vencimento, e os dois gráficos — todas com opção de mostrar/ocultar em Configurações → Preferências do Dashboard.
- 📝 **Orçamento por Categoria mais claro**: texto explicando que é um teto de gasto geral por categoria (não ligado a nenhuma conta específica), com o quanto já foi gasto exibido ao lado de cada grupo.
- 🔗 **Movimentações**: os botões de editar/excluir agora aparecem em todas as linhas — para lançamentos gerados automaticamente (Gasto Rápido, pagamentos), a ação abre o lançamento de origem em A Pagar/A Receber (que já mantém tudo sincronizado).
- 🔀 **Ordenação e agrupamento em A Pagar/A Receber**: filtro de ordenação (vencimento, valor, descrição) e opção de exibir tudo junto ou separado em três tabelas (Atrasadas/Pendentes/Pagas). Linhas pagas ficam com fundo verde suave; atrasadas, vermelho suave.
- 📈 **CSV corrigido pro Excel brasileiro**: separador trocado pra ponto e vírgula (a vírgula no Brasil é separador decimal), números e datas no formato brasileiro.
- 🐛 **Correção: movimentações órfãs** — editar/excluir uma despesa ou receita com movimentação vinculada agora atualiza/remove ela também.

---

### Novidades da v4.5

- 🗓️ **Agenda Financeira**: novo menu com calendário do mês (usa o mesmo mês navegado na topbar), mostrando em cada dia quantas despesas, receitas e movimentações de patrimônio existem — clique num dia pra ver os detalhes. Dias com despesa em atraso ficam destacados.
- 💳 **Cartão de Crédito Inteligente**: a tela de Cartões agora calcula o ciclo real da fatura a partir do dia de fechamento/vencimento — mostra Limite disponível, Comprometido (todas as parcelas futuras, que é o que reduz o limite de verdade), Fatura Atual (só as compras do ciclo que vai fechar em seguida) com data de vencimento, e o Melhor dia de compra (o dia logo após o fechamento, que dá o maior prazo pra pagar). Um botão "Ver fatura atual" mostra o detalhe de cada compra daquele ciclo.

---

### Novidades da v4.4

- 🏷️ **Orçamento por Categoria**: em Configurações, defina um limite mensal para qualquer grupo de despesa (ex: "Alimentação: R$800"). O Dashboard passa a mostrar uma seção "Orçamento por Categoria" com barra de progresso por grupo, e dispara alertas automáticos: aviso ao chegar em 80% do limite, e alerta de "estourado" ao ultrapassar — sempre calculado sobre o mês real navegado, independente dos filtros do Dashboard.

---

### Novidades da v4.0

- ⚡ **Gasto Rápido**: novo ícone na barra superior pra lançar pequenas despesas do dia a dia (Lanchonete, Mercado, Padaria, Farmácia, Uber, Cinema ou "Outro") sem passar pelo formulário completo de "A Pagar". Escolha a categoria, o valor, a forma de pagamento (Dinheiro/Débito/Crédito/PIX) e, se quiser, a conta de onde saiu o dinheiro — o gasto já nasce marcado como pago (porque gasto do dia a dia já é pago na hora) e, se uma conta foi escolhida, o saldo dela é debitado na mesma hora.

---

### ⚠️ Importante: isso não é um banco digital

O FinPessoal é uma ferramenta de **controle** financeiro pessoal. Nada aqui move dinheiro de verdade — quando você "guarda" ou "retira" dinheiro de um objetivo, ou paga uma dívida vinculando uma conta, o sistema só **anota** essa movimentação para manter o saldo mostrado no app fiel à realidade do seu banco de verdade.

---

### Novidades da v3.6

- 🎯 **Patrimônio**: novo menu para cadastrar objetivos financeiros (Reserva de Emergência, Viagem, Comprar carro, etc.), cada um com meta opcional e barra de progresso. Use "+ Guardar" / "− Retirar" para registrar aportes e resgates, com histórico completo por objetivo.
- 🔗 Ao guardar/retirar vinculando uma conta bancária, o saldo dessa conta é ajustado automaticamente (mesma regra das dívidas: só acontece se você escolher a conta explicitamente).
- 📊 **Meta Mensal corrigida**: agora compara com o valor **realmente guardado** nos objetivos durante o mês (antes comparava com receitas − despesas, que não refletia dinheiro de fato reservado).
- 📈 Dashboard ganhou uma seção "Patrimônio" mostrando os objetivos e o total guardado, separada das demais seções (mesma lógica de não misturar KPIs independentes).

---

### Novidades da v3.4

- 🔐 **Login e cadastro multiusuário**: tela de entrada (`login.html`) com cadastro (nome, e-mail, senha com validação) e login via Firebase Authentication (e-mail/senha ou Google). Cada conta só enxerga os próprios lançamentos — mesmo que duas pessoas usem o mesmo navegador/computador, uma nunca vê os dados da outra.
- ☁️ **Sincronização na nuvem (Firestore)**: a partir da v10.x, os dados financeiros são salvos no Firebase Firestore, com sincronização em tempo real entre dispositivos. Veja a seção [Segurança](#-segurança--firestore-security-rules).
- 🚪 Botão de sair (logout) no rodapé do menu lateral.

---

### Novidades da v3.3

- 🏦 **Contas Bancárias**: novo menu para cadastrar contas (nome, banco, agência, número, tipo — corrente/poupança/carteira —, cor, saldo inicial e status ativa/inativa). O saldo atual é sempre **calculado** a partir do saldo inicial + movimentações (nunca um número fixo que possa dessincronizar).
- ⇄ **Movimentações**: extrato com todas as entradas, saídas e transferências entre contas. Pode ser lançado manualmente ou gerado automaticamente quando você paga uma despesa/recebe uma receita vinculando uma conta.
- 🔗 **Regra importante — saldo de conta NÃO abate dívida automaticamente**: se você tem R$ 2.000 em despesas pendentes e R$ 1.000 numa conta, o Dashboard mostra os dois valores separados, sem nenhum desconto automático. A única forma de uma despesa "consumir" o saldo de uma conta é você escolher explicitamente aquela conta na hora de confirmar o pagamento. Da mesma forma, ao confirmar um recebimento, você escolhe (opcionalmente) em qual conta o dinheiro entrou.
- 📊 **Dashboard mais detalhado**: nova seção "Contas Bancárias" mostrando o saldo de cada conta ativa e o total — visualmente separada dos KPIs de despesas/receitas/dívidas, para reforçar que são cálculos independentes.

---

### Novidades da v3.2

- 📎 **Recibo agora é anexado no momento do pagamento**, não mais na criação da despesa. Ao clicar em "Pagar" (tanto em "A Pagar" quanto em uma parcela dentro de "Dívidas"), abre uma modal de confirmação com um campo opcional de upload (imagem ou PDF). O recibo salvo fica acessível pelo botão 📎 na tabela.
- 🏷️ **Cadastro de Grupos**: em Configurações, adicione/remova suas próprias categorias de despesa (além das padrão: Casa, Cartão, Automóvel, etc.).
- ✅ **Cadastro de Status**: também em Configurações, adicione status extras para despesas e receitas (ex: "Aguardando reembolso", "Cancelado"). Os status principais (Pendente/Pago/Atrasado para despesas, Pendente/Recebido para receitas) não podem ser removidos, pois são usados pelo sistema para calcular atrasos, badges e KPIs — mas convivem normalmente com os que você cadastrar.

---

### Novidades da v3.0

- 🌓 **Tema claro/escuro**: botão (☀️/🌙) no canto superior direito. A escolha fica salva no navegador (`localStorage`, chave `fp-theme`) e é lembrada na próxima visita. Se o usuário nunca escolheu, o app respeita o tema do sistema operacional.
- 🎨 **Visual modernizado**: fonte Inter, cantos mais arredondados, sombras suaves, cores revisadas para ambos os temas, pequenas transições/animações.
- 📱 **Responsividade completa**: o layout se adapta a celulares e tablets. Em telas estreitas, o menu lateral vira uma "gaveta" (off-canvas) aberta pelo botão ☰ na barra superior, os grids de KPIs/gráficos reorganizam em menos colunas, e tabelas longas ganham rolagem horizontal em vez de quebrar o layout.
- 📄 **Código documentado**: `css/style.css` tem um índice no topo e seções numeradas comentadas; `js/ui.js` (novo arquivo) concentra toda a lógica de tema e menu mobile, isolada da lógica financeira.

---

## 🔒 Segurança — Firestore Security Rules

Os dados financeiros ficam sincronizados no **Firebase Firestore** (nuvem). A segurança desses dados depende das **regras de segurança do Firestore**.

As regras estão versionadas no arquivo [`firestore.rules`](./firestore.rules) na raiz do projeto, e garantem que:

- 🔓 **Usuário não autenticado** → não acessa nada
- 🔐 **Usuário autenticado** → acessa apenas seus próprios dados (`usuarios/{seu-uid}/...`)
- 🚫 **Usuário A** → **não** lê, cria, altera ou apaga dados do **usuário B**

### Estrutura dos dados no Firestore

```
usuarios/
  └── {uid}/                    ← perfil (nome, email, telefone)
      └── dados/
          └── financeiro        ← despesas, receitas, cartões, etc.
```

### Regra aplicada

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /usuarios/{userId} {
      allow read, write: if request.auth != null 
                         && request.auth.uid == userId;

      match /dados/{docId} {
        allow read, write: if request.auth != null 
                           && request.auth.uid == userId;
      }
    }

    // Bloqueia qualquer outra coleção
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Como testar as regras

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione o projeto `fin-pessoal-fcbad`
3. Vá em **Firestore Database → Regras**
4. Use o **Laboratório de testes de regras** (canto inferior esquerdo)
5. Simule cenários:
   - ✅ Usuário logado lendo os próprios dados → **permitido**
   - ❌ Usuário logado lendo dados de outro → **negado**
   - ❌ Usuário deslogado lendo qualquer coisa → **negado**

### Como publicar alterações nas regras

Sempre que alterar o arquivo `firestore.rules`:

1. Copie o conteúdo
2. Cole no editor de regras do Firebase Console
3. **Teste no simulador ANTES de publicar**
4. Só depois clique em **Publicar**

> ⚠️ **Atenção:** publicar regras incorretas pode bloquear o acesso dos usuários ao app. Sempre teste antes.

> 💡 **Nota sobre o plano gratuito (Spark):** o Firestore no plano gratuito tem exatamente as mesmas regras de segurança do plano pago. O que muda são os limites de leitura/escrita por dia, não a segurança.

---

## 🧱 Estrutura do Projeto

```
FinPessoal/
├── index.html              ← App principal (protegido por login)
├── login.html              ← Tela de login
├── register.html           ← Tela de cadastro
├── reset-password.html     ← Tela de redefinição de senha
├── manifest.json           ← Manifesto PWA
├── service-worker.js       ← Service Worker (cache + atualizações)
├── firestore.rules         ← Regras de segurança do Firestore
├── README.md               ← Este arquivo
│
├── css/
│   ├── style.css           ← Estilos base (tema claro/escuro + responsivo)
│   ├── dashboard.css
│   ├── relatorios.css
│   ├── cartoes.css
│   ├── contas.css
│   ├── pagar.css
│   ├── receber.css
│   ├── modal.css
│   ├── patrimonio.css
│   ├── custom.css
│   └── reset-password.css
│
├── js/
│   ├── firebase-config.js  ← Configuração do Firebase
│   ├── firebase-db.js      ← Funções de Firestore (com tempo real)
│   ├── utils.js            ← Estado global, utilitários, gráficos
│   ├── categorias.js       ← Grupos e Status personalizados
│   ├── contas.js           ← Contas Bancárias
│   ├── movimentacoes.js    ← Extrato/movimentações
│   ├── nav.js              ← Navegação entre páginas
│   ├── ui.js               ← Tema claro/escuro + menu mobile
│   ├── receipts.js         ← Recibos + confirmação de pagamento
│   ├── dashboard.js        ← Dashboard principal
│   ├── pagar.js            ← Módulo A Pagar
│   ├── receber.js          ← Módulo A Receber
│   ├── dividas.js          ← Dívidas parceladas
│   ├── cartoes.js          ← Gestão de cartões
│   ├── relatorios.js       ← Relatórios e exportação CSV
│   ├── patrimonio.js       ← Objetivos e aportes
│   ├── agenda.js           ← Agenda financeira
│   ├── calculadora.js      ← Calculadora
│   ├── gastorapido.js      ← Gasto rápido
│   ├── modals.js           ← Configurações e modais
│   ├── demo.js             ← Dados de demonstração
│   ├── suporte.js          ← Tela de suporte
│   └── lib/
│       └── lucide.min.js   ← Biblioteca de ícones (local)
│
└── icons/                  ← Ícones do PWA
```

> **Nota:** existe um arquivo `js/app.js` no projeto que **não é carregado** pelo `index.html` (não há `<script>` apontando para ele). Parece ser uma versão antiga/alternativa de `nav.js` + `modals.js`. Ele foi mantido como está para não alterar nada fora do escopo, mas pode ser removido com segurança caso queira limpar o projeto.

---

## 🛠️ Como usar

### Uso normal (app hospedado)

1. Acesse: **https://bswbruno.github.io/FinPessoal**
2. Crie uma conta (e-mail/senha ou Google)
3. Pronto — seus dados ficam sincronizados na nuvem

### Rodar localmente (desenvolvimento)

1. Clone o repositório
2. Abra o `index.html` num servidor local (ex: `npx serve` ou extensão Live Server do VS Code)
3. ⚠️ **Não abra o `index.html` como arquivo** (`file://`) — o Firebase Auth precisa de um servidor HTTP

---

## 🔧 Manutenção — notas técnicas

### Login/cadastro (Firebase Authentication)

- **Backend**: Firebase Authentication (e-mail/senha + Google Sign-In)
- **Front-end**: `login.html`, `register.html`, `reset-password.html`, `firebase-config.js`
- **Config do Firebase**: `js/firebase-config.js` (apiKey, projectId, etc.)
- **Sessão**: gerenciada automaticamente pelo SDK do Firebase Auth
- **Dados por usuário**: a chave do `localStorage` é `fp3_<uid>` (ver `storageKey()` em `js/utils.js`) — cada conta logada tem sua própria "gaveta" local de cache

### Firestore (dados financeiros)

- **Arquivo principal**: `js/firebase-db.js`
- **Funções expostas** (via `window`):
  - `iniciarListenerFirestore(uid, callback)` — inicia sincronização em tempo real
  - `removerListenerFirestore()` — remove o listener
  - `salvarDadosFirestore(uid, dados)` — salva os dados (com `merge: true`)
  - `carregarDadosFirestore(uid)` — carrega uma vez
  - `limparDadosFirestore(uid)` — apaga os dados
- **Estrutura**: `usuarios/{uid}/dados/financeiro` (documento único com todos os dados financeiros)
- **Sincronização**: `onSnapshot` mantém a UI atualizada em tempo real
- **Fallback local**: se o Firestore falhar, os dados também ficam em `localStorage` (chave `fp3_<uid>`)

### Contas Bancárias e Movimentações

- `ST.accounts` guarda as contas cadastradas; `ST.movements` guarda o extrato (entradas/saídas/transferências), ambos em `js/utils.js`, persistidos via `sv()`/`ld()`
- `accountBalance(id)` (em `js/utils.js`) **calcula** o saldo de uma conta a partir do saldo inicial + movimentações — nunca é um valor fixo armazenado, o que evita bugs de dessincronização
- `totalSaldoContas()` soma o saldo de todas as contas ativas — usado no Dashboard, sempre exibido separado dos KPIs de despesas/dívidas
- `addMovement()` (em `js/movimentacoes.js`) cria uma movimentação; é chamada tanto pelo formulário manual quanto pelos fluxos de pagamento (`confirmPayment()` em `js/receipts.js`) e recebimento (`confirmReceive()` em `js/movimentacoes.js`) — só quando o usuário escolhe uma conta
- Movimentações com `linkedId` preenchido foram geradas automaticamente e não podem ser editadas/excluídas na tela de Movimentações (edite pela despesa/receita de origem)

### Grupos e Status personalizados

- `ST.groups`, `ST.expStatuses` e `ST.incStatuses` (em `js/utils.js`) guardam as listas atuais, persistidas via `sv()`/`ld()` como o resto dos dados
- `js/categorias.js` tem as funções de adicionar/remover (`addGroup`/`removeGroup`, `addExpStatus`/`removeExpStatus`, `addIncStatus`/`removeIncStatus`) e as que populam os `<select>` dos formulários (`refreshGroupSelect`, `refreshExpStatusSelect`, `refreshIncStatusSelect`) — chamadas sempre que um modal é aberto
- `CORE_EXP_STATUSES`/`CORE_INC_STATUSES` (em `js/utils.js`) protegem os status principais contra remoção, porque a lógica de atraso/KPIs depende deles especificamente

### Recibo no pagamento

- `toggleE()` (js/pagar.js) e `toggleEP()` (js/dividas.js) não marcam a despesa como paga diretamente: quando o status ainda não é "pago", eles chamam `openPayModal(id, origem, gid?)` (js/receipts.js), que abre a modal de confirmação com o upload opcional e a seleção de conta bancária
- `confirmPayment()` marca como pago, salva o recibo (se algum foi anexado), gera a movimentação de saída (se uma conta foi escolhida) e atualiza a tela correta
- Desmarcar uma despesa já paga (clicar de novo em "Pago") não pede confirmação nem recibo — apenas volta para "pendente"

### Tema claro/escuro

Todas as cores da interface vêm de variáveis CSS (`--bg`, `--text`, `--purple`, etc.) definidas em `css/style.css`, seção **"# 2. TEMA"**:
- `:root` / `html[data-theme="light"]` → valores do tema claro
- `html[data-theme="dark"]` → valores do tema escuro

O `js/ui.js` só troca o atributo `data-theme` da tag `<html>`; ele não conhece nenhuma cor específica. **Para ajustar uma cor**, edite apenas o `style.css`. **Para criar um novo tema**, copie o bloco de variáveis, troque o seletor (ex: `html[data-theme="azul"]`) e adicione um botão/opção que chame `localStorage.setItem('fp-theme','azul')` seguido de `applyTheme('azul')`.

### Responsividade — breakpoints usados

| Faixa | Comportamento |
|-------|---------------|
| acima de 1024px | Desktop: sidebar fixa, grids completos |
| 701px – 1024px | Tablet: sidebar vira menu retrátil (☰), grids com menos colunas |
| até 700px | Celular: mesmo comportamento do tablet + espaçamentos/fontes menores |

Os ajustes ficam em `css/style.css`, seção **"# 21. RESPONSIVO"**. Prefira sempre editar os blocos `@media` já existentes ali em vez de criar novos soltos pelo arquivo.

### PWA / Service Worker

- **Arquivo**: `service-worker.js`
- **Estratégia**: cache-first com aviso de atualização (não força reload sozinho)
- ⚠️ **Sempre que alterar CSS/JS/HTML**, suba o número do `CACHE_NAME` (ex: `v3` → `v4`) pra que o navegador detecte a atualização
- O `index.html` registra o SW só em produção (não em `localhost`)

---

## ✨ Funcionalidades

### Dashboard
- KPIs: Receitas, Despesas, Saldo, Meta de Economia
- Alertas de itens em atraso e próximos do vencimento
- Gráfico de barras dos últimos 6 meses
- Gráfico de pizza por grupo de despesa
- Resumo visual dos cartões
- Filtros: período, conta, cartão, categoria, status

### A Pagar
- Adicionar, editar e excluir despesas
- Despesas **fixas** com opção de repetir mensalmente (12 meses)
- Despesas **parceladas**: gera automaticamente as N parcelas nos meses corretos
- Filtros por status (Todos / Pendente / Pago / Atrasado)
- Busca por descrição
- Marcar como pago / desmarcar (com suporte a pagamento parcial)
- Vinculação a cartão de crédito
- Grupos: Casa, Cartão, Automóvel, Saúde, Alimentação, Lazer, Educação, Assinatura, Outros

### A Receber
- Salário, Freelance/Projeto, Recebimento de Pessoa, Aluguel, Investimentos, Bônus
- Cadastro de origem/fonte
- Recorrências: Único, Parcelado, Mensal (12 meses)
- Marcar como recebido

### Dívidas Parceladas
- Visão consolidada de todas as dívidas agrupadas
- Barra de progresso por dívida
- Valor restante e próxima parcela
- Marcar parcelas individuais como pagas

### Cartões
- Nome, bandeira, últimos 4 dígitos
- Limite e % de uso (calculado automaticamente)
- Dia de fechamento e vencimento
- Ciclo de fatura inteligente (Limite disponível, Comprometido, Fatura Atual, Melhor dia de compra)
- Cor personalizada (paleta + color picker)
- Barra de uso visual

### Contas Bancárias
- Nome, banco, tipo (corrente/poupança/carteira), agência, número
- Saldo inicial + cálculo automático do saldo atual
- PIX (opcional)
- Cor personalizada

### Movimentações
- Extrato de entradas, saídas e transferências
- Lançamento manual ou automático (via pagamento/recebimento)
- Filtros e busca

### Patrimônio
- Objetivos com meta opcional e barra de progresso
- Aportes e retiradas com histórico
- Vínculo opcional com conta bancária

### Agenda
- Calendário mensal com despesas, receitas e aportes
- Detalhes por dia

### Relatórios
- Resumo mensal completo
- Tabela de gastos por grupo com % e barra
- Breakdown por tipo de receita
- **Exportar CSV** do mês atual ou histórico completo
- **Exportar/Importar Backup (JSON)** completo

### Configurações
- Nome do usuário
- Meta mensal de economia
- Dias de alerta antes do vencimento
- Preferências do Dashboard (seções visíveis, período padrão)
- Privacidade (ocultar valores)
- Orçamento por categoria
- Grupos e Status personalizados
- Dados de demonstração
- Exportar/importar backup

---

## 🔐 Dados e Privacidade

- Os dados financeiros ficam **sincronizados no Firebase Firestore** (nuvem), vinculados à conta do usuário
- Há também um **cache local** no `localStorage` (chave `fp3_<uid>`) — serve pra carregar o app mais rápido e como fallback
- **Nenhum dado é compartilhado** com terceiros. Cada usuário acessa apenas os próprios dados (garantido pelas Security Rules — veja a seção [Segurança](#-segurança--firestore-security-rules))
- Para fazer backup manual: **Configurações → Exportar Backup (JSON)** ou **Relatórios → Exportar CSV**

---

## 🌐 Suporte a Navegadores

- Google Chrome (recomendado)
- Microsoft Edge
- Mozilla Firefox
- Safari

---

*FinPessoal — Desenvolvido para uso pessoal · Última atualização: v10.5*