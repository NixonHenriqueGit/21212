import React from 'react';
import { 
  Network, 
  Search, 
  X, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Minimize2, 
  Save, 
  Check, 
  Loader2, 
  Edit3, 
  ExternalLink 
} from 'lucide-react';
import { CustomKpiTree } from '../../types/treeKpiTypes';

interface TreeHeaderProps {
  treeData: CustomKpiTree;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  zoomLevel: number;
  setZoomLevel: (fn: (prev: number) => number) => void;
  onRecalculateConnectors: () => void;
  isFullscreen: boolean;
  setIsFullscreen: (v: boolean) => void;
  onClose?: () => void;
  isModal?: boolean;
  activeMode: 'automatic' | 'manual';
  setActiveMode: (mode: 'automatic' | 'manual') => void;
  layoutMode: 'columns' | 'free';
  setLayoutMode: (mode: 'columns' | 'free') => void;
  onResetPositions?: () => void;
  onOpenSettings: () => void;
  isSaving: boolean;
  saveSuccess: boolean;
  handleManualSave: () => void;
}

export const TreeHeader: React.FC<TreeHeaderProps> = ({
  treeData,
  searchTerm,
  setSearchTerm,
  zoomLevel,
  setZoomLevel,
  onRecalculateConnectors,
  isFullscreen,
  setIsFullscreen,
  onClose,
  isModal,
  activeMode,
  setActiveMode,
  layoutMode,
  setLayoutMode,
  onResetPositions,
  onOpenSettings,
  isSaving,
  saveSuccess,
  handleManualSave,
}) => {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-4 shrink-0">
      {/* Title & Subtitle */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
          <Network className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-black uppercase text-slate-900 tracking-tight leading-none">
              {treeData.title || 'ÁRVORE DE KPI'}
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-blue-50 text-blue-800 border border-blue-200 shadow-2xs">
              {treeData.badgeText || '7 NÍVEIS'}
            </span>
            {layoutMode === 'free' && (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-blue-600 text-white shadow-2xs animate-pulse">
                Modo Livre Ativo
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {layoutMode === 'free' 
              ? 'Arraste os cards para qualquer posição. As posições são salvas automaticamente.' 
              : (treeData.subtitle || 'Visão hierárquica de indicadores de desempenho')}
          </p>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-end">
        {/* Search */}
        <div className="relative w-32 sm:w-40">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrar..."
            className="w-full bg-white text-slate-800 placeholder:text-slate-400 text-xs rounded-xl pl-8 pr-3 py-1.5 border border-slate-200 outline-none focus:border-blue-500 transition-all font-medium shadow-2xs"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Alternar Modo Livre (Canvas) vs Grade */}
        <button
          onClick={() => {
            const nextMode = layoutMode === 'free' ? 'columns' : 'free';
            setLayoutMode(nextMode);
            setTimeout(onRecalculateConnectors, 100);
          }}
          className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
            layoutMode === 'free'
              ? 'bg-blue-600 hover:bg-blue-700 text-white border border-blue-700 ring-2 ring-blue-400/30'
              : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
          }`}
          title={layoutMode === 'free' ? 'Voltar para Modo Grade / Colunas' : 'Ativar Movimentação Livre de Cards'}
        >
          <span>{layoutMode === 'free' ? '✋ Posição Livre' : '🔲 Modo Grade'}</span>
        </button>

        {/* Botão Alinhar (se em modo livre) */}
        {layoutMode === 'free' && onResetPositions && (
          <button
            onClick={() => {
              onResetPositions();
              setTimeout(onRecalculateConnectors, 100);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1 border border-slate-200 transition-all cursor-pointer shadow-2xs"
            title="Auto Alinhar todos os cards na grade"
          >
            <span>Alinhar</span>
          </button>
        )}

        {/* Zoom */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold shadow-2xs">
          <button
            onClick={() => {
              setZoomLevel(prev => Math.max(50, prev - 5));
              setTimeout(onRecalculateConnectors, 50);
            }}
            title="Reduzir Zoom"
            className="p-1 rounded hover:bg-white text-slate-700 transition-colors cursor-pointer"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="px-1.5 font-mono text-slate-800 font-bold text-[10px]">{zoomLevel}%</span>
          <button
            onClick={() => {
              setZoomLevel(prev => Math.min(150, prev + 5));
              setTimeout(onRecalculateConnectors, 50);
            }}
            title="Aumentar Zoom"
            className="p-1 rounded hover:bg-white text-slate-700 transition-colors cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Salvar */}
        <button
          onClick={handleManualSave}
          disabled={isSaving}
          className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs active:scale-95 disabled:opacity-60 ${
            saveSuccess 
              ? 'bg-emerald-600 text-white border border-emerald-500'
              : 'bg-emerald-700 hover:bg-emerald-800 text-white border border-emerald-600'
          }`}
          title="Salvar árvore e posições dos cards"
        >
          {isSaving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : saveSuccess ? (
            <Check className="w-3.5 h-3.5 text-emerald-200" />
          ) : (
            <Save className="w-3.5 h-3.5 text-emerald-200" />
          )}
          <span>{isSaving ? 'Salvando...' : saveSuccess ? 'Salvo!' : 'Salvar'}</span>
        </button>

        {/* Construtor Manual */}
        <button
          onClick={onOpenSettings}
          className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 border border-slate-200 transition-all cursor-pointer shadow-2xs"
          title="Gerenciar páginas e árvores"
        >
          <Edit3 className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden sm:inline">Páginas</span>
        </button>

        {/* Fullscreen */}
        <button
          onClick={() => {
            setIsFullscreen(!isFullscreen);
            setTimeout(onRecalculateConnectors, 50);
          }}
          title={isFullscreen ? 'Restaurar' : 'Tela Cheia'}
          className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-all cursor-pointer shadow-2xs"
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5 text-blue-700" />}
        </button>

        {(onClose || isFullscreen) && (
          <button
            onClick={() => {
              if (isFullscreen && !isModal) setIsFullscreen(false);
              else if (onClose) onClose();
            }}
            title="Fechar"
            className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 transition-all cursor-pointer shadow-2xs"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
