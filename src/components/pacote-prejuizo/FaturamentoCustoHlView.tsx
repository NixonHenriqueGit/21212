import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  Line, 
  ComposedChart,
  Area
} from 'recharts';
import { 
  DollarSign, 
  Droplet, 
  TrendingDown, 
  TrendingUp, 
  Scale, 
  Percent, 
  Calculator, 
  Sliders, 
  FileSpreadsheet, 
  ShieldCheck, 
  AlertTriangle, 
  Layers, 
  ArrowUpRight, 
  Sparkles,
  ArrowRight,
  Info,
  CheckCircle2,
  Calendar,
  Building2
} from 'lucide-react';
import { 
  FATURAMENTO_VOLUME_MENSAL_OFICIAL, 
  FATURAMENTO_TOTAL_DRE_OFICIAL,
  VOLUME_TOTAL_2026_HL,
  VOLUME_TOTAL_2025_HL,
  calcularDreFinanceiraPrejuizo,
  DREFinanceiraPrejuizoCalculada
} from '../../data/faturamentoHectolitroDataset';
import { PacotePrejuizoIndicador } from '../../utils/pacotePrejuizoManager';

interface FaturamentoCustoHlViewProps {
  totalPrejuizoReais: number;
  totalPrejuizoHl: number;
  porIndicador: Record<PacotePrejuizoIndicador, { reais: number; hl: number; unidades: number; count: number }>;
  theme?: 'light' | 'dark';
}

export function FaturamentoCustoHlView({
  totalPrejuizoReais,
  totalPrejuizoHl,
  porIndicador,
  theme = 'dark'
}: FaturamentoCustoHlViewProps) {
  const isDark = theme !== 'light';

  // Simulador interativo de redução de prejuízo (% de redução planejada)
  const [reducaoSimuladaPct, setReducaoSimuladaPct] = useState<number>(0);

  // Cálculo DRE Base
  const dreBase: DREFinanceiraPrejuizoCalculada = useMemo(() => {
    return calcularDreFinanceiraPrejuizo(totalPrejuizoReais, totalPrejuizoHl);
  }, [totalPrejuizoReais, totalPrejuizoHl]);

  // Cálculo Simulado
  const prejuizoSimuladoReais = totalPrejuizoReais * (1 - reducaoSimuladaPct / 100);
  const prejuizoSimuladoHl = totalPrejuizoHl * (1 - reducaoSimuladaPct / 100);
  const dreSimulada = useMemo(() => {
    return calcularDreFinanceiraPrejuizo(prejuizoSimuladoReais, prejuizoSimuladoHl);
  }, [prejuizoSimuladoReais, prejuizoSimuladoHl]);

  const economiaReais = totalPrejuizoReais - prejuizoSimuladoReais;
  const reducaoCustoHl = dreBase.custoPrejuizoPorHl - dreSimulada.custoPrejuizoPorHl;

  // Breakdown de custo por HL para cada pilar do Pacote Prejuízo
  const pilaresBreakdown = useMemo(() => {
    const pilares: { key: PacotePrejuizoIndicador; label: string; color: string; reais: number; hl: number }[] = [
      { key: 'quebras', label: 'Quebras Operacionais', color: '#ef4444', reais: porIndicador.quebras.reais, hl: porIndicador.quebras.hl },
      { key: 'despejo', label: 'Shelf Life (Despejo)', color: '#f97316', reais: porIndicador.despejo.reais, hl: porIndicador.despejo.hl },
      { key: 'trocas', label: 'Trocas & Reposições', color: '#3b82f6', reais: porIndicador.trocas.reais, hl: porIndicador.trocas.hl },
      { key: 'inventario', label: 'Perdas por Inventário', color: '#8b5cf6', reais: porIndicador.inventario.reais, hl: porIndicador.inventario.hl },
      { key: 'refugo', label: 'Refugo & Vasilhames', color: '#10b981', reais: porIndicador.refugo.reais, hl: porIndicador.refugo.hl },
      { key: 'vales', label: 'Vales Emitidos', color: '#eab308', reais: porIndicador.vales.reais, hl: porIndicador.vales.hl }
    ];

    return pilares.map(p => {
      const custoPorHl = dreBase.volumeTotalHl > 0 ? p.reais / dreBase.volumeTotalHl : 0;
      const pctFaturamento = dreBase.faturamentoBrutoTotal > 0 ? (p.reais / dreBase.faturamentoBrutoTotal) * 100 : 0;
      const pctPrejuizo = totalPrejuizoReais > 0 ? (p.reais / totalPrejuizoReais) * 100 : 0;

      return {
        ...p,
        custoPorHl: Math.round(custoPorHl * 1000) / 1000,
        pctFaturamento: Math.round(pctFaturamento * 1000) / 1000,
        pctPrejuizo: Math.round(pctPrejuizo * 10) / 10
      };
    }).sort((a, b) => b.reais - a.reais);
  }, [porIndicador, dreBase, totalPrejuizoReais]);

  // Exportar Relatório DRE em CSV
  const handleExportCsv = () => {
    const headers = [
      'Mes',
      'Faturamento_Bruto_R$',
      'Volume_2026_HL',
      'Volume_2025_HL',
      'Preco_Medio_Bruto_R$/HL',
      'Prejuizo_Total_R$',
      'Prejuizo_Total_HL',
      'Pct_Prejuizo_s_Faturamento',
      'Custo_Prejuizo_por_HL_R$',
      'Faturamento_Liquido_R$',
      'Receita_Liquida_por_HL_R$'
    ];

    const rows = dreBase.meses.map(m => [
      m.mesLabel,
      m.faturamentoBruto.toFixed(2),
      m.volumeHl2026.toFixed(1),
      m.volumeHl2025.toFixed(1),
      m.precoMedioBrutoHl.toFixed(2),
      m.prejuizoReais.toFixed(2),
      m.prejuizoHl.toFixed(3),
      m.pctPrejuizo.toFixed(4),
      m.custoPrejuizoPorHl.toFixed(2),
      m.faturamentoLiquido.toFixed(2),
      m.receitaLiquidaPorHl.toFixed(2)
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [
      headers.join(';'),
      ...rows.map(r => r.join(';'))
    ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DRE_Financeira_Custo_Hectolitro_Revenda_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. HERO BANNER EXECUTIVO COM MÉTRICAS CHAVE */}
      <div className={`p-6 rounded-3xl border relative overflow-hidden ${
        isDark 
          ? 'bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border-slate-800 shadow-2xl' 
          : 'bg-gradient-to-br from-white via-slate-50 to-slate-100 border-slate-200 shadow-sm'
      }`}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" />
                DRE EXECUTIVA & UNIT ECONOMICS
              </span>
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/30 flex items-center gap-1.5">
                <Droplet className="w-3.5 h-3.5" />
                VOLUME TOTAL: {VOLUME_TOTAL_2026_HL.toLocaleString('pt-BR')} HL
              </span>
            </div>
            <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Impacto do Pacote Prejuízo no Faturamento & Custo por Hectolitro
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-3xl mt-1">
              Consolidação corporativa do faturamento em <strong className="text-emerald-400">Reais (R$ 77,3M)</strong> e volume em <strong className="text-sky-400">Hectolitros (110k HL)</strong>, deduzindo os custos das perdas para determinar o <strong className="text-amber-400">Custo Líquido do Hectolitro para a Revenda</strong>.
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportCsv}
            className={`px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm ${
              isDark 
                ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700' 
                : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Exportar DRE Financeira (CSV)</span>
          </button>
        </div>

        {/* CARDS DE IMPACTO FINANCEIRO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Faturamento Bruto */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isDark ? 'bg-slate-950/70 border-emerald-500/30' : 'bg-white border-emerald-200 shadow-xs'
          }`}>
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-1">
              <span>FATURAMENTO BRUTO (DRE)</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400">
              R$ {dreBase.faturamentoBrutoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
              <span>Preço Médio Bruto:</span>
              <strong className="text-emerald-300 font-mono">R$ {dreBase.precoMedioBrutoHl.toFixed(2)} / HL</strong>
            </div>
          </div>

          {/* Card 2: Volume Total Faturado */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isDark ? 'bg-slate-950/70 border-sky-500/30' : 'bg-white border-sky-200 shadow-xs'
          }`}>
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-1">
              <span>VOLUME TOTAL FATURADO</span>
              <Droplet className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-black text-sky-400">
              {dreBase.volumeTotalHl.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} <span className="text-sm font-bold">HL</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
              <span>Comparativo 2025:</span>
              <strong className="text-sky-300 font-mono">
                {VOLUME_TOTAL_2025_HL.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} HL (+18,4% YoY)
              </strong>
            </div>
          </div>

          {/* Card 3: Custos Pacote Prejuízo */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isDark ? 'bg-slate-950/70 border-rose-500/30' : 'bg-white border-rose-200 shadow-xs'
          }`}>
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-1">
              <span>CUSTO PACOTE PREJUÍZO</span>
              <TrendingDown className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-black text-rose-500">
              -R$ {dreBase.custoPrejuizoTotalReais.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
              <span>Impacto s/ Faturamento:</span>
              <strong className="text-rose-400 font-mono">{dreBase.percentualPrejuizoSobreFaturamento.toFixed(3)}%</strong>
            </div>
          </div>

          {/* Card 4: Custo do Prejuízo por HL para a Revenda */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isDark ? 'bg-slate-950/70 border-amber-500/30' : 'bg-white border-amber-200 shadow-xs'
          }`}>
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-1">
              <span>CUSTO DO PREJUÍZO / HL</span>
              <Scale className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400">
              R$ {dreBase.custoPrejuizoPorHl.toFixed(2)} <span className="text-sm font-bold text-slate-400">/ HL</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
              <span>Receita Líquida Realizada:</span>
              <strong className="text-emerald-400 font-mono">R$ {dreBase.receitaLiquidaPorHl.toFixed(2)} / HL</strong>
            </div>
          </div>
        </div>

        {/* DETALHAMENTO DA EQUAÇÃO FINANCEIRA */}
        <div className={`mt-5 p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs ${
          isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-bold text-slate-400">Demonstrativo Unitário:</span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 font-bold">
              Preço Bruto: R$ {dreBase.precoMedioBrutoHl.toFixed(2)}/HL
            </span>
            <span className="text-slate-500 font-bold">-</span>
            <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-300 font-bold">
              Custo Prejuízo: R$ {dreBase.custoPrejuizoPorHl.toFixed(2)}/HL
            </span>
            <span className="text-slate-500 font-bold">=</span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 font-black">
              Receita Líquida Final: R$ {dreBase.receitaLiquidaPorHl.toFixed(2)}/HL
            </span>
          </div>

          <div className="text-slate-400 flex items-center gap-1 font-mono text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Faturamento Líquido: R$ {dreBase.faturamentoLiquidoRealizado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* 2. SIMULADOR DE REDUÇÃO DE PERDAS (FERRAMENTA ANALÍTICA) */}
      <div className={`p-6 rounded-3xl border ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Simulador Executivo: Meta de Redução de Perdas & Retorno Financeiro
              </h3>
              <p className="text-xs text-slate-400">
                Arraste o slider para mensurar o impacto direto de planos de ação (5S, FEFO, Repack) na margem por HL.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setReducaoSimuladaPct(10)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                reducaoSimuladaPct === 10 
                  ? 'bg-indigo-600 text-white border-indigo-500' 
                  : isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              -10%
            </button>
            <button
              type="button"
              onClick={() => setReducaoSimuladaPct(25)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                reducaoSimuladaPct === 25 
                  ? 'bg-indigo-600 text-white border-indigo-500' 
                  : isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              -25%
            </button>
            <button
              type="button"
              onClick={() => setReducaoSimuladaPct(50)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                reducaoSimuladaPct === 50 
                  ? 'bg-indigo-600 text-white border-indigo-500' 
                  : isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              -50%
            </button>
            <button
              type="button"
              onClick={() => setReducaoSimuladaPct(0)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                reducaoSimuladaPct === 0 
                  ? 'bg-slate-700 text-white border-slate-600' 
                  : isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500'
              }`}
            >
              Reset
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={reducaoSimuladaPct}
              onChange={(e) => setReducaoSimuladaPct(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <span className="font-black font-mono text-sm px-3 py-1 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 whitespace-nowrap">
              {reducaoSimuladaPct}% de redução
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="text-[11px] font-bold text-slate-400">Economia Direta em Caixa</div>
              <div className="text-lg font-black text-emerald-400 mt-0.5">
                +R$ {economiaReais.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Prejuízo cai para R$ {prejuizoSimuladoReais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            </div>

            <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="text-[11px] font-bold text-slate-400">Ganho no Custo do Hectolitro</div>
              <div className="text-lg font-black text-sky-400 mt-0.5">
                -R$ {reducaoCustoHl.toFixed(2)} <span className="text-xs font-normal">/ HL</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Custo de perda cai de R$ {dreBase.custoPrejuizoPorHl.toFixed(2)} para R$ {dreSimulada.custoPrejuizoPorHl.toFixed(2)}/HL</div>
            </div>

            <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="text-[11px] font-bold text-slate-400">Nova Margem Líquida por HL</div>
              <div className="text-lg font-black text-amber-400 mt-0.5">
                R$ {dreSimulada.receitaLiquidaPorHl.toFixed(2)} <span className="text-xs font-normal">/ HL</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Faturamento Líquido: R$ {dreSimulada.faturamentoLiquidoRealizado.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. GRÁFICOS ANALÍTICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico 1: Evolução Mensal Faturamento vs Volume 2026 */}
        <div className={`p-6 rounded-3xl border ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Faturamento (R$) & Volume (HL) por Mês
              </h3>
              <p className="text-[11px] text-slate-400">Comportamento sazonal e picos de volume (Março & Junho)</p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
              8 Meses Auditados
            </span>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={dreBase.meses} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} />
                <XAxis dataKey="mes" stroke="#94a3b8" fontSize={11} />
                <YAxis yAxisId="left" stroke="#10b981" fontSize={10} tickFormatter={(v) => `R$ ${(v / 1000000).toFixed(1)}M`} />
                <YAxis yAxisId="right" orientation="right" stroke="#38bdf8" fontSize={10} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: any, name: string) => {
                    if (name === 'Faturamento Bruto (R$)') return [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, name];
                    if (name === 'Volume 2026 (HL)') return [`${Number(value).toLocaleString('pt-BR')} HL`, name];
                    if (name === 'Volume 2025 (HL)') return [`${Number(value).toLocaleString('pt-BR')} HL`, name];
                    return [value, name];
                  }}
                  contentStyle={{
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderColor: isDark ? '#334155' : '#cbd5e1',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="faturamentoBruto" name="Faturamento Bruto (R$)" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="volumeHl2026" name="Volume 2026 (HL)" stroke="#38bdf8" strokeWidth={3} dot={{ r: 4 }} />
                <Line yAxisId="right" type="monotone" dataKey="volumeHl2025" name="Volume 2025 (HL)" stroke="#94a3b8" strokeDasharray="4 4" strokeWidth={2} dot={{ r: 2 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 2: Custo do Prejuízo por Hectolitro & Preço Médio */}
        <div className={`p-6 rounded-3xl border ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Unit Economics: Preço Médio vs Custo de Perda por HL
              </h3>
              <p className="text-[11px] text-slate-400">Relação direta entre volume produzido e absorção de perdas</p>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
              R$ {dreBase.custoPrejuizoPorHl.toFixed(2)}/HL Médio
            </span>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={dreBase.meses} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} />
                <XAxis dataKey="mes" stroke="#94a3b8" fontSize={11} />
                <YAxis yAxisId="left" stroke="#f59e0b" fontSize={10} tickFormatter={(v) => `R$ ${v.toFixed(0)}`} />
                <YAxis yAxisId="right" orientation="right" stroke="#f43f5e" fontSize={10} tickFormatter={(v) => `R$ ${v.toFixed(2)}`} />
                <Tooltip
                  formatter={(value: any, name: string) => {
                    return [`R$ ${Number(value).toFixed(2)} / HL`, name];
                  }}
                  contentStyle={{
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderColor: isDark ? '#334155' : '#cbd5e1',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}
                />
                <Legend />
                <Bar yAxisId="right" dataKey="custoPrejuizoPorHl" name="Custo Prejuízo / HL (R$)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                <Line yAxisId="left" type="monotone" dataKey="precoMedioBrutoHl" name="Preço Bruto / HL (R$)" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="left" type="monotone" dataKey="receitaLiquidaPorHl" name="Receita Líquida / HL (R$)" stroke="#38bdf8" strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. BREAKDOWN DOS 6 PILARES DO PACOTE PREJUÍZO VS IMPACTO NO HECTOLITRO */}
      <div className={`p-6 rounded-3xl border ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Distribuição do Pacote Prejuízo & Impacto por Hectolitro
            </h3>
            <p className="text-[11px] text-slate-400">
              Quanto cada categoria de perda onera cada hectolitro vendido pela revenda
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-400">6 Categorias Consolidadas</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pilaresBreakdown.map((pilar) => (
            <div
              key={pilar.key}
              className={`p-4 rounded-2xl border transition-all ${
                isDark ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: pilar.color }} />
                  <span className="font-bold text-xs text-white truncate">{pilar.label}</span>
                </div>
                <span className="text-[11px] font-black font-mono" style={{ color: pilar.color }}>
                  {pilar.pctPrejuizo}%
                </span>
              </div>

              <div className="text-lg font-black text-white">
                R$ {pilar.reais.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800/60 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px]">Custo por HL:</span>
                  <strong className="text-amber-400 font-mono">R$ {pilar.custoPorHl.toFixed(3)}/HL</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Volume Físico:</span>
                  <strong className="text-sky-400 font-mono">{pilar.hl.toFixed(3)} HL</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. TABELA DRE MENSAL CONSOLIDADA */}
      <div className={`p-6 rounded-3xl border ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Demonstrativo Mensal Consolidado (DRE & Volume Hectolitro)
            </h3>
            <p className="text-[11px] text-slate-400">
              Cruzamento de Faturamento, Volume 2026 vs 2025, Deduções de Perdas e Margem Líquida por HL
            </p>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Base Oficial 2026</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={`border-b ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
                <th className="py-3 px-3 font-bold">Mês</th>
                <th className="py-3 px-3 font-bold text-right">Faturamento Bruto</th>
                <th className="py-3 px-3 font-bold text-right">Volume 2026 (HL)</th>
                <th className="py-3 px-3 font-bold text-right">Volume 2025 (HL)</th>
                <th className="py-3 px-3 font-bold text-right">Preço Bruto / HL</th>
                <th className="py-3 px-3 font-bold text-right">Prejuízo Total (R$)</th>
                <th className="py-3 px-3 font-bold text-right">% s/ Fat.</th>
                <th className="py-3 px-3 font-bold text-right">Custo Perda / HL</th>
                <th className="py-3 px-3 font-bold text-right">Faturamento Líquido</th>
                <th className="py-3 px-3 font-bold text-right">Receita Líquida / HL</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-slate-800/60' : 'divide-slate-200'}`}>
              {dreBase.meses.map((m) => (
                <tr key={m.id} className={`hover:${isDark ? 'bg-slate-800/30' : 'bg-slate-50'} transition-all`}>
                  <td className="py-2.5 px-3 font-bold">
                    <div className="flex items-center gap-1.5">
                      <span>{m.mesLabel}</span>
                      {m.isPicoCritico && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Pico
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                    R$ {m.faturamentoBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-sky-400">
                    {m.volumeHl2026.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                    {m.volumeHl2025.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-300">
                    R$ {m.precoMedioBrutoHl.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-400">
                    -R$ {m.prejuizoReais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                    {m.pctPrejuizo.toFixed(3)}%
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-400">
                    R$ {m.custoPrejuizoPorHl.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-300">
                    R$ {m.faturamentoLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-black text-amber-300">
                    R$ {m.receitaLiquidaPorHl.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className={`border-t-2 ${isDark ? 'border-slate-700 bg-slate-950/80' : 'border-slate-300 bg-slate-100'} font-black text-xs`}>
                <td className="py-3 px-3">TOTAL OFICIAL</td>
                <td className="py-3 px-3 text-right text-emerald-400 font-mono">
                  R$ {dreBase.faturamentoBrutoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3 px-3 text-right text-sky-400 font-mono">
                  {dreBase.volumeTotalHl.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} HL
                </td>
                <td className="py-3 px-3 text-right text-slate-400 font-mono">
                  {VOLUME_TOTAL_2025_HL.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} HL
                </td>
                <td className="py-3 px-3 text-right text-slate-200 font-mono">
                  R$ {dreBase.precoMedioBrutoHl.toFixed(2)}
                </td>
                <td className="py-3 px-3 text-right text-rose-400 font-mono">
                  -R$ {dreBase.custoPrejuizoTotalReais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3 px-3 text-right text-slate-300 font-mono">
                  {dreBase.percentualPrejuizoSobreFaturamento.toFixed(3)}%
                </td>
                <td className="py-3 px-3 text-right text-amber-400 font-mono">
                  R$ {dreBase.custoPrejuizoPorHl.toFixed(2)}
                </td>
                <td className="py-3 px-3 text-right text-emerald-300 font-mono">
                  R$ {dreBase.faturamentoLiquidoRealizado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3 px-3 text-right text-amber-300 font-mono">
                  R$ {dreBase.receitaLiquidaPorHl.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
