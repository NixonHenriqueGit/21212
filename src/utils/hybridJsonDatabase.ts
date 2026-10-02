/**
 * HYBRID JSON DATABASE (Camada 2: Histórico, Relatórios e Consultas Offline)
 * 
 * Arquitetura Híbrida:
 * Firestore (Oficial/Realtime) -> JSON Database (Histórico/Snapshots) -> Cache L1/L2 -> React
 * 
 * Reduz consultas complexas e agregações pesadas no Firestore,
 * mantendo o histórico em estruturas JSON indexadas localmente.
 */

import { setHybridCacheCollection, getHybridCacheCollection } from './hybridCacheService';
import { sanitizeData, auditJsonSecurity } from '../security/JsonSecuritySanitizer';

export interface JsonTableMeta {
  name: string;
  count: number;
  lastUpdated: string;
  version: number;
  sizeBytesEstimate: number;
}

export interface JsonDbSnapshot {
  empresaId: string;
  version: number;
  exportedAt: string;
  tables: Record<string, any[]>;
}

/**
 * Salva uma tabela completa no JSON Database da empresa.
 */
export async function saveJsonTable<T extends { id?: string | number; _docId?: string | number }>(
  empresaId: string,
  tableName: string,
  records: T[]
): Promise<void> {
  // Higieniza recursivamente contra senhas, tokens, hashes e secrets (Item 21)
  const sanitizedRecords = sanitizeData(records);
  const cacheKey = `json_db:${empresaId}:${tableName}`;
  await setHybridCacheCollection(cacheKey, sanitizedRecords, 1000 * 60 * 60 * 24); // TTL 24 horas

  // Salva metadados da tabela
  try {
    const metaKey = `json_db_meta:${empresaId}`;
    const metaRaw = localStorage.getItem(metaKey);
    const metaObj: Record<string, JsonTableMeta> = metaRaw ? JSON.parse(metaRaw) : {};
    
    metaObj[tableName] = {
      name: tableName,
      count: sanitizedRecords.length,
      lastUpdated: new Date().toISOString(),
      version: (metaObj[tableName]?.version || 0) + 1,
      sizeBytesEstimate: JSON.stringify(sanitizedRecords).length
    };

    localStorage.setItem(metaKey, JSON.stringify(metaObj));
  } catch (_) {}
}

/**
 * Lê uma tabela do JSON Database local sem fazer chamadas ao Firestore.
 */
export async function getJsonTable<T>(
  empresaId: string,
  tableName: string
): Promise<T[]> {
  const cacheKey = `json_db:${empresaId}:${tableName}`;
  const result = await getHybridCacheCollection<T>(cacheKey, true);
  return result?.data || [];
}

/**
 * Consulta registros na tabela JSON aplicando filtros e ordenação em memória.
 * 0 leituras no Firestore.
 */
export async function queryJsonTable<T>(
  empresaId: string,
  tableName: string,
  filterFn?: (item: T) => boolean,
  sortFn?: (a: T, b: T) => number,
  limit?: number
): Promise<T[]> {
  const all = await getJsonTable<T>(empresaId, tableName);
  let filtered = filterFn ? all.filter(filterFn) : all;
  if (sortFn) {
    filtered = [...filtered].sort(sortFn);
  }
  if (limit && limit > 0) {
    filtered = filtered.slice(0, limit);
  }
  return filtered;
}

/**
 * Atualiza ou insere um único documento na tabela JSON local.
 */
export async function upsertJsonRecord<T extends { id?: string | number; _docId?: string | number }>(
  empresaId: string,
  tableName: string,
  record: T
): Promise<void> {
  const current = await getJsonTable<T>(empresaId, tableName);
  const docId = record.id || record._docId;
  if (!docId) return;

  const sanitized = sanitizeData(record);
  const idx = current.findIndex(item => String(item.id || item._docId) === String(docId));
  if (idx >= 0) {
    current[idx] = { ...current[idx], ...sanitized };
  } else {
    current.push(sanitized);
  }

  await saveJsonTable(empresaId, tableName, current);
}

/**
 * Remove um documento da tabela JSON local.
 */
export async function deleteJsonRecord<T extends { id?: string | number; _docId?: string | number }>(
  empresaId: string,
  tableName: string,
  docId: string | number
): Promise<void> {
  const current = await getJsonTable<T>(empresaId, tableName);
  const filtered = current.filter(item => String(item.id || item._docId) !== String(docId));
  await saveJsonTable(empresaId, tableName, filtered);
}

/**
 * Exporta um Snapshot consolidado de todas as tabelas JSON para backup ou visualização.
 * Garante que nenhum dado sensível esteja presente (Item 21).
 */
export async function exportJsonDbSnapshot(empresaId: string): Promise<JsonDbSnapshot> {
  const metaKey = `json_db_meta:${empresaId}`;
  let tableNames: string[] = ['repack', 'despejo', 'quebras', 'validades', 'armazem', 'tarefas', 'acoes', 'dpo_audits'];
  
  try {
    const metaRaw = localStorage.getItem(metaKey);
    if (metaRaw) {
      const meta = JSON.parse(metaRaw);
      tableNames = Array.from(new Set([...tableNames, ...Object.keys(meta)]));
    }
  } catch (_) {}

  const tables: Record<string, any[]> = {};
  for (const t of tableNames) {
    const rawTable = await getJsonTable(empresaId, t);
    tables[t] = sanitizeData(rawTable);
  }

  return {
    empresaId,
    version: 1,
    exportedAt: new Date().toISOString(),
    tables
  };
}

/**
 * Importa um Snapshot JSON e recarrega todas as tabelas no cache local.
 */
export async function importJsonDbSnapshot(snapshot: JsonDbSnapshot): Promise<void> {
  if (!snapshot || !snapshot.tables || !snapshot.empresaId) return;
  for (const [tableName, records] of Object.entries(snapshot.tables)) {
    if (Array.isArray(records)) {
      await saveJsonTable(snapshot.empresaId, tableName, records);
    }
  }
}

/**
 * Retorna os metadados de armazenamento do JSON Database para auditoria/dashboard.
 */
export function getJsonDbMetadata(empresaId: string): Record<string, JsonTableMeta> {
  try {
    const metaKey = `json_db_meta:${empresaId}`;
    const raw = localStorage.getItem(metaKey);
    return raw ? JSON.parse(raw) : {};
  } catch (_) {
    return {};
  }
}
