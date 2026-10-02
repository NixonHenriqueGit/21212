/**
 * CACHE DATABASE - Camada L1 (Memory) & L2 (LocalStorage)
 * 
 * Gerencia a retenção em cache com TTL e contagem de economia de leituras.
 */

import {
  getHybridCacheCollection,
  setHybridCacheCollection,
  invalidateHybridCache,
  recordActualFirestoreReads,
  recordAvoidedReads,
  getHybridMetrics
} from '../utils/hybridCacheService';
import { DatabaseMetrics, CacheEntry } from './databaseTypes';

export class CacheDatabase {
  private static instance: CacheDatabase;

  private constructor() {}

  public static getInstance(): CacheDatabase {
    if (!CacheDatabase.instance) {
      CacheDatabase.instance = new CacheDatabase();
    }
    return CacheDatabase.instance;
  }

  private normalizeKey(collectionOrKey: string, empresaId = 'demo'): string {
    if (collectionOrKey.startsWith('col:') || collectionOrKey.includes(':')) {
      return collectionOrKey;
    }
    return `col:${empresaId}:${collectionOrKey}`;
  }

  /**
   * Obtém os dados de uma chave no cache.
   */
  public async get<T>(collectionOrKey: string, empresaId = 'demo', maxAgeMs?: number): Promise<T[] | null> {
    const key = this.normalizeKey(collectionOrKey, empresaId);
    const res = await getHybridCacheCollection<T>(key, true);
    return res?.data || null;
  }

  /**
   * Obtém a entrada completa de cache com todos os metadados (key, source, createdAt, updatedAt, ttl, version, data).
   */
  public async getEntry<T>(collectionOrKey: string, empresaId = 'demo'): Promise<CacheEntry<T[]> | null> {
    const key = this.normalizeKey(collectionOrKey, empresaId);
    const res = await getHybridCacheCollection<T>(key, true);
    return res?.entry || null;
  }

  /**
   * Verifica se uma chave existe no cache local.
   */
  public async has(collectionOrKey: string, empresaId = 'demo'): Promise<boolean> {
    const key = this.normalizeKey(collectionOrKey, empresaId);
    const res = await getHybridCacheCollection(key, false);
    return !!(res && res.data);
  }

  /**
   * Salva no cache IndexedDB / Memória com chave, data de criação, data de atualização, TTL, origem e versão.
   * Exemplo de objeto gravado:
   * {
   *   key: "estoque:2026-08-15",
   *   source: "json",
   *   createdAt: "2026-08-17T...",
   *   updatedAt: "2026-08-17T...",
   *   ttl: 1800000,
   *   version: 1,
   *   data: [...]
   * }
   */
  public set<T>(
    collectionOrKey: string,
    data: T[],
    empresaId = 'demo',
    ttlMs?: number,
    source: 'json' | 'firestore' | 'cache' | 'hybrid' | string = 'hybrid',
    version = 1
  ): Promise<CacheEntry<T[]>> {
    const key = this.normalizeKey(collectionOrKey, empresaId);
    return setHybridCacheCollection<T>(key, data, ttlMs, source, version);
  }

  public invalidate(collectionOrPrefix?: string, empresaId = 'demo'): void {
    const keyPrefix = collectionOrPrefix ? this.normalizeKey(collectionOrPrefix, empresaId) : undefined;
    invalidateHybridCache(keyPrefix).catch(() => {});
  }

  public recordAvoided(count: number): void {
    recordAvoidedReads(count);
  }

  public recordActualReads(count: number): void {
    recordActualFirestoreReads(count);
  }

  public getMetrics(): DatabaseMetrics {
    const raw = getHybridMetrics();
    return {
      readsAvoided: raw.readsAvoided || raw.serverReadsSaved || 0,
      actualReads: raw.actualFirestoreReads || raw.firestoreReadsActual || 0,
      cacheHits: raw.cacheHits || 0,
      cacheMisses: raw.actualFirestoreReads || raw.firestoreReadsActual || 0,
      costSavedUSD: raw.estimatedSavingsUSD || 0,
      costCurrentUSD: raw.estimatedCostUSD || 0,
      economyPercent: raw.savingsPercent || 0
    };
  }
}

export const cacheDb = CacheDatabase.getInstance();
