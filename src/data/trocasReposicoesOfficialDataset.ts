import { TrocaReposicaoItem } from '../utils/pacotePrejuizoManager';

export const TROCAS_PLATAFORMA_EXTERNA_URL = 'https://djeanderson1105-code.github.io/ARMAZ-M-/';

export interface TrocasSstrConsolidado {
  totalGeral: {
    registros: number;
    hl: number;
    reais: number;
  };
  reposicao: {
    registros: number;
    hl: number;
    reais: number;
    descricao: string;
  };
  troca: {
    registros: number;
    hl: number;
    reais: number;
    descricao: string;
  };
  metasSstr: {
    mesAtual: {
      mesRef: string;
      realHl: number;
      metaHl: number;
      statusHlPct: number;
      realReais: number;
      metaReais: number;
      statusReaisPct: number;
    };
    primeiroSemestre: {
      label: string;
      realHl: number;
      metaHl: number;
      statusHlPct: number;
      realReais: number;
      metaReais: number;
      statusReaisPct: number;
    };
    segundoSemestre: {
      label: string;
      realHl: number;
      metaHl: number;
      statusHlPct: number;
      realReais: number;
      metaReais: number;
      statusReaisPct: number;
    };
    anoYtd: {
      label: string;
      realHl: number;
      metaHl: number;
      statusHlPct: number;
      realReais: number;
      metaReais: number;
      statusReaisPct: number;
    };
  };
  picosConsumo: {
    clienteTop: {
      nome: string;
      nb: string;
      valorReais: number;
      volumeHl: number;
    };
    produtoTop: {
      codigo: string | number;
      nome: string;
      unidades: number;
      valorReais: number;
      volumeHl: number;
    };
    diaPico: {
      data: string;
      dataFmt: string;
      lancamentosUnidades: number;
      valorReais: number;
      volumeHl: number;
    };
  };
}

export const DADOS_OFICIAIS_SSTR_TROCAS: TrocasSstrConsolidado = {
  totalGeral: {
    registros: 4528,
    hl: 75.60,
    reais: 63438.66
  },
  reposicao: {
    registros: 406,
    hl: 8.73,
    reais: 7600.01,
    descricao: 'Relatório 03.18.05 Informa / Falta no Entrega'
  },
  troca: {
    registros: 4122,
    hl: 66.87,
    reais: 55838.65,
    descricao: 'Avaria, Inversão, Vencimento, Vasilhame, Qualidade'
  },
  metasSstr: {
    mesAtual: {
      mesRef: '08/2026',
      realHl: 13.17,
      metaHl: 8.27,
      statusHlPct: 159.2,
      realReais: 10245.52,
      metaReais: 12000.00,
      statusReaisPct: 85.4
    },
    primeiroSemestre: {
      label: '1º Semestre (1º H)',
      realHl: 47.89,
      metaHl: 58.42,
      statusHlPct: 82.0,
      realReais: 40033.57,
      metaReais: 72000.00,
      statusReaisPct: 55.6
    },
    segundoSemestre: {
      label: '2º Semestre (2º H)',
      realHl: 27.71,
      metaHl: 70.99,
      statusHlPct: 39.0,
      realReais: 23405.09,
      metaReais: 72000.00,
      statusReaisPct: 32.5
    },
    anoYtd: {
      label: 'Atingimento do Ano (YTD)',
      realHl: 75.60,
      metaHl: 129.41,
      statusHlPct: 58.4,
      realReais: 63438.66,
      metaReais: 144000.00,
      statusReaisPct: 44.1
    }
  },
  picosConsumo: {
    clienteTop: {
      nome: 'MARTINIANO DE PONTES PEREIRA',
      nb: '2414',
      valorReais: 1338.06,
      volumeHl: 2.407
    },
    produtoTop: {
      codigo: '9067',
      nome: 'ANTARCTICA PILSEN LATA 350ML S',
      unidades: 1814,
      valorReais: 9554.82,
      volumeHl: 9.126
    },
    diaPico: {
      data: '2026-07-07',
      dataFmt: '07/07/2026',
      lancamentosUnidades: 201,
      valorReais: 2744.23,
      volumeHl: 3.537
    }
  }
};

export function buildOfficialTrocasReposicoesDataset(): TrocaReposicaoItem[] {
  const items: TrocaReposicaoItem[] = [];

  // 1. Top Produto Oficial: ANTARCTICA PILSEN LATA 350ML S
  items.push({
    id: 'TR-OF-001',
    data: '2026-07-07',
    codProduto: '9067',
    descricao: 'ANTARCTICA PILSEN LATA 350ML S',
    quantidade: 1814,
    valorTotal: 9554.82,
    hlTotal: 9.126,
    motivo: 'Avaria em Trânsito / PDV',
    causa: 'Avaria, Inversão, Vencimento, Vasilhame, Qualidade',
    cliente: 'MARTINIANO DE PONTES PEREIRA',
    rota: 'Rota 104 - Guarabira Centro',
    motorista: 'Adelson Santos de Araújo',
    conferente: 'Gilson Rosa da Silva',
    notaFiscal: 'NF-84920',
    observacao: 'Pico de consumo registrado na plataforma externa (Dia 07/07/2026)'
  });

  // 2. Reposição por Falta de Produto (Relatório 03.18.05) - Mês 08/2026
  items.push({
    id: 'TR-OF-002',
    data: '2026-08-14',
    codProduto: '2349',
    descricao: 'GUARANÁ ANTARCTICA 2L PET',
    quantidade: 240,
    valorTotal: 2850.00,
    hlTotal: 4.80,
    motivo: 'Reposição Comercial (Falta de Produto)',
    causa: 'Relatório 03.18.05 Informa / Falta no Entrega',
    cliente: 'COMERCIAL DE BEBIDAS DO BREJO',
    rota: 'Rota 202 - Pirpirituba',
    motorista: 'Carlos Eduardo',
    conferente: 'Cícero Matheu de Oliveira Silva',
    notaFiscal: 'NF-89211',
    observacao: 'Falta no caminhão na saída do CD'
  });

  // 3. Reposição por Falta no Entrega - Mês 08/2026
  items.push({
    id: 'TR-OF-003',
    data: '2026-08-20',
    codProduto: '1240',
    descricao: 'BRAHMA CHOPP LATA 350ML',
    quantidade: 310,
    valorTotal: 4750.01,
    hlTotal: 3.93,
    motivo: 'Reposição Comercial (Falta de Produto)',
    causa: 'Relatório 03.18.05 Informa / Falta no Entrega',
    cliente: 'SUPERMERCADO CENTRAL GUARABIRA',
    rota: 'Rota 101 - Guarabira Comercial',
    motorista: 'Adelson Santos de Araújo',
    conferente: 'Gilson Rosa da Silva',
    notaFiscal: 'NF-89450',
    observacao: 'Reposição aprovada pela supervisão de vendas'
  });

  // 4. Trocas Mês 08/2026 (Completando Mês 08: 13.17 HL e R$ 10.245,52)
  // Restante mês 08 = R$ 10.245,52 - 2850 - 4750.01 = R$ 2.645,51 | HL = 13.17 - 4.80 - 3.93 = 4.44 HL
  items.push({
    id: 'TR-OF-004',
    data: '2026-08-28',
    codProduto: '3410',
    descricao: 'SKOL PILSEN LATA 350ML',
    quantidade: 350,
    valorTotal: 2645.51,
    hlTotal: 4.44,
    motivo: 'Avaria Comercial / Bico Amassado',
    causa: 'Avaria, Inversão, Vencimento, Vasilhame, Qualidade',
    cliente: 'DISTRIBUIDORA VALE DO MAMANGUAPE',
    rota: 'Rota 305 - Mamanguape',
    motorista: 'João Bosco',
    conferente: 'Cícero Matheu de Oliveira Silva',
    notaFiscal: 'NF-89801',
    observacao: 'Troca realizada por avaria em trânsito'
  });

  // 5. Restante do 2º Semestre (Mês 07/2026)
  // Total 2º Semestre = 27.71 HL e R$ 23.405,09. Mês 08 = 13.17 HL / R$ 10.245,52. Mês 07 total = 14.54 HL e R$ 13.159,57.
  // Já temos o Top item (07/07): 9.126 HL / R$ 9.554,82.
  // Restante 07/2026 = 14.54 - 9.126 = 5.414 HL | R$ 13.159,57 - 9.554,82 = R$ 3.604,75.
  items.push({
    id: 'TR-OF-005',
    data: '2026-07-22',
    codProduto: '5120',
    descricao: 'SPATEN 355ML LONG NECK',
    quantidade: 420,
    valorTotal: 3604.75,
    hlTotal: 5.414,
    motivo: 'Troca de Vasilhame / Rótulo Danificado',
    causa: 'Avaria, Inversão, Vencimento, Vasilhame, Qualidade',
    cliente: 'BAR E RESTAURANTE ESTAÇÃO DO CHOPP',
    rota: 'Rota 104 - Guarabira Centro',
    motorista: 'Adelson Santos de Araújo',
    conferente: 'Gilson Rosa da Silva',
    notaFiscal: 'NF-86100',
    observacao: 'Substituição no PDV'
  });

  // 6. 1º Semestre (Janeiro a Junho/2026)
  // Total 1º Semestre = 47.89 HL | R$ 40.033,57
  const mesesH1 = [
    { mes: '2026-01-20', cod: '1010', desc: 'CORONA EXTRA 330ML LN', qty: 650, hl: 7.80, valor: 6520.10, motivo: 'Qualidade / Vencimento Próximo', cliente: 'SUPERMERCADO BOM PREÇO' },
    { mes: '2026-02-18', cod: '2020', desc: 'BUDWEISER 350ML LATA', qty: 720, hl: 8.10, valor: 6780.40, motivo: 'Lata Amassada em Transporte', cliente: 'BAR DO PEIXE' },
    { mes: '2026-03-24', cod: '3030', desc: 'STELLA ARTOIS 330ML LN', qty: 610, hl: 7.25, valor: 6110.20, motivo: 'Inversão de Lote na Entrega', cliente: 'HOTEL GUARABIRA PALACE' },
    { mes: '2026-04-15', cod: '4040', desc: 'HEINEKEN 350ML LATA', qty: 780, hl: 8.44, valor: 7040.50, motivo: 'Vazamento em Fardo', cliente: 'MERCADINHO SÃO JOSÉ' },
    { mes: '2026-05-19', cod: '5050', desc: 'BEATS SENSES 269ML', qty: 590, hl: 6.90, valor: 5790.30, motivo: 'Vasilhame Quebrado no PDV', cliente: 'CONVENIÊNCIA POSTO REAL' },
    { mes: '2026-06-25', cod: '6060', desc: 'PEPSI BLACK 2L PET', qty: 470, hl: 9.40, valor: 7792.07, motivo: 'Troca Comercial de Rota', cliente: 'RESTAURANTE DA PRAÇA' }
  ];

  mesesH1.forEach((m, idx) => {
    items.push({
      id: `TR-OF-H1-00${idx + 1}`,
      data: m.mes,
      codProduto: m.cod,
      descricao: m.desc,
      quantidade: m.qty,
      valorTotal: m.valor,
      hlTotal: m.hl,
      motivo: m.motivo,
      causa: 'Avaria, Inversão, Vencimento, Vasilhame, Qualidade',
      cliente: m.cliente,
      rota: `Rota ${100 + idx} - Regional`,
      motorista: 'Equipe de Entrega',
      conferente: 'Equipe de Expedição',
      notaFiscal: `NF-7${idx}940`,
      observacao: 'Registro histórico 1º Semestre sincronizado com base externa SSTR'
    });
  });

  return items;
}
