import React from 'react';
import { ChevronLeft, ChevronRight, RefreshCw, Database, Layers } from 'lucide-react';

export interface PaginationControlsProps {
  currentPage: number;
  pageSize: number;
  hasMore: boolean;
  hasPrev?: boolean;
  totalCount?: number;
  totalFiltered?: number;
  loading?: boolean;
  onPrevPage: () => void;
  onNextPage: () => void;
  onPageSizeChange?: (newSize: number) => void;
  onRefresh?: () => void;
  source?: 'firestore' | 'json' | 'cache';
  pageSizeOptions?: number[];
  className?: string;
  theme?: 'light' | 'dark';
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  pageSize,
  hasMore,
  hasPrev,
  totalCount,
  totalFiltered,
  loading = false,
  onPrevPage,
  onNextPage,
  onPageSizeChange,
  onRefresh,
  source,
  pageSizeOptions = [10, 25, 50, 100],
  className = '',
  theme = 'dark'
}) => {
  const canGoPrev = hasPrev !== undefined ? hasPrev : currentPage > 1;
  const canGoNext = hasMore && !loading;

  return (
    <div
      id="pagination-controls-bar"
      className={`flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border ${
        theme === 'dark'
          ? 'bg-[#0f141c] border-[#222d3a] text-[#e8eef5]'
          : 'bg-slate-50 border-slate-200 text-slate-800'
      } text-xs font-sans ${className}`}
    >
      {/* Informações da Página e Contagem */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-[#a0aec0]">Página</span>
          <span className="px-2 py-0.5 rounded font-black bg-blue-500/15 text-blue-400 border border-blue-500/30">
            {currentPage}
          </span>
        </div>

        {totalCount !== undefined && totalCount > 0 && (
          <span className="text-[#6a7d92] hidden sm:inline">
            Total: <strong className="text-snow">{totalCount}</strong> itens
          </span>
        )}

        {totalFiltered !== undefined && totalFiltered !== totalCount && (
          <span className="text-[#6a7d92] hidden sm:inline">
            (Exibindo: <strong className="text-amber-400">{totalFiltered}</strong>)
          </span>
        )}

        {source && (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
              source === 'firestore'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : source === 'cache'
                ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
            }`}
          >
            <Database className="w-3 h-3" />
            {source === 'firestore' ? 'Firestore Cursor' : source === 'cache' ? 'Cache L1/L2' : 'JSON Local'}
          </span>
        )}
      </div>

      {/* Controles de Navegação e Seletor de Tamanho */}
      <div className="flex items-center gap-2 flex-wrap">
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 text-xs text-[#a0aec0]">
            <span className="hidden md:inline">Por pág:</span>
            <select
              id="pagination-pagesize-select"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              disabled={loading}
              className="bg-[#161c24] border border-[#263342] text-snow rounded-lg px-2 py-1 text-xs outline-none focus:border-blue-500 cursor-pointer disabled:opacity-50"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} itens
                </option>
              ))}
            </select>
          </div>
        )}

        {onRefresh && (
          <button
            id="pagination-refresh-btn"
            type="button"
            onClick={onRefresh}
            disabled={loading}
            title="Atualizar dados da página"
            className="p-1.5 rounded-lg border border-[#222d3a] bg-[#161c24] hover:bg-[#1f2733] text-[#a0aec0] hover:text-white disabled:opacity-40 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        )}

        {/* Botão Anterior */}
        <button
          id="pagination-prev-btn"
          type="button"
          onClick={onPrevPage}
          disabled={!canGoPrev || loading}
          className="flex items-center gap-1 px-3 py-1 rounded-lg border border-[#222d3a] bg-[#161c24] hover:bg-[#1f2733] text-[#e8eef5] font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Anterior</span>
        </button>

        {/* Botão Próximo */}
        <button
          id="pagination-next-btn"
          type="button"
          onClick={onNextPage}
          disabled={!canGoNext}
          className="flex items-center gap-1 px-3 py-1 rounded-lg border border-blue-500/40 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 font-semibold disabled:opacity-40 disabled:border-[#222d3a] disabled:bg-[#161c24] disabled:text-[#6a7d92] disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          <span className="hidden sm:inline">Próximo</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
