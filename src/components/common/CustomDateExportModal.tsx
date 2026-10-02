import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { 
  Calendar, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  X, 
  Check, 
  Filter, 
  Clock, 
  Layers, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export function toISODate(dateStr?: string | null): string {
  if (!dateStr) return '';
  const s = String(dateStr).trim();
  if (!s) return '';
  
  // Check if DD/MM/YYYY or DD-MM-YYYY
  if (s.includes('/') || (s.includes('-') && s.split('-')[0].length <= 2)) {
    const sep = s.includes('/') ? '/' : '-';
    const parts = s.split(sep);
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      let year = parts[2].split(' ')[0].split('T')[0];
      if (year.length === 2) year = `20${year}`;
      return `${year}-${month}-${day}`;
    }
  }

  // Check if YYYY-MM-DD
  if (s.includes('-')) {
    const parts = s.split('T')[0].split(' ')[0].split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
  }

  return s.split('T')[0];
}

export function isDateWithinInterval(dateStr?: string | null, startISO?: string, endISO?: string): boolean {
  const iso = toISODate(dateStr);
  if (!iso) return false;
  if (startISO && iso < startISO) return false;
  if (endISO && iso > endISO) return false;
  return true;
}

export interface SummaryMetric {
  label: string;
  value: string | number;
  highlight?: boolean;
}

interface CustomDateExportModalProps<T> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  records: T[];
  dateExtractor: (row: T) => string | undefined;
  formatDataForExcel: (filteredRows: T[]) => Record<string, any>[];
  defaultFileName: string;
  sheetName?: string;
  theme?: 'light' | 'dark';
  accentColor?: 'amber' | 'red' | 'blue' | 'emerald';
  extraSummary?: (filteredRows: T[]) => SummaryMetric[];
  onApplyScreenFilter?: (startISO: string, endISO: string) => void;
  onClearScreenFilter?: () => void;
  currentScreenFilter?: { startISO: string; endISO: string };
}

export function CustomDateExportModal<T>({
  isOpen,
  onClose,
  title,
  subtitle,
  records,
  dateExtractor,
  formatDataForExcel,
  defaultFileName,
  sheetName = 'Dados',
  accentColor = 'amber',
  extraSummary,
  onApplyScreenFilter,
  onClearScreenFilter,
  currentScreenFilter
}: CustomDateExportModalProps<T>) {
  // Compute initial dates based on available records or current filter
  const todayISO = useMemo(() => new Date().toISOString().split('T')[0], []);
  
  const [startDate, setStartDate] = useState<string>(() => {
    if (currentScreenFilter?.startISO) return currentScreenFilter.startISO;
    return '';
  });

  const [endDate, setEndDate] = useState<string>(() => {
    if (currentScreenFilter?.endISO) return currentScreenFilter.endISO;
    return '';
  });

  const [exporting, setExporting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Filtered rows for current date selection
  const filteredRows = useMemo(() => {
    if (!startDate && !endDate) return records;
    return records.filter(row => {
      const rawDate = dateExtractor(row);
      return isDateWithinInterval(rawDate, startDate, endDate);
    });
  }, [records, dateExtractor, startDate, endDate]);

  // Accent color themes
  const colorMap = {
    amber: {
      btn: 'from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 shadow-amber-500/20',
      badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      presetActive: 'bg-amber-500 text-slate-950 font-bold'
    },
    red: {
      btn: 'from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 text-white shadow-rose-600/20',
      badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      border: 'border-rose-500/30',
      text: 'text-rose-400',
      presetActive: 'bg-rose-600 text-white font-bold'
    },
    blue: {
      btn: 'from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-blue-600/20',
      badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      border: 'border-blue-500/30',
      text: 'text-blue-400',
      presetActive: 'bg-blue-600 text-white font-bold'
    },
    emerald: {
      btn: 'from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-emerald-600/20',
      badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
      presetActive: 'bg-emerald-600 text-white font-bold'
    }
  };

  const themeStyle = colorMap[accentColor] || colorMap.amber;

  // Preset quick handlers
  const handlePreset = (preset: 'today' | 'yesterday' | 'last7' | 'last30' | 'thisMonth' | 'all') => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    switch (preset) {
      case 'today': {
        const iso = toISO(now);
        setStartDate(iso);
        setEndDate(iso);
        break;
      }
      case 'yesterday': {
        const yest = new Date(now);
        yest.setDate(yest.getDate() - 1);
        const iso = toISO(yest);
        setStartDate(iso);
        setEndDate(iso);
        break;
      }
      case 'last7': {
        const past7 = new Date(now);
        past7.setDate(past7.getDate() - 6);
        setStartDate(toISO(past7));
        setEndDate(toISO(now));
        break;
      }
      case 'last30': {
        const past30 = new Date(now);
        past30.setDate(past30.getDate() - 29);
        setStartDate(toISO(past30));
        setEndDate(toISO(now));
        break;
      }
      case 'thisMonth': {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        setStartDate(toISO(firstDay));
        setEndDate(toISO(now));
        break;
      }
      case 'all': {
        setStartDate('');
        setEndDate('');
        break;
      }
    }
  };

  // Excel Export Handler
  const handleExportExcel = () => {
    if (filteredRows.length === 0) {
      alert('Nenhum registro encontrado no período selecionado.');
      return;
    }

    try {
      setExporting(true);
      const dataToExport = formatDataForExcel(filteredRows);
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(dataToExport);

      // Auto size columns
      if (dataToExport.length > 0) {
        const headers = Object.keys(dataToExport[0]);
        ws['!cols'] = headers.map(key => ({
          wch: Math.max(key.length, 12) + 3
        }));
      }

      XLSX.utils.book_append_sheet(wb, ws, sheetName);

      const periodStr = startDate && endDate 
        ? `${startDate}_ate_${endDate}` 
        : (startDate ? `a_partir_de_${startDate}` : (endDate ? `ate_${endDate}` : 'completo'));
      
      const fileName = `${defaultFileName}_${periodStr}.xlsx`;
      XLSX.writeFile(wb, fileName);

      setSuccessMsg(`✓ Arquivo Excel "${fileName}" gerado com sucesso (${filteredRows.length} registros)!`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error('Erro ao exportar Excel:', err);
      alert('Erro ao exportar arquivo Excel: ' + (err?.message || err));
    } finally {
      setExporting(false);
    }
  };

  // CSV Export Handler
  const handleExportCSV = () => {
    if (filteredRows.length === 0) {
      alert('Nenhum registro encontrado no período selecionado.');
      return;
    }

    try {
      setExporting(true);
      const dataToExport = formatDataForExcel(filteredRows);
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const csv = XLSX.utils.sheet_to_csv(ws);

      const periodStr = startDate && endDate 
        ? `${startDate}_ate_${endDate}` 
        : (startDate ? `a_partir_de_${startDate}` : (endDate ? `ate_${endDate}` : 'completo'));
      
      const fileName = `${defaultFileName}_${periodStr}.csv`;
      const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);

      setSuccessMsg(`✓ Arquivo CSV "${fileName}" gerado com sucesso (${filteredRows.length} registros)!`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error('Erro ao exportar CSV:', err);
      alert('Erro ao exportar arquivo CSV: ' + (err?.message || err));
    } finally {
      setExporting(false);
    }
  };

  // Screen Filter Application
  const handleApplyToScreen = () => {
    if (onApplyScreenFilter) {
      onApplyScreenFilter(startDate, endDate);
      onClose();
    }
  };

  const handleClearScreenFilter = () => {
    setStartDate('');
    setEndDate('');
    if (onClearScreenFilter) {
      onClearScreenFilter();
    }
  };

  if (!isOpen) return null;

  const extraMetrics = extraSummary ? extraSummary(filteredRows) : [];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-[#11151c] border border-[#222d3a] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100"
        onClick={e => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="p-5 border-b border-[#222d3a] flex items-center justify-between bg-gradient-to-r from-[#151b23] to-[#0e131a]">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${themeStyle.badge}`}>
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-sans font-black text-base uppercase tracking-wide text-white">
                {title}
              </h3>
              <p className="text-xs text-[#8a9ba8] mt-0.5">
                {subtitle || 'Selecione datas personalizadas e exporte os dados consolidados.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#8a9ba8] hover:text-white hover:bg-[#222d3a] transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 flex flex-col gap-5 overflow-y-auto max-h-[80vh]">
          {/* QUICK PRESETS */}
          <div>
            <label className="text-[11px] font-black uppercase tracking-wider text-[#8a9ba8] block mb-2">
              Atalhos Rápidos de Período:
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              <button
                type="button"
                onClick={() => handlePreset('today')}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#151b23] hover:bg-[#1f2733] border border-[#222d3a] transition-all cursor-pointer text-center text-slate-200"
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={() => handlePreset('yesterday')}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#151b23] hover:bg-[#1f2733] border border-[#222d3a] transition-all cursor-pointer text-center text-slate-200"
              >
                Ontem
              </button>
              <button
                type="button"
                onClick={() => handlePreset('last7')}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#151b23] hover:bg-[#1f2733] border border-[#222d3a] transition-all cursor-pointer text-center text-slate-200"
              >
                7 Dias
              </button>
              <button
                type="button"
                onClick={() => handlePreset('last30')}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#151b23] hover:bg-[#1f2733] border border-[#222d3a] transition-all cursor-pointer text-center text-slate-200"
              >
                30 Dias
              </button>
              <button
                type="button"
                onClick={() => handlePreset('thisMonth')}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#151b23] hover:bg-[#1f2733] border border-[#222d3a] transition-all cursor-pointer text-center text-slate-200"
              >
                Mês Atual
              </button>
              <button
                type="button"
                onClick={() => handlePreset('all')}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#151b23] hover:bg-[#1f2733] border border-[#222d3a] transition-all cursor-pointer text-center text-amber-400 font-bold"
              >
                Todo Histórico
              </button>
            </div>
          </div>

          {/* CUSTOM DATE INPUTS */}
          <div className="bg-[#151b23] border border-[#222d3a] rounded-xl p-4 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-[#8a9ba8] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" /> Data Inicial:
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#0e131a] border border-[#222d3a] rounded-lg text-sm text-white font-mono focus:outline-hidden focus:border-amber-400"
              />
            </div>
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-[#8a9ba8] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" /> Data Final:
              </label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#0e131a] border border-[#222d3a] rounded-lg text-sm text-white font-mono focus:outline-hidden focus:border-amber-400"
              />
            </div>
          </div>

          {/* SUMMARY KPI PREVIEW CARD */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#151b23] border border-[#222d3a] rounded-xl p-3 flex flex-col">
              <span className="text-[10px] font-bold text-[#8a9ba8] uppercase">Registros no Período</span>
              <span className={`text-lg font-black font-mono mt-0.5 ${themeStyle.text}`}>
                {filteredRows.length.toLocaleString('pt-BR')}
              </span>
              <span className="text-[10px] text-[#6a7d92]">de {records.length.toLocaleString('pt-BR')} totais</span>
            </div>

            {extraMetrics.map((metric, idx) => (
              <div key={idx} className="bg-[#151b23] border border-[#222d3a] rounded-xl p-3 flex flex-col">
                <span className="text-[10px] font-bold text-[#8a9ba8] uppercase truncate">{metric.label}</span>
                <span className="text-lg font-black font-mono mt-0.5 text-white truncate">
                  {typeof metric.value === 'number' ? metric.value.toLocaleString('pt-BR') : metric.value}
                </span>
              </div>
            ))}

            <div className="bg-[#151b23] border border-[#222d3a] rounded-xl p-3 flex flex-col">
              <span className="text-[10px] font-bold text-[#8a9ba8] uppercase">Status Filtro</span>
              <span className="text-xs font-semibold mt-1 text-slate-300">
                {!startDate && !endDate ? 'Sem restrição (Geral)' : `${startDate ? startDate.split('-').reverse().join('/') : 'Início'} ➔ ${endDate ? endDate.split('-').reverse().join('/') : 'Fim'}`}
              </span>
            </div>
          </div>

          {/* SUCCESS NOTIFICATION */}
          {successMsg && (
            <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {filteredRows.length === 0 && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Nenhum registro localizado no intervalo selecionado. Experimente alterar ou ampliar as datas.</span>
            </div>
          )}
        </div>

        {/* MODAL FOOTER WITH ACTIONS */}
        <div className="p-5 border-t border-[#222d3a] bg-[#151b23] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {onApplyScreenFilter && (
              <button
                type="button"
                onClick={handleApplyToScreen}
                disabled={filteredRows.length === 0}
                className="px-3.5 py-2.5 rounded-xl bg-[#222d3a] hover:bg-[#2c3949] text-xs font-bold uppercase tracking-wider text-slate-200 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Filter className="w-4 h-4 text-amber-400" />
                <span>Aplicar na Tela</span>
              </button>
            )}
            {(startDate || endDate) && onClearScreenFilter && (
              <button
                type="button"
                onClick={handleClearScreenFilter}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-[#8a9ba8] hover:text-white transition-colors cursor-pointer"
              >
                Limpar Datas
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={exporting || filteredRows.length === 0}
              className="px-4 py-2.5 rounded-xl border border-[#2c3949] bg-[#0e131a] hover:bg-[#1a222d] text-xs font-bold uppercase tracking-wider text-slate-200 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <FileText className="w-4 h-4 text-blue-400" />
              <span>Exportar CSV</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              disabled={exporting || filteredRows.length === 0}
              className={`px-5 py-2.5 rounded-xl bg-gradient-to-r ${themeStyle.btn} text-xs font-black uppercase tracking-wider shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{exporting ? 'Gerando Planilha...' : 'Exportar Excel (.xlsx)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
