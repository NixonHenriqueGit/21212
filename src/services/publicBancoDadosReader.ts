/**
 * PUBLIC BANCO DE DADOS - LEITOR SOMENTE-LEITURA (READ-ONLY)
 * 
 * Regra Arquitetural:
 * Os arquivos em `/public/banco-dados/` são estáticos e publicados para LEITURA.
 * O navegador/frontend NUNCA deve tentar gravar ou modificar esses arquivos diretamente.
 * Todas as gravações e atualizações são executadas exclusivamente pelo Sync Service no Backend.
 */

export interface PublicEstoqueHoje {
  dataReferencia: string;
  ultimaAtualizacao: string;
  totalItens: number;
  capacidadeTotalPaletes: number;
  paletesOcupados: number;
  taxaOcupacaoPercentual: number;
  itens: Array<{
    codigo: number;
    descricao: string;
    categoria: string;
    tipoEmbalagem: string;
    quantidadeCaixas: number;
    quantidadePaletes: number;
    localizacao: string;
    lote: string;
    validade: string;
    status: string;
    valorUnitario?: number;
    hlUnitario?: number;
  }>;
}

export interface PublicPickingHoje {
  dataReferencia: string;
  totalTarefas: number;
  tarefasConcluidas: number;
  tarefasEmAndamento: number;
  tarefasPendentes: number;
  produtividadeMediaCxHora: number;
  tarefas: Array<{
    id: string;
    pedidoId: string;
    rota: string;
    operador: string;
    codigo: number;
    descricao: string;
    quantidade: number;
    unidade: string;
    boxOrigem: string;
    docaDestino: string;
    status: string;
    iniciadoEm: string | null;
    concluidoEm: string | null;
  }>;
}

export interface PublicPedidosHoje {
  dataReferencia: string;
  totalPedidos: number;
  pedidosFaturados: number;
  pedidosEmSeparacao: number;
  pedidosCarregados: number;
  valorTotalFaturado: number;
  volumeTotalHl: number;
  pedidos: Array<{
    id: string;
    cliente: string;
    cnpj: string;
    rota: string;
    motorista: string;
    placa: string;
    totalItens: number;
    valorTotal: number;
    hlTotal: number;
    status: string;
    doca: string;
    horarioCarga: string | null;
  }>;
}

export interface PublicValidadeHoje {
  dataReferencia: string;
  totalItensMonitorados: number;
  itensCriticos: number;
  itensAlerta: number;
  itensNormais: number;
  itens: Array<{
    id: string;
    codigo: number;
    descricao: string;
    lote: string;
    validade: string;
    diasRestantes: number;
    quantidade: number;
    unidade: string;
    localizacao: string;
    status: string;
    acaoRecomendada: string;
  }>;
}

export interface PublicTemperaturaHoje {
  dataReferencia: string;
  ultimaLeitura: string;
  statusGeral: string;
  sensores: Array<{
    id: string;
    area: string;
    temperaturaAtual: number;
    umidadeRelativa: number;
    faixaIdealMin: number;
    faixaIdealMax: number;
    unidade: string;
    status: string;
    horarioUltimaMedicao: string;
  }>;
}

export interface PublicDesviosHoje {
  dataReferencia: string;
  totalDesvios: number;
  desviosAbertos: number;
  desviosResolvidos: number;
  desvios: Array<{
    id: string;
    tipo: string;
    severidade: string;
    setor: string;
    descricao: string;
    codigoProduto?: number;
    quantidade?: number;
    responsavel: string;
    status: string;
    acaoImediata: string;
    registradoEm: string;
  }>;
}

export interface PublicDashboardHoje {
  dataReferencia: string;
  ultimaAtualizacao: string;
  kpis: {
    ocupacaoArmazemPercentual: number;
    pedidosFaturadosHoje: number;
    pedidosTotalHoje: number;
    percentualConclusaoPedidos?: number;
    produtividadePickingCxHora: number;
    totalVolumeHlExpedido: number;
    totalValorExpedido: number;
    alertasValidadeAtivos: number;
    temperaturaCamaraMedia?: number;
    statusDPO5S?: string;
    desviosPendentes: number;
  };
  resumoSetores: Array<{
    setor: string;
    status: string;
    itensCriticos?: number;
  }>;
}

export interface EntityIndexFile {
  entidade: string;
  ultimaAtualizacao: string;
  registrosDisponiveis: Array<{
    data: string;
    caminho: string;
    totalItens?: number;
    [key: string]: any;
  }>;
  atalhoHoje: string;
}

export interface MasterIndexFile {
  versao: string;
  descricao: string;
  ultimaAtualizacao?: string;
  indiceMestreEntidades?: string;
  indices: Array<{
    entidade: string;
    arquivo: string;
    tipo?: string;
  }>;
}

export interface EntityPartitionIndex {
  version: number;
  generatedAt: string;
  descricao?: string;
  entities: {
    [entityName: string]: {
      [id: string]: string; // Mapeia ID -> Caminho particionado (ex: "12345": "/banco-dados/historico/2026/08/15/estoque.json")
    };
  };
}

/**
 * Função utilitária genérica para ler JSON de forma segura com cache-busting opcional
 */
async function fetchPublicJson<T>(url: string, bypassCache = false): Promise<T | null> {
  try {
    const finalUrl = bypassCache ? `${url}?_t=${Date.now()}` : url;
    const res = await fetch(finalUrl);
    if (!res.ok) {
      console.warn(`[PublicReader] Falha ao carregar ${url}: status ${res.status}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.error(`[PublicReader] Erro na leitura de ${url}:`, err);
    return null;
  }
}

// MÉTODOS DE LEITURA DO DIRETÓRIO HOJE (/public/banco-dados/hoje/)

export const PublicBancoDadosReader = {
  getEstoqueHoje: (bypassCache = false) =>
    fetchPublicJson<PublicEstoqueHoje>('/banco-dados/hoje/estoque.json', bypassCache),

  getPickingHoje: (bypassCache = false) =>
    fetchPublicJson<PublicPickingHoje>('/banco-dados/hoje/picking.json', bypassCache),

  getPedidosHoje: (bypassCache = false) =>
    fetchPublicJson<PublicPedidosHoje>('/banco-dados/hoje/pedidos.json', bypassCache),

  getValidadeHoje: (bypassCache = false) =>
    fetchPublicJson<PublicValidadeHoje>('/banco-dados/hoje/validade.json', bypassCache),

  getTemperaturaHoje: (bypassCache = false) =>
    fetchPublicJson<PublicTemperaturaHoje>('/banco-dados/hoje/temperatura.json', bypassCache),

  getDesviosHoje: (bypassCache = false) =>
    fetchPublicJson<PublicDesviosHoje>('/banco-dados/hoje/desvios.json', bypassCache),

  getDashboardHoje: (bypassCache = false) =>
    fetchPublicJson<PublicDashboardHoje>('/banco-dados/hoje/dashboard.json', bypassCache),

  // MÉTODOS DE LEITURA DE ÍNDICES (/public/banco-dados/indices/)

  getMasterIndex: (bypassCache = false) =>
    fetchPublicJson<MasterIndexFile>('/banco-dados/indices/index.json', bypassCache),

  getEntityIndex: (entityName: string, bypassCache = false) =>
    fetchPublicJson<EntityIndexFile>(`/banco-dados/indices/${entityName}_index.json`, bypassCache),

  /**
   * Obtém o índice de particionamento direto por ID de entidades
   */
  getEntityPartitionIndex: (bypassCache = false) =>
    fetchPublicJson<EntityPartitionIndex>('/banco-dados/indices/index_entities.json', bypassCache),

  /**
   * Localiza o caminho de um registro específico através do índice
   */
  findPartitionPathForRecord: async (entityName: string, id: string | number): Promise<string | null> => {
    const partitionIndex = await PublicBancoDadosReader.getEntityPartitionIndex();
    if (!partitionIndex || !partitionIndex.entities) return null;

    // Normaliza nome da entidade
    const cleanEntity = entityName.toLowerCase();
    const entityGroup = partitionIndex.entities[cleanEntity] ||
      (cleanEntity === 'armazem' ? partitionIndex.entities['estoque'] : undefined) ||
      (cleanEntity === 'tarefas' ? partitionIndex.entities['picking'] : undefined) ||
      (cleanEntity === 'validades' ? partitionIndex.entities['validade'] : undefined) ||
      (cleanEntity === 'quebras' ? partitionIndex.entities['desvios'] : undefined);

    if (!entityGroup) return null;
    return entityGroup[String(id)] || null;
  },

  /**
   * Lê um arquivo particionado qualquer
   */
  fetchPartitionFile: <T = any>(filePath: string, bypassCache = false) =>
    fetchPublicJson<T>(filePath, bypassCache),

  // MÉTODOS DE LEITURA DE HISTÓRICO (/public/banco-dados/historico/YYYY/MM/DD/)

  getHistorico: <T = any>(year: string | number, month: string | number, day: string | number, entityName: string) => {
    const y = String(year);
    const m = String(month).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return fetchPublicJson<T>(`/banco-dados/historico/${y}/${m}/${d}/${entityName}.json`);
  }
};
