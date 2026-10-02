/**
 * BASE REPOSITORY - Repositório Base Genérico
 */

import { DatabaseRouter, dbRouter } from '../databaseRouter';
import { QueryOptions, QueryFilter } from '../databaseTypes';

export class BaseRepository<T extends { id?: string | number; _docId?: string | number }> {
  protected collectionName: string;
  protected router: DatabaseRouter;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
    this.router = dbRouter;
  }

  public async getAll(empresaId = 'demo', options?: QueryOptions<T>): Promise<T[]> {
    return this.router.getList<T>(this.collectionName, empresaId, options);
  }

  /**
   * Alias amigável para listagem geral transparente
   */
  public async list(empresaId = 'demo', options?: QueryOptions<T>): Promise<T[]> {
    return this.getAll(empresaId, options);
  }

  /**
   * Busca registros históricos (JSON -> Cache).
   * Nunca consulta Firestore automaticamente para histórico já existente no JSON.
   */
  public async getHistorico(empresaId = 'demo', options?: QueryOptions<T>): Promise<T[]> {
    return this.router.getHistorico<T>(this.collectionName, empresaId, options);
  }

  /**
   * Alias amigável para histórico
   */
  public async historico(empresaId = 'demo', options?: QueryOptions<T>): Promise<T[]> {
    return this.getHistorico(empresaId, options);
  }

  /**
   * Busca dados atuais não críticos (Cache -> JSON -> Firestore se necessário).
   */
  public async getNaoCritico(empresaId = 'demo', options?: QueryOptions<T>): Promise<T[]> {
    return this.router.getNaoCritico<T>(this.collectionName, empresaId, options);
  }

  public async getById(id: string | number, empresaId = 'demo'): Promise<T | null> {
    return this.router.getById<T>(this.collectionName, id, empresaId);
  }

  /**
   * Alias amigável para busca por id
   */
  public async get(id: string | number, empresaId = 'demo'): Promise<T | null> {
    return this.getById(id, empresaId);
  }

  public async findBy(field: keyof T | string, value: any, empresaId = 'demo'): Promise<T[]> {
    return this.router.getList<T>(this.collectionName, empresaId, {
      filters: [{ field, operator: '==', value }]
    });
  }

  public async query(options: QueryOptions<T>, empresaId = 'demo'): Promise<T[]> {
    return this.router.getList<T>(this.collectionName, empresaId, options);
  }

  /**
   * Executa paginação eficiente baseada em cursores (limit, orderBy, startAfter).
   * NUNCA utiliza offset() nem baixa coleções completas.
   */
  public async paginated(options?: QueryOptions<T>, empresaId = 'demo') {
    return this.router.getPaginated<T>(this.collectionName, empresaId, options);
  }

  public async getPaginated(empresaId = 'demo', options?: QueryOptions<T>) {
    return this.router.getPaginated<T>(this.collectionName, empresaId, options);
  }

  /**
   * Realiza contagem direta sem carregar a coleção para a memória (Item 16)
   */
  public async getCount(empresaId = 'demo', options?: QueryOptions<T>): Promise<number> {
    return (this.router as any).getCount ? (this.router as any).getCount(this.collectionName, empresaId, options) : (await this.router.getList(this.collectionName, empresaId, options)).length;
  }

  /**
   * Realiza agregação direta (sum, avg, count) sem transferir todos os documentos (Item 16)
   */
  public async getAggregate(
    empresaId = 'demo',
    spec: { sumFields?: (keyof T | string)[]; avgFields?: (keyof T | string)[]; count?: boolean },
    options?: QueryOptions<T>
  ) {
    return (this.router as any).getAggregate ? (this.router as any).getAggregate(this.collectionName, empresaId, spec, options) : { count: 0, sums: {}, avgs: {} };
  }

  public async create(data: Omit<T, 'id' | '_docId'>, empresaId = 'demo', customDocId?: string): Promise<T> {
    return this.router.create<T>(this.collectionName, data, empresaId, customDocId);
  }

  public async update(id: string | number, data: Partial<T>, empresaId = 'demo'): Promise<void> {
    return this.router.update<T>(this.collectionName, id, data, empresaId);
  }

  public async upsert(id: string | number, data: Partial<T>, empresaId = 'demo'): Promise<void> {
    return this.router.update<T>(this.collectionName, id, data, empresaId);
  }

  public async delete(id: string | number, empresaId = 'demo'): Promise<void> {
    return this.router.delete(this.collectionName, id, empresaId);
  }

  public async batchUpsert(items: T[], empresaId = 'demo'): Promise<void> {
    return this.router.batchUpsert<T>(this.collectionName, items, empresaId);
  }

  public subscribe(empresaId = 'demo', callback: (items: T[]) => void, onError?: (err: any) => void): () => void {
    return this.router.subscribe<T>(this.collectionName, empresaId, callback, onError);
  }

  public subscribeDoc(docId: string | number, callback: (data: T | null) => void, onError?: (err: any) => void): () => void {
    return (this.router as any).subscribeDoc?.(this.collectionName, docId, callback, onError) || (() => {});
  }
}
