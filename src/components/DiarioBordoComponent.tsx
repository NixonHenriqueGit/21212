import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  Plus, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Bell, 
  Award, 
  Trash2, 
  Edit3, 
  Search, 
  Filter, 
  User, 
  Tag,
  GraduationCap,
  ClipboardCheck,
  Check,
  Users,
  Layers,
  Sparkles,
  ChevronRight,
  CheckSquare,
  FileText,
  BarChart2,
  ShieldCheck,
  UserCheck,
  Loader2
} from 'lucide-react';
import { LISTA_COLABORADORES_OFICIAIS } from './RankingModule';
import { DiarioBordoRepository } from '../db';
import { Checklist5SForm, Checklist5SModal, Collaborator5SPerformanceCard, getUserAssignedAreasList } from './Checklist5SModal';

export interface RegistroDiarioBordo {
  id: string;
  usuarioEmail: string;
  usuarioNome: string;
  usuarioCargo?: string;
  usuarioMatricula?: string;
  dataISO: string; // YYYY-MM-DD
  dataFormatted: string; // DD/MM/YYYY
  hora: string; // HH:mm
  tipo: 'Demanda do Dia' | 'Atividade Diária' | 'Compromisso' | 'Treinamento Realizado' | 'Treinamento Agendado' | 'Anotação / Lembrete';
  prioridade: 'Alta' | 'Média' | 'Baixa';
  titulo: string;
  descricao: string;
  setorOuProcesso: string;
  temLembrete: boolean;
  dataLembreteISO?: string;
  horaLembrete?: string;
  status: 'Pendente' | 'Em Andamento' | 'Concluído' | 'Cancelado';
  criadoPor?: string;
  criadoEm: string;
}

interface DiarioBordoComponentProps {
  user: any;
  empresaId?: string;
}

export const DiarioBordoComponent: React.FC<DiarioBordoComponentProps> = ({
  user,
  empresaId = 'demo'
}) => {
  const userEmail = user?.email || 'operador@ambev.com.br';
  const userNome = user?.nome || 'Colaborador UnB Guarabira';
  const userCargo = user?.cargo || user?.role || 'Operador';
  const userMatricula = user?.matricula || 'G1000';

  // Verificação de privilégio administrativo/supervisão
  const isUserAdminOrControl = useMemo(() => {
    if (!user) return true;
    if (user.isControle || user.papel === 'admin' || user.papel === 'controle') return true;
    const cargoLower = (user.cargo || '').toLowerCase();
    const roleLower = (user.role || '').toLowerCase();
    return cargoLower.includes('coordenador') || 
           cargoLower.includes('supervisor') || 
           cargoLower.includes('gerente') || 
           cargoLower.includes('controle') || 
           roleLower.includes('admin') || 
           roleLower.includes('controle');
  }, [user]);

  // Lista unificada de colaboradores para filtro
  const listaColaboradoresParaFiltro = useMemo(() => {
    const list = [...LISTA_COLABORADORES_OFICIAIS];
    // Se o usuário atual não estiver na lista oficial, inclui para não perder sincronia
    const exists = list.some(c => c.nome.toLowerCase() === userNome.toLowerCase() || c.matricula === userMatricula);
    if (!exists && userNome) {
      list.unshift({
        matricula: userMatricula,
        nome: userNome,
        cargo: userCargo,
        cpf: '---',
        turno: 'DIURNO',
        funcaoGroup: 'Operador' as const
      });
    }
    return list;
  }, [userNome, userMatricula, userCargo]);

  // Carregamento e sementes iniciais de registros do Diário de Bordo
  const [registros, setRegistros] = useState<RegistroDiarioBordo[]>(() => {
    try {
      const saved = localStorage.getItem(`diario_bordo_master_list_${empresaId}`);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }

    const today = new Date().toISOString().split('T')[0];
    const todayParts = today.split('-');
    const todayFmt = `${todayParts[2]}/${todayParts[1]}/${todayParts[0]}`;

    return [
      {
        id: `diario-seed-1`,
        usuarioEmail: userEmail,
        usuarioNome: userNome,
        usuarioCargo: userCargo,
        usuarioMatricula: userMatricula,
        dataISO: today,
        dataFormatted: todayFmt,
        hora: '08:00',
        tipo: 'Demanda do Dia',
        prioridade: 'Alta',
        titulo: 'Checklist Inicial do Turno e Inspeção de Segurança DPO',
        descricao: 'Verificação diária do estado geral do equipamento, coleta seletiva de resíduos e conferência de validade no picking.',
        setorOuProcesso: 'Operação / Pátio',
        temLembrete: true,
        dataLembreteISO: today,
        horaLembrete: '16:00',
        status: 'Concluído',
        criadoPor: 'Supervisor de Operações',
        criadoEm: new Date().toISOString()
      },
      {
        id: `diario-seed-2`,
        usuarioEmail: 'gladson.santos@ambev.com.br',
        usuarioNome: 'GLADSON LISBOA DOS SANTOS',
        usuarioCargo: 'AJUDANTE DE ARMAZEM',
        usuarioMatricula: 'G1160',
        dataISO: today,
        dataFormatted: todayFmt,
        hora: '08:30',
        tipo: 'Demanda do Dia',
        prioridade: 'Alta',
        titulo: 'Triagem de Vasilhame Retornável e Separação de Avarias',
        descricao: 'Limpeza e organização da área de despejo de cacos e paletização de garrafas de vidro 600ml.',
        setorOuProcesso: 'Despejo & Repack',
        temLembrete: false,
        status: 'Em Andamento',
        criadoPor: 'Coordenação de Armazém',
        criadoEm: new Date().toISOString()
      },
      {
        id: `diario-seed-3`,
        usuarioEmail: 'ronildo.silva@ambev.com.br',
        usuarioNome: 'JOSE RONILDO DA SILVA',
        usuarioCargo: 'OPERADOR DE EMPILHADEIRA',
        usuarioMatricula: 'G1009',
        dataISO: today,
        dataFormatted: todayFmt,
        hora: '09:00',
        tipo: 'Demanda do Dia',
        prioridade: 'Alta',
        titulo: 'Ressuprimento dos Pulmões de Picking - Cerveja Brahma/Skol',
        descricao: 'Alimentação contínua dos bins de picking e movimentação segura de paletes duplos no corredor EFC.',
        setorOuProcesso: 'EFC / EFD',
        temLembrete: true,
        dataLembreteISO: today,
        horaLembrete: '14:00',
        status: 'Pendente',
        criadoPor: 'Assistente de Controle',
        criadoEm: new Date().toISOString()
      },
      {
        id: `diario-seed-4`,
        usuarioEmail: 'gilson.rosa@ambev.com.br',
        usuarioNome: 'GILSON ROSA DA SILVA',
        usuarioCargo: 'CONFERNTE',
        usuarioMatricula: 'G1093',
        dataISO: today,
        dataFormatted: todayFmt,
        hora: '10:00',
        tipo: 'Demanda do Dia',
        prioridade: 'Média',
        titulo: 'Conferência de Carga do Carreta de Fábrica & Leitura de Código de Barras',
        descricao: 'Conferência física e sistêmica de 28 paletes de lata 350ml recebidos da Cervejaria.',
        setorOuProcesso: 'Recebimento',
        temLembrete: false,
        status: 'Em Andamento',
        criadoPor: 'Coordenador de Armazém',
        criadoEm: new Date().toISOString()
      },
      {
        id: `diario-seed-5`,
        usuarioEmail: 'nixon.arruda@ambev.com.br',
        usuarioNome: 'NIXON HENRIQUE PEREIRA DE ARRUDA',
        usuarioCargo: 'ASSISTENTE DE CONTROLE',
        usuarioMatricula: 'G1128',
        dataISO: today,
        dataFormatted: todayFmt,
        hora: '11:00',
        tipo: 'Treinamento Realizado',
        prioridade: 'Média',
        titulo: 'Reciclagem DPO - Padrões de Segurança e Ergonomia no Armazém',
        descricao: 'Participação no treinamento de reciclagem DPO com foco em 3 pontos de apoio e segregação de pedestre/empilhadeira.',
        setorOuProcesso: 'Qualidade / DPO',
        temLembrete: false,
        status: 'Concluído',
        criadoPor: 'Nixon Arruda',
        criadoEm: new Date().toISOString()
      }
    ];
  });

  // Estado da Visão / Modos de Filtro
  const [visaoModo, setVisaoModo] = useState<'individual' | 'administrativa'>(() => {
    return isUserAdminOrControl ? 'administrativa' : 'individual';
  });
  const [activeDiarioTab, setActiveDiarioTab] = useState<'demandas' | '5s'>('demandas');
  const [showModal5S, setShowModal5S] = useState<boolean>(false);
  const [selectedSetor5S, setSelectedSetor5S] = useState<string>('ADMINISTRATIVO');
  const [colaboradorSelecionadoMatricula, setColaboradorSelecionadoMatricula] = useState<string>('todos');
  const [funcaoFiltro, setFuncaoFiltro] = useState<string>('todos');
  const [statusFiltro, setStatusFiltro] = useState<string>('todos');
  const [tipoFiltro, setTipoFiltro] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Toast Feedback State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Modal / Form state
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Non-blocking Deletion Confirmation State
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; titulo: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Form Fields
  const [targetColaboradorMatricula, setTargetColaboradorMatricula] = useState<string>(userMatricula);
  const [dataISO, setDataISO] = useState<string>(new Date().toISOString().split('T')[0]);
  const [hora, setHora] = useState<string>('08:00');
  const [tipo, setTipo] = useState<RegistroDiarioBordo['tipo']>('Demanda do Dia');
  const [prioridade, setPrioridade] = useState<RegistroDiarioBordo['prioridade']>('Média');
  const [titulo, setTitulo] = useState<string>('');
  const [descricao, setDescricao] = useState<string>('');
  const [setorOuProcesso, setSetorOuProcesso] = useState<string>('Operação / Pátio');
  const [temLembrete, setTemLembrete] = useState<boolean>(false);
  const [dataLembreteISO, setDataLembreteISO] = useState<string>(new Date().toISOString().split('T')[0]);
  const [horaLembrete, setHoraLembrete] = useState<string>('16:00');
  const [status, setStatus] = useState<RegistroDiarioBordo['status']>('Pendente');

  // Sincronização com o Repository / Hybrid Database Router
  useEffect(() => {
    const fetchDiarioFirestore = async () => {
      try {
        const list = await DiarioBordoRepository.getAll(empresaId);
        if (list && list.length > 0) {
          list.sort((a, b) => new Date(b.criadoEm || b.dataISO).getTime() - new Date(a.criadoEm || a.dataISO).getTime());
          setRegistros(list);
          localStorage.setItem(`diario_bordo_master_list_${empresaId}`, JSON.stringify(list));
        }
      } catch (err) {
        console.warn('Diario Bordo Repository fetch error:', err);
      }
    };

    fetchDiarioFirestore();
  }, [empresaId]);

  const saveDiarioStorageAndFirestore = async (newList: RegistroDiarioBordo[], itemToSave?: RegistroDiarioBordo, deleteId?: string) => {
    setRegistros(newList);
    localStorage.setItem(`diario_bordo_master_list_${empresaId}`, JSON.stringify(newList));

    try {
      if (itemToSave) {
        await DiarioBordoRepository.create(itemToSave, empresaId, itemToSave.id);
      }
      if (deleteId) {
        await DiarioBordoRepository.delete(deleteId, empresaId);
      }
    } catch (err) {
      console.warn('Diario Bordo Repository write error:', err);
    }
  };

  // Abrir modal para Nova Demanda do Dia / Registro
  const handleOpenModal = (colabMatriculaPreset?: string) => {
    setEditingId(null);
    setFormError(null);
    setTargetColaboradorMatricula(colabMatriculaPreset || (colaboradorSelecionadoMatricula !== 'todos' ? colaboradorSelecionadoMatricula : userMatricula));
    setDataISO(new Date().toISOString().split('T')[0]);
    setHora('08:00');
    setTipo('Demanda do Dia');
    setPrioridade('Média');
    setTitulo('');
    setDescricao('');
    setSetorOuProcesso('Operação / Pátio');
    setTemLembrete(false);
    setDataLembreteISO(new Date().toISOString().split('T')[0]);
    setHoraLembrete('16:00');
    setStatus('Pendente');
    setShowModal(true);
  };

  // Abrir modal para Editar
  const handleEditRecord = (r: RegistroDiarioBordo) => {
    setEditingId(r.id);
    setFormError(null);
    // Tenta encontrar matrícula do responsável pelo nome
    const targetColab = listaColaboradoresParaFiltro.find(c => c.nome.toLowerCase() === r.usuarioNome.toLowerCase() || c.matricula === r.usuarioMatricula);
    setTargetColaboradorMatricula(targetColab?.matricula || r.usuarioMatricula || userMatricula);
    setDataISO(r.dataISO);
    setHora(r.hora);
    setTipo(r.tipo);
    setPrioridade(r.prioridade || 'Média');
    setTitulo(r.titulo);
    setDescricao(r.descricao);
    setSetorOuProcesso(r.setorOuProcesso);
    setTemLembrete(r.temLembrete);
    setDataLembreteISO(r.dataLembreteISO || r.dataISO);
    setHoraLembrete(r.horaLembrete || '16:00');
    setStatus(r.status);
    setShowModal(true);
  };

  // Solicitar Exclusão Não-Bloqueante
  const handleRequestDelete = (r: RegistroDiarioBordo) => {
    setDeleteTarget({ id: r.id, titulo: r.titulo });
  };

  // Confirmar Exclusão
  const handleConfirmDelete = async () => {
    if (!deleteTarget || isDeleting) return;
    setIsDeleting(true);
    try {
      const id = deleteTarget.id;
      const updated = registros.filter(r => r.id !== id);
      await saveDiarioStorageAndFirestore(updated, undefined, id);
      showToast('Demanda excluída com sucesso!');
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // Alternar Status Rápido (Pendente -> Em Andamento -> Concluído)
  const handleCycleStatus = (r: RegistroDiarioBordo) => {
    const statusMap: Record<RegistroDiarioBordo['status'], RegistroDiarioBordo['status']> = {
      'Pendente': 'Em Andamento',
      'Em Andamento': 'Concluído',
      'Concluído': 'Pendente',
      'Cancelado': 'Pendente'
    };
    const nextStatus = statusMap[r.status] || 'Concluído';
    const updatedRecord: RegistroDiarioBordo = { ...r, status: nextStatus };
    const updatedList = registros.map(item => item.id === r.id ? updatedRecord : item);
    saveDiarioStorageAndFirestore(updatedList, updatedRecord);
    showToast(`Status da demanda atualizado para "${nextStatus}"!`);
  };

  // Salvar formulário com proteção contra duplo clique
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) {
      setFormError('Por favor, informe o título da demanda do dia.');
      return;
    }
    if (isSaving) return;

    setIsSaving(true);
    setFormError(null);

    try {
      const parts = dataISO.split('-');
      const dataFormatted = `${parts[2]}/${parts[1]}/${parts[0]}`;

      // Encontra informações do colaborador alvo selecionado no formulário
      const colabAlvo = listaColaboradoresParaFiltro.find(c => c.matricula === targetColaboradorMatricula) || {
        nome: userNome,
        cargo: userCargo,
        matricula: userMatricula
      };

      const idToUse = editingId || `diario-${Date.now()}`;
      const newRecord: RegistroDiarioBordo = {
        id: idToUse,
        usuarioEmail: colabAlvo.matricula === userMatricula ? userEmail : `${colabAlvo.matricula.toLowerCase()}@ambev.com.br`,
        usuarioNome: colabAlvo.nome,
        usuarioCargo: colabAlvo.cargo,
        usuarioMatricula: colabAlvo.matricula,
        dataISO,
        dataFormatted,
        hora: hora || '08:00',
        tipo,
        prioridade,
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        setorOuProcesso: setorOuProcesso.trim() || 'Operação',
        temLembrete,
        dataLembreteISO: temLembrete ? dataLembreteISO : undefined,
        horaLembrete: temLembrete ? horaLembrete : undefined,
        status,
        criadoPor: userNome,
        criadoEm: new Date().toISOString()
      };

      let updatedList: RegistroDiarioBordo[];
      if (editingId) {
        updatedList = registros.map(item => item.id === editingId ? newRecord : item);
      } else {
        updatedList = [newRecord, ...registros];
      }

      updatedList.sort((a, b) => new Date(b.criadoEm || b.dataISO).getTime() - new Date(a.criadoEm || a.dataISO).getTime());
      await saveDiarioStorageAndFirestore(updatedList, newRecord);

      setShowModal(false);
      showToast(editingId ? 'Demanda atualizada com sucesso!' : `Nova demanda registrada para ${colabAlvo.nome}!`);
    } catch (err) {
      console.error('Erro ao salvar demanda:', err);
      showToast('Erro ao salvar demanda. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  // Filtragem dos registros conforme o modo de visão e seletores
  const registrosFiltrados = useMemo(() => {
    return registros.filter(r => {
      // 1. Visão Individual vs Administrativa
      if (visaoModo === 'individual') {
        const uNome = (userNome || '').toLowerCase().trim();
        const rNome = (r.usuarioNome || '').toLowerCase().trim();
        const uMat = (userMatricula || '').toLowerCase().trim();
        const rMat = (r.usuarioMatricula || '').toLowerCase().trim();
        
        const isMyRecord = rNome === uNome || rMat === uMat || r.usuarioEmail === userEmail;
        if (!isMyRecord) return false;
      } else {
        // Visão Administrativa: Filtro por colaborador específico
        if (colaboradorSelecionadoMatricula !== 'todos') {
          const colabAlvo = listaColaboradoresParaFiltro.find(c => c.matricula === colaboradorSelecionadoMatricula);
          if (colabAlvo) {
            const isTarget = (r.usuarioMatricula && r.usuarioMatricula === colabAlvo.matricula) || 
                             (r.usuarioNome && r.usuarioNome.toLowerCase() === colabAlvo.nome.toLowerCase());
            if (!isTarget) return false;
          }
        }
      }

      // 2. Filtro de Grupo de Função (Administrativo, Ajudantes, Empilhadores, Operadores/Conferentes)
      if (funcaoFiltro !== 'todos') {
        const colab = listaColaboradoresParaFiltro.find(c => c.nome.toLowerCase() === r.usuarioNome.toLowerCase() || c.matricula === r.usuarioMatricula);
        if (funcaoFiltro === 'Administrativo') {
          const isAdm = (colab?.cargo || r.usuarioCargo || '').toUpperCase().includes('ADMINISTRATIVO') || 
                        (colab?.matricula || r.usuarioMatricula) === 'G1073';
          if (!isAdm) return false;
        } else if (colab && colab.funcaoGroup !== funcaoFiltro) {
          return false;
        }
      }

      // 3. Filtro de Tipo de Registro
      if (tipoFiltro !== 'todos' && r.tipo !== tipoFiltro) return false;

      // 4. Filtro de Status
      if (statusFiltro !== 'todos' && r.status !== statusFiltro) return false;

      // 5. Pesquisa textual
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match = r.titulo.toLowerCase().includes(q) || 
                      r.descricao.toLowerCase().includes(q) || 
                      r.usuarioNome.toLowerCase().includes(q) || 
                      r.setorOuProcesso.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [registros, visaoModo, userNome, userMatricula, userEmail, colaboradorSelecionadoMatricula, listaColaboradoresParaFiltro, funcaoFiltro, tipoFiltro, statusFiltro, searchQuery]);

  // Cálculos das Métricas
  const totalDemandasExibidas = registrosFiltrados.length;
  const countConcluidas = registrosFiltrados.filter(r => r.status === 'Concluído').length;
  const countEmAndamento = registrosFiltrados.filter(r => r.status === 'Em Andamento').length;
  const countPendentes = registrosFiltrados.filter(r => r.status === 'Pendente').length;

  const taxaConclusaoPct = totalDemandasExibidas > 0 
    ? Math.round((countConcluidas / totalDemandasExibidas) * 100) 
    : 0;

  // Lembretes ativos hoje
  const todayISO = new Date().toISOString().split('T')[0];
  const activeReminders = registrosFiltrados.filter(r => 
    r.temLembrete && 
    r.status !== 'Concluído' && 
    r.dataLembreteISO && 
    r.dataLembreteISO <= todayISO
  );

  return (
    <div className="space-y-6">
      
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-amber-500 text-slate-950 font-black px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-amber-300 animate-bounce">
          <Sparkles className="w-5 h-5 text-slate-900" />
          <span className="text-xs">{toastMessage}</span>
        </div>
      )}

      {/* 🚀 CABEÇALHO PRINCIPAL DO DIÁRIO DE BORDO */}
      <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-slate-50 dark:from-[#111a30] dark:via-[#111a30] dark:to-[#0f172a] border border-slate-200 dark:border-amber-500/30 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-3 bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-600 dark:text-amber-400 shrink-0">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                ETAPA 4 — DIÁRIO DE BORDO
              </span>
              <span className="text-[10px] text-slate-600 dark:text-slate-300 font-mono">
                {visaoModo === 'individual' ? `Diário Pessoal (${userNome})` : 'Visão Administrativa Consolidada'}
              </span>
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white mt-1 uppercase tracking-tight flex items-center gap-2">
              Diário de Bordo de Demandas do Dia & Acompanhamento
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug max-w-2xl">
              Cadastre, edite e acompanhe as demandas do dia para cada colaborador operacional (Ajudantes, Operadores de Empilhadeira e Conferentes). Visão administrativa integrada com seletor por colaborador.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              const assigned = getUserAssignedAreasList(user, userNome);
              if (assigned.length > 0) setSelectedSetor5S(assigned[0]);
              setShowModal5S(true);
            }}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg flex items-center gap-2 shrink-0 border border-emerald-300/40"
            title="Realizar auditoria 5S oficial do colaborador"
          >
            <Sparkles className="w-4 h-4 text-slate-950 animate-spin" /> Fazer 5S do Colaborador
          </button>

          <button
            type="button"
            onClick={() => handleOpenModal()}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" /> Nova Demanda do Dia
          </button>
        </div>
      </div>

      {/* PAINEL DE ALTERNÂNCIA DE VISÃO: MINHAS DEMANDAS (OPERACIONAL) VS VISÃO ADMINISTRATIVA (TODOS OS COLABORADORES) */}
      <div className="bg-white dark:bg-[#111a30] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-4 shadow-lg">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          
          {/* MODO DE VISÃO & SUB-ABAS (DEMANDAS VS 5S) */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#0b1222] p-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setVisaoModo('individual');
                  setColaboradorSelecionadoMatricula('todos');
                }}
                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                  visaoModo === 'individual' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <User className="w-4 h-4" /> Meu Diário (Operacional)
              </button>

              <button
                type="button"
                onClick={() => setVisaoModo('administrativa')}
                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                  visaoModo === 'administrativa' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Users className="w-4 h-4" /> Visão Administrativa (Todos)
              </button>
            </div>

            {/* TOGGLE ENTRE DEMANDAS & HISTÓRICO 5S */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#0b1222] p-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setActiveDiarioTab('demandas')}
                className={`px-3 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeDiarioTab === 'demandas'
                    ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <BookOpen className="w-4 h-4" /> Demandas & Tarefas
              </button>

              <button
                type="button"
                onClick={() => setActiveDiarioTab('5s')}
                className={`px-3 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeDiarioTab === '5s'
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-md border border-emerald-300'
                    : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10'
                }`}
              >
                <Sparkles className="w-4 h-4" /> Quadro & Histórico 5S
              </button>
            </div>
          </div>

          {/* SELETOR DE COLABORADOR NA VISÃO ADMINISTRATIVA */}
          {visaoModo === 'administrativa' && (
            <div className="flex flex-col gap-2 w-full md:w-auto">
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-[#0b1222] p-2 rounded-xl border border-blue-300 dark:border-blue-500/30 w-full">
                <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <div className="flex-1">
                  <span className="text-[9px] font-black uppercase text-blue-600 dark:text-blue-400 block">Seletor de Colaborador:</span>
                  <select
                    value={colaboradorSelecionadoMatricula}
                    onChange={(e) => setColaboradorSelecionadoMatricula(e.target.value)}
                    className="bg-transparent text-xs font-black text-slate-900 dark:text-white outline-none cursor-pointer w-full"
                  >
                    <option value="todos" className="bg-white dark:bg-[#111a30] text-slate-900 dark:text-white">📋 Todos os Colaboradores (Consolidado)</option>
                    <optgroup label="Administrativo & Controle" className="bg-white dark:bg-[#111a30] text-cyan-600 dark:text-cyan-400">
                      {listaColaboradoresParaFiltro.filter(c => (c.cargo || '').toUpperCase().includes('ADMINISTRATIVO') || c.matricula === 'G1073').map(c => (
                        <option key={c.matricula} value={c.matricula} className="bg-white dark:bg-[#111a30] text-slate-900 dark:text-white">
                          [{c.matricula}] {c.nome} - {c.cargo} (5S Responsável)
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Ajudantes de Armazém" className="bg-white dark:bg-[#111a30] text-amber-600 dark:text-amber-400">
                      {listaColaboradoresParaFiltro.filter(c => c.funcaoGroup === 'Ajudante' && !(c.cargo || '').toUpperCase().includes('ADMINISTRATIVO')).map(c => (
                        <option key={c.matricula} value={c.matricula} className="bg-white dark:bg-[#111a30] text-slate-900 dark:text-white">
                          [{c.matricula}] {c.nome} - {c.cargo}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Operadores de Empilhadeira" className="bg-white dark:bg-[#111a30] text-purple-600 dark:text-purple-400">
                      {listaColaboradoresParaFiltro.filter(c => c.funcaoGroup === 'Empilhador' && !(c.cargo || '').toUpperCase().includes('ADMINISTRATIVO')).map(c => (
                        <option key={c.matricula} value={c.matricula} className="bg-white dark:bg-[#111a30] text-slate-900 dark:text-white">
                          [{c.matricula}] {c.nome} - {c.cargo}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Operadores & Conferentes" className="bg-white dark:bg-[#111a30] text-emerald-600 dark:text-emerald-400">
                      {listaColaboradoresParaFiltro.filter(c => c.funcaoGroup === 'Operador' && !(c.cargo || '').toUpperCase().includes('ADMINISTRATIVO') && c.matricula !== 'G1073').map(c => (
                        <option key={c.matricula} value={c.matricula} className="bg-white dark:bg-[#111a30] text-slate-900 dark:text-white">
                          [{c.matricula}] {c.nome} - {c.cargo}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {colaboradorSelecionadoMatricula !== 'todos' && (
                  <button
                    type="button"
                    onClick={() => handleOpenModal(colaboradorSelecionadoMatricula)}
                    className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase rounded-lg cursor-pointer shrink-0"
                    title="Atribuir demanda para este colaborador"
                  >
                    + Demanda
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ATALHOS RÁPIDOS DOS COLABORADORES NA VISÃO ADMINISTRATIVA */}
        {visaoModo === 'administrativa' && (
          <div className="pt-1 space-y-1.5 border-t border-slate-200 dark:border-slate-800/60">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Atalhos de Acesso Direto aos Diários de Bordo dos Colaboradores:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              <button
                type="button"
                onClick={() => setColaboradorSelecionadoMatricula('todos')}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shrink-0 flex items-center gap-1 border ${
                  colaboradorSelecionadoMatricula === 'todos' 
                    ? 'bg-blue-600 text-white border-blue-400 shadow-md' 
                    : 'bg-slate-100 dark:bg-[#0b1222] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                📋 Todos ({registros.length})
              </button>

              {listaColaboradoresParaFiltro.map(colab => {
                const countColab = registros.filter(r => 
                  (r.usuarioMatricula && r.usuarioMatricula === colab.matricula) || 
                  (r.usuarioNome && r.usuarioNome.toLowerCase() === colab.nome.toLowerCase())
                ).length;
                const isSelected = colaboradorSelecionadoMatricula === colab.matricula;

                return (
                  <button
                    key={colab.matricula}
                    type="button"
                    onClick={() => setColaboradorSelecionadoMatricula(colab.matricula)}
                    className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 border ${
                      isSelected 
                        ? 'bg-amber-500 text-slate-950 font-black border-amber-300 shadow-md' 
                        : 'bg-slate-100 dark:bg-[#0b1222] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-amber-500/40'
                    }`}
                  >
                    <User className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                    <span>{colab.nome.split(' ')[0]} ({colab.matricula})</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-[9px] font-mono text-amber-700 dark:text-amber-300">
                      {countColab}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* CONTROLES DE FILTROS ADICIONAIS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">Grupo de Função</label>
            <select
              value={funcaoFiltro}
              onChange={(e) => setFuncaoFiltro(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#0b1222] border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-amber-400"
            >
              <option value="todos">Todas as Funções</option>
              <option value="Administrativo">Administrativo & Controle</option>
              <option value="Ajudante">Ajudantes de Armazém</option>
              <option value="Empilhador">Operadores de Empilhadeira</option>
              <option value="Operador">Conferentes & Operação</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">Tipo de Registro</label>
            <select
              value={tipoFiltro}
              onChange={(e) => setTipoFiltro(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#0b1222] border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-amber-400"
            >
              <option value="todos">Todos os Tipos</option>
              <option value="Demanda do Dia">Demandas do Dia</option>
              <option value="Atividade Diária">Atividades Diárias</option>
              <option value="Compromisso">Compromissos</option>
              <option value="Treinamento Realizado">Treinamentos Realizados</option>
              <option value="Treinamento Agendado">Treinamentos Agendados</option>
              <option value="Anotação / Lembrete">Anotações & Lembretes</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">Status da Demanda</label>
            <select
              value={statusFiltro}
              onChange={(e) => setStatusFiltro(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#0b1222] border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-amber-400"
            >
              <option value="todos">Todos os Status</option>
              <option value="Pendente">Pendente</option>
              <option value="Em Andamento">Em Andamento</option>
              <option value="Concluído">Concluído</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">Pesquisar Demanda</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por título, colaborador..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#0b1222] border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-amber-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* METRICAS DE ACOMPANHAMENTO DAS DEMANDAS DO DIA */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-[#111a30] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 block">Total de Demandas</span>
            <strong className="text-2xl font-mono font-black text-amber-600 dark:text-amber-400">{totalDemandasExibidas}</strong>
          </div>
          <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-600 dark:text-amber-400">
            <ClipboardCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#111a30] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 block">Demandas Concluídas</span>
            <strong className="text-2xl font-mono font-black text-emerald-600 dark:text-emerald-400">{countConcluidas}</strong>
          </div>
          <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#111a30] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 block">Em Andamento / Pendentes</span>
            <strong className="text-2xl font-mono font-black text-sky-600 dark:text-sky-400">{countEmAndamento + countPendentes}</strong>
          </div>
          <div className="p-2.5 bg-sky-500/10 rounded-xl text-sky-600 dark:text-sky-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#111a30] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 block">Taxa de Conclusão</span>
            <strong className="text-2xl font-mono font-black text-purple-600 dark:text-purple-400">{taxaConclusaoPct}%</strong>
          </div>
          <div className="p-2.5 bg-purple-500/10 rounded-xl text-purple-600 dark:text-purple-400">
            <BarChart2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ALERTAS / LEMBRETES ATIVOS */}
      {activeReminders.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/80 border-2 border-amber-500 rounded-2xl p-4 space-y-3 shadow-2xl">
          <div className="flex items-center justify-between border-b border-amber-500/40 pb-2">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-600 dark:text-amber-300 animate-bounce" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                🔔 Lembretes de Demandas Ativos ({activeReminders.length})
              </h3>
            </div>
            <span className="text-[10px] font-mono text-amber-700 dark:text-amber-200">Alertas de Pauta e Prazo do Dia</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeReminders.map(rem => (
              <div key={rem.id} className="p-3 bg-white dark:bg-[#0b1222] border border-amber-500/50 rounded-xl flex items-center justify-between gap-3 shadow-sm">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-black text-amber-700 dark:text-amber-400">
                      ⏰ {rem.horaLembrete || rem.hora} ({rem.dataLembreteISO?.split('-').reverse().join('/')})
                    </span>
                    <span className="text-[9px] bg-amber-500/20 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded uppercase font-bold">
                      {rem.usuarioNome}
                    </span>
                  </div>
                  <strong className="text-xs text-slate-900 dark:text-white uppercase block">{rem.titulo}</strong>
                </div>

                <button
                  type="button"
                  onClick={() => handleCycleStatus(rem)}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black uppercase rounded-lg cursor-pointer shrink-0 shadow"
                >
                  Concluir
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VISÃO CONDICIONAL: DEMANDAS DO DIÁRIO VS QUADRO & HISTÓRICO 5S */}
      {activeDiarioTab === '5s' ? (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-[#0d2218] dark:to-[#0f172a] p-4 rounded-2xl border border-emerald-300 dark:border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white flex items-center gap-2">
                  Quadro de 5S do Colaborador no Diário de Bordo
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {visaoModo === 'individual' 
                    ? `Acompanhe seu histórico de auditorias e realize o 5S do seu setor (${userNome}).` 
                    : colaboradorSelecionadoMatricula !== 'todos'
                      ? `Histórico de 5S de ${listaColaboradoresParaFiltro.find(c => c.matricula === colaboradorSelecionadoMatricula)?.nome}.`
                      : 'Consolidado oficial de auditorias 5S de todos os colaboradores do quadro.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const targetColab = colaboradorSelecionadoMatricula !== 'todos' 
                  ? listaColaboradoresParaFiltro.find(c => c.matricula === colaboradorSelecionadoMatricula) 
                  : user;
                const assigned = getUserAssignedAreasList(targetColab, targetColab?.nome);
                if (assigned.length > 0) setSelectedSetor5S(assigned[0]);
                setShowModal5S(true);
              }}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg flex items-center gap-2 shrink-0"
            >
              <Sparkles className="w-4 h-4" /> Novo Formulário 5S
            </button>
          </div>

          <Collaborator5SPerformanceCard
            user={colaboradorSelecionadoMatricula !== 'todos' ? listaColaboradoresParaFiltro.find(c => c.matricula === colaboradorSelecionadoMatricula) : user}
            userNombre={colaboradorSelecionadoMatricula !== 'todos' ? listaColaboradoresParaFiltro.find(c => c.matricula === colaboradorSelecionadoMatricula)?.nome : userNome}
            onSelectSector={(sec) => {
              setSelectedSetor5S(sec);
              setShowModal5S(true);
            }}
          />
        </div>
      ) : (
        <div className="bg-white dark:bg-[#111a30] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              {visaoModo === 'individual' ? `Minhas Demandas (${registrosFiltrados.length})` : 
               colaboradorSelecionadoMatricula !== 'todos' ? `Demandas de ${listaColaboradoresParaFiltro.find(c => c.matricula === colaboradorSelecionadoMatricula)?.nome} (${registrosFiltrados.length})` :
               `Demandas de Todos os Colaboradores (${registrosFiltrados.length})`}
            </h3>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
              {new Date().toLocaleDateString('pt-BR')}
            </span>
          </div>

          {registrosFiltrados.length > 0 ? (
            <div className="space-y-3">
              {registrosFiltrados.map((r) => {
                const isConcluido = r.status === 'Concluído';
                const isEmAndamento = r.status === 'Em Andamento';

                return (
                  <div 
                    key={r.id} 
                    className={`p-4 rounded-2xl border transition-all space-y-3 relative shadow-sm ${
                      isConcluido 
                        ? 'bg-slate-50 dark:bg-[#080d1a] border-slate-200 dark:border-slate-800 opacity-90 dark:opacity-80' 
                        : isEmAndamento 
                          ? 'bg-blue-50/60 dark:bg-[#0d1b2a] border-blue-200 dark:border-blue-500/40' 
                          : 'bg-slate-50/70 dark:bg-[#0e172a] border-slate-200 dark:border-slate-700 hover:border-amber-500/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* TAG DO STATUS DA DEMANDA */}
                          <button
                            type="button"
                            onClick={() => handleCycleStatus(r)}
                            className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded cursor-pointer transition-all ${
                              isConcluido ? 'bg-emerald-600 text-white' :
                              isEmAndamento ? 'bg-sky-500 text-slate-950 font-black animate-pulse' :
                              'bg-amber-500 text-slate-950 font-black'
                            }`}
                            title="Clique para mudar o status da demanda"
                          >
                            {r.status}
                          </button>

                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                            r.prioridade === 'Alta' ? 'bg-rose-600 text-white' :
                            r.prioridade === 'Média' ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30' :
                            'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                          }`}>
                            Prioridade {r.prioridade || 'Média'}
                          </span>

                          <span className="text-xs font-mono font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            {r.dataFormatted} às {r.hora}
                          </span>

                          <span className="text-[10px] font-mono text-purple-700 dark:text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                            {r.tipo}
                          </span>
                        </div>

                        <h4 className={`text-sm font-black uppercase ${isConcluido ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                          {r.titulo}
                        </h4>
                      </div>

                      {/* BOTAO ALTERAÇÃO DE STATUS RAPIDA */}
                      <button
                        type="button"
                        onClick={() => handleCycleStatus(r)}
                        className={`p-2 rounded-xl transition-all cursor-pointer shrink-0 flex items-center gap-1 text-xs font-bold shadow-sm ${
                          isConcluido ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-600 hover:text-white'
                        }`}
                        title="Mudar status (Pendente -> Em Andamento -> Concluído)"
                      >
                        <Check className="w-4 h-4" />
                        <span className="hidden sm:inline">{isConcluido ? 'Concluído' : 'Avançar Status'}</span>
                      </button>
                    </div>

                    {r.descricao && (
                      <p className="text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-[#080d1a] p-3 rounded-xl border border-slate-200 dark:border-slate-800 leading-relaxed">
                        "{r.descricao}"
                      </p>
                    )}

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800/80 gap-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                          <User className="w-3.5 h-3.5" /> {r.usuarioNome} ({r.usuarioCargo || 'Operacional'})
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 font-mono">Setor: {r.setorOuProcesso}</span>
                        {r.criadoPor && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">Criado por: {r.criadoPor}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => handleEditRecord(r)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400 cursor-pointer bg-slate-100 dark:bg-slate-800/60 rounded-lg"
                          title="Editar Demanda"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRequestDelete(r)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 cursor-pointer bg-slate-100 dark:bg-slate-800/60 rounded-lg transition-colors"
                          title="Excluir Demanda"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center space-y-2 bg-slate-50 dark:bg-[#0b1222] border border-slate-200 dark:border-slate-800 rounded-xl">
              <BookOpen className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto" />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Nenhuma demanda cadastrada para este filtro ou colaborador. Clique em "+ Nova Demanda do Dia" para registrar.
              </p>
            </div>
          )}
        </div>
      )}

      {/* MODAL FORMULARIO NOVO / EDITAR REGISTRO NO DIÁRIO DE BORDO */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <form onSubmit={handleSaveForm} className="bg-white dark:bg-[#111a30] border-2 border-amber-500/50 rounded-2xl p-6 w-full max-w-xl space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                {editingId ? 'Editar Demanda do Diário' : 'Nova Demanda do Dia'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/40 rounded-xl flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{formError}</span>
              </div>
            )}

            {/* SELEÇÃO DO COLABORADOR DESTINADO */}
            <div>
              <label className="block text-[10px] font-black uppercase text-amber-700 dark:text-amber-400 mb-1">Colaborador Destinado / Responsável *</label>
              <select
                value={targetColaboradorMatricula}
                onChange={(e) => setTargetColaboradorMatricula(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#0b1222] border border-amber-500/40 rounded-xl p-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-amber-400"
                required
              >
                {listaColaboradoresParaFiltro.map(c => (
                  <option key={c.matricula} value={c.matricula}>
                    [{c.matricula}] {c.nome} - {c.cargo} ({c.turno})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">Data *</label>
                <input
                  type="date"
                  value={dataISO}
                  onChange={(e) => setDataISO(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0b1222] border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-mono text-slate-900 dark:text-white outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">Horário Previsto *</label>
                <input
                  type="time"
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0b1222] border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-mono text-slate-900 dark:text-white outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">Tipo de Demanda</label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-[#0b1222] border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-amber-400"
                >
                  <option value="Demanda do Dia">Demanda do Dia</option>
                  <option value="Atividade Diária">Atividade Diária</option>
                  <option value="Compromisso">Compromisso</option>
                  <option value="Treinamento Realizado">Treinamento Realizado</option>
                  <option value="Treinamento Agendado">Treinamento Agendado</option>
                  <option value="Anotação / Lembrete">Anotação / Lembrete</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">Título da Demanda / Atividade *</label>
              <input
                type="text"
                placeholder="Ex: Conferência de Estoque e Organização de Lotes no Picking"
                value={titulo}
                onChange={(e) => {
                  setTitulo(e.target.value);
                  if (formError) setFormError(null);
                }}
                className="w-full bg-slate-50 dark:bg-[#0b1222] border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-amber-400"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">Prioridade</label>
                <select
                  value={prioridade}
                  onChange={(e) => setPrioridade(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-[#0b1222] border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-amber-400"
                >
                  <option value="Alta">Alta</option>
                  <option value="Média">Média</option>
                  <option value="Baixa">Baixa</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">Setor / Processo</label>
                <input
                  type="text"
                  value={setorOuProcesso}
                  onChange={(e) => setSetorOuProcesso(e.target.value)}
                  placeholder="Ex: Repack, Picking, EFC/EFD"
                  className="w-full bg-slate-50 dark:bg-[#0b1222] border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs text-slate-900 dark:text-white outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">Status Inicial</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-[#0b1222] border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-amber-400"
                >
                  <option value="Pendente">Pendente</option>
                  <option value="Em Andamento">Em Andamento</option>
                  <option value="Concluído">Concluído</option>
                </select>
              </div>
            </div>

            {/* CONFIGURAÇÃO DE LEMBRETE */}
            <div className="p-3 bg-slate-50 dark:bg-[#0b1222] border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={temLembrete}
                  onChange={(e) => setTemLembrete(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
                <span className="text-xs font-black uppercase text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <Bell className="w-4 h-4" /> Configurar Lembrete Automático para Esta Demanda
                </span>
              </label>

              {temLembrete && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">Data do Lembrete</label>
                    <input
                      type="date"
                      value={dataLembreteISO}
                      onChange={(e) => setDataLembreteISO(e.target.value)}
                      className="w-full bg-white dark:bg-[#111a30] border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-mono text-slate-900 dark:text-white outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">Hora do Lembrete</label>
                    <input
                      type="time"
                      value={horaLembrete}
                      onChange={(e) => setHoraLembrete(e.target.value)}
                      className="w-full bg-white dark:bg-[#111a30] border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-mono text-slate-900 dark:text-white outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1">Descrição / Instruções da Demanda</label>
              <textarea
                rows={3}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Detalhes das tarefas a serem executadas, metas de caixas/hora, procedimentos de segurança..."
                className="w-full bg-slate-50 dark:bg-[#0b1222] border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:border-amber-400 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold uppercase cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black rounded-xl text-xs uppercase shadow-lg cursor-pointer flex items-center gap-2 transition-all"
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSaving ? 'Salvando...' : 'Salvar Demanda'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO NÃO-BLOQUEANTE DE EXCLUSÃO */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#111a30] border-2 border-rose-500/50 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-2.5 bg-rose-100 dark:bg-rose-500/20 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-black uppercase text-slate-900 dark:text-white">Excluir Demanda</h4>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Esta ação não pode ser desfeita</span>
              </div>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              Tem certeza de que deseja remover a demanda <strong className="text-slate-900 dark:text-white">"{deleteTarget.titulo}"</strong> do Diário de Bordo?
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold uppercase cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black rounded-xl text-xs uppercase shadow-lg cursor-pointer flex items-center gap-2"
              >
                {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isDeleting ? 'Excluindo...' : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL OFICIAL DE AUDITORIA 5S */}
      {showModal5S && (
        <Checklist5SModal
          isOpen={showModal5S}
          onClose={() => setShowModal5S(false)}
          defaultSetor={selectedSetor5S}
          user={colaboradorSelecionadoMatricula !== 'todos' ? listaColaboradoresParaFiltro.find(c => c.matricula === colaboradorSelecionadoMatricula) : user}
          onSaveSuccess={() => {
            setShowModal5S(false);
            showToast('✅ Auditoria 5S registrada e sincronizada com sucesso!');
          }}
        />
      )}
    </div>
  );
};
