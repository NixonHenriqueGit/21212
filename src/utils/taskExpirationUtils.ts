import { Tarefa } from '../types';
import { TarefasRepository } from '../db';

/**
 * Verifica se uma tarefa aberta já excedeu o limite de horas (padrão: 5 horas)
 * a partir do início da execução (iniciadoEm) ou da sua criação (criadoEm).
 */
export function isTaskExpired(task: Tarefa, maxHours: number = 5): boolean {
  // Tarefas concluídas não expiram pela regra de tempo aberto
  if (task.status === 'done') return false;

  const maxMs = maxHours * 60 * 60 * 1000;
  const now = Date.now();

  // Prioridade: data de início de execução > data de criação
  const refDateStr = task.iniciadoEm || task.criadoEm;
  let refTime = 0;

  if (refDateStr) {
    const parsed = new Date(refDateStr).getTime();
    if (!isNaN(parsed) && parsed > 0) {
      refTime = parsed;
    }
  }

  // Se id for numérico com timestamp válido
  if (!refTime && typeof task.id === 'number' && task.id > 1000000000) {
    refTime = task.id;
  }

  // Se não foi possível determinar a data de criação/início, não remove
  if (!refTime) return false;

  return (now - refTime) > maxMs;
}

/**
 * Remove tarefas duplicadas por _docId, id numérico ou combinação unívoca de dados operacionais.
 */
export function deduplicateTasks(tasks: Tarefa[]): Tarefa[] {
  if (!Array.isArray(tasks) || tasks.length <= 1) return tasks || [];

  const seenDocIds = new Set<string>();
  const seenIds = new Set<string>();
  const seenFingerprints = new Set<string>();
  const result: Tarefa[] = [];

  for (const t of tasks) {
    if (!t) continue;

    const docKey = t._docId ? String(t._docId).trim() : '';
    const idKey = t.id !== undefined && t.id !== null ? String(t.id).trim() : '';
    const fp = `${t.codigo || ''}_${t.quantidade || ''}_${t.criadoEm || ''}_${t.conferente || ''}_${t.operador || ''}_${t.finalizadoEm || ''}`;

    // Se já vimos este _docId ou este id comercial
    if (docKey && seenDocIds.has(docKey)) continue;
    if (idKey && seenIds.has(idKey)) continue;
    if (fp.length > 15 && seenFingerprints.has(fp)) continue;

    if (docKey) seenDocIds.add(docKey);
    if (idKey) seenIds.add(idKey);
    if (fp.length > 15) seenFingerprints.add(fp);

    result.push(t);
  }

  return result;
}

/**
 * Filtra tarefas ativas, separando as tarefas abertas expiradas (> 5 horas)
 * e garantindo que não haja tarefas duplicadas.
 */
export function filterExpiredOpenTasks(tasks: Tarefa[], maxHours: number = 5): { activeTasks: Tarefa[]; expiredTasks: Tarefa[] } {
  const deduped = deduplicateTasks(tasks);
  const activeTasks: Tarefa[] = [];
  const expiredTasks: Tarefa[] = [];

  for (const t of deduped) {
    if (isTaskExpired(t, maxHours)) {
      expiredTasks.push(t);
    } else {
      activeTasks.push(t);
    }
  }

  return { activeTasks, expiredTasks };
}

/**
 * Remove tarefas abertas expiradas do armazenamento local e do banco de dados (TarefasRepository).
 * Dispara eventos de atualização em tempo real caso alguma tarefa tenha sido removida.
 */
export async function purgeExpiredOpenTasks(
  empresaId: string,
  tasksList: Tarefa[],
  maxHours: number = 5
): Promise<Tarefa[]> {
  if (!Array.isArray(tasksList) || tasksList.length === 0) return tasksList || [];

  const deduped = deduplicateTasks(tasksList);
  const { activeTasks, expiredTasks } = filterExpiredOpenTasks(deduped, maxHours);

  if (expiredTasks.length === 0 && deduped.length === tasksList.length) {
    return activeTasks;
  }

  // Excluir tarefas expiradas no Firestore / TarefasRepository
  for (const exp of expiredTasks) {
    if (exp._docId) {
      try {
        await TarefasRepository.delete(exp._docId, empresaId);
      } catch (err) {
        console.warn(`[Auto-Remove 5h] Erro ao remover tarefa expirada #${exp.id} do repo:`, err);
      }
    }
  }

  // Atualizar localStorage com tarefas limpas e sem duplicatas
  try {
    localStorage.setItem(`tasks_${empresaId}`, JSON.stringify(activeTasks));
    localStorage.setItem(`tarefas_rows_${empresaId}`, JSON.stringify(activeTasks));
  } catch (e) {
    console.error('[Auto-Remove 5h] Erro ao persistir tasks no localStorage:', e);
  }

  // Notificar outros componentes / abas
  window.dispatchEvent(new CustomEvent('app_data_updated'));
  window.dispatchEvent(new CustomEvent('local_data_changed'));
  window.dispatchEvent(new CustomEvent('tasks_updated'));
  window.dispatchEvent(new CustomEvent('tarefas_updated'));

  return activeTasks;
}
