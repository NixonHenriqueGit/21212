/**
 * HOOK USE REPOSITORY
 * 
 * Permite que componentes React consumam repositórios de dados com estado de loading,
 * cache automático e subscription em tempo real quando desejado.
 */

import { useState, useEffect, useCallback } from 'react';
import { BaseRepository } from '../database/repositories/baseRepository';
import { QueryOptions, PaginatedResult } from '../database/databaseTypes';

export function useRepository<T extends { id?: string | number; _docId?: string | number }>(
  repository: BaseRepository<T>,
  empresaId = 'demo',
  options?: QueryOptions<T>,
  enableRealtime = false
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
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
    reload();

    if (enableRealtime) {
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
    }
  }, [reload, enableRealtime]);

  return { data, loading, error, reload, repository };
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
  source?: 'json' | 'cache' | 'firestore' | 'cache-l1' | 'cache-l2';
  setPageSize: (size: number) => void;
  nextPage: () => Promise<void>;
  prevPage: () => Promise<void>;
  reset: () => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Hook de paginação nativa no Firestore (limit, orderBy, startAfter).
 * ESTRITAMENTE SEM offset() e SEM carregar a coleção inteira para a memória do React.
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
  const [source, setSource] = useState<'json' | 'cache' | 'firestore' | 'cache-l1' | 'cache-l2' | undefined>(undefined);
  const [totalCount, setTotalCount] = useState<number | undefined>(undefined);

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
