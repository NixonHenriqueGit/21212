import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { syncIncremental } from '../utils/syncIncremental';
import { getHybridMetrics } from '../utils/hybridCacheService';
import { exportJsonDbSnapshot, importJsonDbSnapshot, getJsonDbMetadata, JsonDbSnapshot } from '../utils/hybridJsonDatabase';
import { triggerAutoSyncFromState } from '../services/bancoDadosSyncClient';
import {
  RepackRow,
  DespejoRow,
  QuebraRow,
  ValidadeRow,
  ArmazemRow,
  BlitzRefugoRow,
  Tarefa,
  ProdutoMaster,
  ColaboradorMaster,
  AcessoColaborador
} from '../types';
import { CustomKpiTree } from '../types/treeKpiTypes';

export interface EmpresaDataState {
  repack: RepackRow[];
  despejo: DespejoRow[];
  quebras: QuebraRow[];
  validades: ValidadeRow[];
  armazem: ArmazemRow[];
  blitz: BlitzRefugoRow[];
  tarefas: Tarefa[];
  usuarios: any[];
  acoes: any[];
  colaboradores: ColaboradorMaster[];
  produtos: ProdutoMaster[];
  dpoAudits: any[];
  repackValidades: any[];
  acessos: AcessoColaborador[];
  repackActionPlans: any[];
  repackA3Boards: any[];
  kpiTrees: CustomKpiTree[];
  loaded: boolean;
  viewUnitMode: 'R$' | 'HL';
}

const EMPTY_STATE: EmpresaDataState = {
  repack: [],
  despejo: [],
  quebras: [],
  validades: [],
  armazem: [],
  blitz: [],
  tarefas: [],
  usuarios: [],
  acoes: [],
  colaboradores: [],
  produtos: [],
  dpoAudits: [],
  repackValidades: [],
  acessos: [],
  repackActionPlans: [],
  repackA3Boards: [],
  kpiTrees: [],
  loaded: false,
  viewUnitMode: 'R$'
};

interface ContextValue extends EmpresaDataState {
  empresaId: string | null | undefined;
  setViewUnitMode: (mode: 'R$' | 'HL') => void;
  subscribeCollection: (nome: string, chave: keyof Omit<EmpresaDataState, 'loaded' | 'empresaId' | 'subscribeCollection' | 'viewUnitMode' | 'setViewUnitMode'>) => () => void;
  getHybridStats: () => ReturnType<typeof getHybridMetrics>;
  exportSnapshot: () => Promise<JsonDbSnapshot>;
  importSnapshot: (snapshot: JsonDbSnapshot) => Promise<void>;
  getJsonTablesMeta: () => ReturnType<typeof getJsonDbMetadata>;
}

const EmpresaDataContext = createContext<ContextValue>({
  ...EMPTY_STATE,
  empresaId: null,
  setViewUnitMode: () => {},
  subscribeCollection: () => () => {},
  getHybridStats: () => getHybridMetrics(),
  exportSnapshot: async () => ({ empresaId: 'demo', version: 1, exportedAt: '', tables: {} }),
  importSnapshot: async () => {},
  getJsonTablesMeta: () => ({})
});

// Mapeamento Nome da Coleção Firestore -> Chave no State
const COLLECTION_MAPPING: Record<string, keyof Omit<EmpresaDataState, 'loaded' | 'empresaId' | 'subscribeCollection' | 'viewUnitMode' | 'setViewUnitMode'>> = {
  repack: 'repack',
  despejo: 'despejo',
  quebras: 'quebras',
  validades: 'validades',
  armazem: 'armazem',
  blitz: 'blitz',
  blitz_refugo: 'blitz',
  tarefas: 'tarefas',
  usuarios: 'usuarios',
  acoes: 'acoes',
  colaboradores: 'colaboradores',
  produtos: 'produtos',
  dpoAudits: 'dpoAudits',
  dpo_audits: 'dpoAudits',
  repackValidades: 'repackValidades',
  repack_validades: 'repackValidades',
  acessos: 'acessos',
  repackActionPlans: 'repackActionPlans',
  repack_action_plans: 'repackActionPlans',
  repackA3Boards: 'repackA3Boards',
  repack_a3_boards: 'repackA3Boards',
  kpiTrees: 'kpiTrees',
  kpi_trees: 'kpiTrees',
};

export function EmpresaDataProvider({
  empresaId,
  children,
}: {
  empresaId: string | null | undefined;
  children: React.ReactNode;
}) {
  const [state, setState] = useState<EmpresaDataState>(EMPTY_STATE);
  const [viewUnitMode, setViewUnitModeState] = useState<'R$' | 'HL'>(() => {
    try {
      const saved = localStorage.getItem('af_global_view_unit');
      if (saved === 'HL' || saved === 'R$') return saved;
    } catch (e) {
      // ignore
    }
    return 'R$';
  });

  const setViewUnitMode = useCallback((mode: 'R$' | 'HL') => {
    setViewUnitModeState(mode);
    try {
      localStorage.setItem('af_global_view_unit', mode);
    } catch (e) {
      // ignore
    }
  }, []);

  const refCounts = useRef<Record<string, number>>({});
  const unsubs = useRef<Record<string, () => void>>({});
  const pendingUpdates = useRef<Record<string, any>>({});
  const updateTimeoutRef = useRef<any>(null);

  const applyPendingUpdates = useCallback(() => {
    if (Object.keys(pendingUpdates.current).length === 0) return;
    const batch = { ...pendingUpdates.current };
    pendingUpdates.current = {};
    setState((prev) => ({
      ...prev,
      ...batch,
      loaded: true,
    }));
  }, []);

  const scheduleStateUpdate = useCallback((chave: string, data: any) => {
    pendingUpdates.current[chave] = data;
    if (!updateTimeoutRef.current) {
      updateTimeoutRef.current = setTimeout(() => {
        updateTimeoutRef.current = null;
        applyPendingUpdates();
      }, 30);
    }
  }, [applyPendingUpdates]);

  useEffect(() => {
    // Reset state when empresaId changes or logs out
    setState(EMPTY_STATE);
    refCounts.current = {};
    pendingUpdates.current = {};
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = null;
    }
    Object.values(unsubs.current).forEach(unsub => {
      if (typeof unsub === 'function') unsub();
    });
    unsubs.current = {};
  }, [empresaId]);

  const subscribeCollection = useCallback(
    (nome: string, chave: keyof Omit<EmpresaDataState, 'loaded' | 'empresaId' | 'subscribeCollection' | 'viewUnitMode' | 'setViewUnitMode'>) => {
      if (!empresaId) return () => {};

      refCounts.current[nome] = (refCounts.current[nome] || 0) + 1;

      // Inicia a sincronização incremental se for a primeira subscrição ativa dessa coleção
      if (refCounts.current[nome] === 1 && !unsubs.current[nome]) {
        const cleanup = syncIncremental({
          collectionName: nome,
          empresaId,
          onData: (data) => {
            scheduleStateUpdate(chave as keyof EmpresaDataState, data);
          },
        });
        unsubs.current[nome] = cleanup;
      }

      return () => {
        refCounts.current[nome] = Math.max(0, (refCounts.current[nome] || 1) - 1);
        if (refCounts.current[nome] === 0 && unsubs.current[nome]) {
          unsubs.current[nome]();
          delete unsubs.current[nome];
        }
      };
    },
    [empresaId, scheduleStateUpdate]
  );

  const exportSnapshot = useCallback(async () => {
    return exportJsonDbSnapshot(empresaId || 'demo');
  }, [empresaId]);

  const importSnapshot = useCallback(async (snapshot: JsonDbSnapshot) => {
    await importJsonDbSnapshot(snapshot);
  }, []);

  const getJsonTablesMeta = useCallback(() => {
    return getJsonDbMetadata(empresaId || 'demo');
  }, [empresaId]);

  useEffect(() => {
    if (state.loaded && empresaId) {
      triggerAutoSyncFromState(state, empresaId, 10000);
    }
  }, [state, empresaId]);

  const contextValue = React.useMemo(() => ({
    ...state,
    empresaId,
    viewUnitMode,
    setViewUnitMode,
    subscribeCollection: subscribeCollection as any,
    getHybridStats: getHybridMetrics,
    exportSnapshot,
    importSnapshot,
    getJsonTablesMeta,
  }), [
    state,
    empresaId,
    viewUnitMode,
    setViewUnitMode,
    subscribeCollection,
    exportSnapshot,
    importSnapshot,
    getJsonTablesMeta,
  ]);

  return (
    <EmpresaDataContext.Provider value={contextValue}>
      {children}
    </EmpresaDataContext.Provider>
  );
}

export function useViewUnitMode() {
  const ctx = useContext(EmpresaDataContext);
  return {
    viewUnitMode: ctx.viewUnitMode,
    setViewUnitMode: ctx.setViewUnitMode,
  };
}

/**
 * Hook flexível com a fonte de dados da empresa logada.
 * Se collections for passado (ex: ['tarefas', 'colaboradores']), subscreve APENAS àquelas coleções.
 * Se collections for um array vazio ([]), não subscreve a nenhuma coleção (apenas acessa o estado/métodos).
 * Se collections for omitido, subscreve apenas às coleções essenciais por padrão para máxima performance.
 */
export function useEmpresaData(collections?: (keyof typeof COLLECTION_MAPPING)[]) {
  const ctx = useContext(EmpresaDataContext);
  const { subscribeCollection, empresaId } = ctx;

  const collectionsKey = collections !== undefined
    ? [...collections].sort().join(',')
    : 'DEFAULT';

  useEffect(() => {
    if (!empresaId) return;

    // Se passou array vazio [], não subscreve a nada
    if (collections !== undefined && collections.length === 0) {
      return;
    }

    let entriesToSubscribe: [string, keyof Omit<EmpresaDataState, 'loaded' | 'empresaId' | 'subscribeCollection' | 'viewUnitMode' | 'setViewUnitMode'>][] = [];

    if (collections && collections.length > 0) {
      entriesToSubscribe = collections
        .map(nome => [nome, COLLECTION_MAPPING[nome] || nome] as [string, keyof Omit<EmpresaDataState, 'loaded' | 'empresaId' | 'subscribeCollection' | 'viewUnitMode' | 'setViewUnitMode'>])
        .filter(([_, chave]) => Boolean(chave));
    } else {
      // Default: coleções essenciais leves
      const defaultEssentials: (keyof typeof COLLECTION_MAPPING)[] = ['produtos', 'colaboradores', 'acoes', 'validades', 'quebras'];
      entriesToSubscribe = defaultEssentials
        .map(nome => [nome, COLLECTION_MAPPING[nome] || nome] as [string, keyof Omit<EmpresaDataState, 'loaded' | 'empresaId' | 'subscribeCollection' | 'viewUnitMode' | 'setViewUnitMode'>])
        .filter(([_, chave]) => Boolean(chave));
    }

    const cleanups = entriesToSubscribe.map(([nome, chave]) =>
      subscribeCollection(nome, chave)
    );

    return () => {
      cleanups.forEach((c) => c());
    };
  }, [subscribeCollection, empresaId, collectionsKey]);

  return ctx;
}

/** Hooks Modulares por Domínio: Carregados sob demanda somente quando o painel correspondente é montado */

export function useRepackData() {
  const ctx = useContext(EmpresaDataContext);
  useEffect(() => {
    if (!ctx.empresaId) return;
    return ctx.subscribeCollection('repack', 'repack');
  }, [ctx.empresaId, ctx.subscribeCollection]);
  return ctx.repack;
}

export function useRepackValidadesData() {
  const ctx = useContext(EmpresaDataContext);
  useEffect(() => {
    if (!ctx.empresaId) return;
    return ctx.subscribeCollection('repack_validades', 'repackValidades');
  }, [ctx.empresaId, ctx.subscribeCollection]);
  return ctx.repackValidades;
}

export function useDespejoData() {
  const ctx = useContext(EmpresaDataContext);
  useEffect(() => {
    if (!ctx.empresaId) return;
    return ctx.subscribeCollection('despejo', 'despejo');
  }, [ctx.empresaId, ctx.subscribeCollection]);
  return ctx.despejo;
}

export function useQuebrasData() {
  const ctx = useContext(EmpresaDataContext);
  useEffect(() => {
    if (!ctx.empresaId) return;
    return ctx.subscribeCollection('quebras', 'quebras');
  }, [ctx.empresaId, ctx.subscribeCollection]);
  return ctx.quebras;
}

export function useKpiTreesData() {
  const ctx = useContext(EmpresaDataContext);
  useEffect(() => {
    if (!ctx.empresaId) return;
    return ctx.subscribeCollection('kpi_trees', 'kpiTrees');
  }, [ctx.empresaId, ctx.subscribeCollection]);
  return ctx.kpiTrees;
}

export function useValidadesData() {
  const ctx = useContext(EmpresaDataContext);
  useEffect(() => {
    if (!ctx.empresaId) return;
    return ctx.subscribeCollection('validades', 'validades');
  }, [ctx.empresaId, ctx.subscribeCollection]);
  return ctx.validades;
}

export function useArmazemData() {
  const ctx = useContext(EmpresaDataContext);
  useEffect(() => {
    if (!ctx.empresaId) return;
    return ctx.subscribeCollection('armazem', 'armazem');
  }, [ctx.empresaId, ctx.subscribeCollection]);
  return ctx.armazem;
}

export function useBlitzData() {
  const ctx = useContext(EmpresaDataContext);
  useEffect(() => {
    if (!ctx.empresaId) return;
    return ctx.subscribeCollection('blitz_refugo', 'blitz');
  }, [ctx.empresaId, ctx.subscribeCollection]);
  return ctx.blitz;
}

export function useTarefasData() {
  const ctx = useContext(EmpresaDataContext);
  useEffect(() => {
    if (!ctx.empresaId) return;
    return ctx.subscribeCollection('tarefas', 'tarefas');
  }, [ctx.empresaId, ctx.subscribeCollection]);
  return ctx.tarefas;
}

export function useAcoesData() {
  const ctx = useContext(EmpresaDataContext);
  useEffect(() => {
    if (!ctx.empresaId) return;
    return ctx.subscribeCollection('acoes', 'acoes');
  }, [ctx.empresaId, ctx.subscribeCollection]);
  return ctx.acoes;
}

export function useColaboradoresData() {
  const ctx = useContext(EmpresaDataContext);
  useEffect(() => {
    if (!ctx.empresaId) return;
    return ctx.subscribeCollection('colaboradores', 'colaboradores');
  }, [ctx.empresaId, ctx.subscribeCollection]);
  return ctx.colaboradores;
}

export function useDpoAuditsData() {
  const ctx = useContext(EmpresaDataContext);
  useEffect(() => {
    if (!ctx.empresaId) return;
    return ctx.subscribeCollection('dpo_audits', 'dpoAudits');
  }, [ctx.empresaId, ctx.subscribeCollection]);
  return ctx.dpoAudits;
}

export function useProdutosData() {
  const ctx = useContext(EmpresaDataContext);
  useEffect(() => {
    if (!ctx.empresaId) return;
    return ctx.subscribeCollection('produtos', 'produtos');
  }, [ctx.empresaId, ctx.subscribeCollection]);
  return ctx.produtos;
}

export function useAcessosData() {
  const ctx = useContext(EmpresaDataContext);
  useEffect(() => {
    if (!ctx.empresaId) return;
    return ctx.subscribeCollection('acessos', 'acessos');
  }, [ctx.empresaId, ctx.subscribeCollection]);
  return ctx.acessos;
}
