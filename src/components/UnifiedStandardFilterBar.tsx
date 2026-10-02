import React, { useState } from 'react';
import { useCrossFilter } from '../context/CrossFilterContext';
import { Filter, Calendar, Package, Users, Tag, AlertCircle, RefreshCw, Layers } from 'lucide-react';

interface UnifiedStandardFilterBarProps {
  theme?: 'dark' | 'light';
  onFilterChange?: () => void;
  className?: string;
}

export const UnifiedStandardFilterBar: React.FC<UnifiedStandardFilterBarProps> = ({
  theme,
  onFilterChange,
  className = ''
}) => {
  const { filters, setFilter, removeFilter, clearAllFilters, filterCount } = useCrossFilter();

  const [startDate, setStartDate] = useState(String(filters['dataInicio'] || ''));
  const [endDate, setEndDate] = useState(String(filters['dataFim'] || ''));

  const handleSetDateRange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    if (start) setFilter('dataInicio', start, 'Data Início');
    else removeFilter('dataInicio');

    if (end) setFilter('dataFim', end, 'Data Fim');
    else removeFilter('dataFim');

    if (onFilterChange) onFilterChange();
  };

  const handleSelectChange = (field: string, label: string, value: string) => {
    if (value === 'todos' || !value) {
      removeFilter(field);
    } else {
      setFilter(field, value, label);
    }
    if (onFilterChange) onFilterChange();
  };

  return (
    <div className={`p-4 rounded-2xl border shadow-sm transition-all bg-white dark:bg-[#111a30] border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white ${className}`}>
      
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-black uppercase tracking-wider block text-slate-900 dark:text-white">
              Filtros Padronizados e Cruzados (Smart Cross-Filtering)
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              {filterCount > 0 ? `${filterCount} filtro(s) ativo(s) aplicando em tempo real` : 'Selecione as dimensões desejadas para filtrar todos os indicadores'}
            </span>
          </div>
        </div>

        {filterCount > 0 && (
          <button
            onClick={() => {
              clearAllFilters();
              setStartDate('');
              setEndDate('');
              if (onFilterChange) onFilterChange();
            }}
            className="px-3 py-1.5 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 hover:bg-rose-500/20 dark:hover:bg-rose-500/30 text-rose-600 dark:text-rose-300 border border-rose-300 dark:border-rose-500/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Limpar Filtros
          </button>
        )}
      </div>

      {/* FILTER GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {/* UNIDADE */}
        <div className="space-y-1">
          <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Filter className="w-3 h-3 text-cyan-600 dark:text-cyan-400" /> Unidade
          </label>
          <select
            value={String(filters['unidade'] || 'todos')}
            onChange={(e) => handleSelectChange('unidade', 'Unidade', e.target.value)}
            className="w-full px-2 py-1.5 rounded-lg text-xs font-semibold outline-none border bg-slate-50 dark:bg-[#0b1222] border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
          >
            <option value="todos" className="bg-white dark:bg-[#0b1222] text-slate-900 dark:text-white">Todas Unidades</option>
            <option value="CDD Guarabira" className="bg-white dark:bg-[#0b1222] text-slate-900 dark:text-white">CDD Guarabira</option>
            <option value="CDD João Pessoa" className="bg-white dark:bg-[#0b1222] text-slate-900 dark:text-white">CDD João Pessoa</option>
            <option value="CDD Campina Grande" className="bg-white dark:bg-[#0b1222] text-slate-900 dark:text-white">CDD Campina Grande</option>
            <option value="CDD Patos" className="bg-white dark:bg-[#0b1222] text-slate-900 dark:text-white">CDD Patos</option>
          </select>
        </div>

        {/* PERÍODO / DATA INICIO & FIM */}
        <div className="space-y-1">
          <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-amber-600 dark:text-amber-400" /> Data De / Até
          </label>
          <div className="flex items-center gap-1">
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleSetDateRange(e.target.value, endDate)}
              className="w-full px-1.5 py-1.5 rounded-lg font-mono text-[10px] outline-none border bg-slate-50 dark:bg-[#0b1222] border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => handleSetDateRange(startDate, e.target.value)}
              className="w-full px-1.5 py-1.5 rounded-lg font-mono text-[10px] outline-none border bg-slate-50 dark:bg-[#0b1222] border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* TURNO */}
        <div className="space-y-1">
          <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Tag className="w-3 h-3 text-purple-600 dark:text-purple-400" /> Turno
          </label>
          <select
            value={String(filters['turno'] || 'todos')}
            onChange={(e) => handleSelectChange('turno', 'Turno', e.target.value)}
            className="w-full px-2 py-1.5 rounded-lg text-xs font-semibold outline-none border bg-slate-50 dark:bg-[#0b1222] border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
          >
            <option value="todos" className="bg-white dark:bg-[#0b1222] text-slate-900 dark:text-white">Todos os Turnos</option>
            <option value="MANHÃ" className="bg-white dark:bg-[#0b1222] text-slate-900 dark:text-white">Turno 1 - Manhã</option>
            <option value="TARDE" className="bg-white dark:bg-[#0b1222] text-slate-900 dark:text-white">Turno 2 - Tarde</option>
            <option value="NOITE / MADRUGADA" className="bg-white dark:bg-[#0b1222] text-slate-900 dark:text-white">Turno 3 - Coruja/Noite</option>
          </select>
        </div>

        {/* PROCESSO / OPERAÇÃO */}
        <div className="space-y-1">
          <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Layers className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Processo / Operação
          </label>
          <select
            value={String(filters['area'] || 'todos')}
            onChange={(e) => handleSelectChange('area', 'Processo', e.target.value)}
            className="w-full px-2 py-1.5 rounded-lg text-xs font-semibold outline-none border bg-slate-50 dark:bg-[#0b1222] border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
          >
            <option value="todos" className="bg-white dark:bg-[#0b1222] text-slate-900 dark:text-white">Todos os Processos</option>
            <option value="Armazém" className="bg-white dark:bg-[#0b1222] text-slate-900 dark:text-white">Armazém / Estocagem</option>
            <option value="Recebimento" className="bg-white dark:bg-[#0b1222] text-slate-900 dark:text-white">Recebimento EFC</option>
            <option value="Expedição" className="bg-white dark:bg-[#0b1222] text-slate-900 dark:text-white">Expedição EFD</option>
            <option value="Picking" className="bg-white dark:bg-[#0b1222] text-slate-900 dark:text-white">Picking (Separação)</option>
            <option value="Ressuprimento" className="bg-white dark:bg-[#0b1222] text-slate-900 dark:text-white">Ressuprimento & Reabastecimento</option>
            <option value="Repack" className="bg-white dark:bg-[#0b1222] text-slate-900 dark:text-white">Repack & Recondicionamento</option>
            <option value="Despejo" className="bg-white dark:bg-[#0b1222] text-slate-900 dark:text-white">Despejo & Descarte</option>
            <option value="Quebras" className="bg-white dark:bg-[#0b1222] text-slate-900 dark:text-white">Gestão de Quebras</option>
            <option value="FEFO" className="bg-white dark:bg-[#0b1222] text-slate-900 dark:text-white">FEFO & Validades</option>
          </select>
        </div>

        {/* COLABORADOR / SUPERVISOR */}
        <div className="space-y-1">
          <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Users className="w-3 h-3 text-teal-600 dark:text-teal-400" /> Colaborador / Supervisor
          </label>
          <select
            value={String(filters['responsavel'] || 'todos')}
            onChange={(e) => handleSelectChange('responsavel', 'Responsável', e.target.value)}
            className="w-full px-2 py-1.5 rounded-lg text-xs font-semibold outline-none border bg-slate-50 dark:bg-[#0b1222] border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
          >
            <option value="todos" className="bg-white dark:bg-[#0b1222] text-slate-900 dark:text-white">Todos Colaboradores</option>
            <option value="Carlos Silva" className="bg-white dark:bg-[#0b1222] text-slate-900 dark:text-white">Carlos Silva (Operador)</option>
            <option value="Fernanda Lima" className="bg-white dark:bg-[#0b1222] text-slate-900 dark:text-white">Fernanda Lima (Operador)</option>
            <option value="Roberto Souza" className="bg-white dark:bg-[#0b1222] text-slate-900 dark:text-white">Roberto Souza (Supervisor)</option>
            <option value="Aline Mendes" className="bg-white dark:bg-[#0b1222] text-slate-900 dark:text-white">Aline Mendes (Conferente)</option>
            <option value="Marcos Oliveira" className="bg-white dark:bg-[#0b1222] text-slate-900 dark:text-white">Marcos Oliveira (Supervisor)</option>
          </select>
        </div>

        {/* MARCA / PRODUTO / FAMÍLIA */}
        <div className="space-y-1">
          <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Package className="w-3 h-3 text-blue-600 dark:text-blue-400" /> Marca / Família
          </label>
          <select
            value={String(filters['marca'] || 'todos')}
            onChange={(e) => handleSelectChange('marca', 'Marca/Família', e.target.value)}
            className="w-full px-2 py-1.5 rounded-lg text-xs font-semibold outline-none border bg-slate-50 dark:bg-[#0b1222] border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
          >
            <option value="todos" className="bg-white dark:bg-[#0b1222] text-slate-900 dark:text-white">Todas as Marcas</option>
            <option value="Skol" className="bg-white dark:bg-[#0b1222] text-slate-900 dark:text-white">Skol</option>
            <option value="Brahma" className="bg-white dark:bg-[#0b1222] text-slate-900 dark:text-white">Brahma</option>
            <option value="Antarctica" className="bg-white dark:bg-[#0b1222] text-slate-900 dark:text-white">Antarctica</option>
            <option value="Stella Artois" className="bg-white dark:bg-[#0b1222] text-slate-900 dark:text-white">Stella Artois</option>
            <option value="Corona" className="bg-white dark:bg-[#0b1222] text-slate-900 dark:text-white">Corona</option>
            <option value="Spaten" className="bg-white dark:bg-[#0b1222] text-slate-900 dark:text-white">Spaten</option>
            <option value="Guaraná Antarctica" className="bg-white dark:bg-[#0b1222] text-slate-900 dark:text-white">Guaraná Antarctica</option>
            <option value="Pepsi" className="bg-white dark:bg-[#0b1222] text-slate-900 dark:text-white">Pepsi</option>
            <option value="Gatorade" className="bg-white dark:bg-[#0b1222] text-slate-900 dark:text-white">Gatorade</option>
            <option value="Suco do Bem" className="bg-white dark:bg-[#0b1222] text-slate-900 dark:text-white">Suco do Bem</option>
          </select>
        </div>

        {/* CURVA ABC */}
        <div className="space-y-1">
          <label className="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" /> Curva ABC
          </label>
          <select
            value={String(filters['curvaABC'] || 'todos')}
            onChange={(e) => handleSelectChange('curvaABC', 'Curva ABC', e.target.value)}
            className="w-full px-2 py-1.5 rounded-lg text-xs font-semibold outline-none border bg-slate-50 dark:bg-[#0b1222] border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
          >
            <option value="todos" className="bg-white dark:bg-[#0b1222] text-slate-900 dark:text-white">Todas as Curvas (ABC)</option>
            <option value="A" className="bg-white dark:bg-[#0b1222] text-slate-900 dark:text-white">Curva A (Alto Giro - 80% vol)</option>
            <option value="B" className="bg-white dark:bg-[#0b1222] text-slate-900 dark:text-white">Curva B (Médio Giro - 15% vol)</option>
            <option value="C" className="bg-white dark:bg-[#0b1222] text-slate-900 dark:text-white">Curva C (Baixo Giro - 5% vol)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
