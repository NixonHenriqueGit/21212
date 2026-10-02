// Persistent IndexedDB Storage Engine for Pest Control Certificates (Laudos Quinzenais de Pragas)
// Prevents browser localStorage 5MB QuotaExceededError and guarantees uploaded PDFs persist across F5 reloads.

import { firestoreDb } from '../database/firestoreDatabase';

export interface LaudoFileItem {
  fileName: string;
  fileDataUrl?: string;
  fileSize?: string;
}

export interface LaudoPragas {
  id: string;
  numeroCertificado: string;
  empresaEspecializada: string;
  responsavelTecnico: string;
  dataExecucao: string;
  dataVencimento: string;
  observacoes: string;
  fileName: string;
  fileDataUrl?: string;
  arquivos?: LaudoFileItem[];
  uploadBy: string;
  criadoEm: string;
}

const DB_NAME = 'ArmazemFacil_Pragas_IndexedDB';
const DB_VERSION = 1;
const STORE_NAME = 'pragas_laudos_store';
const LS_META_KEY = 'controle_pragas_laudos_meta';
const LS_LEGACY_KEY = 'controle_pragas_laudos';

// In-memory cache for fast synchronous rendering
const inMemoryPragasCache: Map<string, LaudoPragas> = new Map();
let isPragasDbInitialized = false;

export const INITIAL_SAMPLE_LAUDO: LaudoPragas = {
  id: 'pragas-2026-07-15',
  numeroCertificado: 'CERT-PRAGAS-2026/014',
  empresaEspecializada: 'IMUNIZADORA & DEDETIZADORA GUARABIRA LTDA',
  responsavelTecnico: 'Dr. Fernando Arcoverde (CRQ 04412/PB)',
  dataExecucao: '2026-07-15',
  dataVencimento: '2026-07-30',
  observacoes: 'Aplicação de gel para baratas e iscagem externa de roedores nos perímetros 1 a 4 do armazém. Sem indícios de pragas ativas.',
  fileName: 'Controle_Quinzenal_Pragas_Julho_2026.pdf',
  uploadBy: 'Controle de Qualidade',
  criadoEm: '2026-07-15T08:30:00.000Z'
};

function openPragasDB(): Promise<IDBDatabase | null> {
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
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = (err) => {
        console.warn('Failed to open Pragas IndexedDB:', err);
        resolve(null);
      };
    } catch (e) {
      console.warn('IndexedDB exception:', e);
      resolve(null);
    }
  });
}

/**
 * Strips heavy base64 strings so metadata can safely be stored in localStorage as instant preview
 */
function toLightweightMetadata(laudos: LaudoPragas[]): any[] {
  return laudos.map(l => ({
    id: l.id,
    numeroCertificado: l.numeroCertificado,
    empresaEspecializada: l.empresaEspecializada,
    responsavelTecnico: l.responsavelTecnico,
    dataExecucao: l.dataExecucao,
    dataVencimento: l.dataVencimento,
    observacoes: l.observacoes,
    fileName: l.fileName,
    uploadBy: l.uploadBy,
    criadoEm: l.criadoEm,
    arquivosCount: l.arquivos?.length || (l.fileName ? 1 : 0),
    hasPdfAttached: Boolean(l.fileDataUrl || (l.arquivos && l.arquivos.length > 0))
  }));
}

/**
 * Synchronous getter for React state initial value.
 */
export function getStoredPragasLaudosSync(): LaudoPragas[] {
  if (inMemoryPragasCache.size > 0) {
    const list = Array.from(inMemoryPragasCache.values());
    list.sort((a, b) => new Date(b.dataExecucao).getTime() - new Date(a.dataExecucao).getTime());
    return list;
  }

  // Fallback to localStorage
  try {
    const meta = localStorage.getItem(LS_META_KEY);
    if (meta) {
      const parsed = JSON.parse(meta);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as LaudoPragas[];
      }
    }

    const legacy = localStorage.getItem(LS_LEGACY_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as LaudoPragas[];
      }
    }
  } catch (e) {
    console.warn('Error reading sync pragas laudos:', e);
  }

  return [INITIAL_SAMPLE_LAUDO];
}

/**
 * Hydrates the in-memory cache and state from IndexedDB on startup.
 */
export async function initPragasStorage(): Promise<LaudoPragas[]> {
  try {
    const db = await openPragasDB();
    if (!db || !db.objectStoreNames.contains(STORE_NAME)) {
      const syncList = getStoredPragasLaudosSync();
      syncList.forEach(item => inMemoryPragasCache.set(item.id, item));
      return syncList;
    }

    const docsFromIDB = await new Promise<LaudoPragas[]>((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();

        req.onsuccess = () => {
          resolve(req.result || []);
        };
        req.onerror = () => resolve([]);
      } catch (e) {
        console.warn('IDB read error:', e);
        resolve([]);
      }
    });

    if (docsFromIDB && docsFromIDB.length > 0) {
      inMemoryPragasCache.clear();
      docsFromIDB.forEach(doc => {
        if (doc && doc.id) {
          inMemoryPragasCache.set(doc.id, doc);
        }
      });
      isPragasDbInitialized = true;

      // Update lightweight localStorage metadata
      try {
        localStorage.setItem(LS_META_KEY, JSON.stringify(toLightweightMetadata(docsFromIDB)));
      } catch (_) {}

      docsFromIDB.sort((a, b) => new Date(b.dataExecucao).getTime() - new Date(a.dataExecucao).getTime());
      return docsFromIDB;
    }

    // If IDB is empty, check if legacy localStorage exists to migrate it
    const legacySaved = localStorage.getItem(LS_LEGACY_KEY);
    let initialList: LaudoPragas[] = [INITIAL_SAMPLE_LAUDO];
    if (legacySaved) {
      try {
        const parsed = JSON.parse(legacySaved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          initialList = parsed;
        }
      } catch (_) {}
    }

    // Save initial/migrated records to IndexedDB
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    initialList.forEach(item => {
      store.put(item);
      inMemoryPragasCache.set(item.id, item);
    });

    try {
      localStorage.setItem(LS_META_KEY, JSON.stringify(toLightweightMetadata(initialList)));
    } catch (_) {}

    isPragasDbInitialized = true;
    return initialList;
  } catch (e) {
    console.error('initPragasStorage failed:', e);
    return getStoredPragasLaudosSync();
  }
}

/**
 * Saves a new or updated LaudoPragas directly into IndexedDB (persists massive PDFs without quota issues).
 */
export async function savePragasLaudo(laudo: LaudoPragas): Promise<LaudoPragas[]> {
  if (!laudo || !laudo.id) return Array.from(inMemoryPragasCache.values());

  // 1. Update in-memory cache
  inMemoryPragasCache.set(laudo.id, laudo);

  // 2. Persist full record (with all PDF base64 payloads) in IndexedDB
  try {
    const db = await openPragasDB();
    if (db && db.objectStoreNames.contains(STORE_NAME)) {
      await new Promise<void>((resolve, reject) => {
        try {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          const req = store.put(laudo);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        } catch (err) {
          reject(err);
        }
      });
    }
  } catch (e) {
    console.warn('Error saving laudo to IndexedDB:', e);
  }

  // 3. Save lightweight metadata to localStorage
  const allList = Array.from(inMemoryPragasCache.values());
  allList.sort((a, b) => new Date(b.dataExecucao).getTime() - new Date(a.dataExecucao).getTime());

  try {
    localStorage.setItem(LS_META_KEY, JSON.stringify(toLightweightMetadata(allList)));
    // Also try saving if small enough, but catch quota errors safely
    try {
      localStorage.setItem(LS_LEGACY_KEY, JSON.stringify(allList));
    } catch (_) {
      // LocalStorage quota exceeded due to large PDFs - this is normal and safely handled by IndexedDB
    }
  } catch (e) {
    console.warn('localStorage metadata update warning:', e);
  }

  // 4. Persist to Firestore
  const companyId = (typeof window !== 'undefined' ? localStorage.getItem('af_empresa_id') : '') || 'demo';
  firestoreDb.create('controle_pragas_laudos', {
    id: laudo.id,
    numeroCertificado: laudo.numeroCertificado,
    empresaEspecializada: laudo.empresaEspecializada,
    responsavelTecnico: laudo.responsavelTecnico,
    dataExecucao: laudo.dataExecucao,
    dataVencimento: laudo.dataVencimento,
    observacoes: laudo.observacoes,
    fileName: laudo.fileName,
    uploadBy: laudo.uploadBy,
    criadoEm: laudo.criadoEm,
    arquivosCount: laudo.arquivos?.length || (laudo.fileName ? 1 : 0)
  }, companyId, laudo.id).catch(() => {});

  // 5. Notify all tabs & components
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('controle_pragas_laudos_updated'));
  }

  return allList;
}

/**
 * Deletes a LaudoPragas from IndexedDB, in-memory cache, and localStorage.
 */
export async function deletePragasLaudo(id: string): Promise<LaudoPragas[]> {
  if (!id) return Array.from(inMemoryPragasCache.values());

  // 1. Remove from in-memory cache
  inMemoryPragasCache.delete(id);

  // 2. Remove from IndexedDB
  try {
    const db = await openPragasDB();
    if (db && db.objectStoreNames.contains(STORE_NAME)) {
      await new Promise<void>((resolve) => {
        try {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          const req = store.delete(id);
          req.onsuccess = () => resolve();
          req.onerror = () => resolve();
        } catch (_) {
          resolve();
        }
      });
    }
  } catch (e) {
    console.warn('Error deleting laudo from IndexedDB:', e);
  }

  // 3. Update localStorage metadata
  const allList = Array.from(inMemoryPragasCache.values());
  allList.sort((a, b) => new Date(b.dataExecucao).getTime() - new Date(a.dataExecucao).getTime());

  try {
    localStorage.setItem(LS_META_KEY, JSON.stringify(toLightweightMetadata(allList)));
    try {
      localStorage.setItem(LS_LEGACY_KEY, JSON.stringify(allList));
    } catch (_) {}
  } catch (_) {}

  // 4. Delete from Firestore
  const companyId = (typeof window !== 'undefined' ? localStorage.getItem('af_empresa_id') : '') || 'demo';
  firestoreDb.delete('controle_pragas_laudos', id, companyId).catch(() => {});

  // 5. Notify
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('controle_pragas_laudos_updated'));
  }

  return allList;
}

/**
 * Downloads a base64 DataURL or file URL safely via Blob to avoid browser URL length limits.
 */
export function downloadDataUrl(dataUrl?: string, fileName = 'documento.pdf'): void {
  if (!dataUrl) {
    alert('Arquivo não disponível para download.');
    return;
  }

  try {
    if (dataUrl.startsWith('data:')) {
      const parts = dataUrl.split(',');
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';
      const bstr = atob(parts[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } else {
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  } catch (e) {
    console.error('Download error:', e);
    // Fallback: open in new tab
    const win = window.open();
    if (win) {
      win.document.write(`<iframe src="${dataUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
    }
  }
}

/**
 * Opens a base64 DataURL or file URL in a new browser tab safely using Blob URL or iframe fallback.
 */
export function openDataUrlInNewTab(dataUrl?: string, title = 'Documento PDF'): void {
  if (!dataUrl) {
    alert('Arquivo não disponível para visualização.');
    return;
  }

  try {
    if (dataUrl.startsWith('data:')) {
      const parts = dataUrl.split(',');
      const mimeMatch = parts[0].match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';
      const bstr = atob(parts[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      const url = URL.createObjectURL(blob);
      const win = window.open(url, '_blank');
      if (!win) {
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      setTimeout(() => URL.revokeObjectURL(url), 120000);
    } else {
      window.open(dataUrl, '_blank', 'noopener,noreferrer');
    }
  } catch (e) {
    console.error('Erro ao abrir em nova guia:', e);
    const win = window.open();
    if (win) {
      win.document.write(`<title>${title}</title><iframe src="${dataUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
    }
  }
}
