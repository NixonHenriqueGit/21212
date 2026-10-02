export interface MigrationEntry {
  id: string;
  ordemPrioridade: number;
  modulo: string;
  arquivo: string;
  componente: string;
  colecao: string;
  tipoAcesso: 'getDoc' | 'getDocs' | 'onSnapshot' | 'getPaginated' | 'getAggregate' | 'batchWrite';
  frequencia: 'Alta (Tempo Real / Render)' | 'Média (Troca de Rota / Filtro)' | 'Baixa (Ação do Usuário / Diário)';
  volumeEstimado: string;
  novoRepository: string;
  estrategiaOtimizacao: string;
  status: 'Migrado' | 'Em Andamento' | 'Planejado';
}

export const TABELA_MIGRACAO_FIRESTORE: MigrationEntry[] = [
  // 1. DASHBOARD (Consumo Mais Alto - Prioridade 1)
  {
    id: 'mig-01',
    ordemPrioridade: 1,
    modulo: 'Dashboard',
    arquivo: 'src/context/EmpresaDataContext.tsx',
    componente: 'EmpresaDataProvider / IndicadoresKPI',
    colecao: 'quebras, despejos, divergencias',
    tipoAcesso: 'getDocs',
    frequencia: 'Alta (Tempo Real / Render)',
    volumeEstimado: '~15.000 leituras/dia',
    novoRepository: 'QuebraRepository / DespejoRepository / DivergenciaRepository',
    estrategiaOtimizacao: 'Cache L1/L2 + Deduplicação In-Flight + Partição /hoje/',
    status: 'Migrado'
  },
  {
    id: 'mig-02',
    ordemPrioridade: 2,
    modulo: 'Dashboard',
    arquivo: 'src/components/MatrizEstrategica.tsx',
    componente: 'MatrizEstrategica / CrosstabMatrix',
    colecao: 'produtos, fechamentos',
    tipoAcesso: 'getDocs',
    frequencia: 'Alta (Tempo Real / Render)',
    volumeEstimado: '~8.000 leituras/dia',
    novoRepository: 'ProdutoRepository / FechamentoRepository',
    estrategiaOtimizacao: 'Agregação Server-Side (getAggregate) + Cache IndexedDB',
    status: 'Migrado'
  },

  // 2. ESTOQUE (Prioridade 2)
  {
    id: 'mig-03',
    ordemPrioridade: 3,
    modulo: 'Estoque',
    arquivo: 'src/utils/estoqueParsers.ts',
    componente: 'EstoqueAuditoria / ImportacaoEstoque',
    colecao: 'produtos, estoque_snapshot',
    tipoAcesso: 'getDocs',
    frequencia: 'Alta (Tempo Real / Render)',
    volumeEstimado: '~12.000 leituras/dia',
    novoRepository: 'ProdutoRepository',
    estrategiaOtimizacao: 'JSON Local /hoje/produtos.json + Deduplicação de SKU',
    status: 'Migrado'
  },
  {
    id: 'mig-04',
    ordemPrioridade: 4,
    modulo: 'Estoque',
    arquivo: 'src/components/CadastrosPanel.tsx',
    componente: 'CadastrosPanel (Master Produtos)',
    colecao: 'produtos',
    tipoAcesso: 'getPaginated',
    frequencia: 'Média (Troca de Rota / Filtro)',
    volumeEstimado: '~5.000 leituras/dia',
    novoRepository: 'ProdutoRepository.getPaginated()',
    estrategiaOtimizacao: 'Paginação por Cursor Nativo (limit + startAfter, sem offset)',
    status: 'Migrado'
  },

  // 3. PICKING / MONTAGEM (Prioridade 3)
  {
    id: 'mig-05',
    ordemPrioridade: 5,
    modulo: 'Picking',
    arquivo: 'src/utils/jornadaUtils.ts',
    componente: 'WlpMontagem / JornadaColaborador',
    colecao: 'wlp_montagens, jornadas_colaboradores',
    tipoAcesso: 'getDocs',
    frequencia: 'Alta (Tempo Real / Render)',
    volumeEstimado: '~9.000 leituras/dia',
    novoRepository: 'JornadaRepository / MontagemRepository',
    estrategiaOtimizacao: 'SyncIncremental com Listener Pooling e Fallback JSON',
    status: 'Migrado'
  },
  {
    id: 'mig-06',
    ordemPrioridade: 6,
    modulo: 'Picking',
    arquivo: 'src/aferimento/AferimentoModule.tsx',
    componente: 'AferimentoModule / RotasAferidas',
    colecao: 'af_rotas, af_pesagens',
    tipoAcesso: 'onSnapshot',
    frequencia: 'Alta (Tempo Real / Render)',
    volumeEstimado: '~7.500 leituras/dia',
    novoRepository: 'AferimentoRotaDbRepository.subscribeDoc()',
    estrategiaOtimizacao: 'Listener Pooling com Contagem de Referências e Cleanup no Desmonte',
    status: 'Migrado'
  },

  // 4. VALIDADE / DESVIOS E GATILHOS (Prioridade 4)
  {
    id: 'mig-07',
    ordemPrioridade: 7,
    modulo: 'Validade',
    arquivo: 'src/utils/desviosEMelhoriasService.ts',
    componente: 'DesviosEMelhorias / PlanosAcao',
    colecao: 'acoes_desvios_gatilhos, acoes_melhoria_tor',
    tipoAcesso: 'getDocs',
    frequencia: 'Média (Troca de Rota / Filtro)',
    volumeEstimado: '~4.000 leituras/dia',
    novoRepository: 'DesviosGatilhosDbRepository / AcoesMelhoriaDbRepository',
    estrategiaOtimizacao: 'Cache Híbrido TTL 30min + getPaginated por data',
    status: 'Migrado'
  },

  // 5. PEDIDOS / FATURAMENTO (Prioridade 5)
  {
    id: 'mig-08',
    ordemPrioridade: 8,
    modulo: 'Pedidos',
    arquivo: 'src/utils/jornadaUtils.ts',
    componente: 'DailyFaturados / ResumoFaturamento',
    colecao: 'wlp_daily_faturados',
    tipoAcesso: 'getDocs',
    frequencia: 'Média (Troca de Rota / Filtro)',
    volumeEstimado: '~6.000 leituras/dia',
    novoRepository: 'FaturamentoDbRepository',
    estrategiaOtimizacao: 'Agregação Server-Side (sum/count) + Partição Diária',
    status: 'Migrado'
  },

  // 6. HISTÓRICO E FECHAMENTOS (Prioridade 6)
  {
    id: 'mig-09',
    ordemPrioridade: 9,
    modulo: 'Histórico',
    arquivo: 'src/database/fechamentoService.ts',
    componente: 'FechamentoDiario / AuditoriaHistorico',
    colecao: 'fechamentos, auditorias',
    tipoAcesso: 'getDocs',
    frequencia: 'Baixa (Ação do Usuário / Diário)',
    volumeEstimado: '~3.000 leituras/dia',
    novoRepository: 'FechamentoRepository / AuditoriaRepository',
    estrategiaOtimizacao: 'Consulta Direta ao Diretório JSON /historico/YYYY/MM/DD/ (Zero Firestore)',
    status: 'Migrado'
  },

  // 7. RELATÓRIOS E MATRIZES (Prioridade 7)
  {
    id: 'mig-10',
    ordemPrioridade: 10,
    modulo: 'Relatórios',
    arquivo: 'src/components/CrosstabMatrix.tsx',
    componente: 'CrosstabMatrix / RelatorioGeral',
    colecao: 'quebras, divergencias, despejos',
    tipoAcesso: 'getAggregate',
    frequencia: 'Baixa (Ação do Usuário / Diário)',
    volumeEstimado: '~2.500 leituras/dia',
    novoRepository: 'DatabaseRouter.getAggregate()',
    estrategiaOtimizacao: 'Server-Side Aggregate (Sum/Count/Avg) sem download de docs brutos',
    status: 'Migrado'
  },

  // 8. DEMAIS MÓDULOS (5S, Cadastros Gerais - Prioridade 8)
  {
    id: 'mig-11',
    ordemPrioridade: 11,
    modulo: 'Demais Módulos',
    arquivo: 'src/utils/fiveSStore.ts',
    componente: 'FiveSAudits / Programa5S',
    colecao: 'af_5s_audits',
    tipoAcesso: 'getDocs',
    frequencia: 'Baixa (Ação do Usuário / Diário)',
    volumeEstimado: '~1.200 leituras/dia',
    novoRepository: 'Auditoria5sDbRepository',
    estrategiaOtimizacao: 'Cache L2 Local + SyncIncremental',
    status: 'Migrado'
  },
  {
    id: 'mig-12',
    ordemPrioridade: 12,
    modulo: 'Demais Módulos',
    arquivo: 'src/components/CadastrosPanel.tsx',
    componente: 'CadastrosPanel (Master Colaboradores)',
    colecao: 'colaboradores',
    tipoAcesso: 'getPaginated',
    frequencia: 'Média (Troca de Rota / Filtro)',
    volumeEstimado: '~1.800 leituras/dia',
    novoRepository: 'ColaboradorRepository.getPaginated()',
    estrategiaOtimizacao: 'Paginação por Cursor Nativo com Índices Compostos',
    status: 'Migrado'
  }
];
