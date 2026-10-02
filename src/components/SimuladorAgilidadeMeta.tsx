import React, { useState, useMemo } from 'react';
import { 
  Zap, 
  Clock, 
  TrendingUp, 
  Target, 
  SlidersHorizontal, 
  CheckCircle2, 
  AlertTriangle, 
  Box, 
  Activity,
  ArrowUpRight,
  TrendingDown,
  Sparkles,
  Info
} from 'lucide-react';

interface SimuladorAgilidadeProps {
  tipo: 'repack' | 'despejo';
  totalHectolitros: number;
  totalCaixasUnidades: number;
  tempoTotalMinutos: number;
  metaHectolitrosMensal?: number;
  metaCxHora?: number;
  diasUteisElapsed?: number;
  diasUteisTotal?: number;
}

export const SimuladorAgilidadeMeta: React.FC<SimuladorAgilidadeProps> = ({
  tipo,
  totalHectolitros,
  totalCaixasUnidades,
  tempoTotalMinutos,
  metaHectolitrosMensal = 450,
  metaCxHora = 10,
  diasUteisElapsed = 18,
  diasUteisTotal = 22
}) => {
  const isRepack = tipo === 'repack';
  const setorNome = isRepack ? 'Repack' : 'Despejo';
  const unitShort = isRepack ? 'cx' : 'un';
  const unitHora = isRepack ? 'cx/h' : 'un/h';
  const unitPlural = isRepack ? 'caixas' : 'unidades';
  const unitSingular = isRepack ? 'caixa' : 'unidade';

  // Active Simulation Tab: 'caixas_hora' | 'caixas_qtd' | 'tempo' | 'percentual'
  const [simMode, setSimMode] = useState<'caixas_hora' | 'tempo' | 'caixas_qtd' | 'percentual'>('caixas_hora');

  // Real Current Metrics
  const horasTrabalhadas = Math.max(0.1, tempoTotalMinutos / 60);
  const effectiveMetaCxHora = metaCxHora && metaCxHora > 0 ? metaCxHora : (isRepack ? 10 : 30);
  const agilidadeAtualCxHora = totalCaixasUnidades > 0 ? totalCaixasUnidades / horasTrabalhadas : (isRepack ? 10.0 : 32.0);
  const agilidadeAtualHlHora = totalHectolitros > 0 ? totalHectolitros / horasTrabalhadas : 1.89;
  const tempoMedioMinUnit = totalCaixasUnidades > 0 ? tempoTotalMinutos / totalCaixasUnidades : (isRepack ? 6.0 : (44 / 60)); // minutes per package
  const tempoMedioSecUnit = totalCaixasUnidades > 0 ? (tempoTotalMinutos * 60) / totalCaixasUnidades : (isRepack ? 360 : 44);
  const tempoMedioDiarioMin = diasUteisElapsed > 0 ? tempoTotalMinutos / diasUteisElapsed : (tempoTotalMinutos / 20);
  const hlPorCaixa = totalCaixasUnidades > 0 ? totalHectolitros / totalCaixasUnidades : 0.0035;

  // Format Helper
  const formatTimeHMS = (sec: number) => {
    sec = Math.max(0, Math.round(sec));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Simulation controls state with direct inputs
  const [simTargetCxHora, setSimTargetCxHora] = useState<number>(() => {
    return Math.round(agilidadeAtualCxHora > 0 ? agilidadeAtualCxHora : (isRepack ? 10 : 30));
  });
  const [simInputCxHoraText, setSimInputCxHoraText] = useState<string>(() => {
    return String(Math.round(agilidadeAtualCxHora > 0 ? agilidadeAtualCxHora : (isRepack ? 10 : 30)));
  });

  const [simTempoMin, setSimTempoMin] = useState<number>(() => Math.floor(tempoMedioMinUnit));
  const [simTempoSec, setSimTempoSec] = useState<number>(() => Math.round((tempoMedioMinUnit % 1) * 60));

  const [extraBoxes, setExtraBoxes] = useState<number>(50); // +50 boxes/units
  const [agilidadeBonusPct, setAgilidadeBonusPct] = useState<number>(10); // +10%

  // Meta Target: Average time per package with standard rate
  const metaTempoMedioMinUnit = effectiveMetaCxHora > 0 ? (60 / effectiveMetaCxHora) : (isRepack ? 6.0 : (50 / 60));
  const metaAgilidadeHlHora = effectiveMetaCxHora * hlPorCaixa;

  // SIMULATION CALCULATIONS BASED ON ACTIVE MODE
  const simResults = useMemo(() => {
    let simulatedCxHora = agilidadeAtualCxHora;
    let simulatedHlHora = agilidadeAtualHlHora;
    let simulatedTempoMinUnit = tempoMedioMinUnit;
    let tempoEconomizadoPorCaixaMin = 0;
    let simulatedTotalBoxes = totalCaixasUnidades;
    let simulatedTotalHl = totalHectolitros;

    if (simMode === 'caixas_hora') {
      // 1. Simulação direta por Unidades/Caixas por Hora digitado pelo usuário
      simulatedCxHora = Math.max(0.5, simTargetCxHora);
      simulatedHlHora = simulatedCxHora * hlPorCaixa;
      simulatedTempoMinUnit = 60 / simulatedCxHora;
      tempoEconomizadoPorCaixaMin = Math.max(0, tempoMedioMinUnit - simulatedTempoMinUnit);
      simulatedTotalBoxes = Math.round(simulatedCxHora * horasTrabalhadas);
      simulatedTotalHl = simulatedTotalBoxes * hlPorCaixa;

    } else if (simMode === 'tempo') {
      // 2. Simulação por tempo médio por embalagem (digitado em min e seg)
      const totalSec = Math.max(10, simTempoMin * 60 + simTempoSec);
      simulatedTempoMinUnit = totalSec / 60;
      tempoEconomizadoPorCaixaMin = Math.max(0, tempoMedioMinUnit - simulatedTempoMinUnit);
      simulatedCxHora = 60 / simulatedTempoMinUnit;
      simulatedHlHora = simulatedCxHora * hlPorCaixa;
      simulatedTotalBoxes = Math.round(simulatedCxHora * horasTrabalhadas);
      simulatedTotalHl = simulatedTotalBoxes * hlPorCaixa;

    } else if (simMode === 'caixas_qtd') {
      // 3. Simulação por acréscimo de caixas/unidades no lote/período
      simulatedTotalBoxes = Math.max(1, totalCaixasUnidades + extraBoxes);
      simulatedTotalHl = simulatedTotalBoxes * hlPorCaixa;
      simulatedCxHora = simulatedTotalBoxes / horasTrabalhadas;
      simulatedHlHora = simulatedTotalHl / horasTrabalhadas;
      simulatedTempoMinUnit = tempoTotalMinutos / simulatedTotalBoxes;
      tempoEconomizadoPorCaixaMin = Math.max(0, tempoMedioMinUnit - simulatedTempoMinUnit);

    } else {
      // 4. Simulação por ganho percentual de agilidade (%)
      const factor = 1 + agilidadeBonusPct / 100;
      simulatedCxHora = agilidadeAtualCxHora * factor;
      simulatedHlHora = agilidadeAtualHlHora * factor;
      simulatedTempoMinUnit = tempoMedioMinUnit * (1 / factor);
      tempoEconomizadoPorCaixaMin = Math.max(0, tempoMedioMinUnit - simulatedTempoMinUnit);
      simulatedTotalBoxes = Math.round(simulatedCxHora * horasTrabalhadas);
      simulatedTotalHl = simulatedTotalBoxes * hlPorCaixa;
    }

    // Tempo total economizado no período
    const tempoTotalEconomizadoMin = Math.round(tempoEconomizadoPorCaixaMin * totalCaixasUnidades);

    // Projeção Mensal
    const diasRestantes = Math.max(1, diasUteisTotal - diasUteisElapsed);
    const mediaDiariaSimuladaHl = simulatedHlHora * 8; // Turno de 8h
    const projecaoFechamentoHl = totalHectolitros + (mediaDiariaSimuladaHl * diasRestantes);
    const projecaoCaixasMes = Math.round(totalCaixasUnidades + (simulatedCxHora * 8 * diasRestantes));

    const bateuMeta = simulatedCxHora >= effectiveMetaCxHora;
    const diferencaMetaCxH = simulatedCxHora - effectiveMetaCxHora;
    const atingimentoPercent = Math.min(300, Math.round((projecaoFechamentoHl / Math.max(1, metaHectolitrosMensal)) * 100));

    return {
      simulatedCxHora,
      simulatedHlHora,
      simulatedTempoMinUnit,
      tempoEconomizadoPorCaixaMin,
      tempoTotalEconomizadoMin,
      simulatedTotalBoxes,
      simulatedTotalHl,
      projecaoFechamentoHl,
      projecaoCaixasMes,
      bateuMeta,
      diferencaMetaCxH,
      atingimentoPercent
    };
  }, [
    simMode, 
    simTargetCxHora, 
    simTempoMin, 
    simTempoSec, 
    extraBoxes, 
    agilidadeBonusPct, 
    agilidadeAtualCxHora, 
    agilidadeAtualHlHora, 
    tempoMedioMinUnit, 
    totalCaixasUnidades, 
    totalHectolitros, 
    horasTrabalhadas, 
    tempoTotalMinutos, 
    effectiveMetaCxHora, 
    metaHectolitrosMensal, 
    diasUteisTotal, 
    diasUteisElapsed, 
    hlPorCaixa
  ]);

  const handleSetSimCxHora = (val: number) => {
    const clamped = Math.max(1, Math.min(100, val));
    setSimTargetCxHora(clamped);
    setSimInputCxHoraText(String(clamped));
  };

  const handleInputChangeCxHora = (text: string) => {
    setSimInputCxHoraText(text);
    const num = parseFloat(text);
    if (!isNaN(num) && num > 0) {
      setSimTargetCxHora(Math.min(100, num));
    }
  };

  return (
    <div className="bg-white dark:bg-[#131d38] border border-gray-200 dark:border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-5">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-slate-800 pb-3.5">
        <div>
          <h3 className="font-sans font-black text-xs uppercase tracking-wider text-[#032b5e] dark:text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500 animate-pulse" />
            Simulador de Meta & Agilidade de Operador - {setorNome}
          </h3>
          <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">
            Simule o aumento de {unitPlural} ou redução de tempo por operação vs a meta oficial de {effectiveMetaCxHora} {unitHora}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-[10px] font-black bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-3 py-1 rounded-lg uppercase tracking-wider">
            Métrica Oficial DPO
          </span>
        </div>
      </div>

      {/* 4 PRIMARY DIAGNOSTIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* CARD 1: AGILIDADE ATUAL DO OPERADOR */}
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 flex items-center gap-3">
          <div className="p-2.5 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
              Média Atual do Operador
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black font-mono text-[#032b5e] dark:text-white">
                {agilidadeAtualCxHora.toFixed(1)}
              </span>
              <span className="text-xs font-bold text-slate-400 uppercase">{unitHora}</span>
              <span className="text-[10px] text-blue-500 font-mono font-bold ml-1">
                ({agilidadeAtualHlHora.toFixed(2)} HL/h)
              </span>
            </div>
            <span className="text-[9px] text-slate-500 font-bold uppercase block mt-0.5">
              Base: {totalCaixasUnidades.toLocaleString('pt-BR')} {unitShort} em {Math.round(tempoTotalMinutos)} min
            </span>
          </div>
        </div>

        {/* CARD 2: TEMPO MÉDIO ATUAL P/ EMBALAGEM / REGISTRO / DIÁRIO */}
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 flex items-center gap-3">
          <div className="p-2.5 bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 rounded-xl shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
              {isRepack ? 'Tempo Médio / Caixa' : 'Tempo Médio / Unidade'}
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black font-mono text-purple-700 dark:text-purple-300">
                {isRepack 
                  ? `${Math.floor(tempoMedioMinUnit)}m ${Math.round((tempoMedioMinUnit % 1) * 60).toString().padStart(2, '0')}s` 
                  : (tempoMedioSecUnit < 60 ? `${Math.round(tempoMedioSecUnit)}s` : `${Math.floor(tempoMedioSecUnit / 60)}m ${Math.round(tempoMedioSecUnit % 60)}s`)}
              </span>
              <span className="text-xs font-bold text-slate-400">/{unitShort}</span>
            </div>
            <span className="text-[9px] text-slate-500 font-bold uppercase block mt-0.5">
              {isRepack 
                ? `Média: ${tempoMedioMinUnit.toFixed(1)} min/cx` 
                : `Diário: ${Math.round(tempoMedioDiarioMin)} min/dia • Meta: < 50s`}
            </span>
          </div>
        </div>

        {/* CARD 3: META OFICIAL DPO */}
        <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl p-3.5 flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-black text-amber-800 dark:text-amber-300 uppercase tracking-wider block">
              Meta Oficial (Padrão)
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black font-mono text-amber-900 dark:text-amber-200">
                {effectiveMetaCxHora.toFixed(1)}
              </span>
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase">{unitHora}</span>
              <span className="text-[10px] text-amber-600 font-mono font-bold ml-1">
                ({metaAgilidadeHlHora.toFixed(2)} HL/h)
              </span>
            </div>
            <span className="text-[9px] text-amber-700 dark:text-amber-400 font-bold uppercase block mt-0.5">
              Alvo: {isRepack ? `${metaTempoMedioMinUnit.toFixed(1)} min/cx` : '< 50s / unidade (00:00:50)'}
            </span>
          </div>
        </div>

        {/* CARD 4: STATUS DA SIMULAÇÃO (VEREDITO) */}
        <div className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
          simResults.bateuMeta 
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700/80' 
            : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700/80'
        }`}>
          <div className={`p-2.5 rounded-xl shrink-0 ${
            simResults.bateuMeta 
              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300' 
              : 'bg-rose-500/20 text-rose-600 dark:text-rose-300'
          }`}>
            {simResults.bateuMeta ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          </div>
          <div>
            <span className={`text-[10px] font-black uppercase tracking-wider block ${
              simResults.bateuMeta ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'
            }`}>
              {simResults.bateuMeta ? '✅ BATE A META' : '❌ NÃO BATE A META'}
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className={`text-xl font-black font-mono ${
                simResults.bateuMeta ? 'text-emerald-800 dark:text-emerald-200' : 'text-rose-800 dark:text-rose-200'
              }`}>
                {simResults.simulatedCxHora.toFixed(1)}
              </span>
              <span className="text-xs font-bold text-slate-400 uppercase">{unitHora}</span>
            </div>
            <span className={`text-[9px] font-bold block mt-0.5 ${
              simResults.bateuMeta ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {simResults.diferencaMetaCxH >= 0 
                ? `+${simResults.diferencaMetaCxH.toFixed(1)} ${unitHora} acima da meta` 
                : `${Math.abs(simResults.diferencaMetaCxH).toFixed(1)} ${unitHora} abaixo`}
            </span>
          </div>
        </div>

      </div>

      {/* CONTROLES INTERATIVOS DO SIMULADOR (DUAS VIAS DE SIMULAÇÃO) */}
      <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-4">
        
        {/* TABS DE SELEÇÃO DO TIPO DE SIMULAÇÃO */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-700/80 pb-3">
          <div>
            <span className="text-xs font-black uppercase text-[#032b5e] dark:text-white tracking-wider flex items-center gap-1.5">
              <SlidersHorizontal className="w-4 h-4 text-amber-500" />
              Parâmetros de Simulação Interativa
            </span>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">
              Digite o ritmo de {unitHora} ou tempo por {unitSingular} para testar o atingimento da meta:
            </p>
          </div>

          <div className="flex flex-wrap items-center bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 gap-1">
            <button
              type="button"
              onClick={() => setSimMode('caixas_hora')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                simMode === 'caixas_hora'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              1. Digitar Ritmo ({unitHora.toUpperCase()})
            </button>
            <button
              type="button"
              onClick={() => setSimMode('tempo')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                simMode === 'tempo'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              2. Digitar Tempo (min/{unitShort})
            </button>
            <button
              type="button"
              onClick={() => setSimMode('caixas_qtd')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                simMode === 'caixas_qtd'
                  ? 'bg-[#032b5e] text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              3. Acréscimo (+{unitPlural.charAt(0).toUpperCase() + unitPlural.slice(1)})
            </button>
            <button
              type="button"
              onClick={() => setSimMode('percentual')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                simMode === 'percentual'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              4. Ganho Geral (%)
            </button>
          </div>
        </div>

        {/* MODO 1: SIMULAÇÃO DIRETA POR RITMO (CX/H OU REG/H) */}
        {simMode === 'caixas_hora' && (
          <div className="space-y-3 bg-amber-500/5 dark:bg-amber-500/10 p-3.5 rounded-xl border border-amber-500/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <span className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Digite o Ritmo Desejado em {unitPlural.charAt(0).toUpperCase() + unitPlural.slice(1)} por Hora ({unitHora.toUpperCase()}):
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                  Hoje a meta oficial é de <strong className="text-amber-500 font-mono">{metaCxHora} {unitHora}</strong>. Teste valores como 15, 20 ou 25 {unitHora}.
                </span>
              </div>

              {/* CAMPO DE DIGITAÇÃO DIRETA */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-white dark:bg-slate-900 border-2 border-amber-500 rounded-xl px-2 py-1 shadow-sm">
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="100"
                    value={simInputCxHoraText}
                    onChange={(e) => handleInputChangeCxHora(e.target.value)}
                    className="w-16 sm:w-20 text-center font-mono font-black text-lg text-amber-600 dark:text-amber-400 outline-none bg-transparent"
                    placeholder="20"
                  />
                  <span className="text-xs font-black text-slate-500 font-mono uppercase">{unitHora}</span>
                </div>
              </div>
            </div>

            {/* BOTÕES DE ATALHO RÁPIDO */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Atalhos:</span>
              {[
                { label: `${metaCxHora.toFixed(0)} ${unitHora} (Padrão)`, val: metaCxHora },
                { label: `15 ${unitHora}`, val: 15 },
                { label: `${agilidadeAtualCxHora.toFixed(1)} ${unitHora} (Média Real)`, val: Math.round(agilidadeAtualCxHora) },
                { label: `20 ${unitHora}`, val: 20 },
                { label: `25 ${unitHora}`, val: 25 },
                { label: `30 ${unitHora}`, val: 30 }
              ].map((btn, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSetSimCxHora(btn.val)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    Math.round(simTargetCxHora) === Math.round(btn.val)
                      ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-amber-400'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {/* SLIDER DE AJUSTE */}
            <div className="flex items-center gap-4 pt-1">
              <input
                type="range"
                min="1"
                max="60"
                step="0.5"
                value={simTargetCxHora}
                onChange={(e) => handleSetSimCxHora(Number(e.target.value))}
                className="flex-1 accent-amber-500 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
              />
              <span className="font-mono font-black text-amber-600 dark:text-amber-400 text-sm w-24 text-right">
                {simTargetCxHora.toFixed(1)} {unitHora}
              </span>
            </div>

            <div className="text-[11px] text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-lg border border-amber-500/20 flex items-center justify-between">
              <span>
                💡 A um ritmo de <strong>{simTargetCxHora.toFixed(1)} {unitHora}</strong>, o tempo necessário por {unitSingular} é de <strong className="text-purple-600 dark:text-purple-400 font-mono">{(60 / simTargetCxHora).toFixed(2)} min</strong> ({Math.floor(3600 / simTargetCxHora / 60)}m {Math.round((3600 / simTargetCxHora) % 60)}s).
              </span>
              <span className={`font-mono font-black px-2 py-0.5 rounded text-[10px] ${
                simResults.bateuMeta ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
              }`}>
                {simResults.bateuMeta ? `SUPERANDO META EM +${simResults.diferencaMetaCxH.toFixed(1)} ${unitHora.toUpperCase()}` : `FALTAM ${Math.abs(simResults.diferencaMetaCxH).toFixed(1)} ${unitHora.toUpperCase()}`}
              </span>
            </div>
          </div>
        )}

        {/* MODO 2: SIMULAÇÃO DIRETA POR TEMPO DE OPERAÇÃO */}
        {simMode === 'tempo' && (
          <div className="space-y-3 bg-purple-500/5 dark:bg-purple-500/10 p-3.5 rounded-xl border border-purple-500/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <span className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  Digite o Tempo Médio Alvo por {unitSingular.charAt(0).toUpperCase() + unitSingular.slice(1)} (Minutos : Segundos):
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                  A média real atual é <strong className="text-purple-600 dark:text-purple-400 font-mono">{tempoMedioMinUnit.toFixed(2)} min</strong> ({Math.floor(tempoMedioMinUnit)}m {Math.round((tempoMedioMinUnit % 1) * 60)}s). Diminua o tempo para testar o ganho.
                </span>
              </div>

              {/* CAMPOS DE DIGITAÇÃO DE MINUTOS E SEGUNDOS */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border-2 border-purple-500 rounded-xl px-2.5 py-1 shadow-sm">
                  <div className="flex items-center gap-0.5">
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={simTempoMin}
                      onChange={(e) => setSimTempoMin(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-10 text-center font-mono font-black text-lg text-purple-600 dark:text-purple-300 outline-none bg-transparent"
                    />
                    <span className="text-xs font-bold text-slate-400">min</span>
                  </div>
                  <span className="text-base font-black text-purple-400">:</span>
                  <div className="flex items-center gap-0.5">
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={simTempoSec}
                      onChange={(e) => setSimTempoSec(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                      className="w-10 text-center font-mono font-black text-lg text-purple-600 dark:text-purple-300 outline-none bg-transparent"
                    />
                    <span className="text-xs font-bold text-slate-400">seg</span>
                  </div>
                </div>
              </div>
            </div>

            {/* BOTÕES DE ATALHO RÁPIDO */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Predefinições:</span>
              {(isRepack ? [
                { label: '06:00 (Meta 10 cx/h)', min: 6, sec: 0 },
                { label: '05:30 (Lata 350)', min: 5, sec: 30 },
                { label: '04:30 (Lata 269)', min: 4, sec: 30 },
                { label: `${Math.floor(tempoMedioMinUnit)}:${Math.round((tempoMedioMinUnit % 1) * 60).toString().padStart(2, '0')} (Média)`, min: Math.floor(tempoMedioMinUnit), sec: Math.round((tempoMedioMinUnit % 1) * 60) },
                { label: '03:00 (20 cx/h)', min: 3, sec: 0 }
              ] : [
                { label: '00:50 (Meta DPO 50s)', min: 0, sec: 50 },
                { label: '00:44 (Média Real 44s)', min: 0, sec: 44 },
                { label: '00:40 (45 un/h)', min: 0, sec: 40 },
                { label: '00:30 (60 un/h)', min: 0, sec: 30 },
                { label: '01:00 (30 un/h)', min: 1, sec: 0 }
              ]).map((btn, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSimTempoMin(btn.min);
                    setSimTempoSec(btn.sec);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    simTempoMin === btn.min && simTempoSec === btn.sec
                      ? 'bg-purple-600 text-white font-black shadow-xs'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-purple-400'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {/* SLIDER DE TEMPO */}
            <div className="flex items-center gap-4 pt-1">
              <input
                type="range"
                min="30"
                max="480"
                step="5"
                value={simTempoMin * 60 + simTempoSec}
                onChange={(e) => {
                  const total = Number(e.target.value);
                  setSimTempoMin(Math.floor(total / 60));
                  setSimTempoSec(total % 60);
                }}
                className="flex-1 accent-purple-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
              />
              <span className="font-mono font-black text-purple-600 dark:text-purple-400 text-sm w-28 text-right">
                {simTempoMin.toString().padStart(2, '0')}:{simTempoSec.toString().padStart(2, '0')} min/{unitShort}
              </span>
            </div>

            <div className="text-[11px] text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-lg border border-purple-500/20 flex items-center justify-between">
              <span>
                💡 Com esse tempo médio de <strong>{simTempoMin}m {simTempoSec}s por {unitSingular}</strong>, o ritmo gerado é de <strong className="text-amber-600 dark:text-amber-400 font-mono">{simResults.simulatedCxHora.toFixed(1)} {unitHora}</strong>.
              </span>
              <span className={`font-mono font-black px-2 py-0.5 rounded text-[10px] ${
                simResults.bateuMeta ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
              }`}>
                {simResults.bateuMeta ? 'META 1 ATINGIDA' : 'ABAIXO DA META'}
              </span>
            </div>
          </div>
        )}

        {/* MODO 3: SIMULAÇÃO POR ACRÉSCIMO DE QUANTIDADES */}
        {simMode === 'caixas_qtd' && (
          <div className="space-y-3 bg-blue-500/5 dark:bg-blue-500/10 p-3.5 rounded-xl border border-blue-500/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <Box className="w-4 h-4 text-blue-500" />
                  Acréscimo de {unitPlural.charAt(0).toUpperCase() + unitPlural.slice(1)} Processados no Período (+Qtd):
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                  Simule o efeito de realizar {unitPlural} adicionais na mesma carga horária.
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center bg-white dark:bg-slate-900 border-2 border-blue-500 rounded-xl px-2 py-1 shadow-sm">
                  <input
                    type="number"
                    min="0"
                    max="1000"
                    step="10"
                    value={extraBoxes}
                    onChange={(e) => setExtraBoxes(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-16 sm:w-20 text-center font-mono font-black text-lg text-blue-600 dark:text-blue-400 outline-none bg-transparent"
                  />
                  <span className="text-xs font-black text-slate-500 font-mono uppercase">+{unitShort}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Atalhos:</span>
              {[0, 20, 50, 100, 200, 500].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setExtraBoxes(val)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    extraBoxes === val
                      ? 'bg-blue-600 text-white font-black shadow-xs'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-400'
                  }`}
                >
                  +{val} {unitShort}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4 pt-1">
              <input
                type="range"
                min="0"
                max="500"
                step="5"
                value={extraBoxes}
                onChange={(e) => setExtraBoxes(Number(e.target.value))}
                className="flex-1 accent-blue-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
              />
              <span className="font-mono font-black text-blue-600 dark:text-blue-400 text-sm w-24 text-right">
                +{extraBoxes} {unitPlural}
              </span>
            </div>
          </div>
        )}

        {/* MODO 4: SIMULAÇÃO POR GANHO GERAL PERCENTUAL */}
        {simMode === 'percentual' && (
          <div className="space-y-3 bg-emerald-500/5 dark:bg-emerald-500/10 p-3.5 rounded-xl border border-emerald-500/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  Ganho Geral de Eficiência / Agilidade (+%):
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                  Aplica um multiplicador percentual de aceleração sobre o processo do setor {setorNome}.
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center bg-white dark:bg-slate-900 border-2 border-emerald-500 rounded-xl px-2 py-1 shadow-sm">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={agilidadeBonusPct}
                    onChange={(e) => setAgilidadeBonusPct(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-16 text-center font-mono font-black text-lg text-emerald-600 dark:text-emerald-400 outline-none bg-transparent"
                  />
                  <span className="text-xs font-black text-slate-500 font-mono">%</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Atalhos:</span>
              {[0, 5, 10, 15, 20, 30, 50].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAgilidadeBonusPct(val)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    agilidadeBonusPct === val
                      ? 'bg-emerald-600 text-white font-black shadow-xs'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-400'
                  }`}
                >
                  +{val}%
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4 pt-1">
              <input
                type="range"
                min="0"
                max="50"
                step="1"
                value={agilidadeBonusPct}
                onChange={(e) => setAgilidadeBonusPct(Number(e.target.value))}
                className="flex-1 accent-emerald-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
              />
              <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm w-20 text-right">
                +{agilidadeBonusPct}%
              </span>
            </div>
          </div>
        )}

        {/* BARRA DE RESULTADOS DETALHADOS DA SIMULAÇÃO */}
        <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">
              Nova Agilidade Simulada
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="font-mono font-black text-amber-600 dark:text-amber-400 text-base">
                {simResults.simulatedCxHora.toFixed(1)} {unitHora.toUpperCase()}
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                ({simResults.simulatedHlHora.toFixed(2)} HL/h)
              </span>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">
              Tempo Otimizado p/ {unitSingular.charAt(0).toUpperCase() + unitSingular.slice(1)}
            </span>
            <span className="font-mono font-black text-purple-600 dark:text-purple-400 text-base block mt-0.5">
              {simResults.simulatedTempoMinUnit.toFixed(2)} min
            </span>
            <span className="text-[9px] text-slate-400 block font-medium">
              {simResults.tempoEconomizadoPorCaixaMin > 0 
                ? `${(simResults.tempoEconomizadoPorCaixaMin * 60).toFixed(0)}s economizados/${unitShort}`
                : 'Ritmo atual de base'}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">
              Tempo Total Economizado
            </span>
            <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-base block mt-0.5">
              {simResults.tempoTotalEconomizadoMin} min
            </span>
            <span className="text-[9px] text-slate-400 block font-medium">
              Equivale a {(simResults.tempoTotalEconomizadoMin / 60).toFixed(1)}h de trabalho
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">
              Projeção Mensal Calculada
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-base">
                {simResults.projecaoFechamentoHl.toFixed(1)} HL
              </span>
              <span className="text-[10px] font-bold text-emerald-500">
                ({simResults.atingimentoPercent}% da Meta)
              </span>
            </div>
            <span className="text-[9px] text-slate-400 block font-medium">
              Total: {simResults.projecaoCaixasMes.toLocaleString('pt-BR')} {unitPlural} estimadas
            </span>
          </div>

        </div>

        {/* VEREDITO FINAL EXPANDIDO */}
        <div className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          simResults.bateuMeta 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200' 
            : 'bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-200'
        }`}>
          <div className="flex items-center gap-2.5">
            {simResults.bateuMeta ? (
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-500 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
            )}
            <div>
              <span className="text-xs font-black uppercase tracking-wide block">
                {simResults.bateuMeta ? 'Veredito: Bate a Meta com Sucesso!' : 'Veredito: Ritmo Abaixo da Meta Oficial'}
              </span>
              <p className="text-[11px] opacity-90">
                {simResults.bateuMeta 
                  ? `Com esta simulação, o ritmo de ${simResults.simulatedCxHora.toFixed(1)} ${unitHora} supera o padrão mínimo de ${metaCxHora} ${unitHora} com folga de +${simResults.diferencaMetaCxH.toFixed(1)} ${unitHora}.`
                  : `Com o ritmo simulado de ${simResults.simulatedCxHora.toFixed(1)} ${unitHora}, ainda faltam ${Math.abs(simResults.diferencaMetaCxH).toFixed(1)} ${unitHora} para atingir a meta oficial de ${metaCxHora} ${unitHora}.`}
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <span className={`px-3 py-1 rounded-lg text-xs font-black font-mono ${
              simResults.bateuMeta 
                ? 'bg-emerald-600 text-white' 
                : 'bg-rose-600 text-white'
            }`}>
              {simResults.bateuMeta ? 'META 1 BATIDA' : 'FORA DA META'}
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};
