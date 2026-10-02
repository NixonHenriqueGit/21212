import * as XLSX from 'xlsx';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { firestoreDb } from '../database/firestoreDatabase';
import { SETORES_5S, MAPEAMENTO_RESPONSAVEIS_5S, Audit5SRecord } from '../components/Checklist5SModal';

export interface Campeao5SMensal {
  mesNum: number;
  mesStr: string;
  mesNome: string;
  nome: string;
  apelido: string;
  cargo: string;
  setorPrincipal: string;
  notaEsperada: number;
}

export const CAMPEOES_5S_MENSAIS: Record<number, Campeao5SMensal> = {
  1: { mesNum: 1, mesStr: '01', mesNome: 'Janeiro', nome: 'CICERO MATHEU DE OLIVEIRA SILVA', apelido: 'Cícero', cargo: 'CONFERENTE', setorPrincipal: 'DEVOLUÇÃO / REFUGO', notaEsperada: 100 },
  2: { mesNum: 2, mesStr: '02', mesNome: 'Fevereiro', nome: 'OZENILDO SOUSA SILVA', apelido: 'Ozenildo', cargo: 'AJUDANTE', setorPrincipal: 'DESPEJO / REPACK', notaEsperada: 98 },
  3: { mesNum: 3, mesStr: '03', mesNome: 'Março', nome: 'DEJEAN SILVA DE OLIVEIRA', apelido: 'Dejean', cargo: 'AJUDANTE', setorPrincipal: 'PICKING / CENTRAL', notaEsperada: 98 },
  4: { mesNum: 4, mesStr: '04', mesNome: 'Abril', nome: 'DIOGENES PEREIRA DA SILVA', apelido: 'Diogenes', cargo: 'AJUDANTE', setorPrincipal: 'FROTA DA ENTREGA', notaEsperada: 100 },
  5: { mesNum: 5, mesStr: '05', mesNome: 'Maio', nome: 'GLADSON LISBOA DOS SANTOS', apelido: 'Gladson', cargo: 'AJUDANTE', setorPrincipal: 'REFUGO / DEVOLUÇÃO', notaEsperada: 100 },
  6: { mesNum: 6, mesStr: '06', mesNome: 'Junho', nome: 'PAULO PEREIRA DA SILVA', apelido: 'Paulo Pereira', cargo: 'EMPILHADOR', setorPrincipal: 'ÁREA DE CARREGAMENTO DA EMPILHADEIRA', notaEsperada: 98 },
  7: { mesNum: 7, mesStr: '07', mesNome: 'Julho', nome: 'GILSON ROSA DA SILVA', apelido: 'Gilson', cargo: 'CONFERENTE', setorPrincipal: 'PNC', notaEsperada: 100 },
  8: { mesNum: 8, mesStr: '08', mesNome: 'Agosto', nome: 'DIOGENES PEREIRA DA SILVA', apelido: 'Diogenes', cargo: 'AJUDANTE', setorPrincipal: 'FROTA DA ENTREGA', notaEsperada: 98 }
};

export const isChampionForMonth = (respName: string, areaName: string, m: number): boolean => {
  const champ = CAMPEOES_5S_MENSAIS[m];
  if (!champ) return false;
  const normResp = (respName || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const normChamp = champ.nome.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const firstName = normChamp.split(' ')[0];
  const apelidoNorm = (champ.apelido || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  if (
    normResp === normChamp ||
    normResp.includes(normChamp) ||
    normChamp.includes(normResp) ||
    (firstName.length > 2 && normResp.includes(firstName)) ||
    (apelidoNorm.length > 2 && normResp.includes(apelidoNorm))
  ) {
    return true;
  }

  // Setores diretos de responsabilidade de cada campeão
  if (m === 1 && (areaName === 'DEVOLUÇÃO' || areaName === 'REFUGO' || areaName === 'CENTRAL' || normResp.includes('CICERO'))) return true;
  if (m === 2 && (areaName === 'DESPEJO' || areaName === 'REPACK' || areaName === 'ÁREA MKT PLACE' || normResp.includes('OZENILDO'))) return true;
  if (m === 3 && (areaName === 'PICKING' || areaName === 'ÁREA DE CARREGAMENTO' || areaName === 'CENTRAL' || normResp.includes('DEJEAN'))) return true;
  if (m === 4 && (areaName === 'FROTA DA ENTREGA' || normResp.includes('DIOGENES'))) return true;
  if (m === 5 && (areaName === 'REFUGO' || areaName === 'DEVOLUÇÃO' || normResp.includes('GLADSON'))) return true;
  if (m === 6 && (areaName === 'ÁREA DE CARREGAMENTO DA EMPILHADEIRA' || normResp.includes('PAULO'))) return true;
  if (m === 7 && (areaName === 'PNC' || normResp.includes('GILSON'))) return true;
  if (m === 8 && (areaName === 'FROTA DA ENTREGA' || normResp.includes('DIOGENES'))) return true;

  return false;
};

export const OBSERVACOES_5S_PADRAO = [
  '5S realizado com sucesso.',
  'Checklist concluído.',
  'Área limpa e organizada.',
  'Setor organizado e em conformidade.',
  'Padrão 5S mantido.',
  'Necessitando pequenas melhorias na limpeza.'
] as const;

export const OBSERVACOES_CAMPEAO = [
  '5S realizado com sucesso.',
  'Área limpa, padronizada e organizada.',
  'Setor organizado e em conformidade plena.',
  'Padrão 5S mantido com excelência.',
  'Checklist e rotina 5S concluídos com perfeição.',
  'Documentos arquivados, posto higienizado e conforme.',
  'Ambiente de trabalho limpo e padronizado.',
  'Conformidade plena com as normas 5S.',
  'Posto inspecionado e 100% conforme.',
  'Auditoria 5S concluída com alta pontuação.',
  'Área de trabalho organizada, limpa e segura.',
  'Materiais devidamente guardados e identificados.'
] as const;

export const get5SObservationForRecord = (scoreVal: number, areaIdx: number, day: number, m: number, isChamp: boolean = false): string => {
  if (isChamp) {
    return OBSERVACOES_CAMPEAO[(day + m * 3 + areaIdx) % OBSERVACOES_CAMPEAO.length];
  }
  if (scoreVal <= 8) {
    const lowOpts = ['Necessitando pequenas melhorias na limpeza.', 'Checklist concluído com observações.', '5S realizado com ressalvas.'];
    return lowOpts[(areaIdx + day + m) % lowOpts.length];
  } else if (scoreVal === 10) {
    const highOpts = ['5S realizado com sucesso.', 'Setor organizado e em conformidade.', 'Área limpa e padronizada.', 'Padrão 5S mantido com excelência.'];
    return highOpts[(areaIdx + day + m) % highOpts.length];
  } else {
    const midOpts = ['5S realizado com sucesso.', 'Checklist concluído.', 'Setor organizado.', 'Área limpa e organizada.'];
    return midOpts[(areaIdx + day + m) % midOpts.length];
  }
};

export const normalize5SObservation = (obs: string | undefined, indexSeed: number = 0, score: number = 10, isChamp: boolean = false): string => {
  if (isChamp) {
    if (obs && (OBSERVACOES_CAMPEAO as readonly string[]).includes(obs)) return obs;
    return OBSERVACOES_CAMPEAO[indexSeed % OBSERVACOES_CAMPEAO.length];
  }
  if (!obs) return get5SObservationForRecord(score, indexSeed, indexSeed, indexSeed, false);
  const trimmed = obs.trim();
  if ((OBSERVACOES_5S_PADRAO as readonly string[]).includes(trimmed)) {
    return trimmed;
  }
  return get5SObservationForRecord(score, indexSeed, indexSeed * 3, indexSeed * 7, false);
};

// In-Memory Singleton Cache to avoid constant expensive JSON.parse / generation
let _inMemoryAuditsCache: Audit5SRecord[] | null = null;
let _inMemoryGeneratedYTD: Audit5SRecord[] | null = null;

export const generateYTD5SAuditsFast = (): Audit5SRecord[] => {
  if (_inMemoryGeneratedYTD) {
    return _inMemoryGeneratedYTD;
  }

  const list: Audit5SRecord[] = [];
  const currentYear = 2026;

  const auditoresDisponiveis = [
    'Pedro Bruno (Setor de Frota)',
    'Líder Operacional 5S',
    'Supervisão de Operações',
    'Inspetor de Qualidade',
    'Auditor Interno 5S',
    'Coordenação de Logística'
  ];

  // Mapping from area to responsible person
  const respMap: Record<string, string> = {};
  MAPEAMENTO_RESPONSAVEIS_5S.forEach(item => {
    respMap[item.area] = item.colaborador;
  });

  // De Janeiro (1) até Agosto (8)
  for (let m = 1; m <= 8; m++) {
    const daysInMonth = m === 2 ? 28 : (m === 4 || m === 6 || m === 9 || m === 11) ? 30 : 31;
    // Em agosto, as auditorias vão estritamente até o dia 25 (o restante será preenchido manualmente)
    const maxDay = m === 8 ? 25 : daysInMonth;

    const targetArmazemByMonth: Record<number, number> = {
      1: 92,
      2: 92,
      3: 88,
      4: 92,
      5: 92,
      6: 89,
      7: 92,
      8: 88
    };

    for (let day = 1; day <= maxDay; day++) {
      const dateObj = new Date(currentYear, m - 1, day);
      const dayOfWeek = dateObj.getDay(); // 0 = Domingo, 6 = Sábado

      // Somente dias úteis da semana (Segunda a Sexta: 1 a 5)
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        const dayStr = day < 10 ? `0${day}` : `${day}`;
        const monthStr = m < 10 ? `0${m}` : `${m}`;
        const dataISO = `${currentYear}-${monthStr}-${dayStr}`;
        const dataFormatted = `${dayStr}/${monthStr}/${currentYear}`;
        const targetMonthlyAvg = targetArmazemByMonth[m] || 92;

        SETORES_5S.forEach((areaName, areaIdx) => {
          const respName = respMap[areaName] || 'DEJEAN SILVA DE OLIVEIRA';
          const isChamp = isChampionForMonth(respName, areaName, m);

          let scoreVal = 9; // 90% padrão
          let answers = [true, true, true, true, true, true, true, true, true, true];

          if (isChamp) {
            // O campeão do respectivo mês atinge sempre pontuação de excelência (95% a 100%), garantindo o 1º lugar
            const isPerfectDay = (day + m) % 6 !== 0;
            scoreVal = isPerfectDay ? 10 : 9;
            if (!isPerfectDay) {
              answers[9] = false; // Pequena não conformidade leve pontual
            }
          } else {
            // Distribuição matemática exata para que a média do Armazém no mês atinja targetMonthlyAvg
            const cycle = (areaIdx * 7 + day * 13 + m * 17) % 20;

            if (targetMonthlyAvg === 92) {
              // Ajuste de notas não-campeão para fechar em 92%
              if (cycle < 4) {
                scoreVal = 10;
              } else if (cycle < 16) {
                scoreVal = 9;
              } else {
                scoreVal = 8;
              }
            } else if (targetMonthlyAvg === 88) {
              // Fechar em 88%
              if (cycle < 2) {
                scoreVal = 10;
              } else if (cycle < 12) {
                scoreVal = 9;
              } else {
                scoreVal = 8;
              }
            } else if (targetMonthlyAvg === 89) {
              // Fechar em 89%
              if (cycle < 3) {
                scoreVal = 10;
              } else if (cycle < 14) {
                scoreVal = 9;
              } else {
                scoreVal = 8;
              }
            } else {
              scoreVal = 9;
            }

            if (scoreVal === 8) {
              answers[5] = false; // P6: Risco / Condições inseguras
              answers[7] = false; // P8: Limpeza de piso
            } else if (scoreVal === 9) {
              const failIndex = (areaIdx + day) % 10;
              answers[failIndex] = false;
            }
          }

          const notaPct = Math.round((scoreVal / 10) * 100);
          const auditor = auditoresDisponiveis[(areaIdx + day + m) % auditoresDisponiveis.length];
          const obs = get5SObservationForRecord(scoreVal, areaIdx, day, m, isChamp);

          list.push({
            id: `audit_5s_${areaName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}_${dataISO}`,
            dataISO,
            dataFormatted,
            setor: areaName,
            operador: respName,
            liderAuditor: auditor,
            pontos: scoreVal,
            notaPercentual: notaPct,
            respostas: answers,
            observacoesNaoConforme: obs,
            fotoUrl: null,
            createdAt: `${dataISO}T09:30:00.000Z`,
            empresaId: 'demo',
            seiriStatus: answers[0] && answers[1] && answers[2] && answers[3],
            seitonStatus: answers[1],
            seisoStatus: answers[7] && answers[8],
            seiketsuStatus: answers[4] && answers[5] && answers[6],
            shitsukeStatus: answers[9]
          });
        });
      }
    }
  }

  _inMemoryGeneratedYTD = balanceMonthlyAudits(list);
  return _inMemoryGeneratedYTD;
};

/**
 * Função de balanceamento matemático exato para garantir que a média dos percentuais
 * de cada mês do Armazém atinja rigorosamente a meta histórica oficial
 * (Jan: 92%, Fev: 92%, Mar: 88%, Abr: 92%, Mai: 92%, Jun: 89%, Jul: 92%, Ago: 88%)
 * e que os campeões oficiais de cada mês permaneçam no topo inabalável do ranking.
 */
export const balanceMonthlyAudits = (audits: Audit5SRecord[]): Audit5SRecord[] => {
  const targetArmazemByMonth: Record<string, number> = {
    '01': 92,
    '02': 92,
    '03': 88,
    '04': 92,
    '05': 92,
    '06': 89,
    '07': 92,
    '08': 88
  };

  const months = ['01', '02', '03', '04', '05', '06', '07', '08'];
  const balanced = [...audits];

  for (const mStr of months) {
    const targetAvg = targetArmazemByMonth[mStr] || 92;
    const mNum = parseInt(mStr, 10);
    const indices: number[] = [];

    for (let i = 0; i < balanced.length; i++) {
      const parts = (balanced[i].dataISO || '').split('-');
      if (parts.length >= 2 && parts[1] === mStr) {
        indices.push(i);
      }
    }

    if (indices.length === 0) continue;

    const targetSum = targetAvg * indices.length;
    let currentSum = indices.reduce((acc, idx) => acc + (balanced[idx].notaPercentual || 0), 0);
    let diff = targetSum - currentSum; // em pontos percentuais (múltiplos de 10)

    // Ajusta gradualmente registros de não-campeões para alcançar o somatório exato sem afetar os campeões
    let iteration = 0;
    while (diff !== 0 && iteration < 1000) {
      iteration++;
      let adjusted = false;

      if (diff > 0) {
        // Precisamos aumentar notas (de 80 para 90, ou de 90 para 100)
        for (const idx of indices) {
          const item = balanced[idx];
          const isChamp = isChampionForMonth(item.operador, item.setor, mNum);
          if (!isChamp && item.pontos < 10) {
            const newPontos = item.pontos + 1;
            const newNotaPct = Math.round((newPontos / 10) * 100);
            balanced[idx] = {
              ...item,
              pontos: newPontos,
              notaPercentual: newNotaPct,
              observacoesNaoConforme: normalize5SObservation(item.observacoesNaoConforme, idx, newPontos, isChamp)
            };
            diff -= 10;
            adjusted = true;
            if (diff <= 0) break;
          }
        }
      } else if (diff < 0) {
        // Precisamos diminuir notas (de 100 para 90, ou de 90 para 80)
        for (const idx of indices) {
          const item = balanced[idx];
          const isChamp = isChampionForMonth(item.operador, item.setor, mNum);
          if (!isChamp && item.pontos > 8) {
            const newPontos = item.pontos - 1;
            const newNotaPct = Math.round((newPontos / 10) * 100);
            balanced[idx] = {
              ...item,
              pontos: newPontos,
              notaPercentual: newNotaPct,
              observacoesNaoConforme: normalize5SObservation(item.observacoesNaoConforme, idx, newPontos, isChamp)
            };
            diff += 10;
            adjusted = true;
            if (diff >= 0) break;
          }
        }
      }

      if (!adjusted) break;
    }
  }

  return balanced;
};

const SEED_VERSION_TAG = 'af_5s_audits_v2026_08_champions_v3';

export const getStored5SAudits = (): Audit5SRecord[] => {
  if (_inMemoryAuditsCache && _inMemoryAuditsCache.length > 0) {
    return _inMemoryAuditsCache;
  }

  try {
    const versionCheck = localStorage.getItem('af_5s_audits_version');
    const saved = localStorage.getItem('af_5s_audits') || localStorage.getItem('5s_audits_history');
    if (saved && versionCheck === SEED_VERSION_TAG) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length >= 1000) {
        _inMemoryAuditsCache = parsed;
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Fallback loading 5S audits from localStorage', e);
  }

  const seeded = generateYTD5SAuditsFast();
  _inMemoryAuditsCache = seeded;

  try {
    localStorage.setItem('af_5s_audits', JSON.stringify(seeded));
    localStorage.setItem('5s_audits_history', JSON.stringify(seeded));
    localStorage.setItem('af_5s_audits_version', SEED_VERSION_TAG);
  } catch (e) {
    console.warn('LocalStorage save quota or error:', e);
  }

  return seeded;
};

export const save5SAuditRecord = async (newRecord: Audit5SRecord): Promise<boolean> => {
  try {
    const companyId = newRecord.empresaId || (typeof window !== 'undefined' ? localStorage.getItem('af_empresa_id') : '') || 'demo';

    // 1. Update Firestore
    try {
      await firestoreDb.create('af_5s_audits', newRecord, companyId, newRecord.id);
    } catch (firestoreErr) {
      if (db) {
        try {
          const docRef = doc(db, 'af_5s_audits', newRecord.id);
          await setDoc(docRef, newRecord);
        } catch (e) {}
      }
    }

    // 2. Update memory & LocalStorage
    const currentList = getStored5SAudits();
    const filtered = currentList.filter(
      item => !(item.setor === newRecord.setor && item.dataISO === newRecord.dataISO) && item.id !== newRecord.id
    );
    const updated = [newRecord, ...filtered];
    _inMemoryAuditsCache = updated;

    try {
      localStorage.setItem('af_5s_audits', JSON.stringify(updated));
      localStorage.setItem('5s_audits_history', JSON.stringify(updated));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }

    // 3. Dispatch global sync event
    window.dispatchEvent(new CustomEvent('5s_audit_updated', { detail: newRecord }));
    window.dispatchEvent(new Event('5s_responsaveis_updated'));

    return true;
  } catch (err) {
    console.error('Error saving 5S audit:', err);
    return false;
  }
};

export const saveBulk5SAudits = async (bulkList: Audit5SRecord[]) => {
  const currentList = getStored5SAudits();
  const map = new Map<string, Audit5SRecord>();

  // Add existing
  currentList.forEach(item => {
    const key = `${item.setor}_${item.dataISO}`;
    map.set(key, item);
  });

  // Overwrite/insert new ones
  bulkList.forEach(item => {
    const key = `${item.setor}_${item.dataISO}`;
    map.set(key, item);
  });

  const merged = Array.from(map.values()).sort((a, b) => (b.dataISO || '').localeCompare(a.dataISO || ''));
  _inMemoryAuditsCache = merged;

  const companyId = (typeof window !== 'undefined' ? localStorage.getItem('af_empresa_id') : '') || 'demo';

  try {
    localStorage.setItem('af_5s_audits', JSON.stringify(merged));
    localStorage.setItem('5s_audits_history', JSON.stringify(merged));
    // Persist bulk to Firestore
    await firestoreDb.batchUpsert('af_5s_audits', merged, companyId);
  } catch (e) {
    console.warn('5S bulk save error:', e);
  }

  window.dispatchEvent(new CustomEvent('5s_audit_updated', { detail: bulkList }));
  window.dispatchEvent(new Event('5s_responsaveis_updated'));
};
