import { ManualInstrucaoCard } from './ManualInstrucaoCard';
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
  LabelList
} from 'recharts';
import { 
  AlertTriangle,
  ArrowLeft,
  TrendingUp,
  Package,
  Sun,
  Moon,
  Archive,
  Truck,
  Table,
  Layers,
  RotateCcw,
  BookOpen,
  ShieldCheck,
  BarChart2,
  CheckCircle2,
  ClipboardCheck,
  Sparkles,
  ArrowRight,
  Users,
  HardHat,
  UserCheck,
  FileText,
  FileSpreadsheet,
  Download,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Usuario, Empresa, QuebraRow } from '../types';
import { db } from '../firebase';
import { useEmpresaData } from '../context/EmpresaDataContext';
import { buildOfficialQuebrasRows } from '../utils/retroactiveQuebrasParser';
import { getJsonTable } from '../utils/hybridJsonDatabase';
import A3BoardComponent from './A3BoardComponent';
import CalendarFilter from './CalendarFilter';
import WqiTab, { getItemHlInfo, getItemValorReal } from './WqiTab';
import { CrossFilterProvider, useCrossFilter, ActiveCrossFiltersBar } from '../context/CrossFilterContext';
import { CrosstabMatrix } from './CrosstabMatrix';
import ArvoreMotivosTree from './ArvoreMotivosTree';
import LossHierarchyTree from './LossHierarchyTree';
import { PadraoOperacionalModal } from './PadraoOperacionalModal';
import { Checklist5SModal } from './Checklist5SModal';
import { IndicatorActionModal } from './IndicatorActionModal';
import { QuadroAcoesDpo } from './QuadroAcoesDpo';

interface QuebrasDashboardProps {
  user: Usuario;
  empresa: Empresa | null;
  onBack?: () => void;
  theme?: 'light' | 'dark';
  initialSubTab?: 'indicadores' | 'arvore' | 'wqi' | 'boarda3' | 'acoes';
}

interface ActionPlan5W2H {
  id: string;
  what: string;
  why: string;
  who: string;
  where: string;
  when: string;
  how: string;
  howMuch: number;
  status: 'Pendente' | 'Em Andamento' | 'Concluído' | 'Atrasado';
  codeDPO?: string;
}

const DEFAULT_PLANS: ActionPlan5W2H[] = [
  {
    id: 'plan-1',
    what: 'Treinamento de Reciclagem para Operadores de Empilhadeira',
    why: 'Alto índice de quebras por movimentação inadequada (Código 539)',
    who: 'Supervisor de Depósito (Carlos)',
    where: 'Área de Estoque e Docas',
    when: '15/07/2026',
    how: 'Aplicação do módulo de direção defensiva e empilhamento seguro padrão',
    howMuch: 350.00,
    status: 'Em Andamento',
    codeDPO: '539'
  },
  {
    id: 'plan-2',
    what: 'Revisão Sistemática do Fluxo FEFO (Primeiro que Vence, Primeiro que Sai)',
    why: 'Ocorrência de perdas por produtos vencidos no armazém (Código 533)',
    who: 'Analista de Inventário (Fernanda)',
    where: 'Blocados de Cerveja e Refri',
    when: '10/07/2026',
    how: 'Adesão diária à rotina de verificação no painel de validade antes da liberação de picking',
    howMuch: 0.00,
    status: 'Concluído',
    codeDPO: '533'
  },
  {
    id: 'plan-3',
    what: 'Instalação de Redes de Contenção de Altura nos Corredores Críticos',
    why: 'Prevenir acidentes com queda de paletes de altíssima rotação (Código 525)',
    who: 'Técnico de Segurança (Aline)',
    where: 'Corredores de Picking (C e D)',
    when: '20/07/2026',
    how: 'Fixação de redes metálicas de segurança nas posições porta-palete de nível superior',
    howMuch: 1200.00,
    status: 'Pendente',
    codeDPO: '525'
  }
];

// Helper to classify embalagem
const getEmbalagemName = (desc: string): string => {
  const d = (desc || '').toUpperCase();
  if (d.includes('600')) return 'Garrafa 600ml';
  if (d.includes('300') || d.includes('RF') || d.includes('ROMANI') || d.includes('RETORNÁVEL') || d.includes('RETORNAVEL')) return 'Garrafa 300ml';
  if (d.includes('473') || d.includes('LATÃO') || d.includes('LATAO') || d.includes('SLEEK')) return 'Lata 473ml';
  if (d.includes('350') || d.includes('355') || d.includes('269') || d.includes('LATA') || d.includes('LT')) return 'Lata 350ml/269ml';
  if (d.includes('LN') || d.includes('LONG') || d.includes('330') || d.includes('275')) return 'Long Neck';
  if (d.includes('1L') || d.includes('1 L') || d.includes('LITRÃO') || d.includes('LITRAO') || d.includes('1000')) return 'Garrafa 1L';
  if (d.includes('PET') || d.includes('2L') || d.includes('1.5L')) return 'PET';
  return 'Outras Embalagens';
};

// Helper to classify grupo de produto
export const getGrupoName = (desc: string): string => {
  const d = (desc || '').toUpperCase();
  if (
    d.includes('GUARANA') || d.includes('PEPSI') || d.includes('SUKITA') || 
    d.includes('SODA') || d.includes('H2OH') || d.includes('TONICA') || d.includes('CITRUS')
  ) {
    return 'Refrigerantes';
  }
  if (
    d.includes('RED BULL') || d.includes('GATORADE') || d.includes('MONSTER') || d.includes('TNT')
  ) {
    return 'Energéticos & NABS';
  }
  if (
    d.includes('AGUA') || d.includes('ÁGUA') || d.includes('INDAIA') || 
    d.includes('INDAIÁ') || d.includes('DAVILA') || d.includes('SUCO') || d.includes('DEL VALLE')
  ) {
    return 'Águas & Sucos';
  }
  if (
    d.includes('BEATS') || d.includes('SMIRNOFF') || d.includes('WALKER') || 
    d.includes('TANQUERAY') || d.includes('PITU') || d.includes('PITÚ') || 
    d.includes('WHISKY') || d.includes('GIN') || d.includes('VODKA') || 
    d.includes('BALLANTINES') || d.includes('PASSPORT') || d.includes('ICE')
  ) {
    return 'Destilados & Beats';
  }
  if (d.includes('TRIDENT') || d.includes('HALLS')) {
    return 'Confeitaria / Outros';
  }
  return 'Cervejas';
};

function QuebrasDashboardInner({ user, empresa, onBack, initialSubTab }: QuebrasDashboardProps) {
  const { filters, toggleFilter, isFiltered, filterData, clearAllFilters } = useCrossFilter();

  const [actualQuebras, setActualQuebras] = useState<QuebraRow[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [filterArea, setFilterArea] = useState<string>('TODAS');
  const [filterTurno, setFilterTurno] = useState<string>('TODOS');
  const [filterEmbalagem, setFilterEmbalagem] = useState<string>('TODAS');
  const [filterGrupo, setFilterGrupo] = useState<string>('TODOS');
  const [filterMotivo, setFilterMotivo] = useState<string>('TODOS');
  const [filterColaborador, setFilterColaborador] = useState<string>('TODOS');

  const handleResetAllFilters = () => {
    clearAllFilters();
    setStartDate('');
    setEndDate('');
    setFilterArea('TODAS');
    setFilterTurno('TODOS');
    setFilterEmbalagem('TODAS');
    setFilterGrupo('TODOS');
    setFilterMotivo('TODOS');
    setFilterColaborador('TODOS');
  };

  const hasActiveHeaderFilters = filterArea !== 'TODAS' || 
    filterTurno !== 'TODOS' || 
    filterEmbalagem !== 'TODAS' || 
    filterGrupo !== 'TODOS' || 
    filterMotivo !== 'TODOS' || 
    filterColaborador !== 'TODOS' ||
    Boolean(startDate) || 
    Boolean(endDate);
  const [secondChartMode, setSecondChartMode] = useState<'grupo' | 'embalagem'>('grupo');
  const [activeSubTab, setActiveSubTab] = useState<'indicadores' | 'arvore' | 'wqi' | 'boarda3' | 'acoes' | 'registros'>(initialSubTab || 'indicadores');
  
  // State for the Operational Records ("Histórico & Lançamentos da Operação")
  const [recordsSearch, setRecordsSearch] = useState('');
  const [recordsFilterOrigem, setRecordsFilterOrigem] = useState<'TODOS' | 'AJUDANTE' | 'OFICIAL'>('TODOS');
  const [recordsFilterTurno, setRecordsFilterTurno] = useState<string>('TODOS');
  const [recordsFilterArea, setRecordsFilterArea] = useState<string>('TODOS');
  const [recordsDateFilter, setRecordsDateFilter] = useState<'TODOS' | 'HOJE' | '7DIAS' | 'MES'>('TODOS');
  const [recordsPage, setRecordsPage] = useState(1);
  const RECORDS_PAGE_SIZE = 15;

  const [isPopModalOpen, setIsPopModalOpen] = useState(false);
  const [is5SModalOpen, setIs5SModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [viewUnit, setViewUnit] = useState<'rs' | 'hl' | 'sku'>(() => {
    const saved = localStorage.getItem('dashboard_view_unit');
    if (saved === 'rs' || saved === 'hl' || saved === 'sku') return saved;
    return 'rs';
  });

  useEffect(() => {
    localStorage.setItem('dashboard_view_unit', viewUnit);
  }, [viewUnit]);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('dashboard_theme') as 'light' | 'dark') || 'light';
  });
  const [treeViewMode, setTreeViewMode] = useState<'diagram' | 'classic'>('diagram');
  const [skuPage, setSkuPage] = useState(1);
  const SKU_PAGE_SIZE = 15;

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('dashboard_theme', nextTheme);
  };

  const quebras = useMemo(() => {
    return actualQuebras || [];
  }, [actualQuebras]);

  // Convert physical units to HE (Hectolitros) accurately
  const convertCxToHE = (quantidade: number, descricao: string = '', codProduto?: string | number): number => {
    return getItemHlInfo({ quantidade, descricao, codProduto: codProduto ? String(codProduto) : undefined }).totalHl;
  };

  const getValorPorUnidade = (q: QuebraRow, unit: 'rs' | 'hl' | 'sku'): number => {
    if (unit === 'sku') return q.quantidade || 0;
    if (unit === 'hl') return convertCxToHE(q.quantidade, q.descricao, q.codProduto);
    return getItemValorReal(q);
  };
  
  const empresaData = useEmpresaData(['quebras', 'produtos', 'colaboradores']);

  // Sync Quebras with memory cache, Firestore, custom entries and DTOs in real-time
  useEffect(() => {
    const companyId = empresa?.id || 'demo';
    
    const refreshQuebras = async () => {
      const officialRows = buildOfficialQuebrasRows(companyId);
      const seenIds = new Set<string>();
      const seenCustomKeys = new Set<string>();
      const customRows: QuebraRow[] = [];

      const addCustomIfNew = (item: QuebraRow, forceOperational = false) => {
        if (!item) return;
        const idStr = String(item.id || item._docId || '');
        if (idStr && (seenIds.has(idStr) || (idStr.startsWith('qb-retro-') && !forceOperational))) return;
        
        const colabStr = (item.colaborador || item.colaboradorQuebrou || item.responsavel || '').trim().toUpperCase();
        const areaStr = (item.area || '').trim().toUpperCase();
        const motStr = (item.motivo || '').trim().toUpperCase();
        const dateStr = item.dataISO ? item.dataISO.split('T')[0] : (item.data || '').trim();
        const itemKey = `${dateStr}_${item.codProduto || ''}_${colabStr}_${areaStr}_${item.quantidade || 0}_${item.codQuebra || ''}_${motStr}`;
        
        if (seenCustomKeys.has(itemKey)) return;
        seenCustomKeys.add(itemKey);
        if (idStr) seenIds.add(idStr);

        const isAjudanteOp = forceOperational || 
          idStr.startsWith('qb-custom-') || 
          idStr.startsWith('custom-') || 
          item.origem === 'AJUDANTE_OPERACAO' || 
          item.origem === 'ajudante' || 
          Boolean((item as any).recolhidoAjudante);

        customRows.push({
          ...item,
          origem: isAjudanteOp ? 'AJUDANTE_OPERACAO' : (item.origem || 'OPERACAO'),
          recolhidoAjudante: isAjudanteOp
        } as QuebraRow);
      };

      // 1. From IndexedDB (Hybrid JSON database)
      try {
        const idbRows = await getJsonTable<QuebraRow>(companyId, 'quebras');
        if (Array.isArray(idbRows)) {
          idbRows.forEach(r => addCustomIfNew(r, true));
        }
        if (companyId !== 'demo') {
          const idbDemo = await getJsonTable<QuebraRow>('demo', 'quebras');
          if (Array.isArray(idbDemo)) {
            idbDemo.forEach(r => addCustomIfNew(r, true));
          }
        }
      } catch (_) {}

      // 2. From LocalStorage custom keys (checks active company, demo, and all custom_quebras_ / quebras_ keys)
      const primaryKeys = [
        `custom_quebras_${companyId}`,
        `custom_quebras_demo`,
        `quebras_${companyId}`,
        `quebras_demo`,
        `quebras_records_${companyId}`,
        `quebras_records_demo`,
        `local_quebras_${companyId}`,
        `local_quebras_demo`,
        `quebras_manual_entries_${companyId}`,
        `quebras_manual_entries_demo`
      ];

      primaryKeys.forEach(k => {
        const savedCustom = localStorage.getItem(k);
        if (savedCustom) {
          try {
            const parsed = JSON.parse(savedCustom);
            if (Array.isArray(parsed)) {
              parsed.forEach(r => addCustomIfNew(r, true));
            }
          } catch (_) {}
        }
      });

      // Scan any additional custom quebras keys in localStorage
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (k.startsWith('custom_quebras_') || k.startsWith('local_quebras_') || k.startsWith('quebras_')) && !primaryKeys.includes(k)) {
            const val = localStorage.getItem(k);
            if (val) {
              const parsed = JSON.parse(val);
              if (Array.isArray(parsed)) parsed.forEach(r => addCustomIfNew(r, true));
            }
          }
        }
      } catch (_) {}

      // 3. From Live Database (Firestore)
      if (Array.isArray(empresaData.quebras) && empresaData.quebras.length > 0) {
        empresaData.quebras.forEach(r => addCustomIfNew(r, true));
      }

      // 4. From DTO Diagnóstico Histórico (DTO de Quebras / Operações)
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
                  origem: 'AJUDANTE_OPERACAO',
                  recolhidoAjudante: true
                } as QuebraRow, true);
              });
          }
        } catch (_) {}
      }

      // 5. Official historical rows are merged after custom operational rows
      officialRows.forEach(r => {
        const idStr = String(r.id || r._docId || '');
        if (idStr && seenIds.has(idStr)) return;
        const colabStr = (r.colaborador || r.colaboradorQuebrou || r.responsavel || '').trim().toUpperCase();
        const areaStr = (r.area || '').trim().toUpperCase();
        const motStr = (r.motivo || '').trim().toUpperCase();
        const dateStr = r.dataISO ? r.dataISO.split('T')[0] : (r.data || '').trim();
        const itemKey = `${dateStr}_${r.codProduto || ''}_${colabStr}_${areaStr}_${r.quantidade || 0}_${r.codQuebra || ''}_${motStr}`;
        if (seenCustomKeys.has(itemKey)) return;
        seenCustomKeys.add(itemKey);
        if (idStr) seenIds.add(idStr);
      });

      // Operational entries always come FIRST at the top!
      const rows = [...customRows, ...officialRows.filter(r => !seenIds.has(String(r.id || r._docId || '')) || !customRows.some(c => String(c.id) === String(r.id)))];
      // Sort: entries with dataISO descending
      rows.sort((a, b) => (b.dataISO || '').localeCompare(a.dataISO || ''));
      setActualQuebras(rows);
    };

    refreshQuebras();

    const handleUpdated = () => {
      refreshQuebras();
    };

    window.addEventListener('quebras-db-updated', handleUpdated);
    window.addEventListener('quebras-updated', handleUpdated);
    window.addEventListener('repack-db-updated', handleUpdated);
    window.addEventListener('despejo-db-updated', handleUpdated);
    window.addEventListener('dto_historico_updated', handleUpdated);
    window.addEventListener('retroactive-data-updated', handleUpdated);
    window.addEventListener('empresa-data-reload', handleUpdated);
    window.addEventListener('storage', handleUpdated);

    return () => {
      window.removeEventListener('quebras-db-updated', handleUpdated);
      window.removeEventListener('quebras-updated', handleUpdated);
      window.removeEventListener('repack-db-updated', handleUpdated);
      window.removeEventListener('despejo-db-updated', handleUpdated);
      window.removeEventListener('dto_historico_updated', handleUpdated);
      window.removeEventListener('retroactive-data-updated', handleUpdated);
      window.removeEventListener('empresa-data-reload', handleUpdated);
      window.removeEventListener('storage', handleUpdated);
    };
  }, [empresaData.quebras, empresa?.id]);

  const availableMotivos = useMemo(() => {
    const map = new Map<string, string>();
    quebras.forEach(q => {
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
  }, [quebras]);

  const availableColaboradores = useMemo(() => {
    const set = new Set<string>();
    quebras.forEach(q => {
      const name = String(q.colaborador || q.colaboradorQuebrou || q.responsavel || q.operador || '').trim();
      if (name && name !== 'NÃO IDENTIFICADO' && name !== 'SISTEMA' && name !== '-') {
        set.add(name.toUpperCase());
      }
    });
    // Ensure active collaborators are always present
    set.add('OZENILDO');
    set.add('JOSE RONILDO DA SILVA');
    set.add('GLADSON LISBOA DOS SANTOS');
    set.add('DEJEAN SILVA DE OLIVEIRA');
    set.add('ELDENKLEBER MAURICIO DA SILVA');
    return Array.from(set).sort();
  }, [quebras]);

  // Header Dropdown Filter Logic
  const baseFilteredData = useMemo(() => {
    return quebras.filter(q => {
      if (filterArea !== 'TODAS' && q.area !== filterArea) return false;
      if (filterTurno !== 'TODOS' && q.turno !== filterTurno) return false;
      if (filterEmbalagem !== 'TODAS' && getEmbalagemName(q.descricao) !== filterEmbalagem) return false;
      if (filterGrupo !== 'TODOS' && getGrupoName(q.descricao) !== filterGrupo) return false;
      if (filterMotivo !== 'TODOS') {
        const cod = String(q.codQuebra || '').trim();
        const mot = (q.motivo || '').trim().toUpperCase();
        const filterUpper = filterMotivo.toUpperCase();
        
        let match = false;
        if (filterUpper.includes('-')) {
          const filterCode = filterUpper.split('-')[0].trim();
          if (/^\d+$/.test(filterCode) && cod) {
            match = cod === filterCode;
          } else {
            match = `${cod} - ${mot}` === filterUpper || mot === filterUpper.split('-').slice(1).join('-').trim();
          }
        } else {
          match = cod === filterUpper || mot === filterUpper;
        }
        if (!match) return false;
      }
      
      if (filterColaborador !== 'TODOS') {
        const colab = String(q.colaborador || q.colaboradorQuebrou || q.responsavel || q.operador || '').trim().toUpperCase();
        const tgt = filterColaborador.trim().toUpperCase();
        if (tgt === 'NÃO IDENTIFICADO' || tgt === 'NAO IDENTIFICADO') {
          if (colab && !colab.includes('NÃO IDENTIFICADO') && !colab.includes('NAO IDENTIFICADO')) return false;
        } else {
          if (!colab || (!colab.includes(tgt) && !tgt.includes(colab))) return false;
        }
      }

      if (startDate || endDate) {
        let rowISO = '';
        if (q.dataISO) {
          rowISO = q.dataISO.split('T')[0];
        } else if (q.data) {
          if (q.data.includes('/')) {
            const parts = q.data.split('/');
            if (parts.length === 3) {
              const yyyy = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
              rowISO = `${yyyy}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
          } else if (q.data.includes('-')) {
            rowISO = q.data.split('T')[0];
          }
        }
        if (rowISO) {
          if (startDate && rowISO < startDate) return false;
          if (endDate && rowISO > endDate) return false;
        }
      }
      return true;
    });
  }, [quebras, filterArea, filterTurno, filterEmbalagem, filterGrupo, filterMotivo, filterColaborador, startDate, endDate]);

  // Full Cross-Filtered Data for KPIs and Tables
  const crossFilteredData = useMemo(() => {
    return filterData(baseFilteredData);
  }, [baseFilteredData, filterData]);

  // Operational count of items collected by Ajudante / Operation
  const customOperationalCount = useMemo(() => {
    return quebras.filter(q => 
      q.origem === 'AJUDANTE_OPERACAO' || 
      Boolean((q as any).recolhidoAjudante) || 
      String(q.id || '').startsWith('qb-custom-') ||
      String(q.id || '').startsWith('dto-qb-')
    ).length;
  }, [quebras]);

  // Filtered operational records list for the "Histórico & Lançamentos da Operação" tab
  const filteredRecordsList = useMemo(() => {
    let list = [...quebras];

    // Search filter
    if (recordsSearch.trim()) {
      const q = recordsSearch.trim().toLowerCase();
      list = list.filter(item => 
        String(item.codProduto || '').toLowerCase().includes(q) ||
        (item.descricao || '').toLowerCase().includes(q) ||
        (item.motivo || '').toLowerCase().includes(q) ||
        (item.colaborador || item.colaboradorQuebrou || item.responsavel || '').toLowerCase().includes(q) ||
        (item.area || '').toLowerCase().includes(q) ||
        (item.turno || '').toLowerCase().includes(q)
      );
    }

    // Origem filter
    if (recordsFilterOrigem === 'AJUDANTE') {
      list = list.filter(item => 
        item.origem === 'AJUDANTE_OPERACAO' || 
        Boolean((item as any).recolhidoAjudante) || 
        String(item.id || '').startsWith('qb-custom-') ||
        String(item.id || '').startsWith('dto-qb-')
      );
    } else if (recordsFilterOrigem === 'OFICIAL') {
      list = list.filter(item => 
        item.origem !== 'AJUDANTE_OPERACAO' && 
        !Boolean((item as any).recolhidoAjudante) && 
        !String(item.id || '').startsWith('qb-custom-') &&
        !String(item.id || '').startsWith('dto-qb-')
      );
    }

    // Turno filter
    if (recordsFilterTurno !== 'TODOS') {
      list = list.filter(item => (item.turno || '').toUpperCase() === recordsFilterTurno.toUpperCase());
    }

    // Area filter
    if (recordsFilterArea !== 'TODOS') {
      list = list.filter(item => (item.area || '').toUpperCase() === recordsFilterArea.toUpperCase());
    }

    // Header Date Filter (startDate and endDate)
    if (startDate || endDate) {
      list = list.filter(q => {
        let rowISO = '';
        if (q.dataISO) {
          rowISO = q.dataISO.split('T')[0];
        } else if (q.data) {
          if (q.data.includes('/')) {
            const parts = q.data.split('/');
            if (parts.length === 3) {
              const yyyy = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
              rowISO = `${yyyy}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
          } else if (q.data.includes('-')) {
            rowISO = q.data.split('T')[0];
          }
        }
        if (rowISO) {
          if (startDate && rowISO < startDate) return false;
          if (endDate && rowISO > endDate) return false;
        }
        return true;
      });
    }

    // Date quick filter
    if (recordsDateFilter === 'HOJE') {
      const todayISO = new Date().toISOString().split('T')[0];
      const todayBR = new Date().toLocaleDateString('pt-BR');
      list = list.filter(item => (item.dataISO && item.dataISO.startsWith(todayISO)) || item.data === todayBR);
    } else if (recordsDateFilter === '7DIAS') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const minISO = sevenDaysAgo.toISOString().split('T')[0];
      list = list.filter(item => item.dataISO && item.dataISO >= minISO);
    } else if (recordsDateFilter === 'MES') {
      const currentYearMonth = new Date().toISOString().substring(0, 7);
      list = list.filter(item => item.dataISO && item.dataISO.startsWith(currentYearMonth));
    }

    return list;
  }, [quebras, recordsSearch, recordsFilterOrigem, recordsFilterTurno, recordsFilterArea, recordsDateFilter, startDate, endDate]);

  // Dimension-specific datasets for charts (excluding own dimension so chart elements stay visible)
  const motivosData = useMemo(() => {
    return filterData(baseFilteredData, undefined, 'motivo');
  }, [baseFilteredData, filterData]);

  const grupoData = useMemo(() => {
    return filterData(baseFilteredData, undefined, 'grupo');
  }, [baseFilteredData, filterData]);

  const embalagemData = useMemo(() => {
    return filterData(baseFilteredData, undefined, 'embalagem');
  }, [baseFilteredData, filterData]);

  const areaData = useMemo(() => {
    return filterData(baseFilteredData, undefined, 'area');
  }, [baseFilteredData, filterData]);

  const timelineData = useMemo(() => {
    return filterData(baseFilteredData, undefined, 'data');
  }, [baseFilteredData, filterData]);

  const turnoData = useMemo(() => {
    return filterData(baseFilteredData, undefined, 'turno');
  }, [baseFilteredData, filterData]);

  const colaboradorData = useMemo(() => {
    return filterData(baseFilteredData, undefined, 'colaborador');
  }, [baseFilteredData, filterData]);

  // Filter status flags for cross-filter opacity highlighting
  const isMotivoFiltered = isFiltered('motivo') || isFiltered('codQuebra');
  const isGrupoFiltered = isFiltered('grupo');
  const isEmbalagemFiltered = isFiltered('embalagem');
  const isAreaFiltered = isFiltered('area');
  const isTurnoFiltered = isFiltered('turno');
  const isColaboradorFiltered = isFiltered('colaborador') || isFiltered('colaboradorQuebrou') || isFiltered('operador');

  // Colaborador Chart & Table Data calculation
  const { colaboradorChartData, colaboradorTableData } = useMemo(() => {
    const map: Record<string, {
      nome: string;
      funcao: string;
      totalQtd: number;
      totalValor: number;
      totalHl: number;
      quebrasMovimentacao: number;
      motivos: Record<string, number>;
    }> = {};

    colaboradorData.forEach(q => {
      const rawName = q.colaborador || q.colaboradorQuebrou || q.responsavel || q.operador || 'NÃO IDENTIFICADO';
      const nome = String(rawName).trim().toUpperCase();
      if (!map[nome]) {
        map[nome] = {
          nome,
          funcao: q.funcao || (nome.includes('OZENILDO') ? 'AJUDANTE' : 'OPERADOR'),
          totalQtd: 0,
          totalValor: 0,
          totalHl: 0,
          quebrasMovimentacao: 0,
          motivos: {}
        };
      }
      const val = getItemValorReal(q);
      const hl = convertCxToHE(q.quantidade, q.descricao, q.codProduto);
      map[nome].totalQtd += q.quantidade;
      map[nome].totalValor += val;
      map[nome].totalHl += hl;

      const mot = String(q.motivo || '').toUpperCase();
      const cod = String(q.codQuebra || '');
      if (cod === '539' || cod === '557' || cod === '589' || mot.includes('MOVIMENTAÇÃO') || mot.includes('MOVIMENTACAO')) {
        map[nome].quebrasMovimentacao += q.quantidade;
      }
      map[nome].motivos[mot || 'OUTROS'] = (map[nome].motivos[mot || 'OUTROS'] || 0) + q.quantidade;
    });

    const list = Object.values(map).map(item => {
      let topMotivo = 'QUEBRA OPERACIONAL';
      let maxM = 0;
      Object.entries(item.motivos).forEach(([m, count]) => {
        if (count > maxM) {
          maxM = count;
          topMotivo = m;
        }
      });

      const displayVal = viewUnit === 'rs' ? item.totalValor : viewUnit === 'hl' ? item.totalHl : item.totalQtd;

      return {
        ...item,
        totalValor: Math.round(item.totalValor * 100) / 100,
        totalHl: Math.round(item.totalHl * 1000) / 1000,
        displayVal: Math.round(displayVal * 100) / 100,
        topMotivo
      };
    }).sort((a, b) => b.displayVal - a.displayVal);

    const chart = list.filter(item => item.nome !== 'NÃO IDENTIFICADO' && item.nome !== 'SISTEMA').slice(0, 8).map(item => ({
      name: item.nome.length > 18 ? item.nome.slice(0, 16) + '...' : item.nome,
      fullName: item.nome,
      value: item.displayVal,
      totalQtd: item.totalQtd,
      totalValor: item.totalValor,
      totalHl: item.totalHl,
      quebrasMovimentacao: item.quebrasMovimentacao,
      funcao: item.funcao,
      topMotivo: item.topMotivo
    }));

    return { colaboradorChartData: chart, colaboradorTableData: list };
  }, [colaboradorData, viewUnit]);

  // Metric Calculation from crossFilteredData
  const totalQuantCx = crossFilteredData.reduce((acc, curr) => acc + curr.quantidade, 0);
  const totalQuantHE = crossFilteredData.reduce((acc, curr) => acc + convertCxToHE(curr.quantidade, curr.descricao, curr.codProduto), 0);
  const totalQuantReal = crossFilteredData.reduce((acc, curr) => acc + getItemValorReal(curr), 0);
  const totalQuant = viewUnit === 'sku' ? totalQuantCx : viewUnit === 'hl' ? Math.round(totalQuantHE * 100) / 100 : Math.round(totalQuantReal * 100) / 100;
  const estimatedCost = Math.round(totalQuantReal * 100) / 100;

  const skuFilteredData = useMemo(() => {
    return filterData(baseFilteredData, undefined, 'produto');
  }, [baseFilteredData, filterData]);

  // SKU Pareto computation
  const sortedSkus = useMemo(() => {
    const skuMap: Record<string, { desc: string; quantCx: number; quantHE: number; valorTotal: number }> = {};
    skuFilteredData.forEach(q => {
      const cod = q.codProduto || 'S/C';
      if (!skuMap[cod]) {
        skuMap[cod] = { desc: q.descricao, quantCx: 0, quantHE: 0, valorTotal: 0 };
      }
      skuMap[cod].quantCx += q.quantidade;
      const he = convertCxToHE(q.quantidade, q.descricao, q.codProduto);
      skuMap[cod].quantHE += he;
      const valor = getItemValorReal(q);
      skuMap[cod].valorTotal += valor;
    });

    return Object.entries(skuMap)
      .map(([cod, item]) => ({
        cod,
        desc: item.desc,
        quantCx: item.quantCx,
        quantHE: Math.round(item.quantHE * 100) / 100,
        valorTotal: Math.round(item.valorTotal * 100) / 100,
        quant: viewUnit === 'sku' ? item.quantCx : viewUnit === 'hl' ? Math.round(item.quantHE * 100) / 100 : Math.round(item.valorTotal * 100) / 100,
      }))
      .sort((a, b) => {
        if (viewUnit === 'rs') return b.valorTotal - a.valorTotal;
        if (viewUnit === 'hl') return b.quantHE - a.quantHE;
        return b.quantCx - a.quantCx;
      });
  }, [skuFilteredData, viewUnit]);

  const topSku = sortedSkus[0] || { cod: '-', desc: 'Nenhum', quant: 0, quantCx: 0, quantHE: 0, valorTotal: 0 };
  const topSkuPct = totalQuant > 0 ? ((topSku.quant / totalQuant) * 100).toFixed(1) : '0';

  // Critical Area computation
  const { areaVolumeMap, criticalAreaKey, criticalAreaName } = useMemo(() => {
    const activeMap: Record<string, number> = { 'ARMAZEM': 0, 'ENTREGA': 0, 'MERCADO': 0, 'PUXADA': 0 };

    crossFilteredData.forEach(q => {
      if (activeMap[q.area] !== undefined) {
        activeMap[q.area] += getValorPorUnidade(q, viewUnit);
      }
    });

    const cKey = Object.keys(activeMap).reduce((a, b) => activeMap[a] > activeMap[b] ? a : b, 'ARMAZEM');
    const cName = {
      'ARMAZEM': 'Armazém / Depósito',
      'ENTREGA': 'Rota de Entrega',
      'MERCADO': 'Mercado / Retorno',
      'PUXADA': 'Puxada / Transferência'
    }[cKey] || 'Nenhuma';

    return { areaVolumeMap: activeMap, criticalAreaKey: cKey, criticalAreaName: cName };
  }, [crossFilteredData, viewUnit]);

  // Motivos Chart Data (computed from motivosData)
  const motivosChartData = useMemo(() => {
    const map: Record<string, { desc: string, val: number, rawMotivo: string }> = {};
    motivosData.forEach(q => {
      const rawMot = q.motivo || q.codQuebra || 'Outros';
      const key = `${q.codQuebra} - ${q.motivo}`;
      if (!map[key]) {
        map[key] = { desc: q.motivo, val: 0, rawMotivo: rawMot };
      }
      map[key].val += getValorPorUnidade(q, viewUnit);
    });

    return Object.entries(map)
      .map(([codMotivo, item]) => ({
        name: codMotivo,
        rawMotivo: item.rawMotivo,
        value: Math.round(item.val * 100) / 100
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 7);
  }, [motivosData, viewUnit]);

  // Embalagem Chart Data (computed from embalagemData)
  const embalagemChartData = useMemo(() => {
    const map: Record<string, number> = {};
    embalagemData.forEach(q => {
      const embName = getEmbalagemName(q.descricao);
      const val = getValorPorUnidade(q, viewUnit);
      map[embName] = (map[embName] || 0) + val;
    });

    return Object.entries(map)
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 7);
  }, [embalagemData, viewUnit]);

  const totalEmbalagemVolume = Math.round(embalagemChartData.reduce((acc, curr) => acc + curr.value, 0) * 100) / 100;
  const topEmbalagensPct = embalagemChartData.length > 0 && totalEmbalagemVolume > 0
    ? `${embalagemChartData[0].name} (${Math.round((embalagemChartData[0].value / totalEmbalagemVolume) * 100)}%)`
    : '';

  // Grupo Chart Data (computed from grupoData)
  const grupoChartData = useMemo(() => {
    const map: Record<string, number> = {};
    grupoData.forEach(q => {
      const gName = getGrupoName(q.descricao);
      const val = getValorPorUnidade(q, viewUnit);
      map[gName] = (map[gName] || 0) + val;
    });

    return Object.entries(map)
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 7);
  }, [grupoData, viewUnit]);

  const totalGrupoVolume = Math.round(grupoChartData.reduce((acc, curr) => acc + curr.value, 0) * 100) / 100;
  const topGrupoPct = grupoChartData.length > 0 && totalGrupoVolume > 0
    ? `${grupoChartData[0].name} (${Math.round((grupoChartData[0].value / totalGrupoVolume) * 100)}%)`
    : '';

  // Area Chart Data (computed from areaData)
  const areaChartData = useMemo(() => {
    const map: Record<string, number> = { 'ARMAZEM': 0, 'ENTREGA': 0, 'MERCADO': 0, 'PUXADA': 0 };
    areaData.forEach(q => {
      if (map[q.area] !== undefined) {
        map[q.area] += getValorPorUnidade(q, viewUnit);
      }
    });

    return Object.entries(map)
      .map(([key, value]) => {
        const name = {
          'ARMAZEM': 'Armazém',
          'ENTREGA': 'Rota Entrega',
          'MERCADO': 'Mercado',
          'PUXADA': 'Puxada/Transf'
        }[key] || key;
        return { name, rawArea: key, value: Math.round(value * 100) / 100 };
      })
      .filter(item => item.value > 0);
  }, [areaData, viewUnit]);

  const COLORS = ['#ef4444', '#f5a623', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#6366f1'];

  // Trend Chart Data (computed from timelineData)
  const sortedDays = useMemo(() => {
    const map: Record<string, number> = {};
    timelineData.forEach(q => {
      const day = q.data ? q.data.substring(0, 5) : ''; // DD/MM
      if (day) {
        map[day] = (map[day] || 0) + getValorPorUnidade(q, viewUnit);
      }
    });

    return Object.entries(map)
      .map(([date, value]) => ({ date, quebras: Math.round(value * 100) / 100 }))
      .sort((a, b) => {
        const [dayA, monthA] = a.date.split('/');
        const [dayB, monthB] = b.date.split('/');
        return `${monthA}-${dayA}`.localeCompare(`${monthB}-${dayB}`);
      });
  }, [timelineData, viewUnit]);

  // Turno Chart Data (computed from turnoData)
  const { turnoChartData, turnoMap } = useMemo(() => {
    const tMap: Record<string, number> = { 'MANHÃ': 0, 'NOITE / MADRUGADA': 0 };
    turnoData.forEach(q => {
      const norm = q.turno.toUpperCase().includes('MANHÃ') ? 'MANHÃ' : 'NOITE / MADRUGADA';
      tMap[norm] = (tMap[norm] || 0) + getValorPorUnidade(q, viewUnit);
    });

    const cData = Object.entries(tMap).map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }));
    return { turnoChartData: cData, turnoMap: tMap };
  }, [turnoData, viewUnit]);

  // Active CrossFilter indicators
  const isDateFiltered = isFiltered('data');

  const availableEmbalagens = useMemo(() => {
    return Array.from(new Set(quebras.map(q => getEmbalagemName(q.descricao)))).filter(Boolean).sort();
  }, [quebras]);

  const availableGrupos = useMemo(() => {
    return Array.from(new Set(quebras.map(q => getGrupoName(q.descricao)))).filter(Boolean).sort();
  }, [quebras]);

  const totalCusto = estimatedCost;
  const topReasonName = motivosChartData[0]?.name || motivosChartData[0]?.rawMotivo || 'Nenhum';
  const topReasonShare = totalQuant > 0 && motivosChartData[0] ? (motivosChartData[0].value / totalQuant) * 100 : 0;
  const topAreaName = criticalAreaName;
  const topAreaShare = totalQuant > 0 && areaVolumeMap[criticalAreaKey] ? (areaVolumeMap[criticalAreaKey] / totalQuant) * 100 : 0;

  const skuRanking = useMemo(() => {
    return sortedSkus.map(s => ({
      cod: s.cod,
      desc: s.desc,
      emb: getEmbalagemName(s.desc),
      volumeHl: s.quantHE,
      quantidade: s.quantCx,
      valor: s.valorTotal
    }));
  }, [sortedSkus]);

  // Helper to format date into DD/MM/YYYY
  const formatDateBR = (data?: string, dataISO?: string): string => {
    if (data && data.includes('/')) return data;
    if (dataISO) {
      const raw = dataISO.split('T')[0];
      const parts = raw.split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    if (data && data.includes('-')) {
      const parts = data.split('T')[0].split('-');
      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return data || dataISO || '-';
  };

  // Export records from the filtered list directly to Excel (.xlsx)
  const handleExportDetailedExcel = () => {
    // Export prioritizes filtered records according to current view and active date filter
    const recordsToExport = activeSubTab === 'registros'
      ? filteredRecordsList
      : (hasActiveHeaderFilters || startDate || endDate ? crossFilteredData : (crossFilteredData.length > 0 ? crossFilteredData : quebras));

    if (!recordsToExport || recordsToExport.length === 0) {
      alert('Nenhum registro de quebra encontrado para a data ou filtros selecionados.');
      return;
    }

    try {
      const rowsData = recordsToExport.map(r => {
        // 1. Data (DD/MM/AAAA)
        let dataFmt = '-';
        if (r.data && r.data.includes('/')) {
          dataFmt = r.data;
        } else if (r.dataISO) {
          const isoPart = r.dataISO.split('T')[0];
          const p = isoPart.split('-');
          if (p.length === 3) dataFmt = `${p[2]}/${p[1]}/${p[0]}`;
        } else if (r.data && r.data.includes('-')) {
          const p = r.data.split('T')[0].split('-');
          if (p.length === 3) dataFmt = `${p[2]}/${p[1]}/${p[0]}`;
        } else if (r.data) {
          dataFmt = r.data;
        }

        // 2. Cód. SKU
        const codSku = r.codProduto ? String(r.codProduto) : '-';

        // 3. Descrição
        const desc = r.descricao || '-';

        // 4. Quantidade (unidades/caixas reais)
        const qtd = Number(r.quantidade || 0);

        // 5. HL Perdido (fator de hectolitro real do cadastro de produto)
        let hl = 0;
        if (r.hlPerdido !== undefined && r.hlPerdido !== null && Number(r.hlPerdido) > 0) {
          hl = Number(r.hlPerdido);
        } else {
          hl = convertCxToHE(qtd, desc, codSku);
        }
        const hlFmt = Number(hl.toFixed(2));

        // 6. Valor Estimado (R$) (cálculo financeiro real baseado no preço do produto)
        let val = 0;
        if (r.valorTotal !== undefined && r.valorTotal !== null && Number(r.valorTotal) > 0) {
          val = Number(r.valorTotal);
        } else if (r.valor !== undefined && r.valor !== null && Number(r.valor) > 0) {
          val = Number(r.valor);
        } else {
          val = getItemValorReal(r);
        }
        const valorFmt = `R$ ${Number(val).toFixed(2)}`;

        // 7. Área
        const area = r.area || '-';

        // 8. Turno
        const turno = r.turno || '-';

        // 9. Cód. Quebra
        const codQuebra = r.codQuebra ? String(r.codQuebra) : '-';

        // 10. Motivo
        const motivo = r.motivo || '-';

        // 11. Colaborador Responsável
        const colab = (r.colaboradorQuebrou || r.responsavel || r.colaborador || r.operador || 'NÃO IDENTIFICADO').trim();

        // APENAS AS 11 COLUNAS DA IMAGEM OFICIAL, SEM COLUNAS ADICIONAIS:
        return {
          'Data': dataFmt,
          'Cód. SKU': codSku,
          'Descrição': desc,
          'Quantidade': qtd,
          'HL Perdido': hlFmt,
          'Valor Estimado (R$)': valorFmt,
          'Área': area,
          'Turno': turno,
          'Cód. Quebra': codQuebra,
          'Motivo': motivo,
          'Colaborador Responsável': colab
        };
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(rowsData);

      // Formatting exact column widths for the 11 columns
      ws['!cols'] = [
        { wch: 14 },  // Data
        { wch: 12 },  // Cód. SKU
        { wch: 42 },  // Descrição
        { wch: 14 },  // Quantidade
        { wch: 14 },  // HL Perdido
        { wch: 22 },  // Valor Estimado (R$)
        { wch: 18 },  // Área
        { wch: 12 },  // Turno
        { wch: 14 },  // Cód. Quebra
        { wch: 32 },  // Motivo
        { wch: 28 },  // Colaborador Responsável
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Quebras');

      let dateSuffix = '';
      if (startDate && endDate) {
        dateSuffix = startDate === endDate ? startDate : `${startDate}_ate_${endDate}`;
      } else if (startDate || endDate) {
        dateSuffix = startDate || endDate;
      } else {
        dateSuffix = new Date().toISOString().split('T')[0];
      }

      const filename = `relatorio_detalhado_quebras_${dateSuffix}.xlsx`;
      XLSX.writeFile(wb, filename);
    } catch (err) {
      console.error('Erro ao exportar arquivo Excel:', err);
      alert('Erro ao exportar para Excel: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  // Export records from the operational list to CSV (kept for fallback)
  const handleExportRecordsCsv = () => {
    const headers = ['Data', 'Cód. SKU', 'Descrição', 'Quantidade', 'HL Perdido', 'Valor Estimado (R$)', 'Área', 'Turno', 'Cód. Quebra', 'Motivo', 'Colaborador Responsável'];
    const rows = filteredRecordsList.map(r => {
      let dataFmt = '-';
      if (r.data && r.data.includes('/')) {
        dataFmt = r.data;
      } else if (r.dataISO) {
        const isoPart = r.dataISO.split('T')[0];
        const p = isoPart.split('-');
        if (p.length === 3) dataFmt = `${p[2]}/${p[1]}/${p[0]}`;
      } else if (r.data && r.data.includes('-')) {
        const p = r.data.split('T')[0].split('-');
        if (p.length === 3) dataFmt = `${p[2]}/${p[1]}/${p[0]}`;
      } else if (r.data) {
        dataFmt = r.data;
      }

      const codSku = r.codProduto ? String(r.codProduto) : '-';
      const desc = (r.descricao || '-').replace(/"/g, '""');
      const qtd = Number(r.quantidade || 0);

      let hl = 0;
      if (r.hlPerdido !== undefined && r.hlPerdido !== null && Number(r.hlPerdido) > 0) {
        hl = Number(r.hlPerdido);
      } else {
        hl = convertCxToHE(qtd, r.descricao || '', codSku);
      }
      const hlFmt = hl.toFixed(2);

      let val = 0;
      if (r.valorTotal !== undefined && r.valorTotal !== null && Number(r.valorTotal) > 0) {
        val = Number(r.valorTotal);
      } else if (r.valor !== undefined && r.valor !== null && Number(r.valor) > 0) {
        val = Number(r.valor);
      } else {
        val = getItemValorReal(r);
      }
      const valorFmt = `R$ ${val.toFixed(2)}`;

      const area = (r.area || '-').replace(/"/g, '""');
      const turno = (r.turno || '-').replace(/"/g, '""');
      const codQuebra = r.codQuebra ? String(r.codQuebra) : '-';
      const motivo = (r.motivo || '-').replace(/"/g, '""');
      const colab = (r.colaboradorQuebrou || r.responsavel || r.colaborador || r.operador || 'NÃO IDENTIFICADO').replace(/"/g, '""');

      return [
        `"${dataFmt}"`,
        `"${codSku}"`,
        `"${desc}"`,
        qtd,
        hlFmt,
        `"${valorFmt}"`,
        `"${area}"`,
        `"${turno}"`,
        `"${codQuebra}"`,
        `"${motivo}"`,
        `"${colab}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `registros_quebras_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSyncRecords = () => {
    window.dispatchEvent(new CustomEvent('quebras-db-updated'));
    window.dispatchEvent(new CustomEvent('quebras-updated'));
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <div id="quebras-dashboard-wrapper" className={`flex flex-col gap-4 p-4 lg:p-6 rounded-2xl shadow-sm border transition-colors duration-300 ${
      theme === 'dark' ? 'bg-[#0b1329] text-slate-100 border-slate-800' : 'bg-[#f8fafc] text-[#0f172a] border-gray-200/80'
    }`}>
      
      {/* HEADER BLOCK */}
      <div className={`flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b pb-5 transition-colors ${
        theme === 'dark' ? 'border-slate-800' : 'border-gray-200'
      }`}>
        <div className="flex items-center gap-3">
          {onBack && (
            <button 
              onClick={onBack}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer border-none ${
                theme === 'dark' ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-gray-200/80 text-gray-500'
              }`}
              title="Voltar"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className={`font-sans font-black text-2xl tracking-tight uppercase flex items-center gap-2 ${
              theme === 'dark' ? 'text-blue-300' : 'text-[#032b5e]'
            }`}>
              <AlertTriangle className="w-6 h-6 text-[#ef4444]" /> GESTÃO E RECOLHA DE QUEBRAS
            </h1>
            <p className={`text-[10px] tracking-wider font-bold uppercase mt-0.5 ${
              theme === 'dark' ? 'text-slate-400' : 'text-gray-500'
            }`}>
              Painel Corporativo de Desempenho, Análise Pareto, Matriz Cruzada e Planos de Ação 5W2H
            </p>
          </div>
        </div>

        {/* Subtab Selector & Theme Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          <div className={`flex items-center p-1 rounded-xl border transition-colors ${
            theme === 'dark' ? 'bg-[#131d38] border-slate-700/80' : 'bg-gray-100 border-gray-200/60'
          }`}>
            <button 
              onClick={() => setActiveSubTab('indicadores')}
              className={`px-3.5 py-1.5 rounded-lg font-sans font-bold text-[10px] uppercase tracking-wider transition-all border-none cursor-pointer ${
                activeSubTab === 'indicadores' 
                  ? (theme === 'dark' ? 'bg-blue-600 text-white shadow-sm' : 'bg-[#032b5e] text-white shadow-sm') 
                  : (theme === 'dark' ? 'text-slate-400 hover:text-white bg-transparent' : 'text-gray-500 hover:text-[#032b5e] bg-transparent')
              }`}
            >
              Quebras & BI
            </button>
            <button 
              onClick={() => setActiveSubTab('wqi')}
              className={`px-3.5 py-1.5 rounded-lg font-sans font-bold text-[10px] uppercase tracking-wider transition-all border-none cursor-pointer ${
                activeSubTab === 'wqi' 
                  ? (theme === 'dark' ? 'bg-blue-600 text-white shadow-sm' : 'bg-[#032b5e] text-white shadow-sm') 
                  : (theme === 'dark' ? 'text-slate-400 hover:text-white bg-transparent' : 'text-gray-500 hover:text-[#032b5e] bg-transparent')
              }`}
            >
              WQI
            </button>
            <button 
              onClick={() => setActiveSubTab('arvore')}
              className={`px-3.5 py-1.5 rounded-lg font-sans font-bold text-[10px] uppercase tracking-wider transition-all border-none cursor-pointer ${
                activeSubTab === 'arvore' 
                  ? (theme === 'dark' ? 'bg-amber-600 text-white shadow-sm' : 'bg-amber-600 text-white shadow-sm') 
                  : (theme === 'dark' ? 'text-slate-400 hover:text-white bg-transparent' : 'text-gray-500 hover:text-amber-700 bg-transparent')
              }`}
            >
              Árvore de Perdas
            </button>
            <button 
              onClick={() => setActiveSubTab('acoes')}
              className={`px-3.5 py-1.5 rounded-lg font-sans font-bold text-[10px] uppercase tracking-wider transition-all border-none cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'acoes' || activeSubTab === 'boarda3'
                  ? (theme === 'dark' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm' : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm') 
                  : (theme === 'dark' ? 'text-slate-400 hover:text-white bg-transparent' : 'text-gray-500 hover:text-[#032b5e] bg-transparent')
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Ações DPO (Quebras)
            </button>
            <button 
              onClick={() => setActiveSubTab('registros')}
              className={`px-3.5 py-1.5 rounded-lg font-sans font-bold text-[10px] uppercase tracking-wider transition-all border-none cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'registros' 
                  ? (theme === 'dark' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-emerald-600 text-white shadow-sm') 
                  : (theme === 'dark' ? 'text-slate-400 hover:text-white bg-transparent' : 'text-gray-500 hover:text-emerald-700 bg-transparent')
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>Histórico & Lançamentos</span>
              {customOperationalCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-emerald-500 text-white font-black animate-pulse">
                  {customOperationalCount}
                </span>
              )}
            </button>
          </div>

          {/* ATALHO DTO DIAGNÓSTICO OPERACIONAL (QUEBRAS) */}
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent('open_dto_operacao', { detail: { operacao: 'quebras' } }));
              window.dispatchEvent(new CustomEvent('app_navigate', { detail: { panel: 'dto-diagnostico', operacao: 'quebras' } }));
            }}
            className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-black text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-xs uppercase tracking-wider border border-purple-400/40 hover:scale-[1.02] active:scale-95"
            title="Abrir Diagnóstico DTO Operacional de Quebras"
          >
            <ClipboardCheck className="w-3.5 h-3.5 text-purple-200" />
            <span>DTO Quebras</span>
          </button>

          {/* POP & EXPORTAR DETALHADO EXCEL BUTTONS */}
          <button 
            onClick={() => setIsPopModalOpen(true)}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-xs uppercase tracking-wider"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-200" /> Padrão Operacional
          </button>

          <button 
            onClick={handleExportDetailedExcel}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-xs uppercase tracking-wider border border-emerald-400/40 hover:scale-[1.02] active:scale-95"
            title={`Exportar arquivo detalhado de quebras em Excel (.xlsx) da data filtrada (${activeSubTab === 'registros' ? filteredRecordsList.length : (crossFilteredData.length > 0 ? crossFilteredData.length : baseFilteredData.length)} registros)`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-100" />
            <span>Exportar Quebras Detalhado (Excel)</span>
          </button>

          <button 
            onClick={() => setActiveSubTab('acoes')}
            className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-black text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-xs uppercase tracking-wider border border-blue-400/30"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> Gerar Ações
          </button>

          {/* REQUISITO 23: 3 SELETORES LADO A LADO: R$, HL, SKU */}
          <div className={`flex items-center p-1 rounded-xl border ${
            theme === 'dark' ? 'bg-[#131d38] border-slate-700/80' : 'bg-gray-100 border-gray-200/80'
          }`}>
            <button
              onClick={() => setViewUnit('rs')}
              className={`px-3 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all border-none cursor-pointer ${
                viewUnit === 'rs'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : (theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900')
              }`}
            >
              R$
            </button>
            <button
              onClick={() => setViewUnit('hl')}
              className={`px-3 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all border-none cursor-pointer ${
                viewUnit === 'hl'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : (theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900')
              }`}
            >
              HL
            </button>
            <button
              onClick={() => setViewUnit('sku')}
              className={`px-3 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all border-none cursor-pointer ${
                viewUnit === 'sku'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : (theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900')
              }`}
            >
              SKU
            </button>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border transition-all duration-300 cursor-pointer shadow-sm ${
              theme === 'dark' 
                ? 'bg-[#131d38] text-amber-300 border-slate-700/80 hover:bg-slate-800/80' 
                : 'bg-white text-slate-700 border-gray-200 hover:bg-slate-50'
            }`}
            title={theme === 'dark' ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
          >
            {theme === 'dark' ? (
              <>
                <Moon className="w-4 h-4 text-amber-400 fill-amber-400/20" />
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-200">Tema Escuro</span>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 text-amber-500 fill-amber-500/20" />
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-700">Tema Claro</span>
              </>
            )}
          </button>
        </div>

      </div>

      {activeSubTab === 'indicadores' && (
        <>
          {/* MANUAL DE INSTRUÇÃO E METAS */}
          <ManualInstrucaoCard
            title="Manual de Instrução & Parâmetros de Meta — Controle de Quebras & Avarias"
            metrics={[
              {
                key: 'quebras_limite',
                label: 'Índice de Quebras Total',
                unit: '%',
                comoCalcular: '(Volume em Caixas/Caixas Fisicamente Quebradas na Operação) ÷ (Total de Volume Movimentado no Período) × 100.'
              },
              {
                key: 'refugo',
                label: 'Avarias por Mau Manuseio',
                unit: '%',
                comoCalcular: '(Custo Total de Avarias por Queda/Abalroamento) ÷ (Faturamento Bruto de Vendas no Mês) × 100.'
              }
            ]}
          />
          {/* HEADER DROPDOWN FILTERS */}
          <div className={`flex flex-wrap items-center justify-between gap-4 p-3.5 rounded-xl border shadow-sm transition-colors ${
            theme === 'dark' ? 'bg-[#131d38] border-slate-700/80 text-slate-100' : 'bg-white border-gray-200'
          }`}>
            <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
              {/* Period selector */}
              <div className="flex flex-col gap-1 min-w-[260px]">
                <span className={`text-[9px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-slate-400' : 'text-gray-400'}`}>Período</span>
                <CalendarFilter
                  startDate={startDate}
                  endDate={endDate}
                  onChange={(start, end) => {
                    setStartDate(start);
                    setEndDate(end);
                  }}
                />
              </div>

              {/* Area filter */}
              <div className="flex flex-col gap-1 w-[160px]">
                <span className={`text-[9px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-slate-400' : 'text-gray-400'}`}>Área</span>
                <select 
                  value={filterArea} 
                  onChange={e => setFilterArea(e.target.value)} 
                  className={`w-full font-sans font-bold rounded-lg outline-none px-2.5 py-1 text-[10px] h-[28px] cursor-pointer transition-all ${
                    theme === 'dark' 
                      ? 'bg-[#1e2942] border border-slate-600 text-slate-100 hover:border-blue-400' 
                      : 'bg-white border border-gray-200 text-[#032b5e] hover:border-blue-400 focus:border-[#032b5e]'
                  }`}
                >
                  <option value="TODAS">Todas as Áreas</option>
                  <option value="ARMAZEM">Armazém / Depósito</option>
                  <option value="ENTREGA">Rota de Entrega</option>
                  <option value="MERCADO">Mercado / Retorno</option>
                  <option value="PUXADA">Puxada / Transferência</option>
                </select>
              </div>

              {/* Turno filter */}
              <div className="flex flex-col gap-1 w-[130px]">
                <span className={`text-[9px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-slate-400' : 'text-gray-400'}`}>Turno</span>
                <select 
                  value={filterTurno} 
                  onChange={e => setFilterTurno(e.target.value)} 
                  className={`w-full font-sans font-bold rounded-lg outline-none px-2.5 py-1 text-[10px] h-[28px] cursor-pointer transition-all ${
                    theme === 'dark' 
                      ? 'bg-[#1e2942] border border-slate-600 text-slate-100 hover:border-blue-400' 
                      : 'bg-white border border-gray-200 text-[#032b5e] hover:border-blue-400 focus:border-[#032b5e]'
                  }`}
                >
                  <option value="TODOS">Todos os Turnos</option>
                  <option value="MANHÃ">Manhã</option>
                  <option value="NOITE">Noite / Madrugada</option>
                </select>
              </div>

              {/* Embalagem filter */}
              <div className="flex flex-col gap-1 w-[140px]">
                <span className={`text-[9px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-slate-400' : 'text-gray-400'}`}>Embalagem</span>
                <select 
                  value={filterEmbalagem} 
                  onChange={e => setFilterEmbalagem(e.target.value)} 
                  className={`w-full font-sans font-bold rounded-lg outline-none px-2.5 py-1 text-[10px] h-[28px] cursor-pointer transition-all ${
                    theme === 'dark' 
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

              {/* Grupo filter */}
              <div className="flex flex-col gap-1 w-[150px]">
                <span className={`text-[9px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-slate-400' : 'text-gray-400'}`}>Grupo de Produto</span>
                <select 
                  value={filterGrupo} 
                  onChange={e => setFilterGrupo(e.target.value)} 
                  className={`w-full font-sans font-bold rounded-lg outline-none px-2.5 py-1 text-[10px] h-[28px] cursor-pointer transition-all ${
                    theme === 'dark' 
                      ? 'bg-[#1e2942] border border-slate-600 text-slate-100 hover:border-blue-400' 
                      : 'bg-white border border-gray-200 text-[#032b5e] hover:border-blue-400 focus:border-[#032b5e]'
                  }`}
                >
                  <option value="TODOS">Todos os Grupos</option>
                  <option value="Cervejas">Cervejas</option>
                  <option value="Refrigerantes">Refrigerantes</option>
                  <option value="Energéticos & NABS">Energéticos & NABS</option>
                  <option value="Águas & Sucos">Águas & Sucos</option>
                  <option value="Destilados & Beats">Destilados & Beats</option>
                  <option value="Confeitaria / Outros">Confeitaria / Outros</option>
                </select>
              </div>

              {/* Motivo filter */}
              <div className="flex flex-col gap-1 w-[170px]">
                <span className={`text-[9px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-slate-400' : 'text-gray-400'}`}>Motivo da Quebra</span>
                <select 
                  value={filterMotivo} 
                  onChange={e => setFilterMotivo(e.target.value)} 
                  className={`w-full font-sans font-bold rounded-lg outline-none px-2.5 py-1 text-[10px] h-[28px] cursor-pointer transition-all ${
                    theme === 'dark' 
                      ? 'bg-[#1e2942] border border-slate-600 text-slate-100 hover:border-blue-400' 
                      : 'bg-white border border-gray-200 text-[#032b5e] hover:border-blue-400 focus:border-[#032b5e]'
                  }`}
                >
                  <option value="TODOS">Todos os Motivos</option>
                  {availableMotivos.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              {/* Colaborador filter */}
              <div className="flex flex-col gap-1 w-[180px]">
                <span className={`text-[9px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-slate-400' : 'text-gray-400'}`}>Colaborador / Operador</span>
                <select 
                  value={filterColaborador} 
                  onChange={e => setFilterColaborador(e.target.value)} 
                  className={`w-full font-sans font-bold rounded-lg outline-none px-2.5 py-1 text-[10px] h-[28px] cursor-pointer transition-all ${
                    theme === 'dark' 
                      ? 'bg-[#1e2942] border border-slate-600 text-slate-100 hover:border-blue-400' 
                      : 'bg-white border border-gray-200 text-[#032b5e] hover:border-blue-400 focus:border-[#032b5e]'
                  }`}
                >
                  <option value="TODOS">Todos Colaboradores</option>
                  {availableColaboradores.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {hasActiveHeaderFilters && (
                <button
                  type="button"
                  onClick={handleResetAllFilters}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-black text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 dark:hover:bg-rose-900 rounded-lg border border-rose-200 dark:border-rose-800 transition-all cursor-pointer shadow-xs uppercase tracking-wider h-[28px]"
                >
                  <RotateCcw className="w-3 h-3" />
                  Limpar Filtros
                </button>
              )}
              <div className="text-[10px] text-gray-400 font-bold uppercase hidden md:block">
                Filtros ativos para a visualização dos gráficos
              </div>
            </div>
          </div>

          {/* ACTIVE CROSS-FILTERS TOOLBAR BANNER */}
          <ActiveCrossFiltersBar onClearAll={handleResetAllFilters} />

          {/* TOP KPI CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* KPI 1: Total Quebrada */}
            <div className="bg-gradient-to-br from-[#ef4444] to-[#b91c1c] text-white p-4.5 rounded-xl shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[125px]">
              <div>
                <span className="text-[9px] uppercase font-black tracking-widest text-[#fecaca]/80 block">
                  {viewUnit === 'rs' 
                    ? 'VALOR TOTAL DE QUEBRAS' 
                    : viewUnit === 'hl' 
                      ? 'VOLUME TOTAL DE QUEBRAS (HL)' 
                      : 'VOLUME FÍSICO DE QUEBRAS (CX/UN)'}
                </span>
                <div className="flex items-baseline mt-2">
                  {viewUnit === 'rs' && <span className="text-2xl font-bold mr-1 text-[#fecaca]">R$</span>}
                  <span className="text-4xl font-extrabold tracking-tight">
                    {totalQuant.toLocaleString('pt-BR', { 
                      minimumFractionDigits: viewUnit === 'sku' ? 0 : 2, 
                      maximumFractionDigits: 2 
                    })}
                  </span>
                  {viewUnit !== 'rs' && (
                    <span className="text-xs font-bold ml-1.5 text-[#fecaca]">
                      {viewUnit === 'hl' ? 'HL' : 'unidades / cx'}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-red-100 font-medium leading-normal mt-2 border-t border-red-500/30 pt-2 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Meta Operacional da Unidade: Zero Perdas
              </p>
            </div>

            {/* KPI 2: Finance Impact */}
            <div className={`p-4.5 rounded-xl border shadow-sm flex flex-col justify-between min-h-[125px] transition-colors ${
              theme === 'dark' ? 'bg-[#131d38] border-slate-700/80 text-slate-100' : 'bg-white border-gray-200'
            }`}>
              <div>
                <span className={`text-[9px] uppercase font-black tracking-widest block ${theme === 'dark' ? 'text-slate-400' : 'text-gray-400'}`}>
                  IMPACTO FINANCEIRO ESTIMADO
                </span>
                <span className={`text-3xl font-extrabold mt-2 block ${theme === 'dark' ? 'text-blue-300' : 'text-[#032b5e]'}`}>
                  {estimatedCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
              <div className={`mt-2 border-t pt-2 ${theme === 'dark' ? 'border-slate-800' : 'border-gray-100'}`}>
                <span className="text-[10px] text-gray-400 font-bold block uppercase">
                  Valor real do catálogo / lançamentos
                </span>
              </div>
            </div>

            {/* KPI 3: Principal SKU Ofensor */}
            <div 
              onClick={() => {
                if (topSku.cod && topSku.cod !== '-') {
                  const filterVal = (topSku.cod && topSku.cod !== 'S/C') ? topSku.cod : topSku.desc;
                  toggleFilter('produto', filterVal, 'Produto');
                }
              }}
              className={`p-4.5 rounded-xl border shadow-sm flex flex-col justify-between min-h-[125px] transition-colors cursor-pointer hover:border-amber-400/80 ${
                theme === 'dark' ? 'bg-[#131d38] border-slate-700/80 text-slate-100' : 'bg-white border-gray-200'
              }`}
              title="Clique para filtrar pelo SKU Ofensor Principal"
            >
              <div>
                <span className={`text-[9px] uppercase font-black tracking-widest block ${theme === 'dark' ? 'text-slate-400' : 'text-gray-400'}`}>
                  OFENSOR PRINCIPAL (80/20)
                </span>
                <span className="text-lg font-black text-[#f5a623] mt-2 block truncate uppercase" title={topSku.desc}>
                  {topSku.desc}
                </span>
                <span className={`text-[10px] font-semibold mt-1 block ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>
                  Código: <strong className={theme === 'dark' ? 'text-slate-200' : 'text-gray-700'}>{topSku.cod}</strong>
                </span>
              </div>
              <div className={`mt-2 border-t pt-2 flex justify-between items-center text-[10px] font-bold uppercase ${
                theme === 'dark' ? 'border-slate-800 text-slate-400' : 'border-gray-100 text-gray-500'
              }`}>
                <span>{viewUnit === 'rs' ? 'Impacto Financeiro SKU' : 'Volumetria SKU'}</span>
                <span className="text-[#ef4444]">
                  {viewUnit === 'rs' 
                    ? `R$ ${topSku.quant.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                    : `${topSku.quant.toLocaleString('pt-BR')} ${viewUnit === 'hl' ? 'HL' : 'un'}`} ({topSkuPct}%)
                </span>
              </div>
            </div>

            {/* KPI 4: Área Mais Crítica */}
            <div className={`p-4.5 rounded-xl border shadow-sm flex flex-col justify-between min-h-[125px] transition-colors ${
              theme === 'dark' ? 'bg-[#131d38] border-slate-700/80 text-slate-100' : 'bg-white border-gray-200'
            }`}>
              <div>
                <span className={`text-[9px] uppercase font-black tracking-widest block ${theme === 'dark' ? 'text-slate-400' : 'text-gray-400'}`}>
                  ÁREA OPERACIONAL CRÍTICA
                </span>
                <span className={`text-xl font-extrabold mt-2 block uppercase flex items-center gap-1 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>
                  {criticalAreaKey === 'ARMAZEM' && <Archive className="w-5 h-5 text-amber-500" />}
                  {criticalAreaKey === 'ENTREGA' && <Truck className="w-5 h-5 text-sky-500" />}
                  {criticalAreaName}
                </span>
              </div>
              <div className={`mt-2 border-t pt-2 flex justify-between items-center text-[10px] font-bold uppercase ${
                theme === 'dark' ? 'border-slate-800 text-slate-400' : 'border-gray-100 text-gray-500'
              }`}>
                <span>Concentração</span>
                <span className={theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}>
                  {totalQuant > 0 ? ((areaVolumeMap[criticalAreaKey] / totalQuant) * 100).toFixed(0) : 0}% de quebras
                </span>
              </div>
            </div>

          </div>

          {/* CHARTS CONTAINER - TOP ROW (3 CHARTS) */}
          {crossFilteredData.length === 0 && (
            <div className="bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center mb-4 flex flex-col items-center justify-center">
              <BarChart2 className="w-6 h-6 text-slate-400 mb-2" />
              <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                Nenhum dado importado para o período selecionado
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-md mt-1">
                Não existem lançamentos ou registros de quebras para os filtros aplicados. As métricas em R$, HL e SKU foram zeradas e nenhum gráfico fictício é gerado.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* CHART 1: Pareto por Código DPO / Motivo */}
            <div className={`p-4.5 rounded-xl border shadow-sm flex flex-col justify-between gap-3 min-h-[340px] transition-colors ${
              theme === 'dark' ? 'bg-[#131d38] border-slate-700/80 text-slate-100' : 'bg-white border-gray-200'
            }`}>
              <div>
                <h3 className={`font-sans font-black text-[11px] uppercase tracking-wider flex items-center gap-1.5 ${
                  theme === 'dark' ? 'text-blue-300' : 'text-[#032b5e]'
                }`}>
                  <TrendingUp className="w-3.5 h-3.5 text-[#ef4444]" /> PERDAS POR MOTIVO
                </h3>
                <span className="text-[9px] text-gray-400 font-bold mt-0.5 block">
                  Clique na barra para filtrar por motivo
                </span>
              </div>

              <div className="h-56 w-full cursor-pointer">
                {motivosChartData.length === 0 ? (
                  <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                    Sem registros para gerar o Pareto.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={motivosChartData} layout="vertical" margin={{ top: 5, right: 45, left: -5, bottom: 5 }} accessibilityLayer={false}>
                      <CartesianGrid stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'} horizontal={false} />
                      <XAxis type="number" stroke={theme === 'dark' ? '#64748b' : '#94a3b8'} fontSize={8} tickLine={false} axisLine={false} />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        stroke={theme === 'dark' ? '#cbd5e1' : '#334155'} 
                        fontSize={9.5} 
                        fontWeight={700}
                        tickLine={false} 
                        axisLine={false} 
                        width={135}
                        tickFormatter={(val) => {
                          if (!val) return '';
                          const clean = String(val).replace(/\s+/g, ' ').trim();
                          return clean.length > 22 ? clean.slice(0, 20) + '...' : clean;
                        }}
                      />
                      <Tooltip 
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{ 
                          backgroundColor: theme === 'dark' ? '#0f172a' : '#fff', 
                          border: theme === 'dark' ? '2px solid #334155' : '2px solid #cbd5e1', 
                          borderRadius: '12px', 
                          padding: '10px 14px',
                          boxShadow: '0 12px 28px -4px rgba(0, 0, 0, 0.25), 0 6px 12px -3px rgba(0, 0, 0, 0.12)',
                          fontSize: 13,
                          color: theme === 'dark' ? '#f8fafc' : '#0f172a'
                        }}
                        labelStyle={{ 
                          color: theme === 'dark' ? '#38bdf8' : '#032b5e', 
                          fontWeight: '800', 
                          fontSize: '13px',
                          marginBottom: '4px',
                          borderBottom: theme === 'dark' ? '1px solid #1e293b' : '1px solid #e2e8f0',
                          paddingBottom: '3px'
                        }}
                        itemStyle={{ color: '#ef4444', fontSize: '13px', fontWeight: '700' }}
                        formatter={(val: any) => [
                          viewUnit === 'rs' 
                            ? `R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                            : `${Number(val).toLocaleString('pt-BR')} ${viewUnit === 'hl' ? 'HL' : 'UN'}`,
                          viewUnit === 'rs' ? 'Valor' : viewUnit === 'hl' ? 'Volume' : 'Quantidade'
                        ]}
                      />
                      <Bar 
                        dataKey="value" 
                        radius={[0, 4, 4, 0]} 
                        barSize={14}
                        isAnimationActive={false}
                        onClick={(entry) => {
                          if (entry && entry.name) {
                            toggleFilter('motivo', entry.name, 'Motivo');
                          }
                        }}
                      >
                        <LabelList 
                          dataKey="value" 
                          position="right" 
                          fontSize={9} 
                          fontWeight={800} 
                          fill={theme === 'dark' ? '#93c5fd' : '#032b5e'} 
                          formatter={(val: number) => viewUnit === 'rs' ? `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : val.toLocaleString('pt-BR')} 
                        />
                        {motivosChartData.map((entry, index) => {
                          const isSelected = isFiltered('motivo', entry.name);
                          const opacity = isMotivoFiltered ? (isSelected ? 1.0 : 0.3) : 1.0;
                          return (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={COLORS[index % COLORS.length]} 
                              fillOpacity={opacity}
                              stroke={isSelected ? '#032b5e' : undefined}
                              strokeWidth={isSelected ? 2 : 0}
                            />
                          );
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className={`text-[9px] font-semibold border-t pt-1 flex items-center justify-between ${
                theme === 'dark' ? 'border-slate-800 text-slate-400' : 'border-gray-100 text-gray-400'
              }`}>
                <span>Códigos conforme manual DPO</span>
                {isMotivoFiltered && (
                  <span className="text-amber-600 font-bold uppercase text-[8px]">Filtro Ativo</span>
                )}
              </div>
            </div>

            {/* CHART 2: Perdas por Grupo */}
            <div className={`p-4.5 rounded-xl border shadow-sm flex flex-col justify-between gap-3 min-h-[340px] transition-colors ${
              theme === 'dark' ? 'bg-[#131d38] border-slate-700/80 text-slate-100' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className={`font-sans font-black text-[11px] uppercase tracking-wider flex items-center gap-1.5 ${
                    theme === 'dark' ? 'text-blue-300' : 'text-[#032b5e]'
                  }`}>
                    <Package className="w-3.5 h-3.5 text-[#3b82f6]" /> PERDAS POR GRUPO
                  </h3>
                  <span className="text-[9px] text-gray-400 font-bold mt-0.5 block">
                    Clique na barra para cruzar os filtros
                  </span>
                </div>

                <span className={`text-[10px] font-mono font-black border px-2 py-0.5 rounded-md ${
                  theme === 'dark' ? 'text-blue-300 bg-slate-800 border-slate-700' : 'text-[#032b5e] bg-slate-100 border-slate-200/80'
                }`}>
                  {viewUnit === 'rs' ? `R$ ${totalGrupoVolume.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `${totalGrupoVolume.toLocaleString('pt-BR')} ${viewUnit === 'hl' ? 'HL' : 'UN'}`}
                </span>
              </div>

              <div className="h-48 w-full cursor-pointer">
                {grupoChartData.length === 0 ? (
                  <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                    Sem registros para exibição.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={grupoChartData} 
                      layout="vertical" 
                      margin={{ top: 5, right: 45, left: -5, bottom: 5 }} 
                      accessibilityLayer={false}
                    >
                      <CartesianGrid stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'} horizontal={false} />
                      <XAxis type="number" stroke={theme === 'dark' ? '#64748b' : '#94a3b8'} fontSize={8} tickLine={false} axisLine={false} />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        stroke={theme === 'dark' ? '#cbd5e1' : '#334155'} 
                        fontSize={9}
                        fontWeight={700}
                        tickLine={false} 
                        axisLine={false} 
                        width={105}
                      />
                      <Tooltip 
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{ 
                          backgroundColor: theme === 'dark' ? '#0f172a' : '#fff', 
                          border: theme === 'dark' ? '2px solid #334155' : '2px solid #cbd5e1', 
                          borderRadius: '12px', 
                          padding: '10px 14px',
                          boxShadow: '0 12px 28px -4px rgba(0, 0, 0, 0.25), 0 6px 12px -3px rgba(0, 0, 0, 0.12)',
                          fontSize: 13, 
                          color: theme === 'dark' ? '#f8fafc' : '#0f172a' 
                        }}
                        labelStyle={{ 
                          color: theme === 'dark' ? '#38bdf8' : '#032b5e', 
                          fontWeight: '800',
                          fontSize: '13px',
                          marginBottom: '4px',
                          borderBottom: theme === 'dark' ? '1px solid #1e293b' : '1px solid #e2e8f0',
                          paddingBottom: '3px'
                        }}
                        itemStyle={{ color: '#38bdf8', fontSize: '13px', fontWeight: '700' }}
                        formatter={(val: any) => [
                          viewUnit === 'rs' 
                            ? `R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                            : `${Number(val).toLocaleString('pt-BR')} ${viewUnit === 'hl' ? 'HL' : 'UN'}`,
                          viewUnit === 'rs' ? 'Valor' : viewUnit === 'hl' ? 'Volume' : 'Quantidade'
                        ]}
                      />
                      <Bar 
                        dataKey="value" 
                        radius={[0, 6, 6, 0]} 
                        barSize={16}
                        isAnimationActive={false}
                        onClick={(entry) => {
                          if (entry && entry.name) {
                            toggleFilter('grupo', entry.name, 'Grupo');
                          }
                        }}
                      >
                        <LabelList 
                          dataKey="value" 
                          position="right" 
                          fontSize={9} 
                          fontWeight={800} 
                          fill={theme === 'dark' ? '#93c5fd' : '#032b5e'} 
                          formatter={(val: number) => viewUnit === 'rs' ? `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : val.toLocaleString('pt-BR')} 
                        />
                        {grupoChartData.map((entry, index) => {
                          const isSelected = isFiltered('grupo', entry.name);
                          const opacity = isGrupoFiltered ? (isSelected ? 1.0 : 0.3) : 1.0;
                          return (
                            <Cell 
                              key={`cell-grp-${index}`} 
                              fill={COLORS[(index + 2) % COLORS.length]} 
                              fillOpacity={opacity}
                              stroke={isSelected ? (theme === 'dark' ? '#38bdf8' : '#032b5e') : undefined}
                              strokeWidth={isSelected ? 2 : 0}
                            />
                          );
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className={`text-[9px] font-semibold border-t pt-1.5 flex items-center justify-between ${
                theme === 'dark' ? 'border-slate-800 text-slate-400' : 'border-gray-100 text-gray-500'
              }`}>
                <span>Classificação por grupo de produto</span>
                {topGrupoPct && (
                  <span className={`font-bold font-mono ${theme === 'dark' ? 'text-blue-300' : 'text-[#032b5e]'}`}>
                    Maior: {topGrupoPct}
                  </span>
                )}
              </div>
            </div>

            {/* CHART 3: Distribuição por Área */}
            <div className={`p-4.5 rounded-xl border shadow-sm flex flex-col justify-between gap-3 min-h-[340px] transition-colors ${
              theme === 'dark' ? 'bg-[#131d38] border-slate-700/80 text-slate-100' : 'bg-white border-gray-200'
            }`}>
              <div>
                <h3 className={`font-sans font-black text-[11px] uppercase tracking-wider ${
                  theme === 'dark' ? 'text-blue-300' : 'text-[#032b5e]'
                }`}>
                  DISTRIBUIÇÃO POR ÁREA
                </h3>
                <span className="text-[9px] text-gray-400 font-bold mt-0.5 block">
                  Clique na fatia para filtrar por setor físico
                </span>
              </div>

              <div className="h-32 w-full relative flex items-center justify-center cursor-pointer">
                {areaChartData.length === 0 ? (
                  <div className="text-xs text-gray-400">Sem dados</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={areaChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={48}
                        paddingAngle={3}
                        dataKey="value"
                        isAnimationActive={false}
                        onClick={(entry: any) => {
                          if (entry && (entry.rawArea || entry.name)) {
                            toggleFilter('area', entry.rawArea || entry.name, 'Área');
                          }
                        }}
                      >
                        {areaChartData.map((entry, index) => {
                          const isSelected = isFiltered('area', entry.rawArea) || isFiltered('area', entry.name);
                          const opacity = isAreaFiltered ? (isSelected ? 1.0 : 0.3) : 1.0;
                          return (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={COLORS[index % COLORS.length]} 
                              fillOpacity={opacity}
                              stroke={isSelected ? '#032b5e' : '#fff'}
                              strokeWidth={isSelected ? 2.5 : 1}
                            />
                          );
                        })}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: theme === 'dark' ? '#0f172a' : '#fff', 
                          border: theme === 'dark' ? '2px solid #334155' : '2px solid #cbd5e1', 
                          borderRadius: '12px', 
                          padding: '10px 14px',
                          boxShadow: '0 12px 28px -4px rgba(0, 0, 0, 0.25), 0 6px 12px -3px rgba(0, 0, 0, 0.12)',
                          fontSize: 13,
                          color: theme === 'dark' ? '#f8fafc' : '#0f172a'
                        }} 
                        labelStyle={{ 
                          color: theme === 'dark' ? '#38bdf8' : '#032b5e', 
                          fontWeight: '800', 
                          fontSize: '13px',
                          marginBottom: '4px'
                        }}
                        itemStyle={{ fontSize: '13px', fontWeight: '700' }} 
                        formatter={(val: any, name: any) => [
                          viewUnit === 'rs' 
                            ? `R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                            : `${Number(val).toLocaleString('pt-BR')} ${viewUnit === 'hl' ? 'HL' : 'UN'}`,
                          name || (viewUnit === 'rs' ? 'Valor' : 'Volume')
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Legend Area indicators */}
              <div className={`grid grid-cols-2 gap-1.5 border-t pt-2.5 ${
                theme === 'dark' ? 'border-slate-800' : 'border-gray-100'
              }`}>
                {areaChartData.map((entry, idx) => {
                  const isSelected = isFiltered('area', entry.rawArea) || isFiltered('area', entry.name);
                  return (
                    <div 
                      key={entry.name} 
                      onClick={() => toggleFilter('area', entry.rawArea || entry.name, 'Área')}
                      className={`flex items-center gap-1 cursor-pointer p-1 rounded-md transition-colors ${
                        isSelected 
                          ? (theme === 'dark' ? 'bg-amber-500/20 border border-amber-400/50' : 'bg-amber-100 border border-amber-300') 
                          : (theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-100')
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span className={`text-[8.5px] font-bold uppercase tracking-tight truncate ${
                        theme === 'dark' ? 'text-slate-300' : 'text-gray-600'
                      }`}>
                        {entry.name}: <strong>
                          {viewUnit === 'rs' 
                            ? `R$ ${entry.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                            : `${entry.value.toLocaleString('pt-BR')} ${viewUnit === 'hl' ? 'HL' : 'UN'}`}
                        </strong>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* CHARTS CONTAINER - BOTTOM ROW (3 CHARTS: TENDÊNCIA, EMBALAGEM, TURNO) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-1">

            {/* CHART 4: Tendência Diária */}
            <div className={`p-4.5 rounded-xl border shadow-sm flex flex-col justify-between gap-3 min-h-[340px] transition-colors ${
              theme === 'dark' ? 'bg-[#131d38] border-slate-700/80 text-slate-100' : 'bg-white border-gray-200'
            }`}>
              <div>
                <h3 className={`font-sans font-black text-[11px] uppercase tracking-wider ${
                  theme === 'dark' ? 'text-blue-300' : 'text-[#032b5e]'
                }`}>
                  TENDÊNCIA TEMPORAL (DIÁRIO)
                </h3>
                <span className="text-[9px] text-gray-400 font-bold mt-0.5 block">
                  Acompanhamento de evolução volumétrica
                </span>
              </div>

              <div className="h-48 w-full cursor-pointer">
                {sortedDays.length === 0 ? (
                  <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                    Sem dados temporais.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sortedDays} margin={{ top: 5, right: 5, left: -30, bottom: 5 }}>
                      <CartesianGrid stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'} vertical={false} />
                      <XAxis dataKey="date" stroke={theme === 'dark' ? '#64748b' : '#94a3b8'} fontSize={8} tickLine={false} axisLine={false} />
                      <YAxis stroke={theme === 'dark' ? '#64748b' : '#94a3b8'} fontSize={8} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: theme === 'dark' ? '#0f172a' : '#fff', 
                          border: theme === 'dark' ? '2px solid #334155' : '2px solid #cbd5e1', 
                          borderRadius: '12px', 
                          padding: '10px 14px',
                          boxShadow: '0 12px 28px -4px rgba(0, 0, 0, 0.25), 0 6px 12px -3px rgba(0, 0, 0, 0.12)',
                          fontSize: 13,
                          color: theme === 'dark' ? '#f8fafc' : '#0f172a'
                        }}
                        labelStyle={{ 
                          color: theme === 'dark' ? '#38bdf8' : '#032b5e', 
                          fontWeight: '800', 
                          fontSize: '13px',
                          marginBottom: '4px',
                          borderBottom: theme === 'dark' ? '1px solid #1e293b' : '1px solid #e2e8f0',
                          paddingBottom: '3px'
                        }}
                        itemStyle={{ color: '#ef4444', fontSize: '13px', fontWeight: '700' }}
                        formatter={(val: any) => [
                          viewUnit === 'rs' 
                            ? `R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                            : `${Number(val).toLocaleString('pt-BR')} ${viewUnit === 'hl' ? 'HL' : 'UN'}`,
                          viewUnit === 'rs' ? 'Total Perda' : viewUnit === 'hl' ? 'Total (HL)' : 'Total (UN)'
                        ]}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="quebras" 
                        stroke="#ef4444" 
                        strokeWidth={2} 
                        isAnimationActive={false}
                        activeDot={{ 
                          r: 6, 
                          onClick: (e, payload: any) => {
                            if (payload && payload.payload && payload.payload.date) {
                              toggleFilter('data', payload.payload.date, 'Data');
                            }
                          }
                        }} 
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className={`text-[9px] text-gray-400 font-semibold border-t pt-1 text-center ${
                theme === 'dark' ? 'border-slate-800' : 'border-gray-100'
              }`}>
                {sortedDays.length > 0 
                  ? `Exibindo todas as ${sortedDays.length} datas com lançamentos`
                  : 'Sem lançamentos no período'}
              </div>
            </div>

            {/* CHART 5: Perdas por Embalagem */}
            <div className={`p-4.5 rounded-xl border shadow-sm flex flex-col justify-between gap-3 min-h-[340px] transition-colors ${
              theme === 'dark' ? 'bg-[#131d38] border-slate-700/80 text-slate-100' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className={`font-sans font-black text-[11px] uppercase tracking-wider flex items-center gap-1.5 ${
                    theme === 'dark' ? 'text-blue-300' : 'text-[#032b5e]'
                  }`}>
                    <Package className="w-3.5 h-3.5 text-[#10b981]" /> PERDAS POR EMBALAGEM
                  </h3>
                  <span className="text-[9px] text-gray-400 font-bold mt-0.5 block">
                    Clique na barra para cruzar os filtros
                  </span>
                </div>

                <span className={`text-[10px] font-mono font-black border px-2 py-0.5 rounded-md ${
                  theme === 'dark' ? 'text-blue-300 bg-slate-800 border-slate-700' : 'text-[#032b5e] bg-slate-100 border-slate-200/80'
                }`}>
                  {viewUnit === 'rs' ? `R$ ${totalEmbalagemVolume.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `${totalEmbalagemVolume.toLocaleString('pt-BR')} ${viewUnit === 'hl' ? 'HL' : 'UN'}`}
                </span>
              </div>

              <div className="h-48 w-full cursor-pointer">
                {embalagemChartData.length === 0 ? (
                  <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                    Sem registros para exibição.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={embalagemChartData} 
                      layout="vertical" 
                      margin={{ top: 5, right: 45, left: -5, bottom: 5 }} 
                      accessibilityLayer={false}
                    >
                      <CartesianGrid stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'} horizontal={false} />
                      <XAxis type="number" stroke={theme === 'dark' ? '#64748b' : '#94a3b8'} fontSize={8} tickLine={false} axisLine={false} />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        stroke={theme === 'dark' ? '#cbd5e1' : '#334155'} 
                        fontSize={9}
                        fontWeight={700}
                        tickLine={false} 
                        axisLine={false} 
                        width={105}
                      />
                      <Tooltip 
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{ 
                          backgroundColor: theme === 'dark' ? '#0f172a' : '#fff', 
                          border: theme === 'dark' ? '2px solid #334155' : '2px solid #cbd5e1', 
                          borderRadius: '12px', 
                          padding: '10px 14px',
                          boxShadow: '0 12px 28px -4px rgba(0, 0, 0, 0.25), 0 6px 12px -3px rgba(0, 0, 0, 0.12)',
                          fontSize: 13, 
                          color: theme === 'dark' ? '#f8fafc' : '#0f172a' 
                        }}
                        labelStyle={{ 
                          color: theme === 'dark' ? '#38bdf8' : '#032b5e', 
                          fontWeight: '800', 
                          fontSize: '13px',
                          marginBottom: '4px',
                          borderBottom: theme === 'dark' ? '1px solid #1e293b' : '1px solid #e2e8f0',
                          paddingBottom: '3px'
                        }}
                        itemStyle={{ color: '#38bdf8', fontSize: '13px', fontWeight: '700' }}
                        formatter={(val: any) => [
                          viewUnit === 'rs' 
                            ? `R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                            : `${Number(val).toLocaleString('pt-BR')} ${viewUnit === 'hl' ? 'HL' : 'UN'}`,
                          viewUnit === 'rs' ? 'Valor' : viewUnit === 'hl' ? 'Volume' : 'Quantidade'
                        ]}
                      />
                      <Bar 
                        dataKey="value" 
                        radius={[0, 6, 6, 0]} 
                        barSize={16}
                        isAnimationActive={false}
                        onClick={(entry) => {
                          if (entry && entry.name) {
                            toggleFilter('embalagem', entry.name, 'Embalagem');
                          }
                        }}
                      >
                        <LabelList 
                          dataKey="value" 
                          position="right" 
                          fontSize={9} 
                          fontWeight={800} 
                          fill={theme === 'dark' ? '#93c5fd' : '#032b5e'} 
                          formatter={(val: number) => viewUnit === 'rs' ? `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : val.toLocaleString('pt-BR')} 
                        />
                        {embalagemChartData.map((entry, index) => {
                          const isSelected = isFiltered('embalagem', entry.name);
                          const opacity = isEmbalagemFiltered ? (isSelected ? 1.0 : 0.3) : 1.0;
                          return (
                            <Cell 
                              key={`cell-emb-${index}`} 
                              fill={COLORS[(index + 3) % COLORS.length]} 
                              fillOpacity={opacity}
                              stroke={isSelected ? (theme === 'dark' ? '#38bdf8' : '#032b5e') : undefined}
                              strokeWidth={isSelected ? 2 : 0}
                            />
                          );
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className={`text-[9px] font-semibold border-t pt-1.5 flex items-center justify-between ${
                theme === 'dark' ? 'border-slate-800 text-slate-400' : 'border-gray-100 text-gray-500'
              }`}>
                <span>Classificação por vasilhame</span>
                {topEmbalagensPct && (
                  <span className={`font-bold font-mono ${theme === 'dark' ? 'text-blue-300' : 'text-[#032b5e]'}`}>
                    Maior: {topEmbalagensPct}
                  </span>
                )}
              </div>
            </div>

            {/* CHART 6: Quebras por Turno */}
            <div className={`p-4.5 rounded-xl border shadow-sm flex flex-col justify-between gap-3 min-h-[340px] transition-colors ${
              theme === 'dark' ? 'bg-[#131d38] border-slate-700/80 text-slate-100' : 'bg-white border-gray-200'
            }`}>
              <div>
                <h3 className={`font-sans font-black text-[11px] uppercase tracking-wider ${
                  theme === 'dark' ? 'text-blue-300' : 'text-[#032b5e]'
                }`}>
                  QUEBRAS POR TURNO
                </h3>
                <span className="text-[9px] text-gray-400 font-bold mt-0.5 block">
                  Clique na barra para filtrar por turno
                </span>
              </div>

              <div className="h-32 w-full cursor-pointer">
                {turnoChartData.every(t => t.value === 0) ? (
                  <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                    Sem dados
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={turnoChartData} margin={{ top: 5, right: 5, left: -30, bottom: 5 }} accessibilityLayer={false}>
                      <CartesianGrid stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'} vertical={false} />
                      <XAxis dataKey="name" stroke={theme === 'dark' ? '#64748b' : '#94a3b8'} fontSize={8} tickLine={false} axisLine={false} />
                      <YAxis stroke={theme === 'dark' ? '#64748b' : '#94a3b8'} fontSize={8} tickLine={false} axisLine={false} />
                      <Tooltip 
                        cursor={{ fill: 'transparent' }} 
                        contentStyle={{ 
                          backgroundColor: theme === 'dark' ? '#0f172a' : '#fff', 
                          border: theme === 'dark' ? '2px solid #334155' : '2px solid #cbd5e1', 
                          borderRadius: '12px', 
                          padding: '10px 14px',
                          boxShadow: '0 12px 28px -4px rgba(0, 0, 0, 0.25), 0 6px 12px -3px rgba(0, 0, 0, 0.12)',
                          fontSize: 13, 
                          color: theme === 'dark' ? '#f8fafc' : '#0f172a'
                        }} 
                        labelStyle={{ 
                          color: theme === 'dark' ? '#38bdf8' : '#032b5e', 
                          fontWeight: '800', 
                          fontSize: '13px',
                          marginBottom: '4px',
                          borderBottom: theme === 'dark' ? '1px solid #1e293b' : '1px solid #e2e8f0',
                          paddingBottom: '3px'
                        }}
                        itemStyle={{ color: '#ef4444', fontSize: '13px', fontWeight: '700' }}
                        formatter={(val: any) => [
                          viewUnit === 'rs' 
                            ? `R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                            : `${Number(val).toLocaleString('pt-BR')} ${viewUnit === 'hl' ? 'HL' : 'UN'}`,
                          viewUnit === 'rs' ? 'Valor' : viewUnit === 'hl' ? 'Volume' : 'Quantidade'
                        ]}
                      />
                      <Bar 
                        dataKey="value" 
                        radius={[4, 4, 0, 0]} 
                        barSize={25}
                        isAnimationActive={false}
                        onClick={(entry) => {
                          if (entry && entry.name) {
                            toggleFilter('turno', entry.name, 'Turno');
                          }
                        }}
                      >
                        <LabelList 
                          dataKey="value" 
                          position="top" 
                          fontSize={8.5} 
                          fontWeight={800} 
                          fill={theme === 'dark' ? '#93c5fd' : '#032b5e'} 
                          formatter={(val: number) => viewUnit === 'rs' ? `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : val.toLocaleString('pt-BR')} 
                        />
                        {turnoChartData.map((entry, index) => {
                          const isSelected = isFiltered('turno', entry.name);
                          const opacity = isTurnoFiltered ? (isSelected ? 1.0 : 0.3) : 1.0;
                          return (
                            <Cell 
                              key={`cell-turno-${index}`} 
                              fill={index === 0 ? '#f5a623' : (theme === 'dark' ? '#3b82f6' : '#032b5e')} 
                              fillOpacity={opacity}
                              stroke={isSelected ? '#ef4444' : undefined}
                              strokeWidth={isSelected ? 2 : 0}
                            />
                          );
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Quick stats on Shift */}
              <div className={`flex justify-around items-center p-2 rounded-lg border ${
                theme === 'dark' ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-gray-100'
              }`}>
                <div 
                  onClick={() => toggleFilter('turno', 'MANHÃ', 'Turno')}
                  className={`text-center cursor-pointer p-1 rounded-md transition-colors ${
                    isFiltered('turno', 'MANHÃ') ? 'bg-amber-100/30 border border-amber-300' : (theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-100')
                  }`}
                >
                  <span className="text-[8px] font-black text-[#f5a623] block">MANHÃ</span>
                  <span className={`text-[10px] font-extrabold ${theme === 'dark' ? 'text-slate-200' : 'text-[#334155]'}`}>{turnoMap['MANHÃ']} u</span>
                </div>
                <div className={`w-[1px] h-5 ${theme === 'dark' ? 'bg-slate-700' : 'bg-gray-200'}`} />
                <div 
                  onClick={() => toggleFilter('turno', 'NOITE / MADRUGADA', 'Turno')}
                  className={`text-center cursor-pointer p-1 rounded-md transition-colors ${
                    isFiltered('turno', 'NOITE / MADRUGADA') ? 'bg-amber-100/30 border border-amber-300' : (theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-100')
                  }`}
                >
                  <span className={`text-[8px] font-black block ${theme === 'dark' ? 'text-blue-300' : 'text-[#032b5e]'}`}>NOITE</span>
                  <span className={`text-[10px] font-extrabold ${theme === 'dark' ? 'text-slate-200' : 'text-[#334155]'}`}>{turnoMap['NOITE / MADRUGADA']} u</span>
                </div>
              </div>
            </div>

          </div>



          {/* REQUISITO 23: ÁRVORE DE MOTIVOS E HIERARQUIA DE PERDAS (FAST SUMMARY IN BI TAB) */}
          <div className="w-full mt-4">
            <div className={`p-4.5 rounded-xl border shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors ${
              theme === 'dark' ? 'bg-gradient-to-r from-[#111a30] via-[#162344] to-[#111a30] border-amber-500/30' : 'bg-gradient-to-r from-amber-50/70 via-orange-50/40 to-amber-50/70 border-amber-200'
            }`}>
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-500 shrink-0 shadow-xs">
                  <Layers className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h3 className={`font-sans font-black text-xs uppercase tracking-wider flex items-center gap-2 ${
                    theme === 'dark' ? 'text-amber-300' : 'text-amber-900'
                  }`}>
                    🌳 ÁRVORE DE HIERARQUIA & DECOMPOSIÇÃO DE PERDAS (5 NÍVEIS)
                  </h3>
                  <p className={`text-[11px] font-medium mt-0.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                    Total Geral → Mês → Motivo DPO → Embalagem → Top 10 Produtos Ofensores ({crossFilteredData.length.toLocaleString('pt-BR')} registros ativos).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('arvore')}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center gap-2 shadow-sm uppercase tracking-wider border border-amber-300/60 hover:scale-[1.02] active:scale-95"
                >
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>Explorar Árvore Completa</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* COLABORADOR / OPERADOR QUEBRAS & OFENSORES SECTION */}
          <div className="w-full mt-4">
            <div className={`p-5 rounded-xl border shadow-sm transition-colors ${
              theme === 'dark' ? 'bg-[#131d38] border-slate-700/80 text-slate-100' : 'bg-white border-gray-200'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-500 shrink-0">
                    <Users className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div>
                    <h3 className={`font-sans font-black text-xs uppercase tracking-wider flex items-center gap-2 ${
                      theme === 'dark' ? 'text-indigo-300' : 'text-[#032b5e]'
                    }`}>
                      👷‍♂️ REGISTROS & OFENSORES POR COLABORADOR / OPERADOR ({colaboradorTableData.length})
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                      Auditoria de apontamentos de quebras por movimentação, armazém e rotas em tempo real. Clique em um operador para filtrar o dashboard.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-indigo-500 font-bold bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
                    {colaboradorTableData.reduce((acc, c) => acc + c.totalQtd, 0).toLocaleString('pt-BR')} unidades registradas
                  </span>
                </div>
              </div>

              {/* Grid with Chart and Fast Ranking Table */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Mini Bar Chart - Top Colaboradores */}
                <div className={`lg:col-span-5 p-3.5 rounded-lg border flex flex-col justify-between ${
                  theme === 'dark' ? 'bg-slate-900/60 border-slate-700/60' : 'bg-slate-50/70 border-slate-200/70'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Top Ofensores Operacionais
                    </span>
                    <span className="text-[9px] font-mono text-indigo-400 font-bold">
                      {viewUnit === 'rs' ? 'Valor (R$)' : viewUnit === 'hl' ? 'Volume (HL)' : 'Qtd (UN)'}
                    </span>
                  </div>

                  <div className="h-[220px] w-full">
                    {colaboradorChartData.length === 0 ? (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                        Nenhum colaborador com quebra registrada no filtro ativo
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={colaboradorChartData} layout="vertical" margin={{ top: 5, right: 25, left: 10, bottom: 5 }}>
                          <CartesianGrid stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'} horizontal={false} />
                          <XAxis type="number" stroke={theme === 'dark' ? '#64748b' : '#94a3b8'} fontSize={8} tickLine={false} axisLine={false} />
                          <YAxis type="category" dataKey="name" stroke={theme === 'dark' ? '#64748b' : '#94a3b8'} fontSize={8.5} tickLine={false} axisLine={false} width={85} />
                          <Tooltip
                            contentStyle={{ 
                              backgroundColor: theme === 'dark' ? '#0f172a' : '#fff', 
                              border: theme === 'dark' ? '2px solid #334155' : '2px solid #cbd5e1', 
                              borderRadius: '10px', 
                              padding: '8px 12px',
                              fontSize: 12, 
                              color: theme === 'dark' ? '#f8fafc' : '#0f172a'
                            }}
                            formatter={(val: any, name: string, item: any) => [
                              viewUnit === 'rs' 
                                ? `R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                                : `${Number(val).toLocaleString('pt-BR')} ${viewUnit === 'hl' ? 'HL' : 'UN'}`,
                              `Total (${item?.payload?.funcao || 'Operador'})`
                            ]}
                          />
                          <Bar 
                            dataKey="value" 
                            radius={[0, 4, 4, 0]} 
                            barSize={16}
                            onClick={(entry: any) => {
                              if (entry && (entry.fullName || entry.name)) {
                                toggleFilter('colaborador', entry.fullName || entry.name, 'Colaborador');
                              }
                            }}
                          >
                            <LabelList 
                              dataKey="value" 
                              position="right" 
                              fontSize={8} 
                              fontWeight={800} 
                              fill={theme === 'dark' ? '#a5b4fc' : '#4338ca'} 
                              formatter={(val: number) => viewUnit === 'rs' ? `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : val.toLocaleString('pt-BR')} 
                            />
                            {colaboradorChartData.map((entry, index) => {
                              const isSelected = isFiltered('colaborador', entry.fullName);
                              const opacity = isColaboradorFiltered ? (isSelected ? 1.0 : 0.3) : 1.0;
                              return (
                                <Cell 
                                  key={`cell-colab-${index}`} 
                                  fill={index === 0 ? '#ef4444' : index === 1 ? '#f59e0b' : '#6366f1'} 
                                  fillOpacity={opacity}
                                  stroke={isSelected ? '#f59e0b' : undefined}
                                  strokeWidth={isSelected ? 2 : 0}
                                />
                              );
                            })}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* Detailed Table */}
                <div className="lg:col-span-7 overflow-x-auto max-h-[260px] overflow-y-auto">
                  <table className="w-full border-collapse font-sans text-xs min-w-[550px]">
                    <thead>
                      <tr className={`border-b sticky top-0 z-10 ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-gray-200 text-gray-500'}`}>
                        <th className="p-2 text-left uppercase tracking-wider text-[9px]">Colaborador</th>
                        <th className="p-2 text-left uppercase tracking-wider text-[9px]">Função</th>
                        <th className="p-2 text-right uppercase tracking-wider text-[9px]">Movimentação (UN)</th>
                        <th className="p-2 text-right uppercase tracking-wider text-[9px]">Total (UN)</th>
                        <th className="p-2 text-right uppercase tracking-wider text-[9px]">Impacto R$</th>
                        <th className="p-2 text-left uppercase tracking-wider text-[9px]">Principal Motivo</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${theme === 'dark' ? 'divide-slate-800' : 'divide-gray-100'}`}>
                      {colaboradorTableData.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-gray-400 font-bold uppercase text-[10px]">
                            Nenhum registro encontrado para os filtros selecionados
                          </td>
                        </tr>
                      ) : (
                        colaboradorTableData.map((item, idx) => {
                          const isSelected = isFiltered('colaborador', item.nome);
                          return (
                            <tr 
                              key={`colab-row-${item.nome}-${idx}`}
                              onClick={() => toggleFilter('colaborador', item.nome, 'Colaborador')}
                              title={`Filtrar por ${item.nome}`}
                              className={`cursor-pointer transition-colors ${
                                isSelected
                                  ? (theme === 'dark' ? 'bg-indigo-500/20 text-indigo-200 font-bold border-l-4 border-indigo-400' : 'bg-indigo-100/80 font-bold border-l-4 border-indigo-500')
                                  : (theme === 'dark' ? 'hover:bg-slate-800/60' : 'hover:bg-indigo-50/50')
                              }`}
                            >
                              <td className="p-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-bold text-slate-400 font-mono">#{idx + 1}</span>
                                  <span className={`font-black uppercase text-[11px] ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
                                    {item.nome}
                                  </span>
                                </div>
                              </td>
                              <td className="p-2 text-[10px] text-slate-400 font-medium">{item.funcao}</td>
                              <td className="p-2 text-right font-mono font-bold text-amber-500">{item.quebrasMovimentacao.toLocaleString('pt-BR')} un</td>
                              <td className="p-2 text-right font-mono font-black text-rose-500">{item.totalQtd.toLocaleString('pt-BR')} un</td>
                              <td className="p-2 text-right font-mono font-bold text-emerald-500">
                                {item.totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              </td>
                              <td className="p-2 text-[10px] text-slate-400 truncate max-w-[140px]" title={item.topMotivo}>
                                {item.topMotivo}
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
          </div>

          {/* DETAILED SKU RANKING TABLE (PAGINATED & HIGH PERFORMANCE) */}
          <div className="w-full mt-4">
            <div className={`p-5 rounded-xl border shadow-sm transition-colors ${
              theme === 'dark' ? 'bg-[#131d38] border-slate-700/80 text-slate-100' : 'bg-white border-gray-200'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                <div>
                  <h3 className={`font-sans font-black text-xs uppercase tracking-wider ${
                    theme === 'dark' ? 'text-blue-300' : 'text-[#032b5e]'
                  }`}>
                    RANKING DE PRODUTOS OFENSORES (SKUs) ({sortedSkus.length})
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                    Detalhamento de perdas por produto. Clique em qualquer produto para filtrar todo o dashboard.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-medium bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                    Clique na linha para filtrar
                  </span>
                  {sortedSkus.length > SKU_PAGE_SIZE && (
                    <div className="flex items-center gap-1.5 ml-2">
                      <button
                        onClick={() => setSkuPage(p => Math.max(1, p - 1))}
                        disabled={skuPage === 1}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                          skuPage === 1 
                            ? 'opacity-40 cursor-not-allowed bg-slate-200 dark:bg-slate-800 text-slate-400' 
                            : 'bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 cursor-pointer'
                        }`}
                      >
                        Anterior
                      </button>
                      <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">
                        {skuPage} / {Math.ceil(sortedSkus.length / SKU_PAGE_SIZE)}
                      </span>
                      <button
                        onClick={() => setSkuPage(p => Math.min(Math.ceil(sortedSkus.length / SKU_PAGE_SIZE), p + 1))}
                        disabled={skuPage >= Math.ceil(sortedSkus.length / SKU_PAGE_SIZE)}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                          skuPage >= Math.ceil(sortedSkus.length / SKU_PAGE_SIZE)
                            ? 'opacity-40 cursor-not-allowed bg-slate-200 dark:bg-slate-800 text-slate-400' 
                            : 'bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 cursor-pointer'
                        }`}
                      >
                        Próxima
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <table className="w-full border-collapse font-sans text-xs min-w-[700px]">
                  <thead>
                    <tr className={`border-b sticky top-0 z-10 ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-gray-200 text-gray-500'}`}>
                      <th className="p-2.5 text-left uppercase tracking-wider text-[9px]">Posição</th>
                      <th className="p-2.5 text-left uppercase tracking-wider text-[9px]">Código</th>
                      <th className="p-2.5 text-left uppercase tracking-wider text-[9px]">Descrição</th>
                      <th className="p-2.5 text-right uppercase tracking-wider text-[9px]">Unidades Avariadas</th>
                      <th className="p-2.5 text-right uppercase tracking-wider text-[9px]">Impacto Financeiro</th>
                      <th className="p-2.5 text-right uppercase tracking-wider text-[9px]">Impacto em Hectolitro (HE)</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${theme === 'dark' ? 'divide-slate-800' : 'divide-gray-100'}`}>
                    {sortedSkus.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-gray-400 font-bold uppercase text-[10px]">
                          Sem produtos no ranking para os filtros selecionados
                        </td>
                      </tr>
                    ) : (
                      sortedSkus.slice((skuPage - 1) * SKU_PAGE_SIZE, skuPage * SKU_PAGE_SIZE).map((item, idxOffset) => {
                        const index = (skuPage - 1) * SKU_PAGE_SIZE + idxOffset;
                        const isSelected = isFiltered('produto', item.desc) || isFiltered('produto', item.cod) || isFiltered('codProduto', item.cod);
                        const filterVal = (item.cod && item.cod !== 'S/C') ? item.cod : item.desc;
                        const filterLabel = (item.cod && item.cod !== 'S/C') ? `SKU ${item.cod} - ${item.desc}` : item.desc;
                        return (
                          <tr 
                            key={`sku-row-${item.cod}-${item.desc}-${index}`} 
                            onClick={() => toggleFilter('produto', filterVal, 'Produto')}
                            title={`Filtrar por ${filterLabel}`}
                            className={`cursor-pointer transition-colors ${
                              isSelected 
                                ? (theme === 'dark' ? 'bg-amber-500/20 text-amber-200 font-bold border-l-4 border-amber-400' : 'bg-amber-100/80 font-bold border-l-4 border-amber-500') 
                                : (theme === 'dark' ? 'hover:bg-slate-800/60' : 'hover:bg-amber-50/60')
                            }`}
                          >
                            <td className={`p-2.5 font-bold ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>#{index + 1}</td>
                            <td className={`p-2.5 font-mono font-bold ${theme === 'dark' ? 'text-blue-300' : 'text-slate-700'}`}>{item.cod}</td>
                            <td className={`p-2.5 font-semibold uppercase ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{item.desc}</td>
                            <td className="p-2.5 text-right text-[#ef4444] font-black">{item.quantCx.toLocaleString('pt-BR')} un</td>
                            <td className={`p-2.5 text-right font-bold font-mono ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-700'}`}>
                              {item.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </td>
                            <td className={`p-2.5 text-right font-bold font-mono ${theme === 'dark' ? 'text-blue-300' : 'text-blue-800'}`}>
                              {item.quantHE.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} HE
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
        </>
      )}

      {activeSubTab === 'arvore' && (
        <>
          {/* HEADER DROPDOWN FILTERS */}
          <div className={`flex flex-wrap items-center justify-between gap-4 p-3.5 rounded-xl border shadow-sm transition-colors ${
            theme === 'dark' ? 'bg-[#131d38] border-slate-700/80 text-slate-100' : 'bg-white border-gray-200'
          }`}>
            <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
              {/* Period selector */}
              <div className="flex flex-col gap-1 min-w-[260px]">
                <span className={`text-[9px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-slate-400' : 'text-gray-400'}`}>Período</span>
                <CalendarFilter
                  startDate={startDate}
                  endDate={endDate}
                  onChange={(start, end) => {
                    setStartDate(start);
                    setEndDate(end);
                  }}
                />
              </div>

              {/* Area filter */}
              <div className="flex flex-col gap-1 w-[160px]">
                <span className={`text-[9px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-slate-400' : 'text-gray-400'}`}>Área</span>
                <select 
                  value={filterArea} 
                  onChange={e => setFilterArea(e.target.value)} 
                  className={`w-full font-sans font-bold rounded-lg outline-none px-2.5 py-1 text-[10px] h-[28px] cursor-pointer transition-all ${
                    theme === 'dark' 
                      ? 'bg-[#1e2942] border border-slate-600 text-slate-100 hover:border-blue-400' 
                      : 'bg-white border border-gray-200 text-[#032b5e] hover:border-blue-400 focus:border-[#032b5e]'
                  }`}
                >
                  <option value="TODAS">Todas as Áreas</option>
                  <option value="ARMAZEM">Armazém / Depósito</option>
                  <option value="ENTREGA">Rota de Entrega</option>
                  <option value="MERCADO">Mercado / Retorno</option>
                  <option value="PUXADA">Puxada / Transferência</option>
                </select>
              </div>

              {/* Turno filter */}
              <div className="flex flex-col gap-1 w-[130px]">
                <span className={`text-[9px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-slate-400' : 'text-gray-400'}`}>Turno</span>
                <select 
                  value={filterTurno} 
                  onChange={e => setFilterTurno(e.target.value)} 
                  className={`w-full font-sans font-bold rounded-lg outline-none px-2.5 py-1 text-[10px] h-[28px] cursor-pointer transition-all ${
                    theme === 'dark' 
                      ? 'bg-[#1e2942] border border-slate-600 text-slate-100 hover:border-blue-400' 
                      : 'bg-white border border-gray-200 text-[#032b5e] hover:border-blue-400 focus:border-[#032b5e]'
                  }`}
                >
                  <option value="TODOS">Todos os Turnos</option>
                  <option value="MANHÃ">Manhã</option>
                  <option value="NOITE / MADRUGADA">Noite / Madrugada</option>
                </select>
              </div>

              {/* Packaging filter */}
              <div className="flex flex-col gap-1 w-[150px]">
                <span className={`text-[9px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-slate-400' : 'text-gray-400'}`}>Embalagem</span>
                <select 
                  value={filterEmbalagem} 
                  onChange={e => setFilterEmbalagem(e.target.value)} 
                  className={`w-full font-sans font-bold rounded-lg outline-none px-2.5 py-1 text-[10px] h-[28px] cursor-pointer transition-all ${
                    theme === 'dark' 
                      ? 'bg-[#1e2942] border border-slate-600 text-slate-100 hover:border-blue-400' 
                      : 'bg-white border border-gray-200 text-[#032b5e] hover:border-blue-400 focus:border-[#032b5e]'
                  }`}
                >
                  <option value="TODAS">Todas Embalagens</option>
                  {availableEmbalagens.map(emb => (
                    <option key={emb} value={emb}>{emb}</option>
                  ))}
                </select>
              </div>

              {/* Group filter */}
              <div className="flex flex-col gap-1 w-[140px]">
                <span className={`text-[9px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-slate-400' : 'text-gray-400'}`}>Grupo</span>
                <select 
                  value={filterGrupo} 
                  onChange={e => setFilterGrupo(e.target.value)} 
                  className={`w-full font-sans font-bold rounded-lg outline-none px-2.5 py-1 text-[10px] h-[28px] cursor-pointer transition-all ${
                    theme === 'dark' 
                      ? 'bg-[#1e2942] border border-slate-600 text-slate-100 hover:border-blue-400' 
                      : 'bg-white border border-gray-200 text-[#032b5e] hover:border-blue-400 focus:border-[#032b5e]'
                  }`}
                >
                  <option value="TODOS">Todos os Grupos</option>
                  {availableGrupos.map(grp => (
                    <option key={grp} value={grp}>{grp}</option>
                  ))}
                </select>
              </div>

              {/* Motivo filter */}
              <div className="flex flex-col gap-1 w-[160px]">
                <span className={`text-[9px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-slate-400' : 'text-gray-400'}`}>Motivo</span>
                <select 
                  value={filterMotivo} 
                  onChange={e => setFilterMotivo(e.target.value)} 
                  className={`w-full font-sans font-bold rounded-lg outline-none px-2.5 py-1 text-[10px] h-[28px] cursor-pointer transition-all ${
                    theme === 'dark' 
                      ? 'bg-[#1e2942] border border-slate-600 text-slate-100 hover:border-blue-400' 
                      : 'bg-white border border-gray-200 text-[#032b5e] hover:border-blue-400 focus:border-[#032b5e]'
                  }`}
                >
                  <option value="TODOS">Todos os Motivos</option>
                  {availableMotivos.map(mot => (
                    <option key={mot.value} value={mot.value}>{mot.label}</option>
                  ))}
                </select>
              </div>

              {/* Colaborador filter */}
              <div className="flex flex-col gap-1 w-[170px]">
                <span className={`text-[9px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-slate-400' : 'text-gray-400'}`}>Colaborador</span>
                <select 
                  value={filterColaborador} 
                  onChange={e => setFilterColaborador(e.target.value)} 
                  className={`w-full font-sans font-bold rounded-lg outline-none px-2.5 py-1 text-[10px] h-[28px] cursor-pointer transition-all ${
                    theme === 'dark' 
                      ? 'bg-[#1e2942] border border-slate-600 text-slate-100 hover:border-blue-400' 
                      : 'bg-white border border-gray-200 text-[#032b5e] hover:border-blue-400 focus:border-[#032b5e]'
                  }`}
                >
                  <option value="TODOS">Todos Colaboradores</option>
                  {availableColaboradores.map(colab => (
                    <option key={colab} value={colab}>{colab}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {hasActiveHeaderFilters && (
                <button
                  onClick={handleResetAllFilters}
                  className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  Limpar Filtros
                </button>
              )}
            </div>
          </div>

          {/* ACTIVE CROSS-FILTERS TOOLBAR BANNER */}
          <ActiveCrossFiltersBar onClearAll={handleResetAllFilters} />

          {/* TOP KPI CARDS (DASHBOARD PRINCIPAL ACIMA DA ÁRVORE) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* KPI 1: Total Quebrada */}
            <div className="bg-gradient-to-br from-[#ef4444] to-[#b91c1c] text-white p-4.5 rounded-xl shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[125px]">
              <div>
                <span className="text-[9px] uppercase font-black tracking-widest text-[#fecaca]/80 block">
                  {viewUnit === 'rs' 
                    ? 'VALOR TOTAL DE QUEBRAS' 
                    : viewUnit === 'hl' 
                      ? 'VOLUME TOTAL DE QUEBRAS (HL)' 
                      : 'VOLUME FÍSICO DE QUEBRAS (CX/UN)'}
                </span>
                <div className="flex items-baseline mt-2">
                  {viewUnit === 'rs' && <span className="text-2xl font-bold mr-1 text-[#fecaca]">R$</span>}
                  <span className="text-4xl font-extrabold tracking-tight">
                    {totalQuant.toLocaleString('pt-BR', { 
                      minimumFractionDigits: viewUnit === 'sku' ? 0 : 2, 
                      maximumFractionDigits: 2 
                    })}
                  </span>
                  {viewUnit !== 'rs' && (
                    <span className="text-xs font-bold uppercase ml-1.5 opacity-90">
                      {viewUnit === 'hl' ? 'HL' : 'UN'}
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-white/20 pt-2 text-[10px] text-[#fecaca]">
                <span>{crossFilteredData.length} ocorrências registradas</span>
                <span className="font-bold flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> {viewUnit === 'rs' ? 'Impacto Contábil' : 'Volume Físico'}
                </span>
              </div>
            </div>

            {/* KPI 2: Custo / Perda */}
            <div className={`p-4.5 rounded-xl shadow-sm border relative overflow-hidden flex flex-col justify-between min-h-[125px] transition-colors ${
              theme === 'dark' ? 'bg-[#131d38] border-slate-700/80 text-white' : 'bg-white border-gray-200 text-slate-800'
            }`}>
              <div>
                <span className={`text-[9px] uppercase font-black tracking-widest block ${
                  theme === 'dark' ? 'text-slate-400' : 'text-gray-400'
                }`}>
                  {viewUnit === 'rs' ? 'IMPACTO FINANCEIRO ESTIMADO' : 'VALOR MONETÁRIO ESTIMADO'}
                </span>
                <div className="flex items-baseline mt-2">
                  <span className="text-xl font-bold text-gray-400 mr-1">R$</span>
                  <span className={`text-3xl font-extrabold tracking-tight ${
                    theme === 'dark' ? 'text-slate-100' : 'text-[#032b5e]'
                  }`}>
                    {totalCusto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-gray-100 dark:border-slate-800 pt-2 text-[10px] text-gray-500 dark:text-slate-400">
                <span>Custo médio unitário</span>
                <span className="font-extrabold text-amber-500">
                  R$ {(totalQuant > 0 ? totalCusto / totalQuant : 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* KPI 3: Principal Motivo 80/20 */}
            <div className={`p-4.5 rounded-xl shadow-sm border relative overflow-hidden flex flex-col justify-between min-h-[125px] transition-colors ${
              theme === 'dark' ? 'bg-[#131d38] border-slate-700/80 text-white' : 'bg-white border-gray-200 text-slate-800'
            }`}>
              <div>
                <span className={`text-[9px] uppercase font-black tracking-widest block ${
                  theme === 'dark' ? 'text-slate-400' : 'text-gray-400'
                }`}>
                  OFENSOR PRINCIPAL (80/20)
                </span>
                <div className={`text-base font-extrabold truncate mt-2 ${
                  theme === 'dark' ? 'text-slate-100' : 'text-[#032b5e]'
                }`} title={topReasonName}>
                  {topReasonName}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-gray-100 dark:border-slate-800 pt-2 text-[10px] text-gray-500 dark:text-slate-400">
                <span>Concentração</span>
                <span className="font-extrabold text-[#ef4444]">
                  {topReasonShare.toFixed(1)}% das quebras
                </span>
              </div>
            </div>

            {/* KPI 4: Área Mais Crítica */}
            <div className={`p-4.5 rounded-xl shadow-sm border relative overflow-hidden flex flex-col justify-between min-h-[125px] transition-colors ${
              theme === 'dark' ? 'bg-[#131d38] border-slate-700/80 text-white' : 'bg-white border-gray-200 text-slate-800'
            }`}>
              <div>
                <span className={`text-[9px] uppercase font-black tracking-widest block ${
                  theme === 'dark' ? 'text-slate-400' : 'text-gray-400'
                }`}>
                  ÁREA OPERACIONAL CRÍTICA
                </span>
                <div className={`text-base font-extrabold truncate mt-2 ${
                  theme === 'dark' ? 'text-slate-100' : 'text-[#032b5e]'
                }`}>
                  {topAreaName}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-gray-100 dark:border-slate-800 pt-2 text-[10px] text-gray-500 dark:text-slate-400">
                <span>Concentração</span>
                <span className="font-extrabold text-blue-500">
                  {topAreaShare.toFixed(1)}% do volume total
                </span>
              </div>
            </div>
          </div>

          {/* ÁRVORE DE DECOMPOSIÇÃO DE PERDAS (5 NÍVEIS) */}
          <div className="w-full mt-2 space-y-3">
            <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
              theme === 'dark' ? 'bg-[#111a30] border-slate-700/80' : 'bg-slate-50 border-slate-200'
            }`}>
              <div>
                <h3 className={`font-sans font-black text-xs uppercase tracking-wider flex items-center gap-2 ${
                  theme === 'dark' ? 'text-amber-300' : 'text-amber-700'
                }`}>
                  🌳 ÁRVORE DE HIERARQUIA E DECOMPOSIÇÃO DE PERDAS (LOSS TREE)
                </h3>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                  Navegue visualmente pelos 5 níveis hierárquicos (Total → Mês → Família → Embalagem → SKU) com conectores dinâmicos.
                </p>
              </div>

              <div className="flex items-center gap-1.5 p-1 bg-slate-800/80 dark:bg-slate-900/90 rounded-lg border border-slate-700 self-stretch sm:self-auto justify-center">
                <button
                  type="button"
                  onClick={() => setTreeViewMode('diagram')}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                    treeViewMode === 'diagram'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ✨ Diagrama Visual (5 Níveis)
                </button>
                <button
                  type="button"
                  onClick={() => setTreeViewMode('classic')}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                    treeViewMode === 'classic'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  📁 Lista em Pastas (Clássica)
                </button>
              </div>
            </div>

            {treeViewMode === 'diagram' ? (
              <LossHierarchyTree quebras={crossFilteredData} />
            ) : (
              <ArvoreMotivosTree data={crossFilteredData} viewUnit={viewUnit} theme={theme} />
            )}
          </div>

          {/* DETAILED SKU RANKING TABLE */}
          <div className="w-full mt-4">
            <div className={`p-5 rounded-xl border shadow-sm transition-colors ${
              theme === 'dark' ? 'bg-[#131d38] border-slate-700/80 text-slate-100' : 'bg-white border-gray-200'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                <div>
                  <h3 className={`font-sans font-black text-xs uppercase tracking-wider ${
                    theme === 'dark' ? 'text-slate-100' : 'text-[#032b5e]'
                  }`}>
                    Ranking de Produtos Ofensores (SKUs)
                  </h3>
                  <span className="text-[10px] text-gray-400 font-medium">
                    Listagem detalhada consolidada com filtros cruzados ativos
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`border-b text-[9px] uppercase tracking-wider ${
                      theme === 'dark' ? 'border-slate-700 text-slate-400' : 'border-gray-100 text-gray-400'
                    }`}>
                      <th className="py-2.5 px-3">Cód</th>
                      <th className="py-2.5 px-3">Descrição do SKU</th>
                      <th className="py-2.5 px-3">Embalagem</th>
                      <th className="py-2.5 px-3 text-right">Volume (HL)</th>
                      <th className="py-2.5 px-3 text-right">Quantidade</th>
                      <th className="py-2.5 px-3 text-right">Valor Total (R$)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-xs">
                    {skuRanking.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-gray-400 text-xs">
                          Nenhum registro encontrado para os filtros selecionados.
                        </td>
                      </tr>
                    ) : (
                      skuRanking.slice(0, 15).map((item, idx) => {
                        return (
                          <tr key={idx} className={`transition-colors ${
                            theme === 'dark' ? 'hover:bg-slate-800/40' : 'hover:bg-gray-50'
                          }`}>
                            <td className="py-2.5 px-3 font-mono font-bold text-gray-400 text-[11px]">{item.cod}</td>
                            <td className="py-2.5 px-3 font-bold">{item.desc}</td>
                            <td className="py-2.5 px-3 font-medium text-gray-500">{item.emb}</td>
                            <td className="py-2.5 px-3 text-right font-bold text-blue-600 dark:text-blue-400">
                              {item.volumeHl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} HL
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold">
                              {item.quantidade.toLocaleString('pt-BR')} un
                            </td>
                            <td className="py-2.5 px-3 text-right font-extrabold text-red-600 dark:text-red-400">
                              R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
        </>
      )}

      {activeSubTab === 'wqi' && (
        <WqiTab 
          empresaId={empresa?.id || 'demo'}
          startDate={startDate}
          endDate={endDate}
          onDateChange={(start, end) => {
            setStartDate(start);
            setEndDate(end);
          }}
          viewUnit={viewUnit}
          theme={theme}
          initialFilterMotivo={filterMotivo}
          initialFilterArea={filterArea}
          initialFilterEmbalagem={filterEmbalagem}
          initialFilterColaborador={filterColaborador}
        />
      )}

      {(activeSubTab === 'acoes' || activeSubTab === 'boarda3') && (
        <QuadroAcoesDpo
          user={user}
          empresa={empresa}
          theme={theme}
          processoFilter="Quebras"
          title="Quadro de Ações — Gestão e Recolha de Quebras"
          subtitle="Tratativas DPO, contramedidas 5W2H e planos de ação para redução de perdas no armazém."
          onBack={() => setActiveSubTab('indicadores')}
        />
      )}

      {/* SUBTAB: HISTÓRICO & LANÇAMENTOS DA OPERAÇÃO (AJUDANTE + OFICIAL) */}
      {activeSubTab === 'registros' && (
        <div className="flex flex-col gap-5">
          {/* Header Summary Card */}
          <div className={`p-4 md:p-5 rounded-2xl border shadow-sm transition-colors ${
            theme === 'dark' ? 'bg-[#131d38] border-slate-700/80' : 'bg-white border-gray-200'
          }`}>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                    <FileText className="w-5 h-5" />
                  </span>
                  <div>
                    <h2 className={`font-sans font-black text-lg uppercase tracking-tight ${
                      theme === 'dark' ? 'text-white' : 'text-[#032b5e]'
                    }`}>
                      Histórico &amp; Lançamentos da Operação
                    </h2>
                    <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>
                      Auditoria unificada dos apontamentos recolhidos pelo ajudante na Guia de Produtividade e consolidados com a base oficial.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleSyncRecords}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border cursor-pointer ${
                    theme === 'dark' 
                      ? 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-200' 
                      : 'bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-700'
                  }`}
                  title="Recarregar registros em tempo real"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-blue-500" />
                  <span>Sincronizar</span>
                </button>

                <button
                  onClick={handleExportDetailedExcel}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-xs uppercase tracking-wider text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm border-none cursor-pointer transition-all"
                  title="Exportar registros filtrados em planilha Excel (.xlsx)"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Exportar Excel</span>
                </button>
              </div>
            </div>

            {/* Metrics Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-slate-700/60">
              <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-[#182343] border-slate-700' : 'bg-emerald-50/50 border-emerald-100'}`}>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                  Recolhidos pelo Ajudante
                </span>
                <span className="text-xl font-black font-mono text-emerald-700 dark:text-emerald-300 block mt-0.5">
                  {customOperationalCount}
                </span>
                <span className="text-[10px] text-gray-400">Levantamentos operacionais</span>
              </div>

              <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-[#182343] border-slate-700' : 'bg-blue-50/50 border-blue-100'}`}>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                  Total de Lançamentos
                </span>
                <span className="text-xl font-black font-mono text-blue-700 dark:text-blue-300 block mt-0.5">
                  {filteredRecordsList.length}
                </span>
                <span className="text-[10px] text-gray-400">Linhas sob filtros</span>
              </div>

              <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-[#182343] border-slate-700' : 'bg-purple-50/50 border-purple-100'}`}>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 block">
                  Volume Consolidado
                </span>
                <span className="text-xl font-black font-mono text-purple-700 dark:text-purple-300 block mt-0.5">
                  {filteredRecordsList.reduce((acc, q) => acc + convertCxToHE(q.quantidade, q.descricao, q.codProduto), 0).toFixed(2)} HL
                </span>
                <span className="text-[10px] text-gray-400">
                  {filteredRecordsList.reduce((acc, q) => acc + (q.quantidade || 0), 0).toLocaleString('pt-BR')} caixas/un
                </span>
              </div>

              <div className={`p-3 rounded-xl border ${theme === 'dark' ? 'bg-[#182343] border-slate-700' : 'bg-red-50/50 border-red-100'}`}>
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400 block">
                  Custo Total de Quebras
                </span>
                <span className="text-xl font-black font-mono text-red-700 dark:text-red-400 block mt-0.5">
                  {filteredRecordsList.reduce((acc, q) => acc + getItemValorReal(q), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
                <span className="text-[10px] text-gray-400">Impacto financeiro apurado</span>
              </div>
            </div>
          </div>

          {/* Controls Bar: Search & Filters */}
          <div className={`p-4 rounded-2xl border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors ${
            theme === 'dark' ? 'bg-[#131d38] border-slate-700/80' : 'bg-white border-gray-200'
          }`}>
            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={recordsSearch}
                onChange={e => {
                  setRecordsSearch(e.target.value);
                  setRecordsPage(1);
                }}
                placeholder="Buscar por SKU, descrição, ajudante, motivo ou área..."
                className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl font-medium outline-none transition-all ${
                  theme === 'dark'
                    ? 'bg-[#1b2646] border border-slate-700 text-white placeholder-slate-400 focus:border-blue-500'
                    : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#032b5e]'
                }`}
              />
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Origem Selector */}
              <div className={`flex items-center p-1 rounded-xl border text-[11px] font-bold ${
                theme === 'dark' ? 'bg-[#1b2646] border-slate-700' : 'bg-gray-100 border-gray-200'
              }`}>
                <button
                  onClick={() => { setRecordsFilterOrigem('TODOS'); setRecordsPage(1); }}
                  className={`px-2.5 py-1 rounded-lg transition-all border-none cursor-pointer ${
                    recordsFilterOrigem === 'TODOS'
                      ? (theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-[#032b5e] text-white')
                      : (theme === 'dark' ? 'text-slate-400' : 'text-gray-600')
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => { setRecordsFilterOrigem('AJUDANTE'); setRecordsPage(1); }}
                  className={`px-2.5 py-1 rounded-lg transition-all border-none cursor-pointer flex items-center gap-1 ${
                    recordsFilterOrigem === 'AJUDANTE'
                      ? 'bg-emerald-600 text-white'
                      : (theme === 'dark' ? 'text-slate-400' : 'text-gray-600')
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                  Ajudante
                </button>
                <button
                  onClick={() => { setRecordsFilterOrigem('OFICIAL'); setRecordsPage(1); }}
                  className={`px-2.5 py-1 rounded-lg transition-all border-none cursor-pointer ${
                    recordsFilterOrigem === 'OFICIAL'
                      ? (theme === 'dark' ? 'bg-slate-700 text-white' : 'bg-gray-700 text-white')
                      : (theme === 'dark' ? 'text-slate-400' : 'text-gray-600')
                  }`}
                >
                  Oficial
                </button>
              </div>

              {/* Turno Dropdown */}
              <select
                value={recordsFilterTurno}
                onChange={e => { setRecordsFilterTurno(e.target.value); setRecordsPage(1); }}
                className={`text-xs px-2.5 py-2 rounded-xl font-bold outline-none cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-[#1b2646] border border-slate-700 text-white'
                    : 'bg-white border border-gray-200 text-gray-800'
                }`}
              >
                <option value="TODOS">Todos os Turnos</option>
                <option value="MANHÃ">Manhã</option>
                <option value="TARDE">Tarde</option>
                <option value="NOITE">Noite</option>
              </select>

              {/* Area Dropdown */}
              <select
                value={recordsFilterArea}
                onChange={e => { setRecordsFilterArea(e.target.value); setRecordsPage(1); }}
                className={`text-xs px-2.5 py-2 rounded-xl font-bold outline-none cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-[#1b2646] border border-slate-700 text-white'
                    : 'bg-white border border-gray-200 text-gray-800'
                }`}
              >
                <option value="TODOS">Todas as Áreas</option>
                <option value="ARMAZEM">Armazém</option>
                <option value="ENTREGA">Rota de Entrega</option>
                <option value="MERCADO">Mercado / Retorno</option>
                <option value="PUXADA">Puxada / Transferência</option>
              </select>

              {/* Date Quick Filter */}
              <div className={`flex items-center p-1 rounded-xl border text-[11px] font-bold ${
                theme === 'dark' ? 'bg-[#1b2646] border-slate-700' : 'bg-gray-100 border-gray-200'
              }`}>
                <button
                  onClick={() => { setRecordsDateFilter('TODOS'); setRecordsPage(1); }}
                  className={`px-2 py-1 rounded-lg border-none cursor-pointer ${
                    recordsDateFilter === 'TODOS'
                      ? (theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-[#032b5e] text-white')
                      : (theme === 'dark' ? 'text-slate-400' : 'text-gray-600')
                  }`}
                >
                  Geral
                </button>
                <button
                  onClick={() => { setRecordsDateFilter('HOJE'); setRecordsPage(1); }}
                  className={`px-2 py-1 rounded-lg border-none cursor-pointer ${
                    recordsDateFilter === 'HOJE'
                      ? 'bg-amber-600 text-white'
                      : (theme === 'dark' ? 'text-slate-400' : 'text-gray-600')
                  }`}
                >
                  Hoje
                </button>
                <button
                  onClick={() => { setRecordsDateFilter('7DIAS'); setRecordsPage(1); }}
                  className={`px-2 py-1 rounded-lg border-none cursor-pointer ${
                    recordsDateFilter === '7DIAS'
                      ? 'bg-amber-600 text-white'
                      : (theme === 'dark' ? 'text-slate-400' : 'text-gray-600')
                  }`}
                >
                  7 Dias
                </button>
                <button
                  onClick={() => { setRecordsDateFilter('MES'); setRecordsPage(1); }}
                  className={`px-2 py-1 rounded-lg border-none cursor-pointer ${
                    recordsDateFilter === 'MES'
                      ? 'bg-amber-600 text-white'
                      : (theme === 'dark' ? 'text-slate-400' : 'text-gray-600')
                  }`}
                >
                  Mês
                </button>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className={`rounded-2xl border shadow-sm overflow-hidden transition-colors ${
            theme === 'dark' ? 'bg-[#131d38] border-slate-700/80' : 'bg-white border-gray-200'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className={`border-b text-[10px] uppercase font-black tracking-wider ${
                    theme === 'dark' ? 'bg-[#182343] border-slate-700 text-slate-300' : 'bg-gray-50 border-gray-200 text-gray-600'
                  }`}>
                    <th className="py-3 px-3.5">Data</th>
                    <th className="py-3 px-3.5">Origem</th>
                    <th className="py-3 px-3.5">Cód. SKU</th>
                    <th className="py-3 px-3.5">Descrição do Produto</th>
                    <th className="py-3 px-3.5 text-right">Qtd</th>
                    <th className="py-3 px-3.5 text-right">Volume (HL)</th>
                    <th className="py-3 px-3.5 text-right">Valor Total (R$)</th>
                    <th className="py-3 px-3.5">Motivo / Cód.</th>
                    <th className="py-3 px-3.5">Área</th>
                    <th className="py-3 px-3.5">Turno</th>
                    <th className="py-3 px-3.5">Responsável / Ajudante</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme === 'dark' ? 'divide-slate-800' : 'divide-gray-100'}`}>
                  {filteredRecordsList.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-gray-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <AlertTriangle className="w-7 h-7 text-amber-500 opacity-60" />
                          <p className="font-bold text-sm">Nenhum registro encontrado para estes filtros.</p>
                          <p className="text-xs text-gray-500 max-w-md">
                            Tente limpar os filtros ou selecionar outra data para ver os apontamentos recolhidos pelos ajudantes.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRecordsList
                      .slice((recordsPage - 1) * RECORDS_PAGE_SIZE, recordsPage * RECORDS_PAGE_SIZE)
                      .map((row, idx) => {
                        const isAjudante = row.origem === 'AJUDANTE_OPERACAO' || Boolean((row as any).recolhidoAjudante) || String(row.id || '').startsWith('qb-custom-') || String(row.id || '').startsWith('dto-qb-');
                        const dataDisplay = row.data || (row.dataISO ? row.dataISO.split('T')[0].split('-').reverse().join('/') : '-');
                        const volHl = convertCxToHE(row.quantidade, row.descricao, row.codProduto);
                        const valTotal = getItemValorReal(row);
                        const colabNome = row.colaborador || row.colaboradorQuebrou || row.responsavel || 'Não Informado';

                        return (
                          <tr
                            key={row.id || idx}
                            className={`transition-colors ${
                              isAjudante 
                                ? (theme === 'dark' ? 'bg-emerald-950/20 hover:bg-emerald-950/30' : 'bg-emerald-50/30 hover:bg-emerald-50/60') 
                                : (theme === 'dark' ? 'hover:bg-slate-800/40' : 'hover:bg-gray-50')
                            }`}
                          >
                            <td className="py-2.5 px-3.5 font-mono font-medium whitespace-nowrap text-gray-500 dark:text-slate-400">
                              {dataDisplay}
                            </td>
                            <td className="py-2.5 px-3.5 whitespace-nowrap">
                              {isAjudante ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                                  <HardHat className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                  Ajudante
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-400">
                                  Oficial
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3.5 font-mono font-black text-gray-600 dark:text-slate-300">
                              {row.codProduto}
                            </td>
                            <td className="py-2.5 px-3.5 font-bold text-gray-900 dark:text-slate-100 max-w-[240px] truncate" title={row.descricao}>
                              {row.descricao}
                            </td>
                            <td className="py-2.5 px-3.5 text-right font-mono font-extrabold text-gray-800 dark:text-slate-200">
                              {row.quantidade || 0}
                            </td>
                            <td className="py-2.5 px-3.5 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                              {volHl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} HL
                            </td>
                            <td className="py-2.5 px-3.5 text-right font-mono font-black text-red-600 dark:text-red-400">
                              {valTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </td>
                            <td className="py-2.5 px-3.5 font-medium max-w-[180px] truncate" title={`[${row.codQuebra || '539'}] ${row.motivo}`}>
                              <span className="font-mono text-[10px] text-gray-400 mr-1">[{row.codQuebra || '539'}]</span>
                              <span>{row.motivo || 'Quebra com Movimentação'}</span>
                            </td>
                            <td className="py-2.5 px-3.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                row.area === 'ARMAZEM' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' :
                                row.area === 'ENTREGA' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' :
                                row.area === 'PUXADA' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' :
                                'bg-gray-100 text-gray-800 dark:bg-slate-800 dark:text-slate-300'
                              }`}>
                                {row.area || 'ARMAZEM'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3.5 font-medium text-gray-600 dark:text-slate-400">
                              {row.turno || 'MANHÃ'}
                            </td>
                            <td className="py-2.5 px-3.5 font-bold text-gray-800 dark:text-slate-200">
                              {colabNome}
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            {filteredRecordsList.length > RECORDS_PAGE_SIZE && (
              <div className={`p-3.5 flex items-center justify-between border-t transition-colors ${
                theme === 'dark' ? 'border-slate-800 bg-[#15203d]' : 'border-gray-200 bg-gray-50'
              }`}>
                <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">
                  Mostrando {((recordsPage - 1) * RECORDS_PAGE_SIZE) + 1} a {Math.min(recordsPage * RECORDS_PAGE_SIZE, filteredRecordsList.length)} de {filteredRecordsList.length} registros
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    disabled={recordsPage <= 1}
                    onClick={() => setRecordsPage(p => Math.max(1, p - 1))}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Anterior
                  </button>
                  <span className="text-xs font-bold px-2 py-1 text-gray-700 dark:text-slate-300">
                    Página {recordsPage} de {Math.ceil(filteredRecordsList.length / RECORDS_PAGE_SIZE)}
                  </span>
                  <button
                    disabled={recordsPage >= Math.ceil(filteredRecordsList.length / RECORDS_PAGE_SIZE)}
                    onClick={() => setRecordsPage(p => p + 1)}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FOOTER BLOCK */}
      <div className="flex items-center justify-between border-t border-gray-200 pt-4 mt-2">
        <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
          PADRÃO DE EXCELÊNCIA DE DEPÓSITO &amp; TRANSPORTE
        </span>
        <span className="text-[10px] text-gray-400 font-medium uppercase">
          Atualizado em tempo real • Versão 3.6.0
        </span>
      </div>

      {/* MODALS: POP AND 5S CHECKLIST */}
      <PadraoOperacionalModal
        moduleKey="quebras"
        moduleName="Gestão e Apontamento de Quebras"
        isOpen={isPopModalOpen}
        onClose={() => setIsPopModalOpen(false)}
        user={user}
      />

      <Checklist5SModal
        isOpen={is5SModalOpen}
        onClose={() => setIs5SModalOpen(false)}
        defaultSetor="Quebras / WQI"
        user={user}
      />

      <IndicatorActionModal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        indicatorTitle="Gestão de Quebras"
        indicatorSubtitle="Visualizando e gerenciando apenas os planos de ação e contramedidas 5W2H de quebras e avarias."
        indicatorBadge="QUEBRAS DPO"
        allowedProcessos={['Gestão de Quebras', 'Quebras', 'Avarias', 'Recuperação']}
        defaultProcesso="Gestão de Quebras"
        defaultIndicador="Índice de Quebras e Avarias"
        defaultMeta="≤ 0.08%"
        user={user}
      />

    </div>
  );
}

export default function QuebrasDashboard(props: QuebrasDashboardProps) {
  return (
    <CrossFilterProvider>
      <QuebrasDashboardInner {...props} />
    </CrossFilterProvider>
  );
}
