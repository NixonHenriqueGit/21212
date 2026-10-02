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
  Users,
  ShieldCheck,
  Award,
  FileSpreadsheet,
  Zap,
  TrendingUp
} from 'lucide-react';
import { Usuario } from '../types';
import { 
  parseWlpFaturadoJson, 
  ParsedWlpFaturadoResult, 
  SAMPLE_WLP_FATURADO_JSON,
  MONTH_OPTIONS_SELECT,
  MONTH_NAMES_PT
} from '../utils/retroactiveWlpFaturadoParser';
import { 
  syncRetroactiveWlpFaturadoBatch, 
  WlpSyncResult 
} from '../services/retroactiveWlpFaturadoSyncService';

interface RetroactiveWlpFaturadoJsonImportProps {
  user: Usuario;
  empresaId?: string;
  onImportSuccess?: () => void;
}

export default function RetroactiveWlpFaturadoJsonImport({
  user,
  empresaId = 'demo',
  onImportSuccess
}: RetroactiveWlpFaturadoJsonImportProps) {
  const [activeInputTab, setActiveInputTab] = useState<'upload' | 'paste'>('upload');
  const [selectedTargetMonth, setSelectedTargetMonth] = useState<string>('01/2026'); // Padrão Janeiro
  const [jsonText, setJsonText] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [parsedData, setParsedData] = useState<ParsedWlpFaturadoResult | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<WlpSyncResult | null>(null);
  const [copiedSchema, setCopiedSchema] = useState<boolean>(false);
  const [tornarPadraoOficial, setTornarPadraoOficial] = useState<boolean>(true);
  
  // Table search & filter states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterCargo, setFilterCargo] = useState<string>('todos');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 12;

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Recalcular quando o mês selecionado muda
  const handleMonthSelectionChange = (newMonth: string) => {
    setSelectedTargetMonth(newMonth);
    if (jsonText.trim()) {
      setIsProcessing(true);
      setTimeout(() => {
        const result = parseWlpFaturadoJson(jsonText, empresaId, user.nome, newMonth);
        setParsedData(result);
        setCurrentPage(1);
        setIsProcessing(false);
      }, 50);
    }
  };

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
        const result = parseWlpFaturadoJson(content, empresaId, user.nome, selectedTargetMonth);
        setParsedData(result);
        setCurrentPage(1);
      } catch (err: any) {
        setParsedData({
          valid: false,
          totalRecordsInJson: 0,
          filteredRecordsCount: 0,
          selectedMonthFilter: selectedTargetMonth,
          jornadas: [],
          dailyFaturados: [],
          retroactiveRecords: [],
          monthsSummary: [],
          totalVolumeHl: 0,
          totalHorasTrabalhadas: 0,
          totalColaboradoresUnicos: 0,
          totalDiasComFaturamento: 0,
          wlpGeralHlHh: 0,
          resumoPorCargo: {},
          resumoPorDia: [],
          absenteismoDetectado: {},
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
    const result = parseWlpFaturadoJson(text, empresaId, user.nome, selectedTargetMonth);
    setParsedData(result);
    setCurrentPage(1);
  };

  // Carregar dados de exemplo padrão (Janeiro 2026)
  const handleLoadSample = () => {
    const sampleStr = JSON.stringify(SAMPLE_WLP_FATURADO_JSON, null, 2);
    setJsonText(sampleStr);
    setFileName('exemplo_wlp_faturado_janeiro_2026.json');
    const result = parseWlpFaturadoJson(sampleStr, empresaId, user.nome, selectedTargetMonth);
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
    const schemaExample = JSON.stringify(SAMPLE_WLP_FATURADO_JSON[0], null, 2);
    navigator.clipboard.writeText(schemaExample);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  // Baixar modelo JSON
  const handleDownloadModel = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(SAMPLE_WLP_FATURADO_JSON, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `modelo_wlp_volume_faturado_${selectedTargetMonth.replace('/', '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Executar sincronização no banco
  const handleSyncToDatabase = async () => {
    if (!parsedData || !parsedData.valid) return;

    setIsSaving(true);
    try {
      const result = await syncRetroactiveWlpFaturadoBatch(
        parsedData,
        empresaId,
        selectedTargetMonth,
        tornarPadraoOficial
      );
      setSyncResult(result);
      if (result.success && onImportSuccess) {
        onImportSuccess();
      }
    } catch (err: any) {
      setSyncResult({
        success: false,
        totalJornadasSalvas: 0,
        totalDiasFaturadosSalvos: 0,
        totalVolumeHL: 0,
        wlpGeral: 0,
        mesesAtualizados: [],
        message: `Erro na gravação: ${err.message}`,
        detalhesMeses: [],
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Itens filtrados para a tabela de pré-visualização
  const filteredJornadas = useMemo(() => {
    if (!parsedData) return [];
    return parsedData.jornadas.filter(j => {
      const matchesSearch = 
        j.colaboradorNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        j.dataStr.includes(searchTerm) ||
        j.dataISO.includes(searchTerm) ||
        (j.observacoes && j.observacoes.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCargo = filterCargo === 'todos' || j.cargo.toLowerCase() === filterCargo.toLowerCase();

      return matchesSearch && matchesCargo;
    });
  }, [parsedData, searchTerm, filterCargo]);

  // Paginação
  const totalPages = Math.ceil(filteredJornadas.length / itemsPerPage) || 1;
  const paginatedJornadas = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredJornadas.slice(start, start + itemsPerPage);
  }, [filteredJornadas, currentPage, itemsPerPage]);

  return (
    <div className="space-y-6">
      {/* CABEÇALHO DO MÓDULO */}
      <div className="bg-[#111a30] border-2 border-amber-500/50 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-400 shrink-0">
              <BarChart3 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 bg-amber-500/20 border border-amber-500/40 text-amber-400 font-black text-[10px] uppercase rounded tracking-wider">
                  MÓDULO OFICIAL DE VOLUME FATURADO &amp; PONTO WLP (JSON)
                </span>
                <span className="px-2 py-0.5 bg-blue-500/20 border border-blue-500/30 text-blue-300 font-mono text-[10px] rounded">
                  BANCO HÍBRIDO &amp; PAINEL ESTRATÉGICO
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
                Importação Retroativa de Volume Faturado (HL), Jornadas &amp; Absenteísmo
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Carregue arquivos JSON para alimentar de forma isolada e protegida o volume faturado diário, jornadas e indicadores operacionais de cada mês.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleCopySchema}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              {copiedSchema ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copiedSchema ? 'Schema Copiado!' : 'Copiar Schema'}</span>
            </button>
            <button
              onClick={handleDownloadModel}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar Modelo JSON</span>
            </button>
          </div>
        </div>

        {/* SELETOR DE MÊS ESPECÍFICO (PROTEÇÃO & ISOLAMENTO MÊS A MÊS) */}
        <div className="bg-[#0b1222] border border-blue-500/30 rounded-xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-black uppercase text-white tracking-wide">
                Destino do Lote: Selecione o Mês de Importação
              </span>
            </div>
            <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> 🔒 Isolamento Protegido (Não afeta os demais meses)
            </span>
          </div>

          {/* Seletor em Grid de Pílulas dos 12 Meses */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-13 gap-1.5">
            <button
              type="button"
              onClick={() => handleMonthSelectionChange('TODOS')}
              className={`px-2 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer text-center border ${
                selectedTargetMonth === 'TODOS'
                  ? 'bg-blue-600 text-white border-blue-400 shadow-md scale-102'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 border-slate-800'
              }`}
            >
              Todos
            </button>

            {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map((num) => {
              const mesAno = `${num}/2026`;
              const nome = MONTH_NAMES_PT[num] || num;
              const isSelected = selectedTargetMonth === mesAno;
              const isPico = num === '03' || num === '06' || num === '12';

              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleMonthSelectionChange(mesAno)}
                  className={`px-2 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer text-center border relative ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-md font-black scale-102 ring-2 ring-amber-400/50'
                      : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-800'
                  }`}
                  title={`Importar exclusivamente para ${nome}/2026`}
                >
                  <span className="block">{nome.substring(0, 3)}</span>
                  {isPico && (
                    <span className={`text-[8px] block font-mono ${isSelected ? 'text-slate-950 font-black' : 'text-amber-400'}`}>
                      PICO
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <span>
              Mês Selecionado:{' '}
              <strong className="text-white">
                {selectedTargetMonth === 'TODOS' ? 'Todos os Meses presentes no JSON' : `${MONTH_NAMES_PT[selectedTargetMonth.split('/')[0]] || ''} (${selectedTargetMonth})`}
              </strong>
            </span>
            {selectedTargetMonth !== 'TODOS' && (
              <span className="text-amber-400 text-[11px]">
                Importação direcionada exclusivamente para <strong>{selectedTargetMonth}</strong>
              </span>
            )}
          </div>
        </div>

        {/* SCHEMA GUIDE & DESTINATION INFO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Card Esquerda: Campos Obrigatórios */}
          <div className="bg-[#0b1222] border border-slate-800 rounded-xl p-3.5 space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5" /> CAMPOS DO SCHEMA JSON OFICIAL
            </span>
            <div className="font-mono text-[11px] text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1 overflow-x-auto">
              <div><span className="text-emerald-400">"Data"</span>: <span className="text-amber-300">"2026-01-01"</span></div>
              <div><span className="text-emerald-400">"Volume Faturado (HL)"</span>: <span className="text-cyan-300">901.8</span></div>
              <div><span className="text-emerald-400">"Colaborador (ID)"</span>: <span className="text-amber-300">"MARIVALDO ARTUR ALVES"</span></div>
              <div><span className="text-emerald-400">"Cargo"</span>: <span className="text-purple-300">"Empilhador"</span></div>
              <div><span className="text-emerald-400">"Hora Início (HH:MM)"</span>: <span className="text-amber-300">"06:33"</span>, <span className="text-emerald-400">"Hora Fim (HH:MM)"</span>: <span className="text-amber-300">"15:44"</span></div>
              <div><span className="text-emerald-400">"Horas Trabalhadas"</span>: <span className="text-cyan-300">9.183333</span>, <span className="text-emerald-400">"Observações"</span>: <span className="text-slate-400">null</span></div>
            </div>
          </div>

          {/* Card Direita: Destinos no Banco da Plataforma */}
          <div className="bg-[#0b1222] border border-slate-800 rounded-xl p-3.5 space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5" /> DESTINOS NO BANCO DE DADOS &amp; DASHBOARD
            </span>
            <div className="text-[11px] text-slate-300 space-y-1.5 font-mono">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span><strong>Faturamento Diário:</strong> Coleção <code className="text-cyan-300">wlp_daily_faturados</code></span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span><strong>Pontos dos Colaboradores:</strong> Coleção <code className="text-cyan-300">jornadas_colaboradores</code></span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span><strong>Painel Histórico 2026:</strong> Tabela <code className="text-cyan-300">wlp_historico_volumes</code></span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span><strong>Monitoramento Absenteísmo:</strong> <code className="text-cyan-300">wlp_absenteismo_2026</code></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ÁREA DE INPUT: TABS UPLOAD / EDITOR */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveInputTab('upload')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                activeInputTab === 'upload'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload de Arquivo .JSON</span>
            </button>
            <button
              onClick={() => setActiveInputTab('paste')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                activeInputTab === 'paste'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Editor / Colar JSON</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLoadSample}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Carregar Exemplo de Faturamento</span>
            </button>
            {jsonText && (
              <button
                onClick={handleClear}
                className="px-3 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-rose-500 hover:text-white text-slate-600 dark:text-slate-400 text-xs font-bold rounded-xl flex items-center gap-1 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpar</span>
              </button>
            )}
          </div>
        </div>

        {/* MODO UPLOAD DE ARQUIVO */}
        {activeInputTab === 'upload' && (
          <div className="space-y-4">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500 dark:hover:border-amber-400 rounded-2xl p-8 text-center cursor-pointer transition-all bg-slate-50 dark:bg-[#0b1222] group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {fileName ? fileName : 'Clique ou arraste seu arquivo .JSON de Volume Faturado & Ponto'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Suporta arrays com campos <code className="text-amber-400">Data</code>, <code className="text-amber-400">Volume Faturado (HL)</code>, <code className="text-amber-400">Colaborador</code>, <code className="text-amber-400">Cargo</code>, <code className="text-amber-400">Início/Fim</code>
              </p>
            </div>
          </div>
        )}

        {/* MODO EDITOR / COLAR JSON */}
        {activeInputTab === 'paste' && (
          <div className="space-y-2">
            <textarea
              value={jsonText}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder='Cole aqui seu JSON de Volume Faturado & Ponto no formato oficial...'
              rows={10}
              className="w-full font-mono text-xs p-4 bg-slate-950 text-slate-200 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
        )}

        {/* ALERTAS DE ERRO / AVISO */}
        {parsedData && parsedData.errors.length > 0 && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/40 rounded-xl text-rose-300 space-y-1">
            <div className="flex items-center gap-2 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Erros encontrados no JSON:</span>
            </div>
            <ul className="list-disc list-inside text-xs space-y-0.5 pl-2 font-mono">
              {parsedData.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {parsedData && parsedData.warnings.length > 0 && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs space-y-1">
            <div className="flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Avisos de processamento:</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 pl-2 font-mono text-[11px]">
              {parsedData.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* DASHBOARD DE PRÉ-VISUALIZAÇÃO E MÉTRICAS DO LOTE */}
      {parsedData && parsedData.valid && (
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                LOTE VALIDADO COM SUCESSO
              </span>
              <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight mt-1">
                Resumo Operacional do Lote Carregado
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">
                Filtro Mês Ativo: <strong className="text-amber-400 font-mono">{parsedData.selectedMonthFilter}</strong>
              </span>
            </div>
          </div>

          {/* GRID DE KPIS DO LOTE */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-slate-50 dark:bg-[#0b1222] border border-slate-200 dark:border-slate-800 rounded-xl p-3.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Pontos Operacionais</span>
              <span className="text-lg font-black text-slate-900 dark:text-white font-mono">{parsedData.filteredRecordsCount}</span>
              <span className="text-[10px] text-slate-500 block">Registros de Jornada</span>
            </div>

            <div className="bg-slate-50 dark:bg-[#0b1222] border border-emerald-500/30 rounded-xl p-3.5">
              <span className="text-[10px] uppercase font-bold text-emerald-400 block">Volume Faturado</span>
              <span className="text-lg font-black text-emerald-400 font-mono">
                {parsedData.totalVolumeHl.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} HL
              </span>
              <span className="text-[10px] text-slate-500 block">{parsedData.totalDiasComFaturamento} dias faturados</span>
            </div>

            <div className="bg-slate-50 dark:bg-[#0b1222] border border-blue-500/30 rounded-xl p-3.5">
              <span className="text-[10px] uppercase font-bold text-blue-400 block">Horas Trabalhadas</span>
              <span className="text-lg font-black text-blue-400 font-mono">
                {parsedData.totalHorasTrabalhadas.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}h
              </span>
              <span className="text-[10px] text-slate-500 block">Total HH Homem-Hora</span>
            </div>

            <div className="bg-slate-50 dark:bg-[#0b1222] border border-amber-500/30 rounded-xl p-3.5">
              <span className="text-[10px] uppercase font-bold text-amber-400 block">Quadro Pessoal</span>
              <span className="text-lg font-black text-amber-400 font-mono">
                {parsedData.totalColaboradoresUnicos}
              </span>
              <span className="text-[10px] text-slate-500 block">Colaboradores Únicos</span>
            </div>

            <div className="bg-slate-50 dark:bg-[#0b1222] border border-purple-500/30 rounded-xl p-3.5">
              <span className="text-[10px] uppercase font-bold text-purple-400 block">Índice WLP Estimado</span>
              <span className="text-lg font-black text-purple-400 font-mono">
                {parsedData.wlpGeralHlHh.toFixed(1)} <span className="text-xs">HL/HH</span>
              </span>
              <span className="text-[10px] text-slate-500 block">Produtividade Operacional</span>
            </div>

            <div className="bg-slate-50 dark:bg-[#0b1222] border border-slate-200 dark:border-slate-800 rounded-xl p-3.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Meses no Lote</span>
              <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
                {parsedData.monthsSummary.length}
              </span>
              <span className="text-[10px] text-slate-500 block">
                {parsedData.monthsSummary.map(m => m.mesAno).join(', ')}
              </span>
            </div>
          </div>

          {/* DETALHES POR MÊS NO LOTE */}
          <div className="space-y-3">
            <span className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              Consolidação Mensal no Lote Carregado
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {parsedData.monthsSummary.map((ms) => (
                <div key={ms.mesAno} className="bg-slate-50 dark:bg-[#0b1222] border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                    <span className="font-black text-sm text-slate-900 dark:text-white">
                      {ms.nomeMes} ({ms.mesAno})
                    </span>
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] font-mono font-bold rounded">
                      WLP: {ms.wlpPrevisto.toFixed(1)} HL/HH
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1 font-mono">
                    <div className="flex justify-between">
                      <span>Volume Faturado:</span>
                      <strong className="text-emerald-400">{ms.volumeHL.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} HL</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Homem-Hora:</span>
                      <strong className="text-blue-400">{ms.totalHoras.toFixed(1)}h</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Colaboradores Operando:</span>
                      <strong className="text-white">{ms.colaboradoresUnicos} pessoas</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Dias Operados:</span>
                      <strong className="text-white">{ms.diasComFaturamento} dias</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* TABELA DE PRÉ-VISUALIZAÇÃO DOS PONTOS */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-blue-500" />
                Registros de Ponto &amp; Faturamento ({filteredJornadas.length} itens)
              </span>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    placeholder="Filtrar colaborador, data..."
                    className="pl-8 pr-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                <select
                  value={filterCargo}
                  onChange={(e) => { setFilterCargo(e.target.value); setCurrentPage(1); }}
                  className="px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                >
                  <option value="todos">Todos os Cargos</option>
                  <option value="ajudante">Ajudante</option>
                  <option value="empilhador">Empilhador</option>
                  <option value="conferente">Conferente</option>
                  <option value="operacional">Operacional</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 uppercase font-black text-[10px] tracking-wider">
                  <tr>
                    <th className="p-3">Data</th>
                    <th className="p-3">Colaborador</th>
                    <th className="p-3">Cargo</th>
                    <th className="p-3">Início</th>
                    <th className="p-3">Fim</th>
                    <th className="p-3">Horas (HH)</th>
                    <th className="p-3 text-right">Vol. Dia (HL)</th>
                    <th className="p-3">Observações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                  {paginatedJornadas.map((j, idx) => {
                    const diaInfo = parsedData.resumoPorDia.find(d => d.dataISO === j.dataISO);
                    const volDia = diaInfo?.volumeHL || 0;

                    return (
                      <tr key={j.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                        <td className="p-3 text-slate-800 dark:text-slate-200 font-bold whitespace-nowrap">
                          {j.dataStr}
                        </td>
                        <td className="p-3 font-sans font-bold text-slate-900 dark:text-white">
                          {j.colaboradorNome}
                        </td>
                        <td className="p-3 font-sans">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            j.cargo.toLowerCase() === 'empilhador' 
                              ? 'bg-amber-500/20 text-amber-400' 
                              : j.cargo.toLowerCase() === 'conferente'
                              ? 'bg-purple-500/20 text-purple-400'
                              : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {j.cargo}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400">{j.horaInicio}</td>
                        <td className="p-3 text-slate-400">{j.horaFim}</td>
                        <td className="p-3 font-bold text-emerald-400">{j.duracaoHoras.toFixed(2)}h</td>
                        <td className="p-3 text-right font-bold text-cyan-400">
                          {volDia > 0 ? `${volDia.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} HL` : '-'}
                        </td>
                        <td className="p-3 text-slate-400 font-sans truncate max-w-xs" title={j.observacoes}>
                          {j.observacoes || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* CONTROLES DE PAGINAÇÃO */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-500">
                  Página {currentPage} de {totalPages} ({filteredJornadas.length} registros)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="px-3 py-1 bg-slate-100 dark:bg-slate-800 disabled:opacity-50 text-xs rounded-lg text-slate-700 dark:text-slate-300 font-bold"
                  >
                    Anterior
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className="px-3 py-1 bg-slate-100 dark:bg-slate-800 disabled:opacity-50 text-xs rounded-lg text-slate-700 dark:text-slate-300 font-bold"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* BARRA DE AÇÃO PRINCIPAL PARA GRAVAR NO BANCO */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={tornarPadraoOficial}
                onChange={(e) => setTornarPadraoOficial(e.target.checked)}
                className="rounded text-amber-500 focus:ring-amber-400"
              />
              <span>Tornar este lote o padrão oficial de faturamento e jornada no WLP (Consolidação Automática)</span>
            </label>

            <button
              onClick={handleSyncToDatabase}
              disabled={isSaving}
              className="px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Gravando no Banco da Plataforma...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Gravar e Sincronizar no Painel Estratégico &amp; WLP</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE RESULTADO / FEEDBACK DA SINCRONIZAÇÃO */}
      {syncResult && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111a30] border-2 border-emerald-500/50 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">
                  SINCRONIZAÇÃO CONCLUÍDA
                </span>
                <h3 className="text-lg font-black text-white">
                  Dados Gravados com Sucesso!
                </h3>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {syncResult.message}
            </p>

            <div className="bg-[#0b1222] border border-slate-800 rounded-xl p-4 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-300">
                <span>Pontos Gravados:</span>
                <strong className="text-white">{syncResult.totalJornadasSalvas}</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Lançamentos HL Faturado:</span>
                <strong className="text-cyan-400">{syncResult.totalDiasFaturadosSalvos} dias</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Volume Total HL:</span>
                <strong className="text-emerald-400">{syncResult.totalVolumeHL.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} HL</strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Meses Atualizados:</span>
                <strong className="text-amber-400">{syncResult.mesesAtualizados.join(', ')}</strong>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSyncResult(null)}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md"
              >
                Concluir &amp; Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
