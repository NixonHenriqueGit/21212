import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  Edit2, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  User, 
  MessageSquare, 
  Building2, 
  Filter,
  Layers,
  Search,
  Database,
  Download,
  AlertTriangle,
  AlertOctagon,
  Zap,
  CheckSquare,
  Square,
  FileText,
  Calendar,
  X,
  ShieldCheck,
  TrendingUp,
  HelpCircle,
  Paperclip,
  Check,
  FileSpreadsheet,
  RotateCcw,
  Maximize2,
  Minimize2,
  Printer,
  MapPin,
  Activity,
  ArrowRight
} from 'lucide-react';
import { ImportAcoesModal } from './ImportAcoesModal';
import { matchesProcessFilter } from './QuadroAcoesDpo';
import { 
  AcaoCorretiva, 
  CincoPorques,
  MODULES_LIST, 
  DatabaseMode,
  getActiveDatabaseMode,
  setActiveDatabaseMode,
  getAcoesAll,
  saveAcoes,
  clearAllAcoes,
  triggerAutoAcaoCorretiva,
  triggerAutoAcaoMelhoriaPreventiva,
  updateAcaoCorretiva,
  deleteAcaoCorretiva,
  deleteAcoesBatch,
  restoreSimulatedDatabase,
  exportAcoesCSV,
  cleanAllAutomaticActionsFromStorage,
  isSystemGeneratedOrSimulatedAction
} from '../utils/simulacaoAcoesUtils';
import { Usuario } from '../types';

interface ExecutiveActionBoardProps {
  user?: Usuario;
  theme?: 'dark' | 'light';
  onSelectAction?: (action: AcaoCorretiva) => void;
}

export const ExecutiveActionBoard: React.FC<ExecutiveActionBoardProps> = ({
  user,
  theme = 'light'
}) => {
  const [dbMode, setDbMode] = useState<DatabaseMode>(getActiveDatabaseMode());
  const [acoes, setAcoes] = useState<AcaoCorretiva[]>([]);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProcesso, setSelectedProcesso] = useState<string>('todos');
  const [selectedTipo, setSelectedTipo] = useState<string>('todos'); // Corretiva | Rotina | Melhoria
  const [selectedIndicador, setSelectedIndicador] = useState<string>('todos');
  const [selectedPrioridade, setSelectedPrioridade] = useState<string>('todos'); // Alta | Média | Baixa
  const [selectedStatus, setSelectedStatus] = useState<string>('todos');
  const [selectedAprovacao, setSelectedAprovacao] = useState<string>('todos');
  
  // Date Filters
  const [dataInicioFilter, setDataInicioFilter] = useState<string>('');
  const [dataFimFilter, setDataFimFilter] = useState<string>('');
  const [datePreset, setDatePreset] = useState<'todas' | 'hoje' | '7dias' | 'mes' | 'ano2026'>('todas');

  // Modal for Action Detail / 5 Whys / Closure Flow
  const [activeItem, setActiveItem] = useState<AcaoCorretiva | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreatingManual, setIsCreatingManual] = useState(false);

  // Standardized Maximized View Modal State (Parity with Dashboards)
  const [maximizedAction, setMaximizedAction] = useState<AcaoCorretiva | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [newStepText, setNewStepText] = useState('');

  // Manual Form State
  const [manualForm, setManualForm] = useState({
    dataCriacao: new Date().toISOString().split('T')[0],
    processo: 'Picking' as AcaoCorretiva['processo'],
    tipoAcao: 'Corretiva' as 'Corretiva' | 'Melhoria',
    prioridade: 'Alta' as 'Alta' | 'Média' | 'Baixa',
    indicador: 'Produtividade de Linha / Separação',
    meta: '100% Executado no Padrão DPO',
    resultadoObtido: 'Desvio identificado na rotina operacional',
    desvioEncontrado: '',
    setor: 'Armazém / Linha de Separação',
    colaboradorResponsavel: user?.nome || 'Operador Responsável',
    responsavelTratativa: 'Supervisor de Operações',
    prazo: new Date(Date.now() + 3*86400000).toISOString().split('T')[0],
    porque1: '',
    porque2: '',
    porque3: '',
    porque4: '',
    porque5: '',
    contramedida: '',
    impactoEsperado: 'Normalização imediata do processo e cumprimento da meta'
  });

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  useEffect(() => {
    // Purge any automatic or simulated actions on mount
    cleanAllAutomaticActionsFromStorage();
    loadData();

    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener('af_acoes_updated', handleUpdate);
    window.addEventListener('af_acoes_dpo_updated', handleUpdate);
    return () => {
      window.removeEventListener('af_acoes_updated', handleUpdate);
      window.removeEventListener('af_acoes_dpo_updated', handleUpdate);
    };
  }, [dbMode]);

  const loadData = () => {
    const all = getAcoesAll(dbMode);
    setAcoes(all.filter(item => !isSystemGeneratedOrSimulatedAction(item)));
  };

  // Helper to normalize steps to objects
  const getNormalizedSteps = (steps?: (string | { id: string; texto: string; concluida: boolean })[]) => {
    if (!steps || !Array.isArray(steps)) return [];
    return steps.map((s, idx) => {
      if (typeof s === 'string') {
        return { id: `step-${idx}-${s.slice(0, 10)}`, texto: s, concluida: false };
      }
      return s;
    });
  };

  // Step verification toggle in Maximized View
  const handleToggleStepInMaximized = (stepId: string) => {
    if (!maximizedAction) return;
    const currentSteps = getNormalizedSteps(maximizedAction.etapasVerificacao);
    const updatedSteps = currentSteps.map(s => s.id === stepId ? { ...s, concluida: !s.concluida } : s);
    const updated = { ...maximizedAction, etapasVerificacao: updatedSteps };
    setMaximizedAction(updated);
    updateAcaoCorretiva(updated, user?.nome || 'Gestor Executivo');
    loadData();
  };

  // Add Step in Maximized View
  const handleAddStepInMaximized = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!maximizedAction || !newStepText.trim()) return;
    const currentSteps = getNormalizedSteps(maximizedAction.etapasVerificacao);
    const newStep = { id: `step-${Date.now()}`, texto: newStepText.trim(), concluida: false };
    const updated = { ...maximizedAction, etapasVerificacao: [...currentSteps, newStep] };
    setMaximizedAction(updated);
    setNewStepText('');
    updateAcaoCorretiva(updated, user?.nome || 'Gestor Executivo');
    loadData();
  };

  // Save observation in Maximized View
  const handleSaveObservationInMaximized = (obs: string) => {
    if (!maximizedAction) return;
    const updated = { ...maximizedAction, comentarioOperador: obs };
    setMaximizedAction(updated);
    updateAcaoCorretiva(updated, user?.nome || 'Gestor Executivo');
    loadData();
  };

  // Quick Status change in Maximized View
  const handleQuickStatusInMaximized = (newStatus: AcaoCorretiva['status']) => {
    if (!maximizedAction) return;
    const updated = {
      ...maximizedAction,
      status: newStatus,
      situacaoMeta: newStatus === 'Concluído' ? 'Atingida' : maximizedAction.situacaoMeta
    };
    setMaximizedAction(updated);
    updateAcaoCorretiva(updated, user?.nome || 'Gestor Executivo');
    loadData();
  };

  const isDark = theme === 'dark';

  // Extract all unique indicators from current actions
  const uniqueIndicadores = useMemo(() => {
    const set = new Set<string>();
    acoes.forEach(a => {
      if (a.indicador && a.indicador.trim() !== '') {
        set.add(a.indicador.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [acoes]);

  // Handle Preset Changes
  const handleDatePreset = (preset: 'todas' | 'hoje' | '7dias' | 'mes' | 'ano2026') => {
    setDatePreset(preset);
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (preset === 'todas') {
      setDataInicioFilter('');
      setDataFimFilter('');
    } else if (preset === 'hoje') {
      setDataInicioFilter(todayStr);
      setDataFimFilter(todayStr);
    } else if (preset === '7dias') {
      const past7 = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0];
      setDataInicioFilter(past7);
      setDataFimFilter(todayStr);
    } else if (preset === 'mes') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      setDataInicioFilter(firstDay);
      setDataFimFilter(lastDay);
    } else if (preset === 'ano2026') {
      setDataInicioFilter('2026-01-01');
      setDataFimFilter('2026-12-31');
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedProcesso('todos');
    setSelectedTipo('todos');
    setSelectedIndicador('todos');
    setSelectedPrioridade('todos');
    setSelectedStatus('todos');
    setSelectedAprovacao('todos');
    setDataInicioFilter('');
    setDataFimFilter('');
    setDatePreset('todas');
  };

  // KPI Metrics
  const metrics = useMemo(() => {
    const total = acoes.length;
    const corretivas = acoes.filter(a => a.tipoAcao === 'Corretiva').length;
    const melhorias = acoes.filter(a => a.tipoAcao === 'Melhoria').length;
    const concluidas = acoes.filter(a => a.status === 'Concluído').length;
    const pendentes = acoes.filter(a => a.status === 'Pendente' || a.status === 'Em Andamento').length;
    const emRiscoOuAtrasadas = acoes.filter(a => a.status === 'Atrasado' || a.prioridade === 'Alta').length;
    return { total, corretivas, melhorias, concluidas, pendentes, emRiscoOuAtrasadas };
  }, [acoes]);

  // Filtered List
  const filteredAcoes = useMemo(() => {
    return acoes.filter(a => {
      // Processo
      if (selectedProcesso !== 'todos' && !matchesProcessFilter(a.processo, selectedProcesso)) return false;
      
      // Tipo (Corretiva / Rotina / Melhoria)
      if (selectedTipo !== 'todos') {
        const itemTipo = a.tipoAcao || 'Corretiva';
        if (selectedTipo === 'Melhoria' && itemTipo !== 'Melhoria') return false;
        if (selectedTipo === 'Corretiva' && itemTipo !== 'Corretiva') return false;
      }

      // Indicador
      if (selectedIndicador !== 'todos' && a.indicador !== selectedIndicador) return false;

      // Prioridade
      if (selectedPrioridade !== 'todos' && a.prioridade !== selectedPrioridade) return false;

      // Status
      if (selectedStatus !== 'todos' && a.status !== selectedStatus) return false;

      // Aprovação do Gestor
      if (selectedAprovacao !== 'todos' && (a.aprovacaoGestor || 'Pendente') !== selectedAprovacao) return false;

      // Date Range Filter (dataISO or data format DD/MM/YYYY)
      let itemDateISO = a.dataISO;
      if (!itemDateISO && a.data) {
        const parts = a.data.split('/');
        if (parts.length === 3) {
          itemDateISO = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      }

      if (dataInicioFilter && itemDateISO) {
        if (itemDateISO < dataInicioFilter) return false;
      }
      if (dataFimFilter && itemDateISO) {
        if (itemDateISO > dataFimFilter) return false;
      }

      // Search Term
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          a.id.toLowerCase().includes(q) ||
          a.processo.toLowerCase().includes(q) ||
          a.indicador.toLowerCase().includes(q) ||
          a.colaboradorResponsavel.toLowerCase().includes(q) ||
          a.responsavelTratativa.toLowerCase().includes(q) ||
          a.desvioEncontrado.toLowerCase().includes(q) ||
          (a.contramedida || '').toLowerCase().includes(q) ||
          (a.setor || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [
    acoes, 
    selectedProcesso, 
    selectedTipo, 
    selectedIndicador, 
    selectedPrioridade, 
    selectedStatus, 
    selectedAprovacao, 
    dataInicioFilter, 
    dataFimFilter, 
    searchTerm
  ]);

  // Handle Save Action (Approval, Aceite, Evidence)
  const handleSaveActiveItem = () => {
    if (!activeItem) return;
    updateAcaoCorretiva(activeItem, user?.nome || 'Gestor Executivo');
    setIsModalOpen(false);
    loadData();
  };

  const handleDeleteAction = (id: string) => {
    deleteAcaoCorretiva(id);
    loadData();
  };

  // Close Action with Validation (Req 33 & 35)
  const handleCloseAction = () => {
    if (!activeItem) return;
    if (!activeItem.evidencias || activeItem.evidencias.trim() === '') {
      alert('⚠️ Para encerrar uma ação, é obrigatório anexar/preencher a evidência do resultado!');
      return;
    }
    if (activeItem.aprovacaoGestor !== 'Aprovado') {
      alert('⚠️ Para encerrar uma ação, o gestor responsável precisa aprovar a contramedida!');
      return;
    }
    if (!activeItem.aceiteColaborador) {
      alert('⚠️ Para encerrar uma ação, o colaborador responsável deve assinar "Li e estou de acordo"!');
      return;
    }

    const updated = {
      ...activeItem,
      status: 'Concluído' as const,
      situacaoMeta: 'Atingida' as const
    };

    updateAcaoCorretiva(updated, user?.nome || 'Gestor Executivo');
    setActiveItem(updated);
    setIsModalOpen(false);
    loadData();
  };

  // Create Manual Action
  const handleCreateManual = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    const selectedDate = manualForm.dataCriacao ? new Date(manualForm.dataCriacao + 'T12:00:00') : now;
    const dStr = selectedDate.toLocaleDateString('pt-BR');
    const dISO = manualForm.dataCriacao || selectedDate.toISOString().split('T')[0];
    const hStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const newAction: AcaoCorretiva = {
      id: `acao-exec-${Date.now()}`,
      data: dStr,
      dataISO: dISO,
      hora: hStr,
      processo: manualForm.processo,
      setor: manualForm.setor,
      colaboradorResponsavel: manualForm.colaboradorResponsavel,
      indicador: manualForm.indicador,
      meta: manualForm.meta,
      resultadoObtido: manualForm.resultadoObtido,
      desvioEncontrado: manualForm.desvioEncontrado,
      causaRaiz: 'Método',
      causaRaizDetalhe: 'Ação manual criada via Painel Executivo',
      status: 'Pendente',
      responsavelTratativa: manualForm.responsavelTratativa,
      prazo: manualForm.prazo,
      comentarioOperador: manualForm.desvioEncontrado,
      simulado: dbMode === 'simulado',
      criadoEm: selectedDate.toISOString(),
      tipoAcao: manualForm.tipoAcao,
      prioridade: manualForm.prioridade,
      cincoPorques: {
        porque1: manualForm.porque1,
        porque2: manualForm.porque2,
        porque3: manualForm.porque3,
        porque4: manualForm.porque4,
        porque5: manualForm.porque5
      },
      contramedida: manualForm.contramedida,
      aprovacaoGestor: 'Pendente',
      aceiteColaborador: false,
      impactoEsperado: manualForm.impactoEsperado,
      situacaoMeta: manualForm.tipoAcao === 'Melhoria' ? 'Tendência de Queda' : 'Perdida',
      historicoAlteracoes: [{
        dataHora: `${dStr} ${hStr}`,
        usuario: user?.nome || 'Gestor Executivo',
        alteracao: `Ação (${manualForm.tipoAcao}) criada manualmente via Painel Executivo na data ${dStr}.`
      }]
    };

    const current = getAcoesAll();
    saveAcoes([newAction, ...current]);
    setIsCreatingManual(false);
    loadData();
  };

  return (
    <div className={`p-6 rounded-2xl border shadow-sm transition-all space-y-6 ${
      isDark ? 'bg-[#0f172a] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
    }`}>
      
      {/* EXECUTIVE HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-700/40">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <ShieldCheck className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-xl font-black tracking-tight uppercase flex items-center gap-2">
                Painel Executivo Único de Ações (Governança Integrada)
              </h2>
              <p className="text-xs text-slate-400">
                Centralização estratégica de Ações Corretivas e Ações de Melhoria Preventiva para os 14 processos logísticos.
              </p>
            </div>
          </div>
        </div>

        {/* TOP CONTROLS */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              const res = cleanAllAutomaticActionsFromStorage();
              loadData();
              alert(`✓ ${res.removedCount} ações automáticas/simuladas do sistema foram excluídas. Apenas as ações criadas pelos usuários foram mantidas!`);
            }}
            className="px-3.5 py-2 bg-slate-800/90 hover:bg-slate-700 text-amber-300 border border-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
            title="Excluir ações que foram geradas automaticamente pelo sistema e manter apenas as ações registradas pelos colaboradores"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" /> Excluir Ações do Sistema
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-md transition-all flex items-center gap-2 border border-indigo-400/30"
          >
            <FileSpreadsheet className="w-4 h-4 text-indigo-200" /> Importar Planilha de Ações
          </button>

          <button
            onClick={() => setIsCreatingManual(true)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all flex items-center gap-2 border border-slate-700"
          >
            <Plus className="w-4 h-4" /> Nova Ação
          </button>

          <button
            onClick={() => exportAcoesCSV(dbMode)}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Exportar
          </button>

          <button
            onClick={() => {
              if (window.confirm('⚠️ Tem certeza que deseja ZERAR TODAS AS AÇÕES da plataforma?')) {
                clearAllAcoes();
              }
            }}
            className="px-3 py-2 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-500/40 font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
            title="Zerar todas as ações"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-400" /> Zerar
          </button>
        </div>
      </div>

      {/* METRICS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-[#1e293b]/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
          <span className="text-[10px] font-black uppercase text-slate-400 block">Total de Ações</span>
          <span className="text-xl font-black font-mono text-indigo-400">{metrics.total}</span>
        </div>

        <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-[#1e293b]/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
          <span className="text-[10px] font-black uppercase text-blue-400 block">Em Andamento</span>
          <span className="text-xl font-black font-mono text-blue-400">{metrics.pendentes}</span>
        </div>

        <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-[#1e293b]/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
          <span className="text-[10px] font-black uppercase text-emerald-400 block">Concluídas</span>
          <span className="text-xl font-black font-mono text-emerald-400">{metrics.concluidas}</span>
        </div>

        <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-[#1e293b]/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
          <span className="text-[10px] font-black uppercase text-rose-500 block">Prioridade Alta / Risco</span>
          <span className="text-xl font-black font-mono text-rose-500">{metrics.emRiscoOuAtrasadas}</span>
        </div>
      </div>

      {/* FILTER BAR COM FILTRO DE DATA, INDICADOR E TIPO */}
      <div className={`p-4 rounded-2xl border space-y-3.5 ${isDark ? 'bg-[#1e293b]/50 border-slate-700/80' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-black text-xs uppercase tracking-wider text-slate-400">
          <span className="flex items-center gap-1.5 text-indigo-400">
            <Filter className="w-4 h-4" /> Filtros Executivos de Governança Unificada
          </span>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-slate-300">
              Exibindo <span className="text-indigo-400 font-bold">{filteredAcoes.length}</span> de <span className="font-bold">{acoes.length}</span> ações
            </span>
            {(searchTerm || selectedProcesso !== 'todos' || selectedTipo !== 'todos' || selectedIndicador !== 'todos' || selectedPrioridade !== 'todos' || selectedStatus !== 'todos' || selectedAprovacao !== 'todos' || dataInicioFilter || dataFimFilter) && (
              <button
                onClick={handleResetFilters}
                className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-md text-[10px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Limpar Filtros
              </button>
            )}
          </div>
        </div>

        {/* LINHA 1: BUSCA, PROCESSO, TIPO, INDICADOR, PRIORIDADE, STATUS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {/* BUSCA */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar termo, SKU, responsável..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className={`w-full pl-8 pr-3 py-2 rounded-xl text-xs outline-none border transition-all ${
                isDark ? 'bg-[#0b1222] border-slate-700 text-white focus:border-indigo-500' : 'bg-white border-slate-300 text-slate-800 focus:border-indigo-500'
              }`}
            />
          </div>

          {/* FILTRO DE PROCESSO */}
          <select
            value={selectedProcesso}
            onChange={e => setSelectedProcesso(e.target.value)}
            className={`px-3 py-2 rounded-xl text-xs font-bold outline-none border ${
              isDark ? 'bg-[#0b1222] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-800'
            }`}
          >
            <option value="todos">Todos os 14 Processos</option>
            {MODULES_LIST.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          {/* FILTRO DE TIPO (CORRETIVA / ROTINA / MELHORIA) */}
          <select
            value={selectedTipo}
            onChange={e => setSelectedTipo(e.target.value)}
            className={`px-3 py-2 rounded-xl text-xs font-bold outline-none border ${
              selectedTipo !== 'todos'
                ? selectedTipo === 'Melhoria'
                  ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                  : 'border-rose-500 text-rose-400 bg-rose-500/10'
                : isDark ? 'bg-[#0b1222] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-800'
            }`}
          >
            <option value="todos">Todos os Tipos de Ação</option>
            <option value="Corretiva">Ação Corretiva (Desvio / Gatilho)</option>
            <option value="Rotina">Ação de Rotina (Padrão Operacional)</option>
            <option value="Melhoria">Ação de Melhoria Preventiva (TOR)</option>
          </select>

          {/* FILTRO DE INDICADOR */}
          <select
            value={selectedIndicador}
            onChange={e => setSelectedIndicador(e.target.value)}
            className={`px-3 py-2 rounded-xl text-xs font-bold outline-none border truncate ${
              selectedIndicador !== 'todos' ? 'border-indigo-500 text-indigo-400' : isDark ? 'bg-[#0b1222] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-800'
            }`}
          >
            <option value="todos">Todos os Indicadores ({uniqueIndicadores.length})</option>
            {uniqueIndicadores.map(ind => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </select>

          {/* PRIORIDADE */}
          <select
            value={selectedPrioridade}
            onChange={e => setSelectedPrioridade(e.target.value)}
            className={`px-3 py-2 rounded-xl text-xs font-bold outline-none border ${
              selectedPrioridade !== 'todos' ? 'border-amber-500 text-amber-400' : isDark ? 'bg-[#0b1222] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-800'
            }`}
          >
            <option value="todos">Todas Prioridades</option>
            <option value="Alta">Alta Prioridade (Crítica)</option>
            <option value="Média">Média Prioridade</option>
            <option value="Baixa">Baixa Prioridade</option>
          </select>

          {/* STATUS */}
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className={`px-3 py-2 rounded-xl text-xs font-bold outline-none border ${
              isDark ? 'bg-[#0b1222] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-800'
            }`}
          >
            <option value="todos">Todos os Status</option>
            <option value="Pendente">Pendente</option>
            <option value="Em Andamento">Em Andamento</option>
            <option value="Concluído">Concluído</option>
            <option value="Atrasado">Atrasado</option>
          </select>
        </div>

        {/* LINHA 2: FILTRO DE DATA (DATA INÍCIO, DATA FIM, PRESETS) & GOVERNANÇA */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-700/40 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 uppercase flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Período:
            </span>

            {/* PRESET CHIPS */}
            <div className="flex items-center gap-1 flex-wrap">
              {[
                { id: 'todas', label: 'Todas as Datas' },
                { id: 'hoje', label: 'Hoje' },
                { id: '7dias', label: 'Últimos 7 dias' },
                { id: 'mes', label: 'Mês Atual' },
                { id: 'ano2026', label: 'Ano 2026' }
              ].map(preset => (
                <button
                  key={preset.id}
                  onClick={() => handleDatePreset(preset.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer border ${
                    datePreset === preset.id
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                      : isDark
                      ? 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white hover:bg-slate-700'
                      : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* DATE INPUTS */}
            <div className="flex items-center gap-1.5 ml-1">
              <input
                type="date"
                value={dataInicioFilter}
                onChange={e => {
                  setDataInicioFilter(e.target.value);
                  setDatePreset('todas');
                }}
                className={`px-2 py-1 rounded-lg text-xs border font-mono ${
                  isDark ? 'bg-[#0b1222] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-800'
                }`}
                title="Data Início"
              />
              <span className="text-slate-400 font-bold">até</span>
              <input
                type="date"
                value={dataFimFilter}
                onChange={e => {
                  setDataFimFilter(e.target.value);
                  setDatePreset('todas');
                }}
                className={`px-2 py-1 rounded-lg text-xs border font-mono ${
                  isDark ? 'bg-[#0b1222] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-800'
                }`}
                title="Data Fim"
              />
            </div>
          </div>

          {/* FILTRO DE APROVAÇÃO DO GESTOR */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Governança:</span>
            <select
              value={selectedAprovacao}
              onChange={e => setSelectedAprovacao(e.target.value)}
              className={`px-3 py-1 rounded-lg text-xs font-bold outline-none border ${
                isDark ? 'bg-[#0b1222] border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-800'
              }`}
            >
              <option value="todos">Todas Situações</option>
              <option value="Aprovado">Aprovado pelo Gestor</option>
              <option value="Pendente">Pendente de Aceite</option>
            </select>
          </div>
        </div>
      </div>

      {/* TABLE / LIST OF ACTIONS (UNIFICADA NO MODELO EXECUTIVO) */}
      <div className="overflow-x-auto rounded-xl border border-slate-700/50">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className={`border-b uppercase text-[10px] font-black tracking-wider ${
              isDark ? 'bg-[#1e293b] border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}>
              <th className="p-3">Processo / Indicador</th>
              <th className="p-3">Tipo / Prioridade</th>
              <th className="p-3">Desvio / Oportunidade & Contramedida</th>
              <th className="p-3">Responsável & Setor</th>
              <th className="p-3">Cronograma / Prazo</th>
              <th className="p-3">Governança (Gestor & Aceite)</th>
              <th className="p-3 text-center">Status</th>
              <th className="p-3 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-slate-800/80' : 'divide-slate-200'}`}>
            {filteredAcoes.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400 font-bold space-y-2">
                  <p className="text-sm">Nenhuma ação encontrada para os filtros selecionados.</p>
                  <p className="text-xs text-slate-400 font-normal">
                    Cadastre uma nova ação pelo botão "+ Nova Ação" ou registre ações diretamente nos dashboards operacionais.
                  </p>
                </td>
              </tr>
            ) : (
              filteredAcoes.map(item => {
                const isApproved = item.aprovacaoGestor === 'Aprovado';
                const hasAceite = item.aceiteColaborador;
                const isMelhoria = item.tipoAcao === 'Melhoria';

                // Check if action is overdue
                const nowISO = new Date().toISOString().split('T')[0];
                const isOverdue = item.status !== 'Concluído' && item.prazo && item.prazo < nowISO;

                return (
                  <tr 
                    key={item.id} 
                    className={`hover:bg-indigo-500/5 transition-all ${
                      item.prioridade === 'Alta' ? 'border-l-4 border-l-rose-500' : isMelhoria ? 'border-l-4 border-l-emerald-500' : 'border-l-4 border-l-transparent'
                    }`}
                  >
                    <td className="p-3">
                      <span className="font-black text-xs block text-indigo-400">{item.processo}</span>
                      <span className="text-[11px] font-bold text-slate-300 block">{item.indicador}</span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
                        <Calendar className="w-3 h-3 text-indigo-400" />
                        <span>Data: {item.data}{item.hora ? ` ${item.hora}` : ''}</span>
                      </span>
                    </td>

                    <td className="p-3 space-y-1">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase inline-block mr-1 ${
                        isMelhoria ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}>
                        {item.tipoAcao || 'Corretiva'}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase inline-block ${
                        item.prioridade === 'Alta' ? 'bg-rose-600 text-white' : item.prioridade === 'Média' ? 'bg-amber-600 text-white' : 'bg-slate-600 text-white'
                      }`}>
                        {item.prioridade}
                      </span>
                    </td>

                    <td className="p-3 max-w-xs">
                      <span className="font-bold block text-slate-200 truncate" title={item.desvioEncontrado}>
                        {item.desvioEncontrado}
                      </span>
                      {item.contramedida && (
                        <span className="text-[10px] text-indigo-300/90 block italic truncate mt-0.5">
                          💡 Contramedida: {item.contramedida}
                        </span>
                      )}
                    </td>

                    <td className="p-3 font-medium">
                      <span className="block font-bold text-slate-200">{item.colaboradorResponsavel}</span>
                      <span className="text-[10px] text-slate-400 block">Setor: {item.setor}</span>
                      <span className="text-[10px] text-slate-400 block">Gestor: {item.responsavelTratativa}</span>
                    </td>

                    <td className="p-3 font-mono text-[11px]">
                      <span className="block font-bold">{item.prazo}</span>
                      {item.status === 'Concluído' ? (
                        <span className="text-[9px] font-black text-emerald-400 uppercase">Concluído</span>
                      ) : isOverdue ? (
                        <span className="text-[9px] font-black text-rose-400 uppercase flex items-center gap-0.5">
                          <AlertTriangle className="w-2.5 h-2.5" /> Atrasado
                        </span>
                      ) : (
                        <span className="text-[9px] font-black text-amber-400 uppercase">No Prazo</span>
                      )}
                    </td>

                    <td className="p-3">
                      <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                        <span className={`px-2 py-0.5 rounded font-black uppercase ${
                          isApproved ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          Gestor: {item.aprovacaoGestor || 'Pendente'}
                        </span>

                        <span className={`px-2 py-0.5 rounded font-black uppercase ${
                          hasAceite ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}>
                          {hasAceite ? '✓ Aceite Assinado' : 'Pend. Aceite'}
                        </span>
                      </div>
                    </td>

                    <td className="p-3 text-center">
                      <select
                        value={item.status}
                        onChange={e => {
                          const newStatus = e.target.value as any;
                          const updated = {
                            ...item,
                            status: newStatus,
                            situacaoMeta: newStatus === 'Concluído' ? 'Atingida' : item.situacaoMeta
                          };
                          updateAcaoCorretiva(updated, user?.nome || 'Gestor Executivo');
                          loadData();
                        }}
                        className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase cursor-pointer outline-none border transition-all ${
                          item.status === 'Concluído' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' :
                          item.status === 'Atrasado' ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' :
                          'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        }`}
                      >
                        <option value="Pendente">Pendente</option>
                        <option value="Em Andamento">Em Andamento</option>
                        <option value="Concluído">Concluído</option>
                        <option value="Atrasado">Atrasado</option>
                      </select>
                    </td>

                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setMaximizedAction(item)}
                          className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-black uppercase cursor-pointer transition-all flex items-center gap-1"
                          title="Maximizar e visualizar ficha completa da ação"
                        >
                          <Maximize2 className="w-3.5 h-3.5 text-amber-400" /> Detalhes
                        </button>
                        <button
                          onClick={() => {
                            setActiveItem(item);
                            setIsModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 rounded-lg text-xs font-black uppercase cursor-pointer transition-all flex items-center gap-1"
                          title="Visualizar e Editar 5 Porquês e Tratativa Completa"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Tratativa & 5 Porquês
                        </button>
                        <button
                          onClick={() => handleDeleteAction(item.id)}
                          className="p-1.5 text-rose-400 hover:text-white hover:bg-rose-500/20 border border-rose-500/30 rounded-lg cursor-pointer transition-all"
                          title="Excluir Ação"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL 5 PORQUÊS & TRATATIVA COMPLETA (REQ 33 & 35) */}
      {isModalOpen && activeItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto ${
            isDark ? 'bg-[#0f172a] border border-slate-700 text-white' : 'bg-white text-slate-800'
          }`}>
            
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b pb-3 border-slate-700/50">
              <div>
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase ${
                  activeItem.tipoAcao === 'Corretiva' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                }`}>
                  Ação - {activeItem.processo}
                </span>
                <h3 className="font-black text-base uppercase mt-1">
                  Tratativa de Governança #{activeItem.id}
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-700/50 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* PROBLEM SUMMARY */}
            <div className={`p-4 rounded-xl border space-y-2 ${isDark ? 'bg-[#1e293b]/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono">
                <div>
                  <span className="text-[9px] text-slate-400 uppercase block">Processo</span>
                  <span className="font-black text-indigo-400">{activeItem.processo}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 uppercase block">Setor / Doca</span>
                  <span className="font-black">{activeItem.setor}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 uppercase block">Meta Diária</span>
                  <span className="font-black text-amber-400">{activeItem.meta}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 uppercase block">Resultado Obtido</span>
                  <span className="font-black text-rose-400">{activeItem.resultadoObtido}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-700/40 text-xs">
                <span className="text-[10px] text-slate-400 uppercase font-black block">Desvio / Alerta Identificado</span>
                <p className="font-bold text-sm text-amber-300">{activeItem.desvioEncontrado}</p>
              </div>
            </div>

            {/* FORMULÁRIO MANDATÓRIO DOS 5 PORQUÊS (REQ 33 & 35) */}
            <div className={`p-4 rounded-xl border space-y-3 ${isDark ? 'bg-[#1e293b]/40 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-400" />
                <h4 className="font-black text-xs uppercase tracking-wider text-indigo-400">
                  Formulário dos 5 Porquês (Análise de Causa Raiz)
                </h4>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">1º Por quê?</label>
                  <input
                    type="text"
                    value={activeItem.cincoPorques?.porque1 || ''}
                    onChange={e => setActiveItem({
                      ...activeItem,
                      cincoPorques: {
                        porque1: e.target.value,
                        porque2: activeItem.cincoPorques?.porque2 || '',
                        porque3: activeItem.cincoPorques?.porque3 || '',
                        porque4: activeItem.cincoPorques?.porque4 || '',
                        porque5: activeItem.cincoPorques?.porque5 || ''
                      }
                    })}
                    placeholder="Primeiro nível da ocorrência..."
                    className={`w-full p-2 rounded-lg border text-xs outline-none ${isDark ? 'bg-[#0b1222] border-slate-700 text-white' : 'bg-white border-slate-300'}`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">2º Por quê?</label>
                  <input
                    type="text"
                    value={activeItem.cincoPorques?.porque2 || ''}
                    onChange={e => setActiveItem({
                      ...activeItem,
                      cincoPorques: {
                        porque1: activeItem.cincoPorques?.porque1 || '',
                        porque2: e.target.value,
                        porque3: activeItem.cincoPorques?.porque3 || '',
                        porque4: activeItem.cincoPorques?.porque4 || '',
                        porque5: activeItem.cincoPorques?.porque5 || ''
                      }
                    })}
                    placeholder="Segundo nível..."
                    className={`w-full p-2 rounded-lg border text-xs outline-none ${isDark ? 'bg-[#0b1222] border-slate-700 text-white' : 'bg-white border-slate-300'}`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">3º Por quê?</label>
                  <input
                    type="text"
                    value={activeItem.cincoPorques?.porque3 || ''}
                    onChange={e => setActiveItem({
                      ...activeItem,
                      cincoPorques: {
                        porque1: activeItem.cincoPorques?.porque1 || '',
                        porque2: activeItem.cincoPorques?.porque2 || '',
                        porque3: e.target.value,
                        porque4: activeItem.cincoPorques?.porque4 || '',
                        porque5: activeItem.cincoPorques?.porque5 || ''
                      }
                    })}
                    placeholder="Terceiro nível..."
                    className={`w-full p-2 rounded-lg border text-xs outline-none ${isDark ? 'bg-[#0b1222] border-slate-700 text-white' : 'bg-white border-slate-300'}`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">4º Por quê?</label>
                  <input
                    type="text"
                    value={activeItem.cincoPorques?.porque4 || ''}
                    onChange={e => setActiveItem({
                      ...activeItem,
                      cincoPorques: {
                        porque1: activeItem.cincoPorques?.porque1 || '',
                        porque2: activeItem.cincoPorques?.porque2 || '',
                        porque3: activeItem.cincoPorques?.porque3 || '',
                        porque4: e.target.value,
                        porque5: activeItem.cincoPorques?.porque5 || ''
                      }
                    })}
                    placeholder="Quarto nível..."
                    className={`w-full p-2 rounded-lg border text-xs outline-none ${isDark ? 'bg-[#0b1222] border-slate-700 text-white' : 'bg-white border-slate-300'}`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">5º Por quê? (Causa Raiz)</label>
                  <input
                    type="text"
                    value={activeItem.cincoPorques?.porque5 || ''}
                    onChange={e => setActiveItem({
                      ...activeItem,
                      cincoPorques: {
                        porque1: activeItem.cincoPorques?.porque1 || '',
                        porque2: activeItem.cincoPorques?.porque2 || '',
                        porque3: activeItem.cincoPorques?.porque3 || '',
                        porque4: activeItem.cincoPorques?.porque4 || '',
                        porque5: e.target.value
                      }
                    })}
                    placeholder="Origem fundamental do problema..."
                    className={`w-full p-2 rounded-lg border text-xs font-bold text-rose-400 outline-none ${isDark ? 'bg-[#0b1222] border-slate-700' : 'bg-white border-slate-300'}`}
                  />
                </div>
              </div>
            </div>

            {/* CONTRAMEDIDA E EVIDÊNCIAS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Contramedida Requerida</label>
                <textarea
                  rows={2}
                  value={activeItem.contramedida || ''}
                  onChange={e => setActiveItem({ ...activeItem, contramedida: e.target.value })}
                  className={`w-full p-2 rounded-lg border text-xs outline-none font-semibold ${isDark ? 'bg-[#0b1222] border-slate-700 text-white' : 'bg-white border-slate-300'}`}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Evidência Anexada (Link / Descrição)</label>
                <textarea
                  rows={2}
                  value={activeItem.evidencias || ''}
                  onChange={e => setActiveItem({ ...activeItem, evidencias: e.target.value })}
                  placeholder="Ex: Foto de verificação anexada em 29/07..."
                  className={`w-full p-2 rounded-lg border text-xs outline-none ${isDark ? 'bg-[#0b1222] border-slate-700 text-white' : 'bg-white border-slate-300'}`}
                />
              </div>
            </div>

            {/* CONTROLES DE GOVERNANÇA: APROVAÇÃO DO GESTOR & TERMO DE ACEITE */}
            <div className={`p-4 rounded-xl border space-y-3 ${isDark ? 'bg-[#1e293b]/80 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Validação de Governança e Encerramento
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* APROVAÇÃO DO GESTOR */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-300 block">Aprovação do Gestor Responsável</label>
                  <select
                    value={activeItem.aprovacaoGestor || 'Pendente'}
                    onChange={e => setActiveItem({ ...activeItem, aprovacaoGestor: e.target.value as any })}
                    className={`w-full p-2 rounded-lg text-xs font-black outline-none border ${
                      activeItem.aprovacaoGestor === 'Aprovado' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    }`}
                  >
                    <option value="Pendente">Pendente de Análise</option>
                    <option value="Aprovado">Aprovado pelo Gestor</option>
                    <option value="Rejeitado">Rejeitado / Reabrir</option>
                  </select>
                </div>

                {/* TERMO DE ACEITE DO COLABORADOR */}
                <div className="space-y-1 flex flex-col justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveItem({ ...activeItem, aceiteColaborador: !activeItem.aceiteColaborador })}
                    className={`p-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer border ${
                      activeItem.aceiteColaborador
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {activeItem.aceiteColaborador ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    <span>"Li e estou de acordo" (Aceite do Colaborador)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* BOTÕES DE AÇÃO */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
              <button
                onClick={() => {
                  deleteAcaoCorretiva(activeItem.id);
                  setIsModalOpen(false);
                  loadData();
                }}
                className="px-3 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" /> Excluir Ação
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveActiveItem}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Salvar Rascunho
                </button>

                <button
                  onClick={handleCloseAction}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-lg transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> Concluir e Encerrar Ação
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MANUAL ACTION CREATION */}
      {isCreatingManual && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleCreateManual} className={`rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 ${
            isDark ? 'bg-[#0f172a] text-white border border-slate-700' : 'bg-white text-slate-800'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-700">
              <h3 className="font-black text-sm uppercase flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                Criar Ação Executiva de Governança
              </h3>
              <button type="button" onClick={() => setIsCreatingManual(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-semibold">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase mb-0.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Data de Criação (Manual)</span> <span className="text-rose-400">*</span>
                </label>
                <input
                  type="date"
                  value={manualForm.dataCriacao}
                  onChange={e => setManualForm({ ...manualForm, dataCriacao: e.target.value })}
                  className={`w-full p-2 rounded-lg border font-semibold ${isDark ? 'bg-[#0b1222] border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase mb-0.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Prazo Limite</span> <span className="text-rose-400">*</span>
                </label>
                <input
                  type="date"
                  value={manualForm.prazo}
                  onChange={e => setManualForm({ ...manualForm, prazo: e.target.value })}
                  className={`w-full p-2 rounded-lg border font-semibold ${isDark ? 'bg-[#0b1222] border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase mb-0.5">Processo Operacional</label>
                <select
                  value={manualForm.processo}
                  onChange={e => setManualForm({ ...manualForm, processo: e.target.value as any })}
                  className={`w-full p-2 rounded-lg border ${isDark ? 'bg-[#0b1222] border-slate-700' : 'bg-slate-50 border-slate-300'}`}
                >
                  {MODULES_LIST.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase mb-0.5">Prioridade</label>
                <select
                  value={manualForm.prioridade}
                  onChange={e => setManualForm({ ...manualForm, prioridade: e.target.value as any })}
                  className={`w-full p-2 rounded-lg border ${isDark ? 'bg-[#0b1222] border-slate-700' : 'bg-slate-50 border-slate-300'}`}
                >
                  <option value="Alta">Alta</option>
                  <option value="Média">Média</option>
                  <option value="Baixa">Baixa</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase mb-0.5">Setor / Doca</label>
                <input
                  type="text"
                  value={manualForm.setor}
                  onChange={e => setManualForm({ ...manualForm, setor: e.target.value })}
                  className={`w-full p-2 rounded-lg border ${isDark ? 'bg-[#0b1222] border-slate-700' : 'bg-slate-50 border-slate-300'}`}
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase mb-0.5">Responsável pela Execução</label>
                <input
                  type="text"
                  value={manualForm.colaboradorResponsavel}
                  onChange={e => setManualForm({ ...manualForm, colaboradorResponsavel: e.target.value })}
                  className={`w-full p-2 rounded-lg border ${isDark ? 'bg-[#0b1222] border-slate-700' : 'bg-slate-50 border-slate-300'}`}
                  required
                />
              </div>

              <div className="col-span-1 sm:col-span-2">
                <label className="block text-[10px] text-slate-400 uppercase mb-0.5">Desvio ou Oportunidade</label>
                <input
                  type="text"
                  value={manualForm.desvioEncontrado}
                  onChange={e => setManualForm({ ...manualForm, desvioEncontrado: e.target.value })}
                  className={`w-full p-2 rounded-lg border ${isDark ? 'bg-[#0b1222] border-slate-700' : 'bg-slate-50 border-slate-300'}`}
                  required
                />
              </div>

              <div className="col-span-1 sm:col-span-2">
                <label className="block text-[10px] text-slate-400 uppercase mb-0.5">Contramedida Requerida</label>
                <input
                  type="text"
                  value={manualForm.contramedida}
                  onChange={e => setManualForm({ ...manualForm, contramedida: e.target.value })}
                  className={`w-full p-2 rounded-lg border ${isDark ? 'bg-[#0b1222] border-slate-700' : 'bg-slate-50 border-slate-300'}`}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-700">
              <button
                type="button"
                onClick={() => setIsCreatingManual(false)}
                className="px-4 py-2 bg-slate-700 text-slate-200 rounded-xl text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-md"
              >
                Criar Ação
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL DE IMPORTAÇÃO DE AÇÕES RETROATIVAS */}
      <ImportAcoesModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        currentUser={user?.nome || 'Gestor Executivo'}
      />

      {/* ── MODAL DETALHES MAXIMIZADOS (PADRÃO DPO & GOVERNANÇA INTEGRADA) ── */}
      {maximizedAction && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div 
            className={`rounded-2xl border shadow-2xl flex flex-col transition-all duration-200 overflow-hidden ${
              isFullScreen ? 'fixed inset-2 z-50 w-auto h-auto max-w-none' : 'w-full max-w-4xl max-h-[92vh]'
            } ${
              isDark ? 'bg-[#0f172a] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* HEADER */}
            <div className="p-4 md:p-6 border-b border-slate-700/50 flex items-center justify-between gap-4 shrink-0 bg-slate-900/40">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/40">
                      {maximizedAction.processo}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                      maximizedAction.tipoAcao === 'Melhoria' 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    }`}>
                      {maximizedAction.tipoAcao || 'Corretiva'}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                      maximizedAction.prioridade === 'Alta' ? 'bg-rose-600 text-white' : maximizedAction.prioridade === 'Média' ? 'bg-amber-600 text-white' : 'bg-slate-600 text-white'
                    }`}>
                      {maximizedAction.prioridade}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                      maximizedAction.status === 'Concluído' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                      maximizedAction.status === 'Atrasado' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' :
                      'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}>
                      {maximizedAction.status}
                    </span>
                  </div>
                  <h2 className="text-lg md:text-xl font-black tracking-tight">
                    {maximizedAction.indicador}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors hidden sm:inline-flex"
                  title="Imprimir / Exportar Ficha"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsFullScreen(!isFullScreen)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title={isFullScreen ? 'Restaurar Tamanho' : 'Tela Cheia'}
                >
                  {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setMaximizedAction(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Fechar Detalhes"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* SCROLLABLE CONTENT */}
            <div className="p-4 md:p-6 overflow-y-auto space-y-6 flex-1">
              {/* COMPARATIVO LADO A LADO: DIAGNÓSTICO VS RESOLUÇÃO/CONTRAMEDIDA */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-4 rounded-2xl border ${
                  isDark ? 'bg-[#121824] border-rose-500/20' : 'bg-rose-50/50 border-rose-200'
                }`}>
                  <div className="flex items-center gap-2 text-rose-500 font-black text-xs uppercase tracking-wider mb-2">
                    <AlertOctagon className="w-4 h-4" />
                    <span>Diagnóstico / O Que Fazer (Desvio)</span>
                  </div>
                  <p className="text-sm font-medium leading-relaxed">
                    {maximizedAction.desvioEncontrado}
                  </p>
                </div>

                <div className={`p-4 rounded-2xl border ${
                  isDark ? 'bg-[#121824] border-emerald-500/20' : 'bg-emerald-50/50 border-emerald-200'
                }`}>
                  <div className="flex items-center gap-2 text-emerald-500 font-black text-xs uppercase tracking-wider mb-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Resolução & Contramedida</span>
                  </div>
                  <p className="text-sm font-medium leading-relaxed">
                    {maximizedAction.contramedida || 'Contramedida em definição pela supervisão operacional.'}
                  </p>
                </div>
              </div>

              {/* CRONOGRAMA DE EXECUÇÃO */}
              <div className={`p-4 rounded-2xl border ${
                isDark ? 'bg-[#121824] border-slate-700/80' : 'bg-slate-50 border-slate-200'
              }`}>
                <h4 className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4" /> Cronograma de Execução & Localização
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#0b0f17] border-slate-800' : 'bg-white border-slate-200'}`}>
                    <span className="text-[10px] font-sans font-bold text-slate-400 block uppercase">Data de Início</span>
                    <strong className="text-sm text-slate-200 font-bold">
                      {maximizedAction.dataISO ? maximizedAction.dataISO.split('-').reverse().join('/') : (maximizedAction.data || 'Registrado')}
                    </strong>
                  </div>

                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#0b0f17] border-slate-800' : 'bg-white border-slate-200'}`}>
                    <span className="text-[10px] font-sans font-bold text-slate-400 block uppercase">Prazo de Conclusão</span>
                    <strong className="text-sm text-amber-400 font-bold">
                      {maximizedAction.prazo ? (maximizedAction.prazo.includes('-') ? maximizedAction.prazo.split('-').reverse().join('/') : maximizedAction.prazo) : 'A Definir'}
                    </strong>
                  </div>

                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#0b0f17] border-slate-800' : 'bg-white border-slate-200'}`}>
                    <span className="text-[10px] font-sans font-bold text-slate-400 block uppercase">Responsável & Setor</span>
                    <strong className="text-xs text-sky-400 font-bold block truncate">
                      {maximizedAction.colaboradorResponsavel || 'Operação'}
                    </strong>
                    <span className="text-[10px] text-slate-400 font-sans truncate block">{maximizedAction.setor || 'Armazém'}</span>
                  </div>
                </div>
              </div>

              {/* CHECKLIST DE VERIFICAÇÃO OPERACIONAL */}
              <div className={`p-4 rounded-2xl border ${
                isDark ? 'bg-[#121824] border-slate-700/80' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-black uppercase text-slate-300 tracking-wider flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-amber-400" /> Etapas de Verificação Operacional
                  </h4>
                </div>

                <div className="space-y-2 mb-3">
                  {getNormalizedSteps(maximizedAction.etapasVerificacao).length === 0 ? (
                    <p className="text-xs text-slate-500 italic p-2">Nenhuma etapa cadastrada ainda. Adicione abaixo os passos operacionais de verificação.</p>
                  ) : (
                    getNormalizedSteps(maximizedAction.etapasVerificacao).map((step) => (
                      <div
                        key={step.id}
                        onClick={() => handleToggleStepInMaximized(step.id)}
                        className={`p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${
                          step.concluida
                            ? isDark ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                            : isDark ? 'bg-[#0b0f17] border-slate-800 text-slate-300 hover:border-slate-700' : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                          step.concluida 
                            ? 'bg-emerald-500 border-emerald-500 text-white' 
                            : isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-300 bg-white'
                        }`}>
                          {step.concluida && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <span className={`text-xs ${step.concluida ? 'line-through opacity-80' : 'font-medium'}`}>
                          {step.texto}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* Adicionar nova etapa */}
                <form onSubmit={handleAddStepInMaximized} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Adicionar nova etapa operacional de verificação..."
                    value={newStepText}
                    onChange={e => setNewStepText(e.target.value)}
                    className={`flex-1 p-2 rounded-xl border text-xs outline-none ${
                      isDark ? 'bg-[#0b0f17] border-slate-800 text-white focus:border-amber-500' : 'bg-white border-slate-300 text-slate-800 focus:border-amber-500'
                    }`}
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar
                  </button>
                </form>
              </div>

              {/* 5 PORQUÊS & CAUSA RAIZ */}
              {maximizedAction.cincoPorques && (maximizedAction.cincoPorques.porque1 || maximizedAction.cincoPorques.porque2 || maximizedAction.cincoPorques.porque3 || maximizedAction.cincoPorques.porque4 || maximizedAction.cincoPorques.porque5) && (
                <div className={`p-4 rounded-2xl border ${
                  isDark ? 'bg-[#121824] border-slate-700/80' : 'bg-slate-50 border-slate-200'
                }`}>
                  <h4 className="text-xs font-black uppercase text-indigo-400 tracking-wider flex items-center gap-2 mb-3">
                    <HelpCircle className="w-4 h-4" /> Análise de Causa Raiz (5 Porquês)
                  </h4>
                  <div className="space-y-2 text-xs">
                    {maximizedAction.cincoPorques.porque1 && (
                      <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">1º Por quê?</span>
                        <p className="text-slate-200">{maximizedAction.cincoPorques.porque1}</p>
                      </div>
                    )}
                    {maximizedAction.cincoPorques.porque2 && (
                      <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">2º Por quê?</span>
                        <p className="text-slate-200">{maximizedAction.cincoPorques.porque2}</p>
                      </div>
                    )}
                    {maximizedAction.cincoPorques.porque3 && (
                      <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">3º Por quê?</span>
                        <p className="text-slate-200">{maximizedAction.cincoPorques.porque3}</p>
                      </div>
                    )}
                    {maximizedAction.cincoPorques.porque4 && (
                      <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">4º Por quê?</span>
                        <p className="text-slate-200">{maximizedAction.cincoPorques.porque4}</p>
                      </div>
                    )}
                    {maximizedAction.cincoPorques.porque5 && (
                      <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-500/30">
                        <span className="text-[10px] font-bold text-rose-400 uppercase block">5º Por quê? (Causa Raiz Fundamental)</span>
                        <p className="text-rose-200 font-bold">{maximizedAction.cincoPorques.porque5}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* GOVERNANÇA & VALIDAÇÃO */}
              <div className={`p-4 rounded-2xl border ${
                isDark ? 'bg-[#121824] border-slate-700/80' : 'bg-slate-50 border-slate-200'
              }`}>
                <h4 className="text-xs font-black uppercase text-slate-300 tracking-wider flex items-center gap-2 mb-3">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Governança & Validação de Eficácia
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Aprovação Gestor</span>
                    <span className={`font-black uppercase inline-block mt-1 ${
                      maximizedAction.aprovacaoGestor === 'Aprovado' ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {maximizedAction.aprovacaoGestor || 'Pendente'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Aceite do Colaborador</span>
                    <span className={`font-black uppercase inline-block mt-1 ${
                      maximizedAction.aceiteColaborador ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {maximizedAction.aceiteColaborador ? '✓ Assinado e Acordado' : 'Pendente de Aceite'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Evidência / Anexo</span>
                    <span className="text-slate-300 block truncate mt-1">
                      {maximizedAction.evidencias || 'Sem evidência anexada'}
                    </span>
                  </div>
                </div>
              </div>

              {/* PARECER DE CAMPO / OBSERVAÇÕES */}
              <div className={`p-4 rounded-2xl border ${
                isDark ? 'bg-[#121824] border-slate-700/80' : 'bg-slate-50 border-slate-200'
              }`}>
                <h4 className="text-xs font-black uppercase text-slate-300 tracking-wider flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-sky-400" /> Parecer de Campo / Observações de Execução
                </h4>
                <textarea
                  rows={3}
                  placeholder="Adicione observações de campo, validações com a equipe ou justificativas..."
                  defaultValue={maximizedAction.comentarioOperador || ''}
                  onBlur={(e) => handleSaveObservationInMaximized(e.target.value)}
                  className={`w-full p-3 rounded-xl border text-xs leading-relaxed outline-none focus:border-amber-500 transition-colors ${
                    isDark ? 'bg-[#0b0f17] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                  }`}
                />
                <span className="text-[10px] text-slate-500 block mt-1">
                  * O parecer é salvo automaticamente ao clicar fora da caixa de texto.
                </span>
              </div>
            </div>

            {/* FOOTER CONTROLS */}
            <div className="p-4 border-t border-slate-700/50 flex flex-wrap items-center justify-between gap-3 shrink-0 bg-slate-900/60">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Alterar Status:</span>
                <div className="flex items-center gap-1.5">
                  {(['Pendente', 'Em Andamento', 'Concluído', 'Atrasado'] as AcaoCorretiva['status'][]).map(st => (
                    <button
                      key={st}
                      onClick={() => handleQuickStatusInMaximized(st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        maximizedAction.status === st
                          ? st === 'Concluído' ? 'bg-emerald-600 text-white shadow-sm' : st === 'Em Andamento' ? 'bg-sky-600 text-white shadow-sm' : st === 'Atrasado' ? 'bg-rose-600 text-white shadow-sm' : 'bg-slate-700 text-white'
                          : isDark ? 'bg-slate-900 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const item = maximizedAction;
                    setMaximizedAction(null);
                    setActiveItem(item);
                    setIsModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-indigo-300 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/40 cursor-pointer flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Tratativa Completa & 5 Porquês
                </button>

                <button
                  onClick={() => {
                    if (window.confirm('Deseja excluir esta ação?')) {
                      deleteAcaoCorretiva(maximizedAction.id);
                      setMaximizedAction(null);
                      loadData();
                    }
                  }}
                  className="p-2 text-rose-400 hover:text-white hover:bg-rose-500/20 border border-rose-500/30 rounded-xl cursor-pointer transition-all"
                  title="Excluir Ação"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExecutiveActionBoard;
