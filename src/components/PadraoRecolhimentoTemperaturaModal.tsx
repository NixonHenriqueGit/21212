import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Upload, 
  Download, 
  ExternalLink, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Clock, 
  Thermometer, 
  ShieldCheck,
  FileCheck,
  Printer
} from 'lucide-react';
import { 
  PadraoTemperaturaDoc, 
  getStoredPadraoTemperaturaDoc, 
  savePadraoTemperaturaDoc, 
  deletePadraoTemperaturaDoc, 
  exportarPadraoTemperaturaOficialPdf 
} from '../utils/padraoTemperaturaStorage';
import { downloadDataUrl, openDataUrlInNewTab } from '../utils/pragasStorage';

interface PadraoRecolhimentoTemperaturaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PadraoRecolhimentoTemperaturaModal: React.FC<PadraoRecolhimentoTemperaturaModalProps> = ({
  isOpen,
  onClose
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [doc, setDoc] = useState<PadraoTemperaturaDoc | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [observacao, setObservacao] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadDoc();
    }
  }, [isOpen]);

  const loadDoc = async () => {
    const stored = await getStoredPadraoTemperaturaDoc();
    setDoc(stored);
    if (stored?.observacao) {
      setObservacao(stored.observacao);
    }
  };

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setStatusMsg({ type: 'error', text: 'Por favor, selecione apenas arquivos em formato PDF (.pdf).' });
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      const docItem: PadraoTemperaturaDoc = {
        fileName: file.name,
        fileDataUrl: dataUrl,
        dataUpload: new Date().toISOString(),
        tamanhoKb: Math.round(file.size / 1024),
        observacao: observacao.trim()
      };

      await savePadraoTemperaturaDoc(docItem);
      setDoc(docItem);
      setIsUploading(false);
      setStatusMsg({ type: 'success', text: 'Documento do Padrão de Temperatura importado e salvo com sucesso!' });
      setTimeout(() => setStatusMsg(null), 4000);
    };

    reader.onerror = () => {
      setIsUploading(false);
      setStatusMsg({ type: 'error', text: 'Erro ao processar o arquivo PDF.' });
    };

    reader.readAsDataURL(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    if (!confirm('Deseja realmente remover o documento do padrão de recolhimento de temperatura?')) return;
    await deletePadraoTemperaturaDoc();
    setDoc(null);
    setObservacao('');
    setStatusMsg({ type: 'success', text: 'Documento excluído com sucesso.' });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-[#0b1222] border border-cyan-500/40 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#111a30] via-[#0e172e] to-[#111a30] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black uppercase text-white tracking-wide">
                  Padrão de Recolhimento de Temperatura
                </h3>
                <span className="text-[10px] font-black uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded">
                  POP-DPO
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Procedimento Operacional Padrão e Lição de Um Ponto (LUP) do Armazém Geral
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
          {/* Status Message */}
          {statusMsg && (
            <div className={`p-3 rounded-xl flex items-center gap-2 border font-bold ${
              statusMsg.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
            }`}>
              {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* UPLOAD SECTION */}
          <div className="bg-[#111a30] border-2 border-dashed border-cyan-500/40 rounded-xl p-5 text-center space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="w-12 h-12 mx-auto rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Upload className="w-6 h-6" />
            </div>

            <div>
              <strong className="text-sm text-white block">
                {doc ? 'Substituir Documento do Padrão (.PDF)' : 'Importar Documento do Padrão (.PDF)'}
              </strong>
              <p className="text-[11px] text-slate-400 max-w-md mx-auto mt-1">
                Anexe o arquivo oficial do Procedimento Operacional Padrão (POP) ou LUP assinado pela liderança para consulta e auditorias DPO.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-black uppercase text-[11px] tracking-wider transition-all cursor-pointer shadow-md flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                {isUploading ? 'Processando PDF...' : 'Selecionar Arquivo PDF'}
              </button>

              <button
                type="button"
                onClick={exportarPadraoTemperaturaOficialPdf}
                className="px-4 py-2 bg-[#0b1222] hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 rounded-xl font-black uppercase text-[11px] tracking-wider transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                title="Gerar e baixar PDF do modelo oficial do padrão para impressão"
              >
                <Printer className="w-3.5 h-3.5" />
                Baixar Modelo Oficial em PDF
              </button>
            </div>
          </div>

          {/* ARQUIVO ATUAL IMPORTADO (SE HOUVER) */}
          {doc && doc.fileDataUrl && (
            <div className="bg-emerald-950/20 border border-emerald-500/40 rounded-xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <strong className="text-white text-xs font-bold block truncate max-w-xs sm:max-w-md">
                      {doc.fileName}
                    </strong>
                    <span className="text-[10px] text-emerald-400 font-mono">
                      Importado em: {new Date(doc.dataUpload).toLocaleDateString('pt-BR')} às {new Date(doc.dataUpload).toLocaleTimeString('pt-BR')}
                      {doc.tamanhoKb ? ` • ${doc.tamanhoKb} KB` : ''}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => openDataUrlInNewTab(doc.fileDataUrl, doc.fileName)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-black uppercase flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                    title="Visualizar documento em outra guia em tela cheia"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Visualizar em Outra Guia
                  </button>

                  <button
                    type="button"
                    onClick={() => downloadDataUrl(doc.fileDataUrl, doc.fileName)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-black uppercase flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                    title="Baixar arquivo PDF anexado"
                  >
                    <Download className="w-3.5 h-3.5" /> Baixar PDF
                  </button>

                  <button
                    type="button"
                    onClick={handleDelete}
                    className="p-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 rounded-lg cursor-pointer transition-all"
                    title="Excluir arquivo anexado"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* RESUMO OPERACIONAL DO PADRÃO DPO */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase text-white tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              Diretrizes Oficiais de Recolhimento de Temperatura
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-[#111a30] border border-slate-800 rounded-xl p-3 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" /> 3 Horários Fixos
                </span>
                <p className="text-xs font-bold text-white">09:00 • 16:00 • 22:00</p>
                <span className="text-[10px] text-slate-400">Obrigatório diariamente</span>
              </div>

              <div className="bg-[#111a30] border border-slate-800 rounded-xl p-3 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                  <Thermometer className="w-3.5 h-3.5 text-cyan-400" /> Faixa Permitida
                </span>
                <p className="text-xs font-bold text-emerald-400">18.0°C a 28.0°C</p>
                <span className="text-[10px] text-slate-400">Limite crítico: &gt; 28.0°C</span>
              </div>

              <div className="bg-[#111a30] border border-slate-800 rounded-xl p-3 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> Posicionamento
                </span>
                <p className="text-xs font-bold text-white">1,50 m do Solo</p>
                <span className="text-[10px] text-slate-400">Coluna central sem sol direto</span>
              </div>
            </div>

            {/* Checklist operacional do conferente */}
            <div className="bg-[#111a30] border border-slate-800 rounded-xl p-4 space-y-2">
              <span className="text-[11px] font-bold uppercase text-slate-300 block">
                Procedimento Rápido do Conferente (LUP)
              </span>
              <ul className="space-y-1.5 text-[11px] text-slate-400 list-disc list-inside">
                <li><strong className="text-slate-200">1. Estabilização:</strong> Posicione-se em frente ao display do termohigrômetro e aguarde 30 segundos.</li>
                <li><strong className="text-slate-200">2. Leitura Exata:</strong> Anote o valor com uma casa decimal (ex: 25.4°C).</li>
                <li><strong className="text-slate-200">3. Registro Instantâneo:</strong> Lance diretamente no sistema ou na planilha com seu nome.</li>
                <li><strong className="text-slate-200">4. Alerta Imediato (&gt; 28.0°C):</strong> Se atingir mais de 28°C, comunique imediatamente a liderança e acione o plano térmico de docas e exaustores.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#111a30] border-t border-slate-800 flex items-center justify-between gap-3">
          <span className="text-[10px] text-slate-400">
            Padrão auditado conforme critérios DPO de Qualidade e Governança
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
