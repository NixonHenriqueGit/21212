/**
 * FIRESTORE DATABASE - Provedor Nativo do Firebase Firestore
 * 
 * Gerencia leituras seguras com cotas, lotes e subscriptions em tempo real.
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
  onSnapshot,
  writeBatch,
  serverTimestamp,
  QueryConstraint,
  DocumentSnapshot
} from 'firebase/firestore';
import { db } from '../firebase';
import { QueryOptions, QueryFilter, PaginatedResult } from './databaseTypes';

function sanitizeForFirestore(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeForFirestore);
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      clean[key] = sanitizeForFirestore(value);
    }
  }
  return clean;
}

export class FirestoreDatabase {
  private static instance: FirestoreDatabase;

  private constructor() {}

  public static getInstance(): FirestoreDatabase {
    if (!FirestoreDatabase.instance) {
      FirestoreDatabase.instance = new FirestoreDatabase();
    }
    return FirestoreDatabase.instance;
  }

  public async getList<T>(collectionName: string, empresaId = 'demo', options?: QueryOptions<T>): Promise<T[]> {
    const colRef = collection(db, 'empresas', empresaId, collectionName);
    const constraints: QueryConstraint[] = [];

    if (options?.filters && options.filters.length > 0) {
      for (const f of options.filters) {
        constraints.push(where(f.field as string, f.operator as any, f.value));
      }
    }

    if (options?.orderByField) {
      constraints.push(firestoreOrderBy(options.orderByField as string, options.orderDirection || 'asc'));
    }

    // Suporte a paginação via cursor startAfter
    if (options?.startAfterDoc) {
      constraints.push(firestoreStartAfter(options.startAfterDoc));
    } else if (options?.startAfterValue !== undefined && options.startAfterValue !== null) {
      constraints.push(firestoreStartAfter(options.startAfterValue));
    }

    const effectiveLimit = options?.pageSize || options?.limitCount;
    if (effectiveLimit) {
      constraints.push(firestoreLimit(effectiveLimit));
    }

    const q = constraints.length > 0 ? query(colRef, ...constraints) : query(colRef);

    let snapshot;
    if (options?.useCacheOnly) {
      try {
        snapshot = await getDocsFromCache(q);
      } catch {
        snapshot = await getDocs(q);
      }
    } else if (options?.forceServer) {
      snapshot = await getDocsFromServer(q);
    } else {
      snapshot = await getDocs(q);
    }

    return snapshot.docs.map(d => ({
      _docId: d.id,
      id: d.id,
      ...d.data()
    })) as T[];
  }

  /**
   * Executa paginação nativa eficiente no Firestore usando orderBy(), limit() e startAfter()
   * NUNCA utiliza offset() para evitar consumo indevido de cotas e leituras desnecessárias.
   */
  public async getPaginated<T>(
    collectionName: string,
    empresaId = 'demo',
    options?: QueryOptions<T>
  ): Promise<PaginatedResult<T>> {
    const pageSize = options?.pageSize || options?.limitCount || 25;
    const colRef = collection(db, 'empresas', empresaId, collectionName);
    const constraints: QueryConstraint[] = [];

    if (options?.filters && options.filters.length > 0) {
      for (const f of options.filters) {
        constraints.push(where(f.field as string, f.operator as any, f.value));
      }
    }

    const orderField = (options?.orderByField as string) || '_criadoEm';
    const orderDirection = options?.orderDirection || 'asc';
    constraints.push(firestoreOrderBy(orderField, orderDirection));

    // Aplica o cursor de paginação startAfter()
    if (options?.startAfterDoc) {
      constraints.push(firestoreStartAfter(options.startAfterDoc));
    } else if (options?.startAfterValue !== undefined && options.startAfterValue !== null) {
      constraints.push(firestoreStartAfter(options.startAfterValue));
    }

    // Busca pageSize + 1 para saber com precisão se há mais itens sem fazer count adicional
    constraints.push(firestoreLimit(pageSize + 1));

    const q = query(colRef, ...constraints);

    let snapshot;
    if (options?.useCacheOnly) {
      try {
        snapshot = await getDocsFromCache(q);
      } catch {
        snapshot = await getDocs(q);
      }
    } else if (options?.forceServer) {
      snapshot = await getDocsFromServer(q);
    } else {
      snapshot = await getDocs(q);
    }

    const docs = snapshot.docs;
    const hasMore = docs.length > pageSize;
    const slicedDocs = hasMore ? docs.slice(0, pageSize) : docs;

    const items = slicedDocs.map(d => ({
      _docId: d.id,
      id: d.id,
      ...d.data()
    })) as T[];

    const lastDoc = slicedDocs.length > 0 ? slicedDocs[slicedDocs.length - 1] : undefined;
    const lastValue = lastDoc ? (lastDoc.data() as any)[orderField] || lastDoc.id : undefined;

    return {
      items,
      lastVisibleDoc: lastDoc,
      lastVisibleValue: lastValue,
      hasMore,
      pageSize,
      source: options?.useCacheOnly ? 'cache-l2' : 'firestore'
    };
  }

  public async getById<T>(collectionName: string, id: string, empresaId = 'demo'): Promise<T | null> {
    const docRef = doc(db, 'empresas', empresaId, collectionName, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return {
      _docId: snap.id,
      id: snap.id,
      ...snap.data()
    } as T;
  }

  public async create<T>(collectionName: string, data: any, empresaId = 'demo', customDocId?: string): Promise<T> {
    const colRef = collection(db, 'empresas', empresaId, collectionName);
    const sanitizedData = sanitizeForFirestore(data) || {};
    const payload = {
      ...sanitizedData,
      empresaId,
      _criadoEm: new Date().toISOString(),
      _serverTimestamp: serverTimestamp()
    };

    if (customDocId) {
      const docRef = doc(colRef, customDocId);
      await setDoc(docRef, payload, { merge: true });
      return { id: customDocId, _docId: customDocId, ...payload } as T;
    }

    const docRef = await addDoc(colRef, payload);
    return { id: docRef.id, _docId: docRef.id, ...payload } as T;
  }

  public async update<T>(collectionName: string, id: string, data: Partial<T>, empresaId = 'demo'): Promise<void> {
    const docRef = doc(db, 'empresas', empresaId, collectionName, id);
    const sanitizedData = sanitizeForFirestore(data) || {};
    await updateDoc(docRef, {
      ...sanitizedData,
      _atualizadoEm: new Date().toISOString()
    });
  }

  public async delete(collectionName: string, id: string, empresaId = 'demo'): Promise<void> {
    const docRef = doc(db, 'empresas', empresaId, collectionName, id);
    await deleteDoc(docRef);
  }

  public async batchUpsert<T extends { id?: string | number; _docId?: string | number }>(
    collectionName: string,
    items: T[],
    empresaId = 'demo'
  ): Promise<void> {
    if (!items || items.length === 0) return;
    const batch = writeBatch(db);
    const colRef = collection(db, 'empresas', empresaId, collectionName);

    for (const item of items) {
      const docId = String(item._docId || item.id || Math.random().toString(36).substring(2, 9));
      const docRef = doc(colRef, docId);
      const sanitized = sanitizeForFirestore(item) || {};
      batch.set(docRef, {
        ...sanitized,
        empresaId,
        _atualizadoEm: new Date().toISOString()
      }, { merge: true });
    }

    await batch.commit();
  }

  public subscribe<T>(
    collectionName: string,
    empresaId = 'demo',
    callback: (items: T[]) => void,
    onError?: (err: any) => void
  ): () => void {
    const colRef = collection(db, 'empresas', empresaId, collectionName);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const items = snapshot.docs.map(d => ({
          _docId: d.id,
          id: d.id,
          ...d.data()
        })) as T[];
        callback(items);
      },
      (err) => {
        console.error(`[FirestoreDatabase] Subscription error on ${collectionName}:`, err);
        if (onError) onError(err);
      }
    );
  }

  public subscribeDoc<T>(
    collectionName: string,
    id: string,
    callback: (data: T | null) => void,
    onError?: (err: any) => void,
    empresaId = 'demo'
  ): () => void {
    const docRef = doc(db, 'empresas', empresaId, collectionName, id);
    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = {
            _docId: snapshot.id,
            id: snapshot.id,
            ...snapshot.data()
          } as T;
          callback(data);
        } else {
          callback(null);
        }
      },
      (err) => {
        console.error(`[FirestoreDatabase] Doc subscription error on ${collectionName}/${id}:`, err);
        if (onError) onError(err);
      }
    );
  }
}

export const firestoreDb = FirestoreDatabase.getInstance();
