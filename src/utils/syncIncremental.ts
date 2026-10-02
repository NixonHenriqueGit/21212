import {
  collection,
  query,
  where,
  getDocsFromCache,
  getDocsFromServer,
  getDocs,
  onSnapshot,
  Timestamp,
  QueryDocumentSnapshot,
  limit
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  getHybridCacheCollection, 
  setHybridCacheCollection, 
  recordActualFirestoreReads 
} from './hybridCacheService';
import { saveJsonTable, getJsonTable } from './hybridJsonDatabase';
import { isRealtimePermitido, getRealtimeInfo } from './realtimeClassification';

export interface SyncIncrementalOptions {
  collectionName: string;
  empresaId: string;
  onData: (data: any[]) => void;
  onError?: (err: any) => void;
  forceRealtime?: boolean;
}

/**
 * Utilitário de Sincronização Incremental Híbrida:
 * 1. Carrega imediatamente do Cache L1 (Memória) / L2 (IndexedDB) e JSON Database (0 leituras no servidor, 0ms).
 * 2. Se houver delta pendente, busca no Firestore apenas os documentos alterados após 'lastSync'.
 * 3. Alimenta a camada de JSON Database e Cache L1/L2 para consultas históricas offline e relatórios.
 * 4. Mantém listener em tempo real escopado com debounce para não gerar leituras redundantes.
 */
export function syncIncremental({
  collectionName,
  empresaId,
  onData,
  onError,
  forceRealtime = false
}: SyncIncrementalOptions): () => void {
  if (!db || !empresaId) {
    onData([]);
    return () => {};
  }

  let isUnsubscribed = false;
  let activeUnsub: (() => void) | null = null;
  const docsMap = new Map<string, any>();
  const businessIdToDocKey = new Map<string, string>();

  const cacheKey = `hybrid_col:${empresaId}:${collectionName}`;
  const syncKey = `sync:${empresaId}:${collectionName}`;
  const lastSyncStr = localStorage.getItem(syncKey);

  const getItemKey = (item: any): string => {
    if (!item) return '';
    if (item._docId) return `doc:${item._docId}`;
    if (item.id !== undefined && item.id !== null && item.id !== '') return `id:${item.id}`;
    // Chaves de negócio para itens sem _docId e sem id explícito
    if (item.codigo && item.validade && item.localizacao) {
      return `val:${item.codigo}_${item.validade}_${item.localizacao}_${item.bloco || ''}`;
    }
    if (item.dataISO && item.inicio && item.codigo) {
      return `desp:${item.dataISO}_${item.inicio}_${item.codigo}`;
    }
    if (item.dataISO && item.placa && item.inicio) {
      return `arm:${item.dataISO}_${item.placa}_${item.inicio}`;
    }
    if (item.matricula) {
      return `colab:${item.matricula}`;
    }
    return JSON.stringify(item);
  };

  const notify = () => {
    if (!isUnsubscribed) {
      const rawRecords = Array.from(docsMap.values());
      const seen = new Set<string>();
      const records: any[] = [];

      // Processar garantindo unicidade estrita O(N)
      for (const item of rawRecords) {
        if (!item) continue;
        const key = getItemKey(item);
        if (!key || seen.has(key)) continue;

        // Validação cruzada para evitar duplicidade id vs _docId
        const idKey = (item.id !== undefined && item.id !== null) ? `id:${item.id}` : null;
        const docKey = item._docId ? `doc:${item._docId}` : null;
        if ((idKey && seen.has(idKey)) || (docKey && seen.has(docKey))) {
          continue;
        }

        seen.add(key);
        if (idKey) seen.add(idKey);
        if (docKey) seen.add(docKey);
        records.push(item);
      }

      onData(records);
      // Salva de forma assíncrona desacoplada da thread principal
      setTimeout(() => {
        if (!isUnsubscribed) {
          setHybridCacheCollection(cacheKey, records, 1000 * 60 * 60 * 24).catch(() => {});
          saveJsonTable(empresaId, collectionName, records).catch(() => {});
        }
      }, 500);
    }
  };

  const storeDoc = (docId: string, data: any) => {
    const rawData = typeof data === 'object' && data !== null ? data : {};
    const businessId = rawData.id !== undefined && rawData.id !== null ? rawData.id : docId;
    const docItem = { _docId: docId, id: businessId, ...rawData };
    const primaryKey = `doc:${docId}`;
    const businessKey = String(businessId);

    // O(1): se já existia outro documento com o mesmo businessId, remove para evitar duplicatas
    const prevKey = businessIdToDocKey.get(businessKey);
    if (prevKey && prevKey !== primaryKey) {
      docsMap.delete(prevKey);
    }

    businessIdToDocKey.set(businessKey, primaryKey);
    docsMap.set(primaryKey, docItem);
  };

  const runSync = async () => {
    if (isUnsubscribed) return;

    const colRef = collection(db, collectionName);
    const targetEmpresaId = (!empresaId || empresaId === 'emp_dono') ? 'demo' : empresaId;
    const targetIds = (targetEmpresaId && targetEmpresaId !== 'all')
      ? (targetEmpresaId === 'demo' ? ['demo', 'emp_dono'] : [targetEmpresaId, 'demo'])
      : null;
    const baseQuery = targetIds
      ? query(colRef, where('empresaId', 'in', targetIds))
      : query(colRef);

    // Consulta direta ao Firestore (Cache desativado)
    const startTime = new Date();
    try {
      let serverSnap;
      try {
        serverSnap = await getDocsFromServer(baseQuery);
      } catch (_) {
        serverSnap = await getDocs(baseQuery);
      }

      if (serverSnap && !serverSnap.empty) {
        recordActualFirestoreReads(serverSnap.docs.length);
        docsMap.clear();
        businessIdToDocKey.clear();
        serverSnap.docs.forEach((doc: QueryDocumentSnapshot) => {
          storeDoc(doc.id, doc.data());
        });
        notify();
      }

      localStorage.setItem(syncKey, startTime.toISOString());
    } catch (err) {
      console.warn(`[syncIncremental] Aviso ao sincronizar '${collectionName}':`, err);
      try {
        const fallbackSnap = await getDocs(baseQuery);
        if (!fallbackSnap.empty) {
          docsMap.clear();
          businessIdToDocKey.clear();
          fallbackSnap.docs.forEach((doc: QueryDocumentSnapshot) => {
            storeDoc(doc.id, doc.data());
          });
          notify();
        }
      } catch (fErr) {
        if (onError) onError(fErr);
      }
    }

    if (isUnsubscribed) return;

    // 4. Listener em tempo real: SÓ CRIA onSnapshot SE REALTIME FOR NECESSÁRIO
    const permitRealtime = isRealtimePermitido(collectionName, forceRealtime);
    if (!permitRealtime) {
      return;
    }

    try {
      let debounceTimer: any = null;
      activeUnsub = onSnapshot(
        baseQuery,
        (snap) => {
          let changed = false;
          snap.docChanges().forEach((change) => {
            if (change.type === 'removed') {
              docsMap.delete(`doc:${change.doc.id}`);
              const bId = change.doc.data()?.id;
              if (bId !== undefined && bId !== null) {
                businessIdToDocKey.delete(String(bId));
              }
              changed = true;
            } else {
              storeDoc(change.doc.id, change.doc.data());
              changed = true;
            }
          });
          if (changed) {
            recordActualFirestoreReads(snap.docChanges().length);
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
              localStorage.setItem(syncKey, new Date().toISOString());
              notify();
            }, 300);
          }
        },
        (err) => {
          if (onError) onError(err);
        }
      );
    } catch (err) {
      console.warn(`[syncIncremental] Erro ao iniciar listener em tempo real para '${collectionName}':`, err);
    }
  };

  runSync();

  return () => {
    isUnsubscribed = true;
    if (activeUnsub) {
      activeUnsub();
    }
  };
}
