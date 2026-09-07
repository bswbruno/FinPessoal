/**
 * ============================================================
 * FinPessoal – Firestore Database
 * ============================================================
 */

// ============================================================
// FUNÇÃO PARA SALVAR DADOS NO FIRESTORE
// ============================================================
function salvarDadosFirestore(uid, dados) {
    if (!uid) {
        console.warn('⚠️ Nenhum usuário logado para salvar');
        return Promise.resolve();
    }

    console.log('💾 Salvando dados no Firestore...');

    // Prepara os dados para salvar
    const dadosParaSalvar = {
        despesas: dados.expenses || [],
        receitas: dados.incomes || [],
        cartoes: dados.cards || [],
        contas: dados.accounts || [],
        movimentacoes: dados.movements || [],
        objetivos: dados.objectives || [],
        entriesObjetivos: dados.objectiveEntries || [],
        orcamentos: dados.budgets || {},
        grupos: dados.groups || [],
        statusDespesas: dados.expStatuses || [],
        statusReceitas: dados.incStatuses || [],
        configuracoes: dados.settings || {},
        ultimaAtualizacao: new Date().toISOString()
    };

    return firebase.firestore()
        .collection('usuarios')
        .doc(uid)
        .collection('dados')
        .doc('financeiro')
        .set(dadosParaSalvar, { merge: true })
        .then(() => {
            console.log('✅ Dados salvos no Firestore com sucesso!');
        })
        .catch((error) => {
            console.error('❌ Erro ao salvar no Firestore:', error);
            // Não propaga o erro para não quebrar o app
            return Promise.resolve();
        });
}

// ============================================================
// FUNÇÃO PARA CARREGAR DADOS DO FIRESTORE
// ============================================================
function carregarDadosFirestore(uid) {
    if (!uid) {
        console.warn('⚠️ Nenhum usuário logado para carregar');
        return Promise.resolve(null);
    }

    console.log('📥 Carregando dados do Firestore...');

    return firebase.firestore()
        .collection('usuarios')
        .doc(uid)
        .collection('dados')
        .doc('financeiro')
        .get()
        .then((doc) => {
            if (doc.exists) {
                const dados = doc.data();
                console.log('✅ Dados carregados do Firestore!');
                return dados;
            } else {
                console.log('ℹ️ Nenhum dado encontrado no Firestore.');
                return null;
            }
        })
        .catch((error) => {
            console.error('❌ Erro ao carregar dados:', error);
            return null;
        });
}

// ============================================================
// FUNÇÃO PARA LIMPAR DADOS DO FIRESTORE
// ============================================================
function limparDadosFirestore(uid) {
    if (!uid) return Promise.resolve();

    return firebase.firestore()
        .collection('usuarios')
        .doc(uid)
        .collection('dados')
        .doc('financeiro')
        .delete()
        .then(() => {
            console.log('🗑️ Dados removidos do Firestore');
        })
        .catch((error) => {
            console.error('❌ Erro ao limpar dados:', error);
        });
}

// ============================================================
// EXPORTA FUNÇÕES PARA O ESCOPO GLOBAL
// ============================================================
window.salvarDadosFirestore = salvarDadosFirestore;
window.carregarDadosFirestore = carregarDadosFirestore;
window.limparDadosFirestore = limparDadosFirestore;

console.log('✅ Firestore Database carregado!');