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
  Layers, 
  RefreshCw, 
  Check, 
  ArrowRight,
  Clock,
  Search,
  Filter,
  BarChart3,
  Calendar,
  Truck,
  Users,
  CheckCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Usuario } from '../types';
import { 
  parseEfcEfdJson, 
  ParsedEfcEfdResult, 
  SAMPLE_EFC_EFD_JSON 
} from '../utils/retroactiveEfcEfdParser';
import { 
  syncRetroactiveEfcEfdBatch, 
  EfcEfdSyncResult 
} from '../services/retroactiveEfcEfdSyncService';

interface RetroactiveEfcEfdJsonImportProps {
  user: Usuario;
  empresaId: string;
  onImportSuccess?: () => void;
  onNavigateToDashboard?: () => void;
}

export default function RetroactiveEfcEfdJsonImport({
  user,
  empresaId,
  onImportSuccess,
  onNavigateToDashboard
}: RetroactiveEfcEfdJsonImportProps) {
  const [activeInputTab, setActiveInputTab] = useState<'upload' | 'paste'>('upload');
  const [jsonText, setJsonText] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [parsedData, setParsedData] = useState<ParsedEfcEfdResult | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<EfcEfdSyncResult | null>(null);
  const [copiedSchema, setCopiedSchema] = useState<boolean>(false);
  const [tornarPadraoOficial, setTornarPadraoOficial] = useState<boolean>(true);
  
  // Table search & filter states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterEfcMeta, setFilterEfcMeta] = useState<string>('todos');
  const [filterEfdMeta, setFilterEfdMeta] = useState<string>('todos');
  const [filterCategoria, setFilterCategoria] = useState<string>('todas');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(25);

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
        const result = parseEfcEfdJson(content, empresaId, user.nome);
        setParsedData(result);
        setCurrentPage(1);
      } catch (err: any) {
        setParsedData({
          valid: false,
          rows: [],
          vehicles: [],
          retroactiveRecords: [],
          totalRecords: 0,
          totalPallets: 0,
          totalEfcDentro: 0,
          totalEfcFora: 0,
          taxaEfcDentro: 0,
          totalEfdDentro: 0,
          totalEfdFora: 0,
          taxaEfdDentro: 0,
          tempoMedioCarregamentoMin: 0,
          tempoMedioDescarregamentoMin: 0,
          resumoPorColaborador: {},
          resumoPorCategoria: {},
          resumoPorDiaSemana: {},
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
    const result = parseEfcEfdJson(text, empresaId, user.nome);
    setParsedData(result);
    setCurrentPage(1);
  };

  // Carregar dados de exemplo padrão
  const handleLoadSample = () => {
    const sampleStr = JSON.stringify(SAMPLE_EFC_EFD_JSON, null, 2);
    setJsonText(sampleStr);
    setFileName('exemplo_efc_efd_retroativo.json');
    const result = parseEfcEfdJson(sampleStr, empresaId, user.nome);
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
    const schemaRef = JSON.stringify(SAMPLE_EFC_EFD_JSON[0], null, 2);
    navigator.clipboard.writeText(schemaRef);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 3000);
  };

  // Baixar modelo JSON
  const handleDownloadTemplate = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(SAMPLE_EFC_EFD_JSON, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "modelo_efc_efd_retroativo.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Confirmar e Sincronizar dados
  const handleSyncToPlatform = async () => {
    if (!parsedData || !parsedData.valid || parsedData.vehicles.length === 0) {
      alert('Não há registros válidos para sincronização.');
      return;
    }

    setIsSaving(true);
    try {
      const result = await syncRetroactiveEfcEfdBatch(
        parsedData.vehicles,
        parsedData.retroactiveRecords,
        empresaId,
        tornarPadraoOficial
      );
      setSyncResult(result);
      if (result.success && onImportSuccess) {
        onImportSuccess();
      }
    } catch (err: any) {
      setSyncResult({
        success: false,
        insertedCount: 0,
        updatedCount: 0,
        totalSynced: 0,
        collection: `empresas/${empresaId}/efc_efd_vehicles`,
        publicSyncStatus: false,
        hybridTableStatus: false,
        retroactiveSaved: 0,
        errors: [`Erro ao salvar: ${err.message}`]
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Filtragem dos registros da tabela
  const filteredRows = useMemo(() => {
    if (!parsedData || !parsedData.rows) return [];
    return parsedData.rows.filter(r => {
      // Busca geral
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const match = 
          r.mapa.toLowerCase().includes(query) ||
          r.veiculo.toLowerCase().includes(query) ||
          r.colaboradorCarregamento.toLowerCase().includes(query) ||
          r.colaboradorDescarregamento.toLowerCase().includes(query) ||
          r.dataCarregamento.toLowerCase().includes(query) ||
          r.dataFechamentoRota.toLowerCase().includes(query) ||
          r.categoriaFinal.toLowerCase().includes(query);
        if (!match) return false;
      }

      // Filtro Meta EFC
      if (filterEfcMeta !== 'todos') {
        if (filterEfcMeta === 'dentro' && r.carregamentoMeta !== 'DENTRO') return false;
        if (filterEfcMeta === 'fora' && r.carregamentoMeta !== 'FORA') return false;
      }

      // Filtro Meta EFD
      if (filterEfdMeta !== 'todos') {
        if (filterEfdMeta === 'dentro' && r.descarregamentoMeta !== 'DENTRO') return false;
        if (filterEfdMeta === 'fora' && r.descarregamentoMeta !== 'FORA') return false;
      }

      // Filtro Categoria
      if (filterCategoria !== 'todas') {
        if (r.categoriaFinal !== filterCategoria) return false;
      }

      return true;
    });
  }, [parsedData, searchTerm, filterEfcMeta, filterEfdMeta, filterCategoria]);

  // Paginação
  const totalPages = Math.ceil(filteredRows.length / itemsPerPage) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRows.slice(start, start + itemsPerPage);
  }, [filteredRows, currentPage]);

  return (
    <div className="space-y-6">
      
      {/* ── HEADER BANNER ── */}
      <div className="bg-gradient-to-r from-[#0a192f] via-[#0d2847] to-[#071322] border-2 border-blue-500/40 rounded-3xl p-6 sm:p-7 relative overflow-hidden shadow-2xl text-white">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-widest text-sky-300 bg-sky-500/20 px-3 py-1 rounded-full border border-sky-400/30 flex items-center gap-1.5 shadow-sm">
                <Truck className="w-3.5 h-3.5 text-sky-400" />
                PADRÃO OFICIAL EFC / EFD — IMPORTAÇÃO JSON
              </span>
              <span className="text-[10px] font-bold text-blue-200/80 uppercase font-mono bg-blue-900/50 px-2.5 py-1 rounded-full border border-blue-700/50">
                Pilar Produtividade DPO
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
              Importação de Dados Retroativos EFC &amp; EFD (Carregamento / Descarregamento)
            </h2>
            <p className="text-xs text-blue-100/90 max-w-3xl leading-relaxed">
              Carregue ou cole arquivos JSON com os dados consolidados de <strong>EFC</strong> (Eficiência de Carregamento — Meta ≤ 06:30 / SLA ≥ 96%) e <strong>EFD</strong> (Eficiência de Descarregamento — Meta ≤ 22:00 / SLA ≥ 90%), mapeando Mapas, Placas, Colaboradores, Metas e Status D0/D1-D4.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleLoadSample}
              className="px-4 py-2.5 bg-blue-900/80 hover:bg-blue-800 text-blue-100 border border-blue-500/40 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Carregar Exemplo EFC/EFD
            </button>

            <button
              onClick={handleDownloadTemplate}
              className="px-4 py-2.5 bg-[#0b1222]/80 hover:bg-[#111a30] text-slate-200 border border-slate-700/80 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              Baixar Modelo JSON
            </button>

            <button
              onClick={handleCopySchema}
              className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center gap-1.5"
            >
              {copiedSchema ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-300" />}
              {copiedSchema ? 'Copiado!' : 'Copiar Schema'}
            </button>
          </div>
        </div>
      </div>

      {/* ── SEÇÃO DE ENTRADA DO JSON (UPLOAD OU COLAR) ── */}
      <div className="bg-white dark:bg-[#111a30] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
        
        <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveInputTab('upload')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                activeInputTab === 'upload'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Arquivo .JSON</span>
            </button>

            <button
              onClick={() => setActiveInputTab('paste')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                activeInputTab === 'paste'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Colar Código JSON</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {jsonText && (
              <button
                onClick={handleClear}
                className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpar Dados</span>
              </button>
            )}
          </div>
        </div>

        {/* Input Tab: Upload File */}
        {activeInputTab === 'upload' && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json, application/json"
              onChange={handleFileUpload}
              className="hidden"
              id="efc-efd-file-upload"
            />
            <label
              htmlFor="efc-efd-file-upload"
              className="border-2 border-dashed border-blue-400/40 dark:border-blue-500/30 hover:border-blue-500 bg-blue-50/40 dark:bg-[#0c162c]/60 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:bg-blue-50/80 dark:hover:bg-[#0c162c]"
            >
              <div className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide">
                {fileName ? `Arquivo Carregado: ${fileName}` : 'Clique para selecionar ou arraste o arquivo JSON de EFC/EFD'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md">
                Aceita arquivos .json contendo o lote de viagens, mapas, carregamento e descarregamento.
              </p>
              {isProcessing && (
                <div className="mt-3 flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Processando e validando estrutura do JSON...</span>
                </div>
              )}
            </label>
          </div>
        )}

        {/* Input Tab: Paste Raw JSON */}
        {activeInputTab === 'paste' && (
          <div className="space-y-2">
            <textarea
              value={jsonText}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Cole seu array JSON de EFC / EFD aqui... Ex: [{ 'Mapa': 10470, 'Veiculo': 'SLB3J76', 'Colaborador_Carregamento': 'Paulo Pereira', ... }]"
              rows={8}
              className="w-full bg-slate-50 dark:bg-[#080e1c] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 font-mono text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-y"
            />
          </div>
        )}

        {/* Checkbox: Tornar Padrão Oficial */}
        <div className="bg-blue-50/60 dark:bg-[#0c1830] border border-blue-200/80 dark:border-blue-900/50 rounded-2xl p-4 flex items-start gap-3">
          <input
            type="checkbox"
            id="efc-efd-tornar-padrao"
            checked={tornarPadraoOficial}
            onChange={(e) => setTornarPadraoOficial(e.target.checked)}
            className="mt-0.5 w-4 h-4 text-blue-600 rounded cursor-pointer accent-blue-600"
          />
          <label htmlFor="efc-efd-tornar-padrao" className="text-xs cursor-pointer select-none">
            <span className="font-black text-slate-900 dark:text-white uppercase tracking-wide block">
              Definir como Base Oficial da Plataforma (Substituição Total &amp; Exclusão de Divergências)
            </span>
            <span className="text-slate-600 dark:text-slate-300 font-normal leading-relaxed block mt-0.5">
              Ao marcar esta opção, os registros importados serão definidos como a fonte da verdade oficial do Armazém nas 5 camadas de dados (Repositório Oficial, Cache Local dos Painéis de Conferente e Empilhador, JSON Híbrido, Backend Público e Histórico Retroativo).
            </span>
          </label>
        </div>

      </div>

      {/* ── ERROS OU AVISOS DO PARSER ── */}
      {parsedData && parsedData.errors.length > 0 && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 p-5 rounded-2xl text-rose-800 dark:text-rose-300 text-xs space-y-2">
          <div className="flex items-center gap-2 font-black uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span>Erros identificados na estrutura do JSON:</span>
          </div>
          <ul className="list-disc pl-5 space-y-1 font-mono text-[11px]">
            {parsedData.errors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ── VISUALIZAÇÃO E ESTATÍSTICAS DOS DADOS VALIDADOS ── */}
      {parsedData && parsedData.valid && (
        <div className="space-y-6">

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            
            <div className="bg-white dark:bg-[#111a30] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Veículos / Viagens</span>
                <Truck className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white">
                {parsedData.totalRecords}
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                {parsedData.totalPallets} Paletes Totais
              </span>
            </div>

            <div className="bg-white dark:bg-[#111a30] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Aderência EFC</span>
                <Clock className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                {parsedData.taxaEfcDentro}%
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                {parsedData.totalEfcDentro} Dentro / {parsedData.totalEfcFora} Fora
              </span>
            </div>

            <div className="bg-white dark:bg-[#111a30] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Aderência EFD</span>
                <CheckCircle className="w-4 h-4 text-sky-500" />
              </div>
              <div className="text-xl font-black text-sky-600 dark:text-sky-400">
                {parsedData.taxaEfdDentro}%
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                {parsedData.totalEfdDentro} Dentro / {parsedData.totalEfdFora} Fora
              </span>
            </div>

            <div className="bg-white dark:bg-[#111a30] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">T. Médio Carregamento</span>
                <BarChart3 className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white">
                {parsedData.tempoMedioCarregamentoMin} <span className="text-xs font-normal text-slate-400">min</span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                Meta: ≤ 30 min / Rota
              </span>
            </div>

            <div className="bg-white dark:bg-[#111a30] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">T. Médio Descarga</span>
                <Clock className="w-4 h-4 text-teal-500" />
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white">
                {parsedData.tempoMedioDescarregamentoMin} <span className="text-xs font-normal text-slate-400">min</span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                Meta: ≤ 15 min / Rota
              </span>
            </div>

            <div className="bg-white dark:bg-[#111a30] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Rotas D0 vs Pernoites</span>
                <Calendar className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-xl font-black text-purple-600 dark:text-purple-400">
                {parsedData.resumoPorCategoria['D0']?.count || 0} <span className="text-xs font-normal text-slate-400">D0</span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                {parsedData.totalRecords - (parsedData.resumoPorCategoria['D0']?.count || 0)} Pernoite(s)
              </span>
            </div>

          </div>

          {/* ── TABELA DE PRÉ-VISUALIZAÇÃO INTERATIVA ── */}
          <div className="bg-white dark:bg-[#111a30] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-500" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Pré-visualização dos Registros Consolidados ({filteredRows.length} de {parsedData.totalRecords})
                </h3>
              </div>

              {/* Filtros da Tabela */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Search Box */}
                <div className="relative w-full sm:w-56">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Buscar mapa, placa, operador..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="w-full bg-slate-50 dark:bg-[#0b1222] border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white rounded-xl pl-8 pr-3 py-1.5 outline-none focus:border-blue-500"
                  />
                </div>

                {/* Filtro Meta EFC */}
                <select
                  value={filterEfcMeta}
                  onChange={(e) => { setFilterEfcMeta(e.target.value); setCurrentPage(1); }}
                  className="bg-slate-50 dark:bg-[#0b1222] border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white rounded-xl px-2.5 py-1.5 outline-none focus:border-blue-500"
                >
                  <option value="todos">EFC: Todos</option>
                  <option value="dentro">EFC: Dentro da Meta</option>
                  <option value="fora">EFC: Fora da Meta</option>
                </select>

                {/* Filtro Meta EFD */}
                <select
                  value={filterEfdMeta}
                  onChange={(e) => { setFilterEfdMeta(e.target.value); setCurrentPage(1); }}
                  className="bg-slate-50 dark:bg-[#0b1222] border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white rounded-xl px-2.5 py-1.5 outline-none focus:border-blue-500"
                >
                  <option value="todos">EFD: Todos</option>
                  <option value="dentro">EFD: Dentro da Meta</option>
                  <option value="fora">EFD: Fora da Meta</option>
                </select>

                {/* Filtro Categoria */}
                <select
                  value={filterCategoria}
                  onChange={(e) => { setFilterCategoria(e.target.value); setCurrentPage(1); }}
                  className="bg-slate-50 dark:bg-[#0b1222] border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white rounded-xl px-2.5 py-1.5 outline-none focus:border-blue-500"
                >
                  <option value="todas">Categoria: Todas</option>
                  <option value="D0">D0 (Mesmo Dia)</option>
                  <option value="D1">D1 (1 Dia)</option>
                  <option value="D2">D2 (2 Dias)</option>
                  <option value="D3">D3 (3 Dias)</option>
                  <option value="D4">D4 (4+ Dias)</option>
                </select>

                {/* Itens por Página */}
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#0b1222] border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1">
                  <span className="text-[11px] text-slate-400 font-bold uppercase">Exibir:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    className="bg-transparent text-xs text-slate-900 dark:text-white font-bold outline-none cursor-pointer"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={250}>250</option>
                    <option value={500}>500</option>
                    <option value={10000}>Todos</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase text-[10px] font-black tracking-wider">
                    <th className="py-2.5 px-3">Mapa</th>
                    <th className="py-2.5 px-3">Veículo</th>
                    <th className="py-2.5 px-3">Data / Dia</th>
                    <th className="py-2.5 px-3">Carregamento (EFC)</th>
                    <th className="py-2.5 px-3">Meta EFC</th>
                    <th className="py-2.5 px-3">Descarregamento (EFD)</th>
                    <th className="py-2.5 px-3">Meta EFD</th>
                    <th className="py-2.5 px-3 text-center">Paletes</th>
                    <th className="py-2.5 px-3 text-center">Categoria</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {paginatedRows.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-[#0b1222]/50 transition-colors">
                      
                      {/* Mapa */}
                      <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                        {r.mapa}
                      </td>

                      {/* Veículo */}
                      <td className="py-3 px-3">
                        <span className="font-mono font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                          {r.veiculo}
                        </span>
                      </td>

                      {/* Data / Dia */}
                      <td className="py-3 px-3">
                        <div className="text-slate-800 dark:text-slate-200 font-semibold">{r.dataCarregamento}</div>
                        <div className="text-[10px] text-slate-400">{r.diaSemanaFechamento}</div>
                      </td>

                      {/* Carregamento EFC */}
                      <td className="py-3 px-3">
                        <div className="text-slate-800 dark:text-slate-200 font-semibold">{r.colaboradorCarregamento}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {r.carregamentoInicio} ➔ {r.carregamentoFinal} ({r.carregamentoTempoMin} min)
                        </div>
                      </td>

                      {/* Meta EFC */}
                      <td className="py-3 px-3">
                        {r.carregamentoMeta === 'DENTRO' ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            DENTRO
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            FORA
                          </span>
                        )}
                      </td>

                      {/* Descarregamento EFD */}
                      <td className="py-3 px-3">
                        <div className="text-slate-800 dark:text-slate-200 font-semibold">{r.colaboradorDescarregamento}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {r.descarregamentoInicio} ➔ {r.descarregamentoFinal} ({r.descarregamentoTempoMin} min)
                        </div>
                      </td>

                      {/* Meta EFD */}
                      <td className="py-3 px-3">
                        {r.descarregamentoMeta === 'DENTRO' ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            DENTRO
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 inline-flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            FORA
                          </span>
                        )}
                      </td>

                      {/* Paletes */}
                      <td className="py-3 px-3 text-center font-bold text-slate-800 dark:text-slate-200 font-mono">
                        {r.qtdPallets}
                      </td>

                      {/* Categoria D0-D4 */}
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                          r.categoriaFinal === 'D0'
                            ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800'
                            : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                        }`}>
                          {r.categoriaFinal}
                        </span>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <span>
                  Mostrando <strong>{filteredRows.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</strong> a <strong>{Math.min(currentPage * itemsPerPage, filteredRows.length)}</strong> de <strong>{filteredRows.length}</strong> registros {searchTerm || filterEfcMeta !== 'todos' || filterEfdMeta !== 'todos' || filterCategoria !== 'todas' ? '(filtrados)' : ''}
                </span>
                <span className="text-[10px] bg-sky-500/10 text-sky-400 border border-sky-500/30 px-2 py-0.5 rounded-md font-bold uppercase">
                  100% Processado Sem Limite
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(1)}
                    title="Primeira página"
                    className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 cursor-pointer text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Primeira
                  </button>
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-500 font-bold rounded-lg">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(totalPages)}
                    title="Última página"
                    className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 cursor-pointer text-[10px] font-bold uppercase text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Última
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Total de <strong>{parsedData.totalRecords}</strong> viagens prontas para persistência nas 5 camadas da plataforma.
              </div>

              <div className="flex items-center gap-3">
                <button
                  disabled={isSaving}
                  onClick={handleSyncToPlatform}
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl hover:shadow-2xl transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sincronizando nas 5 camadas...</span>
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

            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h4 className="text-base font-black text-white uppercase tracking-wider">
                  {syncResult.success ? 'Importação e Sincronização de EFC/EFD Concluídas com Sucesso!' : 'Falha na Gravação dos Dados'}
                </h4>
                {syncResult.modoSubstituicaoTotal && (
                  <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    Padrão Oficial da Plataforma Definido
                  </span>
                )}
              </div>

              {syncResult.success && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-emerald-900/30 border border-emerald-500/30 rounded-2xl">
                  <div className="text-xs text-emerald-300">
                    <p className="font-bold">⚡ Dashboard EFC / EFD Atualizado em Tempo Real!</p>
                    <p className="text-[11px] text-emerald-200/80">Todos os indicadores de carregamento (EFC), descarregamento (EFD), permanência de pátio (D0-D4) e rankings de operadores já foram recalculados com os novos dados importados.</p>
                  </div>
                  <button
                    onClick={() => {
                      if (onNavigateToDashboard) {
                        onNavigateToDashboard();
                      } else {
                        window.dispatchEvent(new CustomEvent('app_navigate', { detail: 'logistica-dashboard' }));
                      }
                    }}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0"
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Ver no Dashboard EFC / EFD</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs">
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
