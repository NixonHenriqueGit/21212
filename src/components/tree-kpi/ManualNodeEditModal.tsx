import React, { useState } from 'react';
import { 
  X, 
  Save, 
  Trash2, 
  Plus, 
  DollarSign, 
  Box, 
  Flame, 
  Droplets, 
  PackageX, 
  ShieldAlert, 
  Truck, 
  Clock, 
  AlertTriangle, 
  Zap, 
  Award, 
  Calendar,
  Layers,
  HelpCircle,
  Tag,
  FolderInput
} from 'lucide-react';
import { CustomTreeNode, CustomTreeNodeRecord } from '../../types/treeKpiTypes';

interface ManualNodeEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (node: CustomTreeNode) => void;
  onDelete?: (nodeId: string) => void;
  levelNumber: number;
  levelTitle: string;
  node: CustomTreeNode | null;
  currencySymbol?: string;
  unitName?: string;
  availableParents?: Array<{ id: string; label: string }>;
  currentParentId?: string;
  onMoveParent?: (oldParentId: string, newParentId: string, nodeId: string) => void;
}

const AVAILABLE_ICONS = [
  { id: 'layers', label: 'Nível / Processo / Geral', icon: Layers },
  { id: 'calendar', label: 'Período / Data / Turno', icon: Calendar },
  { id: 'zap', label: 'Produtividade / Ação', icon: Zap },
  { id: 'award', label: 'Meta / Destaque / KPI', icon: Award },
  { id: 'dollar', label: 'Financeiro / Custo', icon: DollarSign },
  { id: 'box', label: 'Item / Produto / Volume', icon: Box },
  { id: 'truck', label: 'Logística / Rota', icon: Truck },
  { id: 'clock', label: 'Tempo / SLA / Horas', icon: Clock },
  { id: 'alert-triangle', label: 'Atenção / Desvio', icon: AlertTriangle },
  { id: 'flame', label: 'Crítico / Prioridade', icon: Flame },
  { id: 'droplet', label: 'Consumo / Fluido', icon: Droplets },
  { id: 'shield-alert', label: 'Segurança / Alerta', icon: ShieldAlert },
  { id: 'package-x', label: 'Divergência / Falha', icon: PackageX },
];

export const ManualNodeEditModal: React.FC<ManualNodeEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  levelNumber,
  levelTitle,
  node,
  currencySymbol = 'R$',
  unitName = 'unidades',
  availableParents,
  currentParentId,
  onMoveParent
}) => {
  if (!isOpen) return null;

  const [label, setLabel] = useState(node?.label || '');
  const [sublabel, setSublabel] = useState(node?.sublabel || '');
  const [skuCode, setSkuCode] = useState(node?.skuCode || '');
  const [meta, setMeta] = useState(node?.meta !== undefined ? String(node.meta) : (node?.percentage !== undefined && node.percentage > 0 ? `${node.percentage}%` : ''));
  const [real, setReal] = useState(node?.real !== undefined ? String(node.real) : (node?.value !== undefined && node.value !== 0 ? String(node.value) : ''));
  const [value, setValue] = useState(node?.value !== undefined ? String(node.value) : '0');
  const [volume, setVolume] = useState(node?.volume !== undefined ? String(node.volume) : '0');
  const [percentage, setPercentage] = useState(node?.percentage !== undefined ? String(node.percentage) : '');
  const [badge, setBadge] = useState(node?.badge || '');
  const [isCritical, setIsCritical] = useState(!!node?.isCritical);
  const [iconName, setIconName] = useState(node?.iconName || (levelNumber === 2 ? 'calendar' : levelNumber === 3 ? 'flame' : 'box'));
  const [metaInfo, setMetaInfo] = useState(node?.metaInfo || '');
  const [unitPrice, setUnitPrice] = useState(node?.unitPrice !== undefined ? String(node.unitPrice) : '');
  const [selectedParentId, setSelectedParentId] = useState(currentParentId || '');
  
  // Child records for Level 5
  const [records, setRecords] = useState<CustomTreeNodeRecord[]>(node?.records || []);

  const isTerminalItemLevel = levelNumber === 7 || levelNumber === 5;

  const handleAddRecord = () => {
    const newRecord: CustomTreeNodeRecord = {
      id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      dataISO: new Date().toLocaleDateString('pt-BR'),
      motivo: label || 'Lançamento Manual',
      responsavel: 'Operador Padrão',
      quantidade: 10,
      valorTotal: Number(unitPrice || 3.5) * 10
    };
    setRecords(prev => [...prev, newRecord]);
  };

  const handleUpdateRecord = (id: string, field: keyof CustomTreeNodeRecord, val: any) => {
    setRecords(prev => prev.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, [field]: val };
      if (field === 'quantidade' && unitPrice) {
        updated.valorTotal = Number(val) * Number(unitPrice);
      }
      return updated;
    }));
  };

  const handleRemoveRecord = (id: string) => {
    setRecords(prev => prev.filter(r => r.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;

    const numValue = parseFloat(value.replace(',', '.')) || 0;
    const numVolume = parseFloat(volume.replace(',', '.')) || 0;
    const numPercentage = percentage ? parseFloat(percentage.replace(',', '.')) : undefined;
    const numUnitPrice = unitPrice ? parseFloat(unitPrice.replace(',', '.')) : undefined;

    const updatedNode: CustomTreeNode = {
      id: node?.id || `node-${levelNumber}-${Date.now()}`,
      label: label.trim(),
      sublabel: sublabel.trim() || undefined,
      skuCode: skuCode.trim() || undefined,
      meta: meta.trim() || undefined,
      real: real.trim() || undefined,
      value: numValue,
      volume: numVolume,
      percentage: numPercentage,
      badge: badge.trim() || (isCritical ? 'CRÍTICO' : undefined),
      isCritical,
      iconName,
      metaInfo: metaInfo.trim() || undefined,
      unitPrice: numUnitPrice,
      records: isTerminalItemLevel ? records : undefined,
    };

    // If parent was changed to another branch
    if (node && currentParentId && selectedParentId && selectedParentId !== currentParentId && onMoveParent) {
      onMoveParent(currentParentId, selectedParentId, node.id);
    }

    onSave(updatedNode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-blue-200 w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-lg bg-amber-400 text-blue-950 font-mono text-xs font-black flex items-center justify-center shadow-xs">
              0{levelNumber}
            </span>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider">
                {node ? 'Editar Card do Nível' : 'Novo Card no Nível'}
              </h3>
              <p className="text-[11px] text-blue-200 font-medium">
                {levelTitle} (Nível {levelNumber} da Árvore)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-slate-800 text-xs">
          
          {/* Main Label */}
          <div>
            <label className="block text-[11px] font-black uppercase text-slate-700 tracking-wider mb-1">
              Nome / Título do Card *
            </label>
            <input
              type="text"
              required
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={levelNumber === 2 ? 'Ex: TURNO A / SETOR NORTE' : levelNumber === 3 ? 'Ex: Categoria Principal' : levelNumber === 4 ? 'Ex: Segmento / Subitem' : 'Ex: Indicador / Item'}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-xs font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Sublabel / Complement */}
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-700 tracking-wider mb-1">
                Complemento / Subtítulo
              </label>
              <input
                type="text"
                value={sublabel}
                onChange={(e) => setSublabel(e.target.value)}
                placeholder="Ex: /2026 ou Sleek"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-blue-500 outline-none text-xs"
              />
            </div>

            {/* SKU Code (Terminal Level 5 or 7) */}
            {isTerminalItemLevel ? (
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-700 tracking-wider mb-1">
                  Código do SKU
                </label>
                <input
                  type="text"
                  value={skuCode}
                  onChange={(e) => setSkuCode(e.target.value)}
                  placeholder="Ex: 34608"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-blue-500 outline-none text-xs font-mono font-bold text-emerald-800"
                />
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-700 tracking-wider mb-1">
                  Tag / Badge Especial
                </label>
                <input
                  type="text"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  placeholder="Ex: CRÍTICO, Normal, Alerta"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-blue-500 outline-none text-xs"
                />
              </div>
            )}
          </div>

          {/* META & REAL (Main KPI Target and Actual Values) */}
          <div className="p-4 bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-emerald-50/90 border border-blue-200 rounded-2xl space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-blue-600" />
                Indicadores Principais (META & REAL)
              </span>
              <span className="text-[10px] text-blue-700 font-bold bg-blue-100/70 px-2 py-0.5 rounded-full">Exibidos no card</span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-black uppercase text-blue-700 tracking-wider mb-1">
                  META (Objetivo)
                </label>
                <input
                  type="text"
                  value={meta}
                  onChange={(e) => setMeta(e.target.value)}
                  placeholder="Ex: 98,5% ou 150 cx/h"
                  className="w-full px-3 py-2.5 rounded-xl border border-blue-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none font-mono font-black text-blue-950 text-sm shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-emerald-700 tracking-wider mb-1">
                  REAL (Realizado)
                </label>
                <input
                  type="text"
                  value={real}
                  onChange={(e) => setReal(e.target.value)}
                  placeholder="Ex: 95,2% ou 142 cx/h"
                  className="w-full px-3 py-2.5 rounded-xl border border-emerald-300 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none font-mono font-black text-emerald-950 text-sm shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Relocate Parent Branch (if applicable) */}
          {availableParents && availableParents.length > 0 && node && (
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1.5">
              <label className="text-[11px] font-black uppercase text-blue-950 tracking-wider flex items-center gap-1.5">
                <FolderInput className="w-4 h-4 text-blue-600" />
                Mover Card para outro Pai / Ramo
              </label>
              <select
                value={selectedParentId}
                onChange={(e) => setSelectedParentId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-blue-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-xs font-bold text-slate-800 cursor-pointer"
              >
                {availableParents.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.label} {p.id === currentParentId ? '(Atual)' : ''}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-blue-800">
                Selecione o elemento pai acima caso deseje transferir este card para outra ramificação.
              </p>
            </div>
          )}

          {/* Terminal Levels (5 or 7): Individual Record Launches Builder */}
          {isTerminalItemLevel && (
            <div className="border border-emerald-200 rounded-xl p-3.5 bg-emerald-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase text-emerald-950 tracking-wider">
                    Lançamentos Individuais ({records.length})
                  </h4>
                  <span className="text-[10px] text-emerald-800 font-medium">
                    Aparecem no accordion expansível do item
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAddRecord}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                >
                  <Plus className="w-3 h-3" />
                  Novo Lançamento
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {records.map((rec, idx) => (
                  <div key={rec.id} className="p-2.5 bg-white border border-emerald-200 rounded-lg shadow-2xs space-y-1.5">
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={rec.dataISO || ''}
                        onChange={(e) => handleUpdateRecord(rec.id, 'dataISO', e.target.value)}
                        placeholder="Data (DD/MM/AAAA)"
                        className="px-2 py-1 border border-slate-200 rounded text-[10px]"
                      />
                      <input
                        type="text"
                        value={rec.motivo || ''}
                        onChange={(e) => handleUpdateRecord(rec.id, 'motivo', e.target.value)}
                        placeholder="Motivo / Detalhe"
                        className="px-2 py-1 border border-slate-200 rounded text-[10px] col-span-2"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2 items-center">
                      <input
                        type="text"
                        value={rec.responsavel || ''}
                        onChange={(e) => handleUpdateRecord(rec.id, 'responsavel', e.target.value)}
                        placeholder="Responsável / Operador"
                        className="px-2 py-1 border border-slate-200 rounded text-[10px]"
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] text-slate-500">Qtd:</span>
                        <input
                          type="number"
                          value={rec.quantidade || 0}
                          onChange={(e) => handleUpdateRecord(rec.id, 'quantidade', Number(e.target.value))}
                          className="w-full px-1.5 py-1 border border-slate-200 rounded text-[10px] font-mono"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        <input
                          type="number"
                          step="0.01"
                          value={rec.valorTotal || 0}
                          onChange={(e) => handleUpdateRecord(rec.id, 'valorTotal', Number(e.target.value))}
                          className="w-20 px-1.5 py-1 border border-slate-200 rounded text-[10px] font-mono font-bold text-emerald-700"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveRecord(rec.id)}
                          className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Action Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
            {node && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Tem certeza que deseja excluir o card "${label}"?`)) {
                    onDelete(node.id);
                    onClose();
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Excluir Card
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md hover:shadow-lg cursor-pointer transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                Salvar Card
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};
