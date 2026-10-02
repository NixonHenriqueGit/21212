import React, { useState, useEffect } from 'react';
import { 
  X, 
  Printer, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  Building2, 
  Calendar, 
  Download, 
  Sparkles, 
  Check, 
  RefreshCw,
  FileCheck,
  Smartphone,
  Info,
  Trash2,
  ExternalLink,
  Eye
} from 'lucide-react';
import { 
  CHECKLIST_5S_OFFICIAL_ITEMS, 
  exportChecklist5SOfficialPdf, 
  getDefaultScoresForPercentage 
} from '../utils/exportChecklist5SPdf';
import { SETORES_5S } from './Checklist5SModal';
import { AuditoriaFrotaMensal, DEFAULT_AREA_RESPONSAVEIS } from './QualidadePanel';
import { Usuario } from '../types';
import { setMediaItem, getMediaItem, removeMediaItem } from '../utils/idbStorage';
import { downloadDataUrl, openDataUrlInNewTab } from '../utils/pragasStorage';

export interface Official5SDigitalAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (savedAudit: AuditoriaFrotaMensal) => void;
  initialAudit?: AuditoriaFrotaMensal | null;
  defaultMonth?: string;
  defaultYear?: string;
  defaultArea?: string;
  defaultAuditor?: string;
  defaultAuditado?: string;
  user?: Usuario;
}

export const Official5SDigitalAuditModal: React.FC<Official5SDigitalAuditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialAudit,
  defaultMonth = '08',
  defaultYear = '2026',
  defaultArea = 'Armazém Geral',
  defaultAuditor = 'Pedro Bruno (Setor de Frota)',
  defaultAuditado = 'Djeanderson Soares',
  user
}) => {
  const [mes, setMes] = useState<string>(initialAudit?.mes || defaultMonth);
  const [ano, setAno] = useState<string>(initialAudit?.ano || defaultYear);
  const [areaAuditada, setAreaAuditada] = useState<string>(
    'Armazém Geral'
  );
  const [auditor, setAuditor] = useState<string>(
    initialAudit?.auditorResponsavel || defaultAuditor
  );
  const [auditado, setAuditado] = useState<string>(() => {
    if ((initialAudit as any)?.auditadoNome) {
      const aName = (initialAudit as any).auditadoNome;
      if (!aName.toUpperCase().includes('KATHYEL')) return aName;
    }
    return defaultAuditado || 'Djeanderson Soares';
  });

  const [dataAuditoria, setDataAuditoria] = useState<string>(() => {
    if (initialAudit?.dataAuditoria) return initialAudit.dataAuditoria;
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });

  // Scores map for all 25 items (1 = OK, 0 = NOK)
  const [scores, setScores] = useState<Record<number, number>>(() => {
    if ((initialAudit as any)?.scores) {
      return (initialAudit as any).scores;
    }
    const targetPct = initialAudit?.notaPercentualFrota || 88;
    const seed = parseInt(defaultMonth, 10) || 1;
    return getDefaultScoresForPercentage(targetPct, seed);
  });

  const [observacoes, setObservacoes] = useState<string>(
    initialAudit?.observacoes || 'Auditoria 5S mensal realizada conforme padrões e diretrizes DPO.'
  );

  const [pdfFileName, setPdfFileName] = useState<string>(
    initialAudit?.pdfFileName || ''
  );
  const [pdfFileDataUrl, setPdfFileDataUrl] = useState<string | undefined>(
    initialAudit?.pdfFileDataUrl
  );

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Synchronize when initialAudit changes or on mount
  useEffect(() => {
    if (initialAudit) {
      setMes(initialAudit.mes || defaultMonth);
      setAno(initialAudit.ano || defaultYear);
      if (initialAudit.auditorResponsavel) setAuditor(initialAudit.auditorResponsavel);
      if (initialAudit.dataAuditoria) setDataAuditoria(initialAudit.dataAuditoria);
      if (initialAudit.observacoes) setObservacoes(initialAudit.observacoes);
      if (initialAudit.pdfFileName) setPdfFileName(initialAudit.pdfFileName);
      if (initialAudit.pdfFileDataUrl) setPdfFileDataUrl(initialAudit.pdfFileDataUrl);
      setAreaAuditada('Armazém Geral');
      if ((initialAudit as any).auditadoNome) {
        const aName = (initialAudit as any).auditadoNome;
        setAuditado(aName.toUpperCase().includes('KATHYEL') ? 'Djeanderson Soares' : aName);
      } else {
        setAuditado('Djeanderson Soares');
      }
      if ((initialAudit as any).scores) {
        setScores((initialAudit as any).scores);
      } else {
        const seed = parseInt(initialAudit.mes || defaultMonth, 10) || 1;
        setScores(getDefaultScoresForPercentage(initialAudit.notaPercentualFrota || 88, seed));
      }
    }
  }, [initialAudit, defaultMonth, defaultYear]);

  // Load PDF from IDB if missing from dataUrl
  useEffect(() => {
    const checkIdb = async () => {
      const recordId = `frota-${ano}-${mes.padStart(2, '0')}`;
      if (!pdfFileDataUrl) {
        try {
          const storedPdf = await getMediaItem(`frota_pdf_${recordId}`);
          if (storedPdf) {
            setPdfFileDataUrl(storedPdf);
          }
        } catch (e) {}
      }
    };
    checkIdb();
  }, [ano, mes, pdfFileDataUrl]);

  // When changing month, automatically load prefilled month audit data
  const handleMonthChange = (newMonth: string) => {
    setMes(newMonth);
    const monthNum = parseInt(newMonth, 10);
    try {
      const existingStr = localStorage.getItem('auditorias_frota_5s_mensal');
      if (existingStr) {
        const list: AuditoriaFrotaMensal[] = JSON.parse(existingStr);
        const found = list.find(a => a.ano === ano && a.mes === newMonth.padStart(2, '0'));
        if (found) {
          if (found.auditorResponsavel) setAuditor(found.auditorResponsavel);
          if (found.dataAuditoria) setDataAuditoria(found.dataAuditoria);
          if (found.observacoes) setObservacoes(found.observacoes);
          if (found.pdfFileName) setPdfFileName(found.pdfFileName);
          if (found.pdfFileDataUrl) setPdfFileDataUrl(found.pdfFileDataUrl);
          setAreaAuditada('Armazém Geral');
          if ((found as any).auditadoNome) {
            const aName = (found as any).auditadoNome;
            setAuditado(aName.toUpperCase().includes('KATHYEL') ? 'Djeanderson Soares' : aName);
          } else {
            setAuditado('Djeanderson Soares');
          }
          if ((found as any).scores) {
            setScores((found as any).scores);
          } else {
            setScores(getDefaultScoresForPercentage(found.notaPercentualFrota || 90, monthNum));
          }
          return;
        }
      }
    } catch (e) {}

    // Default pre-fill for the month
    const defaultTarget = (newMonth === '03' || newMonth === '06' || newMonth === '08') ? 92 : 88;
    setScores(getDefaultScoresForPercentage(defaultTarget, monthNum));
    setObservacoes(`Auditoria de 5S mensal realizada conforme padrão DPO para ${newMonth.padStart(2, '0')}/${ano}.`);
    setAreaAuditada('Armazém Geral');
    setAuditado('Djeanderson Soares');
  };

  // Update auditado automatically when area changes (if matched in defaults)
  const handleAreaChange = (newArea: string) => {
    setAreaAuditada(newArea);
  };

  // Calculate real-time points and percentage
  const totalItems = 25;
  const totalPontos = Object.values(scores).reduce((acc, val) => acc + (val === 1 ? 1 : 0), 0);
  const notaPercentual = Math.round((totalPontos / totalItems) * 100);
  const isConforme = notaPercentual >= 85;

  const handleScoreToggle = (itemId: number, value: number) => {
    setScores(prev => ({
      ...prev,
      [itemId]: value
    }));
  };

  const handleSetAllConforme = () => {
    const allOk: Record<number, number> = {};
    for (let i = 1; i <= 25; i++) {
      allOk[i] = 1;
    }
    setScores(allOk);
  };

  const handleApplyPreset = (targetPct: number) => {
    const seed = parseInt(mes, 10) || 1;
    setScores(getDefaultScoresForPercentage(targetPct, seed));
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPdfFileName(file.name);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      setPdfFileDataUrl(dataUrl);
      const recordId = `frota-${ano}-${mes.padStart(2, '0')}`;
      try {
        await setMediaItem(`frota_pdf_${recordId}`, dataUrl);
      } catch (e) {
        console.warn('Could not store PDF in IndexedDB:', e);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeletePdf = async () => {
    if (!confirm('Deseja excluir o arquivo PDF anexado? O laudo será removido da auditoria deste mês.')) return;
    const formattedMes = mes.padStart(2, '0');
    const recordId = `frota-${ano}-${formattedMes}`;
    try {
      await removeMediaItem(`frota_pdf_${recordId}`);
    } catch (err) {
      console.warn('Erro ao remover PDF do IndexedDB:', err);
    }
    setPdfFileName(undefined);
    setPdfFileDataUrl(undefined);
  };

  const handleExportPrintPdf = () => {
    const dateParts = dataAuditoria.split('-');
    const dataStr = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : dataAuditoria;

    exportChecklist5SOfficialPdf({
      auditor: auditor.trim() || 'Pedro Bruno (Setor de Frota)',
      auditado: auditado.trim() || 'Djeanderson Soares',
      areaAuditada: areaAuditada.trim() || 'Armazém Geral',
      dataStr,
      scores,
      pontuacaoTotal: totalPontos,
      pontuacaoPercentual: notaPercentual
    });
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);

    const formattedMes = mes.padStart(2, '0');
    const mesAno = `${formattedMes}/${ano}`;
    const id = `frota-${ano}-${formattedMes}`;

    // Store PDF in IDB safely
    if (pdfFileDataUrl) {
      try {
        await setMediaItem(`frota_pdf_${id}`, pdfFileDataUrl);
      } catch (err) {
        console.warn('IndexedDB PDF save notice:', err);
      }
    }

    const savedRecord: AuditoriaFrotaMensal & { scores: Record<number, number>; areaAuditada: string; auditadoNome: string } = {
      id,
      mesAno,
      ano,
      mes: formattedMes,
      dataAuditoria,
      auditorResponsavel: auditor.trim() || 'Pedro Bruno (Setor de Frota)',
      notaPercentualFrota: notaPercentual,
      observacoes: observacoes.trim() || 'Auditoria 5S mensal realizada com sucesso.',
      pdfFileName: pdfFileName || `Auditoria_Frota_Armazem_${formattedMes}_${ano}_Assinada.pdf`,
      pdfFileDataUrl,
      criadoEm: initialAudit?.criadoEm || new Date().toISOString(),
      scores,
      areaAuditada: areaAuditada.trim(),
      auditadoNome: auditado.trim()
    };

    // 1. Save to LocalStorage
    try {
      const existingStr = localStorage.getItem('auditorias_frota_5s_mensal');
      let existingList: AuditoriaFrotaMensal[] = [];
      if (existingStr) {
        existingList = JSON.parse(existingStr);
      }
      const filtered = existingList.filter(item => item.mesAno !== mesAno && item.id !== id);
      // Remove heavy dataUrl before saving in localStorage
      const lightSaved = { ...savedRecord, pdfFileDataUrl: undefined };
      const updatedList = [...filtered, lightSaved].sort((a, b) => a.mesAno.localeCompare(b.mesAno));
      localStorage.setItem('auditorias_frota_5s_mensal', JSON.stringify(updatedList));
    } catch (err) {
      console.warn('Erro ao salvar auditoria no LocalStorage:', err);
    }

    // 2. Dispatch events for global synchronization
    window.dispatchEvent(new CustomEvent('5s_frota_audit_saved', { detail: savedRecord }));
    window.dispatchEvent(new Event('5s_responsaveis_updated'));

    setIsSaving(false);
    setSavedSuccess(true);

    if (onSave) {
      onSave(savedRecord);
    }

    setTimeout(() => {
      onClose();
    }, 700);
  };

  const sensos = [
    { name: 'Seleção', badge: '1º Senso (Seiri)', color: 'border-blue-500/40 text-blue-400 bg-blue-500/10', items: CHECKLIST_5S_OFFICIAL_ITEMS.filter(i => i.senso === 'Seleção') },
    { name: 'Organização', badge: '2º Senso (Seiton)', color: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10', items: CHECKLIST_5S_OFFICIAL_ITEMS.filter(i => i.senso === 'Organização') },
    { name: 'Limpeza', badge: '3º Senso (Seiso)', color: 'border-amber-500/40 text-amber-400 bg-amber-500/10', items: CHECKLIST_5S_OFFICIAL_ITEMS.filter(i => i.senso === 'Limpeza') },
    { name: 'Padronização', badge: '4º Senso (Seiketsu)', color: 'border-purple-500/40 text-purple-400 bg-purple-500/10', items: CHECKLIST_5S_OFFICIAL_ITEMS.filter(i => i.senso === 'Padronização') },
    { name: 'Auto-Disciplina', badge: '5º Senso (Shitsuke)', color: 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10', items: CHECKLIST_5S_OFFICIAL_ITEMS.filter(i => i.senso === 'Auto-Disciplina') },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-[#0b1222] border-2 border-indigo-500/50 rounded-2xl max-w-4xl w-full my-auto shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* TOP HEADER: OFICIAL DPO 5S COM INDICADOR MOBILE-FRIENDLY */}
        <div className="p-3.5 sm:p-4 bg-[#111a30] border-b border-slate-800 flex items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-base sm:text-lg shadow-sm shrink-0">
              5S
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-amber-400">
                  Formulário Oficial DPO
                </span>
                <span className="hidden sm:inline-block text-[8px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                  DISTRIBUTION PROCESS OPTIMISATION
                </span>
                <span className="sm:hidden text-[8px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-bold">
                  MOBILE 5S
                </span>
              </div>
              <h3 className="text-xs sm:text-base font-black text-white tracking-tight truncate">
                Checklist Digital de Auditoria 5S - Armazém / Frota
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleExportPrintPdf}
              className="sm:hidden p-2 bg-amber-500 text-slate-950 rounded-lg font-black text-xs transition-all flex items-center justify-center cursor-pointer"
              title="Imprimir / Exportar PDF"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SCROLLABLE BODY COM RESPONSIVIDADE TOUCH PARA MOBILE */}
        <div className="p-3 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 flex-1 text-slate-200">
          
          {/* CABEÇALHO DO FORMULÁRIO (DADOS GERAIS) */}
          <div className="bg-[#131d38] border border-slate-800 rounded-2xl p-3.5 sm:p-4 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
              <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5 sm:gap-2">
                <Building2 className="w-4 h-4 text-indigo-400" /> Informações da Auditoria
              </span>
              <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Padrão Ambev Guarabira
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {/* Mês de Referência */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Mês de Referência *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={mes}
                    onChange={(e) => handleMonthChange(e.target.value)}
                    className="w-full bg-[#0b1222] border border-slate-700 rounded-xl px-2.5 py-2 text-white font-bold font-mono focus:outline-none focus:border-indigo-500 text-xs"
                  >
                    <option value="01">01 - Janeiro</option>
                    <option value="02">02 - Fevereiro</option>
                    <option value="03">03 - Março</option>
                    <option value="04">04 - Abril</option>
                    <option value="05">05 - Maio</option>
                    <option value="06">06 - Junho</option>
                    <option value="07">07 - Julho</option>
                    <option value="08">08 - Agosto</option>
                    <option value="09">09 - Setembro</option>
                    <option value="10">10 - Outubro</option>
                    <option value="11">11 - Novembro</option>
                    <option value="12">12 - Dezembro</option>
                  </select>
                  <input
                    type="text"
                    value={ano}
                    onChange={(e) => setAno(e.target.value)}
                    className="w-full bg-[#0b1222] border border-slate-700 rounded-xl px-2 py-2 text-white font-bold font-mono focus:outline-none focus:border-indigo-500 text-xs text-center"
                  />
                </div>
              </div>

              {/* Área Auditada */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Área Auditada *
                </label>
                <input
                  type="text"
                  value={areaAuditada}
                  onChange={(e) => setAreaAuditada(e.target.value)}
                  placeholder="Armazém Geral"
                  className="w-full bg-[#0b1222] border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Auditor */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Auditor Responsável *
                </label>
                <input
                  type="text"
                  value={auditor}
                  onChange={(e) => setAuditor(e.target.value)}
                  placeholder="Ex: Pedro Bruno (Setor de Frota)"
                  className="w-full bg-[#0b1222] border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Auditado / Responsável */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Colaborador Auditado / Responsável *
                </label>
                <input
                  type="text"
                  value={auditado}
                  onChange={(e) => setAuditado(e.target.value)}
                  placeholder="Ex: Djeanderson Soares"
                  className="w-full bg-[#0b1222] border border-slate-700 rounded-xl px-3 py-2 text-amber-300 font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Data da Auditoria */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Data da Realização *
                </label>
                <input
                  type="date"
                  value={dataAuditoria}
                  onChange={(e) => setDataAuditoria(e.target.value)}
                  className="w-full bg-[#0b1222] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Ações Rápidas de Preenchimento */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Preenchimento Rápido / Preset
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={handleSetAllConforme}
                    className="px-2.5 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                    title="Marcar todos os 25 itens como Conforme (100%)"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-400" /> 100% (25/25)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset(92)}
                    className="px-2.5 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                    title="Aplicar pontuação DPO 92% (23/25 itens)"
                  >
                    92% DPO
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset(88)}
                    className="px-2.5 py-1.5 bg-sky-600/30 hover:bg-sky-600/50 text-sky-300 border border-sky-500/40 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                    title="Aplicar pontuação 88% (22/25 itens)"
                  >
                    88% Frota
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* PLACAR EM TEMPO REAL: PONTUAÇÃO (X / 25) E NOTA PERCENTUAL (STICKY PARA MOBILE) */}
          <div className="bg-[#111a30] border-2 border-indigo-500/40 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sticky top-0 z-20 shadow-xl backdrop-blur-md">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className={`p-2.5 sm:p-3 rounded-2xl font-black text-xl sm:text-2xl font-mono shrink-0 ${
                isConforme 
                  ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400' 
                  : 'bg-rose-500/20 border-2 border-rose-500 text-rose-400'
              }`}>
                {notaPercentual}%
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400">
                    Pontuação:
                  </span>
                  <span className="text-xs font-mono font-bold text-indigo-300">
                    {totalPontos} de {totalItems} itens OK
                  </span>
                </div>
                <div className="text-xs sm:text-sm font-black text-white truncate flex items-center gap-1.5">
                  {isConforme ? (
                    <span className="text-emerald-400 flex items-center gap-1 truncate">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Conforme (Meta DPO ≥ 85%)
                    </span>
                  ) : (
                    <span className="text-rose-400 flex items-center gap-1 truncate">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Abaixo da Meta DPO (&lt; 85%)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* LISTA DOS 25 ITENS OFICIAIS DPO AGRUPADOS PELOS 5 SENSOS COM DESIGN MOBILE-FIRST */}
          <div className="space-y-4 sm:space-y-6">
            {sensos.map((sensoGroup) => (
              <div key={sensoGroup.name} className="bg-[#0e1628] border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                {/* CABEÇALHO DO SENSO */}
                <div className="p-3 px-3.5 sm:px-4 bg-[#131d38] border-b border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-black uppercase border ${sensoGroup.color}`}>
                      {sensoGroup.badge}
                    </span>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">
                      Senso de {sensoGroup.name}
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono text-slate-300 font-bold bg-slate-800/80 px-2 py-0.5 rounded">
                    {sensoGroup.items.filter(i => scores[i.id] === 1).length} / {sensoGroup.items.length} OK
                  </span>
                </div>

                {/* LISTA DE ITENS COM TOQUE RESPONSIVO */}
                <div className="divide-y divide-slate-800/70">
                  {sensoGroup.items.map((item) => {
                    const isItemOk = scores[item.id] === 1;

                    return (
                      <div
                        key={item.id}
                        className={`p-3 sm:p-3.5 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3 ${
                          isItemOk ? 'bg-transparent hover:bg-slate-800/30' : 'bg-rose-500/5 hover:bg-rose-500/10'
                        }`}
                      >
                        {/* ITEM E DESCRIÇÃO */}
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-black font-mono flex items-center justify-center shrink-0">
                              {item.id}
                            </span>
                            <strong className="text-xs font-black text-white">
                              {item.checkItem}
                            </strong>
                          </div>
                          <p className="text-[11px] text-slate-300 leading-relaxed pl-7 whitespace-pre-line">
                            {item.descricao}
                          </p>
                        </div>

                        {/* BOTÕES DE PONTUAÇÃO (1 = OK, 0 = NOK) - OTIMIZADOS PARA TOQUE NO CELULAR */}
                        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2 self-stretch md:self-center shrink-0 pl-7 md:pl-0">
                          <button
                            type="button"
                            onClick={() => handleScoreToggle(item.id, 1)}
                            className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 cursor-pointer justify-center ${
                              isItemOk
                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-400'
                                : 'bg-[#111a30] text-slate-400 border border-slate-700 hover:text-white hover:bg-slate-800'
                            }`}
                          >
                            <Check className="w-4 h-4" /> 1 (OK)
                          </button>

                          <button
                            type="button"
                            onClick={() => handleScoreToggle(item.id, 0)}
                            className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1.5 cursor-pointer justify-center ${
                              !isItemOk
                                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 ring-2 ring-rose-400'
                                : 'bg-[#111a30] text-slate-400 border border-slate-700 hover:text-white hover:bg-slate-800'
                            }`}
                          >
                            <X className="w-4 h-4" /> 0 (NOK)
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* OBSERVAÇÕES DA AUDITORIA */}
          <div className="bg-[#131d38] border border-slate-800 rounded-2xl p-3.5 sm:p-4 space-y-2">
            <label className="block text-xs font-black text-white uppercase tracking-wider">
              Observações & Constatações do Auditor ({auditor})
            </label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Descreva as constatações de 5S no armazém pelo auditor..."
              className="w-full bg-[#0b1222] border border-slate-700 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-indigo-500 h-24 resize-none leading-relaxed font-sans"
            />
          </div>

          {/* ANEXO DE ARQUIVO PDF ASSINADO MANUALMENTE */}
          <div className="bg-[#131d38] border border-slate-800 rounded-2xl p-3.5 sm:p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Upload className="w-4 h-4 text-indigo-400" /> Importar Documento PDF Assinado
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Anexe o formulário preenchido e assinado digitalmente ou fisicamente pelo auditor. O documento permanecerá salvo permanentemente até exclusão manual.
                </p>
              </div>
            </div>

            <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-4 bg-[#0b1222] text-center transition-all cursor-pointer">
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={handlePdfUpload}
                className="hidden"
                id="digital-modal-pdf-upload"
              />
              <label htmlFor="digital-modal-pdf-upload" className="cursor-pointer flex flex-col items-center gap-2">
                <div className="p-3 bg-indigo-500/10 rounded-full text-indigo-400">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">
                    {pdfFileName ? `Arquivo Selecionado: ${pdfFileName}` : 'Clique para selecionar o PDF Assinado'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Formato aceito: .pdf (Laudo ou Checklist com assinaturas)
                  </span>
                </div>
              </label>
            </div>

            {pdfFileDataUrl && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs text-emerald-300 flex-wrap gap-2.5">
                <span className="flex items-center gap-2 font-bold truncate max-w-xs sm:max-w-sm" title={pdfFileName}>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  PDF Carregado: {pdfFileName}
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => openDataUrlInNewTab(pdfFileDataUrl, pdfFileName || `Auditoria_5S_${mes}_${ano}_Assinada.pdf`)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-black uppercase flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                    title="Abrir e visualizar documento PDF em uma nova guia"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Visualizar em Outra Guia
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadDataUrl(pdfFileDataUrl, pdfFileName || `Auditoria_5S_${mes}_${ano}_Assinada.pdf`)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-black uppercase flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                    title="Baixar arquivo PDF anexado"
                  >
                    <Download className="w-3.5 h-3.5" /> Baixar PDF
                  </button>
                  <button
                    type="button"
                    onClick={handleDeletePdf}
                    className="p-1.5 bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 hover:text-white rounded-lg border border-rose-500/30 transition-all cursor-pointer"
                    title="Excluir PDF anexado"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* FOOTER ACTIONS MOBILE-FIRST */}
        <div className="p-3.5 sm:p-4 bg-[#111a30] border-t border-slate-800 flex items-center justify-between gap-2.5 shrink-0 flex-wrap">
          <div className="text-xs font-mono">
            <span className="text-slate-400">Resultado: </span>
            <strong className="text-indigo-300 font-bold">{totalPontos}/25 ({notaPercentual}%)</strong>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 sm:px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold uppercase text-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleExportPrintPdf}
              className="px-3.5 sm:px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-black uppercase text-xs transition-all flex items-center gap-1.5 cursor-pointer font-sans shadow-md"
              title="Imprimir laudo preenchido em formato PDF"
            >
              <Printer className="w-4 h-4 text-slate-950" /> Imprimir PDF Preenchido
            </button>

            <button
              type="button"
              onClick={() => handleSave()}
              disabled={isSaving}
              className="px-4 sm:px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black uppercase text-xs transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 font-sans"
            >
              {isSaving ? (
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-white" />
              )}
              {savedSuccess ? 'Salvo!' : 'Salvar Auditoria 5S'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

