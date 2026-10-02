import React, { useState, useEffect, useMemo } from 'react';
import { Usuario, Empresa } from '../types';
import { 
  Zap, 
  ExternalLink, 
  Plus, 
  Search, 
  Filter, 
  Maximize2, 
  Minimize2, 
  X, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  AlertOctagon, 
  ShieldAlert, 
  Calendar, 
  ArrowRight, 
  Edit3, 
  Trash2, 
  Layers, 
  Sparkles, 
  FileText, 
  Printer, 
  Activity, 
  TrendingUp, 
  CheckSquare, 
  HelpCircle,
  ArrowLeft,
  ChevronRight,
  User,
  MapPin,
  RefreshCw,
  Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface AcaoMontagemItem {
  id: string;
  indicador: string;
  criticidade: 'Alta' | 'Média' | 'Baixa';
  tipo: 'Corretiva' | 'Rotina' | 'Melhoria';
  oQueFazer: string;
  resolucao: string;
  dataInicio: string; // YYYY-MM-DD
  dataTermino: string; // YYYY-MM-DD
  status: 'Pendente' | 'Em Andamento' | 'Concluído';
  responsavel?: string;
  local?: string;
  observacaoCampo?: string;
  etapasVerificacao?: { id: string; texto: string; concluida: boolean }[];
}

interface GuiaMontagemPanelProps {
  user: Usuario;
  empresa?: Empresa | null;
  theme?: 'light' | 'dark';
  onBack?: () => void;
}

const STORAGE_KEY = 'af_acoes_montagem_fastpicking';
const FAST_PICKING_URL = 'https://new.fastpicking.com.br/home';

// Indicadores pré-definidos para agilidade
const INDICADORES_SUGERIDOS = [
  'Eficiência de Montagem (EFM)',
  'Erro de Montagem (Falta / Excesso)',
  'Precisão do Picking',
  'Ritmo de Separação de Linha',
  'Curva ABC / Endereçamento',
  'Ressuprimento do Picking',
  'FEFO / Validade na Separação',
  'Divergência no Fast Picking',
  'Quebras / Avarias na Montagem',
  'Tempo de Ciclo de Montagem'
];

// Modelos rápidos de ações de montagem
const ACOES_PADRAO_EXEMPLOS: Omit<AcaoMontagemItem, 'id'>[] = [
  {
    indicador: 'Precisão do Picking',
    criticidade: 'Alta',
    tipo: 'Corretiva',
    oQueFazer: 'Corrigir divergência de saldo físico x Armazém Fácil/Fast Picking antes da liberação da onda.',
    resolucao: 'Conferir contagem física na posição, ajustar saldo no sistema e orientar equipe para verificação obrigatória de código de barras.',
    dataInicio: '2026-08-26',
    dataTermino: '2026-08-28',
    status: 'Em Andamento',
    responsavel: 'Djeanderson Soares',
    local: 'Picking / Rua 04 - Posições Críticas',
    observacaoCampo: 'Divergência tratada na onda matutina do Fast Picking.',
    etapasVerificacao: [
      { id: '1', texto: 'Auditar saldo físico na posição de picking', concluida: true },
      { id: '2', texto: 'Confrontar divergência no Fast Picking / Armazém Fácil', concluida: true },
      { id: '3', texto: 'Realizar ajuste de estoque e validar com conferência', concluida: false },
      { id: '4', texto: 'Acompanhar montagem da próxima rota', concluida: false }
    ]
  },
  {
    indicador: 'Curva ABC / Endereçamento',
    criticidade: 'Média',
    tipo: 'Melhoria',
    oQueFazer: 'Revisar itens de alto giro que estão posicionados nos extremos do picking.',
    resolucao: 'Reendereçar os SKUs classe A para o centro da linha de montagem, reduzindo o tempo de deslocamento por pallet.',
    dataInicio: '2026-08-25',
    dataTermino: '2026-08-29',
    status: 'Pendente',
    responsavel: 'Operação Montagem',
    local: 'Picking / Corredor Principal',
    observacaoCampo: '',
    etapasVerificacao: [
      { id: '1', texto: 'Mapear volume de giro semanal', concluida: false },
      { id: '2', texto: 'Definir novas posições centrais', concluida: false },
      { id: '3', texto: 'Executar movimentação física e reendereçar no sistema', concluida: false }
    ]
  },
  {
    indicador: 'FEFO / Validade na Separação',
    criticidade: 'Alta',
    tipo: 'Rotina',
    oQueFazer: 'Verificar lote e shelf life dos SKUs antes de iniciar a separação de cargas de longa distância.',
    resolucao: 'Garantir que os paletes com validade mais próxima sejam coletados primeiro conforme prioridade do Fast Picking.',
    dataInicio: '2026-08-26',
    dataTermino: '2026-08-27',
    status: 'Concluído',
    responsavel: 'Conferente de Linha',
    local: 'Bloco A1 / Linha de Montagem',
    observacaoCampo: 'Checklist executado 100% conforme padrão DPO.',
    etapasVerificacao: [
      { id: '1', texto: 'Conferir etiquetas de validade nas caixas', concluida: true },
      { id: '2', texto: 'Validar trava de lote no coletor/Fast Picking', concluida: true },
      { id: '3', texto: 'Liberar palete montado para expedição', concluida: true }
    ]
  }
];

export const GuiaMontagemPanel: React.FC<GuiaMontagemPanelProps> = ({
  user,
  empresa,
  theme = 'dark',
  onBack
}) => {
  const isDark = theme === 'dark';

  // Load actions from localStorage
  const [acoes, setAcoes] = useState<AcaoMontagemItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar ações de montagem:', e);
    }
    // Default initial seeded items
    return ACOES_PADRAO_EXEMPLOS.map((item, idx) => ({
      ...item,
      id: `MONT_${Date.now()}_${idx + 1}`
    }));
  });

  // Save actions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(acoes));
    } catch (e) {
      console.error('Erro ao salvar ações de montagem:', e);
    }
  }, [acoes]);

  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCriticidade, setFilterCriticidade] = useState<string>('todas');
  const [filterTipo, setFilterTipo] = useState<string>('todos');
  const [filterStatus, setFilterStatus] = useState<string>('todos');

  // Modal State for Generating/Editing Action
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActionId, setEditingActionId] = useState<string | null>(null);

  // Form Fields
  const [formIndicador, setFormIndicador] = useState(INDICADORES_SUGERIDOS[0]);
  const [formCustomIndicador, setFormCustomIndicador] = useState('');
  const [formCriticidade, setFormCriticidade] = useState<'Alta' | 'Média' | 'Baixa'>('Alta');
  const [formTipo, setFormTipo] = useState<'Corretiva' | 'Rotina' | 'Melhoria'>('Corretiva');
  const [formOQueFazer, setFormOQueFazer] = useState('');
  const [formResolucao, setFormResolucao] = useState('');
  const [formDataInicio, setFormDataInicio] = useState(() => new Date().toISOString().split('T')[0]);
  const [formDataTermino, setFormDataTermino] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [formResponsavel, setFormResponsavel] = useState(user.nome || 'Operador Montagem');
  const [formLocal, setFormLocal] = useState('Picking / Linha de Montagem Fast Picking');
  const [formStatus, setFormStatus] = useState<'Pendente' | 'Em Andamento' | 'Concluído'>('Em Andamento');

  // Modal State for Maximized / Detailed Analysis View
  const [maximizedAction, setMaximizedAction] = useState<AcaoMontagemItem | null>(null);
  const [isFullscreenModal, setIsFullscreenModal] = useState(false);

  // Stats calculation
  const stats = useMemo(() => {
    const total = acoes.length;
    const altas = acoes.filter(a => a.criticidade === 'Alta' && a.status !== 'Concluído').length;
    const emAndamento = acoes.filter(a => a.status === 'Em Andamento').length;
    const concluidas = acoes.filter(a => a.status === 'Concluído').length;
    return { total, altas, emAndamento, concluidas };
  }, [acoes]);

  // Filtered actions list
  const filteredAcoes = useMemo(() => {
    return acoes.filter(item => {
      // Search matching
      const matchesSearch = 
        !searchTerm.trim() ||
        item.indicador.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.oQueFazer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.resolucao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.local && item.local.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.responsavel && item.responsavel.toLowerCase().includes(searchTerm.toLowerCase()));

      // Criticidade matching
      const matchesCriticidade = filterCriticidade === 'todas' || item.criticidade === filterCriticidade;

      // Tipo matching
      const matchesTipo = filterTipo === 'todos' || item.tipo === filterTipo;

      // Status matching
      const matchesStatus = filterStatus === 'todos' || item.status === filterStatus;

      return matchesSearch && matchesCriticidade && matchesTipo && matchesStatus;
    });
  }, [acoes, searchTerm, filterCriticidade, filterTipo, filterStatus]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingActionId(null);
    setFormIndicador(INDICADORES_SUGERIDOS[0]);
    setFormCustomIndicador('');
    setFormCriticidade('Alta');
    setFormTipo('Corretiva');
    setFormOQueFazer('');
    setFormResolucao('');
    setFormDataInicio(new Date().toISOString().split('T')[0]);
    const d = new Date();
    d.setDate(d.getDate() + 3);
    setFormDataTermino(d.toISOString().split('T')[0]);
    setFormResponsavel(user.nome || 'Operador Montagem');
    setFormLocal('Picking / Linha de Montagem Fast Picking');
    setFormStatus('Em Andamento');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (action: AcaoMontagemItem) => {
    setEditingActionId(action.id);
    if (INDICADORES_SUGERIDOS.includes(action.indicador)) {
      setFormIndicador(action.indicador);
      setFormCustomIndicador('');
    } else {
      setFormIndicador('Outro');
      setFormCustomIndicador(action.indicador);
    }
    setFormCriticidade(action.criticidade);
    setFormTipo(action.tipo);
    setFormOQueFazer(action.oQueFazer);
    setFormResolucao(action.resolucao);
    setFormDataInicio(action.dataInicio);
    setFormDataTermino(action.dataTermino);
    setFormResponsavel(action.responsavel || user.nome || 'Operador Montagem');
    setFormLocal(action.local || 'Picking / Linha de Montagem');
    setFormStatus(action.status);
    setIsModalOpen(true);
  };

  // Save Action (Create or Update)
  const handleSaveAction = (e: React.FormEvent) => {
    e.preventDefault();
    const finalIndicador = formIndicador === 'Outro' && formCustomIndicador.trim() 
      ? formCustomIndicador.trim() 
      : formIndicador;

    if (!finalIndicador || !formOQueFazer.trim() || !formResolucao.trim()) {
      alert('Por favor, preencha o Indicador, o Que Fazer e a Resolução.');
      return;
    }

    if (editingActionId) {
      // Update existing
      setAcoes(prev => prev.map(item => {
        if (item.id === editingActionId) {
          return {
            ...item,
            indicador: finalIndicador,
            criticidade: formCriticidade,
            tipo: formTipo,
            oQueFazer: formOQueFazer.trim(),
            resolucao: formResolucao.trim(),
            dataInicio: formDataInicio,
            dataTermino: formDataTermino,
            status: formStatus,
            responsavel: formResponsavel,
            local: formLocal
          };
        }
        return item;
      }));

      // Update maximized if currently viewing
      if (maximizedAction && maximizedAction.id === editingActionId) {
        setMaximizedAction(prev => prev ? {
          ...prev,
          indicador: finalIndicador,
          criticidade: formCriticidade,
          tipo: formTipo,
          oQueFazer: formOQueFazer.trim(),
          resolucao: formResolucao.trim(),
          dataInicio: formDataInicio,
          dataTermino: formDataTermino,
          status: formStatus,
          responsavel: formResponsavel,
          local: formLocal
        } : null);
      }
    } else {
      // Create new action (strictly no created/opened timestamp recorded!)
      const newAction: AcaoMontagemItem = {
        id: `MONT_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        indicador: finalIndicador,
        criticidade: formCriticidade,
        tipo: formTipo,
        oQueFazer: formOQueFazer.trim(),
        resolucao: formResolucao.trim(),
        dataInicio: formDataInicio,
        dataTermino: formDataTermino,
        status: formStatus,
        responsavel: formResponsavel,
        local: formLocal,
        etapasVerificacao: [
          { id: '1', texto: `Verificar no Fast Picking o status de: ${finalIndicador}`, concluida: false },
          { id: '2', texto: `Executar contramedida: ${formResolucao.substring(0, 45)}...`, concluida: false },
          { id: '3', texto: 'Confirmar normalização da linha de montagem', concluida: false }
        ]
      };

      setAcoes(prev => [newAction, ...prev]);
    }

    setIsModalOpen(false);
  };

  // Delete Action
  const handleDeleteAction = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta ação de montagem?')) {
      setAcoes(prev => prev.filter(a => a.id !== id));
      if (maximizedAction && maximizedAction.id === id) {
        setMaximizedAction(null);
      }
    }
  };

  // Quick Status Toggle
  const handleQuickStatusChange = (id: string, newStatus: AcaoMontagemItem['status']) => {
    setAcoes(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, status: newStatus };
      }
      return item;
    }));

    if (maximizedAction && maximizedAction.id === id) {
      setMaximizedAction(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  // Toggle Verification Step in Maximized View
  const handleToggleStep = (stepId: string) => {
    if (!maximizedAction) return;
    const updatedSteps = (maximizedAction.etapasVerificacao || []).map(s => {
      if (s.id === stepId) {
        return { ...s, concluida: !s.concluida };
      }
      return s;
    });

    const updated = { ...maximizedAction, etapasVerificacao: updatedSteps };
    setMaximizedAction(updated);
    setAcoes(prev => prev.map(item => item.id === updated.id ? updated : item));
  };

  // Update Observation in Maximized View
  const handleSaveObservation = (obs: string) => {
    if (!maximizedAction) return;
    const updated = { ...maximizedAction, observacaoCampo: obs };
    setMaximizedAction(updated);
    setAcoes(prev => prev.map(item => item.id === updated.id ? updated : item));
  };

  const getCriticidadeBadge = (crit: AcaoMontagemItem['criticidade']) => {
    switch (crit) {
      case 'Alta':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-500/15 text-rose-500 border border-rose-500/30">
            <AlertOctagon className="w-3 h-3" /> Alta
          </span>
        );
      case 'Média':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-500 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3" /> Média
          </span>
        );
      case 'Baixa':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
            <ShieldAlert className="w-3 h-3" /> Baixa
          </span>
        );
    }
  };

  const getTipoBadge = (tipo: AcaoMontagemItem['tipo']) => {
    switch (tipo) {
      case 'Corretiva':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-red-600/10 text-red-500 border border-red-500/20">
            Corretiva
          </span>
        );
      case 'Rotina':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-sky-600/10 text-sky-500 border border-sky-500/20">
            Rotina
          </span>
        );
      case 'Melhoria':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-600/10 text-purple-400 border border-purple-500/20">
            Melhoria
          </span>
        );
    }
  };

  const getStatusBadge = (status: AcaoMontagemItem['status']) => {
    switch (status) {
      case 'Concluído':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" /> Concluído
          </span>
        );
      case 'Em Andamento':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Clock className="w-3 h-3 animate-spin" /> Em Andamento
          </span>
        );
      case 'Pendente':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-500/15 text-slate-400 border border-slate-500/30">
            <Clock className="w-3 h-3" /> Pendente
          </span>
        );
    }
  };

  return (
    <div className={`min-h-screen p-3 md:p-6 transition-colors duration-200 ${
      isDark ? 'bg-[#0b0f17] text-slate-100' : 'bg-slate-50 text-slate-800'
    }`} id="guia-montagem-main-panel">
      
      {/* ── TOP BREADCRUMB & CONTROLS ── */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isDark 
                  ? 'bg-[#151b23] border-[#222d3a] text-slate-400 hover:text-white hover:border-slate-600' 
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs'
              }`}
              title="Voltar"
              id="btn-voltar-montagem"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                PRODUTIVIDADE & MONTAGEM
              </span>
              <span className="text-[10px] font-bold text-slate-500">DPO Armazém 2026</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight mt-0.5 flex items-center gap-2">
              <Zap className="w-6 h-6 text-amber-500" />
              Guia de Montagem & Fast Picking
            </h1>
          </div>
        </div>

        {/* Action Buttons Header */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Direct Fast Picking Link Button */}
          <a
            href={FAST_PICKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            id="btn-acessar-fastpicking"
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-600/20 border border-blue-400/30 transition-all cursor-pointer transform active:scale-98"
          >
            <span>Acessar Fast Picking</span>
            <ExternalLink className="w-4 h-4" />
          </a>

          {/* Generate Action Button */}
          <button
            onClick={handleOpenCreateModal}
            id="btn-gerar-acao"
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-white bg-amber-600 hover:bg-amber-500 shadow-lg shadow-amber-600/20 border border-amber-400/30 transition-all cursor-pointer transform active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Gerar Ações</span>
          </button>
        </div>
      </div>

      {/* ── FAST PICKING HIGHLIGHT CARD ── */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className={`p-4 md:p-5 rounded-2xl border relative overflow-hidden ${
          isDark 
            ? 'bg-gradient-to-br from-[#121927] via-[#0e1420] to-[#151b28] border-blue-500/20 shadow-xl' 
            : 'bg-gradient-to-br from-blue-50 via-white to-indigo-50/50 border-blue-200 shadow-sm'
        }`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0 text-blue-400">
                <Compass className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base md:text-lg font-black tracking-tight">
                    Ambiente Integrado Fast Picking
                  </h2>
                  <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Online
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  Utilize o link direto para a plataforma oficial do <strong>Fast Picking</strong> para acompanhar ondas de separação, conferência de lotes e produtividade individual da montagem em tempo real.
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-2.5 text-[11px] text-slate-400">
                  <span className="font-mono text-blue-400 underline">{FAST_PICKING_URL}</span>
                  <span className="text-slate-500">•</span>
                  <span>Ondas de Picking Ativas</span>
                  <span className="text-slate-500">•</span>
                  <span>Controle de Divergências</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
              <a
                href={FAST_PICKING_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full lg:w-auto px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all border ${
                  isDark
                    ? 'bg-[#151b23] border-[#222d3a] text-blue-400 hover:text-white hover:border-blue-500/50'
                    : 'bg-white border-blue-200 text-blue-700 hover:bg-blue-50 shadow-xs'
                }`}
              >
                <span>Abrir em Nova Aba</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── STATS COUNTERS ── */}
      <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <div className={`p-4 rounded-xl border ${
          isDark ? 'bg-[#121720] border-[#1d2633]' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Total de Ações</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black">{stats.total}</span>
            <span className="text-xs text-slate-500 font-bold">Cadastradas</span>
          </div>
        </div>

        <div className={`p-4 rounded-xl border ${
          isDark ? 'bg-[#121720] border-rose-500/20' : 'bg-rose-50/50 border-rose-200 shadow-xs'
        }`}>
          <span className="text-[10px] font-black text-rose-500 uppercase tracking-wider block">Alta Criticidade</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-rose-500">{stats.altas}</span>
            <span className="text-xs text-rose-400 font-bold">Prioritárias</span>
          </div>
        </div>

        <div className={`p-4 rounded-xl border ${
          isDark ? 'bg-[#121720] border-amber-500/20' : 'bg-amber-50/50 border-amber-200 shadow-xs'
        }`}>
          <span className="text-[10px] font-black text-amber-500 uppercase tracking-wider block">Em Andamento</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-amber-500">{stats.emAndamento}</span>
            <span className="text-xs text-amber-400 font-bold">Em Execução</span>
          </div>
        </div>

        <div className={`p-4 rounded-xl border ${
          isDark ? 'bg-[#121720] border-emerald-500/20' : 'bg-emerald-50/50 border-emerald-200 shadow-xs'
        }`}>
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-wider block">Concluídas</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-emerald-500">{stats.concluidas}</span>
            <span className="text-xs text-emerald-400 font-bold">Tratadas</span>
          </div>
        </div>
      </div>

      {/* ── FILTERS & ACTIONS LIST ── */}
      <div className="max-w-7xl mx-auto">
        <div className={`p-4 md:p-5 rounded-2xl border ${
          isDark ? 'bg-[#10151f] border-[#1c2432]' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          
          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-5">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por indicador, o que fazer, resolução, local ou responsável..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-xl text-xs font-medium border outline-none transition-all ${
                  isDark 
                    ? 'bg-[#151b24] border-[#232e3e] text-white focus:border-amber-500/50' 
                    : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-amber-500'
                }`}
              />
            </div>

            {/* Quick Filter Selects */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filterCriticidade}
                onChange={e => setFilterCriticidade(e.target.value)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border outline-none cursor-pointer ${
                  isDark ? 'bg-[#151b24] border-[#232e3e] text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <option value="todas">Criticidade: Todas</option>
                <option value="Alta">Alta</option>
                <option value="Média">Média</option>
                <option value="Baixa">Baixa</option>
              </select>

              <select
                value={filterTipo}
                onChange={e => setFilterTipo(e.target.value)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border outline-none cursor-pointer ${
                  isDark ? 'bg-[#151b24] border-[#232e3e] text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <option value="todos">Tipo: Todos</option>
                <option value="Corretiva">Corretiva</option>
                <option value="Rotina">Rotina</option>
                <option value="Melhoria">Melhoria</option>
              </select>

              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border outline-none cursor-pointer ${
                  isDark ? 'bg-[#151b24] border-[#232e3e] text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <option value="todos">Status: Todos</option>
                <option value="Pendente">Pendente</option>
                <option value="Em Andamento">Em Andamento</option>
                <option value="Concluído">Concluído</option>
              </select>
            </div>
          </div>

          {/* Actions Cards Grid */}
          {filteredAcoes.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-300">Nenhuma ação encontrada</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Ajuste os filtros de busca ou clique no botão &quot;Gerar Ação Simples&quot; para registrar uma nova contramedida de montagem.
              </p>
              <button
                onClick={handleOpenCreateModal}
                className="mt-4 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
              >
                + Gerar Ação Simples
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="lista-acoes-montagem">
              {filteredAcoes.map(action => (
                <div
                  key={action.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between transition-all group hover:border-amber-500/40 relative ${
                    isDark 
                      ? 'bg-[#141b26] border-[#202a39] hover:bg-[#161e2b]' 
                      : 'bg-white border-slate-200 hover:border-amber-400 shadow-xs'
                  }`}
                >
                  <div>
                    {/* Header Badges */}
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {getCriticidadeBadge(action.criticidade)}
                        {getTipoBadge(action.tipo)}
                      </div>
                      <div className="shrink-0">
                        {getStatusBadge(action.status)}
                      </div>
                    </div>

                    {/* Indicador */}
                    <h3 className="text-sm font-black text-slate-100 dark:text-white tracking-tight mb-2 line-clamp-1">
                      {action.indicador}
                    </h3>

                    {/* O Que Fazer */}
                    <div className="mb-2.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">
                        O Que Fazer:
                      </span>
                      <p className="text-xs text-slate-300 dark:text-slate-300 line-clamp-2 leading-relaxed">
                        {action.oQueFazer}
                      </p>
                    </div>

                    {/* Resolução */}
                    <div className="mb-3 p-2.5 rounded-lg bg-slate-900/40 dark:bg-black/30 border border-slate-800/40">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block mb-0.5 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Resolução:
                      </span>
                      <p className="text-xs text-slate-200 dark:text-slate-300 line-clamp-2 leading-relaxed">
                        {action.resolucao}
                      </p>
                    </div>

                    {/* Period Timeline (STRICT: DATA INICIO & TERMINO ONLY, NO OPENED/CREATED DATE) */}
                    <div className="flex items-center justify-between py-2 border-t border-b border-slate-800/40 text-[11px] text-slate-400 font-mono">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-sky-400" />
                        <span>Início: <strong className="text-slate-300">{action.dataInicio.split('-').reverse().join('/')}</strong></span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>Término: <strong className="text-slate-300">{action.dataTermino.split('-').reverse().join('/')}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Footer Action Buttons with Maximizar / Analisar no Detalhe */}
                  <div className="flex items-center justify-between gap-2 mt-3 pt-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(action)}
                        title="Editar ação"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteAction(action.id)}
                        title="Excluir ação"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* BUTTON TO MAXIMIZE AND ANALYZE IN DETAIL */}
                    <button
                      onClick={() => setMaximizedAction(action)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-black text-xs uppercase tracking-wider text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all cursor-pointer group-hover:bg-amber-500 group-hover:text-black group-hover:border-amber-400"
                      title="Maximizar para analisar no detalhe"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Maximizar / Detalhes</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL: GERAR / EDITAR AÇÃO SIMPLES ── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden ${
                isDark ? 'bg-[#121824] border-[#222e40] text-slate-100' : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-800/40 flex items-center justify-between bg-gradient-to-r from-amber-500/10 to-transparent">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black tracking-tight">
                      {editingActionId ? 'Editar Ação de Montagem' : 'Gerar Ações de Montagem'}
                    </h2>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Plano DPO & Fast Picking
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveAction} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
                {/* Indicador */}
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-1.5">
                    Indicador / Processo de Montagem *
                  </label>
                  <select
                    value={formIndicador}
                    onChange={e => setFormIndicador(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border outline-none mb-2 ${
                      isDark ? 'bg-[#161f2e] border-[#26354a] text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    {INDICADORES_SUGERIDOS.map(ind => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                    <option value="Outro">+ Digitar outro indicador...</option>
                  </select>

                  {formIndicador === 'Outro' && (
                    <input
                      type="text"
                      placeholder="Especifique o nome do indicador..."
                      value={formCustomIndicador}
                      onChange={e => setFormCustomIndicador(e.target.value)}
                      className={`w-full px-3.5 py-2 rounded-xl text-xs font-medium border outline-none ${
                        isDark ? 'bg-[#161f2e] border-[#26354a] text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                      required
                    />
                  )}
                </div>

                {/* Criticidade & Tipo (Grid) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-1.5">
                      Criticidade *
                    </label>
                    <select
                      value={formCriticidade}
                      onChange={e => setFormCriticidade(e.target.value as any)}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border outline-none ${
                        isDark ? 'bg-[#161f2e] border-[#26354a] text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <option value="Alta">Alta (Crítica)</option>
                      <option value="Média">Média (Atenção)</option>
                      <option value="Baixa">Baixa (Rotineira)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-1.5">
                      Tipo de Ação *
                    </label>
                    <select
                      value={formTipo}
                      onChange={e => setFormTipo(e.target.value as any)}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border outline-none ${
                        isDark ? 'bg-[#161f2e] border-[#26354a] text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <option value="Corretiva">Corretiva</option>
                      <option value="Rotina">Rotina</option>
                      <option value="Melhoria">Melhoria</option>
                    </select>
                  </div>
                </div>

                {/* O Que Fazer */}
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-1.5">
                    O Que Fazer (Desvio / Problema Identificado) *
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Descreva claramente o que precisa ser feito ou qual anomalia foi identificada na montagem..."
                    value={formOQueFazer}
                    onChange={e => setFormOQueFazer(e.target.value)}
                    className={`w-full p-3 rounded-xl text-xs font-medium border outline-none resize-none ${
                      isDark ? 'bg-[#161f2e] border-[#26354a] text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                    required
                  />
                </div>

                {/* Resolução */}
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-emerald-400 block mb-1.5">
                    Resolução (Contramedida / Como Resolver) *
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Especifique a ação prática para resolver o problema e garantir a precisão no Fast Picking..."
                    value={formResolucao}
                    onChange={e => setFormResolucao(e.target.value)}
                    className={`w-full p-3 rounded-xl text-xs font-medium border outline-none resize-none ${
                      isDark ? 'bg-[#161f2e] border-[#26354a] text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                    required
                  />
                </div>

                {/* Data Inicio & Data Termino (STRICT: ONLY THESE TWO DATES) */}
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-900/40 border border-slate-800/60">
                  <div>
                    <label className="text-[11px] font-black uppercase tracking-wider text-sky-400 block mb-1">
                      Data de Início *
                    </label>
                    <input
                      type="date"
                      value={formDataInicio}
                      onChange={e => setFormDataInicio(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg text-xs font-mono font-bold border outline-none ${
                        isDark ? 'bg-[#161f2e] border-[#26354a] text-white' : 'bg-white border-slate-200 text-slate-800'
                      }`}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-black uppercase tracking-wider text-amber-400 block mb-1">
                      Data de Término *
                    </label>
                    <input
                      type="date"
                      value={formDataTermino}
                      onChange={e => setFormDataTermino(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg text-xs font-mono font-bold border outline-none ${
                        isDark ? 'bg-[#161f2e] border-[#26354a] text-white' : 'bg-white border-slate-200 text-slate-800'
                      }`}
                      required
                    />
                  </div>
                </div>

                {/* Local & Responsável */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-1.5">
                      Responsável
                    </label>
                    <input
                      type="text"
                      value={formResponsavel}
                      onChange={e => setFormResponsavel(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-medium border outline-none ${
                        isDark ? 'bg-[#161f2e] border-[#26354a] text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-1.5">
                      Status da Ação
                    </label>
                    <select
                      value={formStatus}
                      onChange={e => setFormStatus(e.target.value as any)}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-bold border outline-none ${
                        isDark ? 'bg-[#161f2e] border-[#26354a] text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <option value="Pendente">Pendente</option>
                      <option value="Em Andamento">Em Andamento</option>
                      <option value="Concluído">Concluído</option>
                    </select>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800/40">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-white bg-amber-600 hover:bg-amber-500 shadow-lg shadow-amber-600/20 cursor-pointer transition-all"
                  >
                    {editingActionId ? 'Salvar Alterações' : 'Salvar Ação'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL: MAXIMIZAR E ANALISAR NO DETALHE ── */}
      <AnimatePresence>
        {maximizedAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-6 bg-black/90 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full ${
                isFullscreenModal ? 'max-w-7xl h-[94vh]' : 'max-w-4xl max-h-[90vh]'
              } rounded-2xl border shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
                isDark ? 'bg-[#0f1521] border-[#222e42] text-slate-100' : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-800/60 flex items-center justify-between bg-gradient-to-r from-amber-500/15 via-blue-500/5 to-transparent shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <Maximize2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        ANÁLISE NO DETALHE • PLANO DPO
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">ID: {maximizedAction.id}</span>
                    </div>
                    <h2 className="text-lg md:text-xl font-black tracking-tight mt-0.5">
                      {maximizedAction.indicador}
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsFullscreenModal(!isFullscreenModal)}
                    title={isFullscreenModal ? 'Reduzir tamanho' : 'Expandir tela cheia'}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    {isFullscreenModal ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setMaximizedAction(null)}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Maximized Content Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                
                {/* Meta Strip */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                      Criticidade
                    </span>
                    <div>{getCriticidadeBadge(maximizedAction.criticidade)}</div>
                  </div>

                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                      Tipo de Ação
                    </span>
                    <div>{getTipoBadge(maximizedAction.tipo)}</div>
                  </div>

                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                      Status Atual
                    </span>
                    <div>{getStatusBadge(maximizedAction.status)}</div>
                  </div>

                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                      Responsável
                    </span>
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {maximizedAction.responsavel || 'Operador Montagem'}
                    </span>
                  </div>
                </div>

                {/* Deep Dive: O Que Fazer vs Resolução */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* O Que Fazer */}
                  <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/5">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertOctagon className="w-4 h-4 text-rose-400" />
                      <h3 className="text-xs font-black uppercase tracking-wider text-rose-400">
                        O Que Fazer / Desvio Identificado
                      </h3>
                    </div>
                    <p className="text-sm text-slate-200 leading-relaxed">
                      {maximizedAction.oQueFazer}
                    </p>
                  </div>

                  {/* Resolução */}
                  <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400">
                        Resolução / Contramedida Prática
                      </h3>
                    </div>
                    <p className="text-sm text-slate-200 leading-relaxed">
                      {maximizedAction.resolucao}
                    </p>
                  </div>
                </div>

                {/* Timeline / Período (DATA INÍCIO E DATA TÉRMINO ONLY) */}
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40">
                  <h3 className="text-xs font-black uppercase tracking-wider text-sky-400 mb-3 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" /> Período da Ação (Início e Término)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-black/40 border border-slate-800 flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-medium">Data de Início:</span>
                      <span className="text-sm font-mono font-bold text-sky-400">
                        {maximizedAction.dataInicio.split('-').reverse().join('/')}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-black/40 border border-slate-800 flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-medium">Data de Término:</span>
                      <span className="text-sm font-mono font-bold text-amber-400">
                        {maximizedAction.dataTermino.split('-').reverse().join('/')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Fast Picking Link Shortcut inside the Maximized View */}
                <div className="p-4 rounded-xl border border-blue-500/30 bg-gradient-to-r from-blue-900/20 via-indigo-900/20 to-transparent flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                      <Compass className="w-4 h-4" /> Integração Fast Picking
                    </h4>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Abra o Fast Picking diretamente para conferir as ondas de separação e auditar o endereçamento.
                    </p>
                  </div>
                  <a
                    href={FAST_PICKING_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shrink-0 cursor-pointer"
                  >
                    <span>Ir para Fast Picking</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Checklist de Verificação Operacional */}
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/30">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-amber-400" /> Etapas de Verificação da Ação
                  </h3>
                  <div className="space-y-2">
                    {(maximizedAction.etapasVerificacao || []).map(step => (
                      <div
                        key={step.id}
                        onClick={() => handleToggleStep(step.id)}
                        className={`p-3 rounded-lg border flex items-center gap-3 cursor-pointer transition-all ${
                          step.concluida 
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                            : 'bg-black/30 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded flex items-center justify-center border ${
                          step.concluida ? 'bg-emerald-500 border-emerald-400 text-black' : 'border-slate-600'
                        }`}>
                          {step.concluida && <CheckCircle2 className="w-4 h-4" />}
                        </div>
                        <span className={`text-xs font-medium ${step.concluida ? 'line-through opacity-80' : ''}`}>
                          {step.texto}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Observações de Campo */}
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-1.5">
                    Parecer de Campo / Resolução Final
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Insira notas de acompanhamento, resultados obtidos ou observações adicionais..."
                    value={maximizedAction.observacaoCampo || ''}
                    onChange={e => handleSaveObservation(e.target.value)}
                    className={`w-full p-3 rounded-xl text-xs font-medium border outline-none resize-none ${
                      isDark ? 'bg-[#161f2e] border-[#26354a] text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>

              </div>

              {/* Footer Actions */}
              <div className="p-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 shrink-0">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleQuickStatusChange(maximizedAction.id, 'Concluído')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      maximizedAction.status === 'Concluído' 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30'
                    }`}
                  >
                    ✓ Marcar como Concluído
                  </button>
                  <button
                    onClick={() => handleQuickStatusChange(maximizedAction.id, 'Em Andamento')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      maximizedAction.status === 'Em Andamento' 
                        ? 'bg-amber-600 text-white' 
                        : 'bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 border border-amber-500/30'
                    }`}
                  >
                    ⏳ Em Andamento
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Imprimir</span>
                  </button>
                  <button
                    onClick={() => setMaximizedAction(null)}
                    className="px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default GuiaMontagemPanel;
