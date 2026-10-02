/**
 * SYNC DATABASE - Camada de Sincronização e Conectividade
 * 
 * Gerencia a sincronização incremental entre Firestore e o cache local,
 * além de disparar notificações para o Sync Service no Backend atualizar /public/banco-dados/hoje/.
 */

import { syncIncremental } from '../utils/syncIncremental';
import {
  syncAllEntitiesToPublic,
  syncEntityToPublic,
  executarFechamentoDiarioClient,
  getHistoricoFechamentosClient,
  FechamentoDiarioResponse
} from '../services/bancoDadosSyncClient';
import { SyncStatus } from './databaseTypes';

export class SyncDatabase {
  private static instance: SyncDatabase;
  private syncInProgress = false;
  private lastSyncTime: string = new Date().toISOString();
  private lastError?: string;

  private constructor() {}

  public static getInstance(): SyncDatabase {
    if (!SyncDatabase.instance) {
      SyncDatabase.instance = new SyncDatabase();
    }
    return SyncDatabase.instance;
  }

  /**
   * Executa sincronização incremental do Firestore para o cache local
   */
  public async syncWithCloud(
    collections: string[],
    empresaId = 'demo'
  ): Promise<Record<string, boolean>> {
    this.syncInProgress = true;
    try {
      const results: Record<string, boolean> = {};
      for (const col of collections) {
        syncIncremental({
          collectionName: col,
          empresaId,
          onData: () => {
            results[col] = true;
          }
        });
        results[col] = true;
      }
      this.lastSyncTime = new Date().toISOString();
      this.lastError = undefined;
      return results;
    } catch (err: any) {
      this.lastError = err.message;
      throw err;
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Envia dados do estado para o Backend Sync Service publicar em /public/banco-dados/hoje/
   */
  public async pushToPublicFiles(payload: any): Promise<boolean> {
    try {
      const res = await syncAllEntitiesToPublic(payload);
      return res.success;
    } catch (err) {
      console.warn('[SyncDatabase] Falha ao publicar em arquivos estáticos:', err);
      return false;
    }
  }

  public async pushEntityToPublic(entity: string, data: any): Promise<boolean> {
    try {
      const res = await syncEntityToPublic(entity, data);
      return res.success;
    } catch (err) {
      console.warn(`[SyncDatabase] Falha ao publicar ${entity}:`, err);
      return false;
    }
  }

  /**
   * Executa a rotina de fechamento diário:
   * 1. hoje/ -> historico/YYYY/MM/DD/
   * 2. Atualiza os índices
   * 3. Valida os arquivos gerados
   * 4. Inicia o novo dia operacional
   * 5. NÃO apaga dados do Firestore
   */
  public async executarFechamentoDiario(
    dataFechamento?: string,
    proximaData?: string
  ): Promise<FechamentoDiarioResponse> {
    this.syncInProgress = true;
    try {
      const res = await executarFechamentoDiarioClient(dataFechamento, proximaData);
      this.lastSyncTime = new Date().toISOString();
      this.lastError = res.success ? undefined : res.error;
      return res;
    } catch (err: any) {
      this.lastError = err.message;
      throw err;
    } finally {
      this.syncInProgress = false;
    }
  }

  public async getHistoricoFechamentos(): Promise<any[]> {
    return await getHistoricoFechamentosClient();
  }

  public getStatus(): SyncStatus {
    return {
      lastSync: this.lastSyncTime,
      inProgress: this.syncInProgress,
      pendingMutations: 0,
      lastError: this.lastError
    };
  }
}

export const syncDb = SyncDatabase.getInstance();

