import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { 
  BarChart, 
  ComposedChart,
  Line,
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
  LabelList,
  Legend
} from 'recharts';
import { 
  AlertTriangle, 
  Users, 
  Truck, 
  Package, 
  BarChart2, 
  PieChart as PieIcon, 
  Layers, 
  RefreshCw, 
  TrendingUp,
  Award,
  Filter,
  FileText,
  Search,
  Download,
  List,
  Edit3,
  Pencil,
  Check,
  X,
  Sliders,
  UserCheck,
  Briefcase,
  ShieldAlert,
  ChevronRight,
  Database
} from 'lucide-react';
import { QuebraRow } from '../types';
import CalendarFilter from './CalendarFilter';
import { PRODUCTS } from '../planosData';
import { PRODUCT_MASTER_DATA, PRODUCT_MASTER_MAP, findProductMaster } from '../data/productMasterData';
import { useEmpresaData } from '../context/EmpresaDataContext';
import { firestoreDb } from '../database/firestoreDatabase';
import { COLABORADORES_QUEBRA } from './QuebrasPanel';
import { normalizeCollaboratorName } from '../utils/colaboradorUtils';
import { LISTA_COLABORADORES_OFICIAIS } from './RankingModule';
import { buildOfficialQuebrasRows } from '../utils/retroactiveQuebrasParser';

interface WqiTabProps {
  empresaId: string;
  startDate: string;
  endDate: string;
  onDateChange: (start: string, end: string) => void;
  viewUnit: 'rs' | 'hl' | 'sku';
  theme?: 'light' | 'dark';
  initialFilterMotivo?: string;
  initialFilterArea?: string;
  initialFilterEmbalagem?: string;
  initialFilterColaborador?: string;
}

const COLORS = ['#032b5e', '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

// Helper to resolve collaborator and function
export interface CollaboratorResolvedInfo {
  nome: string;
  funcao: string;
  badgeClass: string;
}

// 3 OPERADORES OFICIAIS DE EMPILHADEIRA DO ARMAZÉM GUARABIRA:
// 1. Marivaldo Artur Alves
// 2. Paulo Pereira da Silva
// 3. José Ronildo da Silva
export const EMPILHADORES_OFICIAIS = [
  'MARIVALDO ARTUR ALVES',
  'PAULO PEREIRA DA SILVA',
  'JOSE RONILDO DA SILVA'
];

export function isEmpilhadorOficial(name: string): boolean {
  if (!name) return false;
  const n = name.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  if (n.includes('MARIVALDO')) return true;
  if (n.includes('PAULO PEREIRA') || (n.startsWith('PAULO') && (n.includes('SILVA') || n.split(' ').length <= 2))) return true;
  if (n.includes('RONILDO') || n.includes('JOSE RONILDO') || n.includes('JOSÉ RONILDO') || n.includes('ROMILDO')) return true;
  return false;
}

export function resolveCollaboratorAndFunction(q: Partial<QuebraRow>): CollaboratorResolvedInfo {
  const rawColab = (q.colaboradorQuebrou || q.responsavel || (q as any).colaborador || (q as any).operador || (q as any).ajudante || (q as any).empilhador || '').trim();
  const normName = normalizeCollaboratorName(rawColab);
  const hasColab = Boolean(normName && normName !== 'NÃO INFORMADO' && normName !== 'NÃO IDENTIFICADO' && normName !== '—');
  
  let resolvedNome = hasColab ? normName : 'NÃO INFORMADO';
  let rawFunc = '';

  if (!hasColab) {
    rawFunc = 'NÃO INFORMADO';
  } else if (isEmpilhadorOficial(normName) || isEmpilhadorOficial(rawColab)) {
    rawFunc = 'EMPILHADOR';
    if (normName.includes('MARIVALDO')) resolvedNome = 'MARIVALDO ARTUR ALVES';
    else if (normName.includes('PAULO')) resolvedNome = 'PAULO PEREIRA DA SILVA';
    else if (normName.includes('RONILDO') || normName.includes('ROMILDO')) resolvedNome = 'JOSE RONILDO DA SILVA';
  } else {
    // 1. Check against official master roster
    const match = LISTA_COLABORADORES_OFICIAIS.find(c => {
      const cNorm = normalizeCollaboratorName(c.nome);
      return cNorm === normName || c.nome.toUpperCase() === normName || (normName && c.nome.toUpperCase().includes(normName));
    });

    if (match && match.cargo) {
      const cargoUpper = match.cargo.toUpperCase();
      if (cargoUpper.includes('EMPILHA')) {
        rawFunc = isEmpilhadorOficial(match.nome) ? 'EMPILHADOR' : 'AJUDANTE';
      } else if (cargoUpper.includes('CONFEREN')) {
        rawFunc = 'CONFERENTE';
      } else if (cargoUpper.includes('ADMIN')) {
        rawFunc = 'ADMINISTRATIVO';
      } else {
        rawFunc = 'AJUDANTE';
      }
    } else {
      // 2. Non-empilhador warehouse staff
      const areaUpper = (q.area || '').toUpperCase();
      const cod = String(q.codQuebra || '').trim();
      if (areaUpper === 'CONFERÊNCIA' || areaUpper === 'CONFERENCIA' || cod === '589') {
        rawFunc = 'CONFERENTE';
      } else {
        rawFunc = 'AJUDANTE';
      }
    }
  }

  let badgeClass = 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800';
  if (rawFunc === 'EMPILHADOR') {
    badgeClass = 'bg-indigo-100 text-indigo-900 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800';
  } else if (rawFunc === 'AJUDANTE') {
    badgeClass = 'bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800';
  } else if (rawFunc === 'CONFERENTE') {
    badgeClass = 'bg-emerald-100 text-emerald-900 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800';
  } else if (rawFunc.includes('ADMIN')) {
    badgeClass = 'bg-purple-100 text-purple-900 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800';
  } else if (rawFunc.includes('SEPARADOR') || rawFunc.includes('PICKING')) {
    badgeClass = 'bg-teal-100 text-teal-900 border-teal-200 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800';
  } else {
    badgeClass = 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
  }

  return {
    nome: resolvedNome,
    funcao: rawFunc,
    badgeClass
  };
}

// Motives that NEVER count as WQI (shortages, inventory discrepancies, theft, expiration, quality deviations)
export const isWqiExclusion = (q: Partial<QuebraRow>): boolean => {
  const cod = String(q.codQuebra || '').trim();
  const motivoUpper = (q.motivo || '').toUpperCase();

  // Codes for shortage / inventory discrepancy / theft / expiration / quality
  if (['524', '546', '564', '576'].includes(cod)) return true; // FALTA NO PALETE
  if (['538', '540', '536', '542', '560', '520'].includes(cod)) return true; // DIFERENÇA DE ESTOQUE / INVENTÁRIO / INVERSÃO
  if (['528', '550', '568', '580'].includes(cod)) return true; // FURTO
  if (['533', '554', '573', '585'].includes(cod)) return true; // VENCIDO
  if (['531', '552', '571', '583'].includes(cod)) return true; // SEM GÁS
  if (['534', '555', '574'].includes(cod)) return true; // SEM TAMPA
  if (['527', '549', '567', '579'].includes(cod)) return true; // IMPUREZA
  if (['532', '553', '572', '584'].includes(cod)) return true; // MAL CHEIO
  if (['529', '569', '581'].includes(cod)) return true; // TROCA

  // String keywords to exclude (e.g. FALTA NO PALETE never enters WQI)
  if (
    motivoUpper.includes('FALTA NO PALETE') ||
    motivoUpper.includes('FALTA NO PALLET') ||
    motivoUpper.includes('FALTA DE PRODUTO') ||
    motivoUpper.includes('FALTA') ||
    motivoUpper.includes('INVENTÁRIO') ||
    motivoUpper.includes('INVENTARIO') ||
    motivoUpper.includes('DIFERENÇA') ||
    motivoUpper.includes('DIFERENCA') ||
    motivoUpper.includes('FURTO') ||
    motivoUpper.includes('VENCID') ||
    motivoUpper.includes('VALIDADE') ||
    motivoUpper.includes('CONSUMO') ||
    motivoUpper.includes('SEM GAS') ||
    motivoUpper.includes('SEM GÁS') ||
    motivoUpper.includes('IMPUREZA') ||
    motivoUpper.includes('MAL CHEIO') ||
    motivoUpper.includes('SEM TAMPA') ||
    motivoUpper.includes('TROCA')
  ) {
    return true;
  }

  return false;
};

// Helper to classify Quebra por Movimentação no Armazém (Strict DPO WQI Warehouse Movement)
export const isQuebraMovimentacaoArmazem = (q: QuebraRow): boolean => {
  // 1. Strict exclusions (e.g. Falta no Palete, Vencido, Inventário)
  if (isWqiExclusion(q)) return false;

  const cod = String(q.codQuebra || '').trim();
  const motivoUpper = (q.motivo || '').toUpperCase();
  const areaUpper = (q.area || '').toUpperCase();

  // DPO specific codes for warehouse movement breakages (539 = Quebra com Movimentação, 557 = Entrega, 589 = Puxada, 537 = Quebra Picking, 525 = Quebrada, 521 = Acidente, 535 = Mal Chapeada)
  if (['539', '537', '525', '521', '535', '557', '589'].includes(cod)) return true;

  // Motive strings containing warehouse movement keywords
  if (
    motivoUpper.includes('MOVIMENTA') || 
    motivoUpper.includes('MOVIMENTAÇÃO') ||
    motivoUpper.includes('MOVIMENTACAO') ||
    motivoUpper.includes('MANUSEIO') || 
    motivoUpper.includes('CHOQUE') || 
    motivoUpper.includes('TOMBADA') ||
    motivoUpper.includes('QUEDA') ||
    motivoUpper.includes('EMPILHADEIRA') ||
    motivoUpper.includes('PICKING')
  ) {
    return true;
  }

  const isArmazemArea = areaUpper === 'ARMAZEM' || areaUpper === 'ARMAZÉM' || areaUpper === '' || areaUpper === 'DEPÓSITO' || areaUpper === 'DEPOSITO' || areaUpper === 'PICKING' || areaUpper === 'PUXADA';

  // If area is Armazém or Puxada and has general breakage classification
  if (isArmazemArea) {
    if (motivoUpper.includes('QUEBRADA') || motivoUpper.includes('QUEBRA') || motivoUpper.includes('AVARIA')) {
      return true;
    }
  }

  return false;
};

// Helper to classify embalagem
export const getEmbalagemName = (desc: string): string => {
  const d = (desc || '').toUpperCase();
  if (d.includes('600')) return 'Garrafa 600ml';
  if (d.includes('300') || d.includes('RF') || d.includes('ROMANI') || d.includes('RETORNÁVEL') || d.includes('RETORNAVEL')) return 'Garrafa 300ml';
  if (d.includes('473') || d.includes('LATÃO') || d.includes('LATAO') || d.includes('SLEEK')) return 'Lata 473ml';
  if (d.includes('350') || d.includes('355') || d.includes('269') || d.includes('LATA') || d.includes('LT')) return 'Lata 350ml/269ml';
  if (d.includes('LN') || d.includes('LONG') || d.includes('330') || d.includes('275')) return 'Long Neck';
  if (d.includes('1L') || d.includes('1 L') || d.includes('LITRÃO') || d.includes('LITRAO') || d.includes('1000')) return 'Garrafa 1L';
  if (d.includes('PET') || d.includes('2L') || d.includes('1.5L')) return 'PET';
  return 'Outras Embalagens';
}// Fast memoization caches for factors and prices
const hlFactorCache = new Map<string, number>();
const unitPriceCache = new Map<string, number>();

// Helper to calculate HL factor and HL volume for individual items
export const getItemHlInfo = (r: Partial<QuebraRow>) => {
  const qty = Number(r.quantidade) || 0;
  
  const cacheKey = `${r.codProduto || ''}_${r.descricao || ''}_${r.embalagem || ''}_${r.fatorHl || ''}`;
  let fator = hlFactorCache.get(cacheKey);

  if (fator === undefined) {
    fator = 0;
    // 1. Primary lookup in PRODUCT_MASTER_DATA by codProduto or description
    let pm: any;
    if (r.codProduto) {
      const codeClean = String(r.codProduto).trim().replace(/^0+/, '');
      const num = parseInt(codeClean, 10);
      if (!isNaN(num)) {
        pm = PRODUCT_MASTER_MAP.get(num) || PRODUCT_MASTER_DATA.find(p => p.cod === num);
      }
    }
    if (!pm && r.descricao) {
      pm = findProductMaster(r.descricao);
    }

    if (pm && pm.fator > 0 && pm.fatorHecto > 0) {
      // Unit hectoliter = SKU_FATOR_HECTO / SKU_FATOR
      fator = pm.fatorHecto / pm.fator;
    }

    // 2. Lookup in PRODUCTS catalog by code
    if (fator <= 0 && r.codProduto) {
      const codeStr = String(r.codProduto).trim();
      const codeClean = codeStr.replace(/^0+/, '');
      const match = PRODUCTS.find(p => String(p.codigo) === codeClean || String(p.codigo) === codeStr);
      if (match) {
        if (match.fatorHectoPorUnidade && match.fatorHectoPorUnidade > 0) {
          fator = match.fatorHectoPorUnidade;
        } else if (match.fatorHecto && match.fator) {
          fator = match.fatorHecto / match.fator;
        }
      }
    }

    // 3. Explicit r.fatorHl (only if valid unit factor <= 0.05)
    if (fator <= 0 && r.fatorHl && Number(r.fatorHl) > 0) {
      const fNum = Number(r.fatorHl);
      if (fNum <= 0.05) {
        fator = fNum;
      } else {
        fator = fNum / (pm?.fator || 12);
      }
    }

    // 4. Fallback: Parse description / packaging volume
    if (fator <= 0) {
      const desc = (String(r.descricao || '') + ' ' + String(r.embalagem || '')).toUpperCase();
      if (desc.includes('2,5L') || desc.includes('2.5L') || desc.includes('2,5 L') || desc.includes('2.5 L')) {
        fator = 0.025; // 2.5 L = 0.025 HL
      } else if (desc.includes('2L') || desc.includes('2 L') || desc.includes('PET 2')) {
        fator = 0.02; // 2 L = 0.02 HL
      } else if (desc.includes('1,5L') || desc.includes('1.5L') || desc.includes('1,5 L') || desc.includes('1.5 L')) {
        fator = 0.015; // 1.5 L = 0.015 HL
      } else if (desc.includes('1L') || desc.includes('1 L') || desc.includes('1000ML') || desc.includes('1000 ML') || desc.includes('1000')) {
        fator = 0.01; // 1 L = 0.01 HL
      } else if (desc.includes('900ML') || desc.includes('900 ML') || desc.includes('965ML')) {
        fator = 0.009; // 900 ml = 0.009 HL
      } else if (desc.includes('750ML') || desc.includes('750 ML') || desc.includes('750')) {
        fator = 0.0075; // 750 ml = 0.0075 HL
      } else if (desc.includes('600ML') || desc.includes('600 ML') || desc.includes('600')) {
        fator = 0.006; // 600 ml = 0.006 HL
      } else if (desc.includes('510ML') || desc.includes('510 ML')) {
        fator = 0.0051; // 510 ml = 0.0051 HL
      } else if (desc.includes('500ML') || desc.includes('500 ML') || desc.includes('500')) {
        fator = 0.005; // 500 ml = 0.005 HL
      } else if (desc.includes('473ML') || desc.includes('473 ML') || desc.includes('473') || desc.includes('LATÃO') || desc.includes('LATAO')) {
        fator = 0.00473; // 473 ml = 0.00473 HL
      } else if (desc.includes('355ML') || desc.includes('355 ML') || desc.includes('355')) {
        fator = 0.00355; // 355 ml = 0.00355 HL
      } else if (desc.includes('350ML') || desc.includes('350 ML') || desc.includes('350')) {
        fator = 0.0035; // 350 ml = 0.0035 HL
      } else if (desc.includes('330ML') || desc.includes('330 ML') || desc.includes('330') || desc.includes('LN') || desc.includes('LONG')) {
        fator = 0.0033; // 330 ml = 0.0033 HL
      } else if (desc.includes('300ML') || desc.includes('300 ML') || desc.includes('300') || desc.includes('ROMARINHO') || desc.includes('KS')) {
        fator = 0.003; // 300 ml = 0.003 HL
      } else if (desc.includes('275ML') || desc.includes('275 ML') || desc.includes('275')) {
        fator = 0.00275; // 275 ml = 0.00275 HL
      } else if (desc.includes('269ML') || desc.includes('269 ML') || desc.includes('269')) {
        fator = 0.00269; // 269 ml = 0.00269 HL
      } else if (desc.includes('250ML') || desc.includes('250 ML') || desc.includes('250')) {
        fator = 0.0025; // 250 ml = 0.0025 HL
      } else if (desc.includes('210ML') || desc.includes('210 ML')) {
        fator = 0.0021; // 210 ml = 0.0021 HL
      } else if (desc.includes('200ML') || desc.includes('200 ML') || desc.includes('200')) {
        fator = 0.002; // 200 ml = 0.002 HL
      } else {
        fator = 0.0035; // Standard default factor (~350ml)
      }
    }
    hlFactorCache.set(cacheKey, fator);
  }

  const totalHl = qty * fator;

  return {
    fatorHl: fator,
    fatorHlStr: fator.toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 5 }),
    totalHl: Math.round(totalHl * 10000) / 10000,
    totalHlStr: (Math.round(totalHl * 10000) / 10000).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
  };
};

// Helper to get real monetary value (in R$) for a item based on row or product catalog
export function getItemValorReal(q: Partial<QuebraRow>): number {
  const qty = Number(q.quantidade) || 0;
  if (qty <= 0) return 0;

  // 1. Se a linha já tem valorTotal ou valor registrado explicitamente (ex: dataset oficial auditado)
  if (q.valorTotal !== undefined && q.valorTotal !== null && Number(q.valorTotal) > 0) {
    return Number(q.valorTotal);
  }
  if (q.valor !== undefined && q.valor !== null && Number(q.valor) > 0) {
    return Number(q.valor);
  }
  if (q.valorUnitario !== undefined && q.valorUnitario !== null && Number(q.valorUnitario) > 0) {
    return Number(q.valorUnitario) * qty;
  }

  const priceKey = `${q.codProduto || ''}_${q.descricao || ''}`;
  let unitPrice = unitPriceCache.get(priceKey);

  if (unitPrice === undefined) {
    // 2. Lookup in PRODUCT_MASTER_DATA by codProduto or description
    let pm: any;
    if (q.codProduto) {
      const codeClean = String(q.codProduto).trim().replace(/^0+/, '');
      const num = parseInt(codeClean, 10);
      if (!isNaN(num)) {
        pm = PRODUCT_MASTER_MAP.get(num) || PRODUCT_MASTER_DATA.find(p => p.cod === num);
      }
    }
    if (!pm && q.descricao) {
      pm = findProductMaster(q.descricao);
    }

    let catalogUnitPrice = 0;
    if (pm && pm.fator > 0 && pm.valor > 0) {
      // Unit price = SKU_VALOR / SKU_FATOR
      catalogUnitPrice = pm.valor / pm.fator;
    } else if (q.codProduto || q.descricao) {
      const codeClean = String(q.codProduto || '').replace(/^0+/, '');
      const match = PRODUCTS.find(p => String(p.codigo) === codeClean || (q.descricao && p.descricao && p.descricao.toUpperCase().trim() === String(q.descricao).toUpperCase().trim()));
      if (match) {
        const p = match as any;
        const casePrice = p.preco || p.valor || 0;
        const fator = p.fator || 1;
        if (casePrice > 0) {
          catalogUnitPrice = casePrice / fator;
        }
      }
    }

    if (catalogUnitPrice > 0) {
      unitPrice = catalogUnitPrice;
    } else {
      unitPrice = 3.50;
    }

    unitPriceCache.set(priceKey, unitPrice);
  }

  return unitPrice * qty;
}

// 3-way unit value getter
export function getValorPorUnidade(q: Partial<QuebraRow>, viewUnit: 'rs' | 'hl' | 'sku'): number {
  if (viewUnit === 'sku') return Number(q.quantidade) || 0;
  if (viewUnit === 'hl') return getItemHlInfo(q).totalHl;
  return getItemValorReal(q);
}

// Helper to classify Quebra por Movimentação (General movement across all areas, excluding shortages)
export const isQuebraMovimentacao = (q: QuebraRow): boolean => {
  if (isWqiExclusion(q)) return false;

  const cod = String(q.codQuebra || '').trim();
  const motivoUpper = (q.motivo || '').toUpperCase();

  // DPO specific codes for movement breakages (539 = Armazém, 557 = Entrega, 589 = Puxada, 537 = Picking)
  if (['539', '557', '589', '537', '525'].includes(cod)) return true;

  // Motive strings containing movement / handling keywords
  if (
    motivoUpper.includes('MOVIMENTA') || 
    motivoUpper.includes('MANUSEIO') || 
    motivoUpper.includes('PICKING') || 
    motivoUpper.includes('TOMBADA') ||
    motivoUpper.includes('CHOQUE') ||
    motivoUpper.includes('QUEDA') ||
    motivoUpper.includes('EMPILHADEIRA')
  ) {
    return true;
  }

  return false;
};

// Month Label Helper (e.g. '2026-07' -> 'Jul/26')
const getMonthLabel = (dateStr: string) => {
  if (!dateStr) return 'Sem Data';
  const clean = dateStr.split('T')[0];
  const parts = clean.split('-');
  if (parts.length < 2) return 'Sem Data';
  const year = parts[0].slice(2);
  const monthIdx = parseInt(parts[1], 10) - 1;
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${months[monthIdx] || parts[1]}/${year}`;
};

export default function WqiTab({
  empresaId,
  startDate,
  endDate,
  onDateChange,
  viewUnit,
  theme = 'light',
  initialFilterMotivo,
  initialFilterArea,
  initialFilterEmbalagem,
  initialFilterColaborador
}: WqiTabProps) {
  const isDark = theme === 'dark';
  const [data, setData] = useState<QuebraRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterArea, setFilterArea] = useState<string>(initialFilterArea || 'TODAS');
  const [filterEmbalagem, setFilterEmbalagem] = useState<string>(initialFilterEmbalagem || 'TODAS');
  const [filterTipoQuebra, setFilterTipoQuebra] = useState<string>('MOVIMENTACAO_TODAS');
  const [filterMotivo, setFilterMotivo] = useState<string>(initialFilterMotivo || 'TODOS');
  const [filterFuncao, setFilterFuncao] = useState<string>('TODAS');
  const [filterColaborador, setFilterColaborador] = useState<string>(initialFilterColaborador || 'TODOS');

  useEffect(() => {
    if (initialFilterMotivo !== undefined) setFilterMotivo(initialFilterMotivo);
  }, [initialFilterMotivo]);

  useEffect(() => {
    if (initialFilterArea !== undefined) setFilterArea(initialFilterArea);
  }, [initialFilterArea]);

  useEffect(() => {
    if (initialFilterEmbalagem !== undefined) setFilterEmbalagem(initialFilterEmbalagem);
  }, [initialFilterEmbalagem]);

  useEffect(() => {
    if (initialFilterColaborador !== undefined) setFilterColaborador(initialFilterColaborador);
  }, [initialFilterColaborador]);

  // State for Dedicated Records Card (Card 6)
  const [recordsSearchQuery, setRecordsSearchQuery] = useState<string>('');
  const [recordsFilterProduto, setRecordsFilterProduto] = useState<string>('TODOS');
  const [recordsFilterEmbalagem, setRecordsFilterEmbalagem] = useState<string>('TODAS');
  const [recordsFilterFuncao, setRecordsFilterFuncao] = useState<string>('TODAS');

  const empresaData = useEmpresaData();

  // Sweeper: Full scan across Firestore Context, LocalStorage & Official Pre-loaded Datasets
  const fetchWqiData = () => {
    setLoading(true);
    const companyId = empresaId || 'demo';
    const officialRows = buildOfficialQuebrasRows(companyId);
    const officialIds = new Set(officialRows.map(r => String(r.id || r._docId)));

    const customRows: QuebraRow[] = [];
    const seenCustomKeys = new Set<string>();

    const addCustomIfNew = (item: QuebraRow) => {
      if (!item) return;
      const idStr = String(item.id || item._docId || '');
      if (idStr && (officialIds.has(idStr) || idStr.startsWith('qb-retro-'))) return;
      const bizKey = `${item.dataISO || item.data || ''}_${item.codProduto || ''}_${item.colaborador || item.colaboradorQuebrou || item.responsavel || ''}_${item.area || ''}_${item.quantidade || 0}`;
      if (seenCustomKeys.has(bizKey)) return;
      seenCustomKeys.add(bizKey);
      customRows.push(item);
    };

    // 1. From empresaData.quebras (Firestore / Context)
    if (empresaData.quebras && empresaData.quebras.length > 0) {
      empresaData.quebras.forEach(addCustomIfNew);
    }

    // 2. From LocalStorage custom keys
    const lsKeys = [
      `custom_quebras_${companyId}`,
      `quebras_${companyId}`,
      `quebras_records_${companyId}`,
      `local_quebras_${companyId}`,
      `quebras_manual_entries_${companyId}`
    ];
    lsKeys.forEach(k => {
      const savedCustom = localStorage.getItem(k);
      if (savedCustom) {
        try {
          const parsed = JSON.parse(savedCustom);
          if (Array.isArray(parsed)) {
            parsed.forEach(addCustomIfNew);
          }
        } catch (_) {}
      }
    });

    // 3. From DTO Diagnóstico Histórico (DTO de Quebras / Operações)
    const rawDto = localStorage.getItem('armazem_dto_historico_registros_v1');
    if (rawDto) {
      try {
        const parsedDto = JSON.parse(rawDto);
        if (Array.isArray(parsedDto)) {
          parsedDto
            .filter((d: any) => d.operacaoId === 'quebras' || d.modulo === 'quebras' || (d.tipo && String(d.tipo).toLowerCase().includes('quebra')))
            .forEach((dto: any) => {
              const colabName = dto.operadorNome || dto.colaborador || dto.usuarioNome || dto.auditorNome || 'NÃO IDENTIFICADO';
              const qtd = Number(dto.itensContados || dto.quantidade || 1);
              const desc = dto.produtoDescricao || dto.descricao || 'PRODUTO NÃO ESPECIFICADO';
              const cod = dto.codProduto || dto.codigo || '539';
              const dataRaw = dto.dataHoraISO || dto.dataISO || new Date().toISOString();
              const dFormatted = dataRaw.includes('T') ? dataRaw.split('T')[0].split('-').reverse().join('/') : dataRaw;

              addCustomIfNew({
                id: `dto-qb-${dto.id || Math.random().toString(36).substring(7)}`,
                data: dFormatted,
                dataISO: dataRaw,
                codProduto: cod,
                descricao: desc,
                quantidade: qtd,
                motivo: dto.motivo || 'QUEBRA COM MOVIMENTAÇÃO',
                codQuebra: dto.codQuebra || '539',
                area: (dto.area && ['ARMAZEM', 'ENTREGA', 'MERCADO', 'PUXADA'].includes(dto.area)) ? dto.area : 'ARMAZEM',
                turno: dto.turno || 'MANHÃ',
                colaborador: colabName,
                colaboradorQuebrou: colabName,
                responsavel: colabName,
                origem: 'DTO_DIAGNOSTICO'
              });
            });
        }
      } catch (_) {}
    }

    const rows = customRows.length > 0 ? [...customRows, ...officialRows] : [...officialRows];

    // Enrich rows with resolved collaborator & function
    const allRows = rows.map(q => {
      const colabInfo = resolveCollaboratorAndFunction(q);
      return {
        ...q,
        colaboradorQuebrou: colabInfo.nome !== 'NÃO INFORMADO' ? colabInfo.nome : (q.colaboradorQuebrou || q.responsavel || (q as any).colaborador || ''),
        responsavel: colabInfo.nome !== 'NÃO INFORMADO' ? colabInfo.nome : (q.responsavel || q.colaboradorQuebrou || (q as any).colaborador || ''),
        funcao: colabInfo.funcao
      };
    });

    allRows.sort((a, b) => (b.dataISO || '').localeCompare(a.dataISO || ''));
    setData(allRows);
    setLoading(false);
  };

  useEffect(() => {
    fetchWqiData();

    const handleUpdate = () => fetchWqiData();
    window.addEventListener('quebras-db-updated', handleUpdate);
    window.addEventListener('quebras-updated', handleUpdate);
    window.addEventListener('repack-db-updated', handleUpdate);
    window.addEventListener('despejo-db-updated', handleUpdate);
    window.addEventListener('dto_historico_updated', handleUpdate);
    window.addEventListener('retroactive-data-updated', handleUpdate);
    window.addEventListener('empresa-data-reload', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('quebras-db-updated', handleUpdate);
      window.removeEventListener('quebras-updated', handleUpdate);
      window.removeEventListener('repack-db-updated', handleUpdate);
      window.removeEventListener('despejo-db-updated', handleUpdate);
      window.removeEventListener('dto_historico_updated', handleUpdate);
      window.removeEventListener('retroactive-data-updated', handleUpdate);
      window.removeEventListener('empresa-data-reload', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [empresaData.quebras, empresaData.loaded, empresaId]);

  const availableWqiMotivos = useMemo(() => {
    const map = new Map<string, string>();
    data.forEach(q => {
      const cod = String(q.codQuebra || '').trim();
      const mot = (q.motivo || '').trim();
      if (cod && mot) {
        map.set(cod, `[${cod}] ${mot}`);
      } else if (mot) {
        map.set(mot, mot);
      } else if (cod) {
        map.set(cod, `Código ${cod}`);
      }
    });

    if (!map.has('539')) map.set('539', '[539] Quebra com Movimentação');
    if (!map.has('540')) map.set('540', '[540] Avaria Física / Manuseio');
    if (!map.has('541')) map.set('541', '[541] Choque de Palete');
    if (!map.has('557')) map.set('557', '[557] Quebra na Entrega / Rota');
    if (!map.has('589')) map.set('589', '[589] Quebra em Transferência');

    return Array.from(map.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [data]);

  // Distinct Collaborators with their Functions
  const availableColaboradoresList = useMemo(() => {
    const map = new Map<string, { nome: string; funcao: string }>();
    
    // Official list baseline
    LISTA_COLABORADORES_OFICIAIS.forEach(c => {
      const norm = normalizeCollaboratorName(c.nome);
      map.set(norm, { nome: norm, funcao: (c.cargo || 'OPERADOR').toUpperCase() });
    });

    if (Array.isArray(COLABORADORES_QUEBRA)) {
      COLABORADORES_QUEBRA.forEach(c => {
        if (c && c.trim()) {
          const norm = normalizeCollaboratorName(c);
          if (!map.has(norm)) {
            const info = resolveCollaboratorAndFunction({ responsavel: norm });
            map.set(norm, { nome: norm, funcao: info.funcao });
          }
        }
      });
    }

    data.forEach(q => {
      const info = resolveCollaboratorAndFunction(q);
      if (info.nome && info.nome !== 'NÃO INFORMADO') {
        map.set(info.nome, { nome: info.nome, funcao: info.funcao });
      }
    });

    return Array.from(map.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [data]);

  // Distinct Functions list
  const availableFuncoesList = useMemo(() => {
    const set = new Set<string>();
    availableColaboradoresList.forEach(c => {
      if (c.funcao) set.add(c.funcao);
    });
    set.add('EMPILHADOR');
    set.add('AJUDANTE');
    set.add('CONFERENTE');
    set.add('SEPARADOR');
    set.add('ADMINISTRATIVO');
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [availableColaboradoresList]);

  // Client-side filtering by Date, Context, Area, Embalagem, Motivo, Função, Colaborador
  const filteredData = useMemo(() => {
    return data.filter(q => {
      const cod = String(q.codQuebra || '').trim();
      const mot = (q.motivo || '').trim().toUpperCase();

      // 1. Motivo filter
      if (filterMotivo !== 'TODOS') {
        const filterUpper = filterMotivo.toUpperCase();
        const is539Target = filterMotivo === '539' || filterUpper.includes('539') || filterUpper.includes('MOVIMENTA');
        
        if (is539Target) {
          const match539 = cod === '539' || cod === '557' || cod === '589' || mot.includes('MOVIMENTAÇÃO') || mot.includes('MOVIMENTACAO') || mot.includes('MOVIMENTA');
          if (!match539) return false;
        } else {
          const match = cod === filterMotivo || mot === filterUpper || mot.includes(filterUpper) || `${cod} - ${q.motivo}`.toUpperCase().includes(filterUpper);
          if (!match) return false;
        }
      } else {
        // Only apply Tipo de Quebra when not explicitly filtering by a specific single Motivo
        if (filterTipoQuebra === 'MOVIMENTACAO_ARMAZEM') {
          if (!isQuebraMovimentacaoArmazem(q)) return false;
        } else if (filterTipoQuebra === 'MOVIMENTACAO_TODAS') {
          if (!isQuebraMovimentacao(q)) return false;
        }
      }

      // 2. Area filter
      if (filterArea !== 'TODAS' && q.area !== filterArea) return false;

      // 3. Embalagem filter
      const embName = q.embalagem || getEmbalagemName(q.descricao);
      if (filterEmbalagem !== 'TODAS' && embName !== filterEmbalagem) return false;

      // 4. Função / Cargo filter
      const colabInfo = resolveCollaboratorAndFunction(q);
      if (filterFuncao !== 'TODAS') {
        if (!colabInfo.funcao.includes(filterFuncao.toUpperCase())) return false;
      }

      // 5. Colaborador (Quem Quebrou) filter
      if (filterColaborador !== 'TODOS') {
        const filterNorm = normalizeCollaboratorName(filterColaborador);
        if (colabInfo.nome !== filterNorm) return false;
      }

      // 6. Date range filter
      if (startDate || endDate) {
        let rowISO = '';
        if (q.dataISO) {
          rowISO = q.dataISO.split('T')[0];
        } else if (q.data) {
          const parts = q.data.split('/');
          if (parts.length === 3) rowISO = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        if (startDate && rowISO && rowISO < startDate) return false;
        if (endDate && rowISO && rowISO > endDate) return false;
      }
      return true;
    });
  }, [data, startDate, endDate, filterTipoQuebra, filterArea, filterEmbalagem, filterMotivo, filterFuncao, filterColaborador]);

  // Statistical aggregation of operators who broke items (Quem Quebrou e Função)
  const collaboratorAnalysis = useMemo(() => {
    const map = new Map<string, {
      nome: string;
      funcao: string;
      badgeClass: string;
      ocorrencias: number;
      valorTotal: number;
      volumeHl: number;
      totalUnidades: number;
      motivosCount: Record<string, number>;
      areaPredominante: string;
      areasCount: Record<string, number>;
    }>();

    filteredData.forEach(q => {
      const info = resolveCollaboratorAndFunction(q);
      const name = info.nome !== 'NÃO INFORMADO' ? info.nome : 'NÃO IDENTIFICADO';
      const valor = getItemValorReal(q);
      const hl = getItemHlInfo(q).totalHl;
      const qtd = Number(q.quantidade) || 0;
      const mot = q.motivo || `Cód. ${q.codQuebra || '539'}`;
      const area = q.area || 'ARMAZÉM';

      let entry = map.get(name);
      if (!entry) {
        entry = {
          nome: name,
          funcao: info.funcao,
          badgeClass: info.badgeClass,
          ocorrencias: 0,
          valorTotal: 0,
          volumeHl: 0,
          totalUnidades: 0,
          motivosCount: {},
          areaPredominante: area,
          areasCount: {}
        };
        map.set(name, entry);
      }

      entry.ocorrencias += 1;
      entry.valorTotal += valor;
      entry.volumeHl += hl;
      entry.totalUnidades += qtd;
      entry.motivosCount[mot] = (entry.motivosCount[mot] || 0) + 1;
      entry.areasCount[area] = (entry.areasCount[area] || 0) + 1;
    });

    // Compute predominant motive & area
    const list = Array.from(map.values()).map(item => {
      let topMot = 'Diversos';
      let maxMot = 0;
      Object.entries(item.motivosCount).forEach(([m, c]) => {
        if (c > maxMot) {
          maxMot = c;
          topMot = m;
        }
      });

      let topArea = 'Armazém';
      let maxArea = 0;
      Object.entries(item.areasCount).forEach(([a, c]) => {
        if (c > maxArea) {
          maxArea = c;
          topArea = a;
        }
      });

      return {
        ...item,
        topMotivo: topMot,
        areaPredominante: topArea
      };
    });

    list.sort((a, b) => b.ocorrencias - a.ocorrencias || b.valorTotal - a.valorTotal);
    return list;
  }, [filteredData]);

  // Breakdown of functions count
  const functionBreakdownStats = useMemo(() => {
    let empilhadores = 0;
    let ajudantes = 0;
    let conferentes = 0;
    let outros = 0;

    collaboratorAnalysis.forEach(c => {
      if (c.funcao.includes('EMPILHADOR')) empilhadores += 1;
      else if (c.funcao.includes('AJUDANTE')) ajudantes += 1;
      else if (c.funcao.includes('CONFERENTE')) conferentes += 1;
      else outros += 1;
    });

    return { empilhadores, ajudantes, conferentes, outros, total: collaboratorAnalysis.length };
  }, [collaboratorAnalysis]);

  // Detailed records filter for Card 6 (Card de Registros Individuais)
  const detailedRecordsRows = useMemo(() => {
    return filteredData.filter(q => {
      const desc = q.descricao || 'PRODUTO NÃO IDENTIFICADO';
      const embName = q.embalagem || getEmbalagemName(q.descricao);
      const colabInfo = resolveCollaboratorAndFunction(q);

      if (recordsFilterProduto !== 'TODOS' && desc !== recordsFilterProduto) return false;
      if (recordsFilterEmbalagem !== 'TODAS' && embName !== recordsFilterEmbalagem) return false;
      if (recordsFilterFuncao !== 'TODAS' && !colabInfo.funcao.includes(recordsFilterFuncao.toUpperCase())) return false;

      if (recordsSearchQuery.trim()) {
        const queryStr = recordsSearchQuery.toLowerCase();
        const sku = (q.codProduto || '').toLowerCase();
        const pDesc = (q.descricao || '').toLowerCase();
        const resp = (colabInfo.nome || '').toLowerCase();
        const func = (colabInfo.funcao || '').toLowerCase();
        const mot = (q.motivo || '').toLowerCase();
        const cod = (q.codQuebra || '').toLowerCase();
        const area = (q.area || '').toLowerCase();
        return sku.includes(queryStr) || pDesc.includes(queryStr) || resp.includes(queryStr) || func.includes(queryStr) || mot.includes(queryStr) || cod.includes(queryStr) || area.includes(queryStr);
      }
      return true;
    });
  }, [filteredData, recordsFilterProduto, recordsFilterEmbalagem, recordsFilterFuncao, recordsSearchQuery]);

  // States for editable WQI matrix
  const [hlFaturadoMap, setHlFaturadoMap] = useState<Record<number, number | null>>(() => {
    try {
      const saved = localStorage.getItem('wqi_hl_faturado_map');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  });

  // REAL 2025 segmented structure (Armazém, Entrega, Puxada)
  const [real2025Data, setReal2025Data] = useState<{
    armazem: (number | null)[];
    entrega: (number | null)[];
    puxada: (number | null)[];
  }>(() => {
    try {
      const saved = localStorage.getItem('wqi_real2025_data');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      armazem: Array(12).fill(null),
      entrega: Array(12).fill(null),
      puxada: Array(12).fill(null)
    };
  });

  const [area2025Filter, setArea2025Filter] = useState<'TODOS' | 'ARMAZEM' | 'ENTREGA' | 'PUXADA'>('TODOS');

  // Save WQI matrix to localStorage and Firestore whenever updated
  useEffect(() => {
    try {
      localStorage.setItem('wqi_hl_faturado_map', JSON.stringify(hlFaturadoMap));
      firestoreDb.create('wqi_config', { hlFaturadoMap, atualizadoEm: new Date().toISOString() }, empresaId, 'hl_faturado_map').catch(() => {});
    } catch (e) {}
  }, [hlFaturadoMap, empresaId]);

  useEffect(() => {
    try {
      localStorage.setItem('wqi_real2025_data', JSON.stringify(real2025Data));
      firestoreDb.create('wqi_config', { real2025Data, atualizadoEm: new Date().toISOString() }, empresaId, 'real2025_data').catch(() => {});
    } catch (e) {}
  }, [real2025Data, empresaId]);

  // Inline cell edit states
  const [editingCell, setEditingCell] = useState<{ rowKey: 'hlFaturado' | 'real2025'; monthIdx: number } | null>(null);
  const [editInputValue, setEditInputValue] = useState<string>('');
  const [isMatrixModalOpen, setIsMatrixModalOpen] = useState<boolean>(false);

  const handleStartCellEdit = (rowKey: 'hlFaturado' | 'real2025', monthIdx: number, val: number | null) => {
    setEditingCell({ rowKey, monthIdx });
    setEditInputValue(val !== null && val !== undefined ? String(val) : '');
  };

  const handleSaveInlineCell = () => {
    if (!editingCell) return;
    const { rowKey, monthIdx } = editingCell;
    const raw = editInputValue.trim();

    if (raw === '' || raw === '-') {
      if (rowKey === 'hlFaturado') setHlFaturadoMap(prev => ({ ...prev, [monthIdx]: null }));
      if (rowKey === 'real2025') {
        setReal2025Data(prev => {
          const areaKey = area2025Filter === 'TODOS' ? 'armazem' : (area2025Filter.toLowerCase() as 'armazem' | 'entrega' | 'puxada');
          const newArr = [...prev[areaKey]];
          newArr[monthIdx] = null;
          return { ...prev, [areaKey]: newArr };
        });
      }
    } else {
      const num = parseFloat(raw.replace(/\./g, '').replace(',', '.'));
      if (!isNaN(num)) {
        if (rowKey === 'hlFaturado') setHlFaturadoMap(prev => ({ ...prev, [monthIdx]: num }));
        if (rowKey === 'real2025') {
          setReal2025Data(prev => {
            const areaKey = area2025Filter === 'TODOS' ? 'armazem' : (area2025Filter.toLowerCase() as 'armazem' | 'entrega' | 'puxada');
            const newArr = [...prev[areaKey]];
            newArr[monthIdx] = num;
            return { ...prev, [areaKey]: newArr };
          });
        }
      }
    }
    setEditingCell(null);
  };

  // 12-Month Annual Comparative Data (2025 vs 2026) for WQI
  const annualComparisonData = useMemo(() => {
    const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    const realHlPerdidoMap2026: Record<number, number> = {};

    data.forEach(q => {
      if (!isQuebraMovimentacao(q)) return;

      // Filter by area based on filterArea or area2025Filter
      const rawArea = (q.area || '').toUpperCase();
      if (filterArea !== 'TODAS') {
        if (q.area !== filterArea) return;
      } else if (area2025Filter !== 'TODOS') {
        if (area2025Filter === 'ARMAZEM' && (rawArea.includes('ENTREGA') || rawArea.includes('ROTA') || rawArea.includes('MERCADO'))) {
          return;
        }
        if (area2025Filter === 'ENTREGA' && !rawArea.includes('ENTREGA') && !rawArea.includes('ROTA')) {
          return;
        }
        if (area2025Filter === 'PUXADA' && !rawArea.includes('PUXADA') && !rawArea.includes('TRANSF')) {
          return;
        }
      }

      let y = 0;
      let m = -1;
      if (q.dataISO) {
        const parts = q.dataISO.split('T')[0].split('-');
        if (parts.length >= 2) {
          y = parseInt(parts[0], 10);
          m = parseInt(parts[1], 10) - 1;
        }
      } else if (q.data) {
        const parts = q.data.split('/');
        if (parts.length === 3) {
          y = parseInt(parts[2], 10);
          m = parseInt(parts[1], 10) - 1;
        }
      }

      if (m >= 0 && m < 12 && y === 2026) {
        const hl = getItemHlInfo(q).totalHl;
        realHlPerdidoMap2026[m] = (realHlPerdidoMap2026[m] || 0) + hl;
      }
    });

    return months.map((month, i) => {
      // 1. Calculate REAL 2025 based on selected Area Filter (Armazém, Entrega, Puxada or Consolidated Sum)
      let val2025: number | null = null;
      if (area2025Filter === 'ARMAZEM') {
        val2025 = real2025Data.armazem[i];
      } else if (area2025Filter === 'ENTREGA') {
        val2025 = real2025Data.entrega[i];
      } else if (area2025Filter === 'PUXADA') {
        val2025 = real2025Data.puxada[i];
      } else {
        // TODOS / CONSOLIDADO: sum non-null area values
        const a = real2025Data.armazem[i];
        const e = real2025Data.entrega[i];
        const p = real2025Data.puxada[i];
        if (a === null && e === null && p === null) {
          val2025 = null;
        } else {
          val2025 = (a || 0) + (e || 0) + (p || 0);
        }
      }

      // 2. HL PERDIDO for 2026: 100% Automatic from real platform breakage records
      let hlPerdido: number | null = null;
      if (realHlPerdidoMap2026[i] !== undefined && realHlPerdidoMap2026[i] > 0) {
        hlPerdido = Math.round(realHlPerdidoMap2026[i] * 100) / 100;
      }

      // 3. HL FATURADO DO MÊS for 2026: Manual input only
      const hlFaturado = hlFaturadoMap[i] !== undefined ? hlFaturadoMap[i] : null;

      // 4. REAL 2026 (PPM): Formula: (HL Perdido ÷ HL Faturado) * 1.000.000
      let real2026: number | null = null;
      if (hlPerdido !== null && hlFaturado !== null && hlFaturado > 0) {
        real2026 = Math.round((hlPerdido / hlFaturado) * 1000000);
      }

      return {
        month,
        monthIdx: i,
        real2025: val2025,
        real2025Str: val2025 !== null ? String(val2025) : '—',
        real2026,
        val2026Display: real2026 !== null ? real2026 : '—',
        hlPerdido,
        hlPerdidoStr: hlPerdido !== null ? hlPerdido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—',
        hlEntregue: hlFaturado,
        hlEntregueStr: hlFaturado !== null ? hlFaturado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'
      };
    });
  }, [data, hlFaturadoMap, real2025Data, area2025Filter, filterArea]);

  const { totalRecordsVolume, totalRecordsHl } = useMemo(() => {
    let vol = 0;
    let hl = 0;
    detailedRecordsRows.forEach(r => {
      const q = Number(r.quantidade) || 0;
      vol += q;
      hl += getItemHlInfo(r).totalHl;
    });
    return {
      totalRecordsVolume: vol,
      totalRecordsHl: Math.round(hl * 10000) / 10000
    };
  }, [detailedRecordsRows]);

  const exportRecordsToExcel = (rows: QuebraRow[], title: string) => {
    try {
      const dataToExport = rows.map((r, idx) => {
        const hlInfo = getItemHlInfo(r);
        return {
          'Item (#)': idx + 1,
          'Data': r.data || r.dataISO || '—',
          'Código SKU': r.codProduto || '—',
          'Descrição do Produto': r.descricao || '—',
          'Embalagem': r.embalagem || getEmbalagemName(r.descricao),
          'Quantidade (UN)': r.quantidade || 0,
          'Fator HL / Unidade': hlInfo.fatorHl,
          'Volume Total (HL)': hlInfo.totalHl,
          'Código DPO': r.codQuebra || '539',
          'Motivo da Quebra': r.motivo || '—',
          'Setor / Área': r.area || '—',
          'Responsável / Colaborador': r.colaboradorQuebrou || r.responsavel || '—'
        };
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(dataToExport);
      XLSX.utils.book_append_sheet(wb, ws, 'Registros de Quebra');
      XLSX.writeFile(wb, `${title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      alert('Erro ao exportar dados: ' + err);
    }
  };

  // -------------------------------------------------------------
  // CHART 1: Quantidade de Ocorrências (Evolução Mensal - Empilhador vs Ajudante)
  // -------------------------------------------------------------
  const monthlyOccurrencesMap: Record<string, { 
    monthKey: string; 
    monthLabel: string; 
    count: number; 
    empilhador: number;
    ajudante: number;
    conferente: number;
    outros: number;
    volume: number;
    volumeEmpilhador: number;
    volumeAjudante: number;
  }> = {};

  filteredData.forEach(q => {
    const rawDate = q.dataISO || q.data || '';
    let yearMonth = 'Outros';
    if (rawDate) {
      const parts = rawDate.split('T')[0].split('-');
      if (parts.length >= 2) {
        yearMonth = `${parts[0]}-${parts[1]}`;
      }
    }
    
    if (!monthlyOccurrencesMap[yearMonth]) {
      monthlyOccurrencesMap[yearMonth] = {
        monthKey: yearMonth,
        monthLabel: getMonthLabel(rawDate),
        count: 0,
        empilhador: 0,
        ajudante: 0,
        conferente: 0,
        outros: 0,
        volume: 0,
        volumeEmpilhador: 0,
        volumeAjudante: 0,
      };
    }

    const colabInfo = resolveCollaboratorAndFunction(q);
    const funcUpper = colabInfo.funcao.toUpperCase();
    const vol = getValorPorUnidade(q, viewUnit);

    monthlyOccurrencesMap[yearMonth].count += 1;
    monthlyOccurrencesMap[yearMonth].volume += vol;

    if (funcUpper.includes('EMPILHADOR')) {
      monthlyOccurrencesMap[yearMonth].empilhador += 1;
      monthlyOccurrencesMap[yearMonth].volumeEmpilhador += vol;
    } else if (funcUpper.includes('AJUDANTE')) {
      monthlyOccurrencesMap[yearMonth].ajudante += 1;
      monthlyOccurrencesMap[yearMonth].volumeAjudante += vol;
    } else if (funcUpper.includes('CONFERENTE')) {
      monthlyOccurrencesMap[yearMonth].conferente += 1;
    } else {
      monthlyOccurrencesMap[yearMonth].outros += 1;
    }
  });

  const monthlyChartData = Object.values(monthlyOccurrencesMap)
    .sort((a, b) => a.monthKey.localeCompare(b.monthKey));

  const totalOcorrencias = filteredData.length;
  const totalVolume = filteredData.reduce((acc, curr) => acc + getValorPorUnidade(curr, viewUnit), 0);

  // -------------------------------------------------------------
  // CHART 2: Ocorrências por Ajudantes
  // -------------------------------------------------------------
  const ajudantesMap: Record<string, number> = {};

  filteredData.forEach(q => {
    const info = resolveCollaboratorAndFunction(q);
    const funcUpper = info.funcao.toUpperCase();
    const resp = info.nome;

    if (funcUpper === 'AJUDANTE' && resp && resp !== 'NÃO INFORMADO' && resp !== 'NÃO IDENTIFICADO') {
      ajudantesMap[resp] = (ajudantesMap[resp] || 0) + 1;
    }
  });

  const ajudantesChartData = Object.entries(ajudantesMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // -------------------------------------------------------------
  // CHART 3: Ocorrências por Empilhadores (Exclusivo: Marivaldo, Paulo, Ronildo)
  // -------------------------------------------------------------
  const empilhadoresMap: Record<string, number> = {};

  filteredData.forEach(q => {
    const info = resolveCollaboratorAndFunction(q);
    const funcUpper = info.funcao.toUpperCase();
    const resp = info.nome;

    if (funcUpper === 'EMPILHADOR' && isEmpilhadorOficial(resp)) {
      empilhadoresMap[resp] = (empilhadoresMap[resp] || 0) + 1;
    }
  });

  const empilhadoresChartData = Object.entries(empilhadoresMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // -------------------------------------------------------------
  // CHART 4: Ocorrências por Embalagens
  // -------------------------------------------------------------
  const embalagemOccurrencesMap: Record<string, number> = {};

  filteredData.forEach(q => {
    const embName = q.embalagem || getEmbalagemName(q.descricao);
    embalagemOccurrencesMap[embName] = (embalagemOccurrencesMap[embName] || 0) + 1;
  });

  const embalagemChartData = Object.entries(embalagemOccurrencesMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // -------------------------------------------------------------
  // CHART 5: Ocorrências por Produto
  // -------------------------------------------------------------
  const produtoOccurrencesMap: Record<string, number> = {};

  filteredData.forEach(q => {
    const desc = q.descricao || 'PRODUTO NÃO IDENTIFICADO';
    produtoOccurrencesMap[desc] = (produtoOccurrencesMap[desc] || 0) + 1;
  });

  const produtoChartData = Object.entries(produtoOccurrencesMap)
    .map(([name, count]) => ({ 
      name: name.length > 22 ? name.substring(0, 22) + '...' : name, 
      fullName: name,
      count 
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  // -------------------------------------------------------------
  // CHART 6: TOTAL WQI - EMPILHADOR VS AJUDANTE (APENAS WQI)
  // -------------------------------------------------------------
  const wqiRoleStats = useMemo(() => {
    let empCount = 0;
    let empVol = 0;
    let ajudCount = 0;
    let ajudVol = 0;
    let confCount = 0;
    let confVol = 0;
    let outrosCount = 0;
    let outrosVol = 0;

    filteredData.forEach(q => {
      const info = resolveCollaboratorAndFunction(q);
      const func = info.funcao.toUpperCase();
      const vol = getValorPorUnidade(q, viewUnit);

      if (func.includes('EMPILHADOR')) {
        empCount += 1;
        empVol += vol;
      } else if (func.includes('AJUDANTE')) {
        ajudCount += 1;
        ajudVol += vol;
      } else if (func.includes('CONFERENTE')) {
        confCount += 1;
        confVol += vol;
      } else {
        outrosCount += 1;
        outrosVol += vol;
      }
    });

    const items = [
      {
        name: 'EMPILHADOR',
        label: '🚜 Empilhadores',
        count: empCount,
        volume: empVol,
        color: '#3b82f6',
        badge: isDark ? 'bg-blue-950/60 text-blue-300 border-blue-800' : 'bg-blue-50 text-blue-700 border-blue-200'
      },
      {
        name: 'AJUDANTE',
        label: '🚚 Ajudantes',
        count: ajudCount,
        volume: ajudVol,
        color: '#f59e0b',
        badge: isDark ? 'bg-amber-950/60 text-amber-300 border-amber-800' : 'bg-amber-50 text-amber-700 border-amber-200'
      }
    ];

    if (confCount > 0) {
      items.push({
        name: 'CONFERENTE',
        label: '📋 Conferentes',
        count: confCount,
        volume: confVol,
        color: '#10b981',
        badge: isDark ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
      });
    }

    if (outrosCount > 0) {
      items.push({
        name: 'OUTROS',
        label: '📦 Outros / Não Ident.',
        count: outrosCount,
        volume: outrosVol,
        color: '#64748b',
        badge: isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
      });
    }

    return {
      items,
      empCount,
      ajudCount,
      confCount,
      outrosCount,
      totalCount: empCount + ajudCount + confCount + outrosCount
    };
  }, [filteredData, viewUnit, isDark]);

  return (
    <div className="flex flex-col gap-5">
      
      {/* FILTERS & REFRESH BAR */}
      <div className={`flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border shadow-sm transition-colors ${isDark ? 'bg-[#131d38] border-slate-700/80 text-slate-100' : 'bg-white border-gray-200'}`}>
        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          
          {/* Calendar Period */}
          <div className="flex flex-col gap-1 min-w-[260px]">
            <span className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>
              <Filter className={`w-3 h-3 ${isDark ? 'text-blue-400' : 'text-[#032b5e]'}`} /> Período
            </span>
            <CalendarFilter
              startDate={startDate}
              endDate={endDate}
              onChange={onDateChange}
            />
          </div>

          {/* Tipo de Quebra / Context Filter */}
          <div className="flex flex-col gap-1 min-w-[200px]">
            <span className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>Filtro WQI (Varredura)</span>
            <select 
              value={filterTipoQuebra} 
              onChange={e => setFilterTipoQuebra(e.target.value)}
              className={`w-full font-sans font-bold rounded-lg outline-none px-2.5 py-1 text-[10px] h-[32px] cursor-pointer transition-colors ${
                isDark 
                  ? 'bg-[#1e2942] border border-blue-500/50 text-blue-300 hover:border-blue-400' 
                  : 'bg-blue-50/60 border border-blue-200 text-[#032b5e] hover:border-blue-400'
              }`}
            >
              <option value="MOVIMENTACAO_ARMAZEM">🎯 Movimentação no Armazém (WQI)</option>
              <option value="MOVIMENTACAO_TODAS">🚚 Todas Movimentações (Geral)</option>
              <option value="TODAS_QUEBRAS">📦 Todos os Tipos de Quebra</option>
            </select>
          </div>

          {/* Função / Cargo Filter */}
          <div className="flex flex-col gap-1 min-w-[150px]">
            <span className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>Função / Cargo</span>
            <select 
              value={filterFuncao} 
              onChange={e => setFilterFuncao(e.target.value)} 
              className={`w-full font-sans font-bold rounded-lg outline-none px-2.5 py-1 text-[10px] h-[32px] cursor-pointer transition-colors ${
                isDark 
                  ? 'bg-[#1e2942] border border-slate-600 text-slate-100 hover:border-blue-400' 
                  : 'bg-white border border-gray-200 text-[#032b5e] hover:border-blue-400 focus:border-[#032b5e]'
              }`}
            >
              <option value="TODAS">Todas as Funções</option>
              <option value="EMPILHADOR">🚜 Empilhadores</option>
              <option value="AJUDANTE">🚚 Ajudantes</option>
              <option value="CONFERENTE">📋 Conferentes</option>
              <option value="SEPARADOR">📦 Separadores</option>
              <option value="ADMINISTRATIVO">🏢 Administrativo</option>
            </select>
          </div>

          {/* Quem Quebrou (Colaborador) Filter */}
          <div className="flex flex-col gap-1 min-w-[180px]">
            <span className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>Quem Quebrou (Responsável)</span>
            <select 
              value={filterColaborador} 
              onChange={e => setFilterColaborador(e.target.value)} 
              className={`w-full font-sans font-bold rounded-lg outline-none px-2.5 py-1 text-[10px] h-[32px] cursor-pointer transition-colors ${
                isDark 
                  ? 'bg-[#1e2942] border border-slate-600 text-slate-100 hover:border-blue-400' 
                  : 'bg-white border border-gray-200 text-[#032b5e] hover:border-blue-400 focus:border-[#032b5e]'
              }`}
            >
              <option value="TODOS">Todos os Colaboradores ({availableColaboradoresList.length})</option>
              {availableColaboradoresList.map(c => (
                <option key={c.nome} value={c.nome}>{c.nome} ({c.funcao})</option>
              ))}
            </select>
          </div>

          {/* Area Filter */}
          <div className="flex flex-col gap-1 w-[130px]">
            <span className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>Setor / Área</span>
            <select 
              value={filterArea} 
              onChange={e => setFilterArea(e.target.value)} 
              className={`w-full font-sans font-bold rounded-lg outline-none px-2.5 py-1 text-[10px] h-[32px] cursor-pointer transition-colors ${
                isDark 
                  ? 'bg-[#1e2942] border border-slate-600 text-slate-100 hover:border-blue-400' 
                  : 'bg-white border border-gray-200 text-[#032b5e] hover:border-blue-400 focus:border-[#032b5e]'
              }`}
            >
              <option value="TODAS">Todas as Áreas</option>
              <option value="ARMAZEM">Armazém</option>
              <option value="ENTREGA">Entrega / Rota</option>
              <option value="PUXADA">Puxada / Transf</option>
            </select>
          </div>

          {/* Embalagem Filter */}
          <div className="flex flex-col gap-1 w-[150px]">
            <span className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>Embalagem</span>
            <select 
              value={filterEmbalagem} 
              onChange={e => setFilterEmbalagem(e.target.value)} 
              className={`w-full font-sans font-bold rounded-lg outline-none px-2.5 py-1 text-[10px] h-[32px] cursor-pointer transition-colors ${
                isDark 
                  ? 'bg-[#1e2942] border border-slate-600 text-slate-100 hover:border-blue-400' 
                  : 'bg-white border border-gray-200 text-[#032b5e] hover:border-blue-400 focus:border-[#032b5e]'
              }`}
            >
              <option value="TODAS">Todas Embalagens</option>
              <option value="Garrafa 600ml">Garrafa 600ml</option>
              <option value="Garrafa 300ml">Garrafa 300ml</option>
              <option value="Lata 473ml">Lata 473ml</option>
              <option value="Lata 350ml/269ml">Lata 350ml/269ml</option>
              <option value="Long Neck">Long Neck</option>
              <option value="Garrafa 1L">Garrafa 1L</option>
              <option value="PET">PET</option>
              <option value="Outras Embalagens">Outras Embalagens</option>
            </select>
          </div>

          {/* Motivo Filter */}
          <div className="flex flex-col gap-1 w-[160px]">
            <span className={`text-[9px] font-black uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>Motivo da Quebra</span>
            <select 
              value={filterMotivo} 
              onChange={e => setFilterMotivo(e.target.value)} 
              className={`w-full font-sans font-bold rounded-lg outline-none px-2.5 py-1 text-[10px] h-[32px] cursor-pointer transition-colors ${
                isDark 
                  ? 'bg-[#1e2942] border border-slate-600 text-slate-100 hover:border-blue-400' 
                  : 'bg-white border border-gray-200 text-[#032b5e] hover:border-blue-400 focus:border-[#032b5e]'
              }`}
            >
              <option value="TODOS">Todos os Motivos</option>
              {availableWqiMotivos.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[9px] text-slate-400 font-bold uppercase block">Modo Analítico BI</span>
            <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded border ${isDark ? 'text-blue-300 bg-slate-800 border-slate-700' : 'text-[#032b5e] bg-slate-100 border-slate-200'}`}>
              Leitura Única (getDocs)
            </span>
          </div>
          <button
            type="button"
            onClick={fetchWqiData}
            disabled={loading}
            className={`flex items-center gap-1.5 text-[11px] font-bold px-3.5 py-1.5 rounded-lg border-none cursor-pointer transition-all disabled:opacity-50 ${
              isDark ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-[#032b5e] hover:bg-[#021f44] text-white'
            }`}
            title="Atualizar dados analíticos de quebras"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Carregando...' : 'Atualizar'}
          </button>
        </div>
      </div>

      {/* KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1 */}
        <div className={`p-4.5 rounded-xl border shadow-sm flex items-center justify-between transition-colors ${isDark ? 'bg-[#131d38] border-slate-700/80 text-slate-100' : 'bg-white border-gray-200'}`}>
          <div>
            <span className={`text-[9px] font-black uppercase tracking-wider block ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>Total de Ocorrências WQI</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-2xl font-black font-mono ${isDark ? 'text-blue-300' : 'text-[#032b5e]'}`}>
                {totalOcorrencias.toLocaleString('pt-BR')}
              </span>
              <span className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>registros</span>
            </div>
            <span className="text-[9px] text-blue-500 mt-0.5 block font-bold">
              {filterTipoQuebra === 'MOVIMENTACAO_ARMAZEM' ? 'Varredura Armazém (WQI)' : 'Filtro Selecionado'}
            </span>
          </div>
          <div className={`p-3 rounded-xl ${isDark ? 'bg-blue-950/60 text-blue-400' : 'bg-blue-50 text-[#032b5e]'}`}>
            <BarChart2 className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 2 */}
        <div className={`p-4.5 rounded-xl border shadow-sm flex items-center justify-between transition-colors ${isDark ? 'bg-[#131d38] border-slate-700/80 text-slate-100' : 'bg-white border-gray-200'}`}>
          <div>
            <span className={`text-[9px] font-black uppercase tracking-wider block ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>
              {viewUnit === 'rs' ? 'Valor Total de Perdas' : viewUnit === 'hl' ? 'Volume Total de Perdas (HL)' : 'Volume Físico de Perdas (CX/UN)'}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black font-mono text-[#ef4444]">
                {viewUnit === 'rs' ? `R$ ${totalVolume.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : totalVolume.toLocaleString('pt-BR', { minimumFractionDigits: viewUnit === 'hl' ? 2 : 0, maximumFractionDigits: viewUnit === 'hl' ? 2 : 0 })}
              </span>
              {viewUnit !== 'rs' && (
                <span className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {viewUnit === 'hl' ? 'HL' : 'unidades / cx'}
                </span>
              )}
            </div>
            <span className="text-[9px] text-slate-400 mt-0.5 block font-semibold">Volume acumulado descartes</span>
          </div>
          <div className={`p-3 rounded-xl ${isDark ? 'bg-red-950/60 text-red-400' : 'bg-red-50 text-[#ef4444]'}`}>
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 3: Empilhadores */}
        <div className={`p-4.5 rounded-xl border shadow-sm flex items-center justify-between transition-colors ${isDark ? 'bg-[#131d38] border-slate-700/80 text-slate-100' : 'bg-white border-gray-200'}`}>
          <div>
            <span className={`text-[9px] font-black uppercase tracking-wider block ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>Total WQI Empilhadores</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black font-mono text-blue-500">
                {wqiRoleStats.empCount}
              </span>
              <span className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>quebras</span>
            </div>
            <span className="text-[9px] text-blue-400 mt-0.5 block font-semibold">{functionBreakdownStats.empilhadores} operadores ativos</span>
          </div>
          <div className={`p-3 rounded-xl ${isDark ? 'bg-blue-950/60 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 4: Ajudantes */}
        <div className={`p-4.5 rounded-xl border shadow-sm flex items-center justify-between transition-colors ${isDark ? 'bg-[#131d38] border-slate-700/80 text-slate-100' : 'bg-white border-gray-200'}`}>
          <div>
            <span className={`text-[9px] font-black uppercase tracking-wider block ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>Total WQI Ajudantes</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black font-mono text-amber-500">
                {wqiRoleStats.ajudCount}
              </span>
              <span className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>quebras</span>
            </div>
            <span className="text-[9px] text-amber-400 mt-0.5 block font-semibold">{functionBreakdownStats.ajudantes} ajudantes identificados</span>
          </div>
          <div className={`p-3 rounded-xl ${isDark ? 'bg-amber-950/60 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>
            <Truck className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* CHARTS GRID 1: QUANTIDADE DE OCORRÊNCIAS (EVOLUÇÃO MENSAL: EMPILHADOR VS AJUDANTE) & TOTAL WQI (FUNÇÃO) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* CHART 1: Quantidade de Ocorrências (Evolução Mensal - Empilhador vs Ajudante) */}
        <div className={`lg:col-span-2 p-4.5 rounded-xl border shadow-sm flex flex-col justify-between min-h-[360px] transition-colors ${isDark ? 'bg-[#131d38] border-slate-700/80 text-slate-100' : 'bg-white border-gray-200'}`}>
          <div>
            <div className="flex items-center justify-between">
              <h3 className={`font-sans font-black text-[12px] uppercase tracking-wider flex items-center gap-1.5 ${isDark ? 'text-blue-300' : 'text-[#032b5e]'}`}>
                <BarChart2 className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-[#032b5e]'}`} /> 1. QUANTIDADE DE OCORRÊNCIAS (EVOLUÇÃO MENSAL)
              </h3>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${isDark ? 'text-slate-300 bg-slate-800' : 'text-slate-600 bg-slate-100'}`}>
                  Total: {totalOcorrencias} quebras
                </span>
              </div>
            </div>
            <span className={`text-[9px] font-bold mt-0.5 block ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>
              Análise comparativa mensal por cargo: Coluna Empilhador vs Coluna Ajudante por mês
            </span>
          </div>

          <div className="h-64 w-full my-3">
            {monthlyChartData.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 font-bold">
                Nenhum registro encontrado no período selecionado.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChartData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid stroke={isDark ? '#1e293b' : '#f1f5f9'} vertical={false} />
                  <XAxis dataKey="monthLabel" stroke={isDark ? '#94a3b8' : '#475569'} fontSize={10} fontWeight={700} tickLine={false} axisLine={false} />
                  <YAxis stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={9} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: isDark ? '#030712' : '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: 11, color: '#fff' }}
                    labelStyle={{ color: '#38bdf8', fontWeight: 'bold' }}
                    formatter={(val: any, name: any) => [`${val} ocorrências`, name]}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: 11, fontWeight: 700, paddingTop: 6 }} 
                    iconType="circle"
                  />
                  <Bar dataKey="empilhador" name="🚜 Empilhador" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={32}>
                    <LabelList dataKey="empilhador" position="top" fontSize={10} fontWeight={800} fill={isDark ? '#93c5fd' : '#1d4ed8'} formatter={(v: any) => v > 0 ? v : ''} />
                  </Bar>
                  <Bar dataKey="ajudante" name="🚚 Ajudante" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={32}>
                    <LabelList dataKey="ajudante" position="top" fontSize={10} fontWeight={800} fill={isDark ? '#fcd34d' : '#d97706'} formatter={(v: any) => v > 0 ? v : ''} />
                  </Bar>
                  {monthlyChartData.some(m => m.outros > 0) && (
                    <Bar dataKey="outros" name="📦 Outros / Não Ident." fill="#94a3b8" radius={[4, 4, 0, 0]} maxBarSize={32}>
                      <LabelList dataKey="outros" position="top" fontSize={10} fontWeight={800} fill={isDark ? '#cbd5e1' : '#64748b'} formatter={(v: any) => v > 0 ? v : ''} />
                    </Bar>
                  )}
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className={`text-[9px] font-semibold border-t pt-1.5 flex flex-wrap items-center justify-between gap-2 ${isDark ? 'border-slate-800 text-slate-400' : 'border-gray-100 text-gray-400'}`}>
            <span>Volume total acumulado: {viewUnit === 'rs' ? `R$ ${totalVolume.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `${totalVolume.toLocaleString('pt-BR')} ${viewUnit === 'hl' ? 'HL' : 'UN'}`}</span>
            <div className="flex items-center gap-3 font-mono font-bold">
              <span className="text-blue-500">🚜 Empilhadores: {wqiRoleStats.empCount}</span>
              <span className="text-amber-500">🚚 Ajudantes: {wqiRoleStats.ajudCount}</span>
            </div>
          </div>
        </div>

        {/* CHART 6: TOTAL DE WQI - EMPILHADOR VS AJUDANTE (APENAS WQI) */}
        <div className={`p-4.5 rounded-xl border shadow-sm flex flex-col justify-between min-h-[360px] transition-colors ${isDark ? 'bg-[#131d38] border-slate-700/80 text-slate-100' : 'bg-white border-gray-200'}`}>
          <div>
            <div className="flex items-center justify-between">
              <h3 className={`font-sans font-black text-[12px] uppercase tracking-wider flex items-center gap-1.5 ${isDark ? 'text-blue-300' : 'text-[#032b5e]'}`}>
                <Users className="w-4 h-4 text-[#3b82f6]" /> 6. TOTAL WQI POR FUNÇÃO
              </h3>
              <span className={`text-[9px] font-mono font-black px-2 py-0.5 rounded ${isDark ? 'text-emerald-300 bg-emerald-950/60' : 'text-emerald-700 bg-emerald-50'}`}>
                Apenas WQI
              </span>
            </div>
            <span className={`text-[9px] font-bold mt-0.5 block ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>
              Distribuição total de quebras: Total Empilhador vs Total Ajudante
            </span>
          </div>

          <div className="h-56 w-full my-2">
            {wqiRoleStats.items.length === 0 || wqiRoleStats.totalCount === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 font-bold">
                Sem dados de funções no período.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={wqiRoleStats.items} margin={{ top: 20, right: 15, left: -15, bottom: 15 }}>
                  <CartesianGrid stroke={isDark ? '#1e293b' : '#f1f5f9'} vertical={false} />
                  <XAxis 
                    dataKey="label" 
                    stroke={isDark ? '#94a3b8' : '#475569'} 
                    fontSize={10} 
                    fontWeight={700}
                    tickLine={false} 
                    axisLine={false}
                  />
                  <YAxis stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={9} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: isDark ? '#030712' : '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: 10, color: '#fff' }}
                    formatter={(val: any, _, item: any) => [
                      `${val} ocorrências (${viewUnit === 'rs' ? `R$ ${item.payload.volume.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `${item.payload.volume.toLocaleString('pt-BR')} ${viewUnit === 'hl' ? 'HL' : 'UN'}`})`, 
                      'Total Quebras'
                    ]}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
                    <LabelList dataKey="count" position="top" fontSize={11} fontWeight={800} fill={isDark ? '#e2e8f0' : '#1e293b'} />
                    {wqiRoleStats.items.map((entry, index) => (
                      <Cell key={`cell-role-wqi-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className={`flex flex-col gap-1.5 border-t pt-2 ${isDark ? 'border-slate-800' : 'border-gray-100'}`}>
            {wqiRoleStats.items.map((item) => {
              const pct = wqiRoleStats.totalCount > 0 ? Math.round((item.count / wqiRoleStats.totalCount) * 100) : 0;
              return (
                <div key={item.name} className="flex items-center justify-between text-[9.5px] font-bold">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: item.color }}></span>
                    <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className={isDark ? 'text-slate-300' : 'text-slate-800'}>{item.count} ocorrências ({pct}%)</span>
                    <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold ${isDark ? 'bg-slate-800 text-blue-300' : 'bg-slate-100 text-[#032b5e]'}`}>
                      {viewUnit === 'rs' ? `R$ ${item.volume.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `${item.volume.toLocaleString('pt-BR')} ${viewUnit === 'hl' ? 'HL' : 'UN'}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* CHARTS GRID 2: OCORRÊNCIAS POR AJUDANTES & EMPILHADORES (VERTICAL COLUMN CHARTS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* CHART 2: Ocorrência por Ajudantes (Coluna Vertical) */}
        <div className={`p-4.5 rounded-xl border shadow-sm flex flex-col justify-between min-h-[380px] transition-colors ${isDark ? 'bg-[#131d38] border-slate-700/80 text-slate-100' : 'bg-white border-gray-200'}`}>
          <div>
            <div className="flex items-center justify-between">
              <h3 className={`font-sans font-black text-[12px] uppercase tracking-wider flex items-center gap-1.5 ${isDark ? 'text-blue-300' : 'text-[#032b5e]'}`}>
                <Truck className="w-4 h-4 text-[#f59e0b]" /> 2. OCORRÊNCIA POR AJUDANTES
              </h3>
              <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${isDark ? 'text-amber-400 bg-amber-950/60' : 'text-amber-700 bg-amber-50'}`}>
                Colunas Verticais
              </span>
            </div>
            <span className={`text-[9px] font-bold mt-0.5 block ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>
              Contagem de quebras operacionais por ajudantes de armazém e movimentação
            </span>
          </div>

          <div className="h-68 w-full my-2">
            {ajudantesChartData.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 font-bold">
                Sem registros atribuídos a Ajudantes.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ajudantesChartData} margin={{ top: 20, right: 15, left: -15, bottom: 45 }}>
                  <CartesianGrid stroke={isDark ? '#1e293b' : '#f1f5f9'} vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke={isDark ? '#94a3b8' : '#475569'} 
                    fontSize={9} 
                    fontWeight={700}
                    tickLine={false} 
                    axisLine={false}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                    height={45}
                  />
                  <YAxis stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={9} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: isDark ? '#030712' : '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: 10, color: '#fff' }}
                    formatter={(val: any) => [`${val} ocorrências`, 'Quebras']}
                  />
                  <Bar dataKey="count" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={38}>
                    <LabelList dataKey="count" position="top" fontSize={10} fontWeight={800} fill={isDark ? '#fcd34d' : '#d97706'} />
                    {ajudantesChartData.map((_, index) => (
                      <Cell key={`cell-aj-${index}`} fill={index === 0 ? '#f59e0b' : index === 1 ? '#f97316' : '#fbbf24'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className={`text-[9px] font-semibold border-t pt-1.5 flex items-center justify-between ${isDark ? 'border-slate-800 text-slate-400' : 'border-gray-100 text-gray-400'}`}>
            <span>Identificação nominal de ajudantes</span>
            <span className="font-mono font-bold text-amber-500">Top {ajudantesChartData.length} Ajudantes</span>
          </div>
        </div>

        {/* CHART 3: Ocorrência por Empilhadores (Coluna Vertical) */}
        <div className={`p-4.5 rounded-xl border shadow-sm flex flex-col justify-between min-h-[380px] transition-colors ${isDark ? 'bg-[#131d38] border-slate-700/80 text-slate-100' : 'bg-white border-gray-200'}`}>
          <div>
            <div className="flex items-center justify-between">
              <h3 className={`font-sans font-black text-[12px] uppercase tracking-wider flex items-center gap-1.5 ${isDark ? 'text-blue-300' : 'text-[#032b5e]'}`}>
                <Users className="w-4 h-4 text-[#3b82f6]" /> 3. OCORRÊNCIA POR EMPILHADORES
              </h3>
              <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${isDark ? 'text-blue-300 bg-blue-950/60' : 'text-blue-600 bg-blue-50'}`}>
                3 Operadores
              </span>
            </div>
            <span className={`text-[9px] font-bold mt-0.5 block ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>
              Contagem de quebras dos 3 operadores de empilhadeira do armazém: Marivaldo, Paulo e Ronildo
            </span>
          </div>

          <div className="h-68 w-full my-2">
            {empilhadoresChartData.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 font-bold">
                Sem registros atribuídos aos 3 Empilhadores no período.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={empilhadoresChartData} margin={{ top: 20, right: 15, left: -15, bottom: 45 }}>
                  <CartesianGrid stroke={isDark ? '#1e293b' : '#f1f5f9'} vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke={isDark ? '#94a3b8' : '#475569'} 
                    fontSize={9} 
                    fontWeight={700}
                    tickLine={false} 
                    axisLine={false}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                    height={45}
                  />
                  <YAxis stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={9} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: isDark ? '#030712' : '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: 10, color: '#fff' }}
                    formatter={(val: any) => [`${val} ocorrências`, 'Quebras']}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={38}>
                    <LabelList dataKey="count" position="top" fontSize={10} fontWeight={800} fill={isDark ? '#60a5fa' : '#3b82f6'} />
                    {empilhadoresChartData.map((_, index) => (
                      <Cell key={`cell-[#3b82f6]-${index}`} fill={index === 0 ? (isDark ? '#3b82f6' : '#032b5e') : index === 1 ? '#2563eb' : '#60a5fa'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className={`text-[9px] font-semibold border-t pt-1.5 flex items-center justify-between ${isDark ? 'border-slate-800 text-slate-400' : 'border-gray-100 text-gray-400'}`}>
            <span>Apenas Marivaldo, Paulo e Ronildo</span>
            <span className={`font-mono font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{empilhadoresChartData.length} Empilhador(es) com quebras</span>
          </div>
        </div>

      </div>

      {/* CHARTS GRID 3: OCORRÊNCIAS POR EMBALAGEM & POR PRODUTO (VERTICAL COLUMN CHARTS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* CARD 4: Ocorrência por Embalagens (Coluna Vertical) */}
        <div className={`p-4.5 rounded-xl border shadow-sm flex flex-col justify-between min-h-[380px] transition-colors ${isDark ? 'bg-[#131d38] border-slate-700/80 text-slate-100' : 'bg-white border-gray-200'}`}>
          <div>
            <h3 className={`font-sans font-black text-[12px] uppercase tracking-wider flex items-center gap-1.5 ${isDark ? 'text-blue-300' : 'text-[#032b5e]'}`}>
              <Package className="w-4 h-4 text-[#8b5cf6]" /> 4. OCORRÊNCIA POR EMBALAGENS
            </h3>
            <span className={`text-[9px] font-bold mt-0.5 block ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>
              Top embalagens com registros de quebra identificados (colunas verticais)
            </span>
          </div>

          <div className="h-68 w-full my-2">
            {embalagemChartData.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 font-bold">
                Sem dados de embalagens no período.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={embalagemChartData} margin={{ top: 20, right: 15, left: -15, bottom: 45 }}>
                  <CartesianGrid stroke={isDark ? '#1e293b' : '#f1f5f9'} vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke={isDark ? '#94a3b8' : '#475569'} 
                    fontSize={9} 
                    fontWeight={700}
                    tickLine={false} 
                    axisLine={false}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={45}
                  />
                  <YAxis stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={9} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: isDark ? '#030712' : '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: 10, color: '#fff' }}
                    formatter={(val: any) => [`${val} ocorrências`, 'Ocorrências']}
                  />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} maxBarSize={38}>
                    <LabelList dataKey="count" position="top" fontSize={10} fontWeight={800} fill={isDark ? '#a78bfa' : '#8b5cf6'} />
                    {embalagemChartData.map((entry, index) => (
                      <Cell 
                        key={`cell-emb-wqi-${index}`} 
                        fill={COLORS[(index + 3) % COLORS.length]} 
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => {
                          setRecordsFilterEmbalagem(entry.name);
                          const el = document.getElementById('card-registros-detalhados');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className={`text-[9px] font-semibold border-t pt-1.5 flex items-center justify-between ${isDark ? 'border-slate-800 text-slate-400' : 'border-gray-100 text-gray-400'}`}>
            <span>Clique na barra para filtrar a tabela de registros</span>
            <span className="font-mono font-bold text-[#8b5cf6]">Top {embalagemChartData.length} Embalagens</span>
          </div>
        </div>

        {/* CARD 5: Ocorrência por Produto (Coluna Vertical) */}
        <div className={`p-4.5 rounded-xl border shadow-sm flex flex-col justify-between min-h-[380px] transition-colors ${isDark ? 'bg-[#131d38] border-slate-700/80 text-slate-100' : 'bg-white border-gray-200'}`}>
          <div>
            <h3 className={`font-sans font-black text-[12px] uppercase tracking-wider flex items-center gap-1.5 ${isDark ? 'text-blue-300' : 'text-[#032b5e]'}`}>
              <Award className="w-4 h-4 text-[#f59e0b]" /> 5. OCORRÊNCIA POR PRODUTO
            </h3>
            <span className={`text-[9px] font-bold mt-0.5 block ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>
              Top produtos (SKUs) com mais ocorrências no período (colunas verticais)
            </span>
          </div>

          <div className="h-68 w-full my-2">
            {produtoChartData.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 font-bold">
                Sem registros de produtos no período.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={produtoChartData} margin={{ top: 20, right: 15, left: -15, bottom: 65 }}>
                  <CartesianGrid stroke={isDark ? '#1e293b' : '#f1f5f9'} vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke={isDark ? '#94a3b8' : '#475569'} 
                    fontSize={8.5} 
                    fontWeight={700}
                    tickLine={false} 
                    axisLine={false} 
                    interval={0}
                    angle={-35}
                    textAnchor="end"
                    height={65}
                  />
                  <YAxis stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={9} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: isDark ? '#030712' : '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: 10, color: '#fff' }}
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || ''}
                    formatter={(val: any) => [`${val} ocorrências`, 'Total Ocorrências']}
                  />
                  <Bar dataKey="count" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={32}>
                    <LabelList dataKey="count" position="top" fontSize={9} fontWeight={800} fill={isDark ? '#fbbf24' : '#d97706'} />
                    {produtoChartData.map((entry, index) => (
                      <Cell 
                        key={`cell-[#f59e0b]-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => {
                          setRecordsFilterProduto(entry.fullName || entry.name);
                          const el = document.getElementById('card-registros-detalhados');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className={`text-[9px] font-semibold border-t pt-1.5 flex items-center justify-between ${isDark ? 'border-slate-800 text-slate-400' : 'border-gray-100 text-gray-400'}`}>
            <span>Clique na barra para filtrar a tabela de registros</span>
            <span className={`font-mono font-bold ${isDark ? 'text-amber-400' : 'text-[#d97706]'}`}>Top {produtoChartData.length} Produtos</span>
          </div>
        </div>

      </div>

      {/* ACOMPANHAMENTO ANUAL WQI MÊS A MÊS (COMPARATIVO 2025 / 2026) */}
      <div className={`p-4.5 rounded-xl border shadow-sm flex flex-col justify-between transition-colors overflow-hidden ${
        isDark ? 'bg-[#131d38] border-slate-700/80 text-slate-100' : 'bg-white border-gray-200 text-slate-800'
      }`}>
        {/* Banner Title Header */}
        <div className={`py-2.5 px-4 rounded-lg border mb-3 text-center shadow-inner ${
          isDark ? 'bg-slate-800/90 border-slate-700/60 text-white' : 'bg-[#032b5e] border-[#032b5e] text-white'
        }`}>
          <h2 className="font-sans font-black text-sm md:text-base uppercase tracking-wider text-white flex items-center justify-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-400" /> ACOMPANHAMENTO ANUAL WQI MÊS A MÊS
          </h2>
        </div>

        {/* Chart Canvas */}
        <div className="h-64 sm:h-72 w-full my-1">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={annualComparisonData} margin={{ top: 25, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid stroke={isDark ? '#334155' : '#e2e8f0'} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" stroke={isDark ? '#94a3b8' : '#475569'} fontSize={10} fontWeight={800} tickLine={false} axisLine={{ stroke: isDark ? '#475569' : '#cbd5e1' }} />
              <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={9} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                  border: isDark ? '1px solid #334155' : '1px solid #cbd5e1', 
                  borderRadius: '8px', 
                  fontSize: 11, 
                  color: isDark ? '#fff' : '#0f172a' 
                }}
                formatter={(value: any, name: any, item: any) => {
                  if (name === 'REAL 2026') {
                    const p = item?.payload;
                    return [value !== null ? `${value} (HL Perdido: ${p?.hlPerdidoStr || '—'} | HL Entregue: ${p?.hlEntregueStr || '—'})` : '—', 'REAL 2026'];
                  }
                  if (name === 'REAL 2025') return [`${value}`, 'REAL 2025'];
                  return [value, name];
                }}
              />
              <Bar dataKey="real2026" name="REAL 2026" fill="#eab308" radius={[4, 4, 0, 0]} barSize={20}>
                <LabelList dataKey="val2026Display" position="top" fontSize={10} fontWeight={800} fill={isDark ? '#fef08a' : '#b45309'} />
              </Bar>
              <Bar dataKey="real2025" name="REAL 2025" fill="#16a34a" radius={[4, 4, 0, 0]} barSize={20}>
                <LabelList dataKey="real2025" position="top" fontSize={10} fontWeight={800} fill={isDark ? '#86efac' : '#15803d'} />
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Data Matrix Table Header Bar with 2025 Area Selector */}
        <div className="flex flex-wrap items-center justify-between gap-2 mt-3 mb-1 px-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Visão WQI 2025:
            </span>
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-700">
              {(['TODOS', 'ARMAZEM', 'ENTREGA', 'PUXADA'] as const).map(area => (
                <button
                  key={area}
                  type="button"
                  onClick={() => setArea2025Filter(area)}
                  className={`px-2.5 py-1 text-[10px] font-black rounded transition-all cursor-pointer ${
                    area2025Filter === area
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white bg-transparent'
                  }`}
                >
                  {area === 'TODOS' ? 'CONSOLIDADO' : area === 'ARMAZEM' ? 'ARMAZÉM' : area}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsMatrixModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[11px] rounded shadow transition-colors cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" /> Lançamento Completo de HL Faturado & 2025
          </button>
        </div>

        {/* Data Matrix Table */}
        <div className={`overflow-x-auto rounded-lg border text-[10px] ${
          isDark ? 'border-slate-700 bg-slate-950/90 text-slate-100' : 'border-gray-200 bg-white text-slate-800'
        }`}>
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="bg-black text-white font-black uppercase text-[10px] border-b border-slate-700">
                <th className="py-2.5 px-3 text-left w-[140px] border-r border-slate-700 font-extrabold tracking-wider">MATRIZ WQI</th>
                {annualComparisonData.map(d => (
                  <th key={d.month} className="py-2.5 px-1 border-r border-slate-800 last:border-r-0 min-w-[55px] font-extrabold">{d.month}</th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y font-mono font-bold ${isDark ? 'divide-slate-800/80 text-slate-200' : 'divide-gray-200 text-slate-800 bg-slate-50/50'}`}>
              
              {/* Row 1: HL PERDIDO 2026 (AUTOMÁTICO DAS QUEBRAS DA PLATAFORMA) */}
              <tr className={isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-100/80'}>
                <td className={`py-2 px-3 text-left font-sans font-extrabold border-r whitespace-nowrap flex items-center justify-between ${
                  isDark ? 'text-slate-300 border-slate-700' : 'text-slate-800 border-gray-200'
                }`}>
                  <span>HL PERDIDO 2026</span>
                  <span className="text-[9px] px-1 bg-slate-800 text-amber-400 rounded font-mono border border-slate-700">Auto</span>
                </td>
                {annualComparisonData.map(d => (
                  <td key={`hlp-${d.month}`} className={`py-1.5 px-1 border-r last:border-r-0 ${isDark ? 'border-slate-800/80' : 'border-gray-200'}`}>
                    <span className={d.hlPerdido !== null ? (isDark ? 'text-slate-200 font-bold' : 'text-slate-900 font-extrabold') : 'text-gray-500'}>
                      {d.hlPerdidoStr}
                    </span>
                  </td>
                ))}
              </tr>

              {/* Row 2: HL FATURADO DO MÊS 2026 (EDITÁVEL) */}
              <tr className={isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-100/80'}>
                <td className={`py-2 px-3 text-left font-sans font-extrabold border-r whitespace-nowrap flex items-center justify-between ${
                  isDark ? 'text-amber-300 border-slate-700' : 'text-amber-800 border-gray-200'
                }`}>
                  <span>HL FATURADO 2026</span>
                  <span className="text-[9px] px-1 bg-amber-500/20 text-amber-400 rounded font-mono border border-amber-500/40">✏️ Editar</span>
                </td>
                {annualComparisonData.map(d => {
                  const isEditing = editingCell?.rowKey === 'hlFaturado' && editingCell?.monthIdx === d.monthIdx;
                  return (
                    <td key={`hle-${d.month}`} className={`p-0.5 border-r last:border-r-0 ${isDark ? 'border-slate-800/80' : 'border-gray-200'}`}>
                      {isEditing ? (
                        <input
                          type="text"
                          autoFocus
                          className="w-full text-center font-mono font-extrabold text-[10px] py-1 px-0.5 bg-amber-400 text-slate-950 border-2 border-amber-600 rounded focus:outline-none shadow-md"
                          value={editInputValue}
                          onChange={(e) => setEditInputValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveInlineCell();
                            if (e.key === 'Escape') setEditingCell(null);
                          }}
                          onBlur={handleSaveInlineCell}
                        />
                      ) : (
                        <div
                          onClick={() => handleStartCellEdit('hlFaturado', d.monthIdx, d.hlEntregue)}
                          title="Clique para digitar Hectolitros Faturados do Mês"
                          className={`py-1.5 px-1 rounded cursor-pointer hover:bg-amber-500/25 transition-all font-bold ${
                            d.hlEntregue !== null ? (isDark ? 'text-amber-200 font-extrabold' : 'text-amber-900 font-extrabold') : (isDark ? 'text-slate-500' : 'text-gray-400')
                          }`}
                        >
                          {d.hlEntregueStr}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>

              {/* Row 3: REAL 2026 (PPM CALCULADO) */}
              <tr className={isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-100/80'}>
                <td className={`py-2 px-3 text-left font-sans font-extrabold border-r whitespace-nowrap flex items-center justify-between ${
                  isDark ? 'text-amber-400 border-slate-700' : 'text-amber-700 border-gray-200'
                }`}>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-amber-400 rounded-sm inline-block"></span>
                    REAL 2026 (PPM)
                  </span>
                  <span className="text-[9px] px-1 bg-slate-800 text-slate-400 rounded font-mono border border-slate-700">Fórmula</span>
                </td>
                {annualComparisonData.map(d => (
                  <td key={`r26-${d.month}`} className={`py-1.5 px-1 border-r last:border-r-0 ${isDark ? 'border-slate-800/80' : 'border-gray-200'}`}>
                    <span className={`font-black text-[11px] ${d.real2026 !== null ? (isDark ? 'text-amber-300' : 'text-amber-800') : (isDark ? 'text-slate-500' : 'text-gray-400')}`}>
                      {d.val2026Display}
                    </span>
                  </td>
                ))}
              </tr>

              {/* Row 4: REAL 2025 (PPM EDITÁVEL POR ÁREA) */}
              <tr className={isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-100/80'}>
                <td className={`py-2 px-3 text-left font-sans font-extrabold border-r whitespace-nowrap flex items-center justify-between ${
                  isDark ? 'text-emerald-400 border-slate-700' : 'text-emerald-700 border-gray-200'
                }`}>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-emerald-500 rounded-sm inline-block"></span>
                    REAL 2025 ({area2025Filter})
                  </span>
                  <span className="text-[9px] px-1 bg-emerald-500/20 text-emerald-400 rounded font-mono border border-emerald-500/40">✏️ Editar</span>
                </td>
                {annualComparisonData.map(d => {
                  const isEditing = editingCell?.rowKey === 'real2025' && editingCell?.monthIdx === d.monthIdx;
                  return (
                    <td key={`r25-${d.month}`} className={`p-0.5 border-r last:border-r-0 ${isDark ? 'border-slate-800/80' : 'border-gray-200'}`}>
                      {isEditing ? (
                        <input
                          type="text"
                          autoFocus
                          className="w-full text-center font-mono font-extrabold text-[10px] py-1 px-0.5 bg-emerald-400 text-slate-950 border-2 border-emerald-600 rounded focus:outline-none shadow-md"
                          value={editInputValue}
                          onChange={(e) => setEditInputValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveInlineCell();
                            if (e.key === 'Escape') setEditingCell(null);
                          }}
                          onBlur={handleSaveInlineCell}
                        />
                      ) : (
                        <div
                          onClick={() => handleStartCellEdit('real2025', d.monthIdx, d.real2025)}
                          title={`Clique para editar o PPM 2025 para ${area2025Filter}`}
                          className={`py-1.5 px-1 rounded cursor-pointer hover:bg-emerald-500/25 transition-all font-bold ${
                            d.real2025 !== null ? (isDark ? 'text-emerald-300 font-black' : 'text-emerald-800 font-black') : (isDark ? 'text-slate-500' : 'text-gray-400')
                          }`}
                        >
                          {d.real2025Str}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Sub-footer Banner */}
        <div className={`py-1.5 px-4 rounded-lg border mt-3 text-center ${
          isDark ? 'bg-slate-800/80 border-slate-700/60 text-slate-300' : 'bg-slate-100 border-gray-200 text-[#032b5e]'
        }`}>
          <span className="font-sans font-extrabold text-[11px] uppercase tracking-widest">
            ACOMPANHAMENTO ANUAL WQI POR PERÍODO
          </span>
        </div>
      </div>

      {/* CARD 6: REGISTROS DETALHADOS DAS OCORRÊNCIAS (STANDALONE DEDICATED CARD) */}
      <div id="card-registros-detalhados" className={`p-4.5 rounded-xl border shadow-sm flex flex-col justify-between transition-colors ${isDark ? 'bg-[#131d38] border-slate-700/80 text-slate-100' : 'bg-white border-gray-200'}`}>
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className={`font-sans font-black text-[13px] uppercase tracking-wider flex items-center gap-1.5 ${isDark ? 'text-blue-300' : 'text-[#032b5e]'}`}>
                <FileText className="w-4 h-4 text-emerald-500" /> 6. REGISTROS DETALHADOS DAS OCORRÊNCIAS
              </h3>
              <span className={`text-[9.5px] font-bold mt-0.5 block ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>
                Listagem completa de lançamentos com busca e filtros avançados por produto e embalagem
              </span>
            </div>

            <button
              type="button"
              onClick={() => exportRecordsToExcel(detailedRecordsRows, 'Registros_Detalhados_Quebras')}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              title="Exportar registros visíveis para Excel"
            >
              <Download className="w-3.5 h-3.5" /> Exportar Excel ({detailedRecordsRows.length})
            </button>
          </div>

          {/* Controls Bar for Card 6 */}
          <div className="my-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {/* Search query input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar SKU, produto, operador, função, motivo..."
                value={recordsSearchQuery}
                onChange={e => setRecordsSearchQuery(e.target.value)}
                className={`w-full pl-8 pr-2.5 py-1.5 text-[11px] font-semibold rounded-lg border outline-none ${
                  isDark ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500' : 'bg-slate-50 border-gray-200 text-slate-800 placeholder-gray-400'
                }`}
              />
            </div>

            {/* Filter by Product select */}
            <select
              value={recordsFilterProduto}
              onChange={e => setRecordsFilterProduto(e.target.value)}
              className={`px-2.5 py-1.5 text-[11px] font-bold rounded-lg border outline-none truncate ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-gray-200 text-slate-800'
              }`}
            >
              <option value="TODOS">Todos os Produtos ({filteredData.length})</option>
              {produtoChartData.map(p => (
                <option key={p.fullName} value={p.fullName}>{p.fullName} ({p.count})</option>
              ))}
            </select>

            {/* Filter by Embalagem select */}
            <select
              value={recordsFilterEmbalagem}
              onChange={e => setRecordsFilterEmbalagem(e.target.value)}
              className={`px-2.5 py-1.5 text-[11px] font-bold rounded-lg border outline-none truncate ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-gray-200 text-slate-800'
              }`}
            >
              <option value="TODAS">Todas as Embalagens</option>
              {embalagemChartData.map(e => (
                <option key={e.name} value={e.name}>{e.name} ({e.count})</option>
              ))}
            </select>

            {/* Filter by Função select */}
            <select
              value={recordsFilterFuncao}
              onChange={e => setRecordsFilterFuncao(e.target.value)}
              className={`px-2.5 py-1.5 text-[11px] font-bold rounded-lg border outline-none truncate ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-gray-200 text-slate-800'
              }`}
            >
              <option value="TODAS">Todas as Funções</option>
              <option value="EMPILHADOR">🚜 Empilhadores</option>
              <option value="AJUDANTE">🚚 Ajudantes</option>
              <option value="CONFERENTE">📋 Conferentes</option>
              <option value="SEPARADOR">📦 Separadores</option>
              <option value="ADMINISTRATIVO">🏢 Administrativo</option>
            </select>
          </div>

          {/* Table Container */}
          <div className={`max-h-[360px] overflow-y-auto rounded-lg border text-[11px] ${isDark ? 'border-slate-700 bg-slate-900/60' : 'border-gray-200 bg-gray-50/50'}`}>
            <table className="w-full text-left border-collapse">
              <thead className={`sticky top-0 font-bold uppercase text-[9.5px] ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                <tr>
                  <th className="py-2.5 px-3">Data</th>
                  <th className="py-2.5 px-2">SKU</th>
                  <th className="py-2.5 px-3">Descrição do Produto</th>
                  <th className="py-2.5 px-2">Embalagem</th>
                  <th className="py-2.5 px-2 text-center">Qtd</th>
                  <th className="py-2.5 px-2 text-center">HL / Un.</th>
                  <th className="py-2.5 px-2 text-center">Vol Total (HL)</th>
                  <th className="py-2.5 px-3">Motivo / Código DPO</th>
                  <th className="py-2.5 px-2">Setor</th>
                  <th className="py-2.5 px-3">Quem Quebrou</th>
                  <th className="py-2.5 px-3">Função / Cargo</th>
                </tr>
              </thead>
              <tbody className={`divide-y font-medium ${isDark ? 'divide-slate-800 text-slate-200' : 'divide-gray-100 text-slate-700'}`}>
                {detailedRecordsRows.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center py-8 text-gray-400 font-bold">
                      Nenhum registro de quebra encontrado com os critérios de busca selecionados.
                    </td>
                  </tr>
                ) : (
                  detailedRecordsRows.map((r, idx) => {
                    const hlInfo = getItemHlInfo(r);
                    const colabInfo = resolveCollaboratorAndFunction(r);
                    return (
                      <tr key={r._docId || idx} className={isDark ? 'hover:bg-slate-800/50' : 'hover:bg-white'}>
                        <td className="py-2 px-3 font-mono whitespace-nowrap">{r.data || r.dataISO || '—'}</td>
                        <td className="py-2 px-2 font-mono font-bold text-amber-500 whitespace-nowrap">{r.codProduto || '—'}</td>
                        <td className="py-2 px-3 max-w-[190px] truncate font-semibold" title={r.descricao}>{r.descricao || '—'}</td>
                        <td className="py-2 px-2 whitespace-nowrap">{r.embalagem || getEmbalagemName(r.descricao)}</td>
                        <td className="py-2 px-2 text-center font-bold text-red-500 font-mono whitespace-nowrap">{r.quantidade || 0} un</td>
                        <td className="py-2 px-2 text-center font-mono font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap" title={`${hlInfo.fatorHlStr} HL por unidade`}>
                          {hlInfo.fatorHlStr} HL
                        </td>
                        <td className="py-2 px-2 text-center font-mono font-extrabold text-amber-500 whitespace-nowrap" title={`${hlInfo.totalHlStr} Hectolitros acumulados`}>
                          {hlInfo.totalHlStr} HL
                        </td>
                        <td className="py-2 px-3 max-w-[160px] truncate" title={`[${r.codQuebra || '539'}] ${r.motivo || 'QUEBRA'}`}>
                          <span className="font-mono text-amber-500 font-bold mr-1">[{r.codQuebra || '539'}]</span>
                          {r.motivo || 'QUEBRA'}
                        </td>
                        <td className="py-2 px-2 whitespace-nowrap">{r.area || '—'}</td>
                        <td className="py-2 px-3 whitespace-nowrap font-bold">
                          <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>
                            {colabInfo.nome !== 'NÃO INFORMADO' ? colabInfo.nome : (normalizeCollaboratorName(r.colaboradorQuebrou || r.responsavel || '') || '—')}
                          </span>
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black font-mono border ${colabInfo.badgeClass}`}>
                            {colabInfo.funcao}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className={`text-[10px] font-semibold border-t pt-2 mt-3 flex items-center justify-between ${isDark ? 'border-slate-800 text-slate-400' : 'border-gray-100 text-gray-400'}`}>
          <div className="flex items-center gap-2">
            {(recordsFilterProduto !== 'TODOS' || recordsFilterEmbalagem !== 'TODAS' || recordsSearchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setRecordsFilterProduto('TODOS');
                  setRecordsFilterEmbalagem('TODAS');
                  setRecordsSearchQuery('');
                }}
                className="text-blue-500 hover:underline font-bold cursor-pointer"
              >
                Limpar Filtros da Tabela
              </button>
            )}
            <span>Exibindo {detailedRecordsRows.length} de {filteredData.length} lançamentos</span>
          </div>
          <span className="font-mono font-bold text-red-500 text-[11px]">
            Volume Total: {totalRecordsVolume.toLocaleString('pt-BR')} un ({totalRecordsHl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} HL)
          </span>
        </div>
      </div>

      {/* Modal Form for Complete WQI Preenchimento */}
      {isMatrixModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-xl border shadow-2xl p-5 ${
            isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-gray-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-500" />
                <h3 className="font-extrabold text-base tracking-wide uppercase">Preenchimento Completo Matriz WQI (2025 e 2026)</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMatrixModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4 font-medium">
              O <strong>HL PERDIDO 2026</strong> é calculado 100% automaticamente com base nos registros de quebras da unidade. 
              Informe abaixo os <strong>Hectolitros Faturados (2026)</strong> para gerar o PPM 2026 e os valores históricos de <strong>PPM 2025</strong> por área.
            </p>

            <div className="overflow-x-auto rounded-lg border mb-5">
              <table className="w-full text-center text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-800 text-white font-black uppercase text-[10px]">
                    <th className="py-2 px-3 text-left border-r border-slate-700">Mês</th>
                    <th className="py-2 px-3 border-r border-slate-700 text-slate-400">HL PERDIDO (Auto)</th>
                    <th className="py-2 px-3 border-r border-slate-700 text-amber-400">HL FATURADO 2026</th>
                    <th className="py-2 px-3 border-r border-slate-700 text-amber-400">PPM 2026 (Calc)</th>
                    <th className="py-2 px-3 border-r border-slate-700 text-emerald-400">PPM 2025 (Armazém)</th>
                    <th className="py-2 px-3 border-r border-slate-700 text-emerald-400">PPM 2025 (Entrega)</th>
                    <th className="py-2 px-3 text-emerald-400">PPM 2025 (Puxada)</th>
                  </tr>
                </thead>
                <tbody className={`divide-y font-mono font-bold ${isDark ? 'divide-slate-800' : 'divide-gray-200'}`}>
                  {annualComparisonData.map((d) => (
                    <tr key={d.monthIdx} className={isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'}>
                      <td className="py-2 px-3 text-left font-sans font-extrabold border-r font-mono text-amber-500 whitespace-nowrap">
                        {d.month}
                      </td>
                      <td className="py-1 px-2 border-r text-slate-400 font-mono">
                        {d.hlPerdidoStr}
                      </td>
                      <td className="py-1 px-2 border-r">
                        <input
                          type="text"
                          placeholder="Ex: 12485,25"
                          className={`w-full text-center font-mono py-1 px-2 rounded border font-bold text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none ${
                            isDark ? 'bg-slate-800 border-slate-700 text-amber-200' : 'bg-slate-50 border-gray-300 text-slate-900'
                          }`}
                          value={hlFaturadoMap[d.monthIdx] !== undefined && hlFaturadoMap[d.monthIdx] !== null ? String(hlFaturadoMap[d.monthIdx]) : ''}
                          onChange={(e) => {
                            const valStr = e.target.value;
                            if (valStr.trim() === '') {
                              setHlFaturadoMap(prev => ({ ...prev, [d.monthIdx]: null }));
                            } else {
                              const num = parseFloat(valStr.replace(/\./g, '').replace(',', '.'));
                              if (!isNaN(num)) setHlFaturadoMap(prev => ({ ...prev, [d.monthIdx]: num }));
                            }
                          }}
                        />
                      </td>
                      <td className="py-1 px-2 border-r text-amber-400 font-black">
                        {d.val2026Display}
                      </td>
                      <td className="py-1 px-2 border-r">
                        <input
                          type="text"
                          placeholder="Ex: 26"
                          className={`w-full text-center font-mono py-1 px-2 rounded border font-bold text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none ${
                            isDark ? 'bg-slate-800 border-slate-700 text-emerald-300' : 'bg-slate-50 border-gray-300 text-slate-900'
                          }`}
                          value={real2025Data.armazem[d.monthIdx] !== null ? String(real2025Data.armazem[d.monthIdx]) : ''}
                          onChange={(e) => {
                            const valStr = e.target.value;
                            const num = valStr.trim() === '' ? null : parseFloat(valStr.replace(',', '.'));
                            setReal2025Data(prev => {
                              const newArm = [...prev.armazem];
                              newArm[d.monthIdx] = isNaN(num as any) ? null : num;
                              return { ...prev, armazem: newArm };
                            });
                          }}
                        />
                      </td>
                      <td className="py-1 px-2 border-r">
                        <input
                          type="text"
                          placeholder="Ex: 15"
                          className={`w-full text-center font-mono py-1 px-2 rounded border font-bold text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none ${
                            isDark ? 'bg-slate-800 border-slate-700 text-emerald-300' : 'bg-slate-50 border-gray-300 text-slate-900'
                          }`}
                          value={real2025Data.entrega[d.monthIdx] !== null ? String(real2025Data.entrega[d.monthIdx]) : ''}
                          onChange={(e) => {
                            const valStr = e.target.value;
                            const num = valStr.trim() === '' ? null : parseFloat(valStr.replace(',', '.'));
                            setReal2025Data(prev => {
                              const newEnt = [...prev.entrega];
                              newEnt[d.monthIdx] = isNaN(num as any) ? null : num;
                              return { ...prev, entrega: newEnt };
                            });
                          }}
                        />
                      </td>
                      <td className="py-1 px-2">
                        <input
                          type="text"
                          placeholder="Ex: 10"
                          className={`w-full text-center font-mono py-1 px-2 rounded border font-bold text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none ${
                            isDark ? 'bg-slate-800 border-slate-700 text-emerald-300' : 'bg-slate-50 border-gray-300 text-slate-900'
                          }`}
                          value={real2025Data.puxada[d.monthIdx] !== null ? String(real2025Data.puxada[d.monthIdx]) : ''}
                          onChange={(e) => {
                            const valStr = e.target.value;
                            const num = valStr.trim() === '' ? null : parseFloat(valStr.replace(',', '.'));
                            setReal2025Data(prev => {
                              const newPux = [...prev.puxada];
                              newPux[d.monthIdx] = isNaN(num as any) ? null : num;
                              return { ...prev, puxada: newPux };
                            });
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t pt-3">
              <button
                type="button"
                onClick={() => {
                  setHlFaturadoMap({});
                  setReal2025Data({ armazem: Array(12).fill(null), entrega: Array(12).fill(null), puxada: Array(12).fill(null) });
                }}
                className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded font-bold transition-colors cursor-pointer"
              >
                Limpar Todos os Valores Manuais
              </button>
              <button
                type="button"
                onClick={() => setIsMatrixModalOpen(false)}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded shadow transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Concluir e Salvar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
