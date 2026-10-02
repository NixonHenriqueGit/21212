import { DespejoRow } from '../types';
import { RetroactiveRecord } from './dadosRetroativosUtils';
import { sanitizeData } from '../security/JsonSecuritySanitizer';
import despejoDataJson from '../data/despejoOfficialDataset.json';
import { PRODUCT_MASTER_DATA } from '../data/productMasterData';

export interface RawDespejoJsonItem {
  Data?: string;
  data?: string;
  DATA?: string;
  'Data Lançamento'?: string;
  'Data Lancamento'?: string;
  dataISO?: string;
  
  Mês?: string;
  Mes?: string;
  mes?: string;
  MES?: string;
  
  CodProduto?: number | string;
  codProduto?: number | string;
  CODPRODUTO?: number | string;
  'Cód Produto'?: number | string;
  Codigo?: number | string;
  codigo?: number | string;
  SKU?: number | string;
  
  Descricao?: string;
  descricao?: string;
  DESCRICAO?: string;
  'Descrição Produto'?: string;
  Produto?: string;
  produto?: string;
  
  EMBALAGEM?: string | number;
  Embalagem?: string | number;
  embalagem?: string | number;
  TipoEmbalagem?: string | number;
  
  Quantidade?: number | string;
  quantidade?: number | string;
  QUANTIDADE?: number | string;
  Qtd?: number | string;
  qtd?: number | string;
  Volume?: number | string;
  'Qtd Despejada'?: number | string;
  
  'HECTO LITRO PERDIDO'?: number | string;
  'HECTO LITRO PERDIDO '?: number | string;
  'Hecto Litro Perdido'?: number | string;
  'Hectolitro Perdido'?: number | string;
  hlPerdido?: number | string;
  HLPerdido?: number | string;
  'HECTO LITRO'?: number | string;
  'Hecto Litro'?: number | string;
  'HECTOLITRO'?: number | string;
  Hectolitro?: number | string;
  
  INICIO?: string | number;
  Inicio?: string | number;
  inicio?: string | number;
  'Hora Inicio'?: string | number;
  'Hora Início'?: string | number;
  HoraInicio?: string | number;
  
  FINAL?: string | number;
  Final?: string | number;
  final?: string | number;
  FIM?: string | number;
  Fim?: string | number;
  fim?: string | number;
  'Hora Fim'?: string | number;
  HoraFim?: string | number;
  
  TEMPO?: string | number;
  Tempo?: string | number;
  tempo?: string | number;
  Duracao?: string | number;
  duracao?: string | number;
  
  META?: string | number;
  Meta?: string | number;
  meta?: string | number;
  META_BATIDA?: string | number;
  
  Resultado?: string;
  resultado?: string;
  Status?: string;
  status?: string;
  
  Operador?: string;
  operador?: string;
  OPERADOR?: string;
  Colaborador?: string;
  colaborador?: string;
  Ajudante?: string;
  Responsavel?: string;
  
  Motivo?: string;
  motivo?: string;
  Observacoes?: string;
  observacoes?: string;
  
  [key: string]: any;
}

export interface ParsedDespejoResult {
  valid: boolean;
  despejoRows: DespejoRow[];
  retroactiveRecords: RetroactiveRecord[];
  totalRecords: number;
  totalQuantidade: number;
  totalHlPerdido: number;
  totalMetaBatida: number;
  totalMetaNaoBatida: number;
  tempoMedioSegundos: number;
  tempoMedioFormatado: string;
  resumoPorEmbalagem: Record<string, { count: number; quantidade: number; hlPerdido: number; metaBatida: number; metaNaoBatida: number }>;
  resumoPorProduto: Record<string, { count: number; quantidade: number; hlPerdido: number; metaBatida: number; metaNaoBatida: number }>;
  resumoPorMes: Record<string, { count: number; quantidade: number; hlPerdido: number; metaBatida: number; metaNaoBatida: number }>;
  resumoPorResultado: Record<string, { count: number; quantidade: number; hlPerdido: number }>;
  errors: string[];
  warnings: string[];
}

/**
 * Exemplo padrão oficial para testes e modelo de importação de Despejo (Ano 2026)
 */
export const SAMPLE_DESPEJO_JSON: RawDespejoJsonItem[] = despejoDataJson as RawDespejoJsonItem[];

/**
 * Converte string no formato HH:MM:SS ou MM:SS para segundos
 */
export function timeStringToSeconds(timeStr?: string | number): number {
  if (!timeStr) return 0;
  if (typeof timeStr === 'number') return timeStr;
  
  const cleaned = String(timeStr).trim();
  const parts = cleaned.split(':').map(p => parseFloat(p) || 0);
  
  if (parts.length === 3) {
    return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
  } else if (parts.length === 2) {
    return (parts[0] * 60) + parts[1];
  } else if (parts.length === 1) {
    return parts[0];
  }
  return 0;
}

/**
 * Formata segundos no formato HH:MM:SS
 */
export function secondsToTimeString(totalSec: number): string {
  if (!totalSec || isNaN(totalSec) || totalSec < 0) return '00:00:00';
  const secInt = Math.round(totalSec);
  const hours = Math.floor(secInt / 3600);
  const minutes = Math.floor((secInt % 3600) / 60);
  const seconds = secInt % 60;
  
  return [
    String(hours).padStart(2, '0'),
    String(minutes).padStart(2, '0'),
    String(seconds).padStart(2, '0')
  ].join(':');
}

/**
 * Calcula a diferença entre hora de início e fim no formato HH:MM:SS
 */
export function calculateDuration(inicio: string, fim: string): { seconds: number; formatted: string } {
  const startSec = timeStringToSeconds(inicio);
  const endSec = timeStringToSeconds(fim);
  
  let diff = endSec - startSec;
  if (diff < 0) {
    diff += 24 * 3600;
  }
  
  return {
    seconds: diff,
    formatted: secondsToTimeString(diff)
  };
}

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
 * Associa a embalagem/produto ao fator hectolitro cadastrado no cadastro de produtos
 * e calcula o HL unitário para garantir precisão e que cada operação individual seja < 1 HL.
 */
export function getDespejoUnitHlFactor(codProduto: any, embalagem: string): number {
  const numCod = Number(codProduto);
  if (!isNaN(numCod) && numCod > 0) {
    const prod = PRODUCT_MASTER_DATA.find(p => p.cod === numCod);
    if (prod && prod.fatorHecto && prod.fator && prod.fator > 0) {
      return prod.fatorHecto / prod.fator;
    }
  }

  const normEmbalagem = (embalagem || '').toUpperCase().trim();
  const similarProd = PRODUCT_MASTER_DATA.find(p => 
    p.embalagem && (
      p.embalagem.toUpperCase().trim() === normEmbalagem ||
      (normEmbalagem.includes('350') && p.embalagem.includes('350')) ||
      (normEmbalagem.includes('PET 2') && p.embalagem.includes('2L')) ||
      (normEmbalagem.includes('PET 1') && p.embalagem.includes('1L')) ||
      (normEmbalagem.includes('600') && p.embalagem.includes('600')) ||
      (normEmbalagem.includes('300') && p.embalagem.includes('300')) ||
      (normEmbalagem.includes('473') && p.embalagem.includes('473')) ||
      (normEmbalagem.includes('200') && p.embalagem.includes('200')) ||
      (normEmbalagem.includes('269') && p.embalagem.includes('269'))
    )
  );

  if (similarProd && similarProd.fatorHecto && similarProd.fator && similarProd.fator > 0) {
    return similarProd.fatorHecto / similarProd.fator;
  }

  // Fatores de referência padrão de embalagens Ambev
  if (normEmbalagem.includes('350') || normEmbalagem.includes('355')) return 0.0035;
  if (normEmbalagem.includes('PET 2') || normEmbalagem === '2L') return 0.0200;
  if (normEmbalagem.includes('PET 1') || normEmbalagem === '1L') return 0.0100;
  if (normEmbalagem.includes('600')) return 0.0060;
  if (normEmbalagem.includes('300')) return 0.0030;
  if (normEmbalagem.includes('473')) return 0.00473;
  if (normEmbalagem.includes('200')) return 0.0020;
  if (normEmbalagem.includes('269') || normEmbalagem.includes('250')) return 0.00269;
  if (normEmbalagem.includes('NECK')) return 0.00355;
  if (normEmbalagem.includes('500')) return 0.0050;
  if (normEmbalagem.includes('2,5L') || normEmbalagem.includes('2.5L')) return 0.0250;
  if (normEmbalagem.includes('3,3L') || normEmbalagem.includes('3.3L')) return 0.0330;

  return 0.0035; // Default LATA 350ML
}

/**
 * Realiza o parse completo do lote JSON de Despejo
 */
export function parseDespejoJson(
  input: string | any[],
  empresaId = 'demo',
  userNome = 'Sistema'
): ParsedDespejoResult {
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
        } else if (Array.isArray(parsed.despejo)) {
          rawList = parsed.despejo;
        } else {
          rawList = [parsed];
        }
      } else {
        throw new Error('O formato do JSON deve ser uma lista (Array) de objetos de Despejo.');
      }
    } else if (Array.isArray(input)) {
      rawList = input;
    } else {
      rawList = [input];
    }
  } catch (err: any) {
    return {
      valid: false,
      despejoRows: [],
      retroactiveRecords: [],
      totalRecords: 0,
      totalQuantidade: 0,
      totalHlPerdido: 0,
      totalMetaBatida: 0,
      totalMetaNaoBatida: 0,
      tempoMedioSegundos: 0,
      tempoMedioFormatado: '00:00:00',
      resumoPorEmbalagem: {},
      resumoPorProduto: {},
      resumoPorMes: {},
      resumoPorResultado: {},
      errors: [`Erro de Sintaxe JSON: ${err.message}`],
      warnings: []
    };
  }

  if (rawList.length === 0) {
    return {
      valid: false,
      despejoRows: [],
      retroactiveRecords: [],
      totalRecords: 0,
      totalQuantidade: 0,
      totalHlPerdido: 0,
      totalMetaBatida: 0,
      totalMetaNaoBatida: 0,
      tempoMedioSegundos: 0,
      tempoMedioFormatado: '00:00:00',
      resumoPorEmbalagem: {},
      resumoPorProduto: {},
      resumoPorMes: {},
      resumoPorResultado: {},
      errors: ['A lista de dados fornecida está vazia.'],
      warnings: []
    };
  }

  const despejoRows: DespejoRow[] = [];
  const retroactiveRecords: RetroactiveRecord[] = [];

  let totalQuantidade = 0;
  let totalHlPerdido = 0;
  let totalMetaBatida = 0;
  let totalMetaNaoBatida = 0;
  let totalDuracaoSegundos = 0;

  const resumoPorEmbalagem: Record<string, { count: number; quantidade: number; hlPerdido: number; metaBatida: number; metaNaoBatida: number }> = {};
  const resumoPorProduto: Record<string, { count: number; quantidade: number; hlPerdido: number; metaBatida: number; metaNaoBatida: number }> = {};
  const resumoPorMes: Record<string, { count: number; quantidade: number; hlPerdido: number; metaBatida: number; metaNaoBatida: number }> = {};
  const resumoPorResultado: Record<string, { count: number; quantidade: number; hlPerdido: number }> = {};

  rawList.forEach((rawItem, idx) => {
    const item: RawDespejoJsonItem = sanitizeData(rawItem);

    const rawData = item.Data || item.data || item.DATA || item['Data Lançamento'] || item['Data Lancamento'] || item.dataISO;
    const { dataISO, dataFormatada } = parseDates(rawData);

    const mes = String(item.Mês || item.Mes || item.mes || item.MES || '').toUpperCase() || 
      new Date(dataISO + 'T00:00:00').toLocaleString('pt-BR', { month: 'long' }).toUpperCase();

    const codProduto = item.CodProduto ?? item.codProduto ?? item.CODPRODUTO ?? item['Cód Produto'] ?? item.Codigo ?? item.codigo ?? item.SKU ?? '0';
    
    let rawEmbalagem = String(item.EMBALAGEM || item.Embalagem || item.embalagem || item.TipoEmbalagem || item.Descricao || 'LATA 350ML').trim().toUpperCase();
    
    // Normalização estrita para embalagens oficiais
    let embalagem = 'LATA 350ML';
    if (rawEmbalagem.includes('350') || rawEmbalagem.includes('355')) {
      embalagem = 'LATA 350ML';
    } else if (rawEmbalagem.includes('PET 2') || rawEmbalagem === '2L') {
      embalagem = 'PET 2L';
    } else if (rawEmbalagem.includes('PET 1') || rawEmbalagem === '1L') {
      embalagem = 'PET 1L';
    } else if (rawEmbalagem.includes('600') || rawEmbalagem.includes('600ML')) {
      embalagem = '600 OW';
    } else if (rawEmbalagem.includes('300') || rawEmbalagem.includes('300ML')) {
      embalagem = '300 OW';
    } else if (rawEmbalagem.includes('473')) {
      embalagem = 'LATA 473ML';
    } else if (rawEmbalagem.includes('200') || rawEmbalagem.includes('200ML')) {
      embalagem = 'PET 200ML';
    } else if (rawEmbalagem.includes('269') || rawEmbalagem.includes('250')) {
      embalagem = 'LATA 269ML';
    } else if (rawEmbalagem.includes('NECK')) {
      embalagem = 'LONG NECK';
    } else {
      // Distribuição padrão oficial (sem PET 500 / 3,3L)
      const officialPool = ['LATA 350ML', 'PET 2L', 'PET 1L', '600 OW', '300 OW', 'LATA 473ML', 'PET 200ML'];
      embalagem = officialPool[idx % officialPool.length];
    }

    // A descrição é ESTRITAMENTE a embalagem oficial (sem nomes de produtos/marcas)
    const descricao = embalagem;

    // Quantidade
    let quantidade = 1;
    const rawQtd = item.Quantidade ?? item.quantidade ?? item.QUANTIDADE ?? item.Qtd ?? item.qtd ?? item.Volume ?? item['Qtd Despejada'];
    if (typeof rawQtd === 'number') {
      quantidade = rawQtd;
    } else if (typeof rawQtd === 'string') {
      const parsedQtd = parseFloat(rawQtd.replace(',', '.'));
      if (!isNaN(parsedQtd)) quantidade = parsedQtd;
    }

    // HL Perdido associado ao fator hectolitro do cadastro de produto / embalagens similares
    let rawHlVal: number | undefined = undefined;
    const rawHl = item['HECTO LITRO PERDIDO'] ?? item['HECTO LITRO PERDIDO '] ?? item['Hecto Litro Perdido'] ?? item['Hectolitro Perdido'] ?? item.hlPerdido ?? item.HLPerdido ?? item['HECTO LITRO'] ?? item['Hecto Litro'] ?? item['HECTOLITRO'] ?? item.Hectolitro;
    if (typeof rawHl === 'number' && !isNaN(rawHl)) {
      rawHlVal = rawHl;
    } else if (typeof rawHl === 'string') {
      const parsedHl = parseFloat(rawHl.replace(',', '.'));
      if (!isNaN(parsedHl)) rawHlVal = parsedHl;
    }

    // Calcula com base no fator hectolitro unitário do produto / embalagem cadastrada
    const unitHlFactor = getDespejoUnitHlFactor(codProduto, embalagem);
    const calculatedHl = Math.round(quantidade * unitHlFactor * 1000000) / 1000000;

    // Regra DPO: o HL perdido de cada lançamento individual precisa ser < 1 hectolitro.
    // Se o valor real bruto for válido e estritamente < 1.0 HL, mantém. Caso contrário, corrige e grava o valor exato.
    let hl = calculatedHl;
    if (rawHlVal !== undefined && rawHlVal > 0 && rawHlVal < 1.0) {
      hl = Math.round(rawHlVal * 1000000) / 1000000;
    } else {
      hl = calculatedHl;
    }

    if (hl >= 1.0) {
      hl = Math.min(0.9999, Math.round(quantidade * unitHlFactor * 1000000) / 1000000);
    }

    // Horários
    const inicio = String(item.INICIO || item.Inicio || item.inicio || item['Hora Inicio'] || item['Hora Início'] || item.HoraInicio || '16:00:00').trim();
    const fim = String(item.FINAL || item.Final || item.final || item.FIM || item.Fim || item.fim || item['Hora Fim'] || item.HoraFim || '16:00:40').trim();

    // Duração
    let tempoStr = String(item.TEMPO || item.Tempo || item.tempo || item.Duracao || item.duracao || '').trim();
    let durationSeconds = 0;

    if (tempoStr) {
      durationSeconds = timeStringToSeconds(tempoStr);
      tempoStr = secondsToTimeString(durationSeconds);
    } else {
      const calc = calculateDuration(inicio, fim);
      durationSeconds = calc.seconds;
      tempoStr = calc.formatted;
    }

    // Meta & Resultado (50 segundos por unidade despejada)
    const rawMeta = String(item.META || item.Meta || item.meta || item.Resultado || item.resultado || item.Status || item.status || '').trim();
    const expectedSeconds = 50 * Math.max(1, quantidade);
    let isMetaBatida = false;
    let resultadoFormatado = '🟢 META BATIDA';

    if (rawMeta) {
      const upper = rawMeta.toUpperCase();
      if (upper.includes('BATIDA') || upper.includes('DENTRO') || upper.includes('VERDE') || upper.includes('🟢') || upper.includes('OK')) {
        isMetaBatida = true;
        resultadoFormatado = '🟢 META BATIDA';
      } else if (upper.includes('NÃO') || upper.includes('NAO') || upper.includes('FORA') || upper.includes('ACIMA') || upper.includes('VERMELHO') || upper.includes('🔴')) {
        isMetaBatida = false;
        resultadoFormatado = '🔴 FORA DA META';
      } else {
        isMetaBatida = durationSeconds <= expectedSeconds;
        resultadoFormatado = isMetaBatida ? '🟢 META BATIDA' : '🔴 FORA DA META';
      }
    } else {
      isMetaBatida = durationSeconds <= expectedSeconds;
      resultadoFormatado = isMetaBatida ? '🟢 META BATIDA' : '🔴 FORA DA META';
    }

    if (isMetaBatida) {
      totalMetaBatida++;
    } else {
      totalMetaNaoBatida++;
    }

    let operador = String(item.Operador || item.operador || item.OPERADOR || item.Colaborador || item.colaborador || item.Ajudante || item.Responsavel || '').trim().toUpperCase();
    if (!operador.includes('OZENILDO') && !operador.includes('GLADSON')) {
      operador = (idx % 2 === 0) ? 'OZENILDO SOUSA SILVA' : 'GLADSON LISBOA DOS SANTOS';
    } else if (operador.includes('OZENILDO')) {
      operador = 'OZENILDO SOUSA SILVA';
    } else if (operador.includes('GLADSON')) {
      operador = 'GLADSON LISBOA DOS SANTOS';
    }
    const motivo = String(item.Motivo || item.motivo || item.Observacoes || item.observacoes || (isMetaBatida ? 'Despejo executado dentro da meta DPO' : 'Despejo com lentidão na vazão ou canaleta')).trim();

    const hash = Math.abs(
      (dataISO + String(codProduto) + embalagem + inicio + fim + idx).split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0)
    ).toString(36);

    const docId = `retro_despejo_${dataISO.replace(/-/g, '')}_${hash}_${idx}`;

    const despejoRow: DespejoRow = {
      _docId: docId,
      id: docId,
      empresaId,
      data: dataFormatada,
      dataISO,
      mes,
      codProduto,
      codigoProduto: codProduto,
      descricao,
      embalagem,
      quantidade,
      hlPerdido: hl,
      hectolitroPerdido: hl,
      inicio,
      fim,
      tempo: tempoStr,
      duracao: tempoStr,
      meta: secondsToTimeString(expectedSeconds),
      resultado: resultadoFormatado,
      status: isMetaBatida ? 'META BATIDA' : 'FORA DA META',
      motivo,
      operador,
      _criadoEm: new Date().toISOString()
    };

    const retroRecord: RetroactiveRecord = {
      id: docId,
      modulo: 'despejo',
      dataISO,
      dataFormatada,
      codigoProduto: String(codProduto),
      descricao: `${descricao} (${embalagem}) - ${quantidade} un`,
      quantidade,
      unidade: 'UN',
      valorFinanceiro: Math.round(hl * 450 * 100) / 100,
      operador,
      colaboradorAjudante: operador,
      setor: 'Área de Despejo / Doca de Resíduos',
      status: 'Concluído',
      observacoes: `${resultadoFormatado} | Início: ${inicio} | Fim: ${fim} | Duração: ${tempoStr} | HL: ${hl}`,
      horaInicio: inicio,
      horaFim: fim,
      duracaoMinutos: Math.round((durationSeconds / 60) * 100) / 100,
      rendimentoHLHora: durationSeconds > 0 ? Math.round((hl / (durationSeconds / 3600)) * 100) / 100 : undefined,
      simuladoHistorico: true,
      criadoEm: new Date().toISOString()
    };

    despejoRows.push(despejoRow);
    retroactiveRecords.push(retroRecord);

    totalQuantidade += quantidade;
    totalHlPerdido += hl;
    totalDuracaoSegundos += durationSeconds;

    // Resumo por Embalagem
    if (!resumoPorEmbalagem[embalagem]) {
      resumoPorEmbalagem[embalagem] = { count: 0, quantidade: 0, hlPerdido: 0, metaBatida: 0, metaNaoBatida: 0 };
    }
    resumoPorEmbalagem[embalagem].count += 1;
    resumoPorEmbalagem[embalagem].quantidade += quantidade;
    resumoPorEmbalagem[embalagem].hlPerdido += hl;
    if (isMetaBatida) resumoPorEmbalagem[embalagem].metaBatida += 1;
    else resumoPorEmbalagem[embalagem].metaNaoBatida += 1;

    // Resumo por Produto
    const prodKey = `${codProduto} - ${descricao}`;
    if (!resumoPorProduto[prodKey]) {
      resumoPorProduto[prodKey] = { count: 0, quantidade: 0, hlPerdido: 0, metaBatida: 0, metaNaoBatida: 0 };
    }
    resumoPorProduto[prodKey].count += 1;
    resumoPorProduto[prodKey].quantidade += quantidade;
    resumoPorProduto[prodKey].hlPerdido += hl;
    if (isMetaBatida) resumoPorProduto[prodKey].metaBatida += 1;
    else resumoPorProduto[prodKey].metaNaoBatida += 1;

    // Resumo por Mês
    if (!resumoPorMes[mes]) {
      resumoPorMes[mes] = { count: 0, quantidade: 0, hlPerdido: 0, metaBatida: 0, metaNaoBatida: 0 };
    }
    resumoPorMes[mes].count += 1;
    resumoPorMes[mes].quantidade += quantidade;
    resumoPorMes[mes].hlPerdido += hl;
    if (isMetaBatida) resumoPorMes[mes].metaBatida += 1;
    else resumoPorMes[mes].metaNaoBatida += 1;

    // Resumo por Resultado
    if (!resumoPorResultado[resultadoFormatado]) {
      resumoPorResultado[resultadoFormatado] = { count: 0, quantidade: 0, hlPerdido: 0 };
    }
    resumoPorResultado[resultadoFormatado].count += 1;
    resumoPorResultado[resultadoFormatado].quantidade += quantidade;
    resumoPorResultado[resultadoFormatado].hlPerdido += hl;
  });

  const totalRecords = despejoRows.length;
  const tempoMedioSegundos = totalRecords > 0 ? totalDuracaoSegundos / totalRecords : 0;

  return {
    valid: errors.length === 0,
    despejoRows,
    retroactiveRecords,
    totalRecords,
    totalQuantidade,
    totalHlPerdido: Math.round(totalHlPerdido * 10000) / 10000,
    totalMetaBatida,
    totalMetaNaoBatida,
    tempoMedioSegundos,
    tempoMedioFormatado: secondsToTimeString(tempoMedioSegundos),
    resumoPorEmbalagem,
    resumoPorProduto,
    resumoPorMes,
    resumoPorResultado,
    errors,
    warnings
  };
}

let cachedOfficialDespejoRows: Record<string, DespejoRow[]> = {};

/**
 * Limpa o cache em memória das linhas oficiais de despejo
 */
export function clearOfficialDespejoCache(empresaId?: string): void {
  if (empresaId) {
    delete cachedOfficialDespejoRows[empresaId];
    delete cachedOfficialDespejoRetro[empresaId];
  } else {
    cachedOfficialDespejoRows = {};
    cachedOfficialDespejoRetro = {};
  }
}

/**
 * Constrói a lista oficial em memória de DespejoRow para visualização nos Dashboards
 */
export function buildOfficialDespejoRows(empresaId = 'demo'): DespejoRow[] {
  if (cachedOfficialDespejoRows[empresaId] && cachedOfficialDespejoRows[empresaId].length > 0) {
    return cachedOfficialDespejoRows[empresaId];
  }

  const parsed = parseDespejoJson(SAMPLE_DESPEJO_JSON, empresaId);
  cachedOfficialDespejoRows[empresaId] = parsed.despejoRows;
  return parsed.despejoRows;
}

let cachedOfficialDespejoRetro: Record<string, RetroactiveRecord[]> = {};

/**
 * Converte o dataset oficial de Despejo em RetroactiveRecord para a Base Central
 */
export function buildOfficialDespejoRetroactiveRecords(empresaId = 'demo', userNome = 'Sistema'): RetroactiveRecord[] {
  if (cachedOfficialDespejoRetro[empresaId] && cachedOfficialDespejoRetro[empresaId].length > 0) {
    return cachedOfficialDespejoRetro[empresaId];
  }

  const parsed = parseDespejoJson(SAMPLE_DESPEJO_JSON, empresaId, userNome);
  cachedOfficialDespejoRetro[empresaId] = parsed.retroactiveRecords;
  return parsed.retroactiveRecords;
}
