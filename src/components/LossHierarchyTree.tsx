import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  X, 
  Search, 
  DollarSign, 
  Calendar, 
  Layers, 
  Box, 
  ChevronRight, 
  ChevronDown, 
  Flame, 
  Sparkles, 
  Maximize2, 
  Minimize2, 
  ExternalLink,
  ZoomIn, 
  ZoomOut, 
  Droplets, 
  PackageX, 
  Truck, 
  AlertTriangle, 
  CalendarClock, 
  ShieldAlert, 
  Wrench, 
  HelpCircle,
  Award,
  TrendingDown,
  Info,
  CheckCircle2,
  SlidersHorizontal,
  ArrowRight,
  Filter,
  BarChart3
} from 'lucide-react';
import { QuebraRow } from '../types';
import { buildOfficialQuebrasRows } from '../utils/retroactiveQuebrasParser';
import { getItemValorReal } from './WqiTab';

interface LossHierarchyTreeProps {
  quebras?: QuebraRow[];
  onClose?: () => void;
  isModal?: boolean;
}

// Helper to classify and style motives with vibrant design
function getMotivoMeta(motivoRaw: string): { 
  name: string; 
  icon: any; 
  accentColor: string; 
  lightBg: string; 
  badgeBg: string; 
  badgeText: string; 
  borderColor: string;
  glowClass: string;
} {
  let m = (motivoRaw || '').trim().toUpperCase();
  m = m.replace(/\.+$/, '');
  if (m === 'ESTUDADO') m = 'ESTUFADO';
  if (!m || m === 'SEM MOTIVO' || m === 'NÃO INFORMADO' || m === 'NULL') m = 'OUTROS / NÃO INFORMADO';

  if (m.includes('ESTUFADO')) {
    return {
      name: 'Estufado',
      icon: Flame,
      accentColor: '#d97706',
      lightBg: 'bg-amber-100/70',
      badgeBg: 'bg-amber-100/90',
      badgeText: 'text-amber-950 font-black',
      borderColor: 'border-amber-300',
      glowClass: 'border-amber-500 bg-white/95 ring-2 ring-amber-400/50 shadow-md'
    };
  }
  if (m.includes('VAZAMENTO') || m.includes('FURADO') || m.includes('FURADA') || m.includes('VAZANDO')) {
    return {
      name: 'Vazamento',
      icon: Droplets,
      accentColor: '#0284c7',
      lightBg: 'bg-sky-100/70',
      badgeBg: 'bg-sky-100/90',
      badgeText: 'text-sky-950 font-black',
      borderColor: 'border-sky-300',
      glowClass: 'border-sky-500 bg-white/95 ring-2 ring-sky-400/50 shadow-md'
    };
  }
  if (m.includes('FALTA') || m.includes('PALETE') || m.includes('EXTRAVIO')) {
    return {
      name: 'Falta no Palete',
      icon: PackageX,
      accentColor: '#e11d48',
      lightBg: 'bg-rose-100/70',
      badgeBg: 'bg-rose-100/90',
      badgeText: 'text-rose-950 font-black',
      borderColor: 'border-rose-300',
      glowClass: 'border-rose-500 bg-white/95 ring-2 ring-rose-400/50 shadow-md'
    };
  }
  if (m.includes('TRANSPORTE') || m.includes('CARRETA') || m.includes('TRANSITO') || m.includes('TRÂNSITO') || m.includes('RECEBIMENTO')) {
    return {
      name: 'Avaria Transporte',
      icon: Truck,
      accentColor: '#2563eb',
      lightBg: 'bg-blue-100/70',
      badgeBg: 'bg-blue-100/90',
      badgeText: 'text-blue-950 font-black',
      borderColor: 'border-blue-300',
      glowClass: 'border-blue-500 bg-white/95 ring-2 ring-blue-400/50 shadow-md'
    };
  }
  if (m.includes('OPERACIONAL') || m.includes('ARMAZEM') || m.includes('ARMAZÉM') || m.includes('MANUSEIO') || m.includes('EMPILHADEIRA') || m.includes('SEPARACAO') || m.includes('SEPARAÇÃO')) {
    return {
      name: 'Quebra Operacional',
      icon: AlertTriangle,
      accentColor: '#ea580c',
      lightBg: 'bg-orange-100/70',
      badgeBg: 'bg-orange-100/90',
      badgeText: 'text-orange-950 font-black',
      borderColor: 'border-orange-300',
      glowClass: 'border-orange-500 bg-white/95 ring-2 ring-orange-400/50 shadow-md'
    };
  }
  if (m.includes('VALIDADE') || m.includes('VENCIDO') || m.includes('VENCIMENTO') || m.includes('DATA')) {
    return {
      name: 'Validade / Vencido',
      icon: CalendarClock,
      accentColor: '#7c3aed',
      lightBg: 'bg-purple-100/70',
      badgeBg: 'bg-purple-100/90',
      badgeText: 'text-purple-950 font-black',
      borderColor: 'border-purple-300',
      glowClass: 'border-purple-500 bg-white/95 ring-2 ring-purple-400/50 shadow-md'
    };
  }
  if (m.includes('QUEBRA') || m.includes('QUEBRADO') || m.includes('CACO') || m.includes('ESTILHAÇADO') || m.includes('GARRAFA')) {
    return {
      name: 'Quebra de Garrafa',
      icon: ShieldAlert,
      accentColor: '#dc2626',
      lightBg: 'bg-red-100/70',
      badgeBg: 'bg-red-100/90',
      badgeText: 'text-red-950 font-black',
      borderColor: 'border-red-300',
      glowClass: 'border-red-500 bg-white/95 ring-2 ring-red-400/50 shadow-md'
    };
  }
  if (m.includes('FABRICA') || m.includes('FÁBRICA') || m.includes('DEFEITO') || m.includes('QUALIDADE') || m.includes('TAMPA') || m.includes('ROTULO')) {
    return {
      name: 'Defeito Fabricação',
      icon: Wrench,
      accentColor: '#4f46e5',
      lightBg: 'bg-indigo-100/70',
      badgeBg: 'bg-indigo-100/90',
      badgeText: 'text-indigo-950 font-black',
      borderColor: 'border-indigo-300',
      glowClass: 'border-indigo-500 bg-white/95 ring-2 ring-indigo-400/50 shadow-md'
    };
  }

  const formatted = m.length > 22 ? m.slice(0, 22) + '...' : m.charAt(0).toUpperCase() + m.slice(1).toLowerCase();
  return {
    name: formatted,
    icon: HelpCircle,
    accentColor: '#475569',
    lightBg: 'bg-slate-100/70',
    badgeBg: 'bg-slate-100/90',
    badgeText: 'text-slate-800 font-bold',
    borderColor: 'border-slate-300',
    glowClass: 'border-slate-500 bg-white/95 ring-2 ring-slate-400/50 shadow-md'
  };
}

// Packaging metadata helper
function getPackagingType(row: QuebraRow): { name: string; badge: string; glowClass: string } {
  const emb = (row.embalagem || '').toUpperCase().trim();
  const desc = (row.descricao || '').toUpperCase().trim();

  if (emb) {
    if (emb.includes('350') || emb.includes('LATA 350') || (emb.includes('LATA') && !emb.includes('269') && !emb.includes('473'))) {
      return { 
        name: 'Lata 350ml', 
        badge: 'bg-sky-100 text-sky-900 border-sky-300 font-black', 
        glowClass: 'border-sky-500 bg-white/95 ring-2 ring-sky-400/50 shadow-md' 
      };
    }
    if (emb.includes('269') || emb.includes('SLEEK') || emb.includes('269ML')) {
      return { 
        name: 'Lata 269ml', 
        badge: 'bg-cyan-100 text-cyan-900 border-cyan-300 font-black', 
        glowClass: 'border-cyan-500 bg-white/95 ring-2 ring-cyan-400/50 shadow-md' 
      };
    }
    if (emb.includes('473') || emb.includes('LATAO') || emb.includes('550')) {
      return { 
        name: 'Latão 473ml', 
        badge: 'bg-blue-100 text-blue-900 border-blue-300 font-black', 
        glowClass: 'border-blue-500 bg-white/95 ring-2 ring-blue-400/50 shadow-md' 
      };
    }
    if (emb.includes('LN') || emb.includes('LONG NECK') || emb.includes('330') || emb.includes('355')) {
      return { 
        name: 'Long Neck', 
        badge: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-black', 
        glowClass: 'border-emerald-500 bg-white/95 ring-2 ring-emerald-400/50 shadow-md' 
      };
    }
    if (emb.includes('600') || emb.includes('RGB 600') || emb.includes('GARRAFA 600')) {
      return { 
        name: 'Garrafa 600ml', 
        badge: 'bg-amber-100 text-amber-900 border-amber-300 font-black', 
        glowClass: 'border-amber-500 bg-white/95 ring-2 ring-amber-400/50 shadow-md' 
      };
    }
    if (emb.includes('1L') || emb.includes('1000') || emb.includes('LITRAO') || emb.includes('LITRÃO')) {
      return { 
        name: 'Garrafa 1L', 
        badge: 'bg-orange-100 text-orange-900 border-orange-300 font-black', 
        glowClass: 'border-orange-500 bg-white/95 ring-2 ring-orange-400/50 shadow-md' 
      };
    }
    if (emb.includes('300') || emb.includes('MINI') || emb.includes('RETORNINHA')) {
      return { 
        name: 'Garrafa 300ml', 
        badge: 'bg-yellow-100 text-yellow-900 border-yellow-300 font-black', 
        glowClass: 'border-yellow-500 bg-white/95 ring-2 ring-yellow-400/50 shadow-md' 
      };
    }
    if (emb.includes('2L') || emb.includes('PET')) {
      return { 
        name: 'PET 2L', 
        badge: 'bg-teal-100 text-teal-900 border-teal-300 font-black', 
        glowClass: 'border-teal-500 bg-white/95 ring-2 ring-teal-400/50 shadow-md' 
      };
    }
    if (emb.includes('BAR') || emb.includes('CHOPP') || emb.includes('30L') || emb.includes('50L') || emb.includes('KEG')) {
      return { 
        name: 'Barril Chopp', 
        badge: 'bg-purple-100 text-purple-900 border-purple-300 font-black', 
        glowClass: 'border-purple-500 bg-white/95 ring-2 ring-purple-400/50 shadow-md' 
      };
    }
    if (emb.includes('CX') || emb.includes('CAIXA') || emb.includes('INTEIRA') || emb.includes('DISPLAY')) {
      return { 
        name: 'Caixa / Display', 
        badge: 'bg-indigo-100 text-indigo-900 border-indigo-300 font-black', 
        glowClass: 'border-indigo-500 bg-white/95 ring-2 ring-indigo-400/50 shadow-md' 
      };
    }
  }

  if (desc.includes('350ML') || (desc.includes('LT') && desc.includes('350')) || desc.includes('LATA 350')) {
    return { name: 'Lata 350ml', badge: 'bg-sky-100 text-sky-900 border-sky-300 font-black', glowClass: 'border-sky-500 bg-white/95 ring-2 ring-sky-400/50 shadow-md' };
  }
  if (desc.includes('269ML') || (desc.includes('LT') && desc.includes('269'))) {
    return { name: 'Lata 269ml', badge: 'bg-cyan-100 text-cyan-900 border-cyan-300 font-black', glowClass: 'border-cyan-500 bg-white/95 ring-2 ring-cyan-400/50 shadow-md' };
  }
  if (desc.includes('473ML') || desc.includes('LATAO') || desc.includes('LATÃO') || desc.includes('550ML')) {
    return { name: 'Latão 473ml', badge: 'bg-blue-100 text-blue-900 border-blue-300 font-black', glowClass: 'border-blue-500 bg-white/95 ring-2 ring-blue-400/50 shadow-md' };
  }
  if (desc.includes('LN') || desc.includes('LONG NECK') || desc.includes('330ML') || desc.includes('355ML')) {
    return { name: 'Long Neck', badge: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-black', glowClass: 'border-emerald-500 bg-white/95 ring-2 ring-emerald-400/50 shadow-md' };
  }
  if (desc.includes('600ML') || desc.includes('RGB 600') || desc.includes('GF 600')) {
    return { name: 'Garrafa 600ml', badge: 'bg-amber-100 text-amber-900 border-amber-300 font-black', glowClass: 'border-amber-500 bg-white/95 ring-2 ring-amber-400/50 shadow-md' };
  }
  if (desc.includes('1L') || desc.includes('LITRAO') || desc.includes('LITRÃO') || desc.includes('1000ML')) {
    return { name: 'Garrafa 1L', badge: 'bg-orange-100 text-orange-900 border-orange-300 font-black', glowClass: 'border-orange-500 bg-white/95 ring-2 ring-orange-400/50 shadow-md' };
  }
  if (desc.includes('300ML') || desc.includes('RETORNINHA')) {
    return { name: 'Garrafa 300ml', badge: 'bg-yellow-100 text-yellow-900 border-yellow-300 font-black', glowClass: 'border-yellow-500 bg-white/95 ring-2 ring-yellow-400/50 shadow-md' };
  }
  if (desc.includes('2L') || desc.includes('PET')) {
    return { name: 'PET 2L', badge: 'bg-teal-100 text-teal-900 border-teal-300 font-black', glowClass: 'border-teal-500 bg-white/95 ring-2 ring-teal-400/50 shadow-md' };
  }
  if (desc.includes('CHOPP') || desc.includes('BAR') || desc.includes('50L') || desc.includes('30L')) {
    return { name: 'Barril Chopp', badge: 'bg-purple-100 text-purple-900 border-purple-300 font-black', glowClass: 'border-purple-500 bg-white/95 ring-2 ring-purple-400/50 shadow-md' };
  }

  return { name: 'Embalagem Geral', badge: 'bg-slate-100 text-slate-900 border-slate-300 font-black', glowClass: 'border-slate-500 bg-white/95 ring-2 ring-slate-400/50 shadow-md' };
}

// Formats Month into "Janeiro/2026"
function formatMonthKey(row: QuebraRow): { key: string; label: string; mesNome: string; ano: string } {
  let mes = '01';
  let ano = '2026';

  if (row.mes && row.mes.includes('/')) {
    const parts = row.mes.split('/');
    mes = parts[0].padStart(2, '0');
    ano = parts[1] || '2026';
  } else if (row.dataISO && row.dataISO.includes('-')) {
    const parts = row.dataISO.split('-');
    ano = parts[0];
    mes = parts[1];
  } else if (row.data && row.data.includes('/')) {
    const parts = row.data.split('/');
    mes = parts[1].padStart(2, '0');
    ano = parts[2] || '2026';
    if (ano.length === 2) ano = '20' + ano;
  }

  const mesesNomes = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const mIndex = Math.max(0, Math.min(11, parseInt(mes, 10) - 1));
  const mesNome = mesesNomes[mIndex] || `Mês ${mes}`;

  return {
    key: `${ano}-${mes}`,
    label: `${mesNome}/${ano}`,
    mesNome,
    ano
  };
}

export default function LossHierarchyTree({
  quebras,
  onClose,
  isModal = false
}: LossHierarchyTreeProps) {
  // ── DISPLAY CONTROLS ──
  const [metricMode, setMetricMode] = useState<'valor' | 'quantidade'>('valor');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(isModal);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [expandedProducts, setExpandedProducts] = useState<Record<string, boolean>>({});

  // ── SELECTION STATE FOR 5 LEVELS ──
  const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(null);
  const [selectedMotivoKey, setSelectedMotivoKey] = useState<string | null>(null);
  const [selectedPackagingKey, setSelectedPackagingKey] = useState<string | null>(null);

  // ── DOM REFS FOR CONNECTOR CALCULATION ──
  const containerRef = useRef<HTMLDivElement>(null);
  const rootCardRef = useRef<HTMLDivElement>(null);
  const monthCardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const motivoCardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const packagingCardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const top10ContainerRef = useRef<HTMLDivElement | null>(null);

  const [svgPaths, setSvgPaths] = useState<Array<{ 
    id: string; 
    d: string; 
    gradientId: string;
    color: string; 
    startPoint: { x: number; y: number }; 
    endPoint: { x: number; y: number } 
  }>>([]);

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreen && !isModal) {
          setIsFullscreen(false);
        } else if (onClose) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isFullscreen, isModal]);

  // ── DATA PREPARATION & HIERARCHY TREE CALCULATION ──
  const effectiveQuebras = useMemo(() => {
    if (quebras && Array.isArray(quebras) && quebras.length > 0) return quebras;
    try {
      const saved = localStorage.getItem('quebras_demo');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return buildOfficialQuebrasRows('demo');
  }, [quebras]);

  const hierarchyData = useMemo(() => {
    if (!effectiveQuebras || effectiveQuebras.length === 0) {
      return {
        totalValor: 0,
        totalQtd: 0,
        totalRegistros: 0,
        ticketMedio: 0,
        months: [],
        criticalMonthKey: null
      };
    }

    let grandTotalValor = 0;
    let grandTotalQtd = 0;
    let grandTotalRegistros = effectiveQuebras.length;

    // 1. Group by Month -> Motivo -> Embalagem -> Produtos
    const monthsMap = new Map<string, {
      monthKey: string;
      label: string;
      mesNome: string;
      ano: string;
      valor: number;
      qtd: number;
      registrosCount: number;
      skusSet: Set<string>;
      motivosMap: Map<string, {
        motivoName: string;
        icon: any;
        accentColor: string;
        lightBg: string;
        badgeBg: string;
        badgeText: string;
        borderColor: string;
        glowClass: string;
        valor: number;
        qtd: number;
        registrosCount: number;
        skusSet: Set<string>;
        packagingsMap: Map<string, {
          packagingName: string;
          badge: string;
          glowClass: string;
          valor: number;
          qtd: number;
          registrosCount: number;
          skusSet: Set<string>;
          productsMap: Map<string, {
            codProduto: string;
            descricao: string;
            embalagem: string;
            valorUnitario: number;
            valorTotal: number;
            quantidade: number;
            registrosCount: number;
            rows: QuebraRow[];
          }>;
        }>;
      }>;
    }>();

    effectiveQuebras.forEach(row => {
      const q = Math.abs(row.quantidade || 0);
      const val = getItemValorReal(row);
      grandTotalValor += val;
      grandTotalQtd += q;

      const mMeta = formatMonthKey(row);
      const motMeta = getMotivoMeta(row.motivo || '');
      const pkgMeta = getPackagingType(row);
      const cod = row.codProduto || '0000';
      const desc = row.descricao || 'Produto Indefinido';
      const unitVal = row.valorUnitario || (q > 0 ? val / q : (val > 0 ? val : 0));

      // Level 2: Month
      if (!monthsMap.has(mMeta.key)) {
        monthsMap.set(mMeta.key, {
          monthKey: mMeta.key,
          label: mMeta.label,
          mesNome: mMeta.mesNome,
          ano: mMeta.ano,
          valor: 0,
          qtd: 0,
          registrosCount: 0,
          skusSet: new Set(),
          motivosMap: new Map()
        });
      }
      const mItem = monthsMap.get(mMeta.key)!;
      mItem.valor += val;
      mItem.qtd += q;
      mItem.registrosCount += 1;
      mItem.skusSet.add(cod);

      // Level 3: Motivo da Perda
      if (!mItem.motivosMap.has(motMeta.name)) {
        mItem.motivosMap.set(motMeta.name, {
          motivoName: motMeta.name,
          icon: motMeta.icon,
          accentColor: motMeta.accentColor,
          lightBg: motMeta.lightBg,
          badgeBg: motMeta.badgeBg,
          badgeText: motMeta.badgeText,
          borderColor: motMeta.borderColor,
          glowClass: motMeta.glowClass,
          valor: 0,
          qtd: 0,
          registrosCount: 0,
          skusSet: new Set(),
          packagingsMap: new Map()
        });
      }
      const motItem = mItem.motivosMap.get(motMeta.name)!;
      motItem.valor += val;
      motItem.qtd += q;
      motItem.registrosCount += 1;
      motItem.skusSet.add(cod);

      // Level 4: Embalagem / Tipo
      if (!motItem.packagingsMap.has(pkgMeta.name)) {
        motItem.packagingsMap.set(pkgMeta.name, {
          packagingName: pkgMeta.name,
          badge: pkgMeta.badge,
          glowClass: pkgMeta.glowClass,
          valor: 0,
          qtd: 0,
          registrosCount: 0,
          skusSet: new Set(),
          productsMap: new Map()
        });
      }
      const pItem = motItem.packagingsMap.get(pkgMeta.name)!;
      pItem.valor += val;
      pItem.qtd += q;
      pItem.registrosCount += 1;
      pItem.skusSet.add(cod);

      // Level 5: Produtos
      const prodKey = String(cod && cod !== 'S/C' ? cod : desc);
      if (!pItem.productsMap.has(prodKey)) {
        pItem.productsMap.set(prodKey, {
          codProduto: String(cod),
          descricao: desc,
          embalagem: pkgMeta.name,
          valorUnitario: unitVal,
          valorTotal: 0,
          quantidade: 0,
          registrosCount: 0,
          rows: []
        });
      }
      const prodItem = pItem.productsMap.get(prodKey)!;
      prodItem.valorTotal += val;
      prodItem.quantidade += q;
      prodItem.registrosCount += 1;
      prodItem.rows.push(row);
    });

    const sortedMonths = Array.from(monthsMap.values()).sort((a, b) => a.monthKey.localeCompare(b.monthKey));

    let maxMonthLoss = -1;
    let criticalMonthKey: string | null = null;
    sortedMonths.forEach(m => {
      if (m.valor > maxMonthLoss) {
        maxMonthLoss = m.valor;
        criticalMonthKey = m.monthKey;
      }
    });

    const ticketMedio = grandTotalRegistros > 0 ? grandTotalValor / grandTotalRegistros : 0;

    return {
      totalValor: grandTotalValor,
      totalQtd: grandTotalQtd,
      totalRegistros: grandTotalRegistros,
      ticketMedio,
      months: sortedMonths,
      criticalMonthKey
    };
  }, [effectiveQuebras]);

  // Effective Month
  const effectiveMonthKey = useMemo(() => {
    if (selectedMonthKey && hierarchyData.months.some(m => m.monthKey === selectedMonthKey)) {
      return selectedMonthKey;
    }
    return hierarchyData.criticalMonthKey || hierarchyData.months[0]?.monthKey || null;
  }, [hierarchyData.months, hierarchyData.criticalMonthKey, selectedMonthKey]);

  // Active Month Data
  const activeMonth = useMemo(() => {
    return hierarchyData.months.find(m => m.monthKey === effectiveMonthKey) || hierarchyData.months[0] || null;
  }, [hierarchyData.months, effectiveMonthKey]);

  // Sorted Motivos for Active Month
  const activeMotivos = useMemo(() => {
    if (!activeMonth) return [];
    const list = Array.from(activeMonth.motivosMap.values());
    return list.sort((a, b) => (metricMode === 'valor' ? b.valor - a.valor : b.qtd - a.qtd));
  }, [activeMonth, metricMode]);

  // Effective Motivo
  const effectiveMotivoKey = useMemo(() => {
    if (selectedMotivoKey && activeMotivos.some(m => m.motivoName === selectedMotivoKey)) {
      return selectedMotivoKey;
    }
    return activeMotivos[0]?.motivoName || null;
  }, [activeMotivos, selectedMotivoKey]);

  // Active Motivo Data
  const activeMotivo = useMemo(() => {
    if (!activeMonth) return null;
    return activeMonth.motivosMap.get(effectiveMotivoKey || '') || activeMotivos[0] || null;
  }, [activeMonth, activeMotivos, effectiveMotivoKey]);

  // Sorted Packagings for Active Motivo
  const activePackagings = useMemo(() => {
    if (!activeMotivo) return [];
    const list = Array.from(activeMotivo.packagingsMap.values());
    return list.sort((a, b) => (metricMode === 'valor' ? b.valor - a.valor : b.qtd - a.qtd));
  }, [activeMotivo, metricMode]);

  // Effective Packaging
  const effectivePackagingKey = useMemo(() => {
    if (selectedPackagingKey && activePackagings.some(p => p.packagingName === selectedPackagingKey)) {
      return selectedPackagingKey;
    }
    return activePackagings[0]?.packagingName || null;
  }, [activePackagings, selectedPackagingKey]);

  // Active Packaging Data
  const activePackaging = useMemo(() => {
    if (!activeMotivo) return null;
    return activeMotivo.packagingsMap.get(effectivePackagingKey || '') || activePackagings[0] || null;
  }, [activeMotivo, activePackagings, effectivePackagingKey]);

  // Sorted Top 10 Products for Active Packaging
  const activeTop10Products = useMemo(() => {
    if (!activePackaging) return [];
    let list = Array.from(activePackaging.productsMap.values());
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(p => 
        p.descricao.toLowerCase().includes(term) || 
        p.codProduto.toLowerCase().includes(term) ||
        p.rows.some(r => r.motivo && r.motivo.toLowerCase().includes(term))
      );
    }
    list.sort((a, b) => (metricMode === 'valor' ? b.valorTotal - a.valorTotal : b.quantidade - a.quantidade));
    return list.slice(0, 10);
  }, [activePackaging, metricMode, searchTerm]);

  // ── LUXURY LUMINOUS SVG BEZIER CURVES ──
  const calculateConnectors = useCallback(() => {
    if (!containerRef.current || !rootCardRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newPaths: Array<{ 
      id: string; 
      d: string; 
      gradientId: string;
      color: string; 
      startPoint: { x: number; y: number }; 
      endPoint: { x: number; y: number } 
    }> = [];

    const getRightAnchor = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      return {
        x: r.right - containerRect.left,
        y: r.top + r.height / 2 - containerRect.top
      };
    };

    const getLeftAnchor = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      return {
        x: r.left - containerRect.left,
        y: r.top + r.height / 2 - containerRect.top
      };
    };

    const createSmoothCurve = (start: { x: number; y: number }, end: { x: number; y: number }) => {
      const deltaX = Math.max(28, end.x - start.x);
      const c1X = start.x + deltaX * 0.48;
      const c1Y = start.y;
      const c2X = start.x + deltaX * 0.52;
      const c2Y = end.y;
      return `M ${start.x} ${start.y} C ${c1X} ${c1Y}, ${c2X} ${c2Y}, ${end.x} ${end.y}`;
    };

    // 1. Root -> Selected Month
    const rootAnchor = getRightAnchor(rootCardRef.current);
    if (effectiveMonthKey && monthCardRefs.current[effectiveMonthKey]) {
      const mEl = monthCardRefs.current[effectiveMonthKey]!;
      const mLeft = getLeftAnchor(mEl);
      const isCritical = effectiveMonthKey === hierarchyData.criticalMonthKey;
      const color = isCritical ? '#f43f5e' : '#2563eb';
      newPaths.push({
        id: `root-to-${effectiveMonthKey}`,
        d: createSmoothCurve(rootAnchor, mLeft),
        gradientId: isCritical ? 'grad-root-rose' : 'grad-root-blue',
        color,
        startPoint: rootAnchor,
        endPoint: mLeft
      });

      // 2. Selected Month -> Selected Motivo
      const mRight = getRightAnchor(mEl);
      if (effectiveMotivoKey && motivoCardRefs.current[effectiveMotivoKey]) {
        const motEl = motivoCardRefs.current[effectiveMotivoKey]!;
        const motLeft = getLeftAnchor(motEl);
        newPaths.push({
          id: `month-to-${effectiveMotivoKey}`,
          d: createSmoothCurve(mRight, motLeft),
          gradientId: 'grad-month-amber',
          color: '#f59e0b',
          startPoint: mRight,
          endPoint: motLeft
        });

        // 3. Selected Motivo -> Selected Packaging
        const motRight = getRightAnchor(motEl);
        if (effectivePackagingKey && packagingCardRefs.current[effectivePackagingKey]) {
          const pEl = packagingCardRefs.current[effectivePackagingKey]!;
          const pLeft = getLeftAnchor(pEl);
          newPaths.push({
            id: `motivo-to-${effectivePackagingKey}`,
            d: createSmoothCurve(motRight, pLeft),
            gradientId: 'grad-motivo-sky',
            color: '#0ea5e9',
            startPoint: motRight,
            endPoint: pLeft
          });

          // 4. Selected Packaging -> Top 10 Column
          if (top10ContainerRef.current) {
            const top10Anchor = getLeftAnchor(top10ContainerRef.current);
            newPaths.push({
              id: `pkg-to-top10`,
              d: createSmoothCurve(getRightAnchor(pEl), top10Anchor),
              gradientId: 'grad-pkg-emerald',
              color: '#10b981',
              startPoint: getRightAnchor(pEl),
              endPoint: top10Anchor
            });
          }
        }
      }
    }

    setSvgPaths(newPaths);
  }, [
    effectiveMonthKey, 
    effectiveMotivoKey, 
    effectivePackagingKey, 
    hierarchyData.criticalMonthKey
  ]);

  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      calculateConnectors();
    });
    const handleResize = () => {
      requestAnimationFrame(calculateConnectors);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(handle);
      window.removeEventListener('resize', handleResize);
    };
  }, [calculateConnectors, zoomLevel, isFullscreen]);

  const toggleProductExpansion = (cod: string) => {
    setExpandedProducts(prev => ({
      ...prev,
      [cod]: !prev[cod]
    }));
    requestAnimationFrame(calculateConnectors);
  };

  const criticalMonthObj = useMemo(() => {
    return hierarchyData.months.find(m => m.monthKey === hierarchyData.criticalMonthKey) || null;
  }, [hierarchyData]);

  const maxMonthValue = useMemo(() => {
    return Math.max(...hierarchyData.months.map(m => metricMode === 'valor' ? m.valor : m.qtd), 1);
  }, [hierarchyData.months, metricMode]);

  // Exact background style identical to platform's light-theme
  const platformGradientStyle: React.CSSProperties = {
    backgroundColor: '#dbeafe',
    backgroundImage: `
      radial-gradient(ellipse 60% 55% at -5% -5%, rgba(29, 78, 216, 0.70) 0%, rgba(37, 99, 235, 0.45) 35%, transparent 75%),
      radial-gradient(ellipse 55% 50% at 105% -5%, rgba(30, 58, 138, 0.65) 0%, rgba(37, 99, 235, 0.45) 35%, transparent 75%),
      radial-gradient(ellipse 65% 60% at 105% 105%, rgba(30, 58, 138, 0.90) 0%, rgba(29, 78, 216, 0.70) 30%, rgba(59, 130, 246, 0.40) 60%, transparent 85%),
      radial-gradient(ellipse 55% 50% at -5% 105%, rgba(37, 99, 235, 0.60) 0%, rgba(96, 165, 250, 0.40) 40%, transparent 75%),
      radial-gradient(ellipse 90% 80% at 50% 50%, #e2eeff 0%, #cee3fe 45%, #b9d7fd 100%)
    `,
    backgroundAttachment: 'local',
    backgroundSize: '100% 100%'
  };

  return (
    <div 
      style={platformGradientStyle}
      className={`flex flex-col w-full text-slate-900 transition-all font-sans antialiased relative shadow-lg ${
        isFullscreen 
          ? 'fixed inset-0 z-50 overflow-hidden' 
          : 'rounded-2xl border border-blue-300/80 overflow-hidden'
      }`}
    >
      {/* ── TOP CONTROL & FILTER BAR (ORGANIZADO, SEM CONFLITO DE ALTURA) ── */}
      <div className="bg-white/90 backdrop-blur-md border-b border-blue-200/90 px-4 sm:px-6 py-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shrink-0 shadow-xs z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-800 text-amber-300 flex items-center justify-center shadow-xs shrink-0 ring-1 ring-blue-400/30">
            <Layers className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-black uppercase text-blue-950 tracking-wider">
                Árvore de Decomposição de Perdas
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-100 text-amber-900 border border-amber-300">
                5 Níveis
              </span>
            </div>
            <p className="text-[11px] text-blue-900/70 font-medium">
              Navegue do macro ao micro com visão analítica ponta a ponta
            </p>
          </div>
        </div>

        {/* CONTROLS: CRITICAL MONTH, METRIC SWITCH, ZOOM, SEARCH, FULLSCREEN */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          {criticalMonthObj && (
            <div className="px-3 py-1 rounded-xl bg-rose-100/90 border border-rose-300 flex items-center gap-1.5 text-rose-950 text-xs font-black shadow-2xs">
              <Flame className="w-3.5 h-3.5 text-rose-600 animate-pulse shrink-0" />
              <span className="text-[11px]">
                Mês Crítico: <strong className="text-rose-900 uppercase">{criticalMonthObj.mesNome}/{criticalMonthObj.ano}</strong> (
                {hierarchyData.totalValor > 0 
                  ? `${((criticalMonthObj.valor / hierarchyData.totalValor) * 100).toFixed(1)}%`
                  : '0%'}
                )
              </span>
            </div>
          )}

          {/* METRIC SWITCH */}
          <div className="flex items-center bg-blue-100/80 p-0.5 rounded-xl border border-blue-300/80 shadow-2xs">
            <button
              onClick={() => setMetricMode('valor')}
              className={`px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                metricMode === 'valor'
                  ? 'bg-white text-blue-950 shadow-xs border border-blue-200'
                  : 'text-blue-900/70 hover:text-blue-950'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              R$ Prejuízo
            </button>
            <button
              onClick={() => setMetricMode('quantidade')}
              className={`px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                metricMode === 'quantidade'
                  ? 'bg-white text-blue-950 shadow-xs border border-blue-200'
                  : 'text-blue-900/70 hover:text-blue-950'
              }`}
            >
              <Box className="w-3.5 h-3.5 text-blue-600" />
              Volume (un)
            </button>
          </div>

          {/* SEARCH FIELD */}
          <div className="relative w-36 sm:w-44">
            <Search className="w-3.5 h-3.5 text-blue-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filtrar..."
              className="w-full bg-white text-blue-950 placeholder:text-blue-900/50 text-xs rounded-xl pl-8 pr-3 py-1.5 border border-blue-200 outline-none focus:border-blue-500 transition-all font-medium shadow-2xs"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-900"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* ZOOM & FULLSCREEN */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center bg-blue-100/80 p-0.5 rounded-xl border border-blue-300/80 text-xs font-bold">
              <button
                onClick={() => {
                  setZoomLevel(prev => Math.max(75, prev - 5));
                  setTimeout(calculateConnectors, 100);
                }}
                title="Reduzir Zoom"
                className="p-1 rounded hover:bg-white text-blue-800 transition-colors"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-1.5 font-mono text-blue-950 font-bold text-[10px]">{zoomLevel}%</span>
              <button
                onClick={() => {
                  setZoomLevel(prev => Math.min(120, prev + 5));
                  setTimeout(calculateConnectors, 100);
                }}
                title="Aumentar Zoom"
                className="p-1 rounded hover:bg-white text-blue-800 transition-colors"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={() => {
                const url = `${window.location.origin}${window.location.pathname}?view=loss-tree`;
                window.open(url, '_blank');
              }}
              title="Expandir e abrir em outra página / aba exclusiva"
              className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nova Página</span>
            </button>

            <button
              onClick={() => {
                setIsFullscreen(!isFullscreen);
                setTimeout(calculateConnectors, 100);
              }}
              title={isFullscreen ? 'Reduzir Tela' : 'Ver em Tela Cheia'}
              className="p-1.5 rounded-xl bg-white hover:bg-blue-50 text-blue-950 border border-blue-300 transition-all cursor-pointer shadow-2xs"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {(onClose || isFullscreen) && (
              <button
                onClick={() => {
                  if (isFullscreen && !isModal) {
                    setIsFullscreen(false);
                  } else if (onClose) {
                    onClose();
                  }
                }}
                title="Fechar"
                className="p-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300 transition-all cursor-pointer shadow-2xs"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── BREADCRUMB ACTIVE PATH (ALINHADO E ELEGANTE) ── */}
      <div className="bg-white/70 backdrop-blur-sm border-b border-blue-200/80 px-4 sm:px-6 py-2 flex items-center gap-2 text-xs font-mono overflow-x-auto shrink-0 z-10">
        <span className="text-blue-950/70 flex items-center gap-1 shrink-0 font-sans font-black text-[10px] uppercase tracking-widest">
          <Layers className="w-3 h-3 text-blue-700" />
          Foco Ativo:
        </span>
        <span className="font-bold text-blue-950 bg-white px-2.5 py-0.5 rounded-lg border border-blue-300 shadow-2xs shrink-0 text-[11px]">
          Total Geral
        </span>
        {activeMonth && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className={`font-bold px-2.5 py-0.5 rounded-lg border shadow-2xs shrink-0 text-[11px] ${
              activeMonth.monthKey === hierarchyData.criticalMonthKey 
                ? 'bg-rose-100 text-rose-950 border-rose-300' 
                : 'bg-blue-100 text-blue-950 border-blue-300'
            }`}>
              {activeMonth.mesNome}/{activeMonth.ano}
            </span>
          </>
        )}
        {activeMotivo && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="font-bold px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-950 border border-amber-300 shadow-2xs shrink-0 text-[11px]">
              {activeMotivo.motivoName}
            </span>
          </>
        )}
        {activePackaging && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="font-bold px-2.5 py-0.5 rounded-lg bg-sky-100 text-sky-950 border border-sky-300 shadow-2xs shrink-0 text-[11px]">
              {activePackaging.packagingName}
            </span>
          </>
        )}
        <ChevronRight className="w-3.5 h-3.5 text-blue-400 shrink-0" />
        <span className="font-bold px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-950 border border-emerald-300 shadow-2xs shrink-0 text-[11px]">
          Top 10 Itens
        </span>
      </div>

      {/* ── MAIN 5-COLUMNS WORKSPACE ── */}
      <div 
        ref={containerRef}
        onScroll={calculateConnectors}
        className={`relative flex-1 overflow-x-auto overflow-y-auto p-4 sm:p-5 select-none ${
          isFullscreen ? 'h-[calc(100vh-130px)]' : 'min-h-[580px] h-[calc(100vh-210px)] max-h-[780px]'
        }`}
      >
        {/* DYNAMIC SVG CANVAS FOR LUMINOUS ARCHITECTURAL BEZIER CURVES */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <defs>
            <linearGradient id="grad-root-blue" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#1d4ed8" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="grad-root-rose" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#be123c" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="grad-month-amber" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#b45309" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="grad-motivo-sky" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#0369a1" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="grad-pkg-emerald" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#047857" stopOpacity="1" />
            </linearGradient>
            <filter id="soft-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#1e3a8a" floodOpacity="0.15" />
            </filter>
          </defs>
          {svgPaths.map((path, pIdx) => (
            <g key={`path-${path.id}-${pIdx}`}>
              <path
                d={path.d}
                fill="none"
                stroke={`url(#${path.gradientId})`}
                strokeWidth="3.2"
                strokeLinecap="round"
                filter="url(#soft-glow)"
                className="transition-all duration-300"
              />
              <circle
                cx={path.startPoint.x}
                cy={path.startPoint.y}
                r="4.5"
                fill={path.color}
                stroke="#ffffff"
                strokeWidth="2.5"
                className="shadow-sm"
              />
              <circle
                cx={path.endPoint.x}
                cy={path.endPoint.y}
                r="4.5"
                fill={path.color}
                stroke="#ffffff"
                strokeWidth="2.5"
                className="shadow-sm"
              />
            </g>
          ))}
        </svg>

        {/* 5 HIERARCHICAL COLUMNS COM CARDS VIDRO TRANSLÚCIDO IMPECÁVEIS */}
        <div 
          style={{ 
            zoom: zoomLevel !== 100 ? `${zoomLevel}%` : undefined,
            transformOrigin: 'top left'
          }}
          className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 lg:gap-4 w-full min-w-[1120px] items-start"
        >

          {/* ══════════════════════════════════════════════════════════════
              COLUNA 1: TOTAL GERAL (CARD RAIZ EXECUTIVO)
             ══════════════════════════════════════════════════════════════ */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-black uppercase text-blue-950 tracking-wider flex items-center gap-1.5">
                <span className="w-4.5 h-4.5 rounded-full bg-gradient-to-r from-blue-700 to-indigo-700 text-white flex items-center justify-center text-[9px] font-mono shadow-xs">01</span>
                Total Geral
              </span>
              <span className="text-[10px] text-blue-900/70 font-black uppercase tracking-wider">Raiz</span>
            </div>

            <div
              ref={rootCardRef}
              className="bg-white/95 backdrop-blur-md text-slate-900 rounded-2xl p-4.5 shadow-md border border-blue-200 space-y-3.5 relative overflow-hidden transition-all hover:shadow-lg hover:border-blue-400"
            >
              <div className="flex items-center justify-between border-b border-blue-100 pb-2.5">
                <span className="text-[9px] font-black uppercase tracking-wider text-blue-900 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                  Consolidado
                </span>
                <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Base Ativa
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">Prejuízo Total</span>
                <strong className="text-2xl font-mono font-black text-rose-600 block leading-tight mt-0.5 tracking-tight">
                  {metricMode === 'valor' 
                    ? `R$ ${hierarchyData.totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : `${hierarchyData.totalQtd.toLocaleString('pt-BR')} un`}
                </strong>
                <span className="text-[11px] text-slate-600 font-medium block mt-1">
                  {metricMode === 'valor'
                    ? `${hierarchyData.totalQtd.toLocaleString('pt-BR')} unidades avariadas`
                    : `Impacto: R$ ${hierarchyData.totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-blue-100">
                <div className="bg-blue-50/80 p-2 rounded-xl border border-blue-200">
                  <span className="text-[9px] text-blue-900/70 uppercase font-bold block">Lançamentos</span>
                  <strong className="font-mono text-blue-950 text-xs block mt-0.5">
                    {hierarchyData.totalRegistros}
                  </strong>
                </div>
                <div className="bg-blue-50/80 p-2 rounded-xl border border-blue-200">
                  <span className="text-[9px] text-blue-900/70 uppercase font-bold block">Ticket Médio</span>
                  <strong className="font-mono text-emerald-700 text-xs block mt-0.5">
                    R$ {hierarchyData.ticketMedio.toFixed(2)}
                  </strong>
                </div>
              </div>

              <div className="p-2.5 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 rounded-xl border border-amber-400/40 text-[11px] text-slate-800 flex items-center gap-2 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span><strong>{hierarchyData.months.length} meses</strong> no histórico.</span>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              COLUNA 2: MESES / PERÍODO
             ══════════════════════════════════════════════════════════════ */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-black uppercase text-blue-950 tracking-wider flex items-center gap-1.5">
                <span className="w-4.5 h-4.5 rounded-full bg-gradient-to-r from-blue-600 to-blue-800 text-white flex items-center justify-center text-[9px] font-mono shadow-xs">02</span>
                Meses / Período
              </span>
              <span className="text-[10px] text-blue-900/70 font-black uppercase tracking-wider">{hierarchyData.months.length} Meses</span>
            </div>

            <div className="space-y-2 max-h-[calc(100vh-290px)] min-h-[460px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-blue-300">
              {hierarchyData.months.length === 0 ? (
                <div className="p-6 text-center bg-white/95 border border-blue-200 rounded-2xl text-slate-500 text-xs backdrop-blur-md shadow-xs space-y-1.5">
                  <Calendar className="w-6 h-6 text-blue-400 mx-auto opacity-70" />
                  <p className="font-bold text-slate-700">Nenhum mês no histórico</p>
                  <p className="text-[11px] text-slate-400">A árvore será populada automaticamente ao registrar quebras.</p>
                </div>
              ) : (
                hierarchyData.months.map((m, mIdx) => {
                const isSelected = effectiveMonthKey === m.monthKey;
                const isCritical = m.monthKey === hierarchyData.criticalMonthKey;
                const metricVal = metricMode === 'valor' ? m.valor : m.qtd;
                const progressPercent = Math.min(100, Math.round((metricVal / maxMonthValue) * 100));
                const sharePercent = hierarchyData.totalValor > 0 
                  ? ((m.valor / hierarchyData.totalValor) * 100).toFixed(1)
                  : '0.0';

                return (
                  <div
                    key={`month-${m.monthKey}-${mIdx}`}
                    ref={el => { monthCardRefs.current[m.monthKey] = el; }}
                    onClick={() => {
                      setSelectedMonthKey(m.monthKey);
                      requestAnimationFrame(calculateConnectors);
                    }}
                    className={`rounded-xl border transition-all cursor-pointer relative overflow-hidden group p-3 backdrop-blur-md ${
                      isSelected
                        ? isCritical
                          ? 'border-rose-500 bg-white ring-2 ring-rose-400/50 shadow-md text-slate-900'
                          : 'border-blue-600 bg-white ring-2 ring-blue-500/50 shadow-md text-slate-900'
                        : isCritical
                          ? 'bg-white/95 border-rose-300 hover:border-rose-500 hover:bg-white shadow-xs'
                          : 'bg-white/95 border-blue-200/90 hover:border-blue-400 hover:bg-white shadow-xs'
                    }`}
                  >
                    {/* Background Progress Bar */}
                    <div 
                      style={{ width: `${progressPercent}%` }}
                      className={`absolute inset-y-0 left-0 opacity-15 pointer-events-none transition-all ${
                        isCritical ? 'bg-rose-600' : 'bg-blue-600'
                      }`}
                    />

                    <div className="relative z-10 flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Calendar className={`w-3.5 h-3.5 shrink-0 ${
                          isSelected ? (isCritical ? 'text-rose-600' : 'text-blue-600') : 'text-blue-600'
                        }`} />
                        <strong className="text-xs font-black uppercase tracking-tight text-slate-900 truncate">
                          {m.mesNome} <span className="text-slate-500 font-mono text-[10px]">/{m.ano}</span>
                        </strong>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {isCritical && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-0.5">
                            <Flame className="w-2.5 h-2.5 text-rose-600" />
                            Crítico
                          </span>
                        )}
                        <span className="text-[9px] font-mono font-bold text-slate-700 bg-white border border-blue-200 px-1.5 py-0.5 rounded shadow-2xs">
                          {sharePercent}%
                        </span>
                      </div>
                    </div>

                    <div className="relative z-10 mt-1.5 flex items-baseline justify-between">
                      <strong className={`font-mono text-xs font-black ${
                        isCritical ? 'text-rose-600' : 'text-blue-950'
                      }`}>
                        {metricMode === 'valor'
                          ? `R$ ${m.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : `${m.qtd.toLocaleString('pt-BR')} un`}
                      </strong>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {m.skusSet.size} SKUs • {m.registrosCount} reg
                      </span>
                    </div>
                  </div>
                );
              }))}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              COLUNA 3: MOTIVOS DAS PERDAS (SUBSTITUI CATEGORIA)
             ══════════════════════════════════════════════════════════════ */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-black uppercase text-amber-950 tracking-wider flex items-center gap-1.5">
                <span className="w-4.5 h-4.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white flex items-center justify-center text-[9px] font-mono shadow-xs">03</span>
                Motivos das Perdas
              </span>
              <span className="text-[10px] text-amber-900/70 font-black uppercase tracking-wider">{activeMotivos.length} Motivos</span>
            </div>

            <div className="space-y-2 max-h-[calc(100vh-290px)] min-h-[460px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-amber-300">
              {activeMotivos.length === 0 ? (
                <div className="p-6 text-center bg-white/95 border border-amber-200 rounded-2xl text-slate-500 text-xs backdrop-blur-md shadow-xs space-y-1.5">
                  <AlertTriangle className="w-6 h-6 text-amber-400 mx-auto opacity-70" />
                  <p className="font-bold text-slate-700">Nenhum motivo registrado</p>
                  <p className="text-[11px] text-slate-400">Sem quebras cadastradas no período selecionado.</p>
                </div>
              ) : (
                activeMotivos.map((mot, motIdx) => {
                const isSelected = effectiveMotivoKey === mot.motivoName;
                const IconComponent = mot.icon || AlertTriangle;
                const monthTotal = metricMode === 'valor' ? activeMonth?.valor || 1 : activeMonth?.qtd || 1;
                const val = metricMode === 'valor' ? mot.valor : mot.qtd;
                const sharePercent = monthTotal > 0 ? ((val / monthTotal) * 100).toFixed(1) : '0.0';
                const progressPercent = Math.min(100, Math.round((val / monthTotal) * 100));

                return (
                  <div
                    key={`motivo-${mot.motivoName}-${motIdx}`}
                    ref={el => { motivoCardRefs.current[mot.motivoName] = el; }}
                    onClick={() => {
                      setSelectedMotivoKey(mot.motivoName);
                      requestAnimationFrame(calculateConnectors);
                    }}
                    className={`rounded-xl border transition-all cursor-pointer group p-3 relative overflow-hidden backdrop-blur-md ${
                      isSelected
                        ? mot.glowClass
                        : 'bg-white/95 border-amber-200/90 hover:border-amber-400 hover:bg-white shadow-xs'
                    }`}
                  >
                    <div 
                      style={{ width: `${progressPercent}%` }}
                      className="absolute inset-y-0 left-0 bg-amber-500 opacity-15 pointer-events-none transition-all"
                    />

                    <div className="relative z-10 flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-5.5 h-5.5 rounded-lg ${mot.lightBg} flex items-center justify-center text-amber-800 shrink-0 border ${mot.borderColor}`}>
                          <IconComponent className="w-3 h-3" />
                        </div>
                        <strong className="text-xs font-bold text-slate-900 truncate">
                          {mot.motivoName}
                        </strong>
                      </div>
                      <span className="text-[9px] font-mono font-bold text-amber-950 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded shadow-2xs shrink-0">
                        {sharePercent}%
                      </span>
                    </div>

                    <div className="relative z-10 mt-1.5 flex items-baseline justify-between">
                      <strong className="font-mono text-xs font-black text-amber-900">
                        {metricMode === 'valor'
                          ? `R$ ${mot.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : `${mot.qtd.toLocaleString('pt-BR')} un`}
                      </strong>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {mot.packagingsMap.size} Emb • {mot.skusSet.size} SKUs
                      </span>
                    </div>
                  </div>
                );
              }))}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              COLUNA 4: EMBALAGEM / TIPO
             ══════════════════════════════════════════════════════════════ */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-black uppercase text-sky-950 tracking-wider flex items-center gap-1.5">
                <span className="w-4.5 h-4.5 rounded-full bg-gradient-to-r from-sky-600 to-blue-600 text-white flex items-center justify-center text-[9px] font-mono shadow-xs">04</span>
                Embalagem / Tipo
              </span>
              <span className="text-[10px] text-sky-900/70 font-black uppercase tracking-wider">{activePackagings.length} Tipos</span>
            </div>

            <div className="space-y-2 max-h-[calc(100vh-290px)] min-h-[460px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-sky-300">
              {activePackagings.length === 0 ? (
                <div className="p-6 text-center bg-white/95 border border-sky-200 rounded-2xl text-slate-500 text-xs backdrop-blur-md shadow-xs space-y-1.5">
                  <Box className="w-6 h-6 text-sky-400 mx-auto opacity-70" />
                  <p className="font-bold text-slate-700">Nenhuma embalagem</p>
                  <p className="text-[11px] text-slate-400">Sem dados de tipo/embalagem cadastrados.</p>
                </div>
              ) : (
                activePackagings.map((pkg, pkgIdx) => {
                const isSelected = effectivePackagingKey === pkg.packagingName;
                const motTotal = metricMode === 'valor' ? activeMotivo?.valor || 1 : activeMotivo?.qtd || 1;
                const val = metricMode === 'valor' ? pkg.valor : pkg.qtd;
                const sharePercent = motTotal > 0 ? ((val / motTotal) * 100).toFixed(1) : '0.0';
                const progressPercent = Math.min(100, Math.round((val / motTotal) * 100));

                return (
                  <div
                    key={`pkg-${pkg.packagingName}-${pkgIdx}`}
                    ref={el => { packagingCardRefs.current[pkg.packagingName] = el; }}
                    onClick={() => {
                      setSelectedPackagingKey(pkg.packagingName);
                      requestAnimationFrame(calculateConnectors);
                    }}
                    className={`rounded-xl border transition-all cursor-pointer group p-3 relative overflow-hidden backdrop-blur-md ${
                      isSelected
                        ? pkg.glowClass
                        : 'bg-white/95 border-sky-200/90 hover:border-sky-400 hover:bg-white shadow-xs'
                    }`}
                  >
                    <div 
                      style={{ width: `${progressPercent}%` }}
                      className="absolute inset-y-0 left-0 bg-sky-500 opacity-15 pointer-events-none transition-all"
                    />

                    <div className="relative z-10 flex items-center justify-between gap-1.5">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border truncate ${pkg.badge}`}>
                        {pkg.packagingName}
                      </span>
                      <span className="text-[9px] font-mono font-bold text-sky-950 bg-sky-100 border border-sky-300 px-1.5 py-0.5 rounded shadow-2xs shrink-0">
                        {sharePercent}%
                      </span>
                    </div>

                    <div className="relative z-10 mt-1.5 flex items-baseline justify-between">
                      <strong className="font-mono text-xs font-black text-sky-900">
                        {metricMode === 'valor'
                          ? `R$ ${pkg.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : `${pkg.qtd.toLocaleString('pt-BR')} un`}
                      </strong>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {pkg.productsMap.size} SKUs • {pkg.registrosCount} reg
                      </span>
                    </div>
                  </div>
                );
              }))}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              COLUNA 5: TOP 10 ITENS / PRODUTOS OFENSORES
             ══════════════════════════════════════════════════════════════ */}
          <div ref={top10ContainerRef} className="flex flex-col space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-black uppercase text-emerald-950 tracking-wider flex items-center gap-1.5">
                <span className="w-4.5 h-4.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-center text-[9px] font-mono shadow-xs">05</span>
                Top 10 Itens
              </span>
              <span className="text-[10px] text-emerald-900/70 font-black uppercase tracking-wider">{activeTop10Products.length} de 10 SKUs</span>
            </div>

            <div className="space-y-2 max-h-[calc(100vh-290px)] min-h-[460px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-emerald-300">
              {activeTop10Products.length === 0 ? (
                <div className="p-6 text-center bg-white/95 border border-blue-200 rounded-xl text-slate-500 text-xs backdrop-blur-md shadow-xs">
                  Nenhum produto encontrado neste filtro.
                </div>
              ) : (
                activeTop10Products.map((prod, pIdx) => {
                  const isExpanded = !!expandedProducts[prod.codProduto];
                  const pkgTotal = metricMode === 'valor' ? activePackaging?.valor || 1 : activePackaging?.qtd || 1;
                  const val = metricMode === 'valor' ? prod.valorTotal : prod.quantidade;
                  const sharePercent = pkgTotal > 0 ? ((val / pkgTotal) * 100).toFixed(1) : '0.0';

                  const rankNumber = pIdx + 1;
                  const rankBadgeClass = 
                    rankNumber === 1 ? 'bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 font-black shadow-xs ring-1 ring-amber-400' :
                    rankNumber === 2 ? 'bg-gradient-to-tr from-slate-300 to-slate-200 text-slate-900 font-black' :
                    rankNumber === 3 ? 'bg-gradient-to-tr from-amber-600 to-amber-500 text-white font-black' :
                    'bg-slate-100 text-slate-700 font-bold';

                  return (
                    <div
                      key={`prod-card-${prod.codProduto}-${pIdx}`}
                      className="bg-white/95 border border-emerald-300 hover:border-emerald-500 rounded-xl p-3 transition-all shadow-xs hover:shadow-md space-y-2 backdrop-blur-md"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 min-w-0">
                          {/* Rank Badge #1 .. #10 */}
                          <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] shrink-0 ${rankBadgeClass}`}>
                            #{rankNumber}
                          </span>
                          <div className="space-y-0.5 min-w-0">
                            <span className="font-mono text-[9px] font-bold text-emerald-900 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-300 inline-block">
                              SKU #{prod.codProduto}
                            </span>
                            <h4 className="text-xs font-bold text-slate-900 leading-snug pt-0.5 line-clamp-2" title={prod.descricao}>
                              {prod.descricao}
                            </h4>
                          </div>
                        </div>
                        <span className="text-[9px] font-mono font-bold text-emerald-950 bg-emerald-100 px-1.5 py-0.5 rounded shrink-0 shadow-2xs border border-emerald-300">
                          {sharePercent}%
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between pt-0.5">
                        <strong className="font-mono text-xs font-black text-emerald-800">
                          {metricMode === 'valor'
                            ? `R$ ${prod.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : `${prod.quantidade.toLocaleString('pt-BR')} un`}
                        </strong>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Méd: R$ {prod.valorUnitario.toFixed(2)}
                        </span>
                      </div>

                      {/* ACCORDION BUTTON FOR INDIVIDUAL RECORDS */}
                      <button
                        onClick={() => toggleProductExpansion(prod.codProduto)}
                        className="w-full py-1 px-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-950 text-[10px] font-bold flex items-center justify-between transition-all cursor-pointer border border-blue-200"
                      >
                        <span>{prod.rows.length} lançamentos individuais</span>
                        <ChevronDown className={`w-3 h-3 transition-transform text-blue-500 ${isExpanded ? 'rotate-180 text-emerald-600' : ''}`} />
                      </button>

                      {isExpanded && (
                        <div className="pt-2 border-t border-blue-100 space-y-1.5 max-h-36 overflow-y-auto pr-0.5 text-[9px] font-mono scrollbar-thin scrollbar-thumb-emerald-300">
                          {prod.rows.map((row, idx) => (
                            <div key={`row-${row._docId || prod.codProduto}-${idx}`} className="p-1.5 bg-blue-50/80 rounded-lg border border-blue-200 space-y-0.5">
                              <div className="flex items-center justify-between text-slate-700">
                                <span>{row.data || row.dataISO}</span>
                                <span className="font-bold text-rose-600">{row.motivo || 'AVARIA'}</span>
                              </div>
                              <div className="flex items-center justify-between text-slate-800">
                                <span>Resp: {row.colaboradorQuebrou || row.responsavel || 'Operação'}</span>
                                <strong className="text-emerald-700 font-black">{row.quantidade} un • R$ {(row.valorTotal || (row.quantidade * prod.valorUnitario)).toFixed(2)}</strong>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ── BOTTOM SUMMARY BAR (HARMONIZADO) ── */}
      <div className="bg-white/90 backdrop-blur-md border-t border-blue-200 px-4 sm:px-6 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-blue-950/80 shrink-0 font-mono z-10">
        <div className="flex items-center gap-3 flex-wrap">
          <span>Total Base: <strong className="text-blue-950 font-bold">{hierarchyData.totalRegistros} lançamentos</strong></span>
          <span>•</span>
          <span>Perda Total: <strong className="text-blue-950 font-black">R$ {hierarchyData.totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></span>
          <span>•</span>
          <span>Volume: <strong className="text-blue-950 font-black">{hierarchyData.totalQtd.toLocaleString('pt-BR')} unidades</strong></span>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-blue-900/80 font-sans font-medium">
            Clique em qualquer card para ramificar os níveis seguintes instantaneamente.
          </span>
        </div>
      </div>
    </div>
  );
}
