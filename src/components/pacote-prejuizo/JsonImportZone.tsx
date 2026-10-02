import React, { useState, useRef } from 'react';
import { Upload, FileCode, CheckCircle2, AlertCircle, Download, Trash2, RefreshCw } from 'lucide-react';

interface JsonImportZoneProps {
  titulo: string;
  descricao: string;
  sampleJsonGenerator: () => string;
  sampleFileName: string;
  onImportJson: (jsonContent: string) => { success: boolean; count: number; error?: string };
  onClearData?: () => void;
  currentCount?: number;
  theme?: 'light' | 'dark';
}

export const JsonImportZone: React.FC<JsonImportZoneProps> = ({
  titulo,
  descricao,
  sampleJsonGenerator,
  sampleFileName,
  onImportJson,
  onClearData,
  currentCount = 0,
  theme = 'dark'
}) => {
  const isDark = theme !== 'light';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleProcessFile = (file: File) => {
    if (!file.name.endsWith('.json')) {
      setFeedback({
        type: 'error',
        message: 'Formato inválido! Por favor, selecione um arquivo no formato .json'
      });
      return;
    }

    setIsProcessing(true);
    setFeedback(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const result = onImportJson(content);
        if (result.success) {
          setFeedback({
            type: 'success',
            message: `Arquivo importado com sucesso! ${result.count} registro(s) carregado(s).`
          });
        } else {
          setFeedback({
            type: 'error',
            message: result.error || 'Erro ao processar a estrutura do arquivo JSON.'
          });
        }
      } catch (err: any) {
        setFeedback({
          type: 'error',
          message: `Erro na leitura do arquivo JSON: ${err.message || 'Formato incorreto'}`
        });
      } finally {
        setIsProcessing(false);
      }
    };
    reader.onerror = () => {
      setFeedback({ type: 'error', message: 'Falha ao ler o arquivo selecionado.' });
      setIsProcessing(false);
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleDownloadSample = () => {
    const sample = sampleJsonGenerator();
    const blob = new Blob([sample], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = sampleFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
      isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20">
              <FileCode className="w-4 h-4" />
            </span>
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {titulo}
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {descricao}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {currentCount > 0 && (
            <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {currentCount} registros salvos
            </span>
          )}

          <button
            type="button"
            onClick={handleDownloadSample}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isDark 
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700' 
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
            title="Baixar arquivo JSON de exemplo pré-formatado"
          >
            <Download className="w-3.5 h-3.5 text-rose-500" />
            <span>Baixar Modelo JSON</span>
          </button>

          {onClearData && currentCount > 0 && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Deseja realmente limpar todos os registros importados deste indicador?')) {
                  onClearData();
                  setFeedback({ type: 'success', message: 'Registros limpos com sucesso.' });
                }
              }}
              className="p-1.5 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer"
              title="Limpar registros importados"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Drag & Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
          isDragging 
            ? 'border-rose-500 bg-rose-500/10 scale-[1.01]' 
            : isDark 
              ? 'border-slate-700 hover:border-rose-500/50 bg-slate-950/50 hover:bg-slate-950/80' 
              : 'border-slate-300 hover:border-rose-500/50 bg-slate-50 hover:bg-rose-50/30'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center gap-2">
          <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center">
            {isProcessing ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Upload className="w-5 h-5" />
            )}
          </div>

          <div className="space-y-0.5">
            <p className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              Arraste e solte o arquivo JSON aqui ou <span className="text-rose-500 underline">clique para selecionar</span>
            </p>
            <p className="text-[11px] text-slate-400">
              Formato suportado: .JSON (Array ou Objeto com chaves compatíveis)
            </p>
          </div>
        </div>
      </div>

      {/* Feedback Message */}
      {feedback && (
        <div className={`mt-3 p-3 rounded-xl border flex items-center gap-2.5 text-xs ${
          feedback.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
        }`}>
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}
    </div>
  );
};
