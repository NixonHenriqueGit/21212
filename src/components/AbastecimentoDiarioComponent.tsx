import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Package, 
  Layers, 
  Truck, 
  Search, 
  SlidersHorizontal, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Activity,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Info,
  Sparkles,
  FileSpreadsheet,
  Save,
  Edit2,
  History,
  Calendar,
  Trash2,
  Database,
  Check,
  X,
  FileText,
  RefreshCw,
  Undo,
  Moon,
  AlertTriangle,
  AlertOctagon
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Cell
} from 'recharts';
import { BaseSkuData, ABASTECIMENTO_PRODUCTS_DATA } from '../data/abastecimentoData';
import { PRODUCT_MASTER_DATA } from '../data/productMasterData';
import { PRODUCTS } from '../planosData';
import { Tarefa } from '../types';
import * as XLSX from 'xlsx';
import { getRepository } from '../db';
import { getAbcMapForPeriod, resolveQuarterFromFilters } from '../utils/curvaAbcUtils';
import { isCleaningProduct } from '../utils/generateRessuprimentoData';
import { processPosicaoPallet021101Import } from '../utils/estoqueParsers';

const abastecimentoAnaliseRepo = getRepository<any>('analises_abastecimento_diario');

// Helper to convert total SKU caixas into Full Pallets and loose SKU (caixas)
export const convertSkuToPalletAndSku = (totalCaixas: number, qtdPallet: number) => {
  const palSize = Math.max(1, qtdPallet || 100);
  const total = Math.max(0, totalCaixas || 0);
  const palletsFechados = Math.floor(total / palSize);
  const skuFracionado = total % palSize;
  const palletsDecimal = Math.round((total / palSize) * 10) / 10;
  
  let formatado = '';
  if (palletsFechados > 0 && skuFracionado > 0) {
    formatado = `${palletsFechados} PL + ${skuFracionado} cx`;
  } else if (palletsFechados > 0) {
    formatado = `${palletsFechados} PL (${total} cx)`;
  } else {
    formatado = `${skuFracionado} cx`;
  }

  return {
    palletsFechados,
    skuFracionado,
    totalCaixas: total,
    palletsDecimal,
    formatado
  };
};

// Helper to pull complete official product info from master data
export const getOfficialProductInfo = (sku: number, fallbackDesc?: string) => {
  const skuNum = Number(sku);
  const master = PRODUCT_MASTER_DATA.find(p => p.cod === skuNum);
  if (master && master.descricao) {
    return {
      sku: skuNum,
      descricao: master.descricao.trim(),
      embalagem: typeof (master as any).embalagem === 'number' ? (master as any).embalagem : (Number(master.fator) || 1),
      unidade: (master as any).unidade ? String((master as any).unidade) : 'cx',
      qtdPallet: master.fatorPallet || 100,
      fatorHecto: master.fatorHecto || 0.072,
      curvaAbc: (master.curva as 'A' | 'B' | 'C') || 'B',
      grupo: master.grupo || 'GERAL'
    };
  }
  const plano = PRODUCTS.find(p => Number(p.codigo) === skuNum);
  if (plano && plano.descricao) {
    return {
      sku: skuNum,
      descricao: plano.descricao.trim(),
      embalagem: Number(plano.fator) || 1,
      unidade: typeof plano.unidade === 'string' ? plano.unidade : 'cx',
      qtdPallet: plano.caixasPallet || 100,
      fatorHecto: Number(plano.fatorHecto) || 0.072,
      curvaAbc: (plano.curva as 'A' | 'B' | 'C') || 'B',
      grupo: plano.grupo || 'GERAL'
    };
  }
  return {
    sku: skuNum,
    descricao: fallbackDesc?.trim() || `PRODUTO ${skuNum}`,
    embalagem: 1,
    unidade: 'cx',
    qtdPallet: 100,
    fatorHecto: 0.072,
    curvaAbc: 'B' as const,
    grupo: 'GERAL'
  };
};

interface AbastecimentoDiarioComponentProps {
  user: any;
  empresa: any;
  tasks: any[];
}

export interface Imported021101File {
  id: string;
  name: string;
  timestamp: string;
  skuCount: number;
  pickingBoxes: number;
  totalBoxes: number;
  data: Array<{
    sku: number;
    descricao: string;
    embalagem: number;
    unidade: string;
    qtdPallet: number;
    estoquePicking: number;
    estoqueCentral: number;
    estoqueMarketplace: number;
    estoquePulmao: number;
    estoqueContingencia: number;
  }>;
}

export default function AbastecimentoDiarioComponent({ user, empresa, tasks }: AbastecimentoDiarioComponentProps) {
  // Date State for analysis (default: today)
  const [selectedAnalysisDate, setSelectedAnalysisDate] = useState<string>(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'suficiente_picking' | 'carregar_pulmao' | 'carregar_central' | 'carregar_marketplace' | 'carregar_contingencia' | 'reabastecer_picking' | 'reabastecer_misto' | 'ok' | 'attention' | 'critical' | 'night_need' | 'no_picking_sales' | 'total_rupture' | 'ruptura_in_full' | 'estoque_insuficiente'>('all');
  const [showOnlyWithSales, setShowOnlyWithSales] = useState(false);

  // Unit Metric Selector: 'cx' | 'pl' | 'hl'
  const [unitMetric, setUnitMetric] = useState<'cx' | 'pl' | 'hl'>('cx');
  // Curva ABC Filter: 'all' | 'A' | 'B' | 'C'
  const [curvaFilter, setCurvaFilter] = useState<'all' | 'A' | 'B' | 'C'>('all');

  // Dynamic Curva ABC Engine synchronized with Curva ABC Commercial Dashboard (03.05.19 / Quarters)
  const abcEngine = useMemo(() => {
    return getAbcMapForPeriod({
      date: selectedAnalysisDate
    });
  }, [selectedAnalysisDate]);

  // Night Replenishment Strategy State
  const [nightStrategy, setNightStrategy] = useState<'repor_vendas' | 'completar_1pl' | 'completar_2pl' | 'deficit'>('deficit');

  // Edit Mode & Database States
  const [isEditMode, setIsEditMode] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [savedAnalyses, setSavedAnalyses] = useState<any[]>([]);
  const [activePanel, setActivePanel] = useState<'analise' | 'historico'>('analise');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isHistoricalLoaded, setIsHistoricalLoaded] = useState(false);
  const [loadedHistoryMeta, setLoadedHistoryMeta] = useState<any | null>(null);

  // States for importing sales/venda files (Rotina 020304) and picking stock (Rotina 021101)
  const [importing021101, setImporting021101] = useState(false);
  const [fileName021101, setFileName021101] = useState('');
  const [imported021101Files, setImported021101Files] = useState<Imported021101File[]>([]);
  const [importing020304, setImporting020304] = useState(false);
  const [fileName020304, setFileName020304] = useState('');

  // Customizable products list initialized with enriched official master data across all 5 areas (excluding CERVEGELA/limpeza)
  const [productsList, setProductsList] = useState<BaseSkuData[]>(() => {
    return ABASTECIMENTO_PRODUCTS_DATA
      .filter(p => !isCleaningProduct(p.descricao) && !p.descricao.toUpperCase().includes('CERVEGELA'))
      .map(p => {
        const official = getOfficialProductInfo(p.sku, p.descricao);
        return {
          ...p,
          descricao: official.descricao,
          embalagem: official.embalagem,
          qtdPallet: official.qtdPallet,
          estoquePicking: p.estoquePicking !== undefined ? p.estoquePicking : p.estoqueInicialCaixas,
          estoqueCentral: p.estoqueCentral !== undefined ? p.estoqueCentral : 0,
          estoqueMarketplace: p.estoqueMarketplace !== undefined ? p.estoqueMarketplace : 0,
          estoquePulmao: p.estoquePulmao !== undefined ? p.estoquePulmao : 0,
          estoqueContingencia: p.estoqueContingencia !== undefined ? p.estoqueContingencia : 0,
        };
      });
  });

  // Customizable product data state holding all 5 areas: Picking (2), Central (1), Marketplace (3), Pulmão (4), Contingência (5) and Sales
  const [customProductData, setCustomProductData] = useState<Record<number, { 
    estoqueInicialCaixas: number; 
    estoquePicking?: number;      // Área 2: Picking
    estoqueCentral?: number;      // Área 1: Central
    estoqueMarketplace?: number;  // Área 3: Marketplace
    estoquePulmao?: number;       // Área 4: Pulmão
    estoqueContingencia?: number; // Área 5: Área de Contingência
    vendaCaixas: number;
  }>>(() => {
    const initial: Record<number, { 
      estoqueInicialCaixas: number; 
      estoquePicking?: number;
      estoqueCentral?: number; 
      estoqueMarketplace?: number; 
      estoquePulmao?: number;
      estoqueContingencia?: number;
      vendaCaixas: number;
    }> = {};
    ABASTECIMENTO_PRODUCTS_DATA.forEach(p => {
      initial[p.sku] = {
        estoqueInicialCaixas: p.estoqueInicialCaixas,
        estoquePicking: p.estoquePicking !== undefined ? p.estoquePicking : p.estoqueInicialCaixas,
        estoqueCentral: p.estoqueCentral !== undefined ? p.estoqueCentral : 0,
        estoqueMarketplace: p.estoqueMarketplace !== undefined ? p.estoqueMarketplace : 0,
        estoquePulmao: p.estoquePulmao !== undefined ? p.estoquePulmao : 0,
        estoqueContingencia: p.estoqueContingencia !== undefined ? p.estoqueContingencia : 0,
        vendaCaixas: p.vendaCaixas
      };
    });
    return initial;
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Helper functions for persistent draft storage in localStorage
  const getDraftKey = (empId: string, date: string) => `ambev_abastecimento_draft_${empId}_${date}`;

  const saveLocalDraft = (
    products: BaseSkuData[],
    customData: Record<number, any>,
    files021101: Imported021101File[],
    name021101: string,
    name020304: string,
    dateToSave: string = selectedAnalysisDate
  ) => {
    if (!empresa?.id) return;
    try {
      const payload = {
        productsList: products,
        customProductData: customData,
        imported021101Files: files021101,
        fileName021101: name021101,
        fileName020304: name020304,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(getDraftKey(empresa.id, dateToSave), JSON.stringify(payload));
    } catch (e) {
      console.warn("Erro ao salvar draft local:", e);
    }
  };

  const clearLocalDraft = (empId: string, date: string) => {
    try {
      localStorage.removeItem(getDraftKey(empId, date));
    } catch (e) {
      console.warn("Erro ao limpar draft local:", e);
    }
  };

  // 1. Load saved analysis for the selected date
  const loadAnalysisForDate = async (dateStr: string) => {
    if (!empresa?.id) return;
    setSaving(true);
    try {
      const allRows = await abastecimentoAnaliseRepo.getAll(empresa.id);
      const matching = allRows.filter((r: any) => r.dataAnalise === dateStr);
      if (matching.length > 0) {
        const docData = matching[0];
        const productDetails = docData.productDetails || [];
        
        const loadedData: Record<number, { 
          estoqueInicialCaixas: number; 
          estoquePicking?: number; 
          estoqueCentral?: number; 
          estoqueMarketplace?: number; 
          estoquePulmao?: number;
          estoqueContingencia?: number;
          vendaCaixas: number;
        }> = {};
        const loadedProductsList: BaseSkuData[] = [];
        
        productDetails.forEach((p: any) => {
          const official = getOfficialProductInfo(Number(p.sku), p.descricao);
          const pickingStock = p.estoquePicking !== undefined ? Number(p.estoquePicking) : Number(p.estoqueInicialCaixas || 0);
          const centralStock = p.estoqueCentral !== undefined ? Number(p.estoqueCentral) : 0;
          const mkpStock = p.estoqueMarketplace !== undefined ? Number(p.estoqueMarketplace) : 0;
          const pulmaoStock = p.estoquePulmao !== undefined ? Number(p.estoquePulmao) : 0;
          const contStock = p.estoqueContingencia !== undefined ? Number(p.estoqueContingencia) : 0;

          loadedData[Number(p.sku)] = {
            estoqueInicialCaixas: pickingStock,
            estoquePicking: pickingStock,
            estoqueCentral: centralStock,
            estoqueMarketplace: mkpStock,
            estoquePulmao: pulmaoStock,
            estoqueContingencia: contStock,
            vendaCaixas: Number(p.vendaCaixas || 0)
          };
          loadedProductsList.push({
            sku: Number(p.sku),
            descricao: official.descricao,
            unidade: p.unidade || official.unidade || 'cx',
            embalagem: p.embalagem || official.embalagem || 1,
            qtdPallet: p.qtdPallet || official.qtdPallet || 100,
            estoqueInicialCaixas: pickingStock,
            estoquePicking: pickingStock,
            estoqueCentral: centralStock,
            estoqueMarketplace: mkpStock,
            estoquePulmao: pulmaoStock,
            estoqueContingencia: contStock,
            vendaCaixas: Number(p.vendaCaixas || 0)
          });
        });

        const files021101: Imported021101File[] = docData.imported021101Files || [];
        const name021101: string = docData.fileName021101 || (files021101.length > 0 ? (files021101.length === 1 ? files021101[0].name : `${files021101.length} arquivos 02.11.01`) : '');
        const name020304: string = docData.fileName020304 || '';

        const finalProductsList = loadedProductsList.length > 0 ? loadedProductsList : ABASTECIMENTO_PRODUCTS_DATA;
        setProductsList(finalProductsList);
        setCustomProductData(loadedData);
        setImported021101Files(files021101);
        setFileName021101(name021101);
        setFileName020304(name020304);
        setIsHistoricalLoaded(true);
        setLoadedHistoryMeta({
          id: docData._docId || docData.id,
          savedBy: docData.usuarioNome || docData.usuarioEmail || 'Sistema',
          savedAt: docData.createdAt || ''
        });

        saveLocalDraft(finalProductsList, loadedData, files021101, name021101, name020304, dateStr);
        showToast(`Análise registrada de ${dateStr} carregada com sucesso!`, "success");
      } else {
        // Check if there is an active draft saved locally for this date and company
        const draftRaw = localStorage.getItem(getDraftKey(empresa.id, dateStr));
        if (draftRaw) {
          try {
            const draft = JSON.parse(draftRaw);
            if (draft.productsList && draft.customProductData) {
              setProductsList(draft.productsList);
              setCustomProductData(draft.customProductData);
              setImported021101Files(draft.imported021101Files || []);
              setFileName021101(draft.fileName021101 || '');
              setFileName020304(draft.fileName020304 || '');
              setIsHistoricalLoaded(false);
              setLoadedHistoryMeta(null);
              return;
            }
          } catch (err) {
            console.error("Erro ao ler rascunho de relatórios salvos:", err);
          }
        }

        // Fallback to baseline default values with master descriptions
        const initial: Record<number, { 
          estoqueInicialCaixas: number; 
          estoquePicking?: number; 
          estoqueCentral?: number; 
          estoqueMarketplace?: number; 
          estoquePulmao?: number; 
          estoqueContingencia?: number; 
          vendaCaixas: number;
        }> = {};
        const enrichedList = ABASTECIMENTO_PRODUCTS_DATA.map(p => {
          const official = getOfficialProductInfo(p.sku, p.descricao);
          const pickingStock = p.estoquePicking !== undefined ? p.estoquePicking : p.estoqueInicialCaixas;
          const centralStock = p.estoqueCentral !== undefined ? p.estoqueCentral : 0;
          const mkpStock = p.estoqueMarketplace !== undefined ? p.estoqueMarketplace : 0;
          const pulmaoStock = p.estoquePulmao !== undefined ? p.estoquePulmao : 0;
          const contStock = p.estoqueContingencia !== undefined ? p.estoqueContingencia : 0;

          initial[p.sku] = {
            estoqueInicialCaixas: pickingStock,
            estoquePicking: pickingStock,
            estoqueCentral: centralStock,
            estoqueMarketplace: mkpStock,
            estoquePulmao: pulmaoStock,
            estoqueContingencia: contStock,
            vendaCaixas: p.vendaCaixas
          };

          return {
            ...p,
            descricao: official.descricao,
            embalagem: official.embalagem,
            qtdPallet: official.qtdPallet,
            estoqueInicialCaixas: pickingStock,
            estoquePicking: pickingStock,
            estoqueCentral: centralStock,
            estoqueMarketplace: mkpStock,
            estoquePulmao: pulmaoStock,
            estoqueContingencia: contStock,
          };
        });

        setProductsList(enrichedList);
        setCustomProductData(initial);
        setImported021101Files([]);
        setFileName021101('');
        setFileName020304('');
        setIsHistoricalLoaded(false);
        setLoadedHistoryMeta(null);
      }
    } catch (error) {
      console.error("Erro ao carregar análise de abastecimento:", error);
      showToast("Erro ao carregar dados da análise.", "error");
    } finally {
      setSaving(false);
    }
  };

  // 2. Query history list of saved analyses
  const fetchHistory = async () => {
    if (!empresa?.id) return;
    setLoadingHistory(true);
    try {
      const list = await abastecimentoAnaliseRepo.getAll(empresa.id);
      list.sort((a: any, b: any) => (b.dataAnalise || '').localeCompare(a.dataAnalise || ''));
      setSavedAnalyses(list);
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Sync state with selected date or company changes
  useEffect(() => {
    if (empresa?.id) {
      loadAnalysisForDate(selectedAnalysisDate);
      fetchHistory();
    }
  }, [selectedAnalysisDate, empresa?.id]);

  // 3. Process tasks to map to our real Ambev SKUs
  const replenishmentMap = useMemo(() => {
    const map = new Map<number, { boxes: number; pallets: number; operators: Set<string>; hourlyCounts: Record<number, number>; hourlyBoxes: Record<number, number> }>();
    
    // Initialize map with 0s for all products
    productsList.forEach(p => {
      map.set(p.sku, {
        boxes: 0,
        pallets: 0,
        operators: new Set<string>(),
        hourlyCounts: {}, // Pallets por hora
        hourlyBoxes: {}   // Caixas por hora
      });
    });

    let excludedCount = 0;

    tasks.forEach(t => {
      // Check if task is completed
      const isCompleted = t.status === 'done' || t.status === 'concluida' || t.status === 'finalizada' || t.status === 'completed';
      if (!isCompleted) return;

      // Extract date string YYYY-MM-DD
      let taskDate = '';
      if (t.dataConclusao) {
        taskDate = t.dataConclusao;
      } else if (t.rawTask?.finalizadoEm) {
        const rawStr = String(t.rawTask.finalizadoEm);
        if (rawStr.includes('T')) taskDate = rawStr.split('T')[0];
        else if (rawStr.includes(' ')) taskDate = rawStr.split(' ')[0];
        else taskDate = rawStr;
      } else if (t.rawTask?.criadoEm) {
        const rawStr = String(t.rawTask.criadoEm);
        if (rawStr.includes('T')) taskDate = rawStr.split('T')[0];
        else if (rawStr.includes(' ')) taskDate = rawStr.split(' ')[0];
        else taskDate = rawStr;
      }

      // Check date match
      if (taskDate && taskDate !== selectedAnalysisDate) return;

      // Extract completion hour (0-23)
      let hour = 10; // default pico matinal
      if (t.horaConclusao !== undefined && t.horaConclusao >= 0 && t.horaConclusao <= 23) {
        hour = t.horaConclusao;
      } else if (t.rawTask?.finalizadoEm) {
        try {
          const rawStr = String(t.rawTask.finalizadoEm);
          let timePart = '';
          if (rawStr.includes('T')) timePart = rawStr.split('T')[1];
          else if (rawStr.includes(' ')) timePart = rawStr.split(' ')[1];
          if (timePart) {
            hour = parseInt(timePart.split(':')[0], 10);
          }
        } catch (e) {
          hour = 10;
        }
      }

      if (isNaN(hour) || hour < 0 || hour > 23) hour = 10;

      // Map generated task SKU to real Ambev SKU if it's from mock generator (codes 20000+)
      let targetSku = Number(t.sku || t.codigo || 0);
      if (targetSku >= 20000) {
        const idx = (targetSku - 20000) % ABASTECIMENTO_PRODUCTS_DATA.length;
        targetSku = ABASTECIMENTO_PRODUCTS_DATA[idx].sku;
      }

      let entry = map.get(targetSku);

      // Fallback matching by description if direct SKU match wasn't found
      if (!entry) {
        const descSearch = (t.descricaoSku || t.descricao || '').toUpperCase().trim();
        if (descSearch) {
          for (const prod of productsList) {
            const pDescUpper = prod.descricao.toUpperCase();
            const firstWord = pDescUpper.split(' ')[0];
            if (descSearch.includes(firstWord) || pDescUpper.includes(descSearch.split(' ')[0])) {
              entry = map.get(prod.sku);
              targetSku = prod.sku;
              break;
            }
          }
        }
      }

      if (entry) {
        const productInfo = productsList.find(p => p.sku === targetSku);
        const boxesPerPallet = productInfo?.qtdPallet || 100;

        let qtyPallets = Number(t.quantidadePaletes || 0);
        if (!qtyPallets && t.quantidade) {
          qtyPallets = t.quantidade > 25 ? Math.ceil(t.quantidade / boxesPerPallet) : t.quantidade;
        }
        if (qtyPallets <= 0) qtyPallets = 1;

        const qtyBoxes = qtyPallets * boxesPerPallet;
        
        entry.boxes += qtyBoxes;
        entry.pallets += qtyPallets;
        if (t.operador) {
          entry.operators.add(t.operador);
        }
        
        // Visão por PALETE como métrica operacional principal
        entry.hourlyCounts[hour] = (entry.hourlyCounts[hour] || 0) + qtyPallets;
        entry.hourlyBoxes = entry.hourlyBoxes || {};
        entry.hourlyBoxes[hour] = (entry.hourlyBoxes[hour] || 0) + qtyBoxes;
      }
    });

    return { map, excludedCount };
  }, [tasks, selectedAnalysisDate, productsList]);

  // Map for SKU -> Hectolitro Factor (fatorHecto)
  const planoHectoMap = useMemo(() => {
    const map = new Map<number, number>();
    PRODUCTS.forEach(p => {
      if (p.codigo && p.fatorHecto) {
        map.set(Number(p.codigo), Number(p.fatorHecto));
      }
    });
    return map;
  }, []);

  // 4. Process all SKUs with replenishment, 5-area stocks and sales
  const processedSkus = useMemo(() => {
    return productsList.map(p => {
      const dynamicCurvaAbc = abcEngine.getCurva(p.sku, p.curvaAbc);
      const replData = replenishmentMap.map.get(p.sku) || { boxes: 0, pallets: 0, operators: new Set<string>() };
      
      const customData = customProductData[p.sku] || { 
        estoqueInicialCaixas: p.estoqueInicialCaixas,
        estoquePicking: p.estoquePicking !== undefined ? p.estoquePicking : p.estoqueInicialCaixas,
        estoqueCentral: p.estoqueCentral || 0,
        estoqueMarketplace: p.estoqueMarketplace || 0,
        estoquePulmao: p.estoquePulmao || 0,
        estoqueContingencia: p.estoqueContingencia || 0,
        vendaCaixas: p.vendaCaixas 
      };
      
      const estoquePicking = customData.estoquePicking !== undefined ? customData.estoquePicking : (p.estoquePicking !== undefined ? p.estoquePicking : customData.estoqueInicialCaixas);
      const estoqueCentral = customData.estoqueCentral !== undefined ? customData.estoqueCentral : (p.estoqueCentral || 0);
      const estoqueMarketplace = customData.estoqueMarketplace !== undefined ? customData.estoqueMarketplace : (p.estoqueMarketplace || 0);
      const estoquePulmao = customData.estoquePulmao !== undefined ? customData.estoquePulmao : (p.estoquePulmao || 0);
      const estoqueContingencia = customData.estoqueContingencia !== undefined ? customData.estoqueContingencia : (p.estoqueContingencia || 0);

      const estoqueInicial = estoquePicking;
      const abastecimento = replData.boxes;
      const venda = customData.vendaCaixas;
      
      const estoqueTotalDisponivel = estoqueInicial + abastecimento;
      const saldoPicking = estoqueTotalDisponivel - venda;
      
      const fatorHecto = planoHectoMap.get(Number(p.sku)) || 0.072;
      const estoqueInicialHecto = estoqueInicial * fatorHecto;
      const estoquePickingHecto = estoquePicking * fatorHecto;
      const estoqueCentralHecto = estoqueCentral * fatorHecto;
      const estoqueMarketplaceHecto = estoqueMarketplace * fatorHecto;
      const estoquePulmaoHecto = estoquePulmao * fatorHecto;
      const estoqueContingenciaHecto = estoqueContingencia * fatorHecto;
      const abastecimentoHecto = abastecimento * fatorHecto;
      const vendaHecto = venda * fatorHecto;
      const saldoPickingHecto = saldoPicking * fatorHecto;

      let status: 'ok' | 'attention' | 'critical' = 'ok';
      if (saldoPicking < 0) {
        status = 'critical';
      } else if (venda > 0 && (saldoPicking < (venda * 0.20))) {
        status = 'attention';
      }

      // Conversões detalhadas de SKU em Paletes Fechados e SKUs Fracionados
      const convPickingInicial = convertSkuToPalletAndSku(estoqueInicial, p.qtdPallet);
      const convPickingDisponivel = convertSkuToPalletAndSku(estoqueTotalDisponivel, p.qtdPallet);
      const convPulmao = convertSkuToPalletAndSku(estoquePulmao, p.qtdPallet);
      const convCentral = convertSkuToPalletAndSku(estoqueCentral, p.qtdPallet);
      const convMarketplace = convertSkuToPalletAndSku(estoqueMarketplace, p.qtdPallet);
      const convContingencia = convertSkuToPalletAndSku(estoqueContingencia, p.qtdPallet);
      const convVenda = convertSkuToPalletAndSku(venda, p.qtdPallet);
      const convSaldo = convertSkuToPalletAndSku(Math.abs(saldoPicking), p.qtdPallet);

      const pickingDisponivelCaixas = estoqueTotalDisponivel;
      const pickingDisponivelPaletes = convPickingDisponivel.palletsDecimal;
      const pickingInicialPaletes = convPickingInicial.palletsDecimal;
      
      const estoqueTotalGeralCaixas = estoquePicking + estoquePulmao + estoqueCentral + estoqueMarketplace + estoqueContingencia + abastecimento;
      const estoqueTotalGeralPaletes = Math.round((estoqueTotalGeralCaixas / p.qtdPallet) * 10) / 10;
      
      const vendaPaletes = convVenda.palletsDecimal;
      const palletsFechadosVenda = convVenda.palletsFechados;
      const fracaoPickingVenda = convVenda.skuFracionado;

      const coberturaPickingPct = venda > 0 ? Math.round((estoqueTotalDisponivel / venda) * 100) : 100;
      const coberturaPickingDias = venda > 0 ? Math.round((estoqueTotalDisponivel / venda) * 10) / 10 : 99;

      // Hierarquia e Detalhamento de Retiradas para Abastecimento das Áreas:
      // Ordem de abastecimento quando o picking não supre a saída:
      // 1. Área 4 (Pulmão)
      // 2. Área 1 (Central)
      // 3. Área 3 (Marketplace)
      // 4. Área 5 (Área de Contingência)
      interface RetiradaAreaItem {
        areaId: 1 | 2 | 3 | 4 | 5;
        areaCodigo: string;
        areaNome: string;
        caixas: number;
        palletsFechados: number;
        skuFracionado: number;
        formatado: string;
        badgeBg: string;
        badgeBorder: string;
        badgeText: string;
      }

      const retiradasDetalhadas: RetiradaAreaItem[] = [];
      let statusMontagem: 'suficiente_picking' | 'carregar_pulmao' | 'carregar_central' | 'carregar_marketplace' | 'carregar_contingencia' | 'reabastecer_misto' | 'ruptura_total' = 'suficiente_picking';
      let acaoMontagemTexto = '';
      let tagMontagemTexto = '';
      let rupturaCaixas = 0;
      let rupturaPaletes = 0;

      let carregarPulmaoCaixas = 0;
      let carregarPulmaoPaletes = 0;
      let carregarCentralCaixas = 0;
      let carregarCentralPaletes = 0;
      let carregarMarketplaceCaixas = 0;
      let carregarMarketplacePaletes = 0;
      let carregarContingenciaCaixas = 0;
      let carregarContingenciaPaletes = 0;
      let reabastecerPickingCaixas = 0;
      let reabastecerPickingPaletes = 0;

      if (venda === 0) {
        statusMontagem = 'suficiente_picking';
        acaoMontagemTexto = 'Sem demanda de saída no dia';
        tagMontagemTexto = 'Sem Saída';
      } else if (saldoPicking >= 0) {
        statusMontagem = 'suficiente_picking';
        acaoMontagemTexto = `Picking suficiente (Sobra: +${saldoPicking} cx / +${convSaldo.formatado})`;
        tagMontagemTexto = `Picking OK`;
      } else {
        const deficitCaixas = Math.abs(saldoPicking);
        let deficitRestante = deficitCaixas;

        // 1. Prioridade: Pulmão (Área 4)
        if (deficitRestante > 0 && estoquePulmao > 0) {
          const qtd = Math.min(estoquePulmao, deficitRestante);
          carregarPulmaoCaixas = qtd;
          const conv = convertSkuToPalletAndSku(qtd, p.qtdPallet);
          carregarPulmaoPaletes = conv.palletsDecimal;
          retiradasDetalhadas.push({
            areaId: 4,
            areaCodigo: 'Área 4',
            areaNome: 'Pulmão',
            caixas: qtd,
            palletsFechados: conv.palletsFechados,
            skuFracionado: conv.skuFracionado,
            formatado: conv.formatado,
            badgeBg: 'bg-blue-50',
            badgeBorder: 'border-blue-300',
            badgeText: 'text-blue-900'
          });
          deficitRestante -= qtd;
        }

        // 2. Prioridade: Central (Área 1)
        if (deficitRestante > 0 && estoqueCentral > 0) {
          const qtd = Math.min(estoqueCentral, deficitRestante);
          carregarCentralCaixas = qtd;
          const conv = convertSkuToPalletAndSku(qtd, p.qtdPallet);
          carregarCentralPaletes = conv.palletsDecimal;
          retiradasDetalhadas.push({
            areaId: 1,
            areaCodigo: 'Área 1',
            areaNome: 'Central',
            caixas: qtd,
            palletsFechados: conv.palletsFechados,
            skuFracionado: conv.skuFracionado,
            formatado: conv.formatado,
            badgeBg: 'bg-amber-50',
            badgeBorder: 'border-amber-300',
            badgeText: 'text-amber-900'
          });
          deficitRestante -= qtd;
        }

        // 3. Prioridade: Marketplace (Área 3)
        if (deficitRestante > 0 && estoqueMarketplace > 0) {
          const qtd = Math.min(estoqueMarketplace, deficitRestante);
          carregarMarketplaceCaixas = qtd;
          const conv = convertSkuToPalletAndSku(qtd, p.qtdPallet);
          carregarMarketplacePaletes = conv.palletsDecimal;
          retiradasDetalhadas.push({
            areaId: 3,
            areaCodigo: 'Área 3',
            areaNome: 'Marketplace',
            caixas: qtd,
            palletsFechados: conv.palletsFechados,
            skuFracionado: conv.skuFracionado,
            formatado: conv.formatado,
            badgeBg: 'bg-orange-50',
            badgeBorder: 'border-orange-300',
            badgeText: 'text-orange-900'
          });
          deficitRestante -= qtd;
        }

        // 4. Prioridade: Área de Contingência (Área 5)
        if (deficitRestante > 0 && estoqueContingencia > 0) {
          const qtd = Math.min(estoqueContingencia, deficitRestante);
          carregarContingenciaCaixas = qtd;
          const conv = convertSkuToPalletAndSku(qtd, p.qtdPallet);
          carregarContingenciaPaletes = conv.palletsDecimal;
          retiradasDetalhadas.push({
            areaId: 5,
            areaCodigo: 'Área 5',
            areaNome: 'Contingência',
            caixas: qtd,
            palletsFechados: conv.palletsFechados,
            skuFracionado: conv.skuFracionado,
            formatado: conv.formatado,
            badgeBg: 'bg-purple-50',
            badgeBorder: 'border-purple-300',
            badgeText: 'text-purple-900'
          });
          deficitRestante -= qtd;
        }

        // Se após todas as 4 áreas ainda resta déficit, há Ruptura de Estoque no Armazém
        if (deficitRestante > 0) {
          rupturaCaixas = deficitRestante;
          rupturaPaletes = Math.ceil(deficitRestante / p.qtdPallet);
          reabastecerPickingCaixas = deficitRestante;
          reabastecerPickingPaletes = rupturaPaletes;
        }

        if (retiradasDetalhadas.length === 1 && rupturaCaixas === 0) {
          const single = retiradasDetalhadas[0];
          if (single.areaId === 4) {
            statusMontagem = 'carregar_pulmao';
            acaoMontagemTexto = `Retirar ${single.formatado} do Pulmão (Área 4)`;
            tagMontagemTexto = `Pulmão: ${single.formatado}`;
          } else if (single.areaId === 1) {
            statusMontagem = 'carregar_central';
            acaoMontagemTexto = `Retirar ${single.formatado} do Central (Área 1)`;
            tagMontagemTexto = `Central: ${single.formatado}`;
          } else if (single.areaId === 3) {
            statusMontagem = 'carregar_marketplace';
            acaoMontagemTexto = `Retirar ${single.formatado} do MktPlace (Área 3)`;
            tagMontagemTexto = `MktPlace: ${single.formatado}`;
          } else if (single.areaId === 5) {
            statusMontagem = 'carregar_contingencia';
            acaoMontagemTexto = `Retirar ${single.formatado} da Contingência (Área 5)`;
            tagMontagemTexto = `Contingência: ${single.formatado}`;
          }
        } else if (retiradasDetalhadas.length > 1) {
          statusMontagem = 'reabastecer_misto';
          acaoMontagemTexto = retiradasDetalhadas.map(r => `${r.areaNome}: ${r.formatado}`).join(' + ') + (rupturaCaixas > 0 ? ` + Ruptura: ${rupturaCaixas} cx` : '');
          tagMontagemTexto = `Misto (${retiradasDetalhadas.length} Áreas)`;
        } else if (rupturaCaixas > 0) {
          statusMontagem = 'ruptura_total';
          acaoMontagemTexto = `Ruptura Total no Armazém (Faltam ${rupturaCaixas} cx / ${rupturaPaletes} PL)`;
          tagMontagemTexto = `Ruptura Total`;
        }
      }

      // Calculate Night Replenishment Need based on selected strategy
      let target = 0;
      if (nightStrategy === 'repor_vendas') {
        target = venda;
      } else if (nightStrategy === 'completar_1pl') {
        target = p.qtdPallet;
      } else if (nightStrategy === 'completar_2pl') {
        target = p.qtdPallet * 2;
      } else if (nightStrategy === 'deficit') {
        target = 0;
      }

      let necessidadeNoturna = 0;
      if (saldoPicking < target) {
        necessidadeNoturna = target - saldoPicking;
      }

      const necessidadeNoturnaPaletes = Math.round((necessidadeNoturna / p.qtdPallet) * 10) / 10;
      const necessidadeNoturnaHecto = necessidadeNoturna * fatorHecto;

      return {
        ...p,
        curvaAbc: dynamicCurvaAbc,
        fatorHecto,
        estoquePicking,
        estoquePickingHecto,
        estoqueCentral,
        estoqueCentralHecto,
        estoqueMarketplace,
        estoqueMarketplaceHecto,
        estoquePulmao,
        estoquePulmaoHecto,
        estoqueContingencia,
        estoqueContingenciaHecto,
        estoqueInicialCaixas: estoqueInicial,
        estoqueInicialHecto,
        pickingInicialPaletes,
        pickingDisponivelCaixas,
        pickingDisponivelPaletes,
        estoqueTotalGeralCaixas,
        estoqueTotalGeralPaletes,
        coberturaPickingPct,
        coberturaPickingDias,
        vendaCaixas: venda,
        vendaPaletes,
        vendaHecto,
        abastecimento,
        abastecimentoPaletes: replData.pallets,
        abastecimentoHecto,
        estoqueTotalDisponivel,
        estoqueTotalHecto: estoqueTotalDisponivel * fatorHecto,
        saldoPicking,
        saldoPickingHecto,
        palletsNoPicking: pickingDisponivelPaletes,
        palletsVendaTotal: vendaPaletes,
        palletsFechadosVenda,
        fracaoPickingVenda,
        carregarPulmaoCaixas,
        carregarPulmaoPaletes,
        carregarCentralCaixas,
        carregarCentralPaletes,
        carregarMarketplaceCaixas,
        carregarMarketplacePaletes,
        carregarContingenciaCaixas,
        carregarContingenciaPaletes,
        reabastecerPickingCaixas,
        reabastecerPickingPaletes,
        retiradasDetalhadas,
        rupturaCaixas,
        rupturaPaletes,
        statusMontagem,
        acaoMontagemTexto,
        tagMontagemTexto,
        isPickingSuficiente: saldoPicking >= 0,
        status,
        operadores: Array.from(replData.operators),
        necessidadeNoturna,
        necessidadeNoturnaPaletes,
        necessidadeNoturnaHecto
      };
    });
  }, [productsList, replenishmentMap, customProductData, nightStrategy, planoHectoMap, abcEngine]);

  // Active SKUs filtered for header metrics
  const activeSkusForMetrics = useMemo(() => {
    if (curvaFilter === 'all') return processedSkus;
    return processedSkus.filter(p => (p.curvaAbc || 'B') === curvaFilter);
  }, [processedSkus, curvaFilter]);

  // 5. Totals calculations (dynamically reactive to active curvaFilter across all 5 areas)
  const totalSkusChecked = useMemo(() => activeSkusForMetrics.filter(p => p.estoqueInicialCaixas > 0).length, [activeSkusForMetrics]);
  const totalInitialBoxes = useMemo(() => activeSkusForMetrics.reduce((acc, curr) => acc + curr.estoqueInicialCaixas, 0), [activeSkusForMetrics]);
  const totalInitialPallets = useMemo(() => {
    return Math.round(activeSkusForMetrics.reduce((acc, curr) => acc + (curr.estoqueInicialCaixas / curr.qtdPallet), 0) * 10) / 10;
  }, [activeSkusForMetrics]);
  const totalInitialHecto = useMemo(() => {
    return activeSkusForMetrics.reduce((acc, curr) => acc + (curr.estoqueInicialHecto || 0), 0);
  }, [activeSkusForMetrics]);

  const totalPulmaoBoxes = useMemo(() => activeSkusForMetrics.reduce((acc, curr) => acc + (curr.estoquePulmao || 0), 0), [activeSkusForMetrics]);
  const totalPulmaoPallets = useMemo(() => Math.round(activeSkusForMetrics.reduce((acc, curr) => acc + ((curr.estoquePulmao || 0) / curr.qtdPallet), 0) * 10) / 10, [activeSkusForMetrics]);

  const totalCentralBoxes = useMemo(() => activeSkusForMetrics.reduce((acc, curr) => acc + (curr.estoqueCentral || 0), 0), [activeSkusForMetrics]);
  const totalCentralPallets = useMemo(() => Math.round(activeSkusForMetrics.reduce((acc, curr) => acc + ((curr.estoqueCentral || 0) / curr.qtdPallet), 0) * 10) / 10, [activeSkusForMetrics]);

  const totalMarketplaceBoxes = useMemo(() => activeSkusForMetrics.reduce((acc, curr) => acc + (curr.estoqueMarketplace || 0), 0), [activeSkusForMetrics]);
  const totalMarketplacePallets = useMemo(() => Math.round(activeSkusForMetrics.reduce((acc, curr) => acc + ((curr.estoqueMarketplace || 0) / curr.qtdPallet), 0) * 10) / 10, [activeSkusForMetrics]);

  const totalContingenciaBoxes = useMemo(() => activeSkusForMetrics.reduce((acc, curr) => acc + (curr.estoqueContingencia || 0), 0), [activeSkusForMetrics]);
  const totalContingenciaPallets = useMemo(() => Math.round(activeSkusForMetrics.reduce((acc, curr) => acc + ((curr.estoqueContingencia || 0) / curr.qtdPallet), 0) * 10) / 10, [activeSkusForMetrics]);

  const totalGeralArmazemBoxes = useMemo(() => activeSkusForMetrics.reduce((acc, curr) => acc + (curr.estoqueTotalGeralCaixas || 0), 0), [activeSkusForMetrics]);
  const totalGeralArmazemPallets = useMemo(() => Math.round(activeSkusForMetrics.reduce((acc, curr) => acc + ((curr.estoqueTotalGeralCaixas || 0) / curr.qtdPallet), 0) * 10) / 10, [activeSkusForMetrics]);

  const totalSkusReplenished = useMemo(() => activeSkusForMetrics.filter(p => p.abastecimento > 0).length, [activeSkusForMetrics]);
  const totalReplenishedBoxes = useMemo(() => activeSkusForMetrics.reduce((acc, curr) => acc + curr.abastecimento, 0), [activeSkusForMetrics]);
  const totalReplenishedPallets = useMemo(() => activeSkusForMetrics.reduce((acc, curr) => acc + curr.abastecimentoPaletes, 0), [activeSkusForMetrics]);
  const totalReplenishedHecto = useMemo(() => {
    return activeSkusForMetrics.reduce((acc, curr) => acc + (curr.abastecimentoHecto || 0), 0);
  }, [activeSkusForMetrics]);

  const activeOperators = useMemo(() => {
    const allOps = new Set<string>();
    replenishmentMap.map.forEach(val => {
      val.operators.forEach(op => allOps.add(op));
    });
    return allOps.size || 5;
  }, [replenishmentMap]);

  const totalSalesBoxes = useMemo(() => activeSkusForMetrics.reduce((acc, curr) => acc + curr.vendaCaixas, 0), [activeSkusForMetrics]);
  const totalSalesPallets = useMemo(() => {
    return Math.round(activeSkusForMetrics.reduce((acc, curr) => acc + (curr.vendaCaixas / curr.qtdPallet), 0) * 10) / 10;
  }, [activeSkusForMetrics]);
  const totalSalesHecto = useMemo(() => activeSkusForMetrics.reduce((acc, curr) => acc + (curr.vendaHecto || 0), 0), [activeSkusForMetrics]);
  
  const totalCurrentBalanceBoxes = useMemo(() => activeSkusForMetrics.reduce((acc, curr) => acc + curr.saldoPicking, 0), [activeSkusForMetrics]);
  const totalCurrentBalancePallets = useMemo(() => {
    return Math.round(activeSkusForMetrics.reduce((acc, curr) => acc + (curr.saldoPicking / curr.qtdPallet), 0) * 10) / 10;
  }, [activeSkusForMetrics]);
  const totalCurrentBalanceHecto = useMemo(() => activeSkusForMetrics.reduce((acc, curr) => acc + (curr.saldoPickingHecto || 0), 0), [activeSkusForMetrics]);
  
  // Montagem e Retiradas por Área Totals
  const montagemTotals = useMemo(() => {
    const comVenda = activeSkusForMetrics.filter(p => p.vendaCaixas > 0);
    const suficientes = comVenda.filter(p => p.statusMontagem === 'suficiente_picking');
    
    const comPulmao = comVenda.filter(p => (p.carregarPulmaoCaixas || 0) > 0);
    const caixasPulmao = comVenda.reduce((acc, p) => acc + (p.carregarPulmaoCaixas || 0), 0);
    const palletsPulmao = Math.round(comVenda.reduce((acc, p) => acc + ((p.carregarPulmaoCaixas || 0) / p.qtdPallet), 0) * 10) / 10;

    const comCentral = comVenda.filter(p => (p.carregarCentralCaixas || 0) > 0);
    const caixasCentral = comVenda.reduce((acc, p) => acc + (p.carregarCentralCaixas || 0), 0);
    const palletsCentral = Math.round(comVenda.reduce((acc, p) => acc + ((p.carregarCentralCaixas || 0) / p.qtdPallet), 0) * 10) / 10;
    
    const comMarketplace = comVenda.filter(p => (p.carregarMarketplaceCaixas || 0) > 0);
    const caixasMarketplace = comVenda.reduce((acc, p) => acc + (p.carregarMarketplaceCaixas || 0), 0);
    const palletsMarketplace = Math.round(comVenda.reduce((acc, p) => acc + ((p.carregarMarketplaceCaixas || 0) / p.qtdPallet), 0) * 10) / 10;

    const comContingencia = comVenda.filter(p => (p.carregarContingenciaCaixas || 0) > 0);
    const caixasContingencia = comVenda.reduce((acc, p) => acc + (p.carregarContingenciaCaixas || 0), 0);
    const palletsContingencia = Math.round(comVenda.reduce((acc, p) => acc + ((p.carregarContingenciaCaixas || 0) / p.qtdPallet), 0) * 10) / 10;
    
    const comReabastecer = comVenda.filter(p => (p.reabastecerPickingCaixas || 0) > 0);
    const caixasReabastecer = comVenda.reduce((acc, p) => acc + (p.reabastecerPickingCaixas || 0), 0);
    const palletsReabastecer = Math.round(comVenda.reduce((acc, p) => acc + ((p.reabastecerPickingCaixas || 0) / p.qtdPallet), 0) * 10) / 10;

    const comRuptura = comVenda.filter(p => (p.rupturaCaixas || 0) > 0);
    const caixasRuptura = comVenda.reduce((acc, p) => acc + (p.rupturaCaixas || 0), 0);
    const palletsRuptura = Math.ceil(caixasRuptura / 100);

    return {
      totalSkusComVenda: comVenda.length,
      skusSuficientes: suficientes.length,
      skusCarregarPulmao: comPulmao.length,
      caixasPulmao,
      palletsPulmao,
      skusCarregarCentral: comCentral.length,
      caixasCentral,
      palletsCentral,
      skusCarregarMarketplace: comMarketplace.length,
      caixasMarketplace,
      palletsMarketplace,
      skusCarregarContingencia: comContingencia.length,
      caixasContingencia,
      palletsContingencia,
      skusReabastecer: comReabastecer.length,
      caixasReabastecer,
      palletsReabastecer,
      skusRuptura: comRuptura.length,
      caixasRuptura,
      palletsRuptura
    };
  }, [activeSkusForMetrics]);

  // Night Replenishment Totals
  const totalSkusNightReplenish = useMemo(() => activeSkusForMetrics.filter(p => p.necessidadeNoturna > 0).length, [activeSkusForMetrics]);
  const totalNightReplenishBoxes = useMemo(() => activeSkusForMetrics.reduce((acc, curr) => acc + curr.necessidadeNoturna, 0), [activeSkusForMetrics]);
  const totalNightReplenishPallets = useMemo(() => {
    return Math.round(activeSkusForMetrics.reduce((acc, curr) => acc + (curr.necessidadeNoturna / curr.qtdPallet), 0) * 10) / 10;
  }, [activeSkusForMetrics]);
  const totalNightReplenishHecto = useMemo(() => {
    return activeSkusForMetrics.reduce((acc, curr) => acc + (curr.necessidadeNoturnaHecto || 0), 0);
  }, [activeSkusForMetrics]);
  
  const statusCounts = useMemo(() => {
    let ok = 0;
    let attention = 0;
    let critical = 0;
    activeSkusForMetrics.forEach(p => {
      if (p.status === 'ok') ok++;
      else if (p.status === 'attention') attention++;
      else if (p.status === 'critical') critical++;
    });
    return { ok, attention, critical };
  }, [activeSkusForMetrics]);

  // SKUs without initial picking stock that had sales output
  const skusSemEstoqueInicialComVenda = useMemo(() => {
    return activeSkusForMetrics.filter(p => p.estoqueInicialCaixas === 0 && p.vendaCaixas > 0);
  }, [activeSkusForMetrics]);

  const skusRupturaTotalPicking = useMemo(() => {
    return activeSkusForMetrics.filter(p => p.estoqueTotalDisponivel === 0 && p.vendaCaixas > 0);
  }, [activeSkusForMetrics]);

  // Alerta Crítico: Ruptura In Full (SKU com saída e ZERO estoque em TODAS as áreas do armazém)
  const skusRupturaInFull = useMemo(() => {
    return activeSkusForMetrics.filter(p => p.vendaCaixas > 0 && p.estoqueTotalGeralCaixas === 0);
  }, [activeSkusForMetrics]);

  const caixasRupturaInFull = useMemo(() => {
    return skusRupturaInFull.reduce((acc, p) => acc + p.vendaCaixas, 0);
  }, [skusRupturaInFull]);

  const palletsRupturaInFull = useMemo(() => {
    return Math.round(skusRupturaInFull.reduce((acc, p) => acc + (p.vendaCaixas / p.qtdPallet), 0) * 10) / 10;
  }, [skusRupturaInFull]);

  // Alerta de Estoque Insuficiente (Tem saída, tem algum estoque no armazém, mas < saída necessária)
  const skusEstoqueInsuficiente = useMemo(() => {
    return activeSkusForMetrics.filter(p => p.vendaCaixas > 0 && p.estoqueTotalGeralCaixas > 0 && p.estoqueTotalGeralCaixas < p.vendaCaixas);
  }, [activeSkusForMetrics]);

  const caixasDeficitArmazem = useMemo(() => {
    return skusEstoqueInsuficiente.reduce((acc, p) => acc + (p.vendaCaixas - p.estoqueTotalGeralCaixas), 0);
  }, [skusEstoqueInsuficiente]);

  const palletsDeficitArmazem = useMemo(() => {
    return Math.round(skusEstoqueInsuficiente.reduce((acc, p) => acc + ((p.vendaCaixas - p.estoqueTotalGeralCaixas) / p.qtdPallet), 0) * 10) / 10;
  }, [skusEstoqueInsuficiente]);

  // Hourly replenishment data for charts (visão por PALLET)
  const hourlyChartData = useMemo(() => {
    // Horários diurnos (07h às 19h) com foco nos picos reais (Pico 10h, Pausa 12h-14h, Tarde 14h-16h)
    const hours = Array.from({ length: 13 }, (_, i) => i + 7); // 7 to 19
    const hourLabels: Record<number, string> = {
      7: '07h', 8: '08h', 9: '09h', 10: '10h (Pico)', 11: '11h', 12: '12h (Pausa)',
      13: '13h (Pausa)', 14: '14h', 15: '15h', 16: '16h', 17: '17h', 18: '18h', 19: '19h'
    };

    const dataPalletsMap: Record<number, number> = {};
    const dataBoxesMap: Record<number, number> = {};
    hours.forEach(h => {
      dataPalletsMap[h] = 0;
      dataBoxesMap[h] = 0;
    });

    replenishmentMap.map.forEach(val => {
      Object.entries(val.hourlyCounts).forEach(([h, count]) => {
        const hourNum = Number(h);
        if (hourNum >= 0 && hourNum <= 23) {
          const countNum = Number(count) || 0;
          const targetHour = (hourNum >= 7 && hourNum <= 19) ? hourNum : (hourNum < 7 ? 7 : 19);
          dataPalletsMap[targetHour] = (dataPalletsMap[targetHour] || 0) + countNum;
        }
      });
      if (val.hourlyBoxes) {
        Object.entries(val.hourlyBoxes).forEach(([h, boxes]) => {
          const hourNum = Number(h);
          if (hourNum >= 0 && hourNum <= 23) {
            const boxesNum = Number(boxes) || 0;
            const targetHour = (hourNum >= 7 && hourNum <= 19) ? hourNum : (hourNum < 7 ? 7 : 19);
            dataBoxesMap[targetHour] = (dataBoxesMap[targetHour] || 0) + boxesNum;
          }
        });
      }
    });

    let totalComputedPallets = Object.values(dataPalletsMap).reduce((a, b) => a + b, 0);

    // Fallback inteligente se não houver dados de tarefas na data selecionada
    if (totalComputedPallets === 0 && totalReplenishedPallets > 0) {
      // Distribuição coerente: Pico 10h (~35%), Manhã (07-11h: ~65%), Pausa 12h-14h (0%), Tarde (14-16h: ~35%)
      const weights: Record<number, number> = { 7: 0.08, 8: 0.12, 9: 0.16, 10: 0.28, 11: 0.08, 12: 0.0, 13: 0.0, 14: 0.12, 15: 0.12, 16: 0.04 };
      let allocated = 0;
      Object.entries(weights).forEach(([hStr, w]) => {
        const h = Number(hStr);
        const val = Math.round(totalReplenishedPallets * w);
        dataPalletsMap[h] = val;
        dataBoxesMap[h] = val * 100;
        allocated += val;
      });
      dataPalletsMap[10] = (dataPalletsMap[10] || 0) + (totalReplenishedPallets - allocated);
      dataBoxesMap[10] = (dataBoxesMap[10] || 0) + ((totalReplenishedPallets - allocated) * 100);
    }

    return hours.map(h => ({
      hour: hourLabels[h] || `${h}h`,
      rawHour: h,
      paletes: dataPalletsMap[h] || 0,
      caixas: dataBoxesMap[h] || ((dataPalletsMap[h] || 0) * 100)
    }));
  }, [replenishmentMap, totalReplenishedPallets]);

  const totalHourlyReplenished = useMemo(() => {
    return hourlyChartData.reduce((acc, curr) => acc + curr.paletes, 0);
  }, [hourlyChartData]);

  // Top 10 product replenishments ranked by selected metric (cx, pl, hl) and curvaFilter
  const topProductsChartData = useMemo(() => {
    return processedSkus
      .filter(p => {
        if (curvaFilter !== 'all' && (p.curvaAbc || 'B') !== curvaFilter) return false;
        return p.abastecimento > 0;
      })
      .map(p => {
        const caixas = p.abastecimento;
        const paletes = Math.round((p.abastecimento / p.qtdPallet) * 10) / 10;
        const hecto = p.abastecimentoHecto !== undefined ? Math.round(p.abastecimentoHecto * 10) / 10 : Math.round((p.abastecimento * (p.fatorHecto || 0.072)) * 10) / 10;

        let primaryValue = caixas;
        if (unitMetric === 'pl') primaryValue = paletes;
        else if (unitMetric === 'hl') primaryValue = hecto;

        return {
          sku: p.sku,
          name: p.descricao.length > 22 ? p.descricao.substring(0, 20) + '...' : p.descricao,
          fullName: p.descricao,
          curvaAbc: p.curvaAbc || 'B',
          primaryValue,
          caixas,
          paletes,
          hecto
        };
      })
      .sort((a, b) => b.primaryValue - a.primaryValue)
      .slice(0, 10);
  }, [processedSkus, unitMetric, curvaFilter]);

  // Top 10 products with highest sales (Rotina 020304) ranked by selected metric (cx, pl, hl) and curvaFilter
  const topSales10ChartData = useMemo(() => {
    return processedSkus
      .filter(p => {
        if (curvaFilter !== 'all' && (p.curvaAbc || 'B') !== curvaFilter) return false;
        return (p.vendaCaixas || 0) > 0;
      })
      .map(p => {
        const caixas = p.vendaCaixas || 0;
        const paletes = Math.round(((p.vendaCaixas || 0) / p.qtdPallet) * 10) / 10;
        const hecto = p.vendaHecto !== undefined ? Math.round(p.vendaHecto * 10) / 10 : Math.round(((p.vendaCaixas || 0) * (p.fatorHecto || 0.072)) * 10) / 10;

        let primaryValue = caixas;
        if (unitMetric === 'pl') primaryValue = paletes;
        else if (unitMetric === 'hl') primaryValue = hecto;

        return {
          sku: p.sku,
          name: p.descricao.length > 22 ? p.descricao.substring(0, 20) + '...' : p.descricao,
          fullName: p.descricao,
          curvaAbc: p.curvaAbc || 'B',
          primaryValue,
          caixas,
          paletes,
          hecto
        };
      })
      .sort((a, b) => b.primaryValue - a.primaryValue)
      .slice(0, 10);
  }, [processedSkus, unitMetric, curvaFilter]);

  // Filtered SKUs for active table
  const filteredSkus = useMemo(() => {
    return processedSkus.filter(p => {
      const matchesSearch = p.descricao.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            String(p.sku).includes(searchTerm);
      if (!matchesSearch) return false;

      if (curvaFilter !== 'all' && (p.curvaAbc || 'B') !== curvaFilter) return false;

      if (statusFilter === 'suficiente_picking' && !(p.vendaCaixas > 0 && p.saldoPicking >= 0)) return false;
      if (statusFilter === 'carregar_pulmao' && !(p.vendaCaixas > 0 && (p.carregarPulmaoCaixas || 0) > 0)) return false;
      if (statusFilter === 'carregar_central' && !(p.vendaCaixas > 0 && (p.carregarCentralCaixas || 0) > 0)) return false;
      if (statusFilter === 'carregar_marketplace' && !(p.vendaCaixas > 0 && (p.carregarMarketplaceCaixas || 0) > 0)) return false;
      if (statusFilter === 'carregar_contingencia' && !(p.vendaCaixas > 0 && (p.carregarContingenciaCaixas || 0) > 0)) return false;
      if (statusFilter === 'reabastecer_picking' && !(p.vendaCaixas > 0 && (p.reabastecerPickingCaixas || 0) > 0)) return false;
      if (statusFilter === 'ok' && p.status !== 'ok') return false;
      if (statusFilter === 'attention' && p.status !== 'attention') return false;
      if (statusFilter === 'critical' && p.status !== 'critical') return false;
      if (statusFilter === 'night_need' && p.necessidadeNoturna === 0) return false;
      if (statusFilter === 'no_picking_sales' && !(p.estoqueInicialCaixas === 0 && p.vendaCaixas > 0)) return false;
      if (statusFilter === 'total_rupture' && !(p.estoqueTotalDisponivel === 0 && p.vendaCaixas > 0)) return false;
      if (statusFilter === 'ruptura_in_full' && !(p.vendaCaixas > 0 && p.estoqueTotalGeralCaixas === 0)) return false;
      if (statusFilter === 'estoque_insuficiente' && !(p.vendaCaixas > 0 && p.estoqueTotalGeralCaixas > 0 && p.estoqueTotalGeralCaixas < p.vendaCaixas)) return false;

      if (showOnlyWithSales && p.vendaCaixas === 0 && p.abastecimento === 0) return false;

      return true;
    });
  }, [processedSkus, searchTerm, statusFilter, showOnlyWithSales, curvaFilter]);

  // Export to Excel handler
  const handleExportExcel = () => {
    const dataToExport = filteredSkus.map(item => ({
      "SKU": item.sku,
      "Descrição": item.descricao,
      "Embalagem": item.embalagem,
      "Unidade": item.unidade,
      "Qtd/Palete": item.qtdPallet,
      "Estoque Inicial (Caixas) - Rotina 021101": item.estoqueInicialCaixas,
      "Abastecido (Caixas) - Shift Diurno": item.abastecimento,
      "Estoque Total Disp. (Caixas)": item.estoqueTotalDisponivel,
      "Pallets no Picking": item.palletsNoPicking,
      "Vendas (Caixas) - Rotina 020304": item.vendaCaixas,
      "Pallets Venda Total": item.palletsVendaTotal,
      "Pallets Fechados Central": item.palletsFechadosVenda,
      "Saldo Final (Caixas)": item.saldoPicking,
      "Análise Montagem": item.acaoMontagemTexto,
      "Necessidade Noturna (Caixas)": item.necessidadeNoturna,
      "Necessidade Noturna (Paletes)": item.necessidadeNoturnaPaletes,
      "Status": item.status === 'ok' ? '🟢 OK' : item.status === 'attention' ? '🟡 ATENÇÃO' : '🔴 CRÍTICO'
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Abastecimento");
    XLSX.writeFile(wb, `Ambev_Analise_Abastecimento_Diario_${selectedAnalysisDate}.xlsx`);
    showToast("Planilha Excel exportada com sucesso!", "success");
  };

  // Export only night replenishment items
  const handleExportNightExcel = () => {
    const nightItems = processedSkus.filter(p => p.necessidadeNoturna > 0);
    if (nightItems.length === 0) {
      showToast("Não há necessidade de abastecimento noturno para exportar!", "error");
      return;
    }
    const dataToExport = nightItems.map(item => ({
      "SKU": item.sku,
      "Descrição": item.descricao,
      "Embalagem": item.embalagem,
      "Unidade": item.unidade,
      "Qtd/Palete": item.qtdPallet,
      "Saldo Atual Picking": item.saldoPicking,
      "Necessidade Noturna (Caixas)": item.necessidadeNoturna,
      "Necessidade Noturna (Paletes)": item.necessidadeNoturnaPaletes,
      "Estratégia": nightStrategy === 'repor_vendas' ? 'Repor Vendas' : nightStrategy === 'completar_1pl' ? 'Completar 1 Palete' : nightStrategy === 'completar_2pl' ? 'Completar 2 Paletes' : 'Sanar Déficit'
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Abastecimento_Noturno");
    XLSX.writeFile(wb, `Ambev_Necessidade_Abastecimento_Noturno_${selectedAnalysisDate}.xlsx`);
    showToast("Planilha de Abastecimento Noturno exportada com sucesso!", "success");
  };

  // Save active analysis to Firestore
  const handleSaveAnalysis = async () => {
    if (!empresa?.id) {
      showToast("Por favor, selecione uma empresa para salvar.", "error");
      return;
    }
    setSaving(true);
    try {
      const allRows = await abastecimentoAnaliseRepo.getAll(empresa.id);
      const matching = allRows.filter((r: any) => r.dataAnalise === selectedAnalysisDate);
      
      const analysisDoc = {
        empresaId: empresa.id,
        dataAnalise: selectedAnalysisDate,
        usuarioEmail: user?.email || 'default',
        usuarioNome: user?.nome || user?.email || 'default',
        createdAt: new Date().toISOString(),
        fileName021101: fileName021101 || '',
        fileName020304: fileName020304 || '',
        imported021101Files: imported021101Files || [],
        totals: {
          totalInitialBoxes,
          totalReplenishedBoxes,
          totalSalesBoxes,
          totalCurrentBalanceBoxes,
          statusCounts
        },
        productDetails: processedSkus.map(p => ({
          sku: p.sku,
          descricao: p.descricao,
          unidade: p.unidade,
          embalagem: p.embalagem,
          qtdPallet: p.qtdPallet,
          estoqueInicialCaixas: p.estoqueInicialCaixas,
          estoquePicking: p.estoquePicking,
          estoqueCentral: p.estoqueCentral,
          estoqueMarketplace: p.estoqueMarketplace,
          estoquePulmao: p.estoquePulmao,
          estoqueContingencia: p.estoqueContingencia,
          vendaCaixas: p.vendaCaixas,
          abastecimento: p.abastecimento,
          abastecimentoPaletes: p.abastecimentoPaletes,
          saldoPicking: p.saldoPicking,
          status: p.status
        }))
      };

      for (const d of matching) {
        const idToDelete = d._docId || d.id;
        if (idToDelete) {
          await abastecimentoAnaliseRepo.delete(idToDelete, empresa.id);
        }
      }
      
      const created = await abastecimentoAnaliseRepo.create(analysisDoc, empresa.id);
      showToast(`Análise para o dia ${selectedAnalysisDate} salva e registrada com sucesso!`, "success");
      
      // Update local storage draft to match saved doc
      saveLocalDraft(productsList, customProductData, imported021101Files, fileName021101, fileName020304);

      // Sync history lists
      await fetchHistory();
      setIsHistoricalLoaded(true);
      setLoadedHistoryMeta({
        id: created?.id || created?._docId,
        savedBy: user?.nome || user?.email || 'Sistema',
        savedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Erro ao salvar análise:", error);
      showToast("Não foi possível salvar a análise diária.", "error");
    } finally {
      setSaving(false);
    }
  };

  // Delete saved document
  const handleDeleteAnalysis = async (id: string, dateStr: string) => {
    try {
      await abastecimentoAnaliseRepo.delete(id, empresa?.id);
      clearLocalDraft(empresa?.id || '', dateStr);
      showToast(`Análise salva do dia ${dateStr} excluída com sucesso.`, "success");
      await fetchHistory();
      if (selectedAnalysisDate === dateStr) {
        await loadAnalysisForDate(selectedAnalysisDate);
      }
    } catch (error) {
      console.error("Erro ao excluir documento:", error);
      showToast("Erro ao excluir do histórico.", "error");
    }
  };

  // Helper to parse Area from imported files (021101)
  // In 02.11.01, Column B is the Area of Counting:
  // 1: Central, 2: Picking, 3: Marketplace, 4: Contingência, 5: Pulmão, 6: PNC
  const parseAreaFromRow = (cell0: any, cell1: any): 1 | 2 | 3 | 4 | 5 | 6 => {
    // 1. Inspect Column B (cell1) first as the designated area column
    const str1 = String(cell1 ?? '').toLowerCase().trim();
    if (str1) {
      const areaDigitsMatch1 = str1.match(/\b(0?[1-6])\b/) || str1.match(/^(0?[1-6])$/);
      const num1 = areaDigitsMatch1 ? parseInt(areaDigitsMatch1[1], 10) : NaN;

      if (num1 === 1 || str1 === '1' || str1 === '01' || str1.includes('central') || str1.includes('deposito central') || str1.includes('armazem central')) return 1;
      if (num1 === 2 || str1 === '2' || str1 === '02' || str1.includes('picking') || str1.includes('pick')) return 2;
      if (num1 === 3 || str1 === '3' || str1 === '03' || str1.includes('marketplace') || str1.includes('mkp') || str1.includes('mkt')) return 3;
      if (num1 === 4 || str1 === '4' || str1 === '04' || str1.includes('contingencia') || str1.includes('contingência') || str1.includes('reserva')) return 4;
      if (num1 === 5 || str1 === '5' || str1 === '05' || str1.includes('pulmao') || str1.includes('pulmão')) return 5;
      if (num1 === 6 || str1 === '6' || str1 === '06' || str1.includes('pnc') || str1.includes('nao conforme') || str1.includes('não conforme') || str1.includes('avaria')) return 6;
    }

    // 2. Fallback to Column A (cell0) if cell1 is empty or text-only without area numbers
    const str0 = String(cell0 ?? '').toLowerCase().trim();
    if (str0) {
      const areaDigitsMatch0 = str0.match(/\b(0?[1-6])\b/) || str0.match(/^(0?[1-6])$/);
      const num0 = areaDigitsMatch0 ? parseInt(areaDigitsMatch0[1], 10) : NaN;

      if (num0 === 1 || str0 === '1' || str0 === '01' || str0.includes('central') || str0.includes('armazem central')) return 1;
      if (num0 === 2 || str0 === '2' || str0 === '02' || str0.includes('picking') || str0.includes('pick')) return 2;
      if (num0 === 3 || str0 === '3' || str0 === '03' || str0.includes('marketplace') || str0.includes('mkp') || str0.includes('mkt')) return 3;
      if (num0 === 4 || str0 === '4' || str0 === '04' || str0.includes('contingencia') || str0.includes('contingência')) return 4;
      if (num0 === 5 || str0 === '5' || str0 === '05' || str0.includes('pulmao') || str0.includes('pulmão')) return 5;
      if (num0 === 6 || str0 === '6' || str0 === '06' || str0.includes('pnc') || str0.includes('avaria')) return 6;
    }

    return 2; // Default fallback to Area 2 (Picking)
  };

  // Form value updater for all warehouse areas
  const handleUpdateValue = (
    sku: number, 
    field: 'estoqueInicialCaixas' | 'estoquePicking' | 'estoqueCentral' | 'estoqueMarketplace' | 'estoquePulmao' | 'estoqueContingencia' | 'estoquePNC' | 'vendaCaixas', 
    value: number
  ) => {
    const val = isNaN(value) ? 0 : Math.max(0, value);
    setCustomProductData(prev => {
      const current = prev[sku] || { 
        estoqueInicialCaixas: 0, 
        estoquePicking: 0, 
        estoqueCentral: 0, 
        estoqueMarketplace: 0, 
        estoquePulmao: 0,
        estoqueContingencia: 0,
        estoquePNC: 0,
        vendaCaixas: 0 
      };
      const updated = {
        ...current,
        [field]: val
      };
      if (field === 'estoqueInicialCaixas') {
        updated.estoquePicking = val;
      } else if (field === 'estoquePicking') {
        updated.estoqueInicialCaixas = val;
      }
      return {
        ...prev,
        [sku]: updated
      };
    });
  };

  // Reset fields utilities
  const handleResetSales = () => {
    setCustomProductData(prev => {
      const updated = { ...prev };
      productsList.forEach(p => {
        const current = updated[p.sku] || { 
          estoqueInicialCaixas: p.estoqueInicialCaixas, 
          estoquePicking: p.estoquePicking || p.estoqueInicialCaixas,
          estoqueCentral: p.estoqueCentral || 0,
          estoqueMarketplace: p.estoqueMarketplace || 0,
          estoquePulmao: p.estoquePulmao || 0,
          estoqueContingencia: p.estoqueContingencia || 0,
          vendaCaixas: p.vendaCaixas 
        };
        updated[p.sku] = { ...current, vendaCaixas: 0 };
      });
      saveLocalDraft(productsList, updated, imported021101Files, fileName021101, fileName020304);
      return updated;
    });
    showToast("Saídas diárias (020304) zeradas para edição!", "success");
  };

  const handleResetInitial = () => {
    setCustomProductData(prev => {
      const updated = { ...prev };
      productsList.forEach(p => {
        const current = updated[p.sku] || { 
          estoqueInicialCaixas: p.estoqueInicialCaixas, 
          estoquePicking: p.estoquePicking || p.estoqueInicialCaixas,
          estoqueCentral: p.estoqueCentral || 0,
          estoqueMarketplace: p.estoqueMarketplace || 0,
          estoquePulmao: p.estoquePulmao || 0,
          estoqueContingencia: p.estoqueContingencia || 0,
          vendaCaixas: p.vendaCaixas 
        };
        updated[p.sku] = { 
          ...current, 
          estoqueInicialCaixas: 0,
          estoquePicking: 0
        };
      });
      saveLocalDraft(productsList, updated, imported021101Files, fileName021101, fileName020304);
      return updated;
    });
    showToast("Contagens iniciais do Picking (Área 2) zeradas para edição!", "success");
  };

  const handleRestoreDefaults = () => {
    const initial: Record<number, { 
      estoqueInicialCaixas: number; 
      estoquePicking?: number;
      estoqueCentral?: number; 
      estoqueMarketplace?: number; 
      estoquePulmao?: number;
      estoqueContingencia?: number;
      vendaCaixas: number;
    }> = {};
    const enrichedList = ABASTECIMENTO_PRODUCTS_DATA.map(p => {
      const official = getOfficialProductInfo(p.sku, p.descricao);
      const pickingStock = p.estoquePicking !== undefined ? p.estoquePicking : p.estoqueInicialCaixas;
      const centralStock = p.estoqueCentral !== undefined ? p.estoqueCentral : 0;
      const mkpStock = p.estoqueMarketplace !== undefined ? p.estoqueMarketplace : 0;
      const pulmaoStock = p.estoquePulmao !== undefined ? p.estoquePulmao : 0;
      const contStock = p.estoqueContingencia !== undefined ? p.estoqueContingencia : 0;

      initial[p.sku] = {
        estoqueInicialCaixas: pickingStock,
        estoquePicking: pickingStock,
        estoqueCentral: centralStock,
        estoqueMarketplace: mkpStock,
        estoquePulmao: pulmaoStock,
        estoqueContingencia: contStock,
        vendaCaixas: p.vendaCaixas
      };

      return {
        ...p,
        descricao: official.descricao,
        embalagem: official.embalagem,
        qtdPallet: official.qtdPallet,
        estoqueInicialCaixas: pickingStock,
        estoquePicking: pickingStock,
        estoqueCentral: centralStock,
        estoqueMarketplace: mkpStock,
        estoquePulmao: pulmaoStock,
        estoqueContingencia: contStock
      };
    });

    setProductsList(enrichedList);
    setCustomProductData(initial);
    setImported021101Files([]);
    setFileName021101('');
    setFileName020304('');
    clearLocalDraft(empresa?.id || '', selectedAnalysisDate);
    showToast("Valores padrões e cadastros mestres restaurados!", "success");
  };

  const apply021101Files = (filesList: Imported021101File[]) => {
    if (filesList.length === 0) {
      setFileName021101('');
      const updatedProducts = productsList.map(p => ({
        ...p,
        estoqueInicialCaixas: 0,
        estoquePicking: 0,
        estoqueCentral: 0,
        estoqueMarketplace: 0,
        estoquePulmao: 0,
        estoqueContingencia: 0
      }));
      setProductsList(updatedProducts);

      const updatedCustom: Record<number, any> = { ...customProductData };
      Object.keys(updatedCustom).forEach(skuStr => {
        const skuNum = Number(skuStr);
        updatedCustom[skuNum] = {
          ...updatedCustom[skuNum],
          estoqueInicialCaixas: 0,
          estoquePicking: 0,
          estoqueCentral: 0,
          estoqueMarketplace: 0,
          estoquePulmao: 0,
          estoqueContingencia: 0
        };
      });
      setCustomProductData(updatedCustom);
      saveLocalDraft(updatedProducts, updatedCustom, [], '', fileName020304);
      return;
    }

    // Chronological merge: later files overwrite only the SKUs contained within them
    const mergedSkuMap = new Map<number, {
      sku: number;
      descricao: string;
      embalagem: number;
      unidade: string;
      qtdPallet: number;
      estoquePicking: number;
      estoqueCentral: number;
      estoqueMarketplace: number;
      estoquePulmao: number;
      estoqueContingencia: number;
    }>();

    filesList.forEach(fileEntry => {
      fileEntry.data.forEach(item => {
        mergedSkuMap.set(item.sku, item);
      });
    });

    const mergedItems = Array.from(mergedSkuMap.values());
    const newFileName021101 = filesList.length === 1 
      ? filesList[0].name 
      : `${filesList.length} arquivos 02.11.01 importados`;

    setFileName021101(newFileName021101);

    let nextProductsList: BaseSkuData[] = [];
    setProductsList(prevProducts => {
      const updatedProducts = prevProducts.map(p => {
        const merged = mergedSkuMap.get(p.sku);
        if (merged) {
          return {
            ...p,
            descricao: merged.descricao || p.descricao,
            embalagem: merged.embalagem || p.embalagem,
            unidade: merged.unidade || p.unidade,
            qtdPallet: merged.qtdPallet || p.qtdPallet,
            estoquePicking: merged.estoquePicking,
            estoqueCentral: merged.estoqueCentral,
            estoqueMarketplace: merged.estoqueMarketplace,
            estoquePulmao: merged.estoquePulmao,
            estoqueContingencia: merged.estoqueContingencia,
            estoqueInicialCaixas: merged.estoquePicking,
          };
        }
        return {
          ...p,
          estoquePicking: 0,
          estoqueCentral: 0,
          estoqueMarketplace: 0,
          estoquePulmao: 0,
          estoqueContingencia: 0,
          estoqueInicialCaixas: 0,
        };
      });

      mergedItems.forEach(item => {
        const exists = updatedProducts.some(p => p.sku === item.sku);
        if (!exists) {
          const official = getOfficialProductInfo(item.sku, item.descricao);
          updatedProducts.push({
            sku: item.sku,
            descricao: official.descricao,
            unidade: item.unidade || official.unidade,
            embalagem: item.embalagem || official.embalagem,
            qtdPallet: item.qtdPallet || official.qtdPallet,
            estoqueInicialCaixas: item.estoquePicking,
            estoquePicking: item.estoquePicking,
            estoqueCentral: item.estoqueCentral,
            estoqueMarketplace: item.estoqueMarketplace,
            estoquePulmao: item.estoquePulmao,
            estoqueContingencia: item.estoqueContingencia,
            vendaCaixas: 0
          });
        }
      });

      nextProductsList = updatedProducts;
      return updatedProducts;
    });

    setCustomProductData(prevCustom => {
      const updatedCustom = { ...prevCustom };
      Object.keys(updatedCustom).forEach(skuStr => {
        const skuNum = Number(skuStr);
        updatedCustom[skuNum] = {
          ...updatedCustom[skuNum],
          estoqueInicialCaixas: 0,
          estoquePicking: 0,
          estoqueCentral: 0,
          estoqueMarketplace: 0,
          estoquePulmao: 0,
          estoqueContingencia: 0
        };
      });

      mergedItems.forEach(item => {
        updatedCustom[item.sku] = {
          estoqueInicialCaixas: item.estoquePicking,
          estoquePicking: item.estoquePicking,
          estoqueCentral: item.estoqueCentral,
          estoqueMarketplace: item.estoqueMarketplace,
          estoquePulmao: item.estoquePulmao,
          estoqueContingencia: item.estoqueContingencia,
          vendaCaixas: prevCustom[item.sku]?.vendaCaixas || 0
        };
      });

      saveLocalDraft(nextProductsList.length > 0 ? nextProductsList : productsList, updatedCustom, filesList, newFileName021101, fileName020304);
      return updatedCustom;
    });
  };

  const handleDelete021101File = (fileId: string) => {
    const fileToRemove = imported021101Files.find(f => f.id === fileId);
    const nextFiles = imported021101Files.filter(f => f.id !== fileId);
    setImported021101Files(nextFiles);
    apply021101Files(nextFiles);
    showToast(`Arquivo "${fileToRemove?.name || '02.11.01'}" excluído e estoque recalculado!`, "success");
  };

  const handleClear021101 = () => {
    setImported021101Files([]);
    setFileName021101('');
    apply021101Files([]);
    showToast("Todos os arquivos 02.11.01 foram excluídos e os estoques zerados.", "success");
  };

  const handleClear020304 = () => {
    setFileName020304('');
    setCustomProductData(prev => {
      const updated = { ...prev };
      productsList.forEach(p => {
        const current = updated[p.sku] || { 
          estoqueInicialCaixas: p.estoqueInicialCaixas, 
          estoquePicking: p.estoquePicking || p.estoqueInicialCaixas,
          estoqueCentral: p.estoqueCentral || 0,
          estoqueMarketplace: p.estoqueMarketplace || 0,
          estoquePulmao: p.estoquePulmao || 0,
          estoqueContingencia: p.estoqueContingencia || 0,
          vendaCaixas: p.vendaCaixas 
        };
        updated[p.sku] = { ...current, vendaCaixas: 0 };
      });
      saveLocalDraft(productsList, updated, imported021101Files, fileName021101, '');
      return updated;
    });
    showToast("Arquivo de Saídas/Vendas desvinculado e valores zerados.", "success");
  };

  const handleImport021101 = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting021101(true);

    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (isExcel) {
      const xlsxReader = new FileReader();
      xlsxReader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });

          const skuMap = new Map<number, {
            sku: number;
            descricao: string;
            embalagem: number;
            unidade: string;
            qtdPallet: number;
            estoquePicking: number;
            estoqueCentral: number;
            estoqueMarketplace: number;
            estoquePulmao: number;
            estoqueContingencia: number;
            estoquePNC?: number;
          }>();

          let totalPicking = 0;
          let totalCentral = 0;
          let totalMkp = 0;
          let totalPulmao = 0;
          let totalContingencia = 0;
          let totalPNC = 0;

          // Helper to parse numbers safely with Portuguese formatting (e.g. 1.250 or 50,0)
          const parseNumSafely = (val: any): number => {
            if (val === undefined || val === null || val === '') return 0;
            if (typeof val === 'number') return Math.round(val);
            const str = String(val).trim();
            if (!str) return 0;
            const cleaned = str.replace(/\s/g, '');
            if (cleaned.includes(',') && cleaned.includes('.')) {
              return Math.round(parseFloat(cleaned.replace(/\./g, '').replace(',', '.'))) || 0;
            }
            if (cleaned.includes(',')) {
              return Math.round(parseFloat(cleaned.replace(',', '.'))) || 0;
            }
            return Math.round(parseFloat(cleaned.replace(/\./g, ''))) || 0;
          };

          for (let i = 0; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row || row.length < 3) continue;

            // Skip header row
            if (i === 0) {
              const rowStr = row.map((c: any) => String(c || '').toLowerCase()).join(' ');
              if (rowStr.includes('produto') || rowStr.includes('código') || rowStr.includes('codigo') || rowStr.includes('deposito') || rowStr.includes('área') || rowStr.includes('area')) {
                continue;
              }
            }

            // Coluna B (index 1) is the Area
            const area = parseAreaFromRow(row[0], row[1]);

            // Coluna C (index 2) is SKU Code
            const rawSkuStr = String(row[2] || '').trim();
            const skuVal = parseInt(rawSkuStr.replace(/\D/g, ''), 10);
            if (isNaN(skuVal) || skuVal <= 0) continue;

            const rawDesc = String(row[3] || '').trim();
            const embVal = parseNumSafely(row[4]) || 1;
            const uniVal = String(row[5] || 'cx').trim();
            const palVal = parseNumSafely(row[7]) || 100;
            
            // Coluna J (index 9) is physical boxes count / SKU Total
            let qtyVal = 0;
            if (row.length > 9 && row[9] !== undefined && row[9] !== null && row[9] !== '') {
              qtyVal = parseNumSafely(row[9]);
            } else if (row.length > 8 && row[8] !== undefined && row[8] !== null && row[8] !== '') {
              qtyVal = parseNumSafely(row[8]);
            } else if (row.length > 7 && row[7] !== undefined && row[7] !== null && row[7] !== '') {
              qtyVal = parseNumSafely(row[7]);
            }

            if (!isNaN(skuVal) && skuVal > 0) {
              const official = getOfficialProductInfo(skuVal, rawDesc);
              let item = skuMap.get(skuVal);
              if (!item) {
                item = {
                  sku: skuVal,
                  descricao: official.descricao,
                  embalagem: embVal || official.embalagem,
                  unidade: uniVal || official.unidade,
                  qtdPallet: palVal || official.qtdPallet,
                  estoquePicking: 0,
                  estoqueCentral: 0,
                  estoqueMarketplace: 0,
                  estoquePulmao: 0,
                  estoqueContingencia: 0,
                  estoquePNC: 0,
                };
                skuMap.set(skuVal, item);
              }

              if (area === 1) {
                item.estoqueCentral += qtyVal;
                totalCentral += qtyVal;
              } else if (area === 2) {
                item.estoquePicking += qtyVal;
                totalPicking += qtyVal;
              } else if (area === 3) {
                item.estoqueMarketplace += qtyVal;
                totalMkp += qtyVal;
              } else if (area === 4) {
                item.estoqueContingencia += qtyVal;
                totalContingencia += qtyVal;
              } else if (area === 5) {
                item.estoquePulmao += qtyVal;
                totalPulmao += qtyVal;
              } else if (area === 6) {
                item.estoquePNC = (item.estoquePNC || 0) + qtyVal;
                totalPNC += qtyVal;
              }
            }
          }

          const importedItems = Array.from(skuMap.values());

          if (importedItems.length === 0) {
            showToast("Nenhum código de produto (SKU) válido encontrado na planilha 021101.", "error");
            setImporting021101(false);
            return;
          }

          const totalBoxes = totalPicking + totalCentral + totalMkp + totalPulmao + totalContingencia + totalPNC;
          const newFileEntry: Imported021101File = {
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            name: file.name,
            timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            skuCount: importedItems.length,
            pickingBoxes: totalPicking,
            totalBoxes,
            data: importedItems
          };

          const nextFiles = [...imported021101Files, newFileEntry];
          setImported021101Files(nextFiles);
          apply021101Files(nextFiles);

          // Sincroniza também com o painel de Capacidade do Armazém
          try {
            const csvText = XLSX.utils.sheet_to_csv(worksheet, { FS: ';' });
            processPosicaoPallet021101Import(csvText, file.name, 'Operador', 'demo', false);
          } catch (syncErr) {
            console.error('Erro ao sincronizar com capacidade de armazém:', syncErr);
          }

          showToast(`021101 "${file.name}" importada com sucesso! (${importedItems.length} SKUs nas áreas 1 a 6).`, "success");
        } catch (err) {
          console.error("Erro ao ler planilha Excel 021101:", err);
          showToast("Erro ao processar planilha Excel da rotina 021101.", "error");
        } finally {
          setImporting021101(false);
          event.target.value = '';
        }
      };
      xlsxReader.readAsArrayBuffer(file);
      return;
    }

    // Text / CSV parsing
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) {
          showToast("O arquivo está vazio.", "error");
          setImporting021101(false);
          return;
        }

        const lines = text.split('\n');
        const skuMap = new Map<number, {
          sku: number;
          descricao: string;
          embalagem: number;
          unidade: string;
          qtdPallet: number;
          estoquePicking: number;
          estoqueCentral: number;
          estoqueMarketplace: number;
          estoquePulmao: number;
          estoqueContingencia: number;
          estoquePNC?: number;
        }>();

        let totalPicking = 0;
        let totalCentral = 0;
        let totalMkp = 0;
        let totalPulmao = 0;
        let totalContingencia = 0;
        let totalPNC = 0;

        const parseNumSafely = (val: any): number => {
          if (val === undefined || val === null || val === '') return 0;
          if (typeof val === 'number') return Math.round(val);
          const str = String(val).trim();
          if (!str) return 0;
          const cleaned = str.replace(/\s/g, '');
          if (cleaned.includes(',') && cleaned.includes('.')) {
            return Math.round(parseFloat(cleaned.replace(/\./g, '').replace(',', '.'))) || 0;
          }
          if (cleaned.includes(',')) {
            return Math.round(parseFloat(cleaned.replace(',', '.'))) || 0;
          }
          return Math.round(parseFloat(cleaned.replace(/\./g, ''))) || 0;
        };

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          if (i === 0 && (line.toLowerCase().includes('deposito') || line.toLowerCase().includes('produto') || line.toLowerCase().includes('descricao') || line.toLowerCase().includes('area') || line.toLowerCase().includes('área'))) {
            continue;
          }

          let delimiter = ';';
          if (line.includes(';')) delimiter = ';';
          else if (line.includes('\t')) delimiter = '\t';
          else if (line.includes(',')) delimiter = ',';

          const parts = line.split(delimiter).map(p => p.trim().replace(/^"|"$/g, ''));
          if (parts.length < 3) continue;

          const area = parseAreaFromRow(parts[0], parts[1]);
          const skuRaw = parts[2]?.replace(/\D/g, '');
          if (!skuRaw) continue;

          const sku = parseInt(skuRaw, 10);
          if (isNaN(sku) || sku <= 0) continue;

          const descVal = parts[3]?.trim() || '';
          const emb = parseNumSafely(parts[4]) || 1;
          const uniVal = parts[5]?.trim() || 'cx';
          const pal = parseNumSafely(parts[7]) || 100;
          
          let qty = 0;
          if (parts.length > 9 && parts[9] !== '') {
            qty = parseNumSafely(parts[9]);
          } else if (parts.length > 8 && parts[8] !== '') {
            qty = parseNumSafely(parts[8]);
          } else if (parts.length > 7 && parts[7] !== '') {
            qty = parseNumSafely(parts[7]);
          }

          if (!isNaN(sku) && sku > 0) {
            const official = getOfficialProductInfo(sku, descVal);
            let item = skuMap.get(sku);
            if (!item) {
              item = {
                sku,
                descricao: official.descricao,
                embalagem: emb || official.embalagem,
                unidade: uniVal || official.unidade,
                qtdPallet: pal || official.qtdPallet,
                estoquePicking: 0,
                estoqueCentral: 0,
                estoqueMarketplace: 0,
                estoquePulmao: 0,
                estoqueContingencia: 0,
                estoquePNC: 0,
              };
              skuMap.set(sku, item);
            }

            if (area === 1) {
              item.estoqueCentral += qty;
              totalCentral += qty;
            } else if (area === 2) {
              item.estoquePicking += qty;
              totalPicking += qty;
            } else if (area === 3) {
              item.estoqueMarketplace += qty;
              totalMkp += qty;
            } else if (area === 4) {
              item.estoqueContingencia += qty;
              totalContingencia += qty;
            } else if (area === 5) {
              item.estoquePulmao += qty;
              totalPulmao += qty;
            } else if (area === 6) {
              item.estoquePNC = (item.estoquePNC || 0) + qty;
              totalPNC += qty;
            }
          }
        }

        const importedItems = Array.from(skuMap.values());

        if (importedItems.length === 0) {
          showToast("Nenhum código de produto válido encontrado no arquivo 021101.", "error");
          setImporting021101(false);
          return;
        }

        const totalBoxes = totalPicking + totalCentral + totalMkp + totalPulmao + totalContingencia + totalPNC;
        const newFileEntry: Imported021101File = {
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          skuCount: importedItems.length,
          pickingBoxes: totalPicking,
          totalBoxes,
          data: importedItems
        };

        const nextFiles = [...imported021101Files, newFileEntry];
        setImported021101Files(nextFiles);
        apply021101Files(nextFiles);

        // Sincroniza também com o painel de Capacidade do Armazém
        try {
          processPosicaoPallet021101Import(text, file.name, 'Operador', 'demo', false);
        } catch (syncErr) {
          console.error('Erro ao sincronizar com capacidade de armazém:', syncErr);
        }

        showToast(`021101 "${file.name}" importada com sucesso! (${importedItems.length} SKUs nas áreas 1 a 6).`, "success");
      } catch (err) {
        console.error("Erro ao ler arquivo 021101:", err);
        showToast("Erro ao processar o arquivo de importação 021101.", "error");
      } finally {
        setImporting021101(false);
        event.target.value = '';
      }
    };

    reader.onerror = () => {
      showToast("Erro ao ler o arquivo físico 021101.", "error");
      setImporting021101(false);
    };

    reader.readAsText(file, 'utf-8');
  };

  const handleImport020304 = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting020304(true);
    setFileName020304(file.name);

    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (isExcel) {
      const xlsxReader = new FileReader();
      xlsxReader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });

          const importedItems: Array<{ sku: number; descricao: string; unidade: string; vendaCaixas: number }> = [];
          let totalSales = 0;

          for (let i = 0; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row || row.length < 4) continue;

            if (i === 0) {
              const cellB = String(row[1] || '').toLowerCase();
              if (cellB.includes('cod') || cellB.includes('produto') || cellB.includes('grade')) {
                continue;
              }
            }

            const skuVal = parseInt(String(row[1] || '').trim(), 10);
            const descVal = String(row[2] || '').trim();
            const uniVal = String(row[3] || 'cx').trim();
            const qtyVal = parseInt(String(row[9] || row[8] || '').trim().replace(/\s/g, '').replace(/\./g, ''), 10);

            if (!isNaN(skuVal) && !isNaN(qtyVal)) {
              const official = getOfficialProductInfo(skuVal, descVal);
              importedItems.push({
                sku: skuVal,
                descricao: official.descricao,
                unidade: uniVal || official.unidade,
                vendaCaixas: qtyVal
              });
              totalSales += qtyVal;
            }
          }

          if (importedItems.length === 0) {
            showToast("Nenhum código de produto (SKU) válido encontrado nas colunas da planilha 020304.", "error");
            setImporting020304(false);
            return;
          }

          merge020304Data(importedItems);
          showToast(`020304 Importada! ${importedItems.length} SKUs com saídas/vendas totalizando ${totalSales.toLocaleString()} caixas.`, "success");
        } catch (err) {
          console.error("Erro ao ler planilha Excel 020304:", err);
          showToast("Erro ao processar planilha Excel da rotina 020304.", "error");
        } finally {
          setImporting020304(false);
          event.target.value = '';
        }
      };
      xlsxReader.readAsArrayBuffer(file);
      return;
    }

    // Default: text / csv parsing
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) {
          showToast("O arquivo está vazio.", "error");
          setImporting020304(false);
          return;
        }

        const lines = text.split('\n');
        const importedItems: Array<{ sku: number; descricao: string; unidade: string; vendaCaixas: number }> = [];
        let totalSales = 0;

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          if (i === 0 && (line.toLowerCase().includes('grade') || line.toLowerCase().includes('cod') || line.toLowerCase().includes('saidas'))) {
            continue;
          }

          let delimiter = ';';
          if (line.includes(';')) delimiter = ';';
          else if (line.includes(',')) delimiter = ',';
          else if (line.includes('\t')) delimiter = '\t';

          const parts = line.split(delimiter);
          if (parts.length < 4) continue;

          const skuRaw = parts[1]?.trim();
          const descVal = parts[2]?.trim() || '';
          const uniVal = parts[3]?.trim() || 'cx';
          const qtyRaw = parts[9]?.trim() || parts[8]?.trim();

          if (!skuRaw || !qtyRaw) continue;

          const sku = parseInt(skuRaw, 10);
          const cleanQty = qtyRaw.replace(/\s/g, '').replace(/\./g, '');
          const qty = parseInt(cleanQty, 10);

          if (!isNaN(sku) && !isNaN(qty)) {
            const official = getOfficialProductInfo(sku, descVal);
            importedItems.push({
              sku,
              descricao: official.descricao,
              unidade: uniVal || official.unidade,
              vendaCaixas: qty
            });
            totalSales += qty;
          }
        }

        if (importedItems.length === 0) {
          showToast("Nenhum código de produto ou quantidade válidos encontrados na Rotina 020304.", "error");
          setImporting020304(false);
          return;
        }

        merge020304Data(importedItems);
        showToast(`020304 Importada! ${importedItems.length} SKUs com saídas/vendas totalizando ${totalSales.toLocaleString()} caixas.`, "success");
      } catch (err) {
        console.error("Erro ao ler arquivo 020304:", err);
        showToast("Erro ao processar o arquivo de importação 020304.", "error");
      } finally {
        setImporting020304(false);
        event.target.value = '';
      }
    };

    reader.onerror = () => {
      showToast("Erro ao ler o arquivo físico 020304.", "error");
      setImporting020304(false);
    };

    reader.readAsText(file, 'utf-8');
  };

  const merge020304Data = (importedItems: Array<{ sku: number; descricao: string; unidade?: string; vendaCaixas: number }>) => {
    let nextProductsList: BaseSkuData[] = [];
    setProductsList(prevProducts => {
      const updatedProducts = [...prevProducts];
      importedItems.forEach(item => {
        const official = getOfficialProductInfo(item.sku, item.descricao);
        const existingIdx = updatedProducts.findIndex(p => p.sku === item.sku);
        if (existingIdx !== -1) {
          updatedProducts[existingIdx] = {
            ...updatedProducts[existingIdx],
            descricao: official.descricao,
            unidade: item.unidade || official.unidade || updatedProducts[existingIdx].unidade,
            vendaCaixas: item.vendaCaixas
          };
        } else {
          updatedProducts.push({
            sku: item.sku,
            descricao: official.descricao,
            unidade: item.unidade || official.unidade || 'cx',
            embalagem: official.embalagem || 1,
            qtdPallet: official.qtdPallet || 100,
            estoqueInicialCaixas: 0,
            estoquePicking: 0,
            estoqueCentral: 0,
            estoqueMarketplace: 0,
            vendaCaixas: item.vendaCaixas
          });
        }
      });
      nextProductsList = updatedProducts;
      return updatedProducts;
    });

    setCustomProductData(prevCustom => {
      const updatedCustom = { ...prevCustom };
      const importedSkuSet = new Set(importedItems.map(i => i.sku));

      // Reset sales for SKUs not present in this 020304 import
      Object.keys(updatedCustom).forEach(key => {
        const skuNum = Number(key);
        if (!importedSkuSet.has(skuNum)) {
          updatedCustom[skuNum] = {
            ...updatedCustom[skuNum],
            vendaCaixas: 0
          };
        }
      });

      importedItems.forEach(item => {
        updatedCustom[item.sku] = {
          estoqueInicialCaixas: prevCustom[item.sku]?.estoqueInicialCaixas || 0,
          estoquePicking: prevCustom[item.sku]?.estoquePicking || prevCustom[item.sku]?.estoqueInicialCaixas || 0,
          estoqueCentral: prevCustom[item.sku]?.estoqueCentral || 0,
          estoqueMarketplace: prevCustom[item.sku]?.estoqueMarketplace || 0,
          vendaCaixas: item.vendaCaixas
        };
      });

      saveLocalDraft(nextProductsList.length > 0 ? nextProductsList : productsList, updatedCustom, imported021101Files, fileName021101, fileName020304);
      return updatedCustom;
    });
  };

  return (
    <div className="flex flex-col gap-6 relative">
      
      {/* DUAL SUB-TABS SELECTOR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-2 sm:pb-0.5 gap-2">
        <div className="flex gap-2">
          <button 
            onClick={() => setActivePanel('analise')}
            className={`px-4 py-2 font-sans font-black text-xs uppercase tracking-wider transition-all border-b-2 cursor-pointer ${activePanel === 'analise' ? 'border-amber-500 text-amber-600 font-black' : 'border-transparent text-slate-500 hover:text-slate-800 bg-transparent'}`}
          >
            Análise Ativa do Dia
          </button>
          <button 
            onClick={() => setActivePanel('historico')}
            className={`px-4 py-2 font-sans font-black text-xs uppercase tracking-wider transition-all border-b-2 cursor-pointer ${activePanel === 'historico' ? 'border-amber-500 text-amber-600 font-black' : 'border-transparent text-slate-500 hover:text-slate-800 bg-transparent'}`}
          >
            Histórico de Consultas ({savedAnalyses.length})
          </button>
        </div>
        
        <div className="flex items-center flex-wrap gap-2">
          <button 
            onClick={handleExportExcel}
            className="px-2.5 py-1 bg-white hover:bg-slate-50 text-emerald-700 border border-slate-200 font-sans font-black text-[10px] uppercase tracking-wider rounded-lg transition-all shadow-3xs flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Excel
          </button>
          <button 
            onClick={handleExportNightExcel}
            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-sans font-black text-[10px] uppercase tracking-wider rounded-lg transition-all shadow-3xs flex items-center gap-1.5 cursor-pointer border border-indigo-200"
            title="Exportar apenas itens com necessidade de abastecimento noturno"
          >
            <Moon className="w-3.5 h-3.5 text-indigo-500 fill-indigo-500/15" />
            Excel Noturno
          </button>

          {/* Date Selector Quick Integration */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <Calendar className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
            <input 
              type="date"
              value={selectedAnalysisDate}
              onChange={(e) => {
                setSelectedAnalysisDate(e.target.value);
                setActivePanel('analise');
              }}
              className="bg-transparent border-none text-[10px] font-black font-mono text-slate-800 focus:outline-none p-0.5 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* TOAST SYSTEM */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 p-4 rounded-xl shadow-lg border text-white ${toast.type === 'success' ? 'bg-slate-900 border-slate-800' : 'bg-rose-950 border-rose-900'}`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-red-400" />}
            <span className="font-sans text-xs font-bold">{toast.message}</span>
            <button onClick={() => setToast(null)} className="p-1 hover:bg-white/10 rounded text-white/60 hover:text-white bg-transparent border-none cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {activePanel === 'historico' ? (
        /* HISTORIC LOGS LIST VIEW */
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-sans font-black text-sm uppercase text-slate-800 flex items-center gap-2">
                <History className="w-4 h-4 text-amber-500" />
                Histórico de Análises Salvas
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">
                Consulte análises de abastecimento diário registradas em datas anteriores.
              </p>
            </div>
            <button 
              onClick={fetchHistory}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-all border-none bg-transparent cursor-pointer"
              title="Sincronizar histórico"
            >
              <RefreshCw className={`w-4 h-4 ${loadingHistory ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loadingHistory ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
              <span className="text-xs font-mono">Carregando histórico do banco de dados...</span>
            </div>
          ) : savedAnalyses.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-3 bg-slate-50">
              <Database className="w-10 h-10 text-slate-300" />
              <div>
                <p className="text-xs font-black uppercase text-slate-600">Nenhum registro encontrado</p>
                <p className="text-[10px] text-slate-400 mt-1">Preencha os valores na aba de análise ativa e clique em salvar para registrar no histórico.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedAnalyses.map((item, idx) => (
                <div key={idx} className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-all flex flex-col justify-between gap-3 bg-slate-50 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-1">
                    <span className="text-[8px] font-mono bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-black">
                      SALVO
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-amber-600">
                      <Calendar className="w-4 h-4" />
                      <span className="font-mono font-black text-sm">{item.dataAnalise}</span>
                    </div>
                    <div className="mt-2 space-y-1 text-[10px] text-slate-500">
                      <p className="flex justify-between">
                        <span>Contagem Inicial (021101):</span>
                        <strong className="text-slate-700 font-mono">{(item.totals?.totalInitialBoxes ?? 0).toLocaleString()} cx</strong>
                      </p>
                      <p className="flex justify-between">
                        <span>Abastecido (07h às 19h):</span>
                        <strong className="text-emerald-600 font-mono">{(item.totals?.totalReplenishedBoxes ?? 0).toLocaleString()} cx</strong>
                      </p>
                      <p className="flex justify-between">
                        <span>Venda Saída (020304):</span>
                        <strong className="text-blue-600 font-mono">{(item.totals?.totalSalesBoxes ?? 0).toLocaleString()} cx</strong>
                      </p>
                      <p className="flex justify-between border-t border-slate-200/60 pt-1 mt-1 font-bold">
                        <span>Saldo Final:</span>
                        <span className={`font-mono ${(item.totals?.totalCurrentBalanceBoxes ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {(item.totals?.totalCurrentBalanceBoxes ?? 0).toLocaleString()} cx
                        </span>
                      </p>
                    </div>

                    <div className="flex gap-1 mt-2.5 text-[8px] text-center font-bold">
                      <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded flex-1">
                        OK: {item.totals?.statusCounts?.ok ?? 0}
                      </span>
                      <span className="bg-amber-50 text-amber-600 border border-amber-100 px-1.5 py-0.5 rounded flex-1">
                        AT: {item.totals?.statusCounts?.attention ?? 0}
                      </span>
                      <span className="bg-red-50 text-red-500 border border-red-100 px-1.5 py-0.5 rounded flex-1">
                        CR: {item.totals?.statusCounts?.critical ?? 0}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 mt-1">
                    <span className="text-[8px] text-slate-400 font-medium truncate max-w-[120px]" title={item.usuarioEmail}>
                      Por: {item.usuarioNome || item.usuarioEmail || 'Sistema'}
                    </span>
                    <div className="flex gap-1.5">
                      <button 
                        onClick={() => {
                          setSelectedAnalysisDate(item.dataAnalise);
                          setActivePanel('analise');
                        }}
                        className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-sans font-black text-[9px] uppercase tracking-wider rounded-lg transition-all cursor-pointer border-none flex items-center gap-1"
                      >
                        <FileText className="w-3 h-3" />
                        Carregar
                      </button>
                      <button 
                        onClick={() => handleDeleteAnalysis(item.id, item.dataAnalise)}
                        className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer border-none bg-transparent"
                        title="Excluir do histórico"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ACTIVE DIARY CHECK / PANEL VIEW */
        <>
          {/* ANALYSIS CONTROLS TOOLBAR */}
          <div className="p-4 bg-white text-slate-800 border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">Análise & Lançamentos</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-black text-slate-800 font-mono">{selectedAnalysisDate}</span>
                  {isHistoricalLoaded ? (
                    <span className="text-[8px] bg-emerald-100 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-black tracking-wider uppercase">
                      REGISTRO SALVO EM BANCO
                    </span>
                  ) : (
                    <span className="text-[8px] bg-amber-100 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded font-black tracking-wider uppercase">
                      VERSÃO DE RASCUNHO
                    </span>
                  )}
                </div>
              </div>

              {/* CURVA ABC FILTER */}
              <div className="flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200 gap-1 ml-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase px-1.5 flex items-center gap-1">
                  <span>Curva:</span>
                  <span className="text-[8px] font-black text-amber-700 bg-amber-100 px-1 py-0.2 rounded border border-amber-200" title={`Classificação ABC baseada na rotina comercial 03.05.19 (${abcEngine.quarter === 'ANUAL' ? 'Consolidado Anual' : `${abcEngine.quarter.replace('Q', '')}º Trimestre - ${abcEngine.quarter}`}) para a data selecionada`}>
                    {abcEngine.quarter}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setCurvaFilter('all')}
                  className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all border-none cursor-pointer ${
                    curvaFilter === 'all'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 bg-transparent'
                  }`}
                >
                  Todas
                </button>
                <button
                  type="button"
                  onClick={() => setCurvaFilter('A')}
                  className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all border-none cursor-pointer ${
                    curvaFilter === 'A'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-amber-700 hover:bg-amber-100/50 bg-transparent'
                  }`}
                >
                  Curva A
                </button>
                <button
                  type="button"
                  onClick={() => setCurvaFilter('B')}
                  className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all border-none cursor-pointer ${
                    curvaFilter === 'B'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-blue-700 hover:bg-blue-100/50 bg-transparent'
                  }`}
                >
                  Curva B
                </button>
                <button
                  type="button"
                  onClick={() => setCurvaFilter('C')}
                  className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all border-none cursor-pointer ${
                    curvaFilter === 'C'
                      ? 'bg-slate-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200/50 bg-transparent'
                  }`}
                >
                  Curva C
                </button>
              </div>

              {/* UNIT METRIC SELECTOR */}
              <div className="flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200 gap-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase px-1.5">Unidade:</span>
                <button
                  type="button"
                  onClick={() => setUnitMetric('hl')}
                  className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all border-none cursor-pointer ${
                    unitMetric === 'hl'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 bg-transparent'
                  }`}
                  title="Exibir métricas em Hectolitros"
                >
                  Hectolitros (HL)
                </button>
                <button
                  type="button"
                  onClick={() => setUnitMetric('pl')}
                  className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all border-none cursor-pointer ${
                    unitMetric === 'pl'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 bg-transparent'
                  }`}
                  title="Exibir métricas em Paletes"
                >
                  Paletes (PL)
                </button>
                <button
                  type="button"
                  onClick={() => setUnitMetric('cx')}
                  className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all border-none cursor-pointer ${
                    unitMetric === 'cx'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 bg-transparent'
                  }`}
                  title="Exibir métricas em Caixas"
                >
                  Caixas (CX)
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsEditMode(!isEditMode)}
                className={`px-3.5 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer border flex items-center gap-1.5 ${
                  isEditMode
                    ? 'bg-amber-50 text-amber-800 border-amber-300 ring-2 ring-amber-400'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                }`}
                title="Habilitar edição manual de contagem inicial e saídas"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                {isEditMode ? 'Fechar Edição' : 'Editar Contagens'}
              </button>

              <button 
                type="button"
                onClick={handleSaveAnalysis}
                disabled={saving}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-sans font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer border-none flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                {saving ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5 text-white" />
                )}
                Salvar Análise do Dia
              </button>
            </div>
          </div>



          {/* QUICK EDIT ACTIONS PANEL */}
          {isEditMode && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative p-5 bg-white border border-slate-200 rounded-2xl flex flex-col gap-5 shadow-xs overflow-hidden"
            >
              {/* Top Accent Gradient Bar representing both routines */}
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-500 to-emerald-500" />
              
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 bg-indigo-50/60 text-indigo-600 rounded-lg border border-indigo-100 shrink-0">
                    <SlidersHorizontal className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-slate-800 block">Atalhos Operacionais & Importações</span>
                    <span className="text-[10px] text-slate-400 font-medium block mt-0.5">Gerencie os valores de estoque inicial e saídas rapidamente via arquivos ou atalhos</span>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  <button 
                    onClick={handleResetInitial}
                    className="px-3 py-1.5 bg-amber-50/50 hover:bg-amber-100/70 text-amber-800 border border-amber-200/50 rounded-lg text-[9.5px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-3xs"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-amber-600" />
                    Zerar Inicial (021101)
                  </button>
                  <button 
                    onClick={handleResetSales}
                    className="px-3 py-1.5 bg-emerald-50/50 hover:bg-emerald-100/70 text-emerald-800 border border-emerald-200/50 rounded-lg text-[9.5px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-3xs"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-emerald-600" />
                    Zerar Saídas (020304)
                  </button>
                  <button 
                    onClick={handleRestoreDefaults}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-lg text-[9.5px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-3xs"
                  >
                    <Undo className="w-3.5 h-3.5 text-slate-600" />
                    Restaurar Padrão
                  </button>
                </div>
              </div>

              {/* INTEGRATED FILE IMPORT BENTO CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* ROTINA 021101 (CONTAGEM INICIAL) */}
                <div className="relative bg-slate-50/40 border border-slate-200/60 hover:border-amber-200/70 rounded-xl p-5 flex flex-col justify-between gap-4 shadow-3xs transition-all duration-200 group overflow-hidden">
                  <div className="absolute top-0 left-0 bottom-0 w-[3px] bg-amber-500 rounded-l-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 shrink-0 shadow-3xs">
                      <FileSpreadsheet className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[11.5px] font-extrabold uppercase tracking-tight text-slate-800 block">Importar Estoque Inicial (021101)</span>
                      <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-1">
                        Carregue o inventário de picking em formato <strong className="text-slate-600">.csv, .txt ou .xlsx</strong> para preencher o estoque inicial.
                      </p>
                      
                      {/* Column specs badges */}
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        <span className="inline-flex items-center gap-1 bg-slate-100/80 border border-slate-200 text-slate-600 text-[8.5px] font-bold px-2 py-0.5 rounded-md font-mono">
                          Col C = SKU
                        </span>
                        <span className="inline-flex items-center gap-1 bg-slate-100/80 border border-slate-200 text-slate-600 text-[8.5px] font-bold px-2 py-0.5 rounded-md font-mono">
                          Col D = Descrição
                        </span>
                        <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200/60 text-amber-800 text-[8.5px] font-bold px-2 py-0.5 rounded-md font-mono">
                          Col J = Qtd Estoque
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {imported021101Files.length > 0 ? (
                    <div className="flex flex-col gap-2.5 bg-amber-50/50 border border-amber-200/80 rounded-xl p-3.5 mt-1">
                      <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                          <span className="text-[10.5px] font-black text-amber-950 uppercase tracking-wider">
                            Arquivos 02.11.01 ({imported021101Files.length})
                          </span>
                        </div>
                        <button 
                          onClick={handleClear021101}
                          className="px-2 py-1 bg-rose-100/80 hover:bg-rose-200 text-rose-800 rounded-md transition-colors cursor-pointer border border-rose-200/80 text-[9px] font-black uppercase flex items-center gap-1"
                          title="Excluir todos os arquivos 02.11.01 e zerar estoques"
                        >
                          <Trash2 className="w-3 h-3 text-rose-600" />
                          Excluir Todos
                        </button>
                      </div>

                      {/* List of individual imported 02.11.01 files */}
                      <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
                        {imported021101Files.map((fileEntry, idx) => (
                          <div 
                            key={fileEntry.id}
                            className="flex items-center justify-between gap-2 p-2 bg-white/90 border border-amber-200/70 rounded-lg shadow-3xs"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 font-mono font-bold text-[8.5px] rounded">
                                #{idx + 1}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-mono font-bold text-slate-800 truncate" title={fileEntry.name}>
                                  {fileEntry.name}
                                </p>
                                <span className="text-[8.5px] text-slate-500 font-medium">
                                  {fileEntry.skuCount} SKUs • {fileEntry.pickingBoxes.toLocaleString()} cx picking • {fileEntry.timestamp}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDelete021101File(fileEntry.id)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-800 rounded-md transition-colors cursor-pointer border border-rose-200 shrink-0"
                              title={`Excluir "${fileEntry.name}" e recalcular`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                      
                      {/* Button to Merge Recontagem */}
                      <label className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-sans font-black text-[9.5px] uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-3xs text-center border-none mt-1">
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        {importing021101 ? 'Mesclando...' : '+ Mesclar Nova Recontagem 02.11.01'}
                        <input 
                          type="file"
                          accept=".csv,.txt,.xlsx,.xls"
                          onChange={handleImport021101}
                          className="hidden"
                          disabled={importing021101}
                        />
                      </label>
                      <span className="text-[8.5px] text-amber-800/80 font-medium">
                        💡 <strong>Gestão de Erro:</strong> Se importou algum arquivo errado, exclua-o individualmente na lixeira ao lado para recalcular o estoque automaticamente.
                      </span>
                    </div>
                  ) : (
                    <div className="mt-1">
                      <label className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-sans font-black text-[9.5px] uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-3xs text-center border-none">
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        {importing021101 ? 'Processando...' : 'Selecionar Planilha 021101'}
                        <input 
                          type="file"
                          accept=".csv,.txt,.xlsx,.xls"
                          onChange={handleImport021101}
                          className="hidden"
                          disabled={importing021101}
                        />
                      </label>
                    </div>
                  )}
                </div>

                {/* ROTINA 020304 (SAÍDAS / VENDAS) */}
                <div className="relative bg-slate-50/40 border border-slate-200/60 hover:border-emerald-200/70 rounded-xl p-5 flex flex-col justify-between gap-4 shadow-3xs transition-all duration-200 group overflow-hidden">
                  <div className="absolute top-0 left-0 bottom-0 w-[3px] bg-emerald-500 rounded-l-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 shrink-0 shadow-3xs">
                      <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[11.5px] font-extrabold uppercase tracking-tight text-slate-800 block">Importar Saídas / Vendas (020304)</span>
                      <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-1">
                        Carregue o relatório de vendas/saídas diárias em formato <strong className="text-slate-600">.csv, .txt ou .xlsx</strong> para preencher as saídas.
                      </p>
                      
                      {/* Column specs badges */}
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        <span className="inline-flex items-center gap-1 bg-slate-100/80 border border-slate-200 text-slate-600 text-[8.5px] font-bold px-2 py-0.5 rounded-md font-mono">
                          Col B = SKU
                        </span>
                        <span className="inline-flex items-center gap-1 bg-slate-100/80 border border-slate-200 text-slate-600 text-[8.5px] font-bold px-2 py-0.5 rounded-md font-mono">
                          Col C = Descrição
                        </span>
                        <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-[8.5px] font-bold px-2 py-0.5 rounded-md font-mono">
                          Col J = Qtd Saídas
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {fileName020304 ? (
                    <div className="flex items-center justify-between bg-emerald-50/30 border border-emerald-200/40 rounded-xl px-3 py-2 mt-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="text-[10px] text-emerald-900 font-mono font-bold truncate" title={fileName020304}>
                          {fileName020304}
                        </span>
                      </div>
                      <button 
                        onClick={handleClear020304}
                        className="p-1 bg-emerald-100/50 hover:bg-emerald-100 text-emerald-900 rounded-md transition-colors cursor-pointer border-none"
                        title="Remover arquivo e zerar valores"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="mt-1">
                      <label className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-sans font-black text-[9.5px] uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-3xs text-center border-none">
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        {importing020304 ? 'Processando...' : 'Selecionar Planilha 020304'}
                        <input 
                          type="file"
                          accept=".csv,.txt,.xlsx,.xls"
                          onChange={handleImport020304}
                          className="hidden"
                          disabled={importing020304}
                        />
                      </label>
                    </div>
                  )}
                </div>

              </div>
            </motion.div>
          )}

          {/* PROCESS SECTIONS CARDS GRID - PERFECT SYMMETRICAL DESIGN */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            
            {/* PROCESS 1: CONTAGEM INICIAL COM 5 ÁREAS (PICKING, PULMÃO, CENTRAL, MARKETPLACE, CONTINGÊNCIA) */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col justify-between gap-4 shadow-sm hover:shadow-md transition-all h-full">
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-900 text-[8.5px] font-mono font-black uppercase rounded-md">
                        Rotina 021101
                      </span>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[8.5px] font-mono font-black uppercase rounded-md">
                        5 Áreas
                      </span>
                    </div>
                    <h3 className="text-xs font-sans font-black uppercase tracking-wider text-slate-800 mt-1.5">
                      Contagem Inicial por Área
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                      Inventário por Áreas: 2-Pick, 4-Pulmão, 1-Cent, 3-Mkt, 5-Cont.
                    </p>
                  </div>
                  <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-200/60 shadow-xs shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>

                {/* Symmetrical 2x2 Metric Grid */}
                <div className="grid grid-cols-2 gap-2 bg-slate-50/80 p-3 rounded-xl border border-slate-200/70">
                  <div className="flex flex-col bg-white p-2.5 rounded-lg border border-slate-200/50 shadow-xs">
                    <span className="text-[8.5px] tracking-wider text-amber-700 font-bold uppercase">Picking (Área 2)</span>
                    <span className="text-base font-black font-mono text-amber-900 leading-tight">
                      {totalInitialBoxes.toLocaleString()} cx
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 font-semibold mt-0.5">
                      {totalInitialPallets} PL • {totalInitialHecto.toFixed(1)} HL
                    </span>
                  </div>

                  <div className="flex flex-col bg-white p-2.5 rounded-lg border border-slate-200/50 shadow-xs">
                    <span className="text-[8.5px] tracking-wider text-purple-700 font-bold uppercase">Pulmão (Área 4)</span>
                    <span className="text-base font-black font-mono text-purple-900 leading-tight">
                      {totalPulmaoBoxes.toLocaleString()} cx
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 font-semibold mt-0.5">
                      {totalPulmaoPallets} PL Reserva
                    </span>
                  </div>

                  <div className="flex flex-col bg-white p-2.5 rounded-lg border border-slate-200/50 shadow-xs">
                    <span className="text-[8.5px] tracking-wider text-indigo-700 font-bold uppercase">Central (Área 1)</span>
                    <span className="text-base font-black font-mono text-indigo-900 leading-tight">
                      {totalCentralBoxes.toLocaleString()} cx
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 font-semibold mt-0.5">
                      {totalCentralPallets} PL Depósito
                    </span>
                  </div>

                  <div className="flex flex-col bg-white p-2.5 rounded-lg border border-slate-200/50 shadow-xs">
                    <span className="text-[8.5px] tracking-wider text-orange-700 font-bold uppercase">MKP (3) & Cont (5)</span>
                    <span className="text-base font-black font-mono text-slate-800 leading-tight">
                      {(totalMarketplaceBoxes + totalContingenciaBoxes).toLocaleString()} cx
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 font-semibold mt-0.5">
                      {totalMarketplacePallets} PL (3) • {totalContingenciaPallets} PL (5)
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-[9.5px] text-slate-600 font-medium flex items-center justify-between bg-amber-50/60 p-2.5 rounded-xl border border-amber-100">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-semibold">Total Geral: {totalGeralArmazemBoxes.toLocaleString()} cx ({totalGeralArmazemPallets} PL)</span>
                </div>
                <span className="font-mono text-[9px] font-bold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded">
                  {totalSkusChecked} SKUs
                </span>
              </div>
            </div>

            {/* PROCESS 2: ABASTECIMENTO DIURNO */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col justify-between gap-4 shadow-sm hover:shadow-md transition-all h-full">
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 text-[8.5px] font-mono font-black uppercase rounded-md">
                        Processo 2 • Empilhadeiras
                      </span>
                    </div>
                    <h3 className="text-xs font-sans font-black uppercase tracking-wider text-slate-800 mt-1.5">
                      Abastecimento Diurno
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                      Ressuprimento operacional exclusivo de <strong className="text-slate-700">07:00 às 19:00</strong>.
                    </p>
                  </div>
                  <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-200/60 shadow-xs shrink-0">
                    <Truck className="w-5 h-5" />
                  </div>
                </div>

                {/* Symmetrical 2x2 Metric Grid */}
                <div className="grid grid-cols-2 gap-2 bg-slate-50/80 p-3 rounded-xl border border-slate-200/70">
                  <div className="flex flex-col bg-white p-2.5 rounded-lg border border-slate-200/50 shadow-xs">
                    <span className="text-[8.5px] tracking-wider text-emerald-700 font-bold uppercase">Volume Abastecido</span>
                    <span className="text-base font-black font-mono text-emerald-800 leading-tight">
                      {totalReplenishedBoxes.toLocaleString()} cx
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 font-semibold mt-0.5">
                      {totalReplenishedPallets} PL • {totalReplenishedHecto.toFixed(1)} HL
                    </span>
                  </div>

                  <div className="flex flex-col bg-white p-2.5 rounded-lg border border-slate-200/50 shadow-xs">
                    <span className="text-[8.5px] tracking-wider text-slate-600 font-bold uppercase">SKUs Abastecidos</span>
                    <span className="text-base font-black font-mono text-slate-900 leading-tight">
                      {totalSkusReplenished || 0} SKUs
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 font-semibold mt-0.5">
                      de {processedSkus.length} ativos
                    </span>
                  </div>

                  <div className="flex flex-col bg-white p-2.5 rounded-lg border border-slate-200/50 shadow-xs">
                    <span className="text-[8.5px] tracking-wider text-slate-600 font-bold uppercase">Equipe Operacional</span>
                    <span className="text-base font-black font-mono text-slate-900 leading-tight">
                      {activeOperators} Operadores
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 font-semibold mt-0.5">
                      Marivaldo, Ronildo...
                    </span>
                  </div>

                  <div className="flex flex-col bg-white p-2.5 rounded-lg border border-slate-200/50 shadow-xs">
                    <span className="text-[8.5px] tracking-wider text-emerald-700 font-bold uppercase">Eficiência Turno</span>
                    <span className="text-base font-black font-mono text-emerald-800 leading-tight">
                      100%
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 font-semibold mt-0.5">
                      Janela 07:00 às 19:00
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-[9.5px] text-slate-600 font-medium flex items-center justify-between bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-semibold">Janela Operacional: 07h às 19h</span>
                </div>
                {replenishmentMap.excludedCount > 0 ? (
                  <span className="text-[8.5px] text-rose-700 font-black uppercase bg-rose-100/80 px-2 py-0.5 rounded border border-rose-200">
                    -{replenishmentMap.excludedCount} fora do horário
                  </span>
                ) : (
                  <span className="text-[8.5px] text-emerald-800 font-black uppercase bg-emerald-100/80 px-2 py-0.5 rounded">
                    100% no turno
                  </span>
                )}
              </div>
            </div>

            {/* PROCESS 3: SAÍDAS & COBERTURA */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col justify-between gap-4 shadow-sm hover:shadow-md transition-all h-full">
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-900 text-[8.5px] font-mono font-black uppercase rounded-md">
                        Rotina 020304 • Saídas
                      </span>
                    </div>
                    <h3 className="text-xs font-sans font-black uppercase tracking-wider text-slate-800 mt-1.5">
                      Saídas & Cobertura
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                      Demanda de vendas vs. Estoque Disponível no Picking.
                    </p>
                  </div>
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-200/60 shadow-xs shrink-0">
                    <Package className="w-5 h-5" />
                  </div>
                </div>

                {/* Symmetrical 2x2 Metric Grid */}
                <div className="grid grid-cols-2 gap-2 bg-slate-50/80 p-3 rounded-xl border border-slate-200/70">
                  <div className="flex flex-col bg-white p-2.5 rounded-lg border border-slate-200/50 shadow-xs">
                    <span className="text-[8.5px] tracking-wider text-blue-700 font-bold uppercase">Saída / Vendas</span>
                    <span className="text-base font-black font-mono text-blue-800 leading-tight">
                      {totalSalesBoxes.toLocaleString()} cx
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 font-semibold mt-0.5">
                      {totalSalesPallets} PL • {totalSalesHecto.toFixed(1)} HL
                    </span>
                  </div>

                  <div className="flex flex-col bg-white p-2.5 rounded-lg border border-slate-200/50 shadow-xs">
                    <span className="text-[8.5px] tracking-wider text-slate-600 font-bold uppercase">Saldo Picking</span>
                    <span className={`text-base font-black font-mono leading-tight ${totalCurrentBalanceBoxes >= 0 ? 'text-emerald-800' : 'text-rose-700'}`}>
                      {totalCurrentBalanceBoxes >= 0 ? `+${totalCurrentBalanceBoxes.toLocaleString()}` : totalCurrentBalanceBoxes.toLocaleString()} cx
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 font-semibold mt-0.5">
                      {totalCurrentBalancePallets >= 0 ? `+${totalCurrentBalancePallets}` : totalCurrentBalancePallets} PL no Picking
                    </span>
                  </div>

                  <div className="flex flex-col bg-white p-2.5 rounded-lg border border-slate-200/50 shadow-xs">
                    <span className="text-[8.5px] tracking-wider text-indigo-700 font-bold uppercase">Cobertura Picking</span>
                    <span className="text-base font-black font-mono text-indigo-800 leading-tight">
                      {totalSalesBoxes > 0 ? `${Math.round(((totalInitialBoxes + totalReplenishedBoxes) / totalSalesBoxes) * 100)}%` : '100%'}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 font-semibold mt-0.5">
                      Suficiência Demanda
                    </span>
                  </div>

                  <div className="flex flex-col bg-white p-2.5 rounded-lg border border-slate-200/50 shadow-xs">
                    <span className="text-[8.5px] tracking-wider text-slate-600 font-bold uppercase">Status Operacional</span>
                    <span className="text-base font-black font-mono text-slate-900 leading-tight">
                      {statusCounts.ok} OK
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 font-semibold mt-0.5">
                      {statusCounts.attention} Atenção • {statusCounts.critical} Crítico
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1.5 text-[9.5px] text-center font-black uppercase">
                <div className="bg-emerald-50 text-emerald-800 py-1.5 px-2 rounded-xl border border-emerald-200 flex items-center justify-between">
                  <span className="text-[9px]">OK</span>
                  <span className="font-mono bg-emerald-600 text-white px-1.5 py-0.2 rounded-md text-[9px] font-black">{statusCounts.ok}</span>
                </div>
                <div className="bg-amber-50 text-amber-800 py-1.5 px-2 rounded-xl border border-amber-200 flex items-center justify-between">
                  <span className="text-[9px]">Atenção</span>
                  <span className="font-mono bg-amber-500 text-white px-1.5 py-0.2 rounded-md text-[9px] font-black">{statusCounts.attention}</span>
                </div>
                <div className="bg-rose-50 text-rose-800 py-1.5 px-2 rounded-xl border border-rose-200 flex items-center justify-between">
                  <span className="text-[9px]">Crítico</span>
                  <span className="font-mono bg-rose-500 text-white px-1.5 py-0.2 rounded-md text-[9px] font-black">{statusCounts.critical}</span>
                </div>
              </div>
            </div>

          </div>

          {/* CHARTS SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* CHART 1: REPLENISHMENTS BY HOUR */}
            <div className="lg:col-span-12 bg-white border border-slate-200 p-5 rounded-2xl flex flex-col gap-3 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs uppercase font-black text-slate-700 tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500" />
                    Volume de Ressuprimento por Horário (Paletes / PL)
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase block font-bold mt-0.5">
                    Visão operacional em Paletes: Turno Diurno / Intermediário (Marivaldo / Ronildo), Pausa 12h-14h e Noturno (Paulo Pereira / Ronildo)
                  </span>
                </div>
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-[9px] uppercase font-black text-slate-400">Total no Dia</span>
                  <span className="text-xs font-black font-mono text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
                    {totalReplenishedPallets} PL <span className="text-[10px] font-medium text-slate-500">(~{totalReplenishedBoxes.toLocaleString('pt-BR')} CX)</span>
                  </span>
                </div>
              </div>
              
              <div className="h-72 w-full pt-2">
                {totalReplenishedPallets === 0 && totalHourlyReplenished === 0 ? (
                  <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 gap-2 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    <Info className="w-6 h-6 text-slate-300" />
                    <span className="text-xs font-bold uppercase tracking-wider text-center px-4">Nenhum ressuprimento registrado na data selecionada</span>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hourlyChartData} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="hour" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} unit=" PL" />
                      <Tooltip 
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl text-white shadow-xl">
                                <p className="font-extrabold text-xs text-amber-400 mb-1">Horário: {label}</p>
                                <p className="text-[11px] font-bold text-slate-200">
                                  Volume: <span className="font-black text-amber-400">{data.paletes} Paletes (PL)</span>
                                </p>
                                <p className="text-[10px] font-medium text-slate-400 mt-0.5">
                                  Equivalente: {data.caixas.toLocaleString('pt-BR')} caixas
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="paletes" radius={[4, 4, 0, 0]}>
                        {hourlyChartData.map((entry, index) => {
                          const isPeak = entry.rawHour === 10;
                          const isPause = entry.rawHour === 12 || entry.rawHour === 13;
                          const isAfternoon = entry.rawHour >= 14 && entry.rawHour <= 16;
                          let barFill = '#032b5e';
                          if (isPeak) barFill = '#f59e0b';
                          else if (isPause) barFill = '#cbd5e1';
                          else if (isAfternoon) barFill = '#2563eb';
                          return <Cell key={`cell-${index}`} fill={barFill} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* CHART 2: TOP 10 REPLENISHED SKUS */}
            <div className="lg:col-span-6 bg-white border border-slate-200 p-5 rounded-2xl flex flex-col gap-3 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs uppercase font-black text-slate-700 tracking-wider flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    Top 10 SKUs Mais Abastecidos ({unitMetric.toUpperCase()})
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase block font-bold mt-0.5">
                    {curvaFilter === 'all' ? 'Todas as Curvas' : `Filtrado por Curva ${curvaFilter}`} • Ordenado por {unitMetric === 'hl' ? 'Hectolitros' : unitMetric === 'pl' ? 'Paletes' : 'Caixas'}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[9px] uppercase font-black text-slate-400">Total Abastecido</span>
                  <span className="text-xs font-black font-mono text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                    {unitMetric === 'hl' 
                      ? `${totalReplenishedHecto.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} HL` 
                      : unitMetric === 'pl' 
                        ? `${totalReplenishedPallets} PL` 
                        : `${totalReplenishedBoxes.toLocaleString()} cx`}
                  </span>
                </div>
              </div>

              <div className="h-[420px] w-full pt-2">
                {topProductsChartData.length === 0 ? (
                  <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 gap-2 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    <Info className="w-6 h-6 text-slate-300" />
                    <span className="text-xs font-bold uppercase tracking-wider text-center px-4">Nenhum abastecimento registrado para o filtro ativo</span>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={topProductsChartData} 
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" stroke="#94a3b8" fontSize={10} tickLine={false} unit={` ${unitMetric.toUpperCase()}`} />
                      <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={9} width={130} tickLine={false} />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl text-white shadow-xl max-w-xs">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <span className="font-mono text-[10px] text-slate-400 font-bold">SKU #{data.sku}</span>
                                  <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded font-mono ${
                                    data.curvaAbc === 'A' ? 'bg-amber-400 text-slate-950' : data.curvaAbc === 'B' ? 'bg-blue-400 text-slate-950' : 'bg-slate-300 text-slate-900'
                                  }`}>
                                    Curva {data.curvaAbc}
                                  </span>
                                </div>
                                <p className="font-extrabold text-xs text-white mb-2 leading-tight">{data.fullName || data.name}</p>
                                <div className="space-y-1 pt-1 border-t border-slate-700/80 text-[10.5px]">
                                  <p className="flex justify-between font-bold text-emerald-400">
                                    <span>Abastecimento:</span>
                                    <span>{data.caixas.toLocaleString('pt-BR')} cx ({data.paletes} PL)</span>
                                  </p>
                                  <p className="flex justify-between text-slate-300 font-medium">
                                    <span>Hectolitros:</span>
                                    <span className="font-mono">{data.hecto} HL</span>
                                  </p>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="primaryValue" fill="#10b981" radius={[0, 4, 4, 0]} barSize={14} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* CHART 3: TOP 10 HIGHEST SALES / OUTPUT (ROTINA 020304) */}
            <div className="lg:col-span-6 bg-white border border-slate-200 p-5 rounded-2xl flex flex-col gap-3 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs uppercase font-black text-slate-700 tracking-wider flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-blue-500" />
                    Top 10 Maiores Saídas / Vendas ({unitMetric.toUpperCase()})
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase block font-bold mt-0.5">
                    {curvaFilter === 'all' ? 'Todas as Curvas' : `Filtrado por Curva ${curvaFilter}`} • Rotina 020304
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[9px] uppercase font-black text-slate-400">Total de Saída</span>
                  <span className="text-xs font-black font-mono text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg">
                    {unitMetric === 'hl' 
                      ? `${totalSalesHecto.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} HL` 
                      : unitMetric === 'pl' 
                        ? `${totalSalesPallets} PL` 
                        : `${totalSalesBoxes.toLocaleString()} cx`}
                  </span>
                </div>
              </div>

              <div className="h-[420px] w-full pt-2">
                {topSales10ChartData.length === 0 ? (
                  <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 gap-2 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    <Info className="w-6 h-6 text-slate-300" />
                    <span className="text-xs font-bold uppercase tracking-wider text-center px-4">Nenhuma saída registrada para o filtro ativo</span>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={topSales10ChartData} 
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" stroke="#94a3b8" fontSize={10} tickLine={false} unit={` ${unitMetric.toUpperCase()}`} />
                      <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={9} width={130} tickLine={false} />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl text-white shadow-xl max-w-xs">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <span className="font-mono text-[10px] text-slate-400 font-bold">SKU #{data.sku}</span>
                                  <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded font-mono ${
                                    data.curvaAbc === 'A' ? 'bg-amber-400 text-slate-950' : data.curvaAbc === 'B' ? 'bg-blue-400 text-slate-950' : 'bg-slate-300 text-slate-900'
                                  }`}>
                                    Curva {data.curvaAbc}
                                  </span>
                                </div>
                                <p className="font-extrabold text-xs text-white mb-2 leading-tight">{data.fullName || data.name}</p>
                                <div className="space-y-1 pt-1 border-t border-slate-700/80 text-[10.5px]">
                                  <p className="flex justify-between font-bold text-blue-400">
                                    <span>Saída 020304:</span>
                                    <span>{data.caixas.toLocaleString('pt-BR')} cx ({data.paletes} PL)</span>
                                  </p>
                                  <p className="flex justify-between text-slate-300 font-medium">
                                    <span>Hectolitros:</span>
                                    <span className="font-mono">{data.hecto} HL</span>
                                  </p>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="primaryValue" fill="#2563eb" radius={[0, 4, 4, 0]} barSize={14} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

          </div>

          {/* COMPREHENSIVE STATUS TABLE */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-4 shadow-sm">
            
            {/* ANÁLISE DE MONTAGEM DE CARGA: PICKING vs CENTRAL vs MARKETPLACE vs REABASTECIMENTO */}
            <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl text-white shadow-md">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-3 bg-amber-500 text-slate-950 rounded-xl shadow font-black shrink-0">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black uppercase tracking-wider text-amber-400">
                        Análise de Montagem: Picking x Central x Marketplace
                      </h4>
                      <span className="px-2 py-0.5 bg-amber-400/20 text-amber-300 font-mono text-[9px] font-black rounded-full uppercase border border-amber-400/30">
                        {montagemTotals.totalSkusComVenda} SKUs com Saída
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-normal mt-0.5">
                      Diagnóstico logístico: paletes fechados carregam direto do Central (Área 1) ou Marketplace (Área 3), fracionados saem do Picking (Área 2).
                    </p>
                  </div>
                </div>

                {/* 6 Symmetrical Action Filter Cards for All 5 Supply Areas */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 shrink-0">
                  <button
                    onClick={() => setStatusFilter(statusFilter === 'suficiente_picking' ? 'all' : 'suficiente_picking')}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      statusFilter === 'suficiente_picking'
                        ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200 ring-2 ring-emerald-400'
                        : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 block truncate">🟢 Picking OK</span>
                    <span className="text-xs font-mono font-black text-emerald-300 block mt-0.5">{montagemTotals.skusSuficientes} SKUs</span>
                    <p className="text-[8px] text-slate-400 mt-0.5 truncate">Cobre direto</p>
                  </button>

                  <button
                    onClick={() => setStatusFilter(statusFilter === 'carregar_pulmao' ? 'all' : 'carregar_pulmao')}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      statusFilter === 'carregar_pulmao'
                        ? 'bg-purple-500/25 border-purple-400 text-purple-200 ring-2 ring-purple-400'
                        : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-[9px] font-black uppercase tracking-wider text-purple-400 block truncate">🟣 Pulmão (4)</span>
                    <span className="text-xs font-mono font-black text-purple-300 block mt-0.5">{montagemTotals.palletsPulmao} PL</span>
                    <p className="text-[8px] text-slate-400 mt-0.5 truncate">{montagemTotals.skusCarregarPulmao} SKUs</p>
                  </button>

                  <button
                    onClick={() => setStatusFilter(statusFilter === 'carregar_central' ? 'all' : 'carregar_central')}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      statusFilter === 'carregar_central'
                        ? 'bg-amber-500/25 border-amber-400 text-amber-200 ring-2 ring-amber-400'
                        : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-[9px] font-black uppercase tracking-wider text-amber-400 block truncate">🟡 Central (1)</span>
                    <span className="text-xs font-mono font-black text-amber-300 block mt-0.5">{montagemTotals.palletsCentral} PL</span>
                    <p className="text-[8px] text-slate-400 mt-0.5 truncate">{montagemTotals.skusCarregarCentral} SKUs</p>
                  </button>

                  <button
                    onClick={() => setStatusFilter(statusFilter === 'carregar_marketplace' ? 'all' : 'carregar_marketplace')}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      statusFilter === 'carregar_marketplace'
                        ? 'bg-orange-500/25 border-orange-400 text-orange-200 ring-2 ring-orange-400'
                        : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-[9px] font-black uppercase tracking-wider text-orange-400 block truncate">🟠 MktPlace (3)</span>
                    <span className="text-xs font-mono font-black text-orange-300 block mt-0.5">{montagemTotals.palletsMarketplace} PL</span>
                    <p className="text-[8px] text-slate-400 mt-0.5 truncate">{montagemTotals.skusCarregarMarketplace} SKUs</p>
                  </button>

                  <button
                    onClick={() => setStatusFilter(statusFilter === 'carregar_contingencia' ? 'all' : 'carregar_contingencia')}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      statusFilter === 'carregar_contingencia'
                        ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 ring-2 ring-cyan-400'
                        : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-[9px] font-black uppercase tracking-wider text-cyan-400 block truncate">🔵 Contingência (5)</span>
                    <span className="text-xs font-mono font-black text-cyan-300 block mt-0.5">{montagemTotals.palletsContingencia} PL</span>
                    <p className="text-[8px] text-slate-400 mt-0.5 truncate">{montagemTotals.skusCarregarContingencia} SKUs</p>
                  </button>

                  <button
                    onClick={() => setStatusFilter(statusFilter === 'reabastecer_picking' ? 'all' : 'reabastecer_picking')}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      statusFilter === 'reabastecer_picking'
                        ? 'bg-rose-500/25 border-rose-400 text-rose-200 ring-2 ring-rose-400'
                        : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-[9px] font-black uppercase tracking-wider text-rose-400 block truncate">🔴 Reabastecer</span>
                    <span className="text-xs font-mono font-black text-rose-300 block mt-0.5">
                      {montagemTotals.palletsReabastecer} PL ({montagemTotals.caixasReabastecer.toLocaleString()} cx)
                    </span>
                    <p className="text-[8px] text-slate-400 mt-0.5 truncate">{montagemTotals.skusReabastecer} SKUs déficit</p>
                  </button>
                </div>
              </div>
            </div>

            {/* CRITICAL ALERT BANNER: RUPTURA IN FULL (Zero Estoque em TODAS as áreas com Saída) */}
            {skusRupturaInFull.length > 0 && (
              <div className="p-4 bg-gradient-to-r from-rose-900 via-rose-800 to-rose-950 border-2 border-rose-500 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg text-white">
                <div className="flex items-start md:items-center gap-3">
                  <div className="p-2.5 bg-rose-600 text-white rounded-xl shadow-md flex-shrink-0 animate-bounce">
                    <AlertOctagon className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider text-rose-200">
                        🚨 ALERTA CRÍTICO: RUPTURA IN FULL NO ARMAZÉM
                      </span>
                      <span className="px-2 py-0.5 bg-rose-700 text-white font-mono font-black text-[9px] rounded-full uppercase border border-rose-400">
                        {skusRupturaInFull.length} SKUs Afetados
                      </span>
                    </div>
                    <p className="text-[11px] font-medium text-rose-100 mt-0.5 leading-snug">
                      Estes produtos possuem <strong className="text-white underline">saída de venda confirmada</strong>, porém constam com <strong className="text-amber-300">ESTOQUE ZERO em todas as 5 áreas</strong> (Picking, Pulmão, Central, Marketplace e Contingência) em todas as contagens/recontagens.
                      Falta total no armazém: <strong className="text-amber-300 font-mono">{caixasRupturaInFull.toLocaleString()} cx ({palletsRupturaInFull} PL)</strong>.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setStatusFilter(statusFilter === 'ruptura_in_full' ? 'all' : 'ruptura_in_full')}
                    className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all border cursor-pointer flex items-center gap-1.5 shadow-sm ${
                      statusFilter === 'ruptura_in_full'
                        ? 'bg-white text-rose-900 border-white ring-2 ring-white'
                        : 'bg-rose-700 hover:bg-rose-600 text-white border-rose-500'
                    }`}
                  >
                    <AlertOctagon className="w-3.5 h-3.5" />
                    Filtrar In Full ({skusRupturaInFull.length})
                  </button>
                </div>
              </div>
            )}

            {/* OBSERVATION BANNER: ESTOQUE INSUFICIENTE NO ARMAZÉM */}
            {skusEstoqueInsuficiente.length > 0 && (
              <div className="p-4 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border-2 border-amber-400 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-start md:items-center gap-3">
                  <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-xs flex-shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider text-amber-950">
                        Observação: Estoque de Armazém Insuficiente
                      </span>
                      <span className="px-2 py-0.5 bg-amber-200 text-amber-950 font-mono font-black text-[9px] rounded-full uppercase border border-amber-300">
                        {skusEstoqueInsuficiente.length} SKUs com Déficit
                      </span>
                    </div>
                    <p className="text-[11px] font-medium text-slate-700 mt-0.5">
                      Mesmo somando todas as áreas de estoque do armazém (Picking, Pulmão, Central, MktPlace e Contingência), o volume total disponível é inferior à saída total de venda.
                      Déficit total não atendível: <strong className="text-rose-700 font-mono">{caixasDeficitArmazem.toLocaleString()} cx ({palletsDeficitArmazem} PL)</strong>.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setStatusFilter(statusFilter === 'estoque_insuficiente' ? 'all' : 'estoque_insuficiente')}
                    className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all border cursor-pointer flex items-center gap-1.5 ${
                      statusFilter === 'estoque_insuficiente'
                        ? 'bg-amber-600 text-white border-amber-700 shadow-md'
                        : 'bg-white text-amber-900 border-amber-300 hover:bg-amber-100'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Ver Insuficientes ({skusEstoqueInsuficiente.length})
                  </button>
                </div>
              </div>
            )}

            {/* Table Toolbar */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
              
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <div className="relative w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar SKU ou descrição de produto..."
                    className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium placeholder-slate-400"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                
                <div className="flex flex-wrap items-center bg-white p-1 rounded-lg border border-slate-200 gap-1">
                  <button 
                    onClick={() => setStatusFilter('all')}
                    className={`px-2 py-1 text-[9px] font-black uppercase tracking-wider rounded-md cursor-pointer border-none transition-all ${statusFilter === 'all' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 bg-transparent'}`}
                  >
                    Todos ({processedSkus.length})
                  </button>
                  <button 
                    onClick={() => setStatusFilter('suficiente_picking')}
                    className={`px-2 py-1 text-[9px] font-black uppercase tracking-wider rounded-md cursor-pointer border-none transition-all ${statusFilter === 'suficiente_picking' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-700 hover:bg-emerald-50 bg-transparent'}`}
                    title="Itens com estoque suficiente no picking para montagem"
                  >
                    🟢 Suficiente ({montagemTotals.skusSuficientes})
                  </button>
                  <button 
                    onClick={() => setStatusFilter('carregar_central')}
                    className={`px-2 py-1 text-[9px] font-black uppercase tracking-wider rounded-md cursor-pointer border-none transition-all ${statusFilter === 'carregar_central' ? 'bg-amber-600 text-white shadow-sm' : 'text-amber-800 hover:bg-amber-50 bg-transparent'}`}
                    title="Itens com paletes fechados para carregar direto do central"
                  >
                    🟡 Central ({montagemTotals.skusCarregarCentral})
                  </button>
                  <button 
                    onClick={() => setStatusFilter('carregar_marketplace')}
                    className={`px-2 py-1 text-[9px] font-black uppercase tracking-wider rounded-md cursor-pointer border-none transition-all ${statusFilter === 'carregar_marketplace' ? 'bg-orange-600 text-white shadow-sm' : 'text-orange-800 hover:bg-orange-50 bg-transparent'}`}
                    title="Itens com paletes fechados para carregar do marketplace"
                  >
                    🟠 Marketplace ({montagemTotals.skusCarregarMarketplace})
                  </button>
                  <button 
                    onClick={() => setStatusFilter('reabastecer_picking')}
                    className={`px-2 py-1 text-[9px] font-black uppercase tracking-wider rounded-md cursor-pointer border-none transition-all ${statusFilter === 'reabastecer_picking' ? 'bg-rose-600 text-white shadow-sm' : 'text-rose-700 hover:bg-rose-50 bg-transparent'}`}
                    title="Itens que exigem reabastecimento no picking para montagem"
                  >
                    🔴 Reabastecer ({montagemTotals.skusReabastecer})
                  </button>
                  {skusRupturaInFull.length > 0 && (
                    <button 
                      onClick={() => setStatusFilter('ruptura_in_full')}
                      className={`px-2 py-1 text-[9px] font-black uppercase tracking-wider rounded-md cursor-pointer border-none transition-all flex items-center gap-1 ${statusFilter === 'ruptura_in_full' ? 'bg-rose-700 text-white font-black shadow-sm' : 'text-rose-900 bg-rose-100 hover:bg-rose-200'}`}
                      title="Produtos com saída e ZERO estoque em todas as áreas do armazém (Ruptura In Full)"
                    >
                      <AlertOctagon className="w-2.5 h-2.5" />
                      In Full ({skusRupturaInFull.length})
                    </button>
                  )}
                  {skusEstoqueInsuficiente.length > 0 && (
                    <button 
                      onClick={() => setStatusFilter('estoque_insuficiente')}
                      className={`px-2 py-1 text-[9px] font-black uppercase tracking-wider rounded-md cursor-pointer border-none transition-all flex items-center gap-1 ${statusFilter === 'estoque_insuficiente' ? 'bg-amber-600 text-white font-black shadow-sm' : 'text-amber-900 bg-amber-100 hover:bg-amber-200'}`}
                      title="Produtos onde o estoque de armazém não supre a saída"
                    >
                      <AlertTriangle className="w-2.5 h-2.5" />
                      Insuficiente ({skusEstoqueInsuficiente.length})
                    </button>
                  )}
                  <button 
                    onClick={() => setStatusFilter('no_picking_sales')}
                    className={`px-2 py-1 text-[9px] font-black uppercase tracking-wider rounded-md cursor-pointer border-none transition-all flex items-center gap-1 ${statusFilter === 'no_picking_sales' ? 'bg-amber-600 text-white font-black shadow-sm' : 'text-amber-800 hover:bg-amber-50 bg-transparent'}`}
                    title="Produtos sem estoque inicial no picking que tiveram vendas"
                  >
                    <AlertTriangle className="w-2.5 h-2.5" />
                    Sem Inicial ({skusSemEstoqueInicialComVenda.length})
                  </button>
                  <button 
                    onClick={() => setStatusFilter('total_rupture')}
                    className={`px-2 py-1 text-[9px] font-black uppercase tracking-wider rounded-md cursor-pointer border-none transition-all flex items-center gap-1 ${statusFilter === 'total_rupture' ? 'bg-rose-600 text-white font-black shadow-sm' : 'text-rose-700 hover:bg-rose-50 bg-transparent'}`}
                    title="Produtos sem estoque e sem abastecimento com vendas (Ruptura Total)"
                  >
                    <AlertOctagon className="w-2.5 h-2.5" />
                    Ruptura ({skusRupturaTotalPicking.length})
                  </button>
                </div>

                <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase bg-white px-2.5 py-1 rounded-lg border border-slate-200 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={showOnlyWithSales}
                    onChange={(e) => setShowOnlyWithSales(e.target.checked)}
                    className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                  />
                  Com Movimento
                </label>

              </div>

            </div>

            {/* The Intelligent Table - Focused Columns: Picking Quantity & Replenishment Need */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-inner bg-slate-50">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 uppercase font-black text-[9px] tracking-wider">
                    <th className="p-3.5 min-w-[220px]">Código & Descrição</th>
                    <th className="p-3.5 text-center bg-amber-50/60 text-amber-950 font-black min-w-[180px]">
                      Quantidade no Picking
                    </th>
                    <th className="p-3.5 text-center bg-blue-50/40 text-blue-950 min-w-[120px]">Saída (020304)</th>
                    <th className="p-3.5 text-center bg-amber-50/40 text-amber-950 font-black min-w-[260px]">
                      Necessidade de Reabastecer & Origem
                    </th>
                    <th className="p-3.5 text-right min-w-[100px]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white text-slate-700">
                  {filteredSkus.map((item, idx) => {
                    const totalDisp = item.estoqueTotalDisponivel;
                    const coveragePct = item.coberturaPickingPct;
                    
                    return (
                      <tr key={idx} className="hover:bg-slate-50/90 transition-all text-[11px]">
                        
                        {/* 1. CÓDIGO & DESCRIÇÃO */}
                        <td className="p-3.5">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] text-amber-600 font-bold">#{item.sku}</span>
                              <span className={`px-1.5 py-0.2 rounded font-mono text-[8px] font-black uppercase border ${
                                item.curvaAbc === 'A'
                                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                                  : item.curvaAbc === 'B'
                                    ? 'bg-blue-100 text-blue-900 border-blue-300'
                                    : 'bg-slate-100 text-slate-700 border-slate-300'
                              }`}>
                                Curva {item.curvaAbc || 'B'}
                              </span>
                            </div>
                            <span className="font-sans font-black text-[11px] text-slate-800 leading-snug" title={item.descricao}>
                              {item.descricao}
                            </span>
                            <span className="text-[8.5px] text-slate-400 uppercase font-semibold">
                              {item.embalagem || item.unidade} • Palete: {item.qtdPallet} cx
                            </span>
                            {item.estoqueTotalDisponivel === 0 && item.vendaCaixas > 0 ? (
                              <span className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 text-[8px] font-black uppercase rounded bg-rose-100 text-rose-800 border border-rose-300 w-fit">
                                <AlertOctagon className="w-2.5 h-2.5 text-rose-600" />
                                Ruptura Total no Picking
                              </span>
                            ) : item.estoqueInicialCaixas === 0 && item.vendaCaixas > 0 ? (
                              <span className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 text-[8px] font-black uppercase rounded bg-amber-100 text-amber-900 border border-amber-300 w-fit">
                                <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                                Sem Estoque Inicial no Picking
                              </span>
                            ) : null}
                          </div>
                        </td>

                        {/* 2. QUANTIDADE NO PICKING (PALLET & SKU/CX) */}
                        <td className="p-3.5 text-center font-mono bg-amber-50/15">
                          <div className="flex flex-col items-center justify-center gap-1">
                            {isEditMode ? (
                              <div className="flex flex-col items-center gap-1">
                                <div className="flex items-center gap-1">
                                  <input 
                                    type="number" 
                                    value={item.estoqueInicialCaixas === 0 ? '' : item.estoqueInicialCaixas}
                                    placeholder="0"
                                    onChange={(e) => handleUpdateValue(item.sku, 'estoqueInicialCaixas', parseInt(e.target.value, 10) || 0)}
                                    className="w-16 px-1 py-0.5 text-center text-[10.5px] font-black font-mono border border-amber-300 rounded focus:ring-1 focus:ring-amber-500 bg-amber-50 focus:outline-none"
                                    title="Editar contagem inicial no picking"
                                  />
                                  <span className="text-[9px] text-slate-600 font-bold">cx</span>
                                </div>
                                {item.estoqueInicialCaixas > 0 && (
                                  <span className="text-[8.5px] text-slate-400 font-medium uppercase">
                                    {Math.round((item.estoqueInicialCaixas / item.qtdPallet) * 10) / 10} PL (Inic)
                                  </span>
                                )}
                              </div>
                            ) : (
                              <>
                                <div className="flex items-baseline justify-center gap-1">
                                  <span className="text-sm font-black text-slate-900">
                                    {item.pickingDisponivelPaletes} <span className="text-[9px] text-amber-700 font-bold">PL</span>
                                  </span>
                                  <span className="text-slate-400 text-[10px] font-bold">/</span>
                                  <span className="text-[12px] font-black text-slate-800">
                                    {item.pickingDisponivelCaixas} <span className="text-[9px] text-slate-400 font-normal">cx</span>
                                  </span>
                                </div>
                                
                                {(item.estoqueInicialCaixas > 0 || item.abastecimento > 0) && (
                                  <div className="text-[8px] text-slate-400 flex items-center justify-center gap-1 font-semibold uppercase">
                                    {item.estoqueInicialCaixas > 0 && <span>Inic: {item.estoqueInicialCaixas} cx</span>}
                                    {item.abastecimento > 0 && (
                                      <span className="text-emerald-600 font-bold">+{item.abastecimento} cx</span>
                                    )}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </td>

                        {/* 3. SAÍDA (020304) */}
                        <td className="p-3.5 text-center font-mono bg-blue-50/15">
                          <div className="flex flex-col items-center justify-center">
                            {isEditMode ? (
                              <div className="flex flex-col items-center gap-1">
                                <div className="flex items-center gap-1">
                                  <input 
                                    type="number" 
                                    value={item.vendaCaixas}
                                    onChange={(e) => handleUpdateValue(item.sku, 'vendaCaixas', parseInt(e.target.value, 10) || 0)}
                                    className="w-16 px-1 py-0.5 text-center text-[10.5px] font-black font-mono border border-blue-300 rounded focus:ring-1 focus:ring-blue-500 bg-blue-50 focus:outline-none"
                                  />
                                  <span className="text-[9px] text-slate-600 font-bold">cx</span>
                                </div>
                                <span className="text-[8.5px] text-slate-400 font-medium uppercase">
                                  {item.vendaPaletes} PL
                                </span>
                              </div>
                            ) : (
                              <>
                                <span className="text-sm font-black text-blue-700">
                                  {item.vendaCaixas ? item.vendaCaixas.toLocaleString() : '—'} <span className="text-[9px] font-normal text-slate-400">cx</span>
                                </span>
                                {item.vendaCaixas > 0 && (
                                  <span className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">
                                    {item.vendaPaletes} PL • {item.vendaHecto.toFixed(1)} HL
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </td>

                        {/* 4. NECESSIDADE DE REABASTECER & ORIGEM */}
                        <td className="p-3.5 text-center font-mono bg-amber-50/15">
                          <div className="flex flex-col items-center justify-center gap-1.5 min-w-[250px]">
                            {item.vendaCaixas === 0 ? (
                              <span className="text-[9.5px] text-slate-400 font-medium">Sem Saída de Venda</span>
                            ) : item.statusMontagem === 'suficiente_picking' ? (
                              <div className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1.5 rounded-lg text-[9.5px] font-bold shadow-2xs w-full justify-center">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>Picking Suficiente (Sobra: +{item.saldoPicking} cx / +{Math.round((item.saldoPicking / item.qtdPallet) * 10) / 10} PL)</span>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-1.5 w-full">
                                <div className="text-[9px] text-rose-800 font-black bg-rose-100/90 border border-rose-300 rounded-lg px-2.5 py-1 flex items-center justify-between">
                                  <span>Necessidade de Reabastecer:</span>
                                  <span className="font-mono font-black">{Math.abs(item.saldoPicking)} cx ({Math.floor(Math.abs(item.saldoPicking) / item.qtdPallet)} PL + {Math.abs(item.saldoPicking) % item.qtdPallet} cx)</span>
                                </div>

                                {item.retiradasDetalhadas && item.retiradasDetalhadas.length > 0 ? (
                                  item.retiradasDetalhadas.map((r, rIdx) => (
                                    <div 
                                      key={rIdx} 
                                      className={`flex flex-col p-1.5 rounded-lg border text-[9.5px] ${
                                        r.areaId === 4 
                                          ? 'bg-purple-50 border-purple-300 text-purple-950' 
                                          : r.areaId === 1 
                                            ? 'bg-amber-50 border-amber-300 text-amber-950'
                                            : r.areaId === 3
                                              ? 'bg-orange-50 border-orange-300 text-orange-950'
                                              : 'bg-cyan-50 border-cyan-300 text-cyan-950'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between font-black">
                                        <span className="flex items-center gap-1">
                                          {r.areaId === 4 && '🟣'}
                                          {r.areaId === 1 && '🟡'}
                                          {r.areaId === 3 && '🟠'}
                                          {r.areaId === 5 && '🔵'}
                                          Retirar {r.areaCodigo} ({r.areaNome})
                                        </span>
                                        <span className="font-mono text-[9px] bg-white/80 px-1.5 py-0.5 rounded border border-black/10">
                                          {r.caixas} cx total
                                        </span>
                                      </div>
                                      <div className="text-[8.5px] font-bold mt-0.5 text-left pl-4">
                                        {r.palletsFechados > 0 && (
                                          <span className="underline decoration-black/20">
                                            {r.palletsFechados} Palete(s) Fechado(s) ({r.palletsFechados * item.qtdPallet} cx)
                                          </span>
                                        )}
                                        {r.palletsFechados > 0 && r.skuFracionado > 0 && <span> + </span>}
                                        {r.skuFracionado > 0 && (
                                          <span className="text-rose-800">
                                            {r.skuFracionado} cx avulsas (SKU)
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))
                                ) : null}

                                {item.rupturaCaixas > 0 && (
                                  <div className="flex flex-col bg-rose-100/80 border border-rose-400 p-1.5 rounded-lg text-rose-950 text-[9px] font-black">
                                    <div className="flex items-center gap-1">
                                      <AlertOctagon className="w-3 h-3 text-rose-600 shrink-0" />
                                      <span>Ruptura de Armazém: Faltam {item.rupturaCaixas} cx</span>
                                    </div>
                                    <span className="text-[8px] text-rose-800 font-bold pl-4">
                                      ({Math.floor(item.rupturaCaixas / item.qtdPallet)} PL fechado + {item.rupturaCaixas % item.qtdPallet} cx avulsa)
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* 5. STATUS */}
                        <td className="p-3.5 text-right">
                          {item.status === 'ok' ? (
                            <div className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider">
                              <CheckCircle2 className="w-3 h-3" />
                              Estoque OK
                            </div>
                          ) : item.status === 'attention' ? (
                            <div className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider">
                              <AlertCircle className="w-3 h-3" />
                              Atenção
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1 bg-rose-50 border border-rose-200 text-rose-700 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider">
                              <AlertCircle className="w-3 h-3 text-rose-600" />
                              Crítico
                            </div>
                          )}
                        </td>

                      </tr>
                    );
                  })}
                  {filteredSkus.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400 font-mono text-[10px] uppercase bg-white">
                        Nenhum produto atende aos filtros aplicados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Detailed Guidelines Legend */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  <strong>Diretriz de Montagem:</strong> Paletes fechados devem ser carregados diretamente do Central (Área 1) ou Marketplace (Área 3) para evitar saturação do picking. Itens em déficit de montagem requerem reabastecimento imediato no picking.
                </span>
              </div>
              <div className="flex flex-wrap gap-4 font-bold uppercase text-[9px]">
                <span className="flex items-center gap-1 text-emerald-600">🟢 Picking Suficiente</span>
                <span className="flex items-center gap-1 text-amber-600">🟡 Carregar do Central</span>
                <span className="flex items-center gap-1 text-orange-600">🟠 Carregar do Marketplace</span>
                <span className="flex items-center gap-1 text-rose-600">🔴 Reabastecer Picking</span>
              </div>
            </div>

          </div>
        </>
      )}

    </div>
  );
}
