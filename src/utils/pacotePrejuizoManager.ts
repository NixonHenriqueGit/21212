import { QuebraRow, DespejoRow } from '../types';
import { buildOfficialQuebrasRows } from './retroactiveQuebrasParser';
import { buildOfficialDespejoRows } from './retroactiveDespejoParser';
import { getItemHlInfo, getItemValorReal } from '../components/WqiTab';
import { getCachedLocalStorage, setCachedLocalStorage } from './storageCache';
import { sanitizeData } from '../security/JsonSecuritySanitizer';
import { buildOfficialTrocasReposicoesDataset } from '../data/trocasReposicoesOfficialDataset';
import { getStoredShelfItems, ShelfItem } from './pncManager';
import { buildOfficialRefugoDataset } from '../data/refugoOfficialDataset';
import { buildOfficialValesDataset } from '../data/valesOfficialDataset';
import { buildOfficialInventarioDataset } from '../data/inventarioOfficialDataset';

export type PacotePrejuizoIndicador = 
  | 'quebras' 
  | 'despejo' 
  | 'trocas' 
  | 'inventario' 
  | 'refugo' 
  | 'vales';

export interface PacotePrejuizoUnifiedItem {
  id: string;
  indicador: PacotePrejuizoIndicador;
  indicadorNome: string;
  data: string; // YYYY-MM-DD or DD/MM/YYYY
  mesAno: string; // MM/YYYY
  codProduto: string | number;
  descricao: string;
  quantidade: number;
  unidadeMedida?: string;
  hlTotal: number;
  valorTotal: number;
  motivo: string;
  causaRaiz: string;
  setor?: string;
  responsavel?: string;
  documentoRef?: string;
  detalhesExtras?: Record<string, any>;
  origem: 'plataforma' | 'json_importado' | 'manual';
}

// Modelos específicos
export interface TrocaReposicaoItem {
  id: string;
  data: string;
  codProduto: string | number;
  descricao: string;
  quantidade: number;
  valorTotal?: number;
  hlTotal?: number;
  motivo: string; // ex: Choque mecânico, Vazamento, Fora de padrão, Produto avariado na rota
  causa: string; // ex: Rota de entrega, Manuseio no PDV, Troca comercial, Recolhimento
  cliente?: string;
  rota?: string;
  motorista?: string;
  conferente?: string;
  notaFiscal?: string;
  observacao?: string;
}

export interface InventarioPerdaItem {
  id: string;
  data: string;
  codProduto: string | number;
  descricao: string;
  quantidade: number; // quantidade em falta/perda
  tipoDivergencia: 'Falta Física' | 'Sobra Invertida' | 'Ajuste Contábil' | 'Extravio/Furto' | 'Avaria Oculta';
  motivo: string;
  causa: string; // ex: Divergência de contagem, Erro de bipagem, Inversão de SKU, Baixa indevida
  setorEstoque?: string; // ex: Central, Picking, Marketplace, Avaria
  ruaPosicao?: string;
  auditor?: string;
  valorTotal?: number;
  hlTotal?: number;
  observacao?: string;
}

export interface RefugoPrejuizoItem {
  id: string;
  data: string;
  tipoAtivo: 'Garrafa Vidro' | 'Garrafeira Plástica' | 'Pallet PBR' | 'Lata Alumínio' | 'PET / Embalagem' | 'Outros';
  codProduto?: string | number;
  descricao: string;
  quantidade: number;
  tipoDefeito: string; // ex: Bocal lascado, Trinca de corpo, Garrafeira quebrada, Deformação térmica
  motivo: string;
  causa: string; // ex: Triagem de vasilhame, Quebra em linha, Fadiga de material, Retorno de rota
  linhaTriagem?: string;
  responsavel?: string;
  valorTotal?: number;
  hlTotal?: number;
  observacao?: string;
}

export interface ValePrejuizoItem {
  id: string;
  data: string;
  colaborador: string;
  funcao?: string; // Motorista, Ajudante, Conferente, Operador de Empilhadeira
  motivo: string; // ex: Falta de vasilhame em rota, Avaria operacional não justificada, Sinistro de carga
  causa: string;
  status: 'Aberto' | 'Em Cobrança' | 'Liquidado / Descontado' | 'Anulado / Abonado' | 'Pendente de Acerto';
  codProduto?: string | number;
  descricao?: string;
  quantidade?: number;
  valorTotal: number;
  hlTotal?: number;
  numeroVale?: string;
  placa?: string;
  observacao?: string;
}

// Helper para padronizar Data em DD/MM/YYYY e extrair MM/YYYY
export function normalizeDate(dStr: any): { dataFmt: string; mesAno: string; rawDate: string } {
  if (!dStr) {
    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = now.getFullYear();
    return { dataFmt: `${d}/${m}/${y}`, mesAno: `${m}/${y}`, rawDate: `${y}-${m}-${d}` };
  }

  const s = String(dStr).trim();
  
  // Se for YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const parts = s.split('T')[0].split('-');
    const y = parts[0];
    const m = parts[1];
    const d = parts[2];
    return { dataFmt: `${d}/${m}/${y}`, mesAno: `${m}/${y}`, rawDate: `${y}-${m}-${d}` };
  }

  // Se for DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(s)) {
    const parts = s.split('/');
    const d = parts[0].padStart(2, '0');
    const m = parts[1].padStart(2, '0');
    const y = parts[2];
    return { dataFmt: `${d}/${m}/${y}`, mesAno: `${m}/${y}`, rawDate: `${y}-${m}-${d}` };
  }

  // Fallback
  return { dataFmt: s, mesAno: s.length >= 7 ? s.substring(3, 10) : '08/2026', rawDate: s };
}

// 1. CARREGAR QUEBRAS DIRETO DA PLATAFORMA (SEM MOCK)
export function getPlatformQuebrasForPrejuizo(companyId: string = 'demo'): PacotePrejuizoUnifiedItem[] {
  try {
    const officialRows = buildOfficialQuebrasRows(companyId);
    const customKey = `custom_quebras_${companyId}`;
    const localKey = `quebras_records_${companyId}`;
    const manualKey = `quebras_manual_entries_${companyId}`;
    
    const customList = getCachedLocalStorage<QuebraRow[]>(customKey, []) || [];
    const localList = getCachedLocalStorage<QuebraRow[]>(localKey, []) || [];
    const manualList = getCachedLocalStorage<QuebraRow[]>(manualKey, []) || [];

    const allQuebrasMap = new Map<string, QuebraRow>();
    
    // Prioritize official and local entries
    [...officialRows, ...customList, ...localList, ...manualList].forEach((q, idx) => {
      const qId = q.id || `quebra-${idx}-${q.codProduto}-${q.data}`;
      if (!allQuebrasMap.has(qId)) {
        allQuebrasMap.set(qId, q);
      }
    });

    const unified: PacotePrejuizoUnifiedItem[] = [];

    allQuebrasMap.forEach((q) => {
      const qty = Number(q.quantidade) || 0;
      if (qty <= 0) return;

      const hlInfo = getItemHlInfo(q);
      const hlTotal = hlInfo.totalHl || Number(q.hlPerdido) || 0;
      const valorTotal = getItemValorReal(q);

      const dateNorm = normalizeDate(q.data);
      const qAny = q as any;
      const motivo = String(q.motivo || qAny.motivoAvaria || 'Quebra / Avaria Operacional').trim();
      const codMotivo = q.codQuebra || qAny.codigoMotivo;
      const causaRaiz = String(codMotivo ? `Cód ${codMotivo} - ${motivo}` : motivo).trim();

      unified.push({
        id: String(q.id || `qb-${Math.random()}`),
        indicador: 'quebras',
        indicadorNome: 'Quebras Operacionais',
        data: dateNorm.dataFmt,
        mesAno: dateNorm.mesAno,
        codProduto: q.codProduto || 'N/I',
        descricao: q.descricao || 'Produto não especificado',
        quantidade: qty,
        unidadeMedida: q.embalagem || 'UND',
        hlTotal: Math.round(hlTotal * 10000) / 10000,
        valorTotal: Math.round(valorTotal * 100) / 100,
        motivo: motivo,
        causaRaiz: causaRaiz,
        setor: q.area || qAny.setor || 'Armazém Geral',
        responsavel: q.operador || q.colaborador || q.responsavel || qAny.usuario || 'Operação',
        origem: 'plataforma',
        detalhesExtras: {
          turno: q.turno,
          codigoMotivo: codMotivo,
          embalagem: q.embalagem,
          tipoQuebra: qAny.tipoQuebra
        }
      });
    });

    return unified;
  } catch (err) {
    console.error('[PacotePrejuizo] Erro ao carregar quebras da plataforma:', err);
    return [];
  }
}

// 2. CARREGAR SHELF LIFE DIRETO DA BASE DE DADOS (SEM MOCK E SEM MISTURAR COM PNC)
export function getPlatformDespejoForPrejuizo(companyId: string = 'demo'): PacotePrejuizoUnifiedItem[] {
  try {
    const shelfList = getStoredShelfItems(companyId) || [];
    const unified: PacotePrejuizoUnifiedItem[] = [];

    shelfList.forEach((s) => {
      const qty = Number(s.quantidadeUnidades) || 0;
      if (qty <= 0) return;

      const kivDate = normalizeDate(s.data);
      const motivo = String(s.motivoDescricao || 'PRODUTO VENCIDO - ARMAZEM').trim();
      const codMotivo = String(s.codigoMotivo || '533').trim();
      const causaRaizDesc = `Cód ${codMotivo} - ${motivo}`;

      const hl = Number(s.hectolitros) || 0;
      const valor = Number(s.valorTotal) || 0;

      unified.push({
        id: String(s.id || `shelf-${Math.random()}`),
        indicador: 'despejo',
        indicadorNome: 'Shelf Life (Despejo / Vencidos)',
        data: kivDate.dataFmt,
        mesAno: kivDate.mesAno,
        codProduto: s.codigo || 'N/I',
        descricao: s.descricao || 'Produto não especificado',
        quantidade: qty,
        unidadeMedida: 'UND',
        hlTotal: Math.round(hl * 10000) / 10000,
        valorTotal: Math.round(valor * 100) / 100,
        motivo: motivo,
        causaRaiz: causaRaizDesc,
        setor: s.departamento || s.bloco || s.localizacao || 'Centro 533 (Armazém)',
        responsavel: s.executadoPor || 'Ajudante de Armazém',
        origem: 'plataforma',
        detalhesExtras: {
          codigoMotivo: codMotivo,
          precoUnitario: s.precoUnitario,
          lote: s.lote,
          validade: s.validade,
          statusDespejo: s.statusDespejo,
          dataDespejo: s.dataDespejo,
          observacoes: s.observacoes
        }
      });
    });

    return unified;
  } catch (err) {
    console.error('[PacotePrejuizo] Erro ao carregar shelf life da plataforma:', err);
    return [];
  }
}

// 3. TROCAS E REPOSIÇÕES (STORAGE & JSON PARSER)
export function getStoredTrocasReposicoes(companyId: string = 'demo'): TrocaReposicaoItem[] {
  const key = `pacote_prejuizo_trocas_${companyId}`;
  const stored = getCachedLocalStorage<TrocaReposicaoItem[]>(key, []);
  if (!stored || stored.length === 0) {
    return buildOfficialTrocasReposicoesDataset();
  }
  return stored;
}

export function saveTrocasReposicoes(companyId: string = 'demo', items: TrocaReposicaoItem[]): void {
  const key = `pacote_prejuizo_trocas_${companyId}`;
  setCachedLocalStorage(key, items);
  window.dispatchEvent(new CustomEvent('pacote-prejuizo-updated', { detail: { indicador: 'trocas' } }));
}

export function parseTrocasReposicoesJson(jsonContent: string): TrocaReposicaoItem[] {
  const parsed = sanitizeData(JSON.parse(jsonContent));
  const rawList = Array.isArray(parsed) ? parsed : (parsed.itens || parsed.trocas || parsed.data || [parsed]);

  const items: TrocaReposicaoItem[] = [];

  rawList.forEach((row: any, idx: number) => {
    if (!row || typeof row !== 'object') return;

    const cod = row.codProduto ?? row.CodProduto ?? row.codigo ?? row.Codigo ?? row.SKU ?? row.sku ?? row.cod ?? '';
    const desc = row.descricao ?? row.Descricao ?? row.produto ?? row.Produto ?? row.nome ?? 'Item Troca';
    const qty = Number(row.quantidade ?? row.Quantidade ?? row.qtd ?? row.Qtd ?? row.unidades ?? 1);
    
    // Auto-calculate HL & R$ if not provided
    const hlInfo = getItemHlInfo({ codProduto: cod, descricao: desc, quantidade: qty });
    const calculatedHl = Number(row.hlTotal ?? row.hl ?? row.HL ?? hlInfo.totalHl);
    const calculatedValor = Number(row.valorTotal ?? row.valor ?? row.Valor ?? getItemValorReal({ codProduto: cod, descricao: desc, quantidade: qty }));

    const data = row.data ?? row.Data ?? row.DATA ?? row.dataLancamento ?? new Date().toISOString().split('T')[0];
    const motivo = row.motivo ?? row.Motivo ?? row.MOTIVO ?? row.tipoTroca ?? 'Troca / Reposição Comercial';
    const causa = row.causa ?? row.Causa ?? row.CAUSA ?? row.causaRaiz ?? 'Avaria em Trânsito / PDV';

    items.push({
      id: String(row.id ?? `troca-${Date.now()}-${idx}`),
      data: String(data),
      codProduto: cod,
      descricao: String(desc),
      quantidade: qty,
      valorTotal: Math.round(calculatedValor * 100) / 100,
      hlTotal: Math.round(calculatedHl * 10000) / 10000,
      motivo: String(motivo),
      causa: String(causa),
      cliente: row.cliente ?? row.Cliente ?? row.nomeCliente ?? '',
      rota: row.rota ?? row.Rota ?? row.numRota ?? '',
      motorista: row.motorista ?? row.Motorista ?? '',
      conferente: row.conferente ?? row.Conferente ?? '',
      notaFiscal: row.notaFiscal ?? row.NF ?? row.nf ?? '',
      observacao: row.observacao ?? row.obs ?? ''
    });
  });

  return items;
}

// 4. PERDAS POR INVENTÁRIO (STORAGE & JSON PARSER)
export function getStoredInventarioPerdas(companyId: string = 'demo'): InventarioPerdaItem[] {
  const key = `pacote_prejuizo_inventario_${companyId}`;
  const stored = getCachedLocalStorage<InventarioPerdaItem[]>(key, []);
  if (!stored || stored.length === 0) {
    return buildOfficialInventarioDataset();
  }
  return stored;
}

export function saveInventarioPerdas(companyId: string = 'demo', items: InventarioPerdaItem[]): void {
  const key = `pacote_prejuizo_inventario_${companyId}`;
  setCachedLocalStorage(key, items);
  window.dispatchEvent(new CustomEvent('pacote-prejuizo-updated', { detail: { indicador: 'inventario' } }));
}

export function parseInventarioPerdasJson(jsonContent: string): InventarioPerdaItem[] {
  const parsed = sanitizeData(JSON.parse(jsonContent));
  const rawList = Array.isArray(parsed) ? parsed : (parsed.itens || parsed.divergencias || parsed.perdas || parsed.data || [parsed]);

  const items: InventarioPerdaItem[] = [];

  rawList.forEach((row: any, idx: number) => {
    if (!row || typeof row !== 'object') return;

    const cod = row.codProduto ?? row.CodProduto ?? row.codigo ?? row.Codigo ?? row.SKU ?? row.sku ?? '';
    const desc = row.descricao ?? row.Descricao ?? row.produto ?? row.Produto ?? 'Item de Inventário';
    const qty = Math.abs(Number(row.quantidade ?? row.Quantidade ?? row.falta ?? row.qtd ?? row.divergencia ?? 1));

    const hlInfo = getItemHlInfo({ codProduto: cod, descricao: desc, quantidade: qty });
    const calculatedHl = Number(row.hlTotal ?? row.hl ?? row.HL ?? hlInfo.totalHl);
    const calculatedValor = Number(row.valorTotal ?? row.valor ?? row.Valor ?? getItemValorReal({ codProduto: cod, descricao: desc, quantidade: qty }));

    const data = row.data ?? row.Data ?? row.dataInventario ?? new Date().toISOString().split('T')[0];
    const tipo = (row.tipoDivergencia ?? row.tipo ?? 'Falta Física') as any;
    const motivo = row.motivo ?? row.Motivo ?? 'Divergência de Contagem Físico vs Sistêmico';
    const causa = row.causa ?? row.Causa ?? row.causaRaiz ?? 'Erro de Endereçamento / Movimentação sem Baixa';

    items.push({
      id: String(row.id ?? `inv-${Date.now()}-${idx}`),
      data: String(data),
      codProduto: cod,
      descricao: String(desc),
      quantidade: qty,
      tipoDivergencia: tipo,
      motivo: String(motivo),
      causa: String(causa),
      setorEstoque: row.setorEstoque ?? row.setor ?? row.armazem ?? 'Estoque Central',
      ruaPosicao: row.ruaPosicao ?? row.posicao ?? row.endereco ?? '',
      auditor: row.auditor ?? row.Auditor ?? row.conferente ?? '',
      valorTotal: Math.round(calculatedValor * 100) / 100,
      hlTotal: Math.round(calculatedHl * 10000) / 10000,
      observacao: row.observacao ?? row.obs ?? ''
    });
  });

  return items;
}

// 5. REFUGO (STORAGE & JSON PARSER)
export function getStoredRefugoPrejuizo(companyId: string = 'demo'): RefugoPrejuizoItem[] {
  const key = `pacote_prejuizo_refugo_${companyId}`;
  const stored = getCachedLocalStorage<RefugoPrejuizoItem[]>(key, []);
  if (!stored || stored.length === 0) {
    return buildOfficialRefugoDataset();
  }
  // Garantir que refugo de embalagem/ativo não tenha HL atribuído (sempre 0 HL)
  return stored.map(it => ({
    ...it,
    hlTotal: 0
  }));
}

export function saveRefugoPrejuizo(companyId: string = 'demo', items: RefugoPrejuizoItem[]): void {
  const key = `pacote_prejuizo_refugo_${companyId}`;
  const sanitizedItems = items.map(it => ({
    ...it,
    hlTotal: 0
  }));
  setCachedLocalStorage(key, sanitizedItems);
  window.dispatchEvent(new CustomEvent('pacote-prejuizo-updated', { detail: { indicador: 'refugo' } }));
}

export function parseRefugoPrejuizoJson(jsonContent: string): RefugoPrejuizoItem[] {
  const parsed = sanitizeData(JSON.parse(jsonContent));
  const rawList = Array.isArray(parsed) ? parsed : (parsed.itens || parsed.refugos || parsed.ativos || parsed.data || [parsed]);

  const items: RefugoPrejuizoItem[] = [];

  rawList.forEach((row: any, idx: number) => {
    if (!row || typeof row !== 'object') return;

    const desc = row.descricao ?? row.Descricao ?? row.ativo ?? row.Ativo ?? row.produto ?? 'Ativo / Embalagem Descartada';
    const tipoAtivo = row.tipoAtivo ?? row.TipoAtivo ?? row.tipo ?? 'Garrafa Vidro';
    const qty = Number(row.quantidade ?? row.Quantidade ?? row.qtd ?? 1);
    const defeito = row.tipoDefeito ?? row.defeito ?? row.Defeito ?? 'Bocal Danificado / Trinca';
    const motivo = row.motivo ?? row.Motivo ?? 'Refugo de Vasilhame na Triagem';
    const causa = row.causa ?? row.Causa ?? 'Desgaste / Quebra Operacional';

    // Estimativa de custo por ativo de giro
    let valorUnitarioPadrao = 1.20; // Garrafa vidro padrão
    if (String(tipoAtivo).includes('Garrafeira') || String(desc).includes('Garrafeira')) valorUnitarioPadrao = 14.50;
    else if (String(tipoAtivo).includes('Pallet') || String(desc).includes('Pallet')) valorUnitarioPadrao = 48.00;
    else if (String(tipoAtivo).includes('Lata') || String(desc).includes('Lata')) valorUnitarioPadrao = 2.80;

    const valorTotal = Number(row.valorTotal ?? row.valor ?? (qty * valorUnitarioPadrao));
    // Refugo é descarte de vasilhames/embalagens/ativos e não entra no cálculo de hectolitros (0 HL)
    const hlTotal = 0;

    items.push({
      id: String(row.id ?? `refugo-${Date.now()}-${idx}`),
      data: String(row.data ?? row.Data ?? new Date().toISOString().split('T')[0]),
      tipoAtivo: tipoAtivo,
      codProduto: row.codProduto ?? row.codigo ?? '',
      descricao: String(desc),
      quantidade: qty,
      tipoDefeito: String(defeito),
      motivo: String(motivo),
      causa: String(causa),
      linhaTriagem: row.linhaTriagem ?? row.linha ?? 'Linha 01 - Triagem Rota',
      responsavel: row.responsavel ?? row.operador ?? '',
      valorTotal: Math.round(valorTotal * 100) / 100,
      hlTotal: 0,
      observacao: row.observacao ?? row.obs ?? ''
    });
  });

  return items;
}

// 6. VALES (STORAGE & JSON PARSER)
export function getStoredValesPrejuizo(companyId: string = 'demo'): ValePrejuizoItem[] {
  const key = `pacote_prejuizo_vales_${companyId}`;
  const stored = getCachedLocalStorage<ValePrejuizoItem[]>(key, []);
  if (!stored || stored.length === 0) {
    return buildOfficialValesDataset();
  }
  return stored;
}

export function saveValesPrejuizo(companyId: string = 'demo', items: ValePrejuizoItem[]): void {
  const key = `pacote_prejuizo_vales_${companyId}`;
  setCachedLocalStorage(key, items);
  window.dispatchEvent(new CustomEvent('pacote-prejuizo-updated', { detail: { indicador: 'vales' } }));
}

export function parseValesPrejuizoJson(jsonContent: string): ValePrejuizoItem[] {
  const parsed = sanitizeData(JSON.parse(jsonContent));
  const rawList = Array.isArray(parsed) ? parsed : (parsed.itens || parsed.vales || parsed.data || [parsed]);

  const items: ValePrejuizoItem[] = [];

  rawList.forEach((row: any, idx: number) => {
    if (!row || typeof row !== 'object') return;

    const colaborador = row.colaborador ?? row.Colaborador ?? row.nome ?? row.motorista ?? 'Colaborador';
    const valor = Number(row.valorTotal ?? row.valor ?? row.Valor ?? row.valorVale ?? 0);
    const motivo = row.motivo ?? row.Motivo ?? row.motivoVale ?? 'Falta de Vasilhame em Rota';
    const causa = row.causa ?? row.Causa ?? 'Divergência na Prestação de Contas';
    const status = row.status ?? row.Status ?? 'Aberto';
    const desc = row.descricao ?? row.produto ?? 'Vasilhames / Produtos em Falta';
    const qty = Number(row.quantidade ?? row.qtd ?? 1);

    const hlTotal = Number(row.hlTotal ?? row.hl ?? (qty * 0.0035));

    items.push({
      id: String(row.id ?? `vale-${Date.now()}-${idx}`),
      data: String(row.data ?? row.Data ?? new Date().toISOString().split('T')[0]),
      colaborador: String(colaborador),
      funcao: row.funcao ?? row.cargo ?? 'Motorista / Entregador',
      motivo: String(motivo),
      causa: String(causa),
      status: status,
      codProduto: row.codProduto ?? '',
      descricao: String(desc),
      quantidade: qty,
      valorTotal: Math.round(valor * 100) / 100,
      hlTotal: Math.round(hlTotal * 10000) / 10000,
      numeroVale: row.numeroVale ?? row.numVale ?? `VALE-${idx + 1001}`,
      placa: row.placa ?? row.veiculo ?? '',
      observacao: row.observacao ?? row.obs ?? ''
    });
  });

  return items;
}

// 7. UNIFICADOR COMPLETO DE TODOS OS PREJUÍZOS DO PACOTE
export function getUnifiedPacotePrejuizo(companyId: string = 'demo'): {
  items: PacotePrejuizoUnifiedItem[];
  totalReais: number;
  totalHl: number;
  totalUnidades: number;
  totaisPorIndicador: Record<PacotePrejuizoIndicador, { reais: number; hl: number; unidades: number; count: number; nome: string }>;
  rankingProdutos: { cod: string | number; descricao: string; reais: number; hl: number; unidades: number; ocorrencias: number }[];
  rankingCausas: { causa: string; reais: number; hl: number; ocorrencias: number }[];
  evolucaoMensal: { mesAno: string; reais: number; hl: number; quebras: number; despejo: number; trocas: number; inventario: number; refugo: number; vales: number }[];
} {
  const unified: PacotePrejuizoUnifiedItem[] = [];

  // A. Quebras (Plataforma - Real)
  const quebrasList = getPlatformQuebrasForPrejuizo(companyId);
  unified.push(...quebrasList);

  // B. Shelf Life / Despejo (Plataforma - Real)
  const despejoList = getPlatformDespejoForPrejuizo(companyId);
  unified.push(...despejoList);

  // C. Trocas & Reposições (JSON / Local)
  const trocasList = getStoredTrocasReposicoes(companyId);
  trocasList.forEach((t) => {
    const dNorm = normalizeDate(t.data);
    unified.push({
      id: t.id,
      indicador: 'trocas',
      indicadorNome: 'Trocas & Reposições',
      data: dNorm.dataFmt,
      mesAno: dNorm.mesAno,
      codProduto: t.codProduto || 'N/I',
      descricao: t.descricao || 'Item Troca / Reposição',
      quantidade: t.quantidade || 0,
      hlTotal: t.hlTotal || 0,
      valorTotal: t.valorTotal || 0,
      motivo: t.motivo || 'Troca de Produto',
      causaRaiz: t.causa || 'Avaria em Trânsito / Cliente',
      setor: 'Logística de Distribuição / Rotas',
      responsavel: t.motorista || t.cliente || 'Rota',
      documentoRef: t.notaFiscal,
      origem: 'json_importado',
      detalhesExtras: {
        cliente: t.cliente,
        rota: t.rota,
        conferente: t.conferente
      }
    });
  });

  // D. Perdas por Inventário (JSON / Local)
  const inventarioList = getStoredInventarioPerdas(companyId);
  inventarioList.forEach((inv) => {
    const dNorm = normalizeDate(inv.data);
    unified.push({
      id: inv.id,
      indicador: 'inventario',
      indicadorNome: 'Perdas por Inventário',
      data: dNorm.dataFmt,
      mesAno: dNorm.mesAno,
      codProduto: inv.codProduto || 'N/I',
      descricao: inv.descricao || 'Item Inventário',
      quantidade: inv.quantidade || 0,
      hlTotal: inv.hlTotal || 0,
      valorTotal: inv.valorTotal || 0,
      motivo: inv.motivo || 'Divergência de Contagem',
      causaRaiz: inv.causa || 'Falta Física / Inversão de Lote',
      setor: inv.setorEstoque || 'Estoque Central',
      responsavel: inv.auditor || 'Auditoria de Estoque',
      origem: 'json_importado',
      detalhesExtras: {
        tipoDivergencia: inv.tipoDivergencia,
        ruaPosicao: inv.ruaPosicao
      }
    });
  });

  // E. Refugo (JSON / Local)
  const refugoList = getStoredRefugoPrejuizo(companyId);
  refugoList.forEach((ref) => {
    const dNorm = normalizeDate(ref.data);
    unified.push({
      id: ref.id,
      indicador: 'refugo',
      indicadorNome: 'Refugo de Vasilhame & Ativos',
      data: dNorm.dataFmt,
      mesAno: dNorm.mesAno,
      codProduto: ref.codProduto || ref.tipoAtivo || 'ATIVO',
      descricao: ref.descricao || ref.tipoAtivo || 'Refugo',
      quantidade: ref.quantidade || 0,
      hlTotal: 0, // Refugo não entra no cálculo de hectolitros (apenas valor financeiro R$ de ativo/embalagem)
      valorTotal: ref.valorTotal || 0,
      motivo: ref.motivo || 'Refugo de Embalagem / Ativo',
      causaRaiz: ref.causa || `${ref.tipoAtivo} - ${ref.tipoDefeito}`,
      setor: 'Triagem de Vasilhames & Pátio',
      responsavel: ref.responsavel || 'Operador de Triagem',
      origem: 'json_importado',
      detalhesExtras: {
        tipoAtivo: ref.tipoAtivo,
        tipoDefeito: ref.tipoDefeito,
        linhaTriagem: ref.linhaTriagem
      }
    });
  });

  // F. Vales (JSON / Local)
  const valesList = getStoredValesPrejuizo(companyId);
  valesList.forEach((v) => {
    const dNorm = normalizeDate(v.data);
    unified.push({
      id: v.id,
      indicador: 'vales',
      indicadorNome: 'Vales & Imputação de Perdas',
      data: dNorm.dataFmt,
      mesAno: dNorm.mesAno,
      codProduto: v.codProduto || 'VALE',
      descricao: v.descricao || `Vale: ${v.colaborador} (${v.motivo})`,
      quantidade: v.quantidade || 1,
      hlTotal: v.hlTotal || 0,
      valorTotal: v.valorTotal || 0,
      motivo: v.motivo || 'Emissão de Vale por Falta/Avaria',
      causaRaiz: v.causa || 'Divergência de Prestação / Avaria Não Justificada',
      setor: 'Administrativo & Acerto de Rota',
      responsavel: v.colaborador,
      documentoRef: v.numeroVale,
      origem: 'json_importado',
      detalhesExtras: {
        funcao: v.funcao,
        status: v.status,
        placa: v.placa
      }
    });
  });

  // Totais e agregações
  let totalReais = 0;
  let totalHl = 0;
  let totalUnidades = 0;

  const totaisPorIndicador: Record<PacotePrejuizoIndicador, { reais: number; hl: number; unidades: number; count: number; nome: string }> = {
    quebras: { reais: 0, hl: 0, unidades: 0, count: 0, nome: 'Quebras Operacionais' },
    despejo: { reais: 0, hl: 0, unidades: 0, count: 0, nome: 'Shelf Life (Despejo / Vencidos)' },
    trocas: { reais: 0, hl: 0, unidades: 0, count: 0, nome: 'Trocas & Reposições' },
    inventario: { reais: 0, hl: 0, unidades: 0, count: 0, nome: 'Perdas por Inventário' },
    refugo: { reais: 0, hl: 0, unidades: 0, count: 0, nome: 'Refugo de Vasilhame & Ativos' },
    vales: { reais: 0, hl: 0, unidades: 0, count: 0, nome: 'Vales Emitidos' }
  };

  const produtosMap = new Map<string, { cod: string | number; descricao: string; reais: number; hl: number; unidades: number; ocorrencias: number }>();
  const causasMap = new Map<string, { causa: string; reais: number; hl: number; ocorrencias: number }>();
  const mesesMap = new Map<string, { mesAno: string; reais: number; hl: number; quebras: number; despejo: number; trocas: number; inventario: number; refugo: number; vales: number }>();

  unified.forEach((item) => {
    const r = item.valorTotal || 0;
    const h = item.hlTotal || 0;
    const u = item.quantidade || 0;

    totalReais += r;
    totalHl += h;
    totalUnidades += u;

    // Indicador
    if (totaisPorIndicador[item.indicador]) {
      totaisPorIndicador[item.indicador].reais += r;
      totaisPorIndicador[item.indicador].hl += h;
      totaisPorIndicador[item.indicador].unidades += u;
      totaisPorIndicador[item.indicador].count += 1;
    }

    // Produtos
    const prodKey = `${item.codProduto}_${item.descricao}`.toUpperCase();
    if (!produtosMap.has(prodKey)) {
      produtosMap.set(prodKey, {
        cod: item.codProduto,
        descricao: item.descricao,
        reais: 0,
        hl: 0,
        unidades: 0,
        ocorrencias: 0
      });
    }
    const pEntry = produtosMap.get(prodKey)!;
    pEntry.reais += r;
    pEntry.hl += h;
    pEntry.unidades += u;
    pEntry.ocorrencias += 1;

    // Causas
    const causaKey = (item.causaRaiz || item.motivo || 'Outros').trim();
    if (!causasMap.has(causaKey)) {
      causasMap.set(causaKey, { causa: causaKey, reais: 0, hl: 0, ocorrencias: 0 });
    }
    const cEntry = causasMap.get(causaKey)!;
    cEntry.reais += r;
    cEntry.hl += h;
    cEntry.ocorrencias += 1;

    // Meses
    const mesKey = item.mesAno || '08/2026';
    if (!mesesMap.has(mesKey)) {
      mesesMap.set(mesKey, {
        mesAno: mesKey,
        reais: 0,
        hl: 0,
        quebras: 0,
        despejo: 0,
        trocas: 0,
        inventario: 0,
        refugo: 0,
        vales: 0
      });
    }
    const mEntry = mesesMap.get(mesKey)!;
    mEntry.reais += r;
    mEntry.hl += h;
    mEntry[item.indicador] += r;
  });

  const rankingProdutos = Array.from(produtosMap.values())
    .sort((a, b) => b.reais - a.reais)
    .slice(0, 15);

  const rankingCausas = Array.from(causasMap.values())
    .sort((a, b) => b.reais - a.reais)
    .slice(0, 12);

  const evolucaoMensal = Array.from(mesesMap.values())
    .sort((a, b) => {
      const [mA, yA] = a.mesAno.split('/').map(Number);
      const [mB, yB] = b.mesAno.split('/').map(Number);
      if (yA !== yB) return (yA || 0) - (yB || 0);
      return (mA || 0) - (mB || 0);
    });

  return {
    items: unified,
    totalReais: Math.round(totalReais * 100) / 100,
    totalHl: Math.round(totalHl * 10000) / 10000,
    totalUnidades,
    totaisPorIndicador,
    rankingProdutos,
    rankingCausas,
    evolucaoMensal
  };
}

// TEMPLATES DE EXEMPLO PARA DOWNLOAD
export function getTrocasReposicoesSampleJson(): string {
  return JSON.stringify([
    {
      "data": "2026-08-25",
      "codProduto": 2045,
      "descricao": "BRAHMA DUPLO MALTE 350ML LT",
      "quantidade": 24,
      "valorTotal": 84.00,
      "hlTotal": 0.084,
      "motivo": "Lata Amassada / Vazamento no Trânsito",
      "causa": "Trecho esburacado na rota de distribuição",
      "cliente": "Supermercado Central 01",
      "rota": "ROTA-04",
      "motorista": "Carlos Andrade",
      "conferente": "Lucas Silva",
      "notaFiscal": "NF-84920"
    },
    {
      "data": "2026-08-26",
      "codProduto": 3102,
      "descricao": "STELLA ARTOIS 330ML LN",
      "quantidade": 12,
      "valorTotal": 66.00,
      "hlTotal": 0.0396,
      "motivo": "Garrafa Quebrada no Pátio do Cliente",
      "causa": "Descarregamento manual em piso irregular",
      "cliente": "Restaurante Beira Mar",
      "rota": "ROTA-08",
      "motorista": "Roberto Lima",
      "conferente": "Lucas Silva",
      "notaFiscal": "NF-84955"
    }
  ], null, 2);
}

export function getInventarioPerdasSampleJson(): string {
  return JSON.stringify([
    {
      "data": "2026-08-28",
      "codProduto": 1055,
      "descricao": "SKOL 350ML LT",
      "quantidade": 48,
      "tipoDivergencia": "Falta Física",
      "motivo": "Divergência de Contagem Cíclica",
      "causa": "Inversão de Lote / Bipagem incorreta no Picking",
      "setorEstoque": "Picking Central",
      "ruaPosicao": "RUA 03 - NIVEL 01",
      "auditor": "Marcos Vinicius",
      "valorTotal": 144.00,
      "hlTotal": 0.168
    },
    {
      "data": "2026-08-29",
      "codProduto": 4010,
      "descricao": "CORONA EXTRA 330ML LN",
      "quantidade": 18,
      "tipoDivergencia": "Avaria Oculta",
      "motivo": "Caixa com garrafas trincadas no fundo do pallet",
      "causa": "Pressão excessiva de empilhamento",
      "setorEstoque": "Estoque Central Blocado",
      "ruaPosicao": "RUA 07 - BLOCO B",
      "auditor": "Marcos Vinicius",
      "valorTotal": 126.00,
      "hlTotal": 0.0594
    }
  ], null, 2);
}

export function getRefugoSampleJson(): string {
  return JSON.stringify([
    {
      "data": "2026-08-27",
      "tipoAtivo": "Garrafa Vidro",
      "descricao": "GARRAFA 600ML AMBAR RETORNÁVEL",
      "quantidade": 180,
      "tipoDefeito": "Bocal Lascado / Trinca no Gargalo",
      "motivo": "Refugo de Triagem de Retorno de Rota",
      "causa": "Fadiga de ciclo de uso no mercado",
      "linhaTriagem": "Linha 01 - Triagem Rota",
      "responsavel": "Equipe de Triagem 1º Turno",
      "valorTotal": 216.00,
      "hlTotal": 0
    },
    {
      "data": "2026-08-28",
      "tipoAtivo": "Garrafeira Plástica",
      "descricao": "CAIXA PLÁSTICA 24x600ML VERMELHA",
      "quantidade": 12,
      "tipoDefeito": "Alça Quebrada / Fundo Rompido",
      "motivo": "Refugo de Caixa Plástica Inutilizada",
      "causa": "Impacto mecânico na descarga de carretas",
      "linhaTriagem": "Pátio de Vasilhames",
      "responsavel": "Equipe de Pátio",
      "valorTotal": 174.00,
      "hlTotal": 0
    }
  ], null, 2);
}

export function getValesSampleJson(): string {
  return JSON.stringify([
    {
      "data": "2026-08-26",
      "colaborador": "João Pedro Santos",
      "funcao": "Motorista de Distribuição",
      "numeroVale": "VALE-2026-041",
      "motivo": "Falta de 2 Caixas de Vasilhames 600ml em Rota",
      "causa": "Não conferência na entrega do cliente",
      "status": "Em Cobrança",
      "placa": "QFB-9402",
      "quantidade": 48,
      "descricao": "VASILHAME 600ML RETORNÁVEL",
      "valorTotal": 57.60,
      "hlTotal": 0.288
    },
    {
      "data": "2026-08-27",
      "colaborador": "Fernando Albuquerque",
      "funcao": "Operador de Empilhadeira",
      "numeroVale": "VALE-2026-042",
      "motivo": "Tombamento de Pallet por Manobra Indevida",
      "causa": "Velocidade acima do padrão no cruzamento da Rua 4",
      "status": "Aberto",
      "quantidade": 15,
      "descricao": "SPATEN 350ML LT",
      "valorTotal": 52.50,
      "hlTotal": 0.0525
    }
  ], null, 2);
}
