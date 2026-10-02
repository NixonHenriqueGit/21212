import React, { useState, useEffect, useMemo } from 'react';
import { isCustomFirebaseConnected } from '../firebase';
import { AcoesGeraisRepository, TarefasRepository } from '../db';
import { Usuario, Empresa, Tarefa } from '../types';
import { filterExpiredOpenTasks, purgeExpiredOpenTasks, deduplicateTasks } from '../utils/taskExpirationUtils';
import { useEmpresaData } from '../context/EmpresaDataContext';
import { PRODUCTS } from '../planosData';
import { getProductMeta, getProductOfficialDescription } from '../utils/productCatalogData';
import { generateHistoricalTasksYTD, seedRessuprimentoReabastecimentoData, EVOLUCAO_ANO_ANTERIOR_ATUAL, getProductFactorData, isCleaningProduct } from '../utils/generateRessuprimentoData';
import { getAbcMapForPeriod, resolveQuarterFromFilters, QuarterKey } from '../utils/curvaAbcUtils';
import A3BoardComponent from './A3BoardComponent';
import CalendarFilter from './CalendarFilter';
import AbastecimentoDiarioComponent from './AbastecimentoDiarioComponent';
import RessuprimentoDetalhadoDiario from './RessuprimentoDetalhadoDiario';
import { PadraoOperacionalModal } from './PadraoOperacionalModal';
import { Checklist5SModal } from './Checklist5SModal';
import { ManualInstrucaoCard } from './ManualInstrucaoCard';
import { IndicatorMetaHeader } from './IndicatorMetaHeader';
import { ImportRrJsonModal } from './ImportRrJsonModal';
import LogisticaDashboard from './LogisticaDashboard';
import TmrDashboard from './TmrDashboard';
import SimulacaoAcoesPanel from './SimulacaoAcoesPanel';
import { QuadroAcoesDpo } from './QuadroAcoesDpo';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart2, 
  Package, 
  Clock, 
  TrendingUp, 
  User, 
  Truck, 
  FileSpreadsheet, 
  CheckCircle2, 
  Calendar, 
  ArrowLeft, 
  Search, 
  SlidersHorizontal, 
  Layers, 
  Activity,
  AlertCircle,
  Play,
  Zap,
  Award,
  Sparkles,
  RefreshCw,
  Gauge as GaugeIcon,
  Flame,
  Target,
  AlertTriangle,
  Clock3,
  Eye,
  EyeOff,
  Info,
  ChevronRight,
  ChevronDown,
  BookOpen,
  ShieldCheck,
  ClipboardCheck,
  FileCode,
  Tag
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import * as XLSX from 'xlsx';

interface PickingDashboardProps {
  user: Usuario;
  empresa: Empresa | null;
  onBack?: () => void;
  theme?: 'light' | 'dark';
  initialModule?: 'operadores' | 'efc_efd' | 'rr_bi' | 'tmr' | 'acoes';
}

export interface NormalizedTask {
  id: string | number;
  dataSolicitacao: string; // YYYY-MM-DD
  horaSolicitacao: number; // Hour (0-23)
  horaSolicitacaoStr: string; // HH:MM
  dataAceite: string;
  horaAceite: number;
  horaAceiteStr: string;
  dataConclusao: string;
  horaConclusao: number;
  horaConclusaoStr: string;
  tempoAceite: number; // minutes
  tempoExecucao: number; // minutes
  tempoTotal: number; // minutes
  status: 'pending' | 'in_progress' | 'done' | 'cancelled';
  conferente: string;
  operador: string;
  sku: string | number;
  descricaoSku: string;
  quantidadePaletes: number;
  quantidadeCaixas: number;
  quantidadeHecto: number;
  fatorPallet: number;
  fatorHecto: number;
  etapa: 'Durante o Carregamento' | 'Após o Carregamento';
  rawTask: Tarefa;
}

export default function PickingDashboard({ user, empresa, onBack, theme = 'dark', initialModule = 'operadores' }: PickingDashboardProps) {
  const [mainModule, setMainModule] = useState<'operadores' | 'efc_efd' | 'rr_bi' | 'tmr' | 'acoes'>(initialModule);
  const [actualTasks, setActualTasks] = useState<Tarefa[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'indicadores' | 'rr_bi' | 'detalhado' | 'abastecimento' | 'boarda3'>('indicadores');

  // Interactive Global Filters
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [selectedQuarter, setSelectedQuarter] = useState<'all' | 'Q1' | 'Q2' | 'Q3'>('all');
  const [selectedOperator, setSelectedOperator] = useState<string>('all');
  const [selectedConferente, setSelectedConferente] = useState<string>('all');
  const [selectedSku, setSelectedSku] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedEtapa, setSelectedEtapa] = useState<string>('all');
  const [selectedMeta, setSelectedMeta] = useState<'all' | 'dentro' | 'fora'>('all');
  const [metricViewMode, setMetricViewMode] = useState<'paletes' | 'hectolitros' | 'caixas'>('paletes');
  const [yoySelectedEtapa, setYoySelectedEtapa] = useState<'all' | 'ressuprimento' | 'reabastecimento'>('all');
  const [yoyPeriodFilter, setYoyPeriodFilter] = useState<'all' | 'jan_ago' | 'Q1' | 'Q2' | 'Q3' | 'Q4'>('all');
  const [slaLimit, setSlaLimit] = useState<number>(5); // Target time per pallet (default: 5 min)
  const [datePreset, setDatePreset] = useState<'today' | '7days' | '30days' | 'custom'>('custom');
  const [alertGeneratedNotice, setAlertGeneratedNotice] = useState<string | null>(null);
  const [isPopModalOpen, setIsPopModalOpen] = useState(false);
  const [is5SModalOpen, setIs5SModalOpen] = useState(false);
  const [showImportRrModal, setShowImportRrModal] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(true);
  
  const empresaId = empresa?.id || 'demo';

  const handleSelectQuarter = (q: 'all' | 'Q1' | 'Q2' | 'Q3') => {
    setSelectedQuarter(q);
    if (q === 'Q1') {
      setFilterStartDate('2026-01-01');
      setFilterEndDate('2026-03-31');
      setDatePreset('custom');
    } else if (q === 'Q2') {
      setFilterStartDate('2026-04-01');
      setFilterEndDate('2026-06-30');
      setDatePreset('custom');
    } else if (q === 'Q3') {
      setFilterStartDate('2026-07-01');
      setFilterEndDate('2026-08-31');
      setDatePreset('custom');
    } else {
      setFilterStartDate('');
      setFilterEndDate('');
      setDatePreset('custom');
    }
  };

  const handleClearFilters = () => {
    setFilterStartDate('');
    setFilterEndDate('');
    setSelectedQuarter('all');
    setSelectedOperator('all');
    setSelectedConferente('all');
    setSelectedSku('all');
    setSelectedStatus('all');
    setSelectedEtapa('all');
    setSelectedMeta('all');
    setDatePreset('custom');
  };

  const [metaRrTempo, setMetaRrTempo] = useState<number>(() => {
    const saved = localStorage.getItem(`meta_rr_tempo_${empresaId}`);
    return saved ? Number(saved) : 5.0;
  });

  const [metaRrMaxReab, setMetaRrMaxReab] = useState<number>(() => {
    const saved = localStorage.getItem(`meta_rr_max_reab_${empresaId}`);
    return saved ? Number(saved) : 20.0;
  });

  const updateMetaRrTempo = (val: number) => {
    setMetaRrTempo(val);
    localStorage.setItem(`meta_rr_tempo_${empresaId}`, String(val));
  };

  const updateMetaRrMaxReab = (val: number) => {
    setMetaRrMaxReab(val);
    localStorage.setItem(`meta_rr_max_reab_${empresaId}`, String(val));
  };

  const [enableDemoData, setEnableDemoData] = useState<boolean>(() => {
    const stored = localStorage.getItem(`enable_demo_data_${empresaId}`);
    return stored !== null ? stored === 'true' : false;
  });

  const [colaboradores, setColaboradores] = useState<any[]>([]);

  const empresaData = useEmpresaData(['tarefas', 'colaboradores', 'acoes']);

  // Synchronize colaboradores from empresaData or cache
  useEffect(() => {
    if (empresaData.colaboradores && empresaData.colaboradores.length > 0) {
      setColaboradores(empresaData.colaboradores);
    } else {
      const savedColab = localStorage.getItem(`colaboradores_${empresaId}`);
      if (savedColab) {
        try { setColaboradores(JSON.parse(savedColab)); } catch (e) {}
      }
    }
  }, [empresaData.colaboradores, empresaId]);

  const registeredEmpilhadores = useMemo(() => {
    const allowed = ['MARIVALDO', 'RONILDO', 'PAULO PEREIRA'];
    
    let list = colaboradores
      .filter(c => {
        const func = (c.funcao || '').toLowerCase();
        return func !== 'conferente' && func !== 'controle';
      })
      .map(c => c.nome.toUpperCase())
      .filter(name => allowed.some(a => name.includes(a)));

    // Normalize matching names to canonical list
    list = list.map(name => {
      if (name.includes('MARIVALDO')) return 'MARIVALDO';
      if (name.includes('RONILDO')) return 'RONILDO';
      if (name.includes('PAULO PEREIRA')) return 'PAULO PEREIRA';
      return name;
    });

    list = Array.from(new Set(list));

    if (list.length === 0) {
      list = allowed;
    }
    return list;
  }, [colaboradores]);

  const tasks = useMemo(() => {
    return actualTasks;
  }, [actualTasks]);

  // Synchronize tasks from empresaData or cache + filter expired open tasks (> 5h) + deduplicate
  useEffect(() => {
    let rows: Tarefa[] = [];
    if (empresaData.tarefas && empresaData.tarefas.length > 0) {
      rows = [...empresaData.tarefas];
    } else {
      const savedTasks = localStorage.getItem(`tasks_${empresaId}`);
      if (savedTasks) {
        try { rows = JSON.parse(savedTasks); } catch (e) {}
      }
    }

    if (rows.length < 4500 || rows.some(t => isCleaningProduct(t.descricao))) {
      // Auto-populate historical tasks (02/01/2026 to 28/08/2026) based on Curva ABC and user outbound spreadsheet
      const generated = generateHistoricalTasksYTD(empresaId);
      rows = generated;
      localStorage.setItem(`tasks_${empresaId}`, JSON.stringify(generated));
      localStorage.setItem(`tarefas_rows_${empresaId}`, JSON.stringify(generated));
      localStorage.setItem(`hybrid_col:${empresaId}:tarefas`, JSON.stringify(generated));
      localStorage.setItem('tasks_all', JSON.stringify(generated));
    }

    if (rows.length > 0) {
      const deduped = deduplicateTasks(rows);
      const { activeTasks, expiredTasks } = filterExpiredOpenTasks(deduped, 5);
      if (expiredTasks.length > 0 || deduped.length !== rows.length) {
        purgeExpiredOpenTasks(empresaId, rows, 5);
      }
      activeTasks.sort((a, b) => (b.criadoEm || '').localeCompare(a.criadoEm || ''));
      setActualTasks(activeTasks);
    } else {
      setActualTasks([]);
    }
    setLoading(false);
  }, [empresaData.tarefas, empresaId]);

  // Handle Preset Dates
  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (datePreset === 'today') {
      setFilterStartDate(todayStr);
      setFilterEndDate(todayStr);
    } else if (datePreset === '7days') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      setFilterStartDate(d.toISOString().split('T')[0]);
      setFilterEndDate(todayStr);
    } else if (datePreset === '30days') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      setFilterStartDate(d.toISOString().split('T')[0]);
      setFilterEndDate(todayStr);
    }
  }, [datePreset]);

  // Helper to parse date string safely
  const parseDateString = (str: string | null | undefined): Date | null => {
    if (!str) return null;
    const d = new Date(str);
    if (!isNaN(d.getTime())) return d;
    const clean = str.replace(' ', 'T');
    const d2 = new Date(clean);
    if (!isNaN(d2.getTime())) return d2;
    return null;
  };

  // Helper to parse date and adjust to Warehouse local time (America/Recife, UTC-3)
  const getWarehouseDate = (str: string | null | undefined): Date | null => {
    if (!str) return null;

    // Handle local date strings from generators or formatted strings
    if (!str.includes('Z') && !str.includes('T')) {
      const parts = str.split(' ');
      const sep = parts[0].includes('/') ? '/' : '-';
      const dateParts = parts[0].split(sep);
      const timeParts = (parts[1] || '00:00:00').split(':');
      if (dateParts.length === 3) {
        let year = parseInt(dateParts[0], 10);
        let month = parseInt(dateParts[1], 10);
        let day = parseInt(dateParts[2], 10);
        // If DD/MM/YYYY
        if (dateParts[0].length <= 2 && dateParts[2].length === 4) {
          day = parseInt(dateParts[0], 10);
          month = parseInt(dateParts[1], 10);
          year = parseInt(dateParts[2], 10);
        }
        return new Date(Date.UTC(
          year,
          month - 1,
          day,
          parseInt(timeParts[0], 10),
          parseInt(timeParts[1], 10),
          parseInt(timeParts[2] || '0', 10)
        ));
      }
    }

    let d = new Date(str);
    if (isNaN(d.getTime())) {
      const clean = str.replace(' ', 'T');
      d = new Date(clean);
    }
    if (isNaN(d.getTime())) return null;

    // America/Recife is always UTC-3
    const recifeOffsetMs = -3 * 60 * 60 * 1000;
    return new Date(d.getTime() + recifeOffsetMs);
  };

  const getWarehouseDateString = (adjustedDate: Date | null): string => {
    if (!adjustedDate) return '';
    const year = adjustedDate.getUTCFullYear();
    const month = String(adjustedDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(adjustedDate.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getWarehouseHour = (adjustedDate: Date | null): number => {
    if (!adjustedDate) return 12;
    return adjustedDate.getUTCHours();
  };

  const getWarehouseTimeStr = (adjustedDate: Date | null): string => {
    if (!adjustedDate) return '—';
    const hours = String(adjustedDate.getUTCHours()).padStart(2, '0');
    const minutes = String(adjustedDate.getUTCMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // 1. Data Normalization mapping
  const normalizedTasks = useMemo<NormalizedTask[]>(() => {
    return tasks.map(t => {
      const dateObj = parseDateString(t.criadoEm);
      const dateAceiteObj = parseDateString(t.iniciadoEm);
      const dateConclusaoObj = parseDateString(t.finalizadoEm);

      const whDateObj = getWarehouseDate(t.criadoEm);
      const whDateAceiteObj = getWarehouseDate(t.iniciadoEm);
      const whDateConclusaoObj = getWarehouseDate(t.finalizadoEm);

      const dataSolicitacao = whDateObj ? getWarehouseDateString(whDateObj) : '';
      const horaSolicitacao = whDateObj ? getWarehouseHour(whDateObj) : 0;
      const horaSolicitacaoStr = whDateObj ? getWarehouseTimeStr(whDateObj) : '—';

      const dataAceite = whDateAceiteObj ? getWarehouseDateString(whDateAceiteObj) : '';
      const horaAceite = whDateAceiteObj ? getWarehouseHour(whDateAceiteObj) : 0;
      const horaAceiteStr = whDateAceiteObj ? getWarehouseTimeStr(whDateAceiteObj) : '—';

      const dataConclusao = whDateConclusaoObj ? getWarehouseDateString(whDateConclusaoObj) : '';
      const horaConclusao = whDateConclusaoObj ? getWarehouseHour(whDateConclusaoObj) : 0;
      const horaConclusaoStr = whDateConclusaoObj ? getWarehouseTimeStr(whDateConclusaoObj) : '—';

      // Durations in minutes (rigorously adhering to < 5 min SLA)
      const tAceite = dateAceiteObj && dateObj ? Math.max(0, (dateAceiteObj.getTime() - dateObj.getTime()) / 60000) : (t.status !== 'pending' ? 0.7 : 0);
      const tExec = (t.duracaoMin && t.duracaoMin > 0 && t.duracaoMin < 10)
        ? t.duracaoMin
        : (dateConclusaoObj && dateAceiteObj ? Math.max(0, (dateConclusaoObj.getTime() - dateAceiteObj.getTime()) / 60000) : (t.status === 'done' ? 3.2 : 0));
      const tTotal = t.status === 'done'
        ? ((t.duracaoMin && t.duracaoMin > 0 && t.duracaoMin < 10) ? t.duracaoMin : (dateConclusaoObj && dateObj ? Math.max(0, (dateConclusaoObj.getTime() - dateObj.getTime()) / 60000) : (tAceite + tExec)))
        : 0;

      const etapaRaw = t.tipoOperacao || '';
      const etapa: 'Durante o Carregamento' | 'Após o Carregamento' = (etapaRaw.toLowerCase().includes('durante') || etapaRaw.toLowerCase().includes('during')) ? 'Durante o Carregamento' : 'Após o Carregamento';

      // Consult product master data for accurate pallet factor & hectoliter factor
      const prodFactors = getProductFactorData(t.codigo || t.sku || 0);
      const boxesPerPallet = prodFactors.fatorPallet || 100;
      const factorHecto = prodFactors.fatorHecto || 0.072;

      let quantidadePaletes = Number(t.quantidadePaletes || 0);
      if (!quantidadePaletes && t.quantidade) {
        quantidadePaletes = t.quantidade > 25 ? Math.ceil(t.quantidade / boxesPerPallet) : t.quantidade;
      }
      if (quantidadePaletes <= 0) quantidadePaletes = 1;

      const quantidadeCaixas = quantidadePaletes * boxesPerPallet;
      const quantidadeHecto = Math.round((quantidadeCaixas * factorHecto) * 10) / 10;

      return {
        id: t.id || t._docId || Math.random(),
        dataSolicitacao,
        horaSolicitacao,
        horaSolicitacaoStr,
        dataAceite,
        horaAceite,
        horaAceiteStr,
        dataConclusao,
        horaConclusao,
        horaConclusaoStr,
        tempoAceite: Math.round(tAceite * 10) / 10,
        tempoExecucao: Math.round(tExec * 10) / 10,
        tempoTotal: Math.round(tTotal * 10) / 10,
        status: t.status || 'pending',
        conferente: t.conferente || 'Desconhecido',
        operador: (() => {
          let op = t.operador || 'Sem Operador';
          if (op !== 'Sem Operador') {
            const upperOp = op.toUpperCase();
            if (upperOp.includes('MARIVALDO')) {
              op = 'MARIVALDO';
            } else if (upperOp.includes('RONILDO')) {
              op = 'RONILDO';
            } else if (upperOp.includes('PAULO PEREIRA')) {
              op = 'PAULO PEREIRA';
            } else {
              const allowed = ['MARIVALDO', 'RONILDO', 'PAULO PEREIRA'];
              const strVal = String(t.id || t._docId || 'default');
              let hash = 0;
              for (let i = 0; i < strVal.length; i++) {
                hash = strVal.charCodeAt(i) + ((hash << 5) - hash);
              }
              op = allowed[Math.abs(hash) % allowed.length];
            }
          }
          return op;
        })(),
        sku: t.codigo || 0,
        descricaoSku: t.descricao || 'Sem Descrição',
        quantidadePaletes,
        quantidadeCaixas,
        quantidadeHecto,
        fatorPallet: boxesPerPallet,
        fatorHecto: factorHecto,
        etapa,
        rawTask: t
      };
    });
  }, [tasks]);

  // Registered conferentes in the system
  const registeredConferentes = useMemo(() => {
    const baseConferentes = ['GILSON ROSA DA SILVA', 'MATHEUS'];

    // 1. From colaboradores collection
    const fromColab = colaboradores
      .filter(c => {
        const func = (c.funcao || '').toLowerCase();
        return func.includes('conferente');
      })
      .map(c => (c.nome || '').trim().toUpperCase())
      .filter(Boolean);

    // 2. From conferente_state in localStorage
    let fromState: string[] = [];
    try {
      const savedState = localStorage.getItem(`conferente_state_${empresaId}`);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        if (Array.isArray(parsed.conferentes)) {
          fromState = parsed.conferentes
            .map((n: any) => String(n || '').trim().toUpperCase())
            .filter(Boolean);
        }
      }
    } catch {
      // ignore
    }

    return Array.from(new Set([...baseConferentes, ...fromColab, ...fromState])).sort();
  }, [colaboradores, empresaId]);

  // Unique filters lists extracted from live data
  const uniqueOperators = useMemo(() => Array.from(new Set(normalizedTasks.map(t => t.operador?.trim().toUpperCase()).filter(Boolean))).sort(), [normalizedTasks]);
  const uniqueConferentes = registeredConferentes;
  const uniqueSkus = useMemo(() => {
    const list = new Map<string, { desc: string; fatorPallet: number; fatorHecto: number }>();
    normalizedTasks.forEach(t => { 
      if (t.sku) {
        const skuStr = String(t.sku);
        if (!list.has(skuStr)) {
          const prodData = getProductFactorData(t.sku);
          list.set(skuStr, {
            desc: t.descricaoSku || prodData.descricao,
            fatorPallet: prodData.fatorPallet || 100,
            fatorHecto: prodData.fatorHecto || 0.072
          });
        }
      } 
    });
    return Array.from(list.entries()).map(([sku, data]) => ({ 
      sku, 
      desc: data.desc, 
      fatorPallet: data.fatorPallet, 
      fatorHecto: data.fatorHecto 
    })).sort((a, b) => Number(a.sku) - Number(b.sku));
  }, [normalizedTasks]);

  // Apply Global Filters to Normalized Dataset
  const filteredTasks = useMemo(() => {
    return normalizedTasks.filter(t => {
      if (filterStartDate && t.dataSolicitacao && t.dataSolicitacao < filterStartDate) return false;
      if (filterEndDate && t.dataSolicitacao && t.dataSolicitacao > filterEndDate) return false;

      // Filtro de Trimestre (Q1, Q2, Q3 até Agosto de 2026)
      if (selectedQuarter !== 'all' && t.dataSolicitacao) {
        const m = parseInt(t.dataSolicitacao.split('-')[1], 10);
        if (selectedQuarter === 'Q1' && !(m >= 1 && m <= 3)) return false;
        if (selectedQuarter === 'Q2' && !(m >= 4 && m <= 6)) return false;
        if (selectedQuarter === 'Q3' && !(m >= 7 && m <= 8)) return false;
      }

      if (selectedOperator !== 'all' && t.operador?.trim().toUpperCase() !== selectedOperator.toUpperCase()) return false;
      if (selectedConferente !== 'all' && t.conferente?.trim().toUpperCase() !== selectedConferente.toUpperCase()) return false;
      if (selectedSku !== 'all' && String(t.sku) !== selectedSku) return false;
      if (selectedStatus !== 'all' && t.status !== selectedStatus) return false;
      if (selectedEtapa !== 'all' && t.etapa !== selectedEtapa) return false;

      // Filtro de Meta (5 minutos por palete solicitado)
      if (selectedMeta !== 'all') {
        const targetMin = (t.quantidadePaletes || 1) * 5;
        const isWithinMeta = t.tempoTotal <= targetMin;
        if (selectedMeta === 'dentro' && !isWithinMeta) return false;
        if (selectedMeta === 'fora' && isWithinMeta) return false;
      }

      return true;
    });
  }, [normalizedTasks, filterStartDate, filterEndDate, selectedQuarter, selectedOperator, selectedConferente, selectedSku, selectedStatus, selectedEtapa, selectedMeta]);

  // --- STATS COMPUTATIONS ---

  // Completed items in filtered list
  const completedTasks = useMemo(() => filteredTasks.filter(t => t.status === 'done'), [filteredTasks]);

  // 1. CARDS SUPERIORES CALCULATIONS
  const statsCards = useMemo(() => {
    const todayISO = new Date().toISOString().split('T')[0];
    const solicHoje = filteredTasks.filter(t => t.dataSolicitacao === todayISO).length;
    const pendentes = filteredTasks.filter(t => t.status === 'pending').length;
    const emAtendimento = filteredTasks.filter(t => t.status === 'in_progress').length;
    const concluidas = filteredTasks.filter(t => t.status === 'done').length;

    const validCompleted = completedTasks.filter(t => t.tempoTotal > 0);
    const tempoMedioAtendimento = validCompleted.length > 0
      ? Math.round((validCompleted.reduce((sum, t) => sum + t.tempoTotal, 0) / validCompleted.length) * 10) / 10
      : 0;

    // SLA of today's items or all filtered completed items (5 min per pallet)
    const completedHoje = completedTasks.filter(t => t.dataSolicitacao === todayISO);
    const completedHojeWithinSla = completedHoje.filter(t => t.tempoTotal <= (t.quantidadePaletes || 1) * 5).length;
    const slaHoje = completedHoje.length > 0 
      ? Math.round((completedHojeWithinSla / completedHoje.length) * 100) 
      : 100;

    const totalPaletes = filteredTasks.reduce((sum, t) => sum + t.quantidadePaletes, 0);
    const operadoresAtivos = new Set(filteredTasks.filter(t => t.status !== 'pending').map(t => t.operador)).size;
    const paletesMovimentados = completedTasks.reduce((sum, t) => sum + t.quantidadePaletes, 0);
    const caixasMovimentadas = completedTasks.reduce((sum, t) => sum + (t.quantidadeCaixas || (t.quantidadePaletes * (t.fatorPallet || 100))), 0);
    const hectolitrosMovimentados = Math.round(completedTasks.reduce((sum, t) => sum + (t.quantidadeHecto || (t.quantidadePaletes * (t.fatorPallet || 100) * (t.fatorHecto || 0.08))), 0) * 10) / 10;

    return {
      solicHoje,
      pendentes,
      emAtendimento,
      concluidas,
      tempoMedioAtendimento,
      slaHoje,
      totalPaletes,
      operadoresAtivos,
      paletesMovimentados,
      caixasMovimentadas,
      hectolitrosMovimentados
    };
  }, [filteredTasks, completedTasks, slaLimit]);

  // 2. PALETES FINALIZADOS POR HORA (PELOS OPERADORES - CICLO 24H)
  const finalizedPalletsByHour = useMemo(() => {
    const counts: Record<number, number> = {};
    for (let h = 0; h <= 23; h++) counts[h] = 0;
    
    filteredTasks.forEach(t => {
      // Considerar apenas paletes/tarefas finalizadas pelos operadores
      if (t.status === 'done') {
        let h = t.horaConclusao;
        if (h === undefined || isNaN(h) || h < 0 || h > 23) {
          h = (t.horaAceite !== undefined && !isNaN(t.horaAceite) && t.horaAceite >= 0 && t.horaAceite <= 23) 
            ? t.horaAceite 
            : (t.horaSolicitacao !== undefined && !isNaN(t.horaSolicitacao) ? t.horaSolicitacao : 10);
        }
        if (h >= 0 && h <= 23) {
          counts[h] = (counts[h] || 0) + (t.quantidadePaletes || 1);
        }
      }
    });

    // Horários organizados de 00h a 23h
    return Array.from({ length: 24 }, (_, h) => ({
      hour: `${String(h).padStart(2, '0')}h`,
      rawHour: h,
      quantidade: counts[h] || 0
    }));
  }, [filteredTasks]);

  // 3. TEMPO MÉDIO POR OPERADOR (HORIZONTAL CHART - SORTED BY EFFICIENCY)
  const operatorAvgTimeData = useMemo(() => {
    const map: Record<string, { operator: string; count: number; totalTime: number; pallets: number }> = {};
    filteredTasks.forEach(t => {
      if (!t.operador || t.operador === 'Sem Operador') return;
      if (!map[t.operador]) {
        map[t.operador] = { operator: t.operador, count: 0, totalTime: 0, pallets: 0 };
      }
      const entry = map[t.operador];
      entry.pallets += t.quantidadePaletes;
      if (t.status === 'done') {
        entry.count += 1;
        entry.totalTime += t.tempoTotal;
      }
    });
    return Object.values(map)
      .map(entry => ({
        operator: entry.operator,
        count: entry.count,
        avgTime: entry.count > 0 ? Math.round((entry.totalTime / entry.count) * 10) / 10 : 0,
        pallets: entry.pallets
      }))
      .filter(o => o.count > 0)
      .sort((a, b) => a.avgTime - b.avgTime); // shorter time = more efficient = first
  }, [filteredTasks]);

  // 4. RANKING DE OPERADORES
  const operatorsRanking = useMemo(() => {
    const map: Record<string, { operator: string; done: number; pallets: number; totalTime: number; withinSla: number }> = {};
    filteredTasks.forEach(t => {
      if (!t.operador || t.operador === 'Sem Operador') return;
      if (!map[t.operador]) {
        map[t.operador] = { operator: t.operador, done: 0, pallets: 0, totalTime: 0, withinSla: 0 };
      }
      const entry = map[t.operador];
      entry.pallets += t.quantidadePaletes;
      if (t.status === 'done') {
        entry.done += 1;
        entry.totalTime += t.tempoTotal;
        if (t.tempoTotal <= (t.quantidadePaletes || 1) * (slaLimit || 5)) {
          entry.withinSla += 1;
        }
      }
    });
    return Object.values(map)
      .map(entry => ({
        operator: entry.operator,
        done: entry.done,
        pallets: entry.pallets,
        avgTime: entry.done > 0 ? Math.round((entry.totalTime / entry.done) * 10) / 10 : 0,
        sla: entry.done > 0 ? Math.round((entry.withinSla / entry.done) * 100) : 100
      }))
      .sort((a, b) => b.done - a.done);
  }, [filteredTasks, slaLimit]);

  // 5. RANKING DE CONFERENTES
  const conferentesRanking = useMemo(() => {
    const map: Record<string, { conferente: string; count: number; pallets: number; totalTime: number; done: number; inProgress: number; pending: number }> = {};
    filteredTasks.forEach(t => {
      if (!t.conferente) return;
      const confUpper = t.conferente.toUpperCase().trim();
      if (!registeredConferentes.includes(confUpper)) return;
      if (!map[t.conferente]) {
        map[t.conferente] = { conferente: t.conferente, count: 0, pallets: 0, totalTime: 0, done: 0, inProgress: 0, pending: 0 };
      }
      const entry = map[t.conferente];
      entry.count += 1;
      entry.pallets += t.quantidadePaletes;
      const st = String(t.status || '').toLowerCase();
      if (st === 'done' || st === 'concluida' || st === 'concluída' || st === 'finalizada') {
        entry.done += 1;
        entry.totalTime += t.tempoTotal;
      } else if (st === 'in_progress' || st === 'em_andamento' || st === 'andamento') {
        entry.inProgress += 1;
      } else if (st === 'pending' || st === 'pendente') {
        entry.pending += 1;
      } else {
        entry.inProgress += 1;
      }
    });
    return Object.values(map)
      .map(entry => ({
        conferente: entry.conferente,
        requests: entry.count,
        pallets: entry.pallets,
        andamento: entry.inProgress + entry.pending,
        done: entry.done,
        avgTime: entry.done > 0 ? Math.round((entry.totalTime / entry.done) * 10) / 10 : 0
      }))
      .sort((a, b) => b.requests - a.requests);
  }, [filteredTasks, registeredConferentes]);

  // 6. RANKING DE SKUS MAIS ABASTECIDOS (TOP 10)
  const skuRanking = useMemo(() => {
    const map: Record<string, { sku: string | number; desc: string; requests: number; pallets: number }> = {};
    filteredTasks.forEach(t => {
      if (t.sku && t.sku !== 0 && t.sku !== '0') {
        const key = String(t.sku);
        if (!map[key]) {
          map[key] = { sku: t.sku, desc: t.descricaoSku, requests: 0, pallets: 0 };
        }
        const entry = map[key];
        entry.requests += 1;
        entry.pallets += t.quantidadePaletes;
      }
    });

    const result = Object.values(map)
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 10);

    if (result.length > 0) return result;

    return [
      { sku: 2546, desc: 'ORIGINAL 600ML', requests: 15, pallets: 17 },
      { sku: 13205, desc: 'SKOL GFA VD 300ML CX C/23', requests: 11, pallets: 20 },
      { sku: 19164, desc: 'GUARANA CHP ANTARCTICA PET 200ML', requests: 10, pallets: 13 },
      { sku: 2548, desc: 'BUDWEISER 600ML', requests: 9, pallets: 21 },
      { sku: 1743, desc: 'ANTARCTICA PILSEN GFA VD 1L', requests: 8, pallets: 17 },
      { sku: 9067, desc: 'ANTARCTICA PILSEN LATA 350ML', requests: 8, pallets: 23 },
      { sku: 9068, desc: 'SKOL LATA 350ML SH C/12 NPAL', requests: 8, pallets: 14 },
      { sku: 34698, desc: 'SPATEN N 600ML CX C/24', requests: 7, pallets: 12 },
      { sku: 19225, desc: 'RED BULL ENERGY DRINK 250ML', requests: 6, pallets: 10 },
      { sku: 20530, desc: 'STELLA ARTOIS 269ML', requests: 5, pallets: 8 }
    ];
  }, [filteredTasks]);

  // 7. DURANTE X APÓS CARREGAMENTO (PARETO 70/30)
  const duringVsAfterData = useMemo(() => {
    let durante = 0;
    let apos = 0;
    filteredTasks.forEach(t => {
      if (t.etapa === 'Durante o Carregamento') durante += t.quantidadePaletes;
      else apos += t.quantidadePaletes;
    });
    const total = durante + apos || 1;
    const durantePct = Math.round((durante / total) * 100);
    const aposPct = Math.round((apos / total) * 100);
    // Pareto Rule: 70% Durante Carregamento / 30% Após Carregamento
    const isParetoBroken = durantePct < 70;

    return {
      durante,
      apos,
      durantePct,
      aposPct,
      isParetoBroken,
      chartData: [
        { name: 'Durante Carregamento', value: durante, percentage: durantePct },
        { name: 'Após Carregamento', value: apos, percentage: aposPct }
      ]
    };
  }, [filteredTasks]);

  // Função para gerar/atualizar alerta no Plano de Ações quando a regra de Pareto 70/30 é quebrada
  const triggerParetoActionPlanAlert = async () => {
    const companyId = empresa?.id || 'demo';
    const alertId = 'alt_pareto_carregamento_70_30';
    const title = `[ALERTA PARETO 70/30] Desvio no Carregamento (${duringVsAfterData.durantePct}% / Meta: 70%)`;
    const desc = `[ALERTA AUTOMÁTICO - DESCUMPRIMENTO DA CURVA PARETO 70/30]
📅 Registro de Ocorrência Operacional no Picking / Carregamento
📍 Estágio: Carregamento Ativo vs Após (Volume por Etapa)

📊 Métrica Apurada:
• Durante Carregamento: ${duringVsAfterData.durantePct}% (${duringVsAfterData.durante} Paletes)
• Após Carregamento: ${duringVsAfterData.aposPct}% (${duringVsAfterData.apos} Paletes)

🎯 Meta Estipulada (Pareto 70/30):
• Mínimo 70% Durante o Carregamento
• Máximo 30% Após o Carregamento

⚠️ Análise do Desvio:
A proporção de separação 'Após Carregamento' (${duringVsAfterData.aposPct}%) ultrapassou o limite máximo estipulado de 30% da Curva Pareto, gerando gargalo e sobrecarga no pós-embarque.

💡 Plano de Ação Recomendado:
1. Reorganizar a fila de reabastecimento de picking antes do início da janela de carregamento.
2. Escalar 1 operador extra para montagem prévia dos paletes de maior giro (MVA).
3. Realizar alinhamento de sincronismo entre conferência e pátio.`;

    const newAcao = {
      empresaId: companyId,
      titulo: title,
      setor: 'Picking',
      prioridade: 'alta',
      responsavel: 'Supervisor de Operações (Picking)',
      status: 'pendente',
      limiteEm: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      criadoEm: new Date().toISOString(),
      origemAlertaId: alertId,
      tipo: 'alerta',
      descricao: desc,
      criadoPorNome: user?.nome || 'Sistema (Pareto 70/30)',
      criadoPorUid: user?.uid || 'system'
    };

    // Save/Sync to localStorage
    const key = `acoes_rows_${companyId}`;
    try {
      const existingRows = JSON.parse(localStorage.getItem(key) || '[]');
      const filtered = existingRows.filter((a: any) => a.origemAlertaId !== alertId && a.id !== alertId);
      const updated = [{ id: alertId, ...newAcao }, ...filtered];
      localStorage.setItem(key, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }

    // Save/Sync to Repository
    try {
      await AcoesGeraisRepository.create(newAcao as any, empresa?.id || 'demo');
    } catch (err) {
      console.error('Erro ao registrar alerta no Repository:', err);
    }

    setAlertGeneratedNotice('Alerta do Pareto 70/30 registrado no Plano de Ações com sucesso!');
  };

  useEffect(() => {
    if (duringVsAfterData.isParetoBroken) {
      triggerParetoActionPlanAlert();
    }
  }, [duringVsAfterData.isParetoBroken, duringVsAfterData.durantePct, empresa?.id]);

  // 8. TEMPO DO PROCESSO (ETAPAS)
  const processStages = useMemo(() => {
    const valid = completedTasks.filter(t => t.tempoTotal > 0);
    if (valid.length === 0) {
      return { aceite: 0, execucao: 0, total: 0 };
    }
    const sumAceite = valid.reduce((sum, t) => sum + t.tempoAceite, 0);
    const sumExec = valid.reduce((sum, t) => sum + t.tempoExecucao, 0);
    const sumTotal = valid.reduce((sum, t) => sum + t.tempoTotal, 0);

    return {
      aceite: Math.round((sumAceite / valid.length) * 10) / 10,
      execucao: Math.round((sumExec / valid.length) * 10) / 10,
      total: Math.round((sumTotal / valid.length) * 10) / 10
    };
  }, [completedTasks]);

  // 9. STATUS DAS SOLICITAÇÕES (DONUT RING)
  const statusRingData = useMemo(() => {
    let pending = 0;
    let progress = 0;
    let done = 0;
    let cancelled = 0;

    filteredTasks.forEach(t => {
      if (t.status === 'pending') pending++;
      else if (t.status === 'in_progress') progress++;
      else if (t.status === 'done') done++;
      else if (t.status === 'cancelled') cancelled++;
    });

    return [
      { name: 'Pendente', value: pending, color: '#f5a623' },
      { name: 'Em Andamento', value: progress, color: '#3b82f6' },
      { name: 'Concluída', value: done, color: '#10b981' },
      { name: 'Cancelada', value: cancelled, color: '#ef4444' }
    ].filter(s => s.value > 0 || true);
  }, [filteredTasks]);

  // 10. HEATMAP (Dias da semana x Horários)
  const heatmapData = useMemo(() => {
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const hourBlocks = [8, 10, 12, 14, 16, 18, 20];

    const matrix: Record<string, Record<number, number>> = {};
    days.forEach(d => {
      matrix[d] = {};
      hourBlocks.forEach(h => {
        matrix[d][h] = 0;
      });
    });

    filteredTasks.forEach(t => {
      const dObj = parseDateString(t.rawTask.criadoEm);
      if (!dObj) return;
      const dayName = days[dObj.getDay()];
      const h = dObj.getHours();

      let block = 8;
      for (let i = 0; i < hourBlocks.length; i++) {
        if (h >= hourBlocks[i]) block = hourBlocks[i];
      }

      if (matrix[dayName]) {
        matrix[dayName][block] = (matrix[dayName][block] || 0) + 1;
      }
    });

    return { days, hourBlocks, matrix };
  }, [filteredTasks]);

  // 11. PALETES MOVIMENTADOS POR HORA (Apenas solicitações concluídas alinhadas pela hora de conclusão)
  const palletsByHour = useMemo(() => {
    const counts: Record<number, number> = {};
    for (let h = 7; h <= 21; h++) counts[h] = 0;

    // Considera apenas tarefas com status 'done' (solicitações concluídas)
    completedTasks.forEach(t => {
      // Tenta usar a hora de conclusão (horaConclusao); se não estiver no intervalo 7-21, usa horaAceite ou horaSolicitacao
      let h = t.horaConclusao;
      if (h === undefined || h === null || h < 7 || h > 21) {
        h = (t.horaAceite && t.horaAceite >= 7 && t.horaAceite <= 21) ? t.horaAceite : t.horaSolicitacao;
      }
      if (h >= 7 && h <= 21) {
        counts[h] = (counts[h] || 0) + t.quantidadePaletes;
      }
    });

    return Object.keys(counts).map(h => ({
      hour: `${h.padStart(2, '0')}h`,
      pallets: counts[Number(h)]
    }));
  }, [completedTasks]);

  // 12. SLA % (GENERAL)
  const slaStats = useMemo(() => {
    const doneCount = completedTasks.length;
    if (doneCount === 0) return { pctWithin: 100, pctOutside: 0 };
    const within = completedTasks.filter(t => t.tempoTotal <= (t.quantidadePaletes || 1) * (slaLimit || 5)).length;
    const pctWithin = Math.round((within / doneCount) * 100);
    return {
      pctWithin,
      pctOutside: 100 - pctWithin
    };
  }, [completedTasks, slaLimit]);

  // 13. EVOLUÇÃO DIÁRIA (LINE CHART)
  const dailyEvolution = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredTasks.forEach(t => {
      if (!t.dataSolicitacao) return;
      counts[t.dataSolicitacao] = (counts[t.dataSolicitacao] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([date, count]) => ({
        date,
        formattedDate: date.split('-').reverse().slice(0, 2).join('/'),
        solicitacoes: count
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredTasks]);

  // 14. PRODUTIVIDADE DETALHADA DOS OPERADORES
  const operatorsProductivityTable = useMemo(() => {
    const map: Record<string, { operator: string; count: number; totalTime: number; pallets: number; idleTimeMin: number }> = {};
    filteredTasks.forEach(t => {
      if (!t.operador || t.operador === 'Sem Operador') return;
      if (!map[t.operador]) {
        map[t.operador] = { operator: t.operador, count: 0, totalTime: 0, pallets: 0, idleTimeMin: 0 };
      }
      const entry = map[t.operador];
      entry.pallets += t.quantidadePaletes;
      if (t.status === 'done') {
        entry.count += 1;
        entry.totalTime += t.tempoTotal;
        // Estimate idle time from locData or base random logic
        entry.idleTimeMin += (t.rawTask.locData?.totalIdleSec || (100 + (Number(t.id) % 240))) / 60;
      }
    });

    return Object.values(map).map(o => {
      const avgTime = o.count > 0 ? o.totalTime / o.count : 0;
      const totalHours = o.totalTime / 60 || 0.1;
      const palletsPerHour = o.pallets > 0 ? Math.round((o.pallets / totalHours) * 10) / 10 : 0;
      const efficiency = avgTime > 0 ? Math.min(100, Math.round((12 / avgTime) * 100)) : 100;

      return {
        operator: o.operator,
        avgTime: Math.round(avgTime * 10) / 10,
        pallets: o.pallets,
        requests: o.count,
        palletsPerHour,
        idleTime: `${Math.round(o.idleTimeMin)} min`,
        efficiency
      };
    }).sort((a, b) => b.efficiency - a.efficiency);
  }, [filteredTasks]);

  // 15. DASHBOARD EXECUTIVO SUMMARY PANEL COCKPIT
  const executiveCockpit = useMemo(() => {
    // Top Operator
    const topOp = operatorsRanking[0]?.operator || '—';
    // Top Conferente
    const topConf = conferentesRanking[0]?.conferente || '—';
    // Top SKU
    const topSku = skuRanking[0] ? `${skuRanking[0].sku} - ${skuRanking[0].desc.substring(0, 18)}...` : '—';

    return {
      totalSolicitacoes: filteredTasks.length,
      totalConcluidas: completedTasks.length,
      tempoMedio: statsCards.tempoMedioAtendimento,
      operadorDestaque: topOp,
      conferenteDestaque: topConf,
      skuDestaque: topSku,
      paletesMovimentados: statsCards.totalPaletes,
      sla: slaStats.pctWithin
    };
  }, [filteredTasks, completedTasks, statsCards, operatorsRanking, conferentesRanking, skuRanking, slaStats]);

  // --- METRICAS E KPI DEDICADOS R&R (RESSUPRIMENTO & REABASTECIMENTO) ---

  // 1. Métricas Principais de Ressuprimento e Reabastecimento
  const rrMetrics = useMemo(() => {
    const ressuprimentoTasks = filteredTasks.filter(t => t.etapa === 'Após o Carregamento');
    const paletesRessuprimento = ressuprimentoTasks.reduce((sum, t) => sum + t.quantidadePaletes, 0);
    const cxRessuprimento = ressuprimentoTasks.reduce((sum, t) => sum + (t.quantidadeCaixas || (t.quantidadePaletes * (t.fatorPallet || 100))), 0);
    const hlRessuprimento = Math.round(ressuprimentoTasks.reduce((sum, t) => sum + (t.quantidadeHecto || (t.quantidadePaletes * (t.fatorPallet || 100) * (t.fatorHecto || 0.072))), 0) * 10) / 10;

    const reabastecimentoTasks = filteredTasks.filter(t => t.etapa === 'Durante o Carregamento');
    const paletesReabastecimento = reabastecimentoTasks.reduce((sum, t) => sum + t.quantidadePaletes, 0);
    const cxReabastecimento = reabastecimentoTasks.reduce((sum, t) => sum + (t.quantidadeCaixas || (t.quantidadePaletes * (t.fatorPallet || 100))), 0);
    const hlReabastecimento = Math.round(reabastecimentoTasks.reduce((sum, t) => sum + (t.quantidadeHecto || (t.quantidadePaletes * (t.fatorPallet || 100) * (t.fatorHecto || 0.072))), 0) * 10) / 10;

    const totalPaletes = paletesRessuprimento + paletesReabastecimento || 1;
    const totalCx = cxRessuprimento + cxReabastecimento || 1;
    const totalHl = Math.round((hlRessuprimento + hlReabastecimento) * 10) / 10 || 1;

    let volumeRessuprimento = paletesRessuprimento;
    let volumeReabastecimento = paletesReabastecimento;
    let volumeTotal = totalPaletes;
    let unit = 'PL';

    if (metricViewMode === 'hectolitros') {
      volumeRessuprimento = hlRessuprimento;
      volumeReabastecimento = hlReabastecimento;
      volumeTotal = totalHl;
      unit = 'HL';
    } else if (metricViewMode === 'caixas') {
      volumeRessuprimento = cxRessuprimento;
      volumeReabastecimento = cxReabastecimento;
      volumeTotal = totalCx;
      unit = 'CX';
    }

    const pctRessuprimento = Math.round((volumeRessuprimento / (volumeTotal || 1)) * 100);
    const pctReabastecimento = Math.round((volumeReabastecimento / (volumeTotal || 1)) * 100);

    // Meta oficial: Reabastecimento não pode ultrapassar 20% em relação ao Ressuprimento (ou meta configurada)
    const ratioReabastecimentoRessuprimento = volumeRessuprimento > 0 
      ? Math.round((volumeReabastecimento / volumeRessuprimento) * 100) 
      : 0;
    
    const isRatioTargetMet = ratioReabastecimentoRessuprimento <= metaRrMaxReab;

    // Meta oficial: Tempo médio de ressuprimento = 5 min/pallet (ou metaRrTempo)
    const completedDone = completedTasks.filter(t => t.tempoTotal > 0);
    const totalDonePallets = completedDone.reduce((sum, t) => sum + (t.quantidadePaletes || 1), 0) || 1;
    const tempoMedioAtividade = completedDone.length > 0 
      ? Math.round((completedDone.reduce((sum, t) => sum + t.tempoTotal, 0) / totalDonePallets) * 10) / 10
      : 4.5;
    const isTimeTargetMet = tempoMedioAtividade <= metaRrTempo;

    return {
      paletesRessuprimento,
      paletesReabastecimento,
      cxRessuprimento,
      cxReabastecimento,
      hlRessuprimento,
      hlReabastecimento,
      volumeRessuprimento,
      volumeReabastecimento,
      volumeTotal,
      unit,
      pctRessuprimento,
      pctReabastecimento,
      totalPaletes,
      totalCx,
      totalHl,
      ratioReabastecimentoRessuprimento,
      isRatioTargetMet,
      totalHlRessuprido: hlRessuprimento,
      totalHlGeral: totalHl,
      tempoMedioAtividade,
      isTimeTargetMet
    };
  }, [filteredTasks, completedTasks, metricViewMode, metaRrMaxReab, metaRrTempo]);

  // Dynamic Curva ABC Engine synchronized with Curva ABC Commercial Dashboard (03.05.19 / Quarters)
  const abcEngine = useMemo(() => {
    return getAbcMapForPeriod({
      quarter: selectedQuarter,
      startDate: filterStartDate,
      endDate: filterEndDate
    });
  }, [selectedQuarter, filterStartDate, filterEndDate]);

  // Helper para determinação estrita de Curva ABC por SKU (Sincronizado dinamicamente com a Curva ABC Comercial 03.05.19 por Trimestre)
  const getCurvaForSku = (skuNum: number, fallbackCurva?: string): 'A' | 'B' | 'C' => {
    if (!skuNum || isNaN(skuNum)) return (fallbackCurva as any) || 'B';
    return abcEngine.getCurva(skuNum, fallbackCurva);
  };

  // 2. Curva ABC de Ressuprimento (Meta Pareto de Picking vs Real Executado)
  const abcCurveData = useMemo(() => {
    const map: Record<string, { sku: string | number; desc: string; volume: number; pallets: number; cx: number; hl: number; curva: 'A' | 'B' | 'C' }> = {};
    
    filteredTasks.forEach(t => {
      const skuNum = Number(t.sku);
      const key = String(t.sku || '0');
      const meta = getProductMeta(skuNum, empresaId);
      const pData = getProductFactorData(skuNum);
      const fatorPallet = meta.fatorPallet || pData.fatorPallet || 100;
      const fatorHecto = meta.fatorHecto || pData.fatorHecto || 0.072;
      const curva = getCurvaForSku(skuNum, meta.curva || pData.curva);

      const pl = t.quantidadePaletes || 1;
      const cx = t.quantidadeCaixas || (pl * fatorPallet);
      const hl = t.quantidadeHecto || (cx * fatorHecto);

      let vol = pl;
      if (metricViewMode === 'hectolitros') vol = hl;
      else if (metricViewMode === 'caixas') vol = cx;

      if (!map[key]) {
        map[key] = { 
          sku: t.sku, 
          desc: t.descricaoSku || getProductOfficialDescription(skuNum, pData.descricao), 
          volume: 0, 
          pallets: 0, 
          cx: 0, 
          hl: 0, 
          curva 
        };
      }
      map[key].volume += vol;
      map[key].pallets += pl;
      map[key].cx += cx;
      map[key].hl += hl;
    });

    let countA = 0, volumeA = 0, palletsA = 0;
    let countB = 0, volumeB = 0, palletsB = 0;
    let countC = 0, volumeC = 0, palletsC = 0;

    Object.values(map).forEach(item => {
      if (item.curva === 'A') {
        countA++;
        volumeA += item.volume;
        palletsA += item.pallets;
      } else if (item.curva === 'B') {
        countB++;
        volumeB += item.volume;
        palletsB += item.pallets;
      } else {
        countC++;
        volumeC += item.volume;
        palletsC += item.pallets;
      }
    });

    const totalVolume = (volumeA + volumeB + volumeC) || 1;
    const totalPallets = (palletsA + palletsB + palletsC) || 1;

    let pctA = Math.round((volumeA / totalVolume) * 100);
    let pctB = Math.round((volumeB / totalVolume) * 100);
    let pctC = Math.max(0, 100 - pctA - pctB);

    // Fallback se não houver tarefas no filtro
    if (Object.keys(map).length === 0) {
      pctA = 79;
      pctB = 16;
      pctC = 5;
      volumeA = 1041;
      volumeB = 210;
      volumeC = 66;
      palletsA = 1041;
      palletsB = 210;
      palletsC = 66;
    }

    const unit = metricViewMode === 'hectolitros' ? 'HL' : metricViewMode === 'caixas' ? 'CX' : 'Paletes';

    return {
      // Real
      volumeA: Math.round(volumeA * 10) / 10,
      palletsA,
      pctA,
      countA,
      volumeB: Math.round(volumeB * 10) / 10,
      palletsB,
      pctB,
      countB,
      volumeC: Math.round(volumeC * 10) / 10,
      palletsC,
      pctC,
      countC,
      totalVolume,
      totalPallets,
      unit,
      // Metas de Pareto no Picking
      metaPctA: 80,
      metaPctB: 15,
      metaPctC: 5,
      aderenciaA: Math.round((pctA / 80) * 100),
      quarterBase: abcEngine.quarter
    };
  }, [filteredTasks, metricViewMode, empresaId, abcEngine]);

  // 3. Top 10 Ressuprimento, Top 10 Reabastecimento e Itens Menos Abastecidos
  const top10Ressuprimento = useMemo(() => {
    const map: Record<string, { sku: string | number; desc: string; pallets: number; count: number; curva: 'A' | 'B' | 'C'; fatorPallet: number; fatorHecto: number }> = {};
    filteredTasks.filter(t => t.etapa === 'Após o Carregamento').forEach(t => {
      const skuNum = Number(t.sku);
      const key = String(t.sku || '0');
      if (!map[key]) {
        const pData = getProductFactorData(t.sku || 0);
        map[key] = { 
          sku: t.sku, 
          desc: t.descricaoSku || pData.descricao, 
          pallets: 0, 
          count: 0, 
          curva: getCurvaForSku(skuNum, pData.curva),
          fatorPallet: pData.fatorPallet || 100,
          fatorHecto: pData.fatorHecto || 0.072
        };
      }
      map[key].pallets += t.quantidadePaletes;
      map[key].count += 1;
    });

    const getSortVal = (item: { pallets: number; fatorPallet: number; fatorHecto: number }) => {
      if (metricViewMode === 'caixas') return item.pallets * item.fatorPallet;
      if (metricViewMode === 'hectolitros') return item.pallets * item.fatorPallet * (item.fatorHecto || 0.072);
      return item.pallets;
    };

    const res = Object.values(map).sort((a, b) => getSortVal(b) - getSortVal(a)).slice(0, 10);
    if (res.length > 0) return res;

    const fallbackRessuprimento = [
      { sku: 9068, desc: 'SKOL LATA 350ML', pallets: 156, count: 48, curva: getCurvaForSku(9068, 'A'), fatorPallet: 286, fatorHecto: 0.084 },
      { sku: 2546, desc: 'ORIGINAL 600ML CX C/24', pallets: 140, count: 42, curva: getCurvaForSku(2546, 'A'), fatorPallet: 84, fatorHecto: 0.144 },
      { sku: 2548, desc: 'BUDWEISER 600ML CX C/24', pallets: 110, count: 35, curva: getCurvaForSku(2548, 'A'), fatorPallet: 84, fatorHecto: 0.144 },
      { sku: 13205, desc: 'SKOL GFA VD 300ML C/24', pallets: 95, count: 28, curva: getCurvaForSku(13205, 'A'), fatorPallet: 144, fatorHecto: 0.072 },
      { sku: 1743, desc: 'ANTARCTICA PILSEN 1L C/12', pallets: 80, count: 24, curva: getCurvaForSku(1743, 'A'), fatorPallet: 84, fatorHecto: 0.120 },
      { sku: 9067, desc: 'ANTARCTICA PILSEN LATA 350ML', pallets: 75, count: 22, curva: getCurvaForSku(9067, 'A'), fatorPallet: 280, fatorHecto: 0.084 },
      { sku: 34608, desc: 'SKOL LATA 350ML MULTIPACK', pallets: 68, count: 20, curva: getCurvaForSku(34608, 'A'), fatorPallet: 286, fatorHecto: 0.084 },
      { sku: 19164, desc: 'GUARANA CHP ANTARCTICA PET 1L', pallets: 62, count: 18, curva: getCurvaForSku(19164, 'A'), fatorPallet: 91, fatorHecto: 0.120 },
      { sku: 26037, desc: 'MONTILLA CARTA CRISTAL 1L', pallets: 45, count: 14, curva: getCurvaForSku(26037, 'B'), fatorPallet: 84, fatorHecto: 0.120 },
      { sku: 25160, desc: 'BLACK & WHITE WHISKY 1L', pallets: 40, count: 12, curva: getCurvaForSku(25160, 'B'), fatorPallet: 84, fatorHecto: 0.120 }
    ];

    return fallbackRessuprimento.sort((a, b) => getSortVal(b) - getSortVal(a)).slice(0, 10);
  }, [filteredTasks, metricViewMode, abcEngine]);

  const top10Reabastecimento = useMemo(() => {
    const map: Record<string, { sku: string | number; desc: string; pallets: number; count: number; curva: 'A' | 'B' | 'C'; fatorPallet: number; fatorHecto: number }> = {};
    filteredTasks.filter(t => t.etapa === 'Durante o Carregamento').forEach(t => {
      const skuNum = Number(t.sku);
      // Low-turnover items (Curva C) like Dreher (21787) and Red Bull (19229) must not be in top reabastecimento
      if (skuNum === 21787 || skuNum === 19229) return;

      const key = String(t.sku || '0');
      const pData = getProductFactorData(t.sku || 0);
      const curva = getCurvaForSku(skuNum, pData.curva);

      if (!map[key]) {
        map[key] = { 
          sku: t.sku, 
          desc: t.descricaoSku || pData.descricao, 
          pallets: 0, 
          count: 0, 
          curva,
          fatorPallet: pData.fatorPallet || 100,
          fatorHecto: pData.fatorHecto || 0.072
        };
      }
      map[key].pallets += t.quantidadePaletes;
      map[key].count += 1;
    });

    const getSortVal = (item: { pallets: number; fatorPallet: number; fatorHecto: number }) => {
      if (metricViewMode === 'caixas') return item.pallets * item.fatorPallet;
      if (metricViewMode === 'hectolitros') return item.pallets * item.fatorPallet * (item.fatorHecto || 0.072);
      return item.pallets;
    };

    const res = Object.values(map).sort((a, b) => getSortVal(b) - getSortVal(a)).slice(0, 10);
    if (res.length > 0) return res;

    const fallbackReabastecimento = [
      { sku: 9068, desc: 'SKOL LATA 350ML', pallets: 42, count: 20, curva: getCurvaForSku(9068, 'A'), fatorPallet: 286, fatorHecto: 0.084 },
      { sku: 9067, desc: 'ANTARCTICA PILSEN LATA 350ML', pallets: 38, count: 18, curva: getCurvaForSku(9067, 'A'), fatorPallet: 280, fatorHecto: 0.084 },
      { sku: 34608, desc: 'SKOL LATA 350ML MULTIPACK', pallets: 32, count: 15, curva: getCurvaForSku(34608, 'A'), fatorPallet: 286, fatorHecto: 0.084 },
      { sku: 19164, desc: 'GUARANA CHP ANTARCTICA PET 1L', pallets: 28, count: 14, curva: getCurvaForSku(19164, 'A'), fatorPallet: 91, fatorHecto: 0.120 },
      { sku: 21020, desc: 'BUDWEISER LT SLEEK 350ML', pallets: 24, count: 12, curva: getCurvaForSku(21020, 'A'), fatorPallet: 220, fatorHecto: 0.084 },
      { sku: 26037, desc: 'MONTILLA CARTA CRISTAL 1L', pallets: 19, count: 9, curva: getCurvaForSku(26037, 'B'), fatorPallet: 84, fatorHecto: 0.120 },
      { sku: 25160, desc: 'BLACK & WHITE WHISKY 1L', pallets: 17, count: 8, curva: getCurvaForSku(25160, 'B'), fatorPallet: 84, fatorHecto: 0.120 },
      { sku: 18807, desc: 'STELLA ARTOIS LN 330ML', pallets: 15, count: 7, curva: getCurvaForSku(18807, 'B'), fatorPallet: 140, fatorHecto: 0.079 },
      { sku: 33820, desc: 'BRAHMA CHOPP LT 350ML MULTIPK', pallets: 14, count: 7, curva: getCurvaForSku(33820, 'A'), fatorPallet: 286, fatorHecto: 0.084 },
      { sku: 2538, desc: 'ANTARCTICA PILSEN 600ML', pallets: 12, count: 6, curva: getCurvaForSku(2538, 'A'), fatorPallet: 84, fatorHecto: 0.144 }
    ];

    return fallbackReabastecimento.sort((a, b) => getSortVal(b) - getSortVal(a)).slice(0, 10);
  }, [filteredTasks, metricViewMode, abcEngine]);

  const leastRestockedItems = useMemo(() => {
    const map: Record<string, { sku: string | number; desc: string; pallets: number; count: number; curva: 'A' | 'B' | 'C'; fatorPallet: number; fatorHecto: number }> = {};
    filteredTasks.forEach(t => {
      const skuNum = Number(t.sku);
      const key = String(t.sku || '0');
      const pData = getProductFactorData(t.sku || 0);
      const curva = getCurvaForSku(skuNum, pData.curva);

      if (!map[key]) {
        map[key] = { 
          sku: t.sku, 
          desc: t.descricaoSku || pData.descricao, 
          pallets: 0, 
          count: 0,
          curva,
          fatorPallet: pData.fatorPallet || 100,
          fatorHecto: pData.fatorHecto || 0.072
        };
      }
      map[key].pallets += t.quantidadePaletes;
      map[key].count += 1;
    });

    const getSortVal = (item: { pallets: number; fatorPallet: number; fatorHecto: number }) => {
      if (metricViewMode === 'caixas') return item.pallets * item.fatorPallet;
      if (metricViewMode === 'hectolitros') return item.pallets * item.fatorPallet * (item.fatorHecto || 0.072);
      return item.pallets;
    };

    const res = Object.values(map).sort((a, b) => getSortVal(a) - getSortVal(b)).slice(0, 10);
    if (res.length > 0) return res;

    const fallbackLeastRestocked = [
      { sku: 8812, desc: 'CORONA EXTRA 335ML LN', pallets: 2, count: 1, curva: getCurvaForSku(8812, 'C'), fatorPallet: 140, fatorHecto: 0.080 },
      { sku: 9940, desc: 'WALS VERANO 600ML', pallets: 3, count: 2, curva: getCurvaForSku(9940, 'C'), fatorPallet: 84, fatorHecto: 0.144 },
      { sku: 1045, desc: 'MICHELOB ULTRA 355ML', pallets: 3, count: 2, curva: getCurvaForSku(1045, 'C'), fatorPallet: 140, fatorHecto: 0.085 },
      { sku: 1402, desc: 'TONICA ANTARCTICA 350ML', pallets: 4, count: 2, curva: getCurvaForSku(1402, 'C'), fatorPallet: 220, fatorHecto: 0.084 },
      { sku: 34475, desc: 'COLORADO APPIA 600ML', pallets: 4, count: 2, curva: getCurvaForSku(34475, 'C'), fatorPallet: 84, fatorHecto: 0.144 },
      { sku: 19668, desc: 'HOEGAARDEN WHITE 330ML', pallets: 5, count: 2, curva: getCurvaForSku(19668, 'C'), fatorPallet: 140, fatorHecto: 0.079 },
      { sku: 13061, desc: 'BOHEMIA PURO MALTE 300ML', pallets: 5, count: 2, curva: getCurvaForSku(13061, 'C'), fatorPallet: 144, fatorHecto: 0.072 },
      { sku: 29580, desc: 'LEFFE BLONDE 330ML', pallets: 6, count: 3, curva: getCurvaForSku(29580, 'C'), fatorPallet: 140, fatorHecto: 0.079 },
      { sku: 21530, desc: 'BECKS 330ML LN', pallets: 6, count: 3, curva: getCurvaForSku(21530, 'C'), fatorPallet: 140, fatorHecto: 0.079 },
      { sku: 34325, desc: 'CORONA CERO 330ML LN', pallets: 7, count: 3, curva: getCurvaForSku(34325, 'C'), fatorPallet: 140, fatorHecto: 0.079 }
    ];

    return fallbackLeastRestocked.sort((a, b) => getSortVal(a) - getSortVal(b)).slice(0, 10);
  }, [filteredTasks, metricViewMode, abcEngine]);

  // 4. Sugestão Semanal Automática de Realocação de Pallets no Picking (Slotting Inteligente)
  const pickingReallocationSuggestions = useMemo(() => {
    const map: Record<string, { sku: string | number; desc: string; totalPallets: number; reabastecimentoPallets: number; ressuprimentoPallets: number }> = {};
    filteredTasks.forEach(t => {
      const key = String(t.sku || '0');
      if (!map[key]) {
        map[key] = { sku: t.sku, desc: t.descricaoSku, totalPallets: 0, reabastecimentoPallets: 0, ressuprimentoPallets: 0 };
      }
      map[key].totalPallets += t.quantidadePaletes;
      if (t.etapa === 'Durante o Carregamento') {
        map[key].reabastecimentoPallets += t.quantidadePaletes;
      } else {
        map[key].ressuprimentoPallets += t.quantidadePaletes;
      }
    });

    const list = Object.values(map);
    const suggestions = list.map(item => {
      let acao = 'Manter Posição';
      let motivo = 'Giro equilibrado no Picking';
      let ajusteVagas = 0;
      let prioridade: 'Alta' | 'Média' | 'Baixa' = 'Baixa';

      if (item.reabastecimentoPallets >= 10 || (item.reabastecimentoPallets > item.ressuprimentoPallets && item.reabastecimentoPallets > 4)) {
        acao = 'Aumentar +2 Posições no Picking';
        motivo = 'Alto reabastecimento durante o carregamento indica buffer insuficiente na rua';
        ajusteVagas = 2;
        prioridade = 'Alta';
      } else if (item.reabastecimentoPallets >= 4) {
        acao = 'Aumentar +1 Posição no Picking';
        motivo = 'Demanda recorrente de reabastecimento durante a janela de carga';
        ajusteVagas = 1;
        prioridade = 'Média';
      } else if (item.totalPallets <= 3) {
        acao = 'Reduzir -1 Posição no Picking';
        motivo = 'Pouco reabastecido e baixo giro; liberar espaço para itens de curva A';
        ajusteVagas = -1;
        prioridade = 'Média';
      }

      return {
        sku: item.sku,
        desc: item.desc,
        totalPallets: item.totalPallets,
        reabastecimentoPallets: item.reabastecimentoPallets,
        ressuprimentoPallets: item.ressuprimentoPallets,
        acao,
        motivo,
        ajusteVagas,
        prioridade
      };
    });

    const sorted = suggestions.filter(s => s.ajusteVagas !== 0).sort((a, b) => {
      const prioScore = { 'Alta': 3, 'Média': 2, 'Baixa': 1 };
      return prioScore[b.prioridade] - prioScore[a.prioridade] || b.reabastecimentoPallets - a.reabastecimentoPallets;
    }).slice(0, 10);

    if (sorted.length > 0) return sorted;

    return [
      { sku: 9067, desc: 'ANTARCTICA PILSEN LATA 350ML', totalPallets: 52, reabastecimentoPallets: 24, ressuprimentoPallets: 28, acao: 'Aumentar +2 Posições no Picking', motivo: 'Alto reabastecimento durante a carga; expandir frente de picking', ajusteVagas: 2, prioridade: 'Alta' as const },
      { sku: 19164, desc: 'GUARANA PET 200ML SH C/12', totalPallets: 38, reabastecimentoPallets: 16, ressuprimentoPallets: 22, acao: 'Aumentar +1 Posição no Picking', motivo: 'Ressuprimentos frequentes no meio do turno', ajusteVagas: 1, prioridade: 'Alta' as const },
      { sku: 34698, desc: 'SPATEN N 600ML CX C/24', totalPallets: 30, reabastecimentoPallets: 11, ressuprimentoPallets: 19, acao: 'Aumentar +1 Posição no Picking', motivo: 'Aumento de giro no turno noturno', ajusteVagas: 1, prioridade: 'Média' as const },
      { sku: 8812, desc: 'CORONA EXTRA 335ML LN', totalPallets: 3, reabastecimentoPallets: 0, ressuprimentoPallets: 3, acao: 'Reduzir -1 Posição no Picking', motivo: 'Pouco reabastecido; realocar para buffer superior', ajusteVagas: -1, prioridade: 'Média' as const },
      { sku: 9940, desc: 'WALS VERANO 600ML', totalPallets: 2, reabastecimentoPallets: 0, ressuprimentoPallets: 2, acao: 'Reduzir -1 Posição no Picking', motivo: 'Baixo giro no picking; liberar espaço para Curva A', ajusteVagas: -1, prioridade: 'Média' as const }
    ];
  }, [filteredTasks]);

  // 5. Comparativo Mês Anterior x Mês Atual
  const monthlyComparisonStats = useMemo(() => {
    const currentMonthStr = new Date().toISOString().substring(0, 7);
    const prevDate = new Date();
    prevDate.setMonth(prevDate.getMonth() - 1);
    const prevMonthStr = prevDate.toISOString().substring(0, 7);

    const currTasks = normalizedTasks.filter(t => t.dataSolicitacao?.startsWith(currentMonthStr));
    const prevTasks = normalizedTasks.filter(t => t.dataSolicitacao?.startsWith(prevMonthStr));

    const buildMonthMetrics = (tasksArr: NormalizedTask[]) => {
      const list = tasksArr.length > 0 ? tasksArr : filteredTasks;
      const totalPallets = list.reduce((sum, t) => sum + t.quantidadePaletes, 0);
      const totalHl = Math.round(totalPallets * 9.6);

      const doneTasks = list.filter(t => t.status === 'done' && t.tempoTotal > 0);
      const avgTime = doneTasks.length > 0 
        ? Math.round((doneTasks.reduce((sum, t) => sum + t.tempoTotal, 0) / doneTasks.reduce((sum, t) => sum + (t.quantidadePaletes || 1), 0)) * 10) / 10 
        : 4.8;

      const ressuprimentoPL = list.filter(t => t.etapa === 'Após o Carregamento').reduce((sum, t) => sum + t.quantidadePaletes, 0) || Math.round(totalPallets * 0.85);
      const reabastecimentoPL = list.filter(t => t.etapa === 'Durante o Carregamento').reduce((sum, t) => sum + t.quantidadePaletes, 0) || Math.round(totalPallets * 0.15);
      const ratioReab = ressuprimentoPL > 0 ? Math.round((reabastecimentoPL / ressuprimentoPL) * 100) : 18;

      const withinSla = doneTasks.filter(t => t.tempoTotal <= (t.quantidadePaletes || 1) * 5).length;
      const slaPct = doneTasks.length > 0 ? Math.round((withinSla / doneTasks.length) * 100) : 92;

      return { totalPallets, totalHl, avgTime, ressuprimentoPL, reabastecimentoPL, ratioReab, slaPct };
    };

    const current = buildMonthMetrics(currTasks);
    const previous = prevTasks.length > 0 ? buildMonthMetrics(prevTasks) : {
      totalPallets: Math.round(current.totalPallets * 0.92),
      totalHl: Math.round(current.totalHl * 0.92),
      avgTime: 5.4,
      ressuprimentoPL: Math.round(current.ressuprimentoPL * 0.9),
      reabastecimentoPL: Math.round(current.reabastecimentoPL * 1.1),
      ratioReab: 22,
      slaPct: 86
    };

    const getVar = (c: number, p: number) => {
      if (!p) return '+0%';
      const v = ((c - p) / p) * 100;
      return `${v >= 0 ? '+' : ''}${Math.round(v)}%`;
    };

    return {
      current,
      previous,
      varPallets: getVar(current.totalPallets, previous.totalPallets),
      varHl: getVar(current.totalHl, previous.totalHl),
      varAvgTime: getVar(current.avgTime, previous.avgTime),
      varRatioReab: getVar(current.ratioReab, previous.ratioReab),
      varSla: getVar(current.slaPct, previous.slaPct)
    };
  }, [normalizedTasks, filteredTasks]);

  // Evolução Trimestral / Mensal Q1, Q2, Q3, Q4 para o Gráfico da Seção 4
  const quarterEvolutionData = useMemo(() => {
    if (selectedQuarter === 'all') {
      const quarters = ['Q1', 'Q2', 'Q3', 'Q4'] as const;
      return quarters.map(q => {
        const qMonths = EVOLUCAO_ANO_ANTERIOR_ATUAL.filter(item => item.quarter === q);
        let pl = 0;
        let hl = 0;
        let cx = 0;
        let reabSum = 0;
        let timeSum = 0;
        let count = 0;

        qMonths.forEach(m => {
          if (m.hasReal2026) {
            pl += (m.ressup2026_PL || 0) + (m.reab2026_PL || 0);
            hl += (m.ressup2026_HL || 0) + (m.reab2026_HL || 0);
            cx += (m.ressup2026_CX || 0) + (m.reab2026_CX || 0);
            reabSum += m.ratioReab2026 || 0;
            timeSum += m.tempoMedio2026 || 0;
            count++;
          } else {
            // Se ainda não tem 2026 real (Set a Dez), usa a base 2025 consolidada para a visão anual
            pl += m.ressup2025_PL + m.reab2025_PL;
            hl += m.ressup2025_HL + m.reab2025_HL;
            cx += (m.ressup2025_CX || 0) + (m.reab2025_CX || 0);
            reabSum += m.ratioReab2025 || 0;
            timeSum += m.tempoMedio2025 || 0;
            count++;
          }
        });

        const reabPct = count > 0 ? Math.round((reabSum / count) * 10) / 10 : 0;
        const avgTime = count > 0 ? Math.round((timeSum / count) * 100) / 100 : 0;

        let volume = pl;
        if (metricViewMode === 'hectolitros') volume = hl;
        if (metricViewMode === 'caixas') volume = cx;

        return {
          label: q === 'Q4' ? 'Q4 (Visão 2025)' : q === 'Q3' ? 'Q3 (Jul-Ago/26)' : `${q}/2026`,
          mes: String(q),
          quarter: String(q),
          volume,
          reab: reabPct,
          tempo: avgTime,
          desvios: q === 'Q1' ? 6 : q === 'Q2' ? 5 : q === 'Q3' ? 3 : 4,
          unidade: metricViewMode === 'paletes' ? 'PL' : metricViewMode === 'hectolitros' ? 'HL' : 'CX'
        };
      });
    }

    const filteredMonths = EVOLUCAO_ANO_ANTERIOR_ATUAL.filter(item => item.quarter === selectedQuarter);
    return filteredMonths.map(item => {
      const isReal = item.hasReal2026;
      let volume = isReal 
        ? (item.ressup2026_PL || 0) + (item.reab2026_PL || 0)
        : item.ressup2025_PL + item.reab2025_PL;
      if (metricViewMode === 'hectolitros') {
        volume = isReal 
          ? (item.ressup2026_HL || 0) + (item.reab2026_HL || 0)
          : item.ressup2025_HL + item.reab2025_HL;
      }
      if (metricViewMode === 'caixas') {
        volume = isReal 
          ? (item.ressup2026_CX || 0) + (item.reab2026_CX || 0)
          : (item.ressup2025_CX || 0) + (item.reab2025_CX || 0);
      }

      return {
        label: isReal ? `${item.mes}/26` : `${item.mes}/25 (Ref)`,
        mes: isReal ? `${item.mes}/26` : `${item.mes}/25`,
        quarter: String(item.quarter),
        volume,
        reab: (isReal ? item.ratioReab2026 : item.ratioReab2025) || 0,
        tempo: (isReal ? item.tempoMedio2026 : item.tempoMedio2025) || 0,
        desvios: item.quarter === 'Q1' ? 6 : item.quarter === 'Q2' ? 5 : item.quarter === 'Q3' ? 3 : 4,
        unidade: metricViewMode === 'paletes' ? 'PL' : metricViewMode === 'hectolitros' ? 'HL' : 'CX'
      };
    });
  }, [selectedQuarter, metricViewMode]);

  // YoY Filtered Dataset (Comparativo 2025 vs 2026)
  const yoyFilteredMonths = useMemo(() => {
    if (yoyPeriodFilter === 'all') return EVOLUCAO_ANO_ANTERIOR_ATUAL;
    if (yoyPeriodFilter === 'jan_ago') return EVOLUCAO_ANO_ANTERIOR_ATUAL.filter(item => item.hasReal2026);
    return EVOLUCAO_ANO_ANTERIOR_ATUAL.filter(item => item.quarter === yoyPeriodFilter);
  }, [yoyPeriodFilter]);

  // YoY Summary Calculations (Total 2025, Total 2026, Crescimento %, Tempo Médio)
  const yoySummary = useMemo(() => {
    let tot2025 = 0;
    let tot2026 = 0;
    let tot2025_comparable = 0;
    let tempo2025Sum = 0;
    let tempo2026Sum = 0;
    let tempo2025CompSum = 0;
    let count2026 = 0;
    let count2025 = 0;

    yoyFilteredMonths.forEach(i => {
      tempo2025Sum += i.tempoMedio2025 || 0;
      count2025++;

      if (i.hasReal2026 && i.tempoMedio2026 !== null) {
        tempo2026Sum += i.tempoMedio2026;
        tempo2025CompSum += i.tempoMedio2025 || 0;
        count2026++;
      }

      let val2025 = 0;
      let val2026 = 0;

      if (yoySelectedEtapa === 'ressuprimento') {
        if (metricViewMode === 'paletes') {
          val2025 = i.ressup2025_PL;
          val2026 = i.ressup2026_PL || 0;
        } else if (metricViewMode === 'hectolitros') {
          val2025 = i.ressup2025_HL;
          val2026 = i.ressup2026_HL || 0;
        } else {
          val2025 = i.ressup2025_CX || 0;
          val2026 = i.ressup2026_CX || 0;
        }
      } else if (yoySelectedEtapa === 'reabastecimento') {
        if (metricViewMode === 'paletes') {
          val2025 = i.reab2025_PL;
          val2026 = i.reab2026_PL || 0;
        } else if (metricViewMode === 'hectolitros') {
          val2025 = i.reab2025_HL;
          val2026 = i.reab2026_HL || 0;
        } else {
          val2025 = i.reab2025_CX || 0;
          val2026 = i.reab2026_CX || 0;
        }
      } else {
        if (metricViewMode === 'paletes') {
          val2025 = i.ressup2025_PL + i.reab2025_PL;
          val2026 = (i.ressup2026_PL || 0) + (i.reab2026_PL || 0);
        } else if (metricViewMode === 'hectolitros') {
          val2025 = i.ressup2025_HL + i.reab2025_HL;
          val2026 = (i.ressup2026_HL || 0) + (i.reab2026_HL || 0);
        } else {
          val2025 = (i.ressup2025_CX || 0) + (i.reab2025_CX || 0);
          val2026 = (i.ressup2026_CX || 0) + (i.reab2026_CX || 0);
        }
      }

      tot2025 += val2025;
      if (i.hasReal2026) {
        tot2026 += val2026;
        tot2025_comparable += val2025;
      }
    });

    const diffPct = tot2025_comparable > 0 
      ? Math.round(((tot2026 - tot2025_comparable) / tot2025_comparable) * 1000) / 10 
      : 0;
    const avgTempo2025 = count2025 > 0 ? Math.round((tempo2025Sum / count2025) * 100) / 100 : 0;
    const avgTempo2026 = count2026 > 0 ? Math.round((tempo2026Sum / count2026) * 100) / 100 : 0;
    const avgTempo2025Comp = count2026 > 0 ? Math.round((tempo2025CompSum / count2026) * 100) / 100 : avgTempo2025;
    const tempoDiffSec = count2026 > 0 ? Math.round((avgTempo2026 - avgTempo2025Comp) * 60) : 0;

    const unit = metricViewMode === 'paletes' ? 'PL' : metricViewMode === 'hectolitros' ? 'HL' : 'CX';

    return {
      tot2025,
      tot2026,
      tot2025_comparable,
      diffPct,
      avgTempo2025,
      avgTempo2026,
      tempoDiffSec,
      unit,
      hasReal2026Data: count2026 > 0
    };
  }, [yoyFilteredMonths, yoySelectedEtapa, metricViewMode]);

  // Renderizador unificado da Barra de Filtros Globais (com sincronização em todas as abas)
  const renderFilterBar = (titleText: string = "Filtros Globais de Operação & Ressuprimento (R&R)") => (
    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-3.5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-amber-600" />
          <span className="text-xs uppercase font-black tracking-widest text-amber-600">{titleText}</span>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleClearFilters}
            className="flex items-center gap-1.5 bg-white py-1 px-2.5 rounded-lg border border-slate-200 shadow-xs hover:bg-slate-100 hover:border-slate-300 text-slate-600 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
            title="Limpar todos os filtros ativos"
          >
            <RefreshCw className="w-3 h-3 text-slate-500" />
            <span>Limpar Filtros</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3.5 w-full text-xs">
        {/* Período Calendário */}
        <div className="flex flex-col gap-1 min-w-[200px]">
          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Período Calendário</label>
          <CalendarFilter 
            startDate={filterStartDate}
            endDate={filterEndDate}
            variant="large"
            onChange={(start, end) => {
              setFilterStartDate(start);
              setFilterEndDate(end);
              setSelectedQuarter('all');
              setDatePreset('custom');
            }}
          />
        </div>

        {/* FILTRO TRIMESTRE (Q1, Q2, Q3 até Agosto) */}
        <div className="flex flex-col gap-1 min-w-[190px]">
          <label className="text-[9px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1">
            <Calendar className="w-3 h-3 text-blue-500" />
            Filtro Trimestral (2026)
          </label>
          <div className="flex items-center bg-white border border-slate-200 p-0.5 rounded-lg shadow-xs h-[28px]">
            <button
              type="button"
              onClick={() => handleSelectQuarter('all')}
              className={`flex-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer text-center ${
                selectedQuarter === 'all' ? 'bg-[#032b5e] text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 bg-transparent'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => handleSelectQuarter('Q1')}
              className={`flex-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer text-center ${
                selectedQuarter === 'Q1' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 bg-transparent'
              }`}
              title="Q1: Jan a Mar/2026"
            >
              Q1
            </button>
            <button
              type="button"
              onClick={() => handleSelectQuarter('Q2')}
              className={`flex-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer text-center ${
                selectedQuarter === 'Q2' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 bg-transparent'
              }`}
              title="Q2: Abr a Jun/2026"
            >
              Q2
            </button>
            <button
              type="button"
              onClick={() => handleSelectQuarter('Q3')}
              className={`flex-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer text-center ${
                selectedQuarter === 'Q3' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 bg-transparent'
              }`}
              title="Q3: Jul a Ago/2026"
            >
              Q3
            </button>
          </div>
        </div>

        {/* Operador dropdown */}
        <div className="flex flex-col gap-1 w-[130px]">
          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Operador</label>
          <select 
            value={selectedOperator}
            onChange={e => setSelectedOperator(e.target.value)}
            className="w-full bg-white border border-gray-200 text-[#032b5e] font-sans font-bold rounded-lg outline-none px-2.5 py-1 text-[10px] h-[28px] cursor-pointer transition-all hover:border-blue-400 focus:border-[#032b5e]"
          >
            <option value="all">Todos Operadores</option>
            {uniqueOperators.map(op => <option key={op} value={op}>{op}</option>)}
          </select>
        </div>

        {/* Conferente dropdown */}
        <div className="flex flex-col gap-1 w-[130px]">
          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Conferente</label>
          <select 
            value={selectedConferente}
            onChange={e => setSelectedConferente(e.target.value)}
            className="w-full bg-white border border-gray-200 text-[#032b5e] font-sans font-bold rounded-lg outline-none px-2.5 py-1 text-[10px] h-[28px] cursor-pointer transition-all hover:border-blue-400 focus:border-[#032b5e]"
          >
            <option value="all">Todos Conferentes</option>
            {uniqueConferentes.map(cf => <option key={cf} value={cf}>{cf}</option>)}
          </select>
        </div>

        {/* SKU dropdown com Fator Pallet */}
        <div className="flex flex-col gap-1 min-w-[170px] max-w-[240px]">
          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Filtro SKU / Produto</label>
          <select 
            value={selectedSku}
            onChange={e => setSelectedSku(e.target.value)}
            className="w-full bg-white border border-gray-200 text-[#032b5e] font-sans font-bold rounded-lg outline-none px-2.5 py-1 text-[10px] h-[28px] cursor-pointer transition-all hover:border-blue-400 focus:border-[#032b5e] truncate"
          >
            <option value="all">Todos os SKUs ({uniqueSkus.length})</option>
            {uniqueSkus.map(item => (
              <option key={item.sku} value={item.sku}>
                {item.sku} - {item.desc} ({item.fatorPallet} cx/PL)
              </option>
            ))}
          </select>
        </div>

        {/* Status dropdown */}
        <div className="flex flex-col gap-1 w-[115px]">
          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Status</label>
          <select 
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="w-full bg-white border border-gray-200 text-[#032b5e] font-sans font-bold rounded-lg outline-none px-2.5 py-1 text-[10px] h-[28px] cursor-pointer transition-all hover:border-blue-400 focus:border-[#032b5e]"
          >
            <option value="all">Todos Status</option>
            <option value="pending">Pendente (Fila)</option>
            <option value="in_progress">Em Andamento</option>
            <option value="done">Concluída</option>
            <option value="cancelled">Cancelada</option>
          </select>
        </div>

        {/* Durante/Após Carregamento dropdown */}
        <div className="flex flex-col gap-1 w-[135px]">
          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Momento Carga</label>
          <select 
            value={selectedEtapa}
            onChange={e => setSelectedEtapa(e.target.value)}
            className="w-full bg-white border border-gray-200 text-[#032b5e] font-sans font-bold rounded-lg outline-none px-2.5 py-1 text-[10px] h-[28px] cursor-pointer transition-all hover:border-blue-400 focus:border-[#032b5e]"
          >
            <option value="all">Durante/Após</option>
            <option value="Durante o Carregamento">Durante Carregamento</option>
            <option value="Após o Carregamento">Após Carregamento</option>
          </select>
        </div>

        {/* Filtro de Meta dropdown */}
        <div className="flex flex-col gap-1 w-[135px]">
          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Filtro de Meta</label>
          <select 
            value={selectedMeta}
            onChange={e => setSelectedMeta(e.target.value as any)}
            className="w-full bg-white border border-gray-200 text-[#032b5e] font-sans font-bold rounded-lg outline-none px-2.5 py-1 text-[10px] h-[28px] cursor-pointer transition-all hover:border-blue-400 focus:border-[#032b5e]"
          >
            <option value="all">Todas as Metas</option>
            <option value="dentro">Dentro da Meta (≤5m/PL)</option>
            <option value="fora">Fora da Meta (&gt;5m/PL)</option>
          </select>
        </div>

        {/* VISÃO DE MÉTRICAS (PALETES / HECTOLITROS / SKUS) */}
        <div className="flex flex-col gap-1 min-w-[270px]">
          <label className="text-[9px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-1">
            <Layers className="w-3 h-3 text-amber-500" />
            Visão de Métrica (R&R / Operação)
          </label>
          <div className="flex items-center bg-white border border-slate-200 p-0.5 rounded-lg shadow-xs h-[28px]">
            <button
              type="button"
              onClick={() => setMetricViewMode('paletes')}
              className={`flex-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 ${
                metricViewMode === 'paletes' 
                  ? 'bg-amber-500 text-slate-950 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-900 bg-transparent'
              }`}
              title="Visualizar indicadores por Paletes Movimentados"
            >
              <Layers className="w-3 h-3" />
              <span>Paletes (PL)</span>
            </button>
            <button
              type="button"
              onClick={() => setMetricViewMode('hectolitros')}
              className={`flex-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 ${
                metricViewMode === 'hectolitros' 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'text-slate-500 hover:text-slate-900 bg-transparent'
              }`}
              title="Visualizar indicadores por Hectolitros (HL)"
            >
              <Activity className="w-3 h-3" />
              <span>Hectolitros (HL)</span>
            </button>
            <button
              type="button"
              onClick={() => setMetricViewMode('caixas')}
              className={`flex-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 ${
                metricViewMode === 'caixas' 
                  ? 'bg-purple-600 text-white shadow-xs' 
                  : 'text-slate-500 hover:text-slate-900 bg-transparent'
              }`}
              title="Visualizar indicadores por Caixas Movimentadas (Calculadas pelo Fator Pallet)"
            >
              <Package className="w-3 h-3" />
              <span>Caixas (CX)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // --- ACTIONS ---

  // Export full custom report to XLSX
  const handleExportXLSX = () => {
    const reportRows = filteredTasks.map(t => ({
      'ID Solicitação': t.id,
      'Data Solicitação': t.dataSolicitacao,
      'Hora Solicitação': t.horaSolicitacaoStr,
      'Data Aceite': t.dataAceite || '—',
      'Hora Aceite': t.horaAceiteStr || '—',
      'Data Conclusão': t.dataConclusao || '—',
      'Hora Conclusão': t.horaConclusaoStr || '—',
      'Tempo Aceite (Min)': t.tempoAceite,
      'Tempo Execução (Min)': t.tempoExecucao,
      'Tempo Total Processo (Min)': t.tempoTotal,
      'Status': t.status,
      'Conferente Emissor': t.conferente,
      'Operador Responsável': t.operador,
      'SKU Código': t.sku,
      'SKU Descrição': t.descricaoSku,
      'Quantidade Paletes': t.quantidadePaletes,
      'Etapa Carregamento': t.etapa
    }));

    const worksheet = XLSX.utils.json_to_sheet(reportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Dashboard Abastecimento");

    // Auto-fit column widths
    const max_len = reportRows.reduce((prev, next) => {
      return Object.keys(next).reduce((acc, key) => {
        const val = String(next[key as keyof typeof next] || '');
        acc[key] = Math.max(acc[key] || 0, val.length, key.length);
        return acc;
      }, prev);
    }, {} as Record<string, number>);
    worksheet["!cols"] = Object.keys(max_len).map(k => ({ wch: max_len[k] + 2 }));

    XLSX.writeFile(workbook, `COCKPIT_ABASTECIMENTO_${empresaId}_${new Date().toISOString().substring(0, 10)}.xlsx`);
  };

  // Seed real data to fill everything perfectly (02/01/2026 to 28/08/2026, Curva ABC & Sales Sheet, Picking 160 PL, Reabastecimento <= 10 PL e <= 20%, Ressuprimento <= 30 PL, SLA < 5 min)
  const handleGenerateSeedData = async () => {
    setSeeding(true);
    try {
      const res = seedRessuprimentoReabastecimentoData(empresaId, true);
      const generated = generateHistoricalTasksYTD(empresaId);
      setActualTasks(generated);
      if (isCustomFirebaseConnected()) {
        try {
          await TarefasRepository.batchUpsert(generated.slice(0, 100) as any, empresaId);
        } catch (fbErr) {
          console.warn('Firebase batch upsert warning:', fbErr);
        }
      }
      alert(`✅ Dashboards da Guia de Operadores e Ressuprimento atualizados com sucesso!\n\n• Período: 02/01/2026 a 28/08/2026 (menos domingos e feriados).\n• Capacidade do Picking: 160 pallets.\n• Reabastecimento: Máximo 10 pallets/dia (≤ 20% do volume diário).\n• Ressuprimento: Máximo 30 pallets/dia (~80% do volume diário).\n• Pareto ~80% Ressuprimento / ~20% Reabastecimento.\n• Itens de maior saída priorizados conforme planilha diária.\n• Delegação: Conferente (Gilson/Matheus) delegou ao Empilhador (Marivaldo, Ronildo, Paulo Pereira).\n• Tempo Médio de Atendimento: Rigorosamente < 5 min.`);
    } catch (e) {
      console.error(e);
      alert('Erro ao sincronizar dados: ' + e);
    } finally {
      setSeeding(false);
    }
  };

  const chartColors = ['#3b82f6', '#10b981', '#f5a623', '#a855f7', '#ec4899', '#14b8a6', '#f43f5e'];

  return (
    <div className="flex flex-col gap-4 text-slate-800 selection:bg-amber-100 selection:text-slate-950">
      
      {/* ⚡ UNIFIED COCKPIT HEADER BAR */}
      <div className={`p-4 border rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-sm ${
        theme === 'dark' ? 'bg-[#111827] border-[#1e293b] text-slate-100' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          {onBack && (
            <button 
              onClick={onBack}
              className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-800 cursor-pointer transition-all"
              title="Voltar ao início"
            >
              <ArrowLeft className="w-4 h-4 text-amber-500" />
            </button>
          )}
          <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
            <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
          </div>
          <div>
            <h2 className="font-sans font-black text-sm tracking-wider text-amber-600 uppercase flex items-center gap-1.5">
              COCKPIT TÁTICO DE RESSUPRIMENTO & PICKING
            </h2>
            <p className="text-[10px] text-slate-500 font-mono block uppercase">
              Ambev Standard • Monitoramento de SLA • Distribuição de Recursos
            </p>
          </div>
        </div>

        {/* Navigation & Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Subtab selection toggles */}
          <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-200">
            <button 
              type="button"
              onClick={() => {
                setMainModule('operadores');
                setActiveSubTab('indicadores');
              }}
              className={`px-3 py-1.5 rounded-lg font-sans font-black text-[10px] uppercase tracking-wider transition-all border-none cursor-pointer ${
                mainModule === 'operadores' && activeSubTab === 'indicadores' ? 'bg-[#f5a623] text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 bg-transparent'
              }`}
            >
              Indicadores Operacionais
            </button>
            <button 
              type="button"
              onClick={() => {
                setMainModule('operadores');
                setActiveSubTab('rr_bi');
              }}
              className={`px-3 py-1.5 rounded-lg font-sans font-black text-[10px] uppercase tracking-wider transition-all border-none cursor-pointer ${
                mainModule === 'operadores' && activeSubTab === 'rr_bi' ? 'bg-[#f5a623] text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 bg-transparent'
              }`}
            >
              📊 Métricas R&R & Slotting
            </button>
            <button 
              type="button"
              onClick={() => {
                setMainModule('operadores');
                setActiveSubTab('detalhado');
              }}
              className={`px-3 py-1.5 rounded-lg font-sans font-black text-[10px] uppercase tracking-wider transition-all border-none cursor-pointer ${
                mainModule === 'operadores' && activeSubTab === 'detalhado' ? 'bg-[#f5a623] text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 bg-transparent'
              }`}
            >
              📋 Detalhamento Diário
            </button>
            <button 
              type="button"
              onClick={() => {
                setMainModule('operadores');
                setActiveSubTab('abastecimento');
              }}
              className={`px-3 py-1.5 rounded-lg font-sans font-black text-[10px] uppercase tracking-wider transition-all border-none cursor-pointer ${
                mainModule === 'operadores' && activeSubTab === 'abastecimento' ? 'bg-[#f5a623] text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 bg-transparent'
              }`}
            >
              Análise de Abastecimento Diário
            </button>
            <button 
              type="button"
              onClick={() => setMainModule('tmr')}
              className={`px-3 py-1.5 rounded-lg font-sans font-black text-[10px] uppercase tracking-wider transition-all border-none cursor-pointer ${
                mainModule === 'tmr' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800 bg-transparent'
              }`}
            >
              🏬 TMR (Tempo Médio)
            </button>
          </div>

          {/* DTO Operadores Shortcut */}
          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('open_dto_operacao', { detail: { operacao: 'efc' } }));
              window.dispatchEvent(new CustomEvent('app_navigate', { detail: { panel: 'dto-diagnostico', operacao: 'efc' } }));
            }}
            className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-xs border border-purple-400/40 hover:scale-[1.02] active:scale-95"
            title="Abrir Diagnóstico DTO Operacional de Operadores (EFC/EFD)"
          >
            <ClipboardCheck className="w-3.5 h-3.5 text-purple-200" />
            DTO Operadores
          </button>

          {/* DTO Montagem Shortcut */}
          <button 
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('open_dto_operacao', { detail: { operacao: 'montagem' } }));
              window.dispatchEvent(new CustomEvent('app_navigate', { detail: { panel: 'dto-diagnostico', operacao: 'montagem' } }));
            }}
            className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl font-black text-[10px] transition-all cursor-pointer flex items-center gap-1.5 shadow-xs uppercase tracking-wider border border-indigo-400/40 hover:scale-[1.02] active:scale-95"
            title="Abrir Diagnóstico DTO Operacional de Montagem"
          >
            <ClipboardCheck className="w-3.5 h-3.5 text-indigo-200" /> DTO Montagem
          </button>

          {/* Padrão Operacional */}
          <button 
            type="button"
            onClick={() => setIsPopModalOpen(true)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-[10px] transition-all cursor-pointer flex items-center gap-1.5 shadow-xs uppercase tracking-wider"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-200" /> Padrão Operacional
          </button>

          {/* Exportar XLS */}
          {mainModule === 'operadores' && activeSubTab === 'indicadores' && (
            <button 
              type="button"
              onClick={handleExportXLSX}
              className="px-3 py-1.5 text-[10px] font-black bg-emerald-50 hover:bg-emerald-100 text-[#10b981] border border-emerald-200 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Exportar XLS
            </button>
          )}
        </div>
      </div>

      {mainModule === 'tmr' && (
        <TmrDashboard user={user} empresa={empresa} theme={theme} />
      )}

      {(mainModule === 'operadores' || mainModule === 'rr_bi') && (
        <div id="picking-dashboard-wrapper" className={`flex flex-col gap-4 selection:bg-amber-100 selection:text-slate-950 p-4 rounded-2xl border shadow-sm ${
          theme === 'dark' ? 'bg-[#0f172a] border-[#1e293b] text-slate-100' : 'bg-white border-slate-200 text-slate-800'
        }`}>

      {loading ? (
        <div className="bg-white border border-slate-200 p-16 rounded-2xl text-center flex flex-col items-center justify-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-full border-2 border-[#f5a623] border-t-transparent animate-spin"></div>
          <span className="text-xs text-slate-500 uppercase font-mono tracking-widest">Sincronizando fila de tarefas do picking...</span>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {activeSubTab === 'indicadores' ? (
            <motion.div 
              key="indicators-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-4"
            >
              {/* MANUAL DE INSTRUÇÃO E METAS */}
              <ManualInstrucaoCard
                title="Manual de Instrução & Parâmetros de Meta — Processo de Picking"
                metrics={[
                  {
                    key: 'picking_produtividade',
                    label: 'Produtividade Média de Picking',
                    unit: 'cx/h',
                    comoCalcular: '(Total de Caixas Separadas no Picking) ÷ (Soma das Horas Trabalhadas pelos Separadores no Turno).'
                  },
                  {
                    key: 'taxa_abastecimento',
                    label: 'Taxa de Abastecimento do Picking',
                    unit: '%',
                    comoCalcular: '(Ocorrências de Reabastecimento de Posição de Picking Concluídas dentro da Janela) ÷ (Total de Solicitações Geradas) × 100.'
                  },
                  {
                    key: 'erro_picking',
                    label: 'Índice de Erros de Separação',
                    unit: '%',
                    comoCalcular: '(Quantidade de Caixas/Paletes com Erro Detectado na Conferência) ÷ (Total de Caixas Auditadas) × 100.'
                  }
                ]}
              />
              
              {/* --- DYNAMIC GLOBAL FILTER SECTION --- */}
              {renderFilterBar("Filtros Globais de Operação")}

              {/* --- 4 PRINCIPAIS CARDS DE DESEMPENHO --- */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* 1. Solicitações */}
                <div className="bg-white border border-gray-200 p-4 rounded-xl relative overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-sm transition-all h-[110px]">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">Solicitações</span>
                    <span className="text-3xl font-black font-mono text-[#032b5e] mt-1 block">
                      {filteredTasks.length}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 block font-medium mt-1">
                    {statsCards.pendentes} pendentes • {statsCards.emAtendimento} em andamento
                  </span>
                  <div className="absolute top-4 right-4 bg-blue-50 p-2 rounded-lg text-[#032b5e]">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                </div>

                {/* 2. Dinâmico: Paletes / Hectolitros / Caixas Movimentadas */}
                <div className="bg-white border border-gray-200 p-4 rounded-xl relative overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-sm transition-all h-[110px]">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">
                      {metricViewMode === 'paletes' ? 'Paletes Movimentados' : metricViewMode === 'hectolitros' ? 'Hectolitros Movimentados' : 'Caixas Movimentadas'}
                    </span>
                    <span className={`text-3xl font-black font-mono mt-1 block ${
                      metricViewMode === 'paletes' ? 'text-emerald-600' : metricViewMode === 'hectolitros' ? 'text-blue-600' : 'text-purple-600'
                    }`}>
                      {metricViewMode === 'paletes' ? (
                        <>{statsCards.paletesMovimentados} <span className="text-sm font-sans font-extrabold text-emerald-500">PL</span></>
                      ) : metricViewMode === 'hectolitros' ? (
                        <>{statsCards.hectolitrosMovimentados.toLocaleString()} <span className="text-sm font-sans font-extrabold text-blue-500">HL</span></>
                      ) : (
                        <>{statsCards.caixasMovimentadas.toLocaleString()} <span className="text-sm font-sans font-extrabold text-purple-500">CX</span></>
                      )}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 block font-medium mt-1">
                    {statsCards.concluidas} concluídas de {filteredTasks.length} solicitadas
                  </span>
                  <div className={`absolute top-4 right-4 p-2 rounded-lg ${
                    metricViewMode === 'paletes' ? 'bg-emerald-50 text-emerald-600' : metricViewMode === 'hectolitros' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                  }`}>
                    {metricViewMode === 'paletes' ? <Layers className="w-5 h-5" /> : metricViewMode === 'hectolitros' ? <Activity className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                  </div>
                </div>

                {/* 3. Tempo Médio */}
                <div className="bg-white border border-gray-200 p-4 rounded-xl relative overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-sm transition-all h-[110px]">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">Tempo Médio</span>
                    <span className="text-3xl font-black font-mono text-amber-600 mt-1 block">
                      {statsCards.tempoMedioAtendimento} <span className="text-sm font-sans font-extrabold text-amber-500">min</span>
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 block font-medium mt-1">
                    Média de ciclo total do processo
                  </span>
                  <div className="absolute top-4 right-4 bg-amber-50 p-2 rounded-lg text-amber-600">
                    <Clock3 className="w-5 h-5" />
                  </div>
                </div>

                {/* 4. SLA Global */}
                <div className="bg-white border border-gray-200 p-4 rounded-xl relative overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-sm transition-all h-[110px]">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">SLA Global</span>
                    <span className="text-3xl font-black font-mono text-blue-600 mt-1 block">
                      {slaStats.pctWithin}%
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 block font-medium mt-1">
                    Dentro da meta limite de {slaLimit}m
                  </span>
                  <div className="absolute top-4 right-4 bg-blue-50 p-2 rounded-lg text-blue-600">
                    <Award className="w-5 h-5" />
                  </div>
                </div>

              </div>

              {/* --- CHARTS GRID SECTION (BENTO GRID STYLE) --- */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

                {/* 6. TOP 10 SKUS MAIS ABASTECIDOS NO PICKING */}
                <div className="lg:col-span-4 bg-white border border-slate-200/80 p-4.5 rounded-2xl flex flex-col justify-between gap-3 shadow-sm">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                        <Package className="w-4 h-4" />
                      </div>
                      <span className="text-xs uppercase font-black text-slate-700 tracking-wider">
                        6. TOP 10 SKUS MAIS ABASTECIDOS NO PICKING
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-400 uppercase block font-bold mb-3">
                      LISTA DOS PRODUTOS DE MAIOR GIRO NO PERÍODO
                    </span>

                    <div className="border border-slate-200/80 rounded-xl overflow-hidden bg-white shadow-2xs">
                      <table className="w-full text-left text-xs border-collapse table-fixed">
                        <thead>
                          <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-500 uppercase font-bold text-[9px] tracking-wider">
                            <th className="py-1.5 px-2.5 w-[52%]">SKU / PRODUTO</th>
                            <th className="py-1.5 px-2 text-center w-[23%]">SOLIC.</th>
                            <th className="py-1.5 px-2 text-right w-[25%]">PALETES</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {skuRanking.slice(0, 10).map((sku, idx) => (
                            <tr key={idx} className="hover:bg-blue-50/30 transition-all text-[10px]">
                              <td className="py-1.5 px-2.5 font-bold">
                                <div className="flex flex-col min-w-0">
                                  <span className="font-mono text-[9.5px] text-amber-600 font-extrabold leading-tight">#{sku.sku}</span>
                                  <span className="text-[9.5px] truncate text-slate-600 font-semibold leading-tight" title={sku.desc}>{sku.desc}</span>
                                </div>
                              </td>
                              <td className="py-1.5 px-2 text-center font-mono text-blue-600 font-bold text-[11px] align-middle">{sku.requests}</td>
                              <td className="py-1.5 px-2 text-right font-mono text-emerald-600 font-black text-[11px] align-middle">{sku.pallets} PL</td>
                            </tr>
                          ))}
                          {skuRanking.length === 0 && (
                            <tr>
                              <td colSpan={3} className="p-4 text-center text-slate-400 font-mono text-[10px] uppercase">Nenhum produto registrado</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-[10px] font-black uppercase text-slate-400">
                    <span>Total de SKUs Ativos: {skuRanking.length}</span>
                    <span className="text-blue-600 font-bold">Abastecimento de Giro</span>
                  </div>
                </div>

                {/* 2. Gráfico de Paletes Finalizados por Hora (8 Columns) */}
                <div className="lg:col-span-8 bg-white border border-slate-200 p-4 rounded-2xl flex flex-col justify-between shadow-sm">
                  <div>
                    <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider block mb-1 flex items-center gap-1.5">
                      <BarChart2 className="w-4 h-4 text-amber-500" />
                      2. Histograma de Paletes Finalizados por Hora do Dia
                    </span>
                    <span className="text-[8px] text-slate-400 block font-bold mb-4 uppercase">Volume acumulado de paletes concluídos pelos operadores por faixa horária (Produtividade de Turno)</span>
                  </div>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={finalizedPalletsByHour} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="hour" stroke="#475569" fontSize={9} fontWeight="bold" />
                        <YAxis stroke="#475569" fontSize={9} fontWeight="bold" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}
                          labelClassName="text-slate-800 text-xs font-black"
                          formatter={(value: any) => [`${value} palete(s)`, 'Paletes Finalizados']}
                        />
                        <Bar dataKey="quantidade" fill="#f5a623" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                          {finalizedPalletsByHour.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#f5a623' : '#d97706'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

              {/* SECOND GRID ROW */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                
                {/* 3. Tempo Médio por Operador (Horizontal bar chart - sorted by efficiency) (6 Columns) */}
                <div className="lg:col-span-6 bg-white border border-slate-200 p-4 rounded-2xl flex flex-col justify-between shadow-sm">
                  <div>
                    <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider block mb-1 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      3. Tempo Médio Operacional por Operador de Empilhadeira
                    </span>
                    <span className="text-[8px] text-slate-400 uppercase block font-bold mb-4">Ordenado de forma decrescente por velocidade média de atendimento de Ordens</span>
                  </div>

                  <div className="h-64 w-full">
                    {operatorAvgTimeData.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-xs text-slate-400 font-mono uppercase tracking-wider">
                        Nenhuma tarefa concluída no período selecionado.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={operatorAvgTimeData} 
                          layout="vertical"
                          margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis type="number" stroke="#475569" fontSize={9} fontWeight="bold" label={{ value: 'Tempo Médio (Min)', position: 'insideBottom', offset: -2, style: { fontSize: 8, fill: '#475569', fontWeight: 'bold' } }} />
                          <YAxis dataKey="operator" type="category" stroke="#475569" fontSize={8} fontWeight="bold" width={80} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}
                            labelClassName="text-slate-800 text-xs font-black"
                          />
                          <Bar dataKey="avgTime" name="Tempo Médio (min)" fill="#3b82f6" radius={[0, 4, 4, 0]} isAnimationActive={false}>
                            {operatorAvgTimeData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#3b82f6'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* 7. Durante x Após Carregamento (Pie Chart) (3 Columns) */}
                <div className="lg:col-span-3 bg-white border border-slate-200 p-4 rounded-2xl flex flex-col justify-between shadow-sm relative">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider flex items-center gap-1.5">
                        <Truck className="w-4 h-4 text-amber-500" />
                        7. Carregamento Ativo vs Após
                      </span>
                      <span className="text-[8.5px] bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded font-black uppercase shrink-0">
                        Pareto 70/30
                      </span>
                    </div>
                    <span className="text-[8px] text-slate-400 uppercase block font-bold mb-4">Volume total distribuído por etapa</span>
                  </div>

                  <div className="h-36 w-full flex items-center justify-center relative my-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={duringVsAfterData.chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={42}
                          outerRadius={60}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          <Cell key="cell-0" fill="#a855f7" />
                          <Cell key="cell-1" fill="#ec4899" />
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}
                          itemStyle={{ fontSize: 10, fontWeight: 'bold', color: '#1e293b' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute flex flex-col items-center pointer-events-none">
                      <span className="text-slate-400 text-[7.5px] uppercase font-bold">Pareto</span>
                      <span className={`text-xs font-black ${duringVsAfterData.isParetoBroken ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {duringVsAfterData.durantePct}%
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 mt-2 border-t border-slate-200 pt-2 text-[10px] font-black uppercase">
                    <div className="flex justify-between items-center text-purple-600">
                      <span>Durante Carregamento (Meta ≥70%)</span>
                      <span>{duringVsAfterData.durantePct}% ({duringVsAfterData.durante} PL)</span>
                    </div>
                    <div className="flex justify-between items-center text-pink-600">
                      <span>Após Carregamento (Meta ≤30%)</span>
                      <span>{duringVsAfterData.aposPct}% ({duringVsAfterData.apos} PL)</span>
                    </div>
                  </div>
                </div>

                {/* 9. Status das Solicitações (Donut Chart) (3 Columns) */}
                <div className="lg:col-span-3 bg-white border border-slate-200 p-4 rounded-2xl flex flex-col justify-between shadow-sm">
                  <div>
                    <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider block mb-1 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-emerald-500" />
                      9. Distribuição de Status
                    </span>
                    <span className="text-[8px] text-slate-400 uppercase block font-bold mb-4">Volume total na fila atual</span>
                  </div>

                  <div className="h-44 w-full flex items-center justify-center relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusRingData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={65}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {statusRingData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}
                          itemStyle={{ fontSize: 10, fontWeight: 'bold', color: '#1e293b' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-slate-400 text-[8px] uppercase font-bold">Total</span>
                      <span className="text-sm font-black text-slate-800">{filteredTasks.length}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 mt-3 border-t border-slate-200 pt-2 text-[8px] font-black uppercase">
                    {statusRingData.map((st, idx) => (
                      <div key={idx} className="flex items-center gap-1.5" style={{ color: st.color }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: st.color }} />
                        <span>{st.name}: <strong>{st.value}</strong></span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* THIRD GRID ROW - PALLETS BY HOUR & DAILY TREND */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                
                {/* 11. Paletes Movimentados por Hora (Bar Chart) (6 Columns) */}
                <div className="lg:col-span-6 bg-white border border-slate-200 p-4 rounded-2xl flex flex-col justify-between shadow-sm">
                  <div>
                    <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider block mb-1 flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-emerald-500" />
                      3. Paletes Movimentados por Hora
                    </span>
                    <span className="text-[8px] text-slate-400 uppercase block font-bold mb-4">Mapeamento de capacidade expedida por hora (Solicitações Concluídas)</span>
                  </div>

                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={palletsByHour} margin={{ top: 5, right: 5, left: -30, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="hour" stroke="#475569" fontSize={8} fontWeight="bold" />
                        <YAxis stroke="#475569" fontSize={8} fontWeight="bold" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}
                          labelClassName="text-slate-800 text-xs font-black"
                        />
                        <Bar dataKey="pallets" fill="#10b981" radius={[3, 3, 0, 0]} isAnimationActive={false} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 13. Evolução Diária (Line Chart) (6 Columns) */}
                <div className="lg:col-span-6 bg-white border border-slate-200 p-4 rounded-2xl flex flex-col justify-between shadow-sm">
                  <div>
                    <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider block mb-1 flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-sky-500" />
                      4. Tendência de Evolução Diária
                    </span>
                    <span className="text-[8px] text-slate-400 uppercase block font-bold mb-4">Volume de solicitações diárias registradas</span>
                  </div>

                  <div className="h-44 w-full">
                    {dailyEvolution.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-xs text-slate-400 font-mono uppercase">
                        Nenhum registro.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dailyEvolution} margin={{ top: 5, right: 10, left: -30, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="formattedDate" stroke="#475569" fontSize={8} fontWeight="bold" />
                          <YAxis stroke="#475569" fontSize={8} fontWeight="bold" />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}
                            itemStyle={{ fontSize: 10, color: '#1e293b' }}
                          />
                          <Line type="monotone" dataKey="solicitacoes" name="Solicitações" stroke="#3b82f6" strokeWidth={2.5} isAnimationActive={false} activeDot={{ r: 5 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

              </div>

              {/* FOURTH GRID ROW - OPERATOR RANKING & CONFERENTE RANKING */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                
                {/* 4. Ranking de Operadores (6 Columns) */}
                <div className="lg:col-span-6 bg-white border border-slate-200 p-4 rounded-2xl flex flex-col gap-2 shadow-sm">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider block flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-amber-500" />
                        4. Ranking de Produtividade dos Operadores
                      </span>
                      <span className="text-[8px] text-slate-400 uppercase block font-bold">Consolidado por tarefas concluídas no período</span>
                    </div>
                  </div>

                  <div className="overflow-x-auto max-h-64 border border-slate-200 rounded-xl bg-slate-50 shadow-inner">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 uppercase font-bold text-[8px] tracking-wider">
                          <th className="p-2.5">Operador</th>
                          <th className="p-2.5 text-center">Concluídas</th>
                          <th className="p-2.5 text-center">Paletes</th>
                          <th className="p-2.5 text-center">TMA</th>
                          <th className="p-2.5 text-right">SLA</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {operatorsRanking.map((op, idx) => (
                          <tr key={idx} className="hover:bg-slate-100/50 transition-all text-[11px]">
                            <td className="p-2.5 font-bold flex items-center gap-1.5">
                              <span className="text-[9px] font-mono font-black text-slate-600 bg-slate-200 px-1.5 py-0.5 rounded">#{idx+1}</span>
                              <span className="truncate max-w-[150px]" title={op.operator}>{op.operator}</span>
                            </td>
                            <td className="p-2.5 text-center font-mono font-black text-emerald-600">{op.done}</td>
                            <td className="p-2.5 text-center font-mono text-blue-600">{op.pallets}</td>
                            <td className="p-2.5 text-center font-mono text-amber-600">{op.avgTime} min</td>
                            <td className="p-2.5 text-right font-black">
                              <span className={`px-2 py-0.5 rounded text-[9px] ${op.sla >= 85 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-500 border border-red-100'}`}>{op.sla}%</span>
                            </td>
                          </tr>
                        ))}
                        {operatorsRanking.length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-4 text-center text-slate-400 font-mono text-[10px] uppercase">Nenhum operador registrado no período</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 5. Ranking dos Conferentes (6 Columns) */}
                <div className="lg:col-span-6 bg-white border border-slate-200 p-4 rounded-2xl flex flex-col gap-2 shadow-sm">
                  <div>
                    <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider block flex items-center gap-1.5">
                      <User className="w-4 h-4 text-sky-500" />
                      5. Ranking dos Conferentes Emissores
                    </span>
                    <span className="text-[8px] text-slate-400 uppercase block font-bold">Consolidado de solicitações criadas de reabastecimento</span>
                  </div>

                  <div className="overflow-x-auto max-h-64 border border-slate-200 rounded-xl bg-slate-50 shadow-inner">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 uppercase font-bold text-[8px] tracking-wider">
                          <th className="p-2.5">Conferente</th>
                          <th className="p-2.5 text-center">Solicitações</th>
                          <th className="p-2.5 text-center">Andamento</th>
                          <th className="p-2.5 text-center">Concluída</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {conferentesRanking.map((cf, idx) => (
                          <tr key={idx} className="hover:bg-slate-100/50 transition-all text-[11px]">
                            <td className="p-2.5 font-bold flex items-center gap-1.5">
                              <span className="text-[9px] font-mono font-black text-slate-600 bg-slate-200 px-1.5 py-0.5 rounded">#{idx+1}</span>
                              <span className="truncate max-w-[180px]" title={cf.conferente}>{cf.conferente}</span>
                            </td>
                            <td className="p-2.5 text-center font-mono font-black text-amber-600">{cf.requests}</td>
                            <td className="p-2.5 text-center font-mono font-black text-blue-600">{cf.andamento}</td>
                            <td className="p-2.5 text-center font-mono font-black text-emerald-600">{cf.done}</td>
                          </tr>
                        ))}
                        {conferentesRanking.length === 0 && (
                          <tr>
                            <td colSpan={4} className="p-4 text-center text-slate-400 font-mono text-[10px] uppercase">Nenhum conferente registrado no período</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              {/* FIFTH GRID ROW - OPERATOR PRODUCTIVITY TABLE */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                
                {/* 14. Produtividade Detalhada dos Operadores (12 Columns) */}
                <div className="lg:col-span-12 bg-white border border-slate-200 p-4 rounded-2xl flex flex-col gap-2 shadow-sm">
                  <div>
                    <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider block flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-emerald-500" />
                      14. Tabela de Produtividade Detalhada dos Operadores
                    </span>
                    <span className="text-[8px] text-slate-400 uppercase block font-bold">Rastreamento de ociosidade, pallets por hora e índice de eficiência operativa</span>
                  </div>

                  <div className="overflow-x-auto max-h-72 border border-slate-200 rounded-xl bg-slate-50 shadow-inner">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 uppercase font-bold text-[8px] tracking-wider">
                          <th className="p-2.5">Operador</th>
                          <th className="p-2.5 text-center">Tempo Médio</th>
                          <th className="p-2.5 text-center">Paletes</th>
                          <th className="p-2.5 text-center">Solicitações</th>
                          <th className="p-2.5 text-center">PL/Hora</th>
                          <th className="p-2.5 text-center">Tempo Parado</th>
                          <th className="p-2.5 text-right">Eficiência</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {operatorsProductivityTable.map((op, idx) => (
                          <tr key={idx} className="hover:bg-slate-100/50 transition-all text-[11px]">
                            <td className="p-2.5 font-bold text-slate-700">{op.operator}</td>
                            <td className="p-2.5 text-center font-mono text-slate-500">{op.avgTime} min</td>
                            <td className="p-2.5 text-center font-mono text-blue-600">{op.pallets}</td>
                            <td className="p-2.5 text-center font-mono text-slate-500">{op.requests}</td>
                            <td className="p-2.5 text-center font-mono text-amber-600 font-bold">{op.palletsPerHour}</td>
                            <td className="p-2.5 text-center font-mono text-red-500">{op.idleTime}</td>
                            <td className="p-2.5 text-right font-black">
                              <span className={`px-2 py-0.5 rounded text-[9px] ${op.efficiency >= 85 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-500 border border-red-100'}`}>{op.efficiency}%</span>
                            </td>
                          </tr>
                        ))}
                        {operatorsProductivityTable.length === 0 && (
                          <tr>
                            <td colSpan={7} className="p-4 text-center text-slate-400 font-mono text-[10px] uppercase">Nenhum operador com registro concluído</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Card de Registros Filtrados por Meta (Aparece quando o filtro de meta estiver ativo) */}
                {selectedMeta !== 'all' && (
                  <div className="lg:col-span-12 bg-white border border-slate-200 p-4 rounded-2xl flex flex-col gap-3 shadow-sm">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <span className="text-[10px] uppercase font-black text-slate-500 tracking-wider block flex items-center gap-1.5">
                          <CheckCircle2 className={`w-4 h-4 ${selectedMeta === 'dentro' ? 'text-emerald-500' : 'text-amber-500'}`} />
                          15. Registros {selectedMeta === 'dentro' ? 'Dentro da Meta (≤ 5 min/PL)' : 'Fora da Meta (> 5 min/PL)'} ({filteredTasks.length})
                        </span>
                        <span className="text-[8px] text-slate-400 uppercase block font-bold">Detalhamento individual de todas as solicitações filtradas por este indicador de meta</span>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase border ${
                        selectedMeta === 'dentro' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {selectedMeta === 'dentro' ? 'Dentro da Meta' : 'Fora da Meta'}
                      </span>
                    </div>

                    <div className="overflow-x-auto max-h-80 border border-slate-200 rounded-xl bg-slate-50 shadow-inner">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 uppercase font-bold text-[8px] tracking-wider">
                            <th className="p-2.5">ID / Código</th>
                            <th className="p-2.5">SKU / Produto</th>
                            <th className="p-2.5 text-center">Conferente</th>
                            <th className="p-2.5 text-center">Operador</th>
                            <th className="p-2.5 text-center">Paletes</th>
                            <th className="p-2.5 text-center">Tempo Total</th>
                            <th className="p-2.5 text-center">Meta Est.</th>
                            <th className="p-2.5 text-center">Status</th>
                            <th className="p-2.5 text-right">Data/Hora</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {filteredTasks.map((t, idx) => {
                            const targetMin = (t.quantidadePaletes || 1) * 5;
                            const isWithin = t.tempoTotal <= targetMin;
                            return (
                              <tr key={t.id || idx} className="hover:bg-slate-100/50 transition-all text-[11px]">
                                <td className="p-2.5 font-mono font-bold text-slate-700">#{t.id}</td>
                                <td className="p-2.5 font-bold">
                                  <div className="flex flex-col">
                                    <span className="font-mono text-[10px] text-amber-600">#{t.sku}</span>
                                    <span className="text-[10px] truncate max-w-[200px] text-slate-500 font-normal" title={t.descricaoSku}>{t.descricaoSku}</span>
                                  </div>
                                </td>
                                <td className="p-2.5 text-center font-semibold text-slate-600">{t.conferente}</td>
                                <td className="p-2.5 text-center font-semibold text-slate-600">{t.operador}</td>
                                <td className="p-2.5 text-center font-mono font-bold text-blue-600">{t.quantidadePaletes} PL</td>
                                <td className="p-2.5 text-center font-mono font-bold text-slate-700">{t.tempoTotal} min</td>
                                <td className="p-2.5 text-center font-mono text-slate-400">≤ {targetMin} min</td>
                                <td className="p-2.5 text-center">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                    isWithin 
                                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                      : 'bg-amber-50 text-amber-600 border border-amber-100'
                                  }`}>
                                    {isWithin ? 'Dentro' : 'Fora'}
                                  </span>
                                </td>
                                <td className="p-2.5 text-right font-mono text-[10px] text-slate-500">
                                  {t.dataConclusao || t.dataSolicitacao} {t.horaConclusaoStr !== '—' ? t.horaConclusaoStr : t.horaSolicitacaoStr}
                                </td>
                              </tr>
                            );
                          })}
                          {filteredTasks.length === 0 && (
                            <tr>
                              <td colSpan={9} className="p-4 text-center text-slate-400 font-mono text-[10px] uppercase">
                                Nenhum registro encontrado para a meta selecionada
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </div>

            </motion.div>
          ) : activeSubTab === 'rr_bi' ? (
            <motion.div 
              key="rr-bi-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-6"
            >
              {/* FIXED TOP BLOCK FOR R&R METAS */}
              <IndicatorMetaHeader
                indicatorName="R&R (Ressuprimento & Reabastecimento)"
                theme={theme}
                metas={[
                  {
                    id: 'meta_rr_tempo',
                    label: 'Meta Tempo por Pallet',
                    value: metaRrTempo,
                    unit: 'min/PL',
                    step: 0.5,
                    min: 0.5,
                    onChange: updateMetaRrTempo,
                    calculationText: 'Tempo total de movimentação de paletes de R&R ÷ Total de paletes movimentados'
                  },
                  {
                    id: 'meta_rr_max_reab',
                    label: 'Meta Máxima de Reabastecimento',
                    value: metaRrMaxReab,
                    unit: '%',
                    step: 1,
                    min: 0,
                    max: 100,
                    onChange: updateMetaRrMaxReab,
                    calculationText: '(Pallets de Reabastecimento durante carga ÷ Pallets de Ressuprimento pré-carga) × 100. Deve ser <= 20%'
                  }
                ]}
              />

              {/* FILTER BAR - METRICAS DE R&R E SLOTTING COM MESMOS FILTROS GLOBAIS */}
              {renderFilterBar("Filtros nas Métricas de R&R e Slotting")}

              {/* 1. BANNER METAS OFICIAIS DE RESSUPRIMENTO & REABASTECIMENTO */}
              <div className="bg-gradient-to-r from-slate-900 via-[#032b5e] to-slate-900 border border-blue-900 p-5 rounded-2xl text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-400 mt-0.5">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase text-amber-400 tracking-widest block">Metas Oficiais Ambev • Operações de Pátio & Picking</span>
                    <h3 className="text-lg font-black text-white mt-0.5">Diretrizes de SLA para Ressuprimento & Reabastecimento (R&R)</h3>
                    <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                      • <strong className="text-amber-300">Tempo Médio de Ressuprimento:</strong> Meta limite de <span className="underline decoration-amber-400 decoration-2 font-bold">5 minutos por pallet</span>, contado do início da atividade pelo empilhador.
                      <br />
                      • <strong className="text-emerald-300">Limite de Reabastecimento:</strong> O volume de Reabastecimento (durante a carga) <span className="underline decoration-emerald-400 decoration-2 font-bold">não pode ultrapassar 20%</span> em relação ao volume de Ressuprimento (pré-carga).
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* CARD GATILHO 1: RATIO REAB/RESSUP */}
                  <div className={`p-3.5 rounded-xl border flex flex-col items-center justify-between min-w-[155px] transition-all shadow-md ${
                    rrMetrics.isRatioTargetMet 
                      ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200' 
                      : 'bg-red-950/90 border-red-500 text-red-100 ring-2 ring-red-500/60 animate-pulse'
                  }`}>
                    {/* NOME GATILHO EM CIMA */}
                    <div className="flex items-center gap-1 mb-1">
                      <Target className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="text-[10px] uppercase font-black tracking-wider text-amber-300">Gatilho • Ratio</span>
                    </div>

                    {/* META ARREDONDADA */}
                    <div className="flex flex-col items-center my-0.5">
                      <span className="text-[9px] uppercase font-bold text-slate-300">Meta Oficial</span>
                      <span className="text-2xl font-black font-mono text-white leading-tight">
                        ≤ {Math.round(metaRrMaxReab)}%
                      </span>
                    </div>

                    {/* REAL EM BAIXO */}
                    <div className="flex items-center justify-between w-full px-2 py-1 mt-1 rounded bg-black/25 text-[10px] font-bold border border-white/10">
                      <span className="text-slate-300">Real:</span>
                      <span className={`font-mono font-black ${rrMetrics.isRatioTargetMet ? 'text-emerald-300' : 'text-red-300 underline'}`}>
                        {rrMetrics.ratioReabastecimentoRessuprimento}%
                      </span>
                    </div>

                    {/* ALERTA SE ESTOURAR */}
                    <div className="mt-1.5 w-full text-center">
                      {rrMetrics.isRatioTargetMet ? (
                        <span className="text-[8.5px] font-black uppercase text-emerald-300 bg-emerald-900/60 border border-emerald-500/40 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                          ✓ Dentro da Meta
                        </span>
                      ) : (
                        <span className="text-[8.5px] font-black uppercase text-red-100 bg-red-800 border border-red-400 px-2 py-0.5 rounded-full flex items-center justify-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-yellow-300 shrink-0" />
                          🚨 ALERTA: GATILHO ESTOURADO!
                        </span>
                      )}
                    </div>
                  </div>

                  {/* CARD GATILHO 2: TEMPO MÉDIO / PL */}
                  <div className={`p-3.5 rounded-xl border flex flex-col items-center justify-between min-w-[155px] transition-all shadow-md ${
                    rrMetrics.isTimeTargetMet 
                      ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200' 
                      : 'bg-red-950/90 border-red-500 text-red-100 ring-2 ring-red-500/60 animate-pulse'
                  }`}>
                    {/* NOME GATILHO EM CIMA */}
                    <div className="flex items-center gap-1 mb-1">
                      <Target className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="text-[10px] uppercase font-black tracking-wider text-amber-300">Gatilho • Tempo</span>
                    </div>

                    {/* META ARREDONDADA */}
                    <div className="flex flex-col items-center my-0.5">
                      <span className="text-[9px] uppercase font-bold text-slate-300">Meta Oficial</span>
                      <span className="text-2xl font-black font-mono text-white leading-tight">
                        ≤ {Math.round(metaRrTempo)} min
                      </span>
                    </div>

                    {/* REAL EM BAIXO */}
                    <div className="flex items-center justify-between w-full px-2 py-1 mt-1 rounded bg-black/25 text-[10px] font-bold border border-white/10">
                      <span className="text-slate-300">Real:</span>
                      <span className={`font-mono font-black ${rrMetrics.isTimeTargetMet ? 'text-emerald-300' : 'text-red-300 underline'}`}>
                        {rrMetrics.tempoMedioAtividade} min/PL
                      </span>
                    </div>

                    {/* ALERTA SE ESTOURAR */}
                    <div className="mt-1.5 w-full text-center">
                      {rrMetrics.isTimeTargetMet ? (
                        <span className="text-[8.5px] font-black uppercase text-emerald-300 bg-emerald-900/60 border border-emerald-500/40 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                          ✓ Dentro da Meta
                        </span>
                      ) : (
                        <span className="text-[8.5px] font-black uppercase text-red-100 bg-red-800 border border-red-400 px-2 py-0.5 rounded-full flex items-center justify-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-yellow-300 shrink-0" />
                          🚨 ALERTA: TEMPO ESTOURADO!
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. TOP 4 CARDS DE MÉTRICAS R&R */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* CARD 1: % Abastecimento vs % Reabastecimento */}
                <div className={`border p-4 rounded-xl flex flex-col justify-between shadow-xs ${
                  rrMetrics.isRatioTargetMet ? 'bg-white border-slate-200' : 'bg-red-50/50 border-red-300'
                }`}>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">% Ressup vs Reab</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        Gatilho: Meta ≤ {Math.round(metaRrMaxReab)}%
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="text-2xl font-black font-mono text-emerald-600">{rrMetrics.pctRessuprimento}%</span>
                      <span className="text-xs text-slate-500 font-bold">Ressup ({rrMetrics.volumeRessuprimento.toLocaleString()} {rrMetrics.unit})</span>
                    </div>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-lg font-black font-mono text-amber-600">{rrMetrics.pctReabastecimento}%</span>
                      <span className="text-xs text-slate-500 font-bold">Reab ({rrMetrics.volumeReabastecimento.toLocaleString()} {rrMetrics.unit})</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                    <span className="text-slate-500 font-bold">Ratio Real vs Gatilho:</span>
                    <span className={`font-black font-mono px-2 py-0.5 rounded flex items-center gap-1 ${
                      rrMetrics.isRatioTargetMet ? 'bg-emerald-50 text-emerald-700' : 'bg-red-100 text-red-700 font-black ring-1 ring-red-400'
                    }`}>
                      {!rrMetrics.isRatioTargetMet && <AlertTriangle className="w-3 h-3 text-red-600 shrink-0" />}
                      Real: {rrMetrics.ratioReabastecimentoRessuprimento}% (Meta ≤ {Math.round(metaRrMaxReab)}%)
                    </span>
                  </div>
                </div>

                {/* CARD 2: Volume Ressuprido (Dinâmico HL, CX, PL) */}
                <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col justify-between shadow-xs">
                  <div>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                      {metricViewMode === 'hectolitros' ? 'Volume Ressuprido em HL' : metricViewMode === 'caixas' ? 'Volume Ressuprido em Caixas' : 'Volume Ressuprido em Paletes'}
                    </span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className={`text-3xl font-black font-mono ${metricViewMode === 'hectolitros' ? 'text-blue-600' : metricViewMode === 'caixas' ? 'text-purple-600' : 'text-emerald-600'}`}>
                        {rrMetrics.volumeRessuprimento.toLocaleString()}
                      </span>
                      <span className={`text-sm font-sans font-black ${metricViewMode === 'hectolitros' ? 'text-blue-500' : metricViewMode === 'caixas' ? 'text-purple-500' : 'text-emerald-500'}`}>
                        {rrMetrics.unit}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium block mt-1">
                      {rrMetrics.paletesRessuprimento.toLocaleString()} paletes de ressuprimento pré-carga
                    </span>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-bold">
                    <span>Volume Geral Pátio:</span>
                    <span className="font-mono text-slate-800 font-black">{rrMetrics.volumeTotal.toLocaleString()} {rrMetrics.unit}</span>
                  </div>
                </div>

                {/* CARD 3: Curva ABC de Ressuprimento (Faixas Bem Distribuídas para Curva C) */}
                <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col justify-between shadow-xs">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Curva ABC de Ressuprimento</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[8.5px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1" title="Sincronizado automaticamente com a Visão Comercial / Curva ABC Trimestral (03.05.19)">
                          <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                          Base: {abcCurveData.quarterBase === 'ANUAL' ? 'Consolidado Anual' : `${abcCurveData.quarterBase.replace('Q', '')}º Tri (${abcCurveData.quarterBase})`}
                        </span>
                      </div>
                    </div>

                    {/* Linha 1: Meta Pareto Picking (Distribuição Visual Confortável com Curva C Espaçosa) */}
                    <div className="mt-2.5">
                      <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 mb-1">
                        <span className="uppercase tracking-wider">Meta (Pareto Picking):</span>
                        <span className="font-mono text-slate-600 font-bold">80% / 15% / 5%</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1">
                        <div className="col-span-7 bg-emerald-500 text-white text-[9.5px] font-black py-1 px-1 text-center rounded shadow-xs whitespace-nowrap" title="Meta Curva A: 80% do volume total de picking">
                          A: 80%
                        </div>
                        <div className="col-span-3 bg-blue-500 text-white text-[9.5px] font-black py-1 px-1 text-center rounded shadow-xs whitespace-nowrap" title="Meta Curva B: 15% do volume total de picking">
                          B: 15%
                        </div>
                        <div className="col-span-2 bg-slate-500 text-white text-[9.5px] font-black py-1 px-1 text-center rounded shadow-xs whitespace-nowrap" title="Meta Curva C: 5% do volume total de picking">
                          C: 5%
                        </div>
                      </div>
                    </div>

                    {/* Linha 2: Real Executado (Ressuprimento & Reabastecimento - Curva C Confortável e Legível) */}
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-[9px] font-bold text-slate-600 mb-1">
                        <span className="uppercase tracking-wider font-extrabold text-slate-700">Real (Ressup / Reab):</span>
                        <span className="font-mono font-black text-emerald-600">{abcCurveData.pctA}% / {abcCurveData.pctB}% / {abcCurveData.pctC}%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div 
                          style={{ flex: Math.max(35, abcCurveData.pctA), minWidth: '60px' }} 
                          className="bg-emerald-600 text-white text-[9.5px] font-black py-1 px-1 text-center rounded shadow-xs transition-all duration-300 whitespace-nowrap"
                          title={`Real Curva A: ${abcCurveData.volumeA.toLocaleString()} ${abcCurveData.unit} (${abcCurveData.palletsA} PL)`}
                        >
                          A: {abcCurveData.pctA}%
                        </div>
                        <div 
                          style={{ flex: Math.max(22, abcCurveData.pctB), minWidth: '55px' }} 
                          className="bg-blue-600 text-white text-[9.5px] font-black py-1 px-1 text-center rounded shadow-xs transition-all duration-300 whitespace-nowrap"
                          title={`Real Curva B: ${abcCurveData.volumeB.toLocaleString()} ${abcCurveData.unit} (${abcCurveData.palletsB} PL)`}
                        >
                          B: {abcCurveData.pctB}%
                        </div>
                        <div 
                          style={{ flex: Math.max(18, abcCurveData.pctC), minWidth: '55px' }} 
                          className="bg-slate-600 text-white text-[9.5px] font-black py-1 px-1 text-center rounded shadow-xs transition-all duration-300 whitespace-nowrap"
                          title={`Real Curva C: ${abcCurveData.volumeC.toLocaleString()} ${abcCurveData.unit} (${abcCurveData.palletsC} PL)`}
                        >
                          C: {abcCurveData.pctC}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detalhamento das 3 faixas com distribuição equilibrada */}
                  <div className="mt-3 pt-2 border-t border-slate-100 grid grid-cols-3 gap-1 text-[9.5px]">
                    <div className="p-1 rounded bg-emerald-50 text-emerald-800 text-center font-bold">
                      <span className="block text-[8px] uppercase text-emerald-600 font-extrabold">Curva A</span>
                      <span className="font-mono font-black">{abcCurveData.volumeA.toLocaleString()}</span>
                      <span className="text-[8px] block text-emerald-600 font-medium">{abcCurveData.pctA}%</span>
                    </div>
                    <div className="p-1 rounded bg-blue-50 text-blue-800 text-center font-bold">
                      <span className="block text-[8px] uppercase text-blue-600 font-extrabold">Curva B</span>
                      <span className="font-mono font-black">{abcCurveData.volumeB.toLocaleString()}</span>
                      <span className="text-[8px] block text-blue-600 font-medium">{abcCurveData.pctB}%</span>
                    </div>
                    <div className="p-1 rounded bg-slate-100 text-slate-800 text-center font-bold">
                      <span className="block text-[8px] uppercase text-slate-600 font-extrabold">Curva C</span>
                      <span className="font-mono font-black">{abcCurveData.volumeC.toLocaleString()}</span>
                      <span className="text-[8px] block text-slate-600 font-medium">{abcCurveData.pctC}%</span>
                    </div>
                  </div>
                </div>

                {/* CARD 4: Tempo Médio por Atividade */}
                <div className={`border p-4 rounded-xl flex flex-col justify-between shadow-xs ${
                  rrMetrics.isTimeTargetMet ? 'bg-white border-slate-200' : 'bg-red-50/50 border-red-300'
                }`}>
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Gatilho: Tempo Médio</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        Meta: ≤ {Math.round(metaRrTempo)} min/PL
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className={`text-3xl font-black font-mono ${rrMetrics.isTimeTargetMet ? 'text-emerald-600' : 'text-red-600'}`}>
                        {rrMetrics.tempoMedioAtividade}
                      </span>
                      <span className="text-sm font-sans font-black text-slate-500">min/PL</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium block mt-1">
                      Meta oficial: {Math.round(metaRrTempo)} minutos por pallet
                    </span>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                    <span className="text-slate-500 font-bold">Status SLA:</span>
                    <span className={`font-black font-mono px-2 py-0.5 rounded flex items-center gap-1 ${
                      rrMetrics.isTimeTargetMet ? 'bg-emerald-50 text-emerald-700' : 'bg-red-100 text-red-700 font-black ring-1 ring-red-400'
                    }`}>
                      {!rrMetrics.isTimeTargetMet && <AlertTriangle className="w-3 h-3 text-red-600 shrink-0" />}
                      {rrMetrics.isTimeTargetMet ? `${slaStats.pctWithin}% conforme` : `🚨 Excedeu meta (${rrMetrics.tempoMedioAtividade}m > ${Math.round(metaRrTempo)}m)`}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. THREE-COLUMN RANKING TABLES */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* TABLE 1: TOP 10 RESSUPRIMENTO */}
                <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col justify-between shadow-xs">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                        <Package className="w-4 h-4" />
                      </div>
                      <span className="text-xs uppercase font-black text-slate-800 tracking-wider">
                        Top 10 — Maior Ressuprimento (Pré-Carga)
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-400 uppercase block font-bold mb-3">Abastecimento realizado antes do início do carregamento</span>

                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-200 text-slate-500 uppercase font-bold text-[9px]">
                            <th className="p-2">SKU / Fator</th>
                            <th className="p-2 text-center">Curva</th>
                            <th className="p-2 text-right">
                              {metricViewMode === 'hectolitros' ? 'Volume (HL)' : metricViewMode === 'caixas' ? 'Caixas (CX)' : 'Paletes (PL)'}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {top10Ressuprimento.map((item, idx) => {
                            const cxVol = item.pallets * item.fatorPallet;
                            const hlVol = Math.round(cxVol * (item.fatorHecto || 0.072) * 10) / 10;
                            return (
                              <tr key={idx} className="hover:bg-slate-50 text-[10px]">
                                <td className="p-2 font-bold">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono text-amber-600">#{item.sku}</span>
                                    <span className="text-[8px] font-mono font-bold px-1 py-0.2 bg-slate-100 text-slate-600 rounded border border-slate-200">
                                      {item.fatorPallet} cx/PL
                                    </span>
                                  </div>
                                  <span className="truncate block max-w-[150px] text-slate-600 font-normal" title={item.desc}>{item.desc}</span>
                                </td>
                                <td className="p-2 text-center">
                                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase inline-flex items-center justify-center ${
                                    item.curva === 'A' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                    item.curva === 'B' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                    'bg-slate-100 text-slate-700 border border-slate-200'
                                  }`}>
                                    Curva {item.curva || 'A'}
                                  </span>
                                </td>
                                <td className="p-2 text-right font-mono font-black text-emerald-600">
                                  {metricViewMode === 'hectolitros' ? `${hlVol.toLocaleString()} HL` : metricViewMode === 'caixas' ? `${cxVol.toLocaleString()} CX` : `${item.pallets.toLocaleString()} PL`}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* TABLE 2: TOP 10 PALLETS DE REABASTECIMENTO */}
                <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col justify-between shadow-xs">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                          <Layers className="w-4 h-4" />
                        </div>
                        <span className="text-xs uppercase font-black text-slate-800 tracking-wider">
                          Top 10 — Reabastecimento de Pallets (Durante Carga)
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
                        Paulo Pereira
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-400 uppercase block font-bold mb-3">Ressuprimentos corretivos solicitados no turno noturno</span>

                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-200 text-slate-500 uppercase font-bold text-[9px]">
                            <th className="p-2">SKU / Fator</th>
                            <th className="p-2 text-center">Curva</th>
                            <th className="p-2 text-right">
                              {metricViewMode === 'hectolitros' ? 'Volume (HL)' : metricViewMode === 'caixas' ? 'Caixas (CX)' : 'Paletes (PL)'}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {top10Reabastecimento.map((item, idx) => {
                            const cxVol = item.pallets * item.fatorPallet;
                            const hlVol = Math.round(cxVol * (item.fatorHecto || 0.072) * 10) / 10;
                            return (
                              <tr key={idx} className="hover:bg-slate-50 text-[10px]">
                                <td className="p-2 font-bold">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono text-amber-600">#{item.sku}</span>
                                    <span className="text-[8px] font-mono font-bold px-1 py-0.2 bg-slate-100 text-slate-600 rounded border border-slate-200">
                                      {item.fatorPallet} cx/PL
                                    </span>
                                  </div>
                                  <span className="block text-slate-700 font-medium whitespace-normal" title={item.desc}>{item.desc}</span>
                                </td>
                                <td className="p-2 text-center">
                                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase inline-flex items-center justify-center ${
                                    item.curva === 'A' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                    item.curva === 'B' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                    'bg-slate-100 text-slate-700 border border-slate-200'
                                  }`}>
                                    Curva {item.curva || 'A'}
                                  </span>
                                </td>
                                <td className="p-2 text-right font-mono font-black text-amber-600">
                                  {metricViewMode === 'hectolitros' ? `${hlVol.toLocaleString()} HL` : metricViewMode === 'caixas' ? `${cxVol.toLocaleString()} CX` : `${item.pallets.toLocaleString()} PL`}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* TABLE 3: ITENS MENOS ABASTECIDOS */}
                <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col justify-between shadow-xs">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
                        <Clock3 className="w-4 h-4" />
                      </div>
                      <span className="text-xs uppercase font-black text-slate-800 tracking-wider">
                        Itens Menos Abastecidos (Baixo Giro)
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-400 uppercase block font-bold mb-3">Produtos com menor volume de movimentação de pátio</span>

                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-200 text-slate-500 uppercase font-bold text-[9px]">
                            <th className="p-2">SKU / Fator</th>
                            <th className="p-2 text-center">Curva</th>
                            <th className="p-2 text-right">
                              {metricViewMode === 'hectolitros' ? 'Volume (HL)' : metricViewMode === 'caixas' ? 'Caixas (CX)' : 'Paletes (PL)'}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {leastRestockedItems.map((item, idx) => {
                            const cxVol = item.pallets * item.fatorPallet;
                            const hlVol = Math.round(cxVol * (item.fatorHecto || 0.072) * 10) / 10;
                            return (
                              <tr key={idx} className="hover:bg-slate-50 text-[10px]">
                                <td className="p-2 font-bold">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono text-amber-600">#{item.sku}</span>
                                    <span className="text-[8px] font-mono font-bold px-1 py-0.2 bg-slate-100 text-slate-600 rounded border border-slate-200">
                                      {item.fatorPallet} cx/PL
                                    </span>
                                  </div>
                                  <span className="truncate block max-w-[150px] text-slate-600 font-normal" title={item.desc}>{item.desc}</span>
                                </td>
                                <td className="p-2 text-center">
                                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase inline-flex items-center justify-center ${
                                    item.curva === 'A' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                    item.curva === 'B' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                    'bg-slate-100 text-slate-700 border border-slate-200'
                                  }`}>
                                    Curva {item.curva || 'C'}
                                  </span>
                                </td>
                                <td className="p-2 text-right font-mono font-black text-slate-600">
                                  {metricViewMode === 'hectolitros' ? `${hlVol.toLocaleString()} HL` : metricViewMode === 'caixas' ? `${cxVol.toLocaleString()} CX` : `${item.pallets.toLocaleString()} PL`}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. COMPARATIVO MÊS ANTERIOR X MÊS ATUAL & EVOLUÇÃO DOS ÚLTIMOS 4 MESES */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Comparativo Mês Anterior x Mês Atual (Table + Badges) (7 Columns) */}
                <div className="lg:col-span-7 bg-white border border-slate-200 p-5 rounded-2xl flex flex-col justify-between shadow-xs">
                  <div>
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                      <span className="text-xs font-black uppercase text-slate-800 tracking-wider block flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                        Comparativo Operacional: Mês Anterior (Julho) x Mês Atual (Agosto)
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Tendência Positiva
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-400 uppercase block font-bold mb-3">Análise comparativa de volume, tempos médios e atingimento de metas R&R</span>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl bg-slate-50">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 uppercase font-bold text-[9px] tracking-wider">
                            <th className="p-2.5">Indicador / Métrica R&R</th>
                            <th className="p-2.5 text-center">Julho (Mês Anterior)</th>
                            <th className="p-2.5 text-center">Agosto (Mês Atual)</th>
                            <th className="p-2.5 text-center">Variação</th>
                            <th className="p-2.5 text-right">Meta SLA</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-slate-700 text-xs">
                          <tr>
                            <td className="p-2.5 font-bold text-slate-800">Paletes Movimentados</td>
                            <td className="p-2.5 text-center font-mono text-slate-600">680 PL</td>
                            <td className="p-2.5 text-center font-mono font-bold text-blue-600">{monthlyComparisonStats.current.totalPallets} PL</td>
                            <td className="p-2.5 text-center font-mono font-black text-emerald-600">+8.5%</td>
                            <td className="p-2.5 text-right font-mono text-slate-500 text-[10px]">Capacidade 160 PL</td>
                          </tr>
                          <tr>
                            <td className="p-2.5 font-bold text-slate-800">Tempo Médio por Palete</td>
                            <td className="p-2.5 text-center font-mono text-slate-600">4:40 min</td>
                            <td className="p-2.5 text-center font-mono font-bold text-emerald-600">4:35 min</td>
                            <td className="p-2.5 text-center font-mono font-black text-emerald-600">-5s (Melhoria)</td>
                            <td className="p-2.5 text-right font-mono font-bold text-emerald-600 text-[10px]">Meta: ≤ 5:00 min</td>
                          </tr>
                          <tr>
                            <td className="p-2.5 font-bold text-slate-800">% Reabastecimento (Pallets)</td>
                            <td className="p-2.5 text-center font-mono text-slate-600">17.8%</td>
                            <td className="p-2.5 text-center font-mono font-bold text-slate-800">16.5%</td>
                            <td className="p-2.5 text-center font-mono font-black text-emerald-600">-1.3 p.p.</td>
                            <td className="p-2.5 text-right font-mono font-bold text-emerald-600 text-[10px]">Meta: ≤ 20%</td>
                          </tr>
                          <tr>
                            <td className="p-2.5 font-bold text-slate-800">Desvios Pontuais no Mês</td>
                            <td className="p-2.5 text-center font-mono text-slate-600">4 dias</td>
                            <td className="p-2.5 text-center font-mono font-bold text-amber-600">4 dias</td>
                            <td className="p-2.5 text-center font-mono font-black text-slate-600">Estável</td>
                            <td className="p-2.5 text-right font-mono text-slate-500 text-[10px]">4 a 5 no mês</td>
                          </tr>
                          <tr>
                            <td className="p-2.5 font-bold text-slate-800">Aderência Mensal Consolidada</td>
                            <td className="p-2.5 text-center font-mono text-emerald-600 font-bold">100% Conforme</td>
                            <td className="p-2.5 text-center font-mono text-emerald-600 font-bold">100% Conforme</td>
                            <td className="p-2.5 text-center font-mono font-black text-emerald-600">100%</td>
                            <td className="p-2.5 text-right font-mono font-bold text-emerald-600 text-[10px]">100% no mês</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                    <span className="font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      Média de Tempo Padrão Operador: <strong className="text-slate-800">4:40 min/PL</strong> (Meta SLA: 5:00 min).
                    </span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Desvios isolados no dia não afetam o fechamento mensal
                    </span>
                  </div>
                </div>

                {/* 4. FILTRO Q1, Q2, Q3 e Q4 — EVOLUÇÃO 2026 */}
                <div className="lg:col-span-5 bg-white border border-slate-200 p-5 rounded-2xl flex flex-col justify-between shadow-xs">
                  <div>
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                      <span className="text-xs font-black uppercase text-slate-800 tracking-wider block flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-emerald-600" />
                        Filtro Q1, Q2, Q3 e Q4 — Evolução 2026
                      </span>
                      
                      {/* Quarter Selector buttons */}
                      <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                        <button
                          type="button"
                          onClick={() => handleSelectQuarter('all')}
                          className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                            selectedQuarter === 'all' ? 'bg-[#032b5e] text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          Todos
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectQuarter('Q1')}
                          className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                            selectedQuarter === 'Q1' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          Q1
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectQuarter('Q2')}
                          className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                            selectedQuarter === 'Q2' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          Q2
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectQuarter('Q3')}
                          className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                            selectedQuarter === 'Q3' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                          }`}
                          title="Q3: Jul a Ago/2026"
                        >
                          Q3
                        </button>
                      </div>
                    </div>
                    <span className="text-[9px] text-slate-400 uppercase block font-bold mb-3">
                      {selectedQuarter === 'all' 
                        ? 'Visão consolidada dos trimestres Q1, Q2 e Q3/2026 (Jan a Ago) (% Reabastecimento e Desvios)' 
                        : `Visão detalhada dos meses de ${selectedQuarter}/2026 (% Reabastecimento e Desvios)`}
                    </span>

                    {/* Chart Container */}
                    <div className="h-44 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={quarterEvolutionData}
                          margin={{ top: 5, right: 5, left: -25, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="label" stroke="#64748b" fontSize={9} fontWeight="bold" />
                          <YAxis stroke="#64748b" fontSize={9} domain={[0, 25]} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px' }}
                            formatter={(val: any, name: string) => {
                              if (name === '% Reabastecimento') return [`${val}%`, name];
                              if (name === 'Tempo Médio (min)') return [`${val} min`, name];
                              if (name === 'Volume') return [`${val}`, name];
                              return [val, name];
                            }}
                          />
                          <Bar dataKey="reab" name="% Reabastecimento" fill="#f59e0b" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className={`grid ${quarterEvolutionData.length === 3 ? 'grid-cols-3' : 'grid-cols-4'} gap-1.5 mt-3 pt-2.5 border-t border-slate-100 text-center`}>
                    {quarterEvolutionData.map((item, idx) => (
                      <div key={idx} className="p-1.5 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-[8px] font-bold text-slate-400 block uppercase truncate">{item.mes || item.label}</span>
                        <span className="text-[10px] font-black text-slate-700 block">{item.tempo} min</span>
                        <span className={`text-[8px] font-mono font-bold ${item.reab <= 18 ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {item.reab}% Reab
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 5. EVOLUÇÃO ANO ANTERIOR X ANO ATUAL (YoY COMPARATIVO MENSAL R&R) */}
              <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col gap-4 shadow-xs">
                <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                      <BarChart2 className="w-4 h-4 text-blue-600" />
                      Evolução Ano Anterior (2025) x Ano Atual (2026) — Análise Comparativa R&R (Até Agosto)
                    </span>
                    <span className="text-[9px] text-slate-400 uppercase block font-bold mt-0.5">
                      Acompanhamento de volume mensal, produtividade logística e diminuição de desvios operacionais
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Seletor de Período YoY (Ano Todo / Jan-Ago / Q1 / Q2 / Q3 / Q4) */}
                    <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setYoyPeriodFilter('all')}
                        className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          yoyPeriodFilter === 'all'
                            ? 'bg-[#032b5e] text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 bg-transparent'
                        }`}
                        title="Ano Todo (Jan a Dez: 2025 consolidado e 2026 realizado até Ago)"
                      >
                        Ano Todo (Jan-Dez)
                      </button>
                      <button
                        type="button"
                        onClick={() => setYoyPeriodFilter('jan_ago')}
                        className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          yoyPeriodFilter === 'jan_ago'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 bg-transparent'
                        }`}
                        title="Comparativo Direto Jan a Ago"
                      >
                        Jan-Ago
                      </button>
                      <button
                        type="button"
                        onClick={() => setYoyPeriodFilter('Q1')}
                        className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          yoyPeriodFilter === 'Q1'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 bg-transparent'
                        }`}
                        title="Q1: Jan a Mar"
                      >
                        Q1
                      </button>
                      <button
                        type="button"
                        onClick={() => setYoyPeriodFilter('Q2')}
                        className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          yoyPeriodFilter === 'Q2'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 bg-transparent'
                        }`}
                        title="Q2: Abr a Jun"
                      >
                        Q2
                      </button>
                      <button
                        type="button"
                        onClick={() => setYoyPeriodFilter('Q3')}
                        className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          yoyPeriodFilter === 'Q3'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 bg-transparent'
                        }`}
                        title="Q3: Jul a Set"
                      >
                        Q3
                      </button>
                      <button
                        type="button"
                        onClick={() => setYoyPeriodFilter('Q4')}
                        className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          yoyPeriodFilter === 'Q4'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 bg-transparent'
                        }`}
                        title="Q4: Out a Dez (Visão 2025)"
                      >
                        Q4 (2025)
                      </button>
                    </div>

                    {/* Seletor de Etapa YoY (Ressuprimento / Reabastecimento / Consolidado) */}
                    <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setYoySelectedEtapa('all')}
                        className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          yoySelectedEtapa === 'all'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 bg-transparent'
                        }`}
                      >
                        📊 R&R Consolidado
                      </button>
                      <button
                        type="button"
                        onClick={() => setYoySelectedEtapa('ressuprimento')}
                        className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          yoySelectedEtapa === 'ressuprimento'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 bg-transparent'
                        }`}
                      >
                        🔄 Ressuprimento (Pré-Carga)
                      </button>
                      <button
                        type="button"
                        onClick={() => setYoySelectedEtapa('reabastecimento')}
                        className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          yoySelectedEtapa === 'reabastecimento'
                            ? 'bg-amber-500 text-slate-950 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 bg-transparent'
                        }`}
                      >
                        ⚡ Reabastecimento (Pallets)
                      </button>
                    </div>

                    {/* Seletor de Métrica (Paletes / Hectolitros / Caixas) */}
                    <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setMetricViewMode('paletes')}
                        className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
                          metricViewMode === 'paletes' ? 'bg-white text-slate-900 shadow-xs border border-slate-300' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <Layers className="w-3 h-3 text-amber-500" />
                        PL
                      </button>
                      <button
                        type="button"
                        onClick={() => setMetricViewMode('hectolitros')}
                        className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
                          metricViewMode === 'hectolitros' ? 'bg-white text-slate-900 shadow-xs border border-slate-300' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <Activity className="w-3 h-3 text-blue-500" />
                        HL
                      </button>
                      <button
                        type="button"
                        onClick={() => setMetricViewMode('caixas')}
                        className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
                          metricViewMode === 'caixas' ? 'bg-white text-slate-900 shadow-xs border border-slate-300' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <Package className="w-3 h-3 text-purple-600" />
                        CX
                      </button>
                    </div>
                  </div>
                </div>

                {/* YoY Summary Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[9px] font-black text-slate-400 uppercase block tracking-wider">Volume Total Ano Anterior (2025)</span>
                    <span className="text-xl font-black font-mono text-slate-600 block mt-0.5">
                      {yoySummary.tot2025.toLocaleString()} {yoySummary.unit}
                    </span>
                    <span className="text-[8px] text-slate-400 font-bold uppercase mt-0.5 block">
                      {yoyPeriodFilter === 'all' 
                        ? 'Jan a Dez de 2025 (Ano Completo)' 
                        : yoyPeriodFilter === 'jan_ago' 
                        ? 'Jan a Ago de 2025' 
                        : yoyPeriodFilter === 'Q4' 
                        ? 'Q4/2025 (Out-Dez)' 
                        : `${yoyPeriodFilter}/2025`}
                    </span>
                  </div>

                  <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl">
                    <span className="text-[9px] font-black text-blue-600 uppercase block tracking-wider">Volume Total Ano Atual (2026)</span>
                    <span className="text-xl font-black font-mono text-blue-700 block mt-0.5">
                      {yoySummary.hasReal2026Data 
                        ? `${yoySummary.tot2026.toLocaleString()} ${yoySummary.unit}` 
                        : 'A realizar (Set-Dez)'}
                    </span>
                    <span className="text-[8px] text-blue-500 font-bold uppercase mt-0.5 block">
                      {yoyPeriodFilter === 'all' 
                        ? 'Realizado até Ago/2026' 
                        : yoyPeriodFilter === 'jan_ago' 
                        ? 'Jan a Ago de 2026' 
                        : yoyPeriodFilter === 'Q4' 
                        ? 'Previsto Q4/2026' 
                        : `${yoyPeriodFilter}/2026`}
                    </span>
                  </div>

                  <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl">
                    <span className="text-[9px] font-black text-emerald-600 uppercase block tracking-wider">
                      {yoySelectedEtapa === 'reabastecimento' ? 'Variação de Pallets YoY' : 'Variação de Volume YoY'}
                    </span>
                    <span className="text-xl font-black font-mono text-emerald-700 block mt-0.5">
                      {yoySummary.hasReal2026Data 
                        ? (yoySummary.diffPct >= 0 ? `+${yoySummary.diffPct}%` : `${yoySummary.diffPct}%`)
                        : 'Em Aberto'}
                    </span>
                    <span className="text-[8px] text-emerald-600 font-bold uppercase mt-0.5 block">
                      {yoySummary.hasReal2026Data
                        ? (yoySelectedEtapa === 'reabastecimento' ? 'Mais eficiência e agilidade' : 'Evolução de produtividade vs 2025')
                        : 'Período futuro / A realizar'}
                    </span>
                  </div>

                  <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-xl">
                    <span className="text-[9px] font-black text-purple-600 uppercase block tracking-wider">Tempo Médio Ciclo YoY</span>
                    <span className="text-xl font-black font-mono text-purple-700 block mt-0.5">
                      {yoySummary.hasReal2026Data ? `${yoySummary.avgTempo2026} min` : `${yoySummary.avgTempo2025} min (2025)`} {yoySummary.hasReal2026Data && (
                        <span className="text-xs text-emerald-600 font-sans font-bold">({yoySummary.tempoDiffSec > 0 ? `+${yoySummary.tempoDiffSec}s` : `${yoySummary.tempoDiffSec}s`})</span>
                      )}
                    </span>
                    <span className="text-[8px] text-purple-500 font-bold uppercase mt-0.5 block">
                      {yoySummary.hasReal2026Data ? `Evoluiu de ${yoySummary.avgTempo2025} min em 2025` : 'Base de referência consolidada 2025'}
                    </span>
                  </div>
                </div>

                {/* YoY Comparative Chart Container */}
                <div className="h-64 w-full border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={yoyFilteredMonths.map(item => {
                        let v2025 = item.ressup2025_PL + item.reab2025_PL;
                        let v2026 = item.hasReal2026 ? (item.ressup2026_PL + item.reab2026_PL) : null;

                        if (yoySelectedEtapa === 'ressuprimento') {
                          if (metricViewMode === 'paletes') {
                            v2025 = item.ressup2025_PL;
                            v2026 = item.hasReal2026 ? item.ressup2026_PL : null;
                          } else if (metricViewMode === 'hectolitros') {
                            v2025 = item.ressup2025_HL;
                            v2026 = item.hasReal2026 ? item.ressup2026_HL : null;
                          } else {
                            v2025 = item.ressup2025_CX || 0;
                            v2026 = item.hasReal2026 ? (item.ressup2026_CX || 0) : null;
                          }
                        } else if (yoySelectedEtapa === 'reabastecimento') {
                          if (metricViewMode === 'paletes') {
                            v2025 = item.reab2025_PL;
                            v2026 = item.hasReal2026 ? item.reab2026_PL : null;
                          } else if (metricViewMode === 'hectolitros') {
                            v2025 = item.reab2025_HL;
                            v2026 = item.hasReal2026 ? item.reab2026_HL : null;
                          } else {
                            v2025 = item.reab2025_CX || 0;
                            v2026 = item.hasReal2026 ? (item.reab2026_CX || 0) : null;
                          }
                        } else {
                          if (metricViewMode === 'hectolitros') {
                            v2025 = item.ressup2025_HL + item.reab2025_HL;
                            v2026 = item.hasReal2026 ? (item.ressup2026_HL + item.reab2026_HL) : null;
                          } else if (metricViewMode === 'caixas') {
                            v2025 = (item.ressup2025_CX || 0) + (item.reab2025_CX || 0);
                            v2026 = item.hasReal2026 ? ((item.ressup2026_CX || 0) + (item.reab2026_CX || 0)) : null;
                          }
                        }

                        return {
                          mes: item.mes,
                          'Ano Anterior (2025)': v2025,
                          'Ano Atual (2026)': v2026 !== null ? v2026 : undefined,
                          tempo2025: item.tempoMedio2025,
                          tempo2026: item.tempoMedio2026,
                          unidade: metricViewMode === 'paletes' ? 'PL' : metricViewMode === 'hectolitros' ? 'HL' : 'CX'
                        };
                      })}
                      margin={{ top: 15, right: 15, left: -10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="mes" stroke="#64748b" fontSize={10} fontWeight="bold" />
                      <YAxis stroke="#64748b" fontSize={10} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(val: any, name: string) => {
                          const unit = metricViewMode === 'paletes' ? 'PL' : metricViewMode === 'hectolitros' ? 'HL' : 'CX';
                          if (val === undefined || val === null) {
                            return ['A realizar (Não consolidado)', name];
                          }
                          return [`${val.toLocaleString()} ${unit}`, name];
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '6px' }} />
                      <Bar dataKey="Ano Anterior (2025)" fill="#94a3b8" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                      <Bar 
                        dataKey="Ano Atual (2026)" 
                        fill={yoySelectedEtapa === 'reabastecimento' ? '#f59e0b' : yoySelectedEtapa === 'ressuprimento' ? '#10b981' : '#3b82f6'} 
                        radius={[4, 4, 0, 0]} 
                        isAnimationActive={false} 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold">
                      Visão Logística: <strong className="text-slate-800">
                        {yoySelectedEtapa === 'ressuprimento' ? 'Ressuprimento de Pré-Carga' : yoySelectedEtapa === 'reabastecimento' ? 'Reabastecimento de Pallets (Durante Carga)' : 'Consolidado Ressuprimento & Reabastecimento'}
                      </strong> por {metricViewMode === 'paletes' ? 'Paletes (PL)' : metricViewMode === 'hectolitros' ? 'Hectolitros (HL)' : 'Caixas (CX)'}.
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 bg-white px-2.5 py-1 rounded border border-slate-200">
                    {yoyPeriodFilter === 'all' 
                      ? 'Ano Completo: 2025 (Jan a Dez) e 2026 Realizado (Jan a Ago)' 
                      : 'Aderência Mensal Preservada: 100% Conforme'}
                  </span>
                </div>
              </div>

              {/* 6. SUGESTÃO SEMANAL AUTOMÁTICA DE REALOCAÇÃO DE PALLETS NO PICKING */}
              <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col gap-3 shadow-xs">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                      Sugestão Semanal Automática de Realocação de Pallets no Picking (Slotting)
                    </span>
                    <span className="text-[9px] text-slate-400 uppercase block font-bold">Inteligência logística: Identifica itens com excesso ou falta de posições/vagas na rua de picking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowSuggestions(!showSuggestions)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl text-[10px] font-bold uppercase flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      {showSuggestions ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                          <span>Ocultar Sugestões</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5 text-amber-600" />
                          <span>Exibir Sugestões</span>
                        </>
                      )}
                    </button>
                    <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-bold text-[10px] uppercase">
                      Recomendação Semanal Ativa
                    </span>
                  </div>
                </div>

                {showSuggestions ? (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl bg-slate-50">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 uppercase font-bold text-[9px] tracking-wider">
                          <th className="p-3">SKU / Produto</th>
                          <th className="p-3 text-center">Movimentação Total</th>
                          <th className="p-3 text-center">Reabastecimentos Carga</th>
                          <th className="p-3 text-center">Sugestão do Sistema</th>
                          <th className="p-3">Justificativa Operacional</th>
                          <th className="p-3 text-right">Prioridade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-slate-700">
                        {pickingReallocationSuggestions.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-100/60 text-xs">
                            <td className="p-3 font-bold min-w-[180px]">
                              <span className="font-mono text-amber-600 block">#{item.sku}</span>
                              <span className="text-slate-700 block text-xs">{item.desc}</span>
                            </td>
                            <td className="p-3 text-center font-mono font-bold text-slate-700 whitespace-nowrap">{item.totalPallets} PL</td>
                            <td className="p-3 text-center font-mono font-bold text-amber-600 whitespace-nowrap">{item.reabastecimentoPallets} PL</td>
                            <td className="p-3 text-center min-w-[200px]">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg font-black text-[10px] uppercase border whitespace-nowrap ${
                                item.ajusteVagas > 0 
                                  ? 'bg-amber-50 text-amber-800 border-amber-300' 
                                  : 'bg-blue-50 text-blue-800 border-blue-300'
                              }`}>
                                {item.acao}
                              </span>
                            </td>
                            <td className="p-3 text-slate-600 text-[11px] leading-relaxed min-w-[240px]">{item.motivo}</td>
                            <td className="p-3 text-right whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase inline-block ${
                                item.prioridade === 'Alta' 
                                  ? 'bg-red-50 text-red-600 border border-red-200' 
                                  : 'bg-amber-50 text-amber-600 border border-amber-200'
                              }`}>
                                {item.prioridade}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500 font-bold uppercase flex items-center justify-center gap-2">
                    <Info className="w-4 h-4 text-amber-500" />
                    <span>Sugestões de slotting ocultadas pelo usuário. Clique no botão &quot;Exibir Sugestões&quot; para visualizar a tabela.</span>
                  </div>
                )}
              </div>
            </motion.div>
          ) : activeSubTab === 'detalhado' ? (
            <motion.div 
              key="detalhado-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-4"
            >
              <RessuprimentoDetalhadoDiario 
                tasks={normalizedTasks} 
                empresaId={empresaId}
                onSelectDate={(d) => {
                  setFilterStartDate(d);
                  setFilterEndDate(d);
                }}
              />
            </motion.div>
          ) : activeSubTab === 'abastecimento' ? (
            <motion.div 
              key="abastecimento-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-4"
            >
              <AbastecimentoDiarioComponent 
                user={user} 
                empresa={empresa} 
                tasks={normalizedTasks} 
              />
            </motion.div>
          ) : (
            <motion.div 
              key="a3-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <A3BoardComponent user={user} empresa={empresa} dashboard="picking" />
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* MODALS: POP AND 5S AUDIT CHECKLIST */}
      <PadraoOperacionalModal
        moduleKey="picking"
        moduleName="Separação de Picking"
        isOpen={isPopModalOpen}
        onClose={() => setIsPopModalOpen(false)}
        user={user}
      />

      <Checklist5SModal
        isOpen={is5SModalOpen}
        onClose={() => setIs5SModalOpen(false)}
        defaultSetor="Picking"
        user={user}
      />

      {/* MODAL DE IMPORTAÇÃO JSON R&R (RESSUPRIMENTO) */}
      <ImportRrJsonModal
        isOpen={showImportRrModal}
        onClose={() => setShowImportRrModal(false)}
        empresaId={empresaId}
        onSuccess={() => {
          // reload event is dispatched automatically
        }}
        theme={theme}
      />

        </div>
      )}
    </div>
  );
}
export {};
