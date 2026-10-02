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
  // 1. DADOS: Consulta direta ao Firestore (Cache desativado a pedido)
  // =========================================================================
  public async getHistorico<T extends { id?: string | number; _docId?: string | number }>(
    collectionName: string,
    empresaId = 'demo',
    options?: QueryOptions<T>
  ): Promise<T[]> {
    try {
      const remote = await firestoreDb.getList<T>(collectionName, empresaId, options);
      if (remote && remote.length > 0) {
        return remote;
      }
    } catch (err) {
      console.warn(`[DatabaseRouter] Erro ao buscar no Firestore para ${collectionName}:`, err);
    }
    const jsonRecords = await jsonDb.getTable<T>(collectionName, empresaId, options);
    return this.applyInMemoryFilters(jsonRecords, options);
  }

  // =========================================================================
  // 2. DADOS GERAIS: Consulta direta ao Firestore
  // =========================================================================
  public async getNaoCritico<T extends { id?: string | number; _docId?: string | number }>(
    collectionName: string,
    empresaId = 'demo',
    options?: QueryOptions<T>
  ): Promise<T[]> {
    try {
      const serverItems = await firestoreDb.getList<T>(collectionName, empresaId, options);
      if (serverItems && serverItems.length > 0) {
        return serverItems;
      }
    } catch (err) {
      console.warn(`[DatabaseRouter] Firestore inacessível para ${collectionName}:`, err);
    }
    const local = await jsonDb.getTable<T>(collectionName, empresaId, options);
    return this.applyInMemoryFilters(local, options);
  }

  // =========================================================================
  // 3. REGRA DE PRIORIDADE: DADOS REALTIME (Firestore via Listener)
  // =========================================================================
  public subscribeRealtime<T extends { id?: string | number; _docId?: string | number }>(
    collectionName: string,
    empresaId = 'demo',
    callback: (items: T[]) => void,
    onError?: (err: any) => void,
    forceRealtime = false
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
   * Subscription para documento único em tempo real
   */
  public subscribeDoc<T extends { id?: string | number; _docId?: string | number }>(
    collectionName: string,
    docId: string | number,
    callback: (data: T | null) => void,
    onError?: (err: any) => void
  ): () => void {
    const strDocId = String(docId);

    // 1. Carrega do Cache/JSON imediatamente
    this.getById<T>(collectionName, strDocId).then(local => {
      if (local) callback(local);
    }).catch(() => {});

    // 2. Listener Firestore
    return firestoreDb.subscribeDoc<T>(
      collectionName,
      strDocId,
      (data) => {
        if (data) {
          this.updateCacheWithRecord(collectionName, data, 'demo');
          jsonDb.upsertRecord(collectionName, data, 'demo');
        }
        callback(data);
      },
      onError
    );
  }

  // =========================================================================
  // 4. REGRA DE PRIORIDADE: DADO INEXISTENTE / BUSCA GERAL
  // Cache -> JSON -> Firestore -> Atualizar Cache -> Disponibilizar para aplicação
  // =========================================================================
  public async getList<T extends { id?: string | number; _docId?: string | number }>(
    collectionName: string,
    empresaId = 'demo',
    options?: QueryOptions<T>
  ): Promise<T[]> {
    const queryKey = `getList:${empresaId}:${collectionName}:${JSON.stringify(options || {})}`;
    return this.deduplicateQuery<T[]>(queryKey, async () => {
      const classification: DataClassification = 
        options?.classification || 
        (options?.isHistorico ? 'historico' : options?.isNonCritical ? 'nao-critico' : 'padrao');

      // Desvio para regra de histórico estrito
      if (classification === 'historico') {
        return this.getHistorico<T>(collectionName, empresaId, options);
      }

      // Desvio para regra de não-crítico
      if (classification === 'nao-critico') {
        return this.getNaoCritico<T>(collectionName, empresaId, options);
      }

      // Fluxo Padrão / Dado Inexistente:
      // Passo 1: Cache
      if (!options?.forceServer) {
        const cached = await cacheDb.get<T>(collectionName, empresaId, options?.ttlMs);
        if (cached && cached.length > 0) {
          cacheDb.recordAvoided(cached.length);
          return this.applyInMemoryFilters(cached, options);
        }
      }

      // Passo 2: JSON Local
      if (!options?.forceServer) {
        const localData = await jsonDb.getTable<T>(collectionName, empresaId, options);
        if (localData && localData.length > 0) {
          cacheDb.recordAvoided(localData.length);
          cacheDb.set(collectionName, localData, empresaId, options?.ttlMs);
          return this.applyInMemoryFilters(localData, options);
        }
      }

      // Se especificado somente cache/offline, encerra aqui
      if (options?.useCacheOnly) {
        return [];
      }

      // Passo 3: Firestore
      try {
        const firestoreItems = await firestoreDb.getList<T>(collectionName, empresaId, options);
        if (firestoreItems && firestoreItems.length > 0) {
          cacheDb.recordActualReads(firestoreItems.length);
          // Passo 4: Atualizar Cache e JSON
          cacheDb.set(collectionName, firestoreItems, empresaId, options?.ttlMs, 'firestore');
          await jsonDb.saveTable(collectionName, firestoreItems, empresaId);
          // Passo 5: Disponibilizar para aplicação
          return firestoreItems;
        }
      } catch (err) {
        console.warn(`[DatabaseRouter] Firestore inacessível para ${collectionName}, tentando dados locais:`, err);
      }

      // Fallback final JSON
      const fallbackData = await jsonDb.getTable<T>(collectionName, empresaId, options);
      if (fallbackData && fallbackData.length > 0) {
        cacheDb.set(collectionName, fallbackData, empresaId, undefined, 'json');
        return fallbackData;
      }

      return [];
    });
  }

  /**
   * Busca dados paginados eficientemente usando cursores (limit, orderBy, startAfter).
   * Evita baixar coleções inteiras para depois paginar/filtrar no React.
   */
  public async getPaginated<T extends { id?: string | number; _docId?: string | number }>(
    collectionName: string,
    empresaId = 'demo',
    options?: QueryOptions<T>
  ): Promise<PaginatedResult<T>> {
    const pageSize = options?.pageSize || options?.limitCount || 25;

    // 1. Se for histórico ou useCacheOnly, busca do JSON com paginação em memória do snapshot local
    if (options?.isHistorico || options?.classification === 'historico' || options?.useCacheOnly) {
      const localData = await jsonDb.getTable<T>(collectionName, empresaId, options);
      const filtered = this.applyInMemoryFilters(localData || [], options);
      
      let startIndex = 0;
      if (options?.startAfterValue !== undefined && options?.orderByField) {
        const orderField = options.orderByField;
        startIndex = filtered.findIndex(item => (item as any)[orderField] === options.startAfterValue) + 1;
        if (startIndex < 0) startIndex = 0;
      }
      
      const paged = filtered.slice(startIndex, startIndex + pageSize);
      const hasMore = (startIndex + pageSize) < filtered.length;
      const lastItem = paged.length > 0 ? paged[paged.length - 1] : undefined;
      const lastValue = lastItem && options?.orderByField ? (lastItem as any)[options.orderByField] : lastItem?.id;

      return {
        items: paged,
        lastVisibleValue: lastValue,
        hasMore,
        pageSize,
        totalCount: filtered.length,
        source: 'json'
      };
    }

    // 2. Consulta Firestore usando paginação nativa por cursores (startAfter + limit + orderBy)
    try {
      const result = await firestoreDb.getPaginated<T>(collectionName, empresaId, options);
      if (result.items.length > 0) {
        cacheDb.recordActualReads(result.items.length);
      }
      return result;
    } catch (err) {
      console.warn(`[DatabaseRouter] Erro na paginação do Firestore para ${collectionName}, fallback para JSON:`, err);
      // Fallback para JSON local
      const localData = await jsonDb.getTable<T>(collectionName, empresaId, options);
      const filtered = this.applyInMemoryFilters(localData || [], options);
      const paged = filtered.slice(0, pageSize);
      return {
        items: paged,
        hasMore: filtered.length > pageSize,
        pageSize,
        totalCount: filtered.length,
        source: 'json'
      };
    }
  }

  /**
   * Busca item por ID seguindo a regra Cache -> JSON -> Firestore -> Atualizar Cache -> Retornar
   */
  public async getById<T extends { id?: string | number; _docId?: string | number }>(
    collectionName: string,
    id: string | number,
    empresaId = 'demo',
    options?: { ttlMs?: number; forceServer?: boolean }
  ): Promise<T | null> {
    const strId = String(id);

    // 1. Cache
    if (!options?.forceServer) {
      const cached = await cacheDb.get<T>(collectionName, empresaId);
      if (cached) {
        const found = cached.find(item => String(item.id || item._docId) === strId);
        if (found) {
          cacheDb.recordAvoided(1);
          return found;
        }
      }
    }

    // 2. JSON Local
    if (!options?.forceServer) {
      const local = await jsonDb.getById<T>(collectionName, strId, empresaId);
      if (local) {
        cacheDb.recordAvoided(1);
        await this.updateCacheWithRecord(collectionName, local, empresaId);
        return local;
      }
    }

    // 3. Firestore
    try {
      const serverItem = await firestoreDb.getById<T>(collectionName, strId, empresaId);
      if (serverItem) {
        cacheDb.recordActualReads(1);
        // 4. Atualizar Cache e JSON
        await this.updateCacheWithRecord(collectionName, serverItem, empresaId);
        await jsonDb.upsertRecord(collectionName, serverItem, empresaId);
        // 5. Disponibilizar para a aplicação
        return serverItem;
      }
    } catch (err) {
      console.warn(`[DatabaseRouter] Erro ao buscar ID ${strId} no Firestore para ${collectionName}:`, err);
    }

    return null;
  }

  // =========================================================================
  // OPERAÇÕES DE MUTAÇÃO (CREATE, UPDATE, DELETE, BATCH)
  // Salva no Firestore e espelha imediatamente no Cache e JSON local
  // =========================================================================

  public async create<T extends { id?: string | number; _docId?: string | number }>(
    collectionName: string,
    data: any,
    empresaId = 'demo',
    customDocId?: string
  ): Promise<T> {
    let createdItem: T;
    try {
      createdItem = await firestoreDb.create<T>(collectionName, data, empresaId, customDocId);
    } catch (err) {
      console.warn(`[DatabaseRouter] Firestore offline, persistindo localmente em JSON:`, err);
      const generatedId = customDocId || `local_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      createdItem = {
        id: generatedId,
        _docId: generatedId,
        ...data,
        empresaId,
        _localOnly: true,
        _criadoEm: new Date().toISOString()
      } as unknown as T;
    }

    await jsonDb.upsertRecord(collectionName, createdItem, empresaId);
    await this.updateCacheWithRecord(collectionName, createdItem, empresaId);

    return createdItem;
  }

  public async update<T extends { id?: string | number; _docId?: string | number }>(
    collectionName: string,
    id: string | number,
    data: Partial<T>,
    empresaId = 'demo'
  ): Promise<void> {
    const existing = (await this.getById<T>(collectionName, id, empresaId)) || ({} as T);
    const updated = { ...existing, ...data, id, _docId: id } as T;

    await jsonDb.upsertRecord(collectionName, updated, empresaId);
    await this.updateCacheWithRecord(collectionName, updated, empresaId);

    try {
      await firestoreDb.update(collectionName, String(id), data, empresaId);
    } catch (err) {
      console.warn(`[DatabaseRouter] Firestore update offline para ${collectionName}:`, err);
    }
  }

  public async delete(collectionName: string, id: string | number, empresaId = 'demo'): Promise<void> {
    await jsonDb.deleteRecord(collectionName, id, empresaId);
    
    // Atualiza Cache
    const cached = await cacheDb.get<any>(collectionName, empresaId);
    if (cached) {
      const filtered = cached.filter((i: any) => String(i.id || i._docId) !== String(id));
      cacheDb.set(collectionName, filtered, empresaId);
    }

    try {
      await firestoreDb.delete(collectionName, String(id), empresaId);
    } catch (err) {
      console.warn(`[DatabaseRouter] Firestore delete pendente para ${collectionName}:`, err);
    }
  }

  public async batchUpsert<T extends { id?: string | number; _docId?: string | number }>(
    collectionName: string,
    items: T[],
    empresaId = 'demo'
  ): Promise<void> {
    await jsonDb.saveTable(collectionName, items, empresaId);
    cacheDb.set(collectionName, items, empresaId);

    try {
      await firestoreDb.batchUpsert(collectionName, items, empresaId);
    } catch (err) {
      console.warn(`[DatabaseRouter] Firestore batch upsert pendente para ${collectionName}:`, err);
    }
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
   * Retorna métricas de leituras economizadas e eficiência de cache
   */
  public getMetrics(): DatabaseMetrics {
    return cacheDb.getMetrics();
  }

  private async updateCacheWithRecord<T extends { id?: string | number; _docId?: string | number }>(
    collectionName: string,
    record: T,
    empresaId: string
  ): Promise<void> {
    const cached = (await cacheDb.get<T>(collectionName, empresaId)) || [];
    const idx = cached.findIndex(i => String(i.id || i._docId) === String(record.id || record._docId));
    if (idx >= 0) {
      cached[idx] = record;
    } else {
      cached.unshift(record);
    }
    cacheDb.set(collectionName, cached, empresaId);
  }

  private applyInMemoryFilters<T>(items: T[], options?: QueryOptions<T>): T[] {
    let result = [...items];

    if (options?.filters && options.filters.length > 0) {
      for (const filter of options.filters) {
        result = result.filter(item => {
          const val = (item as any)[filter.field];
          switch (filter.operator) {
            case '==': return val === filter.value;
            case '!=': return val !== filter.value;
            case '<': return val < filter.value;
            case '<=': return val <= filter.value;
            case '>': return val > filter.value;
            case '>=': return val >= filter.value;
            case 'array-contains': return Array.isArray(val) && val.includes(filter.value);
            case 'in': return Array.isArray(filter.value) && filter.value.includes(val);
            default: return true;
          }
        });
      }
    }

    if (options?.orderByField) {
      const field = options.orderByField;
      const dir = options.orderDirection === 'desc' ? -1 : 1;
      result.sort((a, b) => {
        const valA = (a as any)[field];
        const valB = (b as any)[field];
        if (valA < valB) return -1 * dir;
        if (valA > valB) return 1 * dir;
        return 0;
      });
    }

    if (options?.limitCount && options.limitCount > 0) {
      result = result.slice(0, options.limitCount);
    }

    return result;
  }
}

export const dbRouter = DatabaseRouter.getInstance();
