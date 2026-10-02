import React, { useState, useEffect } from 'react';
import { Usuario, Empresa } from '../types';
import { BrandLogo } from './BrandLogo';
import { isPanelAllowedForUser, getUserRoleType, getUserOperationPanel } from '../utils/permissions';
import { isExternalDashboard, openExternalDashboard } from '../utils/externalDashboards';
import { CATEGORY_DEFINITIONS } from './CategoryIndexPanel';
import { 
  Zap, 
  BarChart2, 
  Sliders, 
  Database, 
  ListChecks, 
  LogOut, 
  Sun, 
  Moon, 
  Clock, 
  Search, 
  ChevronRight,
  HelpCircle,
  Layers,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react';

interface SidebarProps {
  user: Usuario;
  empresa: Empresa | null;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onLogout: () => void;
  isFbOnline: boolean;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

function SidebarClock({ theme, collapsed }: { theme?: 'light' | 'dark'; collapsed: boolean }) {
  const [timeStr, setTimeStr] = useState('');
  useEffect(() => {
    const tick = () => {
      setTimeStr(new Date().toLocaleTimeString('pt-BR', { hour12: false }));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`font-mono text-xs sm:text-sm tracking-wider select-none font-black flex items-center gap-1.5 justify-center ${
      theme === 'dark' ? 'text-blue-400' : 'text-[#1e56f0]'
    }`}>
      <Clock className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
        theme === 'dark' ? 'text-blue-400' : 'text-[#1e56f0]'
      }`} />
      {!collapsed && <span>{timeStr}</span>}
    </div>
  );
}

export default function Sidebar({
  user,
  empresa,
  activeTab,
  onSelectTab,
  onLogout,
  isFbOnline,
  theme,
  onToggleTheme,
  isCollapsed = false,
  onToggleCollapse,
  mobileOpen,
  onMobileClose
}: SidebarProps) {
  const collapsed = false;
  const [internalMobileOpen, setInternalMobileOpen] = useState(false);
  const isMobileDrawerOpen = mobileOpen !== undefined ? mobileOpen : internalMobileOpen;
  
  const handleCloseMobile = () => {
    if (onMobileClose) {
      onMobileClose();
    } else {
      setInternalMobileOpen(false);
    }
  };

  const [searchQuery, setSearchQuery] = useState('');

  const getInitials = (name: string) => {
    if (!name) return 'OP';
    const split = name.trim().split(' ');
    if (split.length === 1) return split[0].substring(0, 2).toUpperCase();
    return (split[0][0] + split[split.length - 1][0]).toUpperCase();
  };

  // ── THE 5 EXACT CATEGORIES ──
  const mainCategories = [
    {
      id: 'cat-produtividade',
      label: 'Produtividade',
      subtitle: 'Apontamento & Operações',
      icon: <Zap className="w-5 h-5 text-amber-400" />,
      subItems: ['ajudante', 'empilhador', 'conferente', 'montagem']
    },
    {
      id: 'cat-dashboards',
      label: 'Dashboards',
      subtitle: 'Indicadores, BI & Gráficos',
      icon: <BarChart2 className="w-5 h-5 text-sky-400" />,
      subItems: [
        'visao-geral', 'wlp-dashboard', 'repack-dashboard', 'despejo-dashboard', 'quebras-dashboard', 
        'fefo-dashboard', 'picking-dashboard', 'gestao-capacidade', 
        'qualidade', 'pacote-prejuizo', 'trocas-reposicoes', 'retorno-de-rota', 'blitz-de-puxada', 
        'gestao-puxadas-nri', 'gestao-conciliacao-grade', 'kpi-arvore'
      ]
    },
    {
      id: 'cat-ferramentas-gestao',
      label: 'Ferramentas de Gestão',
      subtitle: 'Governança, DPO & Inventários',
      icon: <Sliders className="w-5 h-5 text-blue-400" />,
      subItems: [
        'gatilhos', 'desvios', 'dto-diagnostico', 'dto', 'auditoria-dpo', 'treinamentos-qualidade', 'bloqueio-armazem', 'devolucao', 
        'contagem-inventario', 'gestao-ativos', 'qualidade-puxada', 
        'ciclo-carretas', 'politica-estoque', 'simulador-ressuprimento', 'importacao-contagens', 
        'venda-media', 'area-contingencia', 'padronizacao-processos', 'simulacao-acoes', 
        'dn-swot', 'controle', 'dados-retroativos', 'agenda-executiva', 'diario-bordo', 'reunioes', 'semana-qualidade', 'armazem-facil-padrao-02'
      ]
    },
    {
      id: 'cat-cadastros',
      label: 'Cadastros & Governança',
      subtitle: 'Base Central, Planos, Colaboradores & Ações',
      icon: <Database className="w-5 h-5 text-emerald-400" />,
      subItems: ['cadastros', 'dados-retroativos', 'importacao-dados-retroativos', 'exportar', 'acoes', 'firebase']
    }
  ];

  const handleCategoryClick = (catId: string) => {
    onSelectTab(catId);
    handleCloseMobile();
  };

  const isCategoryActive = (cat: typeof mainCategories[0]) => {
    return activeTab === cat.id || cat.subItems.includes(activeTab);
  };

  // Direct module items matching global search
  const allModulesList = Object.entries(CATEGORY_DEFINITIONS).flatMap(([catKey, catDef]) => {
    return catDef.items.map(item => ({
      ...item,
      catKey
    }));
  });

  const matchingSearchModules = searchQuery.trim()
    ? allModulesList.filter(m => 
        isPanelAllowedForUser(m.id, user) &&
        (m.label.toLowerCase().includes(searchQuery.toLowerCase()) || m.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  return (
    <>
      {/* Mobile Drawer Backdrop Overlay */}
      {isMobileDrawerOpen && (
        <div 
          onClick={handleCloseMobile} 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 md:hidden transition-opacity duration-300"
        />
      )}

      {/* Sidebar Layout */}
      <aside className={`
        ${isMobileDrawerOpen 
          ? 'fixed inset-y-0 left-0 z-50 flex flex-col w-[290px] max-w-[85vw] h-screen h-[100dvh] shadow-2xl overflow-hidden' 
          : 'hidden md:flex md:h-screen shrink-0 flex-shrink-0 overflow-hidden'
        }
        border-r flex-col transition-all duration-300
        ${theme === 'dark' 
          ? 'bg-[#0b0e14] border-[#1c2530]' 
          : 'sidebar-theme-light bg-[#edf5ff] border-blue-200/80 shadow-[4px_0_24px_rgba(30,86,240,0.06)]'
        }
        ${isCollapsed ? 'md:w-0 md:hidden overflow-hidden' : 'md:w-[280px] lg:w-[290px] xl:w-[305px]'}
      `}>
        
        {/* Brand Logo Header with Collapse Toggle */}
        {!collapsed && (
          <div className="p-3.5 flex items-center justify-between border-b border-blue-200/60 dark:border-[#1c2530]/40 flex-shrink-0 bg-white/40 dark:bg-transparent backdrop-blur-xs relative z-10">
            <div className="flex-1 flex justify-center pl-2">
              <BrandLogo variant="header" theme={theme} />
            </div>
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer hidden md:flex items-center justify-center ${
                  theme === 'dark'
                    ? 'bg-[#151b23] border-[#222d3a] text-slate-400 hover:text-white hover:bg-slate-800'
                    : 'bg-white/80 border-blue-200 text-slate-600 hover:text-slate-900 hover:bg-white shadow-xs'
                }`}
                title="Ocultar Menu Lateral (Maximizar Tela de Operação)"
              >
                <PanelLeftClose className="w-4 h-4 text-amber-500" />
              </button>
            )}
          </div>
        )}

        {/* Mobile close button inside drawer */}
        {isMobileDrawerOpen && (
          <div className="absolute top-2.5 right-2.5 z-50 md:hidden">
            <button 
              onClick={handleCloseMobile}
              className={`w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer transition-colors border font-bold text-sm ${
                theme === 'dark'
                  ? 'bg-[#151b23] border-[#222d3a] text-[#8a9db2] hover:text-[#ef4444] hover:bg-[#ef4444]/10'
                  : 'bg-white/95 border-slate-200 text-slate-600 hover:text-red-600 hover:bg-red-50 shadow-sm'
              }`}
              title="Fechar Menu"
            >
              ✕
            </button>
          </div>
        )}

        {/* User Card */}
        {!collapsed && (
          <div className={`p-3 mx-2 mt-2 rounded-xl border transition-all duration-300 relative z-10 overflow-hidden group ${
            theme === 'dark' 
              ? 'bg-[#11151c]/60 border-[#1c2530] hover:border-[#1e56f0]/25' 
              : 'bg-white/70 backdrop-blur-md border-blue-200/80 shadow-[0_4px_20px_rgba(30,86,240,0.05)] hover:border-blue-300'
          }`}>
            <div className="flex items-center gap-2.5 relative z-10">
              <div className={`w-9 h-9 rounded-full border flex items-center justify-center font-black text-xs sm:text-sm shadow-xs flex-shrink-0 transition-all ${
                theme === 'dark'
                  ? 'bg-gradient-to-tr from-[#1e56f0]/20 to-[#1e56f0]/5 border-[#1e56f0]/30 text-blue-400'
                  : 'bg-blue-50 border-blue-200 text-[#1e56f0]'
              }`}>
                {getInitials(user.nome)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[9px] sm:text-[10px] uppercase font-black text-[#1e56f0] tracking-widest truncate">
                  Colaborador
                </div>
                <div className={`text-xs sm:text-[13px] truncate font-extrabold leading-tight ${
                  theme === 'dark' ? 'text-white' : 'text-slate-800'
                }`}>
                  {user.nome || 'Operador'}
                </div>
                <div className={`text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider mt-0.5 flex items-center gap-1 ${
                  theme === 'dark' ? 'text-[#8a9db2]' : 'text-slate-500'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1e56f0] animate-pulse" />
                  {user.papel === 'admin' ? 'Administração' : (user.papel === 'controle' || user.isControle) ? 'Supervisor' : 'Operações'}
                </div>
              </div>
            </div>
            
            <div className={`flex items-center justify-between gap-2 mt-2.5 pt-2 border-t ${
              theme === 'dark' ? 'border-[#1c2530]' : 'border-blue-100/60'
            }`}>
              <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border rounded-md ${
                theme === 'dark'
                  ? 'bg-emerald-500/20 border-emerald-500/20 text-emerald-400'
                  : 'bg-emerald-500/10 border-emerald-500/15 text-emerald-600'
              }`}>
                ✓ ATIVO
              </span>
              <div className="flex items-center gap-1.5 ml-auto">
                <button 
                  onClick={onToggleTheme}
                  className={`text-xs font-bold rounded-md px-2 py-1 flex items-center gap-1 cursor-pointer transition-colors border ${
                    theme === 'dark'
                      ? 'bg-[#151b23] border-[#222d3a] text-amber-400 hover:text-amber-300'
                      : 'bg-white/80 border-slate-200 text-slate-700 hover:text-[#1e56f0] shadow-2xs'
                  }`}
                  title={theme === 'dark' ? 'Tema Claro' : 'Tema Escuro'}
                >
                  {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-700" />}
                </button>
                <button 
                  onClick={onLogout}
                  className={`text-xs font-bold rounded-md px-2 py-1 flex items-center gap-1.5 cursor-pointer transition-colors border-none ${
                    theme === 'dark'
                      ? 'text-[#8a9db2] hover:text-rose-400 hover:bg-[#ef4444]/10'
                      : 'text-slate-600 hover:text-red-600 hover:bg-red-500/10'
                  }`}
                  title="Sair da Conta"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>SAIR</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Global Search Input in Sidebar */}
        {!collapsed && (
          <div className="px-2.5 pt-3 relative z-10">
            <div className="relative">
              <Search className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${
                theme === 'dark' ? 'text-[#6a7d92]' : 'text-slate-400'
              }`} />
              <input 
                type="text"
                placeholder="Buscar módulo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full border rounded-lg pl-8 pr-6 py-1.5 font-sans text-xs outline-none transition-all ${
                  theme === 'dark'
                    ? 'bg-[#11151c]/50 border-[#1c2530] text-white placeholder-[#6a7d92] focus:border-[#1e56f0]/40 focus:bg-[#11151c]'
                    : 'bg-white/80 backdrop-blur-xs border-blue-200/80 text-slate-800 placeholder-slate-400 focus:border-[#1e56f0] focus:bg-white shadow-2xs'
                }`}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-xs border-none bg-transparent cursor-pointer ${
                    theme === 'dark' ? 'text-[#6a7d92] hover:text-white' : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}

        {/* Main 5 Category Navigation List */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-2 scrollbar-thin relative z-10">
          {searchQuery.trim() !== '' ? (
            /* Search results view */
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400 px-2 block">
                Resultados ({matchingSearchModules.length}):
              </span>
              {matchingSearchModules.map(m => (
                <button
                  key={m.id}
                  onClick={() => {
                    if (isExternalDashboard(m.id)) {
                      openExternalDashboard(m.id);
                    } else {
                      onSelectTab(m.id);
                    }
                    handleCloseMobile();
                  }}
                  className="w-full text-left p-2 rounded-lg bg-white/80 dark:bg-[#11151c] hover:bg-sky-600/20 border border-blue-200/80 dark:border-slate-800 hover:border-sky-500/40 text-xs font-bold text-slate-800 dark:text-white flex items-center justify-between cursor-pointer shadow-2xs"
                >
                  <span className="truncate">{m.label}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                </button>
              ))}
              {matchingSearchModules.length === 0 && (
                <div className="p-4 text-center text-xs text-slate-500">
                  Nenhum módulo encontrado.
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {/* ROOT NAVIGATION TAB: WORKSTATION */}
              <button
                onClick={() => handleCategoryClick('visao-geral')}
                className={`w-full text-left p-3 rounded-xl border transition-all duration-200 cursor-pointer flex items-center gap-3 relative overflow-hidden group mb-2 ${
                  activeTab === 'visao-geral' || activeTab === 'dashboard'
                    ? theme === 'dark'
                      ? 'bg-gradient-to-r from-[#1e56f0]/30 to-[#1e56f0]/10 border-[#1e56f0] text-white shadow-lg'
                      : 'bg-gradient-to-r from-[#1e56f0] to-[#2563eb] text-white border-[#1e56f0] shadow-md shadow-blue-500/20 font-bold'
                    : theme === 'dark'
                      ? 'bg-[#11151c]/70 border-[#1c2530] text-slate-200 hover:bg-[#151b23] hover:border-slate-600'
                      : 'bg-white/60 backdrop-blur-xs border-blue-200/70 text-slate-800 hover:bg-white hover:border-blue-300 shadow-2xs'
                }`}
              >
                {(activeTab === 'visao-geral' || activeTab === 'dashboard') && (
                  <span className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-400 rounded-r" />
                )}

                <div className={`p-2 rounded-lg flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                  activeTab === 'visao-geral' || activeTab === 'dashboard'
                    ? 'bg-amber-400 text-slate-950 font-black'
                    : theme === 'dark' ? 'bg-[#0b1222] text-amber-400' : 'bg-blue-50 text-[#1e56f0] shadow-xs'
                }`}>
                  <LayoutDashboard className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-xs font-black uppercase tracking-wider truncate leading-snug">
                    Workstation
                  </div>
                  <div className={`text-[9.5px] truncate font-bold ${
                    activeTab === 'visao-geral' || activeTab === 'dashboard'
                      ? 'text-amber-300'
                      : 'text-slate-400'
                  }`}>
                    Centro de Controle (Raiz)
                  </div>
                </div>

                <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-transform ${
                  activeTab === 'visao-geral' || activeTab === 'dashboard' ? 'text-amber-400 translate-x-0.5' : 'text-slate-400 group-hover:translate-x-0.5'
                }`} />
              </button>

              <div className="w-full h-[1px] bg-blue-200/60 dark:bg-[#1c2530] my-2" />

              {/* The Categories List - Displayed for ADMIN / SUPERVISOR profiles */}
              {(getUserRoleType(user) === 'admin') && mainCategories.map((cat) => {
              const active = isCategoryActive(cat);
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all duration-200 cursor-pointer flex items-center gap-3 relative overflow-hidden group ${
                    active
                      ? theme === 'dark'
                        ? 'bg-sky-500/15 border-sky-500/40 text-white shadow-md'
                        : 'bg-blue-500/15 backdrop-blur-xs border-blue-400/60 text-[#1e56f0] shadow-sm font-bold'
                      : theme === 'dark'
                        ? 'bg-[#11151c]/40 border-[#1c2530] text-slate-300 hover:bg-[#151b23] hover:border-slate-700 hover:text-white'
                        : 'bg-white/50 backdrop-blur-xs border-blue-200/60 text-slate-700 hover:bg-white hover:border-blue-300 hover:text-slate-900 shadow-2xs'
                  }`}
                >
                  {active && (
                    <span className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#1e56f0] rounded-r" />
                  )}

                  <div className={`p-2 rounded-lg flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                    active 
                      ? 'bg-[#1e56f0] text-white' 
                      : theme === 'dark' ? 'bg-[#0b1222] text-slate-400' : 'bg-blue-50 text-slate-600 shadow-xs'
                  }`}>
                    {cat.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-black uppercase tracking-wider truncate leading-snug">
                      {cat.label}
                    </div>
                    <div className={`text-[10px] truncate font-medium ${
                      active ? 'text-sky-600 dark:text-sky-300 font-semibold' : 'text-slate-400'
                    }`}>
                      {cat.subtitle}
                    </div>
                  </div>

                  <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-transform ${
                    active ? 'text-sky-500 dark:text-sky-400 translate-x-0.5' : 'text-slate-400 group-hover:translate-x-0.5'
                  }`} />
                </button>
              );
            })}
          </div>
          )}
        </nav>

        {/* Footer info & clock */}
        <div className={`p-2.5 border-t flex flex-col gap-1.5 items-center text-center mt-auto flex-shrink-0 relative z-10 ${
          theme === 'dark'
            ? 'border-[#1c2530] bg-[#07090d]/60'
            : 'border-blue-200/60 bg-white/60 backdrop-blur-xs'
        }`}>
          <SidebarClock theme={theme} collapsed={collapsed} />

          {!collapsed && (
            <div className={`w-full py-1.5 px-2 rounded-md font-sans font-black text-[9.5px] sm:text-[10px] tracking-widest text-center border transition-all flex items-center justify-center gap-1.5 ${
              isFbOnline 
                ? theme === 'dark'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20'
                  : 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30'
                : theme === 'dark'
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/20'
                  : 'bg-rose-500/15 text-rose-700 border-rose-500/30'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isFbOnline ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              <span>{isFbOnline ? 'ONLINE' : 'DESCONECTADO'}</span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
