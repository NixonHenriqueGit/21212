import React, { useState, useEffect, useMemo } from 'react';
import { Usuario } from '../types';
import { useEmpresaData } from '../context/EmpresaDataContext';
import { getCollaboratorPnpSummary, CollaboratorPnpSummary } from '../utils/pnpCollaboratorUtils';
import { CollaboratorActivitiesDrilldownModal } from './CollaboratorActivitiesDrilldownModal';
import { 
  Award, 
  Zap, 
  Clock, 
  Box, 
  ChevronRight, 
  Sparkles, 
  TrendingUp, 
  Truck, 
  Layers3, 
  Timer, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';

interface OperationalCollaboratorPnpBannerProps {
  user: Usuario;
  theme?: 'light' | 'dark';
}

export const OperationalCollaboratorPnpBanner = React.memo<OperationalCollaboratorPnpBannerProps>(({
  user,
  theme = 'dark'
}) => {
  const empresaData = useEmpresaData(['repack', 'despejo', 'quebras']);
  const [showModal, setShowModal] = useState(false);
  const [colabSummary, setColabSummary] = useState<CollaboratorPnpSummary | null>(null);

  const userIdent = user?.nome || user?.email || user?.uid || '';
  const empresaId = user?.empresaId || 'demo';

  useEffect(() => {
    let cancel = false;
    const computeSummary = () => {
      if (cancel) return;
      const res = getCollaboratorPnpSummary(
        userIdent,
        empresaId,
        empresaData.repack,
        empresaData.despejo,
        empresaData.quebras
      );
      if (!cancel) {
        setColabSummary(res);
      }
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as any).requestIdleCallback(computeSummary, { timeout: 250 });
    } else {
      setTimeout(computeSummary, 16);
    }

    return () => {
      cancel = true;
    };
  }, [userIdent, empresaId, empresaData.repack, empresaData.despejo, empresaData.quebras]);

  if (!colabSummary) {
    return null;
  }

  const isEmpilhador = colabSummary.isEmpilhador || 
    colabSummary.funcaoGroup === 'Empilhador' || 
    user.papel === 'empilhador' || 
    (user.cargo && user.cargo.toLowerCase().includes('empilha'));

  const {
    nome,
    cargo,
    matricula,
    metaPnp,
    realPnp,
    totalHoras,
    diasTrabalhados,
    percentualMeta,
    statusMeta,
    repack,
    efc,
    efd,
    tmr,
    ressuprimento,
    wqi
  } = colabSummary;

  return (
    <>
      <div className="w-full bg-gradient-to-r from-[#111a30] via-[#152342] to-[#0f172a] border-2 border-indigo-500/40 rounded-2xl p-4 sm:p-5 shadow-2xl relative overflow-hidden text-slate-100 min-w-0">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 relative z-10 min-w-0">
          
          {/* IDENTIFICAÇÃO DO COLABORADOR */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-indigo-600/30 border border-indigo-400/50 flex items-center justify-center text-indigo-300 font-black text-xl shadow-lg shrink-0">
              {isEmpilhador ? (
                <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
              ) : (
                <Award className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 whitespace-nowrap">
                  {isEmpilhador ? 'MEU DESEMPENHO OPERACIONAL (EMPILHADOR)' : 'MEU DESEMPENHO OPERACIONAL (PNP)'}
                </span>
                <span className="text-[9px] sm:text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded whitespace-nowrap">
                  Mat: {matricula}
                </span>
              </div>
              <h2 className="text-sm sm:text-base md:text-lg font-black text-white uppercase tracking-wide mt-0.5 truncate">
                {nome} — <span className="text-indigo-300 font-bold">{cargo}</span>
              </h2>
            </div>
          </div>

          {/* KPI COCKPIT LADO A LADO */}
          {isEmpilhador ? (
            /* COCKPIT DO EMPILHADOR: EFC, EFD, TMR, RESSUPRIMENTO, WQI */
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 w-full xl:w-auto min-w-0">
              {/* 1. EFC (CARREGAMENTO) */}
              <div className="bg-[#0b1222]/90 border border-indigo-500/30 rounded-xl p-2.5 px-3 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase text-indigo-300 block truncate">1. EFC (Carregamento)</span>
                  <Truck className="w-3 h-3 text-indigo-400 shrink-0" />
                </div>
                <div className="flex items-baseline gap-1 mt-0.5 flex-wrap">
                  <strong className="text-base font-black font-mono text-emerald-400">{efc.realPct.toFixed(1)}%</strong>
                  <span className="text-[10px] font-mono text-slate-400">/ Meta: 96.0%</span>
                </div>
                <span className={`text-[9px] font-black uppercase block mt-0.5 truncate ${
                  efc.realPct >= efc.metaPct ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {efc.realPct >= efc.metaPct ? '✓ Meta Atingida' : '⚠ Abaixo da Meta'}
                </span>
              </div>

              {/* 2. EFD (DESCARREGAMENTO) */}
              <div className="bg-[#0b1222]/90 border border-indigo-500/30 rounded-xl p-2.5 px-3 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase text-indigo-300 block truncate">2. EFD (Descarga)</span>
                  <Clock className="w-3 h-3 text-indigo-400 shrink-0" />
                </div>
                <div className="flex items-baseline gap-1 mt-0.5 flex-wrap">
                  <strong className="text-base font-black font-mono text-emerald-400">{efd.realPct.toFixed(1)}%</strong>
                  <span className="text-[10px] font-mono text-slate-400">/ Meta: 90.0%</span>
                </div>
                <span className={`text-[9px] font-black uppercase block mt-0.5 truncate ${
                  efd.realPct >= efd.metaPct ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {efd.realPct >= efd.metaPct ? '✓ Meta Atingida' : '⚠ Abaixo da Meta'}
                </span>
              </div>

              {/* 3. TMR (TEMPO MÉDIO DE ATENDIMENTO) */}
              <div className="bg-[#0b1222]/90 border border-slate-800 rounded-xl p-2.5 px-3 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase text-slate-400 block truncate">3. TMR (Atendimento)</span>
                  <Timer className="w-3 h-3 text-amber-400 shrink-0" />
                </div>
                <div className="flex items-baseline gap-1 mt-0.5 flex-wrap">
                  <strong className="text-base font-black font-mono text-indigo-300">{tmr.realMin.toFixed(1)}m</strong>
                  <span className="text-[10px] font-mono text-slate-400">/ Meta: ≤50m</span>
                </div>
                <span className={`text-[9px] font-black uppercase block mt-0.5 truncate ${
                  tmr.realMin <= tmr.metaMin ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {tmr.realMin <= tmr.metaMin ? '✓ No Prazo' : '⚠ Acima do Tempo'}
                </span>
              </div>

              {/* 4. RESSUPRIMENTO & REABASTECIMENTO */}
              <div className="bg-[#0b1222]/90 border border-slate-800 rounded-xl p-2.5 px-3 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase text-slate-400 block truncate">4. Ressuprimento</span>
                  <Layers3 className="w-3 h-3 text-sky-400 shrink-0" />
                </div>
                <div className="flex items-baseline gap-1 mt-0.5 flex-wrap">
                  <strong className="text-base font-black font-mono text-sky-300">{ressuprimento.realMinPorPallet.toFixed(1)}m</strong>
                  <span className="text-[10px] font-mono text-slate-400">/ Meta: ≤5m/pl</span>
                </div>
                <span className={`text-[9px] font-black uppercase block mt-0.5 truncate ${
                  ressuprimento.realMinPorPallet <= ressuprimento.metaMinPorPallet ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {ressuprimento.realMinPorPallet <= ressuprimento.metaMinPorPallet ? '✓ Dentro do SLA' : '⚠ Acima de 5m/pl'}
                </span>
              </div>

              {/* 5. WQI CAUSADO NO MÊS */}
              <div className="bg-[#0b1222]/90 border border-slate-800 rounded-xl p-2.5 px-3 min-w-0 col-span-2 sm:col-span-1">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase text-slate-400 block truncate">5. WQI Operador</span>
                  <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                </div>
                <div className="flex items-baseline gap-1 mt-0.5 flex-wrap">
                  <strong className="text-base font-black font-mono text-emerald-400">{wqi.realPct.toFixed(1)}%</strong>
                  <span className="text-[10px] font-mono text-slate-400">/ Meta: ≥95%</span>
                </div>
                <span className={`text-[9px] font-black uppercase block mt-0.5 truncate ${
                  wqi.totalAvariasMes === 0 ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {wqi.totalAvariasMes === 0 ? '0 avarias no mês' : `${wqi.totalAvariasMes} avarias no mês`}
                </span>
              </div>
            </div>
          ) : (
            /* COCKPIT EXCLUSIVO DE PNP (HL/HH) */
            <div className="flex items-center gap-2.5 sm:gap-3 w-full xl:w-auto min-w-0">
              {/* PNP META VS REAL */}
              <div className="bg-[#0b1222]/90 border border-indigo-500/40 rounded-xl p-2.5 px-4 min-w-[200px] sm:min-w-[220px]">
                <span className="text-[9px] font-black uppercase tracking-wider text-indigo-300 block truncate">PNP (HL/HH)</span>
                <div className="flex items-baseline gap-1.5 mt-0.5 flex-wrap">
                  <strong className="text-lg font-black font-mono text-emerald-400">{realPnp.toFixed(2)}</strong>
                  <span className="text-xs font-mono text-slate-400">/ Meta: {metaPnp.toFixed(2)}</span>
                </div>
                <span className={`text-[10px] font-black uppercase block mt-0.5 truncate ${
                  percentualMeta >= 100 ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {percentualMeta.toFixed(1)}% da Meta • {percentualMeta >= 100 ? 'Meta Batida' : 'Em Andamento'}
                </span>
              </div>
            </div>
          )}

          {/* BOTÃO DRILLDOWN */}
          <button
            onClick={() => setShowModal(true)}
            className="w-full xl:w-auto px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer shrink-0 border border-indigo-400/40"
          >
            <span className="truncate">Minhas Atividades (Meta vs Real)</span>
            <ChevronRight className="w-4 h-4 shrink-0" />
          </button>
        </div>
      </div>

      {/* DRILLDOWN MODAL */}
      {showModal && (
        <CollaboratorActivitiesDrilldownModal
          collaborator={colabSummary}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
});
