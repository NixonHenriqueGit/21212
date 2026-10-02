import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { isCustomFirebaseConnected } from '../firebase';
import { DespejoRepository } from '../db';
import { Usuario, Empresa, DespejoRow } from '../types';
import { useEmpresaData } from '../context/EmpresaDataContext';
import DespejoDashboard from './DespejoDashboard';
import { TrendingUp, CheckCircle, Clock, Award, BarChart2 } from 'lucide-react';
import { SopBannerViewer } from './SopBannerViewer';
import { filterHistoryForUser, HistoryRestrictionNotice } from '../utils/historyFilter';
import { elaborarTemposIlustrativosOperacao } from '../utils/quebrasDespejoUtils';
import { triggerAutoAcaoCorretiva } from '../utils/simulacaoAcoesUtils';
import { buildOfficialDespejoRows } from '../utils/retroactiveDespejoParser';
import { 
  DespejoTask, 
  getStoredDespejoTasks, 
  concluirDespejoTask,
  saveDespejoTask 
} from '../utils/pncManager';
import { AlertTriangle as AlertTriangleIcon, Box, ArrowDownRight, Layers, Sparkles as SparklesIcon, FileSpreadsheet } from 'lucide-react';
import { CustomDateExportModal, isDateWithinInterval } from './common/CustomDateExportModal';
import { CustomDateFilterBar } from './common/CustomDateFilterBar';

interface DespejoPanelProps {
  user: Usuario;
  empresa: Empresa | null;
  theme?: 'light' | 'dark';
  shiftStarted?: boolean;
  onRequireShiftStart?: () => void;
}

const DESPEJO_EMBALAGENS = [
  { nome: 'LATA 350ML', meta: '00:00:50' },
  { nome: 'PET 2L', meta: '00:00:50' },
  { nome: 'PET 1L', meta: '00:00:50' },
  { nome: '300 OW', meta: '00:00:50' },
  { nome: '600 OW', meta: '00:00:50' },
  { nome: 'LATA 473ML', meta: '00:00:50' },
  { nome: 'PET 200ML', meta: '00:00:50' },
  { nome: 'LATA 269ML', meta: '00:00:50' },
  { nome: 'LONG NECK', meta: '00:00:50' },
];

export default function DespejoPanel({ user, empresa, shiftStarted, onRequireShiftStart }: DespejoPanelProps) {
  const empresaId = empresa?.id || 'demo';
  const draftKey = `despejo_draft_${empresaId}_${user.nome || 'guest'}`;

  // Helper to load safe initial state
  const getDraftValue = (key: string, defaultValue: any) => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed[key] !== undefined) return parsed[key];
      }
    } catch (e) {
      console.error(e);
    }
    return defaultValue;
  };

  const [embalagem, setEmbalagem] = useState<string>(() => getDraftValue('embalagem', DESPEJO_EMBALAGENS[0].nome));
  const [quantidade, setQuantidade] = useState<number | ''>(() => getDraftValue('quantidade', ''));
  const [inicio, setInicio] = useState<string>(() => getDraftValue('inicio', ''));
  const [fim, setFim] = useState<string>(() => getDraftValue('fim', ''));
  const [tempo, setTempo] = useState('00:00:00');
  const [statusMeta, setStatusMeta] = useState('—');
  const [activeTab, setActiveTab] = useState<'form' | 'stats' | 'hist'>('form');
  const [despejoRows, setDespejoRows] = useState<DespejoRow[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [historyPage, setHistoryPage] = useState<number>(1);
  const historyPageSize = 10;
  const [draftRestored, setDraftRestored] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return !!(parsed.inicio || parsed.fim || (parsed.quantidade !== undefined && parsed.quantidade !== '') || parsed.embalagem !== DESPEJO_EMBALAGENS[0].nome);
      }
    } catch (e) {}
    return false;
  });
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  const [despejoTasks, setDespejoTasks] = useState<DespejoTask[]>(() => getStoredDespejoTasks(empresaId));
  const [activeTask, setActiveTask] = useState<DespejoTask | null>(null);

  // Sync tasks listener
  useEffect(() => {
    const loadTasks = () => setDespejoTasks(getStoredDespejoTasks(empresaId));
    loadTasks();
    window.addEventListener('despejo_tasks_updated', loadTasks);
    window.addEventListener('pnc_updated', loadTasks);
    return () => {
      window.removeEventListener('despejo_tasks_updated', loadTasks);
      window.removeEventListener('pnc_updated', loadTasks);
    };
  }, [empresaId]);

  // Sync state with local draft saving
  useEffect(() => {
    const draftData = {
      embalagem,
      quantidade,
      inicio,
      fim
    };
    localStorage.setItem(draftKey, JSON.stringify(draftData));
  }, [embalagem, quantidade, inicio, fim, draftKey]);

  // Sync with prop updates / user changing
  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setEmbalagem(parsed.embalagem || DESPEJO_EMBALAGENS[0].nome);
        setQuantidade(parsed.quantidade !== undefined ? parsed.quantidade : '');
        setInicio(parsed.inicio || '');
        setFim(parsed.fim || '');
        setDraftRestored(!!(parsed.inicio || parsed.fim || (parsed.quantidade !== undefined && parsed.quantidade !== '') || parsed.embalagem !== DESPEJO_EMBALAGENS[0].nome));
      } else {
        setEmbalagem(DESPEJO_EMBALAGENS[0].nome);
        setQuantidade('');
        setInicio('');
        setFim('');
        setDraftRestored(false);
      }
    } catch (e) {
      console.error(e);
    }
  }, [draftKey]);

  const toggleDateGroup = (dateKey: string) => {
    setExpandedDates(prev => ({ ...prev, [dateKey]: !prev[dateKey] }));
  };

  const activeMeta = DESPEJO_EMBALAGENS.find((e) => e.nome === embalagem)?.meta || '00:00:00';

  // Helper formatting operations
  const pad2 = (num: number) => String(num).padStart(2, '0');
  const toSec = (hms: string) => {
    const [h = 0, m = 0, s = 0] = String(hms).split(':').map(Number);
    return h * 3600 + m * 60 + s;
  };
  const toHMS = (sec: number) => {
    sec = Math.max(0, Math.floor(sec));
    return [Math.floor(sec / 3600), Math.floor((sec % 3600) / 60), sec % 60]
      .map(pad2)
      .join(':');
  };
  const nowHHMMSS = () => {
    const n = new Date();
    return [n.getHours(), n.getMinutes(), n.getSeconds()].map(pad2).join(':');
  };

  const empresaData = useEmpresaData(['despejo']);

  // Sync with official data and live manual entries
  const reloadDespejoData = useCallback((isImmediate = false) => {
    const companyId = empresa?.id || 'demo';

    const doLoad = () => {
      const officialRows = buildOfficialDespejoRows(companyId);

      let customManualRows: DespejoRow[] = [];
      const savedManual = localStorage.getItem(`despejo_manual_entries_${companyId}`);
      if (savedManual) {
        try {
          const parsed = JSON.parse(savedManual);
          if (Array.isArray(parsed)) {
            customManualRows = parsed;
          }
        } catch (e) {}
      } else {
        // Fallback check on despejo_rows_
        const saved = localStorage.getItem(`despejo_rows_${companyId}`);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
              customManualRows = parsed.filter(r => 
                !String(r.id || '').startsWith('retro_despejo_') && 
                !String(r.id || '').startsWith('seed-despejo-')
              );
            }
          } catch (e) {}
        }
      }

      // Combine manual and official avoiding duplicated IDs
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
      setIsDataLoading(false);
    };

    if (isImmediate) {
      doLoad();
    } else {
      setIsDataLoading(true);
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => doLoad(), { timeout: 150 });
      } else {
        setTimeout(doLoad, 16);
      }
    }
  }, [empresa?.id]);

  useEffect(() => {
    reloadDespejoData(false);

    let debounceTimer: any = null;
    const handleSync = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        reloadDespejoData(true);
      }, 150);
    };

    window.addEventListener('despejo-updated', handleSync);
    window.addEventListener('despejo-db-updated', handleSync);
    window.addEventListener('empresa-data-reload', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      window.removeEventListener('despejo-updated', handleSync);
      window.removeEventListener('despejo-db-updated', handleSync);
      window.removeEventListener('empresa-data-reload', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [reloadDespejoData]);

  useEffect(() => {
    calcDuration();
  }, [inicio, fim, embalagem, quantidade]);

  const calcDuration = () => {
    if (!inicio || !fim) {
      setTempo('00:00:00');
      setStatusMeta('—');
      return;
    }
    const tot = toSec(fim) - toSec(inicio);
    setTempo(toHMS(tot));

    const metaSec = toSec(activeMeta) * (Number(quantidade) || 0);
    if (tot <= metaSec) {
      setStatusMeta('🟢 META BATIDA');
    } else {
      setStatusMeta('🔴 ACIMA DA META');
    }
  };

  const handleRegister = async () => {
    if (shiftStarted === false) {
      alert('⚠️ Você precisa Iniciar a Jornada na Operação Ajudante antes de realizar lançamentos!');
      if (onRequireShiftStart) onRequireShiftStart();
      return;
    }

    if (!inicio || !fim) return;
    if (quantidade === '' || isNaN(Number(quantidade)) || Number(quantidade) <= 0) {
      alert('Por favor, informe uma quantidade válida de unidades despejadas.');
      return;
    }
    setRegistering(true);

    const today = new Date();
    const dataStr = today.toLocaleDateString('pt-BR');
    const dataISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const companyId = empresa?.id || 'demo';

    const newRow: Omit<DespejoRow, '_docId'> & { empresaId: string } = {
      empresaId: companyId,
      data: dataStr,
      dataISO,
      mes: today.toLocaleString('pt-BR', { month: 'long' }).toUpperCase(),
      embalagem,
      quantidade: Number(quantidade),
      inicio,
      fim,
      tempo,
      duracao: tempo,
      meta: activeMeta,
      resultado: statusMeta,
      status: statusMeta.includes('BATIDA') ? 'META BATIDA' : 'FORA DA META',
      operador: user.nome,
      _criadoEm: today.toISOString()
    };

    try {
      const added = await DespejoRepository.create(newRow, companyId);
      const generatedId = added?._docId || added?.id || `despejo_manual_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      
      const fullCreatedRow: DespejoRow = {
        ...newRow,
        _docId: generatedId,
        id: generatedId
      };

      // 1. Atualiza imediatamente o estado local da tabela
      setDespejoRows(prev => [fullCreatedRow, ...prev.filter(r => r.id !== generatedId && r._docId !== generatedId)]);

      // 2. Persiste em despejo_manual_entries_ e despejo_rows_ para descarregar no dashboard em tempo real
      try {
        const savedManual = localStorage.getItem(`despejo_manual_entries_${companyId}`);
        const manualList: DespejoRow[] = savedManual ? JSON.parse(savedManual) : [];
        const updatedManual = [fullCreatedRow, ...manualList.filter(m => (m.id || m._docId) !== generatedId)];
        localStorage.setItem(`despejo_manual_entries_${companyId}`, JSON.stringify(updatedManual));
      } catch (e) {}

      // 3. Notifica todos os módulos, abas e o DespejoDashboard em tempo real
      window.dispatchEvent(new CustomEvent('despejo-updated', { detail: { record: fullCreatedRow, companyId } }));
      window.dispatchEvent(new CustomEvent('despejo-db-updated', { detail: { record: fullCreatedRow, companyId } }));
      window.dispatchEvent(new CustomEvent('empresa-data-reload', { detail: { collection: 'despejo' } }));
      window.dispatchEvent(new CustomEvent('despejo_tasks_updated', { detail: { companyId } }));
      window.dispatchEvent(new CustomEvent('storage'));

      // Se esse registro veio de uma tarefa ativa, conclui a tarefa
      if (activeTask) {
        concluirDespejoTask(activeTask.id, user.nome, companyId);
        setActiveTask(null);
      }

      // Reset fields
      setQuantidade('');
      setInicio('');
      setFim('');
      setTempo('00:00:00');
      setStatusMeta('—');
      setActiveTab('hist');
      setDraftRestored(false);
      localStorage.removeItem(draftKey);
    } catch (e) {
      alert('Erro ao registrar despejo: ' + e);
    } finally {
      setRegistering(false);
    }
  };

  const handleDelete = async (docId?: string) => {
    if (!docId) return;
    const companyId = empresa?.id || 'demo';
    try {
      await DespejoRepository.delete(docId, companyId);
    } catch (e) {
      console.error(e);
    } finally {
      setDespejoRows(prev => prev.filter(r => r._docId !== docId && (r as any).id !== docId));
      try {
        const savedManual = localStorage.getItem(`despejo_manual_entries_${companyId}`);
        if (savedManual) {
          const manualList: DespejoRow[] = JSON.parse(savedManual);
          const updatedManual = manualList.filter(m => (m.id || m._docId) !== docId);
          localStorage.setItem(`despejo_manual_entries_${companyId}`, JSON.stringify(updatedManual));
        }
      } catch (e) {}

      window.dispatchEvent(new CustomEvent('despejo-updated', { detail: { deletedId: docId, companyId } }));
      window.dispatchEvent(new CustomEvent('despejo-db-updated', { detail: { deletedId: docId, companyId } }));
      window.dispatchEvent(new CustomEvent('empresa-data-reload', { detail: { collection: 'despejo' } }));
      window.dispatchEvent(new CustomEvent('storage'));
    }
  };

  const filteredDespejoRows = useMemo(() => {
    return filterHistoryForUser<DespejoRow>(despejoRows, user);
  }, [despejoRows, user]);

  const todayDespejoRows = useMemo(() => {
    const today = new Date().toLocaleDateString('pt-BR');
    return despejoRows.filter(r => r.data === today && r.operador === user.nome);
  }, [despejoRows, user.nome]);

  const todayDespejoStats = useMemo(() => {
    const lancamentos = todayDespejoRows.length;
    const unidades = todayDespejoRows.reduce((sum, r) => sum + (r.quantidade || 0), 0);
    const metasBatidas = todayDespejoRows.filter(r => (r.resultado || '').includes('BATIDA')).length;
    return { lancamentos, unidades, metasBatidas };
  }, [todayDespejoRows]);

  // Custom Date Range & Export Modal State
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [showExportModal, setShowExportModal] = useState<boolean>(false);

  const dateFilteredDespejoRows = useMemo(() => {
    if (!filterStartDate && !filterEndDate) return filteredDespejoRows;
    return filteredDespejoRows.filter(r => {
      const rawDate = r.dataISO || r.data;
      return isDateWithinInterval(rawDate, filterStartDate, filterEndDate);
    });
  }, [filteredDespejoRows, filterStartDate, filterEndDate]);

  const groupedDespejoEntries = useMemo(() => {
    const grouped = dateFilteredDespejoRows.reduce((acc, r) => {
      const key = r.dataISO || (r.data ? r.data.split('/').reverse().join('-') : 'sem-data');
      if (!acc[key]) acc[key] = [];
      acc[key].push(r);
      return acc;
    }, {} as Record<string, DespejoRow[]>);
    return Object.entries(grouped) as [string, DespejoRow[]][];
  }, [dateFilteredDespejoRows]);

  const formatDespejoForExcel = (rows: DespejoRow[]) => {
    return rows.map(r => ({
      'Data': r.data || (r.dataISO ? r.dataISO.split('-').reverse().join('/') : '-'),
      'Embalagem': r.embalagem || '-',
      'SKU / Produto': r.descricao || (r.codProduto ? `SKU ${r.codProduto}` : '-'),
      'Quantidade': Number(r.quantidade || 0),
      'HL Perdido': r.hlPerdido !== undefined ? Number(r.hlPerdido).toFixed(2) : (r.hectolitroPerdido !== undefined ? Number(r.hectolitroPerdido).toFixed(2) : '-'),
      'Início': r.inicio || '-',
      'Fim': r.fim || '-',
      'Duração / Tempo': r.tempo || r.duracao || '-',
      'Meta Unitária': r.meta || '-',
      'Resultado': r.resultado || '-',
      'Operador': r.operador || '-',
      'Motivo': r.motivo || '-',
      'Tratativa Gestor': r.tratativaGestor || '-'
    }));
  };

  const getDespejoExtraSummary = (rows: DespejoRow[]) => {
    const totalUnits = rows.reduce((s, r) => s + (r.quantidade || 0), 0);
    const batidas = rows.filter(r => (r.resultado || '').includes('BATIDA')).length;
    const perc = rows.length > 0 ? Math.round((batidas / rows.length) * 100) : 0;
    return [
      { label: 'Total Despejado', value: `${totalUnits} un` },
      { label: 'Aderência Meta', value: `${perc}% (${batidas}/${rows.length})` }
    ];
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Top Header bar with Metadata */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-[#11151c] border border-slate-200 dark:border-[#222d3a] rounded-xl w-full shadow-xs">
        <span className="font-sans font-black text-sm tracking-widest text-rose-600 dark:text-[#ef4444] uppercase">🗑 DESPEJO TIMER — PRODUTIVIDADE</span>
        <div className="text-xs text-slate-500 dark:text-[#6a7d92] tracking-wider font-semibold">
          META UNIT.: <strong className="text-rose-600 dark:text-[#ef4444] font-mono">{activeMeta}</strong>
        </div>
      </div>

      {/* Standard Operating Procedure (POP / SOP) Banner for Operator */}
      <SopBannerViewer operation="despejo" operationName="Despejo" />

      <div className="ptabs border-b border-[#222d3a] flex items-center justify-between gap-2 flex-wrap pb-1">
        <div className="flex gap-2 flex-wrap">
          <button 
            onClick={() => setActiveTab('form')}
            className={`ptab py-2 px-6 font-sans font-bold text-xs uppercase cursor-pointer relative ${activeTab === 'form' ? 'text-[#ef4444] border-b-2 border-b-[#ef4444]' : 'text-[#6a7d92] hover:text-[#e8eef5]'}`}
          >
            ⚙ Registrar
          </button>
          <button 
            onClick={() => setActiveTab('stats')}
            className={`ptab py-2 px-6 font-sans font-bold text-xs uppercase cursor-pointer relative ${activeTab === 'stats' ? 'text-[#ef4444] border-b-2 border-b-[#ef4444]' : 'text-[#6a7d92] hover:text-[#e8eef5]'}`}
          >
            📊 Produtividade do Dia
          </button>
          <button 
            onClick={() => setActiveTab('hist')}
            className={`ptab py-2 px-6 font-sans font-bold text-xs uppercase cursor-pointer relative ${activeTab === 'hist' ? 'text-[#ef4444] border-b-2 border-b-[#ef4444]' : 'text-[#6a7d92] hover:text-[#e8eef5]'}`}
          >
            📋 Histórico <span className="ml-1.5 px-2 py-0.5 rounded-full bg-[#151b23] border border-[#222d3a] text-[10px] text-snow">
              {isDataLoading && dateFilteredDespejoRows.length === 0 ? '...' : dateFilteredDespejoRows.length}
            </span>
          </button>
        </div>

        {/* BOTÃO EXPORTAR POR PERÍODO PERSONALIZADO */}
        <button
          type="button"
          onClick={() => setShowExportModal(true)}
          className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all cursor-pointer border border-rose-500 shrink-0 ml-auto my-1"
          title="Exportar dados de Despejo escolhendo datas personalizadas"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Exportar por Período</span>
        </button>
      </div>

      {activeTab === 'stats' && (
        <div className="g-card p-6 flex flex-col gap-6 bg-gradient-to-br from-[#11151c] to-[#151b23] border border-[#222d3a]">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="font-sans font-black text-lg text-[#ef4444] uppercase tracking-wide flex items-center gap-2">
                <BarChart2 className="w-5 h-5" /> Minha Produtividade de Hoje (Despejo)
              </h3>
              <p className="text-xs text-[#6a7d92] mt-1">
                Visão em tempo real das suas atividades registradas no turno de {new Date().toLocaleDateString('pt-BR')}.
              </p>
            </div>
            <div className="text-[10px] text-[#6a7d92] font-mono font-bold bg-[#151b23] border border-[#222d3a] px-3 py-1.5 rounded-lg">
              OPERADOR: {user.nome}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#151b23] border border-[#222d3a] rounded-xl p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-[#ef4444]/10 text-[#ef4444]">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#6a7d92] block tracking-wider">Lançamentos</span>
                <span className="text-xl font-bold text-snow font-mono">
                  {todayDespejoStats.lancamentos}
                </span>
              </div>
            </div>

            <div className="bg-[#151b23] border border-[#222d3a] rounded-xl p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#6a7d92] block tracking-wider">Líquido Despejado</span>
                <span className="text-xl font-bold text-snow font-mono">
                  {todayDespejoStats.unidades} un
                </span>
              </div>
            </div>

            <div className="bg-[#151b23] border border-[#222d3a] rounded-xl p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#6a7d92] block tracking-wider">Metas Batidas</span>
                <span className="text-xl font-bold text-snow font-mono">
                  {todayDespejoStats.metasBatidas}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold text-[#6a7d92] uppercase tracking-wider">Histórico Detalhado de Hoje</h4>
            {todayDespejoRows.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-[#222d3a] rounded-xl text-xs text-[#6a7d92]">
                Nenhuma atividade registrada por você hoje ainda. Use a aba "Registrar" para começar!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#a0aec0]">
                  <thead>
                    <tr className="border-b border-[#222d3a] text-[#6a7d92] uppercase text-[10px] font-bold tracking-wider">
                      <th className="py-2.5 px-3">Embalagem</th>
                      <th className="py-2.5 px-3">Quantidade</th>
                      <th className="py-2.5 px-3">Início / Fim</th>
                      <th className="py-2.5 px-3">Duração</th>
                      <th className="py-2.5 px-3">Resultado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#222d3a]">
                    {todayDespejoRows.map((r, idx) => (
                      <tr key={r._docId || idx} className="hover:bg-[#151b23]/30 transition-colors">
                        <td className="py-3 px-3 font-bold text-snow">{r.embalagem}</td>
                        <td className="py-3 px-3 font-mono">{r.quantidade} un</td>
                        <td className="py-3 px-3 font-mono text-[#6a7d92]">{r.inicio} - {r.fim}</td>
                        <td className="py-3 px-3 font-mono">{r.tempo || r.duracao || '—'}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            (r.resultado || '').includes('BATIDA') 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {r.resultado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'form' && (
        <div className="g-card p-6 flex flex-col gap-5">
          {/* QUEUE OF PENDING DESPEJO TASKS */}
          {despejoTasks.filter(t => t.status === 'Pendente').length > 0 && (
            <div className="bg-rose-950/30 border-2 border-rose-500/60 rounded-2xl p-4 sm:p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-rose-600 text-white animate-pulse">
                    <AlertTriangleIcon className="w-4 h-4" />
                  </span>
                  <h4 className="text-sm font-black text-rose-400 uppercase tracking-wider">
                    🚨 Tarefas de Despejo Recebidas ({despejoTasks.filter(t => t.status === 'Pendente').length} Pendentes)
                  </h4>
                </div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">
                  Demandas CCO / PNC / FEFO
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                {despejoTasks.filter(t => t.status === 'Pendente').map(task => {
                  const isSelected = activeTask?.id === task.id;
                  return (
                    <div
                      key={task.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isSelected 
                          ? 'bg-rose-900/50 border-rose-400 shadow-md ring-2 ring-rose-400' 
                          : 'bg-[#151b23] border-[#222d3a] hover:border-rose-500/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-rose-600 text-white">
                          {task.prioridade} • {task.origem}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {task.dataSolicitacao}
                        </span>
                      </div>

                      <div className="font-black text-snow text-xs">
                        {task.codigo} - {task.descricao}
                      </div>

                      <div className="text-[11px] text-slate-300 mt-1 flex flex-wrap justify-between gap-x-2">
                        <span>Lote: <strong className="font-mono text-white">{task.lote}</strong></span>
                        <span>Validade: <strong className="font-mono text-white">{task.validade}</strong></span>
                        <span>Qtd: <strong className="text-rose-400 font-mono font-bold text-sm">{task.quantidade} cx</strong></span>
                      </div>

                      <p className="text-[10px] text-slate-400 mt-1.5 truncate" title={task.motivo}>
                        <strong>Motivo:</strong> {task.motivo} (Por: {task.solicitadoPor})
                      </p>

                      <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTask(task);
                            setQuantidade(task.quantidade);
                            // Set estimated packaging if matched
                            const foundEmb = DESPEJO_EMBALAGENS.find(e => task.descricao.toUpperCase().includes(e.nome.toUpperCase().split(' ')[0]));
                            if (foundEmb) setEmbalagem(foundEmb.nome);
                            setDraftRestored(false);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-emerald-500 text-slate-950 shadow-sm'
                              : 'bg-rose-600 hover:bg-rose-500 text-white shadow-xs'
                          }`}
                        >
                          {isSelected ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Selecionada p/ Despejo</span>
                            </>
                          ) : (
                            <>
                              <ArrowDownRight className="w-3.5 h-3.5" />
                              <span>Executar Esta Tarefa</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTask && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>
                  Executando tarefa: <strong>{activeTask.codigo} - {activeTask.descricao}</strong> ({activeTask.quantidade} cx). O lançamento dará baixa automática!
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTask(null)}
                className="text-[10px] font-bold text-slate-400 hover:text-white uppercase cursor-pointer"
              >
                Desvincular
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222d3a] pb-3">
            <h3 className="font-sans font-bold text-sm tracking-wider uppercase text-[#ef4444]">Configurar Lançamento</h3>
            <div className="flex items-center gap-1.5 text-[9px] text-[#22c55e] font-black uppercase tracking-wider bg-[#22c55e]/5 px-2.5 py-1 rounded-lg border border-[#22c55e]/15">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              Salvo automaticamente
            </div>
          </div>

          {draftRestored && (
            <div className="flex items-center justify-between gap-3 bg-amber-500/10 border border-amber-500/25 px-4 py-3 rounded-xl text-xs text-amber-300">
              <div className="flex items-center gap-2 font-medium">
                <span>⚡ Dados anteriores restaurados do rascunho salvo!</span>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setInicio('');
                  setFim('');
                  setQuantidade('');
                  setEmbalagem(DESPEJO_EMBALAGENS[0].nome);
                  setDraftRestored(false);
                  localStorage.removeItem(draftKey);
                }}
                className="text-[9px] uppercase font-black tracking-wider text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
              >
                Limpar formulário
              </button>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold tracking-widest text-[#6a7d92] uppercase">Embalagem</label>
              <select 
                value={embalagem}
                onChange={e => setEmbalagem(e.target.value)}
                className="g-input bg-[#151b23] border-[#1c2530]"
              >
                {DESPEJO_EMBALAGENS.map((e) => (
                  <option key={e.nome} value={e.nome}>{e.nome} (meta: {e.meta})</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold tracking-widest text-[#6a7d92] uppercase">Quantidade Despejada (Unidades) *</label>
              <input 
                type="number"
                value={quantidade}
                onChange={e => {
                  const val = e.target.value;
                  setQuantidade(val === '' ? '' : parseInt(val) || '');
                }}
                className="g-input"
                placeholder="Digite a quantidade..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold tracking-widest text-[#6a7d92] uppercase">Hora Inicial</label>
              <div className="flex gap-2">
                <input 
                  type="time"
                  step={1}
                  value={inicio}
                  onChange={e => setInicio(e.target.value)}
                  className="g-input flex-1 font-mono"
                />
                <button 
                  type="button" 
                  onClick={() => setInicio(nowHHMMSS())}
                  className="px-3 border border-[#222d3a] hover:border-[#6a7d92] bg-[#151b23] rounded-lg text-xs font-bold text-[#f5a623] cursor-pointer"
                >
                  ⏱ Agora
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold tracking-widest text-[#6a7d92] uppercase">Hora Final</label>
              <div className="flex gap-2">
                <input 
                  type="time"
                  step={1}
                  value={fim}
                  onChange={e => setFim(e.target.value)}
                  className="g-input flex-1 font-mono"
                />
                <button 
                  type="button" 
                  onClick={() => setFim(nowHHMMSS())}
                  className="px-3 border border-[#222d3a] hover:border-[#6a7d92] bg-[#151b23] rounded-lg text-xs font-bold text-[#f5a623] cursor-pointer"
                >
                  ⏱ Agora
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 p-4 bg-[#151b23]/50 border border-[#222d3a] rounded-xl">
            <div className="flex flex-col justify-center">
              <span className="text-[9px] uppercase font-bold text-[#6a7d92] tracking-wider">Tempo Total Gasto</span>
              <span className="font-mono text-3xl font-black text-snow mt-1">{tempo}</span>
            </div>
            <div className="flex flex-col justify-center text-right">
              <span className="text-[9px] uppercase font-bold text-[#6a7d92] tracking-wider block text-right">Status de Produtividade</span>
              <span className={`font-sans font-black text-lg tracking-wider mt-1 block ${statusMeta.includes('BATIDA') ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                {statusMeta}
              </span>
            </div>
          </div>

          <button 
            type="button"
            disabled={registering || !inicio || !fim}
            onClick={handleRegister}
            className="w-full py-4 text-sm font-sans font-bold uppercase tracking-widest text-white bg-gradient-to-br from-[#ef4444] to-[#c22d2d] hover:shadow-[0_4px_16px_rgba(239,68,68,0.25)] rounded-xl disabled:opacity-50 cursor-pointer"
          >
            {registering ? 'Registrando dados...' : '✅ REGISTRAR PRODUTIVIDADE'}
          </button>
        </div>
      )}

      {activeTab === 'hist' && (
        <div className="flex flex-col gap-4">
          <HistoryRestrictionNotice user={user} />

          {/* BARRA DE FILTRO DE DATA E EXPORTAÇÃO */}
          <CustomDateFilterBar
            startDate={filterStartDate}
            endDate={filterEndDate}
            onStartDateChange={setFilterStartDate}
            onEndDateChange={setFilterEndDate}
            onReset={() => { setFilterStartDate(''); setFilterEndDate(''); }}
            onOpenExportModal={() => setShowExportModal(true)}
            totalFiltered={dateFilteredDespejoRows.length}
            totalAll={filteredDespejoRows.length}
            accentColor="red"
            label="Filtrar Despejo por Período:"
            unitLabel="operações"
            extraStats={`Total: ${dateFilteredDespejoRows.reduce((s, r) => s + (r.quantidade || 0), 0)} un`}
          />

          {/* Banner de Tempos Ilustrativos de Referência da Operação Despejo */}
          <div className="bg-gradient-to-r from-[#11151c] via-[#151b23] to-[#1a222d] border border-[#ef4444]/30 rounded-xl p-4 text-snow flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#ef4444]/15 border border-[#ef4444]/30 rounded-xl text-[#ef4444]">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/20 px-2 py-0.5 rounded">
                    TEMPOS ILUSTRATIVOS DE OPERAÇÃO
                  </span>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    SOP Despejo DPO
                  </span>
                </div>
                <h4 className="font-sans font-black text-sm uppercase text-snow tracking-wide mt-1">
                  Cronograma &amp; Ritmo por Fases da Operação Despejo
                </h4>
                <p className="text-[11px] text-[#6a7d92]">
                  Exibindo o desdobramento ilustrativo dos tempos por etapa (Triagem &bull; Drenagem &bull; Segregação) para cada lote do histórico.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="bg-[#0b0e14] border border-[#222d3a] px-3 py-2 rounded-lg text-center">
                <span className="text-[9px] uppercase font-bold text-[#6a7d92] block">🔍 Fase 1: Triagem</span>
                <span className="text-xs font-mono font-bold text-amber-400">15% do Tempo</span>
              </div>
              <div className="bg-[#0b0e14] border border-[#222d3a] px-3 py-2 rounded-lg text-center">
                <span className="text-[9px] uppercase font-bold text-[#6a7d92] block">💧 Fase 2: Drenagem</span>
                <span className="text-xs font-mono font-bold text-sky-400">65% do Tempo</span>
              </div>
              <div className="bg-[#0b0e14] border border-[#222d3a] px-3 py-2 rounded-lg text-center">
                <span className="text-[9px] uppercase font-bold text-[#6a7d92] block">♻️ Fase 3: Segregação</span>
                <span className="text-xs font-mono font-bold text-emerald-400">20% do Tempo</span>
              </div>
            </div>
          </div>

          {(() => {
            if (isDataLoading && groupedDespejoEntries.length === 0) {
              return (
                <div className="g-card p-12 text-center text-[#6a7d92] flex flex-col items-center justify-center gap-2">
                  <div className="w-6 h-6 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
                  <span className="text-xs font-semibold">Carregando histórico do despejo...</span>
                </div>
              );
            }

            if (groupedDespejoEntries.length === 0) {
              return <div className="g-card p-12 text-center text-[#6a7d92]">Nenhum despejo computado ainda.</div>;
            }

            const totalPages = Math.ceil(groupedDespejoEntries.length / historyPageSize) || 1;
            const currentPage = Math.min(Math.max(1, historyPage), totalPages);
            const paginatedEntries = groupedDespejoEntries.slice((currentPage - 1) * historyPageSize, currentPage * historyPageSize);

            return (
              <>
                {paginatedEntries.map(([dateKey, rows]) => {
                  const isOpen = !!expandedDates[dateKey];
                  const batidaCount = rows.filter(r => r.resultado.includes('BATIDA')).length;
                  const totalBoxes = rows.reduce((s, r) => s + (r.quantidade || 0), 0);

                  let formattedDate = dateKey;
                  try {
                    const [y, m, d] = dateKey.split('-');
                    const dt = new Date(Number(y), Number(m) - 1, Number(d));
                    const daysOfWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
                    formattedDate = `${d}/${m}/${y} — ${daysOfWeek[dt.getDay()]}`;
                  } catch (e) {}

                  return (
                    <div key={dateKey} className="g-card overflow-hidden">
                      <div 
                        onClick={() => toggleDateGroup(dateKey)}
                        className="p-4 bg-[#151b23] flex items-center justify-between cursor-pointer select-none gap-4 flex-wrap"
                      >
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="font-sans font-black text-sm text-[#ef4444] tracking-wide">📅 {formattedDate}</span>
                          <span className="text-[10px] bg-[#11151c] border border-[#222d3a] px-2 py-0.5 rounded-full font-bold text-snow">
                            {rows.length} operações
                          </span>
                          {batidaCount === rows.length ? (
                            <span className="text-[9px] bg-[#22c55e]/15 border border-[#22c55e]/25 text-[#22c55e] px-2 py-0.5 rounded-full font-bold">
                              ✓ Tudo Ok ({batidaCount}/{rows.length})
                            </span>
                          ) : (
                            <span className="text-[9px] bg-[#ef4444]/15 border border-[#ef4444]/25 text-[#fca5a5] px-2 py-0.5 rounded-full font-bold">
                              ⚠ {rows.length - batidaCount} acima da meta
                            </span>
                          )}
                          <span className="text-[10px] text-[#6a7d92] font-semibold">
                            📦 {totalBoxes} unidades despejadas
                          </span>
                        </div>
                        <span className="text-[#6a7d92] text-xs transition-transform" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}>▼</span>
                      </div>

                      {isOpen && (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs min-w-[780px]">
                            <thead>
                              <tr className="bg-[#07090d] border-b border-[#222d3a]">
                                <th className="p-3 text-[#6a7d92] uppercase font-bold tracking-wider">Embalagem</th>
                                <th className="p-3 text-[#6a7d92] uppercase font-bold tracking-wider text-center">Unidades</th>
                                <th className="p-3 text-[#6a7d92] uppercase font-bold tracking-wider">Início / Fim</th>
                                <th className="p-3 text-[#6a7d92] uppercase font-bold tracking-wider">Duração Total</th>
                                <th className="p-3 text-[#6a7d92] uppercase font-bold tracking-wider">
                                  <span className="text-amber-400">⏱️ Tempos Ilustrativos por Fase</span>
                                </th>
                                <th className="p-3 text-[#6a7d92] uppercase font-bold tracking-wider">Resultado</th>
                                <th className="p-3 text-[#6a7d92] uppercase font-bold tracking-wider text-right">Ação</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#222d3a]">
                              {rows.map((r, i) => {
                                const tempos = elaborarTemposIlustrativosOperacao(r.quantidade, r.embalagem, r.tempo);
                                return (
                                  <React.Fragment key={r._docId || i}>
                                    <tr className="hover:bg-[#151b23]/30 transition-colors">
                                      <td className="p-3 font-semibold text-[#ef4444]">
                                        {r.embalagem}
                                        {r.operador && <span className="block text-[10px] text-[#6a7d92] font-mono">Op: {r.operador}</span>}
                                      </td>
                                      <td className="p-3 text-center font-bold font-mono">{r.quantidade} un</td>
                                      <td className="p-3 font-mono text-[#6a7d92]">{r.inicio} - {r.fim}</td>
                                      <td className="p-3 font-mono text-snow font-bold">{r.tempo}</td>
                                      <td className="p-3 font-mono">
                                        <div className="flex flex-col gap-1">
                                          <div className="flex items-center gap-1.5 text-[10px]">
                                            <span className="text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded font-bold" title="Fase 1: Triagem & Checagem">
                                              🔍 {tempos.tempoTriagemStr}
                                            </span>
                                            <span className="text-sky-400 bg-sky-400/10 px-1.5 py-0.5 rounded font-bold" title="Fase 2: Drenagem & Esvaziamento">
                                              💧 {tempos.tempoDrenagemStr}
                                            </span>
                                            <span className="text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded font-bold" title="Fase 3: Segregação & Compactação">
                                              ♻️ {tempos.tempoSegregacaoStr}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-2 text-[9px] text-[#6a7d92]">
                                            <span>⚡ {tempos.ritmoUnidadesPorHora ?? tempos.ritmoSkusPorHora} un/h</span>
                                            <span>•</span>
                                            <span>💧 {tempos.vazaoHlPorMinuto} HL/min</span>
                                            <span>•</span>
                                            <span className={tempos.desvioPositivo ? 'text-emerald-400' : 'text-rose-400'}>
                                              {tempos.desvioPadraoStr} vs meta
                                            </span>
                                          </div>
                                        </div>
                                      </td>
                                      <td className={`p-3 font-sans font-black ${r.resultado.includes('BATIDA') ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                                        {r.resultado}
                                      </td>
                                      <td className="p-3 text-right">
                                        <button 
                                          onClick={() => handleDelete(r._docId)}
                                          className="py-1 px-2.5 bg-[#ef4444]/10 border border-[#ef4444]/20 hover:bg-[#ef4444] text-[#fca5a5] hover:text-white rounded-md text-[10px] font-bold cursor-pointer"
                                        >
                                          ✕
                                        </button>
                                      </td>
                                    </tr>
                                  </React.Fragment>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}

                {groupedDespejoEntries.length > historyPageSize && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-[#11151c] border border-[#222d3a] rounded-xl text-xs">
                    <span className="text-[#6a7d92] font-medium">
                      Mostrando dias {((currentPage - 1) * historyPageSize) + 1} a {Math.min(currentPage * historyPageSize, groupedDespejoEntries.length)} de {groupedDespejoEntries.length} dias
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={currentPage <= 1}
                        onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                        className="px-3 py-1.5 rounded-lg border border-[#222d3a] bg-[#151b23] text-snow font-bold hover:bg-[#1c2530] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-all"
                      >
                        ← Anterior
                      </button>
                      <div className="flex items-center gap-1 px-2">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setHistoryPage(p)}
                            className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              currentPage === p
                                ? 'bg-[#ef4444] text-white shadow-xs'
                                : 'text-[#6a7d92] hover:bg-[#1c2530]'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        disabled={currentPage >= totalPages}
                        onClick={() => setHistoryPage(p => Math.min(totalPages, p + 1))}
                        className="px-3 py-1.5 rounded-lg border border-[#222d3a] bg-[#151b23] text-snow font-bold hover:bg-[#1c2530] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-all"
                      >
                        Próximo →
                      </button>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}
      {/* MODAL DE EXPORTAÇÃO PERSONALIZADA POR PERÍODO */}
      <CustomDateExportModal<DespejoRow>
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Exportar Produtividade Despejo"
        subtitle="Escolha o intervalo de datas para exportar os registros de Despejo em Excel ou CSV."
        records={filteredDespejoRows}
        dateExtractor={r => r.dataISO || r.data}
        formatDataForExcel={formatDespejoForExcel}
        defaultFileName="Produtividade_Despejo_Ajudante"
        sheetName="Despejo"
        accentColor="red"
        extraSummary={getDespejoExtraSummary}
        onApplyScreenFilter={(start, end) => {
          setFilterStartDate(start);
          setFilterEndDate(end);
        }}
        onClearScreenFilter={() => {
          setFilterStartDate('');
          setFilterEndDate('');
        }}
        currentScreenFilter={{ startISO: filterStartDate, endISO: filterEndDate }}
      />
    </div>
  );
}
export {};
