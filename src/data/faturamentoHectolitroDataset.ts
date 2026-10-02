/**
 * DATASET OFICIAL: FATURAMENTO (R$) E VOLUME EM HECTOLITRO (HL)
 * Fonte: DRE Corporativa & Acompanhamento de Volume de Vendas 2025/2026
 * Imagens Oficiais:
 * - DRE Faturamento Bruto: R$ 77.300.445,70
 * - Volume Faturado 2026 (AUTO): 110.094,0 HL
 * - Volume Faturado 2025: 93.013,2 HL
 */

export interface MesFaturamentoVolume {
  id: string;
  mes: string;
  mesLabel: string;
  ano: number;
  faturamentoReais: number; // R$
  volumeHl2026: number;     // HL 2026 (AUTO)
  volumeHl2025: number;     // HL 2025
  isPicoCritico?: boolean;
  observacao?: string;
}

export const FATURAMENTO_VOLUME_MENSAL_OFICIAL: MesFaturamentoVolume[] = [
  {
    id: 'jan-2026',
    mes: 'JAN',
    mesLabel: 'Janeiro 2026',
    ano: 2026,
    faturamentoReais: 12957778.00,
    volumeHl2026: 12357.9,
    volumeHl2025: 13491.3,
    isPicoCritico: false
  },
  {
    id: 'fev-2026',
    mes: 'FEV',
    mesLabel: 'Fevereiro 2026',
    ano: 2026,
    faturamentoReais: 9677599.00,
    volumeHl2026: 10371.5,
    volumeHl2025: 11676.1,
    isPicoCritico: false
  },
  {
    id: 'mar-2026',
    mes: 'MAR',
    mesLabel: 'Março 2026',
    ano: 2026,
    faturamentoReais: 10893038.00,
    volumeHl2026: 12435.0,
    volumeHl2025: 10023.7,
    isPicoCritico: true,
    observacao: 'Pico Crítico de Volume / Operação'
  },
  {
    id: 'abr-2026',
    mes: 'ABR',
    mesLabel: 'Abril 2026',
    ano: 2026,
    faturamentoReais: 10058876.00,
    volumeHl2026: 13288.1,
    volumeHl2025: 11426.4,
    isPicoCritico: false
  },
  {
    id: 'mai-2026',
    mes: 'MAI',
    mesLabel: 'Maio 2026',
    ano: 2026,
    faturamentoReais: 9709534.00,
    volumeHl2026: 13077.8,
    volumeHl2025: 12501.8,
    isPicoCritico: false
  },
  {
    id: 'jun-2026',
    mes: 'JUN',
    mesLabel: 'Junho 2026',
    ano: 2026,
    faturamentoReais: 13246664.00,
    volumeHl2026: 16526.4,
    volumeHl2025: 13697.8,
    isPicoCritico: true,
    observacao: 'Pico Crítico de Volume / Festividades'
  },
  {
    id: 'jul-2026',
    mes: 'JUL',
    mesLabel: 'Julho 2026',
    ano: 2026,
    faturamentoReais: 10751838.00,
    volumeHl2026: 17911.3,
    volumeHl2025: 10923.4,
    isPicoCritico: false
  },
  {
    id: 'ago-2026',
    mes: 'AGO',
    mesLabel: 'Agosto 2026',
    ano: 2026,
    faturamentoReais: 3527692.28,
    volumeHl2026: 14126.0,
    volumeHl2025: 9272.7,
    isPicoCritico: false,
    observacao: 'Faturamento parcial / Fechamento em andamento'
  }
];

// Faturamento oficial reportado na DRE (linha total da imagem 1)
export const FATURAMENTO_TOTAL_DRE_OFICIAL = 77300445.70;

// Soma matemática das linhas mensais
export const FATURAMENTO_TOTAL_SOMA_MENSAL = FATURAMENTO_VOLUME_MENSAL_OFICIAL.reduce(
  (acc, curr) => acc + curr.faturamentoReais, 0
);

// Volume total 2026 (HL)
export const VOLUME_TOTAL_2026_HL = FATURAMENTO_VOLUME_MENSAL_OFICIAL.reduce(
  (acc, curr) => acc + curr.volumeHl2026, 0
);

// Volume total 2025 (HL)
export const VOLUME_TOTAL_2025_HL = FATURAMENTO_VOLUME_MENSAL_OFICIAL.reduce(
  (acc, curr) => acc + curr.volumeHl2025, 0
);

export interface DREFinanceiraPrejuizoCalculada {
  faturamentoBrutoTotal: number;
  volumeTotalHl: number;
  precoMedioBrutoHl: number;
  custoPrejuizoTotalReais: number;
  volumePrejuizoTotalHl: number;
  percentualPrejuizoSobreFaturamento: number;
  custoPrejuizoPorHl: number;
  faturamentoLiquidoRealizado: number;
  receitaLiquidaPorHl: number;
  meses: {
    id: string;
    mes: string;
    mesLabel: string;
    faturamentoBruto: number;
    volumeHl2026: number;
    volumeHl2025: number;
    precoMedioBrutoHl: number;
    prejuizoReais: number;
    prejuizoHl: number;
    pctPrejuizo: number;
    custoPrejuizoPorHl: number;
    faturamentoLiquido: number;
    receitaLiquidaPorHl: number;
    isPicoCritico?: boolean;
    observacao?: string;
  }[];
}

/**
 * Realiza o cálculo analítico completo consolidando o Faturamento (R$), Volume (HL)
 * e deduzindo os custos totais do Pacote Prejuízo para extrair o Custo por Hectolitro para a Revenda.
 */
export function calcularDreFinanceiraPrejuizo(
  custoPrejuizoTotalReais: number,
  volumePrejuizoTotalHl: number,
  prejuizoMensalMap?: Record<string, { reais: number; hl: number }>
): DREFinanceiraPrejuizoCalculada {
  const faturamentoBrutoTotal = FATURAMENTO_TOTAL_DRE_OFICIAL;
  const volumeTotalHl = VOLUME_TOTAL_2026_HL;
  const precoMedioBrutoHl = volumeTotalHl > 0 ? faturamentoBrutoTotal / volumeTotalHl : 0;
  
  const percentualPrejuizoSobreFaturamento = faturamentoBrutoTotal > 0
    ? (custoPrejuizoTotalReais / faturamentoBrutoTotal) * 100
    : 0;

  const custoPrejuizoPorHl = volumeTotalHl > 0
    ? custoPrejuizoTotalReais / volumeTotalHl
    : 0;

  const faturamentoLiquidoRealizado = faturamentoBrutoTotal - custoPrejuizoTotalReais;
  const receitaLiquidaPorHl = volumeTotalHl > 0
    ? faturamentoLiquidoRealizado / volumeTotalHl
    : 0;

  const meses = FATURAMENTO_VOLUME_MENSAL_OFICIAL.map(item => {
    // Proporção de perda mensal caso não haja rateio específico por mês
    let itemPrejuizoReais = 0;
    let itemPrejuizoHl = 0;

    if (prejuizoMensalMap && prejuizoMensalMap[item.mes]) {
      itemPrejuizoReais = prejuizoMensalMap[item.mes].reais;
      itemPrejuizoHl = prejuizoMensalMap[item.mes].hl;
    } else {
      // Distribuição proporcional baseada no volume do mês relativo ao total
      const pesoVolume = volumeTotalHl > 0 ? item.volumeHl2026 / volumeTotalHl : 0;
      itemPrejuizoReais = custoPrejuizoTotalReais * pesoVolume;
      itemPrejuizoHl = volumePrejuizoTotalHl * pesoVolume;
    }

    const precoMedioMes = item.volumeHl2026 > 0 ? item.faturamentoReais / item.volumeHl2026 : 0;
    const pctPrejuizoMes = item.faturamentoReais > 0 ? (itemPrejuizoReais / item.faturamentoReais) * 100 : 0;
    const custoPrejuizoPorHlMes = item.volumeHl2026 > 0 ? itemPrejuizoReais / item.volumeHl2026 : 0;
    const faturamentoLiquidoMes = item.faturamentoReais - itemPrejuizoReais;
    const receitaLiquidaPorHlMes = item.volumeHl2026 > 0 ? faturamentoLiquidoMes / item.volumeHl2026 : 0;

    return {
      id: item.id,
      mes: item.mes,
      mesLabel: item.mesLabel,
      faturamentoBruto: item.faturamentoReais,
      volumeHl2026: item.volumeHl2026,
      volumeHl2025: item.volumeHl2025,
      precoMedioBrutoHl: Math.round(precoMedioMes * 100) / 100,
      prejuizoReais: Math.round(itemPrejuizoReais * 100) / 100,
      prejuizoHl: Math.round(itemPrejuizoHl * 1000) / 1000,
      pctPrejuizo: Math.round(pctPrejuizoMes * 1000) / 1000,
      custoPrejuizoPorHl: Math.round(custoPrejuizoPorHlMes * 100) / 100,
      faturamentoLiquido: Math.round(faturamentoLiquidoMes * 100) / 100,
      receitaLiquidaPorHl: Math.round(receitaLiquidaPorHlMes * 100) / 100,
      isPicoCritico: item.isPicoCritico,
      observacao: item.observacao
    };
  });

  return {
    faturamentoBrutoTotal,
    volumeTotalHl,
    precoMedioBrutoHl: Math.round(precoMedioBrutoHl * 100) / 100,
    custoPrejuizoTotalReais: Math.round(custoPrejuizoTotalReais * 100) / 100,
    volumePrejuizoTotalHl: Math.round(volumePrejuizoTotalHl * 10000) / 10000,
    percentualPrejuizoSobreFaturamento: Math.round(percentualPrejuizoSobreFaturamento * 1000) / 1000,
    custoPrejuizoPorHl: Math.round(custoPrejuizoPorHl * 100) / 100,
    faturamentoLiquidoRealizado: Math.round(faturamentoLiquidoRealizado * 100) / 100,
    receitaLiquidaPorHl: Math.round(receitaLiquidaPorHl * 100) / 100,
    meses
  };
}
