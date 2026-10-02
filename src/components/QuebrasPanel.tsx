import React, { useState, useEffect, useMemo } from 'react';
import { isCustomFirebaseConnected } from '../firebase';
import { QuebrasRepository } from '../db';
import { Usuario, Empresa, QuebraRow } from '../types';
import { useEmpresaData } from '../context/EmpresaDataContext';
import { PRODUCTS } from '../planosData';
import { TrendingUp, Clock, Award, BarChart2, AlertTriangle, FileSpreadsheet, Upload, Download, FileText, Database, Check, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';
import { SopBannerViewer } from './SopBannerViewer';
import { filterHistoryForUser, HistoryRestrictionNotice } from '../utils/historyFilter';
import { triggerAutoAcaoCorretiva } from '../utils/simulacaoAcoesUtils';
import { LISTA_COLABORADORES_OFICIAIS } from './RankingModule';
import { safeSetLocalStorage } from '../utils/safeLocalStorage';
import { PaginationControls } from './common/PaginationControls';
import { buildOfficialQuebrasRows } from '../utils/retroactiveQuebrasParser';
import { smartParseQuebrasText } from '../utils/quebrasImportParser';
import { getProductMeta } from '../utils/productCatalogData';
import { CustomDateExportModal, isDateWithinInterval } from './common/CustomDateExportModal';
import { CustomDateFilterBar } from './common/CustomDateFilterBar';

interface QuebrasPanelProps {
  user: Usuario;
  empresa: Empresa | null;
  theme?: 'light' | 'dark';
  shiftStarted?: boolean;
  onRequireShiftStart?: () => void;
}

const QB_TIPOS: Record<string, Array<{ cod: number; motivo: string }>> = {
  'ARMAZEM': [
    { cod: 521, motivo: 'ACIDENTE DE TRABALHO' },
    { cod: 530, motivo: 'CLIENTE' },
    { cod: 536, motivo: 'CONSUMO IMPROPRIO' },
    { cod: 538, motivo: 'DIFERENÇA DE ESTOQUE' },
    { cod: 540, motivo: 'DIFERENÇA INVENTÁRIO' },
    { cod: 522, motivo: 'ESTOURADA' },
    { cod: 523, motivo: 'ESTUFADO' },
    { cod: 541, motivo: 'EVENTOS' },
    { cod: 524, motivo: 'FALTA NO PALETE' },
    { cod: 528, motivo: 'FURTO' },
    { cod: 527, motivo: 'IMPUREZA' },
    { cod: 520, motivo: 'INVERSÃO' },
    { cod: 535, motivo: 'MAL CHAPEADA' },
    { cod: 532, motivo: 'MAL CHEIO' },
    { cod: 533, motivo: 'PRODUTO VENCIDO' },
    { cod: 539, motivo: 'QUEBRA COM MOVIMENTAÇÃO' },
    { cod: 537, motivo: 'QUEBRA PICKING' },
    { cod: 525, motivo: 'QUEBRADA' },
    { cod: 531, motivo: 'SEM GAS' },
    { cod: 534, motivo: 'SEM TAMPA' },
    { cod: 529, motivo: 'TROCA - ARMAZÉM' },
    { cod: 526, motivo: 'VAZAMENTO' },
  ],
  'ENTREGA': [
    { cod: 543, motivo: 'ACIDENTE DE TRABALHO' },
    { cod: 556, motivo: 'CARGA TOMBADA' },
    { cod: 551, motivo: 'CLIENTE' },
    { cod: 542, motivo: 'CONSUMO IMPROPRIO' },
    { cod: 544, motivo: 'ESTOURADA' },
    { cod: 545, motivo: 'ESTUFADO' },
    { cod: 558, motivo: 'EVENTOS' },
    { cod: 546, motivo: 'FALTA NO PALETE' },
    { cod: 550, motivo: 'FURTO' },
    { cod: 549, motivo: 'IMPUREZA' },
    { cod: 560, motivo: 'INVERSÃO' },
    { cod: 559, motivo: 'MAL CHAPEADA' },
    { cod: 553, motivo: 'MAL CHEIO' },
    { cod: 557, motivo: 'QUEBRA COM MOVIMENTAÇÃO' },
    { cod: 547, motivo: 'QUEBRADA' },
    { cod: 552, motivo: 'SEM GAS' },
    { cod: 555, motivo: 'SEM TAMPA' },
    { cod: 548, motivo: 'VAZAMENTO' },
    { cod: 554, motivo: 'VENCIDO' },
  ],
  'MERCADO': [
    { cod: 561, motivo: 'ACIDENTE DE TRABALHO' },
    { cod: 570, motivo: 'CLIENTE' },
    { cod: 562, motivo: 'ESTOURADA' },
    { cod: 563, motivo: 'ESTUFADO' },
    { cod: 564, motivo: 'FALTA NO PALETE' },
    { cod: 568, motivo: 'FURTO' },
    { cod: 567, motivo: 'IMPUREZA' },
    { cod: 572, motivo: 'MAL CHEIO' },
    { cod: 565, motivo: 'QUEBRADA' },
    { cod: 571, motivo: 'SEM GAS' },
    { cod: 574, motivo: 'SEM TAMPA' },
    { cod: 569, motivo: 'TROCA' },
    { cod: 566, motivo: 'VAZAMENTO' },
    { cod: 573, motivo: 'VENCIDO' },
  ],
  'PUXADA': [
    { cod: 587, motivo: 'CARGA TOMBADA' },
    { cod: 582, motivo: 'CLIENTE' },
    { cod: 575, motivo: 'ESTUFADO' },
    { cod: 576, motivo: 'FALTA NO PALETE' },
    { cod: 580, motivo: 'FURTO' },
    { cod: 579, motivo: 'IMPUREZA' },
    { cod: 588, motivo: 'MAL CHAPEADA' },
    { cod: 584, motivo: 'MAL CHEIO' },
    { cod: 589, motivo: 'QUEBRA COM MOVIMENTAÇÃO' },
    { cod: 577, motivo: 'QUEBRADA' },
    { cod: 583, motivo: 'SEM GAS' },
    { cod: 581, motivo: 'TROCA' },
    { cod: 578, motivo: 'VAZAMENTO' },
    { cod: 585, motivo: 'VENCIDO' },
  ],
};

export const COLABORADORES_QUEBRA = LISTA_COLABORADORES_OFICIAIS.map(c => c.nome);

export default function QuebrasPanel({ user, empresa, shiftStarted, onRequireShiftStart }: QuebrasPanelProps) {
  const empresaId = empresa?.id || 'demo';
  const draftKey = `quebras_draft_${empresaId}_${user.nome || 'guest'}`;
  const empresaData = useEmpresaData(['quebras', 'produtos', 'colaboradores']);

  const colaboradoresList = COLABORADORES_QUEBRA;

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

  const [produtoBusca, setProdutoBusca] = useState<string>(() => getDraftValue('produtoBusca', ''));
  const [selectedProd, setSelectedProd] = useState<{ codigo: number, descricao: string } | null>(() => getDraftValue('selectedProd', null));
  const [showDropdown, setShowProdDropdown] = useState(false);
  const [quantidade, setQuantidade] = useState<number | ''>(() => getDraftValue('quantidade', ''));
  const [area, setArea] = useState<string>(() => getDraftValue('area', 'ARMAZEM'));
  const [turno, setTurno] = useState<string>(() => getDraftValue('turno', 'MANHÃ'));
  const [motivoCod, setMotivoCod] = useState<number>(() => getDraftValue('motivoCod', 0));
  const [colaboradorQuebrou, setColaboradorQuebrou] = useState<string>(() => getDraftValue('colaboradorQuebrou', ''));
  const [showCustomInput, setShowCustomInput] = useState<boolean>(() => {
    const initial = getDraftValue('colaboradorQuebrou', '');
    return initial !== '' && !colaboradoresList.includes(initial);
  });

  // Sync custom input state if colaboradorQuebrou updates with a valid custom name
  useEffect(() => {
    if (colaboradorQuebrou && !colaboradoresList.includes(colaboradorQuebrou)) {
      setShowCustomInput(true);
    }
  }, [colaboradorQuebrou, colaboradoresList]);
  
  const [activeTab, setActiveTab] = useState<'form' | 'import' | 'stats' | 'hist'>('form');
  const [quebras, setQuebras] = useState<QuebraRow[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(10);

  // Database Import State
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importHeaders, setImportHeaders] = useState<string[]>([]);
  const [pasteMode, setPasteMode] = useState<'file' | 'paste'>('paste');
  const [pastedText, setPastedText] = useState('');
  const [importStatusMsg, setImportStatusMsg] = useState<string | null>(null);

  // Realtime detected records from pasted text
  const detectedPasteCount = useMemo(() => {
    if (!pastedText || !pastedText.trim()) return 0;
    try {
      const items = smartParseQuebrasText(pastedText);
      return items.length;
    } catch (_) {
      return 0;
    }
  }, [pastedText]);

  // Helper to parse individual raw row into QuebraRow format
  const parseQuebraRow = (raw: any, index = 0): QuebraRow & { empresaId: string } => {
    const cleanRow: Record<string, any> = {};
    Object.entries(raw || {}).forEach(([k, v]) => {
      cleanRow[k.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "")] = v;
    });

    const today = new Date();
    const todayStr = today.toLocaleDateString('pt-BR');
    const todayISO = today.toISOString().split('T')[0];

    const rawDate = String(cleanRow.data || cleanRow['data lancamento'] || cleanRow.date || cleanRow.dt || cleanRow.dataiso || todayStr).trim();
    let dataISO = todayISO;
    let dataStr = rawDate || todayStr;

    // Trata datas com timestamp como "2026-08-10 11:59:15" ou "2026-08-10T11:59:15"
    const dateOnly = rawDate.split(' ')[0].split('T')[0];

    if (dateOnly.includes('/')) {
      const parts = dateOnly.split('/');
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
        dataISO = `${year}-${month}-${day}`;
        dataStr = `${day}/${month}/${year}`;
      }
    } else if (dateOnly.includes('-')) {
      const parts = dateOnly.split('-');
      if (parts.length === 3) {
        if (parts[0].length === 4) { // YYYY-MM-DD
          dataISO = dateOnly;
          dataStr = `${parts[2]}/${parts[1]}/${parts[0]}`;
        } else { // DD-MM-YYYY
          dataISO = `${parts[2]}-${parts[1]}-${parts[0]}`;
          dataStr = `${parts[0]}/${parts[1]}/${parts[2]}`;
        }
      }
    }

    const codProduto = String(cleanRow.codproduto || cleanRow.produto || cleanRow['cod produto'] || cleanRow.codigo || cleanRow.sku || cleanRow.cod || '000').trim();
    const codeNum = Number(codProduto) || 0;
    const meta = codeNum > 0 ? getProductMeta(codeNum) : null;
    const foundProd = PRODUCTS.find(p => Number(p.codigo) === codeNum);

    const descricao = String(
      cleanRow.descricao || cleanRow.descricaoproduto || cleanRow['descricao produto'] || cleanRow.produto || cleanRow.item || foundProd?.descricao || 'PRODUTO IMPORTADO'
    ).trim();

    const quantidade = Math.max(1, Number(cleanRow.quantidade || cleanRow['quant und.'] || cleanRow['quant und'] || cleanRow.qtd || cleanRow.unidades || 1));
    const area = String(cleanRow.area || cleanRow.origem || cleanRow.setor || 'ARMAZEM').trim().toUpperCase();
    const turno = String(cleanRow.turno || 'MANHÃ').trim().toUpperCase();
    const codQuebra = String(cleanRow.codquebra || cleanRow.cod || cleanRow['cod quebra'] || cleanRow.codigoquebra || cleanRow.codigodaquebra || '525').trim();
    const motivo = String(cleanRow.motivo || cleanRow.causa || cleanRow['motivo quebra'] || 'QUEBRADA').trim();
    const colaboradorQuebrou = String(cleanRow.colaborador || cleanRow.responsavel || cleanRow.colaboradorquebrou || cleanRow['colaborador quebrou'] || cleanRow.operador || '').trim();
    const responsavel = String(cleanRow.responsavel || cleanRow.colaborador || colaboradorQuebrou || '').trim();
    const funcao = String(cleanRow.funcao || cleanRow['funcao'] || '').trim();
    const fiscal = String(cleanRow.fiscal || cleanRow['fiscal lancador'] || user.nome || 'Fiscal').trim();
    
    const valorUnitario = Number(cleanRow['valor da avaria'] || cleanRow['valor por unid'] || cleanRow.valorunitario || cleanRow.valoravaria || cleanRow.preco || meta?.preco || foundProd?.preco || 0);
    const valorTotal = Number(cleanRow['valor tt'] || cleanRow.valortotal || cleanRow['valor total'] || cleanRow.valor || (valorUnitario > 0 ? valorUnitario * quantidade : 0));
    
    const mes = String(cleanRow.mes || '').trim();
    const rawFatorHl = cleanRow['hecto litro'] || cleanRow['hectolitro'] || cleanRow['fator hecto por unidade'] || cleanRow['fator hecto por unid'] || cleanRow['fatorhectoporunidade'] || cleanRow['fator hl'] || cleanRow.fatorhl || cleanRow['fator hecto'] || meta?.fatorHecto || 0;
    const fatorHl = typeof rawFatorHl === 'string' ? Number(String(rawFatorHl).replace(',', '.')) : Number(rawFatorHl || 0);
    
    const rawHlPerdido = cleanRow['hecto perdido'] || cleanRow['hectoperdido'] || cleanRow['hl perdido'] || cleanRow.hlperdido || (fatorHl > 0 ? fatorHl * quantidade : 0);
    const hlPerdido = typeof rawHlPerdido === 'string' ? Number(String(rawHlPerdido).replace(',', '.')) : Number(rawHlPerdido || 0);
    
    const tipoMarca = String(cleanRow['tipo marca'] || cleanRow.tipomarca || meta?.grupo || '').trim();
    const embalagem = String(cleanRow.embalagem || meta?.embalagem || '').trim();
    const wqi = String(cleanRow.wqi || '').trim();

    const uniqueId = `qb-imp-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 9)}`;

    return {
      id: uniqueId,
      _docId: uniqueId,
      empresaId: empresa?.id || 'demo',
      data: dataStr,
      dataISO,
      codProduto,
      descricao,
      quantidade,
      area,
      turno,
      codQuebra,
      motivo,
      ...(colaboradorQuebrou ? { colaboradorQuebrou } : {}),
      ...(responsavel ? { responsavel, colaborador: responsavel, operador: responsavel } : {}),
      ...(funcao ? { funcao } : {}),
      fiscal,
      ...(valorUnitario > 0 ? { valorUnitario } : {}),
      ...(valorTotal > 0 ? { valorTotal, valor: valorTotal } : {}),
      ...(mes ? { mes } : {}),
      ...(fatorHl > 0 ? { fatorHl } : {}),
      ...(hlPerdido > 0 ? { hlPerdido } : {}),
      ...(tipoMarca ? { tipoMarca } : {}),
      ...(embalagem ? { embalagem } : {}),
      ...(wqi ? { wqi } : {}),
      origem: 'IMPORTACAO_PLANILHA',
      _criadoEm: new Date().toISOString()
    };
  };

  // Download Sample Excel Template
  const handleDownloadTemplate = () => {
    const sampleData = [
      {
        "DATA": "2026-01-01",
        "MÊS": "JANEIRO",
        "PRODUTO": 21020,
        "DESCRIÇÃO": "BUDWEISER 350ML",
        "QUANT UND.": 1.0,
        "FATOR HL": 0.0035,
        "HL PERDIDO": 0.0035,
        "TIPO MARCA": "001 - CERVEJA",
        "EMBALAGEM": "187 - LATA SLEEK 350ML",
        "TURNO": "Noite",
        "CÓD": 524,
        "AREA": "ARMAZEM",
        "MOTIVO": "FALTA NO PALETE",
        "VALOR POR UNID": 2.64,
        "VALOR TT": 2.64,
        "RESPONSÁVEL": "RONILDO",
        "FUNÇÃO": "EMPILHADOR",
        "WQI": "NÃO"
      },
      {
        "DATA": "2026-01-02",
        "MÊS": "JANEIRO",
        "PRODUTO": 101,
        "DESCRIÇÃO": "SKOL 350ML CX24",
        "QUANT UND.": 12.0,
        "FATOR HL": 0.042,
        "HL PERDIDO": 0.042,
        "TIPO MARCA": "001 - CERVEJA",
        "EMBALAGEM": "LATA 350ML",
        "TURNO": "Manhã",
        "CÓD": 525,
        "AREA": "ARMAZEM",
        "MOTIVO": "QUEBRADA",
        "VALOR POR UNID": 3.80,
        "VALOR TT": 45.60,
        "RESPONSÁVEL": "PAULO PEREIRA DA SILVA",
        "FUNÇÃO": "CONFERENTE",
        "WQI": "NÃO"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Modelo_Quebras");
    XLSX.writeFile(wb, "modelo_importacao_registro_quebras.xlsx");
  };

  // Handle spreadsheet file change & preview
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    setImportStatusMsg(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonHeader = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonHeader.length > 0) {
          const headers = (jsonHeader[0] as any[]).map(String);
          setImportHeaders(headers);
          
          const rows = XLSX.utils.sheet_to_json(worksheet);
          setImportPreview(rows.slice(0, 10));
        }
      } catch (err) {
        setImportStatusMsg('❌ Erro ao carregar o arquivo Excel/CSV: ' + err);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Process and save import data
  const processAndImportRows = async (rows: any[]) => {
    if (!rows || rows.length === 0) {
      setImportStatusMsg('⚠️ Nenhum registro encontrado para importação.');
      return;
    }

    setImporting(true);
    setImportStatusMsg(`⏳ Processando e importando ${rows.length} registros para o banco de dados...`);

    const companyId = empresa?.id || 'demo';

    try {
      const rowsData = rows.map((raw, idx) => parseQuebraRow(raw, idx));
      
      // 1. Salva no repositório Firestore / Cache Híbrido
      try {
        await QuebrasRepository.batchUpsert(rowsData, companyId);
      } catch (repoErr) {
        console.warn('Salvando em cache local resiliente:', repoErr);
      }

      // 2. Mescla e persiste no LocalStorage para sincronização instantânea em todos os módulos
      const customKey = `custom_quebras_${companyId}`;
      const savedCustom = localStorage.getItem(customKey);
      let existingCustom: QuebraRow[] = [];
      if (savedCustom) {
        try {
          const parsed = JSON.parse(savedCustom);
          if (Array.isArray(parsed)) existingCustom = parsed;
        } catch (_) {}
      }

      const mergedCustom = [...rowsData, ...existingCustom];
      safeSetLocalStorage(customKey, JSON.stringify(mergedCustom));
      safeSetLocalStorage(`quebras_${companyId}`, JSON.stringify(mergedCustom));
      safeSetLocalStorage(`quebras_records_${companyId}`, JSON.stringify(mergedCustom));
      safeSetLocalStorage(`local_quebras_${companyId}`, JSON.stringify(mergedCustom));

      // 3. Atualiza estado local do painel
      const officialRows = buildOfficialQuebrasRows(companyId);
      const combinedAll = [...mergedCustom, ...officialRows];
      combinedAll.sort((a, b) => (b.dataISO || '').localeCompare(a.dataISO || ''));
      setQuebras(combinedAll);

      // 4. Dispara eventos globais para atualização reativa instantânea de todas as telas e painéis
      window.dispatchEvent(new CustomEvent('quebras-db-updated', { detail: rowsData }));
      window.dispatchEvent(new CustomEvent('quebras-updated', { detail: rowsData }));
      window.dispatchEvent(new CustomEvent('pacote_prejuizo_updated'));
      window.dispatchEvent(new CustomEvent('retroactive-data-updated'));
      window.dispatchEvent(new CustomEvent('empresa-data-reload'));
      window.dispatchEvent(new Event('storage'));

      const importedCount = rowsData.length;
      setImportStatusMsg(`✅ Sucesso! ${importedCount} registros de quebras foram importados e o Dashboard foi atualizado com sucesso!`);
      setImportFile(null);
      setImportPreview([]);
      setPastedText('');
      
      // Feedback amigável
      setTimeout(() => {
        setActiveTab('hist');
      }, 1200);
    } catch (err: any) {
      console.error('Erro ao importar:', err);
      setImportStatusMsg(`❌ Erro durante a importação: ${err?.message || err}`);
    } finally {
      setImporting(false);
    }
  };

  // Submit file upload
  const handleImportFileSubmit = () => {
    if (!importFile) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet) as any[];
        await processAndImportRows(rows);
      } catch (err: any) {
        setImportStatusMsg('❌ Erro ao ler planilha: ' + err);
      }
    };
    reader.readAsBinaryString(importFile);
  };

  // Submit pasted JSON or CSV text
  const handlePasteSubmit = async () => {
    if (!pastedText.trim()) {
      setImportStatusMsg('⚠️ Cole os registros no campo de texto antes de clicar em importar.');
      return;
    }
    try {
      setImporting(true);
      setImportStatusMsg('⏳ Analisando dados colados...');
      const parsedRows = smartParseQuebrasText(pastedText);
      if (!parsedRows || parsedRows.length === 0) {
        setImportStatusMsg('❌ Não foi possível identificar registros válidos no texto colado. Certifique-se de que os dados estão em formato JSON ({...}) ou CSV com cabeçalho.');
        setImporting(false);
        return;
      }
      await processAndImportRows(parsedRows);
    } catch (err: any) {
      console.error('Erro ao processar texto fornecido:', err);
      setImportStatusMsg('❌ Erro ao processar texto: ' + (err?.message || err));
      setImporting(false);
    }
  };
  const [draftRestored, setDraftRestored] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return !!(parsed.produtoBusca || parsed.selectedProd || (parsed.quantidade !== undefined && parsed.quantidade !== '') || parsed.area !== 'ARMAZEM' || parsed.turno !== 'MANHÃ' || parsed.colaboradorQuebrou);
      }
    } catch (e) {}
    return false;
  });

  const toggleDateGroup = (dateKey: string) => {
    setExpandedDates(prev => ({ ...prev, [dateKey]: !prev[dateKey] }));
  };

  const motivosDisponiveis = QB_TIPOS[area] || [];
  const isQuebraMovimentacao = motivoCod === 539 || motivoCod === 557 || motivoCod === 589;

  // Reset selected motive code on area update (only if we don't have a loaded motive yet or area changes)
  useEffect(() => {
    if (motivosDisponiveis.length > 0) {
      const savedMotive = getDraftValue('motivoCod', null);
      if (savedMotive && motivosDisponiveis.some(m => m.cod === savedMotive)) {
        setMotivoCod(savedMotive);
      } else {
        setMotivoCod(motivosDisponiveis[0].cod);
      }
    } else {
      setMotivoCod(0);
    }
  }, [area]);

  // Sync state with local draft saving
  useEffect(() => {
    const draftData = {
      produtoBusca,
      selectedProd,
      quantidade,
      area,
      turno,
      motivoCod,
      colaboradorQuebrou
    };
    safeSetLocalStorage(draftKey, JSON.stringify(draftData));
  }, [produtoBusca, selectedProd, quantidade, area, turno, motivoCod, colaboradorQuebrou, draftKey]);

  // Sync with prop updates / user changing
  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setProdutoBusca(parsed.produtoBusca || '');
        setSelectedProd(parsed.selectedProd || null);
        setQuantidade(parsed.quantidade !== undefined ? parsed.quantidade : '');
        setArea(parsed.area || 'ARMAZEM');
        setTurno(parsed.turno || 'MANHÃ');
        setMotivoCod(parsed.motivoCod || 0);
        const colabVal = parsed.colaboradorQuebrou || '';
        setColaboradorQuebrou(colabVal);
        setShowCustomInput(colabVal !== '' && !colaboradoresList.includes(colabVal));
        setDraftRestored(!!(parsed.produtoBusca || parsed.selectedProd || (parsed.quantidade !== undefined && parsed.quantidade !== '') || parsed.area !== 'ARMAZEM' || parsed.turno !== 'MANHÃ' || parsed.colaboradorQuebrou));
      } else {
        setProdutoBusca('');
        setSelectedProd(null);
        setQuantidade('');
        setArea('ARMAZEM');
        setTurno('MANHÃ');
        setMotivoCod(0);
        setColaboradorQuebrou('');
        setShowCustomInput(false);
        setDraftRestored(false);
      }
    } catch (e) {
      console.error(e);
    }
  }, [draftKey]);

  // Sync with empresaData (scoped to company)
  useEffect(() => {
    const companyId = empresa?.id || 'demo';
    let updateDebounceTimer: any = null;
    let cancelLoad = false;

    const refreshQuebras = (isImmediate = false) => {
      const doLoad = () => {
        if (cancelLoad) return;
        const officialRows = buildOfficialQuebrasRows(companyId);
        const hasLiveDb = Array.isArray(empresaData.quebras) && empresaData.quebras.length > 0;
        const baseRows: QuebraRow[] = hasLiveDb ? empresaData.quebras : officialRows;
        const seenIds = new Set(baseRows.map(r => String(r.id || r._docId)));

        const customRows: QuebraRow[] = [];
        const seenKeys = new Set<string>();

        baseRows.forEach(r => {
          const key = `${r.dataISO || r.data || ''}_${r.codProduto || ''}_${(r.colaborador || r.colaboradorQuebrou || r.responsavel || '').toUpperCase()}_${(r.area || '').toUpperCase()}_${r.quantidade || 0}_${r.codQuebra || ''}_${(r.motivo || '').toUpperCase()}`;
          seenKeys.add(key);
        });

        const addCustomIfNew = (item: QuebraRow) => {
          if (!item) return;
          const idStr = String(item.id || item._docId || '');
          if (idStr && (seenIds.has(idStr) || idStr.startsWith('qb-retro-'))) return;
          const itemKey = `${item.dataISO || item.data || ''}_${item.codProduto || ''}_${(item.colaborador || item.colaboradorQuebrou || item.responsavel || '').toUpperCase()}_${(item.area || '').toUpperCase()}_${item.quantidade || 0}_${item.codQuebra || ''}_${(item.motivo || '').toUpperCase()}`;
          if (seenKeys.has(itemKey)) return;
          seenKeys.add(itemKey);
          customRows.push(item);
        };

        if (!hasLiveDb && empresaData.quebras && empresaData.quebras.length > 0) {
          empresaData.quebras.forEach(addCustomIfNew);
        }

        const lsKeys = [
          `custom_quebras_${companyId}`,
          `quebras_${companyId}`,
          `quebras_records_${companyId}`,
          `local_quebras_${companyId}`
        ];
        lsKeys.forEach(k => {
          const savedCustom = localStorage.getItem(k);
          if (savedCustom) {
            try {
              const parsed = JSON.parse(savedCustom);
              if (Array.isArray(parsed)) parsed.forEach(addCustomIfNew);
            } catch (_) {}
          }
        });

        const combined = customRows.length > 0 ? [...customRows, ...baseRows] : [...baseRows];
        combined.sort((a, b) => (b.dataISO || '').localeCompare(a.dataISO || ''));
        if (!cancelLoad) {
          setQuebras(combined);
          setIsDataLoading(false);
        }
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
    };

    refreshQuebras(false);

    const handleUpdated = () => {
      if (updateDebounceTimer) clearTimeout(updateDebounceTimer);
      updateDebounceTimer = setTimeout(() => {
        refreshQuebras(true);
      }, 150);
    };

    window.addEventListener('quebras-db-updated', handleUpdated);
    window.addEventListener('quebras-updated', handleUpdated);
    window.addEventListener('retroactive-data-updated', handleUpdated);
    window.addEventListener('empresa-data-reload', handleUpdated);
    window.addEventListener('storage', handleUpdated);
    return () => {
      cancelLoad = true;
      if (updateDebounceTimer) clearTimeout(updateDebounceTimer);
      window.removeEventListener('quebras-db-updated', handleUpdated);
      window.removeEventListener('quebras-updated', handleUpdated);
      window.removeEventListener('retroactive-data-updated', handleUpdated);
      window.removeEventListener('empresa-data-reload', handleUpdated);
      window.removeEventListener('storage', handleUpdated);
    };
  }, [empresaData.quebras, empresa?.id]);

  const handleSelectProd = (p: { codigo: number, descricao: string }) => {
    setSelectedProd(p);
    setProdutoBusca(p.descricao);
    setShowProdDropdown(false);
  };

  const handleRegister = async () => {
    if (shiftStarted === false) {
      alert('⚠️ Você precisa Iniciar a Jornada na Operação Ajudante antes de realizar lançamentos!');
      if (onRequireShiftStart) onRequireShiftStart();
      return;
    }

    if (!selectedProd || !quantidade || Number(quantidade) <= 0 || !area || !turno || !motivoCod) {
      alert('Selecione o produto, digite uma quantidade válida e insira o motivo.');
      return;
    }

    const isQuebraMovimentacao = motivoCod === 539 || motivoCod === 557 || motivoCod === 589;
    if (isQuebraMovimentacao && !colaboradorQuebrou.trim()) {
      alert('Por favor, informe o nome do colaborador que quebrou o produto por movimentação.');
      return;
    }

    setRegistering(true);
    const today = new Date();
    const dataISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const dataStr = today.toLocaleDateString('pt-BR');

    const chosenMotive = motivosDisponiveis.find(m => m.cod === motivoCod)?.motivo || String(motivoCod);
    const companyId = empresa?.id || 'demo';
    const genId = `qb-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const newRow: QuebraRow & { empresaId: string; _criadoEm?: string } = {
      id: genId,
      _docId: genId,
      empresaId: companyId,
      data: dataStr,
      dataISO,
      _criadoEm: today.toISOString(),
      fiscal: user.nome || 'Fiscal',
      codProduto: String(selectedProd.codigo),
      descricao: selectedProd.descricao,
      quantidade: Number(quantidade),
      area,
      turno,
      codQuebra: String(motivoCod),
      motivo: chosenMotive,
      ...(isQuebraMovimentacao || colaboradorQuebrou ? { colaboradorQuebrou: colaboradorQuebrou.trim(), colaborador: colaboradorQuebrou.trim(), responsavel: colaboradorQuebrou.trim() } : {})
    };

    try {
      await QuebrasRepository.create(newRow, companyId);

      const customKey = `custom_quebras_${companyId}`;
      const savedCustom = localStorage.getItem(customKey);
      let existingCustom: QuebraRow[] = [];
      if (savedCustom) {
        try {
          const parsed = JSON.parse(savedCustom);
          if (Array.isArray(parsed)) existingCustom = parsed;
        } catch (_) {}
      }

      const mergedCustom = [newRow, ...existingCustom];
      safeSetLocalStorage(customKey, JSON.stringify(mergedCustom));
      safeSetLocalStorage(`quebras_${companyId}`, JSON.stringify(mergedCustom));
      safeSetLocalStorage(`quebras_records_${companyId}`, JSON.stringify(mergedCustom));
      safeSetLocalStorage(`local_quebras_${companyId}`, JSON.stringify(mergedCustom));

      setQuebras(prev => [newRow, ...prev]);

      window.dispatchEvent(new CustomEvent('quebras-db-updated', { detail: [newRow] }));
      window.dispatchEvent(new CustomEvent('quebras-updated', { detail: [newRow] }));
      window.dispatchEvent(new CustomEvent('pacote_prejuizo_updated'));
      window.dispatchEvent(new CustomEvent('retroactive-data-updated'));
      window.dispatchEvent(new CustomEvent('empresa-data-reload'));
      window.dispatchEvent(new Event('storage'));

      setProdutoBusca('');
      setSelectedProd(null);
      setQuantidade('');
      setColaboradorQuebrou('');
      setShowCustomInput(false);
      setDraftRestored(false);
      localStorage.removeItem(draftKey);
      setActiveTab('hist');
    } catch(e) {
      alert('Erro ao registrar quebra: ' + e);
    } finally {
      setRegistering(false);
    }
  };

  // Editing state for history items
  const [editingRow, setEditingRow] = useState<QuebraRow | null>(null);
  const [editQuantidade, setEditQuantidade] = useState<string>('');
  const [editArea, setEditArea] = useState<string>('ARMAZEM');
  const [editTurno, setEditTurno] = useState<string>('MANHÃ');
  const [editMotivoCod, setEditMotivoCod] = useState<number | ''>('');
  const [editColaborador, setEditColaborador] = useState<string>('');
  const [showEditCustomInput, setShowEditCustomInput] = useState<boolean>(false);
  const [editDataISO, setEditDataISO] = useState<string>('');
  const [editProdBusca, setEditProdBusca] = useState<string>('');
  const [editSelectedProd, setEditSelectedProd] = useState<{ codigo: number; descricao: string } | null>(null);
  const [showEditProdDropdown, setShowEditProdDropdown] = useState<boolean>(false);
  const [savingEdit, setSavingEdit] = useState<boolean>(false);

  const handleDelete = async (docId?: string) => {
    if (!docId) return;
    const companyId = empresa?.id || 'demo';
    try {
      await QuebrasRepository.delete(docId, companyId);
    } catch (e) {
      console.error(e);
    } finally {
      const remaining = quebras.filter(r => r._docId !== docId && (r as any).id !== docId);
      setQuebras(remaining);
      safeSetLocalStorage(`quebras_${companyId}`, JSON.stringify(remaining));
      safeSetLocalStorage(`custom_quebras_${companyId}`, JSON.stringify(remaining));
      safeSetLocalStorage(`quebras_records_${companyId}`, JSON.stringify(remaining));
      safeSetLocalStorage(`local_quebras_${companyId}`, JSON.stringify(remaining));

      window.dispatchEvent(new CustomEvent('quebras-db-updated'));
      window.dispatchEvent(new CustomEvent('quebras-updated'));
      window.dispatchEvent(new CustomEvent('pacote_prejuizo_updated'));
      window.dispatchEvent(new CustomEvent('retroactive-data-updated'));
      window.dispatchEvent(new CustomEvent('empresa-data-reload'));
      window.dispatchEvent(new Event('storage'));
    }
  };

  const handleStartEdit = (q: QuebraRow) => {
    setEditingRow(q);
    setEditQuantidade(String(q.quantidade || ''));
    setEditArea(q.area || 'ARMAZEM');
    setEditTurno(q.turno || 'MANHÃ');
    setEditMotivoCod(q.codQuebra ? Number(q.codQuebra) : '');
    const colabVal = q.colaboradorQuebrou || '';
    setEditColaborador(colabVal);
    setShowEditCustomInput(colabVal !== '' && !colaboradoresList.includes(colabVal));
    setEditDataISO(q.dataISO || (q.data ? q.data.split('/').reverse().join('-') : new Date().toISOString().split('T')[0]));

    const foundProd = PRODUCTS.find(p => String(p.codigo) === String(q.codProduto) || p.descricao.toLowerCase() === (q.descricao || '').toLowerCase());
    if (foundProd) {
      setEditSelectedProd(foundProd);
      setEditProdBusca(foundProd.descricao);
    } else {
      setEditSelectedProd({ codigo: Number(q.codProduto) || 0, descricao: q.descricao });
      setEditProdBusca(q.descricao);
    }
    setShowEditProdDropdown(false);
  };

  const handleSaveEdit = async () => {
    if (!editingRow) return;
    if (!editSelectedProd || !editQuantidade || Number(editQuantidade) <= 0 || !editArea || !editTurno || !editMotivoCod) {
      alert('Preencha os campos obrigatórios para atualizar a quebra.');
      return;
    }

    const motives = QB_TIPOS[editArea] || QB_TIPOS['ARMAZEM'];
    const chosenMotive = motives.find(m => m.cod === Number(editMotivoCod))?.motivo || String(editMotivoCod);
    const isQuebraMovimentacao = Number(editMotivoCod) === 539 || Number(editMotivoCod) === 557 || Number(editMotivoCod) === 589;

    let formattedData = editingRow.data;
    if (editDataISO) {
      const parts = editDataISO.split('-');
      if (parts.length === 3) {
        formattedData = `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }

    setSavingEdit(true);
    const companyId = empresa?.id || 'demo';

    const updatedFields: Partial<QuebraRow> = {
      codProduto: String(editSelectedProd.codigo),
      descricao: editSelectedProd.descricao,
      quantidade: Number(editQuantidade),
      area: editArea,
      turno: editTurno,
      codQuebra: String(editMotivoCod),
      motivo: chosenMotive,
      dataISO: editDataISO,
      data: formattedData,
      colaboradorQuebrou: isQuebraMovimentacao || editColaborador ? editColaborador.trim() : ''
    };

    try {
      const idToUpdate = editingRow._docId || editingRow.id;
      if (idToUpdate) {
        await QuebrasRepository.update(idToUpdate, updatedFields, companyId);
      }

      const nextQuebras = quebras.map(r => ((r._docId === idToUpdate || r.id === idToUpdate) ? { ...r, ...updatedFields } : r));
      setQuebras(nextQuebras);
      safeSetLocalStorage(`quebras_${companyId}`, JSON.stringify(nextQuebras));
      safeSetLocalStorage(`custom_quebras_${companyId}`, JSON.stringify(nextQuebras));
      safeSetLocalStorage(`quebras_records_${companyId}`, JSON.stringify(nextQuebras));
      safeSetLocalStorage(`local_quebras_${companyId}`, JSON.stringify(nextQuebras));

      window.dispatchEvent(new CustomEvent('quebras-db-updated', { detail: nextQuebras }));
      window.dispatchEvent(new CustomEvent('quebras-updated', { detail: nextQuebras }));
      window.dispatchEvent(new CustomEvent('pacote_prejuizo_updated'));
      window.dispatchEvent(new CustomEvent('retroactive-data-updated'));
      window.dispatchEvent(new CustomEvent('empresa-data-reload'));
      window.dispatchEvent(new Event('storage'));

      setEditingRow(null);
    } catch (e) {
      alert('Erro ao atualizar lançamento: ' + e);
    } finally {
      setSavingEdit(false);
    }
  };

  const filteredQuebras = useMemo(() => {
    return filterHistoryForUser<QuebraRow>(quebras, user);
  }, [quebras, user]);

  const todayQuebras = useMemo(() => {
    const today = new Date().toLocaleDateString('pt-BR');
    return quebras.filter(r => r.data === today && (r.fiscal === user.nome || r.responsavel === user.nome || (r as any).fiscal === user.nome));
  }, [quebras, user.nome]);

  const todayQuebrasStats = useMemo(() => {
    const registros = todayQuebras.length;
    const unidades = todayQuebras.reduce((sum, r) => sum + (r.quantidade || 0), 0);
    return { registros, unidades };
  }, [todayQuebras]);

  // Custom Date Range & Export Modal State
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [showExportModal, setShowExportModal] = useState<boolean>(false);

  const dateFilteredQuebras = useMemo(() => {
    if (!filterStartDate && !filterEndDate) return filteredQuebras;
    return filteredQuebras.filter(q => {
      const rawDate = q.dataISO || q.data;
      return isDateWithinInterval(rawDate, filterStartDate, filterEndDate);
    });
  }, [filteredQuebras, filterStartDate, filterEndDate]);

  const groupedQuebrasEntries = useMemo(() => {
    const grouped = dateFilteredQuebras.reduce((acc, q) => {
      const key = q.dataISO || (q.data ? q.data.split('/').reverse().join('-') : 'sem-data');
      if (!acc[key]) acc[key] = [];
      acc[key].push(q);
      return acc;
    }, {} as Record<string, QuebraRow[]>);
    return Object.entries(grouped) as [string, QuebraRow[]][];
  }, [dateFilteredQuebras]);

  const formatQuebrasForExcel = (rows: QuebraRow[]) => {
    return rows.map(q => ({
      'Data': q.data || (q.dataISO ? q.dataISO.split('-').reverse().join('/') : '-'),
      'Cód. SKU': q.codProduto || '-',
      'Descrição': q.descricao || '-',
      'Quantidade': Number(q.quantidade || 0),
      'HL Perdido': q.hlPerdido !== undefined ? Number(q.hlPerdido).toFixed(2) : '-',
      'Valor Estimado (R$)': q.valorTotal !== undefined ? `R$ ${Number(q.valorTotal).toFixed(2)}` : (q.valor !== undefined ? `R$ ${Number(q.valor).toFixed(2)}` : '-'),
      'Área': q.area || '-',
      'Turno': q.turno || '-',
      'Cód. Quebra': q.codQuebra || '-',
      'Motivo': q.motivo || '-',
      'Colaborador Responsável': q.colaboradorQuebrou || q.responsavel || q.colaborador || q.operador || '-'
    }));
  };

  const getQuebrasExtraSummary = (rows: QuebraRow[]) => {
    const totalUnits = rows.reduce((sum, q) => sum + Number(q.quantidade || 0), 0);
    const totalHL = rows.reduce((sum, q) => sum + Number(q.hlPerdido || 0), 0);
    return [
      { label: 'Total Avariado', value: `${totalUnits} un` },
      { label: 'HL Perdido', value: `${totalHL.toFixed(2)} HL` }
    ];
  };

  // Filter products for autocomplete dropdown
  const filteredProducts = useMemo(() => {
    const q = produtoBusca.toLowerCase().trim();
    if (!q) return PRODUCTS.slice(0, 10);
    return PRODUCTS.filter(p => {
      return String(p.codigo).includes(q) || p.descricao.toLowerCase().includes(q);
    }).slice(0, 10);
  }, [produtoBusca]);

  return (
    <div className="flex flex-col gap-6">
      
      <div className="flex items-center justify-between p-4 bg-white dark:bg-[#11151c] border border-slate-200 dark:border-[#222d3a] rounded-xl w-full shadow-xs flex-wrap gap-2">
        <span className="font-sans font-black text-sm tracking-widest text-rose-600 dark:text-[#ef4444] uppercase">💥 CONTROLE DE QUEBRAS E AVARIAS</span>
      </div>

      <SopBannerViewer operation="quebras" operationName="Quebras e Avarias" theme="dark" />

      <div className="ptabs border-b border-[#222d3a] flex items-center justify-between gap-2 flex-wrap pb-1">
        <div className="flex gap-2 flex-wrap">
          <button 
            onClick={() => setActiveTab('form')}
            className={`ptab py-2 px-6 font-sans font-bold text-xs uppercase cursor-pointer relative ${activeTab === 'form' ? 'text-[#ef4444] border-b-2 border-b-[#ef4444]' : 'text-[#6a7d92] hover:text-[#e8eef5]'}`}
          >
            📝 Cadastrar Quebra
          </button>
          <button 
            onClick={() => setActiveTab('import')}
            className={`ptab py-2 px-6 font-sans font-bold text-xs uppercase cursor-pointer relative ${activeTab === 'import' ? 'text-[#ef4444] border-b-2 border-b-[#ef4444]' : 'text-[#6a7d92] hover:text-[#e8eef5]'}`}
          >
            📥 Importar Banco / Planilha
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
              {isDataLoading && dateFilteredQuebras.length === 0 ? '...' : dateFilteredQuebras.length}
            </span>
          </button>
        </div>

        {/* BOTÃO EXPORTAR POR PERÍODO PERSONALIZADO */}
        <button
          type="button"
          onClick={() => setShowExportModal(true)}
          className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all cursor-pointer border border-rose-500 shrink-0 ml-auto my-1"
          title="Exportar dados de Quebras escolhendo datas personalizadas"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Exportar por Período</span>
        </button>
      </div>

      {activeTab === 'import' && (
        <div className="g-card p-6 flex flex-col gap-6 bg-[#11151c] border border-[#222d3a] rounded-xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#222d3a] pb-4">
            <div>
              <h3 className="font-sans font-black text-lg text-snow uppercase tracking-wide flex items-center gap-2">
                <Database className="w-5 h-5 text-[#ef4444]" /> Importação em Lote — Registro de Quebras
              </h3>
              <p className="text-xs text-[#6a7d92] mt-1">
                Carregue uma planilha Excel (.xlsx / .xls), CSV ou colar lote JSON/CSV para importar registros diretamente no banco de dados da empresa ({empresa?.razaoSocial || 'Sua Empresa'}).
              </p>
            </div>
            
            <button
              onClick={handleDownloadTemplate}
              className="px-4 py-2 bg-[#151b23] hover:bg-[#1a222c] border border-[#ef4444]/40 hover:border-[#ef4444] text-[#ef4444] rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Download className="w-4 h-4" /> Baixar Modelo Excel
            </button>
          </div>

          {importStatusMsg && (
            <div className={`p-4 rounded-lg border text-xs font-bold ${importStatusMsg.includes('❌') ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>
              {importStatusMsg}
            </div>
          )}

          {/* Mode Selector */}
          <div className="flex gap-3 border-b border-[#222d3a] pb-3">
            <button
              onClick={() => setPasteMode('file')}
              className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 cursor-pointer ${pasteMode === 'file' ? 'bg-[#ef4444] text-white' : 'bg-[#151b23] text-[#6a7d92] hover:text-snow border border-[#222d3a]'}`}
            >
              <FileSpreadsheet className="w-4 h-4" /> Upload de Arquivo (Excel / CSV)
            </button>
            <button
              onClick={() => setPasteMode('paste')}
              className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 cursor-pointer ${pasteMode === 'paste' ? 'bg-[#ef4444] text-white' : 'bg-[#151b23] text-[#6a7d92] hover:text-snow border border-[#222d3a]'}`}
            >
              <FileText className="w-4 h-4" /> Colar Texto (JSON / CSV)
            </button>
          </div>

          {pasteMode === 'file' ? (
            <div className="flex flex-col gap-6">
              <div className="border-2 border-dashed border-[#222d3a] hover:border-[#ef4444]/50 bg-[#151b23]/50 rounded-xl p-8 text-center flex flex-col items-center justify-center gap-3 transition-colors">
                <Upload className="w-10 h-10 text-[#ef4444] opacity-80" />
                <div>
                  <label htmlFor="quebras-file-upload" className="font-bold text-snow text-sm cursor-pointer hover:underline text-[#ef4444]">
                    Clique para selecionar um arquivo
                  </label>
                  <span className="text-xs text-[#6a7d92] block mt-1">Suporta arquivos .xlsx, .xls ou .csv</span>
                </div>
                <input
                  id="quebras-file-upload"
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {importFile && (
                  <div className="mt-2 text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-lg flex items-center gap-2">
                    <Check className="w-4 h-4" /> {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
                  </div>
                )}
              </div>

              {/* Preview Table */}
              {importPreview.length > 0 && (
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#6a7d92]">
                      Pré-visualização das Primeiras {importPreview.length} Linhas
                    </span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-mono">
                      {importHeaders.length} colunas identificadas
                    </span>
                  </div>

                  <div className="overflow-x-auto border border-[#222d3a] rounded-lg">
                    <table className="w-full text-left font-sans text-xs">
                      <thead>
                        <tr className="bg-[#151b23] border-b border-[#222d3a] text-[#6a7d92] uppercase">
                          {importHeaders.map((h, i) => (
                            <th key={i} className="p-2.5 font-bold">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#222d3a] text-snow font-mono">
                        {importPreview.map((row, i) => (
                          <tr key={i} className="hover:bg-[#151b23]/30">
                            {importHeaders.map((h, j) => (
                              <td key={j} className="p-2.5 whitespace-nowrap">{String(row[h] || '—')}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end mt-2">
                    <button
                      onClick={handleImportFileSubmit}
                      disabled={importing}
                      className="px-6 py-3 bg-[#ef4444] hover:bg-[#dc2626] disabled:opacity-50 text-white font-bold rounded-lg text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg transition-all"
                    >
                      {importing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      Confirmar e Importar Registros
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase text-[#6a7d92] block">
                    Cole os dados em formato JSON ou CSV (com cabeçalho na 1ª linha)
                  </label>
                  {pastedText.trim() && (
                    <button
                      onClick={() => {
                        setPastedText('');
                        setImportStatusMsg(null);
                      }}
                      className="text-[11px] text-[#ef4444] hover:underline font-bold cursor-pointer"
                    >
                      Limpar Texto
                    </button>
                  )}
                </div>
                <textarea
                  rows={10}
                  value={pastedText}
                  onChange={(e) => {
                    setPastedText(e.target.value);
                    if (importStatusMsg) setImportStatusMsg(null);
                  }}
                  placeholder={`[\n  {\n    "Data": "2026-08-10 11:59:15",\n    "Mês": "AGOSTO",\n    "CodProduto": 504,\n    "Descricao": "PEPSI COLA PET 2L CAIXA C/6",\n    "Quantidade": 1,\n    "Area": "PUXADA",\n    "Turno": "NOITE",\n    "CodQuebra": "578",\n    "Motivo": "VAZAMENTO"\n  }\n]`}
                  className="w-full bg-[#151b23] border border-[#222d3a] focus:border-[#ef4444] rounded-lg p-3 font-mono text-xs text-snow focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between flex-wrap gap-3">
                {pastedText.trim() ? (
                  detectedPasteCount > 0 ? (
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                      <Check className="w-4 h-4" /> {detectedPasteCount} {detectedPasteCount === 1 ? 'registro identificado' : 'registros identificados'} pronto(s) para importação
                    </span>
                  ) : (
                    <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" /> Processando texto... Insira formato JSON com {`{ ... }`} ou CSV
                    </span>
                  )
                ) : (
                  <span className="text-xs text-[#6a7d92]">
                    Suporta fragmentos copiados de JSON, listas completas [ ... ] ou planilhas CSV/TSV.
                  </span>
                )}

                <button
                  id="btn-import-quebras-pasted-text"
                  onClick={handlePasteSubmit}
                  disabled={importing || !pastedText.trim()}
                  className="px-6 py-3 bg-[#ef4444] hover:bg-[#dc2626] disabled:opacity-50 text-white font-bold rounded-lg text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg transition-all"
                >
                  {importing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {importing ? 'Importando...' : 'Importar Registros do Texto'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="g-card p-6 flex flex-col gap-6 bg-gradient-to-br from-[#11151c] to-[#151b23] border border-[#222d3a]">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="font-sans font-black text-lg text-[#ef4444] uppercase tracking-wide flex items-center gap-2">
                <BarChart2 className="w-5 h-5" /> Minha Produtividade de Hoje (Quebras)
              </h3>
              <p className="text-xs text-[#6a7d92] mt-1">
                Visão em tempo real das quebras registradas no seu turno de hoje ({new Date().toLocaleDateString('pt-BR')}).
              </p>
            </div>
            <div className="text-[10px] text-[#6a7d92] font-mono font-bold bg-[#151b23] border border-[#222d3a] px-3 py-1.5 rounded-lg">
              OPERADOR: {user.nome}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#151b23] border border-[#222d3a] rounded-xl p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-[#ef4444]/10 text-[#ef4444]">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#6a7d92] block tracking-wider">Registros Efetuados</span>
                <span className="text-xl font-bold text-snow font-mono">
                  {todayQuebrasStats.registros}
                </span>
              </div>
            </div>

            <div className="bg-[#151b23] border border-[#222d3a] rounded-xl p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-red-500/10 text-red-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#6a7d92] block tracking-wider">Garrafas / Unidades Quebradas</span>
                <span className="text-xl font-bold text-snow font-mono">
                  {todayQuebrasStats.unidades} u
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold text-[#6a7d92] uppercase tracking-wider">Histórico Detalhado de Hoje</h4>
            {todayQuebras.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-[#222d3a] rounded-xl text-xs text-[#6a7d92]">
                Nenhuma quebra registrada por você hoje ainda. Use a aba "Cadastrar Quebra" para começar!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#a0aec0]">
                  <thead>
                    <tr className="border-b border-[#222d3a] text-[#6a7d92] uppercase text-[10px] font-bold tracking-wider">
                      <th className="py-2.5 px-3">Produto</th>
                      <th className="py-2.5 px-3">Quantidade</th>
                      <th className="py-2.5 px-3">Motivo / Cód</th>
                      <th className="py-2.5 px-3">Área / Turno</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#222d3a]">
                    {todayQuebras.map((r, idx) => (
                        <tr key={r._docId || idx} className="hover:bg-[#151b23]/30 transition-colors">
                          <td className="py-3 px-3 font-bold text-snow">
                            <span className="text-gray-500 font-mono text-[11px] block">{(r as any).codSap || r.codProduto}</span>
                            {(r as any).produto || r.descricao}
                          </td>
                          <td className="py-3 px-3 font-mono text-red-400 font-semibold">{r.quantidade} un</td>
                          <td className="py-3 px-3">
                            <span className="font-mono bg-[#151b23] border border-[#222d3a] text-snow px-1.5 py-0.5 rounded mr-1.5 font-bold text-[10px]">
                              {(r as any).motivoCod || r.codQuebra}
                            </span>
                            {r.motivo}
                          </td>
                          <td className="py-3 px-3 font-mono text-[#6a7d92]">
                            {r.area} ({r.turno})
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

      {activeTab === 'form' ? (
        <div className="g-card p-6 flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222d3a] pb-3">
            <h3 className="font-sans font-bold text-sm tracking-wider uppercase text-[#ef4444]">Cadastro de Quebra Operacional</h3>
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
                  setProdutoBusca('');
                  setSelectedProd(null);
                  setQuantidade('');
                  setArea('ARMAZEM');
                  setTurno('MANHÃ');
                  setColaboradorQuebrou('');
                  setShowCustomInput(false);
                  setDraftRestored(false);
                  localStorage.removeItem(draftKey);
                }}
                className="text-[9px] uppercase font-black tracking-wider text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
              >
                Limpar formulário
              </button>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* Real-time search autocomplete */}
            <div className="flex flex-col gap-1.5 md:col-span-8 relative">
              <label className="text-[10px] font-bold tracking-[1.5px] uppercase text-[#6a7d92]">Produto (Código ou Descrição) *</label>
              <input 
                type="text"
                placeholder="Busque pelo código ou por palavras..."
                value={produtoBusca}
                onChange={e => {
                  setProdutoBusca(e.target.value);
                  setShowProdDropdown(true);
                  if (selectedProd && e.target.value !== selectedProd.descricao) {
                    setSelectedProd(null);
                  }
                }}
                onFocus={() => setShowProdDropdown(true)}
                className="g-input"
              />
              {showDropdown && produtoBusca && filteredProducts.length > 0 && (
                <div className="absolute top-[103%] left-0 right-0 bg-white dark:bg-[#182343] border border-slate-200 dark:border-slate-700 shadow-2xl rounded-xl z-50 max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredProducts.map((p, pIdx) => (
                    <div 
                      key={`qb-prod-${p.codigo}-${pIdx}`}
                      onClick={() => handleSelectProd(p)}
                      className="p-3 hover:bg-amber-500/10 dark:hover:bg-amber-500/20 cursor-pointer text-xs flex items-start gap-2.5 transition-colors"
                    >
                      <span className="font-mono font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded text-[11px] shrink-0 self-start">
                        {p.codigo}
                      </span>
                      <span className="text-slate-800 dark:text-slate-100 font-semibold text-left break-words whitespace-normal leading-snug flex-1">
                        {p.descricao}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Card de confirmação do produto selecionado com descrição completa visível no celular */}
              {selectedProd && (
                <div className="mt-1 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start justify-between gap-2 transition-all">
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 dark:text-amber-400 font-mono font-bold text-[11px]">
                        SKU: {selectedProd.codigo}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-emerald-500 dark:text-emerald-400">
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

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-[10px] font-bold tracking-[1.5px] uppercase text-[#6a7d92]">Código SKU</label>
              <input 
                type="text" 
                readOnly
                placeholder="Auto"
                value={selectedProd ? selectedProd.codigo : ''}
                className="g-input text-center text-[#f5a623] font-bold font-mono opacity-80"
              />
            </div>

            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-[10px] font-bold tracking-[1.5px] uppercase text-[#6a7d92]">Unidades *</label>
              <input 
                type="number"
                value={quantidade}
                onChange={e => {
                  const val = e.target.value;
                  setQuantidade(val === '' ? '' : parseInt(val) || '');
                }}
                className="g-input text-center"
                placeholder="Ex: 10"
              />
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold tracking-[1.5px] uppercase text-[#6a7d92]">Área de Origem *</label>
              <select value={area} onChange={e => setArea(e.target.value)} className="g-input bg-[#151b23] border-[#1c2530]">
                <option value="ARMAZEM">Armazém / Depósito</option>
                <option value="ENTREGA">Rota de Entrega</option>
                <option value="MERCADO">Mercado / Retorno</option>
                <option value="PUXADA">Puxada / Transferência</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold tracking-[1.5px] uppercase text-[#6a7d92]">Turno Ocorrido *</label>
              <select value={turno} onChange={e => setTurno(e.target.value)} className="g-input bg-[#151b23] border-[#1c2530]">
                <option value="MANHÃ">Manhã</option>
                <option value="NOITE">Noite / Madrugada</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold tracking-[1.5px] uppercase text-[#6a7d92]">Tipo/Código de Quebra *</label>
              <select 
                value={motivoCod} 
                onChange={e => setMotivoCod(Number(e.target.value))} 
                className="g-input bg-[#151b23] border-[#1c2530]"
              >
                {motivosDisponiveis.map(m => (
                  <option key={m.cod} value={m.cod}>{m.cod} — {m.motivo}</option>
                ))}
              </select>
            </div>

          </div>

          {isQuebraMovimentacao && (
            <div className="flex flex-col gap-1.5 bg-[#ef4444]/5 border border-[#ef4444]/15 rounded-xl p-4 animate-fadeIn">
              <label className="text-[10px] font-bold tracking-[1.5px] uppercase text-[#ef4444]">Nome do Colaborador que Quebrou *</label>
              <select
                value={
                  showCustomInput 
                    ? 'OUTRO' 
                    : (colaboradorQuebrou === '' ? '' : (colaboradoresList.includes(colaboradorQuebrou) ? colaboradorQuebrou : 'OUTRO'))
                }
                onChange={e => {
                  const val = e.target.value;
                  if (val === 'OUTRO') {
                    setShowCustomInput(true);
                    setColaboradorQuebrou('');
                  } else {
                    setShowCustomInput(false);
                    setColaboradorQuebrou(val);
                  }
                }}
                className="g-input border-[#ef4444]/30 focus:border-[#ef4444] bg-[#151b23] text-white"
                required
              >
                <option value="">Selecione o colaborador...</option>
                {colaboradoresList.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
                <option value="OUTRO">OUTRO / NÃO LISTADO (Digitar manualmente)...</option>
              </select>

              {showCustomInput && (
                <input 
                  type="text"
                  placeholder="Digite o nome completo do colaborador responsável..."
                  value={colaboradorQuebrou}
                  onChange={e => setColaboradorQuebrou(e.target.value)}
                  className="g-input border-[#ef4444]/30 focus:border-[#ef4444] mt-1.5 animate-fadeIn bg-[#151b23] text-white"
                  required
                />
              )}
              <span className="text-[9px] text-[#ef4444]/60 font-semibold uppercase tracking-wider">Identificação obrigatória para quebras com movimentação.</span>
            </div>
          )}

          <button 
            type="button"
            disabled={registering || !selectedProd}
            onClick={handleRegister}
            className="w-full py-4 text-sm font-sans font-bold uppercase tracking-widest text-white bg-gradient-to-br from-[#ef4444] to-[#af2424] hover:shadow-[0_4px_16px_rgba(239,68,68,0.25)] rounded-xl disabled:opacity-50 cursor-pointer"
          >
            {registering ? 'Lançando...' : '💾 ADICIONAR QUEBRA / AVARIA'}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <HistoryRestrictionNotice user={user} />

          {/* BARRA DE FILTRO DE DATA E EXPORTAÇÃO */}
          <CustomDateFilterBar
            startDate={filterStartDate}
            endDate={filterEndDate}
            onStartDateChange={setFilterStartDate}
            onEndDateChange={setFilterEndDate}
            onReset={() => { setFilterStartDate(''); setFilterEndDate(''); }}
            onOpenExportModal={() => setShowExportModal(true)}
            totalFiltered={dateFilteredQuebras.length}
            totalAll={filteredQuebras.length}
            accentColor="red"
            label="Filtrar Quebras por Período:"
            unitLabel="lançamentos"
            extraStats={`Total: ${dateFilteredQuebras.reduce((s, q) => s + (q.quantidade || 0), 0)} un`}
          />
          {(() => {
            if (isDataLoading && groupedQuebrasEntries.length === 0) {
              return (
                <div className="g-card p-12 text-center text-[#6a7d92] flex flex-col items-center justify-center gap-2">
                  <div className="w-6 h-6 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
                  <span className="text-xs font-semibold">Carregando histórico de quebras...</span>
                </div>
              );
            }

            if (groupedQuebrasEntries.length === 0) {
              return <div className="g-card p-12 text-center text-[#6a7d92]">Nenhuma quebra registrada.</div>;
            }

            const totalDates = groupedQuebrasEntries.length;
            const startIdx = (historyPage - 1) * historyPageSize;
            const pagedEntries = groupedQuebrasEntries.slice(startIdx, startIdx + historyPageSize);

            return (
              <>
                {pagedEntries.map(([dateKey, rows]) => {
                  const isOpen = !!expandedDates[dateKey];
                  const totalUnits = rows.reduce((s, q) => s + (q.quantidade || 0), 0);

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
                            {rows.length} registros
                          </span>
                          <span className="text-[10px] text-[#6a7d92] font-semibold">
                            ❌ {totalUnits} unidades avariadas
                          </span>
                        </div>
                        <span className="text-[#6a7d92] text-xs transition-transform" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}>▼</span>
                      </div>

                      {isOpen && (
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse font-sans text-xs min-w-[700px]">
                            <thead>
                              <tr className="bg-[#07090d] border-b border-[#222d3a]">
                                <th className="p-3 text-[#6a7d92] text-left uppercase tracking-wider">Cód. SKU</th>
                                <th className="p-3 text-[#6a7d92] text-left uppercase tracking-wider">Descrição do SKU</th>
                                <th className="p-3 text-[#6a7d92] text-center uppercase tracking-wider">Unidades</th>
                                <th className="p-3 text-[#6a7d92] text-left uppercase tracking-wider">Área</th>
                                <th className="p-3 text-[#6a7d92] text-left uppercase tracking-wider">Turno</th>
                                <th className="p-3 text-[#6a7d92] text-left uppercase tracking-wider">Código Padrão</th>
                                <th className="p-3 text-[#6a7d92] text-left uppercase tracking-wider">Motivo</th>
                                <th className="p-3 text-[#6a7d92] text-right uppercase tracking-wider">Ação</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#222d3a]/60">
                              {rows.map((q, i) => (
                                <tr key={q._docId || i} className="hover:bg-[#151b23]/10">
                                  <td className="p-3 font-mono font-bold text-snow">{q.codProduto}</td>
                                  <td className="p-3">{q.descricao}</td>
                                  <td className="p-3 text-center text-red font-black text-sm">{q.quantidade}</td>
                                  <td className="p-3 font-bold text-snow">{q.area}</td>
                                  <td className="p-3 uppercase text-[10px] font-bold text-[#6a7d92]">{q.turno}</td>
                                  <td className="p-3 font-mono font-bold text-[#f5a623]">{q.codQuebra}</td>
                                  <td className="p-3 text-[#6a7d92]">
                                    {q.motivo}
                                    {q.colaboradorQuebrou && (
                                      <span className="block text-[10px] text-red-400 font-black uppercase tracking-wider mt-0.5">
                                        👤 Colab: {q.colaboradorQuebrou}
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-3 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <button 
                                        onClick={() => handleStartEdit(q)}
                                        className="py-1 px-2 bg-blue-500/10 border border-blue-500/30 hover:bg-blue-600 text-blue-400 hover:text-white rounded text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1"
                                        title="Editar informações do registro"
                                      >
                                        ✏️ Editar
                                      </button>
                                      <button 
                                        onClick={() => handleDelete(q._docId)}
                                        className="py-1 px-2 bg-red-500/10 border border-[#ef4444]/20 hover:bg-[#ef4444] text-[#fca5a5] hover:text-white rounded text-[10px] font-bold cursor-pointer transition-all"
                                        title="Excluir lançamento"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}

                {totalDates > historyPageSize && (
                  <div className="pt-2">
                    <PaginationControls
                      currentPage={historyPage}
                      pageSize={historyPageSize}
                      hasMore={historyPage * historyPageSize < totalDates}
                      hasPrev={historyPage > 1}
                      totalCount={totalDates}
                      onPrevPage={() => setHistoryPage((p) => Math.max(1, p - 1))}
                      onNextPage={() => setHistoryPage((p) => p + 1)}
                      onPageSizeChange={(newSize) => {
                        setHistoryPageSize(newSize);
                        setHistoryPage(1);
                      }}
                      theme="dark"
                    />
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* Modal de Edição de Lançamento no Histórico */}
      {editingRow && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#11151c] border border-[#222d3a] rounded-xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-4 text-snow max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#222d3a] pb-3">
              <h3 className="font-sans font-black text-sm uppercase tracking-wider text-[#ef4444] flex items-center gap-2">
                ✏️ EDITAR INFORMAÇÕES DO REGISTRO
              </h3>
              <button 
                onClick={() => setEditingRow(null)}
                className="text-[#6a7d92] hover:text-white font-bold text-base p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-3.5 text-xs">
              {/* Data do Lançamento */}
              <div>
                <label className="block text-[11px] font-bold text-[#6a7d92] uppercase mb-1">Data do Lançamento</label>
                <input 
                  type="date"
                  value={editDataISO}
                  onChange={(e) => setEditDataISO(e.target.value)}
                  className="w-full bg-[#151b23] border border-[#222d3a] rounded p-2.5 text-snow font-mono focus:border-[#ef4444] outline-none"
                />
              </div>

              {/* Produto Autocomplete */}
              <div className="relative">
                <label className="block text-[11px] font-bold text-[#6a7d92] uppercase mb-1">Produto / SKU</label>
                <input 
                  type="text"
                  value={editProdBusca}
                  onChange={(e) => {
                    setEditProdBusca(e.target.value);
                    setShowEditProdDropdown(true);
                  }}
                  onFocus={() => setShowEditProdDropdown(true)}
                  placeholder="Digite o código ou descrição do produto..."
                  className="w-full bg-[#151b23] border border-[#222d3a] rounded p-2.5 text-snow font-mono focus:border-[#ef4444] outline-none"
                />
                {showEditProdDropdown && (
                  <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-[#151b23] border border-[#222d3a] rounded shadow-xl max-h-48 overflow-y-auto divide-y divide-[#222d3a]">
                    {PRODUCTS.filter(p => {
                      const q = editProdBusca.toLowerCase();
                      return String(p.codigo).includes(q) || p.descricao.toLowerCase().includes(q);
                    }).slice(0, 8).map((p, pIdx) => (
                      <div 
                        key={`qb-edit-prod-${p.codigo}-${pIdx}`}
                        onClick={() => {
                          setEditSelectedProd(p);
                          setEditProdBusca(p.descricao);
                          setShowEditProdDropdown(false);
                        }}
                        className="p-2.5 hover:bg-[#222d3a] cursor-pointer flex items-start gap-2.5 text-xs"
                      >
                        <span className="font-mono text-[#f5a623] text-[11px] shrink-0 font-bold bg-[#f5a623]/10 px-1.5 py-0.5 rounded self-start">Cód: {p.codigo}</span>
                        <span className="font-bold text-snow break-words whitespace-normal leading-snug flex-1">{p.descricao}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quantidade */}
              <div>
                <label className="block text-[11px] font-bold text-[#6a7d92] uppercase mb-1">Quantidade (Unidades)</label>
                <input 
                  type="number"
                  value={editQuantidade}
                  onChange={(e) => setEditQuantidade(e.target.value)}
                  min="1"
                  className="w-full bg-[#151b23] border border-[#222d3a] rounded p-2.5 text-snow font-bold text-sm focus:border-[#ef4444] outline-none"
                />
              </div>

              {/* Área */}
              <div>
                <label className="block text-[11px] font-bold text-[#6a7d92] uppercase mb-1">Área Operacional</label>
                <select 
                  value={editArea}
                  onChange={(e) => {
                    const newArea = e.target.value;
                    setEditArea(newArea);
                    const availableMotives = QB_TIPOS[newArea] || [];
                    if (availableMotives.length > 0) {
                      setEditMotivoCod(availableMotives[0].cod);
                    }
                  }}
                  className="w-full bg-[#151b23] border border-[#222d3a] rounded p-2.5 text-snow font-bold focus:border-[#ef4444] outline-none"
                >
                  <option value="ARMAZEM">ARMAZÉM</option>
                  <option value="ENTREGA">ENTREGA</option>
                  <option value="MERCADO">MERCADO</option>
                  <option value="PUXADA">PUXADA</option>
                </select>
              </div>

              {/* Turno */}
              <div>
                <label className="block text-[11px] font-bold text-[#6a7d92] uppercase mb-1">Turno</label>
                <select 
                  value={editTurno}
                  onChange={(e) => setEditTurno(e.target.value)}
                  className="w-full bg-[#151b23] border border-[#222d3a] rounded p-2.5 text-snow font-bold focus:border-[#ef4444] outline-none"
                >
                  <option value="MANHÃ">MANHÃ</option>
                  <option value="TARDE">TARDE</option>
                  <option value="NOITE / MADRUGADA">NOITE / MADRUGADA</option>
                </select>
              </div>

              {/* Motivo */}
              <div>
                <label className="block text-[11px] font-bold text-[#6a7d92] uppercase mb-1">Motivo da Quebra</label>
                <select 
                  value={editMotivoCod}
                  onChange={(e) => setEditMotivoCod(Number(e.target.value))}
                  className="w-full bg-[#151b23] border border-[#222d3a] rounded p-2.5 text-snow font-bold focus:border-[#ef4444] outline-none"
                >
                  {(QB_TIPOS[editArea] || QB_TIPOS['ARMAZEM']).map(m => (
                    <option key={m.cod} value={m.cod}>
                      [{m.cod}] {m.motivo}
                    </option>
                  ))}
                </select>
              </div>

              {/* Colaborador */}
              {(editMotivoCod === 539 || editMotivoCod === 557 || editMotivoCod === 589 || editColaborador || showEditCustomInput) && (
                <div className="flex flex-col gap-1.5">
                  <label className="block text-[11px] font-bold text-[#6a7d92] uppercase mb-1">Colaborador / Operador</label>
                  <select 
                    value={
                      showEditCustomInput 
                        ? 'OUTRO' 
                        : (editColaborador === '' ? '' : (colaboradoresList.includes(editColaborador) ? editColaborador : 'OUTRO'))
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'OUTRO') {
                        setShowEditCustomInput(true);
                        setEditColaborador('');
                      } else {
                        setShowEditCustomInput(false);
                        setEditColaborador(val);
                      }
                    }}
                    className="w-full bg-[#151b23] border border-[#222d3a] rounded p-2.5 text-snow font-bold focus:border-[#ef4444] outline-none"
                  >
                    <option value="">Selecione o Colaborador...</option>
                    {colaboradoresList.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="OUTRO">OUTRO / NÃO LISTADO (Digitar manualmente)...</option>
                  </select>

                  {showEditCustomInput && (
                    <input 
                      type="text"
                      placeholder="Digite o nome do colaborador..."
                      value={editColaborador}
                      onChange={(e) => setEditColaborador(e.target.value)}
                      className="w-full bg-[#151b23] border border-[#ef4444]/40 rounded p-2.5 text-snow font-bold text-xs focus:border-[#ef4444] outline-none animate-fadeIn"
                      required
                    />
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-[#222d3a] pt-4 mt-2">
              <button 
                onClick={() => setEditingRow(null)}
                className="px-4 py-2 border border-[#222d3a] hover:bg-[#151b23] text-[#6a7d92] hover:text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="px-5 py-2 bg-[#ef4444] hover:bg-red-600 text-white rounded-lg text-xs font-black cursor-pointer shadow-lg disabled:opacity-50 flex items-center gap-2"
              >
                {savingEdit ? 'Salvando...' : '💾 Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL DE EXPORTAÇÃO PERSONALIZADA POR PERÍODO */}
      <CustomDateExportModal<QuebraRow>
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Exportar Registro de Quebras e Avarias"
        subtitle="Escolha o intervalo de datas para exportar os registros de Quebras em Excel ou CSV com cálculos de perdas."
        records={filteredQuebras}
        dateExtractor={q => q.dataISO || q.data}
        formatDataForExcel={formatQuebrasForExcel}
        defaultFileName="Relatorio_Quebras_Avarias"
        sheetName="Quebras"
        accentColor="red"
        extraSummary={getQuebrasExtraSummary}
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
