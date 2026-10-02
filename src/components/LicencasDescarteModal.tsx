import React from 'react';
import { X, ShieldCheck, Truck, ExternalLink } from 'lucide-react';
import { LicencasDescarteSection } from './LicencasDescarteSection';

interface LicencasDescarteModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'light' | 'dark';
}

export const LicencasDescarteModal: React.FC<LicencasDescarteModalProps> = ({
  isOpen,
  onClose,
  theme = 'dark'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="bg-[#070e17] border border-emerald-500/30 rounded-3xl w-full max-w-6xl max-h-[92vh] overflow-y-auto shadow-2xl relative flex flex-col">
        {/* Top bar */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-[#070e17]/95 border-b border-slate-800 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                Central de Licenças & Recibos de Descarte Oficial
              </h3>
              <p className="text-[11px] text-slate-400">
                SUDEMA (LO Nº 599/2020) & Recibos Pedro Cidelino Recicláveis
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 border border-slate-700 transition-all cursor-pointer"
            title="Fechar Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <LicencasDescarteSection theme={theme} onClose={onClose} isModal={true} />
        </div>
      </div>
    </div>
  );
};
export default LicencasDescarteModal;
