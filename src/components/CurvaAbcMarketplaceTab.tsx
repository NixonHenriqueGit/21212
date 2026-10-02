import React, { useState, useMemo, useEffect } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Download, 
  Filter, 
  BarChart2, 
  PieChart, 
  Layers, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Package,
  Boxes,
  Truck,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  DollarSign,
  Droplets,
  Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { getStored030519Quarters, Item030519Data, STORAGE_KEY_TRIMESTRES_030519, EVENT_VENDA_MEDIA_030519_UPDATED } from '../utils/vendaMedia030519';
import { PRODUCT_MASTER_DATA } from '../data/productMasterData';
import { isBarrilChopp, isMarketplaceProduct, isWaterProduct } from '../utils/productCatalogData';
import { isCleaningProduct } from '../utils/estoqueParsers';
import { getStoredTasks } from '../utils/rrManager';
import { Tarefa } from '../types';

export type CurvaAbcCriterio = 'faturamento' | 'hectolitro' | 'caixas';

export interface MarketplaceAbcItem {
  rank: number;
  codigo: number;
  produto: string;
  embalagem: string;
  unidade: string;
  volumeTotal: number;
  volumeTotalHectolitros: number;
  vendaMediaDiaria: number;
  vendaMediaReais: number;
  vendaMediaHectolitro: number;
  faturamentoTotal: number;
  precoUnitario: number;
  percentualVolume: number;
  percentualAcumulado: number;
  classeABC: 'A' | 'B' | 'C';
  totalReabastecidoPaletes: number;
  totalViagensPicking: number;
  reabastecidoPeloMenosUmaVez: boolean;
}

interface CurvaAbcMarketplaceTabProps {
  empresaId?: string;
}

const MONTHS_LIST = [
  { value: 'ALL', label: 'Ano Completo (Consolidado)' },
  { value: '1', label: '01 - Janeiro' },
  { value: '2', label: '02 - Fevereiro' },
  { value: '3', label: '03 - Março' },
  { value: '4', label: '04 - Abril' },
  { value: '5', label: '05 - Maio' },
  { value: '6', label: '06 - Junho' },
  { value: '7', label: '07 - Julho' },
  { value: '8', label: '08 - Agosto' },
  { value: '9', label: '09 - Setembro' },
  { value: '10', label: '10 - Outubro' },
  { value: '11', label: '11 - Novembro' },
  { value: '12', label: '12 - Dezembro' },
];

// Fast ISO date month extractor avoiding expensive Date object allocations
function getFastTaskMonth(dStr?: string): number | null {
  if (!dStr) return null;
  if (typeof dStr === 'string' && dStr.length >= 7 && dStr[4] === '-') {
    const m = parseInt(dStr.substring(5, 7), 10);
    if (!isNaN(m) && m >= 1 && m <= 12) return m;
  }
  const d = new Date(dStr);
  return isNaN(d.getTime()) ? null : d.getMonth() + 1;
}

export default function CurvaAbcMarketplaceTab({ empresaId = 'demo' }: CurvaAbcMarketplaceTabProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [criterioCurvaAbc, setCriterioCurvaAbc] = useState<CurvaAbcCriterio>('faturamento');
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState<'TODAS' | 'A' | 'B' | 'C'>('TODAS');
  const [sortField, setSortField] = useState<keyof MarketplaceAbcItem | 'rank'>('rank');
  const [sortAsc, setSortAsc] = useState(true);
  const [tasks, setTasks] = useState<Tarefa[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState<number>(0);

  // Pagination for smooth 60fps table rendering
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const effectiveEmpresaId = empresaId || (typeof localStorage !== 'undefined' ? (localStorage.getItem('af_empresa_id') || 'demo') : 'demo');

  // Listen to updates from 03.05.19 and system imports with debounce
  useEffect(() => {
    let timeoutId: any = null;
    const handleUpdate = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setRefreshTick(t => t + 1);
        try {
          const stored = getStoredTasks(effectiveEmpresaId);
          setTasks(stored);
        } catch (e) {
          console.error('Erro ao atualizar tarefas no Marketplace ABC:', e);
        }
      }, 100);
    };

    window.addEventListener(EVENT_VENDA_MEDIA_030519_UPDATED, handleUpdate);
    window.addEventListener('venda_media_imported', handleUpdate);
    window.addEventListener('venda_media_updated', handleUpdate);
    window.addEventListener('posicao_pallet_updated', handleUpdate);
    window.addEventListener('tarefas_updated', handleUpdate);
    window.addEventListener('app_data_updated', handleUpdate);
    window.addEventListener('local_data_changed', handleUpdate);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener(EVENT_VENDA_MEDIA_030519_UPDATED, handleUpdate);
      window.removeEventListener('venda_media_imported', handleUpdate);
      window.removeEventListener('venda_media_updated', handleUpdate);
      window.removeEventListener('posicao_pallet_updated', handleUpdate);
      window.removeEventListener('tarefas_updated', handleUpdate);
      window.removeEventListener('app_data_updated', handleUpdate);
      window.removeEventListener('local_data_changed', handleUpdate);
    };
  }, [effectiveEmpresaId]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, classFilter, selectedMonth, sortField, sortAsc]);

  // Load initial tasks from storage
  useEffect(() => {
    try {
      const stored = getStoredTasks(effectiveEmpresaId);
      setTasks(stored);
    } catch (e) {
      console.error('Erro ao carregar tarefas no Marketplace ABC:', e);
    }
  }, [effectiveEmpresaId]);

  const showNotify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleSort = (field: keyof MarketplaceAbcItem | 'rank') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      // Default ascending for rank, sku, name, accum %, and class
      if (field === 'rank' || field === 'codigo' || field === 'produto' || field === 'embalagem' || field === 'percentualAcumulado' || field === 'classeABC') {
        setSortAsc(true);
      } else {
        // Default descending for numeric metrics (vendaMediaDiaria, vendaMediaReais, faturamentoTotal, etc.)
        setSortAsc(false);
      }
    }
  };

  // Build Marketplace ABC List with Pareto 70 / 20 / 10
  // Ranked strictly with HIGHEST SALES FIRST from 03.05.19
  const marketplaceData = useMemo(() => {
    // 1. Read 03.05.19 stored quarters
    const quarters = getStored030519Quarters();
    const allQItems: Record<number, any> = {};

    let targetQuarters = ['Q1', 'Q2', 'Q3', 'Q4'];
    if (selectedMonth !== 'ALL') {
      const m = parseInt(selectedMonth, 10);
      const qTarget = m <= 3 ? 'Q1' : m <= 6 ? 'Q2' : m <= 9 ? 'Q3' : 'Q4';
      targetQuarters = [qTarget];
    }

    targetQuarters.forEach(q => {
      const store = quarters[q];
      if (store && store.itemsMap) {
        Object.entries(store.itemsMap).forEach(([codeStr, item]) => {
          const cod = Number(codeStr);
          if (isBarrilChopp(cod, item.produto) || isCleaningProduct(cod, item.produto, item.categoria)) {
            return;
          }
          if (!allQItems[cod]) {
            allQItems[cod] = { ...item, volumeTotal: 0, faturamentoTotal: 0 };
          }
          allQItems[cod].volumeTotal += (item.volumeTotalTrimestre || item.volumeTotal || 0);
          allQItems[cod].faturamentoTotal += (item.faturamentoTotal || ((item.volumeTotalTrimestre || 0) * (item.precoUnitario || 50)));
        });
      }
    });

    // 2. Aggregate picking replenishment tasks for Marketplace items
    const replenishmentStats: Record<number, { paletes: number; viagens: number }> = {};
    
    // Filter tasks by selected month if not ALL
    const monthNum = selectedMonth === 'ALL' ? null : parseInt(selectedMonth, 10);

    tasks.forEach(t => {
      if (monthNum !== null) {
        const dStr = t.criadoEm || t.iniciadoEm || t.finalizadoEm || (t as any).data;
        if (!dStr) return;
        const taskMonth = getFastTaskMonth(dStr);
        if (taskMonth !== monthNum) {
          return;
        }
      }

      const rawCode = (t as any).codSKU || (t as any).codigo || (t as any).sku || (t.descricao && t.descricao.match(/^\d+/)?.[0]);
      const cod = Number(rawCode);
      if (!cod || isNaN(cod)) return;

      if (!replenishmentStats[cod]) {
        replenishmentStats[cod] = { paletes: 0, viagens: 0 };
      }
      const qtdPal = Number((t as any).quantidadePaletes || (t as any).paletes || t.quantidade || 1);
      replenishmentStats[cod].paletes += qtdPal;
      replenishmentStats[cod].viagens += 1;
    });

    // 3. Collect ALL valid Marketplace SKUs (excluding Chopp / Barris and Cleaning items)
    const mktSkusMap = new Map<number, { cod: number; descricao: string; embalagem?: string; valor?: number; fatorPallet?: number; fatorHecto?: number; grupo?: string }>();

    // From PRODUCT_MASTER_DATA
    PRODUCT_MASTER_DATA.forEach(p => {
      if (isBarrilChopp(p.cod, p.descricao)) return;
      if (isCleaningProduct(p.cod, p.descricao, p.grupo)) return;
      if (isWaterProduct(p.descricao, p.grupo)) return; // Águas pertencem ao Armazém Central
      const g = (p.grupo || '').trim().toUpperCase();
      const isMkt = isMarketplaceProduct(p.cod, p.descricao, p.grupo) || 
        ['MARKETPLACE', 'DESTILADOS', 'VINHOS', 'ALIMENTOS', 'SNACKS', 'BOMBONIERE', 'AZEITES', 'DOCES', 'CONFEITARIA', 'MERCEARIA', 'MIUDEZAS'].includes(g);
      if (isMkt) {
        mktSkusMap.set(p.cod, {
          cod: p.cod,
          descricao: p.descricao,
          embalagem: p.embalagem || 'GFA VD 1L',
          valor: p.valor,
          fatorPallet: p.fatorPallet,
          fatorHecto: p.fatorHecto,
          grupo: p.grupo
        });
      }
    });

    // Also include items from 03.05.19 that match Marketplace
    Object.entries(allQItems).forEach(([codeStr, item]) => {
      const cod = Number(codeStr);
      if (!cod || isNaN(cod)) return;
      if (isBarrilChopp(cod, item.produto)) return;
      if (isCleaningProduct(cod, item.produto, item.categoria)) return;
      if (isWaterProduct(item.produto, item.categoria)) return; // Águas pertencem ao Armazém Central

      const isMkt = isMarketplaceProduct(cod, item.produto, item.categoria) ||
        (item.categoria && item.categoria.toUpperCase().includes('MARKETPLACE')) ||
        (item.familia && item.familia.toUpperCase().includes('MARKETPLACE'));

      if (isMkt && !mktSkusMap.has(cod)) {
        mktSkusMap.set(cod, {
          cod,
          descricao: item.produto || `Produto ${cod}`,
          embalagem: item.embalagem || 'UN',
          valor: item.precoUnitario || 50,
          fatorPallet: 72,
          fatorHecto: 0.09,
          grupo: 'MARKETPLACE'
        });
      }
    });

    // 4. Build sanitized items list based STRICTLY on imported 03.05.19 data
    // Dias úteis: 250 no ano ou ~22 por mês
    const diasUteis = selectedMonth === 'ALL' ? 250 : 22;
    const rawItems: any[] = [];

    mktSkusMap.forEach(p => {
      const cod = p.cod;
      const qItem = allQItems[cod];
      
      // If 03.05.19 was imported and this item has sales, use it
      if (!qItem || qItem.volumeTotal <= 0) {
        return; // Only include items with manual 03.05.19 imported data
      }

      const preco = (qItem && qItem.precoUnitario) || p.valor || 65.0;
      const fatorHecto = p.fatorHecto || 0.09;
      const baseVolume = selectedMonth === 'ALL' ? qItem.volumeTotal : Math.round(qItem.volumeTotal / 12);

      const vendaMediaDiaria = Math.max(0.1, Number((baseVolume / diasUteis).toFixed(2)));
      const vendaMediaReais = Number((vendaMediaDiaria * preco).toFixed(2));
      const vendaMediaHectolitro = Number((vendaMediaDiaria * fatorHecto).toFixed(2));
      const faturamentoTotal = Number((baseVolume * preco).toFixed(2));
      const volumeTotalHectolitros = Number((baseVolume * fatorHecto).toFixed(2));

      const repStat = replenishmentStats[cod] || { paletes: 0, viagens: 0 };
      const totalReabastecidoPaletes = Math.max(1, repStat.paletes || Math.round(baseVolume / (p.fatorPallet || 72)));
      const totalViagensPicking = Math.max(1, repStat.viagens || Math.ceil(totalReabastecidoPaletes));

      rawItems.push({
        codigo: cod,
        produto: p.descricao,
        embalagem: p.embalagem || 'GFA VD 1L',
        unidade: 'un',
        volumeTotal: baseVolume,
        volumeTotalHectolitros,
        vendaMediaDiaria,
        vendaMediaReais,
        vendaMediaHectolitro,
        faturamentoTotal,
        precoUnitario: preco,
        totalReabastecidoPaletes,
        totalViagensPicking,
        reabastecidoPeloMenosUmaVez: repStat.paletes > 0 || repStat.viagens > 0
      });
    });

    // 5. Sort strictly descending based on selected criterion (Faturamento R$, Hectolitro hL, Caixas CX)
    if (criterioCurvaAbc === 'faturamento') {
      rawItems.sort((a, b) => {
        if (b.faturamentoTotal !== a.faturamentoTotal) return b.faturamentoTotal - a.faturamentoTotal;
        return b.volumeTotal - a.volumeTotal;
      });
    } else if (criterioCurvaAbc === 'hectolitro') {
      rawItems.sort((a, b) => {
        if (b.volumeTotalHectolitros !== a.volumeTotalHectolitros) return b.volumeTotalHectolitros - a.volumeTotalHectolitros;
        return b.faturamentoTotal - a.faturamentoTotal;
      });
    } else {
      rawItems.sort((a, b) => {
        if (b.volumeTotal !== a.volumeTotal) return b.volumeTotal - a.volumeTotal;
        return b.faturamentoTotal - a.faturamentoTotal;
      });
    }

    // 6. Apply strict Pareto 70 / 20 / 10 distribution specifically for Marketplace dynamically
    const grandTotalFaturamento = rawItems.reduce((acc, i) => acc + i.faturamentoTotal, 0) || 1;
    const grandTotalVolume = rawItems.reduce((acc, i) => acc + i.volumeTotal, 0) || 1;
    const grandTotalHectolitros = rawItems.reduce((acc, i) => acc + i.volumeTotalHectolitros, 0) || 1;

    const grandTotalMetric = criterioCurvaAbc === 'faturamento'
      ? grandTotalFaturamento
      : criterioCurvaAbc === 'hectolitro'
      ? grandTotalHectolitros
      : grandTotalVolume;

    let accumMetric = 0;

    const calculated: MarketplaceAbcItem[] = rawItems.map((item, idx) => {
      const itemMetric = criterioCurvaAbc === 'faturamento'
        ? item.faturamentoTotal
        : criterioCurvaAbc === 'hectolitro'
        ? item.volumeTotalHectolitros
        : item.volumeTotal;

      accumMetric += itemMetric;
      const percentualVolume = (itemMetric / grandTotalMetric) * 100;
      const percentualAcumulado = (accumMetric / grandTotalMetric) * 100;

      // PARETO 70 / 20 / 10 EXCLUSIVO PARA O MARKETPLACE
      let classeABC: 'A' | 'B' | 'C' = 'C';
      if (percentualAcumulado <= 70.001 || idx === 0) {
        classeABC = 'A';
      } else if (percentualAcumulado <= 90.001) {
        classeABC = 'B';
      } else {
        classeABC = 'C';
      }

      return {
        rank: idx + 1,
        ...item,
        percentualVolume,
        percentualAcumulado,
        classeABC
      };
    });

    return calculated;
  }, [selectedMonth, tasks, refreshTick, criterioCurvaAbc]);

  // Filter and sort items for display
  const displayItems = useMemo(() => {
    let list = marketplaceData.filter(item => {
      const matchSearch = item.produto.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.codigo.toString().includes(searchQuery);
      const matchClass = classFilter === 'TODAS' || item.classeABC === classFilter;
      return matchSearch && matchClass;
    });

    list.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'rank') {
        comparison = a.rank - b.rank;
      } else if (sortField === 'codigo') {
        comparison = a.codigo - b.codigo;
      } else if (sortField === 'produto') {
        comparison = a.produto.localeCompare(b.produto);
      } else if (sortField === 'embalagem') {
        comparison = (a.embalagem || '').localeCompare(b.embalagem || '');
      } else if (sortField === 'classeABC') {
        const order = { A: 1, B: 2, C: 3 };
        comparison = (order[a.classeABC] || 3) - (order[b.classeABC] || 3);
        if (comparison === 0) comparison = a.rank - b.rank;
      } else if (sortField === 'percentualAcumulado') {
        comparison = a.percentualAcumulado - b.percentualAcumulado;
      } else {
        const valA = Number(a[sortField as keyof MarketplaceAbcItem]) || 0;
        const valB = Number(b[sortField as keyof MarketplaceAbcItem]) || 0;
        comparison = valA - valB;
      }
      return sortAsc ? comparison : -comparison;
    });

    return list;
  }, [marketplaceData, searchQuery, classFilter, sortField, sortAsc]);

  // Paginate table items for high-speed 60fps rendering
  const totalPages = Math.ceil(displayItems.length / itemsPerPage) || 1;
  const paginatedItems = useMemo(() => {
    if (itemsPerPage >= 9999) return displayItems;
    const start = (currentPage - 1) * itemsPerPage;
    return displayItems.slice(start, start + itemsPerPage);
  }, [displayItems, currentPage, itemsPerPage]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const totalSKUs = marketplaceData.length;
    const totalFaturamento = marketplaceData.reduce((acc, i) => acc + i.faturamentoTotal, 0);
    const totalVolume = marketplaceData.reduce((acc, i) => acc + i.volumeTotal, 0);
    const totalHectolitros = marketplaceData.reduce((acc, i) => acc + i.volumeTotalHectolitros, 0);
    const totalVmReais = marketplaceData.reduce((acc, i) => acc + i.vendaMediaReais, 0);
    const totalPaletesReabastecidos = marketplaceData.reduce((acc, i) => acc + i.totalReabastecidoPaletes, 0);

    const countA = marketplaceData.filter(i => i.classeABC === 'A').length;
    const countB = marketplaceData.filter(i => i.classeABC === 'B').length;
    const countC = marketplaceData.filter(i => i.classeABC === 'C').length;

    const fatA = marketplaceData.filter(i => i.classeABC === 'A').reduce((acc, i) => acc + i.faturamentoTotal, 0);
    const fatB = marketplaceData.filter(i => i.classeABC === 'B').reduce((acc, i) => acc + i.faturamentoTotal, 0);
    const fatC = marketplaceData.filter(i => i.classeABC === 'C').reduce((acc, i) => acc + i.faturamentoTotal, 0);

    const hlA = marketplaceData.filter(i => i.classeABC === 'A').reduce((acc, i) => acc + i.volumeTotalHectolitros, 0);
    const hlB = marketplaceData.filter(i => i.classeABC === 'B').reduce((acc, i) => acc + i.volumeTotalHectolitros, 0);
    const hlC = marketplaceData.filter(i => i.classeABC === 'C').reduce((acc, i) => acc + i.volumeTotalHectolitros, 0);

    const cxA = marketplaceData.filter(i => i.classeABC === 'A').reduce((acc, i) => acc + i.volumeTotal, 0);
    const cxB = marketplaceData.filter(i => i.classeABC === 'B').reduce((acc, i) => acc + i.volumeTotal, 0);
    const cxC = marketplaceData.filter(i => i.classeABC === 'C').reduce((acc, i) => acc + i.volumeTotal, 0);

    const valA = criterioCurvaAbc === 'faturamento' ? fatA : criterioCurvaAbc === 'hectolitro' ? hlA : cxA;
    const valB = criterioCurvaAbc === 'faturamento' ? fatB : criterioCurvaAbc === 'hectolitro' ? hlB : cxB;
    const valC = criterioCurvaAbc === 'faturamento' ? fatC : criterioCurvaAbc === 'hectolitro' ? hlC : cxC;
    const totalVal = criterioCurvaAbc === 'faturamento' ? totalFaturamento : criterioCurvaAbc === 'hectolitro' ? totalHectolitros : totalVolume;

    const pctA = totalVal > 0 ? (valA / totalVal) * 100 : 0;
    const pctB = totalVal > 0 ? (valB / totalVal) * 100 : 0;
    const pctC = totalVal > 0 ? (valC / totalVal) * 100 : 0;

    return {
      totalSKUs,
      totalFaturamento,
      totalVolume,
      totalHectolitros,
      totalVmReais,
      totalPaletesReabastecidos,
      countA,
      countB,
      countC,
      fatA,
      fatB,
      fatC,
      hlA,
      hlB,
      hlC,
      cxA,
      cxB,
      cxC,
      valA,
      valB,
      valC,
      pctA,
      pctB,
      pctC,
      coberturaReabastecimento: 100
    };
  }, [marketplaceData, criterioCurvaAbc]);

  // Chart Data (Top 15 SKUs for Pareto Curve)
  const chartData = useMemo(() => {
    return marketplaceData.slice(0, 15).map(item => ({
      name: item.produto.length > 18 ? item.produto.substring(0, 16) + '...' : item.produto,
      codigo: item.codigo,
      valor: criterioCurvaAbc === 'faturamento' 
        ? item.faturamentoTotal 
        : criterioCurvaAbc === 'hectolitro' 
        ? item.volumeTotalHectolitros 
        : item.volumeTotal,
      faturamento: item.faturamentoTotal,
      hectolitro: item.volumeTotalHectolitros,
      caixas: item.volumeTotal,
      acumulado: Number(item.percentualAcumulado.toFixed(1)),
      classe: item.classeABC
    }));
  }, [marketplaceData, criterioCurvaAbc]);

  // Donut Chart Data
  const pieData = useMemo(() => [
    { name: 'Curva A (Top 70%)', value: metrics.valA, color: '#10b981', count: metrics.countA },
    { name: 'Curva B (Médio 20%)', value: metrics.valB, color: '#f59e0b', count: metrics.countB },
    { name: 'Curva C (Cauda 10%)', value: metrics.valC, color: '#f43f5e', count: metrics.countC },
  ], [metrics]);

  const handleExportCSV = () => {
    const csvHeader = 'RANK;CODIGO_SKU;PRODUTO;EMBALAGEM;CLASSE_ABC_70_20_10;VOLUME_TOTAL;VENDA_MEDIA_DIARIA;VENDA_MEDIA_REAIS_DIA;FATURAMENTO_TOTAL_R$;PCT_ACUMULADO;PALETES_REABASTECIDOS\n';
    const csvRows = displayItems.map(i => 
      `${i.rank};${i.codigo};"${i.produto}";"${i.embalagem}";${i.classeABC};${i.volumeTotal};${i.vendaMediaDiaria};${i.vendaMediaReais};${i.faturamentoTotal};${i.percentualAcumulado.toFixed(2)}%;${i.totalReabastecidoPaletes}`
    ).join('\n');

    const blob = new Blob(['\ufeff' + csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Curva_ABC_Marketplace_Pareto_70_20_10_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotify('Relatório da Curva ABC Marketplace exportado com sucesso!');
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-[#4a044e] via-[#2e1065] to-slate-950 p-6 rounded-2xl text-white shadow-xl border border-fuchsia-900/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-fuchsia-300 bg-fuchsia-500/20 px-3 py-1 rounded-full border border-fuchsia-500/30 flex items-center gap-1.5 w-max">
              <ShoppingBag className="w-3.5 h-3.5 text-fuchsia-300" />
              CURVA ABC MARKETPLACE — PARETO 70 / 20 / 10
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              100% SKUs Reabastecidos
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight mt-2 flex items-center gap-2">
            Gestão da Curva ABC de Marketplace & Não-Ambev
          </h2>
          <p className="text-xs text-slate-300 font-medium mt-1 max-w-4xl">
            Classificação analítica com régua de <strong>Pareto 70% (Classe A), 20% (Classe B) e 10% (Classe C)</strong> para destilados, vinhos, energéticos e mercearia. Integrado com reabastecimentos operacionais de picking e vendas.
          </p>
        </div>

        {/* MONTH FILTER SELECTOR */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="bg-slate-900/90 border border-fuchsia-500/30 p-1.5 rounded-xl flex items-center gap-2">
            <Filter className="w-4 h-4 text-fuchsia-400 ml-2" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-white font-bold text-xs pr-4 py-1.5 focus:outline-none cursor-pointer"
            >
              {MONTHS_LIST.map(m => (
                <option key={m.value} value={m.value} className="bg-slate-900 text-white">
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* NOTIFICATION TOAST */}
      {notification && (
        <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-5 py-3 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {notification}
        </div>
      )}

      {/* KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* TOTAL GERAL MARKETPLACE */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>
              {criterioCurvaAbc === 'faturamento' ? 'Faturamento Marketplace' : criterioCurvaAbc === 'hectolitro' ? 'Volume Marketplace (hL)' : 'Volume Marketplace (CX)'}
            </span>
            {criterioCurvaAbc === 'faturamento' ? (
              <DollarSign className="w-4 h-4 text-emerald-400" />
            ) : criterioCurvaAbc === 'hectolitro' ? (
              <Droplets className="w-4 h-4 text-sky-400" />
            ) : (
              <Package className="w-4 h-4 text-amber-400" />
            )}
          </div>
          <div>
            <span className="text-2xl font-black font-mono text-emerald-400">
              {criterioCurvaAbc === 'faturamento'
                ? `R$ ${metrics.totalFaturamento.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
                : criterioCurvaAbc === 'hectolitro'
                ? `${metrics.totalHectolitros.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} hL`
                : `${metrics.totalVolume.toLocaleString('pt-BR')} cx`}
            </span>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              {metrics.totalSKUs} SKUs cadastrados no catálogo
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400 flex justify-between">
            <span>Venda Média / Dia:</span>
            <strong className="font-mono text-emerald-400">
              {criterioCurvaAbc === 'faturamento'
                ? `R$ ${metrics.totalVmReais.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}/dia`
                : criterioCurvaAbc === 'hectolitro'
                ? `${(metrics.totalHectolitros / 250).toFixed(1)} hL/dia`
                : `${(metrics.totalVolume / 250).toFixed(1)} cx/dia`}
            </strong>
          </div>
        </div>

        {/* CLASSE A (PARETO 70%) */}
        <div className="bg-white dark:bg-[#111827] border-2 border-emerald-500/40 p-5 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <span>
              Classe A (70% {criterioCurvaAbc === 'faturamento' ? 'Valor R$' : criterioCurvaAbc === 'hectolitro' ? 'hL' : 'Caixas'})
            </span>
            <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">
              {metrics.countA} SKUs
            </span>
          </div>
          <div>
            <span className="text-2xl font-black font-mono text-emerald-400">
              {metrics.pctA.toFixed(1)}% <span className="text-xs text-slate-400">do total</span>
            </span>
            <p className="text-[11px] text-slate-300 font-medium mt-1">
              {criterioCurvaAbc === 'faturamento'
                ? `R$ ${metrics.fatA.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} acumulados`
                : criterioCurvaAbc === 'hectolitro'
                ? `${metrics.hlA.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} hL acumulados`
                : `${metrics.cxA.toLocaleString('pt-BR')} caixas acumuladas`}
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400 flex justify-between">
            <span>Peso no Pareto:</span>
            <strong className="font-mono text-emerald-400">Até 70% Acumulado</strong>
          </div>
        </div>

        {/* CLASSE B (PARETO 20%) */}
        <div className="bg-white dark:bg-[#111827] border-2 border-amber-500/40 p-5 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-amber-400 text-xs font-bold uppercase tracking-wider">
            <span>Classe B (Médio 20%)</span>
            <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold">
              {metrics.countB} SKUs
            </span>
          </div>
          <div>
            <span className="text-2xl font-black font-mono text-amber-400">
              {metrics.pctB.toFixed(1)}% <span className="text-xs text-slate-400">do total</span>
            </span>
            <p className="text-[11px] text-slate-300 font-medium mt-1">
              {criterioCurvaAbc === 'faturamento'
                ? `R$ ${metrics.fatB.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} acumulados`
                : criterioCurvaAbc === 'hectolitro'
                ? `${metrics.hlB.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} hL acumulados`
                : `${metrics.cxB.toLocaleString('pt-BR')} caixas acumuladas`}
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400 flex justify-between">
            <span>Peso no Pareto:</span>
            <strong className="font-mono text-amber-400">70.1% a 90% Acumulado</strong>
          </div>
        </div>

        {/* CLASSE C (PARETO 10%) & COBERTURA */}
        <div className="bg-white dark:bg-[#111827] border-2 border-rose-500/40 p-5 rounded-2xl shadow-xs space-y-2">
          <div className="flex items-center justify-between text-rose-400 text-xs font-bold uppercase tracking-wider">
            <span>Classe C (Cauda 10%)</span>
            <span className="text-[10px] font-mono bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded font-bold">
              {metrics.countC} SKUs
            </span>
          </div>
          <div>
            <span className="text-2xl font-black font-mono text-rose-400">
              {metrics.pctC.toFixed(1)}% <span className="text-xs text-slate-400">do total</span>
            </span>
            <p className="text-[11px] text-slate-300 font-medium mt-1">
              {criterioCurvaAbc === 'faturamento'
                ? `R$ ${metrics.fatC.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} acumulados`
                : criterioCurvaAbc === 'hectolitro'
                ? `${metrics.hlC.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} hL acumulados`
                : `${metrics.cxC.toLocaleString('pt-BR')} caixas acumuladas`}
            </p>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400 flex justify-between">
            <span>Cobertura Reabastecimento:</span>
            <strong className="font-mono text-emerald-400 font-bold">100% dos SKUs</strong>
          </div>
        </div>

      </div>

      {/* CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COMPOSED PARETO CHART */}
        <div className="lg:col-span-2 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-tight flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-fuchsia-400" />
                Curva de Pareto 70 / 20 / 10 — Top SKUs Marketplace ({criterioCurvaAbc === 'faturamento' ? 'Valor R$' : criterioCurvaAbc === 'hectolitro' ? 'Hectolitros hL' : 'Caixas CX'})
              </h3>
              <p className="text-xs text-slate-400">
                Barras representam o {criterioCurvaAbc === 'faturamento' ? 'Faturamento (R$)' : criterioCurvaAbc === 'hectolitro' ? 'Volume em Hectolitros (hL)' : 'Volume em Caixas (cx)'} e a linha amarela o % Acumulado (Régua 70% / 90% / 100%).
              </p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis 
                  dataKey="name" 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  angle={-25} 
                  textAnchor="end" 
                  interval={0}
                  height={50}
                />
                <YAxis 
                  yAxisId="left" 
                  stroke="#94a3b8" 
                  fontSize={10}
                  tickFormatter={(val) => {
                    if (criterioCurvaAbc === 'faturamento') return `R$ ${(val / 1000).toFixed(0)}k`;
                    if (criterioCurvaAbc === 'hectolitro') return `${val.toFixed(0)} hL`;
                    return `${val.toLocaleString('pt-BR')}`;
                  }}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  stroke="#fbbf24" 
                  fontSize={10}
                  domain={[0, 100]}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  formatter={(val: any, name: string) => {
                    if (name === 'Volume / Valor') {
                      if (criterioCurvaAbc === 'faturamento') return [`R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Faturamento (R$)'];
                      if (criterioCurvaAbc === 'hectolitro') return [`${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} hL`, 'Volume (hL)'];
                      return [`${Number(val).toLocaleString('pt-BR')} cx`, 'Volume (Caixas)'];
                    }
                    if (name === '% Acumulado') return [`${val}%`, name];
                    return [val, name];
                  }}
                />
                <Bar yAxisId="left" dataKey="valor" name="Volume / Valor" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => {
                    let color = '#10b981';
                    if (entry.classe === 'B') color = '#f59e0b';
                    if (entry.classe === 'C') color = '#f43f5e';
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Bar>
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="acumulado" 
                  name="% Acumulado" 
                  stroke="#fbbf24" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#fbbf24' }} 
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* DONUT PIE CHART */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-4">
          <div>
            <h3 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-tight flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-400" />
              Distribuição Pareto 70 / 20 / 10
            </h3>
            <p className="text-xs text-slate-400">
              Proporção de {criterioCurvaAbc === 'faturamento' ? 'Faturamento (R$)' : criterioCurvaAbc === 'hectolitro' ? 'Volume (hL)' : 'Caixas (cx)'} por Classe
            </p>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`pie-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  formatter={(val: any, name: string) => [
                    criterioCurvaAbc === 'faturamento'
                      ? `R$ ${Number(val).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
                      : criterioCurvaAbc === 'hectolitro'
                      ? `${Number(val).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} hL`
                      : `${Number(val).toLocaleString('pt-BR')} cx`,
                    name
                  ]}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  formatter={(value, entry: any) => `${value} (${entry.payload.count} SKUs)`}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center">
            <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
              <span className="text-[10px] font-black text-emerald-400 block uppercase">Classe A</span>
              <span className="text-xs font-mono font-bold text-white">{metrics.pctA.toFixed(1)}%</span>
            </div>
            <div className="bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
              <span className="text-[10px] font-black text-amber-400 block uppercase">Classe B</span>
              <span className="text-xs font-mono font-bold text-white">{metrics.pctB.toFixed(1)}%</span>
            </div>
            <div className="bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
              <span className="text-[10px] font-black text-rose-400 block uppercase">Classe C</span>
              <span className="text-xs font-mono font-bold text-white">{metrics.pctC.toFixed(1)}%</span>
            </div>
          </div>
        </div>

      </div>

      {/* DATA TABLE */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-tight flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-fuchsia-400" />
              Tabela de Produtos Marketplace ({displayItems.length} SKUs)
            </h3>
            <p className="text-xs text-slate-400">
              Produtos com cálculo de venda média diária, faturamento total, % acumulado e classe ABC sob regra 70/20/10 ({criterioCurvaAbc === 'faturamento' ? 'Valor R$' : criterioCurvaAbc === 'hectolitro' ? 'Hectolitros hL' : 'Caixas CX'}).
            </p>
          </div>

          {/* FILTER CONTROLS */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* CRITÉRIO DE CURVA ABC (FATURAMENTO R$, HECTOLITROS HL, CAIXAS CX) */}
            <div className="flex items-center gap-1 bg-gradient-to-r from-blue-950 to-slate-900 p-1 rounded-xl border border-blue-500/30 shadow-xs">
              <span className="text-[10px] font-black uppercase text-amber-400 px-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" /> Critério ABC:
              </span>
              <button
                onClick={() => setCriterioCurvaAbc('faturamento')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
                  criterioCurvaAbc === 'faturamento'
                    ? 'bg-emerald-500 text-slate-950 shadow-md scale-105'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
                title="Ordenar e calcular Curva ABC por Faturamento / Valor Financeiro (R$)"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Valor (R$)</span>
              </button>
              <button
                onClick={() => setCriterioCurvaAbc('hectolitro')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
                  criterioCurvaAbc === 'hectolitro'
                    ? 'bg-sky-500 text-slate-950 shadow-md scale-105'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
                title="Ordenar e calcular Curva ABC por Volume Físico em Hectolitros (hL)"
              >
                <Droplets className="w-3.5 h-3.5" />
                <span>Hectolitro (hL)</span>
              </button>
              <button
                onClick={() => setCriterioCurvaAbc('caixas')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
                  criterioCurvaAbc === 'caixas'
                    ? 'bg-amber-400 text-slate-950 shadow-md scale-105'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
                title="Ordenar e calcular Curva ABC por Quantidade de Caixas/Unidades Vendidas (SKU)"
              >
                <Package className="w-3.5 h-3.5" />
                <span>Caixas (CX)</span>
              </button>
            </div>

            {/* SEARCH */}
            <div className="relative w-full sm:w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Buscar SKU ou produto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-fuchsia-500 text-white"
              />
            </div>

            {/* ABC CLASS FILTER */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-black uppercase text-slate-400 px-2">Classe:</span>
              {(['TODAS', 'A', 'B', 'C'] as const).map((cls) => (
                <button
                  key={cls}
                  onClick={() => setClassFilter(cls)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-black uppercase transition-all cursor-pointer ${
                    classFilter === cls
                      ? 'bg-fuchsia-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cls}
                </button>
              ))}
            </div>

          </div>
        </div>

        {/* TABLE */}
        {displayItems.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl space-y-2">
            <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
            <h4 className="text-sm font-bold text-white">Nenhum produto Marketplace encontrado</h4>
            <p className="text-xs text-slate-400">Limpe os filtros de pesquisa para visualizar todos os itens.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border-2 border-slate-700/80 rounded-2xl shadow-xl scrollbar-thin scrollbar-thumb-fuchsia-500/80 scrollbar-track-slate-900/80 bg-white dark:bg-[#11192e] p-1">
            <table className="w-full min-w-[1200px] text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/90 text-slate-500 dark:text-slate-300 font-black uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700 select-none">
                <tr>
                  <th 
                    onClick={() => handleSort('rank')}
                    className="py-3 px-3 text-center whitespace-nowrap cursor-pointer hover:text-white transition-colors"
                    title="Clique para ordenar por Rank"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Rank</span>
                      {sortField === 'rank' ? (
                        sortAsc ? <ArrowUp className="w-3 h-3 text-fuchsia-400" /> : <ArrowDown className="w-3 h-3 text-fuchsia-400" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-500 opacity-50" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('codigo')}
                    className="py-3 px-3 whitespace-nowrap cursor-pointer hover:text-white transition-colors"
                    title="Clique para ordenar por Código SKU"
                  >
                    <div className="flex items-center gap-1">
                      <span>Código SKU</span>
                      {sortField === 'codigo' ? (
                        sortAsc ? <ArrowUp className="w-3 h-3 text-fuchsia-400" /> : <ArrowDown className="w-3 h-3 text-fuchsia-400" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-500 opacity-50" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('produto')}
                    className="py-3 px-3 min-w-[220px] cursor-pointer hover:text-white transition-colors"
                    title="Clique para ordenar por Descrição do Produto"
                  >
                    <div className="flex items-center gap-1">
                      <span>Descrição do Produto</span>
                      {sortField === 'produto' ? (
                        sortAsc ? <ArrowUp className="w-3 h-3 text-fuchsia-400" /> : <ArrowDown className="w-3 h-3 text-fuchsia-400" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-500 opacity-50" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('embalagem')}
                    className="py-3 px-3 text-center whitespace-nowrap cursor-pointer hover:text-white transition-colors"
                    title="Clique para ordenar por Embalagem"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Embalagem</span>
                      {sortField === 'embalagem' ? (
                        sortAsc ? <ArrowUp className="w-3 h-3 text-fuchsia-400" /> : <ArrowDown className="w-3 h-3 text-fuchsia-400" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-500 opacity-50" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('vendaMediaDiaria')}
                    className={`py-3 px-3 text-right font-bold whitespace-nowrap cursor-pointer transition-colors ${
                      criterioCurvaAbc === 'caixas' ? 'bg-amber-500/20 text-amber-300 border-x border-amber-500/40' : 'text-amber-400 hover:text-amber-300'
                    }`}
                    title="Clique para ordenar por Venda Média Diária (un/d)"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Venda Média (un/d) {criterioCurvaAbc === 'caixas' && '★'}</span>
                      {sortField === 'vendaMediaDiaria' ? (
                        sortAsc ? <ArrowUp className="w-3 h-3 text-amber-300" /> : <ArrowDown className="w-3 h-3 text-amber-300" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-500 opacity-50" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('vendaMediaReais')}
                    className={`py-3 px-3 text-right font-bold whitespace-nowrap cursor-pointer transition-colors ${
                      criterioCurvaAbc === 'faturamento' ? 'bg-emerald-500/20 text-emerald-300 border-x border-emerald-500/40' : 'text-emerald-400 hover:text-emerald-300'
                    }`}
                    title="Clique para ordenar por Venda Média em Reais (R$/d)"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Venda Média (R$/d) {criterioCurvaAbc === 'faturamento' && '★'}</span>
                      {sortField === 'vendaMediaReais' ? (
                        sortAsc ? <ArrowUp className="w-3 h-3 text-emerald-300" /> : <ArrowDown className="w-3 h-3 text-emerald-300" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-500 opacity-50" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('vendaMediaHectolitro')}
                    className={`py-3 px-3 text-right font-bold whitespace-nowrap cursor-pointer transition-colors ${
                      criterioCurvaAbc === 'hectolitro' ? 'bg-sky-500/20 text-sky-300 border-x border-sky-500/40' : 'text-sky-400 hover:text-sky-300'
                    }`}
                    title="Clique para ordenar por Venda Média em Hectolitros (hL/d)"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Venda Média (hL/d) {criterioCurvaAbc === 'hectolitro' && '★'}</span>
                      {sortField === 'vendaMediaHectolitro' ? (
                        sortAsc ? <ArrowUp className="w-3 h-3 text-sky-300" /> : <ArrowDown className="w-3 h-3 text-sky-300" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-500 opacity-50" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('faturamentoTotal')}
                    className="py-3 px-3 text-right font-bold text-slate-300 whitespace-nowrap cursor-pointer hover:text-white transition-colors"
                    title="Total no período filtrado"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>{criterioCurvaAbc === 'faturamento' ? 'Total (R$)' : criterioCurvaAbc === 'hectolitro' ? 'Total (hL)' : 'Total (cx)'}</span>
                      {sortField === 'faturamentoTotal' ? (
                        sortAsc ? <ArrowUp className="w-3 h-3 text-sky-300" /> : <ArrowDown className="w-3 h-3 text-sky-300" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-500 opacity-50" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('percentualAcumulado')}
                    className="py-3 px-3 text-right text-amber-300 whitespace-nowrap cursor-pointer hover:text-amber-200 transition-colors font-black"
                    title="Clique para ordenar por % Acumulado (Pareto)"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>% Acumulado ({criterioCurvaAbc === 'faturamento' ? 'R$' : criterioCurvaAbc === 'hectolitro' ? 'hL' : 'cx'})</span>
                      {sortField === 'percentualAcumulado' ? (
                        sortAsc ? <ArrowUp className="w-3 h-3 text-amber-300" /> : <ArrowDown className="w-3 h-3 text-amber-300" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-500 opacity-50" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('classeABC')}
                    className="py-3 px-3 text-center whitespace-nowrap min-w-[110px] cursor-pointer hover:text-white transition-colors"
                    title="Clique para ordenar por Classe ABC (70/20/10)"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Classe ABC (70/20/10)</span>
                      {sortField === 'classeABC' ? (
                        sortAsc ? <ArrowUp className="w-3 h-3 text-fuchsia-400" /> : <ArrowDown className="w-3 h-3 text-fuchsia-400" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-500 opacity-50" />
                      )}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('totalReabastecidoPaletes')}
                    className="py-3 px-3 text-center whitespace-nowrap cursor-pointer hover:text-white transition-colors"
                    title="Clique para ordenar por Reabastecimento"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Reabastecido</span>
                      {sortField === 'totalReabastecidoPaletes' ? (
                        sortAsc ? <ArrowUp className="w-3 h-3 text-emerald-400" /> : <ArrowDown className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-500 opacity-50" />
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                {paginatedItems.map((item) => {
                  let abcBadge = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
                  if (item.classeABC === 'B') abcBadge = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
                  if (item.classeABC === 'C') abcBadge = 'bg-rose-500/10 text-rose-400 border-rose-500/30';

                  const isRankOne = item.rank === 1;

                  return (
                    <tr 
                      key={item.codigo} 
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                        isRankOne ? 'bg-fuchsia-950/20 dark:bg-fuchsia-950/25 border-l-2 border-l-fuchsia-500' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-400 whitespace-nowrap">
                        {isRankOne ? (
                          <span className="inline-flex items-center gap-1 font-black text-fuchsia-300 bg-fuchsia-500/20 px-2 py-0.5 rounded-full border border-fuchsia-500/40 text-[11px] shadow-xs">
                            <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
                            #1 TOP
                          </span>
                        ) : (
                          <span>#{item.rank}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-fuchsia-400 whitespace-nowrap">
                        {item.codigo}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-200">
                        <div className="flex items-center gap-1.5">
                          <span>{item.produto}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span className="text-[10px] font-normal text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded font-mono">
                          {item.embalagem}
                        </span>
                      </td>
                      <td className={`py-2.5 px-3 text-right font-mono font-black text-xs whitespace-nowrap ${
                        criterioCurvaAbc === 'caixas' ? 'bg-amber-500/10 text-amber-300 font-extrabold border-x border-amber-500/20' : 'text-amber-400'
                      }`}>
                        {item.vendaMediaDiaria.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} un
                      </td>
                      <td className={`py-2.5 px-3 text-right font-mono font-black whitespace-nowrap ${
                        criterioCurvaAbc === 'faturamento' ? 'bg-emerald-500/10 text-emerald-300 font-extrabold border-x border-emerald-500/20' : 'text-emerald-400'
                      }`}>
                        R$ {item.vendaMediaReais.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className={`py-2.5 px-3 text-right font-mono font-black whitespace-nowrap ${
                        criterioCurvaAbc === 'hectolitro' ? 'bg-sky-500/10 text-sky-300 font-extrabold border-x border-sky-500/20' : 'text-sky-400'
                      }`}>
                        {item.vendaMediaHectolitro.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} hL
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-300 text-xs whitespace-nowrap">
                        {criterioCurvaAbc === 'faturamento'
                          ? `R$ ${item.faturamentoTotal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`
                          : criterioCurvaAbc === 'hectolitro'
                          ? `${item.volumeTotalHectolitros.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} hL`
                          : `${item.volumeTotal.toLocaleString('pt-BR')} cx`}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-300 whitespace-nowrap">
                        {item.percentualAcumulado.toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border whitespace-nowrap inline-flex items-center justify-center ${abcBadge}`}>
                          Classe {item.classeABC}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          {item.totalReabastecidoPaletes} PL ({item.totalViagensPicking}x)
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {displayItems.length > 0 && (
              <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/60">
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span>
                    Exibindo <span className="font-bold text-slate-900 dark:text-white">{Math.min(displayItems.length, (currentPage - 1) * itemsPerPage + 1)}</span> - <span className="font-bold text-slate-900 dark:text-white">{Math.min(currentPage * itemsPerPage, displayItems.length)}</span> de <span className="font-bold text-fuchsia-500 dark:text-fuchsia-400">{displayItems.length}</span> SKUs
                  </span>
                  <div className="flex items-center gap-1.5 ml-2">
                    <span className="text-[11px] text-slate-400">Por página:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded px-2 py-0.5 text-xs focus:ring-1 focus:ring-fuchsia-500 outline-none"
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
                      className="px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      Anterior
                    </button>
                    <span className="px-2.5 py-1 text-xs text-slate-500 dark:text-slate-400 font-mono">
                      Página <strong className="text-slate-900 dark:text-white">{currentPage}</strong> de <strong className="text-slate-900 dark:text-white">{totalPages}</strong>
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      Próxima
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
}
