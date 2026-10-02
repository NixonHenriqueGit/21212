// Parser and Validator for Retroactive Temperature JSON Data
import { ArmazemTemperaturaLog } from '../types';
import { sortTempLogsDescending } from './tempStorage';

export interface ParsedTemperaturaResult {
  success: boolean;
  logs: ArmazemTemperaturaLog[];
  errors: string[];
  warnings: string[];
  stats: {
    totalRecords: number;
    validRecords: number;
    invalidRecords: number;
    mediaTemperatura: number;
    picoMaximo: number;
    minimaAferida: number;
    alertasCriticos: number;
    dataInicio: string;
    dataFim: string;
    totalDiasUnicos: number;
    conferentesUnicos: string[];
  };
}

export const SAMPLE_TEMPERATURA_JSON = [
  {
    "data": "2026-01-15",
    "hora": "08:56:00",
    "temperatura": 25.6,
    "colaborador": "Nixon",
    "observacao": null
  },
  {
    "data": "2026-01-15",
    "hora": "15:42:00",
    "temperatura": 27.8,
    "colaborador": "Nixon",
    "observacao": null
  },
  {
    "data": "2026-01-15",
    "hora": "21:30:00",
    "temperatura": 24.9,
    "colaborador": "Nixon",
    "observacao": null
  },
  {
    "data": "2026-01-16",
    "hora": "09:05:00",
    "temperatura": 24.3,
    "colaborador": "Nixon",
    "observacao": null
  },
  {
    "data": "2026-01-16",
    "hora": "16:15:00",
    "temperatura": 28.7,
    "colaborador": "Nixon",
    "observacao": "Alerta térmico > 28°C"
  },
  {
    "data": "2026-01-16",
    "hora": "22:00:00",
    "temperatura": 25.0,
    "colaborador": "Nixon",
    "observacao": null
  }
];

export function parseTemperaturaJson(
  rawInput: string | any[],
  empresaId: string = 'demo',
  userName: string = 'Sistema'
): ParsedTemperaturaResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const validLogs: ArmazemTemperaturaLog[] = [];

  let rawList: any[] = [];

  try {
    if (typeof rawInput === 'string') {
      let trimmed = rawInput.trim();
      if (!trimmed) {
        return {
          success: false,
          logs: [],
          errors: ['O arquivo ou texto JSON fornecido está vazio.'],
          warnings: [],
          stats: getEmptyStats()
        };
      }

      // Auto-repair missing outer brackets if user copied just list of objects
      if (!trimmed.startsWith('[') && (trimmed.startsWith('{') || trimmed.includes('}'))) {
        trimmed = `[${trimmed.replace(/,\s*$/, '')}]`;
      }

      // Clean up common trailing commas before closing bracket
      const sanitized = trimmed.replace(/,\s*([\]}])/g, '$1');

      try {
        const parsed = JSON.parse(sanitized);
        if (Array.isArray(parsed)) {
          rawList = parsed;
        } else if (parsed && typeof parsed === 'object') {
          const candidateKey = Object.keys(parsed).find(k => Array.isArray(parsed[k]));
          if (candidateKey) {
            rawList = parsed[candidateKey];
          } else {
            rawList = [parsed];
          }
        }
      } catch (firstErr) {
        // Fallback: Regex extraction of individual JSON objects { ... }
        const objectMatches = sanitized.match(/\{[\s\S]*?\}(?=\s*(,|$|\]|\{))/g);
        if (objectMatches && objectMatches.length > 0) {
          const extracted: any[] = [];
          for (const objStr of objectMatches) {
            try {
              extracted.push(JSON.parse(objStr));
            } catch (e) {
              // Ignore broken individual items in fallback
            }
          }
          if (extracted.length > 0) {
            rawList = extracted;
          } else {
            throw firstErr;
          }
        } else {
          throw firstErr;
        }
      }
    } else if (Array.isArray(rawInput)) {
      rawList = rawInput;
    }
  } catch (err: any) {
    return {
      success: false,
      logs: [],
      errors: [`Erro de sintaxe JSON: ${err?.message || 'JSON inválido'}. Verifique se todos os objetos estão com as chaves e colchetes corretos.`],
      warnings: [],
      stats: getEmptyStats()
    };
  }

  if (!Array.isArray(rawList) || rawList.length === 0) {
    return {
      success: false,
      logs: [],
      errors: ['Nenhum registro encontrado no JSON. É esperado um array de objetos [ { ... } ].'],
      warnings: [],
      stats: getEmptyStats()
    };
  }

  const uniqueDays = new Set<string>();
  const uniqueConferentes = new Set<string>();
  let sumTemp = 0;
  let maxTemp = -999;
  let minTemp = 999;
  let critAlerts = 0;

  rawList.forEach((item, idx) => {
    const lineNum = idx + 1;
    if (!item || typeof item !== 'object') {
      errors.push(`Item #${lineNum}: formato inválido (não é um objeto).`);
      return;
    }

    // 1. Extração de Data
    const rawData = item.data || item.dataISO || item.dataFormatted || item.dataAfericao || item.date;
    if (!rawData) {
      errors.push(`Item #${lineNum}: campo obrigatório 'data' ausente.`);
      return;
    }

    let dataISO = '';
    let dataFormatted = '';
    let mesAno = '';

    const strData = String(rawData).trim();
    if (strData.includes('/')) {
      // DD/MM/YYYY
      const parts = strData.split('/');
      if (parts.length >= 3) {
        const dd = parts[0].padStart(2, '0');
        const mm = parts[1].padStart(2, '0');
        let yyyy = parts[2];
        if (yyyy.length === 2) yyyy = '20' + yyyy;
        dataISO = `${yyyy}-${mm}-${dd}`;
        dataFormatted = `${dd}/${mm}/${yyyy}`;
        mesAno = `${mm}/${yyyy}`;
      }
    } else if (strData.includes('-')) {
      // YYYY-MM-DD
      const parts = strData.split('-');
      if (parts.length >= 3) {
        const yyyy = parts[0];
        const mm = parts[1].padStart(2, '0');
        const dd = parts[2].padStart(2, '0');
        dataISO = `${yyyy}-${mm}-${dd}`;
        dataFormatted = `${dd}/${mm}/${yyyy}`;
        mesAno = `${mm}/${yyyy}`;
      }
    }

    if (!dataISO || dataISO.includes('NaN')) {
      errors.push(`Item #${lineNum}: formato de data inválido ('${strData}'). Use DD/MM/AAAA ou AAAA-MM-DD.`);
      return;
    }

    // 2. Extração de Hora
    const rawHora = item.hora || item.horario || item.time || item.horaAfericao || '09:00';
    let horaStr = '09:00';
    const strHora = String(rawHora).trim();
    if (strHora.includes(':')) {
      const parts = strHora.split(':');
      const hh = parts[0].padStart(2, '0');
      const mm = (parts[1] || '00').padStart(2, '0');
      horaStr = `${hh}:${mm}`;
    } else {
      horaStr = strHora.padStart(5, '0');
    }

    // 3. Extração de Temperatura
    const rawTemp = item.temperatura ?? item.temp ?? item.valor ?? item.temperaturaC;
    if (rawTemp === undefined || rawTemp === null || rawTemp === '') {
      errors.push(`Item #${lineNum} (${dataFormatted} ${horaStr}): campo 'temperatura' ausente.`);
      return;
    }

    const tempNum = typeof rawTemp === 'number' 
      ? rawTemp 
      : parseFloat(String(rawTemp).replace(',', '.').trim());

    if (isNaN(tempNum) || tempNum < -20 || tempNum > 70) {
      errors.push(`Item #${lineNum}: temperatura '${rawTemp}' inválida ou fora do intervalo operacional (-20°C a 70°C).`);
      return;
    }

    const roundedTemp = Math.round(tempNum * 10) / 10;
    const isCrit = roundedTemp > 28.0 || roundedTemp < 18.0;

    // 4. Conferente / Colaborador e Setor
    const conferente = (item.colaborador || item.conferente || item.conferenteNome || item.operador || item.responsavel || userName || 'Conferente').trim();
    const setor = (item.setor || item.area || 'Armazém Central').trim();
    const observacao = item.observacao && item.observacao !== 'null'
      ? String(item.observacao).trim() 
      : (item.obs && item.obs !== 'null'
          ? String(item.obs).trim() 
          : (item.descricao && item.descricao !== 'null' ? String(item.descricao).trim() : ''));
    const umidade = typeof item.umidade === 'number' ? item.umidade : 55;

    uniqueDays.add(dataISO);
    uniqueConferentes.add(conferente);
    sumTemp += roundedTemp;
    if (roundedTemp > maxTemp) maxTemp = roundedTemp;
    if (roundedTemp < minTemp) minTemp = roundedTemp;
    if (isCrit) critAlerts++;

    validLogs.push({
      id: `temp-json-${dataISO}-${horaStr.replace(':', '')}-${idx}`,
      dataISO,
      dataFormatted,
      mesAno,
      hora: horaStr,
      temperatura: roundedTemp,
      umidade,
      setor,
      conferenteNome: conferente,
      registradoPor: conferente,
      observacao,
      alertaCritico: isCrit
    });
  });

  const sortedLogs = sortTempLogsDescending(validLogs);

  const datesAsc = [...uniqueDays].sort();
  const dataInicio = datesAsc.length > 0 ? formatDateIsoToBr(datesAsc[0]) : '-';
  const dataFim = datesAsc.length > 0 ? formatDateIsoToBr(datesAsc[datesAsc.length - 1]) : '-';

  const validCount = validLogs.length;
  const avgTemp = validCount > 0 ? Math.round((sumTemp / validCount) * 10) / 10 : 0;

  return {
    success: validLogs.length > 0,
    logs: sortedLogs,
    errors: errors.slice(0, 15), // Top 15 errors to avoid flooding
    warnings,
    stats: {
      totalRecords: rawList.length,
      validRecords: validCount,
      invalidRecords: rawList.length - validCount,
      mediaTemperatura: avgTemp,
      picoMaximo: maxTemp === -999 ? 0 : maxTemp,
      minimaAferida: minTemp === 999 ? 0 : minTemp,
      alertasCriticos: critAlerts,
      dataInicio,
      dataFim,
      totalDiasUnicos: uniqueDays.size,
      conferentesUnicos: Array.from(uniqueConferentes)
    }
  };
}

function formatDateIsoToBr(iso: string): string {
  const parts = iso.split('-');
  if (parts.length < 3) return iso;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function getEmptyStats() {
  return {
    totalRecords: 0,
    validRecords: 0,
    invalidRecords: 0,
    mediaTemperatura: 0,
    picoMaximo: 0,
    minimaAferida: 0,
    alertasCriticos: 0,
    dataInicio: '-',
    dataFim: '-',
    totalDiasUnicos: 0,
    conferentesUnicos: []
  };
}
