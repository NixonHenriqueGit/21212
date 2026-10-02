import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Filter, 
  Search, 
  Download, 
  RefreshCw, 
  Truck, 
  Layers, 
  ArrowRightLeft,
  Calendar,
  AlertCircle,
  CheckCircle,
  FileSpreadsheet,
  Edit3,
  X,
  UserCheck,
  ShieldAlert,
  ChevronDown
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Usuario, Empresa, ValidadeRow } from '../types';
import { 
  FefoBreakItem, 
  FefoBreakStatus, 
  getFefoBreakHistory, 
  saveFefoBreakHistory, 
  updateFefoBreakStatus, 
  calculateFefoBreakMetrics,
  formatToIsoDate
} from '../utils/fefoHistoricoQuebrasManager';

interface FefoEstoqueXEstoqueTabProps {
  validadesList: ValidadeRow[];
  user: Usuario;
  empresa: Empresa | null;
  onRefresh?: () => void;
}

export const FefoEstoqueXEstoqueTab: React.FC<FefoEstoqueXEstoqueTabProps> = ({
  validadesList,
  user,
  empresa,
  onRefresh
}) => {
  const companyId = empresa?.id || 'empresa_1';

  // Raw history state
  const [historyItems, setHistoryItems] = useState<FefoBreakItem[]>(() => {
    return getFefoBreakHistory(companyId);
  });

  // Listen to storage update events
  useEffect(() => {
    const handleUpdate = () => {
      setHistoryItems(getFefoBreakHistory(companyId));
    };
    window.addEventListener('fefo_break_history_updated', handleUpdate);
    window.addEventListener('fefo_auditoria_updated', handleUpdate);
    return () => {
      window.removeEventListener('fefo_break_history_updated', handleUpdate);
      window.removeEventListener('fefo_auditoria_updated', handleUpdate);
    };
  }, [companyId]);

  // Month selector filter
  const [selectedMes, setSelectedMes] = useState<string>('todos');

  // Filters state
  const [statusFilter, setStatusFilter] = useState<'todos' | FefoBreakStatus>('todos');
  const [gravidadeFilter, setGravidadeFilter] = useState<'todos' | 'critica' | 'moderada' | 'leve'>('todos');
  const [ruaFilter, setRuaFilter] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Custom Date Filters
  const [useCustomDateRange, setUseCustomDateRange] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [dateField, setDateField] = useState<'identificacao' | 'validade'>('identificacao');

  // Modal Tratativa state
  const [selectedItemForEdit, setSelectedItemForEdit] = useState<FefoBreakItem | null>(null);
  const [editStatus, setEditStatus] = useState<FefoBreakStatus>('concluido');
  const [editResponsavel, setEditResponsavel] = useState<string>('JOSE RONILDO DA SILVA');
  const [editObs, setEditObs] = useState<string>('');
  const [editDataConclusao, setEditDataConclusao] = useState<string>('');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Filter only Estoque x Estoque items
  const estoqueXEstoqueItems = useMemo(() => {
    return historyItems.filter(item => item.tipo === 'ESTOQUE_X_ESTOQUE');
  }, [historyItems]);

  // Apply all filters
  const filteredItems = useMemo(() => {
    return estoqueXEstoqueItems.filter(item => {
      // Month filter
      if (selectedMes !== 'todos') {
        const itemMonth = item.dataIdentificacao ? item.dataIdentificacao.split('/')[1] : '';
        if (itemMonth !== selectedMes) return false;
      }

      // Status Filter
      if (statusFilter !== 'todos' && item.status !== statusFilter) {
        return false;
      }

      // Gravidade Filter
      if (gravidadeFilter === 'critica' && item.diasInversao <= 30) return false;
      if (gravidadeFilter === 'moderada' && (item.diasInversao <= 14 || item.diasInversao > 30)) return false;
      if (gravidadeFilter === 'leve' && item.diasInversao > 14) return false;

      // Rua Filter
      if (ruaFilter !== 'todos') {
        const matchOrig = item.posicaoOrigem.toLowerCase().includes(ruaFilter.toLowerCase());
        const matchDest = item.posicaoDestino.toLowerCase().includes(ruaFilter.toLowerCase());
        if (!matchOrig && !matchDest) return false;
      }

      // Search Query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const mCod = item.codigo.toLowerCase().includes(q);
        const mDesc = item.descricao.toLowerCase().includes(q);
        const mLoteV = item.loteMaisVelho.toLowerCase().includes(q);
        const mLoteN = item.loteMaisNovo.toLowerCase().includes(q);
        const mPosO = item.posicaoOrigem.toLowerCase().includes(q);
        const mPosD = item.posicaoDestino.toLowerCase().includes(q);
        const mResp = item.responsavel.toLowerCase().includes(q);
        if (!mCod && !mDesc && !mLoteV && !mLoteN && !mPosO && !mPosD && !mResp) return false;
      }

      // Date Range Filter
      if (useCustomDateRange && (startDate || endDate)) {
        const targetDate = dateField === 'identificacao'
          ? formatToIsoDate(item.dataIdentificacao)
          : formatToIsoDate(item.validadeMaisVelho);

        if (startDate && targetDate < startDate) return false;
        if (endDate && targetDate > endDate) return false;
      }

      return true;
    });
  }, [estoqueXEstoqueItems, selectedMes, statusFilter, gravidadeFilter, ruaFilter, searchTerm, useCustomDateRange, startDate, endDate, dateField]);

  // Metrics of filtered set
  const metrics = useMemo(() => {
    return calculateFefoBreakMetrics(filteredItems);
  }, [filteredItems]);

  // Unique Ruas for selector
  const availableRuas = useMemo(() => {
    const set = new Set<string>();
    estoqueXEstoqueItems.forEach(i => {
      const match1 = i.posicaoOrigem.match(/Rua\s*([A-Z0-9]+)/i);
      const match2 = i.posicaoDestino.match(/Rua\s*([A-Z0-9]+)/i);
      if (match1) set.add(match1[1].toUpperCase());
      if (match2) set.add(match2[1].toUpperCase());
    });
    return Array.from(set).sort();
  }, [estoqueXEstoqueItems]);

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Open Edit Tratativa Modal
  const handleOpenEdit = (item: FefoBreakItem) => {
    setSelectedItemForEdit(item);
    setEditStatus(item.status);
    setEditResponsavel(item.responsavel);
    setEditObs(item.tratativaDetalhada || item.observacao || item.acaoOperacional || '');
    setEditDataConclusao(item.dataConclusao || `${item.dataIdentificacao} 08:30`);
  };

  // Save Modal Edit
  const handleSaveEdit = () => {
    if (!selectedItemForEdit) return;
    const isDone = editStatus === 'concluido';
    const updated = updateFefoBreakStatus(
      selectedItemForEdit.id,
      editStatus,
      editObs,
      editResponsavel || user.nome || 'JOSE RONILDO DA SILVA',
      isDone ? (editDataConclusao || `${selectedItemForEdit.dataIdentificacao} 08:30`) : undefined,
      companyId
    );
    setHistoryItems(updated);
    setSelectedItemForEdit(null);
    showFeedback('Tratativa da Quebra Estoque x Estoque salva com sucesso!');
  };

  // Export Excel
  const handleExportExcel = () => {
    const rows = filteredItems.map((item, idx) => ({
      '#': idx + 1,
      'SKU': item.codigo,
      'Descrição': item.descricao,
      'Tipo de Quebra': 'Estoque x Estoque',
      'Rua Origem (Fundo)': item.posicaoOrigem,
      'Validade Antiga': item.validadeMaisVelho,
      'Rua Destino (Frente)': item.posicaoDestino,
      'Validade Nova': item.validadeMaisNovo,
      'Dias Inversão': item.diasInversao,
      'Volume (cx)': item.quantidadeCaixas,
      'Valor Risco (R$)': item.valorRiscoRS,
      'Status': item.status.toUpperCase(),
      'Delegado Por': item.delegadoPor || 'Gilson Rosa (Conferente)',
      'Data Delegação': item.dataDelegacao || item.dataIdentificacao,
      'Data Conclusão': item.dataConclusao || 'Pendente',
      'Empilhador Executor': item.responsavel,
      'Tratativa Detalhada': item.tratativaDetalhada || item.observacao || ''
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Quebras_Estoque_x_Estoque');
    XLSX.writeFile(wb, `Quebras_Estoque_x_Estoque_${companyId}_2026.xlsx`);
    showFeedback('Planilha Excel exportada com sucesso!');
  };

  // Mass Complete Action
  const handleCompleteAllVisible = () => {
    if (filteredItems.length === 0) return;
    if (window.confirm(`Deseja marcar todas as ${filteredItems.length} quebras visíveis de Estoque x Estoque como CONCLUÍDAS?`)) {
      let current = [...historyItems];
      const nowStr = new Date().toLocaleDateString('pt-BR');
      const nowIso = new Date().toISOString();
      const visibleIds = new Set(filteredItems.map(f => f.id));

      current = current.map(item => {
        if (visibleIds.has(item.id)) {
          return {
            ...item,
            status: 'concluido' as FefoBreakStatus,
            dataConclusao: item.dataConclusao || `${nowStr} 08:30`,
            observacao: item.observacao || 'Concluído em lote pelo Gestor.',
            atualizadoEm: nowIso
          };
        }
        return item;
      });

      saveFefoBreakHistory(current, companyId);
      setHistoryItems(current);
      showFeedback(`${filteredItems.length} quebras de Estoque x Estoque marcadas como Concluídas!`);
    }
  };

  // Chart Data: Gravidade
  const gravityChartData = [
    { name: '🚨 Crítica (>30d)', count: metrics.criticos, fill: '#ef4444' },
    { name: '⚠️ Moderada (15-30d)', count: filteredItems.filter(i => i.diasInversao > 14 && i.diasInversao <= 30).length, fill: '#f59e0b' },
    { name: 'ℹ️ Leve (1-14d)', count: filteredItems.filter(i => i.diasInversao <= 14).length, fill: '#3b82f6' }
  ];

  // Chart Data: Ruas
  const ruasChartData = useMemo(() => {
    const counts: Record<string, { count: number; caixas: number }> = {};
    filteredItems.forEach(i => {
      const match = i.posicaoOrigem.match(/Rua\s*([A-Z0-9]+)/i);
      const rua = match ? `Rua ${match[1].toUpperCase()}` : 'Outras';
      if (!counts[rua]) counts[rua] = { count: 0, caixas: 0 };
      counts[rua].count += 1;
      counts[rua].caixas += i.quantidadeCaixas || 0;
    });

    return Object.entries(counts)
      .map(([rua, data]) => ({ rua, count: data.count, caixas: data.caixas }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [filteredItems]);

  // Chart Data: Status Pie
  const statusPieData = [
    { name: 'Concluído', value: metrics.concluidos, fill: '#10b981' },
    { name: 'Em Andamento', value: metrics.emAndamento, fill: '#f59e0b' },
    { name: 'Pendente', value: metrics.pendentes, fill: '#ef4444' }
  ].filter(p => p.value > 0);

  return (
    <div className="w-full flex flex-col gap-6 font-sans">
      
      {/* Toast Feedback */}
      {feedbackMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-bold">{feedbackMsg}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          HEADER BANNER & OPERATIONAL METRICS
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-[#032b5e] to-[#04408c] text-white p-5 sm:p-6 rounded-2xl shadow-lg border border-blue-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider shadow-xs">
              Módulo de Controle FEFO
            </span>
            <span className="bg-blue-800 text-blue-100 text-[10px] font-bold px-2 py-0.5 rounded-md border border-blue-700">
              Estoque Central x Estoque Central
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2.5">
            <ArrowRightLeft className="w-6 h-6 text-amber-400" />
            <span>Auditoria &amp; Histórico de Quebras Estoque x Estoque</span>
          </h2>
          <p className="text-xs text-blue-100/90 mt-1 max-w-3xl leading-relaxed">
            Monitoramento de lotes mais novos bloqueando fisicamente lotes mais antigos nas ruas do armazém.
            As coletas de validade são realizadas na <strong>Sexta-feira</strong> com delegação pelo conferente no mesmo dia, e realocações executadas pelos empilhadores até a <strong>Quinta-feira</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer border-none"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar Excel</span>
          </button>
        </div>
      </div>

      {/* BARRA DE CICLO OPERACIONAL & TENDÊNCIA POSITIVA */}
      <div className="bg-[#032b5e] text-white p-3.5 rounded-xl border border-blue-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Ciclo Operacional Semanal:</strong> As coletas de validade são realizadas na <span className="text-amber-300 font-bold">Sexta-feira</span> com delegação simultânea pelo Conferente Gilson Rosa, e giros executados pelos empilhadores até <span className="text-emerald-300 font-bold">Quinta-feira</span>.
          </span>
        </div>
        <div className="flex items-center gap-1.5 bg-blue-900/80 px-2.5 py-1 rounded-lg border border-blue-700 text-[11px] font-bold text-emerald-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Tendência Positiva: Maio (92.5%) ➔ Junho (94.8%) ➔ Julho (100%) ➔ Agosto (100%)</span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          RAMIFICAR POR MÊS (JANEIRO A AGOSTO 2026)
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center gap-1.5 overflow-x-auto">
        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider px-2 shrink-0 flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-slate-500" /> Ramificar Mês:
        </span>
        {[
          { key: 'todos', label: 'Todos os Meses (Anual)' },
          { key: '01', label: 'Janeiro' },
          { key: '02', label: 'Fevereiro' },
          { key: '03', label: 'Março' },
          { key: '04', label: 'Abril' },
          { key: '05', label: 'Maio' },
          { key: '06', label: 'Junho' },
          { key: '07', label: 'Julho' },
          { key: '08', label: 'Agosto' }
        ].map(m => (
          <button
            key={m.key}
            type="button"
            onClick={() => setSelectedMes(m.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer border-none ${
              selectedMes === m.key
                ? 'bg-[#032b5e] text-white shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          KPIS CARDS
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        
        {/* Card 1: Total */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
            Total Quebras
            <Layers className="w-4 h-4 text-slate-400" />
          </span>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900 font-mono">{metrics.total}</span>
            <span className="text-[10px] text-slate-500 block font-bold mt-0.5">Inversões identificadas</span>
          </div>
        </div>

        {/* Card 2: Críticas */}
        <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-200 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-rose-800 flex items-center justify-between">
            Quebras Críticas
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </span>
          <div className="mt-2">
            <span className="text-2xl font-black text-rose-600 font-mono">{metrics.criticos}</span>
            <span className="text-[10px] text-rose-700 block font-bold mt-0.5">&gt; 30 dias de inversão</span>
          </div>
        </div>

        {/* Card 3: Pendentes */}
        <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 flex items-center justify-between">
            Pendentes
            <Clock className="w-4 h-4 text-amber-600" />
          </span>
          <div className="mt-2">
            <span className="text-2xl font-black text-amber-700 font-mono">{metrics.pendentes}</span>
            <span className="text-[10px] text-amber-800 block font-bold mt-0.5">Aguardando giro físico</span>
          </div>
        </div>

        {/* Card 4: Em Andamento */}
        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-blue-900 flex items-center justify-between">
            Em Andamento
            <Truck className="w-4 h-4 text-blue-600" />
          </span>
          <div className="mt-2">
            <span className="text-2xl font-black text-blue-700 font-mono">{metrics.emAndamento}</span>
            <span className="text-[10px] text-blue-800 block font-bold mt-0.5">Em remanejamento</span>
          </div>
        </div>

        {/* Card 5: Concluídas */}
        <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-900 flex items-center justify-between">
            Concluídas
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </span>
          <div className="mt-2">
            <span className="text-2xl font-black text-emerald-700 font-mono">{metrics.concluidos}</span>
            <span className="text-[10px] text-emerald-800 block font-bold mt-0.5">{metrics.resolucaoPct}% resolvido</span>
          </div>
        </div>

        {/* Card 6: Volume Afetado */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
            Volume em Risco
            <Layers className="w-4 h-4 text-blue-600" />
          </span>
          <div className="mt-2">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-slate-900 font-mono">{metrics.totalCaixas}</span>
              <span className="text-[11px] font-bold text-slate-500">cx</span>
            </div>
            <span className="text-[10px] text-slate-600 block font-mono font-bold mt-0.5">
              R$ {metrics.totalValorRS.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────
          FILTROS INTERATIVOS & SEARCH
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        
        {/* Linha 1: Status Pills & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Status Pills */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setStatusFilter('todos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all cursor-pointer border-none ${
                statusFilter === 'todos' ? 'bg-[#032b5e] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({estoqueXEstoqueItems.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pendente')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all cursor-pointer border-none ${
                statusFilter === 'pendente' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-600 hover:text-red-700'
              }`}
            >
              Pendente ({estoqueXEstoqueItems.filter(i => i.status === 'pendente').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('em_andamento')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all cursor-pointer border-none ${
                statusFilter === 'em_andamento' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-amber-700'
              }`}
            >
              Em Andamento ({estoqueXEstoqueItems.filter(i => i.status === 'em_andamento').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('concluido')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all cursor-pointer border-none ${
                statusFilter === 'concluido' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              Concluído ({estoqueXEstoqueItems.filter(i => i.status === 'concluido').length})
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar SKU, Lote, Descrição, Rua..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-[#032b5e] focus:outline-none transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer border-none bg-transparent"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

        </div>

        {/* Linha 2: Filtros de Gravidade & Rua */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={gravidadeFilter}
              onChange={e => setGravidadeFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-[11px] font-bold rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value="todos">Todas Gravidades</option>
              <option value="critica">🚨 Crítica (&gt;30 dias)</option>
              <option value="moderada">⚠️ Moderada (15-30 dias)</option>
              <option value="leve">ℹ️ Leve (1-14 dias)</option>
            </select>

            <select
              value={ruaFilter}
              onChange={e => setRuaFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-[11px] font-bold rounded-lg px-2.5 py-1.5 focus:outline-none"
            >
              <option value="todos">Todas as Ruas</option>
              {availableRuas.map(r => (
                <option key={r} value={r}>Rua {r}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-bold">
            <span>Exibindo: <strong className="text-slate-900 font-mono">{filteredItems.length}</strong> quebras</span>
          </div>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────
          GRÁFICOS INTERATIVOS RECHARTS
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfico 1: Quebras por Faixa de Inversão */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[9px] bg-red-100 text-red-800 border border-red-200 px-2 py-0.5 rounded font-black tracking-wider uppercase">
              Gravidade dos Desvios
            </span>
            <h3 className="font-sans font-black text-xs uppercase text-[#032b5e] tracking-wider mt-2">
              Quebras por Faixa de Inversão (Dias)
            </h3>
          </div>

          <div className="h-52 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gravityChartData} margin={{ top: 15, right: 10, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} fontWeight="bold" />
                <YAxis stroke="#94a3b8" fontSize={9} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {gravityChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[10px] text-slate-500 font-medium">
            💡 Tolerância FEFO de até 7 dias é permitida em blocagem padrão. Acima de 30 dias exige giro imediato de empilhadeira.
          </div>
        </div>

        {/* Gráfico 2: Quebras por Rua do Estoque */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[9px] bg-amber-100 text-amber-900 border border-amber-200 px-2 py-0.5 rounded font-black tracking-wider uppercase">
              Mapa de Calor Operacional
            </span>
            <h3 className="font-sans font-black text-xs uppercase text-[#032b5e] tracking-wider mt-2">
              Ruas com Maior Incidência de Inversão
            </h3>
          </div>

          <div className="h-52 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ruasChartData} layout="vertical" margin={{ top: 10, right: 15, left: 15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" stroke="#94a3b8" fontSize={9} />
                <YAxis type="category" dataKey="rua" stroke="#94a3b8" fontSize={9} fontWeight="bold" width={55} />
                <Tooltip />
                <Bar dataKey="count" fill="#d97706" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-100 text-[10px] text-amber-800 font-bold">
            🚜 Recomendação: Priorizar rondas de empilhadeira nas ruas com maior concentração de inversões.
          </div>
        </div>

        {/* Gráfico 3: Taxa de Resolução e Status */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[9px] bg-emerald-100 text-emerald-900 border border-emerald-200 px-2 py-0.5 rounded font-black tracking-wider uppercase">
              Controle de Eficácia
            </span>
            <h3 className="font-sans font-black text-xs uppercase text-[#032b5e] tracking-wider mt-2">
              Status de Resolução das Quebras
            </h3>
          </div>

          <div className="h-52 w-full mt-4 flex items-center justify-center">
            {statusPieData.length === 0 ? (
              <div className="text-center text-slate-400 text-xs">Sem dados para o filtro</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 10, fontWeight: 'bold' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="flex items-center justify-between bg-emerald-50 p-2.5 rounded-xl border border-emerald-100 text-[10px] text-emerald-800 font-bold">
            <span>Taxa Geral de Conclusão:</span>
            <span className="font-black font-mono text-xs">{metrics.resolucaoPct}%</span>
          </div>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────
          TABELA EM FORMATO DE LISTA - VISUALIZAÇÃO TOTAL SEM CONGELAMENTO
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-[#032b5e] text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded tracking-wider">
                Auditoria Detalhada de Lotes e Posições
              </span>
              <span className="bg-slate-100 text-slate-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-slate-200">
                {filteredItems.length} Registros Encontrados
              </span>
            </div>
            <h3 className="text-sm font-black text-[#032b5e] uppercase tracking-wider mt-1">
              Lista Operacional de Quebras Estoque x Estoque
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCompleteAllVisible}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1"
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              Concluir Todas Visíveis
            </button>
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="p-10 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center flex flex-col items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
            <h4 className="text-sm font-black text-[#032b5e] uppercase tracking-wider">
              Nenhuma Quebra de Estoque x Estoque Encontrada
            </h4>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Nenhum lote foi identificado com desvio de FEFO para os filtros selecionados.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/90 text-slate-700 border-b border-slate-200 uppercase text-[10px] font-black tracking-wider">
                  <th className="py-3 px-4">Coleta &amp; Delegação</th>
                  <th className="py-3 px-4">SKU / Produto</th>
                  <th className="py-3 px-4">Posição &amp; Validade (Fundo)</th>
                  <th className="py-3 px-4">Posição &amp; Validade (Frente)</th>
                  <th className="py-3 px-4 text-center">Volume &amp; Gap</th>
                  <th className="py-3 px-4 text-center">Status &amp; Conclusão</th>
                  <th className="py-3 px-4">Empilhador Executor</th>
                  <th className="py-3 px-4 text-center">Tratativa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item, idx) => {
                  const isCritica = item.diasInversao > 30;
                  const isDone = item.status === 'concluido';

                  return (
                    <tr key={`ee-row-${item.id}-${idx}`} className="hover:bg-slate-50/90 transition-colors">
                      
                      {/* Coleta & Delegação */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="space-y-1">
                          <div className="text-[10px] font-bold text-slate-800 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span>Coleta: {item.dataIdentificacao}</span>
                          </div>
                          <div className="text-[9.5px] font-bold text-indigo-900 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 flex items-center gap-1">
                            <UserCheck className="w-3 h-3 text-indigo-600 shrink-0" />
                            <span>Delegado: {item.delegadoPor || 'Gilson Rosa (Conferente)'}</span>
                          </div>
                          <div className="text-[9px] text-slate-500 font-medium">
                            Delegação: {item.dataDelegacao || `${item.dataIdentificacao} 14:20`}
                          </div>
                          {isDone && (
                            <div className="text-[9px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 inline-block">
                              Executado: {item.dataConclusao || `${item.dataIdentificacao} 08:30`}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* SKU / Produto */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-[11px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-slate-900">
                            {item.codigo}
                          </span>
                        </div>
                        <p className="font-bold text-slate-800 text-xs mt-0.5 max-w-[200px]" title={item.descricao}>
                          {item.descricao}
                        </p>
                      </td>

                      {/* Posição Mais Antiga (Fundo) */}
                      <td className="py-3.5 px-4 align-top bg-amber-50/20">
                        <div className="flex items-center gap-1">
                          <span className="font-mono font-bold text-amber-700 text-xs">{item.validadeMaisVelho}</span>
                          <span className="text-[9px] bg-amber-100 text-amber-800 font-black px-1 py-0.2 rounded">Fundo</span>
                        </div>
                        <span className="text-[10px] text-slate-700 font-black uppercase block mt-0.5">
                          📍 {item.posicaoOrigem}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono block">
                          Lote: {item.loteMaisVelho || '—'}
                        </span>
                      </td>

                      {/* Posição Mais Nova (Frente) */}
                      <td className="py-3.5 px-4 align-top bg-slate-50/40">
                        <div className="flex items-center gap-1">
                          <span className="font-mono font-bold text-slate-800 text-xs">{item.validadeMaisNovo}</span>
                          <span className="text-[9px] bg-slate-200 text-slate-700 font-black px-1 py-0.2 rounded">Frente</span>
                        </div>
                        <span className="text-[10px] text-slate-700 font-black uppercase block mt-0.5">
                          📍 {item.posicaoDestino}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono block">
                          Lote: {item.loteMaisNovo || '—'}
                        </span>
                      </td>

                      {/* Volume & Gap */}
                      <td className="py-3.5 px-4 align-top text-center">
                        <span className="font-mono font-bold text-slate-800 block text-xs">{item.quantidadeCaixas} cx</span>
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase mt-1 border ${
                          isCritica ? 'bg-red-100 text-red-800 border-red-300' : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}>
                          +{item.diasInversao}d gap
                        </span>
                      </td>

                      {/* Status & Conclusão */}
                      <td className="py-3.5 px-4 align-top text-center">
                        {isDone ? (
                          <>
                            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-full text-[10px] font-black uppercase shadow-2xs">
                              <CheckCircle className="w-3 h-3" /> Concluído
                            </span>
                            <div className="text-[10px] text-emerald-700 font-black mt-1">100% Atingido</div>
                            <div className="text-[9px] text-slate-400">Sanado no Prazo</div>
                          </>
                        ) : (
                          <>
                            <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1 rounded-full text-[10px] font-black uppercase shadow-2xs">
                              <Clock className="w-3 h-3" /> Pendente
                            </span>
                            <div className="text-[10px] text-amber-700 font-black mt-1">Em Andamento</div>
                            <div className="text-[9px] text-slate-400">Aguardando Giro</div>
                          </>
                        )}
                      </td>

                      {/* Empilhador Executor */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-start gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#032b5e] text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                            {item.responsavel.includes('MARIVALDO') ? 'M' : 'R'}
                          </div>
                          <div>
                            <div className="font-black text-slate-900 text-xs leading-tight">
                              {item.responsavel.split('(')[0]}
                            </div>
                            <div className="text-[10px] text-slate-500 font-bold">
                              {item.responsavel.includes('(') ? item.responsavel.slice(item.responsavel.indexOf('(')) : 'Empilhador'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Coluna TRATATIVA (com Botão e Resumo Conforme Solicitado) */}
                      <td className="py-3.5 px-4 align-top text-center max-w-[220px]">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="bg-[#032b5e] hover:bg-[#021f44] text-white text-[11px] font-black px-3 py-1.5 rounded-lg shadow-xs flex items-center justify-center gap-1.5 mx-auto transition-all cursor-pointer border-none"
                        >
                          <span>✏️</span>
                          <span>Tratativa</span>
                        </button>
                        <div className="mt-1.5 text-left text-[9.5px] text-slate-600 line-clamp-3 bg-slate-50 p-1.5 rounded border border-slate-200">
                          {item.tratativaDetalhada || item.observacao || 'Inversão física de blocagem no armazém regularizada.'}
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL DE TRATATIVA / ATUALIZAÇÃO DE STATUS E OBSERVAÇÃO
          ───────────────────────────────────────────────────────────── */}
      {selectedItemForEdit && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            
            <div className="bg-[#032b5e] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">✏️</span>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider">Tratativa de Quebra Estoque x Estoque</h3>
                  <p className="text-[11px] text-blue-200">{selectedItemForEdit.descricao} ({selectedItemForEdit.codigo})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItemForEdit(null)}
                className="text-slate-300 hover:text-white cursor-pointer border-none bg-transparent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4 text-xs font-sans">
              
              {/* Product Info */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] uppercase font-black text-slate-400 block">Tipo de Quebra:</span>
                  <span className="font-bold text-slate-800">Estoque x Estoque (Troca de Ruas)</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black text-slate-400 block">Volume:</span>
                  <span className="font-bold text-slate-800">{selectedItemForEdit.quantidadeCaixas} cx</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black text-slate-400 block">Posição Origem (Fundo):</span>
                  <span className="font-bold text-rose-700">{selectedItemForEdit.posicaoOrigem}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black text-slate-400 block">Posição Destino (Frente):</span>
                  <span className="font-bold text-emerald-700">{selectedItemForEdit.posicaoDestino}</span>
                </div>
                <div className="col-span-2 pt-1 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-indigo-900">
                    👤 Delegado por: {selectedItemForEdit.delegadoPor || 'Gilson Rosa (Conferente / Auditor)'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Data: {selectedItemForEdit.dataDelegacao || `${selectedItemForEdit.dataIdentificacao} 14:20`}
                  </span>
                </div>
              </div>

              {/* Status Selector */}
              <div>
                <label className="block font-black text-slate-700 mb-1">Status da Tratativa / Giro de Estoque</label>
                <select
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value as FefoBreakStatus)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold bg-white text-slate-800"
                >
                  <option value="concluido">✅ Concluído (Giro de Estoque Realizado com Sucesso)</option>
                  <option value="pendente">⏳ Pendente (Aguardando Desobstrução Física)</option>
                  <option value="em_andamento">🔄 Em Andamento (Em Remanejamento no Armazém)</option>
                </select>
              </div>

              {/* Responsible Operator & Data Conclusão */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-slate-700 mb-1">Empilhador Executor Oficial</label>
                  <select
                    value={editResponsavel}
                    onChange={e => setEditResponsavel(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-xl font-bold bg-white text-slate-800"
                  >
                    <option value="JOSE RONILDO DA SILVA (Ronildo - Matrícula G1093)">JOSE RONILDO DA SILVA (Ronildo - G1093)</option>
                    <option value="MARIVALDO ARTUR ALVES (Marivaldo - Matrícula G1071)">MARIVALDO ARTUR ALVES (Marivaldo - G1071)</option>
                    <option value="PAULO PEREIRA DA SILVA (Paulo - Matrícula G1013)">PAULO PEREIRA DA SILVA (Paulo - G1013)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-black text-slate-700 mb-1">Data / Hora Conclusão</label>
                  <input
                    type="text"
                    value={editDataConclusao}
                    onChange={e => setEditDataConclusao(e.target.value)}
                    placeholder="DD/MM/AAAA HH:MM"
                    className="w-full p-2 border border-slate-300 rounded-xl font-mono text-slate-800"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-black text-slate-700 mb-1">Descrição Detalhada da Tratativa Logística</label>
                <textarea
                  value={editObs}
                  onChange={e => setEditObs(e.target.value)}
                  rows={4}
                  placeholder="Descreva a ação corretiva tomada para regularizar a inversão física de estoques..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-slate-800 leading-relaxed"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedItemForEdit(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-100 transition-colors bg-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-5 py-2 bg-[#032b5e] hover:bg-[#021f44] text-white font-black rounded-xl transition-all shadow-xs cursor-pointer border-none"
                >
                  Salvar Tratativa
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default FefoEstoqueXEstoqueTab;
