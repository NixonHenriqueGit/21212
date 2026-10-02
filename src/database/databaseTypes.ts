/**
 * DATABASE TYPES - Tipos e Interfaces da Nova Camada de Banco de Dados
 * 
 * Define os tipos de abstração de dados, filtros, queries, status de sincronização
 * e configurações do roteador e provedores (JSON / Firestore / Cache / Sync).
 */

export type DatabaseProviderType = 'firestore' | 'json' | 'cache' | 'hybrid';

/**
 * Classificação do tipo de dado para a tomada de decisão do Database Router:
 * - 'historico': JSON -> Cache (Nunca consulta Firestore automaticamente se estiver no JSON)
 * - 'nao-critico': Cache -> JSON -> Firestore somente se necessário
 * - 'realtime': Firestore via listener em tempo real apenas quando estritamente necessário
 * - 'padrao': Cache -> JSON -> Firestore -> Atualizar Cache -> Disponibilizar
 */
export type DataClassification = 'historico' | 'nao-critico' | 'realtime' | 'padrao';

export interface QueryFilter<T = any> {
  field: keyof T | string;
  operator: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'array-contains' | 'in';
  value: any;
}

export interface QueryOptions<T = any> {
  filters?: QueryFilter<T>[];
  orderByField?: keyof T | string;
  orderDirection?: 'asc' | 'desc';
  limitCount?: number;
  useCacheOnly?: boolean;
  forceServer?: boolean;
  ttlMs?: number;
  classification?: DataClassification;
  isHistorico?: boolean;
  isNonCritical?: boolean;
  isRealtime?: boolean;
  allowFirestoreFallback?: boolean;
  // Paginação via Cursores (Cursor-based Pagination)
  startAfterDoc?: any; // DocumentSnapshot do Firestore ou objeto/id do cursor
  startAfterValue?: any; // Valor do campo de ordenação do último item para startAfter()
  pageSize?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  lastVisibleDoc?: any;
  lastVisibleValue?: any;
  hasMore: boolean;
  pageSize: number;
  source?: 'cache-l1' | 'cache-l2' | 'json' | 'firestore';
  totalCount?: number;
}

export interface DatabaseResult<T> {
  data: T;
  source: 'cache-l1' | 'cache-l2' | 'json' | 'firestore';
  cachedAt?: number;
  fromServer: boolean;
  avoidedServerRead?: boolean;
}

export interface SyncStatus {
  lastSync: string;
  inProgress: boolean;
  pendingMutations: number;
  lastError?: string;
}

/**
 * Estrutura formal de item no Cache Local (IndexedDB / Memória)
 */
export interface CacheEntry<T = any> {
  key: string;
  source: 'json' | 'firestore' | 'cache' | 'hybrid' | string;
  createdAt: string;
  updatedAt: string;
  ttl?: number; // TTL em ms quando aplicável
  version: number;
  data: T;
  count?: number;
}

export interface DatabaseMetrics {
  readsAvoided: number;
  actualReads: number;
  cacheHits: number;
  cacheMisses: number;
  costSavedUSD: number;
  costCurrentUSD: number;
  economyPercent: number;
}

// -------------------------------------------------------------
// DOMAIN ENTITY INTERFACES (Domínios Reais do Projeto)
// -------------------------------------------------------------

export interface EstoqueEntity {
  id?: string | number;
  _docId?: string;
  empresaId?: string;
  codigo: number | string;
  descricao: string;
  categoria?: string;
  tipoEmbalagem?: string;
  quantidadeCaixas: number;
  quantidadePaletes?: number;
  localizacao: string;
  lote: string;
  validade: string;
  status: 'disponivel' | 'bloqueado' | 'avaria' | 'quarentena' | string;
  valorUnitario?: number;
  hlUnitario?: number;
  dataISO?: string;
  atualizadoEm?: string;
}

export interface PickingEntity {
  id?: string | number;
  _docId?: string;
  empresaId?: string;
  pedidoId?: string;
  rota?: string;
  operador: string;
  codigo: number | string;
  descricao: string;
  quantidade: number;
  unidade?: string;
  boxOrigem: string;
  docaDestino: string;
  status: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada' | string;
  iniciadoEm?: string | null;
  concluidoEm?: string | null;
  produtividadeCxHora?: number;
  dataCriacao?: string;
  dataISO?: string;
}

export interface PedidosEntity {
  id?: string | number;
  _docId?: string;
  empresaId?: string;
  numeroPedido?: string;
  cliente: string;
  cnpj?: string;
  rota: string;
  motorista?: string;
  placa?: string;
  totalItens: number;
  totalCaixas?: number;
  valorTotal: number;
  hlTotal: number;
  status: 'pendente' | 'em_separacao' | 'faturado' | 'carregado' | 'entregue' | string;
  doca?: string;
  dataPedido?: string;
  dataISO?: string;
  horarioCarga?: string | null;
}

export interface ValidadeEntity {
  id?: string | number;
  _docId?: string;
  empresaId?: string;
  codigo: number | string;
  descricao: string;
  lote: string;
  validade: string;
  diasRestantes: number;
  quantidade: number;
  unidade?: string;
  localizacao: string;
  status: 'normal' | 'alerta' | 'critico' | 'vencido' | string;
  acaoRecomendada?: string;
  dataISO?: string;
}

export interface TemperaturaEntity {
  id?: string | number;
  _docId?: string;
  empresaId?: string;
  area: string;
  sensorId?: string;
  temperaturaAtual: number;
  umidadeRelativa?: number;
  faixaIdealMin: number;
  faixaIdealMax: number;
  unidade?: string;
  status: 'normal' | 'alerta' | 'critico' | string;
  horarioUltimaMedicao: string;
  dataISO?: string;
  registradoEm?: string;
}

export interface DesviosEntity {
  id?: string | number;
  _docId?: string;
  empresaId?: string;
  tipo: 'Avaria / Quebra' | 'Divergência de Contagem' | 'Alerta FEFO / Validade' | 'Temperatura' | string;
  severidade: 'baixa' | 'media' | 'alta' | 'critica';
  setor: string;
  descricao: string;
  codigoProduto?: number | string;
  quantidade?: number;
  responsavel: string;
  status: 'pendente' | 'em_analise' | 'resolvido' | 'cancelado' | string;
  acaoImediata?: string;
  acaoDefinitiva?: string;
  registradoEm: string;
  dataISO?: string;
}

export interface DashboardEntity {
  id?: string | number;
  _docId?: string;
  empresaId?: string;
  dataReferencia: string;
  ultimaAtualizacao: string;
  kpis: {
    ocupacaoArmazemPercentual: number;
    pedidosFaturadosHoje: number;
    pedidosTotalHoje: number;
    produtividadePickingCxHora: number;
    totalVolumeHlExpedido: number;
    totalValorExpedido: number;
    alertasValidadeAtivos: number;
    temperaturaCamaraMedia?: number;
    desviosPendentes: number;
  };
  resumoSetores: Array<{
    setor: string;
    status: string;
    itensCriticos?: number;
  }>;
}
