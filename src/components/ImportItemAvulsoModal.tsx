import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  X, 
  PackagePlus, 
  Calendar, 
  MapPin, 
  Box, 
  Calculator, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Search, 
  FileSpreadsheet,
  Check,
  Sparkles,
  UserCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { PRODUCTS } from '../planosData';
import { getAvailableProductsForConferente } from '../utils/productCatalogData';
import { getPackagingInfo, calcularTotalCaixas } from '../data/coletaPackagingData';
import { ValidadesRepository } from '../db';
import { ValidadeRow, Usuario } from '../types';
import { formatDateToBR, getValidadeQty } from '../utils/fefoDefaultData';
import { getValidadeUniqueId } from './ValidadesRecolhidasModal';
import { saveSharedValidadesSelection } from '../utils/fefoCloudSync';
import { getSemanaDoMesFromDate, getMesKeyFromDate, syncValidadesListToMonthlyColetas } from '../utils/stockAgeMonthlyManager';
import { encaminharItemParaPnc } from '../utils/gestaoPncManager';

export const getTodayDDMMYYYY = (): string => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  return `${day}/${month}/${year}`;
};

export interface ImportItemAvulsoModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  activeCountDate: string; // Data da contagem ativa que está na tabela (ex: 28/08/2026)
  user: Usuario | null;
  selectedValidadesKeys: Set<string>;
  onSuccess: (newItem: ValidadeRow, allUpdatedKeys: Set<string>) => void;
  onSuccessBatch?: (newItems: ValidadeRow[], allUpdatedKeys: Set<string>) => void;
}

export default function ImportItemAvulsoModal({
  isOpen,
  onClose,
  companyId,
  activeCountDate,
  user,
  selectedValidadesKeys,
  onSuccess,
  onSuccessBatch
}: ImportItemAvulsoModalProps) {
  const [activeTab, setActiveTab] = useState<'individual' | 'planilha'>('individual');

  // Form State - Individual
  const [searchProd, setSearchProd] = useState('');
  const [selectedProd, setSelectedProd] = useState<{ codigo: string; descricao: string } | null>(null);
  const [showProdDropdown, setShowProdDropdown] = useState(false);
  const [customSkuMode, setCustomSkuMode] = useState(false);
  const [customCodigo, setCustomCodigo] = useState('');
  const [customDescricao, setCustomDescricao] = useState('');

  // Conferente Box Calculation Formula
  const [palhete, setPalhete] = useState<number>(0);
  const [lastro, setLastro] = useState<number>(0);
  const [caixaAvulsa, setCaixaAvulsa] = useState<number>(0);
  const [directTotalCaixas, setDirectTotalCaixas] = useState<string>('');
  const [useDirectTotal, setUseDirectTotal] = useState(false);

  // Validade and lot
  const [validadeInput, setValidadeInput] = useState('');
  const [validadeIso, setValidadeIso] = useState('');
  const [lote, setLote] = useState('');

  // Location and address
  const [localizacao, setLocalizacao] = useState<'central' | 'pnc' | 'picking'>('central');
  const [bloco, setBloco] = useState('A1');

  // Count Date assignment
  const [useActiveCountDate, setUseActiveCountDate] = useState(true);
  const [customDataColeta, setCustomDataColeta] = useState(activeCountDate || getTodayDDMMYYYY());

  // Batch import state
  const [batchFile, setBatchFile] = useState<File | null>(null);
  const [batchRows, setBatchRows] = useState<Partial<ValidadeRow>[]>([]);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync custom data coleta when activeCountDate changes
  useEffect(() => {
    if (activeCountDate) {
      setCustomDataColeta(activeCountDate);
    }
  }, [activeCountDate]);

  const [catalogTrigger, setCatalogTrigger] = useState(0);

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

  // Catálogo completo de produtos disponíveis na plataforma
  const allAvailableProducts = useMemo(() => {
    return getAvailableProductsForConferente(companyId);
  }, [companyId, catalogTrigger]);

  // Product Autocomplete List
  const filteredProducts = useMemo(() => {
    if (!searchProd.trim()) return allAvailableProducts.slice(0, 15);
    const q = searchProd.toLowerCase().trim();
    return allAvailableProducts.filter(p => 
      String(p.codigo).includes(q) || 
      p.descricao.toLowerCase().includes(q)
    ).slice(0, 25);
  }, [allAvailableProducts, searchProd]);

  // Current SKU code and packaging
  const effectiveCodigo = selectedProd ? selectedProd.codigo : customCodigo.trim();
  const effectiveDescricao = selectedProd ? selectedProd.descricao : customDescricao.trim();
  const pkgInfo = useMemo(() => getPackagingInfo(effectiveCodigo, companyId), [effectiveCodigo, companyId]);

  // Computed total caixas
  const calculatedFormulaCaixas = useMemo(() => {
    return calcularTotalCaixas(effectiveCodigo, palhete, lastro, caixaAvulsa, companyId);
  }, [effectiveCodigo, palhete, lastro, caixaAvulsa, companyId]);

  const effectiveTotalCaixas = useDirectTotal 
    ? (Number(directTotalCaixas) || 0)
    : calculatedFormulaCaixas;

  // Days to expiration calculation
  const expirationDaysInfo = useMemo(() => {
    if (!validadeInput || validadeInput.length < 10) return null;
    const parts = validadeInput.split('/');
    if (parts.length !== 3) return null;
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const y = parseInt(parts[2], 10);
    if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
    const target = new Date(y, m, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let faixa: 'critico' | 'atencao' | 'ok' = 'ok';
    let label = '🟢 Normal (> 60 dias)';
    let badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    
    if (diffDays <= 30) {
      faixa = 'critico';
      label = '🔴 Crítico (≤ 30 dias)';
      badgeClass = 'bg-rose-100 text-rose-800 border-rose-300';
    } else if (diffDays <= 60) {
      faixa = 'atencao';
      label = '🟡 Atenção (31 a 60 dias)';
      badgeClass = 'bg-amber-100 text-amber-800 border-amber-300';
    }

    return { diffDays, faixa, label, badgeClass };
  }, [validadeInput]);

  // Formatter for DD/MM/AAAA input
  const handleValidadeChange = (val: string) => {
    const raw = val.replace(/\D/g, '');
    let formatted = raw;
    if (raw.length > 2 && raw.length <= 4) {
      formatted = `${raw.slice(0, 2)}/${raw.slice(2)}`;
    } else if (raw.length > 4) {
      formatted = `${raw.slice(0, 2)}/${raw.slice(2, 4)}/${raw.slice(4, 8)}`;
    }
    setValidadeInput(formatted);

    // Sync to ISO if valid
    if (formatted.length === 10) {
      const parts = formatted.split('/');
      if (parts.length === 3) {
        setValidadeIso(`${parts[2]}-${parts[1]}-${parts[0]}`);
      }
    }
  };

  const handleIsoDateChange = (iso: string) => {
    setValidadeIso(iso);
    if (iso && iso.includes('-')) {
      const [y, m, d] = iso.split('-');
      setValidadeInput(`${d}/${m}/${y}`);
    }
  };

  const targetDataColeta = useActiveCountDate 
    ? (activeCountDate || getTodayDDMMYYYY()) 
    : (customDataColeta.trim() || getTodayDDMMYYYY());

  // Save Single Item Avulso
  const handleSaveIndividual = async () => {
    setErrorMessage(null);

    if (!effectiveCodigo) {
      setErrorMessage('Por favor, informe ou selecione o código do produto (SKU).');
      return;
    }
    if (!effectiveDescricao) {
      setErrorMessage('Por favor, informe a descrição do produto.');
      return;
    }
    if (!validadeInput || validadeInput.length < 10) {
      setErrorMessage('Por favor, informe uma data de vencimento válida (DD/MM/AAAA).');
      return;
    }
    if (effectiveTotalCaixas <= 0) {
      setErrorMessage('A quantidade total de caixas deve ser maior que zero.');
      return;
    }
    if (localizacao === 'central' && !bloco) {
      setErrorMessage('Para Estoque Central, selecione a Rua / Bloco.');
      return;
    }

    setIsSubmitting(true);

    try {
      const formattedValidadeBR = formatDateToBR(validadeInput);
      const semanaNum = getSemanaDoMesFromDate(targetDataColeta);
      const mesRef = getMesKeyFromDate(targetDataColeta);

      const newRow: ValidadeRow & { empresaId: string } = {
        empresaId: companyId,
        id: Date.now(),
        codigo: String(effectiveCodigo).trim(),
        descricao: effectiveDescricao.trim(),
        palhete: useDirectTotal ? 0 : palhete,
        lastro: useDirectTotal ? 0 : lastro,
        caixa: useDirectTotal ? effectiveTotalCaixas : caixaAvulsa,
        quantidade: effectiveTotalCaixas,
        totalUnitiesRaw: effectiveTotalCaixas,
        totalUnities: effectiveTotalCaixas,
        validade: formattedValidadeBR,
        localizacao: localizacao,
        bloco: (localizacao === 'pnc' || localizacao === 'picking') ? '' : bloco,
        lote: lote.trim() || '',
        dataColeta: targetDataColeta,
        semanaNumero: semanaNum,
        mesReferencia: mesRef,
        cadastradoEm: new Date().toISOString(),
        responsavel: user?.nome || 'Conferente',
        cadastradoPor: user?.nome || 'Conferente',
        origem: 'conferente_avulso_dashboard'
      };

      // 1. Grava no Repositório (Firestore)
      let createdDocId = `val_${newRow.codigo}_${Date.now()}`;
      try {
        const created = await ValidadesRepository.create(newRow, companyId);
        if (created && (created._docId || (created as any).id)) {
          createdDocId = String(created._docId || (created as any).id);
        }
      } catch (repoErr) {
        console.warn('[ImportItemAvulso] Aviso ao gravar no repositório:', repoErr);
      }

      newRow._docId = createdDocId;

      // 2. Grava nos storages locais para sincronização imediata
      const localKeys = [`validades_${companyId}`, `validades_demo`];
      localKeys.forEach(k => {
        try {
          const saved = localStorage.getItem(k);
          let list: ValidadeRow[] = saved ? JSON.parse(saved) : [];
          if (!Array.isArray(list)) list = [];
          list = [newRow, ...list];
          localStorage.setItem(k, JSON.stringify(list));
        } catch (_) {}
      });

      // 3. Atualiza seleção ativa: adiciona o uniqueId do novo item para ficar visível imediatamente
      const itemUniqueId = getValidadeUniqueId(newRow);
      const nextSelected = new Set(selectedValidadesKeys);
      nextSelected.add(itemUniqueId);
      
      // Salva seleção compartilhada na nuvem
      try {
        saveSharedValidadesSelection(companyId, nextSelected, user?.nome || 'Conferente');
      } catch (selErr) {
        console.warn('[ImportItemAvulso] Aviso ao sincronizar seleção compartilhada:', selErr);
      }

      // 4. Se for PNC, encaminha automaticamente
      if (localizacao === 'pnc') {
        try {
          encaminharItemParaPnc({
            codigo: newRow.codigo,
            descricao: newRow.descricao,
            validade: newRow.validade,
            quantidade: newRow.quantidade || 0,
            qtde_bloq_cx: newRow.quantidade || 0,
            motivo: 'Item Avulso Importado no Dashboard como PNC',
            responsavel: user?.nome || 'Conferente',
            localizacaoAnterior: 'Coleta Avulsa Dashboard',
            empresaId: companyId
          }, companyId);
        } catch (pncErr) {
          console.warn('[ImportItemAvulso] Aviso ao encaminhar PNC:', pncErr);
        }
      }

      // 5. Dispara eventos para atualização instantânea em toda a interface
      window.dispatchEvent(new CustomEvent('validades_updated', { 
        detail: { item: newRow, countDate: targetDataColeta } 
      }));
      window.dispatchEvent(new CustomEvent('fefo_selection_updated', { 
        detail: { keys: Array.from(nextSelected) } 
      }));
      window.dispatchEvent(new CustomEvent('local_data_changed', { 
        detail: { type: 'validades' } 
      }));
      window.dispatchEvent(new CustomEvent('stock_age_monthly_updated', { 
        detail: { updated: true } 
      }));

      // 6. Callback de sucesso para o FefoDashboard
      onSuccess(newRow, nextSelected);
      onClose();
    } catch (e: any) {
      console.error('Erro ao salvar item avulso:', e);
      setErrorMessage(`Erro ao registrar item avulso: ${e.message || e}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Process Excel/CSV File for Batch Import
  const handleProcessBatchFile = (file: File) => {
    setBatchError(null);
    setBatchFile(file);
    setIsProcessingBatch(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonRows: any[] = XLSX.utils.sheet_to_json(sheet);

        if (!jsonRows || jsonRows.length === 0) {
          setBatchError('O arquivo selecionado está vazio ou não possui linhas válidas.');
          setIsProcessingBatch(false);
          return;
        }

        const parsedRows: Partial<ValidadeRow>[] = [];

        jsonRows.forEach((r, idx) => {
          const cod = String(r['Código'] || r['codigo'] || r['Cod'] || r['cod'] || r['SKU'] || r['sku'] || '').trim();
          if (!cod) return;

          let desc = String(r['Descrição'] || r['descricao'] || r['Descricao'] || r['Produto'] || r['produto'] || '').trim();
          if (!desc) {
            const found = allAvailableProducts.find(p => String(p.codigo).trim() === cod) || PRODUCTS.find(p => String(p.codigo).trim() === cod);
            desc = found ? found.descricao : `Produto SKU ${cod}`;
          }

          let valRaw = String(r['Validade'] || r['validade'] || r['Vencimento'] || r['vencimento'] || r['Data'] || '').trim();
          // Converter formato Excel serial date se numérico
          if (/^\d{5}$/.test(valRaw)) {
            try {
              const excelDate = new Date(Math.round((Number(valRaw) - 25569) * 86400 * 1000));
              const d = String(excelDate.getUTCDate()).padStart(2, '0');
              const m = String(excelDate.getUTCMonth() + 1).padStart(2, '0');
              const y = excelDate.getUTCFullYear();
              valRaw = `${d}/${m}/${y}`;
            } catch (_) {}
          }
          valRaw = formatDateToBR(valRaw);

          const qtd = Number(r['Quantidade'] || r['quantidade'] || r['Qtd'] || r['qtd'] || r['Caixas'] || r['caixas'] || 0);
          let loc = String(r['Localização'] || r['localizacao'] || r['Local'] || 'central').toLowerCase();
          if (loc.includes('pnc')) loc = 'pnc';
          else if (loc.includes('picking')) loc = 'picking';
          else loc = 'central';

          const rua = String(r['Bloco'] || r['bloco'] || r['Rua'] || r['rua'] || '').trim();
          const lot = String(r['Lote'] || r['lote'] || '').trim();

          if (qtd > 0) {
            parsedRows.push({
              id: Date.now() + idx,
              codigo: cod,
              descricao: desc,
              quantidade: qtd,
              totalUnities: qtd,
              totalUnitiesRaw: qtd,
              palhete: 0,
              lastro: 0,
              caixa: qtd,
              validade: valRaw || formatDateToBR(new Date().toISOString()),
              localizacao: loc as any,
              bloco: rua || (loc === 'central' ? 'A1' : ''),
              lote: lot,
              dataColeta: targetDataColeta,
              responsavel: user?.nome || 'Conferente',
              cadastradoEm: new Date().toISOString()
            });
          }
        });

        if (parsedRows.length === 0) {
          setBatchError('Nenhum item válido foi identificado. Certifique-se de que a planilha contenha colunas como Código/SKU e Quantidade/Caixas.');
        } else {
          setBatchRows(parsedRows);
        }
      } catch (err: any) {
        console.error('Erro ao ler planilha:', err);
        setBatchError(`Erro ao processar planilha: ${err.message || err}`);
      } finally {
        setIsProcessingBatch(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Save Batch Items into Active Count
  const handleSaveBatch = async () => {
    if (batchRows.length === 0) return;
    setIsSubmitting(true);
    setBatchError(null);

    try {
      const createdRows: ValidadeRow[] = [];
      const nextSelected = new Set(selectedValidadesKeys);

      const semanaNum = getSemanaDoMesFromDate(targetDataColeta);
      const mesRef = getMesKeyFromDate(targetDataColeta);

      for (const row of batchRows) {
        const fullRow: ValidadeRow & { empresaId: string } = {
          empresaId: companyId,
          id: row.id || Date.now() + Math.floor(Math.random() * 10000),
          codigo: String(row.codigo).trim(),
          descricao: String(row.descricao).trim(),
          quantidade: Number(row.quantidade) || 0,
          totalUnities: Number(row.quantidade) || 0,
          totalUnitiesRaw: Number(row.quantidade) || 0,
          palhete: row.palhete || 0,
          lastro: row.lastro || 0,
          caixa: row.caixa || Number(row.quantidade) || 0,
          validade: formatDateToBR(row.validade || ''),
          localizacao: row.localizacao || 'central',
          bloco: row.bloco || (row.localizacao === 'central' ? 'A1' : ''),
          lote: row.lote || '',
          dataColeta: targetDataColeta,
          semanaNumero: semanaNum,
          mesReferencia: mesRef,
          cadastradoEm: new Date().toISOString(),
          responsavel: user?.nome || 'Conferente',
          cadastradoPor: user?.nome || 'Conferente',
          origem: 'planilha_avulsa_dashboard'
        };

        try {
          const res = await ValidadesRepository.create(fullRow, companyId);
          fullRow._docId = res?._docId || (res as any)?.id || `val_${fullRow.codigo}_${Date.now()}`;
        } catch (_) {
          fullRow._docId = `val_${fullRow.codigo}_${Date.now()}`;
        }

        createdRows.push(fullRow);
        const uniqueId = getValidadeUniqueId(fullRow);
        nextSelected.add(uniqueId);
      }

      // Update local storage
      const localKeys = [`validades_${companyId}`, `validades_demo`];
      localKeys.forEach(k => {
        try {
          const saved = localStorage.getItem(k);
          let list: ValidadeRow[] = saved ? JSON.parse(saved) : [];
          if (!Array.isArray(list)) list = [];
          list = [...createdRows, ...list];
          localStorage.setItem(k, JSON.stringify(list));
        } catch (_) {}
      });

      // Save shared selection
      try {
        saveSharedValidadesSelection(companyId, nextSelected, user?.nome || 'Conferente');
      } catch (_) {}

      // Dispatch window events
      window.dispatchEvent(new CustomEvent('validades_updated', { 
        detail: { count: createdRows.length, countDate: targetDataColeta } 
      }));
      window.dispatchEvent(new CustomEvent('fefo_selection_updated', { 
        detail: { keys: Array.from(nextSelected) } 
      }));
      window.dispatchEvent(new CustomEvent('local_data_changed', { 
        detail: { type: 'validades' } 
      }));
      window.dispatchEvent(new CustomEvent('stock_age_monthly_updated', { 
        detail: { updated: true } 
      }));

      if (onSuccessBatch) {
        onSuccessBatch(createdRows, nextSelected);
      } else if (createdRows.length > 0) {
        onSuccess(createdRows[0], nextSelected);
      }

      onClose();
    } catch (e: any) {
      console.error('Erro ao salvar planilha de avulsos:', e);
      setBatchError(`Erro ao salvar itens: ${e.message || e}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-[#0f172a] text-slate-100 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-purple-950/40 via-[#131d31] to-[#0f172a] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-xs">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-white">
                  Importar Item Avulso
                </h2>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Coleta do Conferente
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Cadastre um lote avulso ou importe planilha e vincule diretamente à contagem ativa da tabela.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            title="Fechar janela"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Count Banner */}
        <div className="px-4 sm:px-5 py-3 bg-gradient-to-r from-emerald-950/30 via-slate-900 to-slate-900 border-b border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-300">Contagem Ativa na Tabela:</span>
                <span className="text-xs font-black font-mono text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 rounded-md">
                  📅 {activeCountDate || getTodayDDMMYYYY()}
                </span>
                <span className="text-[9.5px] font-black uppercase text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/50">
                  Ativa
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                O item avulso será registrado nesta contagem e ativado automaticamente no filtro da tabela.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <label className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold cursor-pointer">
              <input 
                type="checkbox"
                checked={useActiveCountDate}
                onChange={e => setUseActiveCountDate(e.target.checked)}
                className="w-4 h-4 text-emerald-500 rounded border-slate-700 bg-slate-800 focus:ring-emerald-500 cursor-pointer"
              />
              <span className="text-[11px]">Vincular a esta contagem</span>
            </label>
            {!useActiveCountDate && (
              <input 
                type="text"
                placeholder="DD/MM/AAAA"
                value={customDataColeta}
                onChange={e => setCustomDataColeta(e.target.value)}
                className="w-24 text-xs font-mono px-2 py-1 bg-slate-800 border border-slate-600 rounded text-emerald-300"
                title="Data customizada de coleta"
              />
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-4 sm:px-5 pt-3 border-b border-slate-800 gap-2 bg-[#0b101e]">
          <button
            type="button"
            onClick={() => setActiveTab('individual')}
            className={`pb-2.5 px-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'individual'
                ? 'border-purple-500 text-purple-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Lançamento Avulso (Conferente)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('planilha')}
            className={`pb-2.5 px-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'planilha'
                ? 'border-purple-500 text-purple-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Importar Planilha (.xlsx / .csv)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 flex flex-col gap-4 text-xs">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button 
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-xs px-1 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          )}

          {activeTab === 'individual' ? (
            <div className="flex flex-col gap-4">
              {/* Product Search & Selection */}
              <div className="flex flex-col gap-1.5 relative">
                <div className="flex items-center justify-between">
                  <label className="text-[10.5px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Search className="w-3 h-3 text-purple-400" />
                    <span>Produto / SKU Ambev *</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomSkuMode(!customSkuMode);
                      if (!customSkuMode) setSelectedProd(null);
                    }}
                    className="text-[10px] text-purple-400 hover:text-purple-300 underline cursor-pointer"
                  >
                    {customSkuMode ? '🔍 Selecionar do Catálogo' : '✏️ Digitar SKU Avulso Customizado'}
                  </button>
                </div>

                {!customSkuMode ? (
                  <>
                    <div className="relative">
                      <input 
                        type="text"
                        placeholder="Digite o código SKU ou nome do produto (ex: 35331, Budweiser, Skol)..."
                        value={selectedProd ? `${selectedProd.codigo} - ${selectedProd.descricao}` : searchProd}
                        onChange={e => {
                          setSearchProd(e.target.value);
                          setSelectedProd(null);
                          setShowProdDropdown(true);
                        }}
                        onFocus={() => setShowProdDropdown(true)}
                        className="w-full h-10 px-3.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors font-medium text-xs"
                      />
                      {selectedProd && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedProd(null);
                            setSearchProd('');
                          }}
                          className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded"
                          title="Limpar seleção"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {showProdDropdown && !selectedProd && (
                      <div className="absolute top-[68px] left-0 right-0 z-50 max-h-56 overflow-y-auto bg-slate-900 border border-slate-700 rounded-xl shadow-2xl divide-y divide-slate-800">
                        {filteredProducts.length === 0 ? (
                          <div className="p-3 text-center text-slate-500 text-xs">
                            Nenhum produto encontrado. Tente outro termo ou clique em "Digitar SKU Avulso Customizado".
                          </div>
                        ) : (
                          filteredProducts.map(p => {
                            const pPkg = getPackagingInfo(p.codigo, companyId);
                            return (
                              <button
                                key={p.codigo}
                                type="button"
                                onClick={() => {
                                  setSelectedProd({ codigo: String(p.codigo), descricao: p.descricao });
                                  setShowProdDropdown(false);
                                  setSearchProd('');
                                }}
                                className="w-full text-left p-2.5 px-3.5 hover:bg-purple-950/40 transition-colors flex items-center justify-between gap-2 cursor-pointer border-none bg-transparent"
                              >
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-mono font-black text-amber-400">{p.codigo}</span>
                                    <span className="font-bold text-slate-200">{p.descricao}</span>
                                    {p.isCustom && (
                                      <span className="text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded">
                                        ✨ Cadastrado
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-slate-400 mt-0.5">
                                    Palete: {pPkg.caixasPallet} cx | Lastro: {pPkg.lastro} cx
                                  </span>
                                </div>
                                <span className="text-purple-400 text-xs">Selecionar ➜</span>
                              </button>
                            );
                          })
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input 
                      type="text"
                      placeholder="Código SKU..."
                      value={customCodigo}
                      onChange={e => setCustomCodigo(e.target.value)}
                      className="h-10 px-3 rounded-xl bg-slate-800 border border-slate-700 text-amber-400 font-mono font-bold"
                    />
                    <input 
                      type="text"
                      placeholder="Descrição do Produto..."
                      value={customDescricao}
                      onChange={e => setCustomDescricao(e.target.value)}
                      className="sm:col-span-2 h-10 px-3 rounded-xl bg-slate-800 border border-slate-700 text-white"
                    />
                  </div>
                )}
              </div>

              {/* Box Calculation - Formula do Conferente */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col gap-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-purple-400" />
                    <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
                      Cálculo de Caixas (Fórmula Conferente)
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      (Palete: {pkgInfo.caixasPallet} cx | Lastro: {pkgInfo.lastro} cx)
                    </span>
                  </div>
                  <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={useDirectTotal}
                      onChange={e => {
                        setUseDirectTotal(e.target.checked);
                        if (!e.target.checked) {
                          setDirectTotalCaixas('');
                        } else {
                          setDirectTotalCaixas(String(calculatedFormulaCaixas || ''));
                        }
                      }}
                      className="w-3.5 h-3.5 text-purple-500 rounded border-slate-700 bg-slate-800 cursor-pointer"
                    />
                    <span>Digitar Total Direto</span>
                  </label>
                </div>

                {!useDirectTotal ? (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400">
                        Paletes Cheios ({pkgInfo.caixasPallet} cx)
                      </label>
                      <input 
                        type="number"
                        min="0"
                        value={palhete || ''}
                        onChange={e => setPalhete(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        placeholder="0"
                        className="h-9 px-3 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono font-bold text-sm focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400">
                        Lastros / Camadas ({pkgInfo.lastro} cx)
                      </label>
                      <input 
                        type="number"
                        min="0"
                        value={lastro || ''}
                        onChange={e => setLastro(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        placeholder="0"
                        className="h-9 px-3 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono font-bold text-sm focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase font-bold text-slate-400">
                        Caixas Avulsas
                      </label>
                      <input 
                        type="number"
                        min="0"
                        value={caixaAvulsa || ''}
                        onChange={e => setCaixaAvulsa(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        placeholder="0"
                        className="h-9 px-3 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono font-bold text-sm focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">
                      Total de Caixas (Entrada Manual Direta)
                    </label>
                    <input 
                      type="number"
                      min="1"
                      value={directTotalCaixas}
                      onChange={e => setDirectTotalCaixas(e.target.value)}
                      placeholder="Ex: 50"
                      className="h-9 px-3 rounded-lg bg-slate-800 border border-slate-700 text-emerald-400 font-mono font-bold text-sm focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                )}

                {/* Calculation summary pill */}
                <div className="p-2.5 rounded-lg bg-purple-950/30 border border-purple-500/20 flex items-center justify-between flex-wrap gap-2 text-[11px]">
                  <span className="text-slate-300 font-mono">
                    {!useDirectTotal ? (
                      `(${palhete} pal × ${pkgInfo.caixasPallet}) + (${lastro} las × ${pkgInfo.lastro}) + ${caixaAvulsa} av`
                    ) : (
                      'Entrada manual de caixas'
                    )}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 uppercase font-black text-[10px]">Total Calculado:</span>
                    <span className="font-mono font-black text-sm text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                      {effectiveTotalCaixas} caixas
                    </span>
                  </div>
                </div>
              </div>

              {/* Validade & Lote */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10.5px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-purple-400" />
                      <span>Data de Vencimento *</span>
                    </label>
                    {expirationDaysInfo && (
                      <span className={`text-[10px] font-black px-1.5 py-0.2 rounded border ${expirationDaysInfo.badgeClass}`}>
                        {expirationDaysInfo.diffDays} dias ({expirationDaysInfo.faixa})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="text"
                      placeholder="DD/MM/AAAA"
                      value={validadeInput}
                      onChange={e => handleValidadeChange(e.target.value)}
                      maxLength={10}
                      className="flex-1 h-9 px-3 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono font-bold focus:border-purple-500 focus:outline-none"
                    />
                    <input 
                      type="date"
                      value={validadeIso}
                      onChange={e => handleIsoDateChange(e.target.value)}
                      className="w-10 h-9 p-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 cursor-pointer"
                      title="Escolher no calendário"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10.5px] font-black uppercase tracking-wider text-slate-400">
                    Lote do Fabricante (Opcional)
                  </label>
                  <input 
                    type="text"
                    placeholder="Ex: LOTE-2026A ou N/A"
                    value={lote}
                    onChange={e => setLote(e.target.value)}
                    className="h-9 px-3 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono text-xs focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Localização & Bloco */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10.5px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-purple-400" />
                    <span>Local de Contagem *</span>
                  </label>
                  <select 
                    value={localizacao}
                    onChange={e => {
                      const v = e.target.value as any;
                      setLocalizacao(v);
                      if (v === 'pnc' || v === 'picking') setBloco('');
                      else if (!bloco) setBloco('A1');
                    }}
                    className="h-9 px-3 rounded-lg bg-slate-800 border border-slate-700 text-amber-300 font-bold focus:border-purple-500 focus:outline-none cursor-pointer"
                  >
                    <option value="central">Estoque Central</option>
                    <option value="pnc">PNC (Produto Não Conforme / Bloqueado)</option>
                    <option value="picking">Área de Picking</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10.5px] font-black uppercase tracking-wider text-slate-400">
                    Rua / Bloco {localizacao === 'central' ? '*' : ''}
                  </label>
                  <select 
                    value={bloco}
                    onChange={e => setBloco(e.target.value)}
                    disabled={localizacao === 'pnc' || localizacao === 'picking'}
                    className="h-9 px-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 font-bold focus:border-purple-500 focus:outline-none disabled:opacity-40 cursor-pointer"
                  >
                    {localizacao === 'pnc' ? (
                      <option value="">N/A — Área PNC Bloqueada</option>
                    ) : localizacao === 'picking' ? (
                      <option value="">N/A — Área de Picking</option>
                    ) : (
                      <>
                        <optgroup label="Bloco A">
                          <option value="A1">Rua A1</option>
                          <option value="A2">Rua A2</option>
                          <option value="A3">Rua A3</option>
                          <option value="A4">Rua A4</option>
                          <option value="A5">Rua A5</option>
                          <option value="A6">Rua A6</option>
                          <option value="A7">Rua A7</option>
                          <option value="A8">Rua A8</option>
                        </optgroup>
                        <optgroup label="Bloco B">
                          <option value="B1">Rua B1</option>
                          <option value="B2">Rua B2</option>
                          <option value="B3">Rua B3</option>
                          <option value="B4">Rua B4</option>
                        </optgroup>
                        <optgroup label="Bloco C">
                          <option value="C1">Rua C1</option>
                          <option value="C2">Rua C2</option>
                          <option value="C3">Rua C3</option>
                          <option value="C4">Rua C4</option>
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
            </div>
          ) : (
            /* Planilha Tab */
            <div className="flex flex-col gap-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="p-6 border-2 border-dashed border-slate-700 hover:border-purple-500 rounded-xl bg-slate-900/60 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-purple-600/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Upload className="w-6 h-6" />
                </div>
                <span className="font-bold text-slate-200">
                  {batchFile ? batchFile.name : 'Clique para selecionar planilha Excel (.xlsx, .xls) ou CSV'}
                </span>
                <span className="text-[11px] text-slate-400 max-w-sm">
                  Colunas suportadas: <strong>Código/SKU</strong>, <strong>Descrição</strong>, <strong>Validade</strong>, <strong>Quantidade/Caixas</strong>, <strong>Rua/Bloco</strong>
                </span>
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) handleProcessBatchFile(f);
                  }}
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                />
              </div>

              {batchError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  {batchError}
                </div>
              )}

              {batchRows.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-400">
                      ✓ {batchRows.length} itens identificados para registro na contagem ativa ({targetDataColeta})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setBatchRows([]);
                        setBatchFile(null);
                      }}
                      className="text-[11px] text-rose-400 hover:underline cursor-pointer"
                    >
                      Limpar
                    </button>
                  </div>

                  <div className="max-h-48 overflow-y-auto border border-slate-800 rounded-xl divide-y divide-slate-800/80 bg-slate-900/40">
                    {batchRows.slice(0, 15).map((row, i) => (
                      <div key={i} className="p-2 px-3 flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-400">{row.codigo}</span>
                          <span className="text-slate-300 truncate max-w-[200px]">{row.descricao}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-slate-400">Val: {row.validade}</span>
                          <span className="font-mono font-bold text-emerald-400">{row.quantidade} cx</span>
                          <span className="text-[10px] text-slate-500">{row.bloco || row.localizacao}</span>
                        </div>
                      </div>
                    ))}
                    {batchRows.length > 15 && (
                      <div className="p-2 text-center text-[10px] text-slate-500 font-mono">
                        ... e mais {batchRows.length - 15} itens na lista
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors font-bold text-xs uppercase cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>

          {activeTab === 'individual' ? (
            <button
              type="button"
              onClick={handleSaveIndividual}
              disabled={isSubmitting || !effectiveCodigo || effectiveTotalCaixas <= 0}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-purple-600/20 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer border-none"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Registrando...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Registrar na Contagem ({targetDataColeta})</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSaveBatch}
              disabled={isSubmitting || batchRows.length === 0}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer border-none"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Importando Lote...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Importar {batchRows.length} Itens na Contagem</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
