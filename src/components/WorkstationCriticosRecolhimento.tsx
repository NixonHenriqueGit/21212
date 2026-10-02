import React, { useState, useMemo, useDeferredValue } from 'react';
import { ValidadeRow, Usuario, Empresa } from '../types';
import { 
  AlertTriangle, 
  Clock, 
  Box, 
  CheckCircle2, 
  Zap, 
  Search, 
  Filter, 
  ArrowRight, 
  DollarSign, 
  ShieldAlert,
  RefreshCw,
  Send,
  Trash2,
  X,
  Loader2,
  Check,
  LayoutGrid,
  List,
  Edit2,
  Calendar,
  Layers,
  MapPin,
  TrendingUp,
  FileText,
  Factory,
  FileCheck,
  ExternalLink
} from 'lucide-react';
import { PRODUCTS } from '../planosData';
import { syncFefoDemandsFromValidades, getStoredFefoDemands, updateFefoDemandStatus } from '../utils/fefoDemandManager';
import { calculateStockAgeIndex } from '../utils/calculateStockAgeIndex';
import { getInitialDefaultValidades, removeLegacySeedValidades, formatDateToBR } from '../utils/fefoDefaultData';
import { calcularTotalCaixas } from '../data/coletaPackagingData';
import { savePncItem, saveDespejoTask, PncItem } from '../utils/pncManager';
import { PncRecord, getStoredPncRecords, savePncRecords } from '../utils/gestaoPncManager';
import { get030519DataForSku } from '../utils/vendaMedia030519';
import { 
  getStoredEscoamentoVendidos, 
  marcarItemComoVendido, 
  reverterItemParaPendente, 
  exportarHistoricoCompletoEscoamento,
  EscoamentoVendidoItem 
} from '../utils/escoamentoVendaManager';
import { getSelectedValidadesKeys, filterValidadesByActiveSelection } from '../utils/fefoSelectionManager';
import { applyDashboardAdjustments } from '../utils/fefoDashboardAdjustments';

interface WorkstationCriticosProps {
  validadesList: ValidadeRow[];
  allValidadesList?: ValidadeRow[];
  user?: Usuario | null;
  empresa?: Empresa | null;
  onRefresh?: () => void;
  onOpenSelectValidades?: () => void;
  selectedKeysCount?: number;
  totalValidadesCount?: number;
  activeColetaLabel?: string;
}

const FABRICAS_AMBEV = [
  'ITAPISSUMA',
  'AGUDOS',
  'JACAREI',
  'ANAPOLIS',
  'AQUIDAUANA',
  'BRASILIA',
  'CAMACARI',
  'CURITIBA',
  'JAGUARIUNA',
  'JUNDIAI',
  'LAGES',
  'MANAUS',
  'PASSO FUNDO',
  'PERNAMBUCO',
  'PIRACICABA',
  'PONTAL',
  'RIO DE JANEIRO',
  'SETE LAGOAS',
  'TERESINA',
  'UBERLANDIA',
  'VIAMAO'
];

export const WorkstationCriticosRecolhimento: React.FC<WorkstationCriticosProps> = React.memo(({
  validadesList,
  allValidadesList,
  user,
  empresa,
  onRefresh,
  onOpenSelectValidades,
  selectedKeysCount,
  totalValidadesCount,
  activeColetaLabel
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearch = useDeferredValue(searchTerm);
  const [localFilter, setLocalFilter] = useState<string>('todos');
  const [statusActionFilter, setStatusActionFilter] = useState<'pendente' | 'vendido' | 'todos'>('pendente');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Non-blocking Toast & Mutation locks
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'warning' | 'info' | 'error' } | null>(null);
  const [recentlyUpdatedKey, setRecentlyUpdatedKey] = useState<string | null>(null);
  const [isSubmittingBulk, setIsSubmittingBulk] = useState<boolean>(false);
  const [submittingActionKey, setSubmittingActionKey] = useState<string | null>(null);

  // Custom non-blocking Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText: string;
    variant: 'danger' | 'warning';
    onConfirm: () => Promise<void> | void;
  } | null>(null);

  // PNC Information Modal State
  const [pncModalItem, setPncModalItem] = useState<{
    codigo: string;
    descricao: string;
    validade: string;
    quantidade: number;
    fatorHecto: number;
    volumeHl: number;
    valorTotal: number;
    lote: string;
    localizacao: string;
    bloco: string;
    diasParaVencer: number;
    nBloqueio: string;
    fabOrigem: string;
    nfEntrada: string;
    nfSaida: string;
    dataChegada: string;
    dataBloqueio: string;
    motivo: string;
    origemBloqueio: string;
    emissor: string;
    responsavel: string;
    acao: string;
    status: string;
    pallets: number;
    observacao: string;
  } | null>(null);

  const showToast = (text: string, type: 'success' | 'warning' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3800);
  };

  const companyId = empresa?.id || 'demo';

  // 1. Unified and Filtered Critical Items (diasParaVencer <= 45) from the last collection
  const [customQuantities, setCustomQuantities] = useState<Record<string, { qty: number; updatedAt: string; conferente: string }>>(() => {
    try {
      return JSON.parse(localStorage.getItem(`workstation_custom_quantities_${companyId}`) || '{}');
    } catch {
      return {};
    }
  });

  // Custom NF mappings
  const [customNfs, setCustomNfs] = useState<Record<string, { nfEntrada?: string; nfSaida?: string }>>(() => {
    try {
      return JSON.parse(localStorage.getItem(`workstation_nfs_${companyId}`) || '{}');
    } catch {
      return {};
    }
  });

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingQtyVal, setEditingQtyVal] = useState<string>('');

  const [editingNfKey, setEditingNfKey] = useState<string | null>(null);
  const [editingNfSaidaVal, setEditingNfSaidaVal] = useState<string>('');

  const [tratadosSet, setTratadosSet] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(`workstation_tratados_${companyId}`);
      return saved ? new Set(JSON.parse(saved)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });

  const [vendidosMap, setVendidosMap] = useState<Record<string, EscoamentoVendidoItem>>(() => {
    return getStoredEscoamentoVendidos(companyId);
  });

  const [syncTrigger, setSyncTrigger] = useState(0);

  // Reativo a vendas, seleção de validades e eventos de ajuste em tempo real
  React.useEffect(() => {
    let isMounted = true;
    const handleVendasUpdate = () => {
      setTimeout(() => {
        if (isMounted) setVendidosMap(getStoredEscoamentoVendidos(companyId));
      }, 0);
    };
    const handleSync = () => {
      setTimeout(() => {
        if (isMounted) setSyncTrigger(prev => prev + 1);
      }, 0);
    };

    window.addEventListener('escoamento_venda_updated', handleVendasUpdate);
    window.addEventListener('storage', handleVendasUpdate);
    window.addEventListener('fefo_adjustments_updated', handleSync);
    window.addEventListener('fefo_selection_updated', handleSync);
    window.addEventListener('fefo_definitive_updated', handleSync);
    window.addEventListener('fefo_validades_restored', handleSync);
    window.addEventListener('validades_updated', handleSync);
    window.addEventListener('app_data_updated', handleSync);

    return () => {
      isMounted = false;
      window.removeEventListener('escoamento_venda_updated', handleVendasUpdate);
      window.removeEventListener('storage', handleVendasUpdate);
      window.removeEventListener('fefo_adjustments_updated', handleSync);
      window.removeEventListener('fefo_selection_updated', handleSync);
      window.removeEventListener('fefo_definitive_updated', handleSync);
      window.removeEventListener('fefo_validades_restored', handleSync);
      window.removeEventListener('validades_updated', handleSync);
      window.removeEventListener('app_data_updated', handleSync);
    };
  }, [companyId]);

  const criticosUnificados = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Only real validades from collection, filtering out any legacy seed entries
    const rawList = removeLegacySeedValidades(validadesList && validadesList.length > 0 ? validadesList : []);
    
    // 1. Aplica ajustes definitivos do Dashboard (quantidades corrigidas e validades)
    const adjustedList = applyDashboardAdjustments(rawList, companyId);

    // 2. Aplica filtro de validades selecionadas (a Workstation agora sincroniza exatamente com a validade selecionada)
    const sourceList = filterValidadesByActiveSelection(adjustedList, companyId);

    // Group by codigo + validade
    const map = new Map<string, {
      codigo: string;
      descricao: string;
      validade: string;
      quantidade: number;
      fatorHecto: number;
      localizacao: string;
      bloco: string;
      diasParaVencer: number;
      stockAgeIndex?: number;
      idadeMissing?: boolean;
      statusLabel?: string;
      precoUnitario: number;
      valorTotal: number;
      lote: string;
      qtdAtualizadaLog?: { qty: number; updatedAt: string; conferente: string };
    }>();

    sourceList.forEach(item => {
      const cod = String(item.codigo || '000').trim();
      const val = String(item.validade || '').trim();
      if (!val) return;

      const key = `${cod}_${val}`;

      // Calculate quantity using the exact packaging formula or stored quantidade
      const p = Number(item.palhete) || 0;
      const l = Number(item.lastro) || 0;
      const c = Number(item.caixa) || 0;
      const q = Number((item as any).quantidade) || 0;
      let qty = 0;
      if (q > 0) {
        qty = q;
      } else if (p > 0 || l > 0 || c > 0) {
        qty = calcularTotalCaixas(cod, p, l, c);
      } else {
        qty = c > 0 ? c : 0;
      }

      if (qty <= 0) return; // Se não houver quantidade não precisa estar na lista

      // Product price and hectolitro factor
      const pMaster = PRODUCTS.find(pm => String(pm.codigo) === cod);
      const precoUnitario = Number((pMaster as any)?.preco) || 85.0;
      const fatorHecto = Number((pMaster as any)?.fatorHecto) || 0.072;

      // Expiry date calculation with robust parsing for DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD and 2-digit years
      let expDate = new Date(val + 'T00:00:00');
      if (isNaN(expDate.getTime())) {
        if (val.includes('/')) {
          const parts = val.split('/');
          if (parts.length === 3) {
            let year = parts[2].trim();
            if (year.length === 2) year = '20' + year;
            expDate = new Date(`${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}T00:00:00`);
          }
        } else if (val.includes('-')) {
          const parts = val.split('-');
          if (parts.length === 3) {
            if (parts[0].length === 2) {
              let year = parts[2].trim();
              if (year.length === 2) year = '20' + year;
              expDate = new Date(`${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}T00:00:00`);
            } else if (parts[0].length === 4) {
              expDate = new Date(`${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}T00:00:00`);
            }
          }
        }
      }

      const calcResult = calculateStockAgeIndex({
        codigo: cod,
        descricao: item.descricao,
        validade: val
      });

      const diasParaVencer = calcResult.diasRestantes;

      // Rule: STRICTLY ONLY ITEMS IN THE CRITICAL WINDOW (diasParaVencer <= 45)
      if (diasParaVencer > 45) return;

      if (map.has(key)) {
        const existing = map.get(key)!;
        existing.quantidade += qty;
        existing.valorTotal = existing.quantidade * precoUnitario;
        existing.lote = '-';
      } else {
        let loteFormatted = (item as any).lote || '';
        if (!loteFormatted || loteFormatted.startsWith('L-') || loteFormatted.startsWith(`L-${cod}`)) {
          loteFormatted = '-';
        }

        map.set(key, {
          codigo: cod,
          descricao: item.descricao || `Produto ${cod}`,
          validade: val,
          quantidade: qty,
          fatorHecto,
          localizacao: item.localizacao || 'central',
          bloco: item.bloco || '',
          diasParaVencer,
          stockAgeIndex: calcResult.stockAgeIndex,
          idadeMissing: calcResult.idadeMissing,
          statusLabel: calcResult.statusLabel,
          precoUnitario,
          valorTotal: qty * precoUnitario,
          lote: loteFormatted
        });
      }
    });

    const list = Array.from(map.values()).map(item => {
      const itemKey = `${item.codigo}_${item.validade}`;
      const qty = customQuantities[itemKey] ? customQuantities[itemKey].qty : item.quantidade;
      const fatorHecto = item.fatorHecto || 0.072;
      const volumeHl = qty * fatorHecto;
      
      // Venda média prioritariamente extraída do relatório oficial 03.05.19
      const item030519 = get030519DataForSku(item.codigo);
      const isFrom030519 = !!(item030519 && item030519.vendaMediaDiaria > 0);
      const vendaMedia = isFrom030519
        ? Math.round(item030519.vendaMediaDiaria * 10) / 10
        : Math.max(1, Math.round(qty / Math.max(4, item.diasParaVencer > 0 ? item.diasParaVencer : 10)));
      const diasEstoque = (qty / Math.max(0.1, vendaMedia)).toFixed(1);

      if (customQuantities[itemKey]) {
        const custom = customQuantities[itemKey];
        return {
          ...item,
          quantidade: custom.qty,
          valorTotal: custom.qty * item.precoUnitario,
          volumeHl,
          vendaMedia,
          isFrom030519,
          diasEstoque,
          qtdAtualizadaLog: custom
        };
      }
      return {
        ...item,
        volumeHl,
        vendaMedia,
        isFrom030519,
        diasEstoque
      };
    }).filter(item => item.quantidade > 0);

    // Return unifies items without generating mock fallback items
    list.sort((a, b) => a.diasParaVencer - b.diasParaVencer);
    return list;
  }, [validadesList, customQuantities, companyId, syncTrigger]);

  // Active FEFO demands from storage
  const activeDemands = useMemo(() => {
    return getStoredFefoDemands(companyId);
  }, [companyId, validadesList]);

  // Filtered rows for UI with deferred search for maximum responsiveness
  const filteredList = useMemo(() => {
    return criticosUnificados.filter(item => {
      if (deferredSearch.trim()) {
        const q = deferredSearch.toLowerCase().trim();
        const matchCode = item.codigo.toLowerCase().includes(q);
        const matchDesc = item.descricao.toLowerCase().includes(q);
        if (!matchCode && !matchDesc) return false;
      }

      if (localFilter !== 'todos') {
        const loc = (item.localizacao || '').toLowerCase();
        if (localFilter === 'central' && !loc.includes('central')) return false;
        if (localFilter === 'picking' && !loc.includes('picking')) return false;
        if (localFilter === 'pnc' && !loc.includes('pnc') && !loc.includes('bloqueado')) return false;
      }

      const key = `${item.codigo}_${item.validade}`;
      const isVendido = !!vendidosMap[key];

      // Filtro de Status: Pendentes (some ao vender), Vendidos, ou Todos
      if (statusActionFilter === 'pendente' && isVendido) return false;
      if (statusActionFilter === 'vendido' && !isVendido) return false;

      return true;
    });
  }, [criticosUnificados, deferredSearch, localFilter, statusActionFilter, vendidosMap]);

  // KPI stats com separação clara de Vendidos e Pendentes em Risco
  const totalSkusCriticos = criticosUnificados.length;
  const totalVendidos = useMemo(() => {
    return criticosUnificados.filter(i => !!vendidosMap[`${i.codigo}_${i.validade}`]).length;
  }, [criticosUnificados, vendidosMap]);
  const totalPendentes = Math.max(0, totalSkusCriticos - totalVendidos);

  // Risco calculado apenas sobre os itens pendentes
  const totalCaixasRisco = useMemo(() => {
    return criticosUnificados.filter(i => !vendidosMap[`${i.codigo}_${i.validade}`]).reduce((a, b) => a + b.quantidade, 0);
  }, [criticosUnificados, vendidosMap]);

  const totalHlRisco = useMemo(() => {
    return criticosUnificados.filter(i => !vendidosMap[`${i.codigo}_${i.validade}`]).reduce((a, b) => a + (b.volumeHl || 0), 0);
  }, [criticosUnificados, vendidosMap]);

  const valorTotalRisco = useMemo(() => {
    return criticosUnificados.filter(i => !vendidosMap[`${i.codigo}_${i.validade}`]).reduce((a, b) => a + b.valorTotal, 0);
  }, [criticosUnificados, vendidosMap]);

  const totalTratados = totalVendidos;

  const handleMarcarComoVendido = (item: any) => {
    const key = `${item.codigo}_${item.validade}`;
    const nfs = customNfs[key] || {};
    const nfSaida = nfs.nfSaida || (item as any).nfSaida || (item as any).nf;

    marcarItemComoVendido({
      codigo: item.codigo,
      descricao: item.descricao,
      validade: item.validade,
      lote: item.lote,
      quantidade: item.quantidade,
      valorTotal: item.valorTotal,
      volumeHl: item.volumeHl,
      responsavel: user?.nome || 'Operador CCO',
      nfSaida: nfSaida === '-' ? undefined : nfSaida,
      localizacao: item.localizacao,
      bloco: item.bloco,
      vendaMedia: item.vendaMedia,
      diasRestantes: item.diasParaVencer
    }, companyId);

    setVendidosMap(getStoredEscoamentoVendidos(companyId));
    showToast(`✅ ${item.descricao} marcado como VENDIDO e registrado no histórico!`, 'success');
  };

  const handleReverterParaPendente = (itemKey: string, descricao?: string) => {
    reverterItemParaPendente(itemKey, companyId);
    setVendidosMap(getStoredEscoamentoVendidos(companyId));
    showToast(`Item ${descricao || ''} revertido para PENDENTE.`, 'info');
  };

  const handleExportarHistorico = () => {
    exportarHistoricoCompletoEscoamento({
      itensAtivos: criticosUnificados,
      vendidosMap,
      companyId,
      nomeEmpresa: empresa?.nome
    });
    showToast('Planilha de histórico de escoamento exportada com sucesso!', 'success');
  };

  const handleToggleTratado = (key: string) => {
    if (vendidosMap[key]) {
      handleReverterParaPendente(key);
    } else {
      const found = criticosUnificados.find(i => `${i.codigo}_${i.validade}` === key);
      if (found) {
        handleMarcarComoVendido(found);
      }
    }
  };

  const handleSaveNf = (key: string) => {
    setCustomNfs(prev => {
      const next = {
        ...prev,
        [key]: {
          ...prev[key],
          nfSaida: editingNfSaidaVal.trim() || undefined
        }
      };
      localStorage.setItem(`workstation_nfs_${companyId}`, JSON.stringify(next));
      return next;
    });
    setEditingNfKey(null);
    showToast('Nota Fiscal atualizada com sucesso!', 'success');
  };

  const handleOpenPncModal = (item: any) => {
    const itemKey = `${item.codigo}_${item.validade}`;
    const nfs = customNfs[itemKey] || {};
    const nfSaida = nfs.nfSaida || (item as any).nfSaida || (item as any).nf || '';
    const nBloq = `BLQ-${item.codigo}-${Date.now().toString().slice(-5)}`;
    const todayStr = new Date().toISOString().substring(0, 10);
    const hl = item.volumeHl ? Number(item.volumeHl) : Number((item.quantidade * (item.fatorHecto || 0.072)).toFixed(2));
    const plts = Math.max(1, Math.ceil(item.quantidade / 72));

    setPncModalItem({
      codigo: item.codigo,
      descricao: item.descricao,
      validade: item.validade,
      quantidade: item.quantidade,
      fatorHecto: item.fatorHecto || 0.072,
      volumeHl: hl,
      valorTotal: item.valorTotal || (item.quantidade * 85),
      lote: item.lote || 'LOTE-PADRAO',
      localizacao: item.localizacao || 'Armazém Central',
      bloco: item.bloco || 'Bloco A',
      diasParaVencer: item.diasParaVencer,
      nBloqueio: nBloq,
      fabOrigem: 'ITAPISSUMA',
      nfEntrada: '',
      nfSaida: String(nfSaida),
      dataChegada: todayStr,
      dataBloqueio: todayStr,
      motivo: 'VALIDADE CRÍTICA (<30D) - RISCO DE PERDA DPO',
      origemBloqueio: 'WORKSTATION CCO / PATIO',
      emissor: user?.nome || 'Conferente CCO',
      responsavel: user?.nome || 'LOGÍSTICA / PNC',
      acao: 'DEVOLUÇÃO ORIGEM',
      status: 'BLOQUEADO',
      pallets: plts,
      observacao: 'Item recolhido na janela crítica via Workstation de Críticos para quarentena e devolução imediata.'
    });
  };

  const handleConfirmPncModal = async () => {
    if (!pncModalItem) return;
    setIsSubmittingBulk(true);

    try {
      const key = `${pncModalItem.codigo}_${pncModalItem.validade}`;
      setTratadosSet(prev => new Set(prev).add(key));

      // 1. Save in official GestaoPnc dataset (appears in GestaoPncPlatform charts & tables)
      const newPncRecord: PncRecord = {
        n_bloqueio: pncModalItem.nBloqueio,
        opera_o: 'GUARABIRA',
        m_s: new Date().toLocaleString('pt-BR', { month: 'short' }).toUpperCase().replace('.', ''),
        produto: isNaN(Number(pncModalItem.codigo)) ? pncModalItem.codigo : Number(pncModalItem.codigo),
        descri_o: pncModalItem.descricao,
        fab_origem: pncModalItem.fabOrigem,
        nf: pncModalItem.nfSaida || '-',
        data_da_chegada: pncModalItem.dataChegada,
        data_do_bloqueio: pncModalItem.dataBloqueio,
        motivo: pncModalItem.motivo,
        emissor: pncModalItem.emissor,
        origem_do_bloqueio: pncModalItem.origemBloqueio,
        qtde_bloq_cx: pncModalItem.quantidade,
        qtde_bloq_hl: pncModalItem.volumeHl,
        valor: pncModalItem.valorTotal,
        a_o: pncModalItem.acao,
        respons_vel: pncModalItem.responsavel,
        status: pncModalItem.status,
        qtde_retida: pncModalItem.status === 'BLOQUEADO' ? pncModalItem.quantidade : null,
        qtd_em_plts: pncModalItem.pallets,
        qtde_liberada: null,
        data_da_libera_o: null,
        dias_no_pnc: 0,
        observa_o: pncModalItem.observacao
      };

      const currentPncRecords = getStoredPncRecords(companyId);
      savePncRecords([newPncRecord, ...currentPncRecords], companyId);

      // 2. Save in ShelfLifePncTab item store
      savePncItem({
        codigo: pncModalItem.codigo,
        descricao: pncModalItem.descricao,
        validade: pncModalItem.validade,
        lote: pncModalItem.lote,
        quantidade: pncModalItem.quantidade,
        hectolitros: pncModalItem.volumeHl,
        valorTotal: pncModalItem.valorTotal,
        localizacaoAnterior: `${pncModalItem.localizacao} (${pncModalItem.bloco})`,
        dataEntradaPnc: pncModalItem.dataBloqueio,
        motivo: pncModalItem.motivo,
        registradoPor: pncModalItem.emissor,
        status: 'Em Quarentena / PNC',
        observacoes: pncModalItem.observacao
      }, companyId);

      // 3. Save NF mapping for cards
      if (pncModalItem.nfEntrada || pncModalItem.nfSaida) {
        setCustomNfs(prev => {
          const next = { ...prev, [key]: { nfEntrada: pncModalItem.nfEntrada, nfSaida: pncModalItem.nfSaida } };
          localStorage.setItem(`workstation_nfs_${companyId}`, JSON.stringify(next));
          return next;
        });
      }

      // 4. Update treated list in storage
      const list = JSON.parse(localStorage.getItem(`pnc_encaminhados_${companyId}`) || '[]');
      list.push({ ...pncModalItem, data: new Date().toISOString(), user: user?.nome || 'Operador' });
      localStorage.setItem(`pnc_encaminhados_${companyId}`, JSON.stringify(list));

      // 5. Fire global events for real-time reactivity
      window.dispatchEvent(new CustomEvent('pnc_updated'));
      window.dispatchEvent(new CustomEvent('validades_updated'));
      window.dispatchEvent(new CustomEvent('local_data_changed'));

      showToast(`⚠️ SKU ${pncModalItem.codigo} (${pncModalItem.nBloqueio}) registrado com sucesso no PNC e na Guia Shelf-Life & PNC!`, 'success');
      setPncModalItem(null);
      if (onRefresh) onRefresh();
    } finally {
      setIsSubmittingBulk(false);
    }
  };

  const handleEncaminharDespejo = async (codigo: string, descricao: string, validade?: string) => {
    const key = validade ? `${codigo}_${validade}` : codigo;
    if (submittingActionKey === key) return;

    setSubmittingActionKey(key);
    try {
      setTratadosSet(prev => new Set(prev).add(key));
      const targetItem = criticosUnificados.find(i => i.codigo === codigo && (!validade || i.validade === validade));
      const qty = targetItem ? targetItem.quantidade : 1;
      const lote = targetItem ? targetItem.lote : 'LOTE-CCO';

      // 1. Create official Despejo task for Ajudante de Armazém (appears in Produtividade Ajudante)
      saveDespejoTask({
        origem: 'Workstation',
        codigo,
        descricao,
        lote,
        validade: validade || new Date().toISOString().substring(0, 10),
        quantidade: qty,
        motivo: 'Recolhimento Crítico via Workstation CCO',
        solicitadoPor: user?.nome || 'Operador Workstation',
        prioridade: 'Alta',
        status: 'Pendente'
      }, companyId);

      // 2. Add to despejados list so it immediately disappears from Gestão de Escoamento
      const despejadosKey = `armazem_escoamento_despejados_${companyId}`;
      let despejadosList: string[] = [];
      try {
        despejadosList = JSON.parse(localStorage.getItem(despejadosKey) || '[]');
      } catch (e) {}
      if (!despejadosList.includes(key)) despejadosList.push(key);
      if (!despejadosList.includes(codigo)) despejadosList.push(codigo);
      localStorage.setItem(despejadosKey, JSON.stringify(despejadosList));

      // 3. Mark as despejo in armazem_validades
      const validadesKey = `armazem_validades_${companyId}`;
      try {
        const rawList: ValidadeRow[] = JSON.parse(localStorage.getItem(validadesKey) || '[]');
        const updatedList = rawList.map(v => {
          const vCode = String(v.codigo || '').trim();
          const vVal = v.validade || new Date().toISOString().substring(0, 10);
          if (vCode === codigo && (!validade || vVal === validade)) {
            return { ...v, caixa: 0, quantidade: 0, palhete: 0, lastro: 0, localizacao: 'despejo' };
          }
          return v;
        });
        localStorage.setItem(validadesKey, JSON.stringify(updatedList));
      } catch (e) {}

      const list = JSON.parse(localStorage.getItem(`despejo_encaminhados_${companyId}`) || '[]');
      list.push({ codigo, descricao, validade, data: new Date().toISOString(), user: user?.nome || 'Operador' });
      localStorage.setItem(`despejo_encaminhados_${companyId}`, JSON.stringify(list));

      // 4. Fire global events
      window.dispatchEvent(new CustomEvent('despejo_tasks_updated'));
      window.dispatchEvent(new CustomEvent('validades_updated'));
      window.dispatchEvent(new CustomEvent('local_data_changed'));
      window.dispatchEvent(new CustomEvent('pnc_updated'));

      showToast(`🗑️ SKU ${codigo} encaminhado para Despejo! Tarefa gerada na Guia Produtividade Ajudante e item removido do Escoamento.`, 'warning');
      if (onRefresh) onRefresh();
    } finally {
      setSubmittingActionKey(null);
    }
  };

  const handleEncaminharPNC = async (codigo: string, descricao: string, validade?: string) => {
    const targetItem = criticosUnificados.find(i => i.codigo === codigo && (!validade || i.validade === validade));
    if (targetItem) {
      handleOpenPncModal(targetItem);
    } else {
      handleOpenPncModal({
        codigo,
        descricao,
        validade: validade || new Date().toISOString().substring(0, 10),
        quantidade: 1,
        valorTotal: 85,
        lote: 'LOTE-CCO',
        localizacao: 'Workstation CCO',
        bloco: 'Bloco A',
        diasParaVencer: 30
      });
    }
  };

  const handleEncaminharListaDespejo = () => {
    if (criticosUnificados.length === 0) {
      showToast('Nenhum item na lista para encaminhar.', 'info');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Confirmar Encaminhamento para Despejo',
      description: `Deseja realmente encaminhar todos os ${criticosUnificados.length} itens críticos (≤ 45 dias) da lista para o setor de DESPEJO? Serão geradas tarefas operacionais para a equipe de Ajudantes.`,
      confirmText: 'Sim, Encaminhar Despejo',
      variant: 'danger',
      onConfirm: async () => {
        setIsSubmittingBulk(true);
        try {
          criticosUnificados.forEach(i => {
            setTratadosSet(prev => new Set(prev).add(`${i.codigo}_${i.validade}`));
            saveDespejoTask({
              origem: 'Workstation',
              codigo: i.codigo,
              descricao: i.descricao,
              lote: i.lote,
              validade: i.validade,
              quantidade: i.quantidade,
              motivo: 'Recolhimento Crítico em Massa via Workstation CCO',
              solicitadoPor: user?.nome || 'Operador Workstation',
              prioridade: 'Alta',
              status: 'Pendente'
            }, companyId);
          });
          const list = JSON.parse(localStorage.getItem(`despejo_encaminhados_${companyId}`) || '[]');
          criticosUnificados.forEach(i => {
            list.push({ codigo: i.codigo, descricao: i.descricao, validade: i.validade, data: new Date().toISOString(), user: user?.nome || 'Operador' });
          });
          localStorage.setItem(`despejo_encaminhados_${companyId}`, JSON.stringify(list));
          showToast(`🗑️ Lista completa (${criticosUnificados.length} SKUs) enviada para DESPEJO! Tarefas geradas para os Ajudantes.`, 'success');
          if (onRefresh) onRefresh();
        } finally {
          setIsSubmittingBulk(false);
          setConfirmModal(null);
        }
      }
    });
  };

  const handleEncaminharListaPNC = () => {
    if (criticosUnificados.length === 0) {
      showToast('Nenhum item na lista para encaminhar.', 'info');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Confirmar Encaminhamento para PNC',
      description: `Deseja realmente encaminhar todos os ${criticosUnificados.length} itens críticos (≤ 45 dias) da lista para PRODUTOS NÃO CONFORMES (PNC)? Todos ficarão registrados na Guia Shelf-Life & PNC.`,
      confirmText: 'Sim, Encaminhar PNC',
      variant: 'warning',
      onConfirm: async () => {
        setIsSubmittingBulk(true);
        try {
          criticosUnificados.forEach(i => {
            setTratadosSet(prev => new Set(prev).add(`${i.codigo}_${i.validade}`));
            savePncItem({
              codigo: i.codigo,
              descricao: i.descricao,
              validade: i.validade,
              lote: i.lote,
              quantidade: i.quantidade,
              localizacaoAnterior: `${i.localizacao} (${i.bloco})`,
              dataEntradaPnc: new Date().toISOString().substring(0, 10),
              motivo: 'Recolhimento em Massa via Workstation CCO (Validade Crítica)',
              registradoPor: user?.nome || 'Operador Workstation',
              status: 'Em Quarentena / PNC'
            }, companyId);
          });
          const list = JSON.parse(localStorage.getItem(`pnc_encaminhados_${companyId}`) || '[]');
          criticosUnificados.forEach(i => {
            list.push({ codigo: i.codigo, descricao: i.descricao, validade: i.validade, data: new Date().toISOString(), user: user?.nome || 'Operador' });
          });
          localStorage.setItem(`pnc_encaminhados_${companyId}`, JSON.stringify(list));
          showToast(`⚠️ Lista completa (${criticosUnificados.length} SKUs) registrada na Área de PNC!`, 'success');
          if (onRefresh) onRefresh();
        } finally {
          setIsSubmittingBulk(false);
          setConfirmModal(null);
        }
      }
    });
  };

  const handleSaveQtyUpdate = (itemKey: string, code: string) => {
    const qtyNum = parseInt(editingQtyVal, 10);
    if (isNaN(qtyNum) || qtyNum < 0) {
      showToast('Por favor, informe uma quantidade válida.', 'error');
      return;
    }

    const confName = user?.nome || 'Conferente';
    const nowStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const updated = {
      ...customQuantities,
      [itemKey]: {
        qty: qtyNum,
        updatedAt: nowStr,
        conferente: confName
      }
    };

    setCustomQuantities(updated);
    try {
      localStorage.setItem(`workstation_custom_quantities_${companyId}`, JSON.stringify(updated));
      window.dispatchEvent(new Event('local_data_changed'));
    } catch (e) {
      console.error(e);
    }

    setEditingKey(null);
    setEditingQtyVal('');
    setRecentlyUpdatedKey(itemKey);
    setTimeout(() => setRecentlyUpdatedKey(null), 3000);
    showToast(`✅ Quantidade do SKU ${code} atualizada para ${qtyNum} cx por ${confName}!`, 'success');
  };

  return (
    <div className="bg-white dark:bg-[#111a30] border border-slate-200 dark:border-rose-500/30 rounded-2xl p-5 sm:p-6 space-y-5 shadow-lg dark:shadow-2xl relative">
      
      {/* FLOATING TOAST NOTIFICATION */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-bold transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 border ${
          toastMessage.type === 'success' 
            ? 'bg-emerald-950 text-emerald-200 border-emerald-500/50 shadow-emerald-950/50' 
            : toastMessage.type === 'warning'
            ? 'bg-amber-950 text-amber-200 border-amber-500/50 shadow-amber-950/50'
            : toastMessage.type === 'error'
            ? 'bg-rose-950 text-rose-200 border-rose-500/50 shadow-rose-950/50'
            : 'bg-slate-900 text-slate-100 border-slate-700'
        }`}>
          {toastMessage.type === 'success' && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
          {toastMessage.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
          {toastMessage.type === 'error' && <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />}
          <span>{toastMessage.text}</span>
          <button 
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* NON-BLOCKING CONFIRMATION MODAL */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${
                confirmModal.variant === 'danger' 
                  ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400' 
                  : 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'
              }`}>
                {confirmModal.variant === 'danger' ? <Trash2 className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {confirmModal.title}
              </h3>
            </div>
            
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {confirmModal.description}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isSubmittingBulk}
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSubmittingBulk}
                onClick={() => confirmModal.onConfirm()}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-white flex items-center gap-2 cursor-pointer transition-all shadow-md ${
                  confirmModal.variant === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
                    : 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30'
                } ${isSubmittingBulk ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isSubmittingBulk && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL OFICIAL: ENCAMINHAMENTO PARA PNC & SHELF-LIFE */}
      {pncModalItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0f172a] border border-amber-500/40 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
            
            {/* Header */}
            <div className="bg-linear-to-r from-amber-600 to-amber-700 px-5 py-4 text-white flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <ShieldAlert className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-black uppercase tracking-wider flex items-center gap-2">
                    Encaminhamento para PNC & Shelf-Life
                  </h3>
                  <p className="text-xs text-amber-100 font-medium">
                    Preencha as informações necessárias para registrar na Tabela de PNC e Shelf-Life
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPncModalItem(null)}
                className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content / Form */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
              
              {/* Resumo do Produto */}
              <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-[10px] uppercase font-black tracking-wider text-amber-800 dark:text-amber-400">
                    Produto Selecionado
                  </div>
                  <div className="text-sm font-black text-slate-900 dark:text-white">
                    #{pncModalItem.codigo} - {pncModalItem.descricao}
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-300 font-mono mt-0.5">
                    Lote: <strong>{pncModalItem.lote}</strong> | Validade: <strong>{formatDateToBR(pncModalItem.validade)}</strong> ({pncModalItem.diasParaVencer} dias restantes)
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Estoque Físico</span>
                  <span className="text-sm font-mono font-black text-amber-700 dark:text-amber-400">
                    {pncModalItem.quantidade} cx ({pncModalItem.volumeHl} HL)
                  </span>
                </div>
              </div>

              {/* Grid de Campos Oficiais */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                
                {/* Nº Bloqueio */}
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
                    Nº do Bloqueio *
                  </label>
                  <input
                    type="text"
                    value={pncModalItem.nBloqueio}
                    onChange={e => setPncModalItem({ ...pncModalItem, nBloqueio: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500"
                    placeholder="Ex: BLQ-038291"
                  />
                </div>

                {/* Fábrica / Fornecedor Origem */}
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
                    Fábrica / Origem (Fornecedor) *
                  </label>
                  <input
                    type="text"
                    list="fabricas-list"
                    value={pncModalItem.fabOrigem}
                    onChange={e => setPncModalItem({ ...pncModalItem, fabOrigem: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500"
                    placeholder="Ex: ITAPISSUMA, AGUDOS..."
                  />
                  <datalist id="fabricas-list">
                    {FABRICAS_AMBEV.map(fab => (
                      <option key={fab} value={fab} />
                    ))}
                  </datalist>
                </div>

                {/* NF Saída / Tratativa */}
                <div className="col-span-2">
                  <label className="block text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <FileCheck className="w-3.5 h-3.5 text-emerald-600" /> Nota Fiscal (Saída / Devolução)
                  </label>
                  <input
                    type="text"
                    value={pncModalItem.nfSaida}
                    onChange={e => setPncModalItem({ ...pncModalItem, nfSaida: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500"
                    placeholder="Ex: 489201 (Opcional se ainda não faturada)"
                  />
                </div>

                {/* Quantidade Bloqueada (cx) & Pallets */}
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
                    Quantidade Bloqueada (Caixas) *
                  </label>
                  <input
                    type="number"
                    value={pncModalItem.quantidade}
                    onChange={e => {
                      const q = Number(e.target.value) || 0;
                      const hl = Number((q * pncModalItem.fatorHecto).toFixed(2));
                      const pl = Math.max(1, Math.ceil(q / 72));
                      setPncModalItem({
                        ...pncModalItem,
                        quantidade: q,
                        volumeHl: hl,
                        pallets: pl,
                        valorTotal: q * 85
                      });
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
                    Qtd em Pallets (PLTS) *
                  </label>
                  <input
                    type="number"
                    value={pncModalItem.pallets}
                    onChange={e => setPncModalItem({ ...pncModalItem, pallets: Number(e.target.value) || 1 })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500"
                  />
                </div>

                {/* Motivo do Bloqueio */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
                    Motivo do Bloqueio *
                  </label>
                  <select
                    value={pncModalItem.motivo}
                    onChange={e => setPncModalItem({ ...pncModalItem, motivo: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500"
                  >
                    <option value="VALIDADE CRÍTICA (<30D) - RISCO DE PERDA DPO">VALIDADE CRÍTICA (&lt;30D) - RISCO DE PERDA DPO</option>
                    <option value="AVARIA EM PALETE / DEFORMAÇÃO">AVARIA EM PALETE / DEFORMAÇÃO</option>
                    <option value="LOTE VENCIDO NA ROTA">LOTE VENCIDO NA ROTA</option>
                    <option value="BLOQUEIO QUALIDADE AMBEV / REANÁLISE">BLOQUEIO QUALIDADE AMBEV / REANÁLISE</option>
                    <option value="NÃO CONFORMIDADE DE EMBALAGEM / VAZAMENTO">NÃO CONFORMIDADE DE EMBALAGEM / VAZAMENTO</option>
                    <option value="DESVIO DE TEMPERATURA / ARMAZENAGEM">DESVIO DE TEMPERATURA / ARMAZENAGEM</option>
                  </select>
                </div>

                {/* Ação Proposta & Status */}
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
                    Ação Proposta *
                  </label>
                  <select
                    value={pncModalItem.acao}
                    onChange={e => setPncModalItem({ ...pncModalItem, acao: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500"
                  >
                    <option value="DEVOLUÇÃO ORIGEM">DEVOLUÇÃO ORIGEM</option>
                    <option value="DESPEJO AUTORIZADO">DESPEJO AUTORIZADO</option>
                    <option value="REANÁLISE QUALIDADE">REANÁLISE QUALIDADE</option>
                    <option value="REPACK / SEPARAÇÃO">REPACK / SEPARAÇÃO</option>
                    <option value="QUARENTENA PREVENTIVA">QUARENTENA PREVENTIVA</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
                    Status do Item *
                  </label>
                  <select
                    value={pncModalItem.status}
                    onChange={e => setPncModalItem({ ...pncModalItem, status: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500"
                  >
                    <option value="BLOQUEADO">BLOQUEADO</option>
                    <option value="EM QUARENTENA">EM QUARENTENA</option>
                    <option value="DEVOLUÇÃO ORIGEM">DEVOLUÇÃO ORIGEM (Devolvido)</option>
                    <option value="LIBERADO">LIBERADO</option>
                  </select>
                </div>

                {/* Emissor & Responsável */}
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
                    Emissor (Conferente / CCO)
                  </label>
                  <input
                    type="text"
                    value={pncModalItem.emissor}
                    onChange={e => setPncModalItem({ ...pncModalItem, emissor: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
                    Responsável Acompanhamento
                  </label>
                  <input
                    type="text"
                    value={pncModalItem.responsavel}
                    onChange={e => setPncModalItem({ ...pncModalItem, responsavel: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-amber-500"
                  />
                </div>

                {/* Observações */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
                    Observações Operacionais
                  </label>
                  <textarea
                    rows={2}
                    value={pncModalItem.observacao}
                    onChange={e => setPncModalItem({ ...pncModalItem, observacao: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-amber-500"
                    placeholder="Informações adicionais para a equipe de qualidade e logística..."
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 px-5 py-3.5 flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-500 font-medium">
                Será adicionado instantaneamente às tabelas de PNC e Shelf-Life.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPncModalItem(null)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isSubmittingBulk}
                  onClick={handleConfirmPncModal}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-amber-600/30 transition-all cursor-pointer"
                >
                  {isSubmittingBulk && <Loader2 className="w-4 h-4 animate-spin" />}
                  Confirmar e Enviar para PNC
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QUICK EDIT MODAL DE NOTA FISCAL */}
      {editingNfKey && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" /> Editar Nota Fiscal
              </h3>
              <button
                type="button"
                onClick={() => setEditingNfKey(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nota Fiscal (Saída / Tratativa):
                </label>
                <input
                  type="text"
                  value={editingNfSaidaVal}
                  onChange={e => setEditingNfSaidaVal(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  placeholder="Ex: 489201"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingNfKey(null)}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleSaveNf(editingNfKey)}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-black uppercase tracking-wider"
              >
                Salvar NF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-500/40 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-rose-500" /> Workstation CCO
            </span>
            {activeColetaLabel && (
              <span className="bg-purple-50 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/40 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 font-mono" title="Data da contagem ativa que está alimentando a tabela e os itens críticos">
                📅 Contagem: {activeColetaLabel}
              </span>
            )}
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              Último Recolhimento & Janela de Validade
            </span>
          </div>
          <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            Acompanhamento de Itens em Janela Crítica (≤ 45 Dias)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Monitoramento unificado de produtos com validade na janela crítica (≤ 45 dias) identificados na coleta de pátio. Conferente pode notificar saldo físico atualizado.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Botão de Exportar Histórico de Escoamento */}
          <button
            type="button"
            onClick={handleExportarHistorico}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/25"
            title="Exportar planilha Excel do histórico completo de escoamento (Itens Vendidos e Pendentes)"
          >
            <FileText className="w-4 h-4" />
            Exportar Histórico
          </button>

          {/* Botão para abrir o seletor de validades recolhidas */}
          {onOpenSelectValidades && (
            <button
              type="button"
              onClick={onOpenSelectValidades}
              className="px-3.5 py-2 bg-[#032b5e] hover:bg-[#021f44] text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1.5 shadow-md shadow-[#032b5e]/25"
              title="Filtrar quais validades recolhidas aparecem na gestão de escoamento"
            >
              <Calendar className="w-4 h-4" />
              Selecionar Validades {selectedKeysCount !== undefined ? `(${selectedKeysCount})` : ''}
            </button>
          )}

          <button
            type="button"
            disabled={isSubmittingBulk}
            onClick={handleEncaminharListaDespejo}
            className={`px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1.5 shadow-md shadow-rose-600/25 ${
              isSubmittingBulk ? 'opacity-60 cursor-not-allowed' : ''
            }`}
            title="Encaminhar toda a lista para o Setor de Despejo"
          >
            {isSubmittingBulk ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Encaminhar p/ Despejo
          </button>
          <button
            type="button"
            disabled={isSubmittingBulk}
            onClick={handleEncaminharListaPNC}
            className={`px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1.5 shadow-md shadow-amber-600/25 ${
              isSubmittingBulk ? 'opacity-60 cursor-not-allowed' : ''
            }`}
            title="Encaminhar toda a lista para Produtos Não Conformes (PNC)"
          >
            {isSubmittingBulk ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
            Encaminhar p/ PNC
          </button>
        </div>
      </div>

      {/* BANNER DE SELEÇÃO ATIVA DE VALIDADES / COLETAS */}
      {selectedKeysCount !== undefined && totalValidadesCount !== undefined && selectedKeysCount < totalValidadesCount && (
        <div className="bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 p-3 rounded-xl flex items-center justify-between text-xs font-bold text-sky-900 dark:text-sky-200">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-sky-600 shrink-0" />
            <span>Filtro de Validade Ativo: Exibindo <strong>{selectedKeysCount}</strong> de <strong>{totalValidadesCount}</strong> lotes recolhidos.</span>
          </div>
          {onOpenSelectValidades && (
            <button
              type="button"
              onClick={onOpenSelectValidades}
              className="text-[11px] font-black uppercase underline hover:text-sky-700 cursor-pointer ml-2"
            >
              Alterar Validades
            </button>
          )}
        </div>
      )}

      {/* KPI METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white dark:bg-slate-900 border-2 border-red-200 dark:border-red-900/60 p-4 rounded-xl flex items-center justify-between shadow-sm hover:shadow-md transition-all">
          <div>
            <span className="text-[10px] text-red-700 dark:text-red-400 font-black uppercase tracking-wider block">SKUs na Janela (≤45d)</span>
            <strong className="text-2xl text-red-600 dark:text-red-400 font-black">{totalSkusCriticos}</strong>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block mt-0.5">janela crítica total</span>
          </div>
          <div className="p-3 bg-red-600 text-white rounded-xl shadow-xs">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border-2 border-amber-200 dark:border-amber-900/60 p-4 rounded-xl flex items-center justify-between shadow-sm hover:shadow-md transition-all">
          <div>
            <span className="text-[10px] text-amber-800 dark:text-amber-400 font-black uppercase tracking-wider block">Volume Em Risco (Pendentes)</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <strong className="text-2xl text-amber-600 dark:text-amber-400 font-black">{totalCaixasRisco.toLocaleString('pt-BR')} cx</strong>
              <span className="text-xs text-sky-700 dark:text-sky-400 font-bold font-mono">({totalHlRisco.toFixed(1)} HL)</span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block mt-0.5">{totalPendentes} itens aguardando venda</span>
          </div>
          <div className="p-3 bg-amber-500 text-slate-950 rounded-xl shadow-xs">
            <Box className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border-2 border-emerald-200 dark:border-emerald-900/60 p-4 rounded-xl flex items-center justify-between shadow-sm hover:shadow-md transition-all">
          <div>
            <span className="text-[10px] text-emerald-800 dark:text-emerald-400 font-black uppercase tracking-wider block">Valoração em Risco</span>
            <strong className="text-2xl text-emerald-600 dark:text-emerald-400 font-black">R$ {valorTotalRisco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block mt-0.5">total pendente de escoamento</span>
          </div>
          <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-xs">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border-2 border-sky-200 dark:border-sky-900/60 p-4 rounded-xl flex items-center justify-between shadow-sm hover:shadow-md transition-all">
          <div>
            <span className="text-[10px] text-sky-800 dark:text-sky-400 font-black uppercase tracking-wider block">Status do Escoamento</span>
            <strong className="text-2xl text-[#1e56f0] dark:text-sky-400 font-black">{totalVendidos} / {totalSkusCriticos}</strong>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block mt-0.5">
              {totalVendidos} vendidos • {totalPendentes} pendentes
            </span>
          </div>
          <div className="p-3 bg-[#1e56f0] text-white rounded-xl shadow-xs">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* FILTERS & VIEW MODE TOOLBAR */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-100/90 dark:bg-slate-900 p-3 rounded-xl border border-slate-300/80 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 flex-1">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por código ou produto..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-[#111a30] border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 pl-9 pr-3 py-2 rounded-lg focus:outline-none focus:border-[#1e56f0] shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Filter Tabs (Pendentes, Vendidos, Todos) */}
            <div className="flex items-center bg-white dark:bg-[#111a30] border border-slate-300 dark:border-slate-700 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setStatusActionFilter('pendente')}
                className={`px-3 py-1.5 rounded-md text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusActionFilter === 'pendente'
                    ? 'bg-amber-500 text-slate-950 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Exibir apenas itens pendentes (ao clicar em Pendente o item vira Vendido e some desta visão)"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Pendentes ({totalPendentes})</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusActionFilter('vendido')}
                className={`px-3 py-1.5 rounded-md text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusActionFilter === 'vendido'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Exibir itens já vendidos / escoados"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Vendidos ({totalVendidos})</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusActionFilter('todos')}
                className={`px-3 py-1.5 rounded-md text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                  statusActionFilter === 'todos'
                    ? 'bg-[#1e56f0] text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Exibir todos os itens (histórico geral com status)"
              >
                <span>Todos ({totalSkusCriticos})</span>
              </button>
            </div>

            {/* Local Filter */}
            <select
              value={localFilter}
              onChange={e => setLocalFilter(e.target.value)}
              className="bg-white dark:bg-[#111a30] border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-200 font-bold rounded-lg px-3 py-2 outline-none shadow-2xs cursor-pointer"
            >
              <option value="todos">📍 Todos os Locais</option>
              <option value="central">Central</option>
              <option value="picking">Picking</option>
              <option value="pnc">PNC / Bloqueado</option>
            </select>
          </div>
        </div>

        {/* View Mode Toggle & Counter */}
        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200 dark:border-slate-800">
          <span className="text-[11px] text-slate-600 dark:text-slate-400 font-mono font-bold whitespace-nowrap">
            {filteredList.length} itens
          </span>

          <div className="flex items-center bg-white dark:bg-[#111a30] border border-slate-300 dark:border-slate-700 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1.5 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-[#1e56f0] text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Exibir em cards (recomendado para celular)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1.5 rounded-md text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-[#1e56f0] text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Exibir em formato de tabela"
            >
              <List className="w-3.5 h-3.5" />
              <span>Tabela</span>
            </button>
          </div>
        </div>
      </div>

      {/* EMPTY STATE */}
      {filteredList.length === 0 && (
        <div className="py-12 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b1222] text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <p className="text-sm text-slate-800 dark:text-slate-200 font-bold">
            {criticosUnificados.length === 0 
              ? "Nenhum item na janela crítica (≤45 dias) encontrado no recolhimento!"
              : "Nenhum item encontrado com os filtros selecionados."
            }
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {criticosUnificados.length === 0 
              ? "Todos os lotes possuem cobertura superior a 45 dias para a data de corte."
              : "Tente limpar os filtros de busca ou alterar a localização."
            }
          </p>
        </div>
      )}

      {/* 1. RESPONSIVE CARDS VIEW (Mobile-friendly & Desktop grid) */}
      {filteredList.length > 0 && viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredList.map((item, idx) => {
            const itemKey = `${item.codigo}_${item.validade}`;
            const isVendido = !!vendidosMap[itemKey];
            const isTratado = isVendido;
            const isEditing = editingKey === itemKey;
            const isActionLoading = submittingActionKey === itemKey;
            const isJustUpdated = recentlyUpdatedKey === itemKey;
            const volumeHlStr = (item as any).volumeHl ? (item as any).volumeHl.toFixed(2) : (item.quantidade * 0.072).toFixed(2);
            const vendaMediaVal = (item as any).vendaMedia || Math.max(5, Math.round(item.quantidade / 6));
            const diasEstoqueVal = (item as any).diasEstoque || (item.quantidade / vendaMediaVal).toFixed(1);

            return (
              <div
                key={`card_${itemKey}_${idx}`}
                className={`rounded-2xl border-2 transition-all duration-200 p-4 flex flex-col justify-between gap-3.5 shadow-sm hover:shadow-md ${
                  isJustUpdated
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 ring-2 ring-emerald-500 border-emerald-500'
                    : isVendido
                    ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60'
                    : item.diasParaVencer <= 30
                    ? 'bg-white dark:bg-slate-900 border-red-300 dark:border-red-900/80 hover:border-red-500'
                    : 'bg-white dark:bg-slate-900 border-amber-300 dark:border-amber-900/80 hover:border-amber-500'
                }`}
              >
                {/* CARD HEADER */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider shadow-2xs ${
                      item.diasParaVencer <= 30 
                        ? 'bg-red-600 text-white' 
                        : 'bg-amber-500 text-slate-950 font-black'
                    }`}>
                      {item.diasParaVencer <= 30 ? 'CRÍTICO (≤30D)' : 'ALERTA (31-45D)'}
                    </span>

                    <span className="font-mono text-xs font-black px-2.5 py-1 bg-slate-900 text-amber-300 dark:bg-slate-800 dark:text-amber-300 rounded-md shadow-2xs">
                      #{item.codigo}
                    </span>

                    <span className="text-[10px] font-bold px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      {item.localizacao} {item.bloco ? `(${item.bloco})` : ''}
                    </span>
                  </div>

                  {/* BOTÃO DE STATUS PENDENTE / VENDIDO */}
                  {isVendido ? (
                    <button
                      type="button"
                      onClick={() => handleReverterParaPendente(itemKey, item.descricao)}
                      className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 border shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600"
                      title="Item marcado como VENDIDO. Clique se desejar reverter para PENDENTE"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>VENDIDO</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleMarcarComoVendido(item)}
                      className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 border shadow-sm bg-amber-400 hover:bg-amber-500 text-slate-950 border-amber-500 font-extrabold"
                      title="Clique para marcar como VENDIDO (o item sairá imediatamente da gestão de pendentes)"
                    >
                      <Clock className="w-3.5 h-3.5 text-slate-950" />
                      <span>PENDENTE</span>
                    </button>
                  )}
                </div>

                {/* PRODUCT TITLE */}
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white leading-snug tracking-tight">
                    {item.descricao}
                  </h4>
                  {item.lote && (
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono mt-1 font-semibold block">
                      Lote: {item.lote}
                    </span>
                  )}
                </div>

                {/* NOTA FISCAL (SAÍDA / TRATATIVA) BADGE */}
                {(() => {
                  const nfs = customNfs[itemKey] || {};
                  const nfSaidaDisplay = nfs.nfSaida || (item as any).nfSaida || (item as any).nf || '-';

                  return (
                    <div className="flex flex-wrap items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-xl bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 text-[10px]">
                      <div className="flex items-center gap-1.5 font-mono font-bold text-slate-700 dark:text-slate-300">
                        <FileText className="w-3.5 h-3.5 text-[#1e56f0] shrink-0" />
                        <span>NF: <strong className="text-slate-900 dark:text-white font-black">{nfSaidaDisplay}</strong></span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingNfKey(itemKey);
                          setEditingNfSaidaVal(nfSaidaDisplay === '-' ? '' : nfSaidaDisplay);
                        }}
                        className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 rounded-md cursor-pointer transition-colors ml-0.5"
                        title="Editar Nota Fiscal"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })()}

                {/* KEY DATA METRICS (2-COLUMN GRID WITH CRISP HIGH CONTRAST) */}
                <div className="grid grid-cols-2 gap-2 bg-slate-100/90 dark:bg-slate-950/80 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  {/* Vencimento & Dias */}
                  <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-0.5">
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-wider flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" /> Vencimento
                    </span>
                    <div className="font-mono font-black text-slate-900 dark:text-white text-xs">
                      {formatDateToBR(item.validade)}
                    </div>
                    <div>
                      <span className={`text-[10px] font-mono font-black px-1.5 py-0.5 rounded inline-block ${
                        item.diasParaVencer <= 30 
                          ? 'text-red-700 bg-red-100 dark:bg-red-950/80 dark:text-red-300' 
                          : 'text-amber-800 bg-amber-100 dark:bg-amber-950/80 dark:text-amber-300'
                      }`}>
                        {item.diasParaVencer} dias restantes
                      </span>
                    </div>
                  </div>

                  {/* Quantidade & Volume */}
                  <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-0.5">
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-wider flex items-center gap-1">
                      <Box className="w-3 h-3 text-slate-500" /> Qtd em Risco
                    </span>
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={editingQtyVal}
                          onChange={e => setEditingQtyVal(e.target.value)}
                          className="w-14 bg-slate-50 dark:bg-slate-900 border border-amber-500 text-slate-900 dark:text-white font-mono font-bold text-center text-xs py-0.5 rounded outline-none"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveQtyUpdate(itemKey, item.codigo)}
                          className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold"
                          title="Salvar quantidade"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingKey(null)}
                          className="p-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-[10px]"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="font-mono font-black text-amber-700 dark:text-amber-400 text-xs">
                          {item.quantidade} cx <span className="text-[10px] text-sky-700 dark:text-sky-400 font-bold">({volumeHlStr} HL)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingKey(itemKey);
                            setEditingQtyVal(String(item.quantidade));
                          }}
                          className="p-1 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded transition-colors cursor-pointer"
                          title="Editar quantidade física"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    <div className="text-[9px] text-slate-600 dark:text-slate-400 font-mono font-semibold">
                      {diasEstoqueVal}d de cobertura
                    </div>
                  </div>

                  {/* Venda Média */}
                  <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-0.5">
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-wider flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-slate-500" /> Venda Média
                      {(item as any).isFrom030519 && (
                        <span className="text-[8px] bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 px-1 py-0.2 rounded font-bold">
                          03.05.19
                        </span>
                      )}
                    </span>
                    <div className="font-mono font-black text-slate-900 dark:text-slate-100 text-xs">
                      {vendaMediaVal} <span className="text-[9px] text-slate-500 font-normal">cx/dia</span>
                    </div>
                  </div>

                  {/* Valoração */}
                  <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-0.5">
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-wider flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-slate-500" /> Valoração
                    </span>
                    <div className="font-mono font-black text-emerald-700 dark:text-emerald-400 text-xs">
                      R$ {item.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                {item.qtdAtualizadaLog && (
                  <span className="text-[9px] text-emerald-700 dark:text-emerald-400 font-bold">
                    ✓ Aferido às {item.qtdAtualizadaLog.updatedAt} por {item.qtdAtualizadaLog.conferente}
                  </span>
                )}

                {/* CARD ACTIONS */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingKey(itemKey);
                      setEditingQtyVal(String(item.quantidade));
                    }}
                    className="flex-1 py-2 px-2 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 dark:bg-indigo-950/40 dark:hover:bg-indigo-600 dark:text-indigo-300 dark:hover:text-white rounded-lg text-[10px] font-black uppercase tracking-wider border border-indigo-200 dark:border-indigo-800/80 transition-all cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                  >
                    <Edit2 className="w-3 h-3" /> Qtd
                  </button>

                  <button
                    type="button"
                    disabled={isActionLoading}
                    onClick={() => handleEncaminharDespejo(item.codigo, item.descricao, item.validade)}
                    className={`flex-1 py-2 px-2 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 dark:bg-rose-950/40 dark:hover:bg-rose-600 dark:text-rose-300 dark:hover:text-white rounded-lg text-[10px] font-black uppercase tracking-wider border border-rose-200 dark:border-rose-800/80 transition-all cursor-pointer flex items-center justify-center gap-1 shadow-2xs ${
                      isActionLoading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isActionLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                    Despejo
                  </button>

                  <button
                    type="button"
                    disabled={isActionLoading}
                    onClick={() => handleEncaminharPNC(item.codigo, item.descricao, item.validade)}
                    className={`flex-1 py-2 px-2 bg-amber-50 hover:bg-amber-600 hover:text-white text-amber-900 dark:bg-amber-950/40 dark:hover:bg-amber-600 dark:text-amber-300 dark:hover:text-white rounded-lg text-[10px] font-black uppercase tracking-wider border border-amber-200 dark:border-amber-800/80 transition-all cursor-pointer flex items-center justify-center gap-1 shadow-2xs ${
                      isActionLoading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isActionLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldAlert className="w-3 h-3" />}
                    PNC
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. DESKTOP / TABLE VIEW (With horizontal touch scrolling) */}
      {filteredList.length > 0 && viewMode === 'table' && (
        <div className="relative">
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b1222] shadow-xs">
            <table className="w-full text-center border-collapse min-w-[850px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#111a30] border-b border-slate-200 dark:border-slate-800 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-3 text-center">Farol</th>
                  <th className="py-3 px-3 text-center">Código</th>
                  <th className="py-3 px-4 text-center">Produto / Descrição</th>
                  <th className="py-3 px-3 text-center">Nota Fiscal (Ent / Saí)</th>
                  <th className="py-3 px-3 text-center">Qtd Total (cx / HL)</th>
                  <th className="py-3 px-3 text-center">Venda Média (cx/dia)</th>
                  <th className="py-3 px-3 text-center">Vencimento</th>
                  <th className="py-3 px-3 text-center">Dias p/ Vencer & Cobertura</th>
                  <th className="py-3 px-3 text-center">Setor / Origem</th>
                  <th className="py-3 px-3 text-center">Valoração R$</th>
                  <th className="py-3 px-4 text-center">Ações Workstation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs text-center">
                {filteredList.map((item, idx) => {
                  const itemKey = `${item.codigo}_${item.validade}`;
                  const isTratado = tratadosSet.has(itemKey);
                  const isVendido = !!vendidosMap[itemKey];
                  const isEditing = editingKey === itemKey;
                  const isActionLoading = submittingActionKey === itemKey;
                  const isJustUpdated = recentlyUpdatedKey === itemKey;
                  const volumeHlStr = (item as any).volumeHl ? (item as any).volumeHl.toFixed(2) : (item.quantidade * 0.072).toFixed(2);
                  const vendaMediaVal = (item as any).vendaMedia || Math.max(5, Math.round(item.quantidade / 6));
                  const diasEstoqueVal = (item as any).diasEstoque || (item.quantidade / vendaMediaVal).toFixed(1);
                  const nfs = customNfs[itemKey] || {};
                  const nfEntradaDisplay = nfs.nfEntrada || (item as any).nfEntrada || (item as any).nf || '1083968';
                  const nfSaidaDisplay = nfs.nfSaida || (item as any).nfSaida || '-';

                  return (
                    <tr 
                      key={`${itemKey}_${idx}`} 
                      className={`transition-all duration-300 ${
                        isJustUpdated
                          ? 'bg-emerald-100/90 dark:bg-emerald-900/50 ring-2 ring-emerald-500'
                          : isTratado 
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-slate-500 dark:text-slate-400 opacity-75' 
                          : item.diasParaVencer <= 30
                          ? 'bg-rose-50/80 dark:bg-rose-950/20 hover:bg-rose-100/80 dark:hover:bg-rose-900/30 text-slate-900 dark:text-white font-semibold'
                          : 'bg-amber-50/80 dark:bg-amber-950/20 hover:bg-amber-100/80 dark:hover:bg-amber-900/30 text-slate-900 dark:text-white font-semibold'
                      }`}
                    >
                      {/* FAROL */}
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider shadow-2xs ${
                          item.diasParaVencer <= 30 
                            ? 'bg-red-600 text-white' 
                            : 'bg-amber-500 text-slate-950 font-black'
                        }`}>
                          {item.diasParaVencer <= 30 ? 'CRÍTICO (≤30D)' : 'ALERTA (31-45D)'}
                        </span>
                      </td>

                      {/* CÓDIGO */}
                      <td className="py-3 px-3 text-center font-mono font-black text-slate-900 dark:text-slate-100">
                        #{item.codigo}
                      </td>

                      {/* PRODUTO */}
                      <td className="py-3 px-4 text-center font-black text-slate-900 dark:text-white">
                        <span className="truncate max-w-[240px] mx-auto block" title={item.descricao}>
                          {item.descricao}
                        </span>
                      </td>

                      {/* NOTA FISCAL */}
                      <td className="py-3 px-3 text-center font-mono">
                        <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          <span>{nfSaidaDisplay}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingNfKey(itemKey);
                              setEditingNfSaidaVal(nfSaidaDisplay === '-' ? '' : nfSaidaDisplay);
                            }}
                            className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                            title="Editar NF"
                          >
                            <Edit2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </td>

                      {/* QUANTIDADE UNIFICADA (CX & HL) */}
                      <td className="py-3 px-3 text-center font-black">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              value={editingQtyVal}
                              onChange={e => setEditingQtyVal(e.target.value)}
                              className="w-16 bg-white dark:bg-slate-900 border border-amber-500 text-slate-900 dark:text-white font-mono font-bold text-center text-xs py-0.5 rounded outline-none"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveQtyUpdate(itemKey, item.codigo)}
                              className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-black uppercase transition-colors flex items-center gap-1 cursor-pointer"
                              title="Salvar e notificar quantidade atualizada no workstation"
                            >
                              <Check className="w-3 h-3" /> Notificar
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingKey(null)}
                              className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded text-[10px] cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center">
                            <div className="flex items-center gap-1.5">
                              <span className="text-amber-700 dark:text-amber-400 font-mono text-sm font-black">{item.quantidade}</span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">cx</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingKey(itemKey);
                                  setEditingQtyVal(String(item.quantidade));
                                }}
                                className="p-1 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded transition-colors cursor-pointer"
                                title="Conferente: Notificar quantidade física atualizada do item no workstation"
                              >
                                ✏️
                              </button>
                            </div>
                            <span className="text-[10px] text-[#1e56f0] dark:text-sky-400 font-mono font-bold">
                              {volumeHlStr} HL
                            </span>
                          </div>
                        )}
                        {item.qtdAtualizadaLog && (
                          <span className="block text-[9px] text-emerald-600 dark:text-emerald-400 font-normal font-sans">
                            Aferido às {item.qtdAtualizadaLog.updatedAt} por {item.qtdAtualizadaLog.conferente}
                          </span>
                        )}
                      </td>

                      {/* VENDA MÉDIA DIÁRIA */}
                      <td className="py-3 px-3 text-center font-mono">
                        <span className="text-slate-900 dark:text-white font-bold text-sm block">{vendaMediaVal}</span>
                        <div className="flex items-center justify-center gap-1 mt-0.5">
                          <span className="text-[9px] text-slate-500 dark:text-slate-400 uppercase">cx / dia</span>
                          {(item as any).isFrom030519 && (
                            <span className="text-[8px] bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 px-1 py-0.2 rounded font-bold">
                              03.05.19
                            </span>
                          )}
                        </div>
                      </td>

                      {/* VENCIMENTO */}
                      <td className="py-3 px-3 text-center font-mono font-extrabold text-slate-800 dark:text-slate-200">
                        {formatDateToBR(item.validade)}
                      </td>

                      {/* DIAS RESTANTES & DIAS DE ESTOQUE */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex flex-col items-center">
                          <span className={`font-mono font-black text-sm ${item.diasParaVencer <= 30 ? 'text-rose-600 dark:text-rose-400' : 'text-amber-700 dark:text-amber-400'}`}>
                            {item.diasParaVencer} dias
                          </span>
                          <span className="text-[10px] text-slate-600 dark:text-slate-300 font-mono font-semibold">
                            ({diasEstoqueVal}d cobertura)
                          </span>
                        </div>
                      </td>

                      {/* SETOR */}
                      <td className="py-3 px-3 text-center">
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase inline-block border border-slate-200 dark:border-slate-700">
                          {item.localizacao} {item.bloco ? `(${item.bloco})` : ''}
                        </span>
                      </td>

                      {/* VALORAÇÃO */}
                      <td className="py-3 px-3 text-center font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        R$ {item.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>

                      {/* AÇÕES WORKSTATION */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingKey(itemKey);
                              setEditingQtyVal(String(item.quantidade));
                            }}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-600 dark:bg-indigo-950/40 dark:hover:bg-indigo-600 text-indigo-700 dark:text-indigo-300 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-wider border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                            title="Conferente: Notificar quantidade física atualizada deste item no workstation"
                          >
                            <Edit2 className="w-3 h-3" /> Qtd
                          </button>

                          <button
                            type="button"
                            disabled={isActionLoading}
                            onClick={() => handleEncaminharDespejo(item.codigo, item.descricao, item.validade)}
                            className={`px-2.5 py-1 bg-rose-50 hover:bg-rose-600 dark:bg-rose-950/40 dark:hover:bg-rose-600 text-rose-700 dark:text-rose-300 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-wider border border-rose-200 dark:border-rose-800 transition-all cursor-pointer flex items-center gap-1 shadow-2xs ${
                              isActionLoading ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            title="Encaminhar este item para o Setor de Despejo"
                          >
                            {isActionLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                            Despejo
                          </button>

                          <button
                            type="button"
                            disabled={isActionLoading}
                            onClick={() => handleEncaminharPNC(item.codigo, item.descricao, item.validade)}
                            className={`px-2.5 py-1 bg-amber-50 hover:bg-amber-600 dark:bg-amber-950/40 dark:hover:bg-amber-600 text-amber-900 dark:text-amber-300 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-wider border border-amber-200 dark:border-amber-800 transition-all cursor-pointer flex items-center gap-1 shadow-2xs ${
                              isActionLoading ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            title="Encaminhar este item para Produtos Não Conformes (PNC)"
                          >
                            {isActionLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldAlert className="w-3 h-3" />}
                            PNC
                          </button>

                          {isVendido ? (
                            <button
                              type="button"
                              onClick={() => handleReverterParaPendente(itemKey, item.descricao)}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 border shadow-2xs bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600"
                              title="Item marcado como VENDIDO. Clique se desejar reverter para PENDENTE"
                            >
                              <CheckCircle2 className="w-3 h-3" /> Vendido
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleMarcarComoVendido(item)}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 border shadow-2xs bg-amber-400 hover:bg-amber-500 text-slate-950 border-amber-500"
                              title="Clique para marcar este item como VENDIDO (ele sumirá da gestão de pendentes)"
                            >
                              <Clock className="w-3 h-3 text-slate-950" /> Pendente
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-slate-400 text-center mt-1.5 md:hidden">
            👉 Deslize horizontalmente para ver todas as colunas da tabela
          </p>
        </div>
      )}
    </div>
  );
});
