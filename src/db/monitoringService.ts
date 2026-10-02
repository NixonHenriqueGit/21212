/**
 * MONITORING SERVICE - Telemetria e Monitoramento em Tempo Real (Item 19)
 * 
 * Registra e calcula métricas da nova camada híbrida:
 * - jsonHits: Consultas resolvidas com sucesso via JSON Database local (/hoje/ ou /historico/)
 * - jsonMisses: Consultas que não foram encontradas no JSON local
 * - cacheHits: Consultas resolvidas via Memória RAM (L1) ou IndexedDB (L2)
 * - cacheMisses: Consultas não encontradas no Cache
 * - firestoreReads: Documentos lidos diretamente do Firebase Firestore
 * - realtimeListeners: Listeners onSnapshot ativos / conectados
 * 
 * Calcula o percentual de utilização de cada origem (JSON, CACHE, FIRESTORE),
 * garantindo a validação da meta: Cache + JSON ≈ maioria absoluta, Firestore ≈ somente dados necessários.
 */

export interface MonitoringMetrics {
  jsonHits: number;
  jsonMisses: number;
  cacheHits: number;
  cacheMisses: number;
  firestoreReads: number;
  firestoreQueries: number;
  realtimeListeners: number;
  deduplicatedQueries: number;
  
  // Totais e Distribuição Percentual
  totalRequests: number;
  cachePercent: number;
  jsonPercent: number;
  firestorePercent: number;
  hybridEfficiencyPercent: number; // (Cache + JSON) / Total
  
  // Timestamp
  lastUpdated: string;
  sessionStarted: string;
}

export interface QueryEventLog {
  id: string;
  timestamp: string;
  collection: string;
  origin: 'CACHE' | 'JSON' | 'FIRESTORE';
  operation: 'getDoc' | 'getDocs' | 'getPaginated' | 'getAggregate' | 'onSnapshot';
  count: number;
  durationMs: number;
  status: 'hit' | 'miss' | 'synced';
}

const STORAGE_KEY = 'armazem_facil_telemetry_metrics_v1';

class MonitoringService {
  private static instance: MonitoringService;

  private jsonHits = 0;
  private jsonMisses = 0;
  private cacheHits = 0;
  private cacheMisses = 0;
  private firestoreReads = 0;
  private firestoreQueries = 0;
  private realtimeListeners = 0;
  private deduplicatedQueries = 0;
  private sessionStarted = new Date().toISOString();
  private lastUpdated = new Date().toISOString();

  private recentLogs: QueryEventLog[] = [];
  private listeners: Set<(metrics: MonitoringMetrics) => void> = new Set();

  private constructor() {
    this.loadPersistedMetrics();
  }

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  private loadPersistedMetrics() {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.jsonHits = parsed.jsonHits || 0;
        this.jsonMisses = parsed.jsonMisses || 0;
        this.cacheHits = parsed.cacheHits || 0;
        this.cacheMisses = parsed.cacheMisses || 0;
        this.firestoreReads = parsed.firestoreReads || 0;
        this.firestoreQueries = parsed.firestoreQueries || 0;
        this.deduplicatedQueries = parsed.deduplicatedQueries || 0;
        this.sessionStarted = parsed.sessionStarted || this.sessionStarted;
      }
    } catch (_) {}
  }

  private persistMetrics() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          jsonHits: this.jsonHits,
          jsonMisses: this.jsonMisses,
          cacheHits: this.cacheHits,
          cacheMisses: this.cacheMisses,
          firestoreReads: this.firestoreReads,
          firestoreQueries: this.firestoreQueries,
          deduplicatedQueries: this.deduplicatedQueries,
          sessionStarted: this.sessionStarted
        })
      );
    } catch (_) {}
  }

  private notify() {
    this.lastUpdated = new Date().toISOString();
    const metrics = this.getMetrics();
    this.listeners.forEach((cb) => {
      try {
        cb(metrics);
      } catch (e) {
        console.warn('[MonitoringService] Erro no listener:', e);
      }
    });
    this.persistMetrics();
  }

  public recordJsonHit(itemsCount = 1, collection = 'unknown', durationMs = 0) {
    this.jsonHits++;
    this.addLog({
      collection,
      origin: 'JSON',
      operation: 'getDocs',
      count: itemsCount,
      durationMs,
      status: 'hit'
    });
    this.notify();
  }

  public recordJsonMiss(collection = 'unknown') {
    this.jsonMisses++;
    this.addLog({
      collection,
      origin: 'JSON',
      operation: 'getDocs',
      count: 0,
      durationMs: 0,
      status: 'miss'
    });
    this.notify();
  }

  public recordCacheHit(itemsCount = 1, collection = 'unknown', durationMs = 0) {
    this.cacheHits++;
    this.addLog({
      collection,
      origin: 'CACHE',
      operation: 'getDocs',
      count: itemsCount,
      durationMs,
      status: 'hit'
    });
    this.notify();
  }

  public recordCacheMiss(collection = 'unknown') {
    this.cacheMisses++;
    this.addLog({
      collection,
      origin: 'CACHE',
      operation: 'getDocs',
      count: 0,
      durationMs: 0,
      status: 'miss'
    });
    this.notify();
  }

  public recordFirestoreRead(docCount = 1, collection = 'unknown', operation: 'getDoc' | 'getDocs' | 'getPaginated' | 'getAggregate' | 'onSnapshot' = 'getDocs', durationMs = 0) {
    this.firestoreReads += docCount;
    this.firestoreQueries++;
    this.addLog({
      collection,
      origin: 'FIRESTORE',
      operation,
      count: docCount,
      durationMs,
      status: 'synced'
    });
    this.notify();
  }

  public recordRealtimeListenerCount(count: number) {
    this.realtimeListeners = count;
    this.notify();
  }

  public recordDeduplicatedQuery() {
    this.deduplicatedQueries++;
    this.notify();
  }

  private addLog(log: Omit<QueryEventLog, 'id' | 'timestamp'>) {
    const entry: QueryEventLog = {
      ...log,
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    this.recentLogs = [entry, ...this.recentLogs.slice(0, 49)]; // mantém os 50 mais recentes
  }

  public getRecentLogs(): QueryEventLog[] {
    return [...this.recentLogs];
  }

  public getMetrics(): MonitoringMetrics {
    const totalRequests = this.cacheHits + this.jsonHits + this.firestoreQueries;
    
    // Percentuais calculados sobre as consultas resolvidas
    let cachePercent = 0;
    let jsonPercent = 0;
    let firestorePercent = 0;
    let hybridEfficiencyPercent = 100;

    if (totalRequests > 0) {
      cachePercent = Math.round((this.cacheHits / totalRequests) * 100);
      jsonPercent = Math.round((this.jsonHits / totalRequests) * 100);
      firestorePercent = Math.round((this.firestoreQueries / totalRequests) * 100);
      hybridEfficiencyPercent = Math.min(100, Math.round(((this.cacheHits + this.jsonHits) / totalRequests) * 100));
    } else {
      cachePercent = 50;
      jsonPercent = 50;
      firestorePercent = 0;
      hybridEfficiencyPercent = 100;
    }

    return {
      jsonHits: this.jsonHits,
      jsonMisses: this.jsonMisses,
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      firestoreReads: this.firestoreReads,
      firestoreQueries: this.firestoreQueries,
      realtimeListeners: this.realtimeListeners,
      deduplicatedQueries: this.deduplicatedQueries,
      totalRequests,
      cachePercent,
      jsonPercent,
      firestorePercent,
      hybridEfficiencyPercent,
      lastUpdated: this.lastUpdated,
      sessionStarted: this.sessionStarted
    };
  }

  public resetMetrics() {
    this.jsonHits = 0;
    this.jsonMisses = 0;
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.firestoreReads = 0;
    this.firestoreQueries = 0;
    this.deduplicatedQueries = 0;
    this.recentLogs = [];
    this.sessionStarted = new Date().toISOString();
    this.persistMetrics();
    this.notify();
  }

  public subscribe(cb: (metrics: MonitoringMetrics) => void): () => void {
    this.listeners.add(cb);
    cb(this.getMetrics());
    return () => {
      this.listeners.delete(cb);
    };
  }
}

export const monitoringService = MonitoringService.getInstance();
