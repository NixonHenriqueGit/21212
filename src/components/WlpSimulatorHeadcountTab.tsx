import React, { useState, useMemo } from 'react';
import {
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Download,
  RotateCcw,
  Sparkles,
  Sliders,
  ShieldCheck,
  UserPlus,
  UserMinus,
  Clock,
  BarChart3,
  HelpCircle,
  Briefcase
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell
} from 'recharts';
import * as XLSX from 'xlsx';

export interface MonthVolumeFeriasItem {
  mes: string;
  mesNome: string;
  mesNum: string;
  ranking: number;
  volPrevistoHL: number;
  realColaboradores: number;
  quadroIdeal: number; // Coluna1
  colaboradorFerias: string;
  diaInicioFerias: string;
  diaFimFerias: string;
  temFerias: boolean;
}

export const OFFICIAL_VOLUMES_FERIAS_2026: MonthVolumeFeriasItem[] = [
  {
    mes: 'Jan',
    mesNome: 'Janeiro',
    mesNum: '01',
    ranking: 10,
    volPrevistoHL: 13295,
    realColaboradores: 15,
    quadroIdeal: 20,
    colaboradorFerias: 'NÃO CONTEMPLA',
    diaInicioFerias: 'NÃO CONTEMPLA',
    diaFimFerias: 'NÃO CONTEMPLA',
    temFerias: false
  },
  {
    mes: 'Fev',
    mesNome: 'Fevereiro',
    mesNum: '02',
    ranking: 5,
    volPrevistoHL: 11524,
    realColaboradores: 15,
    quadroIdeal: 20,
    colaboradorFerias: 'MARIVALDO ARTUR ALVES / KATHYEL',
    diaInicioFerias: '02/02/2026',
    diaFimFerias: '04/03/2026',
    temFerias: true
  },
  {
    mes: 'Mar',
    mesNome: 'Março',
    mesNum: '03',
    ranking: 1,
    volPrevistoHL: 9803,
    realColaboradores: 14,
    quadroIdeal: 19,
    colaboradorFerias: 'PAULO PEREIRA DA SILVA',
    diaInicioFerias: '04/03/2026',
    diaFimFerias: '03/04/2026',
    temFerias: true
  },
  {
    mes: 'Abr',
    mesNome: 'Abril',
    mesNum: '04',
    ranking: 4,
    volPrevistoHL: 11108,
    realColaboradores: 14,
    quadroIdeal: 20,
    colaboradorFerias: 'DEJEAN SILVA DE OLIVEIRA',
    diaInicioFerias: '06/04/2026',
    diaFimFerias: '06/05/2026',
    temFerias: true
  },
  {
    mes: 'Mai',
    mesNome: 'Maio',
    mesNum: '05',
    ranking: 7,
    volPrevistoHL: 12233,
    realColaboradores: 14,
    quadroIdeal: 20,
    colaboradorFerias: 'NIXON HENRIQUE PEREIRA DE ARRUDA',
    diaInicioFerias: '06/05/2026',
    diaFimFerias: '05/06/2026',
    temFerias: true
  },
  {
    mes: 'Jun',
    mesNome: 'Junho',
    mesNum: '06',
    ranking: 11,
    volPrevistoHL: 13647,
    realColaboradores: 15,
    quadroIdeal: 21,
    colaboradorFerias: 'NÃO CONTEMPLA',
    diaInicioFerias: 'NÃO CONTEMPLA',
    diaFimFerias: 'NÃO CONTEMPLA',
    temFerias: false
  },
  {
    mes: 'Jul',
    mesNome: 'Julho',
    mesNum: '07',
    ranking: 3,
    volPrevistoHL: 10817,
    realColaboradores: 14,
    quadroIdeal: 19,
    colaboradorFerias: 'GILSON ROSA DA SILVA',
    diaInicioFerias: '06/07/2026',
    diaFimFerias: '05/08/2026',
    temFerias: true
  },
  {
    mes: 'Ago',
    mesNome: 'Agosto',
    mesNum: '08',
    ranking: 2,
    volPrevistoHL: 10248,
    realColaboradores: 14,
    quadroIdeal: 19,
    colaboradorFerias: 'JOSE RONILDO DA SILVA',
    diaInicioFerias: '10/08/2026',
    diaFimFerias: '09/09/2026',
    temFerias: true
  },
  {
    mes: 'Set',
    mesNome: 'Setembro',
    mesNum: '09',
    ranking: 8,
    volPrevistoHL: 13233,
    realColaboradores: 15,
    quadroIdeal: 20,
    colaboradorFerias: 'NÃO CONTEMPLA',
    diaInicioFerias: 'NÃO CONTEMPLA',
    diaFimFerias: 'NÃO CONTEMPLA',
    temFerias: false
  },
  {
    mes: 'Out',
    mesNome: 'Outubro',
    mesNum: '10',
    ranking: 9,
    volPrevistoHL: 13287,
    realColaboradores: 15,
    quadroIdeal: 20,
    colaboradorFerias: 'NÃO CONTEMPLA',
    diaInicioFerias: 'NÃO CONTEMPLA',
    diaFimFerias: 'NÃO CONTEMPLA',
    temFerias: false
  },
  {
    mes: 'Nov',
    mesNome: 'Novembro',
    mesNum: '11',
    ranking: 6,
    volPrevistoHL: 12062,
    realColaboradores: 15,
    quadroIdeal: 20,
    colaboradorFerias: 'NÃO CONTEMPLA',
    diaInicioFerias: 'NÃO CONTEMPLA',
    diaFimFerias: 'NÃO CONTEMPLA',
    temFerias: false
  },
  {
    mes: 'Dez',
    mesNome: 'Dezembro',
    mesNum: '12',
    ranking: 12,
    volPrevistoHL: 19437,
    realColaboradores: 15,
    quadroIdeal: 23,
    colaboradorFerias: 'NÃO CONTEMPLA',
    diaInicioFerias: 'NÃO CONTEMPLA',
    diaFimFerias: 'NÃO CONTEMPLA',
    temFerias: false
  }
];

interface WlpSimulatorHeadcountTabProps {
  empresaId?: string;
  theme?: 'light' | 'dark';
}

export const WlpSimulatorHeadcountTab: React.FC<WlpSimulatorHeadcountTabProps> = ({
  empresaId = 'demo',
  theme = 'light'
}) => {
  // Simulator Parameters State
  const [targetMetaWlp, setTargetMetaWlp] = useState<number>(6.59);
  const [shiftHours, setShiftHours] = useState<number>(7.33);
  const [workingDays, setWorkingDays] = useState<number>(22);
  const [absenteeismRate, setAbsenteeismRate] = useState<number>(1.5); // %
  const [extraHoursTolerance, setExtraHoursTolerance] = useState<number>(5.0); // %
  const [selectedSort, setSelectedSort] = useState<'CRONOLOGICO' | 'RANKING_VOLUME' | 'GAP_QUADRO'>('CRONOLOGICO');
  const [selectedQuarterFilter, setSelectedQuarterFilter] = useState<'TODOS' | 'Q1' | 'Q2' | 'Q3' | 'Q4'>('TODOS');
  
  // Custom month adjustments
  const [customData, setCustomData] = useState<MonthVolumeFeriasItem[]>(() => {
    try {
      const saved = localStorage.getItem(`wlp_simulator_volumes_ferias_${empresaId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 12) {
          return parsed;
        }
      }
    } catch (e) {}
    return OFFICIAL_VOLUMES_FERIAS_2026;
  });

  const handleReset = () => {
    if (window.confirm('Deseja restaurar todos os volumes, férias e parâmetros para o modelo oficial de 2026?')) {
      setCustomData(OFFICIAL_VOLUMES_FERIAS_2026);
      setTargetMetaWlp(6.59);
      setShiftHours(7.33);
      setWorkingDays(22);
      setAbsenteeismRate(1.5);
      setExtraHoursTolerance(5.0);
      try {
        localStorage.removeItem(`wlp_simulator_volumes_ferias_${empresaId}`);
      } catch (e) {}
    }
  };

  const handleUpdateVolume = (index: number, newVol: number) => {
    const updated = [...customData];
    updated[index] = { ...updated[index], volPrevistoHL: newVol };
    setCustomData(updated);
    try {
      localStorage.setItem(`wlp_simulator_volumes_ferias_${empresaId}`, JSON.stringify(updated));
    } catch (e) {}
  };

  const handleUpdateRealColab = (index: number, newReal: number) => {
    const updated = [...customData];
    updated[index] = { ...updated[index], realColaboradores: newReal };
    setCustomData(updated);
    try {
      localStorage.setItem(`wlp_simulator_volumes_ferias_${empresaId}`, JSON.stringify(updated));
    } catch (e) {}
  };

  // Mathematical Headcount and WLP Calculations per Month
  const simulatedRows = useMemo(() => {
    return customData.map((item, idx) => {
      const vol = item.volPrevistoHL;
      const real = item.realColaboradores;
      const ideal = item.quadroIdeal;
      const emFerias = item.temFerias ? 1 : 0;
      const efetivoAtivo = Math.max(0, real - emFerias);

      // Homem-Hora (HH) teóricas necessárias pela meta WLP
      const hhNecessarias = targetMetaWlp > 0 ? vol / targetMetaWlp : 0;

      // Capacidade nominal de 1 colaborador no mês
      const horasPorColabMes = workingDays * shiftHours * (1 - absenteeismRate / 100);

      // Quadro calculado estritamente pela fórmula de capacidade
      const quadroCalculado = horasPorColabMes > 0 ? Math.ceil(hhNecessarias / horasPorColabMes) : ideal;

      // Quadro Recomendado Final (Usa o quadro ideal oficial ou o calculado simulado)
      const quadroRecomendado = ideal;

      // Gap de Headcount vs Efetivo Ativo
      const gapColaboradores = quadroRecomendado - efetivoAtivo;

      // Ação Necessária
      let acao: 'AUMENTAR' | 'MANTER' | 'REDUZIR' = 'MANTER';
      let acaoTexto = 'Manter Quadro';
      let badgeCor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
      let severidade: 'ALTA' | 'MEDIA' | 'BAIXA' = 'BAIXA';

      if (gapColaboradores > 0) {
        acao = 'AUMENTAR';
        acaoTexto = `Aumentar +${gapColaboradores} FTE`;
        if (gapColaboradores >= 6) {
          badgeCor = 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
          severidade = 'ALTA';
        } else {
          badgeCor = 'bg-amber-100 text-amber-800 border-amber-300 font-semibold';
          severidade = 'MEDIA';
        }
      } else if (gapColaboradores < 0) {
        acao = 'REDUZIR';
        acaoTexto = `Reduzir ${Math.abs(gapColaboradores)} FTE`;
        badgeCor = 'bg-blue-100 text-blue-800 border-blue-300';
        severidade = 'MEDIA';
      }

      // Capacidade de HH entregue pelo quadro ativo atual
      const hhDisponiveisAtivo = efetivoAtivo * horasPorColabMes;
      const wlpProjetadoSemAumento = hhDisponiveisAtivo > 0 ? vol / hhDisponiveisAtivo : 0;

      // Horas extras necessárias caso não haja aumento de quadro
      const horasExtrasEstimadas = Math.max(0, hhNecessarias - hhDisponiveisAtivo);
      const hePorColabDia = efetivoAtivo > 0 && workingDays > 0 ? horasExtrasEstimadas / (efetivoAtivo * workingDays) : 0;

      // Classificação Trimestral
      let quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4' = 'Q1';
      if (idx >= 0 && idx <= 2) quarter = 'Q1';
      else if (idx >= 3 && idx <= 5) quarter = 'Q2';
      else if (idx >= 6 && idx <= 8) quarter = 'Q3';
      else quarter = 'Q4';

      return {
        ...item,
        emFerias,
        efetivoAtivo,
        hhNecessarias: Math.round(hhNecessarias),
        hhDisponiveisAtivo: Math.round(hhDisponiveisAtivo),
        quadroCalculado,
        quadroRecomendado,
        gapColaboradores,
        acao,
        acaoTexto,
        badgeCor,
        severidade,
        wlpProjetadoSemAumento: parseFloat(wlpProjetadoSemAumento.toFixed(2)),
        horasExtrasEstimadas: Math.round(horasExtrasEstimadas),
        hePorColabDia: parseFloat(hePorColabDia.toFixed(1)),
        quarter
      };
    });
  }, [customData, targetMetaWlp, shiftHours, workingDays, absenteeismRate]);

  // Filter and Sort
  const filteredAndSortedRows = useMemo(() => {
    let rows = [...simulatedRows];

    if (selectedQuarterFilter !== 'TODOS') {
      rows = rows.filter(r => r.quarter === selectedQuarterFilter);
    }

    if (selectedSort === 'RANKING_VOLUME') {
      rows.sort((a, b) => a.ranking - b.ranking);
    } else if (selectedSort === 'GAP_QUADRO') {
      rows.sort((a, b) => b.gapColaboradores - a.gapColaboradores);
    } else {
      // Cronológico
      rows.sort((a, b) => parseInt(a.mesNum, 10) - parseInt(b.mesNum, 10));
    }

    return rows;
  }, [simulatedRows, selectedQuarterFilter, selectedSort]);

  // Executive Summary Totals
  const executiveTotals = useMemo(() => {
    const totalVol = simulatedRows.reduce((sum, r) => sum + r.volPrevistoHL, 0);
    const mediaVol = totalVol / 12;
    const mediaReal = simulatedRows.reduce((sum, r) => sum + r.realColaboradores, 0) / 12;
    const mediaIdeal = simulatedRows.reduce((sum, r) => sum + r.quadroIdeal, 0) / 12;
    const mediaEfetivoAtivo = simulatedRows.reduce((sum, r) => sum + r.efetivoAtivo, 0) / 12;
    const maxVolRow = [...simulatedRows].sort((a, b) => b.volPrevistoHL - a.volPrevistoHL)[0];
    const minVolRow = [...simulatedRows].sort((a, b) => a.volPrevistoHL - b.volPrevistoHL)[0];
    const maxGapRow = [...simulatedRows].sort((a, b) => b.gapColaboradores - a.gapColaboradores)[0];
    const totalMesesAumentar = simulatedRows.filter(r => r.acao === 'AUMENTAR').length;
    const totalMesesManter = simulatedRows.filter(r => r.acao === 'MANTER').length;
    const totalMesesReduzir = simulatedRows.filter(r => r.acao === 'REDUZIR').length;
    const totalColabsFeriasAno = simulatedRows.filter(r => r.temFerias).length;

    return {
      totalVol,
      mediaVol: Math.round(mediaVol),
      mediaReal: parseFloat(mediaReal.toFixed(1)),
      mediaIdeal: parseFloat(mediaIdeal.toFixed(1)),
      mediaEfetivoAtivo: parseFloat(mediaEfetivoAtivo.toFixed(1)),
      gapMedio: parseFloat((mediaIdeal - mediaEfetivoAtivo).toFixed(1)),
      maxVolRow,
      minVolRow,
      maxGapRow,
      totalMesesAumentar,
      totalMesesManter,
      totalMesesReduzir,
      totalColabsFeriasAno
    };
  }, [simulatedRows]);

  // Chart Data for Combined Volume & Headcount
  const chartData = useMemo(() => {
    return simulatedRows.map(r => ({
      mes: r.mes,
      volPrevistoHL: r.volPrevistoHL,
      realColaboradores: r.realColaboradores,
      efetivoAtivo: r.efetivoAtivo,
      quadroIdeal: r.quadroIdeal,
      gapColaboradores: r.gapColaboradores,
      temFerias: r.temFerias ? 1 : 0
    }));
  }, [simulatedRows]);

  // Export Excel Handler
  const handleExportExcel = () => {
    const dataToExport = simulatedRows.map(r => ({
      'Ranking Volume': r.ranking,
      'Mês': `${r.mes} - ${r.mesNome}`,
      'Volume Previsto (HL)': r.volPrevistoHL,
      'Real Colaboradores': r.realColaboradores,
      'Colaborador em Férias': r.colaboradorFerias,
      'Data Início Férias': r.diaInicioFerias,
      'Data Fim Férias': r.diaFimFerias,
      'Efetivo Ativo Disponível': r.efetivoAtivo,
      'Quadro Necessário / Ideal (Coluna1)': r.quadroIdeal,
      'Déficit / Gap de Headcount': r.gapColaboradores > 0 ? `+${r.gapColaboradores} FTE` : `${r.gapColaboradores} FTE`,
      'Decisão de Gestão': r.acaoTexto,
      'Horas Extras Estimadas (se não aumentar)': `${r.horasExtrasEstimadas} HH`,
      'HE Média por Pessoa/Dia': `${r.hePorColabDia} h/dia`
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Simulador_WLP_Ferias_2026');
    XLSX.writeFile(workbook, 'Simulador_WLP_Previsao_Volumes_Ferias_2026.xlsx');
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Banner & Analytical Introduction */}
      <div className="bg-gradient-to-r from-[#032b5e] via-[#054394] to-[#1e56f0] rounded-2xl p-6 text-white shadow-xl relative overflow-hidden border border-blue-400/20">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400/20 border border-amber-300/30 rounded-full text-amber-200 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Simulador Estratégico WLP & Dimensionamento de Pessoal 2026
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight font-sans">
              Previsão de Volumes, Férias & Curva de Headcount
            </h1>
            <p className="text-blue-100 text-sm leading-relaxed">
              Diagnóstico preditivo de capacidade operacional. Analise o impacto dos volumes em hectolitros (HL), 
              o escalonamento de férias dos colaboradores e descubra exatamente quais meses exigem{' '}
              <strong className="text-amber-300 font-semibold">aumento de quadro</strong>, remanejamento ou controle de horas extras.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handleExportExcel}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-2 shadow-lg transition-all cursor-pointer border-none"
              title="Baixar planilha com simulações e férias completas"
            >
              <Download className="w-4 h-4" />
              Exportar Excel (.xlsx)
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-2 border border-white/20 transition-all cursor-pointer"
              title="Restaurar parâmetros padrão"
            >
              <RotateCcw className="w-4 h-4" />
              Restaurar Modelo
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards: High-Level Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Volume Anual */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4.5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Volume Previsto 2026</span>
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {executiveTotals.totalVol.toLocaleString('pt-BR')}
            </span>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">HL</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Média Mensal:</span>
            <strong className="text-slate-700 dark:text-slate-200 font-mono">
              {executiveTotals.mediaVol.toLocaleString('pt-BR')} HL/mês
            </strong>
          </div>
        </div>

        {/* Card 2: Headcount Real vs Ideal */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4.5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quadro Atual vs Ideal</span>
            <div className="p-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {executiveTotals.mediaReal}
            </span>
            <span className="text-xs font-semibold text-slate-400">vs</span>
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
              {executiveTotals.mediaIdeal}
            </span>
            <span className="text-xs font-bold text-slate-500">FTE</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Efetivo Ativo c/ Férias:</span>
            <strong className="text-rose-600 dark:text-rose-400 font-mono">
              {executiveTotals.mediaEfetivoAtivo} colaboradores
            </strong>
          </div>
        </div>

        {/* Card 3: Gap Médio de Headcount */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4.5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Déficit Médio / Gap</span>
            <div className="p-2 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-lg">
              <UserPlus className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
              +{executiveTotals.gapMedio}
            </span>
            <span className="text-xs font-bold text-rose-500">FTE / mês</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Meses p/ Aumentar:</span>
            <strong className="text-rose-600 font-bold">
              {executiveTotals.totalMesesAumentar} de 12 meses
            </strong>
          </div>
        </div>

        {/* Card 4: Pico de Fim de Ano & Férias */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4.5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pico Máximo de Demanda</span>
            <div className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono">
              Dezembro
            </span>
            <span className="text-xs font-bold text-slate-500 font-mono">(19.437 HL)</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Quadro Necessário:</span>
            <strong className="text-purple-600 font-bold font-mono">
              23 FTE (+8 acima do real)
            </strong>
          </div>
        </div>
      </div>

      {/* Simulator Interactive Parameters Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
          <Sliders className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Parâmetros Dinâmicos de Produtividade & Simulação What-If
          </h2>
          <span className="ml-auto text-xs text-slate-400 hidden sm:inline">
            Ajuste os parâmetros para simular o comportamento de horas e dimensionamento
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 pt-4">
          {/* Param 1: Meta WLP */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Meta WLP Alvo:</span>
              <strong className="font-mono text-blue-600">{targetMetaWlp.toFixed(2)} HL/HH</strong>
            </div>
            <input
              type="range"
              min="5.0"
              max="28.0"
              step="0.05"
              value={targetMetaWlp}
              onChange={(e) => setTargetMetaWlp(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>5.0 (Conservador)</span>
              <span>6.59 (Oficial)</span>
              <span>25.0 (DPO Armazém)</span>
            </div>
          </div>

          {/* Param 2: Turno Padrão */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Jornada Diária (h):</span>
              <strong className="font-mono text-slate-900 dark:text-white">{shiftHours.toFixed(2)} h</strong>
            </div>
            <input
              type="number"
              step="0.01"
              min="6.0"
              max="10.0"
              value={shiftHours}
              onChange={(e) => setShiftHours(parseFloat(e.target.value) || 7.33)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-[10px] text-slate-400">Padrão DPO: 7.33h úteis</span>
          </div>

          {/* Param 3: Dias Úteis */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Dias Úteis / Mês:</span>
              <strong className="font-mono text-slate-900 dark:text-white">{workingDays} dias</strong>
            </div>
            <input
              type="number"
              min="18"
              max="26"
              value={workingDays}
              onChange={(e) => setWorkingDays(parseInt(e.target.value, 10) || 22)}
              className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-[10px] text-slate-400">Média operacional: 22 dias</span>
          </div>

          {/* Param 4: Absenteísmo */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Absenteísmo Estimado:</span>
              <strong className="font-mono text-amber-600">{absenteeismRate.toFixed(1)}%</strong>
            </div>
            <input
              type="range"
              min="0"
              max="8"
              step="0.1"
              value={absenteeismRate}
              onChange={(e) => setAbsenteeismRate(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>0% (Zero)</span>
              <span>1.5% (Tolerável)</span>
              <span>8% (Crítico)</span>
            </div>
          </div>

          {/* Param 5: Tolerância de Horas Extras */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Tolerância HE (%):</span>
              <strong className="font-mono text-purple-600">{extraHoursTolerance.toFixed(1)}%</strong>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              step="0.5"
              value={extraHoursTolerance}
              onChange={(e) => setExtraHoursTolerance(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>0%</span>
              <span>5% (DPO)</span>
              <span>20% (Pico)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Charts: Volume vs Headcount Curve & Headcount Gap */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Curva de Volume vs Quadro Ideal vs Quadro Real */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                Curva de Volume (HL) & Dimensionamento de Pessoal (FTE) 2026
              </h3>
              <p className="text-xs text-slate-500">
                Comparação mês a mês entre Volume Previsto e Quadro de Colaboradores (Real vs Ativo c/ Férias vs Ideal)
              </p>
            </div>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fontWeight: 'bold' }} stroke="#64748b" />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} stroke="#1e56f0" domain={[8000, 21000]} unit=" HL" />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} stroke="#e11d48" domain={[10, 26]} unit=" FTE" />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1.5 min-w-[200px]">
                          <div className="font-bold border-b border-slate-700 pb-1 text-blue-300">
                            {label} - Mês {data.mes}
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Volume Previsto:</span>
                            <span className="font-mono font-bold text-blue-400">{data.volPrevistoHL.toLocaleString('pt-BR')} HL</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Quadro Ideal (Coluna1):</span>
                            <span className="font-mono font-bold text-amber-400">{data.quadroIdeal} FTE</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Real Atual:</span>
                            <span className="font-mono font-bold text-slate-300">{data.realColaboradores} FTE</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Efetivo Ativo (c/ férias):</span>
                            <span className="font-mono font-bold text-rose-400">{data.efetivoAtivo} FTE</span>
                          </div>
                          <div className="flex justify-between pt-1 border-t border-slate-800">
                            <span className="text-slate-300 font-semibold">Déficit / Gap:</span>
                            <span className="font-mono font-bold text-rose-300">+{data.gapColaboradores} colaboradores</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar yAxisId="left" dataKey="volPrevistoHL" name="Volume Previsto (HL)" fill="#3b82f6" radius={[4, 4, 0, 0]} opacity={0.85} />
                <Line yAxisId="right" type="monotone" dataKey="quadroIdeal" name="Quadro Ideal (FTE)" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b' }} />
                <Line yAxisId="right" type="monotone" dataKey="realColaboradores" name="Real Colaboradores" stroke="#64748b" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
                <Line yAxisId="right" type="monotone" dataKey="efetivoAtivo" name="Efetivo Ativo (c/ Férias)" stroke="#e11d48" strokeWidth={2.5} dot={{ r: 4, fill: '#e11d48' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Gap de Headcount Mês a Mês */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-rose-600" />
              Necessidade de Aumento de Quadro (FTE)
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Quantidade de colaboradores adicionais necessários para cada mês
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="mes" tick={{ fontSize: 10 }} stroke="#64748b" />
                <YAxis tick={{ fontSize: 10 }} stroke="#64748b" domain={[0, 9]} unit=" FTE" />
                <Tooltip
                  formatter={(value: any) => [`+${value} colaboradores`, 'Déficit / Aumento Necessário']}
                  labelFormatter={(label) => `Mês: ${label}`}
                />
                <Bar dataKey="gapColaboradores" name="Aumento Necessário" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => {
                    let color = '#f59e0b';
                    if (entry.gapColaboradores >= 8) color = '#9333ea';
                    else if (entry.gapColaboradores >= 6) color = '#e11d48';
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs text-rose-900 dark:text-rose-300">
            <div className="flex items-center gap-1.5 font-bold mb-0.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              Diagnóstico do Analista:
            </div>
            Todos os 12 meses apresentam déficit em relação ao quadro ideal de 19 a 23 FTE. Dezembro é o pico crítico (+8 FTE).
          </div>
        </div>
      </div>

      {/* Main Table: Matriz Oficial de Volumes e Férias 2026 (Exata da imagem do usuário) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {/* Table Header Bar */}
        <div className="bg-[#f59e0b] px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-slate-950">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-950" />
            <h3 className="text-base font-black uppercase tracking-wider font-sans">
              VOLUMES E FÉRIAS 2026 — MATRIZ DE PLANEJAMENTO OFICIAL
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="bg-white/40 px-2.5 py-1 rounded-md text-slate-900">
              12 Meses Mapeados
            </span>
            <span className="bg-white/40 px-2.5 py-1 rounded-md text-slate-900">
              6 Colaboradores em Férias
            </span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600 dark:text-slate-400">Filtrar Trimestre:</span>
            <div className="flex gap-1">
              {(['TODOS', 'Q1', 'Q2', 'Q3', 'Q4'] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => setSelectedQuarterFilter(q)}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    selectedQuarterFilter === q
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-600'
                  }`}
                >
                  {q === 'TODOS' ? 'Todos os Meses' : q}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600 dark:text-slate-400">Ordenar por:</span>
            <select
              value={selectedSort}
              onChange={(e: any) => setSelectedSort(e.target.value)}
              className="px-3 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 font-semibold focus:ring-2 focus:ring-blue-500"
            >
              <option value="CRONOLOGICO">Cronológico (Jan a Dez)</option>
              <option value="RANKING_VOLUME">Ranking de Volume (Menor ao Maior)</option>
              <option value="GAP_QUADRO">Maior Déficit / Gap de Quadro</option>
            </select>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#032b5e] text-white font-bold uppercase tracking-wider text-[11px] border-b border-blue-900">
                <th className="py-3 px-3.5 text-center">Ranking</th>
                <th className="py-3 px-3.5">Mês</th>
                <th className="py-3 px-3.5 text-right">Volume Previsto (HL)</th>
                <th className="py-3 px-3.5 text-center bg-[#10b981]/20 text-emerald-300">Real Colaboradores</th>
                <th className="py-3 px-3.5 text-center bg-[#f59e0b]/20 text-amber-300">Quadro Ideal (Coluna1)</th>
                <th className="py-3 px-4">Colaborador em Férias</th>
                <th className="py-3 px-3 text-center">Dia Início</th>
                <th className="py-3 px-3 text-center">Dia Fim</th>
                <th className="py-3 px-3.5 text-center">Efetivo Ativo</th>
                <th className="py-3 px-3.5 text-center bg-rose-950/40 text-rose-300">Déficit / Gap</th>
                <th className="py-3 px-4 text-center">Decisão Estratégica</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
              {filteredAndSortedRows.map((row, idx) => {
                const isPeak = row.volPrevistoHL >= 15000;
                const isCriticalGap = row.gapColaboradores >= 6;

                return (
                  <tr
                    key={row.mes}
                    className={`hover:bg-blue-50/50 dark:hover:bg-slate-800/60 transition-colors ${
                      idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-900/40'
                    } ${isPeak ? 'bg-purple-50/40 dark:bg-purple-950/20' : ''}`}
                  >
                    {/* Ranking */}
                    <td className="py-3 px-3.5 text-center font-bold text-slate-700 dark:text-slate-300">
                      <span className="inline-block px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono">
                        #{row.ranking}
                      </span>
                    </td>

                    {/* Mês */}
                    <td className="py-3 px-3.5 font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-blue-700 dark:text-blue-400">{row.mes}</span>
                        <span className="text-[10px] text-slate-400">({row.mesNome})</span>
                      </div>
                    </td>

                    {/* Volume Previsto (HL) */}
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center justify-end gap-1.5">
                        <span>{row.volPrevistoHL.toLocaleString('pt-BR')}</span>
                        <span className="text-[10px] text-slate-400 font-sans">HL</span>
                      </div>
                    </td>

                    {/* Real Colaboradores */}
                    <td className="py-3 px-3.5 text-center font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20">
                      {row.realColaboradores}
                    </td>

                    {/* Quadro Ideal (Coluna1) */}
                    <td className="py-3 px-3.5 text-center font-mono font-black text-amber-700 dark:text-amber-400 bg-amber-50/40 dark:bg-amber-950/20">
                      {row.quadroIdeal}
                    </td>

                    {/* Colaborador em Férias */}
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {row.temFerias ? (
                        <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-bold">
                          <UserMinus className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate max-w-[220px]" title={row.colaboradorFerias}>
                            {row.colaboradorFerias}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">NÃO CONTEMPLA</span>
                      )}
                    </td>

                    {/* Dia Início */}
                    <td className="py-3 px-3 text-center font-mono text-[11px]">
                      {row.temFerias ? (
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 rounded font-semibold border border-rose-200/50">
                          {row.diaInicioFerias}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">NÃO CONTEMPLA</span>
                      )}
                    </td>

                    {/* Dia Fim */}
                    <td className="py-3 px-3 text-center font-mono text-[11px]">
                      {row.temFerias ? (
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 rounded font-semibold border border-rose-200/50">
                          {row.diaFimFerias}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">NÃO CONTEMPLA</span>
                      )}
                    </td>

                    {/* Efetivo Ativo Disponível */}
                    <td className="py-3 px-3.5 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                      <span className={`px-2 py-0.5 rounded font-mono ${
                        row.temFerias ? 'bg-amber-100 text-amber-900 font-black' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {row.efetivoAtivo} FTE
                      </span>
                    </td>

                    {/* Déficit / Gap */}
                    <td className="py-3 px-3.5 text-center font-mono font-black text-rose-600 dark:text-rose-400 bg-rose-50/40 dark:bg-rose-950/20">
                      <div className="flex items-center justify-center gap-1">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>+{row.gapColaboradores}</span>
                      </div>
                    </td>

                    {/* Decisão Estratégica */}
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${row.badgeCor}`}>
                        {row.acao === 'AUMENTAR' && <UserPlus className="w-3 h-3" />}
                        {row.acaoTexto}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-700 text-xs">
                <td colSpan={2} className="py-3 px-3.5 text-right font-black uppercase">
                  Média / Acumulado Anual:
                </td>
                <td className="py-3 px-3.5 text-right font-mono text-blue-600 dark:text-blue-400">
                  {executiveTotals.totalVol.toLocaleString('pt-BR')} HL
                </td>
                <td className="py-3 px-3.5 text-center font-mono text-emerald-600">
                  {executiveTotals.mediaReal} FTE (méd)
                </td>
                <td className="py-3 px-3.5 text-center font-mono text-amber-600">
                  {executiveTotals.mediaIdeal} FTE (méd)
                </td>
                <td colSpan={3} className="py-3 px-4 text-center text-slate-500 font-semibold text-[11px]">
                  {executiveTotals.totalColabsFeriasAno} Colaboradores em Férias (Fev a Ago)
                </td>
                <td className="py-3 px-3.5 text-center font-mono text-slate-700">
                  {executiveTotals.mediaEfetivoAtivo} FTE (méd)
                </td>
                <td className="py-3 px-3.5 text-center font-mono text-rose-600 font-black">
                  +{executiveTotals.gapMedio} FTE (méd)
                </td>
                <td className="py-3 px-4 text-center text-rose-600 font-bold">
                  AUMENTAR EM TODOS OS MESES
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Strategic Decision & Action Plan per Quarter (Q1 to Q4) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Briefcase className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Plano de Ação Tático & Recomendações de Gestão de Pessoal (Analista DPO)
            </h3>
            <p className="text-xs text-slate-500">
              Cronograma estratégico de contratações temporárias, cobertura de férias e escalonamento de turnos
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Q1 */}
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded font-black text-xs">
                Q1 (Jan - Mar)
              </span>
              <span className="text-xs font-bold text-slate-500">Vol: 34.622 HL</span>
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white text-xs">
              Início de Férias & Ajuste de Produtividade
            </h4>
            <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-disc list-inside">
              <li><strong>Fevereiro:</strong> Férias de Marivaldo/Kathyel (Empilhador/Ajudante). Cobertura via remanejamento interno.</li>
              <li><strong>Março:</strong> Menor volume do ano (9.803 HL). Férias de Paulo Pereira (Empilhador).</li>
              <li><strong>Ação:</strong> Aumentar +5 FTE ou alocar 1.5h de HE nos dias de pico.</li>
            </ul>
          </div>

          {/* Q2 */}
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 rounded font-black text-xs">
                Q2 (Abr - Jun)
              </span>
              <span className="text-xs font-bold text-slate-500">Vol: 36.988 HL</span>
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white text-xs">
              Aquecimento & Pico de São João (Junho)
            </h4>
            <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-disc list-inside">
              <li><strong>Abril:</strong> Férias de Dejean Silva (Ajudante). Quadro ativo cai para 13 FTE.</li>
              <li><strong>Maio:</strong> Férias de Nixon Henrique (Conferente).</li>
              <li><strong>Junho:</strong> Volume sobe para 13.647 HL (Pico). Equipe 100% ativa (sem férias).</li>
              <li><strong>Ação:</strong> Contratar 2 a 3 temporários para absorver a montagem pesada de Junho.</li>
            </ul>
          </div>

          {/* Q3 */}
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 rounded font-black text-xs">
                Q3 (Jul - Set)
              </span>
              <span className="text-xs font-bold text-slate-500">Vol: 34.298 HL</span>
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white text-xs">
              Encerramento de Férias & Estabilidade
            </h4>
            <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-disc list-inside">
              <li><strong>Julho:</strong> Férias de Gilson Rosa (Ajudante).</li>
              <li><strong>Agosto:</strong> Férias de Jose Ronildo (Empilhador). Encerra o ciclo de férias 2026.</li>
              <li><strong>Setembro:</strong> Volume volta a subir (13.233 HL) com quadro 100% disponível (15 FTE).</li>
              <li><strong>Ação:</strong> Manter quadro estabilizado e iniciar planejamento do mega pico de Dezembro.</li>
            </ul>
          </div>

          {/* Q4 */}
          <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 bg-purple-200 text-purple-900 dark:bg-purple-900 dark:text-purple-100 rounded font-black text-xs">
                Q4 (Out - Dez)
              </span>
              <span className="text-xs font-bold text-purple-700 dark:text-purple-300">Vol: 44.786 HL (CRÍTICO)</span>
            </div>
            <h4 className="font-bold text-purple-950 dark:text-purple-200 text-xs">
              Mega Pico de Fim de Ano (Dezembro: 19.437 HL)
            </h4>
            <ul className="text-xs text-purple-900 dark:text-purple-300 space-y-1.5 list-disc list-inside">
              <li><strong>Out/Nov:</strong> Volumes altos (~13.287 HL e 12.062 HL). 0 colaboradores em férias.</li>
              <li><strong>Dezembro:</strong> Volume recorde (19.437 HL). Quadro necessário: 23 FTE.</li>
              <li><strong>Ação Crítica:</strong> Contratar <strong>+8 colaboradores temporários/terceirizados</strong> em Outubro/Novembro para treinamento e integração prévia.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WlpSimulatorHeadcountTab;
