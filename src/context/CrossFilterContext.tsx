import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { Filter, X, RotateCcw } from 'lucide-react';

export interface CrossFilterContextType {
  /** Map of active field filters, e.g. { motorista: 'João Silva', produto: 'SKOL 600ML' } */
  filters: Record<string, string | number>;
  /** Map of user-friendly field labels for display, e.g. { motorista: 'Motorista', produto: 'Produto' } */
  fieldLabels: Record<string, string>;
  /** Toggle filter value on or off */
  toggleFilter: (field: string, value: string | number, fieldLabel?: string) => void;
  /** Explicitly set a filter value */
  setFilter: (field: string, value: string | number, fieldLabel?: string) => void;
  /** Remove a specific filter */
  removeFilter: (field: string) => void;
  /** Clear all active filters */
  clearAllFilters: () => void;
  /** Check if a field (or specific field+value) is active */
  isFiltered: (field: string, value?: string | number) => boolean;
  /** Number of active filters */
  filterCount: number;
  /** Global measurement unit filter: 'HL' (Hectolitros) or 'RS' (Reais R$) */
  unidadeMedida: 'HL' | 'RS';
  /** Set the global unit of measurement */
  setUnidadeMedida: (unit: 'HL' | 'RS') => void;
  /** Active start date filter (ISO YYYY-MM-DD) */
  startDate: string;
  /** Active end date filter (ISO YYYY-MM-DD) */
  endDate: string;
  /** Set active date range */
  setDateRange: (start: string, end: string) => void;
  /** Utility to filter any dataset using active filters (optionally excluding a dimension) */
  filterData: <T>(
    data: T[],
    valueGetter?: (item: T, field: string) => string | number | undefined,
    excludeField?: string
  ) => T[];
}

// Memoized cache for fast packaging and group lookups
const embalagemNameCache = new Map<string, string>();
const grupoNameCache = new Map<string, string>();

export const getEmbalagemName = (desc: string): string => {
  if (!desc) return 'Outras Embalagens';
  const cached = embalagemNameCache.get(desc);
  if (cached !== undefined) return cached;

  const d = desc.toUpperCase();
  let res = 'Outras Embalagens';
  if (d.includes('600')) res = 'Garrafa 600ml';
  else if (d.includes('300') || d.includes('RF') || d.includes('ROMANI') || d.includes('RETORNÁVEL') || d.includes('RETORNAVEL')) res = 'Garrafa 300ml';
  else if (d.includes('473') || d.includes('LATÃO') || d.includes('LATAO') || d.includes('SLEEK')) res = 'Lata 473ml';
  else if (d.includes('350') || d.includes('355') || d.includes('269') || d.includes('LATA') || d.includes('LT')) res = 'Lata 350ml/269ml';
  else if (d.includes('LN') || d.includes('LONG') || d.includes('330') || d.includes('275')) res = 'Long Neck';
  else if (d.includes('1L') || d.includes('1 L') || d.includes('LITRÃO') || d.includes('LITRAO') || d.includes('1000')) res = 'Garrafa 1L';
  else if (d.includes('PET') || d.includes('2L') || d.includes('1.5L')) res = 'PET';

  embalagemNameCache.set(desc, res);
  return res;
};

export const getGrupoName = (desc: string): string => {
  if (!desc) return 'Cervejas';
  const cached = grupoNameCache.get(desc);
  if (cached !== undefined) return cached;

  const d = desc.toUpperCase();
  let res = 'Cervejas';
  if (
    d.includes('GUARANA') || d.includes('PEPSI') || d.includes('SUKITA') || 
    d.includes('SODA') || d.includes('H2OH') || d.includes('TONICA') || d.includes('CITRUS')
  ) {
    res = 'Refrigerantes';
  } else if (
    d.includes('RED BULL') || d.includes('GATORADE') || d.includes('MONSTER') || d.includes('TNT')
  ) {
    res = 'Energéticos & NABS';
  } else if (
    d.includes('AGUA') || d.includes('ÁGUA') || d.includes('INDAIA') || 
    d.includes('INDAIÁ') || d.includes('DAVILA') || d.includes('SUCO') || d.includes('DEL VALLE')
  ) {
    res = 'Águas & Sucos';
  } else if (
    d.includes('BEATS') || d.includes('SMIRNOFF') || d.includes('WALKER') || 
    d.includes('TANQUERAY') || d.includes('PITU') || d.includes('PITÚ') || 
    d.includes('WHISKY') || d.includes('GIN') || d.includes('VODKA') || 
    d.includes('BALLANTINES') || d.includes('PASSPORT') || d.includes('ICE')
  ) {
    res = 'Destilados & Beats';
  } else if (d.includes('TRIDENT') || d.includes('HALLS')) {
    res = 'Confeitaria / Outros';
  }

  grupoNameCache.set(desc, res);
  return res;
};

const CrossFilterContext = createContext<CrossFilterContextType | null>(null);

export const CrossFilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [filters, setFilters] = useState<Record<string, string | number>>({});
  const [fieldLabels, setFieldLabels] = useState<Record<string, string>>({});
  const [unidadeMedida, setUnidadeMedidaState] = useState<'HL' | 'RS'>('HL');
  const [startDate, setStartDateState] = useState<string>('');
  const [endDate, setEndDateState] = useState<string>('');

  const setUnidadeMedida = useCallback((unit: 'HL' | 'RS') => {
    setUnidadeMedidaState(unit);
    setFilters(prev => ({ ...prev, unidadeMedida: unit }));
    setFieldLabels(prev => ({ ...prev, unidadeMedida: 'Unidade de Medida' }));
  }, []);

  const setDateRange = useCallback((start: string, end: string) => {
    setStartDateState(start);
    setEndDateState(end);
    setFilters(prev => {
      const next = { ...prev };
      if (start) next.dataInicio = start;
      else delete next.dataInicio;

      if (end) next.dataFim = end;
      else delete next.dataFim;
      return next;
    });

    if (start) setFieldLabels(prev => ({ ...prev, dataInicio: 'Data Início' }));
    if (end) setFieldLabels(prev => ({ ...prev, dataFim: 'Data Fim' }));
  }, []);

  const toggleFilter = useCallback((field: string, value: string | number, fieldLabel?: string) => {
    if (value === undefined || value === null || value === '') return;
    setFilters(prev => {
      const next = { ...prev };
      const valStr = String(value);
      const currentValStr = next[field] !== undefined ? String(next[field]) : undefined;

      if (currentValStr === valStr) {
        delete next[field];
      } else {
        next[field] = value;
      }
      return next;
    });

    if (fieldLabel) {
      setFieldLabels(prev => ({ ...prev, [field]: fieldLabel }));
    }
  }, []);

  const setFilter = useCallback((field: string, value: string | number, fieldLabel?: string) => {
    if (value === undefined || value === null || value === '') return;
    setFilters(prev => ({ ...prev, [field]: value }));
    if (fieldLabel) {
      setFieldLabels(prev => ({ ...prev, [field]: fieldLabel }));
    }
  }, []);

  const removeFilter = useCallback((field: string) => {
    setFilters(prev => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
    if (field === 'dataInicio') setStartDateState('');
    if (field === 'dataFim') setEndDateState('');
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters({});
    setStartDateState('');
    setEndDateState('');
  }, []);

  const isFiltered = useCallback((field: string, value?: string | number) => {
    if (value === undefined) {
      return filters[field] !== undefined;
    }
    return String(filters[field]) === String(value);
  }, [filters]);

  const filterCount = useMemo(() => Object.keys(filters).length, [filters]);

  const filterData = useCallback(<T,>(
    data: T[],
    valueGetter?: (item: T, field: string) => string | number | undefined,
    excludeField?: string
  ): T[] => {
    if (!data || data.length === 0) return [];
    const activeKeys = Object.keys(filters).filter(k => k !== excludeField && k !== 'unidadeMedida');
    if (activeKeys.length === 0) return data;

    const toISODate = (val: any): string => {
      if (!val) return '';
      const str = String(val).trim().split('T')[0].split(' ')[0];
      if (str.includes('/')) {
        const parts = str.split('/');
        if (parts.length === 3) {
          const dd = parts[0].padStart(2, '0');
          const mm = parts[1].padStart(2, '0');
          const yyyy = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
          return `${yyyy}-${mm}-${dd}`;
        }
      }
      return str;
    };

    return data.filter(item => {
      return activeKeys.every(field => {
        const targetVal = filters[field];
        if (targetVal === undefined || targetVal === null || targetVal === 'todos' || targetVal === 'TODOS') {
          return true;
        }

        const obj = item as Record<string, any>;

        if (field === 'dataInicio') {
          const itemDate = toISODate(obj.dataISO || obj.data || obj.criadoEm || obj.validade || obj.dataConclusao);
          if (itemDate && itemDate < String(targetVal)) return false;
          return true;
        }

        if (field === 'dataFim') {
          const itemDate = toISODate(obj.dataISO || obj.data || obj.criadoEm || obj.validade || obj.dataConclusao);
          if (itemDate && itemDate > String(targetVal)) return false;
          return true;
        }

        let actualVal: any = undefined;
        if (valueGetter) {
          actualVal = valueGetter(item, field);
        }

        if (actualVal === undefined) {
          // Special domain field matching logic
          if (field === 'motivo' || field === 'codQuebra') {
            const cod = String(obj.codQuebra || '').trim().toLowerCase();
            const mot = String(obj.motivo || '').trim().toLowerCase();
            const combined = `${cod} - ${mot}`.toLowerCase();
            const tgt = String(targetVal).trim().toLowerCase();

            // 1. Exact match on combined string ("578 - vazamento")
            if (tgt === combined) return true;
            // 2. Exact match on code ("578")
            if (tgt === cod) return true;

            // 3. If target contains code prefix like "578 - VAZAMENTO"
            if (tgt.includes('-')) {
              const tgtParts = tgt.split('-');
              const tgtCode = tgtParts[0].trim();
              const tgtMot = tgtParts.slice(1).join('-').trim();
              if (/^\d+$/.test(tgtCode) && cod) {
                return cod === tgtCode;
              }
              if (tgtMot && mot) {
                return mot === tgtMot;
              }
            }

            // 4. Exact match on motivo
            if (tgt === mot) return true;

            return false;
          }

          if (field === 'grupo') {
            const desc = String(obj.descricao || obj.produto || '').toUpperCase();
            const gName = getGrupoName(desc).toLowerCase();
            return gName === String(targetVal).trim().toLowerCase();
          }

          if (field === 'embalagem') {
            const desc = String(obj.descricao || obj.produto || '').toUpperCase();
            const embName = getEmbalagemName(desc).toLowerCase();
            return embName === String(targetVal).trim().toLowerCase();
          }

          if (field === 'area') {
            const a = String(obj.area || '').trim().toLowerCase();
            const tgt = String(targetVal).trim().toLowerCase();
            if (a === tgt) return true;
            if (tgt.includes('armaz') && a.includes('armaz')) return true;
            if (tgt.includes('entrega') && a.includes('entrega')) return true;
            if (tgt.includes('mercado') && a.includes('mercado')) return true;
            if (tgt.includes('puxada') && a.includes('puxada')) return true;
            return false;
          }

          if (field === 'turno') {
            const t = String(obj.turno || '').trim().toUpperCase();
            const norm = t.includes('MANHÃ') || t.includes('MANHA') ? 'MANHÃ' : 'NOITE / MADRUGADA';
            const tgt = String(targetVal).trim().toUpperCase();
            return tgt.includes(norm) || norm.includes(tgt) || t === tgt;
          }

          if (field === 'data') {
            const tgt = String(targetVal).trim();
            const rawData = String(obj.data || '').trim();
            const rawISO = String(obj.dataISO || '').trim().split('T')[0];

            const candidates = new Set<string>();

            if (rawData) {
              candidates.add(rawData);
              if (rawData.includes('/')) {
                const parts = rawData.split('/');
                if (parts.length >= 2) {
                  const dd = parts[0].padStart(2, '0');
                  const mm = parts[1].padStart(2, '0');
                  candidates.add(`${dd}/${mm}`);
                  if (parts.length === 3) {
                    const yyyy = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
                    candidates.add(`${dd}/${mm}/${yyyy}`);
                    candidates.add(`${yyyy}-${mm}-${dd}`);
                  }
                }
              } else if (rawData.includes('-')) {
                const parts = rawData.split('-');
                if (parts.length === 3) {
                  const [yyyy, mm, dd] = parts;
                  candidates.add(`${dd}/${mm}`);
                  candidates.add(`${dd}/${mm}/${yyyy}`);
                  candidates.add(`${yyyy}-${mm}-${dd}`);
                }
              }
            }

            if (rawISO && rawISO.includes('-')) {
              const parts = rawISO.split('-');
              if (parts.length === 3) {
                const [yyyy, mm, dd] = parts;
                candidates.add(`${dd}/${mm}`);
                candidates.add(`${dd}/${mm}/${yyyy}`);
                candidates.add(`${yyyy}-${mm}-${dd}`);
              }
            }

            if (candidates.has(tgt)) return true;
            return Array.from(candidates).some(c => c === tgt || c.startsWith(tgt) || tgt.startsWith(c));
          }

          if (field === 'motorista' || field === 'responsavel') {
            const m = String(obj.motorista || obj.responsavel || obj.conferente || '').trim().toLowerCase();
            const tgt = String(targetVal).trim().toLowerCase();
            return m === tgt || m.includes(tgt) || tgt.includes(m);
          }

          if (field === 'cd' || field === 'unidade' || field === 'filial') {
            const cdVal = String(obj.cd || obj.unidade || obj.filial || '').trim().toLowerCase();
            const tgt = String(targetVal).trim().toLowerCase();
            return cdVal === tgt || cdVal.includes(tgt) || tgt.includes(cdVal);
          }

          if (field === 'produto' || field === 'descricao' || field === 'codProduto') {
            const pDesc = String(obj.descricao || obj.produto || '').trim().toLowerCase();
            const pCod = String(obj.codProduto || '').trim().toLowerCase();
            const tgt = String(targetVal).trim().toLowerCase();
            if (!tgt) return true;
            if (pCod && (pCod === tgt || tgt.startsWith(pCod + ' ') || tgt.includes('sku ' + pCod) || tgt.includes(pCod + ' -'))) return true;
            if (pDesc && (pDesc === tgt || pDesc.includes(tgt) || tgt.includes(pDesc))) return true;
            return false;
          }

          if (field === 'colaborador' || field === 'colaboradorQuebrou' || field === 'operador') {
            const cName = String(obj.colaborador || obj.colaboradorQuebrou || obj.responsavel || obj.operador || obj.colaboradorAjudante || '').trim().toLowerCase();
            const tgt = String(targetVal).trim().toLowerCase();
            if (!tgt) return true;
            if (tgt === 'não identificado' || tgt === 'nao identificado') {
              return !cName || cName.includes('não identificado') || cName.includes('nao identificado');
            }
            return cName === tgt || cName.includes(tgt) || tgt.includes(cName);
          }

          // Fallback property access
          if (field in obj) {
            actualVal = obj[field];
          }
        }

        if (actualVal === undefined || actualVal === null) return false;

        return String(actualVal).trim().toLowerCase() === String(targetVal).trim().toLowerCase();
      });
    });
  }, [filters]);

  const value = useMemo(() => ({
    filters,
    fieldLabels,
    toggleFilter,
    setFilter,
    removeFilter,
    clearAllFilters,
    isFiltered,
    filterCount,
    unidadeMedida,
    setUnidadeMedida,
    startDate,
    endDate,
    setDateRange,
    filterData
  }), [filters, fieldLabels, toggleFilter, setFilter, removeFilter, clearAllFilters, isFiltered, filterCount, unidadeMedida, setUnidadeMedida, startDate, endDate, setDateRange, filterData]);

  return (
    <CrossFilterContext.Provider value={value}>
      {children}
    </CrossFilterContext.Provider>
  );
};

export const useCrossFilter = (): CrossFilterContextType => {
  const context = useContext(CrossFilterContext);
  if (!context) {
    // Return a dummy context if not wrapped so components don't crash
    return {
      filters: {},
      fieldLabels: {},
      toggleFilter: () => {},
      setFilter: () => {},
      removeFilter: () => {},
      clearAllFilters: () => {},
      isFiltered: () => false,
      filterCount: 0,
      unidadeMedida: 'HL',
      setUnidadeMedida: () => {},
      startDate: '',
      endDate: '',
      setDateRange: () => {},
      filterData: (data) => data
    };
  }
  return context;
};

/** Visual toolbar component to render active cross-filters */
export const ActiveCrossFiltersBar: React.FC<{ className?: string; onClearAll?: () => void }> = ({ className = '', onClearAll }) => {
  const { filters, fieldLabels, removeFilter, clearAllFilters, filterCount } = useCrossFilter();

  if (filterCount === 0) return null;

  const handleClear = () => {
    clearAllFilters();
    if (onClearAll) {
      onClearAll();
    }
  };

  return (
    <div className={`bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-xl p-3.5 shadow-sm transition-all animate-fadeIn ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-500 text-white rounded-lg shadow-sm">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black uppercase text-amber-900 tracking-wider">
                Filtros Cruzados Ativos (Cross-Filtering)
              </span>
              <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {filterCount}
              </span>
            </div>
            <p className="text-[11px] text-amber-700/80 font-medium">
              Clique em qualquer elemento do dashboard para filtrar ou alternar dimensões.
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {Object.entries(filters).map(([field, val]) => {
            const labelName = fieldLabels[field] || field;
            return (
              <span
                key={field}
                className="inline-flex items-center gap-1.5 bg-white border border-amber-300 text-amber-950 px-2.5 py-1 rounded-lg text-xs font-bold shadow-xs hover:border-amber-400 transition-colors"
              >
                <span className="text-amber-600 font-semibold text-[10px] uppercase">{labelName}:</span>
                <span className="truncate max-w-[150px] font-extrabold">{String(val)}</span>
                <button
                  onClick={() => removeFilter(field)}
                  className="p-0.5 hover:bg-amber-100 rounded-full text-amber-700 transition-colors ml-1"
                  title={`Remover filtro ${labelName}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            );
          })}

          <button
            onClick={handleClear}
            className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white px-3 py-1 rounded-lg text-xs font-bold transition-all shadow-xs ml-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Limpar Filtros
          </button>
        </div>
      </div>
    </div>
  );
};
