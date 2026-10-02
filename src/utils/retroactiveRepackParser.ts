import { DespejoRow, RepackRow } from '../types';
import { RetroactiveRecord } from './dadosRetroativosUtils';
import { sanitizeData } from '../security/JsonSecuritySanitizer';
import { OFFICIAL_REPACK_DATA_JSON } from './repackDefaultData';

export interface RawRepackJsonItem {
  Data?: string;
  data?: string;
  DATA?: string;
  'Data Lançamento'?: string;
  'Data Lancamento'?: string;
  dataISO?: string;
  
  Embalagem?: string;
  embalagem?: string;
  EMBALAGEM?: string;
  Produto?: string;
  produto?: string;
  PRODUTO?: string;
  SKU?: string;
  Descricao?: string;
  descricao?: string;
  
  Quantidade?: number | string;
  quantidade?: number | string;
  QUANTIDADE?: number | string;
  Qtd?: number | string;
  qtd?: number | string;
  Volume?: number | string;
  'Qtd Caixas'?: number | string;
  'Qtd Despejada'?: number | string;
  
  Inicio?: string;
  inicio?: string;
  INICIO?: string;
  'Hora Inicio'?: string;
  'Hora Início'?: string;
  HoraInicio?: string;
  hora_inicio?: string;
  
  Fim?: string;
  fim?: string;
  FIM?: string;
  'Hora Fim'?: string;
  HoraFim?: string;
  hora_fim?: string;
  
  Tempo?: string;
  tempo?: string;
  TEMPO?: string;
  Duracao?: string | number;
  duracao?: string | number;
  
  Meta?: string | number;
  meta?: string | number;
  META?: string | number;
  'Tempo Meta'?: string | number;
  
  Resultado?: string;
  resultado?: string;
  RESULTADO?: string;
  Status?: string;
  status?: string;
  
  Operador?: string;
  operador?: string;
  OPERADOR?: string;
  Colaborador?: string;
  colaborador?: string;
  Ajudante?: string;
  Responsavel?: string;
  responsavel?: string;
  
  Motivo?: string;
  motivo?: string;
  Observacoes?: string;
  observacoes?: string;
  Obs?: string;
  obs?: string;
  
  [key: string]: any;
}

export interface ParsedRepackResult {
  valid: boolean;
  despejoRows: DespejoRow[];
  repackRows: RepackRow[];
  retroactiveRecords: RetroactiveRecord[];
  totalRecords: number;
  totalQuantidade: number;
  totalDentroDaMeta: number;
  totalAcimaDaMeta: number;
  tempoMedioSegundos: number;
  tempoMedioFormatado: string;
  metaMediaSegundos: number;
  metaMediaFormatada: string;
  resumoPorEmbalagem: Record<string, { count: number; quantidade: number; dentroMeta: number; acimaMeta: number }>;
  resumoPorOperador: Record<string, { count: number; quantidade: number; dentroMeta: number; acimaMeta: number }>;
  resumoPorResultado: Record<string, { count: number; quantidade: number }>;
  resumoPorData: Record<string, { count: number; quantidade: number; dentroMeta: number; acimaMeta: number }>;
  errors: string[];
  warnings: string[];
}

/**
 * Exemplo padrão oficial para testes e modelo de importação de Repack (Ano 2026)
 */
export const SAMPLE_REPACK_JSON: RawRepackJsonItem[] = OFFICIAL_REPACK_DATA_JSON;

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
    return parts[0] * 60; // assume minutos se apenas número
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
    // Virada de turno/meia-noite (+ 24 horas)
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
 * Realiza o parse completo do lote JSON de Repack, com validações,
 * sanitizações de segurança e normalizações de negócio.
 */
export function parseRepackJson(
  input: string | any[],
  empresaId = 'demo',
  userNome = 'Sistema'
): ParsedRepackResult {
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
        } else if (Array.isArray(parsed.repack)) {
          rawList = parsed.repack;
        } else {
          rawList = [parsed];
        }
      } else {
        throw new Error('O formato do JSON deve ser uma lista (Array) de objetos de Repack.');
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
      repackRows: [],
      retroactiveRecords: [],
      totalRecords: 0,
      totalQuantidade: 0,
      totalDentroDaMeta: 0,
      totalAcimaDaMeta: 0,
      tempoMedioSegundos: 0,
      tempoMedioFormatado: '00:00:00',
      metaMediaSegundos: 0,
      metaMediaFormatada: '00:00:00',
      resumoPorEmbalagem: {},
      resumoPorOperador: {},
      resumoPorResultado: {},
      resumoPorData: {},
      errors: [`Erro de Sintaxe JSON: ${err.message}`],
      warnings: []
    };
  }

  if (rawList.length === 0) {
    return {
      valid: false,
      despejoRows: [],
      repackRows: [],
      retroactiveRecords: [],
      totalRecords: 0,
      totalQuantidade: 0,
      totalDentroDaMeta: 0,
      totalAcimaDaMeta: 0,
      tempoMedioSegundos: 0,
      tempoMedioFormatado: '00:00:00',
      metaMediaSegundos: 0,
      metaMediaFormatada: '00:00:00',
      resumoPorEmbalagem: {},
      resumoPorOperador: {},
      resumoPorResultado: {},
      resumoPorData: {},
      errors: ['A lista de dados fornecida está vazia.'],
      warnings: []
    };
  }

  const despejoRows: DespejoRow[] = [];
  const repackRows: RepackRow[] = [];
  const retroactiveRecords: RetroactiveRecord[] = [];

  let totalQuantidade = 0;
  let totalDentroDaMeta = 0;
  let totalAcimaDaMeta = 0;
  let totalDuracaoSegundos = 0;
  let totalMetaSegundos = 0;

  const resumoPorEmbalagem: Record<string, { count: number; quantidade: number; dentroMeta: number; acimaMeta: number }> = {};
  const resumoPorOperador: Record<string, { count: number; quantidade: number; dentroMeta: number; acimaMeta: number }> = {};
  const resumoPorResultado: Record<string, { count: number; quantidade: number }> = {};
  const resumoPorData: Record<string, { count: number; quantidade: number; dentroMeta: number; acimaMeta: number }> = {};

  rawList.forEach((rawItem, idx) => {
    // 1. Sanitização
    const item: RawRepackJsonItem = sanitizeData(rawItem);
    const lineNum = idx + 1;

    // 2. Extração de Campos
    const rawData = item.Data || item.data || item.DATA || item['Data Lançamento'] || item['Data Lancamento'] || item.dataISO;
    const { dataISO, dataFormatada } = parseDates(rawData);

    const embalagem = String(
      item.Embalagem || 
      item.embalagem || 
      item.EMBALAGEM || 
      item.Produto || 
      item.produto || 
      item.PRODUTO || 
      item.SKU || 
      item.Descricao || 
      item.descricao || 
      'PET 2,5L'
    ).trim().toUpperCase();

    // Quantidade
    let quantidade = 1;
    const rawQtd = item.Quantidade ?? item.quantidade ?? item.QUANTIDADE ?? item.Qtd ?? item.qtd ?? item.Volume ?? item['Qtd Caixas'] ?? item['Qtd Despejada'];
    if (typeof rawQtd === 'number') {
      quantidade = rawQtd;
    } else if (typeof rawQtd === 'string') {
      const parsedQtd = parseFloat(rawQtd.replace(',', '.'));
      if (!isNaN(parsedQtd)) quantidade = parsedQtd;
    }

    // Horários
    const inicio = String(
      item.Inicio || 
      item.inicio || 
      item.INICIO || 
      item['Hora Inicio'] || 
      item['Hora Início'] || 
      item.HoraInicio || 
      item.hora_inicio || 
      '08:00:00'
    ).trim();

    const fim = String(
      item.Fim || 
      item.fim || 
      item.FIM || 
      item['Hora Fim'] || 
      item.HoraFim || 
      item.hora_fim || 
      '08:05:00'
    ).trim();

    // Meta
    const metaStr = String(
      item.Meta || 
      item.meta || 
      item.META || 
      item['Tempo Meta'] || 
      '00:04:30'
    ).trim();

    const metaSeconds = timeStringToSeconds(metaStr);

    // Duração calculada ou fornecida
    let tempoStr = String(item.Tempo || item.tempo || item.TEMPO || '').trim();
    let durationSeconds = 0;

    if (tempoStr) {
      durationSeconds = timeStringToSeconds(tempoStr);
    } else {
      const calc = calculateDuration(inicio, fim);
      durationSeconds = calc.seconds;
      tempoStr = calc.formatted;
    }

    const duracaoMinutos = Math.round((durationSeconds / 60) * 100) / 100;

    // Resultado
    let rawResultado = String(item.Resultado || item.resultado || item.RESULTADO || item.Status || item.status || '').trim();
    let isDentro = false;

    if (rawResultado) {
      const upper = rawResultado.toUpperCase();
      if (upper.includes('DENTRO') || upper.includes('VERDE') || upper.includes('OK') || upper.includes('🟢')) {
        isDentro = true;
        rawResultado = '🟢 DENTRO DA META';
      } else if (upper.includes('ACIMA') || upper.includes('FORA') || upper.includes('VERMELHO') || upper.includes('🔴')) {
        isDentro = false;
        rawResultado = '🔴 ACIMA DA META';
      } else {
        isDentro = durationSeconds <= metaSeconds;
        rawResultado = isDentro ? '🟢 DENTRO DA META' : '🔴 ACIMA DA META';
      }
    } else {
      isDentro = durationSeconds <= metaSeconds;
      rawResultado = isDentro ? '🟢 DENTRO DA META' : '🔴 ACIMA DA META';
    }

    if (isDentro) {
      totalDentroDaMeta++;
    } else {
      totalAcimaDaMeta++;
    }

    // Operador
    const operador = String(
      item.Operador || 
      item.operador || 
      item.OPERADOR || 
      item.Colaborador || 
      item.colaborador || 
      item.Ajudante || 
      item.Responsavel || 
      item.responsavel || 
      'OPERADOR REPACK'
    ).trim().toUpperCase();

    // Observações / Motivo
    const motivo = String(item.Motivo || item.motivo || item.Observacoes || item.observacoes || item.Obs || item.obs || '').trim();

    // Identificador único determinístico
    const hash = Math.abs(
      (dataISO + embalagem + inicio + fim + operador + idx).split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0)
    ).toString(36);

    const docId = `retro_repack_${dataISO.replace(/-/g, '')}_${hash}_${idx}`;

    // 3. Montar DespejoRow
    const despejoRow: DespejoRow = {
      _docId: docId,
      id: docId,
      empresaId,
      data: dataFormatada,
      dataISO,
      embalagem,
      quantidade,
      inicio,
      fim,
      tempo: tempoStr,
      duracao: duracaoMinutos,
      meta: metaStr,
      resultado: rawResultado,
      status: isDentro ? 'DENTRO DA META' : 'ACIMA DA META',
      motivo: motivo || (isDentro ? 'Execução padrão de Repack' : 'Desvio de tempo em relação à meta'),
      operador,
      _criadoEm: new Date().toISOString()
    };

    // 4. Montar RepackRow complementar
    const repackRow: RepackRow = {
      _docId: `repack_unit_${docId}`,
      id: `repack_unit_${docId}`,
      empresaId,
      data: dataFormatada,
      dataISO,
      embalagem,
      quantidade,
      inicio,
      fim,
      duracao: tempoStr,
      meta: metaStr,
      resultado: rawResultado,
      motivoNaoBaterMeta: motivo || (!isDentro ? 'Desvio em relação à meta' : undefined),
      operador,
      _criadoEm: new Date().toISOString()
    };

    // 5. Montar RetroactiveRecord
    const retroRecord: RetroactiveRecord = {
      id: docId,
      modulo: 'despejo_repack',
      dataISO,
      dataFormatada,
      codigoProduto: embalagem,
      descricao: `Repack ${embalagem} (${quantidade} un)`,
      quantidade,
      unidade: 'CX',
      valorFinanceiro: quantidade * 45, // Valor estimado de referência DPO
      operador,
      colaboradorAjudante: operador,
      setor: 'Área de Repack / Despejo',
      status: 'Concluído',
      observacoes: `${rawResultado} | Início: ${inicio} | Fim: ${fim} | Meta: ${metaStr} | Duração: ${tempoStr}`,
      horaInicio: inicio,
      horaFim: fim,
      duracaoMinutos,
      rendimentoHLHora: quantidade > 0 && duracaoMinutos > 0 ? Math.round((quantidade / (duracaoMinutos / 60)) * 10) / 10 : undefined,
      simuladoHistorico: true,
      criadoEm: new Date().toISOString()
    };

    despejoRows.push(despejoRow);
    repackRows.push(repackRow);
    retroactiveRecords.push(retroRecord);

    // Acumuladores
    totalQuantidade += quantidade;
    totalDuracaoSegundos += durationSeconds;
    totalMetaSegundos += metaSeconds;

    // Resumo por Embalagem
    if (!resumoPorEmbalagem[embalagem]) {
      resumoPorEmbalagem[embalagem] = { count: 0, quantidade: 0, dentroMeta: 0, acimaMeta: 0 };
    }
    resumoPorEmbalagem[embalagem].count += 1;
    resumoPorEmbalagem[embalagem].quantidade += quantidade;
    if (isDentro) resumoPorEmbalagem[embalagem].dentroMeta += 1;
    else resumoPorEmbalagem[embalagem].acimaMeta += 1;

    // Resumo por Operador
    if (!resumoPorOperador[operador]) {
      resumoPorOperador[operador] = { count: 0, quantidade: 0, dentroMeta: 0, acimaMeta: 0 };
    }
    resumoPorOperador[operador].count += 1;
    resumoPorOperador[operador].quantidade += quantidade;
    if (isDentro) resumoPorOperador[operador].dentroMeta += 1;
    else resumoPorOperador[operador].acimaMeta += 1;

    // Resumo por Resultado
    if (!resumoPorResultado[rawResultado]) {
      resumoPorResultado[rawResultado] = { count: 0, quantidade: 0 };
    }
    resumoPorResultado[rawResultado].count += 1;
    resumoPorResultado[rawResultado].quantidade += quantidade;

    // Resumo por Data
    if (!resumoPorData[dataISO]) {
      resumoPorData[dataISO] = { count: 0, quantidade: 0, dentroMeta: 0, acimaMeta: 0 };
    }
    resumoPorData[dataISO].count += 1;
    resumoPorData[dataISO].quantidade += quantidade;
    if (isDentro) resumoPorData[dataISO].dentroMeta += 1;
    else resumoPorData[dataISO].acimaMeta += 1;
  });

  const totalRecords = despejoRows.length;
  const tempoMedioSegundos = totalRecords > 0 ? totalDuracaoSegundos / totalRecords : 0;
  const metaMediaSegundos = totalRecords > 0 ? totalMetaSegundos / totalRecords : 0;

  return {
    valid: errors.length === 0,
    despejoRows,
    repackRows,
    retroactiveRecords,
    totalRecords,
    totalQuantidade,
    totalDentroDaMeta,
    totalAcimaDaMeta,
    tempoMedioSegundos,
    tempoMedioFormatado: secondsToTimeString(tempoMedioSegundos),
    metaMediaSegundos,
    metaMediaFormatada: secondsToTimeString(metaMediaSegundos),
    resumoPorEmbalagem,
    resumoPorOperador,
    resumoPorResultado,
    resumoPorData,
    errors,
    warnings
  };
}
