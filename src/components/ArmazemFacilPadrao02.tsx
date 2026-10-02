import React from 'react';
import { Usuario, Empresa } from '../types';
import { Layers, Database, Sparkles, PlusCircle } from 'lucide-react';

interface ArmazemFacilPadrao02Props {
  user?: Usuario;
  empresa?: Empresa | null;
  theme?: 'light' | 'dark';
}

export default function ArmazemFacilPadrao02({
  user,
  empresa,
  theme = 'dark'
}: ArmazemFacilPadrao02Props) {
  return (
    <div id="armazem-facil-padrao-02-page" className="w-full space-y-6 animate-fadeIn">
      {/* Top Banner / Header Card */}
      <div className={`p-6 rounded-2xl border transition-all ${
        theme === 'dark'
          ? 'bg-[#11151c]/90 border-[#222d3a] text-white shadow-xl'
          : 'bg-white border-slate-200 text-slate-900 shadow-sm'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black tracking-tight uppercase">
                  Armazém Fácil Padrão 02
                </h1>
                <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  Padrão 02
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-400 mt-1 font-medium">
                Página em branco padrão configurada e integrada com o banco de dados banco-03-teste.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className={`px-3 py-1.5 rounded-xl border font-mono text-xs flex items-center gap-2 ${
              theme === 'dark'
                ? 'bg-[#151b23] border-[#222d3a] text-slate-300'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>banco-03-teste</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Blank Content Area */}
      <div className={`min-h-[420px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-8 text-center transition-all ${
        theme === 'dark'
          ? 'bg-[#0d1117]/50 border-[#222d3a] text-slate-400'
          : 'bg-slate-50/50 border-slate-200 text-slate-500'
      }`}>
        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 shadow-inner">
          <Sparkles className="w-8 h-8" />
        </div>
        <h2 className={`text-base md:text-lg font-bold tracking-tight mb-1 ${
          theme === 'dark' ? 'text-white' : 'text-slate-800'
        }`}>
          Armazém Fácil Padrão 02
        </h2>
        <p className="text-xs md:text-sm max-w-md mb-6 text-slate-400">
          Esta é a página em branco padrão criada e pronta para receber novos módulos operacionais, tabelas ou formulários.
        </p>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono px-3 py-1 rounded-lg border bg-blue-500/10 border-blue-500/20 text-blue-400 font-semibold">
            Status: Pronto / Ativo
          </span>
        </div>
      </div>
    </div>
  );
}
