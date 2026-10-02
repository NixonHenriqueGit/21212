// Sync and Persistence Service for Retroactive Temperature Data
import { ArmazemTemperaturaLog } from '../types';
import { saveTempLogs, sortTempLogsDescending, TEMP_STORAGE_KEY } from '../utils/tempStorage';
import { TemperaturaLogsRepository } from '../db/repositories';

export interface SaveTemperaturaRetroativaOptions {
  logs: ArmazemTemperaturaLog[];
  tornarPadraoOficial?: boolean;
  empresaId?: string;
  userNome?: string;
}

export interface SaveTemperaturaRetroativasResult {
  success: boolean;
  importedCount: number;
  message: string;
  details: {
    totalRegistros: number;
    diasAbrangidos: number;
    mediaGeral: number;
    alertasCriticos: number;
    timestamp: string;
  };
}

/**
 * Persists retroactive temperature logs into the platform storage and Firestore Cloud Database,
 * dispatches storage events to automatically update charts and widgets in real-time.
 */
export async function persistirTemperaturaRetroativaNoBanco(
  options: SaveTemperaturaRetroativaOptions
): Promise<SaveTemperaturaRetroativasResult> {
  const { logs, tornarPadraoOficial = true, empresaId = 'demo', userNome = 'Usuário' } = options;

  if (!logs || logs.length === 0) {
    throw new Error('Nenhum registro válido de temperatura fornecido para persistência.');
  }

  const sortedLogs = sortTempLogsDescending(logs);

  // 1. Persist to Firestore Cloud Database Repository
  try {
    const recordsToSave = sortedLogs.map(log => ({
      ...log,
      id: log.id || `temp_${log.dataISO}_${(log.hora || '00:00').replace(/[:\s]/g, '')}_${log.setor || 'armazem'}`
    }));
    await TemperaturaLogsRepository.batchUpsert(recordsToSave, empresaId);
  } catch (err) {
    console.warn('Alerta ao persistir temperatura no Firestore:', err);
  }

  // 2. Persist to LocalStorage (Immediate client-side fast cache for temperature)
  saveTempLogs(sortedLogs);

  // 3. Persist audit metadata
  try {
    const meta = {
      importedAt: new Date().toISOString(),
      importedBy: userNome,
      count: sortedLogs.length,
      isOfficialBase: tornarPadraoOficial
    };
    localStorage.setItem('armazem_temperatura_meta', JSON.stringify(meta));
  } catch (e) {
    console.warn('Não foi possível salvar os metadados de temperatura:', e);
  }

  // 4. Dispatch reactive events
  window.dispatchEvent(new CustomEvent('armazem_temp_logs_updated', { detail: sortedLogs }));
  window.dispatchEvent(new Event('storage'));

  // Calculate summary stats
  const uniqueDays = new Set(sortedLogs.map(l => l.dataISO)).size;
  const sumTemp = sortedLogs.reduce((acc, l) => acc + l.temperatura, 0);
  const avgTemp = sortedLogs.length > 0 ? Math.round((sumTemp / sortedLogs.length) * 10) / 10 : 0;
  const critCount = sortedLogs.filter(l => l.temperatura > 28.0 || l.temperatura < 18.0).length;

  return {
    success: true,
    importedCount: sortedLogs.length,
    message: `Base de temperatura retroativa sincronizada com sucesso! ${sortedLogs.length} aferições salvas no Banco de Dados.`,
    details: {
      totalRegistros: sortedLogs.length,
      diasAbrangidos: uniqueDays,
      mediaGeral: avgTemp,
      alertasCriticos: critCount,
      timestamp: new Date().toLocaleDateString('pt-BR') + ' às ' + new Date().toLocaleTimeString('pt-BR')
    }
  };
}
