import React, { useState, useEffect, useMemo } from 'react';
import { 
  Truck, 
  Layers, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  BarChart2, 
  Sparkles, 
  Package, 
  ShieldCheck, 
  FileSpreadsheet, 
  ArrowUpRight, 
  Activity, 
  Box, 
  Zap,
  Info,
  Calendar
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  BarChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  Cell, 
  PieChart, 
  Pie 
} from 'recharts';
import { getStoredTasks } from '../utils/rrManager';
import { isCleaningProduct } from '../utils/generateRessuprimentoData';
import { getProductMeta, getProductUnit } from '../utils/productCatalogData';
import { Tarefa, Usuario } from '../types';
import * as XLSX from 'xlsx';

export interface PickingAbcItem {
  rank: number;
  codigo: number;
  produto: string;
  classeABC: 'A' | 'B' | 'C';
  totalCaixas: number;
  totalPaletes: number;
  totalViagens: number;
  vendaMediaDiariaCaixas: number;
  vendaMediaDiariaPaletes: number;
  tempoMedioMin: number;
  tempoTotalMin: number;
  percentualVolume: number;
  percentualAcumulado: number;
  percentualViagens: number;
  percentualViagensAcumulado: number;
  unidade: string;
  fatorPallet: number;
  lastro: number;
  ultimaData?: string;
  operadores: string[];
  recomendacaoLogistica: string;
  statusSla: 'excelente' | 'atencao' | 'critico';
}

interface CurvaAbcPickingTabProps {
  user?: Usuario;
  empresaId?: string;
}

// Fast ISO date month extractor (e.g., '2026-05-12' -> 5) avoiding expensive Date object allocations
function getFastTaskMonth(dStr?: string): number | null {
  if (!dStr) return null;
  if (typeof dStr === 'string' && dStr.length >= 7 && dStr[4] === '-') {
    const m = parseInt(dStr.substring(5, 7), 10);
    if (!isNaN(m) && m >= 1 && m <= 12) return m;
  }
  const d = new Date(dStr);
  return isNaN(d.getTime()) ? null : d.getMonth() + 1;
}

export default function CurvaAbcPickingTab({ user, empresaId = 'demo' }: CurvaAbcPickingTabProps) {
  const [tasks, setTasks] = useState<Tarefa[]>([]);
  const [periodo, setPeriodo] = useState<'all' | 'today' | '7d' | '30d'>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState<'TODAS' | 'A' | 'B' | 'C'>('TODAS');
  const [criterioRanking, setCriterioRanking] = useState<'caixas' | 'viagens'>('caixas');
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState<string>(new Date().toLocaleTimeString('pt-BR'));
  
  // Pagination for smooth DOM rendering
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const effectiveEmpresaId = empresaId || (typeof localStorage !== 'undefined' ? (localStorage.getItem('af_empresa_id') || localStorage.getItem('empresa_ativa_id') || 'demo') : 'demo');

  // Load replenishment tasks directly from unified Ressuprimento & Reabastecimento pool
  const loadReplenishmentTasks = () => {
    setLoading(true);
    try {
      const stored = getStoredTasks(effectiveEmpresaId);
      
      // Filter out cleaning products (like Ypê) and keep all valid picking replenishment tasks
      const validTasks = stored.filter(t => !isCleaningProduct(t.descricao));

      setTasks(validTasks);
      setLastSync(new Date().toLocaleTimeString('pt-BR'));
    } catch (e) {
      console.error('Erro ao carregar tarefas de ressuprimento:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReplenishmentTasks();

    let timeoutId: any = null;
    const handleUpdate = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        loadReplenishmentTasks();
      }, 100);
    };

    window.addEventListener('tasks_updated', handleUpdate);
    window.addEventListener('tarefas_updated', handleUpdate);
    window.addEventListener('local_data_changed', handleUpdate);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('tasks_updated', handleUpdate);
      window.removeEventListener('tarefas_updated', handleUpdate);
      window.removeEventListener('local_data_changed', handleUpdate);
    };
  }, [effectiveEmpresaId]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, classFilter, periodo, selectedMonth, criterioRanking]);

  // Filter tasks by period and month with fast string checks
  const filteredTasks = useMemo(() => {
    const monthNum = selectedMonth === 'all' ? null : parseInt(selectedMonth, 10);
    const now = new Date().getTime();
    const oneDay = 24 * 60 * 60 * 1000;

    return tasks.filter(t => {
      const taskDateStr = t.criadoEm || t.iniciadoEm || t.finalizadoEm || (t as any).data;

      // 1. Month Filter
      if (monthNum !== null) {
        if (!taskDateStr) return false;
        const taskMonth = getFastTaskMonth(taskDateStr);
        if (taskMonth !== monthNum) return false;
      }

      // 2. Relative Period Filter
      if (periodo === 'all') return true;
      if (!taskDateStr) return true;
      const taskTime = new Date(taskDateStr).getTime();
      if (isNaN(taskTime)) return true;

      const diff = now - taskTime;
      if (periodo === 'today') return diff <= oneDay;
      if (periodo === '7d') return diff <= 7 * oneDay;
      if (periodo === '30d') return diff <= 30 * oneDay;
      return true;
    });
  }, [tasks, periodo, selectedMonth]);

  // Calculate Pareto ABC Picking Items
  const { abcItems, resumo } = useMemo(() => {
    const skuMap = new Map<number, {
      codigo: number;
      produto: string;
      totalCaixas: number;
      totalPaletes: number;
      totalViagens: number;
      tempoTotalMin: number;
      tempos: number[];
      ultimaData?: string;
      operadores: Set<string>;
    }>();

    // Calculate operational active days in the filtered dataset
    const distinctDates = new Set(
      filteredTasks
        .map(t => ((t as any).dataSolicitacao || t.criadoEm || t.finalizadoEm || (t as any).data || '').split('T')[0].split(' ')[0])
        .filter(Boolean)
    );
    const diasOperacionais = Math.max(1, distinctDates.size || (periodo === 'today' ? 1 : periodo === '7d' ? 7 : periodo === '30d' ? 30 : 170));

    filteredTasks.forEach(task => {
      const rawCode = (task as any).codSKU || (task as any).codigo || (task as any).sku || (task.descricao && task.descricao.match(/^\d+/)?.[0]);
      const codeNum = Number(rawCode);
      if (!codeNum || isNaN(codeNum)) return;

      const desc = (task as any).produto || task.descricao || `Produto ${codeNum}`;
      const meta = getProductMeta(codeNum, effectiveEmpresaId);
      const fatorPallet = meta.fatorPallet && meta.fatorPallet > 0 ? meta.fatorPallet : 50;

      // Extract accurate Pallets and Caixas
      let qtdPaletes = Number((task as any).quantidadePaletes || (task as any).paletes || (task as any).qtdPallet || 0);
      let qtdCaixas = Number(task.quantidade || (task as any).quantidadeCaixas || (task as any).quantidadeCX || (task as any).qtd || 0);

      if (qtdPaletes <= 0 && qtdCaixas > 0) {
        qtdPaletes = Math.max(1, Math.ceil(qtdCaixas / fatorPallet));
      } else if (qtdPaletes > 0 && qtdCaixas <= 0) {
        qtdCaixas = qtdPaletes * fatorPallet;
      } else if (qtdPaletes <= 0 && qtdCaixas <= 0) {
        qtdPaletes = 1;
        qtdCaixas = fatorPallet;
      }

      const duracao = Number((task as any).duracaoMin || task.tempoExecucao || (task as any).tempoTotal || 5);
      const operador = task.operador || (task as any).executorNome || 'Empilhador';
      const taskData = task.finalizadoEm || task.iniciadoEm || task.criadoEm || (task as any).data;

      if (!skuMap.has(codeNum)) {
        skuMap.set(codeNum, {
          codigo: codeNum,
          produto: desc,
          totalCaixas: 0,
          totalPaletes: 0,
          totalViagens: 0,
          tempoTotalMin: 0,
          tempos: [],
          ultimaData: taskData,
          operadores: new Set()
        });
      }

      const entry = skuMap.get(codeNum)!;
      entry.totalCaixas += qtdCaixas;
      entry.totalPaletes += qtdPaletes;
      entry.totalViagens += 1;
      entry.tempoTotalMin += duracao;
      entry.tempos.push(duracao);
      if (operador) entry.operadores.add(operador);
      if (taskData) entry.ultimaData = taskData;
    });

    const list = Array.from(skuMap.values());

    // Sort descending based on ranking criteria
    if (criterioRanking === 'viagens') {
      list.sort((a, b) => b.totalViagens - a.totalViagens);
    } else {
      list.sort((a, b) => b.totalCaixas - a.totalCaixas);
    }

    const totalCaixasGeral = list.reduce((sum, item) => sum + item.totalCaixas, 0) || 1;
    const totalViagensGeral = list.reduce((sum, item) => sum + item.totalViagens, 0) || 1;
    const totalPaletesGeral = list.reduce((sum, item) => sum + item.totalPaletes, 0) || 1;
    const tempoTotalGeral = list.reduce((sum, item) => sum + item.tempoTotalMin, 0);

    let acumCaixas = 0;
    let acumViagens = 0;

    let countA = 0, cxA = 0, viagA = 0, palA = 0;
    let countB = 0, cxB = 0, viagB = 0, palB = 0;
    let countC = 0, cxC = 0, viagC = 0, palC = 0;

    const processedItems: PickingAbcItem[] = list.map((item, index) => {
      acumCaixas += item.totalCaixas;
      acumViagens += item.totalViagens;

      const pctVol = (item.totalCaixas / totalCaixasGeral) * 100;
      const pctVolAcum = (acumCaixas / totalCaixasGeral) * 100;
      const pctViag = (item.totalViagens / totalViagensGeral) * 100;
      const pctViagAcum = (acumViagens / totalViagensGeral) * 100;

      // ABC classification based on Pareto 70 / 20 / 10
      const primaryAcum = criterioRanking === 'viagens' ? pctViagAcum : pctVolAcum;
      let classe: 'A' | 'B' | 'C' = 'C';

      if (primaryAcum <= 70.01 || index === 0) {
        classe = 'A';
        countA++;
        cxA += item.totalCaixas;
        palA += item.totalPaletes;
        viagA += item.totalViagens;
      } else if (primaryAcum <= 90.01) {
        classe = 'B';
        countB++;
        cxB += item.totalCaixas;
        palB += item.totalPaletes;
        viagB += item.totalViagens;
      } else {
        classe = 'C';
        countC++;
        cxC += item.totalCaixas;
        palC += item.totalPaletes;
        viagC += item.totalViagens;
      }

      const tempoMedio = item.tempos.length > 0 
        ? Math.round((item.tempoTotalMin / item.tempos.length) * 10) / 10 
        : 5.0;

      const meta = getProductMeta(item.codigo, effectiveEmpresaId);
      const unit = getProductUnit(meta, 'cx');

      const vMediaCaixas = Math.round((item.totalCaixas / diasOperacionais) * 10) / 10;
      const vMediaPaletes = Math.round((item.totalPaletes / diasOperacionais) * 100) / 100;

      // Recommendation logic
      let recomendacao = 'Fluxo de reabastecimento balanceado no picking.';
      let sla: 'excelente' | 'atencao' | 'critico' = 'excelente';

      if (classe === 'A') {
        if (item.totalViagens >= 10) {
          recomendacao = '🚨 Alta Frequência: Recomenda-se alocação em duplo pallet (2 PL) na rua principal (Nível 0).';
        } else {
          recomendacao = '⭐ Item Crítico Curva A: Manter no nível do solo (Piso) próximo à doca para agilizar ressuprimento.';
        }
      } else if (classe === 'B') {
        recomendacao = '📦 Curva B: Manter 1 posição de pallet no picking com reposição no ponto de pedido (30%).';
      } else {
        recomendacao = '💤 Curva C: Demanda esporádica. Pode ser alocado em ruas secundárias ou posições elevadas.';
      }

      if (tempoMedio > 10) {
        sla = 'critico';
      } else if (tempoMedio > 6) {
        sla = 'atencao';
      }

      return {
        rank: index + 1,
        codigo: item.codigo,
        produto: item.produto,
        classeABC: classe,
        totalCaixas: item.totalCaixas,
        totalPaletes: item.totalPaletes,
        totalViagens: item.totalViagens,
        vendaMediaDiariaCaixas: vMediaCaixas,
        vendaMediaDiariaPaletes: vMediaPaletes,
        tempoMedioMin: tempoMedio,
        tempoTotalMin: Math.round(item.tempoTotalMin * 10) / 10,
        percentualVolume: Math.round(pctVol * 100) / 100,
        percentualAcumulado: Math.round(pctVolAcum * 100) / 100,
        percentualViagens: Math.round(pctViag * 100) / 100,
        percentualViagensAcumulado: Math.round(pctViagAcum * 100) / 100,
        unidade: unit,
        fatorPallet: meta.fatorPallet || 50,
        lastro: meta.lastro || 10,
        ultimaData: item.ultimaData,
        operadores: Array.from(item.operadores),
        recomendacaoLogistica: recomendacao,
        statusSla: sla
      };
    });

    const resumoData = {
      totalSkus: processedItems.length,
      totalCaixas: totalCaixasGeral,
      totalPaletes: totalPaletesGeral,
      totalViagens: totalViagensGeral,
      diasOperacionais,
      mediaPaletesDia: Math.round((totalPaletesGeral / diasOperacionais) * 10) / 10,
      mediaCaixasDia: Math.round((totalCaixasGeral / diasOperacionais) * 10) / 10,
      tempoMedioGeral: totalViagensGeral > 0 ? Math.round((tempoTotalGeral / totalViagensGeral) * 10) / 10 : 5.0,
      classeA: { count: countA, caixas: cxA, paletes: palA, viagens: viagA, pct: totalCaixasGeral > 0 ? Math.round((cxA / totalCaixasGeral) * 100) : 0 },
      classeB: { count: countB, caixas: cxB, paletes: palB, viagens: viagB, pct: totalCaixasGeral > 0 ? Math.round((cxB / totalCaixasGeral) * 100) : 0 },
      classeC: { count: countC, caixas: cxC, paletes: palC, viagens: viagC, pct: totalCaixasGeral > 0 ? Math.round((cxC / totalCaixasGeral) * 100) : 0 },
    };

    return { abcItems: processedItems, resumo: resumoData };
  }, [filteredTasks, criterioRanking, effectiveEmpresaId]);

  // Filter items by search and class filter
  const displayedItems = useMemo(() => {
    return abcItems.filter(item => {
      const matchSearch = searchTerm === '' ||
        String(item.codigo).includes(searchTerm) ||
        item.produto.toLowerCase().includes(searchTerm.toLowerCase());

      const matchClass = classFilter === 'TODAS' || item.classeABC === classFilter;

      return matchSearch && matchClass;
    });
  }, [abcItems, searchTerm, classFilter]);

  // Paginate table items for high-speed rendering
  const totalPages = Math.ceil(displayedItems.length / itemsPerPage) || 1;
  const paginatedItems = useMemo(() => {
    if (itemsPerPage >= 9999) return displayedItems;
    const start = (currentPage - 1) * itemsPerPage;
    return displayedItems.slice(start, start + itemsPerPage);
  }, [displayedItems, currentPage, itemsPerPage]);

  // Chart data: Top 10 SKUs Pareto
  const chartData = useMemo(() => {
    return abcItems.slice(0, 10).map(item => ({
      name: `${item.codigo} - ${item.produto.length > 15 ? item.produto.slice(0, 15) + '...' : item.produto}`,
      codigo: item.codigo,
      produto: item.produto,
      caixas: item.totalCaixas,
      viagens: item.totalViagens,
      acumulado: criterioRanking === 'viagens' ? item.percentualViagensAcumulado : item.percentualAcumulado,
      tempoMedio: item.tempoMedioMin,
      classe: item.classeABC
    }));
  }, [abcItems, criterioRanking]);

  // Donut chart data: Volume distribution
  const pieData = useMemo(() => {
    return [
      { name: 'Classe A (80% Demanda)', value: resumo.classeA.caixas, count: resumo.classeA.count, color: '#10b981' },
      { name: 'Classe B (15% Demanda)', value: resumo.classeB.caixas, count: resumo.classeB.count, color: '#f59e0b' },
      { name: 'Classe C (5% Demanda)', value: resumo.classeC.caixas, count: resumo.classeC.count, color: '#64748b' },
    ].filter(d => d.value > 0);
  }, [resumo]);

  // Export to Excel
  const handleExportExcel = () => {
    if (abcItems.length === 0) {
      alert('Não há dados para exportar.');
      return;
    }

    const rows = abcItems.map(item => ({
      'Rank': item.rank,
      'Código SKU': item.codigo,
      'Descrição do Produto': item.produto,
      'Classe ABC Picking': item.classeABC,
      'Total Caixas Abastecidas': item.totalCaixas,
      'Unidade': item.unidade,
      'Total Paletes': item.totalPaletes,
      'Nº de Viagens (Ressuprimentos)': item.totalViagens,
      '% Volume': `${item.percentualVolume}%`,
      '% Acumulado': `${item.percentualAcumulado}%`,
      'Tempo Médio (min)': item.tempoMedioMin,
      'Tempo Total (min)': item.tempoTotalMin,
      'Fator Pallet (cx/PL)': item.fatorPallet,
      'Lastro (cx)': item.lastro,
      'Recomendação Logística': item.recomendacaoLogistica
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Curva_ABC_Picking');
    XLSX.writeFile(wb, `Curva_ABC_Picking_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Header & Submenu */}
      <div className="bg-[#111a30] border border-emerald-900/40 rounded-2xl p-5 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                LOGÍSTICA INTERNA & RESUPRIMENTO
              </span>
              <span className="text-xs text-slate-400">Sincronizado: {lastSync}</span>
            </div>
            <h2 className="text-lg font-black uppercase tracking-tight text-white mt-1">
              Curva ABC Picking — Ressuprimento & Reabastecimento
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Classificação Pareto de intensidade de abastecimento do picking gerada automaticamente a partir do relatório de empilhadores.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Mês Selector */}
          <div className="flex items-center bg-[#0b1222] px-2 py-1 rounded-xl border border-slate-800 text-xs">
            <span className="text-[10px] font-black uppercase text-slate-400 mr-1.5">Mês:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-white font-bold text-xs pr-2 py-1 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-white">Ano Todo (Consolidado)</option>
              <option value="1" className="bg-slate-900 text-white">01 - Janeiro</option>
              <option value="2" className="bg-slate-900 text-white">02 - Fevereiro</option>
              <option value="3" className="bg-slate-900 text-white">03 - Março</option>
              <option value="4" className="bg-slate-900 text-white">04 - Abril</option>
              <option value="5" className="bg-slate-900 text-white">05 - Maio</option>
              <option value="6" className="bg-slate-900 text-white">06 - Junho</option>
              <option value="7" className="bg-slate-900 text-white">07 - Julho</option>
              <option value="8" className="bg-slate-900 text-white">08 - Agosto</option>
              <option value="9" className="bg-slate-900 text-white">09 - Setembro</option>
              <option value="10" className="bg-slate-900 text-white">10 - Outubro</option>
              <option value="11" className="bg-slate-900 text-white">11 - Novembro</option>
              <option value="12" className="bg-slate-900 text-white">12 - Dezembro</option>
            </select>
          </div>

          {/* Período Selector */}
          <div className="flex bg-[#0b1222] p-1 rounded-xl border border-slate-800 text-xs font-bold">
            <button
              onClick={() => setPeriodo('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${periodo === 'all' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              Total
            </button>
            <button
              onClick={() => setPeriodo('30d')}
              className={`px-3 py-1.5 rounded-lg transition-all ${periodo === '30d' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              30 Dias
            </button>
            <button
              onClick={() => setPeriodo('7d')}
              className={`px-3 py-1.5 rounded-lg transition-all ${periodo === '7d' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              7 Dias
            </button>
            <button
              onClick={() => setPeriodo('today')}
              className={`px-3 py-1.5 rounded-lg transition-all ${periodo === 'today' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              Hoje
            </button>
          </div>

          <button
            onClick={loadReplenishmentTasks}
            disabled={loading}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
            title="Atualizar com as tarefas mais recentes dos empilhadores"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar Excel</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Ressuprimentos */}
        <div className="bg-[#111a30] border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Paletes Movimentados</span>
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black font-mono text-white">
              {resumo.totalPaletes.toLocaleString('pt-BR')} <span className="text-xs font-normal text-slate-400">PL</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <span>{resumo.totalViagens.toLocaleString('pt-BR')} viagens concluídas</span>
            </div>
          </div>
        </div>

        {/* Card 2: Demanda Média Diária */}
        <div className="bg-[#111a30] border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Demanda Média Diária</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black font-mono text-emerald-400">
              {resumo.mediaPaletesDia.toLocaleString('pt-BR')} <span className="text-xs font-normal text-slate-400">PL/dia</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              <span>{resumo.mediaCaixasDia.toLocaleString('pt-BR')} cx/dia ({resumo.diasOperacionais} dias de operação)</span>
            </div>
          </div>
        </div>

        {/* Card 3: Tempo Médio por Viagem */}
        <div className="bg-[#111a30] border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Tempo Médio Ressuprimento</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black font-mono text-amber-400">
              {resumo.tempoMedioGeral} <span className="text-xs font-normal text-slate-400">min/viagem</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              <span>Meta DPO SLA: &le; 5.0 min / pallet</span>
            </div>
          </div>
        </div>

        {/* Card 4: SKUs Curva A */}
        <div className="bg-[#111a30] border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Curva A de Picking (70% Fluxo)</span>
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black font-mono text-purple-400">
              {resumo.classeA.count} <span className="text-xs font-normal text-slate-400">SKUs ({resumo.classeA.pct}% do fluxo)</span>
            </div>
            <div className="text-[11px] text-purple-300/80 mt-1">
              <span>{resumo.classeA.paletes} PL em {resumo.classeA.viagens} viagens</span>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts Row */}
      {abcItems.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top 10 SKUs Pareto Chart */}
          <div className="lg:col-span-2 bg-[#111a30] border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-sm font-black uppercase text-white flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-emerald-400" />
                  Pareto Top 10 SKUs com Maior Demanda de Ressuprimento
                </h3>
                <p className="text-[11px] text-slate-400">
                  Volume de caixas abastecidas e curva percentual acumulada de esforço operacional.
                </p>
              </div>

              <div className="flex bg-[#0b1222] p-1 rounded-xl border border-slate-800 text-[10px] font-bold">
                <button
                  onClick={() => setCriterioRanking('caixas')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${criterioRanking === 'caixas' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Por Caixas
                </button>
                <button
                  onClick={() => setCriterioRanking('viagens')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${criterioRanking === 'viagens' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Por Viagens
                </button>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 20, bottom: 35, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#94a3b8', fontSize: 9 }} 
                    angle={-25} 
                    textAnchor="end" 
                    interval={0}
                  />
                  <YAxis 
                    yAxisId="left" 
                    tick={{ fill: '#94a3b8', fontSize: 10 }} 
                    label={{ value: criterioRanking === 'viagens' ? 'Viagens' : 'Caixas', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    domain={[0, 100]} 
                    tick={{ fill: '#f59e0b', fontSize: 10 }} 
                    unit="%"
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                    formatter={(value: any, name: string) => {
                      if (name === 'acumulado') return [`${value}%`, '% Acumulado (Pareto)'];
                      if (name === 'caixas') return [`${Number(value).toLocaleString('pt-BR')} cx`, 'Volume Abastecido'];
                      if (name === 'viagens') return [`${value} viagens`, 'Viagens Ressuprimento'];
                      return [value, name];
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar 
                    yAxisId="left" 
                    dataKey={criterioRanking === 'viagens' ? 'viagens' : 'caixas'} 
                    name={criterioRanking === 'viagens' ? 'Viagens de Empilhadeira' : 'Volume de Caixas'} 
                    radius={[6, 6, 0, 0]}
                  >
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.classe === 'A' ? '#10b981' : entry.classe === 'B' ? '#f59e0b' : '#64748b'} 
                      />
                    ))}
                  </Bar>
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="acumulado" 
                    name="% Acumulado (Pareto)" 
                    stroke="#f59e0b" 
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#f59e0b' }} 
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Breakdown ABC Donut */}
          <div className="bg-[#111a30] border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-black uppercase text-white flex items-center gap-2 mb-1">
                <Layers className="w-4 h-4 text-purple-400" />
                Distribuição das Classes no Picking
              </h3>
              <p className="text-[11px] text-slate-400">
                Divisão de esforço de abastecimento no armazém.
              </p>
            </div>

            <div className="h-48 my-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`pie-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                    formatter={(val: any) => [`${Number(val).toLocaleString('pt-BR')} cx`, 'Volume']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="font-bold text-emerald-300">Classe A (80% Demanda)</span>
                </div>
                <span className="font-mono font-bold text-white">{resumo.classeA.count} SKUs ({resumo.classeA.pct}%)</span>
              </div>

              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="font-bold text-amber-300">Classe B (15% Demanda)</span>
                </div>
                <span className="font-mono font-bold text-white">{resumo.classeB.count} SKUs ({resumo.classeB.pct}%)</span>
              </div>

              <div className="p-2 rounded-xl bg-slate-500/10 border border-slate-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  <span className="font-bold text-slate-300">Classe C (5% Demanda)</span>
                </div>
                <span className="font-mono font-bold text-white">{resumo.classeC.count} SKUs ({resumo.classeC.pct}%)</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#111a30] border border-slate-800 rounded-2xl p-10 text-center">
          <div className="w-14 h-14 bg-slate-800/80 rounded-2xl mx-auto flex items-center justify-center text-slate-400 mb-3">
            <Truck className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white">Nenhum Registro de Ressuprimento Encontrado</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
            Não há tarefas de ressuprimento/reabastecimento registradas ou importadas no módulo de Empilhadores para o período selecionado.
          </p>
        </div>
      )}

      {/* Table Section */}
      <div className="bg-[#111a30] border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full md:w-80">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar SKU ou Produto no Picking..."
                className="w-full bg-[#0b1222] border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            {/* Class Filter */}
            <div className="flex bg-[#0b1222] p-1 rounded-xl border border-slate-800 text-xs font-bold">
              <button
                onClick={() => setClassFilter('TODAS')}
                className={`px-3 py-1.5 rounded-lg transition-all ${classFilter === 'TODAS' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Todas
              </button>
              <button
                onClick={() => setClassFilter('A')}
                className={`px-3 py-1.5 rounded-lg transition-all ${classFilter === 'A' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Classe A
              </button>
              <button
                onClick={() => setClassFilter('B')}
                className={`px-3 py-1.5 rounded-lg transition-all ${classFilter === 'B' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Classe B
              </button>
              <button
                onClick={() => setClassFilter('C')}
                className={`px-3 py-1.5 rounded-lg transition-all ${classFilter === 'C' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Classe C
              </button>
            </div>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#0b1222] text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
                <th className="p-3 text-center w-12">Rank</th>
                <th className="p-3 w-20">Código</th>
                <th className="p-3">Produto</th>
                <th className="p-3 text-center w-24">Curva Picking</th>
                <th className="p-3 text-right w-28">Demanda Média</th>
                <th className="p-3 text-right w-28">Total Abastecido</th>
                <th className="p-3 text-right w-20">Pallets</th>
                <th className="p-3 text-right w-20">Viagens</th>
                <th className="p-3 text-right w-20">% Volume</th>
                <th className="p-3 text-right w-24">% Acumulado</th>
                <th className="p-3 text-right w-24">Tempo Médio</th>
                <th className="p-3">Diretriz Logística & Alocação de Picking</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {paginatedItems.length > 0 ? (
                paginatedItems.map((item) => (
                  <tr key={item.codigo} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 text-center font-mono font-bold text-slate-400">
                      #{item.rank}
                    </td>
                    <td className="p-3 font-mono font-bold text-amber-500">
                      {item.codigo}
                    </td>
                    <td className="p-3 font-bold text-white uppercase">
                      {item.produto}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-black uppercase ${
                        item.classeABC === 'A' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                        item.classeABC === 'B' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                        'bg-slate-500/20 text-slate-400 border border-slate-500/40'
                      }`}>
                        Classe {item.classeABC}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-400">
                      <div>{item.vendaMediaDiariaPaletes} <span className="text-[10px] text-slate-400">PL/dia</span></div>
                      <div className="text-[10px] text-slate-400">{item.vendaMediaDiariaCaixas} cx/dia</div>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-white">
                      {item.totalCaixas.toLocaleString('pt-BR')} {item.unidade}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-blue-400">
                      {item.totalPaletes} PL
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-purple-400">
                      {item.totalViagens}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-300">
                      {item.percentualVolume}%
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-amber-400">
                      {item.percentualAcumulado}%
                    </td>
                    <td className="p-3 text-right font-mono font-bold">
                      <span className={`${
                        item.statusSla === 'excelente' ? 'text-emerald-400' :
                        item.statusSla === 'atencao' ? 'text-amber-400' :
                        'text-rose-400'
                      }`}>
                        {item.tempoMedioMin} min
                      </span>
                    </td>
                    <td className="p-3 text-slate-300 text-[11px]">
                      <span className="leading-tight">{item.recomendacaoLogistica}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={12} className="p-8 text-center text-slate-400">
                    Nenhum SKU encontrado com os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {displayedItems.length > 0 && (
          <div className="p-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0b1222]/80">
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span>
                Exibindo <span className="font-bold text-white">{Math.min(displayedItems.length, (currentPage - 1) * itemsPerPage + 1)}</span> - <span className="font-bold text-white">{Math.min(currentPage * itemsPerPage, displayedItems.length)}</span> de <span className="font-bold text-amber-400">{displayedItems.length}</span> SKUs
              </span>
              <div className="flex items-center gap-1.5 ml-2">
                <span className="text-[11px] text-slate-500">Por página:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-slate-900 border border-slate-700 text-slate-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                  <option value={9999}>Todos</option>
                </select>
              </div>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-xs font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Anterior
                </button>
                <span className="px-3 py-1 text-xs text-slate-400 font-mono">
                  Página <strong className="text-white">{currentPage}</strong> de <strong className="text-white">{totalPages}</strong>
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-xs font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Próxima
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
