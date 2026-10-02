import React, { useState, useRef } from 'react';
import { 
  FileCode, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Download, 
  Database, 
  Trash2, 
  Clock, 
  Truck, 
  Users, 
  X, 
  Check, 
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';
import { 
  parseTmrJson, 
  importCompletedTmrJsonBatch, 
  ParsedTmrResult, 
  SAMPLE_TMR_JSON 
} from '../utils/tmrManager';

interface ImportTmrJsonModalProps {
  isOpen: boolean;
  onClose: () => void;
  empresaId: string;
  onSuccess?: (count: number) => void;
  theme?: 'light' | 'dark';
}

export function ImportTmrJsonModal({
  isOpen,
  onClose,
  empresaId,
  onSuccess,
  theme = 'dark'
}: ImportTmrJsonModalProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [jsonText, setJsonText] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [parsedResult, setParsedResult] = useState<ParsedTmrResult | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [copiedSample, setCopiedSample] = useState<boolean>(false);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        setJsonText(content);
        const result = parseTmrJson(content, empresaId);
        setParsedResult(result);
      } catch (err: any) {
        setParsedResult({
          valid: false,
          error: 'Erro na leitura do arquivo JSON.',
          items: [],
          rawCount: 0,
          totalDurationMin: 0,
          avgDurationMin: 0,
          dentroSlaCount: 0,
          foraSlaCount: 0
        });
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsText(file);
  };

  const handlePasteChange = (text: string) => {
    setJsonText(text);
    if (!text.trim()) {
      setParsedResult(null);
      return;
    }
    const result = parseTmrJson(text, empresaId);
    setParsedResult(result);
  };

  const handleLoadSample = () => {
    setJsonText(SAMPLE_TMR_JSON);
    const result = parseTmrJson(SAMPLE_TMR_JSON, empresaId);
    setParsedResult(result);
    setFileName('modelo_exemplo.json');
  };

  const handleCopySample = () => {
    navigator.clipboard.writeText(SAMPLE_TMR_JSON);
    setCopiedSample(true);
    setTimeout(() => setCopiedSample(false), 2000);
  };

  const handleClear = () => {
    setJsonText('');
    setFileName('');
    setParsedResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmImport = () => {
    if (!parsedResult || !parsedResult.valid || parsedResult.items.length === 0) return;

    const res = importCompletedTmrJsonBatch(empresaId, parsedResult.items, importMode);
    if (res.success) {
      setSuccessToast(`✅ Sucesso! ${res.count} demandas TMR concluídas importadas.`);
      if (onSuccess) onSuccess(res.count);
      setTimeout(() => {
        setSuccessToast(null);
        onClose();
      }, 1200);
    } else {
      alert('Erro ao salvar os dados importados. Tente novamente.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#0f172a] text-slate-100 w-full max-w-4xl max-h-[90vh] rounded-2xl border border-purple-500/40 shadow-2xl flex flex-col overflow-hidden">
        
        {/* HEADER */}
        <div className="p-5 bg-gradient-to-r from-purple-950/80 via-[#0f172a] to-blue-950/80 border-b border-purple-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/40">
              <FileCode className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                Importar Histórico TMR Concluído (JSON)
                <span className="text-[10px] font-mono px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded-full font-bold">
                  SLA ≤ 150m
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Alimente o histórico de carretas finalizadas informando Carreta, Empilhador, Turno, Início e Fim.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TOAST SUCCESS NOTIFICATION */}
        {successToast && (
          <div className="bg-emerald-600 text-white font-bold p-3 text-center text-sm shadow-md animate-pulse">
            {successToast}
          </div>
        )}

        {/* BODY */}
        <div className="p-6 overflow-y-auto flex flex-col gap-5 flex-1 custom-scrollbar">
          
          {/* SCHEMA SPECIFICATION BANNER */}
          <div className="bg-purple-950/30 border border-purple-500/30 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-black uppercase text-purple-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Modelo JSON Suportado:
              </span>
              <pre className="text-[11px] font-mono text-purple-200 bg-[#070d18] p-2.5 rounded-lg border border-purple-900/60 overflow-x-auto">
{`{
  "CARRETA": "RLT5J54",
  "EMPILHADOR": "MARIVALDO",
  "TURNO": "TURNO A",
  "INICIO": "2026-01-04T14:40:00",
  "FIM": "2026-01-04T16:30:00"
}`}
              </pre>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full md:w-auto">
              <button
                type="button"
                onClick={handleCopySample}
                className="px-3 py-2 bg-purple-900/60 hover:bg-purple-800 text-purple-200 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-purple-700/50 cursor-pointer"
              >
                {copiedSample ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSample ? 'Copiado!' : 'Copiar Modelo'}</span>
              </button>

              <button
                type="button"
                onClick={handleLoadSample}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Carregar Exemplo</span>
              </button>
            </div>
          </div>

          {/* TAB SELECTOR */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>1. Enviar Arquivo .JSON</span>
            </button>
            <button
              onClick={() => setActiveTab('paste')}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'paste'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>2. Colar Texto JSON</span>
            </button>

            {jsonText && (
              <button
                onClick={handleClear}
                className="ml-auto px-3 py-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Limpar
              </button>
            )}
          </div>

          {/* TAB 1: FILE UPLOAD */}
          {activeTab === 'upload' && (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-purple-500/40 hover:border-purple-400 bg-[#070d18] rounded-2xl p-8 flex flex-col items-center justify-center gap-3 text-center cursor-pointer transition-all hover:bg-purple-950/10 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="p-4 rounded-full bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-white">
                  {fileName ? `Arquivo selecionado: ${fileName}` : 'Clique para selecionar ou arraste o arquivo .json'}
                </span>
                <span className="text-xs text-slate-400">
                  Suporta arquivos .json individuais ou contendo listas de carretas.
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: PASTE TEXT */}
          {activeTab === 'paste' && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-300">
                Cole o conteúdo JSON diretamente abaixo:
              </label>
              <textarea
                value={jsonText}
                onChange={(e) => handlePasteChange(e.target.value)}
                placeholder={`[\n  {\n    "CARRETA": "RLT5J54",\n    "EMPILHADOR": "MARIVALDO",\n    "TURNO": "TURNO A",\n    "INICIO": "2026-01-04T14:40:00",\n    "FIM": "2026-01-04T16:30:00"\n  }\n]`}
                rows={7}
                className="w-full bg-[#070d18] border border-purple-500/40 rounded-xl p-3 text-xs font-mono text-purple-200 placeholder-slate-600 focus:outline-hidden focus:border-purple-400"
              />
            </div>
          )}

          {/* PARSED PREVIEW & METRICS */}
          {parsedResult && (
            <div className="flex flex-col gap-4 mt-2">
              {parsedResult.valid ? (
                <>
                  {/* METRICS SUMMARY BANNER */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-[#111827] p-3 rounded-xl border border-slate-800 flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Registros Válidos</span>
                      <span className="text-2xl font-black text-white">{parsedResult.items.length}</span>
                    </div>

                    <div className="bg-[#111827] p-3 rounded-xl border border-slate-800 flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Tempo Médio (TMR)</span>
                      <span className="text-2xl font-black text-amber-400 font-mono">{parsedResult.avgDurationMin} <span className="text-xs">min</span></span>
                    </div>

                    <div className="bg-[#111827] p-3 rounded-xl border border-emerald-900/50 flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-emerald-400">Dentro da Meta (≤150m)</span>
                      <span className="text-2xl font-black text-emerald-400">{parsedResult.dentroSlaCount}</span>
                    </div>

                    <div className="bg-[#111827] p-3 rounded-xl border border-rose-900/50 flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-rose-400">Fora da Meta (&gt;150m)</span>
                      <span className="text-2xl font-black text-rose-400">{parsedResult.foraSlaCount}</span>
                    </div>
                  </div>

                  {/* PREVIEW TABLE */}
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-black uppercase text-slate-300 flex items-center justify-between">
                      <span>Prévia das Demandas TMR a serem alimentadas:</span>
                      <span className="text-[10px] text-purple-400 font-mono">{parsedResult.items.length} registro(s)</span>
                    </span>

                    <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-800 bg-[#070d18]">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-[#111827] sticky top-0 text-[10px] uppercase font-black text-slate-400 border-b border-slate-800">
                          <tr>
                            <th className="p-2.5">Carreta</th>
                            <th className="p-2.5">Empilhador</th>
                            <th className="p-2.5">Início</th>
                            <th className="p-2.5">Fim</th>
                            <th className="p-2.5">Duração</th>
                            <th className="p-2.5">SLA Meta</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                          {parsedResult.items.map((item, idx) => {
                            const isWithin = (item.duracaoMin || 0) <= 150;
                            return (
                              <tr key={`prev_${idx}`} className="hover:bg-slate-900/50 transition-colors">
                                <td className="p-2.5 font-bold text-amber-300">{item.carreta}</td>
                                <td className="p-2.5 text-slate-200">{item.operadorExecutor}</td>
                                <td className="p-2.5 text-slate-400">
                                  {new Date(item.iniciadoEm || '').toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                                </td>
                                <td className="p-2.5 text-slate-400">
                                  {new Date(item.finalizadoEm || '').toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                                </td>
                                <td className="p-2.5 font-bold text-white">
                                  {item.duracaoMin} min
                                </td>
                                <td className="p-2.5">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                    isWithin 
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  }`}>
                                    {isWithin ? '✓ Dentro (≤150m)' : '⚠ Fora (>150m)'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* IMPORT OPTIONS */}
                  <div className="flex items-center gap-4 bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs">
                    <span className="font-bold text-slate-300">Modo de Importação:</span>
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
                      <input
                        type="radio"
                        name="importMode"
                        checked={importMode === 'merge'}
                        onChange={() => setImportMode('merge')}
                        className="accent-purple-500"
                      />
                      <span>Mesclar com histórico existente (Evita duplicados)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
                      <input
                        type="radio"
                        name="importMode"
                        checked={importMode === 'replace'}
                        onChange={() => setImportMode('replace')}
                        className="accent-purple-500"
                      />
                      <span>Substituir histórico concluído</span>
                    </label>
                  </div>
                </>
              ) : (
                <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Estrutura JSON Inválida</strong>
                    <p className="text-[11px] text-rose-300/90 mt-0.5">{parsedResult.error}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-all cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={!parsedResult || !parsedResult.valid || parsedResult.items.length === 0}
            onClick={handleConfirmImport}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-wider shadow-lg flex items-center gap-2 cursor-pointer transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Alimentar Histórico TMR ({parsedResult?.items.length || 0})</span>
          </button>
        </div>

      </div>
    </div>
  );
}
