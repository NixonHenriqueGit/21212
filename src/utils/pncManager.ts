import { calculateStockAgeIndex, parseValidadeDate } from './calculateStockAgeIndex';
import { PRODUCTS } from '../planosData';
import { PRODUCT_MASTER_DATA } from '../data/productMasterData';
import { calcularTotalCaixas } from '../data/coletaPackagingData';
import { ValidadeRow } from '../types';

export interface PncItem {
  id: string;
  codigo: string;
  descricao: string;
  lote: string;
  validade: string; // YYYY-MM-DD or readable
  quantidade: number; // Caixas
  paletes: number;
  fatorPallet: number;
  fatorHecto: number;
  hectolitros: number;
  valorUnitario: number;
  valorTotal: number;
  localizacaoAnterior: string;
  blocoAnterior?: string;
  dataEntradaPnc: string; // YYYY-MM-DD
  horaEntradaPnc?: string; // HH:mm:ss
  diasEmPnc: number; // Calculated dynamic: floor((Today - DataEntrada) / 86400000)
  diasParaVencer: number; // Calculated dynamic: ceil((Validade - Today) / 86400000)
  stockAgeIndex: number;
  statusShelf: 'Vencido' | 'Crítico' | 'Atenção' | 'Regular';
  motivo: string;
  registradoPor: string;
  status: 'Em Quarentena / PNC' | 'Enviado para Despejo' | 'Devolvido Fábrica' | 'Liberado';
  tratativaEscoamento?: 'Venda Acelerada' | 'Repack' | 'Devolução Fábrica' | 'Reclassificação' | 'Despejo' | 'Pendente';
  statusEscoamento?: 'Em Quarentena' | 'Em Negociação' | 'Em Separação' | 'Aguardando Laudo' | 'Concluído';
  acaoTomada?: string;
  despejoTaskId?: string;
  observacoes?: string;
  _criadoEm: string;
  _atualizadoEm?: string;
}

export interface DespejoTask {
  id: string;
  origem: 'PNC' | 'Workstation' | 'FEFO' | 'Manual';
  pncId?: string;
  codigo: string;
  descricao: string;
  lote: string;
  validade: string;
  quantidade: number; // caixas
  embalagem: string;
  motivo: string;
  dataSolicitacao: string;
  horaSolicitacao?: string;
  solicitadoPor: string;
  prioridade: 'Urgente' | 'Alta' | 'Normal';
  status: 'Pendente' | 'Em Andamento' | 'Concluído' | 'Cancelado';
  executadoPor?: string;
  dataConclusao?: string;
  tempoGasto?: string;
  observacoes?: string;
}

// Initial seed PNC items for robust presentation
const SEED_PNC_ITEMS: Omit<PncItem, 'diasEmPnc' | 'diasParaVencer' | 'stockAgeIndex' | 'statusShelf'>[] = [
  {
    id: 'pnc-seed-1',
    codigo: '20815',
    descricao: 'BRAHMA CHOPP LT 350ML 12UN',
    lote: 'L24110A',
    validade: '2026-08-30',
    quantidade: 144,
    paletes: 2,
    fatorPallet: 72,
    fatorHecto: 0.042,
    hectolitros: 6.05,
    valorUnitario: 38.5,
    valorTotal: 5544.0,
    localizacaoAnterior: 'Armazém Central - Bloco C',
    blocoAnterior: 'Bloco C',
    dataEntradaPnc: '2026-07-29', // 29+ days ago -> Critical DPO 30-day limit
    horaEntradaPnc: '08:30:00',
    motivo: 'Validade Crítica (< 30d) - Risco de Perda DPO',
    registradoPor: 'Conferente CCO',
    status: 'Em Quarentena / PNC',
    observacoes: 'Produto isolado para tratativa obrigatória antes do limite de 30 dias.',
    _criadoEm: '2026-07-29T08:30:00.000Z'
  },
  {
    id: 'pnc-seed-2',
    codigo: '20819',
    descricao: 'SKOL PILSN LT 350ML 12UN',
    lote: 'L24150B',
    validade: '2026-09-10',
    quantidade: 72,
    paletes: 1,
    fatorPallet: 72,
    fatorHecto: 0.042,
    hectolitros: 3.02,
    valorUnitario: 36.0,
    valorTotal: 2592.0,
    localizacaoAnterior: 'Picking - Rua B',
    blocoAnterior: 'Bloco B',
    dataEntradaPnc: '2026-08-12', // 15 days ago
    horaEntradaPnc: '10:15:00',
    motivo: 'Avaria em Palete / Deformação de Latas',
    registradoPor: 'Operador Armazém',
    status: 'Em Quarentena / PNC',
    observacoes: 'Aguardando laudo de qualidade para decisão de despejo ou repack.',
    _criadoEm: '2026-08-12T10:15:00.000Z'
  },
  {
    id: 'pnc-seed-3',
    codigo: '20824',
    descricao: 'STELLA ARTOIS LN 330ML 6UN',
    lote: 'L24090C',
    validade: '2026-08-25',
    quantidade: 48,
    paletes: 0.5,
    fatorPallet: 96,
    fatorHecto: 0.0198,
    hectolitros: 0.95,
    valorUnitario: 45.9,
    valorTotal: 2203.2,
    localizacaoAnterior: 'Armazém Central - Bloco A',
    blocoAnterior: 'Bloco A',
    dataEntradaPnc: '2026-08-20', // 7 days ago
    horaEntradaPnc: '14:20:00',
    motivo: 'Lote Vencido na data da rota',
    registradoPor: 'Conferente CCO',
    status: 'Em Quarentena / PNC',
    observacoes: 'Produto vencido segregado para ordem de despejo imediato.',
    _criadoEm: '2026-08-20T14:20:00.000Z'
  }
];

export function getPncStorageKey(empresaId: string = 'demo'): string {
  return `armazem_pnc_full_items_${empresaId}`;
}

export function getDespejoTasksStorageKey(empresaId: string = 'demo'): string {
  return `despejo_tarefas_pendentes_${empresaId}`;
}

/**
 * Calculates dynamic fields for a PNC Item (diasEmPnc, diasParaVencer, stockAgeIndex, statusShelf)
 */
export function enrichPncItem(item: any): PncItem {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Dias em PNC
  let diasEmPnc = 0;
  if (item.dataEntradaPnc) {
    const dEntrada = parseValidadeDate(item.dataEntradaPnc);
    if (dEntrada) {
      dEntrada.setHours(0, 0, 0, 0);
      const diffMs = today.getTime() - dEntrada.getTime();
      diasEmPnc = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    }
  }

  // 2. Dias para vencer & Stock Age Index
  let diasParaVencer = 0;
  let statusShelf: 'Vencido' | 'Crítico' | 'Atenção' | 'Regular' = 'Regular';
  let stockAgeIndex = 50;

  if (item.validade) {
    const dVal = parseValidadeDate(item.validade);
    if (dVal) {
      dVal.setHours(0, 0, 0, 0);
      const diffMs = dVal.getTime() - today.getTime();
      diasParaVencer = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (diasParaVencer < 0) {
        statusShelf = 'Vencido';
      } else if (diasParaVencer <= 30) {
        statusShelf = 'Crítico';
      } else if (diasParaVencer <= 60) {
        statusShelf = 'Atenção';
      } else {
        statusShelf = 'Regular';
      }

      const calc = calculateStockAgeIndex({
        codigo: item.codigo,
        descricao: item.descricao,
        validade: item.validade
      });
      stockAgeIndex = calc.stockAgeIndex;
    }
  }

  // Master product enrichment
  const pMaster = PRODUCTS.find(p => String(p.codigo) === String(item.codigo)) ||
                  PRODUCT_MASTER_DATA.find(p => String((p as any).sku || (p as any).codigo) === String(item.codigo));
  const fatorPallet = Number(item.fatorPallet) || Number((pMaster as any)?.fatorPallet) || 72;
  const fatorHecto = Number(item.fatorHecto) || Number((pMaster as any)?.fatorHecto) || 0.042;
  const valorUnitario = Number(item.valorUnitario) || Number((pMaster as any)?.preco) || 40.0;
  const quantidade = Number(item.quantidade) || 0;
  const paletes = Number((quantidade / fatorPallet).toFixed(1));
  const hectolitros = Number((quantidade * fatorHecto).toFixed(2));
  const valorTotal = Number((quantidade * valorUnitario).toFixed(2));

  return {
    id: item.id || `pnc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    codigo: String(item.codigo || '000'),
    descricao: String(item.descricao || 'Produto Indefinido'),
    lote: String(item.lote || 'LOTE-PADRAO'),
    validade: String(item.validade || today.toISOString().substring(0, 10)),
    quantidade,
    paletes,
    fatorPallet,
    fatorHecto,
    hectolitros,
    valorUnitario,
    valorTotal,
    localizacaoAnterior: item.localizacaoAnterior || 'Armazém Central',
    blocoAnterior: item.blocoAnterior || 'Bloco Geral',
    dataEntradaPnc: item.dataEntradaPnc || today.toISOString().substring(0, 10),
    horaEntradaPnc: item.horaEntradaPnc || new Date().toLocaleTimeString('pt-BR'),
    diasEmPnc,
    diasParaVencer,
    stockAgeIndex,
    statusShelf,
    motivo: item.motivo || 'Encaminhado para PNC',
    registradoPor: item.registradoPor || 'Operação Armazém',
    status: item.status || 'Em Quarentena / PNC',
    observacoes: item.observacoes || '',
    _criadoEm: item._criadoEm || new Date().toISOString(),
    _atualizadoEm: item._atualizadoEm || new Date().toISOString()
  };
}

/**
 * Gets all PNC stored items enriched with live calculations
 */
export function getStoredPncItems(empresaId: string = 'demo'): PncItem[] {
  const key = getPncStorageKey(empresaId);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      // Seed default items first time
      const initial = SEED_PNC_ITEMS.map(i => enrichPncItem(i));
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    const parsed: any[] = JSON.parse(raw);
    return parsed.map(enrichPncItem);
  } catch (e) {
    console.error('Erro ao ler itens PNC:', e);
    return SEED_PNC_ITEMS.map(i => enrichPncItem(i));
  }
}

/**
 * Saves or updates a PNC item in localStorage and triggers events
 */
export function savePncItem(itemData: Partial<PncItem>, empresaId: string = 'demo'): PncItem {
  const currentList = getStoredPncItems(empresaId);
  const now = new Date();
  const todayISO = now.toISOString().substring(0, 10);
  const nowTime = now.toLocaleTimeString('pt-BR');

  const existingIdx = currentList.findIndex(i => 
    (itemData.id && i.id === itemData.id) || 
    (i.codigo === itemData.codigo && i.validade === itemData.validade && i.status === 'Em Quarentena / PNC')
  );

  let updatedItem: PncItem;

  if (existingIdx >= 0) {
    const existing = currentList[existingIdx];
    updatedItem = enrichPncItem({
      ...existing,
      ...itemData,
      dataEntradaPnc: itemData.dataEntradaPnc || existing.dataEntradaPnc || todayISO,
      _atualizadoEm: now.toISOString()
    });
    currentList[existingIdx] = updatedItem;
  } else {
    updatedItem = enrichPncItem({
      ...itemData,
      id: itemData.id || `pnc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      dataEntradaPnc: itemData.dataEntradaPnc || todayISO,
      horaEntradaPnc: itemData.horaEntradaPnc || nowTime,
      _criadoEm: now.toISOString(),
      _atualizadoEm: now.toISOString()
    });
    currentList.unshift(updatedItem);
  }

  const key = getPncStorageKey(empresaId);
  localStorage.setItem(key, JSON.stringify(currentList));

  // Sync with general dates lookup
  try {
    const pncDateMapKey = `armazem_pnc_dates_${empresaId}`;
    const dateMap = JSON.parse(localStorage.getItem(pncDateMapKey) || '{}');
    dateMap[`${updatedItem.codigo}_${updatedItem.validade}`] = updatedItem.dataEntradaPnc;
    localStorage.setItem(pncDateMapKey, JSON.stringify(dateMap));
  } catch (e) {}

  window.dispatchEvent(new Event('local_data_changed'));
  window.dispatchEvent(new Event('pnc_updated'));
  window.dispatchEvent(new Event('storage'));

  return updatedItem;
}

/**
 * Updates the entry date of a PNC Item and re-calculates days
 */
export function updatePncItemDate(id: string, novaDataEntrada: string, empresaId: string = 'demo'): PncItem | null {
  const currentList = getStoredPncItems(empresaId);
  const idx = currentList.findIndex(i => i.id === id);
  if (idx < 0) return null;

  const item = currentList[idx];
  const updated = enrichPncItem({
    ...item,
    dataEntradaPnc: novaDataEntrada,
    _atualizadoEm: new Date().toISOString()
  });

  currentList[idx] = updated;
  localStorage.setItem(getPncStorageKey(empresaId), JSON.stringify(currentList));

  try {
    const pncDateMapKey = `armazem_pnc_dates_${empresaId}`;
    const dateMap = JSON.parse(localStorage.getItem(pncDateMapKey) || '{}');
    dateMap[`${updated.codigo}_${updated.validade}`] = novaDataEntrada;
    localStorage.setItem(pncDateMapKey, JSON.stringify(dateMap));
  } catch (e) {}

  window.dispatchEvent(new Event('local_data_changed'));
  window.dispatchEvent(new Event('pnc_updated'));
  window.dispatchEvent(new Event('storage'));

  return updated;
}

/**
 * Sends a PNC Item to DESPEJO, automatically generating a task for the AJUDANTE DE ARMAZÉM
 */
export function enviarPncParaDespejo(
  pncId: string, 
  userNome: string = 'Conferente CCO', 
  motivoDespejo?: string,
  empresaId: string = 'demo'
): { pncItem: PncItem | null; tarefa: DespejoTask | null } {
  const currentList = getStoredPncItems(empresaId);
  const idx = currentList.findIndex(i => i.id === pncId);
  if (idx < 0) return { pncItem: null, tarefa: null };

  const item = currentList[idx];
  const now = new Date();
  const todayISO = now.toISOString().substring(0, 10);
  const nowTime = now.toLocaleTimeString('pt-BR');

  // 1. Update PNC item status
  const updatedPncItem = enrichPncItem({
    ...item,
    status: 'Enviado para Despejo',
    observacoes: `Enviado para Despejo em ${todayISO} por ${userNome}. Motivo: ${motivoDespejo || item.motivo}`,
    _atualizadoEm: now.toISOString()
  });
  currentList[idx] = updatedPncItem;
  localStorage.setItem(getPncStorageKey(empresaId), JSON.stringify(currentList));

  // 2. Create the official Despejo Task for Ajudante de Armazém
  const masterProduct = PRODUCTS.find(p => String(p.codigo) === item.codigo);
  const embalagem = (masterProduct as any)?.embalagem || 'GARRAFA 1L';

  const task: DespejoTask = {
    id: `task-desp-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    origem: 'PNC',
    pncId: item.id,
    codigo: item.codigo,
    descricao: item.descricao,
    lote: item.lote,
    validade: item.validade,
    quantidade: item.quantidade,
    embalagem,
    motivo: motivoDespejo || `Tratativa PNC (${item.diasEmPnc} dias na área de segregação) - ${item.motivo}`,
    dataSolicitacao: todayISO,
    horaSolicitacao: nowTime,
    solicitadoPor: userNome,
    prioridade: item.diasEmPnc >= 25 || item.diasParaVencer <= 0 ? 'Urgente' : 'Alta',
    status: 'Pendente'
  };

  saveDespejoTask(task, empresaId);

  // 3. Sync with classic Despejo rows
  try {
    const despejoKey = `despejo_rows_${empresaId}`;
    const dList = JSON.parse(localStorage.getItem(despejoKey) || '[]');
    dList.unshift({
      id: task.id,
      codigo: item.codigo,
      descricao: item.descricao,
      quantidade: item.quantidade,
      lote: item.lote,
      validade: item.validade,
      motivo: task.motivo,
      responsavel: userNome,
      dataDespejo: todayISO,
      _criadoEm: now.toISOString()
    });
    localStorage.setItem(despejoKey, JSON.stringify(dList));
  } catch (e) {}

  window.dispatchEvent(new Event('local_data_changed'));
  window.dispatchEvent(new Event('pnc_updated'));
  window.dispatchEvent(new Event('despejo_tasks_updated'));
  window.dispatchEvent(new Event('storage'));

  return { pncItem: updatedPncItem, tarefa: task };
}

/**
 * Gets all pending and finished Despejo Tasks for Ajudante de Armazém
 */
export function getStoredDespejoTasks(empresaId: string = 'demo'): DespejoTask[] {
  const key = getDespejoTasksStorageKey(empresaId);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      // Seed an initial pending task to show the helper immediately
      const initialTask: DespejoTask = {
        id: 'task-seed-desp-1',
        origem: 'PNC',
        pncId: 'pnc-seed-1',
        codigo: '20815',
        descricao: 'BRAHMA CHOPP LT 350ML 12UN',
        lote: 'L24110A',
        validade: '2026-08-30',
        quantidade: 144,
        embalagem: 'LATA 350',
        motivo: 'Tratativa PNC (29 dias em segregação - Limite DPO 30 dias)',
        dataSolicitacao: new Date().toISOString().substring(0, 10),
        horaSolicitacao: '08:45:00',
        solicitadoPor: 'CCO / Gestor FEFO',
        prioridade: 'Urgente',
        status: 'Pendente'
      };
      localStorage.setItem(key, JSON.stringify([initialTask]));
      return [initialTask];
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Erro ao ler tarefas de despejo:', e);
    return [];
  }
}

/**
 * Saves or updates a Despejo Task
 */
export function saveDespejoTask(taskData: Partial<DespejoTask>, empresaId: string = 'demo'): DespejoTask {
  const currentList = getStoredDespejoTasks(empresaId);
  const now = new Date();
  const todayISO = now.toISOString().substring(0, 10);
  const nowTime = now.toLocaleTimeString('pt-BR');

  const existingIdx = currentList.findIndex(t => t.id === taskData.id);
  let updatedTask: DespejoTask;

  if (existingIdx >= 0) {
    updatedTask = {
      ...currentList[existingIdx],
      ...taskData
    };
    currentList[existingIdx] = updatedTask;
  } else {
    updatedTask = {
      id: taskData.id || `task-desp-${Date.now()}`,
      origem: taskData.origem || 'PNC',
      pncId: taskData.pncId,
      codigo: String(taskData.codigo || '000'),
      descricao: String(taskData.descricao || 'Produto Despejo'),
      lote: String(taskData.lote || 'LOTE-1'),
      validade: String(taskData.validade || todayISO),
      quantidade: Number(taskData.quantidade) || 1,
      embalagem: taskData.embalagem || 'GARRAFA 1L',
      motivo: taskData.motivo || 'Ordem de Despejo',
      dataSolicitacao: taskData.dataSolicitacao || todayISO,
      horaSolicitacao: taskData.horaSolicitacao || nowTime,
      solicitadoPor: taskData.solicitadoPor || 'CCO / FEFO',
      prioridade: taskData.prioridade || 'Alta',
      status: taskData.status || 'Pendente',
      ...taskData
    };
    currentList.unshift(updatedTask);
  }

  localStorage.setItem(getDespejoTasksStorageKey(empresaId), JSON.stringify(currentList));
  window.dispatchEvent(new Event('despejo_tasks_updated'));
  window.dispatchEvent(new Event('storage'));

  return updatedTask;
}

/**
 * Concludes a Despejo Task by the Ajudante de Armazém
 */
export function concluirDespejoTask(
  taskId: string, 
  executadoPor: string = 'Ajudante de Armazém', 
  tempoGasto: string = '00:05:00',
  empresaId: string = 'demo'
): void {
  const currentList = getStoredDespejoTasks(empresaId);
  const idx = currentList.findIndex(t => t.id === taskId);
  if (idx < 0) return;

  const now = new Date();
  const task = currentList[idx];
  currentList[idx] = {
    ...task,
    status: 'Concluído',
    executadoPor,
    dataConclusao: now.toISOString(),
    tempoGasto
  };

  localStorage.setItem(getDespejoTasksStorageKey(empresaId), JSON.stringify(currentList));

  // Mirror to despejo_manual_entries so DespejoDashboard immediately displays the row in KPIs, charts, and table
  try {
    const completedDespejoRow = {
      id: `desp-task-${task.id}`,
      _docId: `desp-task-${task.id}`,
      data: now.toLocaleDateString('pt-BR'),
      dataISO: now.toISOString().split('T')[0],
      operador: executadoPor,
      embalagem: task.embalagem || 'LATA 350',
      produto: `${task.codigo} - ${task.descricao}`,
      descricao: task.descricao,
      codProduto: task.codigo,
      lote: task.lote,
      quantidade: task.quantidade,
      duracao: tempoGasto || '00:04:00',
      inicio: '08:00',
      fim: '08:04',
      motivo: task.motivo || 'Tratativa PNC / Shelf Life',
      resultado: '🟢 Dentro da Meta',
      origem: 'AJUDANTE_DESPEJO',
      criadoEm: now.toISOString()
    };

    const keysToUpdate = [
      `despejo_manual_entries_${empresaId}`,
      `despejo_manual_entries_demo`,
      `despejo_rows_${empresaId}`
    ];
    keysToUpdate.forEach(k => {
      try {
        const raw = localStorage.getItem(k);
        const list = raw ? JSON.parse(raw) : [];
        const nextList = [completedDespejoRow, ...list.filter((x: any) => x.id !== completedDespejoRow.id)];
        localStorage.setItem(k, JSON.stringify(nextList));
      } catch (_) {}
    });

    window.dispatchEvent(new CustomEvent('despejo-updated', { detail: [completedDespejoRow] }));
    window.dispatchEvent(new CustomEvent('despejo-db-updated', { detail: [completedDespejoRow] }));
  } catch (_) {}

  // If this task was linked to a PNC item, update the PNC item
  if (task.pncId) {
    const pncList = getStoredPncItems(empresaId);
    const pncIdx = pncList.findIndex(p => p.id === task.pncId);
    if (pncIdx >= 0) {
      pncList[pncIdx] = {
        ...pncList[pncIdx],
        status: 'Enviado para Despejo',
        statusEscoamento: 'Concluído',
        observacoes: `Despejo concluído em ${now.toLocaleDateString('pt-BR')} por ${executadoPor}.`,
        _atualizadoEm: now.toISOString()
      };
      localStorage.setItem(getPncStorageKey(empresaId), JSON.stringify(pncList));
      window.dispatchEvent(new Event('pnc_updated'));
    }
  }

  window.dispatchEvent(new Event('despejo_tasks_updated'));
  window.dispatchEvent(new Event('storage'));
}

/**
 * Updates Escoamento action and status for a PNC item
 */
export function updatePncEscoamento(
  id: string,
  tratativa: 'Venda Acelerada' | 'Repack' | 'Devolução Fábrica' | 'Reclassificação' | 'Despejo' | 'Pendente',
  statusEscoamento: 'Em Quarentena' | 'Em Negociação' | 'Em Separação' | 'Aguardando Laudo' | 'Concluído',
  acaoTomada: string,
  empresaId: string = 'demo'
): PncItem | null {
  const currentList = getStoredPncItems(empresaId);
  const idx = currentList.findIndex(i => i.id === id);
  if (idx < 0) return null;

  const now = new Date();
  const updated = enrichPncItem({
    ...currentList[idx],
    tratativaEscoamento: tratativa,
    statusEscoamento,
    acaoTomada,
    _atualizadoEm: now.toISOString()
  });

  currentList[idx] = updated;
  localStorage.setItem(getPncStorageKey(empresaId), JSON.stringify(currentList));
  window.dispatchEvent(new Event('pnc_updated'));
  window.dispatchEvent(new Event('storage'));

  return updated;
}

/**
 * Synchronizes PNC list from the latest collected validades (ValidadeRow[])
 */
export function syncPncFromValidadesList(
  validadesList: ValidadeRow[],
  empresaId: string = 'demo',
  onlyCriticalOrExpired: boolean = false
): { addedCount: number; updatedCount: number } {
  if (!validadesList || validadesList.length === 0) {
    return { addedCount: 0, updatedCount: 0 };
  }

  const currentList = getStoredPncItems(empresaId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString().substring(0, 10);

  let addedCount = 0;
  let updatedCount = 0;

  validadesList.forEach(v => {
    const cod = String(v.codigo || '').trim();
    if (!cod) return;

    let days = v.diasParaVencer !== undefined ? Number(v.diasParaVencer) : (Number((v as any).days) || 0);
    if (v.validade) {
      const dVal = parseValidadeDate(v.validade);
      if (dVal) {
        dVal.setHours(0, 0, 0, 0);
        days = Math.ceil((dVal.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      }
    }

    // Filter if requested: only expired (<=0) or critical (<=30) or general
    if (onlyCriticalOrExpired && days > 30) {
      return;
    }

    const validadeStr = v.validade || todayISO;
    const loteStr = v.lote || 'LOTE-VAL';
    const qtdCx = v.quantidade !== undefined && Number(v.quantidade) > 0 
      ? Number(v.quantidade) 
      : calcularTotalCaixas(v.codigo, v.palhete || 0, v.lastro || 0, v.caixa || 0);

    if (qtdCx <= 0) return;

    // Check if already in PNC list
    const existingIdx = currentList.findIndex(p => p.codigo === cod && p.validade === validadeStr);

    if (existingIdx >= 0) {
      // Update quantity and location if changed
      const existing = currentList[existingIdx];
      currentList[existingIdx] = enrichPncItem({
        ...existing,
        quantidade: Math.max(existing.quantidade, qtdCx),
        localizacaoAnterior: v.localizacao || existing.localizacaoAnterior,
        blocoAnterior: v.bloco || existing.blocoAnterior
      });
      updatedCount++;
    } else {
      // Create new PNC Item
      const isExpired = days <= 0;
      const motivo = isExpired 
        ? 'Produto Vencido recolhido na Coleta de Validades' 
        : days <= 30 
        ? 'Validade Crítica (≤ 30 dias) - Segregação para Escoamento' 
        : 'Recolhimento de Validades do Armazém';

      const newItem = enrichPncItem({
        id: `pnc-val-${cod}-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        codigo: cod,
        descricao: v.descricao || `Produto ${cod}`,
        lote: loteStr,
        validade: validadeStr,
        quantidade: qtdCx,
        localizacaoAnterior: v.localizacao || 'Armazém Central',
        blocoAnterior: v.bloco || 'Geral',
        dataEntradaPnc: todayISO,
        horaEntradaPnc: new Date().toLocaleTimeString('pt-BR'),
        motivo,
        registradoPor: 'Sincronização Coleta Validades',
        status: isExpired ? 'Enviado para Despejo' : 'Em Quarentena / PNC',
        tratativaEscoamento: isExpired ? 'Despejo' : 'Venda Acelerada',
        statusEscoamento: 'Em Quarentena'
      });

      currentList.unshift(newItem);
      addedCount++;
    }
  });

  if (addedCount > 0 || updatedCount > 0) {
    localStorage.setItem(getPncStorageKey(empresaId), JSON.stringify(currentList));
    window.dispatchEvent(new Event('pnc_updated'));
    window.dispatchEvent(new Event('storage'));
  }

  return { addedCount, updatedCount };
}

/**
 * Realiza a análise apurada e retroativa de TODAS as validades recolhidas/importadas no Stock Age
 * ao longo do ano inteiro e atualiza o histórico do PNC com todos os itens com menos de 30 dias de validade.
 */
export function syncPncFromAllYearlyColetas(empresaId: string = 'demo'): { addedCount: number; totalPnc: number } {
  if (typeof window === 'undefined') return { addedCount: 0, totalPnc: 0 };
  try {
    const currentList = getStoredPncItems(empresaId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Carregar todas as coletas mensais do Stock Age
    const storageKeys = ['af_stock_age_monthly_coletas_2026_v4', 'af_stock_age_monthly_coletas_2026_v3'];
    let rawMonthly: any = null;
    for (const k of storageKeys) {
      const data = localStorage.getItem(k);
      if (data) {
        try { rawMonthly = JSON.parse(data); break; } catch (_) {}
      }
    }

    let addedCount = 0;

    if (rawMonthly && typeof rawMonthly === 'object') {
      const allMonths = Object.keys(rawMonthly);
      allMonths.forEach(mKey => {
        const coletas = rawMonthly[mKey];
        if (Array.isArray(coletas)) {
          coletas.forEach((item: any, idx: number) => {
            const cod = String(item.codigo || '').trim();
            if (!cod || cod === '0') return;

            const validadeStr = item.dataVencimento || item.validade;
            if (!validadeStr) return;

            // Calcular dias para vencer na data de hoje
            let diasParaVencer = 999;
            const dVal = parseValidadeDate(validadeStr);
            if (dVal) {
              dVal.setHours(0, 0, 0, 0);
              diasParaVencer = Math.ceil((dVal.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            } else if (item.validadeDias !== undefined) {
              diasParaVencer = Number(item.validadeDias);
            }

            // REGRA SOLICITADA: Todos os itens com menos de 30 dias de validade (ou vencidos)
            if (diasParaVencer <= 30) {
              const qtd = Number(item.qtdeCaixas || item.quantidade || 1);
              const dataCol = item.dataColeta || '28/08/2026';
              
              // Converter data de coleta DD/MM/YYYY para ISO
              let dataEntradaISO = today.toISOString().substring(0, 10);
              if (dataCol.includes('/')) {
                const parts = dataCol.split('/');
                if (parts.length === 3) {
                  const y = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
                  dataEntradaISO = `${y}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                }
              }

              // Verificar se o item já existe no histórico PNC
              const alreadyExists = currentList.some(p => 
                p.codigo === cod && 
                p.validade === validadeStr && 
                (p.dataEntradaPnc === dataEntradaISO || p.localizacaoAnterior === (item.destino || `Bloco ${item.blocoPrincipal || 'A'}`))
              );

              if (!alreadyExists) {
                const isExpired = diasParaVencer <= 0;
                const motivo = isExpired 
                  ? `Produto Vencido detectado na Coleta Stock Age (${dataCol})`
                  : `Validade Crítica (${diasParaVencer} dias) detectada na Coleta Stock Age (${dataCol})`;

                const pMaster = PRODUCTS.find(p => String(p.codigo) === cod) ||
                                PRODUCT_MASTER_DATA.find(p => String((p as any).sku || (p as any).codigo) === cod);
                const desc = item.descricao || (pMaster as any)?.descricao || `Produto ${cod}`;

                const newItem = enrichPncItem({
                  id: `pnc-retro-${cod}-${dataEntradaISO}-${idx}`,
                  codigo: cod,
                  descricao: desc,
                  lote: item.lote || `LOTE-COL-${dataCol.replace(/\//g, '')}`,
                  validade: validadeStr,
                  quantidade: qtd,
                  localizacaoAnterior: item.destino || `Bloco ${item.blocoPrincipal || 'A'} - ${item.subBloco || 'Rua 1'}`,
                  blocoAnterior: item.blocoPrincipal || 'Bloco A',
                  dataEntradaPnc: dataEntradaISO,
                  horaEntradaPnc: '08:00:00',
                  motivo,
                  registradoPor: 'Auditoria Retroativa Stock Age',
                  status: isExpired ? 'Enviado para Despejo' : 'Em Quarentena / PNC',
                  tratativaEscoamento: isExpired ? 'Despejo' : 'Venda Acelerada',
                  statusEscoamento: 'Em Quarentena'
                });

                currentList.push(newItem);
                addedCount++;
              }
            }
          });
        }
      });
    }

    if (addedCount > 0) {
      localStorage.setItem(getPncStorageKey(empresaId), JSON.stringify(currentList));
      window.dispatchEvent(new Event('pnc_updated'));
      window.dispatchEvent(new Event('storage'));
    }

    return { addedCount, totalPnc: currentList.length };
  } catch (err) {
    console.error('Erro ao sincronizar histórico retroativo do PNC:', err);
    return { addedCount: 0, totalPnc: 0 };
  }
}

/**
 * Removes a PNC Item completely
 */
export function removerPncItem(id: string, empresaId: string = 'demo'): void {
  const currentList = getStoredPncItems(empresaId);
  const updated = currentList.filter(i => i.id !== id);
  localStorage.setItem(getPncStorageKey(empresaId), JSON.stringify(updated));
  window.dispatchEvent(new Event('pnc_updated'));
  window.dispatchEvent(new Event('storage'));
}

// =========================================================================
// GESTÃO OFICIAL DE SHELF LIFE (ITENS VENCIDOS NO ARMAZÉM)
// =========================================================================

export interface ShelfItem {
  id: string;
  data: string; // YYYY-MM-DD (ex: 2026-01-18, 2026-02-11)
  codigo: string;
  descricao: string;
  quantidadeUnidades: number; // Quantidade em UNIDADES individuais
  codigoMotivo: string; // '533'
  departamento: string; // 'ARMAZEM'
  motivoDescricao: string; // 'PRODUTO VENCIDO - ARMAZEM'
  precoUnitario: number; // R$ por unidade
  valorTotal: number; // R$ total
  hectolitros: number; // hL total
  fatorHectoPorUnidade: number; // hL por unidade (ex: 0.002, 0.0033, 0.0035)
  lote?: string;
  validade?: string;
  localizacao?: string;
  bloco?: string;
  statusEstoque?: 'Bloqueado' | 'Em Quarentena' | 'Liberado';
  statusDespejo: 'Pendente' | 'Concluído' | 'Em Andamento';
  dataDespejo?: string;
  executadoPor?: string;
  despejoTaskId?: string;
  observacoes?: string;
  _criadoEm: string;
  _atualizadoEm?: string;
}

/**
 * Retorna dados cadastrais do produto para conversão correta de Unidades -> Hectolitros e Preço
 */
export function getProductConversionData(codigo: string, descricao?: string): {
  descricao: string;
  fatorHectoPorUnidade: number;
  precoUnitario: number;
  caixasPallet: number;
  unidadesPorCaixa: number;
} {
  const codStr = String(codigo).trim();
  const pPlano = PRODUCTS.find(p => String(p.codigo) === codStr);
  const pMaster = PRODUCT_MASTER_DATA.find(p => String((p as any).sku || (p as any).cod || (p as any).codigo) === codStr);

  let desc = descricao || pPlano?.descricao || (pMaster as any)?.descricao || `Produto ${codStr}`;
  let fatorHectoPorUn = (pPlano as any)?.fatorHectoPorUnidade;

  // Se não definido no plano, deduz do volume da descrição
  if (!fatorHectoPorUn) {
    const dUpper = desc.toUpperCase();
    if (dUpper.includes('200ML') || dUpper.includes('200 ML')) fatorHectoPorUn = 0.002;
    else if (dUpper.includes('250ML') || dUpper.includes('250 ML')) fatorHectoPorUn = 0.0025;
    else if (dUpper.includes('269ML') || dUpper.includes('269 ML')) fatorHectoPorUn = 0.00269;
    else if (dUpper.includes('300ML') || dUpper.includes('300 ML')) fatorHectoPorUn = 0.003;
    else if (dUpper.includes('330ML') || dUpper.includes('330 ML')) fatorHectoPorUn = 0.0033;
    else if (dUpper.includes('350ML') || dUpper.includes('350 ML')) fatorHectoPorUn = 0.0035;
    else if (dUpper.includes('355ML') || dUpper.includes('355 ML')) fatorHectoPorUn = 0.00355;
    else if (dUpper.includes('473ML') || dUpper.includes('473 ML') || dUpper.includes('LATAO') || dUpper.includes('LATÃO')) fatorHectoPorUn = 0.00473;
    else if (dUpper.includes('500ML') || dUpper.includes('500 ML')) fatorHectoPorUn = 0.005;
    else if (dUpper.includes('550ML') || dUpper.includes('550 ML')) fatorHectoPorUn = 0.0055;
    else if (dUpper.includes('600ML') || dUpper.includes('600 ML')) fatorHectoPorUn = 0.006;
    else if (dUpper.includes('1000ML') || dUpper.includes('1L') || dUpper.includes('1 L')) fatorHectoPorUn = 0.01;
    else if (dUpper.includes('1.5L') || dUpper.includes('1,5L')) fatorHectoPorUn = 0.015;
    else if (dUpper.includes('2000ML') || dUpper.includes('2L') || dUpper.includes('2 L')) fatorHectoPorUn = 0.02;
    else if (dUpper.includes('2.25L') || dUpper.includes('2,25L')) fatorHectoPorUn = 0.0225;
    else if (dUpper.includes('2.5L') || dUpper.includes('2,5L')) fatorHectoPorUn = 0.025;
    else if (dUpper.includes('30L') || dUpper.includes('BARRIL 30')) fatorHectoPorUn = 0.3;
    else if (dUpper.includes('50L') || dUpper.includes('BARRIL 50')) fatorHectoPorUn = 0.5;
    else {
      // Fallback baseado no fator de hectolitros da caixa dividido por unidades por caixa
      const fH = Number((pMaster as any)?.fatorHecto) || 0.042;
      const unCx = Number((pPlano as any)?.fator) || 12;
      fatorHectoPorUn = Number((fH / unCx).toFixed(6)) || 0.0035;
    }
  }

  // Preço Unitário Exato da base ou padrão Ambev
  let precoUnitario = 0;
  if (codStr === '4293') precoUnitario = 1.04;
  else if (codStr === '19321') precoUnitario = 1.07;
  else if (codStr === '29580') precoUnitario = 4.46;
  else if (codStr === '2008') precoUnitario = 2.25;
  else {
    const rawPrice = (pMaster as any)?.preco || (pMaster as any)?.precoUnitario || (pPlano as any)?.preco;
    if (rawPrice && rawPrice > 0) {
      const unCx = Number((pPlano as any)?.fator) || 12;
      precoUnitario = rawPrice > 12 ? Number((rawPrice / unCx).toFixed(2)) : rawPrice;
    } else {
      precoUnitario = 2.50;
    }
  }

  const caixasPallet = Number((pPlano as any)?.caixasPallet) || Number((pMaster as any)?.fatorPallet) || 72;
  const unidadesPorCaixa = Number((pPlano as any)?.fator) || 12;

  return {
    descricao: desc,
    fatorHectoPorUnidade: Number(fatorHectoPorUn),
    precoUnitario: Number(precoUnitario),
    caixasPallet,
    unidadesPorCaixa
  };
}

/**
 * 5 Itens Oficiais de Shelf Life do Armazém conforme registros de Despejo
 */
export const SEED_SHELF_ITEMS: ShelfItem[] = [
  {
    id: 'shelf-seed-1',
    data: '2026-01-18',
    codigo: '4293',
    descricao: 'PEPSI BLACK PET 200ML SH C/12',
    quantidadeUnidades: 144,
    codigoMotivo: '533',
    departamento: 'ARMAZEM',
    motivoDescricao: 'PRODUTO VENCIDO - ARMAZEM',
    precoUnitario: 1.04,
    valorTotal: 149.74,
    hectolitros: 0.2880,
    fatorHectoPorUnidade: 0.002,
    lote: 'L25350P',
    validade: '2026-01-18',
    localizacao: 'Armazém Central - Bloco B',
    bloco: 'Bloco B',
    statusEstoque: 'Bloqueado',
    statusDespejo: 'Concluído',
    dataDespejo: '2026-01-19',
    executadoPor: 'Ajudante de Armazém',
    observacoes: 'Despejo executado e registrado no centro 533.',
    _criadoEm: '2026-01-18T08:00:00.000Z'
  },
  {
    id: 'shelf-seed-2',
    data: '2026-02-11',
    codigo: '19321',
    descricao: 'GUARANA ANTARCTICA ZERO PET 200ML SH C/12',
    quantidadeUnidades: 144,
    codigoMotivo: '533',
    departamento: 'ARMAZEM',
    motivoDescricao: 'PRODUTO VENCIDO - ARMAZEM',
    precoUnitario: 1.07,
    valorTotal: 154.14,
    hectolitros: 0.2880,
    fatorHectoPorUnidade: 0.002,
    lote: 'L25380G',
    validade: '2026-02-11',
    localizacao: 'Armazém Central - Bloco B',
    bloco: 'Bloco B',
    statusEstoque: 'Bloqueado',
    statusDespejo: 'Concluído',
    dataDespejo: '2026-02-12',
    executadoPor: 'Ajudante de Armazém',
    observacoes: 'Despejo concluído conforme laudo de quarentena.',
    _criadoEm: '2026-02-11T08:00:00.000Z'
  },
  {
    id: 'shelf-seed-3',
    data: '2026-02-17',
    codigo: '29580',
    descricao: 'STELLA ARTOIS PURE GOLD LONG NECK 330ML SP SH C/4',
    quantidadeUnidades: 14,
    codigoMotivo: '533',
    departamento: 'ARMAZEM',
    motivoDescricao: 'PRODUTO VENCIDO - ARMAZEM',
    precoUnitario: 4.46,
    valorTotal: 62.39,
    hectolitros: 0.0462,
    fatorHectoPorUnidade: 0.0033,
    lote: 'L25320S',
    validade: '2026-02-17',
    localizacao: 'Armazém Central - Bloco A',
    bloco: 'Bloco A',
    statusEstoque: 'Bloqueado',
    statusDespejo: 'Concluído',
    dataDespejo: '2026-02-18',
    executadoPor: 'Ajudante de Armazém',
    observacoes: 'Despejo executado e finalizado.',
    _criadoEm: '2026-02-17T08:00:00.000Z'
  },
  {
    id: 'shelf-seed-4',
    data: '2026-02-21',
    codigo: '2008',
    descricao: 'ANTARCTICA SUBZERO LATA 350ML SH C/12 NPAL',
    quantidadeUnidades: 12,
    codigoMotivo: '533',
    departamento: 'ARMAZEM',
    motivoDescricao: 'PRODUTO VENCIDO - ARMAZEM',
    precoUnitario: 2.25,
    valorTotal: 27.01,
    hectolitros: 0.0420,
    fatorHectoPorUnidade: 0.0035,
    lote: 'L25310Z',
    validade: '2026-02-21',
    localizacao: 'Armazém Central - Bloco C',
    bloco: 'Bloco C',
    statusEstoque: 'Bloqueado',
    statusDespejo: 'Concluído',
    dataDespejo: '2026-08-28',
    executadoPor: 'Ajudante de Armazém',
    observacoes: 'Despejo executado e finalizado na baia.',
    _criadoEm: '2026-02-21T08:00:00.000Z'
  },
  {
    id: 'shelf-seed-5',
    data: '2026-02-22',
    codigo: '2008',
    descricao: 'ANTARCTICA SUBZERO LATA 350ML SH C/12 NPAL',
    quantidadeUnidades: 4,
    codigoMotivo: '533',
    departamento: 'ARMAZEM',
    motivoDescricao: 'PRODUTO VENCIDO - ARMAZEM',
    precoUnitario: 2.25,
    valorTotal: 9.00,
    hectolitros: 0.0140,
    fatorHectoPorUnidade: 0.0035,
    lote: 'L25312Z',
    validade: '2026-02-22',
    localizacao: 'Armazém Central - Bloco C',
    bloco: 'Bloco C',
    statusEstoque: 'Bloqueado',
    statusDespejo: 'Concluído',
    dataDespejo: '2026-08-28',
    executadoPor: 'Ajudante de Armazém',
    observacoes: 'Despejo executado e finalizado na baia.',
    _criadoEm: '2026-02-22T08:00:00.000Z'
  }
];

export function getShelfStorageKey(empresaId: string = 'demo'): string {
  return `armazem_shelf_items_v2_${empresaId}`;
}

/**
 * Enriquece e calcula dinamicamente campos de um item de Shelf
 */
export function enrichShelfItem(item: any): ShelfItem {
  const conv = getProductConversionData(item.codigo, item.descricao);
  const qtdUn = Number(item.quantidadeUnidades || item.quantidade || 0);
  const fatorHectoPorUn = Number(item.fatorHectoPorUnidade) || conv.fatorHectoPorUnidade;
  const precoUn = Number(item.precoUnitario) || conv.precoUnitario;

  const hectolitros = item.hectolitros !== undefined && Number(item.hectolitros) > 0
    ? Number(Number(item.hectolitros).toFixed(4))
    : Number((qtdUn * fatorHectoPorUn).toFixed(4));

  const valorTotal = item.valorTotal !== undefined && Number(item.valorTotal) > 0
    ? Number(Number(item.valorTotal).toFixed(2))
    : Number((qtdUn * precoUn).toFixed(2));

  // Determine official dataDespejo if item matches seed
  let dataDespejo = item.dataDespejo;
  if (!dataDespejo && (item.statusDespejo === 'Concluído' || !item.statusDespejo)) {
    if (String(item.codigo) === '4293') dataDespejo = '2026-01-19';
    else if (String(item.codigo) === '19321') dataDespejo = '2026-02-12';
    else if (String(item.codigo) === '29580') dataDespejo = '2026-02-18';
    else if (String(item.codigo) === '2008') dataDespejo = '2026-08-28';
  }

  return {
    id: item.id || `shelf-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    data: item.data || new Date().toISOString().substring(0, 10),
    codigo: String(item.codigo || '000'),
    descricao: String(item.descricao || conv.descricao),
    quantidadeUnidades: qtdUn,
    codigoMotivo: item.codigoMotivo || '533',
    departamento: item.departamento || 'ARMAZEM',
    motivoDescricao: item.motivoDescricao || 'PRODUTO VENCIDO - ARMAZEM',
    precoUnitario: precoUn,
    valorTotal,
    hectolitros,
    fatorHectoPorUnidade: fatorHectoPorUn,
    lote: item.lote || 'LOTE-SHELF',
    validade: item.validade || item.data || new Date().toISOString().substring(0, 10),
    localizacao: item.localizacao || 'Armazém Central',
    bloco: item.bloco || 'Bloco Geral',
    statusEstoque: item.statusEstoque || 'Bloqueado',
    statusDespejo: item.statusDespejo || 'Concluído',
    dataDespejo,
    executadoPor: item.executadoPor || 'Ajudante de Armazém',
    despejoTaskId: item.despejoTaskId,
    observacoes: item.observacoes || '',
    _criadoEm: item._criadoEm || new Date().toISOString(),
    _atualizadoEm: item._atualizadoEm || new Date().toISOString()
  };
}

/**
 * Obtém todos os itens de Shelf armazenados
 */
export function getStoredShelfItems(empresaId: string = 'demo'): ShelfItem[] {
  const key = getShelfStorageKey(empresaId);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      // Inicializa estritamente com os 5 itens enviados pelo usuário
      localStorage.setItem(key, JSON.stringify(SEED_SHELF_ITEMS));
      return SEED_SHELF_ITEMS.map(enrichShelfItem);
    }
    const parsed: any[] = JSON.parse(raw);
    // Atualizar se necessário para garantir coerência dos 5 itens
    const enriched = parsed.map(enrichShelfItem);
    return enriched;
  } catch (e) {
    console.error('Erro ao ler itens de Shelf:', e);
    return SEED_SHELF_ITEMS.map(enrichShelfItem);
  }
}

/**
 * Salva ou atualiza um item de Shelf Life
 */
export function saveShelfItem(itemData: Partial<ShelfItem>, empresaId: string = 'demo'): ShelfItem {
  const currentList = getStoredShelfItems(empresaId);
  const now = new Date();
  const todayISO = now.toISOString().substring(0, 10);

  const enriched = enrichShelfItem({
    ...itemData,
    _atualizadoEm: now.toISOString()
  });

  const existingIdx = currentList.findIndex(i => 
    (itemData.id && i.id === itemData.id) ||
    (i.codigo === enriched.codigo && i.data === enriched.data && i.quantidadeUnidades === enriched.quantidadeUnidades)
  );

  if (existingIdx >= 0) {
    currentList[existingIdx] = enriched;
  } else {
    enriched.id = enriched.id || `shelf-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    enriched.data = enriched.data || todayISO;
    enriched._criadoEm = now.toISOString();
    currentList.unshift(enriched);
  }

  localStorage.setItem(getShelfStorageKey(empresaId), JSON.stringify(currentList));
  window.dispatchEvent(new Event('shelf_updated'));
  window.dispatchEvent(new Event('local_data_changed'));
  window.dispatchEvent(new Event('storage'));

  return enriched;
}

/**
 * Importa múltiplos itens de Shelf Life em lote (manual ou colado de tabela)
 */
export function importShelfItemsBulk(items: Partial<ShelfItem>[], empresaId: string = 'demo'): { importedCount: number; totalShelf: number } {
  const currentList = getStoredShelfItems(empresaId);
  let importedCount = 0;

  items.forEach(it => {
    if (!it.codigo || (!it.quantidadeUnidades && !(it as any).quantidade)) return;
    const enriched = enrichShelfItem(it);
    currentList.unshift(enriched);
    importedCount++;
  });

  localStorage.setItem(getShelfStorageKey(empresaId), JSON.stringify(currentList));
  window.dispatchEvent(new Event('shelf_updated'));
  window.dispatchEvent(new Event('local_data_changed'));
  window.dispatchEvent(new Event('storage'));

  return { importedCount, totalShelf: currentList.length };
}

/**
 * Altera status de despejo de um item de Shelf
 */
export function updateShelfDespejoStatus(
  id: string, 
  status: 'Pendente' | 'Concluído' | 'Em Andamento', 
  executadoPor: string = 'Ajudante de Armazém',
  empresaId: string = 'demo'
): ShelfItem | null {
  const currentList = getStoredShelfItems(empresaId);
  const idx = currentList.findIndex(i => i.id === id);
  if (idx < 0) return null;

  const now = new Date();
  const updated: ShelfItem = {
    ...currentList[idx],
    statusDespejo: status,
    dataDespejo: status === 'Concluído' ? now.toISOString().substring(0, 10) : undefined,
    executadoPor: status === 'Concluído' ? executadoPor : undefined,
    _atualizadoEm: now.toISOString()
  };

  currentList[idx] = updated;
  localStorage.setItem(getShelfStorageKey(empresaId), JSON.stringify(currentList));
  window.dispatchEvent(new Event('shelf_updated'));
  window.dispatchEvent(new Event('local_data_changed'));
  window.dispatchEvent(new Event('storage'));

  return updated;
}

/**
 * Remove um item de Shelf
 */
export function removerShelfItem(id: string, empresaId: string = 'demo'): void {
  const currentList = getStoredShelfItems(empresaId);
  const updated = currentList.filter(i => i.id !== id);
  localStorage.setItem(getShelfStorageKey(empresaId), JSON.stringify(updated));
  window.dispatchEvent(new Event('shelf_updated'));
  window.dispatchEvent(new Event('local_data_changed'));
  window.dispatchEvent(new Event('storage'));
}

/**
 * Reseta a lista de Shelf Life para conter ESTRITAMENTE os 5 itens oficiais do armazém
 */
export function resetShelfToOfficialItems(empresaId: string = 'demo'): ShelfItem[] {
  const key = getShelfStorageKey(empresaId);
  localStorage.setItem(key, JSON.stringify(SEED_SHELF_ITEMS));
  window.dispatchEvent(new Event('shelf_updated'));
  window.dispatchEvent(new Event('local_data_changed'));
  window.dispatchEvent(new Event('storage'));
  return SEED_SHELF_ITEMS.map(enrichShelfItem);
}

