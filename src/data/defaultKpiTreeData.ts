import { CustomKpiTree } from '../types/treeKpiTypes';

export const DEFAULT_OFFICIAL_KPI_TREE: CustomKpiTree = {
  id: 'tree-kpi-personalizada',
  name: 'Árvore de KPI',
  title: 'ÁRVORE DE KPI',
  subtitle: 'Visão hierárquica de indicadores de desempenho',
  badgeText: '7 NÍVEIS',
  unitName: 'unidades',
  currencySymbol: 'R$',
  totalValue: 0,
  totalVolume: 0,
  totalRegistros: 0,
  ticketMedio: 0,
  summaryTag: 'Estrutura personalizada ativa.',
  criticalHighlight: '',
  levels: {
    level1Title: 'PRODUTIVIDADE',
    level1Badge: 'RAIZ',
    level2Title: 'CATEGORIAS',
    level2Badge: '3 CARDS',
    level3Title: 'SUB-RAMOS',
    level3Badge: 'CARDS',
    level4Title: 'SEGMENTOS',
    level4Badge: 'CARDS',
    level5Title: 'DETALHAMENTO',
    level5Badge: 'CARDS',
    level6Title: 'OPERAÇÃO',
    level6Badge: 'CARDS',
    level7Title: 'ITENS / SKUS',
    level7Badge: 'ITENS',
  },
  nodes: {
    level1: {
      id: 'root',
      label: 'PRODUTIVIDADE',
      sublabel: '',
      value: 0,
      volume: 0,
      badge: '0 Lançamentos',
      metaInfo: 'Estrutura personalizada ativa.',
      iconName: 'bar-chart',
    },
    level2: [
      {
        id: 'cat-operacao',
        label: '1. PILAR 1: OPERAÇÃO',
        value: 0,
        volume: 0,
        percentage: 0,
        iconName: 'building',
        metaInfo: 'Dados Operacionais'
      },
      {
        id: 'cat-estoque',
        label: '2. ESTOQUE',
        value: 0,
        volume: 0,
        percentage: 0,
        iconName: 'box',
        metaInfo: 'Dados Operacionais'
      },
      {
        id: 'cat-gente-cultura',
        label: '3. GENTE E CULTURA',
        value: 0,
        volume: 0,
        percentage: 0,
        iconName: 'users',
        metaInfo: 'Dados Operacionais'
      }
    ],
    level3: {
      'cat-operacao': [
        {
          id: 'sub-op-produtividade',
          label: '[IC] PRODUTIVIDADE & WLP',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'trending-up',
          metaInfo: 'Eficiência e Produtividade DPO'
        },
        {
          id: 'sub-op-tempo-ciclo',
          label: '[IC] TEMPO DE CICLO & TMR',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'clock',
          metaInfo: 'Tempos de Carga e Descarga'
        },
        {
          id: 'sub-op-perdas',
          label: '[IC] PERDAS & QUEBRAS',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'alert-triangle',
          metaInfo: 'Avarias internas e Repack'
        }
      ],
      'cat-estoque': [
        {
          id: 'sub-est-acuracidade',
          label: '[IC] ACURACIDADE DE INVENTÁRIO',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'check-circle',
          metaInfo: 'EFC & EFD de Estoque'
        },
        {
          id: 'sub-est-validade',
          label: '[IC] FEFO & VALIDADE CRÍTICA',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'calendar',
          metaInfo: 'Trava de validade e lotes'
        },
        {
          id: 'sub-est-cobertura',
          label: '[IC] POLÍTICA DE COBERTURA (6 DIAS)',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'layers',
          metaInfo: 'Diretriz DPO & Capacidade'
        }
      ],
      'cat-gente-cultura': [
        {
          id: 'sub-engagement',
          label: '[IC] ENGAGEMENT',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'users',
          metaInfo: 'Detalhamento do sub-ramo'
        },
        {
          id: 'sub-tri-lti',
          label: '[IC] SEGURANÇA & TRI / LTI',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'shield',
          metaInfo: 'Indicadores de Segurança'
        }
      ]
    },
    level4: {
      'sub-op-produtividade': [
        {
          id: 'seg-op-wlp',
          label: '[IV] WLP (HL / HH)',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'trending-up',
          metaInfo: 'Índice de Produtividade HL/HH'
        },
        {
          id: 'seg-op-picking',
          label: '[IV] PRODUTIVIDADE PICKING',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'box',
          metaInfo: 'Caixas / hora no picking'
        }
      ],
      'sub-op-tempo-ciclo': [
        {
          id: 'seg-op-tmr-descarga',
          label: '[IV] TMR DESCARGA (FÁBRICA)',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'truck',
          metaInfo: 'Tempo Médio de Recebimento'
        },
        {
          id: 'seg-op-tmr-carregamento',
          label: '[IV] TMR EXPEDIÇÃO (ROTA)',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'truck',
          metaInfo: 'Tempo de Carregamento Rota'
        }
      ],
      'sub-op-perdas': [
        {
          id: 'seg-op-avarias',
          label: '[IV] AVARIAS & QUEBRAS INTERNAS',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'alert-circle',
          metaInfo: 'Perdas em movimentação'
        },
        {
          id: 'seg-op-repack',
          label: '[IV] RECUPERAÇÃO NO REPACK',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'refresh-cw',
          metaInfo: 'Reembalagem de Avarias'
        }
      ],
      'sub-est-acuracidade': [
        {
          id: 'seg-est-efc-geral',
          label: '[IV] EFC (EFICIÊNCIA FÍSICA)',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'check-square',
          metaInfo: 'Conformidade física de posições'
        },
        {
          id: 'seg-est-efd-diferenca',
          label: '[IV] EFD (DIVERGÊNCIA R$)',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'dollar-sign',
          metaInfo: 'Impacto financeiro de quebras'
        }
      ],
      'sub-est-validade': [
        {
          id: 'seg-est-fefo-trava',
          label: '[IV] TRAVAS AUTOMÁTICAS FEFO',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'alert-triangle',
          metaInfo: 'Bloqueios de lote por tolerância'
        },
        {
          id: 'seg-est-fefo-risco',
          label: '[IV] CRÍTICOS < 30 DIAS',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'clock',
          metaInfo: 'Lotes em risco de perda'
        }
      ],
      'sub-est-cobertura': [
        {
          id: 'seg-est-dias-cobertura',
          label: '[IV] DIAS DE ESTOQUE DPO',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'bar-chart',
          metaInfo: 'Meta de 6 dias DPO'
        },
        {
          id: 'seg-est-capacidade-bloco',
          label: '[IV] OCUPAÇÃO DE PALETES',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'layers',
          metaInfo: 'Capacidade física (967 PL)'
        }
      ],
      'sub-engagement': [
        {
          id: 'seg-absentismo',
          label: '[IV] ABSENTISMO',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'user-x',
          metaInfo: 'Agrupamento operacional'
        },
        {
          id: 'seg-aderencia',
          label: '[IV] ADERÊNCIA À JORNADA',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'user-check',
          metaInfo: 'Agrupamento operacional'
        }
      ],
      'sub-tri-lti': [
        {
          id: 'seg-seguranca-incidentes',
          label: '[IV] QUASE ACIDENTES & DDS',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'shield',
          metaInfo: 'Auditorias e Prevenção'
        },
        {
          id: 'seg-seguranca-epi',
          label: '[IV] ADERÊNCIA AO USO DE EPI',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'check-circle',
          metaInfo: 'Conformidade de segurança'
        }
      ]
    },
    level5: {
      'seg-op-wlp': [
        {
          id: 'det-op-separacao',
          label: 'SEPARAÇÃO / CONFERÊNCIA',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'box',
          metaInfo: 'Etapa de separação de pedidos'
        },
        {
          id: 'det-op-movimentacao',
          label: 'MOVIMENTAÇÃO INTERNA',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'truck',
          metaInfo: 'Abastecimento de picking'
        }
      ],
      'seg-op-picking': [
        {
          id: 'det-op-picking-linhas',
          label: 'LINHAS SEPARADAS / H',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'layers',
          metaInfo: 'Produtividade por hora'
        },
        {
          id: 'det-op-picking-caixas',
          label: 'CAIXAS COLETADAS',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'package',
          metaInfo: 'Volume de caixas conferidas'
        }
      ],
      'seg-op-tmr-descarga': [
        {
          id: 'det-op-tmr-caminhoes',
          label: 'DESCARGA CARRETAS FÁBRICA',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'truck',
          metaInfo: 'Tempo médio de descarga'
        },
        {
          id: 'det-op-conferencia-paletes',
          label: 'CONFERÊNCIA FÍSICA / NFE',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'check-square',
          metaInfo: 'Validação de entrada'
        }
      ],
      'seg-op-tmr-carregamento': [
        {
          id: 'det-op-tmr-rota',
          label: 'CARREGAMENTO CAMINHÕES ROTA',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'truck',
          metaInfo: 'Tempo médio de carregamento'
        },
        {
          id: 'det-op-staging',
          label: 'MONTAGEM DE PALETES STAGING',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'layers',
          metaInfo: 'Pré-carregamento de rotas'
        }
      ],
      'seg-op-avarias': [
        {
          id: 'det-op-quebras-movimentacao',
          label: 'QUEBRAS EM MOVIMENTAÇÃO',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'alert-circle',
          metaInfo: 'Avarias no transporte interno'
        },
        {
          id: 'det-op-avarias-picking',
          label: 'AVARIAS NA SEPARAÇÃO',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'package-x',
          metaInfo: 'Quebras na montagem de cargas'
        }
      ],
      'seg-op-repack': [
        {
          id: 'det-op-recuperacao-latas',
          label: 'REEMBALAGEM DE LATAS',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'refresh-cw',
          metaInfo: 'Recuperação de packs avariados'
        },
        {
          id: 'det-op-recuperacao-garrafas',
          label: 'REEMBALAGEM DE GARRAFAS',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'refresh-cw',
          metaInfo: 'Recuperação de caixas e garrafas'
        }
      ],
      'seg-est-efc-geral': [
        {
          id: 'det-est-armazem-central',
          label: 'ARMAZÉM CENTRAL (BLOCOS A/B/C)',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'building',
          metaInfo: 'Contagem das posições pulmão'
        },
        {
          id: 'det-est-picking-pos',
          label: 'POSIÇÕES DE PICKING',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'grid',
          metaInfo: 'Contagem da área de picking'
        }
      ],
      'seg-est-efd-diferenca': [
        {
          id: 'det-est-divergencia-valor',
          label: 'DIVERGÊNCIA FINANCEIRA DE INVENTÁRIO',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'dollar-sign',
          metaInfo: 'Impacto contábil de perdas'
        },
        {
          id: 'det-est-ajustes-contabeis',
          label: 'AJUSTES DE ENTRADA E SAÍDA',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'file-text',
          metaInfo: 'Ajustes no WMS'
        }
      ],
      'seg-est-fefo-trava': [
        {
          id: 'det-est-fefo-picking',
          label: 'TRAVAS NO PICKING',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'alert-octagon',
          metaInfo: 'Checagem picking x estoque'
        },
        {
          id: 'det-est-fefo-pulmao',
          label: 'TRAVAS NO PULMÃO',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'shield-alert',
          metaInfo: 'Checagem estoque x estoque'
        }
      ],
      'seg-est-fefo-risco': [
        {
          id: 'det-est-lotes-30d',
          label: 'LOTES CRÍTICOS < 30 DIAS',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'clock',
          metaInfo: 'Priorização de expedição imediata'
        },
        {
          id: 'det-est-lotes-15d',
          label: 'LOTES COM BLOQUEIO < 15 DIAS',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'alert-triangle',
          metaInfo: 'Itens em quarentena de validade'
        }
      ],
      'seg-est-dias-cobertura': [
        {
          id: 'det-est-curva-a',
          label: 'COBERTURA CURVA A (RGB/LATA)',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'award',
          metaInfo: 'Produtos de alto giro (Meta 6D)'
        },
        {
          id: 'det-est-curva-b',
          label: 'COBERTURA CURVA B/C',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'archive',
          metaInfo: 'Produtos médios e sazonais'
        }
      ],
      'seg-est-capacidade-bloco': [
        {
          id: 'det-est-ocupacao-paletes',
          label: 'OCUPAÇÃO DE PALETES NO ARMAZÉM',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'layers',
          metaInfo: 'Capacidade ocupada vs disponível'
        },
        {
          id: 'det-est-giro-pulmao',
          label: 'GIRO DO ESTOQUE PULMÃO',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'refresh-cw',
          metaInfo: 'Rotatividade de blocos'
        }
      ],
      'seg-absentismo': [
        {
          id: 'det-gc-folgas',
          label: 'ABSENTEÍSMO NÃO JUSTIFICADO',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'user-x',
          metaInfo: 'Ausências operacionais'
        },
        {
          id: 'det-gc-atestados',
          label: 'LICENÇAS / ATESTADOS',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'file-text',
          metaInfo: 'Afastamentos médicos'
        }
      ],
      'seg-aderencia': [
        {
          id: 'det-gc-jornada',
          label: 'CUMPRIMENTO DE HORÁRIOS',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'clock',
          metaInfo: 'Pontualidade e escalas'
        },
        {
          id: 'det-gc-reunioes',
          label: 'ADERÊNCIA REUNIÕES & DDS',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'users',
          metaInfo: 'Presença nos rituais DPO'
        }
      ],
      'seg-seguranca-incidentes': [
        {
          id: 'det-seg-quase-acidentes',
          label: 'REGISTROS DE QUASE ACIDENTES',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'shield-alert',
          metaInfo: 'Relatos preventivos de risco'
        },
        {
          id: 'det-seg-auditorias-dds',
          label: 'DDS & DIÁLOGOS DE SEGURANÇA',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'shield',
          metaInfo: 'Rituais diários de prevenção'
        }
      ],
      'seg-seguranca-epi': [
        {
          id: 'det-seg-epi-auditoria',
          label: 'AUDITORIA DE USO DE EPI',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'check-circle',
          metaInfo: 'Conformidade 100% de EPIs'
        },
        {
          id: 'det-seg-epi-bota-capacete',
          label: 'BOTAS, COLETES & LUVAS',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'user-check',
          metaInfo: 'Itens essenciais de proteção'
        }
      ]
    },
    level6: {
      'det-op-separacao': [
        {
          id: 'op-turno-1',
          label: 'TURNO 1 (MANHÃ)',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'sun',
          metaInfo: 'Equipe do 1º Turno'
        },
        {
          id: 'op-turno-2',
          label: 'TURNO 2 (TARDE/NOITE)',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'moon',
          metaInfo: 'Equipe do 2º Turno'
        }
      ],
      'det-op-movimentacao': [
        {
          id: 'op-mov-empilhadeiras',
          label: 'FROTA DE EMPILHADEIRAS',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'truck',
          metaInfo: 'Movimentação vertical e pulmão'
        },
        {
          id: 'op-mov-transpaleteiras',
          label: 'TRANSPALETEIRAS ELÉTRICAS',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'zap',
          metaInfo: 'Abastecimento dinâmico de picking'
        }
      ],
      'det-op-picking-linhas': [
        {
          id: 'op-picking-zona-a',
          label: 'ZONA A (ALTO GIRO)',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'zap',
          metaInfo: 'Linha rápida de separação'
        },
        {
          id: 'op-picking-zona-b',
          label: 'ZONA B (MÉDIO/BAIXO GIRO)',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'inbox',
          metaInfo: 'Linha padrão de separação'
        }
      ],
      'det-op-picking-caixas': [
        {
          id: 'op-picking-flow-rack',
          label: 'ESTAÇÃO FLOW RACK',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'layers',
          metaInfo: 'Separação fracionada'
        },
        {
          id: 'op-picking-palete-fechado',
          label: 'SEPARAÇÃO PALETE FECHADO',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'package',
          metaInfo: 'Expedição direta de carga'
        }
      ],
      'det-op-tmr-caminhoes': [
        {
          id: 'op-descarga-doca-1',
          label: 'DOCAS 1 & 2 (FÁBRICA)',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'truck',
          metaInfo: 'Descarga contínua de carretas'
        }
      ],
      'det-op-conferencia-paletes': [
        {
          id: 'op-conf-wms-rfid',
          label: 'CONFERÊNCIA COLETOR WMS',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'check-circle',
          metaInfo: 'Bipagem e validação sistêmica'
        }
      ],
      'det-op-tmr-rota': [
        {
          id: 'op-rota-docas-exp',
          label: 'DOCAS DE EXPEDIÇÃO ROTAS',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'truck',
          metaInfo: 'Carregamento de veículos de entrega'
        }
      ],
      'det-op-staging': [
        {
          id: 'op-staging-buffer',
          label: 'PÁTIO DE STAGING / BUFFER',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'layers',
          metaInfo: 'Paletes conferidos pré-carga'
        }
      ],
      'det-op-quebras-movimentacao': [
        {
          id: 'op-avaria-corredor',
          label: 'AVARIAS EM CORREDORES',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'alert-triangle',
          metaInfo: 'Quedas e choques operacionais'
        }
      ],
      'det-op-avarias-picking': [
        {
          id: 'op-avaria-montagem',
          label: 'AVARIAS NA MONTAGEM DE PALETE',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'alert-circle',
          metaInfo: 'Avarias manuais de conferência'
        }
      ],
      'det-op-recuperacao-latas': [
        {
          id: 'op-repack-latas',
          label: 'BANCADA DE REPACK LATAS',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'refresh-cw',
          metaInfo: 'Remontagem de pacotes e encolhimento'
        }
      ],
      'det-op-recuperacao-garrafas': [
        {
          id: 'op-repack-garrafas',
          label: 'BANCADA DE REPACK GARRAFEIRAS',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'refresh-cw',
          metaInfo: 'Troca de vasilhames quebrados'
        }
      ],
      'det-est-armazem-central': [
        {
          id: 'op-est-bloco-a',
          label: 'BLOCO A (PULMÃO PRINCIPAL)',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'archive',
          metaInfo: 'Armazenagem blocada'
        },
        {
          id: 'op-est-bloco-b',
          label: 'BLOCO B (INTERMEDIÁRIO)',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'package',
          metaInfo: 'Armazenagem secundária'
        }
      ],
      'det-est-picking-pos': [
        {
          id: 'op-est-pos-picking',
          label: 'POSIÇÕES DE PICKING ATIVAS',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'grid',
          metaInfo: 'Conformidade de estoques de picking'
        }
      ],
      'det-est-divergencia-valor': [
        {
          id: 'op-est-divergencia-auditoria',
          label: 'AUDITORIA DE INVENTÁRIO CÍCLICO',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'dollar-sign',
          metaInfo: 'Checagem de saldos WMS x Físico'
        }
      ],
      'det-est-ajustes-contabeis': [
        {
          id: 'op-est-ajuste-wms',
          label: 'REGISTROS DE AJUSTES WMS',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'file-text',
          metaInfo: 'Regularização de saldo'
        }
      ],
      'det-est-fefo-picking': [
        {
          id: 'op-est-fefo-rotina',
          label: 'AUDITORIA ROTINA FEFO',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'clipboard-check',
          metaInfo: 'Verificação diária do picking'
        },
        {
          id: 'op-est-fefo-retencao',
          label: 'BLOQUEIO PREVENTIVO',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'lock',
          metaInfo: 'Quarentena preventiva'
        }
      ],
      'det-est-fefo-pulmao': [
        {
          id: 'op-est-fefo-pulmao-rot',
          label: 'AUDITORIA PULMÃO FEFO',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'shield-alert',
          metaInfo: 'Controle de lotes nos blocos altos'
        }
      ],
      'det-est-lotes-30d': [
        {
          id: 'op-est-lote-30d-exp',
          label: 'PLANO DE SAÍDA PRIORITÁRIA',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'clock',
          metaInfo: 'Faturamento preferencial de lotes'
        }
      ],
      'det-est-lotes-15d': [
        {
          id: 'op-est-lote-15d-trava',
          label: 'BLOQUEIO DE SISTEMA < 15 DIAS',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'alert-octagon',
          metaInfo: 'Itens em análise de descarte/troca'
        }
      ],
      'det-est-curva-a': [
        {
          id: 'op-est-cobertura-lata',
          label: 'LINHA LATAS (META 6 DIAS)',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'check',
          metaInfo: 'Cobertura em dias de estoque'
        },
        {
          id: 'op-est-cobertura-rgb',
          label: 'LINHA RGB / RETORNÁVEL',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'refresh-ccw',
          metaInfo: 'Giro de garrafas retornáveis'
        }
      ],
      'det-est-curva-b': [
        {
          id: 'op-est-curva-b-esp',
          label: 'LINHA CERVEJAS ESPECIAIS',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'award',
          metaInfo: 'Controle de estoque médio giro'
        }
      ],
      'det-est-ocupacao-paletes': [
        {
          id: 'op-est-taxa-ocupacao',
          label: 'TAXA DE OCUPAÇÃO GERAL (%)',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'layers',
          metaInfo: 'Posições ocupadas / capacidade'
        }
      ],
      'det-est-giro-pulmao': [
        {
          id: 'op-est-taxa-giro',
          label: 'ÍNDICE DE ROTATIVIDADE',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'refresh-cw',
          metaInfo: 'Giro médio em dias'
        }
      ],
      'det-gc-folgas': [
        {
          id: 'op-gc-armazem',
          label: 'EQUIPE OPERACIONAL ARMAZÉM',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'users',
          metaInfo: 'Operadores e ajudantes'
        },
        {
          id: 'op-gc-transporte',
          label: 'EQUIPE LOGÍSTICA / EXPEDIÇÃO',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'truck',
          metaInfo: 'Conferentes e motoristas'
        }
      ],
      'det-gc-atestados': [
        {
          id: 'op-gc-atestados-medicos',
          label: 'REGISTROS MÉDICOS / ATESTADOS',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'file-text',
          metaInfo: 'Controle de saúde ocupacional'
        }
      ],
      'det-gc-jornada': [
        {
          id: 'op-gc-dds-5s',
          label: 'ROTINAS DPO & 5S',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'award',
          metaInfo: 'Auditoria de rituais'
        }
      ],
      'det-gc-reunioes': [
        {
          id: 'op-gc-rituais-dpo',
          label: 'RITUAIS DIÁRIOS & GCOM',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'calendar',
          metaInfo: 'Reuniões de alinhamento DPO'
        }
      ],
      'det-seg-quase-acidentes': [
        {
          id: 'op-seg-relatos-quase',
          label: 'REGISTRO DE QUASE ACIDENTES',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'shield-alert',
          metaInfo: 'Tratamento de desvios'
        }
      ],
      'det-seg-auditorias-dds': [
        {
          id: 'op-seg-auditoria-dds-diario',
          label: 'DDS OPERAÇÃO & EXPEDIÇÃO',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'shield',
          metaInfo: 'Diálogos diários de segurança'
        }
      ],
      'det-seg-epi-auditoria': [
        {
          id: 'op-seg-auditoria-epi-100',
          label: 'CHECKLIST 100% USO EPI',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'check-circle',
          metaInfo: 'Fiscalização contínua de EPIs'
        }
      ],
      'det-seg-epi-bota-capacete': [
        {
          id: 'op-seg-equipamentos-epi',
          label: 'KITS DE SEGURANÇA OPERACIONAL',
          value: 0,
          volume: 0,
          percentage: 0,
          iconName: 'user-check',
          metaInfo: 'Botas bico aço, óculos e coletes'
        }
      ]
    },
    level7: {
      'op-turno-1': [
        {
          id: 'sku-op-01',
          label: 'SKOL LAGER 350ML LATA',
          skuCode: '78901',
          value: 0,
          volume: 0,
          percentage: 0,
          metaInfo: 'SKU Curva A'
        },
        {
          id: 'sku-op-02',
          label: 'GUARANÁ ANTARCTICA 2L PET',
          skuCode: '78902',
          value: 0,
          volume: 0,
          percentage: 0,
          metaInfo: 'SKU Refrigerante'
        }
      ],
      'op-turno-2': [
        {
          id: 'sku-op-03',
          label: 'BRAHMA CHOPP 350ML LATA',
          skuCode: '78903',
          value: 0,
          volume: 0,
          percentage: 0,
          metaInfo: 'SKU Curva A'
        }
      ],
      'op-picking-zona-a': [
        {
          id: 'sku-op-04',
          label: 'BRAHMA CHOPP 350ML',
          skuCode: '78904',
          value: 0,
          volume: 0,
          percentage: 0,
          metaInfo: 'SKU Alto Giro'
        },
        {
          id: 'sku-op-05',
          label: 'BUDWEISER LATA 350ML',
          skuCode: '78905',
          value: 0,
          volume: 0,
          percentage: 0,
          metaInfo: 'SKU Premium'
        }
      ],
      'op-est-bloco-a': [
        {
          id: 'sku-est-01',
          label: 'CORONA EXTRA 330ML LONG NECK',
          skuCode: '78906',
          value: 0,
          volume: 0,
          percentage: 0,
          metaInfo: 'Palete Pulmão - Bloco A'
        },
        {
          id: 'sku-est-02',
          label: 'SPATEN 350ML LATA SLEEK',
          skuCode: '78907',
          value: 0,
          volume: 0,
          percentage: 0,
          metaInfo: 'Palete Pulmão - Bloco A'
        },
        {
          id: 'sku-est-03',
          label: 'ANTARCTICA ORIGINAL 600ML RGB',
          skuCode: '78908',
          value: 0,
          volume: 0,
          percentage: 0,
          metaInfo: 'Garrafeira Retornável'
        }
      ],
      'op-est-bloco-b': [
        {
          id: 'sku-est-04',
          label: 'STELLA ARTOIS 330ML LN',
          skuCode: '78909',
          value: 0,
          volume: 0,
          percentage: 0,
          metaInfo: 'Estoque Intermediário'
        },
        {
          id: 'sku-est-05',
          label: 'PEPSI BLACK 350ML LATA',
          skuCode: '78910',
          value: 0,
          volume: 0,
          percentage: 0,
          metaInfo: 'Refrigerante Zero'
        }
      ],
      'op-est-fefo-rotina': [
        {
          id: 'sku-est-06',
          label: 'BEATS SENSES 269ML LATA',
          skuCode: '78911',
          value: 0,
          volume: 0,
          percentage: 0,
          metaInfo: 'Controle de Lote FEFO'
        }
      ],
      'op-est-cobertura-lata': [
        {
          id: 'sku-est-07',
          label: 'BRAHMA CHOPP 269ML',
          skuCode: '78912',
          value: 0,
          volume: 0,
          percentage: 0,
          metaInfo: 'Cobertura 6.0 dias'
        }
      ],
      'op-gc-armazem': [
        {
          id: 'sku-gc-01',
          label: 'OPERADORES DE EMPILHADEIRA',
          skuCode: 'REG-001',
          value: 0,
          volume: 0,
          percentage: 0,
          metaInfo: 'Escala 100% Presente'
        },
        {
          id: 'sku-gc-02',
          label: 'AJUDANTES DE CARGA / DESCARGA',
          skuCode: 'REG-002',
          value: 0,
          volume: 0,
          percentage: 0,
          metaInfo: 'Escala 100% Presente'
        },
        {
          id: 'sku-gc-03',
          label: 'CONFERENTES DE EXPEDIÇÃO',
          skuCode: 'REG-003',
          value: 0,
          volume: 0,
          percentage: 0,
          metaInfo: 'Escala 100% Presente'
        }
      ],
      'op-mov-empilhadeiras': [
        {
          id: 'sku-mov-01',
          label: 'EMPILHADEIRAS TOYOTA 2.5T',
          skuCode: 'EQ-001',
          value: 0,
          volume: 0,
          percentage: 0,
          metaInfo: 'Checklist diário e horímetro'
        }
      ],
      'op-mov-transpaleteiras': [
        {
          id: 'sku-mov-02',
          label: 'TRANSPALETEIRAS STILL 2.0T',
          skuCode: 'EQ-002',
          value: 0,
          volume: 0,
          percentage: 0,
          metaInfo: 'Bateria e tração OK'
        }
      ],
      'op-picking-flow-rack': [
        {
          id: 'sku-flow-01',
          label: 'STELLA GLACIER 330ML',
          skuCode: '78920',
          value: 0,
          volume: 0,
          percentage: 0,
          metaInfo: 'Linha Fracionada'
        }
      ],
      'op-picking-palete-fechado': [
        {
          id: 'sku-pal-01',
          label: 'SKOL 350ML PALETE FECHADO (96 CXS)',
          skuCode: '78921',
          value: 0,
          volume: 0,
          percentage: 0,
          metaInfo: 'Expedição Direta'
        }
      ],
      'op-descarga-doca-1': [
        {
          id: 'sku-doca-01',
          label: 'RECEBIMENTO CARRETA AMBEV FÁBRICA',
          skuCode: 'DOCA-01',
          value: 0,
          volume: 0,
          percentage: 0,
          metaInfo: 'Conferência de Lote e Doca'
        }
      ],
      'op-conf-wms-rfid': [
        {
          id: 'sku-wms-01',
          label: 'COLETORES ZEBRA TC26',
          skuCode: 'WMS-01',
          value: 0,
          volume: 0,
          percentage: 0,
          metaInfo: 'Acuracidade de Leitura 100%'
        }
      ],
      'op-rota-docas-exp': [
        {
          id: 'sku-rota-01',
          label: 'CARREGAMENTO CAMINHÃO VW 17-230',
          skuCode: 'ROTA-01',
          value: 0,
          volume: 0,
          percentage: 0,
          metaInfo: 'Saída no Horário DPO'
        }
      ],
      'op-staging-buffer': [
        {
          id: 'sku-stg-01',
          label: 'PALETES PRONTOS BOX 01 A 05',
          skuCode: 'STG-01',
          value: 0,
          volume: 0,
          percentage: 0,
          metaInfo: 'Aguardando encoste de veículo'
        }
      ],
      'op-avaria-corredor': [
        {
          id: 'sku-av-01',
          label: 'REGISTRO DE AVARIA EM BLOCO 03',
          skuCode: 'AV-01',
          value: 0,
          volume: 0,
          percentage: 0,
          metaInfo: 'Lançamento imediato de quebra'
        }
      ],
      'op-avaria-montagem': [
        {
          id: 'sku-av-02',
          label: 'GARRAFEIRA 600ML AVARIADA NO PICKING',
          skuCode: 'AV-02',
          value: 0,
          volume: 0,
          percentage: 0,
          metaInfo: 'Vasilhame trincado/quebrado'
        }
      ],
      'op-repack-latas': [
        {
          id: 'sku-rep-01',
          label: 'PACKS RECUPERADOS SPATEN 350ML',
          skuCode: 'REP-01',
          value: 0,
          volume: 0,
          percentage: 0,
          metaInfo: 'Reembalado e lacrado'
        }
      ],
      'op-repack-garrafas': [
        {
          id: 'sku-rep-02',
          label: 'CAIXAS RECUPERADAS ORIGINAL 600ML',
          skuCode: 'REP-02',
          value: 0,
          volume: 0,
          percentage: 0,
          metaInfo: 'Remontagem de caixa completa'
        }
      ],
      'op-est-pos-picking': [
        {
          id: 'sku-est-pos-01',
          label: 'POSIÇÃO PICKING 01-A-01 SKOL',
          skuCode: 'POS-01',
          value: 0,
          volume: 0,
          percentage: 0,
          metaInfo: 'Status: 100% Abastecido'
        }
      ],
      'op-est-divergencia-auditoria': [
        {
          id: 'sku-est-div-01',
          label: 'CONTAGEM CÍCLICA BLOCO A',
          skuCode: 'AUD-01',
          value: 0,
          volume: 0,
          percentage: 0,
          metaInfo: 'Divergência 0,00%'
        }
      ],
      'op-est-ajuste-wms': [
        {
          id: 'sku-est-aj-01',
          label: 'LOG DE AJUSTES MENSAIS WMS',
          skuCode: 'LOG-01',
          value: 0,
          volume: 0,
          percentage: 0,
          metaInfo: 'Ajuste de inventário'
        }
      ],
      'op-est-fefo-pulmao-rot': [
        {
          id: 'sku-est-pul-01',
          label: 'LOTE PULMÃO BUDWEISER 350ML',
          skuCode: 'FEFO-01',
          value: 0,
          volume: 0,
          percentage: 0,
          metaInfo: 'Validade: 180 dias'
        }
      ],
      'op-est-lote-30d-exp': [
        {
          id: 'sku-est-exp-01',
          label: 'LOTE CRÍTICO BEATS 269ML (25 DIAS)',
          skuCode: 'EXP-01',
          value: 0,
          volume: 0,
          percentage: 0,
          metaInfo: 'Prioridade 1 de faturamento'
        }
      ],
      'op-est-lote-15d-trava': [
        {
          id: 'sku-est-trv-01',
          label: 'LOTE BLOQUEADO SKOL LATA (12 DIAS)',
          skuCode: 'TRV-01',
          value: 0,
          volume: 0,
          percentage: 0,
          metaInfo: 'Bloqueado no WMS'
        }
      ],
      'op-est-curva-b-esp': [
        {
          id: 'sku-est-esp-01',
          label: 'COLORADO RIBEIRÃO LAGER 600ML',
          skuCode: '78930',
          value: 0,
          volume: 0,
          percentage: 0,
          metaInfo: 'Estoque de 7 dias'
        }
      ],
      'op-est-taxa-ocupacao': [
        {
          id: 'sku-est-oc-01',
          label: 'PAINEL OCUPAÇÃO 967 POSIÇÕES',
          skuCode: 'OC-01',
          value: 0,
          volume: 0,
          percentage: 0,
          metaInfo: 'Taxa atual: 84.5%'
        }
      ],
      'op-est-taxa-giro': [
        {
          id: 'sku-est-giro-01',
          label: 'ÍNDICE DPO GIRO 5.8 DIAS',
          skuCode: 'GIRO-01',
          value: 0,
          volume: 0,
          percentage: 0,
          metaInfo: 'Dentro da meta de 6D'
        }
      ],
      'op-gc-atestados-medicos': [
        {
          id: 'sku-gc-at-01',
          label: 'RELATÓRIO SESMT ATESTADOS',
          skuCode: 'SESMT-01',
          value: 0,
          volume: 0,
          percentage: 0,
          metaInfo: 'Índice de Afastamento < 1%'
        }
      ],
      'op-gc-rituais-dpo': [
        {
          id: 'sku-gc-rit-01',
          label: 'ATA DE REUNIÃO MATINAL DPO',
          skuCode: 'RIT-01',
          value: 0,
          volume: 0,
          percentage: 0,
          metaInfo: 'Quórum 100%'
        }
      ],
      'op-seg-relatos-quase': [
        {
          id: 'sku-seg-01',
          label: 'RELATO DE QUASE ACIDENTE BLOCO B',
          skuCode: 'QA-01',
          value: 0,
          volume: 0,
          percentage: 0,
          metaInfo: 'Tratativa de barreira física'
        }
      ],
      'op-seg-auditoria-dds-diario': [
        {
          id: 'sku-seg-02',
          label: 'TEMA DDS: DIREÇÃO DEFENSIVA & EMPILHADEIRA',
          skuCode: 'DDS-01',
          value: 0,
          volume: 0,
          percentage: 0,
          metaInfo: '100% Participação da equipe'
        }
      ],
      'op-seg-auditoria-epi-100': [
        {
          id: 'sku-seg-03',
          label: 'CHECKLIST 100% AUDITORIA SESMT',
          skuCode: 'EPI-01',
          value: 0,
          volume: 0,
          percentage: 0,
          metaInfo: 'Conformidade total no turno'
        }
      ],
      'op-seg-equipamentos-epi': [
        {
          id: 'sku-seg-04',
          label: 'ESTOQUE DE EPIs E REPOSIÇÃO',
          skuCode: 'EPI-02',
          value: 0,
          volume: 0,
          percentage: 0,
          metaInfo: 'Kits completos disponíveis'
        }
      ]
    }
  }
};




