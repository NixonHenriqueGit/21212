import { QuebraRow } from '../types';
import { RetroactiveRecord } from './dadosRetroativosUtils';
import { sanitizeData } from '../security/JsonSecuritySanitizer';
import quebrasDataJson from '../data/quebrasOfficialDataset.json';

export interface RawQuebraJsonItem {
  Data?: string;
  data?: string;
  DATA?: string;
  'Data Lançamento'?: string;
  'Data Lancamento'?: string;
  dataISO?: string;
  
  Mês?: string;
  Mes?: string;
  mes?: string;
  MÊS?: string;
  MES?: string;
  
  CodProduto?: number | string;
  codProduto?: number | string;
  CODPRODUTO?: number | string;
  Produto?: number | string;
  PRODUTO?: number | string;
  codigo?: number | string;
  'Cód Produto'?: number | string;
  
  Descricao?: string;
  descricao?: string;
  DESCRICAO?: string;
  'Descrição'?: string;
  'DESCRIÇÃO'?: string;
  'Descrição Produto'?: string;
  
  Quantidade?: number | string;
  quantidade?: number | string;
  QUANTIDADE?: number | string;
  'QUANT UND.'?: number | string;
  'QUANT UND'?: number | string;
  Qtd?: number | string;
  qtd?: number | string;
  
  Area?: string;
  area?: string;
  AREA?: string;
  Setor?: string;
  setor?: string;
  
  Turno?: string;
  turno?: string;
  TURNO?: string;
  
  CodQuebra?: number | string;
  codQuebra?: number | string;
  CODQUEBRA?: number | string;
  'Cod Quebra'?: number | string;
  'COD QUEBRA'?: number | string;
  
  Motivo?: string;
  motivo?: string;
  MOTIVO?: string;
  'Motivo Quebra'?: string;
  
  Colaborador?: string;
  colaborador?: string;
  COLABORADOR?: string;
  'Colaborador Quebrou'?: string;
  Responsavel?: string;
  responsavel?: string;
  
  Funcao?: string;
  funcao?: string;
  FUNCAO?: string;
  'Função'?: string;
  'FUNÇÃO'?: string;
  Cargo?: string;
  cargo?: string;
  
  'VALOR DA AVARIA'?: number | string;
  'VALOR AVARIA'?: number | string;
  valorDaAvaria?: number | string;
  valorAvaria?: number | string;
  valorUnitario?: number | string;
  'VALOR TT'?: number | string;
  valorTotal?: number | string;
  Valor?: number | string;
  
  'HECTO LITRO'?: number | string;
  'HECTOLITRO'?: number | string;
  hectoLitro?: number | string;
  fatorHl?: number | string;
  
  'HECTO PERDIDO '?: number | string;
  'HECTO PERDIDO'?: number | string;
  'HECTOPERDIDO'?: number | string;
  hectoPerdido?: number | string;
  hlPerdido?: number | string;
  
  [key: string]: any;
}

export interface ParsedQuebrasResult {
  valid: boolean;
  quebraRows: QuebraRow[];
  retroactiveRecords: RetroactiveRecord[];
  totalRecords: number;
  totalQuantidade: number;
  totalHlPerdido: number;
  totalValorAvaria: number;
  resumoPorArea: Record<string, { count: number; quantidade: number; valor: number; hl: number }>;
  resumoPorMotivo: Record<string, { count: number; quantidade: number; valor: number; hl: number }>;
  resumoPorMes: Record<string, { count: number; quantidade: number; valor: number; hl: number }>;
  resumoPorColaborador: Record<string, { count: number; quantidade: number; valor: number; hl: number }>;
  errors: string[];
  warnings: string[];
}

/**
 * Exemplo padrão oficial para testes e modelo de importação de Quebras (Ano 2026)
 */
export const SAMPLE_QUEBRAS_JSON: RawQuebraJsonItem[] = quebrasDataJson as RawQuebraJsonItem[];

/**
 * Normaliza e padroniza a data para ISO (YYYY-MM-DD) e formato BR (DD/MM/YYYY)
 */
function parseDates(rawDate?: string): { dataISO: string; dataFormatada: string } {
  const fallback = new Date().toISOString().split('T')[0];
  if (!rawDate) {
    return { dataISO: fallback, dataFormatada: new Date().toLocaleDateString('pt-BR') };
  }

  const str = String(rawDate).trim();

  // Caso 1: Formato "YYYY-MM-DD" ou "YYYY-MM-DD HH:MM:SS"
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const isoPart = str.substring(0, 10);
    const [y, m, d] = isoPart.split('-');
    return {
      dataISO: isoPart,
      dataFormatada: `${d}/${m}/${y}`
    };
  }

  // Caso 2: Formato "DD/MM/YYYY" ou "DD/MM/YYYY HH:MM:SS"
  if (/^\d{2}\/\d{2}\/\d{4}/.test(str)) {
    const brPart = str.substring(0, 10);
    const [d, m, y] = brPart.split('/');
    return {
      dataISO: `${y}-${m}-${d}`,
      dataFormatada: brPart
    };
  }

  return { dataISO: fallback, dataFormatada: new Date().toLocaleDateString('pt-BR') };
}

/**
 * Realiza o parse completo do lote JSON de Quebras & Avarias
 */
export function parseQuebrasJson(
  input: string | any[],
  empresaId = 'demo',
  userNome = 'Sistema'
): ParsedQuebrasResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  let rawList: any[] = [];

  try {
    if (typeof input === 'string') {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) {
        rawList = parsed;
      } else if (typeof parsed === 'object' && parsed !== null) {
        if (Array.isArray(parsed.itens)) {
          rawList = parsed.itens;
        } else if (Array.isArray(parsed.data)) {
          rawList = parsed.data;
        } else if (Array.isArray(parsed.quebras)) {
          rawList = parsed.quebras;
        } else {
          rawList = [parsed];
        }
      } else {
        throw new Error('O formato do JSON deve ser uma lista (Array) de objetos de Quebras.');
      }
    } else if (Array.isArray(input)) {
      rawList = input;
    } else {
      rawList = [input];
    }
  } catch (err: any) {
    return {
      valid: false,
      quebraRows: [],
      retroactiveRecords: [],
      totalRecords: 0,
      totalQuantidade: 0,
      totalHlPerdido: 0,
      totalValorAvaria: 0,
      resumoPorArea: {},
      resumoPorMotivo: {},
      resumoPorMes: {},
      resumoPorColaborador: {},
      errors: [`Erro de Sintaxe JSON: ${err.message}`],
      warnings: []
    };
  }

  if (rawList.length === 0) {
    return {
      valid: false,
      quebraRows: [],
      retroactiveRecords: [],
      totalRecords: 0,
      totalQuantidade: 0,
      totalHlPerdido: 0,
      totalValorAvaria: 0,
      resumoPorArea: {},
      resumoPorMotivo: {},
      resumoPorMes: {},
      resumoPorColaborador: {},
      errors: ['A lista de dados fornecida está vazia.'],
      warnings: []
    };
  }

  const quebraRows: QuebraRow[] = [];
  const retroactiveRecords: RetroactiveRecord[] = [];
  const seenDedupeKeys = new Set<string>();

  let totalQuantidade = 0;
  let totalHlPerdido = 0;
  let totalValorAvaria = 0;

  const resumoPorArea: Record<string, { count: number; quantidade: number; valor: number; hl: number }> = {};
  const resumoPorMotivo: Record<string, { count: number; quantidade: number; valor: number; hl: number }> = {};
  const resumoPorMes: Record<string, { count: number; quantidade: number; valor: number; hl: number }> = {};
  const resumoPorColaborador: Record<string, { count: number; quantidade: number; valor: number; hl: number }> = {};

  rawList.forEach((rawItem, idx) => {
    const item: RawQuebraJsonItem = sanitizeData(rawItem);

    const rawData = item.Data || item.data || item.DATA || item['Data Lançamento'] || item['Data Lancamento'] || item.dataISO;
    const { dataISO, dataFormatada } = parseDates(rawData);

    const mes = String(item.Mês || item.Mes || item.mes || item.MÊS || item.MES || '').toUpperCase() || 
      new Date(dataISO + 'T00:00:00').toLocaleString('pt-BR', { month: 'long' }).toUpperCase();

    const codProduto = String(item.CodProduto ?? item.codProduto ?? item.CODPRODUTO ?? item.Produto ?? item.PRODUTO ?? item.codigo ?? item['Cód Produto'] ?? '0');
    const descricao = String(item.Descricao || item.descricao || item.DESCRICAO || item['Descrição'] || item['DESCRIÇÃO'] || item['Descrição Produto'] || 'PRODUTO NÃO IDENTIFICADO').trim().toUpperCase();

    // Quantidade
    let quantidade = 1;
    const rawQtd = item.Quantidade ?? item.quantidade ?? item.QUANTIDADE ?? item['QUANT UND.'] ?? item['QUANT UND'] ?? item.Qtd ?? item.qtd;
    if (typeof rawQtd === 'number') {
      quantidade = rawQtd;
    } else if (typeof rawQtd === 'string') {
      const parsedQtd = parseFloat(rawQtd.replace(',', '.'));
      if (!isNaN(parsedQtd)) quantidade = parsedQtd;
    }

    let area = String(item.Area || item.area || item.AREA || item.Setor || item.setor || 'ARMAZEM').trim().toUpperCase();
    if (!['ARMAZEM', 'ENTREGA', 'MERCADO', 'PUXADA'].includes(area)) {
      area = 'ARMAZEM';
    }

    let turno = String(item.Turno || item.turno || item.TURNO || 'MANHÃ').trim().toUpperCase();
    if (turno.includes('MANH')) turno = 'MANHÃ';
    else if (turno.includes('NOIT') || turno.includes('MADRUG')) turno = 'NOITE';
    else turno = 'MANHÃ';

    const codQuebra = String(item.CodQuebra ?? item.codQuebra ?? item.CODQUEBRA ?? item['Cod Quebra'] ?? item['COD QUEBRA'] ?? '539').trim();
    const motivo = String(item.Motivo || item.motivo || item.MOTIVO || item['Motivo Quebra'] || 'QUEBRA OPERACIONAL').trim().toUpperCase();

    const colaboradorQuebrou = String(item.Colaborador || item.colaborador || item.COLABORADOR || item['Colaborador Quebrou'] || item.Responsavel || item.responsavel || '').trim();
    const funcao = String(item.Funcao || item.funcao || item.FUNCAO || item['Função'] || item['FUNÇÃO'] || item.Cargo || item.cargo || '').trim().toUpperCase();

    // Valor Total da Avaria
    let valorTotal = 0;
    const rawTotal = item.valorTotal ?? item['VALOR TT'] ?? item['VALOR DA AVARIA'] ?? item['VALOR AVARIA'] ?? item.valorDaAvaria ?? item.valorAvaria ?? item.Valor;
    if (typeof rawTotal === 'number') {
      valorTotal = rawTotal;
    } else if (typeof rawTotal === 'string') {
      const parsedVal = parseFloat(rawTotal.replace(',', '.'));
      if (!isNaN(parsedVal)) valorTotal = parsedVal;
    }

    // Valor Unitário da Avaria
    let valorUnitario = 0;
    const rawUnit = item.valorUnitario ?? item['VALOR UNIT'] ?? item['VALOR UNITÁRIO'] ?? item['VALOR UNITARIO'];
    if (typeof rawUnit === 'number') {
      valorUnitario = rawUnit;
    } else if (typeof rawUnit === 'string') {
      const parsedUnit = parseFloat(rawUnit.replace(',', '.'));
      if (!isNaN(parsedUnit)) valorUnitario = parsedUnit;
    }

    if (valorTotal === 0 && valorUnitario > 0 && quantidade > 0) {
      valorTotal = valorUnitario * quantidade;
    } else if (valorUnitario === 0 && valorTotal > 0 && quantidade > 0) {
      valorUnitario = valorTotal / quantidade;
    } else if (valorUnitario === 0 && valorTotal > 0) {
      valorUnitario = valorTotal;
    }

    // HL Perdido
    let hlPerdido = 0;
    const rawHl = item['HECTO PERDIDO '] ?? item['HECTO PERDIDO'] ?? item['HECTOPERDIDO'] ?? item.hectoPerdido ?? item.hlPerdido ?? item['HECTO LITRO'] ?? item['HECTOLITRO'] ?? item.hectoLitro ?? item.fatorHl;
    if (typeof rawHl === 'number') {
      hlPerdido = rawHl;
    } else if (typeof rawHl === 'string') {
      const parsedHl = parseFloat(rawHl.replace(',', '.'));
      if (!isNaN(parsedHl)) hlPerdido = parsedHl;
    }

    // Deduplication check: se já tem id/_docId único, usa o ID para deduplicação
    const existingId = String(item.id || item._docId || item.docId || '').trim();
    if (existingId) {
      if (seenDedupeKeys.has(existingId)) {
        return;
      }
      seenDedupeKeys.add(existingId);
    } else {
      const dedupeKey = `${dataISO}_${codProduto}_${colaboradorQuebrou.toUpperCase()}_${area}_${turno}_${quantidade}_${codQuebra}_${motivo}`;
      if (seenDedupeKeys.has(dedupeKey)) {
        return;
      }
      seenDedupeKeys.add(dedupeKey);
    }

    const hash = Math.abs(
      (dataISO + codProduto + codQuebra + area + turno + idx).split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0)
    ).toString(36);

    const docId = existingId || `retro_quebra_${dataISO.replace(/-/g, '')}_${hash}_${idx}`;

    const quebraRow: QuebraRow = {
      _docId: docId,
      id: docId,
      empresaId: item.empresaId || empresaId,
      data: dataFormatada,
      dataISO,
      mes,
      codProduto,
      descricao,
      quantidade,
      caixas: item.caixas || Math.max(1, Math.round(quantidade / 12)),
      fatorHl: Number(item.fatorHl ?? (hlPerdido > 0 && quantidade > 0 ? hlPerdido / quantidade : 0.0035)),
      hlPerdido: Number(item.hlPerdido ?? hlPerdido),
      tipoMarca: item.tipoMarca,
      embalagem: item.embalagem,
      wqi: item.wqi,
      fiscal: item.fiscal,
      area,
      turno,
      codQuebra,
      motivo,
      valor: valorTotal,
      valorUnitario,
      valorTotal,
      colaborador: item.colaborador || colaboradorQuebrou || undefined,
      colaboradorQuebrou: colaboradorQuebrou || undefined,
      responsavel: colaboradorQuebrou || undefined,
      funcao: funcao || undefined,
      _criadoEm: item._criadoEm || item.criadoEm || new Date().toISOString()
    };

    const retroRecord: RetroactiveRecord = {
      id: docId,
      modulo: 'quebras',
      dataISO,
      dataFormatada,
      codigoProduto: codProduto,
      descricao: `${descricao} - Motivo: ${motivo} (${quantidade} un)`,
      quantidade,
      unidade: 'UN',
      valorFinanceiro: Math.round(valorTotal * 100) / 100,
      operador: colaboradorQuebrou || 'Operação Armazém',
      colaboradorAjudante: colaboradorQuebrou || 'Operação Armazém',
      setor: area,
      status: 'Concluído',
      observacoes: `Cód. Quebra: ${codQuebra} | Motivo: ${motivo} | Turno: ${turno} | Função: ${funcao || 'N/A'} | HL: ${hlPerdido}`,
      simuladoHistorico: true,
      criadoEm: new Date().toISOString()
    };

    quebraRows.push(quebraRow);
    retroactiveRecords.push(retroRecord);

    totalQuantidade += quantidade;
    totalHlPerdido += hlPerdido;
    totalValorAvaria += valorTotal;

    // Resumo por Área
    if (!resumoPorArea[area]) {
      resumoPorArea[area] = { count: 0, quantidade: 0, valor: 0, hl: 0 };
    }
    resumoPorArea[area].count += 1;
    resumoPorArea[area].quantidade += quantidade;
    resumoPorArea[area].valor += valorTotal;
    resumoPorArea[area].hl += hlPerdido;

    // Resumo por Motivo
    if (!resumoPorMotivo[motivo]) {
      resumoPorMotivo[motivo] = { count: 0, quantidade: 0, valor: 0, hl: 0 };
    }
    resumoPorMotivo[motivo].count += 1;
    resumoPorMotivo[motivo].quantidade += quantidade;
    resumoPorMotivo[motivo].valor += valorTotal;
    resumoPorMotivo[motivo].hl += hlPerdido;

    // Resumo por Mês
    if (!resumoPorMes[mes]) {
      resumoPorMes[mes] = { count: 0, quantidade: 0, valor: 0, hl: 0 };
    }
    resumoPorMes[mes].count += 1;
    resumoPorMes[mes].quantidade += quantidade;
    resumoPorMes[mes].valor += valorTotal;
    resumoPorMes[mes].hl += hlPerdido;

    // Resumo por Colaborador
    const colabKey = colaboradorQuebrou || 'NÃO IDENTIFICADO';
    if (!resumoPorColaborador[colabKey]) {
      resumoPorColaborador[colabKey] = { count: 0, quantidade: 0, valor: 0, hl: 0 };
    }
    resumoPorColaborador[colabKey].count += 1;
    resumoPorColaborador[colabKey].quantidade += quantidade;
    resumoPorColaborador[colabKey].valor += valorTotal;
    resumoPorColaborador[colabKey].hl += hlPerdido;
  });

  return {
    valid: errors.length === 0,
    quebraRows,
    retroactiveRecords,
    totalRecords: quebraRows.length,
    totalQuantidade,
    totalHlPerdido: Math.round(totalHlPerdido * 10000) / 10000,
    totalValorAvaria: Math.round(totalValorAvaria * 100) / 100,
    resumoPorArea,
    resumoPorMotivo,
    resumoPorMes,
    resumoPorColaborador,
    errors,
    warnings
  };
}

let cachedOfficialQuebrasRows: Record<string, QuebraRow[]> = {};

/**
 * Constrói a lista oficial em memória de QuebraRow para visualização nos Dashboards
 */
export function buildOfficialQuebrasRows(empresaId = 'demo'): QuebraRow[] {
  if (cachedOfficialQuebrasRows[empresaId] && cachedOfficialQuebrasRows[empresaId].length > 0) {
    return cachedOfficialQuebrasRows[empresaId];
  }

  const parsed = parseQuebrasJson(SAMPLE_QUEBRAS_JSON, empresaId);
  cachedOfficialQuebrasRows[empresaId] = parsed.quebraRows;
  return parsed.quebraRows;
}

let cachedOfficialQuebrasRetro: Record<string, RetroactiveRecord[]> = {};

export function invalidateOfficialQuebrasCache(empresaId?: string) {
  if (empresaId) {
    delete cachedOfficialQuebrasRows[empresaId];
    delete cachedOfficialQuebrasRetro[empresaId];
  } else {
    cachedOfficialQuebrasRows = {};
    cachedOfficialQuebrasRetro = {};
  }
}

/**
 * Converte o dataset oficial de Quebras em RetroactiveRecord para a Base Central
 */
export function buildOfficialQuebrasRetroactiveRecords(empresaId = 'demo', userNome = 'Sistema'): RetroactiveRecord[] {
  if (cachedOfficialQuebrasRetro[empresaId] && cachedOfficialQuebrasRetro[empresaId].length > 0) {
    return cachedOfficialQuebrasRetro[empresaId];
  }

  const parsed = parseQuebrasJson(SAMPLE_QUEBRAS_JSON, empresaId, userNome);
  cachedOfficialQuebrasRetro[empresaId] = parsed.retroactiveRecords;
  return parsed.retroactiveRecords;
}
