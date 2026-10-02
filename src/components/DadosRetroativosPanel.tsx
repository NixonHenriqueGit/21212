import React, { useState, useEffect, useMemo } from 'react';
import { 
  History, 
  Plus, 
  Trash2, 
  Edit2, 
  Download, 
  Upload, 
  CheckCircle2, 
  Search, 
  Layers, 
  Calendar,
  DollarSign,
  UserCheck,
  FileSpreadsheet,
  AlertCircle,
  Clock,
  Truck,
  Box,
  Tag,
  Filter,
  RefreshCw,
  HelpCircle,
  FileText,
  FileCode,
  Database,
  Check,
  TrendingDown,
  Sparkles,
  Droplet,
  BarChart3,
  Thermometer
} from 'lucide-react';
import { 
  RetroactiveRecord, 
  RetroactiveModule, 
  RETROACTIVE_MODULES_LIST, 
  getRetroactiveRecords, 
  upsertRetroactiveRecord, 
  deleteRetroactiveRecord,
  saveRetroactiveRecords,
  clearRetroactiveModule
} from '../utils/dadosRetroativosUtils';
import { Usuario } from '../types';
import { purgeStaleOperationalCache } from '../utils/safeLocalStorage';
import RetroactiveQuebrasJsonImport from './RetroactiveQuebrasJsonImport';
import RetroactiveRepackJsonImport from './RetroactiveRepackJsonImport';
import RetroactiveDespejoJsonImport from './RetroactiveDespejoJsonImport';
import RetroactiveWlpFaturadoJsonImport from './RetroactiveWlpFaturadoJsonImport';
import RetroactiveEfcEfdJsonImport from './RetroactiveEfcEfdJsonImport';
import RetroactiveTemperaturaJsonImport from './RetroactiveTemperaturaJsonImport';

interface DadosRetroativosPanelProps {
  user: Usuario;
  initialTab?: 'importacao' | 'registros';
  initialModule?: RetroactiveModule;
  onNavigate?: (panel: string) => void;
}

export default function DadosRetroativosPanel({ 
  user,
  initialTab = 'importacao',
  initialModule = 'quebras',
  onNavigate
}: DadosRetroativosPanelProps) {
  const [records, setRecords] = useState<RetroactiveRecord[]>([]);
  const [activeMainTab, setActiveMainTab] = useState<'importacao' | 'registros'>(initialTab);
  const [importModuleTab, setImportModuleTab] = useState<RetroactiveModule>(initialModule);
  const [selectedModule, setSelectedModule] = useState<RetroactiveModule | 'todos'>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  // Modal New/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<RetroactiveRecord> | null>(null);

  // Form Fields adapting to active module
  const [modulo, setModulo] = useState<RetroactiveModule>('quebras');
  const [dataISO, setDataISO] = useState(new Date().toISOString().split('T')[0]);
  const [codigoProduto, setCodigoProduto] = useState('');
  const [descricao, setDescricao] = useState('');
  const [quantidade, setQuantidade] = useState(100);
  const [unidade, setUnidade] = useState('CX');
  const [valorFinanceiro, setValorFinanceiro] = useState(1500);
  const [operador, setOperador] = useState(user.nome || 'Operador Histórico');
  const [setor, setSetor] = useState('Armazém Central');
  const [observacoes, setObservacoes] = useState('');

  // Specialized fields
  const [lote, setLote] = useState('');
  const [dataValidade, setDataValidade] = useState('');
  const [localizacao, setLocalizacao] = useState('');
  const [placa, setPlaca] = useState('');
  const [empilhador, setEmpilhador] = useState('');
  const [colaboradorAjudante, setColaboradorAjudante] = useState('');
  const [horaInicio, setHoraInicio] = useState('08:00');
  const [horaFim, setHoraFim] = useState('11:30');

  useEffect(() => {
    loadData();
  }, [selectedModule]);

  const loadData = () => {
    setRecords(getRetroactiveRecords(selectedModule));
  };

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Helper to parse HH:MM to minutes
  const parseTimeToMinutes = (timeStr?: string): number => {
    if (!timeStr) return 0;
    const parts = timeStr.trim().split(':');
    if (parts.length >= 2) {
      const hh = parseInt(parts[0], 10) || 0;
      const mm = parseInt(parts[1], 10) || 0;
      return hh * 60 + mm;
    }
    return 0;
  };

  const resetFormFields = (targetModule: RetroactiveModule) => {
    setModulo(targetModule);
    setDataISO(new Date().toISOString().split('T')[0]);
    setCodigoProduto('SKU-9068');
    setDescricao(`Registro Retroativo - ${targetModule.toUpperCase()}`);
    setQuantidade(100);
    setUnidade(targetModule === 'quebras' ? 'CX' : 'HL');
    setValorFinanceiro(2500);
    setOperador(user.nome || 'Operador Histórico');
    setSetor('Armazém Central');
    setObservacoes('');

    setLote('LOTE-2026-08');
    setDataValidade('2026-06-30');
    setLocalizacao('RUA A / BL 02 / N3');
    setPlaca('RLT5J54');
    setEmpilhador('Marcos (Operador Empilhadeira)');
    setColaboradorAjudante('Carlos (Ajudante de Armazém)');
    setHoraInicio('08:00');
    setHoraFim('11:30');
  };

  const handleOpenNew = () => {
    setEditingItem(null);
    const initialMod = selectedModule === 'todos' ? 'quebras' : selectedModule;
    resetFormFields(initialMod);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rec: RetroactiveRecord) => {
    setEditingItem(rec);
    setModulo(rec.modulo);
    setDataISO(rec.dataISO);
    setCodigoProduto(rec.codigoProduto || '');
    setDescricao(rec.descricao);
    setQuantidade(rec.quantidade);
    setUnidade(rec.unidade);
    setValorFinanceiro(rec.valorFinanceiro);
    setOperador(rec.operador);
    setSetor(rec.setor);
    setObservacoes(rec.observacoes || '');

    setLote(rec.lote || '');
    setDataValidade(rec.dataValidade || '');
    setLocalizacao(rec.localizacao || '');
    setPlaca(rec.placa || '');
    setEmpilhador(rec.empilhador || rec.operador);
    setColaboradorAjudante(rec.colaboradorAjudante || rec.operador);
    setHoraInicio(rec.horaInicio || '08:00');
    setHoraFim(rec.horaFim || '10:00');

    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!descricao.trim()) {
      alert('Por favor, informe uma descrição para o registro.');
      return;
    }

    const dFmt = new Date(dataISO + 'T00:00:00').toLocaleDateString('pt-BR');

    // Calculate duration in minutes if time fields exist
    let durMin = 0;
    if (horaInicio && horaFim) {
      const mIni = parseTimeToMinutes(horaInicio);
      let mFim = parseTimeToMinutes(horaFim);
      if (mFim < mIni) mFim += 1440;
      durMin = Math.max(1, mFim - mIni);
    }

    const durHoras = durMin / 60;
    const rendimentoHLHora = durHoras > 0 ? (quantidade / durHoras) : 0;

    const itemToSave: RetroactiveRecord = {
      id: editingItem?.id || `retro-${Date.now()}`,
      modulo,
      dataISO,
      dataFormatada: dFmt,
      codigoProduto: codigoProduto.trim(),
      descricao: descricao.trim(),
      quantidade: Number(quantidade) || 0,
      unidade: unidade.trim(),
      valorFinanceiro: Number(valorFinanceiro) || 0,
      operador: (modulo === 'despejo_repack' ? colaboradorAjudante : empilhador) || operador.trim(),
      setor: setor.trim(),
      status: 'Concluído', // Rule 22: All retroactive records initialize as Concluído
      observacoes: observacoes.trim(),

      lote: lote.trim(),
      dataValidade,
      localizacao: localizacao.trim(),
      placa: placa.trim().toUpperCase(),
      empilhador: empilhador.trim(),
      colaboradorAjudante: colaboradorAjudante.trim(),
      horaInicio,
      horaFim,
      duracaoMinutos: durMin,
      rendimentoHLHora,

      simuladoHistorico: true,
      criadoEm: editingItem?.criadoEm || new Date().toISOString()
    };

    upsertRetroactiveRecord(itemToSave);
    setIsModalOpen(false);
    loadData();
    notify(`Registro retroativo de ${modulo.toUpperCase()} salvo com sucesso!`);
  };

  const handleDelete = (id: string) => {
    if (confirm('Deseja excluir este registro retroativo?')) {
      deleteRetroactiveRecord(id);
      loadData();
      notify('Registro retroativo removido.');
    }
  };

  const handleClearModuleBase = () => {
    const activeMod = selectedModule === 'todos' ? 'quebras' : selectedModule;
    if (confirm(`Atenção: Deseja apagar todos os registros retroativos do módulo [${activeMod.toUpperCase()}]?`)) {
      clearRetroactiveModule(activeMod);
      loadData();
      notify(`Base de dados retroativos de [${activeMod.toUpperCase()}] zerada.`);
    }
  };

  // Export Template Example for user to fill and re-import
  const handleExportTemplateExample = (targetMod?: RetroactiveModule) => {
    const modToExport = targetMod || (selectedModule === 'todos' ? 'quebras' : selectedModule);

    let csvHeader = '';
    let csvRows = '';
    let filename = `Modelo_Importacao_Retroativa_${modToExport.toUpperCase()}.csv`;

    switch (modToExport) {
      case 'efc_efd':
        csvHeader = 'DATA;PLACA;EMPILHADOR;HORA_INICIO;HORA_FIM;SKU_PROCESSO;QUANTIDADE_PALLETS;VALOR_RS;OBSERVACOES\n';
        csvRows = 
          '2026-01-15;RLT5J54;Marcos Silva (Empilhador);08:00;09:30;CARREGAMENTO EFC BITREM;120;35000.00;Carregamento concluído doca 2\n' +
          '2026-01-28;QFG1259;Lucas Santos (Empilhador);10:15;11:45;DESCARREGAMENTO EFD;95;28000.00;Descarregamento de fábrica\n' +
          '2026-02-12;NMN4092;Roberto Alves (Empilhador);13:00;15:10;CARREGAMENTO EFC;140;42000.00;Liberado sem avarias\n';
        break;

      case 'despejo_repack':
      case 'repack':
        csvHeader = 'DATA;COLABORADOR_AJUDANTE;PROCESSO_SKU;DESCRICAO;QUANTIDADE_CX_HL;VALOR_RS;HORA_INICIO;HORA_FIM;OBSERVACOES\n';
        csvRows = 
          '2026-01-05;Carlos Ajudante;SKU-982;Repack Garrafas 600ml;120;4800.00;08:00;11:30;Reembalagem efetuada com sucesso\n' +
          '2026-01-19;João Pedro Ajudante;SKU-504;Despejo Garrafas Avariadas;45;1800.00;13:00;14:45;Despejo em bombona homologada\n' +
          '2026-02-08;Carlos Ajudante;SKU-9068;Repack Cerveja Lata 350ml;85;3400.00;09:00;11:15;Montagem de fardos\n';
        break;

      case 'despejo':
        csvHeader = 'DATA;COLABORADOR_AJUDANTE;PROCESSO_SKU;DESCRICAO;QUANTIDADE_HL;VALOR_RS;HORA_INICIO;HORA_FIM;OBSERVACOES\n';
        csvRows = 
          '2026-01-19;João Pedro Ajudante;SKU-504;Despejo Garrafas Avariadas;45;1800.00;13:00;14:45;Despejo em bombona homologada\n';
        break;

      case 'quebras':
        csvHeader = 'DATA;CODIGO_SKU;DESCRICAO_QUEBRA;QUANTIDADE;UNIDADE;VALOR_RS;OPERADOR_RESPONSAVEL;SETOR_ARMAZEM\n';
        csvRows = 
          '2026-01-14;0001010;Quebra Interna Movimentação;12;CX;480.00;Conferente Silva;Setor B\n' +
          '2026-02-02;0005040;Avaria de Transporte;8;CX;320.00;Operador Pátio;Doca 03\n';
        break;

      default:
        csvHeader = 'DATA;CODIGO_SKU;DESCRICAO;QUANTIDADE;UNIDADE;VALOR_RS;OPERADOR;SETOR\n';
        csvRows = '2026-01-10;SKU-001;Registro Histórico Genérico;100;CX;2500.00;Operador Armazém;Geral\n';
        break;
    }

    const fullCsv = csvHeader + csvRows;
    const blob = new Blob(['\uFEFF' + fullCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    notify(`Modelo de planilha (${filename}) exportado com sucesso!`);
  };

  // Handle CSV/Excel File Upload and Import
  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    const reader = new FileReader();

    const targetMod: RetroactiveModule = selectedModule === 'todos' ? 'quebras' : selectedModule;

    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split('\n');
      const newItems: RetroactiveRecord[] = [];

      lines.forEach((line, index) => {
        if (index === 0 && (line.toLowerCase().includes('data') || line.toLowerCase().includes('codigo') || line.toLowerCase().includes('sku'))) return;
        const cols = line.split(/;|,/).map(c => c.trim().replace(/^"|"$/g, ''));
        if (cols.length >= 4) {
          const dataISO = cols[0] || new Date().toISOString().split('T')[0];
          const dFmt = new Date(dataISO + 'T00:00:00').toLocaleDateString('pt-BR');

          let codigoProduto = '';
          let descricao = '';
          let quantidade = 100;
          let valorFinanceiro = 2500;
          let operador = user.nome || 'Operador Retroativo';
          let horaInicio = '08:00';
          let horaFim = '11:00';
          let placa = '';
          let lote = '';
          let dataValidade = '';
          let localizacao = '';

          if (targetMod === 'efc_efd') {
            placa = cols[1] || 'RLT5J54';
            operador = cols[2] || 'Empilhador EFC';
            horaInicio = cols[3] || '08:00';
            horaFim = cols[4] || '10:00';
            descricao = cols[5] || `Operação EFC/EFD Carreta ${placa}`;
            quantidade = parseFloat((cols[6] || '100').replace(',', '.')) || 100;
            valorFinanceiro = parseFloat((cols[7] || '30000').replace('R$', '').replace('.', '').replace(',', '.')) || 30000;
          } else if (targetMod === 'despejo_repack' || targetMod === 'repack' || targetMod === 'despejo') {
            operador = cols[1] || 'Ajudante Armazém';
            codigoProduto = cols[2] || 'SKU-AJUDANTE';
            descricao = cols[3] || `Ajudante Operação ${codigoProduto}`;
            quantidade = parseFloat((cols[4] || '100').replace(',', '.')) || 100;
            valorFinanceiro = parseFloat((cols[5] || '3500').replace('R$', '').replace('.', '').replace(',', '.')) || 3500;
            horaInicio = cols[6] || '08:00';
            horaFim = cols[7] || '11:30';
          } else {
            codigoProduto = cols[1] || 'SKU-RETRO';
            descricao = cols[2] || 'Registro Histórico Retroativo';
            quantidade = parseFloat((cols[3] || '50').replace(',', '.')) || 50;
            valorFinanceiro = parseFloat((cols[5] || '2000').replace(',', '.')) || 2000;
            operador = cols[6] || user.nome || 'Operador Retroativo';
          }

          const mIni = parseTimeToMinutes(horaInicio);
          let mFim = parseTimeToMinutes(horaFim);
          if (mFim < mIni) mFim += 1440;
          const durMin = Math.max(1, mFim - mIni);

          newItems.push({
            id: `imported-${Date.now()}-${index}`,
            modulo: targetMod,
            dataISO,
            dataFormatada: dFmt,
            codigoProduto,
            descricao,
            quantidade,
            unidade: targetMod === 'quebras' ? 'CX' : 'HL',
            valorFinanceiro,
            operador,
            setor: localizacao || 'Armazém Central',
            status: 'Concluído',
            lote,
            dataValidade,
            localizacao,
            placa,
            empilhador: operador,
            colaboradorAjudante: operador,
            horaInicio,
            horaFim,
            duracaoMinutos: durMin,
            rendimentoHLHora: durMin > 0 ? (quantidade / (durMin / 60)) : 0,
            simuladoHistorico: true,
            criadoEm: new Date().toISOString()
          });
        }
      });

      if (newItems.length > 0) {
        const existing = getRetroactiveRecords('todos');
        saveRetroactiveRecords([...newItems, ...existing]);
        loadData();
        notify(`${newItems.length} registros retroativos do módulo [${targetMod.toUpperCase()}] importados com sucesso!`);
      } else {
        alert('Nenhum registro válido identificado na planilha. Utilize o botão "Exportar Exemplo Modelo" para baixar o modelo ideal.');
      }
    };

    reader.readAsText(file, 'ISO-8859-1');
  };

  // Export Filtered Table Report
  const handleExportFilteredReport = () => {
    if (filteredRecords.length === 0) {
      alert('Nenhum dado disponível para exportação com os filtros atuais.');
      return;
    }

    const csvHeader = 'ID;MODULO;DATA;CODIGO_SKU;DESCRICAO;QUANTIDADE;UNIDADE;VALOR_RS;OPERADOR;PLACA;HORA_INICIO;HORA_FIM;DURACAO_MIN;STATUS\n';
    const csvRows = filteredRecords.map(r => 
      `"${r.id}";"${r.modulo}";"${r.dataFormatada}";"${r.codigoProduto || ''}";"${r.descricao}";${r.quantidade};"${r.unidade}";${r.valorFinanceiro};"${r.operador}";"${r.placa || ''}";"${r.horaInicio || ''}";"${r.horaFim || ''}";${r.duracaoMinutos || 0};"${r.status}"`
    ).join('\n');

    const blob = new Blob(['\uFEFF' + csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Relatorio_Base_Retroativa_${selectedModule}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter records
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      if (selectedModule !== 'todos' && r.modulo !== selectedModule) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          r.descricao.toLowerCase().includes(q) ||
          r.codigoProduto?.toLowerCase().includes(q) ||
          r.operador.toLowerCase().includes(q) ||
          r.placa?.toLowerCase().includes(q) ||
          r.lote?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [records, selectedModule, searchTerm]);

  // Aggregate Metrics for Header
  const totals = useMemo(() => {
    let volTotal = 0;
    let valorTotal = 0;
    let durTotalMin = 0;

    filteredRecords.forEach(r => {
      volTotal += r.quantidade;
      valorTotal += r.valorFinanceiro;
      durTotalMin += (r.duracaoMinutos || 0);
    });

    const durHoras = durTotalMin / 60;
    const rendimentoGeral = durHoras > 0 ? (volTotal / durHoras) : 0;

    return {
      count: filteredRecords.length,
      volTotal,
      valorTotal,
      durTotalMin,
      durHoras,
      rendimentoGeral
    };
  }, [filteredRecords]);

  return (
    <div className="space-y-6">
      
      {/* HEADER BANNER - REQUIREMENT 22 CENTRAL DATABASE */}
      <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-blue-900/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5 w-max">
              <History className="w-3.5 h-3.5 text-emerald-300" />
              BASE DE DADOS CENTRAL — IMPORTAÇÃO RETROATIVA
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight mt-2 flex items-center gap-2">
            Registros Históricos & Importação Retroativa do Ano
          </h2>
          <p className="text-xs text-slate-300 font-medium mt-1 max-w-4xl">
            Centralize e importe dados retroativos das operações: <strong>Volume Faturado & Absenteísmo (WLP)</strong>, <strong>Quebras & Avarias</strong>, <strong>Despejo</strong>, <strong>Repack</strong> e <strong>EFC & EFD (Empilhador)</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => {
              purgeStaleOperationalCache(user.empresaId || 'demo');
              loadData();
              notify('Cache operacional do navegador limpo e sincronizado com as bases oficiais!');
            }}
            title="Limpa caches residuais antigos e força recarregamento das bases oficiais completas"
            className="px-3.5 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-md transition-all flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            Limpar Cache Residual
          </button>

          <button
            onClick={() => handleExportTemplateExample()}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-md transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-blue-200" />
            Exportar Exemplo Modelo (.CSV)
          </button>

          <button
            onClick={handleOpenNew}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-md transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Novo Registro Manual
          </button>
        </div>
      </div>

      {/* NOTIFICATION TOAST */}
      {notification && (
        <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-5 py-3 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {notification}
        </div>
      )}

      {/* NAVEGAÇÃO PRINCIPAL: IMPORTAÇÃO vs REGISTROS */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveMainTab('importacao')}
          className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2.5 cursor-pointer ${
            activeMainTab === 'importacao'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20'
              : 'bg-white dark:bg-[#111827] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>Importação de Dados Retroativos (JSON)</span>
          <span className="px-2 py-0.5 rounded-full bg-black/20 text-[10px] font-bold">Novo</span>
        </button>

        <button
          onClick={() => setActiveMainTab('registros')}
          className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2.5 cursor-pointer ${
            activeMainTab === 'registros'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
              : 'bg-white dark:bg-[#111827] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Visão Geral & Lançamentos Históricos</span>
          <span className="px-2 py-0.5 rounded-full bg-black/20 text-[10px] font-bold font-mono">{records.length}</span>
        </button>
      </div>

      {/* CONTEÚDO DA ABA 1: IMPORTAÇÃO RETROATIVA */}
      {activeMainTab === 'importacao' && (
        <div className="space-y-6">
          
          {/* SUB-ABAS DE MÓDULOS DE IMPORTAÇÃO */}
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 tracking-wider flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-500" />
                Selecione o Módulo de Importação Retroativa
              </span>
              <span className="text-[11px] text-slate-400">
                Formatos JSON oficiais integrados
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-3">
              <button
                onClick={() => setImportModuleTab('temperatura')}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                  importModuleTab === 'temperatura'
                    ? 'bg-amber-600 text-white shadow-md ring-2 ring-amber-400/50'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Thermometer className="w-3.5 h-3.5 text-amber-300" />
                <span>Temperatura (JSON / Excel)</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </button>

              <button
                onClick={() => setImportModuleTab('wlp_faturado')}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                  importModuleTab === 'wlp_faturado'
                    ? 'bg-amber-600 text-white shadow-md ring-2 ring-amber-400/50'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-amber-300" />
                <span>Volume Faturado &amp; WLP (JSON)</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </button>

              <button
                onClick={() => setImportModuleTab('quebras')}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                  importModuleTab === 'quebras'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <TrendingDown className="w-3.5 h-3.5 text-amber-300" />
                <span>Quebras & Avarias (JSON)</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </button>

              <button
                onClick={() => setImportModuleTab('despejo')}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                  importModuleTab === 'despejo'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Droplet className="w-3.5 h-3.5 text-amber-300" />
                <span>Despejo (JSON)</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </button>

              <button
                onClick={() => setImportModuleTab('repack')}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                  importModuleTab === 'repack' || importModuleTab === 'despejo_repack'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Box className="w-3.5 h-3.5 text-amber-300" />
                <span>Repack (JSON)</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </button>

              <button
                onClick={() => setImportModuleTab('efc_efd')}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                  importModuleTab === 'efc_efd'
                    ? 'bg-amber-600 text-white shadow-md ring-2 ring-amber-400/50'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Truck className="w-3.5 h-3.5 text-amber-300" />
                <span>EFC &amp; EFD (JSON)</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </button>
            </div>
          </div>

          {/* RENDERIZAÇÃO DO IMPORTADOR DE TEMPERATURA RETROATIVA JSON / EXCEL */}
          {importModuleTab === 'temperatura' && (
            <RetroactiveTemperaturaJsonImport
              user={user}
              empresaId={user.empresaId || 'demo'}
              onImportSuccess={() => {
                loadData();
                notify('Dados retroativos de Temperatura importados e sincronizados na plataforma!');
              }}
              onNavigateToQualidade={() => {
                if (onNavigate) {
                  onNavigate('qualidade');
                } else {
                  window.dispatchEvent(new CustomEvent('app_navigate', { detail: 'qualidade' }));
                }
              }}
            />
          )}

          {/* RENDERIZAÇÃO DO IMPORTADOR DE VOLUME FATURADO & WLP JSON */}
          {importModuleTab === 'wlp_faturado' && (
            <RetroactiveWlpFaturadoJsonImport
              user={user}
              empresaId={user.empresaId || 'demo'}
              onImportSuccess={() => {
                loadData();
                notify('Dados retroativos de Volume Faturado, Jornadas e Absenteísmo persistidos no banco da plataforma!');
              }}
            />
          )}

          {/* RENDERIZAÇÃO DO IMPORTADOR DE QUEBRAS JSON */}
          {importModuleTab === 'quebras' && (
            <RetroactiveQuebrasJsonImport
              user={user}
              empresaId={user.empresaId || 'demo'}
              onImportSuccess={() => {
                loadData();
                notify('Dados retroativos de Quebras importados e persistidos no banco da plataforma!');
              }}
            />
          )}

          {/* RENDERIZAÇÃO DO IMPORTADOR DE DESPEJO JSON */}
          {importModuleTab === 'despejo' && (
            <RetroactiveDespejoJsonImport
              user={user}
              empresaId={user.empresaId || 'demo'}
              onImportSuccess={() => {
                loadData();
                notify('Dados retroativos de Despejo importados e persistidos no banco da plataforma!');
              }}
            />
          )}

          {/* RENDERIZAÇÃO DO IMPORTADOR DE REPACK JSON */}
          {(importModuleTab === 'repack' || importModuleTab === 'despejo_repack') && (
            <RetroactiveRepackJsonImport
              user={user}
              empresaId={user.empresaId || 'demo'}
              onImportSuccess={() => {
                loadData();
                notify('Dados retroativos de Repack importados e persistidos no banco da plataforma!');
              }}
            />
          )}

          {/* RENDERIZAÇÃO DO IMPORTADOR DE EFC / EFD JSON */}
          {importModuleTab === 'efc_efd' && (
            <RetroactiveEfcEfdJsonImport
              user={user}
              empresaId={user.empresaId || 'demo'}
              onImportSuccess={() => {
                loadData();
                notify('Dados retroativos de EFC e EFD importados e persistidos com sucesso nas 5 camadas!');
              }}
              onNavigateToDashboard={() => {
                if (onNavigate) {
                  onNavigate('logistica-dashboard');
                } else {
                  window.dispatchEvent(new CustomEvent('app_navigate', { detail: 'logistica-dashboard' }));
                }
              }}
            />
          )}

        </div>
      )}

      {/* CONTEÚDO DA ABA 2: VISÃO GERAL & REGISTROS */}
      {activeMainTab === 'registros' && (
        <div className="space-y-6">
          
          {/* MODULE SELECTION TABS & IMPORT BAR */}
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            
            {/* Module Selector Buttons */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <button
                onClick={() => setSelectedModule('todos')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  selectedModule === 'todos' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Todos os Módulos
              </button>

              {RETROACTIVE_MODULES_LIST.map(mod => (
                <button
                  key={mod.id}
                  onClick={() => setSelectedModule(mod.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedModule === mod.id 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {mod.label}
                </button>
              ))}
            </div>

            {/* Action Controls for Selected Module */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-1">
              
              <div className="relative w-full md:w-96">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar por SKU, Placa, Lote, Operador..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
                
                {/* Download Specific Template Button */}
                <button
                  onClick={() => handleExportTemplateExample()}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Baixar modelo (.CSV) da operação selecionada para preencher e importar"
                >
                  <Download className="w-3.5 h-3.5 text-blue-400" />
                  Baixar Modelo {selectedModule !== 'todos' ? selectedModule.toUpperCase() : 'CSV'}
                </button>

                {/* Upload File Input */}
                <label className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer">
                  <Upload className="w-3.5 h-3.5 text-emerald-200" />
                  Importar Base (.CSV / Excel)
                  <input
                    type="file"
                    accept=".csv, .txt"
                    onChange={handleCSVImport}
                    className="hidden"
                  />
                </label>

                {/* Export Current Filtered Table */}
                <button
                  onClick={handleExportFilteredReport}
                  className="px-3 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Exportar registros filtrados atuais"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Exportar Relatório
                </button>

                {/* Clear Base */}
                <button
                  onClick={handleClearModuleBase}
                  className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl transition-colors cursor-pointer"
                  title="Apagar / Zerar Base do Módulo Ativo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

            </div>

          </div>

      {/* KPI METRICS SUMMARY */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Registros Retroativos</span>
          <span className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1 block">
            {totals.count}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Lançamentos no módulo</span>
        </div>

        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] font-black uppercase text-amber-500 tracking-wider block">Duração Operacional Total</span>
          <span className="text-2xl font-black font-mono text-amber-400 mt-1 block">
            {totals.durHoras.toFixed(1)} h <span className="text-xs text-slate-400">({totals.durTotalMin} min)</span>
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Somatório de Hora Início → Fim</span>
        </div>

        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] font-black uppercase text-blue-500 tracking-wider block">Volume Total (HL / CX)</span>
          <span className="text-2xl font-black font-mono text-blue-400 mt-1 block">
            {totals.volTotal.toLocaleString('pt-BR')}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Unidades processadas</span>
        </div>

        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs">
          <span className="text-[10px] font-black uppercase text-emerald-500 tracking-wider block">Rendimento Médio Calculado</span>
          <span className="text-2xl font-black font-mono text-emerald-400 mt-1 block">
            {totals.rendimentoGeral.toFixed(1)} <span className="text-xs">unid/h</span>
          </span>
          <span className="text-[11px] text-emerald-600 font-bold mt-0.5 block">R$ {totals.valorTotal.toLocaleString('pt-BR')}</span>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-black uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4">Módulo</th>
                <th className="py-3 px-4">Código / SKU / Placa</th>
                <th className="py-3 px-4">Descrição do Registro</th>
                <th className="py-3 px-4">Operador / Colaborador</th>
                <th className="py-3 px-4 text-center">Hora Início</th>
                <th className="py-3 px-4 text-center">Hora Fim</th>
                <th className="py-3 px-4 text-center font-bold text-amber-500">Duração</th>
                <th className="py-3 px-4 text-right">Qtd</th>
                <th className="py-3 px-4 text-right">Valor (R$)</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400 font-semibold space-y-2">
                    <FileText className="w-8 h-8 mx-auto text-slate-500" />
                    <p>Nenhum registro retroativo encontrado para este filtro.</p>
                    <p className="text-[11px] font-normal">Use o botão "Exportar Exemplo Modelo" para gerar uma planilha pronta para importação.</p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => {
                  const modObj = RETROACTIVE_MODULES_LIST.find(m => m.id === rec.modulo);
                  const modLabel = modObj?.label || rec.modulo;

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all">
                      <td className="py-3 px-4 font-mono font-bold text-blue-400">{rec.dataFormatada}</td>
                      <td className="py-3 px-4 font-extrabold text-blue-300">
                        <span className="bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[10px] px-2 py-0.5 rounded-md uppercase">
                          {modLabel}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-300">
                        {rec.placa ? `PLACA: ${rec.placa}` : (rec.codigoProduto || 'N/A')}
                        {rec.lote && <span className="block text-[10px] text-amber-400">Lote: {rec.lote}</span>}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-200">
                        {rec.descricao}
                        {rec.localizacao && <span className="block text-[10px] text-slate-400">Loc: {rec.localizacao}</span>}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-300">{rec.operador}</td>
                      <td className="py-3 px-4 text-center font-mono font-bold bg-slate-800/40 rounded">{rec.horaInicio || '--:--'}</td>
                      <td className="py-3 px-4 text-center font-mono font-bold bg-slate-800/40 rounded">{rec.horaFim || '--:--'}</td>
                      <td className="py-3 px-4 text-center font-mono font-black text-amber-400">
                        {rec.duracaoMinutos ? `${rec.duracaoMinutos} min` : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-white">
                        {rec.quantidade.toLocaleString('pt-BR')} {rec.unidade}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                        R$ {rec.valorFinanceiro.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(rec)}
                            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg cursor-pointer"
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(rec.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950 rounded-lg cursor-pointer"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )}

      {/* MODAL NEW / EDIT REGISTRATION */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 border border-slate-200 dark:border-slate-700">
            <h3 className="font-black text-slate-900 dark:text-white text-base uppercase tracking-tight flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              {editingItem ? 'Editar Lançamento Retroativo' : `Novo Lançamento Retroativo — ${modulo.toUpperCase()}`}
            </h3>

            {/* FORM GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Módulo Operacional</label>
                <select
                  value={modulo}
                  onChange={e => {
                    const m = e.target.value as RetroactiveModule;
                    resetFormFields(m);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
                >
                  {RETROACTIVE_MODULES_LIST.map(m => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Data do Evento</label>
                <input
                  type="date"
                  value={dataISO}
                  onChange={e => setDataISO(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono text-slate-900 dark:text-white"
                  required
                />
              </div>

              {/* MODULE SPECIFIC FIELDS */}
              {modulo === 'efc_efd' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Placa / Veículo</label>
                    <input
                      type="text"
                      value={placa}
                      onChange={e => setPlaca(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono text-slate-900 dark:text-white uppercase"
                      placeholder="RLT5J54"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Empilhador Responsável</label>
                    <input
                      type="text"
                      value={empilhador}
                      onChange={e => setEmpilhador(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
                      placeholder="Nome do Operador"
                    />
                  </div>
                </>
              )}

              {(modulo === 'quebras' || modulo === 'despejo' || modulo === 'repack') && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Código SKU / Produto</label>
                    <input
                      type="text"
                      value={codigoProduto}
                      onChange={e => setCodigoProduto(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
                      placeholder="0009068"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Operador / Responsável</label>
                    <input
                      type="text"
                      value={operador}
                      onChange={e => setOperador(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
                      placeholder="Nome do Responsável"
                    />
                  </div>
                </>
              )}

              {modulo === 'despejo_repack' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Colaborador / Ajudante</label>
                    <input
                      type="text"
                      value={colaboradorAjudante}
                      onChange={e => setColaboradorAjudante(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
                      placeholder="Carlos Ajudante"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Processo / SKU</label>
                    <input
                      type="text"
                      value={codigoProduto}
                      onChange={e => setCodigoProduto(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
                      placeholder="SKU-982"
                    />
                  </div>
                </>
              )}

              {/* COMMON TIME FIELDS */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400 mb-1">Hora Início (HH:MM)</label>
                <input
                  type="time"
                  value={horaInicio}
                  onChange={e => setHoraInicio(e.target.value)}
                  className="w-full px-3 py-2 bg-amber-50 dark:bg-slate-900 border border-amber-300 dark:border-amber-500/50 rounded-xl font-bold font-mono text-amber-800 dark:text-amber-300"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400 mb-1">Hora Fim (HH:MM)</label>
                <input
                  type="time"
                  value={horaFim}
                  onChange={e => setHoraFim(e.target.value)}
                  className="w-full px-3 py-2 bg-amber-50 dark:bg-slate-900 border border-amber-300 dark:border-amber-500/50 rounded-xl font-bold font-mono text-amber-800 dark:text-amber-300"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Quantidade</label>
                <input
                  type="number"
                  value={quantidade}
                  onChange={e => setQuantidade(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Valor Financeiro (R$)</label>
                <input
                  type="number"
                  value={valorFinanceiro}
                  onChange={e => setValorFinanceiro(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Descrição do Registro</label>
                <input
                  type="text"
                  value={descricao}
                  onChange={e => setDescricao(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
                  placeholder="Ex: Operação retroativa de descarregamento"
                  required
                />
              </div>

            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-colors">
                Cancelar
              </button>
              <button onClick={handleSave} className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-500 cursor-pointer shadow-xs transition-colors">
                Salvar Lançamento Histórico
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
