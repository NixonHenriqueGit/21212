import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  ExternalLink, 
  FileText, 
  Maximize2, 
  Minimize2, 
  Printer, 
  AlertCircle,
  ZoomIn,
  ZoomOut,
  RotateCw
} from 'lucide-react';
import { createSafePdfBlobUrl, downloadPdfFile } from '../utils/sopUtils';

export interface PdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName?: string;
  title?: string;
  code?: string;
  theme?: 'light' | 'dark';
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  isOpen,
  onClose,
  fileUrl,
  fileName = 'Documento.pdf',
  title = 'Visualização de Padrão Operacional / PDF',
  code,
  theme = 'dark'
}) => {
  const [blobUrl, setBlobUrl] = useState<string>('');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [zoom, setZoom] = useState(100);

  const isDark = theme !== 'light';

  useEffect(() => {
    if (!isOpen || !fileUrl) {
      setBlobUrl('');
      setLoadError(false);
      return;
    }

    try {
      const safe = createSafePdfBlobUrl(fileUrl);
      setBlobUrl(safe);
      setLoadError(false);
    } catch (e) {
      console.error('Erro ao gerar URL segura para o PDF:', e);
      setBlobUrl(fileUrl);
    }
  }, [isOpen, fileUrl]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (fileUrl) {
      downloadPdfFile(fileUrl, fileName);
    }
  };

  const handlePrint = () => {
    if (blobUrl) {
      const printWindow = window.open(blobUrl, '_blank');
      if (printWindow) {
        printWindow.focus();
      }
    }
  };

  const handleOpenExternal = () => {
    if (!blobUrl) return;
    const a = document.createElement('a');
    a.href = blobUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div 
        className={`w-full flex flex-col rounded-2xl shadow-2xl border transition-all ${
          isFullScreen 
            ? 'fixed inset-2 z-50 h-[calc(100vh-16px)]' 
            : 'max-w-5xl h-[90vh] max-h-[920px]'
        } ${isDark ? 'bg-[#0e1726] border-indigo-500/30 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
      >
        {/* HEADER BAR */}
        <div className={`p-3 sm:p-4 border-b flex items-center justify-between gap-3 shrink-0 rounded-t-2xl ${
          isDark ? 'bg-[#152342] border-indigo-500/30' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {code && (
                  <span className="font-mono text-[11px] font-black px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                    {code}
                  </span>
                )}
                <h3 className="font-extrabold text-sm sm:text-base truncate">
                  {title}
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                Arquivo: <span className="font-mono text-emerald-400 font-bold">{fileName}</span>
              </p>
            </div>
          </div>

          {/* CONTROLS & ACTIONS */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Zoom Controls */}
            <div className="hidden md:flex items-center gap-1 bg-black/30 p-1 rounded-xl border border-white/10 mr-1">
              <button 
                onClick={() => setZoom(prev => Math.max(50, prev - 15))}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer"
                title="Diminuir Zoom"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-mono font-bold px-1.5 text-slate-300">{zoom}%</span>
              <button 
                onClick={() => setZoom(prev => Math.min(200, prev + 15))}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer"
                title="Aumentar Zoom"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            {/* Print */}
            <button
              onClick={handlePrint}
              className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all border border-slate-700 cursor-pointer hidden sm:flex"
              title="Imprimir Documento"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
              title="Baixar PDF Original"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Baixar PDF</span>
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all border border-slate-700 cursor-pointer"
              title={isFullScreen ? "Restaurar Janela" : "Tela Cheia"}
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-xl transition-all border border-rose-500/30 cursor-pointer ml-1"
              title="Fechar Visualizador"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PDF VIEWPORT CONTAINER */}
        <div className="flex-1 w-full h-full min-h-0 bg-[#070b14] relative overflow-hidden flex items-center justify-center rounded-b-2xl">
          {loadError || !blobUrl ? (
            <div className="p-8 text-center max-w-md space-y-4">
              <AlertCircle className="w-12 h-12 text-amber-400 mx-auto" />
              <div>
                <h4 className="font-extrabold text-base text-white">Não foi possível embutir o PDF</h4>
                <p className="text-xs text-slate-400 mt-1">
                  O navegador bloqueou a renderização interna por restrição de visualização ou o arquivo é muito grande.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={handleDownload}
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase rounded-xl flex items-center gap-2 cursor-pointer shadow-lg"
                >
                  <Download className="w-4 h-4" />
                  Baixar Arquivo PDF
                </button>
                <button
                  onClick={handleOpenExternal}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase rounded-xl flex items-center gap-2 cursor-pointer border border-slate-700"
                >
                  <ExternalLink className="w-4 h-4" />
                  Abrir em Nova Aba
                </button>
              </div>
            </div>
          ) : (
            <div 
              className="w-full h-full flex items-center justify-center p-1 sm:p-2"
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center', transition: 'transform 0.15s ease-out' }}
            >
              <object
                data={`${blobUrl}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`}
                type="application/pdf"
                className="w-full h-full rounded-xl border border-slate-800/80 bg-white"
                onError={() => setLoadError(true)}
              >
                <iframe
                  src={`${blobUrl}#toolbar=1&navpanes=0`}
                  className="w-full h-full rounded-xl border border-slate-800/80 bg-white"
                  title={title}
                  onError={() => setLoadError(true)}
                >
                  <div className="p-8 text-center text-white space-y-3">
                    <p className="text-sm font-bold">Seu navegador não suporta visualização direta de PDF.</p>
                    <button
                      onClick={handleDownload}
                      className="px-4 py-2 bg-emerald-500 text-slate-950 font-black text-xs rounded-xl"
                    >
                      Baixar PDF
                    </button>
                  </div>
                </iframe>
              </object>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
