import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  FileCode, 
  Upload, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Database, 
  Trash2, 
  Eye, 
  Sparkles, 
  Copy, 
  Check, 
  Thermometer, 
  Flame, 
  TrendingDown, 
  Calendar, 
  User, 
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Search,
  FileSpreadsheet
} from 'lucide-react';
import { Usuario } from '../types';
import { 
  parseTemperaturaJson, 
  SAMPLE_TEMPERATURA_JSON, 
  ParsedTemperaturaResult 
} from '../utils/retroactiveTemperaturaParser';
import { 
  persistirTemperaturaRetroativaNoBanco, 
  SaveTemperaturaRetroativasResult 
} from '../services/retroactiveTemperaturaSyncService';
import { exportarModeloExcelTemperatura } from '../utils/tempStorage';

interface RetroactiveTemperaturaJsonImportProps {
  user: Usuario;
  empresaId?: string;
  onImportSuccess?: () => void;
  onNavigateToQualidade?: () => void;
}

export default function RetroactiveTemperaturaJsonImport({
  user,
  empresaId = 'demo',
  onImportSuccess,
  onNavigateToQualidade
}: RetroactiveTemperaturaJsonImportProps) {
  const [activeInputMode, setActiveInputMode] = useState<'upload' | 'editor'>('upload');
  const [jsonText, setJsonText] = useState<string>('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [parsedResult, setParsedResult] = useState<ParsedTemperaturaResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [tornarPadraoOficial, setTornarPadraoOficial] = useState<boolean>(true);
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [saveResultModal, setSaveResultModal] = useState<SaveTemperaturaRetroativasResult | null>(null);
  const [previewPage, setPreviewPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [previewSearch, setPreviewSearch] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Download sample JSON
  const handleDownloadSampleJson = () => {
    const jsonStr = JSON.stringify(SAMPLE_TEMPERATURA_JSON, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modelo_importacao_temperatura_retroativa.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Copy Schema to clipboard
  const handleCopySchema = () => {
    const schemaExample = JSON.stringify(SAMPLE_TEMPERATURA_JSON[0], null, 2);
    navigator.clipboard.writeText(schemaExample);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2500);
  };

  // Load sample into JSON editor
  const handleLoadSampleIntoEditor = () => {
    const jsonStr = JSON.stringify(SAMPLE_TEMPERATURA_JSON, null, 2);
    setJsonText(jsonStr);
    const res = parseTemperaturaJson(jsonStr, empresaId, user.nome);
    setParsedResult(res);
    setPreviewPage(1);
  };

  // Process uploaded JSON, Excel, or CSV file
  const handleFileUpload = (file: File) => {
    if (!file) return;
    setFileName(file.name);
    setFileSize((file.size / 1024).toFixed(1) + ' KB');

    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'xlsx' || extension === 'xls' || extension === 'csv') {
      // Process Excel / CSV using XLSX
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet);

          const formattedList = rawJson.map(row => {
            // Normalize columns
            let rawData = row['Data'] || row['DATA'] || row['data'] || row['Data Aferição'] || '';
            if (typeof rawData === 'number') {
              // Excel date serial number to DD/MM/YYYY
              const excelDate = new Date((rawData - (25567 + 2)) * 86400 * 1000);
              const dd = String(excelDate.getDate()).padStart(2, '0');
              const mm = String(excelDate.getMonth() + 1).padStart(2, '0');
              const yyyy = excelDate.getFullYear();
              rawData = `${dd}/${mm}/${yyyy}`;
            }

            let rawHora = row['Hora'] || row['HORA'] || row['hora'] || row['Horário'] || '09:00';
            if (typeof rawHora === 'number') {
              const totalSec = Math.round(rawHora * 86400);
              const hh = String(Math.floor(totalSec / 3600)).padStart(2, '0');
              const mm = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
              rawHora = `${hh}:${mm}`;
            }

            const rawTemp = row['Temperatura'] ?? row['TEMPERATURA'] ?? row['temperatura'] ?? row['Temp'] ?? 24;
            const conferente = row['Colaborador'] || row['Conferente'] || row['CONFERENTE'] || row['Responsável'] || user.nome;
            const setor = row['Setor'] || row['SETOR'] || row['Área'] || 'Armazém Central';
            const obs = row['Observação'] || row['OBSERVAÇÃO'] || row['observacao'] || 'Importado via Planilha';

            return {
              data: rawData,
              hora: String(rawHora),
              temperatura: rawTemp,
              conferente: String(conferente),
              setor: String(setor),
              observacao: String(obs)
            };
          });

          const jsonString = JSON.stringify(formattedList, null, 2);
          setJsonText(jsonString);
          const res = parseTemperaturaJson(formattedList, empresaId, user.nome);
          setParsedResult(res);
          setPreviewPage(1);
        } catch (err: any) {
          setParsedResult({
            success: false,
            logs: [],
            errors: [`Erro ao ler arquivo Excel: ${err?.message || 'Arquivo corrompido ou formato incompatível'}`],
            warnings: [],
            stats: {
              totalRecords: 0,
              validRecords: 0,
              invalidRecords: 0,
              mediaTemperatura: 0,
              picoMaximo: 0,
              minimaAferida: 0,
              alertasCriticos: 0,
              dataInicio: '-',
              dataFim: '-',
              totalDiasUnicos: 0,
              conferentesUnicos: []
            }
          });
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      // Process standard JSON
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setJsonText(text);
        const res = parseTemperaturaJson(text, empresaId, user.nome);
        setParsedResult(res);
        setPreviewPage(1);
      };
      reader.readAsText(file);
    }
  };

  // Process text change in editor
  const handleEditorChange = (text: string) => {
    setJsonText(text);
    if (!text.trim()) {
      setParsedResult(null);
      return;
    }
    const res = parseTemperaturaJson(text, empresaId, user.nome);
    setParsedResult(res);
    setPreviewPage(1);
  };

  // Perform Final Save and Synchronization
  const handleSaveToDatabase = async () => {
    if (!parsedResult || !parsedResult.success || parsedResult.logs.length === 0) return;

    setIsSaving(true);
    try {
      const res = await persistirTemperaturaRetroativaNoBanco({
        logs: parsedResult.logs,
        tornarPadraoOficial,
        empresaId,
        userNome: user.nome
      });

      setSaveResultModal(res);
      if (onImportSuccess) onImportSuccess();
    } catch (err: any) {
      alert(`Erro ao salvar dados de temperatura: ${err?.message || 'Erro inesperado'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Filtered Preview Data
  const filteredLogs = (parsedResult?.logs || []).filter(l => {
    if (!previewSearch.trim()) return true;
    const term = previewSearch.toLowerCase();
    return (
      l.dataFormatted.toLowerCase().includes(term) ||
      l.hora.toLowerCase().includes(term) ||
      l.conferenteNome.toLowerCase().includes(term) ||
      l.setor.toLowerCase().includes(term) ||
      String(l.temperatura).includes(term) ||
      (l.observacao && l.observacao.toLowerCase().includes(term))
    );
  });

  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = filteredLogs.slice((previewPage - 1) * pageSize, previewPage * pageSize);

  return (
    <div className="space-y-6">
      {/* ── HEADER BANNER ── */}
      <div className="bg-[#0b1222] border border-slate-800 rounded-3xl p-6 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
              <Thermometer className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-black uppercase text-white tracking-wider">
                  Importação Oficial de Temperatura Retroativa
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  JSON / EXCEL / CSV
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Carregue o histórico oficial de medições térmicas do armazém. O sistema processa as aferições, calcula automaticamente as médias, picos máximos, mínimas e alimenta o <strong>Gráfico de Variação Diária</strong> e os <strong>Cards de Indicadores</strong> em tempo real.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-stretch sm:self-auto justify-end">
            <button
              onClick={exportarModeloExcelTemperatura}
              className="px-3.5 py-2 rounded-xl bg-[#131d31] hover:bg-[#1a2844] text-slate-200 border border-slate-700 text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer hover:text-white shadow-xs"
              title="Baixar modelo em Excel (.xlsx) pronto para preenchimento"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              Modelo Excel (.xlsx)
            </button>

            <button
              onClick={handleDownloadSampleJson}
              className="px-3.5 py-2 rounded-xl bg-[#131d31] hover:bg-[#1a2844] text-slate-200 border border-slate-700 text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer hover:text-white shadow-xs"
              title="Baixar arquivo JSON de exemplo pré-formatado"
            >
              <Download className="w-4 h-4 text-amber-400" />
              Modelo JSON
            </button>

            <button
              onClick={handleCopySchema}
              className="px-3.5 py-2 rounded-xl bg-[#131d31] hover:bg-[#1a2844] text-slate-200 border border-slate-700 text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer hover:text-white shadow-xs"
              title="Copiar estrutura de exemplo para a área de transferência"
            >
              {copiedSchema ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
              {copiedSchema ? 'Copiado!' : 'Copiar Schema'}
            </button>
          </div>
        </div>
      </div>

      {/* ── INPUT METHOD TABS ── */}
      <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveInputMode('upload')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
            activeInputMode === 'upload'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-[#111a30] text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Upload className="w-4 h-4" />
          Upload de Arquivo (JSON, Excel, CSV)
        </button>

        <button
          onClick={() => setActiveInputMode('editor')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
            activeInputMode === 'editor'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-[#111a30] text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <FileCode className="w-4 h-4" />
          Editor de JSON Direto
        </button>

        {activeInputMode === 'editor' && (
          <button
            onClick={handleLoadSampleIntoEditor}
            className="ml-auto px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Carregar Dados de Exemplo no Editor
          </button>
        )}
      </div>

      {/* ── MODE 1: UPLOAD DE ARQUIVO ── */}
      {activeInputMode === 'upload' && (
        <div className="bg-[#0b1222] border-2 border-dashed border-slate-700 hover:border-amber-500/60 rounded-3xl p-8 text-center transition-all">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json, .xlsx, .xls, .csv"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
            className="hidden"
          />

          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
              <Upload className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-base font-black uppercase text-white tracking-wide">
                Arraste ou Selecione seu Arquivo
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Formatos aceitos: <strong>.JSON</strong>, <strong>.XLSX</strong>, <strong>.XLS</strong> ou <strong>.CSV</strong>
              </p>
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs uppercase tracking-wider cursor-pointer transition-all shadow-lg hover:shadow-amber-600/20 active:scale-95"
            >
              Procurar Arquivo no Computador
            </button>

            {fileName && (
              <div className="p-3 bg-[#111a30] border border-slate-700 rounded-xl flex items-center justify-between text-xs text-slate-300">
                <span className="font-mono font-bold text-amber-300 truncate max-w-xs">{fileName}</span>
                <span className="text-[10px] text-slate-400">{fileSize}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODE 2: EDITOR DE JSON DIRETO ── */}
      {activeInputMode === 'editor' && (
        <div className="bg-[#0b1222] border border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider text-slate-300">
              Cole ou edite a estrutura JSON abaixo:
            </span>
            <span className="font-mono text-[11px]">
              {jsonText ? `${jsonText.split('\n').length} linhas` : 'Vazio'}
            </span>
          </div>

          <textarea
            value={jsonText}
            onChange={(e) => handleEditorChange(e.target.value)}
            placeholder={`[\n  {\n    "data": "2026-01-15",\n    "hora": "08:56:00",\n    "temperatura": 25.6,\n    "colaborador": "Nixon",\n    "observacao": null\n  }\n]`}
            rows={12}
            className="w-full bg-[#070c18] border border-slate-800 rounded-2xl p-4 font-mono text-xs text-emerald-300 outline-none focus:border-amber-500/80 transition-all resize-y leading-relaxed placeholder:text-slate-700"
          />
        </div>
      )}

      {/* ── SUMMARY KPIS & STATS ── */}
      {parsedResult && parsedResult.success && (
        <div className="space-y-6 animate-fadeIn">
          {/* KPI CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-[#0b1222] border border-slate-800 p-4 rounded-2xl">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                Total de Registros
              </span>
              <strong className="text-xl font-mono font-black text-white mt-1 block">
                {parsedResult.stats.validRecords}
              </strong>
              <span className="text-[10px] text-emerald-400 font-bold mt-0.5 block">
                100% Válidos
              </span>
            </div>

            <div className="bg-[#0b1222] border border-slate-800 p-4 rounded-2xl">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                Média Térmica
              </span>
              <strong className="text-xl font-mono font-black text-amber-300 mt-1 block">
                {parsedResult.stats.mediaTemperatura.toFixed(1)}°C
              </strong>
              <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
                Faixa Operacional
              </span>
            </div>

            <div className="bg-[#0b1222] border border-slate-800 p-4 rounded-2xl">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                Pico Máximo
              </span>
              <strong className={`text-xl font-mono font-black mt-1 block ${
                parsedResult.stats.picoMaximo > 28 ? 'text-rose-400' : 'text-emerald-400'
              }`}>
                {parsedResult.stats.picoMaximo.toFixed(1)}°C
              </strong>
              <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
                Pico Registrado
              </span>
            </div>

            <div className="bg-[#0b1222] border border-slate-800 p-4 rounded-2xl">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                Mínima Aferida
              </span>
              <strong className="text-xl font-mono font-black text-sky-300 mt-1 block">
                {parsedResult.stats.minimaAferida.toFixed(1)}°C
              </strong>
              <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
                Mínima Registrada
              </span>
            </div>

            <div className="bg-[#0b1222] border border-slate-800 p-4 rounded-2xl">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                Alertas (&gt; 28°C)
              </span>
              <strong className={`text-xl font-mono font-black mt-1 block ${
                parsedResult.stats.alertasCriticos > 0 ? 'text-rose-400' : 'text-slate-300'
              }`}>
                {parsedResult.stats.alertasCriticos}
              </strong>
              <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
                Temperatura Crítica
              </span>
            </div>

            <div className="bg-[#0b1222] border border-slate-800 p-4 rounded-2xl">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                Dias Únicos
              </span>
              <strong className="text-xl font-mono font-black text-indigo-300 mt-1 block">
                {parsedResult.stats.totalDiasUnicos}
              </strong>
              <span className="text-[10px] text-slate-400 font-medium mt-0.5 block truncate">
                {parsedResult.stats.dataInicio} a {parsedResult.stats.dataFim}
              </span>
            </div>
          </div>

          {/* DIAGNOSTIC WARNINGS IF ANY */}
          {parsedResult.errors.length > 0 && (
            <div className="p-4 bg-rose-950/30 border border-rose-500/40 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase">
                <AlertTriangle className="w-4 h-4" />
                Linhas com Inconsistências Ignoradas ({parsedResult.errors.length})
              </div>
              <ul className="text-[11px] text-rose-300/80 list-disc list-inside space-y-1 font-mono">
                {parsedResult.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* PREVIEW TABLE */}
          <div className="bg-[#0b1222] border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-black uppercase text-white tracking-wider">
                  Pré-visualização dos Dados ({filteredLogs.length} de {parsedResult.logs.length})
                </h3>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={previewSearch}
                    onChange={(e) => {
                      setPreviewSearch(e.target.value);
                      setPreviewPage(1);
                    }}
                    placeholder="Filtrar por data, conferente, temp..."
                    className="w-full bg-[#111a30] text-white text-xs rounded-xl pl-8 pr-3 py-1.5 border border-slate-700 outline-none focus:border-amber-500"
                  />
                </div>

                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPreviewPage(1);
                  }}
                  className="bg-[#111a30] text-slate-300 text-xs font-bold rounded-xl px-2.5 py-1.5 border border-slate-700 outline-none"
                >
                  <option value={10}>10 / pág</option>
                  <option value={25}>25 / pág</option>
                  <option value={50}>50 / pág</option>
                  <option value={100}>100 / pág</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] font-black uppercase text-slate-400 tracking-wider bg-[#0e162a]">
                    <th className="py-2.5 px-3">Data</th>
                    <th className="py-2.5 px-3">Hora</th>
                    <th className="py-2.5 px-3">Temperatura</th>
                    <th className="py-2.5 px-3">Conferente</th>
                    <th className="py-2.5 px-3">Setor</th>
                    <th className="py-2.5 px-3">Observação</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {paginatedLogs.map((log) => {
                    const isCrit = log.temperatura > 28.0;
                    return (
                      <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-white">{log.dataFormatted}</td>
                        <td className="py-2.5 px-3 text-slate-300">{log.hora}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded font-black text-xs ${
                            isCrit 
                              ? 'bg-rose-950 text-rose-300 border border-rose-500/40' 
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                          }`}>
                            {log.temperatura.toFixed(1)}°C
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-sans text-slate-200">{log.conferenteNome}</td>
                        <td className="py-2.5 px-3 font-sans text-slate-400">{log.setor}</td>
                        <td className="py-2.5 px-3 font-sans text-slate-400 max-w-xs truncate">{log.observacao}</td>
                        <td className="py-2.5 px-3 text-right font-sans">
                          {isCrit ? (
                            <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                              Alerta (&gt;28°C)
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              Normal
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* PAGINATION CONTROLS */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs text-slate-400">
                <span>Página {previewPage} de {totalPages}</span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={previewPage <= 1}
                    onClick={() => setPreviewPage(p => p - 1)}
                    className="px-3 py-1 bg-[#111a30] hover:bg-slate-800 disabled:opacity-40 text-white rounded-lg border border-slate-700 cursor-pointer"
                  >
                    Anterior
                  </button>
                  <button
                    disabled={previewPage >= totalPages}
                    onClick={() => setPreviewPage(p => p + 1)}
                    className="px-3 py-1 bg-[#111a30] hover:bg-slate-800 disabled:opacity-40 text-white rounded-lg border border-slate-700 cursor-pointer"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── ACTION COMMIT BAR ── */}
          <div className="bg-[#0b1222] border-2 border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="checkPadraoOficial"
                checked={tornarPadraoOficial}
                onChange={(e) => setTornarPadraoOficial(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-amber-500 focus:ring-amber-400 border-slate-700 cursor-pointer"
              />
              <label htmlFor="checkPadraoOficial" className="text-xs text-slate-300 leading-relaxed cursor-pointer">
                <strong className="text-white block font-black uppercase">
                  Definir este documento como a única fonte da verdade e padrão oficial para Temperatura do Armazém
                </strong>
                Substitui a base anterior no banco e sincroniza instantaneamente todos os relatórios, filtros mensais e o Gráfico de Variação Diária da Temperatura.
              </label>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-800">
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>{parsedResult.stats.validRecords} aferições prontas para sincronização imediata.</span>
              </div>

              <button
                onClick={handleSaveToDatabase}
                disabled={isSaving || parsedResult.stats.validRecords === 0}
                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xl hover:shadow-amber-500/20 active:scale-95"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Sincronizando Base...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    Importar e Sincronizar Temperatura ({parsedResult.stats.validRecords} Registros)
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SUCCESS MODAL ── */}
      {saveResultModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1222] border border-emerald-500/40 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 animate-scaleUp">
            <div className="flex items-center gap-3 text-emerald-400">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-black uppercase text-white tracking-wide">
                  Importação Concluída com Sucesso!
                </h3>
                <span className="text-xs text-emerald-400 font-bold">
                  {saveResultModal.importedCount} aferições sincronizadas na plataforma
                </span>
              </div>
            </div>

            <div className="p-4 bg-[#111a30] rounded-2xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Total de Aferições:</span>
                <strong className="text-white font-mono">{saveResultModal.details.totalRegistros}</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Dias Abrangidos:</span>
                <strong className="text-white font-mono">{saveResultModal.details.diasAbrangidos} dias</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Média Térmica Calculada:</span>
                <strong className="text-amber-300 font-mono">{saveResultModal.details.mediaGeral}°C</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Alertas Críticos (&gt;28°C):</span>
                <strong className="text-rose-400 font-mono">{saveResultModal.details.alertasCriticos}</strong>
              </div>
              <div className="flex justify-between text-slate-300 border-t border-slate-700/60 pt-2">
                <span>Data de Processamento:</span>
                <span className="text-slate-400 font-mono">{saveResultModal.details.timestamp}</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Os indicadores de temperatura, a variação diária e as auditorias já foram atualizados. Você pode visualizar o gráfico em tempo real no painel de Qualidade.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSaveResultModal(null)}
                className="px-5 py-2.5 rounded-xl bg-[#1c2433] hover:bg-[#283348] text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                Fechar
              </button>

              {onNavigateToQualidade && (
                <button
                  onClick={() => {
                    setSaveResultModal(null);
                    onNavigateToQualidade();
                  }}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-emerald-600/20"
                >
                  Ver no Painel de Qualidade
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
