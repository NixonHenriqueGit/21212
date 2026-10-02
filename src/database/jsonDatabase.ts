/**
 * JSON DATABASE - Provedor JSON Estático / Local / Snapshot
 * 
 * Regra:
 * Os arquivos em `/public/banco-dados/` são estáticos e publicados para LEITURA.
 * O navegador NUNCA tenta modificar diretamente esses arquivos.
 * Modificações locais são salvas em IndexedDB/LocalStorage (JSON Store local),
 * e a publicação em `/public/` é realizada pelo Sync Service no backend.
 */

import {
  getJsonTable,
  saveJsonTable,
  upsertJsonRecord,
  deleteJsonRecord,
  queryJsonTable,
  exportJsonDbSnapshot,
  importJsonDbSnapshot,
  getJsonDbMetadata
} from '../utils/hybridJsonDatabase';
import { QueryOptions, QueryFilter } from './databaseTypes';
import { PublicBancoDadosReader } from '../services/publicBancoDadosReader';

export class JsonDatabase {
  private static instance: JsonDatabase;

  private constructor() {}

  public static getInstance(): JsonDatabase {
    if (!JsonDatabase.instance) {
      JsonDatabase.instance = new JsonDatabase();
    }
    return JsonDatabase.instance;
  }

  /**
   * Lê uma tabela do repositório local JSON ou tenta ler o arquivo estático público de fallback
   */
  public async getTable<T extends { id?: string | number; _docId?: string | number }>(
    collectionName: string,
    empresaId = 'demo',
    options?: QueryOptions<T>
  ): Promise<T[]> {
    // 1. Tentar ler do armazenamento JSON local
    let items = await getJsonTable<T>(empresaId, collectionName);

    // 2. Se vazio, tentar carregar dados do arquivo estático público correspondente
    if ((!items || items.length === 0) && (empresaId === 'demo' || !empresaId)) {
      const publicData = await this.fetchPublicFallback<T>(collectionName);
      if (publicData && publicData.length > 0) {
        items = publicData;
        await saveJsonTable(empresaId, collectionName, items as any);
      }
    }

    if (!items || items.length === 0) {
      return [];
    }

    // 3. Aplicar filtros e ordenação
    let filtered = [...items];
    if (options?.filters && options.filters.length > 0) {
      for (const filter of options.filters) {
        filtered = filtered.filter(item => {
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
      filtered.sort((a, b) => {
        const valA = (a as any)[field];
        const valB = (b as any)[field];
        if (valA < valB) return -1 * dir;
        if (valA > valB) return 1 * dir;
        return 0;
      });
    }

    if (options?.limitCount && options.limitCount > 0) {
      filtered = filtered.slice(0, options.limitCount);
    }

    return filtered;
  }

  public async getById<T extends { id?: string | number; _docId?: string | number; codigo?: number }>(
    collectionName: string,
    id: string | number,
    empresaId = 'demo'
  ): Promise<T | null> {
    // 1. Tenta buscar no banco JSON local já em memória / IndexedDB
    const items = await getJsonTable<T>(empresaId, collectionName);
    const existing = items.find(i => String(i.id || i._docId || (i as any).codigo) === String(id));
    if (existing) {
      return existing;
    }

    // 2. Consulta rápida no Índice de Particionamento (evita carregar tabelas gigantes)
    const partitionPath = await PublicBancoDadosReader.findPartitionPathForRecord(collectionName, id);
    if (partitionPath) {
      try {
        const fileContent = await PublicBancoDadosReader.fetchPartitionFile<any>(partitionPath);
        if (fileContent) {
          const list: T[] = Array.isArray(fileContent)
            ? fileContent
            : (fileContent.itens || fileContent.tarefas || fileContent.pedidos || fileContent.sensores || fileContent.desvios || []);

          const matched = list.find(i => String(i.id || i._docId || (i as any).codigo) === String(id));
          if (matched) {
            // Salva na tabela local para buscas instantâneas subsequentes
            await upsertJsonRecord(empresaId, collectionName, matched as any);
            return matched;
          }
        }
      } catch (err) {
        console.warn(`[JsonDb] Falha ao ler arquivo particionado ${partitionPath}:`, err);
      }
    }

    // 3. Fallback: Se não encontrou via índice específico, carrega a tabela pública do dia se vazia
    if (items.length === 0) {
      const fullTable = await this.getTable<T>(collectionName, empresaId);
      return fullTable.find(i => String(i.id || i._docId || (i as any).codigo) === String(id)) || null;
    }

    return null;
  }

  public async saveTable<T extends { id?: string | number; _docId?: string | number }>(
    collectionName: string,
    items: T[],
    empresaId = 'demo'
  ): Promise<void> {
    await saveJsonTable(empresaId, collectionName, items as any);
  }

  public async upsertRecord<T extends { id?: string | number; _docId?: string | number }>(
    collectionName: string,
    record: T,
    empresaId = 'demo'
  ): Promise<void> {
    await upsertJsonRecord(empresaId, collectionName, record as any);
  }

  public async deleteRecord(collectionName: string, id: string | number, empresaId = 'demo'): Promise<void> {
    await deleteJsonRecord(empresaId, collectionName, String(id));
  }

  public exportSnapshot(empresaId = 'demo') {
    return exportJsonDbSnapshot(empresaId);
  }

  public async importSnapshot(snapshot: any, empresaId = 'demo') {
    if (typeof snapshot === 'string') {
      try {
        const parsed = JSON.parse(snapshot);
        if (!parsed.empresaId) parsed.empresaId = empresaId;
        return importJsonDbSnapshot(parsed);
      } catch (e) {
        console.error("Erro ao importar snapshot JSON:", e);
        return;
      }
    }
    if (snapshot && !snapshot.empresaId) snapshot.empresaId = empresaId;
    return importJsonDbSnapshot(snapshot);
  }

  public getMetadata(empresaId = 'demo') {
    return getJsonDbMetadata(empresaId);
  }

  /**
   * Fallback de leitura segura do `/public/banco-dados/hoje/*.json`
   */
  private async fetchPublicFallback<T>(collectionName: string): Promise<T[] | null> {
    try {
      if (collectionName === 'armazem' || collectionName === 'estoque') {
        const est = await PublicBancoDadosReader.getEstoqueHoje();
        return (est?.itens as any) || null;
      }
      if (collectionName === 'tarefas' || collectionName === 'picking') {
        const pick = await PublicBancoDadosReader.getPickingHoje();
        return (pick?.tarefas as any) || null;
      }
      if (collectionName === 'pedidos') {
        const ped = await PublicBancoDadosReader.getPedidosHoje();
        return (ped?.pedidos as any) || null;
      }
      if (collectionName === 'validades' || collectionName === 'validade') {
        const val = await PublicBancoDadosReader.getValidadeHoje();
        return (val?.itens as any) || null;
      }
      if (collectionName === 'temperatura') {
        const temp = await PublicBancoDadosReader.getTemperaturaHoje();
        return (temp?.sensores as any) || null;
      }
      if (collectionName === 'desvios' || collectionName === 'quebras') {
        const desv = await PublicBancoDadosReader.getDesviosHoje();
        return (desv?.desvios as any) || null;
      }
      return null;
    } catch {
      return null;
    }
  }
}

export const jsonDb = JsonDatabase.getInstance();
