import React from 'react';
import { ArrowUpDown, Plus, Edit3, MoreHorizontal } from 'lucide-react';

interface TreeFooterProps {
  onAddClick: () => void;
  onEditClick: () => void;
  onSettingsClick: () => void;
  layoutMode: 'columns' | 'free';
  onToggleLayoutMode: () => void;
  onResetPositions?: () => void;
}

export const TreeFooter: React.FC<TreeFooterProps> = ({
  onAddClick,
  onEditClick,
  onSettingsClick,
  layoutMode,
  onToggleLayoutMode,
  onResetPositions,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 mt-3 shrink-0">
      {/* LEGENDA CARD */}
      <div className="lg:col-span-8 xl:col-span-9 bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm flex flex-col justify-between">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-800 block mb-2.5">
          LEGENDA
        </span>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-slate-700">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1 bg-blue-700 rounded-full" />
            <span className="text-[11px] font-semibold text-slate-700">Nível 1 - Raiz</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1 bg-blue-500 rounded-full" />
            <span className="text-[11px] font-semibold text-slate-700">Nível 2 - Categorias</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1 bg-amber-500 rounded-full" />
            <span className="text-[11px] font-semibold text-slate-700">Nível 3 - Sub-ramos</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1 bg-sky-500 rounded-full" />
            <span className="text-[11px] font-semibold text-slate-700">Nível 4 - Segmentos</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1 bg-emerald-500 rounded-full" />
            <span className="text-[11px] font-semibold text-slate-700">Nível 5 - Detalhamento</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1 bg-purple-500 rounded-full" />
            <span className="text-[11px] font-semibold text-slate-700">Nível 6 - Operação</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1 bg-rose-500 rounded-full" />
            <span className="text-[11px] font-semibold text-slate-700">Nível 7 - Itens / SKUs</span>
          </div>
        </div>
      </div>

      {/* CONTROLES CARD */}
      <div className="lg:col-span-4 xl:col-span-3 bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm flex flex-col justify-between">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-800 block mb-2.5">
          CONTROLES
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={onToggleLayoutMode}
            className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-2xs ${
              layoutMode === 'free'
                ? 'bg-blue-600 border-blue-700 text-white shadow-xs ring-2 ring-blue-400/30'
                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
            title={layoutMode === 'free' ? 'Modo Livre Ativo: Arraste qualquer card para onde quiser' : 'Ativar Movimentação Livre de Cards'}
          >
            <ArrowUpDown className={`w-3.5 h-3.5 ${layoutMode === 'free' ? 'text-white' : 'text-slate-500'}`} />
            <span>{layoutMode === 'free' ? 'Mover Livre: ON' : 'Mover'}</span>
          </button>

          <button
            onClick={onAddClick}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
            title="Adicionar Novo Item"
          >
            <Plus className="w-3.5 h-3.5 text-slate-500" />
            <span>Adicionar</span>
          </button>

          <button
            onClick={onEditClick}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
            title="Editar Item Selecionado"
          >
            <Edit3 className="w-3.5 h-3.5 text-slate-500" />
            <span>Editar</span>
          </button>

          <button
            onClick={onSettingsClick}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
            title="Configurações e Mais Opções"
          >
            <MoreHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Mais opções</span>
          </button>
        </div>
      </div>
    </div>
  );
};
