import { DespejoRow } from '../types';
import { RetroactiveRecord, getRetroactiveRecords, saveRetroactiveRecords, clearRetroactiveModule } from '../utils/dadosRetroativosUtils';
import { DespejoRepository } from '../db/repositories';
import { getJsonTable, saveJsonTable } from '../utils/hybridJsonDatabase';
import { syncEntityToPublic } from './bancoDadosSyncClient';
import { invalidateHybridCache } from '../utils/hybridCacheService';

export interface DespejoSyncResult {
  success: boolean;
  insertedCount: number;
  updatedCount: number;
  totalSynced: number;
  collection: string;
  publicSyncStatus: boolean;
  hybridTableStatus: boolean;
  retroactiveSaved: number;
  modoSubstituicaoTotal?: boolean;
  divergenciasRemovidas?: number;
  errors: string[];
}

/**
 * Serviço de sincronização e persistência para dados retroativos de Despejo.
 * Suporta Modo Padrão da Plataforma (Substituição Total / Exclusão de Divergências):
 * Quando ativo, apaga registros anteriores divergentes e define o documento importado
 * como a única fonte da verdade oficial em todas as 5 camadas.
 */
export async function syncRetroactiveDespejoBatch(
  despejoRows: DespejoRow[],
  retroRecords: RetroactiveRecord[],
  empresaId = 'demo',
  tornarPadraoOficial = false
): Promise<DespejoSyncResult> {
  const result: DespejoSyncResult = {
    success: false,
    insertedCount: 0,
    updatedCount: 0,
    totalSynced: 0,
    collection: `empresas/${empresaId}/despejo`,
    publicSyncStatus: false,
    hybridTableStatus: false,
    retroactiveSaved: 0,
    modoSubstituicaoTotal: tornarPadraoOficial,
    divergenciasRemovidas: 0,
    errors: []
  };

  if (!despejoRows || despejoRows.length === 0) {
    result.errors.push('Nenhum registro de despejo fornecido para persistência.');
    return result;
  }

  try {
    // ── CAMADA 1: Repositório Oficial de Despejo (Firestore / BaseRepository) ──
    try {
      if (tornarPadraoOficial) {
        // Obter registros anteriores para auditoria
        const previousDocs = await DespejoRepository.getAll(empresaId);
        const newIds = new Set(despejoRows.map(r => String(r.id)));
        let removedCount = 0;
        
        // Excluir documentos anteriores divergentes
        for (const doc of previousDocs) {
          const docId = String(doc.id || (doc as any)._docId);
          if (!newIds.has(docId)) {
            try {
              await DespejoRepository.delete(docId, empresaId);
              removedCount++;
            } catch (_) {}
          }
        }
        result.divergenciasRemovidas = removedCount;
      }

      await DespejoRepository.batchUpsert(despejoRows, empresaId);
      result.insertedCount = despejoRows.length;
      result.totalSynced = despejoRows.length;
    } catch (err: any) {
      console.warn('[DespejoSync] Aviso no Repositório:', err.message);
    }

    // ── CAMADA 2: Tabela JSON Híbrida ──
    try {
      let updatedDespejoTable: DespejoRow[] = [];

      if (tornarPadraoOficial) {
        // Substituição total: a tabela passa a conter EXATAMENTE os novos dados importados
        updatedDespejoTable = [...despejoRows];
      } else {
        // Mesclagem com os dados pré-existentes
        const existingDespejoTable = await getJsonTable<DespejoRow>(empresaId, 'despejo');
        const mergedDespejoMap = new Map<string, DespejoRow>();
        
        existingDespejoTable.forEach(item => {
          if (item.id) mergedDespejoMap.set(String(item.id), item);
        });
        
        despejoRows.forEach(item => {
          if (item.id) mergedDespejoMap.set(String(item.id), item);
        });

        updatedDespejoTable = Array.from(mergedDespejoMap.values());
      }

      await saveJsonTable(empresaId, 'despejo', updatedDespejoTable);
      result.hybridTableStatus = true;
    } catch (err: any) {
      console.warn('[DespejoSync] Falha na tabela híbrida:', err.message);
      result.errors.push(`Tabela JSON Híbrida: ${err.message}`);
    }

    // ── CAMADA 3: Backend /public/banco-dados/hoje/despejo.json ──
    try {
      const timestamp = new Date().toISOString();
      const payloadDespejo = {
        dataReferencia: new Date().toISOString().split('T')[0],
        ultimaAtualizacao: timestamp,
        tipoOrigem: tornarPadraoOficial ? 'padrao_oficial_plataforma_despejo' : 'importacao_retroativa_json_despejo',
        isPadraoOficial: tornarPadraoOficial,
        totalItens: despejoRows.length,
        volumeTotalQtd: despejoRows.reduce((acc, d) => acc + (d.quantidade || 0), 0),
        dentroDaMeta: despejoRows.filter(d => d.resultado?.includes('DENTRO') || d.resultado?.includes('BATIDA') || d.status?.includes('DENTRO')).length,
        acimaDaMeta: despejoRows.filter(d => d.resultado?.includes('ACIMA') || d.resultado?.includes('NÃO') || d.status?.includes('ACIMA')).length,
        itens: despejoRows
      };

      const publicSync = await syncEntityToPublic('despejo', payloadDespejo);
      result.publicSyncStatus = publicSync.success;
    } catch (err: any) {
      console.warn('[DespejoSync] Falha na sincronização pública:', err.message);
    }

    // ── CAMADA 4: Armazenamento Retroativo Local Central ──
    try {
      if (retroRecords && retroRecords.length > 0) {
        if (tornarPadraoOficial) {
          // Limpar registros anteriores de despejo no histórico local
          clearRetroactiveModule('despejo');
          clearRetroactiveModule('despejo_repack');
        }

        const existingRetro = getRetroactiveRecords('todos');
        const existingRetroMap = new Map<string, RetroactiveRecord>();
        
        existingRetro.forEach(r => existingRetroMap.set(r.id, r));
        retroRecords.forEach(r => existingRetroMap.set(r.id, r));

        const updatedRetroList = Array.from(existingRetroMap.values());
        saveRetroactiveRecords(updatedRetroList);
        result.retroactiveSaved = retroRecords.length;
      }
    } catch (err: any) {
      console.warn('[DespejoSync] Falha no histórico retroativo:', err.message);
    }

    // ── CAMADA 5: Registrar Flag de Padrão Oficial no Storage ──
    if (tornarPadraoOficial) {
      try {
        localStorage.setItem('af_despejo_padrao_oficial_meta', JSON.stringify({
          definidoEm: new Date().toISOString(),
          totalRegistros: despejoRows.length,
          fonte: 'importacao_json_padrao_oficial'
        }));
      } catch (_) {}
    }

    // ── CAMADA 6: Invalidação de Cache e Disparo de Eventos ──
    try {
      invalidateHybridCache(`empresas/${empresaId}/despejo`);
      invalidateHybridCache('despejo');

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('despejo-db-updated', {
          detail: { count: despejoRows.length, timestamp: Date.now(), isPadraoOficial: tornarPadraoOficial }
        }));
        window.dispatchEvent(new CustomEvent('retroactive-data-updated', {
          detail: { modulo: 'despejo', count: retroRecords.length, isPadraoOficial: tornarPadraoOficial }
        }));
        window.dispatchEvent(new CustomEvent('empresa-data-reload', {
          detail: { entity: 'despejo' }
        }));
      }
    } catch (evtErr) {
      // Ignorar
    }

    result.success = result.insertedCount > 0 || result.retroactiveSaved > 0 || result.hybridTableStatus;
    return result;

  } catch (error: any) {
    result.success = false;
    result.errors.push(`Erro crítico na sincronização de Despejo: ${error.message}`);
    return result;
  }
}
