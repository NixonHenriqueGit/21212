import React, { useState } from 'react';
import { 
  Target, 
  Sparkles, 
  Zap,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { DesvioAderenciaRow } from '../CurvaAbcAderenciaRuasTab';

const META_ADERENCIA_OFICIAL = 70.0;

interface Q3AdherencePlanCardProps {
  allRows: DesvioAderenciaRow[];
  activeQuarter?: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'ALL';
  onSelectQuarter?: (quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'ALL') => void;
  onApplyQ3Filter?: () => void;
  onFilterStreet: (rua: string) => void;
}

export const Q3AdherencePlanCard: React.FC<Q3AdherencePlanCardProps> = ({
  allRows,
  activeQuarter = 'ALL',
  onSelectQuarter,
  onApplyQ3Filter,
  onFilterStreet
}) => {
  const [internalQuarter, setInternalQuarter] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4' | 'ALL'>('Q3');

  // Usar o trimestre ativo passado por prop ou o estado interno
  const currentQuarter = activeQuarter !== 'ALL' ? activeQuarter : internalQuarter;

  const handleQuarterChange = (q: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'ALL') => {
    setInternalQuarter(q);
    if (onSelectQuarter) {
      onSelectQuarter(q);
    } else if (q === 'Q3' && onApplyQ3Filter) {
      onApplyQ3Filter();
    }
  };

  // Filtrar dados específicos do Trimestre Selecionado ou Geral
  const targetRows = React.useMemo(() => {
    if (currentQuarter === 'ALL') {
      return allRows;
    }
    if (currentQuarter === 'Q1') {
      return allRows.filter(r => r.trimestre === 'Q1' || ['01', '02', '03'].includes(r.mesKey));
    }
    if (currentQuarter === 'Q2') {
      return allRows.filter(r => r.trimestre === 'Q2' || ['04', '05', '06'].includes(r.mesKey));
    }
    if (currentQuarter === 'Q3') {
      return allRows.filter(r => r.trimestre === 'Q3' || ['07', '08', '09'].includes(r.mesKey));
    }
    if (currentQuarter === 'Q4') {
      return allRows.filter(r => r.trimestre === 'Q4' || ['10', '11', '12'].includes(r.mesKey));
    }
    return allRows;
  }, [allRows, currentQuarter]);
  
  const totalPallets = targetRows.reduce((acc, r) => acc + r.quantidadePallets, 0);
  const aderentesPallets = targetRows.filter(r => r.statusOkNok === 'OK').reduce((acc, r) => acc + r.quantidadePallets, 0);
  const desvioPallets = targetRows.filter(r => r.statusOkNok === 'NOK').reduce((acc, r) => acc + r.quantidadePallets, 0);
  const taxaAderencia = totalPallets > 0 ? (aderentesPallets / totalPallets) * 100 : 100;

  // Maiores ofensores de desvio (quebras) no período selecionado
  const topDesvios = React.useMemo(() => {
    const map = new Map<string, {
      codigo: string;
      descricao: string;
      rua: string;
      ruaIdeal: string;
      curva: 'A' | 'B' | 'C';
      pallets: number;
      severidade: string;
    }>();

    targetRows.filter(r => r.statusOkNok === 'NOK').forEach(r => {
      const key = `${r.codigo}_${r.rua}`;
      if (!map.has(key)) {
        map.set(key, {
          codigo: r.codigo,
          descricao: r.descricao,
          rua: r.rua,
          ruaIdeal: r.ruaIdeal,
          curva: r.curvaAbcReal,
          pallets: 0,
          severidade: r.severidade
        });
      }
      map.get(key)!.pallets += r.quantidadePallets;
    });

    const list = Array.from(map.values()).sort((a, b) => b.pallets - a.pallets);
    return list.slice(0, 3);
  }, [targetRows]);

  // Potencial de elevação da aderência corrigindo o Top 3
  const palletsTop3 = topDesvios.reduce((acc, i) => acc + i.pallets, 0);
  const potencialNovaTaxa = totalPallets > 0 
    ? Math.min(100, ((aderentesPallets + palletsTop3) / totalPallets) * 100)
    : 100;

  const ganhoPercentual = potencialNovaTaxa - taxaAderencia;
  const atingiuMetaOficial = taxaAderencia >= META_ADERENCIA_OFICIAL;
  const atingiraMetaComTop3 = potencialNovaTaxa >= META_ADERENCIA_OFICIAL;

  const getQuarterTitle = () => {
    switch (currentQuarter) {
      case 'Q1': return '1º Trimestre (Jan - Mar)';
      case 'Q2': return '2º Trimestre (Abr - Jun)';
      case 'Q3': return '3º Trimestre (Julho & Agosto)';
      case 'Q4': return '4º Trimestre (Set - Dez)';
      case 'ALL': return 'Consolidado Geral (Todos os Trimestres)';
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-[#0c1a30] p-5 rounded-3xl border border-indigo-500/30 text-white shadow-xl space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
            <Zap className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-black tracking-tight text-white flex items-center gap-2">
                Plano de Elevação de Aderência — {getQuarterTitle()}
              </h4>
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 bg-blue-500/20 text-blue-300 rounded-full border border-blue-400/30 flex items-center gap-1">
                <Target className="w-3 h-3 text-blue-400" />
                Meta Estabelecida: {META_ADERENCIA_OFICIAL.toFixed(0)}%
              </span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded-full border border-amber-500/30">
                {currentQuarter === 'Q3' ? 'Trimestre Atual' : currentQuarter === 'ALL' ? 'Visão Anual' : 'Trimestre Selecionado'}
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              Metas de remanejamento no Armazém Central para atingir e superar a <strong>Meta de {META_ADERENCIA_OFICIAL.toFixed(0)}% de Aderência</strong> com a Curva ABC.
            </p>
          </div>
        </div>

        {/* SELETOR DE TRIMESTRES NO PRÓPRIO CARD */}
        <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-700/80 flex-wrap">
          <span className="text-[10px] font-black uppercase text-slate-400 px-2 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-indigo-400" />
            Período:
          </span>
          <button
            onClick={() => handleQuarterChange('ALL')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${
              currentQuarter === 'ALL'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => handleQuarterChange('Q1')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${
              currentQuarter === 'Q1'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            1º Tri (Q1)
          </button>
          <button
            onClick={() => handleQuarterChange('Q2')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${
              currentQuarter === 'Q2'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            2º Tri (Q2)
          </button>
          <button
            onClick={() => handleQuarterChange('Q3')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${
              currentQuarter === 'Q3'
                ? 'bg-amber-600 text-white shadow-xs font-black'
                : 'text-amber-400 hover:text-white hover:bg-amber-500/10'
            }`}
          >
            3º Tri (Q3) ★
          </button>
          <button
            onClick={() => handleQuarterChange('Q4')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${
              currentQuarter === 'Q4'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            4º Tri (Q4)
          </button>
        </div>
      </div>

      {/* PAINEL DE METAS E GANHO PROJETADO */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* META OFICIAL */}
        <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-blue-500/30 bg-blue-500/5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-blue-400">Meta Estabelecida</span>
            <Target className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white mt-1">
            {META_ADERENCIA_OFICIAL.toFixed(1)}%
          </div>
          <div className="flex items-center gap-1 mt-1 text-[11px]">
            {atingiuMetaOficial ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Meta Atingida
              </span>
            ) : (
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Faltam {(META_ADERENCIA_OFICIAL - taxaAderencia).toFixed(1)}%
              </span>
            )}
          </div>
        </div>

        {/* ADERÊNCIA ATUAL */}
        <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase text-slate-400">
            Aderência Atual ({currentQuarter})
          </span>
          <div className="text-2xl font-black text-white mt-1 flex items-center gap-2">
            <span>{taxaAderencia.toFixed(1)}%</span>
            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
              atingiuMetaOficial ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
            }`}>
              {atingiuMetaOficial ? `≥ ${META_ADERENCIA_OFICIAL}%` : `< ${META_ADERENCIA_OFICIAL}%`}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1">
            {aderentesPallets} PL conformes de {totalPallets} PL totais
          </span>
        </div>

        {/* META COM CORREÇÃO IMEDIATA */}
        <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase text-emerald-400">Meta com Correção Imediata</span>
          <div className="text-2xl font-black text-emerald-400 mt-1 flex items-center gap-1.5">
            <span>{potencialNovaTaxa.toFixed(1)}%</span>
            {ganhoPercentual > 0 && (
              <span className="text-xs font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-md">
                +{ganhoPercentual.toFixed(1)}%
              </span>
            )}
          </div>
          <span className="text-[11px] text-emerald-300">
            Remanejando apenas os 3 maiores ofensores ({palletsTop3} PL)
          </span>
        </div>

        {/* PALLETS EM QUEBRA */}
        <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-rose-500/30 bg-rose-500/5 flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase text-rose-400">Pallets em Quebra (NOK)</span>
          <div className="text-2xl font-black text-rose-400 mt-1">
            {desvioPallets} <span className="text-xs font-medium text-rose-300">PL</span>
          </div>
          <span className="text-[11px] text-rose-300">
            Ocupando posições fora do bloco ideal da Curva ABC
          </span>
        </div>
      </div>

      {/* TOP OFENSORES DO PERÍODO */}
      {topDesvios.length > 0 ? (
        <div className="space-y-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Top 3 Ações de Remanejamento Prioritárias ({getQuarterTitle()}):
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {topDesvios.map((item) => (
              <div 
                key={`${item.codigo}_${item.rua}`}
                className="bg-slate-900/90 p-3 rounded-xl border border-slate-700/70 hover:border-blue-500/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-black text-blue-400">{item.codigo}</span>
                    <span className="text-[10px] font-black text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded">
                      Curva {item.curva}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-200 truncate mt-1" title={item.descricao}>
                    {item.descricao}
                  </p>
                  <div className="text-[11px] text-slate-300 mt-1 flex items-center gap-1">
                    <span className="text-rose-400 font-bold">Rua Atual: {item.rua}</span>
                    <span>➔</span>
                    <span className="text-emerald-400 font-bold">Ideal: {item.ruaIdeal}</span>
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-mono font-black text-amber-400">
                    {item.pallets} Pallets
                  </span>
                  <button
                    onClick={() => onFilterStreet(item.rua)}
                    className="text-xs text-blue-400 hover:text-white font-bold underline cursor-pointer flex items-center gap-1 px-2 py-1 bg-blue-500/10 hover:bg-blue-600 rounded-lg transition-all"
                  >
                    <span>Ver Rua {item.rua}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          Nenhum desvio crítico encontrado para o período selecionado. Todas as posições estão conformes com a Curva ABC!
        </div>
      )}
    </div>
  );
};

