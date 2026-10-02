import React, { useState, useEffect, lazy, Suspense } from 'react';
import LandingPage from './components/LandingPage';
import LoginAuth from './components/LoginAuth';
import Sidebar from './components/Sidebar';
import { BrandLogo } from './components/BrandLogo';
import CircularLoader from './components/CircularLoader';
import { isPanelAllowedForUser, getUserOperationPanel, getUserRoleType } from './utils/permissions';
import { isExternalDashboard, openExternalDashboard } from './utils/externalDashboards';
import DashboardOverview from './components/DashboardOverview';

// Dynamic Lazy Imports for optimal initial bundle size and instant page loading
const AjudantePanel = lazy(() => import('./components/AjudantePanel'));
const RepackPanel = lazy(() => import('./components/RepackPanel'));
const DespejoPanel = lazy(() => import('./components/DespejoPanel'));
const ArmazemPanel = lazy(() => import('./components/ArmazemPanel'));
const QuebrasPanel = lazy(() => import('./components/QuebrasPanel'));
const ValidadesPanel = lazy(() => import('./components/ValidadesPanel'));
const RefugoPanel = lazy(() => import('./components/RefugoPanel'));
const EmpilhadorPanel = lazy(() => import('./components/EmpilhadorPanel'));
const ConferentePanel = lazy(() => import('./components/ConferentePanel'));
const ControlePanel = lazy(() => import('./components/ControlePanel'));
const ExportarPanel = lazy(() => import('./components/ExportarPanel'));
const FirebasePanel = lazy(() => import('./components/FirebasePanel'));
const RepackDashboard = lazy(() => import('./components/RepackDashboard'));
const DespejoDashboard = lazy(() => import('./components/DespejoDashboard'));
const QuebrasDashboard = lazy(() => import('./components/QuebrasDashboard'));
const FefoDashboard = lazy(() => import('./components/FefoDashboard'));
const PickingDashboard = lazy(() => import('./components/PickingDashboard'));
const GestaoCapacidadeDashboard = lazy(() => import('./components/GestaoCapacidadeDashboard'));
const RegistrosPanel = lazy(() => import('./components/RegistrosPanel'));
const AcessosPanel = lazy(() => import('./components/AcessosPanel'));
const EstoqueHub = lazy(() => import('./components/EstoqueHub'));
const PadraoOperacionalPanel = lazy(() => import('./components/PadraoOperacionalPanel'));
const SimulacaoAcoesPanel = lazy(() => import('./components/SimulacaoAcoesPanel'));
const DadosRetroativosPanel = lazy(() => import('./components/DadosRetroativosPanel'));
const SimuladorRessuprimentoPanel = lazy(() => import('./components/SimuladorRessuprimentoPanel'));
const RankingModule = lazy(() => import('./components/RankingModule'));
const TreeKpiViewer = lazy(() => import('./components/TreeKpiViewer'));
const PacotePrejuizoDashboard = lazy(() => import('./components/PacotePrejuizoDashboard'));
const TrocasEReposicoesDashboard = lazy(() => import('./components/TrocasEReposicoesDashboard'));
const RetornoDeRotaDashboard = lazy(() => import('./components/RetornoDeRotaDashboard'));
const BlitzDePuxadaDashboard = lazy(() => import('./components/BlitzDePuxadaDashboard'));
const GestaoPuxadasNriDashboard = lazy(() => import('./components/GestaoPuxadasNriDashboard'));
const GestaoConciliacaoGradeDashboard = lazy(() => import('./components/GestaoConciliacaoGradeDashboard'));
const LossHierarchyTree = lazy(() => import('./components/LossHierarchyTree'));
const CadastrosPanel = lazy(() => import('./components/CadastrosPanel'));
const QualidadePanel = lazy(() => import('./components/QualidadePanel'));
const SemanaQualidadePanel = lazy(() => import('./components/SemanaQualidadePanel'));
const DnSwotPanel = lazy(() => import('./components/DnSwotPanel'));
const AuditoriaDpoPanel = lazy(() => import('./components/AuditoriaDpoPanel'));
const CategoryIndexPanel = lazy(() => import('./components/CategoryIndexPanel'));
const PlataformasExternasPanel = lazy(() => import('./components/PlataformasExternasPanel'));
const ArmazemFacilPadrao02 = lazy(() => import('./components/ArmazemFacilPadrao02'));
const DtoDiagnosticoPanel = lazy(() => import('./components/DtoDiagnosticoPanel'));
const GuiaMontagemPanel = lazy(() => import('./components/GuiaMontagemPanel'));

const TreinamentosQualidadePanel = lazy(() => import('./components/NovosProcessosDpoPanels').then(m => ({ default: m.TreinamentosQualidadePanel })));
const BloqueioArmazemPanel = lazy(() => import('./components/NovosProcessosDpoPanels').then(m => ({ default: m.BloqueioArmazemPanel })));
const DevolucaoPanel = lazy(() => import('./components/NovosProcessosDpoPanels').then(m => ({ default: m.DevolucaoPanel })));
const ContagemInventarioPanel = lazy(() => import('./components/NovosProcessosDpoPanels').then(m => ({ default: m.ContagemInventarioPanel })));
const GestaoAtivosPanel = lazy(() => import('./components/NovosProcessosDpoPanels').then(m => ({ default: m.GestaoAtivosPanel })));
const QualidadePuxadaPanel = lazy(() => import('./components/NovosProcessosDpoPanels').then(m => ({ default: m.QualidadePuxadaPanel })));
const GestaoWlpPanel = lazy(() => import('./components/NovosProcessosDpoPanels').then(m => ({ default: m.GestaoWlpPanel })));
const CicloCarretasPanel = lazy(() => import('./components/NovosProcessosDpoPanels').then(m => ({ default: m.CicloCarretasPanel })));
const WlpDashboard = lazy(() => import('./components/WlpDashboard').then(m => ({ default: m.WlpDashboard })));

import { ModalAcaoDesvio } from './components/ModalAcaoDesvio';
import { ModalAcaoMelhoria } from './components/ModalAcaoMelhoria';
import { openModalAcaoDesvio, openModalAcaoMelhoria } from './utils/actionsEvents';
import { AgenteDpoModal } from './components/AgenteDpoModal';
import { AgendaExecutivoComponent } from './components/AgendaExecutivoComponent';
import { DiarioBordoComponent } from './components/DiarioBordoComponent';
import { ReunioesComponent } from './components/ReunioesComponent';
import { OperationalNotificationBell } from './components/OperationalNotificationBell';
import { EmpresaDataProvider, useEmpresaData, useViewUnitMode } from './context/EmpresaDataContext';
import { safeSetLocalStorage, safeGetLocalStorage } from './utils/safeLocalStorage';

import { auth, isCustomFirebaseConnected } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { getRepository, AcessosRepository, AcoesGeraisRepository } from './db';
const usuariosRepo = getRepository<any>('usuarios');
const empresasRepo = getRepository<any>('empresas');
import { Usuario, Empresa } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, Moon, Zap, PanelLeftOpen, PanelLeftClose, ArrowLeft, ArrowRight, LayoutGrid, LogOut, Flame, Sparkles, AlertOctagon, Menu } from 'lucide-react';

function HeaderClock({ theme }: { theme: 'light' | 'dark' }) {
  const [timeStr, setTimeStr] = useState('');
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTimeStr(now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', { hour12: false }));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!timeStr) return null;

  return (
    <>
      <div className={`w-[1px] h-3.5 hidden md:block ${theme === 'dark' ? 'bg-[#1c2530]' : 'bg-slate-200'}`} />
      <div className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-wider hidden md:block">
        {timeStr}
      </div>
    </>
  );
}

function GlobalUnitSelector({ theme }: { theme: 'light' | 'dark' }) {
  const { viewUnitMode, setViewUnitMode } = useViewUnitMode();
  return (
    <div className={`flex items-center p-0.5 rounded-lg border font-black text-[9px] uppercase tracking-wider ${
      theme === 'dark' ? 'bg-[#151b23] border-[#222d3a] text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
    }`}>
      <span className="px-1.5 text-[8px] text-slate-400 font-black hidden lg:inline">MODO:</span>
      <button
        type="button"
        onClick={() => setViewUnitMode('R$')}
        className={`px-2 py-0.5 rounded transition-all cursor-pointer border-none font-black ${
          viewUnitMode === 'R$'
            ? 'bg-emerald-600 text-white shadow-xs'
            : (theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900')
        }`}
      >
        R$ (Real)
      </button>
      <button
        type="button"
        onClick={() => setViewUnitMode('HL')}
        className={`px-2 py-0.5 rounded transition-all cursor-pointer border-none font-black ${
          viewUnitMode === 'HL'
            ? 'bg-cyan-600 text-white shadow-xs'
            : (theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900')
        }`}
      >
        HL (Hecto)
      </button>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<Usuario | null>(() => {
    try {
      const saved = localStorage.getItem('af_logged_user');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      if (parsed && (parsed.empresaId === 'emp_dono' || !parsed.empresaId)) {
        parsed.empresaId = 'demo';
        localStorage.setItem('af_logged_user', JSON.stringify(parsed));
      }
      return parsed;
    } catch (e) {
      return null;
    }
  });

  const [empresa, setEmpresa] = useState<Empresa | null>(() => {
    try {
      const saved = localStorage.getItem('af_logged_empresa');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      if (parsed && (parsed.id === 'emp_dono' || !parsed.id)) {
        parsed.id = 'demo';
        localStorage.setItem('af_logged_empresa', JSON.stringify(parsed));
      }
      return parsed;
    } catch (e) {
      return null;
    }
  });

  const [activePanel, setActivePanel] = useState<string>(() => {
    try {
      const savedUser = localStorage.getItem('af_logged_user');
      if (savedUser) {
        return 'visao-geral';
      }
    } catch (e) {
      // fallback
    }
    return 'landing';
  });

  // Navigation History Stack (Back / Forward)
  const [history, setHistory] = useState<string[]>(() => {
    try {
      const savedUser = localStorage.getItem('af_logged_user');
      if (savedUser) {
        return ['visao-geral'];
      }
    } catch (e) {
      // fallback
    }
    return ['landing'];
  });
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [dashInitialTab, setDashInitialTab] = useState<'operacao' | '5s' | 'matriz' | 'desvios' | 'gatilhos' | 'agenda' | 'diario_bordo' | 'reunioes' | 'fluxograma' | 'wlp' | undefined>(undefined);

  const navigateToPanel = (panel: string) => {
    if (!panel) return;
    if (isExternalDashboard(panel)) {
      openExternalDashboard(panel);
      return;
    }
    if (panel === activePanel) return;
    setHistory(prev => {
      const nextHistory = prev.slice(0, historyIndex + 1);
      nextHistory.push(panel);
      return nextHistory;
    });
    setHistoryIndex(prev => prev + 1);
    setActivePanel(panel);
  };

  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < history.length - 1;

  const handleGoBack = () => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      setHistoryIndex(prevIdx);
      setActivePanel(history[prevIdx]);
    } else if (activePanel !== 'visao-geral' && activePanel !== 'landing') {
      navigateToPanel('visao-geral');
    }
  };

  const handleGoForward = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      setActivePanel(history[nextIdx]);
    }
  };

  const [showAuthGate, setShowAuthGate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('af_app_theme') || localStorage.getItem('dashboard_theme') || localStorage.getItem('af-theme');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch (e) {
      // ignore
    }
    return 'light';
  });
  const [activeActions, setActiveActions] = useState<any[]>([]);
  const [isDpoAgentOpen, setIsDpoAgentOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Estados dos Modais de Ações: Desvios (Ocorrências/Gatilhos) e Melhoria (TOR)
  const [isDesvioModalOpen, setIsDesvioModalOpen] = useState(false);
  const [desvioModalData, setDesvioModalData] = useState<any>(null);

  const [isMelhoriaModalOpen, setIsMelhoriaModalOpen] = useState(false);
  const [melhoriaModalData, setMelhoriaModalData] = useState<any>(null);
  const [dtoInitialOperacao, setDtoInitialOperacao] = useState<string>('repack');
  const [fefoInitialTab, setFefoInitialTab] = useState<any>('validades');
  const [fefoInitialSubTab, setFefoInitialSubTab] = useState<any>(undefined);

  // Listeners globais para abertura dos modais de qualquer ponto do sistema e navegação
  useEffect(() => {
    const handleOpenDesvio = (e: any) => {
      setDesvioModalData(e.detail || null);
      setIsDesvioModalOpen(true);
    };
    const handleOpenMelhoria = (e: any) => {
      setMelhoriaModalData(e.detail || null);
      setIsMelhoriaModalOpen(true);
    };
    const handleGlobalNavigate = (e: any) => {
      if (typeof e.detail === 'string') {
        navigateToPanel(e.detail);
      } else if (e.detail && typeof e.detail === 'object') {
        if (e.detail.operacao) {
          setDtoInitialOperacao(e.detail.operacao);
        }
        if (e.detail.fefoTab || e.detail.tab) {
          setFefoInitialTab(e.detail.fefoTab || e.detail.tab);
        }
        if (e.detail.fefoSubTab || e.detail.subTab) {
          setFefoInitialSubTab(e.detail.fefoSubTab || e.detail.subTab);
        }
        if (e.detail.panel) {
          navigateToPanel(e.detail.panel);
        }
      }
    };
    const handleOpenDto = (e: any) => {
      const op = e.detail?.operacao || e.detail || 'repack';
      setDtoInitialOperacao(op);
      navigateToPanel('dto-diagnostico');
    };

    window.addEventListener('abrir-modal-acao-desvio', handleOpenDesvio);
    window.addEventListener('abrir-modal-acao-melhoria', handleOpenMelhoria);
    window.addEventListener('app_navigate', handleGlobalNavigate);
    window.addEventListener('open_dto_operacao', handleOpenDto);

    return () => {
      window.removeEventListener('abrir-modal-acao-desvio', handleOpenDesvio);
      window.removeEventListener('abrir-modal-acao-melhoria', handleOpenMelhoria);
      window.removeEventListener('app_navigate', handleGlobalNavigate);
      window.removeEventListener('open_dto_operacao', handleOpenDto);
    };
  }, [historyIndex, activePanel]);

  // Sync user, empresa, and activePanel to localStorage for session persistence
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem('af_logged_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('af_logged_user');
      }
    } catch (e) {
      // ignore
    }
  }, [user]);

  useEffect(() => {
    try {
      if (empresa) {
        localStorage.setItem('af_logged_empresa', JSON.stringify(empresa));
      } else {
        localStorage.removeItem('af_logged_empresa');
      }
    } catch (e) {
      // ignore
    }
  }, [empresa]);

  useEffect(() => {
    try {
      if (user && activePanel && activePanel !== 'landing') {
        localStorage.setItem('af_logged_panel', activePanel);
      } else if (!user) {
        localStorage.removeItem('af_logged_panel');
      }
    } catch (e) {
      // ignore
    }
  }, [user, activePanel]);

  // Listen to pending action plans for the current logged in collaborator
  useEffect(() => {
    if (!user) {
      setActiveActions([]);
      return;
    }
    const companyId = user.empresaId || 'demo';
    
    // Notificações ativas por usuário: limitado a no máximo 10 alertas pendentes simultâneos
    const unsub = AcoesGeraisRepository.subscribe(
      companyId,
      (items) => {
        const userAcoes = items
          .filter((a: any) => 
            a.colaboradorId === user.uid && 
            a.status === 'pendente' && 
            a.tipo === 'colaborador'
          )
          .slice(0, 10);
        setActiveActions(userAcoes);
      },
      (err: any) => {
        try {
          const localAcoes = JSON.parse(safeGetLocalStorage(`local_acoes_${companyId}`, '[]') || '[]');
          const userAcoes = localAcoes
            .filter((a: any) => 
              a.colaboradorId === user.uid && 
              a.status === 'pendente' && 
              a.tipo === 'colaborador'
            )
            .slice(0, 10);
          setActiveActions(userAcoes);
        } catch (e) {
          setActiveActions([]);
        }
      }
    );

    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [user?.uid, user?.empresaId]);

  const isBlockedByActionPlan = () => {
    // Disabled blocking popup on main screen as requested
    return false;
  };

  // Session Access Tracking for Security
  useEffect(() => {
    if (!user) {
      return;
    }
    const empresaId = user.empresaId || 'demo';
    const sessionKey = `af_session_doc_id_${user.uid}`;
    let currentSessionId = sessionStorage.getItem(sessionKey);

    const trackSession = async () => {
      // Don't log landing or empty panels
      if (activePanel === 'landing' || !activePanel) return;

      const nowStr = new Date().toISOString();
      const friendlyTime = new Date().toLocaleTimeString('pt-BR', { hour12: false });
      const friendlyDate = new Date().toLocaleDateString('pt-BR');

      const activityItem = {
        aba: activePanel,
        hora: friendlyTime,
        timestamp: nowStr
      };

      if (!currentSessionId) {
        // Create new session document
        const newSession = {
          empresaId,
          userId: user.uid,
          nome: user.nome,
          email: user.email,
          papel: user.papel || 'operador',
          loginEm: nowStr,
          loginData: friendlyDate,
          loginHora: friendlyTime,
          logoutEm: null,
          ultimoAcesso: nowStr,
          abasAcessadas: [activePanel],
          atividades: [activityItem],
          ativo: true
        };

        try {
          const created = await AcessosRepository.create(newSession, empresaId);
          currentSessionId = created._docId || created.id;
          sessionStorage.setItem(sessionKey, currentSessionId);
        } catch (e: any) {
          currentSessionId = 'local_' + Date.now();
          sessionStorage.setItem(sessionKey, currentSessionId);
          const localSessions = JSON.parse(safeGetLocalStorage(`local_acessos_${empresaId}`, '[]') || '[]');
          localSessions.unshift({ id: currentSessionId, ...newSession });
          safeSetLocalStorage(`local_acessos_${empresaId}`, JSON.stringify(localSessions.slice(0, 50)));
        }
      } else {
        if (currentSessionId && !currentSessionId.startsWith('local_')) {
          try {
            await AcessosRepository.update(currentSessionId, {
              ultimoAcesso: nowStr,
              abasAcessadas: [activePanel],
              atividades: [activityItem]
            }, empresaId);
          } catch (e: any) {
            currentSessionId = 'local_' + Date.now();
            sessionStorage.setItem(sessionKey, currentSessionId);
            const localSessions = JSON.parse(safeGetLocalStorage(`local_acessos_${empresaId}`, '[]') || '[]');
            const idx = localSessions.findIndex((s: any) => s.id === currentSessionId);
            if (idx !== -1) {
              const sess = localSessions[idx];
              if (!sess.abasAcessadas.includes(activePanel)) sess.abasAcessadas.push(activePanel);
              if (sess.atividades[sess.atividades.length - 1]?.aba !== activePanel) sess.atividades.push(activityItem);
              sess.ultimoAcesso = nowStr;
              safeSetLocalStorage(`local_acessos_${empresaId}`, JSON.stringify(localSessions.slice(0, 50)));
            }
          }
        } else {
          // Local fallback update
          const localSessions = JSON.parse(safeGetLocalStorage(`local_acessos_${empresaId}`, '[]') || '[]');
          const idx = localSessions.findIndex((s: any) => s.id === currentSessionId);
          if (idx !== -1) {
            const sess = localSessions[idx];
            if (!sess.abasAcessadas.includes(activePanel)) {
              sess.abasAcessadas.push(activePanel);
            }
            if (sess.atividades[sess.atividades.length - 1]?.aba !== activePanel) {
              sess.atividades.push(activityItem);
            }
            sess.ultimoAcesso = nowStr;
            safeSetLocalStorage(`local_acessos_${empresaId}`, JSON.stringify(localSessions.slice(0, 50)));
          }
        }
      }
    };

    trackSession();
  }, [user, activePanel]);

  // Sync theme to body element and localStorage
  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.remove('light-theme');
      document.body.classList.add('dark');
      document.documentElement.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
      document.documentElement.classList.remove('dark');
      document.body.classList.add('light-theme');
    }
    try {
      localStorage.setItem('af_app_theme', theme);
      localStorage.setItem('dashboard_theme', theme);
      localStorage.setItem('af-theme', theme);
    } catch (e) {
      // ignore
    }
  }, [theme]);

  // Sync auth state
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setLoading(true);
      if (fbUser) {
        try {
          // Fetch user metadata from repository
          const uData = await usuariosRepo.getById(fbUser.uid);
          if (uData) {
            const completeUser: Usuario = { uid: fbUser.uid, ...uData };
            const isNixon = completeUser.email.toLowerCase().trim() === 'nixon.a.a100.nh@gmail.com';
            if (isNixon) {
              completeUser.papel = 'admin';
            }
            
            const savedMode = localStorage.getItem('login_mode');
            if (savedMode === 'controle') {
              completeUser.isControle = true;
            } else if (savedMode === 'operacao') {
              completeUser.isControle = false;
            } else {
              completeUser.isControle = isNixon || uData.isControle || uData.papel === 'controle' || (uData.papel || '').split(',').map((s: string) => s.trim()).includes('controle');
            }
            setUser(completeUser);

            // Fetch company metadata
            if (uData.empresaId) {
              const eData = await empresasRepo.getById(uData.empresaId);
              if (eData) {
                const companyObj = { id: uData.empresaId, ...eData } as Empresa;
                const userRolesList = (completeUser.papel || '').split(',').map((s: string) => s.trim());
                if (completeUser.isControle || userRolesList.includes('admin') || userRolesList.includes('controle')) {
                  companyObj.modulos = ['repack', 'validades', 'quebras', 'despejo', 'empilhador', 'refugo'];
                  companyObj.plano = 'completo';
                }
                setEmpresa(companyObj);
              }
            }
            setActivePanel(prev => (prev === 'landing' || !prev ? 'visao-geral' : prev));
          }
        } catch(e) {
          console.error('Error syncing auth metadata', e);
        }
      } else {
        // Only clear if no saved user session exists in localStorage
        const savedUser = localStorage.getItem('af_logged_user');
        if (!savedUser) {
          setUser(null);
          setEmpresa(null);
          setActivePanel('landing');
        }
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleAuthSuccess = (uProfile: any) => {
    const matchedUid = uProfile.uid || uProfile.id || 'demo-user';
    const userEmail = uProfile.email || '';
    const isNixon = userEmail.toLowerCase().trim() === 'nixon.a.a100.nh@gmail.com';
    
    const savedMode = localStorage.getItem('login_mode');
    let isControleVal = uProfile.isControle || isNixon;
    if (savedMode === 'controle') {
      isControleVal = true;
    } else if (savedMode === 'operacao') {
      isControleVal = false;
    }

    const completeUser: Usuario = {
      uid: matchedUid,
      nome: uProfile.nome || 'Operador',
      email: userEmail,
      empresaId: uProfile.empresaId || 'demo',
      papel: isNixon ? 'admin' : (uProfile.papel || uProfile.role || 'operador'),
      status: uProfile.status || 'ativo',
      isControle: isControleVal
    };
    setUser(completeUser);

    if (uProfile.empresa) {
      const eData = { ...uProfile.empresa };
      const userRolesList = (completeUser.papel || '').split(',').map((s: string) => s.trim());
      if (completeUser.isControle || userRolesList.includes('admin') || userRolesList.includes('controle')) {
        eData.modulos = ['repack', 'validades', 'quebras', 'despejo', 'empilhador', 'refugo'];
        eData.plano = 'completo';
      }
      setEmpresa(eData);
    } else {
      setEmpresa({
        id: uProfile.empresaId || 'demo',
        nome: uProfile.empresaNome || 'Minha Empresa',
        cidade: '',
        estado: '',
        plano: uProfile.plano || 'completo',
        modulos: ['repack', 'validades', 'quebras', 'despejo', 'empilhador', 'refugo'],
        ativo: true
      });
    }

    setShowAuthGate(false);
    setActivePanel('visao-geral');
  };

  const handleLogout = async () => {
    if (user) {
      const sessionKey = `af_session_doc_id_${user.uid}`;
      const sessionDocId = sessionStorage.getItem(sessionKey);
      if (sessionDocId) {
        const nowStr = new Date().toISOString();
        if (sessionDocId && !sessionDocId.startsWith('local_')) {
          try {
            await AcessosRepository.update(sessionDocId, {
              logoutEm: nowStr,
              ativo: false
            }, user.empresaId || 'demo');
          } catch (e) {
            // Local fallback on session logout
          }
        } else {
          const empresaId = user.empresaId || 'demo';
          const localSessions = JSON.parse(localStorage.getItem(`local_acessos_${empresaId}`) || '[]');
          const idx = localSessions.findIndex((s: any) => s.id === sessionDocId);
          if (idx !== -1) {
            localSessions[idx].logoutEm = nowStr;
            localSessions[idx].ativo = false;
            safeSetLocalStorage(`local_acessos_${empresaId}`, JSON.stringify(localSessions.slice(0, 50)));
          }
        }
        sessionStorage.removeItem(sessionKey);
      }
    }

    localStorage.removeItem('af_logged_user');
    localStorage.removeItem('af_logged_empresa');
    localStorage.removeItem('af_logged_panel');

    if (auth) {
      await signOut(auth);
    }
    setUser(null);
    setEmpresa(null);
    setActivePanel('visao-geral');
    setShowAuthGate(false);
  };

  // Main navigation orchestration router
  const renderActivePanel = () => {
    if (!user) {
      return null;
    }

    if (!isPanelAllowedForUser(activePanel, user)) {
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-md mx-auto my-12 text-center" id="acesso-restrito-container">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-4" id="acesso-restrito-icon">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m3-9a1 1 0 11-2 0 1 1 0 012 0zM3.172 7.828c.39-.39.902-.586 1.414-.586h14.828c.512 0 1.024.195 1.414.586a2 2 0 010 2.828l-1.414 1.414a2 2 0 01-2.828 0l-1.414-1.414a2 2 0 010-2.828L15 6.414a2 2 0 01-2.828 0l-1.414 1.414a2 2 0 010 2.828L9.343 12.07a2 2 0 01-2.828 0l-1.414-1.414a2 2 0 010-2.828l1.414-1.414z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2" id="acesso-restrito-title">Acesso Restrito</h2>
          <p className="text-sm text-gray-500 mb-6" id="acesso-restrito-desc">Seu cargo ({user?.cargo || user?.papel || 'Operador'}) não possui privilégios para acessar esta área da plataforma.</p>
          <button 
            id="acesso-restrito-btn-voltar"
            onClick={() => setActivePanel('visao-geral')} 
            className="px-6 py-2 bg-[#1e56f0] text-white rounded-lg hover:bg-[#1a4cd8] font-medium transition-colors cursor-pointer"
          >
            Voltar para Visão Geral
          </button>
        </div>
      );
    }

    const operationalPanels = [
      'repack', 'despejo', 'armazem', 'quebras', 'validades', 'refugo', 'empilhador', 'conferente'
    ];

    if (operationalPanels.includes(activePanel) && isBlockedByActionPlan()) {
      const blockedActions = activeActions.filter(action => {
        const limitTime = new Date(action.limiteEm || (new Date(action.criadoEm).getTime() + 7 * 24 * 60 * 60 * 1000)).getTime();
        return Date.now() > limitTime;
      });

      return (
        <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-md border-2 border-red-200 max-w-lg mx-auto my-12 text-center" id="trabalho-bloqueado-container">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4" id="trabalho-bloqueado-icon">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 animate-bounce text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-wide" id="trabalho-bloqueado-title">⚠️ Trabalho Bloqueado</h2>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed" id="trabalho-bloqueado-desc">
            De acordo com as regras operacionais, você possui um plano de ação criado para você que ultrapassou o <strong>limite máximo de 7 dias</strong> para conclusão. Você só poderá registrar produtividade após concluir esta ação.
          </p>

          <div className="w-full text-left bg-slate-50 border border-slate-100 rounded-xl p-4.5 mb-6 flex flex-col gap-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Ação(ões) Pendente(s) Excedida(s):</span>
            {blockedActions.map((action, idx) => (
              <div key={`blocked-act-${action.id || idx}-${idx}`} className="p-3 bg-white rounded-lg border border-red-100 flex flex-col gap-1 shadow-xs">
                <span className="font-bold text-slate-850 text-xs">{action.titulo}</span>
                <p className="text-[11px] text-slate-500 mt-1">{action.descricao}</p>
                <div className="flex justify-between items-center mt-2.5 pt-2.5 border-t border-slate-100 text-[10px] text-slate-400 font-medium">
                  <span>Criado em: {new Date(action.criadoEm).toLocaleDateString('pt-BR')}</span>
                  <button
                    onClick={async () => {
                      try {
                        await AcoesGeraisRepository.update(action.id, {
                          status: 'concluido',
                          resolvidaEm: new Date().toISOString()
                        }, user.empresaId || 'demo');
                        setActiveActions(prev => prev.filter(a => a.id !== action.id));
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md font-bold text-[9px] uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1"
                  >
                    ✓ Concluir Ação
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button 
            id="trabalho-bloqueado-btn-voltar"
            onClick={() => setActivePanel('visao-geral')} 
            className="w-full py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700 font-bold text-xs uppercase tracking-widest transition-colors cursor-pointer"
          >
            Ir para a Visão Geral
          </button>
        </div>
      );
    }

    switch (activePanel) {
      case 'cat-produtividade':
      case 'cat-dashboards':
      case 'cat-ferramentas-gestao':
      case 'cat-cadastros':
      case 'cat-dados-acoes':
        return (
          <CategoryIndexPanel
            categoryKey={activePanel}
            user={user}
            onNavigate={navigateToPanel}
            theme={theme}
          />
        );
      case 'dashboard':
      case 'visao-geral':
        return (
          <DashboardOverview 
            user={user} 
            empresa={empresa} 
            onNavigate={navigateToPanel} 
            theme={theme}
            initialTab={dashInitialTab}
            kpiStats={{
              usuarios: 3,
              modulos: empresa?.modulos ? empresa.modulos.length : 6,
              docsHoje: 12,
              alertasFefo: 4
            }}
          />
        );
      case 'dn-swot':
        return <DnSwotPanel user={user} onNavigate={navigateToPanel} />;
      case 'ajudante':
      case 'repack':
        return <AjudantePanel user={user} empresa={empresa} theme={theme} />;
      case 'montagem':
      case 'guia-montagem':
        return <GuiaMontagemPanel user={user} empresa={empresa} theme={theme} onBack={handleGoBack} />;
      case 'repack-dashboard':
        return <RepackDashboard user={user} empresa={empresa} theme={theme} onBack={handleGoBack} />;
      case 'despejo-dashboard':
        return <DespejoDashboard user={user} empresa={empresa} theme={theme} onBack={handleGoBack} />;
      case 'logistica-dashboard':
        return <PickingDashboard user={user} empresa={empresa} theme={theme} initialModule="efc_efd" onBack={handleGoBack} />;
      case 'quebras-dashboard':
        return <QuebrasDashboard user={user} empresa={empresa} theme={theme} onBack={handleGoBack} />;
      case 'fefo-dashboard':
        return (
          <FefoDashboard 
            user={user} 
            empresa={empresa} 
            theme={theme} 
            initialTab={fefoInitialTab} 
            initialSubTab={fefoInitialSubTab} 
            onBack={handleGoBack} 
          />
        );
      case 'picking-dashboard':
        return <PickingDashboard user={user} empresa={empresa} theme={theme} initialModule="operadores" onBack={handleGoBack} />;
      case 'gestao-capacidade':
        return <GestaoCapacidadeDashboard user={user} empresa={empresa} theme={theme} onBack={handleGoBack} onNavigate={navigateToPanel} />;
      case 'tmr-dashboard':
        return <PickingDashboard user={user} empresa={empresa} theme={theme} initialModule="tmr" onBack={handleGoBack} />;
      case 'despejo':
        return <DespejoPanel user={user} empresa={empresa} theme={theme} />;
      case 'armazem':
        return <EmpilhadorPanel user={user} empresa={empresa} theme={theme} />;
      case 'quebras':
        return <QuebrasPanel user={user} empresa={empresa} theme={theme} />;
      case 'validades':
        return <ConferentePanel user={user} empresa={empresa} theme={theme} initialTab="validade" />;
      case 'refugo':
        return <RefugoPanel user={user} empresa={empresa} theme={theme} />;
      case 'empilhador':
        return <EmpilhadorPanel user={user} empresa={empresa} theme={theme} />;
      case 'conferente':
        return <ConferentePanel user={user} empresa={empresa} theme={theme} />;
      case 'registros':
        return <SimulacaoAcoesPanel user={user} empresa={empresa} onNavigate={navigateToPanel} initialTab="governanca" />;
      case 'acessos':
        return <SimulacaoAcoesPanel user={user} empresa={empresa} onNavigate={navigateToPanel} initialTab="acoes" />;
      case 'cadastros':
        return <CadastrosPanel user={user} empresa={empresa} theme={theme} initialSubTab="produtos" />;
      case 'controle':
        return <ControlePanel user={user} empresa={empresa} theme={theme} />;
      case 'acoes':
        return <SimulacaoAcoesPanel user={user} empresa={empresa} onNavigate={navigateToPanel} initialTab="acoes" />;
      case 'firebase':
        return <FirebasePanel theme={theme} />;
      case 'exportar':
        return <ExportarPanel user={user} empresa={empresa} theme={theme} />;
      case 'politica-estoque':
        return <GestaoCapacidadeDashboard user={user} empresa={empresa} theme={theme} initialTab="politica-estoque" onBack={handleGoBack} onNavigate={navigateToPanel} />;
      case 'importacao-contagens':
        return <EstoqueHub user={user} initialTab="importacao-contagens" />;
      case 'area-contingencia':
        return <EstoqueHub user={user} initialTab="area-contingencia" />;
      case 'venda-media':
        return <EstoqueHub user={user} initialTab="venda-media" />;
      case 'dto-diagnostico':
      case 'dto':
        return (
          <DtoDiagnosticoPanel 
            user={user} 
            empresa={empresa} 
            theme={theme} 
            initialOperacaoId={dtoInitialOperacao as any} 
            onNavigate={navigateToPanel} 
          />
        );
      case 'plataformas-externas':
        return <PlataformasExternasPanel user={user} theme={theme} />;
      case 'auditoria-dpo':
        return <AuditoriaDpoPanel user={user} empresa={empresa} theme={theme} onNavigate={navigateToPanel} />;
      case 'treinamentos-qualidade':
        return <TreinamentosQualidadePanel user={user} empresa={empresa} theme={theme} />;
      case 'bloqueio-armazem':
        return <BloqueioArmazemPanel user={user} empresa={empresa} theme={theme} />;
      case 'devolucao':
        return <DevolucaoPanel user={user} empresa={empresa} theme={theme} />;
      case 'contagem-inventario':
        return <ContagemInventarioPanel user={user} empresa={empresa} theme={theme} />;
      case 'gestao-ativos':
        return <GestaoAtivosPanel user={user} empresa={empresa} theme={theme} />;
      case 'qualidade-puxada':
        return <QualidadePuxadaPanel user={user} empresa={empresa} theme={theme} />;
      case 'gestao-wlp':
      case 'wlp-dashboard':
        return <WlpDashboard user={user} empresaId={empresa?.id || 'demo'} />;
      case 'ciclo-carretas':
        return <CicloCarretasPanel user={user} empresa={empresa} theme={theme} />;
      case 'padronizacao-processos':
        return <PadraoOperacionalPanel user={user} theme={theme} />;
      case 'simulacao-acoes':
        return <SimulacaoAcoesPanel user={user} onNavigate={navigateToPanel} />;
      case 'dados-retroativos':
      case 'importacao-dados-retroativos':
        return <DadosRetroativosPanel user={user} initialTab="importacao" onNavigate={navigateToPanel} />;
      case 'simulador-ressuprimento':
        return <SimuladorRessuprimentoPanel user={user} />;
      case 'ranking-produtividade':
        return <RankingModule user={user} />;
      case 'qualidade':
        return <QualidadePanel user={user} empresa={empresa} theme={theme} />;
      case 'semana-qualidade':
        return <SemanaQualidadePanel user={user} theme={theme} />;
      case 'armazem-facil-padrao-02':
        return <ArmazemFacilPadrao02 user={user} empresa={empresa} theme={theme} />;
      case 'kpi-arvore':
        return <TreeKpiViewer user={user} />;
      case 'pacote-prejuizo':
        return (
          <PacotePrejuizoDashboard 
            user={user} 
            empresa={empresa} 
            theme={theme} 
            onBack={handleGoBack} 
            onNavigate={(panel, tab, subTab) => {
              if (tab) setFefoInitialTab(tab);
              if (subTab) setFefoInitialSubTab(subTab);
              navigateToPanel(panel);
            }}
          />
        );
      case 'trocas-reposicoes':
        return <TrocasEReposicoesDashboard user={user} empresa={empresa} theme={theme} onBack={handleGoBack} />;
      case 'retorno-de-rota':
        return <RetornoDeRotaDashboard user={user} empresa={empresa} theme={theme} onBack={handleGoBack} />;
      case 'blitz-de-puxada':
        return <BlitzDePuxadaDashboard user={user} empresa={empresa} theme={theme} onBack={handleGoBack} />;
      case 'gestao-puxadas-nri':
      case 'puxadas-nri':
        return <GestaoPuxadasNriDashboard user={user} empresa={empresa} theme={theme} onBack={handleGoBack} />;
      case 'gestao-conciliacao-grade':
      case 'conciliacao-grade':
        return <GestaoConciliacaoGradeDashboard user={user} empresa={empresa} theme={theme} onBack={handleGoBack} />;
      case 'agenda-executiva':
        return (
          <DashboardOverview 
            user={user} 
            empresa={empresa} 
            onNavigate={navigateToPanel} 
            theme={theme}
            initialTab="agenda"
            kpiStats={{
              usuarios: 3,
              modulos: empresa?.modulos ? empresa.modulos.length : 6,
              docsHoje: 12,
              alertasFefo: 4
            }}
          />
        );
      case 'diario-bordo':
        return (
          <DashboardOverview 
            user={user} 
            empresa={empresa} 
            onNavigate={navigateToPanel} 
            theme={theme}
            initialTab="diario_bordo"
            kpiStats={{
              usuarios: 3,
              modulos: empresa?.modulos ? empresa.modulos.length : 6,
              docsHoje: 12,
              alertasFefo: 4
            }}
          />
        );
      case 'reunioes':
        return (
          <DashboardOverview 
            user={user} 
            empresa={empresa} 
            onNavigate={navigateToPanel} 
            theme={theme}
            initialTab="reunioes"
            kpiStats={{
              usuarios: 3,
              modulos: empresa?.modulos ? empresa.modulos.length : 6,
              docsHoje: 12,
              alertasFefo: 4
            }}
          />
        );
      case 'gatilhos':
      case 'workstation-gatilhos':
      case 'desvios-operacionais':
        return (
          <DashboardOverview 
            user={user} 
            empresa={empresa} 
            onNavigate={navigateToPanel} 
            theme={theme}
            initialTab="gatilhos"
            kpiStats={{
              usuarios: 3,
              modulos: empresa?.modulos ? empresa.modulos.length : 6,
              docsHoje: 12,
              alertasFefo: 4
            }}
          />
        );
      case 'desvios-acoes':
      case 'desvios':
        return (
          <DashboardOverview 
            user={user} 
            empresa={empresa} 
            onNavigate={navigateToPanel} 
            theme={theme}
            initialTab="desvios"
            kpiStats={{
              usuarios: 3,
              modulos: empresa?.modulos ? empresa.modulos.length : 6,
              docsHoje: 12,
              alertasFefo: 4
            }}
          />
        );
      case 'fluxograma-demandas':
      case 'fluxograma':
        return (
          <DashboardOverview 
            user={user} 
            empresa={empresa} 
            onNavigate={navigateToPanel} 
            theme={theme}
            initialTab="fluxograma"
            kpiStats={{
              usuarios: 3,
              modulos: empresa?.modulos ? empresa.modulos.length : 6,
              docsHoje: 12,
              alertasFefo: 4
            }}
          />
        );
      case 'loss-tree':
      case 'arvore-perdas':
        return (
          <QuebrasDashboard 
            user={user} 
            empresa={empresa} 
            onBack={handleGoBack} 
            theme={theme}
            initialSubTab="arvore"
          />
        );
      default:
        return (
          <DashboardOverview 
            user={user} 
            empresa={empresa} 
            onNavigate={navigateToPanel} 
            theme={theme}
            kpiStats={{
              usuarios: 3,
              modulos: empresa?.modulos ? empresa.modulos.length : 6,
              docsHoje: 12,
              alertasFefo: 4
            }}
          />
        );
    }
  };

  const getHeaderInfo = (panel: string) => {
    const defaultInfo = {
      breadcrumbs: ['Pau Brasil', 'Painel'],
      title: 'Painel Geral',
      subtitle: 'Controle de retornos e conciliação de rotas.',
      color: 'from-[#1e56f0]/5 to-transparent'
    };
    
    switch (panel) {
      case 'cat-produtividade':
        return {
          breadcrumbs: ['Início', 'Produtividade'],
          title: 'Produtividade',
          subtitle: 'Visão geral e índice de módulos de apontamento operacional.',
          color: 'from-amber-500/10 to-transparent'
        };
      case 'cat-dashboards':
        return {
          breadcrumbs: ['Início', 'Dashboards'],
          title: 'Dashboards & BI',
          subtitle: 'Visão geral e índice de painéis executivos e estatísticas.',
          color: 'from-sky-500/10 to-transparent'
        };
      case 'cat-ferramentas-gestao':
        return {
          breadcrumbs: ['Início', 'Ferramentas de Gestão'],
          title: 'Ferramentas de Gestão',
          subtitle: 'Mecanismos de governança, DPO, inventário e planejamento.',
          color: 'from-purple-500/10 to-transparent'
        };
      case 'cat-cadastros':
        return {
          breadcrumbs: ['Início', 'Cadastros'],
          title: 'Cadastros Unificados',
          subtitle: 'Base mestre de produtos, colaboradores e permissões.',
          color: 'from-emerald-500/10 to-transparent'
        };
      case 'dados-retroativos':
      case 'importacao-dados-retroativos':
        return {
          breadcrumbs: ['Cadastros & Governança', 'Importação Retroativa'],
          title: 'Importação de Dados Retroativos (JSON)',
          subtitle: 'Carga em lote, conferência e gravação de quebras, avarias e apontamentos históricos.',
          color: 'from-amber-500/10 to-transparent'
        };
      case 'cat-dados-acoes':
        return {
          breadcrumbs: ['Início', 'Dados e Ações'],
          title: 'Dados e Ações',
          subtitle: 'Base de dados central, expurgo/importação e planos de ação.',
          color: 'from-indigo-500/10 to-transparent'
        };
      case 'visao-geral':
        return {
          breadcrumbs: ['Início', 'Workstation'],
          title: 'Workstation (Centro de Controle)',
          subtitle: 'Acompanhamento em tempo real das movimentações, alertas de vencimento e produtividade do pátio.',
          color: 'from-[#1e56f0]/10 to-transparent'
        };
      case 'qualidade':
        return {
          breadcrumbs: ['Controle de Qualidade', 'Qualidade Armazém'],
          title: 'QUALIDADE - 5S, Temperatura & Pragas',
          subtitle: 'Gestão integrada do Controle de Temperatura do Armazém, Programa 5S de 14 Setores e Laudos Quinzenais de Pragas (PDF).',
          color: 'from-amber-500/10 to-transparent'
        };
      case 'semana-qualidade':
        return {
          breadcrumbs: ['Ferramentas de Gestão', 'Semana da Qualidade'],
          title: 'Dashboard Semana da Qualidade (1º e 2º Semestre)',
          subtitle: 'Gestão das edições semestrais, registro de assuntos, datas, caminhos no gerenciador de arquivos e anexos de atas.',
          color: 'from-emerald-500/10 to-transparent'
        };
      case 'armazem-facil-padrao-02':
        return {
          breadcrumbs: ['Ferramentas de Gestão', 'Padrão 02'],
          title: 'Armazém Fácil Padrão 02',
          subtitle: 'Página em branco padrão configurada e integrada com o banco de dados banco-03-teste.',
          color: 'from-blue-500/10 to-transparent'
        };
      case 'repack-dashboard':
        return {
          breadcrumbs: ['Dashboard', 'Dashboard Repack'],
          title: 'Dashboard Repack',
          subtitle: 'Análise de performance, produtividade de operadores e eficiência de reembalagem.',
          color: 'from-purple-500/10 to-transparent'
        };
      case 'wlp-dashboard':
      case 'gestao-wlp':
        return {
          breadcrumbs: ['Dashboard', 'Dashboard WLP'],
          title: 'Dashboard WLP (HL/HH) & Apontamento de Jornadas',
          subtitle: 'Workload Planning (HL/HH), horas médias trabalhadas, fechamento de faturamento (21h) e controle DPO de horas extras.',
          color: 'from-amber-500/10 to-transparent'
        };
      case 'despejo-dashboard':
        return {
          breadcrumbs: ['Dashboard', 'Dashboard Despejo'],
          title: 'Dashboard Despejo',
          subtitle: 'Monitoramento corporativo de descarte de líquidos e eficiência operacional.',
          color: 'from-rose-500/10 to-transparent'
        };
      case 'logistica-dashboard':
        return {
          breadcrumbs: ['Dashboard', 'Dashboard Operadores'],
          title: 'Dashboard Operadores (Unificado)',
          subtitle: 'Visão unificada: Empilhadores & Picking, EFC / EFD, TMR e Planos de Ação Corretiva.',
          color: 'from-amber-500/10 to-transparent'
        };
      case 'quebras-dashboard':
        return {
          breadcrumbs: ['Dashboard', 'Dashboard Quebras'],
          title: 'Dashboard Quebras',
          subtitle: 'Análise detalhada de avarias, perdas por setor e motivos de quebra.',
          color: 'from-sky-500/10 to-transparent'
        };
      case 'fefo-dashboard':
        return {
          breadcrumbs: ['Dashboard', 'Dashboard FEFO'],
          title: 'Dashboard FEFO (Validades)',
          subtitle: 'Indicadores de produtos próximos ao vencimento, lotes em risco e perdas evitadas.',
          color: 'from-emerald-500/10 to-transparent'
        };
      case 'gestao-capacidade':
        return {
          breadcrumbs: ['Dashboard', 'Gestão de Capacidade'],
          title: 'Gestão de Capacidade do Armazém',
          subtitle: 'Monitoramento de ocupação (Central, Picking, Marketplace) com inteligência de transbordo.',
          color: 'from-emerald-500/10 to-transparent'
        };
      case 'picking-dashboard':
        return {
          breadcrumbs: ['Dashboard', 'Dashboard Picking'],
          title: 'Dashboard Picking e Abastecimento',
          subtitle: 'Gargalos operacionais, eficiência de turnos, telemetria de empilhadeira e produtividade.',
          color: 'from-[#1e56f0]/10 to-transparent'
        };
      case 'ajudante':
        return {
          breadcrumbs: ['Setores de Operação', 'Operação Ajudante'],
          title: 'Operação Ajudante',
          subtitle: 'Apontamento unificado de atividades de Ajudante: Repack, Despejo e Quebras.',
          color: 'from-indigo-500/10 to-transparent'
        };
      case 'repack':
        return {
          breadcrumbs: ['Setores de Operação', 'Operação Repack'],
          title: 'Operação Repack',
          subtitle: 'Área para operadores registrarem produtividade e volumes reembalados.',
          color: 'from-purple-500/10 to-transparent'
        };
      case 'despejo':
        return {
          breadcrumbs: ['Setores de Operação', 'Operação Despejo'],
          title: 'Operação Despejo',
          subtitle: 'Lançamento de SKUs de garrafas e líquidos destinados a descarte.',
          color: 'from-rose-500/10 to-transparent'
        };
      case 'armazem':
        return {
          breadcrumbs: ['Setores de Operação', 'Operação Empilhador'],
          title: 'Operação Empilhador',
          subtitle: 'Atendimento de demandas unificadas (EFC/EFD, R&R e TMR) para operadores de empilhadeira.',
          color: 'from-amber-500/10 to-transparent'
        };
      case 'quebras':
        return {
          breadcrumbs: ['Setores de Operação', 'Operação Quebras'],
          title: 'Operação Quebras',
          subtitle: 'Registro imediato de avarias físicas identificadas nas ruas de estoque.',
          color: 'from-red-500/10 to-transparent'
        };
      case 'validades':
        return {
          breadcrumbs: ['Setores de Operação', 'Operação Validade'],
          title: 'Operação Validade',
          subtitle: 'Cadastro de lotes e datas de vencimento para controle de giro (FEFO).',
          color: 'from-emerald-500/10 to-transparent'
        };
      case 'refugo':
        return {
          breadcrumbs: ['Setores de Operação', 'Operação Retorno de Rota'],
          title: 'Operação Retorno de Rota',
          subtitle: 'Acompanhamento e aferimento de retorno de rotas de entrega e devoluções.',
          color: 'from-indigo-500/10 to-transparent'
        };
      case 'empilhador':
        return {
          breadcrumbs: ['Setores de Operação', 'Operação Empilhador'],
          title: 'Operação Empilhador',
          subtitle: 'Atendimento de demandas unificadas (EFC/EFD, R&R e TMR) para operadores de empilhadeira.',
          color: 'from-amber-500/10 to-transparent'
        };
      case 'tmr-dashboard':
        return {
          breadcrumbs: ['Dashboard', 'Dashboard TMR'],
          title: 'Dashboard TMR — Tempo Médio de Revenda',
          subtitle: 'Métricas de tempo médio de permanência na revenda para carretas (meta 1h10) e recargas (meta 40min).',
          color: 'from-amber-500/10 to-transparent'
        };
      case 'conferente':
        return {
          breadcrumbs: ['Setores de Operação', 'Conferente/ADM'],
          title: 'Conferente/ADM',
          subtitle: 'Ecossistema Conferente/ADM — Importação EFC/EFD (03.11.49.02), classificação de pátio e atribuição de colaboradores.',
          color: 'from-teal-500/10 to-transparent'
        };
      case 'registros':
        return {
          breadcrumbs: ['Administração & Gestão', 'Registros de Setores'],
          title: 'Registros de Setores',
          subtitle: 'Visão unificada para acessar os lançamentos e auditorias de todas as frentes de trabalho.',
          color: 'from-emerald-500/10 to-transparent'
        };
      case 'acessos':
        return {
          breadcrumbs: ['Administração & Gestão', 'Controle de Acessos'],
          title: 'Controle de Acessos e Segurança',
          subtitle: 'Auditoria de logins, sessões ativas, horários de entrada/saída e navegação de abas.',
          color: 'from-indigo-500/10 to-transparent'
        };
      case 'cadastros':
        return {
          breadcrumbs: ['Administração & Gestão', 'Cadastros Gerais'],
          title: 'Cadastros Centralizados (Produtos, Colaboradores & Acessos)',
          subtitle: 'Single Source of Truth para o cadastro mestre da unidade.',
          color: 'from-emerald-500/10 to-transparent'
        };
      case 'controle':
        return {
          breadcrumbs: ['Administrativo', 'Painel Controle'],
          title: 'Painel Controle',
          subtitle: 'Gerenciamento de operadores, atribuição de senhas, liberação de turnos.',
          color: 'from-[#1e56f0]/10 to-transparent'
        };
      case 'acoes':
        return {
          breadcrumbs: ['Administração & Gestão', 'Gestão de Ações'],
          title: 'Gestão de Ações & Alertas Operacionais',
          subtitle: 'Acompanhamento de desvios, ocorrências e planos de ação registrados.',
          color: 'from-emerald-500/10 to-transparent'
        };
      case 'exportar':
        return {
          breadcrumbs: ['Sistemas', 'Base de Dados Central'],
          title: 'Base de Dados',
          subtitle: 'Gerenciamento de colaboradores por processo, produtos mestre, metas por operação, importação/expurgo e relatórios.',
          color: 'from-sky-500/10 to-transparent'
        };
      case 'politica-estoque':
        return {
          breadcrumbs: ['Gestão de Estoque', 'Política de Estoque'],
          title: 'Dashboard Política de Estoque (6 Dias)',
          subtitle: 'Aderência à política oficial, alertas de overstock e faltas teóricas.',
          color: 'from-[#1e56f0]/10 to-transparent'
        };
      case 'importacao-contagens':
        return {
          breadcrumbs: ['Gestão de Estoque', 'Importação de Contagens'],
          title: 'Importação de Contagens Físicas',
          subtitle: 'Ambiente exclusivo Drag & Drop para Central, Picking e Marketplace.',
          color: 'from-sky-500/10 to-transparent'
        };
      case 'area-contingencia':
        return {
          breadcrumbs: ['Gestão de Estoque', 'Área de Contingência'],
          title: 'Gestão de Estoque em Contingência',
          subtitle: 'Alocação manual de itens e rastreamento de histórico com observações.',
          color: 'from-amber-500/10 to-transparent'
        };
      case 'venda-media':
        return {
          breadcrumbs: ['Gestão de Estoque', 'Importação Venda Média'],
          title: 'Importação de Venda Média Diária',
          subtitle: 'Carga dos dados de saída diária para cálculo do estoque ideal.',
          color: 'from-teal-500/10 to-transparent'
        };
      case 'pacote-prejuizo':
        return {
          breadcrumbs: ['Dashboard', 'Pacote Prejuízo'],
          title: 'Pacote Prejuízo',
          subtitle: 'Dedução de perdas do Faturamento (R$ 77,3M) e Volume (110k HL) com apuração do custo e receita líquida do hectolitro para a revenda.',
          color: 'from-rose-500/10 to-transparent'
        };
      case 'plataformas-externas':
        return {
          breadcrumbs: ['Ferramentas de Gestão', 'Plataformas Externas'],
          title: 'Plataforma Retorno de Rota, Trocas & Reposições',
          subtitle: 'Ferramentas de Gestão com links de redirecionamento para Plataforma de Retorno de Rota e Plataforma de Trocas e Reposições.',
          color: 'from-amber-500/10 to-transparent'
        };
      case 'agenda-executiva':
        return {
          breadcrumbs: ['Ferramentas de Gestão', 'Agenda Executiva'],
          title: 'Agenda Executiva & Compromissos',
          subtitle: 'Compromissos do dia, semana e mês no Workstation Executivo.',
          color: 'from-blue-500/10 to-transparent'
        };
      case 'diario-bordo':
        return {
          breadcrumbs: ['Ferramentas de Gestão', 'Diário de Bordo'],
          title: 'Diário de Bordo do Colaborador',
          subtitle: 'Anotações diárias, treinamentos e lembretes individuais.',
          color: 'from-amber-500/10 to-transparent'
        };
      case 'reunioes':
        return {
          breadcrumbs: ['Ferramentas de Gestão', 'Reuniões & Treinamentos DPO'],
          title: 'Reuniões & Treinamentos DPO',
          subtitle: 'Frequência, materiais, atas em PDF, alertas diários, Team Room, troca de turno e capacitações.',
          color: 'from-indigo-500/10 to-transparent'
        };
      case 'firebase':
        return {
          breadcrumbs: ['Sistemas', 'Status do Banco'],
          title: 'Conexão Firestore',
          subtitle: 'Configuração e teste de latência do banco de dados na nuvem corporativa.',
          color: 'from-sky-500/10 to-transparent'
        };
      case 'gatilhos':
      case 'workstation-gatilhos':
      case 'desvios-operacionais':
        return {
          breadcrumbs: ['Workstation', 'Gatilhos & Desvios'],
          title: 'Quadro de Gatilhos & Desvios Operacionais',
          subtitle: 'Monitoramento de desvios reais (Média Acumulada / Dias Úteis + 10% Tolerância) correlacionados aos dashboards.',
          color: 'from-amber-500/10 to-transparent'
        };
      case 'desvios':
      case 'desvios-acoes':
        return {
          breadcrumbs: ['Workstation', 'Desvios & Ações'],
          title: 'Tratativa de Desvios & Planos de Ação DPO',
          subtitle: 'Registro de anomalias, análise de 5 porquês, dono e status de execução.',
          color: 'from-rose-500/10 to-transparent'
        };
      default:
        return defaultInfo;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center select-none w-full max-w-md"
        >
          <BrandLogo size="xl" variant="icon-only" className="mb-6 animate-bounce" />
          <CircularLoader
            label="INICIALIZANDO PLATAFORMA..."
            subtitle="Carregando Unidade Guarabira & Sincronizando dados..."
            expectedDurationMs={1500}
            size="lg"
          />
          <span className="text-xs font-black tracking-[3px] text-blue-500 uppercase mt-4">
            PAU BRASIL DISTRIBUIDORA
          </span>
        </motion.div>
      </div>
    );
  }

  // Check if standalone view requested via URL (e.g. ?view=loss-tree or ?standalone=loss-tree)
  const isStandaloneLossTree = typeof window !== 'undefined' && (
    window.location.search.includes('view=loss-tree') || 
    window.location.search.includes('standalone=loss-tree') ||
    window.location.search.includes('arvore-perdas')
  );

  if (isStandaloneLossTree) {
    return (
      <EmpresaDataProvider empresaId={empresa?.id || user?.empresaId || null}>
        <div 
          style={{
            backgroundColor: '#dbeafe',
            backgroundImage: `
              radial-gradient(ellipse 60% 55% at -5% -5%, rgba(29, 78, 216, 0.70) 0%, rgba(37, 99, 235, 0.45) 35%, transparent 75%),
              radial-gradient(ellipse 55% 50% at 105% -5%, rgba(30, 58, 138, 0.65) 0%, rgba(37, 99, 235, 0.45) 35%, transparent 75%),
              radial-gradient(ellipse 65% 60% at 105% 105%, rgba(30, 58, 138, 0.90) 0%, rgba(29, 78, 216, 0.70) 30%, rgba(59, 130, 246, 0.40) 60%, transparent 85%),
              radial-gradient(ellipse 55% 50% at -5% 105%, rgba(37, 99, 235, 0.60) 0%, rgba(96, 165, 250, 0.40) 40%, transparent 75%),
              radial-gradient(ellipse 90% 80% at 50% 50%, #e2eeff 0%, #cee3fe 45%, #b9d7fd 100%)
            `,
            backgroundAttachment: 'fixed',
            backgroundSize: 'cover'
          }}
          className="min-h-screen w-full flex flex-col p-3 md:p-5 font-sans text-slate-900"
        >
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-blue-300/70 bg-white/80 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xs shrink-0">
            <div className="flex items-center gap-3">
              <BrandLogo size="sm" />
              <div>
                <h1 className="text-xs sm:text-sm font-black uppercase tracking-wider text-blue-950 flex items-center gap-2">
                  Árvore de Decomposição de Perdas
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-100 text-amber-900 border border-amber-300">
                    Página Exclusiva (5 Níveis)
                  </span>
                </h1>
                <p className="text-[11px] text-blue-900/70">
                  Visualização dedicada em tela cheia com navegação de ponta a ponta
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                if (window.opener) {
                  window.close();
                } else {
                  window.location.href = window.location.origin + window.location.pathname;
                }
              }}
              className="px-3.5 py-1.5 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer shadow-xs transition-all"
            >
              Voltar ao Sistema
            </button>
          </div>
          <div className="flex-1 w-full overflow-auto">
            <LossHierarchyTree isModal={false} />
          </div>
        </div>
      </EmpresaDataProvider>
    );
  }

  // Active view layout branches: DIRECT LOGIN SCREEN (No intermediate landing page)
  if (!user) {
    return (
      <div className="min-h-screen bg-transparent text-[#1f2937] overflow-x-hidden flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <LoginAuth 
            onAuthSuccess={handleAuthSuccess} 
            onBackToLanding={() => {}} 
          />
        </div>
        <div id="toast" className="toast">Notificação do Co-pilot</div>
      </div>
    );
  }

  const headerInfo = getHeaderInfo(activePanel);

  return (
    <EmpresaDataProvider empresaId={empresa?.id || user?.empresaId || null}>
      <div className={`min-h-screen md:h-screen md:max-h-screen md:overflow-hidden flex flex-col md:flex-row font-sans ${
        theme === 'dark' ? 'bg-[#07090d] text-[#e8eef5]' : 'bg-transparent text-slate-800'
      }`}>
        
        {/* Sidebar navigation - ONLY for Admin users */}
        {getUserRoleType(user) === 'admin' && (
          <Sidebar 
            user={user} 
            empresa={empresa} 
            activeTab={activePanel} 
            onSelectTab={navigateToPanel} 
            onLogout={handleLogout}
            isFbOnline={isCustomFirebaseConnected()}
            theme={theme}
            onToggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
            mobileOpen={mobileSidebarOpen}
            onMobileClose={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* Main workspace arena with smooth tab switching */}
        <div className={`flex-1 flex flex-col h-full md:h-screen overflow-y-auto overflow-x-hidden w-full max-w-full relative ${
          theme === 'dark' ? 'bg-[#07090d]' : 'bg-transparent'
        }`}>
          
          {/* Workspace Top Header (Glassmorphic & Premium) */}
          <header className={`sticky top-0 z-30 backdrop-blur-md px-2.5 sm:px-4 md:px-5 py-2 min-h-[52px] flex items-center justify-between gap-1.5 sm:gap-2 border-b transition-all shrink-0 ${
            theme === 'dark' 
              ? 'bg-[#0b101b]/95 border-[#1c2530]' 
              : 'bg-white/95 md:bg-white/80 border-blue-100/80 shadow-[0_2px_12px_rgba(30,86,240,0.03)]'
          }`}>
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
              {/* Mobile Drawer Toggle Button for Admin */}
              {getUserRoleType(user) === 'admin' && (
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen(true)}
                  className={`p-2 rounded-xl border flex md:hidden items-center justify-center font-black text-xs transition-all cursor-pointer shadow-xs flex-shrink-0 ${
                    theme === 'dark'
                      ? 'bg-[#11151c] border-[#222d3a] text-blue-400 hover:bg-[#18202d]'
                      : 'bg-white border-slate-200 text-[#1e56f0] hover:bg-blue-50'
                  }`}
                  title="Abrir Menu de Navegação"
                >
                  <Menu className="w-4 h-4 text-[#1e56f0]" />
                </button>
              )}

              {/* Workstation Icon Button for Mobile & Quick Access */}
              <button
                type="button"
                onClick={() => {
                  setDashInitialTab(undefined);
                  navigateToPanel('visao-geral');
                }}
                className={`p-2 rounded-xl border flex items-center justify-center font-black text-xs transition-all cursor-pointer shadow-xs flex-shrink-0 hover:scale-[1.02] ${
                  theme === 'dark'
                    ? 'bg-[#11151c] border-[#222d3a] text-blue-400 hover:border-blue-500/50 hover:bg-[#18202d]'
                    : 'bg-blue-50/80 border-blue-200 text-[#1e56f0] hover:bg-blue-100'
                }`}
                title="Workstation / Painel Principal da Operação"
              >
                <LayoutGrid className="w-4 h-4 text-[#1e56f0] flex-shrink-0" />
              </button>

              {/* Back & Forward History Navigation Buttons */}
              {getUserRoleType(user) === 'admin' && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={handleGoBack}
                    disabled={!canGoBack}
                    className={`p-2 rounded-xl border transition-all flex items-center justify-center ${
                      canGoBack
                        ? theme === 'dark'
                          ? 'bg-[#151b23] border-[#222d3a] text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer'
                        : 'opacity-30 cursor-not-allowed bg-transparent border-slate-200/40 text-slate-400'
                    }`}
                    title={canGoBack ? "Mudar de guia / Retornar tela anterior" : "Sem histórico anterior"}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleGoForward}
                    disabled={!canGoForward}
                    className={`p-2 rounded-xl border transition-all flex items-center justify-center ${
                      canGoForward
                        ? theme === 'dark'
                          ? 'bg-[#151b23] border-[#222d3a] text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer'
                        : 'opacity-30 cursor-not-allowed bg-transparent border-slate-200/40 text-slate-400'
                    }`}
                    title={canGoForward ? "Avançar guia / Próxima tela" : "Sem histórico posterior"}
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Sidebar toggle button for Admin */}
              {getUserRoleType(user) === 'admin' && (
                <button
                  type="button"
                  onClick={() => setIsSidebarCollapsed(prev => !prev)}
                  className={`hidden md:flex items-center justify-center p-2 rounded-xl border transition-all cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-[#151b23] border-[#222d3a] text-slate-300 hover:text-white hover:border-slate-600'
                      : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 shadow-xs'
                  }`}
                  title={isSidebarCollapsed ? "Mostrar Menu Lateral" : "Ocultar Menu Lateral"}
                >
                  {isSidebarCollapsed ? <PanelLeftOpen className="w-4 h-4 text-[#1e56f0]" /> : <PanelLeftClose className="w-4 h-4 text-slate-400" />}
                </button>
              )}

              {/* Workstation Location / Page Title & Breadcrumbs */}
              <div className="flex items-center gap-2 min-w-0 flex-shrink truncate ml-1">
                <h1 className={`font-sans font-black text-xs md:text-[13px] tracking-tight uppercase truncate ${
                  theme === 'dark' ? 'text-white' : 'text-slate-900'
                }`}>
                  {headerInfo.title}
                </h1>
                <div className={`hidden lg:block w-[1px] h-3.5 ${theme === 'dark' ? 'bg-[#1c2530]' : 'bg-slate-200'}`} />
                <div className="hidden lg:flex items-center gap-1.5 text-[9px] uppercase font-black tracking-widest text-[#6a7d92] truncate">
                  <span>{headerInfo.breadcrumbs[0]}</span>
                  {headerInfo.breadcrumbs[1] && (
                    <>
                      <span className={`font-bold ${theme === 'dark' ? 'text-[#1c2530]' : 'text-slate-300'}`}>/</span>
                      <span className="text-[#1e56f0]">{headerInfo.breadcrumbs[1]}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right Side Header Controls: 1. Retornar ao Workstation, 2. Sino, 3. Ir Para Operação, 4. Escolher Tema, 5. Logout (Sair) */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              
              {/* 1. BOTAO: RETORNAR AO WORKSTATION */}
              {user && activePanel !== 'visao-geral' && (
                <button
                  type="button"
                  onClick={() => navigateToPanel('visao-geral')}
                  className="bg-[#1e56f0] hover:bg-[#1848c8] text-white px-3 py-1.5 rounded-xl font-black text-[10px] md:text-[11px] uppercase tracking-wider shadow-md shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 border border-blue-400/40 flex-shrink-0"
                  title="Retornar para o Painel Workstation (Centro de Controle)"
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-sky-200 flex-shrink-0" />
                  <span className="whitespace-nowrap font-black">Retornar ao Workstation</span>
                </button>
              )}

              {/* 2. OPERATIONAL NOTIFICATION BELL (SINO) */}
              <OperationalNotificationBell user={user} onNavigate={navigateToPanel} />

              {/* 3. BLUE "IR PARA OPERAÇÃO" BUTTON */}
              {user && (
                <button
                  type="button"
                  onClick={() => {
                    const isSuperOrAdmin = user.isControle || user.papel === 'admin' || user.papel === 'controle' || getUserRoleType(user) === 'admin';
                    if (isSuperOrAdmin) {
                      setDashInitialTab('operacao');
                      navigateToPanel('visao-geral');
                    } else {
                      const targetOp = getUserOperationPanel(user);
                      navigateToPanel(targetOp);
                    }
                  }}
                  className="bg-[#1e56f0] hover:bg-[#1848c8] text-white px-3.5 py-2 rounded-xl font-black text-[10px] md:text-[11px] uppercase tracking-wider shadow-md shadow-blue-500/25 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 border border-blue-400/30 flex-shrink-0"
                  title="Ir diretamente para a tela da operação vinculada ao seu perfil"
                >
                  <Zap className="w-3.5 h-3.5 fill-white text-white flex-shrink-0" />
                  <span className="hidden sm:inline whitespace-nowrap font-black">Ir para Operação</span>
                </button>
              )}

              {/* 5. THEME TOGGLE BUTTON (ESCOLHER O TEMA) */}
              <button
                type="button"
                onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
                className={`px-3 py-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 flex-shrink-0 ${
                  theme === 'dark'
                    ? 'bg-[#151b23] border-[#222d3a] text-amber-400 hover:text-amber-300 hover:border-amber-400/40 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:text-[#1e56f0] hover:bg-slate-50 shadow-xs'
                }`}
                title={theme === 'dark' ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
              >
                {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" /> : <Moon className="w-3.5 h-3.5 text-slate-700 flex-shrink-0" />}
                <span className="text-[10px] font-black uppercase tracking-wider hidden md:inline">
                  {theme === 'dark' ? 'Claro' : 'Escuro'}
                </span>
              </button>

              {/* 4. LOGOUT BUTTON (SAIR / LOGOUT) */}
              <button
                type="button"
                onClick={handleLogout}
                className={`px-3 py-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 flex-shrink-0 ${
                  theme === 'dark'
                    ? 'bg-rose-950/40 border-rose-800/50 text-rose-400 hover:bg-rose-900/60 hover:border-rose-600 shadow-xs'
                    : 'bg-white border-red-200 text-red-600 hover:bg-red-50 shadow-xs'
                }`}
                title="Sair da Conta / Encerrar Sessão"
              >
                <LogOut className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-wider">
                  Sair
                </span>
              </button>
            </div>
          </header>

          {/* Inner Content Body */}
          <main className="flex-1 p-2 md:p-3 lg:p-4.5 relative">
            
            {/* Subtle decorative glow */}
            <div className={`absolute top-0 left-0 w-96 h-96 bg-gradient-to-br ${headerInfo.color} rounded-full blur-3xl pointer-events-none opacity-40 z-0`} />

            <div className={`relative z-10 ${activePanel.endsWith('-dashboard') ? 'max-w-full px-1' : 'max-w-[1300px]'} mx-auto w-full transition-all duration-300`}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activePanel}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                  <Suspense
                    fallback={
                      <CircularLoader
                        label="CARREGANDO MÓDULO..."
                        subtitle="Preparando painel e otimizando dados operacionais..."
                        expectedDurationMs={1100}
                        size="md"
                      />
                    }
                  >
                    {renderActivePanel()}
                  </Suspense>
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>

        {/* Floating dynamic status toaster */}
        <div id="toast" className="toast">Notificação de Pátio</div>

        {/* FLOATING BUTTON FOR DPO AI AGENT */}
        <button
          onClick={() => setIsDpoAgentOpen(true)}
          className="fixed bottom-3 right-3 sm:bottom-5 sm:right-5 z-40 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white p-2.5 sm:p-3.5 rounded-full shadow-2xl flex items-center gap-2 font-black text-xs cursor-pointer border-2 border-white/20 hover:scale-105 transition-all group"
          title="Consultar Agente de IA DPO"
        >
          <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-400 animate-ping absolute -top-0.5 -right-0.5" />
          <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-400 absolute -top-0.5 -right-0.5" />
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="hidden sm:inline font-mono tracking-wider uppercase text-[11px]">Agente DPO IA</span>
        </button>

        {/* AGENTE DPO MODAL */}
        {user && (
          <AgenteDpoModal
            user={user}
            isOpen={isDpoAgentOpen}
            onClose={() => setIsDpoAgentOpen(false)}
            onNavigateToActions={() => {
              setIsDpoAgentOpen(false);
              setActivePanel('simulacao-acoes');
            }}
          />
        )}

        {/* MODAIS GLOBAIS DE AÇÕES: DESVIOS & GATILHOS E MELHORIA & TOR */}
        <ModalAcaoDesvio
          isOpen={isDesvioModalOpen}
          onClose={() => setIsDesvioModalOpen(false)}
          user={user}
          initialData={desvioModalData}
        />

        <ModalAcaoMelhoria
          isOpen={isMelhoriaModalOpen}
          onClose={() => setIsMelhoriaModalOpen(false)}
          user={user}
          initialData={melhoriaModalData}
        />
      </div>
    </EmpresaDataProvider>
  );
}