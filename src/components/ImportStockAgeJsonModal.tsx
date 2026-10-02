import React, { useState, useRef, useEffect } from 'react';
import { 
  FileCode, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Calendar, 
  Layers, 
  TrendingUp, 
  DollarSign, 
  Package, 
  Info,
  Sparkles,
  Loader2,
  Clock
} from 'lucide-react';
import { 
  ColetaItemRaw, 
  saveMonthlyColetas, 
  getStoredMonthlyColetas, 
  MONTH_KEYS, 
  processColetaItems,
  normalizeColetaRawList,
  formatAnyDateToBr
} from '../utils/stockAgeMonthlyManager';

interface ImportStockAgeJsonModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMonthKey?: string;
  onImportSuccess?: (monthKey: string, count: number) => void;
}

export default function ImportStockAgeJsonModal({
  isOpen,
  onClose,
  initialMonthKey = '05',
  onImportSuccess
}: ImportStockAgeJsonModalProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>(initialMonthKey === 'all' ? '05' : initialMonthKey);
  const [autoDetectMonth, setAutoDetectMonth] = useState<boolean>(true);
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');
  const [jsonText, setJsonText] = useState<string>('');
  const [parsedData, setParsedData] = useState<ColetaItemRaw[] | Record<string, ColetaItemRaw[]> | null>(null);
  const [detectedMonthKey, setDetectedMonthKey] = useState<string | null>(null);
  const [isMultiMonth, setIsMultiMonth] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sincronizar estado inicial quando o modal abre ou initialMonthKey muda
  useEffect(() => {
    if (isOpen) {
      const target = initialMonthKey === 'all' ? '05' : initialMonthKey;
      setSelectedMonth(target);
      setAutoDetectMonth(false); // Mantém o mês em que o usuário estava a menos que detecte explicitamente
      setJsonText('');
      setParsedData(null);
      setDetectedMonthKey(null);
      setIsMultiMonth(false);
      setErrorMsg(null);
    }
  }, [isOpen, initialMonthKey]);

  // Analisa o JSON de forma assíncrona para evitar congelamento da interface
  const analyzeJson = (rawContent: string, currentTargetMonth: string = selectedMonth) => {
    setErrorMsg(null);
    setParsedData(null);
    setDetectedMonthKey(null);
    setIsMultiMonth(false);

    if (!rawContent.trim()) return;

    setIsAnalyzing(true);

    setTimeout(() => {
      try {
        let parsed: any;
        try {
          parsed = JSON.parse(rawContent);
        } catch (err: any) {
          setErrorMsg(`Erro de sintaxe JSON: ${err.message}`);
          setIsAnalyzing(false);
          return;
        }

        // Se o JSON vier envelopado em { data: [...] } ou { items: [...] } ou { lotes: [...] }
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          const wrapperKeys = ['data', 'items', 'lotes', 'coleta', 'coletas', 'stockAge', 'validades', 'rows', 'payload'];
          for (const wk of wrapperKeys) {
            if (Array.isArray(parsed[wk])) {
              parsed = parsed[wk];
              break;
            }
          }
        }

        // Caso 1: Objeto mapeado por mês: { "05": [...], "06": [...] } ou { "mai": [...], "jun": [...] }
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          const keys = Object.keys(parsed);
          const validMonthKeys = keys.filter(k => /^(0[1-9]|1[0-2]|jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez|janeiro|fevereiro|marco|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)/i.test(k));
          
          if (validMonthKeys.length > 0) {
            setIsMultiMonth(true);
            const normalizedMonthly: Record<string, ColetaItemRaw[]> = {};
            
            Object.entries(parsed).forEach(([k, list]) => {
              if (!Array.isArray(list)) return;
              let mKey = k.padStart(2, '0');
              const monthObj = MONTH_KEYS.find(m => 
                m.key === mKey || 
                m.short.toLowerCase() === k.toLowerCase() || 
                m.name.toLowerCase() === k.toLowerCase() ||
                (k.toLowerCase().startsWith('mai') && m.key === '05') ||
                (k.toLowerCase().startsWith('jun') && m.key === '06') ||
                (k.toLowerCase().startsWith('jul') && m.key === '07') ||
                (k.toLowerCase().startsWith('ago') && m.key === '08') ||
                (k.toLowerCase().startsWith('set') && m.key === '09') ||
                (k.toLowerCase().startsWith('out') && m.key === '10') ||
                (k.toLowerCase().startsWith('nov') && m.key === '11') ||
                (k.toLowerCase().startsWith('dez') && m.key === '12') ||
                (k.toLowerCase().startsWith('jan') && m.key === '01') ||
                (k.toLowerCase().startsWith('fev') && m.key === '02') ||
                (k.toLowerCase().startsWith('mar') && m.key === '03') ||
                (k.toLowerCase().startsWith('abr') && m.key === '04')
              );
              if (monthObj) mKey = monthObj.key;
              
              normalizedMonthly[mKey] = normalizeColetaRawList(list, mKey);
            });

            setParsedData(normalizedMonthly);
            setIsAnalyzing(false);
            return;
          }
        }

        // Caso 2: Array de itens de coleta
        if (Array.isArray(parsed)) {
          // Detectar se há múltiplos meses nas datas dos itens
          const monthCounts: Record<string, number> = {};
          parsed.forEach((row: any) => {
            const rawD = row.dataColeta || row.data || row.Data || row['Data Coleta'] || row.data_coleta || row.dtColeta;
            if (rawD) {
              const brD = formatAnyDateToBr(rawD, currentTargetMonth);
              const parts = brD.split('/');
              if (parts.length === 3) {
                const mk = parts[1].padStart(2, '0');
                if (parseInt(mk, 10) >= 1 && parseInt(mk, 10) <= 12) {
                  monthCounts[mk] = (monthCounts[mk] || 0) + 1;
                }
              }
            }
          });

          const distinctMonths = Object.keys(monthCounts);
          
          if (distinctMonths.length > 1) {
            // Mais de um mês presente no array -> Agrupar por mês
            setIsMultiMonth(true);
            const multiMap: Record<string, ColetaItemRaw[]> = {};
            distinctMonths.forEach(mk => {
              const itemsForMonth = parsed.filter((r: any) => {
                const rawD = r.dataColeta || r.data || r.Data || r['Data Coleta'] || r.data_coleta || r.dtColeta;
                const brD = formatAnyDateToBr(rawD, mk);
                return brD.split('/')[1]?.padStart(2, '0') === mk;
              });
              multiMap[mk] = normalizeColetaRawList(itemsForMonth, mk);
            });
            setParsedData(multiMap);
            setIsAnalyzing(false);
            return;
          }

          // Apenas um mês ou sem datas explícitas
          let detectedTarget = currentTargetMonth;
          if (distinctMonths.length === 1) {
            detectedTarget = distinctMonths[0];
            setDetectedMonthKey(detectedTarget);
            setSelectedMonth(detectedTarget);
          }

          const normalized = normalizeColetaRawList(parsed, detectedTarget);
          if (normalized.length === 0) {
            setErrorMsg('O arquivo JSON não contém registros válidos com código e quantidade.');
            setIsAnalyzing(false);
            return;
          }

          setParsedData(normalized);
        } else {
          setErrorMsg('Formato inválido. O JSON deve ser um array de itens ou um objeto com os meses.');
        }
      } catch (e: any) {
        setErrorMsg(`Erro ao processar JSON: ${e.message}`);
      } finally {
        setIsAnalyzing(false);
      }
    }, 40);
  };

  const handleFileUpload = (file: File) => {
    setErrorMsg(null);
    setIsAnalyzing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setJsonText(content);
      analyzeJson(content, selectedMonth);
    };
    reader.onerror = () => {
      setErrorMsg('Erro ao ler o arquivo selecionado.');
      setIsAnalyzing(false);
    };
    reader.readAsText(file);
  };

  const handleMonthChange = (newMonth: string) => {
    setSelectedMonth(newMonth);
    setAutoDetectMonth(false);
    if (jsonText.trim()) {
      analyzeJson(jsonText, newMonth);
    }
  };

  const handleConfirmImport = () => {
    if (!parsedData) return;

    try {
      const currentStored = getStoredMonthlyColetas();

      if (isMultiMonth && typeof parsedData === 'object' && !Array.isArray(parsedData)) {
        // Multi-month import
        const mergedAll = { ...currentStored };
        let totalImported = 0;

        Object.entries(parsedData).forEach(([mKey, items]) => {
          if (importMode === 'merge' && Array.isArray(mergedAll[mKey])) {
            mergedAll[mKey] = [...mergedAll[mKey], ...items];
          } else {
            mergedAll[mKey] = items;
          }
          totalImported += items.length;
        });

        saveMonthlyColetas(mergedAll);
        onImportSuccess?.('all', totalImported);
        onClose();
        return;
      }

      if (Array.isArray(parsedData)) {
        const targetKey = selectedMonth;
        let finalItems = parsedData;

        if (importMode === 'merge') {
          const existing = currentStored[targetKey] || [];
          finalItems = [...existing, ...parsedData];
        }

        saveMonthlyColetas(targetKey, finalItems);
        onImportSuccess?.(targetKey, finalItems.length);
        onClose();
      }
    } catch (e: any) {
      setErrorMsg(`Falha ao salvar dados no armazenamento: ${e.message}`);
    }
  };

  // Preview metrics
  const previewItemsList = Array.isArray(parsedData) 
    ? parsedData 
    : isMultiMonth && parsedData 
    ? Object.values(parsedData).flat() 
    : [];

  const previewMetrics = React.useMemo(() => {
    if (previewItemsList.length === 0) return null;
    const { items, kpiGeral, semanasSummary } = processColetaItems(previewItemsList);
    const totalCaixas = previewItemsList.reduce((acc, it) => acc + (it.qtdeCaixas || 0), 0);
    const totalHecto = items.reduce((acc, it) => acc + (it.volumeHecto || 0), 0);
    const totalValor = items.reduce((acc, it) => acc + (it.valorEstimado || 0), 0);
    const criticos = items.filter(it => it.status === 'Crítico').length;

    return {
      totalLotes: previewItemsList.length,
      totalCaixas,
      totalHecto: Math.round(totalHecto * 10) / 10,
      totalValor: Math.round(totalValor),
      avgStockAge: kpiGeral.avgStockAge,
      criticos,
      semanasSummary
    };
  }, [previewItemsList]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-scale-in text-slate-800">
        
        {/* Header */}
        <div className="bg-[#032b5e] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
              <FileCode className="w-6 h-6 text-blue-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black uppercase tracking-wider">Importar JSON do Mês</h2>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                  Stock Age Index
                </span>
              </div>
              <p className="text-xs text-blue-200/80 mt-0.5">
                Importe arquivos JSON de coletas para análise comparativa mês a mês (Janeiro a Dezembro)
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all border-none bg-transparent cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          
          {/* Seletor de Mês Destino */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-black uppercase text-[#032b5e] tracking-wider block flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" /> Mês de Destino da Coleta
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {isMultiMonth ? 'Arquivo com múltiplos meses detectado. Os dados serão distribuídos por mês.' : 'Selecione em qual mês do exercício gravar os lotes importados.'}
              </p>
            </div>

            {!isMultiMonth && (
              <div className="flex items-center gap-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => handleMonthChange(e.target.value)}
                  className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-black text-[#032b5e] cursor-pointer"
                >
                  {MONTH_KEYS.map(m => (
                    <option key={m.key} value={m.key}>
                      {m.key} - {m.name} / 2026
                    </option>
                  ))}
                </select>
                {detectedMonthKey && (
                  <span className="bg-blue-100 text-[#032b5e] text-[10px] font-black px-2 py-1 rounded-md border border-blue-200">
                    Auto ({detectedMonthKey})
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Modo de Gravação (Substituir vs Mesclar) */}
          <div className="flex items-center justify-between bg-blue-50/50 p-3 rounded-xl border border-blue-100">
            <span className="text-[11px] font-bold text-slate-700">Modo de Gravação no Mês:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setImportMode('replace')}
                className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer border ${
                  importMode === 'replace' 
                    ? 'bg-[#032b5e] text-white border-[#032b5e] shadow-xs' 
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Substituir Base do Mês
              </button>
              <button
                type="button"
                onClick={() => setImportMode('merge')}
                className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer border ${
                  importMode === 'merge' 
                    ? 'bg-[#032b5e] text-white border-[#032b5e] shadow-xs' 
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Mesclar / Incrementar
              </button>
            </div>
          </div>

          {/* Upload de Arquivo JSON */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleFileUpload(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
              dragOver 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-slate-300 bg-slate-50 hover:bg-slate-100/70'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
              className="hidden"
            />
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <span className="font-black text-slate-700 text-xs block">
                Clique para selecionar o arquivo .JSON ou arraste aqui
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">
                Compatível com os modelos de coletas mensais do Stock Age Index
              </span>
            </div>
          </div>

          {/* Textarea para Colar JSON */}
          <div>
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block mb-1">
              Ou cole o código JSON diretamente:
            </label>
            <textarea
              rows={4}
              value={jsonText}
              onChange={(e) => {
                setJsonText(e.target.value);
                analyzeJson(e.target.value, selectedMonth);
              }}
              placeholder='[ { "dataColeta": "15/05/2026", "codigo": "1234", "descricao": "BRAHMA CHOPP 350ML", "qtdeCaixas": 500, "dataVencimento": "2026-09-30", "subBloco": "A1" } ]'
              className="w-full p-3 rounded-xl border border-slate-200 font-mono text-[11px] bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Indicador de Processamento / Loading */}
          {isAnalyzing && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-[#032b5e] flex items-center justify-center gap-3 animate-pulse">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <span className="font-black text-xs">Processando e categorizando registros por semana...</span>
            </div>
          )}

          {/* Mensagem de Erro */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-bold">{errorMsg}</span>
            </div>
          )}

          {/* Preview dos Dados Analisados */}
          {previewMetrics && !isAnalyzing && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-black text-[#032b5e] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" /> Prévia dos Dados para Importação
                </span>
                <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                  {isMultiMonth ? 'Multi-Mês' : `${MONTH_KEYS.find(m => m.key === selectedMonth)?.name}`}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-center">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Total de Lotes</span>
                  <span className="text-sm font-black text-[#032b5e]">{previewMetrics.totalLotes}</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-center">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Total Caixas</span>
                  <span className="text-sm font-black text-[#032b5e]">{previewMetrics.totalCaixas.toLocaleString()} cx</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-center">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Volume (HL)</span>
                  <span className="text-sm font-black text-blue-700">{previewMetrics.totalHecto.toLocaleString()} HL</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-center">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Stock Age Médio</span>
                  <span className="text-sm font-black text-emerald-700">{previewMetrics.avgStockAge}%</span>
                </div>
              </div>

              {/* Distribuição Semanal no Preview */}
              {previewMetrics.semanasSummary && (
                <div className="mt-2 pt-2 border-t border-slate-200">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1.5">
                    Contagem e Distribuição por Semanas:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {previewMetrics.semanasSummary.map(sem => (
                      <div 
                        key={sem.semanaNumero} 
                        className={`p-2 rounded-lg border text-center ${
                          sem.hasData 
                            ? 'bg-white border-blue-200 shadow-xs' 
                            : 'bg-slate-100/70 border-slate-200 opacity-60'
                        }`}
                      >
                        <span className="text-[10px] font-black text-[#032b5e] block">
                          Semana {sem.semanaNumero}
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold block">
                          {sem.periodoDias}
                        </span>
                        <div className="mt-1 flex items-center justify-center gap-1 font-black text-xs text-slate-800">
                          <span>{sem.totalLotes} lotes</span>
                          {sem.hasData && (
                            <span className="text-[10px] text-blue-700">
                              ({sem.avgStockAge}%)
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Amostra dos primeiros itens */}
              <div className="border border-slate-200 rounded-lg overflow-hidden max-h-28 overflow-y-auto bg-white">
                <table className="w-full text-left text-[10px]">
                  <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0">
                    <tr>
                      <th className="p-1.5">Código</th>
                      <th className="p-1.5">Produto</th>
                      <th className="p-1.5 text-right">Qtd (Cx)</th>
                      <th className="p-1.5">Data Coleta</th>
                      <th className="p-1.5">Rua</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {previewItemsList.slice(0, 5).map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-1.5 font-mono font-bold text-slate-700">{it.codigo}</td>
                        <td className="p-1.5 truncate max-w-[150px]">{it.descricao}</td>
                        <td className="p-1.5 text-right font-black">{it.qtdeCaixas}</td>
                        <td className="p-1.5 text-slate-600">{it.dataColeta}</td>
                        <td className="p-1.5 font-bold text-blue-700">{it.subBloco || it.blocoPrincipal || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-extrabold text-xs border border-slate-300 transition-all cursor-pointer"
          >
            Cancelar
          </button>

          <button
            onClick={handleConfirmImport}
            disabled={!parsedData}
            className="px-5 py-2 rounded-xl bg-[#032b5e] hover:bg-blue-900 text-white font-black text-xs transition-all shadow-md cursor-pointer border-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Salvar no Mês &amp; Atualizar Análise
          </button>
        </div>

      </div>
    </div>
  );
}
