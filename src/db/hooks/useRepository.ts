/**
 * REACT REPOSITORY HOOKS
 * 
 * Permite que componentes React consumam dados e executem mutações através da camada
 * de Repositório e Database Router, sem nunca importar métodos do SDK do Firestore.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { BaseRepository } from '../repositories/BaseRepository';
import { QueryOptions, PaginatedResult } from '../DatabaseRouter';

export interface UseRepositoryResult<T> {
  data: T[];
  loading: boolean;
  error: any;
  refetch: () => Promise<void>;
  create: (item: Omit<T, 'id' | '_docId'>, customDocId?: string) => Promise<T>;
  update: (id: string, partial: Partial<T>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  batchUpsert: (items: T[]) => Promise<void>;
}

export function useRepository<T extends { id?: string; _docId?: string }>(
  repository: BaseRepository<T>,
  empresaId = 'demo',
  options?: QueryOptions<T>
): UseRepositoryResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const items = await repository.getAll(empresaId, options);
      setData(items);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [repository, empresaId, JSON.stringify(options)]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const create = useCallback(
    async (item: Omit<T, 'id' | '_docId'>, customDocId?: string) => {
      const created = await repository.create(item, empresaId, customDocId);
      setData((prev) => [created, ...prev]);
      return created;
    },
    [repository, empresaId]
  );

  const update = useCallback(
    async (id: string, partial: Partial<T>) => {
      await repository.update(id, partial, empresaId);
      setData((prev) =>
        prev.map((item) => (item.id === id || item._docId === id ? { ...item, ...partial } : item))
      );
    },
    [repository, empresaId]
  );

  const remove = useCallback(
    async (id: string) => {
      await repository.delete(id, empresaId);
      setData((prev) => prev.filter((item) => item.id !== id && item._docId !== id));
    },
    [repository, empresaId]
  );

  const batchUpsert = useCallback(
    async (items: T[]) => {
      await repository.batchUpsert(items, empresaId);
      await fetchItems();
    },
    [repository, empresaId, fetchItems]
  );

  return {
    data,
    loading,
    error,
    refetch: fetchItems,
    create,
    update,
    remove,
    batchUpsert,
  };
}

export interface UsePaginatedRepositoryResult<T> {
  data: T[];
  loading: boolean;
  error: any;
  hasMore: boolean;
  hasPrev: boolean;
  pageIndex: number;
  pageSize: number;
  totalCount?: number;
  source?: 'json' | 'cache' | 'firestore';
  setPageSize: (size: number) => void;
  nextPage: () => Promise<void>;
  prevPage: () => Promise<void>;
  reset: () => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Hook para paginação nativa por cursores (limit, orderBy, startAfter).
 * ESTRITAMENTE SEM offset() e SEM baixar coleções inteiras.
 * Item 15 das Diretrizes.
 */
export function usePaginatedRepository<T extends { id?: string | number; _docId?: string | number }>(
  repository: BaseRepository<T>,
  empresaId = 'demo',
  options?: Omit<QueryOptions<T>, 'startAfterDoc' | 'startAfterValue' | 'pageSize'>,
  initialPageSize = 25
): UsePaginatedRepositoryResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);
  const [pageSize, setPageSizeState] = useState<number>(initialPageSize);
  const [pageIndex, setPageIndex] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [source, setSource] = useState<'json' | 'cache' | 'firestore' | undefined>(undefined);
  const [totalCount, setTotalCount] = useState<number | undefined>(undefined);

  // Histórico de cursores para navegação bidirecional rápida sem offset()
  // cursorStack[0] = null (página 1)
  // cursorStack[1] = cursor da página 1 (para abrir a página 2)
  const [cursorStack, setCursorStack] = useState<{ doc?: any; val?: any }[]>([{}]);

  const loadPage = useCallback(
    async (targetPageIndex: number, cursor?: { doc?: any; val?: any }, currentSize = pageSize) => {
      setLoading(true);
      try {
        const queryOpts: QueryOptions<T> = {
          ...options,
          pageSize: currentSize,
          startAfterDoc: cursor?.doc,
          startAfterValue: cursor?.val
        };

        const result: PaginatedResult<T> = await repository.getPaginated(empresaId, queryOpts);
        setData(result.items);
        setHasMore(result.hasMore);
        setSource(result.source);
        if (result.totalCount !== undefined) {
          setTotalCount(result.totalCount);
        }
        setError(null);
        setPageIndex(targetPageIndex);

        // Se houver próxima página, registra o cursor para o próximo nível
        if (result.hasMore && (result.lastVisibleDoc || result.lastVisibleValue !== undefined)) {
          setCursorStack((prev) => {
            const next = [...prev];
            next[targetPageIndex] = {
              doc: result.lastVisibleDoc,
              val: result.lastVisibleValue
            };
            return next;
          });
        }
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    },
    [repository, empresaId, pageSize, JSON.stringify(options)]
  );

  // Inicialização ou reset quando as opções / empresaId mudam
  useEffect(() => {
    setCursorStack([{}]);
    setPageIndex(1);
    loadPage(1, undefined, pageSize);
  }, [loadPage]);

  const nextPage = useCallback(async () => {
    if (!hasMore || loading) return;
    const nextCursor = cursorStack[pageIndex];
    await loadPage(pageIndex + 1, nextCursor, pageSize);
  }, [hasMore, loading, cursorStack, pageIndex, loadPage, pageSize]);

  const prevPage = useCallback(async () => {
    if (pageIndex <= 1 || loading) return;
    const prevCursor = cursorStack[pageIndex - 2];
    await loadPage(pageIndex - 1, prevCursor, pageSize);
  }, [pageIndex, loading, cursorStack, loadPage, pageSize]);

  const reset = useCallback(async () => {
    setCursorStack([{}]);
    await loadPage(1, undefined, pageSize);
  }, [loadPage, pageSize]);

  const setPageSize = useCallback(
    (newSize: number) => {
      setPageSizeState(newSize);
      setCursorStack([{}]);
      loadPage(1, undefined, newSize);
    },
    [loadPage]
  );

  const refetch = useCallback(async () => {
    const currentCursor = pageIndex > 1 ? cursorStack[pageIndex - 1] : undefined;
    await loadPage(pageIndex, currentCursor, pageSize);
  }, [loadPage, pageIndex, cursorStack, pageSize]);

  return {
    data,
    loading,
    error,
    hasMore,
    hasPrev: pageIndex > 1,
    pageIndex,
    pageSize,
    totalCount,
    source,
    setPageSize,
    nextPage,
    prevPage,
    reset,
    refetch
  };
}

/**
 * Hook para inscrição em tempo real em uma coleção através do Repository
 */
export function useRepositorySubscription<T extends { id?: string; _docId?: string }>(
  repository: BaseRepository<T>,
  empresaId = 'demo'
): { data: T[]; loading: boolean; error: any } {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = repository.subscribe(
      empresaId,
      (items) => {
        setData(items);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [repository, empresaId]);

  return { data, loading, error };
}
