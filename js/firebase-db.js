/**
 * ============================================================
 * FinPessoal – Firestore Database (COM TEMPO REAL)
 * ============================================================
 */

// ============================================================
// VARIÁVEL PARA GUARDAR O LISTENER
// ============================================================
let unsubscribeListener = null;
let listenerAtivo = false;

// ============================================================
// FUNÇÃO PARA INICIAR LISTENER EM TEMPO REAL
// ============================================================
function iniciarListenerFirestore(uid, callback) {
    if (!uid) {
        console.warn('⚠️ Nenhum usuário logado para escutar');
        return;
    }

    // Remove listener anterior se existir
    if (unsubscribeListener) {
        unsubscribeListener();
        unsubscribeListener = null;
        listenerAtivo = false;
        console.log('🛑 Listener anterior removido');
    }

    console.log('👂 Iniciando listener em tempo real...');

    // CRIA O LISTENER
    unsubscribeListener = firebase.firestore()
        .collection('usuarios')
        .doc(uid)
        .collection('dados')
        .doc('financeiro')
        .onSnapshot(
            (doc) => {
                listenerAtivo = true;
                
                if (doc.exists) {
                    const dados = doc.data();
                    console.log('🔄 Dados atualizados em TEMPO REAL!', new Date().toLocaleTimeString());
                    
                    // Chama o callback com os dados
                    if (typeof callback === 'function') {
                        callback(dados);
                    }
                } else {
                    console.log('ℹ️ Documento ainda não existe. Aguardando criação...');
                    if (typeof callback === 'function') {
                        callback(null);
                    }
                }
            },
            (error) => {
                console.error('❌ Erro no listener:', error);
                listenerAtivo = false;
                
                // Tenta reconectar após 5 segundos
                setTimeout(() => {
                    if (!listenerAtivo && uid) {
                        console.log('🔄 Tentando reconectar listener...');
                        iniciarListenerFirestore(uid, callback);
                    }
                }, 5000);
            }
        );

    console.log('✅ Listener iniciado com sucesso!');
}

// ============================================================
// FUNÇÃO PARA REMOVER O LISTENER
// ============================================================
function removerListenerFirestore() {
    if (unsubscribeListener) {
        unsubscribeListener();
        unsubscribeListener = null;
        listenerAtivo = false;
        console.log('🛑 Listener removido');
    }
}

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
            return Promise.resolve();
        });
}

// ============================================================
// FUNÇÃO PARA CARREGAR DADOS DO FIRESTORE (UMA VEZ)
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
window.iniciarListenerFirestore = iniciarListenerFirestore;
window.removerListenerFirestore = removerListenerFirestore;
window.salvarDadosFirestore = salvarDadosFirestore;
window.carregarDadosFirestore = carregarDadosFirestore;
window.limparDadosFirestore = limparDadosFirestore;

console.log('✅ Firestore Database (com tempo real) carregado!');