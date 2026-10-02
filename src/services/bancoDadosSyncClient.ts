/**
 * BANCO DE DADOS SYNC CLIENT
 * 
 * Responsável por enviar os dados atualizados das coleções da empresa para o
 * serviço de sincronização do Backend (Node.js/Express), que por sua vez gera
 * e publica os arquivos JSON em `/public/banco-dados/hoje/`, `/historico/` e `/indices/`.
 * 
 * O Navegador NÃO escreve diretamente no sistema de arquivos estáticos.
 */

export interface SyncResponse {
  success: boolean;
  entity?: string;
  synced?: string[];
  filePath?: string;
  timestamp: string;
  error?: string;
}

/**
 * Envia uma entidade específica para ser sincronizada e gravada pelo backend
 */
export async function syncEntityToPublic(entity: string, data: any): Promise<SyncResponse> {
  try {
    const res = await fetch(`/api/sync/banco-dados/hoje/${encodeURIComponent(entity)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Erro HTTP ${res.status}`);
    }

    return await res.json();
  } catch (error: any) {
    console.warn(`[SyncClient] Falha ao sincronizar ${entity} com o backend:`, error);
    return {
      success: false,
      entity,
      timestamp: new Date().toISOString(),
      error: error.message || 'Erro de conexão com o Sync Service'
    };
  }
}

/**
 * Envia todas as entidades operacionais para atualização em lote pelo backend
 */
export async function syncAllEntitiesToPublic(payload: {
  estoque?: any;
  picking?: any;
  pedidos?: any;
  validade?: any;
  temperatura?: any;
  desvios?: any;
  quebras?: any;
  dashboard?: any;
}): Promise<SyncResponse> {
  try {
    const res = await fetch('/api/sync/banco-dados', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Erro HTTP ${res.status}`);
    }

    return await res.json();
  } catch (error: any) {
    console.warn('[SyncClient] Falha na sincronização completa:', error);
    return {
      success: false,
      timestamp: new Date().toISOString(),
      error: error.message || 'Erro de conexão com o Sync Service'
    };
  }
}

/**
 * Transforma o estado do Firestore da empresa em payload estruturado para as entidades do banco-dados
 */
export function formatEmpresaStateToPublicPayload(state: any, empresaId?: string) {
  const dataRef = new Date().toISOString().split('T')[0];
  const payload: any = {};

  // 1. ESTOQUE
  if (Array.isArray(state.armazem) && state.armazem.length > 0) {
    const itens = state.armazem.map((item: any, idx: number) => ({
      codigo: Number(item.codigo || 2100 + idx),
      descricao: String(item.descricao || item.produto || 'PRODUTO NÃO ESPECIFICADO'),
      categoria: String(item.categoria || 'CERVEJAS'),
      tipoEmbalagem: String(item.embalagem || item.tipoEmbalagem || 'CX'),
      quantidadeCaixas: Number(item.quantidadeCaixas || item.quantidade || 0),
      quantidadePaletes: Number(item.quantidadePaletes || item.paletes || Math.ceil((item.quantidadeCaixas || 0) / 60)),
      localizacao: String(item.localizacao || item.posicao || 'RUA-PADRAO'),
      lote: String(item.lote || 'LOTE-PADRAO'),
      validade: String(item.validade || dataRef),
      status: String(item.status || 'disponivel'),
      valorUnitario: Number(item.valorUnitario || item.preco || 0),
      hlUnitario: Number(item.hlUnitario || 0.084)
    }));

    const totalCaixas = itens.reduce((acc: number, curr: any) => acc + (curr.quantidadeCaixas || 0), 0);
    const paletesOcupados = itens.reduce((acc: number, curr: any) => acc + (curr.quantidadePaletes || 0), 0);
    const capacidadeTotalPaletes = 4500;

    payload.estoque = {
      dataReferencia: dataRef,
      capacidadeTotalPaletes,
      paletesOcupados: Math.min(paletesOcupados, capacidadeTotalPaletes),
      taxaOcupacaoPercentual: Number(((paletesOcupados / capacidadeTotalPaletes) * 100).toFixed(2)),
      totalItens: itens.length,
      totalCaixasEstoque: totalCaixas,
      itens
    };
  }

  // 2. PICKING
  if (Array.isArray(state.tarefas) && state.tarefas.length > 0) {
    const tarefas = state.tarefas.map((t: any, idx: number) => ({
      id: String(t.id || `TASK-${idx + 1}`),
      pedidoId: String(t.pedidoId || `PED-${idx + 1}`),
      rota: String(t.rota || 'ROTA-01'),
      operador: String(t.operador || t.responsavel || 'Operador Padrão'),
      codigo: Number(t.codigo || 2100),
      descricao: String(t.descricao || t.produto || 'Item de Separação'),
      quantidade: Number(t.quantidade || 0),
      unidade: String(t.unidade || 'CX'),
      boxOrigem: String(t.boxOrigem || 'BOX-A'),
      docaDestino: String(t.docaDestino || 'DOCA-1'),
      status: String(t.status || 'pendente'),
      iniciadoEm: t.iniciadoEm || null,
      concluidoEm: t.concluidoEm || null
    }));

    const concluidas = tarefas.filter((t: any) => t.status === 'concluida').length;
    const emAndamento = tarefas.filter((t: any) => t.status === 'em_andamento').length;
    const pendentes = tarefas.filter((t: any) => t.status === 'pendente').length;

    payload.picking = {
      dataReferencia: dataRef,
      totalTarefas: tarefas.length,
      tarefasConcluidas: concluidas,
      tarefasEmAndamento: emAndamento,
      tarefasPendentes: pendentes,
      produtividadeMediaCxHora: 142.5,
      tarefas
    };
  }

  // 3. VALIDADES FEFO
  if (Array.isArray(state.validades) && state.validades.length > 0) {
    const itensVal = state.validades.map((v: any, idx: number) => {
      const dias = Number(v.diasRestantes || v.dias || 120);
      let status = 'normal';
      if (dias <= 30) status = 'critico';
      else if (dias <= 60) status = 'alerta';

      return {
        id: String(v.id || `VAL-${idx + 1}`),
        codigo: Number(v.codigo || 2100),
        descricao: String(v.descricao || v.produto || 'Produto com Validade'),
        lote: String(v.lote || 'L-PADRAO'),
        validade: String(v.validade || dataRef),
        diasRestantes: dias,
        quantidade: Number(v.quantidade || 0),
        unidade: String(v.unidade || 'CX'),
        localizacao: String(v.localizacao || 'RUA-A'),
        status,
        acaoRecomendada: status === 'critico' ? 'Acelerar giro promocional' : (status === 'alerta' ? 'Priorizar saída em rotas' : 'Manter fluxo FEFO padrão')
      };
    });

    payload.validade = {
      dataReferencia: dataRef,
      totalItensMonitorados: itensVal.length,
      itensCriticos: itensVal.filter((i: any) => i.status === 'critico').length,
      itensAlerta: itensVal.filter((i: any) => i.status === 'alerta').length,
      itensNormais: itensVal.filter((i: any) => i.status === 'normal').length,
      itens: itensVal
    };
  }

  // 4. DESVIOS (Quebras, Despejos, Divergências)
  const desviosList: any[] = [];
  if (Array.isArray(state.quebras)) {
    state.quebras.forEach((q: any, i: number) => {
      desviosList.push({
        id: String(q.id || `DESV-Q-${i + 1}`),
        tipo: 'Avaria / Quebra',
        severidade: 'baixa',
        setor: 'Armazém',
        descricao: String(q.motivo || q.descricao || 'Quebra operacional registrada'),
        codigoProduto: Number(q.codigo || 0),
        quantidade: Number(q.quantidade || 0),
        responsavel: String(q.responsavel || 'Equipe de Pátio'),
        status: String(q.status || 'resolvido'),
        acaoImediata: 'Destinado ao Repack',
        registradoEm: q.hora || '06:00'
      });
    });
  }

  if (desviosList.length > 0) {
    payload.desvios = {
      dataReferencia: dataRef,
      totalDesvios: desviosList.length,
      desviosAbertos: desviosList.filter((d: any) => d.status !== 'resolvido').length,
      desviosResolvidos: desviosList.filter((d: any) => d.status === 'resolvido').length,
      desvios: desviosList
    };
  }

  return payload;
}

let debounceTimer: any = null;

/**
 * Dispara sincronização automática com debounce para evitar requisições excessivas
 */
export function triggerAutoSyncFromState(state: any, empresaId?: string, delayMs = 2500) {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    try {
      const payload = formatEmpresaStateToPublicPayload(state, empresaId);
      if (Object.keys(payload).length > 0) {
        syncAllEntitiesToPublic(payload).then((res) => {
          if (res.success) {
            console.log('[SyncClient] Sincronização automática com /public/banco-dados/hoje/ concluída com sucesso:', res.synced);
          }
        }).catch(err => {
          console.warn('[SyncClient] Erro no background auto-sync:', err);
        });
      }
    } catch (e) {
      console.warn('[SyncClient] Falha ao formatar payload para auto-sync:', e);
    }
  }, delayMs);
}

/**
 * Consulta o status operacional do Sync Service no backend
 */
export async function getSyncServiceStatus(): Promise<any> {
  try {
    const res = await fetch('/api/sync/banco-dados/status');
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('[SyncClient] Erro ao consultar status do sync:', err);
    return null;
  }
}

export interface FechamentoDiarioResponse {
  success: boolean;
  dataFechamento: string;
  proximaData: string;
  historicoPath: string;
  entidadesArquivadas: string[];
  entidadesValidadas: string[];
  indicesAtualizados: boolean;
  novoDiaIniciado: boolean;
  firestorePreservado: boolean;
  mensagem: string;
  timestamp: string;
  error?: string;
  detalhes?: any;
}

/**
 * Dispara a rotina de fechamento diário no backend:
 * - hoje/ -> historico/YYYY/MM/DD/
 * - Atualiza os índices e catalogo
 * - Valida os arquivos gerados
 * - Inicializa o novo dia operacional
 * - NÃO apaga dados do Firestore
 */
export async function executarFechamentoDiarioClient(
  dataFechamento?: string,
  proximaData?: string
): Promise<FechamentoDiarioResponse> {
  try {
    const res = await fetch('/api/sync/fechamento-diario', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ dataFechamento, proximaData })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Erro HTTP ${res.status}`);
    }

    return await res.json();
  } catch (error: any) {
    console.error('[SyncClient] Falha ao executar fechamento diário:', error);
    return {
      success: false,
      dataFechamento: dataFechamento || '',
      proximaData: proximaData || '',
      historicoPath: '',
      entidadesArquivadas: [],
      entidadesValidadas: [],
      indicesAtualizados: false,
      novoDiaIniciado: false,
      firestorePreservado: true,
      mensagem: error.message || 'Falha na rotina de fechamento diário',
      timestamp: new Date().toISOString(),
      error: error.message
    };
  }
}

/**
 * Consulta a lista histórica de fechamentos operacionais realizados
 */
export async function getHistoricoFechamentosClient(): Promise<any[]> {
  try {
    const res = await fetch('/api/sync/fechamento-diario/historico');
    if (!res.ok) return [];
    const data = await res.json();
    return data.historico || [];
  } catch (err) {
    console.warn('[SyncClient] Erro ao buscar histórico de fechamentos:', err);
    return [];
  }
}

