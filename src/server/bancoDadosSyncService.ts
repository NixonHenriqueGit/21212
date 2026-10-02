import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';

export interface BancoDadosHojePayload {
  estoque?: any;
  picking?: any;
  pedidos?: any;
  validade?: any;
  temperatura?: any;
  desvios?: any;
  quebras?: any;
  dashboard?: any;
}

export interface FechamentoDiarioResult {
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
  detalhes?: any;
}

const BANCO_DADOS_ROOT = path.join(process.cwd(), 'public', 'banco-dados');
const HOJE_DIR = path.join(BANCO_DADOS_ROOT, 'hoje');
const HISTORICO_DIR = path.join(BANCO_DADOS_ROOT, 'historico');
const INDICES_DIR = path.join(BANCO_DADOS_ROOT, 'indices');
const FECHAMENTOS_LOG_PATH = path.join(HISTORICO_DIR, 'fechamentos_log.json');

let lastSyncTimestamp: string = new Date().toISOString();
let syncCount = 0;

/**
 * Garante que os diretórios necessários existam no disco
 */
export async function ensureBancoDadosDirs(): Promise<void> {
  try {
    await fs.mkdir(BANCO_DADOS_ROOT, { recursive: true });
    await fs.mkdir(HOJE_DIR, { recursive: true });
    await fs.mkdir(HISTORICO_DIR, { recursive: true });
    await fs.mkdir(INDICES_DIR, { recursive: true });
  } catch (err) {
    console.error('[SyncService] Erro ao criar diretórios:', err);
  }
}

/**
 * Obtém a data corrente formatada em YYYY, MM, DD e YYYY-MM-DD
 */
function getDateParts(targetDate?: Date | string) {
  let d: Date;
  if (typeof targetDate === 'string') {
    const [y, m, dayNum] = targetDate.split('-').map(Number);
    d = new Date(y, (m || 1) - 1, dayNum || 1);
  } else {
    d = targetDate || new Date();
  }

  const year = String(d.getFullYear());
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const isoDate = `${year}-${month}-${day}`;
  return { year, month, day, isoDate };
}

/**
 * Calcula a próxima data no formato YYYY-MM-DD
 */
function getNextDay(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const next = new Date(y, m - 1, d + 1);
  const nextYear = String(next.getFullYear());
  const nextMonth = String(next.getMonth() + 1).padStart(2, '0');
  const nextDay = String(next.getDate()).padStart(2, '0');
  return `${nextYear}-${nextMonth}-${nextDay}`;
}

/**
 * Atualiza um arquivo JSON de entidade em /public/banco-dados/hoje/
 * e propaga a snapshot diária para /public/banco-dados/historico/YYYY/MM/DD/
 * além de atualizar os índices.
 */
export async function syncEntity(entityName: string, data: any): Promise<boolean> {
  try {
    await ensureBancoDadosDirs();
    const { year, month, day, isoDate } = getDateParts();

    // 1. Salvar no diretório /public/banco-dados/hoje/
    const hojeFilePath = path.join(HOJE_DIR, `${entityName}.json`);
    const payloadWithMeta = {
      ...data,
      dataReferencia: data.dataReferencia || isoDate,
      ultimaAtualizacao: new Date().toISOString()
    };
    await fs.writeFile(hojeFilePath, JSON.stringify(payloadWithMeta, null, 2), 'utf-8');

    // 2. Salvar snapshot diária no histórico /public/banco-dados/historico/YYYY/MM/DD/
    const historicoDayDir = path.join(HISTORICO_DIR, year, month, day);
    await fs.mkdir(historicoDayDir, { recursive: true });
    const historicoFilePath = path.join(historicoDayDir, `${entityName}.json`);
    await fs.writeFile(historicoFilePath, JSON.stringify(payloadWithMeta, null, 2), 'utf-8');

    // 3. Atualizar o índice da entidade em /public/banco-dados/indices/
    await updateEntityIndex(entityName, isoDate, `/banco-dados/historico/${year}/${month}/${day}/${entityName}.json`, payloadWithMeta);

    lastSyncTimestamp = new Date().toISOString();
    syncCount++;
    return true;
  } catch (err) {
    console.error(`[SyncService] Falha ao sincronizar entidade ${entityName}:`, err);
    return false;
  }
}

/**
 * Atualiza o arquivo de índice para a entidade informada
 */
async function updateEntityIndex(
  entityName: string,
  dataStr: string,
  historicoPath: string,
  dataContent: any
): Promise<void> {
  const indexFilePath = path.join(INDICES_DIR, `${entityName}_index.json`);
  let indexData: any = {
    entidade: entityName,
    ultimaAtualizacao: new Date().toISOString(),
    registrosDisponiveis: [],
    atalhoHoje: `/banco-dados/hoje/${entityName}.json`
  };

  if (existsSync(indexFilePath)) {
    try {
      const raw = await fs.readFile(indexFilePath, 'utf-8');
      indexData = JSON.parse(raw);
    } catch (e) {
      console.warn(`[SyncService] Recriando índice para ${entityName}`);
    }
  }

  indexData.ultimaAtualizacao = new Date().toISOString();
  indexData.atalhoHoje = `/banco-dados/hoje/${entityName}.json`;

  if (!Array.isArray(indexData.registrosDisponiveis)) {
    indexData.registrosDisponiveis = [];
  }

  // Verificar se já existe registro para a data informada
  const existingIdx = indexData.registrosDisponiveis.findIndex((r: any) => r.data === dataStr);
  const recordEntry: any = {
    data: dataStr,
    caminho: historicoPath,
    totalItens: dataContent.totalItens || dataContent.totalTarefas || dataContent.totalPedidos || (Array.isArray(dataContent.itens) ? dataContent.itens.length : undefined)
  };

  if (existingIdx >= 0) {
    indexData.registrosDisponiveis[existingIdx] = { ...indexData.registrosDisponiveis[existingIdx], ...recordEntry };
  } else {
    indexData.registrosDisponiveis.unshift(recordEntry);
  }

  await fs.writeFile(indexFilePath, JSON.stringify(indexData, null, 2), 'utf-8');

  // Atualizar índice geral
  await updateMasterIndex();
}

/**
 * Atualiza o catálogo geral em /public/banco-dados/indices/index.json
 */
async function updateMasterIndex(): Promise<void> {
  const masterIndexPath = path.join(INDICES_DIR, 'index.json');
  const entities = ['estoque', 'picking', 'pedidos', 'validade', 'temperatura', 'desvios', 'dashboard', 'quebras'];
  
  const masterIndex = {
    versao: '1.0.0',
    descricao: 'Catálogo de todos os índices estruturados do banco de dados',
    indiceMestreEntidades: '/banco-dados/indices/index_entities.json',
    ultimaAtualizacao: new Date().toISOString(),
    indices: [
      {
        entidade: 'todas',
        tipo: 'particionamento_por_id',
        arquivo: '/banco-dados/indices/index_entities.json'
      },
      ...entities.map(e => ({
        entidade: e,
        arquivo: `/banco-dados/indices/${e}_index.json`
      }))
    ]
  };

  await fs.writeFile(masterIndexPath, JSON.stringify(masterIndex, null, 2), 'utf-8');
}

/**
 * Atualiza o mapeamento de entidades/IDs particionados em /public/banco-dados/indices/index_entities.json
 */
async function updateEntityPartitionIndex(
  entityName: string,
  historicoFilePath: string,
  dataContent: any
): Promise<void> {
  const partitionIndexPath = path.join(INDICES_DIR, 'index_entities.json');
  let partitionData: any = {
    version: 1,
    generatedAt: new Date().toISOString(),
    descricao: 'Índice de particionamento e localização direta de registros por entidade e identificador',
    entities: {}
  };

  if (existsSync(partitionIndexPath)) {
    try {
      const raw = await fs.readFile(partitionIndexPath, 'utf-8');
      partitionData = JSON.parse(raw);
    } catch (e) {}
  }

  if (!partitionData.entities) partitionData.entities = {};
  if (!partitionData.entities[entityName]) partitionData.entities[entityName] = {};

  const items = Array.isArray(dataContent)
    ? dataContent
    : (dataContent.itens || dataContent.tarefas || dataContent.pedidos || dataContent.sensores || dataContent.desvios || []);

  for (const item of items) {
    const id = item.id || item.codigo || item.pedidoId;
    if (id !== undefined && id !== null) {
      partitionData.entities[entityName][String(id)] = historicoFilePath;
    }
  }

  partitionData.generatedAt = new Date().toISOString();
  await fs.writeFile(partitionIndexPath, JSON.stringify(partitionData, null, 2), 'utf-8');
  
  // Também garante a cópia no root /public/banco-dados/index_entities.json
  const rootPartitionPath = path.join(BANCO_DADOS_ROOT, 'index_entities.json');
  await fs.writeFile(rootPartitionPath, JSON.stringify(partitionData, null, 2), 'utf-8');
}

/**
 * Sincroniza todas as entidades a partir de um payload unificado
 */
export async function syncAllBancoDados(payload: BancoDadosHojePayload): Promise<{ success: boolean; synced: string[] }> {
  await ensureBancoDadosDirs();
  const synced: string[] = [];

  const entities = Object.keys(payload) as (keyof BancoDadosHojePayload)[];
  for (const entity of entities) {
    if (payload[entity]) {
      const ok = await syncEntity(entity, payload[entity]);
      if (ok) synced.push(entity);
    }
  }

  // Gera dashboard consolidado se não foi enviado explicitamente
  if (!payload.dashboard && synced.length > 0) {
    const autoDashboard = generateConsolidatedDashboard(payload);
    await syncEntity('dashboard', autoDashboard);
    synced.push('dashboard');
  }

  return { success: synced.length > 0, synced };
}

function generateConsolidatedDashboard(payload: BancoDadosHojePayload): any {
  const { isoDate } = getDateParts();
  return {
    dataReferencia: isoDate,
    ultimaAtualizacao: new Date().toISOString(),
    kpis: {
      ocupacaoArmazemPercentual: payload.estoque?.taxaOcupacaoPercentual || 84.88,
      pedidosFaturadosHoje: payload.pedidos?.pedidosFaturados || 0,
      pedidosTotalHoje: payload.pedidos?.totalPedidos || 0,
      produtividadePickingCxHora: payload.picking?.produtividadeMediaCxHora || 0,
      totalVolumeHlExpedido: payload.pedidos?.volumeTotalHl || 0,
      totalValorExpedido: payload.pedidos?.valorTotalFaturado || 0,
      alertasValidadeAtivos: payload.validade?.itensCriticos || 0,
      desviosPendentes: payload.desvios?.desviosAbertos || 0
    },
    resumoSetores: [
      { setor: 'Armazém / Estoque', status: 'operacional' },
      { setor: 'Picking & Expedição', status: 'operacional' },
      { setor: 'Controle FEFO / Validades', status: (payload.validade?.itensCriticos > 0 ? 'atencao' : 'operacional') },
      { setor: 'Qualidade & Desvios', status: (payload.desvios?.desviosAbertos > 0 ? 'atencao' : 'operacional') }
    ]
  };
}

/**
 * ============================================================================
 * ROTINA DE FECHAMENTO DIÁRIO (MUDANÇA DE DATA OPERACIONAL)
 * ============================================================================
 * 
 * Executa o fechamento completo do dia operacional:
 * 1. hoje/ -> historico/YYYY/MM/DD/ (Ex: hoje/ -> historico/2026/08/15/)
 * 2. Consolida os dados do dia de encerramento;
 * 3. Gera os arquivos JSON históricos;
 * 4. Atualiza os índices de particionamento e catálogo;
 * 5. Valida os arquivos gerados (integridade estrutural);
 * 6. Inicia o novo dia (ex: hoje/ passa a representar 2026-08-16);
 * 7. NÃO apaga dados do Firestore (histórico JSON é projeção de leitura).
 */
export async function executarFechamentoDiario(
  dataFechamentoParam?: string,
  proximaDataParam?: string
): Promise<FechamentoDiarioResult> {
  await ensureBancoDadosDirs();
  const entities = ['estoque', 'picking', 'pedidos', 'validade', 'temperatura', 'desvios', 'dashboard', 'quebras'];
  
  // 1. Determina as datas de fechamento e o novo dia operacional
  let dataFechamento = dataFechamentoParam;
  if (!dataFechamento) {
    try {
      const dashRaw = await fs.readFile(path.join(HOJE_DIR, 'dashboard.json'), 'utf-8');
      const dash = JSON.parse(dashRaw);
      dataFechamento = dash.dataReferencia || dash.data || getDateParts().isoDate;
    } catch (e) {
      dataFechamento = getDateParts().isoDate;
    }
  }

  const proximaData = proximaDataParam || getNextDay(dataFechamento);
  const { year, month, day } = getDateParts(dataFechamento);
  const historicoDayDir = path.join(HISTORICO_DIR, year, month, day);
  const historicoRelPath = `/banco-dados/historico/${year}/${month}/${day}/`;

  await fs.mkdir(historicoDayDir, { recursive: true });

  const entidadesArquivadas: string[] = [];
  const entidadesValidadas: string[] = [];
  const fechamentoTimestamp = new Date().toISOString();

  // 2. Lê, consolida e arquiva cada entidade de hoje/ para historico/YYYY/MM/DD/
  for (const entity of entities) {
    const hojeFilePath = path.join(HOJE_DIR, `${entity}.json`);
    let entityData: any = {};

    if (existsSync(hojeFilePath)) {
      try {
        const raw = await fs.readFile(hojeFilePath, 'utf-8');
        entityData = JSON.parse(raw);
      } catch (e) {
        console.warn(`[Fechamento] Aviso ao ler ${entity}.json de hoje/:`, e);
      }
    }

    // Consolidação com metadados oficiais de fechamento
    const consolidatedData = {
      ...entityData,
      dataReferencia: dataFechamento,
      fechamento: true,
      statusFechamento: 'consolidado',
      fechamentoEm: fechamentoTimestamp,
      ultimaAtualizacao: fechamentoTimestamp
    };

    // Grava no histórico
    const histFilePath = path.join(historicoDayDir, `${entity}.json`);
    await fs.writeFile(histFilePath, JSON.stringify(consolidatedData, null, 2), 'utf-8');
    entidadesArquivadas.push(entity);

    // Validação imediata de integridade no disco
    try {
      const checkRaw = await fs.readFile(histFilePath, 'utf-8');
      const parsed = JSON.parse(checkRaw);
      if (parsed && typeof parsed === 'object') {
        entidadesValidadas.push(entity);
      }
    } catch (valErr) {
      console.error(`[Fechamento] Erro na validação de ${entity} no histórico:`, valErr);
    }

    // Atualiza o índice da entidade
    const histFilePublicUrl = `/banco-dados/historico/${year}/${month}/${day}/${entity}.json`;
    await updateEntityIndex(entity, dataFechamento, histFilePublicUrl, consolidatedData);

    // Atualiza o índice de particionamento direto
    await updateEntityPartitionIndex(entity, histFilePublicUrl, consolidatedData);
  }

  // 3. Atualiza índices mestre
  await updateMasterIndex();

  // 4. Inicia o novo dia operacional em /public/banco-dados/hoje/
  // Cria novo estado do dia com estoques carregados e transações diárias renovadas
  await inicializarNovoDiaOperacional(proximaData);

  // 5. Registra log de fechamento diário (Audit Trail)
  let fechamentosLog: any[] = [];
  if (existsSync(FECHAMENTOS_LOG_PATH)) {
    try {
      const rawLog = await fs.readFile(FECHAMENTOS_LOG_PATH, 'utf-8');
      fechamentosLog = JSON.parse(rawLog);
    } catch (e) {}
  }

  const logEntry = {
    id: `FECH-${Date.now()}`,
    dataFechamento,
    proximaData,
    historicoPath: historicoRelPath,
    entidadesArquivadas,
    entidadesValidadas,
    firestorePreservado: true,
    executadoEm: fechamentoTimestamp,
    status: 'sucesso'
  };

  fechamentosLog.unshift(logEntry);
  if (fechamentosLog.length > 60) fechamentosLog = fechamentosLog.slice(0, 60);
  await fs.writeFile(FECHAMENTOS_LOG_PATH, JSON.stringify(fechamentosLog, null, 2), 'utf-8');

  lastSyncTimestamp = fechamentoTimestamp;
  syncCount++;

  return {
    success: true,
    dataFechamento,
    proximaData,
    historicoPath: historicoRelPath,
    entidadesArquivadas,
    entidadesValidadas,
    indicesAtualizados: true,
    novoDiaIniciado: true,
    firestorePreservado: true,
    mensagem: `Fechamento do dia ${dataFechamento} concluído com sucesso. Novo dia operacional ${proximaData} inicializado.`,
    timestamp: fechamentoTimestamp,
    detalhes: logEntry
  };
}

/**
 * Inicializa a pasta /public/banco-dados/hoje/ para a nova data operacional
 */
async function inicializarNovoDiaOperacional(proximaData: string): Promise<void> {
  const now = new Date().toISOString();

  // 1. ESTOQUE: Mantém a continuidade física do armazém atualizando a data de referência
  const estoquePath = path.join(HOJE_DIR, 'estoque.json');
  let estoqueData: any = {
    dataReferencia: proximaData,
    fechamento: false,
    capacidadeTotalPaletes: 4500,
    paletesOcupados: 3820,
    taxaOcupacaoPercentual: 84.88,
    totalItens: 4,
    totalCaixasEstoque: 3675,
    ultimaAtualizacao: now,
    itens: []
  };

  if (existsSync(estoquePath)) {
    try {
      const raw = await fs.readFile(estoquePath, 'utf-8');
      const prev = JSON.parse(raw);
      estoqueData = {
        ...prev,
        dataReferencia: proximaData,
        fechamento: false,
        statusFechamento: undefined,
        fechamentoEm: undefined,
        ultimaAtualizacao: now
      };
    } catch (e) {}
  }
  await fs.writeFile(estoquePath, JSON.stringify(estoqueData, null, 2), 'utf-8');

  // 2. PICKING: Inicia nova jornada diária
  const pickingPath = path.join(HOJE_DIR, 'picking.json');
  const pickingNovoDia = {
    dataReferencia: proximaData,
    fechamento: false,
    totalTarefas: 6,
    tarefasConcluidas: 0,
    tarefasEmAndamento: 2,
    tarefasPendentes: 4,
    produtividadeMediaCxHora: 155.0,
    ultimaAtualizacao: now,
    tarefas: [
      {
        id: "PCK-101",
        pedidoId: "PED-901",
        rota: "ROTA-01 CENTRO",
        operador: "Carlos Silva",
        codigo: 2101,
        descricao: "BRAHMA CHOPP 350ML CX24",
        quantidade: 120,
        unidade: "CX",
        boxOrigem: "BOX-A01",
        docaDestino: "DOCA-1",
        status: "em_andamento",
        iniciadoEm: "06:15:00",
        concluidoEm: null
      },
      {
        id: "PCK-102",
        pedidoId: "PED-902",
        rota: "ROTA-02 SUL",
        operador: "Marcos Lima",
        codigo: 2102,
        descricao: "SKOL LAGER 350ML CX24",
        quantidade: 80,
        unidade: "CX",
        boxOrigem: "BOX-A04",
        docaDestino: "DOCA-2",
        status: "em_andamento",
        iniciadoEm: "06:20:00",
        concluidoEm: null
      },
      {
        id: "PCK-103",
        pedidoId: "PED-903",
        rota: "ROTA-03 NORTE",
        operador: "Carlos Silva",
        codigo: 2103,
        descricao: "STELLA ARTOIS 330ML CX24 LN",
        quantidade: 45,
        unidade: "CX",
        boxOrigem: "BOX-B02",
        docaDestino: "DOCA-3",
        status: "pendente",
        iniciadoEm: null,
        concluidoEm: null
      },
      {
        id: "PCK-104",
        pedidoId: "PED-904",
        rota: "ROTA-04 LESTE",
        operador: "Roberto Santos",
        codigo: 2104,
        descricao: "CORONA EXTRA 330ML CX24",
        quantidade: 60,
        unidade: "CX",
        boxOrigem: "BOX-B05",
        docaDestino: "DOCA-4",
        status: "pendente",
        iniciadoEm: null,
        concluidoEm: null
      },
      {
        id: "PCK-105",
        pedidoId: "PED-905",
        rota: "ROTA-05 OESTE",
        operador: "Marcos Lima",
        codigo: 2105,
        descricao: "SPATEN 350ML CX24",
        quantidade: 150,
        unidade: "CX",
        boxOrigem: "BOX-A08",
        docaDestino: "DOCA-5",
        status: "pendente",
        iniciadoEm: null,
        concluidoEm: null
      },
      {
        id: "PCK-106",
        pedidoId: "PED-906",
        rota: "ROTA-01 CENTRO",
        operador: "Roberto Santos",
        codigo: 2106,
        descricao: "BUDWEISER 330ML CX24 LN",
        quantidade: 90,
        unidade: "CX",
        boxOrigem: "BOX-B01",
        docaDestino: "DOCA-1",
        status: "pendente",
        iniciadoEm: null,
        concluidoEm: null
      }
    ]
  };
  await fs.writeFile(pickingPath, JSON.stringify(pickingNovoDia, null, 2), 'utf-8');

  // 3. PEDIDOS: Novos pedidos de expedição do dia
  const pedidosPath = path.join(HOJE_DIR, 'pedidos.json');
  const pedidosNovoDia = {
    dataReferencia: proximaData,
    fechamento: false,
    totalPedidos: 6,
    pedidosFaturados: 2,
    pedidosCarregados: 0,
    pedidosPendentes: 4,
    volumeTotalHl: 418.5,
    valorTotalFaturado: 387450.0,
    ultimaAtualizacao: now,
    pedidos: [
      {
        id: "PED-901",
        cliente: "SUPERMERCADO CENTRAL GUARA",
        rota: "ROTA-01 CENTRO",
        motorista: "João Ferreira",
        veiculo: "CAM-01 (VOLVO)",
        caixasTotal: 650,
        hlTotal: 54.6,
        status: "faturado",
        doca: "DOCA-1",
        horarioCarga: "07:30"
      },
      {
        id: "PED-902",
        cliente: "DISTRIBUIDORA VALE DO MAMANGUAPE",
        rota: "ROTA-02 SUL",
        motorista: "Antonio Silva",
        veiculo: "CAM-02 (MERCEDES)",
        caixasTotal: 980,
        hlTotal: 82.32,
        status: "faturado",
        doca: "DOCA-2",
        horarioCarga: "08:15"
      },
      {
        id: "PED-903",
        cliente: "ATACADÃO DA BEBIDA SERTÃO",
        rota: "ROTA-03 NORTE",
        motorista: "Lucas Medeiros",
        veiculo: "CAM-03 (SCANIA)",
        caixasTotal: 1200,
        hlTotal: 100.8,
        status: "em_separacao",
        doca: "DOCA-3",
        horarioCarga: "09:00"
      },
      {
        id: "PED-904",
        cliente: "REDE CONVENIÊNCIA LITORAL",
        rota: "ROTA-04 LESTE",
        motorista: "Paulo Ricardo",
        veiculo: "CAM-04 (IVECO)",
        caixasTotal: 420,
        hlTotal: 34.44,
        status: "pendente",
        doca: "DOCA-4",
        horarioCarga: "10:00"
      },
      {
        id: "PED-905",
        cliente: "BEBIDAS & CIA AGRESTE",
        rota: "ROTA-05 OESTE",
        motorista: "Marcelo Rocha",
        veiculo: "CAM-05 (VOLVO)",
        caixasTotal: 890,
        hlTotal: 74.76,
        status: "pendente",
        doca: "DOCA-5",
        horarioCarga: "10:45"
      },
      {
        id: "PED-906",
        cliente: "POSTO & CONVENIENCIA ALVORADA",
        rota: "ROTA-01 CENTRO",
        motorista: "João Ferreira",
        veiculo: "CAM-01 (VOLVO)",
        caixasTotal: 850,
        hlTotal: 71.58,
        status: "pendente",
        doca: "DOCA-1",
        horarioCarga: "11:30"
      }
    ]
  };
  await fs.writeFile(pedidosPath, JSON.stringify(pedidosNovoDia, null, 2), 'utf-8');

  // 4. VALIDADES: FEFO para a nova data
  const validadePath = path.join(HOJE_DIR, 'validade.json');
  let validadeData: any = {
    dataReferencia: proximaData,
    fechamento: false,
    totalItensMonitorados: 3,
    itensCriticos: 1,
    itensAlerta: 1,
    itensNormais: 1,
    ultimaAtualizacao: now,
    itens: [
      {
        id: "VAL-01",
        codigo: 2104,
        descricao: "CORONA EXTRA 330ML CX24",
        lote: "L260620-03",
        validade: "2026-12-15",
        diasRestantes: 119,
        quantidade: 340,
        unidade: "CX",
        localizacao: "RUA-B-05-N1",
        status: "alerta",
        acaoRecomendada: "Priorizar montagem nas rotas matinais"
      },
      {
        id: "VAL-02",
        codigo: 2101,
        descricao: "BRAHMA CHOPP 350ML CX24",
        lote: "L260810-01",
        validade: "2027-02-15",
        diasRestantes: 181,
        quantidade: 450,
        unidade: "CX",
        localizacao: "RUA-A-01-N1",
        status: "normal",
        acaoRecomendada: "Seguir expedição padrão FEFO"
      },
      {
        id: "VAL-03",
        codigo: 2103,
        descricao: "STELLA ARTOIS 330ML CX24 LN",
        lote: "L260718-04",
        validade: "2027-01-20",
        diasRestantes: 155,
        quantidade: 280,
        unidade: "CX",
        localizacao: "RUA-B-04-N2",
        status: "normal",
        acaoRecomendada: "Seguir expedição padrão FEFO"
      }
    ]
  };
  await fs.writeFile(validadePath, JSON.stringify(validadeData, null, 2), 'utf-8');

  // 5. TEMPERATURA
  const tempPath = path.join(HOJE_DIR, 'temperatura.json');
  const tempData = {
    dataReferencia: proximaData,
    fechamento: false,
    ultimaAtualizacao: now,
    sensores: [
      {
        id: "TEMP-01",
        local: "Câmara Fria 01 (Chopp & Especiais)",
        temperaturaAtualC: 2.1,
        temperaturaMinC: 0.0,
        temperaturaMaxC: 4.0,
        umidadeRelativaPct: 78,
        status: "ideal",
        ultimaLeitura: "06:30:00"
      },
      {
        id: "TEMP-02",
        local: "Câmara Fria 02 (Bebidas Especiais e Vinhos)",
        temperaturaAtualC: 1.8,
        temperaturaMinC: 0.0,
        temperaturaMaxC: 4.0,
        umidadeRelativaPct: 81,
        status: "ideal",
        ultimaLeitura: "06:30:00"
      },
      {
        id: "TEMP-03",
        local: "Galpão Principal de Armazenagem",
        temperaturaAtualC: 23.5,
        temperaturaMinC: 15.0,
        temperaturaMaxC: 28.0,
        umidadeRelativaPct: 65,
        status: "ideal",
        ultimaLeitura: "06:30:00"
      }
    ]
  };
  await fs.writeFile(tempPath, JSON.stringify(tempData, null, 2), 'utf-8');

  // 6. DESVIOS: Novo registro limpo do dia
  const desviosPath = path.join(HOJE_DIR, 'desvios.json');
  const desviosData = {
    dataReferencia: proximaData,
    fechamento: false,
    totalDesvios: 0,
    desviosAbertos: 0,
    desviosResolvidos: 0,
    ultimaAtualizacao: now,
    desvios: []
  };
  await fs.writeFile(desviosPath, JSON.stringify(desviosData, null, 2), 'utf-8');

  // 7. DASHBOARD: Painel consolidado novo dia
  const dashPath = path.join(HOJE_DIR, 'dashboard.json');
  const dashboardNovoDia = {
    dataReferencia: proximaData,
    fechamento: false,
    ultimaAtualizacao: now,
    kpis: {
      ocupacaoArmazemPercentual: 84.88,
      pedidosFaturadosHoje: 2,
      pedidosTotalHoje: 6,
      produtividadePickingCxHora: 155.0,
      totalVolumeHlExpedido: 136.92,
      totalValorExpedido: 125890.0,
      alertasValidadeAtivos: 1,
      desviosPendentes: 0
    },
    resumoSetores: [
      { setor: 'Armazém / Estoque', status: 'operacional' },
      { setor: 'Picking & Expedição', status: 'operacional' },
      { setor: 'Controle FEFO / Validades', status: 'atencao' },
      { setor: 'Qualidade & Desvios', status: 'operacional' }
    ]
  };
  await fs.writeFile(dashPath, JSON.stringify(dashboardNovoDia, null, 2), 'utf-8');
}

/**
 * Retorna o histórico de fechamentos realizados
 */
export async function getHistoricoFechamentos(): Promise<any[]> {
  if (!existsSync(FECHAMENTOS_LOG_PATH)) return [];
  try {
    const raw = await fs.readFile(FECHAMENTOS_LOG_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export interface IndicadoresMaterializados {
  totalEstoque: number;
  totalSKUs: number;
  vencendo7Dias: number;
  vencendo30Dias: number;
  semGiro: number;
  taxaOcupacaoPercentual: number;
  paletesOcupados: number;
  capacidadeTotalPaletes: number;
  pedidosFaturadosHoje: number;
  pedidosTotalHoje: number;
  produtividadePickingCxHora: number;
  totalVolumeHlExpedido: number;
  totalValorExpedido: number;
  alertasValidadeAtivos: number;
  desviosPendentes: number;
  perdasHoje: {
    totalQuebras: number;
    totalDespejo: number;
    totalRepack: number;
  };
  resumoSetores: Array<{ setor: string; status: string; detalhe?: string }>;
  ultimaAtualizacao: string;
  dataReferencia: string;
  materializado: boolean;
  tempoProcessamentoMs: number;
}

/**
 * Materializa e consolida todos os indicadores de dashboard em um único documento agregado.
 * O dashboard do frontend consome este JSON em 1 leitura rápida, evitando transferir milhares de linhas.
 */
export async function materializarIndicadoresDashboard(dataReferenciaParam?: string): Promise<IndicadoresMaterializados> {
  const startTime = Date.now();
  await ensureBancoDadosDirs();

  const { isoDate } = getDateParts(dataReferenciaParam);
  const dataReferencia = dataReferenciaParam || isoDate;

  // 1. Tentar ler os arquivos existentes em hoje/ para agregar
  let estoqueRaw: any = null;
  let validadeRaw: any = null;
  let pickingRaw: any = null;
  let pedidosRaw: any = null;
  let desviosRaw: any = null;

  try {
    const r = await fs.readFile(path.join(HOJE_DIR, 'estoque.json'), 'utf-8');
    estoqueRaw = JSON.parse(r);
  } catch (e) {}

  try {
    const r = await fs.readFile(path.join(HOJE_DIR, 'validade.json'), 'utf-8');
    validadeRaw = JSON.parse(r);
  } catch (e) {}

  try {
    const r = await fs.readFile(path.join(HOJE_DIR, 'picking.json'), 'utf-8');
    pickingRaw = JSON.parse(r);
  } catch (e) {}

  try {
    const r = await fs.readFile(path.join(HOJE_DIR, 'pedidos.json'), 'utf-8');
    pedidosRaw = JSON.parse(r);
  } catch (e) {}

  try {
    const r = await fs.readFile(path.join(HOJE_DIR, 'desvios.json'), 'utf-8');
    desviosRaw = JSON.parse(r);
  } catch (e) {}

  // 2. Extrair métricas agregadas
  const totalEstoque = estoqueRaw?.totalCaixasEstoque || 123456;
  const totalSKUs = estoqueRaw?.totalItens || estoqueRaw?.totalSKUs || 18342;
  const paletesOcupados = estoqueRaw?.paletesOcupados || 3820;
  const capacidadeTotalPaletes = estoqueRaw?.capacidadeTotalPaletes || 4500;
  const taxaOcupacaoPercentual = estoqueRaw?.taxaOcupacaoPercentual || 
    Number(((paletesOcupados / (capacidadeTotalPaletes || 1)) * 100).toFixed(2));

  const vencendo7Dias = validadeRaw?.itensCriticos !== undefined ? validadeRaw.itensCriticos : 231;
  const vencendo30Dias = validadeRaw?.itensAlerta !== undefined ? validadeRaw.itensAlerta : 871;
  const semGiro = validadeRaw?.itensSemGiro !== undefined ? validadeRaw.itensSemGiro : 1543;
  const alertasValidadeAtivos = (vencendo7Dias > 0 ? 1 : 0) + (validadeRaw?.itensAlerta ? 1 : 0);

  const pedidosTotalHoje = pedidosRaw?.totalPedidos || 6;
  const pedidosFaturadosHoje = pedidosRaw?.pedidosFaturados || 2;
  const totalVolumeHlExpedido = pedidosRaw?.volumeTotalHl || 136.92;
  const totalValorExpedido = pedidosRaw?.valorTotalFaturado || 125890.0;

  const produtividadePickingCxHora = pickingRaw?.produtividadeMediaCxHora || 155.0;

  const desviosPendentes = desviosRaw?.desviosAbertos !== undefined ? desviosRaw.desviosAbertos : 0;

  const nowIso = new Date().toISOString();
  const tempoProcessamentoMs = Date.now() - startTime;

  const indicadores: IndicadoresMaterializados = {
    totalEstoque,
    totalSKUs,
    vencendo7Dias,
    vencendo30Dias,
    semGiro,
    taxaOcupacaoPercentual,
    paletesOcupados,
    capacidadeTotalPaletes,
    pedidosFaturadosHoje,
    pedidosTotalHoje,
    produtividadePickingCxHora,
    totalVolumeHlExpedido,
    totalValorExpedido,
    alertasValidadeAtivos,
    desviosPendentes,
    perdasHoje: {
      totalQuebras: 1420.50,
      totalDespejo: 3890.00,
      totalRepack: 850.00
    },
    resumoSetores: [
      { setor: 'Armazém / Estoque', status: 'operacional', detalhe: `${taxaOcupacaoPercentual}% ocupação` },
      { setor: 'Picking & Expedição', status: 'operacional', detalhe: `${pedidosFaturadosHoje}/${pedidosTotalHoje} pedidos faturados` },
      { setor: 'Controle FEFO / Validades', status: vencendo7Dias > 0 ? 'atencao' : 'operacional', detalhe: `${vencendo7Dias} itens < 7 dias` },
      { setor: 'Qualidade & Desvios', status: desviosPendentes > 0 ? 'alerta' : 'operacional', detalhe: `${desviosPendentes} desvios abertos` }
    ],
    ultimaAtualizacao: nowIso,
    dataReferencia,
    materializado: true,
    tempoProcessamentoMs
  };

  // 3. Gravar nos arquivos públicos materializados
  const hojeAgregadoPath = path.join(HOJE_DIR, 'dashboard_agregado.json');
  const hojeDashPath = path.join(HOJE_DIR, 'dashboard.json');
  const estoqueAgregadoPath = path.join(HOJE_DIR, 'estoque_agregado.json');
  const validadesAgregadoPath = path.join(HOJE_DIR, 'validades_agregado.json');

  await fs.writeFile(hojeAgregadoPath, JSON.stringify(indicadores, null, 2), 'utf-8');
  
  // Atualiza dashboard.json com os KPIs agregados
  const dashPayload = {
    dataReferencia,
    fechamento: false,
    ultimaAtualizacao: nowIso,
    materializado: true,
    kpis: {
      totalEstoque: indicadores.totalEstoque,
      totalSKUs: indicadores.totalSKUs,
      vencendo7Dias: indicadores.vencendo7Dias,
      vencendo30Dias: indicadores.vencendo30Dias,
      semGiro: indicadores.semGiro,
      ocupacaoArmazemPercentual: indicadores.taxaOcupacaoPercentual,
      pedidosFaturadosHoje: indicadores.pedidosFaturadosHoje,
      pedidosTotalHoje: indicadores.pedidosTotalHoje,
      produtividadePickingCxHora: indicadores.produtividadePickingCxHora,
      totalVolumeHlExpedido: indicadores.totalVolumeHlExpedido,
      totalValorExpedido: indicadores.totalValorExpedido,
      alertasValidadeAtivos: indicadores.alertasValidadeAtivos,
      desviosPendentes: indicadores.desviosPendentes
    },
    resumoSetores: indicadores.resumoSetores
  };
  await fs.writeFile(hojeDashPath, JSON.stringify(dashPayload, null, 2), 'utf-8');

  // Grava agregado específico de estoque
  const estoqueAgregado = {
    totalEstoque: indicadores.totalEstoque,
    totalSKUs: indicadores.totalSKUs,
    paletesOcupados: indicadores.paletesOcupados,
    capacidadeTotalPaletes: indicadores.capacidadeTotalPaletes,
    taxaOcupacaoPercentual: indicadores.taxaOcupacaoPercentual,
    ultimaAtualizacao: nowIso
  };
  await fs.writeFile(estoqueAgregadoPath, JSON.stringify(estoqueAgregado, null, 2), 'utf-8');

  // Grava agregado específico de validades
  const validadesAgregado = {
    vencendo7Dias: indicadores.vencendo7Dias,
    vencendo30Dias: indicadores.vencendo30Dias,
    semGiro: indicadores.semGiro,
    alertasValidadeAtivos: indicadores.alertasValidadeAtivos,
    ultimaAtualizacao: nowIso
  };
  await fs.writeFile(validadesAgregadoPath, JSON.stringify(validadesAgregado, null, 2), 'utf-8');

  return indicadores;
}

/**
 * Retorna os indicadores materializados em cache/disco
 */
export async function getIndicadoresMaterializados(): Promise<IndicadoresMaterializados> {
  const hojeAgregadoPath = path.join(HOJE_DIR, 'dashboard_agregado.json');
  if (existsSync(hojeAgregadoPath)) {
    try {
      const raw = await fs.readFile(hojeAgregadoPath, 'utf-8');
      return JSON.parse(raw);
    } catch (e) {}
  }
  // Se não existir, gera imediatamente
  return await materializarIndicadoresDashboard();
}

/**
 * Retorna o status atual do serviço de sincronização
 */
export function getSyncStatus(): {
  status: string;
  lastSync: string;
  totalSyncRuns: number;
  paths: { hoje: string; historico: string; indices: string };
} {
  return {
    status: 'online',
    lastSync: lastSyncTimestamp,
    totalSyncRuns: syncCount,
    paths: {
      hoje: '/public/banco-dados/hoje/',
      historico: '/public/banco-dados/historico/YYYY/MM/DD/',
      indices: '/public/banco-dados/indices/'
    }
  };
}


