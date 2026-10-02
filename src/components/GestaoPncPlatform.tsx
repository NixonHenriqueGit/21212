import React, { useState, useMemo, useRef } from 'react';
import {
  PncRecord,
  PncFilters,
  getStoredPncRecords,
  savePncRecords,
  deletePncRecord,
  deletePncRecordsBulk,
  updatePncRecordNf,
  updatePncRecordFull,
  createPncRecord,
  encaminharParaDespejo,
  isPncAcima30Dias,
  calculateDiasPnc,
  importPncJson,
  resetPncToOfficial,
  calculatePncKpis,
  filterPncRecords,
  extractFilterOptions,
  getOfficialPncRecords
} from '../utils/gestaoPncManager';
import { GestaoPncAnalyticsCharts } from './GestaoPncAnalyticsCharts';
import { Usuario, Empresa } from '../types';
import * as XLSX from 'xlsx';
import {
  ShieldAlert,
  Search,
  Filter,
  RotateCcw,
  Upload,
  Download,
  FileSpreadsheet,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Box,
  Layers,
  DollarSign,
  Lock,
  Unlock,
  Building2,
  User,
  Activity,
  Calendar,
  X,
  ChevronDown,
  ChevronUp,
  Info,
  Check,
  ArrowUpDown,
  FileText,
  Edit3,
  Save,
  Truck,
  PlusCircle,
  Flame,
  ArrowRight,
  Sparkles,
  Trash2
} from 'lucide-react';

interface GestaoPncPlatformProps {
  user?: Usuario;
  empresa?: Empresa | null;
  theme?: 'light' | 'dark';
}

const INITIAL_FILTERS: PncFilters = {
  meses: [],
  produtos: [],
  descricoes: [],
  fabOrigens: [],
  motivos: [],
  origensBloqueio: [],
  responsaveis: [],
  statusList: [],
  acoes: [],
  dataBloqueio: '',
  dataInicio: '',
  dataFim: '',
  searchTerm: ''
};

export const GestaoPncPlatform: React.FC<GestaoPncPlatformProps> = ({
  user,
  empresa,
  theme = 'light'
}) => {
  const empresaId = empresa?.id || 'demo';

  // Base de dados carregada dinamicamente
  const [records, setRecords] = useState<PncRecord[]>(() => getStoredPncRecords(empresaId));
  const [filters, setFilters] = useState<PncFilters>(INITIAL_FILTERS);

  // Estados de UI
  const [showImportModal, setShowImportModal] = useState(false);
  const [jsonInputText, setJsonInputText] = useState('');
  const [importStatus, setImportStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: ''
  });
  const [selectedRecord, setSelectedRecord] = useState<PncRecord | null>(null);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Seleção múltipla para ações em lote (como exclusão)
  const [selectedBloqueios, setSelectedBloqueios] = useState<Set<string>>(new Set());

  // Estado para Edição Rápida de NF de Saída / Entrada no Acompanhamento
  const [editingNfTarget, setEditingNfTarget] = useState<PncRecord | null>(null);
  const [nfSaidaInput, setNfSaidaInput] = useState('');
  const [nfEntradaInput, setNfEntradaInput] = useState('');
  const [nfSuccessMsg, setNfSuccessMsg] = useState('');

  // Ordenação
  const [sortField, setSortField] = useState<keyof PncRecord>('data_do_bloqueio');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Opções de filtro extraídas dinamicamente da base ativa
  const filterOptions = useMemo(() => extractFilterOptions(records), [records]);

  // Registros filtrados (Imutabilidade garantida)
  const filteredRecords = useMemo(() => {
    const list = filterPncRecords(records, filters);

    return [...list].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (valA === null || valA === undefined) valA = '';
      if (valB === null || valB === undefined) valB = '';

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      if (strA < strB) return sortDirection === 'asc' ? -1 : 1;
      if (strA > strB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [records, filters, sortField, sortDirection]);

  // KPIs calculados automaticamente conforme filtros aplicados
  const kpis = useMemo(() => calculatePncKpis(filteredRecords), [filteredRecords]);

  // Abertura do Modal de Edição de NF
  const handleOpenNfEdit = (record: PncRecord, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingNfTarget(record);
    setNfSaidaInput(record.nf_saida ? String(record.nf_saida) : '');
    setNfEntradaInput(record.nf ? String(record.nf) : '');
    setNfSuccessMsg('');
  };

  // Salvar NF de Saída e/ou NF de Entrada
  const handleSaveNf = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingNfTarget) return;

    const updated = updatePncRecordNf(
      editingNfTarget.n_bloqueio,
      nfSaidaInput.trim() || null,
      nfEntradaInput.trim() || null,
      empresaId
    );

    setRecords(updated);
    
    // Atualizar selectedRecord se estiver aberto
    if (selectedRecord && selectedRecord.n_bloqueio === editingNfTarget.n_bloqueio) {
      setSelectedRecord(prev => prev ? {
        ...prev,
        nf_saida: nfSaidaInput.trim() || null,
        nf: nfEntradaInput.trim() || prev.nf
      } : null);
    }

    setNfSuccessMsg('Nota Fiscal de Saída gravada com sucesso no acompanhamento!');
    setTimeout(() => {
      setEditingNfTarget(null);
      setNfSuccessMsg('');
    }, 1200);
  };

  // Modal de Inclusão de Novo Item no Acompanhamento
  const [showNewItemModal, setShowNewItemModal] = useState(false);
  const [newItemForm, setNewItemForm] = useState({
    n_bloqueio: '',
    opera_o: 'GUARABIRA',
    m_s: 'MAR',
    produto: '',
    descri_o: '',
    fab_origem: 'AGUAS CLARAS',
    nf: '',
    nf_saida: '',
    data_da_chegada: new Date().toISOString().substring(0, 10),
    data_do_bloqueio: new Date().toISOString().substring(0, 10),
    data_da_libera_o: '',
    motivo: 'DATA CURTA',
    origem_do_bloqueio: 'AUDITORIA DA QUALIDADE',
    emissor: user?.nome || 'QUALIDADE',
    qtde_bloq_cx: 20,
    qtde_bloq_hl: 1.68,
    qtd_em_plts: 1,
    valor: 850,
    a_o: 'EM TRATATIVA COM A FÁBRICA',
    respons_vel: 'LOGÍSTICA',
    status: 'BLOQUEADO',
    observa_o: ''
  });

  // Modal de Tratativa Completa (Edição de Datas de Entrada/Saída, Status, NF e Ações)
  const [editingTreatmentTarget, setEditingTreatmentTarget] = useState<PncRecord | null>(null);
  const [treatmentForm, setTreatmentForm] = useState({
    data_da_chegada: '',
    data_do_bloqueio: '',
    data_da_libera_o: '',
    data_saida: '',
    nf: '',
    nf_saida: '',
    status: '',
    a_o: '',
    respons_vel: '',
    qtd_em_plts: 1,
    qtde_bloq_cx: 0,
    valor: 0,
    observa_o: ''
  });

  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'alert' | 'info'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'alert' | 'info' = 'success') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleOpenNewItem = () => {
    const defaultBloqueio = `PNC-${Math.floor(100000 + Math.random() * 900000)}`;
    const today = new Date().toISOString().substring(0, 10);
    const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    const curMonth = months[new Date().getMonth()] || 'MAR';

    setNewItemForm({
      n_bloqueio: defaultBloqueio,
      opera_o: 'GUARABIRA',
      m_s: curMonth,
      produto: '',
      descri_o: '',
      fab_origem: filterOptions.fabOrigens[0] || 'AGUAS CLARAS',
      nf: '',
      nf_saida: '',
      data_da_chegada: today,
      data_do_bloqueio: today,
      data_da_libera_o: '',
      motivo: filterOptions.motivos[0] || 'DATA CURTA',
      origem_do_bloqueio: filterOptions.origensBloqueio[0] || 'AUDITORIA DA QUALIDADE',
      emissor: user?.nome || 'QUALIDADE',
      qtde_bloq_cx: 20,
      qtde_bloq_hl: 1.68,
      qtd_em_plts: 1,
      valor: 850.00,
      a_o: 'EM TRATATIVA COM A FÁBRICA',
      respons_vel: filterOptions.responsaveis[0] || 'LOGÍSTICA',
      status: 'BLOQUEADO',
      observa_o: ''
    });
    setShowNewItemModal(true);
  };

  const handleCreateNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemForm.descri_o.trim()) {
      alert('Por favor, informe a descrição do produto.');
      return;
    }

    const payload: Partial<PncRecord> = {
      ...newItemForm,
      produto: newItemForm.produto ? (Number(newItemForm.produto) || newItemForm.produto) : 9999,
      qtde_bloq_cx: Number(newItemForm.qtde_bloq_cx) || 1,
      qtde_bloq_hl: Number(newItemForm.qtde_bloq_hl) || 0,
      qtd_em_plts: Number(newItemForm.qtd_em_plts) || 1,
      valor: Number(newItemForm.valor) || 0,
      data_entrada: newItemForm.data_da_chegada || newItemForm.data_do_bloqueio,
      data_saida: newItemForm.data_da_libera_o || undefined
    };

    const res = createPncRecord(payload, empresaId);
    if (res.success) {
      setRecords(res.records);
      setShowNewItemModal(false);
      showToast(`Novo item "${newItemForm.descri_o}" incluído com sucesso no acompanhamento PNC!`, 'success');
    } else {
      showToast(res.error || 'Erro ao incluir item', 'alert');
    }
  };

  const handleOpenTreatment = (record: PncRecord, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingTreatmentTarget(record);
    setTreatmentForm({
      data_da_chegada: record.data_da_chegada || record.data_entrada || '',
      data_do_bloqueio: record.data_do_bloqueio || '',
      data_da_libera_o: record.data_da_libera_o || record.data_saida || '',
      data_saida: record.data_saida || record.data_da_libera_o || '',
      nf: record.nf ? String(record.nf) : '',
      nf_saida: record.nf_saida ? String(record.nf_saida) : '',
      status: record.status || 'BLOQUEADO',
      a_o: record.a_o || '',
      respons_vel: record.respons_vel || '',
      qtd_em_plts: record.qtd_em_plts || 1,
      qtde_bloq_cx: record.qtde_bloq_cx || 0,
      valor: record.valor || 0,
      observa_o: record.observa_o || ''
    });
  };

  const handleSaveTreatment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTreatmentTarget) return;

    const dataSaidaVal = treatmentForm.data_saida || treatmentForm.data_da_libera_o;
    const isDevolvidoOuDespejo = treatmentForm.status.toUpperCase().includes('DEVOLUÇÃO') || 
                                 treatmentForm.status.toUpperCase().includes('DESPEJO') || 
                                 treatmentForm.status.toUpperCase().includes('LIBERADO');

    const patch: Partial<PncRecord> = {
      data_da_chegada: treatmentForm.data_da_chegada,
      data_entrada: treatmentForm.data_da_chegada,
      data_do_bloqueio: treatmentForm.data_do_bloqueio,
      data_da_libera_o: dataSaidaVal || (isDevolvidoOuDespejo ? new Date().toISOString().substring(0, 10) : undefined),
      data_saida: dataSaidaVal || (isDevolvidoOuDespejo ? new Date().toISOString().substring(0, 10) : undefined),
      nf: treatmentForm.nf.trim() || '',
      nf_saida: treatmentForm.nf_saida.trim() || null,
      status: treatmentForm.status,
      a_o: treatmentForm.a_o,
      respons_vel: treatmentForm.respons_vel,
      qtd_em_plts: Number(treatmentForm.qtd_em_plts) || 1,
      qtde_bloq_cx: Number(treatmentForm.qtde_bloq_cx) || 0,
      valor: Number(treatmentForm.valor) || 0,
      observa_o: treatmentForm.observa_o
    };

    const res = updatePncRecordFull(editingTreatmentTarget.n_bloqueio, patch, empresaId);
    if (res.success) {
      setRecords(res.records);
      if (selectedRecord && selectedRecord.n_bloqueio === editingTreatmentTarget.n_bloqueio) {
        const dEntrada = patch.data_da_chegada || selectedRecord.data_da_chegada;
        const dSaida = patch.data_da_libera_o || selectedRecord.data_da_libera_o;
        const dias = calculateDiasPnc(dEntrada, dSaida, selectedRecord.dias_no_pnc);
        setSelectedRecord(prev => prev ? { ...prev, ...patch, dias_no_pnc: dias } : null);
      }
      setEditingTreatmentTarget(null);
      showToast(`Tratativa do Bloqueio Nº ${editingTreatmentTarget.n_bloqueio} atualizada com sucesso!`, 'success');
    } else {
      showToast(res.error || 'Erro ao atualizar tratativa', 'alert');
    }
  };

  const handleDirectDespejo = (n_bloqueio: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm(`Confirma o encaminhamento do Bloqueio Nº ${n_bloqueio} para DESPEJO imediato (>30 dias no PNC)?`)) {
      const res = encaminharParaDespejo(n_bloqueio, empresaId);
      if (res.success) {
        setRecords(res.records);
        if (selectedRecord && selectedRecord.n_bloqueio === n_bloqueio) {
          setSelectedRecord(prev => prev ? {
            ...prev,
            status: 'DESPEJO',
            a_o: 'ENCAMINHADO PARA DESPEJO (>30 DIAS PNC)',
            data_da_libera_o: new Date().toISOString().substring(0, 10),
            data_saida: new Date().toISOString().substring(0, 10)
          } : null);
        }
        showToast(`Item Nº ${n_bloqueio} encaminhado para DESPEJO com sucesso!`, 'alert');
      }
    }
  };

  // Manipulação de seleção múltipla para exclusão
  const toggleSelectBloqueio = (n_bloqueio: string, e?: React.SyntheticEvent) => {
    if (e) e.stopPropagation();
    setSelectedBloqueios(prev => {
      const next = new Set(prev);
      if (next.has(n_bloqueio)) {
        next.delete(n_bloqueio);
      } else {
        next.add(n_bloqueio);
      }
      return next;
    });
  };

  const toggleSelectAllFiltered = () => {
    if (selectedBloqueios.size === filteredRecords.length && filteredRecords.length > 0) {
      setSelectedBloqueios(new Set());
    } else {
      setSelectedBloqueios(new Set(filteredRecords.map(r => r.n_bloqueio)));
    }
  };

  const handleDeleteSingle = (n_bloqueio: string, desc: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm(`Tem certeza que deseja excluir o item ${n_bloqueio} (${desc}) do PNC? Esta ação removerá o registro da base.`)) {
      try {
        const updatedList = deletePncRecord(n_bloqueio, empresaId);
        setRecords(updatedList);
        setSelectedBloqueios(prev => {
          const next = new Set(prev);
          next.delete(n_bloqueio);
          return next;
        });
        if (selectedRecord && selectedRecord.n_bloqueio === n_bloqueio) {
          setSelectedRecord(null);
        }
        if (editingNfTarget && editingNfTarget.n_bloqueio === n_bloqueio) {
          setEditingNfTarget(null);
        }
        if (editingTreatmentTarget && editingTreatmentTarget.n_bloqueio === n_bloqueio) {
          setEditingTreatmentTarget(null);
        }
        showToast(`Item ${n_bloqueio} excluído com sucesso!`, 'success');
      } catch (err: any) {
        showToast(`Erro ao excluir item: ${err?.message || 'Falha'}`, 'alert');
      }
    }
  };

  const handleDeleteSelected = () => {
    if (selectedBloqueios.size === 0) return;
    const count = selectedBloqueios.size;
    if (window.confirm(`Tem certeza que deseja excluir os ${count} itens selecionados do PNC? Esta ação removerá os registros da base.`)) {
      try {
        const updatedList = deletePncRecordsBulk(Array.from(selectedBloqueios), empresaId);
        setRecords(updatedList);
        if (selectedRecord && selectedBloqueios.has(selectedRecord.n_bloqueio)) {
          setSelectedRecord(null);
        }
        if (editingNfTarget && selectedBloqueios.has(editingNfTarget.n_bloqueio)) {
          setEditingNfTarget(null);
        }
        if (editingTreatmentTarget && selectedBloqueios.has(editingTreatmentTarget.n_bloqueio)) {
          setEditingTreatmentTarget(null);
        }
        setSelectedBloqueios(new Set());
        showToast(`${count} itens foram excluídos com sucesso da base PNC!`, 'success');
      } catch (err: any) {
        showToast(`Erro ao excluir itens em lote: ${err?.message || 'Falha'}`, 'alert');
      }
    }
  };

  // Contagem de filtros ativos
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.meses.length > 0) count += filters.meses.length;
    if (filters.produtos.length > 0) count += filters.produtos.length;
    if (filters.descricoes.length > 0) count += filters.descricoes.length;
    if (filters.fabOrigens.length > 0) count += filters.fabOrigens.length;
    if (filters.motivos.length > 0) count += filters.motivos.length;
    if (filters.origensBloqueio.length > 0) count += filters.origensBloqueio.length;
    if (filters.responsaveis.length > 0) count += filters.responsaveis.length;
    if (filters.statusList.length > 0) count += filters.statusList.length;
    if (filters.acoes.length > 0) count += filters.acoes.length;
    if (filters.dataBloqueio) count += 1;
    if (filters.dataInicio || filters.dataFim) count += 1;
    if (filters.searchTerm) count += 1;
    return count;
  }, [filters]);

  // Handlers para seleção múltipla
  const toggleMultiFilter = (key: keyof PncFilters, value: any) => {
    setFilters(prev => {
      const arr = (prev[key] as any[]) || [];
      const exists = arr.some(v => String(v) === String(value));
      const updated = exists ? arr.filter(v => String(v) !== String(value)) : [...arr, value];
      return { ...prev, [key]: updated };
    });
  };

  const handleClearAllFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  const handleSort = (field: keyof PncRecord) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Importação JSON
  const handleImportJson = (content: string) => {
    const res = importPncJson(content, empresaId);
    if (res.success) {
      setRecords(res.records);
      setImportStatus({
        type: 'success',
        message: `Importação realizada com sucesso! ${res.count} registros de PNC ativos carregados.`
      });
      setTimeout(() => {
        setShowImportModal(false);
        setImportStatus({ type: 'idle', message: '' });
        setJsonInputText('');
      }, 1200);
    } else {
      setImportStatus({
        type: 'error',
        message: res.error || 'Falha ao importar arquivo JSON.'
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      const text = evt.target?.result as string;
      if (text) {
        setJsonInputText(text);
        handleImportJson(text);
      }
    };
    reader.readAsText(file);
  };

  const handleResetToOfficial = () => {
    if (window.confirm('Deseja restaurar a base oficial de PNC do arquivo JSON padrão?')) {
      const reset = resetPncToOfficial(empresaId);
      setRecords(reset);
      setFilters(INITIAL_FILTERS);
    }
  };

  const handleToggleSupplier = (supplier: string) => {
    setFilters(prev => {
      const exists = prev.fabOrigens.includes(supplier);
      return {
        ...prev,
        fabOrigens: exists ? prev.fabOrigens.filter(s => s !== supplier) : [...prev.fabOrigens, supplier]
      };
    });
  };

  const handleClearSupplierFilter = () => {
    setFilters(prev => ({
      ...prev,
      fabOrigens: []
    }));
  };

  const handleExportJson = () => {
    const exportObj = {
      nome_base: 'Gestão de PNC',
      data_exportacao: new Date().toISOString(),
      total_registros: filteredRecords.length,
      registros: filteredRecords
    };
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gestao_pnc_export_${new Date().toISOString().substring(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    const worksheetData = filteredRecords.map(r => ({
      'Nº Bloqueio': r.n_bloqueio,
      'Operação': r.opera_o || 'GUARABIRA',
      'Mês': r.m_s,
      'Produto': r.produto,
      'Descrição': r.descri_o,
      'Fábrica Origem': r.fab_origem,
      'NF Origem (Fábrica)': r.nf,
      'NF Saída (Devolução)': r.nf_saida || 'Pendente',
      'Data Chegada': r.data_da_chegada,
      'Data Bloqueio': r.data_do_bloqueio,
      'Motivo': r.motivo,
      'Emissor': r.emissor,
      'Origem Bloqueio': r.origem_do_bloqueio,
      'Qtde Bloq (CX)': r.qtde_bloq_cx,
      'Qtde Bloq (HL)': Number(r.qtde_bloq_hl || 0).toFixed(2),
      'Valor Total (R$)': Number(r.valor || 0).toFixed(2),
      'Ação': r.a_o,
      'Responsável': r.respons_vel,
      'Status': r.status,
      'Qtde Retida': r.qtde_retida ?? '',
      'Qtde Pallets': r.qtd_em_plts ?? '',
      'Qtde Liberada': r.qtde_liberada ?? '',
      'Data Liberação': r.data_da_libera_o ?? '',
      'Dias no PNC': r.dias_no_pnc,
      'Observação': r.observa_o ?? ''
    }));

    const ws = XLSX.utils.json_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Gestao_PNC');
    XLSX.writeFile(wb, `gestao_pnc_${new Date().toISOString().substring(0, 10)}.xlsx`);
  };

  const handleDownloadSampleJson = () => {
    const sample = getOfficialPncRecords();
    const payload = {
      nome_base: 'Gestão de PNC',
      fonte: 'Guia dados da planilha GESTÃO DE PNC',
      estrutura: {
        total_registros_ativos: sample.length,
        campos: [
          'n_bloqueio', 'opera_o', 'm_s', 'produto', 'descri_o', 'fab_origem', 'nf', 'nf_saida',
          'data_da_chegada', 'data_do_bloqueio', 'motivo', 'emissor', 'origem_do_bloqueio',
          'qtde_bloq_cx', 'qtde_bloq_hl', 'valor', 'a_o', 'respons_vel', 'status',
          'qtde_retida', 'qtd_em_plts', 'qtde_liberada', 'data_da_libera_o', 'dias_no_pnc', 'observa_o'
        ]
      },
      registros: sample
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modelo_gestao_pnc.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-3 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* CABEÇALHO PRINCIPAL */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-[#032b5e] via-[#043875] to-[#0d1b2a] text-white rounded-2xl shadow-lg border border-blue-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-500/20 text-rose-300 border border-rose-400/40">
              Plataforma Oficial
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-500/20 text-blue-200 border border-blue-400/30">
              Base JSON Dinâmica
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2.5">
            <ShieldAlert className="w-7 h-7 text-amber-400 shrink-0" />
            Gestão de PNC (Produtos Não Conformes & Bloqueios)
          </h1>
          <p className="text-xs sm:text-sm text-blue-100/80 font-medium max-w-2xl">
            Painel dinâmico com leitura do arquivo JSON, filtros combinados em tempo real, cálculo automático de dias de permanência e indicadores gerenciais.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            type="button"
            onClick={handleOpenNewItem}
            className="px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-400 hover:bg-emerald-300 text-slate-950 shadow-md cursor-pointer flex items-center gap-1.5 transition-all"
            title="Incluir novo item / chamado de não conformidade no acompanhamento"
          >
            <PlusCircle className="w-4 h-4 text-slate-950" />
            <span>Novo Item PNC</span>
          </button>

          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md cursor-pointer flex items-center gap-1.5 transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>Importar / Atualizar JSON</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 cursor-pointer flex items-center gap-1.5 transition-all"
            title="Exportar registros filtrados para Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Excel</span>
          </button>

          <button
            type="button"
            onClick={handleExportJson}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 cursor-pointer flex items-center gap-1.5 transition-all"
            title="Exportar registros filtrados para JSON"
          >
            <FileCode className="w-4 h-4 text-blue-300" />
            <span>JSON</span>
          </button>

          <button
            type="button"
            onClick={handleResetToOfficial}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 cursor-pointer transition-all"
            title="Restaurar base oficial padrão"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* TOAST FLUTUANTE DE NOTIFICAÇÃO */}
      {toastMessage && (
        <div className={`fixed bottom-5 right-5 z-50 p-4 rounded-2xl shadow-2xl border flex items-center gap-3 text-xs font-black animate-in fade-in slide-in-from-bottom-3 ${
          toastMessage.type === 'alert'
            ? 'bg-rose-900 text-white border-rose-600'
            : toastMessage.type === 'info'
            ? 'bg-blue-900 text-white border-blue-600'
            : 'bg-emerald-900 text-white border-emerald-600'
        }`}>
          {toastMessage.type === 'alert' ? <AlertTriangle className="w-5 h-5 text-rose-300" /> : <CheckCircle2 className="w-5 h-5 text-emerald-300" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* 8 INDICADORES OFICIAIS (KPIS) ATUALIZADOS AUTOMATICAMENTE */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 sm:gap-3">
        {/* 1. Quantidade de chamados/bloqueios */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#151b23] border border-slate-200 dark:border-[#222d3a] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Chamados</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {kpis.totalChamados || kpis.totalBloqueios}
            </span>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">Chamados PNC</p>
          </div>
        </div>

        {/* 2. Quantidade bloqueada em caixas */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#151b23] border border-slate-200 dark:border-[#222d3a] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Bloq. Caixas</span>
            <Box className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {kpis.totalBloqCx.toLocaleString('pt-BR')}
            </span>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">Caixas (CX)</p>
          </div>
        </div>

        {/* 3. Quantidade bloqueada em HL */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#151b23] border border-slate-200 dark:border-[#222d3a] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Bloq. HL</span>
            <Activity className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {kpis.totalBloqHl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">Hectolitros (HL)</p>
          </div>
        </div>

        {/* 4. Valor total */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#151b23] border border-slate-200 dark:border-[#222d3a] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Valor Total</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2">
            <span className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 truncate block">
              R$ {kpis.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">Impacto Financeiro</p>
          </div>
        </div>

        {/* 5. Quantidade retida */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#151b23] border border-slate-200 dark:border-[#222d3a] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Qtde Retida</span>
            <Lock className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {kpis.totalRetida.toLocaleString('pt-BR')}
            </span>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">Em Quarentena</p>
          </div>
        </div>

        {/* 6. Quantidade liberada */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#151b23] border border-slate-200 dark:border-[#222d3a] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Qtde Liberada</span>
            <Unlock className="w-4 h-4 text-teal-500" />
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {kpis.totalLiberada.toLocaleString('pt-BR')}
            </span>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">Liberados p/ Uso</p>
          </div>
        </div>

        {/* 7. Total de Itens */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#151b23] border border-slate-200 dark:border-[#222d3a] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Total de Itens</span>
            <Layers className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {(kpis.totalItens || kpis.totalPallets).toLocaleString('pt-BR')}
            </span>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">
              {kpis.itensDevolvidos} devolvidos | {kpis.itensEmTratativa} tratativa
            </p>
          </div>
        </div>

        {/* 8. Média de dias no PNC */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#151b23] border border-slate-200 dark:border-[#222d3a] shadow-xs flex flex-col justify-between bg-gradient-to-b from-transparent to-amber-500/5">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Média Dias PNC</span>
            <Clock className="w-4 h-4 text-orange-500" />
          </div>
          <div className="mt-2">
            <span className={`text-xl sm:text-2xl font-black ${kpis.mediaDiasPnc > 15 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
              {kpis.mediaDiasPnc.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            </span>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">Dias Permanência</p>
          </div>
        </div>
      </div>

      {/* PAINEL GRÁFICO E ANÁLISE SÊNIOR DE LOGÍSTICA */}
      <GestaoPncAnalyticsCharts
        records={filteredRecords}
        kpis={kpis}
        selectedSuppliers={filters.fabOrigens}
        onToggleSupplier={handleToggleSupplier}
        onClearSupplierFilter={handleClearSupplierFilter}
        onSelectRecord={setSelectedRecord}
        onEncaminharDespejo={handleDirectDespejo}
      />

      {/* BARRA DE FILTROS AVANÇADOS E MULTI-SELEÇÃO */}
      <div className="bg-white dark:bg-[#151b23] rounded-2xl border border-slate-200 dark:border-[#222d3a] p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Busca Rápida */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={filters.searchTerm}
              onChange={e => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
              placeholder="Buscar por Nº Bloqueio, SKU, Produto, NF, Motivo, Origem, Responsável, Ação..."
              className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
            {filters.searchTerm && (
              <button
                type="button"
                onClick={() => setFilters(prev => ({ ...prev, searchTerm: '' }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowFilterDrawer(prev => !prev)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                activeFiltersCount > 0
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-[#0d1117] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#222d3a] hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filtros Múltiplos ({activeFiltersCount})</span>
              {showFilterDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="px-3 py-2.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 cursor-pointer flex items-center gap-1.5 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Limpar Filtros</span>
              </button>
            )}
          </div>
        </div>

        {/* PAINEL EXPANSÍVEL DE FILTROS MÚLTIPLOS */}
        {showFilterDrawer && (
          <div className="pt-4 border-t border-slate-100 dark:border-[#222d3a] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Filtro: Mês */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center justify-between">
                <span>Mês ({filterOptions.meses.length})</span>
                {filters.meses.length > 0 && (
                  <span className="text-[10px] text-blue-500 font-bold">
                    {filters.meses.length} selecionado(s)
                  </span>
                )}
              </label>
              <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto p-1.5 rounded-xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a]">
                {filterOptions.meses.map(m => {
                  const active = filters.meses.includes(m);
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => toggleMultiFilter('meses', m)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-extrabold cursor-pointer transition-all ${
                        active
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white dark:bg-[#151b23] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                      }`}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filtro: Status */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center justify-between">
                <span>Status ({filterOptions.statusList.length})</span>
                {filters.statusList.length > 0 && (
                  <span className="text-[10px] text-blue-500 font-bold">
                    {filters.statusList.length} selecionado(s)
                  </span>
                )}
              </label>
              <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto p-1.5 rounded-xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a]">
                {filterOptions.statusList.map(st => {
                  const active = filters.statusList.includes(st);
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => toggleMultiFilter('statusList', st)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-extrabold cursor-pointer transition-all ${
                        active
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white dark:bg-[#151b23] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                      }`}
                    >
                      {st}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filtro: Motivo */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center justify-between">
                <span>Motivo ({filterOptions.motivos.length})</span>
                {filters.motivos.length > 0 && (
                  <span className="text-[10px] text-blue-500 font-bold">
                    {filters.motivos.length} selecionado(s)
                  </span>
                )}
              </label>
              <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto p-1.5 rounded-xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a]">
                {filterOptions.motivos.map(mot => {
                  const active = filters.motivos.includes(mot);
                  return (
                    <button
                      key={mot}
                      type="button"
                      onClick={() => toggleMultiFilter('motivos', mot)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-extrabold cursor-pointer transition-all ${
                        active
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white dark:bg-[#151b23] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                      }`}
                    >
                      {mot}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filtro: Origem do Bloqueio */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center justify-between">
                <span>Origem do Bloqueio ({filterOptions.origensBloqueio.length})</span>
                {filters.origensBloqueio.length > 0 && (
                  <span className="text-[10px] text-blue-500 font-bold">
                    {filters.origensBloqueio.length} selecionado(s)
                  </span>
                )}
              </label>
              <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto p-1.5 rounded-xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a]">
                {filterOptions.origensBloqueio.map(orig => {
                  const active = filters.origensBloqueio.includes(orig);
                  return (
                    <button
                      key={orig}
                      type="button"
                      onClick={() => toggleMultiFilter('origensBloqueio', orig)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-extrabold cursor-pointer transition-all ${
                        active
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white dark:bg-[#151b23] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                      }`}
                    >
                      {orig}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filtro: Responsável */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center justify-between">
                <span>Responsável ({filterOptions.responsaveis.length})</span>
                {filters.responsaveis.length > 0 && (
                  <span className="text-[10px] text-blue-500 font-bold">
                    {filters.responsaveis.length} selecionado(s)
                  </span>
                )}
              </label>
              <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto p-1.5 rounded-xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a]">
                {filterOptions.responsaveis.map(resp => {
                  const active = filters.responsaveis.includes(resp);
                  return (
                    <button
                      key={resp}
                      type="button"
                      onClick={() => toggleMultiFilter('responsaveis', resp)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-extrabold cursor-pointer transition-all ${
                        active
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white dark:bg-[#151b23] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                      }`}
                    >
                      {resp}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filtro: Fábrica / Origem */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center justify-between">
                <span>Fábrica / Origem ({filterOptions.fabOrigens.length})</span>
                {filters.fabOrigens.length > 0 && (
                  <span className="text-[10px] text-blue-500 font-bold">
                    {filters.fabOrigens.length} selecionado(s)
                  </span>
                )}
              </label>
              <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto p-1.5 rounded-xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a]">
                {filterOptions.fabOrigens.map(fab => {
                  const active = filters.fabOrigens.includes(fab);
                  return (
                    <button
                      key={fab}
                      type="button"
                      onClick={() => toggleMultiFilter('fabOrigens', fab)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-extrabold cursor-pointer transition-all ${
                        active
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white dark:bg-[#151b23] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                      }`}
                    >
                      {fab}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filtro: Ação */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center justify-between">
                <span>Ação ({filterOptions.acoes.length})</span>
                {filters.acoes.length > 0 && (
                  <span className="text-[10px] text-blue-500 font-bold">
                    {filters.acoes.length} selecionado(s)
                  </span>
                )}
              </label>
              <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto p-1.5 rounded-xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a]">
                {filterOptions.acoes.map(ac => {
                  const active = filters.acoes.includes(ac);
                  return (
                    <button
                      key={ac}
                      type="button"
                      onClick={() => toggleMultiFilter('acoes', ac)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-extrabold cursor-pointer transition-all truncate max-w-[180px] ${
                        active
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white dark:bg-[#151b23] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                      }`}
                      title={ac}
                    >
                      {ac}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filtro: Período por Data do Bloqueio */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                Período (Data do Bloqueio)
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="date"
                  value={filters.dataInicio}
                  onChange={e => setFilters(prev => ({ ...prev, dataInicio: e.target.value }))}
                  className="px-2 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] text-slate-800 dark:text-slate-200 font-bold"
                  title="Data Inicial"
                />
                <input
                  type="date"
                  value={filters.dataFim}
                  onChange={e => setFilters(prev => ({ ...prev, dataFim: e.target.value }))}
                  className="px-2 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] text-slate-800 dark:text-slate-200 font-bold"
                  title="Data Final"
                />
              </div>
            </div>
          </div>
        )}

        {/* CHIPS DE FILTROS ATIVOS COM BOTÃO DE REMOÇÃO RÁPIDA */}
        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100 dark:border-[#222d3a]">
            <span className="text-[10px] font-black uppercase text-slate-400 mr-1">Filtros Ativos:</span>

            {filters.meses.map(m => (
              <span
                key={`m-${m}`}
                className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 flex items-center gap-1"
              >
                Mês: {m}
                <X className="w-3 h-3 cursor-pointer" onClick={() => toggleMultiFilter('meses', m)} />
              </span>
            ))}

            {filters.statusList.map(st => (
              <span
                key={`st-${st}`}
                className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200 flex items-center gap-1"
              >
                Status: {st}
                <X className="w-3 h-3 cursor-pointer" onClick={() => toggleMultiFilter('statusList', st)} />
              </span>
            ))}

            {filters.motivos.map(mot => (
              <span
                key={`mot-${mot}`}
                className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 flex items-center gap-1"
              >
                Motivo: {mot}
                <X className="w-3 h-3 cursor-pointer" onClick={() => toggleMultiFilter('motivos', mot)} />
              </span>
            ))}

            {filters.origensBloqueio.map(orig => (
              <span
                key={`orig-${orig}`}
                className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 flex items-center gap-1"
              >
                Origem: {orig}
                <X className="w-3 h-3 cursor-pointer" onClick={() => toggleMultiFilter('origensBloqueio', orig)} />
              </span>
            ))}

            {filters.responsaveis.map(resp => (
              <span
                key={`resp-${resp}`}
                className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-100 dark:bg-rose-900/40 text-rose-800 dark:text-rose-200 flex items-center gap-1"
              >
                Resp: {resp}
                <X className="w-3 h-3 cursor-pointer" onClick={() => toggleMultiFilter('responsaveis', resp)} />
              </span>
            ))}

            {filters.fabOrigens.map(fab => (
              <span
                key={`fab-${fab}`}
                className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center gap-1"
              >
                Fábrica: {fab}
                <X className="w-3 h-3 cursor-pointer" onClick={() => toggleMultiFilter('fabOrigens', fab)} />
              </span>
            ))}

            {filters.dataInicio && (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-200 flex items-center gap-1">
                De: {filters.dataInicio}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, dataInicio: '' }))} />
              </span>
            )}

            {filters.dataFim && (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-200 flex items-center gap-1">
                Até: {filters.dataFim}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters(prev => ({ ...prev, dataFim: '' }))} />
              </span>
            )}
          </div>
        )}
      </div>

      {/* TABELA OFICIAL DE REGISTROS DE PNC */}
      <div className="bg-white dark:bg-[#151b23] rounded-2xl border border-slate-200 dark:border-[#222d3a] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-[#222d3a] flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm uppercase text-slate-900 dark:text-white tracking-wider">
                Registros de Bloqueio PNC ({filteredRecords.length} de {records.length})
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Clique em qualquer registro para visualizar todos os detalhes ou use o botão de exclusão caso tenha importado por engano.
              </p>
            </div>
          </div>

          {/* AÇÕES EM LOTE (EXCLUSÃO SELETIVA) */}
          <div className="flex items-center gap-2">
            {selectedBloqueios.size > 0 && (
              <>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  {selectedBloqueios.size} selecionado(s)
                </span>
                <button
                  type="button"
                  onClick={handleDeleteSelected}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md cursor-pointer transition-all animate-in fade-in"
                  title="Excluir todos os itens marcados na lista"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir Selecionados ({selectedBloqueios.size})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedBloqueios(new Set())}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Desmarcar
                </button>
              </>
            )}
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3">
            <div className="p-4 rounded-full bg-slate-100 dark:bg-[#0d1117] text-slate-400">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Nenhum registro encontrado para os filtros selecionados.
            </h4>
            <button
              type="button"
              onClick={handleClearAllFilters}
              className="px-4 py-2 rounded-xl text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 hover:bg-blue-100 cursor-pointer"
            >
              Limpar Filtros e Ver Toda a Base
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-[#0d1117] border-b border-slate-200 dark:border-[#222d3a] text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                  <th className="p-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={filteredRecords.length > 0 && selectedBloqueios.size === filteredRecords.length}
                      onChange={toggleSelectAllFiltered}
                      title="Selecionar / Desmarcar todos os registros filtrados"
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                    />
                  </th>
                  <th className="p-3 cursor-pointer hover:text-blue-500" onClick={() => handleSort('n_bloqueio')}>
                    <div className="flex items-center gap-1">
                      <span>Nº Bloqueio</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="p-3 cursor-pointer hover:text-blue-500" onClick={() => handleSort('m_s')}>
                    <div className="flex items-center gap-1">
                      <span>Mês</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="p-3 cursor-pointer hover:text-blue-500" onClick={() => handleSort('produto')}>
                    <div className="flex items-center gap-1">
                      <span>SKU & Descrição</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="p-3 cursor-pointer hover:text-blue-500" onClick={() => handleSort('fab_origem')}>
                    <div className="flex items-center gap-1">
                      <span>Fábrica / Origem</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="p-3">
                    <div className="flex items-center gap-1">
                      <span>NF Entrada ➔ Saída</span>
                    </div>
                  </th>
                  <th className="p-3 cursor-pointer hover:text-blue-500" onClick={() => handleSort('data_do_bloqueio')}>
                    <div className="flex items-center gap-1">
                      <span>Datas (Entrada / Saída)</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="p-3 cursor-pointer hover:text-blue-500" onClick={() => handleSort('motivo')}>
                    <div className="flex items-center gap-1">
                      <span>Motivo</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="p-3 text-right cursor-pointer hover:text-blue-500" onClick={() => handleSort('qtd_em_plts')}>
                    <div className="flex items-center justify-end gap-1">
                      <span>Itens / CX</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="p-3 text-right cursor-pointer hover:text-blue-500" onClick={() => handleSort('valor')}>
                    <div className="flex items-center justify-end gap-1">
                      <span>Valor (R$)</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="p-3 text-center cursor-pointer hover:text-blue-500" onClick={() => handleSort('dias_no_pnc')}>
                    <div className="flex items-center justify-center gap-1">
                      <span>Dias PNC</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="p-3 text-center cursor-pointer hover:text-blue-500" onClick={() => handleSort('status')}>
                    <div className="flex items-center justify-center gap-1">
                      <span>Status</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="p-3 cursor-pointer hover:text-blue-500" onClick={() => handleSort('respons_vel')}>
                    <div className="flex items-center gap-1">
                      <span>Responsável</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="p-3 text-center">
                    <span>Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#222d3a]">
                {filteredRecords.map((r, idx) => {
                  const isBlocked = r.status.toUpperCase().includes('BLOQUEADO');
                  const isDevolucao = r.status.toUpperCase().includes('DEVOLUÇÃO');
                  const isLiberado = r.status.toUpperCase().includes('LIBERADO');
                  const isDespejo = r.status.toUpperCase().includes('DESPEJO');
                  const isAcima30 = isPncAcima30Dias(r);
                  const dataEntrada = r.data_da_chegada || r.data_entrada || r.data_do_bloqueio;
                  const dataSaida = r.data_da_libera_o || r.data_saida;
                  const isSelected = selectedBloqueios.has(r.n_bloqueio);

                  return (
                    <tr
                      key={`${r.n_bloqueio}-${idx}`}
                      onClick={() => setSelectedRecord(r)}
                      className={`hover:bg-blue-50/50 dark:hover:bg-[#1c2430] cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-50/80 dark:bg-blue-950/30'
                          : isAcima30 && !isDevolucao && !isLiberado && !isDespejo
                          ? 'bg-rose-50/40 dark:bg-rose-950/15'
                          : ''
                      }`}
                    >
                      <td className="p-3 text-center" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={e => toggleSelectBloqueio(r.n_bloqueio, e)}
                          title={`Selecionar ${r.n_bloqueio}`}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                        />
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {isAcima30 && !isDevolucao && !isLiberado && !isDespejo && (
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" title="Alerta >30 dias no PNC" />
                          )}
                          <span>{r.n_bloqueio}</span>
                        </div>
                      </td>
                      <td className="p-3 font-bold text-slate-600 dark:text-slate-400">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase">
                          {r.m_s}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col">
                          <span className="font-extrabold text-slate-900 dark:text-white">
                            {r.descri_o}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-mono text-slate-400">
                              SKU: {r.produto}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">
                        {r.fab_origem}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                              ENTRADA
                            </span>
                            {r.nf || 'N/A'}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {r.nf_saida ? (
                              <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-blue-700 dark:text-blue-300">
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200">
                                  SAÍDA
                                </span>
                                {r.nf_saida}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 font-mono text-[10px] text-amber-600 dark:text-amber-400 italic">
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 not-italic">
                                  SAÍDA
                                </span>
                                Pendente
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 font-mono text-xs whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-slate-700 dark:text-slate-300 font-bold">
                            E: {dataEntrada || '-'}
                          </span>
                          <span className={`${dataSaida ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-400 italic'}`}>
                            S: {dataSaida || 'Em aberto'}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {r.motivo}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {r.origem_do_bloqueio}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-right font-bold">
                        <div className="flex flex-col items-end">
                          <span className="text-purple-700 dark:text-purple-300 font-black">
                            {r.qtd_em_plts ? `${r.qtd_em_plts} it` : '1 it'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {r.qtde_bloq_cx} cx ({Number(r.qtde_bloq_hl || 0).toFixed(2)} HL)
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {r.valor > 0 ? `R$ ${r.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'R$ 0,00'}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-black ${
                              r.dias_no_pnc >= 30
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300 ring-1 ring-rose-400'
                                : r.dias_no_pnc >= 15
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                            }`}
                          >
                            {r.dias_no_pnc}d
                          </span>
                          {isAcima30 && !isDevolucao && !isLiberado && !isDespejo && (
                            <span className="text-[9px] font-black text-rose-600 dark:text-rose-400 tracking-tight">
                              DESPEJO
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                            isDespejo
                              ? 'bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-300 border border-red-400'
                              : isBlocked
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                              : isDevolucao
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
                              : isLiberado
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                              : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-700 dark:text-slate-300">
                        {r.respons_vel}
                      </td>
                      <td className="p-3 text-center" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={e => handleOpenTreatment(r, e)}
                            title="Realizar Tratativa (Datas Entrada/Saída, Status, Ação)"
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white cursor-pointer transition-all inline-flex items-center gap-1 text-[11px] font-bold"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span className="hidden xl:inline">Tratativa</span>
                          </button>

                          <button
                            type="button"
                            onClick={e => handleOpenNfEdit(r, e)}
                            title="Inserir ou editar NF de Saída no Acompanhamento"
                            className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/80 border border-blue-200 dark:border-blue-800 cursor-pointer transition-all inline-flex items-center gap-1 text-[11px] font-bold"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span className="hidden xl:inline">NF</span>
                          </button>

                          {isAcima30 && !isDevolucao && !isLiberado && !isDespejo && (
                            <button
                              type="button"
                              onClick={e => handleDirectDespejo(r.n_bloqueio, e)}
                              title="Encaminhar para DESPEJO imediato (>30 dias no PNC)"
                              className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white cursor-pointer transition-all inline-flex items-center gap-1 text-[10px] font-black uppercase shadow-xs animate-pulse"
                            >
                              <Flame className="w-3.5 h-3.5" />
                              <span className="hidden xl:inline">Despejo</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={e => handleDeleteSingle(r.n_bloqueio, r.descri_o, e)}
                            title="Excluir este item do PNC (caso importado por erro)"
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 dark:hover:text-white cursor-pointer transition-all inline-flex items-center gap-1 text-[11px] font-bold"
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

      {/* MODAL DE IMPORTAÇÃO & ATUALIZAÇÃO DO ARQUIVO JSON */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#151b23] border border-slate-200 dark:border-[#222d3a] rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#222d3a] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base uppercase text-slate-900 dark:text-white">
                    Importar / Atualizar Base de Dados JSON
                  </h3>
                  <p className="text-xs text-slate-400">
                    Selecione um arquivo .json ou cole o conteúdo JSON com os registros de PNC.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* AÇÕES DE IMPORTAÇÃO */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".json,application/json"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-50 dark:bg-[#0d1117] border-2 border-dashed border-slate-300 dark:border-[#222d3a] hover:border-amber-500 dark:hover:border-amber-500 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Upload className="w-4 h-4 text-amber-500" />
                  <span>Escolher Arquivo .JSON do Computador</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadSampleJson}
                  className="px-3.5 py-3 rounded-xl bg-slate-100 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer"
                  title="Baixar modelo JSON do formato esperado"
                >
                  <Download className="w-4 h-4 text-blue-500" />
                  <span>Baixar Modelo JSON</span>
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">
                  Ou Cole o Conteúdo JSON Diretamente Abaixo:
                </label>
                <textarea
                  value={jsonInputText}
                  onChange={e => setJsonInputText(e.target.value)}
                  placeholder='Cole o JSON aqui... Ex: { "registros": [ { "n_bloqueio": "4-9274-858", "produto": 9274, ... } ] }'
                  rows={8}
                  className="w-full p-3 font-mono text-xs rounded-xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {importStatus.type !== 'idle' && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                    importStatus.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                  }`}
                >
                  {importStatus.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                  )}
                  <span>{importStatus.message}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-[#222d3a]">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!jsonInputText.trim()}
                onClick={() => handleImportJson(jsonInputText)}
                className="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 shadow-md cursor-pointer transition-all"
              >
                Processar & Atualizar Base
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO DE NOTA FISCAL DE SAÍDA / ENTRADA */}
      {editingNfTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#151b23] border border-slate-200 dark:border-[#222d3a] rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#222d3a] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base uppercase text-slate-900 dark:text-white">
                    Acompanhamento de NF — Bloqueio Nº {editingNfTarget.n_bloqueio}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    {editingNfTarget.descri_o} | {editingNfTarget.fab_origem}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingNfTarget(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNf} className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Volume Bloqueado</span>
                  <p className="font-bold text-slate-900 dark:text-white">{editingNfTarget.qtde_bloq_cx} CX ({Number(editingNfTarget.qtde_bloq_hl).toFixed(2)} HL)</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Valor Total</span>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400">R$ {editingNfTarget.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Status</span>
                  <p className="font-bold text-blue-600 dark:text-blue-400">{editingNfTarget.status}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Nota Fiscal de Saída (Devolução / Expedição)</span>
                  <span className="text-[10px] font-bold text-blue-500">Campo Principal</span>
                </label>
                <input
                  type="text"
                  value={nfSaidaInput}
                  onChange={e => setNfSaidaInput(e.target.value)}
                  placeholder="Ex: 85942, 105842..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] text-slate-900 dark:text-white font-mono text-sm placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-bold"
                  autoFocus
                />
                <p className="text-[11px] text-slate-400">
                  Insira o número da NF de saída gerada para a devolução ou transferência deste lote de PNC.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-slate-700 dark:text-slate-300">
                  Nota Fiscal de Origem (Fábrica / Entrada)
                </label>
                <input
                  type="text"
                  value={nfEntradaInput}
                  onChange={e => setNfEntradaInput(e.target.value)}
                  placeholder="Ex: 1040346..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] text-slate-900 dark:text-white font-mono text-sm placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {nfSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{nfSuccessMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-[#222d3a]">
                <button
                  type="button"
                  onClick={() => setEditingNfTarget(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-blue-600 hover:bg-blue-500 text-white shadow-md cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Gravar NF no Acompanhamento</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DRAWER / MODAL DE DETALHES DO REGISTRO SELECIONADO */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#151b23] border border-slate-200 dark:border-[#222d3a] rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#222d3a] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base uppercase text-slate-900 dark:text-white">
                    Detalhes do Bloqueio Nº {selectedRecord.n_bloqueio}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    SKU: {selectedRecord.produto} | Operação: {selectedRecord.opera_o || 'GUARABIRA'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0d1117] space-y-0.5">
                <span className="text-[10px] font-black uppercase text-slate-400">Produto & Descrição</span>
                <p className="font-extrabold text-slate-900 dark:text-white">{selectedRecord.descri_o}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0d1117] space-y-0.5">
                <span className="text-[10px] font-black uppercase text-slate-400">Fábrica / Origem</span>
                <p className="font-bold text-slate-900 dark:text-white">{selectedRecord.fab_origem}</p>
              </div>

              {/* CARD DE NOTAS FISCAIS COM CORRELAÇÃO FÁBRICA / REVENDA E AÇÃO DIRETA */}
              <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-[#121d2f] border border-blue-200/80 dark:border-blue-900/60 col-span-2 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    Correlação Fiscal & Logística: Origem Fábrica ➔ Destino Revenda
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenNfEdit(selectedRecord)}
                    className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[10px] font-black uppercase hover:bg-blue-500 cursor-pointer flex items-center gap-1 shadow-xs transition-all"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>{selectedRecord.nf_saida ? 'Editar NF Revenda' : 'Inserir NF Revenda'}</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-white dark:bg-[#151b23] border border-slate-200 dark:border-[#222d3a]">
                    <span className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 block">
                      Origem: {selectedRecord.fab_origem}
                    </span>
                    <div className="mt-1 flex items-baseline justify-between">
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">NF Fábrica (Entrada):</span>
                      <span className="font-mono font-black text-slate-900 dark:text-white text-sm">
                        {selectedRecord.nf || 'Não informada'}
                      </span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white dark:bg-[#151b23] border border-slate-200 dark:border-[#222d3a]">
                    <span className="text-[9px] font-black uppercase text-slate-500 dark:text-slate-400 block">
                      Destino: {selectedRecord.opera_o || 'REVENDA / CDD'}
                    </span>
                    <div className="mt-1 flex items-baseline justify-between">
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">NF Revenda (Saída):</span>
                      {selectedRecord.nf_saida ? (
                        <span className="font-mono font-black text-blue-600 dark:text-blue-400 text-sm">
                          {selectedRecord.nf_saida}
                        </span>
                      ) : (
                        <span className="font-mono text-amber-600 dark:text-amber-400 font-bold italic text-xs">
                          Pendente de emissão
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0d1117] space-y-0.5">
                <span className="text-[10px] font-black uppercase text-slate-400">Data Chegada & Bloqueio</span>
                <p className="font-bold text-slate-900 dark:text-white">
                  Chegada: {selectedRecord.data_da_chegada}
                </p>
                <p className="font-bold text-slate-900 dark:text-white">
                  Bloqueio: {selectedRecord.data_do_bloqueio}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0d1117] space-y-0.5">
                <span className="text-[10px] font-black uppercase text-slate-400">Dias no PNC (Permanência)</span>
                <p className="font-black text-base text-rose-600 dark:text-rose-400">
                  {selectedRecord.dias_no_pnc} dias
                </p>
                <p className="text-[10px] text-slate-400 font-medium">
                  {selectedRecord.data_da_libera_o ? `Liberado em: ${selectedRecord.data_da_libera_o}` : 'Ainda não liberado (Calculado até data atual)'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0d1117] space-y-0.5">
                <span className="text-[10px] font-black uppercase text-slate-400">Volume Bloqueado</span>
                <p className="font-extrabold text-slate-900 dark:text-white">
                  {selectedRecord.qtde_bloq_cx} CX ({Number(selectedRecord.qtde_bloq_hl || 0).toFixed(2)} HL)
                </p>
                <p className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">
                  {selectedRecord.qtd_em_plts ? `${selectedRecord.qtd_em_plts} Itens no PNC` : '1 Item no PNC'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0d1117] space-y-0.5">
                <span className="text-[10px] font-black uppercase text-slate-400">Valor Total</span>
                <p className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                  R$ {selectedRecord.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-[10px] text-slate-400 font-medium">
                  Retido: {selectedRecord.qtde_retida ?? 0} | Liberado: {selectedRecord.qtde_liberada ?? 0}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0d1117] col-span-2 space-y-0.5">
                <span className="text-[10px] font-black uppercase text-slate-400">Motivo & Origem do Bloqueio</span>
                <p className="font-extrabold text-slate-900 dark:text-white">
                  {selectedRecord.motivo} — Origem: {selectedRecord.origem_do_bloqueio}
                </p>
                <p className="text-[10px] text-slate-400 font-medium">Emissor: {selectedRecord.emissor}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0d1117] col-span-2 space-y-0.5">
                <span className="text-[10px] font-black uppercase text-slate-400">Ação & Responsável</span>
                <p className="font-extrabold text-slate-900 dark:text-white">{selectedRecord.a_o}</p>
                <p className="text-[10px] text-blue-500 font-bold">
                  Responsável: {selectedRecord.respons_vel} | Status: {selectedRecord.status}
                </p>
              </div>

              {selectedRecord.observa_o && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0d1117] col-span-2 space-y-0.5">
                  <span className="text-[10px] font-black uppercase text-slate-400">Observação</span>
                  <p className="font-medium text-slate-700 dark:text-slate-300">{selectedRecord.observa_o}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-[#222d3a] flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleOpenTreatment(selectedRecord)}
                  className="px-3.5 py-2 rounded-xl text-xs font-black uppercase bg-blue-600 hover:bg-blue-500 text-white cursor-pointer flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Realizar Tratativa / Alterar Datas</span>
                </button>

                {isPncAcima30Dias(selectedRecord) && !selectedRecord.status.toUpperCase().includes('DEVOLUÇÃO') && !selectedRecord.status.toUpperCase().includes('LIBERADO') && !selectedRecord.status.toUpperCase().includes('DESPEJO') && (
                  <button
                    type="button"
                    onClick={() => handleDirectDespejo(selectedRecord.n_bloqueio)}
                    className="px-3.5 py-2 rounded-xl text-xs font-black uppercase bg-rose-600 hover:bg-rose-500 text-white cursor-pointer flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <Flame className="w-3.5 h-3.5" />
                    <span>Encaminhar p/ Despejo (&gt;30d)</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleDeleteSingle(selectedRecord.n_bloqueio, selectedRecord.descri_o)}
                  className="px-3.5 py-2 rounded-xl text-xs font-black uppercase bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 cursor-pointer flex items-center gap-1.5 transition-all"
                  title="Excluir este item da base de PNC (caso importado por erro)"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>Excluir Item</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE INCLUSÃO MANUAL DE NOVO ITEM NO ACOMPANHAMENTO PNC */}
      {showNewItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-[#151b23] border border-slate-200 dark:border-[#222d3a] rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#222d3a] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base uppercase text-slate-900 dark:text-white">
                    Incluir Novo Item no Acompanhamento PNC
                  </h3>
                  <p className="text-xs text-slate-400">
                    Cadastre um novo item/chamado de não conformidade com datas de entrada e saída.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNewItemModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewItem} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 block mb-1">
                    Nº Bloqueio / Chamado *
                  </label>
                  <input
                    type="text"
                    required
                    value={newItemForm.n_bloqueio}
                    onChange={e => setNewItemForm(prev => ({ ...prev, n_bloqueio: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 block mb-1">
                    Operação / CDD
                  </label>
                  <input
                    type="text"
                    value={newItemForm.opera_o}
                    onChange={e => setNewItemForm(prev => ({ ...prev, opera_o: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 block mb-1">
                    Mês de Referência
                  </label>
                  <select
                    value={newItemForm.m_s}
                    onChange={e => setNewItemForm(prev => ({ ...prev, m_s: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] text-slate-900 dark:text-white font-bold"
                  >
                    {['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 block mb-1">
                    Código SKU / Produto
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 5174"
                    value={newItemForm.produto}
                    onChange={e => setNewItemForm(prev => ({ ...prev, produto: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 block mb-1">
                    Descrição do Produto *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: BRAHMA CHOPP 350ML CX 12UN"
                    value={newItemForm.descri_o}
                    onChange={e => setNewItemForm(prev => ({ ...prev, descri_o: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] text-slate-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 block mb-1">
                    Fábrica / Origem do Fornecimento
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: AGUAS CLARAS, ITAPISSUMA..."
                    value={newItemForm.fab_origem}
                    onChange={e => setNewItemForm(prev => ({ ...prev, fab_origem: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 block mb-1">
                    Motivo do Bloqueio
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: DATA CURTA, AVARIA, VAZAMENTO..."
                    value={newItemForm.motivo}
                    onChange={e => setNewItemForm(prev => ({ ...prev, motivo: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] text-slate-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              {/* SEÇÃO DE DATAS DE ENTRADA E SAÍDA PARA TRATATIVA */}
              <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-[#121d2f] border border-blue-200/80 dark:border-blue-900/60 space-y-2.5">
                <span className="text-[11px] font-black uppercase text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Datas do Ciclo PNC (Entrada no Armazém & Saída / Liberação)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-400 block mb-1">
                      Data de Chegada / Entrada *
                    </label>
                    <input
                      type="date"
                      required
                      value={newItemForm.data_da_chegada}
                      onChange={e => setNewItemForm(prev => ({ ...prev, data_da_chegada: e.target.value, data_do_bloqueio: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#151b23] border border-slate-200 dark:border-[#222d3a] text-slate-900 dark:text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-400 block mb-1">
                      Data do Bloqueio
                    </label>
                    <input
                      type="date"
                      value={newItemForm.data_do_bloqueio}
                      onChange={e => setNewItemForm(prev => ({ ...prev, data_do_bloqueio: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#151b23] border border-slate-200 dark:border-[#222d3a] text-slate-900 dark:text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-400 block mb-1">
                      Data de Saída / Liberação (Opcional)
                    </label>
                    <input
                      type="date"
                      value={newItemForm.data_da_libera_o}
                      onChange={e => setNewItemForm(prev => ({ ...prev, data_da_libera_o: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#151b23] border border-slate-200 dark:border-[#222d3a] text-slate-900 dark:text-white font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* SEÇÃO FISCAL: NF ENTRADA E NF SAÍDA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 block mb-1">
                    NF Origem Fábrica (Entrada)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 1045982"
                    value={newItemForm.nf}
                    onChange={e => setNewItemForm(prev => ({ ...prev, nf: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 block mb-1">
                    NF Saída / Revenda (Expedição / Devolução)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 85942"
                    value={newItemForm.nf_saida}
                    onChange={e => setNewItemForm(prev => ({ ...prev, nf_saida: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>
              </div>

              {/* SEÇÃO DE QUANTIDADE DE ITENS, CAIXAS, HL E VALOR */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="text-[11px] font-black uppercase text-purple-700 dark:text-purple-300 block mb-1">
                    Qtd Itens *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newItemForm.qtd_em_plts}
                    onChange={e => setNewItemForm(prev => ({ ...prev, qtd_em_plts: Number(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200 font-bold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 block mb-1">
                    Qtd Caixas (CX)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newItemForm.qtde_bloq_cx}
                    onChange={e => setNewItemForm(prev => ({ ...prev, qtde_bloq_cx: Number(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 block mb-1">
                    Volume HL
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newItemForm.qtde_bloq_hl}
                    onChange={e => setNewItemForm(prev => ({ ...prev, qtde_bloq_hl: Number(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase text-emerald-700 dark:text-emerald-300 block mb-1">
                    Valor (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newItemForm.valor}
                    onChange={e => setNewItemForm(prev => ({ ...prev, valor: Number(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-bold"
                  />
                </div>
              </div>

              {/* SEÇÃO DE STATUS, TRATATIVA E RESPONSÁVEL */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 block mb-1">
                    Status da Tratativa
                  </label>
                  <select
                    value={newItemForm.status}
                    onChange={e => setNewItemForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] text-slate-900 dark:text-white font-bold"
                  >
                    <option value="BLOQUEADO">BLOQUEADO</option>
                    <option value="EM TRATATIVA">EM TRATATIVA</option>
                    <option value="DEVOLUÇÃO FÁBRICA">DEVOLUÇÃO FÁBRICA</option>
                    <option value="LIBERADO">LIBERADO</option>
                    <option value="DESPEJO">DESPEJO (&gt;30 DIAS)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 block mb-1">
                    Ação / Tratativa
                  </label>
                  <input
                    type="text"
                    value={newItemForm.a_o}
                    onChange={e => setNewItemForm(prev => ({ ...prev, a_o: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 block mb-1">
                    Responsável
                  </label>
                  <input
                    type="text"
                    value={newItemForm.respons_vel}
                    onChange={e => setNewItemForm(prev => ({ ...prev, respons_vel: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] text-slate-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 block mb-1">
                  Observações Adicionais (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={newItemForm.observa_o}
                  onChange={e => setNewItemForm(prev => ({ ...prev, observa_o: e.target.value }))}
                  placeholder="Detalhes adicionais sobre o lote, motivo da tratativa..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] text-slate-900 dark:text-white text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-[#222d3a]">
                <button
                  type="button"
                  onClick={() => setShowNewItemModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Cadastrar Item no Acompanhamento</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE TRATATIVA COMPLETA (DATAS DE ENTRADA/SAÍDA, STATUS, NF E AÇÕES) */}
      {editingTreatmentTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-[#151b23] border border-slate-200 dark:border-[#222d3a] rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#222d3a] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base uppercase text-slate-900 dark:text-white">
                    Realizar Tratativa — Bloqueio Nº {editingTreatmentTarget.n_bloqueio}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    {editingTreatmentTarget.descri_o} | {editingTreatmentTarget.fab_origem}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingTreatmentTarget(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTreatment} className="space-y-4">
              {/* ALERTA >30 DIAS SE APLICÁVEL */}
              {isPncAcima30Dias(editingTreatmentTarget) && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-rose-800 dark:text-rose-300 font-bold">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>Item com mais de 30 dias no PNC. Recomendado encaminhar para DESPEJO.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setTreatmentForm(prev => ({ ...prev, status: 'DESPEJO', a_o: 'ENCAMINHADO PARA DESPEJO (>30 DIAS PNC)', data_saida: new Date().toISOString().substring(0, 10) }));
                    }}
                    className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-black text-[10px] uppercase cursor-pointer shrink-0"
                  >
                    Definir Despejo
                  </button>
                </div>
              )}

              {/* DATAS DE ENTRADA E SAÍDA */}
              <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-[#121d2f] border border-blue-200/80 dark:border-blue-900/60 space-y-2">
                <span className="text-[11px] font-black uppercase text-blue-700 dark:text-blue-300 flex items-center gap-1">
                  <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Datas de Movimentação do Item
                </span>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-400 block mb-1">
                      Data de Entrada (Chegada) *
                    </label>
                    <input
                      type="date"
                      required
                      value={treatmentForm.data_da_chegada}
                      onChange={e => setTreatmentForm(prev => ({ ...prev, data_da_chegada: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#151b23] border border-slate-200 dark:border-[#222d3a] text-slate-900 dark:text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-400 block mb-1">
                      Data de Saída / Liberação
                    </label>
                    <input
                      type="date"
                      value={treatmentForm.data_saida}
                      onChange={e => setTreatmentForm(prev => ({ ...prev, data_saida: e.target.value, data_da_libera_o: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#151b23] border border-slate-200 dark:border-[#222d3a] text-slate-900 dark:text-white font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* NOTAS FISCAIS */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 block mb-1">
                    NF Entrada (Fábrica)
                  </label>
                  <input
                    type="text"
                    value={treatmentForm.nf}
                    onChange={e => setTreatmentForm(prev => ({ ...prev, nf: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 block mb-1">
                    NF Saída (Devolução / Expedição)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 85942"
                    value={treatmentForm.nf_saida}
                    onChange={e => setTreatmentForm(prev => ({ ...prev, nf_saida: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>
              </div>

              {/* STATUS E AÇÃO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 block mb-1">
                    Status Atual do Bloqueio
                  </label>
                  <select
                    value={treatmentForm.status}
                    onChange={e => setTreatmentForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] text-slate-900 dark:text-white font-bold"
                  >
                    <option value="BLOQUEADO">BLOQUEADO</option>
                    <option value="EM TRATATIVA">EM TRATATIVA</option>
                    <option value="DEVOLUÇÃO FÁBRICA">DEVOLUÇÃO FÁBRICA</option>
                    <option value="LIBERADO">LIBERADO</option>
                    <option value="DESPEJO">DESPEJO (&gt;30 DIAS PNC)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 block mb-1">
                    Responsável
                  </label>
                  <input
                    type="text"
                    value={treatmentForm.respons_vel}
                    onChange={e => setTreatmentForm(prev => ({ ...prev, respons_vel: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] text-slate-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 block mb-1">
                  Ação / Resolução da Tratativa
                </label>
                <input
                  type="text"
                  value={treatmentForm.a_o}
                  onChange={e => setTreatmentForm(prev => ({ ...prev, a_o: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-[11px] font-black uppercase text-purple-700 dark:text-purple-300 block mb-1">
                    Qtd Itens
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={treatmentForm.qtd_em_plts}
                    onChange={e => setTreatmentForm(prev => ({ ...prev, qtd_em_plts: Number(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] text-purple-800 dark:text-purple-200 font-bold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 block mb-1">
                    Qtd CX
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={treatmentForm.qtde_bloq_cx}
                    onChange={e => setTreatmentForm(prev => ({ ...prev, qtde_bloq_cx: Number(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase text-emerald-700 dark:text-emerald-300 block mb-1">
                    Valor (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={treatmentForm.valor}
                    onChange={e => setTreatmentForm(prev => ({ ...prev, valor: Number(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] text-emerald-800 dark:text-emerald-200 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-slate-700 dark:text-slate-300 block mb-1">
                  Observação
                </label>
                <textarea
                  rows={2}
                  value={treatmentForm.observa_o}
                  onChange={e => setTreatmentForm(prev => ({ ...prev, observa_o: e.target.value }))}
                  placeholder="Observação da tratativa realizada..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-[#222d3a] text-slate-900 dark:text-white text-xs"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-[#222d3a] flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleDeleteSingle(editingTreatmentTarget.n_bloqueio, editingTreatmentTarget.descri_o);
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-black uppercase bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 cursor-pointer flex items-center gap-1.5 transition-all"
                  title="Excluir este item da base PNC"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>Excluir Item</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingTreatmentTarget(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-blue-600 hover:bg-blue-500 text-white shadow-md cursor-pointer transition-all flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>Salvar Tratativa</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestaoPncPlatform;
