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
  LineChart,
  Line,
  PieChart,
  Pie,
  LabelList,
  AreaChart,
  Area
} from 'recharts';
import { 
  Calendar, 
  ChevronDown, 
  Droplet, 
  ArrowDown, 
  Clock, 
  User, 
  ArrowLeft, 
  Search, 
  Filter, 
  Package, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  Info, 
  TrendingUp, 
  Zap, 
  Target, 
  Trash2,
  Box,
  AlertTriangle,
  SlidersHorizontal,
  CheckCircle2,
  BarChart2,
  FileSpreadsheet,
  Layers,
  Sparkles,
  HelpCircle,
  Play,
  Pause,
  RotateCcw,
  Plus,
  RefreshCw,
  Award,
  Activity,
  PieChart as PieIcon,
  Tag,
  Download,
  FileText,
  ClipboardCheck,
  ShieldCheck,
  X
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { Usuario, Empresa, DespejoRow, QuebraRow } from '../types';
import { DespejoRepository } from '../db';
import { useEmpresaData } from '../context/EmpresaDataContext';
import { useSystemTargets } from '../utils/useSystemTargets';
import { getJsonTable } from '../utils/hybridJsonDatabase';
import { getRetroactiveRecords } from '../utils/dadosRetroativosUtils';
import CalendarFilter from './CalendarFilter';
import { SimuladorAgilidadeMeta } from './SimuladorAgilidadeMeta';
import { RepackMetasParametrosCard } from './RepackMetasParametrosCard';
import { LicencasDescarteSection } from './LicencasDescarteSection';
import { LicencasDescarteModal } from './LicencasDescarteModal';
import { PadraoOperacionalModal } from './PadraoOperacionalModal';
import { IndicatorActionModal } from './IndicatorActionModal';
import { QuadroAcoesDpo } from './QuadroAcoesDpo';
import { buildOfficialDespejoRows } from '../utils/retroactiveDespejoParser';
import { buildOfficialQuebrasRows } from '../utils/retroactiveQuebrasParser';
import { getItemHlInfo, getEmbalagemName } from './WqiTab';
import A3BoardComponent from './A3BoardComponent';

interface DespejoDashboardProps {
  user: Usuario;
  empresa: Empresa | null;
  onBack?: () => void;
  theme?: 'light' | 'dark';
}

function DespejoHeaderClock() {
  const [currentTime, setCurrentTime] = useState('');
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('pt-BR') + ' - ' + now.toLocaleDateString('pt-BR'));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-gray-200 dark:border-slate-700 shadow-xs font-semibold">
      <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
      <span className="text-[10px] font-mono text-slate-700 dark:text-slate-300">{currentTime || 'Sincronizando...'}</span>
    </div>
  );
}

const extractDateISO = (val: any): string => {
  if (!val) return '';
  const str = String(val).trim();
  // Match YYYY-MM-DD (e.g. "2026-01-19", "2026-01-19 11:59:15", "2026-01-19T...")
  const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`;
  }
  // Match DD/MM/YYYY (e.g. "19/01/2026", "19/01/2026 11:59:15")
  const brMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (brMatch) {
    return `${brMatch[3]}-${brMatch[2].padStart(2, '0')}-${brMatch[1].padStart(2, '0')}`;
  }
  return '';
};

const DEFAULT_EMBALAGENS_CONFIG: Record<string, { metaSec: number; label: string }> = {
  'LATA 350ML': { metaSec: 50, label: 'Lata 350ml (Meta: 00:50)' },
  'PET 2L': { metaSec: 50, label: 'Pet 2L (Meta: 00:50)' },
  'PET 1L': { metaSec: 50, label: 'Pet 1L (Meta: 00:50)' },
  '300 OW': { metaSec: 50, label: '300 OW (Meta: 00:50)' },
  '600 OW': { metaSec: 50, label: '600 OW (Meta: 00:50)' },
  'LATA 473ML': { metaSec: 50, label: 'Lata 473ml (Meta: 00:50)' },
  'PET 200ML': { metaSec: 50, label: 'Pet 200ml (Meta: 00:50)' },
  'LATA 269ML': { metaSec: 50, label: 'Lata 269ml (Meta: 00:50)' },
  'LONG NECK': { metaSec: 50, label: 'Long Neck (Meta: 00:50)' }
};

const DEFAULT_OPERADORES = [
  'OZENILDO SOUSA SILVA',
  'GLADSON LISBOA DOS SANTOS'
];

const EMBALAGENS_VOLUME_MAP: Record<string, number> = {
  'LATA 350ML': 0.0035,
  'LATA 350': 0.0035,
  'LATA 355ML': 0.00355,
  'PET 2L': 0.0200,
  'PET 1L': 0.0100,
  '300 OW': 0.0030,
  '600 OW': 0.0060,
  'LATA 473ML': 0.00473,
  'LATA 473': 0.00473,
  'PET 200ML': 0.0020,
  'PET 200ml': 0.0020,
  'LATA 269ML': 0.00269,
  'LATA 269': 0.00269,
  'LONG NECK': 0.00355
};

const generateSeedDespejoRows = (empresaId: string): DespejoRow[] => {
  const list: DespejoRow[] = [];
  const packages = [
    { emb: 'LATA 350ML', cod: 1042, desc: 'LATA 350ML', factor: 0.0035 },
    { emb: 'PET 2L', cod: 503, desc: 'PET 2L', factor: 0.0200 },
    { emb: 'PET 1L', cod: 2319, desc: 'PET 1L', factor: 0.0100 },
    { emb: '600 OW', cod: 1015, desc: '600 OW', factor: 0.0060 },
    { emb: '300 OW', cod: 1012, desc: '300 OW', factor: 0.0030 },
    { emb: 'LATA 473ML', cod: 1058, desc: 'LATA 473ML', factor: 0.00473 },
    { emb: 'PET 200ML', cod: 520, desc: 'PET 200ML', factor: 0.0020 }
  ];

  for (let i = 14; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateISO = d.toISOString().split('T')[0];
    const dataBr = d.toLocaleDateString('pt-BR');
    const mes = d.toLocaleString('pt-BR', { month: 'long' }).toUpperCase();
    const monthNum = d.getMonth() + 1;

    // From June onwards, strictly Ozenildo and Gladson
    const op = monthNum >= 6 
      ? (i % 2 === 0 ? 'OZENILDO SOUSA SILVA' : 'GLADSON LISBOA DOS SANTOS')
      : DEFAULT_OPERADORES[i % DEFAULT_OPERADORES.length];

    const count = i === 0 ? 2 : Math.floor(Math.random() * 2) + 2;
    for (let j = 0; j < count; j++) {
      const prod = packages[(i * 2 + j) % packages.length];
      const qty = Math.floor(Math.random() * 6) + 2; // 2 to 7 units (realistic single despejo)
      const config = DEFAULT_EMBALAGENS_CONFIG[prod.emb] || { metaSec: 50, label: prod.emb };
      const expectedSec = config.metaSec * qty;
      const actualSec = Math.max(20, Math.round(expectedSec * (0.45 + (j % 3) * 0.1)));
      const isWithin = actualSec <= expectedSec;

      const hl = Math.round((prod.factor * qty) * 10000) / 10000;
      const startH = 14 + j * 2;
      const startM = (j * 17) % 60;
      const startStr = `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}:00`;
      const endSecTotal = startH * 3600 + startM * 60 + actualSec;
      const endH = Math.floor(endSecTotal / 3600);
      const endM = Math.floor((endSecTotal % 3600) / 60);
      const endS = endSecTotal % 60;
      const endStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:${String(endS).padStart(2, '0')}`;

      const secToStr = (tot: number) => {
        const h = Math.floor(tot / 3600);
        const m = Math.floor((tot % 3600) / 60);
        const s = tot % 60;
        return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
      };

      list.push({
        id: `seed-despejo-${i}-${j}-${Date.now()}`,
        empresaId,
        data: dataBr,
        dataISO: dateISO,
        mes,
        codProduto: prod.cod,
        codigoProduto: String(prod.cod),
        descricao: prod.desc,
        operador: op,
        embalagem: prod.emb,
        quantidade: qty,
        hlPerdido: hl,
        hectolitroPerdido: hl,
        meta: config.label,
        inicio: startStr,
        fim: endStr,
        duracao: secToStr(actualSec),
        tempo: secToStr(actualSec),
        resultado: isWithin ? '🟢 META BATIDA' : '🔴 ACIMA DA META',
        motivo: !isWithin ? (j % 2 === 0 ? 'Canaleta de descarte com fluxo reduzido' : 'Garra manual com ajuste de pressão') : undefined,
        _criadoEm: d.toISOString()
      });
    }
  }
  return list;
};

export default function DespejoDashboard({ user, empresa, onBack, theme = 'light' }: DespejoDashboardProps) {
  const { targets, updateTarget } = useSystemTargets(empresa?.id);
  const metaProdutividadeCxH = targets.despejo_produtividade ?? 30;

  const [activeSubTab, setActiveSubTab] = useState<'produtividade' | 'shelf' | 'boarda3' | 'acoes' | 'licencas'>('produtividade');
  const [isLicencasModalOpen, setIsLicencasModalOpen] = useState(false);
  const [despejoRows, setDespejoRows] = useState<DespejoRow[]>([]);
  const [actualQuebras, setActualQuebras] = useState<QuebraRow[]>([]);
  const [loading, setLoading] = useState(false);
  const empresaData = useEmpresaData();

  // Shelf Life (Produtos Vencidos na Operação) state
  const [shelfSearch, setShelfSearch] = useState('');
  const [shelfFilterCausa, setShelfFilterCausa] = useState('todos');
  const [shelfFilterEmbalagem, setShelfFilterEmbalagem] = useState('todos');
  const [shelfPage, setShelfPage] = useState(1);
  const shelfItemsPerPage = 10;

  // Packaging Configs from localStorage with fallback
  const [embalagensConfig, setEmbalagensConfig] = useState<Record<string, { metaSec: number; label: string }>>(() => {
    const saved = localStorage.getItem(`despejo_embalagens_config_${empresa?.id || 'demo'}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // If saved config is outdated or has old targets > 120s, merge with 50s defaults
        const hasOutdated = Object.values(parsed).some((v: any) => v?.metaSec > 120);
        if (!hasOutdated) return parsed;
      } catch (e) { console.error(e); }
    }
    return DEFAULT_EMBALAGENS_CONFIG;
  });

  const handleUpdateEmbalagemMeta = (key: string, newSec: number) => {
    setEmbalagensConfig(prev => {
      const current = prev[key] || { label: key, metaSec: 50 };
      const m = Math.floor(newSec / 60);
      const s = newSec % 60;
      const timeStr = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
      const baseLabel = current.label.split('(')[0].trim();
      const updated = {
        ...prev,
        [key]: {
          metaSec: newSec,
          label: `${baseLabel} (Meta: ${timeStr})`
        }
      };
      localStorage.setItem(`despejo_embalagens_config_${empresa?.id || 'demo'}`, JSON.stringify(updated));
      return updated;
    });
  };

  const handleResetEmbalagens = () => {
    setEmbalagensConfig(DEFAULT_EMBALAGENS_CONFIG);
    localStorage.setItem(`despejo_embalagens_config_${empresa?.id || 'demo'}`, JSON.stringify(DEFAULT_EMBALAGENS_CONFIG));
  };

  // Recalculation states & logic
  const [isRecalculatingGlobal, setIsRecalculatingGlobal] = useState(false);
  const [globalRecalcBanner, setGlobalRecalcBanner] = useState(false);
  const [recalcSummary, setRecalcSummary] = useState<{ total: number; dentro: number; fora: number; conformidadePct: number } | null>(null);

  const handleRecalcularAtingimento = () => {
    setIsRecalculatingGlobal(true);
    setGlobalRecalcBanner(false);

    setTimeout(() => {
      let dentroCount = 0;
      let foraCount = 0;

      setDespejoRows(prev => {
        const updated = prev.map(r => {
          const config = embalagensConfig[r.embalagem] || { metaSec: 50 };
          const expectedSec = config.metaSec * (Number(r.quantidade) || 1);
          const actualSec = toSec(r.duracao || r.tempo || 0);
          const isWithin = actualSec > 0 && actualSec <= expectedSec;
          if (isWithin) dentroCount++;
          else foraCount++;
          return {
            ...r,
            resultado: isWithin ? '🟢 META BATIDA' : '🔴 ACIMA DA META'
          };
        });
        const total = updated.length;
        const conformidadePct = total > 0 ? Math.round((dentroCount / total) * 100) : 0;
        setRecalcSummary({ total, dentro: dentroCount, fora: foraCount, conformidadePct });
        return updated;
      });

      // Update in localStorage if enterprise data exists
      try {
        const saved = localStorage.getItem(`empresa_data_${empresa?.id || 'demo'}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.despejo) {
            parsed.despejo = (parsed.despejo || []).map((r: any) => {
              const config = embalagensConfig[r.embalagem] || { metaSec: 50 };
              const expectedSec = config.metaSec * (Number(r.quantidade) || 1);
              const actualSec = toSec(r.duracao || r.tempo || 0);
              const isWithin = actualSec > 0 && actualSec <= expectedSec;
              return {
                ...r,
                resultado: isWithin ? '🟢 META BATIDA' : '🔴 ACIMA DA META'
              };
            });
            localStorage.setItem(`empresa_data_${empresa?.id || 'demo'}`, JSON.stringify(parsed));
          }
        }
      } catch (e) {}

      setIsRecalculatingGlobal(false);
      setGlobalRecalcBanner(true);
      setTimeout(() => setGlobalRecalcBanner(false), 5000);
    }, 450);
  };

  // Listen to global recalculate events
  useEffect(() => {
    const handleGlobalRecalc = (e: any) => {
      if (!e.detail || e.detail.processo === 'despejo' || e.detail.processo === 'all') {
        handleRecalcularAtingimento();
      }
    };
    window.addEventListener('dpo_recalcular_atingimento', handleGlobalRecalc);
    return () => window.removeEventListener('dpo_recalcular_atingimento', handleGlobalRecalc);
  }, [embalagensConfig]);

  // Modals
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [isPopModalOpen, setIsPopModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isSolicitarDespejoModalOpen, setIsSolicitarDespejoModalOpen] = useState(false);

  // Filter UI states
  const [filterColaborador, setFilterColaborador] = useState('todos');
  const [filterEmbalagem, setFilterEmbalagem] = useState('todos');
  const [filterMes, setFilterMes] = useState('todos');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterMeta, setFilterMeta] = useState<'todos' | 'dentro' | 'fora'>('todos');

  // Applied Filter states
  const [activeColaborador, setActiveColaborador] = useState('todos');
  const [activeEmbalagem, setActiveEmbalagem] = useState('todos');
  const [activeMes, setActiveMes] = useState('todos');
  const [activeStartDate, setActiveStartDate] = useState('');
  const [activeEndDate, setActiveEndDate] = useState('');
  const [activeMeta, setActiveMeta] = useState<'todos' | 'dentro' | 'fora'>('todos');

  // Auto-sync active filter states when user changes filter controls (instant reactive filtering)
  useEffect(() => {
    setActiveColaborador(filterColaborador);
    setActiveEmbalagem(filterEmbalagem);
    setActiveMes(filterMes);
    setActiveStartDate(filterStartDate);
    setActiveEndDate(filterEndDate);
    setActiveMeta(filterMeta);
    setCurrentPage(1);
  }, [filterColaborador, filterEmbalagem, filterMes, filterStartDate, filterEndDate, filterMeta]);

  // Pagination & Search
  const [tableSearch, setTableSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const itemsPerPage = 10;

  // New Record Form State
  const [newOperador, setNewOperador] = useState(user?.nome || DEFAULT_OPERADORES[0]);
  const [newEmbalagem, setNewEmbalagem] = useState('LATA 350');
  const [newQuantidade, setNewQuantidade] = useState<number>(1);
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
  const [newMotivoFalha, setNewMotivoFalha] = useState('');

  // Stopwatch Timer
  useEffect(() => {
    let interval: any = null;
    if (isStopwatchRunning) {
      interval = setInterval(() => {
        setStopwatchSeconds(sec => sec + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isStopwatchRunning]);

  // Comprehensive Data Loader (Strictly loads official Jan-Aug dataset + live manual registrations)
  const reloadData = React.useCallback(async () => {
    const companyId = empresa?.id || 'demo';
    setLoading(true);
    try {
      // 1. Base oficial definitiva vinculada no código (SAMPLE_DESPEJO_JSON cobrindo Jan a 28 de Agosto)
      const officialRows = buildOfficialDespejoRows(companyId);

      // 2. Coleta novos registros manuais criados pelo ajudante / operador nesta empresa e demo
      const customManualRows: DespejoRow[] = [];
      const seenCustomIds = new Set<string>();

      const addCustomDespejo = (r: any) => {
        if (!r) return;
        const idKey = String(r._docId || r.id || '');
        if (idKey && (seenCustomIds.has(idKey) || idKey.startsWith('retro_despejo_') || idKey.startsWith('seed-despejo-'))) return;
        if (idKey) seenCustomIds.add(idKey);
        customManualRows.push(r);
      };

      const keysToCheck = [
        `despejo_manual_entries_${companyId}`,
        `despejo_manual_entries_demo`,
        `despejo_rows_${companyId}`,
        `despejo_rows_demo`
      ];

      keysToCheck.forEach(k => {
        const saved = localStorage.getItem(k);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) parsed.forEach(addCustomDespejo);
          } catch (e) {}
        }
      });

      // Also scan all localStorage for any custom despejo entries
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (k.startsWith('despejo_manual_entries_') || k.startsWith('despejo_rows_')) && !keysToCheck.includes(k)) {
            const val = localStorage.getItem(k);
            if (val) {
              const parsed = JSON.parse(val);
              if (Array.isArray(parsed)) parsed.forEach(addCustomDespejo);
            }
          }
        }
      } catch (e) {}

      // Coleta tarefas de despejo concluídas pelo ajudante via PNC
      try {
        const pncKeys = [`pnc_despejo_tasks_${companyId}`, 'pnc_despejo_tasks_demo'];
        pncKeys.forEach(pk => {
          const rawTasks = localStorage.getItem(pk);
          if (rawTasks) {
            const tasks = JSON.parse(rawTasks);
            if (Array.isArray(tasks)) {
              tasks.filter((t: any) => t.status === 'Concluído').forEach((t: any) => {
                const now = t.dataConclusao ? new Date(t.dataConclusao) : new Date();
                addCustomDespejo({
                  id: `desp-task-${t.id}`,
                  _docId: `desp-task-${t.id}`,
                  data: now.toLocaleDateString('pt-BR'),
                  dataISO: now.toISOString().split('T')[0],
                  operador: t.executadoPor || 'AJUDANTE OPERAÇÃO',
                  embalagem: t.embalagem || 'LATA 350',
                  produto: `${t.codigo} - ${t.descricao}`,
                  descricao: t.descricao,
                  codProduto: t.codigo,
                  lote: t.lote || '-',
                  quantidade: t.quantidade || 1,
                  duracao: t.tempoGasto || '00:04:00',
                  inicio: '08:00',
                  fim: '08:04',
                  motivo: t.motivo || 'Tratativa PNC / Shelf Life',
                  resultado: '🟢 Dentro da Meta',
                  origem: 'AJUDANTE_DESPEJO'
                });
              });
            }
          }
        });
      } catch (e) {}

      // Base total definitiva = Novos manuais + registros oficiais sem duplicatas
      const seenIds = new Set<string>();
      const combined: DespejoRow[] = [];

      customManualRows.forEach(r => {
        const idKey = String(r._docId || r.id || '');
        if (idKey && !seenIds.has(idKey)) {
          seenIds.add(idKey);
          combined.push(r);
        }
      });

      officialRows.forEach(r => {
        const idKey = String(r._docId || r.id || '');
        if (!seenIds.has(idKey)) {
          seenIds.add(idKey);
          combined.push(r);
        }
      });

      combined.sort((a, b) => (b.dataISO || '').localeCompare(a.dataISO || '') || (b.inicio || '').localeCompare(a.inicio || ''));
      setDespejoRows(combined);
      try {
        localStorage.setItem(`despejo_rows_${companyId}`, JSON.stringify(combined));
      } catch (e) {}
    } catch (err) {
      console.error('Erro ao carregar dados de despejo:', err);
    } finally {
      setLoading(false);
    }
  }, [empresa?.id]);

  useEffect(() => {
    reloadData();
  }, [reloadData, empresa?.id]);

  // Live Listeners for DB and Import Events
  useEffect(() => {
    const handleDbUpdated = () => {
      reloadData();
    };

    window.addEventListener('despejo-db-updated', handleDbUpdated);
    window.addEventListener('despejo-updated', handleDbUpdated);
    window.addEventListener('retroactive-data-updated', handleDbUpdated);
    window.addEventListener('empresa-data-reload', handleDbUpdated);
    window.addEventListener('storage', handleDbUpdated);

    return () => {
      window.removeEventListener('despejo-db-updated', handleDbUpdated);
      window.removeEventListener('despejo-updated', handleDbUpdated);
      window.removeEventListener('retroactive-data-updated', handleDbUpdated);
      window.removeEventListener('empresa-data-reload', handleDbUpdated);
      window.removeEventListener('storage', handleDbUpdated);
    };
  }, [reloadData]);

  // Sync Quebras em tempo real para Varredura de Shelf Life (Produtos Vencidos)
  useEffect(() => {
    const companyId = empresa?.id || 'demo';
    const refreshQuebras = () => {
      let rows = [...(empresaData.quebras || [])];
      if (rows.length === 0) {
        const saved = localStorage.getItem(`quebras_${companyId}`);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              rows = parsed;
            }
          } catch (_) {}
        }
      }
      if (rows.length === 0) {
        rows = buildOfficialQuebrasRows(companyId);
      }
      setActualQuebras(rows);
    };

    refreshQuebras();

    const handleUpdated = () => {
      refreshQuebras();
    };

    window.addEventListener('quebras-db-updated', handleUpdated);
    window.addEventListener('quebras-updated', handleUpdated);
    window.addEventListener('retroactive-data-updated', handleUpdated);
    window.addEventListener('empresa-data-reload', handleUpdated);
    window.addEventListener('storage', handleUpdated);

    return () => {
      window.removeEventListener('quebras-db-updated', handleUpdated);
      window.removeEventListener('quebras-updated', handleUpdated);
      window.removeEventListener('retroactive-data-updated', handleUpdated);
      window.removeEventListener('empresa-data-reload', handleUpdated);
      window.removeEventListener('storage', handleUpdated);
    };
  }, [empresaData.quebras, empresa?.id]);

  // Helpers
  const pad2 = (num: number) => String(num).padStart(2, '0');

  const getRowDurationSec = (r?: Partial<DespejoRow> | null): number => {
    if (!r) return 0;

    // 1. Prioridade: Se 'tempo' for string formatada com ':' (ex: "00:03:15" ou "03:15")
    if (r.tempo && typeof r.tempo === 'string' && r.tempo.includes(':')) {
      const parts = r.tempo.trim().split(':').map(p => parseFloat(p) || 0);
      if (parts.length === 3) return Math.round(parts[0] * 3600 + parts[1] * 60 + parts[2]);
      if (parts.length === 2) return Math.round(parts[0] * 60 + parts[1]);
    }

    // 2. Se 'duracao' for string formatada com ':' (ex: "00:03:15" ou "03:15")
    if (r.duracao && typeof r.duracao === 'string' && r.duracao.includes(':')) {
      const parts = r.duracao.trim().split(':').map(p => parseFloat(p) || 0);
      if (parts.length === 3) return Math.round(parts[0] * 3600 + parts[1] * 60 + parts[2]);
      if (parts.length === 2) return Math.round(parts[0] * 60 + parts[1]);
    }

    // 3. Se 'inicio' e 'fim' estiverem preenchidos com horários válidos
    if (r.inicio && r.fim && typeof r.inicio === 'string' && typeof r.fim === 'string' && r.inicio.includes(':') && r.fim.includes(':')) {
      const parseClock = (t: string) => {
        const parts = t.trim().split(':').map(p => parseFloat(p) || 0);
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
        if (parts.length === 2) return parts[0] * 3600 + parts[1] * 60;
        return 0;
      };
      const s = parseClock(r.inicio);
      const e = parseClock(r.fim);
      let diff = e - s;
      if (diff < 0) diff += 86400;
      if (diff > 0 && diff < 86400) return Math.round(diff);
    }

    // 4. Se 'duracao' for número
    if (typeof r.duracao === 'number' && !isNaN(r.duracao) && r.duracao > 0) {
      if (r.duracao < 1) return Math.round(r.duracao * 86400); // Fração serial do dia (Excel)
      if (r.duracao <= 300) return Math.round(r.duracao * 60); // Minutos -> Segundos (ex: 3.25m = 195s)
      return Math.round(r.duracao); // Segundos diretos
    }

    // 5. Se 'tempo' for número
    if (typeof r.tempo === 'number' && !isNaN(r.tempo) && r.tempo > 0) {
      if (r.tempo < 1) return Math.round(r.tempo * 86400);
      if (r.tempo <= 300) return Math.round(r.tempo * 60);
      return Math.round(r.tempo);
    }

    return 0;
  };

  const toSec = (hms: string | number | undefined | null): number => {
    if (hms === undefined || hms === null || hms === '') return 0;
    if (typeof hms === 'number') {
      if (isNaN(hms) || hms <= 0) return 0;
      if (hms < 1) return Math.round(hms * 86400);
      if (hms <= 300) return Math.round(hms * 60);
      return Math.round(hms);
    }
    const str = String(hms).trim();
    if (str.includes(':')) {
      const parts = str.split(':').map(p => parseFloat(p) || 0);
      if (parts.length === 3) return Math.round(parts[0] * 3600 + parts[1] * 60 + parts[2]);
      if (parts.length === 2) return Math.round(parts[0] * 60 + parts[1]);
    }
    const num = parseFloat(str.replace(',', '.'));
    if (!isNaN(num) && num > 0) {
      if (num < 1) return Math.round(num * 86400);
      if (num <= 300) return Math.round(num * 60);
      return Math.round(num);
    }
    return 0;
  };

  const toHMS = (sec: number) => {
    sec = Math.max(0, Math.floor(sec));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return [h, m, s].map(pad2).join(':');
  };

  // Distinct Lists for Selects - Strictly the 2 authorized operators
  const distinctOperadores = useMemo(() => {
    return ['OZENILDO SOUSA SILVA', 'GLADSON LISBOA DOS SANTOS'];
  }, []);

  const distinctMeses = useMemo(() => {
    const monthOrder: Record<string, number> = {
      'JANEIRO': 1, 'FEVEREIRO': 2, 'MARÇO': 3, 'ABRIL': 4,
      'MAIO': 5, 'JUNHO': 6, 'JULHO': 7, 'AGOSTO': 8,
      'SETEMBRO': 9, 'OUTUBRO': 10, 'NOVEMBRO': 11, 'DEZEMBRO': 12
    };
    const meses = new Set<string>();
    despejoRows.forEach(r => {
      if (r.mes && typeof r.mes === 'string') {
        meses.add(r.mes.trim().toUpperCase());
      }
    });
    return Array.from(meses).sort((a, b) => {
      const orderA = monthOrder[a] || 99;
      const orderB = monthOrder[b] || 99;
      return orderA - orderB;
    });
  }, [despejoRows]);

  const embalagensList = useMemo(() => {
    return Object.keys(embalagensConfig);
  }, [embalagensConfig]);

  // Apply & Clear Filters
  const handleApplyFilters = () => {
    setActiveColaborador(filterColaborador);
    setActiveEmbalagem(filterEmbalagem);
    setActiveMes(filterMes);
    setActiveStartDate(filterStartDate);
    setActiveEndDate(filterEndDate);
    setActiveMeta(filterMeta);
    setCurrentPage(1);
    setSelectedRowId(null);
  };

  const handleClearFilters = () => {
    setFilterColaborador('todos');
    setFilterEmbalagem('todos');
    setFilterMes('todos');
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterMeta('todos');

    setActiveColaborador('todos');
    setActiveEmbalagem('todos');
    setActiveMes('todos');
    setActiveStartDate('');
    setActiveEndDate('');
    setActiveMeta('todos');
    setCurrentPage(1);
    setSelectedRowId(null);
  };

  // Filtered rows
  const filteredRows = useMemo(() => {
    return despejoRows.filter(row => {
      // 1. Colaborador
      if (activeColaborador !== 'todos') {
        const rowOpClean = (row.operador || '').toUpperCase();
        const filterOpClean = activeColaborador.toUpperCase();
        if (!rowOpClean.includes(filterOpClean)) return false;
      }

      // 2. Embalagem
      if (activeEmbalagem !== 'todos' && row.embalagem !== activeEmbalagem) return false;

      // 3. Mês
      if (activeMes !== 'todos') {
        const rowMes = (row.mes || '').trim().toUpperCase();
        const filterMesClean = activeMes.trim().toUpperCase();
        if (rowMes !== filterMesClean) return false;
      }

      // 4. Date range
      const startISO = extractDateISO(activeStartDate);
      const endISO = extractDateISO(activeEndDate) || (activeStartDate ? startISO : '');
      
      if (startISO || endISO) {
        const rowDate = extractDateISO(row.dataISO) || extractDateISO(row.data) || extractDateISO((row as any)['Data']) || extractDateISO((row as any)['Data Lançamento']) || '';
        if (!rowDate) return false;
        if (startISO && rowDate < startISO) return false;
        if (endISO && rowDate > endISO) return false;
      }

      // 5. Meta status
      if (activeMeta !== 'todos') {
        const config = embalagensConfig[row.embalagem] || { metaSec: 50 };
        const totalExpectedSec = config.metaSec * (Number(row.quantidade) || 1);
        const actualSec = getRowDurationSec(row);
        const isWithin = actualSec <= totalExpectedSec;

        if (activeMeta === 'dentro' && !isWithin) return false;
        if (activeMeta === 'fora' && isWithin) return false;
      }

      return true;
    });
  }, [despejoRows, activeColaborador, activeEmbalagem, activeMes, activeStartDate, activeEndDate, activeMeta, embalagensConfig]);

  // Working days info for simulation
  const workingDaysInfo = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    const lastDay = new Date(year, month + 1, 0);
    const totalDaysInMonth = lastDay.getDate();
    
    let totalWorkingDays = 0;
    let elapsedWorkingDays = 0;
    
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const date = new Date(year, month, d);
      const dayOfWeek = date.getDay();
      const isWorkingDay = dayOfWeek !== 0 && dayOfWeek !== 6;
      
      if (isWorkingDay) {
        totalWorkingDays++;
        if (d <= now.getDate()) {
          elapsedWorkingDays++;
        }
      }
    }
    
    elapsedWorkingDays = Math.max(1, elapsedWorkingDays);
    const remainingWorkingDays = Math.max(0, totalWorkingDays - elapsedWorkingDays);
    
    return {
      totalWorkingDays,
      elapsedWorkingDays,
      remainingWorkingDays,
      monthName: now.toLocaleString('pt-BR', { month: 'long' }),
      year
    };
  }, []);

  // Volume in Hectoliters (HL)
  const EMBALAGENS_VOLUME: Record<string, number> = useMemo(() => ({
    'LATA 250': 0.0025,
    'LATA 269': 0.00269,
    'LATA 350': 0.0035,
    'LATA 350ML': 0.0035,
    'LATA 355ML': 0.00355,
    'LATA 473': 0.00473,
    'LATA 473ML': 0.00473,
    'LONG NECK': 0.00355,
    'LONG NECK 355ML': 0.00355,
    'PET 1L': 0.0100,
    'PET 2L': 0.0200,
    'PET 500ml': 0.0050,
    'PET 500ML': 0.0050,
    'PET 200ml': 0.0020,
    'PET 200ML': 0.0020,
    'PET 2,5L': 0.0250,
    'PET 3,3L': 0.0330,
    '600 OW': 0.0060,
    '300 OW': 0.0030,
    'GARRAFA 600ml': 0.0060,
    'GARRAFA 600ML': 0.0060,
    'GARRAFA 1L': 0.0100,
    'INTEIRA': 0.0060,
    'LITRÃO': 0.0100,
    'NÃO IDENTIFICADA': 0.0035
  }), []);

  // Core KPI Calculations
  const totalSkus = useMemo(() => {
    return filteredRows.reduce((sum, r) => sum + (Number(r.quantidade) || 0), 0);
  }, [filteredRows]);

  const totalTempoGastoSec = useMemo(() => {
    return filteredRows.reduce((sum, r) => sum + getRowDurationSec(r), 0);
  }, [filteredRows]);

  // Agrupamento diário cronológico para Tempo Médio Diário e Produtividade
  const dailyStats = useMemo(() => {
    const dayMap = new Map<string, { dataISO: string; dia: string; totalUn: number; totalSec: number; totalOps: number; hl: number }>();
    filteredRows.forEach(r => {
      const iso = extractDateISO(r.dataISO) || extractDateISO(r.data) || extractDateISO((r as any)['Data']) || '2026-08-01';
      const diaStr = r.data || (iso ? iso.split('-').reverse().join('/') : 'Hoje');
      const prev = dayMap.get(iso) || { dataISO: iso, dia: diaStr, totalUn: 0, totalSec: 0, totalOps: 0, hl: 0 };
      const un = Number(r.quantidade) || 0;
      const sec = getRowDurationSec(r);
      const factor = EMBALAGENS_VOLUME[r.embalagem] || 0.0035;
      const hl = r.hlPerdido || r.hectolitroPerdido || (factor * un);
      dayMap.set(iso, {
        dataISO: iso,
        dia: diaStr,
        totalUn: prev.totalUn + un,
        totalSec: prev.totalSec + sec,
        totalOps: prev.totalOps + 1,
        hl: prev.hl + Number(hl)
      });
    });
    return Array.from(dayMap.values()).sort((a, b) => (a.dataISO < b.dataISO ? -1 : 1));
  }, [filteredRows, EMBALAGENS_VOLUME]);

  // Tempo Médio Diário: Média dos tempos totais gastos por dia trabalhado (soma dos tempos / dias trabalhados)
  const tempoMedioDiarioSec = useMemo(() => {
    if (dailyStats.length === 0) return 0;
    const totalSec = dailyStats.reduce((sum, d) => sum + d.totalSec, 0);
    return Math.round(totalSec / dailyStats.length);
  }, [dailyStats]);

  const tempoMedioDiarioStr = useMemo(() => toHMS(tempoMedioDiarioSec), [tempoMedioDiarioSec]);

  // Tempo Médio por Unidade Despejada (segundos) - Meta DPO: < 50s por unidade
  const tempoMedioPorUnidadeSec = useMemo(() => {
    if (totalSkus === 0) return 44;
    return Math.round((totalTempoGastoSec / totalSkus) * 10) / 10;
  }, [totalTempoGastoSec, totalSkus]);

  const tempoMedioPorUnidadeStr = useMemo(() => {
    if (tempoMedioPorUnidadeSec < 60) return `${Math.round(tempoMedioPorUnidadeSec)}s`;
    return toHMS(Math.round(tempoMedioPorUnidadeSec));
  }, [tempoMedioPorUnidadeSec]);

  // Produtividade por Unidades por Hora (un/h) - Meta DPO: 30 un/h
  const produtividadeUnidadesHora = useMemo(() => {
    if (totalTempoGastoSec === 0) return 0;
    const horas = totalTempoGastoSec / 3600;
    return Math.round((totalSkus / horas) * 10) / 10;
  }, [totalSkus, totalTempoGastoSec]);

  const totalHE = useMemo(() => {
    const total = filteredRows.reduce((sum, r) => {
      let hl = 0;
      if (r.hlPerdido !== undefined && r.hlPerdido !== null && !isNaN(Number(r.hlPerdido)) && Number(r.hlPerdido) > 0) {
        hl = Number(r.hlPerdido);
      } else if (r.hectolitroPerdido !== undefined && r.hectolitroPerdido !== null && !isNaN(Number(r.hectolitroPerdido)) && Number(r.hectolitroPerdido) > 0) {
        hl = Number(r.hectolitroPerdido);
      } else {
        const factor = EMBALAGENS_VOLUME[r.embalagem] || 0.0035;
        hl = factor * (Number(r.quantidade) || 0);
      }
      return sum + hl;
    }, 0);
    return Math.round(total * 10000) / 10000;
  }, [filteredRows, EMBALAGENS_VOLUME]);

  const totalTempoEsperadoSec = useMemo(() => {
    return filteredRows.reduce((sum, r) => {
      const config = embalagensConfig[r.embalagem] || { metaSec: 50 };
      return sum + (config.metaSec * (Number(r.quantidade) || 1));
    }, 0);
  }, [filteredRows, embalagensConfig]);

  // Meta esperada média diária
  const tempoEsperadoDiarioStr = useMemo(() => {
    if (dailyStats.length === 0) return '00:00:00';
    return toHMS(Math.round(totalTempoEsperadoSec / dailyStats.length));
  }, [totalTempoEsperadoSec, dailyStats]);

  const eficienciaGeral = useMemo(() => {
    if (totalTempoGastoSec === 0) return 0;
    return Math.round((totalTempoEsperadoSec / totalTempoGastoSec) * 100);
  }, [totalTempoEsperadoSec, totalTempoGastoSec]);

  // Taxa de Conformidade DPO (% Meta Batida)
  const conformidadeMetaPct = useMemo(() => {
    if (filteredRows.length === 0) return 0;
    const dentro = filteredRows.filter(r => {
      const config = embalagensConfig[r.embalagem] || { metaSec: 50 };
      const expectedSec = config.metaSec * (Number(r.quantidade) || 1);
      const actualSec = getRowDurationSec(r);
      return actualSec <= expectedSec;
    }).length;
    return Math.round((dentro / filteredRows.length) * 100);
  }, [filteredRows, embalagensConfig]);

  // Top 5 Produtos / SKUs mais despejados por Registros
  const topProdutosDespejados = useMemo(() => {
    const map = new Map<string, { cod: string; desc: string; emb: string; registros: number; caixas: number; hl: number }>();
    filteredRows.forEach(r => {
      const cod = String(r.codProduto || r.codigoProduto || '—');
      const desc = r.descricao || r.embalagem || 'Produto Não Especificado';
      const key = `${cod}_${desc}`;
      const prev = map.get(key) || { cod, desc, emb: r.embalagem, registros: 0, caixas: 0, hl: 0 };
      const cx = Number(r.quantidade) || 0;
      const factor = EMBALAGENS_VOLUME[r.embalagem] || 0.0035;
      const hl = r.hlPerdido || r.hectolitroPerdido || (factor * cx);
      map.set(key, {
        cod,
        desc,
        emb: r.embalagem,
        registros: prev.registros + 1,
        caixas: prev.caixas + cx,
        hl: prev.hl + Number(hl)
      });
    });
    return Array.from(map.values()).sort((a, b) => b.registros - a.registros).slice(0, 6);
  }, [filteredRows, EMBALAGENS_VOLUME]);

  // Performance por Operador (Base: Registros e Unidades)
  const performanceOperadores = useMemo(() => {
    const map = new Map<string, { nome: string; totalRegistros: number; totalCx: number; totalSec: number; dentroMeta: number; totalOps: number }>();
    filteredRows.forEach(r => {
      const nome = (r.operador || 'Não Identificado').split('(')[0].trim();
      const prev = map.get(nome) || { nome, totalRegistros: 0, totalCx: 0, totalSec: 0, dentroMeta: 0, totalOps: 0 };
      const cx = Number(r.quantidade) || 0;
      const sec = getRowDurationSec(r);
      const config = embalagensConfig[r.embalagem] || { metaSec: 50 };
      const expected = config.metaSec * (cx || 1);
      map.set(nome, {
        nome,
        totalRegistros: prev.totalRegistros + 1,
        totalCx: prev.totalCx + cx,
        totalSec: prev.totalSec + sec,
        dentroMeta: prev.dentroMeta + (sec <= expected ? 1 : 0),
        totalOps: prev.totalOps + 1
      });
    });
    return Array.from(map.values())
      .map(op => {
        const horas = op.totalSec / 3600;
        return {
          ...op,
          regHora: horas > 0 ? Math.round((op.totalRegistros / horas) * 10) / 10 : 0,
          cxHora: horas > 0 ? Math.round((op.totalCx / horas) * 10) / 10 : 0,
          pctMeta: op.totalOps > 0 ? Math.round((op.dentroMeta / op.totalOps) * 100) : 0
        };
      })
      .sort((a, b) => b.totalRegistros - a.totalRegistros);
  }, [filteredRows, embalagensConfig]);

  // Chart 1: Daily Productivity vs Meta (Base: Unidades/Hora vs Meta 30 un/h)
  const chartProdutividadeDia = useMemo(() => {
    const list = dailyStats.map(d => {
      const horas = d.totalSec / 3600;
      const realUnH = horas > 0 ? Math.round((d.totalUn / horas) * 10) / 10 : 0;
      return {
        dia: d.dia,
        diaISO: d.dataISO,
        realCxH: realUnH,
        realRegH: realUnH,
        metaCxH: 30,
        metaRegH: 30
      };
    });
    return list.slice(-14);
  }, [dailyStats]);

  // Chart 2: Packaging Distribution (Base: Registros)
  const chartDistribuicaoEmbalagem = useMemo(() => {
    const map = new Map<string, number>();
    filteredRows.forEach(r => {
      const emb = r.embalagem || 'Outros';
      map.set(emb, (map.get(emb) || 0) + 1);
    });
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#64748b'];
    return Array.from(map.entries()).map(([name, value], idx) => ({
      name,
      value,
      color: colors[idx % colors.length]
    }));
  }, [filteredRows]);

  // Chart 3: Volume por Mês (Registros e HL)
  const chartVolumeMensal = useMemo(() => {
    const monthOrder: Record<string, number> = {
      'JANEIRO': 1, 'FEVEREIRO': 2, 'MARÇO': 3, 'ABRIL': 4,
      'MAIO': 5, 'JUNHO': 6, 'JULHO': 7, 'AGOSTO': 8,
      'SETEMBRO': 9, 'OUTUBRO': 10, 'NOVEMBRO': 11, 'DEZEMBRO': 12
    };
    const map = new Map<string, { mes: string; registros: number; caixas: number; hl: number }>();
    filteredRows.forEach(r => {
      const m = r.mes || (r.dataISO ? r.dataISO.slice(0, 7) : 'Geral');
      const prev = map.get(m) || { mes: m, registros: 0, caixas: 0, hl: 0 };
      const cx = Number(r.quantidade) || 0;
      const factor = EMBALAGENS_VOLUME[r.embalagem] || 0.0035;
      const hl = r.hlPerdido || r.hectolitroPerdido || (factor * cx);
      map.set(m, {
        mes: m,
        registros: prev.registros + 1,
        caixas: prev.caixas + cx,
        hl: Math.round((prev.hl + Number(hl)) * 10000) / 10000
      });
    });
    return Array.from(map.values()).sort((a, b) => {
      const orderA = monthOrder[a.mes.toUpperCase()] || 99;
      const orderB = monthOrder[b.mes.toUpperCase()] || 99;
      return orderA - orderB;
    });
  }, [filteredRows, EMBALAGENS_VOLUME]);

  // Chart 4: Evolução Temporal Contínua (Unidades e HL)
  const chartVolumeEvolucao = useMemo(() => {
    return dailyStats.map(d => ({
      dia: d.dia,
      diaISO: d.dataISO,
      registros: d.totalUn,
      un: d.totalUn,
      hl: Math.round(d.hl * 10000) / 10000
    })).slice(-14);
  }, [dailyStats]);

  // Helper para identificar se uma quebra ocorreu especificamente por prazo de validade expirado / produto vencido
  const isQuebraMotivoVencido = (q: Partial<QuebraRow>): boolean => {
    if (!q) return false;
    const anyQ = q as any;
    const mot = `${q.motivo || ''} ${anyQ.tipoAvaria || ''} ${anyQ.observacao || ''} ${q.descricao || ''} ${anyQ.origem || ''}`.toUpperCase();
    const cod = String(q.codQuebra || '').trim();

    // Códigos DPO específicos de produto vencido / validade
    const codigosVencimento = ['533', '554', '573', '585'];
    if (codigosVencimento.includes(cod)) return true;

    // Verificação textual estrita no motivo ou observações
    if (
      mot.includes('VENCID') ||
      mot.includes('VENCIMENTO') ||
      mot.includes('VALIDADE') ||
      mot.includes('SHELF') ||
      mot.includes('EXPIRAD') ||
      mot.includes('FORA DO PRAZO') ||
      mot.includes('PRAZO VENCIDO') ||
      mot.includes('DATA VENCIDA')
    ) {
      return true;
    }

    return false;
  };

  // Helper para classificar a causa raiz DPO de vencimento a partir dos dados da Quebra
  const getShelfCausaInfoFromQuebra = (q: Partial<QuebraRow>) => {
    const anyQ = q as any;
    const text = `${q.motivo || ''} ${anyQ.observacao || ''} ${q.area || ''} ${anyQ.tipoAvaria || ''}`.toLowerCase();
    
    if (text.includes('fefo') || text.includes('inversão') || text.includes('inversao') || text.includes('giro') || text.includes('puxada')) {
      return { causa: 'Falha de Giro / FEFO Invertido', cor: '#f43f5e', bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' };
    }
    if (text.includes('rota') || text.includes('cliente') || text.includes('devolu') || text.includes('retorno') || text.includes('entrega')) {
      return { causa: 'Retorno de Rota Vencido', cor: '#eab308', bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' };
    }
    if (text.includes('avaria') || text.includes('vazamento') || text.includes('quebra') || text.includes('danificado')) {
      return { causa: 'Avaria com Perda de Validade', cor: '#a855f7', bg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' };
    }
    if (text.includes('excesso') || text.includes('estoque') || text.includes('lento')) {
      return { causa: 'Giro Lento / Excesso de Estoque', cor: '#f97316', bg: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' };
    }
    if (text.includes('armazém') || text.includes('armazem') || text.includes('picking') || text.includes('bloco') || text.includes('pulmão') || text.includes('pulmao')) {
      return { causa: 'Validade Expirada no Armazém', cor: '#3b82f6', bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' };
    }

    const motivoFormatado = q.motivo ? q.motivo.trim() : 'Produto Vencido na Operação';
    return { causa: motivoFormatado, cor: '#f97316', bg: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' };
  };

  // Varredura estrita nas quebras: alimenta o dashboard APENAS se o motivo for produto vencido
  const rawShelfQuebras = useMemo(() => {
    return actualQuebras.filter(q => isQuebraMotivoVencido(q));
  }, [actualQuebras]);

  // Dataset Completo de Shelf Life (Produtos Vencidos vindos exclusivamente de Quebras)
  const shelfRows = useMemo(() => {
    return rawShelfQuebras.map(q => {
      const anyQ = q as any;
      const causaInfo = getShelfCausaInfoFromQuebra(q);
      const cx = Number(q.quantidade || q.caixas) || 0;
      
      // Cálculo volumétrico oficial em Hectolitros (HL)
      let hl = Number(anyQ.hectolitroPerdido || q.hlPerdido || 0);
      if (!hl || hl <= 0) {
        const hlInfo = getItemHlInfo(q);
        hl = hlInfo.totalHl || (cx * 0.084);
      }
      hl = Math.round(hl * 10000) / 10000;

      const embName = q.embalagem || getEmbalagemName(q.descricao || '') || 'Outros';

      return {
        _docId: q._docId || q.id || `q_shelf_${Math.random()}`,
        data: q.data || (q.dataISO ? q.dataISO.split('T')[0] : '—'),
        dataISO: q.dataISO,
        mes: q.mes || (q.dataISO ? q.dataISO.slice(0, 7) : 'Geral'),
        codProduto: q.codProduto || q.codQuebra || '—',
        descricao: q.descricao || anyQ.produto || 'Produto Vencido',
        embalagem: embName,
        unidades: cx,
        hlCalculado: hl,
        causaRaiz: causaInfo.causa,
        causaCor: causaInfo.cor,
        causaBg: causaInfo.bg,
        operador: q.responsavel || anyQ.operador || q.colaboradorQuebrou || anyQ.colaborador || anyQ.criadoPor || 'Operador Não Informado',
        area: q.area || 'Armazém',
        motivo: q.motivo || 'Produto Vencido',
        observacao: anyQ.observacao || anyQ.obs || '—',
        origem: 'Varredura Módulo Quebras (Vencido)'
      };
    });
  }, [rawShelfQuebras]);

  // Linhas Filtradas na aba Shelf Life
  const filteredShelfRows = useMemo(() => {
    return shelfRows.filter(r => {
      if (shelfFilterCausa !== 'todos' && r.causaRaiz !== shelfFilterCausa) return false;
      if (shelfFilterEmbalagem !== 'todos' && r.embalagem !== shelfFilterEmbalagem) return false;
      if (shelfSearch.trim()) {
        const q = shelfSearch.toLowerCase();
        const cod = String(r.codProduto || '').toLowerCase();
        const desc = (r.descricao || '').toLowerCase();
        const op = (r.operador || '').toLowerCase();
        const causa = (r.causaRaiz || '').toLowerCase();
        const area = (r.area || '').toLowerCase();
        if (!cod.includes(q) && !desc.includes(q) && !op.includes(q) && !causa.includes(q) && !area.includes(q)) return false;
      }
      return true;
    });
  }, [shelfRows, shelfFilterCausa, shelfFilterEmbalagem, shelfSearch]);

  const totalShelfHL = useMemo(() => {
    return Math.round(filteredShelfRows.reduce((sum, r) => sum + r.hlCalculado, 0) * 10000) / 10000;
  }, [filteredShelfRows]);

  const totalShelfUnidades = useMemo(() => {
    return filteredShelfRows.reduce((sum, r) => sum + r.unidades, 0);
  }, [filteredShelfRows]);

  const totalShelfRegistros = filteredShelfRows.length;

  // Ranking de SKUs Vencidos na Operação (Top 10)
  const rankingSkusVencidos = useMemo(() => {
    const map = new Map<string, { cod: string; desc: string; emb: string; registros: number; caixas: number; hl: number; causas: Record<string, number> }>();
    filteredShelfRows.forEach(r => {
      const cod = String(r.codProduto || '—');
      const desc = r.descricao || r.embalagem || 'Produto Não Especificado';
      const key = `${cod}_${desc}`;
      const prev = map.get(key) || { cod, desc, emb: r.embalagem, registros: 0, caixas: 0, hl: 0, causas: {} };
      prev.causas[r.causaRaiz] = (prev.causas[r.causaRaiz] || 0) + 1;
      map.set(key, {
        cod,
        desc,
        emb: r.embalagem,
        registros: prev.registros + 1,
        caixas: prev.caixas + r.unidades,
        hl: prev.hl + r.hlCalculado,
        causas: prev.causas
      });
    });
    return Array.from(map.values()).sort((a, b) => b.hl - a.hl).slice(0, 10);
  }, [filteredShelfRows]);

  // Distribuição de Causas Raiz de Vencimento
  const chartCausasVencimento = useMemo(() => {
    const map = new Map<string, { count: number; hl: number }>();
    filteredShelfRows.forEach(r => {
      const c = r.causaRaiz;
      const prev = map.get(c) || { count: 0, hl: 0 };
      map.set(c, { count: prev.count + 1, hl: prev.hl + r.hlCalculado });
    });
    const colors: Record<string, string> = {
      'Giro Lento / Excesso de Estoque': '#f97316',
      'Falha de Giro / FEFO Invertido': '#f43f5e',
      'Retorno de Rota Vencido': '#eab308',
      'Validade Expirada no Armazém': '#3b82f6',
      'Avaria com Perda de Validade': '#a855f7'
    };
    return Array.from(map.entries()).map(([name, data]) => ({
      name,
      registros: data.count,
      hl: Math.round(data.hl * 10000) / 10000,
      color: colors[name] || '#64748b'
    }));
  }, [filteredShelfRows]);

  // Evolução Mensal de Perdas por Vencimento (HL e Registros)
  const chartShelfMensal = useMemo(() => {
    const map = new Map<string, { mes: string; registros: number; caixas: number; hl: number }>();
    filteredShelfRows.forEach(r => {
      const m = r.mes || (r.dataISO ? r.dataISO.slice(0, 7) : 'Geral');
      const prev = map.get(m) || { mes: m, registros: 0, caixas: 0, hl: 0 };
      map.set(m, {
        mes: m,
        registros: prev.registros + 1,
        caixas: prev.caixas + r.unidades,
        hl: Math.round((prev.hl + r.hlCalculado) * 10000) / 10000
      });
    });
    return Array.from(map.values());
  }, [filteredShelfRows]);

  // Perdas por Embalagem no Shelf Life
  const chartShelfEmbalagens = useMemo(() => {
    const map = new Map<string, { count: number; hl: number; caixas: number }>();
    filteredShelfRows.forEach(r => {
      const emb = r.embalagem || 'Outros';
      const prev = map.get(emb) || { count: 0, hl: 0, caixas: 0 };
      map.set(emb, {
        count: prev.count + 1,
        hl: prev.hl + r.hlCalculado,
        caixas: prev.caixas + r.unidades
      });
    });
    return Array.from(map.entries())
      .map(([name, data]) => ({
        name,
        registros: data.count,
        caixas: data.caixas,
        hl: Math.round(data.hl * 10000) / 10000
      }))
      .sort((a, b) => b.hl - a.hl);
  }, [filteredShelfRows]);

  // Exportar Relatório Shelf Life para Excel
  const handleExportShelfXLSX = () => {
    try {
      if (filteredShelfRows.length === 0) {
        alert('Nenhum produto vencido identificado nas Quebras para exportação.');
        return;
      }
      const dataToExport = filteredShelfRows.map(r => ({
        'Data': r.data,
        'Mês': r.mes,
        'Código Produto': r.codProduto,
        'Descrição': r.descricao,
        'Embalagem': r.embalagem,
        'Quantidade (UN/CX)': r.unidades,
        'Volume Perdido (HL)': r.hlCalculado.toFixed(4),
        'Causa / Motivo da Quebra': r.causaRaiz,
        'Área': r.area,
        'Responsável': r.operador,
        'Observação': r.observacao || '—',
        'Origem': r.origem
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Varredura_Shelf_Vencidos');
      XLSX.writeFile(wb, `Varredura_Shelf_Life_Quebras_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (e) {
      console.error(e);
      alert('Erro ao exportar relatório de Shelf Life.');
    }
  };

  // Exportar Relatório Shelf Life para PDF
  const handleExportShelfPDF = () => {
    try {
      if (filteredShelfRows.length === 0) {
        alert('Nenhum produto vencido identificado nas Quebras para exportação.');
        return;
      }
      const doc = new jsPDF('p', 'pt', 'a4');
      doc.setFontSize(16);
      doc.setTextColor(3, 43, 94);
      doc.text('RELATÓRIO DPO - PRODUTOS VENCIDOS EM QUEBRAS (SHELF LIFE)', 40, 50);

      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Data de Emissão: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, 40, 70);
      doc.text(`Fonte: Varredura de Quebras (Motivo: Vencido) | Total Registros: ${totalShelfRegistros} | Caixas/UN: ${totalShelfUnidades} | Volume: ${totalShelfHL.toFixed(4)} HL`, 40, 85);

      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('PRODUTOS VENCIDOS IDENTIFICADOS NA VARREDURA (HL):', 40, 115);

      let y = 135;
      rankingSkusVencidos.slice(0, 15).forEach((item, idx) => {
        if (y > 750) {
          doc.addPage();
          y = 50;
        }
        doc.setFontSize(9);
        doc.setTextColor(30, 41, 59);
        doc.text(`${idx + 1}. [Cód: ${item.cod}] ${item.desc} (${item.emb})`, 40, y);
        doc.setTextColor(100, 116, 139);
        doc.text(`${item.caixas} UN | ${item.hl.toFixed(4)} HL | ${item.registros} quebras`, 420, y);
        y += 18;
      });

      doc.save(`Relatorio_DPO_Shelf_Life_Quebras_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (e) {
      console.error(e);
      alert('Erro ao exportar PDF de Shelf Life.');
    }
  };

  // Paginated Rows
  const searchedRows = useMemo(() => {
    if (!tableSearch.trim()) return filteredRows;
    const q = tableSearch.toLowerCase();
    return filteredRows.filter(r => 
      (r.operador || '').toLowerCase().includes(q) ||
      (r.embalagem || '').toLowerCase().includes(q) ||
      (r.data || '').toLowerCase().includes(q) ||
      (r.mes || '').toLowerCase().includes(q) ||
      (r.descricao || '').toLowerCase().includes(q) ||
      String(r.codProduto || r.codigoProduto || '').toLowerCase().includes(q) ||
      (r.motivo || '').toLowerCase().includes(q)
    );
  }, [filteredRows, tableSearch]);

  const totalPages = Math.max(1, Math.ceil(searchedRows.length / itemsPerPage));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return searchedRows.slice(start, start + itemsPerPage);
  }, [searchedRows, currentPage, itemsPerPage]);

  // Selected Row Object
  const selectedRowObj = useMemo(() => {
    if (!selectedRowId) return null;
    return despejoRows.find(r => (r as any)._docId === selectedRowId || r.id === selectedRowId) || null;
  }, [selectedRowId, despejoRows]);

  // Delete Row Handler
  const handleDeleteRow = async (rowId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este registro de Despejo?')) return;
    try {
      const companyId = empresa?.id || 'demo';
      await DespejoRepository.delete(rowId, companyId);
      const updated = despejoRows.filter(r => (r as any)._docId !== rowId && r.id !== rowId);
      setDespejoRows(updated);
      localStorage.setItem(`despejo_rows_${companyId}`, JSON.stringify(updated));
      setSelectedRowId(null);
    } catch (e) {
      console.error(e);
      alert('Erro ao excluir registro.');
    }
  };

  // Submit New Production Record
  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    const config = embalagensConfig[newEmbalagem] || { metaSec: 50 };
    const expectedSec = config.metaSec * newQuantidade;
    const duracaoHMS = toHMS(stopwatchSeconds > 0 ? stopwatchSeconds : expectedSec);
    const duracaoSec = stopwatchSeconds > 0 ? stopwatchSeconds : expectedSec;
    const isWithin = duracaoSec <= expectedSec;

    if (!isWithin && !newMotivoFalha.trim()) {
      alert('O tempo de despejo excedeu a meta calculada. Por favor, especifique a justificativa operacional / motivo da falha.');
      return;
    }

    const now = new Date();
    const factor = EMBALAGENS_VOLUME[newEmbalagem] || 8.4;
    const hlCalc = Math.round(((factor * newQuantidade) / 100) * 10000) / 10000;

    const newRecord: Partial<DespejoRow> = {
      empresaId: empresa?.id || 'demo',
      data: now.toLocaleDateString('pt-BR'),
      dataISO: now.toISOString().split('T')[0],
      mes: now.toLocaleString('pt-BR', { month: 'long' }).toUpperCase(),
      operador: newOperador,
      embalagem: newEmbalagem,
      quantidade: newQuantidade,
      hlPerdido: hlCalc,
      hectolitroPerdido: hlCalc,
      tempo: duracaoHMS,
      duracao: duracaoHMS,
      inicio: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      fim: new Date(now.getTime() + duracaoSec * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      resultado: isWithin ? '🟢 META BATIDA' : '🔴 ACIMA DA META',
      motivo: !isWithin ? newMotivoFalha : undefined,
      _criadoEm: now.toISOString()
    };

    try {
      const companyId = empresa?.id || 'demo';
      const added = await DespejoRepository.create(newRecord as any, companyId);
      const docId = added._docId || added.id || `despejo_manual_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const fullRecord: DespejoRow = {
        _docId: docId,
        id: docId,
        ...newRecord
      } as DespejoRow;

      const updated = [fullRecord, ...despejoRows.filter(r => (r.id || r._docId) !== docId)];
      setDespejoRows(updated);
      localStorage.setItem(`despejo_rows_${companyId}`, JSON.stringify(updated));

      // Persiste também em despejo_manual_entries_
      try {
        const savedManual = localStorage.getItem(`despejo_manual_entries_${companyId}`);
        const manualList: DespejoRow[] = savedManual ? JSON.parse(savedManual) : [];
        const updatedManual = [fullRecord, ...manualList.filter(m => (m.id || m._docId) !== docId)];
        localStorage.setItem(`despejo_manual_entries_${companyId}`, JSON.stringify(updatedManual));
      } catch (e) {}

      // Dispara eventos em tempo real
      window.dispatchEvent(new CustomEvent('despejo-updated', { detail: { record: fullRecord, companyId } }));
      window.dispatchEvent(new CustomEvent('despejo-db-updated', { detail: { record: fullRecord, companyId } }));
      window.dispatchEvent(new CustomEvent('empresa-data-reload', { detail: { collection: 'despejo' } }));
      window.dispatchEvent(new CustomEvent('storage'));

      setIsRegisterModalOpen(false);
      setStopwatchSeconds(0);
      setIsStopwatchRunning(false);
      setNewMotivoFalha('');
      alert('Registro de Despejo adicionado com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar registro de Despejo.');
    }
  };

  // Export to Excel
  const handleExportXLSX = () => {
    const data = filteredRows.map(r => {
      const factor = EMBALAGENS_VOLUME[r.embalagem] || 8.4;
      const hlVal = r.hlPerdido || r.hectolitroPerdido || ((factor * (Number(r.quantidade) || 0)) / 100);
      return {
        'Data': r.data || r.dataISO || '—',
        'Mês': r.mes || '—',
        'Cód. Produto': r.codProduto || r.codigoProduto || '—',
        'Descrição': r.descricao || '—',
        'Colaborador / Operador': r.operador || '—',
        'Embalagem': r.embalagem,
        'Quantidade (UN)': r.quantidade,
        'Hectolitro Perdido (HL)': typeof hlVal === 'number' ? Number(hlVal.toFixed(4)) : hlVal,
        'Hora Inicial': r.inicio || '—',
        'Hora Final': r.fim || '—',
        'Duração / Tempo': r.duracao || r.tempo,
        'Resultado / Meta': r.resultado || (toSec(r.duracao || r.tempo || 0) <= (embalagensConfig[r.embalagem]?.metaSec || 50) * (Number(r.quantidade) || 1) ? '🟢 META BATIDA' : '🔴 ACIMA DA META'),
        'Justificativa / Motivo': r.motivo || '—'
      };
    });
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Despejo');
    XLSX.writeFile(wb, `Produtividade_Despejo_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Export to PDF
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const nowStr = new Date().toLocaleDateString('pt-BR');

      doc.setFillColor(30, 58, 138); // Dark Navy Blue
      doc.rect(0, 0, pageWidth, 28, 'F');
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('RELATÓRIO GERENCIAL DE DESPEJO & DESCARTE', 14, 13);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Empresa: ${empresa?.nome || 'Unidade Fabril'} | Data: ${nowStr} | Registros: ${filteredRows.length}`, 14, 21);

      // KPI Box
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, 34, pageWidth - 28, 26, 3, 3, 'FD');

      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);
      doc.setFont('helvetica', 'bold');
      doc.text(`Total de Registros: ${filteredRows.length.toLocaleString('pt-BR')} ops`, 20, 44);
      doc.text(`Volume Total: ${totalSkus.toLocaleString('pt-BR')} UN (${totalHE.toFixed(2)} HL)`, 80, 44);
      doc.text(`Produtividade: ${produtividadeUnidadesHora.toFixed(1)} un/h`, 145, 44);

      doc.setFont('helvetica', 'normal');
      doc.text(`Tempo Total Gasto: ${toHMS(totalTempoGastoSec)}`, 20, 53);
      doc.text(`Conformidade DPO: ${conformidadeMetaPct}%`, 80, 53);
      doc.text(`Meta DPO: ${metaProdutividadeCxH} un/h`, 145, 53);

      // Table Header
      let y = 68;
      doc.setFillColor(241, 245, 249);
      doc.rect(14, y, pageWidth - 28, 7, 'F');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);

      doc.text('Data', 16, y + 5);
      doc.text('Operador', 38, y + 5);
      doc.text('Embalagem', 75, y + 5);
      doc.text('UN', 112, y + 5);
      doc.text('HL', 126, y + 5);
      doc.text('Tempo', 142, y + 5);
      doc.text('Status', 164, y + 5);

      y += 10;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);

      filteredRows.slice(0, 30).forEach((r) => {
        if (y > 275) {
          doc.addPage();
          y = 20;
        }
        const factor = EMBALAGENS_VOLUME[r.embalagem] || 8.4;
        const hl = r.hlPerdido || r.hectolitroPerdido || (factor * (Number(r.quantidade) || 0) / 100);
        const actualSec = getRowDurationSec(r);
        const within = r.resultado?.includes('META BATIDA') || actualSec <= (embalagensConfig[r.embalagem]?.metaSec || 50) * (Number(r.quantidade) || 1);

        doc.setTextColor(71, 85, 105);
        doc.text(String(r.data || r.dataISO || '—').slice(0, 10), 16, y);
        doc.text(String(r.operador || '—').slice(0, 18), 38, y);
        doc.text(String(r.embalagem || '—').slice(0, 16), 75, y);
        doc.text(String(r.quantidade || 0), 112, y);
        doc.text(Number(hl).toFixed(2), 126, y);
        doc.text(toHMS(actualSec), 142, y);

        if (within) {
          doc.setTextColor(16, 185, 129);
          doc.text('OK DPO', 164, y);
        } else {
          doc.setTextColor(239, 68, 68);
          doc.text('ACIMA', 164, y);
        }
        y += 6;
      });

      doc.save(`Relatorio_Despejo_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (e) {
      console.error(e);
      alert('Erro ao gerar relatório PDF.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-900 dark:text-slate-100">
      
      {/* HEADER WITH CONTROLS */}
      <header className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 pb-4 border-b border-gray-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          {onBack && (
            <button 
              onClick={onBack}
              className="p-2 hover:bg-gray-200 dark:hover:bg-slate-800 rounded-xl transition-colors text-gray-500 dark:text-slate-400"
              title="Voltar"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-lg shadow-md shadow-blue-500/20">
            <Droplet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-xl tracking-tight text-[#032b5e] dark:text-blue-400 uppercase">
                PRODUTIVIDADE DO DESPEJO
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                PADRÃO DPO
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-slate-400 font-semibold tracking-wide uppercase mt-0.5">
              INDICADORES ESTRATÉGICOS, METAS DE DESEMPENHO E CRONOMETRAGEM DE DESPEJO
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <DespejoHeaderClock />

          {/* BOTÃO RECALCULAR ATINGIMENTO */}
          <button
            type="button"
            onClick={handleRecalcularAtingimento}
            disabled={isRecalculatingGlobal}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-sm uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer hover:scale-[1.02] active:scale-95 border border-amber-400/50"
            title="Recalcular conformidade e atingimento de todos os registros de Despejo com base nas metas alteradas"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRecalculatingGlobal ? 'animate-spin' : ''}`} />
            <span>{isRecalculatingGlobal ? 'Recalculando...' : 'Recalcular Atingimento'}</span>
          </button>

          {/* ATALHO DTO DIAGNÓSTICO OPERACIONAL (DESPEJO) */}
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent('open_dto_operacao', { detail: { operacao: 'despejo' } }));
              window.dispatchEvent(new CustomEvent('app_navigate', { detail: { panel: 'dto-diagnostico', operacao: 'despejo' } }));
            }}
            className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs rounded-xl shadow-sm uppercase tracking-wider flex items-center gap-1.5 transition-all border border-purple-400/40 hover:scale-[1.02] active:scale-95 cursor-pointer"
            title="Abrir Diagnóstico DTO Operacional de Despejo"
          >
            <ClipboardCheck className="w-4 h-4 text-purple-200" />
            <span>DTO Despejo</span>
          </button>

          <button
            onClick={() => reloadData()}
            disabled={loading}
            className="p-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl border border-gray-200 dark:border-slate-700 shadow-xs transition-colors"
            title="Recarregar dados"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          <button
            onClick={() => setIsPopModalOpen(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs rounded-xl shadow-sm uppercase tracking-wider flex items-center gap-1.5 transition-all"
          >
            📋 Padrão Operacional (POP)
          </button>

          {/* LICENÇAS E RECIBOS DE DESCARTE (SUDEMA) */}
          <button
            onClick={() => setActiveSubTab('licencas')}
            className={`px-3.5 py-2 bg-gradient-to-r ${
              activeSubTab === 'licencas'
                ? 'from-emerald-600 to-teal-700 text-white ring-2 ring-emerald-400'
                : 'from-emerald-700 to-teal-800 hover:from-emerald-600 hover:to-teal-700 text-emerald-100'
            } font-black text-xs rounded-xl shadow-sm uppercase tracking-wider flex items-center gap-1.5 transition-all border border-emerald-500/40 cursor-pointer hover:scale-[1.02] active:scale-95`}
            title="Acessar Licenças de Despejo e Descarte (SUDEMA) e Recibos Pedro Cidelino"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span>Licenças SUDEMA</span>
          </button>

          {/* DEDICATED ACTION BUTTON FILTERING DESPEJO */}
          <button
            onClick={() => setActiveSubTab('acoes')}
            className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs rounded-xl shadow-sm uppercase tracking-wider flex items-center gap-1.5 transition-all border border-blue-400/30 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>Gerar Ações</span>
          </button>

          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl shadow-sm uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Novo Despejo</span>
          </button>

          <div className="flex items-center bg-gray-100 dark:bg-slate-800 p-1 rounded-xl border border-gray-200 dark:border-slate-700">
            <button 
              onClick={() => setActiveSubTab('produtividade')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                activeSubTab === 'produtividade' 
                  ? 'bg-[#032b5e] dark:bg-blue-600 text-white shadow-sm' 
                  : 'text-gray-600 dark:text-slate-400 hover:text-[#032b5e]'
              }`}
            >
              Produtividade & BI
            </button>
            <button 
              onClick={() => setActiveSubTab('shelf')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'shelf' 
                  ? 'bg-[#032b5e] dark:bg-blue-600 text-white shadow-sm' 
                  : 'text-gray-600 dark:text-slate-400 hover:text-[#032b5e]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>SHELF</span>
            </button>
            <button 
              onClick={() => setActiveSubTab('licencas')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                activeSubTab === 'licencas' 
                  ? 'bg-emerald-600 dark:bg-emerald-600 text-white shadow-sm' 
                  : 'text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 font-black'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Licenças & Recibos</span>
            </button>
            <button 
              onClick={() => setActiveSubTab('acoes')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                activeSubTab === 'acoes' 
                  ? 'bg-[#032b5e] dark:bg-blue-600 text-white shadow-sm' 
                  : 'text-gray-600 dark:text-slate-400 hover:text-[#032b5e]'
              }`}
            >
              ⚡ Gerar Ações
            </button>
            <button 
              onClick={() => setActiveSubTab('boarda3')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                activeSubTab === 'boarda3' 
                  ? 'bg-[#032b5e] dark:bg-blue-600 text-white shadow-sm' 
                  : 'text-gray-600 dark:text-slate-400 hover:text-[#032b5e]'
              }`}
            >
              Quadro A3
            </button>
          </div>
        </div>
      </header>

      {/* FEEDBACK BANNER DE RECALCULAÇÃO */}
      {globalRecalcBanner && recalcSummary && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 rounded-xl flex items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-top-2 duration-300 shadow-sm mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <strong className="font-black uppercase tracking-wider">Atingimento Recalculado com Sucesso!</strong>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">
                {recalcSummary.total} registros de Despejo reprocessados: <strong>{recalcSummary.dentro} Dentro da Meta ({recalcSummary.conformidadePct}%)</strong> e <strong>{recalcSummary.fora} Fora da Meta</strong>.
              </p>
            </div>
          </div>
          <button
            onClick={() => setGlobalRecalcBanner(false)}
            className="text-emerald-700 hover:text-emerald-950 dark:text-emerald-300 text-[11px] font-bold underline cursor-pointer"
          >
            Fechar
          </button>
        </div>
      )}

      {/* SUB TAB: PRODUTIVIDADE & BI */}
      {activeSubTab === 'produtividade' && (
        <div className="space-y-6">
          
          {/* MANUAL DE INSTRUÇÃO E PARÂMETROS DE METAS (DESPEJO) */}
          <RepackMetasParametrosCard
            empresaId={empresa?.id || 'demo'}
            metaProdutividadeCxH={metaProdutividadeCxH}
            onUpdateMetaProdutividade={(newVal) => updateTarget('despejo_produtividade', newVal)}
            embalagensConfig={embalagensConfig}
            onUpdateEmbalagemMeta={handleUpdateEmbalagemMeta}
            onResetEmbalagens={handleResetEmbalagens}
            onRecalcular={handleRecalcularAtingimento}
            isManager={user?.papel === 'admin' || user?.papel === 'supervisor' || true}
            processo="despejo"
          />

          {/* FILTER BAR */}
          <section className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              
              {/* Período (Calendário) */}
              <div className="flex flex-col gap-1 min-w-[190px]">
                <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                  Período (Calendário)
                </label>
                <CalendarFilter
                  startDate={filterStartDate}
                  endDate={filterEndDate}
                  onChange={(start, end) => {
                    setFilterStartDate(start);
                    setFilterEndDate(end);
                  }}
                />
              </div>

              {/* Mês Filter */}
              {distinctMeses.length > 0 && (
                <div className="flex flex-col gap-1 min-w-[130px]">
                  <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                    Mês
                  </label>
                  <select
                    value={filterMes}
                    onChange={(e) => setFilterMes(e.target.value)}
                    className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-500"
                  >
                    <option value="todos">Todos os Meses</option>
                    {distinctMeses.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Colaborador */}
              <div className="flex flex-col gap-1 min-w-[140px]">
                <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                  Colaborador
                </label>
                <select
                  value={filterColaborador}
                  onChange={(e) => setFilterColaborador(e.target.value)}
                  className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-500"
                >
                  <option value="todos">Todos Colaboradores</option>
                  {distinctOperadores.map(op => (
                    <option key={op} value={op}>{op}</option>
                  ))}
                </select>
              </div>

              {/* Embalagem */}
              <div className="flex flex-col gap-1 min-w-[140px]">
                <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                  Embalagem
                </label>
                <select
                  value={filterEmbalagem}
                  onChange={(e) => setFilterEmbalagem(e.target.value)}
                  className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-500"
                >
                  <option value="todos">Todas Embalagens</option>
                  {embalagensList.map(emb => (
                    <option key={emb} value={emb}>{emb}</option>
                  ))}
                </select>
              </div>

              {/* Meta Status */}
              <div className="flex flex-col gap-1 min-w-[130px]">
                <label className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                  Status da Meta
                </label>
                <select
                  value={filterMeta}
                  onChange={(e) => setFilterMeta(e.target.value as any)}
                  className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-500"
                >
                  <option value="todos">Todos</option>
                  <option value="dentro">Dentro da Meta</option>
                  <option value="fora">Fora da Meta</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleApplyFilters}
                className="px-4 py-2 bg-[#032b5e] dark:bg-blue-600 hover:bg-blue-800 text-white font-bold rounded-xl text-xs shadow-sm transition-all"
              >
                Aplicar Filtros
              </button>
              <button
                onClick={handleClearFilters}
                className="px-3 py-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-gray-600 dark:text-slate-300 font-bold rounded-xl text-xs transition-all"
              >
                Limpar
              </button>
            </div>
          </section>

          {/* 4 CORE KPI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* KPI 1: TOTAL DE REGISTROS */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-slate-500">
                  Total de Registros
                </span>
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Box className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black font-mono text-slate-900 dark:text-white">
                    {filteredRows.length.toLocaleString('pt-BR')}
                  </span>
                  <span className="text-xs font-bold text-gray-400 uppercase">REGISTROS</span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-blue-600 dark:text-blue-400 font-bold">
                  <span>{totalSkus.toLocaleString('pt-BR')} Unidades</span>
                  <span className="text-gray-300 dark:text-slate-700">•</span>
                  <span>{totalHE.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} HL Perdido</span>
                </div>
              </div>
            </div>

            {/* KPI 2: TEMPO MÉDIO DIÁRIO */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-slate-500">
                  Tempo Médio Diário
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black font-mono text-slate-900 dark:text-white">
                    {tempoMedioDiarioStr}
                  </span>
                  <span className="text-xs font-bold text-gray-400 uppercase">MÉDIA / DIA</span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-slate-400 font-semibold">
                  <span>Média/un: <strong>{tempoMedioPorUnidadeStr}</strong></span>
                  <span className="text-gray-300 dark:text-slate-700">•</span>
                  <span className={tempoMedioPorUnidadeSec <= 50 ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                    Meta: &lt; 50s
                  </span>
                </div>
              </div>
            </div>

            {/* KPI 3: PRODUTIVIDADE UN/H VS META */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 tracking-wider">
                  Produtividade UN/H
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black font-mono text-amber-500">
                    {produtividadeUnidadesHora.toFixed(1)}
                  </span>
                  <span className="text-xs font-bold text-gray-400 uppercase">UN / HORA</span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-slate-400 font-semibold">
                  <span>Meta DPO: <strong className="text-slate-900 dark:text-slate-100">{metaProdutividadeCxH} un/h</strong></span>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-black uppercase ${
                    produtividadeUnidadesHora >= metaProdutividadeCxH ? 'bg-emerald-500/20 text-emerald-600' : 'bg-rose-500/20 text-rose-600'
                  }`}>
                    {produtividadeUnidadesHora >= metaProdutividadeCxH ? 'ATINGIDA' : 'ABAIXO'}
                  </span>
                </div>
              </div>
            </div>

            {/* KPI 4: EFICIÊNCIA GERAL & CONFORMIDADE */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-slate-500">
                  Conformidade DPO
                </span>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  conformidadeMetaPct >= 80 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                }`}>
                  <Target className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl font-black font-mono ${
                    conformidadeMetaPct >= 80 ? 'text-emerald-500' : 'text-amber-500'
                  }`}>
                    {conformidadeMetaPct}%
                  </span>
                  <span className="text-xs font-bold text-gray-400 uppercase">META BATIDA</span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-slate-400 font-semibold">
                  <span>Eficiência: <strong>{eficienciaGeral}%</strong></span>
                  <span className="text-gray-300 dark:text-slate-700">•</span>
                  <span>{conformidadeMetaPct >= 80 ? 'Excelente' : 'Atenção'}</span>
                </div>
              </div>
            </div>

          </div>

          {/* SIMULADOR DE AGILIDADE & METAS (DESPEJO) */}
          <SimuladorAgilidadeMeta
            tipo="despejo"
            totalHectolitros={totalHE}
            totalCaixasUnidades={totalSkus}
            tempoTotalMinutos={totalTempoGastoSec / 60}
            metaHectolitrosMensal={450}
            metaCxHora={metaProdutividadeCxH}
            diasUteisElapsed={workingDaysInfo.elapsedWorkingDays}
            diasUteisTotal={workingDaysInfo.totalWorkingDays}
          />

          {/* BI CHARTS SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* CHART 1: PRODUTIVIDADE DIÁRIA (UN/H REAL VS META) */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-blue-600" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                    Produtividade Diária de Despejo (un/h Real vs Meta {metaProdutividadeCxH} un/h)
                  </h3>
                </div>
                <span className="text-xs text-gray-400 font-semibold">Últimos dias</span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartProdutividadeDia} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                    <XAxis dataKey="dia" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#0f172a', 
                        borderColor: '#334155', 
                        borderRadius: '12px', 
                        color: '#fff', 
                        fontSize: '13px', 
                        padding: '10px 14px',
                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
                      }}
                      formatter={(val: any, name: string) => [
                        `${val} un/h`, 
                        name === 'realRegH' || name === 'realCxH' ? 'Produtividade Real' : 'Meta DPO (30 un/h)'
                      ]}
                    />
                    <Bar dataKey="realRegH" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                      {chartProdutividadeDia.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.realRegH >= entry.metaRegH ? '#10b981' : '#f59e0b'} 
                        />
                      ))}
                    </Bar>
                    <Line type="monotone" dataKey="metaRegH" stroke="#ef4444" strokeWidth={2} dot={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* CHART 2: EMBALAGENS DISTRIBUTION */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-purple-600" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                    Mix de Embalagens Despejadas
                  </h3>
                </div>
                <span className="text-xs text-gray-400 font-semibold">Registros por Tipo</span>
              </div>

              <div className="h-48 w-full flex items-center justify-center">
                {chartDistribuicaoEmbalagem.length === 0 ? (
                  <p className="text-xs text-gray-400">Sem dados para exibir</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartDistribuicaoEmbalagem}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                      >
                        {chartDistribuicaoEmbalagem.map((entry, idx) => (
                          <Cell key={`pie-cell-${idx}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#0f172a', 
                          borderColor: '#334155', 
                          borderRadius: '12px', 
                          color: '#fff', 
                          fontSize: '13px', 
                          padding: '10px 14px',
                          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
                        }}
                        formatter={(val: any) => [`${val} registros`, 'Contagem']} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {chartDistribuicaoEmbalagem.slice(0, 4).map((item, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600 dark:text-slate-400 truncate text-[11px]">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CHART 3: EVOLUÇÃO TEMPORAL (ÁREA) */}
            <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                    Tendência de Registros Despejados (Registros e Hectolitros ao Longo dos Dias)
                  </h3>
                </div>
                <span className="text-xs text-gray-400 font-semibold">Volume acumulado diário</span>
              </div>

              <div className="h-56 w-full">
                {chartVolumeEvolucao.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-gray-400">
                    Sem dados temporais disponíveis
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartVolumeEvolucao} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorReg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorHl" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                      <XAxis dataKey="dia" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#0f172a', 
                          borderColor: '#334155', 
                          borderRadius: '12px', 
                          color: '#fff', 
                          fontSize: '13px', 
                          padding: '10px 14px',
                          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
                        }}
                        formatter={(val: any, name: string) => [val, name === 'registros' ? 'Registros (Ops)' : 'Hectolitros (HL)']} 
                      />
                      <Area type="monotone" dataKey="registros" stroke="#3b82f6" fillOpacity={1} fill="url(#colorReg)" name="registros" />
                      <Area type="monotone" dataKey="hl" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorHl)" name="hl" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

          </div>

          {/* RECORDS TABLE & AUDIT */}
          <section className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            
            <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-b border-gray-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                  Histórico de Registros de Despejo ({searchedRows.length})
                </h3>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-72">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar código, embalagem, operador, mês..."
                    value={tableSearch}
                    onChange={(e) => {
                      setTableSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  onClick={() => {
                    const companyId = empresa?.id || 'demo';
                    localStorage.removeItem(`despejo_rows_${companyId}`);
                    reloadData();
                  }}
                  className="px-2.5 py-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shrink-0"
                  title="Sincronizar com a Base Oficial do Código (2.035 registros)"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                  <span className="hidden sm:inline">Base Oficial (2.035)</span>
                </button>

                <button
                  onClick={reloadData}
                  className="p-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 rounded-xl text-xs font-bold transition-all shrink-0"
                  title="Recarregar Dados"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>

                <button
                  onClick={handleExportXLSX}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
                  title="Exportar para planilha Excel"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>XLSX</span>
                </button>

                <button
                  onClick={handleExportPDF}
                  className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
                  title="Exportar Relatório em PDF"
                >
                  <FileText className="w-3.5 h-3.5 text-white" />
                  <span>PDF</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 uppercase font-black tracking-wider text-[10px] border-b border-gray-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3.5">Data / Mês</th>
                    <th className="p-3.5">Cód. / Embalagem</th>
                    <th className="p-3.5">Operador</th>
                    <th className="p-3.5">Embalagem</th>
                    <th className="p-3.5 text-center">Quantidade</th>
                    <th className="p-3.5 text-center">HL Perdido</th>
                    <th className="p-3.5 text-center">Horário</th>
                    <th className="p-3.5 text-center">Duração</th>
                    <th className="p-3.5 text-center">Meta Calc.</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-800">
                  {paginatedRows.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="p-8 text-center text-gray-400">
                        Nenhum registro de despejo encontrado para os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((row, rIdx) => {
                      const docId = (row as any)._docId || row.id || `row-${rIdx}`;
                      const config = embalagensConfig[row.embalagem] || { metaSec: 50 };
                      const expectedSec = config.metaSec * (Number(row.quantidade) || 1);
                      const actualSec = getRowDurationSec(row);
                      const isWithin = actualSec <= expectedSec;
                      const factor = EMBALAGENS_VOLUME[row.embalagem] || 8.4;
                      const hlVal = row.hlPerdido || row.hectolitroPerdido || ((factor * (Number(row.quantidade) || 0)) / 100);

                      return (
                        <tr 
                          key={`despejo-row-${docId}-${rIdx}`} 
                          onClick={() => setSelectedRowId(selectedRowId === docId ? null : docId)}
                          className={`hover:bg-blue-50/50 dark:hover:bg-blue-950/20 cursor-pointer transition-colors ${
                            selectedRowId === docId ? 'bg-blue-50/80 dark:bg-blue-950/40' : ''
                          }`}
                        >
                          <td className="p-3.5 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            <div className="font-bold text-slate-900 dark:text-slate-100">{row.data || row.dataISO || '—'}</div>
                            {row.mes && <div className="text-[10px] text-gray-400 uppercase font-semibold">{row.mes}</div>}
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <div className="font-bold text-blue-600 dark:text-blue-400">
                              {row.embalagem || row.descricao || '—'}
                            </div>
                            {(row.codProduto || row.codigoProduto) && (
                              <div className="text-[10px] text-gray-400 font-mono">
                                Cód: {row.codProduto || row.codigoProduto}
                              </div>
                            )}
                          </td>
                          <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                            {row.operador || '—'}
                          </td>
                          <td className="p-3.5 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            {row.embalagem}
                          </td>
                          <td className="p-3.5 text-center font-bold font-mono">
                            {row.quantidade} UN
                          </td>
                          <td className="p-3.5 text-center font-mono font-bold text-purple-600 dark:text-purple-400">
                            {typeof hlVal === 'number' ? hlVal.toFixed(4) : hlVal} HL
                          </td>
                          <td className="p-3.5 text-center text-gray-500 dark:text-slate-400 font-mono">
                            {row.inicio || '—'} {row.fim ? `às ${row.fim}` : ''}
                          </td>
                          <td className="p-3.5 text-center font-bold font-mono text-slate-900 dark:text-slate-100">
                            {toHMS(actualSec)}
                          </td>
                          <td className="p-3.5 text-center font-mono text-gray-500 dark:text-slate-400">
                            {toHMS(expectedSec)}
                          </td>
                          <td className="p-3.5 text-center whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                              isWithin 
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' 
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                            }`}>
                              {isWithin ? '🟢 Meta Batida' : '🔴 Acima da Meta'}
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteRow(docId);
                              }}
                              className="p-1.5 text-gray-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
                              title="Excluir Registro"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between text-xs text-gray-500">
              <span>Página {currentPage} de {totalPages}</span>
              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="p-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg disabled:opacity-40 hover:bg-gray-100 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="p-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg disabled:opacity-40 hover:bg-gray-100 transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </section>

          {/* AUDIT DETAILS FOR SELECTED ROW */}
          {selectedRowObj && (
            <div className="bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border border-blue-500/40 rounded-2xl p-5 shadow-md animate-fade-in space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-blue-900 dark:text-blue-300 uppercase tracking-wide flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Auditoria de Registro: {selectedRowObj.operador} — {selectedRowObj.descricao || selectedRowObj.embalagem}
                </h4>
                <button
                  onClick={() => setSelectedRowId(null)}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Fechar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-gray-200 dark:border-slate-800">
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Data, Mês & Horário</span>
                  <span className="font-bold text-slate-900 dark:text-white mt-0.5 block">
                    {selectedRowObj.data || selectedRowObj.dataISO} {selectedRowObj.mes ? `(${selectedRowObj.mes})` : ''} • {selectedRowObj.inicio} às {selectedRowObj.fim || '—'}
                  </span>
                </div>

                <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-gray-200 dark:border-slate-800">
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Embalagem Oficial</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400 mt-0.5 block">
                    {selectedRowObj.embalagem || selectedRowObj.descricao} {selectedRowObj.codProduto ? `[Cód: ${selectedRowObj.codProduto}]` : ''}
                  </span>
                </div>

                <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-gray-200 dark:border-slate-800">
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Volume Despejado & HL</span>
                  <span className="font-bold font-mono text-slate-900 dark:text-white mt-0.5 block">
                    {selectedRowObj.quantidade} UN • {selectedRowObj.hlPerdido || selectedRowObj.hectolitroPerdido || '—'} HL
                  </span>
                </div>

                <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-gray-200 dark:border-slate-800">
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Tempo Real vs Meta</span>
                  <span className="font-bold font-mono text-slate-900 dark:text-white mt-0.5 block">
                    {selectedRowObj.duracao || selectedRowObj.tempo} (Meta: {toHMS((embalagensConfig[selectedRowObj.embalagem]?.metaSec || 50) * (Number(selectedRowObj.quantidade) || 1))})
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* SUB TAB: SHELF (ANÁLISE DE PRODUTOS VENCIDOS NA OPERAÇÃO) */}
      {activeSubTab === 'shelf' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* BANNER PRINCIPAL SHELF LIFE */}
          <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-amber-500/30 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-slate-950 font-black shadow-md shadow-orange-500/20">
                <Calendar className="w-6 h-6 text-slate-950" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">
                    Gestão de Shelf Life & Análise de Produtos Vencidos
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40">
                    PADRÃO DPO AMBEV
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl font-medium leading-relaxed">
                  Monitoramento técnico de produtos descartados por término de validade na operação, diagnóstico de causa raiz (falha de giro FEFO, excesso de estoque, retorno de rota) e volume em Hectolitros (HL) perdidos.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto">
              <button
                onClick={handleExportShelfXLSX}
                className="px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
                title="Exportar dados para Excel"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Exportar Excel</span>
              </button>
              <button
                onClick={handleExportShelfPDF}
                className="px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all"
                title="Exportar Relatório PDF"
              >
                <Download className="w-4 h-4" />
                <span>Relatório PDF</span>
              </button>
            </div>
          </div>

          {/* 4 CARDS KPIS DE SHELF LIFE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* KPI 1: Volume Vencido (HL) */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Volume Vencido Perdido
                </span>
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Droplet className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black font-mono text-purple-600 dark:text-purple-400">
                  {totalShelfHL.toFixed(4)}
                </span>
                <span className="text-xs font-bold text-slate-500 uppercase">HL</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Representa o volume total descartado por vencimento
              </p>
            </div>

            {/* KPI 2: Total Unidades / Caixas */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Total de Unidades Vencidas
                </span>
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Package className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black font-mono text-amber-600 dark:text-amber-400">
                  {totalShelfUnidades.toLocaleString('pt-BR')}
                </span>
                <span className="text-xs font-bold text-slate-500 uppercase">UN / CX</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Soma física de caixas e unidades descartadas
              </p>
            </div>

            {/* KPI 3: Lotes / Registros de Despejo */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Lotes / Ocorrências
                </span>
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black font-mono text-blue-600 dark:text-blue-400">
                  {totalShelfRegistros}
                </span>
                <span className="text-xs font-bold text-slate-500 uppercase">Lotes</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Operações de descarte registradas no sistema
              </p>
            </div>

            {/* KPI 4: SKU Mais Impactado */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  SKU Mais Impactado
                </span>
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="truncate">
                <span className="text-sm font-black text-slate-900 dark:text-slate-100 truncate block">
                  {rankingSkusVencidos[0]?.desc || 'Nenhum'}
                </span>
                <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
                  {rankingSkusVencidos[0] ? `${rankingSkusVencidos[0].hl.toFixed(4)} HL (${rankingSkusVencidos[0].caixas} UN)` : '—'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 truncate">
                {rankingSkusVencidos[0] ? `Cód: ${rankingSkusVencidos[0].cod} • ${rankingSkusVencidos[0].emb}` : 'Sem ocorrências'}
              </p>
            </div>

          </div>

          {/* BARRA DE FILTROS DA GUIA SHELF */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              
              {/* Busca por SKU / Causa */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar produto por nome, código, causa raiz ou operador..."
                  value={shelfSearch}
                  onChange={e => {
                    setShelfSearch(e.target.value);
                    setShelfPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-none focus:border-amber-500 dark:text-white"
                />
              </div>

              {/* Filtros Dropdowns */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Filtro Causa Raiz */}
                <select
                  value={shelfFilterCausa}
                  onChange={e => {
                    setShelfFilterCausa(e.target.value);
                    setShelfPage(1);
                  }}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none cursor-pointer text-slate-700 dark:text-slate-300"
                >
                  <option value="todos">Todas as Causas de Vencimento</option>
                  <option value="Giro Lento / Excesso de Estoque">Giro Lento / Excesso de Estoque</option>
                  <option value="Falha de Giro / FEFO Invertido">Falha de Giro / FEFO Invertido</option>
                  <option value="Retorno de Rota Vencido">Retorno de Rota Vencido</option>
                  <option value="Validade Expirada no Armazém">Validade Expirada no Armazém</option>
                  <option value="Avaria com Perda de Validade">Avaria com Perda de Validade</option>
                </select>

                {/* Filtro Embalagem */}
                <select
                  value={shelfFilterEmbalagem}
                  onChange={e => {
                    setShelfFilterEmbalagem(e.target.value);
                    setShelfPage(1);
                  }}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none cursor-pointer text-slate-700 dark:text-slate-300"
                >
                  <option value="todos">Todas as Embalagens</option>
                  {Object.keys(DEFAULT_EMBALAGENS_CONFIG).map(emb => (
                    <option key={emb} value={emb}>{emb}</option>
                  ))}
                </select>

                {(shelfSearch || shelfFilterCausa !== 'todos' || shelfFilterEmbalagem !== 'todos') && (
                  <button
                    onClick={() => {
                      setShelfSearch('');
                      setShelfFilterCausa('todos');
                      setShelfFilterEmbalagem('todos');
                      setShelfPage(1);
                    }}
                    className="px-2.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900 transition-colors"
                  >
                    Limpar Filtros
                  </button>
                )}
              </div>

            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-gray-100 dark:border-slate-800">
              <span>Exibindo <strong>{filteredShelfRows.length}</strong> registros analisados de produtos vencidos</span>
              <span>Volume acumulado filtrado: <strong className="text-purple-600 dark:text-purple-400">{totalShelfHL.toFixed(4)} HL</strong> ({totalShelfUnidades} UN)</span>
            </div>
          </div>

          {/* GRIDS DE ANÁLISE VISUAL (PARETO DE SKUS + CAUSA RAIZ) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* GRÁFICO 1: PARETO DOS SKUS MAIS VENCIDOS */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                      Top SKUs Vencidos na Operação (Pareto HL)
                    </h3>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400">Produtos com maior perda volumétrica por prazo expirado</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-orange-600 bg-orange-50 dark:bg-orange-950/40 px-2.5 py-1 rounded-full border border-orange-200 dark:border-orange-800">
                  Ranking DPO
                </span>
              </div>

              {rankingSkusVencidos.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-400">
                  Nenhum produto vencido encontrado com os filtros atuais.
                </div>
              ) : (
                <div className="space-y-3">
                  {rankingSkusVencidos.slice(0, 6).map((item, idx) => {
                    const pctVolume = totalShelfHL > 0 ? (item.hl / totalShelfHL) * 100 : 0;
                    return (
                      <div 
                        key={idx} 
                        className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-gray-200 dark:border-slate-700/60 space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2.5">
                            <span className="w-6 h-6 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 font-black text-xs flex items-center justify-center">
                              #{idx + 1}
                            </span>
                            <div>
                              <div className="font-bold text-slate-900 dark:text-slate-100">
                                {item.desc}
                              </div>
                              <div className="text-[10px] text-gray-500 dark:text-slate-400 flex items-center gap-2">
                                <span>Cód: {item.cod}</span>
                                <span>•</span>
                                <span>{item.emb}</span>
                                <span>•</span>
                                <span>{item.registros} descartes</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right font-mono">
                            <div className="font-black text-purple-600 dark:text-purple-400">
                              {item.hl.toFixed(4)} HL
                            </div>
                            <div className="text-[10px] text-gray-400 font-bold">
                              {item.caixas} UN ({pctVolume.toFixed(1)}% das perdas)
                            </div>
                          </div>
                        </div>

                        {/* Barra de Progresso Pareto */}
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all"
                            style={{ width: `${Math.min(100, Math.max(8, pctVolume))}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* GRÁFICO 2: DISTRIBUIÇÃO POR CAUSA RAIZ DE VENCIMENTO */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                    <PieIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                      Causas Raiz de Vencimento
                    </h3>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400">Diagnóstico de fatores operacionais que levaram ao descarte</p>
                  </div>
                </div>
              </div>

              {chartCausasVencimento.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-400">
                  Nenhum dado para exibir no gráfico.
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#0f172a', 
                            borderColor: '#334155', 
                            borderRadius: '12px', 
                            color: '#fff', 
                            fontSize: '12px', 
                            padding: '8px 12px' 
                          }}
                          formatter={(val: any, name: string) => [`${val} registros`, name]}
                        />
                        <Pie
                          data={chartCausasVencimento}
                          dataKey="registros"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={70}
                          paddingAngle={3}
                        >
                          {chartCausasVencimento.map((entry, idx) => (
                            <Cell key={`cell-${idx}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Legenda Detalhada das Causas */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-gray-100 dark:border-slate-800">
                    {chartCausasVencimento.map((c, idx) => {
                      const pct = totalShelfRegistros > 0 ? ((c.registros / totalShelfRegistros) * 100).toFixed(1) : '0';
                      return (
                        <div key={idx} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 truncate">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                            <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{c.name}</span>
                          </div>
                          <span className="font-mono font-black text-slate-900 dark:text-slate-100 shrink-0 ml-2">
                            {pct}% ({c.hl.toFixed(1)} HL)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* GRÁFICO 3: EVOLUÇÃO MENSAL E IMPACTO POR EMBALAGEM */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* EVOLUÇÃO MENSAL DE DESCARTE POR VALIDADE (2 COLS) */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                    Evolução Mensal de Vencimento (Registros e Hectolitros)
                  </h3>
                </div>
              </div>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartShelfMensal} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                    <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#0f172a', 
                        borderColor: '#334155', 
                        borderRadius: '12px', 
                        color: '#fff', 
                        fontSize: '12px', 
                        padding: '10px 14px'
                      }}
                      formatter={(val: any, name: string) => [val, name === 'registros' ? 'Lotes Vencidos' : 'Volume (HL)']} 
                    />
                    <Bar dataKey="registros" fill="#f97316" name="registros" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="hl" fill="#8b5cf6" name="hl" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* PERDAS POR TIPO DE EMBALAGEM (1 COL) */}
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Box className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                  Perdas por Embalagem
                </h3>
              </div>

              <div className="space-y-2">
                {chartShelfEmbalagens.slice(0, 5).map((emb, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-gray-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-slate-100">{emb.name}</div>
                      <div className="text-[10px] text-gray-500 dark:text-slate-400">{emb.registros} descartes ({emb.caixas} UN)</div>
                    </div>
                    <span className="font-mono font-black text-purple-600 dark:text-purple-400">
                      {emb.hl.toFixed(4)} HL
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* TABELA ANALÍTICA DE PRODUTOS VENCIDOS */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                  Registros Detalhados de Vencimento no Despejo
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-slate-400">Histórico completo de auditoria e tratativas de lotes vencidos</p>
              </div>
              <span className="text-xs font-bold text-slate-500">
                Página {shelfPage} de {Math.max(1, Math.ceil(filteredShelfRows.length / shelfItemsPerPage))}
              </span>
            </div>

            {filteredShelfRows.length === 0 ? (
              <div className="p-12 text-center text-xs text-gray-400">
                Nenhum registro de vencimento encontrado com os parâmetros informados.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/70 border-b border-gray-200 dark:border-slate-800 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="p-3">Data / Mês</th>
                      <th className="p-3">Código</th>
                      <th className="p-3">Descrição do Produto</th>
                      <th className="p-3">Embalagem</th>
                      <th className="p-3 text-right">Qtd (UN)</th>
                      <th className="p-3 text-right">Volume (HL)</th>
                      <th className="p-3">Causa / Motivo</th>
                      <th className="p-3">Área / Origem</th>
                      <th className="p-3">Responsável</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
                    {filteredShelfRows
                      .slice((shelfPage - 1) * shelfItemsPerPage, shelfPage * shelfItemsPerPage)
                      .map((r, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="p-3 font-mono text-[11px]">
                            <div>{r.data}</div>
                            <div className="text-[9px] text-gray-400">{r.mes}</div>
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                            {r.codProduto || '—'}
                          </td>
                          <td className="p-3 font-bold text-slate-900 dark:text-slate-100 max-w-[220px] truncate" title={r.descricao}>
                            <div>{r.descricao}</div>
                            {r.observacao && r.observacao !== '—' && (
                              <div className="text-[10px] text-slate-400 font-normal truncate">{r.observacao}</div>
                            )}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold">
                              {r.embalagem}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                            {r.unidades}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-purple-600 dark:text-purple-400">
                            {r.hlCalculado.toFixed(4)} HL
                          </td>
                          <td className="p-3">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${r.causaBg}`}>
                              {r.causaRaiz}
                            </span>
                          </td>
                          <td className="p-3 text-xs text-slate-800 dark:text-slate-200">
                            <div className="font-semibold">{r.area}</div>
                            <div className="text-[9px] text-gray-400">Módulo Quebras</div>
                          </td>
                          <td className="p-3 text-xs text-slate-700 dark:text-slate-300">
                            {r.operador || '—'}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Paginação */}
            {filteredShelfRows.length > shelfItemsPerPage && (
              <div className="p-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Mostrando {((shelfPage - 1) * shelfItemsPerPage) + 1} até {Math.min(shelfPage * shelfItemsPerPage, filteredShelfRows.length)} de {filteredShelfRows.length} registros
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShelfPage(p => Math.max(1, p - 1))}
                    disabled={shelfPage === 1}
                    className="p-1.5 rounded-lg border border-gray-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold font-mono px-2">
                    {shelfPage} / {Math.ceil(filteredShelfRows.length / shelfItemsPerPage)}
                  </span>
                  <button
                    onClick={() => setShelfPage(p => Math.min(Math.ceil(filteredShelfRows.length / shelfItemsPerPage), p + 1))}
                    disabled={shelfPage === Math.ceil(filteredShelfRows.length / shelfItemsPerPage)}
                    className="p-1.5 rounded-lg border border-gray-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* MATRIZ DE PLANO DE CONTENÇÃO & AÇÕES PREVENTIVAS DPO */}
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                  Plano DPO de Prevenção e Redução de Vencimentos (Shelf Life)
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-slate-400">Diretrizes operacionais padronizadas para mitigar descartes por validade</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              
              <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 space-y-2">
                <div className="flex items-center gap-2 font-black text-xs text-blue-700 dark:text-blue-400 uppercase">
                  <span>1. Auditoria Diária de FEFO</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  Conferência física diária de 100% dos lotes no picking e pulmão aéreo para garantir giro do lote mais antigo primeiro.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 space-y-2">
                <div className="flex items-center gap-2 font-black text-xs text-amber-700 dark:text-amber-400 uppercase">
                  <span>2. Escoamento Crítico (&lt;45d)</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  Acionamento preventivo da equipe comercial e trade para priorização de vendas e campanhas de escoamento acelerado.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-900/40 bg-purple-50/50 dark:bg-purple-950/20 space-y-2">
                <div className="flex items-center gap-2 font-black text-xs text-purple-700 dark:text-purple-400 uppercase">
                  <span>3. Gestão Visual de Lotes</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  Etiquetagem com tarja colorida em paletes com shelf reduzido para alertar operadores e empilhadores na puxada.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-2">
                <div className="flex items-center gap-2 font-black text-xs text-emerald-700 dark:text-emerald-400 uppercase">
                  <span>4. Tratativa Ágil de Rotas</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  Triagem e reendereçamento imediato de produtos retornados de rota no mesmo dia do desembarque.
                </p>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* SUB TAB: QUADRO DE AÇÕES DPO (DESPEJO) */}
      {activeSubTab === 'acoes' && (
        <QuadroAcoesDpo
          user={user}
          empresa={empresa}
          theme={theme}
          processoFilter="Despejo"
          title="Quadro de Ações — Despejo & Descarte"
          subtitle="Planos de ação, contramedidas 5W2H e tratativas com cronograma de início e término."
          onBack={() => setActiveSubTab('produtividade')}
        />
      )}

      {/* SUB TAB: QUADRO DE AÇÕES A3 */}
      {activeSubTab === 'boarda3' && (
        <div className="space-y-6">
          <A3BoardComponent
            user={user}
            empresa={empresa}
            dashboard="despejo"
          />
        </div>
      )}

      {/* SUB TAB: LICENÇAS E RECIBOS DE DESCARTE (SUDEMA) */}
      {activeSubTab === 'licencas' && (
        <div className="animate-fadeIn">
          <LicencasDescarteSection theme={theme} />
        </div>
      )}

      {/* MODAL CENTRAL DE LICENÇAS E RECIBOS DE DESCARTE */}
      <LicencasDescarteModal
        isOpen={isLicencasModalOpen}
        onClose={() => setIsLicencasModalOpen(false)}
        theme={theme}
      />

      {/* POP MODAL */}
      <PadraoOperacionalModal
        isOpen={isPopModalOpen}
        onClose={() => setIsPopModalOpen(false)}
        user={user}
        moduleKey="despejo"
        moduleName="Despejo e Descarte"
      />

      {/* DEDICATED ACTION MODAL (FILTERED EXCLUSIVELY FOR DESPEJO) */}
      <IndicatorActionModal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        indicatorTitle="Despejo"
        indicatorSubtitle="Visualizando e gerenciando apenas os planos de ação e contramedidas 5W2H do setor de Despejo."
        indicatorBadge="DESPEJO DPO"
        allowedProcessos={['Despejo']}
        defaultProcesso="Despejo"
        defaultIndicador="Produtividade e Agilidade de Despejo (un/h)"
        defaultMeta={`${metaProdutividadeCxH} un/h`}
        user={user}
      />

      {/* MODAL: NOVO REGISTRO DE DESPEJO COM CRONÔMETRO */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-[110] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-fade-in">
            
            <div className="p-5 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Droplet className="w-5 h-5" />
                <h3 className="font-black text-base uppercase tracking-wide">Novo Registro de Despejo</h3>
              </div>
              <button 
                onClick={() => {
                  setIsRegisterModalOpen(false);
                  setIsStopwatchRunning(false);
                  setStopwatchSeconds(0);
                }}
                className="p-1 hover:bg-white/20 rounded-lg text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRecord} className="p-6 space-y-4 text-xs">
              
              {/* LIVE STOPWATCH BOX */}
              <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl border border-gray-200 dark:border-slate-700 text-center space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-slate-400">
                  Cronometragem da Operação
                </span>
                <div className="text-3xl font-black font-mono text-blue-600 dark:text-blue-400">
                  {toHMS(stopwatchSeconds)}
                </div>
                <div className="flex items-center justify-center gap-2 pt-1">
                  {!isStopwatchRunning ? (
                    <button
                      type="button"
                      onClick={() => setIsStopwatchRunning(true)}
                      className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-sm"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Iniciar Cronômetro</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsStopwatchRunning(false)}
                      className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-sm"
                    >
                      <Pause className="w-3.5 h-3.5" />
                      <span>Pausar</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setIsStopwatchRunning(false);
                      setStopwatchSeconds(0);
                    }}
                    className="px-3 py-1.5 bg-gray-200 dark:bg-slate-700 hover:bg-gray-300 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Zerar</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase block mb-1">
                    Operador Responsável
                  </label>
                  <select
                    value={newOperador}
                    onChange={(e) => setNewOperador(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-blue-500"
                  >
                    {distinctOperadores.map(op => (
                      <option key={op} value={op}>{op}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase block mb-1">
                    Embalagem
                  </label>
                  <select
                    value={newEmbalagem}
                    onChange={(e) => setNewEmbalagem(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-blue-500"
                  >
                    {embalagensList.map(emb => (
                      <option key={emb} value={emb}>{emb}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase block mb-1">
                  Quantidade de Unidades (UN)
                </label>
                <input
                  type="number"
                  min={1}
                  value={newQuantidade}
                  onChange={(e) => setNewQuantidade(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900/60 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-slate-400">Meta Unidade ({newEmbalagem}):</span>
                  <span className="font-bold font-mono">{toHMS(embalagensConfig[newEmbalagem]?.metaSec || 50)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-slate-400">Tempo Limite Total ({newQuantidade} UN):</span>
                  <span className="font-bold font-mono text-blue-600 dark:text-blue-400">
                    {toHMS((embalagensConfig[newEmbalagem]?.metaSec || 50) * newQuantidade)}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase block mb-1">
                  Justificativa / Motivo (Obrigatório se exceder a meta)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Canaleta entupida ou garra manual com folga"
                  value={newMotivoFalha}
                  onChange={(e) => setNewMotivoFalha(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold rounded-xl text-xs hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl text-xs shadow-md"
                >
                  Salvar Registro
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
