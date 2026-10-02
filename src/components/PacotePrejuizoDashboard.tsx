import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  PieChart, 
  Pie, 
  LineChart, 
  Line,
  Legend
} from 'recharts';
import { 
  ArrowLeft, 
  AlertTriangle, 
  Layers, 
  DollarSign, 
  Droplet, 
  Package, 
  RefreshCw, 
  Download, 
  Search, 
  Filter, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  ShieldAlert, 
  ChevronRight, 
  TrendingDown, 
  ArrowUpRight, 
  Clock, 
  Tag, 
  RotateCcw,
  UploadCloud,
  FileSpreadsheet,
  Boxes,
  Truck,
  Flame,
  FileCheck,
  Building2,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { Usuario, Empresa } from '../types';
import { 
  PacotePrejuizoIndicador, 
  PacotePrejuizoUnifiedItem,
  getUnifiedPacotePrejuizo,
  getPlatformQuebrasForPrejuizo,
  getPlatformDespejoForPrejuizo,
  getStoredTrocasReposicoes,
  saveTrocasReposicoes,
  parseTrocasReposicoesJson,
  getStoredInventarioPerdas,
  saveInventarioPerdas,
  parseInventarioPerdasJson,
  getStoredRefugoPrejuizo,
  saveRefugoPrejuizo,
  parseRefugoPrejuizoJson,
  getStoredValesPrejuizo,
  saveValesPrejuizo,
  parseValesPrejuizoJson,
  getTrocasReposicoesSampleJson,
  getInventarioPerdasSampleJson,
  getRefugoSampleJson,
  getValesSampleJson
} from '../utils/pacotePrejuizoManager';
import { JsonImportZone } from './pacote-prejuizo/JsonImportZone';
import { TrocasReposicoesView } from './pacote-prejuizo/TrocasReposicoesView';
import { RefugoPrejuizoView } from './pacote-prejuizo/RefugoPrejuizoView';
import { ValesPrejuizoView } from './pacote-prejuizo/ValesPrejuizoView';
import { InventarioPrejuizoView } from './pacote-prejuizo/InventarioPrejuizoView';
import { FaturamentoCustoHlView } from './pacote-prejuizo/FaturamentoCustoHlView';
import { TROCAS_PLATAFORMA_EXTERNA_URL } from '../data/trocasReposicoesOfficialDataset';
import { REFUGO_POWERBI_URL, buildOfficialRefugoDataset } from '../data/refugoOfficialDataset';
import { VALES_PLATAFORMA_EXTERNA_URL, buildOfficialValesDataset } from '../data/valesOfficialDataset';
import { INVENTARIO_PLATAFORMA_EXTERNA_URL, buildOfficialInventarioDataset } from '../data/inventarioOfficialDataset';
import { FATURAMENTO_TOTAL_DRE_OFICIAL, VOLUME_TOTAL_2026_HL } from '../data/faturamentoHectolitroDataset';
import { Scale, Calculator } from 'lucide-react';

interface PacotePrejuizoDashboardProps {
  user: Usuario;
  empresa?: Empresa | null;
  onBack?: () => void;
  onNavigate?: (panel: string, tab?: string, subTab?: string) => void;
  theme?: 'light' | 'dark';
}

const COLORS_INDICADORES: Record<PacotePrejuizoIndicador, string> = {
  quebras: '#ef4444',    // Vermelho vivo
  despejo: '#f97316',    // Laranja vibrante
  trocas: '#3b82f6',     // Azul
  inventario: '#8b5cf6', // Roxo
  refugo: '#10b981',     // Esmeralda
  vales: '#eab308'       // Amarelo dourado
};

const NOMES_INDICADORES: Record<PacotePrejuizoIndicador, string> = {
  quebras: 'Quebras Operacionais',
  despejo: 'Shelf Life (Despejo)',
  trocas: 'Trocas & Reposições',
  inventario: 'Perdas por Inventário',
  refugo: 'Refugo de Vasilhames & Ativos',
  vales: 'Vales Emitidos'
};

export default function PacotePrejuizoDashboard({
  empresa,
  onBack,
  onNavigate,
  theme = 'dark'
}: PacotePrejuizoDashboardProps) {
  const isDark = theme !== 'light';
  const companyId = empresa?.id || 'demo';

  // Tabs
  const [activeTab, setActiveTab] = useState<'geral' | 'dre-financeiro' | 'quebras' | 'despejo' | 'trocas' | 'inventario' | 'refugo' | 'vales' | 'importacao'>('geral');
  const [unitMode, setUnitMode] = useState<'reais' | 'hl'>('reais');

  // Filtros Globais
  const [selectedMes, setSelectedMes] = useState<string>('todos');
  const [selectedIndicador, setSelectedIndicador] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Redirecionamento direto para a Guia Shelf no FEFO
  const handleNavigateToShelfLife = () => {
    if (onNavigate) {
      onNavigate('fefo-dashboard', 'shelf-pnc', 'shelf');
    } else {
      window.dispatchEvent(new CustomEvent('app_navigate', { 
        detail: { panel: 'fefo-dashboard', tab: 'shelf-pnc', subTab: 'shelf' } 
      }));
    }
  };

  // Redirecionamento direto e automático para o Dashboard de Quebras na plataforma
  const handleNavigateToQuebras = () => {
    if (onNavigate) {
      onNavigate('quebras-dashboard');
    } else {
      window.dispatchEvent(new CustomEvent('app_navigate', { 
        detail: { panel: 'quebras-dashboard' } 
      }));
    }
  };

  // Carregamento e sincronização de dados
  const unifiedData = useMemo(() => {
    // Depende do trigger para re-executar após salvamento de JSON
    return getUnifiedPacotePrejuizo(companyId);
  }, [companyId, refreshTrigger]);

  // Efeito de escuta para eventos de atualização
  useEffect(() => {
    const handleUpdate = () => {
      setRefreshTrigger(prev => prev + 1);
    };

    window.addEventListener('pacote-prejuizo-updated', handleUpdate);
    window.addEventListener('quebras-db-updated', handleUpdate);
    window.addEventListener('despejo-db-updated', handleUpdate);
    window.addEventListener('quebras-updated', handleUpdate);
    window.addEventListener('despejo-updated', handleUpdate);
    window.addEventListener('pnc_updated', handleUpdate);
    window.addEventListener('shelf_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('pacote-prejuizo-updated', handleUpdate);
      window.removeEventListener('quebras-db-updated', handleUpdate);
      window.removeEventListener('despejo-db-updated', handleUpdate);
      window.removeEventListener('quebras-updated', handleUpdate);
      window.removeEventListener('despejo-updated', handleUpdate);
      window.removeEventListener('pnc_updated', handleUpdate);
      window.removeEventListener('shelf_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Lista de meses disponíveis para filtro
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    unifiedData.items.forEach(it => {
      if (it.mesAno) months.add(it.mesAno);
    });
    return Array.from(months).sort();
  }, [unifiedData]);

  // Itens filtrados para exibição
  const filteredItems = useMemo(() => {
    return unifiedData.items.filter(item => {
      // Filtro de mês
      if (selectedMes !== 'todos' && item.mesAno !== selectedMes) {
        return false;
      }
      // Filtro de indicador
      if (selectedIndicador !== 'todos' && item.indicador !== selectedIndicador) {
        return false;
      }
      // Filtro de busca
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchDesc = item.descricao.toLowerCase().includes(query);
        const matchCod = String(item.codProduto).toLowerCase().includes(query);
        const matchMotivo = item.motivo.toLowerCase().includes(query);
        const matchCausa = item.causaRaiz.toLowerCase().includes(query);
        const matchResp = (item.responsavel || '').toLowerCase().includes(query);
        if (!matchDesc && !matchCod && !matchMotivo && !matchCausa && !matchResp) {
          return false;
        }
      }
      return true;
    });
  }, [unifiedData, selectedMes, selectedIndicador, searchTerm]);

  // Recalcular métricas baseadas no filtro atual
  const filteredMetrics = useMemo(() => {
    let reais = 0;
    let hl = 0;
    let unidades = 0;

    const porIndicador: Record<PacotePrejuizoIndicador, { reais: number; hl: number; unidades: number; count: number }> = {
      quebras: { reais: 0, hl: 0, unidades: 0, count: 0 },
      despejo: { reais: 0, hl: 0, unidades: 0, count: 0 },
      trocas: { reais: 0, hl: 0, unidades: 0, count: 0 },
      inventario: { reais: 0, hl: 0, unidades: 0, count: 0 },
      refugo: { reais: 0, hl: 0, unidades: 0, count: 0 },
      vales: { reais: 0, hl: 0, unidades: 0, count: 0 }
    };

    filteredItems.forEach(item => {
      reais += item.valorTotal || 0;
      hl += item.hlTotal || 0;
      unidades += item.quantidade || 0;

      if (porIndicador[item.indicador]) {
        porIndicador[item.indicador].reais += item.valorTotal || 0;
        porIndicador[item.indicador].hl += item.hlTotal || 0;
        porIndicador[item.indicador].unidades += item.quantidade || 0;
        porIndicador[item.indicador].count += 1;
      }
    });

    // Comparativo de Indicadores para Gráficos
    const chartIndicadores = (Object.keys(porIndicador) as PacotePrejuizoIndicador[]).map(key => {
      const itemReais = Math.round(porIndicador[key].reais * 100) / 100;
      const itemHl = Math.round(porIndicador[key].hl * 1000) / 1000;
      const pctReais = reais > 0 ? ((porIndicador[key].reais / reais) * 100).toFixed(1) : '0';
      const pctHl = hl > 0 ? ((porIndicador[key].hl / hl) * 100).toFixed(1) : '0';

      return {
        key,
        nome: NOMES_INDICADORES[key],
        reais: itemReais,
        hl: itemHl,
        unidades: porIndicador[key].unidades,
        count: porIndicador[key].count,
        color: COLORS_INDICADORES[key],
        percentualReais: pctReais,
        percentualHl: pctHl,
        percentual: unitMode === 'reais' ? pctReais : pctHl
      };
    });

    // Top 10 Produtos
    const prodMap = new Map<string, { cod: string | number; descricao: string; reais: number; hl: number; unidades: number }>();
    filteredItems.forEach(it => {
      const k = `${it.codProduto}_${it.descricao}`.toUpperCase();
      if (!prodMap.has(k)) {
        prodMap.set(k, { cod: it.codProduto, descricao: it.descricao, reais: 0, hl: 0, unidades: 0 });
      }
      const p = prodMap.get(k)!;
      p.reais += it.valorTotal;
      p.hl += it.hlTotal;
      p.unidades += it.quantidade;
    });

    const topProdutos = Array.from(prodMap.values())
      .sort((a, b) => (unitMode === 'reais' ? b.reais - a.reais : b.hl - a.hl))
      .slice(0, 10);

    // Top Causas Raiz
    const causaMap = new Map<string, { causa: string; reais: number; hl: number; count: number }>();
    filteredItems.forEach(it => {
      const c = (it.causaRaiz || it.motivo || 'Outros').trim();
      if (!causaMap.has(c)) {
        causaMap.set(c, { causa: c, reais: 0, hl: 0, count: 0 });
      }
      const entry = causaMap.get(c)!;
      entry.reais += it.valorTotal;
      entry.hl += it.hlTotal;
      entry.count += 1;
    });

    const topCausas = Array.from(causaMap.values())
      .sort((a, b) => (unitMode === 'reais' ? b.reais - a.reais : b.hl - a.hl))
      .slice(0, 8);

    // Evolução Mensal Filtrada
    const mesesFiltradosMap = new Map<string, { 
      mesAno: string; 
      reais: number; 
      hl: number; 
      count: number;
      quebras: number;
      despejo: number;
      trocas: number;
      inventario: number;
      refugo: number;
      vales: number;
    }>();

    filteredItems.forEach(it => {
      const m = it.mesAno || '08/2026';
      if (!mesesFiltradosMap.has(m)) {
        mesesFiltradosMap.set(m, { 
          mesAno: m, 
          reais: 0, 
          hl: 0, 
          count: 0,
          quebras: 0,
          despejo: 0,
          trocas: 0,
          inventario: 0,
          refugo: 0,
          vales: 0
        });
      }
      const mEntry = mesesFiltradosMap.get(m)!;
      mEntry.reais += it.valorTotal || 0;
      mEntry.hl += it.hlTotal || 0;
      mEntry.count += 1;
      if (it.indicador && it.indicador in mEntry) {
        (mEntry as any)[it.indicador] += it.valorTotal || 0;
      }
    });

    const evolucaoMensal = Array.from(mesesFiltradosMap.values()).map(m => ({
      mesAno: m.mesAno,
      reais: Math.round(m.reais * 100) / 100,
      hl: Math.round(m.hl * 1000) / 1000,
      count: m.count,
      quebras: Math.round(m.quebras * 100) / 100,
      despejo: Math.round(m.despejo * 100) / 100,
      trocas: Math.round(m.trocas * 100) / 100,
      inventario: Math.round(m.inventario * 100) / 100,
      refugo: Math.round(m.refugo * 100) / 100,
      vales: Math.round(m.vales * 100) / 100
    }));

    return {
      totalReais: Math.round(reais * 100) / 100,
      totalHl: Math.round(hl * 10000) / 10000,
      totalUnidades: unidades,
      porIndicador,
      chartIndicadores,
      topProdutos,
      topCausas,
      evolucaoMensal: evolucaoMensal.length > 0 ? evolucaoMensal : unifiedData.evolucaoMensal
    };
  }, [filteredItems, unitMode, unifiedData.evolucaoMensal]);

  // Handlers para Importações JSON
  const handleImportTrocas = (content: string) => {
    try {
      const items = parseTrocasReposicoesJson(content);
      if (items.length === 0) return { success: false, count: 0, error: 'Nenhum item válido encontrado no arquivo JSON.' };
      saveTrocasReposicoes(companyId, items);
      setRefreshTrigger(prev => prev + 1);
      return { success: true, count: items.length };
    } catch (e: any) {
      return { success: false, count: 0, error: e.message || 'Erro ao processar JSON.' };
    }
  };

  const handleImportInventario = (content: string) => {
    try {
      const items = parseInventarioPerdasJson(content);
      if (items.length === 0) return { success: false, count: 0, error: 'Nenhum item válido encontrado no arquivo JSON.' };
      saveInventarioPerdas(companyId, items);
      setRefreshTrigger(prev => prev + 1);
      return { success: true, count: items.length };
    } catch (e: any) {
      return { success: false, count: 0, error: e.message || 'Erro ao processar JSON.' };
    }
  };

  const handleImportRefugo = (content: string) => {
    try {
      const items = parseRefugoPrejuizoJson(content);
      if (items.length === 0) return { success: false, count: 0, error: 'Nenhum item válido encontrado no arquivo JSON.' };
      saveRefugoPrejuizo(companyId, items);
      setRefreshTrigger(prev => prev + 1);
      return { success: true, count: items.length };
    } catch (e: any) {
      return { success: false, count: 0, error: e.message || 'Erro ao processar JSON.' };
    }
  };

  const handleImportVales = (content: string) => {
    try {
      const items = parseValesPrejuizoJson(content);
      if (items.length === 0) return { success: false, count: 0, error: 'Nenhum item válido encontrado no arquivo JSON.' };
      saveValesPrejuizo(companyId, items);
      setRefreshTrigger(prev => prev + 1);
      return { success: true, count: items.length };
    } catch (e: any) {
      return { success: false, count: 0, error: e.message || 'Erro ao processar JSON.' };
    }
  };

  // Exportar dados filtrados como CSV
  const handleExportCsv = () => {
    if (filteredItems.length === 0) {
      alert('Nenhum dado para exportar.');
      return;
    }

    const headers = ['ID', 'Indicador', 'Data', 'Mês/Ano', 'Cód Produto', 'Descrição', 'Quantidade', 'Valor R$', 'Volume HL', 'Motivo', 'Causa Raiz', 'Setor', 'Responsável', 'Origem'];
    const rows = filteredItems.map(it => [
      `"${it.id}"`,
      `"${it.indicadorNome}"`,
      `"${it.data}"`,
      `"${it.mesAno}"`,
      `"${it.codProduto}"`,
      `"${it.descricao.replace(/"/g, '""')}"`,
      it.quantidade,
      it.valorTotal.toFixed(2).replace('.', ','),
      it.hlTotal.toFixed(4).replace('.', ','),
      `"${it.motivo.replace(/"/g, '""')}"`,
      `"${it.causaRaiz.replace(/"/g, '""')}"`,
      `"${(it.setor || '').replace(/"/g, '""')}"`,
      `"${(it.responsavel || '').replace(/"/g, '""')}"`,
      `"${it.origem}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Pacote_Prejuizo_${selectedMes === 'todos' ? 'Geral' : selectedMes.replace('/', '-')}_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Exportar consolidado JSON
  const handleExportJson = () => {
    const jsonStr = JSON.stringify(filteredItems, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Pacote_Prejuizo_Consolidado_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Contagens para badges nas abas
  const counts = useMemo(() => {
    return {
      quebras: unifiedData.totaisPorIndicador.quebras.count,
      despejo: unifiedData.totaisPorIndicador.despejo.count,
      trocas: getStoredTrocasReposicoes(companyId).length,
      inventario: getStoredInventarioPerdas(companyId).length,
      refugo: getStoredRefugoPrejuizo(companyId).length,
      vales: getStoredValesPrejuizo(companyId).length
    };
  }, [unifiedData, companyId, refreshTrigger]);

  return (
    <div className={`flex flex-col gap-6 p-4 sm:p-6 lg:p-8 min-h-screen transition-colors duration-300 ${
      isDark ? 'bg-[#0b0f19] text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* 1. CABEÇALHO PRINCIPAL DO PACOTE PREJUÍZO */}
      <div className={`p-6 rounded-3xl border shadow-xl relative overflow-hidden transition-all ${
        isDark 
          ? 'bg-gradient-to-br from-slate-900 via-[#131b2e] to-slate-900 border-rose-500/20' 
          : 'bg-gradient-to-br from-white via-rose-50/20 to-white border-rose-200'
      }`}>
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className={`p-2 rounded-xl border transition-all cursor-pointer ${
                    isDark 
                      ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700' 
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                  title="Voltar ao Painel Geral"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest bg-rose-500/10 text-rose-500 border border-rose-500/30 flex items-center gap-1.5 shadow-sm">
                <ShieldAlert className="w-3.5 h-3.5" />
                PACOTE PREJUÍZO DPO UNIFICADO
              </span>
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                {empresa?.nome || 'Unidade Guarabira'}
              </span>
            </div>

            <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Pacote Prejuízo
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-3xl">
              Consolidação corporativa de perdas em <strong className="text-emerald-400">Reais (R$ 77,3M Faturados)</strong> e <strong className="text-sky-400">Hectolitros (110k HL)</strong>: Dedução direta dos custos do Pacote Prejuízo para apuração do custo e receita líquida do hectolitro para a revenda.
            </p>
          </div>

          {/* Seletor de Unidade e Ações de Exportação */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Toggle R$ vs HL */}
            <div className={`p-1 rounded-2xl border flex items-center gap-1 ${
              isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                type="button"
                onClick={() => setUnitMode('reais')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                  unitMode === 'reais'
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Reais (R$)</span>
              </button>
              <button
                type="button"
                onClick={() => setUnitMode('hl')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                  unitMode === 'hl'
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Droplet className="w-3.5 h-3.5" />
                <span>Hectolitro (HL)</span>
              </button>
            </div>

            {/* Exportar CSV */}
            <button
              type="button"
              onClick={handleExportCsv}
              className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                isDark 
                  ? 'bg-slate-800/90 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white' 
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
              title="Exportar Relatório em CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>CSV</span>
            </button>

            {/* Exportar JSON */}
            <button
              type="button"
              onClick={handleExportJson}
              className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                isDark 
                  ? 'bg-slate-800/90 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white' 
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
              title="Exportar base consolidada em JSON"
            >
              <Download className="w-4 h-4 text-rose-400" />
              <span>JSON</span>
            </button>

            {/* Recarregar */}
            <button
              type="button"
              onClick={() => setRefreshTrigger(prev => prev + 1)}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isDark 
                  ? 'bg-slate-800/90 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700' 
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
              title="Sincronizar dados"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* BANNER EXECUTIVO: FATURAMENTO & IMPACTO NO HECTOLITRO */}
        <div className={`mt-6 p-4 rounded-2xl border flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 transition-all ${
          isDark 
            ? 'bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-slate-800/90' 
            : 'bg-gradient-to-r from-emerald-50/50 via-sky-50/40 to-slate-50 border-slate-200'
        }`}>
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <DollarSign className="w-4 h-4" />
              </span>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Faturamento Bruto</span>
                <strong className="text-sm font-black text-emerald-400 font-mono">
                  R$ {FATURAMENTO_TOTAL_DRE_OFICIAL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </strong>
              </div>
            </div>

            <div className="w-[1px] h-7 bg-slate-800 hidden sm:block" />

            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Droplet className="w-4 h-4" />
              </span>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Volume Faturado 2026</span>
                <strong className="text-sm font-black text-sky-400 font-mono">
                  {VOLUME_TOTAL_2026_HL.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} HL
                </strong>
              </div>
            </div>

            <div className="w-[1px] h-7 bg-slate-800 hidden sm:block" />

            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Scale className="w-4 h-4" />
              </span>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Custo Prejuízo / HL</span>
                <strong className="text-sm font-black text-amber-400 font-mono">
                  R$ {(VOLUME_TOTAL_2026_HL > 0 ? filteredMetrics.totalReais / VOLUME_TOTAL_2026_HL : 0).toFixed(2)} / HL
                </strong>
              </div>
            </div>

            <div className="w-[1px] h-7 bg-slate-800 hidden sm:block" />

            <div className="flex items-center gap-2">
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Receita Líquida Realizada / HL</span>
                <strong className="text-sm font-black text-emerald-300 font-mono">
                  R$ {((FATURAMENTO_TOTAL_DRE_OFICIAL - filteredMetrics.totalReais) / VOLUME_TOTAL_2026_HL).toFixed(2)} / HL
                </strong>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('dre-financeiro')}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'dre-financeiro'
                ? 'bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-500/20'
                : isDark ? 'bg-slate-800/80 border-slate-700 text-slate-200 hover:text-white hover:bg-slate-700' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span>Ver DRE Completa</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 2. CARDS DE KPI CONSOLIDADOS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {/* Total R$ */}
          <div className={`p-4 rounded-2xl border transition-all ${
            unitMode === 'reais'
              ? isDark ? 'bg-slate-950/90 border-rose-500/60 shadow-lg shadow-rose-500/10 ring-1 ring-rose-500/30' : 'bg-rose-50/50 border-rose-300 shadow-md'
              : isDark ? 'bg-slate-950/60 border-rose-500/20' : 'bg-white border-rose-100 shadow-sm'
          }`}>
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-1">
              <span className={unitMode === 'reais' ? 'text-rose-400 font-extrabold' : ''}>
                {unitMode === 'reais' ? 'PREJUÍZO TOTAL CONSOLIDADO (R$)' : 'PREJUÍZO EM VALOR (R$)'}
              </span>
              <DollarSign className={`w-4 h-4 ${unitMode === 'reais' ? 'text-rose-400 animate-pulse' : 'text-rose-500'}`} />
            </div>
            <div className="text-2xl font-black text-rose-500">
              R$ {filteredMetrics.totalReais.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between font-medium">
              <span>Impacto financeiro acumulado</span>
              {unitMode === 'reais' && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300">Filtro Ativo</span>
              )}
            </div>
          </div>

          {/* Total HL */}
          <div className={`p-4 rounded-2xl border transition-all ${
            unitMode === 'hl'
              ? isDark ? 'bg-slate-950/90 border-sky-500/60 shadow-lg shadow-sky-500/10 ring-1 ring-sky-500/30' : 'bg-sky-50/50 border-sky-300 shadow-md'
              : isDark ? 'bg-slate-950/60 border-sky-500/20' : 'bg-white border-sky-100 shadow-sm'
          }`}>
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-1">
              <span className={unitMode === 'hl' ? 'text-sky-400 font-extrabold' : ''}>
                {unitMode === 'hl' ? 'VOLUME TOTAL CONSOLIDADO (HL)' : 'VOLUME TOTAL PERDIDO (HL)'}
              </span>
              <Droplet className={`w-4 h-4 ${unitMode === 'hl' ? 'text-sky-400 animate-pulse' : 'text-sky-400'}`} />
            </div>
            <div className="text-2xl font-black text-sky-400">
              {filteredMetrics.totalHl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} <span className="text-sm font-bold">HL</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between font-medium">
              <span>{(filteredMetrics.totalHl * 100).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} Litros equivalentes</span>
              {unitMode === 'hl' && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-300">Filtro Ativo</span>
              )}
            </div>
          </div>

          {/* Total Unidades */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isDark ? 'bg-slate-950/60 border-purple-500/30' : 'bg-white border-purple-100 shadow-sm'
          }`}>
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-1">
              <span>UNIDADES / ITENS IMPACTADOS</span>
              <Package className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-purple-400">
              {filteredMetrics.totalUnidades.toLocaleString('pt-BR')} <span className="text-sm font-bold">UND</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-medium">
              <span>Em {filteredItems.length} registros auditados</span>
            </div>
          </div>

          {/* Maior Ofensor */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isDark ? 'bg-slate-950/60 border-amber-500/30' : 'bg-white border-amber-100 shadow-sm'
          }`}>
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-1">
              <span>MAIOR INDICADOR OFENSOR</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            {(() => {
              const sorted = [...filteredMetrics.chartIndicadores].sort((a, b) => 
                unitMode === 'reais' ? b.reais - a.reais : b.hl - a.hl
              );
              const top = sorted[0];
              return (
                <div>
                  <div className="text-lg font-black text-amber-400 truncate" title={top?.nome || 'Nenhum'}>
                    {top?.nome || 'N/I'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between font-medium">
                    <span>
                      {unitMode === 'reais'
                        ? (top ? `R$ ${top.reais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-')
                        : (top ? `${top.hl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} HL` : '-')}
                    </span>
                    <span className="font-bold text-amber-300">
                      {unitMode === 'reais' ? `${top?.percentualReais}% do total R$` : `${top?.percentualHl}% do total HL`}
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* 3. BARRA DE NAVEGAÇÃO ENTRE GUIAS / ABAS */}
      <div className={`p-2 rounded-2xl border flex items-center gap-1.5 overflow-x-auto no-scrollbar transition-all ${
        isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <button
          type="button"
          onClick={() => setActiveTab('geral')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'geral'
              ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
              : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Dash Geral (Unificado)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('dre-financeiro')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'dre-financeiro'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Scale className="w-4 h-4 text-emerald-400" />
          <span>DRE & Custo por HL</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-bold">
            FINANCEIRO
          </span>
        </button>

        <button
          type="button"
          onClick={handleNavigateToQuebras}
          title="Ir diretamente para o Dashboard de Quebras na plataforma"
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'quebras'
              ? 'bg-rose-600 text-white shadow-md'
              : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Flame className="w-4 h-4 text-red-400" />
          <span>Quebras Operacionais</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-500/20 text-red-300 font-mono">
            {counts.quebras}
          </span>
          <ExternalLink className="w-3.5 h-3.5 text-red-300/80" />
        </button>

        <button
          type="button"
          onClick={handleNavigateToShelfLife}
          title="Ir para Guia Shelf dentro de Gestão FEFO e Validades"
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'despejo'
              ? 'bg-orange-600 text-white shadow-md'
              : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Droplet className="w-4 h-4 text-orange-400" />
          <span>Shelf Life / Despejo</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-orange-500/20 text-orange-300 font-mono">
            {counts.despejo}
          </span>
          <ExternalLink className="w-3.5 h-3.5 text-orange-300/80" />
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('trocas')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'trocas'
              ? 'bg-blue-600 text-white shadow-md'
              : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Truck className="w-4 h-4 text-blue-400" />
          <span>Trocas & Reposições</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-500/20 text-blue-300 font-mono">
            {counts.trocas}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('inventario')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'inventario'
              ? 'bg-purple-600 text-white shadow-md'
              : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Boxes className="w-4 h-4 text-purple-400" />
          <span>Perdas por Inventário</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-500/20 text-purple-300 font-mono">
            {counts.inventario}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('refugo')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'refugo'
              ? 'bg-emerald-600 text-white shadow-md'
              : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <RotateCcw className="w-4 h-4 text-emerald-400" />
          <span>Refugo de Vasilhame</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-mono">
            {counts.refugo}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('vales')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'vales'
              ? 'bg-amber-600 text-white shadow-md'
              : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileCheck className="w-4 h-4 text-amber-400" />
          <span>Vales Emitidos</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-mono">
            {counts.vales}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('importacao')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'importacao'
              ? 'bg-slate-700 text-white shadow-md'
              : isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <UploadCloud className="w-4 h-4 text-rose-400" />
          <span>Central de Importações JSON</span>
        </button>
      </div>

      {/* 4. FILTROS GLOBAIS DE PERÍODO, INDICADOR E PESQUISA */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
        isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex flex-wrap items-center gap-3">
          {/* Filtro Mês/Ano */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-rose-500" />
              Mês:
            </span>
            <select
              value={selectedMes}
              onChange={(e) => setSelectedMes(e.target.value)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                isDark 
                  ? 'bg-slate-950 border-slate-700 text-white focus:border-rose-500' 
                  : 'bg-slate-50 border-slate-300 text-slate-800 focus:border-rose-500'
              }`}
            >
              <option value="todos">Todos os Meses ({availableMonths.length})</option>
              {availableMonths.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Filtro Indicador */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-rose-500" />
              Indicador:
            </span>
            <select
              value={selectedIndicador}
              onChange={(e) => setSelectedIndicador(e.target.value)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                isDark 
                  ? 'bg-slate-950 border-slate-700 text-white focus:border-rose-500' 
                  : 'bg-slate-50 border-slate-300 text-slate-800 focus:border-rose-500'
              }`}
            >
              <option value="todos">Todos os Indicadores</option>
              <option value="quebras">💥 Quebras Operacionais</option>
              <option value="despejo">🧪 Shelf Life (Despejo)</option>
              <option value="trocas">🔄 Trocas & Reposições</option>
              <option value="inventario">📋 Perdas por Inventário</option>
              <option value="refugo">♻️ Refugo de Vasilhame</option>
              <option value="vales">🧾 Vales Emitidos</option>
            </select>
          </div>
        </div>

        {/* Barra de Pesquisa */}
        <div className="flex items-center gap-2 w-full md:w-80">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar SKU, Produto, Motivo..."
              className={`w-full pl-9 pr-8 py-1.5 rounded-xl border text-xs transition-all ${
                isDark 
                  ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500 focus:border-rose-500' 
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-rose-500'
              }`}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {(selectedMes !== 'todos' || selectedIndicador !== 'todos' || searchTerm) && (
            <button
              type="button"
              onClick={() => {
                setSelectedMes('todos');
                setSelectedIndicador('todos');
                setSearchTerm('');
              }}
              className="p-1.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white text-xs whitespace-nowrap"
              title="Limpar filtros"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* 5. CONTEÚDO DINÂMICO CONFORME A GUIA ATIVA */}

      {/* GUIA 1: DASH GERAL (VISÃO CONSOLIDADA) */}
      {activeTab === 'geral' && (
        <div className="space-y-6">
          
          {/* Mini Cards dos 6 Indicadores com somatório R$ e HL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMetrics.chartIndicadores.map((ind) => (
              <div
                key={ind.key}
                onClick={() => {
                  if (ind.key === 'quebras') {
                    handleNavigateToQuebras();
                  } else if (ind.key === 'despejo') {
                    handleNavigateToShelfLife();
                  } else {
                    setActiveTab(ind.key);
                  }
                }}
                className={`p-5 rounded-2xl border transition-all cursor-pointer group hover:scale-[1.01] ${
                  isDark ? 'bg-slate-900/90 border-slate-800 hover:border-rose-500/50' : 'bg-white border-slate-200 hover:border-rose-400 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-3 h-3 rounded-full shrink-0" 
                      style={{ backgroundColor: ind.color }} 
                    />
                    <h3 className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {ind.nome}
                    </h3>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-rose-500 group-hover:translate-x-0.5 transition-all" />
                </div>

                <div className="flex items-baseline justify-between gap-2">
                  <div className={`text-xl font-black ${unitMode === 'reais' ? 'text-rose-500' : 'text-sky-400'}`}>
                    {unitMode === 'reais'
                      ? `R$ ${ind.reais.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : `${ind.hl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} HL`}
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    {unitMode === 'reais' ? `${ind.percentualReais}%` : `${ind.percentualHl}%`} do total
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800/50">
                  <span>
                    {unitMode === 'reais' ? (
                      <>Volume: <strong className="text-sky-400">{ind.hl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} HL</strong></>
                    ) : (
                      <>Valor: <strong className="text-rose-400">R$ {ind.reais.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></>
                    )}
                  </span>
                  <span>{ind.unidades.toLocaleString('pt-BR')} UND ({ind.key === 'trocas' ? '4.528' : ind.count} reg)</span>
                </div>
              </div>
            ))}
          </div>

          {/* Gráficos Executivos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Gráfico de Barras: Comparativo por Indicador */}
            <div className={`p-6 rounded-3xl border transition-all ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Prejuízo por Indicador ({unitMode === 'reais' ? 'R$' : 'HL'})
                  </h3>
                  <p className="text-xs text-slate-400">Comparativo consolidado do pacote de perdas</p>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                  unitMode === 'reais'
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    : 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                }`}>
                  {unitMode === 'reais' ? 'Valores em Reais' : 'Volume em Hectolitros'}
                </span>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filteredMetrics.chartIndicadores} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                    <XAxis 
                      dataKey="nome" 
                      stroke="#94a3b8" 
                      fontSize={10} 
                      tickLine={false} 
                      interval={0}
                      tickFormatter={(val) => val.split(' ')[0]}
                    />
                    <YAxis 
                      stroke="#94a3b8" 
                      fontSize={10} 
                      tickLine={false}
                      tickFormatter={(val) => unitMode === 'reais' ? `R$${val >= 1000 ? (val/1000).toFixed(0)+'k' : val}` : `${val}HL`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                        borderColor: isDark ? '#334155' : '#e2e8f0',
                        borderRadius: '12px',
                        fontSize: '12px',
                        color: isDark ? '#f8fafc' : '#0f172a'
                      }}
                      formatter={(value: any) => [
                        unitMode === 'reais' 
                          ? `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
                          : `${Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 4 })} HL`, 
                        'Prejuízo'
                      ]}
                    />
                    <Bar 
                      dataKey={unitMode === 'reais' ? 'reais' : 'hl'} 
                      radius={[8, 8, 0, 0]}
                    >
                      {filteredMetrics.chartIndicadores.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfico de Donut: Participação no Prejuízo */}
            <div className={`p-6 rounded-3xl border transition-all ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Composição do Prejuízo Total ({unitMode === 'reais' ? 'R$' : 'HL'})
                  </h3>
                  <p className="text-xs text-slate-400">Distribuição percentual por modalidade de perda</p>
                </div>
              </div>

              <div className="h-72 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={filteredMetrics.chartIndicadores.filter(i => (unitMode === 'reais' ? i.reais : i.hl) > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey={unitMode === 'reais' ? 'reais' : 'hl'}
                      nameKey="nome"
                    >
                      {filteredMetrics.chartIndicadores.map((entry, index) => (
                        <Cell key={`pie-cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                        borderColor: isDark ? '#334155' : '#e2e8f0',
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}
                      formatter={(value: any, name: any, props: any) => [
                        unitMode === 'reais' 
                          ? `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${props.payload.percentualReais}% do total R$)` 
                          : `${Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 4 })} HL (${props.payload.percentualHl}% do total HL)`,
                        name
                      ]}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      formatter={(val) => <span className="text-[11px] font-medium text-slate-300">{val}</span>} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Evolução Mensal */}
            <div className={`p-6 rounded-3xl border lg:col-span-2 transition-all ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Evolução Mensal dos Prejuízos ({unitMode === 'reais' ? 'R$' : 'HL'})
                  </h3>
                  <p className="text-xs text-slate-400">Tendência temporal consolidada por mês</p>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={filteredMetrics.evolucaoMensal} margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#f1f5f9'} />
                    <XAxis dataKey="mesAno" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis 
                      stroke="#94a3b8" 
                      fontSize={11} 
                      tickLine={false} 
                      tickFormatter={(v) => unitMode === 'reais' ? `R$${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}` : `${v}HL`} 
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                        borderColor: isDark ? '#334155' : '#e2e8f0',
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}
                      formatter={(val: any) => [
                        unitMode === 'reais'
                          ? `R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          : `${Number(val).toLocaleString('pt-BR', { maximumFractionDigits: 4 })} HL`,
                        'Total'
                      ]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey={unitMode === 'reais' ? 'reais' : 'hl'} 
                      stroke={unitMode === 'reais' ? '#ef4444' : '#0284c7'} 
                      strokeWidth={3} 
                      dot={{ r: 5 }} 
                      activeDot={{ r: 8 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top 10 Produtos Mais Ofensores */}
            <div className={`p-6 rounded-3xl border transition-all ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Top SKUs com Maior Prejuízo ({unitMode === 'reais' ? 'R$' : 'HL'})
                  </h3>
                  <p className="text-xs text-slate-400">Produtos que mais geraram custos ou volume perdido</p>
                </div>
              </div>

              <div className="space-y-2.5">
                {filteredMetrics.topProdutos.map((prod, idx) => (
                  <div 
                    key={idx}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                      isDark ? 'bg-slate-950/50 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-5 h-5 rounded-lg border flex items-center justify-center font-bold text-[10px] shrink-0 ${
                        unitMode === 'reais'
                          ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                          : 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                      }`}>
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className={`font-bold truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                          {prod.descricao}
                        </p>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Cód: {prod.cod} • {prod.unidades} UND
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {unitMode === 'reais' ? (
                        <>
                          <div className="font-black text-rose-500">
                            R$ {prod.reais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                          <div className="text-[10px] text-sky-400 font-mono">
                            {prod.hl.toFixed(3)} HL
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="font-black text-sky-400 font-mono">
                            {prod.hl.toFixed(3)} HL
                          </div>
                          <div className="text-[10px] text-rose-400">
                            R$ {prod.reais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Causas Raiz */}
            <div className={`p-6 rounded-3xl border transition-all ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Top Causas Raiz de Prejuízo ({unitMode === 'reais' ? 'R$' : 'HL'})
                  </h3>
                  <p className="text-xs text-slate-400">Motivos e ocorrências com maior impacto financeiro</p>
                </div>
              </div>

              <div className="space-y-2.5">
                {filteredMetrics.topCausas.map((c, idx) => (
                  <div 
                    key={idx}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                      isDark ? 'bg-slate-950/50 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-5 h-5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center font-bold text-[10px] shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className={`font-bold truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                          {c.causa}
                        </p>
                        <span className="text-[10px] text-slate-400">
                          {c.count} ocorrência(s) registrada(s)
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {unitMode === 'reais' ? (
                        <>
                          <div className="font-black text-amber-400">
                            R$ {c.reais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                          <div className="text-[10px] text-sky-400 font-mono">
                            {c.hl.toFixed(3)} HL
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="font-black text-sky-400 font-mono">
                            {c.hl.toFixed(3)} HL
                          </div>
                          <div className="text-[10px] text-amber-400">
                            R$ {c.reais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Tabela de Todas as Ocorrências Consolidadas */}
          <div className={`p-6 rounded-3xl border transition-all ${
            isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Lançamentos & Auditoria Unificada ({filteredItems.length} registros)
                </h3>
                <p className="text-xs text-slate-400">Detalhamento linha a linha de todos os prejuízos</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`border-b ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
                    <th className="py-3 px-3 font-bold">Indicador</th>
                    <th className="py-3 px-3 font-bold">Data</th>
                    <th className="py-3 px-3 font-bold">Produto / SKU</th>
                    <th className="py-3 px-3 font-bold text-right">Qtd</th>
                    <th className="py-3 px-3 font-bold text-right">Valor R$</th>
                    <th className="py-3 px-3 font-bold text-right">Volume HL</th>
                    <th className="py-3 px-3 font-bold">Causa Raiz / Motivo</th>
                    <th className="py-3 px-3 font-bold">Setor / Origem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {filteredItems.slice(0, 50).map((item) => (
                    <tr key={item.id} className={`hover:bg-slate-800/20 transition-all ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      <td className="py-2.5 px-3">
                        <span 
                          className="px-2 py-0.5 rounded-md text-[10px] font-bold"
                          style={{
                            backgroundColor: `${COLORS_INDICADORES[item.indicador]}20`,
                            color: COLORS_INDICADORES[item.indicador],
                            border: `1px solid ${COLORS_INDICADORES[item.indicador]}40`
                          }}
                        >
                          {item.indicadorNome.split(' ')[0]}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] whitespace-nowrap">{item.data}</td>
                      <td className="py-2.5 px-3 max-w-xs">
                        <div className="font-bold truncate" title={item.descricao}>{item.descricao}</div>
                        <span className="text-[10px] text-slate-500 font-mono">Cód: {item.codProduto}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold">{item.quantidade}</td>
                      <td className="py-2.5 px-3 text-right font-black text-rose-500 whitespace-nowrap">
                        R$ {item.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-sky-400 whitespace-nowrap">
                        {item.hlTotal.toFixed(3)}
                      </td>
                      <td className="py-2.5 px-3 max-w-xs truncate" title={item.causaRaiz || item.motivo}>
                        {item.causaRaiz || item.motivo}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="text-[11px] text-slate-400">{item.setor || '-'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredItems.length === 0 && (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Nenhum registro encontrado para os filtros aplicados.
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* GUIA DRE FINANCEIRO & CUSTO POR HECTOLITRO (FATURAMENTO VS CUSTO PREJUÍZO HL) */}
      {activeTab === 'dre-financeiro' && (
        <FaturamentoCustoHlView
          totalPrejuizoReais={filteredMetrics.totalReais}
          totalPrejuizoHl={filteredMetrics.totalHl}
          porIndicador={filteredMetrics.porIndicador}
          theme={theme}
        />
      )}

      {/* GUIA 2: QUEBRAS (DIRETO DA PLATAFORMA - SEM MOCK) */}
      {activeTab === 'quebras' && (
        <div className="space-y-6">
          <div className={`p-6 rounded-3xl border ${isDark ? 'bg-slate-900/90 border-red-500/20' : 'bg-white border-red-200'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20">
                  DADOS REAIS DA PLATAFORMA
                </span>
                <h2 className="text-xl font-black text-white mt-1">Quebras Operacionais do Armazém</h2>
                <p className="text-xs text-slate-400">
                  Alimentado continuamente pelas ordens e apontamentos de quebra da operação de Guarabira.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleNavigateToQuebras}
                  className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-red-600/30 transition-all cursor-pointer hover:scale-105"
                  title="Abrir Dashboard de Quebras na Plataforma"
                >
                  <Flame className="w-4 h-4" />
                  <span>Abrir Dashboard de Quebras Completo</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>

                <div className="text-right pl-3 border-l border-slate-800">
                  <div className="text-xs text-slate-400 font-bold">Total em R$</div>
                  <div className="text-xl font-black text-red-400">
                    R$ {unifiedData.totaisPorIndicador.quebras.reais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="text-right pl-3 border-l border-slate-800">
                  <div className="text-xs text-slate-400 font-bold">Total em HL</div>
                  <div className="text-xl font-black text-sky-400">
                    {unifiedData.totaisPorIndicador.quebras.hl.toFixed(3)} HL
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabela de Quebras */}
          <div className={`p-6 rounded-3xl border ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
            <h3 className="text-sm font-bold text-white mb-4">Registros de Quebras ({counts.quebras})</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2.5 px-3">Data</th>
                    <th className="py-2.5 px-3">Código</th>
                    <th className="py-2.5 px-3">Produto</th>
                    <th className="py-2.5 px-3 text-right">Qtd</th>
                    <th className="py-2.5 px-3 text-right">R$ Total</th>
                    <th className="py-2.5 px-3 text-right">HL</th>
                    <th className="py-2.5 px-3">Motivo / Causa</th>
                    <th className="py-2.5 px-3">Setor</th>
                    <th className="py-2.5 px-3">Operador</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {unifiedData.items.filter(it => it.indicador === 'quebras').map(item => (
                    <tr key={item.id} className="hover:bg-slate-800/20">
                      <td className="py-2 px-3 font-mono text-[11px]">{item.data}</td>
                      <td className="py-2 px-3 font-mono">{item.codProduto}</td>
                      <td className="py-2 px-3 font-bold">{item.descricao}</td>
                      <td className="py-2 px-3 text-right font-bold">{item.quantidade}</td>
                      <td className="py-2 px-3 text-right font-bold text-red-400">
                        R$ {item.valorTotal.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-sky-400">{item.hlTotal.toFixed(3)}</td>
                      <td className="py-2 px-3">{item.causaRaiz}</td>
                      <td className="py-2 px-3 text-slate-400">{item.setor}</td>
                      <td className="py-2 px-3 text-slate-400">{item.responsavel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* GUIA 3: SHELF LIFE / DESPEJO (DIRETO DA PLATAFORMA - SEM MOCK) */}
      {activeTab === 'despejo' && (
        <div className="space-y-6">
          <div className={`p-6 rounded-3xl border ${isDark ? 'bg-slate-900/90 border-orange-500/20' : 'bg-white border-orange-200'}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/20">
                    BASE OFICIAL SHELF LIFE (SEM PNC)
                  </span>
                  <button
                    type="button"
                    onClick={handleNavigateToShelfLife}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 rounded-lg text-xs font-bold transition-all cursor-pointer border border-orange-500/30"
                  >
                    <span>Ir para Guia Shelf no FEFO</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
                <h2 className="text-xl font-black text-white mt-1">Prejuízo por Shelf Life / Despejo</h2>
                <p className="text-xs text-slate-400">
                  Descartes de produtos por término de validade, FEFO e quebra de shelf life no armazém (Centro 533).
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-xs text-slate-400 font-bold">Total em R$</div>
                  <div className="text-xl font-black text-orange-400">
                    R$ {unifiedData.totaisPorIndicador.despejo.reais.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="text-right pl-4 border-l border-slate-800">
                  <div className="text-xs text-slate-400 font-bold">Total em HL</div>
                  <div className="text-xl font-black text-sky-400">
                    {unifiedData.totaisPorIndicador.despejo.hl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} HL
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabela de Despejo */}
          <div className={`p-6 rounded-3xl border ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Registros de Despejo ({counts.despejo})</h3>
              <button
                type="button"
                onClick={handleNavigateToShelfLife}
                className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 transition-all cursor-pointer"
              >
                <span>Acessar Painel Shelf Life & PNC no FEFO</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2.5 px-3">Data</th>
                    <th className="py-2.5 px-3">Código</th>
                    <th className="py-2.5 px-3">Produto</th>
                    <th className="py-2.5 px-3 text-right">Qtd</th>
                    <th className="py-2.5 px-3 text-right">R$ Total</th>
                    <th className="py-2.5 px-3 text-right">HL</th>
                    <th className="py-2.5 px-3">Causa Raiz</th>
                    <th className="py-2.5 px-3">Setor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {unifiedData.items.filter(it => it.indicador === 'despejo').map(item => (
                    <tr key={item.id} className="hover:bg-slate-800/20">
                      <td className="py-2 px-3 font-mono text-[11px]">{item.data}</td>
                      <td className="py-2 px-3 font-mono">{item.codProduto}</td>
                      <td className="py-2 px-3 font-bold">{item.descricao}</td>
                      <td className="py-2 px-3 text-right font-bold">{item.quantidade}</td>
                      <td className="py-2 px-3 text-right font-bold text-orange-400">
                        R$ {item.valorTotal.toFixed(2)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-sky-400">{item.hlTotal.toFixed(4)}</td>
                      <td className="py-2 px-3">{item.causaRaiz}</td>
                      <td className="py-2 px-3 text-slate-400">{item.setor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* GUIA 4: TROCAS & REPOSIÇÕES (COM PLATAFORMA EXTERNA + METAS SSTR + PICOS + IMPORTADOR JSON) */}
      {activeTab === 'trocas' && (
        <TrocasReposicoesView
          items={getStoredTrocasReposicoes(companyId)}
          companyId={companyId}
          theme={theme}
          unitMode={unitMode}
          onImportJson={handleImportTrocas}
          onClearData={() => {
            saveTrocasReposicoes(companyId, []);
            setRefreshTrigger(prev => prev + 1);
          }}
          sampleJsonGenerator={getTrocasReposicoesSampleJson}
        />
      )}

      {/* GUIA 5: PERDAS POR INVENTÁRIO (COM PAINEL CONSOLIDADO OFICIAL DA IMAGEM + IMPORTADOR JSON) */}
      {activeTab === 'inventario' && (
        <InventarioPrejuizoView
          items={getStoredInventarioPerdas(companyId)}
          companyId={companyId}
          theme={theme}
          unitMode={unitMode}
          onImportJson={handleImportInventario}
          onClearData={() => {
            saveInventarioPerdas(companyId, []);
            setRefreshTrigger(prev => prev + 1);
          }}
          onRestoreOfficial={() => {
            const officialData = buildOfficialInventarioDataset();
            saveInventarioPerdas(companyId, officialData);
            setRefreshTrigger(prev => prev + 1);
          }}
          sampleJsonGenerator={getInventarioPerdasSampleJson}
        />
      )}

      {/* GUIA 6: REFUGO (COM DASHBOARD POWER BI & IMPORTADOR JSON) */}
      {activeTab === 'refugo' && (
        <RefugoPrejuizoView
          items={getStoredRefugoPrejuizo(companyId)}
          companyId={companyId}
          theme={theme}
          unitMode={unitMode}
          onImportJson={handleImportRefugo}
          onClearData={() => {
            saveRefugoPrejuizo(companyId, []);
            setRefreshTrigger(prev => prev + 1);
          }}
          onRestoreOfficial={() => {
            const officialData = buildOfficialRefugoDataset();
            saveRefugoPrejuizo(companyId, officialData);
            setRefreshTrigger(prev => prev + 1);
          }}
          sampleJsonGenerator={getRefugoSampleJson}
        />
      )}

      {/* GUIA 7: VALES (COM PAINEL CONSOLIDADO OFICIAL DA IMAGEM + IMPORTADOR JSON) */}
      {activeTab === 'vales' && (
        <ValesPrejuizoView
          items={getStoredValesPrejuizo(companyId)}
          companyId={companyId}
          theme={theme}
          unitMode={unitMode}
          onImportJson={handleImportVales}
          onClearData={() => {
            saveValesPrejuizo(companyId, []);
            setRefreshTrigger(prev => prev + 1);
          }}
          onRestoreOfficial={() => {
            const officialData = buildOfficialValesDataset();
            saveValesPrejuizo(companyId, officialData);
            setRefreshTrigger(prev => prev + 1);
          }}
          sampleJsonGenerator={getValesSampleJson}
        />
      )}

      {/* GUIA 8: CENTRAL DE IMPORTAÇÕES JSON */}
      {activeTab === 'importacao' && (
        <div className="space-y-6">
          <div className={`p-6 rounded-3xl border ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
                <UploadCloud className="w-6 h-6" />
              </span>
              <div>
                <h2 className="text-xl font-black text-white">Central Unificada de Importação JSON</h2>
                <p className="text-xs text-slate-400">
                  Importe e atualize os arquivos dos 4 módulos externos com persistência automática no sistema.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <JsonImportZone
              titulo="1. Trocas & Reposições"
              descricao="Importar arquivo JSON de trocas e reposições comerciais."
              sampleFileName="modelo_trocas_reposicoes.json"
              sampleJsonGenerator={getTrocasReposicoesSampleJson}
              onImportJson={handleImportTrocas}
              onClearData={() => {
                saveTrocasReposicoes(companyId, []);
                setRefreshTrigger(prev => prev + 1);
              }}
              currentCount={counts.trocas}
              theme={theme}
            />

            <JsonImportZone
              titulo="2. Perdas por Inventário"
              descricao="Importar arquivo JSON de divergências e perdas de contagem física."
              sampleFileName="modelo_perdas_inventario.json"
              sampleJsonGenerator={getInventarioPerdasSampleJson}
              onImportJson={handleImportInventario}
              onClearData={() => {
                saveInventarioPerdas(companyId, []);
                setRefreshTrigger(prev => prev + 1);
              }}
              currentCount={counts.inventario}
              theme={theme}
            />

            <JsonImportZone
              titulo="3. Refugo de Vasilhames & Ativos"
              descricao="Importar arquivo JSON de perdas na triagem e descartes de ativos."
              sampleFileName="modelo_refugo_ativos.json"
              sampleJsonGenerator={getRefugoSampleJson}
              onImportJson={handleImportRefugo}
              onClearData={() => {
                saveRefugoPrejuizo(companyId, []);
                setRefreshTrigger(prev => prev + 1);
              }}
              currentCount={counts.refugo}
              theme={theme}
            />

            <JsonImportZone
              titulo="4. Vales Emitidos"
              descricao="Importar arquivo JSON de vales lançados para colaboradores."
              sampleFileName="modelo_vales_emitidos.json"
              sampleJsonGenerator={getValesSampleJson}
              onImportJson={handleImportVales}
              onClearData={() => {
                saveValesPrejuizo(companyId, []);
                setRefreshTrigger(prev => prev + 1);
              }}
              currentCount={counts.vales}
              theme={theme}
            />
          </div>
        </div>
      )}

    </div>
  );
}
