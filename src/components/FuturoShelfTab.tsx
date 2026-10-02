import React, { useState, useMemo, useEffect } from 'react';
import { ValidadeRow, Usuario, Empresa } from '../types';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Download, 
  Search, 
  Filter, 
  RefreshCw, 
  FileSpreadsheet, 
  FileText,
  Calendar,
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Tag,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { calcularTotalCaixas } from '../data/coletaPackagingData';
import { useVendaMedia030519, get030519DataForSku } from '../utils/vendaMedia030519';

interface FuturoShelfTabProps {
  validadesList: ValidadeRow[];
  user: Usuario;
  empresa: Empresa | null;
  onRefresh?: () => void;
}

export interface CalculatedFuturoShelfRow {
  _docId?: string;
  id: number;
  codigo: string;
  descricao: string;
  lote: string;
  quantidade: number;
  dataVencimento: string; // YYYY-MM-DD
  dataJanelaCritica: string; // YYYY-MM-DD (Vencimento - 30 dias)
  diasParaVencer: number; // Vencimento - Data Atual
  vendaMediaDiaria: number;
  diasEstoque: number;
  dataPrevisaoEscoamento: string;
  status: 'Futuro Shelf' | 'Vencido' | 'Seguro';
  localizacao: string;
  bloco?: string;
  curvaAbc: 'A' | 'B' | 'C';
  is030519: boolean;
  sobraEstimadaCx: number;
}

export default function FuturoShelfTab({ validadesList, user, empresa, onRefresh }: FuturoShelfTabProps) {
  const { getItem: get030519Item, activeQuarterInfo } = useVendaMedia030519();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'Futuro Shelf' | 'Vencido' | 'Seguro'>('todos');
  const [curvaFilter, setCurvaFilter] = useState<'todos' | 'Curva A' | 'Curva B' | 'Curva C'>('todos');
  const [localizacaoFilter, setLocalizacaoFilter] = useState<string>('todos');
  const [currentDateStr, setCurrentDateStr] = useState<string>(() => new Date().toISOString().substring(0, 10));

  // Keep date updated with system server time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      const nowISO = new Date().toISOString().substring(0, 10);
      if (nowISO !== currentDateStr) {
        setCurrentDateStr(nowISO);
      }
    }, 60000); // Check every minute
    return () => clearInterval(timer);
  }, [currentDateStr]);

  // Midnight Date Object
  const todayObj = useMemo(() => {
    const d = new Date(currentDateStr + 'T00:00:00');
    return d;
  }, [currentDateStr]);

  // 1. Process and Calculate Futuro Shelf for non-critical inventory items (> 30 days)
  // Note: Items <= 30 days are critical and treated in dedicated critical views
  const processedRows = useMemo(() => {
    return validadesList
      .filter((item) => {
        const validadeStr = item.validade || currentDateStr;
        const vencDate = new Date(validadeStr + 'T00:00:00');
        const diffMs = vencDate.getTime() - todayObj.getTime();
        const diasParaVencer = Math.round(diffMs / (1000 * 60 * 60 * 24));
        return diasParaVencer > 30; // Exclude critical items (<= 30 days)
      })
      .map((item, idx) => {
      const id = item.id || (idx + 1);
      const codigo = String(item.codigo || '0000').trim();
      const descricao = String(item.descricao || 'Produto sem descrição').trim();
      const validadeStr = item.validade || currentDateStr;
      const p = Number(item.palhete) || 0;
      const l = Number(item.lastro) || 0;
      const c = Number(item.caixa) || 0;
      const q = Number((item as any).quantidade) || 0;
      const quantidade = q > 0 ? q : (p > 0 || l > 0 || c > 0) ? calcularTotalCaixas(codigo, p, l, c) : (c > 0 ? c : 1);
      const lote = (item as any).lote || `LOT-${codigo}-${validadeStr.replace(/-/g, '')}`;

      // Venda Média 03.05.19 & Previsão de Escoamento
      const item030519 = get030519Item(codigo) || get030519DataForSku(codigo);
      const is030519 = !!(item030519 && item030519.vendaMediaDiaria > 0 && item030519.source === '030519');
      const vendaMediaDiaria = (item030519 && Number(item030519.vendaMediaDiaria) > 0)
        ? Number(item030519.vendaMediaDiaria)
        : Math.max(1, Math.round(quantidade / 30));
      const curvaAbc = (item030519 && item030519.curvaAbc) || 'B';

      const diasEstoque = Math.max(1, Math.ceil(quantidade / Math.max(0.1, vendaMediaDiaria)));

      // Data de Previsão de Escoamento = Hoje + Dias de Estoque
      const previsaoDate = new Date(todayObj);
      previsaoDate.setDate(previsaoDate.getDate() + diasEstoque);
      const dataPrevisaoEscoamento = previsaoDate.toISOString().substring(0, 10);

      // Vencimento Date
      const vencDate = new Date(validadeStr + 'T00:00:00');
      
      // Data da Janela Crítica = Data de Vencimento - 30 dias
      const janelaCriticaDate = new Date(vencDate);
      janelaCriticaDate.setDate(janelaCriticaDate.getDate() - 30);
      const janelaCriticaStr = janelaCriticaDate.toISOString().substring(0, 10);

      // Dias para Vencer = Data de Vencimento - Data Atual
      const diffMs = vencDate.getTime() - todayObj.getTime();
      const diasParaVencer = Math.round(diffMs / (1000 * 60 * 60 * 24));

      // Rules:
      // - Se Dias para Vencer <= 0 -> Vencido
      // - Se Previsão de Escoamento >= Janela Crítica (-30 dias do vencimento) OU diasParaVencer <= 30 -> Futuro Shelf
      // - Senão -> Seguro
      let status: 'Futuro Shelf' | 'Vencido' | 'Seguro' = 'Seguro';
      if (diasParaVencer <= 0) {
        status = 'Vencido';
      } else if (diasParaVencer <= 30 || previsaoDate.getTime() >= janelaCriticaDate.getTime()) {
        status = 'Futuro Shelf';
      } else {
        status = 'Seguro';
      }

      const sobraEstimadaCx = status === 'Futuro Shelf' ? Math.max(0, Math.round(quantidade - (vendaMediaDiaria * Math.max(0, diasParaVencer - 30)))) : 0;

      return {
        _docId: item._docId,
        id,
        codigo,
        descricao,
        lote,
        quantidade,
        dataVencimento: validadeStr,
        dataJanelaCritica: janelaCriticaStr,
        diasParaVencer,
        vendaMediaDiaria,
        diasEstoque,
        dataPrevisaoEscoamento,
        status,
        localizacao: item.localizacao || 'central',
        bloco: item.bloco,
        curvaAbc,
        is030519,
        sobraEstimadaCx
      } as CalculatedFuturoShelfRow;
    });
  }, [validadesList, todayObj, currentDateStr, get030519Item]);

  // 2. Filter & Sort (default sort: lowest diasParaVencer first)
  const filteredRows = useMemo(() => {
    return processedRows.filter(r => {
      // Search term
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const mCode = r.codigo.toLowerCase().includes(q);
        const mDesc = r.descricao.toLowerCase().includes(q);
        const mLote = r.lote.toLowerCase().includes(q);
        if (!mCode && !mDesc && !mLote) return false;
      }

      // Status filter
      if (statusFilter !== 'todos' && r.status !== statusFilter) {
        return false;
      }

      // Curva ABC filter
      if (curvaFilter !== 'todos') {
        const expected = curvaFilter === 'Curva A' ? 'A' : curvaFilter === 'Curva B' ? 'B' : 'C';
        if (r.curvaAbc !== expected) return false;
      }

      // Localizacao filter
      if (localizacaoFilter !== 'todos' && r.localizacao !== localizacaoFilter) {
        return false;
      }

      return true;
    }).sort((a, b) => a.diasParaVencer - b.diasParaVencer);
  }, [processedRows, searchTerm, statusFilter, curvaFilter, localizacaoFilter]);

  // 3. KPI Statistics
  const stats = useMemo(() => {
    const total = processedRows.length;
    let futuroShelfCount = 0;
    let vencidoCount = 0;
    let seguroCount = 0;
    let futuroShelfDiasSum = 0;

    processedRows.forEach(r => {
      if (r.status === 'Futuro Shelf') {
        futuroShelfCount++;
        futuroShelfDiasSum += r.diasParaVencer;
      } else if (r.status === 'Vencido') {
        vencidoCount++;
      } else {
        seguroCount++;
      }
    });

    const avgFuturoShelfDays = futuroShelfCount > 0 ? Math.round((futuroShelfDiasSum / futuroShelfCount) * 10) / 10 : 0;

    return {
      total,
      futuroShelfCount,
      futuroShelfPct: total > 0 ? Math.round((futuroShelfCount / total) * 100) : 0,
      vencidoCount,
      vencidoPct: total > 0 ? Math.round((vencidoCount / total) * 100) : 0,
      seguroCount,
      seguroPct: total > 0 ? Math.round((seguroCount / total) * 100) : 0,
      avgFuturoShelfDays
    };
  }, [processedRows]);

  const formatDateBR = (isoDate: string) => {
    if (!isoDate) return '-';
    const parts = isoDate.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return isoDate;
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (filteredRows.length === 0) {
      alert('Nenhum dado para exportar.');
      return;
    }

    const excelData = filteredRows.map(r => ({
      'Código': r.codigo,
      'Produto': r.descricao,
      'Lote': r.lote,
      'Quantidade (Cx)': r.quantidade,
      'Data de Vencimento': formatDateBR(r.dataVencimento),
      'Janela Crítica (-30d)': formatDateBR(r.dataJanelaCritica),
      'Dias para Vencer': r.diasParaVencer <= 0 ? `Vencido (${r.diasParaVencer}d)` : `${r.diasParaVencer} dias`,
      'Status Futuro Shelf': r.status,
      'Localização': r.localizacao === 'central' ? 'Estoque Central' : r.localizacao === 'pnc' ? 'PNC' : r.localizacao
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Futuro Shelf');
    XLSX.writeFile(workbook, `Relatorio_Futuro_Shelf_${empresa?.id || 'Armazem'}_${currentDateStr}.xlsx`);
  };

  // Export to PDF
  const handleExportPDF = () => {
    if (filteredRows.length === 0) {
      alert('Nenhum dado para exportar.');
      return;
    }

    const doc = new jsPDF({ orientation: 'landscape' });

    // Header
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(0, 0, 297, 24, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text(`RELATÓRIO FUTURO SHELF (JANELA CRÍTICA 30 DIAS) — ${empresa?.razaoSocial || 'Armazém Fácil'}`, 12, 14);
    doc.setFontSize(9);
    doc.text(`Data Base: ${formatDateBR(currentDateStr)}`, 220, 14);

    // Summary Box
    doc.setFillColor(241, 245, 249);
    doc.rect(12, 28, 273, 16, 'F');
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(9);
    doc.text(`Total Lotes: ${stats.total}   |   ⚠️ Futuro Shelf (≤30d): ${stats.futuroShelfCount} (${stats.futuroShelfPct}%)   |   🚨 Vencidos (≤0d): ${stats.vencidoCount} (${stats.vencidoPct}%)   |   🟢 Seguro (>30d): ${stats.seguroCount} (${stats.seguroPct}%)`, 16, 38);

    // Table Header
    let startY = 50;
    doc.setFillColor(15, 23, 42);
    doc.rect(12, startY, 273, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text('CÓD', 14, startY + 5.5);
    doc.text('PRODUTO', 32, startY + 5.5);
    doc.text('LOTE', 115, startY + 5.5);
    doc.text('QTD', 150, startY + 5.5);
    doc.text('VENCIMENTO', 170, startY + 5.5);
    doc.text('JANELA CRÍTICA', 205, startY + 5.5);
    doc.text('DIAS RESTANTES', 240, startY + 5.5);
    doc.text('STATUS', 268, startY + 5.5);

    startY += 8;

    filteredRows.slice(0, 40).forEach((r) => {
      if (startY > 185) return;

      if (r.status === 'Futuro Shelf') doc.setFillColor(254, 243, 199); // amber-100
      else if (r.status === 'Vencido') doc.setFillColor(254, 226, 226); // red-100
      else doc.setFillColor(240, 253, 244); // emerald-100

      doc.rect(12, startY, 273, 7, 'F');

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(7.5);
      doc.text(r.codigo, 14, startY + 4.5);
      doc.text(r.descricao.substring(0, 42), 32, startY + 4.5);
      doc.text(r.lote.substring(0, 18), 115, startY + 4.5);
      doc.text(String(r.quantidade), 150, startY + 4.5);
      doc.text(formatDateBR(r.dataVencimento), 170, startY + 4.5);
      doc.text(formatDateBR(r.dataJanelaCritica), 205, startY + 4.5);
      doc.text(`${r.diasParaVencer}d`, 240, startY + 4.5);

      if (r.status === 'Futuro Shelf') doc.setTextColor(180, 83, 9);
      else if (r.status === 'Vencido') doc.setTextColor(185, 28, 28);
      else doc.setTextColor(21, 128, 61);

      doc.text(r.status, 268, startY + 4.5);

      startY += 7.5;
    });

    doc.save(`Futuro_Shelf_${currentDateStr}.pdf`);
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-blue-700 font-bold text-xs uppercase tracking-widest mb-1">
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>Controle Avançado de Validades</span>
          </div>
          <h2 className="text-xl font-black text-[#032b5e] tracking-tight flex items-center gap-2">
            Rotina Futuro Shelf
            <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
              Janela Crítica de 30 Dias
            </span>
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Monitoramento de produtos que entraram na janela crítica (Data de Vencimento - 30 dias) para priorização imediata de saída e prevenção de perdas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* REFRESH BUTTON */}
          <button
            onClick={() => {
              setCurrentDateStr(new Date().toISOString().substring(0, 10));
              if (onRefresh) onRefresh();
            }}
            className="py-2 px-3.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-2xs"
            title="Recalcular com a data atual do servidor"
          >
            <RefreshCw className="w-4 h-4 text-purple-600" />
            <span>Recalcular Agora</span>
          </button>

          {/* EXCEL EXPORT */}
          <button
            onClick={handleExportExcel}
            className="py-2 px-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-2xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excel</span>
          </button>

          {/* PDF EXPORT */}
          <button
            onClick={handleExportPDF}
            className="py-2 px-3.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-2xs"
          >
            <FileText className="w-4 h-4 text-rose-600" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* BANNER INTEGRAÇÃO 03.05.19 */}
      <div className="bg-gradient-to-r from-blue-50 via-sky-50 to-indigo-50 border border-blue-200 p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase text-blue-900 bg-blue-200/80 px-2.5 py-0.5 rounded-full border border-blue-300">
                03.05.19 Sincronizada
              </span>
              <span className="text-xs font-bold text-slate-800">
                Previsão de Escoamento e Janela Crítica com Venda Média do Quarter <strong className="text-blue-700">{activeQuarterInfo.quarter}</strong> ({activeQuarterInfo.skusCount} SKUs)
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1">
              O cálculo de dias de estoque e risco de entrada na janela crítica de 30 dias utiliza a taxa de saída real da rotina 03.05.19.
            </p>
          </div>
        </div>
      </div>

      {/* ALERT BANNER IF FUTURO SHELF OR VENCIDOS EXIST */}
      {(stats.futuroShelfCount > 0 || stats.vencidoCount > 0) && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-white rounded-xl shrink-0 shadow-xs">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-black text-amber-900">
                Alerta de Janela Crítica Ativa!
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                Existem <strong className="text-amber-950 font-bold">{stats.futuroShelfCount} lotes em Futuro Shelf</strong> (vencem nos próximos 30 dias) e <strong className="text-red-700 font-bold">{stats.vencidoCount} lotes já vencidos</strong>. Priorize o escoamento no picking ou ação promocional.
              </p>
            </div>
          </div>
          <button 
            onClick={() => setStatusFilter('Futuro Shelf')}
            className="py-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-lg transition-all shrink-0 cursor-pointer shadow-xs"
          >
            Ver Apenas Futuro Shelf
          </button>
        </div>
      )}

      {/* KPI DASHBOARD */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* TOTAL DE LOTES */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Total de Lotes Monitorados</span>
            <Calendar className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#032b5e] font-mono">{stats.total}</span>
            <span className="text-[11px] text-slate-500 font-medium">lotes no estoque</span>
          </div>
          <div className="mt-2 text-[10px] text-slate-400 font-medium">
            Data servidor: {formatDateBR(currentDateStr)}
          </div>
        </div>

        {/* FUTURO SHELF (JANELA ≤ 30 DIAS) */}
        <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-900 text-xs font-extrabold">
            <span className="flex items-center gap-1.5">
              ⚠️ Futuro Shelf (≤ 30d)
            </span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-amber-600 font-mono">{stats.futuroShelfCount}</span>
            <span className="text-sm font-bold text-amber-800">{stats.futuroShelfPct}% do estoque</span>
          </div>
          <div className="w-full bg-amber-200/70 rounded-full h-1.5 mt-2 overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full transition-all" style={{ width: `${stats.futuroShelfPct}%` }} />
          </div>
        </div>

        {/* VENCIDOS (≤ 0 DIAS) */}
        <div className="bg-red-50/70 p-4 rounded-2xl border border-red-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-red-900 text-xs font-extrabold">
            <span className="flex items-center gap-1.5">
              🚨 Vencidos (≤ 0d)
            </span>
            <ShieldAlert className="w-4 h-4 text-red-600" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-red-600 font-mono">{stats.vencidoCount}</span>
            <span className="text-sm font-bold text-red-800">{stats.vencidoPct}% do estoque</span>
          </div>
          <div className="w-full bg-red-200/70 rounded-full h-1.5 mt-2 overflow-hidden">
            <div className="bg-red-500 h-full rounded-full transition-all" style={{ width: `${stats.vencidoPct}%` }} />
          </div>
        </div>

        {/* FORA DA JANELA (SEGURO > 30 DIAS) */}
        <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-900 text-xs font-extrabold">
            <span className="flex items-center gap-1.5">
              🟢 Seguro (&gt; 30d)
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-emerald-600 font-mono">{stats.seguroCount}</span>
            <span className="text-sm font-bold text-emerald-800">{stats.seguroPct}% do estoque</span>
          </div>
          <div className="w-full bg-emerald-200/70 rounded-full h-1.5 mt-2 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${stats.seguroPct}%` }} />
          </div>
        </div>

      </div>

      {/* SEARCH AND FILTER BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* BUSCA RÁPIDA */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por produto, SKU ou lote..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-500 transition-colors"
          />
        </div>

        {/* DROPDOWNS FILTROS */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          
          {/* STATUS FILTER */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="bg-slate-50 border border-slate-300 text-xs text-slate-700 font-semibold rounded-xl px-3 py-2 focus:outline-none focus:bg-white focus:border-blue-600 transition-colors"
          >
            <option value="todos">🎯 Todos os Status ({processedRows.length})</option>
            <option value="Futuro Shelf">⚠️ Futuro Shelf (≤ 30d) ({stats.futuroShelfCount})</option>
            <option value="Vencido">🚨 Vencidos (≤ 0d) ({stats.vencidoCount})</option>
            <option value="Seguro">🟢 Seguro (&gt; 30d) ({stats.seguroCount})</option>
          </select>

          {/* CURVA ABC (03.05.19) FILTER */}
          <select
            value={curvaFilter}
            onChange={e => setCurvaFilter(e.target.value as any)}
            className="bg-slate-50 border border-slate-300 text-xs text-slate-700 font-semibold rounded-xl px-3 py-2 focus:outline-none focus:bg-white focus:border-blue-600 transition-colors"
          >
            <option value="todos">📊 Todas as Curvas</option>
            <option value="Curva A">🟢 Curva A (Alta Rotatividade)</option>
            <option value="Curva B">🟡 Curva B (Média Rotatividade)</option>
            <option value="Curva C">🔴 Curva C (Baixa Rotatividade / Lento)</option>
          </select>

          {/* LOCALIZAÇÃO FILTER */}
          <select
            value={localizacaoFilter}
            onChange={e => setLocalizacaoFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-xs text-slate-700 font-semibold rounded-xl px-3 py-2 focus:outline-none focus:bg-white focus:border-blue-600 transition-colors"
          >
            <option value="todos">📍 Todos os Locais</option>
            <option value="central">Estoque Central</option>
            <option value="pnc">PNC (Produto Não Conforme)</option>
            <option value="repack">Repack</option>
            <option value="picking">Picking</option>
            <option value="marketplace">Marketplace</option>
          </select>

        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="bg-slate-100/90 border-b border-slate-200 text-[11px] font-black text-slate-700 uppercase tracking-wider">
                <th className="py-3.5 px-4">Produto / Descrição</th>
                <th className="py-3.5 px-3">Código SKU</th>
                <th className="py-3.5 px-3 text-center">Curva (03.05.19)</th>
                <th className="py-3.5 px-3">Lote</th>
                <th className="py-3.5 px-3 text-center">Quantidade</th>
                <th className="py-3.5 px-3 text-center">V. Média / Dia</th>
                <th className="py-3.5 px-3 text-center">Data Vencimento</th>
                <th className="py-3.5 px-3 text-center">Janela Crítica (-30d)</th>
                <th className="py-3.5 px-3 text-center">Previsão Escoamento</th>
                <th className="py-3.5 px-3 text-center">Dias p/ Vencer</th>
                <th className="py-3.5 px-4 text-center">Status Rotina</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-500 font-medium">
                    Nenhum lote encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, idx) => {
                  const isFuturoShelf = row.status === 'Futuro Shelf';
                  const isVencido = row.status === 'Vencido';

                  // Row background & highlighting
                  let rowStyle = 'hover:bg-slate-50 transition-colors';
                  if (isFuturoShelf) {
                    rowStyle = 'bg-amber-50/70 hover:bg-amber-100/70 border-l-4 border-l-amber-500 shadow-2xs';
                  } else if (isVencido) {
                    rowStyle = 'bg-red-50/70 hover:bg-red-100/70 border-l-4 border-l-red-500 shadow-2xs';
                  } else {
                    rowStyle = 'bg-white hover:bg-slate-50/80 border-l-4 border-l-emerald-400';
                  }

                  return (
                    <tr key={row._docId || row.id || idx} className={rowStyle}>
                      
                      {/* PRODUTO */}
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <div className="flex flex-col">
                          <span className="truncate max-w-[230px] font-bold text-slate-900" title={row.descricao}>
                            {row.descricao}
                          </span>
                          <span className="text-[10px] text-slate-500 font-normal">
                            Local: {row.localizacao === 'central' ? 'Estoque Central' : row.localizacao === 'pnc' ? 'PNC' : row.localizacao}
                            {row.bloco ? ` — Bloco ${row.bloco}` : ''}
                          </span>
                        </div>
                      </td>

                      {/* CÓDIGO SKU */}
                      <td className="py-3.5 px-3 font-mono font-bold text-slate-700">
                        {row.codigo}
                      </td>

                      {/* CURVA ABC (03.05.19) */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            row.curvaAbc === 'A' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                            row.curvaAbc === 'B' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                            'bg-red-100 text-red-800 border border-red-300'
                          }`}>
                            Curva {row.curvaAbc}
                          </span>
                          {row.is030519 && (
                            <span className="text-[8px] font-bold text-blue-600">03.05.19</span>
                          )}
                        </div>
                      </td>

                      {/* LOTE */}
                      <td className="py-3.5 px-3 font-mono text-amber-900 font-bold">
                        <span className="bg-amber-100/60 border border-amber-200 px-1.5 py-0.5 rounded">
                          {row.lote}
                        </span>
                      </td>

                      {/* QUANTIDADE */}
                      <td className="py-3.5 px-3 text-center font-bold text-slate-800">
                        {row.quantidade} <span className="text-[10px] text-slate-500 font-normal">cx</span>
                      </td>

                      {/* VENDA MÉDIA (03.05.19) */}
                      <td className="py-3.5 px-3 text-center font-mono font-bold text-blue-700">
                        {row.vendaMediaDiaria.toFixed(1)} <span className="text-[10px] text-slate-500 font-normal">cx/dia</span>
                      </td>

                      {/* DATA VENCIMENTO */}
                      <td className="py-3.5 px-3 text-center font-mono font-extrabold text-slate-900">
                        {formatDateBR(row.dataVencimento)}
                      </td>

                      {/* JANELA CRÍTICA (-30D) */}
                      <td className="py-3.5 px-3 text-center font-mono text-amber-900 font-bold">
                        <span className="bg-amber-100/70 border border-amber-300 px-2 py-0.5 rounded text-[11px]">
                          {formatDateBR(row.dataJanelaCritica)}
                        </span>
                      </td>

                      {/* PREVISÃO ESCOAMENTO */}
                      <td className="py-3.5 px-3 text-center font-mono font-bold text-purple-800">
                        {formatDateBR(row.dataPrevisaoEscoamento)}
                        <span className="block text-[10px] text-slate-500 font-normal">({row.diasEstoque}d estoque)</span>
                        {row.sobraEstimadaCx > 0 && (
                          <span className="block text-[9px] font-bold text-rose-600">Sobra: ~{row.sobraEstimadaCx} cx</span>
                        )}
                      </td>

                      {/* DIAS PARA VENCER */}
                      <td className="py-3.5 px-3 text-center">
                        <span className={`font-mono font-black text-sm ${
                          isVencido ? 'text-red-600' : isFuturoShelf ? 'text-amber-600 font-black' : 'text-emerald-700'
                        }`}>
                          {isVencido ? `${row.diasParaVencer}d (VENCIDO)` : `${row.diasParaVencer}d`}
                        </span>
                      </td>

                      {/* STATUS BADGE */}
                      <td className="py-3.5 px-4 text-center">
                        {isFuturoShelf ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-500 text-white border border-amber-400 shadow-2xs">
                            <AlertTriangle className="w-3 h-3" />
                            FUTURO SHELF
                          </span>
                        ) : isVencido ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-red-600 text-white border border-red-500 shadow-2xs">
                            <ShieldAlert className="w-3 h-3" />
                            VENCIDO
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            SEGURO
                          </span>
                        )}
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER */}
        <div className="bg-slate-50 p-3.5 px-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-2">
          <div>
            Mostrando <strong className="text-slate-900 font-bold">{filteredRows.length}</strong> de <strong className="text-slate-900 font-bold">{processedRows.length}</strong> lotes analisados
          </div>
          <div className="flex items-center gap-4 text-[11px] font-medium">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Futuro Shelf (0 a 30 dias)</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Vencido (≤ 0 dias)</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Seguro (&gt; 30 dias)</span>
          </div>
        </div>
      </div>

    </div>
  );
}
