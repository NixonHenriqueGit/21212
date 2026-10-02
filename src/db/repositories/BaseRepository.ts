/**
 * BASE REPOSITORY - Camada de Repositório
 * 
 * Encapsula todas as operações de banco de dados para uma coleção específica.
 * Componentes React devem SEMPRE usar Repositories ou Hooks de repositório.
 */

import { DatabaseRouter, dbRouter, QueryOptions, QueryFilter, PaginatedResult } from '../DatabaseRouter';

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
   * Executa busca paginada com cursores nativos (limit, orderBy, startAfter).
   * ESTRITAMENTE SEM offset() e SEM carregar a coleção inteira.
   */
  public async getPaginated(empresaId = 'demo', options?: QueryOptions<T>): Promise<PaginatedResult<T>> {
    return this.router.getPaginated<T>(this.collectionName, empresaId, options);
  }

  /**
   * Realiza contagem direta sem carregar a coleção (Item 16 - Agregação count)
   */
  public async getCount(empresaId = 'demo', options?: QueryOptions<T>): Promise<number> {
    return this.router.getCount<T>(this.collectionName, empresaId, options);
  }

  /**
   * Realiza agregação direta (sum, avg, count) sem transferir todos os documentos (Item 16)
   */
  public async getAggregate(
    empresaId = 'demo',
    spec: { sumFields?: (keyof T | string)[]; avgFields?: (keyof T | string)[]; count?: boolean },
    options?: QueryOptions<T>
  ): Promise<{ count?: number; sums?: Record<string, number>; avgs?: Record<string, number> }> {
    return this.router.getAggregate<T>(this.collectionName, empresaId, spec, options);
  }

  public async getById(id: string | number, empresaId = 'demo'): Promise<T | null> {
    return this.router.getById<T>(this.collectionName, id, empresaId);
  }

  public async findBy(field: keyof T | string, value: any, empresaId = 'demo'): Promise<T[]> {
    return this.router.getList<T>(this.collectionName, empresaId, {
      filters: [{ field, operator: '==', value }]
    });
  }

  public async query(options: QueryOptions<T>, empresaId = 'demo'): Promise<T[]> {
    return this.router.getList<T>(this.collectionName, empresaId, options);
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
    return this.router.subscribeDoc<T>(this.collectionName, docId, callback, onError);
  }
}
