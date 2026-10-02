import React, { useState, useMemo, useEffect } from 'react';
import { ValidadeRow, Usuario, Empresa } from '../types';
import * as XLSX from 'xlsx';
import { 
  AlertTriangle, 
  Clock, 
  Download, 
  Upload, 
  Search, 
  TrendingDown, 
  ShieldAlert, 
  ShieldCheck, 
  Building2, 
  Boxes,
  Calendar,
  Layers,
  MapPin,
  RefreshCw,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  BarChart3,
  Flame,
  ArrowRight,
  Sparkles,
  DollarSign,
  Droplets,
  Filter,
  X,
  FileCode
} from 'lucide-react';
import ImportStockAgeJsonModal from './ImportStockAgeJsonModal';
import Import030519Modal from './Import030519Modal';
import { 
  getStoredMonthlyColetas, 
  saveMonthlyColetas, 
  processColetaItems, 
  MONTH_KEYS,
  ColetaItemRaw,
  StockAgeProcessedItem,
  RuaShelfRiskSummary,
  CurvaAbcSummary,
  syncValidadesListToMonthlyColetas,
  normalizeColetaRawList,
  formatAnyDateToBr
} from '../utils/stockAgeMonthlyManager';
import { useVendaMedia030519, Item030519Data, sync030519WithEstoqueStorage } from '../utils/vendaMedia030519';
import { saveVendaMediaItens, getVendaMediaItens } from '../utils/estoqueStorage';
import { calcularQuebrasFefoEstoqueXEstoque, calcularQuebrasFefoEstoqueXPicking } from '../utils/matrizBlocos';
import { requestAllFefoDemands, getStoredFefoDemands, requestFefoDemand } from '../utils/fefoDemandManager';

interface StockAgeIndexTabProps {
  validadesList?: ValidadeRow[];
  validades?: ValidadeRow[];
  user: Usuario;
  empresa: Empresa | null;
  onRefresh?: () => void;
}

export default function StockAgeIndexTab({ validadesList = [], validades = [], user, empresa, onRefresh }: StockAgeIndexTabProps) {
  const activeValidades = validades.length > 0 ? validades : validadesList;
  const { allQuarters, activeQuarterInfo, refresh: refresh030519 } = useVendaMedia030519();
  
  // State for Month Selection (padrão: Agosto - Mês da Operação Ativa CCO)
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>('08'); // '08' = Agosto, '01' = Janeiro, 'all' = Todos
  const [monthlyData, setMonthlyData] = useState<Record<string, ColetaItemRaw[]>>({});
  
  // Filtro de Semana do Mês (Semana 1 a 4)
  const [selectedSemanaFilter, setSelectedSemanaFilter] = useState<'todas' | 1 | 2 | 3 | 4>('todas');

  // Paginação para evitar travamentos de renderização
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(25);

  // Filtro de Datas Personalizado
  const [useCustomDateRange, setUseCustomDateRange] = useState<boolean>(false);
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [dateFilterField, setDateFilterField] = useState<'coleta' | 'vencimento'>('coleta');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'Crítico' | 'Atenção' | 'OK' | 'risco_sobra'>('todos');
  const [ruaFilter, setRuaFilter] = useState<string>('todos');
  const [curvaFilter, setCurvaFilter] = useState<'todos' | 'A' | 'B' | 'C'>('todos');
  
  // Modals & Panels
  const [showImportStockAgeJsonModal, setShowImportStockAgeJsonModal] = useState(false);
  const [showImport030519Modal, setShowImport030519Modal] = useState(false);
  const [showImportColetaModal, setShowImportColetaModal] = useState(false);
  const [selectedRuaDetail, setSelectedRuaDetail] = useState<string | null>(null);
  
  // 03.05.19 Import form state
  const [importText030519, setImportText030519] = useState('');
  const [diasUteisTrimestre, setDiasUteisTrimestre] = useState<number>(30);
  const [importNotice, setImportNotice] = useState<string | null>(null);

  // Auto-sync validades with monthly coletas on mount or when activeValidades change
  useEffect(() => {
    if (activeValidades && activeValidades.length > 0) {
      syncValidadesListToMonthlyColetas(activeValidades, empresa?.id || 'demo');
    }
  }, [activeValidades, empresa?.id]);

  // Load monthly stored data
  useEffect(() => {
    loadMonthlyData();
    const handleUpdate = () => loadMonthlyData();
    window.addEventListener('stock_age_monthly_updated', handleUpdate);
    window.addEventListener('vendaMedia030519Updated', handleUpdate);
    return () => {
      window.removeEventListener('stock_age_monthly_updated', handleUpdate);
      window.removeEventListener('vendaMedia030519Updated', handleUpdate);
    };
  }, []);

  const loadMonthlyData = () => {
    const stored = getStoredMonthlyColetas();
    setMonthlyData(stored);
  };

  // Compile active raw items based on selected month or all months
  const activeRawList = useMemo(() => {
    if (selectedMonthKey === 'all') {
      const all: ColetaItemRaw[] = [];
      Object.values(monthlyData).forEach(list => {
        if (Array.isArray(list)) all.push(...list);
      });
      return all;
    }
    return monthlyData[selectedMonthKey] || [];
  }, [monthlyData, selectedMonthKey]);

  // Process data with calculations
  const { 
    items: allProcessedItems, 
    ruasSummary: allRuasSummary, 
    curvaSummary: allCurvaSummary, 
    semanasSummary: allSemanasSummary, 
    kpiGeral: allKpiGeral,
    avgStockAgeMediaSemanas: allAvgStockAgeMediaSemanas 
  } = useMemo(() => {
    return processColetaItems(activeRawList);
  }, [activeRawList]);

  // Apply custom date range filter if enabled
  const itemsAfterDateFilter = useMemo(() => {
    if (!useCustomDateRange || (!customStartDate && !customEndDate)) {
      return allProcessedItems;
    }

    return allProcessedItems.filter(item => {
      const targetDate = dateFilterField === 'coleta' 
        ? item.dataColeta.includes('/') ? item.dataColeta.split('/').reverse().join('-') : item.dataColeta
        : item.dataVencimento;

      if (customStartDate && targetDate < customStartDate) return false;
      if (customEndDate && targetDate > customEndDate) return false;
      return true;
    });
  }, [allProcessedItems, useCustomDateRange, customStartDate, customEndDate, dateFilterField]);

  // Recompute KPIs, Ruas and Curvas based on date-filtered items if date filter is active
  const { processedItems, ruasSummary, curvaSummary, semanasSummary, kpiGeral, avgStockAgeMediaSemanas } = useMemo(() => {
    if (!useCustomDateRange || (!customStartDate && !customEndDate)) {
      return {
        processedItems: allProcessedItems,
        ruasSummary: allRuasSummary,
        curvaSummary: allCurvaSummary,
        semanasSummary: allSemanasSummary,
        kpiGeral: allKpiGeral,
        avgStockAgeMediaSemanas: allAvgStockAgeMediaSemanas
      };
    }

    // Convert processed items back to raw format to recalculate aggregated metrics cleanly
    const rawFiltered: ColetaItemRaw[] = itemsAfterDateFilter.map(item => ({
      dataColeta: item.dataColeta,
      codigo: item.codigo,
      descricao: item.descricao,
      qtdeCaixas: item.quantidade,
      dataVencimento: item.dataVencimento,
      validadeDias: item.vidaUtilTotal,
      fabricacao: item.fabricacao,
      curva: item.curvaAbc,
      blocoPrincipal: item.blocoPrincipal,
      subBloco: item.rua,
      destino: item.destino,
      pallettesFechados: item.pallettesFechados,
      sobraCaixas: item.sobraCaixas,
      caixasNoBloco: item.caixasNoBloco,
      vaiParaPicking: item.vaiParaPicking,
      caixasNoPicking: item.caixasNoPicking
    }));

    const result = processColetaItems(rawFiltered);
    return {
      processedItems: result.items,
      ruasSummary: result.ruasSummary,
      curvaSummary: result.curvaSummary,
      semanasSummary: result.semanasSummary,
      kpiGeral: result.kpiGeral,
      avgStockAgeMediaSemanas: result.avgStockAgeMediaSemanas
    };
  }, [allProcessedItems, allRuasSummary, allCurvaSummary, allSemanasSummary, allKpiGeral, allAvgStockAgeMediaSemanas, itemsAfterDateFilter, useCustomDateRange, customStartDate, customEndDate]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSemanaFilter, searchTerm, statusFilter, ruaFilter, curvaFilter, selectedMonthKey, useCustomDateRange, customStartDate, customEndDate]);

  // Calculate month-by-month evolution for Jan..Dez
  const monthlyEvolution = useMemo(() => {
    return MONTH_KEYS.map(m => {
      const rawList = monthlyData[m.key] || [];
      const proc = processColetaItems(rawList);
      return {
        key: m.key,
        short: m.short,
        name: m.name,
        hasData: rawList.length > 0,
        totalCaixas: proc.kpiGeral.totalCaixas,
        totalHecto: proc.kpiGeral.totalHecto,
        totalValor: proc.kpiGeral.totalValor,
        totalLotes: proc.kpiGeral.totalLotes,
        avgStockAge: proc.kpiGeral.avgStockAge,
        criticosPct: proc.kpiGeral.criticosPct,
        criticosCaixas: proc.kpiGeral.criticosCaixas,
        ruasCriticas: proc.kpiGeral.ruasCriticasCount,
        semanas: proc.semanasSummary
      };
    });
  }, [monthlyData]);

  // Filter items for table
  const filteredItems = useMemo(() => {
    return processedItems.filter(item => {
      // Filtro de Semana Selecionada
      if (selectedSemanaFilter !== 'todas') {
        if (item.semanaNumero !== selectedSemanaFilter) return false;
      }
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const mCod = item.codigo.toLowerCase().includes(q);
        const mDesc = item.descricao.toLowerCase().includes(q);
        const mRua = item.rua.toLowerCase().includes(q);
        if (!mCod && !mDesc && !mRua) return false;
      }
      if (statusFilter === 'risco_sobra') {
        if (!item.riscoSobra) return false;
      } else if (statusFilter !== 'todos' && item.status !== statusFilter) {
        return false;
      }
      if (ruaFilter !== 'todos' && item.rua !== ruaFilter) {
        return false;
      }
      if (curvaFilter !== 'todos' && item.curvaAbc !== curvaFilter) {
        return false;
      }
      return true;
    });
  }, [processedItems, selectedSemanaFilter, searchTerm, statusFilter, ruaFilter, curvaFilter]);

  // Paginated items for performance
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  // List of unique streets/sub-blocks for filter
  const uniqueRuas = useMemo(() => {
    const set = new Set<string>();
    processedItems.forEach(i => { if (i.rua) set.add(i.rua); });
    return Array.from(set).sort();
  }, [processedItems]);

  // Quick Date Range Helpers
  const applyQuickDateRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setCustomStartDate(start.toISOString().split('T')[0]);
    setCustomEndDate(end.toISOString().split('T')[0]);
    setUseCustomDateRange(true);
  };

  const clearDateRange = () => {
    setCustomStartDate('');
    setCustomEndDate('');
    setUseCustomDateRange(false);
  };

  // Import handler for 03.05.19
  const handleProcess030519 = (fileContent: string) => {
    try {
      const lines = fileContent.split(/\r?\n/).filter(l => l.trim().length > 0);
      if (lines.length === 0) {
        alert('O arquivo ou texto fornecido está vazio.');
        return;
      }

      const currentVM = getVendaMediaItens();
      const vmMap = new Map<number, any>();
      currentVM.forEach(item => vmMap.set(item.codigo, item));

      let importedCount = 0;
      lines.forEach((line) => {
        const parts = line.split(/[;\t,]/).map(p => p.trim());
        let code = 0;
        let qty = 0;
        let desc = '';

        if (parts.length >= 29) {
          code = parseInt(parts[6].replace(/\D/g, ''), 10);
          qty = parseFloat(parts[28].replace(/\./g, '').replace(',', '.')) || 0;
          desc = parts[7] || '';
        } else if (parts.length >= 2) {
          code = parseInt(parts[0].replace(/\D/g, ''), 10);
          qty = parseFloat(parts[1].replace(/\./g, '').replace(',', '.')) || 0;
          if (parts[2]) desc = parts[2];
        }

        if (code > 0 && qty > 0) {
          const vendaMediaDiaria = Math.round((qty / Math.max(1, diasUteisTrimestre)) * 100) / 100;
          vmMap.set(code, {
            codigo: code,
            descricao: desc || `PRODUTO ${code}`,
            vendaTotalTrimestre: qty,
            vendaMediaDiaria,
            diasUteisTrimestre,
            dataAtualizacao: new Date().toISOString()
          });
          importedCount++;
        }
      });

      if (importedCount > 0) {
        const itemsObj: Record<number, any> = {};
        vmMap.forEach((v, k) => {
          itemsObj[k] = v;
        });
        sync030519WithEstoqueStorage(itemsObj);
        setImportNotice(`Sucesso! ${importedCount} produtos atualizados com a Venda Média da 03.05.19.`);
        setShowImport030519Modal(false);
        refresh030519();
        setTimeout(() => setImportNotice(null), 5000);
      } else {
        alert('Não foi possível identificar registros válidos. Verifique as colunas (Código e Quantidade).');
      }
    } catch (err: any) {
      alert(`Erro no processamento: ${err.message}`);
    }
  };

  // Import handler for monthly coletas file (JSON or Excel/CSV)
  const handleImportColetaFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fallbackMonth = selectedMonthKey === 'all' ? '05' : selectedMonthKey;
    const reader = new FileReader();

    if (file.name.endsWith('.json')) {
      reader.onload = (event) => {
        try {
          let json = JSON.parse(event.target?.result as string);
          
          // Se o JSON vier envelopado
          if (json && typeof json === 'object' && !Array.isArray(json)) {
            const wrapperKeys = ['data', 'items', 'lotes', 'coleta', 'coletas', 'stockAge', 'validades', 'rows', 'payload'];
            for (const wk of wrapperKeys) {
              if (Array.isArray(json[wk])) {
                json = json[wk];
                break;
              }
            }
          }

          // Se for objeto mapeado por mês { "05": [...], "06": [...] }
          if (json && typeof json === 'object' && !Array.isArray(json)) {
            const currentStored = getStoredMonthlyColetas();
            const mergedAll = { ...currentStored };
            let count = 0;
            let lastMonth = fallbackMonth;

            Object.entries(json).forEach(([k, list]) => {
              if (!Array.isArray(list)) return;
              let mKey = k.padStart(2, '0');
              const monthObj = MONTH_KEYS.find(m => 
                m.key === mKey || 
                m.short.toLowerCase() === k.toLowerCase() || 
                m.name.toLowerCase() === k.toLowerCase() ||
                (k.toLowerCase().startsWith('mai') && m.key === '05')
              );
              if (monthObj) mKey = monthObj.key;
              const norm = normalizeColetaRawList(list, mKey);
              mergedAll[mKey] = norm;
              count += norm.length;
              lastMonth = mKey;
            });

            saveMonthlyColetas(mergedAll);
            loadMonthlyData();
            setSelectedMonthKey(lastMonth);
            setShowImportColetaModal(false);
            setImportNotice(`Importados ${count} lotes com sucesso no Stock Age Index!`);
            setTimeout(() => setImportNotice(null), 5000);
            return;
          }

          if (Array.isArray(json)) {
            // Detectar se há datas no array
            let detectedMonth = fallbackMonth;
            for (const it of json) {
              const d = it.dataColeta || it.data || it.Data || it['Data Coleta'] || it.data_coleta;
              if (d) {
                const brD = formatAnyDateToBr(d, fallbackMonth);
                const parts = brD.split('/');
                if (parts.length === 3) {
                  const m = parts[1].padStart(2, '0');
                  if (parseInt(m, 10) >= 1 && parseInt(m, 10) <= 12) {
                    detectedMonth = m;
                    break;
                  }
                }
              }
            }

            const formatted = normalizeColetaRawList(json, detectedMonth);
            if (formatted.length > 0) {
              saveMonthlyColetas(detectedMonth, formatted);
              loadMonthlyData();
              setSelectedMonthKey(detectedMonth);
              setShowImportColetaModal(false);
              setImportNotice(`Importados ${formatted.length} lotes para o mês ${MONTH_KEYS.find(m => m.key === detectedMonth)?.name || detectedMonth}!`);
              setTimeout(() => setImportNotice(null), 5000);
            } else {
              alert('Nenhum registro válido com código e quantidade foi identificado no JSON.');
            }
          } else {
            alert('O JSON deve ser uma lista de objetos ou dicionário mapeado por meses.');
          }
        } catch (err: any) {
          alert(`Erro ao ler JSON: ${err.message}`);
        }
      };
      reader.readAsText(file);
    } else {
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array', cellDates: true });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet);

          let detectedMonth = fallbackMonth;
          for (const row of rawJson) {
            const rawD = row['dataColeta'] || row['Data Coleta'] || row['Data'] || row['data'] || row['Data da Coleta'] || row['Data_Coleta'];
            if (rawD) {
              const brD = formatAnyDateToBr(rawD, fallbackMonth);
              const parts = brD.split('/');
              if (parts.length === 3) {
                const m = parts[1].padStart(2, '0');
                if (parseInt(m, 10) >= 1 && parseInt(m, 10) <= 12) {
                  detectedMonth = m;
                  break;
                }
              }
            }
          }

          const formatted = normalizeColetaRawList(rawJson, detectedMonth);

          if (formatted.length > 0) {
            saveMonthlyColetas(detectedMonth, formatted);
            loadMonthlyData();
            setSelectedMonthKey(detectedMonth);
            setShowImportColetaModal(false);
            setImportNotice(`Importados ${formatted.length} lotes da planilha para ${MONTH_KEYS.find(m => m.key === detectedMonth)?.name || detectedMonth} com sucesso!`);
            setTimeout(() => setImportNotice(null), 5000);
          } else {
            alert('Nenhum registro válido encontrado na planilha.');
          }
        } catch (err: any) {
          alert(`Erro ao processar planilha: ${err.message}`);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  // Export to Excel with HL and Reais
  const handleExportExcel = () => {
    const exportData = filteredItems.map(item => ({
      'Data Coleta': item.dataColeta,
      'Código': item.codigo,
      'Descrição': item.descricao,
      'Quantidade (Cx)': item.quantidade,
      'Volume (HL)': item.volumeHecto,
      'Valor Estimado (R$)': item.valorEstimado,
      'Vencimento': item.dataVencimento,
      'Vida Útil (Dias)': item.vidaUtilTotal,
      'Dias Restantes': item.diasRestantes,
      'Stock Age Index (%)': `${item.stockAgeIndex}%`,
      'Status': item.status,
      'Rua / Sub-bloco': item.rua,
      'Bloco': item.blocoPrincipal,
      'Curva ABC': item.curvaAbc,
      'Venda Média Diária (03.05.19)': item.vendaMediaDiaria,
      'Dias em Estoque (Cobertura)': item.diasEmEstoque === 999 ? 'Sem Giro' : item.diasEmEstoque,
      'Risco de Sobra': item.riscoSobra ? 'SIM' : 'NÃO',
      'Sobra Estimada (Cx)': item.sobraEstimadaCx,
      'Valor em Risco (R$)': item.valorEmRisco
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `StockAge_${selectedMonthKey}`);
    XLSX.writeFile(wb, `Stock_Age_Index_${selectedMonthKey}_2026.xlsx`);
  };

  const selectedMonthName = selectedMonthKey === 'all' 
    ? 'Consolidado Anual (Jan - Dez / 2026)' 
    : `${MONTH_KEYS.find(m => m.key === selectedMonthKey)?.name} / 2026`;

  return (
    <div className="flex flex-col gap-6 w-full text-slate-800">
      
      {/* Toast Notification */}
      {importNotice && (
        <div className="bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-200" />
            <span>{importNotice}</span>
          </div>
          <button onClick={() => setImportNotice(null)} className="text-white hover:text-emerald-100 font-black text-xs px-2 py-1">✕</button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          CABEÇALHO & BARRA DE MESES (JAN A DEZ)
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-100 text-[#032b5e] text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-blue-200">
                STOCK AGE INDEX &amp; RISCO POR RUA
              </span>
              <span className="bg-amber-100 text-amber-900 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-amber-200">
                Venda Média 03.05.19 Integrada
              </span>
              <span className="bg-purple-100 text-purple-900 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-purple-200">
                Valoração em Hecto (HL) &amp; Reais (R$)
              </span>
            </div>
            <h2 className="text-xl font-black text-[#032b5e] uppercase tracking-tight mt-1 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              Gestão Stock Age Index &amp; Risco de Shelf
            </h2>
            <p className="text-xs text-slate-500 font-bold mt-0.5">
              Monitoramento da idade dos estoques, cálculo de dias em estoque com base na 03.05.19, valoração em HL/R$ e análise de risco por rua e curva ABC.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowImportStockAgeJsonModal(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer border-none"
              title="Importar arquivo JSON de coletas para análise mês a mês"
            >
              <FileCode className="w-4 h-4 text-indigo-200" />
              Importar JSON (Mês a Mês)
            </button>
            <button
              onClick={() => setShowImport030519Modal(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer border-none"
              title="Importar relatório 03.05.19 de 30 dias para cálculo da Venda Média Diária"
            >
              <TrendingUp className="w-4 h-4" />
              Importar 03.05.19 (30 Dias)
            </button>
            <button
              onClick={() => setShowImportColetaModal(true)}
              className="px-3.5 py-2 rounded-xl bg-[#032b5e] hover:bg-blue-900 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer border-none"
              title="Importar coleta via planilha Excel (.xlsx) ou CSV"
            >
              <Upload className="w-4 h-4" />
              Importar Excel / CSV
            </button>
            <button
              onClick={handleExportExcel}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs flex items-center gap-1.5 border border-slate-300 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Exportar Excel
            </button>
          </div>
        </div>

        {/* Seletor de Meses Janeiro a Dezembro */}
        <div className="border-t border-slate-100 pt-3">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> SELECIONE O MÊS DO EXERCÍCIO (2026)
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-[#032b5e]">
                Visualizando: {selectedMonthName}
              </span>
              <button
                onClick={() => setShowImportStockAgeJsonModal(true)}
                className="text-[10px] font-black text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200 flex items-center gap-1 cursor-pointer transition-all"
                title={`Importar JSON para ${selectedMonthKey === 'all' ? 'o ano' : MONTH_KEYS.find(m => m.key === selectedMonthKey)?.name}`}
              >
                <FileCode className="w-3 h-3" />
                Importar JSON ({selectedMonthKey === 'all' ? 'Consolidado' : MONTH_KEYS.find(m => m.key === selectedMonthKey)?.short})
              </button>
            </div>
          </div>

          <div className="grid grid-cols-6 sm:grid-cols-7 md:grid-cols-13 gap-1.5">
            {MONTH_KEYS.map(m => {
              const evo = monthlyEvolution.find(e => e.key === m.key);
              const isSelected = selectedMonthKey === m.key;
              const hasData = evo?.hasData;

              return (
                <button
                  key={m.key}
                  onClick={() => {
                    setSelectedMonthKey(m.key);
                    clearDateRange();
                  }}
                  className={`p-2 rounded-xl text-center flex flex-col items-center justify-center transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-[#032b5e] text-white border-[#032b5e] shadow-md scale-102'
                      : hasData
                      ? 'bg-blue-50/70 hover:bg-blue-100/80 text-blue-900 border-blue-200'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-400 border-slate-200'
                  }`}
                >
                  <span className="text-[11px] font-black tracking-wider uppercase">{m.short}</span>
                  <span className={`text-[9px] font-extrabold mt-0.5 ${
                    isSelected 
                      ? 'text-blue-200' 
                      : hasData 
                      ? 'text-emerald-700 font-black' 
                      : 'text-slate-400'
                  }`}>
                    {hasData ? `${evo?.avgStockAge}%` : 'Zerado'}
                  </span>
                </button>
              );
            })}
            <button
              onClick={() => {
                setSelectedMonthKey('all');
                clearDateRange();
              }}
              className={`p-2 rounded-xl text-center flex flex-col items-center justify-center transition-all cursor-pointer border ${
                selectedMonthKey === 'all'
                  ? 'bg-gradient-to-r from-blue-700 to-indigo-800 text-white border-blue-900 shadow-md scale-102'
                  : 'bg-indigo-50/70 hover:bg-indigo-100 text-indigo-900 border-indigo-200'
              }`}
            >
              <span className="text-[11px] font-black tracking-wider uppercase">TODOS</span>
              <span className="text-[9px] font-extrabold mt-0.5 text-indigo-700">Anual</span>
            </button>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            FILTRO DE DATAS PERSONALIZADO NO DASHBOARD
            ───────────────────────────────────────────────────────────── */}
        <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-black text-[#032b5e] uppercase">
              <Filter className="w-4 h-4 text-blue-600" />
              <span>Filtro de Datas Personalizado:</span>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={dateFilterField}
                onChange={(e) => setDateFilterField(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold bg-white text-slate-700 focus:outline-none"
              >
                <option value="coleta">Por Data de Coleta</option>
                <option value="vencimento">Por Data de Vencimento</option>
              </select>

              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                <span>De:</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => {
                    setCustomStartDate(e.target.value);
                    setUseCustomDateRange(true);
                  }}
                  className="px-2 py-1 rounded-lg border border-slate-300 text-xs font-bold bg-white text-slate-700 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                <span>Até:</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => {
                    setCustomEndDate(e.target.value);
                    setUseCustomDateRange(true);
                  }}
                  className="px-2 py-1 rounded-lg border border-slate-300 text-xs font-bold bg-white text-slate-700 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Quick Range Presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => applyQuickDateRange(7)}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-extrabold cursor-pointer"
            >
              Últimos 7d
            </button>
            <button
              onClick={() => applyQuickDateRange(15)}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-extrabold cursor-pointer"
            >
              Últimos 15d
            </button>
            <button
              onClick={() => applyQuickDateRange(30)}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-extrabold cursor-pointer"
            >
              Últimos 30d
            </button>
            {(customStartDate || customEndDate) && (
              <button
                onClick={clearDateRange}
                className="px-2.5 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 text-[11px] font-black flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3 h-3" /> Limpar Range
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          PAINEL DE SEMANAS DO MÊS (SEPARAÇÃO SEMANAL & STOCK AGE INDEPENDENTE)
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-slate-900 via-[#032b5e] to-slate-950 p-5 rounded-2xl border border-blue-900/60 shadow-lg text-white flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-blue-800/60 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {selectedMonthKey === 'all' ? 'Exercício 2026 (Consolidado)' : `Mês de ${MONTH_KEYS.find(m => m.key === selectedMonthKey)?.name} / 2026`}
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                Stock Age do Mês = Média das Semanas
              </span>
            </div>
            <h3 className="text-base font-black uppercase tracking-wider mt-1.5 flex items-center gap-2 text-white">
              <Calendar className="w-5 h-5 text-blue-400" />
              Contagem Semanal e Stock Age Index por Semana
            </h3>
            <p className="text-xs text-blue-200/80 font-bold">
              Coletas segmentadas nas 4 semanas com base nas datas do arquivo JSON importado. Clique em uma semana para filtrar o detalhamento de itens.
            </p>
          </div>

          {/* Resumo do Mês: Stock Age Calculado como Média das Semanas */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2.5 flex items-center gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-blue-200 block">Stock Age do Mês</span>
              <span className={`text-2xl font-black ${
                kpiGeral.totalLotes === 0 
                  ? 'text-slate-400' 
                  : kpiGeral.avgStockAge >= 75 
                  ? 'text-emerald-300' 
                  : kpiGeral.avgStockAge >= 60 
                  ? 'text-amber-300' 
                  : 'text-rose-300'
              }`}>
                {kpiGeral.totalLotes === 0 ? '0%' : `${kpiGeral.avgStockAge}%`}
              </span>
            </div>
            <div className="text-right border-l border-white/20 pl-3">
              <span className="text-[9px] uppercase font-bold text-blue-200 block">Fórmula Oficial</span>
              <span className={`text-[11px] font-black ${kpiGeral.totalLotes === 0 ? 'text-slate-400' : 'text-emerald-300'}`}>
                {kpiGeral.totalLotes === 0 
                  ? 'Sem registros (0%)' 
                  : `Média das ${semanasSummary.filter(s => s.hasData).length} Semanas`}
              </span>
            </div>
          </div>
        </div>

        {/* Os 4 Cards de Semana */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {semanasSummary.map((sem) => {
            const isSelected = selectedSemanaFilter === sem.semanaNumero;
            const isCrit = sem.avgStockAge < 60;
            const isAtencao = sem.avgStockAge >= 60 && sem.avgStockAge < 75;
            const isOk = sem.avgStockAge >= 75;

            return (
              <div
                key={sem.semanaNumero}
                onClick={() => {
                  setSelectedSemanaFilter(isSelected ? 'todas' : (sem.semanaNumero as 1 | 2 | 3 | 4));
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                  isSelected
                    ? 'bg-blue-600/40 border-blue-400 ring-2 ring-blue-400 shadow-xl scale-[1.02]'
                    : sem.hasData
                    ? 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/80 hover:border-blue-400/60'
                    : 'bg-slate-800/30 border-slate-800/50 opacity-60 hover:opacity-80'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-0 right-0 bg-blue-500 text-white text-[9px] font-black px-2.5 py-0.5 rounded-bl-lg uppercase tracking-wider shadow-sm">
                    Filtro Ativo
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-8 h-8 rounded-lg font-black text-xs flex items-center justify-center border shadow-xs ${
                        isSelected 
                          ? 'bg-blue-500 text-white border-blue-300' 
                          : 'bg-blue-500/20 text-blue-300 border-blue-400/30'
                      }`}>
                        S{sem.semanaNumero}
                      </span>
                      <div>
                        <h4 className="font-black text-xs text-white uppercase">{sem.nome}</h4>
                        <span className="text-[10px] text-blue-300 font-bold block">{sem.periodoDias}</span>
                      </div>
                    </div>

                    {sem.hasData && (
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                        isOk 
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30' 
                          : isAtencao 
                          ? 'bg-amber-500/20 text-amber-300 border-amber-400/30' 
                          : 'bg-rose-500/20 text-rose-300 border-rose-400/30'
                      }`}>
                        {isOk ? 'OK' : isAtencao ? 'Atenção' : 'Crítico'}
                      </span>
                    )}
                  </div>

                  {/* Stock Age Index da Semana */}
                  <div className="mt-3 flex items-baseline justify-between">
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Stock Age Index:</span>
                    <span className={`text-2xl font-black ${
                      !sem.hasData 
                        ? 'text-slate-500 text-sm' 
                        : isOk 
                        ? 'text-emerald-400' 
                        : isAtencao 
                        ? 'text-amber-400' 
                        : 'text-rose-400'
                    }`}>
                      {sem.hasData ? `${sem.avgStockAge}%` : 'Sem coletas'}
                    </span>
                  </div>

                  {/* Termômetro Visual */}
                  {sem.hasData && (
                    <div className="w-full bg-slate-700/80 h-1.5 rounded-full overflow-hidden mt-1.5">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOk ? 'bg-emerald-400' : isAtencao ? 'bg-amber-400' : 'bg-rose-400'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, sem.avgStockAge))}%` }}
                      />
                    </div>
                  )}

                  {/* Estatísticas de Coletas da Semana */}
                  <div className="mt-3 grid grid-cols-2 gap-1.5 text-[11px] bg-slate-950/60 p-2.5 rounded-lg border border-slate-700/60">
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase font-bold block">Contagem</span>
                      <span className="font-black text-white">{sem.totalLotes} lotes</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-slate-400 uppercase font-bold block">Estoque</span>
                      <span className="font-black text-blue-200">{sem.totalCaixas.toLocaleString('pt-BR')} cx</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase font-bold block">Volume HL</span>
                      <span className="font-black text-purple-300">{sem.totalHecto.toLocaleString('pt-BR')} HL</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-slate-400 uppercase font-bold block">Críticos (&lt;60%)</span>
                      <span className={`font-black ${sem.criticosPct > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {sem.criticosPct}%
                      </span>
                    </div>
                  </div>

                  {/* Datas das coletas identificadas no JSON */}
                  {sem.datasDistintas.length > 0 && (
                    <div className="mt-2 text-[10px] text-slate-300 flex items-center gap-1.5 truncate">
                      <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span className="truncate">
                        Coletas: <strong className="text-white">{sem.datasDistintas.slice(0, 2).join(', ')}{sem.datasDistintas.length > 2 ? ` (+${sem.datasDistintas.length - 2})` : ''}</strong>
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px]">
                  <span className={`font-extrabold flex items-center gap-1 ${isSelected ? 'text-emerald-300' : 'text-blue-300'}`}>
                    {isSelected ? '✓ Detalhes exibidos abaixo' : 'Clique para ver itens →'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Banner Informativo de Filtro Ativo */}
        {selectedSemanaFilter !== 'todas' && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-blue-900/40 p-3 rounded-xl border border-blue-700/50 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-blue-100 font-bold">
                Exibindo detalhamento exclusivo da <strong className="text-white">Semana {selectedSemanaFilter}</strong> ({filteredItems.length} lotes recolhidos) • Stock Age Index da Semana: <strong className="text-emerald-300">{semanasSummary.find(s => s.semanaNumero === selectedSemanaFilter)?.avgStockAge}%</strong>.
              </span>
            </div>
            <button
              onClick={() => setSelectedSemanaFilter('todas')}
              className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-black text-xs border border-white/20 cursor-pointer transition-all self-start sm:self-auto"
            >
              Exibir Todas as 4 Semanas
            </button>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          CARDS DE KPIS PRINCIPAIS (COM HL E REAIS)
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        
        {/* KPI 1: Stock Age Index Médio do Mês (Média das Semanas) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-black tracking-widest text-[#032b5e]">
              STOCK AGE INDEX (MÊS)
            </span>
            <span className="text-[9px] font-bold text-slate-400 mt-0.5">
              Média das 4 Semanas Independentes
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className={`text-3xl font-black ${
              kpiGeral.totalLotes === 0
                ? 'text-slate-400'
                : kpiGeral.avgStockAge >= 75 
                ? 'text-emerald-600' 
                : kpiGeral.avgStockAge >= 60 
                ? 'text-amber-600' 
                : 'text-rose-600'
            }`}>
              {kpiGeral.totalLotes === 0 ? '0%' : `${kpiGeral.avgStockAge}%`}
            </span>
            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
              kpiGeral.totalLotes === 0
                ? 'bg-slate-100 text-slate-500 border border-slate-200'
                : kpiGeral.avgStockAge >= 75 
                ? 'bg-emerald-100 text-emerald-800' 
                : kpiGeral.avgStockAge >= 60 
                ? 'bg-amber-100 text-amber-800' 
                : 'bg-rose-100 text-rose-800'
            }`}>
              {kpiGeral.totalLotes === 0 ? 'ZERADO (0%)' : kpiGeral.avgStockAge >= 75 ? 'OK (≥75%)' : kpiGeral.avgStockAge >= 60 ? 'ATENÇÃO' : 'CRÍTICO (<60%)'}
            </span>
          </div>
          <div className="text-[9px] text-slate-400 font-bold mt-2 border-t border-slate-100 pt-1.5 flex justify-between">
            <span>Meta DPO: ≥ 75%</span>
            <span className="text-slate-600 font-extrabold">{kpiGeral.totalLotes} Lotes no Mês</span>
          </div>
        </div>

        {/* KPI 2: Itens Críticos (<60%) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center justify-between">
            <span>ITENS CRÍTICOS (&lt;60%)</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-rose-600">
              {kpiGeral.criticosPct}%
            </span>
            <span className="text-xs font-extrabold text-slate-600">
              ({kpiGeral.criticosCaixas.toLocaleString('pt-BR')} Cx)
            </span>
          </div>
          <div className="text-[9px] text-rose-600 font-bold mt-2 border-t border-slate-100 pt-1.5 flex justify-between">
            <span>Volume em Risco:</span>
            <span className="font-extrabold">{kpiGeral.criticosHecto.toLocaleString('pt-BR')} HL</span>
          </div>
        </div>

        {/* KPI 3: Valoração Total & em Risco (R$) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center justify-between">
            <span>VALORAÇÃO EM REAIS (R$)</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
          </span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-2xl font-black text-emerald-700">
              R$ {kpiGeral.totalValor.toLocaleString('pt-BR')}
            </span>
          </div>
          <div className="text-[9px] text-rose-600 font-bold mt-2 border-t border-slate-100 pt-1.5 flex justify-between">
            <span>Valor em Risco Crítico:</span>
            <span className="font-extrabold">R$ {kpiGeral.criticosValor.toLocaleString('pt-BR')}</span>
          </div>
        </div>

        {/* KPI 4: Volume Total & em Risco (HL) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center justify-between">
            <span>VOLUME HECTOLITROS (HL)</span>
            <Droplets className="w-3.5 h-3.5 text-blue-600" />
          </span>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-2xl font-black text-[#032b5e]">
              {kpiGeral.totalHecto.toLocaleString('pt-BR')}
            </span>
            <span className="text-xs font-black text-slate-500">HL</span>
          </div>
          <div className="text-[9px] text-slate-500 font-bold mt-2 border-t border-slate-100 pt-1.5 flex justify-between">
            <span>Total Caixas:</span>
            <span className="font-extrabold text-slate-800">{kpiGeral.totalCaixas.toLocaleString('pt-BR')} Cx</span>
          </div>
        </div>

        {/* KPI 5: Ruas em Risco de Shelf */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
          <span className="text-[10px] uppercase font-black tracking-widest text-slate-500 flex items-center justify-between">
            <span>RUAS EM RISCO DE SHELF</span>
            <Flame className="w-3.5 h-3.5 text-amber-500" />
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className={`text-3xl font-black ${kpiGeral.ruasCriticasCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {kpiGeral.ruasCriticasCount}
            </span>
            <span className="text-xs font-extrabold text-slate-500">
              de {ruasSummary.length} Ruas
            </span>
          </div>
          <div className="text-[9px] text-slate-400 font-bold mt-2 border-t border-slate-100 pt-1.5">
            Prioridade de escoamento imediato
          </div>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────
          ANÁLISE DE PRODUTOS POR CURVA ABC (VALORAÇÃO HL E REAIS)
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-amber-100 text-amber-900 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-amber-200">
                DISTRIBUIÇÃO DE RISCO E VALORAÇÃO
              </span>
            </div>
            <h3 className="text-base font-black text-[#032b5e] uppercase tracking-wider mt-1 flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-600" />
              Análise de Produtos por Curva ABC
            </h3>
            <p className="text-xs text-slate-500 font-bold">
              Desdobramento da volumetria em Hectolitros (HL), valoração em Reais (R$) e nível de Stock Age Index por curva de giro.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
              Clique em uma curva para filtrar a tabela
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['A', 'B', 'C'] as const).map(cKey => {
            const cSummary = curvaSummary[cKey];
            const isSelected = curvaFilter === cKey;

            return (
              <div
                key={cKey}
                onClick={() => setCurvaFilter(curvaFilter === cKey ? 'todos' : cKey)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-blue-600 ring-2 ring-blue-300 bg-blue-50/50'
                    : cKey === 'A'
                    ? 'bg-blue-50/30 border-blue-200 hover:border-blue-400'
                    : cKey === 'B'
                    ? 'bg-amber-50/30 border-amber-200 hover:border-amber-400'
                    : 'bg-slate-50/50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-8 h-8 rounded-lg text-white font-black text-sm flex items-center justify-center shadow-xs ${
                      cKey === 'A' ? 'bg-blue-600' : cKey === 'B' ? 'bg-amber-600' : 'bg-slate-600'
                    }`}>
                      {cKey}
                    </span>
                    <div>
                      <h4 className="font-black text-xs text-slate-800 uppercase">
                        {cKey === 'C' ? 'Curva C / Gatilho' : `Curva ${cKey}`}
                      </h4>
                      <span className="text-[10px] text-slate-500 font-bold">
                        {cSummary.totalSkus} SKUs • {cSummary.totalLotes} Lotes
                      </span>
                    </div>
                  </div>

                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    cSummary.stockAgeIndexMedio >= 75 ? 'bg-emerald-100 text-emerald-800' : cSummary.stockAgeIndexMedio >= 60 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    Stock Age: {cSummary.stockAgeIndexMedio}%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3.5 pt-3 border-t border-slate-200/60 text-xs">
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Volume (HL)</span>
                    <span className="font-black text-sm text-[#032b5e]">
                      {cSummary.totalHecto.toLocaleString('pt-BR')} HL
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Valoração (R$)</span>
                    <span className="font-black text-sm text-emerald-700">
                      R$ {cSummary.totalValor.toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Total Caixas</span>
                    <span className="font-extrabold text-xs text-slate-700">
                      {cSummary.totalCaixas.toLocaleString('pt-BR')} Cx
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Críticos (&lt;60%)</span>
                    <span className="font-extrabold text-xs text-rose-600">
                      {cSummary.criticosCaixas.toLocaleString('pt-BR')} Cx ({cSummary.criticosPct}%)
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500 font-bold">
                  <span>Valor em Risco: <strong className="text-rose-600">R$ {cSummary.criticosValor.toLocaleString('pt-BR')}</strong></span>
                  <span className="text-blue-700 font-black">
                    {curvaFilter === cKey ? 'Filtrado ✓' : 'Filtrar →'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          INDICADOR DE RISCO DE SHELF POR RUAS (SUB-BLOCOS)
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-purple-100 text-purple-900 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-purple-200">
                INDICADOR POR LOCALIZAÇÃO FÍSICA
              </span>
            </div>
            <h3 className="text-base font-black text-[#032b5e] uppercase tracking-wider mt-1 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-purple-600" />
              Indicador de Risco de Shelf por Ruas / Sub-blocos
            </h3>
            <p className="text-xs text-slate-500 font-bold">
              Avaliação de envelhecimento, concentração de itens críticos, volumetria em Hectolitros e valor financeiro por rua do armazém.
            </p>
          </div>
          <span className="text-xs font-extrabold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 self-start sm:self-auto">
            {ruasSummary.length} Ruas Mapeadas
          </span>
        </div>

        {/* Cards de Ruas com Indicador Visual de Risco */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {ruasSummary.map(r => {
            const isCritical = r.nivelRisco === 'CRÍTICO';
            const isHigh = r.nivelRisco === 'ALTO';
            const isMedium = r.nivelRisco === 'MÉDIO';

            return (
              <div 
                key={r.rua}
                onClick={() => {
                  setRuaFilter(ruaFilter === r.rua ? 'todos' : r.rua);
                  setSelectedRuaDetail(r.rua);
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  ruaFilter === r.rua
                    ? 'border-purple-600 ring-2 ring-purple-300 bg-purple-50/50'
                    : isCritical
                    ? 'bg-rose-50/60 border-rose-200 hover:border-rose-400'
                    : isHigh
                    ? 'bg-amber-50/60 border-amber-200 hover:border-amber-400'
                    : isMedium
                    ? 'bg-blue-50/40 border-blue-200 hover:border-blue-300'
                    : 'bg-emerald-50/40 border-emerald-200 hover:border-emerald-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-[#032b5e] text-white flex items-center justify-center font-black text-xs shadow-xs">
                      {r.rua}
                    </span>
                    <div>
                      <h4 className="font-black text-xs text-slate-800 uppercase">Rua {r.rua}</h4>
                      <span className="text-[10px] text-slate-500 font-bold">Bloco {r.bloco}</span>
                    </div>
                  </div>

                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${
                    isCritical
                      ? 'bg-rose-100 text-rose-800 border-rose-300'
                      : isHigh
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : isMedium
                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}>
                    {r.nivelRisco}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-200/60 text-xs">
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Stock Age</span>
                    <span className={`font-black text-sm ${
                      r.stockAgeIndexMedio >= 75 ? 'text-emerald-600' : r.stockAgeIndexMedio >= 60 ? 'text-amber-600' : 'text-rose-600'
                    }`}>
                      {r.stockAgeIndexMedio}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Volume (HL)</span>
                    <span className="font-black text-sm text-slate-800">
                      {r.totalHecto.toLocaleString('pt-BR')} HL
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Itens Críticos</span>
                    <span className="font-extrabold text-xs text-rose-600">
                      {r.criticosCount} ({r.criticosPct}%)
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Valoração</span>
                    <span className="font-extrabold text-xs text-emerald-700">
                      R$ {r.totalValor.toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500 font-bold">
                  <span>Score Risco: <strong className="text-slate-800">{r.shelfRiskScore}/100</strong></span>
                  <span className="text-purple-700 font-black flex items-center gap-0.5 hover:underline">
                    {ruaFilter === r.rua ? 'Filtrado ✓' : 'Filtrar →'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TABELA DETALHADA DE PRODUTOS & DIAS EM ESTOQUE (03.05.19)
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
        
        {/* Barra de Filtros */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por código, descrição de produto ou rua..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            
            {/* Filtro de Semana do Mês */}
            <select
              value={selectedSemanaFilter}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedSemanaFilter(val === 'todas' ? 'todas' : (parseInt(val) as 1 | 2 | 3 | 4));
              }}
              className="px-3 py-2 rounded-xl border border-blue-300 text-xs font-black bg-blue-50/80 text-blue-900 focus:outline-none"
            >
              <option value="todas">📅 Todas as 4 Semanas</option>
              <option value="1">S1: Semana 1 (01 a 07)</option>
              <option value="2">S2: Semana 2 (08 a 14)</option>
              <option value="3">S3: Semana 3 (15 a 21)</option>
              <option value="4">S4: Semana 4 (22 a 31)</option>
            </select>

            {/* Filtro de Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-700 focus:outline-none"
            >
              <option value="todos">Todos os Status</option>
              <option value="Crítico">🚨 Crítico (&lt;60%)</option>
              <option value="Atenção">⚠️ Atenção (60-75%)</option>
              <option value="OK">✅ OK (&gt;75%)</option>
              <option value="risco_sobra">⚡ Risco de Sobra (Sem Giro)</option>
            </select>

            {/* Filtro de Rua */}
            <select
              value={ruaFilter}
              onChange={(e) => setRuaFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-700 focus:outline-none"
            >
              <option value="todos">Todas as Ruas</option>
              {uniqueRuas.map(r => (
                <option key={r} value={r}>Rua {r}</option>
              ))}
            </select>

            {/* Filtro de Curva ABC */}
            <select
              value={curvaFilter}
              onChange={(e) => setCurvaFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white text-slate-700 focus:outline-none"
            >
              <option value="todos">Todas as Curvas</option>
              <option value="A">Curva A</option>
              <option value="B">Curva B</option>
              <option value="C">Curva C</option>
            </select>

            {(searchTerm || selectedSemanaFilter !== 'todas' || statusFilter !== 'todos' || ruaFilter !== 'todos' || curvaFilter !== 'todos' || useCustomDateRange) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedSemanaFilter('todas');
                  setStatusFilter('todos');
                  setRuaFilter('todos');
                  setCurvaFilter('todos');
                  clearDateRange();
                }}
                className="px-3 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-extrabold text-xs cursor-pointer border border-rose-200"
              >
                Limpar Filtros
              </button>
            )}
          </div>
        </div>

        {/* Tabela de Produtos */}
        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Código &amp; Produto</th>
                <th className="py-3 px-2 text-center">Semana</th>
                <th className="py-3 px-2 text-center">Rua / Bloco</th>
                <th className="py-3 px-2 text-center">Curva</th>
                <th className="py-3 px-2 text-right">Estoque (Cx)</th>
                <th className="py-3 px-2 text-right">Volume (HL)</th>
                <th className="py-3 px-2 text-right">Valor Est. (R$)</th>
                <th className="py-3 px-2 text-center">Data Coleta</th>
                <th className="py-3 px-2 text-center">Vencimento</th>
                <th className="py-3 px-2 text-center">Dias Rest.</th>
                <th className="py-3 px-2 text-center">Stock Age Index</th>
                <th className="py-3 px-2 text-center">Venda Média (03.05.19)</th>
                <th className="py-3 px-2 text-center">Dias em Estoque</th>
                <th className="py-3 px-2 text-center">Status / Risco</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-bold">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-8 text-center text-slate-400 font-bold">
                    Nenhum item encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => {
                  const isCrit = item.status === 'Crítico';
                  const isAtencao = item.status === 'Atenção';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-[#032b5e]">{item.codigo}</span>
                          <span className="text-slate-700 truncate max-w-[200px]" title={item.descricao}>
                            {item.descricao}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span className="bg-blue-100 text-blue-900 font-black text-[10px] px-2 py-0.5 rounded-full border border-blue-200" title={`Semana ${item.semanaNumero} (${item.dataColeta})`}>
                          S{item.semanaNumero}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span className="bg-slate-100 text-slate-800 font-black text-[11px] px-2 py-0.5 rounded border border-slate-200">
                          {item.rua}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          item.curvaAbc === 'A' 
                            ? 'bg-blue-100 text-blue-800' 
                            : item.curvaAbc === 'B' 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {item.curvaAbc}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-right font-black text-slate-800">
                        {item.quantidade.toLocaleString('pt-BR')}
                      </td>
                      <td className="py-2.5 px-2 text-right font-black text-[#032b5e]">
                        {item.volumeHecto.toLocaleString('pt-BR')}
                      </td>
                      <td className="py-2.5 px-2 text-right font-black text-emerald-700">
                        R$ {item.valorEstimado.toLocaleString('pt-BR')}
                      </td>
                      <td className="py-2.5 px-2 text-center text-slate-500 text-[11px]">
                        {item.dataColeta}
                      </td>
                      <td className="py-2.5 px-2 text-center text-slate-600">
                        {item.dataVencimento.split('-').reverse().join('/')}
                      </td>
                      <td className="py-2.5 px-2 text-center font-black">
                        <span className={item.diasRestantes <= 30 ? 'text-rose-600' : item.diasRestantes <= 60 ? 'text-amber-600' : 'text-slate-700'}>
                          {item.diasRestantes}d
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span className={`px-2 py-0.5 rounded-md font-black text-xs ${
                          isCrit 
                            ? 'bg-rose-100 text-rose-800 border border-rose-300' 
                            : isAtencao 
                            ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}>
                          {item.stockAgeIndex}%
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-center font-black text-slate-700">
                        {item.vendaMediaDiaria > 0 ? `${item.vendaMediaDiaria} cx/dia` : <span className="text-slate-400 text-[10px]">Sem 03.05.19</span>}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        {item.diasEmEstoque === 999 ? (
                          <span className="text-[10px] text-slate-400 font-bold">-</span>
                        ) : (
                          <span className={`font-black ${
                            item.riscoSobra ? 'text-rose-600 font-black' : 'text-slate-700'
                          }`}>
                            {item.diasEmEstoque}d
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        {item.riscoSobra ? (
                          <span className="bg-rose-100 text-rose-800 text-[10px] font-black px-2 py-0.5 rounded border border-rose-300 flex items-center justify-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Sobra {item.sobraEstimadaCx} cx
                          </span>
                        ) : (
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                            isCrit ? 'text-rose-700 bg-rose-50' : isAtencao ? 'text-amber-700 bg-amber-50' : 'text-emerald-700 bg-emerald-50'
                          }`}>
                            {item.statusLabel}
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

        {/* Paginação de Alta Performance */}
        {filteredItems.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-3 text-slate-500 font-bold">
              <span>
                Mostrando <strong>{Math.min(filteredItems.length, (currentPage - 1) * itemsPerPage + 1)}</strong> a <strong>{Math.min(filteredItems.length, currentPage * itemsPerPage)}</strong> de <strong>{filteredItems.length}</strong> lotes
              </span>
              <div className="flex items-center gap-1">
                <span>Por página:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(parseInt(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 border border-slate-200 rounded-lg font-bold bg-white text-slate-700"
                >
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                  <option value="200">200</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1 self-center sm:self-auto">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-2.5 py-1 rounded-lg border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                « Primeira
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-lg border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="px-3 py-1 bg-blue-50 text-blue-900 font-black rounded-lg border border-blue-200">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded-lg border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                Próxima
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1 rounded-lg border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                Última »
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL DE IMPORTAÇÃO DA 03.05.19
          ───────────────────────────────────────────────────────────── */}
      {showImport030519Modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 flex flex-col gap-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-base text-[#032b5e] uppercase">
                  Importar Relatório 03.05.19
                </h3>
              </div>
              <button 
                onClick={() => setShowImport030519Modal(false)}
                className="text-slate-400 hover:text-slate-600 font-black text-base"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 font-bold">
              Cole o conteúdo copiado do SAP/Excel da rotina <strong>03.05.19</strong> (ou arquivo CSV/TXT). 
              O sistema calcula automaticamente a <strong>venda média diária</strong> e atualiza os <strong>dias de cobertura em estoque</strong>.
            </p>

            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-700">Dias Úteis no Período:</label>
              <input
                type="number"
                value={diasUteisTrimestre}
                onChange={(e) => setDiasUteisTrimestre(Math.max(1, parseInt(e.target.value) || 66))}
                className="w-20 px-2 py-1 border border-slate-300 rounded-lg text-xs font-bold text-center"
              />
              <span className="text-[10px] text-slate-400 font-bold">(Ex: 66 dias no trimestre)</span>
            </div>

            <div>
              <label className="text-xs font-black text-slate-700 uppercase block mb-1">
                Conteúdo do Arquivo / Tabela:
              </label>
              <textarea
                rows={6}
                value={importText030519}
                onChange={(e) => setImportText030519(e.target.value)}
                placeholder="Cole aqui as linhas copiadas da 03.05.19..."
                className="w-full p-3 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowImport030519Modal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs cursor-pointer border-none"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleProcess030519(importText030519)}
                disabled={!importText030519.trim()}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs cursor-pointer border-none shadow-sm disabled:opacity-50"
              >
                Calcular &amp; Atualizar Venda Média
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL DE IMPORTAÇÃO DE ARQUIVO DE COLETA (MODELO JSON/EXCEL)
          ───────────────────────────────────────────────────────────── */}
      {showImportColetaModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 flex flex-col gap-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600" />
                <h3 className="font-black text-base text-[#032b5e] uppercase">
                  Importar Coleta para {MONTH_KEYS.find(m => m.key === selectedMonthKey)?.name}
                </h3>
              </div>
              <button 
                onClick={() => setShowImportColetaModal(false)}
                className="text-slate-400 hover:text-slate-600 font-black text-base"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 font-bold">
              Selecione o arquivo de coleta no formato padrão (JSON, Excel .xlsx ou CSV) contendo os campos de 
              <strong> dataColeta, codigo, descricao, qtdeCaixas, dataVencimento, subBloco (rua), etc.</strong>
            </p>

            <div className="border-2 border-dashed border-blue-200 bg-blue-50/50 p-6 rounded-2xl flex flex-col items-center justify-center gap-2 text-center">
              <FileSpreadsheet className="w-10 h-10 text-blue-500" />
              <span className="text-xs font-black text-blue-900">Selecione o arquivo do mês</span>
              <span className="text-[10px] text-slate-500">Formatos aceitos: .json, .xlsx, .csv</span>
              <input
                type="file"
                accept=".json,.xlsx,.xls,.csv"
                onChange={handleImportColetaFile}
                className="mt-2 text-xs font-bold text-slate-600"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowImportColetaModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs cursor-pointer border-none"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL DE IMPORTAÇÃO DE ARQUIVO JSON (MÊS A MÊS)
          ───────────────────────────────────────────────────────────── */}
      <ImportStockAgeJsonModal
        isOpen={showImportStockAgeJsonModal}
        onClose={() => setShowImportStockAgeJsonModal(false)}
        initialMonthKey={selectedMonthKey}
        onImportSuccess={(monthKey, count) => {
          loadMonthlyData();
          if (monthKey !== 'all') {
            setSelectedMonthKey(monthKey);
          }
          setImportNotice(`Sucesso! ${count} registros importados e gravados com sucesso no Stock Age Index.`);
          setTimeout(() => setImportNotice(null), 5000);
        }}
      />

    </div>
  );
}
