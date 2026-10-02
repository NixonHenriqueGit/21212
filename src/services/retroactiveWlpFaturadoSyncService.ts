/**
 * Serviço de persistência e sincronização de dados retroativos do WLP,
 * Volume Faturado (HL), Pontos de Jornada e Monitoramento de Absenteísmo
 */

import { ParsedWlpFaturadoResult, WlpMonthSummary } from '../utils/retroactiveWlpFaturadoParser';
import { 
  getStoredJornadas, 
  getStoredDailyFaturado, 
  JornadaRecord, 
  WlpDailyFaturadoRecord, 
  normalizeMesAnoStr, 
  saveWlpConfig, 
  getWlpConfig
} from '../utils/jornadaUtils';
import { 
  HistoricalVolumeRowItem, 
  DEFAULT_HISTORICAL_VOLUMES, 
  AbsenteeismMonthItem, 
  DEFAULT_ABSENTEEISM_2026 
} from '../components/WlpDashboard';
import { getRetroactiveRecords, saveRetroactiveRecords } from '../utils/dadosRetroativosUtils';
import { db } from '../firebase';
import { collection, doc, setDoc, deleteDoc, getDocs, query, where } from 'firebase/firestore';

export interface WlpSyncResult {
  success: boolean;
  totalJornadasSalvas: number;
  totalDiasFaturadosSalvos: number;
  totalVolumeHL: number;
  wlpGeral: number;
  mesesAtualizados: string[];
  message: string;
  detalhesMeses: { mesAno: string; volumeHL: number; totalPontos: number; totalHoras: number; wlp: number }[];
  timestamp: string;
}

export async function syncRetroactiveWlpFaturadoBatch(
  parsedData: ParsedWlpFaturadoResult,
  empresaId: string = 'demo',
  targetMonth: string = 'TODOS',
  tornarPadraoOficial: boolean = true
): Promise<WlpSyncResult> {
  try {
    const { jornadas, dailyFaturados, monthsSummary, totalVolumeHl, wlpGeralHlHh } = parsedData;

    if (jornadas.length === 0) {
      return {
        success: false,
        totalJornadasSalvas: 0,
        totalDiasFaturadosSalvos: 0,
        totalVolumeHL: 0,
        wlpGeral: 0,
        mesesAtualizados: [],
        message: 'Nenhum registro válido para sincronizar.',
        detalhesMeses: [],
        timestamp: new Date().toISOString()
      };
    }

    const keyJrn = `colaboradores_jornadas_${empresaId}`;
    const keyJrnAlt = `jornadas_colaboradores_${empresaId}`;
    const keyFat = `wlp_daily_faturados_${empresaId}`;
    const keyFatAlt = `wlp_daily_faturado_${empresaId}`;
    const keyHistVol = `wlp_historico_volumes_${empresaId}`;
    const keyAbs = `wlp_absenteismo_2026_${empresaId}`;
    const keyPerm = `wlp_permanent_imported_dataset_${empresaId}`;

    const mesesImpactados = monthsSummary.map(m => m.mesAno);

    // 1. ATUALIZAÇÃO DE JORNADAS (PONTOS)
    // Se o usuário selecionou um mês específico, isolamos estritamente aquele mês:
    let currentJornadas = getStoredJornadas(empresaId);
    let updatedJornadas: JornadaRecord[] = [];

    if (targetMonth !== 'TODOS') {
      // Remove jornadas anteriores do mês alvo e insere as novas
      const parts = targetMonth.split('/');
      const monthNum = parts[0].padStart(2, '0');
      const yearNum = parts[1] || '2026';
      const prefixISO = `${yearNum}-${monthNum}`;

      const filteredOutTargetMonth = currentJornadas.filter(j => {
        const norm = normalizeMesAnoStr(j.mesAno, j.dataISO);
        if (norm === targetMonth) return false;
        if (j.dataISO && j.dataISO.startsWith(prefixISO)) return false;
        return true;
      });

      updatedJornadas = [...jornadas, ...filteredOutTargetMonth];
    } else {
      // Modo TODOS: Merge por ID único (dataISO + colaborador)
      const mapJrn = new Map<string, JornadaRecord>();
      currentJornadas.forEach(j => mapJrn.set(j.id, j));
      jornadas.forEach(j => mapJrn.set(j.id, j));
      updatedJornadas = Array.from(mapJrn.values());
    }

    // Salva no LocalStorage
    localStorage.setItem(keyJrn, JSON.stringify(updatedJornadas));
    localStorage.setItem(keyJrnAlt, JSON.stringify(updatedJornadas));

    // 2. ATUALIZAÇÃO DE FATURADOS DIÁRIOS (HL)
    let currentFaturados = getStoredDailyFaturado(empresaId);
    let updatedFaturados: WlpDailyFaturadoRecord[] = [];

    if (targetMonth !== 'TODOS') {
      const parts = targetMonth.split('/');
      const monthNum = parts[0].padStart(2, '0');
      const yearNum = parts[1] || '2026';
      const prefixISO = `${yearNum}-${monthNum}`;

      const filteredOutTargetMonth = currentFaturados.filter(f => {
        const norm = normalizeMesAnoStr(f.mesAno, f.dataISO);
        if (norm === targetMonth) return false;
        if (f.dataISO && f.dataISO.startsWith(prefixISO)) return false;
        return true;
      });

      updatedFaturados = [...dailyFaturados, ...filteredOutTargetMonth];
    } else {
      const mapFat = new Map<string, WlpDailyFaturadoRecord>();
      currentFaturados.forEach(f => mapFat.set(f.dataISO, f));
      dailyFaturados.forEach(f => mapFat.set(f.dataISO, f));
      updatedFaturados = Array.from(mapFat.values());
    }

    localStorage.setItem(keyFat, JSON.stringify(updatedFaturados));
    localStorage.setItem(keyFatAlt, JSON.stringify(updatedFaturados));

    // 3. ATUALIZAÇÃO DA TABELA DE HISTÓRICO COMPARATIVO DE VOLUMES (JAN A DEZ 2026)
    try {
      let histVolumes: HistoricalVolumeRowItem[] = DEFAULT_HISTORICAL_VOLUMES;
      const savedHist = localStorage.getItem(keyHistVol);
      if (savedHist) {
        const parsed = JSON.parse(savedHist);
        if (Array.isArray(parsed) && parsed.length === 12) {
          histVolumes = parsed;
        }
      }

      monthsSummary.forEach(ms => {
        const parts = ms.mesAno.split('/');
        const mIdx = parseInt(parts[0], 10) - 1; // 0 = Jan, 1 = Fev, etc.
        if (mIdx >= 0 && mIdx < 12 && ms.volumeHL > 0) {
          const formattedVol = ms.volumeHL.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
          histVolumes[mIdx] = {
            ...histVolumes[mIdx],
            v26: formattedVol,
            isParcial26: false
          };
        }
      });

      localStorage.setItem(keyHistVol, JSON.stringify(histVolumes));
    } catch (e) {
      console.warn('Erro ao atualizar histórico de volumes:', e);
    }

    // 4. ATUALIZAÇÃO DO MONITORAMENTO DE ABSENTEÍSMO (2026)
    try {
      let absList: AbsenteeismMonthItem[] = DEFAULT_ABSENTEEISM_2026;
      const savedAbs = localStorage.getItem(keyAbs);
      if (savedAbs) {
        const parsed = JSON.parse(savedAbs);
        if (Array.isArray(parsed) && parsed.length === 12) {
          absList = parsed;
        }
      }

      Object.entries(parsedData.absenteismoDetectado).forEach(([mesAno, data]) => {
        const parts = mesAno.split('/');
        const mIdx = parseInt(parts[0], 10) - 1;
        if (mIdx >= 0 && mIdx < 12) {
          const valStr = data.taxa.toFixed(2).replace('.', ',') + '%';
          absList[mIdx] = {
            ...absList[mIdx],
            val: valStr,
            st: data.status
          };
        }
      });

      localStorage.setItem(keyAbs, JSON.stringify(absList));
    } catch (e) {
      console.warn('Erro ao atualizar absenteísmo:', e);
    }

    // 5. ATUALIZAÇÃO DAS CONFIGURAÇÕES MENSAIS WLP
    monthsSummary.forEach(ms => {
      const existingCfg = getWlpConfig(empresaId, ms.mesAno);
      saveWlpConfig({
        ...existingCfg,
        volumeFaturadoHL: ms.volumeHL,
        diasUteisTrabalhados: ms.diasComFaturamento > 0 ? ms.diasComFaturamento : existingCfg.diasUteisTrabalhados,
        quadroPessoalTTQLP: ms.colaboradoresUnicos > 0 ? ms.colaboradoresUnicos : existingCfg.quadroPessoalTTQLP,
        horasTurnoPadrao: 7.33
      });
    });

    // 6. GRAVAÇÃO NA BASE RETROATIVA CENTRAL (af_dados_retroativos_historicos_v3)
    try {
      const existingRetro = getRetroactiveRecords('todos');
      const filteredRetro = targetMonth !== 'TODOS' 
        ? existingRetro.filter(r => r.modulo !== 'wlp_faturado' || !r.dataFormatada.endsWith(targetMonth))
        : existingRetro;

      saveRetroactiveRecords([...parsedData.retroactiveRecords, ...filteredRetro]);
    } catch (e) {
      console.warn('Erro ao salvar central retroativa:', e);
    }

    // 7. GRAVAÇÃO NO REPOSITÓRIO JSON HÍBRIDO
    try {
      const jsonDbKey = `json_db:${empresaId}:wlp_faturado_jornadas`;
      localStorage.setItem(jsonDbKey, JSON.stringify({
        updatedAt: new Date().toISOString(),
        monthsSummary,
        totalJornadas: updatedJornadas.length,
        totalFaturados: updatedFaturados.length,
        totalVolumeHL: totalVolumeHl
      }));
    } catch (e) {}

    // 8. SINCRONIZAÇÃO NO FIRESTORE (Se habilitado)
    if (db) {
      try {
        // Grava lote de faturados
        for (const fat of dailyFaturados) {
          const docRef = doc(db, 'wlp_daily_faturados', fat.id);
          await setDoc(docRef, fat, { merge: true }).catch(console.warn);
        }

        // Grava todas as jornadas no Firestore
        for (const jrn of jornadas) {
          const docRef = doc(db, 'jornadas_colaboradores', jrn.id);
          await setDoc(docRef, jrn, { merge: true }).catch(console.warn);
        }
      } catch (e) {
        console.warn('Sincronização Firestore concluída com aviso:', e);
      }
    }

    // 9. DISPARAR EVENTOS GLOBAIS PARA ATUALIZAÇÃO IMEDIATA DA INTERFACE
    window.dispatchEvent(new Event('jornadas_updated'));
    window.dispatchEvent(new CustomEvent('jornadas_updated'));
    window.dispatchEvent(new Event('wlp_faturado_updated'));
    window.dispatchEvent(new CustomEvent('wlp_faturado_updated'));
    window.dispatchEvent(new Event('wlp_config_updated'));
    window.dispatchEvent(new Event('local_data_changed'));
    window.dispatchEvent(new Event('storage'));

    const detalhesMeses = monthsSummary.map(m => ({
      mesAno: m.mesAno,
      volumeHL: m.volumeHL,
      totalPontos: m.totalRegistros,
      totalHoras: m.totalHoras,
      wlp: m.wlpPrevisto
    }));

    return {
      success: true,
      totalJornadasSalvas: jornadas.length,
      totalDiasFaturadosSalvos: dailyFaturados.length,
      totalVolumeHL: totalVolumeHl,
      wlpGeral: wlpGeralHlHh,
      mesesAtualizados: mesesImpactados,
      message: `Sucesso! ${jornadas.length} pontos de colaboradores e ${dailyFaturados.length} lançamentos diários de HL faturado foram persistidos no WLP e Painel Estratégico.`,
      detalhesMeses,
      timestamp: new Date().toISOString()
    };
  } catch (error: any) {
    console.error('Erro na sincronização de WLP Faturado:', error);
    return {
      success: false,
      totalJornadasSalvas: 0,
      totalDiasFaturadosSalvos: 0,
      totalVolumeHL: 0,
      wlpGeral: 0,
      mesesAtualizados: [],
      message: `Erro ao sincronizar dados: ${error.message || 'Falha desconhecida'}`,
      detalhesMeses: [],
      timestamp: new Date().toISOString()
    };
  }
}
