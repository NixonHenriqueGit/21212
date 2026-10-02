import React from 'react';
import { 
  Flame, 
  Sparkles, 
  ArrowUp, 
  ArrowDown, 
  GripVertical, 
  Edit3, 
  Plus, 
  Calendar,
  Layers,
  Zap,
  Award,
  DollarSign,
  Box,
  Truck,
  Clock,
  AlertTriangle,
  Droplets,
  ShieldAlert,
  PackageX,
  Trash2
} from 'lucide-react';
import { CustomTreeNode } from '../../types/treeKpiTypes';

export interface KpiNodeCardProps {
  node: CustomTreeNode;
  level: number;
  index: number;
  parentId?: string;
  isSelected?: boolean;
  isDragging?: boolean;
  isDropTarget?: boolean;
  currencySymbol?: string;
  unitName?: string;
  sharePercent?: string;
  progressPercent?: number;
  subCount?: number;
  unitAvg?: number;
  activeMode?: 'automatic' | 'manual';
  layoutMode?: 'columns' | 'free';
  position?: { x: number; y: number };
  onSelect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onPointerDownDrag?: (e: React.PointerEvent) => void;
  dragProps?: {
    draggable?: boolean;
    onDragStart?: (e: React.DragEvent) => void;
    onDragOver?: (e: React.DragEvent) => void;
    onDragLeave?: () => void;
    onDrop?: (e: React.DragEvent) => void;
    onDragEnd?: () => void;
  };
  cardRef?: (el: HTMLDivElement | null) => void;
}

export const renderNodeIcon = (iconName?: string) => {
  switch (iconName) {
    case 'calendar': return <Calendar className="w-3 h-3 shrink-0" />;
    case 'zap': return <Zap className="w-3 h-3 shrink-0 text-amber-500" />;
    case 'award': return <Award className="w-3 h-3 shrink-0 text-amber-600" />;
    case 'dollar': return <DollarSign className="w-3 h-3 shrink-0 text-emerald-600" />;
    case 'box': return <Box className="w-3 h-3 shrink-0 text-sky-600" />;
    case 'truck': return <Truck className="w-3 h-3 shrink-0 text-blue-600" />;
    case 'clock': return <Clock className="w-3 h-3 shrink-0 text-purple-600" />;
    case 'alert-triangle': return <AlertTriangle className="w-3 h-3 shrink-0 text-amber-500" />;
    case 'flame': return <Flame className="w-3 h-3 shrink-0 text-rose-600" />;
    case 'droplet': return <Droplets className="w-3 h-3 shrink-0 text-sky-500" />;
    case 'shield-alert': return <ShieldAlert className="w-3 h-3 shrink-0 text-rose-500" />;
    case 'package-x': return <PackageX className="w-3 h-3 shrink-0 text-rose-500" />;
    default: return <Layers className="w-3 h-3 shrink-0 text-blue-600" />;
  }
};

const getLevelColors = (level: number, isCritical?: boolean) => {
  if (isCritical) {
    return {
      border: 'border-rose-300 hover:border-rose-500',
      selectedRing: 'border-2 border-rose-500 ring-2 ring-rose-400/50 shadow-md',
      tagBg: 'from-rose-500/15 via-rose-500/10 to-rose-500/15 border-rose-300',
      tagText: 'text-rose-950',
      iconColor: 'text-rose-600',
      barBg: 'bg-rose-600'
    };
  }

  switch (level) {
    case 1:
      return {
        border: 'border-blue-200 hover:border-blue-400',
        selectedRing: 'border-2 border-blue-700 ring-2 ring-blue-500/50 shadow-md',
        tagBg: 'from-blue-500/15 via-indigo-500/10 to-blue-500/15 border-blue-300',
        tagText: 'text-blue-950',
        iconColor: 'text-blue-700',
        barBg: 'bg-blue-700'
      };
    case 2:
      return {
        border: 'border-blue-200 hover:border-blue-400',
        selectedRing: 'border-2 border-blue-600 ring-2 ring-blue-500/50 shadow-md',
        tagBg: 'from-amber-500/15 via-orange-500/10 to-amber-500/15 border-amber-300',
        tagText: 'text-slate-800',
        iconColor: 'text-blue-600',
        barBg: 'bg-blue-600'
      };
    case 3:
      return {
        border: 'border-amber-200 hover:border-amber-400',
        selectedRing: 'border-2 border-amber-500 ring-2 ring-amber-400/50 shadow-md',
        tagBg: 'from-amber-500/15 via-orange-500/10 to-amber-500/15 border-amber-300',
        tagText: 'text-amber-950',
        iconColor: 'text-amber-600',
        barBg: 'bg-amber-500'
      };
    case 4:
      return {
        border: 'border-sky-200 hover:border-sky-400',
        selectedRing: 'border-2 border-sky-500 ring-2 ring-sky-400/50 shadow-md',
        tagBg: 'from-sky-500/15 via-blue-500/10 to-sky-500/15 border-sky-300',
        tagText: 'text-sky-950',
        iconColor: 'text-sky-600',
        barBg: 'bg-sky-500'
      };
    case 5:
      return {
        border: 'border-emerald-200 hover:border-emerald-400',
        selectedRing: 'border-2 border-emerald-500 ring-2 ring-emerald-400/50 shadow-md',
        tagBg: 'from-emerald-500/15 via-teal-500/10 to-emerald-500/15 border-emerald-300',
        tagText: 'text-emerald-950',
        iconColor: 'text-emerald-600',
        barBg: 'bg-emerald-500'
      };
    case 6:
      return {
        border: 'border-purple-200 hover:border-purple-400',
        selectedRing: 'border-2 border-purple-500 ring-2 ring-purple-400/50 shadow-md',
        tagBg: 'from-purple-500/15 via-indigo-500/10 to-purple-500/15 border-purple-300',
        tagText: 'text-purple-950',
        iconColor: 'text-purple-600',
        barBg: 'bg-purple-500'
      };
    case 7:
      return {
        border: 'border-rose-200 hover:border-rose-400',
        selectedRing: 'border-2 border-rose-500 ring-2 ring-rose-400/50 shadow-md',
        tagBg: 'from-rose-500/15 via-pink-500/10 to-rose-500/15 border-rose-300',
        tagText: 'text-rose-950',
        iconColor: 'text-rose-600',
        barBg: 'bg-rose-500'
      };
    default:
      return {
        border: 'border-slate-200 hover:border-slate-400',
        selectedRing: 'border-2 border-blue-500 ring-2 ring-blue-400/50 shadow-md',
        tagBg: 'from-slate-500/15 via-slate-500/10 to-slate-500/15 border-slate-300',
        tagText: 'text-slate-800',
        iconColor: 'text-slate-600',
        barBg: 'bg-slate-500'
      };
  }
};

export const KpiNodeCard: React.FC<KpiNodeCardProps> = ({
  node,
  level,
  index,
  parentId,
  isSelected = false,
  isDragging = false,
  isDropTarget = false,
  currencySymbol = 'R$',
  unitName = 'unidades',
  sharePercent,
  progressPercent = 0,
  subCount = 0,
  unitAvg = 0,
  activeMode = 'automatic',
  layoutMode = 'columns',
  position,
  onSelect,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp = false,
  canMoveDown = false,
  onPointerDownDrag,
  dragProps,
  cardRef,
}) => {
  const colors = getLevelColors(level, node.isCritical);

  const style: React.CSSProperties = layoutMode === 'free' && position ? {
    position: 'absolute',
    left: `${position.x}px`,
    top: `${position.y}px`,
    width: '205px',
    zIndex: isDragging ? 50 : isSelected ? 30 : 10,
    touchAction: 'none',
  } : {};

  return (
    <div
      ref={cardRef}
      style={style}
      {...(dragProps || {})}
      onPointerDown={layoutMode === 'free' ? onPointerDownDrag : undefined}
      onClick={onSelect}
      className={`bg-white/95 backdrop-blur-md text-slate-900 rounded-lg p-2 shadow-xs transition-all cursor-pointer relative overflow-hidden space-y-1 group select-none ${
        isDragging 
          ? 'opacity-40 scale-[0.98] border-2 border-dashed border-blue-500 bg-blue-50/50' 
          : isDropTarget
            ? 'ring-2 ring-blue-500/80 ring-offset-1 border-2 border-blue-600 scale-[1.01]'
            : isSelected
              ? colors.selectedRing
              : `${colors.border} hover:shadow-xs`
      } ${layoutMode === 'free' ? 'cursor-grab active:cursor-grabbing hover:shadow-md' : ''}`}
    >
      {/* Background Progress Bar */}
      {progressPercent > 0 && (
        <div 
          style={{ width: `${progressPercent}%` }}
          className={`absolute inset-y-0 left-0 opacity-10 pointer-events-none transition-all ${colors.barBg}`}
        />
      )}

      {/* Header Row - Full Label Display */}
      <div className={`relative z-10 flex items-center justify-between gap-1 ${level >= 3 ? 'border-b border-slate-100 pb-1' : ''}`}>
        <div className="flex-1 min-w-0 flex items-center gap-1 bg-slate-50/90 px-1.5 py-1 rounded border border-slate-200">
          <span className="shrink-0">{renderNodeIcon(node.iconName)}</span>
          <span className="text-[8.5px] font-black uppercase tracking-wider text-slate-900 break-words whitespace-normal leading-tight">
            {node.label} {node.sublabel ? `(${node.sublabel})` : ''}
          </span>
        </div>
        
        <div className="flex items-center gap-0.5 shrink-0">
          {node.isCritical && (
            <span className="px-1 py-0.2 rounded text-[6.5px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-0.5 shrink-0">
              <Flame className="w-2 h-2 text-rose-600" />
              Crítico
            </span>
          )}
          
          {level >= 3 && sharePercent && (
            <span className="flex items-center gap-0.5 text-[6.5px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded-full border border-emerald-200 shadow-2xs shrink-0">
              <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
              {sharePercent}
            </span>
          )}

          {/* Controls */}
          <div className="flex items-center gap-0.5 ml-0.5">
            {layoutMode === 'free' ? (
              <div 
                className="p-0.5 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded cursor-grab active:cursor-grabbing transition-colors"
                title="Arraste para reposicionar livremente"
              >
                <GripVertical className="w-2.5 h-2.5" />
              </div>
            ) : activeMode === 'manual' ? (
              <div className="flex items-center gap-0.5 bg-slate-100/90 rounded p-0.5 border border-slate-200">
                <button
                  type="button"
                  disabled={!canMoveUp}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onMoveUp) onMoveUp();
                  }}
                  className={`p-0.5 rounded transition-colors ${
                    !canMoveUp ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:text-blue-700 hover:bg-blue-100 cursor-pointer'
                  }`}
                  title="Mover para cima (↑)"
                >
                  <ArrowUp className="w-2.5 h-2.5" />
                </button>
                <button
                  type="button"
                  disabled={!canMoveDown}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onMoveDown) onMoveDown();
                  }}
                  className={`p-0.5 rounded transition-colors ${
                    !canMoveDown ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:text-blue-700 hover:bg-blue-100 cursor-pointer'
                  }`}
                  title="Mover para baixo (↓)"
                >
                  <ArrowDown className="w-2.5 h-2.5" />
                </button>
                <div 
                  className="p-0.5 text-slate-400 hover:text-blue-700 hover:bg-blue-100 rounded cursor-grab active:cursor-grabbing transition-colors"
                  title="Arrastar e soltar card"
                >
                  <GripVertical className="w-2.5 h-2.5" />
                </div>
              </div>
            ) : null}

            {onEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="p-0.5 rounded bg-amber-100 text-amber-900 hover:bg-amber-200 transition-colors cursor-pointer"
                title="Editar Card"
              >
                <Edit3 className="w-2.5 h-2.5" />
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`Deseja realmente excluir o card "${node.label}"?`)) {
                    onDelete();
                  }
                }}
                className="p-0.5 rounded bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-800 transition-colors cursor-pointer"
                title="Excluir Card"
              >
                <Trash2 className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2 Metric Boxes: META and REAL (For Level >= 3) */}
      {level >= 3 && (
        <div className="relative z-10 grid grid-cols-2 gap-1 pt-1">
          {/* META Box */}
          <div 
            onClick={(e) => {
              if (onEdit) {
                e.stopPropagation();
                onEdit();
              }
            }}
            className="p-1 px-1.5 rounded bg-blue-50/80 border border-blue-200 flex flex-col justify-center transition-all hover:bg-blue-100 hover:border-blue-300 cursor-pointer group/meta"
            title="Clique para editar a META"
          >
            <div className="flex items-center justify-between">
              <span className="text-[7.5px] font-black uppercase text-blue-700 tracking-wider">
                META
              </span>
              <Edit3 className="w-2 h-2 text-blue-400 opacity-0 group-hover/meta:opacity-100 transition-opacity" />
            </div>
            <span className="text-[10.5px] font-black text-blue-950 font-mono tracking-tight truncate leading-tight mt-0.5">
              {node.meta !== undefined && String(node.meta).trim() !== '' 
                ? String(node.meta) 
                : (node.percentage !== undefined && node.percentage > 0 ? `${node.percentage}%` : '-')}
            </span>
          </div>

          {/* REAL Box */}
          <div 
            onClick={(e) => {
              if (onEdit) {
                e.stopPropagation();
                onEdit();
              }
            }}
            className="p-1 px-1.5 rounded bg-emerald-50/80 border border-emerald-200 flex flex-col justify-center transition-all hover:bg-emerald-100 hover:border-emerald-300 cursor-pointer group/real"
            title="Clique para editar o REAL"
          >
            <div className="flex items-center justify-between">
              <span className="text-[7.5px] font-black uppercase text-emerald-700 tracking-wider">
                REAL
              </span>
              <Edit3 className="w-2 h-2 text-emerald-400 opacity-0 group-hover/real:opacity-100 transition-opacity" />
            </div>
            <span className="text-[10.5px] font-black text-emerald-950 font-mono tracking-tight truncate leading-tight mt-0.5">
              {node.real !== undefined && String(node.real).trim() !== '' 
                ? String(node.real) 
                : (node.value !== undefined && node.value !== 0 ? String(node.value) : '-')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
