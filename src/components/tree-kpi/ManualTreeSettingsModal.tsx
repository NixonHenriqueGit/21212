import React, { useState } from 'react';
import { 
  X, 
  Save, 
  Plus, 
  Copy, 
  Download, 
  Upload, 
  Trash2, 
  Settings, 
  Layers, 
  Sparkles,
  Check
} from 'lucide-react';
import { CustomKpiTree } from '../../types/treeKpiTypes';

interface ManualTreeSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  trees: CustomKpiTree[];
  activeTreeId: string;
  onSelectTree: (id: string) => void;
  onSaveTree: (tree: CustomKpiTree) => void;
  onDeleteTree: (id: string) => void;
  onCloneOfficial: () => void;
  onCreateNewBlank: (name: string) => void;
}

export const ManualTreeSettingsModal: React.FC<ManualTreeSettingsModalProps> = ({
  isOpen,
  onClose,
  trees,
  activeTreeId,
  onSelectTree,
  onSaveTree,
  onDeleteTree,
  onCloneOfficial,
  onCreateNewBlank
}) => {
  if (!isOpen) return null;

  const currentTree = trees.find(t => t.id === activeTreeId) || trees[0];
  const [editedTree, setEditedTree] = useState<CustomKpiTree>(() => JSON.parse(JSON.stringify(currentTree)));
  const [newTreeName, setNewTreeName] = useState('');
  const [activeTab, setActiveTab] = useState<'settings' | 'manage'>('settings');

  const handleLevelTitleChange = (key: keyof CustomKpiTree['levels'], val: string) => {
    setEditedTree(prev => ({
      ...prev,
      levels: {
        ...prev.levels,
        [key]: val
      }
    }));
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(editedTree, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${editedTree.name.replace(/\s+/g, '_').toLowerCase()}_arvore_kpi.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && parsed.levels && parsed.nodes) {
          parsed.id = `tree-import-${Date.now()}`;
          onSaveTree(parsed);
          onSelectTree(parsed.id);
          setEditedTree(parsed);
          alert('Árvore de KPI importada com sucesso!');
        } else {
          alert('Estrutura de JSON inválida para Árvore de KPI.');
        }
      } catch (err) {
        alert('Erro ao carregar arquivo JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleSaveCurrent = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveTree(editedTree);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-blue-200 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-blue-950 flex items-center justify-center font-bold shadow-xs">
              <Settings className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider">
                Construtor & Configurações da Árvore KPI
              </h3>
              <p className="text-[11px] text-blue-200 font-medium">
                Personalize níveis, páginas, títulos e gerencie múltiplas árvores
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

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'border-blue-600 text-blue-900 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            ⚙️ Configurar Níveis & Títulos
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manage')}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === 'manage'
                ? 'border-blue-600 text-blue-900 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            📑 Minhas Árvores ({trees.length})
          </button>
        </div>

        {/* Content Body */}
        {activeTab === 'settings' ? (
          <form onSubmit={handleSaveCurrent} className="p-6 overflow-y-auto space-y-4 flex-1 text-slate-800 text-xs">
            
            {/* Tree Name & Header */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-700 tracking-wider mb-1">
                  Nome da Árvore / Indicador *
                </label>
                <input
                  type="text"
                  required
                  value={editedTree.title}
                  onChange={(e) => setEditedTree(prev => ({ ...prev, title: e.target.value, name: e.target.value }))}
                  placeholder="Ex: ÁRVORE DE DECOMPOSIÇÃO DE PERDAS"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-500 outline-none text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-700 tracking-wider mb-1">
                  Badge Superior (Ex: 5 NÍVEIS)
                </label>
                <input
                  type="text"
                  value={editedTree.badgeText}
                  onChange={(e) => setEditedTree(prev => ({ ...prev, badgeText: e.target.value }))}
                  placeholder="Ex: 5 NÍVEIS"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-500 outline-none text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase text-slate-700 tracking-wider mb-1">
                Subtítulo Explicativo
              </label>
              <input
                type="text"
                value={editedTree.subtitle}
                onChange={(e) => setEditedTree(prev => ({ ...prev, subtitle: e.target.value }))}
                placeholder="Ex: Navegue do macro ao micro com visão analítica ponta a ponta"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-500 outline-none text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-700 tracking-wider mb-1">
                  Destaque Crítico (Pill Superior)
                </label>
                <input
                  type="text"
                  value={editedTree.criticalHighlight || ''}
                  onChange={(e) => setEditedTree(prev => ({ ...prev, criticalHighlight: e.target.value }))}
                  placeholder="Ex: Mês Crítico: JUNHO/2026 (19.4%)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-500 outline-none text-xs text-rose-700 font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-700 tracking-wider mb-1">
                  Símbolo de Moeda / Unidade
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={editedTree.currencySymbol || 'R$'}
                    onChange={(e) => setEditedTree(prev => ({ ...prev, currencySymbol: e.target.value }))}
                    placeholder="Ex: R$"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 outline-none text-xs font-bold"
                  />
                  <input
                    type="text"
                    value={editedTree.unitName || 'unidades'}
                    onChange={(e) => setEditedTree(prev => ({ ...prev, unitName: e.target.value }))}
                    placeholder="Ex: unidades"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 outline-none text-xs font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Renaming Level Columns */}
            <div className="border border-blue-200 rounded-xl p-4 bg-blue-50/50 space-y-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-700" />
                <h4 className="text-xs font-black uppercase text-blue-950 tracking-wider">
                  Nomes dos 5 Níveis (Colunas da Árvore)
                </h4>
              </div>

              <div className="space-y-2.5">
                <div className="grid grid-cols-3 gap-2 items-center bg-white p-2 rounded-lg border border-blue-100">
                  <span className="font-bold text-slate-700 text-[11px]">Nível 01 (Raiz):</span>
                  <input
                    type="text"
                    value={editedTree.levels.level1Title}
                    onChange={(e) => handleLevelTitleChange('level1Title', e.target.value)}
                    className="px-2.5 py-1 rounded border border-slate-200 text-xs font-bold"
                  />
                  <input
                    type="text"
                    value={editedTree.levels.level1Badge}
                    onChange={(e) => handleLevelTitleChange('level1Badge', e.target.value)}
                    placeholder="Badge (Ex: RAIZ)"
                    className="px-2.5 py-1 rounded border border-slate-200 text-xs"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 items-center bg-white p-2 rounded-lg border border-blue-100">
                  <span className="font-bold text-slate-700 text-[11px]">Nível 02:</span>
                  <input
                    type="text"
                    value={editedTree.levels.level2Title}
                    onChange={(e) => handleLevelTitleChange('level2Title', e.target.value)}
                    className="px-2.5 py-1 rounded border border-slate-200 text-xs font-bold"
                  />
                  <input
                    type="text"
                    value={editedTree.levels.level2Badge}
                    onChange={(e) => handleLevelTitleChange('level2Badge', e.target.value)}
                    placeholder="Badge (Ex: CARDS)"
                    className="px-2.5 py-1 rounded border border-slate-200 text-xs"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 items-center bg-white p-2 rounded-lg border border-blue-100">
                  <span className="font-bold text-slate-700 text-[11px]">Nível 03:</span>
                  <input
                    type="text"
                    value={editedTree.levels.level3Title}
                    onChange={(e) => handleLevelTitleChange('level3Title', e.target.value)}
                    className="px-2.5 py-1 rounded border border-slate-200 text-xs font-bold"
                  />
                  <input
                    type="text"
                    value={editedTree.levels.level3Badge}
                    onChange={(e) => handleLevelTitleChange('level3Badge', e.target.value)}
                    placeholder="Badge (Ex: MOTIVOS)"
                    className="px-2.5 py-1 rounded border border-slate-200 text-xs"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 items-center bg-white p-2 rounded-lg border border-blue-100">
                  <span className="font-bold text-slate-700 text-[11px]">Nível 04:</span>
                  <input
                    type="text"
                    value={editedTree.levels.level4Title}
                    onChange={(e) => handleLevelTitleChange('level4Title', e.target.value)}
                    className="px-2.5 py-1 rounded border border-slate-200 text-xs font-bold"
                  />
                  <input
                    type="text"
                    value={editedTree.levels.level4Badge}
                    onChange={(e) => handleLevelTitleChange('level4Badge', e.target.value)}
                    placeholder="Badge (Ex: TIPOS)"
                    className="px-2.5 py-1 rounded border border-slate-200 text-xs"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 items-center bg-white p-2 rounded-lg border border-blue-100">
                  <span className="font-bold text-slate-700 text-[11px]">Nível 05:</span>
                  <input
                    type="text"
                    value={editedTree.levels.level5Title || ''}
                    onChange={(e) => handleLevelTitleChange('level5Title', e.target.value)}
                    className="px-2.5 py-1 rounded border border-slate-200 text-xs font-bold"
                  />
                  <input
                    type="text"
                    value={editedTree.levels.level5Badge || ''}
                    onChange={(e) => handleLevelTitleChange('level5Badge', e.target.value)}
                    placeholder="Badge (Ex: CARDS)"
                    className="px-2.5 py-1 rounded border border-slate-200 text-xs"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 items-center bg-white p-2 rounded-lg border border-blue-100">
                  <span className="font-bold text-slate-700 text-[11px]">Nível 06:</span>
                  <input
                    type="text"
                    value={editedTree.levels.level6Title || ''}
                    onChange={(e) => handleLevelTitleChange('level6Title', e.target.value)}
                    placeholder="NÍVEL 6 - OPERAÇÃO"
                    className="px-2.5 py-1 rounded border border-slate-200 text-xs font-bold"
                  />
                  <input
                    type="text"
                    value={editedTree.levels.level6Badge || ''}
                    onChange={(e) => handleLevelTitleChange('level6Badge', e.target.value)}
                    placeholder="Badge (Ex: OPERAÇÃO)"
                    className="px-2.5 py-1 rounded border border-slate-200 text-xs"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 items-center bg-white p-2 rounded-lg border border-blue-100">
                  <span className="font-bold text-slate-700 text-[11px]">Nível 07 (Itens / SKUs):</span>
                  <input
                    type="text"
                    value={editedTree.levels.level7Title || ''}
                    onChange={(e) => handleLevelTitleChange('level7Title', e.target.value)}
                    placeholder="NÍVEL 7 - ITENS / SKUS"
                    className="px-2.5 py-1 rounded border border-slate-200 text-xs font-bold"
                  />
                  <input
                    type="text"
                    value={editedTree.levels.level7Badge || ''}
                    onChange={(e) => handleLevelTitleChange('level7Badge', e.target.value)}
                    placeholder="Badge (Ex: ITENS)"
                    className="px-2.5 py-1 rounded border border-slate-200 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Import / Export JSON buttons */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  Exportar Árvore (JSON)
                </button>
                <label className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs">
                  <Upload className="w-3.5 h-3.5 text-emerald-600" />
                  Importar JSON
                  <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
                </label>
              </div>

              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                Salvar Configurações
              </button>
            </div>

          </form>
        ) : (
          /* Manage Trees List */
          <div className="p-6 overflow-y-auto space-y-4 flex-1 text-slate-800 text-xs">
            
            {/* Quick Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-gradient-to-r from-amber-50 to-blue-50 rounded-xl border border-amber-200">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span className="font-bold text-slate-800">Criar ou Duplicar Árvores:</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onCloneOfficial();
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Copy className="w-3 h-3" />
                  Duplicar da Base Oficial
                </button>
              </div>
            </div>

            {/* Create New Blank Tree */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newTreeName}
                onChange={(e) => setNewTreeName(e.target.value)}
                placeholder="Nome da Nova Árvore (Ex: Árvore de Produtividade HL/HH)"
                className="flex-1 px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-500 outline-none text-xs font-bold"
              />
              <button
                type="button"
                onClick={() => {
                  if (!newTreeName.trim()) return;
                  onCreateNewBlank(newTreeName.trim());
                  setNewTreeName('');
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                Criar Nova Página
              </button>
            </div>

            {/* List of Existing Trees */}
            <div className="space-y-2 pt-2">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                Árvores Salvas no Sistema:
              </span>
              {trees.map(t => {
                const isActive = t.id === activeTreeId;
                return (
                  <div
                    key={t.id}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                      isActive 
                        ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-300 shadow-xs' 
                        : 'bg-white border-slate-200 hover:border-slate-400 shadow-2xs'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <strong className="text-xs font-black text-slate-900">{t.name || t.title}</strong>
                        {isActive && (
                          <span className="px-2 py-0.5 bg-blue-600 text-white text-[9px] font-bold rounded-full">
                            Ativa no Momento
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium">
                        Total: {t.currencySymbol || 'R$'} {t.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} • {t.levels.level2Title}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isActive && (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectTree(t.id);
                            onClose();
                          }}
                          className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] cursor-pointer shadow-xs"
                        >
                          Ativar
                        </button>
                      )}
                      {trees.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Deseja excluir a árvore "${t.name}"?`)) {
                              onDeleteTree(t.id);
                            }
                          }}
                          className="p-1.5 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 cursor-pointer"
                          title="Excluir Árvore"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
