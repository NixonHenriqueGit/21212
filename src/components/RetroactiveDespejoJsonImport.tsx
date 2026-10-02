import React, { useState, useMemo, useRef } from 'react';
import { 
  FileCode, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Download, 
  Database, 
  Sparkles, 
  Trash2, 
  Eye, 
  Layers, 
  RefreshCw, 
  Check, 
  ArrowRight,
  TrendingDown,
  Clock,
  Search,
  Filter,
  BarChart3,
  Calendar,
  Box,
  Droplet
} from 'lucide-react';
import { Usuario } from '../types';
import { 
  parseDespejoJson, 
  ParsedDespejoResult, 
  SAMPLE_DESPEJO_JSON 
} from '../utils/retroactiveDespejoParser';
import { 
  syncRetroactiveDespejoBatch, 
  DespejoSyncResult 
} from '../services/retroactiveDespejoSyncService';

interface RetroactiveDespejoJsonImportProps {
  user: Usuario;
  empresaId: string;
  onImportSuccess?: () => void;
}

export default function RetroactiveDespejoJsonImport({
  user,
  empresaId,
  onImportSuccess
}: RetroactiveDespejoJsonImportProps) {
  const [activeInputTab, setActiveInputTab] = useState<'upload' | 'paste'>('upload');
  const [jsonText, setJsonText] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [parsedData, setParsedData] = useState<ParsedDespejoResult | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<DespejoSyncResult | null>(null);
  const [copiedSchema, setCopiedSchema] = useState<boolean>(false);
  const [tornarPadraoOficial, setTornarPadraoOficial] = useState<boolean>(true);
  
  // Table search & filter states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterResultado, setFilterResultado] = useState<string>('todos');
  const [filterEmbalagem, setFilterEmbalagem] = useState<string>('todas');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manipular upload de arquivo .json
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
        const result = parseDespejoJson(content, empresaId, user.nome);
        setParsedData(result);
        setCurrentPage(1);
      } catch (err: any) {
        setParsedData({
          valid: false,
          despejoRows: [],
          retroactiveRecords: [],
          totalRecords: 0,
          totalQuantidade: 0,
          totalHlPerdido: 0,
          totalMetaBatida: 0,
          totalMetaNaoBatida: 0,
          tempoMedioSegundos: 0,
          tempoMedioFormatado: '00:00:00',
          resumoPorEmbalagem: {},
          resumoPorProduto: {},
          resumoPorMes: {},
          resumoPorResultado: {},
          errors: [`Falha ao ler o arquivo JSON: ${err.message}`],
          warnings: []
        });
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsText(file);
  };

  // Manipular alteração de texto digitado / colado
  const handleTextChange = (text: string) => {
    setJsonText(text);
    if (!text.trim()) {
      setParsedData(null);
      return;
    }
    const result = parseDespejoJson(text, empresaId, user.nome);
    setParsedData(result);
    setCurrentPage(1);
  };

  // Carregar dados de exemplo padrão
  const handleLoadSample = () => {
    const sampleStr = JSON.stringify(SAMPLE_DESPEJO_JSON, null, 2);
    setJsonText(sampleStr);
    setFileName('exemplo_despejo_retroativo.json');
    const result = parseDespejoJson(sampleStr, empresaId, user.nome);
    setParsedData(result);
    setCurrentPage(1);
  };

  // Limpar formulário
  const handleClear = () => {
    setJsonText('');
    setFileName('');
    setParsedData(null);
    setSyncResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Copiar schema de referência
  const handleCopySchema = () => {
    const schemaExample = JSON.stringify(SAMPLE_DESPEJO_JSON[0], null, 2);
    navigator.clipboard.writeText(schemaExample);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  // Baixar modelo JSON oficial
  const handleDownloadSample = () => {
    const blob = new Blob([JSON.stringify(SAMPLE_DESPEJO_JSON, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modelo_importacao_despejo_retroativo.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Confirmar e salvar dados no banco
  const handleConfirmSave = async () => {
    if (!parsedData || !parsedData.valid || parsedData.despejoRows.length === 0) return;

    setIsSaving(true);
    try {
      const res = await syncRetroactiveDespejoBatch(
        parsedData.despejoRows,
        parsedData.retroactiveRecords,
        empresaId,
        tornarPadraoOficial
      );
      setSyncResult(res);

      if (res.success && onImportSuccess) {
        onImportSuccess();
      }
    } catch (err: any) {
      setSyncResult({
        success: false,
        insertedCount: 0,
        updatedCount: 0,
        totalSynced: 0,
        collection: `empresas/${empresaId}/despejo`,
        publicSyncStatus: false,
        hybridTableStatus: false,
        retroactiveSaved: 0,
        errors: [`Erro ao salvar dados: ${err.message}`]
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Filtragem de registros na tabela
  const filteredRows = useMemo(() => {
    if (!parsedData || !parsedData.despejoRows) return [];

    return parsedData.despejoRows.filter(row => {
      const matchSearch = 
        !searchTerm ||
        row.embalagem.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.motivo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.operador?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.resultado.toLowerCase().includes(searchTerm.toLowerCase());

      const matchResultado = 
        filterResultado === 'todos' || 
        (filterResultado === 'batida' && row.resultado.includes('🟢')) ||
        (filterResultado === 'nao_batida' && row.resultado.includes('🔴'));

      const matchEmbalagem = 
        filterEmbalagem === 'todas' || 
        row.embalagem === filterEmbalagem;

      return matchSearch && matchResultado && matchEmbalagem;
    });
  }, [parsedData, searchTerm, filterResultado, filterEmbalagem]);

  // Paginação
  const totalPages = Math.ceil(filteredRows.length / itemsPerPage) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRows.slice(start, start + itemsPerPage);
  }, [filteredRows, currentPage]);

  const uniqueEmbalagens = useMemo(() => {
    if (!parsedData) return [];
    return Object.keys(parsedData.resumoPorEmbalagem);
  }, [parsedData]);

  return (
    <div className="space-y-6">
      
      {/* ── HEADER CARD DO MÓDULO DE DESPEJO ── */}
      <div className="bg-[#0b1222] border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <Droplet className="w-3.5 h-3.5 text-amber-400" />
                Módulo Oficial de Despejo
              </span>
              <span className="px-3 py-1 bg-sky-500/10 text-sky-400 border border-sky-500/30 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-sky-400" />
                Banco Híbrido & Backend Sync
              </span>
            </div>

            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-3">
              Importação de Dados Retroativos em JSON (Despejo)
            </h2>
            <p className="text-slate-400 text-xs mt-1 max-w-3xl leading-relaxed">
              Carregue ou cole os lotes históricos de Despejo. Os dados são validados,
              sanitizados com segurança e gravados automaticamente no Repositório de Despejo,
              na tabela JSON local e sincronizados em <code className="text-sky-300 font-mono">/public/banco-dados/hoje/despejo.json</code>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopySchema}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md active:scale-95"
            >
              {copiedSchema ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
              <span>{copiedSchema ? 'Copiado!' : 'Copiar Schema'}</span>
            </button>

            <button
              onClick={handleDownloadSample}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Modelo JSON</span>
            </button>
          </div>
        </div>

        {/* ESTRUTURA DOS CAMPOS OBRIGATÓRIOS */}
        <div className="mt-6 pt-5 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-[#111a30]/80 p-4 rounded-2xl border border-slate-800/80">
            <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider block mb-2">
              Campos Obrigatórios da Estrutura
            </span>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 font-mono text-[11px]">
              <div><span className="text-slate-400">Data:</span> <span className="text-emerald-300">"2026-01-02"</span></div>
              <div><span className="text-slate-400">Mês:</span> <span className="text-emerald-300">"JANEIRO"</span></div>
              <div><span className="text-slate-400">CodProduto:</span> <span className="text-emerald-300">9276</span></div>
              <div><span className="text-slate-400">Descricao:</span> <span className="text-emerald-300">"PEPSI ZERO P2"</span></div>
              <div><span className="text-slate-400">EMBALAGEM:</span> <span className="text-emerald-300">"PET 2L"</span></div>
              <div><span className="text-slate-400">Quantidade:</span> <span className="text-emerald-300">5</span></div>
              <div><span className="text-slate-400">HECTO LITRO PERDIDO:</span> <span className="text-emerald-300">0.0006</span></div>
              <div><span className="text-slate-400">INICIO:</span> <span className="text-emerald-300">"16:00:00"</span></div>
              <div><span className="text-slate-400">FINAL:</span> <span className="text-emerald-300">"16:02:42"</span></div>
              <div><span className="text-slate-400">TEMPO:</span> <span className="text-emerald-300">"00:02:42"</span></div>
              <div><span className="text-slate-400">META:</span> <span className="text-emerald-300">"🟢 META BATIDA"</span></div>
            </div>
          </div>

          <div className="bg-[#111a30]/80 p-4 rounded-2xl border border-slate-800/80">
            <span className="text-[10px] font-black uppercase text-sky-400 tracking-wider block mb-2">
              Destinos no Banco de Dados da Plataforma
            </span>
            <ul className="space-y-1.5 text-[11px] text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span><strong>Repositório Oficial:</strong> Coleção <code className="text-sky-300 font-mono">empresas/{empresaId}/despejo</code></span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span><strong>Tabela JSON Híbrida:</strong> <code className="text-sky-300 font-mono">json_db:{empresaId}:despejo</code></span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span><strong>Backend Sync:</strong> <code className="text-sky-300 font-mono">/public/banco-dados/hoje/despejo.json</code></span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span><strong>Central Retroativa:</strong> <code className="text-sky-300 font-mono">af_dados_retroativos_historicos_v3</code></span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── ÁREA DE ENTRADA (TABS: UPLOAD OU EDITOR) ── */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl gap-1">
            <button
              onClick={() => setActiveInputTab('upload')}
              className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                activeInputTab === 'upload'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Upload de Arquivo .JSON</span>
            </button>

            <button
              onClick={() => setActiveInputTab('paste')}
              className={`px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                activeInputTab === 'paste'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileCode className="w-4 h-4" />
              <span>Editor / Colar JSON</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLoadSample}
              className="px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Carregar Exemplo de Despejo</span>
            </button>

            {(jsonText || fileName) && (
              <button
                onClick={handleClear}
                className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpar</span>
              </button>
            )}
          </div>
        </div>

        {/* TAB 1: UPLOAD DE ARQUIVO */}
        {activeInputTab === 'upload' && (
          <div className="space-y-4">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500 dark:hover:border-amber-400 rounded-3xl p-8 text-center bg-slate-50 dark:bg-[#0b1222]/50 hover:bg-amber-50/50 dark:hover:bg-amber-950/10 transition-all cursor-pointer group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform shadow-inner">
                <FileCode className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">
                {fileName ? fileName : 'Clique para selecionar ou arraste o arquivo .JSON de Despejo'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                Suporta arrays completos de objetos JSON com campos padrão de Despejo.
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: EDITOR / COLAR JSON */}
        {activeInputTab === 'paste' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="font-bold">Cole o código JSON abaixo:</span>
              <span>{jsonText.length > 0 ? `${jsonText.length} caracteres` : 'Vazio'}</span>
            </div>
            <textarea
              value={jsonText}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder='[\n  {\n    "Data": "2026-01-02",\n    "Mês": "JANEIRO",\n    "CodProduto": 9276,\n    "Descricao": "PEPSI ZERO P2",\n    "EMBALAGEM": "PET 2L",\n    "Quantidade": 5,\n    "HECTO LITRO PERDIDO": 0.0006,\n    "INICIO": "16:00:00",\n    "FINAL": "16:02:42",\n    "TEMPO": "00:02:42",\n    "META": "🟢 META BATIDA"\n  }\n]'
              rows={12}
              className="w-full p-4 bg-slate-900 text-amber-300 font-mono text-xs rounded-2xl border border-slate-700 focus:outline-none focus:border-amber-500 leading-relaxed shadow-inner"
            />
          </div>
        )}

        {/* FEEDBACK DE ERROS DE VALIDAÇÃO */}
        {parsedData && !parsedData.valid && (
          <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 p-4 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-black text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4" />
              <span>Erros Identificados na Validação do JSON</span>
            </div>
            <ul className="list-disc list-inside text-xs text-rose-700 dark:text-rose-300 space-y-1 font-mono">
              {parsedData.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ── PAINEL DE PREVIEW E MÉTRICAS DO LOTE DE DESPEJO ── */}
      {parsedData && parsedData.valid && (
        <div className="space-y-6">
          
          {/* KPI CARDS RESUMO DO LOTE */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                Total de Registros
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {parsedData.totalRecords}
                </span>
                <span className="text-xs font-bold text-slate-500">lançamentos</span>
              </div>
            </div>

            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                Volume Despejado
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-amber-500">
                  {parsedData.totalQuantidade.toLocaleString('pt-BR')}
                </span>
                <span className="text-xs font-bold text-slate-500">unidades</span>
              </div>
            </div>

            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                HL Perdido Total
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-rose-500">
                  {parsedData.totalHlPerdido.toFixed(4)}
                </span>
                <span className="text-xs font-bold text-slate-500">HL</span>
              </div>
            </div>

            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                Metas Batidas
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-500">
                  {parsedData.totalMetaBatida}
                </span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  ({parsedData.totalRecords > 0 ? Math.round((parsedData.totalMetaBatida / parsedData.totalRecords) * 100) : 0}%)
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs col-span-2 sm:col-span-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                Tempo Médio
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-sky-500 font-mono">
                  {parsedData.tempoMedioFormatado}
                </span>
              </div>
            </div>
          </div>

          {/* TABELA DE PRÉ-VISUALIZAÇÃO DOS DADOS */}
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Eye className="w-4 h-4 text-amber-500" />
                  <span>Pré-Visualização do Lote de Despejo</span>
                  <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/30 rounded-md text-[10px] font-bold">
                    {filteredRows.length} de {parsedData.totalRecords}
                  </span>
                </h3>
              </div>

              {/* FILTROS DA TABELA */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Buscar produto, embalagem..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500 w-48 sm:w-60"
                  />
                </div>

                <select
                  value={filterResultado}
                  onChange={(e) => { setFilterResultado(e.target.value); setCurrentPage(1); }}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
                >
                  <option value="todos">Todos os Resultados</option>
                  <option value="batida">🟢 Meta Batida</option>
                  <option value="nao_batida">🔴 Meta Não Batida</option>
                </select>

                {uniqueEmbalagens.length > 1 && (
                  <select
                    value={filterEmbalagem}
                    onChange={(e) => { setFilterEmbalagem(e.target.value); setCurrentPage(1); }}
                    className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
                  >
                    <option value="todas">Todas as Embalagens</option>
                    {uniqueEmbalagens.map(emb => (
                      <option key={emb} value={emb}>{emb}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* TABELA DE REGISTROS */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 font-black uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <th className="p-3">Data</th>
                    <th className="p-3">Embalagem & Detalhes</th>
                    <th className="p-3 text-center">Quantidade</th>
                    <th className="p-3 text-center">Início</th>
                    <th className="p-3 text-center">Final</th>
                    <th className="p-3 text-center">Duração</th>
                    <th className="p-3 text-center">HL Perdido</th>
                    <th className="p-3 text-center">Resultado</th>
                    <th className="p-3">Operador</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                  {paginatedRows.map((row, idx) => (
                    <tr key={row.id || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {row.data}
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Box className="w-3.5 h-3.5 text-amber-500" />
                          <span>{row.embalagem}</span>
                        </div>
                        {row.motivo && (
                          <span className="text-[10px] text-slate-400 block line-clamp-1">
                            {row.motivo}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center font-bold text-amber-600 dark:text-amber-400">
                        {row.quantidade}
                      </td>
                      <td className="p-3 text-center font-mono text-slate-500 whitespace-nowrap">
                        {row.inicio}
                      </td>
                      <td className="p-3 text-center font-mono text-slate-500 whitespace-nowrap">
                        {row.fim}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-sky-600 dark:text-sky-400 whitespace-nowrap">
                        {row.tempo}
                      </td>
                      <td className="p-3 text-center font-mono text-rose-500 font-bold whitespace-nowrap">
                        {row.motivo?.match(/HL Perdido: ([\d.]+)/)?.[1] || '-'}
                      </td>
                      <td className="p-3 text-center whitespace-nowrap">
                        {row.resultado.includes('🟢') || row.resultado.includes('BATIDA') ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            🟢 META BATIDA
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                            🔴 NÃO BATIDA
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400 text-xs">
                        {row.operador || 'OPERADOR DESPEJO'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* CONTROLES DE PAGINAÇÃO */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
                <span>Página {currentPage} de {totalPages}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg font-bold disabled:opacity-40 cursor-pointer"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg font-bold disabled:opacity-40 cursor-pointer"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}

            {/* ── OPÇÃO DE POLÍTICA DE SINCRONIZAÇÃO / PADRÃO OFICIAL ── */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-black uppercase text-slate-800 dark:text-white tracking-wider">
                  Política de Gravação & Padrão da Plataforma:
                </span>
              </div>

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
                      Define este documento como a única fonte da verdade para Despejo. <strong>Tudo que divergir deste arquivo será excluído</strong> do banco de dados, da tabela JSON e do histórico retroativo.
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

              {tornarPadraoOficial && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    <strong>Modo Padrão Ativo:</strong> Ao confirmar, o sistema sincronizará apenas os <strong>{parsedData.despejoRows.length} registros</strong> deste arquivo, removendo dados divergentes anteriores.
                  </span>
                </div>
              )}
            </div>

            {/* BARRA DE AÇÃO PRINCIPAL: CONFIRMAR IMPORTAÇÃO */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                <span className="font-bold text-slate-800 dark:text-white">{parsedData.despejoRows.length} registros</span> prontos para serem persistidos no banco de Despejo.
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleClear}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  onClick={handleConfirmSave}
                  disabled={isSaving}
                  className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Gravando no Banco...</span>
                    </>
                  ) : (
                    <>
                      <Database className="w-4 h-4" />
                      <span>{tornarPadraoOficial ? 'Definir Padrão e Gravar' : 'Confirmar e Gravar Base'} ({parsedData.totalRecords})</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── MODAL / BANNER DE SUCESSO APÓS GRAVAÇÃO ── */}
      {syncResult && (
        <div className={`p-6 rounded-3xl border shadow-xl ${
          syncResult.success 
            ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200' 
            : 'bg-rose-950/30 border-rose-500/30 text-rose-200'
        }`}>
          <div className="flex items-start gap-4">
            {syncResult.success ? (
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
            )}

            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h4 className="text-base font-black text-white uppercase tracking-wider">
                  {syncResult.success ? 'Importação e Sincronização Concluídas com Sucesso!' : 'Falha na Gravação dos Dados'}
                </h4>
                {syncResult.modoSubstituicaoTotal && (
                  <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    Padrão Oficial da Plataforma Definido
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
                <div className="bg-[#0b1222]/60 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Gravados no Repositório</span>
                  <span className="text-lg font-black text-white">{syncResult.insertedCount}</span>
                </div>
                <div className="bg-[#0b1222]/60 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Tabela JSON Local</span>
                  <span className="text-lg font-black text-emerald-400">{syncResult.hybridTableStatus ? 'Sincronizada' : 'Pendente'}</span>
                </div>
                <div className="bg-[#0b1222]/60 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Backend Público</span>
                  <span className="text-lg font-black text-sky-400">{syncResult.publicSyncStatus ? 'Sincronizado' : 'Offline'}</span>
                </div>
                <div className="bg-[#0b1222]/60 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Histórico Retroativo</span>
                  <span className="text-lg font-black text-amber-400">{syncResult.retroactiveSaved} salvos</span>
                </div>
              </div>

              {syncResult.divergenciasRemovidas !== undefined && syncResult.divergenciasRemovidas > 0 && (
                <div className="mt-2 text-xs text-rose-300 bg-rose-950/40 border border-rose-800/50 p-2.5 rounded-xl flex items-center gap-2">
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span><strong>Expurgo de Divergências:</strong> {syncResult.divergenciasRemovidas} registros anteriores divergentes foram removidos com sucesso.</span>
                </div>
              )}

              {syncResult.errors.length > 0 && (
                <div className="mt-3 p-3 bg-rose-900/40 rounded-xl border border-rose-700/50 text-xs font-mono text-rose-300">
                  {syncResult.errors.join(' | ')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
