/**
 * DATABASE ROUTER - Núcleo de Roteamento Híbrido
 * 
 * Fluxo Arquitetural:
 * Component -> Repository -> Database Router -> (Cache L1/L2 -> JSON Database -> Firestore)
 * 
 * Regra: Componentes React NUNCA acessam o Firestore diretamente.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  getDocsFromCache,
  getDocsFromServer,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  limit as firestoreLimit,
  orderBy as firestoreOrderBy,
  startAfter as firestoreStartAfter,
  getCountFromServer,
  getAggregateFromServer,
  count,
  sum,
  average,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  QueryConstraint
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  getHybridCacheCollection,
  setHybridCacheCollection,
  recordActualFirestoreReads,
  invalidateHybridCache
} from '../utils/hybridCacheService';
import {
  getJsonTable,
  saveJsonTable,
  upsertJsonRecord,
  deleteJsonRecord,
  queryJsonTable
} from '../utils/hybridJsonDatabase';
import { isRealtimePermitido } from '../utils/realtimeClassification';
import { monitoringService } from './monitoringService';
import { sanitizeData } from '../security/JsonSecuritySanitizer';

export interface QueryFilter<T = any> {
  field: keyof T | string;
  operator: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'array-contains' | 'in';
  value: any;
}

export interface QueryOptions<T = any> {
  filters?: QueryFilter<T>[];
  orderByField?: keyof T | string;
  orderDirection?: 'asc' | 'desc';
  limitCount?: number;
  useCacheOnly?: boolean;
  forceServer?: boolean;
  ttlMs?: number;
  // Paginação via Cursores (Cursor-based Pagination) - Item 15 das Diretrizes
  startAfterDoc?: any;
  startAfterValue?: any;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  lastVisibleDoc?: any;
  lastVisibleValue?: any;
  hasMore: boolean;
  pageSize: number;
  source?: 'json' | 'cache' | 'firestore';
  totalCount?: number;
}

export class DatabaseRouter {
  private static instance: DatabaseRouter;

  // Deduplicação de queries idênticas em voo simultâneo (Item 16)
  private inFlightRequests: Map<string, Promise<any>> = new Map();

  // Pool de listeners em tempo real para evitar recriações desnecessárias (Item 16)
  private activeCollectionListeners: Map<
    string,
    {
      unsubscribe: () => void;
      callbacks: Set<(data: any) => void>;
      errorCallbacks: Set<(err: any) => void>;
      lastData?: any;
    }
  > = new Map();

  private activeDocListeners: Map<
    string,
    {
      unsubscribe: () => void;
      callbacks: Set<(data: any) => void>;
      errorCallbacks: Set<(err: any) => void>;
      lastData?: any;
    }
  > = new Map();

  // Métricas de performance em tempo de execução
  private deduplicatedCount = 0;

  private constructor() {}

  public static getInstance(): DatabaseRouter {
    if (!DatabaseRouter.instance) {
      DatabaseRouter.instance = new DatabaseRouter();
    }
    return DatabaseRouter.instance;
  }

  /**
   * Deduplica queries idênticas em trânsito simultâneo para evitar chamadas redundantes.
   */
  private async deduplicateQuery<R>(key: string, queryFn: () => Promise<R>): Promise<R> {
    if (this.inFlightRequests.has(key)) {
      this.deduplicatedCount++;
      monitoringService.recordDeduplicatedQuery();
      return this.inFlightRequests.get(key) as Promise<R>;
    }

    const promise = queryFn().finally(() => {
      this.inFlightRequests.delete(key);
    });

    this.inFlightRequests.set(key, promise);
    return promise;
  }

  /**
   * Obtém métricas de performance do DatabaseRouter
   */
  public getPerformanceStats() {
    return {
      deduplicatedQueries: this.deduplicatedCount,
      activeCollectionListeners: this.activeCollectionListeners.size,
      activeDocListeners: this.activeDocListeners.size,
      inFlightRequests: this.inFlightRequests.size
    };
  }

  /**
   * Obtém todos os documentos de uma coleção com estratégia híbrida
   */
  public async getList<T extends { id?: string | number; _docId?: string | number }>(
    collectionName: string,
    empresaId = 'demo',
    options: QueryOptions<T> = {}
  ): Promise<T[]> {
    const queryKey = `getList:${empresaId}:${collectionName}:${JSON.stringify(options)}`;

    return this.deduplicateQuery<T[]>(queryKey, async () => {
      const cacheKey = `col:${empresaId}:${collectionName}`;
      const ttl = options.ttlMs || 1000 * 60 * 30; // 30 minutos

      // Consulta Direta ao Firestore (Cache desativado a pedido do usuário)
      try {
        const colRef = collection(db, collectionName);
        const constraints: QueryConstraint[] = [];
        
        if (empresaId && empresaId !== 'all') {
          constraints.push(where('empresaId', '==', empresaId));
        }

        if (options.filters) {
          for (const f of options.filters) {
            constraints.push(where(f.field as string, f.operator, f.value));
          }
        }

        if (options.orderByField) {
          constraints.push(firestoreOrderBy(options.orderByField as string, options.orderDirection || 'asc'));
        }

        if (options.limitCount) {
          constraints.push(firestoreLimit(options.limitCount));
        }

        const q = query(colRef, ...constraints);
        let snap;

        try {
          const fetchPromise = Promise.race([
            getDocsFromServer(q),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout_server')), 1500))
          ]);
          snap = await fetchPromise;
          recordActualFirestoreReads(snap.docs.length);
          monitoringService.recordFirestoreRead(snap.docs.length, collectionName, 'getDocs');
        } catch (_) {
          try {
            const cachePromise = Promise.race([
              getDocs(q),
              new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout_cache')), 1000))
            ]);
            snap = await cachePromise;
            recordActualFirestoreReads(snap.docs.length);
            monitoringService.recordFirestoreRead(snap.docs.length, collectionName, 'getDocs');
          } catch {
            const fb = await getJsonTable<T>(empresaId, collectionName);
            monitoringService.recordJsonHit(fb.length, collectionName);
            return fb;
          }
        }

        const serverDocs: T[] = snap.docs.map(d => ({
          _docId: d.id,
          id: d.id,
          ...d.data()
        } as unknown as T));

        return serverDocs;
      } catch (error) {
        console.warn(`[DatabaseRouter] Erro na consulta do Firestore para '${collectionName}':`, error);
        // Fallback de contingência somente em caso de falha de rede
        const fb = await getJsonTable<T>(empresaId, collectionName);
        monitoringService.recordJsonHit(fb.length, collectionName);
        return fb;
      }
    });
  }

  /**
   * Obtém lista paginada utilizando cursores nativos (limit, orderBy, startAfter).
   * ESTRITAMENTE SEM offset() e SEM baixar coleções inteiras para o cliente.
   * Conforme Item 15 e Item 16 das Diretrizes de Arquitetura.
   */
  public async getPaginated<T extends { id?: string | number; _docId?: string | number }>(
    collectionName: string,
    empresaId = 'demo',
    options: QueryOptions<T> = {}
  ): Promise<PaginatedResult<T>> {
    const queryKey = `getPaginated:${empresaId}:${collectionName}:${JSON.stringify(options)}`;

    return this.deduplicateQuery<PaginatedResult<T>>(queryKey, async () => {
      const pageSize = options.pageSize || options.limitCount || 25;
      const orderField = (options.orderByField as string) || 'atualizadoEm';
      const orderDir = options.orderDirection || 'desc';

      // 1. Se explicitamente useCacheOnly, busca no JSON local aplicando filtro e cursor localmente
      if (options.useCacheOnly) {
        const jsonRecords = await getJsonTable<T>(empresaId, collectionName);
        let filtered = jsonRecords;
        if (options.filters && options.filters.length > 0) {
          filtered = this.applyLocalFilters(filtered, options.filters);
        }

        // Ordenação
        filtered.sort((a, b) => {
          const valA = (a as any)[orderField];
          const valB = (b as any)[orderField];
          if (valA === valB) return 0;
          if (valA === undefined || valA === null) return 1;
          if (valB === undefined || valB === null) return -1;
          const comp = valA > valB ? 1 : -1;
          return orderDir === 'asc' ? comp : -comp;
        });

        let startIndex = 0;
        if (options.startAfterValue !== undefined && options.startAfterValue !== null) {
          startIndex = filtered.findIndex(item => (item as any)[orderField] === options.startAfterValue) + 1;
          if (startIndex <= 0) {
            if (options.startAfterDoc && options.startAfterDoc.id) {
              startIndex = filtered.findIndex(item => item.id === options.startAfterDoc.id || item._docId === options.startAfterDoc.id) + 1;
            }
            if (startIndex < 0) startIndex = 0;
          }
        }

        const paged = filtered.slice(startIndex, startIndex + pageSize);
        const hasMore = startIndex + pageSize < filtered.length;
        const lastItem = paged.length > 0 ? paged[paged.length - 1] : undefined;
        const lastValue = lastItem ? (lastItem as any)[orderField] || lastItem.id : undefined;

        monitoringService.recordJsonHit(paged.length, collectionName);

        return {
          items: paged,
          lastVisibleDoc: lastItem,
          lastVisibleValue: lastValue,
          hasMore,
          pageSize,
          totalCount: filtered.length,
          source: 'json'
        };
      }

      // 2. Consulta Firestore utilizando cursores nativos: limit(), orderBy(), startAfter()
      // Proibido uso de offset()
      try {
        const colRef = collection(db, collectionName);
        const constraints: QueryConstraint[] = [];

        if (empresaId && empresaId !== 'all') {
          constraints.push(where('empresaId', '==', empresaId));
        }

        if (options.filters && options.filters.length > 0) {
          for (const f of options.filters) {
            constraints.push(where(f.field as string, f.operator, f.value));
          }
        }

        constraints.push(firestoreOrderBy(orderField, orderDir));

        // Aplica startAfter() via DocumentSnapshot ou valor do campo ordenado
        if (options.startAfterDoc) {
          constraints.push(firestoreStartAfter(options.startAfterDoc));
        } else if (options.startAfterValue !== undefined && options.startAfterValue !== null) {
          constraints.push(firestoreStartAfter(options.startAfterValue));
        }

        // Busca pageSize + 1 para determinar hasMore sem necessidade de count() adicional
        constraints.push(firestoreLimit(pageSize + 1));

        const q = query(colRef, ...constraints);
        let snap;

        try {
          snap = await getDocsFromServer(q);
          recordActualFirestoreReads(snap.docs.length);
          monitoringService.recordFirestoreRead(snap.docs.length, collectionName, 'getPaginated');
        } catch (_) {
          snap = await getDocs(q);
          recordActualFirestoreReads(snap.docs.length);
          monitoringService.recordFirestoreRead(snap.docs.length, collectionName, 'getPaginated');
        }

        const docs = snap.docs;
        const hasMore = docs.length > pageSize;
        const slicedDocs = hasMore ? docs.slice(0, pageSize) : docs;

        const items: T[] = slicedDocs.map(d => ({
          _docId: d.id,
          id: d.id,
          ...d.data()
        } as unknown as T));

        const lastDoc = slicedDocs.length > 0 ? slicedDocs[slicedDocs.length - 1] : undefined;
        const lastValue = lastDoc ? (lastDoc.data() as any)[orderField] || lastDoc.id : undefined;

        return {
          items,
          lastVisibleDoc: lastDoc,
          lastVisibleValue: lastValue,
          hasMore,
          pageSize,
          source: 'firestore'
        };
      } catch (err) {
        console.warn(`[DatabaseRouter] Erro ao paginar Firestore em '${collectionName}':`, err);
        // Fallback gracioso para dados locais
        const jsonRecords = await getJsonTable<T>(empresaId, collectionName);
        let filtered = jsonRecords;
        if (options.filters && options.filters.length > 0) {
          filtered = this.applyLocalFilters(filtered, options.filters);
        }
        const paged = filtered.slice(0, pageSize);
        monitoringService.recordJsonHit(paged.length, collectionName);
        return {
          items: paged,
          hasMore: filtered.length > pageSize,
          pageSize,
          totalCount: filtered.length,
          source: 'json'
        };
      }
    });
  }

  /**
   * Realiza contagem direta sem carregar a coleção para a memória (Item 16 - Agregações)
   */
  public async getCount<T extends { id?: string | number; _docId?: string | number }>(
    collectionName: string,
    empresaId = 'demo',
    options?: QueryOptions<T>
  ): Promise<number> {
    const queryKey = `getCount:${empresaId}:${collectionName}:${JSON.stringify(options)}`;

    return this.deduplicateQuery<number>(queryKey, async () => {
      // 1. Se explicitamente useCacheOnly ou histórico em JSON, conta localmente sem rede
      if (options?.useCacheOnly) {
        const local = await getJsonTable<T>(empresaId, collectionName);
        const filtered = options?.filters ? this.applyLocalFilters(local, options.filters) : local;
        return filtered.length;
      }

      try {
        const colRef = collection(db, collectionName);
        const constraints: QueryConstraint[] = [];

        if (empresaId && empresaId !== 'all') {
          constraints.push(where('empresaId', '==', empresaId));
        }

        if (options?.filters) {
          for (const f of options.filters) {
            constraints.push(where(f.field as string, f.operator, f.value));
          }
        }

        const q = query(colRef, ...constraints);
        const snapshot = await getCountFromServer(q);
        return snapshot.data().count;
      } catch (e) {
        // Fallback local se offline ou erro
        const local = await getJsonTable<T>(empresaId, collectionName);
        const filtered = options?.filters ? this.applyLocalFilters(local, options.filters) : local;
        return filtered.length;
      }
    });
  }

  /**
   * Realiza soma e média diretas no servidor Firestore ou localmente (Item 16 - Agregações)
   */
  public async getAggregate<T extends { id?: string | number; _docId?: string | number }>(
    collectionName: string,
    empresaId = 'demo',
    spec: { sumFields?: (keyof T | string)[]; avgFields?: (keyof T | string)[]; count?: boolean },
    options?: QueryOptions<T>
  ): Promise<{ count?: number; sums?: Record<string, number>; avgs?: Record<string, number> }> {
    const queryKey = `getAggregate:${empresaId}:${collectionName}:${JSON.stringify(spec)}:${JSON.stringify(options)}`;

    return this.deduplicateQuery<{ count?: number; sums?: Record<string, number>; avgs?: Record<string, number> }>(queryKey, async () => {
      if (options?.useCacheOnly) {
        const local = await getJsonTable<T>(empresaId, collectionName);
        const filtered = options?.filters ? this.applyLocalFilters(local, options.filters) : local;
        const result: { count?: number; sums?: Record<string, number>; avgs?: Record<string, number> } = {
          count: filtered.length,
          sums: {},
          avgs: {}
        };
        spec.sumFields?.forEach(f => {
          const s = filtered.reduce((acc, curr) => acc + (Number((curr as any)[f]) || 0), 0);
          result.sums![String(f)] = s;
        });
        spec.avgFields?.forEach(f => {
          const s = filtered.reduce((acc, curr) => acc + (Number((curr as any)[f]) || 0), 0);
          result.avgs![String(f)] = filtered.length ? s / filtered.length : 0;
        });
        return result;
      }

      try {
        const colRef = collection(db, collectionName);
        const constraints: QueryConstraint[] = [];

        if (empresaId && empresaId !== 'all') {
          constraints.push(where('empresaId', '==', empresaId));
        }

        if (options?.filters) {
          for (const f of options.filters) {
            constraints.push(where(f.field as string, f.operator, f.value));
          }
        }

        const q = query(colRef, ...constraints);
        const aggregateSpec: Record<string, any> = {};

        if (spec.count !== false) {
          aggregateSpec.totalCount = count();
        }
        spec.sumFields?.forEach(f => {
          aggregateSpec[`sum_${String(f)}`] = sum(String(f));
        });
        spec.avgFields?.forEach(f => {
          aggregateSpec[`avg_${String(f)}`] = average(String(f));
        });

        const snap = await getAggregateFromServer(q, aggregateSpec);
        const data = snap.data() as Record<string, any>;

        const sums: Record<string, number> = {};
        spec.sumFields?.forEach(f => {
          sums[String(f)] = Number(data[`sum_${String(f)}`]) || 0;
        });

        const avgs: Record<string, number> = {};
        spec.avgFields?.forEach(f => {
          avgs[String(f)] = Number(data[`avg_${String(f)}`]) || 0;
        });

        return {
          count: data.totalCount !== undefined ? Number(data.totalCount) : undefined,
          sums,
          avgs
        };
      } catch (err) {
        // Fallback local
        const local = await getJsonTable<T>(empresaId, collectionName);
        const filtered = options?.filters ? this.applyLocalFilters(local, options.filters) : local;
        const result: { count?: number; sums?: Record<string, number>; avgs?: Record<string, number> } = {
          count: filtered.length,
          sums: {},
          avgs: {}
        };
        spec.sumFields?.forEach(f => {
          const s = filtered.reduce((acc, curr) => acc + (Number((curr as any)[f]) || 0), 0);
          result.sums![String(f)] = s;
        });
        spec.avgFields?.forEach(f => {
          const s = filtered.reduce((acc, curr) => acc + (Number((curr as any)[f]) || 0), 0);
          result.avgs![String(f)] = filtered.length ? s / filtered.length : 0;
        });
        return result;
      }
    });
  }

  /**
   * Obtém documento único por ID
   */
  public async getById<T extends { id?: string | number; _docId?: string | number }>(
    collectionName: string,
    docId: string | number,
    empresaId = 'demo'
  ): Promise<T | null> {
    if (!docId) return null;
    const strDocId = String(docId);

    // Consulta Direta ao Firestore (Cache desativado)
    try {
      const docRef = doc(db, collectionName, strDocId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        recordActualFirestoreReads(1);
        monitoringService.recordFirestoreRead(1, collectionName, 'getDoc');
        const data = { _docId: snap.id, id: snap.id, ...snap.data() } as unknown as T;
        return data;
      }
      return null;
    } catch (e) {
      console.warn(`[DatabaseRouter] Erro ao buscar documento ${strDocId} em ${collectionName}:`, e);
      // Fallback para JSON local em caso de erro
      const jsonRecords = await getJsonTable<T>(empresaId, collectionName);
      const foundInJson = jsonRecords.find(item => String(item.id || item._docId) === strDocId);
      if (foundInJson) {
        monitoringService.recordJsonHit(1, collectionName);
        return foundInJson;
      }
      return null;
    }
  }

  /**
   * Cria novo documento: Salva no Firestore e espelha no JSON/Cache local
   */
  public async create<T extends { id?: string | number; _docId?: string | number }>(
    collectionName: string,
    data: Omit<T, 'id' | '_docId'>,
    empresaId = 'demo',
    customDocId?: string
  ): Promise<T> {
    const sanitizedData = sanitizeData(data);
    const payload = {
      ...sanitizedData,
      empresaId: (sanitizedData as any).empresaId || empresaId,
      atualizadoEm: serverTimestamp(),
      criadoEm: (sanitizedData as any).criadoEm || new Date().toISOString()
    };

    let docId = customDocId;
    if (!docId) {
      try {
        docId = doc(collection(db, collectionName)).id;
      } catch (e) {
        docId = 'doc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      }
    }

    const createdRecord = {
      ...payload,
      id: docId,
      _docId: docId,
      atualizadoEm: new Date().toISOString()
    } as unknown as T;

    // Atualiza imediatamente a camada de JSON local e invalida/atualiza o cache (resposta instantânea)
    await upsertJsonRecord(empresaId, collectionName, createdRecord);
    await invalidateHybridCache(`col:${empresaId}:${collectionName}`);

    // Persiste no Firestore com proteção de timeout (1.5s) para nunca travar a UI do usuário
    try {
      const docRef = doc(db, collectionName, docId);
      const firestorePromise = setDoc(docRef, payload, { merge: true });
      await Promise.race([
        firestorePromise,
        new Promise(resolve => setTimeout(resolve, 1500))
      ]);
    } catch (e) {
      console.warn(`[DatabaseRouter] Persistência em background em ${collectionName}:`, e);
    }

    return createdRecord;
  }

  /**
   * Atualiza documento existente
   */
  public async update<T extends { id?: string | number; _docId?: string | number }>(
    collectionName: string,
    docId: string | number,
    partialData: Partial<T>,
    empresaId = 'demo'
  ): Promise<void> {
    if (!docId) return;
    const strDocId = String(docId);

    const sanitizedData = sanitizeData(partialData);
    const payload = {
      ...sanitizedData,
      empresaId: (sanitizedData as any).empresaId || empresaId || 'demo',
      atualizadoEm: serverTimestamp()
    };

    // Atualiza imediatamente o JSON Database e invalida cache (resposta instantânea)
    await upsertJsonRecord(empresaId, collectionName, {
      ...sanitizedData,
      id: docId,
      _docId: docId,
      atualizadoEm: new Date().toISOString()
    } as any);

    await invalidateHybridCache(`col:${empresaId}:${collectionName}`);

    // Persiste no Firestore com proteção de timeout (1.5s)
    try {
      const docRef = doc(db, collectionName, strDocId);
      const firestorePromise = updateDoc(docRef, payload).catch(async () => {
        await setDoc(docRef, payload, { merge: true });
      });
      await Promise.race([
        firestorePromise,
        new Promise(resolve => setTimeout(resolve, 1500))
      ]);
    } catch (e) {
      console.warn(`[DatabaseRouter] Atualização remota do doc ${strDocId} no Firestore:`, e);
    }
  }

  /**
   * Remove documento
   */
  public async delete(
    collectionName: string,
    docId: string | number,
    empresaId = 'demo'
  ): Promise<void> {
    if (!docId) return;
    const strDocId = String(docId);

    // Remove imediatamente do JSON local e invalida cache
    await deleteJsonRecord(empresaId, collectionName, strDocId);
    await invalidateHybridCache(`col:${empresaId}:${collectionName}`);

    // Remove do Firestore com proteção de timeout (1.5s)
    try {
      const docRef = doc(db, collectionName, strDocId);
      await Promise.race([
        deleteDoc(docRef),
        new Promise(resolve => setTimeout(resolve, 1500))
      ]);
    } catch (e) {
      console.warn(`[DatabaseRouter] Erro ao deletar doc ${strDocId} no Firestore:`, e);
    }
  }

  /**
   * Operação em lote (Batch) com particionamento automático (chunks de 450 itens para respeitar o limite de 500 do Firestore)
   * Garante que qualquer importação (seja via Studio IA, GitHub ou produção) persista diretamente no Firestore.
   */
  public async batchUpsert<T extends { id?: string | number; _docId?: string | number }>(
    collectionName: string,
    items: T[],
    empresaId = 'demo'
  ): Promise<void> {
    if (!items || items.length === 0) return;

    const sanitizedItems = sanitizeData(items);

    // Particionamento em chunks de 450 para respeitar o limite de 500 do Firestore
    const CHUNK_SIZE = 450;
    for (let i = 0; i < sanitizedItems.length; i += CHUNK_SIZE) {
      const chunk = sanitizedItems.slice(i, i + CHUNK_SIZE);
      try {
        const batch = writeBatch(db);
        for (const item of chunk) {
          const id = item.id || item._docId;
          if (id) {
            const docRef = doc(db, collectionName, String(id));
            batch.set(docRef, {
              ...item,
              empresaId: (item as any).empresaId || empresaId,
              atualizadoEm: serverTimestamp()
            }, { merge: true });
          }
        }
        await batch.commit();
      } catch (e) {
        console.warn(`[DatabaseRouter] Erro no batch Firestore (chunk ${i / CHUNK_SIZE + 1}) para ${collectionName}:`, e);
      }
    }

    // Atualiza tabela JSON e invalida cache
    try {
      const current = await getJsonTable<T>(empresaId, collectionName);
      const map = new Map<string, T>();
      current.forEach(c => map.set(String(c.id || c._docId)!, c));
      sanitizedItems.forEach(i => map.set(String(i.id || i._docId)!, i));
      await saveJsonTable(empresaId, collectionName, Array.from(map.values()));
      await invalidateHybridCache(`col:${empresaId}:${collectionName}`);
    } catch (e) {
      console.warn(`[DatabaseRouter] Erro ao atualizar tabela local para ${collectionName}:`, e);
    }
  }

  /**
   * Inscrição em tempo real encapsulada com cache inicial
   */
  /**
   * Inscrição em tempo real com Listener Pooling e Cleanup Seguro (Item 16)
   * Garante que múltiplos componentes compartilhando o mesmo listener não recriem conexões Firestore.
   */
  public subscribe<T extends { id?: string | number; _docId?: string | number }>(
    collectionName: string,
    empresaId = 'demo',
    callback: (data: T[]) => void,
    onError?: (error: any) => void
  ): () => void {
    const cacheKey = `col:${empresaId}:${collectionName}`;

    // 1. Emissão imediata do Cache / JSON local
    getHybridCacheCollection<T>(cacheKey, true).then(cached => {
      if (cached && cached.data && cached.data.length > 0) {
        callback(cached.data);
      } else {
        getJsonTable<T>(empresaId, collectionName).then(jsonRecs => {
          if (jsonRecs.length > 0) callback(jsonRecs);
        });
      }
    });

    // 2. Inicia Listener no Firestore APENAS se realtime for necessário pela classificação
    if (!isRealtimePermitido(collectionName)) {
      // Para histórico, relatórios, cadastros estáticos e dados diários: NÃO conecta onSnapshot!
      return () => {};
    }

    // 3. Listener Pooling: se já houver um listener ativo para esta coleção + empresa, reutiliza!
    const listenerKey = `sub:${empresaId}:${collectionName}`;
    const existing = this.activeCollectionListeners.get(listenerKey);

    if (existing) {
      existing.callbacks.add(callback);
      if (onError) existing.errorCallbacks.add(onError);
      if (existing.lastData) {
        try {
          callback(existing.lastData);
        } catch (_) {}
      }

      return () => {
        existing.callbacks.delete(callback);
        if (onError) existing.errorCallbacks.delete(onError);
        if (existing.callbacks.size === 0) {
          existing.unsubscribe();
          this.activeCollectionListeners.delete(listenerKey);
        }
      };
    }

    const colRef = collection(db, collectionName);
    const targetEmpresaId = (!empresaId || empresaId === 'emp_dono') ? 'demo' : empresaId;
    const targetIds = (targetEmpresaId && targetEmpresaId !== 'all')
      ? (targetEmpresaId === 'demo' ? ['demo', 'emp_dono'] : [targetEmpresaId, 'demo'])
      : null;
    const q = targetIds
      ? query(colRef, where('empresaId', 'in', targetIds))
      : query(colRef);

    const callbacksSet = new Set<(data: any) => void>([callback]);
    const errorCallbacksSet = new Set<(err: any) => void>(onError ? [onError] : []);

    const firestoreUnsub = onSnapshot(
      q,
      (snapshot) => {
        const docs: T[] = snapshot.docs.map(d => ({
          _docId: d.id,
          id: d.id,
          ...d.data()
        } as unknown as T));

        if (snapshot.docChanges().length > 0) {
          recordActualFirestoreReads(snapshot.docChanges().length);
        }

        const currentEntry = this.activeCollectionListeners.get(listenerKey);
        if (currentEntry) {
          currentEntry.lastData = docs;
        }

        callbacksSet.forEach(cb => {
          try {
            cb(docs);
          } catch (err) {
            console.error('[DatabaseRouter] Erro no callback do listener:', err);
          }
        });

        setHybridCacheCollection(cacheKey, docs).catch(() => {});
        saveJsonTable(empresaId, collectionName, docs).catch(() => {});
      },
      (error) => {
        console.warn(`[DatabaseRouter] Erro de snapshot em ${collectionName}:`, error);
        errorCallbacksSet.forEach(ecb => {
          try {
            ecb(error);
          } catch (_) {}
        });
      }
    );

    this.activeCollectionListeners.set(listenerKey, {
      unsubscribe: firestoreUnsub,
      callbacks: callbacksSet,
      errorCallbacks: errorCallbacksSet
    });
    monitoringService.recordRealtimeListenerCount(this.activeCollectionListeners.size + this.activeDocListeners.size);

    return () => {
      callbacksSet.delete(callback);
      if (onError) errorCallbacksSet.delete(onError);
      if (callbacksSet.size === 0) {
        firestoreUnsub();
        this.activeCollectionListeners.delete(listenerKey);
        monitoringService.recordRealtimeListenerCount(this.activeCollectionListeners.size + this.activeDocListeners.size);
      }
    };
  }

  /**
   * Inscrição em tempo real para um documento individual com Listener Pooling (Item 16)
   */
  public subscribeDoc<T extends { id?: string | number; _docId?: string | number }>(
    collectionName: string,
    docId: string | number,
    callback: (data: T | null) => void,
    onError?: (error: any) => void
  ): () => void {
    const strDocId = String(docId);
    const listenerKey = `docSub:${collectionName}:${strDocId}`;
    
    // 1. Tentar ler do JSON local primeiro
    this.getById<T>(collectionName, strDocId).then(local => {
      if (local) callback(local);
    }).catch(() => {});

    // 2. Se já existe listener para este documento, reutiliza
    const existing = this.activeDocListeners.get(listenerKey);
    if (existing) {
      existing.callbacks.add(callback);
      if (onError) existing.errorCallbacks.add(onError);
      if (existing.lastData !== undefined) {
        try {
          callback(existing.lastData);
        } catch (_) {}
      }

      return () => {
        existing.callbacks.delete(callback);
        if (onError) existing.errorCallbacks.delete(onError);
        if (existing.callbacks.size === 0) {
          existing.unsubscribe();
          this.activeDocListeners.delete(listenerKey);
          monitoringService.recordRealtimeListenerCount(this.activeCollectionListeners.size + this.activeDocListeners.size);
        }
      };
    }

    // 3. Inicia Listener no Firestore
    const docRef = doc(db, collectionName, strDocId);
    const callbacksSet = new Set<(data: any) => void>([callback]);
    const errorCallbacksSet = new Set<(err: any) => void>(onError ? [onError] : []);

    const firestoreUnsub = onSnapshot(
      docRef,
      (snapshot) => {
        let data: T | null = null;
        if (snapshot.exists()) {
          recordActualFirestoreReads(1);
          monitoringService.recordFirestoreRead(1, collectionName, 'onSnapshot');
          data = { _docId: snapshot.id, id: snapshot.id, ...snapshot.data() } as unknown as T;
        }

        const currentEntry = this.activeDocListeners.get(listenerKey);
        if (currentEntry) {
          currentEntry.lastData = data;
        }

        callbacksSet.forEach(cb => {
          try {
            cb(data);
          } catch (err) {
            console.error('[DatabaseRouter] Erro no callback de doc listener:', err);
          }
        });
      },
      (error) => {
        console.warn(`[DatabaseRouter] Erro de snapshot de documento em ${collectionName}/${strDocId}:`, error);
        errorCallbacksSet.forEach(ecb => {
          try {
            ecb(error);
          } catch (_) {}
        });
      }
    );

    this.activeDocListeners.set(listenerKey, {
      unsubscribe: firestoreUnsub,
      callbacks: callbacksSet,
      errorCallbacks: errorCallbacksSet
    });
    monitoringService.recordRealtimeListenerCount(this.activeCollectionListeners.size + this.activeDocListeners.size);

    return () => {
      callbacksSet.delete(callback);
      if (onError) errorCallbacksSet.delete(onError);
      if (callbacksSet.size === 0) {
        firestoreUnsub();
        this.activeDocListeners.delete(listenerKey);
        monitoringService.recordRealtimeListenerCount(this.activeCollectionListeners.size + this.activeDocListeners.size);
      }
    };
  }

  private applyLocalFilters<T>(records: T[], filters: QueryFilter<T>[]): T[] {
    return records.filter(item => {
      return filters.every(f => {
        const val = (item as any)[f.field];
        switch (f.operator) {
          case '==': return val === f.value;
          case '!=': return val !== f.value;
          case '<': return val < f.value;
          case '<=': return val <= f.value;
          case '>': return val > f.value;
          case '>=': return val >= f.value;
          case 'array-contains': return Array.isArray(val) && val.includes(f.value);
          case 'in': return Array.isArray(f.value) && f.value.includes(val);
          default: return true;
        }
      });
    });
  }
}

export const dbRouter = DatabaseRouter.getInstance();
