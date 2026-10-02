import { TmrDemand } from '../types';

const TMR_STORAGE_PREFIX = 'tmr_demands_';

export function getStoredTmrDemands(companyId: string = 'demo'): TmrDemand[] {
  try {
    const saved = localStorage.getItem(`${TMR_STORAGE_PREFIX}${companyId}`);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error loading TMR demands:', e);
  }
  return [];
}

export function saveTmrDemands(companyId: string = 'demo', demands: TmrDemand[]) {
  try {
    localStorage.setItem(`${TMR_STORAGE_PREFIX}${companyId}`, JSON.stringify(demands));
    window.dispatchEvent(new Event('tmr_demands_updated'));
  } catch (e) {
    console.error('Error saving TMR demands:', e);
  }
}

export function addTmrDemand(
  companyId: string = 'demo', 
  payload: Omit<TmrDemand, 'id' | 'empresaId' | 'status' | 'criadoEm'>
): TmrDemand {
  const current = getStoredTmrDemands(companyId);
  const totalPallets = (payload.palletsLitrinho || 0) + 
                       (payload.palletsLitrao || 0) + 
                       (payload.pallets600Verde || 0) + 
                       (payload.pallets600Ambar || 0) + 
                       (payload.palletsPbr1 || 0) + 
                       (payload.palletsPbr2 || 0) + 
                       (payload.palletsPbr || 0);

  const newDemand: TmrDemand = {
    ...payload,
    id: `tmr_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    empresaId: companyId,
    totalPallets,
    status: 'pending',
    criadoEm: new Date().toISOString()
  };

  const updated = [newDemand, ...current];
  saveTmrDemands(companyId, updated);
  return newDemand;
}

export function updateTmrDemandStatus(
  companyId: string = 'demo',
  id: string,
  status: 'in_progress' | 'done',
  userExecutor: string
) {
  const current = getStoredTmrDemands(companyId);
  const nowISO = new Date().toISOString();

  const updated = current.map(item => {
    if (item.id === id) {
      if (status === 'in_progress') {
        return {
          ...item,
          status: 'in_progress' as const,
          iniciadoEm: item.iniciadoEm || nowISO,
          operadorExecutor: userExecutor
        };
      } else if (status === 'done') {
        const startTs = item.iniciadoEm ? new Date(item.iniciadoEm).getTime() : new Date().getTime();
        const durationMin = Math.max(1, Math.round((new Date(nowISO).getTime() - startTs) / 60000));
        return {
          ...item,
          status: 'done' as const,
          finalizadoEm: nowISO,
          duracaoMin: durationMin,
          operadorExecutor: userExecutor
        };
      }
    }
    return item;
  });

  saveTmrDemands(companyId, updated);
}

export function deleteTmrDemand(companyId: string = 'demo', id: string) {
  const current = getStoredTmrDemands(companyId);
  const updated = current.filter(t => t.id !== id);
  saveTmrDemands(companyId, updated);
}

export function updateTmrDemandOperators(
  companyId: string = 'demo',
  id: string,
  opName: string,
  opArray?: string[]
) {
  const current = getStoredTmrDemands(companyId);
  const updated = current.map(item => {
    if (item.id === id) {
      return {
        ...item,
        operadorDesignado: opName || 'TODOS',
        operadoresAtribuidos: opArray && opArray.length > 0 ? opArray : undefined
      };
    }
    return item;
  });
  saveTmrDemands(companyId, updated);
}

export function updateTmrDemand(
  companyId: string = 'demo',
  id: string,
  updates: Partial<TmrDemand>
) {
  const current = getStoredTmrDemands(companyId);
  const updated = current.map(item => {
    if (item.id === id) {
      const merged = { ...item, ...updates };
      const totalPallets = (merged.palletsLitrinho || 0) + 
                           (merged.palletsLitrao || 0) + 
                           (merged.pallets600Verde || 0) + 
                           (merged.pallets600Ambar || 0) + 
                           (merged.palletsPbr1 || 0) + 
                           (merged.palletsPbr2 || 0) + 
                           (merged.palletsPbr || 0);
      return { ...merged, totalPallets };
    }
    return item;
  });
  saveTmrDemands(companyId, updated);
}

// -------------------------------------------------------------
// JSON IMPORT FOR HISTÓRICO TMR CONCLUÍDOS
// Model supported:
// {
//   "CARRETA": "RLT5J54",
//   "EMPILHADOR": "MARIVALDO",
//   "TURNO": "TURNO A",
//   "INICIO": "2026-01-04T14:40:00",
//   "FIM": "2026-01-04T16:30:00"
// }
// -------------------------------------------------------------

export interface RawTmrJsonItem {
  CARRETA?: string;
  carreta?: string;
  Carreta?: string;
  PLACA?: string;
  placa?: string;
  VEICULO?: string;
  veiculo?: string;

  EMPILHADOR?: string;
  empilhador?: string;
  Empilhador?: string;
  OPERADOR?: string;
  operador?: string;
  MOTORISTA?: string;

  TURNO?: string;
  turno?: string;
  Turno?: string;

  INICIO?: string;
  inicio?: string;
  Inicio?: string;
  DATA_INICIO?: string;
  dataInicio?: string;
  START?: string;
  start?: string;
  INICIO_OPERACAO?: string;

  FIM?: string;
  fim?: string;
  Fim?: string;
  DATA_FIM?: string;
  dataFim?: string;
  END?: string;
  end?: string;
  FIM_OPERACAO?: string;

  REVENDA?: string;
  revenda?: string;
  DESTINO?: string;
  destino?: string;
  CLIENTE?: string;

  TIPO_CARGA?: string;
  tipoCarga?: string;
  TIPO?: string;
  tipo?: string;

  PALLETS?: number | string;
  pallets?: number | string;
  QTD_PALLETS?: number | string;
  QUANTIDADE?: number | string;
  caixas?: number | string;
  [key: string]: any;
}

export interface ParsedTmrResult {
  valid: boolean;
  error?: string;
  items: TmrDemand[];
  rawCount: number;
  totalDurationMin: number;
  avgDurationMin: number;
  dentroSlaCount: number;
  foraSlaCount: number;
}

export const SAMPLE_TMR_JSON = `[
  {
    "CARRETA": "RLT5J54",
    "EMPILHADOR": "MARIVALDO",
    "TURNO": "TURNO A",
    "INICIO": "2026-01-04T14:40:00",
    "FIM": "2026-01-04T16:30:00"
  },
  {
    "CARRETA": "QFS8B22",
    "EMPILHADOR": "PAULO PEREIRA",
    "TURNO": "TURNO B",
    "INICIO": "2026-01-04T17:00:00",
    "FIM": "2026-01-04T18:45:00"
  }
]`;

export function parseTmrJson(jsonContent: string | any, companyId: string = 'demo'): ParsedTmrResult {
  try {
    let parsed: any = jsonContent;
    if (typeof jsonContent === 'string') {
      const trimmed = jsonContent.trim();
      if (!trimmed) {
        return {
          valid: false,
          error: 'O conteúdo JSON fornecido está vazio.',
          items: [],
          rawCount: 0,
          totalDurationMin: 0,
          avgDurationMin: 0,
          dentroSlaCount: 0,
          foraSlaCount: 0
        };
      }
      parsed = JSON.parse(trimmed);
    }

    // Extract list if wrapped in an object property (e.g. { dados: [...] } or { tmr: [...] })
    let rawList: any[] = [];
    if (Array.isArray(parsed)) {
      rawList = parsed;
    } else if (parsed && typeof parsed === 'object') {
      if (Array.isArray(parsed.tmr)) rawList = parsed.tmr;
      else if (Array.isArray(parsed.dados)) rawList = parsed.dados;
      else if (Array.isArray(parsed.historico)) rawList = parsed.historico;
      else if (Array.isArray(parsed.itens)) rawList = parsed.itens;
      else if (Array.isArray(parsed.carretas)) rawList = parsed.carretas;
      else {
        // Single object provided
        rawList = [parsed];
      }
    }

    if (rawList.length === 0) {
      return {
        valid: false,
        error: 'Nenhum registro encontrado no arquivo JSON.',
        items: [],
        rawCount: 0,
        totalDurationMin: 0,
        avgDurationMin: 0,
        dentroSlaCount: 0,
        foraSlaCount: 0
      };
    }

    const items: TmrDemand[] = [];
    let totalDuration = 0;
    let dentroSla = 0;
    let foraSla = 0;

    rawList.forEach((row, index) => {
      if (!row || typeof row !== 'object') return;

      const carreta = (
        row.CARRETA || 
        row.carreta || 
        row.Carreta || 
        row.PLACA || 
        row.placa || 
        row.VEICULO || 
        row.veiculo || 
        `CARRETA-${index + 1}`
      ).toString().trim().toUpperCase();

      const empilhador = (
        row.EMPILHADOR || 
        row.empilhador || 
        row.Empilhador || 
        row.OPERADOR || 
        row.operador || 
        row.MOTORISTA || 
        'MARIVALDO'
      ).toString().trim().toUpperCase();

      const turno = (
        row.TURNO || 
        row.turno || 
        row.Turno || 
        'TURNO A'
      ).toString().trim();

      const inicioStr = (
        row.INICIO || 
        row.inicio || 
        row.Inicio || 
        row.DATA_INICIO || 
        row.dataInicio || 
        row.START || 
        row.start || 
        row.INICIO_OPERACAO || 
        new Date().toISOString()
      ).toString().trim();

      const fimStr = (
        row.FIM || 
        row.fim || 
        row.Fim || 
        row.DATA_FIM || 
        row.dataFim || 
        row.END || 
        row.end || 
        row.FIM_OPERACAO || 
        inicioStr
      ).toString().trim();

      const revendaNome = (
        row.REVENDA || 
        row.revenda || 
        row.DESTINO || 
        row.destino || 
        row.CLIENTE || 
        `Revenda ${carreta}`
      ).toString().trim();

      const tipoCarga = (
        row.TIPO_CARGA || 
        row.tipoCarga || 
        row.TIPO || 
        row.tipo || 
        'TMR Revenda'
      ).toString().trim();

      const rawPallets = Number(row.PALLETS ?? row.pallets ?? row.QTD_PALLETS ?? row.QUANTIDADE ?? 26);
      const palletsCount = !isNaN(rawPallets) && rawPallets > 0 ? rawPallets : 26;

      // Calculate duration in minutes
      let durationMin = 0;
      try {
        const startTs = new Date(inicioStr).getTime();
        const endTs = new Date(fimStr).getTime();
        if (!isNaN(startTs) && !isNaN(endTs) && endTs >= startTs) {
          durationMin = Math.max(1, Math.round((endTs - startTs) / 60000));
        } else {
          durationMin = 90; // Default fallback
        }
      } catch (e) {
        durationMin = 90;
      }

      totalDuration += durationMin;

      // SLA check: 150 min for Carreta, 50 min for Recarga/Terceiros
      const isRecarga = tipoCarga.toLowerCase().includes('recarga') || tipoCarga.toLowerCase().includes('terceir');
      const slaTarget = isRecarga ? 50 : 150;
      if (durationMin <= slaTarget) {
        dentroSla++;
      } else {
        foraSla++;
      }

      // Generate deterministic ID or timestamp ID
      const safeId = `tmr_json_${carreta.replace(/[^A-Z0-9]/gi, '')}_${inicioStr.replace(/[^0-9]/g, '')}_${index}`;

      const demand: TmrDemand = {
        id: safeId,
        empresaId: companyId,
        carreta,
        revendaNome,
        tipoCarga: tipoCarga as any,
        tipoPlaca: carreta.includes('TERC') ? 'terceiros' : 'casa',
        isTerceiros: carreta.includes('TERC'),
        instrucoes: `Turno: ${turno} · Importado via JSON`,
        palletsLitrinho: 0,
        palletsLitrao: 0,
        pallets600Verde: 0,
        pallets600Ambar: 0,
        palletsPbr: palletsCount,
        totalPallets: palletsCount,
        conferente: 'SISTEMA / IMPORTAÇÃO JSON',
        operadorDesignado: empilhador,
        operadorExecutor: empilhador,
        operadoresAtribuidos: [empilhador],
        status: 'done',
        criadoEm: inicioStr,
        dataHoraCriacao: inicioStr,
        iniciadoEm: inicioStr,
        dataHoraInicio: inicioStr,
        finalizadoEm: fimStr,
        dataHoraFim: fimStr,
        duracaoMin: durationMin,
        tempoTotalMinutos: durationMin
      };

      items.push(demand);
    });

    const avgDuration = items.length > 0 ? Math.round(totalDuration / items.length) : 0;

    return {
      valid: items.length > 0,
      items,
      rawCount: rawList.length,
      totalDurationMin: totalDuration,
      avgDurationMin: avgDuration,
      dentroSlaCount: dentroSla,
      foraSlaCount: foraSla
    };
  } catch (err: any) {
    return {
      valid: false,
      error: `Falha ao processar arquivo JSON: ${err.message || String(err)}`,
      items: [],
      rawCount: 0,
      totalDurationMin: 0,
      avgDurationMin: 0,
      dentroSlaCount: 0,
      foraSlaCount: 0
    };
  }
}

export function importCompletedTmrJsonBatch(
  companyId: string = 'demo',
  importedItems: TmrDemand[],
  mode: 'merge' | 'replace' = 'merge'
): { success: boolean; count: number; totalStored: number } {
  try {
    const existing = getStoredTmrDemands(companyId);
    let finalDemands: TmrDemand[] = [];

    if (mode === 'replace') {
      // Keep pending/in_progress, replace done ones with new ones
      const pendingAndActive = existing.filter(d => d.status !== 'done');
      finalDemands = [...importedItems, ...pendingAndActive];
    } else {
      // Merge with deduplication (by carreta + iniciadoEm or id)
      const existingMap = new Map<string, TmrDemand>();
      
      // Load current ones
      existing.forEach(item => {
        const key = `${item.carreta}_${item.iniciadoEm || item.criadoEm || item.id}`;
        existingMap.set(key, item);
      });

      // Overlay new imported ones
      importedItems.forEach(item => {
        const key = `${item.carreta}_${item.iniciadoEm || item.criadoEm || item.id}`;
        existingMap.set(key, item);
      });

      finalDemands = Array.from(existingMap.values());
    }

    saveTmrDemands(companyId, finalDemands);

    // Also trigger custom event for reactive dashboard update
    window.dispatchEvent(new CustomEvent('tmr_history_imported', { 
      detail: { count: importedItems.length, total: finalDemands.length } 
    }));

    return {
      success: true,
      count: importedItems.length,
      totalStored: finalDemands.length
    };
  } catch (err) {
    console.error('Error saving imported TMR JSON:', err);
    return {
      success: false,
      count: 0,
      totalStored: 0
    };
  }
}

