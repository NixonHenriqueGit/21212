import React, { useState, useMemo } from 'react';
import { 
  BarChart2, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle, 
  ShieldAlert, 
  ShieldCheck,
  Package, 
  Layers, 
  Filter, 
  Search, 
  Sparkles, 
  Download, 
  RefreshCw, 
  Calendar, 
  Grid, 
  ArrowUpDown,
  Info,
  Truck,
  Flame,
  X,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { 
  calcularMatrizAbcLogistica, 
  getMatrizAbcKPIs, 
  getShelfLifeRisco45Dias,
  ShelfLifeRiscoItem,
  MatrizAbcItem 
} from '../utils/matrizAbcUtils';
import { isProdutoCadastrado } from '../utils/productCatalogData';
import { gerarRelatorioCompletoLogisticaPDF } from '../utils/pdfExportUtils';
import { Usuario } from '../types';

interface MatrizAbcLogisticaPanelProps {
  user?: Usuario;
  empresaId?: string;
}

export default function MatrizAbcLogisticaPanel({ user, empresaId = 'demo' }: MatrizAbcLogisticaPanelProps) {
  // Load full dataset
  const rawData = useMemo(() => calcularMatrizAbcLogistica(empresaId), [empresaId]);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrupo, setSelectedGrupo] = useState<string>('todos');
  const [selectedEmbalagem, setSelectedEmbalagem] = useState<string>('todas');
  const [selectedCurva, setSelectedCurva] = useState<string>('todos'); // 'A', 'B', 'C'
  const [selectedCriticidade, setSelectedCriticidade] = useState<string>('todas'); // 'Baixa', 'Média', 'Alta', 'Crítica'
  const [selectedPeriodo, setSelectedPeriodo] = useState<string>('mes_vigente');
  const [filtroShelfLifeRisk, setFiltroShelfLifeRisk] = useState<boolean>(false);
  const [filtroGrafico, setFiltroGrafico] = useState<{ tipo: string; valor: string } | null>(null);

  // Sorting & Pagination State (Default: Maior Faturamento para Menor Faturamento)
  const [sortField, setSortField] = useState<keyof MatrizAbcItem>('vendaValorRS');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // SKU Detail Modal
  const [selectedSkuDetail, setSelectedSkuDetail] = useState<MatrizAbcItem | null>(null);

  // Derived filter options
  const gruposDisponiveis = useMemo(() => Array.from(new Set(rawData.map(d => d.grupo))), [rawData]);
  const embalagensDisponiveis = useMemo(() => Array.from(new Set(rawData.map(d => d.embalagem))), [rawData]);

  // Filtered dataset
  const filteredData = useMemo(() => {
    return rawData.filter(item => {
      const matchesSearch = searchTerm.trim() === '' || 
        String(item.descricao || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        String(item.codigo || '').includes(searchTerm);

      const matchesGrupo = selectedGrupo === 'todos' || item.grupo === selectedGrupo;
      const matchesEmbalagem = selectedEmbalagem === 'todas' || item.embalagem === selectedEmbalagem;
      const matchesCurva = selectedCurva === 'todos' || 
        item.curvaAbcValor === selectedCurva || 
        item.curvaAbcVolume === selectedCurva || 
        item.curvaAbcEstoque === selectedCurva || 
        item.curvaAbcOperacional === selectedCurva;

      const matchesCriticidade = selectedCriticidade === 'todas' || item.criticidade === selectedCriticidade;
      const matchesShelfLife = !filtroShelfLifeRisk || (item.diasParaVencimentoMin <= 45 && item.statusFefo !== 'SemRegistro' && item.estoqueAtualCx > 0);

      let matchesGrafico = true;
      if (filtroGrafico) {
        if (filtroGrafico.tipo === 'curvaValor') matchesGrafico = item.curvaAbcValor === filtroGrafico.valor;
        else if (filtroGrafico.tipo === 'curvaVolume') matchesGrafico = item.curvaAbcVolume === filtroGrafico.valor;
        else if (filtroGrafico.tipo === 'curvaEstoque') matchesGrafico = item.curvaAbcEstoque === filtroGrafico.valor;
        else if (filtroGrafico.tipo === 'curvaOperacional') matchesGrafico = item.curvaAbcOperacional === filtroGrafico.valor;
        else if (filtroGrafico.tipo === 'criticidade') matchesGrafico = item.criticidade === filtroGrafico.valor;
      }

      return matchesSearch && matchesGrupo && matchesEmbalagem && matchesCurva && matchesCriticidade && matchesShelfLife && matchesGrafico;
    });
  }, [rawData, searchTerm, selectedGrupo, selectedEmbalagem, selectedCurva, selectedCriticidade, filtroShelfLifeRisk, filtroGrafico]);

  // Sorted dataset (Garante ordenação padrão do maior para o menor faturamento R$)
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }
      return sortDirection === 'asc' 
        ? String(valA).localeCompare(String(valB)) 
        : String(valB).localeCompare(String(valA));
    });
  }, [filteredData, sortField, sortDirection]);

  // Paginated dataset
  const paginatedData = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return sortedData.slice(startIdx, startIdx + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;

  // Key Indicators (KPIs)
  const kpis = useMemo(() => getMatrizAbcKPIs(filteredData), [filteredData]);

  // Itens com risco de Shelf-Life (< 45 dias de vencimento) puxados do Dashboard de Shelf-Life / Validades
  const shelfLifeRiscoList = useMemo(() => {
    return getShelfLifeRisco45Dias(empresaId);
  }, [empresaId, rawData]);

  // Itens na tabela filtrada que possuem risco de validade <= 45 dias
  const itensRiscoShelfLife = useMemo(() => {
    const setCodigosRisco = new Set(shelfLifeRiscoList.map(s => s.codigo));
    return filteredData.filter(i => 
      (i.estoqueAtualCx > 0 && i.diasParaVencimentoMin <= 45 && i.statusFefo !== 'SemRegistro' && i.diasParaVencimentoMin < 999) ||
      setCodigosRisco.has(i.codigo)
    );
  }, [filteredData, shelfLifeRiscoList]);

  // Valoração financeira total dos itens com menos de 45 dias para vencer
  const valorEstoqueRiscoValidade = useMemo(() => {
    if (shelfLifeRiscoList.length > 0) {
      return shelfLifeRiscoList.reduce((acc, i) => acc + i.valorTotalRS, 0);
    }
    return itensRiscoShelfLife.reduce((acc, i) => acc + i.estoqueValorRS, 0);
  }, [shelfLifeRiscoList, itensRiscoShelfLife]);

  const volumeEstoqueRiscoValidade = useMemo(() => {
    if (shelfLifeRiscoList.length > 0) {
      return shelfLifeRiscoList.reduce((acc, i) => acc + i.quantidadeCx, 0);
    }
    return itensRiscoShelfLife.reduce((acc, i) => acc + i.estoqueAtualCx, 0);
  }, [shelfLifeRiscoList, itensRiscoShelfLife]);

  // Sorting Handler
  const handleSort = (field: keyof MatrizAbcItem) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // CSV Export Handler
  const handleExportCSV = () => {
    const headers = [
      'Código SKU', 'Descrição', 'Grupo', 'Embalagem', 'Fator SKU',
      'Venda Qtd (CX)', 'Venda R$', 'Venda HL', '% Venda R$', '% Acum R$', 'ABC R$', 'ABC Volume',
      'Estoque Atual (CX)', 'Estoque R$', '% Estoque R$', 'Giro Estoque', 'Cobertura (Dias)', 'ABC Estoque',
      'Qtd Picking', 'Freq Picking', 'Qtd Reabastecimento', 'Freq Reabastecimento', 'Score Operacional', 'ABC Operacional',
      'Qtd Quebras', 'Valor Quebras (R$)', '% Quebra', 'Status FEFO', 'Risco Vencimento', 'Criticidade', 'Diagnóstico Final'
    ];

    const rows = sortedData.map(i => [
      i.codigo,
      `"${i.descricao.replace(/"/g, '""')}"`,
      i.grupo,
      i.embalagem,
      i.fator,
      i.vendaQtdCx,
      i.vendaValorRS.toFixed(2),
      i.vendaVolumeHl.toFixed(2),
      i.percentVendaValor.toFixed(2),
      i.percentAcumuladoVendaValor.toFixed(2),
      i.curvaAbcValor,
      i.curvaAbcVolume,
      i.estoqueAtualCx,
      i.estoqueValorRS.toFixed(2),
      i.percentEstoqueValor.toFixed(2),
      i.giroEstoque,
      i.coberturaDias,
      i.curvaAbcEstoque,
      i.qtdPickingCx,
      i.freqPicking,
      i.qtdReabastecimentos,
      i.freqReabastecimento,
      i.scoreImpactoOperacional,
      i.curvaAbcOperacional,
      i.qtdQuebras,
      i.valorQuebrasRS.toFixed(2),
      i.percentQuebra,
      i.statusFefo,
      i.riscoVencimento,
      i.criticidade,
      `"${i.diagnosticoFinal.replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Matriz_ABC_Logistica_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── CHARTS DATA PREPARATION ──

  // 1. Distribuição ABC por Qtd de SKUs (Donut)
  const chartAbcSkusCount = useMemo(() => [
    { name: 'Classe A (Alto Impacto)', value: kpis.skusClasseA, color: '#f59e0b' },
    { name: 'Classe B (Médio Impacto)', value: kpis.skusClasseB, color: '#3b82f6' },
    { name: 'Classe C (Baixo Impacto)', value: kpis.skusClasseC, color: '#64748b' },
  ], [kpis]);

  // 2. Distribuição ABC por Faturamento R$
  const chartAbcFaturamento = useMemo(() => {
    const valA = filteredData.filter(i => i.curvaAbcValor === 'A').reduce((acc, i) => acc + i.vendaValorRS, 0);
    const valB = filteredData.filter(i => i.curvaAbcValor === 'B').reduce((acc, i) => acc + i.vendaValorRS, 0);
    const valC = filteredData.filter(i => i.curvaAbcValor === 'C').reduce((acc, i) => acc + i.vendaValorRS, 0);
    return [
      { classe: 'Classe A', valor: valA, color: '#f59e0b' },
      { classe: 'Classe B', valor: valB, color: '#3b82f6' },
      { classe: 'Classe C', valor: valC, color: '#64748b' },
    ];
  }, [filteredData]);

  // 3. Distribuição ABC por Estoque Financeiro R$
  const chartAbcEstoqueRS = useMemo(() => {
    const valA = filteredData.filter(i => i.curvaAbcEstoque === 'A').reduce((acc, i) => acc + i.estoqueValorRS, 0);
    const valB = filteredData.filter(i => i.curvaAbcEstoque === 'B').reduce((acc, i) => acc + i.estoqueValorRS, 0);
    const valC = filteredData.filter(i => i.curvaAbcEstoque === 'C').reduce((acc, i) => acc + i.estoqueValorRS, 0);
    return [
      { classe: 'Classe A', valor: valA, color: '#10b981' },
      { classe: 'Classe B', valor: valB, color: '#06b6d4' },
      { classe: 'Classe C', valor: valC, color: '#64748b' },
    ];
  }, [filteredData]);

  // 4. Distribuição ABC por Movimentação Operacional
  const chartAbcOperacional = useMemo(() => {
    const opA = filteredData.filter(i => i.curvaAbcOperacional === 'A').reduce((acc, i) => acc + i.scoreImpactoOperacional, 0);
    const opB = filteredData.filter(i => i.curvaAbcOperacional === 'B').reduce((acc, i) => acc + i.scoreImpactoOperacional, 0);
    const opC = filteredData.filter(i => i.curvaAbcOperacional === 'C').reduce((acc, i) => acc + i.scoreImpactoOperacional, 0);
    return [
      { classe: 'Classe A', valor: opA, color: '#8b5cf6' },
      { classe: 'Classe B', valor: opB, color: '#ec4899' },
      { classe: 'Classe C', valor: opC, color: '#64748b' },
    ];
  }, [filteredData]);

  // 5. Top 10 SKUs por Faturamento R$ (03.05.19 - Apenas Produtos Cadastrados na Plataforma)
  const top10Faturamento = useMemo(() => {
    return [...filteredData]
      .filter(i => isProdutoCadastrado(i.codigo, empresaId) && i.vendaValorRS > 0)
      .sort((a, b) => b.vendaValorRS - a.vendaValorRS)
      .slice(0, 10)
      .map(i => ({
        nome: i.descricao.length > 20 ? i.descricao.substring(0, 18) + '...' : i.descricao,
        valor: i.vendaValorRS
      }));
  }, [filteredData, empresaId]);

  // 6. Top 10 SKUs por Estoque Financeiro R$
  const top10EstoqueFinanceiro = useMemo(() => {
    return [...filteredData]
      .filter(i => isProdutoCadastrado(i.codigo, empresaId))
      .sort((a, b) => b.estoqueValorRS - a.estoqueValorRS)
      .slice(0, 10)
      .map(i => ({
        nome: i.descricao.length > 20 ? i.descricao.substring(0, 18) + '...' : i.descricao,
        valor: i.estoqueValorRS
      }));
  }, [filteredData, empresaId]);

  // 7. Top 10 SKUs por Movimentação (Volume Qtd)
  const top10Volume = useMemo(() => {
    return [...filteredData]
      .filter(i => isProdutoCadastrado(i.codigo, empresaId))
      .sort((a, b) => b.vendaQtdCx - a.vendaQtdCx)
      .slice(0, 10)
      .map(i => ({
        nome: i.descricao.length > 20 ? i.descricao.substring(0, 18) + '...' : i.descricao,
        valor: i.vendaQtdCx
      }));
  }, [filteredData, empresaId]);

  // 8. Produtos com Maior Número de Reabastecimentos
  const top10Reabastecimentos = useMemo(() => {
    return [...filteredData]
      .filter(i => isProdutoCadastrado(i.codigo, empresaId))
      .sort((a, b) => b.qtdReabastecimentos - a.qtdReabastecimentos)
      .slice(0, 10)
      .map(i => ({
        nome: i.descricao.length > 20 ? i.descricao.substring(0, 18) + '...' : i.descricao,
        valor: i.qtdReabastecimentos
      }));
  }, [filteredData, empresaId]);

  // 9. Produtos com Maior Risco de Vencimento FEFO / Shelf-Life (< 45 dias - Valoração R$)
  const top10RiscoVencimento = useMemo(() => {
    if (shelfLifeRiscoList.length > 0) {
      return shelfLifeRiscoList
        .filter(i => isProdutoCadastrado(i.codigo, empresaId))
        .slice(0, 10)
        .map(i => ({
          nome: i.descricao.length > 20 ? i.descricao.substring(0, 18) + '...' : i.descricao,
          nomeCompleto: i.descricao,
          valor: i.valorTotalRS,
          dias: i.diasParaVencer,
          caixas: i.quantidadeCx,
          status: i.status
        }));
    }

    return [...filteredData]
      .filter(i => isProdutoCadastrado(i.codigo, empresaId) && i.estoqueAtualCx > 0 && i.statusFefo !== 'SemRegistro' && i.diasParaVencimentoMin <= 45)
      .sort((a, b) => b.estoqueValorRS - a.estoqueValorRS)
      .slice(0, 10)
      .map(i => ({
        nome: i.descricao.length > 20 ? i.descricao.substring(0, 18) + '...' : i.descricao,
        nomeCompleto: i.descricao,
        valor: i.estoqueValorRS,
        dias: i.diasParaVencimentoMin,
        caixas: i.estoqueAtualCx,
        status: i.statusFefo
      }));
  }, [shelfLifeRiscoList, filteredData, empresaId]);

  // 10. Produtos com Maior Índice / Valor de Quebras
  const top10Quebras = useMemo(() => {
    return [...filteredData]
      .filter(i => isProdutoCadastrado(i.codigo, empresaId) && i.valorQuebrasRS > 0)
      .sort((a, b) => b.valorQuebrasRS - a.valorQuebrasRS)
      .slice(0, 10)
      .map(i => ({
        nome: i.descricao.length > 20 ? i.descricao.substring(0, 18) + '...' : i.descricao,
        valor: i.valorQuebrasRS
      }));
  }, [filteredData, empresaId]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ── HEADER BANNER ── */}
      <div className="bg-gradient-to-r from-[#032b5e] via-[#0b3c7d] to-[#1e56f0] rounded-2xl p-6 text-white shadow-xl border border-blue-900/40 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20 flex items-center gap-1.5 w-max">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Matriz ABC Logística & Inteligência Estratégica
          </span>
          <h2 className="text-2xl font-black tracking-tight mt-2 flex items-center gap-2">
            Matriz ABC Multidimensão (Financeiro • Volume • Estoque • Operacional)
          </h2>
          <p className="text-xs text-blue-100/90 font-medium mt-1 max-w-4xl">
            Visão consolidada do catálogo com 4 classificações ABC independentes. Avalie faturamento, consumo de área, custo de imobilização de estoque e esforço operacional de picking/reabastecimento sem dados fictícios.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-matriz-exportar-relatorio-pdf"
            onClick={() => {
              gerarRelatorioCompletoLogisticaPDF(empresaId, 'CDD Guarabira', user?.nome || 'Gestor Logístico');
            }}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2 border border-blue-400/40"
            title="Exportar Relatório Integrado em PDF com Capacidade, Política e Matriz"
          >
            <FileText className="w-4 h-4 text-blue-200" /> Exportar Relatório (PDF)
          </button>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Exportar Relatório Excel (.CSV)
          </button>
        </div>
      </div>

      {/* ── CARDS / KPIS SUPERIORES (13 INDICADORES) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* KPI 1: Total SKUs */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Total SKUs</span>
            <Package className="w-4 h-4 text-[#1e56f0]" />
          </div>
          <div className="mt-2">
            <span className="text-xl font-black font-mono text-slate-900">{kpis.totalSkus}</span>
            <span className="text-[10px] font-extrabold text-slate-400 block mt-0.5">Ativos no Catálogo</span>
          </div>
        </div>

        {/* KPI 2: SKUs Classe A */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs flex flex-col justify-between border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between text-amber-800">
            <span className="text-[10px] font-black uppercase tracking-wider">SKUs Classe A</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2">
            <span className="text-xl font-black font-mono text-amber-950">{kpis.skusClasseA}</span>
            <span className="text-[10px] font-extrabold text-amber-700 block mt-0.5">{kpis.percentFaturamentoClasseA}% do Faturamento</span>
          </div>
        </div>

        {/* KPI 3: SKUs Classe B */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs flex flex-col justify-between border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between text-blue-800">
            <span className="text-[10px] font-black uppercase tracking-wider">SKUs Classe B</span>
            <Layers className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2">
            <span className="text-xl font-black font-mono text-blue-950">{kpis.skusClasseB}</span>
            <span className="text-[10px] font-extrabold text-blue-700 block mt-0.5">Faturamento Intermediário</span>
          </div>
        </div>

        {/* KPI 4: SKUs Classe C */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs flex flex-col justify-between border-l-4 border-l-slate-400">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-black uppercase tracking-wider">SKUs Classe C</span>
            <Grid className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2">
            <span className="text-xl font-black font-mono text-slate-800">{kpis.skusClasseC}</span>
            <span className="text-[10px] font-extrabold text-slate-400 block mt-0.5">Cauda Longa / Baixo Giro</span>
          </div>
        </div>

        {/* KPI 5: Valor Total em Estoque */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs flex flex-col justify-between border-l-4 border-l-emerald-600">
          <div className="flex items-center justify-between text-emerald-800">
            <span className="text-[10px] font-black uppercase tracking-wider">Valor em Estoque</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2">
            <span className="text-base font-black font-mono text-emerald-950">
              R$ {kpis.valorTotalEstoque.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
            </span>
            <span className="text-[10px] font-extrabold text-emerald-700 block mt-0.5">
              Classe A: R$ {kpis.valorEstoqueClasseA.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>

        {/* KPI 6: Cobertura & Giro Médio */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs flex flex-col justify-between border-l-4 border-l-indigo-600">
          <div className="flex items-center justify-between text-indigo-800">
            <span className="text-[10px] font-black uppercase tracking-wider">Cobertura & Giro</span>
            <Calendar className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2">
            <span className="text-xl font-black font-mono text-indigo-950">{kpis.coberturaMediaDias}d</span>
            <span className="text-[10px] font-extrabold text-indigo-700 block mt-0.5">Giro Médio: {kpis.giroMedioEstoque}x/mês</span>
          </div>
        </div>

        {/* KPI 7: Movimentações Operacionais */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs flex flex-col justify-between border-l-4 border-l-purple-600">
          <div className="flex items-center justify-between text-purple-800">
            <span className="text-[10px] font-black uppercase tracking-wider">Esforço Operacional</span>
            <Truck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2">
            <span className="text-lg font-black font-mono text-purple-950">
              {kpis.totalPalletsMovimentados.toLocaleString('pt-BR')} pal
            </span>
            <span className="text-[10px] font-extrabold text-purple-700 block mt-0.5">
              Ressuprimento: {kpis.palletsRessuprimentoTotal.toLocaleString('pt-BR')} • Reabastecimento: {kpis.palletsReabastecimentoTotal.toLocaleString('pt-BR')}
            </span>
          </div>
        </div>

        {/* KPI 8: Valor de Quebras */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs flex flex-col justify-between border-l-4 border-l-rose-600">
          <div className="flex items-center justify-between text-rose-800">
            <span className="text-[10px] font-black uppercase tracking-wider">Volume & Custo Quebras</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2">
            <span className="text-base font-black font-mono text-rose-950">
              R$ {kpis.valorTotalQuebras.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] font-extrabold text-rose-700 block mt-0.5">
              {kpis.volumeTotalQuebrasCx.toLocaleString('pt-BR')} caixas avariadas
            </span>
          </div>
        </div>

        {/* KPI 9: Risco de Vencimento FEFO / Shelf-Life (< 45 dias) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs flex flex-col justify-between border-l-4 border-l-orange-500">
          <div className="flex items-center justify-between text-orange-800">
            <span className="text-[10px] font-black uppercase tracking-wider">Risco Shelf-Life (&lt; 45d)</span>
            <ShieldAlert className="w-4 h-4 text-orange-500" />
          </div>
          <div className="mt-2">
            <span className="text-xl font-black font-mono text-orange-950">
              {itensRiscoShelfLife.length} SKUs
            </span>
            <span className="text-[10px] font-extrabold text-orange-700 block mt-0.5">
              R$ {valorEstoqueRiscoValidade.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} • {volumeEstoqueRiscoValidade.toLocaleString('pt-BR')} cx em risco
            </span>
          </div>
        </div>
      </div>

      {/* ── BARRA DE FILTROS INTEGRAIS ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-4 h-4 text-[#1e56f0]" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Filtros da Matriz ABC Logística
            </h3>
            <span className="text-[10px] font-bold px-2.5 py-0.5 bg-blue-50 text-[#1e56f0] rounded-full border border-blue-100">
              {filteredData.length} SKUs filtrados
            </span>
            {filtroGrafico && (
              <span className="text-[10px] font-bold px-2.5 py-0.5 bg-amber-100 text-amber-900 rounded-full border border-amber-300 flex items-center gap-1">
                Filtro de Gráfico: {filtroGrafico.tipo} = {filtroGrafico.valor}
                <button onClick={() => setFiltroGrafico(null)} className="ml-1 text-slate-500 hover:text-black">✕</button>
              </span>
            )}
            {/* Quick Filter: Risco Shelf-Life < 45d */}
            <button
              onClick={() => setFiltroShelfLifeRisk(prev => !prev)}
              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                filtroShelfLifeRisk
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'bg-orange-50 hover:bg-orange-100 text-orange-900 border border-orange-200'
              }`}
              title="Filtrar apenas itens com estoque ativo e menos de 45 dias para o vencimento"
            >
              <ShieldAlert className="w-3 h-3" />
              {filtroShelfLifeRisk ? 'Exibindo Risco < 45d (Ativo)' : `Filtrar Risco Shelf-Life < 45d (${itensRiscoShelfLife.length})`}
            </button>
          </div>

          <button 
            onClick={() => {
              setSearchTerm('');
              setSelectedGrupo('todos');
              setSelectedEmbalagem('todas');
              setSelectedCurva('todos');
              setSelectedCriticidade('todas');
              setSelectedPeriodo('mes_vigente');
              setFiltroShelfLifeRisk(false);
              setFiltroGrafico(null);
            }}
            className="text-[11px] font-bold text-[#1e56f0] hover:text-blue-800 hover:underline cursor-pointer flex items-center gap-1.5"
          >
            <RefreshCw className="w-3 h-3" /> Limpar Todos os Filtros
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
          {/* Busca SKU */}
          <div className="space-y-1">
            <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider">Busca SKU / Descrição</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Código ou nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#1e56f0]"
              />
            </div>
          </div>

          {/* Grupo */}
          <div className="space-y-1">
            <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider">Grupo / Família</label>
            <select
              value={selectedGrupo}
              onChange={(e) => setSelectedGrupo(e.target.value)}
              className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
            >
              <option value="todos">Todos os Grupos</option>
              {gruposDisponiveis.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Embalagem */}
          <div className="space-y-1">
            <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider">Embalagem</label>
            <select
              value={selectedEmbalagem}
              onChange={(e) => setSelectedEmbalagem(e.target.value)}
              className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
            >
              <option value="todas">Todas as Embalagens</option>
              {embalagensDisponiveis.map(emb => (
                <option key={emb} value={emb}>{emb}</option>
              ))}
            </select>
          </div>

          {/* Curva ABC */}
          <div className="space-y-1">
            <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider">Curva ABC</label>
            <select
              value={selectedCurva}
              onChange={(e) => setSelectedCurva(e.target.value)}
              className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
            >
              <option value="todos">Todas as Curvas (A, B, C)</option>
              <option value="A">Curva A</option>
              <option value="B">Curva B</option>
              <option value="C">Curva C</option>
            </select>
          </div>

          {/* Criticidade */}
          <div className="space-y-1">
            <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider">Criticidade Logística</label>
            <select
              value={selectedCriticidade}
              onChange={(e) => setSelectedCriticidade(e.target.value)}
              className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
            >
              <option value="todas">Todas as Criticidades</option>
              <option value="Crítica">🔴 Crítica</option>
              <option value="Alta">🟠 Alta</option>
              <option value="Média">🟡 Média</option>
              <option value="Baixa">🟢 Baixa</option>
            </select>
          </div>

          {/* Período */}
          <div className="space-y-1">
            <label className="block text-[10px] font-black uppercase text-slate-500 tracking-wider">Período de Análise</label>
            <select
              value={selectedPeriodo}
              onChange={(e) => setSelectedPeriodo(e.target.value)}
              className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
            >
              <option value="mes_vigente">Mês Vigente (Base Real)</option>
              <option value="ultimo_trimestre">Último Trimestre (Média)</option>
              <option value="ano_2026">Ano 2026 Acumulado</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── 10 PAINÉIS DE GRÁFICOS ANALÍTICOS (REQUISITO 7) ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-[#1e56f0]" />
            10 Visualizações Gráficas da Matriz ABC Logística
          </h3>
          <span className="text-[11px] text-slate-500 font-bold">
            Clique nos segmentos dos gráficos para filtrar a análise interativa
          </span>
        </div>

        {/* LINHA 1 DE GRÁFICOS: DISTRIBUIÇÕES ABC */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Gráfico 1: Distribuição ABC por SKUs */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <h4 className="text-xs font-black uppercase tracking-tight text-slate-800 mb-1">
              1. Distribuição SKUs por Curva
            </h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartAbcSkusCount}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                    onClick={(entry) => {
                      const nameStr = String(entry?.name || '');
                      const letter = nameStr.includes('A') ? 'A' : nameStr.includes('B') ? 'B' : 'C';
                      setSelectedCurva(letter);
                    }}
                  >
                    {chartAbcSkusCount.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} className="cursor-pointer" />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any) => [`${v} SKUs`, 'Quantidade']} />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico 2: Distribuição por Faturamento */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <h4 className="text-xs font-black uppercase tracking-tight text-slate-800 mb-1">
              2. Faturamento R$ por Curva
            </h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartAbcFaturamento} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="classe" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip formatter={(v: any) => [`R$ ${Number(v).toLocaleString('pt-BR')}`, 'Faturamento']} />
                  <Bar 
                    dataKey="valor" 
                    fill="#f59e0b" 
                    radius={[6, 6, 0, 0]} 
                    className="cursor-pointer"
                    onClick={(data: any) => data?.classe && setFiltroGrafico({ tipo: 'curvaValor', valor: String(data.classe).replace('Classe ', '') })}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico 3: Distribuição por Estoque Financeiro */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <h4 className="text-xs font-black uppercase tracking-tight text-slate-800 mb-1">
              3. Estoque R$ por Curva
            </h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartAbcEstoqueRS} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="classe" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip formatter={(v: any) => [`R$ ${Number(v).toLocaleString('pt-BR')}`, 'Estoque R$']} />
                  <Bar 
                    dataKey="valor" 
                    fill="#10b981" 
                    radius={[6, 6, 0, 0]} 
                    className="cursor-pointer"
                    onClick={(data: any) => data?.classe && setFiltroGrafico({ tipo: 'curvaEstoque', valor: String(data.classe).replace('Classe ', '') })}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico 4: Distribuição por Movimentação Operacional */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <h4 className="text-xs font-black uppercase tracking-tight text-slate-800 mb-1">
              4. Impacto Operacional por Curva
            </h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartAbcOperacional} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="classe" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip formatter={(v: any) => [`${v} pts`, 'Score Operacional']} />
                  <Bar 
                    dataKey="valor" 
                    fill="#8b5cf6" 
                    radius={[6, 6, 0, 0]} 
                    className="cursor-pointer"
                    onClick={(data: any) => data?.classe && setFiltroGrafico({ tipo: 'curvaOperacional', valor: String(data.classe).replace('Classe ', '') })}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* LINHA 2 DE GRÁFICOS: TOP 10 RANKINGS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Gráfico 5: Top 10 Faturamento */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <h4 className="text-xs font-black uppercase tracking-tight text-slate-800 mb-1">
              5. Top 10 SKUs por Faturamento (R$)
            </h4>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={top10Faturamento} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 8 }} />
                  <YAxis dataKey="nome" type="category" tick={{ fontSize: 8, fontWeight: 'bold' }} width={100} />
                  <Tooltip formatter={(v: any) => [`R$ ${Number(v).toLocaleString('pt-BR')}`, 'Faturamento']} />
                  <Bar dataKey="valor" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico 6: Top 10 Estoque Financeiro */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <h4 className="text-xs font-black uppercase tracking-tight text-slate-800 mb-1">
              6. Top 10 SKUs em Estoque (R$)
            </h4>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={top10EstoqueFinanceiro} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 8 }} />
                  <YAxis dataKey="nome" type="category" tick={{ fontSize: 8, fontWeight: 'bold' }} width={100} />
                  <Tooltip formatter={(v: any) => [`R$ ${Number(v).toLocaleString('pt-BR')}`, 'Estoque R$']} />
                  <Bar dataKey="valor" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico 7: Top 10 Movimentação / Volume */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <h4 className="text-xs font-black uppercase tracking-tight text-slate-800 mb-1">
              7. Top 10 SKUs por Volume (CX)
            </h4>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={top10Volume} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 8 }} />
                  <YAxis dataKey="nome" type="category" tick={{ fontSize: 8, fontWeight: 'bold' }} width={100} />
                  <Tooltip formatter={(v: any) => [`${Number(v).toLocaleString('pt-BR')} cx`, 'Volume Venda']} />
                  <Bar dataKey="valor" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* LINHA 3 DE GRÁFICOS: OPERAÇÃO E QUALIDADE */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Gráfico 8: Produtos com Maior Número de Reabastecimentos */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <h4 className="text-xs font-black uppercase tracking-tight text-slate-800 mb-1">
              8. Maior Frequência de Reabastecimento
            </h4>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={top10Reabastecimentos} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 8 }} />
                  <YAxis dataKey="nome" type="category" tick={{ fontSize: 8, fontWeight: 'bold' }} width={100} />
                  <Tooltip formatter={(v: any) => [`${v} reabastecimentos`, 'Qtd Reabast.']} />
                  <Bar dataKey="valor" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico 9: Produtos com Maior Risco de Vencimento FEFO / Shelf-Life */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-xs font-black uppercase tracking-tight text-slate-800">
                9. Maior Risco Shelf-Life (&lt; 45d) — Valoração
              </h4>
              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-orange-50 text-orange-800 rounded border border-orange-200">
                FEFO &lt; 45d
              </span>
            </div>
            <div className="h-56">
              {top10RiscoVencimento.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={top10RiscoVencimento} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 8 }} />
                    <YAxis dataKey="nome" type="category" tick={{ fontSize: 8, fontWeight: 'bold' }} width={100} />
                    <Tooltip 
                      formatter={(v: any, name: any, item: any) => {
                        const p = item?.payload;
                        return [
                          `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} • ${p?.dias ?? 0}d p/ vencer (${p?.caixas ?? 0} cx)`,
                          'Valoração em Risco'
                        ];
                      }} 
                    />
                    <Bar dataKey="valor" fill="#f97316" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <ShieldCheck className="w-8 h-8 text-emerald-500 mb-1" />
                  <span className="text-xs font-bold text-slate-700">Nenhum SKU com risco de vencimento &lt; 45 dias</span>
                  <span className="text-[10px] text-slate-500">Lotes do estoque físico em conformidade com prazo seguro de shelf-life.</span>
                </div>
              )}
            </div>
          </div>

          {/* Gráfico 10: Produtos com Maior Valor de Quebras */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <h4 className="text-xs font-black uppercase tracking-tight text-slate-800 mb-1">
              10. Maior Perda em Quebras (R$)
            </h4>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={top10Quebras} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 8 }} />
                  <YAxis dataKey="nome" type="category" tick={{ fontSize: 8, fontWeight: 'bold' }} width={100} />
                  <Tooltip formatter={(v: any) => [`R$ ${Number(v).toLocaleString('pt-BR')}`, 'Valor Quebra']} />
                  <Bar dataKey="valor" fill="#ef4444" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ── TABELA INTERATIVA DA MATRIZ ABC LOGÍSTICA (REQUISITOS 1, 3, 8, 9) ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-4 gap-3">
          <div>
            <h3 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-[#1e56f0]" />
              Matriz ABC Logística — Tabela Consolidada de SKUs
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Exibição de todos os indicadores de identificação, movimentação, estoque, operação, qualidade e classificação final.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500">Exibir por página:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="py-1 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
            >
              <option value={10}>10 SKUs</option>
              <option value={15}>15 SKUs</option>
              <option value={30}>30 SKUs</option>
              <option value={50}>50 SKUs</option>
              <option value={100}>100 SKUs</option>
            </select>
          </div>
        </div>

        {/* CONTAINER DA TABELA COM ROLAGEM HORIZONTAL E ROLAGEM VERTICAL LIMPA (SEM CORTAR INFORMAÇÃO) */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl relative max-h-[650px] overflow-y-auto">
          <table className="w-full text-left text-xs min-w-[1900px]">
            <thead className="bg-slate-900 text-slate-200 font-black uppercase text-[10px] tracking-wider sticky top-0 z-20">
              <tr>
                {/* STICKY LEFT COLUMNS FOR IDENTIFICATION */}
                <th className="py-3 px-3 sticky left-0 bg-slate-900 z-30 shadow-md w-24">
                  <button onClick={() => handleSort('codigo')} className="flex items-center gap-1 hover:text-amber-400">
                    SKU <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-3 sticky left-[96px] bg-slate-900 z-30 shadow-md min-w-[200px]">
                  <button onClick={() => handleSort('descricao')} className="flex items-center gap-1 hover:text-amber-400">
                    Descrição do Produto <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-3">Grupo</th>
                <th className="py-3 px-3">Emb.</th>
                <th className="py-3 px-3 text-right">Fator</th>

                {/* MOVIMENTAÇÃO */}
                <th className="py-3 px-3 text-right text-amber-300">
                  <button onClick={() => handleSort('vendaQtdCx')} className="flex items-center gap-1 justify-end w-full hover:text-amber-400">
                    Venda (CX) <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-3 text-right text-amber-300">
                  <button onClick={() => handleSort('vendaValorRS')} className="flex items-center gap-1 justify-end w-full hover:text-amber-400">
                    Venda (R$) <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-3 text-right text-amber-300">Venda HL</th>
                <th className="py-3 px-3 text-center text-amber-300">% Venda</th>
                <th className="py-3 px-3 text-center text-amber-300">% Acum</th>
                <th className="py-3 px-3 text-center text-amber-300">ABC R$</th>
                <th className="py-3 px-3 text-center text-amber-300">ABC Vol</th>

                {/* ESTOQUE */}
                <th className="py-3 px-3 text-right text-emerald-300">
                  <button onClick={() => handleSort('estoqueAtualCx')} className="flex items-center gap-1 justify-end w-full hover:text-emerald-400">
                    Estoque (CX) <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-3 text-right text-emerald-300">
                  <button onClick={() => handleSort('estoqueValorRS')} className="flex items-center gap-1 justify-end w-full hover:text-emerald-400">
                    Estoque (R$) <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-3 text-center text-emerald-300">Giro</th>
                <th className="py-3 px-3 text-center text-emerald-300">
                  <button onClick={() => handleSort('coberturaDias')} className="flex items-center gap-1 justify-center w-full hover:text-emerald-400">
                    Cobertura <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-3 text-center text-emerald-300">ABC Est.</th>

                {/* OPERAÇÃO */}
                <th className="py-3 px-3 text-right text-purple-300">Ressupr. (Pal)</th>
                <th className="py-3 px-3 text-right text-purple-300">Reabast. (Pal)</th>
                <th className="py-3 px-3 text-center text-purple-300">Total Pallets</th>
                <th className="py-3 px-3 text-center text-purple-300">ABC Op.</th>

                {/* QUALIDADE */}
                <th className="py-3 px-3 text-right text-rose-300">Quebras (Cx / R$)</th>
                <th className="py-3 px-3 text-center text-orange-300">Status FEFO</th>

                {/* CLASSIFICAÇÃO FINAL */}
                <th className="py-3 px-3 text-center text-sky-300">Criticidade</th>
                <th className="py-3 px-3 min-w-[220px]">Diagnóstico Final</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={26} className="py-12 text-center text-slate-400 font-bold">
                    Nenhum produto atende aos filtros selecionados.
                  </td>
                </tr>
              ) : (
                paginatedData.map((row) => (
                  <tr 
                    key={row.codigo} 
                    onClick={() => setSelectedSkuDetail(row)}
                    className="hover:bg-blue-50/50 transition-all cursor-pointer"
                  >
                    {/* STICKY LEFT COLUMNS */}
                    <td className="py-3 px-3 font-mono font-extrabold text-slate-900 sticky left-0 bg-white z-10 shadow-xs">
                      {row.codigo}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900 sticky left-[96px] bg-white z-10 shadow-xs">
                      {row.descricao}
                      <span className="block text-[10px] text-slate-400 font-normal">{row.marca}</span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px] font-black border border-slate-200">
                        {row.grupo}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[11px] font-semibold text-slate-600">{row.embalagem}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-700">{row.fator}</td>

                    {/* MOVIMENTAÇÃO */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">{row.vendaQtdCx.toLocaleString('pt-BR')}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-amber-900">
                      R$ {row.vendaValorRS.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600">{row.vendaVolumeHl.toFixed(1)}</td>
                    <td className="py-3 px-3 text-center font-mono text-slate-600">{row.percentVendaValor}%</td>
                    <td className="py-3 px-3 text-center font-mono text-slate-500">{row.percentAcumuladoVendaValor}%</td>

                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                        row.curvaAbcValor === 'A' ? 'bg-amber-100 text-amber-900 border-amber-300' :
                        row.curvaAbcValor === 'B' ? 'bg-blue-100 text-blue-900 border-blue-300' :
                        'bg-slate-100 text-slate-700 border-slate-300'
                      }`}>
                        {row.curvaAbcValor}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                        row.curvaAbcVolume === 'A' ? 'bg-amber-100 text-amber-900 border-amber-300' :
                        row.curvaAbcVolume === 'B' ? 'bg-blue-100 text-blue-900 border-blue-300' :
                        'bg-slate-100 text-slate-700 border-slate-300'
                      }`}>
                        {row.curvaAbcVolume}
                      </span>
                    </td>

                    {/* ESTOQUE */}
                    <td className="py-3 px-3 text-right font-mono font-extrabold text-slate-900">
                      {row.estoqueAtualCx.toLocaleString('pt-BR')} cx
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-900">
                      R$ {row.estoqueValorRS.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-700">{row.giroEstoque}x</td>
                    <td className="py-3 px-3 text-center font-mono">
                      <span className={`px-2 py-0.5 rounded font-black text-[10px] ${
                        row.coberturaDias === 0 ? 'bg-rose-100 text-rose-800' :
                        row.coberturaDias < 3 ? 'bg-amber-100 text-amber-800' :
                        row.coberturaDias > 8 ? 'bg-purple-100 text-purple-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {row.coberturaDias}d
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                        row.curvaAbcEstoque === 'A' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' :
                        row.curvaAbcEstoque === 'B' ? 'bg-teal-100 text-teal-900 border-teal-300' :
                        'bg-slate-100 text-slate-700 border-slate-300'
                      }`}>
                        {row.curvaAbcEstoque}
                      </span>
                    </td>

                    {/* OPERAÇÃO */}
                    <td className="py-3 px-3 text-right font-mono text-slate-700">{row.palletsRessuprimento} pal</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-700">{row.palletsReabastecimento} pal</td>
                    <td className="py-3 px-3 text-center font-mono font-black text-purple-900">{row.totalPalletsMovimentados} pal</td>

                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                        row.curvaAbcOperacional === 'A' ? 'bg-purple-100 text-purple-900 border-purple-300' :
                        row.curvaAbcOperacional === 'B' ? 'bg-pink-100 text-pink-900 border-pink-300' :
                        'bg-slate-100 text-slate-700 border-slate-300'
                      }`}>
                        {row.curvaAbcOperacional}
                      </span>
                    </td>

                    {/* QUALIDADE */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-rose-900">
                      {row.qtdQuebras > 0 ? (
                        <span>
                          {row.qtdQuebras} cx <span className="text-[10px] text-rose-600 block">(R$ {row.valorQuebrasRS.toFixed(2)})</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">0 cx</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-[10px]">
                      {row.statusFefo === 'SemRegistro' || row.diasParaVencimentoMin >= 999 ? (
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-medium">
                          Sem Lote
                        </span>
                      ) : (
                        <span className={`px-2 py-0.5 rounded font-mono font-black ${
                          row.diasParaVencimentoMin <= 0 ? 'bg-rose-600 text-white font-black' :
                          row.diasParaVencimentoMin <= 15 ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                          row.diasParaVencimentoMin <= 45 ? 'bg-orange-100 text-orange-900 border border-orange-300 font-black shadow-xs' :
                          row.diasParaVencimentoMin <= 60 ? 'bg-amber-100 text-amber-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}
                        title={`${row.diasParaVencimentoMin} dias restantes para o vencimento (${row.statusFefo})`}>
                          {row.diasParaVencimentoMin}d {row.diasParaVencimentoMin <= 45 ? '⚠️ (<45d)' : `(${row.statusFefo})`}
                        </span>
                      )}
                    </td>

                    {/* CLASSIFICAÇÃO FINAL */}
                    <td className="py-3 px-3 text-center font-extrabold text-[11px]">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider ${
                        row.criticidade === 'Crítica' ? 'bg-rose-600 text-white font-black shadow-xs' :
                        row.criticidade === 'Alta' ? 'bg-orange-500 text-white font-black' :
                        row.criticidade === 'Média' ? 'bg-amber-400 text-slate-950 font-black' :
                        'bg-emerald-100 text-emerald-900 font-bold'
                      }`}>
                        {row.criticidade}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-medium text-slate-700 text-[11px]">
                      {row.diagnosticoFinal}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* CONTROLES DE PAGINAÇÃO */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <span className="text-xs text-slate-500 font-bold">
            Mostrando {paginatedData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} até {Math.min(currentPage * pageSize, sortedData.length)} de {sortedData.length} SKUs
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-800 font-bold text-xs rounded-lg transition-all cursor-pointer"
            >
              ◄ Anterior
            </button>
            <span className="text-xs font-black text-slate-900 px-2">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-800 font-bold text-xs rounded-lg transition-all cursor-pointer"
            >
              Próxima ►
            </button>
          </div>
        </div>
      </div>

      {/* ── MODAL DE DETALHAMENTO DO SKU SELECIONADO ── */}
      {selectedSkuDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-[#1e56f0] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                  Ficha do Produto • SKU #{selectedSkuDetail.codigo}
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  {selectedSkuDetail.descricao}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedSkuDetail.grupo} • {selectedSkuDetail.marca} • Embalagem: {selectedSkuDetail.embalagem} (Fator {selectedSkuDetail.fator})
                </p>
              </div>

              <button
                onClick={() => setSelectedSkuDetail(null)}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* QUADRO DE CURVAS ABC */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl border border-amber-200 bg-amber-50">
                <span className="text-[10px] font-black uppercase text-amber-800 block">ABC Faturamento</span>
                <span className="text-2xl font-black text-amber-950 font-mono">Curva {selectedSkuDetail.curvaAbcValor}</span>
                <span className="text-[10px] font-bold text-amber-700 block mt-1">{selectedSkuDetail.percentVendaValor}% do Total</span>
              </div>

              <div className="p-3 rounded-xl border border-blue-200 bg-blue-50">
                <span className="text-[10px] font-black uppercase text-blue-800 block">ABC Volume</span>
                <span className="text-2xl font-black text-blue-950 font-mono">Curva {selectedSkuDetail.curvaAbcVolume}</span>
                <span className="text-[10px] font-bold text-blue-700 block mt-1">{selectedSkuDetail.percentVendaVolume}% do Total</span>
              </div>

              <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50">
                <span className="text-[10px] font-black uppercase text-emerald-800 block">ABC Estoque</span>
                <span className="text-2xl font-black text-emerald-950 font-mono">Curva {selectedSkuDetail.curvaAbcEstoque}</span>
                <span className="text-[10px] font-bold text-emerald-700 block mt-1">{selectedSkuDetail.percentEstoqueValor}% do Total</span>
              </div>

              <div className="p-3 rounded-xl border border-purple-200 bg-purple-50">
                <span className="text-[10px] font-black uppercase text-purple-800 block">ABC Operacional</span>
                <span className="text-2xl font-black text-purple-950 font-mono">Curva {selectedSkuDetail.curvaAbcOperacional}</span>
                <span className="text-[10px] font-bold text-purple-700 block mt-1">{selectedSkuDetail.scoreImpactoOperacional} Pts Operação</span>
              </div>
            </div>

            {/* DETALHES DAS 4 DIMENSÕES */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-black text-slate-900 uppercase text-[11px] border-b pb-1">1. Movimentação e Vendas</h4>
                <div className="flex justify-between"><span>Venda Mensal:</span><span className="font-mono font-bold">{selectedSkuDetail.vendaQtdCx.toLocaleString('pt-BR')} cx</span></div>
                <div className="flex justify-between"><span>Faturamento Periodo:</span><span className="font-mono font-bold text-amber-900">R$ {selectedSkuDetail.vendaValorRS.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
                <div className="flex justify-between"><span>Volume Hectolitros:</span><span className="font-mono font-bold">{selectedSkuDetail.vendaVolumeHl.toFixed(2)} HL</span></div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-black text-slate-900 uppercase text-[11px] border-b pb-1">2. Posição de Estoque</h4>
                <div className="flex justify-between"><span>Estoque Atual:</span><span className="font-mono font-bold">{selectedSkuDetail.estoqueAtualCx.toLocaleString('pt-BR')} cx</span></div>
                <div className="flex justify-between"><span>Valor Imobilizado:</span><span className="font-mono font-bold text-emerald-900">R$ {selectedSkuDetail.estoqueValorRS.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
                <div className="flex justify-between"><span>Cobertura / Giro:</span><span className="font-mono font-bold">{selectedSkuDetail.coberturaDias}d / Giro {selectedSkuDetail.giroEstoque}x</span></div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-black text-slate-900 uppercase text-[11px] border-b pb-1">3. Impacto Operacional</h4>
                <div className="flex justify-between"><span>Saldo Picking:</span><span className="font-mono font-bold">{selectedSkuDetail.qtdPickingCx} cx</span></div>
                <div className="flex justify-between"><span>Reabastecimentos / Freq:</span><span className="font-mono font-bold">{selectedSkuDetail.qtdReabastecimentos}x</span></div>
                <div className="flex justify-between"><span>Score Operacional Total:</span><span className="font-mono font-bold text-purple-900">{selectedSkuDetail.scoreImpactoOperacional} pts</span></div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <h4 className="font-black text-slate-900 uppercase text-[11px] border-b pb-1">4. Qualidade & Validade</h4>
                <div className="flex justify-between"><span>Avarias / Quebras (R$):</span><span className="font-mono font-bold text-rose-900">R$ {selectedSkuDetail.valorQuebrasRS.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Status FEFO:</span><span className="font-mono font-bold">{selectedSkuDetail.diasParaVencimentoMin}d ({selectedSkuDetail.statusFefo})</span></div>
                <div className="flex justify-between"><span>Risco Vencimento:</span><span className="font-mono font-bold text-orange-900">{selectedSkuDetail.riscoVencimento}</span></div>
              </div>
            </div>

            {/* DIAGNÓSTICO E RECOMENDAÇÃO FINAL */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-1">
              <span className="text-[10px] font-black uppercase text-[#1e56f0] block">Diagnóstico Logístico Final</span>
              <p className="text-xs font-black text-slate-900">{selectedSkuDetail.diagnosticoFinal}</p>
              <p className="text-[11px] text-slate-600 mt-1 font-medium">
                Criticidade Definida: <strong>{selectedSkuDetail.criticidade}</strong>. Monitore com base nos procedimentos operacionais da plataforma.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
