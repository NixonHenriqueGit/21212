/**
 * CLASSIFICAÇÃO DE REALTIME POR ENTIDADE / COLEÇÃO
 * 
 * Classifica cada listener / coleção conforme as diretrizes operacionais:
 * 
 * 1. REALTIME NECESSÁRIO:
 *    - Monitoramento operacional ativo de pista e docas (efc_efd_vehicles, veiculos_doca, patio);
 *    - Fila de separação e tarefas de picking em andamento (tarefas, picking);
 *    - Desvios críticos e planos de contenção imediata D0/P1 (acoes, desvios);
 *    - Telemetria térmica de câmaras frias e sensores de choque (temperatura, sensores).
 *    -> UTILIZA onSnapshot() com debounce e escopo estrito.
 * 
 * 2. REALTIME OPCIONAL:
 *    - Status de colaboradores ativos no turno (colaboradores);
 *    - Gestão de acessos e permissões (acessos);
 *    - Inspeções periódicas de refugo (blitz_refugo).
 *    -> Podem operar com polling / cache e suporte a listener se explicitamente habilitado.
 * 
 * 3. NÃO PRECISA DE REALTIME:
 *    - Histórico e fechamentos diários (historico, fechamento, fechamentos_log);
 *    - Relatórios e indicadores consolidados (relatorios, indicadores, dashboard);
 *    - Cadastro estático de SKUs, preços e embalagens (produtos, catalogo);
 *    - Auditorias e notas DPO passadas (dpo_audits, auditorias);
 *    - Lançamentos consolidados de retrabalho e descarte (repack, despejo, quebras);
 *    - Controle diário de shelf life / FEFO (validades, fefo);
 *    - Endereçamento e layout físico de armazém (armazem).
 *    -> NUNCA UTILIZA onSnapshot() - utiliza consultas pontuais (Cache -> JSON -> Fetch único).
 */

export type RealtimeLevel = 'REALTIME_NECESSARIO' | 'REALTIME_OPCIONAL' | 'NAO_PRECISA_REALTIME';

export interface RealtimeClassificationInfo {
  nivel: RealtimeLevel;
  justificativa: string;
  estrategia: 'onSnapshot' | 'fetch-unico' | 'cache-json';
}

export const REALTIME_CLASSIFICATION: Record<string, RealtimeClassificationInfo> = {
  // REALTIME NECESSÁRIO
  'efc_efd_vehicles': {
    nivel: 'REALTIME_NECESSARIO',
    justificativa: 'Status de veículos nas docas e pátio em movimentação física contínua.',
    estrategia: 'onSnapshot'
  },
  'veiculos_doca': {
    nivel: 'REALTIME_NECESSARIO',
    justificativa: 'Ocupação de docas e gates operacionais de expedição.',
    estrategia: 'onSnapshot'
  },
  'patio': {
    nivel: 'REALTIME_NECESSARIO',
    justificativa: 'Fila de caminhões no pátio e tempos de espera.',
    estrategia: 'onSnapshot'
  },
  'tarefas': {
    nivel: 'REALTIME_NECESSARIO',
    justificativa: 'Distribuição de ordens de separação e picking em tempo real para operadores.',
    estrategia: 'onSnapshot'
  },
  'picking': {
    nivel: 'REALTIME_NECESSARIO',
    justificativa: 'Andamento de separação de paletes e caixas por box/doca.',
    estrategia: 'onSnapshot'
  },
  'acoes': {
    nivel: 'REALTIME_NECESSARIO',
    justificativa: 'Alertas operacionais críticos P1 e planos de ação com resposta imediata.',
    estrategia: 'onSnapshot'
  },
  'desvios': {
    nivel: 'REALTIME_NECESSARIO',
    justificativa: 'Disparos de contenção imediata D0 por estouro de indicadores.',
    estrategia: 'onSnapshot'
  },
  'temperatura': {
    nivel: 'REALTIME_NECESSARIO',
    justificativa: 'Telemetria térmica de câmaras frias para prevenção de perda de produto.',
    estrategia: 'onSnapshot'
  },
  'sensores': {
    nivel: 'REALTIME_NECESSARIO',
    justificativa: 'Alertas de temperatura e umidade em tempo real.',
    estrategia: 'onSnapshot'
  },
  'validades': {
    nivel: 'REALTIME_NECESSARIO',
    justificativa: 'Controle colaborativo de validades, lotes e estoque FEFO em tempo real entre colaboradores e gestores.',
    estrategia: 'onSnapshot'
  },
  'fefo_cloud_adjustments': {
    nivel: 'REALTIME_NECESSARIO',
    justificativa: 'Sincronização instantânea de recontagens e alterações definitivas de quantidade entre múltiplos colaboradores.',
    estrategia: 'onSnapshot'
  },
  'validades_config': {
    nivel: 'REALTIME_NECESSARIO',
    justificativa: 'Seleção colaborativa global da coleta de validades ativa entre todos os terminais em tempo real.',
    estrategia: 'onSnapshot'
  },
  'validades_historico_exclusoes': {
    nivel: 'REALTIME_NECESSARIO',
    justificativa: 'Histórico compartilhado em tempo real de exclusões para auditoria e restauração colaborativa imediata.',
    estrategia: 'onSnapshot'
  },
  'fefo': {
    nivel: 'REALTIME_NECESSARIO',
    justificativa: 'Projeções e giros FEFO colaborativos em tempo real.',
    estrategia: 'onSnapshot'
  },

  // REALTIME OPCIONAL
  'colaboradores': {
    nivel: 'REALTIME_OPCIONAL',
    justificativa: 'Quadro de colaboradores ativos no turno (raras alterações intra-turno).',
    estrategia: 'fetch-unico'
  },
  'acessos': {
    nivel: 'REALTIME_OPCIONAL',
    justificativa: 'Permissões de perfis de usuário da unidade.',
    estrategia: 'fetch-unico'
  },
  'blitz_refugo': {
    nivel: 'REALTIME_OPCIONAL',
    justificativa: 'Inspeções de refugo realizadas em momentos pontuais do turno.',
    estrategia: 'fetch-unico'
  },

  // NÃO PRECISA DE REALTIME
  'produtos': {
    nivel: 'NAO_PRECISA_REALTIME',
    justificativa: 'Cadastro mestre de produtos e SKUs (estático / catálogo).',
    estrategia: 'cache-json'
  },
  'catalogo': {
    nivel: 'NAO_PRECISA_REALTIME',
    justificativa: 'Catálogo de itens e dimensões de paletização.',
    estrategia: 'cache-json'
  },
  'dpo_audits': {
    nivel: 'NAO_PRECISA_REALTIME',
    justificativa: 'Auditorias e checklists DPO consolidados periodicamente.',
    estrategia: 'cache-json'
  },
  'auditorias': {
    nivel: 'NAO_PRECISA_REALTIME',
    justificativa: 'Relatórios de conformidade e notas históricas.',
    estrategia: 'cache-json'
  },
  'repack': {
    nivel: 'NAO_PRECISA_REALTIME',
    justificativa: 'Apuração e consolidação de perdas de retrabalho por lote/dia.',
    estrategia: 'cache-json'
  },
  'despejo': {
    nivel: 'NAO_PRECISA_REALTIME',
    justificativa: 'Registros contábeis de descarte e quebra de estoque.',
    estrategia: 'cache-json'
  },
  'quebras': {
    nivel: 'NAO_PRECISA_REALTIME',
    justificativa: 'Indicadores agregados de quebra diária/mensal.',
    estrategia: 'cache-json'
  },
  'armazem': {
    nivel: 'NAO_PRECISA_REALTIME',
    justificativa: 'Mapeamento de ruas, níveis e layout físico do depósito.',
    estrategia: 'cache-json'
  },
  'fechamento': {
    nivel: 'NAO_PRECISA_REALTIME',
    justificativa: 'Projeção imutável de fechamentos diários consolidados.',
    estrategia: 'cache-json'
  },
  'historico': {
    nivel: 'NAO_PRECISA_REALTIME',
    justificativa: 'Registros de datas anteriores armazenados em JSON particionado.',
    estrategia: 'cache-json'
  },
  'fechamentos_log': {
    nivel: 'NAO_PRECISA_REALTIME',
    justificativa: 'Audit trail histórico de fechamentos operacionais.',
    estrategia: 'cache-json'
  },
  'relatorios': {
    nivel: 'NAO_PRECISA_REALTIME',
    justificativa: 'Consultas analíticas e relatórios gerenciais.',
    estrategia: 'cache-json'
  },
  'indicadores': {
    nivel: 'NAO_PRECISA_REALTIME',
    justificativa: 'KPIs acumulados do dia/mês.',
    estrategia: 'cache-json'
  },
  'dashboard': {
    nivel: 'NAO_PRECISA_REALTIME',
    justificativa: 'Visão consolidada executiva do dia.',
    estrategia: 'cache-json'
  }
};

export function getRealtimeInfo(collectionName: string): RealtimeClassificationInfo {
  const norm = collectionName.toLowerCase().trim();
  return REALTIME_CLASSIFICATION[norm] || {
    nivel: 'NAO_PRECISA_REALTIME',
    justificativa: 'Coleção padrão não cadastrada como realtime crítico.',
    estrategia: 'cache-json'
  };
}

export function isRealtimeNecessario(collectionName: string): boolean {
  return getRealtimeInfo(collectionName).nivel === 'REALTIME_NECESSARIO';
}

export function isRealtimePermitido(collectionName: string, forceRealtime = false): boolean {
  if (forceRealtime) return true;
  const info = getRealtimeInfo(collectionName);
  return info.nivel === 'REALTIME_NECESSARIO';
}
