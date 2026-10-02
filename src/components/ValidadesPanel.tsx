import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { isCustomFirebaseConnected } from '../firebase';
import { ValidadesRepository } from '../db';
import { Usuario, Empresa, ValidadeRow } from '../types';
import { useEmpresaData } from '../context/EmpresaDataContext';
import { PRODUCTS } from '../planosData';
import { getAvailableProductsForConferente, AvailableProductOption } from '../utils/productCatalogData';
import { SopBannerViewer } from './SopBannerViewer';
import { filterHistoryForUser, HistoryRestrictionNotice } from '../utils/historyFilter';
import { calcularQuebrasFefoEstoqueXEstoque, calcularQuebrasFefoEstoqueXPicking } from '../utils/matrizBlocos';
import { getPackagingInfo, calcularTotalCaixas } from '../data/coletaPackagingData';
import { 
  syncFefoDemandsFromValidades, 
  getStoredFefoDemands,
  requestFefoDemand,
  requestAllFefoDemands,
  cancelFefoDemandRequest
} from '../utils/fefoDemandManager';
import {
  getSemanaInfoFromDate,
  getSemanaDoMesFromDate,
  getMesKeyFromDate,
  syncValidadesListToMonthlyColetas
} from '../utils/stockAgeMonthlyManager';
import StockAgeIndexTab from './StockAgeIndexTab';
import FuturoShelfTab from './FuturoShelfTab';
import GestaoEscoamentoTab from './GestaoEscoamentoTab';
import { WorkstationCriticosRecolhimento } from './WorkstationCriticosRecolhimento';
import { getInitialDefaultValidades, removeLegacySeedValidades, formatDateToBR } from '../utils/fefoDefaultData';
import { encaminharItemParaPnc } from '../utils/gestaoPncManager';
import Import030519Modal from './Import030519Modal';
import { syncEntityToPublic } from '../services/bancoDadosSyncClient';
import { ModalRetiradaValidade } from './ModalRetiradaValidade';
import { ValidadesRetiradasTab } from './ValidadesRetiradasTab';
import { checkValidadesPendentesRetirada, ValidadeRetiradaRecord } from '../utils/validadesRetiradasManager';

export const getTodayDDMMYYYY = (): string => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  return `${day}/${month}/${year}`;
};

interface ValidadesPanelProps {
  user: Usuario;
  empresa: Empresa | null;
  theme?: 'light' | 'dark';
  hideSugerirMelhoria?: boolean;
}

export default function ValidadesPanel({ user, empresa, hideSugerirMelhoria, theme = 'light' }: ValidadesPanelProps) {
  const empresaId = empresa?.id || 'demo';
  const draftKey = `validades_draft_${empresaId}_${user.nome || 'guest'}`;
  const [showImport030519Modal, setShowImport030519Modal] = useState(false);

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

  const formatISODateToInput = (isoStr: string): string => {
    if (!isoStr) return '';
    const parts = isoStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return isoStr;
  };

  const parseInputDateToISO = (dateStr: string): string | null => {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    let [dayStr, monthStr, yearStr] = parts;
    if (!dayStr || !monthStr || !yearStr) return null;
    const d = dayStr.padStart(2, '0');
    const m = monthStr.padStart(2, '0');
    let y = yearStr;
    if (y.length === 2) {
      y = '20' + y;
    }
    if (y.length !== 4) return null;
    const isoDate = `${y}-${m}-${d}`;
    const timestamp = Date.parse(isoDate + 'T00:00:00');
    if (isNaN(timestamp)) return null;
    return isoDate;
  };

  const [produtoBusca, setProdutoBusca] = useState<string>(() => getDraftValue('produtoBusca', ''));
  const [selectedProd, setSelectedProd] = useState<{ codigo: number, descricao: string } | null>(() => getDraftValue('selectedProd', null));
  const [showDropdown, setShowProdDropdown] = useState(false);

  const [palhete, setPalhete] = useState<number>(() => getDraftValue('palhete', 0));
  const [lastro, setLastro] = useState<number>(() => getDraftValue('lastro', 0));
  const [caixa, setCaixa] = useState<number>(() => getDraftValue('caixa', 0));
  const [validade, setValidade] = useState<string>(() => getDraftValue('validade', ''));
  const [validadeInput, setValidadeInput] = useState<string>(() => {
    const val = getDraftValue('validade', '');
    return formatISODateToInput(val);
  });
  const [localizacao, setLocalizacao] = useState<string>(() => getDraftValue('localizacao', 'central'));
  const [bloco, setBloco] = useState<string>(() => getDraftValue('bloco', ''));
  const [dataColetaInput, setDataColetaInput] = useState<string>(() => {
    const val = getDraftValue('dataColetaInput', '');
    // Se o valor salvo em rascunho for a data antiga fixa (28/08/2026, 27/08/2026, 21/08/2026) ou vazio, sempre usar a data de HOJE
    if (!val || val === '28/08/2026' || val === '27/08/2026' || val === '21/08/2026') {
      return getTodayDDMMYYYY();
    }
    return val;
  });

  const [minimizeDataRecolha, setMinimizeDataRecolha] = useState<boolean>(() => {
    try {
      return localStorage.getItem('validades_minimize_recolha') === 'true';
    } catch {
      return false;
    }
  });

  const [minimizeCalculoCaixas, setMinimizeCalculoCaixas] = useState<boolean>(() => {
    try {
      return localStorage.getItem('validades_minimize_calc') === 'true';
    } catch {
      return false;
    }
  });

  const semanaColetaInfo = React.useMemo(() => {
    return getSemanaInfoFromDate(dataColetaInput);
  }, [dataColetaInput]);

  const [filterSemana, setFilterSemana] = useState<'todas' | number>('todas');

  const handleDataColetaChange = (val: string) => {
    const cleaned = val.replace(/[^\d/]/g, '');
    const digits = val.replace(/\D/g, '');
    let formatted = '';
    if (digits.length > 0) {
      formatted += digits.slice(0, 2);
    }
    if (digits.length > 2) {
      formatted += '/' + digits.slice(2, 4);
    }
    if (digits.length > 4) {
      formatted += '/' + digits.slice(4, 8);
    }
    const finalVal = formatted || cleaned;
    setDataColetaInput(finalVal);
  };

  const [activeTab, setActiveTab] = useState<'form' | 'lista' | 'stock_age' | 'futuro_shelf' | 'escoamento' | 'fefo_quadro' | 'fefo_picking' | 'fefo_estoque' | 'retiradas'>('form');
  const [validadesList, setValidadesList] = useState<ValidadeRow[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Estados de Retirada Física de Validades (Baixa Conferente)
  const [showRetiradaModal, setShowRetiradaModal] = useState<boolean>(false);
  const [retiradaTargetItem, setRetiradaTargetItem] = useState<ValidadeRow | null>(null);

  const validadesPendentesRetirada = useMemo(() => {
    return checkValidadesPendentesRetirada(validadesList);
  }, [validadesList]);

  const handleAbrirRetirada = (r: ValidadeRow) => {
    setRetiradaTargetItem(r);
    setShowRetiradaModal(true);
  };

  const handleRetiradaSuccess = (record: ValidadeRetiradaRecord) => {
    toast(`✅ Validade de ${record.validade} (${record.descricao}) retirada com sucesso pelo Conferente!`);
    const targetCod = String(record.codigo).replace(/^0+/, '').trim();
    const remaining = validadesList.filter(item => {
      const itemCod = String(item.codigo).replace(/^0+/, '').trim();
      const itemVal = formatDateToBR(item.validade);
      return !(targetCod === itemCod && itemVal === record.validade);
    });
    setValidadesList(remaining);
  };

  // Filtros personalizados para Estoque x Estoque
  const [fefoEstoqueStartDate, setFefoEstoqueStartDate] = useState<string>('');
  const [fefoEstoqueEndDate, setFefoEstoqueEndDate] = useState<string>('');
  const [fefoEstoqueSemana, setFefoEstoqueSemana] = useState<'todas' | number>('todas');
  const [fefoEstoqueSearch, setFefoEstoqueSearch] = useState<string>('');
  const [fefoEstoqueViewMode, setFefoEstoqueViewMode] = useState<'lista' | 'cards'>('lista');

  // Filtros personalizados para Estoque x Picking
  const [fefoPickingStartDate, setFefoPickingStartDate] = useState<string>('');
  const [fefoPickingEndDate, setFefoPickingEndDate] = useState<string>('');
  const [fefoPickingSemana, setFefoPickingSemana] = useState<'todas' | number>('todas');
  const [fefoPickingSearch, setFefoPickingSearch] = useState<string>('');
  const [fefoPickingViewMode, setFefoPickingViewMode] = useState<'lista' | 'cards'>('lista');

  // Immediate notification modal for FEFO breaks upon entry or import
  const [importBreaksModalData, setImportBreaksModalData] = useState<{
    isOpen: boolean;
    title: string;
    source: 'single' | 'import';
    pickingBreaks: any[];
    estoqueBreaks: any[];
  } | null>(null);

  // Modal for inspecting specific product FEFO lot details
  const [selectedProductAlert, setSelectedProductAlert] = useState<{
    codigo: string;
    descricao: string;
  } | null>(null);

  // Helper para filtrar validades antes do cálculo de quebras
  const filterRowsForFefo = (
    rows: ValidadeRow[],
    startDate: string,
    endDate: string,
    semana: 'todas' | number,
    search: string
  ) => {
    return rows.filter(r => {
      // 1. Filtro por Semana
      if (semana !== 'todas') {
        const sem = r.semanaNumero || getSemanaDoMesFromDate(r.dataColeta || r.validade || getTodayDDMMYYYY());
        if (sem !== semana) return false;
      }

      // 2. Filtro por intervalo de datas (data de coleta / cadastro / validade)
      if (startDate || endDate) {
        let rowDate = '';
        if (r.dataColeta) {
          if (r.dataColeta.includes('/')) {
            const parts = r.dataColeta.split('/');
            if (parts.length === 3) rowDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
          } else {
            rowDate = r.dataColeta;
          }
        }
        if (!rowDate && r.cadastradoEm) {
          rowDate = r.cadastradoEm.split('T')[0];
        }
        if (!rowDate && r.validade) {
          rowDate = r.validade;
        }

        if (startDate && rowDate && rowDate < startDate) return false;
        if (endDate && rowDate && rowDate > endDate) return false;
      }

      // 3. Busca por texto
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const match = 
          String(r.codigo).toLowerCase().includes(q) ||
          (r.descricao || '').toLowerCase().includes(q) ||
          (r.bloco || '').toLowerCase().includes(q) ||
          (r.localizacao || '').toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  };

  const filteredValidadesEstoque = React.useMemo(() => {
    return filterRowsForFefo(validadesList, fefoEstoqueStartDate, fefoEstoqueEndDate, fefoEstoqueSemana, fefoEstoqueSearch);
  }, [validadesList, fefoEstoqueStartDate, fefoEstoqueEndDate, fefoEstoqueSemana, fefoEstoqueSearch]);

  const quebrasFefoEstoque = React.useMemo(() => {
    return calcularQuebrasFefoEstoqueXEstoque(filteredValidadesEstoque);
  }, [filteredValidadesEstoque]);

  const filteredValidadesPicking = React.useMemo(() => {
    return filterRowsForFefo(validadesList, fefoPickingStartDate, fefoPickingEndDate, fefoPickingSemana, fefoPickingSearch);
  }, [validadesList, fefoPickingStartDate, fefoPickingEndDate, fefoPickingSemana, fefoPickingSearch]);

  const quebrasFefoPicking = React.useMemo(() => {
    return calcularQuebrasFefoEstoqueXPicking(filteredValidadesPicking);
  }, [filteredValidadesPicking]);

  // FEFO relocation demands state & automatic sync
  const [fefoDemands, setFefoDemands] = useState(() => getStoredFefoDemands(empresaId));

  useEffect(() => {
    if (validadesList) {
      const synced = syncFefoDemandsFromValidades(empresaId, validadesList);
      setFefoDemands(synced);
    }
  }, [validadesList, empresaId]);

  useEffect(() => {
    const handleFefoUpdate = () => {
      setFefoDemands(getStoredFefoDemands(empresaId));
    };
    window.addEventListener('fefo_demands_updated', handleFefoUpdate);
    window.addEventListener('storage', handleFefoUpdate);
    window.addEventListener('local_data_changed', handleFefoUpdate);
    return () => {
      window.removeEventListener('fefo_demands_updated', handleFefoUpdate);
      window.removeEventListener('storage', handleFefoUpdate);
      window.removeEventListener('local_data_changed', handleFefoUpdate);
    };
  }, [empresaId]);

  const renderDelegationStatus = (
    tipoQuebra: 'estoque_x_picking' | 'estoque_x_estoque',
    codigo: string
  ) => {
    const cod = String(codigo).trim();
    const matching = fefoDemands.find(d => 
      String(d.codigo).trim() === cod &&
      d.tipoQuebra === tipoQuebra
    );

    if (!matching || !matching.solicitadoPorConferente) {
      return (
        <div className="p-3 bg-slate-50 dark:bg-[#0d1218] border border-slate-200 dark:border-[#222d3a] rounded-xl flex items-center justify-between text-xs mt-2.5 flex-wrap gap-2">
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
            Demanda para Empilhador:
          </span>
          <button
            type="button"
            onClick={() => {
              if (matching) {
                requestFefoDemand(empresaId, matching.id, user.nome || 'Conferente');
              } else {
                requestAllFefoDemands(empresaId, user.nome || 'Conferente');
              }
              setFefoDemands(getStoredFefoDemands(empresaId));
            }}
            className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-[11px] uppercase tracking-wider rounded-lg flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
          >
            🚜 Delegar Realocação ao Empilhador
          </button>
        </div>
      );
    }

    return (
      <div className="p-3 bg-slate-50 dark:bg-[#0d1218] border border-slate-200 dark:border-[#222d3a] rounded-xl flex items-center justify-between text-xs mt-2.5 flex-wrap gap-2">
        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
          Status Visão Empilhador:
        </span>
        {matching.status === 'done' ? (
          <span className="text-[11px] font-black text-emerald-800 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/20 px-2.5 py-1 rounded-lg">
            ✓ Realocação Concluída por {matching.operadorExecutor || 'Empilhador'} ({matching.duracaoMin || 1} min)
          </span>
        ) : matching.status === 'in_progress' ? (
          <span className="text-[11px] font-black text-amber-800 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/20 px-2.5 py-1 rounded-lg animate-pulse">
            🚜 Em Andamento por {matching.operadorExecutor || 'Empilhador'}
          </span>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black text-amber-900 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/20 px-2.5 py-1 rounded-lg">
              ⏳ Solicitado ao Empilhador (Aguardando Atendimento)
            </span>
            <button
              type="button"
              onClick={() => {
                cancelFefoDemandRequest(empresaId, matching.id);
                setFefoDemands(getStoredFefoDemands(empresaId));
              }}
              className="text-[10px] font-bold text-red-600 dark:text-red-400 hover:underline cursor-pointer ml-1"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    );
  };
  const [editingRow, setEditingRow] = useState<ValidadeRow | null>(null);
  const [registering, setRegistering] = useState(false);
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  const [draftRestored, setDraftRestored] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return !!(parsed.produtoBusca || parsed.selectedProd || parsed.palhete > 0 || parsed.lastro > 0 || parsed.caixa > 0 || parsed.validade || parsed.localizacao !== 'picking' || parsed.bloco);
      }
    } catch (e) {}
    return false;
  });

  const toggleDateGroup = (dateKey: string) => {
    setExpandedDates(prev => ({ ...prev, [dateKey]: !prev[dateKey] }));
  };

  // Filters
  const [filterLoc, setFilterLoc] = useState<string>('todos');
  const [filterBloco, setFilterBloco] = useState<string>('todos');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [sortOrder, setSortSort] = useState<'asc' | 'desc'>('asc');

  // Sync state with local draft saving (only when not editing an existing row)
  useEffect(() => {
    if (editingRow) return;
    const draftData = {
      produtoBusca,
      selectedProd,
      palhete,
      lastro,
      caixa,
      validade,
      localizacao,
      bloco,
      dataColetaInput
    };
    localStorage.setItem(draftKey, JSON.stringify(draftData));
  }, [produtoBusca, selectedProd, palhete, lastro, caixa, validade, localizacao, bloco, dataColetaInput, draftKey, editingRow]);

  // Sync with prop updates / user changing
  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setProdutoBusca(parsed.produtoBusca || '');
        setSelectedProd(parsed.selectedProd || null);
        setPalhete(parsed.palhete || 0);
        setLastro(parsed.lastro || 0);
        setCaixa(parsed.caixa || 0);
        const val = parsed.validade || '';
        setValidade(val);
        setValidadeInput(formatISODateToInput(val));
        setLocalizacao(parsed.localizacao || 'central');
        setBloco(parsed.bloco || '');
        if (parsed.dataColetaInput) {
          setDataColetaInput(parsed.dataColetaInput);
        }
        setDraftRestored(!!(parsed.produtoBusca || parsed.selectedProd || parsed.palhete > 0 || parsed.lastro > 0 || parsed.caixa > 0 || val || (parsed.localizacao && parsed.localizacao !== 'central') || parsed.bloco));
      } else {
        setProdutoBusca('');
        setSelectedProd(null);
        setPalhete(0);
        setLastro(0);
        setCaixa(0);
        setValidade('');
        setValidadeInput('');
        setLocalizacao('central');
        setBloco('');
        setDraftRestored(false);
      }
    } catch (e) {
      console.error(e);
    }
  }, [draftKey]);

  const empresaData = useEmpresaData();
  const [catalogTrigger, setCatalogTrigger] = useState(0);

  // Escuta atualizações de produtos (novos cadastros, edições, importações) para atualizar o autocomplete imediatamente
  useEffect(() => {
    const handleCatalogUpdate = () => {
      setCatalogTrigger(v => v + 1);
    };

    window.addEventListener('produtos_updated', handleCatalogUpdate);
    window.addEventListener('produtos_cadastro_changed', handleCatalogUpdate);
    window.addEventListener('local_data_changed', handleCatalogUpdate);
    window.addEventListener('app_data_updated', handleCatalogUpdate);
    window.addEventListener('storage', handleCatalogUpdate);

    return () => {
      window.removeEventListener('produtos_updated', handleCatalogUpdate);
      window.removeEventListener('produtos_cadastro_changed', handleCatalogUpdate);
      window.removeEventListener('local_data_changed', handleCatalogUpdate);
      window.removeEventListener('app_data_updated', handleCatalogUpdate);
      window.removeEventListener('storage', handleCatalogUpdate);
    };
  }, []);

  // Catálogo completo de produtos disponíveis para o conferente, incluindo recém-cadastrados
  const allAvailableProducts = React.useMemo(() => {
    return getAvailableProductsForConferente(empresaId, empresaData.produtos);
  }, [empresaId, empresaData.produtos, catalogTrigger]);

  // Sync with empresaData (scoped to company) - Filter out repack validades
  useEffect(() => {
    // 1. Busca na API compartilhada da nuvem/servidor para sincronizar com registros de outros colaboradores
    fetch('/api/validades')
      .then(r => r.json())
      .then(data => {
        if (data && data.success && Array.isArray(data.validades) && data.validades.length > 0) {
          const conferenteRows = removeLegacySeedValidades(data.validades.filter((r: any) => {
            const loc = String(r.localizacao || '').toLowerCase();
            const dCol = String(r.dataColeta || '').trim();
            const vVal = String(r.validade || '').trim();
            if (loc.includes('repack')) return false;
            // Exclui especificamente a coleta/validade do dia 02/10/2026 conforme solicitado
            if (dCol === '02/10/2026' || dCol === '2026-10-02' || vVal === '2026-10-02' || vVal === '02/10/2026') return false;
            return true;
          })).map((it: any) => ({
            ...it,
            dataColeta: it.dataColeta && it.dataColeta !== '02/10/2026' ? it.dataColeta : '28/08/2026',
            cadastradoEm: it.cadastradoEm && !it.cadastradoEm.startsWith('2026-10-02') ? it.cadastradoEm : '2026-08-28T08:00:00.000Z'
          }));
          if (conferenteRows.length > 0) {
            setValidadesList(conferenteRows);
            try {
              localStorage.setItem(`validades_${empresaId}`, JSON.stringify(conferenteRows));
              localStorage.setItem(`armazem_validades_${empresaId}`, JSON.stringify(conferenteRows));
            } catch (e) {}
            syncValidadesListToMonthlyColetas(conferenteRows, empresaId);
          }
        }
      })
      .catch(() => {});

    let rows: ValidadeRow[] = empresaData.validades || [];
    if (rows.length === 0) {
      const saved = localStorage.getItem(`validades_${empresaId}`);
      if (saved) {
        try {
          rows = JSON.parse(saved);
        } catch (e) {
          console.error(e);
        }
      }
    }

    // Exclude any repack validades and legacy seed items so this panel ONLY shows conferente validades
    let conferenteRows = removeLegacySeedValidades(rows.filter((r: any) => {
      const loc = String(r.localizacao || '').toLowerCase();
      const origem = String(r.origem || '').toLowerCase();
      const setor = String(r.setor || '').toLowerCase();
      const tipo = String(r.tipo || '').toLowerCase();
      const dCol = String(r.dataColeta || '').trim();
      const vVal = String(r.validade || '').trim();
      if (loc.includes('repack') || origem.includes('repack') || setor.includes('repack') || tipo.includes('repack') || r.isRepack) {
        return false;
      }
      // Exclui a coleta/validade do dia 02/10/2026
      if (dCol === '02/10/2026' || dCol === '2026-10-02' || vVal === '2026-10-02' || vVal === '02/10/2026') {
        return false;
      }
      return true;
    })).map((it: any) => ({
      ...it,
      dataColeta: it.dataColeta && it.dataColeta !== '02/10/2026' ? it.dataColeta : '28/08/2026',
      cadastradoEm: it.cadastradoEm && !it.cadastradoEm.startsWith('2026-10-02') ? it.cadastradoEm : '2026-08-28T08:00:00.000Z'
    }));

    if (conferenteRows.length === 0) {
      conferenteRows = getInitialDefaultValidades(empresaId).filter((r: any) => {
        const dCol = String(r.dataColeta || '').trim();
        const vVal = String(r.validade || '').trim();
        return dCol !== '02/10/2026' && dCol !== '2026-10-02' && vVal !== '2026-10-02' && vVal !== '02/10/2026';
      }).map((it: any) => ({
        ...it,
        dataColeta: it.dataColeta && it.dataColeta !== '02/10/2026' ? it.dataColeta : '28/08/2026',
        cadastradoEm: it.cadastradoEm && !it.cadastradoEm.startsWith('2026-10-02') ? it.cadastradoEm : '2026-08-28T08:00:00.000Z'
      }));
    }

    try {
      localStorage.setItem(`validades_${empresaId}`, JSON.stringify(conferenteRows));
      localStorage.setItem(`armazem_validades_${empresaId}`, JSON.stringify(conferenteRows));
    } catch (e) {}

    setValidadesList(conferenteRows);
    syncValidadesListToMonthlyColetas(conferenteRows, empresaId);
  }, [empresaData.validades, empresaId]);

  const getDaysRemaining = (expDate: string) => {
    if (!expDate) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(expDate + 'T00:00:00');
    return Math.round((exp.getTime() - today.getTime()) / 86400000);
  };

  const getStatusClass = (days: number) => {
    if (days < 0) return 'expired';
    if (days <= 30) return 'crit';
    if (days <= 60) return 'alert';
    return 'ok';
  };

  const getStatusLabelAndStyles = (days: number) => {
    if (days < 0) return { label: '⛔ VENCIDO', text: 'text-[#ef4444]', border: 'border-l-[#ef4444]', bg: 'bg-[#ef4444]/10' };
    if (days <= 30) return { label: '🔴 CRÍTICO (≤30d)', text: 'text-[#ef4444]', border: 'border-l-[#ef4444]', bg: 'bg-[#ef4444]/10' };
    if (days <= 60) return { label: '🟡 ALERTA (45-60d)', text: 'text-[#ca8a04]', border: 'border-l-[#eab308]', bg: 'bg-[#eab308]/10' };
    return { label: '🟢 OK (>60d)', text: 'text-[#16a34a]', border: 'border-l-[#22c55e]', bg: 'bg-[#22c55e]/10' };
  };

  // Stats Counters compiling helper
  const getStats = () => {
    const stats = { expired: 0, crit: 0, warn: 0, alert: 0, ok: 0 };
    validadesList.forEach(r => {
      const days = getDaysRemaining(r.validade);
      const cat = getStatusClass(days);
      stats[cat] = (stats[cat] || 0) + 1;
    });
    return stats;
  };

  const stats = getStats();

  const handleSelectProd = (p: { codigo: number, descricao: string }) => {
    setSelectedProd(p);
    setProdutoBusca(p.descricao);
    setShowProdDropdown(false);
  };

  const handleValidadeChange = (val: string) => {
    // Permite apenas dígitos e barras
    let cleaned = val.replace(/[^0-9/]/g, '');

    // Formatação automática (máscara) DD/MM/AAAA
    const digits = cleaned.replace(/\//g, '');
    let formatted = '';
    if (digits.length > 0) {
      formatted += digits.slice(0, 2);
    }
    if (digits.length > 2) {
      formatted += '/' + digits.slice(2, 4);
    }
    if (digits.length > 4) {
      formatted += '/' + digits.slice(4, 8);
    }

    const finalVal = formatted || cleaned;
    setValidadeInput(finalVal);

    const iso = parseInputDateToISO(finalVal);
    if (iso) {
      setValidade(iso);
    } else {
      setValidade('');
    }
  };

  const cleanForm = () => {
    setProdutoBusca('');
    setSelectedProd(null);
    setPalhete(0);
    setLastro(0);
    setCaixa(0);
    setValidade('');
    setValidadeInput('');
    setDataColetaInput(getTodayDDMMYYYY());
    // Preserva 'picking' se foi o local selecionado
    if (localizacao !== 'picking') {
      setLocalizacao('central');
    }
    setBloco('');
    setEditingRow(null);
    setDraftRestored(false);
    localStorage.removeItem(draftKey);
  };

  const handleDeleteAllValidades = async () => {
    if (!window.confirm('⚠️ Tem certeza que deseja EXCLUIR TODA A BASE DE VALIDADES?\nEsta ação apagará permanentemente todos os registros coletados para que você possa reimportar do zero.')) {
      return;
    }
    try {
      for (const item of validadesList) {
        const idToDel = item._docId || (item as any).id;
        if (idToDel) {
          try { await ValidadesRepository.delete(String(idToDel), empresaId); } catch(e){}
        }
      }
      setValidadesList([]);
      localStorage.removeItem(`validades_${empresaId}`);
      localStorage.removeItem(`fefo_demands_${empresaId}`);
      window.dispatchEvent(new Event('fefo_demands_updated'));
      window.dispatchEvent(new Event('app_data_updated'));
      window.dispatchEvent(new Event('local_data_changed'));
      alert('✅ Toda a Base de Validades foi excluída com sucesso!');
    } catch (e) {
      alert('Erro ao excluir base de validades: ' + e);
    }
  };

  const handleSave = async () => {
    if (!validadeInput) {
      alert('Por favor, informe a data de vencimento.');
      return;
    }

    const isoDate = parseInputDateToISO(validadeInput);
    if (!isoDate) {
      alert('Data de vencimento inválida. Por favor, use o formato DD/MM/AAAA (ex: 25/07/2026).');
      return;
    }

    if (!selectedProd && !editingRow) {
      alert('Por favor, selecione um produto.');
      return;
    }

    setRegistering(true);

    const currentCode = selectedProd ? String(selectedProd.codigo) : editingRow?.codigo || '';
    const currentDesc = selectedProd ? selectedProd.descricao : editingRow?.descricao || '';
    const totalCalculado = calcularTotalCaixas(currentCode, palhete, lastro, caixa, empresaId);

    const semanaNumCalculada = getSemanaDoMesFromDate(dataColetaInput);
    const mesRefCalculado = getMesKeyFromDate(dataColetaInput);

    const dataObj = {
      codigo: currentCode,
      descricao: currentDesc,
      palhete,
      lastro,
      caixa,
      quantidade: totalCalculado,
      totalUnitiesRaw: totalCalculado,
      totalUnities: totalCalculado,
      validade: isoDate,
      localizacao,
      bloco: (localizacao === 'pnc' || localizacao === 'picking') ? '' : bloco,
      dataColeta: dataColetaInput,
      semanaNumero: semanaNumCalculada,
      mesReferencia: mesRefCalculado,
    };

    try {
      let updatedListAfterSave = [...validadesList];

      if (editingRow) {
        // Edit Row Action update - resposta instantânea
        const idToUpdate = editingRow._docId || (editingRow as any).id;
        updatedListAfterSave = validadesList.map(item => item.id === editingRow.id ? { ...item, ...dataObj } : item);
        setValidadesList(updatedListAfterSave);
        localStorage.setItem(`validades_${empresaId}`, JSON.stringify(updatedListAfterSave));
        syncValidadesListToMonthlyColetas(updatedListAfterSave, empresaId);
        toast(`Produto atualizado na Semana ${semanaNumCalculada} de Agosto!`);

        if (idToUpdate) {
          ValidadesRepository.update(String(idToUpdate), dataObj, empresaId).catch(err => {
            console.warn('[ValidadesRepository.update] background sync:', err);
          });
        }
      } else {
        // Sobrescrever registro anterior com a mesma combinação: código + localizacao + bloco (rua)
        const targetCod = String(dataObj.codigo).trim();
        const targetLoc = String(dataObj.localizacao).toLowerCase();
        const targetRua = String(dataObj.bloco || '').trim().toLowerCase();

        const idsToDel: string[] = [];
        const filteredList = [];
        for (const item of validadesList) {
          const itemCod = String(item.codigo).trim();
          const itemLoc = String(item.localizacao || 'central').toLowerCase();
          const itemRua = String(item.bloco || '').trim().toLowerCase();

          if (itemCod === targetCod && itemLoc === targetLoc && itemRua === targetRua) {
            const idToDel = item._docId || (item as any).id;
            if (idToDel) {
              idsToDel.push(String(idToDel));
            }
          } else {
            filteredList.push(item);
          }
        }

        const localId = Date.now();
        const localDocId = 'val_' + localId + '_' + Math.random().toString(36).substring(2, 8);
        const newRow: ValidadeRow = {
          _docId: localDocId,
          id: localId,
          empresaId,
          ...dataObj,
          cadastradoEm: new Date().toISOString()
        };

        updatedListAfterSave = [...filteredList, newRow];
        setValidadesList(updatedListAfterSave);
        localStorage.setItem(`validades_${empresaId}`, JSON.stringify(updatedListAfterSave));
        syncValidadesListToMonthlyColetas(updatedListAfterSave, empresaId);
        toast(`Produto salvo com sucesso na Semana ${semanaNumCalculada} de Agosto!`);

        // Sincronização assíncrona em segundo plano no Firestore sem travar o botão para o operador
        (async () => {
          try {
            if (idsToDel.length > 0) {
              await Promise.allSettled(idsToDel.map(id => ValidadesRepository.delete(id, empresaId)));
            }
            const created = await ValidadesRepository.create(newRow, empresaId, localDocId);
            if (created && created._docId && created._docId !== localDocId) {
              setValidadesList(curr => curr.map(item => item.id === localId ? { ...item, _docId: created._docId } : item));
            }
          } catch (err) {
            console.warn('[ValidadesPanel] Background persistence:', err);
          }
        })();
      }

      // Sincroniza com /public/banco-dados/hoje/validade.json no backend
      try {
        const dataRef = new Date().toISOString().split('T')[0];
        const itemsVal = updatedListAfterSave.map((v: any, idx: number) => {
          const dias = Number(v.diasRestantes || v.dias || 120);
          let status = 'normal';
          if (dias <= 30) status = 'critico';
          else if (dias <= 60) status = 'alerta';
          return {
            id: String(v.id || v._docId || `VAL-${idx + 1}`),
            codigo: Number(v.codigo || 0),
            descricao: String(v.descricao || 'Produto'),
            lote: String(v.lote || 'L-PADRAO'),
            validade: String(v.validade || dataRef),
            diasRestantes: dias,
            quantidade: Number(v.quantidade || 0),
            unidade: 'CX',
            localizacao: String(v.localizacao || 'central'),
            status,
            acaoRecomendada: status === 'critico' ? 'Acelerar giro promocional' : (status === 'alerta' ? 'Priorizar saída em rotas' : 'Manter fluxo FEFO padrão')
          };
        });
        syncEntityToPublic('validade', {
          dataReferencia: dataRef,
          totalItensMonitorados: itemsVal.length,
          itensCriticos: itemsVal.filter(i => i.status === 'critico').length,
          itensAlerta: itemsVal.filter(i => i.status === 'alerta').length,
          itensNormais: itemsVal.filter(i => i.status === 'normal').length,
          itens: itemsVal
        }).catch(() => {});

        // Envia imediatamente para a API central do servidor para todos os outros computadores e o site verem
        fetch('/api/validades', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ validades: updatedListAfterSave, empresaId })
        }).catch(err => console.warn('[Validades API Sync]', err));
      } catch (e) {}

      if (dataObj.localizacao === 'pnc') {
        encaminharItemParaPnc({
          codigo: dataObj.codigo,
          descricao: dataObj.descricao,
          validade: dataObj.validade,
          quantidade: dataObj.quantidade,
          qtde_bloq_cx: dataObj.quantidade,
          motivo: 'Lançado diretamente na Coleta de Validades como PNC',
          responsavel: user?.nome || 'Conferente',
          localizacaoAnterior: 'Coleta de Validades',
          empresaId
        }, empresaId);
      }

      window.dispatchEvent(new CustomEvent('stock_age_monthly_updated', { detail: { updated: true } }));

      // Check for immediate FEFO breaks on this product
      const targetCode = String(dataObj.codigo).trim();
      const newPickingBreaks = calcularQuebrasFefoEstoqueXPicking(updatedListAfterSave);
      const newEstoqueBreaks = calcularQuebrasFefoEstoqueXEstoque(updatedListAfterSave);

      const relPicking = newPickingBreaks.filter(q => String(q.codigo).trim() === targetCode);
      const relEstoque = newEstoqueBreaks.filter(q => String(q.codigo).trim() === targetCode);

      if (relPicking.length > 0 || relEstoque.length > 0) {
        setImportBreaksModalData({
          isOpen: true,
          title: `⚠️ ATENÇÃO: Quebra de FEFO Identificada na Contagem!`,
          source: 'single',
          pickingBreaks: relPicking,
          estoqueBreaks: relEstoque,
        });
      }

      cleanForm();
      if (!relPicking.length && !relEstoque.length) {
        setActiveTab('lista');
      }
    } catch (e) {
      alert('Erro ao registrar validade: ' + e);
    } finally {
      setRegistering(false);
    }
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data: any[] = XLSX.utils.sheet_to_json(ws);

        if (!data || data.length === 0) {
          alert('A planilha importada está vazia.');
          return;
        }

        const newImportedRows: ValidadeRow[] = [];
        const importedKeys = new Set<string>();

        data.forEach((row, idx) => {
          const cod = String(row['Código'] || row['codigo'] || row['SKU'] || '0').trim();
          const desc = String(row['Descrição'] || row['descricao'] || row['Produto'] || row['produto'] || `Produto ${cod}`).trim();
          const valRaw = String(row['Validade'] || row['validade'] || row['Vencimento'] || row['dataVencimento'] || '').trim();
          let loc = String(row['Localização'] || row['localizacao'] || row['Local'] || 'central').toLowerCase();
          if (loc.includes('picking')) loc = 'picking';
          else if (loc.includes('pnc')) loc = 'pnc';
          else loc = 'central';

          const rua = (loc === 'pnc' || loc === 'picking') ? '' : String(row['Bloco'] || row['bloco'] || row['Rua'] || row['rua'] || '').trim();
          const pal = Number(row['Paletes'] || row['palhete'] || 0);
          const las = Number(row['Lastros'] || row['lastro'] || 0);
          const cx = Number(row['Caixas'] || row['caixa'] || row['Quantidade'] || 1);

          let iso = parseInputDateToISO(valRaw);
          if (!iso && valRaw.includes('-')) iso = valRaw;

          if (cod && desc && iso) {
            const key = `${cod.toLowerCase()}_${loc}_${rua.toLowerCase()}`;
            importedKeys.add(key);
            const totalImp = (pal > 0 || las > 0) ? calcularTotalCaixas(cod, pal, las, cx, empresaId) : cx;

            newImportedRows.push({
              _docId: `imp_${Date.now()}_${idx}`,
              id: Date.now() + idx,
              empresaId,
              codigo: cod,
              descricao: desc,
              palhete: pal,
              lastro: las,
              caixa: cx,
              quantidade: totalImp,
              totalUnitiesRaw: totalImp,
              totalUnities: totalImp,
              validade: iso,
              localizacao: loc,
              bloco: rua,
              cadastradoEm: new Date().toISOString()
            });
          }
        });

        if (newImportedRows.length === 0) {
          alert('Nenhum registro válido encontrado. Certifique-se de que a planilha possui as colunas: Código, Descrição, Validade, Localização, Bloco.');
          return;
        }

        // Sobrescrever registros antigos com a mesma chave (código + localizacao + bloco)
        const remainingExisting = [];
        for (const oldItem of validadesList) {
          const k = `${String(oldItem.codigo).trim().toLowerCase()}_${String(oldItem.localizacao || 'central').trim().toLowerCase()}_${String(oldItem.bloco || '').trim().toLowerCase()}`;
          if (importedKeys.has(k)) {
            const idToDel = oldItem._docId || (oldItem as any).id;
            if (idToDel) {
              try { await ValidadesRepository.delete(String(idToDel), empresaId); } catch (err) {}
            }
          } else {
            remainingExisting.push(oldItem);
          }
        }

        const itemsToInsert = newImportedRows.map(item => {
          const { _docId, ...rest } = item;
          return rest;
        });
        await ValidadesRepository.batchUpsert(itemsToInsert as any, empresaId);

        const updated = [...remainingExisting, ...newImportedRows];
        setValidadesList(updated);
        localStorage.setItem(`validades_${empresaId}`, JSON.stringify(updated));

        const impPickingBreaks = calcularQuebrasFefoEstoqueXPicking(updated);
        const impEstoqueBreaks = calcularQuebrasFefoEstoqueXEstoque(updated);

        if (impPickingBreaks.length > 0 || impEstoqueBreaks.length > 0) {
          setImportBreaksModalData({
            isOpen: true,
            title: `⚠️ ATENÇÃO: Importação Concluída com ${impPickingBreaks.length + impEstoqueBreaks.length} Quebra(s) de FEFO Detectada(s)!`,
            source: 'import',
            pickingBreaks: impPickingBreaks,
            estoqueBreaks: impEstoqueBreaks
          });
        } else {
          alert(`✅ Importação realizada com sucesso! ${newImportedRows.length} lotes importados (registros anteriores da mesma chave foram sobrescritos).`);
        }
      } catch (err) {
        console.error(err);
        alert('Erro ao processar planilha de validades.');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleEditInit = (r: ValidadeRow) => {
    setEditingRow(r);
    setSelectedProd({ codigo: Number(r.codigo), descricao: r.descricao });
    setProdutoBusca(r.descricao);
    setPalhete(r.palhete);
    setLastro(r.lastro);
    setCaixa(r.caixa);
    setValidade(r.validade);
    setValidadeInput(formatISODateToInput(r.validade));
    setLocalizacao(r.localizacao);
    setBloco(r.bloco || '');
    if (r.dataColeta) {
      let dc = r.dataColeta;
      if (dc.includes('-')) {
        const parts = dc.split('-');
        if (parts[0].length === 4) dc = `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      setDataColetaInput(dc);
    } else {
      setDataColetaInput(getTodayDDMMYYYY());
    }
    setActiveTab('form');
  };

  const handleDelete = (r: ValidadeRow) => {
    const remaining = validadesList.filter(item => item.id !== r.id && item._docId !== r._docId);
    setValidadesList(remaining);
    localStorage.setItem(`validades_${empresaId}`, JSON.stringify(remaining));
    syncValidadesListToMonthlyColetas(remaining, empresaId);
    toast('Registro de validade excluído com sucesso');

    const idToDel = r._docId || (r as any).id;
    if (idToDel) {
      ValidadesRepository.delete(String(idToDel), empresaId).catch(console.error);
    }

    // Sincroniza exclusão com o servidor central
    fetch('/api/validades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ validades: remaining, empresaId })
    }).catch(err => console.warn('[Validades API Delete Sync]', err));
  };

  const handleSendRowToPnc = async (r: ValidadeRow) => {
    const qtdCx = r.quantidade || r.totalUnities || 0;
    if (!confirm(`Deseja encaminhar o item "${r.descricao}" (${qtdCx} cx) para a Guia de PNC para Tratativa?\n\nO item sairá da lista de estoque normal e será gerenciado pelo PNC.`)) {
      return;
    }

    try {
      encaminharItemParaPnc({
        codigo: r.codigo,
        descricao: r.descricao,
        validade: r.validade,
        quantidade: qtdCx,
        qtde_bloq_cx: qtdCx,
        motivo: 'Encaminhado da Guia de Validades / Coleta',
        responsavel: user?.nome || 'Conferente FEFO',
        localizacaoAnterior: r.localizacao === 'picking' ? 'Picking' : `Armazém Central (${r.bloco || 'Geral'})`,
        empresaId
      }, empresaId);

      const updated = validadesList.map(item => (item.id === r.id || (r._docId && item._docId === r._docId)) ? { ...item, localizacao: 'pnc' } : item);
      setValidadesList(updated);
      localStorage.setItem(`validades_${empresaId}`, JSON.stringify(updated));

      const idToUpd = r._docId || (r as any).id;
      if (idToUpd) {
        try {
          await ValidadesRepository.update(String(idToUpd), { localizacao: 'pnc' } as any, empresaId);
        } catch (e) {}
      }

      window.dispatchEvent(new CustomEvent('pnc-records-updated'));
      window.dispatchEvent(new Event('pnc_updated'));
      window.dispatchEvent(new Event('local_data_changed'));
      toast(`✅ Item "${r.descricao}" encaminhado para a Guia de PNC para tratativa com sucesso!`);
    } catch (err) {
      alert('Erro ao encaminhar para PNC: ' + err);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Deseja realmente ZERAR toda a lista de estoque e iniciar uma nova coleta de validades com o conferente? Todos os lotes atuais serão removidos.')) return;
    try {
      for (const item of validadesList) {
        const idToDel = item._docId || (item as any).id;
        if (idToDel) {
          try { await ValidadesRepository.delete(String(idToDel), empresaId); } catch(e){}
        }
      }
      setValidadesList([]);
      localStorage.setItem(`validades_${empresaId}`, JSON.stringify([]));
      localStorage.setItem(`armazem_validades_${empresaId}`, JSON.stringify([]));
      localStorage.removeItem(`workstation_custom_quantities_${empresaId}`);
      window.dispatchEvent(new Event('local_data_changed'));
      toast('Lista de estoque zerada com sucesso!');

      // Sincroniza zeramento com a API central
      fetch('/api/validades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ validades: [], empresaId })
      }).catch(err => console.warn('[Validades API Clear Sync]', err));
    } catch (e) {
      alert('Erro ao excluir registros: ' + e);
    }
  };

  const toast = (m: string) => {
    const el = document.getElementById('toast');
    if (el) {
      el.style.background = '';
      el.style.color = '';
      el.textContent = m;
      el.className = 'toast show';
      setTimeout(() => {
        el.className = 'toast';
      }, 3000);
    }
  };

  // Pre-filter calculations - busca em todos os produtos cadastrados na plataforma (incluindo recém-cadastrados)
  const filteredProducts = React.useMemo(() => {
    const q = produtoBusca.toLowerCase().trim();
    if (!q) {
      return allAvailableProducts.slice(0, 15);
    }
    return allAvailableProducts.filter(p => {
      const codStr = String(p.codigo).toLowerCase();
      const descStr = (p.descricao || '').toLowerCase();
      return codStr.includes(q) || descStr.includes(q);
    }).slice(0, 25);
  }, [allAvailableProducts, produtoBusca]);

  // Helper to extract registration date key for history filtering
  const getRegDateKey = (item: ValidadeRow) => {
    const raw = item.dataColeta || item.cadastradoEm || (item as any).dataISO || (item as any).dataRegistro || (item as any).criadoEm || (item as any).createdAt || (item as any).data;
    if (raw) {
      const s = String(raw).trim();
      if (s.includes('T')) return s.split('T')[0];
      if (s.includes('-') && s.length >= 10) return s.slice(0, 10);
      if (s.includes('/')) {
        const parts = s.split('/');
        if (parts.length === 3) {
          const d = parts[0].padStart(2, '0');
          const m = parts[1].padStart(2, '0');
          const y = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
          return `${y}-${m}-${d}`;
        }
      }
    }
    // Fallback: Semana 4 oficial 28/08/2026
    return '2026-08-28';
  };

  const handleExcluirColetaCompleta = async (regDateKey: string) => {
    let formattedDate = regDateKey;
    try {
      const [y, m, d] = regDateKey.split('-');
      formattedDate = `${d}/${m}/${y}`;
    } catch (_) {}

    if (!window.confirm(`⚠️ Deseja realmente remover toda a coleta do dia ${formattedDate}?\n\nEsta ação excluirá todos os lotes desta coleta do armazém e da visualização.`)) {
      return;
    }

    try {
      const remaining = validadesList.filter(item => {
        const itemKey = getRegDateKey(item);
        const itemVal = formatDateToBR(item.validade);
        const itemColeta = item.dataColeta ? formatDateToBR(item.dataColeta) : '';
        if (itemKey === regDateKey) return false;
        if (formattedDate === '02/10/2026' && (itemVal === '02/10/2026' || itemColeta === '02/10/2026')) return false;
        return true;
      });

      setValidadesList(remaining);
      localStorage.setItem(`validades_${empresaId}`, JSON.stringify(remaining));
      localStorage.setItem(`armazem_validades_${empresaId}`, JSON.stringify(remaining));

      const deletedDatesKey = `fefo_deleted_coleta_dates_${empresaId}`;
      let deletedDates: string[] = [];
      try {
        deletedDates = JSON.parse(localStorage.getItem(deletedDatesKey) || '[]');
      } catch (_) {}
      if (!deletedDates.includes(regDateKey)) deletedDates.push(regDateKey);
      if (!deletedDates.includes(formattedDate)) deletedDates.push(formattedDate);
      localStorage.setItem(deletedDatesKey, JSON.stringify(deletedDates));

      fetch('/api/validades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ validades: remaining, empresaId })
      }).catch(() => {});

      window.dispatchEvent(new Event('validades_updated'));
      window.dispatchEvent(new Event('app_data_updated'));
      window.dispatchEvent(new Event('local_data_changed'));

      toast(`✅ Coleta do dia ${formattedDate} removida com sucesso!`);
    } catch (e) {
      console.error(e);
      alert('Erro ao excluir coleta: ' + e);
    }
  };

  // Expiration entries mapping list
  const getFilteredEntries = () => {
    let rows = filterHistoryForUser(validadesList, user, getRegDateKey);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      rows = rows.filter(r => 
        String(r.codigo).toLowerCase().includes(q) || 
        r.descricao.toLowerCase().includes(q) ||
        (r.bloco || '').toLowerCase().includes(q)
      );
    }

    if (filterLoc !== 'todos') {
      rows = rows.filter(r => r.localizacao === filterLoc);
    }
    if (filterBloco !== 'todos') {
      rows = rows.filter(r => (r.bloco || '') === filterBloco);
    }
    if (filterSemana !== 'todas') {
      rows = rows.filter(r => {
        const sem = r.semanaNumero || getSemanaDoMesFromDate(r.dataColeta || '21/08/2026');
        return sem === filterSemana;
      });
    }
    if (filterStatus !== 'todos') {
      rows = rows.filter(r => {
        const days = getDaysRemaining(r.validade);
        return getStatusClass(days) === filterStatus;
      });
    }

    // Sort order
    rows.sort((a, b) => {
      const order = (a.validade || '').localeCompare(b.validade || '');
      return sortOrder === 'asc' ? order : -order;
    });

    return rows;
  };

  const entriesToDisplay = getFilteredEntries();

  return (
    <div className="flex flex-col gap-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-[#11151c] border border-[#222d3a] rounded-xl w-full gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-sans font-black text-sm tracking-widest text-[#8b5cf6] uppercase">🏷 CONTROLE DE VALIDADES — GESTÃO FEFO</span>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <button 
            onClick={() => setShowImport030519Modal(true)}
            className="py-1 px-3 bg-indigo-600/20 border border-indigo-500/40 hover:bg-indigo-600 text-indigo-200 hover:text-white rounded-lg text-[10px] font-bold tracking-wide uppercase transition-all cursor-pointer flex items-center gap-1 shadow-xs"
          >
            📊 Importar 03.05.19 (Venda Média)
          </button>
          <label className="py-1 px-3 bg-[#8b5cf6]/15 border border-[#8b5cf6]/30 hover:bg-[#8b5cf6] text-[#c4b5fd] hover:text-white rounded-lg text-[10px] font-bold tracking-wide uppercase transition-colors cursor-pointer flex items-center gap-1">
            📥 Importar Validades
            <input type="file" accept=".xlsx, .xls, .csv" onChange={handleImportExcel} className="hidden" />
          </label>
          <button onClick={handleDeleteAllValidades} className="py-1 px-3 bg-[#ef4444]/15 border border-[#ef4444]/30 hover:bg-[#ef4444] text-[#fca5a5] hover:text-white rounded-lg text-[10px] font-bold tracking-wide uppercase transition-colors cursor-pointer">
            🗑 Excluir Base de Validades
          </button>
        </div>
      </div>

      {/* PAINEL DE ACOMPANHAMENTO DE ITENS CRÍTICOS (JANELA DE 45 DIAS) WORKSTATION CCO / CONFERENTE */}
      <WorkstationCriticosRecolhimento
        validadesList={validadesList}
        user={user}
        empresa={empresa}
      />

      {/* Expiry Risk Level Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-3 text-center rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/70 dark:bg-[#7f1d1d]/10 shadow-xs">
          <span className="font-sans font-black text-2xl text-red-600 dark:text-red leading-none">{stats.expired}</span>
          <span className="block text-[9px] text-slate-600 dark:text-[#6a7d92] uppercase font-bold tracking-wider mt-1">Vencido</span>
          <span className="block text-[9px] text-red-600/90 dark:text-[#6a7d92]/80 font-semibold mt-0.5">⚠️ Perda integral</span>
        </div>
        <div className="p-3 text-center rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/70 dark:bg-[#ef4444]/10 shadow-xs">
          <span className="font-sans font-black text-2xl text-rose-600 dark:text-[#ef4444] leading-none">{stats.crit}</span>
          <span className="block text-[9px] text-slate-600 dark:text-[#6a7d92] uppercase font-bold tracking-wider mt-1">Crítico</span>
          <span className="block text-[9px] text-rose-600/90 dark:text-[#6a7d92]/80 font-semibold mt-0.5">≤ 30 dias</span>
        </div>
        <div className="p-3 text-center rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/70 dark:bg-[#f5a623]/10 shadow-xs">
          <span className="font-sans font-black text-2xl text-amber-600 dark:text-[#f5a623] leading-none">{stats.warn}</span>
          <span className="block text-[9px] text-slate-600 dark:text-[#6a7d92] uppercase font-bold tracking-wider mt-1">Atenção</span>
          <span className="block text-[9px] text-amber-600/90 dark:text-[#6a7d92]/80 font-semibold mt-0.5">31–45 dias</span>
        </div>
        <div className="p-3 text-center rounded-xl border border-yellow-200 dark:border-yellow-900/50 bg-yellow-50/70 dark:bg-[#eab308]/10 shadow-xs">
          <span className="font-sans font-black text-2xl text-yellow-600 dark:text-[#eab308] leading-none">{stats.alert}</span>
          <span className="block text-[9px] text-slate-600 dark:text-[#6a7d92] uppercase font-bold tracking-wider mt-1">Alerta</span>
          <span className="block text-[9px] text-yellow-600/90 dark:text-[#6a7d92]/80 font-semibold mt-0.5">46–60 dias</span>
        </div>
        <div className="p-3 text-center rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/70 dark:bg-[#22c55e]/10 shadow-xs col-span-2 md:col-span-1">
          <span className="font-sans font-black text-2xl text-emerald-600 dark:text-[#22c55e] leading-none">{stats.ok}</span>
          <span className="block text-[9px] text-slate-600 dark:text-[#6a7d92] uppercase font-bold tracking-wider mt-1">Garantido</span>
          <span className="block text-[9px] text-emerald-700 dark:text-[#22c55e]/70 font-semibold mt-0.5">&gt; 60 dias (FEFO OK)</span>
        </div>
      </div>

      {/* Standard Operating Procedure (POP / SOP) Banner for Operator */}
      <SopBannerViewer operation="fefo" operationName="FEFO / Validades" />

      {/* Navegação de Abas - 100% Responsivo */}
      <div className="bg-slate-100 dark:bg-[#11151c] p-2 rounded-2xl border border-slate-200 dark:border-[#222d3a] shadow-inner">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5 sm:gap-2">
          <button 
            type="button"
            onClick={() => setActiveTab('form')}
            className={`py-2 px-2.5 rounded-xl font-sans font-bold text-[11px] sm:text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 text-center ${
              activeTab === 'form' 
                ? 'bg-[#8b5cf6] text-white shadow-md shadow-[#8b5cf6]/20 font-black' 
                : 'bg-white dark:bg-[#151b23] text-slate-700 dark:text-[#8fa0b5] hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#1f2733] border border-slate-200 dark:border-[#222d3a] shadow-xs'
            }`}
          >
            {editingRow ? '✏️ Editar Lote' : '📝 Cadastrar Lote'}
          </button>

          <button 
            type="button"
            onClick={() => setActiveTab('lista')}
            className={`py-2 px-2.5 rounded-xl font-sans font-bold text-[11px] sm:text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 text-center ${
              activeTab === 'lista' 
                ? 'bg-[#8b5cf6] text-white shadow-md shadow-[#8b5cf6]/20 font-black' 
                : 'bg-white dark:bg-[#151b23] text-slate-700 dark:text-[#8fa0b5] hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#1f2733] border border-slate-200 dark:border-[#222d3a] shadow-xs'
            }`}
          >
            <span>📋 Lista Estoque</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === 'lista' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-[#0e1217] text-slate-800 dark:text-snow border border-slate-300 dark:border-[#222d3a]'
            }`}>
              {filterHistoryForUser(validadesList, user, getRegDateKey).length}
            </span>
          </button>

          <button 
            type="button"
            onClick={() => setActiveTab('stock_age')}
            className={`py-2 px-2.5 rounded-xl font-sans font-bold text-[11px] sm:text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 text-center ${
              activeTab === 'stock_age' 
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20 font-black' 
                : 'bg-white dark:bg-[#151b23] text-slate-700 dark:text-[#8fa0b5] hover:text-purple-700 dark:hover:text-purple-300 hover:bg-slate-50 dark:hover:bg-[#1f2733] border border-slate-200 dark:border-[#222d3a] shadow-xs'
            }`}
          >
            📊 Stock Age Index
          </button>

          <button 
            type="button"
            onClick={() => setActiveTab('futuro_shelf')}
            className={`py-2 px-2.5 rounded-xl font-sans font-bold text-[11px] sm:text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 text-center ${
              activeTab === 'futuro_shelf' 
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20 font-black' 
                : 'bg-white dark:bg-[#151b23] text-slate-700 dark:text-[#8fa0b5] hover:text-amber-700 dark:hover:text-amber-300 hover:bg-slate-50 dark:hover:bg-[#1f2733] border border-slate-200 dark:border-[#222d3a] shadow-xs'
            }`}
          >
            ⚡ Futuro Shelf (30d)
          </button>

          <button 
            type="button"
            onClick={() => setActiveTab('escoamento')}
            className={`py-2 px-2.5 rounded-xl font-sans font-bold text-[11px] sm:text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 text-center ${
              activeTab === 'escoamento' 
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20 font-black' 
                : 'bg-white dark:bg-[#151b23] text-slate-700 dark:text-[#8fa0b5] hover:text-rose-700 dark:hover:text-rose-300 hover:bg-slate-50 dark:hover:bg-[#1f2733] border border-slate-200 dark:border-[#222d3a] shadow-xs'
            }`}
          >
            📉 Escoamento
          </button>

          <button 
            type="button"
            onClick={() => setActiveTab('fefo_quadro')}
            className={`py-2 px-2.5 rounded-xl font-sans font-bold text-[11px] sm:text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 text-center ${
              activeTab === 'fefo_quadro' 
                ? 'bg-red-600 text-white shadow-md shadow-red-600/20 font-black' 
                : 'bg-white dark:bg-[#151b23] text-slate-700 dark:text-[#8fa0b5] hover:text-red-700 dark:hover:text-red-300 hover:bg-slate-50 dark:hover:bg-[#1f2733] border border-slate-200 dark:border-[#222d3a] shadow-xs'
            }`}
          >
            <span>🚨 Quadro Alertas</span>
            {(quebrasFefoPicking.length + quebrasFefoEstoque.length) > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'fefo_quadro' ? 'bg-white/20 text-white' : 'bg-red-100 text-red-700 border border-red-300 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30'
              }`}>
                {quebrasFefoPicking.length + quebrasFefoEstoque.length}
              </span>
            )}
          </button>

          <button 
            type="button"
            onClick={() => setActiveTab('fefo_picking')}
            className={`py-2 px-2.5 rounded-xl font-sans font-bold text-[11px] sm:text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 text-center ${
              activeTab === 'fefo_picking' 
                ? 'bg-red-600 text-white shadow-md shadow-red-600/20 font-black' 
                : 'bg-white dark:bg-[#151b23] text-slate-700 dark:text-[#8fa0b5] hover:text-red-700 dark:hover:text-red-300 hover:bg-slate-50 dark:hover:bg-[#1f2733] border border-slate-200 dark:border-[#222d3a] shadow-xs'
            }`}
          >
            <span>⚡ Estoque x Picking</span>
            {quebrasFefoPicking.length > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'fefo_picking' ? 'bg-white/20 text-white' : 'bg-red-600 text-white'
              }`}>
                {quebrasFefoPicking.length}
              </span>
            )}
          </button>

          <button 
            type="button"
            onClick={() => setActiveTab('fefo_estoque')}
            className={`py-2 px-2.5 rounded-xl font-sans font-bold text-[11px] sm:text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 text-center ${
              activeTab === 'fefo_estoque' 
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20 font-black' 
                : 'bg-white dark:bg-[#151b23] text-slate-700 dark:text-[#8fa0b5] hover:text-amber-700 dark:hover:text-amber-300 hover:bg-slate-50 dark:hover:bg-[#1f2733] border border-slate-200 dark:border-[#222d3a] shadow-xs'
            }`}
          >
            <span>🔍 Estoque x Estoque</span>
            {quebrasFefoEstoque.length > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'fefo_estoque' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30'
              }`}>
                {quebrasFefoEstoque.length}
              </span>
            )}
          </button>

          <button 
            type="button"
            onClick={() => setActiveTab('retiradas')}
            className={`py-2 px-2.5 rounded-xl font-sans font-bold text-[11px] sm:text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 text-center ${
              activeTab === 'retiradas' 
                ? 'bg-red-600 text-white shadow-md shadow-red-600/20 font-black' 
                : 'bg-white dark:bg-[#151b23] text-slate-700 dark:text-[#8fa0b5] hover:text-red-400 hover:bg-slate-50 dark:hover:bg-[#1f2733] border border-slate-200 dark:border-[#222d3a] shadow-xs'
            }`}
          >
            <span>📦 Validades Retiradas</span>
          </button>
        </div>
      </div>

      {activeTab === 'form' ? (
        <div className="g-card p-6 flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222d3a] pb-3">
            <h3 className="font-sans font-bold text-sm tracking-wider uppercase text-[#8b5cf6]">
              {editingRow ? 'Editar Lote de Validade' : 'Registrar Validade de Lote de Carga'}
            </h3>
            <div className="flex items-center gap-1.5 text-[9px] text-[#22c55e] font-black uppercase tracking-wider bg-[#22c55e]/5 px-2.5 py-1 rounded-lg border border-[#22c55e]/15">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              Salvo automaticamente
            </div>
          </div>

          {draftRestored && !editingRow && (
            <div className="flex items-center justify-between gap-3 bg-amber-500/10 border border-amber-500/25 px-4 py-3 rounded-xl text-xs text-amber-300">
              <div className="flex items-center gap-2 font-medium">
                <span>⚡ Dados anteriores restaurados do rascunho salvo!</span>
              </div>
              <button 
                type="button"
                onClick={cleanForm}
                className="text-[9px] uppercase font-black tracking-wider text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
              >
                Limpar formulário
              </button>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* Real-time search autocomplete */}
            <div className="flex flex-col gap-1.5 md:col-span-8 relative">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold tracking-[1.5px] uppercase text-[#6a7d92]">Produto (Código SKU ou Descrição) *</label>
                <span className="text-[9px] font-mono text-purple-400 font-bold">
                  {allAvailableProducts.length} itens cadastrados
                </span>
              </div>
              <input 
                type="text"
                placeholder="Busque pelo código SKU ou descrição (ex: 31795, Brahma, Beats)..."
                disabled={!!editingRow}
                value={produtoBusca}
                onChange={e => {
                  const val = e.target.value;
                  setProdutoBusca(val);
                  setShowProdDropdown(true);

                  // Se digitou o código exato de um produto, auto-seleciona
                  const trimmed = val.trim();
                  if (/^\d+$/.test(trimmed)) {
                    const exact = allAvailableProducts.find(p => String(p.codigo) === trimmed);
                    if (exact) {
                      setSelectedProd({ codigo: exact.codigo, descricao: exact.descricao });
                    } else if (selectedProd && String(selectedProd.codigo) !== trimmed) {
                      setSelectedProd(null);
                    }
                  } else if (selectedProd && val !== selectedProd.descricao) {
                    setSelectedProd(null);
                  }
                }}
                onFocus={() => setShowProdDropdown(true)}
                className="g-input disabled:opacity-50"
              />
              {showDropdown && (
                <div 
                  className="absolute top-[103%] left-0 right-0 bg-white dark:bg-[#182343] border border-slate-200 dark:border-slate-700 shadow-2xl rounded-xl z-50 max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800"
                  onMouseDown={e => e.preventDefault()}
                >
                  <div className="p-2.5 bg-slate-50 dark:bg-[#131b31] border-b border-slate-200 dark:border-slate-700 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider sticky top-0 z-10">
                    <span>Catálogo de Produtos ({allAvailableProducts.length} disponíveis)</span>
                    <button 
                      type="button" 
                      onClick={() => setShowProdDropdown(false)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs px-1 cursor-pointer"
                    >
                      ✕ Fechar
                    </button>
                  </div>

                  {filteredProducts.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400">
                      Nenhum produto cadastrado encontrado para "{produtoBusca}".
                      <div className="text-[10px] text-purple-400 mt-1">
                        Cadastre novos itens na guia <strong>Cadastros &gt; Produtos</strong>.
                      </div>
                    </div>
                  ) : (
                    filteredProducts.map((p, idx) => (
                      <div 
                        key={`${p.codigo}_${idx}`}
                        onClick={() => handleSelectProd(p)}
                        className="p-3 hover:bg-purple-500/10 dark:hover:bg-purple-500/20 cursor-pointer text-xs flex items-start gap-2.5 transition-colors"
                      >
                        <span className="font-mono font-black text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded text-[11px] shrink-0 self-start">
                          {p.codigo}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-slate-800 dark:text-slate-100 font-bold leading-snug">
                              {p.descricao}
                            </span>
                            {p.isCustom && (
                              <span className="text-[9px] font-extrabold uppercase bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                                ✨ Cadastrado
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                            {p.grupo && <span className="font-bold text-sky-600 dark:text-sky-400 uppercase">{p.grupo}</span>}
                            <span>•</span>
                            <span className="font-mono">Pallet: {p.caixasPallet || 60} cx</span>
                            <span>•</span>
                            <span className="font-mono">Lastro: {p.lastro || 12} cx</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Card de confirmação do produto selecionado com descrição completa visível no celular */}
              {selectedProd && (
                <div className="mt-1 p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-start justify-between gap-2 transition-all">
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 font-mono font-bold text-[11px]">
                        SKU: {selectedProd.codigo}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-emerald-400">
                        ✓ Produto Selecionado
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-1 break-words whitespace-normal leading-snug">
                      {selectedProd.descricao}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProd(null);
                      setProdutoBusca('');
                    }}
                    className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 text-xs shrink-0 cursor-pointer"
                    title="Limpar seleção"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-4">
              <label className="text-[10px] font-bold tracking-[1.5px] uppercase text-[#6a7d92]">Código SKU</label>
              <input 
                type="text" 
                readOnly
                placeholder="Auto"
                value={selectedProd ? selectedProd.codigo : ''}
                className="g-input text-center text-[#f5a623] font-bold font-mono opacity-80"
              />
            </div>

          </div>

          {/* Recolha Semanal de Validades (Conferência Automática) - Minimizar / Expandir */}
          <div className="p-3 sm:p-4 bg-gradient-to-r from-purple-950/30 via-[#151b23] to-[#151b23] border border-purple-500/40 rounded-xl flex flex-col gap-3 transition-all duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#222d3a] pb-2.5">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-lg shrink-0">🗓️</span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-purple-300">
                      Data da Recolha da Validade (Conferente)
                    </span>
                    {minimizeDataRecolha && (
                      <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                        {dataColetaInput || getTodayDDMMYYYY()} {dataColetaInput === getTodayDDMMYYYY() ? '• Hoje' : ''}
                      </span>
                    )}
                  </div>
                  {!minimizeDataRecolha && (
                    <p className="text-[11px] text-gray-400">
                      Atualiza automaticamente a semana do mês e sincroniza com o Stock Age Index e FEFO.
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="px-2.5 py-1 bg-purple-600/30 border border-purple-400/50 rounded-lg text-xs font-mono font-black text-purple-200 shadow-sm">
                  ⚡ {semanaColetaInfo.label}
                </span>
                <button
                  type="button"
                  onClick={() => setMinimizeDataRecolha(prev => {
                    const next = !prev;
                    try { localStorage.setItem('validades_minimize_recolha', String(next)); } catch(e){}
                    return next;
                  })}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#1e2736] hover:bg-[#283548] text-purple-300 hover:text-white border border-purple-500/30 transition-colors cursor-pointer"
                  title={minimizeDataRecolha ? "Expandir detalhes da data de recolha" : "Minimizar esta seção"}
                >
                  <span>{minimizeDataRecolha ? 'Expandir' : 'Minimizar'}</span>
                  {minimizeDataRecolha ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {!minimizeDataRecolha && (
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                <div className="sm:col-span-4 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold tracking-[1.5px] uppercase text-[#6a7d92]">
                      Data de Recolha *
                    </label>
                    <button
                      type="button"
                      onClick={() => setDataColetaInput(getTodayDDMMYYYY())}
                      className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                    >
                      = Hoje
                    </button>
                  </div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="off"
                    placeholder="DD/MM/AAAA"
                    value={dataColetaInput}
                    onChange={e => handleDataColetaChange(e.target.value)}
                    className="g-input text-snow font-mono font-bold h-[40px]"
                  />
                </div>

                <div className="sm:col-span-8 flex flex-wrap items-center gap-2 pt-2 sm:pt-4">
                  <button
                    type="button"
                    onClick={() => setDataColetaInput(getTodayDDMMYYYY())}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      dataColetaInput === getTodayDDMMYYYY()
                        ? 'bg-purple-600 text-white shadow-md border border-purple-400 font-black ring-2 ring-purple-400/40'
                        : 'bg-[#151b23] text-gray-300 hover:bg-[#1a222c] border border-[#222d3a]'
                    }`}
                  >
                    ⚡ Data de Hoje ({getTodayDDMMYYYY()})
                  </button>
                  <button
                    type="button"
                    onClick={() => setDataColetaInput('28/08/2026')}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      dataColetaInput === '28/08/2026'
                        ? 'bg-purple-600 text-white shadow-md border border-purple-400 font-black'
                        : 'bg-[#151b23] text-gray-300 hover:bg-[#1a222c] border border-[#222d3a]'
                    }`}
                  >
                    4ª Sem. Agosto (28/08)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDataColetaInput('21/08/2026')}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      dataColetaInput === '21/08/2026'
                        ? 'bg-purple-600 text-white shadow-md border border-purple-400 font-black'
                        : 'bg-[#151b23] text-gray-300 hover:bg-[#1a222c] border border-[#222d3a]'
                    }`}
                  >
                    3ª Sem. Agosto (21/08)
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Packaging calculation & Quantities Section */}
          {(() => {
            const currentCode = selectedProd ? selectedProd.codigo : editingRow?.codigo;
            const pkgInfo = getPackagingInfo(currentCode, empresaId);
            const calculatedTotalCaixas = calcularTotalCaixas(currentCode, palhete, lastro, caixa, empresaId);

            return (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-3 gap-3 p-4 bg-[#151b23]/50 border border-[#222d3a] rounded-xl">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold tracking-[1px] uppercase text-[#6a7d92]">Quant. Paletes</label>
                      <span className="text-[9px] font-mono font-bold text-amber-400/90 bg-amber-400/10 px-1.5 py-0.5 rounded">
                        {pkgInfo.caixasPallet} cx/pal
                      </span>
                    </div>
                    <input 
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={palhete === 0 ? '' : palhete}
                      onChange={e => {
                        const val = e.target.value;
                        setPalhete(val === '' ? 0 : Math.max(0, parseInt(val, 10) || 0));
                      }}
                      className="g-input text-center text-md font-bold text-snow"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold tracking-[1px] uppercase text-[#6a7d92]">Quant. Lastros</label>
                      <span className="text-[9px] font-mono font-bold text-cyan-400/90 bg-cyan-400/10 px-1.5 py-0.5 rounded">
                        {pkgInfo.lastro} cx/las
                      </span>
                    </div>
                    <input 
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={lastro === 0 ? '' : lastro}
                      onChange={e => {
                        const val = e.target.value;
                        setLastro(val === '' ? 0 : Math.max(0, parseInt(val, 10) || 0));
                      }}
                      className="g-input text-center text-md font-bold text-snow"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold tracking-[1px] uppercase text-[#6a7d92]">Quant. SKUs</label>
                      <span className="text-[9px] font-mono font-bold text-emerald-400/90 bg-emerald-400/10 px-1.5 py-0.5 rounded">
                        Avulsas
                      </span>
                    </div>
                    <input 
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={caixa === 0 ? '' : caixa}
                      onChange={e => {
                        const val = e.target.value;
                        setCaixa(val === '' ? 0 : Math.max(0, parseInt(val, 10) || 0));
                      }}
                      className="g-input text-center text-md font-bold text-snow"
                    />
                  </div>
                </div>

                {/* Live Box Calculation Banner - Minimizar / Expandir */}
                {!minimizeCalculoCaixas ? (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-gradient-to-r from-purple-950/40 via-[#151b23] to-[#151b23] border border-purple-500/30 rounded-xl transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-xl shrink-0">
                        🧮
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider">
                          Cálculo Automático de Caixas:
                        </span>
                        <span className="text-xs font-mono text-gray-300">
                          ({palhete} pal × {pkgInfo.caixasPallet}) + ({lastro} las × {pkgInfo.lastro}) + {caixa} av = <span className="text-emerald-400 font-bold">{calculatedTotalCaixas} caixas</span>
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 bg-purple-900/30 border border-purple-500/40 px-3.5 py-2 rounded-lg">
                        <span className="text-[10px] uppercase font-black text-purple-300">Total Caixa / SKUs:</span>
                        <span className="text-lg font-black font-mono text-emerald-300">{calculatedTotalCaixas}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setMinimizeCalculoCaixas(prev => {
                          const next = !prev;
                          try { localStorage.setItem('validades_minimize_calc', String(next)); } catch(e){}
                          return next;
                        })}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[#1e2736] hover:bg-[#283548] text-purple-300 hover:text-white border border-purple-500/30 transition-colors cursor-pointer"
                        title="Minimizar cálculo detalhado de caixas"
                      >
                        <span className="hidden sm:inline">Minimizar</span>
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-2.5 px-3.5 bg-gradient-to-r from-purple-950/20 via-[#151b23] to-[#151b23] border border-purple-500/20 rounded-xl text-xs transition-all">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-base">🧮</span>
                      <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wide">Cálculo de Caixas:</span>
                      <span className="font-mono font-black text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded">
                        {calculatedTotalCaixas} caixas
                      </span>
                      <span className="text-[11px] font-mono text-gray-400 hidden sm:inline">
                        ({palhete} pal × {pkgInfo.caixasPallet} + {lastro} las × {pkgInfo.lastro} + {caixa} av)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMinimizeCalculoCaixas(prev => {
                        const next = !prev;
                        try { localStorage.setItem('validades_minimize_calc', String(next)); } catch(e){}
                        return next;
                      })}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#1e2736] hover:bg-[#283548] text-purple-300 hover:text-white border border-purple-500/30 transition-colors cursor-pointer"
                      title="Expandir cálculo detalhado de caixas"
                    >
                      <span>Expandir</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })()}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold tracking-[1.5px] uppercase text-[#6a7d92]">Data de Vencimento *</label>
              <input 
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                required
                placeholder="DD/MM/AAAA"
                value={validadeInput}
                onChange={e => handleValidadeChange(e.target.value)}
                className="g-input text-snow h-[42px]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold tracking-[1.5px] uppercase text-[#6a7d92]">Local de Contagem / Origem *</label>
              <select 
                value={localizacao} 
                onChange={e => {
                  const val = e.target.value;
                  setLocalizacao(val);
                  if (val === 'pnc' || val === 'picking') {
                    setBloco('');
                  }
                }} 
                className="g-input bg-[#151b23] border-[#1c2530] font-bold text-amber-300"
              >
                <option value="central">Estoque Central</option>
                <option value="pnc">PNC (Produto Não Conforme / Bloqueado)</option>
                <option value="picking">Picking</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold tracking-[1.5px] uppercase text-[#6a7d92]">
                Rua / Bloco {localizacao === 'central' ? '*' : ''}
              </label>
              <select 
                value={bloco} 
                onChange={e => setBloco(e.target.value)} 
                disabled={localizacao === 'pnc' || localizacao === 'picking'}
                className="g-input bg-[#151b23] border-[#1c2530] font-bold text-[#e2e8f0] disabled:opacity-40"
              >
                {localizacao === 'pnc' ? (
                  <option value="">N/A — PNC Bloqueado (Fora da Matriz de Blocos)</option>
                ) : localizacao === 'picking' ? (
                  <option value="">N/A — Área de Picking</option>
                ) : (
                  <>
                    <option value="">Selecione a Rua / Bloco...</option>
                    <optgroup label="Bloco A">
                      <option value="A1">A1</option>
                      <option value="A2">A2</option>
                      <option value="A3">A3</option>
                      <option value="A4">A4</option>
                      <option value="A5">A5</option>
                      <option value="A6">A6</option>
                      <option value="A7">A7</option>
                      <option value="A8">A8</option>
                    </optgroup>
                    <optgroup label="Bloco B">
                      <option value="B1">B1</option>
                      <option value="B2">B2</option>
                      <option value="B3">B3</option>
                      <option value="B4">B4</option>
                    </optgroup>
                    <optgroup label="Bloco C">
                      <option value="C1">C1</option>
                      <option value="C2">C2</option>
                      <option value="C3">C3</option>
                      <option value="C4">C4</option>
                    </optgroup>
                    <optgroup label="Outras Áreas">
                      <option value="Área Picking">Área Picking</option>
                      <option value="Marketplace">Marketplace</option>
                      <option value="Contingência">Contingência</option>
                    </optgroup>
                  </>
                )}
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            {editingRow && (
              <button 
                type="button"
                onClick={cleanForm}
                className="btn-ghost flex-1 py-3 border border-[#243040] text-[#6a7d92] hover:text-[#e8eef5] rounded-xl text-xs uppercase font-extrabold tracking-wider"
              >
                Cancelar Edição
              </button>
            )}
            <button 
              type="button"
              disabled={registering || (!selectedProd && !editingRow)}
              onClick={handleSave}
              className="py-4 font-sans font-bold uppercase tracking-widest text-[#07090d] bg-gradient-to-br from-[#8b5cf6] to-[#6d28d9] hover:shadow-[0_4px_16px_rgba(139,92,246,0.25)] rounded-xl disabled:opacity-50 flex-1 cursor-pointer"
            >
              {registering ? 'Gravando...' : editingRow ? '✏️ ATUALIZAR LOTE NO ESTOQUE' : '💾 SALVAR PRODUTO NO ESTOQUE'}
            </button>
          </div>
        </div>
      ) : activeTab === 'lista' ? (
        <div className="flex flex-col gap-4">
          <HistoryRestrictionNotice user={user} />
          
          {/* List Search and Filters bar */}
          <div className="g-card p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-2.5 w-full sm:w-auto flex-1">
              <input 
                type="text"
                placeholder="🔎 Buscar por Código SKU, Descrição ou Rua..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="g-input text-xs py-2 px-3 bg-[#151b23]/80 border-[#222d3a] text-snow placeholder-[#6a7d92] min-w-[200px]"
              />
              <select value={filterLoc} onChange={e => setFilterLoc(e.target.value)} className="g-input text-xs py-2 px-3 bg-[#151b23]/80 border-[#222d3a]">
                <option value="todos">📍 Todos os Locais</option>
                <option value="central">Estoque Central</option>
                <option value="pnc">PNC (Produto Não Conforme)</option>
                <option value="repack">Repack</option>
                <option value="picking">Picking (Histórico)</option>
                <option value="marketplace">Marketplace (Histórico)</option>
              </select>
              <select value={filterBloco} onChange={e => setFilterBloco(e.target.value)} className="g-input text-xs py-2 px-3 bg-[#151b23]/80 border-[#222d3a]">
                <option value="todos">📦 Todos os Blocos / Ruas</option>
                <optgroup label="Bloco A">
                  <option value="A1">Bloco A1</option>
                  <option value="A2">Bloco A2</option>
                  <option value="A3">Bloco A3</option>
                  <option value="A4">Bloco A4</option>
                  <option value="A5">Bloco A5</option>
                  <option value="A6">Bloco A6</option>
                  <option value="A7">Bloco A7</option>
                  <option value="A8">Bloco A8</option>
                </optgroup>
                <optgroup label="Bloco B">
                  <option value="B1">Bloco B1</option>
                  <option value="B2">Bloco B2</option>
                  <option value="B3">Bloco B3</option>
                  <option value="B4">Bloco B4</option>
                </optgroup>
                <optgroup label="Bloco C">
                  <option value="C1">Bloco C1</option>
                  <option value="C2">Bloco C2</option>
                  <option value="C3">Bloco C3</option>
                  <option value="C4">Bloco C4</option>
                </optgroup>
                <optgroup label="Outras Áreas">
                  <option value="Área Picking">Área Picking</option>
                  <option value="Marketplace">Marketplace</option>
                  <option value="Contingência">Contingência</option>
                </optgroup>
              </select>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="g-input text-xs py-2 px-3 bg-[#151b23]/80 border-[#222d3a]">
                <option value="todos">🚦 Todos os Riscos</option>
                <option value="expired">⛔ Vencidos</option>
                <option value="crit">🔴 Críticos (≤30 dias)</option>
                <option value="warn">🟠 Atenção (≤45 dias)</option>
                <option value="alert">🟡 Alertas (≤60 dias)</option>
                <option value="ok">🟢 Estáveis (&gt;60 dias)</option>
              </select>
              <select value={filterSemana} onChange={e => setFilterSemana(e.target.value === 'todas' ? 'todas' : Number(e.target.value))} className="g-input text-xs py-2 px-3 bg-[#151b23]/80 border-[#222d3a] text-purple-300 font-bold">
                <option value="todas">🗓️ Todas as Semanas</option>
                <option value="3">🗓️ 3ª Semana de Agosto (21/08 - Sexta Passada - Base Atual)</option>
                <option value="4">🗓️ 4ª Semana de Agosto (28/08 - Esta Sexta)</option>
                <option value="1">🗓️ 1ª Semana de Agosto (01–07/08)</option>
                <option value="2">🗓️ 2ª Semana de Agosto (08–14/08)</option>
              </select>
              <select value={sortOrder} onChange={e => setSortSort(e.target.value as any)} className="g-input text-xs py-2 px-3 bg-[#151b23]/80 border-[#222d3a]">
                <option value="asc">📅 Mais Próximos</option>
                <option value="desc">📅 Mais Distantes</option>
              </select>

              <button
                type="button"
                onClick={handleClearAll}
                className="px-3 py-2 bg-red-600/15 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ml-auto"
                title="Zerar toda a lista de estoque para iniciar uma nova coleta"
              >
                🗑️ Zerar Lista
              </button>
            </div>
            
            <span className="text-[10px] uppercase font-bold text-[#6a7d92] tracking-wider">
              {entriesToDisplay.length} lotes encontrados
            </span>
          </div>

          {/* List content */}
          <div className="flex flex-col gap-3">
            {(() => {
              const grouped = entriesToDisplay.reduce((acc, r) => {
                const key = getRegDateKey(r);
                if (!acc[key]) acc[key] = [];
                acc[key].push(r);
                return acc;
              }, {} as Record<string, ValidadeRow[]>);

              const sortedRegDateKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

              if (sortedRegDateKeys.length === 0) {
                return (
                  <div className="g-card p-12 text-center flex flex-col items-center justify-center gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-[#151b23] border border-[#222d3a] flex items-center justify-center text-3xl mb-1">
                      📦
                    </div>
                    <h3 className="text-base font-bold text-snow">Estoque Zerado / Aguardando Coleta</h3>
                    <p className="text-xs text-[#6a7d92] max-w-md">
                      Nenhum lote registrado no momento. A lista de estoque, o painel FEFO e o Workstation CCO serão atualizados automaticamente a partir da coleta realizada pelo conferente.
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <button
                        type="button"
                        onClick={() => setActiveTab('form')}
                        className="px-5 py-2.5 bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] text-white font-bold text-xs rounded-xl shadow-md hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-2"
                      >
                        ➕ Cadastrar Novo Lote de Validade
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div className="flex flex-col gap-3">
                  {/* Barra de controle rápido: Minimizar / Expandir Todos */}
                  <div className="flex items-center justify-between gap-2 p-2.5 px-3.5 bg-slate-100/90 dark:bg-[#151b23]/90 border border-slate-200 dark:border-[#222d3a] rounded-xl text-xs flex-wrap">
                    <span className="text-slate-600 dark:text-slate-400 font-medium text-[11px] flex items-center gap-1.5">
                      <span>📅</span>
                      <strong className="text-slate-800 dark:text-slate-200 font-bold">{sortedRegDateKeys.length}</strong>
                      <span>{sortedRegDateKeys.length === 1 ? 'data de contagem' : 'datas de contagem agrupadas'}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const allOpen: Record<string, boolean> = {};
                          sortedRegDateKeys.forEach(k => { allOpen[k] = true; });
                          setExpandedDates(allOpen);
                        }}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white dark:bg-[#1a222c] border border-slate-200 dark:border-purple-500/30 text-purple-600 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 cursor-pointer transition-colors shadow-xs"
                      >
                        Expandir Todos
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpandedDates({})}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white dark:bg-[#1a222c] border border-slate-200 dark:border-purple-500/30 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors shadow-xs"
                      >
                        Minimizar Todos
                      </button>
                    </div>
                  </div>

                  {sortedRegDateKeys.map(regDateKey => {
                    const rows = grouped[regDateKey];
                    const isOpen = !!expandedDates[regDateKey];

                    let formattedRegDate = regDateKey;
                    try {
                      const [y, m, d] = regDateKey.split('-');
                      const dt = new Date(Number(y), Number(m) - 1, Number(d));
                      const daysOfWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
                      formattedRegDate = `${d}/${m}/${y} — ${daysOfWeek[dt.getDay()]}`;
                    } catch (e) {}

                    return (
                      <div key={regDateKey} className="g-card overflow-hidden">
                        <div 
                          onClick={() => toggleDateGroup(regDateKey)}
                          className="p-3.5 sm:p-4 bg-white dark:bg-[#151b23] flex items-center justify-between cursor-pointer select-none gap-3 hover:bg-slate-50 dark:hover:bg-[#1a222c] transition-colors border-b border-slate-100 dark:border-[#222d3a]/60"
                        >
                          <div className="flex items-center gap-2 sm:gap-3 flex-wrap flex-1 min-w-0">
                            <span className="font-sans font-bold text-xs sm:text-sm text-[#8b5cf6] tracking-wide break-words">
                              📅 Registros de: {formattedRegDate}
                            </span>
                            <span className="text-[10px] bg-slate-100 dark:bg-[#11151c] border border-slate-200 dark:border-[#222d3a] px-2.5 py-0.5 rounded-full font-bold text-slate-700 dark:text-snow shrink-0">
                              {rows.length} {rows.length === 1 ? 'lote registrado' : 'lotes registrados'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2.5 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleExcluirColetaCompleta(regDateKey);
                              }}
                              title={`Remover todos os ${rows.length} lotes desta coleta (${formattedRegDate})`}
                              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-red-500/10 hover:bg-red-500/25 border border-red-500/30 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remover Coleta</span>
                            </button>
                            <div className="flex items-center gap-1.5 text-slate-400 dark:text-[#6a7d92]">
                              <span className="text-[11px] font-semibold hidden xs:inline">{isOpen ? 'Recolher' : 'Expandir'}</span>
                              <ChevronDown className="w-4 h-4 transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                            </div>
                          </div>
                        </div>

                        {isOpen && (
                          <div className="p-4 flex flex-col gap-3 bg-[#0c1015]/40 border-t border-[#222d3a]/40">
                        {rows.map((r, i) => {
                          const days = getDaysRemaining(r.validade);
                          const spec = getStatusLabelAndStyles(days);
                          const descDays = days < 0 
                            ? `${Math.abs(days)} dias atrasados` 
                            : days === 0 
                            ? 'Vence hoje' 
                            : `${days} dias restantes`;

                          let formattedValidadeDate = formatDateToBR(r.validade);

                          return (
                            <div key={r.id || r._docId || i} className="border border-[#222d3a] rounded-xl p-4 bg-[#0f1318] flex flex-col sm:flex-row items-center justify-between gap-4 hover:border-[#334155] transition-all shadow-sm text-center sm:text-left">
                              <div className="flex-1 min-w-0 w-full flex flex-col items-center sm:items-start text-center sm:text-left">
                                <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap mb-1.5 w-full">
                                  <span className="text-[9px] bg-[#151b23] border border-[#222d3a] px-2 py-0.5 rounded font-black text-[#f5a623] font-mono">
                                    SKU: {r.codigo}
                                  </span>
                                  <span className="text-[9px] bg-[#151b23] px-2 py-0.5 rounded uppercase font-bold text-[#6a7d92]">
                                    {r.localizacao === 'central'
                                      ? 'Estoque Central'
                                      : r.localizacao === 'pnc'
                                      ? 'PNC'
                                      : r.localizacao === 'repack'
                                      ? 'Repack'
                                      : r.localizacao === 'picking'
                                      ? 'Picking'
                                      : r.localizacao === 'marketplace'
                                      ? 'Marketplace'
                                      : r.localizacao || 'Estoque Central'}
                                    {r.bloco ? ` — Bloco ${r.bloco}` : ''}
                                  </span>
                                  <span className="text-[9px] bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded font-bold text-[#a78bfa]">
                                    📅 Vencimento: {formattedValidadeDate}
                                  </span>
                                  <span className="text-[9px] bg-purple-600/20 border border-purple-500/40 px-2 py-0.5 rounded font-black text-purple-300">
                                    🗓️ Sem. {r.semanaNumero || getSemanaDoMesFromDate(r.dataColeta || '21/08/2026')}
                                  </span>
                                  <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${spec.bg || 'bg-slate-800'} ${spec.text} border-current/20`}>
                                    {spec.label}
                                  </span>
                                  <span className="text-[9px] text-[#6a7d92] font-semibold">
                                    ⏳ {descDays}
                                  </span>
                                </div>
                                <h4 className="text-sm font-bold text-snow truncate w-full text-center sm:text-left">{r.descricao}</h4>
                                {(() => {
                                  const pkg = getPackagingInfo(r.codigo, empresaId);
                                  const totalCx = r.quantidade !== undefined && r.quantidade > 0 
                                    ? r.quantidade 
                                    : calcularTotalCaixas(r.codigo, r.palhete, r.lastro, r.caixa, empresaId);
                                  return (
                                    <div className="flex justify-center sm:justify-start gap-3 flex-wrap text-xs text-[#6a7d92] mt-2 font-mono font-semibold w-full items-center">
                                      {r.palhete > 0 && (
                                        <span className="bg-[#151b23] border border-[#222d3a] px-2 py-0.5 rounded text-amber-300">
                                          🪵 {r.palhete} pal ({pkg.caixasPallet} cx/pal)
                                        </span>
                                      )}
                                      {r.lastro > 0 && (
                                        <span className="bg-[#151b23] border border-[#222d3a] px-2 py-0.5 rounded text-cyan-300">
                                          🗃 {r.lastro} las ({pkg.lastro} cx/las)
                                        </span>
                                      )}
                                      {r.caixa > 0 && (
                                        <span className="bg-[#151b23] border border-[#222d3a] px-2 py-0.5 rounded text-emerald-300">
                                          📦 {r.caixa} avulsas
                                        </span>
                                      )}
                                      <span className="text-emerald-400 font-bold bg-emerald-950/50 border border-emerald-500/40 px-2.5 py-0.5 rounded text-[11px]">
                                        🔢 Total: {totalCx} {totalCx === 1 ? 'Caixa' : 'Caixas'}
                                      </span>
                                    </div>
                                  );
                                })()}
                              </div>
                              
                              <div className="flex gap-2 self-end sm:self-auto items-center flex-wrap">
                                <button 
                                  onClick={() => handleAbrirRetirada(r)}
                                  title="Registrar retirada física do armazém e dar baixa como Conferente"
                                  className="py-1.5 px-3 border border-red-500/50 bg-red-500/20 hover:bg-red-500/30 text-red-200 text-xs font-bold rounded-lg cursor-pointer transition-colors flex items-center gap-1.5"
                                >
                                  <span>📦</span> Retirar do Armazém
                                </button>
                                <button 
                                  id={`btn-validades-pnc-${r.id}`}
                                  onClick={() => handleSendRowToPnc(r)}
                                  title="Encaminhar este item imediatamente para a Guia de PNC para tratativa"
                                  className="py-1.5 px-3 border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/25 text-amber-300 text-xs font-semibold rounded-lg cursor-pointer transition-colors flex items-center gap-1.5"
                                >
                                  <span>🚨</span> PNC
                                </button>
                                <button 
                                  onClick={() => handleEditInit(r)}
                                  className="py-1.5 px-3 border border-[#222d3a] hover:border-[#6a7d92] bg-[#151b23] text-xs font-semibold text-snow rounded-lg cursor-pointer transition-colors"
                                >
                                  🔄 Realizar Recontagem
                                </button>
                                <button 
                                  onClick={() => handleDelete(r)}
                                  className="py-1.5 px-3 border border-red/20 bg-red/10 hover:bg-red/20 text-[#fca5a5] text-xs font-semibold rounded-lg cursor-pointer transition-colors"
                                >
                                  🗑 Excluir
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}
          </div>

        </div>
      ) : activeTab === 'stock_age' ? (
        <StockAgeIndexTab 
          validadesList={validadesList} 
          user={user} 
          empresa={empresa} 
        />
      ) : activeTab === 'futuro_shelf' ? (
        <FuturoShelfTab 
          validadesList={validadesList} 
          user={user} 
          empresa={empresa} 
        />
      ) : activeTab === 'escoamento' ? (
        <GestaoEscoamentoTab 
          validadesList={validadesList} 
          user={user} 
          empresa={empresa} 
          onRefresh={() => {
            const saved = localStorage.getItem(`validades_${empresaId}`);
            if (saved) {
              try {
                const rows = JSON.parse(saved);
                setValidadesList(rows);
              } catch (e) {}
            }
          }}
        />
      ) : activeTab === 'retiradas' ? (
        <ValidadesRetiradasTab 
          empresaId={empresaId}
          onRefresh={() => {
            const saved = localStorage.getItem(`validades_${empresaId}`);
            if (saved) {
              try {
                const rows = JSON.parse(saved);
                setValidadesList(rows);
              } catch (e) {}
            }
          }}
        />
      ) : activeTab === 'fefo_quadro' ? (
        /* QUADRO GERAL DE ALERTAS FEFO UNIFICADO */
        <div className="flex flex-col gap-6 font-sans">
          
          {/* Header Banner */}
          <div className="bg-white dark:bg-[#151b23] border border-slate-200 dark:border-[#222d3a] p-5 sm:p-6 rounded-2xl shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-red-600 text-white font-black px-2.5 py-0.5 rounded tracking-wider uppercase">
                    Quadro Central de Alertas
                  </span>
                  <span className="text-[10px] bg-slate-100 text-slate-700 border border-slate-200 dark:bg-[#222d3a] dark:text-snow dark:border-[#303e4e] px-2 py-0.5 rounded font-bold uppercase">
                    Conferência Operacional FEFO
                  </span>
                </div>
                <h2 className="font-sans font-black text-lg tracking-wider uppercase text-slate-900 dark:text-snow mt-2 flex items-center gap-2">
                  🚨 Dashboard & Quadro de Alertas de Quebra de FEFO
                </h2>
                <p className="text-xs text-slate-600 dark:text-[#a0aec0] mt-1 max-w-2xl">
                  Centralização em tempo real de todos os desvios de FEFO. Alertas são atualizados automaticamente ao lançar ou importar dados de validade.
                </p>
              </div>

              {/* Quick Metrics Badges */}
              <div className="flex gap-2 flex-wrap">
                <div className="bg-red-50/80 dark:bg-[#1a222c] border border-red-200 dark:border-red-500/40 p-3 rounded-xl text-center min-w-[120px] shadow-xs">
                  <span className="block text-xl font-black text-red-600 dark:text-red-400">{quebrasFefoPicking.length}</span>
                  <span className="text-[9px] font-bold text-slate-600 dark:text-[#6a7d92] uppercase">Estoque x Picking</span>
                  <span className="block text-[8px] font-bold text-red-600/90 dark:text-red-400/80">Tol. Zero</span>
                </div>
                <div className="bg-amber-50/80 dark:bg-[#1a222c] border border-amber-200 dark:border-amber-500/40 p-3 rounded-xl text-center min-w-[120px] shadow-xs">
                  <span className="block text-xl font-black text-amber-600 dark:text-amber-400">{quebrasFefoEstoque.length}</span>
                  <span className="text-[9px] font-bold text-slate-600 dark:text-[#6a7d92] uppercase">Estoque x Estoque</span>
                  <span className="block text-[8px] font-bold text-amber-600/90 dark:text-amber-400/80">Tol. 7 Dias</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 1: QUEBRAS ESTOQUE X PICKING (TOLERÂNCIA ZERO) */}
          <div className="bg-white dark:bg-[#151b23] border border-red-200 dark:border-red-500/40 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-[#222d3a] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-red-600 text-white font-black px-2.5 py-0.5 rounded tracking-wider uppercase">
                    Regra FEFO Estoque x Picking
                  </span>
                  <span className="text-[10px] bg-red-100 text-red-700 border border-red-300 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/40 px-2.5 py-0.5 rounded font-black uppercase">
                    Tolerância ZERO
                  </span>
                </div>
                <h3 className="font-sans font-bold text-sm tracking-wider uppercase text-red-600 dark:text-red-400 mt-2">
                  ⚡ Inversões entre Área Picking e Estoque Central ({quebrasFefoPicking.length})
                </h3>
                <p className="text-xs text-slate-600 dark:text-[#a0aec0] mt-1">
                  A Área Picking deve conter o lote com a validade mais antiga. Qualquer produto no Estoque Central mais antigo do que o Picking gera alerta imediato.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={() => {
                    requestAllFefoDemands(empresaId, user.nome || 'Conferente');
                    setFefoDemands(getStoredFefoDemands(empresaId));
                  }}
                  className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl text-xs uppercase transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  🚜 Delegar Todas ao Empilhador
                </button>
                <button 
                  type="button"
                  onClick={() => setActiveTab('fefo_picking')}
                  className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500 dark:hover:text-white rounded-xl text-xs font-bold uppercase transition-colors cursor-pointer"
                >
                  Ver Guia Exclusiva →
                </button>
              </div>
            </div>

            {quebrasFefoPicking.length === 0 ? (
              <div className="p-8 bg-slate-50 dark:bg-[#151b23] border border-emerald-300 dark:border-emerald-500/30 rounded-xl text-center flex flex-col items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 flex items-center justify-center text-lg mb-2">
                  ✓
                </div>
                <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  Área Picking 100% Conforme com o Estoque
                </h4>
                <p className="text-xs text-slate-600 dark:text-[#a0aec0] mt-1">
                  Todos os produtos no Picking possuem datas iguais ou mais antigas que os lotes estocados nas ruas do Estoque Central.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3.5">
                {quebrasFefoPicking.map((q, idx) => (
                  <div key={idx} className="bg-slate-50/70 dark:bg-[#151b23] border border-red-200 dark:border-red-500/40 p-4 sm:p-5 rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 space-y-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-xs text-slate-800 bg-white dark:text-snow dark:bg-[#222d3a] px-2.5 py-1 rounded-md border border-slate-300 dark:border-[#303e4e]">
                          {q.codigo}
                        </span>
                        <span className="font-bold text-sm text-slate-900 dark:text-snow">{q.descricao}</span>
                        <span className="text-[10px] font-black uppercase text-red-700 bg-red-100 border border-red-300 dark:text-red-400 dark:bg-red-500/20 dark:border-red-500/30 px-2.5 py-0.5 rounded">
                          Quebra Crítica: +{q.diasInversao} dia(s)
                        </span>
                      </div>

                      <p className="text-xs text-red-800 dark:text-red-300 font-semibold leading-relaxed bg-red-50/80 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40 p-2.5 rounded-lg">
                        {q.mensagem}
                      </p>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[11px]">
                        <div className="bg-white dark:bg-[#1a222c] p-2.5 rounded-lg border border-slate-200 dark:border-[#2d3a4b] shadow-xs">
                          <span className="text-[10px] font-bold text-slate-500 dark:text-[#6a7d92] uppercase block tracking-wider">Validade no Picking</span>
                          <span className="font-mono font-bold text-sm text-slate-900 dark:text-snow">{q.validadePicking}</span>
                        </div>
                        <div className="bg-white dark:bg-[#1a222c] p-2.5 rounded-lg border border-slate-200 dark:border-[#2d3a4b] shadow-xs">
                          <span className="text-[10px] font-bold text-slate-500 dark:text-[#6a7d92] uppercase block tracking-wider">Validade no Estoque ({q.ruaEstoque})</span>
                          <span className="font-mono font-bold text-sm text-red-600 dark:text-red-400">{q.validadeEstoque}</span>
                        </div>
                        <div className="bg-red-50 dark:bg-red-500/20 p-2.5 rounded-lg border border-red-200 dark:border-red-500/40 col-span-2 sm:col-span-1 shadow-xs">
                          <span className="text-[10px] font-bold text-red-700 dark:text-red-300 uppercase block tracking-wider">Desvio de Tolerância</span>
                          <span className="font-mono font-bold text-sm text-red-700 dark:text-red-400">+{q.diasInversao} dia(s) no Picking</span>
                        </div>
                      </div>

                      {renderDelegationStatus('estoque_x_picking', q.codigo)}
                    </div>

                    <div className="flex flex-col gap-2 md:w-56">
                      <button 
                        onClick={() => {
                          setSearchQuery(q.codigo);
                          setActiveTab('lista');
                        }}
                        className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-900 text-white dark:bg-[#222d3a] dark:hover:bg-[#8b5cf6] dark:text-snow rounded-xl text-xs font-bold uppercase transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        📋 Ver Lotes no Estoque
                      </button>
                      <button 
                        onClick={() => setSelectedProductAlert({ codigo: q.codigo, descricao: q.descricao })}
                        className="w-full py-2.5 px-3 bg-white hover:bg-red-50 text-red-700 border border-red-300 dark:bg-red-500/20 dark:border-red-500/40 dark:text-red-300 dark:hover:bg-red-500 dark:hover:text-white rounded-xl text-xs font-bold uppercase transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        🔍 Inspecionar SKU
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 2: QUEBRAS ESTOQUE X ESTOQUE (TOLERÂNCIA 7 DIAS) */}
          <div className="bg-white dark:bg-[#151b23] border border-amber-200 dark:border-amber-500/40 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-[#222d3a] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-2.5 py-0.5 rounded tracking-wider uppercase">
                    Regra FEFO Estoque x Estoque
                  </span>
                  <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30 px-2.5 py-0.5 rounded font-bold">
                    Tolerância de 7 Dias (1 Semana)
                  </span>
                </div>
                <h3 className="font-sans font-bold text-sm tracking-wider uppercase text-amber-700 dark:text-amber-400 mt-2">
                  🔍 Inversões entre Ruas / Blocos do Estoque Central ({quebrasFefoEstoque.length})
                </h3>
                <p className="text-xs text-slate-600 dark:text-[#a0aec0] mt-1">
                  A rua mais próxima do Picking (menor número/rua A1) deve conter o produto com validade mais próxima de vencer. Inversões são sinalizadas se excederem 7 dias.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={() => {
                    requestAllFefoDemands(empresaId, user.nome || 'Conferente');
                    setFefoDemands(getStoredFefoDemands(empresaId));
                  }}
                  className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl text-xs uppercase transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  🚜 Delegar Todas ao Empilhador
                </button>
                <button 
                  type="button"
                  onClick={() => setActiveTab('fefo_estoque')}
                  className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-300 dark:hover:bg-amber-500 dark:hover:text-white rounded-xl text-xs font-bold uppercase transition-colors cursor-pointer"
                >
                  Ver Guia Exclusiva →
                </button>
              </div>
            </div>

            {quebrasFefoEstoque.length === 0 ? (
              <div className="p-8 bg-slate-50 dark:bg-[#151b23] border border-emerald-300 dark:border-emerald-500/30 rounded-xl text-center flex flex-col items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 flex items-center justify-center text-lg mb-2">
                  ✓
                </div>
                <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  Sequência das Ruas 100% Conforme
                </h4>
                <p className="text-xs text-slate-600 dark:text-[#a0aec0] mt-1">
                  Todas as ruas respeitam a regra de proximidade do Picking ou possuem variações dentro da tolerância aceita de 7 dias.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3.5">
                {quebrasFefoEstoque.map((q, idx) => (
                  <div key={idx} className="bg-slate-50/70 dark:bg-[#151b23] border border-amber-200 dark:border-amber-500/30 p-4 sm:p-5 rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 space-y-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-xs text-slate-800 bg-white dark:text-snow dark:bg-[#222d3a] px-2.5 py-1 rounded-md border border-slate-300 dark:border-[#303e4e]">
                          {q.codigo}
                        </span>
                        <span className="font-bold text-sm text-slate-900 dark:text-snow">{q.descricao}</span>
                        <span className="text-[10px] font-black uppercase text-amber-800 bg-amber-100 border border-amber-300 dark:text-amber-400 dark:bg-amber-500/20 dark:border-amber-500/30 px-2.5 py-0.5 rounded">
                          Inversão: +{q.diasInversao} dias
                        </span>
                      </div>

                      <p className="text-xs text-amber-900 dark:text-amber-300 font-semibold leading-relaxed bg-amber-50/80 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 p-2.5 rounded-lg">
                        {q.mensagem}
                      </p>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[11px]">
                        <div className="bg-white dark:bg-[#1a222c] p-2.5 rounded-lg border border-slate-200 dark:border-[#2d3a4b] shadow-xs">
                          <span className="text-[10px] font-bold text-slate-500 dark:text-[#6a7d92] uppercase block tracking-wider">Rua Próxima ({q.ruaProxima})</span>
                          <span className="font-mono font-bold text-sm text-slate-900 dark:text-snow">{q.validadeRuaProxima}</span>
                        </div>
                        <div className="bg-white dark:bg-[#1a222c] p-2.5 rounded-lg border border-slate-200 dark:border-[#2d3a4b] shadow-xs">
                          <span className="text-[10px] font-bold text-slate-500 dark:text-[#6a7d92] uppercase block tracking-wider">Rua Distante ({q.ruaDistante})</span>
                          <span className="font-mono font-bold text-sm text-amber-600 dark:text-amber-400">{q.validadeRuaDistante}</span>
                        </div>
                        <div className="bg-amber-50 dark:bg-amber-500/10 p-2.5 rounded-lg border border-amber-200 dark:border-amber-500/30 col-span-2 sm:col-span-1 shadow-xs">
                          <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase block tracking-wider">Inversão Excedente</span>
                          <span className="font-mono font-bold text-sm text-amber-800 dark:text-amber-400">+{q.diasInversao} dias</span>
                        </div>
                      </div>

                      {renderDelegationStatus('estoque_x_estoque', q.codigo)}
                    </div>

                    <div className="flex flex-col gap-2 md:w-56">
                      <button 
                        onClick={() => {
                          setSearchQuery(q.codigo);
                          setActiveTab('lista');
                        }}
                        className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-900 text-white dark:bg-[#222d3a] dark:hover:bg-[#8b5cf6] dark:text-snow rounded-xl text-xs font-bold uppercase transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        📋 Ver Lotes no Estoque
                      </button>
                      <button 
                        onClick={() => setSelectedProductAlert({ codigo: q.codigo, descricao: q.descricao })}
                        className="w-full py-2.5 px-3 bg-white hover:bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-500/20 dark:border-amber-500/40 dark:text-amber-300 dark:hover:bg-amber-500 dark:hover:text-white rounded-xl text-xs font-bold uppercase transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        🔍 Inspecionar SKU
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'fefo_picking' ? (
        /* GUIA ESPECÍFICA ESTOQUE X PICKING COM FILTRO PERSONALIZADO E FORMATO LISTA */
        <div className="bg-white dark:bg-[#151b23] border border-red-200 dark:border-red-500/40 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col gap-5 font-sans">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-[#222d3a] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-red-600 text-white font-black px-2.5 py-0.5 rounded tracking-wider uppercase">
                  Guia Exclusiva Estoque x Picking
                </span>
                <span className="text-[10px] bg-red-100 text-red-700 border border-red-300 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/40 px-2.5 py-0.5 rounded font-black uppercase">
                  Tolerância ZERO
                </span>
              </div>
              <h3 className="font-sans font-bold text-base tracking-wider uppercase text-red-600 dark:text-red-400 mt-2">
                ⚡ Inversões de FEFO entre Área Picking e Estoque Central ({quebrasFefoPicking.length})
              </h3>
              <p className="text-xs text-slate-600 dark:text-[#a0aec0] mt-1">
                Visualização dedicada exclusivamente às quebras de tolerância zero entre a Área Picking e as ruas do Estoque Central.
              </p>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              {/* Toggle de Visualização Lista / Cards */}
              <div className="flex bg-slate-100 dark:bg-[#222d3a] p-1 rounded-xl border border-slate-200 dark:border-[#303e4e]">
                <button
                  type="button"
                  onClick={() => setFefoPickingViewMode('lista')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all cursor-pointer ${
                    fefoPickingViewMode === 'lista'
                      ? 'bg-white dark:bg-slate-800 text-red-600 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  📋 Lista
                </button>
                <button
                  type="button"
                  onClick={() => setFefoPickingViewMode('cards')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all cursor-pointer ${
                    fefoPickingViewMode === 'cards'
                      ? 'bg-white dark:bg-slate-800 text-red-600 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  🗂 Cards
                </button>
              </div>

              <button 
                type="button"
                onClick={() => {
                  requestAllFefoDemands(empresaId, user.nome || 'Conferente');
                  setFefoDemands(getStoredFefoDemands(empresaId));
                }}
                className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl text-xs uppercase transition-all shadow-xs cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
              >
                🚜 Delegar Todas ao Empilhador
              </button>
            </div>
          </div>

          {/* FILTRO DE DATA E SEMANA PERSONALIZADO ESTOQUE X PICKING */}
          <div className="bg-slate-50 dark:bg-[#1a222c] p-4 rounded-xl border border-slate-200 dark:border-[#2d3a4b] flex flex-col md:flex-row md:items-end justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  📅 Data Inicial (Coleta/Validade)
                </label>
                <input
                  type="date"
                  value={fefoPickingStartDate}
                  onChange={(e) => setFefoPickingStartDate(e.target.value)}
                  className="px-3 py-1.5 bg-white dark:bg-[#151b23] border border-slate-300 dark:border-[#303e4e] rounded-lg text-xs font-mono font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  📅 Data Final
                </label>
                <input
                  type="date"
                  value={fefoPickingEndDate}
                  onChange={(e) => setFefoPickingEndDate(e.target.value)}
                  className="px-3 py-1.5 bg-white dark:bg-[#151b23] border border-slate-300 dark:border-[#303e4e] rounded-lg text-xs font-mono font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  🗓️ Sexta-feira da Coleta / Semana
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setFefoPickingSemana('todas');
                      setFefoPickingStartDate('');
                      setFefoPickingEndDate('');
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      fefoPickingSemana === 'todas' && !fefoPickingStartDate && !fefoPickingEndDate
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'bg-white dark:bg-[#151b23] border border-slate-300 dark:border-[#303e4e] text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Todas
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFefoPickingSemana(3);
                      setFefoPickingStartDate('2026-08-21');
                      setFefoPickingEndDate('2026-08-21');
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      fefoPickingStartDate === '2026-08-21' && fefoPickingEndDate === '2026-08-21'
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'bg-white dark:bg-[#151b23] border border-slate-300 dark:border-[#303e4e] text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Sexta 21/08 (Sem 3)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFefoPickingSemana(4);
                      setFefoPickingStartDate('2026-08-28');
                      setFefoPickingEndDate('2026-08-28');
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      fefoPickingStartDate === '2026-08-28' && fefoPickingEndDate === '2026-08-28'
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'bg-white dark:bg-[#151b23] border border-slate-300 dark:border-[#303e4e] text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Sexta 28/08 (Sem 4)
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar SKU, descrição ou rua..."
                  value={fefoPickingSearch}
                  onChange={(e) => setFefoPickingSearch(e.target.value)}
                  className="pl-3 pr-8 py-1.5 bg-white dark:bg-[#151b23] border border-slate-300 dark:border-[#303e4e] rounded-lg text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-red-500 w-52 sm:w-64"
                />
                {fefoPickingSearch && (
                  <button
                    type="button"
                    onClick={() => setFefoPickingSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {(fefoPickingStartDate || fefoPickingEndDate || fefoPickingSemana !== 'todas' || fefoPickingSearch) && (
                <button
                  type="button"
                  onClick={() => {
                    setFefoPickingStartDate('');
                    setFefoPickingEndDate('');
                    setFefoPickingSemana('todas');
                    setFefoPickingSearch('');
                  }}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-[#222d3a] hover:bg-slate-300 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold cursor-pointer transition-all"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          {quebrasFefoPicking.length === 0 ? (
            <div className="p-12 bg-slate-50 dark:bg-[#151b23] border border-emerald-300 dark:border-emerald-500/30 rounded-2xl text-center flex flex-col items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 flex items-center justify-center text-xl mb-2">
                ✓
              </div>
              <h4 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                Nenhuma Quebra Estoque x Picking Encontrada no Período
              </h4>
              <p className="text-xs text-slate-600 dark:text-[#a0aec0] mt-1 max-w-lg">
                Sua Área Picking está perfeitamente abastecida com as validades mais antigas do armazém para os filtros selecionados.
              </p>
            </div>
          ) : fefoPickingViewMode === 'lista' ? (
            /* FORMATO LISTA DE ALERTAS ESTOQUE X PICKING */
            <div className="overflow-x-auto border border-red-200 dark:border-red-500/30 rounded-xl bg-white dark:bg-[#151b23] shadow-xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-red-50 dark:bg-red-950/40 text-red-950 dark:text-red-200 border-b border-red-200 dark:border-red-900/40 uppercase text-[10px] font-black tracking-wider">
                    <th className="py-3 px-3">Gravidade / Gap</th>
                    <th className="py-3 px-3">SKU & Descrição</th>
                    <th className="py-3 px-3">Validade no Picking</th>
                    <th className="py-3 px-3">Validade no Estoque</th>
                    <th className="py-3 px-3">Ação Operacional</th>
                    <th className="py-3 px-3 text-center">Delegação Empilhador</th>
                    <th className="py-3 px-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#222d3a]">
                  {quebrasFefoPicking.map((q, idx) => (
                    <tr key={idx} className="hover:bg-red-50/40 dark:hover:bg-red-950/20 transition-colors">
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-800 border border-red-300 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/40">
                          🚨 +{q.diasInversao} dias
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs bg-slate-100 dark:bg-[#222d3a] px-2 py-0.5 rounded border border-slate-200 dark:border-[#303e4e] text-slate-900 dark:text-slate-100">
                            {q.codigo}
                          </span>
                          <span className="font-bold text-slate-800 dark:text-slate-100">
                            {q.descricao}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {q.validadePicking}
                        </div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase">Área Picking</span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-mono font-bold text-red-600 dark:text-red-400">
                          {q.validadeEstoque}
                        </div>
                        <span className="text-[9px] text-red-700 dark:text-red-300 font-black uppercase">
                          Rua {q.ruaEstoque} (Mais Antigo)
                        </span>
                      </td>
                      <td className="py-3 px-3 max-w-xs">
                        <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium leading-tight line-clamp-2" title={q.sugestaoAcao}>
                          {q.sugestaoAcao}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {renderDelegationStatus('estoque_x_picking', q.codigo)}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSearchQuery(q.codigo);
                              setActiveTab('lista');
                            }}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#222d3a] dark:hover:bg-[#303e4e] text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                            title="Ver Lotes no Estoque"
                          >
                            📋
                          </button>
                          <button
                            onClick={() => setSelectedProductAlert({ codigo: q.codigo, descricao: q.descricao })}
                            className="p-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-500/20 text-red-700 dark:text-red-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
                            title="Inspecionar Detalhes do SKU"
                          >
                            🔍
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* FORMATO CARDS ESTOQUE X PICKING */
            <div className="grid grid-cols-1 gap-4">
              {quebrasFefoPicking.map((q, idx) => (
                <div key={idx} className="bg-white dark:bg-[#151b23] border border-red-200 dark:border-red-500/50 p-5 rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 space-y-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-xs text-slate-800 bg-slate-100 dark:text-snow dark:bg-[#222d3a] px-2.5 py-1 rounded-md border border-slate-300 dark:border-[#303e4e]">
                        {q.codigo}
                      </span>
                      <span className="font-bold text-sm text-slate-900 dark:text-snow">{q.descricao}</span>
                      <span className="text-[10px] font-black uppercase text-red-700 bg-red-100 border border-red-300 dark:text-red-400 dark:bg-red-500/20 dark:border-red-500/30 px-2.5 py-0.5 rounded">
                        Quebra Crítica: +{q.diasInversao} dia(s)
                      </span>
                    </div>

                    <p className="text-xs text-red-800 dark:text-red-300 font-semibold leading-relaxed bg-red-50/80 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40 p-2.5 rounded-lg">
                      {q.mensagem}
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-1">
                      <div className="bg-slate-50 dark:bg-[#1a222c] p-2.5 rounded-xl border border-slate-200 dark:border-[#2d3a4b] shadow-xs">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-[#6a7d92] uppercase block tracking-wider">Validade no Picking</span>
                        <span className="font-mono font-bold text-sm text-slate-900 dark:text-snow">{q.validadePicking}</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-[#1a222c] p-2.5 rounded-xl border border-slate-200 dark:border-[#2d3a4b] shadow-xs">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-[#6a7d92] uppercase block tracking-wider">Validade no Estoque ({q.ruaEstoque})</span>
                        <span className="font-mono font-bold text-sm text-red-600 dark:text-red-400">{q.validadeEstoque}</span>
                      </div>
                      <div className="bg-amber-50/90 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-200 dark:border-amber-900/40 col-span-2 sm:col-span-1 shadow-xs">
                        <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase block tracking-wider">Recomendação Operacional</span>
                        <span className="font-medium text-xs text-slate-800 dark:text-amber-100 leading-snug">{q.sugestaoAcao}</span>
                      </div>
                    </div>
                    {renderDelegationStatus('estoque_x_picking', q.codigo)}
                  </div>

                  <div className="flex flex-col gap-2 md:w-56">
                    <button 
                      onClick={() => {
                        setSearchQuery(q.codigo);
                        setActiveTab('lista');
                      }}
                      className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white dark:bg-[#222d3a] dark:hover:bg-[#8b5cf6] dark:text-snow rounded-xl text-xs font-bold uppercase transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      📋 Ver Lotes no Estoque
                    </button>
                    <button 
                      onClick={() => setSelectedProductAlert({ codigo: q.codigo, descricao: q.descricao })}
                      className="w-full py-2.5 px-3 bg-white hover:bg-red-50 text-red-700 border border-red-300 dark:bg-red-500/20 dark:border-red-500/40 dark:text-red-300 dark:hover:bg-red-500 dark:hover:text-white rounded-xl text-xs font-bold uppercase transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      🔍 Inspecionar SKU
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* GUIA ESPECÍFICA ESTOQUE X ESTOQUE COM FILTRO PERSONALIZADO E FORMATO LISTA DE ALERTAS */
        <div className="bg-white dark:bg-[#151b23] border border-amber-200 dark:border-amber-500/40 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col gap-5 font-sans">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-[#222d3a] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-2.5 py-0.5 rounded uppercase tracking-wider">
                  Guia Exclusiva Estoque x Estoque
                </span>
                <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30 px-2.5 py-0.5 rounded font-bold">
                  Tolerância de 7 Dias
                </span>
              </div>
              <h3 className="font-sans font-bold text-base tracking-wider uppercase text-amber-700 dark:text-amber-400 mt-2">
                🔍 Lista de Alertas de Inversão de FEFO entre Ruas / Blocos ({quebrasFefoEstoque.length})
              </h3>
              <p className="text-xs text-slate-600 dark:text-[#a0aec0] mt-1">
                Visualização dedicada às regras de layout e sequenciamento de ruas dentro do Estoque Central com formato em lista estruturada.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Toggle de Visualização Lista / Cards */}
              <div className="flex bg-slate-100 dark:bg-[#222d3a] p-1 rounded-xl border border-slate-200 dark:border-[#303e4e]">
                <button
                  type="button"
                  onClick={() => setFefoEstoqueViewMode('lista')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all cursor-pointer ${
                    fefoEstoqueViewMode === 'lista'
                      ? 'bg-white dark:bg-slate-800 text-amber-700 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  📋 Lista de Alertas
                </button>
                <button
                  type="button"
                  onClick={() => setFefoEstoqueViewMode('cards')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all cursor-pointer ${
                    fefoEstoqueViewMode === 'cards'
                      ? 'bg-white dark:bg-slate-800 text-amber-700 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  🗂 Cards
                </button>
              </div>

              <button 
                type="button"
                onClick={() => {
                  requestAllFefoDemands(empresaId, user.nome || 'Conferente');
                  setFefoDemands(getStoredFefoDemands(empresaId));
                }}
                className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl text-xs uppercase transition-all shadow-xs cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
              >
                🚜 Delegar Todas ao Empilhador
              </button>
            </div>
          </div>

          {/* FILTRO DE DATA E SEMANA PERSONALIZADO ESTOQUE X ESTOQUE */}
          <div className="bg-slate-50 dark:bg-[#1a222c] p-4 rounded-xl border border-slate-200 dark:border-[#2d3a4b] flex flex-col md:flex-row md:items-end justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  📅 Data Inicial (Coleta/Validade)
                </label>
                <input
                  type="date"
                  value={fefoEstoqueStartDate}
                  onChange={(e) => setFefoEstoqueStartDate(e.target.value)}
                  className="px-3 py-1.5 bg-white dark:bg-[#151b23] border border-slate-300 dark:border-[#303e4e] rounded-lg text-xs font-mono font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  📅 Data Final
                </label>
                <input
                  type="date"
                  value={fefoEstoqueEndDate}
                  onChange={(e) => setFefoEstoqueEndDate(e.target.value)}
                  className="px-3 py-1.5 bg-white dark:bg-[#151b23] border border-slate-300 dark:border-[#303e4e] rounded-lg text-xs font-mono font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  🗓️ Sexta-feira da Coleta / Semana
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setFefoEstoqueSemana('todas');
                      setFefoEstoqueStartDate('');
                      setFefoEstoqueEndDate('');
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      fefoEstoqueSemana === 'todas' && !fefoEstoqueStartDate && !fefoEstoqueEndDate
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-white dark:bg-[#151b23] border border-slate-300 dark:border-[#303e4e] text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Todas
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFefoEstoqueSemana(3);
                      setFefoEstoqueStartDate('2026-08-21');
                      setFefoEstoqueEndDate('2026-08-21');
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      fefoEstoqueStartDate === '2026-08-21' && fefoEstoqueEndDate === '2026-08-21'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-white dark:bg-[#151b23] border border-slate-300 dark:border-[#303e4e] text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Sexta 21/08 (Sem 3)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFefoEstoqueSemana(4);
                      setFefoEstoqueStartDate('2026-08-28');
                      setFefoEstoqueEndDate('2026-08-28');
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      fefoEstoqueStartDate === '2026-08-28' && fefoEstoqueEndDate === '2026-08-28'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-white dark:bg-[#151b23] border border-slate-300 dark:border-[#303e4e] text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Sexta 28/08 (Sem 4)
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar SKU, descrição ou rua..."
                  value={fefoEstoqueSearch}
                  onChange={(e) => setFefoEstoqueSearch(e.target.value)}
                  className="pl-3 pr-8 py-1.5 bg-white dark:bg-[#151b23] border border-slate-300 dark:border-[#303e4e] rounded-lg text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500 w-52 sm:w-64"
                />
                {fefoEstoqueSearch && (
                  <button
                    type="button"
                    onClick={() => setFefoEstoqueSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {(fefoEstoqueStartDate || fefoEstoqueEndDate || fefoEstoqueSemana !== 'todas' || fefoEstoqueSearch) && (
                <button
                  type="button"
                  onClick={() => {
                    setFefoEstoqueStartDate('');
                    setFefoEstoqueEndDate('');
                    setFefoEstoqueSemana('todas');
                    setFefoEstoqueSearch('');
                  }}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-[#222d3a] hover:bg-slate-300 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold cursor-pointer transition-all"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          {quebrasFefoEstoque.length === 0 ? (
            <div className="p-12 bg-slate-50 dark:bg-[#151b23] border border-emerald-300 dark:border-emerald-500/30 rounded-2xl text-center flex flex-col items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 flex items-center justify-center text-xl mb-2">
                ✓
              </div>
              <h4 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                Nenhum Desvio de Ruas Encontrado no Período
              </h4>
              <p className="text-xs text-slate-600 dark:text-[#a0aec0] mt-1 max-w-lg">
                Todas as ruas do Estoque Central estão devidamente organizadas conforme as regras de FEFO por bloco para os filtros selecionados.
              </p>
            </div>
          ) : fefoEstoqueViewMode === 'lista' ? (
            /* FORMATO LISTA DE ALERTAS ESTOQUE X ESTOQUE SOLICITADO PELO USUÁRIO */
            <div className="overflow-x-auto border border-amber-200 dark:border-amber-500/30 rounded-xl bg-white dark:bg-[#151b23] shadow-xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-amber-50 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200 border-b border-amber-200 dark:border-amber-900/40 uppercase text-[10px] font-black tracking-wider">
                    <th className="py-3 px-3">Status / Inversão</th>
                    <th className="py-3 px-3">SKU & Descrição</th>
                    <th className="py-3 px-3">Rua Próxima (Mais Novo)</th>
                    <th className="py-3 px-3">Rua Distante (Mais Antigo)</th>
                    <th className="py-3 px-3">Desvio Tolerância</th>
                    <th className="py-3 px-3">Ação Operacional Recomendada</th>
                    <th className="py-3 px-3 text-center">Delegação Empilhador</th>
                    <th className="py-3 px-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#222d3a]">
                  {quebrasFefoEstoque.map((q, idx) => (
                    <tr key={idx} className="hover:bg-amber-50/40 dark:hover:bg-amber-950/20 transition-colors">
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                          q.diasInversao > 30 
                            ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40'
                            : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40'
                        }`}>
                          ⚠️ +{q.diasInversao} dias
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs bg-slate-100 dark:bg-[#222d3a] px-2 py-0.5 rounded border border-slate-200 dark:border-[#303e4e] text-slate-900 dark:text-slate-100">
                            {q.codigo}
                          </span>
                          <span className="font-bold text-slate-800 dark:text-slate-100">
                            {q.descricao}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {q.validadeRuaProxima}
                        </div>
                        <span className="text-[9px] text-slate-500 font-bold uppercase">
                          Rua {q.ruaProxima}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-mono font-bold text-amber-600 dark:text-amber-400">
                          {q.validadeRuaDistante}
                        </div>
                        <span className="text-[9px] text-amber-700 dark:text-amber-300 font-black uppercase">
                          Rua {q.ruaDistante} (Retido)
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                          {q.diasInversao - 7 > 0 ? `+${q.diasInversao - 7}d além tol.` : 'Dentro tol.'}
                        </span>
                      </td>
                      <td className="py-3 px-3 max-w-xs">
                        <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium leading-tight line-clamp-2" title={q.sugestaoAcao}>
                          {q.sugestaoAcao}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {renderDelegationStatus('estoque_x_estoque', q.codigo)}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSearchQuery(q.codigo);
                              setActiveTab('lista');
                            }}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#222d3a] dark:hover:bg-[#303e4e] text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                            title="Ver Lotes no Estoque"
                          >
                            📋
                          </button>
                          <button
                            onClick={() => setSelectedProductAlert({ codigo: q.codigo, descricao: q.descricao })}
                            className="p-1.5 bg-amber-100 hover:bg-amber-200 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
                            title="Inspecionar Detalhes do SKU"
                          >
                            🔍
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* FORMATO CARDS ESTOQUE X ESTOQUE */
            <div className="grid grid-cols-1 gap-4">
              {quebrasFefoEstoque.map((q, idx) => (
                <div key={idx} className="bg-white dark:bg-[#151b23] border border-amber-200 dark:border-amber-500/40 p-5 rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 space-y-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-xs text-slate-800 bg-slate-100 dark:text-snow dark:bg-[#222d3a] px-2.5 py-1 rounded-md border border-slate-300 dark:border-[#303e4e]">
                        {q.codigo}
                      </span>
                      <span className="font-bold text-sm text-slate-900 dark:text-snow">{q.descricao}</span>
                      <span className="text-[10px] font-black uppercase text-amber-800 bg-amber-100 border border-amber-300 dark:text-amber-400 dark:bg-amber-500/20 dark:border-amber-500/30 px-2.5 py-0.5 rounded">
                        Inversão: +{q.diasInversao} dias
                      </span>
                    </div>

                    <p className="text-xs text-amber-900 dark:text-amber-300 font-semibold leading-relaxed bg-amber-50/80 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 p-2.5 rounded-lg">
                      {q.mensagem}
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-1">
                      <div className="bg-slate-50 dark:bg-[#1a222c] p-2.5 rounded-xl border border-slate-200 dark:border-[#2d3a4b] shadow-xs">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-[#6a7d92] uppercase block tracking-wider">Rua Próxima ({q.ruaProxima})</span>
                        <span className="font-mono font-bold text-sm text-slate-900 dark:text-snow">{q.validadeRuaProxima}</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-[#1a222c] p-2.5 rounded-xl border border-slate-200 dark:border-[#2d3a4b] shadow-xs">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-[#6a7d92] uppercase block tracking-wider">Rua Distante ({q.ruaDistante})</span>
                        <span className="font-mono font-bold text-sm text-amber-600 dark:text-amber-400">{q.validadeRuaDistante}</span>
                      </div>
                      <div className="bg-amber-50/90 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-200 dark:border-amber-900/40 col-span-2 sm:col-span-1 shadow-xs">
                        <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase block tracking-wider">Ação Recomendada</span>
                        <span className="font-medium text-xs text-slate-800 dark:text-amber-100 leading-snug">{q.sugestaoAcao}</span>
                      </div>
                    </div>
                    {renderDelegationStatus('estoque_x_estoque', q.codigo)}
                  </div>

                  <div className="flex flex-col gap-2 md:w-56">
                    <button 
                      onClick={() => {
                        setSearchQuery(q.codigo);
                        setActiveTab('lista');
                      }}
                      className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white dark:bg-[#222d3a] dark:hover:bg-[#8b5cf6] dark:text-snow rounded-xl text-xs font-bold uppercase transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      📋 Ver Lotes no Estoque
                    </button>
                    <button 
                      onClick={() => setSelectedProductAlert({ codigo: q.codigo, descricao: q.descricao })}
                      className="w-full py-2.5 px-3 bg-white hover:bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-500/20 dark:border-amber-500/40 dark:text-amber-300 dark:hover:bg-amber-500 dark:hover:text-white rounded-xl text-xs font-bold uppercase transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      🔍 Inspecionar SKU
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: NOTIFICAÇÃO IMEDIATA NO MOMENTO DO LANÇAMENTO OU IMPORTAÇÃO */}
      {importBreaksModalData?.isOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#151b23] border border-red-300 dark:border-red-500/50 rounded-2xl max-w-2xl w-full p-6 shadow-2xl flex flex-col gap-4 text-slate-900 dark:text-snow max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#222d3a] pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                <h3 className="font-sans font-black text-base text-red-600 dark:text-red-400 uppercase tracking-wide">
                  {importBreaksModalData.title}
                </h3>
              </div>
              <button 
                onClick={() => setImportBreaksModalData(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-gray-300 leading-relaxed">
              Foram identificados conflitos com as regras de FEFO do armazém. Verifique os lotes abaixo antes de prosseguir com a movimentação:
            </p>

            {importBreaksModalData.pickingBreaks.length > 0 && (
              <div className="space-y-2 bg-red-50/80 dark:bg-red-950/20 p-4 rounded-xl border border-red-200 dark:border-red-500/30">
                <span className="text-[10px] font-black uppercase text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-500/20 px-2 py-0.5 rounded">
                  ⚡ Quebra Estoque x Picking (Tolerância ZERO)
                </span>
                {importBreaksModalData.pickingBreaks.map((q, i) => (
                  <div key={i} className="text-xs bg-white dark:bg-[#1a222c] p-3 rounded-lg border border-red-200 dark:border-[#2d3a4b] space-y-1 shadow-xs">
                    <div className="font-bold text-slate-900 dark:text-snow">{q.codigo} — {q.descricao}</div>
                    <div className="text-red-700 dark:text-red-300 font-semibold">{q.mensagem}</div>
                    <div className="text-[10px] text-slate-500 dark:text-gray-400">Picking: {q.validadePicking} | Estoque ({q.ruaEstoque}): {q.validadeEstoque}</div>
                  </div>
                ))}
              </div>
            )}

            {importBreaksModalData.estoqueBreaks.length > 0 && (
              <div className="space-y-2 bg-amber-50/80 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-200 dark:border-amber-500/30">
                <span className="text-[10px] font-black uppercase text-amber-800 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/20 px-2 py-0.5 rounded">
                  🔍 Quebra Estoque x Estoque (Tolerância 7 Dias)
                </span>
                {importBreaksModalData.estoqueBreaks.map((q, i) => (
                  <div key={i} className="text-xs bg-white dark:bg-[#1a222c] p-3 rounded-lg border border-amber-200 dark:border-[#2d3a4b] space-y-1 shadow-xs">
                    <div className="font-bold text-slate-900 dark:text-snow">{q.codigo} — {q.descricao}</div>
                    <div className="text-amber-800 dark:text-amber-300 font-semibold">{q.mensagem}</div>
                    <div className="text-[10px] text-slate-500 dark:text-gray-400">Rua Próxima ({q.ruaProxima}): {q.validadeRuaProxima} | Rua Distante ({q.ruaDistante}): {q.validadeRuaDistante}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-slate-200 dark:border-[#222d3a] justify-end">
              <button 
                onClick={() => {
                  setImportBreaksModalData(null);
                  setActiveTab('fefo_quadro');
                }}
                className="py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase rounded-xl transition-all shadow-xs cursor-pointer"
              >
                🚨 Ir para Quadro de Alertas
              </button>
              <button 
                onClick={() => {
                  const code = importBreaksModalData.pickingBreaks[0]?.codigo || importBreaksModalData.estoqueBreaks[0]?.codigo || '';
                  setSearchQuery(code);
                  setImportBreaksModalData(null);
                  setActiveTab('lista');
                }}
                className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-[#222d3a] dark:hover:bg-[#8b5cf6] text-white dark:text-snow font-bold text-xs uppercase rounded-xl transition-all shadow-xs cursor-pointer"
              >
                📋 Ver no Estoque
              </button>
              <button 
                onClick={() => setImportBreaksModalData(null)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white font-bold text-xs uppercase rounded-xl transition-colors cursor-pointer"
              >
                ✕ Ciente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: INSPEÇÃO DETALHADA DOS LOTES DO SKU */}
      {selectedProductAlert && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#151b23] border border-slate-200 dark:border-[#222d3a] rounded-2xl max-w-3xl w-full p-6 shadow-2xl flex flex-col gap-4 text-slate-900 dark:text-snow max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#222d3a] pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-indigo-700 dark:text-[#8b5cf6] bg-indigo-50 dark:bg-[#8b5cf6]/10 px-2 py-0.5 rounded border border-indigo-200 dark:border-[#8b5cf6]/20">
                  Inspeção de Lotes Cadastrados
                </span>
                <h3 className="font-sans font-bold text-base text-slate-900 dark:text-snow mt-1">
                  SKU {selectedProductAlert.codigo} — {selectedProductAlert.descricao}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedProductAlert(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-600 dark:text-gray-400 uppercase tracking-wider block">
                Lotes no Estoque Central / Picking:
              </span>

              {validadesList.filter(r => String(r.codigo).trim() === String(selectedProductAlert.codigo).trim()).length === 0 ? (
                <div className="p-4 bg-slate-50 dark:bg-[#1a222c] text-center text-xs text-slate-500 dark:text-gray-400 rounded-xl border border-slate-200 dark:border-[#2d3a4b]">
                  Nenhum lote ativo cadastrado para este produto.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-[#222d3a] text-[10px] text-slate-500 dark:text-gray-400 uppercase">
                        <th className="p-2.5">Local / Rua</th>
                        <th className="p-2.5">Validade</th>
                        <th className="p-2.5">Qtd Paletes/Caixas</th>
                        <th className="p-2.5">Dias Restantes</th>
                        <th className="p-2.5 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#222d3a]">
                      {validadesList.filter(r => String(r.codigo).trim() === String(selectedProductAlert.codigo).trim()).map((r, i) => {
                        const days = getDaysRemaining(r.validade);
                        const isPicking = r.localizacao === 'picking';
                        return (
                          <tr key={i} className="hover:bg-slate-50 dark:hover:bg-[#1a222c]">
                            <td className="p-2.5 font-bold">
                              <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${isPicking ? 'bg-red-100 text-red-700 border border-red-200 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/40' : 'bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/40'}`}>
                                {isPicking ? 'Área Picking' : `Rua ${r.bloco || 'Central'}`}
                              </span>
                            </td>
                            <td className="p-2.5 font-mono font-bold text-slate-900 dark:text-snow">{formatDateToBR(r.validade)}</td>
                            <td className="p-2.5 text-slate-600 dark:text-gray-300">{r.palhete || 0} pal. | {r.caixa || 0} cx.</td>
                            <td className="p-2.5 font-mono font-bold text-amber-600 dark:text-amber-400">{days} dias</td>
                            <td className="p-2.5 text-right">
                              <button 
                                onClick={() => {
                                  setSelectedProductAlert(null);
                                  handleEditInit(r);
                                  setActiveTab('form');
                                }}
                                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white dark:bg-[#8b5cf6]/20 dark:hover:bg-[#8b5cf6] dark:text-[#c4b5fd] dark:hover:text-white rounded-lg text-[10px] font-bold uppercase transition-all shadow-xs cursor-pointer"
                              >
                                ✏️ Editar
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-[#222d3a]">
              <button 
                onClick={() => setSelectedProductAlert(null)}
                className="py-2.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white font-bold text-xs uppercase rounded-xl transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: IMPORTAR 03.05.19 (VENDA MÉDIA / GIRO DIÁRIO) */}
      <Import030519Modal
        isOpen={showImport030519Modal}
        onClose={() => setShowImport030519Modal(false)}
        companyId={empresaId}
        onSuccess={(msg) => {
          alert(msg);
        }}
      />

      {/* MODAL 4: RETIRADA FÍSICA DE VALIDADE PELO CONFERENTE (BAIXA DE ESTOQUE) */}
      <ModalRetiradaValidade
        isOpen={showRetiradaModal}
        onClose={() => setShowRetiradaModal(false)}
        item={retiradaTargetItem}
        user={user}
        empresaId={empresaId}
        onSuccess={handleRetiradaSuccess}
      />
    </div>
  );
}
export {};
