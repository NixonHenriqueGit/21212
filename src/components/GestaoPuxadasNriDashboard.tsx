import React, { useState } from 'react';
import { ExternalLink, ArrowLeft, Container, Copy, Check, Maximize2 } from 'lucide-react';
import { Usuario, Empresa } from '../types';
import { openExternalDashboard } from '../utils/externalDashboards';

interface GestaoPuxadasNriDashboardProps {
  user: Usuario;
  empresa?: Empresa | null;
  onBack?: () => void;
  theme?: 'light' | 'dark';
}

const EXTERNAL_URL = 'https://aistudio.google.com/apps/584e1d8a-7eb8-4f7e-bec2-c69b4ef6323a?showAssistant=true&project=gen-lang-client-0624437496&showPreview=true';

export default function GestaoPuxadasNriDashboard({
  onBack,
  theme = 'dark'
}: GestaoPuxadasNriDashboardProps) {
  const isDark = theme !== 'light';
  const [copied, setCopied] = useState(false);

  const handleOpenExternal = () => {
    openExternalDashboard('gestao-puxadas-nri');
  };

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(EXTERNAL_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`min-h-[75vh] flex items-center justify-center p-4 sm:p-6 ${
      isDark ? 'text-slate-100' : 'text-slate-900'
    }`}>
      <div className={`w-full max-w-xl p-8 rounded-3xl border text-center space-y-6 shadow-2xl transition-all ${
        isDark ? 'bg-[#0f172a] border-amber-500/30 shadow-amber-950/20' : 'bg-white border-amber-200 shadow-xl'
      }`}>
        {/* New Icon container */}
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-amber-500/5 text-amber-500 border border-amber-500/30 flex items-center justify-center mx-auto shadow-inner">
          <Container className="w-10 h-10" />
        </div>

        <div className="space-y-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <span>Módulo Integrado</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>Puxadas & NRI</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-100 dark:text-white">
            Gestão de Puxadas e NRI
          </h2>

          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            Painel avançado de controle operacional para transferências, agendamento de carretas, monitoramento de fluxos de puxada e gestão de Notas de Recebimento Inbound (NRI).
          </p>

          <div className="pt-2">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[11px] font-mono max-w-full overflow-hidden ${
              isDark ? 'bg-slate-900/80 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
              <span className="text-amber-500 font-bold shrink-0">URL:</span>
              <span className="truncate max-w-[280px] sm:max-w-[360px]">{EXTERNAL_URL}</span>
              <button
                type="button"
                onClick={handleCopy}
                title="Copiar Link"
                className="p-1 hover:text-amber-500 transition-colors shrink-0 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className={`w-full sm:w-auto px-5 py-3 rounded-xl border text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all ${
                isDark 
                  ? 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white' 
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
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Acessar Puxadas e NRI</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
