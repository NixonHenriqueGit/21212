import React, { useState, useMemo, useCallback } from 'react';
import { 
  Calendar, 
  Clock, 
  Search, 
  Filter, 
  Download, 
  Truck, 
  CheckCircle2, 
  AlertTriangle, 
  UserCheck, 
  Package, 
  Layers, 
  TrendingUp, 
  ArrowUpDown, 
  Sparkles, 
  Check, 
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Award,
  Zap
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { NormalizedTask } from './PickingDashboard';
import { isCleaningProduct, getProductFactorData } from '../utils/generateRessuprimentoData';
import { getAbcMapForPeriod } from '../utils/curvaAbcUtils';

interface RessuprimentoDetalhadoDiarioProps {
  tasks: NormalizedTask[];
  onSelectDate?: (date: string) => void;
  empresaId?: string;
}

export default function RessuprimentoDetalhadoDiario({ 
  tasks, 
  onSelectDate, 
  empresaId = 'demo' 
}: RessuprimentoDetalhadoDiarioProps) {
  // 1. Data Selection (Default: Most recent date in dataset or today)
  const defaultDate = useMemo(() => {
    const dates = tasks
      .map(t => t.dataSolicitacao || t.dataConclusao)
      .filter(Boolean)
      .sort((a, b) => b.localeCompare(a));
    return dates[0] || new Date().toISOString().split('T')[0];
  }, [tasks]);

  const [selectedDate, setSelectedDate] = useState<string>(defaultDate);
  const [useDateRange, setUseDateRange] = useState<boolean>(false);
  const [endDateRange, setEndDateRange] = useState<string>(defaultDate);

  // Dynamic Curva ABC Engine strictly coherent with Picking Pareto Logic
  const abcEngine = useMemo(() => {
    return getAbcMapForPeriod({
      date: selectedDate,
      startDate: useDateRange ? selectedDate : undefined,
      endDate: useDateRange ? endDateRange : undefined
    });
  }, [selectedDate, useDateRange, endDateRange]);

  const getCurvaForSku = useCallback((skuNum: number, fallbackCurva?: string): 'A' | 'B' | 'C' => {
    if (!skuNum || isNaN(skuNum)) return (fallbackCurva as any) || 'B';
    return abcEngine.getCurva(skuNum, fallbackCurva);
  }, [abcEngine]);

  // 2. Coherence & Detail Filters
  const [showOnlyTop10, setShowOnlyTop10] = useState<boolean>(false);
  const [coerenciaSla, setCoerenciaSla] = useState<'all' | 'dentro' | 'fora'>('all');
  const [coerenciaEtapa, setCoerenciaEtapa] = useState<'all' | 'ressuprimento' | 'reabastecimento'>('all');
  const [coerenciaTurno, setCoerenciaTurno] = useState<'all' | 'turno1' | 'turno2' | 'noturno'>('all');
  const [coerenciaCurva, setCoerenciaCurva] = useState<'all' | 'A' | 'B' | 'C'>('all');
  const [selectedEmpilhador, setSelectedEmpilhador] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Sort state
  const [sortField, setSortField] = useState<'horaSolicitacao' | 'horaAceite' | 'horaConclusao' | 'tempoTotal' | 'quantidadePaletes' | 'sku'>('horaSolicitacao');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(50);

  // List of all unique dates available in the dataset for quick jump
  const availableDates = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach(t => {
      if (t.dataSolicitacao) set.add(t.dataSolicitacao);
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [tasks]);

  // Navigate to previous / next active operational day
  const handlePrevDay = () => {
    const idx = availableDates.indexOf(selectedDate);
    if (idx !== -1 && idx < availableDates.length - 1) {
      const nextDate = availableDates[idx + 1];
      setSelectedDate(nextDate);
      if (onSelectDate) onSelectDate(nextDate);
    } else {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() - 1);
      const prev = d.toISOString().split('T')[0];
      setSelectedDate(prev);
      if (onSelectDate) onSelectDate(prev);
    }
  };

  const handleNextDay = () => {
    const idx = availableDates.indexOf(selectedDate);
    if (idx > 0) {
      const prevDate = availableDates[idx - 1];
      setSelectedDate(prevDate);
      if (onSelectDate) onSelectDate(prevDate);
    } else {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + 1);
      const next = d.toISOString().split('T')[0];
      setSelectedDate(next);
      if (onSelectDate) onSelectDate(next);
    }
  };

  // Base dataset strictly excluding CERVEGELA and cleaning products
  const cleanTasks = useMemo(() => {
    return tasks.filter(t => {
      if (isCleaningProduct(t.descricaoSku || '')) return false;
      const descUpper = (t.descricaoSku || '').toUpperCase();
      if (descUpper.includes('CERVEGELA')) return false;
      return true;
    });
  }, [tasks]);

  // 3. Daily Filtered Tasks
  const dailyTasks = useMemo(() => {
    return cleanTasks.filter(t => {
      const tDate = t.dataSolicitacao || t.dataConclusao;
      if (!tDate) return false;

      if (useDateRange) {
        return tDate >= selectedDate && tDate <= (endDateRange || selectedDate);
      }
      return tDate === selectedDate;
    });
  }, [cleanTasks, selectedDate, useDateRange, endDateRange]);

  // Extract Top 10 SKUs in the selected day/period for the Top 10 filter
  const top10SkuIds = useMemo(() => {
    const countMap: Record<string, number> = {};
    dailyTasks.forEach(t => {
      const skuStr = String(t.sku);
      countMap[skuStr] = (countMap[skuStr] || 0) + (t.quantidadePaletes || 1);
    });
    return Object.entries(countMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(entry => entry[0]);
  }, [dailyTasks]);

  // 4. Coherence Parameter Filtering
  const filteredTasks = useMemo(() => {
    return dailyTasks.filter(t => {
      // Top 10 filter
      if (showOnlyTop10 && !top10SkuIds.includes(String(t.sku))) {
        return false;
      }

      // SLA Coherence (<= 5 min per pallet requested)
      const targetMin = (t.quantidadePaletes || 1) * 5;
      const isWithinSla = t.tempoTotal <= targetMin;
      if (coerenciaSla === 'dentro' && !isWithinSla) return false;
      if (coerenciaSla === 'fora' && isWithinSla) return false;

      // Etapa Coherence
      if (coerenciaEtapa === 'ressuprimento' && t.etapa !== 'Após o Carregamento') return false;
      if (coerenciaEtapa === 'reabastecimento' && t.etapa !== 'Durante o Carregamento') return false;

      // Turno Coherence
      const hora = t.horaSolicitacao || 0;
      if (coerenciaTurno === 'turno1' && !(hora >= 7 && hora < 15.33)) return false;
      if (coerenciaTurno === 'turno2' && !(hora >= 15.33 && hora < 23.66)) return false;
      if (coerenciaTurno === 'noturno' && !(hora >= 23.66 || hora < 7)) return false;

      // Curva ABC Coherence
      const pFactors = getProductFactorData(t.sku || 0);
      const curva = getCurvaForSku(Number(t.sku), pFactors.curva);
      if (coerenciaCurva !== 'all' && curva !== coerenciaCurva) return false;

      // Empilhador Coherence
      if (selectedEmpilhador !== 'all' && t.operador?.toUpperCase() !== selectedEmpilhador.toUpperCase()) {
        return false;
      }

      // Text Search (SKU, Descrição, Empilhador, Conferente)
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchSku = String(t.sku).includes(q);
        const matchDesc = (t.descricaoSku || '').toLowerCase().includes(q);
        const matchOp = (t.operador || '').toLowerCase().includes(q);
        const matchConf = (t.conferente || '').toLowerCase().includes(q);
        if (!matchSku && !matchDesc && !matchOp && !matchConf) return false;
      }

      return true;
    });
  }, [
    dailyTasks, 
    showOnlyTop10, 
    top10SkuIds, 
    coerenciaSla, 
    coerenciaEtapa, 
    coerenciaTurno, 
    coerenciaCurva, 
    selectedEmpilhador, 
    searchTerm
  ]);

  // 5. Sorting
  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'horaSolicitacao') {
        valA = a.horaSolicitacaoStr || '';
        valB = b.horaSolicitacaoStr || '';
      } else if (sortField === 'horaAceite') {
        valA = a.horaAceiteStr || '';
        valB = b.horaAceiteStr || '';
      } else if (sortField === 'horaConclusao') {
        valA = a.horaConclusaoStr || '';
        valB = b.horaConclusaoStr || '';
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [filteredTasks, sortField, sortAsc]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedTasks.length / itemsPerPage));
  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedTasks.slice(start, start + itemsPerPage);
  }, [sortedTasks, currentPage, itemsPerPage]);

  // 6. Detailed Daily Summary Metrics
  const dailySummary = useMemo(() => {
    const totalMovimentacoes = filteredTasks.length;
    const totalPaletes = filteredTasks.reduce((sum, t) => sum + (t.quantidadePaletes || 0), 0);
    const totalCaixas = filteredTasks.reduce((sum, t) => sum + (t.quantidadeCaixas || ((t.quantidadePaletes || 1) * (t.fatorPallet || 100))), 0);
    const totalHl = Math.round(filteredTasks.reduce((sum, t) => sum + (t.quantidadeHecto || ((t.quantidadePaletes || 1) * (t.fatorPallet || 100) * (t.fatorHecto || 0.072))), 0) * 10) / 10;

    const validTempos = filteredTasks.filter(t => t.tempoTotal > 0);
    const tempoMedio = validTempos.length > 0 
      ? Math.round((validTempos.reduce((sum, t) => sum + t.tempoTotal, 0) / validTempos.length) * 10) / 10 
      : 0;

    const dentroMeta = filteredTasks.filter(t => t.tempoTotal <= (t.quantidadePaletes || 1) * 5).length;
    const aderenciaMeta = totalMovimentacoes > 0 ? Math.round((dentroMeta / totalMovimentacoes) * 100) : 100;

    const ressuprimentoCount = filteredTasks.filter(t => t.etapa === 'Após o Carregamento').length;
    const reabastecimentoCount = filteredTasks.filter(t => t.etapa === 'Durante o Carregamento').length;

    // Empilhadores breakdown
    const empMap: Record<string, { nome: string; paletes: number; count: number; tempos: number[] }> = {};
    filteredTasks.forEach(t => {
      const op = t.operador || 'Sem Operador';
      if (!empMap[op]) empMap[op] = { nome: op, paletes: 0, count: 0, tempos: [] };
      empMap[op].paletes += t.quantidadePaletes || 1;
      empMap[op].count += 1;
      if (t.tempoTotal > 0) empMap[op].tempos.push(t.tempoTotal);
    });

    const empilhadoresStats = Object.values(empMap).map(e => ({
      nome: e.nome,
      paletes: e.paletes,
      count: e.count,
      tMedio: e.tempos.length > 0 ? Math.round((e.tempos.reduce((a, b) => a + b, 0) / e.tempos.length) * 10) / 10 : 0
    })).sort((a, b) => b.paletes - a.paletes);

    return {
      totalMovimentacoes,
      totalPaletes,
      totalCaixas,
      totalHl,
      tempoMedio,
      dentroMeta,
      aderenciaMeta,
      ressuprimentoCount,
      reabastecimentoCount,
      empilhadoresStats
    };
  }, [filteredTasks]);

  // Top 10 Ranking of the Day (Ressuprimento & Reabastecimento)
  const top10DayRessuprimento = useMemo(() => {
    const map: Record<string, { sku: number; desc: string; paletes: number; caixas: number; viagens: number; curva: string }> = {};
    dailyTasks.forEach(t => {
      const skuNum = Number(t.sku);
      const key = String(skuNum);
      const pFactors = getProductFactorData(skuNum);
      const curva = getCurvaForSku(skuNum, pFactors.curva);

      if (!map[key]) {
        map[key] = {
          sku: skuNum,
          desc: t.descricaoSku || pFactors.descricao,
          paletes: 0,
          caixas: 0,
          viagens: 0,
          curva
        };
      }
      map[key].paletes += t.quantidadePaletes || 1;
      map[key].caixas += t.quantidadeCaixas || ((t.quantidadePaletes || 1) * (t.fatorPallet || 100));
      map[key].viagens += 1;
    });

    return Object.values(map)
      .sort((a, b) => b.paletes - a.paletes)
      .slice(0, 10);
  }, [dailyTasks]);

  // Unique Empilhadores list
  const uniqueEmpilhadores = useMemo(() => {
    const set = new Set<string>();
    cleanTasks.forEach(t => {
      if (t.operador && t.operador !== 'Sem Operador') set.add(t.operador.toUpperCase());
    });
    return Array.from(set).sort();
  }, [cleanTasks]);

  // Export to Excel
  const handleExportExcel = () => {
    const dataToExport = sortedTasks.map((t, idx) => {
      const pFactors = getProductFactorData(t.sku || 0);
      const curva = getCurvaForSku(Number(t.sku), pFactors.curva);
      const targetMin = (t.quantidadePaletes || 1) * 5;
      const dentroMeta = t.tempoTotal <= targetMin ? 'SIM (<= 5 min/PL)' : 'NÃO (> 5 min/PL)';

      return {
        '# Seq': idx + 1,
        'Data Operação': t.dataSolicitacao || selectedDate,
        'Código SKU': t.sku,
        'Descrição do Produto': t.descricaoSku,
        'Curva ABC': curva,
        'Empilhador': t.operador,
        'Hora da Solicitação': t.horaSolicitacaoStr || '—',
        'Hora de Início': t.horaAceiteStr || '—',
        'Hora de Término': t.horaConclusaoStr || '—',
        'Duração Total (min)': t.tempoTotal,
        'Meta Tempo SLA (min)': targetMin,
        'Aderência à Meta': dentroMeta,
        'Qtd Paletes (PL)': t.quantidadePaletes,
        'Qtd Caixas (cx)': t.quantidadeCaixas || (t.quantidadePaletes * (t.fatorPallet || 100)),
        'Volume Hectolitros (HL)': t.quantidadeHecto || Math.round((t.quantidadePaletes * (t.fatorPallet || 100) * (t.fatorHecto || 0.072)) * 10) / 10,
        'Etapa': t.etapa === 'Após o Carregamento' ? 'Ressuprimento (Pré-Carga)' : 'Reabastecimento (Durante Carga)',
        'Conferente Solicitante': t.conferente || 'Sistema DPO',
        'Status': t.status === 'done' ? 'Concluído' : t.status === 'in_progress' ? 'Em Atendimento' : 'Pendente'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Ressuprimento_${selectedDate}`);
    XLSX.writeFile(workbook, `Detalhamento_Ressuprimento_Reabastecimento_${selectedDate}.xlsx`);
  };

  const formattedSelectedDate = useMemo(() => {
    try {
      const parts = selectedDate.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return selectedDate;
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* 1. HEADER & DATE FILTER CONTROLS */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
                <Truck className="w-5 h-5" />
              </span>
              <h2 className="text-base font-black text-slate-800 uppercase tracking-tight">
                Visão Diária Detalhada de Ressuprimento & Reabastecimento
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Rastreabilidade individual de itens abastecidos com Empilhador, Hora da Solicitação, Hora de Início e Hora de Término.
            </p>
          </div>

          {/* Quick Date Navigator & Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Top 10 Toggle Button */}
            <button
              type="button"
              onClick={() => setShowOnlyTop10(!showOnlyTop10)}
              className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer border ${
                showOnlyTop10 
                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs ring-2 ring-amber-400/30' 
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
              }`}
              title="Filtrar instantaneamente apenas os Top 10 SKUs de maior giro"
            >
              <Award className="w-4 h-4" />
              <span>{showOnlyTop10 ? '⭐ Top 10 Ativo' : 'Filtrar Top 10'}</span>
            </button>

            {/* Export Button */}
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer"
              title="Exportar listagem detalhada para planilha Excel (.xlsx)"
            >
              <Download className="w-4 h-4" />
              <span>Exportar Excel</span>
            </button>
          </div>
        </div>

        {/* DATE SELECTOR & COHERENCE FILTER BAR */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* 1. Date Picker / Navigator */}
          <div className="lg:col-span-2 flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-amber-500" /> Data Operacional
            </label>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrevDay}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
                title="Dia anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <input
                type="date"
                value={selectedDate}
                onChange={e => {
                  setSelectedDate(e.target.value);
                  if (onSelectDate) onSelectDate(e.target.value);
                }}
                className="flex-1 bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold px-3 py-2 rounded-xl outline-none focus:border-amber-500"
              />

              <button
                type="button"
                onClick={handleNextDay}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
                title="Próximo dia"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  setSelectedDate(todayStr);
                  if (onSelectDate) onSelectDate(todayStr);
                }}
                className="px-2.5 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-xl text-[10px] font-black uppercase cursor-pointer"
                title="Ir para hoje"
              >
                Hoje
              </button>
            </div>
          </div>

          {/* 2. Coherence SLA Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3 text-blue-500" /> SLA (≤ 5 min/PL)
            </label>
            <select
              value={coerenciaSla}
              onChange={e => setCoerenciaSla(e.target.value as any)}
              className="bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold px-3 py-2 rounded-xl outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all">Todos os SLAs</option>
              <option value="dentro">✅ Dentro da Meta (≤ 5 min/PL)</option>
              <option value="fora">⚠️ Fora da Meta (&gt; 5 min/PL)</option>
            </select>
          </div>

          {/* 3. Coherence Etapa Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1">
              <Layers className="w-3 h-3 text-purple-500" /> Etapa Operacional
            </label>
            <select
              value={coerenciaEtapa}
              onChange={e => setCoerenciaEtapa(e.target.value as any)}
              className="bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold px-3 py-2 rounded-xl outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all">Todas as Etapas</option>
              <option value="ressuprimento">Ressuprimento (Pré-Carga)</option>
              <option value="reabastecimento">Reabastecimento (Durante Carga)</option>
            </select>
          </div>

          {/* 4. Empilhador Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-emerald-500" /> Empilhador
            </label>
            <select
              value={selectedEmpilhador}
              onChange={e => setSelectedEmpilhador(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold px-3 py-2 rounded-xl outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all">Todos os Empilhadores</option>
              {uniqueEmpilhadores.map(emp => (
                <option key={emp} value={emp}>{emp}</option>
              ))}
            </select>
          </div>

          {/* 5. Curva ABC Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-orange-500" /> Curva ABC
            </label>
            <select
              value={coerenciaCurva}
              onChange={e => setCoerenciaCurva(e.target.value as any)}
              className="bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold px-3 py-2 rounded-xl outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all">Todas as Curvas (A, B, C)</option>
              <option value="A">Curva A (Alto Giro)</option>
              <option value="B">Curva B (Médio Giro)</option>
              <option value="C">Curva C (Baixo Giro)</option>
            </select>
          </div>
        </div>

        {/* SEARCH BAR & SUMMARY CHIPS */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por código SKU, descrição do produto, empilhador..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs pl-9 pr-3 py-2 rounded-xl outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <span>Mostrando: <strong className="text-slate-900 font-black">{filteredTasks.length}</strong> de {dailyTasks.length} movimentações no dia {formattedSelectedDate}</span>
            {showOnlyTop10 && (
              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md text-[10px] font-black uppercase">
                Filtro Top 10 Aplicado
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. DAILY SUMMARY CARDS & TOP 10 RANKING */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Total Paletes */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase text-slate-500">Paletes Movimentados</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-slate-900 font-mono">{dailySummary.totalPaletes}</span>
            <span className="text-xs font-bold text-amber-600 font-mono">{dailySummary.totalCaixas.toLocaleString()} cx</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono mt-1">{dailySummary.totalHl} Hectolitros (HL)</span>
        </div>

        {/* Movimentações / Tarefas */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase text-slate-500">Ordens de Abastecimento</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-slate-900 font-mono">{dailySummary.totalMovimentacoes}</span>
            <span className="text-xs font-bold text-blue-600 font-mono">{dailySummary.ressuprimentoCount} Pré / {dailySummary.reabastecimentoCount} Carga</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1">Concluídas no dia</span>
        </div>

        {/* Tempo Médio */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase text-slate-500">Tempo Médio Total</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-slate-900 font-mono">{dailySummary.tempoMedio} <span className="text-sm font-sans font-bold text-slate-500">min</span></span>
            <span className="text-xs font-bold text-emerald-600 font-mono">Meta: 5.0 min</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1">Por palete movimentado</span>
        </div>

        {/* Aderência SLA */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase text-slate-500">Aderência ao SLA</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className={`text-2xl font-black font-mono ${dailySummary.aderenciaMeta >= 85 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {dailySummary.aderenciaMeta}%
            </span>
            <span className="text-xs font-bold text-slate-600">{dailySummary.dentroMeta} / {dailySummary.totalMovimentacoes}</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1">Dentro da meta ≤ 5 min/PL</span>
        </div>

        {/* Empilhadores Ativos no Dia */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase text-slate-500">Empilhadores no Turno</span>
          <div className="flex flex-wrap gap-1 mt-2">
            {dailySummary.empilhadoresStats.map((emp, idx) => (
              <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded-md text-[10px] font-bold">
                {emp.nome.split(' ')[0]}: <strong className="text-emerald-700">{emp.paletes} PL</strong> ({emp.tMedio}m)
              </span>
            ))}
            {dailySummary.empilhadoresStats.length === 0 && (
              <span className="text-xs text-slate-400 italic">Nenhum operador</span>
            )}
          </div>
        </div>
      </div>

      {/* TOP 10 PRODUTOS DO DIA (QUICK CARDS) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">
              Top 10 Produtos Mais Ressupridos / Reabastecidos no Dia ({formattedSelectedDate})
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 uppercase font-bold">
            Ordenado por Volume de Paletes
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2">
          {top10DayRessuprimento.map((item, idx) => (
            <div 
              key={item.sku}
              onClick={() => {
                setSearchTerm(String(item.sku));
              }}
              className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-amber-50 hover:border-amber-300 transition-all cursor-pointer flex flex-col justify-between"
              title="Clique para filtrar apenas este SKU na listagem abaixo"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-500 text-white font-mono">
                  #{idx + 1}
                </span>
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                  item.curva === 'A' ? 'bg-red-100 text-red-700' : item.curva === 'B' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  Curva {item.curva}
                </span>
              </div>

              <div className="my-1.5">
                <span className="text-[10px] font-bold text-slate-800 line-clamp-1 block" title={item.desc}>
                  {item.desc}
                </span>
                <span className="text-[9px] font-mono text-slate-500 font-bold block">
                  SKU {item.sku}
                </span>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200/60 pt-1 text-[10px] font-mono">
                <span className="font-black text-slate-900">{item.paletes} PL</span>
                <span className="text-slate-500 font-bold">{item.viagens} ordens</span>
              </div>
            </div>
          ))}
          {top10DayRessuprimento.length === 0 && (
            <div className="col-span-5 text-center p-4 text-xs text-slate-400 italic">
              Nenhuma movimentação registrada no dia selecionado.
            </div>
          )}
        </div>
      </div>

      {/* 3. DETAILED DATA TABLE (ITEM, EMPILHADOR, HORA SOLICITAÇÃO, HORA INÍCIO, HORA TÉRMINO) */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">
              Listagem Detalhada de Itens Ressupridos ({paginatedTasks.length} de {filteredTasks.length})
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Linhas por página:</span>
            <select
              value={itemsPerPage}
              onChange={e => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-300 text-xs font-bold px-2 py-1 rounded-lg outline-none cursor-pointer"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={250}>250</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-600 uppercase font-bold text-[9.5px] tracking-wider select-none">
                <th className="py-2.5 px-3 text-center w-12">#</th>
                <th 
                  onClick={() => {
                    if (sortField === 'sku') setSortAsc(!sortAsc);
                    else { setSortField('sku'); setSortAsc(true); }
                  }}
                  className="py-2.5 px-3 cursor-pointer hover:bg-slate-200/70 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Item / SKU</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-2.5 px-3">Empilhador</th>
                <th 
                  onClick={() => {
                    if (sortField === 'horaSolicitacao') setSortAsc(!sortAsc);
                    else { setSortField('horaSolicitacao'); setSortAsc(true); }
                  }}
                  className="py-2.5 px-3 text-center cursor-pointer hover:bg-slate-200/70 transition-colors"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Hora Solicitação</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th 
                  onClick={() => {
                    if (sortField === 'horaAceite') setSortAsc(!sortAsc);
                    else { setSortField('horaAceite'); setSortAsc(true); }
                  }}
                  className="py-2.5 px-3 text-center cursor-pointer hover:bg-slate-200/70 transition-colors"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Hora Início</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th 
                  onClick={() => {
                    if (sortField === 'horaConclusao') setSortAsc(!sortAsc);
                    else { setSortField('horaConclusao'); setSortAsc(true); }
                  }}
                  className="py-2.5 px-3 text-center cursor-pointer hover:bg-slate-200/70 transition-colors"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Hora Término</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th 
                  onClick={() => {
                    if (sortField === 'tempoTotal') setSortAsc(!sortAsc);
                    else { setSortField('tempoTotal'); setSortAsc(true); }
                  }}
                  className="py-2.5 px-3 text-center cursor-pointer hover:bg-slate-200/70 transition-colors"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Duração (min)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th 
                  onClick={() => {
                    if (sortField === 'quantidadePaletes') setSortAsc(!sortAsc);
                    else { setSortField('quantidadePaletes'); setSortAsc(false); }
                  }}
                  className="py-2.5 px-3 text-center cursor-pointer hover:bg-slate-200/70 transition-colors"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Volume (PL / cx)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-2.5 px-3 text-center">Etapa</th>
                <th className="py-2.5 px-3 text-center">Status SLA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedTasks.map((task, idx) => {
                const globalIndex = (currentPage - 1) * itemsPerPage + idx + 1;
                const pFactors = getProductFactorData(task.sku || 0);
                const curva = getCurvaForSku(Number(task.sku), pFactors.curva);
                const targetMin = (task.quantidadePaletes || 1) * 5;
                const isWithinSla = task.tempoTotal <= targetMin;

                return (
                  <tr key={task.id || idx} className="hover:bg-amber-50/40 transition-colors text-[11px]">
                    {/* Index */}
                    <td className="py-2 px-3 text-center font-mono text-slate-400 font-bold">
                      {globalIndex}
                    </td>

                    {/* Item (SKU + Descrição + Curva) */}
                    <td className="py-2 px-3 font-bold min-w-[220px]">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded shrink-0 ${
                          curva === 'A' ? 'bg-red-100 text-red-700' : curva === 'B' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {curva}
                        </span>
                        <div className="flex flex-col min-w-0">
                          <span className="font-mono text-amber-700 font-extrabold leading-tight">#{task.sku}</span>
                          <span className="text-slate-800 truncate font-semibold leading-tight" title={task.descricaoSku}>
                            {task.descricaoSku}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Empilhador */}
                    <td className="py-2 px-3 font-bold whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 font-mono text-[10.5px]">
                        <UserCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>{task.operador || 'Empilhador'}</span>
                      </span>
                    </td>

                    {/* Hora Solicitação */}
                    <td className="py-2 px-3 text-center font-mono font-bold text-slate-700 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                        {task.horaSolicitacaoStr || '—'}
                      </span>
                    </td>

                    {/* Hora Início (Aceite) */}
                    <td className="py-2 px-3 text-center font-mono font-bold text-slate-700 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200">
                        {task.horaAceiteStr || '—'}
                      </span>
                    </td>

                    {/* Hora Término (Conclusão) */}
                    <td className="py-2 px-3 text-center font-mono font-bold text-slate-700 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {task.horaConclusaoStr || '—'}
                      </span>
                    </td>

                    {/* Duração Total */}
                    <td className="py-2 px-3 text-center font-mono whitespace-nowrap">
                      <span className={`font-black ${isWithinSla ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {task.tempoTotal} min
                      </span>
                      <span className="text-[9px] text-slate-400 block font-normal">
                        (meta: {targetMin}m)
                      </span>
                    </td>

                    {/* Volume (PL / cx / HL) */}
                    <td className="py-2 px-3 text-center font-mono whitespace-nowrap">
                      <span className="font-black text-slate-900 block">
                        {task.quantidadePaletes} PL
                      </span>
                      <span className="text-[9px] text-slate-500 font-bold block">
                        {task.quantidadeCaixas || (task.quantidadePaletes * (task.fatorPallet || 100))} cx • {task.quantidadeHecto} HL
                      </span>
                    </td>

                    {/* Etapa */}
                    <td className="py-2 px-3 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                        task.etapa === 'Após o Carregamento' 
                          ? 'bg-blue-50 text-blue-700 border-blue-200' 
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {task.etapa === 'Após o Carregamento' ? 'Ressuprimento' : 'Reabastecimento'}
                      </span>
                    </td>

                    {/* Status SLA */}
                    <td className="py-2 px-3 text-center whitespace-nowrap">
                      {isWithinSla ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md font-bold text-[9.5px]">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Dentro da Meta</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md font-bold text-[9.5px]">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>Fora da Meta</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {paginatedTasks.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400 font-mono text-xs uppercase">
                    Nenhuma tarefa de ressuprimento/reabastecimento encontrada para os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION CONTROLS */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/50 text-xs">
          <span className="text-slate-500 font-bold">
            Página {currentPage} de {totalPages} ({filteredTasks.length} registros totais)
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 cursor-pointer"
            >
              Anterior
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pNum = i + 1;
              if (totalPages > 5) {
                if (currentPage > 3) pNum = currentPage - 2 + i;
                if (pNum > totalPages) pNum = totalPages - 4 + i;
              }
              return (
                <button
                  key={pNum}
                  type="button"
                  onClick={() => setCurrentPage(pNum)}
                  className={`w-8 h-8 rounded-lg font-bold text-xs cursor-pointer ${
                    currentPage === pNum 
                      ? 'bg-amber-500 text-white shadow-2xs' 
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {pNum}
                </button>
              );
            })}

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 cursor-pointer"
            >
              Próxima
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
