import React, { useState, useEffect, useMemo } from 'react';
import { Usuario, Empresa, ValidadeRow } from '../types';
import { 
  PncItem, 
  DespejoTask,
  ShelfItem,
  getStoredPncItems, 
  savePncItem, 
  updatePncItemDate, 
  updatePncEscoamento,
  syncPncFromValidadesList,
  syncPncFromAllYearlyColetas,
  enviarPncParaDespejo, 
  removerPncItem, 
  getStoredDespejoTasks,
  concluirDespejoTask,
  saveDespejoTask,
  getStoredShelfItems,
  saveShelfItem,
  removerShelfItem,
  updateShelfDespejoStatus,
  resetShelfToOfficialItems,
  getProductConversionData
} from '../utils/pncManager';
import { PRODUCTS } from '../planosData';
import { PRODUCT_MASTER_DATA } from '../data/productMasterData';
import { calcularTotalCaixas } from '../data/coletaPackagingData';
import { ShelfLifeCharts } from './ShelfLifeCharts';
import { NewShelfItemModal, ImportShelfBulkModal, ImportPncBulkModal } from './ShelfLifePncModals';
import { GestaoPncPlatform } from './GestaoPncPlatform';
import { getStoredPncRecords } from '../utils/gestaoPncManager';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { 
  ShieldAlert, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  Trash2, 
  CheckCircle2, 
  Plus, 
  Search, 
  Filter, 
  FileSpreadsheet, 
  FileText, 
  Edit2, 
  RefreshCw, 
  ArrowRight, 
  Layers, 
  DollarSign, 
  Truck, 
  Box, 
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Sparkles,
  ExternalLink,
  ChevronRight,
  UserCheck,
  Flame,
  Zap,
  Check,
  CheckSquare,
  History,
  XCircle,
  ArrowDownRight,
  CornerDownRight,
  PackageX,
  Gauge,
  BarChart3,
  Table as TableIcon,
  RotateCcw,
  Upload
} from 'lucide-react';

interface ShelfLifePncTabProps {
  user: Usuario;
  empresa: Empresa | null;
  validadesList?: ValidadeRow[];
  initialSubTab?: PncSubTab;
  onRefresh?: () => void;
  onNavigateToDespejo?: () => void;
}

type PncSubTab = 'pnc' | 'shelf' | 'aderencia';

export const ShelfLifePncTab: React.FC<ShelfLifePncTabProps> = ({
  user,
  empresa,
  validadesList = [],
  initialSubTab,
  onRefresh,
  onNavigateToDespejo
}) => {
  const empresaId = empresa?.id || 'demo';
  const todayISO = new Date().toISOString().substring(0, 10);

  // Subtab navigation: 1. PNC (Quarentena/Escoamento), 2. Shelf (Vencidos), 3. Aderência ao Despejo
  const [activeSubTab, setActiveSubTab] = useState<PncSubTab>(initialSubTab || 'pnc');

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // State for items & tasks
  const [pncItems, setPncItems] = useState<PncItem[]>(() => getStoredPncItems(empresaId));
  const [shelfItems, setShelfItems] = useState<ShelfItem[]>(() => getStoredShelfItems(empresaId));
  const [despejoTasks, setDespejoTasks] = useState<DespejoTask[]>(() => getStoredDespejoTasks(empresaId));

  // View Mode for Shelf tab: 'ambos' | 'tabela' | 'graficos'
  const [shelfViewMode, setShelfViewMode] = useState<'ambos' | 'tabela' | 'graficos'>('ambos');

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisco30d, setFilterRisco30d] = useState<'todos' | 'critico_30d' | 'atencao_30d' | 'ok_30d'>('todos');
  const [filterValidade, setFilterValidade] = useState<'todos' | 'vencidos' | 'critico_15d' | 'atencao_30d'>('todos');
  const [filterCurva, setFilterCurva] = useState<'todos' | 'A' | 'B' | 'C'>('todos');
  const [filterOrigemShelf, setFilterOrigemShelf] = useState<'todos' | 'vencido_armazem' | 'excedeu_30d_pnc'>('todos');
  const [filterStatusDespejo, setFilterStatusDespejo] = useState<'todos' | 'Pendente' | 'Concluído'>('todos');
  
  // Date & 30d Filters
  const [filterDataInicio, setFilterDataInicio] = useState<string>('');
  const [filterDataFim, setFilterDataFim] = useState<string>('');
  const [filterPeriodo, setFilterPeriodo] = useState<'todos' | 'ano_2026' | 'ultimos_30d' | 'personalizado'>('todos');
  const [filterApenas30dValidade, setFilterApenas30dValidade] = useState<boolean>(false);

  // Modal: Edit Date of Entry in PNC
  const [editingItem, setEditingItem] = useState<PncItem | null>(null);
  const [inputDatePnc, setInputDatePnc] = useState<string>('');
  const [inputMotivoPnc, setInputMotivoPnc] = useState<string>('');
  const [inputObsPnc, setInputObsPnc] = useState<string>('');

  // Count from official PNC JSON base
  const pncOfficialCount = useMemo(() => {
    try {
      return getStoredPncRecords(empresaId).length;
    } catch {
      return 0;
    }
  }, [empresaId]);

  // Modal: Escoamento Action
  const [escoamentoItem, setEscoamentoItem] = useState<PncItem | null>(null);
  const [selectedTratativa, setSelectedTratativa] = useState<'Venda Acelerada' | 'Repack' | 'Devolução Fábrica' | 'Reclassificação' | 'Despejo' | 'Pendente'>('Venda Acelerada');
  const [selectedStatusEscoamento, setSelectedStatusEscoamento] = useState<'Em Quarentena' | 'Em Negociação' | 'Em Separação' | 'Aguardando Laudo' | 'Concluído'>('Em Negociação');
  const [inputAcaoEscoamento, setInputAcaoEscoamento] = useState<string>('');

  // Modals for manual addition & bulk import
  const [showNewPncModal, setShowNewPncModal] = useState<boolean>(false);
  const [showImportPncModal, setShowImportPncModal] = useState<boolean>(false);
  const [showNewShelfModal, setShowNewShelfModal] = useState<boolean>(false);
  const [showImportShelfModal, setShowImportShelfModal] = useState<boolean>(false);

  const [newSkuCodigo, setNewSkuCodigo] = useState<string>('');
  const [newSkuDescricao, setNewSkuDescricao] = useState<string>('');
  const [newLote, setNewLote] = useState<string>('');
  const [newValidade, setNewValidade] = useState<string>('');
  const [newQuantidade, setNewQuantidade] = useState<number | ''>('');
  const [newDataEntrada, setNewDataEntrada] = useState<string>(todayISO);
  const [newLocalOrigem, setNewLocalOrigem] = useState<string>('Armazém Central');
  const [newMotivo, setNewMotivo] = useState<string>('Validade Crítica (≤ 30d)');
  const [newTratativa, setNewTratativa] = useState<'Venda Acelerada' | 'Repack' | 'Devolução Fábrica' | 'Reclassificação' | 'Despejo'>('Venda Acelerada');
  const [newObs, setNewObs] = useState<string>('');

  // Modal: Manual Despejo Completion by Manager
  const [completingTask, setCompletingTask] = useState<DespejoTask | null>(null);
  const [managerExecutanteName, setManagerExecutanteName] = useState<string>(user?.nome || 'Ajudante Armazém');

  // Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'warning' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'warning' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Sync listener
  const refreshLocalData = () => {
    setPncItems(getStoredPncItems(empresaId));
    setShelfItems(getStoredShelfItems(empresaId));
    setDespejoTasks(getStoredDespejoTasks(empresaId));
  };

  useEffect(() => {
    // Sincronização retroativa automática do ano
    try {
      syncPncFromAllYearlyColetas(empresaId);
    } catch (_) {}
    refreshLocalData();
    window.addEventListener('pnc_updated', refreshLocalData);
    window.addEventListener('shelf_updated', refreshLocalData);
    window.addEventListener('despejo_tasks_updated', refreshLocalData);
    window.addEventListener('local_data_changed', refreshLocalData);
    return () => {
      window.removeEventListener('pnc_updated', refreshLocalData);
      window.removeEventListener('shelf_updated', refreshLocalData);
      window.removeEventListener('despejo_tasks_updated', refreshLocalData);
      window.removeEventListener('local_data_changed', refreshLocalData);
    };
  }, [empresaId]);

  // Handle SKU selection in new PNC modal
  const handleSelectProduct = (cod: string) => {
    setNewSkuCodigo(cod);
    const prod = PRODUCTS.find(p => String(p.codigo) === cod) || 
                 PRODUCT_MASTER_DATA.find(p => String((p as any).sku || (p as any).codigo) === cod);
    if (prod) {
      setNewSkuDescricao(prod.descricao || '');
    }
  };

  // Sincronizar com produtos recolhidos nas últimas validades
  const handleSyncValidades = () => {
    if (!validadesList || validadesList.length === 0) {
      showToast('Nenhum dado de coleta de validades disponível para sincronização.', 'warning');
      return;
    }

    const { addedCount, updatedCount } = syncPncFromValidadesList(validadesList, empresaId, false);
    showToast(`✅ Sincronização concluída: ${addedCount} novos itens adicionados e ${updatedCount} atualizados a partir das últimas validades recolhidas.`, 'success');
    refreshLocalData();
    if (onRefresh) onRefresh();
  };

  // Sincronizar todas as validades recolhidas de todos os meses do ano (Retroativo)
  const handleSyncAllYearlyValidades = () => {
    const { addedCount, totalPnc } = syncPncFromAllYearlyColetas(empresaId);
    showToast(`⚡ Auditoria Retroativa concluída: ${addedCount} novos lotes com < 30 dias de validade inseridos no PNC (Total no PNC: ${totalPnc} itens).`, 'success');
    refreshLocalData();
    if (onRefresh) onRefresh();
  };

  // -------------------------------------------------------------
  // CLASSIFICAÇÃO: PNC x SHELF
  // Regra DPO Ambev:
  // 1. PNC: Itens em quarentena / escoamento com menos de 30 dias de permanência (diasEmPnc < 30) e que NÃO estejam com data vencida (diasParaVencer > 0).
  // 2. SHELF: Produtos que VENCERAM no armazém (diasParaVencer <= 0) OU que ULTRAPASSARAM 30 DIAS no PNC (diasEmPnc >= 30).
  // -------------------------------------------------------------
  
  // Itens classificados como PNC ativo (em prazo de escoamento e não vencidos)
  const activePncList = useMemo(() => {
    return pncItems.filter(item => {
      // Se já foi enviado para despejo, permanece para histórico ou rastreio
      if (item.status === 'Liberado' || item.status === 'Devolvido Fábrica') return false;
      // Se ultrapassou 30 dias de PNC ou venceu, é considerado SHELF
      const isExceeded30d = (item.diasEmPnc || 0) >= 30;
      const isExpired = (item.diasParaVencer || 0) <= 0;
      return !isExceeded30d && !isExpired;
    });
  }, [pncItems]);

  // Itens classificados como SHELF (Vencidos no Armazém ou Excederam 30 dias no PNC)
  const shelfList = useMemo(() => {
    // 1. Itens do PNC que estouraram 30 dias ou venceram
    const fromPnc = pncItems.filter(item => {
      const isExceeded30d = (item.diasEmPnc || 0) >= 30;
      const isExpired = (item.diasParaVencer || 0) <= 0;
      return isExceeded30d || isExpired;
    }).map(item => {
      const isExceeded30d = (item.diasEmPnc || 0) >= 30;
      const isExpired = (item.diasParaVencer || 0) <= 0;
      let motivoShelf = '';
      if (isExpired && isExceeded30d) {
        motivoShelf = `Vencido (${item.diasParaVencer}d) e Excedeu Limite 30d PNC (${item.diasEmPnc}d)`;
      } else if (isExpired) {
        motivoShelf = `Vencido no Armazém (${Math.abs(item.diasParaVencer)} dias após validade)`;
      } else {
        motivoShelf = `Limite de 30 Dias no PNC Excedido (${item.diasEmPnc} dias em quarentena sem escoamento)`;
      }

      // Check if there is an active despejo task
      const relatedTask = despejoTasks.find(t => t.pncId === item.id || (t.codigo === item.codigo && t.lote === item.lote));

      return {
        ...item,
        isFromValidadeDirect: false,
        origemShelf: isExpired ? ('vencido_armazem' as const) : ('excedeu_30d_pnc' as const),
        motivoShelf,
        despejoStatus: relatedTask ? relatedTask.status : (item.status === 'Enviado para Despejo' ? 'Pendente' : 'Não Encaminhado'),
        despejoTaskId: relatedTask?.id
      };
    });

    // 2. Itens recolhidos das últimas validades que já estão vencidos e não estão no PNC
    const expiredFromValidades: any[] = [];
    if (validadesList && validadesList.length > 0) {
      validadesList.forEach(v => {
        const days = v.diasParaVencer !== undefined ? Number(v.diasParaVencer) : (Number((v as any).days) || 0);
        if (days <= 0) {
          const cod = String(v.codigo || '').trim();
          const validadeStr = v.validade || todayISO;
          // Check if already covered in fromPnc
          const alreadyInPnc = fromPnc.some(p => p.codigo === cod && p.validade === validadeStr);
          if (!alreadyInPnc && cod) {
            const qtdCx = v.quantidade !== undefined && Number(v.quantidade) > 0 
              ? Number(v.quantidade) 
              : calcularTotalCaixas(v.codigo, v.palhete || 0, v.lastro || 0, v.caixa || 0);
            const pMaster = PRODUCTS.find(p => String(p.codigo) === cod) ||
                            PRODUCT_MASTER_DATA.find(p => String((p as any).sku || (p as any).codigo) === cod);
            const fatorPallet = Number((pMaster as any)?.fatorPallet) || 72;
            const fatorHecto = Number((pMaster as any)?.fatorHecto) || 0.042;
            const valorUnitario = Number((pMaster as any)?.preco) || 40.0;

            const relatedTask = despejoTasks.find(t => t.codigo === cod && t.lote === (v.lote || 'LOTE-VAL'));

            expiredFromValidades.push({
              id: `val-shelf-${cod}-${validadeStr}`,
              codigo: cod,
              descricao: v.descricao || `Produto ${cod}`,
              lote: v.lote || 'LOTE-VAL',
              validade: validadeStr,
              quantidade: qtdCx,
              paletes: Number((qtdCx / fatorPallet).toFixed(1)),
              fatorPallet,
              fatorHecto,
              hectolitros: Number((qtdCx * fatorHecto).toFixed(2)),
              valorUnitario,
              valorTotal: Number((qtdCx * valorUnitario).toFixed(2)),
              localizacaoAnterior: v.localizacao || 'Armazém Central',
              blocoAnterior: v.bloco || 'Geral',
              dataEntradaPnc: todayISO,
              diasEmPnc: 0,
              diasParaVencer: days,
              stockAgeIndex: 100,
              statusShelf: 'Vencido',
              motivo: 'Recolhido Vencido nas Últimas Validades',
              registradoPor: 'Inventário Validades',
              status: relatedTask ? 'Enviado para Despejo' : 'Em Quarentena / PNC',
              isFromValidadeDirect: true,
              origemShelf: 'vencido_armazem' as const,
              motivoShelf: `Vencido no Armazém (${Math.abs(days)} dias expirado)`,
              despejoStatus: relatedTask ? relatedTask.status : 'Não Encaminhado',
              despejoTaskId: relatedTask?.id,
              _criadoEm: new Date().toISOString()
            });
          }
        }
      });
    }

    return [...fromPnc, ...expiredFromValidades];
  }, [pncItems, despejoTasks, validadesList, todayISO]);

  // -------------------------------------------------------------
  // FILTRAGEM: LISTA PNC ATIVO
  // -------------------------------------------------------------
  const filteredPncItems = useMemo(() => {
    return activePncList.filter(item => {
      // Search
      const searchLower = searchTerm.toLowerCase();
      const matchSearch = 
        !searchTerm ||
        item.codigo.toLowerCase().includes(searchLower) ||
        item.descricao.toLowerCase().includes(searchLower) ||
        item.lote.toLowerCase().includes(searchLower) ||
        (item.motivo && item.motivo.toLowerCase().includes(searchLower)) ||
        (item.localizacaoAnterior && item.localizacaoAnterior.toLowerCase().includes(searchLower));

      if (!matchSearch) return false;

      // Filter: Apenas itens com menos de 30 dias de validade (Gatilho)
      if (filterApenas30dValidade && item.diasParaVencer > 30) return false;

      // Filter: Período
      if (filterPeriodo === 'ano_2026') {
        const in2026 = (item.validade && item.validade.startsWith('2026')) || (item.dataEntradaPnc && item.dataEntradaPnc.startsWith('2026'));
        if (!in2026) return false;
      } else if (filterPeriodo === 'ultimos_30d') {
        if (item.diasParaVencer > 30) return false;
      }

      // Filter: Range de Datas (Validade ou Data de Entrada)
      if (filterDataInicio) {
        const afterStart = (item.validade && item.validade >= filterDataInicio) || (item.dataEntradaPnc && item.dataEntradaPnc >= filterDataInicio);
        if (!afterStart) return false;
      }
      if (filterDataFim) {
        const beforeEnd = (item.validade && item.validade <= filterDataFim) || (item.dataEntradaPnc && item.dataEntradaPnc <= filterDataFim);
        if (!beforeEnd) return false;
      }

      // Filter: Risco 30d no PNC
      if (filterRisco30d === 'critico_30d' && (item.diasEmPnc < 25 || item.diasEmPnc >= 30)) return false;
      if (filterRisco30d === 'atencao_30d' && (item.diasEmPnc < 15 || item.diasEmPnc >= 25)) return false;
      if (filterRisco30d === 'ok_30d' && item.diasEmPnc >= 15) return false;

      // Filter: Validade
      if (filterValidade === 'vencidos' && item.diasParaVencer > 0) return false;
      if (filterValidade === 'critico_15d' && (item.diasParaVencer <= 0 || item.diasParaVencer > 15)) return false;
      if (filterValidade === 'atencao_30d' && (item.diasParaVencer <= 15 || item.diasParaVencer > 30)) return false;

      return true;
    });
  }, [activePncList, searchTerm, filterRisco30d, filterValidade, filterApenas30dValidade, filterPeriodo, filterDataInicio, filterDataFim]);

  // -------------------------------------------------------------
  // FILTRAGEM: LISTA SHELF LIFE (ITENS VENCIDOS NO ARMAZÉM)
  // -------------------------------------------------------------
  const filteredShelfItems = useMemo(() => {
    return shelfItems.filter(item => {
      const searchLower = searchTerm.toLowerCase();
      const matchSearch = 
        !searchTerm ||
        item.codigo.toLowerCase().includes(searchLower) ||
        item.descricao.toLowerCase().includes(searchLower) ||
        (item.lote && item.lote.toLowerCase().includes(searchLower)) ||
        (item.motivoDescricao && item.motivoDescricao.toLowerCase().includes(searchLower)) ||
        (item.departamento && item.departamento.toLowerCase().includes(searchLower));

      if (!matchSearch) return false;

      // Filter: Status Despejo
      if (filterStatusDespejo === 'Pendente' && item.statusDespejo !== 'Pendente') return false;
      if (filterStatusDespejo === 'Concluído' && item.statusDespejo !== 'Concluído') return false;

      // Filter: Range de Datas
      if (filterDataInicio) {
        if (item.data && item.data < filterDataInicio) return false;
      }
      if (filterDataFim) {
        if (item.data && item.data > filterDataFim) return false;
      }

      return true;
    });
  }, [shelfItems, searchTerm, filterStatusDespejo, filterDataInicio, filterDataFim]);

  // -------------------------------------------------------------
  // FILTRAGEM: LISTA DE ADERÊNCIA AO DESPEJO
  // -------------------------------------------------------------
  const filteredDespejoTasks = useMemo(() => {
    return despejoTasks.filter(task => {
      const searchLower = searchTerm.toLowerCase();
      const matchSearch = 
        !searchTerm ||
        task.codigo.toLowerCase().includes(searchLower) ||
        task.descricao.toLowerCase().includes(searchLower) ||
        task.lote.toLowerCase().includes(searchLower) ||
        (task.solicitadoPor && task.solicitadoPor.toLowerCase().includes(searchLower)) ||
        (task.executadoPor && task.executadoPor.toLowerCase().includes(searchLower)) ||
        (task.motivo && task.motivo.toLowerCase().includes(searchLower));

      if (!matchSearch) return false;

      if (filterStatusDespejo === 'Pendente' && task.status !== 'Pendente') return false;
      if (filterStatusDespejo === 'Concluído' && task.status !== 'Concluído') return false;

      return true;
    });
  }, [despejoTasks, searchTerm, filterStatusDespejo]);

  // -------------------------------------------------------------
  // INDICADORES DE ADERÊNCIA AO DESPEJO & KPIS
  // -------------------------------------------------------------
  const despejoMetrics = useMemo(() => {
    const totalTasks = despejoTasks.length;
    const completedTasks = despejoTasks.filter(t => t.status === 'Concluído');
    const pendingTasks = despejoTasks.filter(t => t.status === 'Pendente');

    const totalCaixas = despejoTasks.reduce((acc, t) => acc + (Number(t.quantidade) || 0), 0);
    const caixasDespejadas = completedTasks.reduce((acc, t) => acc + (Number(t.quantidade) || 0), 0);
    const caixasPendentes = pendingTasks.reduce((acc, t) => acc + (Number(t.quantidade) || 0), 0);

    const taxaAderencia = totalTasks > 0 ? ((completedTasks.length / totalTasks) * 100) : 100;
    const taxaAderenciaVolume = totalCaixas > 0 ? ((caixasDespejadas / totalCaixas) * 100) : 100;

    return {
      totalTasks,
      completedCount: completedTasks.length,
      pendingCount: pendingTasks.length,
      totalCaixas,
      caixasDespejadas,
      caixasPendentes,
      taxaAderencia: Number(taxaAderencia.toFixed(1)),
      taxaAderenciaVolume: Number(taxaAderenciaVolume.toFixed(1))
    };
  }, [despejoTasks]);

  // KPIs Resumo do Topo
  const kpis = useMemo(() => {
    // PNC Ativo
    const pncTotalCx = activePncList.reduce((acc, i) => acc + i.quantidade, 0);
    const pncTotalValor = activePncList.reduce((acc, i) => acc + i.valorTotal, 0);
    const pncCriticos30d = activePncList.filter(i => i.diasEmPnc >= 25).length;
    const pncAtencao30d = activePncList.filter(i => i.diasEmPnc >= 15 && i.diasEmPnc < 25).length;

    // Shelf Vencidos
    const shelfSkus = filteredShelfItems.length;
    const shelfTotalUnidades = filteredShelfItems.reduce((acc, i) => acc + (Number(i.quantidadeUnidades) || 0), 0);
    const shelfTotalHectolitros = filteredShelfItems.reduce((acc, i) => acc + (Number(i.hectolitros) || 0), 0);
    const shelfTotalValor = filteredShelfItems.reduce((acc, i) => acc + (Number(i.valorTotal) || 0), 0);
    const shelfDespejadosCount = filteredShelfItems.filter(i => i.statusDespejo === 'Concluído').length;
    const shelfPendentesCount = filteredShelfItems.filter(i => i.statusDespejo !== 'Concluído').length;

    return {
      pncSkus: activePncList.length,
      pncTotalCx,
      pncTotalValor,
      pncCriticos30d,
      pncAtencao30d,
      shelfSkus,
      shelfTotalUnidades,
      shelfTotalHectolitros: Number(shelfTotalHectolitros.toFixed(4)),
      shelfTotalValor: Number(shelfTotalValor.toFixed(2)),
      shelfDespejadosCount,
      shelfPendentesCount
    };
  }, [activePncList, filteredShelfItems]);

  // -------------------------------------------------------------
  // ACTIONS: ENVIAR PARA DESPEJO
  // -------------------------------------------------------------
  const handleSendToDespejo = (item: any) => {
    const confirmSend = window.confirm(
      `🚨 ENVIAR PARA DESPEJO\n\n` +
      `Produto: ${item.codigo} - ${item.descricao}\n` +
      `Lote: ${item.lote} | Qtd: ${item.quantidade} cx\n\n` +
      `Esta ação criará imediatamente uma Ordem de Tarefa na Baia de Despejo para o Ajudante de Armazém executar e dar baixa. Deseja prosseguir?`
    );
    if (!confirmSend) return;

    const motivo = item.origemShelf === 'excedeu_30d_pnc'
      ? `Despejo por Estouro de Limite (30d no PNC) - ${item.diasEmPnc} dias em quarentena`
      : item.diasParaVencer <= 0
      ? `Despejo de Produto Vencido no Armazém (Validade: ${item.validade})`
      : `Despejo Operacional PNC - ${item.motivo}`;

    const res = enviarPncParaDespejo(item.id, user?.nome || 'Gestor CCO / FEFO', motivo, empresaId);

    if (res.tarefa) {
      showToast(`🚨 Ordem de Despejo enviada com sucesso! Tarefa #${res.tarefa.id.substring(0, 10)} gerada para o Ajudante.`, 'success');
      refreshLocalData();
      if (onNavigateToDespejo) {
        // Optional callback
      }
    }
  };

  // Salvar alteração de data de entrada no PNC
  const handleSaveEditDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !inputDatePnc) return;

    updatePncItemDate(editingItem.id, inputDatePnc, empresaId);
    showToast(`✅ Data de entrada no PNC atualizada para ${new Date(inputDatePnc + 'T00:00:00').toLocaleDateString('pt-BR')}.`, 'success');
    setEditingItem(null);
    refreshLocalData();
  };

  // Salvar tratativa de escoamento
  const handleSaveEscoamento = (e: React.FormEvent) => {
    e.preventDefault();
    if (!escoamentoItem) return;

    updatePncEscoamento(
      escoamentoItem.id,
      selectedTratativa,
      selectedStatusEscoamento,
      inputAcaoEscoamento,
      empresaId
    );

    // Se a tratativa escolhida for Despejo, já despacha
    if (selectedTratativa === 'Despejo') {
      enviarPncParaDespejo(escoamentoItem.id, user?.nome || 'Gestor CCO', inputAcaoEscoamento || 'Tratativa de Escoamento: Despejo', empresaId);
      showToast(`🚨 Ação de Escoamento salva e Ordem de Despejo criada para o Ajudante!`, 'success');
    } else {
      showToast(`✅ Ação de Escoamento salva: ${selectedTratativa} (${selectedStatusEscoamento}).`, 'success');
    }

    setEscoamentoItem(null);
    refreshLocalData();
  };

  // Salvar novo registro de PNC manual
  const handleSaveNewPnc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkuCodigo || !newQuantidade || Number(newQuantidade) <= 0) {
      alert('Preencha o Código do Produto e a Quantidade.');
      return;
    }

    const prod = PRODUCTS.find(p => String(p.codigo) === newSkuCodigo) || 
                 PRODUCT_MASTER_DATA.find(p => String((p as any).sku || (p as any).codigo) === newSkuCodigo);
    const desc = newSkuDescricao || prod?.descricao || `Produto ${newSkuCodigo}`;

    savePncItem({
      codigo: newSkuCodigo,
      descricao: desc,
      lote: newLote || 'LOTE-MANUAL',
      validade: newValidade || todayISO,
      quantidade: Number(newQuantidade),
      dataEntradaPnc: newDataEntrada || todayISO,
      localizacaoAnterior: newLocalOrigem,
      motivo: newMotivo,
      tratativaEscoamento: newTratativa,
      statusEscoamento: 'Em Quarentena',
      registradoPor: user?.nome || 'Operador Armazém',
      observacoes: newObs
    }, empresaId);

    showToast(`✅ Novo item adicionado à Área de PNC com sucesso!`, 'success');
    setShowNewPncModal(false);
    
    // Reset form
    setNewSkuCodigo('');
    setNewSkuDescricao('');
    setNewLote('');
    setNewValidade('');
    setNewQuantidade('');
    setNewDataEntrada(todayISO);
    setNewObs('');
    refreshLocalData();
  };

  // Baixa manual de Despejo pelo Gestor
  const handleConfirmManualDespejo = () => {
    if (!completingTask) return;
    concluirDespejoTask(completingTask.id, managerExecutanteName, '00:05:00', empresaId);
    showToast(`✅ Tarefa de Despejo #${completingTask.id.substring(0, 10)} marcada como concluída!`, 'success');
    setCompletingTask(null);
    refreshLocalData();
  };

  // -------------------------------------------------------------
  // EXPORTAÇÕES (EXCEL / PDF)
  // -------------------------------------------------------------
  const exportToExcel = (type: 'pnc' | 'shelf' | 'aderencia') => {
    let data: any[] = [];
    let fileName = '';

    if (type === 'pnc') {
      fileName = `PNC_Produtos_Nao_Conformes_${todayISO}.xlsx`;
      data = filteredPncItems.map(i => ({
        'Código': i.codigo,
        'Descrição': i.descricao,
        'Lote': i.lote,
        'Validade': i.validade,
        'Dias p/ Vencer': i.diasParaVencer,
        'Data Entrada PNC': i.dataEntradaPnc,
        'Dias no PNC': i.diasEmPnc,
        'Limite 30d': `${i.diasEmPnc}/30 dias (${Math.max(0, 30 - i.diasEmPnc)} restantes)`,
        'Quantidade (CX)': i.quantidade,
        'Paletes': i.paletes,
        'Hectolitros (HL)': i.hectolitros,
        'Valor Total (R$)': i.valorTotal,
        'Tratativa Escoamento': i.tratativaEscoamento || 'Pendente',
        'Status Escoamento': i.statusEscoamento || 'Em Quarentena',
        'Motivo Entrada': i.motivo,
        'Localização': i.localizacaoAnterior
      }));
    } else if (type === 'shelf') {
      fileName = `SHELF_Produtos_Vencidos_${todayISO}.xlsx`;
      data = filteredShelfItems.map(i => ({
        'Data': i.data,
        'Código': i.codigo,
        'Descrição': i.descricao,
        'Lote': i.lote,
        'Validade': i.validade,
        'Motivo': `${i.codigoMotivo} ${i.departamento} - ${i.motivoDescricao}`,
        'Quantidade (Unidades)': i.quantidadeUnidades,
        'Preço Unitário (R$)': i.precoUnitario,
        'Hectolitros (hL)': i.hectolitros,
        'Valor Perdido (R$)': i.valorTotal,
        'Status Despejo': i.statusDespejo,
        'Data Despejo': i.dataDespejo || '-'
      }));
    } else {
      fileName = `ADERENCIA_DESPEJO_${todayISO}.xlsx`;
      data = filteredDespejoTasks.map(t => ({
        'ID Tarefa': t.id,
        'Código': t.codigo,
        'Descrição': t.descricao,
        'Lote': t.lote,
        'Validade': t.validade,
        'Quantidade (CX)': t.quantidade,
        'Embalagem': t.embalagem,
        'Origem': t.origem,
        'Motivo': t.motivo,
        'Data Solicitação': `${t.dataSolicitacao} ${t.horaSolicitacao || ''}`,
        'Solicitado Por': t.solicitadoPor,
        'Status': t.status,
        'Executado Por': t.executadoPor || 'Aguardando',
        'Data Conclusão': t.dataConclusao || '-'
      }));
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Dados');
    XLSX.writeFile(wb, fileName);
    showToast(`Relatório Excel exportado com sucesso!`, 'success');
  };

  return (
    <div className="w-full flex flex-col gap-5">
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-2xl border text-xs font-black flex items-center gap-2 animate-bounce ${
          toastMessage.type === 'success' ? 'bg-emerald-600 text-white border-emerald-400' :
          toastMessage.type === 'warning' ? 'bg-amber-600 text-white border-amber-400' :
          toastMessage.type === 'error' ? 'bg-rose-600 text-white border-rose-400' :
          'bg-blue-600 text-white border-blue-400'
        }`}>
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* NAVEGAÇÃO PRINCIPAL DE SUB-GUIAS (PNC / SHELF / ADERÊNCIA) */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-white dark:bg-[#151b23] p-2 rounded-2xl border border-slate-200 dark:border-[#222d3a] shadow-xs">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Subtab 1: PNC */}
          <button
            type="button"
            onClick={() => setActiveSubTab('pnc')}
            className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'pnc'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#161b22]'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>1. PNC (Quarentena & Escoamento)</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeSubTab === 'pnc' ? 'bg-white/25 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}>
              {pncOfficialCount > 0 ? pncOfficialCount : activePncList.length}
            </span>
          </button>

          {/* Subtab 2: SHELF */}
          <button
            type="button"
            onClick={() => setActiveSubTab('shelf')}
            className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 relative ${
              activeSubTab === 'shelf'
                ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#161b22]'
            }`}
          >
            <PackageX className="w-4 h-4" />
            <span>2. SHELF (Produtos Vencidos no Armazém)</span>
            {shelfList.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold animate-pulse ${
                activeSubTab === 'shelf' ? 'bg-white/30 text-white' : 'bg-rose-600 text-white'
              }`}>
                {shelfList.length}
              </span>
            )}
          </button>
        </div>

        {activeSubTab !== 'pnc' && (
          <button
            type="button"
            onClick={() => exportToExcel(activeSubTab)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-[#161b22] hover:bg-slate-50 dark:hover:bg-[#1f242c] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-[#2b313a] flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Exportar Excel</span>
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SUB-GUIA 1: PNC - PLATAFORMA OFICIAL (BASE JSON, INDICADORES & FILTROS)    */}
      {/* ========================================================================= */}
      {activeSubTab === 'pnc' && (
        <GestaoPncPlatform user={user} empresa={empresa} />
      )}

      {/* ========================================================================= */}
      {/* SUB-GUIAS 2 OU 3: SHELF & ADERÊNCIA AO DESPEJO                            */}
      {/* ========================================================================= */}
      {activeSubTab !== 'pnc' && (
        <>
          {/* HEADER PRINCIPAL DO SHELF */}
          <div className="bg-white dark:bg-[#151b23] p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-[#222d3a] shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-600 text-white shadow-md">
                <ShieldAlert className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                    Área de Gestão de Shelf-Life & Despejo
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-700">
                    Controle de Perdas & Ajudante
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                  Produtos vencidos no armazém, controle de perda financeira e física em hL, fila de despejo e acompanhamento de tarefas operacionais.
                </p>
              </div>
            </div>

            {/* TOP ACTION BUTTONS */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleSyncValidades}
                className="px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
                title="Importar lotes com risco de vencimento da última coleta realizada"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sincronizar Última Coleta ({validadesList.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setShowNewShelfModal(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-rose-600 hover:bg-rose-500 text-white shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Novo Registro Shelf</span>
              </button>
            </div>
          </div>

          {/* TOP KPI CARDS DO SHELF */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Card 1: Shelf Total (Vencidos ou >30d) */}
            <div className={`p-4 rounded-2xl border shadow-xs transition-all ${
              kpis.shelfSkus > 0
                ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-700/60'
                : 'bg-white dark:bg-[#151b23] border-slate-200 dark:border-[#222d3a]'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-400">
                  ☠️ Shelf (Vencidos)
                </span>
                <PackageX className="w-4 h-4 text-rose-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
                  {kpis.shelfSkus}
                </span>
                <span className="text-xs font-bold text-slate-500">
                  SKUs ({kpis.shelfTotalUnidades} un)
                </span>
              </div>
              <div className="text-[10px] text-rose-700 dark:text-rose-400/80 font-bold mt-1">
                Perda: {kpis.shelfTotalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            </div>

            {/* Card 2: Perda em Hectolitros */}
            <div className="bg-white dark:bg-[#151b23] p-4 rounded-2xl border border-slate-200 dark:border-[#222d3a] shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Volume Físico Shelf
                </span>
                <Box className="w-4 h-4 text-amber-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {(kpis.shelfTotalHectolitros || 0).toFixed(2)}
                </span>
                <span className="text-xs font-bold text-slate-500">
                  hL
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-1">
                Volume acumulado vencido
              </div>
            </div>

            {/* Card 3: Total SKUs Vencidos */}
            <div className="bg-white dark:bg-[#151b23] p-4 rounded-2xl border border-slate-200 dark:border-[#222d3a] shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  SKUs Vencidos
                </span>
                <PackageX className="w-4 h-4 text-rose-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
                  {shelfList.length}
                </span>
                <span className="text-xs font-bold text-slate-500">
                  itens em quarentena
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-bold mt-1">
                Lotes com 0 dias de vida útil restante
              </div>
            </div>

            {/* Card 4: Valoração Total Vencida */}
            <div className="bg-white dark:bg-[#151b23] p-4 rounded-2xl border border-slate-200 dark:border-[#222d3a] shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Impacto Financeiro
                </span>
                <TrendingDown className="w-4 h-4 text-rose-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  R$ {(kpis.shelfTotalValor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium mt-1">
                Montante total de estoque vencido
              </div>
            </div>
          </div>

          {/* SEARCH AND ADVANCED DATE & FILTERS BAR */}
          <div className="bg-white dark:bg-[#151b23] p-4 rounded-2xl border border-slate-200 dark:border-[#222d3a] shadow-xs flex flex-col gap-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por código SKU, descrição do produto, lote ou localização..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* GATILHO RÁPIDO: FILTRO DE MENOS DE 30 DIAS */}
              <button
                type="button"
                onClick={() => setFilterApenas30dValidade(!filterApenas30dValidade)}
                className={`px-3.5 py-2 text-xs rounded-xl font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer border ${
                  filterApenas30dValidade
                    ? 'bg-rose-600 text-white border-rose-500 shadow-sm ring-2 ring-rose-400/40'
                    : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60 hover:bg-rose-100'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>⚡ Validade &lt; 30 Dias</span>
                {filterApenas30dValidade && <span className="bg-white/20 px-1.5 py-0.2 rounded text-[10px]">ATIVO</span>}
              </button>
            </div>

            {/* FILTROS DE DATA & FILTROS ESPECÍFICOS */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  Período / Data:
                </span>

                <select
                  value={filterPeriodo}
                  onChange={e => {
                    const val = e.target.value as any;
                    setFilterPeriodo(val);
                    if (val === 'ano_2026') {
                      setFilterDataInicio('2026-01-01');
                      setFilterDataFim('2026-12-31');
                    } else if (val === 'todos') {
                      setFilterDataInicio('');
                      setFilterDataFim('');
                    }
                  }}
                  className="px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] text-slate-800 dark:text-slate-200 font-bold focus:outline-hidden"
                >
                  <option value="todos">Todo o Histórico</option>
                  <option value="ano_2026">📅 Ano 2026 Completo</option>
                  <option value="ultimos_30d">⏳ Validade ≤ 30 Dias</option>
                  <option value="personalizado">🔍 Range Customizado</option>
                </select>

                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-400">De:</span>
                  <input
                    type="date"
                    value={filterDataInicio}
                    onChange={e => {
                      setFilterDataInicio(e.target.value);
                      setFilterPeriodo('personalizado');
                    }}
                    className="px-2 py-1 text-xs rounded-lg bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] text-slate-800 dark:text-slate-200 font-mono"
                  />
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-400">Até:</span>
                  <input
                    type="date"
                    value={filterDataFim}
                    onChange={e => {
                      setFilterDataFim(e.target.value);
                      setFilterPeriodo('personalizado');
                    }}
                    className="px-2 py-1 text-xs rounded-lg bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] text-slate-800 dark:text-slate-200 font-mono"
                  />
                </div>

                {(filterDataInicio || filterDataFim || filterApenas30dValidade || filterPeriodo !== 'todos') && (
                  <button
                    type="button"
                    onClick={() => {
                      setFilterDataInicio('');
                      setFilterDataFim('');
                      setFilterPeriodo('todos');
                      setFilterApenas30dValidade(false);
                    }}
                    className="text-[10px] text-slate-400 hover:text-rose-500 font-bold underline cursor-pointer ml-1"
                  >
                    Limpar datas
                  </button>
                )}
              </div>

              {activeSubTab === 'shelf' && (
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={filterOrigemShelf}
                    onChange={e => setFilterOrigemShelf(e.target.value as any)}
                    className="px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] text-slate-800 dark:text-slate-200 font-bold focus:outline-hidden"
                  >
                    <option value="todos">Origem Shelf: Todas</option>
                    <option value="vencido_armazem">☠️ Vencido no Armazém</option>
                    <option value="excedeu_30d_pnc">⏰ Estourou 30d no PNC</option>
                  </select>

                  <select
                    value={filterStatusDespejo}
                    onChange={e => setFilterStatusDespejo(e.target.value as any)}
                    className="px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] text-slate-800 dark:text-slate-200 font-bold focus:outline-hidden"
                  >
                    <option value="todos">Status Despejo: Todos</option>
                    <option value="Pendente">🟡 Fila de Despejo (Pendente)</option>
                    <option value="Concluído">🟢 Despejado pelo Ajudante</option>
                  </select>
                </div>
              )}

              {activeSubTab === 'aderencia' && (
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={filterStatusDespejo}
                    onChange={e => setFilterStatusDespejo(e.target.value as any)}
                    className="px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] text-slate-800 dark:text-slate-200 font-bold focus:outline-hidden"
                  >
                    <option value="todos">Status Tarefa: Todas</option>
                    <option value="Pendente">🟡 Aguardando Ajudante (Pendente)</option>
                    <option value="Concluído">🟢 Executado / Despejado</option>
                  </select>
                </div>
              )}
            </div>
          </div>

      {/* ========================================================================= */}
      {/* SUB-GUIA 2: SHELF - PRODUTOS VENCIDOS NO ARMAZÉM OU >30 DIAS NO PNC       */}
      {/* ========================================================================= */}
      {activeSubTab === 'shelf' && (
        <div className="flex flex-col gap-4">
          {/* BANNER SHELF COM AÇÕES OPERACIONAIS */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-red-950/60 via-slate-900/70 to-slate-900/60 border border-red-500/40 text-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-md">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-2xl bg-red-600 text-white shrink-0 shadow-lg shadow-red-600/30">
                <PackageX className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-red-300 uppercase tracking-wider text-sm">
                    Produtos Vencidos no Armazém (Shelf Life)
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-red-500/20 text-red-300 border border-red-500/40">
                    {filteredShelfItems.length} Itens
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-1 max-w-2xl">
                  Itens recolhidos em shelf com conversão automática de <strong>Unidades para Hectolitros (hL)</strong> e <strong>Perda Financeira (R$)</strong> de acordo com o cadastro de produtos. Monitore o status de despejo de cada item.
                </p>
              </div>
            </div>

            {/* BOTÕES DE AÇÃO: NOVO, IMPORTAR, DESPEJAR */}
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={() => setShowNewShelfModal(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-red-600 hover:bg-red-500 text-white shadow-xs cursor-pointer flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Novo Item Shelf</span>
              </button>

              <button
                type="button"
                onClick={() => setShowImportShelfModal(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 cursor-pointer flex items-center gap-1.5 transition-all"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Importar em Massa</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const pendingDespejo = filteredShelfItems.filter(i => i.statusDespejo !== 'Concluído');
                  if (pendingDespejo.length === 0) {
                    showToast('Todos os itens de Shelf já foram despejados e concluídos!', 'info');
                    return;
                  }
                  const confirmAll = window.confirm(`Deseja emitir Ordem de Despejo para TODOS os ${pendingDespejo.length} itens pendentes de Shelf de uma vez?`);
                  if (!confirmAll) return;

                  pendingDespejo.forEach(item => {
                    enviarPncParaDespejo(item.id, user?.nome || 'Gestor FEFO', `Despejo em Lote de Shelf Vencido`, empresaId);
                    updateShelfDespejoStatus(item.id, 'Pendente', empresaId);
                  });
                  showToast(`🚨 ${pendingDespejo.length} Ordens de Despejo emitidas para o Ajudante!`, 'success');
                  refreshLocalData();
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-rose-700 hover:bg-rose-600 text-white shadow-xs cursor-pointer flex items-center gap-1.5 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Despejar Pendentes ({kpis.shelfPendentesCount})</span>
              </button>
            </div>
          </div>

          {/* BARRA DE CONTROLE DE MODO DE EXIBIÇÃO: GRÁFICOS & TABELA */}
          <div className="flex items-center justify-between flex-wrap gap-2 bg-white dark:bg-[#151b23] p-3 rounded-2xl border border-slate-200 dark:border-[#222d3a] shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">
                Visualização:
              </span>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#0d1117] p-1 rounded-xl border border-slate-200 dark:border-[#222d3a]">
                <button
                  type="button"
                  onClick={() => setShelfViewMode('ambos')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    shelfViewMode === 'ambos'
                      ? 'bg-white dark:bg-[#1f242c] text-red-600 dark:text-red-400 shadow-2xs font-black'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Gráficos & Tabela</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShelfViewMode('graficos')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    shelfViewMode === 'graficos'
                      ? 'bg-white dark:bg-[#1f242c] text-red-600 dark:text-red-400 shadow-2xs font-black'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Apenas Gráficos</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShelfViewMode('tabela')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    shelfViewMode === 'tabela'
                      ? 'bg-white dark:bg-[#1f242c] text-red-600 dark:text-red-400 shadow-2xs font-black'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span>Apenas Tabela</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="text-slate-500">
                Total Unidades: <strong className="text-slate-900 dark:text-white font-bold">{kpis.shelfTotalUnidades} un</strong>
              </span>
              <span className="text-slate-500">
                Volume: <strong className="text-blue-600 dark:text-blue-400 font-bold">{kpis.shelfTotalHectolitros} hL</strong>
              </span>
              <span className="text-slate-500">
                Perda Total: <strong className="text-red-600 dark:text-red-400 font-bold">{kpis.shelfTotalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
              </span>
            </div>
          </div>

          {/* SEÇÃO 1: GRÁFICOS ANALÍTICOS DE SHELF */}
          {(shelfViewMode === 'ambos' || shelfViewMode === 'graficos') && (
            <div className="animate-in fade-in duration-200">
              <ShelfLifeCharts items={filteredShelfItems} />
            </div>
          )}

          {/* SEÇÃO 2: TABELA DE ITENS DE SHELF LIFE */}
          {(shelfViewMode === 'ambos' || shelfViewMode === 'tabela') && (
            <div className="bg-white dark:bg-[#151b23] rounded-2xl border border-slate-200 dark:border-[#222d3a] shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-[#222d3a] flex items-center justify-between flex-wrap gap-2 bg-slate-50/50 dark:bg-[#0d1117]/50">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-sm uppercase text-slate-900 dark:text-white tracking-wider flex items-center gap-2">
                    <PackageX className="w-4 h-4 text-red-500" />
                    Relação Detalhada de Produtos em Shelf ({filteredShelfItems.length} Itens)
                  </h3>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-bold">
                  <span className="text-emerald-600 dark:text-emerald-400">
                    ✅ {kpis.shelfDespejadosCount} Despejados
                  </span>
                  <span className="text-amber-500">
                    ⏳ {kpis.shelfPendentesCount} Pendentes
                  </span>
                </div>
              </div>

              {filteredShelfItems.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
                  <div className="p-4 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Nenhum item em Shelf Life correspondente aos filtros.
                  </h4>
                  <p className="text-xs text-slate-400 max-w-md">
                    Clique em "+ Novo Item Shelf" ou "Importar em Massa" para gerenciar registros.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-[#0d1117] border-b border-slate-200 dark:border-[#222d3a] text-[10px] font-black uppercase text-slate-600 dark:text-slate-400 tracking-wider">
                        <th className="p-3.5">Data</th>
                        <th className="p-3.5">SKU & Produto</th>
                        <th className="p-3.5 text-right">Qtd (Unidades)</th>
                        <th className="p-3.5">Código Motivo & Depto</th>
                        <th className="p-3.5 text-right">Preço Unit. (R$)</th>
                        <th className="p-3.5 text-right">Perda Total (R$)</th>
                        <th className="p-3.5 text-right">Hectolitros (hL)</th>
                        <th className="p-3.5 text-center">Status Despejo</th>
                        <th className="p-3.5 text-right">Ações Operacionais</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#222d3a] font-medium text-slate-800 dark:text-slate-200">
                      {filteredShelfItems.map(item => {
                        const isDespejado = item.statusDespejo === 'Concluído';
                        const isPendente = item.statusDespejo === 'Pendente';

                        // Formatação de Data amigável (DD/MM/YYYY)
                        let displayData = item.data;
                        if (item.data && item.data.includes('-')) {
                          const parts = item.data.split('-');
                          if (parts.length === 3) {
                            displayData = `${parts[2]}/${parts[1]}/${parts[0]}`;
                          }
                        }

                        return (
                          <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-[#161b22] transition-colors">
                            {/* Data */}
                            <td className="p-3.5 font-mono text-xs text-slate-700 dark:text-slate-300 font-bold whitespace-nowrap">
                              {displayData}
                            </td>

                            {/* SKU & Produto */}
                            <td className="p-3.5">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-red-600 dark:text-red-400 text-xs">
                                  {item.codigo}
                                </span>
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-300 dark:border-red-500/40 inline-flex items-center gap-0.5">
                                  🔒 Bloqueado
                                </span>
                              </div>
                              <div className="font-bold text-slate-900 dark:text-white text-xs max-w-[240px] truncate mt-0.5" title={item.descricao}>
                                {item.descricao}
                              </div>
                              {item.lote && (
                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                  Lote: {item.lote}
                                </div>
                              )}
                            </td>

                            {/* Quantidade em Unidades */}
                            <td className="p-3.5 text-right font-mono">
                              <span className="font-black text-slate-900 dark:text-white text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                                {item.quantidadeUnidades} un
                              </span>
                            </td>

                            {/* Código Motivo & Depto */}
                            <td className="p-3.5">
                              <div className="font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200">
                                {item.codigoMotivo} {item.departamento}
                              </div>
                              <div className="text-[10px] text-red-500 font-semibold truncate max-w-[200px]">
                                {item.motivoDescricao}
                              </div>
                            </td>

                            {/* Preço Unitário */}
                            <td className="p-3.5 text-right font-mono text-xs text-slate-600 dark:text-slate-400">
                              {Number(item.precoUnitario || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </td>

                            {/* Perda Total (R$) */}
                            <td className="p-3.5 text-right font-mono font-black text-xs text-red-600 dark:text-red-400 whitespace-nowrap">
                              {Number(item.valorTotal || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </td>

                            {/* Hectolitros (hL) */}
                            <td className="p-3.5 text-right font-mono font-bold text-xs text-blue-600 dark:text-blue-400 whitespace-nowrap">
                              {Number(item.hectolitros || 0).toFixed(4)} hL
                            </td>

                            {/* Status Despejo */}
                            <td className="p-3.5 text-center">
                              {isDespejado ? (
                                <div className="flex flex-col items-center justify-center gap-0.5">
                                  <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-400/80 flex items-center justify-center gap-1 shadow-2xs tracking-wider">
                                    <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                                    <span>DESPEJADO</span>
                                  </span>
                                  {item.dataDespejo && (
                                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold mt-0.5">
                                      {item.dataDespejo}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 animate-pulse flex items-center justify-center gap-1 w-fit mx-auto">
                                  <Clock className="w-3 h-3" />
                                  <span>Pendente (Na Baia)</span>
                                </span>
                              )}
                            </td>

                            {/* Ações */}
                            <td className="p-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Botão alternar status rápido */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextStatus = isDespejado ? 'Pendente' : 'Concluído';
                                    updateShelfDespejoStatus(item.id, nextStatus, empresaId);
                                    refreshLocalData();
                                    showToast(
                                      nextStatus === 'Concluído'
                                        ? `✅ Item ${item.codigo} marcado como Despejado com Sucesso!`
                                        : `🟡 Item ${item.codigo} marcado como Pendente de Despejo.`,
                                      nextStatus === 'Concluído' ? 'success' : 'info'
                                    );
                                  }}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1 ${
                                    isDespejado
                                      ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xs'
                                  }`}
                                  title={isDespejado ? 'Reabrir status para pendente' : 'Confirmar que o despejo foi concluído'}
                                >
                                  <Check className="w-3 h-3" />
                                  <span>{isDespejado ? 'Reabrir' : 'Marcar Despejado'}</span>
                                </button>

                                {/* Emitir Ordem de Despejo */}
                                {!isDespejado && (
                                  <button
                                    type="button"
                                    onClick={() => handleSendToDespejo(item)}
                                    className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-red-600 hover:bg-red-500 text-white shadow-xs cursor-pointer flex items-center gap-1 transition-all"
                                    title="Emitir Ordem de Despejo na Baia para o Ajudante"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span>Ordem</span>
                                  </button>
                                )}

                                {/* Excluir Item do Shelf */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm(`Excluir item de Shelf ${item.codigo} - ${item.descricao} (caso importado por erro)?`)) {
                                      removerShelfItem(item.id, empresaId);
                                      refreshLocalData();
                                      showToast('Item removido com sucesso da lista de Shelf Life.', 'info');
                                    }
                                  }}
                                  className="px-2 py-1 rounded-lg text-slate-400 hover:text-white hover:bg-rose-600 dark:hover:bg-rose-600 bg-slate-100 dark:bg-slate-800 transition-all flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                                  title="Remover este item da lista de Shelf Life"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span className="hidden xl:inline">Excluir</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-GUIA 3: ADERÊNCIA AO DESPEJO - MONITORAMENTO EM TEMPO REAL AJUDANTE  */}
      {/* ========================================================================= */}
      {activeSubTab === 'aderencia' && (
        <div className="flex flex-col gap-4">
          {/* BANNER DE ADERÊNCIA */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#151b23] border border-slate-200 dark:border-[#222d3a] shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
            <div className="flex items-center gap-3.5">
              <div className={`p-3 rounded-2xl text-white shadow-md ${
                despejoMetrics.taxaAderencia >= 85 ? 'bg-emerald-600' : 'bg-amber-600'
              }`}>
                <CheckSquare className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Aderência ao Despejo Operacional (Ajudante de Armazém)
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300">
                    Sincronização em Tempo Real
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Acompanhamento se as ordens emitidas pelo CCO / PNC / Shelf foram fisicamente executadas e baixadas no painel do Ajudante.
                </p>
              </div>
            </div>

            {/* TAXA DE ADERÊNCIA HIGHLIGHT */}
            <div className="flex items-center gap-4 bg-slate-50 dark:bg-[#0d1117] p-3.5 rounded-2xl border border-slate-200 dark:border-[#222d3a]">
              <div className="text-center">
                <span className="text-[10px] font-black uppercase text-slate-400 block">
                  Taxa Aderência
                </span>
                <span className={`text-3xl font-black ${
                  despejoMetrics.taxaAderencia >= 90 ? 'text-emerald-600 dark:text-emerald-400' :
                  despejoMetrics.taxaAderencia >= 70 ? 'text-amber-600 dark:text-amber-400' :
                  'text-rose-600 dark:text-rose-400'
                }`}>
                  {despejoMetrics.taxaAderencia}%
                </span>
              </div>
              <div className="h-10 w-px bg-slate-200 dark:bg-slate-700" />
              <div className="text-xs space-y-0.5">
                <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                  <Check className="w-3.5 h-3.5" />
                  <span>{despejoMetrics.completedCount} Despejados ({despejoMetrics.caixasDespejadas} cx)</span>
                </div>
                <div className="flex items-center gap-1.5 font-bold text-rose-500">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{despejoMetrics.pendingCount} Aguardando Baixa ({despejoMetrics.caixasPendentes} cx)</span>
                </div>
              </div>
            </div>
          </div>

          {/* TABELA DE ORDENS DE DESPEJO */}
          <div className="bg-white dark:bg-[#151b23] rounded-2xl border border-slate-200 dark:border-[#222d3a] shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-[#222d3a] flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-black text-sm uppercase text-slate-900 dark:text-white tracking-wider flex items-center gap-2">
                <History className="w-4 h-4 text-blue-500" />
                Histórico & Fila de Ordens de Despejo ({filteredDespejoTasks.length} Registros)
              </h3>
              <span className="text-[11px] text-slate-400 font-bold">
                Integração direta com o painel do Ajudante de Armazém
              </span>
            </div>

            {filteredDespejoTasks.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
                <div className="p-4 rounded-full bg-slate-100 dark:bg-[#0d1117] text-slate-400">
                  <Trash2 className="w-8 h-8" />
                </div>
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Nenhuma ordem de despejo encontrada para os filtros selecionados.
                </h4>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-[#0d1117] border-b border-slate-200 dark:border-[#222d3a] text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                      <th className="p-3.5">Ordem / SKU</th>
                      <th className="p-3.5">Lote / Validade</th>
                      <th className="p-3.5 text-right">Volume (CX)</th>
                      <th className="p-3.5">Origem & Motivo</th>
                      <th className="p-3.5">Solicitação</th>
                      <th className="p-3.5 text-center">Status Operacional</th>
                      <th className="p-3.5">Execução pelo Ajudante</th>
                      <th className="p-3.5 text-right">Ação Gestor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#222d3a] font-medium text-slate-800 dark:text-slate-200">
                    {filteredDespejoTasks.map(task => {
                      const isConcluido = task.status === 'Concluído';

                      return (
                        <tr key={task.id} className="hover:bg-slate-50 dark:hover:bg-[#161b22] transition-colors">
                          {/* Ordem / SKU */}
                          <td className="p-3.5">
                            <div className="text-[10px] font-mono text-slate-400">
                              #{task.id.substring(0, 12)}
                            </div>
                            <div className="font-mono font-bold text-blue-600 dark:text-blue-400 text-xs">
                              {task.codigo}
                            </div>
                            <div className="font-bold text-slate-900 dark:text-white text-xs max-w-[200px] truncate" title={task.descricao}>
                              {task.descricao}
                            </div>
                          </td>

                          {/* Lote / Validade */}
                          <td className="p-3.5">
                            <div className="font-mono text-xs text-slate-700 dark:text-slate-300">
                              Lote: <strong className="text-slate-900 dark:text-white">{task.lote}</strong>
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              Val: {task.validade}
                            </div>
                          </td>

                          {/* Volume */}
                          <td className="p-3.5 text-right">
                            <div className="font-mono font-black text-rose-600 dark:text-rose-400 text-xs">
                              {task.quantidade} cx
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {task.embalagem}
                            </div>
                          </td>

                          {/* Origem & Motivo */}
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              {task.origem} • {task.prioridade}
                            </span>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 truncate max-w-[200px]" title={task.motivo}>
                              {task.motivo}
                            </p>
                          </td>

                          {/* Solicitação */}
                          <td className="p-3.5 text-[11px]">
                            <div className="font-bold text-slate-800 dark:text-slate-200">
                              {task.solicitadoPor}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {task.dataSolicitacao} {task.horaSolicitacao}
                            </div>
                          </td>

                          {/* Status Operacional */}
                          <td className="p-3.5 text-center">
                            {isConcluido ? (
                              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 flex items-center justify-center gap-1 w-fit mx-auto">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Despejado (Concluído)</span>
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-rose-600 text-white animate-pulse shadow-2xs flex items-center justify-center gap-1 w-fit mx-auto">
                                <Clock className="w-3.5 h-3.5" />
                                <span>Pendente (Na Baia)</span>
                              </span>
                            )}
                          </td>

                          {/* Execução */}
                          <td className="p-3.5 text-[11px]">
                            {isConcluido ? (
                              <div>
                                <div className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                  <UserCheck className="w-3.5 h-3.5" />
                                  <span>{task.executadoPor || 'Ajudante Armazém'}</span>
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                  {task.dataConclusao ? new Date(task.dataConclusao).toLocaleString('pt-BR') : 'Concluído'}
                                </div>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">
                                Aguardando lançamento no tablet...
                              </span>
                            )}
                          </td>

                          {/* Ação Gestor */}
                          <td className="p-3.5 text-right">
                            {!isConcluido && (
                              <button
                                type="button"
                                onClick={() => {
                                  setCompletingTask(task);
                                  setManagerExecutanteName(user?.nome || 'Ajudante Armazém');
                                }}
                                className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-2xs transition-all"
                                title="Marcar manualmente como concluído pelo gestor"
                              >
                                Baixar Manual
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
      </>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDITAR DATA DE ENTRADA NO PNC                                      */}
      {/* ========================================================================= */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#151b23] rounded-2xl border border-slate-200 dark:border-[#222d3a] shadow-2xl p-6 w-full max-w-md flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#222d3a] pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-rose-500" />
                <h3 className="font-black text-sm uppercase text-slate-900 dark:text-white">
                  Editar Data de Entrada no PNC
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] text-xs">
              <div className="font-bold text-slate-900 dark:text-white">
                {editingItem.codigo} - {editingItem.descricao}
              </div>
              <div className="text-slate-400 font-mono mt-0.5">
                Lote: {editingItem.lote} | Qtd: {editingItem.quantidade} cx
              </div>
            </div>

            <form onSubmit={handleSaveEditDate} className="flex flex-col gap-4">
              <div>
                <label className="text-[11px] font-black uppercase text-slate-400 block mb-1">
                  Data Exata de Entrada no PNC (Limite Max 30 Dias)
                </label>
                <input
                  type="date"
                  value={inputDatePnc}
                  onChange={e => setInputDatePnc(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  O contador de 30 dias de permanência máxima será recalculado a partir desta data.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-[#222d3a]">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-rose-600 hover:bg-rose-500 text-white shadow-xs cursor-pointer"
                >
                  Salvar Nova Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DEFINIR TRATATIVA DE ESCOAMENTO                                    */}
      {/* ========================================================================= */}
      {escoamentoItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#151b23] rounded-2xl border border-slate-200 dark:border-[#222d3a] shadow-2xl p-6 w-full max-w-lg flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#222d3a] pb-3">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-500" />
                <h3 className="font-black text-sm uppercase text-slate-900 dark:text-white">
                  Acompanhamento de Escoamento - PNC
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEscoamentoItem(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] text-xs">
              <div className="font-black text-slate-900 dark:text-white text-sm">
                {escoamentoItem.codigo} - {escoamentoItem.descricao}
              </div>
              <div className="text-slate-400 font-mono mt-1 flex justify-between">
                <span>Lote: <strong>{escoamentoItem.lote}</strong></span>
                <span>Validade: <strong>{escoamentoItem.validade}</strong></span>
                <span>Qtd: <strong className="text-rose-500">{escoamentoItem.quantidade} cx</strong></span>
              </div>
            </div>

            <form onSubmit={handleSaveEscoamento} className="flex flex-col gap-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-black uppercase text-slate-400 block mb-1">
                    Tratativa de Escoamento
                  </label>
                  <select
                    value={selectedTratativa}
                    onChange={e => setSelectedTratativa(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] text-slate-900 dark:text-white font-bold"
                  >
                    <option value="Venda Acelerada">🚀 Venda Acelerada / Bonificada</option>
                    <option value="Repack">📦 Repack / Reembalagem</option>
                    <option value="Devolução Fábrica">🏭 Devolução Fábrica / Fornecedor</option>
                    <option value="Reclassificação">🔄 Reclassificação Comercial</option>
                    <option value="Despejo">🚨 Encaminhar para Despejo</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase text-slate-400 block mb-1">
                    Status da Tratativa
                  </label>
                  <select
                    value={selectedStatusEscoamento}
                    onChange={e => setSelectedStatusEscoamento(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] text-slate-900 dark:text-white font-bold"
                  >
                    <option value="Em Quarentena">Em Quarentena</option>
                    <option value="Em Negociação">Em Negociação Comercial</option>
                    <option value="Em Separação">Em Separação p/ Rota</option>
                    <option value="Aguardando Laudo">Aguardando Laudo</option>
                    <option value="Concluído">Concluído</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-slate-400 block mb-1">
                  Detalhes da Ação / Destino / Observações
                </label>
                <textarea
                  rows={2}
                  value={inputAcaoEscoamento}
                  onChange={e => setInputAcaoEscoamento(e.target.value)}
                  placeholder="Ex: Desconto autorizado de 20% para rota rápida de eventos, separação até amanhã..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-[#222d3a]">
                <button
                  type="button"
                  onClick={() => setEscoamentoItem(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-blue-600 hover:bg-blue-500 text-white shadow-xs cursor-pointer"
                >
                  Salvar Tratativa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NOVO REGISTRO PNC                                                 */}
      {/* ========================================================================= */}
      {showNewPncModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#151b23] rounded-2xl border border-slate-200 dark:border-[#222d3a] shadow-2xl p-6 w-full max-w-lg flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#222d3a] pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-rose-500" />
                <h3 className="font-black text-sm uppercase text-slate-900 dark:text-white">
                  Novo Registro de Produto Não Conforme (PNC)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewPncModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNewPnc} className="flex flex-col gap-3.5">
              <div>
                <label className="text-[11px] font-black uppercase text-slate-400 block mb-1">
                  Selecione o Produto / SKU
                </label>
                <select
                  value={newSkuCodigo}
                  onChange={e => handleSelectProduct(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] text-slate-900 dark:text-white font-bold"
                >
                  <option value="">Selecione um produto do catálogo...</option>
                  {PRODUCTS.map((p, idx) => (
                    <option key={`shelf-cat-${p.codigo}-${idx}`} value={p.codigo}>
                      {p.codigo} - {p.descricao}
                    </option>
                  ))}
                </select>
              </div>

              {newSkuDescricao && (
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-[#0d1117] text-xs font-bold text-slate-800 dark:text-slate-200">
                  {newSkuDescricao}
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-black uppercase text-slate-400 block mb-1">
                    Lote
                  </label>
                  <input
                    type="text"
                    placeholder="L24..."
                    value={newLote}
                    onChange={e => setNewLote(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] text-slate-900 dark:text-white font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase text-slate-400 block mb-1">
                    Validade
                  </label>
                  <input
                    type="date"
                    value={newValidade}
                    onChange={e => setNewValidade(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase text-slate-400 block mb-1">
                    Quantidade (CX)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="72"
                    value={newQuantidade}
                    onChange={e => setNewQuantidade(e.target.value ? Number(e.target.value) : '')}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-black uppercase text-slate-400 block mb-1">
                    Data de Entrada no PNC
                  </label>
                  <input
                    type="date"
                    value={newDataEntrada}
                    onChange={e => setNewDataEntrada(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase text-slate-400 block mb-1">
                    Localização de Origem
                  </label>
                  <input
                    type="text"
                    placeholder="Armazém Central - Bloco C"
                    value={newLocalOrigem}
                    onChange={e => setNewLocalOrigem(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-black uppercase text-slate-400 block mb-1">
                    Motivo da Segregação
                  </label>
                  <select
                    value={newMotivo}
                    onChange={e => setNewMotivo(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] text-slate-900 dark:text-white font-bold"
                  >
                    <option value="Validade Crítica (≤ 30d)">Validade Crítica (≤ 30d)</option>
                    <option value="Avaria em Palete / Deformação">Avaria em Palete / Deformação</option>
                    <option value="Lote Vencido na Rota">Lote Vencido na Rota</option>
                    <option value="Inconformidade de Embalagem">Inconformidade de Embalagem</option>
                    <option value="Bloqueio de Qualidade">Bloqueio de Qualidade</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase text-slate-400 block mb-1">
                    Tratativa Inicial
                  </label>
                  <select
                    value={newTratativa}
                    onChange={e => setNewTratativa(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] text-slate-900 dark:text-white font-bold"
                  >
                    <option value="Venda Acelerada">Venda Acelerada</option>
                    <option value="Repack">Repack</option>
                    <option value="Devolução Fábrica">Devolução Fábrica</option>
                    <option value="Despejo">Encaminhar para Despejo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-slate-400 block mb-1">
                  Observações Adicionais
                </label>
                <textarea
                  rows={2}
                  value={newObs}
                  onChange={e => setNewObs(e.target.value)}
                  placeholder="Informações relevantes para auditoria..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-[#222d3a]">
                <button
                  type="button"
                  onClick={() => setShowNewPncModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-rose-600 hover:bg-rose-500 text-white shadow-xs cursor-pointer"
                >
                  Registrar no PNC
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BAIXA MANUAL DE DESPEJO PELO GESTOR                               */}
      {/* ========================================================================= */}
      {completingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#151b23] rounded-2xl border border-slate-200 dark:border-[#222d3a] shadow-2xl p-6 w-full max-w-md flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#222d3a] pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <h3 className="font-black text-sm uppercase text-slate-900 dark:text-white">
                  Confirmar Baixa de Despejo
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCompletingTask(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] text-xs">
              <div className="font-bold text-slate-900 dark:text-white">
                {completingTask.codigo} - {completingTask.descricao}
              </div>
              <div className="text-slate-400 font-mono mt-1">
                Lote: {completingTask.lote} | Qtd: <strong className="text-rose-500">{completingTask.quantidade} cx</strong>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-black uppercase text-slate-400 block mb-1">
                Nome do Executante / Ajudante que efetuou o Despejo
              </label>
              <input
                type="text"
                value={managerExecutanteName}
                onChange={e => setManagerExecutanteName(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] text-slate-900 dark:text-white font-bold"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-[#222d3a]">
              <button
                type="button"
                onClick={() => setCompletingTask(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmManualDespejo}
                className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Confirmar Conclusão</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAIS DE ENTRADA MANUAL E IMPORTAÇÃO EM MASSA (SHELF & PNC)             */}
      {/* ========================================================================= */}
      <NewShelfItemModal
        isOpen={showNewShelfModal}
        onClose={() => setShowNewShelfModal(false)}
        onSuccess={() => {
          refreshLocalData();
          showToast('✅ Item de Shelf adicionado com sucesso!', 'success');
        }}
        empresaId={empresaId}
      />

      <ImportShelfBulkModal
        isOpen={showImportShelfModal}
        onClose={() => setShowImportShelfModal(false)}
        onSuccess={() => {
          refreshLocalData();
          showToast('✅ Itens importados para o Shelf com sucesso!', 'success');
        }}
        empresaId={empresaId}
      />

      <ImportPncBulkModal
        isOpen={showImportPncModal}
        onClose={() => setShowImportPncModal(false)}
        onSuccess={() => {
          refreshLocalData();
          showToast('✅ Registros importados para o PNC com sucesso!', 'success');
        }}
        empresaId={empresaId}
      />
    </div>
  );
};

export default ShelfLifePncTab;
