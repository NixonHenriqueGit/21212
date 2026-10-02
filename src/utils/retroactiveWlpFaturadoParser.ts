/**
 * Parser e validador oficial para importação retroativa em JSON do:
 * Painel Estratégico de Volume Faturado (HL), Pontos de Jornada & Indicadores de Absenteísmo
 */

import { JornadaRecord, WlpDailyFaturadoRecord, calcularDuracaoHorasComIntervalo, normalizeMesAnoStr, isDisallowedSaturday } from './jornadaUtils';
import { RetroactiveRecord } from './dadosRetroativosUtils';
import { normalizeCollaboratorName, getCollaboratorOfficialInfo } from './colaboradorUtils';
import { LISTA_COLABORADORES_OFICIAIS } from '../components/RankingModule';

export interface RawWlpFaturadoJsonItem {
  Data?: string;
  data?: string;
  DATA?: string;
  "Volume Faturado (HL)"?: number | string;
  "Volume Faturado"?: number | string;
  "Volume"?: number | string;
  volumeHL?: number | string;
  "VOLUME FATURADO (HL)"?: number | string;
  "Colaborador (ID)"?: string;
  Colaborador?: string;
  Nome?: string;
  COLABORADOR?: string;
  colaboradorNome?: string;
  Cargo?: string;
  cargo?: string;
  CARGO?: string;
  "Hora Início (HH:MM)"?: string;
  "Hora Início"?: string;
  "Hora Inicio"?: string;
  horaInicio?: string;
  "HORA INICIO"?: string;
  "Hora Fim (HH:MM)"?: string;
  "Hora Fim"?: string;
  horaFim?: string;
  "HORA FIM"?: string;
  "Observações"?: string | null;
  Observacoes?: string | null;
  observacoes?: string | null;
  OBSERVACOES?: string | null;
  "Horas Trabalhadas"?: number | string;
  HorasTrabalhadas?: number | string;
  duracaoHoras?: number | string;
  "HORAS TRABALHADAS"?: number | string;
  "Absenteismo (%)"?: number | string;
  Absenteismo?: number | string;
  [key: string]: any;
}

export interface WlpMonthSummary {
  mesAno: string; // "01/2026"
  nomeMes: string; // "Janeiro"
  totalRegistros: number;
  volumeHL: number;
  totalHoras: number;
  colaboradoresUnicos: number;
  diasComFaturamento: number;
  wlpPrevisto: number;
}

export interface ParsedWlpFaturadoResult {
  valid: boolean;
  totalRecordsInJson: number;
  filteredRecordsCount: number;
  selectedMonthFilter: string; // "TODOS" | "01/2026" | etc.
  jornadas: JornadaRecord[];
  dailyFaturados: WlpDailyFaturadoRecord[];
  retroactiveRecords: RetroactiveRecord[];
  monthsSummary: WlpMonthSummary[];
  totalVolumeHl: number;
  totalHorasTrabalhadas: number;
  totalColaboradoresUnicos: number;
  totalDiasComFaturamento: number;
  wlpGeralHlHh: number;
  resumoPorCargo: Record<string, { totalRegistros: number; totalHoras: number; colaboradores: Set<string> }>;
  resumoPorDia: { dataStr: string; dataISO: string; volumeHL: number; totalPontos: number; totalHoras: number }[];
  absenteismoDetectado: Record<string, { taxa: number; status: 'OK' | 'NOK' | 'PENDENTE' }>;
  errors: string[];
  warnings: string[];
}

export const MONTH_NAMES_PT: Record<string, string> = {
  '01': 'Janeiro',
  '02': 'Fevereiro',
  '03': 'Março',
  '04': 'Abril',
  '05': 'Maio',
  '06': 'Junho',
  '07': 'Julho',
  '08': 'Agosto',
  '09': 'Setembro',
  '10': 'Outubro',
  '11': 'Novembro',
  '12': 'Dezembro'
};

export const MONTH_OPTIONS_SELECT = [
  { value: 'TODOS', label: 'Todos os Meses (Automático por Data)' },
  { value: '01/2026', label: '01/2026 — Janeiro (Mês a Mês Isolado)' },
  { value: '02/2026', label: '02/2026 — Fevereiro (Mês a Mês Isolado)' },
  { value: '03/2026', label: '03/2026 — Março (Pico Crítico +2h HE)' },
  { value: '04/2026', label: '04/2026 — Abril (Mês a Mês Isolado)' },
  { value: '05/2026', label: '05/2026 — Maio (Mês a Mês Isolado)' },
  { value: '06/2026', label: '06/2026 — Junho (Pico Crítico +2h HE)' },
  { value: '07/2026', label: '07/2026 — Julho (Mês a Mês Isolado)' },
  { value: '08/2026', label: '08/2026 — Agosto (Mês a Mês Isolado)' },
  { value: '09/2026', label: '09/2026 — Setembro (Mês a Mês Isolado)' },
  { value: '10/2026', label: '10/2026 — Outubro (Mês a Mês Isolado)' },
  { value: '11/2026', label: '11/2026 — Novembro (Mês a Mês Isolado)' },
  { value: '12/2026', label: '12/2026 — Dezembro (Pico Crítico +2h HE)' }
];

export const SAMPLE_WLP_FATURADO_JSON: RawWlpFaturadoJsonItem[] = [
  {
    "Data": "2026-01-01",
    "Volume Faturado (HL)": 901.8,
    "Colaborador (ID)": "MARIVALDO ARTUR ALVES",
    "Cargo": "Empilhador",
    "Hora Início (HH:MM)": "06:33",
    "Hora Fim (HH:MM)": "15:44",
    "Observações": null,
    "Horas Trabalhadas": 9.18333333333333
  },
  {
    "Data": "2026-01-01",
    "Volume Faturado (HL)": 901.8,
    "Colaborador (ID)": "LUCAS DA SILVA SANTOS",
    "Cargo": "Empilhador",
    "Hora Início (HH:MM)": "06:50",
    "Hora Fim (HH:MM)": "16:10",
    "Observações": null,
    "Horas Trabalhadas": 9.33333333333333
  },
  {
    "Data": "2026-01-01",
    "Volume Faturado (HL)": 901.8,
    "Colaborador (ID)": "CARLOS EDUARDO SILVA",
    "Cargo": "Ajudante",
    "Hora Início (HH:MM)": "07:00",
    "Hora Fim (HH:MM)": "16:20",
    "Observações": null,
    "Horas Trabalhadas": 9.33333333333333
  },
  {
    "Data": "2026-01-01",
    "Volume Faturado (HL)": 901.8,
    "Colaborador (ID)": "FERNANDO HENRIQUE SOUZA",
    "Cargo": "Conferente",
    "Hora Início (HH:MM)": "07:00",
    "Hora Fim (HH:MM)": "16:20",
    "Observações": null,
    "Horas Trabalhadas": 9.33333333333333
  },
  {
    "Data": "2026-01-02",
    "Volume Faturado (HL)": 1145.2,
    "Colaborador (ID)": "MARIVALDO ARTUR ALVES",
    "Cargo": "Empilhador",
    "Hora Início (HH:MM)": "06:30",
    "Hora Fim (HH:MM)": "15:45",
    "Observações": null,
    "Horas Trabalhadas": 9.25
  },
  {
    "Data": "2026-01-02",
    "Volume Faturado (HL)": 1145.2,
    "Colaborador (ID)": "LUCAS DA SILVA SANTOS",
    "Cargo": "Empilhador",
    "Hora Início (HH:MM)": "06:45",
    "Hora Fim (HH:MM)": "16:05",
    "Observações": null,
    "Horas Trabalhadas": 9.33333333333333
  },
  {
    "Data": "2026-01-02",
    "Volume Faturado (HL)": 1145.2,
    "Colaborador (ID)": "CARLOS EDUARDO SILVA",
    "Cargo": "Ajudante",
    "Hora Início (HH:MM)": "07:00",
    "Hora Fim (HH:MM)": "16:20",
    "Observações": null,
    "Horas Trabalhadas": 9.33333333333333
  },
  {
    "Data": "2026-01-02",
    "Volume Faturado (HL)": 1145.2,
    "Colaborador (ID)": "FERNANDO HENRIQUE SOUZA",
    "Cargo": "Conferente",
    "Hora Início (HH:MM)": "07:00",
    "Hora Fim (HH:MM)": "16:20",
    "Observações": null,
    "Horas Trabalhadas": 9.33333333333333
  },
  {
    "Data": "2026-01-03",
    "Volume Faturado (HL)": 780.4,
    "Colaborador (ID)": "MARIVALDO ARTUR ALVES",
    "Cargo": "Empilhador",
    "Hora Início (HH:MM)": "06:33",
    "Hora Fim (HH:MM)": "15:44",
    "Observações": null,
    "Horas Trabalhadas": 9.18333333333333
  },
  {
    "Data": "2026-01-03",
    "Volume Faturado (HL)": 780.4,
    "Colaborador (ID)": "CARLOS EDUARDO SILVA",
    "Cargo": "Ajudante",
    "Hora Início (HH:MM)": "07:00",
    "Hora Fim (HH:MM)": "16:20",
    "Observações": null,
    "Horas Trabalhadas": 9.33333333333333
  }
];

/**
 * Normaliza data para formato YYYY-MM-DD e DD/MM/YYYY
 */
function normalizeDate(rawDate?: string): { dataISO: string; dataStr: string; mesAno: string; monthNum: string; yearNum: string } | null {
  if (!rawDate) return null;
  const str = String(rawDate).trim();

  // Caso 1: ISO YYYY-MM-DD
  if (/^\d{4}-\d{1,2}-\d{1,2}/.test(str)) {
    const parts = str.split('T')[0].split('-');
    const y = parts[0];
    const m = parts[1].padStart(2, '0');
    const d = parts[2].padStart(2, '0');
    return {
      dataISO: `${y}-${m}-${d}`,
      dataStr: `${d}/${m}/${y}`,
      mesAno: `${m}/${y}`,
      monthNum: m,
      yearNum: y
    };
  }

  // Caso 2: BR DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(str)) {
    const parts = str.split('/');
    const d = parts[0].padStart(2, '0');
    const m = parts[1].padStart(2, '0');
    const y = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
    return {
      dataISO: `${y}-${m}-${d}`,
      dataStr: `${d}/${m}/${y}`,
      mesAno: `${m}/${y}`,
      monthNum: m,
      yearNum: y
    };
  }

  return null;
}

/**
 * Parser principal de JSON do Painel Estratégico WLP & Volume Faturado
 */
export function parseWlpFaturadoJson(
  rawInput: string | RawWlpFaturadoJsonItem[],
  empresaId: string = 'demo',
  userName: string = 'Administrador DPO',
  selectedMonthFilter: string = 'TODOS'
): ParsedWlpFaturadoResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  let items: RawWlpFaturadoJsonItem[] = [];

  if (typeof rawInput === 'string') {
    try {
      const parsed = JSON.parse(rawInput);
      if (Array.isArray(parsed)) {
        items = parsed;
      } else if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed.registros)) items = parsed.registros;
        else if (Array.isArray(parsed.data)) items = parsed.data;
        else if (Array.isArray(parsed.items)) items = parsed.items;
        else items = [parsed];
      } else {
        errors.push('Formato JSON inválido: esperado um array de objetos ou objeto contendo lista de registros.');
      }
    } catch (e: any) {
      errors.push(`Erro de sintaxe no JSON: ${e.message}`);
      return {
        valid: false,
        totalRecordsInJson: 0,
        filteredRecordsCount: 0,
        selectedMonthFilter,
        jornadas: [],
        dailyFaturados: [],
        retroactiveRecords: [],
        monthsSummary: [],
        totalVolumeHl: 0,
        totalHorasTrabalhadas: 0,
        totalColaboradoresUnicos: 0,
        totalDiasComFaturamento: 0,
        wlpGeralHlHh: 0,
        resumoPorCargo: {},
        resumoPorDia: [],
        absenteismoDetectado: {},
        errors,
        warnings
      };
    }
  } else if (Array.isArray(rawInput)) {
    items = rawInput;
  }

  if (items.length === 0 && errors.length === 0) {
    errors.push('O arquivo JSON está vazio ou não contém registros válidos.');
  }

  const jornadas: JornadaRecord[] = [];
  const dailyFaturadosMap = new Map<string, { volumeHL: number; dataStr: string; dataISO: string; mesAno: string }>();
  const retroactiveRecords: RetroactiveRecord[] = [];
  const resumoPorCargo: Record<string, { totalRegistros: number; totalHoras: number; colaboradores: Set<string> }> = {};
  const resumoPorDiaMap = new Map<string, { dataStr: string; dataISO: string; volumeHL: number; totalPontos: number; totalHoras: number }>();
  const colaboradoresSet = new Set<string>();
  const absenteismoDetectado: Record<string, { taxa: number; status: 'OK' | 'NOK' | 'PENDENTE' }> = {};

  let totalHorasTrabalhadas = 0;
  let discardedSaturdaysCount = 0;
  let excludedOtherMonthsCount = 0;

  items.forEach((item, idx) => {
    // 1. Extração da data
    const rawDate = item.Data || item.data || item.DATA || item.dataISO || item.dataStr;
    const dateObj = normalizeDate(rawDate);
    if (!dateObj) {
      warnings.push(`Linha #${idx + 1}: Data ausente ou inválida ("${rawDate}"). Registro ignorado.`);
      return;
    }

    const { dataISO, dataStr, mesAno, monthNum, yearNum } = dateObj;

    // 2. Filtro do Mês Específico (Isolamento Mês a Mês Solicitado pelo Usuário)
    if (selectedMonthFilter !== 'TODOS' && mesAno !== selectedMonthFilter) {
      excludedOtherMonthsCount++;
      return;
    }

    // 3. Regra de Sábado da Plataforma (Descarte de sábados não permitidos)
    if (isDisallowedSaturday(dataISO, dataStr)) {
      discardedSaturdaysCount++;
      return;
    }

    // 4. Volume Faturado do Dia (HL)
    const rawVol = item["Volume Faturado (HL)"] ?? item["Volume Faturado"] ?? item["Volume"] ?? item.volumeHL ?? item["VOLUME FATURADO (HL)"] ?? 0;
    let volHl = 0;
    if (typeof rawVol === 'number') {
      volHl = rawVol;
    } else if (typeof rawVol === 'string') {
      const cleanVol = rawVol.replace(/[^\d,. -]/g, '').replace(/\./g, '').replace(',', '.').trim();
      volHl = parseFloat(cleanVol) || 0;
    }

    if (volHl > 0) {
      const prev = dailyFaturadosMap.get(dataISO);
      if (!prev || volHl > prev.volumeHL) {
        dailyFaturadosMap.set(dataISO, { volumeHL: volHl, dataStr, dataISO, mesAno });
      }
    }

    // 5. Colaborador e Cargo
    const rawColab = item["Colaborador (ID)"] || item.Colaborador || item.Nome || item.COLABORADOR || item.colaboradorNome || 'COLABORADOR OPERACIONAL';
    const normColab = normalizeCollaboratorName(rawColab);
    const officialInfo = getCollaboratorOfficialInfo(normColab);
    const rawCargo = item.Cargo || item.cargo || item.CARGO || officialInfo.cargo || 'Ajudante';

    // 6. Horas de Início e Fim / Horas Trabalhadas
    const horaInicio = String(item["Hora Início (HH:MM)"] || item["Hora Início"] || item["Hora Inicio"] || item.horaInicio || item["HORA INICIO"] || '07:00').trim().slice(0, 5);
    const horaFim = String(item["Hora Fim (HH:MM)"] || item["Hora Fim"] || item.horaFim || item["HORA FIM"] || '16:20').trim().slice(0, 5);

    let duracaoHoras = 0;
    const rawHoras = item["Horas Trabalhadas"] ?? item.HorasTrabalhadas ?? item.duracaoHoras ?? item["HORAS TRABALHADAS"];
    if (typeof rawHoras === 'number' && !isNaN(rawHoras) && rawHoras > 0) {
      duracaoHoras = parseFloat(rawHoras.toFixed(2));
    } else if (typeof rawHoras === 'string' && rawHoras.trim()) {
      const cleanH = parseFloat(rawHoras.replace(',', '.'));
      if (!isNaN(cleanH) && cleanH > 0) {
        duracaoHoras = parseFloat(cleanH.toFixed(2));
      }
    }

    // Se duração não foi fornecida, calcular com dedução inteligente de intervalo
    if (duracaoHoras <= 0) {
      duracaoHoras = calcularDuracaoHorasComIntervalo(horaInicio, horaFim);
    }

    // 7. Absenteísmo opcional detectado no registro
    const rawAbs = item["Absenteismo (%)"] ?? item.Absenteismo;
    if (rawAbs !== undefined && rawAbs !== null && rawAbs !== '') {
      const absNum = typeof rawAbs === 'number' ? rawAbs : parseFloat(String(rawAbs).replace('%', '').replace(',', '.'));
      if (!isNaN(absNum)) {
        absenteismoDetectado[mesAno] = {
          taxa: absNum,
          status: absNum <= 1.0 ? 'OK' : 'NOK'
        };
      }
    }

    const obs = item["Observações"] || item.Observacoes || item.observacoes || item.OBSERVACOES || '';

    // Cria registro de Jornada
    const jrnId = `jrn-${dataISO}-${encodeURIComponent(normColab).toLowerCase().replace(/%20/g, '-')}-${idx}`;
    const jornadaRecord: JornadaRecord = {
      id: jrnId,
      colaboradorNome: normColab,
      cargo: rawCargo,
      dataStr,
      dataISO,
      mesAno,
      horaInicio,
      horaFim,
      duracaoHoras,
      empresaId,
      observacoes: obs || 'Importação retroativa JSON (Volume Faturado & Ponto WLP)',
      criadoEm: new Date().toISOString()
    };

    jornadas.push(jornadaRecord);
    colaboradoresSet.add(normColab);
    totalHorasTrabalhadas += duracaoHoras;

    // Resumo por Cargo
    if (!resumoPorCargo[rawCargo]) {
      resumoPorCargo[rawCargo] = { totalRegistros: 0, totalHoras: 0, colaboradores: new Set() };
    }
    resumoPorCargo[rawCargo].totalRegistros++;
    resumoPorCargo[rawCargo].totalHoras += duracaoHoras;
    resumoPorCargo[rawCargo].colaboradores.add(normColab);

    // Resumo por Dia
    const prevDia = resumoPorDiaMap.get(dataISO) || { dataStr, dataISO, volumeHL: 0, totalPontos: 0, totalHoras: 0 };
    prevDia.totalPontos++;
    prevDia.totalHoras += duracaoHoras;
    if (volHl > prevDia.volumeHL) prevDia.volumeHL = volHl;
    resumoPorDiaMap.set(dataISO, prevDia);

    // Registro na Central Retroativa
    retroactiveRecords.push({
      id: `retro-wlp-${dataISO}-${idx}`,
      modulo: 'wlp_faturado',
      dataISO,
      dataFormatada: dataStr,
      descricao: `Ponto & Volume Faturado: ${normColab} (${rawCargo}) - ${duracaoHoras}h`,
      quantidade: volHl > 0 ? volHl : duracaoHoras,
      unidade: volHl > 0 ? 'HL' : 'HORAS',
      valorFinanceiro: Math.round(volHl * 380),
      operador: normColab,
      setor: 'Armazém / WLP',
      status: 'Concluído',
      colaboradorAjudante: rawCargo === 'Ajudante' ? normColab : undefined,
      empilhador: rawCargo === 'Empilhador' ? normColab : undefined,
      horaInicio,
      horaFim,
      duracaoMinutos: Math.round(duracaoHoras * 60),
      simuladoHistorico: true,
      criadoEm: new Date().toISOString()
    });
  });

  // Monta lista de Daily Faturados
  const dailyFaturados: WlpDailyFaturadoRecord[] = Array.from(dailyFaturadosMap.values()).map(df => ({
    id: `fat-${df.dataISO}`,
    dataISO: df.dataISO,
    dataStr: df.dataStr,
    mesAno: df.mesAno,
    volumeHL: df.volumeHL,
    registradoPor: `Importação Retroativa JSON (${userName})`,
    registradoEm: new Date().toISOString(),
    origem: 'CSV',
    empresaId
  }));

  // Volume total acumulado
  let totalVolumeHl = 0;
  dailyFaturados.forEach(f => {
    totalVolumeHl += f.volumeHL;
  });

  // Resumo agrupado por mês
  const monthsSummaryMap = new Map<string, WlpMonthSummary>();
  jornadas.forEach(j => {
    const prev = monthsSummaryMap.get(j.mesAno) || {
      mesAno: j.mesAno,
      nomeMes: MONTH_NAMES_PT[j.mesAno.split('/')[0]] || j.mesAno,
      totalRegistros: 0,
      volumeHL: 0,
      totalHoras: 0,
      colaboradoresUnicos: 0,
      diasComFaturamento: 0,
      wlpPrevisto: 0
    };
    prev.totalRegistros++;
    prev.totalHoras += j.duracaoHoras;
    monthsSummaryMap.set(j.mesAno, prev);
  });

  dailyFaturados.forEach(f => {
    const prev = monthsSummaryMap.get(f.mesAno);
    if (prev) {
      prev.volumeHL += f.volumeHL;
      prev.diasComFaturamento++;
    }
  });

  monthsSummaryMap.forEach((summary, mesAno) => {
    const colabs = new Set(jornadas.filter(j => j.mesAno === mesAno).map(j => j.colaboradorNome));
    summary.colaboradoresUnicos = colabs.size;
    summary.wlpPrevisto = summary.totalHoras > 0 ? parseFloat((summary.volumeHL / summary.totalHoras).toFixed(2)) : 0;
  });

  const monthsSummary = Array.from(monthsSummaryMap.values()).sort((a, b) => a.mesAno.localeCompare(b.mesAno));

  const wlpGeralHlHh = totalHorasTrabalhadas > 0 ? parseFloat((totalVolumeHl / totalHorasTrabalhadas).toFixed(2)) : 0;

  if (discardedSaturdaysCount > 0) {
    warnings.push(`${discardedSaturdaysCount} registros de Sábado não autorizados foram descartados conforme a regra operacional DPO.`);
  }

  if (excludedOtherMonthsCount > 0 && selectedMonthFilter !== 'TODOS') {
    warnings.push(`Filtro ativo: ${excludedOtherMonthsCount} registros de outros meses foram ignorados para manter o isolamento de ${selectedMonthFilter}.`);
  }

  const valid = errors.length === 0 && jornadas.length > 0;

  return {
    valid,
    totalRecordsInJson: items.length,
    filteredRecordsCount: jornadas.length,
    selectedMonthFilter,
    jornadas,
    dailyFaturados,
    retroactiveRecords,
    monthsSummary,
    totalVolumeHl: parseFloat(totalVolumeHl.toFixed(1)),
    totalHorasTrabalhadas: parseFloat(totalHorasTrabalhadas.toFixed(1)),
    totalColaboradoresUnicos: colaboradoresSet.size,
    totalDiasComFaturamento: dailyFaturados.length,
    wlpGeralHlHh,
    resumoPorCargo,
    resumoPorDia: Array.from(resumoPorDiaMap.values()).sort((a, b) => a.dataISO.localeCompare(b.dataISO)),
    absenteismoDetectado,
    errors,
    warnings
  };
}
