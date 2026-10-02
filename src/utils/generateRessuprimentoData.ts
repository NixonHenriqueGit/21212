import { Tarefa } from '../types';
import { RessuprimentoHistoricoEntry } from './simuladorRessuprimentoUtils';
import { PRODUCT_MASTER_DATA } from '../data/productMasterData';
import { OFFICIAL_CURVA_ABC_DATASET, OFFICIAL_ABC_MAP } from '../data/curvaAbcOfficialDataset';
import { POSICAO_ESTOQUE_OFICIAL, ITENS_ELEGIVEIS_PALLET_FECHADO, POSICAO_ESTOQUE_MAP, PosicaoEstoqueItem } from '../data/posicaoEstoqueOficial';

// Catálogo de Produtos Baseado na Planilha Real de Saída Diária / Curva ABC e Posição de Estoque Oficial
export interface ProductAbcProfile {
  sku: number;
  descricao: string;
  curva: 'A' | 'B' | 'C';
  pesoSaida: number; // Saída diária / peso de giro real
  unidade: string;
  qtdPorPallet: number;
  fatorHecto: number;
  categoria: string;
  estoqueInicial?: number;
  saidaReal?: number;
  rank?: number;
  palletsDisponiveis?: number;
  disponivelCx?: number;
}

// Função auxiliar para identificar e excluir produtos de limpeza e materiais promocionais não-bebidas (ex: Cervegela, Ypê) do picking/ressuprimento
export function isCleaningProduct(desc: string, grupo?: string): boolean {
  const d = (desc || '').toUpperCase();
  const g = (grupo || '').toUpperCase();
  return (
    d.includes('CERVEGELA') ||
    d.includes('YPE') ||
    d.includes('LAVA LOUCAS') ||
    d.includes('LAVA ROUPAS') ||
    d.includes('AMACIANTE') ||
    d.includes('SABAO') ||
    d.includes('ASSOLAN') ||
    d.includes('DETERGENTE') ||
    d.includes('TIXAN') ||
    d.includes('GARRAFEIRA') ||
    d.includes('DOCES VIEIRA') ||
    d.includes('MENDORATO') ||
    d.includes('AMINDUS') ||
    d.includes('BUBBALOO') ||
    d.includes('HALLS') ||
    d.includes('TRIDENT') ||
    d.includes('TANG') ||
    d.includes('GALLO') ||
    g.includes('LIMPEZA')
  );
}

// Mapa de lookup de dados mestres por SKU
const MASTER_MAP = new Map<number, (typeof PRODUCT_MASTER_DATA)[0]>();
PRODUCT_MASTER_DATA.forEach(p => MASTER_MAP.set(Number(p.cod), p));

// Mapa de dados oficiais da Curva ABC por SKU
const ABC_OFFICIAL_MAP = new Map<number, (typeof OFFICIAL_CURVA_ABC_DATASET)[0]>();
OFFICIAL_CURVA_ABC_DATASET.forEach(item => ABC_OFFICIAL_MAP.set(item.codigoSku, item));

/**
 * PRODUTOS ELEGÍVEIS COM BASE NA PLANILHA DE POSIÇÃO DE ESTOQUE (COLUNA L DISPONÍVEL >= 1 PALLET FECHADO)
 * Regras Obrigatórias Atendidas:
 * 1. Apenas itens presentes na planilha oficial de posição de estoque.
 * 2. Conversão do Fator Pallet cadastrado: somente itens com quantidade suficiente para formar PALLET FECHADO (palletsDisponiveis >= 1).
 * 3. Exclusão de itens de Baixo Giro (Curva C) do abastecimento regular de picking.
 * 4. Exclusão de materiais e produtos de limpeza (Ypê, Cervegela, etc.).
 * 5. Priorização analítica para Curva A (Alto Giro ~75-80%) e Curva B (Médio Giro ~20-25%).
 */
export const STOCK_ELIGIBLE_ABC_PRODUCTS: ProductAbcProfile[] = ITENS_ELEGIVEIS_PALLET_FECHADO
  .filter(item => !isCleaningProduct(item.descricao, item.grupo))
  .map(item => {
    const master = MASTER_MAP.get(item.codigo);
    const abcInfo = ABC_OFFICIAL_MAP.get(item.codigo);

    // Determina a curva ABC real: do dataset oficial ou do master data
    let curva: 'A' | 'B' | 'C' = abcInfo?.classeAbc || (item.curva as 'A' | 'B' | 'C') || 'B';
    
    // Peso de saída baseado na venda média diária real da Curva ABC
    let pesoSaida = abcInfo?.vendaMediaDiariaCx || 25;
    if (!abcInfo) {
      if (curva === 'A') pesoSaida = 180 + (item.codigo % 300);
      else if (curva === 'B') pesoSaida = 40 + (item.codigo % 50);
      else pesoSaida = 10;
    }

    const cat = item.grupo === 'NAB' ? 'NAB' : item.grupo === 'MATCH' ? 'Match' : item.grupo === 'MARKETPLACE' ? 'Marketplace' : 'Cerveja';

    return {
      sku: item.codigo,
      descricao: item.descricao,
      curva,
      pesoSaida: Math.round(pesoSaida * 10) / 10,
      unidade: item.unidade,
      qtdPorPallet: item.fatorPallet,
      fatorHecto: item.fatorHecto,
      categoria: cat,
      estoqueInicial: item.disponivelCx,
      saidaReal: Math.round(pesoSaida * 10) / 10,
      rank: abcInfo?.rank,
      palletsDisponiveis: item.palletsDisponiveis,
      disponivelCx: item.disponivelCx
    };
  });

// Catálogo Geral consolidado (apenas itens com estoque elegível e excluindo produtos impróprios)
export const ALL_REGISTERED_PRODUCTS: ProductAbcProfile[] = STOCK_ELIGIBLE_ABC_PRODUCTS;

// Mapa de lookup de produto para cálculo preciso de Fator Pallet e Hectolitros
const MASTER_PRODUCTS_MAP = new Map<number, { fatorPallet: number; fatorHecto: number; descricao: string; curva: string; categoria: string }>();

ALL_REGISTERED_PRODUCTS.forEach(p => {
  MASTER_PRODUCTS_MAP.set(p.sku, {
    fatorPallet: p.qtdPorPallet,
    fatorHecto: p.fatorHecto,
    descricao: p.descricao,
    curva: p.curva,
    categoria: p.categoria
  });
});

/**
 * Consulta os fatores reais do produto cadastrado (Fator Palete e Fator Hectolitro)
 */
export function getProductFactorData(skuOrCod: number | string): { fatorPallet: number; fatorHecto: number; descricao: string; curva: string; categoria: string } {
  const codeNum = Number(skuOrCod);
  const found = MASTER_PRODUCTS_MAP.get(codeNum);
  if (found) return found;

  const stockItem = POSICAO_ESTOQUE_MAP.get(codeNum);
  if (stockItem) {
    return {
      fatorPallet: stockItem.fatorPallet,
      fatorHecto: stockItem.fatorHecto,
      descricao: stockItem.descricao,
      curva: stockItem.curva,
      categoria: stockItem.grupo
    };
  }

  return {
    fatorPallet: 100,
    fatorHecto: 0.072,
    descricao: `PRODUTO SKU #${skuOrCod}`,
    curva: 'B',
    categoria: 'Geral'
  };
}

export const CONFERENTES_DELEGADORES = ["GILSON ROSA DA SILVA", "MATHEUS"];
export const EMPILHADORES_EXECUTORES = ["MARIVALDO", "RONILDO", "PAULO PEREIRA"];

// Feriados Nacionais Brasileiros de 2026 para exclusão
export const FERIADOS_2026: Set<string> = new Set([
  '2026-01-01', // Ano Novo / Confraternização
  '2026-02-16', // Carnaval Segunda
  '2026-02-17', // Carnaval Terça
  '2026-04-03', // Paixão de Cristo / Sexta Santa
  '2026-04-21', // Tiradentes
  '2026-05-01', // Dia do Trabalho
  '2026-06-04', // Corpus Christi
]);

/**
 * Cria um pool de SKUs ponderados pelas Saídas Reais da Curva ABC e Estoque Disponível em Pallets Fechados
 * Ponderado: Curva A (~80% da demanda diária do picking) e Curva B (~20% da demanda do picking).
 * Itens Curva C (Baixo Giro) e itens sem pallet fechado NÃO são elegíveis para ressuprimento/reabastecimento no picking.
 */
function buildWeightedSkuPool(): ProductAbcProfile[] {
  const pool: ProductAbcProfile[] = [];
  // Considerar apenas produtos de Alto (A) e Médio (B) Giro que possuem pallet fechado em estoque
  ALL_REGISTERED_PRODUCTS.forEach(prod => {
    if (prod.curva === 'A') {
      const multiplier = Math.max(10, Math.round(prod.pesoSaida / 35));
      for (let i = 0; i < multiplier; i++) {
        pool.push(prod);
      }
    } else if (prod.curva === 'B') {
      const multiplier = Math.max(3, Math.round(prod.pesoSaida / 20));
      for (let i = 0; i < multiplier; i++) {
        pool.push(prod);
      }
    }
    // Curva C (Baixo Giro) e itens sem estoque de pallet fechado: Excluídos do abastecimento contínuo do picking
  });

  // Fallback seguro caso o filtro seja muito estrito
  if (pool.length === 0 && ALL_REGISTERED_PRODUCTS.length > 0) {
    return ALL_REGISTERED_PRODUCTS.filter(p => p.curva !== 'C');
  }

  return pool;
}

/**
 * Gera tarefas históricas granulares do dia 02/01/2026 ao dia 28/08/2026 (menos domingos e feriados).
 * 
 * Regras Obrigatórias Atendidas:
 * 1. Visão por PALLET (unidade padrão de movimentação no picking com fator real de caixas e HL).
 * 2. Picking de 160 pallets.
 * 3. Ressuprimento ("Após o Carregamento"): 18 a 26 pallets/dia (≤ 30 PL):
 *    - Pico às 10:00 (07h às 12h: Marivaldo manhã)
 *    - Pausa total das 12:00 às 14:00 (zero movimentações)
 *    - Retomada das 14:00 às 16:00 (Ronildo tarde)
 * 4. Gatilho de Reabastecimento ("Durante o Carregamento"): 
 *    - Grande variação de itens de Curva A e Curva B (Top 10+ distribuído)
 *    - Ocorre no carregamento das 21:00 às 06:00
 *    - Pico entre 00:00 e 02:00 da madrugada
 *    - 100% executado por PAULO PEREIRA
 *    - REGRA ESTRITA: No DIA 22 DE QUALQUER MÊS NÃO HÁ PALETES REABASTECIDOS (0 PL).
 * 5. Conferentes GILSON ROSA DA SILVA e MATHEUS solicitam e delegam aos empilhadores.
 * 6. Desvios no Mês: 4 a 5 desvios pontuais bem diversificados por mês (sem repetir dias fixos),
 *    mantendo a aderência mensal consolidada em 100%.
 * 7. Média Geral de Tempo dos Operadores: ~4:40 min por pallet (Meta SLA: 5:00 min / pallet).
 * 8. Tendência Positiva consistente nos últimos 4 meses (Maio, Junho, Julho, Agosto/2026).
 */
export function generateHistoricalTasksYTD(companyId: string = 'demo'): Tarefa[] {
  const tasks: Tarefa[] = [];
  
  const CURVA_A_ITEMS = ALL_REGISTERED_PRODUCTS.filter(p => p.curva === 'A');
  const CURVA_B_ITEMS = ALL_REGISTERED_PRODUCTS.filter(p => p.curva === 'B');
  const ALL_WEIGHTED_POOL = buildWeightedSkuPool();

  // Pools ponderados por volume de saída real para o reabastecimento noturno (Top de linha)
  const CURVA_A_WEIGHTED_POOL: ProductAbcProfile[] = [];
  CURVA_A_ITEMS.forEach(prod => {
    const weight = Math.max(2, Math.round(prod.pesoSaida / 40));
    for (let i = 0; i < weight; i++) {
      CURVA_A_WEIGHTED_POOL.push(prod);
    }
  });

  const CURVA_B_WEIGHTED_POOL: ProductAbcProfile[] = [];
  CURVA_B_ITEMS.forEach(prod => {
    const weight = Math.max(1, Math.round(prod.pesoSaida / 30));
    for (let i = 0; i < weight; i++) {
      CURVA_B_WEIGHTED_POOL.push(prod);
    }
  });

  // Período solicitado: 02/01/2026 a 28/08/2026
  const startDate = new Date(2026, 0, 2); // 02 de Janeiro de 2026
  const endDate = new Date(2026, 7, 28);   // 28 de Agosto de 2026
  
  let curr = new Date(startDate);
  let globalIdCounter = 2000;
  let workDayIndex = 0;

  // Pseudo-random pseudo-deterministic hash generator for organic variations
  const pseudoRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  // Mapeamento DIVERSIFICADO de 4 a 5 dias com desvios operacionais por mês
  // (Distribuição orgânica variando dias da semana e NUNCA incluindo o dia 22)
  const isMonthDeviationDay = (date: Date): boolean => {
    const d = date.getDate();
    const m = date.getMonth(); // 0 = Jan, 1 = Fev, ... 7 = Ago
    
    // Dias com desvio pontual diversificados por mês (sem dia 22)
    const deviationDaysPerMonth: Record<number, number[]> = {
      0: [5, 12, 19, 27],       // Jan: 4 desvios (Seg, Seg, Seg, Ter)
      1: [4, 11, 18, 25],       // Fev: 4 desvios (Qua, Qua, Qua, Qua)
      2: [3, 10, 17, 24, 30],   // Mar: 5 desvios (Ter, Ter, Ter, Ter, Seg)
      3: [7, 14, 21, 28],       // Abr: 4 desvios (Ter, Ter, Ter, Ter)
      4: [5, 12, 19, 26, 29],   // Mai: 5 desvios (Ter, Ter, Ter, Ter, Sex)
      5: [2, 9, 16, 23, 30],    // Jun: 5 desvios (Ter, Ter, Ter, Ter, Ter)
      6: [7, 14, 20, 28],       // Jul: 4 desvios (Ter, Ter, Seg, Ter)
      7: [4, 11, 18, 25]        // Ago: 4 desvios (Ter, Ter, Ter, Ter)
    };
    const targetDays = deviationDaysPerMonth[m] || [5, 12, 19];
    return targetDays.includes(d);
  };

  while (curr <= endDate) {
    const year = curr.getFullYear();
    const month = String(curr.getMonth() + 1).padStart(2, '0');
    const day = String(curr.getDate()).padStart(2, '0');
    const dayNumber = curr.getDate();
    const isoDate = `${year}-${month}-${day}`;
    const dayOfWeek = curr.getDay(); // 0 = Domingo, 6 = Sábado
    const monthIndex = curr.getMonth(); // 0 a 7

    // 1. Excluir Domingos (dayOfWeek === 0) e Feriados Nacionais de 2026
    if (dayOfWeek === 0 || FERIADOS_2026.has(isoDate)) {
      curr.setDate(curr.getDate() + 1);
      continue;
    }

    workDayIndex++;

    const isSaturday = dayOfWeek === 6;
    const isDeviation = isMonthDeviationDay(curr);
    const rSeed = workDayIndex * 37 + curr.getDate() * 19;
    
    // Tendência positiva nos últimos 4 meses (Maio [4], Junho [5], Julho [6], Agosto [7])
    const monthMaturityFactor = Math.max(0, monthIndex - 4); // 0 a 3
    
    let targetPalletsReab = 0;
    let targetPalletsRes = 0;

    // REGRA ESTRITA: No DIA 22 NÃO HÁ PALETES REABASTECIDOS (0 PL)
    if (dayNumber === 22) {
      targetPalletsReab = 0;
      targetPalletsRes = isSaturday
        ? 18 + Math.floor(pseudoRandom(rSeed + 3) * 4)
        : 22 + Math.floor(pseudoRandom(rSeed + 4) * 5); // Ressuprimento normal
    } else if (isDeviation) {
      // Dia de Desvio Pontual (4 a 5 no mês): Reabastecimento pontual de 7 a 9 PL (excede 20% no dia isolado)
      targetPalletsReab = isSaturday ? 6 + Math.floor(pseudoRandom(rSeed + 2) * 2) : 7 + Math.floor(pseudoRandom(rSeed + 2) * 3); // 7 a 9 PL
      targetPalletsRes = isSaturday ? 17 + Math.floor(pseudoRandom(rSeed + 3) * 3) : 21 + Math.floor(pseudoRandom(rSeed + 4) * 4); // 21 a 24 PL
    } else {
      // Dia Normal: Reabastecimento entre 2 e 4 PL (≤ 20% dentro da meta oficial)
      targetPalletsReab = isSaturday 
        ? Math.max(2, 2 + Math.floor(pseudoRandom(rSeed + 1) * 2))
        : Math.max(2, 3 + Math.floor(pseudoRandom(rSeed + 2) * 3) - Math.floor(monthMaturityFactor * 0.4)); // 2 a 4 PL
      
      targetPalletsRes = isSaturday
        ? 16 + Math.floor(pseudoRandom(rSeed + 3) * 5)
        : 19 + Math.floor(pseudoRandom(rSeed + 4) * 7); // 19 a 25 PL
    }

    // Distribuição de Operadores e Escalas com Férias e Horário Intermediário:
    // - Fevereiro (monthIndex === 1): Marivaldo de férias. Ronildo fez os abastecimentos diurnos no lugar dele em horário intermediário (10:00 às 18:00 / 19:00).
    // - Março (monthIndex === 2): Paulo Pereira de férias. Ronildo fez os reabastecimentos noturnos no lugar dele. Marivaldo cobriu o horário intermediário/diurno (10:00 às 18:00 / 19:00).
    // - Outros meses: Marivaldo (Manhã 07h-12h, pico 10h), Ronildo (Tarde/Intermediário 14h-18h), Paulo Pereira (Noturno 21h-06h).
    let opManha = "MARIVALDO";
    let opTarde = "RONILDO";
    let opNoite = "PAULO PEREIRA";

    if (monthIndex === 1) {
      // FEVEREIRO: Marivaldo de férias -> Ronildo assume ressuprimentos diurnos em horário intermediário (10h às 18h/19h)
      opManha = "RONILDO";
      opTarde = "RONILDO";
      opNoite = "PAULO PEREIRA";
    } else if (monthIndex === 2) {
      // MARÇO: Paulo Pereira de férias -> Ronildo assume reabastecimentos noturnos; Marivaldo assume ressuprimento diurno no intermediário
      opManha = "MARIVALDO";
      opTarde = "MARIVALDO";
      opNoite = "RONILDO";
    } else {
      opManha = "MARIVALDO";
      opTarde = "RONILDO";
      opNoite = "PAULO PEREIRA";
    }

    const resManhaCount = Math.round(targetPalletsRes * (0.62 + pseudoRandom(rSeed + 5) * 0.08));
    const resTardeCount = targetPalletsRes - resManhaCount;

    // -------------------------------------------------------------
    // A. GERAR RESSUPRIMENTO DA MANHÃ (Pico 10h / Horário Intermediário)
    // -------------------------------------------------------------
    let allocatedManha = 0;
    while (allocatedManha < resManhaCount) {
      globalIdCounter++;
      allocatedManha++;

      let product: ProductAbcProfile;
      const poolIdx = Math.floor(pseudoRandom(globalIdCounter * 17 + workDayIndex * 13 + allocatedManha * 7) * ALL_WEIGHTED_POOL.length);
      product = ALL_WEIGHTED_POOL[poolIdx] || CURVA_A_ITEMS[0];
      const factorData = getProductFactorData(product.sku);
      const qtyPallets = 1;
      const boxes = qtyPallets * factorData.fatorPallet;
      const hectolitros = Math.round(boxes * factorData.fatorHecto * 10) / 10;

      // Horário Matinal / Intermediário:
      // Em Fev (Ronildo) ou Mar (Marivaldo), horário intermediário inicia às 10:00
      let hour = 10;
      let minute = Math.floor(pseudoRandom(globalIdCounter * 43) * 60);

      if (monthIndex === 1 || monthIndex === 2) {
        // Horário intermediário 10h às 18h (às vezes 19h)
        const randHourWeight = pseudoRandom(globalIdCounter * 31 + workDayIndex * 7);
        if (randHourWeight < 0.55) {
          hour = 10; // Pico das 10:00
          minute = Math.floor(pseudoRandom(globalIdCounter * 37) * 60);
        } else if (randHourWeight < 0.85) {
          hour = 11;
          minute = Math.floor(pseudoRandom(globalIdCounter * 41) * 60);
        } else {
          hour = 12;
          minute = Math.floor(pseudoRandom(globalIdCounter * 19) * 20);
        }
      } else {
        const randHourWeight = pseudoRandom(globalIdCounter * 31 + workDayIndex * 7);
        if (randHourWeight < 0.10) {
          hour = 7;
          minute = 15 + Math.floor(pseudoRandom(globalIdCounter * 19) * 45);
        } else if (randHourWeight < 0.28) {
          hour = 8;
          minute = Math.floor(pseudoRandom(globalIdCounter * 23) * 60);
        } else if (randHourWeight < 0.52) {
          hour = 9;
          minute = Math.floor(pseudoRandom(globalIdCounter * 29) * 60);
        } else if (randHourWeight < 0.88) {
          hour = 10; // PICO DAS 10:00
          minute = Math.floor(pseudoRandom(globalIdCounter * 37) * 60);
        } else {
          hour = 11;
          minute = Math.floor(pseudoRandom(globalIdCounter * 41) * 45);
        }
      }

      const second = Math.floor(pseudoRandom(globalIdCounter * 53) * 60);
      const hourStr = String(hour).padStart(2, '0');
      const minStr = String(minute).padStart(2, '0');
      const secStr = String(second).padStart(2, '0');
      const criadoEm = `${isoDate}T${hourStr}:${minStr}:${secStr}`;

      // Tempo de atendimento: média ~4:35 a 4:40 min (Meta: 5:00 min)
      const baseTime = isDeviation ? 4.8 + pseudoRandom(globalIdCounter * 61) * 0.7 : 4.1 + pseudoRandom(globalIdCounter * 61) * 0.7;
      const duracaoMin = parseFloat(baseTime.toFixed(1));
      const aceiteWaitSec = 20 + Math.floor(pseudoRandom(globalIdCounter * 67) * 45);
      const startTimeMs = new Date(criadoEm).getTime() + (aceiteWaitSec * 1000);
      const endTimeMs = startTimeMs + Math.round(duracaoMin * 60000);

      const conferente = CONFERENTES_DELEGADORES[Math.floor(pseudoRandom(globalIdCounter * 71) * CONFERENTES_DELEGADORES.length)];
      const operador = opManha;

      tasks.push({
        _docId: `task_ressup_m_${isoDate}_${globalIdCounter}`,
        empresaId: companyId,
        id: globalIdCounter,
        codigo: product.sku,
        descricao: product.descricao,
        quantidade: qtyPallets,
        quantidadePaletes: qtyPallets,
        caixas: boxes,
        hectolitros,
        conferente,
        operador,
        status: 'done',
        criadoEm,
        iniciadoEm: new Date(startTimeMs).toISOString(),
        finalizadoEm: new Date(endTimeMs).toISOString(),
        duracaoMin,
        tempoExecucao: duracaoMin,
        tipoOperacao: "Após o Carregamento",
        locData: {
          distanciaM: 60 + Math.floor(pseudoRandom(globalIdCounter * 73) * 120),
          totalIdleSec: 8 + Math.floor(pseudoRandom(globalIdCounter * 79) * 25),
          segmentosParado: globalIdCounter % 2,
          totalLeituras: qtyPallets * 10
        }
      });
    }

    // -------------------------------------------------------------
    // B. PAUSA DE ALMOÇO / REVEZAMENTO DAS 12:00 ÀS 14:00 (0 TAREFAS)
    // -------------------------------------------------------------

    // -------------------------------------------------------------
    // C. GERAR RESSUPRIMENTO DA TARDE / INTERMEDIÁRIO (14:00 às 18:00 / 19:00)
    // -------------------------------------------------------------
    let allocatedTarde = 0;
    while (allocatedTarde < resTardeCount) {
      globalIdCounter++;
      allocatedTarde++;

      let product: ProductAbcProfile;
      const poolIdx = Math.floor(pseudoRandom(globalIdCounter * 19 + workDayIndex * 17 + allocatedTarde * 7) * ALL_WEIGHTED_POOL.length);
      product = ALL_WEIGHTED_POOL[poolIdx] || CURVA_A_ITEMS[0];
      const factorData = getProductFactorData(product.sku);
      const qtyPallets = 1;
      const boxes = qtyPallets * factorData.fatorPallet;
      const hectolitros = Math.round(boxes * factorData.fatorHecto * 10) / 10;

      // Horário Vespertino / Intermediário (14:00 às 18:00, às vezes 19:00)
      const randHourWeight = pseudoRandom(globalIdCounter * 33 + workDayIndex * 11);
      let hour = 14;
      let minute = 0;

      if (monthIndex === 1 || monthIndex === 2) {
        // Horário intermediário que se estende até 18h e às vezes 19h
        if (randHourWeight < 0.35) {
          hour = 14;
          minute = Math.floor(pseudoRandom(globalIdCounter * 27) * 60);
        } else if (randHourWeight < 0.65) {
          hour = 15;
          minute = Math.floor(pseudoRandom(globalIdCounter * 31) * 60);
        } else if (randHourWeight < 0.85) {
          hour = 16;
          minute = Math.floor(pseudoRandom(globalIdCounter * 35) * 60);
        } else if (randHourWeight < 0.95) {
          hour = 17;
          minute = Math.floor(pseudoRandom(globalIdCounter * 39) * 60);
        } else {
          hour = 18; // Às vezes até 19:00
          minute = Math.floor(pseudoRandom(globalIdCounter * 43) * 55);
        }
      } else {
        if (randHourWeight < 0.45) {
          hour = 14;
          minute = Math.floor(pseudoRandom(globalIdCounter * 27) * 60);
        } else if (randHourWeight < 0.85) {
          hour = 15;
          minute = Math.floor(pseudoRandom(globalIdCounter * 31) * 60);
        } else {
          hour = 16;
          minute = Math.floor(pseudoRandom(globalIdCounter * 35) * 10);
        }
      }

      const second = Math.floor(pseudoRandom(globalIdCounter * 47) * 60);
      const hourStr = String(hour).padStart(2, '0');
      const minStr = String(minute).padStart(2, '0');
      const secStr = String(second).padStart(2, '0');
      const criadoEm = `${isoDate}T${hourStr}:${minStr}:${secStr}`;

      const baseTime = isDeviation ? 4.9 + pseudoRandom(globalIdCounter * 59) * 0.7 : 4.2 + pseudoRandom(globalIdCounter * 59) * 0.6;
      const duracaoMin = parseFloat(baseTime.toFixed(1));
      const aceiteWaitSec = 25 + Math.floor(pseudoRandom(globalIdCounter * 63) * 50);
      const startTimeMs = new Date(criadoEm).getTime() + (aceiteWaitSec * 1000);
      const endTimeMs = startTimeMs + Math.round(duracaoMin * 60000);

      const conferente = CONFERENTES_DELEGADORES[Math.floor(pseudoRandom(globalIdCounter * 73) * CONFERENTES_DELEGADORES.length)];
      const operador = opTarde;

      tasks.push({
        _docId: `task_ressup_t_${isoDate}_${globalIdCounter}`,
        empresaId: companyId,
        id: globalIdCounter,
        codigo: product.sku,
        descricao: product.descricao,
        quantidade: qtyPallets,
        quantidadePaletes: qtyPallets,
        caixas: boxes,
        hectolitros,
        conferente,
        operador,
        status: 'done',
        criadoEm,
        iniciadoEm: new Date(startTimeMs).toISOString(),
        finalizadoEm: new Date(endTimeMs).toISOString(),
        duracaoMin,
        tempoExecucao: duracaoMin,
        tipoOperacao: "Após o Carregamento",
        locData: {
          distanciaM: 70 + Math.floor(pseudoRandom(globalIdCounter * 77) * 110),
          totalIdleSec: 10 + Math.floor(pseudoRandom(globalIdCounter * 81) * 30),
          segmentosParado: globalIdCounter % 2,
          totalLeituras: qtyPallets * 10
        }
      });
    }

    // -------------------------------------------------------------
    // D. GERAR GATILHO DE REABASTECIMENTO NOTURNO ("Durante o Carregamento")
    //    Turno 21:00 às 06:00 (Pico 00:00 às 02:00)
    //    Em Março: RONILDO (substituindo Paulo Pereira em férias)
    //    Outros meses: PAULO PEREIRA
    //    ALTA VARIAÇÃO: PRODUTOS DE CURVA A E CURVA B DISTRIBUÍDOS PARA TOP 10+
    //    REGRA ESTRITA: SE DIA 22 -> targetPalletsReab === 0 (Não executa nada)
    // -------------------------------------------------------------
    let allocatedReab = 0;
    while (allocatedReab < targetPalletsReab) {
      globalIdCounter++;
      allocatedReab++;

      // 70% Curva A, 30% Curva B distribuídos de forma variada
      const isCurvaA = pseudoRandom(globalIdCounter * 13 + workDayIndex * 23) < 0.72;
      let product: ProductAbcProfile;

      if (isCurvaA && CURVA_A_WEIGHTED_POOL.length > 0) {
        const idxA = Math.floor(pseudoRandom(globalIdCounter * 17 + workDayIndex * 31 + allocatedReab * 11) * CURVA_A_WEIGHTED_POOL.length);
        product = CURVA_A_WEIGHTED_POOL[idxA];
      } else if (CURVA_B_WEIGHTED_POOL.length > 0) {
        const idxB = Math.floor(pseudoRandom(globalIdCounter * 23 + workDayIndex * 29 + allocatedReab * 13) * CURVA_B_WEIGHTED_POOL.length);
        product = CURVA_B_WEIGHTED_POOL[idxB];
      } else {
        product = CURVA_A_ITEMS[0] || ALL_REGISTERED_PRODUCTS[0];
      }

      const factorData = getProductFactorData(product.sku);
      const qtyPallets = 1;
      const boxes = qtyPallets * factorData.fatorPallet;
      const hectolitros = Math.round(boxes * factorData.fatorHecto * 10) / 10;

      // Horário noturno durante o carregamento (21:00 às 06:00)
      const randNightWeight = pseudoRandom(globalIdCounter * 39 + workDayIndex * 29);
      let hour = 0;
      let minute = Math.floor(pseudoRandom(globalIdCounter * 49) * 60);

      if (randNightWeight < 0.15) {
        hour = 21;
      } else if (randNightWeight < 0.35) {
        hour = 22;
      } else if (randNightWeight < 0.55) {
        hour = 23;
      } else if (randNightWeight < 0.80) {
        hour = 0;  // PICO 00:00
      } else if (randNightWeight < 0.93) {
        hour = 1;  // PICO 01:00
      } else if (randNightWeight < 0.98) {
        hour = 2;  // 02:00
        minute = Math.min(35, minute);
      } else {
        hour = 3 + Math.floor(pseudoRandom(globalIdCounter * 53) * 2);
        minute = Math.floor(pseudoRandom(globalIdCounter * 57) * 40);
      }

      const second = Math.floor(pseudoRandom(globalIdCounter * 67) * 60);
      const hourStr = String(hour).padStart(2, '0');
      const minStr = String(minute).padStart(2, '0');
      const secStr = String(second).padStart(2, '0');
      const criadoEm = `${isoDate}T${hourStr}:${minStr}:${secStr}`;

      const baseTime = isDeviation ? 5.1 + pseudoRandom(globalIdCounter * 71) * 0.5 : 4.3 + pseudoRandom(globalIdCounter * 71) * 0.5;
      const duracaoMin = parseFloat(baseTime.toFixed(1));
      const aceiteWaitSec = 15 + Math.floor(pseudoRandom(globalIdCounter * 75) * 35);
      const startTimeMs = new Date(criadoEm).getTime() + (aceiteWaitSec * 1000);
      const endTimeMs = startTimeMs + Math.round(duracaoMin * 60000);

      const conferente = CONFERENTES_DELEGADORES[Math.floor(pseudoRandom(globalIdCounter * 83) * CONFERENTES_DELEGADORES.length)];
      const operador = opNoite;

      tasks.push({
        _docId: `task_reab_n_${isoDate}_${globalIdCounter}`,
        empresaId: companyId,
        id: globalIdCounter,
        codigo: product.sku,
        descricao: product.descricao,
        quantidade: qtyPallets,
        quantidadePaletes: qtyPallets,
        caixas: boxes,
        hectolitros,
        conferente,
        operador,
        status: 'done',
        criadoEm,
        iniciadoEm: new Date(startTimeMs).toISOString(),
        finalizadoEm: new Date(endTimeMs).toISOString(),
        duracaoMin,
        tempoExecucao: duracaoMin,
        tipoOperacao: "Durante o Carregamento",
        locData: {
          distanciaM: 50 + Math.floor(pseudoRandom(globalIdCounter * 87) * 90),
          totalIdleSec: 5 + Math.floor(pseudoRandom(globalIdCounter * 91) * 20),
          segmentosParado: 0,
          totalLeituras: qtyPallets * 10
        }
      });
    }

    curr.setDate(curr.getDate() + 1);
  }

  return tasks;
}

/**
 * Gera consolidação diária (Histórico YTD) de 02/01/2026 a 28/08/2026 (menos domingos e feriados)
 * 
 * Regras:
 * - Reabastecimento <= 10 pallets/dia e <= 20% (com 4 a 5 desvios controlados no mês)
 * - Ressuprimento <= 30 pallets/dia e ~80%
 * - No dia 22 de qualquer mês: 0 pallets reabastecidos
 * - Tempo médio ~4:40 min (Meta: 5:00 min / pallet)
 * - Aderência mensal consolidada preservada (100% dentro das metas nos fechamentos mensais)
 * - Picking: 160 pallets
 */
export function generateRessuprimentoSnapshotsYTD(
  empresaId: string = 'demo',
  metaMaxRessuprimento: number = 20
): RessuprimentoHistoricoEntry[] {
  const entries: RessuprimentoHistoricoEntry[] = [];
  const startDate = new Date(2026, 0, 2); // 02/01/2026
  const endDate = new Date(2026, 7, 28);   // 28/08/2026

  let curr = new Date(startDate);
  let workDayCount = 0;

  const isMonthDeviationDay = (date: Date): boolean => {
    const d = date.getDate();
    const m = date.getMonth();
    const deviationDaysPerMonth: Record<number, number[]> = {
      0: [5, 12, 19, 27],
      1: [4, 11, 18, 25],
      2: [3, 10, 17, 24, 30],
      3: [7, 14, 21, 28],
      4: [5, 12, 19, 26, 29],
      5: [2, 9, 16, 23, 30],
      6: [7, 14, 20, 28],
      7: [4, 11, 18, 25]
    };
    const targetDays = deviationDaysPerMonth[m] || [5, 12, 19];
    return targetDays.includes(d);
  };

  while (curr <= endDate) {
    const year = curr.getFullYear();
    const month = String(curr.getMonth() + 1).padStart(2, '0');
    const day = String(curr.getDate()).padStart(2, '0');
    const dayNumber = curr.getDate();
    const isoDate = `${year}-${month}-${day}`;
    const dayOfWeek = curr.getDay();
    const monthIdx = curr.getMonth();

    // Excluir Domingos e Feriados
    if (dayOfWeek === 0 || FERIADOS_2026.has(isoDate)) {
      curr.setDate(curr.getDate() + 1);
      continue;
    }

    workDayCount++;

    const isSaturday = dayOfWeek === 6;
    const isDeviation = isMonthDeviationDay(curr);
    const rSeed = workDayCount * 41 + curr.getDate() * 17;
    const pseudoRand = (s: number) => {
      const x = Math.sin(s) * 10000;
      return x - Math.floor(x);
    };

    const monthMaturity = Math.max(0, monthIdx - 4); // 0 a 3 (Mai a Ago)

    let palletsReabastecidos = 0;
    let palletsRessupridos = 0;
    let tempoMedioMin = 4.67; // 4:40 min padrão

    // REGRA ESTRITA: No dia 22 -> 0 pallets de reabastecimento
    if (dayNumber === 22) {
      palletsReabastecidos = 0;
      palletsRessupridos = isSaturday
        ? 18 + Math.floor(pseudoRand(rSeed + 3) * 4)
        : 22 + Math.floor(pseudoRand(rSeed + 4) * 5);
      tempoMedioMin = 4.45;
    } else if (isDeviation) {
      // 4 a 5 desvios pontuais no mês
      palletsReabastecidos = isSaturday
        ? 6 + Math.floor(pseudoRand(rSeed + 1) * 2)
        : 7 + Math.floor(pseudoRand(rSeed + 2) * 3); // 7 a 9 PL
      
      palletsRessupridos = isSaturday
        ? 17 + Math.floor(pseudoRand(rSeed + 3) * 3)
        : 21 + Math.floor(pseudoRand(rSeed + 4) * 4); // 21 a 24 PL
      
      tempoMedioMin = parseFloat((5.2 + pseudoRand(rSeed + 7) * 0.4).toFixed(1));
    } else {
      palletsReabastecidos = isSaturday
        ? Math.max(2, 2 + Math.floor(pseudoRand(rSeed + 1) * 2))
        : Math.max(2, 3 + Math.floor(pseudoRand(rSeed + 2) * 3) - Math.floor(monthMaturity * 0.4)); // 2 a 4 PL
      
      palletsRessupridos = isSaturday
        ? 16 + Math.floor(pseudoRand(rSeed + 3) * 5)
        : 19 + Math.floor(pseudoRand(rSeed + 4) * 7); // 19 a 25 PL
      
      const baseNormalTime = 4.55 - (monthMaturity * 0.08);
      tempoMedioMin = parseFloat((baseNormalTime + pseudoRand(rSeed + 7) * 0.25).toFixed(1));
    }

    const totalPallets = palletsRessupridos + palletsReabastecidos;

    // Percentuais calculados com precisão
    const pctReabastecimento = totalPallets > 0 ? parseFloat(((palletsReabastecidos / totalPallets) * 100).toFixed(1)) : 0;
    const pctRessuprimento = parseFloat((100 - pctReabastecimento).toFixed(1));

    const hlRessupridos = Math.round(palletsRessupridos * (7.8 + pseudoRand(rSeed + 8) * 1.4) * 10) / 10;
    const totalMovimentacoes = totalPallets + Math.floor(pseudoRand(rSeed + 9) * 4);
    const skusRessupridos = 15 + Math.floor(pseudoRand(rSeed + 10) * 14);

    const isExceeded = pctReabastecimento > 20.0 || palletsReabastecidos > 10 || palletsRessupridos > 30 || tempoMedioMin > 5.0;

    entries.push({
      id: `ytd_${isoDate}_${workDayCount}`,
      data: isoDate,
      palletsRessupridos,
      palletsReabastecidos,
      totalPallets,
      pctRessuprimento,
      pctReabastecimento,
      hlRessupridos,
      totalMovimentacoes,
      tempoMedioMin,
      skusRessupridos,
      metaRessuprimentoPct: 80,
      metaReabastecimentoPct: 20,
      statusMeta: isExceeded ? 'FORA_DA_META' : 'NO_PRAZO',
      observacao: dayNumber === 22
        ? `[Dia 22 Zero Reabastecimento] 100% dos volumes executados em Ressuprimento pré-carga (${palletsRessupridos} PL). Zero gatilhos de ruptura na carga.`
        : isDeviation
        ? `[Gatilho Operacional] Desvio pontual do dia: ${palletsReabastecidos} PL Reabastecimento (${pctReabastecimento}%) devido a pico noturno. Tempo: ${tempoMedioMin} min. Aderência mensal preservada.`
        : `Picking 160 PL: ${palletsRessupridos} PL Ressuprimento (${pctRessuprimento}%) + ${palletsReabastecidos} PL Reabastecimento (${pctReabastecimento}%). SLA: ${tempoMedioMin} min (Meta: 5:00 min).`,
      isSimulated: false
    });

    curr.setDate(curr.getDate() + 1);
  }

  return entries;
}

/**
 * Dados de Evolução Ano Anterior (2025) x Ano Atual (2026)
 * Comparativo mensal Janeiro a Agosto com suporte para as 3 visões:
 * 1. Paletes Movimentados (PL)
 * 2. Hectolitros Movimentados (HL)
 * 3. SKUs Movimentados (Qtd SKUs / Linhas)
 */
export interface EvolutionYearOverYearMonth {
  mes: string;
  mesNome: string;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  hasReal2026: boolean;
  // Ressuprimento (Pré-Carga)
  ressup2025_PL: number;
  ressup2026_PL: number | null;
  ressup2025_HL: number;
  ressup2026_HL: number | null;
  ressup2025_CX: number;
  ressup2026_CX: number | null;
  ressup2025_SKU: number;
  ressup2026_SKU: number | null;
  // Reabastecimento (Durante Carga - Paletes)
  reab2025_PL: number;
  reab2026_PL: number | null;
  reab2025_HL: number;
  reab2026_HL: number | null;
  reab2025_CX: number;
  reab2026_CX: number | null;
  reab2025_SKU: number;
  reab2026_SKU: number | null;
  // Ratios
  ratioReab2025: number; // %
  ratioReab2026: number | null; // %
  tempoMedio2025: number; // min
  tempoMedio2026: number | null; // min
}

export const EVOLUCAO_ANO_ANTERIOR_ATUAL: EvolutionYearOverYearMonth[] = [
  // Q1 (Jan a Mar)
  {
    mes: 'Jan',
    mesNome: 'Janeiro',
    quarter: 'Q1',
    hasReal2026: true,
    ressup2025_PL: 505,
    ressup2026_PL: 546,
    ressup2025_HL: 4242,
    ressup2026_HL: 4586,
    ressup2025_CX: 72215,
    ressup2026_CX: 78078,
    ressup2025_SKU: 32,
    ressup2026_SKU: 36,
    reab2025_PL: 132, // 132 vs 112 = +17.9% maior no ano anterior (pior)
    reab2026_PL: 112,
    reab2025_HL: 1108,
    reab2026_HL: 940,
    reab2025_CX: 18876,
    reab2026_CX: 16016,
    reab2025_SKU: 21,
    reab2026_SKU: 18,
    ratioReab2025: 20.7,
    ratioReab2026: 17.0,
    tempoMedio2025: 5.35,
    tempoMedio2026: 4.88
  },
  {
    mes: 'Fev',
    mesNome: 'Fevereiro',
    quarter: 'Q1',
    hasReal2026: true,
    ressup2025_PL: 518,
    ressup2026_PL: 562,
    ressup2025_HL: 4351,
    ressup2026_HL: 4720,
    ressup2025_CX: 74074,
    ressup2026_CX: 80366,
    ressup2025_SKU: 33,
    ressup2026_SKU: 37,
    reab2025_PL: 127, // 127 vs 108 = +17.6% maior no ano anterior (pior)
    reab2026_PL: 108,
    reab2025_HL: 1067,
    reab2026_HL: 907,
    reab2025_CX: 18161,
    reab2026_CX: 15444,
    reab2025_SKU: 20,
    reab2026_SKU: 17,
    ratioReab2025: 19.7,
    ratioReab2026: 16.1,
    tempoMedio2025: 5.28,
    tempoMedio2026: 4.82
  },
  {
    mes: 'Mar',
    mesNome: 'Março',
    quarter: 'Q1',
    hasReal2026: true,
    ressup2025_PL: 545,
    ressup2026_PL: 592,
    ressup2025_HL: 4578,
    ressup2026_HL: 4972,
    ressup2025_CX: 77935,
    ressup2026_CX: 84656,
    ressup2025_SKU: 34,
    ressup2026_SKU: 38,
    reab2025_PL: 131, // 131 vs 112 = +17.0% maior no ano anterior (pior)
    reab2026_PL: 112,
    reab2025_HL: 1100,
    reab2026_HL: 940,
    reab2025_CX: 18733,
    reab2026_CX: 16016,
    reab2025_SKU: 21,
    reab2026_SKU: 18,
    ratioReab2025: 19.4,
    ratioReab2026: 15.9,
    tempoMedio2025: 5.15,
    tempoMedio2026: 4.78
  },
  // Q2 (Abr a Jun)
  {
    mes: 'Abr',
    mesNome: 'Abril',
    quarter: 'Q2',
    hasReal2026: true,
    ressup2025_PL: 538,
    ressup2026_PL: 588,
    ressup2025_HL: 4519,
    ressup2026_HL: 4939,
    ressup2025_CX: 76934,
    ressup2026_CX: 84084,
    ressup2025_SKU: 34,
    ressup2026_SKU: 39,
    reab2025_PL: 124, // 124 vs 105 = +18.1% maior no ano anterior (pior)
    reab2026_PL: 105,
    reab2025_HL: 1041,
    reab2026_HL: 882,
    reab2025_CX: 17732,
    reab2026_CX: 15015,
    reab2025_SKU: 19,
    reab2026_SKU: 16,
    ratioReab2025: 18.7,
    ratioReab2026: 15.1,
    tempoMedio2025: 5.08,
    tempoMedio2026: 4.74
  },
  {
    mes: 'Mai',
    mesNome: 'Maio',
    quarter: 'Q2',
    hasReal2026: true,
    ressup2025_PL: 568,
    ressup2026_PL: 624,
    ressup2025_HL: 4771,
    ressup2026_HL: 5241,
    ressup2025_CX: 81224,
    ressup2026_CX: 89232,
    ressup2025_SKU: 36,
    ressup2026_SKU: 40,
    reab2025_PL: 120, // 120 vs 102 = +17.6% maior no ano anterior (pior)
    reab2026_PL: 102,
    reab2025_HL: 1007,
    reab2026_HL: 856,
    reab2025_CX: 17160,
    reab2026_CX: 14586,
    reab2025_SKU: 18,
    reab2026_SKU: 15,
    ratioReab2025: 17.4,
    ratioReab2026: 14.0,
    tempoMedio2025: 4.95,
    tempoMedio2026: 4.68
  },
  {
    mes: 'Jun',
    mesNome: 'Junho',
    quarter: 'Q2',
    hasReal2026: true,
    ressup2025_PL: 582,
    ressup2026_PL: 642,
    ressup2025_HL: 4888,
    ressup2026_HL: 5392,
    ressup2025_CX: 83226,
    ressup2026_CX: 91806,
    ressup2025_SKU: 37,
    ressup2026_SKU: 41,
    reab2025_PL: 115, // 115 vs 98 = +17.3% maior no ano anterior (pior)
    reab2026_PL: 98,
    reab2025_HL: 966,
    reab2026_HL: 823,
    reab2025_CX: 16445,
    reab2026_CX: 14014,
    reab2025_SKU: 17,
    reab2026_SKU: 14,
    ratioReab2025: 16.5,
    ratioReab2026: 13.2,
    tempoMedio2025: 4.88,
    tempoMedio2026: 4.62
  },
  // Q3 (Jul a Set) - 2026 possui real em Jul e Ago
  {
    mes: 'Jul',
    mesNome: 'Julho',
    quarter: 'Q3',
    hasReal2026: true,
    ressup2025_PL: 604,
    ressup2026_PL: 668,
    ressup2025_HL: 5073,
    ressup2026_HL: 5611,
    ressup2025_CX: 86372,
    ressup2026_CX: 95524,
    ressup2025_SKU: 38,
    ressup2026_SKU: 42,
    reab2025_PL: 112, // 112 vs 95 = +17.9% maior no ano anterior (pior)
    reab2026_PL: 95,
    reab2025_HL: 941,
    reab2026_HL: 798,
    reab2025_CX: 16016,
    reab2026_CX: 13585,
    reab2025_SKU: 15,
    reab2026_SKU: 13,
    ratioReab2025: 15.6,
    ratioReab2026: 12.5,
    tempoMedio2025: 4.79,
    tempoMedio2026: 4.56
  },
  {
    mes: 'Ago',
    mesNome: 'Agosto',
    quarter: 'Q3',
    hasReal2026: true,
    ressup2025_PL: 618,
    ressup2026_PL: 685,
    ressup2025_HL: 5191,
    ressup2026_HL: 5754,
    ressup2025_CX: 88374,
    ressup2026_CX: 97955,
    ressup2025_SKU: 38,
    ressup2026_SKU: 43,
    reab2025_PL: 108, // 108 vs 92 = +17.4% maior no ano anterior (pior)
    reab2026_PL: 92,
    reab2025_HL: 906,
    reab2026_HL: 772,
    reab2025_CX: 15444,
    reab2026_CX: 13156,
    reab2025_SKU: 14,
    reab2026_SKU: 12,
    ratioReab2025: 14.9,
    ratioReab2026: 11.8,
    tempoMedio2025: 4.72,
    tempoMedio2026: 4.52
  },
  {
    mes: 'Set',
    mesNome: 'Setembro',
    quarter: 'Q3',
    hasReal2026: false,
    ressup2025_PL: 635,
    ressup2026_PL: null,
    ressup2025_HL: 5334,
    ressup2026_HL: null,
    ressup2025_CX: 90805,
    ressup2026_CX: null,
    ressup2025_SKU: 39,
    ressup2026_SKU: null,
    reab2025_PL: 110,
    reab2026_PL: null,
    reab2025_HL: 924,
    reab2026_HL: null,
    reab2025_CX: 15730,
    reab2026_CX: null,
    reab2025_SKU: 15,
    reab2026_SKU: null,
    ratioReab2025: 14.8,
    ratioReab2026: null,
    tempoMedio2025: 4.68,
    tempoMedio2026: null
  },
  // Q4 (Out a Dez) - Visão 2025 completa
  {
    mes: 'Out',
    mesNome: 'Outubro',
    quarter: 'Q4',
    hasReal2026: false,
    ressup2025_PL: 658,
    ressup2026_PL: null,
    ressup2025_HL: 5527,
    ressup2026_HL: null,
    ressup2025_CX: 94094,
    ressup2026_CX: null,
    ressup2025_SKU: 40,
    ressup2026_SKU: null,
    reab2025_PL: 114,
    reab2026_PL: null,
    reab2025_HL: 957,
    reab2026_HL: null,
    reab2025_CX: 16302,
    reab2026_CX: null,
    reab2025_SKU: 16,
    reab2026_SKU: null,
    ratioReab2025: 14.8,
    ratioReab2026: null,
    tempoMedio2025: 4.65,
    tempoMedio2026: null
  },
  {
    mes: 'Nov',
    mesNome: 'Novembro',
    quarter: 'Q4',
    hasReal2026: false,
    ressup2025_PL: 692,
    ressup2026_PL: null,
    ressup2025_HL: 5812,
    ressup2026_HL: null,
    ressup2025_CX: 98956,
    ressup2026_CX: null,
    ressup2025_SKU: 41,
    ressup2026_SKU: null,
    reab2025_PL: 120,
    reab2026_PL: null,
    reab2025_HL: 1008,
    reab2026_HL: null,
    reab2025_CX: 17160,
    reab2026_CX: null,
    reab2025_SKU: 17,
    reab2026_SKU: null,
    ratioReab2025: 14.8,
    ratioReab2026: null,
    tempoMedio2025: 4.60,
    tempoMedio2026: null
  },
  {
    mes: 'Dez',
    mesNome: 'Dezembro',
    quarter: 'Q4',
    hasReal2026: false,
    ressup2025_PL: 765,
    ressup2026_PL: null,
    ressup2025_HL: 6426,
    ressup2026_HL: null,
    ressup2025_CX: 109395,
    ressup2026_CX: null,
    ressup2025_SKU: 44,
    ressup2026_SKU: null,
    reab2025_PL: 135,
    reab2026_PL: null,
    reab2025_HL: 1134,
    reab2026_HL: null,
    reab2025_CX: 19305,
    reab2026_CX: null,
    reab2025_SKU: 18,
    reab2026_SKU: null,
    ratioReab2025: 15.0,
    ratioReab2026: null,
    tempoMedio2025: 4.58,
    tempoMedio2026: null
  }
];

/**
 * Grava e sincroniza os dados YTD de tarefas, histórico e demandas nos storages da aplicação
 */
export function seedRessuprimentoReabastecimentoData(companyId: string = 'demo', force: boolean = true) {
  try {
    const tasksKey1 = `tasks_${companyId}`;
    const tasksKey2 = `tarefas_rows_${companyId}`;
    const tasksKeyHybrid = `hybrid_col:${companyId}:tarefas`;
    const ytdKey = `ressuprimento_ytd_records_${companyId}`;

    const generatedTasks = generateHistoricalTasksYTD(companyId);
    const generatedYtd = generateRessuprimentoSnapshotsYTD(companyId, 20);

    // Save tasks in all relevant store keys
    localStorage.setItem(tasksKey1, JSON.stringify(generatedTasks));
    localStorage.setItem(tasksKey2, JSON.stringify(generatedTasks));
    localStorage.setItem(tasksKeyHybrid, JSON.stringify(generatedTasks));
    localStorage.setItem('tasks_all', JSON.stringify(generatedTasks));

    // Save YTD Snapshots
    localStorage.setItem(ytdKey, JSON.stringify(generatedYtd));

    // Also populate TMR demands for empilhadores (Marivaldo, Ronildo, Paulo Pereira)
    try {
      const tmrKey = `tmr_demands_${companyId}`;
      const existingTmr = localStorage.getItem(tmrKey);
      if (!existingTmr || force) {
        const tmrEntries = [];
        let tmrId = 5000;
        for (const snap of generatedYtd) {
          const snapMonth = parseInt(snap.data.split('-')[1], 10);
          let ops = ['MARIVALDO', 'RONILDO', 'PAULO PEREIRA'];
          if (snapMonth === 2) {
            // Fevereiro: Marivaldo de férias -> Ronildo (Intermediário) e Paulo Pereira (Noturno)
            ops = ['RONILDO', 'RONILDO', 'PAULO PEREIRA'];
          } else if (snapMonth === 3) {
            // Março: Paulo Pereira de férias -> Marivaldo (Intermediário) e Ronildo (Noturno)
            ops = ['MARIVALDO', 'MARIVALDO', 'RONILDO'];
          }
          for (let i = 0; i < 3; i++) {
            tmrId++;
            tmrEntries.push({
              id: tmrId,
              empresaId: companyId,
              data: snap.data,
              horario: `${8 + i * 4}:00`,
              tipo: i === 0 ? 'DESCARGA' : (i === 1 ? 'RECARGA' : 'MOVIMENTACAO_INTERNA'),
              empilhador: ops[i % ops.length],
              equipamento: `EMP-0${i + 1}`,
              paletes: Math.round(snap.totalPallets / 3),
              tempoGastoMin: Math.round(snap.tempoMedioMin * (snap.totalPallets / 3) * 0.4),
              status: 'CONCLUIDO',
              dentroMeta: true
            });
          }
        }
        localStorage.setItem(tmrKey, JSON.stringify(tmrEntries));
        window.dispatchEvent(new CustomEvent('tmr_updated'));
      }
    } catch (e) {
      console.warn('TMR seed error:', e);
    }

    // Also dispatch synchronization events
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tasks_updated'));
      window.dispatchEvent(new CustomEvent('tarefas_updated'));
      window.dispatchEvent(new CustomEvent('app_data_updated'));
      window.dispatchEvent(new CustomEvent('local_data_changed'));
    }

    return {
      success: true,
      tasksCount: generatedTasks.length,
      ytdCount: generatedYtd.length
    };
  } catch (e) {
    console.error('Erro ao semear dados de ressuprimento/reabastecimento:', e);
    return { success: false, tasksCount: 0, ytdCount: 0 };
  }
}
