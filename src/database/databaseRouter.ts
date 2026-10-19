/**
 * DATABASE ROUTER - Mecanismo Central de Decisão e Roteamento de Dados
 * 
 * Responsável por decidir onde buscar cada informação com base na regra de prioridade:
 * 
 * 1. HISTÓRICO:
 *    JSON -> Cache
 *    * Nunca consultar Firestore automaticamente para um histórico que já esteja disponível no JSON.
 * 
 * 2. DADOS ATUAIS NÃO CRÍTICOS:
 *    Cache -> JSON -> Firestore somente se necessário
 * 
 * 3. DADOS REALTIME:
 *    Firestore
 *    * Somente dados que realmente precisam de atualização em tempo real utilizam listeners.
 * 
 * 4. DADO INEXISTENTE (Fluxo de Descoberta):
 *    Cache -> JSON -> Firestore -> Atualizar Cache -> Disponibilizar para aplicação
 */

import { cacheDb } from './cacheDatabase';
import { jsonDb } from './jsonDatabase';
import { firestoreDb } from './firestoreDatabase';
import { 
  QueryOptions, 
  QueryFilter, 
  DatabaseResult, 
  DataClassification, 
  DatabaseMetrics,
  PaginatedResult
} from './databaseTypes';
import { isRealtimePermitido, getRealtimeInfo } from '../utils/realtimeClassification';

export class DatabaseRouter {
  private static instance: DatabaseRouter;
  // Deduplicação de queries idênticas em trânsito simultâneo
  private inFlightRequests: Map<string, Promise<any>> = new Map();

  private constructor() {}

  public static getInstance(): DatabaseRouter {
    if (!DatabaseRouter.instance) {
      DatabaseRouter.instance = new DatabaseRouter();
    }
    return DatabaseRouter.instance;
  }

  /**
   * Executa uma query prevenindo duplicação quando múltiplos componentes
   * solicitam a mesma coleção/filtro simultaneamente.
   */
  private async deduplicateQuery<R>(key: string, queryFn: () => Promise<R>): Promise<R> {
    if (this.inFlightRequests.has(key)) {
      return this.inFlightRequests.get(key) as Promise<R>;
    }

    const promise = queryFn().finally(() => {
      this.inFlightRequests.delete(key);
    });

    this.inFlightRequests.set(key, promise);
    return promise;
  }

  // =========================================================================
  // 1. DADOS: Consulta direta ao Firestore (100% nativo)
  // =========================================================================
  public async getHistorico<T extends { id?: string | number; _docId?: string | number }>(
    collectionName: string,
    empresaId = 'demo',
    options?: QueryOptions<T>
  ): Promise<T[]> {
    return firestoreDb.getList<T>(collectionName, empresaId, options);
  }

  // =========================================================================
  // 2. DADOS GERAIS: Consulta direta ao Firestore (100% nativo)
  // =========================================================================
  public async getNaoCritico<T extends { id?: string | number; _docId?: string | number }>(
    collectionName: string,
    empresaId = 'demo',
    options?: QueryOptions<T>
  ): Promise<T[]> {
    return firestoreDb.getList<T>(collectionName, empresaId, options);
  }

  // =========================================================================
  // 3. REGRA DE PRIORIDADE: DADOS REALTIME (Firestore via Listener)
  // =========================================================================
  public subscribeRealtime<T extends { id?: string | number; _docId?: string | number }>(
    collectionName: string,
    empresaId = 'demo',
    callback: (items: T[]) => void,
    onError?: (err: any) => void
  ): () => void {
    return firestoreDb.subscribe<T>(
      collectionName,
      empresaId,
      (items) => {
        callback(items);
      },
      onError
    );
  }

  /**
   * Subscription para documento único em tempo real diretamente do Firestore
   */
  public subscribeDoc<T extends { id?: string | number; _docId?: string | number }>(
    collectionName: string,
    docId: string | number,
    callback: (data: T | null) => void,
    onError?: (err: any) => void
  ): () => void {
    const strDocId = String(docId);
    return firestoreDb.subscribeDoc<T>(
      collectionName,
      strDocId,
      callback,
      onError
    );
  }

  // =========================================================================
  // 4. CONSULTA DIRETA AO FIRESTORE (SEM CACHE E SEM ARQUIVOS JSON)
  // =========================================================================
  public async getList<T extends { id?: string | number; _docId?: string | number }>(
    collectionName: string,
    empresaId = 'demo',
    options?: QueryOptions<T>
  ): Promise<T[]> {
    const queryKey = `getList:${empresaId}:${collectionName}:${JSON.stringify(options || {})}`;
    return this.deduplicateQuery<T[]>(queryKey, async () => {
      return firestoreDb.getList<T>(collectionName, empresaId, options);
    });
  }

  /**
   * Busca dados paginados eficientemente usando cursores do Firestore
   */
  public async getPaginated<T extends { id?: string | number; _docId?: string | number }>(
    collectionName: string,
    empresaId = 'demo',
    options?: QueryOptions<T>
  ): Promise<PaginatedResult<T>> {
    return firestoreDb.getPaginated<T>(collectionName, empresaId, options);
  }

  /**
   * Busca item por ID diretamente no Firestore
   */
  public async getById<T extends { id?: string | number; _docId?: string | number }>(
    collectionName: string,
    id: string | number,
    empresaId = 'demo'
  ): Promise<T | null> {
    const strId = String(id);
    return firestoreDb.getById<T>(collectionName, strId, empresaId);
  }

  // =========================================================================
  // OPERAÇÕES DE MUTAÇÃO (CREATE, UPDATE, DELETE, BATCH) - 100% FIRESTORE
  // =========================================================================

  public async create<T extends { id?: string | number; _docId?: string | number }>(
    collectionName: string,
    data: any,
    empresaId = 'demo',
    customDocId?: string
  ): Promise<T> {
    return firestoreDb.create<T>(collectionName, data, empresaId, customDocId);
  }

  public async update<T extends { id?: string | number; _docId?: string | number }>(
    collectionName: string,
    id: string | number,
    data: Partial<T>,
    empresaId = 'demo'
  ): Promise<void> {
    return firestoreDb.update(collectionName, String(id), data, empresaId);
  }

  public async delete(collectionName: string, id: string | number, empresaId = 'demo'): Promise<void> {
    return firestoreDb.delete(collectionName, String(id), empresaId);
  }

  public async batchUpsert<T extends { id?: string | number; _docId?: string | number }>(
    collectionName: string,
    items: T[],
    empresaId = 'demo'
  ): Promise<void> {
    return firestoreDb.batchUpsert(collectionName, items, empresaId);
  }

  /**
   * Alias de conveniência para subscribe padrão
   */
  public subscribe<T extends { id?: string | number; _docId?: string | number }>(
    collectionName: string,
    empresaId = 'demo',
    callback: (items: T[]) => void,
    onError?: (err: any) => void
  ): () => void {
    return this.subscribeRealtime<T>(collectionName, empresaId, callback, onError);
  }

  /**
   * Retorna métricas do banco de dados Firestore
   */
  public getMetrics(): DatabaseMetrics {
    return {
      readsAvoided: 0,
      actualReads: 0,
      cacheHits: 0,
      cacheMisses: 0,
      costSavedUSD: 0,
      costCurrentUSD: 0,
      economyPercent: 0
    };
  }
}

export const dbRouter = DatabaseRouter.getInstance();
