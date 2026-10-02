import { 
  ValidadesRepository, 
  ValidadesConfigRepository, 
  ValidadesHistoricoRepository, 
  FefoCloudAdjustmentsRepository 
} from '../db/repositories';
import { ValidadeRow } from '../types';
import { formatDateToBR, getValidadeQty, matchValidade } from './fefoDefaultData';
import { 
  DashboardValidadeAdjustment, 
  getAdjustmentKey, 
  getDashboardAdjustments, 
  saveDashboardAdjustment,
  removeDashboardAdjustment 
} from './fefoDashboardAdjustments';
import { saveSelectedValidadesKeys, getSelectedValidadesKeys } from './fefoSelectionManager';

export interface ValidadeHistoricoExclusao {
  id: string;
  codigo: string;
  descricao: string;
  validade: string;
  quantidade: number;
  lote?: string;
  localizacao?: string;
  bloco?: string;
  excluidoPor: string;
  excluidoEm: string;
  rawDoc?: any;
  destino?: 'PNC' | 'VENDIDO' | 'DESCARTE';
  motivo?: string;
}

/**
 * Salva a seleção de validades globalmente no Firestore para que todos os colaboradores
 * vejam exatamente a mesma coleta selecionada em tempo real em todas as máquinas.
 */
export async function saveSharedValidadesSelection(
  companyId: string = 'demo',
  keys: Set<string>,
  updatedBy: string = 'Colaborador'
): Promise<void> {
  const keysArray = Array.from(keys);
  // 1. Salva localmente primeiro para resposta instantânea na UI
  saveSelectedValidadesKeys(keys, companyId);

  // 2. Persiste no Firestore para todos os colaboradores
  try {
    const docId = `shared_selection_${companyId || 'demo'}`;
    await ValidadesConfigRepository.upsert(
      docId,
      {
        id: docId,
        selectedKeys: keysArray,
        count: keysArray.length,
        updatedBy,
        updatedAt: new Date().toISOString()
      },
      companyId
    );
  } catch (err) {
    console.warn('[saveSharedValidadesSelection] Erro ao sincronizar seleção no Firestore:', err);
  }
}

/**
 * Subscreve às alterações da seleção de validades no Firestore em tempo real.
 * Qualquer colaborador que alternar a coleta fará a alteração propagar para todas as telas.
 */
export function subscribeSharedValidadesSelection(
  companyId: string = 'demo',
  onUpdate: (keys: Set<string>, updatedBy?: string) => void
): () => void {
  const docId = `shared_selection_${companyId || 'demo'}`;
  return ValidadesConfigRepository.subscribeDoc(
    docId,
    (data: any) => {
      if (data && Array.isArray(data.selectedKeys)) {
        const next = new Set<string>(data.selectedKeys);
        // Atualiza cache local
        try {
          localStorage.setItem(`fefo_selected_validades_${companyId}`, JSON.stringify(data.selectedKeys));
          localStorage.setItem(`fefo_selected_validades_initialized_${companyId}`, 'true');
        } catch (_) {}
        window.dispatchEvent(new CustomEvent('fefo_selection_updated', { detail: { companyId, count: next.size } }));
        window.dispatchEvent(new Event('fefo_selection_updated'));
        onUpdate(next, data.updatedBy);
      }
    },
    (err: any) => {
      console.warn('[subscribeSharedValidadesSelection] Erro no listener Firestore:', err);
    }
  );
}

/**
 * Salva alteração de quantidade e validade DEFINITIVAMENTE no Firestore e localmente,
 * propagando imediatamente para todos os colaboradores conectados via link.
 */
export async function saveDefinitiveCloudValidade(
  companyId: string = 'demo',
  adjustment: {
    codigo: string | number;
    validadeOriginal: string;
    novaValidade?: string;
    quantidade: number;
    localizacao?: string;
    bloco?: string;
    descricao?: string;
    originalQty?: number;
    userNome?: string;
    rawDoc?: any;
  }
): Promise<void> {
  const cod = String(adjustment.codigo).replace(/^0+/, '').trim();
  const valOrig = formatDateToBR(adjustment.validadeOriginal);
  const finalVal = adjustment.novaValidade ? formatDateToBR(adjustment.novaValidade) : valOrig;
  const finalQty = Number(adjustment.quantidade) >= 0 ? Number(adjustment.quantidade) : 0;
  const key = getAdjustmentKey(cod, valOrig);

  const adjPayload: DashboardValidadeAdjustment = {
    codigo: cod,
    validadeOriginal: valOrig,
    novaValidade: finalVal,
    quantidade: finalQty,
    localizacao: adjustment.localizacao || 'central',
    bloco: adjustment.bloco || '',
    isExcluded: false,
    ajustadoEm: new Date().toISOString(),
    ajustadoPor: adjustment.userNome || 'Colaborador',
    originalQty: adjustment.originalQty
  };

  // 1. Salva localmente imediatamente para reatividade
  saveDashboardAdjustment(companyId, adjPayload);

  // 2. Grava no repositório de ajustes na nuvem (Firestore)
  try {
    await FefoCloudAdjustmentsRepository.upsert(
      key,
      {
        id: key,
        ...adjPayload,
        companyId
      },
      companyId
    );
  } catch (err) {
    console.warn('[saveDefinitiveCloudValidade] Erro ao salvar em FefoCloudAdjustmentsRepository:', err);
  }

  // 3. Atualiza ou cria o documento no ValidadesRepository oficial
  try {
    const docId = adjustment.rawDoc?._docId || adjustment.rawDoc?.id || `val_${cod}_${finalVal.replace(/\//g, '')}`;
    await ValidadesRepository.upsert(
      String(docId),
      {
        id: String(docId),
        codigo: cod,
        descricao: adjustment.descricao || `Produto ${cod}`,
        quantidade: finalQty,
        caixa: finalQty,
        totalUnities: finalQty,
        totalUnitiesRaw: finalQty,
        validade: finalVal,
        localizacao: adjustment.localizacao || 'central',
        bloco: adjustment.bloco || '',
        empresaId: companyId,
        atualizadoEm: new Date().toISOString(),
        atualizadoPor: adjustment.userNome || 'Colaborador'
      },
      companyId
    );
  } catch (err) {
    console.warn('[saveDefinitiveCloudValidade] Erro ao atualizar ValidadesRepository:', err);
  }

  // Dispara eventos locais e de janela para reatividade instantânea em todos os componentes
  window.dispatchEvent(new CustomEvent('fefo_definitive_updated', {
    detail: { codigo: cod, validade: finalVal, quantidade: finalQty }
  }));
  window.dispatchEvent(new Event('fefo_adjustments_updated'));
  window.dispatchEvent(new Event('validades_updated'));
  window.dispatchEvent(new Event('app_data_updated'));
  window.dispatchEvent(new Event('local_data_changed'));
}

/**
 * Escuta ajustes de quantidade e validade na nuvem em tempo real (Firestore).
 * Permite que múltiplos colaboradores vejam as alterações feitas por outros instantaneamente.
 */
export function subscribeFefoCloudAdjustments(
  companyId: string = 'demo',
  onUpdate: (adjustments: Record<string, DashboardValidadeAdjustment>) => void
): () => void {
  return FefoCloudAdjustmentsRepository.subscribe(
    companyId,
    (items: any[]) => {
      const map: Record<string, DashboardValidadeAdjustment> = {};
      if (Array.isArray(items)) {
        items.forEach(item => {
          if (item && item.codigo && item.validadeOriginal) {
            const k = getAdjustmentKey(item.codigo, item.validadeOriginal);
            map[k] = {
              codigo: String(item.codigo).replace(/^0+/, '').trim(),
              validadeOriginal: formatDateToBR(item.validadeOriginal),
              novaValidade: item.novaValidade ? formatDateToBR(item.novaValidade) : formatDateToBR(item.validadeOriginal),
              quantidade: Number(item.quantidade) >= 0 ? Number(item.quantidade) : 0,
              localizacao: item.localizacao || 'central',
              bloco: item.bloco || '',
              isExcluded: item.isExcluded === true,
              ajustadoEm: item.ajustadoEm || new Date().toISOString(),
              ajustadoPor: item.ajustadoPor || 'Colaborador',
              originalQty: item.originalQty
            };
          }
        });
      }

      // Sincroniza com localStorage
      try {
        const local = getDashboardAdjustments(companyId);
        const merged = { ...local, ...map };
        localStorage.setItem(`fefo_dashboard_adjustments_${companyId}`, JSON.stringify(merged));
      } catch (_) {}

      window.dispatchEvent(new Event('fefo_adjustments_updated'));
      window.dispatchEvent(new Event('validades_updated'));
      window.dispatchEvent(new Event('local_data_changed'));
      onUpdate(map);
    },
    (err: any) => {
      console.warn('[subscribeFefoCloudAdjustments] Erro no listener Firestore:', err);
    }
  );
}

/**
 * Move um item para o Histórico de Exclusões na nuvem (Firestore).
 * O item não é apagado definitivamente e fica disponível no ícone de Histórico para restauração por qualquer colaborador.
 */
export async function sendValidadeToCloudHistory(
  companyId: string = 'demo',
  item: {
    codigo: string | number;
    validade: string;
    descricao?: string;
    quantidade?: number;
    lote?: string;
    localizacao?: string;
    bloco?: string;
    rawDoc?: any;
    userNome?: string;
    destino?: 'PNC' | 'VENDIDO' | 'DESCARTE';
    motivo?: string;
  }
): Promise<void> {
  const cod = String(item.codigo).replace(/^0+/, '').trim();
  const valBR = formatDateToBR(item.validade);
  const docId = `hist_${cod}_${valBR.replace(/\//g, '')}_${Date.now()}`;
  const key = getAdjustmentKey(cod, valBR);

  const historicoEntry: ValidadeHistoricoExclusao = {
    id: docId,
    codigo: cod,
    descricao: item.descricao || `Produto ${cod}`,
    validade: valBR,
    quantidade: item.quantidade !== undefined ? Number(item.quantidade) : 0,
    lote: item.lote || (item.rawDoc as any)?.lote || '',
    localizacao: item.localizacao || item.rawDoc?.localizacao || 'central',
    bloco: item.bloco || item.rawDoc?.bloco || '',
    excluidoPor: item.userNome || 'Colaborador',
    excluidoEm: new Date().toISOString(),
    rawDoc: item.rawDoc || null,
    destino: item.destino || 'DESCARTE',
    motivo: item.motivo || ''
  };

  // 1. Salva no Firestore no histórico compartilhado
  try {
    await ValidadesHistoricoRepository.upsert(docId, historicoEntry, companyId);
  } catch (err) {
    console.warn('[sendValidadeToCloudHistory] Erro ao salvar histórico no Firestore:', err);
  }

  // 2. Marca como excluído nos ajustes na nuvem
  try {
    await FefoCloudAdjustmentsRepository.upsert(
      key,
      {
        id: key,
        codigo: cod,
        validadeOriginal: valBR,
        isExcluded: true,
        quantidade: 0,
        ajustadoEm: new Date().toISOString(),
        ajustadoPor: item.userNome || 'Colaborador'
      },
      companyId
    );
  } catch (err) {
    console.warn('[sendValidadeToCloudHistory] Erro ao marcar ajuste como excluído:', err);
  }

  // 3. Salva ajuste localmente
  saveDashboardAdjustment(companyId, {
    codigo: cod,
    validadeOriginal: valBR,
    isExcluded: true,
    quantidade: 0,
    ajustadoEm: new Date().toISOString(),
    ajustadoPor: item.userNome || 'Colaborador'
  });
}

/**
 * Escuta em tempo real o histórico de exclusões compartilhado no Firestore.
 */
export function subscribeValidadesCloudHistory(
  companyId: string = 'demo',
  onUpdate: (items: ValidadeHistoricoExclusao[]) => void
): () => void {
  return ValidadesHistoricoRepository.subscribe(
    companyId,
    (items: any[]) => {
      const formatted: ValidadeHistoricoExclusao[] = (items || []).map(i => ({
        id: String(i.id || i._docId || Math.random()),
        codigo: String(i.codigo || '').replace(/^0+/, '').trim(),
        descricao: i.descricao || `Produto ${i.codigo}`,
        validade: formatDateToBR(i.validade),
        quantidade: Number(i.quantidade) || 0,
        lote: i.lote || '',
        localizacao: i.localizacao || 'central',
        bloco: i.bloco || '',
        excluidoPor: i.excluidoPor || 'Colaborador',
        excluidoEm: i.excluidoEm || new Date().toISOString(),
        rawDoc: i.rawDoc,
        destino: i.destino || 'DESCARTE',
        motivo: i.motivo || ''
      }));
      formatted.sort((a, b) => b.excluidoEm.localeCompare(a.excluidoEm));
      onUpdate(formatted);
    },
    (err: any) => {
      console.warn('[subscribeValidadesCloudHistory] Erro no listener de histórico:', err);
    }
  );
}

/**
 * Restaura um item do Histórico de Exclusões de volta para a operação ativa no Firestore.
 */
export async function restoreValidadeFromCloudHistory(
  companyId: string = 'demo',
  historyItem: ValidadeHistoricoExclusao
): Promise<void> {
  const cod = String(historyItem.codigo).replace(/^0+/, '').trim();
  const valBR = formatDateToBR(historyItem.validade);
  const key = getAdjustmentKey(cod, valBR);

  // 1. Remove do repositório de histórico no Firestore
  try {
    await ValidadesHistoricoRepository.delete(historyItem.id, companyId);
  } catch (err) {
    console.warn('[restoreValidadeFromCloudHistory] Erro ao deletar do histórico:', err);
  }

  // 2. Remove flag isExcluded nos ajustes na nuvem
  try {
    await FefoCloudAdjustmentsRepository.upsert(
      key,
      {
        id: key,
        codigo: cod,
        validadeOriginal: valBR,
        isExcluded: false,
        quantidade: historyItem.quantidade || 10,
        ajustadoEm: new Date().toISOString(),
        ajustadoPor: 'Restauração'
      },
      companyId
    );
  } catch (err) {
    console.warn('[restoreValidadeFromCloudHistory] Erro ao atualizar FefoCloudAdjustmentsRepository:', err);
  }

  // 3. Atualiza localmente e limpa tombstone
  removeDashboardAdjustment(companyId, cod, valBR);
  const deletedKey = `fefo_deleted_validades_${companyId}`;
  const globalDelKey = 'fefo_deleted_validades_global';
  [deletedKey, globalDelKey].forEach(k => {
    try {
      const stored = localStorage.getItem(k);
      if (stored) {
        const list = JSON.parse(stored);
        if (Array.isArray(list)) {
          const filtered = list.filter(item => !matchValidade(item, { codigo: cod, validade: valBR }));
          localStorage.setItem(k, JSON.stringify(filtered));
        }
      }
    } catch (_) {}
  });

  // 4. Restaura documento ativo no ValidadesRepository
  try {
    const docId = `val_${cod}_${valBR.replace(/\//g, '')}`;
    await ValidadesRepository.upsert(
      docId,
      {
        id: docId,
        codigo: cod,
        descricao: historyItem.descricao,
        quantidade: historyItem.quantidade || 10,
        caixa: historyItem.quantidade || 10,
        totalUnities: historyItem.quantidade || 10,
        totalUnitiesRaw: historyItem.quantidade || 10,
        validade: valBR,
        localizacao: historyItem.localizacao || 'central',
        bloco: historyItem.bloco || '',
        lote: historyItem.lote || '',
        empresaId: companyId,
        restauradoEm: new Date().toISOString()
      },
      companyId
    );
  } catch (err) {
    console.warn('[restoreValidadeFromCloudHistory] Erro ao recriar no ValidadesRepository:', err);
  }

  // Dispara eventos para reatividade instantânea
  window.dispatchEvent(new CustomEvent('fefo_validades_restored', {
    detail: { codigo: cod, validade: valBR }
  }));
  window.dispatchEvent(new Event('fefo_validades_restored'));
  window.dispatchEvent(new Event('fefo_adjustments_updated'));
  window.dispatchEvent(new Event('validades_updated'));
  window.dispatchEvent(new Event('local_data_changed'));
  window.dispatchEvent(new Event('app_data_updated'));
}

/**
 * Restaura todos os itens do Histórico de Exclusões de uma só vez.
 */
export async function restoreAllFromCloudHistory(
  companyId: string = 'demo',
  items: ValidadeHistoricoExclusao[]
): Promise<number> {
  let count = 0;
  for (const item of items) {
    try {
      await restoreValidadeFromCloudHistory(companyId, item);
      count++;
    } catch (_) {}
  }
  return count;
}
