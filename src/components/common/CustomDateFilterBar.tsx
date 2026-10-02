import React from 'react';
import { Calendar, Filter, X, Download, FileSpreadsheet, RotateCcw } from 'lucide-react';

interface CustomDateFilterBarProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (val: string) => void;
  onEndDateChange: (val: string) => void;
  onReset: () => void;
  onOpenExportModal: () => void;
  totalFiltered: number;
  totalAll: number;
  accentColor?: 'amber' | 'red' | 'blue' | 'emerald';
  label?: string;
  unitLabel?: string;
  extraStats?: string;
}

export function CustomDateFilterBar({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onReset,
  onOpenExportModal,
  totalFiltered,
  totalAll,
  accentColor = 'amber',
  label = 'Filtrar Histórico por Período:',
  unitLabel = 'registros',
  extraStats
}: CustomDateFilterBarProps) {
  const isFiltered = !!(startDate || endDate);

  const colorStyles = {
    amber: {
      activeBorder: 'border-amber-500/40',
      badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      exportBtn: 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 border-amber-400',
      focus: 'focus:border-amber-400'
    },
    red: {
      activeBorder: 'border-rose-500/40',
      badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      exportBtn: 'bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 text-white border-rose-500',
      focus: 'focus:border-rose-400'
    },
    blue: {
      activeBorder: 'border-blue-500/40',
      badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      exportBtn: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-blue-500',
      focus: 'focus:border-blue-400'
    },
    emerald: {
      activeBorder: 'border-emerald-500/40',
      badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      exportBtn: 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white border-emerald-500',
      focus: 'focus:border-emerald-400'
    }
  };

  const currentTheme = colorStyles[accentColor] || colorStyles.amber;

  // Preset handlers
  const handlePreset = (preset: 'today' | '7d' | '30d' | 'month' | 'all') => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (preset === 'today') {
      const todayStr = toISO(now);
      onStartDateChange(todayStr);
      onEndDateChange(todayStr);
    } else if (preset === '7d') {
      const past = new Date(now);
      past.setDate(past.getDate() - 6);
      onStartDateChange(toISO(past));
      onEndDateChange(toISO(now));
    } else if (preset === '30d') {
      const past = new Date(now);
      past.setDate(past.getDate() - 29);
      onStartDateChange(toISO(past));
      onEndDateChange(toISO(now));
    } else if (preset === 'month') {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      onStartDateChange(toISO(first));
      onEndDateChange(toISO(now));
    } else if (preset === 'all') {
      onReset();
    }
  };

  return (
    <div className={`bg-[#11151c] border ${isFiltered ? currentTheme.activeBorder : 'border-[#222d3a]'} rounded-xl p-3.5 shadow-sm flex flex-col gap-3 transition-colors`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* LEFT: LABEL & DATE INPUTS */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-300">
            <Calendar className="w-4 h-4 text-amber-400" />
            <span>{label}</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="text-[10px] uppercase font-bold text-[#6a7d92]">De</span>
              <input
                type="date"
                value={startDate}
                onChange={e => onStartDateChange(e.target.value)}
                className={`bg-[#0e131a] border border-[#222d3a] ${currentTheme.focus} rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-hidden`}
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] uppercase font-bold text-[#6a7d92]">Até</span>
              <input
                type="date"
                value={endDate}
                onChange={e => onEndDateChange(e.target.value)}
                className={`bg-[#0e131a] border border-[#222d3a] ${currentTheme.focus} rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-hidden`}
              />
            </div>
          </div>

          {/* PRESETS */}
          <div className="flex items-center gap-1 bg-[#0e131a] p-1 rounded-lg border border-[#222d3a]">
            <button
              type="button"
              onClick={() => handlePreset('today')}
              className="px-2 py-0.5 rounded text-[10px] font-bold text-slate-300 hover:text-white hover:bg-[#1f2733] transition-colors cursor-pointer"
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={() => handlePreset('7d')}
              className="px-2 py-0.5 rounded text-[10px] font-bold text-slate-300 hover:text-white hover:bg-[#1f2733] transition-colors cursor-pointer"
            >
              7 Dias
            </button>
            <button
              type="button"
              onClick={() => handlePreset('30d')}
              className="px-2 py-0.5 rounded text-[10px] font-bold text-slate-300 hover:text-white hover:bg-[#1f2733] transition-colors cursor-pointer"
            >
              30 Dias
            </button>
            <button
              type="button"
              onClick={() => handlePreset('month')}
              className="px-2 py-0.5 rounded text-[10px] font-bold text-slate-300 hover:text-white hover:bg-[#1f2733] transition-colors cursor-pointer"
            >
              Mês
            </button>
            {isFiltered && (
              <button
                type="button"
                onClick={onReset}
                className="px-2 py-0.5 rounded text-[10px] font-bold text-amber-400 hover:text-amber-300 hover:bg-[#1f2733] transition-colors cursor-pointer flex items-center gap-1"
                title="Limpar filtro"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Limpar</span>
              </button>
            )}
          </div>
        </div>

        {/* RIGHT: EXPORT BUTTON & COUNT */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-black font-mono border ${currentTheme.badge}`}>
              {totalFiltered.toLocaleString('pt-BR')} {unitLabel}
              {isFiltered && ` de ${totalAll.toLocaleString('pt-BR')}`}
            </span>
            {extraStats && (
              <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline">
                {extraStats}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onOpenExportModal}
            className={`px-3.5 py-1.5 rounded-lg border font-sans font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all cursor-pointer ${currentTheme.exportBtn}`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar Período</span>
          </button>
        </div>
      </div>
    </div>
  );
}
