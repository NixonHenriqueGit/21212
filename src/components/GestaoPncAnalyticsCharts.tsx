import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Building2,
  TrendingDown,
  Layers,
  Box,
  DollarSign,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Award,
  Sparkles,
  ArrowUpRight,
  Filter,
  Truck
} from 'lucide-react';
import {
  PncRecord,
  PncKpis,
  calculatePncSeniorAnalytics
} from '../utils/gestaoPncManager';

interface GestaoPncAnalyticsChartsProps {
  records: PncRecord[];
  kpis: PncKpis;
  selectedSuppliers: string[];
  onToggleSupplier: (supplier: string) => void;
  onClearSupplierFilter: () => void;
  onSelectRecord?: (record: PncRecord) => void;
  onEncaminharDespejo?: (n_bloqueio: string) => void;
}

const COLORS_PIE = ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4'];

export const GestaoPncAnalyticsCharts: React.FC<GestaoPncAnalyticsChartsProps> = ({
  records,
  kpis,
  selectedSuppliers,
  onToggleSupplier,
  onClearSupplierFilter,
  onSelectRecord,
  onEncaminharDespejo
}) => {
  const [supplierMetricView, setSupplierMetricView] = useState<'valor' | 'caixas' | 'hl'>('valor');
  const [activeTab, setActiveTab] = useState<'geral' | 'fornecedores' | 'motivos' | 'devolucoes'>('geral');

  const analytics = calculatePncSeniorAnalytics(records);
  const { suppliers, motivos, origensBloqueio, devolucaoResumo, insights } = analytics;

  // Formatar dados para o gráfico de Fornecedores
  const supplierChartData = suppliers.map(s => ({
    name: s.nome.length > 14 ? `${s.nome.substring(0, 12)}...` : s.nome,
    fullName: s.nome,
    valorTotal: s.valorTotal,
    valorAmortizado: s.valorAmortizado,
    caixasBloqueadas: s.totalBloqCx,
    caixasDevolvidas: s.caixasDevolvidas,
    hlBloqueados: s.totalBloqHl,
    palletsBloqueados: s.palletsBloqueados,
    palletsDevolvidos: s.palletsDevolvidos,
    pctDevolucaoPlts: s.pctPalletsDevolvidos,
    principalMotivo: s.principalMotivo
  }));

  // Formatar dados para o gráfico de Motivos (Caixas Bloqueadas)
  const motivoChartData = motivos.map(m => ({
    name: m.motivo.length > 16 ? `${m.motivo.substring(0, 14)}...` : m.motivo,
    fullName: m.motivo,
    caixas: m.totalBloqCx,
    valor: m.valorTotal,
    valorAmortizado: m.valorAmortizado,
    bloqueios: m.totalBloqueios,
    principalFornecedor: m.principalFornecedor
  }));

  // Formatar dados para o gráfico de Itens Devolvidos vs Bloqueados (Chamados)
  const palletsPieData = [
    { name: 'Itens Devolvidos / Realizados', value: devolucaoResumo.palletsDevolvidos, color: '#10b981' },
    { name: 'Itens em Tratativa / Quarentena', value: Math.max(0, devolucaoResumo.palletsBloqueados - devolucaoResumo.palletsDevolvidos), color: '#f59e0b' }
  ].filter(d => d.value > 0);

  // Formatar dados para o gráfico de Caixas Devolvidas vs Retidas
  const caixasPieData = [
    { name: 'Caixas Devolvidas à Fábrica', value: devolucaoResumo.caixasDevolvidas, color: '#3b82f6' },
    { name: 'Caixas Bloqueadas Retidas', value: devolucaoResumo.caixasRetidas, color: '#ef4444' }
  ].filter(d => d.value > 0);

  // Formatar dados de Origens do Bloqueio
  const origemChartData = origensBloqueio.map(o => ({
    name: o.origem.length > 15 ? `${o.origem.substring(0, 13)}...` : o.origem,
    fullName: o.origem,
    bloqueios: o.totalBloqueios,
    caixas: o.totalBloqCx,
    valor: o.valorTotal
  }));

  return (
    <div className="space-y-6">
      {/* ALERTA OPERACIONAL DPO: ITENS ULTRAPASSANDO 30 DIAS NO PNC */}
      {kpis.qtdAcima30Dias > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-500/15 via-rose-500/10 to-amber-500/10 border-2 border-rose-500/50 dark:border-rose-500/40 shadow-lg relative overflow-hidden animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500 text-white shadow-md shrink-0 animate-pulse">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                    Alerta Crítico DPO
                  </span>
                  <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
                    Limite Máximo de 30 Dias Excedido
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white mt-1">
                  {kpis.qtdAcima30Dias} chamado(s) / item(ns) estão há mais de 30 dias no PNC e devem ser encaminhados para Despejo!
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 font-medium">
                  Itens não devolvidos ou retidos acima do SLA regulamentar de 30 dias devem ter ordem de descarte/despejo emitida para evitar perdas financeiras no fechamento.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400">Itens Críticos</span>
                <p className="text-lg font-black font-mono text-rose-600 dark:text-rose-400">{kpis.qtdAcima30Dias} itens</p>
              </div>
            </div>
          </div>

          {/* LISTA RÁPIDA DE ITENS COM > 30 DIAS */}
          <div className="mt-3.5 pt-3 border-t border-rose-200/60 dark:border-rose-900/40 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {kpis.itensAcima30Dias.map(item => (
              <div
                key={item.n_bloqueio}
                className="p-2.5 rounded-xl bg-white/80 dark:bg-[#151b23]/90 border border-rose-200 dark:border-rose-900/50 flex items-center justify-between gap-2 shadow-2xs"
              >
                <div
                  className="min-w-0 flex-1 cursor-pointer"
                  onClick={() => onSelectRecord && onSelectRecord(item)}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-black text-rose-600 dark:text-rose-400">{item.n_bloqueio}</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                      {item.dias_no_pnc} dias
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate mt-0.5" title={item.descri_o}>
                    {item.descri_o}
                  </p>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {item.qtde_bloq_cx} cx | R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {onEncaminharDespejo && (
                  <button
                    type="button"
                    onClick={() => onEncaminharDespejo(item.n_bloqueio)}
                    title="Encaminhar este item imediatamente para Despejo"
                    className="px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-rose-600 hover:bg-rose-500 text-white shadow-xs cursor-pointer transition-all shrink-0"
                  >
                    Despejo
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4 CARDS EXECUTIVOS SÊNIOR DE LOGÍSTICA & IMPACTO AMORTIZADO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1: IMPACTO FINANCEIRO AMORTIZADO (DEVOLUÇÃO ORIGEM) */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border-2 border-emerald-500/40 dark:border-emerald-500/30 shadow-md relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 transform translate-x-3 -translate-y-3 opacity-10">
            <ShieldCheck className="w-24 h-24 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                Amortização Financeira
              </span>
              <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            </div>
            <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 mt-2 tracking-wider">
              Impacto Amortizado (Devoluções)
            </h4>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                R$ {kpis.valorAmortizadoDevolucao.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">
              Ressarcimento garantido via chamado de devolução à fábrica produtora.
            </p>
          </div>

          <div className="mt-3 pt-3 border-t border-emerald-200/60 dark:border-emerald-900/40 flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400 font-bold text-[11px]">
              Taxa de Amortização:
            </span>
            <span className="font-mono font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md">
              {kpis.percentualValorAmortizado.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* CARD 2: EFICIÊNCIA DE DEVOLUÇÃO FÍSICA (ITENS & CHAMADOS) */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border-2 border-blue-500/40 dark:border-blue-500/30 shadow-md relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 transform translate-x-3 -translate-y-3 opacity-10">
            <Layers className="w-24 h-24 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                Logística Reversa (Itens)
              </span>
              <TrendingDown className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
            </div>
            <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 mt-2 tracking-wider">
              Taxa de Devolução de Itens
            </h4>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 font-mono">
                {kpis.percentualItensDevolvidos.toFixed(1)}%
              </span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                ({kpis.itensDevolvidos} de {kpis.totalItens} Itens Realizados)
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, kpis.percentualItensDevolvidos)}%` }}
              />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              <span>Chamados: <strong>{kpis.chamadosDevolvidos}/{kpis.totalChamados}</strong></span>
              <span>Pendentes: <strong className="text-amber-600 dark:text-amber-400">{kpis.itensNaoDevolvidos} itens</strong></span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-blue-200/60 dark:border-blue-900/40 flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400 font-bold text-[11px]">
              Em Tratativa no CDD:
            </span>
            <span className="font-mono font-black text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
              {kpis.itensEmTratativa} Itens ({kpis.chamadosEmTratativa} chamados)
            </span>
          </div>
        </div>

        {/* CARD 3: QUANTIDADE DE CAIXAS BLOQUEADAS & DEVOLVIDAS */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border-2 border-amber-500/40 dark:border-amber-500/30 shadow-md relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 transform translate-x-3 -translate-y-3 opacity-10">
            <Box className="w-24 h-24 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                Volume Físico (Caixas)
              </span>
              <Box className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            </div>
            <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 mt-2 tracking-wider">
              Caixas Bloqueadas & Expedidas
            </h4>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 font-mono">
                {kpis.totalBloqCx.toLocaleString('pt-BR')}
              </span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">CX Total</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">
              {kpis.caixasDevolvidas.toLocaleString('pt-BR')} cx devolvidas ({kpis.percentualCaixasDevolvidas.toFixed(1)}%)
            </p>
          </div>

          <div className="mt-3 pt-3 border-t border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400 font-bold text-[11px]">
              Retidas sem devolução:
            </span>
            <span className="font-mono font-black text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded-md">
              {kpis.caixasRetidas.toLocaleString('pt-BR')} cx
            </span>
          </div>
        </div>

        {/* CARD 4: FORNECEDOR CRÍTICO (MAIOR IMPACTO) */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent border-2 border-purple-500/40 dark:border-purple-500/30 shadow-md relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 transform translate-x-3 -translate-y-3 opacity-10">
            <Building2 className="w-24 h-24 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                Pareto de Fornecedores
              </span>
              <Award className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0" />
            </div>
            <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 mt-2 tracking-wider">
              Maior Impacto por Fornecedor
            </h4>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-purple-700 dark:text-purple-300 truncate">
                {kpis.fornecedorMaiorValor.nome}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">
              R$ {kpis.fornecedorMaiorValor.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({kpis.fornecedorMaiorValor.percentual}% do total)
            </p>
          </div>

          <div className="mt-3 pt-3 border-t border-purple-200/60 dark:border-purple-900/40 flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400 font-bold text-[11px]">
              Maior Volume:
            </span>
            <span className="font-bold text-purple-700 dark:text-purple-300 truncate max-w-[140px]" title={kpis.fornecedorMaiorVolume.nome}>
              {kpis.fornecedorMaiorVolume.nome} ({kpis.fornecedorMaiorVolume.caixas} cx)
            </span>
          </div>
        </div>
      </div>

      {/* SELETOR DINÂMICO DE FORNECEDOR / FÁBRICA DE ORIGEM */}
      <div className="bg-white dark:bg-[#151b23] rounded-2xl border border-slate-200 dark:border-[#222d3a] p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase text-slate-900 dark:text-white tracking-wider">
                Filtro Dinâmico por Fornecedor / Fábrica de Origem
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Clique em uma fábrica para isolar os dados e analisar seu desempenho logístico individual.
              </p>
            </div>
          </div>

          {selectedSuppliers.length > 0 && (
            <button
              type="button"
              onClick={onClearSupplierFilter}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-[#0d1117] text-slate-700 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-300 border border-slate-200 dark:border-[#222d3a] cursor-pointer flex items-center gap-1.5 transition-all"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Ver Todos os Fornecedores</span>
            </button>
          )}
        </div>

        {/* PILLS INTERATIVAS DE FORNECEDORES */}
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={onClearSupplierFilter}
            className={`px-3.5 py-2 rounded-xl text-xs font-black tracking-wide cursor-pointer transition-all flex items-center gap-2 ${
              selectedSuppliers.length === 0
                ? 'bg-[#032b5e] text-white shadow-md'
                : 'bg-slate-100 dark:bg-[#0d1117] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#222d3a] hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <span>Todos os Fornecedores</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-white/20">
              {suppliers.length}
            </span>
          </button>

          {suppliers.map(sup => {
            const isSelected = selectedSuppliers.includes(sup.nome);
            return (
              <button
                key={sup.nome}
                type="button"
                onClick={() => onToggleSupplier(sup.nome)}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all flex items-center gap-2.5 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-400/40'
                    : 'bg-slate-50 dark:bg-[#0d1117] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-[#222d3a] hover:bg-blue-50 dark:hover:bg-slate-800'
                }`}
              >
                <Building2 className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                <span>{sup.nome}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {sup.totalBloqCx} cx | R$ {sup.valorTotal.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ABAS DE NAVEGAÇÃO DE ANÁLISE GRÁFICA */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-[#222d3a] pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('geral')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-all flex items-center gap-2 ${
            activeTab === 'geral'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Visão Geral & Gráficos</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('fornecedores')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-all flex items-center gap-2 ${
            activeTab === 'fornecedores'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Ranking de Fornecedores ({suppliers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('motivos')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-all flex items-center gap-2 ${
            activeTab === 'motivos'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Box className="w-4 h-4" />
          <span>Caixas Bloqueadas por Motivo</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('devolucoes')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-all flex items-center gap-2 ${
            activeTab === 'devolucoes'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <TrendingDown className="w-4 h-4" />
          <span>Logística Reversa & Amortização</span>
        </button>
      </div>

      {/* SEÇÃO PRINCIPAL DE GRÁFICOS INTERATIVOS — MAXIMIZAÇÃO CONFORME FILTRO */}
      {activeTab === 'motivos' ? (
        /* VISTA MAXIMIZADA: QUANTIDADE DE CAIXAS BLOQUEADAS POR MOTIVO */
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#151b23] rounded-2xl border-2 border-amber-500/40 dark:border-amber-500/30 p-5 sm:p-6 shadow-md">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-[#222d3a]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase bg-amber-500 text-slate-950 px-2 py-0.5 rounded tracking-wider">
                    Gráfico Maximizado
                  </span>
                  <h3 className="font-black text-base uppercase text-slate-900 dark:text-white tracking-wider flex items-center gap-2">
                    <Box className="w-5 h-5 text-amber-500" />
                    Quantidade de Caixas Bloqueadas por Motivo de Não Conformidade
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                  Estratificação detalhada das causas raízes operacionais em volume de caixas, ocorrências e impacto financeiro total.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('geral')}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer flex items-center gap-1.5 transition-all"
                >
                  <span>Ver Todos os Gráficos</span>
                </button>
              </div>
            </div>

            {/* Painel de Indicadores Resumo do Filtro de Motivos */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
              <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40">
                <span className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-400">Total Caixas Bloqueadas</span>
                <p className="text-lg font-black font-mono text-amber-900 dark:text-amber-200 mt-0.5">
                  {motivos.reduce((acc, m) => acc + m.totalBloqCx, 0).toLocaleString('pt-BR')} cx
                </p>
              </div>
              <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40">
                <span className="text-[10px] uppercase font-bold text-blue-800 dark:text-blue-400">Total de Ocorrências</span>
                <p className="text-lg font-black font-mono text-blue-900 dark:text-blue-200 mt-0.5">
                  {motivos.reduce((acc, m) => acc + m.totalBloqueios, 0)} chamados
                </p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40">
                <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-400">Valor Total Bloqueado</span>
                <p className="text-lg font-black font-mono text-emerald-900 dark:text-emerald-200 mt-0.5">
                  R$ {motivos.reduce((acc, m) => acc + m.valorTotal, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/40">
                <span className="text-[10px] uppercase font-bold text-purple-800 dark:text-purple-400">Motivos Mapeados</span>
                <p className="text-lg font-black font-mono text-purple-900 dark:text-purple-200 mt-0.5">
                  {motivos.length} categorias
                </p>
              </div>
            </div>

            {/* GRÁFICO MAXIMIZADO DE CAIXAS POR MOTIVO */}
            <div className="h-[460px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={motivoChartData}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 40, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12, fontWeight: 600 }} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 12, fontWeight: 700 }}
                    width={140}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-4 rounded-xl text-xs space-y-2 shadow-2xl border border-slate-700 max-w-sm">
                            <p className="font-black text-amber-400 text-sm border-b border-slate-700 pb-1.5">
                              {data.fullName}
                            </p>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                              <span className="text-slate-400">Caixas Bloqueadas:</span>
                              <span className="font-bold font-mono text-amber-400 text-sm">{data.caixas.toLocaleString('pt-BR')} cx</span>
                              <span className="text-slate-400">Qtd Chamados:</span>
                              <span className="font-bold text-slate-200">{data.bloqueios}</span>
                              <span className="text-slate-400">Valor Total:</span>
                              <span className="font-mono font-bold text-emerald-400">
                                R$ {data.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                              <span className="text-slate-400">Top Fornecedor:</span>
                              <span className="font-bold text-purple-300">{data.principalFornecedor}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="caixas" name="Quantidade de Caixas Bloqueadas (CX)" fill="#f59e0b" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : activeTab === 'fornecedores' ? (
        /* VISTA MAXIMIZADA: RANKING DE FORNECEDORES & SCORECARD */
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#151b23] rounded-2xl border-2 border-blue-500/40 dark:border-blue-500/30 p-5 sm:p-6 shadow-md">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-[#222d3a]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase bg-blue-600 text-white px-2 py-0.5 rounded tracking-wider">
                    Gráfico Maximizado
                  </span>
                  <h3 className="font-black text-base uppercase text-slate-900 dark:text-white tracking-wider flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-500" />
                    Impacto Comparativo por Fornecedor / Fábrica
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                  Métricas consolidadas de perdas bloqueadas vs amortizadas por unidade produtora.
                </p>
              </div>

              {/* SELETOR DE MÉTRICA */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#0d1117] p-1 rounded-xl border border-slate-200 dark:border-[#222d3a]">
                <button
                  type="button"
                  onClick={() => setSupplierMetricView('valor')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black cursor-pointer transition-all ${
                    supplierMetricView === 'valor'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Valor (R$)
                </button>
                <button
                  type="button"
                  onClick={() => setSupplierMetricView('caixas')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black cursor-pointer transition-all ${
                    supplierMetricView === 'caixas'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Caixas (CX)
                </button>
                <button
                  type="button"
                  onClick={() => setSupplierMetricView('hl')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black cursor-pointer transition-all ${
                    supplierMetricView === 'hl'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Volume (HL)
                </button>
              </div>
            </div>

            <div className="h-[420px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={supplierChartData}
                  margin={{ top: 15, right: 20, left: 10, bottom: 35 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fontWeight: 700 }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={val =>
                      supplierMetricView === 'valor'
                        ? `R$ ${(val / 1000).toFixed(0)}k`
                        : val.toLocaleString('pt-BR')
                    }
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-4 rounded-xl text-xs space-y-2 shadow-2xl border border-slate-700">
                            <p className="font-black text-amber-400 text-sm border-b border-slate-700 pb-1.5">
                              {data.fullName}
                            </p>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                              <span className="text-slate-400">Valor Total:</span>
                              <span className="font-mono font-bold text-emerald-400">
                                R$ {data.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                              <span className="text-slate-400">Valor Amortizado:</span>
                              <span className="font-mono font-bold text-teal-300">
                                R$ {data.valorAmortizado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                              <span className="text-slate-400">Caixas Bloq:</span>
                              <span className="font-bold text-slate-200">{data.caixasBloqueadas} cx</span>
                              <span className="text-slate-400">Caixas Devolvidas:</span>
                              <span className="font-bold text-blue-400">{data.caixasDevolvidas} cx</span>
                              <span className="text-slate-400">Itens / Chamados:</span>
                              <span className="font-bold text-purple-300">{data.palletsBloqueados} itens ({data.palletsDevolvidos} dev.)</span>
                              <span className="text-slate-400">Principal Motivo:</span>
                              <span className="font-bold text-amber-300">{data.principalMotivo}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  {supplierMetricView === 'valor' ? (
                    <>
                      <Bar dataKey="valorTotal" name="Valor Bloqueado (R$)" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="valorAmortizado" name="Valor Amortizado (R$)" fill="#10b981" radius={[6, 6, 0, 0]} />
                    </>
                  ) : supplierMetricView === 'caixas' ? (
                    <>
                      <Bar dataKey="caixasBloqueadas" name="Caixas Bloqueadas" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="caixasDevolvidas" name="Caixas Devolvidas" fill="#10b981" radius={[6, 6, 0, 0]} />
                    </>
                  ) : (
                    <Bar dataKey="hlBloqueados" name="Volume Bloqueado (HL)" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : activeTab === 'devolucoes' ? (
        /* VISTA MAXIMIZADA: LOGÍSTICA REVERSA & AMORTIZAÇÃO */
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#151b23] rounded-2xl border-2 border-emerald-500/40 dark:border-emerald-500/30 p-5 sm:p-6 shadow-md">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#222d3a]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase bg-emerald-600 text-white px-2 py-0.5 rounded tracking-wider">
                    Painel Maximizado
                  </span>
                  <h3 className="font-black text-base uppercase text-slate-900 dark:text-white tracking-wider flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-emerald-500" />
                    Logística Reversa, Amortização & Taxa de Devolução
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                  Acompanhamento consolidado de itens/chamados devolvidos à fábrica, caixas expedidas e valores ressarcidos.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center mt-6">
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={palletsPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {palletsPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0];
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-xl text-xs shadow-xl border border-slate-700">
                              <span className="font-bold">{data.name}: </span>
                              <span className="font-mono text-emerald-400 font-black">{data.value} Itens</span>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40">
                  <div className="flex items-center justify-between text-xs font-black text-amber-900 dark:text-amber-300">
                    <span className="flex items-center gap-1.5">
                      <Box className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      Quantidade Bloqueada
                    </span>
                    <span className="font-mono font-black text-sm">
                      {devolucaoResumo.caixasBloqueadas.toLocaleString('pt-BR')} cx
                    </span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between text-xs text-amber-800 dark:text-amber-400">
                    <span className="font-semibold">Volume (HL):</span>
                    <span className="font-mono font-bold">
                      {(devolucaoResumo.hlBloqueado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} HL
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40">
                  <div className="flex items-center justify-between text-xs font-black text-emerald-900 dark:text-emerald-300">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      Itens Devolvidos
                    </span>
                    <span className="font-mono font-black text-sm">{devolucaoResumo.palletsDevolvidos} Itens</span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-emerald-200/60 dark:border-emerald-900/40 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-400">
                    <span className="font-semibold">Eficiência:</span>
                    <span className="font-bold font-mono">{devolucaoResumo.pctPalletsDevolvidos.toFixed(1)}%</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40">
                  <div className="flex items-center justify-between text-xs font-black text-blue-900 dark:text-blue-300">
                    <span className="flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      Caixas Devolvidas
                    </span>
                    <span className="font-mono font-black text-sm">
                      {devolucaoResumo.caixasDevolvidas.toLocaleString('pt-BR')} cx
                    </span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-blue-200/60 dark:border-blue-900/40 flex items-center justify-between text-xs text-blue-800 dark:text-blue-400">
                    <span className="font-semibold">Volume Devolvido:</span>
                    <span className="font-mono font-bold">
                      {(devolucaoResumo.hlDevolvido || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} HL
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/40">
                  <div className="flex items-center justify-between text-xs font-black text-purple-900 dark:text-purple-300">
                    <span className="flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      Valor Amortizado
                    </span>
                    <span className="font-mono font-black text-sm">
                      R$ {devolucaoResumo.valorAmortizado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-purple-200/60 dark:border-purple-900/40 flex items-center justify-between text-xs text-purple-800 dark:text-purple-400">
                    <span className="font-semibold">% Financeiro:</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {devolucaoResumo.pctValorAmortizado.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* VISTA GERAL: GRID COM TODOS OS 4 GRÁFICOS */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* GRÁFICO 1: MAIOR IMPACTO POR FORNECEDOR */}
          <div className="bg-white dark:bg-[#151b23] rounded-2xl border border-slate-200 dark:border-[#222d3a] p-4 sm:p-5 shadow-xs flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-[#222d3a]">
              <div>
                <h3 className="font-black text-sm uppercase text-slate-900 dark:text-white tracking-wider flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-500" />
                  Impacto Comparativo por Fornecedor / Fábrica
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Métricas de perdas bloqueadas vs amortizadas por unidade fornecedora.
                </p>
              </div>

              {/* SELETOR DE MÉTRICA */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#0d1117] p-1 rounded-xl border border-slate-200 dark:border-[#222d3a]">
                <button
                  type="button"
                  onClick={() => setSupplierMetricView('valor')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-black cursor-pointer transition-all ${
                    supplierMetricView === 'valor'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Valor (R$)
                </button>
                <button
                  type="button"
                  onClick={() => setSupplierMetricView('caixas')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-black cursor-pointer transition-all ${
                    supplierMetricView === 'caixas'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Caixas (CX)
                </button>
                <button
                  type="button"
                  onClick={() => setSupplierMetricView('hl')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-black cursor-pointer transition-all ${
                    supplierMetricView === 'hl'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Volume (HL)
                </button>
              </div>
            </div>

            <div className="h-72 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={supplierChartData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fontWeight: 700 }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={val =>
                      supplierMetricView === 'valor'
                        ? `R$ ${(val / 1000).toFixed(0)}k`
                        : val.toLocaleString('pt-BR')
                    }
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3.5 rounded-xl text-xs space-y-1.5 shadow-xl border border-slate-700">
                            <p className="font-black text-amber-400 text-sm border-b border-slate-700 pb-1">
                              {data.fullName}
                            </p>
                            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                              <span className="text-slate-400">Valor Total:</span>
                              <span className="font-mono font-bold text-emerald-400">
                                R$ {data.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                              <span className="text-slate-400">Valor Amortizado:</span>
                              <span className="font-mono font-bold text-teal-300">
                                R$ {data.valorAmortizado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                              <span className="text-slate-400">Caixas Bloq:</span>
                              <span className="font-bold text-slate-200">{data.caixasBloqueadas} cx</span>
                              <span className="text-slate-400">Caixas Devolvidas:</span>
                              <span className="font-bold text-blue-400">{data.caixasDevolvidas} cx</span>
                              <span className="text-slate-400">Pallets:</span>
                              <span className="font-bold text-purple-300">{data.palletsBloqueados} PLTs ({data.palletsDevolvidos} dev.)</span>
                              <span className="text-slate-400">Principal Motivo:</span>
                              <span className="font-bold text-amber-300">{data.principalMotivo}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  {supplierMetricView === 'valor' ? (
                    <>
                      <Bar dataKey="valorTotal" name="Valor Bloqueado (R$)" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="valorAmortizado" name="Valor Amortizado (R$)" fill="#10b981" radius={[6, 6, 0, 0]} />
                    </>
                  ) : supplierMetricView === 'caixas' ? (
                    <>
                      <Bar dataKey="caixasBloqueadas" name="Caixas Bloqueadas" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="caixasDevolvidas" name="Caixas Devolvidas" fill="#10b981" radius={[6, 6, 0, 0]} />
                    </>
                  ) : (
                    <Bar dataKey="hlBloqueados" name="Volume Bloqueado (HL)" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* GRÁFICO 2: QUANTIDADE DE CAIXAS BLOQUEADAS POR MOTIVO */}
          <div className="bg-white dark:bg-[#151b23] rounded-2xl border border-slate-200 dark:border-[#222d3a] p-4 sm:p-5 shadow-xs flex flex-col justify-between">
            <div className="pb-4 border-b border-slate-100 dark:border-[#222d3a]">
              <h3 className="font-black text-sm uppercase text-slate-900 dark:text-white tracking-wider flex items-center gap-2">
                <Box className="w-4 h-4 text-amber-500" />
                Quantidade de Caixas Bloqueadas por Motivo
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Estratificação das causas raízes operacionais em volume de caixas e impacto financeiro.
              </p>
            </div>

            <div className="h-72 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={motivoChartData}
                  layout="vertical"
                  margin={{ top: 10, right: 20, left: 30, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 11, fontWeight: 700 }}
                    width={110}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3.5 rounded-xl text-xs space-y-1.5 shadow-xl border border-slate-700">
                            <p className="font-black text-amber-400 text-sm border-b border-slate-700 pb-1">
                              {data.fullName}
                            </p>
                            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                              <span className="text-slate-400">Caixas Bloqueadas:</span>
                              <span className="font-bold text-amber-400">{data.caixas} cx</span>
                              <span className="text-slate-400">Bloqueios:</span>
                              <span className="font-bold text-slate-200">{data.bloqueios} ocorrência(s)</span>
                              <span className="text-slate-400">Valor Total:</span>
                              <span className="font-mono font-bold text-emerald-400">
                                R$ {data.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                              <span className="text-slate-400">Top Fornecedor:</span>
                              <span className="font-bold text-purple-300">{data.principalFornecedor}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="caixas" name="Caixas Bloqueadas (CX)" fill="#f59e0b" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* GRÁFICO 3: PERCENTUAL DE ITENS DEVOLVIDOS VS BLOQUEADOS */}
          <div className="bg-white dark:bg-[#151b23] rounded-2xl border border-slate-200 dark:border-[#222d3a] p-4 sm:p-5 shadow-xs flex flex-col justify-between">
            <div className="pb-4 border-b border-slate-100 dark:border-[#222d3a]">
              <h3 className="font-black text-sm uppercase text-slate-900 dark:text-white tracking-wider flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-emerald-500" />
                Taxa de Devolução: Itens Devolvidos vs Bloqueados (Chamados)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Percentual físico de itens/chamados expedidos para fábrica produtora.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center mt-4">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={palletsPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {palletsPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0];
                          return (
                            <div className="bg-slate-900 text-white p-2.5 rounded-xl text-xs shadow-lg border border-slate-700">
                              <span className="font-bold">{data.name}: </span>
                              <span className="font-mono text-emerald-400 font-black">{data.value} Itens</span>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2.5">
                {/* Card 1: Bloqueios Globais (Caixas e Hectolitros Bloqueados) */}
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40">
                  <div className="flex items-center justify-between text-xs font-black text-amber-900 dark:text-amber-300">
                    <span className="flex items-center gap-1.5">
                      <Box className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      Quantidade Bloqueada
                    </span>
                    <span className="font-mono font-black text-sm">
                      {devolucaoResumo.caixasBloqueadas.toLocaleString('pt-BR')} cx
                    </span>
                  </div>
                  <div className="mt-1.5 pt-1.5 border-t border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between text-[11px] text-amber-800 dark:text-amber-400">
                    <span className="font-semibold">Hectolitro Bloqueado (HL):</span>
                    <span className="font-mono font-bold text-amber-900 dark:text-amber-200">
                      {(devolucaoResumo.hlBloqueado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} HL
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[10px] text-amber-700 dark:text-amber-400/90 font-medium">
                    <span>Quarentena Ativa:</span>
                    <span className="font-bold">
                      {Math.max(0, devolucaoResumo.palletsBloqueados - devolucaoResumo.palletsDevolvidos)} Itens ({devolucaoResumo.caixasRetidas.toLocaleString('pt-BR')} cx | {(devolucaoResumo.hlRetido || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} HL)
                    </span>
                  </div>
                </div>

                {/* Card 2: Itens e Eficiência de Devolução */}
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40">
                  <div className="flex items-center justify-between text-xs font-black text-emerald-900 dark:text-emerald-300">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      Itens Devolvidos
                    </span>
                    <span className="font-mono font-black text-sm">{devolucaoResumo.palletsDevolvidos} Itens</span>
                  </div>
                  <div className="mt-1.5 pt-1.5 border-t border-emerald-200/60 dark:border-emerald-900/40 flex items-center justify-between text-[11px] text-emerald-800 dark:text-emerald-400">
                    <span className="font-semibold">Eficiência de Devolução:</span>
                    <span className="font-bold font-mono">{devolucaoResumo.pctPalletsDevolvidos.toFixed(1)}%</span>
                  </div>
                </div>

                {/* Card 3: Caixas e Hectolitros Devolvidos */}
                <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40">
                  <div className="flex items-center justify-between text-xs font-black text-blue-900 dark:text-blue-300">
                    <span className="flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      Caixas Devolvidas
                    </span>
                    <span className="font-mono font-black text-sm">
                      {devolucaoResumo.caixasDevolvidas.toLocaleString('pt-BR')} cx ({devolucaoResumo.pctCaixasDevolvidas.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="mt-1.5 pt-1.5 border-t border-blue-200/60 dark:border-blue-900/40 flex items-center justify-between text-[11px] text-blue-800 dark:text-blue-400">
                    <span className="font-semibold">Volume Devolvido:</span>
                    <span className="font-mono font-bold">
                      {(devolucaoResumo.hlDevolvido || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} HL ({devolucaoResumo.pctHlDevolvido?.toFixed(1) || '0.0'}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* GRÁFICO 4: DETECÇÃO POR ORIGEM DO BLOQUEIO */}
          <div className="bg-white dark:bg-[#151b23] rounded-2xl border border-slate-200 dark:border-[#222d3a] p-4 sm:p-5 shadow-xs flex flex-col justify-between">
            <div className="pb-4 border-b border-slate-100 dark:border-[#222d3a]">
              <h3 className="font-black text-sm uppercase text-slate-900 dark:text-white tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-500" />
                Detecção de Não Conformidades por Origem do Bloqueio
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Eficácia dos canais de inspeção (Blitz de Puxada, Rondas, Auditorias 5S).
              </p>
            </div>

            <div className="h-72 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={origemChartData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fontWeight: 700 }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3.5 rounded-xl text-xs space-y-1.5 shadow-xl border border-slate-700">
                            <p className="font-black text-purple-400 text-sm border-b border-slate-700 pb-1">
                              {data.fullName}
                            </p>
                            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                              <span className="text-slate-400">Caixas Bloqueadas:</span>
                              <span className="font-bold text-amber-400">{data.caixas} cx</span>
                              <span className="text-slate-400">Total Ocorrências:</span>
                              <span className="font-bold text-slate-200">{data.bloqueios}</span>
                              <span className="text-slate-400">Valor Identificado:</span>
                              <span className="font-mono font-bold text-emerald-400">
                                R$ {data.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="caixas" name="Caixas Bloqueadas (CX)" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="bloqueios" name="Qtd Ocorrências" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* SCORECARD / TABELA COMPARATIVA DE PERFORMANCE DE FORNECEDORES */}
      <div className="bg-white dark:bg-[#151b23] rounded-2xl border border-slate-200 dark:border-[#222d3a] p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100 dark:border-[#222d3a]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm uppercase text-slate-900 dark:text-white tracking-wider">
                Scorecard Logístico de Fornecedores & Fábricas (Qualidade & Devoluções)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Matriz consolidada de impacto financeiro, volumes bloqueados, taxa de devolução e lead time médio no PNC.
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#0d1117] border-b border-slate-200 dark:border-[#222d3a] text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                <th className="p-3">Fábrica / Origem</th>
                <th className="p-3 text-center">Bloqueios</th>
                <th className="p-3 text-right">Caixas Bloq</th>
                <th className="p-3 text-right">Volume (HL)</th>
                <th className="p-3 text-right">Valor Total</th>
                <th className="p-3 text-right">Valor Amortizado</th>
                <th className="p-3 text-center">Itens Bloq / Dev</th>
                <th className="p-3 text-center">% Dev. Itens</th>
                <th className="p-3 text-center">% Dev. Caixas</th>
                <th className="p-3">Causa Raiz Predominante</th>
                <th className="p-3 text-center">Lead Time (Dias)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#222d3a]">
              {suppliers.map(sup => {
                const isSelected = selectedSuppliers.includes(sup.nome);
                return (
                  <tr
                    key={sup.nome}
                    onClick={() => onToggleSupplier(sup.nome)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50/70 dark:bg-blue-950/30 font-bold'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <td className="p-3 font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span>{sup.nome}</span>
                      {isSelected && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-blue-600 text-white font-black">
                          ATIVO
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center font-bold text-slate-700 dark:text-slate-300">
                      {sup.totalBloqueios}
                    </td>
                    <td className="p-3 text-right font-bold text-slate-900 dark:text-white">
                      {sup.totalBloqCx.toLocaleString('pt-BR')} cx
                    </td>
                    <td className="p-3 text-right font-mono text-slate-600 dark:text-slate-400">
                      {sup.totalBloqHl.toFixed(2)} HL
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      R$ {sup.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      R$ {sup.valorAmortizado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-center font-mono text-slate-700 dark:text-slate-300">
                      {sup.palletsBloqueados} / {sup.palletsDevolvidos}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black ${
                          sup.pctPalletsDevolvidos >= 90
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : sup.pctPalletsDevolvidos >= 50
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        {sup.pctPalletsDevolvidos.toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-3 text-center font-bold text-slate-800 dark:text-slate-200">
                      {sup.pctCaixasDevolvidas.toFixed(1)}%
                    </td>
                    <td className="p-3 text-slate-700 dark:text-slate-300 font-medium truncate max-w-[160px]">
                      {sup.principalMotivo}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          sup.mediaDiasPnc >= 30
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300'
                            : sup.mediaDiasPnc >= 15
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {sup.mediaDiasPnc.toFixed(1)}d
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* DIAGNÓSTICO DO ANALISTA SÊNIOR (INSIGHTS & AÇÕES RECOMENDADAS) */}
      <div className="bg-gradient-to-r from-[#032b5e]/10 via-[#043875]/5 to-transparent rounded-2xl border border-blue-900/30 p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <h3 className="font-black text-sm uppercase text-slate-900 dark:text-white tracking-wider">
            Diagnóstico & Recomendações do Analista Sênior de Logística
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {insights.map((ins, i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-white dark:bg-[#151b23] border border-slate-200 dark:border-[#222d3a] shadow-xs flex flex-col justify-between space-y-2.5"
            >
              <div>
                <div className="flex items-center gap-2">
                  {ins.tipo === 'sucesso' && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                  {ins.tipo === 'alerta' && <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />}
                  {ins.tipo === 'estrategico' && <Award className="w-4 h-4 text-purple-500 shrink-0" />}
                  {ins.tipo === 'operacional' && <Box className="w-4 h-4 text-blue-500 shrink-0" />}
                  <h4 className="font-black text-xs text-slate-900 dark:text-white uppercase tracking-tight">
                    {ins.titulo}
                  </h4>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium mt-1.5 leading-relaxed">
                  {ins.descricao}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-[#222d3a] space-y-1 text-[11px]">
                <p className="text-slate-500 dark:text-slate-400 font-bold">
                  <span className="text-blue-600 dark:text-blue-400">Recomendação: </span>
                  {ins.recomendacao}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
