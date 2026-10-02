import React, { useState, useRef } from 'react';
import { 
  FileCode, 
  Upload, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Database, 
  Layers, 
  FileSpreadsheet, 
  Trash2, 
  Sparkles, 
  Copy, 
  Check, 
  Clock, 
  User, 
  Package, 
  Target,
  ShieldCheck,
  Server,
  RefreshCw,
  TrendingUp,
  Activity
} from 'lucide-react';
import { Usuario } from '../types';
import { 
  parseRepackJson, 
  SAMPLE_REPACK_JSON, 
  ParsedRepackResult 
} from '../utils/retroactiveRepackParser';
import { 
  persistirRepackRetroativoNoBanco, 
  SaveRepackRetroativasResult 
} from '../services/retroactiveRepackSyncService';

interface RetroactiveRepackJsonImportProps {
  user: Usuario;
  empresaId?: string;
  onImportSuccess?: () => void;
}

export default function RetroactiveRepackJsonImport({
  user,
  empresaId = 'demo',
  onImportSuccess
}: RetroactiveRepackJsonImportProps) {
  const [activeInputMode, setActiveInputMode] = useState<'upload' | 'editor'>('upload');
  const [jsonText, setJsonText] = useState<string>('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [parsedResult, setParsedResult] = useState<ParsedRepackResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [tornarPadraoOficial, setTornarPadraoOficial] = useState(true);
  const [saveResultModal, setSaveResultModal] = useState<SaveRepackRetroativasResult | null>(null);
  const [previewPage, setPreviewPage] = useState(1);
  const [previewSearch, setPreviewSearch] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Download do arquivo modelo .json
  const handleDownloadSampleJson = () => {
    const jsonStr = JSON.stringify(SAMPLE_REPACK_JSON, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modelo_importacao_retroativa_repack.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Copiar schema de exemplo para a área de transferência
  const handleCopySchema = () => {
    const schemaExample = JSON.stringify(SAMPLE_REPACK_JSON[0], null, 2);
    navigator.clipboard.writeText(schemaExample);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2500);
  };

  // Carregar dados de exemplo no editor
  const handleLoadSampleIntoEditor = () => {
    const jsonStr = JSON.stringify(SAMPLE_REPACK_JSON, null, 2);
    setJsonText(jsonStr);
    const res = parseRepackJson(jsonStr, empresaId, user.nome);
    setParsedResult(res);
  };

  // Processar arquivo JSON carregado
  const handleFileUpload = (file: File) => {
    if (!file) return;
    setFileName(file.name);
    setFileSize((file.size / 1024).toFixed(1) + ' KB');

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setJsonText(content);
      const res = parseRepackJson(content, empresaId, user.nome);
      setParsedResult(res);
      setPreviewPage(1);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Processar texto digitado/colado no editor
  const handleEditorChange = (text: string) => {
    setJsonText(text);
    if (!text.trim()) {
      setParsedResult(null);
      return;
    }
    const res = parseRepackJson(text, empresaId, user.nome);
    setParsedResult(res);
    setPreviewPage(1);
  };

  // Formatar texto no editor (Beautify)
  const handleBeautifyJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setJsonText(JSON.stringify(parsed, null, 2));
    } catch (e) {
      // ignore
    }
  };

  // Limpar formulário
  const handleClear = () => {
    setJsonText('');
    setFileName(null);
    setFileSize(null);
    setParsedResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Confirmar e salvar no banco de dados
  const handleSaveToDatabase = async () => {
    if (!parsedResult || !parsedResult.valid || parsedResult.despejoRows.length === 0) {
      return;
    }

    setIsSaving(true);
    try {
      const result = await persistirRepackRetroativoNoBanco(
        parsedResult.despejoRows,
        parsedResult.repackRows,
        parsedResult.retroactiveRecords,
        empresaId,
        tornarPadraoOficial
      );

      setSaveResultModal(result);
      if (result.success && onImportSuccess) {
        onImportSuccess();
      }
    } catch (err: any) {
      console.error('Erro ao salvar Repack no banco:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Filtragem na pré-visualização
  const filteredPreviewRows = (parsedResult?.despejoRows || []).filter(row => {
    if (!previewSearch) return true;
    const term = previewSearch.toLowerCase();
    return (
      (row.embalagem && row.embalagem.toLowerCase().includes(term)) ||
      (row.operador && row.operador.toLowerCase().includes(term)) ||
      (row.resultado && row.resultado.toLowerCase().includes(term)) ||
      (row.status && row.status.toLowerCase().includes(term)) ||
      (row.data && row.data.includes(term)) ||
      (row.dataISO && row.dataISO.includes(term))
    );
  });

  const pageSize = 10;
  const totalPages = Math.ceil(filteredPreviewRows.length / pageSize) || 1;
  const paginatedRows = filteredPreviewRows.slice((previewPage - 1) * pageSize, previewPage * pageSize);

  return (
    <div className="space-y-6" id="retroactive-repack-import-container">
      
      {/* CABEÇALHO INFORMATIVO DA IMPORTAÇÃO */}
      <div className="bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#0f172a] rounded-2xl p-5 border border-slate-800 shadow-xl text-slate-100 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-wider border border-amber-500/30 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" />
                Módulo Oficial de Despejo & Repack (Ajudante)
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-black uppercase tracking-wider border border-blue-500/30 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5" />
                Banco Híbrido & Backend Sync
              </span>
            </div>
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              Importação de Dados Retroativos de Repack em JSON
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Carregue ou cole os lotes de repack no formato padrão da plataforma. Os registros são validados, 
              as durações e metas são auditadas, e os dados são gravados com persistência tanto no código da plataforma quanto no Firebase, com expurgo de registros divergentes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopySchema}
              className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Copiar estrutura JSON padrão"
            >
              {copiedSchema ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copiedSchema ? 'Copiado!' : 'Copiar Schema'}</span>
            </button>

            <button
              onClick={handleDownloadSampleJson}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Modelo JSON Padrão</span>
            </button>
          </div>
        </div>

        {/* SCHEMA EXPEDITION CARD */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
          <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800">
            <div className="text-[10px] font-black uppercase text-amber-400 tracking-wider mb-1 flex items-center justify-between">
              <span>Campos Oficiais do Formato Padrão Repack</span>
              <span className="text-[9px] text-slate-500 font-mono">JSON Standard</span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[10px] text-slate-300">
              <div><span className="text-amber-300">Data</span>: "2026-01-02"</div>
              <div><span className="text-amber-300">Embalagem</span>: "PET 2,5L"</div>
              <div><span className="text-amber-300">Quantidade</span>: 15</div>
              <div><span className="text-amber-300">Inicio</span>: "08:15:00"</div>
              <div><span className="text-amber-300">Fim</span>: "09:20:00"</div>
              <div><span className="text-amber-300">Meta</span>: "01:07:30"</div>
              <div><span className="text-amber-300">Resultado</span>: "🟢 DENTRO DA META"</div>
              <div><span className="text-amber-300">Operador</span>: "OZENILDO (G1137)"</div>
            </div>
          </div>

          <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-black uppercase text-emerald-400 tracking-wider mb-1 flex items-center gap-1.5">
                <Server className="w-3 h-3" />
                Destinos Sincronizados na Plataforma & Firebase
              </div>
              <ul className="space-y-1 text-[10px] text-slate-400">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span><strong>Firebase Firestore</strong>: Coleções <code>empresas/{empresaId}/repack</code> & <code>despejo</code></span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span><strong>Código / Local Storage</strong>: <code>repack_rows_{empresaId}</code> (Padrão Ativo)</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span><strong>Tabela JSON Híbrida</strong>: <code>json_db:{empresaId}:repack</code></span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span><strong>Backend Sync</strong>: <code>/public/banco-dados/hoje/repack.json</code></span>
                </li>
              </ul>
            </div>
            
            <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[9px] text-slate-500">
              <span>Expurgo Automático de Divergências</span>
              <span>Persistência Código + Firebase</span>
            </div>
          </div>
        </div>
      </div>

      {/* SELETOR DE MODO DE ENTRADA (UPLOAD vs EDITOR) */}
      <div className="bg-white dark:bg-[#151d28] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveInputMode('upload')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                activeInputMode === 'upload'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Arquivo .JSON
            </button>

            <button
              onClick={() => setActiveInputMode('editor')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                activeInputMode === 'editor'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              Editor / Colar JSON
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeInputMode === 'editor' && (
              <>
                <button
                  onClick={handleLoadSampleIntoEditor}
                  className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Carregar Exemplo Real
                </button>
                <button
                  onClick={handleBeautifyJson}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
                  title="Formatar identação do JSON"
                >
                  Formatar
                </button>
              </>
            )}
            
            {(jsonText || fileName) && (
              <button
                onClick={handleClear}
                className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 rounded-lg text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-all flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* ÁREA DE ENTRADA: UPLOAD */}
        {activeInputMode === 'upload' && (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500 dark:hover:border-amber-500 bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />

            <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
              <Upload className="w-7 h-7" />
            </div>

            <div>
              <p className="text-sm font-black text-slate-800 dark:text-slate-100">
                {fileName ? `Arquivo Selecionado: ${fileName}` : 'Clique para selecionar ou arraste seu arquivo .JSON de Repack aqui'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {fileSize ? `Tamanho: ${fileSize} — Pronto para validação` : 'Suporta arquivos .json contendo lista de apontamentos de Repack'}
              </p>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/40 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Validação Automática e Comparação com Metas</span>
            </div>
          </div>
        )}

        {/* ÁREA DE ENTRADA: EDITOR */}
        {activeInputMode === 'editor' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium px-1">
              <span>Cole aqui o conteúdo JSON completo de Repack</span>
              <span>{jsonText.length} caracteres</span>
            </div>
            <textarea
              rows={12}
              value={jsonText}
              onChange={(e) => handleEditorChange(e.target.value)}
              placeholder={`Exemplo:\n[\n  {\n    "Data": "2026-01-01",\n    "Embalagem": "PET 2,5L",\n    "Quantidade": 1,\n    "Inicio": "14:50:21",\n    "Fim": "14:57:12",\n    "Meta": "00:04:30",\n    "Resultado": "🔴 ACIMA DA META",\n    "Operador": "OZENILDO (G1137)"\n  }\n]`}
              className="w-full font-mono text-xs p-4 rounded-xl bg-slate-900 text-amber-300 border border-slate-700 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              spellCheck={false}
            />
          </div>
        )}

      </div>

      {/* FEEDBACK DE ERROS OU AVISOS */}
      {parsedResult && parsedResult.errors.length > 0 && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl p-4 text-rose-700 dark:text-rose-300 text-xs space-y-1">
          <div className="font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <span>Erros na validação do JSON:</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] pl-2">
            {parsedResult.errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* DASHBOARD DE RESUMO DO LOTE IDENTIFICADO */}
      {parsedResult && parsedResult.valid && (
        <div className="bg-white dark:bg-[#151d28] rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Lote de Repack Validado ({parsedResult.totalRecords} itens)
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Confira a aderência às metas operacionais e o tempo de execução antes de gravar.
              </p>
            </div>

            <button
              onClick={handleSaveToDatabase}
              disabled={isSaving}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg hover:shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Gravando no Banco de Dados...</span>
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  <span>Gravar no Banco de Dados</span>
                </>
              )}
            </button>
          </div>

          {/* 4 CARDS DE INDICADORES DO LOTE DE REPACK */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            
            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1 flex items-center gap-1">
                <FileSpreadsheet className="w-3.5 h-3.5 text-blue-500" />
                Total de Registros
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {parsedResult.totalRecords.toLocaleString('pt-BR')}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Volume Total: <strong className="text-slate-200">{parsedResult.totalQuantidade} un/cx</strong>
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider block mb-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Dentro da Meta (🟢)
              </span>
              <div className="text-2xl font-black text-emerald-500 font-mono">
                {parsedResult.totalDentroDaMeta}
                <span className="text-xs text-slate-400 font-normal ml-1.5">
                  ({parsedResult.totalRecords > 0 ? Math.round((parsedResult.totalDentroDaMeta / parsedResult.totalRecords) * 100) : 0}%)
                </span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Execuções em tempo igual/menor à meta
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-black uppercase text-rose-400 tracking-wider block mb-1 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                Acima da Meta (🔴)
              </span>
              <div className="text-2xl font-black text-rose-500 font-mono">
                {parsedResult.totalAcimaDaMeta}
                <span className="text-xs text-slate-400 font-normal ml-1.5">
                  ({parsedResult.totalRecords > 0 ? Math.round((parsedResult.totalAcimaDaMeta / parsedResult.totalRecords) * 100) : 0}%)
                </span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Tempo excedente registrado
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider block mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Tempo Médio Real
              </span>
              <div className="text-2xl font-black text-amber-500 font-mono">
                {parsedResult.tempoMedioFormatado}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Meta Média: <strong className="text-slate-200 font-mono">{parsedResult.metaMediaFormatada}</strong>
              </span>
            </div>

          </div>

          {/* ── OPÇÃO DE POLÍTICA DE SINCRONIZAÇÃO / PADRÃO OFICIAL ── */}
          <div className="pt-2 space-y-3">
            <span className="text-xs font-black uppercase text-slate-800 dark:text-white tracking-wider block">
              Política de Gravação & Padrão da Plataforma:
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div 
                onClick={() => setTornarPadraoOficial(true)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                  tornarPadraoOficial
                    ? 'bg-amber-500/10 border-amber-500/50 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className={`w-5 h-5 rounded-full mt-0.5 flex items-center justify-center border shrink-0 ${
                  tornarPadraoOficial 
                    ? 'border-amber-500 bg-amber-500 text-white' 
                    : 'border-slate-400 bg-transparent'
                }`}>
                  {tornarPadraoOficial && <Check className="w-3 h-3" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      Tornar Padrão da Plataforma (Substituição Total)
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[9px] font-black uppercase">
                      Expurgar Divergências
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Define este documento como padrão oficial para Repack. <strong>Tudo que divergir deste arquivo será excluído</strong> do banco de dados, da tabela JSON e do histórico retroativo.
                  </p>
                </div>
              </div>

              <div 
                onClick={() => setTornarPadraoOficial(false)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                  !tornarPadraoOficial
                    ? 'bg-blue-500/10 border-blue-500/50 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className={`w-5 h-5 rounded-full mt-0.5 flex items-center justify-center border shrink-0 ${
                  !tornarPadraoOficial 
                    ? 'border-blue-500 bg-blue-500 text-white' 
                    : 'border-slate-400 bg-transparent'
                }`}>
                  {!tornarPadraoOficial && <Check className="w-3 h-3" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      Mesclagem Incremental
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Mantém a base existente intacta e apenas adiciona ou atualiza os registros contidos neste lote.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* TABELA DE PRÉ-VISUALIZAÇÃO DOS DADOS */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider">
                Pré-visualização dos Registros de Repack ({filteredPreviewRows.length} itens)
              </span>

              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  value={previewSearch}
                  onChange={(e) => {
                    setPreviewSearch(e.target.value);
                    setPreviewPage(1);
                  }}
                  placeholder="Filtrar por embalagem, operador, meta..."
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 max-h-[380px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 dark:bg-slate-900 text-[10px] font-black uppercase text-slate-500 sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-3">Data</th>
                    <th className="py-2.5 px-3">Embalagem</th>
                    <th className="py-2.5 px-3 text-right">Qtd</th>
                    <th className="py-2.5 px-3">Início</th>
                    <th className="py-2.5 px-3">Fim</th>
                    <th className="py-2.5 px-3">Tempo Real</th>
                    <th className="py-2.5 px-3">Meta</th>
                    <th className="py-2.5 px-3">Resultado</th>
                    <th className="py-2.5 px-3">Operador / Ajudante</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
                  {paginatedRows.map((row, idx) => {
                    const isAcima = row.resultado?.includes('ACIMA') || row.resultado?.includes('🔴');
                    return (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-2 px-3 font-mono text-[11px] whitespace-nowrap">{row.data}</td>
                        <td className="py-2 px-3 text-[11px] font-bold text-amber-500 dark:text-amber-400 whitespace-nowrap">{row.embalagem}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-[11px] text-slate-900 dark:text-white">{row.quantidade}</td>
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-400">{row.inicio}</td>
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-400">{row.fim}</td>
                        <td className="py-2 px-3 font-mono font-bold text-[11px] text-slate-800 dark:text-slate-200">{row.tempo}</td>
                        <td className="py-2 px-3 font-mono text-[11px] text-blue-500 font-bold">{row.meta}</td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide border ${
                            isAcima 
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }`}>
                            {row.resultado}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-[11px] font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {row.operador}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* PAGINAÇÃO */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
                <span>Página {previewPage} de {totalPages}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPreviewPage(p => Math.max(1, p - 1))}
                    disabled={previewPage === 1}
                    className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 disabled:opacity-40 font-bold"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPreviewPage(p => Math.min(totalPages, p + 1))}
                    disabled={previewPage === totalPages}
                    className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 disabled:opacity-40 font-bold"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* MODAL DE RESULTADO / AUDITORIA DA PERSISTÊNCIA */}
      {saveResultModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0f172a] text-slate-100 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-slate-800 animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-black text-white">
                    Repack Gravado com Sucesso!
                  </h3>
                  {saveResultModal.modoSubstituicaoTotal && (
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-black uppercase">
                      Padrão Oficial Ativado
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  {saveResultModal.importedCount} apontamentos retroativos foram integrados.
                </p>
              </div>
            </div>

            <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 space-y-2.5 text-xs">
              <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider block">
                Auditoria de Destinos Gravados
              </span>
              
              <ul className="space-y-1.5 text-[11px] text-slate-300">
                {saveResultModal.arquivosGerados.map((arq, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{arq}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-slate-800/50 rounded-xl">
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">Volume</span>
                  <span className="text-xs font-black text-amber-300">{saveResultModal.totalVolume} un</span>
                </div>
                <div className="p-2 bg-slate-800/50 rounded-xl">
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">Dentro da Meta</span>
                  <span className="text-xs font-black text-emerald-400">{saveResultModal.totalDentroDaMeta}</span>
                </div>
                <div className="p-2 bg-slate-800/50 rounded-xl">
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">Acima da Meta</span>
                  <span className="text-xs font-black text-rose-400">{saveResultModal.totalAcimaDaMeta}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setSaveResultModal(null);
                  handleClear();
                }}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer"
              >
                Concluir e Voltar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
