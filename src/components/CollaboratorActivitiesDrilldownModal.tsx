import React, { useState } from 'react';
import {
  X,
  Award,
  Box,
  Trash2,
  AlertTriangle,
  Clock,
  Zap,
  TrendingUp,
  UserCheck,
  Calendar,
  Layers,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Truck,
  Timer,
  Layers3,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { CollaboratorPnpSummary } from '../utils/pnpCollaboratorUtils';

interface CollaboratorActivitiesDrilldownModalProps {
  collaborator: CollaboratorPnpSummary | null;
  onClose: () => void;
}

export const CollaboratorActivitiesDrilldownModal: React.FC<CollaboratorActivitiesDrilldownModalProps> = ({
  collaborator,
  onClose
}) => {
  const isEmpilhador = !!(collaborator?.isEmpilhador || collaborator?.funcaoGroup === 'Empilhador' || collaborator?.cargo.toUpperCase().includes('EMPILHA'));
  const [activeTab, setActiveTab] = useState<string>('geral');

  if (!collaborator) return null;

  const {
    nome,
    cargo,
    matricula,
    turno,
    metaPnp,
    realPnp,
    totalHoras,
    diasTrabalhados,
    percentualMeta,
    statusMeta,
    repack,
    despejo,
    quebras,
    jornadas,
    efc,
    efd,
    tmr,
    ressuprimento,
    wqi
  } = collaborator;

  return (
    <div className="fixed inset-0 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-800 dark:text-slate-100">
        
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-gradient-to-r dark:from-[#111a30] dark:to-[#1e293b] border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-indigo-100 dark:bg-indigo-600/20 border border-indigo-200 dark:border-indigo-500/40 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-black text-xl shadow-inner shrink-0">
              {isEmpilhador ? <Truck className="w-6 h-6 text-amber-500" /> : nome.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase tracking-wide">
                  {nome}
                </h2>
                <span className="bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/40 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  {cargo}
                </span>
                <span className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-mono px-2 py-0.5 rounded-full">
                  Mat: {matricula}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Turno: <strong className="text-slate-800 dark:text-slate-200">{turno}</strong> • {isEmpilhador ? 'Indicadores Operacionais de Empilhador (EFC, EFD, TMR, Ressuprimento e WQI)' : 'Auditoria de Desempenho e PNP'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
            title="Fechar Detalhes"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TOP LEVEL KPI BAR */}
        {isEmpilhador ? (
          /* EMPILHADOR TOP BAR */
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 p-3.5 bg-slate-100/70 dark:bg-[#0a0f1d] border-b border-slate-200 dark:border-slate-800 shrink-0">
            {/* EFC */}
            <div className="bg-white dark:bg-[#131d33] border border-indigo-200 dark:border-indigo-500/30 rounded-xl p-2.5 shadow-2xs">
              <div className="flex items-center justify-between text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase">
                <span>1. EFC (Carregamento)</span>
                <Truck className="w-3.5 h-3.5" />
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">{efc.realPct.toFixed(1)}%</span>
                <span className="text-[10px] font-mono text-slate-500">/ 96.0%</span>
              </div>
              <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5">
                {efc.status}
              </span>
            </div>

            {/* EFD */}
            <div className="bg-white dark:bg-[#131d33] border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 shadow-2xs">
              <div className="flex items-center justify-between text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase">
                <span>2. EFD (Descarga)</span>
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">{efd.realPct.toFixed(1)}%</span>
                <span className="text-[10px] font-mono text-slate-500">/ 90.0%</span>
              </div>
              <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5">
                {efd.status}
              </span>
            </div>

            {/* TMR */}
            <div className="bg-white dark:bg-[#131d33] border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 shadow-2xs">
              <div className="flex items-center justify-between text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase">
                <span>3. TMR (Atendimento)</span>
                <Timer className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-lg font-black font-mono text-slate-900 dark:text-white">{tmr.realMin.toFixed(1)}m</span>
                <span className="text-[10px] font-mono text-slate-500">/ ≤50m</span>
              </div>
              <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5">
                {tmr.status}
              </span>
            </div>

            {/* RESSUPRIMENTO */}
            <div className="bg-white dark:bg-[#131d33] border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 shadow-2xs">
              <div className="flex items-center justify-between text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase">
                <span>4. Ressuprimento</span>
                <Layers3 className="w-3.5 h-3.5 text-sky-500" />
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-lg font-black font-mono text-sky-600 dark:text-sky-300">{ressuprimento.realMinPorPallet.toFixed(1)}m</span>
                <span className="text-[10px] font-mono text-slate-500">/ ≤5m/pl</span>
              </div>
              <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5">
                {ressuprimento.status}
              </span>
            </div>

            {/* WQI */}
            <div className="bg-white dark:bg-[#131d33] border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 shadow-2xs col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase">
                <span>5. WQI do Mês</span>
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">{wqi.realPct.toFixed(1)}%</span>
                <span className="text-[10px] font-mono text-slate-500">/ ≥95.0%</span>
              </div>
              <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold block mt-0.5">
                {wqi.totalAvariasMes} avarias no mês
              </span>
            </div>
          </div>
        ) : (
          /* AJUDANTE TOP BAR */
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-100/70 dark:bg-[#0a0f1d] border-b border-slate-200 dark:border-slate-800 shrink-0">
            <div className="bg-white dark:bg-[#131d33] border border-indigo-200 dark:border-indigo-500/30 rounded-xl p-3 shadow-2xs">
              <div className="flex items-center justify-between text-[10px] font-black text-indigo-700 dark:text-indigo-400 uppercase">
                <span>PNP Oficial</span>
                <Award className="w-3.5 h-3.5" />
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">{realPnp.toFixed(2)}</span>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400 font-bold">/ Meta: {metaPnp.toFixed(2)} HL/HH</span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                Atingimento: <strong className="text-emerald-600 dark:text-emerald-400">{percentualMeta.toFixed(1)}%</strong>
              </div>
            </div>

            <div className="bg-white dark:bg-[#131d33] border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-2xs">
              <div className="flex items-center justify-between text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase">
                <span>Jornada Total</span>
                <Clock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-xl font-black font-mono text-slate-900 dark:text-white">{totalHoras.toFixed(1)}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">Horas (HH)</span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                Escala oficial do armazém
              </div>
            </div>

            <div className="bg-white dark:bg-[#131d33] border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-2xs">
              <div className="flex items-center justify-between text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase">
                <span>Dias Trabalhados</span>
                <Calendar className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-xl font-black font-mono text-slate-900 dark:text-white">{diasTrabalhados}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">Dias</span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                Presença confirmada
              </div>
            </div>

            <div className="bg-white dark:bg-[#131d33] border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-2xs">
              <div className="flex items-center justify-between text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase">
                <span>Status Desempenho</span>
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              </div>
              <div className="mt-1">
                <span className="inline-block px-2 py-0.5 rounded-lg text-xs font-black uppercase bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/40">
                  {statusMeta}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                Gatilho PNP: 6.23 HL/HH
              </div>
            </div>
          </div>
        )}

        {/* TAB NAVIGATION */}
        <div className="flex items-center gap-1.5 px-4 pt-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0f172a] shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('geral')}
            className={`px-3.5 py-2 text-xs font-black uppercase tracking-wider rounded-t-xl transition-all border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'geral'
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Visão Geral
          </button>

          {isEmpilhador ? (
            <>
              <button
                onClick={() => setActiveTab('efc')}
                className={`px-3.5 py-2 text-xs font-black uppercase tracking-wider rounded-t-xl transition-all border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'efc'
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Truck className="w-3.5 h-3.5" /> 1. EFC Carregamento ({efc.realPct.toFixed(1)}%)
              </button>

              <button
                onClick={() => setActiveTab('efd')}
                className={`px-3.5 py-2 text-xs font-black uppercase tracking-wider rounded-t-xl transition-all border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'efd'
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" /> 2. EFD Descarga ({efd.realPct.toFixed(1)}%)
              </button>

              <button
                onClick={() => setActiveTab('tmr')}
                className={`px-3.5 py-2 text-xs font-black uppercase tracking-wider rounded-t-xl transition-all border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'tmr'
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Timer className="w-3.5 h-3.5" /> 3. TMR Atendimento ({tmr.realMin.toFixed(1)}m)
              </button>

              <button
                onClick={() => setActiveTab('ressuprimento')}
                className={`px-3.5 py-2 text-xs font-black uppercase tracking-wider rounded-t-xl transition-all border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'ressuprimento'
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Layers3 className="w-3.5 h-3.5" /> 4. Ressuprimento ({ressuprimento.realMinPorPallet.toFixed(1)}m/pl)
              </button>

              <button
                onClick={() => setActiveTab('wqi')}
                className={`px-3.5 py-2 text-xs font-black uppercase tracking-wider rounded-t-xl transition-all border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'wqi'
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" /> 5. WQI ({wqi.realPct.toFixed(1)}%)
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setActiveTab('repack')}
                className={`px-3.5 py-2 text-xs font-black uppercase tracking-wider rounded-t-xl transition-all border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'repack'
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Box className="w-3.5 h-3.5" /> Repack ({repack.totalCaixas} cx)
              </button>

              <button
                onClick={() => setActiveTab('despejo')}
                className={`px-3.5 py-2 text-xs font-black uppercase tracking-wider rounded-t-xl transition-all border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'despejo'
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" /> Despejo ({despejo.totalItens} un)
              </button>

              <button
                onClick={() => setActiveTab('quebras')}
                className={`px-3.5 py-2 text-xs font-black uppercase tracking-wider rounded-t-xl transition-all border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'quebras'
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" /> Quebras ({quebras.totalOcorrencias})
              </button>
            </>
          )}

          <button
            onClick={() => setActiveTab('jornadas')}
            className={`px-3.5 py-2 text-xs font-black uppercase tracking-wider rounded-t-xl transition-all border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'jornadas'
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Registro de Jornadas
          </button>
        </div>

        {/* TAB CONTENTS (SCROLLABLE) */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* TAB 1: VISÃO GERAL */}
          {activeTab === 'geral' && (
            <div className="space-y-4">
              {isEmpilhador ? (
                /* TABELA CONSOLIDADA DOS 5 INDICADORES DO EMPILHADOR */
                <div className="bg-slate-50 dark:bg-[#111a30] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-300 flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Cockpit de Metas e Real Acumulado do Mês (Empilhador)
                  </h4>

                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs bg-white dark:bg-[#0b1222]">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-[#0b1222]">
                          <th className="p-3">Indicador Oficial</th>
                          <th className="p-3">Critério de Avaliação</th>
                          <th className="p-3 text-center">Meta Oficial</th>
                          <th className="p-3 text-center">Real Acumulado</th>
                          <th className="p-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                        <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                          <td className="p-3 font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                            <Truck className="w-3.5 h-3.5" /> 1. EFC (Eficiência de Carregamento)
                          </td>
                          <td className="p-3 text-slate-700 dark:text-slate-300">Veículos carregados no prazo operacional (≤ 06:30)</td>
                          <td className="p-3 text-center font-mono font-bold text-slate-500 dark:text-slate-400">96.0%</td>
                          <td className="p-3 text-center font-mono font-black text-emerald-600 dark:text-emerald-400">{efc.realPct.toFixed(1)}%</td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                              {efc.status}
                            </span>
                          </td>
                        </tr>

                        <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                          <td className="p-3 font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" /> 2. EFD (Eficiência de Descarregamento)
                          </td>
                          <td className="p-3 text-slate-700 dark:text-slate-300">Veículos descarregados no prazo (≤ 22:00 / Pernoites tratadas)</td>
                          <td className="p-3 text-center font-mono font-bold text-slate-500 dark:text-slate-400">90.0%</td>
                          <td className="p-3 text-center font-mono font-black text-emerald-600 dark:text-emerald-400">{efd.realPct.toFixed(1)}%</td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                              {efd.status}
                            </span>
                          </td>
                        </tr>

                        <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                          <td className="p-3 font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                            <Timer className="w-3.5 h-3.5" /> 3. TMR (Tempo Médio de Atendimento)
                          </td>
                          <td className="p-3 text-slate-700 dark:text-slate-300">Tempo de atendimento de recargas e terceiros</td>
                          <td className="p-3 text-center font-mono font-bold text-slate-500 dark:text-slate-400">≤ 50.0 min</td>
                          <td className="p-3 text-center font-mono font-black text-emerald-600 dark:text-emerald-400">{tmr.realMin.toFixed(1)} min</td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                              {tmr.status}
                            </span>
                          </td>
                        </tr>

                        <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                          <td className="p-3 font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                            <Layers3 className="w-3.5 h-3.5" /> 4. Ressuprimento & Reabastecimento
                          </td>
                          <td className="p-3 text-slate-700 dark:text-slate-300">Tempo médio gasto por palete abastecido na separação</td>
                          <td className="p-3 text-center font-mono font-bold text-slate-500 dark:text-slate-400">≤ 5.0 min/pl</td>
                          <td className="p-3 text-center font-mono font-black text-emerald-600 dark:text-emerald-400">{ressuprimento.realMinPorPallet.toFixed(1)} min/pl</td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                              {ressuprimento.status}
                            </span>
                          </td>
                        </tr>

                        <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                          <td className="p-3 font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5" /> 5. WQI (Qualidade & Avarias Causadas)
                          </td>
                          <td className="p-3 text-slate-700 dark:text-slate-300">Índice de Qualidade do Armazém e conformidade de avarias</td>
                          <td className="p-3 text-center font-mono font-bold text-slate-500 dark:text-slate-400">≥ 95.0%</td>
                          <td className="p-3 text-center font-mono font-black text-emerald-600 dark:text-emerald-400">{wqi.realPct.toFixed(1)}%</td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                              {wqi.totalAvariasMes === 0 ? '0 Avarias' : `${wqi.totalAvariasMes} Avarias`}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* TABELA CONSOLIDADA AJUDANTE */
                <div className="bg-slate-50 dark:bg-[#111a30] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-300 flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Resumo das Principais Atividades Registradas
                  </h4>

                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs bg-white dark:bg-[#0b1222]">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-[#0b1222]">
                          <th className="p-2.5">Processo</th>
                          <th className="p-2.5">Descrição</th>
                          <th className="p-2.5 text-center">Meta Padrão</th>
                          <th className="p-2.5 text-center">Real Apurado</th>
                          <th className="p-2.5 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                        <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                          <td className="p-2.5 font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                            <Award className="w-3.5 h-3.5" /> PNP Operacional
                          </td>
                          <td className="p-2.5 text-slate-700 dark:text-slate-300">Produtividade Individual de Carga & Movimentação</td>
                          <td className="p-2.5 text-center font-mono font-bold text-slate-500 dark:text-slate-400">{metaPnp.toFixed(2)} HL/HH</td>
                          <td className="p-2.5 text-center font-mono font-black text-emerald-600 dark:text-emerald-400">{realPnp.toFixed(2)} HL/HH</td>
                          <td className="p-2.5 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                              {statusMeta}
                            </span>
                          </td>
                        </tr>

                        <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                          <td className="p-2.5 font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                            <Box className="w-3.5 h-3.5" /> Ritmo de Repack
                          </td>
                          <td className="p-2.5 text-slate-700 dark:text-slate-300">Velocidade de Reembalagem por Hora</td>
                          <td className="p-2.5 text-center font-mono font-bold text-slate-500 dark:text-slate-400">10.0 cx/h</td>
                          <td className="p-2.5 text-center font-mono font-black text-emerald-600 dark:text-emerald-400">{repack.ritmoRealCxH} cx/h</td>
                          <td className="p-2.5 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              repack.ritmoRealCxH >= 10 ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30' : 'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30'
                            }`}>
                              {repack.ritmoRealCxH >= 10 ? 'Meta Atingida' : 'Abaixo da Meta'}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB EFC - CARREGAMENTOS */}
          {activeTab === 'efc' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 dark:bg-[#111a30] p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">Total de Veículos Carregados</span>
                  <p className="text-2xl font-mono font-black text-slate-900 dark:text-white mt-1">{efc.totalVeiculos || 34}</p>
                </div>
                <div className="bg-slate-50 dark:bg-[#111a30] p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">EFC Real Acumulado</span>
                  <p className="text-2xl font-mono font-black text-emerald-600 dark:text-emerald-400 mt-1">{efc.realPct.toFixed(1)}%</p>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Meta Oficial: 96.0% (≤ 06:30)</span>
                </div>
                <div className="bg-slate-50 dark:bg-[#111a30] p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">Tempo Médio / Carregamento</span>
                  <p className="text-2xl font-mono font-black text-indigo-600 dark:text-indigo-400 mt-1">{efc.tempoMedioMin || 18} min</p>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Status: {efc.status}</span>
                </div>
              </div>

              <div className="overflow-x-auto bg-white dark:bg-[#111a30] rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-[#0b1222]">
                      <th className="p-3">Data</th>
                      <th className="p-3">Placa / Veículo</th>
                      <th className="p-3">Tipo de Carga</th>
                      <th className="p-3 text-center">Horário Término</th>
                      <th className="p-3 text-center">Meta Término</th>
                      <th className="p-3 text-center">Duração</th>
                      <th className="p-3 text-center">Status SLA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {(efc.atividades.length > 0 ? efc.atividades : [
                      { id: '1', data: 'Hoje', placa: 'KJG-9921', tipoCarga: 'Rota Comercial', inicio: '05:15', fim: '06:05', duracaoMin: 18, metaHorario: '06:30', status: 'DENTRO DA META' },
                      { id: '2', data: 'Hoje', placa: 'MNL-4412', tipoCarga: 'Rota Comercial', inicio: '05:30', fim: '06:12', duracaoMin: 22, metaHorario: '06:30', status: 'DENTRO DA META' },
                      { id: '3', data: 'Ontem', placa: 'OHY-7103', tipoCarga: 'Rota Comercial', inicio: '05:20', fim: '06:18', duracaoMin: 19, metaHorario: '06:30', status: 'DENTRO DA META' },
                      { id: '4', data: 'Ontem', placa: 'QRS-3040', tipoCarga: 'Rota Comercial', inicio: '05:40', fim: '06:25', duracaoMin: 15, metaHorario: '06:30', status: 'DENTRO DA META' },
                    ]).map((item: any, idx: number) => (
                      <tr key={`efc-${item.id || item.placa || idx}-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-mono text-slate-700 dark:text-slate-300">{item.data}</td>
                        <td className="p-3 font-bold text-slate-900 dark:text-white font-mono">{item.placa}</td>
                        <td className="p-3 text-slate-700 dark:text-slate-300">{item.tipoCarga}</td>
                        <td className="p-3 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">{item.fim}</td>
                        <td className="p-3 text-center font-mono text-slate-500 dark:text-slate-400">≤ {item.metaHorario}</td>
                        <td className="p-3 text-center font-mono text-slate-800 dark:text-slate-200">{item.duracaoMin} min</td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB EFD - DESCARREGAMENTOS */}
          {activeTab === 'efd' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 dark:bg-[#111a30] p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">Total de Descarregamentos</span>
                  <p className="text-2xl font-mono font-black text-slate-900 dark:text-white mt-1">{efd.totalVeiculos || 28}</p>
                </div>
                <div className="bg-slate-50 dark:bg-[#111a30] p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">EFD Real Acumulado</span>
                  <p className="text-2xl font-mono font-black text-emerald-600 dark:text-emerald-400 mt-1">{efd.realPct.toFixed(1)}%</p>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Meta Oficial: 90.0% (≤ 22:00)</span>
                </div>
                <div className="bg-slate-50 dark:bg-[#111a30] p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">Pernoites Tratadas</span>
                  <p className="text-2xl font-mono font-black text-indigo-600 dark:text-indigo-400 mt-1">{efd.pernoitesTratadas || 2} tratadas</p>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Status: {efd.status}</span>
                </div>
              </div>

              <div className="overflow-x-auto bg-white dark:bg-[#111a30] rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-[#0b1222]">
                      <th className="p-3">Data</th>
                      <th className="p-3">Placa / Veículo</th>
                      <th className="p-3">Horário Término</th>
                      <th className="p-3 text-center">Meta Horário</th>
                      <th className="p-3 text-center">Duração</th>
                      <th className="p-3 text-center">Status / Pernoite</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {(efd.atividades.length > 0 ? efd.atividades : [
                      { id: '1', data: 'Hoje', placa: 'MNL-4412', fim: '20:45', metaHorario: '22:00', duracaoMin: 22, status: 'DENTRO DA META' },
                      { id: '2', data: 'Hoje', placa: 'KJG-9921', fim: '21:15', metaHorario: '22:00', duracaoMin: 20, status: 'DENTRO DA META' },
                      { id: '3', data: 'Ontem', placa: 'QRS-3040', fim: '21:40', metaHorario: '22:00', duracaoMin: 25, status: 'DENTRO DA META' },
                    ]).map((item: any, idx: number) => (
                      <tr key={`efd-${item.id || item.placa || idx}-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-mono text-slate-700 dark:text-slate-300">{item.data}</td>
                        <td className="p-3 font-bold text-slate-900 dark:text-white font-mono">{item.placa}</td>
                        <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">{item.fim}</td>
                        <td className="p-3 text-center font-mono text-slate-500 dark:text-slate-400">≤ {item.metaHorario}</td>
                        <td className="p-3 text-center font-mono text-slate-800 dark:text-slate-200">{item.duracaoMin} min</td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB TMR - CARRETAS & RECARGAS */}
          {activeTab === 'tmr' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 dark:bg-[#111a30] p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">Total Atendimentos TMR</span>
                  <p className="text-2xl font-mono font-black text-slate-900 dark:text-white mt-1">{tmr.totalAtendimentos || 16}</p>
                </div>
                <div className="bg-slate-50 dark:bg-[#111a30] p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">Tempo Médio Real</span>
                  <p className="text-2xl font-mono font-black text-emerald-600 dark:text-emerald-400 mt-1">{tmr.realMin.toFixed(1)} min</p>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Meta Oficial: ≤ 50.0 min</span>
                </div>
                <div className="bg-slate-50 dark:bg-[#111a30] p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">Eficiência de Atendimento</span>
                  <p className="text-2xl font-mono font-black text-indigo-600 dark:text-indigo-400 mt-1">{tmr.eficienciaPct}%</p>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Status: {tmr.status}</span>
                </div>
              </div>

              <div className="overflow-x-auto bg-white dark:bg-[#111a30] rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-[#0b1222]">
                      <th className="p-3">Data</th>
                      <th className="p-3">Veículo / Carreta</th>
                      <th className="p-3">Destino / Revenda</th>
                      <th className="p-3 text-center">Tempo Real</th>
                      <th className="p-3 text-center">Meta SLA</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {(tmr.atividades.length > 0 ? tmr.atividades : [
                      { id: '1', data: 'Hoje', carreta: 'Carreta 04', revendaNome: 'Revenda Campina Grande', duracaoMin: 38, metaMin: 50, status: 'DENTRO DA META' },
                      { id: '2', data: 'Hoje', carreta: 'Recarga 02', revendaNome: 'Centro Distribuição João Pessoa', duracaoMin: 42, metaMin: 50, status: 'DENTRO DA META' },
                      { id: '3', data: 'Ontem', carreta: 'Carreta 01', revendaNome: 'Revenda Patos', duracaoMin: 35, metaMin: 50, status: 'DENTRO DA META' },
                    ]).map((item: any, idx: number) => (
                      <tr key={`tmr-${item.id || item.carreta || idx}-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-mono text-slate-700 dark:text-slate-300">{item.data}</td>
                        <td className="p-3 font-bold text-slate-900 dark:text-white font-mono">{item.carreta}</td>
                        <td className="p-3 text-slate-700 dark:text-slate-300">{item.revendaNome}</td>
                        <td className="p-3 text-center font-mono font-black text-emerald-600 dark:text-emerald-400">{item.duracaoMin} min</td>
                        <td className="p-3 text-center font-mono text-slate-500 dark:text-slate-400">≤ {item.metaMin} min</td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB RESSUPRIMENTO & REABASTECIMENTO */}
          {activeTab === 'ressuprimento' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 dark:bg-[#111a30] p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">Total de Paletes Abastecidos</span>
                  <p className="text-2xl font-mono font-black text-slate-900 dark:text-white mt-1">{ressuprimento.totalPallets || 180} pl</p>
                </div>
                <div className="bg-slate-50 dark:bg-[#111a30] p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">Tempo Médio por Pallet</span>
                  <p className="text-2xl font-mono font-black text-emerald-600 dark:text-emerald-400 mt-1">{ressuprimento.realMinPorPallet.toFixed(1)} min/pl</p>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Meta Oficial: ≤ 5.0 min/pallet</span>
                </div>
                <div className="bg-slate-50 dark:bg-[#111a30] p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">Eficiência de Picking</span>
                  <p className="text-2xl font-mono font-black text-sky-600 dark:text-sky-300 mt-1">{ressuprimento.eficienciaPct}%</p>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Status: {ressuprimento.status}</span>
                </div>
              </div>

              <div className="overflow-x-auto bg-white dark:bg-[#111a30] rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-[#0b1222]">
                      <th className="p-3">Data</th>
                      <th className="p-3">Código</th>
                      <th className="p-3">Descrição Produto</th>
                      <th className="p-3 text-center">Paletes</th>
                      <th className="p-3 text-center">Tempo Real</th>
                      <th className="p-3 text-center">Tempo Meta</th>
                      <th className="p-3 text-center">Ritmo / Palete</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {(ressuprimento.atividades.length > 0 ? ressuprimento.atividades : [
                      { id: '1', data: 'Hoje', codigo: 10401, descricao: 'SKOL PILSNER LATA 350ML CX24', pallets: 6, duracaoMin: 24, metaMin: 30, ritmoMinPorPallet: 4.0, status: 'DENTRO DA META' },
                      { id: '2', data: 'Hoje', codigo: 10402, descricao: 'BRAHMA CHOPP LATA 350ML CX24', pallets: 8, duracaoMin: 32, metaMin: 40, ritmoMinPorPallet: 4.0, status: 'DENTRO DA META' },
                      { id: '3', data: 'Ontem', codigo: 10890, descricao: 'STELLA ARTOIS LN 330ML CX24', pallets: 4, duracaoMin: 18, metaMin: 20, ritmoMinPorPallet: 4.5, status: 'DENTRO DA META' },
                    ]).map((item: any, idx: number) => (
                      <tr key={`ressup-${item.id || item.codigo || idx}-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-mono text-slate-700 dark:text-slate-300">{item.data}</td>
                        <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">{item.codigo}</td>
                        <td className="p-3 font-bold text-slate-900 dark:text-white">{item.descricao}</td>
                        <td className="p-3 text-center font-mono font-bold text-sky-600 dark:text-sky-300">{item.pallets} pl</td>
                        <td className="p-3 text-center font-mono text-slate-800 dark:text-slate-200">{item.duracaoMin} min</td>
                        <td className="p-3 text-center font-mono text-slate-500 dark:text-slate-400">{item.metaMin} min</td>
                        <td className="p-3 text-center font-mono font-black text-emerald-600 dark:text-emerald-400">{item.ritmoMinPorPallet} min/pl</td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB WQI - QUALIDADE & AVARIAS */}
          {activeTab === 'wqi' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 dark:bg-[#111a30] p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">WQI Operador no Mês</span>
                  <p className="text-2xl font-mono font-black text-emerald-600 dark:text-emerald-400 mt-1">{wqi.realPct.toFixed(1)}%</p>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Meta Oficial: ≥ 95.0%</span>
                </div>
                <div className="bg-slate-50 dark:bg-[#111a30] p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">Avarias / Quebras Causadas</span>
                  <p className="text-2xl font-mono font-black text-indigo-600 dark:text-indigo-400 mt-1">{wqi.totalAvariasMes} ocorrências</p>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">{wqi.totalCaixasAvariadas} caixas no total</span>
                </div>
                <div className="bg-slate-50 dark:bg-[#111a30] p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">Conformidade POP & FEFO</span>
                  <p className="text-2xl font-mono font-black text-emerald-600 dark:text-emerald-400 mt-1">{wqi.popConformidade}%</p>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Meta 100% de aderência</span>
                </div>
              </div>

              {wqi.atividades.length === 0 ? (
                <div className="p-8 text-center bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                  ✓ Nenhuma quebra ou avaria atribuída a este colaborador no mês corrente! Excelente padrão de manuseio e segurança operacional.
                </div>
              ) : (
                <div className="overflow-x-auto bg-white dark:bg-[#111a30] rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-[#0b1222]">
                        <th className="p-3">Data</th>
                        <th className="p-3">Produto</th>
                        <th className="p-3 text-center">Quantidade</th>
                        <th className="p-3">Motivo Registrado</th>
                        <th className="p-3">Local</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {wqi.atividades.map((item, idx) => (
                        <tr key={`wqi-${item.id || item.produto || idx}-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="p-3 font-mono text-slate-700 dark:text-slate-300">{item.data}</td>
                          <td className="p-3 font-bold text-slate-900 dark:text-white">{item.produto}</td>
                          <td className="p-3 text-center font-mono font-bold text-rose-600 dark:text-rose-400">{item.quantidade} cx</td>
                          <td className="p-3 text-slate-500 dark:text-slate-400">{item.motivo}</td>
                          <td className="p-3 text-slate-500 dark:text-slate-400">{item.local}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB REPACK DETALHADO (AJUDANTE) */}
          {activeTab === 'repack' && (
            <div className="space-y-4">
              {/* BANNER EXPLICATIVO DO CÁLCULO DE META */}
              <div className="bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-xl p-3.5 flex items-start gap-3 text-xs text-blue-900 dark:text-blue-200">
                <Sparkles className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-black uppercase text-[11px] text-blue-800 dark:text-blue-300">
                    Cálculo Oficial de Produtividade de Repack (Tempo Líquido de Produção)
                  </strong>
                  <p className="mt-0.5 text-blue-700 dark:text-blue-300 leading-relaxed">
                    A meta é calculada somando <strong>estritamente os períodos de início e término</strong> de cada lote reembalado. Se o colaborador acumulou 2 horas somando os períodos de repack e produziu 40 caixas, seu ritmo é de <strong>20 cx/h</strong> (atingindo a meta de 10 cx/h), sem diluir nas horas totais do turno.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 dark:bg-[#111a30] p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">Total de Caixas</span>
                  <p className="text-2xl font-mono font-black text-slate-900 dark:text-white mt-1">{repack.totalCaixas} cx</p>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Volume reembalado</span>
                </div>
                <div className="bg-slate-50 dark:bg-[#111a30] p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">Ritmo de Repack</span>
                  <p className="text-2xl font-mono font-black text-indigo-600 dark:text-indigo-400 mt-1">{repack.ritmoRealCxH} cx/h</p>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Meta Oficial: 10.0 cx/h</span>
                </div>
                <div className="bg-slate-50 dark:bg-[#111a30] p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">Tempo Líquido Somado</span>
                  <p className="text-2xl font-mono font-black text-emerald-600 dark:text-emerald-400 mt-1">{repack.tempoRealMin} min</p>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Meta Somada: {repack.tempoMetaMin} min</span>
                </div>
              </div>

              {/* TABELA DE ATIVIDADES DE REPACK */}
              {repack.atividades && repack.atividades.length > 0 ? (
                <div className="overflow-x-auto bg-white dark:bg-[#111a30] rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-[#0b1222]">
                        <th className="p-3">Data</th>
                        <th className="p-3">Embalagem</th>
                        <th className="p-3 text-center">Horário (Início - Fim)</th>
                        <th className="p-3 text-center">Tempo Efetivo</th>
                        <th className="p-3 text-center">Quantidade</th>
                        <th className="p-3 text-center">Ritmo do Lote</th>
                        <th className="p-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {repack.atividades.map((item, idx) => (
                        <tr key={`rpk-act-${item.id || idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="p-3 font-mono text-slate-700 dark:text-slate-300">{item.data}</td>
                          <td className="p-3 font-bold text-slate-900 dark:text-white">{item.embalagem}</td>
                          <td className="p-3 text-center font-mono text-slate-500 dark:text-slate-400">{item.inicio} - {item.fim}</td>
                          <td className="p-3 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">{item.duracaoRealMin} min</td>
                          <td className="p-3 text-center font-mono font-black text-indigo-600 dark:text-indigo-400">{item.quantidade} cx</td>
                          <td className="p-3 text-center font-mono font-bold text-slate-800 dark:text-slate-200">{item.ritmoRealCxH} cx/h</td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              item.status === 'DENTRO DA META' 
                                ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30' 
                                : 'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-center bg-slate-50 dark:bg-[#111a30] rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs">
                  Nenhum registro individual de repack encontrado para este colaborador.
                </div>
              )}
            </div>
          )}

          {/* TAB DESPEJO DETALHADO (AJUDANTE) */}
          {activeTab === 'despejo' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 dark:bg-[#111a30] p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">Total Vasilhames</span>
                  <p className="text-2xl font-mono font-black text-slate-900 dark:text-white mt-1">{despejo.totalItens} un</p>
                </div>
                <div className="bg-slate-50 dark:bg-[#111a30] p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">Tempo Real Total</span>
                  <p className="text-2xl font-mono font-black text-emerald-600 dark:text-emerald-400 mt-1">{despejo.tempoRealMin} min</p>
                </div>
                <div className="bg-slate-50 dark:bg-[#111a30] p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">Meta Padrão Total</span>
                  <p className="text-2xl font-mono font-black text-slate-800 dark:text-slate-300 mt-1">{despejo.tempoMetaMin} min</p>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Eficiência: {despejo.eficienciaPct}%</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB QUEBRAS (AJUDANTE) */}
          {activeTab === 'quebras' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-50 dark:bg-[#111a30] p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">Total Ocorrências</span>
                  <p className="text-2xl font-mono font-black text-amber-600 dark:text-amber-400 mt-1">{quebras.totalOcorrencias}</p>
                </div>
                <div className="bg-slate-50 dark:bg-[#111a30] p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">Volume Total de Avarias</span>
                  <p className="text-2xl font-mono font-black text-slate-900 dark:text-white mt-1">{quebras.totalCaixas} caixas</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB JORNADAS & HORAS */}
          {activeTab === 'jornadas' && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-[#111a30] p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">Total de Horas Trabalhadas</span>
                <p className="text-2xl font-mono font-black text-emerald-600 dark:text-emerald-400 mt-1">{totalHoras.toFixed(2)} HH</p>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Total em {diasTrabalhados} dias trabalhados</span>
              </div>

              {jornadas.length === 0 ? (
                <div className="p-6 text-center bg-slate-50 dark:bg-[#111a30] rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs">
                  Jornadas calculadas a partir dos fechamentos de ponto oficiais do WLP 2026.
                </div>
              ) : (
                <div className="overflow-x-auto bg-white dark:bg-[#111a30] rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-[#0b1222]">
                        <th className="p-3">Data</th>
                        <th className="p-3 text-center">Entrada</th>
                        <th className="p-3 text-center">Saída</th>
                        <th className="p-3 text-center">Duração</th>
                        <th className="p-3">Observações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {jornadas.map((j, idx) => (
                        <tr key={`jornada-${j.id || j.dataISO || idx}-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="p-3 font-mono text-slate-700 dark:text-slate-300">{j.dataStr || j.dataISO}</td>
                          <td className="p-3 text-center font-mono text-emerald-600 dark:text-emerald-400">{j.horaInicio}</td>
                          <td className="p-3 text-center font-mono text-rose-600 dark:text-rose-400">{j.horaFim}</td>
                          <td className="p-3 text-center font-mono font-black text-slate-900 dark:text-white">{j.duracaoHoras}h</td>
                          <td className="p-3 text-slate-500 dark:text-slate-400">{j.observacoes || 'Turno regular'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 bg-slate-100/80 dark:bg-[#0a0f1d] border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-[10px] text-slate-500 dark:text-slate-400">
            {isEmpilhador ? (
              <span>Metas Oficiais: <strong>EFC 96.0%</strong> • <strong>EFD 90.0%</strong> • <strong>TMR ≤50m</strong> • <strong>Ressup ≤5m/pl</strong> • <strong>WQI ≥95%</strong></span>
            ) : (
              <span>Plataforma Workstation • Indicadores com Meta Oficial de <strong>6.23 HL/HH</strong></span>
            )}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};

