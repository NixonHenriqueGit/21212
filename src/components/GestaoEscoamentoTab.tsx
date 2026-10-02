import React, { useState, useEffect, useMemo } from 'react';
import { ValidadeRow, Usuario, Empresa } from '../types';
import { isCustomFirebaseConnected } from '../firebase';
import { ValidadesRepository, DespejoRepository, getRepository } from '../db';

const escoamentoLogsRepo = getRepository<any>('escoamento_logs');
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { useEmpresaData } from '../context/EmpresaDataContext';
import { PRODUCT_MASTER_DATA } from '../data/productMasterData';
import { calculateStockAgeIndex } from '../utils/calculateStockAgeIndex';
import { getInitialDefaultValidades, removeLegacySeedValidades } from '../utils/fefoDefaultData';
import { calcularTotalCaixas } from '../data/coletaPackagingData';
import { savePncItem, saveDespejoTask } from '../utils/pncManager';
import { encaminharItemParaPnc } from '../utils/gestaoPncManager';
import { 
  getEscoamentoVendidosMap, 
  marcarItemComoVendido, 
  reverterItemParaPendente, 
  exportarHistoricoEscoamentoParaExcel, 
  EscoamentoVendidoItem 
} from '../utils/escoamentoVendaManager';
import { ValidadesRecolhidasModal, getValidadeUniqueId, getValidadeDateInfo } from './ValidadesRecolhidasModal';
import { 
  getSelectedValidadesKeys, 
  saveSelectedValidadesKeys, 
  hasSelectionInitialized, 
  filterValidadesByActiveSelection 
} from '../utils/fefoSelectionManager';
import { applyDashboardAdjustments } from '../utils/fefoDashboardAdjustments';
import { 
  TrendingDown, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  Plus, 
  History, 
  Search, 
  Filter, 
  FileSpreadsheet, 
  FileText, 
  ShieldAlert, 
  PackageCheck,
  PackageX,
  ArrowRight
} from 'lucide-react';

interface GestaoEscoamentoTabProps {
  validadesList: ValidadeRow[];
  user: Usuario;
  empresa: Empresa | null;
  onRefresh?: () => void;
}

export interface EscoamentoDailyLog {
  id: string;
  loteKey: string;
  dataCount: string; // YYYY-MM-DD
  qtdAnterior: number;
  qtdAtual: number;
  qtdEscoada: number;
  responsavel: string;
  observacao?: string;
  timestamp: string;
}

export interface EscoamentoItem {
  _docId?: string;
  loteKey: string;
  id: number;
  codigo: string;
  descricao: string;
  lote: string;
  qtdInicial: number;
  qtdAtual: number;
  dataVencimento: string;
  stockAgeIndex: number;
  statusStockAge: 'Crítico' | 'Atenção';
  localizacao: string;
  bloco?: string;
  logs: EscoamentoDailyLog[];
  isTotalmenteEscoado: boolean;
  isVendido?: boolean;
  vendidoInfo?: EscoamentoVendidoItem;
  dataTransferenciaPnc?: string;
  diasEmPnc?: number;
}

export default function GestaoEscoamentoTab({ validadesList, user, empresa, onRefresh }: GestaoEscoamentoTabProps) {
  const companyId = empresa?.id || 'demo';
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'Crítico' | 'Atenção'>('todos');
  const [viewMode, setViewMode] = useState<'ativos' | 'concluidos' | 'todos'>('ativos');

  // Mapa de itens marcados como Vendidos (Persistente e Reativo)
  const [vendidosMap, setVendidosMap] = useState<Record<string, EscoamentoVendidoItem>>(() => getEscoamentoVendidosMap(companyId));

  // Estado de seleção das validades recolhidas (bidirecional e sincronizado com a aba Validades)
  const [selectedValidadesKeys, setSelectedValidadesKeys] = useState<Set<string>>(() => 
    getSelectedValidadesKeys(companyId)
  );
  const [showSelectValidadesModal, setShowSelectValidadesModal] = useState(false);

  useEffect(() => {
    const handleSyncSelection = () => {
      setSelectedValidadesKeys(getSelectedValidadesKeys(companyId));
    };
    window.addEventListener('fefo_selection_updated', handleSyncSelection);
    window.addEventListener('storage', handleSyncSelection);
    return () => {
      window.removeEventListener('fefo_selection_updated', handleSyncSelection);
      window.removeEventListener('storage', handleSyncSelection);
    };
  }, [companyId]);

  useEffect(() => {
    const handleVendaUpdated = () => {
      setVendidosMap(getEscoamentoVendidosMap(companyId));
    };
    window.addEventListener('escoamento_venda_updated', handleVendaUpdated);
    window.addEventListener('storage', handleVendaUpdated);
    return () => {
      window.removeEventListener('escoamento_venda_updated', handleVendaUpdated);
      window.removeEventListener('storage', handleVendaUpdated);
    };
  }, [companyId]);
  
  // Storage for daily logs
  const storageKey = `armazem_escoamento_logs_${companyId}`;
  const [dailyLogs, setDailyLogs] = useState<EscoamentoDailyLog[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modal for registering daily count
  const [selectedItem, setSelectedItem] = useState<EscoamentoItem | null>(null);
  const [inputQtd, setInputQtd] = useState<number>(0);
  const [inputObs, setInputObs] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // Today ISO
  const todayISO = new Date().toISOString().substring(0, 10);

  // Persist daily logs
  const saveDailyLogs = (logs: EscoamentoDailyLog[]) => {
    setDailyLogs(logs);
    try {
      localStorage.setItem(storageKey, JSON.stringify(logs));
    } catch (err) {
      console.error('Erro ao salvar logs no localStorage:', err);
    }
  };

  const loadDailyLogs = () => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setDailyLogs(JSON.parse(saved));
      }
    } catch (err) {
      console.error('Erro ao carregar logs:', err);
    }
  };

  const empresaData = useEmpresaData();

  const [syncAdjustmentsTrigger, setSyncAdjustmentsTrigger] = useState(0);

  // Listen to background updates (e.g. Despejo sent, PNC updated, Validades updated, Ajustes)
  useEffect(() => {
    const handleReload = () => {
      loadDailyLogs();
      setSyncAdjustmentsTrigger(prev => prev + 1);
    };
    window.addEventListener('despejo_tasks_updated', handleReload);
    window.addEventListener('pnc_updated', handleReload);
    window.addEventListener('validades_updated', handleReload);
    window.addEventListener('local_data_changed', handleReload);
    window.addEventListener('fefo_adjustments_updated', handleReload);
    window.addEventListener('fefo_definitive_updated', handleReload);
    window.addEventListener('fefo_validades_restored', handleReload);
    window.addEventListener('app_data_updated', handleReload);
    return () => {
      window.removeEventListener('despejo_tasks_updated', handleReload);
      window.removeEventListener('pnc_updated', handleReload);
      window.removeEventListener('validades_updated', handleReload);
      window.removeEventListener('local_data_changed', handleReload);
      window.removeEventListener('fefo_adjustments_updated', handleReload);
      window.removeEventListener('fefo_definitive_updated', handleReload);
      window.removeEventListener('fefo_validades_restored', handleReload);
      window.removeEventListener('app_data_updated', handleReload);
    };
  }, []);

  // Build product lookup map by SKU code
  const produtosMap = useMemo(() => {
    const map = new Map<string, number>();
    if (empresaData?.produtos) {
      empresaData.produtos.forEach(p => {
        if (p.codigo) map.set(String(p.codigo).trim(), Number(p.idade) || 180);
      });
    }
    PRODUCT_MASTER_DATA.forEach(p => {
      const cStr = String(p.cod).trim();
      if (!map.has(cStr)) map.set(cStr, (p as any).idade || 180);
    });
    return map;
  }, [empresaData?.produtos]);

  // Lista de validades base despoluída e ajustada com os valores definitivos do Dashboard
  const sourceAllValidades = useMemo(() => {
    const raw = removeLegacySeedValidades(validadesList && validadesList.length > 0 ? validadesList : []);
    return applyDashboardAdjustments(raw, companyId);
  }, [validadesList, companyId, syncAdjustmentsTrigger]);

  // Lista de validades filtradas pela seleção ativa (persistida e sincronizada)
  const activeValidades = useMemo(() => {
    return filterValidadesByActiveSelection(sourceAllValidades, companyId, selectedValidadesKeys);
  }, [sourceAllValidades, companyId, selectedValidadesKeys]);

  const handleToggleValidadeKey = (key: string) => {
    setSelectedValidadesKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      saveSelectedValidadesKeys(next, companyId);
      return next;
    });
  };

  const handleSelectAllValidades = () => {
    const allKeys = new Set<string>();
    sourceAllValidades.forEach((item, idx) => {
      allKeys.add(getValidadeUniqueId(item, idx));
    });
    setSelectedValidadesKeys(allKeys);
    saveSelectedValidadesKeys(allKeys, companyId);
  };

  const handleDeselectAllValidades = () => {
    const empty = new Set<string>();
    setSelectedValidadesKeys(empty);
    saveSelectedValidadesKeys(empty, companyId);
  };

  const handleSelectDateValidades = (dateKey: string, select: boolean) => {
    setSelectedValidadesKeys(prev => {
      const next = new Set(prev);
      sourceAllValidades.forEach((item, idx) => {
        const { isoDate } = getValidadeDateInfo(item);
        if (isoDate === dateKey) {
          const k = getValidadeUniqueId(item, idx);
          if (select) next.add(k);
          else next.delete(k);
        }
      });
      saveSelectedValidadesKeys(next, companyId);
      return next;
    });
  };

  const handleSelectMultipleDates = (dateKeys: string[], select: boolean) => {
    const datesSet = new Set(dateKeys);
    setSelectedValidadesKeys(prev => {
      const next = new Set(prev);
      sourceAllValidades.forEach((item, idx) => {
        const { isoDate } = getValidadeDateInfo(item);
        if (datesSet.has(isoDate)) {
          const k = getValidadeUniqueId(item, idx);
          if (select) next.add(k);
          else next.delete(k);
        }
      });
      saveSelectedValidadesKeys(next, companyId);
      return next;
    });
  };

  const handleSelectLatestValidadesOnly = () => {
    const dateKeys = sourceAllValidades.map(item => getValidadeDateInfo(item).isoDate);
    dateKeys.sort((a, b) => b.localeCompare(a));
    const latestDate = dateKeys[0];

    const next = new Set<string>();
    if (latestDate) {
      sourceAllValidades.forEach((item, idx) => {
        const { isoDate } = getValidadeDateInfo(item);
        if (isoDate === latestDate) {
          next.add(getValidadeUniqueId(item, idx));
        }
      });
    }
    setSelectedValidadesKeys(next);
    saveSelectedValidadesKeys(next, companyId);
  };

  const handleSelectOnlyThisDate = (dateKey: string) => {
    const next = new Set<string>();
    sourceAllValidades.forEach((item, idx) => {
      const { isoDate } = getValidadeDateInfo(item);
      if (isoDate === dateKey) {
        next.add(getValidadeUniqueId(item, idx));
      }
    });
    setSelectedValidadesKeys(next);
    saveSelectedValidadesKeys(next, companyId);
  };

  const handleSelectOnlyThisKey = (key: string) => {
    const next = new Set<string>([key]);
    setSelectedValidadesKeys(next);
    saveSelectedValidadesKeys(next, companyId);
  };

  // 1. Process items from validadesList to extract ONLY Crítico and Atenção items
  // UNIFIED LOGIC: Group items by same code (SKU) and validadeStr to avoid duplicate alerts
  const escoamentoItems = useMemo(() => {
    const todayObj = new Date();
    todayObj.setHours(0, 0, 0, 0);

    const sourceList = activeValidades;

    // Set of despejados to exclude from Escoamento active tracking
    const despejadosKey = `armazem_escoamento_despejados_${empresa?.id || 'demo'}`;
    let despejadosSet = new Set<string>();
    try {
      const saved = localStorage.getItem(despejadosKey);
      if (saved) {
        const list = JSON.parse(saved);
        despejadosSet = new Set(Array.isArray(list) ? list : []);
      }
    } catch (e) {}

    const map = new Map<string, EscoamentoItem>();

    sourceList.forEach((item, idx) => {
      const codigo = String(item.codigo || '0000').trim();
      const descricao = String(item.descricao || 'Produto sem descrição').trim();
      const validadeStr = item.validade || todayISO;
      const p = Number(item.palhete) || 0;
      const l = Number(item.lastro) || 0;
      const c = Number(item.caixa) || 0;
      const q = Number((item as any).quantidade) || 0;
      const qtdInicial = q > 0 ? q : (p > 0 || l > 0 || c > 0) ? calcularTotalCaixas(codigo, p, l, c) : (c > 0 ? c : 1);
      
      // Unified key: same codigo and validadeStr
      const key = `${codigo}_${validadeStr}`;

      // Exclude items that are already in despejo
      if (item.localizacao === 'despejo' || despejadosSet.has(key) || despejadosSet.has(codigo)) {
        return;
      }

      // Calculate Stock Age Index using official calculateStockAgeIndex
      const calcResult = calculateStockAgeIndex({
        codigo,
        descricao,
        validade: validadeStr
      }, empresaData?.produtos);

      const diasRestantes = calcResult.diasRestantes;
      const stockAgeIndex = calcResult.stockAgeIndex;

      // RULE: Strictly ONLY items with 45 days or less remaining (diasRestantes <= 45)
      if (diasRestantes > 45) return;

      // Classify as Crítico (<=30 days) or Atenção (31 to 45 days)
      let statusStockAge: 'Crítico' | 'Atenção' = 'Atenção';
      if (diasRestantes <= 30 || calcResult.status === 'Crítico' || calcResult.idadeMissing) {
        statusStockAge = 'Crítico';
      } else {
        statusStockAge = 'Atenção';
      }

      if (map.has(key)) {
        const existing = map.get(key)!;
        existing.qtdInicial += qtdInicial;
        existing.lote = '-'; // Name lote removed for unified same code and validade items
      } else {
        const loteKey = key;
        const itemLogs = dailyLogs.filter(l => l.loteKey === loteKey).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        const pncKey = `armazem_pnc_dates_${empresa?.id || 'demo'}`;
        let pncDatesMap: Record<string, string> = {};
        try {
          pncDatesMap = JSON.parse(localStorage.getItem(pncKey) || '{}');
        } catch (e) {}

        const dataPncStr = (item as any).dataTransferenciaPnc || pncDatesMap[loteKey] || (item.localizacao === 'pnc' ? validadeStr : undefined);

        map.set(key, {
          _docId: item._docId,
          loteKey,
          id: Number(item.id) || (idx + 1),
          codigo,
          descricao,
          lote: '-', // Unified item
          qtdInicial,
          qtdAtual: qtdInicial,
          dataVencimento: validadeStr,
          stockAgeIndex,
          statusStockAge,
          localizacao: item.localizacao || 'central',
          bloco: item.bloco,
          logs: itemLogs,
          isTotalmenteEscoado: false,
          dataTransferenciaPnc: dataPncStr
        });
      }
    });

    const nowMs = new Date().getTime();

    const result: EscoamentoItem[] = Array.from(map.values()).map(item => {
      const latestLog = item.logs[0];
      const rawQtdAtual = latestLog ? latestLog.qtdAtual : item.qtdInicial;
      const vendidoInfo = vendidosMap[item.loteKey];
      const isVendido = !!vendidoInfo;
      const qtdAtual = isVendido ? 0 : rawQtdAtual;
      let diasEmPnc: number | undefined = undefined;

      if (item.localizacao === 'pnc' || item.dataTransferenciaPnc) {
        if (item.dataTransferenciaPnc) {
          const tMs = new Date(item.dataTransferenciaPnc).getTime();
          diasEmPnc = Math.max(0, Math.floor((nowMs - tMs) / (1000 * 60 * 60 * 24)));
        } else {
          diasEmPnc = 0;
        }
      }

      return {
        ...item,
        qtdAtual,
        isTotalmenteEscoado: isVendido || qtdAtual <= 0,
        isVendido,
        vendidoInfo,
        diasEmPnc
      };
    });

    return result;
  }, [activeValidades, dailyLogs, todayISO, produtosMap, vendidosMap]);

  // 2. Filter & Sort
  const filteredItems = useMemo(() => {
    return escoamentoItems.filter(item => {
      // Itens encaminhados para PNC saem da tela ativa de escoamento e vão para a guia de PNC
      if (item.localizacao === 'pnc' || (item as any).dataTransferenciaPnc) {
        return false;
      }

      // Search
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const mCode = item.codigo.toLowerCase().includes(q);
        const mDesc = item.descricao.toLowerCase().includes(q);
        const mLote = item.lote.toLowerCase().includes(q);
        if (!mCode && !mDesc && !mLote) return false;
      }

      // Status Stock Age
      if (statusFilter !== 'todos' && item.statusStockAge !== statusFilter) {
        return false;
      }

      // View Mode: ativos (com saldo pendente), concluidos (baixados 0 ou vendidos), todos
      if (viewMode === 'ativos' && (item.isTotalmenteEscoado || item.isVendido)) return false;
      if (viewMode === 'concluidos' && (!item.isTotalmenteEscoado && !item.isVendido)) return false;

      return true;
    }).sort((a, b) => a.stockAgeIndex - b.stockAgeIndex);
  }, [escoamentoItems, searchTerm, statusFilter, viewMode]);

  // 3. Stats KPIs
  const stats = useMemo(() => {
    const totalCriticoAtencao = escoamentoItems.length;
    let ativosCount = 0;
    let concluidosCount = 0;
    let totalQtdInicial = 0;
    let totalQtdAtual = 0;

    escoamentoItems.forEach(i => {
      if (i.isTotalmenteEscoado) concluidosCount++;
      else ativosCount++;
      totalQtdInicial += i.qtdInicial;
      totalQtdAtual += Math.max(0, i.qtdAtual);
    });

    const totalQtdEscoada = totalQtdInicial - totalQtdAtual;
    const pctEscoadoGeral = totalQtdInicial > 0 ? Math.round((totalQtdEscoada / totalQtdInicial) * 100) : 100;

    return {
      totalCriticoAtencao,
      ativosCount,
      concluidosCount,
      totalQtdInicial,
      totalQtdAtual,
      totalQtdEscoada,
      pctEscoadoGeral
    };
  }, [escoamentoItems]);

  // Open modal for daily count
  const handleOpenCountModal = (item: EscoamentoItem) => {
    setSelectedItem(item);
    setInputQtd(item.qtdAtual);
    setInputObs('');
  };

  // Submit daily count log
  const handleSaveDailyCount = async () => {
    if (!selectedItem) return;

    if (inputQtd < 0) {
      alert('A quantidade não pode ser negativa.');
      return;
    }

    setIsSaving(true);

    const log: EscoamentoDailyLog = {
      id: String(Date.now()),
      loteKey: selectedItem.loteKey,
      dataCount: todayISO,
      qtdAnterior: selectedItem.qtdAtual,
      qtdAtual: inputQtd,
      qtdEscoada: selectedItem.qtdAtual - inputQtd,
      responsavel: user?.nome || 'Conferente',
      observacao: inputObs.trim(),
      timestamp: new Date().toISOString()
    };

    const updatedLogs = [log, ...dailyLogs];
    saveDailyLogs(updatedLogs);

    // Save to Repository
    try {
      await escoamentoLogsRepo.create({
        empresaId: empresa?.id || 'demo',
        ...log
      }, empresa?.id || 'demo');

      // Update item in ValidadesRepository if _docId exists
      if (selectedItem._docId) {
        await ValidadesRepository.update(selectedItem._docId, {
          caixa: inputQtd,
          quantidade: inputQtd,
          _atualizadoEm: new Date().toISOString()
        } as any, empresa?.id || 'demo');
      }
    } catch (err) {
      console.error('Erro ao atualizar no repositório:', err);
    }

    setIsSaving(false);
    setSelectedItem(null);
    if (onRefresh) onRefresh();
  };

  // Critical PNC items (29+ days)
  const criticalPncItems = useMemo(() => {
    return escoamentoItems.filter(item => (item.localizacao === 'pnc' || (item.diasEmPnc !== undefined && item.diasEmPnc >= 0)) && !item.isTotalmenteEscoado && (item.diasEmPnc !== undefined && item.diasEmPnc >= 29));
  }, [escoamentoItems]);

  // ── ACTION: CONCLUIR ESCOAMENTO (Suma da tabela) ──
  const handleConcluirEscoamento = async (item: EscoamentoItem) => {
    if (!confirm(`Confirma que o produto "${item.descricao}" foi 100% escoado e não possui mais caixas no armazém?\nEste item será removido da visão ativa de escoamento.`)) {
      return;
    }

    const companyId = empresa?.id || 'demo';
    const nowIso = new Date().toISOString();

    const log: EscoamentoDailyLog = {
      id: String(Date.now()),
      loteKey: item.loteKey,
      dataCount: todayISO,
      qtdAnterior: item.qtdAtual,
      qtdAtual: 0,
      qtdEscoada: item.qtdAtual,
      responsavel: user?.nome || 'Conferente',
      observacao: 'Escoamento Concluído pelo Colaborador - Sem saldo no armazém',
      timestamp: nowIso
    };

    const updatedLogs = [log, ...dailyLogs];
    saveDailyLogs(updatedLogs);

    const validadesKey = `armazem_validades_${companyId}`;
    try {
      const rawList: ValidadeRow[] = JSON.parse(localStorage.getItem(validadesKey) || '[]');
      const updatedList = rawList.map(v => {
        const vCode = String(v.codigo || '').trim();
        const vVal = v.validade || todayISO;
        if (vCode === item.codigo && vVal === item.dataVencimento) {
          return { ...v, caixa: 0, quantidade: 0, palhete: 0, lastro: 0 };
        }
        return v;
      });
      localStorage.setItem(validadesKey, JSON.stringify(updatedList));
    } catch (e) {
      console.error('Erro ao atualizar validades:', e);
    }

    try {
      await escoamentoLogsRepo.create({ empresaId: companyId, ...log }, companyId);
      if (item._docId) {
        await ValidadesRepository.update(item._docId, {
          caixa: 0,
          quantidade: 0,
          palhete: 0,
          _atualizadoEm: nowIso
        } as any, companyId);
      }
    } catch (err) {
      console.error('Erro ao atualizar repositório:', err);
    }

    window.dispatchEvent(new Event('local_data_changed'));
    window.dispatchEvent(new Event('storage'));
    if (onRefresh) onRefresh();
  };

  // ── ACTION: MANDAR PARA PNC ──
  const handleTransferToPnc = async (item: EscoamentoItem) => {
    if (!confirm(`Deseja transferir o produto "${item.descricao}" para a área de PNC (Produtos Não Conformes)?\n\nO item sairá desta tela imediatamente e será direcionado para a Guia de PNC para tratativa.`)) {
      return;
    }

    const companyId = empresa?.id || 'demo';
    const nowIso = new Date().toISOString();
    const todayStr = nowIso.substring(0, 10);

    // Save directly in central PNC Platform & Records
    encaminharItemParaPnc({
      codigo: item.codigo,
      descricao: item.descricao,
      validade: item.dataVencimento,
      lote: item.lote,
      quantidade: item.qtdAtual,
      qtde_bloq_cx: item.qtdAtual,
      localizacaoAnterior: item.localizacao || 'Armazém Central',
      blocoAnterior: item.bloco || 'Bloco A',
      data_entrada: todayStr,
      motivo: `Transferido do Escoamento (Stock Age: ${item.stockAgeIndex}%)`,
      responsavel: user?.nome || 'Conferente FEFO',
      empresaId: companyId
    }, companyId);

    // Save directly in central PNC Manager legacy store
    savePncItem({
      codigo: item.codigo,
      descricao: item.descricao,
      validade: item.dataVencimento,
      lote: item.lote,
      quantidade: item.qtdAtual,
      localizacaoAnterior: item.localizacao || 'Armazém Central',
      blocoAnterior: item.bloco || 'Bloco A',
      dataEntradaPnc: todayStr,
      motivo: `Transferido do Escoamento (Stock Age: ${item.stockAgeIndex}%)`,
      registradoPor: user?.nome || 'Conferente FEFO',
      status: 'Em Quarentena / PNC'
    }, companyId);

    const pncKey = `armazem_pnc_dates_${companyId}`;
    let pncMap: Record<string, string> = {};
    try {
      pncMap = JSON.parse(localStorage.getItem(pncKey) || '{}');
    } catch (e) {}
    pncMap[item.loteKey] = nowIso;
    localStorage.setItem(pncKey, JSON.stringify(pncMap));

    const validadesKey = `armazem_validades_${companyId}`;
    try {
      const rawList: ValidadeRow[] = JSON.parse(localStorage.getItem(validadesKey) || '[]');
      const updatedList = rawList.map(v => {
        const vCode = String(v.codigo || '').trim();
        const vVal = v.validade || todayISO;
        if (vCode === item.codigo && vVal === item.dataVencimento) {
          return { ...v, localizacao: 'pnc', dataTransferenciaPnc: nowIso };
        }
        return v;
      });
      localStorage.setItem(validadesKey, JSON.stringify(updatedList));
    } catch (e) {}

    const log: EscoamentoDailyLog = {
      id: String(Date.now()),
      loteKey: item.loteKey,
      dataCount: todayISO,
      qtdAnterior: item.qtdAtual,
      qtdAtual: item.qtdAtual,
      qtdEscoada: 0,
      responsavel: user?.nome || 'Conferente',
      observacao: 'Transferido para a Área PNC (Produto Não Conforme)',
      timestamp: nowIso
    };
    saveDailyLogs([log, ...dailyLogs]);

    try {
      if (item._docId) {
        await ValidadesRepository.update(item._docId, {
          localizacao: 'pnc',
          dataTransferenciaPnc: nowIso,
          _atualizadoEm: nowIso
        } as any, companyId);
      }
    } catch (e) {}

    window.dispatchEvent(new Event('local_data_changed'));
    window.dispatchEvent(new Event('pnc_updated'));
    window.dispatchEvent(new Event('storage'));
    if (onRefresh) onRefresh();

    alert(`✅ Produto "${item.descricao}" (${item.qtdAtual} cx) foi direcionado com sucesso para a Guia de PNC para tratativa e removido do escoamento ativo.`);
  };

  // ── ACTION: TRATATIVA PNC - ENVIAR PARA DESPEJO ──
  const handleEnviarParaDespejo = async (item: EscoamentoItem) => {
    if (!confirm(`TRATATIVA PNC: Confirma enviar o produto "${item.descricao}" (${item.qtdAtual} cx) para DESPEJO?\n\nSerá criada uma tarefa operacional para os ajudantes de armazém.`)) {
      return;
    }

    const companyId = empresa?.id || 'demo';
    const nowIso = new Date().toISOString();

    // 1. Create official task for Ajudante de Armazém
    saveDespejoTask({
      origem: 'FEFO',
      codigo: item.codigo,
      descricao: item.descricao,
      lote: item.lote,
      validade: item.dataVencimento,
      quantidade: item.qtdAtual,
      motivo: `Tratativa PNC (${item.diasEmPnc || 29} dias em quarentena) - Escoamento`,
      solicitadoPor: user?.nome || 'Conferente FEFO',
      prioridade: (item.diasEmPnc || 0) >= 25 ? 'Urgente' : 'Alta',
      status: 'Pendente'
    }, companyId);

    const despejoKey = `despejo_rows_${companyId}`;
    let despejoList: any[] = [];
    try {
      despejoList = JSON.parse(localStorage.getItem(despejoKey) || '[]');
    } catch (e) {}

    const despejoDoc = {
      id: String(Date.now()),
      codigo: item.codigo,
      descricao: item.descricao,
      quantidade: item.qtdAtual,
      lote: item.lote,
      validade: item.dataVencimento,
      motivo: `Tratativa PNC (${item.diasEmPnc || 29} dias na área de PNC)`,
      responsavel: user?.nome || 'Conferente',
      dataDespejo: todayISO,
      _criadoEm: nowIso
    };
    despejoList.push(despejoDoc);
    localStorage.setItem(despejoKey, JSON.stringify(despejoList));

    const validadesKey = `armazem_validades_${companyId}`;
    try {
      const rawList: ValidadeRow[] = JSON.parse(localStorage.getItem(validadesKey) || '[]');
      const updatedList = rawList.map(v => {
        const vCode = String(v.codigo || '').trim();
        const vVal = v.validade || todayISO;
        if (vCode === item.codigo && vVal === item.dataVencimento) {
          return { ...v, caixa: 0, quantidade: 0, localizacao: 'despejo' };
        }
        return v;
      });
      localStorage.setItem(validadesKey, JSON.stringify(updatedList));
    } catch (e) {}

    const log: EscoamentoDailyLog = {
      id: String(Date.now()),
      loteKey: item.loteKey,
      dataCount: todayISO,
      qtdAnterior: item.qtdAtual,
      qtdAtual: 0,
      qtdEscoada: item.qtdAtual,
      responsavel: user?.nome || 'Conferente',
      observacao: `Tratativa PNC (${item.diasEmPnc || 29}d): Enviado para Despejo`,
      timestamp: nowIso
    };
    saveDailyLogs([log, ...dailyLogs]);

    try {
      await DespejoRepository.create({ empresaId: companyId, ...despejoDoc } as any, companyId);
      if (item._docId) {
        await ValidadesRepository.update(item._docId, {
          caixa: 0,
          quantidade: 0,
          localizacao: 'despejo',
          _atualizadoEm: nowIso
        } as any, companyId);
      }
    } catch (e) {}

    window.dispatchEvent(new Event('local_data_changed'));
    window.dispatchEvent(new Event('despejo_tasks_updated'));
    window.dispatchEvent(new Event('storage'));
    alert(`✅ Produto ${item.codigo} enviado para Despejo! Tarefa gerada para o Ajudante de Armazém.`);
    if (onRefresh) onRefresh();
  };

  // ── ACTION: TRATATIVA PNC - DEVOLVER PARA FÁBRICA ──
  const handleDevolverParaFabrica = async (item: EscoamentoItem) => {
    if (!confirm(`TRATATIVA PNC: Confirma DEVOLVER o produto "${item.descricao}" (${item.qtdAtual} cx) PARA A FÁBRICA?`)) {
      return;
    }

    const companyId = empresa?.id || 'demo';
    const nowIso = new Date().toISOString();

    const validadesKey = `armazem_validades_${companyId}`;
    try {
      const rawList: ValidadeRow[] = JSON.parse(localStorage.getItem(validadesKey) || '[]');
      const updatedList = rawList.map(v => {
        const vCode = String(v.codigo || '').trim();
        const vVal = v.validade || todayISO;
        if (vCode === item.codigo && vVal === item.dataVencimento) {
          return { ...v, caixa: 0, quantidade: 0, localizacao: 'devolvido_fabrica' };
        }
        return v;
      });
      localStorage.setItem(validadesKey, JSON.stringify(updatedList));
    } catch (e) {}

    const log: EscoamentoDailyLog = {
      id: String(Date.now()),
      loteKey: item.loteKey,
      dataCount: todayISO,
      qtdAnterior: item.qtdAtual,
      qtdAtual: 0,
      qtdEscoada: item.qtdAtual,
      responsavel: user?.nome || 'Conferente',
      observacao: `Tratativa PNC (${item.diasEmPnc || 29}d): Devolvido para Fábrica`,
      timestamp: nowIso
    };
    saveDailyLogs([log, ...dailyLogs]);

    try {
      if (item._docId) {
        await ValidadesRepository.update(item._docId, {
          caixa: 0,
          quantidade: 0,
          localizacao: 'devolvido_fabrica',
          _atualizadoEm: nowIso
        } as any, companyId);
      }
    } catch (e) {}

    window.dispatchEvent(new Event('local_data_changed'));
    window.dispatchEvent(new Event('storage'));
    alert(`✅ Produto ${item.codigo} devolvido para a Fábrica com sucesso!`);
    if (onRefresh) onRefresh();
  };

  const formatDateBR = (isoDate: string) => {
    if (!isoDate) return '-';
    const parts = isoDate.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return isoDate;
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (filteredItems.length === 0) {
      alert('Nenhum dado para exportar.');
      return;
    }

    const excelData = filteredItems.map(item => ({
      'Código': item.codigo,
      'Produto': item.descricao,
      'Lote': item.lote,
      'Vencimento': formatDateBR(item.dataVencimento),
      'Stock Age Index (%)': `${item.stockAgeIndex}%`,
      'Classificação': item.statusStockAge,
      'Qtd Inicial (Cx)': item.qtdInicial,
      'Qtd Atual em Estoque (Cx)': item.qtdAtual,
      'Qtd Escoada / Vendida (Cx)': item.qtdInicial - item.qtdAtual,
      '% Escoado': `${Math.round(((item.qtdInicial - item.qtdAtual) / item.qtdInicial) * 100)}%`,
      'Status Escoamento': item.isTotalmenteEscoado ? '100% Baixado' : 'Em Escoamento',
      'Última Contagem': item.logs.length > 0 ? formatDateBR(item.logs[0].dataCount) : 'Pendente'
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Gestao_Escoamento');
    XLSX.writeFile(workbook, `Gestao_Escoamento_Critico_${empresa?.id || 'Armazem'}_${todayISO}.xlsx`);
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#111822] p-5 rounded-2xl border border-[#222d3a]">
        <div>
          <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-widest mb-1">
            <TrendingDown className="w-4 h-4" />
            <span>Módulo FEFO / Validades Críticas</span>
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Gestão de Escoamento Diário
            <span className="text-xs font-normal text-rose-300 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
              Janela Crítica (≤ 45 Dias)
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Acompanhe dia a dia a baixa física dos lotes na janela de vencimento (≤ 45 dias) até a saída total do estoque.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => exportarHistoricoEscoamentoParaExcel(companyId)}
            className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-md"
            title="Exportar planilha Excel completa com o histórico de todos os itens vendidos e baixados"
          >
            <FileSpreadsheet className="w-4 h-4 text-white" />
            <span>Exportar Histórico Geral</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="py-2 px-3.5 bg-[#1a2332] hover:bg-[#222d3a] text-slate-200 border border-[#2d3a4d] font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Exportar Tabela Atual</span>
          </button>
        </div>
      </div>

      {/* MENSAGEM DE TRATATIVA URGENTE PNC (29+ DIAS) */}
      {criticalPncItems.length > 0 && (
        <div id="pnc-critical-section" className="bg-gradient-to-r from-rose-950/90 to-amber-950/90 border-2 border-rose-500 p-5 rounded-2xl animate-pulse flex flex-col md:flex-row items-center justify-between gap-4 text-white shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/40 font-bold text-xl flex items-center justify-center">
              🚨
            </div>
            <div>
              <h4 className="text-sm font-black uppercase text-rose-300 tracking-wide flex items-center gap-2">
                MENSAGEM DE TRATATIVA URGENTE — ÁREA PNC ({criticalPncItems.length} {criticalPncItems.length === 1 ? 'PRODUTO COMPLETOU 29+ DIAS' : 'PRODUTOS COMPLETARAM 29+ DIAS'})
              </h4>
              <p className="text-xs text-rose-200 mt-1">
                Atenção! Os produtos transferidos para o PNC não podem ultrapassar 30 dias de permanência (completaram 29 dias ou mais). Realize a tratativa agora: <strong>Enviar para Despejo</strong> ou <strong>Devolver para Fábrica</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* KPI DASHBOARD */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        
        {/* TOTAL DE LOTES CRÍTICOS / ATENÇÃO */}
        <div className="bg-[#111822] p-4 rounded-2xl border border-[#222d3a] flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Itens Unificados</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-mono">{stats.totalCriticoAtencao}</span>
            <span className="text-[10px] text-slate-400">código/validade</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Unificados p/ evitar alertas duplos</p>
        </div>

        {/* EM ESCOAMENTO ATIVO */}
        <div className="bg-[#111822] p-4 rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-500/5 to-transparent flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-400 text-xs font-extrabold">
            <span>Escoamento Ativo</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-400 font-mono">{stats.ativosCount}</span>
            <span className="text-[10px] font-bold text-slate-300 font-mono">{stats.totalQtdAtual} cx rest.</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Itens com saldo em estoque</p>
        </div>

        {/* BAIXADO COMPLETAMENTE */}
        <div className="bg-[#111822] p-4 rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/5 to-transparent flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-extrabold">
            <span>100% Baixados</span>
            <PackageCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-400 font-mono">{stats.concluidosCount}</span>
            <span className="text-[10px] font-bold text-emerald-400/90 font-mono">
              {stats.totalCriticoAtencao > 0 ? Math.round((stats.concluidosCount / stats.totalCriticoAtencao) * 100) : 100}%
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Lotes totalmente escoados (0 cx)</p>
        </div>

        {/* EVOLUÇÃO GERAL ESCOADA */}
        <div className="bg-[#111822] p-4 rounded-2xl border border-purple-500/30 bg-gradient-to-b from-purple-500/5 to-transparent flex flex-col justify-between">
          <div className="flex items-center justify-between text-purple-300 text-xs font-extrabold">
            <span>Evolução Escoamento</span>
            <TrendingDown className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-purple-300 font-mono">{stats.pctEscoadoGeral}%</span>
            <span className="text-[10px] font-bold text-purple-400 font-mono">{stats.totalQtdEscoada} cx saíram</span>
          </div>
          <div className="w-full bg-slate-800/80 rounded-full h-1 mt-1 overflow-hidden">
            <div className="bg-purple-500 h-full rounded-full transition-all" style={{ width: `${stats.pctEscoadoGeral}%` }} />
          </div>
        </div>

        {/* PERCENTUAL DE ADERÊNCIA AO GIRO */}
        <div className="bg-[#111822] p-4 rounded-2xl border border-cyan-500/30 bg-gradient-to-b from-cyan-500/5 to-transparent flex flex-col justify-between">
          <div className="flex items-center justify-between text-cyan-300 text-xs font-extrabold">
            <span>Aderência ao Giro</span>
            <PackageCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-cyan-300 font-mono">
              {stats.totalQtdInicial > 0 ? Math.min(100, Math.round((stats.totalQtdEscoada / Math.max(1, stats.totalQtdInicial * 0.65)) * 100)) : 100}%
            </span>
            <span className="text-[10px] font-bold text-cyan-400 font-mono">Meta Giro 65%</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Realizado vs Ritmo de Venda</p>
        </div>

        {/* TRANSFERÊNCIAS POR QUEBRAS DE FEFO */}
        <div className="bg-[#111822] p-4 rounded-2xl border border-rose-500/30 bg-gradient-to-b from-rose-500/5 to-transparent flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-300 text-xs font-extrabold">
            <span>Quebras de FEFO</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-rose-400 font-mono">
              {escoamentoItems.filter(i => i.statusStockAge === 'Crítico').length}
            </span>
            <span className="text-[10px] font-bold text-rose-300 font-mono">Transferências</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Remanejamentos gerados</p>
        </div>

      </div>

      {/* PAINEL DE AÇÕES DE ESCOAMENTO & TRANSFERÊNCIAS POR QUEBRAS DE FEFO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 1. AÇÕES DE ESCOAMENTO */}
        <div className="bg-[#111822] p-5 rounded-2xl border border-[#222d3a] flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between border-b border-[#222d3a] pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <h3 className="font-sans font-black text-xs uppercase text-white tracking-wider">
                Ações de Escoamento Ativas (Comercial + Operacional)
              </h3>
            </div>
            <span className="text-[10px] font-mono font-bold bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded border border-amber-500/20">
              4 Planos Ativos
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="bg-[#16202c] p-3 rounded-xl border border-[#222d3a] flex items-center justify-between">
              <div>
                <span className="text-[9px] font-black uppercase text-amber-400 block">Promoção / Tabloide</span>
                <span className="text-white font-bold text-xs">Desconto de 15% em SKUs em janela crítica (&le;30d)</span>
                <p className="text-[10px] text-slate-400 mt-0.5">Aceleração de saída para canal de autosserviço</p>
              </div>
              <span className="text-[10px] font-mono font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                +24% giro
              </span>
            </div>

            <div className="bg-[#16202c] p-3 rounded-xl border border-[#222d3a] flex items-center justify-between">
              <div>
                <span className="text-[9px] font-black uppercase text-sky-400 block">Bonificação RLP</span>
                <span className="text-white font-bold text-xs">Combo Bonificado para Clientes Rota Própria</span>
                <p className="text-[10px] text-slate-400 mt-0.5">Incentivo de equipe comercial para escoamento acelerado</p>
              </div>
              <span className="text-[10px] font-mono font-black text-sky-400 bg-sky-500/10 px-2 py-1 rounded">
                180 cx alocadas
              </span>
            </div>
          </div>
        </div>

        {/* 2. TRANSFERÊNCIAS POR QUEBRAS DE FEFO */}
        <div className="bg-[#111822] p-5 rounded-2xl border border-[#222d3a] flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between border-b border-[#222d3a] pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              <h3 className="font-sans font-black text-xs uppercase text-white tracking-wider">
                Transferências por Quebras de FEFO
              </h3>
            </div>
            <span className="text-[10px] font-mono font-bold bg-rose-500/10 text-rose-300 px-2 py-0.5 rounded border border-rose-500/20">
              Corretivas no Armazém
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="bg-[#16202c] p-3 rounded-xl border border-[#222d3a] flex items-center justify-between">
              <div>
                <span className="text-[9px] font-black uppercase text-rose-400 block">Central &rarr; Picking</span>
                <span className="text-white font-bold text-xs">Inversão de Lote detectada na Doca A2</span>
                <p className="text-[10px] text-slate-400 mt-0.5">Transferência imediata do lote mais antigo para área de picking</p>
              </div>
              <span className="text-[10px] font-mono font-black text-rose-400 bg-rose-500/10 px-2 py-1 rounded">
                Urgente
              </span>
            </div>

            <div className="bg-[#16202c] p-3 rounded-xl border border-[#222d3a] flex items-center justify-between">
              <div>
                <span className="text-[9px] font-black uppercase text-purple-400 block">Rebalanceamento Filial</span>
                <span className="text-white font-bold text-xs">Remanejamento para Filial de Alto Giro</span>
                <p className="text-[10px] text-slate-400 mt-0.5">Transferência inter-unidades para evitar perda de validade</p>
              </div>
              <span className="text-[10px] font-mono font-black text-purple-300 bg-purple-500/10 px-2 py-1 rounded">
                Em Trânsito
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-[#111822] p-4 rounded-2xl border border-[#222d3a] flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* BUSCA */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por produto, SKU ou lote..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-[#16202c] border border-[#283648] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
          />
        </div>

        {/* DROPDOWNS FILTROS */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          
          {/* VIEW MODE */}
          <select
            value={viewMode}
            onChange={e => setViewMode(e.target.value as any)}
            className="bg-[#16202c] border border-[#283648] text-xs text-slate-200 font-medium rounded-xl px-3 py-2 focus:outline-none focus:border-rose-500"
          >
            <option value="ativos">⏳ Em Escoamento ({stats.ativosCount})</option>
            <option value="concluidos">✅ 100% Baixados ({stats.concluidosCount})</option>
            <option value="todos">📦 Todos ({stats.totalCriticoAtencao})</option>
          </select>

          {/* CLASSIFICAÇÃO */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="bg-[#16202c] border border-[#283648] text-xs text-slate-200 font-medium rounded-xl px-3 py-2 focus:outline-none focus:border-rose-500"
          >
            <option value="todos">🎯 Todas Classificações</option>
            <option value="Crítico">🔴 Apenas Crítico (&lt;60%)</option>
            <option value="Atenção">🟡 Apenas Atenção (60-75%)</option>
          </select>

          {/* SELETOR DE VALIDADES SINCRONIZADO */}
          <button
            onClick={() => setShowSelectValidadesModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            title="Selecionar e filtrar quais validades recolhidas serão exibidas na Gestão de Escoamento (persistente e sincronizado com a aba Validades)"
          >
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span>Validades Selecionadas ({selectedValidadesKeys.size})</span>
          </button>

        </div>
      </div>

      {/* CARDS LISTING OF ITEMS REQUIRING DAILY COUNT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredItems.length === 0 ? (
          <div className="col-span-full bg-[#111822] p-12 rounded-2xl border border-[#222d3a] text-center text-slate-500">
            Nenhum produto crítico ou em atenção encontrado com os filtros selecionados.
          </div>
        ) : (
          filteredItems.map((item, idx) => {
            const isCritico = item.statusStockAge === 'Crítico';
            const pctEscoado = item.qtdInicial > 0 
              ? Math.min(100, Math.max(0, Math.round(((item.qtdInicial - item.qtdAtual) / item.qtdInicial) * 100))) 
              : 100;

            return (
              <div 
                key={item._docId || `${item.loteKey}_${idx}`}
                className={`bg-[#111822] rounded-2xl border p-5 flex flex-col justify-between transition-all ${
                  item.isTotalmenteEscoado
                    ? 'border-emerald-500/30 bg-emerald-500/5 opacity-80'
                    : isCritico
                    ? 'border-red-500/30 bg-gradient-to-b from-red-500/5 to-transparent'
                    : 'border-amber-500/30 bg-gradient-to-b from-amber-500/5 to-transparent'
                }`}
              >
                <div>
                  {/* TOP BADGES */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                      isCritico ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}>
                      {isCritico ? '🔴 Stock Age Crítico' : '🟡 Stock Age Atenção'} ({item.stockAgeIndex}%)
                    </span>

                    {item.isVendido ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500 text-slate-950 shadow-2xs">
                        <CheckCircle2 className="w-3 h-3" />
                        Vendido em {item.vendidoInfo?.dataVenda} ({item.vendidoInfo?.responsavel})
                      </span>
                    ) : item.isTotalmenteEscoado ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500 text-slate-950">
                        <CheckCircle2 className="w-3 h-3" />
                        100% Baixado
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-mono">
                        Vence: <strong className="text-white">{formatDateBR(item.dataVencimento)}</strong>
                      </span>
                    )}
                  </div>

                  {/* PRODUTO TITLE */}
                  <h3 className="text-base font-bold text-white tracking-tight leading-snug">
                    {item.descricao}
                  </h3>
                  
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
                    <span>SKU: <strong className="text-slate-200">{item.codigo}</strong></span>
                    <span>•</span>
                    <span>Lote: <strong className="text-purple-300">{item.lote}</strong></span>
                  </div>

                  {/* ESCOAMENTO PROGRESS BAR */}
                  <div className="mt-4 bg-[#16202c] p-3 rounded-xl border border-[#222d3a]">
                    <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                      <span className="text-slate-300">Progresso de Saída (Escoamento)</span>
                      <span className={pctEscoado === 100 ? 'text-emerald-400 font-mono font-black' : 'text-amber-400 font-mono font-black'}>
                        {pctEscoado}% Escoado
                      </span>
                    </div>

                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mb-2">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          pctEscoado === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 to-rose-500'
                        }`} 
                        style={{ width: `${pctEscoado}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>Inicial: <strong className="text-white">{item.qtdInicial} cx</strong></span>
                      <span>Restante: <strong className={item.qtdAtual === 0 ? 'text-emerald-400 font-bold' : 'text-amber-300 font-bold'}>{item.qtdAtual} cx</strong></span>
                    </div>
                  </div>

                  {/* HISTORY LOGS PREVIEW */}
                  {item.logs.length > 0 && (
                    <div className="mt-3 flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <History className="w-3 h-3 text-purple-400" />
                        Histórico de Contagens Recentes:
                      </span>
                      <div className="max-h-24 overflow-y-auto divide-y divide-slate-800/60 bg-[#16202c]/50 rounded-lg p-2 text-[11px] font-mono">
                        {item.logs.slice(0, 3).map((log, lIdx) => (
                          <div key={`log-${log.id || lIdx}-${lIdx}`} className="py-1 flex items-center justify-between text-slate-300">
                            <span>{formatDateBR(log.dataCount)} — {log.responsavel}:</span>
                            <span className="font-bold text-amber-300">
                              {log.qtdAnterior} cx <ArrowRight className="w-3 h-3 inline text-slate-500" /> {log.qtdAtual} cx ({log.qtdEscoada > 0 ? `-${log.qtdEscoada} cx` : 'Sem alteração'})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>

                {/* BOTTOM ACTIONS */}
                <div className="mt-4 pt-3 border-t border-[#222d3a] flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400">
                      Local: <strong className={item.localizacao === 'pnc' ? 'text-amber-400 font-bold uppercase' : 'text-slate-200 font-bold'}>
                        {item.localizacao === 'central' ? 'Estoque Central' : item.localizacao === 'pnc' ? `PNC (${item.diasEmPnc ?? 0}d)` : item.localizacao}
                      </strong>
                    </span>
                    {item.diasEmPnc !== undefined && (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        item.diasEmPnc >= 29 ? 'bg-rose-500 text-white font-black animate-pulse' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {item.diasEmPnc >= 29 ? `⚠️ 29+ dias em PNC (Tratativa Obrigatória)` : `${item.diasEmPnc} dias em PNC`}
                      </span>
                    )}
                  </div>

                  {/* PNC TRATATIVA BUTTONS IF 29+ DAYS */}
                  {item.diasEmPnc !== undefined && item.diasEmPnc >= 29 && !item.isTotalmenteEscoado && (
                    <div className="bg-rose-950/60 border border-rose-500/50 p-2.5 rounded-xl flex flex-col gap-2 mt-1">
                      <span className="text-[10px] font-black uppercase text-rose-300 flex items-center gap-1">
                        🚨 Tratativa Obrigatória (Chegou a 29 dias em PNC):
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleEnviarParaDespejo(item)}
                          className="py-1.5 px-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] rounded-lg cursor-pointer flex items-center justify-center gap-1"
                          title="Enviar produto para Despejo"
                        >
                          🗑️ Enviar p/ Despejo
                        </button>
                        <button
                          onClick={() => handleDevolverParaFabrica(item)}
                          className="py-1.5 px-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] rounded-lg cursor-pointer flex items-center justify-center gap-1"
                          title="Devolver produto para Fábrica"
                        >
                          🏭 Devolver p/ Fábrica
                        </button>
                      </div>
                    </div>
                  )}

                  {/* REGULAR ACTION BUTTONS */}
                  <div className="flex flex-wrap items-center justify-end gap-2 mt-1">
                    {item.localizacao !== 'pnc' && !item.isTotalmenteEscoado && (
                      <button
                        onClick={() => handleTransferToPnc(item)}
                        className="py-2 px-3 bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 border border-amber-500/30 font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer transition-all"
                        title="Mandar produto para área de PNC"
                      >
                        📍 Mandar p/ PNC
                      </button>
                    )}

                    {item.isVendido ? (
                      <button
                        type="button"
                        onClick={() => reverterItemParaPendente(item.loteKey, companyId)}
                        className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer transition-all shadow-md"
                        title="Item marcado como Vendido. Clique para reverter para Pendente"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Vendido (Reverter)</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          marcarItemComoVendido({
                            codigo: item.codigo,
                            descricao: item.descricao,
                            validade: item.dataVencimento,
                            quantidade: item.qtdAtual || item.qtdInicial,
                            localizacao: item.localizacao,
                            bloco: item.bloco,
                            responsavel: user?.nome || 'Gestor'
                          }, companyId);
                        }}
                        className="py-2 px-3 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-md animate-pulse hover:animate-none"
                        title="Marcar como Vendido (o item sairá imediatamente da gestão de pendentes)"
                      >
                        <Clock className="w-3.5 h-3.5 text-slate-950" />
                        <span>Pendente (Marcar Vendido)</span>
                      </button>
                    )}

                    {!item.isTotalmenteEscoado && (
                      <button
                        onClick={() => handleConcluirEscoamento(item)}
                        className="py-2 px-3 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer transition-all"
                        title="Concluir escoamento manual (zerar produto no armazém)"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Baixar 100%</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenCountModal(item)}
                      className="py-2 px-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer transition-all shadow-md shadow-rose-950/40"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Contagem Diária</span>
                    </button>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* MODAL LAÇAR CONTAGEM DIÁRIA */}
      {selectedItem && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#111822] border border-[#222d3a] rounded-2xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4">
            
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-400 uppercase tracking-widest">Contagem Diária de Escoamento</span>
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="text-slate-400 hover:text-white text-xs font-bold"
                >
                  ✕
                </button>
              </div>
              <h3 className="text-lg font-extrabold text-white mt-1">
                {selectedItem.descricao}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                SKU: {selectedItem.codigo} | Lote: {selectedItem.lote}
              </p>
            </div>

            <div className="bg-[#16202c] p-3 rounded-xl border border-[#222d3a] flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Saldo Anterior registrado:</span>
              <strong className="text-amber-400 text-sm">{selectedItem.qtdAtual} caixas</strong>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-300">
                Quantidade Atual Contada em Estoque Hoje ({formatDateBR(todayISO)}) *
              </label>
              <input 
                type="number" 
                min={0}
                value={inputQtd}
                onChange={e => setInputQtd(Number(e.target.value))}
                className="bg-[#16202c] border border-[#283648] text-white font-mono font-bold text-lg rounded-xl p-3 focus:outline-none focus:border-rose-500"
              />
              <span className="text-[11px] text-slate-400">
                Se o lote foi totalmente vendido ou recolhido, digite <strong className="text-emerald-400">0</strong>.
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-300">
                Observação do Conferente (Opcional)
              </label>
              <textarea 
                rows={2}
                placeholder="Ex: Saíram 15 caixas na rota de hoje..."
                value={inputObs}
                onChange={e => setInputObs(e.target.value)}
                className="bg-[#16202c] border border-[#283648] text-white text-xs rounded-xl p-2.5 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 mt-2">
              <button
                onClick={() => setSelectedItem(null)}
                disabled={isSaving}
                className="py-2.5 px-4 bg-[#16202c] hover:bg-[#202d3e] text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveDailyCount}
                disabled={isSaving}
                className="py-2.5 px-5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl cursor-pointer shadow-lg shadow-rose-950/40"
              >
                {isSaving ? 'Salvando...' : 'Confirmar Contagem'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: SELETOR DE VALIDADES RECOLHIDAS SINCRONIZADO */}
      <ValidadesRecolhidasModal
        isOpen={showSelectValidadesModal}
        onClose={() => setShowSelectValidadesModal(false)}
        validades={sourceAllValidades}
        selectedKeys={selectedValidadesKeys}
        onToggleKey={handleToggleValidadeKey}
        onSelectAll={handleSelectAllValidades}
        onDeselectAll={handleDeselectAllValidades}
        onSelectDate={handleSelectDateValidades}
        onSelectMultipleDates={handleSelectMultipleDates}
        onSelectLatestOnly={handleSelectLatestValidadesOnly}
        onSelectOnlyThisDate={handleSelectOnlyThisDate}
        onSelectOnlyThisKey={handleSelectOnlyThisKey}
        empresaProdutos={empresaData?.produtos}
      />

    </div>
  );
}
