import { Tarefa } from '../types';
import { generateHistoricalTasksYTD, isCleaningProduct } from './generateRessuprimentoData';

const TASKS_STORAGE_PREFIX = 'tasks_';
const TAREFAS_STORAGE_PREFIX = 'tarefas_rows_';

// In-memory cache for high-speed instant access without repeated JSON.parse
const inMemoryTasksCache = new Map<string, Tarefa[]>();

export function invalidateTasksCache(companyId?: string) {
  if (companyId) {
    inMemoryTasksCache.delete(companyId);
  } else {
    inMemoryTasksCache.clear();
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key && (e.key.startsWith(TASKS_STORAGE_PREFIX) || e.key.startsWith(TAREFAS_STORAGE_PREFIX) || e.key === 'tasks_all')) {
      invalidateTasksCache();
    }
  });
}

export function getStoredTasks(companyId: string = 'demo'): Tarefa[] {
  // Check memory cache first
  const memoryCached = inMemoryTasksCache.get(companyId);
  if (memoryCached && memoryCached.length >= 4500) {
    return memoryCached;
  }

  try {
    const saved = localStorage.getItem(`${TASKS_STORAGE_PREFIX}${companyId}`) || 
                  localStorage.getItem(`${TAREFAS_STORAGE_PREFIX}${companyId}`) ||
                  localStorage.getItem('tasks_all');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure we have the complete dataset (>= 4500 tasks) without obsolete small caches and no cleaning products
      if (Array.isArray(parsed) && parsed.length >= 4500) {
        const hasCleaning = parsed.some(t => isCleaningProduct(t.descricao));
        if (!hasCleaning) {
          inMemoryTasksCache.set(companyId, parsed);
          return parsed;
        }
      }
    }
  } catch (e) {
    console.error('Error loading tasks:', e);
  }
  
  // Fallback: populate full unified YTD historical tasks (5109 pallets)
  try {
    const generated = generateHistoricalTasksYTD(companyId);
    if (generated && generated.length > 0) {
      inMemoryTasksCache.set(companyId, generated);
      saveStoredTasks(companyId, generated, false);
      return generated;
    }
  } catch (e) {
    console.error('Error generating fallback historical tasks:', e);
  }

  return [];
}

export function saveStoredTasks(companyId: string = 'demo', tasks: Tarefa[], dispatchEvents: boolean = true) {
  try {
    // Filter any cleaning product before persisting
    const sanitized = tasks.filter(t => !isCleaningProduct(t.descricao));
    inMemoryTasksCache.set(companyId, sanitized);
    localStorage.setItem(`${TASKS_STORAGE_PREFIX}${companyId}`, JSON.stringify(sanitized));
    localStorage.setItem(`${TAREFAS_STORAGE_PREFIX}${companyId}`, JSON.stringify(sanitized));
    localStorage.setItem(`hybrid_col:${companyId}:tarefas`, JSON.stringify(sanitized));
    localStorage.setItem('tasks_all', JSON.stringify(sanitized));
    
    if (dispatchEvents) {
      window.dispatchEvent(new CustomEvent('tasks_updated'));
      window.dispatchEvent(new CustomEvent('tarefas_updated'));
      window.dispatchEvent(new CustomEvent('app_data_updated'));
      window.dispatchEvent(new CustomEvent('local_data_changed'));
    }
  } catch (e) {
    console.error('Error saving tasks:', e);
  }
}

// -------------------------------------------------------------
// JSON IMPORT FOR HISTÓRICO RESSUPRIMENTO (R&R) CONCLUÍDOS
// Model supported:
// {
//   "Data": "2026-01-02T11:59:15",
//   "ID": 1,
//   "Operacao": "Durante o Carregamento",
//   "CodSKU": 20535,
//   "Descricao": "STELLA ARTOIS ONE WAY 600ML CX C/12 NPAL",
//   "QuantidadeCX": 1,
//   "Conferente": "GILSON ROSA DA SILVA",
//   "Operador": "PAULO PEREIRA",
//   "Status": "Concluído",
//   "CriadoEm": "2026-01-02T11:59:15",
//   "IniciadoEm": "2026-01-02T09:01:15.000Z",
//   "FinalizadoEm": "2026-01-02T09:06:15.000Z",
//   "DuracaoMin": 5
// }
// -------------------------------------------------------------

export interface RawRrJsonItem {
  Data?: string;
  data?: string;
  DATA?: string;

  ID?: number | string;
  id?: number | string;
  Id?: number | string;

  Operacao?: string;
  operacao?: string;
  OPERACAO?: string;
  TipoOperacao?: string;
  tipoOperacao?: string;

  CodSKU?: number | string;
  codSKU?: number | string;
  COD_SKU?: number | string;
  codSku?: number | string;
  codigo?: number | string;
  Codigo?: number | string;
  CODIGO?: number | string;
  sku?: number | string;
  SKU?: number | string;

  Descricao?: string;
  descricao?: string;
  DESCRICAO?: string;
  Produto?: string;
  produto?: string;

  QuantidadeCX?: number | string;
  quantidadeCX?: number | string;
  quantidadeCx?: number | string;
  QUANTIDADE_CX?: number | string;
  Quantidade?: number | string;
  quantidade?: number | string;
  QUANTIDADE?: number | string;
  Qtd?: number | string;
  qtd?: number | string;
  Paletes?: number | string;
  paletes?: number | string;

  Conferente?: string;
  conferente?: string;
  CONFERENTE?: string;
  Despachador?: string;
  despachador?: string;

  Operador?: string;
  operador?: string;
  OPERADOR?: string;
  Empilhador?: string;
  empilhador?: string;
  EMPILHADOR?: string;

  Status?: string;
  status?: string;
  STATUS?: string;

  CriadoEm?: string;
  criadoEm?: string;
  CRIADO_EM?: string;
  DataCriacao?: string;
  dataCriacao?: string;

  IniciadoEm?: string;
  iniciadoEm?: string;
  INICIADO_EM?: string;
  Inicio?: string;
  inicio?: string;
  INICIO?: string;

  FinalizadoEm?: string;
  finalizadoEm?: string;
  FINALIZADO_EM?: string;
  Fim?: string;
  fim?: string;
  FIM?: string;

  DuracaoMin?: number | string;
  duracaoMin?: number | string;
  DURACAO_MIN?: number | string;
  Duracao?: number | string;
  duracao?: number | string;
  TempoMin?: number | string;
  tempoMin?: number | string;
}

export interface ParsedRrResult {
  valid: boolean;
  error?: string;
  items: Tarefa[];
  rawCount: number;
  totalDurationMin: number;
  avgDurationMin: number;
  dentroSlaCount: number; // SLA <= 5 min
  foraSlaCount: number;   // SLA > 5 min
  totalCaixas: number;
}

export const SAMPLE_RR_JSON = JSON.stringify([
  {
    "Data": "2026-01-02T11:59:15",
    "ID": 1,
    "Operacao": "Durante o Carregamento",
    "CodSKU": 20535,
    "Descricao": "STELLA ARTOIS ONE WAY 600ML CX C/12 NPAL",
    "QuantidadeCX": 1,
    "Conferente": "GILSON ROSA DA SILVA",
    "Operador": "PAULO PEREIRA",
    "Status": "Concluído",
    "CriadoEm": "2026-01-02T11:59:15",
    "IniciadoEm": "2026-01-02T09:01:15.000Z",
    "FinalizadoEm": "2026-01-02T09:06:15.000Z",
    "DuracaoMin": 5
  },
  {
    "Data": "2026-01-02T12:15:00",
    "ID": 2,
    "Operacao": "Ressuprimento Aéreo",
    "CodSKU": 15420,
    "Descricao": "SKOL PILSEN LATA 350ML CX C/18",
    "QuantidadeCX": 2,
    "Conferente": "GILSON ROSA DA SILVA",
    "Operador": "MARIVALDO",
    "Status": "Concluído",
    "CriadoEm": "2026-01-02T12:15:00",
    "IniciadoEm": "2026-01-02T09:20:00.000Z",
    "FinalizadoEm": "2026-01-02T09:24:00.000Z",
    "DuracaoMin": 4
  },
  {
    "Data": "2026-01-02T13:00:10",
    "ID": 3,
    "Operacao": "Ressuprimento Picking",
    "CodSKU": 30211,
    "Descricao": "BRAHMA CHOPP 350ML CX C/12",
    "QuantidadeCX": 1,
    "Conferente": "ANTONIO CARLOS",
    "Operador": "PAULO PEREIRA",
    "Status": "Concluído",
    "CriadoEm": "2026-01-02T13:00:10",
    "IniciadoEm": "2026-01-02T10:10:00.000Z",
    "FinalizadoEm": "2026-01-02T10:18:00.000Z",
    "DuracaoMin": 8
  }
], null, 2);

export function parseRrJson(jsonString: string, companyId: string = 'demo'): ParsedRrResult {
  try {
    const trimmed = jsonString.trim();
    if (!trimmed) {
      return {
        valid: false,
        error: 'Conteúdo JSON vazio.',
        items: [],
        rawCount: 0,
        totalDurationMin: 0,
        avgDurationMin: 0,
        dentroSlaCount: 0,
        foraSlaCount: 0,
        totalCaixas: 0
      };
    }

    let parsed: any;
    try {
      parsed = JSON.parse(trimmed);
    } catch (e: any) {
      return {
        valid: false,
        error: `JSON mal formatado: ${e.message}`,
        items: [],
        rawCount: 0,
        totalDurationMin: 0,
        avgDurationMin: 0,
        dentroSlaCount: 0,
        foraSlaCount: 0,
        totalCaixas: 0
      };
    }

    const rawList: RawRrJsonItem[] = Array.isArray(parsed) ? parsed : [parsed];

    if (rawList.length === 0) {
      return {
        valid: false,
        error: 'Nenhum registro encontrado no JSON.',
        items: [],
        rawCount: 0,
        totalDurationMin: 0,
        avgDurationMin: 0,
        dentroSlaCount: 0,
        foraSlaCount: 0,
        totalCaixas: 0
      };
    }

    const items: Tarefa[] = [];
    let totalDuration = 0;
    let dentroSla = 0;
    let foraSla = 0;
    let totalCx = 0;

    for (let i = 0; i < rawList.length; i++) {
      const raw = rawList[i];
      if (!raw || typeof raw !== 'object') continue;

      const rawSku = raw.CodSKU ?? raw.codSKU ?? raw.COD_SKU ?? raw.codSku ?? raw.codigo ?? raw.Codigo ?? raw.CODIGO ?? raw.sku ?? raw.SKU ?? 0;
      const codigo = Number(rawSku) || 0;

      const rawDescricao = raw.Descricao || raw.descricao || raw.DESCRICAO || raw.Produto || raw.produto || `SKU ${codigo || 'Desconhecido'}`;
      
      const rawQtd = raw.QuantidadeCX ?? raw.quantidadeCX ?? raw.quantidadeCx ?? raw.QUANTIDADE_CX ?? raw.Quantidade ?? raw.quantidade ?? raw.QUANTIDADE ?? raw.Qtd ?? raw.qtd ?? raw.Paletes ?? raw.paletes ?? 1;
      const quantidade = Number(rawQtd) || 1;
      const caixas = quantidade;

      const operador = (raw.Operador || raw.operador || raw.OPERADOR || raw.Empilhador || raw.empilhador || raw.EMPILHADOR || 'OP NÃO DEFINIDO').trim().toUpperCase();
      const conferente = (raw.Conferente || raw.conferente || raw.CONFERENTE || raw.Despachador || raw.despachador || 'SISTEMA').trim().toUpperCase();
      const tipoOperacao = (raw.Operacao || raw.operacao || raw.OPERACAO || raw.TipoOperacao || raw.tipoOperacao || 'Durante o Carregamento').trim();

      const rawCriado = raw.CriadoEm || raw.criadoEm || raw.CRIADO_EM || raw.DataCriacao || raw.dataCriacao || raw.Data || raw.data || raw.DATA || new Date().toISOString();
      const rawInicio = raw.IniciadoEm || raw.iniciadoEm || raw.INICIADO_EM || raw.Inicio || raw.inicio || raw.INICIO || rawCriado;
      const rawFim = raw.FinalizadoEm || raw.finalizadoEm || raw.FINALIZADO_EM || raw.Fim || raw.fim || raw.FIM || undefined;

      let duracaoMin = 0;
      if (raw.DuracaoMin !== undefined && raw.DuracaoMin !== null && !isNaN(Number(raw.DuracaoMin))) {
        duracaoMin = Number(raw.DuracaoMin);
      } else if (raw.duracaoMin !== undefined && raw.duracaoMin !== null && !isNaN(Number(raw.duracaoMin))) {
        duracaoMin = Number(raw.duracaoMin);
      } else if (rawInicio && rawFim) {
        const start = new Date(rawInicio).getTime();
        const end = new Date(rawFim).getTime();
        if (!isNaN(start) && !isNaN(end) && end >= start) {
          duracaoMin = Math.max(1, Math.round((end - start) / 60000));
        }
      }

      if (duracaoMin <= 0) {
        duracaoMin = 5; // Default 5 min
      }

      totalDuration += duracaoMin;
      totalCx += quantidade;

      // SLA standard for picking / replenishment: <= 5 min
      if (duracaoMin <= 5) {
        dentroSla++;
      } else {
        foraSla++;
      }

      const idVal = raw.ID ?? raw.id ?? raw.Id ?? `rr_${Date.now()}_${i}_${Math.floor(Math.random() * 1000)}`;

      const item: Tarefa = {
        _docId: `rr_imported_${idVal}`,
        empresaId: companyId,
        id: typeof idVal === 'number' ? idVal : String(idVal),
        codigo,
        descricao: rawDescricao,
        quantidade,
        quantidadePaletes: quantidade,
        caixas,
        conferente,
        operador,
        status: 'done',
        criadoEm: rawCriado,
        iniciadoEm: rawInicio,
        finalizadoEm: rawFim || rawInicio,
        duracaoMin,
        tempoExecucao: duracaoMin,
        tipoOperacao
      };

      items.push(item);
    }

    if (items.length === 0) {
      return {
        valid: false,
        error: 'Nenhum registro com SKU ou descrição válida foi encontrado no arquivo JSON.',
        items: [],
        rawCount: rawList.length,
        totalDurationMin: 0,
        avgDurationMin: 0,
        dentroSlaCount: 0,
        foraSlaCount: 0,
        totalCaixas: 0
      };
    }

    const avgDurationMin = Math.round((totalDuration / items.length) * 10) / 10;

    return {
      valid: true,
      items,
      rawCount: rawList.length,
      totalDurationMin: totalDuration,
      avgDurationMin,
      dentroSlaCount: dentroSla,
      foraSlaCount: foraSla,
      totalCaixas: totalCx
    };
  } catch (err: any) {
    return {
      valid: false,
      error: `Erro ao processar JSON: ${err.message || err}`,
      items: [],
      rawCount: 0,
      totalDurationMin: 0,
      avgDurationMin: 0,
      dentroSlaCount: 0,
      foraSlaCount: 0,
      totalCaixas: 0
    };
  }
}

export function importCompletedRrJsonBatch(
  companyId: string = 'demo',
  newItems: Tarefa[],
  mode: 'merge' | 'replace' = 'merge'
): { success: boolean; count: number } {
  try {
    const existing = getStoredTasks(companyId);

    let updatedList: Tarefa[] = [];

    if (mode === 'replace') {
      // Keep only active tasks (status !== 'done') and replace done tasks with newItems
      const activeTasks = existing.filter(t => t.status !== 'done');
      updatedList = [...newItems, ...activeTasks];
    } else {
      // Merge mode: Add newItems, avoiding exact duplicates by id or (codigo + operador + iniciadoEm)
      const existingSignatures = new Set<string>();
      existing.forEach(t => {
        existingSignatures.add(String(t.id).trim());
        existingSignatures.add(`${t.codigo}_${t.operador}_${t.iniciadoEm || t.criadoEm}`);
      });

      const uniqueNewItems = newItems.filter(item => {
        const sig1 = String(item.id).trim();
        const sig2 = `${item.codigo}_${item.operador}_${item.iniciadoEm || item.criadoEm}`;
        return !existingSignatures.has(sig1) && !existingSignatures.has(sig2);
      });

      updatedList = [...uniqueNewItems, ...existing];
    }

    saveStoredTasks(companyId, updatedList);
    return { success: true, count: newItems.length };
  } catch (e) {
    console.error('Failed to import RR JSON batch:', e);
    return { success: false, count: 0 };
  }
}
