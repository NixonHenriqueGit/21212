import React from 'react';
import { ExternalLink, ArrowLeft, ArrowRightLeft } from 'lucide-react';
import { Usuario, Empresa } from '../types';
import { openExternalDashboard } from '../utils/externalDashboards';

interface TrocasEReposicoesDashboardProps {
  user: Usuario;
  empresa?: Empresa | null;
  onBack?: () => void;
  theme?: 'light' | 'dark';
}

const EXTERNAL_URL = 'https://djeanderson1105-code.github.io/ARMAZ-M-/';

export default function TrocasEReposicoesDashboard({
  onBack,
  theme = 'dark'
}: TrocasEReposicoesDashboardProps) {
  const isDark = theme !== 'light';

  const handleOpenExternal = () => {
    openExternalDashboard('trocas-reposicoes');
  };

  return (
    <div className={`min-h-[70vh] flex items-center justify-center p-4 sm:p-6 ${
      isDark ? 'text-slate-100' : 'text-slate-900'
    }`}>
      <div className={`w-full max-w-lg p-8 rounded-3xl border text-center space-y-6 shadow-2xl transition-all ${
        isDark ? 'bg-[#0f172a] border-cyan-500/30' : 'bg-white border-cyan-200 shadow-xl'
      }`}>
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center mx-auto shadow-inner">
          <ArrowRightLeft className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">
            Portal Externo Integrado
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-100 dark:text-white">
            Trocas e Reposições
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Acesse o portal oficial de Trocas e Reposições em uma nova guia do seu navegador sem sair do sistema principal.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className={`w-full sm:w-auto px-4 py-2.5 rounded-xl border text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all ${
                isDark 
                  ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white' 
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenExternal}
            className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/30 cursor-pointer transition-all"
          >
            <span>Abrir em Nova Guia</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

