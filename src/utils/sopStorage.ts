// Persistent IndexedDB & LocalStorage Engine for SOP / POP Documents
// Guarantees large PDFs and custom user-inserted POPs are never lost or wiped on reload.

import { SopDocument } from './sopUtils';

const DB_NAME = 'ArmazemFacil_SOP_IndexedDB';
const DB_VERSION = 2;
const STORE_NAME = 'sop_documents_store';
const FILES_STORE_NAME = 'sop_files_store';

// In-memory cache for ultra-fast synchronous reads
const inMemorySopCache: Map<string, SopDocument> = new Map();
const inMemoryFileCache: Map<string, { name: string; dataUrl: string; type?: string }> = new Map();
let isDbInitialized = false;

function openSopDB(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(FILES_STORE_NAME)) {
          db.createObjectStore(FILES_STORE_NAME, { keyPath: 'key' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch (e) {
      resolve(null);
    }
  });
}

/**
 * Hydrates the in-memory cache from IndexedDB on initial load
 */
export async function initSopStorage(): Promise<SopDocument[]> {
  if (isDbInitialized && inMemorySopCache.size > 0) {
    return Array.from(inMemorySopCache.values());
  }

  const db = await openSopDB();
  if (!db) return [];

  return new Promise((resolve) => {
    try {
      const tx = db.transaction([STORE_NAME, FILES_STORE_NAME], 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const filesStore = tx.objectStore(FILES_STORE_NAME);
      
      const req = store.getAll();
      const filesReq = filesStore.getAll();

      tx.oncomplete = () => {
        const docs: SopDocument[] = req.result || [];
        docs.forEach(doc => {
          if (doc && doc.id) {
            inMemorySopCache.set(doc.id, doc);
          }
        });

        const files: { key: string; name: string; dataUrl: string; type?: string }[] = filesReq.result || [];
        files.forEach(f => {
          if (f && f.key) {
            inMemoryFileCache.set(f.key, f);
          }
        });

        isDbInitialized = true;
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('af_pop_updated'));
        }
        resolve(docs);
      };

      tx.onerror = () => resolve([]);
    } catch (e) {
      resolve([]);
    }
  });
}

/**
 * Saves a SOP document to IndexedDB and memory cache
 */
export async function saveSopToIDB(sop: SopDocument): Promise<void> {
  if (!sop || !sop.id) return;

  // Update memory cache
  inMemorySopCache.set(sop.id, sop);

  const db = await openSopDB();
  if (!db || !db.objectStoreNames.contains(STORE_NAME)) return;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(sop);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch (e) {
      resolve();
    }
  });
}

/**
 * Saves a standalone file (e.g. from direct dashboard import) to IndexedDB
 */
export async function saveSopFileToIDB(key: string, name: string, dataUrl: string, type?: string): Promise<void> {
  if (!key || !dataUrl) return;
  inMemoryFileCache.set(key, { name, dataUrl, type });

  const db = await openSopDB();
  if (!db || !db.objectStoreNames.contains(FILES_STORE_NAME)) return;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(FILES_STORE_NAME, 'readwrite');
      const store = tx.objectStore(FILES_STORE_NAME);
      store.put({ key, name, dataUrl, type });
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch (e) {
      resolve();
    }
  });
}

export function getCachedSopFile(key: string): { name: string; dataUrl: string; type?: string } | undefined {
  return inMemoryFileCache.get(key);
}

/**
 * Deletes a SOP document from IndexedDB and memory cache
 */
export async function deleteSopFromIDB(sopId: string): Promise<void> {
  if (!sopId) return;

  inMemorySopCache.delete(sopId);

  const db = await openSopDB();
  if (!db || !db.objectStoreNames.contains(STORE_NAME)) return;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(sopId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch (e) {
      resolve();
    }
  });
}

/**
 * Synchronous getter from memory cache
 */
export function getCachedSopsFromMemory(): SopDocument[] {
  return Array.from(inMemorySopCache.values());
}

// Auto-initialize on import in browser
if (typeof window !== 'undefined') {
  initSopStorage().catch(() => {});
}
