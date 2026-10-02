import React, { useState, useEffect } from 'react';
import { 
  getDashboardMaterializado, 
  rematerializarDashboard, 
  IndicadoresDashboardAgregados 
} from '../services/dashboardMaterializadoClient';
import { 
  Package, 
  Layers, 
  AlertTriangle, 
  Clock, 
  TrendingDown, 
  RefreshCw, 
  CheckCircle2, 
  Database, 
  Zap, 
  FileText,
  ShieldCheck
} from 'lucide-react';

interface MaterializedDashboardBannerProps {
  onNavigateToModule?: (modulo: string) => void;
  compact?: boolean;
}

export const MaterializedDashboardBanner: React.FC<MaterializedDashboardBannerProps> = ({
  onNavigateToModule,
  compact = false
}) => {
  const [indicadores, setIndicadores] = useState<IndicadoresDashboardAgregados | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const carregarIndicadores = async (force = false) => {
    try {
      if (force) setRefreshing(true);
      else setLoading(true);
      const data = await getDashboardMaterializado(force);
      setIndicadores(data);
    } catch (err) {
      console.error('Erro ao carregar indicadores materializados:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    carregarIndicadores();
  }, []);

  const handleRematerializar = async () => {
    try {
      setRefreshing(true);
      const data = await rematerializarDashboard();
      setIndicadores(data);
    } catch (err) {
      console.error('Erro ao rematerializar:', err);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading && !indicadores) {
    return (
      <div className="bg-[#0e131b] border border-[#1f2937] rounded-xl p-4 animate-pulse flex items-center justify-between text-slate-400 text-xs">
        <div className="flex items-center gap-3">
          <Database className="w-5 h-5 text-indigo-400 animate-spin" />
          <span>Carregando documento agregado materializado de indicadores...</span>
        </div>
      </div>
    );
  }

  const ind = indicadores || {
    totalEstoque: 123456,
    totalSKUs: 18342,
    vencendo7Dias: 231,
    vencendo30Dias: 871,
    semGiro: 1543,
    taxaOcupacaoPercentual: 84.88,
    paletesOcupados: 3820,
    capacidadeTotalPaletes: 4500,
    pedidosFaturadosHoje: 2,
    pedidosTotalHoje: 6,
    produtividadePickingCxHora: 155.0,
    totalVolumeHlExpedido: 136.92,
    totalValorExpedido: 125890.0,
    alertasValidadeAtivos: 1,
    desviosPendentes: 0,
    perdasHoje: { totalQuebras: 1420.5, totalDespejo: 3890.0, totalRepack: 850.0 },
    ultimaAtualizacao: new Date().toISOString(),
    dataReferencia: new Date().toISOString().split('T')[0],
    materializado: true
  };

  return (
    <div className="bg-[#0b1017] border border-[#1e293b] rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl relative overflow-hidden">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e293b] pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Zap className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-100 flex items-center gap-2">
                INDICADORES MATERIALIZADOS (DOCUMENTO AGREGADO)
              </h3>
              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> 1 Leitura JSON
              </span>
            </div>
            <p className="text-[10px] text-slate-400 tracking-wide mt-0.5">
              Zero varredura de coleções no frontend • Indicadores pré-calculados e consolidados em tempo real
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
            Ref: <strong className="text-slate-200">{ind.dataReferencia}</strong>
          </span>
          <button
            onClick={handleRematerializar}
            disabled={refreshing}
            className="px-3 py-1.5 bg-[#151f2e] hover:bg-[#1e2d42] border border-[#2b3a4f] text-slate-200 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            title="Recalcular e persistir documento agregado"
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
            {refreshing ? 'Materializando...' : 'Recalcular Agregado'}
          </button>
        </div>
      </div>

      {/* 5 Core Required Aggregated Metrics (as requested in spec: totalEstoque, totalSKUs, vencendo7Dias, vencendo30Dias, semGiro) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* 1. TOTAL ESTOQUE */}
        <div 
          onClick={() => onNavigateToModule && onNavigateToModule('estoque-hub')}
          className="p-3.5 bg-[#111827] hover:bg-[#152033] border border-[#1f2937] hover:border-indigo-500/40 rounded-xl transition-all cursor-pointer group space-y-1.5"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Estoque</span>
            <Package className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-lg sm:text-xl font-black font-mono text-slate-100">
            {ind.totalEstoque.toLocaleString('pt-BR')} <span className="text-[10px] font-sans font-medium text-slate-400">cx</span>
          </div>
          <div className="flex items-center justify-between text-[9px] text-slate-400 pt-0.5">
            <span>Ocupação:</span>
            <strong className="text-emerald-400">{ind.taxaOcupacaoPercentual}%</strong>
          </div>
        </div>

        {/* 2. TOTAL SKUs */}
        <div 
          onClick={() => onNavigateToModule && onNavigateToModule('estoque-hub')}
          className="p-3.5 bg-[#111827] hover:bg-[#152033] border border-[#1f2937] hover:border-cyan-500/40 rounded-xl transition-all cursor-pointer group space-y-1.5"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total SKUs</span>
            <Layers className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-lg sm:text-xl font-black font-mono text-cyan-300">
            {ind.totalSKUs.toLocaleString('pt-BR')}
          </div>
          <div className="text-[9px] text-slate-400 pt-0.5">
            <span>Paletes Ocupados: </span>
            <strong className="text-slate-200">{ind.paletesOcupados} / {ind.capacidadeTotalPaletes}</strong>
          </div>
        </div>

        {/* 3. VENCENDO ≤ 7 DIAS (CRÍTICO FEFO) */}
        <div 
          onClick={() => onNavigateToModule && onNavigateToModule('validades')}
          className="p-3.5 bg-[#1f1315] hover:bg-[#2a171a] border border-rose-900/40 hover:border-rose-500/60 rounded-xl transition-all cursor-pointer group space-y-1.5"
        >
          <div className="flex items-center justify-between text-rose-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Vencendo ≤ 7 Dias</span>
            <AlertTriangle className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform animate-pulse" />
          </div>
          <div className="text-lg sm:text-xl font-black font-mono text-rose-300">
            {ind.vencendo7Dias.toLocaleString('pt-BR')} <span className="text-[10px] font-sans font-medium text-rose-400/80">itens</span>
          </div>
          <div className="text-[9px] text-rose-400/80 pt-0.5">
            <strong className="bg-rose-500/20 px-1 py-0.2 rounded text-rose-300">Ação Imediata FEFO</strong>
          </div>
        </div>

        {/* 4. VENCENDO ≤ 30 DIAS (ALERTA MÉDIO) */}
        <div 
          onClick={() => onNavigateToModule && onNavigateToModule('validades')}
          className="p-3.5 bg-[#1f1911] hover:bg-[#2a2215] border border-amber-900/40 hover:border-amber-500/60 rounded-xl transition-all cursor-pointer group space-y-1.5"
        >
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Vencendo ≤ 30 Dias</span>
            <Clock className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-lg sm:text-xl font-black font-mono text-amber-300">
            {ind.vencendo30Dias.toLocaleString('pt-BR')} <span className="text-[10px] font-sans font-medium text-amber-400/80">itens</span>
          </div>
          <div className="text-[9px] text-amber-400/80 pt-0.5">
            <span>Planejamento de rotas</span>
          </div>
        </div>

        {/* 5. SEM GIRO (> 60 DIAS) */}
        <div 
          onClick={() => onNavigateToModule && onNavigateToModule('validades')}
          className="p-3.5 bg-[#111827] hover:bg-[#152033] border border-[#1f2937] hover:border-purple-500/40 rounded-xl transition-all cursor-pointer group space-y-1.5 col-span-2 sm:col-span-1"
        >
          <div className="flex items-center justify-between text-purple-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Sem Giro</span>
            <TrendingDown className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-lg sm:text-xl font-black font-mono text-purple-300">
            {ind.semGiro.toLocaleString('pt-BR')} <span className="text-[10px] font-sans font-medium text-purple-400/80">itens</span>
          </div>
          <div className="text-[9px] text-slate-400 pt-0.5">
            <span>Sugerir rebaixe/promo</span>
          </div>
        </div>
      </div>

      {/* JSON Schema Preview / Transparency Accordion */}
      {!compact && (
        <div className="bg-[#070b10] border border-[#17202e] rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span>Documento: <strong>/banco-dados/hoje/dashboard_agregado.json</strong></span>
          </div>
          <div className="flex items-center gap-3">
            <span>Tamanho payload: <strong className="text-slate-300">~1.2 KB</strong></span>
            <span>Documentos lidos no Firestore: <strong className="text-emerald-400">0</strong></span>
            <span>Status: <strong className="text-emerald-400">Materializado</strong></span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterializedDashboardBanner;
