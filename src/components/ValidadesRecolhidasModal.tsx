import React, { useState, useMemo, useEffect } from 'react';
import { ValidadeRow } from '../types';
import { 
  Search, 
  Calendar, 
  FileSpreadsheet, 
  Check, 
  X, 
  CalendarDays,
  CheckCheck,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  Layers,
  ArrowRight,
  Filter
} from 'lucide-react';
import { calculateStockAgeIndex } from '../utils/calculateStockAgeIndex';
import { isValidadeDeleted, getValidadeQty, formatDateToBR } from '../utils/fefoDefaultData';

export interface ValidadesRecolhidasModalProps {
  isOpen: boolean;
  onClose: () => void;
  validades: ValidadeRow[];
  selectedKeys: Set<string>;
  onToggleKey: (key: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onSelectDate: (dateKey: string, select: boolean) => void;
  onSelectMultipleDates?: (dateKeys: string[], select: boolean) => void;
  onSelectLatestOnly: () => void;
  onSelectOnlyThisDate: (dateKey: string) => void;
  onSelectOnlyThisKey: (key: string) => void;
  onOpenImport030519?: () => void;
  empresaProdutos?: any[];
}

export function getValidadeUniqueId(item: any, index?: number): string {
  if (item._uniqueKey) return String(item._uniqueKey);
  if (item._docId) return String(item._docId);
  if (item.id !== undefined && item.id !== null && String(item.id).trim() !== '') return String(item.id);
  const cod = String(item.codigo || '').replace(/^0+/, '').trim();
  const valBR = formatDateToBR(item.validade || '');
  const blo = String(item.bloco || '').trim();
  const loc = String(item.localizacao || '').trim();
  const lot = String(item.lote || '').trim();
  const dt = String(item.dataColeta || item.cadastradoEm || item.criadoEm || '').trim();
  const idxStr = index !== undefined ? `_${index}` : '';
  return `val_${cod}_${valBR}_${blo}_${loc}_${lot}_${dt}${idxStr}`;
}

/**
 * Sanitiza e normaliza rigorosamente a Data de Coleta para o ano operacional 2026.
 * NUNCA confunde data de validade (que pode vencer em 2027) com data de coleta (realizada em 2026).
 */
export function getValidadeDateInfo(item: any): { 
  isoDate: string; 
  displayDate: string; 
  dayOfWeek: string;
  monthKey: string;
  monthName: string;
  monthShort: string;
  year: number;
  monthLabel: string;
} {
  let dNum = 28;
  let mNum = 8; // Default Agosto (Semana 4 oficial)
  let year = 2026;

  let raw = '';
  if (item.dataColeta) {
    raw = String(item.dataColeta).trim();
  } else if (item.dataRegistro) {
    raw = String(item.dataRegistro).trim();
  } else if (item.dataContagem) {
    raw = String(item.dataContagem).trim();
  } else if (item.cadastradoEm) {
    raw = String(item.cadastradoEm).trim();
  } else if (item.semanaNumero === 3) {
    raw = '21/08/2026';
  } else if (item.semanaNumero === 4) {
    raw = '28/08/2026';
  } else if (item.data) {
    raw = String(item.data).trim();
  }

  if (raw) {
    if (raw.includes('/')) {
      const parts = raw.split('/');
      if (parts.length === 3) {
        dNum = parseInt(parts[0], 10) || 28;
        mNum = parseInt(parts[1], 10) || 8;
        let y = parts[2].trim();
        if (y.length === 2) y = `20${y}`;
        year = parseInt(y, 10) || 2026;
      }
    } else if (raw.includes('-')) {
      const clean = raw.includes('T') ? raw.split('T')[0] : raw;
      const parts = clean.split('-');
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          year = parseInt(parts[0], 10) || 2026;
          mNum = parseInt(parts[1], 10) || 8;
          dNum = parseInt(parts[2], 10) || 28;
        } else {
          dNum = parseInt(parts[0], 10) || 28;
          mNum = parseInt(parts[1], 10) || 8;
          let y = parts[2].trim();
          if (y.length === 2) y = `20${y}`;
          year = parseInt(y, 10) || 2026;
        }
      }
    }
  }

  // Sanitização rigorosa de analista: todas as coletas de armazém pertencem a 2026.
  // Previne erro de usuário ou digitação (ex: 2027 que é a validade do produto, não a coleta).
  if (year !== 2026) {
    year = 2026;
  }

  mNum = Math.max(1, Math.min(12, mNum));
  dNum = Math.max(1, Math.min(31, dNum));

  const iso = `2026-${String(mNum).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`;
  const displayDate = `${String(dNum).padStart(2, '0')}/${String(mNum).padStart(2, '0')}/2026`;
  const monthKey = `2026-${String(mNum).padStart(2, '0')}`;

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const monthShorts = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];

  const mIdx = mNum - 1;
  const monthName = monthNames[mIdx];
  const monthShort = monthShorts[mIdx];
  const monthLabel = `${monthName} 2026`;

  const dt = new Date(2026, mIdx, dNum);
  const daysOfWeek = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const dayOfWeek = daysOfWeek[dt.getDay()] || '';

  return { isoDate: iso, displayDate, dayOfWeek, monthKey, monthName, monthShort, year: 2026, monthLabel };
}

export interface ModalLotItem {
  item: ValidadeRow;
  key: string;
  index: number;
  diasRestantes: number;
  faixa: 'critico' | 'atencao' | 'ok';
  isSelected: boolean;
  totalCx: number;
  dateInfo: ReturnType<typeof getValidadeDateInfo>;
}

export const ValidadesRecolhidasModal: React.FC<ValidadesRecolhidasModalProps> = ({
  isOpen,
  onClose,
  validades,
  selectedKeys,
  onToggleKey,
  onSelectAll,
  onDeselectAll,
  onSelectDate,
  onSelectMultipleDates,
  onSelectLatestOnly,
  onSelectOnlyThisDate,
  onSelectOnlyThisKey,
  onOpenImport030519,
  empresaProdutos = []
}) => {
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'critico' | 'atencao' | 'ok'>('todos');
  
  // Guia do Mês ativo (ex: '2026-08' ou '2026-09')
  const [activeMonthKey, setActiveMonthKey] = useState<string>('2026-08');

  // Checkboxes de datas de coleta selecionadas
  const [selectedDatesToLoad, setSelectedDatesToLoad] = useState<Set<string>>(new Set());

  // Datas de coleta efetivamente carregadas e unificadas na tabela
  const [loadedDatesInTable, setLoadedDatesInTable] = useState<Set<string>>(new Set());

  // Feedback toast
  const [loadToast, setLoadToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null);

  // 1. Processamento e agrupamento dos lotes
  const { 
    allProcessedLots, 
    dateGroups, 
    sortedDateKeys, 
    monthsSummary, 
    totalBoxesSelected, 
    totalBoxesAll 
  } = useMemo(() => {
    const lots: ModalLotItem[] = [];
    const dateMap: Record<string, {
      dateInfo: ReturnType<typeof getValidadeDateInfo>;
      items: ModalLotItem[];
      totalCx: number;
    }> = {};

    let selCx = 0;
    let totCx = 0;

    validades.forEach((rawItem, idx) => {
      if (isValidadeDeleted(rawItem, (rawItem as any).empresaId || 'demo')) return;
      const qty = getValidadeQty(rawItem);
      if (qty <= 0) return;

      const dateInfo = getValidadeDateInfo(rawItem);
      const item: ValidadeRow = {
        ...rawItem,
        dataColeta: dateInfo.displayDate
      };

      const key = getValidadeUniqueId(item, idx);
      const isSelected = selectedKeys.has(key);

      totCx += qty;
      if (isSelected) selCx += qty;

      const calc = calculateStockAgeIndex({
        codigo: item.codigo,
        descricao: item.descricao,
        validade: item.validade
      }, empresaProdutos);

      const diasRestantes = calc.diasRestantes;
      const isVermelho = diasRestantes <= 30;
      const isAmarelo = diasRestantes >= 31 && diasRestantes <= 60;
      const faixa: 'critico' | 'atencao' | 'ok' = isVermelho ? 'critico' : (isAmarelo ? 'atencao' : 'ok');

      const lotEntry: ModalLotItem = {
        item,
        key,
        index: idx,
        diasRestantes,
        faixa,
        isSelected,
        totalCx: qty,
        dateInfo
      };

      lots.push(lotEntry);

      if (!dateMap[dateInfo.isoDate]) {
        dateMap[dateInfo.isoDate] = {
          dateInfo,
          items: [],
          totalCx: 0
        };
      }
      dateMap[dateInfo.isoDate].items.push(lotEntry);
      dateMap[dateInfo.isoDate].totalCx += qty;
    });

    const sortedDates = Object.keys(dateMap).sort((a, b) => b.localeCompare(a));

    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const monthShorts = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];

    const monthsSummaryList = monthNames.map((name, mIdx) => {
      const mNum = mIdx + 1;
      const mKey = `2026-${String(mNum).padStart(2, '0')}`;
      const short = monthShorts[mIdx];

      const datesInMonth = sortedDates.filter(d => {
        const g = dateMap[d];
        return g && g.dateInfo.monthKey === mKey;
      });

      let lotsCount = 0;
      let totalCx = 0;
      let selectedLots = 0;

      datesInMonth.forEach(d => {
        const g = dateMap[d];
        if (g) {
          lotsCount += g.items.length;
          totalCx += g.totalCx;
          selectedLots += g.items.filter(i => i.isSelected).length;
        }
      });

      const allSelected = lotsCount > 0 && selectedLots === lotsCount;
      const someSelected = selectedLots > 0 && !allSelected;

      return {
        monthNum: mNum,
        monthKey: mKey,
        monthName: name,
        monthShort: short,
        year: 2026,
        monthLabel: `${name} 2026`,
        dates: datesInMonth,
        lotsCount,
        totalCx,
        selectedLots,
        hasColetas: datesInMonth.length > 0,
        allSelected,
        someSelected
      };
    });

    return {
      allProcessedLots: lots,
      dateGroups: dateMap,
      sortedDateKeys: sortedDates,
      monthsSummary: monthsSummaryList,
      totalBoxesSelected: selCx,
      totalBoxesAll: totCx
    };
  }, [validades, selectedKeys, empresaProdutos]);

  // Inicialização inteligente do Mês ativo
  useEffect(() => {
    if (monthsSummary.length > 0) {
      // Prioriza o mês que possui mais coletas ativas (ex: Agosto ou Setembro)
      const currentActive = monthsSummary.find(m => m.monthKey === activeMonthKey);
      if (!currentActive || !currentActive.hasColetas) {
        const firstWithData = monthsSummary.find(m => m.hasColetas);
        if (firstWithData) {
          setActiveMonthKey(firstWithData.monthKey);
        }
      }
    }
  }, [monthsSummary, activeMonthKey]);

  // Inicializa as datas de coleta selecionadas
  useEffect(() => {
    if (sortedDateKeys.length > 0 && loadedDatesInTable.size === 0) {
      const activeDates = new Set<string>();
      sortedDateKeys.forEach(d => {
        const group = dateGroups[d];
        if (group && group.items.some(it => it.isSelected)) {
          activeDates.add(d);
        }
      });
      // Fallback para todas as datas do primeiro mês com coletas
      if (activeDates.size === 0) {
        const firstMonth = monthsSummary.find(m => m.hasColetas);
        if (firstMonth && firstMonth.dates.length > 0) {
          firstMonth.dates.forEach(d => activeDates.add(d));
        } else if (sortedDateKeys[0]) {
          activeDates.add(sortedDateKeys[0]);
        }
      }
      setSelectedDatesToLoad(new Set(activeDates));
      setLoadedDatesInTable(new Set(activeDates));
    }
  }, [sortedDateKeys, dateGroups, monthsSummary, loadedDatesInTable.size]);

  // Dados do mês selecionado na guia
  const currentActiveMonth = useMemo(() => {
    return monthsSummary.find(m => m.monthKey === activeMonthKey) || monthsSummary[7]; // Agosto fallback
  }, [monthsSummary, activeMonthKey]);

  // Datas de coleta do mês ativo
  const datesOfActiveMonth = useMemo(() => {
    if (!currentActiveMonth) return [];
    return currentActiveMonth.dates;
  }, [currentActiveMonth]);

  // Handlers de Datas
  const handleToggleDateCheckbox = (dateKey: string) => {
    setSelectedDatesToLoad(prev => {
      const next = new Set(prev);
      if (next.has(dateKey)) {
        next.delete(dateKey);
      } else {
        next.add(dateKey);
      }
      return next;
    });
  };

  const handleSelectAllDatesOfCurrentMonth = () => {
    setSelectedDatesToLoad(prev => {
      const next = new Set(prev);
      datesOfActiveMonth.forEach(d => next.add(d));
      return next;
    });
  };

  const handleDeselectAllDatesOfCurrentMonth = () => {
    setSelectedDatesToLoad(prev => {
      const next = new Set(prev);
      datesOfActiveMonth.forEach(d => next.delete(d));
      return next;
    });
  };

  // Botão CARREGAR COLETAS SELECIONADAS NA TABELA
  const handleCarregarColetasNaTabela = () => {
    if (selectedDatesToLoad.size === 0) {
      setLoadToast({
        message: 'Marque ao menos uma data de coleta para carregar na tabela.',
        type: 'warning'
      });
      setTimeout(() => setLoadToast(null), 3500);
      return;
    }

    setLoadedDatesInTable(new Set(selectedDatesToLoad));

    // Marca todos os itens dessas datas selecionadas
    const datesArr = Array.from(selectedDatesToLoad);
    if (onSelectMultipleDates) {
      onSelectMultipleDates(datesArr, true);
    } else {
      datesArr.forEach(d => onSelectDate(d, true));
    }

    const count = datesArr.length;
    setLoadToast({
      message: `Carregadas e unificadas ${count} ${count === 1 ? 'data de coleta' : 'datas de coleta'} na tabela!`,
      type: 'success'
    });
    setTimeout(() => setLoadToast(null), 3500);
  };

  // Botão APLICAR SELEÇÃO NO DASHBOARD
  const handleAplicarEDeixarAtivo = () => {
    // Garante que as coletas selecionadas estejam ativas
    if (loadedDatesInTable.size > 0) {
      const datesArr = Array.from(loadedDatesInTable);
      if (onSelectMultipleDates) {
        onSelectMultipleDates(datesArr, true);
      }
    }
    onClose();
  };

  // Carregar apenas esta data isolada
  const handleCarregarApenasEstaData = (dateKey: string) => {
    const nextSet = new Set([dateKey]);
    setSelectedDatesToLoad(nextSet);
    setLoadedDatesInTable(nextSet);
    onSelectOnlyThisDate(dateKey);
    setLoadToast({
      message: `Coleta de ${dateGroups[dateKey]?.dateInfo.displayDate} carregada exclusivamente!`,
      type: 'info'
    });
    setTimeout(() => setLoadToast(null), 3500);
  };

  // 3. ITENS DA TABELA UNIFICADA
  const unifiedTableItems = useMemo(() => {
    const targetDates = loadedDatesInTable;
    const items: ModalLotItem[] = [];
    const q = searchFilter.toLowerCase().trim();

    allProcessedLots.forEach(lot => {
      // Se não está nas datas carregadas, não exibe
      if (!targetDates.has(lot.dateInfo.isoDate)) return;

      if (statusFilter !== 'todos' && lot.faixa !== statusFilter) return;

      if (q) {
        const cod = String(lot.item.codigo || '').toLowerCase();
        const desc = String(lot.item.descricao || '').toLowerCase();
        const blo = String(lot.item.bloco || '').toLowerCase();
        const loc = String(lot.item.localizacao || '').toLowerCase();
        const resp = String(lot.item.responsavel || (lot.item as any).cadastradoPor || '').toLowerCase();
        const dt = lot.dateInfo.displayDate.toLowerCase();
        if (!cod.includes(q) && !desc.includes(q) && !blo.includes(q) && !loc.includes(q) && !resp.includes(q) && !dt.includes(q)) {
          return;
        }
      }

      items.push(lot);
    });

    // Ordenação FEFO (menor validade primeiro)
    items.sort((a, b) => {
      if (a.diasRestantes !== b.diasRestantes) {
        return a.diasRestantes - b.diasRestantes;
      }
      return b.dateInfo.isoDate.localeCompare(a.dateInfo.isoDate);
    });

    return items;
  }, [allProcessedLots, loadedDatesInTable, searchFilter, statusFilter]);

  // Master checkbox da tabela
  const allTableItemsSelected = useMemo(() => {
    return unifiedTableItems.length > 0 && unifiedTableItems.every(it => it.isSelected);
  }, [unifiedTableItems]);

  const someTableItemsSelected = useMemo(() => {
    return unifiedTableItems.some(it => it.isSelected) && !allTableItemsSelected;
  }, [unifiedTableItems, allTableItemsSelected]);

  const handleToggleAllInTable = (select: boolean) => {
    unifiedTableItems.forEach(it => {
      if (it.isSelected !== select) {
        onToggleKey(it.key);
      }
    });
  };

  // Lista formatada das datas carregadas
  const loadedDatesFormattedList = useMemo(() => {
    return Array.from(loadedDatesInTable)
      .map(d => dateGroups[d]?.dateInfo.displayDate || d)
      .sort((a, b) => {
        const [da, ma, ya] = a.split('/').map(Number);
        const [db, mb, yb] = b.split('/').map(Number);
        return new Date(ya, (ma || 1) - 1, da).getTime() - new Date(yb, (mb || 1) - 1, db).getTime();
      });
  }, [loadedDatesInTable, dateGroups]);

  const selectedCount = selectedKeys.size;
  const totalCount = validades.length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div 
        className="bg-white w-full max-w-7xl h-[94vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-300 font-sans"
        onClick={e => e.stopPropagation()}
      >
        {/* HEADER DA MODAL */}
        <div className="bg-[#032b5e] text-white px-6 py-3.5 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-300 shrink-0">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="font-black text-base tracking-wide text-white uppercase">
                  Central de Coletas de Validades — Ano 2026
                </h2>
                <span className="text-[10px] font-black uppercase bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full shadow-xs">
                  {selectedCount} de {totalCount} Lotes Ativos
                </span>
                <span className="text-[10px] font-bold bg-sky-400/20 text-sky-200 border border-sky-300/30 px-2 py-0.5 rounded-full">
                  {loadedDatesInTable.size} {loadedDatesInTable.size === 1 ? 'Data Unificada' : 'Datas Unificadas'}
                </span>
              </div>
              <p className="text-xs text-sky-200/90 font-medium">
                Navegue pelos meses na guia, selecione as datas de coleta para unificar em uma só tabela, carregue e aplique.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenImport030519 && (
              <button
                type="button"
                onClick={onOpenImport030519}
                className="hidden md:flex px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white items-center gap-1.5 transition-all shadow-xs cursor-pointer border-none"
                title="Importar dados oficiais 03.05.19"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
                <span>Importar 03.05.19</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors border border-white/20 cursor-pointer"
              title="Fechar janela"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            1. GUIA DOS MESES DO ANO (12 MESES 2026)
            ───────────────────────────────────────────────────────────── */}
        <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 shrink-0 flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
          <div className="flex items-center gap-1 text-slate-700 font-black text-xs uppercase tracking-wider mr-2 shrink-0">
            <Calendar className="w-3.5 h-3.5 text-[#032b5e]" />
            <span>Guia dos Meses:</span>
          </div>

          {monthsSummary.map(m => {
            const isActive = m.monthKey === activeMonthKey;
            const hasData = m.hasColetas;

            return (
              <button
                key={m.monthKey}
                type="button"
                onClick={() => setActiveMonthKey(m.monthKey)}
                className={`px-3 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 border ${
                  isActive
                    ? 'bg-[#032b5e] text-white border-[#032b5e] shadow-md ring-2 ring-sky-300'
                    : hasData
                      ? 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300 shadow-2xs'
                      : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{m.monthName}</span>
                {hasData ? (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                    isActive 
                      ? 'bg-amber-400 text-slate-950 font-black' 
                      : 'bg-sky-100 text-sky-900 border border-sky-200'
                  }`}>
                    {m.dates.length} {m.dates.length === 1 ? 'coleta' : 'coletas'} ({m.lotsCount})
                  </span>
                ) : (
                  <span className="text-[9px] text-slate-400">
                    0
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ─────────────────────────────────────────────────────────────
            2. PAINEL DO MÊS: SELETOR DE DATAS + BOTÕES CARREGAR & APLICAR
            ───────────────────────────────────────────────────────────── */}
        <div className="bg-sky-50/60 p-3.5 border-b border-sky-200 shrink-0 flex flex-col gap-2.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            
            {/* Esquerda: Seletor de Datas de Coleta do Mês */}
            <div className="flex items-center gap-2 flex-wrap flex-1">
              <span className="text-xs font-black uppercase text-[#032b5e] flex items-center gap-1">
                <span>📅</span> Coletas em {currentActiveMonth.monthName} 2026:
              </span>

              {datesOfActiveMonth.length === 0 ? (
                <span className="text-xs text-slate-500 font-medium italic">
                  Nenhuma coleta registrada neste mês. Selecione <strong>Agosto</strong> ou outro mês com dados.
                </span>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  {datesOfActiveMonth.map(dateKey => {
                    const group = dateGroups[dateKey];
                    if (!group) return null;
                    const isChecked = selectedDatesToLoad.has(dateKey);
                    const isLoaded = loadedDatesInTable.has(dateKey);

                    return (
                      <label
                        key={dateKey}
                        className={`px-3 py-1.5 rounded-xl border-2 font-mono text-xs font-black flex items-center gap-2 transition-all cursor-pointer select-none ${
                          isChecked
                            ? 'bg-white border-[#032b5e] text-[#032b5e] shadow-xs ring-1 ring-sky-300'
                            : 'bg-white/80 border-slate-300 text-slate-600 hover:border-slate-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleDateCheckbox(dateKey)}
                          className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer"
                        />
                        <span>📅 {group.dateInfo.displayDate}</span>
                        <span className="text-[10px] font-sans font-bold text-slate-500">
                          ({group.items.length} lotes • {group.totalCx.toLocaleString('pt-BR')} cx)
                        </span>
                        {isLoaded && (
                          <span className="text-[9px] font-extrabold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-300">
                            Carregada
                          </span>
                        )}
                      </label>
                    );
                  })}

                  <div className="flex items-center gap-1.5 ml-1">
                    <button
                      type="button"
                      onClick={handleSelectAllDatesOfCurrentMonth}
                      className="px-2 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 cursor-pointer shadow-2xs"
                    >
                      Todas do Mês
                    </button>
                    <button
                      type="button"
                      onClick={handleDeselectAllDatesOfCurrentMonth}
                      className="px-2 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 cursor-pointer shadow-2xs"
                    >
                      Desmarcar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Direita: Ações de Execução Imediata (Carregar e Aplicar) */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCarregarColetasNaTabela}
                className="px-3.5 py-2 text-xs font-black uppercase tracking-wider rounded-xl bg-sky-700 hover:bg-sky-800 text-white flex items-center gap-1.5 transition-all shadow-sm cursor-pointer border-none"
                title="Carregar as datas de coleta selecionadas acima para unificação na tabela abaixo"
              >
                <RefreshCw className="w-3.5 h-3.5 text-sky-200" />
                <span>Carregar ({selectedDatesToLoad.size})</span>
              </button>

              <button
                type="button"
                onClick={handleAplicarEDeixarAtivo}
                className="px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-all shadow-sm cursor-pointer border-none"
                title="Confirmar e aplicar esta seleção ao Dashboard"
              >
                <Check className="w-3.5 h-3.5 text-emerald-200" />
                <span>Aplicar Seleção</span>
              </button>
            </div>
          </div>

          {/* Toast / Alerta de carregamento */}
          {loadToast && (
            <div className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-between animate-in fade-in duration-200 ${
              loadToast.type === 'success' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
              loadToast.type === 'warning' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
              'bg-sky-100 text-sky-900 border border-sky-300'
            }`}>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>{loadToast.message}</span>
              </div>
              <button type="button" onClick={() => setLoadToast(null)} className="font-bold text-xs">✕</button>
            </div>
          )}
        </div>

        {/* ─────────────────────────────────────────────────────────────
            3. LISTA / TABELA UNIFICADA DE VALIDADES DAS COLETAS
            ───────────────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-slate-50">
          
          {/* Toolbar de Filtros e Busca */}
          <div className="bg-white px-5 py-2.5 border-b border-slate-200 shrink-0 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-sm">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={e => setSearchFilter(e.target.value)}
                  placeholder="Buscar SKU, produto, bloco ou conferente..."
                  className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 font-sans shadow-2xs"
                />
                {searchFilter && (
                  <button
                    type="button"
                    onClick={() => setSearchFilter('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Status Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setStatusFilter('todos')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-colors cursor-pointer ${
                    statusFilter === 'todos' ? 'bg-[#032b5e] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Todos ({unifiedTableItems.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('critico')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-colors cursor-pointer ${
                    statusFilter === 'critico' ? 'bg-rose-600 text-white shadow-xs' : 'text-rose-700 hover:bg-rose-50'
                  }`}
                >
                  Crítico ≤30d
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('atencao')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-colors cursor-pointer ${
                    statusFilter === 'atencao' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-amber-800 hover:bg-amber-50'
                  }`}
                >
                  Atenção 31-60d
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('ok')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-colors cursor-pointer ${
                    statusFilter === 'ok' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-800 hover:bg-emerald-50'
                  }`}
                >
                  Seguro &gt;60d
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleToggleAllInTable(true)}
                className="px-2.5 py-1.5 text-xs font-black uppercase tracking-wider rounded-xl bg-sky-100 hover:bg-sky-200 text-[#032b5e] border border-sky-300 transition-colors cursor-pointer flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5 text-sky-700" />
                <span>Marcar Visíveis</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleAllInTable(false)}
                className="px-2.5 py-1.5 text-xs font-black uppercase tracking-wider rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition-colors cursor-pointer"
              >
                Desmarcar
              </button>
            </div>
          </div>

          {/* Barra de identificação das coletas ativas nesta tabela */}
          <div className="bg-sky-50 px-5 py-2 border-b border-sky-200 flex items-center justify-between flex-wrap gap-2 text-xs shrink-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-[#032b5e] flex items-center gap-1">
                <span>📋</span> Coletas Unificadas nesta Tabela:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {loadedDatesFormattedList.map(dt => (
                  <span key={dt} className="px-2 py-0.5 rounded-lg font-mono text-xs font-black bg-white text-[#032b5e] border border-sky-300 shadow-2xs">
                    📅 {dt}
                  </span>
                ))}
                {loadedDatesFormattedList.length === 0 && (
                  <span className="text-slate-500 italic font-medium">
                    Nenhuma coleta carregada. Marque as datas no painel acima e clique em <strong>Carregar</strong>.
                  </span>
                )}
              </div>
            </div>

            <span className="text-xs font-bold text-sky-950">
              {unifiedTableItems.filter(i => i.isSelected).length} de {unifiedTableItems.length} lotes marcados nesta tabela
            </span>
          </div>

          {/* TABELA COM SCROLL */}
          <div className="flex-1 overflow-y-auto p-3 scrollbar-thin">
            {unifiedTableItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200 shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                  <Calendar className="w-7 h-7 text-slate-400" />
                </div>
                <h3 className="font-extrabold text-sm text-slate-700">Nenhuma validade carregada na tabela</h3>
                <p className="text-xs text-slate-500 max-w-md mt-1">
                  {loadedDatesInTable.size === 0
                    ? 'Selecione uma ou mais datas de coleta no painel superior e clique em "Carregar".'
                    : 'Nenhum produto corresponde aos filtros aplicados.'}
                </p>
                {sortedDateKeys[0] && (
                  <button
                    type="button"
                    onClick={() => handleCarregarApenasEstaData(sortedDateKeys[0])}
                    className="mt-4 px-4 py-2 bg-[#032b5e] hover:bg-[#021d40] text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xs border-none"
                  >
                    Carregar Coleta de {dateGroups[sortedDateKeys[0]]?.dateInfo.displayDate}
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto max-h-[52vh] scrollbar-thin">
                  <table className="w-full text-left border-collapse min-w-[950px]">
                    <thead className="sticky top-0 z-10 bg-slate-100 text-slate-700 font-black text-[10px] uppercase tracking-wider border-b border-slate-200 shadow-2xs">
                      <tr>
                        <th className="p-2.5 text-center w-10 bg-slate-100">
                          <input
                            type="checkbox"
                            checked={allTableItemsSelected}
                            ref={el => {
                              if (el) el.indeterminate = someTableItemsSelected;
                            }}
                            onChange={e => handleToggleAllInTable(e.target.checked)}
                            className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer"
                            title="Alternar todos os itens da tabela"
                          />
                        </th>
                        <th className="p-2.5 text-center w-36 bg-slate-100">📅 Data Coleta</th>
                        <th className="p-2.5 w-24 bg-slate-100">SKU</th>
                        <th className="p-2.5 bg-slate-100">Descrição do Produto</th>
                        <th className="p-2.5 text-center w-28 bg-slate-100">Validade</th>
                        <th className="p-2.5 text-center w-32 bg-slate-100">Status Venc.</th>
                        <th className="p-2.5 text-right w-24 bg-slate-100">Qtd. (cx)</th>
                        <th className="p-2.5 w-32 bg-slate-100">Localização</th>
                        <th className="p-2.5 w-32 bg-slate-100">Conferente</th>
                        <th className="p-2.5 text-center w-24 bg-slate-100">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-mono">
                      {unifiedTableItems.map(({ item, key, diasRestantes, faixa, isSelected, totalCx, dateInfo }) => {
                        let badgeStyle = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                        let badgeText = `${diasRestantes}d (Seguro)`;
                        if (faixa === 'critico') {
                          badgeStyle = 'bg-rose-100 text-rose-800 border-rose-300 font-black';
                          badgeText = diasRestantes <= 0 ? '⛔ Vencido' : `🔴 ${diasRestantes}d (<=30d)`;
                        } else if (faixa === 'atencao') {
                          badgeStyle = 'bg-amber-100 text-amber-900 border-amber-300 font-black';
                          badgeText = `🟡 ${diasRestantes}d (Alerta)`;
                        }

                        return (
                          <tr 
                            key={key} 
                            onClick={() => onToggleKey(key)}
                            className={`cursor-pointer transition-colors ${
                              isSelected ? 'bg-sky-50/70 hover:bg-sky-100/70' : 'bg-white hover:bg-slate-50 opacity-60'
                            }`}
                          >
                            <td 
                              className="p-2.5 text-center cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleKey(key);
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                readOnly
                                className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer pointer-events-none"
                              />
                            </td>

                            {/* Badge da Data de Coleta */}
                            <td className="p-2.5 text-center">
                              <span className="font-mono text-[11px] font-black px-2 py-0.5 rounded-lg bg-sky-100 text-[#032b5e] border border-sky-300 whitespace-nowrap shadow-2xs">
                                📅 {dateInfo.displayDate}
                              </span>
                            </td>

                            <td className="p-2.5 font-black text-slate-900">{item.codigo}</td>
                            <td className="p-2.5 font-sans font-bold text-slate-900">{item.descricao}</td>
                            <td className="p-2.5 text-center font-bold text-slate-700 font-mono">{formatDateToBR(item.validade)}</td>
                            
                            <td className="p-2.5 text-center">
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${badgeStyle}`}>
                                {badgeText}
                              </span>
                            </td>

                            <td className="p-2.5 text-right font-black text-slate-900">{totalCx.toLocaleString('pt-BR')}</td>
                            
                            <td className="p-2.5 font-sans text-[11px] text-slate-600">
                              {item.localizacao === 'picking' ? 'Picking' : `Central - ${item.bloco || 'Geral'}`}
                            </td>

                            <td className="p-2.5 font-sans text-[11px] text-slate-500 truncate max-w-[130px]">
                              {item.responsavel || (item as any).cadastradoPor || 'Conferente'}
                            </td>

                            <td className="p-2 text-center" onClick={e => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => onSelectOnlyThisKey(key)}
                                className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition-colors cursor-pointer whitespace-nowrap"
                                title="Exibir somente este lote no Dashboard"
                              >
                                Apenas Este
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            4. MODAL FOOTER
            ───────────────────────────────────────────────────────────── */}
        <div className="bg-white px-6 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs font-bold text-slate-600 flex items-center gap-2 flex-wrap">
            <span>
              Total Geral Ativo: <strong className="text-[#032b5e] font-black">{selectedCount}</strong> de <strong>{totalCount}</strong> lotes ({totalBoxesSelected.toLocaleString('pt-BR')} cx)
            </span>
            <span>•</span>
            <span className="bg-sky-100 text-sky-900 px-2 py-0.5 rounded-md border border-sky-200 font-extrabold text-[11px]">
              {loadedDatesInTable.size} {loadedDatesInTable.size === 1 ? 'coleta unificada' : 'coletas unificadas'}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-300 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleAplicarEDeixarAtivo}
              className="px-5 py-2.5 text-xs font-black text-white bg-[#032b5e] hover:bg-[#021d40] rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer border-none"
            >
              <Check className="w-4 h-4 text-emerald-300" />
              <span>Aplicar Seleção no Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValidadesRecolhidasModal;
