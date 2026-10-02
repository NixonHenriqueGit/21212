/**
 * HYBRID CACHE SERVICE (IndexedDB + Memory + Stale-While-Revalidate)
 * Redutor de leituras do Firestore para a meta de ~20.000 leituras/dia.
 * 
 * Camadas:
 * 1. Memória RAM (L1) -> Ultra rápido (0ms)
 * 2. IndexedDB (L2) -> Persistente entre abas e recargas (0 leituras)
 * 3. Stale-While-Revalidate -> Devolve cache e atualiza delta em background
 */

import { CacheEntry } from '../database/databaseTypes';

const IDB_NAME = 'ArmazemFacilHybridDB_v2';
const IDB_VERSION = 2;

const STORES = {
  DOCUMENTS: 'hybrid_documents',
  COLLECTIONS: 'hybrid_collections',
  METRICS: 'hybrid_metrics',
  JSON_SNAPSHOTS: 'hybrid_json_snapshots'
} as const;

let idbInstance: IDBDatabase | null = null;
let idbPromise: Promise<IDBDatabase | null> | null = null;
const memoryCache = new Map<string, CacheEntry<any>>();

// Métricas de leituras economizadas em tempo de execução
export let HYBRID_CACHE_ACTIVE = false;

export function setHybridCacheActive(active: boolean) {
  HYBRID_CACHE_ACTIVE = active;
}

export interface CacheMetrics {
  cacheHits: number;
  serverReadsSaved: number;
  firestoreReadsActual: number;
  readsAvoided?: number;
  actualFirestoreReads?: number;
  estimatedSavingsUSD?: number;
  estimatedCostUSD?: number;
  savingsPercent?: number;
  lastReset: string;
}

let sessionMetrics: CacheMetrics = {
  cacheHits: 0,
  serverReadsSaved: 0,
  firestoreReadsActual: 0,
  lastReset: new Date().toISOString()
};

function ensureStores(db: IDBDatabase) {
  const storeList = Object.values(STORES);
  for (const storeName of storeList) {
    if (!db.objectStoreNames.contains(storeName)) {
      const keyPath = storeName === STORES.DOCUMENTS ? 'id' : 'key';
      db.createObjectStore(storeName, { keyPath });
    }
  }
}

// Inicializa IndexedDB com auto-recuperação e verificação de schema
function getHybridIDB(): Promise<IDBDatabase | null> {
  if (idbInstance) {
    const hasAllStores = Object.values(STORES).every(storeName =>
      idbInstance!.objectStoreNames.contains(storeName)
    );
    if (hasAllStores) {
      return Promise.resolve(idbInstance);
    }
    try {
      idbInstance.close();
    } catch (_) {}
    idbInstance = null;
  }

  if (idbPromise) return idbPromise;

  idbPromise = new Promise<IDBDatabase | null>((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }

    try {
      const request = window.indexedDB.open(IDB_NAME, IDB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        ensureStores(db);
      };

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const hasAllStores = Object.values(STORES).every(storeName =>
          db.objectStoreNames.contains(storeName)
        );

        if (!hasAllStores) {
          // Schema desatualizado ou stores faltando: abre nova versão para forçar upgrade
          db.close();
          try {
            const upgReq = window.indexedDB.open(IDB_NAME, (db.version || IDB_VERSION) + 1);
            upgReq.onupgradeneeded = (upgEvent) => {
              const upgDb = (upgEvent.target as IDBOpenDBRequest).result;
              ensureStores(upgDb);
            };
            upgReq.onsuccess = (upgEvent) => {
              idbInstance = (upgEvent.target as IDBOpenDBRequest).result;
              resolve(idbInstance);
            };
            upgReq.onerror = () => resolve(null);
            upgReq.onblocked = () => resolve(null);
          } catch (_) {
            resolve(null);
          }
          return;
        }

        idbInstance = db;
        resolve(idbInstance);
      };

      request.onerror = () => {
        resolve(null);
      };

      request.onblocked = () => {
        resolve(null);
      };
    } catch (e) {
      resolve(null);
    }
  }).finally(() => {
    idbPromise = null;
  });

  return idbPromise;
}

/**
 * Fallback auxiliar para leitura de LocalStorage
 */
function readLocalStorageFallback<T>(
  key: string,
  allowStale: boolean,
  now: number
): { data: T[]; isStale: boolean; fromMemory: boolean; entry?: CacheEntry<T[]> } | null {
  try {
    const raw = localStorage.getItem(`hc:${key}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      const updatedTime = parsed.updatedAt ? new Date(parsed.updatedAt).getTime() : parsed.timestamp || now;
      const ttl = parsed.ttl || 1000 * 60 * 30;
      const isStale = now - updatedTime > ttl;
      if (!isStale || allowStale) {
        return { data: parsed.data as T[], isStale, fromMemory: false, entry: parsed };
      }
    }
  } catch (_) {}
  return null;
}

/**
 * Salva uma coleção inteira ou fatia de dados no Cache L1 (Memória) e L2 (IndexedDB).
 * Contém chave, data de criação, data de atualização, TTL, origem e versão.
 */
export async function setHybridCacheCollection<T>(
  key: string,
  data: T[],
  ttlMs = 1000 * 60 * 30, // Padrão: 30 minutos
  source: 'json' | 'firestore' | 'cache' | 'hybrid' | string = 'hybrid',
  version = 1
): Promise<CacheEntry<T[]>> {
  const nowISO = new Date().toISOString();
  
  const entry: CacheEntry<T[]> = {
    key,
    source,
    createdAt: nowISO,
    updatedAt: nowISO,
    ttl: ttlMs,
    version,
    data,
    count: Array.isArray(data) ? data.length : 1
  };

  // Se cache estiver desativado, não armazena em memória nem no IndexedDB
  if (!HYBRID_CACHE_ACTIVE) {
    return entry;
  }
  
  // Verifica se já existia para manter createdAt original
  const existingMem = memoryCache.get(key);
  const createdAt = existingMem?.createdAt || nowISO;
  entry.createdAt = createdAt;
  
  // 1. Atualizar Memória (L1)
  memoryCache.set(key, entry);

  // 2. Atualizar IndexedDB (L2)
  try {
    const db = await getHybridIDB();
    if (db && db.objectStoreNames.contains(STORES.COLLECTIONS)) {
      const tx = db.transaction(STORES.COLLECTIONS, 'readwrite');
      const store = tx.objectStore(STORES.COLLECTIONS);
      store.put(entry);
    }
  } catch (e) {
    // Fallback silencioso no localStorage se IndexedDB falhar
    try {
      if (Array.isArray(data) && data.length < 500) {
        localStorage.setItem(`hc:${key}`, JSON.stringify(entry));
      }
    } catch (_) {}
  }

  return entry;
}

/**
 * Obtém a coleção do Cache (Memória ou IndexedDB).
 * Retorna null se não existir ou se estiver expirado (quando allowStale=false).
 */
export async function getHybridCacheCollection<T>(
  key: string,
  allowStale = true
): Promise<{ data: T[]; isStale: boolean; fromMemory: boolean; entry?: CacheEntry<T[]> } | null> {
  // Quando cache estiver desativado a pedido do usuário, sempre retorna null para forçar busca direta
  if (!HYBRID_CACHE_ACTIVE) {
    return null;
  }

  const now = Date.now();

  // 1. Verificar Memória (L1)
  const inMem = memoryCache.get(key);
  if (inMem) {
    const updatedTime = new Date(inMem.updatedAt).getTime() || now;
    const ttl = inMem.ttl || 1000 * 60 * 30;
    const isStale = now - updatedTime > ttl;
    if (!isStale || allowStale) {
      sessionMetrics.cacheHits++;
      sessionMetrics.serverReadsSaved += Array.isArray(inMem.data) ? inMem.data.length : 1;
      return { data: inMem.data as T[], isStale, fromMemory: true, entry: inMem as CacheEntry<T[]> };
    }
  }

  // 2. Verificar IndexedDB (L2)
  try {
    const db = await getHybridIDB();
    if (!db || !db.objectStoreNames.contains(STORES.COLLECTIONS)) {
      return readLocalStorageFallback<T>(key, allowStale, now);
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORES.COLLECTIONS, 'readonly');
        const store = tx.objectStore(STORES.COLLECTIONS);
        const req = store.get(key);

        req.onsuccess = () => {
          const result = req.result as CacheEntry<T[]> | (any & { timestamp?: number });
          if (!result || !result.data) {
            resolve(readLocalStorageFallback<T>(key, allowStale, now));
            return;
          }

          const updatedTime = result.updatedAt ? new Date(result.updatedAt).getTime() : (result as any).timestamp || now;
          const ttl = result.ttl || 1000 * 60 * 30;
          const isStale = now - updatedTime > ttl;

          if (!isStale || allowStale) {
            // Normaliza formato CacheEntry caso tenha vindo do schema anterior
            const normalizedEntry: CacheEntry<T[]> = {
              key: result.key || key,
              source: result.source || 'hybrid',
              createdAt: result.createdAt || new Date(updatedTime).toISOString(),
              updatedAt: result.updatedAt || new Date(updatedTime).toISOString(),
              ttl,
              version: result.version || 1,
              data: result.data,
              count: Array.isArray(result.data) ? result.data.length : 1
            };

            // Re-hidrata a memória (L1)
            memoryCache.set(key, normalizedEntry);
            sessionMetrics.cacheHits++;
            sessionMetrics.serverReadsSaved += Array.isArray(result.data) ? result.data.length : 1;
            resolve({ data: result.data as T[], isStale, fromMemory: false, entry: normalizedEntry });
          } else {
            resolve(null);
          }
        };

        req.onerror = () => resolve(readLocalStorageFallback<T>(key, allowStale, now));
      } catch (_) {
        resolve(readLocalStorageFallback<T>(key, allowStale, now));
      }
    });
  } catch (e) {
    return readLocalStorageFallback<T>(key, allowStale, now);
  }
}

/**
 * Registra leituras economizadas no cache
 */
export function recordAvoidedReads(count: number): void {
  sessionMetrics.serverReadsSaved += count;
  sessionMetrics.cacheHits++;
}

/**
 * Registra leitura real no servidor (para contabilizar no painel de controle)
 */
export function recordActualFirestoreReads(count: number): void {
  sessionMetrics.firestoreReadsActual += count;
}

/**
 * Retorna as estatísticas de economia de leituras da sessão
 */
export function getHybridMetrics(): CacheMetrics {
  const avoided = sessionMetrics.serverReadsSaved || 0;
  const actual = sessionMetrics.firestoreReadsActual || 0;
  const total = avoided + actual;
  const savingsPercent = total > 0 ? Math.round((avoided / total) * 100) : 100;
  const costPer100k = 0.06; // ~$0.06 por 100k leituras
  const estimatedSavingsUSD = parseFloat(((avoided / 100000) * costPer100k).toFixed(4));
  const estimatedCostUSD = parseFloat(((actual / 100000) * costPer100k).toFixed(4));

  return {
    ...sessionMetrics,
    readsAvoided: avoided,
    actualFirestoreReads: actual,
    estimatedSavingsUSD,
    estimatedCostUSD,
    savingsPercent
  };
}

/**
 * Limpa o cache de uma chave específica ou de todas as coleções
 */
export async function invalidateHybridCache(keyPrefix?: string): Promise<void> {
  if (!keyPrefix) {
    memoryCache.clear();
    try {
      const db = await getHybridIDB();
      if (db) {
        const availableStores = [STORES.COLLECTIONS, STORES.DOCUMENTS].filter(s => db.objectStoreNames.contains(s));
        if (availableStores.length > 0) {
          const tx = db.transaction(availableStores, 'readwrite');
          availableStores.forEach(s => {
            try {
              tx.objectStore(s).clear();
            } catch (_) {}
          });
        }
      }
    } catch (_) {}
    return;
  }

  // Limpar chaves que começam com o prefixo
  for (const k of Array.from(memoryCache.keys())) {
    if (k.startsWith(keyPrefix)) {
      memoryCache.delete(k);
    }
  }

  try {
    const db = await getHybridIDB();
    if (db && db.objectStoreNames.contains(STORES.COLLECTIONS)) {
      const tx = db.transaction(STORES.COLLECTIONS, 'readwrite');
      const store = tx.objectStore(STORES.COLLECTIONS);
      const req = store.openCursor();
      req.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result as IDBCursorWithValue;
        if (cursor) {
          if (typeof cursor.key === 'string' && cursor.key.startsWith(keyPrefix)) {
            cursor.delete();
          }
          cursor.continue();
        }
      };
    }
  } catch (_) {}
}

/**
 * Limpa completamente todos os caches (Memória, IndexedDB e LocalStorage)
 */
export async function clearAllCaches(): Promise<void> {
  memoryCache.clear();
  if (typeof window === 'undefined') return;

  try {
    // 1. Limpar LocalStorage de chaves de cache
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (
        k.startsWith('hc:') || 
        k.startsWith('hybrid_col:') || 
        k.startsWith('col:') || 
        k.startsWith('sync:') || 
        k.startsWith('af_json_table:') ||
        k.startsWith('cached_')
      )) {
        toRemove.push(k);
      }
    }
    toRemove.forEach(k => {
      try { localStorage.removeItem(k); } catch (_) {}
    });

    // 2. Fechar e deletar banco IndexedDB de cache
    if (window.indexedDB) {
      if (idbInstance) {
        try { idbInstance.close(); } catch (_) {}
        idbInstance = null;
      }
      try { window.indexedDB.deleteDatabase(IDB_NAME); } catch (_) {}
      try { window.indexedDB.deleteDatabase('ArmazemFacilHybridDB'); } catch (_) {}
    }
  } catch (err) {
    console.warn('[hybridCache] Erro ao limpar caches:', err);
  }
}
