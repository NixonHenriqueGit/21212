import React, { useState, useEffect, useMemo } from 'react';
import { Usuario } from '../types';
import { Search, AlertTriangle, Clock, CheckCircle2, Play, MessageSquare, Send, ShieldCheck, FilterX, Trash2, Sparkles, Check } from 'lucide-react';
import { db } from '../firebase';
import { getAcoesAll, cleanAllAutomaticActionsFromStorage, AcaoCorretiva } from '../utils/simulacaoAcoesUtils';

export interface ActionItem {
  id: string;
  titulo?: string;
  indicador?: string;
  desvioEncontrado?: string;
  descricao?: string;
  processo?: string;
  responsavel?: string;
  colaboradorId?: string;
  colaboradorNome?: string;
  criadoEm?: string;
  prazo?: string;
  limiteEm?: string;
  status: 'pendente' | 'em_andamento' | 'concluido' | 'Pendente' | 'Em Andamento' | 'Concluído';
  contramedida?: string;
  parecerColaborador?: string;
  resolvidaEm?: string;
  tipo?: string;
  origem?: string;
}

interface GuiaAcoesOperacionaisProps {
  user: Usuario;
  roleName: 'Ajudante' | 'Operador de Empilhadeira' | 'Conferente' | string;
}

export const GuiaAcoesOperacionais: React.FC<GuiaAcoesOperacionaisProps> = ({ user, roleName }) => {
  const [activeStatusTab, setActiveStatusTab] = useState<'pendentes' | 'andamento' | 'concluidas'>('pendentes');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionsList, setActionsList] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentsMap, setCommentsMap] = useState<Record<string, string>>({});
  const [showFeedbackCleaned, setShowFeedbackCleaned] = useState(false);

  // Fetch actions for user & role from Dashboards, Governança, Firestore and LocalStorage (PURGING AUTOMATIC ONES)
  const loadActions = async () => {
    setLoading(true);
    let loaded: ActionItem[] = [];

    // 1. Clean automatic mock/spam actions from storage
    cleanAllAutomaticActionsFromStorage();

    // 2. Fetch actions from Global Governance & Dashboards (simulacaoAcoesUtils)
    try {
      const globalAcoes = getAcoesAll();
      globalAcoes.forEach(item => {
        const idStr = String(item.id || '');
        const isAuto = idStr.startsWith('auto-') || idStr.startsWith('acao-2026-') || idStr.startsWith('acao-auto-') || idStr.startsWith('melhoria-auto-') || item.simulado;
        if (!isAuto) {
          loaded.push({
            id: String(item.id),
            titulo: item.indicador || item.desvioEncontrado || 'Ação de Governança',
            indicador: item.indicador || item.processo,
            desvioEncontrado: item.desvioEncontrado,
            descricao: item.contramedida || item.causaRaizDetalhe || item.desvioEncontrado || 'Tratativa de plano de ação.',
            processo: item.processo || roleName,
            responsavel: item.colaboradorResponsavel || item.responsavelTratativa || user.nome,
            colaboradorNome: item.colaboradorResponsavel,
            criadoEm: item.criadoEm || item.dataISO || new Date().toISOString(),
            prazo: item.prazo || 'Prazo 7 Dias',
            status: item.status === 'Concluído' ? 'concluido' : item.status === 'Em Andamento' ? 'em_andamento' : 'pendente',
            contramedida: item.contramedida,
            parecerColaborador: item.comentarioOperador,
            resolvidaEm: item.status === 'Concluído' ? (item.dataFechamento || item.prazo) : undefined,
            origem: 'dashboard_governanca'
          });
        }
      });
    } catch (e) {
      console.warn("Error reading global dashboard actions:", e);
    }

    // 3. Try fetching from Firestore (real human actions created in UI)
    try {
      const { collection, getDocs } = await import('firebase/firestore');
      const snap = await getDocs(collection(db, 'acoes'));
      if (!snap.empty) {
        snap.docs.forEach(doc => {
          const data = doc.data();
          const docId = String(doc.id || '');
          const isAutoDoc = docId.startsWith('auto-') || docId.startsWith('acao-2026-') || data.isAutomatica || data.origem === 'automatica' || data.simulado;
          if (!isAutoDoc && !loaded.some(a => a.id === docId)) {
            loaded.push({
              id: docId,
              titulo: data.titulo || data.indicador || data.desvioEncontrado || 'Ação Operacional',
              indicador: data.indicador || data.processo || 'Operação',
              desvioEncontrado: data.desvioEncontrado || data.descricao,
              descricao: data.descricao || data.contramedida || 'Acompanhar alinhamento operacional.',
              processo: data.processo || roleName,
              responsavel: data.responsavel || data.colaboradorNome || data.colaboradorResponsavel || user.nome,
              colaboradorId: data.colaboradorId,
              colaboradorNome: data.colaboradorNome || data.colaborador || data.colaboradorResponsavel,
              criadoEm: data.criadoEm || new Date().toISOString(),
              prazo: data.prazo || data.limiteEm || 'Prazo Padrão 7 Dias',
              limiteEm: data.limiteEm,
              status: data.status || 'pendente',
              contramedida: data.contramedida,
              parecerColaborador: data.parecerColaborador || data.comentario,
              resolvidaEm: data.resolvidaEm,
              origem: 'firestore'
            });
          }
        });
      }
    } catch (err) {
      console.warn("Firestore acoes fetch error (using fallback):", err);
    }

    // 4. LocalStorage Fallback (af_desvios_acoes_v2)
    try {
      const local = localStorage.getItem('af_desvios_acoes_v2');
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) {
          parsed.forEach((item: any) => {
            const itemId = String(item.id || '');
            const isAutoItem = itemId.startsWith('auto-') || itemId.startsWith('acao-2026-') || itemId.startsWith('acao-auto-') || itemId.startsWith('melhoria-auto-') || item.isAutomatica || item.origem === 'automatica' || item.tipo === 'automatica' || item.simulado;
            if (!isAutoItem && !loaded.some(a => a.id === itemId)) {
              loaded.push({
                id: itemId,
                titulo: item.indicador || item.desvioEncontrado || 'Tratativa Operacional',
                indicador: item.indicador || item.processo,
                desvioEncontrado: item.desvioEncontrado,
                descricao: item.contramedida || item.causaRaiz || 'Atendimento de ocorrência operacional.',
                processo: item.processo || roleName,
                responsavel: item.colaboradorResponsavel || item.responsavelTratativa || item.responsavel || user.nome,
                colaboradorNome: item.colaboradorResponsavel || item.colaboradorNome,
                criadoEm: item.dataCriacao || item.criadoEm || new Date().toISOString(),
                prazo: item.prazo || 'Prazo 7 Dias',
                status: item.status === 'Concluído' ? 'concluido' : item.status === 'Em Andamento' ? 'em_andamento' : 'pendente',
                contramedida: item.contramedida,
                parecerColaborador: item.observacao || item.parecerColaborador,
                resolvidaEm: item.dataConclusao || item.resolvidaEm,
                origem: 'dashboard_desvio'
              });
            }
          });
        }
      }
    } catch (e) {}

    // Remover estritamente qualquer ação puramente automática do sistema
    loaded = loaded.filter(a => {
      const idStr = String(a.id || '');
      return !idStr.startsWith('auto-') && 
             !idStr.startsWith('acao-2026-') && 
             !idStr.startsWith('acao-auto-') && 
             !idStr.startsWith('melhoria-auto-') &&
             !(a as any).isAutomatica &&
             !(a as any).simulado;
    });

    setActionsList(loaded);
    setLoading(false);
  };

  const handleClearAutomaticActions = () => {
    const res = cleanAllAutomaticActionsFromStorage();
    setShowFeedbackCleaned(true);
    setTimeout(() => setShowFeedbackCleaned(false), 4000);
    loadActions();
  };

  useEffect(() => {
    loadActions();

    const handleUpdate = () => loadActions();
    window.addEventListener('af_acoes_updated', handleUpdate);
    window.addEventListener('af_acoes_cleaned', handleUpdate);
    return () => {
      window.removeEventListener('af_acoes_updated', handleUpdate);
      window.removeEventListener('af_acoes_cleaned', handleUpdate);
    };
  }, [user.uid, roleName]);

  // Normalize status string
  const normalizeStatus = (statusStr: string): 'pendentes' | 'andamento' | 'concluidas' => {
    const s = (statusStr || '').toLowerCase();
    if (s.includes('conclu') || s.includes('fechad') || s.includes('resolv')) return 'concluidas';
    if (s.includes('andamento') || s.includes('tratativ') || s.includes('iniciad')) return 'andamento';
    return 'pendentes';
  };

  // Filter actions for current user & tab with ONLY search text input
  const filteredActions = useMemo(() => {
    const userClean = (user.nome || '').toLowerCase().trim();
    const roleClean = (roleName || '').toLowerCase().trim();

    return actionsList.filter(action => {
      // 1. Status match
      const currentTab = normalizeStatus(action.status);
      if (currentTab !== activeStatusTab) return false;

      // 2. User or Role relevance
      const respClean = (action.responsavel || '').toLowerCase();
      const colabClean = (action.colaboradorNome || '').toLowerCase();
      const procClean = (action.processo || '').toLowerCase();
      
      const isRelevant = 
        respClean.includes(userClean) || 
        colabClean.includes(userClean) || 
        procClean.includes(roleClean) ||
        respClean.includes('todos') ||
        respClean.includes(roleClean);

      if (!isRelevant) return false;

      // 3. Search term text filter ONLY
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase().trim();
      const title = (action.titulo || '').toLowerCase();
      const desc = (action.descricao || '').toLowerCase();
      const desvio = (action.desvioEncontrado || '').toLowerCase();
      const resp = (action.responsavel || '').toLowerCase();
      const proc = (action.processo || '').toLowerCase();

      return title.includes(term) || desc.includes(term) || desvio.includes(term) || resp.includes(term) || proc.includes(term);
    });
  }, [actionsList, activeStatusTab, user.nome, roleName, searchTerm]);

  // Action status updates
  const handleUpdateStatus = async (actionId: string, newStatus: 'em_andamento' | 'concluido', comment?: string) => {
    const dateNow = new Date().toISOString();
    const updated = actionsList.map(a => {
      if (a.id === actionId) {
        return {
          ...a,
          status: newStatus,
          parecerColaborador: comment || a.parecerColaborador || 'Atendimento iniciado pelo colaborador.',
          resolvidaEm: newStatus === 'concluido' ? dateNow : a.resolvidaEm
        };
      }
      return a;
    });

    setActionsList(updated);

    // Sync to Firestore
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'acoes', actionId), {
        status: newStatus === 'concluido' ? 'concluido' : 'em_andamento',
        parecerColaborador: comment || 'Atualizado via painel operacional',
        resolvidaEm: newStatus === 'concluido' ? dateNow : null
      });
    } catch (e) {
      console.warn("Could not sync action to Firestore:", e);
    }

    // Sync to LocalStorage
    try {
      localStorage.setItem('af_desvios_acoes_v2', JSON.stringify(updated));
    } catch (e) {}
  };

  const pendingCount = actionsList.filter(a => normalizeStatus(a.status) === 'pendentes').length;
  const inProgressCount = actionsList.filter(a => normalizeStatus(a.status) === 'andamento').length;
  const completedCount = actionsList.filter(a => normalizeStatus(a.status) === 'concluidas').length;

  return (
    <div className="space-y-4">
      {/* HEADER CARD */}
      <div className="p-4 bg-white dark:bg-gradient-to-r dark:from-[#0d1627] dark:via-[#111c33] dark:to-[#0d1627] border border-slate-200 dark:border-amber-500/30 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 dark:bg-amber-500/20 text-blue-600 dark:text-amber-400 rounded-xl border border-blue-200 dark:border-amber-500/30 shrink-0">
            <ShieldCheck className="w-6 h-6 text-blue-600 dark:text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-700 dark:text-amber-400 bg-blue-50 dark:bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-amber-500/20">
                GUIA DE AÇÕES - {roleName.toUpperCase()}
              </span>
            </div>
            <h3 className="text-sm md:text-base font-black text-slate-900 dark:text-white uppercase mt-1 tracking-tight">
              Ações Corretivas e de Melhoria
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-0.5">
              Consulte e acompanhe suas tratativas em andamento e concluídas com total simplicidade.
            </p>
          </div>
        </div>

        {/* SEARCH INPUT & ACTIONS */}
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <div className="relative min-w-[200px] sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Pesquisar ação..."
              className="w-full bg-slate-50 dark:bg-[#080e1a] border border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-amber-400 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs font-medium pl-9 pr-8 py-2 rounded-xl outline-none shadow-xs transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white p-0.5 rounded cursor-pointer"
              >
                <FilterX className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={handleClearAutomaticActions}
            title="Limpar ações automáticas antigas do sistema"
            className="px-3 py-2 bg-slate-100 hover:bg-rose-50 dark:bg-slate-800/80 dark:hover:bg-rose-900/40 text-slate-700 hover:text-rose-700 dark:text-slate-300 dark:hover:text-rose-200 border border-slate-200 hover:border-rose-300 dark:border-slate-700 dark:hover:border-rose-500/50 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
            <span>Limpar Automáticas</span>
          </button>
        </div>
      </div>

      {showFeedbackCleaned && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/60 rounded-xl flex items-center gap-2.5 text-emerald-800 dark:text-emerald-200 text-xs font-bold shadow-xs animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Ações automáticas e simuladas removidas com sucesso! Exibindo apenas ações direcionadas dos Dashboards e da Governança.</span>
        </div>
      )}

      {/* STATUS TABS - STRICTLY 3 TABS (PENDENTES, EM ANDAMENTO, CONCLUÍDA) */}
      <div className="grid grid-cols-3 gap-2 bg-slate-100 dark:bg-[#090f1c] p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setActiveStatusTab('pendentes')}
          className={`py-2.5 px-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeStatusTab === 'pendentes'
              ? 'bg-amber-500 text-slate-950 shadow-sm ring-2 ring-amber-400/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50'
          }`}
        >
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="truncate">Pendentes ({pendingCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveStatusTab('andamento')}
          className={`py-2.5 px-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeStatusTab === 'andamento'
              ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50'
          }`}
        >
          <Clock className="w-4 h-4 shrink-0" />
          <span className="truncate">Em Andamento ({inProgressCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveStatusTab('concluidas')}
          className={`py-2.5 px-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeStatusTab === 'concluidas'
              ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="truncate">Concluídas ({completedCount})</span>
        </button>
      </div>

      {/* ACTION CARDS LIST */}
      {loading ? (
        <div className="p-8 text-center text-slate-500 dark:text-slate-400 font-bold text-xs bg-white dark:bg-[#0b1222] border border-slate-200 dark:border-slate-800 rounded-2xl animate-pulse shadow-sm">
          Carregando suas ações operacionais...
        </div>
      ) : filteredActions.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-[#0d1627] border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2 shadow-sm">
          <ShieldCheck className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto" />
          <p className="text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wide">
            Nenhuma ação encontrada nesta categoria.
          </p>
          <p className="text-[11px] text-slate-500">
            {searchTerm ? 'Tente alterar os termos da busca.' : 'Sua lista operacional está atualizada e sem pendências ativas!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredActions.map((action) => {
            const isPendente = activeStatusTab === 'pendentes';
            const isAndamento = activeStatusTab === 'andamento';
            const isConcluida = activeStatusTab === 'concluidas';

            return (
              <div
                key={action.id}
                className="bg-white dark:bg-[#0b1222] border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-700 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-sm hover:shadow-md transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-amber-400 block">
                        {action.indicador || action.processo || roleName}
                      </span>
                      <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white mt-0.5 leading-snug">
                        {action.titulo || action.desvioEncontrado || 'Ação de Melhoria Operacional'}
                      </h4>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase shrink-0 border ${
                        isPendente
                          ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30'
                          : isAndamento
                          ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/30'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30'
                      }`}
                    >
                      {isPendente ? 'Pendente' : isAndamento ? 'Em Andamento' : 'Concluída'}
                    </span>
                  </div>

                  {action.descricao && (
                    <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-[#070c17] p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 leading-relaxed font-medium">
                      {action.descricao}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-mono pt-1">
                    <span>Responsável: <strong className="text-slate-800 dark:text-slate-200 font-sans">{action.responsavel || user.nome}</strong></span>
                    <span>Prazo: <strong className="text-blue-700 dark:text-amber-300">{action.prazo || '7 Dias'}</strong></span>
                  </div>

                  {action.parecerColaborador && (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px]">
                      <span className="text-[10px] font-bold text-blue-700 dark:text-indigo-400 uppercase block">Comentário do Atendimento:</span>
                      <p className="text-slate-700 dark:text-slate-300 font-medium mt-0.5">{action.parecerColaborador}</p>
                    </div>
                  )}
                </div>

                {/* CONTROLS PER STATUS */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 mt-2">
                  {isPendente && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(action.id, 'em_andamento')}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Iniciar Atendimento</span>
                    </button>
                  )}

                  {isAndamento && (
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Adicione um parecer ou contramedida realizada..."
                        value={commentsMap[action.id] || ''}
                        onChange={e => setCommentsMap({ ...commentsMap, [action.id]: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-[#070c17] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs p-2 rounded-xl outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const note = commentsMap[action.id] || 'Atendimento concluído conforme diretriz operacional.';
                          handleUpdateStatus(action.id, 'concluido', note);
                        }}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Concluir Ação</span>
                      </button>
                    </div>
                  )}

                  {isConcluida && (
                    <div className="flex items-center justify-between text-[10px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-500/20">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Ação Finalizada
                      </span>
                      {action.resolvidaEm && (
                        <span className="font-mono text-slate-500 dark:text-slate-400">
                          {new Date(action.resolvidaEm).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GuiaAcoesOperacionais;
