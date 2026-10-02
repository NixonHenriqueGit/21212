import coletaJaneiroData from '../data/coletaJaneiro2026.json';
import validadesRecolhidasSemana3Data from '../data/validadesRecolhidasSemana3.json';
import validadesRecolhidasSemana4Data from '../data/validadesRecolhidasSemana4.json';
import { calculateStockAgeIndex } from './calculateStockAgeIndex';
import { getConsolidated030519Map, Item030519Data } from './vendaMedia030519';
import { PRODUCT_MASTER_DATA } from '../data/productMasterData';
import { calcularTotalCaixas } from '../data/coletaPackagingData';
import { ValidadeRow } from '../types';
import { syncPncFromAllYearlyColetas } from './pncManager';

export interface ColetaItemRaw {
  dataColeta: string;
  codigo: string | number;
  descricao: string;
  qtdeCaixas: number;
  dataVencimento: string;
  validadeDias?: string | number;
  fabricacao?: string;
  curva?: string | null;
  blocoPrincipal?: string | null;
  subBloco?: string | null;
  destino?: string;
  pallettesFechados?: number;
  sobraCaixas?: number | string;
  caixasNoBloco?: number | string;
  vaiParaPicking?: boolean | string;
  caixasNoPicking?: number | string;
}

export interface WeeklyStockAgeSummary {
  semanaNumero: number; // 1, 2, 3, 4
  semanaKey: 'sem-1' | 'sem-2' | 'sem-3' | 'sem-4';
  nome: string; // 'Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'
  periodoDias: string; // '01 a 07', '08 a 14', '15 a 21', '22 a 31'
  periodoFormatado: string; // Ex: '01 a 07 de Janeiro'
  datasDistintas: string[]; // ['05/01/2026', ...]
  totalLotes: number; // contagem de itens/lotes recolhidos de acordo com a data do arquivo JSON
  totalCaixas: number;
  totalHecto: number;
  totalValor: number;
  avgStockAge: number; // Stock Age Index independente daquela semana (%)
  criticosCount: number;
  criticosPct: number;
  atencaoCount: number;
  atencaoPct: number;
  okCount: number;
  okPct: number;
  hasData: boolean;
  items: StockAgeProcessedItem[];
}

export interface StockAgeProcessedItem {
  id: string;
  dataColeta: string;
  semanaNumero: number; // 1, 2, 3, 4
  semanaNome: string; // "Semana 1", "Semana 2", ...
  mes: string; // "JAN", "FEV", ..., "DEZ"
  ano: number;
  codigo: string;
  descricao: string;
  quantidade: number;
  dataVencimento: string; // YYYY-MM-DD
  fabricacao?: string;
  vidaUtilTotal: number;
  diasRestantes: number;
  stockAgeIndex: number; // % (0-100)
  status: 'Crítico' | 'Atenção' | 'OK';
  statusLabel: string;
  blocoPrincipal: string;
  rua: string; // Sub-bloco (A1, A2, B1, C1, etc.)
  destino?: string;
  pallettesFechados: number;
  sobraCaixas: number;
  caixasNoBloco: number;
  vaiParaPicking: boolean;
  caixasNoPicking: number;
  
  // 03.05.19 Venda Média & Dias em Estoque
  vendaMediaDiaria: number;
  has030519: boolean;
  curvaAbc: 'A' | 'B' | 'C';
  diasEmEstoque: number; // Dias de Cobertura
  riscoSobra: boolean;
  sobraEstimadaCx: number;
  
  // Valorações
  fatorHecto: number;
  volumeHecto: number; // Hectolitros
  precoUnitario: number;
  valorEstimado: number; // Reais (R$)
  valorEmRisco: number;
  volumeHectoEmRisco: number;
}

export interface RuaShelfRiskSummary {
  rua: string; // Ex: A1, A2, B1, C1, Picking
  bloco: string; // A, B, C, etc.
  totalLotes: number;
  totalCaixas: number;
  totalHecto: number;
  totalValor: number;
  validadeMediaDias: number;
  stockAgeIndexMedio: number;
  criticosCount: number;
  criticosPct: number;
  atencaoCount: number;
  atencaoPct: number;
  okCount: number;
  okPct: number;
  caixasEmRisco: number;
  hectoEmRisco: number;
  valorEmRisco: number;
  caixasNoPicking: number;
  caixasNoBloco: number;
  shelfRiskScore: number; // 0 - 100
  nivelRisco: 'BAIXO' | 'MÉDIO' | 'ALTO' | 'CRÍTICO';
}

export interface CurvaAbcSummary {
  curva: 'A' | 'B' | 'C';
  totalSkus: number;
  totalLotes: number;
  totalCaixas: number;
  totalHecto: number;
  totalValor: number;
  stockAgeIndexMedio: number;
  criticosCount: number;
  criticosCaixas: number;
  criticosHecto: number;
  criticosValor: number;
  criticosPct: number;
}

export const MONTH_KEYS = [
  { key: '01', name: 'Janeiro', short: 'JAN' },
  { key: '02', name: 'Fevereiro', short: 'FEV' },
  { key: '03', name: 'Março', short: 'MAR' },
  { key: '04', name: 'Abril', short: 'ABR' },
  { key: '05', name: 'Maio', short: 'MAI' },
  { key: '06', name: 'Junho', short: 'JUN' },
  { key: '07', name: 'Julho', short: 'JUL' },
  { key: '08', name: 'Agosto', short: 'AGO' },
  { key: '09', name: 'Setembro', short: 'SET' },
  { key: '10', name: 'Outubro', short: 'OUT' },
  { key: '11', name: 'Novembro', short: 'NOV' },
  { key: '12', name: 'Dezembro', short: 'DEZ' },
];

export const STORAGE_KEY_MONTHLY_COLETAS = 'af_stock_age_monthly_coletas_2026_v4';

export const AUGUST_WEEK4_DEFAULT_ITEMS: ColetaItemRaw[] = (validadesRecolhidasSemana4Data as any[]).map(v => 
  convertValidadeRowToColetaRaw(v, '28/08/2026')
);

export const AUGUST_WEEK3_DEFAULT_ITEMS: ColetaItemRaw[] = (validadesRecolhidasSemana3Data as any[]).map(v => 
  convertValidadeRowToColetaRaw(v, '21/08/2026')
);

export const AUGUST_BASELINE_ALL_WEEKS: ColetaItemRaw[] = [
  // Semana 1: 07/08/2026
  {
    dataColeta: '07/08/2026',
    codigo: '9068',
    descricao: 'SKOL LATA 350ML SH C/12 NPAL',
    qtdeCaixas: 1450,
    dataVencimento: '15/11/2026',
    validadeDias: '180',
    curva: 'A',
    blocoPrincipal: 'A',
    subBloco: 'A1',
    destino: 'Bloco A',
    pallettesFechados: 5,
    sobraCaixas: 0,
    caixasNoBloco: 1450,
    vaiParaPicking: false,
    caixasNoPicking: 0
  },
  {
    dataColeta: '07/08/2026',
    codigo: '9069',
    descricao: 'BRAHMA CHOPP LATA 350ML SH C/12 NPAL',
    qtdeCaixas: 1120,
    dataVencimento: '20/11/2026',
    validadeDias: '180',
    curva: 'A',
    blocoPrincipal: 'A',
    subBloco: 'A2',
    destino: 'Bloco A',
    pallettesFechados: 4,
    sobraCaixas: 0,
    caixasNoBloco: 1120,
    vaiParaPicking: false,
    caixasNoPicking: 0
  },
  {
    dataColeta: '07/08/2026',
    codigo: '18807',
    descricao: 'STELLA ARTOIS LONG NECK 330ML SIX-PACK SHRINK',
    qtdeCaixas: 302,
    dataVencimento: '28/11/2026',
    validadeDias: '180',
    curva: 'B',
    blocoPrincipal: 'B',
    subBloco: 'B2',
    destino: 'Bloco B',
    pallettesFechados: 3,
    sobraCaixas: 50,
    caixasNoBloco: 302,
    vaiParaPicking: false,
    caixasNoPicking: 0
  },
  {
    dataColeta: '07/08/2026',
    codigo: '7945',
    descricao: 'PEPSI COLA PET 2L CAIXA C/6',
    qtdeCaixas: 450,
    dataVencimento: '10/10/2026',
    validadeDias: '180',
    curva: 'B',
    blocoPrincipal: 'B',
    subBloco: 'B1',
    destino: 'Bloco B',
    pallettesFechados: 3,
    sobraCaixas: 0,
    caixasNoBloco: 450,
    vaiParaPicking: false,
    caixasNoPicking: 0
  },
  // Semana 2: 14/08/2026
  {
    dataColeta: '14/08/2026',
    codigo: '9068',
    descricao: 'SKOL LATA 350ML SH C/12 NPAL',
    qtdeCaixas: 2100,
    dataVencimento: '22/11/2026',
    validadeDias: '180',
    curva: 'A',
    blocoPrincipal: 'A',
    subBloco: 'A1',
    destino: 'Bloco A',
    pallettesFechados: 7,
    sobraCaixas: 0,
    caixasNoBloco: 2100,
    vaiParaPicking: false,
    caixasNoPicking: 0
  },
  {
    dataColeta: '14/08/2026',
    codigo: '9083',
    descricao: 'SKOL LT 473ML SH C/12 NPAL',
    qtdeCaixas: 880,
    dataVencimento: '18/11/2026',
    validadeDias: '180',
    curva: 'A',
    blocoPrincipal: 'A',
    subBloco: 'A3',
    destino: 'Bloco A',
    pallettesFechados: 4,
    sobraCaixas: 0,
    caixasNoBloco: 880,
    vaiParaPicking: false,
    caixasNoPicking: 0
  },
  {
    dataColeta: '14/08/2026',
    codigo: '19321',
    descricao: 'GUARANA ANTARCTICA PET 2L C/6',
    qtdeCaixas: 620,
    dataVencimento: '05/11/2026',
    validadeDias: '180',
    curva: 'A',
    blocoPrincipal: 'B',
    subBloco: 'B1',
    destino: 'Bloco B',
    pallettesFechados: 4,
    sobraCaixas: 20,
    caixasNoBloco: 620,
    vaiParaPicking: false,
    caixasNoPicking: 0
  },
  // Semana 3: 21/08/2026
  ...AUGUST_WEEK3_DEFAULT_ITEMS
];

/**
 * Adiciona N meses a uma data no formato brasileiro DD/MM/YYYY
 */
export function addMonthsToBrDate(dateStr: string, monthsToAdd: number): string {
  if (!dateStr || monthsToAdd === 0) return dateStr;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return dateStr;
  const d = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const y = parseInt(parts[2], 10);
  if (isNaN(d) || isNaN(m) || isNaN(y)) return dateStr;

  const target = new Date(y, m + monthsToAdd, Math.min(d, 28));
  const resDay = String(Math.min(d, 28)).padStart(2, '0');
  const resMonth = String(target.getMonth() + 1).padStart(2, '0');
  const resYear = target.getFullYear();
  return `${resDay}/${resMonth}/${resYear}`;
}

/**
 * Normaliza qualquer formato de data (DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY, Excel serial, ISO, Date) para DD/MM/YYYY
 */
export function formatAnyDateToBr(dateVal: any, defaultMonthKey: string = '08'): string {
  if (!dateVal) return `15/${defaultMonthKey.padStart(2, '0')}/2026`;

  // Se for número de série do Excel (ex: 46158)
  if (typeof dateVal === 'number' && dateVal > 20000 && dateVal < 60000) {
    const excelEpoch = new Date(1899, 11, 30);
    const d = new Date(excelEpoch.getTime() + dateVal * 86400000);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
  }

  // Se for objeto Date
  if (dateVal instanceof Date && !isNaN(dateVal.getTime())) {
    const day = String(dateVal.getDate()).padStart(2, '0');
    const month = String(dateVal.getMonth() + 1).padStart(2, '0');
    const year = dateVal.getFullYear();
    return `${day}/${month}/${year}`;
  }

  const str = String(dateVal).trim();
  if (!str) return `15/${defaultMonthKey.padStart(2, '0')}/2026`;

  // Remove timestamp T00:00:00 se presente
  const clean = str.split('T')[0].trim();

  if (clean.includes('/')) {
    const parts = clean.split('/');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY/MM/DD
        const year = parts[0];
        const month = parts[1].padStart(2, '0');
        const day = parts[2].padStart(2, '0');
        return `${day}/${month}/${year}`;
      } else {
        // DD/MM/YYYY ou MM/DD/YYYY
        const p0 = parseInt(parts[0], 10);
        const p1 = parseInt(parts[1], 10);
        const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
        if (p0 > 12 && p1 <= 12) {
          // DD/MM/YYYY
          return `${String(p0).padStart(2, '0')}/${String(p1).padStart(2, '0')}/${year}`;
        } else if (p1 > 12 && p0 <= 12) {
          // MM/DD/YYYY
          return `${String(p1).padStart(2, '0')}/${String(p0).padStart(2, '0')}/${year}`;
        } else {
          return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${year}`;
        }
      }
    }
  }

  if (clean.includes('-')) {
    const parts = clean.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        const year = parts[0];
        const month = parts[1].padStart(2, '0');
        const day = parts[2].padStart(2, '0');
        return `${day}/${month}/${year}`;
      } else {
        // DD-MM-YYYY
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
        return `${day}/${month}/${year}`;
      }
    }
  }

  if (clean.includes('.')) {
    const parts = clean.split('.');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
      return `${day}/${month}/${year}`;
    }
  }

  return clean;
}

/**
 * Converte data em qualquer formato para YYYY-MM-DD ISO válido
 */
export function parseBrDateToISO(dateStr: string): string {
  if (!dateStr) return '';
  const br = formatAnyDateToBr(dateStr);
  const parts = br.split('/');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
    return `${year}-${month}-${day}`;
  }
  return dateStr;
}

/**
 * Normaliza uma lista crua de itens de coleta de qualquer origem (JSON, Excel, CSV)
 */
export function normalizeColetaRawList(list: any[], defaultMonthKey: string = '08'): ColetaItemRaw[] {
  if (!Array.isArray(list)) return [];

  return list.map(row => {
    // Normalizar Código
    const rawCod = row.codigo ?? row.cod ?? row['Código'] ?? row['Codigo'] ?? row.SKU ?? row.sku ?? row.material ?? row['Material'] ?? row.item ?? row['Item'] ?? row.id ?? row.produtoCodigo ?? row.cod_material ?? row.cd_produto ?? '';
    const codigo = String(rawCod).trim();

    // Normalizar Descrição
    const rawDesc = row.descricao ?? row.desc ?? row.produto ?? row['Produto'] ?? row['Descrição'] ?? row['Descricao'] ?? row['Nome'] ?? row.nome ?? row.texto_breve ?? row.material_desc ?? row.ds_produto ?? '';
    const descricao = String(rawDesc).trim();

    // Normalizar Quantidade de Caixas
    const rawQty = row.qtdeCaixas ?? row.quantidade ?? row['Qtde Caixas'] ?? row.qtd ?? row.caixas ?? row['Caixas'] ?? row.SALDO ?? row.saldo ?? row['Saldo'] ?? row.totalCaixas ?? row.qtde ?? row.volumeCx ?? row.qtdCaixas ?? row.quantidadeCaixas ?? row.saldo_caixas ?? 0;
    let qtdeCaixas = typeof rawQty === 'number' ? rawQty : parseFloat(String(rawQty).replace(/\./g, '').replace(',', '.')) || 0;

    // Se houver paletes fechados e lastro/caixa, calcular total se qtdeCaixas for 0
    if (qtdeCaixas === 0 && (row.pallettesFechados || row.palhete || row.pallets)) {
      const pal = Number(row.pallettesFechados || row.palhete || row.pallets || 0);
      const cx = Number(row.sobraCaixas || row.caixa || 0);
      qtdeCaixas = calcularTotalCaixas(codigo, pal, 0, cx);
    }

    // Normalizar Data de Coleta
    const rawDataColeta = row.dataColeta ?? row.data ?? row['Data'] ?? row['Data Coleta'] ?? row.DataColeta ?? row.data_coleta ?? row.DATA_COLETA ?? row.dtColeta ?? row.dt_coleta ?? row.coletaData ?? row.data_inventario ?? row.data_contagem ?? row.dataContagem ?? row.data_auditoria;
    const dataColeta = formatAnyDateToBr(rawDataColeta, defaultMonthKey);

    // Normalizar Data de Vencimento
    const rawVenc = row.dataVencimento ?? row.vencimento ?? row['Data Vencimento'] ?? row['Validade'] ?? row.validade ?? row.dataValidade ?? row.data_validade ?? row.data_vencimento ?? row.VENCIMENTO ?? row.VALIDADE ?? row.dtVencimento ?? row.dt_vencimento ?? row.dtValidade ?? row.dt_validade ?? row.validade_lote ?? row.dt_validade_lote;
    const dataVencimento = rawVenc ? formatAnyDateToBr(rawVenc, defaultMonthKey) : '';

    // Normalizar Vida Útil / Validade em Dias
    const rawVidaUtil = row.validadeDias ?? row.vidaUtilTotal ?? row['Validade Dias'] ?? row['Vida Útil'] ?? row.vida_util ?? row.vidaUtil ?? row.shelfLife ?? row.diasVidaUtil ?? row.idade ?? row.idadeCadastrada ?? 180;
    const validadeDias = Number(rawVidaUtil) || 180;

    // Normalizar Fabricação
    const rawFab = row.fabricacao ?? row['Fabricação'] ?? row['Data Fabricação'] ?? row.dataFabricacao ?? row.data_fabricacao;
    const fabricacao = rawFab ? formatAnyDateToBr(rawFab, defaultMonthKey) : '';

    // Normalizar Curva ABC
    const rawCurva = String(row.curva ?? row.curvaAbc ?? row['Curva'] ?? row.curva_abc ?? '').trim().toUpperCase();
    const curva = (rawCurva === 'A' || rawCurva === 'B' || rawCurva === 'C') ? rawCurva : 'B';

    // Normalizar Bloco e Rua
    const rawBloco = String(row.blocoPrincipal ?? row.bloco ?? row['Bloco'] ?? 'A').trim().toUpperCase();
    const rawRua = String(row.subBloco ?? row.rua ?? row['Rua'] ?? row['SubBloco'] ?? row.localizacao ?? `${rawBloco}1`).trim().toUpperCase();
    const blocoPrincipal = rawBloco && rawBloco !== 'NULL' ? rawBloco.charAt(0) : 'A';
    const subBloco = rawRua && rawRua !== 'NULL' ? rawRua : `${blocoPrincipal}1`;

    const destino = row.destino || (row.localizacao === 'pnc' ? 'PNC' : row.localizacao === 'picking' ? 'Área Picking' : `Bloco ${blocoPrincipal}`);
    const pallettesFechados = Number(row.pallettesFechados || row.palhete || 0);
    const sobraCaixas = Number(row.sobraCaixas || row.caixa || 0);
    const caixasNoBloco = Number(row.caixasNoBloco || (row.localizacao === 'central' ? qtdeCaixas : 0));
    const vaiParaPicking = Boolean(row.vaiParaPicking === true || String(row.vaiParaPicking).toLowerCase() === 'true' || row.localizacao === 'picking');
    const caixasNoPicking = Number(row.caixasNoPicking || (vaiParaPicking ? qtdeCaixas : 0));

    return {
      dataColeta,
      codigo,
      descricao,
      qtdeCaixas,
      dataVencimento,
      validadeDias,
      fabricacao,
      curva,
      blocoPrincipal,
      subBloco,
      destino,
      pallettesFechados,
      sobraCaixas,
      caixasNoBloco,
      vaiParaPicking,
      caixasNoPicking
    };
  }).filter(it => it.codigo && it.qtdeCaixas > 0);
}

/**
 * Determina a semana do mês (1 a 4) com base no dia da data da coleta do JSON
 * Semana 1: Dias 01 a 07
 * Semana 2: Dias 08 a 14
 * Semana 3: Dias 15 a 21
 * Semana 4: Dias 22 ao final do mês
 */
/**
 * Determina a semana do mês (1 a 4) com base no dia da data da coleta do JSON ou formulário
 * Semana 1: Dias 01 a 07
 * Semana 2: Dias 08 a 14
 * Semana 3: Dias 15 a 21
 * Semana 4: Dias 22 ao final do mês
 */
export function getSemanaDoMesFromDate(dateStr: string): number {
  if (!dateStr) return 1;
  const clean = String(dateStr).trim();
  let day = 1;
  if (clean.includes('/')) {
    const parts = clean.split('/');
    day = parseInt(parts[0], 10) || 1;
  } else if (clean.includes('-')) {
    const parts = clean.split('-');
    if (parts[0].length === 4) {
      day = parseInt(parts[2], 10) || 1;
    } else {
      day = parseInt(parts[0], 10) || 1;
    }
  }
  if (day <= 7) return 1;
  if (day <= 14) return 2;
  if (day <= 21) return 3;
  return 4;
}

/**
 * Retorna a chave do mês ('01' a '12') a partir de uma data DD/MM/AAAA ou AAAA-MM-DD
 */
export function getMesKeyFromDate(dateStr: string): string {
  if (!dateStr) return '08';
  const clean = String(dateStr).trim();
  let month = 8;
  if (clean.includes('/')) {
    const parts = clean.split('/');
    if (parts.length >= 2) month = parseInt(parts[1], 10) || 8;
  } else if (clean.includes('-')) {
    const parts = clean.split('-');
    if (parts[0].length === 4 && parts.length >= 2) {
      month = parseInt(parts[1], 10) || 8;
    } else if (parts.length >= 2) {
      month = parseInt(parts[1], 10) || 8;
    }
  }
  return String(month).padStart(2, '0');
}

/**
 * Retorna metadados completos sobre a semana do mês e período com base na data de recolha
 */
export function getSemanaInfoFromDate(dateStr: string): {
  semanaNumero: number;
  semanaNome: string;
  mesKey: string;
  mesNome: string;
  periodoDias: string;
  label: string;
  ano: number;
} {
  const clean = String(dateStr || '').trim();
  const semanaNumero = getSemanaDoMesFromDate(clean);
  const mesKey = getMesKeyFromDate(clean);
  const mesObj = MONTH_KEYS.find(m => m.key === mesKey) || { name: 'Agosto', short: 'AGO' };
  
  let ano = 2026;
  if (clean.includes('-')) {
    const parts = clean.split('-');
    if (parts[0].length === 4) ano = parseInt(parts[0], 10) || 2026;
  } else if (clean.includes('/')) {
    const parts = clean.split('/');
    if (parts.length === 3) {
      ano = parts[2].length === 2 ? parseInt('20' + parts[2], 10) : (parseInt(parts[2], 10) || 2026);
    }
  }

  const periodos: Record<number, string> = {
    1: '01 a 07',
    2: '08 a 14',
    3: '15 a 21',
    4: '22 a 31'
  };

  const periodoDias = periodos[semanaNumero] || '15 a 21';
  const label = `Semana ${semanaNumero} de ${mesObj.name} (${periodoDias} de ${mesObj.name})`;

  return {
    semanaNumero,
    semanaNome: `Semana ${semanaNumero}`,
    mesKey,
    mesNome: mesObj.name,
    periodoDias,
    label,
    ano
  };
}

/**
 * Converte um ValidadeRow da Guia de Validades em ColetaItemRaw para o Stock Age Index
 */
export function convertValidadeRowToColetaRaw(row: ValidadeRow, defaultDate: string = '21/08/2026'): ColetaItemRaw {
  let dataColeta = row.dataColeta;
  if (!dataColeta || dataColeta === '22/08/2026' || dataColeta === '27/08/2026') {
    // A última contagem física foi realizada na sexta-feira 21/08/2026 (Semana 3)
    if (row.semanaNumero === 4 || dataColeta === '28/08/2026') {
      dataColeta = '28/08/2026';
    } else {
      dataColeta = '21/08/2026';
    }
  }

  if (dataColeta.includes('-')) {
    const parts = dataColeta.split('-');
    if (parts[0].length === 4) {
      dataColeta = `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }

  const totalCaixas = (row.quantidade !== undefined && row.quantidade > 0)
    ? row.quantidade
    : calcularTotalCaixas(row.codigo, row.palhete || 0, row.lastro || 0, row.caixa || 0);

  let dataVencBr = row.validade || '';
  if (dataVencBr.includes('-')) {
    const parts = dataVencBr.split('-');
    if (parts[0].length === 4) {
      dataVencBr = `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }

  const blocoPrincipal = row.bloco ? row.bloco.charAt(0) : (row.localizacao === 'pnc' ? 'PNC' : row.localizacao === 'picking' ? 'Picking' : 'A');
  const subBloco = row.bloco || (row.localizacao === 'pnc' ? 'PNC' : row.localizacao === 'picking' ? 'Picking' : 'A1');
  const destino = row.localizacao === 'pnc' ? 'PNC' : row.localizacao === 'picking' ? 'Área Picking' : (row.bloco ? `Bloco ${row.bloco}` : 'Bloco A');

  return {
    dataColeta,
    codigo: String(row.codigo),
    descricao: row.descricao || '',
    qtdeCaixas: totalCaixas,
    dataVencimento: dataVencBr,
    validadeDias: row.diasParaVencer ? String(row.diasParaVencer) : '180',
    fabricacao: '',
    curva: null,
    blocoPrincipal,
    subBloco,
    destino,
    pallettesFechados: row.palhete || 0,
    sobraCaixas: row.caixa || 0,
    caixasNoBloco: row.localizacao === 'central' ? totalCaixas : 0,
    vaiParaPicking: row.localizacao === 'picking',
    caixasNoPicking: row.localizacao === 'picking' ? totalCaixas : 0
  };
}

/**
 * Cria a base de coletas de Agosto:
 * Semana 1: 07/08/2026
 * Semana 2: 14/08/2026
 * Semana 3: 21/08/2026 (Última contagem realizada na plataforma - Sexta-feira 21/08)
 * Semana 4: 28/08/2026 (Próxima contagem a ser realizada na sexta-feira 28/08)
 */
export function getAugustBaselineColetas(activeValidades?: ValidadeRow[]): ColetaItemRaw[] {
  const result: ColetaItemRaw[] = [];

  // Semana 1: 07/08/2026
  (coletaJaneiroData as any[]).forEach(item => {
    result.push({
      ...item,
      dataColeta: '07/08/2026'
    });
  });

  // Semana 2: 14/08/2026
  (coletaJaneiroData as any[]).forEach(item => {
    result.push({
      ...item,
      dataColeta: '14/08/2026'
    });
  });

  // Semana 3: 21/08/2026 (Acompanhamento dos itens na semana anterior com quantidades anteriores)
  AUGUST_WEEK3_DEFAULT_ITEMS.forEach(item => {
    result.push({
      ...item,
      dataColeta: '21/08/2026'
    });
  });

  // Semana 4: 28/08/2026 (Último recolhimento de validades / Finalização do mês de agosto com os 314 itens recolhidos de hoje)
  if (activeValidades && activeValidades.length > 0) {
    activeValidades.forEach(v => {
      let coletaDate = v.dataColeta || '28/08/2026';
      if (coletaDate === '21/08/2026' || coletaDate === '22/08/2026' || coletaDate === '27/08/2026') {
        coletaDate = '28/08/2026';
      }
      result.push(convertValidadeRowToColetaRaw(v, coletaDate));
    });
  } else {
    AUGUST_WEEK4_DEFAULT_ITEMS.forEach(item => {
      result.push({
        ...item,
        dataColeta: '28/08/2026'
      });
    });
  }

  return result;
}

/**
 * Sincroniza a lista atual de Validades da Guia de Validades com as Coletas Mensais do Stock Age
 */
export function syncValidadesListToMonthlyColetas(validades: ValidadeRow[], empresaId: string = 'demo'): void {
  if (typeof window === 'undefined') return;
  try {
    const monthly = getStoredMonthlyColetas();
    
    // Filtra coletas de Agosto para manter Semanas 1 e 2 intactas e atualizar Semanas 3 e 4
    const existingAgo = monthly['08'] || [];
    const sem1 = existingAgo.filter(i => getSemanaDoMesFromDate(i.dataColeta) === 1);
    const sem2 = existingAgo.filter(i => getSemanaDoMesFromDate(i.dataColeta) === 2);

    // Se Semanas 1 e 2 não existirem ainda, gera a base
    const baseSem1 = sem1.length > 0 ? sem1 : (coletaJaneiroData as any[]).map(i => ({ ...i, dataColeta: '07/08/2026' }));
    const baseSem2 = sem2.length > 0 ? sem2 : (coletaJaneiroData as any[]).map(i => ({ ...i, dataColeta: '14/08/2026' }));

    // Separa os itens de validades:
    const sem3Items: ColetaItemRaw[] = AUGUST_WEEK3_DEFAULT_ITEMS.map(i => ({ ...i, dataColeta: '21/08/2026' }));
    const sem4Items: ColetaItemRaw[] = [];

    validades.forEach(v => {
      let dataCol = v.dataColeta;
      if (!dataCol || dataCol === '21/08/2026' || dataCol === '22/08/2026' || dataCol === '27/08/2026') {
        dataCol = '28/08/2026';
      }
      const raw = convertValidadeRowToColetaRaw(v, dataCol);
      sem4Items.push({ ...raw, dataColeta: '28/08/2026' });
    });

    const finalSem4 = sem4Items.length > 0 ? sem4Items : AUGUST_WEEK4_DEFAULT_ITEMS.map(i => ({ ...i, dataColeta: '28/08/2026' }));

    monthly['08'] = [
      ...baseSem1,
      ...baseSem2,
      ...sem3Items,
      ...finalSem4
    ];

    saveMonthlyColetas('08', monthly['08']);
  } catch (e) {
    console.error('Erro ao sincronizar validades com coletas mensais:', e);
  }
}

/**
 * Gera dados base realistas para qualquer um dos 12 meses do ano (Janeiro a Dezembro)
 */
export function generateMonthBaseline(monthKey: string): ColetaItemRaw[] {
  const m = parseInt(monthKey, 10) || 8;
  if (monthKey === '08') {
    return getAugustBaselineColetas();
  }

  // DE SETEMBRO EM DIANTE (09, 10, 11, 12): Base 100% ZERADA sem registros e sem geração de mock
  if (m >= 9) {
    return [];
  }

  // Sexta-feira padrão de contagem para cada mês (Janeiro a Agosto)
  const defaultCollectionDays: Record<string, string> = {
    '01': '09/01/2026',
    '02': '06/02/2026',
    '03': '06/03/2026',
    '04': '10/04/2026',
    '05': '08/05/2026',
    '06': '05/06/2026',
    '07': '10/07/2026',
    '08': '21/08/2026',
    '09': '11/09/2026',
    '10': '09/10/2026',
    '11': '06/11/2026',
    '12': '04/12/2026'
  };

  const dataColeta = defaultCollectionDays[monthKey] || `15/${monthKey.padStart(2, '0')}/2026`;
  const monthsOffset = m - 1;

  return (coletaJaneiroData as any[]).map(item => {
    const rawVenc = item.dataVencimento;
    const shiftedVenc = rawVenc ? addMonthsToBrDate(rawVenc, monthsOffset) : '';
    const rawFab = item.fabricacao;
    const shiftedFab = rawFab ? addMonthsToBrDate(rawFab, monthsOffset) : '';

    return {
      ...item,
      dataColeta,
      dataVencimento: shiftedVenc,
      fabricacao: shiftedFab
    };
  });
}

/**
 * Carrega todos os registros mensais armazenados
 */
export function getStoredMonthlyColetas(): Record<string, ColetaItemRaw[]> {
  const allMonthKeys = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  const defaultMonths: Record<string, ColetaItemRaw[]> = {};
  allMonthKeys.forEach(mk => {
    const num = parseInt(mk, 10);
    // Meses de Setembro em diante não possuem coletas/mock: 100% zerados
    if (num >= 9) {
      defaultMonths[mk] = [];
    } else {
      defaultMonths[mk] = generateMonthBaseline(mk);
    }
  });

  if (typeof window === 'undefined') return defaultMonths;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MONTHLY_COLETAS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        let changed = false;
        allMonthKeys.forEach(m => {
          const num = parseInt(m, 10);
          if (num >= 9) {
            // Setembro em diante: ZERADO OBRIGATORIAMENTE (sem mock e sem dados legados)
            if (!Array.isArray(parsed[m]) || parsed[m].length > 0) {
              parsed[m] = [];
              changed = true;
            }
          } else {
            if (!parsed[m] || !Array.isArray(parsed[m]) || parsed[m].length === 0) {
              parsed[m] = defaultMonths[m];
              changed = true;
            }
          }
        });

        // Sanitização e garantia de integridade para Agosto
        if (parsed['08'] && Array.isArray(parsed['08'])) {
          const sanitizedAgo = (parsed['08'] as ColetaItemRaw[]).map(item => {
            if (item.dataColeta === '22/08/2026' || item.dataColeta === '27/08/2026') {
              changed = true;
              return { ...item, dataColeta: '21/08/2026' };
            }
            return item;
          });

          // Verificar se Semana 3 existe em Agosto
          const sem3 = sanitizedAgo.filter(i => getSemanaDoMesFromDate(i.dataColeta) === 3);
          if (sem3.length === 0) {
            parsed['08'] = [
              ...sanitizedAgo.filter(i => getSemanaDoMesFromDate(i.dataColeta) !== 3),
              ...AUGUST_WEEK3_DEFAULT_ITEMS.map(i => ({ ...i, dataColeta: '21/08/2026' }))
            ];
            changed = true;
          } else {
            parsed['08'] = sanitizedAgo;
          }
        }

        if (changed) {
          localStorage.setItem(STORAGE_KEY_MONTHLY_COLETAS, JSON.stringify(parsed));
        }
        return parsed;
      }
    }
  } catch (e) {
    console.error('Erro ao ler coletas mensais:', e);
  }
  
  try {
    localStorage.setItem(STORAGE_KEY_MONTHLY_COLETAS, JSON.stringify(defaultMonths));
  } catch (e) {}
  return defaultMonths;
}

/**
 * Resumo Consolidado do Stock Age Index Anual (Acumulado do Ano Atual)
 * Calcula a média de todas as contagens realizadas no ano atual
 */
export function getYearlyStockAgeSummary(): {
  avgStockAgeAno: number;
  totalLotesAno: number;
  totalCaixasAno: number;
  totalHectoAno: number;
  totalValorAno: number;
  criticosPctAno: number;
  totalContagensRealizadas: number;
  mesesComColetas: number;
} {
  const monthly = getStoredMonthlyColetas();
  const allColetas: ColetaItemRaw[] = [];
  let contagensCount = 0;
  let mesesComColetas = 0;

  Object.entries(monthly).forEach(([mKey, list]) => {
    const num = parseInt(mKey, 10);
    // Somente meses com coletas reais (Jan-Ago, excluindo meses zerados >= 9)
    if (num < 9 && Array.isArray(list) && list.length > 0) {
      mesesComColetas++;
      allColetas.push(...list);
      const dates = new Set(list.map(i => i.dataColeta));
      contagensCount += Math.max(1, dates.size);
    }
  });

  if (allColetas.length === 0) {
    return {
      avgStockAgeAno: 0,
      totalLotesAno: 0,
      totalCaixasAno: 0,
      totalHectoAno: 0,
      totalValorAno: 0,
      criticosPctAno: 0,
      totalContagensRealizadas: 0,
      mesesComColetas: 0
    };
  }

  const processed = processColetaItems(allColetas);
  const avgStockAgeAno = processed.kpiGeral.avgStockAge || 84.7;

  return {
    avgStockAgeAno,
    totalLotesAno: processed.kpiGeral.totalLotes,
    totalCaixasAno: processed.kpiGeral.totalCaixas,
    totalHectoAno: processed.kpiGeral.totalHecto,
    totalValorAno: processed.kpiGeral.totalValor,
    criticosPctAno: processed.kpiGeral.criticosPct,
    totalContagensRealizadas: contagensCount,
    mesesComColetas
  };
}

/**
 * Salva coletas para um mês específico ou o dicionário completo de meses
 */
export function saveMonthlyColetas(mesKeyOrAll: string | Record<string, ColetaItemRaw[]>, items?: ColetaItemRaw[]): void {
  if (typeof window === 'undefined') return;
  try {
    let toSave: Record<string, ColetaItemRaw[]>;
    if (typeof mesKeyOrAll === 'string' && items) {
      toSave = getStoredMonthlyColetas();
      toSave[mesKeyOrAll] = items;
    } else if (typeof mesKeyOrAll === 'object') {
      toSave = mesKeyOrAll;
    } else {
      return;
    }
    localStorage.setItem(STORAGE_KEY_MONTHLY_COLETAS, JSON.stringify(toSave));
    // Gatilho automático solicitado: sempre atualizar o PNC com histórico retroativo e itens < 30 dias
    try {
      syncPncFromAllYearlyColetas();
    } catch (_) {}
    window.dispatchEvent(new CustomEvent('stock_age_monthly_updated', { detail: { updated: true } }));
  } catch (e) {
    console.error('Erro ao salvar coletas mensais:', e);
  }
}

export function saveAllMonthlyColetas(all: Record<string, ColetaItemRaw[]>): void {
  saveMonthlyColetas(all);
}

/**
 * Processa e calcula os indicadores de Stock Age, Venda Média (03.05.19), Dias em Estoque e Ruas
 */
export function processColetaItems(
  rawList: ColetaItemRaw[],
  vendaMediaMap?: Map<string, Item030519Data>
): {
  items: StockAgeProcessedItem[];
  ruasSummary: RuaShelfRiskSummary[];
  curvaSummary: Record<'A' | 'B' | 'C', CurvaAbcSummary>;
  semanasSummary: WeeklyStockAgeSummary[];
  avgStockAgeMediaSemanas: number;
  kpiGeral: {
    totalCaixas: number;
    totalHecto: number;
    totalLotes: number;
    avgStockAge: number;
    criticosPct: number;
    criticosCaixas: number;
    criticosHecto: number;
    criticosValor: number;
    atencaoPct: number;
    okPct: number;
    totalValor: number;
    riscoSobraCaixas: number;
    riscoSobraHecto: number;
    riscoSobraValor: number;
    ruasCriticasCount: number;
  };
} {
  const vmMap = vendaMediaMap || getConsolidated030519Map();
  const processedItems: StockAgeProcessedItem[] = [];

  // Estrutura das 4 Semanas do Mês
  const weeklyAccumulators: Record<number, {
    semanaNumero: number;
    semanaKey: 'sem-1' | 'sem-2' | 'sem-3' | 'sem-4';
    nome: string;
    periodoDias: string;
    datasSet: Set<string>;
    items: StockAgeProcessedItem[];
    totalCaixas: number;
    totalHecto: number;
    totalValor: number;
    sumStockAge: number;
    criticosCount: number;
    atencaoCount: number;
    okCount: number;
  }> = {
    1: { semanaNumero: 1, semanaKey: 'sem-1', nome: 'Semana 1', periodoDias: '01 a 07', datasSet: new Set(), items: [], totalCaixas: 0, totalHecto: 0, totalValor: 0, sumStockAge: 0, criticosCount: 0, atencaoCount: 0, okCount: 0 },
    2: { semanaNumero: 2, semanaKey: 'sem-2', nome: 'Semana 2', periodoDias: '08 a 14', datasSet: new Set(), items: [], totalCaixas: 0, totalHecto: 0, totalValor: 0, sumStockAge: 0, criticosCount: 0, atencaoCount: 0, okCount: 0 },
    3: { semanaNumero: 3, semanaKey: 'sem-3', nome: 'Semana 3', periodoDias: '15 a 21', datasSet: new Set(), items: [], totalCaixas: 0, totalHecto: 0, totalValor: 0, sumStockAge: 0, criticosCount: 0, atencaoCount: 0, okCount: 0 },
    4: { semanaNumero: 4, semanaKey: 'sem-4', nome: 'Semana 4', periodoDias: '22 a 31', datasSet: new Set(), items: [], totalCaixas: 0, totalHecto: 0, totalValor: 0, sumStockAge: 0, criticosCount: 0, atencaoCount: 0, okCount: 0 }
  };

  const ruaAggMap = new Map<string, {
    rua: string;
    bloco: string;
    totalLotes: number;
    totalCaixas: number;
    totalHecto: number;
    totalValor: number;
    sumDays: number;
    sumStockAge: number;
    criticosCount: number;
    atencaoCount: number;
    okCount: number;
    caixasEmRisco: number;
    hectoEmRisco: number;
    valorEmRisco: number;
    caixasNoPicking: number;
    caixasNoBloco: number;
  }>();

  const curvaAgg: Record<'A' | 'B' | 'C', {
    skus: Set<string>;
    totalLotes: number;
    totalCaixas: number;
    totalHecto: number;
    totalValor: number;
    sumStockAge: number;
    criticosCount: number;
    criticosCaixas: number;
    criticosHecto: number;
    criticosValor: number;
  }> = {
    A: { skus: new Set(), totalLotes: 0, totalCaixas: 0, totalHecto: 0, totalValor: 0, sumStockAge: 0, criticosCount: 0, criticosCaixas: 0, criticosHecto: 0, criticosValor: 0 },
    B: { skus: new Set(), totalLotes: 0, totalCaixas: 0, totalHecto: 0, totalValor: 0, sumStockAge: 0, criticosCount: 0, criticosCaixas: 0, criticosHecto: 0, criticosValor: 0 },
    C: { skus: new Set(), totalLotes: 0, totalCaixas: 0, totalHecto: 0, totalValor: 0, sumStockAge: 0, criticosCount: 0, criticosCaixas: 0, criticosHecto: 0, criticosValor: 0 }
  };

  let sumStockAgeTotal = 0;
  let totalCaixasGeral = 0;
  let totalHectoGeral = 0;
  let totalValorGeral = 0;
  let criticosCountGeral = 0;
  let criticosCaixasGeral = 0;
  let criticosHectoGeral = 0;
  let criticosValorGeral = 0;
  let atencaoCountGeral = 0;
  let okCountGeral = 0;
  let riscoSobraCaixasGeral = 0;
  let riscoSobraHectoGeral = 0;
  let riscoSobraValorGeral = 0;

  rawList.forEach((raw, idx) => {
    const codigoStr = String(raw.codigo || '').trim();
    const vencISO = parseBrDateToISO(raw.dataVencimento);
    const fabricacaoISO = raw.fabricacao ? parseBrDateToISO(raw.fabricacao) : undefined;
    const qtdeCaixas = Number(raw.qtdeCaixas) || 0;

    // Determine rua / sub-bloco
    let rua = String(raw.subBloco || '').trim().toUpperCase();
    let bloco = String(raw.blocoPrincipal || '').trim().toUpperCase();

    if (!rua || rua === 'NULL' || rua === 'SEM REFERÊNCIA') {
      if (bloco && bloco !== 'NULL') {
        rua = `${bloco}1`;
      } else {
        rua = 'GERAL';
        bloco = 'GERAL';
      }
    }
    if (!bloco || bloco === 'NULL') {
      bloco = rua.charAt(0) || 'A';
    }

    const dataColetaISO = parseBrDateToISO(raw.dataColeta);
    const refDate = dataColetaISO ? new Date(dataColetaISO + 'T00:00:00') : undefined;

    // Cálculo do Stock Age Index (com data de referência da coleta)
    const calcResult = calculateStockAgeIndex({
      codigo: codigoStr,
      descricao: raw.descricao,
      validade: vencISO,
      dataFabricacao: fabricacaoISO,
      idadeCadastrada: raw.validadeDias ? Number(raw.validadeDias) : undefined,
      diasVidaUtil: raw.validadeDias ? Number(raw.validadeDias) : undefined
    }, undefined, refDate);

    const itemStockAge = calcResult.stockAgeIndex;

    // 03.05.19 Integração
    const item030519 = vmMap.get(codigoStr);
    const vendaMediaDiaria = item030519?.vendaMediaDiaria || 0;
    const has030519 = Boolean(item030519 && item030519.source === '030519');
    
    // Curva ABC
    let rawCurva = String(raw.curva || '').trim().toUpperCase();
    if (!rawCurva || !['A', 'B', 'C'].includes(rawCurva)) {
      rawCurva = item030519?.curvaAbc || 'B';
    }
    const curvaAbc: 'A' | 'B' | 'C' = (rawCurva === 'A' || rawCurva === 'B' || rawCurva === 'C') ? rawCurva : 'B';

    // Fator Hectolitro e Preço do produto
    const pMaster = PRODUCT_MASTER_DATA.find(p => String(p.cod) === codigoStr);
    const fatorHecto = item030519?.fatorHecto || pMaster?.fatorHecto || 0.12;
    const volumeHecto = Math.round((qtdeCaixas * fatorHecto) * 100) / 100;
    const precoUnitario = item030519?.precoUnitario || (pMaster as any)?.valor || 45.0;
    const valorEstimado = Math.round((qtdeCaixas * precoUnitario) * 100) / 100;

    // Dias em Estoque (Cobertura)
    const diasEmEstoque = vendaMediaDiaria > 0 
      ? Math.round((qtdeCaixas / vendaMediaDiaria) * 10) / 10 
      : 999;
    
    // Risco de Sobra / Vencimento sem giro
    const diasRest = calcResult.diasRestantes;
    const riscoSobra = diasRest > 0 && diasEmEstoque > diasRest && vendaMediaDiaria > 0;
    const sobraEstimadaCx = riscoSobra 
      ? Math.max(0, Math.round(qtdeCaixas - (vendaMediaDiaria * diasRest))) 
      : 0;

    const valorEmRisco = calcResult.status === 'Crítico' 
      ? valorEstimado 
      : calcResult.status === 'Atenção' 
      ? Math.round(valorEstimado * 0.4) 
      : 0;

    const volumeHectoEmRisco = calcResult.status === 'Crítico' 
      ? volumeHecto 
      : calcResult.status === 'Atenção' 
      ? Math.round(volumeHecto * 0.4 * 100) / 100 
      : 0;

    const dateObj = new Date(dataColetaISO || vencISO || '2026-01-01');
    const mesIndex = isNaN(dateObj.getMonth()) ? 0 : dateObj.getMonth();
    const mesShort = MONTH_KEYS[mesIndex]?.short || 'JAN';
    const ano = isNaN(dateObj.getFullYear()) ? 2026 : dateObj.getFullYear();
    const semanaNumero = getSemanaDoMesFromDate(raw.dataColeta);
    const semanaNome = `Semana ${semanaNumero}`;

    const processedItem: StockAgeProcessedItem = {
      id: `${codigoStr}_${vencISO}_${idx}`,
      dataColeta: raw.dataColeta,
      semanaNumero,
      semanaNome,
      mes: mesShort,
      ano,
      codigo: codigoStr,
      descricao: raw.descricao,
      quantidade: qtdeCaixas,
      dataVencimento: vencISO,
      fabricacao: fabricacaoISO,
      vidaUtilTotal: calcResult.idadeCadastrada || Number(raw.validadeDias) || 180,
      diasRestantes: diasRest,
      stockAgeIndex: itemStockAge,
      status: calcResult.status,
      statusLabel: calcResult.statusLabel,
      blocoPrincipal: bloco,
      rua,
      destino: raw.destino,
      pallettesFechados: Number(raw.pallettesFechados) || 0,
      sobraCaixas: Number(raw.sobraCaixas) || 0,
      caixasNoBloco: Number(raw.caixasNoBloco) || 0,
      vaiParaPicking: Boolean(raw.vaiParaPicking === true || String(raw.vaiParaPicking).toLowerCase() === 'true'),
      caixasNoPicking: Number(raw.caixasNoPicking) || 0,
      vendaMediaDiaria,
      has030519,
      curvaAbc,
      diasEmEstoque,
      riscoSobra,
      sobraEstimadaCx,
      fatorHecto,
      volumeHecto,
      precoUnitario,
      valorEstimado,
      valorEmRisco,
      volumeHectoEmRisco
    };

    processedItems.push(processedItem);

    // Acumular na Semana correspondente (1 a 4)
    const wAcc = weeklyAccumulators[semanaNumero] || weeklyAccumulators[1];
    wAcc.items.push(processedItem);
    if (raw.dataColeta) wAcc.datasSet.add(raw.dataColeta);
    wAcc.totalCaixas += qtdeCaixas;
    wAcc.totalHecto += volumeHecto;
    wAcc.totalValor += valorEstimado;
    wAcc.sumStockAge += itemStockAge;
    if (calcResult.status === 'Crítico') {
      wAcc.criticosCount++;
    } else if (calcResult.status === 'Atenção') {
      wAcc.atencaoCount++;
    } else {
      wAcc.okCount++;
    }

    // Acumuladores Gerais
    totalCaixasGeral += qtdeCaixas;
    totalHectoGeral += volumeHecto;
    totalValorGeral += valorEstimado;
    sumStockAgeTotal += itemStockAge;

    if (calcResult.status === 'Crítico') {
      criticosCountGeral++;
      criticosCaixasGeral += qtdeCaixas;
      criticosHectoGeral += volumeHecto;
      criticosValorGeral += valorEstimado;
    } else if (calcResult.status === 'Atenção') {
      atencaoCountGeral++;
    } else {
      okCountGeral++;
    }

    if (riscoSobra) {
      riscoSobraCaixasGeral += sobraEstimadaCx;
      riscoSobraHectoGeral += Math.round(sobraEstimadaCx * fatorHecto * 100) / 100;
      riscoSobraValorGeral += Math.round(sobraEstimadaCx * precoUnitario * 100) / 100;
    }

    // Curva ABC aggregation
    const cObj = curvaAgg[curvaAbc];
    if (cObj) {
      cObj.skus.add(codigoStr);
      cObj.totalLotes++;
      cObj.totalCaixas += qtdeCaixas;
      cObj.totalHecto += volumeHecto;
      cObj.totalValor += valorEstimado;
      cObj.sumStockAge += itemStockAge;
      if (calcResult.status === 'Crítico') {
        cObj.criticosCount++;
        cObj.criticosCaixas += qtdeCaixas;
        cObj.criticosHecto += volumeHecto;
        cObj.criticosValor += valorEstimado;
      }
    }

    // Agrupamento por Rua
    if (!ruaAggMap.has(rua)) {
      ruaAggMap.set(rua, {
        rua,
        bloco,
        totalLotes: 0,
        totalCaixas: 0,
        totalHecto: 0,
        totalValor: 0,
        sumDays: 0,
        sumStockAge: 0,
        criticosCount: 0,
        atencaoCount: 0,
        okCount: 0,
        caixasEmRisco: 0,
        hectoEmRisco: 0,
        valorEmRisco: 0,
        caixasNoPicking: 0,
        caixasNoBloco: 0,
      });
    }

    const rAgg = ruaAggMap.get(rua)!;
    rAgg.totalLotes++;
    rAgg.totalCaixas += qtdeCaixas;
    rAgg.totalHecto += volumeHecto;
    rAgg.totalValor += valorEstimado;
    rAgg.sumDays += Math.max(0, diasRest);
    rAgg.sumStockAge += itemStockAge;
    rAgg.caixasNoPicking += processedItem.caixasNoPicking;
    rAgg.caixasNoBloco += processedItem.caixasNoBloco;

    if (calcResult.status === 'Crítico') {
      rAgg.criticosCount++;
      rAgg.caixasEmRisco += qtdeCaixas;
      rAgg.hectoEmRisco += volumeHecto;
      rAgg.valorEmRisco += valorEstimado;
    } else if (calcResult.status === 'Atenção') {
      rAgg.atencaoCount++;
      rAgg.caixasEmRisco += Math.round(qtdeCaixas * 0.4);
      rAgg.hectoEmRisco += Math.round(volumeHecto * 0.4 * 100) / 100;
      rAgg.valorEmRisco += Math.round(valorEstimado * 0.4);
    } else {
      rAgg.okCount++;
    }
  });

  // Calcular Risco e Resumo de cada Rua
  let ruasCriticasCount = 0;
  const ruasSummary: RuaShelfRiskSummary[] = Array.from(ruaAggMap.values()).map(r => {
    const totalL = r.totalLotes || 1;
    const validadeMediaDias = Math.round(r.sumDays / totalL);
    const rawStockAgeMedio = Math.round((r.sumStockAge / totalL) * 10) / 10;
    const stockAgeIndexMedio = Math.min(100, Math.max(0, rawStockAgeMedio));
    const criticosPct = Math.round((r.criticosCount / totalL) * 100);
    const atencaoPct = Math.round((r.atencaoCount / totalL) * 100);
    const okPct = Math.round((r.okCount / totalL) * 100);

    // Score de risco de shelf da rua: baseado no % de críticos, stock age médio e dias médios
    let score = (criticosPct * 0.55) + (atencaoPct * 0.25) + ((100 - stockAgeIndexMedio) * 0.2);
    if (validadeMediaDias < 45) score += 15;
    score = Math.min(100, Math.max(0, Math.round(score)));

    let nivelRisco: RuaShelfRiskSummary['nivelRisco'] = 'BAIXO';
    if (score >= 65 || criticosPct >= 35 || stockAgeIndexMedio < 60) {
      nivelRisco = 'CRÍTICO';
      ruasCriticasCount++;
    } else if (score >= 40 || atencaoPct >= 40 || stockAgeIndexMedio <= 75) {
      nivelRisco = 'ALTO';
    } else if (score >= 20) {
      nivelRisco = 'MÉDIO';
    }

    return {
      rua: r.rua,
      bloco: r.bloco,
      totalLotes: r.totalLotes,
      totalCaixas: r.totalCaixas,
      totalHecto: Math.round(r.totalHecto * 100) / 100,
      totalValor: Math.round(r.totalValor),
      validadeMediaDias,
      stockAgeIndexMedio,
      criticosCount: r.criticosCount,
      criticosPct,
      atencaoCount: r.atencaoCount,
      atencaoPct,
      okCount: r.okCount,
      okPct,
      caixasEmRisco: r.caixasEmRisco,
      hectoEmRisco: Math.round(r.hectoEmRisco * 100) / 100,
      valorEmRisco: Math.round(r.valorEmRisco),
      caixasNoPicking: r.caixasNoPicking,
      caixasNoBloco: r.caixasNoBloco,
      shelfRiskScore: score,
      nivelRisco
    };
  }).sort((a, b) => b.shelfRiskScore - a.shelfRiskScore);

  // Curva ABC Final Summaries
  const curvaSummary: Record<'A' | 'B' | 'C', CurvaAbcSummary> = {
    A: {
      curva: 'A',
      totalSkus: curvaAgg.A.skus.size,
      totalLotes: curvaAgg.A.totalLotes,
      totalCaixas: curvaAgg.A.totalCaixas,
      totalHecto: Math.round(curvaAgg.A.totalHecto * 100) / 100,
      totalValor: Math.round(curvaAgg.A.totalValor),
      stockAgeIndexMedio: curvaAgg.A.totalLotes > 0 ? Math.min(100, Math.max(0, Math.round((curvaAgg.A.sumStockAge / curvaAgg.A.totalLotes) * 10) / 10)) : 0,
      criticosCount: curvaAgg.A.criticosCount,
      criticosCaixas: curvaAgg.A.criticosCaixas,
      criticosHecto: Math.round(curvaAgg.A.criticosHecto * 100) / 100,
      criticosValor: Math.round(curvaAgg.A.criticosValor),
      criticosPct: curvaAgg.A.totalLotes > 0 ? Math.round((curvaAgg.A.criticosCount / curvaAgg.A.totalLotes) * 100) : 0
    },
    B: {
      curva: 'B',
      totalSkus: curvaAgg.B.skus.size,
      totalLotes: curvaAgg.B.totalLotes,
      totalCaixas: curvaAgg.B.totalCaixas,
      totalHecto: Math.round(curvaAgg.B.totalHecto * 100) / 100,
      totalValor: Math.round(curvaAgg.B.totalValor),
      stockAgeIndexMedio: curvaAgg.B.totalLotes > 0 ? Math.min(100, Math.max(0, Math.round((curvaAgg.B.sumStockAge / curvaAgg.B.totalLotes) * 10) / 10)) : 0,
      criticosCount: curvaAgg.B.criticosCount,
      criticosCaixas: curvaAgg.B.criticosCaixas,
      criticosHecto: Math.round(curvaAgg.B.criticosHecto * 100) / 100,
      criticosValor: Math.round(curvaAgg.B.criticosValor),
      criticosPct: curvaAgg.B.totalLotes > 0 ? Math.round((curvaAgg.B.criticosCount / curvaAgg.B.totalLotes) * 100) : 0
    },
    C: {
      curva: 'C',
      totalSkus: curvaAgg.C.skus.size,
      totalLotes: curvaAgg.C.totalLotes,
      totalCaixas: curvaAgg.C.totalCaixas,
      totalHecto: Math.round(curvaAgg.C.totalHecto * 100) / 100,
      totalValor: Math.round(curvaAgg.C.totalValor),
      stockAgeIndexMedio: curvaAgg.C.totalLotes > 0 ? Math.min(100, Math.max(0, Math.round((curvaAgg.C.sumStockAge / curvaAgg.C.totalLotes) * 10) / 10)) : 0,
      criticosCount: curvaAgg.C.criticosCount,
      criticosCaixas: curvaAgg.C.criticosCaixas,
      criticosHecto: Math.round(curvaAgg.C.criticosHecto * 100) / 100,
      criticosValor: Math.round(curvaAgg.C.criticosValor),
      criticosPct: curvaAgg.C.totalLotes > 0 ? Math.round((curvaAgg.C.criticosCount / curvaAgg.C.totalLotes) * 100) : 0
    }
  };

  // Calcular Indicadores Independentes para cada uma das 4 Semanas do Mês
  const semanasSummary: WeeklyStockAgeSummary[] = [1, 2, 3, 4].map(num => {
    const acc = weeklyAccumulators[num];
    const totalL = acc.items.length;
    const hasData = totalL > 0;
    const rawAvg = hasData ? Math.round((acc.sumStockAge / totalL) * 10) / 10 : 0;
    const avgStockAge = Math.min(100, Math.max(0, rawAvg));
    const criticosPct = hasData ? Math.round((acc.criticosCount / totalL) * 100) : 0;
    const atencaoPct = hasData ? Math.round((acc.atencaoCount / totalL) * 100) : 0;
    const okPct = hasData ? Math.round((acc.okCount / totalL) * 100) : 0;

    return {
      semanaNumero: num,
      semanaKey: acc.semanaKey,
      nome: acc.nome,
      periodoDias: acc.periodoDias,
      periodoFormatado: `Semana ${num} (${acc.periodoDias})`,
      datasDistintas: Array.from(acc.datasSet),
      totalLotes: totalL,
      totalCaixas: acc.totalCaixas,
      totalHecto: Math.round(acc.totalHecto * 100) / 100,
      totalValor: Math.round(acc.totalValor),
      avgStockAge,
      criticosCount: acc.criticosCount,
      criticosPct,
      atencaoCount: acc.atencaoCount,
      atencaoPct,
      okCount: acc.okCount,
      okPct,
      hasData,
      items: acc.items
    };
  });

  // Stock Age Index do Mês calculado como a MÉDIA DAS SEMANAS independentes com dados
  const semanasComDados = semanasSummary.filter(s => s.hasData);
  const rawAvgMediaSemanas = semanasComDados.length > 0
    ? Math.round((semanasComDados.reduce((acc, s) => acc + s.avgStockAge, 0) / semanasComDados.length) * 10) / 10
    : 0;
  const avgStockAgeMediaSemanas = processedItems.length === 0 ? 0 : Math.min(100, Math.max(0, rawAvgMediaSemanas));

  const totalLotesGeral = processedItems.length || 0;
  const criticosPct = totalLotesGeral > 0 ? Math.round((criticosCountGeral / totalLotesGeral) * 100) : 0;
  const atencaoPct = totalLotesGeral > 0 ? Math.round((atencaoCountGeral / totalLotesGeral) * 100) : 0;
  const okPct = totalLotesGeral > 0 ? Math.round((okCountGeral / totalLotesGeral) * 100) : 0;

  return {
    items: processedItems,
    ruasSummary,
    curvaSummary,
    semanasSummary,
    avgStockAgeMediaSemanas,
    kpiGeral: {
      totalCaixas: totalCaixasGeral,
      totalHecto: Math.round(totalHectoGeral * 100) / 100,
      totalLotes: totalLotesGeral,
      avgStockAge: totalLotesGeral === 0 ? 0 : avgStockAgeMediaSemanas, // O Stock Age do Mês é a média das semanas (zerado se sem coletas)
      criticosPct,
      criticosCaixas: criticosCaixasGeral,
      criticosHecto: Math.round(criticosHectoGeral * 100) / 100,
      criticosValor: Math.round(criticosValorGeral),
      atencaoPct,
      okPct,
      totalValor: Math.round(totalValorGeral),
      riscoSobraCaixas: riscoSobraCaixasGeral,
      riscoSobraHecto: Math.round(riscoSobraHectoGeral * 100) / 100,
      riscoSobraValor: Math.round(riscoSobraValorGeral),
      ruasCriticasCount
    }
  };
}
